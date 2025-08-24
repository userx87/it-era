#!/usr/bin/env python3
"""
Script to update sitemap.xml to only include valid PC repair pages
"""

import json
import os
import xml.etree.ElementTree as ET
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

def update_sitemap():
    """Update sitemap.xml to remove invalid PC repair page URLs"""
    sitemap_file = 'web/sitemap.xml'
    
    # Parse existing sitemap
    tree = ET.parse(sitemap_file)
    root = tree.getroot()
    
    # Define namespace
    ns = {'': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    
    # Load expected cities
    expected_cities = load_expected_cities()
    
    # Get current date for lastmod
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    # Remove invalid PC repair URLs
    urls_to_remove = []
    valid_pc_repair_urls = []
    
    for url_element in root.findall('.//url', ns):
        loc_element = url_element.find('loc', ns)
        if loc_element is not None:
            url = loc_element.text
            
            # Check if it's a PC repair page
            if '/pages/riparazione-pc-' in url and url.endswith('.html'):
                # Extract city slug from URL
                city_slug = url.split('/pages/riparazione-pc-')[1].replace('.html', '')
                
                if city_slug in expected_cities:
                    valid_pc_repair_urls.append(url)
                else:
                    urls_to_remove.append(url_element)
    
    # Remove invalid URLs from sitemap
    removed_count = 0
    for url_element in urls_to_remove:
        root.remove(url_element)
        removed_count += 1
    
    print(f"Sitemap Update Summary:")
    print(f"  - Valid PC repair URLs kept: {len(valid_pc_repair_urls)}")
    print(f"  - Invalid PC repair URLs removed: {removed_count}")
    
    # Write updated sitemap
    tree.write(sitemap_file, encoding='utf-8', xml_declaration=True)
    print(f"  - Updated sitemap saved: {sitemap_file}")
    
    return len(valid_pc_repair_urls), removed_count

if __name__ == "__main__":
    update_sitemap()