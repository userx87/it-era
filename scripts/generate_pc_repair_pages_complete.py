#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete PC Repair Pages Generator
Generates all 1,626 PC repair pages for Lombardy cities using the corrected template
"""

import os
import json
import sys
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import re

def setup_logging():
    """Setup logging configuration"""
    import logging
    
    log_file = Path("logs") / f"pc-repair-generation-{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    log_file.parent.mkdir(exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(__name__)

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    if not text:
        return ""
    
    # Handle special Italian characters
    replacements = {
        'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
        'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
        'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
        'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'ñ': 'n', 'ç': 'c',
        "'": '-', " ": '-', "/": '-', ".": '', ",": '', "(": '', ")": '',
        "'": '-', "'": '-', "&": '-', "–": '-', "—": '-'
    }
    
    text = text.lower().strip()
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Remove any remaining special characters except hyphens and letters
    text = re.sub(r'[^a-z0-9\-]', '', text)
    
    # Replace multiple consecutive hyphens with single hyphen
    text = re.sub(r'-+', '-', text)
    
    # Remove leading/trailing hyphens
    text = text.strip('-')
    
    return text

def load_cities_data(logger) -> List[Dict]:
    """Load cities data from JSON file"""
    data_file = Path("data/lombardy-complete-official.json")
    
    if not data_file.exists():
        logger.error(f"Cities data file not found: {data_file}")
        raise FileNotFoundError(f"Cities data file not found: {data_file}")
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        cities = []
        for province_name, province_cities in data.get('provinces', {}).items():
            for city in province_cities:
                cities.append({
                    'name': city['name'],
                    'province': city['province'],
                    'slug': slugify(city['name']),
                    'car_code': city.get('car_code', ''),
                    'is_capital': city.get('is_capital', False)
                })
        
        logger.info(f"Loaded {len(cities)} cities from {len(data.get('provinces', {}))} provinces")
        return cities
        
    except Exception as e:
        logger.error(f"Error loading cities data: {e}")
        raise

def load_template(logger) -> str:
    """Load the PC repair template"""
    template_file = Path("templates/riparazione-pc-template.html")
    
    if not template_file.exists():
        logger.error(f"Template file not found: {template_file}")
        raise FileNotFoundError(f"Template file not found: {template_file}")
    
    try:
        with open(template_file, 'r', encoding='utf-8') as f:
            template_content = f.read()
        
        # Remove any "gratuito/gratuita" references if they exist
        template_content = re.sub(r'\bgratuito\b', 'professionale', template_content, flags=re.IGNORECASE)
        template_content = re.sub(r'\bgratuita\b', 'professionale', template_content, flags=re.IGNORECASE)
        
        logger.info("Template loaded and cleaned successfully")
        return template_content
        
    except Exception as e:
        logger.error(f"Error loading template: {e}")
        raise

def generate_page_content(template: str, city: Dict) -> str:
    """Generate page content for a specific city"""
    
    # Prepare replacement variables
    city_name = city['name']
    province = city['province'] 
    city_slug = city['slug']
    
    # Handle region name
    if province in ['Milano', 'Monza e Brianza']:
        region = 'Lombardia'
    else:
        region = 'Lombardia'  # All cities are in Lombardia
    
    # Replace all placeholders
    content = template.replace('{{CITY}}', city_name)
    content = content.replace('{{REGION}}', region)
    content = content.replace('{{CITY_SLUG}}', city_slug)
    
    # Additional specific replacements to ensure consistency
    content = content.replace('{{PROVINCE}}', province)
    
    return content

def save_page(city: Dict, content: str, output_dir: Path, logger) -> Tuple[bool, str]:
    """Save a page to the output directory"""
    try:
        filename = f"riparazione-pc-{city['slug']}.html"
        filepath = output_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True, f"Generated: {filename}"
        
    except Exception as e:
        error_msg = f"Error saving page for {city['name']}: {e}"
        logger.error(error_msg)
        return False, error_msg

def backup_existing_pages(output_dir: Path, logger):
    """Backup existing pages before regeneration"""
    if not output_dir.exists():
        logger.info("Output directory doesn't exist, no backup needed")
        return
    
    backup_dir = Path(f"backup/pc_repair_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    # Backup existing PC repair pages
    existing_files = list(output_dir.glob("riparazione-pc-*.html"))
    
    if existing_files:
        logger.info(f"Backing up {len(existing_files)} existing PC repair pages")
        
        for file_path in existing_files:
            try:
                shutil.copy2(file_path, backup_dir / file_path.name)
            except Exception as e:
                logger.warning(f"Failed to backup {file_path.name}: {e}")
        
        logger.info(f"Backup completed: {backup_dir}")
    else:
        logger.info("No existing PC repair pages found to backup")

def generate_pages_batch(cities_batch: List[Dict], template: str, output_dir: Path, logger) -> List[Tuple[bool, str]]:
    """Generate a batch of pages"""
    results = []
    
    for city in cities_batch:
        try:
            content = generate_page_content(template, city)
            success, message = save_page(city, content, output_dir, logger)
            results.append((success, message))
            
        except Exception as e:
            error_msg = f"Error processing {city['name']}: {e}"
            logger.error(error_msg)
            results.append((False, error_msg))
    
    return results

def update_sitemap(cities: List[Dict], logger):
    """Update sitemap with generated PC repair pages"""
    try:
        sitemap_file = Path("web/sitemap.xml")
        
        # Generate PC repair URLs
        pc_repair_urls = []
        base_url = "https://it-era.pages.dev/pages"
        
        for city in cities:
            url = f"{base_url}/riparazione-pc-{city['slug']}.html"
            pc_repair_urls.append(url)
        
        logger.info(f"Generated {len(pc_repair_urls)} PC repair URLs for sitemap")
        
        # Read existing sitemap if it exists
        if sitemap_file.exists():
            with open(sitemap_file, 'r', encoding='utf-8') as f:
                sitemap_content = f.read()
        else:
            # Create basic sitemap structure
            sitemap_content = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>'''
        
        # Remove existing PC repair entries
        sitemap_content = re.sub(r'<url>\s*<loc>[^<]*riparazione-pc-[^<]*</loc>.*?</url>\s*', '', sitemap_content, flags=re.DOTALL)
        
        # Add new PC repair URLs
        urls_xml = ""
        current_date = datetime.now().strftime('%Y-%m-%d')
        
        for url in pc_repair_urls:
            urls_xml += f"""    <url>
        <loc>{url}</loc>
        <lastmod>{current_date}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
