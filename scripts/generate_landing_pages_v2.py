#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Optimized Landing Page Generator V2 for Italian Cities
Created by IT-ERA Backend Development Team

Features:
- Smart provincia/regione detection and mapping
- Nearby cities (comuni_vicini) intelligent detection
- Advanced URL slug generation for Italian names
- Batch processing with progress tracking
- Dual output: pages/ and pages-draft/
- Sitemap.xml generation and updates
- Comprehensive error handling and logging
- Memory-efficient processing for 250+ cities
- Template engine with {{VARIABLE}} placeholders

Usage:
    python scripts/generate_landing_pages_v2.py --service assistenza-it
    python scripts/generate_landing_pages_v2.py --service cloud-storage --output draft
    python scripts/generate_landing_pages_v2.py --all-services --batch-size 50
"""

import argparse
import csv
import json
import logging
import os
import re
import sys
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
import xml.etree.ElementTree as ET
from xml.dom import minidom

# Configuration
ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
TEMPLATES_DIR = ROOT_DIR / "templates"
WEB_DIR = ROOT_DIR / "web"
PAGES_DIR = WEB_DIR / "pages"
PAGES_DRAFT_DIR = WEB_DIR / "pages-draft"
LOGS_DIR = ROOT_DIR / "logs"

# Ensure directories exist
for directory in [PAGES_DIR, PAGES_DRAFT_DIR, LOGS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Logging configuration
LOG_FILE = LOGS_DIR / f"landing_generator_v2_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('LandingGenerator')

class ProvinceRegionMapper:
    """Intelligent province to region mapping for Lombardy"""
    
    PROVINCIA_TO_REGIONE = {
        'Bergamo': 'Lombardia',
        'Brescia': 'Lombardia',
        'Como': 'Lombardia',
        'Cremona': 'Lombardia',
        'Lecco': 'Lombardia',
        'Lodi': 'Lombardia',
        'Mantova': 'Lombardia',
        'Milano': 'Lombardia',
        'Monza e Brianza': 'Lombardia',
        'Pavia': 'Lombardia',
        'Sondrio': 'Lombardia',
        'Varese': 'Lombardia'
    }
    
    PROVINCIA_ABBREVIATIONS = {
        'BG': 'Bergamo',
        'BS': 'Brescia',
        'CO': 'Como',
        'CR': 'Cremona',
        'LC': 'Lecco',
        'LO': 'Lodi',
        'MN': 'Mantova',
        'MI': 'Milano',
        'MB': 'Monza e Brianza',
        'PV': 'Pavia',
        'SO': 'Sondrio',
        'VA': 'Varese'
    }
    
    @classmethod
    def get_regione(cls, provincia: str) -> str:
        """Get region from province name"""
        return cls.PROVINCIA_TO_REGIONE.get(provincia, 'Lombardia')
    
    @classmethod
    def get_provincia_full_name(cls, abbreviation: str) -> str:
        """Get full province name from abbreviation"""
        return cls.PROVINCIA_ABBREVIATIONS.get(abbreviation, abbreviation)

class ItalianSlugGenerator:
    """Advanced slug generation for Italian city names"""
    
    # Italian character mappings
    ITALIAN_CHARS = {
        'à': 'a', 'á': 'a', 'â': 'a', 'ä': 'a',
        'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
        'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'ò': 'o', 'ó': 'o', 'ô': 'o', 'ö': 'o',
        'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'ç': 'c', 'ñ': 'n'
    }
    
    # Special cases for Italian cities
    SPECIAL_CASES = {
        "Sant'Angelo Lodigiano": "sant-angelo-lodigiano",
        "Sant'Omobono Terme": "sant-omobono-terme",
        "San Pellegrino Terme": "san-pellegrino-terme",
        "San Fiorano": "san-fiorano",
        "Villa d'Almè": "villa-d-alme",
        "Villa di Serio": "villa-di-serio",
        "D'Adda": "d-adda",
        "Gera d'Adda": "gera-d-adda"
    }
    
    @classmethod
    def slugify(cls, text: str) -> str:
        """Generate URL-friendly slug from Italian city name"""
        if not text:
            return ""
        
        # Check special cases first
        for special, slug in cls.SPECIAL_CASES.items():
            if special.lower() in text.lower():
                return slug
        
        # Normalize text
        text = text.strip().lower()
        
        # Replace apostrophes and quotes
        text = re.sub(r"['']", " ", text)
        
        # Replace Italian characters
        for italian, replacement in cls.ITALIAN_CHARS.items():
            text = text.replace(italian, replacement)
        
        # Unicode normalization
        text = unicodedata.normalize('NFKD', text)
        text = text.encode('ascii', 'ignore').decode('ascii')
        
        # Replace non-alphanumeric with hyphens
        text = re.sub(r'[^a-z0-9]+', '-', text)
        
        # Remove multiple hyphens and trim
        text = re.sub(r'-+', '-', text).strip('-')
        
        return text

class NearbyCitiesFinder:
    """Intelligent nearby cities detection"""
    
    def __init__(self, cities_data: List[Dict]):
        self.cities_data = cities_data
        self.cities_by_province = self._group_by_province()
    
    def _group_by_province(self) -> Dict[str, List[Dict]]:
        """Group cities by province"""
        grouped = {}
        for city in self.cities_data:
            province = city['provincia']
            if province not in grouped:
                grouped[province] = []
            grouped[province].append(city)
        return grouped
    
    def find_nearby_cities(self, city_name: str, province: str, max_cities: int = 5) -> List[str]:
        """Find nearby cities in the same province"""
        if province not in self.cities_by_province:
            return []
        
        province_cities = self.cities_by_province[province]
        nearby_cities = []
        
        # Exclude the current city
        for city in province_cities:
            if city['comune'].lower() != city_name.lower():
                nearby_cities.append(city['comune'])
        
        # Sort alphabetically and limit
        nearby_cities.sort()
        return nearby_cities[:max_cities]

class TemplateProcessor:
    """Advanced template processing with placeholder replacement"""
    
    def __init__(self, template_path: Path):
        self.template_path = template_path
        self.template_content = self._load_template()
    
    def _load_template(self) -> str:
        """Load template content"""
        try:
            with open(self.template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error loading template {self.template_path}: {e}")
            raise
    
    def process(self, replacements: Dict[str, str]) -> str:
        """Process template with replacements"""
        content = self.template_content
        
        # Replace all {{VARIABLE}} placeholders
        for key, value in replacements.items():
            placeholder = f"{{{{{key}}}}}"
            content = content.replace(placeholder, str(value))
        
        # Log any unprocessed placeholders
        remaining_placeholders = re.findall(r'\{\{([^}]+)\}\}', content)
        if remaining_placeholders:
            logger.warning(f"Unprocessed placeholders found: {remaining_placeholders}")
        
        return content

class SitemapGenerator:
    """Sitemap.xml generator and updater"""
    
    def __init__(self, base_url: str = "https://it-era.pages.dev"):
        self.base_url = base_url
        self.sitemap_path = WEB_DIR / "sitemap.xml"
    
    def update_sitemap(self, new_urls: List[str]) -> bool:
        """Update sitemap with new URLs"""
        try:
            # Load existing sitemap or create new
            if self.sitemap_path.exists():
                tree = ET.parse(self.sitemap_path)
                root = tree.getroot()
            else:
                root = ET.Element('urlset')
                root.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
                tree = ET.ElementTree(root)
            
            # Get existing URLs
            existing_urls = set()
            for url_elem in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
                existing_urls.add(url_elem.text)
            
            # Add new URLs
            today = datetime.now().strftime('%Y-%m-%d')
            added_count = 0
            
            for url in new_urls:
                full_url = f"{self.base_url}{url}"
                if full_url not in existing_urls:
                    url_element = ET.SubElement(root, 'url')
                    loc_element = ET.SubElement(url_element, 'loc')
                    loc_element.text = full_url
                    lastmod_element = ET.SubElement(url_element, 'lastmod')
                    lastmod_element.text = today
                    added_count += 1
            
            # Pretty print and save
            rough_string = ET.tostring(root, encoding='unicode')
            reparsed = minidom.parseString(rough_string)
            pretty_string = reparsed.toprettyxml(indent="  ")
            
            # Remove empty lines and fix declaration
            lines = [line for line in pretty_string.split('\n') if line.strip()]
            lines[0] = '<?xml version="1.0" encoding="UTF-8"?>'
            
            with open(self.sitemap_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
            
            logger.info(f"Sitemap updated: {added_count} new URLs added")
            return True
            
        except Exception as e:
            logger.error(f"Error updating sitemap: {e}")
            return False

class ProgressTracker:
    """Progress tracking for batch operations"""
    
    def __init__(self, total_items: int):
        self.total_items = total_items
        self.processed_items = 0
        self.successful_items = 0
        self.failed_items = 0
        self.start_time = datetime.now()
    
    def update(self, success: bool = True):
        """Update progress"""
        self.processed_items += 1
        if success:
            self.successful_items += 1
        else:
            self.failed_items += 1
    
    def get_progress(self) -> Dict[str, any]:
        """Get current progress"""
        elapsed = datetime.now() - self.start_time
        progress_pct = (self.processed_items / self.total_items) * 100 if self.total_items > 0 else 0
        
        return {
            'processed': self.processed_items,
            'total': self.total_items,
            'successful': self.successful_items,
            'failed': self.failed_items,
            'progress_pct': round(progress_pct, 2),
            'elapsed_time': str(elapsed).split('.')[0]
        }
    
    def log_progress(self):
        """Log current progress"""
        progress = self.get_progress()
        logger.info(f"Progress: {progress['processed']}/{progress['total']} "
                   f"({progress['progress_pct']}%) - "
                   f"Success: {progress['successful']}, "
                   f"Failed: {progress['failed']}, "
                   f"Elapsed: {progress['elapsed_time']}")

class LandingPageGenerator:
    """Main landing page generator class"""
    
    def __init__(self, batch_size: int = 50):
        self.batch_size = batch_size
        self.slug_generator = ItalianSlugGenerator()
        self.province_mapper = ProvinceRegionMapper()
        self.sitemap_generator = SitemapGenerator()
        
        # Load data
        self.cities_data = self._load_cities_data()
        self.nearby_finder = NearbyCitiesFinder(self.cities_data)
        
        # Service configurations
        self.services = {
            'assistenza-it': {
                'template': 'assistenza-it-template.html',
                'service_name': 'Assistenza IT',
                'keyword_prefix': 'assistenza informatica'
            },
            'cloud-storage': {
                'template': 'cloud-storage-template.html',
                'service_name': 'Cloud Storage',
                'keyword_prefix': 'cloud storage aziendale'
            },
            'sicurezza-informatica': {
                'template': 'sicurezza-informatica-template.html',
                'service_name': 'Sicurezza Informatica',
                'keyword_prefix': 'sicurezza informatica'
            }
        }
    
    def _load_cities_data(self) -> List[Dict]:
        """Load cities data from CSV"""
        csv_path = DATA_DIR / "comuni_master.csv"
        cities_data = []
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    cities_data.append(row)
            
            logger.info(f"Loaded {len(cities_data)} records from CSV")
            return cities_data
            
        except Exception as e:
            logger.error(f"Error loading cities data: {e}")
            raise
    
    def _get_template_replacements(self, city_data: Dict, service_key: str) -> Dict[str, str]:
        """Generate template replacements for a city and service"""
        comune = city_data['comune']
        provincia = city_data['provincia']
        slug = self.slug_generator.slugify(comune)
        service_info = self.services[service_key]
        
        # Find nearby cities
        nearby_cities = self.nearby_finder.find_nearby_cities(comune, provincia)
        comuni_vicini_html = self._generate_comuni_vicini_html(nearby_cities, service_key)
        
        # Base replacements
        replacements = {
            'CITTA': comune,
            'PROVINCIA': provincia,
            'REGIONE': self.province_mapper.get_regione(provincia),
            'SLUG': slug,
            'SERVICE_SLUG': service_key,
            'SERVICE_NAME': service_info['service_name'],
            'KEYWORD_TARGET': f"{service_info['keyword_prefix']} {comune.lower()}",
            'COMUNI_VICINI': comuni_vicini_html,
            'CANONICAL_URL': f"https://it-era.pages.dev/pages/{service_key}-{slug}.html",
            'IMAGE_URL': f"https://it-era.pages.dev/static/images/it-{service_key}-{slug}-hero.svg",
            'CURRENT_YEAR': str(datetime.now().year),
            'CURRENT_DATE': datetime.now().strftime('%Y-%m-%d'),
            'META_ROBOTS': 'index,follow'
        }
        
        return replacements
    
    def _generate_comuni_vicini_html(self, nearby_cities: List[str], service_key: str) -> str:
        """Generate HTML for nearby cities links"""
        if not nearby_cities:
            return ""
        
        links = []
        for city in nearby_cities:
            city_slug = self.slug_generator.slugify(city)
            link = f'<a href="{service_key}-{city_slug}.html" class="text-decoration-none">{city}</a>'
            links.append(link)
        
        return " | ".join(links)
    
    def _generate_single_page(self, city_data: Dict, service_key: str, output_dir: Path) -> Tuple[bool, str]:
        """Generate a single landing page"""
        try:
            # Get template processor
            template_path = TEMPLATES_DIR / self.services[service_key]['template']
            if not template_path.exists():
                raise FileNotFoundError(f"Template not found: {template_path}")
            
            processor = TemplateProcessor(template_path)
            
            # Get replacements
            replacements = self._get_template_replacements(city_data, service_key)
            
            # Process template
            content = processor.process(replacements)
            
            # Generate output filename
            slug = replacements['SLUG']
            output_filename = f"{service_key}-{slug}.html"
            output_path = output_dir / output_filename
            
            # Write file
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.debug(f"Generated: {output_filename}")
            return True, f"/pages/{output_filename}"
            
        except Exception as e:
            logger.error(f"Error generating page for {city_data.get('comune', 'unknown')}: {e}")
            return False, ""
    
    def generate_service_pages(self, service_key: str, output_mode: str = 'both') -> Dict[str, any]:
        """Generate all pages for a specific service"""
        if service_key not in self.services:
            raise ValueError(f"Unknown service: {service_key}")
        
        # Filter data for this service
        service_data = [row for row in self.cities_data if row['servizio_slug'] == service_key]
        
        if not service_data:
            logger.warning(f"No data found for service: {service_key}")
            return {'success': False, 'message': 'No data found'}
        
        logger.info(f"Starting generation for {service_key}: {len(service_data)} pages")
        
        # Progress tracker
        progress = ProgressTracker(len(service_data))
        
        # Determine output directories
        output_dirs = []
        if output_mode in ['both', 'production']:
            output_dirs.append(PAGES_DIR)
        if output_mode in ['both', 'draft']:
            output_dirs.append(PAGES_DRAFT_DIR)
        
        # Generate pages
        generated_urls = []
        
        for output_dir in output_dirs:
            logger.info(f"Generating pages in: {output_dir}")
            
            # Use ThreadPoolExecutor for batch processing
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = []
                
                for city_data in service_data:
                    future = executor.submit(self._generate_single_page, city_data, service_key, output_dir)
                    futures.append(future)
                
                # Process results
                for future in as_completed(futures):
                    success, url = future.result()
                    progress.update(success)
                    
                    if success and url:
                        generated_urls.append(url)
                    
                    # Log progress every 10 items
                    if progress.processed_items % 10 == 0:
                        progress.log_progress()
            
            progress.log_progress()
        
        # Update sitemap if generating production pages
        if output_mode in ['both', 'production'] and generated_urls:
            unique_urls = list(set(generated_urls))
            self.sitemap_generator.update_sitemap(unique_urls)
        
        return {
            'success': True,
            'service': service_key,
            'stats': progress.get_progress(),
            'generated_urls': len(set(generated_urls))
        }
    
    def generate_all_services(self, output_mode: str = 'both') -> Dict[str, any]:
        """Generate pages for all services"""
        logger.info("Starting generation for all services")
        
        results = {}
        total_stats = {
            'total_pages': 0,
            'successful_pages': 0,
            'failed_pages': 0,
            'total_urls': 0
        }
        
        for service_key in self.services.keys():
            logger.info(f"Processing service: {service_key}")
            result = self.generate_service_pages(service_key, output_mode)
            results[service_key] = result
            
            if result['success']:
                stats = result['stats']
                total_stats['total_pages'] += stats['total']
                total_stats['successful_pages'] += stats['successful']
                total_stats['failed_pages'] += stats['failed']
                total_stats['total_urls'] += result['generated_urls']
        
        logger.info(f"All services completed. Total stats: {total_stats}")
        
        return {
            'success': True,
            'results': results,
            'total_stats': total_stats
        }

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='Generate Italian city landing pages')
    parser.add_argument('--service', choices=['assistenza-it', 'cloud-storage', 'sicurezza-informatica'],
                        help='Generate pages for specific service')
    parser.add_argument('--all-services', action='store_true',
                        help='Generate pages for all services')
    parser.add_argument('--output', choices=['both', 'production', 'draft'], default='both',
                        help='Output destination')
    parser.add_argument('--batch-size', type=int, default=50,
                        help='Batch size for processing')
    parser.add_argument('--verbose', action='store_true',
                        help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize generator
    generator = LandingPageGenerator(batch_size=args.batch_size)
    
    try:
        if args.service:
            result = generator.generate_service_pages(args.service, args.output)
        elif args.all_services:
            result = generator.generate_all_services(args.output)
        else:
            print("Please specify --service or --all-services")
            sys.exit(1)
        
        # Print results
        if result['success']:
            logger.info("Generation completed successfully!")
            if 'total_stats' in result:
                stats = result['total_stats']
                print(f"\nTotal Statistics:")
                print(f"  Pages generated: {stats['successful_pages']}/{stats['total_pages']}")
                print(f"  Failed pages: {stats['failed_pages']}")
                print(f"  URLs in sitemap: {stats['total_urls']}")
        else:
            logger.error(f"Generation failed: {result.get('message', 'Unknown error')}")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("Generation interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()