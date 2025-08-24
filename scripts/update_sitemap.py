#!/usr/bin/env python3
"""
Update sitemap.xml with all Lombardy municipality pages
Generates entries for assistenza-it, cloud-storage, and sicurezza-informatica pages
"""

import os
from pathlib import Path
from datetime import datetime

def generate_sitemap():
    """Generate complete sitemap with all municipality pages"""
    
    # Configuration
    base_url = "https://it-era.pages.dev"
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Paths
    project_root = Path('/Users/andreapanzeri/progetti/IT-ERA')
    web_dir = project_root / 'web'
    pages_dir = web_dir / 'pages'
    sitemap_path = web_dir / 'sitemap.xml'
    
    # Service types to include
    service_patterns = [
        'assistenza-it-*.html',
        'cloud-storage-*.html', 
        'sicurezza-informatica-*.html'
    ]
    
    # Collect all pages
    all_pages = []
    
    print("🔍 Scanning for municipality pages...")
    
    for pattern in service_patterns:
        pages = list(pages_dir.glob(pattern))
        all_pages.extend(pages)
        print(f"   Found {len(pages)} {pattern} pages")
    
    # Sort pages alphabetically
    all_pages.sort(key=lambda p: p.name)
    
    print(f"\n📄 Total pages found: {len(all_pages)}")
    
    # Generate sitemap XML
    sitemap_content = ['<?xml version="1.0" encoding="UTF-8"?>']
    sitemap_content.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    # Add homepage
    sitemap_content.extend([
        '  <url>',
        f'    <loc>{base_url}/</loc>',
        f'    <lastmod>{today}</lastmod>',
        '    <priority>1.0</priority>',
        '  </url>'
    ])
    
    # Add all municipality pages
    for page in all_pages:
        page_url = f"{base_url}/pages/{page.name}"
        
        # Determine priority based on service type
        if 'assistenza-it-' in page.name:
            priority = '0.9'  # Highest priority for main service
        elif 'sicurezza-informatica-' in page.name:
            priority = '0.8'
        elif 'cloud-storage-' in page.name:
            priority = '0.8'
        else:
            priority = '0.7'
        
        sitemap_content.extend([
            '  <url>',
            f'    <loc>{page_url}</loc>',
            f'    <lastmod>{today}</lastmod>',
            f'    <priority>{priority}</priority>',
            '  </url>'
        ])
    
    sitemap_content.append('</urlset>')
    
    # Write sitemap file
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sitemap_content))
    
    print(f"\n✅ Sitemap updated: {sitemap_path}")
    print(f"   Total URLs: {len(all_pages) + 1}")  # +1 for homepage
    print(f"   Generated on: {today}")
    
    # Verify some key cities are included
    key_cities = ['segrate', 'pioltello', 'cernusco-sul-naviglio', 'milano', 'bergamo']
    
    print(f"\n🔍 Verifying key cities in sitemap:")
    sitemap_text = '\n'.join(sitemap_content)
    
    for city in key_cities:
        if f'assistenza-it-{city}.html' in sitemap_text:
            print(f"   ✅ {city} found")
        else:
            print(f"   ❌ {city} NOT found")
    
    return len(all_pages) + 1

def main():
    """Main function"""
    print("🗺️ IT-ERA Sitemap Generator")
    print("=" * 50)
    
    total_urls = generate_sitemap()
    
    print("\n" + "=" * 50)
    print(f"🎉 Sitemap generation completed!")
    print(f"   Total URLs generated: {total_urls}")
    print(f"   File: /Users/andreapanzeri/progetti/IT-ERA/web/sitemap.xml")

if __name__ == '__main__':
    main()