"""
        
        # Insert URLs before closing urlset tag
        sitemap_content = sitemap_content.replace('</urlset>', f"{urls_xml}</urlset>")
        
        # Save updated sitemap
        with open(sitemap_file, 'w', encoding='utf-8') as f:
            f.write(sitemap_content)
        
        logger.info(f"Sitemap updated with {len(pc_repair_urls)} PC repair pages")
        
    except Exception as e:
        logger.error(f"Error updating sitemap: {e}")

def verify_sample_pages(output_dir: Path, logger):
    """Verify that sample pages were generated correctly"""
    sample_cities = ['milano', 'bergamo', 'segrate']
    
    logger.info("Verifying sample generated pages...")
    
    for city_slug in sample_cities:
        page_file = output_dir / f"riparazione-pc-{city_slug}.html"
        
        if not page_file.exists():
            logger.error(f"Sample page not found: {page_file}")
            continue
        
        try:
            with open(page_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for proper placeholder replacement
            if '{{CITY}}' in content or '{{REGION}}' in content or '{{CITY_SLUG}}' in content:
                logger.error(f"Unreplaced placeholders found in {page_file}")
            else:
                logger.info(f"✓ {city_slug.capitalize()} page generated correctly")
            
            # Check for "gratuito" references
            if 'gratuito' in content.lower() or 'gratuita' in content.lower():
                logger.warning(f"'Gratuito' references found in {page_file}")
            else:
                logger.info(f"✓ {city_slug.capitalize()} page clean of 'gratuito' references")
                
        except Exception as e:
            logger.error(f"Error verifying {page_file}: {e}")

def main():
    """Main function to generate all PC repair pages"""
    logger = setup_logging()
    
    logger.info("Starting PC repair pages generation...")
    logger.info("=" * 50)
    
    try:
        # Setup paths
        output_dir = Path("web/pages")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Backup existing pages
        backup_existing_pages(output_dir, logger)
        
        # Load cities data and template
        cities = load_cities_data(logger)
        template = load_template(logger)
        
        logger.info(f"Processing {len(cities)} cities...")
        
        # Generate pages in parallel batches
        batch_size = 50  # Process 50 cities at a time
        total_batches = (len(cities) + batch_size - 1) // batch_size
        
        success_count = 0
        error_count = 0
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = []
            
            for i in range(0, len(cities), batch_size):
                batch = cities[i:i + batch_size]
                batch_num = (i // batch_size) + 1
                
                logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} cities)")
                
                future = executor.submit(generate_pages_batch, batch, template, output_dir, logger)
                futures.append(future)
            
            # Collect results
            for batch_num, future in enumerate(as_completed(futures), 1):
                try:
                    results = future.result()
                    
                    batch_success = sum(1 for success, _ in results if success)
                    batch_errors = len(results) - batch_success
                    
                    success_count += batch_success
                    error_count += batch_errors
                    
                    logger.info(f"Batch {batch_num} completed: {batch_success} success, {batch_errors} errors")
                    
                except Exception as e:
                    logger.error(f"Batch {batch_num} failed: {e}")
                    error_count += batch_size
        
        # Update sitemap
        logger.info("Updating sitemap...")
        update_sitemap(cities, logger)
        
        # Verify sample pages
        verify_sample_pages(output_dir, logger)
        
        # Final summary
        logger.info("=" * 50)
        logger.info("PC REPAIR PAGES GENERATION COMPLETED")
        logger.info(f"Total cities processed: {len(cities)}")
        logger.info(f"Successful generations: {success_count}")
        logger.info(f"Errors: {error_count}")
        logger.info(f"Success rate: {(success_count/len(cities)*100):.1f}%")
        
        if error_count == 0:
            logger.info("✅ All PC repair pages generated successfully!")
        else:
            logger.warning(f"⚠️ {error_count} pages had generation errors - check logs")
        
        logger.info(f"Pages saved to: {output_dir.absolute()}")
        logger.info(f"Log file: logs/pc-repair-generation-{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
        
    except Exception as e:
        logger.error(f"Critical error in main process: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()