#!/usr/bin/env python3
"""
Script to identify and clean up extra PC repair pages that don't match official cities
"""

import json
import os
import glob
from pathlib import Path

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

def main():
    # Load expected cities
    expected_cities = load_expected_cities()
    print(f"Expected cities from JSON: {len(expected_cities)}")
    
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
    
    print(f"\nValid pages (matching official cities): {len(valid_pages)}")
    print(f"Extra pages (not in official list): {len(extra_pages)}")
    
    if extra_pages:
        print(f"\nExtra pages to remove:")
        for page in sorted(extra_pages):
            city_slug = extract_city_slug_from_filename(page)
            print(f"  - {os.path.basename(page)} (slug: {city_slug})")
        
        # Ask for confirmation before deletion
        response = input(f"\nDo you want to delete these {len(extra_pages)} extra pages? (y/N): ")
        if response.lower() == 'y':
            deleted_count = 0
            for page in extra_pages:
                try:
                    os.remove(page)
                    deleted_count += 1
                    print(f"Deleted: {os.path.basename(page)}")
                except Exception as e:
                    print(f"Error deleting {page}: {e}")
            
            print(f"\nCleanup completed: {deleted_count} pages deleted")
            print(f"Remaining PC repair pages: {len(valid_pages)}")
        else:
            print("Cleanup cancelled")
    else:
        print("\nNo extra pages found. All PC repair pages match official cities.")

if __name__ == "__main__":
    main()