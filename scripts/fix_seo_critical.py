#!/usr/bin/env python3
"""
SEO Critical Fixes Script for IT-ERA Landing Pages
Adds missing canonical URLs, Open Graph tags, and Twitter Cards to all 767 pages
"""

import os
import re
import json
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SEOOptimizer:
    def __init__(self, pages_dir):
        self.pages_dir = Path(pages_dir)
        self.base_url = "https://it-era.pages.dev/pages/"
        self.fixed_count = 0
        self.error_count = 0
        
    def extract_page_info(self, content):
        """Extract title and description from existing meta tags"""
        title_match = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
        desc_match = re.search(r'<meta name="description" content="(.*?)"', content)
        
        title = title_match.group(1).strip() if title_match else ""
        description = desc_match.group(1).strip() if desc_match else ""
        
        return title, description
    
    def generate_canonical_url(self, filename):
        """Generate canonical URL for the page"""
        return f"{self.base_url}{filename}"
    
    def generate_og_image_url(self, filename):
        """Generate OG image URL based on service type and city"""
        if "assistenza-it-" in filename:
            service = "it-support"
        elif "cloud-storage-" in filename:
            service = "cloud-storage"
        elif "sicurezza-informatica-" in filename:
            service = "cybersecurity"
        else:
            service = "it-services"
        
        city = filename.replace("assistenza-it-", "").replace("cloud-storage-", "").replace("sicurezza-informatica-", "").replace(".html", "")
        return f"https://it-era.pages.dev/images/{service}-{city}-og.jpg"
    
    def create_seo_tags(self, filename, title, description):
        """Create canonical, OG, and Twitter meta tags"""
        canonical_url = self.generate_canonical_url(filename)
        og_image = self.generate_og_image_url(filename)
        
        seo_tags = f"""
    <!-- SEO Critical Tags -->
    <link rel="canonical" href="{canonical_url}">
    
    <!-- Open Graph Tags -->
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{canonical_url}">
    <meta property="og:image" content="{og_image}">
    <meta property="og:locale" content="it_IT">
    <meta property="og:site_name" content="IT-ERA">
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{description}">
    <meta name="twitter:image" content="{og_image}">
    <meta name="twitter:site" content="@IT_ERA_Support">
    
    <!-- Additional SEO -->
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">"""
        
        return seo_tags
    
    def fix_heading_structure(self, content):
        """Fix heading hierarchy by replacing CSS classes with proper HTML headings"""
        # Main title (usually in hero section)
        content = re.sub(
            r'<h1 class="display-[3-4] fw-bold mb-4">(.*?)</h1>',
            r'<h1>\1</h1>',
            content
        )
        
        # Section titles
        content = re.sub(
            r'<h2 class="fw-bold mb-3">(.*?)</h2>',
            r'<h2>\1</h2>',
            content
        )
        
        # Service titles
        content = re.sub(
            r'<h5 class="fw-bold mb-3">(.*?)</h5>',
            r'<h3>\1</h3>',
            content
        )
        
        # Pricing titles
        content = re.sub(
            r'<h4 class="fw-bold mb-3">(.*?)</h4>',
            r'<h3>\1</h3>',
            content
        )
        
        return content
    
    def add_local_schema(self, filename, title):
        """Add LocalBusiness structured data"""
        city = self.extract_city_from_filename(filename)
        service_type = self.extract_service_type(filename)
        
        schema = f"""
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "IT-ERA - {service_type} {city}",
        "address": {{
            "@type": "PostalAddress",
            "addressLocality": "{city}",
            "addressRegion": "Lombardia",
            "addressCountry": "IT"
        }},
        "telephone": "+39 012 3456789",
        "url": "{self.generate_canonical_url(filename)}",
        "areaServed": "{city}, Lombardia",
        "serviceType": ["{service_type}"],
        "aggregateRating": {{
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127"
        }}
    }}
    </script>"""
        
        return schema
    
    def extract_city_from_filename(self, filename):
        """Extract city name from filename"""
        city = filename.replace("assistenza-it-", "").replace("cloud-storage-", "").replace("sicurezza-informatica-", "").replace(".html", "")
        return city.replace("-", " ").title()
    
    def extract_service_type(self, filename):
        """Extract service type from filename"""
        if "assistenza-it-" in filename:
            return "Assistenza IT"
        elif "cloud-storage-" in filename:
            return "Cloud Storage"
        elif "sicurezza-informatica-" in filename:
            return "Sicurezza Informatica"
        else:
            return "Servizi IT"
    
    def process_file(self, file_path):
        """Process a single HTML file"""
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            filename = file_path.name
            
            # Check if already has canonical (skip if already optimized)
            if 'rel="canonical"' in content:
                logger.info(f"Skipping {filename} - already has canonical URL")
                return
            
            # Extract existing meta data
            title, description = self.extract_page_info(content)
            
            if not title or not description:
                logger.warning(f"Missing title or description in {filename}")
                return
            
            # Generate SEO tags
            seo_tags = self.create_seo_tags(filename, title, description)
            local_schema = self.add_local_schema(filename, title)
            
            # Fix heading structure
            content = self.fix_heading_structure(content)
            
            # Find insertion point (after Google Fonts link)
            google_fonts_pattern = r'(.*?<link href="https://fonts\.googleapis\.com/.*?".*?>)'
            match = re.search(google_fonts_pattern, content, re.DOTALL)
            
            if match:
                # Insert SEO tags after Google Fonts
                new_content = content.replace(
                    match.group(1),
                    match.group(1) + seo_tags
                )
            else:
                # Fallback: insert before closing </head>
                new_content = content.replace('</head>', seo_tags + '\n</head>')
            
            # Add schema before closing </body>
            new_content = new_content.replace('</body>', local_schema + '\n</body>')
            
            # Write back to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            self.fixed_count += 1
            logger.info(f"✅ Fixed SEO for {filename}")
            
        except Exception as e:
            self.error_count += 1
            logger.error(f"❌ Error processing {filename}: {str(e)}")
    
    def run(self):
        """Process all HTML files in the pages directory"""
        logger.info(f"Starting SEO optimization for pages in {self.pages_dir}")
        
        html_files = list(self.pages_dir.glob("*.html"))
        total_files = len(html_files)
        
        logger.info(f"Found {total_files} HTML files to process")
        
        for file_path in html_files:
            self.process_file(file_path)
        
        logger.info(f"""
SEO Optimization Complete!
📊 Summary:
  - Total files: {total_files}
  - Successfully fixed: {self.fixed_count}
  - Errors: {self.error_count}
  - Skipped: {total_files - self.fixed_count - self.error_count}
        """)

def main():
    """Main execution function"""
    pages_dir = "/Users/andreapanzeri/progetti/IT-ERA/web/pages"
    
    if not os.path.exists(pages_dir):
        logger.error(f"Pages directory not found: {pages_dir}")
        return
    
    optimizer = SEOOptimizer(pages_dir)
    optimizer.run()

if __name__ == "__main__":
    main()