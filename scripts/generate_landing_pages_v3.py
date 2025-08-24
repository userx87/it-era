#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import csv
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Tuple
import time
from datetime import datetime

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    replacements = {
        'à': 'a', 'è': 'e', 'é': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
        "'": '-', ' ': '-', '/': '-', '.': ''
    }
    text = text.lower()
    for old, new in replacements.items():
        text = text.replace(old, new)
    while '--' in text:
        text = text.replace('--', '-')
    return text.strip('-')

def get_provincia_for_city(city_name: str) -> str:
    """Get provincia for specific cities in Lombardy"""
    province_map = {
        # Milano e provincia
        'Milano': 'Milano', 'Abbiategrasso': 'Milano', 'Assago': 'Milano',
        'Basiglio': 'Milano', 'Binasco': 'Milano', 'Bollate': 'Milano',
        'Bresso': 'Milano', 'Buccinasco': 'Milano', 'Cesano Boscone': 'Milano',
        'Cesano Maderno': 'Monza e Brianza', 'Cesate': 'Milano',
        'Cinisello Balsamo': 'Milano', 'Cologno Monzese': 'Milano',
        'Cormano': 'Milano', 'Corsico': 'Milano', 'Cusano Milanino': 'Milano',
        'Garbagnate Milanese': 'Milano', 'Locate di Triulzi': 'Milano',
        'Opera': 'Milano', 'Paderno Dugnano': 'Milano', 'Pieve Emanuele': 'Milano',
        'Rho': 'Milano', 'Rozzano': 'Milano', 'San Giuliano Milanese': 'Milano',
        'Segrate': 'Milano', 'Senago': 'Milano', 'Sesto San Giovanni': 'Milano',
        'Trezzano sul Naviglio': 'Milano', 'Vimodrone': 'Milano',
        
        # Monza e Brianza
        'Monza': 'Monza e Brianza', 'Agrate Brianza': 'Monza e Brianza',
        'Arcore': 'Monza e Brianza', 'Besana in Brianza': 'Monza e Brianza',
        'Biassono': 'Monza e Brianza', 'Bovisio-Masciago': 'Monza e Brianza',
        'Brugherio': 'Monza e Brianza', 'Carate Brianza': 'Monza e Brianza',
        'Carnate': 'Monza e Brianza', 'Cavenago di Brianza': 'Monza e Brianza',
        'Concorezzo': 'Monza e Brianza', 'Desio': 'Monza e Brianza',
        'Giussano': 'Monza e Brianza', 'Lentate sul Seveso': 'Monza e Brianza',
        'Lissone': 'Monza e Brianza', 'Meda': 'Monza e Brianza',
        'Nova Milanese': 'Monza e Brianza', 'Seregno': 'Monza e Brianza',
        'Seveso': 'Monza e Brianza', 'Sovico': 'Monza e Brianza',
        'Varedo': 'Monza e Brianza', 'Vedano al Lambro': 'Monza e Brianza',
        'Vimercate': 'Monza e Brianza', 'Villasanta': 'Monza e Brianza',
        
        # Bergamo
        'Bergamo': 'Bergamo', 'Albino': 'Bergamo', 'Alzano Lombardo': 'Bergamo',
        'Caravaggio': 'Bergamo', 'Clusone': 'Bergamo', 'Dalmine': 'Bergamo',
        'Lovere': 'Bergamo', 'Nembro': 'Bergamo', 'Romano di Lombardia': 'Bergamo',
        'Seriate': 'Bergamo', 'Stezzano': 'Bergamo', 'Treviglio': 'Bergamo',
        'Zogno': 'Bergamo', 'Osio Sotto': 'Bergamo', 'Curno': 'Bergamo',
        
        # Como
        'Como': 'Como', 'Cantù': 'Como', 'Erba': 'Como', 'Mariano Comense': 'Como',
        'Olgiate Comasco': 'Como', 'Appiano Gentile': 'Como', 'Cermenate': 'Como',
        'Fino Mornasco': 'Como', 'Lomazzo': 'Como', 'Lurate Caccivio': 'Como',
        'Mozzate': 'Como', 'Turate': 'Como',
        
        # Lecco
        'Lecco': 'Lecco', 'Calolziocorte': 'Lecco', 'Casatenovo': 'Lecco',
        'Colico': 'Lecco', 'Merate': 'Lecco', 'Oggiono': 'Lecco',
        'Valmadrera': 'Lecco', 'Mandello del Lario': 'Lecco', 'Olginate': 'Lecco',
        
        # Lodi
        'Lodi': 'Lodi', 'Casalpusterlengo': 'Lodi', 'Codogno': 'Lodi',
        "Sant'Angelo Lodigiano": 'Lodi', 'Lodi Vecchio': 'Lodi',
        'Tavazzano con Villavesco': 'Lodi',
        
        # Cremona
        'Crema': 'Cremona', 'Pandino': 'Cremona', 'Rivolta d\'Adda': 'Cremona',
        'Spino d\'Adda': 'Cremona', 'Offanengo': 'Cremona',
    }
    
    # Default to city name if not found
    return province_map.get(city_name, 'Milano')

