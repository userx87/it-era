#!/usr/bin/env python3
"""
IT-ERA Sitemap Generator v2 - Enhanced with 404 Detection & Empty Page Removal
Generates optimized sitemap.xml with extensive validation and cleanup

Features:
- Scans all HTML files in specified directories
- Removes empty/minimal content pages
- Validates URLs for 404/410 errors
- Normalizes URLs (removes .html extensions where appropriate)
- Logs all removed URLs with reasons
- Atomic sitemap writing (tmp -> final)
- Production-ready with environment variable support

Author: IT-ERA Development Team
Version: 2.0 (HIVESTORM Enhanced)
"""

import os
import sys
import glob
import requests
import logging
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import xml.etree.ElementTree as ET
from xml.dom import minidom
import re

# Configuration Constants
BASE_URL = os.getenv('BASE_URL', 'https://it-era.it')
SCAN_DIRS = os.getenv('SCAN_DIRS', 'web,public,content').split(',')
PUBLIC_DIR = os.getenv('PUBLIC_DIR', 'public')
LOG_DIR = os.getenv('LOG_DIR', 'logs')
HEAD_TIMEOUT = int(os.getenv('HEAD_TIMEOUT', '10'))
HEAD_WORKERS = int(os.getenv('HEAD_WORKERS', '12'))
MAX_URLS_PER_FILE = int(os.getenv('MAX_URLS_PER_FILE', '50000'))

# Content validation thresholds
MIN_CONTENT_LENGTH = 500  # Minimum content length for valid pages
MIN_MEANINGFUL_WORDS = 10  # Minimum meaningful words

# URL normalization whitelist (keep .html for these)
KEEP_HTML_EXACT = {
    '/sitemap.html',
    '/404.html', 
    '/robots.html'
}

