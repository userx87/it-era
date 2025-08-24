#!/usr/bin/env python3
"""
COMPLETE PC Repair Page Generator for ALL Lombardy municipalities
Generates ALL 1,397+ riparazione-pc landing pages using complete JSON database
"""
import os
import re
import json
from pathlib import Path

def normalize_city_name(slug):
    """Convert slug to proper Italian city name with comprehensive mapping"""
    
    # Extensive special cases mapping for proper Italian city names
    special_cases = {
        # Standard apostrophes and accents
        'd-adda': "d'Adda",
        'd-alme': "d'Almè", 
        'cantu': 'Cantù',
        
        # Multi-word city names
        'san-pellegrino-terme': 'San Pellegrino Terme',
        'alzano-lombardo': 'Alzano Lombardo',
        'castione-della-presolana': 'Castione della Presolana',
        'almenno-san-bartolomeo': 'Almenno San Bartolomeo',
        'almenno-san-salvatore': 'Almenno San Salvatore',
        'cazzano-sant-andrea': "Cazzano Sant'Andrea",
        'sant-angelo-lodigiano': "Sant'Angelo Lodigiano",
        'sant-omobono-terme': "Sant'Omobono Terme",
        'sesto-san-giovanni': 'Sesto San Giovanni',
        'trezzano-sul-naviglio': 'Trezzano sul Naviglio',
        'tavazzano-con-villavesco': 'Tavazzano con Villavesco',
        'trescore-cremasco': 'Trescore Cremasco',
        'vedano-al-lambro': 'Vedano al Lambro',
        'verano-brianza': 'Verano Brianza',
        
        # Geographic specifications
        'pieve-emanuele': 'Pieve Emanuele',
        'pieve-fissiraga': 'Pieve Fissiraga',
        'usmate-velate': 'Usmate Velate',
        'besana-in-brianza': 'Besana in Brianza',
        'annone-di-brianza': 'Annone di Brianza',
        'la-valletta-brianza': 'La Valletta Brianza',
        'cavenago-di-brianza': 'Cavenago di Brianza',
        'castello-di-brianza': 'Castello di Brianza',
        'carate-brianza': 'Carate Brianza',
        'novate-brianza': 'Novate Brianza',
        'ronco-briantino': 'Ronco Briantino',
        
        # Val/Valle names
        'valmadrera': 'Valmadrera',
        'alta-valle-intelvi': 'Alta Valle Intelvi',
        'centro-valle-intelvi': 'Centro Valle Intelvi',
        'costa-valle-imagna': 'Costa Valle Imagna',
        'fuipiano-valle-imagna': 'Fuipiano Valle Imagna',
        'cassina-valsassina': 'Cassina Valsassina',
        'crandola-valsassina': 'Crandola Valsassina',
        'ferrera-di-varese': 'Ferrera di Varese',
        
        # Compound geographical names
        'fino-del-monte': 'Fino del Monte',
        'fino-mornasco': 'Fino Mornasco',
        'costa-di-mezzate': 'Costa di Mezzate',
        'costa-masnaga': 'Costa Masnaga',
        'costa-serina': 'Costa Serina',
        'costa-volpino': 'Costa Volpino',
        'villa-di-serio': 'Villa di Serio',
        'villa-d-alme': "Villa d'Almè",
        'borgo-di-terzo': 'Borgo di Terzo',
        
        # Rivers and geographical features
        'cornate-d-adda': "Cornate d'Adda",
        'arzago-d-adda': "Arzago d'Adda",
        'rivolta-d-adda': "Rivolta d'Adda",
        'casirate-d-adda': "Casirate d'Adda",
        'castiglione-d-adda': "Castiglione d'Adda",
        'spino-d-adda': "Spino d'Adda",
        'fara-gera-d-adda': "Fara Gera d'Adda",
        'brignano-gera-d-adda': "Brignano Gera d'Adda",
        'misano-di-gera-d-adda': "Misano di Gera d'Adda",
        
        # Naviglio references
        'robecco-sul-naviglio': 'Robecco sul Naviglio',
        'cernusco-sul-naviglio': 'Cernusco sul Naviglio',
        'cumignano-sul-naviglio': 'Cumignano sul Naviglio',
        
        # Ticino river references
        'bernate-ticino': 'Bernate Ticino',
        'boffalora-sopra-ticino': 'Boffalora sopra Ticino',
        'carbonara-al-ticino': 'Carbonara al Ticino',
        'casorate-sempione': 'Casorate Sempione',
        
        # Po river references  
        'arena-po': 'Arena Po',
        'chignolo-po': 'Chignolo Po',
        'martignana-di-po': 'Martignana di Po',
        
        # Serio river references
        'fiorano-al-serio': 'Fiorano al Serio',
        'cologno-al-serio': 'Cologno al Serio',
        'orio-al-serio': 'Orio al Serio',
        
        # Lambro references
        'cerro-al-lambro': 'Cerro al Lambro',
        
        # Seveso references
        'lentate-sul-seveso': 'Lentate sul Seveso',
        
        # Garda lake references
        'lonato-del-garda': 'Lonato del Garda',
        'limone-sul-garda': 'Limone sul Garda',
        'desenzano-del-garda': 'Desenzano del Garda',
        'manerba-del-garda': 'Manerba del Garda',
        'moniga-del-garda': 'Moniga del Garda',
        
        # Special geographical terms
        'mandello-del-lario': 'Mandello del Lario',
        'gera-lario': 'Gera Lario',
        'dosso-del-liro': 'Dosso del Liro',
        'bene-lario': 'Bene Lario',
        'faggeto-lario': 'Faggeto Lario',
        'esino-lario': 'Esino Lario',
        'lezzeno': 'Lezzeno',
        
        # Monte/mountain references
        'monte-isola': 'Monte Isola',
        'monte-cremasco': 'Monte Cremasco',
        'monte-marenzo': 'Monte Marenzo',
        'cuasso-al-monte': 'Cuasso al Monte',
        'grumello-del-monte': 'Grumello del Monte',
        
        # Complex compound names
        'cassinetta-di-lugagnano': 'Cassinetta di Lugagnano',
        'locate-di-triulzi': 'Locate di Triulzi',
        'inverno-e-monteleone': 'Inverno e Monteleone',
        'corteolona-e-genzone': 'Corteolona e Genzone',
        'colli-verdi': 'Colli Verdi',
        'grandate': 'Grandate',
        'grandola-ed-uniti': 'Grandola ed Uniti',
        'gravedona-ed-uniti': 'Gravedona ed Uniti',
        'casalbuttano-ed-uniti': 'Casalbuttano ed Uniti',
        'grumello-cremonese-ed-uniti': 'Grumello Cremonese ed Uniti',
        
        # Thermal/spa towns
        'darfo-boario-terme': 'Darfo Boario Terme',
        'sant-omobono-terme': "Sant'Omobono Terme",
        'san-pellegrino-terme': 'San Pellegrino Terme',
        'miradolo-terme': 'Miradolo Terme',
        'gaverina-terme': 'Gaverina Terme',
        'godiasco-salice-terme': 'Godiasco Salice Terme',
        'angolo-terme': 'Angolo Terme',
        
        # Cities with special characters or formatting
        'campione-ditalia': "Campione d'Italia",
        'chieve': 'Chieve',
        'cigole': 'Cigole',
        'colere': 'Colere',
        
        # Names requiring specific capitalization
        'muggio': 'Muggiò',
        'fenegrò': 'Fenegrò'
    }
    
    if slug in special_cases:
        return special_cases[slug]
    
    # Standard conversion: replace - with space and title case
    return slug.replace('-', ' ').title()

