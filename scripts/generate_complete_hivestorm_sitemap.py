#!/usr/bin/env python3
"""
HIVESTORM Task #3: Generate Complete Sitemap.xml for IT-ERA
Comprehensive sitemap generator with all 1,426+ URLs
"""

import os
import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime
import glob

def generate_complete_sitemap():
    """Generate comprehensive sitemap.xml with all pages"""
    
    # XML namespace and root setup
    root = ET.Element("urlset")
    root.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    
    # Base URL (production domain)
    base_url = "https://it-era.it"
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    urls_added = 0
    
    print("🚀 HIVESTORM SITEMAP GENERATOR - Task #3")
    print("=" * 60)
    
    # 1. HOMEPAGE (Priority 1.0)
    homepage_url = ET.SubElement(root, "url")
    ET.SubElement(homepage_url, "loc").text = f"{base_url}/"
    ET.SubElement(homepage_url, "lastmod").text = current_date
    ET.SubElement(homepage_url, "changefreq").text = "daily"
    ET.SubElement(homepage_url, "priority").text = "1.0"
    urls_added += 1
    print(f"✅ Added homepage: {base_url}/")
    
    # 2. MAIN SERVICE PAGES (Priority 0.9)
    web_pages_dir = "/Users/andreapanzeri/progetti/IT-ERA/web/pages/"
    main_services = [
        "assistenza-it.html",
        "sicurezza-informatica.html", 
        "cloud-storage.html",
        "voip-telefonia.html",
        "firewall-watchguard.html",
        "backup-automatico.html"
    ]
    
    # Get all HTML files in web/pages/
    if os.path.exists(web_pages_dir):
        html_files = [f for f in os.listdir(web_pages_dir) if f.endswith('.html')]
        
        for html_file in html_files:
            clean_url = html_file.replace('.html', '')
            
            url_elem = ET.SubElement(root, "url")
            ET.SubElement(url_elem, "loc").text = f"{base_url}/{clean_url}"
            ET.SubElement(url_elem, "lastmod").text = current_date
            
            # Main services get higher priority
            if html_file in main_services:
                ET.SubElement(url_elem, "changefreq").text = "weekly"
                ET.SubElement(url_elem, "priority").text = "0.9"
            elif html_file.startswith('settori-'):
                # Sector pages
                ET.SubElement(url_elem, "changefreq").text = "monthly"
                ET.SubElement(url_elem, "priority").text = "0.7"
            else:
                # Other pages (contact, about, etc.)
                ET.SubElement(url_elem, "changefreq").text = "monthly"
                ET.SubElement(url_elem, "priority").text = "0.6"
            
            urls_added += 1
            
        print(f"✅ Added {len(html_files)} main pages from /web/pages/")
    
    # 3. CITY-SPECIFIC ASSISTENZA-IT PAGES (Priority 0.8)
    pages_generated_dir = "/Users/andreapanzeri/progetti/IT-ERA/web/pages-generated/"
    
    if os.path.exists(pages_generated_dir):
        html_files = [f for f in os.listdir(pages_generated_dir) if f.endswith('.html')]
        
        print(f"🔍 Found {len(html_files)} city-specific pages")
        
        for html_file in html_files:
            clean_url = html_file.replace('.html', '')
            
            url_elem = ET.SubElement(root, "url")
            ET.SubElement(url_elem, "loc").text = f"{base_url}/{clean_url}"
            ET.SubElement(url_elem, "lastmod").text = current_date
            ET.SubElement(url_elem, "changefreq").text = "monthly"
            ET.SubElement(url_elem, "priority").text = "0.8"
            
            urls_added += 1
            
            # Progress indicator every 200 pages
            if urls_added % 200 == 0:
                print(f"⏳ Processed {urls_added} URLs...")
        
        print(f"✅ Added {len(html_files)} city-specific pages")
    
    # 4. BLOG PAGES (if they exist)
    blog_dir = "/Users/andreapanzeri/progetti/IT-ERA/web/blog/"
    if os.path.exists(blog_dir):
        blog_files = glob.glob(os.path.join(blog_dir, "**/*.html"), recursive=True)
        
        for blog_file in blog_files:
            # Get relative path from web directory
            rel_path = os.path.relpath(blog_file, "/Users/andreapanzeri/progetti/IT-ERA/web/")
            clean_url = rel_path.replace('.html', '')
            
            url_elem = ET.SubElement(root, "url")
            ET.SubElement(url_elem, "loc").text = f"{base_url}/{clean_url}"
            ET.SubElement(url_elem, "lastmod").text = current_date
            ET.SubElement(url_elem, "changefreq").text = "weekly"
            ET.SubElement(url_elem, "priority").text = "0.6"
            
            urls_added += 1
        
        print(f"✅ Added {len(blog_files)} blog pages")
    
    # Pretty print XML
    xml_str = ET.tostring(root, encoding='unicode')
    pretty_xml = minidom.parseString(xml_str).toprettyxml(indent="  ")
    
    # Remove extra newlines
    pretty_xml = '\n'.join([line for line in pretty_xml.split('\n') if line.strip()])
    
    # Save to public/sitemap.xml
    sitemap_path = "/Users/andreapanzeri/progetti/IT-ERA/public/sitemap.xml"
    
    # Ensure public directory exists
    os.makedirs(os.path.dirname(sitemap_path), exist_ok=True)
    
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(pretty_xml)
    
    # Also save to web/sitemap.xml for immediate deployment
    web_sitemap_path = "/Users/andreapanzeri/progetti/IT-ERA/web/sitemap.xml"
    with open(web_sitemap_path, 'w', encoding='utf-8') as f:
        f.write(pretty_xml)
    
    print("=" * 60)
    print(f"🎯 SITEMAP GENERATION COMPLETE!")
    print(f"📊 Total URLs: {urls_added}")
    print(f"💾 Saved to: {sitemap_path}")
    print(f"💾 Deployed to: {web_sitemap_path}")
    print(f"🌐 Domain: {base_url}")
    print(f"📅 Last Modified: {current_date}")
    print("=" * 60)
    
    # Validate XML structure
    try:
        ET.parse(sitemap_path)
        print("✅ XML structure validation: PASSED")
    except ET.ParseError as e:
        print(f"❌ XML structure validation: FAILED - {e}")
    
    return urls_added

if __name__ == "__main__":
    total_urls = generate_complete_sitemap()
    print(f"\n🚀 HIVESTORM Task #3 COMPLETED: {total_urls} URLs in sitemap!")