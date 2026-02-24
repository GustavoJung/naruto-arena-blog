import os
import re
import json
import time
import random
import logging
from urllib.parse import urljoin, urlparse

import requests
from tqdm import tqdm
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

# =========================
# CONFIG
# =========================
BASE_URL = "https://www.naruto-arena.site"
ROOT_URL = f"{BASE_URL}/ninja-missions"

OUT_DIR = "missions_out"
IMG_DIR = os.path.join(OUT_DIR, "images")
OUT_JSON = os.path.join(OUT_DIR, "missions.json")
STATE_JSON = os.path.join(OUT_DIR, "_state.json")

USER_DATA_DIR = "user_data_na"   # perfil persistente (cookies/login)
HEADLESS = False

REQUESTS_PER_SECOND = 2
MAX_RETRIES = 6

# Se deu ruim antes e você quer reprocessar tudo:
RESET_STATE = True

# =========================

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(IMG_DIR, exist_ok=True)

logging.basicConfig(
    filename=os.path.join(OUT_DIR, "missions_errors.log"),
    level=logging.ERROR,
    format="%(asctime)s - %(message)s",
)

req = requests.Session()
req.headers.update({"User-Agent": "Mozilla/5.0"})

_last_req = 0.0


def rate_limit():
    global _last_req
    min_interval = 1 / REQUESTS_PER_SECOND
    elapsed = time.time() - _last_req
    if elapsed < min_interval:
        time.sleep(min_interval - elapsed)
    _last_req = time.time()


def slug(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"[^\w\s-]", "", s, flags=re.UNICODE)
    s = re.sub(r"\s+", "-", s)
    return s[:140] if s else "item"


def safe_filename(url: str) -> str:
    p = urlparse(url).path
    name = os.path.basename(p) if p else "image"
    if "." not in name:
        name += ".png"
    return re.sub(r"[^a-zA-Z0-9._-]", "_", name)


def load_state():
    if RESET_STATE:
        return {"done_sessions": [], "done_missions": []}
    if os.path.exists(STATE_JSON):
        try:
            return json.load(open(STATE_JSON, "r", encoding="utf-8"))
        except:
            return {"done_sessions": [], "done_missions": []}
    return {"done_sessions": [], "done_missions": []}


def save_state(state):
    with open(STATE_JSON, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def next_data_from_html(html: str):
    soup = BeautifulSoup(html, "lxml")
    tag = soup.find("script", id="__NEXT_DATA__")
    if not tag or not tag.string:
        return None
    try:
        return json.loads(tag.string)
    except:
        return None


def ensure_not_redirected_to_home(page, intended_url: str) -> bool:
    # Se cair em "/", está errado (expirou login ou bloqueou)
    path = urlparse(page.url).path
    if path == "/":
        logging.error(f"REDIRECT para HOME. intended={intended_url} final={page.url}")
        return False
    return True


def download_image(url: str, out_path: str, page=None):
    """
    - tenta requests (rápido)
    - se 401/403 ou falha, usa page.request (autenticado)
    """
    if not url:
        return None
    if os.path.exists(out_path):
        return out_path

    # 1) requests com retry/backoff
    for attempt in range(MAX_RETRIES):
        try:
            rate_limit()
            r = req.get(url, timeout=30, stream=True)
            if r.status_code == 429:
                time.sleep((2 ** attempt) + random.uniform(0.5, 1.5))
                continue
            if r.status_code in (401, 403):
                raise PermissionError(f"HTTP {r.status_code}")
            r.raise_for_status()
            with open(out_path, "wb") as f:
                for chunk in r.iter_content(8192):
                    if chunk:
                        f.write(chunk)
            return out_path
        except Exception:
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)

    # 2) fallback Playwright (sessão autenticada)
    if page is not None:
        try:
            resp = page.request.get(url, timeout=30_000)
            if resp.ok:
                with open(out_path, "wb") as f:
                    f.write(resp.body())
                return out_path
            logging.error(f"Playwright download falhou: {url} status={resp.status}")
        except Exception as e:
            logging.error(f"Playwright download exception: {url} err={e}")

    logging.error(f"Download falhou: {url} -> {out_path}")
    return None


# =========================
# EXTRAÇÃO (determinística via __NEXT_DATA__)
# =========================