def load_complete_lombardy_cities():
    """Load ALL Lombardy cities from complete JSON database"""
    json_file = Path('/Users/andreapanzeri/progetti/IT-ERA/data/cities-lombardy-complete.json')
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            province_data = json.load(f)
        
        all_cities = {}
        total_count = 0
        
        for province_code, info in province_data.items():
            province_name = info.get('name', 'Unknown')
            cities = info.get('cities', [])
            
            for city_slug in cities:
                city_name = normalize_city_name(city_slug)
                all_cities[city_slug] = {
                    'name': city_name,
                    'slug': city_slug,
                    'province': province_name,
                    'province_code': province_code
                }
                total_count += 1
            
            print(f"   {province_code} ({province_name}): {len(cities)} cities")
        
        print(f"✅ Loaded {total_count} total cities from complete JSON database")
        return all_cities
        
    except Exception as e:
        print(f"❌ Error loading complete cities: {e}")
        return {}

def validate_content(content, city_name):
    """Validate that all placeholders have been replaced"""
    placeholders = re.findall(r'\{\{[^}]+\}\}', content)
    if placeholders:
        print(f"⚠️ Unreplaced placeholders found in {city_name}: {placeholders}")
        return False
    return True

def generate_page(template_content, city_data):
    """Generate a single PC repair page with proper placeholder replacement"""
    city_name = city_data['name']
    city_slug = city_data['slug'] 
    province_name = city_data['province']
    province_code = city_data['province_code']
    
    # Replace all placeholders
    content = template_content.replace('{{CITY}}', city_name)
    content = content.replace('{{CITY_SLUG}}', city_slug)
    content = content.replace('{{REGION}}', 'Lombardia')
    content = content.replace('{{REGION_CODE}}', 'LOM')
    content = content.replace('{{PROVINCE}}', province_code)
    content = content.replace('{{PROVINCE_NAME}}', province_name)
    
    return content

