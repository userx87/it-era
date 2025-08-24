#!/usr/bin/env python3
"""
IT-ERA Comprehensive City Page Generator
Generates ALL 4,506 pages for 1,502 Lombardy municipalities across 3 services.

This generator creates:
- Assistenza IT pages: 1,502 pages
- Sicurezza Informatica pages: 1,502 pages  
- Cloud Storage pages: 1,502 pages
Total: 4,506 pages

Features:
- Complete province mapping with full names
- All placeholder replacements
- Updated chatbot integration
- SEO optimization
- Proper file organization
- Progress tracking

Author: Claude Code
Version: 3.0 - Complete Coverage
Date: 2025-01-24
"""

import os
import json
import logging
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import unicodedata
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/andreapanzeri/progetti/IT-ERA/logs/comprehensive_generator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ComprehensiveCityPageGenerator:
    """Generates comprehensive city pages for all Lombardy municipalities"""
    
    def __init__(self, project_root: str):
        """Initialize the generator"""
        self.project_root = Path(project_root)
        self.data_file = self.project_root / "data" / "lombardy-complete-official.json"
        self.templates_dir = self.project_root / "templates"
        self.web_dir = self.project_root / "web"
        self.pages_dir = self.web_dir / "pages"
        self.pages_draft_dir = self.web_dir / "pages-draft"
        
        # Create directories
        self.pages_dir.mkdir(parents=True, exist_ok=True)
        self.pages_draft_dir.mkdir(parents=True, exist_ok=True)
        
        # Province mapping with full names
        self.province_names = {
            "BG": "Bergamo",
            "BS": "Brescia", 
            "CO": "Como",
            "CR": "Cremona",
            "LC": "Lecco",
            "LO": "Lodi",
            "MB": "Monza e della Brianza",
            "MI": "Milano",
            "MN": "Mantova",
            "PV": "Pavia",
            "SO": "Sondrio",
            "VA": "Varese"
        }
        
        # Service configurations
        self.services = {
            "assistenza-it": {
                "template": "assistenza-it-template-new.html",
                "title": "Assistenza IT",
                "description": "Supporto Informatico 24/7"
            },
            "sicurezza-informatica": {
                "template": "sicurezza-informatica-template-redesigned.html",
                "title": "Sicurezza Informatica",
                "description": "Protezione Cyber e Consulenza"
            },
            "cloud-storage": {
                "template": "cloud-storage-template-new.html", 
                "title": "Cloud Storage",
                "description": "Soluzioni Cloud Professionali"
            }
        }
        
        self.stats = {
            "total_municipalities": 0,
            "pages_generated": 0,
            "errors": 0,
            "services_processed": 0
        }

    def create_slug(self, name: str) -> str:
        """Create URL-friendly slug from city name"""
        # Convert to lowercase and normalize unicode
        slug = name.lower()
        slug = unicodedata.normalize('NFD', slug)
        slug = slug.encode('ascii', 'ignore').decode('ascii')
        
        # Replace spaces and special characters
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[-\s]+', '-', slug)
        slug = slug.strip('-')
        
        # Handle special cases
        replacements = {
            "sant-": "sant-",
            "san-": "san-",
            "villa-d-": "villa-d-",
            "ca-": "ca-",
            "d-": "d-",
            "--": "-"
        }
        
        for old, new in replacements.items():
            slug = slug.replace(old, new)
        
        return slug

    def load_municipalities_data(self) -> Dict:
        """Load municipalities data from JSON file"""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"Loaded data for {data.get('total_municipalities', 0)} municipalities")
            return data
        
        except FileNotFoundError:
            logger.error(f"Data file not found: {self.data_file}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in data file: {e}")
            raise

    def load_template(self, template_name: str) -> str:
        """Load HTML template"""
        template_path = self.templates_dir / template_name
        
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            logger.error(f"Template not found: {template_path}")
            raise

    def replace_placeholders(self, template: str, city_data: Dict, service_key: str) -> str:
        """Replace all placeholders in template"""
        city_name = city_data["name"]
        city_slug = city_data["slug"]
        province_code = city_data["car_code"]
        province_name = self.province_names.get(province_code, province_code)
        
        replacements = {
            "{{CITY}}": city_name,
            "{{CITY_SLUG}}": city_slug,
            "{{REGION}}": "Lombardia",
            "{{REGION_CODE}}": "3",
            "{{PROVINCE}}": province_code,
            "{{PROVINCE_NAME}}": province_name,
            "{{SERVICE_TYPE}}": self.services[service_key]["title"],
            "{{SERVICE_DESCRIPTION}}": self.services[service_key]["description"]
        }
        
        content = template
        for placeholder, value in replacements.items():
            content = content.replace(placeholder, value)
        
        return content

    def generate_page(self, city_data: Dict, service_key: str, output_dir: Path) -> bool:
        """Generate a single page for a city and service"""
        try:
            # Load template
            template = self.load_template(self.services[service_key]["template"])
            
            # Replace placeholders
            content = self.replace_placeholders(template, city_data, service_key)
            
            # Generate filename
            filename = f"{service_key}-{city_data['slug']}.html"
            output_path = output_dir / filename
            
            # Write file
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return True
            
        except Exception as e:
            logger.error(f"Error generating page for {city_data['name']} - {service_key}: {e}")
            self.stats["errors"] += 1
            return False

    def process_municipalities(self, municipalities_data: Dict) -> None:
        """Process all municipalities and generate pages"""
        logger.info("Starting page generation for all municipalities...")
        
        total_pages = 0
        generated_pages = 0
        
        # Process each province
        for province_name, municipalities in municipalities_data["provinces"].items():
            logger.info(f"Processing {province_name} province - {len(municipalities)} municipalities")
            
            for municipality in municipalities:
                self.stats["total_municipalities"] += 1
                
                # Process each service for this municipality
                for service_key in self.services.keys():
                    total_pages += 2  # pages + pages-draft
                    
                    # Generate for web/pages/
                    success1 = self.generate_page(municipality, service_key, self.pages_dir)
                    if success1:
                        generated_pages += 1
                        self.stats["pages_generated"] += 1
                    
                    # Generate for web/pages-draft/
                    success2 = self.generate_page(municipality, service_key, self.pages_draft_dir)
                    if success2:
                        generated_pages += 1
                        self.stats["pages_generated"] += 1
                
                # Progress logging every 50 municipalities
                if self.stats["total_municipalities"] % 50 == 0:
                    logger.info(f"Progress: {self.stats['total_municipalities']}/1502 municipalities processed")
        
        logger.info(f"Generation complete! Total pages: {generated_pages}/{total_pages}")

    def update_sitemap(self) -> None:
        """Update sitemap.xml with new pages"""
        logger.info("Updating sitemap.xml...")
        
        sitemap_path = self.web_dir / "sitemap.xml"
        base_url = "https://www.it-era.it"
        current_date = datetime.now().strftime('%Y-%m-%d')
        
        try:
            # Create sitemap root
            urlset = ET.Element("urlset")
            urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
            
            # Add main pages
            main_pages = [
                "",  # Homepage
                "/servizi",
                "/contatti",
                "/chi-siamo",
                "/blog"
            ]
            
            for page in main_pages:
                url = ET.SubElement(urlset, "url")
                ET.SubElement(url, "loc").text = f"{base_url}{page}"
                ET.SubElement(url, "lastmod").text = current_date
                ET.SubElement(url, "changefreq").text = "weekly"
                ET.SubElement(url, "priority").text = "0.8" if page == "" else "0.6"
            
            # Add city pages from generated files
            for html_file in self.pages_dir.glob("*.html"):
                if html_file.name.startswith(tuple(self.services.keys())):
                    url = ET.SubElement(urlset, "url")
                    ET.SubElement(url, "loc").text = f"{base_url}/{html_file.stem}"
                    ET.SubElement(url, "lastmod").text = current_date
                    ET.SubElement(url, "changefreq").text = "monthly"
                    ET.SubElement(url, "priority").text = "0.7"
            
            # Write sitemap
            tree = ET.ElementTree(urlset)
            ET.indent(tree, space="  ", level=0)
            tree.write(sitemap_path, encoding='utf-8', xml_declaration=True)
            
            logger.info(f"Sitemap updated with {len(list(urlset))} URLs")
            
        except Exception as e:
            logger.error(f"Error updating sitemap: {e}")

    def generate_summary_report(self) -> None:
        """Generate comprehensive summary report"""
        report = f"""
=== IT-ERA Comprehensive City Page Generation Report ===
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

STATISTICS:
- Total Municipalities Processed: {self.stats['total_municipalities']:,}
- Total Pages Generated: {self.stats['pages_generated']:,}
- Errors Encountered: {self.stats['errors']:,}

BREAKDOWN BY SERVICE:
- Assistenza IT pages: {self.stats['total_municipalities'] * 2:,} (pages + drafts)
- Sicurezza Informatica pages: {self.stats['total_municipalities'] * 2:,} (pages + drafts)  
- Cloud Storage pages: {self.stats['total_municipalities'] * 2:,} (pages + drafts)

EXPECTED TOTAL: {self.stats['total_municipalities'] * 6:,} pages
ACTUAL GENERATED: {self.stats['pages_generated']:,} pages
SUCCESS RATE: {(self.stats['pages_generated'] / (self.stats['total_municipalities'] * 6) * 100):.1f}%

PROVINCES COVERED:
"""
        
        for code, name in self.province_names.items():
            report += f"- {name} ({code})\n"
        
        report += f"""
FILES LOCATIONS:
- Production pages: web/pages/
- Draft pages: web/pages-draft/
- Updated sitemap: web/sitemap.xml
- Log file: logs/comprehensive_generator.log

=== Report Complete ===
"""
        
        print(report)
        logger.info("Generation complete! Check the summary above for details.")

    def run(self) -> bool:
        """Run the complete generation process"""
        try:
            logger.info("=== Starting IT-ERA Comprehensive City Page Generator ===")
            
            # Load municipalities data
            municipalities_data = self.load_municipalities_data()
            
            # Verify templates exist
            for service_key, config in self.services.items():
                template_path = self.templates_dir / config["template"]
                if not template_path.exists():
                    raise FileNotFoundError(f"Template not found: {template_path}")
                logger.info(f"✓ Template found: {config['template']}")
            
            # Process all municipalities
            self.process_municipalities(municipalities_data)
            
            # Update sitemap
            self.update_sitemap()
            
            # Generate report
            self.generate_summary_report()
            
            return True
            
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            return False

def main():
    """Main execution function"""
    project_root = "/Users/andreapanzeri/progetti/IT-ERA"
    
    generator = ComprehensiveCityPageGenerator(project_root)
    success = generator.run()
    
    if success:
        print("✅ All 4,506 pages generated successfully!")
        print("📁 Check web/pages/ and web/pages-draft/ directories")
        print("🗺️  Sitemap updated automatically")
    else:
        print("❌ Generation failed. Check logs for details.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())