def extract_sessions_from_root_nextdata(nd):
    """
    /ninja-missions: pageProps.animeMissions é um dict { "B Rank Missions": {linkTo,url,description}, ... }
    """
    props = (nd.get("props") or {}).get("pageProps") or {}
    animeMissions = props.get("animeMissions") or {}
    sessions = []

    for title, obj in animeMissions.items():
        linkTo = (obj or {}).get("linkTo")
        if not linkTo:
            continue
        sessions.append({
            "id": slug(linkTo),
            "title": title,
            "description": (obj or {}).get("description", ""),
            "imageUrl": (obj or {}).get("url"),
            "linkTo": linkTo,
            "url": f"{BASE_URL}/missions/{linkTo}"
        })

    # ordena por título (opcional)
    sessions.sort(key=lambda x: x["title"].lower())
    return sessions


def extract_mission_cards_from_session_nextdata(nd):
    """
    /missions/<section>: pageProps.animeMissions é uma LISTA de cards
    com linkTo e url (imagem da missão na lista).
    """
    props = (nd.get("props") or {}).get("pageProps") or {}
    cards = props.get("animeMissions") or []
    out = []

    for c in cards:
        linkTo = (c or {}).get("linkTo")
        if not linkTo:
            continue
        out.append({
            "id": slug(linkTo),
            "name": (c or {}).get("name", linkTo),
            "anime": (c or {}).get("anime", ""),
            "url": (c or {}).get("url"),  # imagem do card
            "unlockedCharacter": (c or {}).get("unlockedCharacter"),
            "rankRequirement": (c or {}).get("rankRequirement"),
            "levelRequirement": (c or {}).get("levelRequirement"),
            "completedRequeriments": (c or {}).get("completedRequeriments", []),
            "isAvailable": bool((c or {}).get("isAvailable", False)),
            "isLevelAvailable": bool((c or {}).get("isLevelAvailable", False)),
            "isCompleted": bool((c or {}).get("isCompleted", False)),
            "missionUrl": f"{BASE_URL}/mission/{linkTo}",
        })

    return out


def extract_mission_status_from_mission_nextdata(nd):
    """
    /mission/<id>: pageProps.missionStatus traz tudo certo (incluindo imgs)
    """
    props = (nd.get("props") or {}).get("pageProps") or {}
    ms = props.get("missionStatus") or {}
    if not ms:
        return None

    title = ms.get("name") or ""
    mission_img = ms.get("url")
    reward_obj = ms.get("unlockedChar") or ms.get("unlockedBorder") or None
    reward_img = (reward_obj or {}).get("url")
    reward_name = (reward_obj or {}).get("name")

    goals = []
    for g in (ms.get("progress") or []):
        goals.append({
            "text": g.get("text", ""),
            "isCompleted": bool(g.get("isCompleted", False))
        })

    requirements = ""
    if ms.get("rankRequirement"):
        requirements = f"Rank: At least {ms.get('rankRequirement')}"

    return {
        "title": title,
        "missionInfo": {
            "Mission name": title,
            "Mission type": ms.get("anime", "")
        },
        "requirements": requirements,
        "reward": reward_name or "",
        "goals": goals,
        "images": {
            "mission": mission_img,
            "reward": reward_img
        }
    }


# =========================
# MAIN
# =========================