def main():
    """Main generation function - ALL PC REPAIR PAGES"""
    print("🔧 IT-ERA COMPLETE PC Repair Page Generator")
    print("=" * 70)
    print("📋 Generating riparazione-pc pages for ALL 1,397+ Lombardy municipalities")
    print("=" * 70)
    
    # Paths
    template_path = Path('/Users/andreapanzeri/progetti/IT-ERA/templates/riparazione-pc-template.html')
    output_dir = Path('/Users/andreapanzeri/progetti/IT-ERA/tests/puppeteer-validation/web/pages')
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load template
    if not template_path.exists():
        print(f"❌ Template not found: {template_path}")
        return
    
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()
        print(f"✅ Loaded template: {template_path}")
    except Exception as e:
        print(f"❌ Error reading template: {e}")
        return
    
    # Check for required placeholders
    required_placeholders = ['{{CITY}}', '{{CITY_SLUG}}', '{{REGION}}']
    missing_placeholders = []
    for placeholder in required_placeholders:
        if placeholder not in template_content:
            missing_placeholders.append(placeholder)
    
    if missing_placeholders:
        print(f"⚠️ Missing required placeholders: {missing_placeholders}")
    else:
        print("✅ All required placeholders found in template")
    
    # Load ALL cities from complete database
    print("\n📍 Loading ALL Lombardy cities from complete database...")
    cities = load_complete_lombardy_cities()
    if not cities:
        print("❌ No cities loaded. Exiting.")
        return
    
    # Generate pages for ALL cities
    generated_count = 0
    validation_errors = 0
    total_errors = 0
    
    print(f"\n🏭 Generating PC repair pages for {len(cities)} cities...")
    print("-" * 70)
    
    for i, (city_slug, city_data) in enumerate(cities.items(), 1):
        try:
            # Generate page content
            page_content = generate_page(template_content, city_data)
            
            # Validate content
            if not validate_content(page_content, city_data['name']):
                validation_errors += 1
            
            # Save to file
            output_filename = f"riparazione-pc-{city_slug}.html"
            output_path = output_dir / output_filename
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(page_content)
            
            if i <= 50 or i % 100 == 0 or i in [len(cities) - 2, len(cities) - 1, len(cities)]:
                print(f"✅ [{i:4d}/{len(cities)}] {output_filename} → {city_data['name']} ({city_data['province_code']})")
            
            generated_count += 1
            
        except Exception as e:
            print(f"❌ [{i:4d}/{len(cities)}] Error generating for {city_slug}: {e}")
            total_errors += 1
    
    print("\n" + "=" * 70)
    print("📊 COMPLETE PC REPAIR PAGE GENERATION SUMMARY")
    print("=" * 70)
    print(f"✅ Pages generated: {generated_count}")
    print(f"⚠️ Validation errors: {validation_errors}")
    print(f"❌ Generation errors: {total_errors}")
    print(f"📁 Output directory: {output_dir}")
    
    if generated_count > 0:
        success_rate = (generated_count / len(cities)) * 100
        print(f"\n🎉 SUCCESS! {generated_count}/{len(cities)} PC repair pages generated ({success_rate:.1f}% success rate)")
        
        # Sample page verification
        sample_cities = ['milano', 'bergamo', 'segrate', 'como', 'brescia', 'monza']
        existing_samples = []
        
        for city in sample_cities:
            sample_path = output_dir / f"riparazione-pc-{city}.html"
            if sample_path.exists():
                existing_samples.append(city)
        
        if existing_samples:
            print(f"🔍 Sample cities verified: {', '.join(existing_samples)}")
        
        print(f"\n📈 Coverage Statistics:")
        province_stats = {}
        for city_data in cities.values():
            pc = city_data['province_code']
            if pc not in province_stats:
                province_stats[pc] = 0
            province_stats[pc] += 1
        
        for pc, count in sorted(province_stats.items()):
            print(f"   {pc}: {count} cities")
        
        print(f"\n🔍 Next steps:")
        print(f"   1. Review generated pages in {output_dir}")
        print(f"   2. Validate sample pages: {', '.join(sample_cities)}")
        print(f"   3. Check placeholder replacement across all pages")
        print(f"   4. Verify SEO structure and content quality")
        print(f"   5. Test mobile responsiveness")
        
        if validation_errors > 0:
            print(f"⚠️ Note: {validation_errors} pages had validation warnings - check for unreplaced placeholders")
    else:
        print("\n❌ No pages were generated. Check the errors above.")

if __name__ == '__main__':
    main()