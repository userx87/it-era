#!/usr/bin/env python3
"""
IT-ERA Contact Form Integration Script
Integrates universal contact form into all landing pages and service pages
"""

import os
import re
import glob
from pathlib import Path
import logging
from typing import List, Dict, Tuple

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ContactFormIntegrator:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.component_path = self.base_dir / "components" / "contact-form-universal.html"
        self.stats = {
            'processed': 0,
            'updated': 0,
            'errors': 0,
            'skipped': 0
        }

    def load_contact_component(self) -> str:
        """Load the universal contact form component"""
        try:
            with open(self.component_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to load contact component: {e}")
            return ""

    def find_insertion_point(self, content: str) -> Tuple[int, str]:
        """
        Find the best insertion point for contact form in HTML content
        Returns (position, insertion_type)
        """
        # Priority order for insertion points
        insertion_points = [
            # Before closing main tag
            (r'</main>', 'before_main_close'),
            # Before footer
            (r'<footer', 'before_footer'),
            # Before closing body
            (r'</body>', 'before_body_close'),
            # Before scripts section
            (r'<script', 'before_scripts'),
            # Last resort - before closing html
            (r'</html>', 'before_html_close')
        ]

        for pattern, insertion_type in insertion_points:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.start(), insertion_type

        # If no insertion point found, append at end
        return len(content), 'append'

    def should_skip_file(self, file_path: Path) -> bool:
        """Check if file should be skipped"""
        skip_patterns = [
            '.backup',
            '.old',
            '.bak',
            'template',  # Skip template files
            'component'  # Skip component files
        ]
        
        file_str = str(file_path)
        return any(pattern in file_str for pattern in skip_patterns)

    def has_contact_form(self, content: str) -> bool:
        """Check if page already has a contact form"""
        contact_indicators = [
            'contact-form-container',
            'universalContactForm',
            'UniversalContactFormHandler',
            'id="contactForm"',
            'class="contact-form"'
        ]
        
        return any(indicator in content for indicator in contact_indicators)

    def create_page_specific_form(self, content: str, file_path: Path) -> str:
        """Create page-specific contact form configuration"""
        # Extract city and service from filename
        filename = file_path.stem
        
        # Detect service type
        service_type = self.detect_service_type(filename, content)
        city = self.extract_city_from_filename(filename)
        
        # Add page-specific configuration
        form_config = f"""
<script>
// Page-specific contact form configuration
window.contactFormConfig = {{
    defaultService: '{service_type}',
    detectedCity: '{city}',
    pageType: '{self.get_page_type(filename)}',
    trackingSource: '{filename}'
}};
</script>
"""
        
        return form_config

    def detect_service_type(self, filename: str, content: str) -> str:
        """Detect service type from filename and content"""
        if 'sicurezza-informatica' in filename:
            return 'Sicurezza Informatica'
        elif 'cloud-storage' in filename:
            return 'Cloud Storage'
        elif 'backup' in filename:
            return 'Backup Automatico'
        elif 'firewall' in filename:
            return 'Firewall e Protezione'
        elif 'voip' in filename:
            return 'VoIP e Telefonia'
        elif 'assistenza-it' in filename:
            return 'Assistenza IT'
        else:
            return 'Assistenza IT'

    def extract_city_from_filename(self, filename: str) -> str:
        """Extract city name from filename"""
        # Pattern matching for city extraction
        patterns = [
            r'assistenza-it-(.+)',
            r'cloud-storage-(.+)',
            r'sicurezza-informatica-(.+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, filename)
            if match:
                city_slug = match.group(1)
                # Convert slug to proper city name
                return city_slug.replace('-', ' ').title()
        
        return ''

    def get_page_type(self, filename: str) -> str:
        """Determine page type for analytics"""
        if filename.startswith('assistenza-it-'):
            return 'city_landing'
        elif filename.startswith('cloud-storage-'):
            return 'service_city'
        elif filename.startswith('sicurezza-informatica-'):
            return 'security_city'
        else:
            return 'service_page'

    def process_file(self, file_path: Path, contact_component: str) -> bool:
        """Process a single HTML file"""
        try:
            logger.info(f"Processing: {file_path.name}")
            
            # Skip if should be skipped
            if self.should_skip_file(file_path):
                logger.info(f"Skipping: {file_path.name} (matches skip pattern)")
                self.stats['skipped'] += 1
                return False

            # Read file content
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Check if already has contact form
            if self.has_contact_form(content):
                logger.info(f"Skipping: {file_path.name} (already has contact form)")
                self.stats['skipped'] += 1
                return False

            # Find insertion point
            insertion_pos, insertion_type = self.find_insertion_point(content)
            
            # Create page-specific configuration
            page_config = self.create_page_specific_form(content, file_path)
            
            # Create contact form section with proper HTML structure
            contact_section = f"""
    <!-- Contact Form Section - Auto-integrated by IT-ERA -->
    <section class="contact-section py-5 bg-light">
        <div class="container">
            {contact_component}
        </div>
    </section>
    
    {page_config}
"""

            # Insert contact form
            if insertion_type == 'append':
                new_content = content + contact_section
            else:
                new_content = (
                    content[:insertion_pos] + 
                    contact_section + 
                    content[insertion_pos:]
                )

            # Create backup
            backup_path = file_path.with_suffix('.html.backup')
            if not backup_path.exists():
                with open(backup_path, 'w', encoding='utf-8') as f:
                    f.write(content)

            # Write updated content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

            logger.info(f"✅ Updated: {file_path.name} (insertion: {insertion_type})")
            self.stats['updated'] += 1
            return True

        except Exception as e:
            logger.error(f"❌ Error processing {file_path.name}: {e}")
            self.stats['errors'] += 1
            return False
        finally:
            self.stats['processed'] += 1

    def integrate_forms(self):
        """Main integration process"""
        logger.info("Starting contact form integration process...")
        
        # Load contact component
        contact_component = self.load_contact_component()
        if not contact_component:
            logger.error("❌ Failed to load contact component. Aborting.")
            return False

        # Define target directories and patterns
        target_patterns = [
            # City landing pages
            "web/pages-draft/assistenza-it-*.html",
            "web/pages-draft/cloud-storage-*.html", 
            "web/pages-draft/sicurezza-informatica-*.html",
            # Production pages
            "web/pages/assistenza-it-*.html",
            "web/pages/cloud-storage-*.html",
            "web/pages/sicurezza-informatica-*.html",
            # Main service pages
            "web/pages/assistenza-it.html",
            "web/pages/sicurezza-informatica.html",
            "web/pages/cloud-storage.html",
            "web/pages/backup-automatico.html",
            "web/pages/firewall-watchguard.html",
            "web/pages/voip-telefonia.html"
        ]

        # Process all target files
        for pattern in target_patterns:
            full_pattern = str(self.base_dir / pattern)
            files = glob.glob(full_pattern)
            
            logger.info(f"Found {len(files)} files matching pattern: {pattern}")
            
            for file_path in files:
                self.process_file(Path(file_path), contact_component)

        # Print statistics
        self.print_statistics()
        return True

    def print_statistics(self):
        """Print integration statistics"""
        logger.info("\n" + "="*60)
        logger.info("CONTACT FORM INTEGRATION COMPLETED")
        logger.info("="*60)
        logger.info(f"📊 Files processed:     {self.stats['processed']}")
        logger.info(f"✅ Files updated:       {self.stats['updated']}")
        logger.info(f"⏭️  Files skipped:       {self.stats['skipped']}")
        logger.info(f"❌ Errors encountered:  {self.stats['errors']}")
        logger.info("="*60)
        
        if self.stats['updated'] > 0:
            logger.info(f"🚀 Contact forms successfully integrated into {self.stats['updated']} pages!")
            logger.info("📧 Forms will send emails via Resend.com API")
            logger.info("🎯 Conversion tracking and analytics enabled")
        
        if self.stats['errors'] > 0:
            logger.warning(f"⚠️  {self.stats['errors']} files had errors. Check logs for details.")

def main():
    """Main execution function"""
    # Get base directory (script should be run from project root)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    logger.info(f"Base directory: {base_dir}")
    
    # Create integrator instance
    integrator = ContactFormIntegrator(base_dir)
    
    # Run integration
    success = integrator.integrate_forms()
    
    if success:
        logger.info("🎉 Integration completed successfully!")
        return 0
    else:
        logger.error("💥 Integration failed!")
        return 1

if __name__ == "__main__":
    exit(main())