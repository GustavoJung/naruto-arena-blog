import os
import re
import json
import time
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


BASE = "https://naruto-arenawiki.weebly.com/"
INDEX_URL = urljoin(BASE, "personagens.html")

OUT_DIR = "out_nawiki"
CHAR_IMG_DIR = os.path.join(OUT_DIR, "characters")
SKILL_IMG_DIR = os.path.join(OUT_DIR, "skills")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; NAWikiScraper/1.0; +https://example.com)"
}

# Ajuste se quiser ser mais gentil com o servidor
REQUEST_DELAY_SECONDS = 0.6
TIMEOUT = 30


def slugify(name: str) -> str:
    """
    Transforma 'Uzumaki Naruto (S)' -> 'uzumaki-naruto-s'
    """
    name = name.strip().lower()
    # remove acentos simples (fallback)
    name = (
        name.replace("á", "a").replace("à", "a").replace("â", "a").replace("ã", "a")
            .replace("é", "e").replace("ê", "e")
            .replace("í", "i")
            .replace("ó", "o").replace("ô", "o").replace("õ", "o")
            .replace("ú", "u")
            .replace("ç", "c")
    )
    name = re.sub(r"[^a-z0-9]+", "-", name)
    name = re.sub(r"-+", "-", name).strip("-")
    return name or "unknown"


