#!/usr/bin/env python3
"""
Extract and analyze Lombardy cities from IT-ERA landing pages.
Creates comprehensive cities database with service mapping.
"""

import os
import re
import json
from collections import defaultdict
from pathlib import Path

def normalize_city_name(slug):
    """Convert URL slug to proper city name."""
    # Handle special cases
    special_cases = {
        'd-adda': "D'Adda",
        'la-valletta-brianza': 'La Valletta Brianza',
        'san-pellegrino-terme': 'San Pellegrino Terme',
        'sant-angelo-lodigiano': "Sant'Angelo Lodigiano",
        'sant-omobono-terme': "Sant'Omobono Terme",
        'villa-d-alme': "Villa d'Almè",
        'villa-di-serio': 'Villa di Serio',
        'monte-cremasco': 'Monte Cremasco',
        'monza-e-brianza': 'Monza e Brianza',
    }
    
    if slug in special_cases:
        return special_cases[slug]
    
    # Convert dashes to spaces and capitalize each word
    name = slug.replace('-', ' ').title()
    
    # Handle Italian articles and prepositions
    articles = ['di', 'del', 'della', 'dei', 'delle', 'da', 'dal', 'dalla', 'in', 'al', 'allo', 'alla', 'con', 'sul', 'sulla', 'sopra', 'sotto']
    words = name.split()
    result = []
    
    for i, word in enumerate(words):
        if i > 0 and word.lower() in articles:
            result.append(word.lower())
        else:
            result.append(word)
    
    return ' '.join(result)

