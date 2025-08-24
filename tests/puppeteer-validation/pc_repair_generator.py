#!/usr/bin/env python3
"""
PC Repair Page Generator for Lombardy municipalities
Generates riparazione-pc landing pages using the corrected template
"""
import os
import re
import json
import csv
from pathlib import Path

def normalize_city_name(slug):
    """Convert slug to proper Italian city name"""
    special_cases = {
        'd-adda': "d'Adda",
        'cantu': 'Cantù', 
        'san-pellegrino-terme': 'San Pellegrino Terme',
        'alzano-lombardo': 'Alzano Lombardo',
        'castione-della-presolana': 'Castione della Presolana',
        'almenno-san-bartolomeo': 'Almenno San Bartolomeo',
        'cazzano-sant-andrea': "Cazzano Sant'Andrea",
        'sant-angelo-lodigiano': "Sant'Angelo Lodigiano",
        'sant-omobono-terme': "Sant'Omobono Terme",
        'pieve-emanuele': 'Pieve Emanuele',
        'pieve-fissiraga': 'Pieve Fissiraga',
        'sesto-san-giovanni': 'Sesto San Giovanni',
        'trezzano-sul-naviglio': 'Trezzano sul Naviglio',
        'tavazzano-con-villavesco': 'Tavazzano con Villavesco',
        'trescore-cremasco': 'Trescore Cremasco',
        'usmate-velate': 'Usmate Velate',
        'vedano-al-lambro': 'Vedano al Lambro',
        'verano-brianza': 'Verano Brianza'
    }
    
    if slug in special_cases:
        return special_cases[slug]
    
    # Standard conversion: replace - with space and title case
    return slug.replace('-', ' ').title()

def load_lombardy_cities():
    """Load unique Lombardy cities from CSV"""
    csv_file = Path('/Users/andreapanzeri/progetti/IT-ERA/data/comuni_master.csv')
    cities = {}
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                slug = row['slug_comune']
                province = row['provincia']
                city_name = row['comune']
                
                if slug not in cities:
                    cities[slug] = {
                        'name': city_name,
                        'province': province,
                        'slug': slug
                    }
        
        print(f"✅ Loaded {len(cities)} unique cities from CSV")
        return cities
        
    except Exception as e:
        print(f"❌ Error loading cities: {e}")
        return {}

def load_province_mapping():
    """Load province codes mapping"""
    json_file = Path('/Users/andreapanzeri/progetti/IT-ERA/data/cities-lombardy-complete.json')
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading province mapping: {e}")
        return {}

def get_province_code(province_name):
    """Map province name to code"""
    province_codes = {
        'Milano': 'MI',
        'Bergamo': 'BG',
        'Brescia': 'BS',
        'Como': 'CO',
        'Cremona': 'CR',
        'Lecco': 'LC',
        'Lodi': 'LO',
        'Mantova': 'MN',
        'Monza e Brianza': 'MB',
        'Pavia': 'PV',
        'Sondrio': 'SO',
        'Varese': 'VA'
    }
    return province_codes.get(province_name, 'MB')

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
    province_code = get_province_code(province_name)
    
    # Replace all placeholders
    content = template_content.replace('{{CITY}}', city_name)
    content = content.replace('{{CITY_SLUG}}', city_slug)
    content = content.replace('{{REGION}}', 'Lombardia')
    content = content.replace('{{REGION_CODE}}', 'LOM')
    content = content.replace('{{PROVINCE}}', province_code)
    content = content.replace('{{PROVINCE_NAME}}', province_name)
    
    return content

def main():
    """Main generation function - PC REPAIR PAGES"""
    print("🔧 IT-ERA PC Repair Page Generator")
    print("=" * 60)
    print("📋 Generating riparazione-pc pages for ALL Lombardy municipalities")
    print("=" * 60)
    
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
    required_placeholders = ['{{CITY}}', '{{CITY_SLUG}}', '{{REGION}}', '{{REGION_CODE}}', '{{PROVINCE}}']
    missing_placeholders = []
    for placeholder in required_placeholders:
        if placeholder not in template_content:
            missing_placeholders.append(placeholder)
    
    if missing_placeholders:
        print(f"⚠️ Missing required placeholders: {missing_placeholders}")
    else:
        print("✅ All required placeholders found in template")
    
    # Load cities
    print("\n📍 Loading Lombardy cities...")
    cities = load_lombardy_cities()
    if not cities:
        print("❌ No cities loaded. Exiting.")
        return
    
    print(f"✅ Processing {len(cities)} cities for PC repair pages...")
    
    # Generate pages
    generated_count = 0
    validation_errors = 0
    total_errors = 0
    
    print(f"\n🏭 Generating PC repair pages...")
    print("-" * 60)
    
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
            
            province_code = get_province_code(city_data['province'])
            print(f"✅ [{i:3d}/{len(cities)}] {output_filename} → {city_data['name']} ({province_code})")
            generated_count += 1
            
        except Exception as e:
            print(f"❌ [{i:3d}/{len(cities)}] Error generating for {city_slug}: {e}")
            total_errors += 1
    
    print("\n" + "=" * 60)
    print("📊 PC REPAIR PAGE GENERATION SUMMARY")
    print("=" * 60)
    print(f"✅ Pages generated: {generated_count}")
    print(f"⚠️ Validation errors: {validation_errors}")
    print(f"❌ Generation errors: {total_errors}")
    print(f"📁 Output directory: {output_dir}")
    
    if generated_count > 0:
        success_rate = (generated_count / len(cities)) * 100
        print(f"\n🎉 SUCCESS! {generated_count}/{len(cities)} PC repair pages generated ({success_rate:.1f}% success rate)")
        
        # Sample page verification
        sample_cities = ['milano', 'bergamo', 'segrate']
        existing_samples = []
        
        for city in sample_cities:
            sample_path = output_dir / f"riparazione-pc-{city}.html"
            if sample_path.exists():
                existing_samples.append(city)
        
        if existing_samples:
            print(f"🔍 Sample cities generated: {', '.join(existing_samples)}")
        
        print("\n🔍 Next steps:")
        print("   1. Review generated pages in web/pages/")
        print("   2. Validate sample pages (Milano, Bergamo, etc.)")
        print("   3. Check placeholder replacement")
        print("   4. Verify SEO structure")
        
        if validation_errors > 0:
            print(f"⚠️ Note: {validation_errors} pages had validation warnings - check for unreplaced placeholders")
    else:
        print("\n❌ No pages were generated. Check the errors above.")

if __name__ == '__main__':
    main()