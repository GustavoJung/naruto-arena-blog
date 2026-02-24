#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import os
import re
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


def sanitize_filename(name: str, max_len: int = 160) -> str:
    """
    Remove caracteres inválidos para nomes de arquivo (Windows/Linux/macOS).
    """
    name = name.strip()
    # substitui separadores e caracteres proibidos
    name = re.sub(r'[<>:"/\\|?*\x00-\x1F]', " ", name)
    # colapsa espaços
    name = re.sub(r"\s+", " ", name).strip()
    # evita nomes vazios
    if not name:
        name = "image"
    # limita tamanho
    return name[:max_len].rstrip()


def guess_extension_from_url(url: str) -> str:
    path = urlparse(url).path
    ext = os.path.splitext(path)[1].lower()
    if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        return ext
    return ".jpg"


def download_image(url: str, out_path: Path, timeout: int = 30) -> None:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; image-downloader/1.0)"
    }
    with requests.get(url, stream=True, timeout=timeout, headers=headers) as r:
        r.raise_for_status()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 128):
                if chunk:
                    f.write(chunk)


def main():
    parser = argparse.ArgumentParser(
        description="Extrai e baixa imagens das missões (nome do arquivo = nome da missão)."
    )
    parser.add_argument("html_path", help="Caminho do HTML salvo (ex.: A Rank Missions - Naruto Arena Classic.html)")
    parser.add_argument("-o", "--outdir", default="missions_images", help="Pasta de saída (default: missions_images)")
    args = parser.parse_args()

    html_path = Path(args.html_path)
    outdir = Path(args.outdir)

    if not html_path.exists():
        raise SystemExit(f"Arquivo não encontrado: {html_path}")

    soup = BeautifulSoup(html_path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
    next_data = soup.find("script", id="__NEXT_DATA__")
    if not next_data or not next_data.string:
        raise SystemExit("Não encontrei o <script id='__NEXT_DATA__'> com JSON dentro do HTML.")

    data = json.loads(next_data.string)

    # Estrutura esperada (conforme o HTML):
    # props -> pageProps -> animeMissions -> [{name, url, ...}, ...]
    missions = (
        data.get("props", {})
            .get("pageProps", {})
            .get("animeMissions", [])
    )

    if not missions:
        raise SystemExit("Não encontrei 'animeMissions' no JSON.")

    # Override EXATO para o nome que você pediu
    overrides = {
        "Team 7 Fights as a Team": "Team 7 fights as a team"
    }

    ok = 0
    for m in missions:
        name = m.get("name")
        url = m.get("url")
        if not name or not url:
            continue

        filename_base = overrides.get(name, name)
        filename_base = sanitize_filename(filename_base)
        ext = guess_extension_from_url(url)
        out_path = outdir / f"{filename_base}{ext}"

        # evita sobrescrever sem querer (caso haja nomes repetidos)
        if out_path.exists():
            i = 2
            while True:
                candidate = outdir / f"{filename_base} ({i}){ext}"
                if not candidate.exists():
                    out_path = candidate
                    break
                i += 1

        try:
            download_image(url, out_path)
            ok += 1
            print(f"[OK] {name} -> {out_path.name}")
        except Exception as e:
            print(f"[ERRO] {name} ({url}): {e}")

    print(f"\nConcluído. Imagens baixadas: {ok}. Pasta: {outdir.resolve()}")


if __name__ == "__main__":
    main()