def get_province_mapping():
    """Map cities to their provinces based on known Lombardy administrative divisions."""
    return {
        # Province of Milan (MI)
        'milano': 'MI', 'abbiategrasso': 'MI', 'assago': 'MI', 'basiglio': 'MI', 
        'besate': 'MI', 'binasco': 'MI', 'bollate': 'MI', 'bresso': 'MI', 
        'buccinasco': 'MI', 'bubbiano': 'MI', 'calvignasco': 'MI', 'cambiago': 'MI',
        'cesano-boscone': 'MI', 'cinisello-balsamo': 'MI', 'cislago': 'MI', 
        'cologno-monzese': 'MI', 'cormano': 'MI', 'corsico': 'MI', 'cusano-milanino': 'MI',
        'garbagnate-milanese': 'MI', 'lacchiarella': 'MI', 'locate-di-triulzi': 'MI',
        'morimondo': 'MI', 'nova-milanese': 'MI', 'noviglio': 'MI', 'opera': 'MI',
        'paderno-dugnano': 'MI', 'pieve-emanuele': 'MI', 'rho': 'MI', 'rosate': 'MI',
        'rozzano': 'MI', 'senago': 'MI', 'sesto-san-giovanni': 'MI', 'solaro': 'MI',
        'trezzano-sul-naviglio': 'MI', 'zibido-san-giacomo': 'MI',
        
        # Province of Como (CO)
        'como': 'CO', 'appiano-gentile': 'CO', 'bregnano': 'CO', 'bulgarograsso': 'CO',
        'cabiate': 'CO', 'cadorago': 'CO', 'cantu': 'CO', 'capiago-intimiano': 'CO',
        'carbonate': 'CO', 'carimate': 'CO', 'caronno-pertusella': 'CO', 'cermenate': 'CO',
        'cirimido': 'CO', 'fenegro': 'CO', 'figino-serenza': 'CO', 'fino-mornasco': 'CO',
        'gerenzano': 'CO', 'lambrugo': 'CO', 'limido-comasco': 'CO', 'lomazzo': 'CO',
        'lurate-caccivio': 'CO', 'mariano-comense': 'CO', 'montorfano': 'CO', 
        'mozzate': 'CO', 'novedrate': 'CO', 'olgiate-comasco': 'CO', 'origgio': 'CO',
        'rovello-porro': 'CO', 'rovellasca': 'CO', 'saronno': 'CO', 'senna-comasco': 'CO',
        'turate': 'CO', 'uboldo': 'CO', 'veniano': 'CO', 'locate-varesino': 'CO',
        
        # Province of Bergamo (BG)
        'bergamo': 'BG', 'albino': 'BG', 'almenno-san-bartolomeo': 'BG', 'alzano-lombardo': 'BG',
        'caravaggio': 'BG', 'casirate-d-adda': 'BG', 'casnigo': 'BG', 'castione-della-presolana': 'BG',
        'cazzano-sant-andrea': 'BG', 'clusone': 'BG', 'colzate': 'BG', 'curno': 'BG',
        'dalmine': 'BG', 'fara-gera-d-adda': 'BG', 'fiorano-al-serio': 'BG', 'gandino': 'BG',
        'gazzaniga': 'BG', 'gorle': 'BG', 'grassobbio': 'BG', 'leffe': 'BG', 'lurano': 'BG',
        'mozzo': 'BG', 'nembro': 'BG', 'orio-al-serio': 'BG', 'osio-sotto': 'BG', 
        'pagazzano': 'BG', 'paladina': 'BG', 'parre': 'BG', 'pedrengo': 'BG',
        'ponte-nossa': 'BG', 'ponte-san-pietro': 'BG', 'pradalunga': 'BG', 'ranica': 'BG',
        'romano-di-lombardia': 'BG', 'san-pellegrino-terme': 'BG', 'scanzorosciate': 'BG',
        'seriate': 'BG', 'spirano': 'BG', 'stezzano': 'BG', 'torre-boldone': 'BG',
        'treviglio': 'BG', 'verdellino': 'BG', 'vertova': 'BG', 'villa-d-alme': 'BG',
        'villa-di-serio': 'BG', 'zanica': 'BG', 'zogno': 'BG', 'brignano-gera-d-adda': 'BG',
        
        # Province of Monza and Brianza (MB)
        'monza': 'MB', 'agrate-brianza': 'MB', 'aicurzio': 'MB', 'albiate': 'MB', 
        'arcore': 'MB', 'barlassina': 'MB', 'bellusco': 'MB', 'bernareggio': 'MB',
        'besana-in-brianza': 'MB', 'biassono': 'MB', 'bovisio-masciago': 'MB', 'brenna': 'MB',
        'brugherio': 'MB', 'burago-di-molgora': 'MB', 'busnago': 'MB', 'camparada': 'MB',
        'carate-brianza': 'MB', 'carnate': 'MB', 'carugo': 'MB', 'cavenago-di-brianza': 'MB',
        'ceriano-laghetto': 'MB', 'cesano-maderno': 'MB', 'cesate': 'MB', 'cogliate': 'MB',
        'concorezzo': 'MB', 'correzzana': 'MB', 'desio': 'MB', 'giussano': 'MB',
        'lazzate': 'MB', 'lentate-sul-seveso': 'MB', 'lesmo': 'MB', 'limbiate': 'MB',
        'lissone': 'MB', 'macherio': 'MB', 'meda': 'MB', 'mezzago': 'MB', 'misinto': 'MB',
        'muggio': 'MB', 'nova-milanese': 'MB', 'ornago': 'MB', 'renate': 'MB',
        'ronco-briantino': 'MB', 'seregno': 'MB', 'seveso': 'MB', 'sovico': 'MB',
        'sulbiate': 'MB', 'triuggio': 'MB', 'usmate-velate': 'MB', 'varedo': 'MB',
        'vedano-al-lambro': 'MB', 'verano-brianza': 'MB', 'villasanta': 'MB', 
        'vimercate': 'MB', 'novate-brianza': 'MB', 'la-valletta-brianza': 'MB',
        'annone-di-brianza': 'MB', 'arosio': 'MB', 'inverigo': 'MB',
        
        # Province of Lecco (LC)
        'lecco': 'LC', 'abbadia-lariana': 'LC', 'airuno': 'LC', 'ballabio': 'LC',
        'barzago': 'LC', 'barzio': 'LC', 'bellano': 'LC', 'calolziocorte': 'LC',
        'casatenovo': 'LC', 'cassina-valsassina': 'LC', 'colico': 'LC', 'cortenova': 'LC',
        'costa-masnaga': 'LC', 'cremeno': 'LC', 'dervio': 'LC', 'dolzago': 'LC',
        'ello': 'LC', 'garlate': 'LC', 'introbio': 'LC', 'lierna': 'LC', 'malgrate': 'LC',
        'mandello-del-lario': 'LC', 'merate': 'LC', 'moggio': 'LC', 'monte-marenzo': 'LC',
        'montevecchia': 'LC', 'morterone': 'LC', 'nibionno': 'LC', 'oggiono': 'LC',
        'olginate': 'LC', 'osnago': 'LC', 'pasturo': 'LC', 'perledo': 'LC',
        'premana': 'LC', 'premolo': 'LC', 'primaluna': 'LC', 'rogeno': 'LC',
        'taceno': 'LC', 'valmadrera': 'LC', 'varenna': 'LC', 'cernusco-lombardone': 'LC',
        'masate': 'LC',
        
        # Province of Lodi (LO)
        'lodi': 'LO', 'borghetto-lodigiano': 'LO', 'casalpusterlengo': 'LO', 'codogno': 'LO',
        'dovera': 'LO', 'fombio': 'LO', 'maleo': 'LO', 'montanaso-lombardo': 'LO',
        'ossago-lodigiano': 'LO', 'san-fiorano': 'LO', 'sant-angelo-lodigiano': 'LO',
        'somaglia': 'LO', 'tavazzano-con-villavesco': 'LO', 'zelo-buon-persico': 'LO',
        'lodi-vecchio': 'LO',
        
        # Province of Cremona (CR)
        'crema': 'CR', 'agnadello': 'CR', 'bariano': 'CR', 'calvenzano': 'CR', 
        'castiglione-d-adda': 'CR', 'covo': 'CR', 'formigara': 'CR', 'offanengo': 'CR',
        'pandino': 'CR', 'pizzighettone': 'CR', 'rivolta-d-adda': 'CR', 'spino-d-adda': 'CR',
        'torlasco': 'CR', 'trescore-cremasco': 'CR', 'vaiano-cremasco': 'CR',
        'misano-di-gera-d-adda': 'CR',
        
        # Province of Pavia (PV) - limited cities in the list
        'roncello': 'PV',
        
        # Province of Varese (VA) - limited cities
        'sant-omobono-terme': 'BG',
        
        # Additional cities that might need manual mapping
        'anzano-del-parco': 'CO',
        'arzago-d-adda': 'BG',
        'basiano': 'MI',
        'brianza': 'MB',  # Generic region reference
    }

