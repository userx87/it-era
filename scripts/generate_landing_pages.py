#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generatore landing page città a partire da un template HTML con placeholder.
- Legge data/cities.txt e data/config.json
- Sostituisce placeholder {{CITTA}}, {{SLUG}}, {{PROVINCIA}}, {{CANONICAL_BASE}}, {{GA_MEASUREMENT_ID}}, {{META_ROBOTS}}
- Scrive in web/pages-draft/assistenza-it-<slug>.html

Uso:
  python3 scripts/generate_landing_pages.py --cities data/cities.txt \
      --template web/templates/landing_city.html \
      --outdir web/pages-draft \
      --robots noindex

Dopo validazione, si potrà rigenerare con --robots index per pubblicazione e
aggiornare sitemap.xml separatamente.
"""
import argparse
import json
import os
import re
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[1]

PLACEHOLDERS = [
    'CITTA', 'SLUG', 'PROVINCIA', 'CANONICAL_BASE', 'GA_MEASUREMENT_ID', 'META_ROBOTS', 'GA_SNIPPET', 'SECTOR_IMAGE'
]


def slugify(name: str) -> str:
    s = name.strip().lower()
    # Sostituisci apostrofi e caratteri speciali italiani
    s = s.replace("'", " ").replace("’", " ")
    s = s.replace("à", "a").replace("è", "e").replace("é", "e").replace("ì", "i").replace("ò", "o").replace("ù", "u")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip('-')
    return s


def load_config(cfg_path: Path) -> dict:
    with cfg_path.open('r', encoding='utf-8') as f:
        return json.load(f)


def read_cities(cities_path: Path) -> list[str]:
    cities = []
    with cities_path.open('r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            cities.append(line)
    return cities


def infer_province(city: str, fallback: str) -> str:
    # Mappature semplici. Estendibile con data/province.json.
    m = city.lower()
    if m in {"monza", "arcore", "vimercate", "lesmo", "villasanta", "carate brianza", "desio", "lissone", "seregno", "meda", "brugherio", "bianzano", "giussano", "cesano maderno", "barlassina", "misinto", "lentate sul seveso", "seveso"}:
        return "Monza e Brianza"
    if m in {"milano", "sesto san giovanni", "cologno monzese", "colturano"}:
        return "Milano"
    if m in {"como", "cantu", "mariano comense", "fino mornasco", "appiano gentile", "olgiate comasco", "lomazzo", "bregnano"}:
        return "Como"
    if m in {"bergamo", "dalmine", "treviolo"}:
        return "Bergamo"
    if m in {"lecco", "merate", "calolziocorte", "oggiono", "valmadrera", "mandello del lario", "bellano", "colico", "dervio"}:
        return "Lecco"
    return fallback


def render(template_str: str, ctx: dict) -> str:
    html = template_str
    for k, v in ctx.items():
        html = html.replace(f"{{{{{k}}}}}", v)
    return html


def load_city_sectors(path: Path) -> Dict[str, str]:
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding='utf-8'))
    mapping = {}
    for item in data:
        city = item.get('city', '').strip().lower()
        sector = item.get('sector', '').strip().lower()
        if city and sector:
            mapping[city] = sector
    return mapping


def sector_image_name(sector: str) -> str:
    m = {
        'office': 'assistenza-it-office.svg',
        'industria': 'assistenza-it-industria.svg',
        'education': 'assistenza-it-education.svg',
        'studi': 'assistenza-it-studi.svg',
    }
    return m.get(sector, 'assistenza-it-office.svg')


def build_related_links(city: str, cities: List[str]) -> str:
    # Costruisce link ad altre città della stessa provincia, massimo 6
    same_prov = []
    prov = infer_province(city, "Lombardia")
    for c in cities:
        if c.lower() == city.lower():
            continue
        if infer_province(c, "Lombardia") == prov:
            same_prov.append(c)
    same_prov = same_prov[:6]
    items = []
    for c in same_prov:
        slug = slugify(c)
        items.append(f'<li class="list-inline-item mb-2"><a class="btn btn-outline-secondary btn-sm" href="/pages/assistenza-it-{slug}.html">Assistenza IT {c.title()}</a></li>')
    return "\n            ".join(items)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cities', default=str(ROOT / 'data' / 'cities.txt'))
    ap.add_argument('--template', default=str(ROOT / 'web' / 'templates' / 'landing_city.html'))
    ap.add_argument('--outdir', default=str(ROOT / 'web' / 'pages-draft'))
    ap.add_argument('--robots', choices=['index', 'noindex'], default='noindex')
    args = ap.parse_args()

    cfg = load_config(ROOT / 'data' / 'config.json')
    cities = read_cities(Path(args.cities))
    city_sectors = load_city_sectors(ROOT / 'data' / 'cities.json')

    template_path = Path(args.template)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    template_str = template_path.read_text(encoding='utf-8')

    for city in cities:
        slug = slugify(city)
        provincia = infer_province(city, cfg.get('province_fallback', 'Lombardia'))
        ga_id = cfg.get('ga_measurement_id', '').strip()
        if ga_id:
            ga_snippet = (
                f"<script async src=\"https://www.googletagmanager.com/gtag/js?id={ga_id}\"></script>\n"
                "<script>\n"
                "window.dataLayer = window.dataLayer || [];\n"
                "function gtag(){dataLayer.push(arguments);} \n"
                "gtag('js', new Date());\n"
                f"gtag('config', '{ga_id}');\n"
                "</script>\n"
            )
        else:
            ga_snippet = ""
        sector = city_sectors.get(city.lower(), 'office')
        ctx = {
            'CITTA': city.title(),
            'SLUG': slug,
            'PROVINCIA': provincia,
            'CANONICAL_BASE': cfg['canonical_base'],
            'GA_MEASUREMENT_ID': ga_id,
            'META_ROBOTS': 'index, follow' if args.robots == 'index' else cfg.get('meta_robots_default', 'noindex, nofollow'),
            'GA_SNIPPET': ga_snippet,
            'SECTOR_IMAGE': sector_image_name(sector),
            'RELATED_LINKS': build_related_links(city, cities),
        }
        html = render(template_str, ctx)
        outfile = outdir / f"assistenza-it-{slug}.html"
        outfile.write_text(html, encoding='utf-8')
        print(f"[OK] Generata {outfile}")

    print(f"Completato. File generati in: {outdir}")


if __name__ == '__main__':
    main()

