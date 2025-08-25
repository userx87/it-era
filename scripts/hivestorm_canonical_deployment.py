#!/usr/bin/env python3
"""
HIVESTORM Canonical URL Deployment for IT-ERA
Complete canonical URL fix across ALL directories: web/pages-draft/, web/pages/, web/
Updates all canonical URLs from it-era.pages.dev to it-era.it
"""

import os
import re
import glob
import argparse
from pathlib import Path
import time

class HIVESTORMCanonicalDeployment:
    def __init__(self, web_directory, production_domain="it-era.it"):
        self.web_directory = web_directory
        self.production_domain = production_domain
        self.fixed_count = 0
        self.error_count = 0
        self.total_files = 0
        self.start_time = time.time()
        
        # Patterns to find and replace
        self.old_patterns = [
            r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']https://it-era\.pages\.dev([^"\']*)["\'][^>]*/??>',
            r'<link[^>]*href=["\']https://it-era\.pages\.dev([^"\']*)["\'][^>]*rel=["\']canonical["\'][^>]*/??>',
        ]
        
    def create_new_canonical(self, match):
        """Create new canonical URL with clean paths"""
        path = match.group(1)
        
        # Clean up the path
        if path.endswith('.html'):
            # Remove .html extension for clean URLs
            path = path.replace('.html', '')
        
        # Handle all directory variations
        path_mappings = [
            ('/pages-generated/', '/'),
            ('/pages-draft/', '/'),
            ('/pages/', '/'),
        ]
        
        for old_path, new_path in path_mappings:
            if old_path in path:
                path = path.replace(old_path, new_path)
                break
        
        # Ensure path starts with /
        if not path.startswith('/'):
            path = '/' + path
            
        # Remove double slashes
        path = re.sub(r'/+', '/', path)
        
        return f'<link rel="canonical" href="https://{self.production_domain}{path}"/>'
    
    def find_all_html_files(self):
        """Find ALL HTML files across all target directories"""
        html_files = []
        
        target_directories = [
            "",  # Root web directory
            "pages",
            "pages-draft",
            "pages-generated"
        ]
        
        for directory in target_directories:
            dir_path = os.path.join(self.web_directory, directory) if directory else self.web_directory
            
            if os.path.exists(dir_path):
                pattern = os.path.join(dir_path, "*.html")
                found_files = glob.glob(pattern)
                html_files.extend(found_files)
                print(f"📁 {directory if directory else 'root'}: {len(found_files)} HTML files")
        
        return html_files
    
    def process_file(self, file_path):
        """Process a single HTML file"""
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if file has canonical URL to fix
            if 'it-era.pages.dev' in content and 'rel="canonical"' in content:
                original_content = content
                
                # Apply all patterns
                for pattern in self.old_patterns:
                    content = re.sub(pattern, self.create_new_canonical, content)
                
                # Write back if changed
                if content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    
                    self.fixed_count += 1
                    
                    # Show progress every 100 files
                    if self.fixed_count % 100 == 0:
                        elapsed = time.time() - self.start_time
                        rate = self.fixed_count / elapsed
                        remaining = (self.total_files - self.fixed_count) / rate if rate > 0 else 0
                        print(f"✅ Fixed {self.fixed_count} files... ({rate:.1f} files/sec, ~{remaining/60:.1f} min remaining)")
                    
                    return True
            
            return False
            
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
            self.error_count += 1
            return False
    
    def run_deployment(self):
        """Execute the complete HIVESTORM canonical deployment"""
        print("🚀 HIVESTORM CANONICAL URL DEPLOYMENT STARTING")
        print("=" * 60)
        print(f"📁 Directory: {self.web_directory}")
        print(f"🌐 Target domain: {self.production_domain}")
        print("📋 Target directories: web/, web/pages/, web/pages-draft/, web/pages-generated/")
        print("=" * 60)
        
        # Find all HTML files
        html_files = self.find_all_html_files()
        self.total_files = len(html_files)
        
        print(f"📊 Found {self.total_files} HTML files to process")
        print("🔧 Processing files...")
        print("-" * 40)
        
        # Process all files
        for file_path in html_files:
            self.process_file(file_path)
        
        # Final summary
        elapsed = time.time() - self.start_time
        print("\n" + "=" * 60)
        print("🎉 HIVESTORM CANONICAL DEPLOYMENT COMPLETE!")
        print("=" * 60)
        print(f"✅ Files Fixed: {self.fixed_count}")
        print(f"❌ Errors: {self.error_count}")
        print(f"📊 Total Processed: {self.total_files}")
        print(f"⏱️  Execution Time: {elapsed:.2f} seconds")
        print(f"⚡ Processing Rate: {self.total_files/elapsed:.1f} files/second")
        print("=" * 60)
        
        return self.fixed_count, self.error_count


def main():
    parser = argparse.ArgumentParser(description='HIVESTORM Canonical URL Deployment for IT-ERA')
    parser.add_argument('--domain', default='it-era.it', help='Production domain name')
    parser.add_argument('--path', default='../web/', help='Path to web directory')
    
    args = parser.parse_args()
    
    web_path = os.path.abspath(args.path)
    
    if not os.path.exists(web_path):
        print(f"❌ Directory not found: {web_path}")
        return 1
    
    # Execute HIVESTORM deployment
    deployment = HIVESTORMCanonicalDeployment(web_path, args.domain)
    fixed, errors = deployment.run_deployment()
    
    if errors > 0:
        print(f"⚠️  Deployment completed with {errors} errors")
        return 1
    else:
        print(f"🎯 HIVESTORM Task #1 - Canonical URLs: COMPLETE!")
        return 0


if __name__ == "__main__":
    exit(main())