def extract_cities_from_pages():
    """Extract city information from all landing pages."""
    pages_dir = Path('/Users/andreapanzeri/progetti/IT-ERA/web/pages')
    
    # Service patterns
    service_patterns = {
        'assistenza': r'^assistenza-it-(.+)\.html$',
        'sicurezza': r'^sicurezza-informatica-(.+)\.html$', 
        'cloud': r'^cloud-storage-(.+)\.html$'
    }
    
    cities_data = defaultdict(lambda: {
        'name': '',
        'slug': '',
        'province': '',
        'services': []
    })
    
    province_map = get_province_mapping()
    
    # Process each HTML file
    for html_file in pages_dir.glob('*.html'):
        filename = html_file.name
        
        # Skip non-city files
        if filename.startswith('seo-') or filename in ['index.html', 'sitemap.html']:
            continue
            
        # Check which service this file belongs to
        for service, pattern in service_patterns.items():
            match = re.match(pattern, filename)
            if match:
                slug = match.group(1)
                
                # Skip generic slugs that aren't actual cities
                if slug in ['brianza', 'monza-e-brianza', 'd-adda']:
                    continue
                
                city_name = normalize_city_name(slug)
                province = province_map.get(slug, 'Unknown')
                
                # Update city data
                cities_data[slug]['name'] = city_name
                cities_data[slug]['slug'] = slug
                cities_data[slug]['province'] = province
                
                if service not in cities_data[slug]['services']:
                    cities_data[slug]['services'].append(service)
                
                break
    
    return cities_data

def analyze_coverage(cities_data):
    """Analyze service coverage across cities."""
    stats = {
        'total_cities': len(cities_data),
        'provinces': defaultdict(int),
        'service_coverage': {
            'all_three': 0,
            'two_services': 0,
            'one_service': 0
        },
        'services_count': {
            'assistenza': 0,
            'sicurezza': 0,
            'cloud': 0
        },
        'incomplete_cities': []
    }
    
    for slug, city in cities_data.items():
        # Count by province
        stats['provinces'][city['province']] += 1
        
        # Count services per city
        service_count = len(city['services'])
        if service_count == 3:
            stats['service_coverage']['all_three'] += 1
        elif service_count == 2:
            stats['service_coverage']['two_services'] += 1
        else:
            stats['service_coverage']['one_service'] += 1
            stats['incomplete_cities'].append({
                'name': city['name'],
                'slug': slug,
                'missing_services': [s for s in ['assistenza', 'sicurezza', 'cloud'] 
                                   if s not in city['services']]
            })
        
        # Count individual services
        for service in city['services']:
            stats['services_count'][service] += 1
    
    # Calculate coverage percentage
    stats['coverage_percentage'] = round((stats['service_coverage']['all_three'] / stats['total_cities']) * 100, 2)
    
    return stats

def main():
    """Main extraction and analysis function."""
    print("🔍 Extracting city data from IT-ERA landing pages...")
    
    cities_data = extract_cities_from_pages()
    stats = analyze_coverage(cities_data)
    
    # Convert to final format
    cities_list = []
    for slug, city in sorted(cities_data.items()):
        cities_list.append({
            'name': city['name'],
            'slug': city['slug'],
            'province': city['province'],
            'services': sorted(city['services'])
        })
    
    # Create final data structure
    final_data = {
        'cities': cities_list,
        'stats': {
            'total_cities': stats['total_cities'],
            'coverage_percentage': f"{stats['coverage_percentage']}%",
            'provinces': dict(stats['provinces']),
            'service_coverage': stats['service_coverage'],
            'services_count': stats['services_count'],
            'incomplete_cities_count': len(stats['incomplete_cities'])
        },
        'incomplete_cities': stats['incomplete_cities']
    }
    
    # Save to JSON file
    output_file = Path('/Users/andreapanzeri/progetti/IT-ERA/data/cities-lombardy.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ City data extracted successfully!")
    print(f"📊 Analysis Summary:")
    print(f"   • Total cities: {stats['total_cities']}")
    print(f"   • Complete coverage (all 3 services): {stats['service_coverage']['all_three']} cities ({stats['coverage_percentage']}%)")
    print(f"   • Provinces covered: {len(stats['provinces'])}")
    print(f"   • Service counts:")
    print(f"     - Assistenza IT: {stats['services_count']['assistenza']} cities")
    print(f"     - Sicurezza Informatica: {stats['services_count']['sicurezza']} cities")
    print(f"     - Cloud Storage: {stats['services_count']['cloud']} cities")
    
    if stats['incomplete_cities']:
        print(f"   • Cities with incomplete coverage: {len(stats['incomplete_cities'])}")
    
    print(f"   • Data saved to: {output_file}")

if __name__ == "__main__":
    main()