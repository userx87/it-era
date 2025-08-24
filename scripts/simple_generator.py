#!/usr/bin/env python3
"""
IT-ERA Assistenza-IT Page Generator
Generates assistenza-it landing pages with proper province mapping and validation
"""
import os
import re
import json
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
        'usmate-velate': 'Usmate Velate'
    }
    
    if slug in special_cases:
        return special_cases[slug]
    
    # Standard conversion: replace - with space and title case
    return slug.replace('-', ' ').title()

def load_complete_municipalities():
    """Load complete Lombardy municipalities from JSON file"""
    project_root = Path('/Users/andreapanzeri/progetti/IT-ERA')
    complete_file = project_root / 'data' / 'cities-lombardy-complete.json'
    
    if not complete_file.exists():
        print(f"⚠️ Complete municipalities file not found: {complete_file}")
        return {}
    
    try:
        with open(complete_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading complete municipalities: {e}")
        return {}

def get_city_province(city_slug, province_mapping):
    """Get province code for a city"""
    for province_code, province_info in province_mapping.items():
        if city_slug in province_info.get('cities', []):
            return province_code
    return 'MB'  # Default to Monza-Brianza if not found

def validate_content(content, city_name):
    """Validate that all placeholders have been replaced"""
    placeholders = re.findall(r'\{\{[^}]+\}\}', content)
    if placeholders:
        print(f"⚠️ Unreplaced placeholders found in {city_name}: {placeholders}")
        return False
    return True

def extract_all_cities(complete_municipalities):
    """Extract all cities from complete municipalities database"""
    all_cities = set()
    
    for province_code, province_data in complete_municipalities.items():
        if 'cities' in province_data:
            all_cities.update(province_data['cities'])
    
    return sorted(list(all_cities))

def generate_page(template_content, city_slug, city_name, service_type, province_code, province_mapping):
    """Generate a single page with proper placeholder replacement"""
    province_name = province_mapping.get(province_code, {}).get('name', 'Monza e Brianza')
    
    # Replace all placeholders
    content = template_content.replace('{{CITY}}', city_name)
    content = content.replace('{{CITY_SLUG}}', city_slug)
    content = content.replace('{{SERVICE_TYPE}}', service_type)
    content = content.replace('{{REGION}}', 'Lombardia')
    content = content.replace('{{REGION_CODE}}', 'LOM')
    content = content.replace('{{PROVINCE}}', province_code)
    content = content.replace('{{PROVINCE_NAME}}', province_name)
    
    return content

def main():
    """Main generation function - ASSISTENZA-IT PAGES ONLY"""
    print("🚀 IT-ERA Assistenza-IT Page Generator")
    print("=" * 60)
    print("📋 SINGLE SERVICE APPROACH: Generating assistenza-it pages only")
    print("=" * 60)
    
    # Project paths
    project_root = Path('/Users/andreapanzeri/progetti/IT-ERA')
    templates_dir = project_root / 'templates'
    output_dir = project_root / 'web' / 'pages-generated'
    
    # Create output directory
    output_dir.mkdir(exist_ok=True)
    
    # Load complete municipalities database
    print("🗺️ Loading complete municipalities database...")
    complete_municipalities = load_complete_municipalities()
    if complete_municipalities:
        total_cities = sum(len(p.get('cities', [])) for p in complete_municipalities.values())
        print(f"✅ Loaded complete database with {total_cities} municipalities")
        
        # Print statistics by province
        for province_code, province_data in complete_municipalities.items():
            count = len(province_data.get('cities', []))
            print(f"   {province_code} ({province_data.get('name', 'Unknown')}): {count} cities")
    
    # Extract all cities from complete database
    print("📍 Extracting all cities from complete database...")
    cities = extract_all_cities(complete_municipalities)
    print(f"✅ Found {len(cities)} total cities in Lombardy")
    
    # ASSISTENZA-IT TEMPLATE ONLY
    template_info = {
        'file': 'assistenza-it-template-new.html',
        'service': 'Assistenza IT'
    }
    
    template_path = templates_dir / template_info['file']
    
    if not template_path.exists():
        print(f"❌ Template not found: {template_path}")
        return
    
    print(f"\n📄 Processing template: {template_info['file']}")
    
    # Load template
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()
    except Exception as e:
        print(f"❌ Error reading template: {e}")
        return
    
    # Check for required placeholders
    required_placeholders = ['{{CITY}}', '{{CITY_SLUG}}', '{{REGION}}', '{{REGION_CODE}}']
    missing_placeholders = []
    for placeholder in required_placeholders:
        if placeholder not in template_content:
            missing_placeholders.append(placeholder)
    
    if missing_placeholders:
        print(f"⚠️ Missing required placeholders: {missing_placeholders}")
    else:
        print("✅ All required placeholders found in template")
    
    # Generate pages for ALL cities
    generated_count = 0
    validation_errors = 0
    total_errors = 0
    
    print(f"\n🏭 Generating assistenza-it pages for {len(cities)} cities...")
    print("-" * 60)
    
    for i, city_slug in enumerate(cities, 1):
        city_name = normalize_city_name(city_slug)
        province_code = get_city_province(city_slug, complete_municipalities)
        
        try:
            # Generate page content
            page_content = generate_page(
                template_content, 
                city_slug, 
                city_name, 
                template_info['service'],
                province_code,
                complete_municipalities
            )
            
            # Validate content
            if not validate_content(page_content, city_name):
                validation_errors += 1
            
            # Save to file
            output_filename = f"assistenza-it-{city_slug}.html"
            output_path = output_dir / output_filename
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(page_content)
            
            print(f"✅ [{i:3d}/{len(cities)}] {output_filename} → {city_name} ({province_code})")
            generated_count += 1
            
        except Exception as e:
            print(f"❌ [{i:3d}/{len(cities)}] Error generating for {city_slug}: {e}")
            total_errors += 1
    
    print("\n" + "=" * 60)
    print("📊 GENERATION SUMMARY")
    print("=" * 60)
    print(f"✅ Pages generated: {generated_count}")
    print(f"⚠️ Validation errors: {validation_errors}")
    print(f"❌ Generation errors: {total_errors}")
    print(f"📁 Output directory: {output_dir}")
    
    if generated_count > 0:
        success_rate = (generated_count / len(cities)) * 100
        print(f"\n🎉 SUCCESS! {generated_count}/{len(cities)} pages generated ({success_rate:.1f}% success rate)")
        print("🔍 Next steps:")
        print("   1. Review generated pages in web/pages-generated/")
        print("   2. Validate a few sample pages manually")
        print("   3. Copy to web/pages/ when satisfied")
        
        if validation_errors > 0:
            print(f"⚠️ Note: {validation_errors} pages had validation warnings - check for unreplaced placeholders")
    else:
        print("\n❌ No pages were generated. Check the errors above.")

if __name__ == '__main__':
    main()