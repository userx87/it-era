#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sostituzioni globali controllate nel sito:
- Numeri telefono: 393 813 5085 -> 039 888 2041 (tel:+390398882041)
- Testo CTA: "Parla con Tecnico" -> "Parla con un tecnico"
- Email prioritaria: andrea@bulltech.it -> info@it-era.it
- WhatsApp -> Chat: label e link verso /pages/chat.html

Uso:
  python3 scripts/bulk_replace.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET_DIRS = [ROOT / 'web']

REPLACEMENTS = [
    # Telefono numerico visualizzato
    (re.compile(r'393\s*813\s*5085'), '039 888 2041'),
    # tel: link
    (re.compile(r'tel:\+?393938135085'), 'tel:+390398882041'),
    # JSON-LD telephone in pagine varie
    (re.compile(r'"telephone"\s*:\s*"\+39\s*393\s*813\s*5085"'), '"telephone": "+39 039 888 2041"'),
    # CTA wording
    (re.compile(r'Parla con Tecnico', re.IGNORECASE), 'Parla con un tecnico'),
    # Email prioritaria
    (re.compile(r'andrea@bulltech\.it', re.IGNORECASE), 'info@it-era.it'),
    # WhatsApp -> Chat
    (re.compile(r'WhatsApp Business', re.IGNORECASE), 'Chatta con noi'),
    (re.compile(r'Scrivi su WhatsApp', re.IGNORECASE), 'Chatta con noi'),
    (re.compile(r'https://wa\.me/\d+[^"\s]*'), '/pages/chat.html'),
]

EXCLUDE_EXT = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.pdf'}


def process_file(path: Path):
    try:
        if path.suffix.lower() in EXCLUDE_EXT:
            return False
        text = path.read_text(encoding='utf-8')
        original = text
        for pattern, repl in REPLACEMENTS:
            text = pattern.sub(repl, text)
        if text != original:
            path.write_text(text, encoding='utf-8')
            print(f"[UPDATED] {path}")
            return True
    except Exception as e:
        print(f"[SKIP] {path} ({e})")
    return False


def main():
    changed = 0
    for base in TARGET_DIRS:
        for p in base.rglob('*'):
            if p.is_file():
                if process_file(p):
                    changed += 1
    print(f"Done. Files updated: {changed}")

if __name__ == '__main__':
    main()

