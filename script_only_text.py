import re
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE = "https://naruto-arenawiki.weebly.com/"

# ---------- helpers: ids / texto ----------

def normalize_id(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"[^\w\s-]", "", s, flags=re.UNICODE)
    s = re.sub(r"\s+", "-", s)
    return s

def parse_cooldown(text: str) -> int:
    t = (text or "").strip().lower()
    if "nenhum" in t:
        return 0
    m = re.search(r"(\d+)\s*turn", t)
    return int(m.group(1)) if m else 0

# ---------- helpers: cor -> chakra type ----------

def parse_css_color(style: str):
    """
    Extrai (r,g,b) de style que contenha:
      - color: rgb(r,g,b)
      - color: #rrggbb
      - color: #rgb
      - color: black/white/red/blue/green
    Retorna (r,g,b) ou None.
    """
    if not style:
        return None

    # rgb(r,g,b)
    m = re.search(
        r"color\s*:\s*rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)",
        style,
        re.I,
    )
    if m:
        r, g, b = map(int, m.groups())
        return (r, g, b)

    # hex #rrggbb
    m = re.search(r"color\s*:\s*(#([0-9a-f]{6}))\b", style, re.I)
    if m:
        hx = m.group(1).lstrip("#")
        return (int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16))

    # hex #rgb
    m = re.search(r"color\s*:\s*(#([0-9a-f]{3}))\b", style, re.I)
    if m:
        hx = m.group(1).lstrip("#")
        return (int(hx[0] * 2, 16), int(hx[1] * 2, 16), int(hx[2] * 2, 16))

    # nomes simples
    m = re.search(r"color\s*:\s*(black|white|red|blue|green)\b", style, re.I)
    if m:
        name = m.group(1).lower()
        return {
            "black": (0, 0, 0),
            "white": (255, 255, 255),
            "red": (255, 0, 0),
            "blue": (0, 0, 255),
            "green": (0, 255, 0),
        }[name]

    return None


def rgb_to_chakra_type(rgb):
    """
    Mapeia (r,g,b) -> tipo, tolerante a variações tipo rgb(83,199,0).
      verde  -> taijutsu
      azul   -> ninjutsu
      vermelho -> bloodline
      branco -> genjutsu
      preto  -> random
    """
    r, g, b = rgb

    # branco / preto com tolerância
    if r >= 230 and g >= 230 and b >= 230:
        return "genjutsu"
    if r <= 25 and g <= 25 and b <= 25:
        return "random"

    # dominante por canal (com margem)
    if r >= g + 40 and r >= b + 40:
        return "bloodline"
    if g >= r + 40 and g >= b + 40:
        return "taijutsu"
    if b >= r + 40 and b >= g + 40:
        return "ninjutsu"

    # fallback: maior canal
    mx = max((r, "bloodline"), (g, "taijutsu"), (b, "ninjutsu"), key=lambda x: x[0])[1]
    return mx


def extract_chakra_cost_from_line_container(line_container):
    """
    Dentro do bloco que contém "Chakra Necessário:", acha spans com style 'color'
    e conta 1 ponto por span (um quadradinho = 1 chakra).
    Retorna lista [{type,total}, ...]
    """
    spans = line_container.find_all("span")
    counts = {}

    for sp in spans:
        style = sp.get("style", "")
        rgb = parse_css_color(style)
        if not rgb:
            continue
        ctype = rgb_to_chakra_type(rgb)
        counts[ctype] = counts.get(ctype, 0) + 1

    return [{"type": k, "total": str(v)} for k, v in counts.items()]


# ---------- extração de personagem ----------

