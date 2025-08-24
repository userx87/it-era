#!/usr/bin/env python3
"""
Fix Landing Pages Script
Corregge il problema del placeholder {CITTA} non sostituito e rigenera le pagine corrette.
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Tuple
import shutil
from datetime import datetime

# Configurazione paths
BASE_DIR = Path("/Users/andreapanzeri/progetti/IT-ERA")
PAGES_DIR = BASE_DIR / "web" / "pages"
PAGES_DRAFT_DIR = BASE_DIR / "web" / "pages-draft"
BACKUP_DIR = BASE_DIR / "backup" / f"fix_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

# Template selezionati come base
TEMPLATES = {
    "assistenza-it": PAGES_DIR / "assistenza-it-milano.html",
    "cloud-storage": PAGES_DRAFT_DIR / "cloud-storage-bergamo.html",  
    "sicurezza-informatica": PAGES_DIR / "sicurezza-informatica-milano.html"
}

# Mappatura città -> provincia
PROVINCE_MAP = {
    # Milano
    "milano": "Milano",
    "sesto-san-giovanni": "Milano",
    "cinisello-balsamo": "Milano",
    "corsico": "Milano",
    "segrate": "Milano",
    "rozzano": "Milano",
    "assago": "Milano",
    
    # Bergamo
    "bergamo": "Bergamo",
    "treviglio": "Bergamo",
    "seriate": "Bergamo",
    "albino": "Bergamo",
    "dalmine": "Bergamo",
    
    # Lecco
    "lecco": "Lecco",
    "merate": "Lecco",
    "calolziocorte": "Lecco",
    "valmadrera": "Lecco",
    "oggiono": "Lecco",
    
    # Como
    "como": "Como",
    "cantu": "Como",
    "mariano-comense": "Como",
    "erba": "Como",
    
    # Monza e Brianza
    "monza": "Monza e Brianza",
    "lissone": "Monza e Brianza",
    "seregno": "Monza e Brianza",
    "desio": "Monza e Brianza",
    "vimercate": "Monza e Brianza",
    "brugherio": "Monza e Brianza",
    
    # Lodi
    "lodi": "Lodi",
    "codogno": "Lodi",
    "casalpusterlengo": "Lodi",
}

def infer_provincia(citta_slug: str) -> str:
    """Inferisce la provincia dalla città."""
    return PROVINCE_MAP.get(citta_slug, "Lombardia")

def get_all_pages() -> List[Path]:
    """Ottiene tutte le pagine HTML che necessitano fix."""
    pages = []
    for service in ["assistenza-it", "cloud-storage", "sicurezza-informatica"]:
        pages.extend(PAGES_DIR.glob(f"{service}-*.html"))
        pages.extend(PAGES_DRAFT_DIR.glob(f"{service}-*.html"))
    return pages

def extract_city_info(filepath: Path) -> Tuple[str, str, str]:
    """Estrae informazioni città dal nome file."""
    filename = filepath.stem
    parts = filename.split("-", 2)
    
    if len(parts) >= 3:
        service = f"{parts[0]}-{parts[1]}"  # es. "assistenza-it"
        city_slug = parts[2]  # es. "milano"
        city_name = city_slug.replace("-", " ").title()  # es. "Milano"
        return service, city_slug, city_name
    return None, None, None

def fix_placeholders(content: str, city_name: str, city_slug: str) -> str:
    """Corregge tutti i placeholder non sostituiti."""
    provincia = infer_provincia(city_slug)
    
    # Fix placeholder con singole graffe
    replacements = {
        "{CITTA}": city_name,
        "{PROVINCIA}": provincia,
        "{SLUG}": city_slug,
    }
    
    for placeholder, value in replacements.items():
        content = content.replace(placeholder, value)
    
    # Fix anche eventuali doppie graffe rimaste
    for placeholder, value in replacements.items():
        double_placeholder = "{" + placeholder + "}"
        content = content.replace(double_placeholder, value)
    
    # Fix specifici per contenuti
    # Correggi duplicati in areaServed
    content = re.sub(
        r'"areaServed": \["([^"]+)", "\1"(, [^]]+)?\]',
        rf'"areaServed": ["\1", "{provincia}", "Brianza"]',
        content
    )
    
    return content

def create_backup():
    """Crea backup delle pagine prima delle modifiche."""
    print(f"📦 Creando backup in {BACKUP_DIR}")
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    
    for page in get_all_pages():
        relative_path = page.relative_to(BASE_DIR / "web")
        backup_path = BACKUP_DIR / relative_path
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(page, backup_path)

def fix_single_page(filepath: Path, dry_run: bool = False) -> bool:
    """Corregge una singola pagina."""
    service, city_slug, city_name = extract_city_info(filepath)
    
    if not service or not city_slug:
        print(f"⚠️  Non riesco a processare: {filepath.name}")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Controlla se ci sono placeholder non sostituiti
        if "{CITTA}" in content or "{PROVINCIA}" in content or "{SLUG}" in content:
            print(f"🔧 Fixing: {filepath.name}")
            
            # Applica correzioni
            fixed_content = fix_placeholders(content, city_name, city_slug)
            
            if not dry_run:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                print(f"✅ Corretto: {filepath.name}")
            else:
                print(f"🔍 [DRY RUN] Correggerebbe: {filepath.name}")
            
            return True
        else:
            print(f"✓  Già corretto: {filepath.name}")
            return False
            
    except Exception as e:
        print(f"❌ Errore processando {filepath.name}: {e}")
        return False

def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fix landing pages con placeholder non sostituiti")
    parser.add_argument("--dry-run", action="store_true", help="Simula l'esecuzione senza modificare file")
    parser.add_argument("--no-backup", action="store_true", help="Non creare backup")
    parser.add_argument("--single", type=str, help="Processa solo un file specifico")
    
    args = parser.parse_args()
    
    print("🚀 Fix Landing Pages - Inizio processo")
    print("=" * 50)
    
    # Backup
    if not args.no_backup and not args.dry_run:
        create_backup()
    
    # Processa pagine
    if args.single:
        filepath = Path(args.single)
        if filepath.exists():
            fix_single_page(filepath, args.dry_run)
        else:
            print(f"❌ File non trovato: {args.single}")
    else:
        pages = get_all_pages()
        print(f"📄 Trovate {len(pages)} pagine da processare")
        
        fixed_count = 0
        for page in pages:
            if fix_single_page(page, args.dry_run):
                fixed_count += 1
        
        print("=" * 50)
        print(f"✨ Processo completato: {fixed_count} pagine corrette")
        
        if args.dry_run:
            print("ℹ️  Questo era un DRY RUN - nessun file è stato modificato")
            print("   Rimuovi --dry-run per applicare le modifiche")

if __name__ == "__main__":
    main()