class SitemapGenerator:
    def __init__(self):
        self.base_url = BASE_URL
        self.scan_dirs = SCAN_DIRS
        self.public_dir = PUBLIC_DIR
        self.log_dir = LOG_DIR
        
        # Statistics
        self.total_files = 0
        self.valid_pages = 0
        self.empty_pages = 0
        self.error_pages = 0
        self.removed_urls = []
        
        # Setup logging
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging for removed URLs"""
        os.makedirs(self.log_dir, exist_ok=True)
        
        # Log file for removed URLs
        timestamp = datetime.now().strftime('%Y%m%d')
        self.removed_log_file = os.path.join(self.log_dir, f'sitemap-removed-{timestamp}.txt')
        
        # Console logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s [%(levelname)s] %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler(os.path.join(self.log_dir, f'sitemap-generation-{timestamp}.log'))
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def log_removed_url(self, url, reason):
        """Log removed URL with timestamp and reason"""
        with open(self.removed_log_file, 'a', encoding='utf-8') as f:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            f.write(f"[{timestamp}] REMOVED: {url} - {reason}\n")
        
        self.removed_urls.append((url, reason))
        
    def find_html_files(self):
        """Find all HTML files in scan directories"""
        html_files = []
        
        for scan_dir in self.scan_dirs:
            scan_path = os.path.join(os.getcwd(), scan_dir.strip())
            
            if not os.path.exists(scan_path):
                self.logger.warning(f"Directory not found: {scan_path}")
                continue
                
            self.logger.info(f"Scanning directory: {scan_path}")
            
            # Find all HTML files recursively
            pattern = os.path.join(scan_path, '**', '*.html')
            files = glob.glob(pattern, recursive=True)
            
            # Filter out backup, test, and temp files
            filtered_files = []
            for file_path in files:
                if any(exclude in file_path.lower() for exclude in [
                    '/backup/', '/test/', '/temp/', '/node_modules/',
                    'test-', 'demo-', 'example-', '.tmp', '_test'
                ]):
                    continue
                filtered_files.append(file_path)
            
            html_files.extend(filtered_files)
            self.logger.info(f"Found {len(filtered_files)} HTML files in {scan_dir}")
        
        self.total_files = len(html_files)
        self.logger.info(f"Total HTML files found: {self.total_files}")
        
        return html_files
        
    def normalize_url(self, file_path):
        """Convert file path to normalized URL"""
        # Get relative path from scan directories
        relative_path = None
        
        for scan_dir in self.scan_dirs:
            scan_path = os.path.join(os.getcwd(), scan_dir.strip())
            if file_path.startswith(scan_path):
                relative_path = os.path.relpath(file_path, scan_path)
                break
        
        if not relative_path:
            return None
            
        # Convert to URL path
        url_path = '/' + relative_path.replace(os.sep, '/')
        
        # Normalize URL
        if url_path in KEEP_HTML_EXACT:
            # Keep exact URL for whitelisted pages
            pass
        elif url_path.endswith('/index.html'):
            # Remove /index.html -> /
            url_path = url_path.replace('/index.html', '/')
        elif url_path.endswith('.html'):
            # Remove .html extension
            url_path = url_path[:-5]
        
        # Handle root directory
        if url_path == '/':
            return self.base_url + '/'
        
        return self.base_url + url_path
        
    def is_valid_page_content(self, file_path):
        """Check if page has sufficient content"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Remove HTML tags for content analysis
            text_content = re.sub(r'<[^>]+>', ' ', content)
            text_content = re.sub(r'\s+', ' ', text_content).strip()
            
            # Check minimum content length
            if len(text_content) < MIN_CONTENT_LENGTH:
                return False, f"Content too short: {len(text_content)} chars"
            
            # Check meaningful words (exclude common HTML/JS words)
            words = text_content.split()
            meaningful_words = [w for w in words if len(w) > 2 and not w.lower() in {
                'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
                'var', 'function', 'return', 'if', 'else', 'for', 'while', 'document', 'window', 'console', 'true', 'false', 'null', 'undefined'
            }]
            
            if len(meaningful_words) < MIN_MEANINGFUL_WORDS:
                return False, f"Too few meaningful words: {len(meaningful_words)}"
            
            # Check for error pages indicators
            error_indicators = ['404', 'not found', 'page not found', 'error 404', 'pagina non trovata']
            content_lower = content.lower()
            for indicator in error_indicators:
                if indicator in content_lower and len(text_content) < 2000:
                    return False, f"Detected error page: contains '{indicator}'"
            
            return True, "Valid content"
            
        except Exception as e:
            return False, f"Error reading file: {str(e)}"
    
    def check_url_status(self, url):
        """Check if URL is accessible (not 404/410)"""
        try:
            response = requests.head(url, timeout=HEAD_TIMEOUT, allow_redirects=True)
            
            if response.status_code in [404, 410]:
                return False, f"HTTP {response.status_code}"
            elif response.status_code >= 400:
                return False, f"HTTP {response.status_code} error"
            
            return True, f"HTTP {response.status_code}"
            
        except requests.exceptions.Timeout:
            return False, "Timeout"
        except requests.exceptions.ConnectionError:
            return False, "Connection error"
        except Exception as e:
            return False, f"Request error: {str(e)}"
    
    def validate_urls_batch(self, urls):
        """Validate URLs in parallel"""
        valid_urls = []
        
        self.logger.info(f"Validating {len(urls)} URLs...")
        
        with ThreadPoolExecutor(max_workers=HEAD_WORKERS) as executor:
            # Submit all URL checks
            future_to_url = {executor.submit(self.check_url_status, url): url for url in urls}
            
            completed = 0
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                completed += 1
                
                try:
                    is_valid, reason = future.result()
                    
                    if is_valid:
                        valid_urls.append(url)
                    else:
                        self.log_removed_url(url, f"URL validation failed: {reason}")
                        self.error_pages += 1
                        
                except Exception as e:
                    self.log_removed_url(url, f"URL check exception: {str(e)}")
                    self.error_pages += 1
                
                # Progress indicator
                if completed % 50 == 0:
                    self.logger.info(f"URL validation progress: {completed}/{len(urls)}")
        
        self.logger.info(f"URL validation complete: {len(valid_urls)}/{len(urls)} valid")
        return valid_urls
    
    def get_page_priority(self, url):
        """Determine page priority based on URL pattern"""
        if url.endswith('/') and url.count('/') == 3:  # Homepage
            return 1.0
        elif any(service in url for service in ['/assistenza-it', '/sicurezza-informatica', '/cloud-storage']):
            if url.count('/') == 3:  # Main service page
                return 0.9
            else:  # City-specific service page
                return 0.8
        elif '/settori-' in url:
            return 0.7
        elif any(page in url for page in ['/contatti', '/chi-siamo', '/perche-it-era']):
            return 0.6
        else:
            return 0.5
    
    def get_change_frequency(self, url):
        """Determine change frequency based on URL pattern"""
        if url.endswith('/') and url.count('/') == 3:  # Homepage
            return 'daily'
        elif any(service in url for service in ['/assistenza-it', '/sicurezza-informatica', '/cloud-storage']):
            if url.count('/') == 3:  # Main service page
                return 'weekly'
            else:  # City-specific service page
                return 'monthly'
        else:
            return 'monthly'
    
    def generate_sitemap_xml(self, urls):
        """Generate sitemap XML from validated URLs"""
        # Create XML structure
        urlset = ET.Element('urlset')
        urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
        
        # Sort URLs for consistency (homepage first, then alphabetical)
        sorted_urls = sorted(urls, key=lambda u: (u != self.base_url + '/', u))
        
        for url in sorted_urls:
            url_element = ET.SubElement(urlset, 'url')
            
            # Location
            loc = ET.SubElement(url_element, 'loc')
            loc.text = url
            
            # Last modification
            lastmod = ET.SubElement(url_element, 'lastmod')
            lastmod.text = datetime.now().strftime('%Y-%m-%d')
            
            # Change frequency
            changefreq = ET.SubElement(url_element, 'changefreq')
            changefreq.text = self.get_change_frequency(url)
            
            # Priority
            priority = ET.SubElement(url_element, 'priority')
            priority.text = str(self.get_page_priority(url))
        
        # Pretty print XML
        rough_string = ET.tostring(urlset, 'unicode')
        reparsed = minidom.parseString(rough_string)
        pretty_xml = reparsed.toprettyxml(indent='  ')
        
        # Remove empty lines
        lines = [line for line in pretty_xml.split('\n') if line.strip()]
        return '\n'.join(lines)
    
    def write_sitemap_atomic(self, xml_content):
        """Write sitemap atomically (tmp -> final)"""
        sitemap_path = os.path.join(self.public_dir, 'sitemap.xml')
        sitemap_tmp = sitemap_path + '.tmp'
        
        # Ensure public directory exists
        os.makedirs(self.public_dir, exist_ok=True)
        
        try:
            # Write to temporary file
            with open(sitemap_tmp, 'w', encoding='utf-8') as f:
                f.write(xml_content)
            
            # Atomic move
            os.rename(sitemap_tmp, sitemap_path)
            
            self.logger.info(f"✅ Sitemap written successfully: {sitemap_path}")
            
            # Also copy to web directory if it exists
            web_sitemap = os.path.join('web', 'sitemap.xml')
            if os.path.exists('web'):
                try:
                    with open(web_sitemap, 'w', encoding='utf-8') as f:
                        f.write(xml_content)
                    self.logger.info(f"✅ Sitemap copied to: {web_sitemap}")
                except Exception as e:
                    self.logger.warning(f"⚠️ Could not copy to web directory: {e}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Error writing sitemap: {e}")
            # Cleanup tmp file
            if os.path.exists(sitemap_tmp):
                os.remove(sitemap_tmp)
            return False
    
    def generate_report(self):
        """Generate comprehensive generation report"""
        report_file = os.path.join(self.log_dir, f'sitemap-report-{datetime.now().strftime("%Y%m%d-%H%M%S")}.md')
        
        report_content = f"""# IT-ERA Sitemap Generation Report

## Generation Summary
- **Timestamp**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Base URL**: {self.base_url}
- **Scanned Directories**: {', '.join(self.scan_dirs)}

## Statistics
- **Total Files Scanned**: {self.total_files}
- **Valid Pages**: {self.valid_pages}
- **Empty Pages Removed**: {self.empty_pages}
- **Error Pages Removed**: {self.error_pages}
- **Success Rate**: {((self.valid_pages / self.total_files) * 100):.1f}%

## Removed URLs ({len(self.removed_urls)})
"""
        
        for url, reason in self.removed_urls:
            report_content += f"- `{url}` - {reason}\n"
        
        report_content += f"""
## Configuration
- **HEAD Timeout**: {HEAD_TIMEOUT}s
- **Parallel Workers**: {HEAD_WORKERS}
- **Min Content Length**: {MIN_CONTENT_LENGTH} chars
- **Min Meaningful Words**: {MIN_MEANINGFUL_WORDS}

## Files Generated
- **Sitemap**: `{self.public_dir}/sitemap.xml`
- **Removed Log**: `{self.removed_log_file}`
- **Generation Log**: `{self.log_dir}/sitemap-generation-*.log`
"""
        
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                f.write(report_content)
            self.logger.info(f"📄 Report generated: {report_file}")
        except Exception as e:
            self.logger.error(f"❌ Error generating report: {e}")
    
    def generate(self):
        """Main generation method"""
        self.logger.info("🚀 Starting IT-ERA Sitemap Generation v2")
        self.logger.info(f"🌐 Base URL: {self.base_url}")
        self.logger.info(f"📁 Scan directories: {', '.join(self.scan_dirs)}")
        
        # Find all HTML files
        html_files = self.find_html_files()
        
        if not html_files:
            self.logger.error("❌ No HTML files found!")
            return False
        
        # Process files and extract valid URLs
        valid_urls = []
        
        for file_path in html_files:
            # Check content validity
            is_valid, reason = self.is_valid_page_content(file_path)
            
            if not is_valid:
                self.log_removed_url(file_path, reason)
                self.empty_pages += 1
                continue
            
            # Normalize URL
            url = self.normalize_url(file_path)
            
            if url:
                valid_urls.append(url)
                self.valid_pages += 1
            else:
                self.log_removed_url(file_path, "Could not normalize URL")
                self.error_pages += 1
        
        self.logger.info(f"📊 Content validation complete: {len(valid_urls)} valid URLs")
        
        # Validate URLs are accessible (optional - can be disabled in production)
        if os.getenv('SKIP_URL_VALIDATION', '').lower() not in ['true', '1', 'yes']:
            valid_urls = self.validate_urls_batch(valid_urls)
        
        # Remove duplicates and sort
        valid_urls = list(set(valid_urls))
        valid_urls.sort()
        
        self.logger.info(f"🎯 Final URL count: {len(valid_urls)}")
        
        # Generate sitemap XML
        xml_content = self.generate_sitemap_xml(valid_urls)
        
        # Write sitemap atomically
        if self.write_sitemap_atomic(xml_content):
            self.logger.info("✅ Sitemap generation successful!")
            
            # Generate report
            self.generate_report()
            
            # Final summary
            self.logger.info(f"""
🎉 IT-ERA Sitemap v2 Generation Complete!
📊 URLs in sitemap: {len(valid_urls)}
📄 Removed URLs logged: {len(self.removed_urls)}
📁 Files: {self.public_dir}/sitemap.xml
📋 Report: Check {self.log_dir}/sitemap-report-*.md
            """)
            
            return True
        else:
            self.logger.error("❌ Sitemap generation failed!")
            return False

def main():
    """Main execution function"""
    generator = SitemapGenerator()
    success = generator.generate()
    
    if success:
        print("\n🎯 Sitemap generation completed successfully!")
        exit(0)
    else:
        print("\n💥 Sitemap generation failed!")
        exit(1)

if __name__ == "__main__":
    main()