def load_template(template_path: str) -> str:
    """Load template file"""
    with open(template_path, 'r', encoding='utf-8') as f:
        return f.read()

def render_template(template: str, variables: Dict[str, str]) -> str:
    """Replace template variables with actual values"""
    html = template
    for key, value in variables.items():
        html = html.replace(f"{{{{{key}}}}}", value)
    return html

def generate_page(args: Tuple[str, str, str, str]) -> str:
    """Generate a single landing page"""
    city_name, service_type, template_content, output_dir = args
    
    try:
        # Get provincia and prepare variables
        provincia = get_provincia_for_city(city_name)
        city_slug = slugify(city_name)
        
        variables = {
            'CITTA': city_name,
            'PROVINCIA': provincia,
            'REGIONE': 'Lombardia',
            'SLUG': city_slug
        }
        
        # Render template
        html_content = render_template(template_content, variables)
        
        # Generate filename
        filename = f"{service_type}-{city_slug}.html"
        output_path = Path(output_dir) / filename
        
        # Write file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return f"✓ {filename}"
    except Exception as e:
        return f"✗ Error generating {city_name} for {service_type}: {str(e)}"

def main():
    print("=" * 60)
    print("GENERATORE LANDING PAGES v3.0 - CONTENUTI DIFFERENZIATI")
    print("=" * 60)
    
    # Setup paths
    base_dir = Path(__file__).parent.parent
    csv_path = base_dir / 'data' / 'comuni_master.csv'
    template_dir = base_dir / 'templates'
    output_dir = base_dir / 'web' / 'pages'
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Service configurations with DIFFERENT templates
    services = [
        {
            'type': 'assistenza-it',
            'template': 'assistenza-it-template-v2.html',
            'description': 'Assistenza IT - Help Desk e Supporto'
        },
        {
            'type': 'cloud-storage', 
            'template': 'cloud-storage-template-v2.html',
            'description': 'Cloud Storage - Backup e Disaster Recovery'
        },
        {
            'type': 'sicurezza-informatica',
            'template': 'sicurezza-informatica-template-v2.html', 
            'description': 'Sicurezza Informatica - Firewall e Protezione'
        }
    ]
    
    # Load cities from CSV
    cities = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('comune'):
                    cities.append(row['comune'])
        print(f"✓ Caricati {len(cities)} comuni dal CSV")
    except Exception as e:
        print(f"✗ Errore lettura CSV: {e}")
        return
    
    # Load templates
    templates = {}
    for service in services:
        template_path = template_dir / service['template']
        try:
            templates[service['type']] = load_template(str(template_path))
            print(f"✓ Template caricato: {service['description']}")
        except Exception as e:
            print(f"✗ Errore caricamento template {service['template']}: {e}")
            return
    
    # Prepare all tasks
    tasks = []
    for city in cities:
        for service in services:
            tasks.append((city, service['type'], templates[service['type']], str(output_dir)))
    
    total_pages = len(tasks)
    print(f"\n📊 Generazione di {total_pages} pagine ({len(cities)} città × {len(services)} servizi)")
    print("-" * 60)
    
    # Process with thread pool
    start_time = time.time()
    successful = 0
    failed = 0
    
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(generate_page, task) for task in tasks]
        
        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()
            if result.startswith('✓'):
                successful += 1
            else:
                failed += 1
                print(result)
            
            # Progress update every 50 pages
            if i % 50 == 0:
                elapsed = time.time() - start_time
                rate = i / elapsed
                remaining = (total_pages - i) / rate
                print(f"Progress: {i}/{total_pages} ({i*100/total_pages:.1f}%) - "
                      f"Speed: {rate:.1f} pages/sec - ETA: {remaining:.0f}s")
    
    # Final summary
    elapsed_time = time.time() - start_time
    print("\n" + "=" * 60)
    print("RIEPILOGO GENERAZIONE")
    print("-" * 60)
    print(f"✓ Pagine generate con successo: {successful}")
    if failed > 0:
        print(f"✗ Pagine con errori: {failed}")
    print(f"⏱ Tempo totale: {elapsed_time:.2f} secondi")
    print(f"⚡ Velocità: {successful/elapsed_time:.1f} pagine/secondo")
    
    # Service breakdown
    print("\n📁 Dettaglio per servizio:")
    for service in services:
        count = len([f for f in os.listdir(output_dir) 
                    if f.startswith(service['type'])])
        print(f"  • {service['description']}: {count} pagine")
    
    print("\n✅ Generazione completata!")
    print(f"📁 Le pagine sono state salvate in: {output_dir}")

if __name__ == "__main__":
    main()