def extract_character(url: str):
    html = requests.get(url, timeout=30).text
    soup = BeautifulSoup(html, "html.parser")

    # Nome geralmente está no h2
    h2 = soup.find("h2")
    name = h2.get_text(" ", strip=True) if h2 else url.rsplit("/", 1)[-1]
    char_id = url.rsplit("/", 1)[-1]

    # Descrição: pega texto antes de "Requerimentos"
    text = soup.get_text("\n", strip=True)
    desc = ""
    if "Requerimentos" in text:
        before = text.split("Requerimentos", 1)[0]
        candidates = [ln for ln in before.splitlines() if len(ln) > 40]
        desc = candidates[-1] if candidates else ""
    else:
        # fallback
        ps = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
        desc = max(ps, key=len) if ps else ""

    skills = []

    # Acha cada ocorrência de "Chakra Necessário"
    chakra_labels = soup.find_all(string=re.compile(r"Chakra Necess", re.I))

    for chakra_label in chakra_labels:
        # o "Chakra Necessário:" fica dentro de um bloco (p/div)
        line_container = chakra_label.find_parent(["p", "div", "li"]) or chakra_label.parent

        # chakraCost por cor dos spans
        chakra_cost = extract_chakra_cost_from_line_container(line_container)

        # Pega um "bloco" de texto acima pra tentar capturar nome/descrição
        block_text = []
        cur = line_container
        for _ in range(30):
            cur = cur.find_previous()
            if not cur:
                break
            t = cur.get_text(" ", strip=True)
            if t:
                block_text.append(t)
            if len(block_text) >= 12:
                break

        # Nome do skill: primeira linha curta que não é label
        skill_name = ""
        for t in block_text:
            tl = t.lower()
            if tl.startswith("image:"):
                continue
            if "chakra necess" in tl or "classes" in tl or "cooldown" in tl:
                continue
            if 2 <= len(t) <= 60:
                skill_name = t
                break

        # Descrição: primeira linha "longa" perto do topo do bloco
        skill_desc = ""
        for t in block_text:
            tl = t.lower()
            if "chakra necess" in tl or "classes" in tl or "cooldown" in tl:
                continue
            if len(t) > 60:
                skill_desc = t
                break

        # Classes e Cooldown: procura para frente a partir da linha do chakra
        sib_text = ""
        sib = line_container
        for _ in range(25):
            sib = sib.find_next()
            if not sib:
                break
            s = sib.get_text(" ", strip=True)
            if s:
                sib_text += "\n" + s
            if "Cooldown" in sib_text and "Classes" in sib_text:
                break

        classes = []
        m_classes = re.search(r"Classes:\s*([^\n]+)", sib_text, re.I)
        if m_classes:
            classes = [c.strip() for c in m_classes.group(1).split(",") if c.strip()]

        cooldown = 0
        m_cd = re.search(r"Cooldown:\s*([^\n]+)", sib_text, re.I)
        if m_cd:
            cooldown = parse_cooldown(m_cd.group(1))

        if skill_name:
            skills.append(
                {
                    "id": f"{char_id}-{normalize_id(skill_name)}",
                    "name": skill_name,
                    "description": skill_desc,
                    "cooldown": cooldown,
                    "chakraCost": chakra_cost,
                    "classes": classes,
                    "target": "unknown",  # se você tiver regra pra target, dá pra inferir também
                }
            )

    # chakraTypes: conjunto de tipos presentes nos custos (sem unknown)
    chakra_types = sorted({c["type"] for sk in skills for c in sk["chakraCost"] if c["type"] != "unknown"})
    if not chakra_types:
        chakra_types = ["unknown"]

    return {
        "id": char_id,
        "name": name,
        "description": desc,
        "chakraTypes": chakra_types,
        "skills": skills,
        "_sourceUrl": url,
    }


# ---------- index: pega todos os links /arquivo/<slug> ----------

def get_character_links():
    index_html = requests.get(urljoin(BASE, "personagens.html"), timeout=30).text
    soup = BeautifulSoup(index_html, "html.parser")

    links = []
    for a in soup.select('a[href^="/arquivo/"], a[href*="/arquivo/"]'):
        href = a.get("href")
        if not href:
            continue
        full = urljoin(BASE, href)
        if "/arquivo/" in full:
            links.append(full)

    return sorted(set(links))


def main():
    links = get_character_links()
    print(f"Encontrados {len(links)} personagens.")

    data = []
    for i, u in enumerate(links, 1):
        print(f"[{i}/{len(links)}] {u}")
        try:
            data.append(extract_character(u))
        except Exception as e:
            print(f"  ERRO em {u}: {e}")

    with open("personagens.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("Gerado: personagens.json")


if __name__ == "__main__":
    main()
