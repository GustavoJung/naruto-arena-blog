import os
import re
import json
import time
import random
import logging
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

# ========= CONFIG =========
HTML_FILE = "Characters and Skills - Naruto Arena Classic2.html"
OUT_DIR = "images"
CHAR_DIR = os.path.join(OUT_DIR, "characters")
SKILL_DIR = os.path.join(OUT_DIR, "skills")

REQUESTS_PER_SECOND = 2
MAX_RETRIES = 6
# ==========================

os.makedirs(CHAR_DIR, exist_ok=True)
os.makedirs(SKILL_DIR, exist_ok=True)

logging.basicConfig(
    filename="download_errors.log",
    level=logging.ERROR,
    format="%(asctime)s - %(message)s"
)

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
})

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
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    return s

def download(url: str, path: str):
    if not url:
        return
    if os.path.exists(path):
        return  # skip

    for attempt in range(MAX_RETRIES):
        try:
            rate_limit()
            r = session.get(url, timeout=30, stream=True)

            if r.status_code == 429:
                wait = (2 ** attempt) + random.uniform(0.5, 1.5)
                time.sleep(wait)
                continue

            r.raise_for_status()

            with open(path, "wb") as f:
                for chunk in r.iter_content(8192):
                    if chunk:
                        f.write(chunk)
            return

        except Exception as e:
            if attempt == MAX_RETRIES - 1:
                logging.error(f"Falhou: {url} -> {path} | {e}")
            else:
                time.sleep(2 ** attempt)

def load_chars_from_next_data():
    html = open(HTML_FILE, encoding="utf-8", errors="ignore").read()
    soup = BeautifulSoup(html, "html.parser")
    script = soup.find("script", id="__NEXT_DATA__")
    data = json.loads(script.string)
    pageProps = data["props"]["pageProps"]
    return pageProps["chars"]

def main():
    chars = load_chars_from_next_data()

    downloads = []

    for ch in chars:
        ch_name = ch.get("name")
        ch_url = ch.get("url")          # imagem do personagem
        ch_theme = ch.get("themepic")   # opcional

        # personagem
        if ch_url:
            downloads.append((ch_url, os.path.join(CHAR_DIR, f"{slug(ch_name)}.png")))
        if ch_theme:
            downloads.append((ch_theme, os.path.join(CHAR_DIR, f"{slug(ch_name)}__old.png")))

        # skills do personagem (aqui está o pulo do gato)
        for sk in ch.get("skills", []):
            sk_name = sk.get("name")
            sk_url = sk.get("url")          # ícone da skill
            sk_theme = sk.get("themepic")   # opcional

            base = f"{slug(ch_name)}__{slug(sk_name)}"
            if sk_url:
                downloads.append((sk_url, os.path.join(SKILL_DIR, f"{base}.png")))
            if sk_theme:
                downloads.append((sk_theme, os.path.join(SKILL_DIR, f"{base}__old.png")))

    # remove duplicatas por URL+path
    downloads = list(dict.fromkeys(downloads))

    print(f"Total para baixar/verificar: {len(downloads)}")
    for url, path in tqdm(downloads, desc="Baixando imagens"):
        download(url, path)

    print("\n✅ Concluído!")
    print("📁 Pasta:", OUT_DIR)
    print("📄 Erros (se houver): download_errors.log")

if __name__ == "__main__":
    main()