def safe_filename(name: str) -> str:
    """
    Nome de arquivo "humano": remove caracteres inválidos.
    """
    name = name.strip()
    name = re.sub(r'[\\/:*?"<>|]+', "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name or "unknown"


def guess_ext_from_url(url: str) -> str:
    path = urlparse(url).path.lower()
    for ext in [".png", ".jpg", ".jpeg", ".webp", ".gif"]:
        if path.endswith(ext):
            return ext
    # muitas imagens do weebly vêm como *_orig.jpg
    if "_orig" in path:
        return ".jpg"
    return ".png"


def fetch(url: str) -> str:
    time.sleep(REQUEST_DELAY_SECONDS)
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    return r.text


def download_file(url: str, dest_path: str) -> None:
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    time.sleep(REQUEST_DELAY_SECONDS)
    with requests.get(url, headers=HEADERS, timeout=TIMEOUT, stream=True) as r:
        r.raise_for_status()
        with open(dest_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 64):
                if chunk:
                    f.write(chunk)


def parse_index_character_links(index_html: str) -> list[str]:
    soup = BeautifulSoup(index_html, "html.parser")
    links = set()

    for a in soup.select('a[href]'):
        href = a.get("href", "").strip()
        if not href:
            continue

        # Normaliza para URL absoluta
        abs_url = urljoin(BASE, href)

        # Queremos apenas páginas de personagem no /arquivo/
        if "/arquivo/" in abs_url:
            # evita coisas tipo /arquivo/ (sem slug) se existirem
            if re.search(r"/arquivo/[^/?#]+", abs_url):
                links.add(abs_url)

    return sorted(links)


def parse_chakra_cost(raw: str) -> dict:
    """
    NAWiki mostra:
    - "Chakra Necessário: ⯀⯀"  -> { Random: 2 }
    - "Chakra Necessário: ⯀"    -> { Random: 1 }
    - "Chakra Necessário: Nenhum" -> {}
    """
    raw = raw.strip()
    if not raw or "Nenhum" in raw or "nenhum" in raw:
        return {}

    count = raw.count("⯀")
    if count > 0:
        return {"Random": count}

    # fallback: se aparecer algo inesperado, guarda como string
    return {"Unknown": raw}


def parse_cooldown(raw: str) -> int:
    """
    - "Cooldown: 1 turno" -> 1
    - "Cooldown: 4 turnos" -> 4
    - "Cooldown: Nenhum" -> 0
    """
    raw = raw.strip()
    if not raw or "Nenhum" in raw or "nenhum" in raw:
        return 0
    m = re.search(r"(\d+)", raw)
    return int(m.group(1)) if m else 0


def normalize_classes(raw: str) -> list[str]:
    """
    "Classes: Energy, Instant, Melee" -> ["Energy","Instant","Melee"]
    """
    raw = raw.strip()
    raw = re.sub(r"^Classes:\s*", "", raw, flags=re.I).strip()
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    return parts


def extract_main_content(soup: BeautifulSoup):
    # Weebly geralmente coloca conteúdo no #wsite-content
    main = soup.select_one("#wsite-content")
    return main if main else soup


def parse_character_page(url: str) -> dict:
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    main = extract_main_content(soup)

    # Nome do personagem (normalmente em um h2 com um link)
    h2 = main.find(["h2", "h1"])
    name = None
    if h2:
        name = h2.get_text(" ", strip=True)
    if not name:
        # fallback para <title>
        title = soup.title.get_text(" ", strip=True) if soup.title else ""
        name = title.split(":")[-1].strip() or "Unknown"

    char_id = slugify(name)

    # Imagens em ordem: primeira tende a ser do personagem; as seguintes, das skills
    imgs = [img.get("src") for img in main.find_all("img") if img.get("src")]
    imgs = [urljoin(BASE, src) for src in imgs]

    character_image_url = imgs[0] if imgs else None
    skill_image_urls = imgs[1:] if len(imgs) > 1 else []

    # Agora vamos extrair blocos de habilidade varrendo os elementos após imagens
    # Heurística: cada habilidade começa com uma <img>, seguida por textos (nome, descrição, chakra, classes, cooldown)
    skills = []
    # itera em ordem de leitura
    elements = list(main.descendants)

    def is_img_tag(el):
        return getattr(el, "name", None) == "img" and el.get("src")

    current = None
    after_first_img = False  # pra pular a imagem do personagem
    for el in elements:
        if not hasattr(el, "name"):
            continue

        if is_img_tag(el):
            img_url = urljoin(BASE, el.get("src"))

            if not after_first_img:
                # primeira imagem = personagem
                after_first_img = True
                continue

            # fecha habilidade anterior
            if current:
                skills.append(current)

            current = {
                "imageUrl": img_url,   # guardamos para download
                "name": None,
                "description": "",
                "chakraCostRaw": "",
                "classesRaw": "",
                "cooldownRaw": "",
            }
            continue

        if current:
            # coleta texto “limpo” dentro dos próximos blocos
            text = el.get_text(" ", strip=True) if el.name in ["p", "div", "span", "h3", "h4"] else ""
            if not text:
                continue

            # Ignora labels genéricos
            if text.lower() in {"image: imagem", "imagem"}:
                continue

            # Se ainda não tem nome, primeira linha útil vira nome
            if current["name"] is None and not any(k in text for k in ["Chakra Necessário", "Classes", "Cooldown"]):
                current["name"] = text
                continue

            # Campos estruturados
            if "Chakra Necessário" in text:
                current["chakraCostRaw"] = text.split(":", 1)[-1].strip()
                continue
            if text.strip().lower().startswith("classes"):
                current["classesRaw"] = text
                continue
            if "Cooldown" in text:
                current["cooldownRaw"] = text
                continue

            # Descrição (acumula)
            # evita adicionar strings curtas tipo "Habilidades Alternativas"
            if text.lower().startswith("habilidades alternativas") or text.lower().startswith("após o uso"):
                continue

            # Se ainda não estamos em campos, isso faz parte da descrição
            if current["name"] is not None:
                if current["description"]:
                    current["description"] += " " + text
                else:
                    current["description"] = text

    if current:
        skills.append(current)

    # Pós-processamento: monta no formato que você quer
    out_skills = []
    for s in skills:
        if not s.get("name"):
            continue

        skill_name = s["name"].strip()
        skill_id = slugify(f"{char_id}-{skill_name}")

        chakra_cost = parse_chakra_cost(s.get("chakraCostRaw", ""))
        cooldown = parse_cooldown(s.get("cooldownRaw", ""))
        classes = normalize_classes(s.get("classesRaw", "")) if s.get("classesRaw") else []

        # alvo: NAWiki não padroniza “Self/Enemy/Ally” em campo fixo.
        # Heurística simples: se a descrição menciona "aliado", marca Ally; se menciona "a si" -> Self; senão Enemy.
        desc_l = (s.get("description") or "").lower()
        if "aliado" in desc_l:
            target = "Ally"
        elif "a si" in desc_l or "de si" in desc_l or "fica invulnerável" in desc_l:
            target = "Self"
        else:
            target = "Enemy"

        out_skills.append({
            "id": skill_id,
            "name": skill_name,
            "description": s.get("description") or "",
            "cooldown": cooldown,
            "chakraCost": chakra_cost,
            "classes": classes,
            "target": target,
            "_imageUrl": s.get("imageUrl"),  # campo interno p/ download
        })

    return {
        "id": char_id,
        "name": name,
        "chakraTypes": ["Random"],  # NAWiki usa ⯀ como “random” na prática; se você quiser mapear melhor depois, dá.
        "skills": out_skills,
        "_characterImageUrl": character_image_url,  # campo interno p/ download
        "_sourceUrl": url,
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(CHAR_IMG_DIR, exist_ok=True)
    os.makedirs(SKILL_IMG_DIR, exist_ok=True)

    index_html = fetch(INDEX_URL)
    character_urls = parse_index_character_links(index_html)

    print(f"Encontrados {len(character_urls)} links de personagens no índice.")

    all_chars = []
    for i, url in enumerate(character_urls, 1):
        try:
            print(f"[{i}/{len(character_urls)}] {url}")
            data = parse_character_page(url)

            # baixa imagem do personagem
            if data.get("_characterImageUrl"):
                ext = guess_ext_from_url(data["_characterImageUrl"])
                char_file = safe_filename(data["name"]) + ext
                char_path = os.path.join(CHAR_IMG_DIR, char_file)
                if not os.path.exists(char_path):
                    download_file(data["_characterImageUrl"], char_path)

            # baixa imagens das habilidades
            for sk in data["skills"]:
                img_url = sk.get("_imageUrl")
                if not img_url:
                    continue
                ext = guess_ext_from_url(img_url)
                skill_file = safe_filename(sk["name"]) + ext
                skill_path = os.path.join(SKILL_IMG_DIR, skill_file)

                # evita sobrescrever se houver skill com mesmo nome em outro personagem
                if os.path.exists(skill_path):
                    # cria um nome alternativo com prefixo do personagem
                    skill_file = safe_filename(f"{data['name']} - {sk['name']}") + ext
                    skill_path = os.path.join(SKILL_IMG_DIR, skill_file)

                if not os.path.exists(skill_path):
                    download_file(img_url, skill_path)

                # remove campo interno
                sk.pop("_imageUrl", None)

            # remove campos internos
            data.pop("_characterImageUrl", None)

            all_chars.append(data)
        except Exception as e:
            print(f"ERRO em {url}: {e}")

    # salva JSON final
    out_json = os.path.join(OUT_DIR, "characters.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(all_chars, f, ensure_ascii=False, indent=2)

    print(f"\nOK! Gerado: {out_json}")
    print(f"Imagens personagem: {CHAR_IMG_DIR}")
    print(f"Imagens skills: {SKILL_IMG_DIR}")


if __name__ == "__main__":
    main()