def main():
    state = load_state()
    done_sessions = set(state.get("done_sessions", []))
    done_missions = set(state.get("done_missions", []))

    sessions_out = []

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            USER_DATA_DIR,
            headless=HEADLESS,
            viewport={"width": 1400, "height": 900},
        )
        page = ctx.new_page()

        # 1) ROOT
        page.goto(ROOT_URL, wait_until="networkidle")
        print("\nSe não estiver logado, faça login nessa janela.")
        input("Quando estiver logado e a página Ninja Missions carregada, ENTER...")

        root_html = page.content()
        root_nd = next_data_from_html(root_html)
        if not root_nd:
            print("Não encontrei __NEXT_DATA__ na página raiz. Veja missions_errors.log.")
            logging.error("ROOT sem __NEXT_DATA__")
            ctx.close()
            return

        sessions = extract_sessions_from_root_nextdata(root_nd)
        print(f"Encontradas {len(sessions)} sessões (via __NEXT_DATA__).")

        # jobs de imagem: (url, out_path, setter_fn)
        image_jobs = []

        # 2) PARA CADA SESSÃO
        for sess in tqdm(sessions, desc="Sessões"):
            sess_url = sess["url"]
            if sess_url in done_sessions:
                continue

            page.goto(sess_url, wait_until="networkidle")
            if not ensure_not_redirected_to_home(page, sess_url):
                continue

            s_html = page.content()
            s_nd = next_data_from_html(s_html)
            if not s_nd:
                logging.error(f"SESSÃO sem __NEXT_DATA__: {sess_url}")
                continue

            cards = extract_mission_cards_from_session_nextdata(s_nd)

            sess_obj = {
                "id": sess["id"],
                "title": sess["title"],
                "description": sess.get("description", ""),
                "url": sess_url,
                "image": None,
                "missions": []
            }

            # imagem da sessão (do root)
            if sess.get("imageUrl"):
                img_url = sess["imageUrl"]
                fname = f"session__{sess_obj['id']}__{safe_filename(img_url)}"
                out_path = os.path.join(IMG_DIR, fname)

                def set_session_img(obj=sess_obj, u=img_url, p=out_path):
                    obj["image"] = {"url": u, "file": p.replace("\\", "/")}

                image_jobs.append((img_url, out_path, set_session_img))

            # 3) PARA CADA MISSÃO (usamos /mission/<linkTo>)
            for card in tqdm(cards, desc=f"Missões ({sess_obj['title']})", leave=False):
                m_url = card["missionUrl"]
                if m_url in done_missions:
                    continue

                page.goto(m_url, wait_until="networkidle")
                if not ensure_not_redirected_to_home(page, m_url):
                    continue

                m_html = page.content()
                m_nd = next_data_from_html(m_html)
                if not m_nd:
                    logging.error(f"MISSÃO sem __NEXT_DATA__: {m_url}")
                    continue

                ms = extract_mission_status_from_mission_nextdata(m_nd)
                if not ms:
                    logging.error(f"MISSÃO sem missionStatus: {m_url}")
                    continue

                mission_obj = {
                    "id": slug(ms["title"] or card["name"] or card["id"]),
                    "title": ms["title"] or card["name"],
                    "section": sess_obj["title"],
                    "card": {
                        "imageUrl": card.get("url"),
                        "isAvailable": card.get("isAvailable"),
                        "isLevelAvailable": card.get("isLevelAvailable"),
                        "isCompleted": card.get("isCompleted"),
                        "rankRequirement": card.get("rankRequirement"),
                        "levelRequirement": card.get("levelRequirement"),
                        "completedRequeriments": card.get("completedRequeriments", []),
                        "unlockedCharacter": card.get("unlockedCharacter"),
                    },
                    "missionInfo": ms.get("missionInfo", {}),
                    "requirements": ms.get("requirements", ""),
                    "reward": ms.get("reward", ""),
                    "goals": ms.get("goals", []),
                    "images": {
                        "mission": {"url": ms["images"].get("mission"), "file": None},
                        "reward": {"url": ms["images"].get("reward"), "file": None},
                    },
                    "pageUrl": m_url
                }

                # agenda downloads (mission/reward) — URLs vêm do missionStatus (nunca Patreon)
                for key in ["mission", "reward"]:
                    img_url = mission_obj["images"][key]["url"]
                    if not img_url:
                        continue
                    fname = f"{sess_obj['id']}__{mission_obj['id']}__{key}__{safe_filename(img_url)}"
                    out_path = os.path.join(IMG_DIR, fname)

                    def make_setter(obj=mission_obj, k=key, u=img_url, p=out_path):
                        def _set():
                            obj["images"][k]["file"] = p.replace("\\", "/")
                            obj["images"][k]["url"] = u
                        return _set

                    image_jobs.append((img_url, out_path, make_setter()))

                sess_obj["missions"].append(mission_obj)

                done_missions.add(m_url)
                state["done_missions"] = sorted(done_missions)
                save_state(state)

            sessions_out.append(sess_obj)

            done_sessions.add(sess_url)
            state["done_sessions"] = sorted(done_sessions)
            save_state(state)

        # 4) BAIXAR IMAGENS (dedupe url+path)
        dedup = {}
        for u, pth, setter in image_jobs:
            dedup[(u, pth)] = (u, pth, setter)
        jobs = list(dedup.values())

        for (img_url, out_path, setter) in tqdm(jobs, desc="Baixando imagens"):
            dl = download_image(img_url, out_path, page=page)
            if dl:
                setter()
            else:
                # mantém url, file fica None
                pass

        # 5) SALVAR JSON
        out = {
            "sourceRoot": ROOT_URL,
            "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
            "sessions": sessions_out
        }
        with open(OUT_JSON, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)

        print("\n✅ Concluído!")
        print("📄 JSON:", OUT_JSON)
        print("🖼️ Imagens:", IMG_DIR)
        print("📄 Log:", os.path.join(OUT_DIR, "missions_errors.log"))
        print("💾 State:", STATE_JSON)

        ctx.close()


if __name__ == "__main__":
    main()
