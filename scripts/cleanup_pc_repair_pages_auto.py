#!/usr/bin/env python3
"""
Script to automatically clean up extra PC repair pages that don't match official cities
"""

import json
import os
import glob
from datetime import datetime

def load_expected_cities():
    """Load expected city slugs from JSON data"""
    data_file = 'data/lombardy-complete-official.json'
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    expected_cities = set()
    for province_cities in data['provinces'].values():
        for city in province_cities:
            expected_cities.add(city['slug'])
    
    return expected_cities

def find_pc_repair_pages():
    """Find all PC repair pages"""
    pages_dir = 'web/pages'
    pattern = os.path.join(pages_dir, 'riparazione-pc-*.html')
    return glob.glob(pattern)

def extract_city_slug_from_filename(filepath):
    """Extract city slug from filename"""
    filename = os.path.basename(filepath)
    # Remove 'riparazione-pc-' prefix and '.html' suffix
    city_slug = filename[len('riparazione-pc-'):-len('.html')]
    return city_slug

def create_backup_dir():
    """Create backup directory for extra pages"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = f'backup/pc_repair_extra_backup_{timestamp}'
    os.makedirs(backup_dir, exist_ok=True)
    return backup_dir

def main():
    print("PC Repair Pages Cleanup - Automatic Mode")
    print("=" * 50)
    
    # Load expected cities
    expected_cities = load_expected_cities()
    print(f"Expected cities from official JSON: {len(expected_cities)}")
    
    # Find all PC repair pages
    pc_repair_pages = find_pc_repair_pages()
    print(f"Total PC repair pages found: {len(pc_repair_pages)}")
    
    # Categorize pages
    valid_pages = []
    extra_pages = []
    
    for page_file in pc_repair_pages:
        city_slug = extract_city_slug_from_filename(page_file)
        if city_slug in expected_cities:
            valid_pages.append(page_file)
        else:
            extra_pages.append(page_file)
    
    print(f"Valid pages (matching official cities): {len(valid_pages)}")
    print(f"Extra pages (not in official list): {len(extra_pages)}")
    
    if extra_pages:
        print(f"\nProcessing {len(extra_pages)} extra pages...")
        
        # Create backup directory
        backup_dir = create_backup_dir()
        print(f"Backup directory created: {backup_dir}")
        
        # Move extra pages to backup and then delete
        moved_count = 0
        deleted_count = 0
        
        for page in extra_pages:
            city_slug = extract_city_slug_from_filename(page)
            filename = os.path.basename(page)
            backup_path = os.path.join(backup_dir, filename)
            
            try:
                # Copy to backup first
                import shutil
                shutil.copy2(page, backup_path)
                moved_count += 1
                
                # Then delete original
                os.remove(page)
                deleted_count += 1
                
                if deleted_count <= 10:  # Show first 10 for brevity
                    print(f"  Processed: {filename} (slug: {city_slug})")
                elif deleted_count == 11:
                    print(f"  ... (showing first 10, processing remaining {len(extra_pages) - 10} silently)")
                    
            except Exception as e:
                print(f"Error processing {filename}: {e}")
        
        print(f"\nCleanup Summary:")
        print(f"  - Pages backed up: {moved_count}")
        print(f"  - Pages deleted: {deleted_count}")
        print(f"  - Backup location: {backup_dir}")
        print(f"  - Remaining PC repair pages: {len(valid_pages)}")
        
        # Verify final count
        remaining_pages = find_pc_repair_pages()
        print(f"  - Final verification: {len(remaining_pages)} PC repair pages remaining")
        
    else:
        print("\nNo extra pages found. All PC repair pages match official cities.")

if __name__ == "__main__":
    main()