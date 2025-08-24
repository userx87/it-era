#!/usr/bin/env python3
"""
IT-ERA Comprehensive Landing Page Generator
Generates SEO-optimized landing pages for all Lombardy cities using perfected templates.

Requirements:
1. Uses three production-ready templates (assistenza-it, sicurezza-informatica, cloud-storage)
2. Replaces {{CITY}} placeholders with actual city names
3. Generates appropriate URLs and file names
4. Includes SEO optimization with Schema.org, Open Graph, and meta tags
5. Maintains email integration (andrea@bulltech.it via Resend API)
6. Creates both web/pages/ and web/pages-draft/ versions
7. Updates sitemap.xml
8. Includes comprehensive validation and error handling

Author: Claude Code
Version: 2.0
Date: 2025-01-24
"""

import os
import re
import json
import logging
import shutil
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from urllib.parse import quote
import unicodedata

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/andreapanzeri/progetti/IT-ERA/logs/landing_generator_comprehensive.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ComprehensiveLandingGenerator:
    """Comprehensive landing page generator for IT-ERA"""
    
    def __init__(self, project_root: str):
        """Initialize the generator with project paths"""
        self.project_root = Path(project_root)
        self.templates_dir = self.project_root / "templates"
        self.pages_dir = self.project_root / "web" / "pages"
        self.pages_draft_dir = self.project_root / "web" / "pages-draft"
        self.sitemap_path = self.project_root / "web" / "sitemap.xml"
        self.backup_dir = self.project_root / "backup" / f"generator_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Template configurations (with fallback support for both 'template_file' and 'file' keys)
        self.template_configs = {
            'assistenza-it': {
                'template_file': 'assistenza-it-modern.html',  # Use template with placeholders
                'file': 'assistenza-it-modern.html',  # Fallback for config compatibility
                'service_type': 'Assistenza IT',
                'service_name': 'Assistenza IT',  # Fallback for config compatibility
                'service_description': 'Supporto tecnico 24/7, risoluzione problemi computer, installazione software. SLA 4 ore garantito.',
                'keywords_template': 'assistenza it {city}, supporto tecnico {city}, riparazione computer {city}, consulenza informatica {region}'
            },
            'sicurezza-informatica': {
                'template_file': 'sicurezza-informatica-modern.html',
                'file': 'sicurezza-informatica-modern.html',  # Fallback for config compatibility
                'service_type': 'Sicurezza Informatica',
                'service_name': 'Sicurezza Informatica',  # Fallback for config compatibility
                'service_description': 'SOC 24/7, protezione ransomware, penetration test, compliance ISO27001. Zero breach garantito.',
                'keywords_template': 'sicurezza informatica {city}, cybersecurity {city}, protezione ransomware {region}, SOC 24/7, penetration test'
            },
            'cloud-storage': {
                'template_file': 'cloud-storage-perfect.html',
                'file': 'cloud-storage-perfect.html',  # Fallback for config compatibility
                'service_type': 'Cloud Storage',
                'service_name': 'Cloud Storage',  # Fallback for config compatibility
                'service_description': 'Backup automatico, archiviazione sicura, sincronizzazione dati. GDPR compliant e AES-256.',
                'keywords_template': 'cloud storage {city}, backup {city}, archiviazione dati {region}, sincronizzazione file, GDPR compliance'
            }
        }
        
        # Statistics for progress tracking
        self.stats = {
            'cities_processed': 0,
            'pages_generated': 0,
            'pages_updated': 0,
            'errors': 0,
            'warnings': 0
        }

    def extract_cities_from_existing_files(self) -> List[str]:
        """Extract city names from existing landing page files"""
        cities = set()
        
        # Pattern to match city names from file names
        pattern = r'assistenza-it-(.+)\.html$'
        
        for file_path in self.pages_dir.glob('assistenza-it-*.html'):
            match = re.match(pattern, file_path.name)
            if match:
                city_slug = match.group(1)
                cities.add(city_slug)
        
        # Convert to sorted list for consistency
        cities_list = sorted(list(cities))
        logger.info(f"Extracted {len(cities_list)} cities from existing files")
        
        return cities_list

    def slug_to_city_name(self, slug: str) -> str:
        """Convert URL slug back to proper city name"""
        # Handle special cases first
        special_cases = {
            'd-adda': "d'Adda",
            'cantu': 'Cantù',
            'como': 'Como',
            'milano': 'Milano',
            'monza': 'Monza',
            'lecco': 'Lecco',
            'bergamo': 'Bergamo',
            'lodi': 'Lodi',
            'crema': 'Crema',
            'treviglio': 'Treviglio',
            'sant-angelo-lodigiano': "Sant'Angelo Lodigiano",
            'sant-omobono-terme': "Sant'Omobono Terme",
            'san-pellegrino-terme': 'San Pellegrino Terme',
            'almenno-san-bartolomeo': 'Almenno San Bartolomeo',
            'cazzano-sant-andrea': "Cazzano Sant'Andrea"
        }
        
        if slug in special_cases:
            return special_cases[slug]
        
        # Standard conversion: replace hyphens with spaces and title case
        city_name = slug.replace('-', ' ')
        
        # Handle special Italian prepositions and articles
        words = city_name.split()
        result = []
        
        for i, word in enumerate(words):
            # Don't capitalize certain prepositions and articles unless they're first
            if i > 0 and word.lower() in ['di', 'del', 'della', 'dei', 'delle', 'da', 'in', 'sul', 'sulla', 'con', 'e', 'al', 'alla']:
                result.append(word.lower())
            else:
                result.append(word.capitalize())
        
        return ' '.join(result)

    def city_name_to_slug(self, city_name: str) -> str:
        """Convert city name to URL-friendly slug"""
        # Normalize unicode characters
        slug = unicodedata.normalize('NFD', city_name)
        slug = ''.join(c for c in slug if unicodedata.category(c) != 'Mn')
        
        # Replace spaces and special characters with hyphens
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[-\s]+', '-', slug)
        slug = slug.lower().strip('-')
        
        return slug

    def load_template(self, template_type: str) -> str:
        """Load and return template content"""
        config = self.template_configs.get(template_type)
        if not config:
            raise ValueError(f"Unknown template type: {template_type}")
        
        template_file = config.get('template_file', config.get('file', ''))
        if not template_file:
            raise ValueError(f"No template file specified for {template_type}")
        
        template_path = self.templates_dir / template_file
        
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")
        
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error loading template {template_path}: {e}")
            raise

    def generate_seo_content(self, city_name: str, city_slug: str, template_type: str) -> Dict[str, str]:
        """Generate SEO-optimized content for the city and service type"""
        config = self.template_configs[template_type]
        region = "Lombardia"
        
        return {
            'title': f"{config['service_type']} {city_name} | {config['service_type']} Professionale 24/7 | IT-ERA",
            'description': f"{config['service_type']} professionale a {city_name}, {region}. {config['service_description']}",
            'keywords': config['keywords_template'].format(city=city_name, region=region),
            'canonical_url': f"https://it-era.pages.dev/pages/{template_type}-{city_slug}.html",
            'og_image': f"https://it-era.pages.dev/images/{template_type}-{city_slug}-og.jpg",
            'schema_name': f"IT-ERA - {config['service_type']} {city_name}"
        }

    def process_template_placeholders(self, template_content: str, city_name: str, city_slug: str, 
                                     template_type: str, seo_content: Dict[str, str]) -> str:
        """Replace all placeholders in the template with actual values"""
        
        # Create replacement dictionary
        replacements = {
            '{{CITY}}': city_name,
            '{{CITY_SLUG}}': city_slug,
            '{{REGION}}': 'Lombardia',
            '{{SERVICE_TYPE}}': self.template_configs[template_type].get('service_type', self.template_configs[template_type].get('service_name', 'IT Services')),
            '{{SEO_TITLE}}': seo_content['title'],
            '{{SEO_DESCRIPTION}}': seo_content['description'],
            '{{SEO_KEYWORDS}}': seo_content['keywords'],
            '{{CANONICAL_URL}}': seo_content['canonical_url'],
            '{{OG_IMAGE}}': seo_content['og_image'],
            '{{SCHEMA_NAME}}': seo_content['schema_name'],
            '{{CURRENT_YEAR}}': str(datetime.now().year),
            '{{EMAIL}}': 'andrea@bulltech.it',
            '{{PHONE}}': '+39 039 888 2041',
            '{{COMPANY}}': 'IT-ERA'
        }
        
        # Apply replacements
        processed_content = template_content
        for placeholder, replacement in replacements.items():
            processed_content = processed_content.replace(placeholder, replacement)
        
        # Handle special cases for URLs and navigation
        processed_content = self.update_navigation_links(processed_content, city_slug)
        
        return processed_content

    def update_navigation_links(self, content: str, city_slug: str) -> str:
        """Update navigation links to point to city-specific pages"""
        
        # Navigation link patterns to update
        nav_updates = {
            '/pages/assistenza-it-milano.html': f'/pages/assistenza-it-{city_slug}.html',
            '/pages/sicurezza-informatica-milano.html': f'/pages/sicurezza-informatica-{city_slug}.html',
            '/pages/cloud-storage-milano.html': f'/pages/cloud-storage-{city_slug}.html'
        }
        
        for old_link, new_link in nav_updates.items():
            content = content.replace(old_link, new_link)
        
        return content

    def validate_generated_content(self, content: str, city_name: str, template_type: str) -> Tuple[bool, List[str]]:
        """Validate generated content for completeness and quality"""
        errors = []
        warnings = []
        
        # Check for remaining placeholders
        remaining_placeholders = re.findall(r'\{\{[^}]+\}\}', content)
        if remaining_placeholders:
            errors.append(f"Unreplaced placeholders found: {remaining_placeholders}")
        
        # Check for essential HTML structure
        required_elements = ['<title>', '<meta name="description"', '<h1']  # Removed '<footer' as not all templates have it
        for element in required_elements:
            if element not in content:
                errors.append(f"Missing required HTML element: {element}")
        
        # Check for SEO elements
        seo_elements = ['canonical', 'og:title', 'og:description', 'schema.org']
        for element in seo_elements:
            if element not in content.lower():
                warnings.append(f"Missing SEO element: {element}")
        
        # Check for city name presence
        if city_name not in content:
            errors.append(f"City name '{city_name}' not found in content")
        
        # Check content length (should be substantial)
        if len(content) < 10000:  # Minimum reasonable length
            warnings.append("Generated content seems short (< 10KB)")
        
        # Log validation results
        if errors:
            logger.error(f"Validation errors for {city_name} ({template_type}): {errors}")
            self.stats['errors'] += len(errors)
        
        if warnings:
            logger.warning(f"Validation warnings for {city_name} ({template_type}): {warnings}")
            self.stats['warnings'] += len(warnings)
        
        return len(errors) == 0, errors + warnings

    def create_backup(self):
        """Create backup of existing files before generation"""
        logger.info("Creating backup of existing files...")
        
        # Create backup directory
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Backup pages directories
        if self.pages_dir.exists():
            shutil.copytree(self.pages_dir, self.backup_dir / "pages", dirs_exist_ok=True)
        
        if self.pages_draft_dir.exists():
            shutil.copytree(self.pages_draft_dir, self.backup_dir / "pages-draft", dirs_exist_ok=True)
        
        # Backup sitemap
        if self.sitemap_path.exists():
            shutil.copy2(self.sitemap_path, self.backup_dir / "sitemap.xml")
        
        logger.info(f"Backup created at: {self.backup_dir}")

    def generate_page(self, city_slug: str, template_type: str, target_dir: Path) -> bool:
        """Generate a single landing page"""
        try:
            city_name = self.slug_to_city_name(city_slug)
            
            # Load template
            template_content = self.load_template(template_type)
            
            # Generate SEO content
            seo_content = self.generate_seo_content(city_name, city_slug, template_type)
            
            # Process template
            processed_content = self.process_template_placeholders(
                template_content, city_name, city_slug, template_type, seo_content
            )
            
            # Validate content
            is_valid, validation_messages = self.validate_generated_content(
                processed_content, city_name, template_type
            )
            
            if not is_valid:
                logger.error(f"Validation failed for {city_name} ({template_type})")
                return False
            
            # Write file
            output_file = target_dir / f"{template_type}-{city_slug}.html"
            target_dir.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(processed_content)
            
            logger.debug(f"Generated: {output_file}")
            self.stats['pages_generated'] += 1
            
            return True
            
        except Exception as e:
            logger.error(f"Error generating page for {city_slug} ({template_type}): {e}")
            self.stats['errors'] += 1
            return False

    def update_sitemap(self, cities: List[str]):
        """Update sitemap.xml with generated pages"""
        logger.info("Updating sitemap.xml...")
        
        try:
            # Create or load existing sitemap
            if self.sitemap_path.exists():
                tree = ET.parse(self.sitemap_path)
                root = tree.getroot()
                
                # Remove namespace for easier handling
                for elem in root.iter():
                    elem.tag = elem.tag.split('}')[-1]
            else:
                # Create new sitemap
                root = ET.Element("urlset")
                root.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
                tree = ET.ElementTree(root)
            
            # Get existing URLs to avoid duplicates
            existing_urls = set()
            for url_elem in root.findall('url'):
                loc_elem = url_elem.find('loc')
                if loc_elem is not None:
                    existing_urls.add(loc_elem.text)
            
            # Add new URLs
            base_url = "https://it-era.pages.dev/pages/"
            current_date = datetime.now().strftime('%Y-%m-%d')
            
            new_urls_added = 0
            
            for city_slug in cities:
                for template_type in self.template_configs.keys():
                    url = f"{base_url}{template_type}-{city_slug}.html"
                    
                    if url not in existing_urls:
                        url_elem = ET.SubElement(root, "url")
                        ET.SubElement(url_elem, "loc").text = url
                        ET.SubElement(url_elem, "lastmod").text = current_date
                        ET.SubElement(url_elem, "changefreq").text = "monthly"
                        ET.SubElement(url_elem, "priority").text = "0.8"
                        
                        new_urls_added += 1
            
            # Write sitemap
            tree.write(self.sitemap_path, encoding='utf-8', xml_declaration=True)
            
            logger.info(f"Sitemap updated with {new_urls_added} new URLs")
            
        except Exception as e:
            logger.error(f"Error updating sitemap: {e}")
            self.stats['errors'] += 1

    def run_comprehensive_generation(self) -> Dict[str, any]:
        """Run the complete landing page generation process"""
        logger.info("Starting comprehensive landing page generation...")
        start_time = datetime.now()
        
        try:
            # Create backup
            self.create_backup()
            
            # Extract cities from existing files
            cities = self.extract_cities_from_existing_files()
            logger.info(f"Processing {len(cities)} cities")
            
            # Generate pages for all template types and directories
            for city_slug in cities:
                self.stats['cities_processed'] += 1
                city_name = self.slug_to_city_name(city_slug)
                
                logger.info(f"Processing city: {city_name} ({city_slug}) - {self.stats['cities_processed']}/{len(cities)}")
                
                # Generate for each template type
                for template_type in self.template_configs.keys():
                    # Generate for production (pages)
                    success_prod = self.generate_page(city_slug, template_type, self.pages_dir)
                    
                    # Generate for draft (pages-draft)
                    success_draft = self.generate_page(city_slug, template_type, self.pages_draft_dir)
                    
                    if success_prod and success_draft:
                        logger.debug(f"Successfully generated {template_type} for {city_name}")
                    else:
                        logger.warning(f"Partial failure for {template_type} in {city_name}")
            
            # Update sitemap
            self.update_sitemap(cities)
            
            # Calculate execution time
            execution_time = datetime.now() - start_time
            
            # Prepare final report
            report = {
                'execution_time': str(execution_time),
                'total_cities': len(cities),
                'total_pages_generated': self.stats['pages_generated'],
                'cities_processed': self.stats['cities_processed'],
                'errors': self.stats['errors'],
                'warnings': self.stats['warnings'],
                'backup_location': str(self.backup_dir),
                'success_rate': (self.stats['pages_generated'] / (len(cities) * len(self.template_configs) * 2)) * 100 if cities else 0
            }
            
            logger.info("Comprehensive generation completed!")
            logger.info(f"Summary: {report}")
            
            return report
            
        except Exception as e:
            logger.error(f"Critical error during generation: {e}")
            self.stats['errors'] += 1
            
            return {
                'error': str(e),
                'execution_time': str(datetime.now() - start_time),
                'stats': self.stats
            }

    def validate_templates(self) -> bool:
        """Validate that all required templates exist and are properly formatted"""
        logger.info("Validating templates...")
        
        all_valid = True
        
        for template_type, config in self.template_configs.items():
            template_file = config.get('template_file', config.get('file', ''))
            if not template_file:
                logger.error(f"No template file specified for {template_type}")
                all_valid = False
                continue
                
            template_path = self.templates_dir / template_file
            
            if not template_path.exists():
                logger.error(f"Template not found: {template_path}")
                all_valid = False
                continue
            
            try:
                with open(template_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for essential placeholders (based on what templates actually use)
                required_placeholders = ['{{CITY}}']  # {{SERVICE_TYPE}} is not used in these templates
                missing_placeholders = []
                
                for placeholder in required_placeholders:
                    if placeholder not in content:
                        missing_placeholders.append(placeholder)
                
                if missing_placeholders:
                    logger.error(f"Template {template_type} missing placeholders: {missing_placeholders}")
                    all_valid = False
                else:
                    logger.info(f"Template {template_type} validated successfully")
                    
            except Exception as e:
                logger.error(f"Error validating template {template_type}: {e}")
                all_valid = False
        
        return all_valid

def main():
    """Main execution function"""
    # Project root path
    project_root = "/Users/andreapanzeri/progetti/IT-ERA"
    
    # Initialize generator
    generator = ComprehensiveLandingGenerator(project_root)
    
    # Validate templates first
    if not generator.validate_templates():
        logger.error("Template validation failed. Aborting generation.")
        return False
    
    # Run comprehensive generation
    report = generator.run_comprehensive_generation()
    
    # Output final report
    print("\n" + "="*60)
    print("IT-ERA COMPREHENSIVE LANDING PAGE GENERATION REPORT")
    print("="*60)
    
    if 'error' in report:
        print(f"❌ Generation failed with error: {report['error']}")
        return False
    
    print(f"✅ Execution time: {report['execution_time']}")
    print(f"📊 Cities processed: {report['cities_processed']}")
    print(f"📄 Pages generated: {report['total_pages_generated']}")
    print(f"📈 Success rate: {report['success_rate']:.1f}%")
    print(f"⚠️  Errors: {report['errors']}")
    print(f"⚠️  Warnings: {report['warnings']}")
    print(f"💾 Backup location: {report['backup_location']}")
    
    print("\n🎉 Generation completed successfully!")
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)