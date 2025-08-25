#!/usr/bin/env python3
"""
Complete Sitemap Generator for IT-ERA
Generates comprehensive XML sitemap including all 1,403+ generated pages
"""

import os
import glob
from datetime import datetime
import xml.etree.ElementTree as ET
from xml.dom import minidom

def generate_complete_sitemap():
    """Generate complete sitemap.xml with all pages"""
    
    # Base configuration
    base_url = "https://it-era.it"
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Create root element
    urlset = ET.Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    
    # Homepage - highest priority
    add_url(urlset, f"{base_url}/", today, "daily", "1.0")
    
    # Main service pages - high priority
    main_pages = [
        ("assistenza-it.html", "weekly", "0.9"),
        ("sicurezza-informatica.html", "weekly", "0.9"),
        ("cloud-storage.html", "weekly", "0.9"),
        ("backup-automatico.html", "weekly", "0.8"),
        ("firewall-watchguard.html", "weekly", "0.8"),
        ("voip-telefonia.html", "weekly", "0.8"),
    ]
    
    for page, freq, priority in main_pages:
        add_url(urlset, f"{base_url}/pages/{page}", today, freq, priority)
    
    # Sector pages - medium priority
    sector_pages = [
        ("settori-pmi-startup.html", "monthly", "0.7"),
        ("settori-studi-medici.html", "monthly", "0.7"),
        ("settori-commercialisti.html", "monthly", "0.7"),
        ("settori-studi-legali.html", "monthly", "0.7"),
        ("settori-industria.html", "monthly", "0.7"),
        ("settori-retail.html", "monthly", "0.7"),
    ]
    
    for page, freq, priority in sector_pages:
        add_url(urlset, f"{base_url}/pages/{page}", today, freq, priority)
    
    # Information pages
    info_pages = [
        ("perche-it-era.html", "monthly", "0.6"),
        ("contatti.html", "monthly", "0.8"),
    ]
    
    for page, freq, priority in info_pages:
        add_url(urlset, f"{base_url}/pages/{page}", today, freq, priority)
    
    # Blog section
    blog_pages = [
        ("ai-sicurezza-informatica-trend-2024.html", "monthly", "0.6"),
        ("cloud-backup-veeam-guida-completa.html", "monthly", "0.6"),
        ("firewall-watchguard-configurazione-ottimale.html", "monthly", "0.6"),
        ("gdpr-compliance-checklist-pmi.html", "monthly", "0.6"),
        ("gestione-remota-it-best-practices.html", "monthly", "0.6"),
        ("ransomware-protezione-completa-2024.html", "monthly", "0.6"),
        ("rete-aziendale-setup-professionale.html", "monthly", "0.6"),
        ("sicurezza-zero-trust-nuova-frontiera.html", "monthly", "0.6"),
        ("test-api-automazione-it-n8n.html", "monthly", "0.6"),
    ]
    
    # Add blog index
    add_url(urlset, f"{base_url}/blog/", today, "weekly", "0.7")
    
    for page, freq, priority in blog_pages:
        add_url(urlset, f"{base_url}/blog/{page}", today, freq, priority)
    
    # Generated pages - the critical missing pieces
    web_dir = "/Users/andreapanzeri/progetti/IT-ERA/web"
    generated_dir = os.path.join(web_dir, "pages-generated")
    
    if os.path.exists(generated_dir):
        print(f"Processing generated pages from {generated_dir}")
        
        # Get all generated HTML files
        pattern = os.path.join(generated_dir, "*.html")
        generated_files = glob.glob(pattern)
        
        print(f"Found {len(generated_files)} generated pages")
        
        # Categorize by service type for different priorities
        service_priorities = {
            "assistenza-it-": ("monthly", "0.5"),
            "cloud-storage-": ("monthly", "0.4"),
            "sicurezza-informatica-": ("monthly", "0.5"),
        }
        
        for file_path in sorted(generated_files):
            filename = os.path.basename(file_path)
            
            # Determine priority based on service type
            freq, priority = ("monthly", "0.4")  # default
            for service, (f, p) in service_priorities.items():
                if filename.startswith(service):
                    freq, priority = f, p
                    break
            
            # Create clean URL (remove .html extension)
            clean_name = filename.replace(".html", "")
            page_url = f"{base_url}/{clean_name}"
            
            add_url(urlset, page_url, today, freq, priority)
    
    else:
        print(f"Warning: Generated pages directory not found: {generated_dir}")
    
    # 404 page - lowest priority
    add_url(urlset, f"{base_url}/404.html", today, "yearly", "0.1")
    
    # Generate XML string with proper formatting
    xml_str = prettify_xml(urlset)
    
    # Write sitemap
    sitemap_path = os.path.join(web_dir, "sitemap.xml")
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(xml_str)
    
    # Also create public version
    public_dir = "/Users/andreapanzeri/progetti/IT-ERA/public"
    os.makedirs(public_dir, exist_ok=True)
    
    public_sitemap = os.path.join(public_dir, "sitemap.xml")
    with open(public_sitemap, "w", encoding="utf-8") as f:
        f.write(xml_str)
    
    print(f"✅ Sitemap generated successfully!")
    print(f"📍 Location: {sitemap_path}")
    print(f"📍 Public: {public_sitemap}")
    print(f"📊 Total URLs: {len(list(urlset))}")
    
    return sitemap_path


def add_url(parent, loc, lastmod, changefreq, priority):
    """Add URL element to sitemap"""
    url = ET.SubElement(parent, "url")
    
    loc_elem = ET.SubElement(url, "loc")
    loc_elem.text = loc
    
    lastmod_elem = ET.SubElement(url, "lastmod")
    lastmod_elem.text = lastmod
    
    changefreq_elem = ET.SubElement(url, "changefreq")
    changefreq_elem.text = changefreq
    
    priority_elem = ET.SubElement(url, "priority")
    priority_elem.text = priority


def prettify_xml(elem):
    """Return a pretty-printed XML string for the Element"""
    rough_string = ET.tostring(elem, encoding='unicode')
    reparsed = minidom.parseString(rough_string)
    pretty = reparsed.toprettyxml(indent="  ")
    
    # Clean up extra whitespace
    lines = [line for line in pretty.split('\n') if line.strip()]
    return '\n'.join(lines)


if __name__ == "__main__":
    print("🚀 Starting complete sitemap generation...")
    sitemap_path = generate_complete_sitemap()
    print(f"🎉 Complete! Sitemap available at: {sitemap_path}")