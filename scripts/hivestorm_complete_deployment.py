#!/usr/bin/env python3
"""
HIVESTORM COMPLETE URL DEPLOYMENT for IT-ERA
Fixes ALL it-era.pages.dev references across the entire project:
- Canonical URLs
- Open Graph URLs  
- Twitter Card URLs
- All other page.dev references
"""

import os
import re
import glob
import argparse
from pathlib import Path
import time

class HIVESTORMCompleteDeployment:
    def __init__(self, root_directory, production_domain="it-era.it"):
        self.root_directory = root_directory
        self.production_domain = production_domain
        self.fixed_count = 0
        self.error_count = 0
        self.total_files = 0
        self.start_time = time.time()
        
        # Comprehensive patterns to find and replace ALL pages.dev references
        self.url_patterns = [
            # Canonical URLs
            (r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']https://it-era\.pages\.dev([^"\']*)["\'][^>]*/?>', 
             lambda m: f'<link rel="canonical" href="https://{self.production_domain}{self.clean_path(m.group(1))}"/>'),
            
            # Open Graph URLs
            (r'<meta[^>]*property=["\']og:url["\'][^>]*content=["\']https://it-era\.pages\.dev([^"\']*)["\'][^>]*/?>', 
             lambda m: f'<meta property="og:url" content="https://{self.production_domain}{self.clean_path(m.group(1))}"/>'),
            
            # Open Graph Images  
            (r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']https://it-era\.pages\.dev([^"\']*)["\'][^>]*/?>', 
             lambda m: f'<meta property="og:image" content="https://{self.production_domain}{m.group(1)}"/>'),
            
            # Twitter Card URLs
            (r'<meta[^>]*name=["\']twitter:image["\'][^>]*content=["\']https://it-era\.pages\.dev([^"\']*)["\'][^>]*/?>', 
             lambda m: f'<meta name="twitter:image" content="https://{self.production_domain}{m.group(1)}"/>'),
            
            # Generic href attributes
            (r'href=["\']https://it-era\.pages\.dev([^"\']*)["\']', 
             lambda m: f'href="https://{self.production_domain}{self.clean_path(m.group(1))}"'),
            
            # Generic src attributes
            (r'src=["\']https://it-era\.pages\.dev([^"\']*)["\']', 
             lambda m: f'src="https://{self.production_domain}{m.group(1)}"'),
            
            # Generic content attributes
            (r'content=["\']https://it-era\.pages\.dev([^"\']*)["\']', 
             lambda m: f'content="https://{self.production_domain}{self.clean_path(m.group(1))}"'),
        ]
        
    def clean_path(self, path):
        """Clean and normalize URL paths"""
        # Remove .html extension for clean URLs (except for images and assets)
        if path.endswith('.html'):
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
        
        return path
    
    def find_all_html_files(self):
        """Find ALL HTML files across the entire project"""
        html_files = []
        
        # Search all directories recursively
        for root, dirs, files in os.walk(self.root_directory):
            # Skip backup directories
            if 'backup' in root:
                continue
                
            for file in files:
                if file.endswith('.html'):
                    html_files.append(os.path.join(root, file))
        
        # Group by directory for reporting
        dir_counts = {}
        for file_path in html_files:
            rel_path = os.path.relpath(file_path, self.root_directory)
            dir_name = os.path.dirname(rel_path)
            if not dir_name:
                dir_name = "root"
            dir_counts[dir_name] = dir_counts.get(dir_name, 0) + 1
        
        print("📁 Directory breakdown:")
        for dir_name, count in sorted(dir_counts.items()):
            print(f"   {dir_name}: {count} files")
        
        return html_files
    
    def process_file(self, file_path):
        """Process a single HTML file for ALL pages.dev references"""
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if file has pages.dev references
            if 'it-era.pages.dev' in content:
                original_content = content
                changes_made = 0
                
                # Apply all URL patterns
                for pattern, replacement_func in self.url_patterns:
                    new_content = re.sub(pattern, replacement_func, content)
                    if new_content != content:
                        changes_made += 1
                        content = new_content
                
                # Write back if changed
                if content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    
                    self.fixed_count += 1
                    
                    # Show progress every 100 files
                    if self.fixed_count % 100 == 0:
                        elapsed = time.time() - self.start_time
                        rate = self.fixed_count / elapsed if elapsed > 0 else 0
                        remaining_files = len([f for f in self.get_remaining_files() if 'it-era.pages.dev' in open(f, 'r', encoding='utf-8').read()]) if self.fixed_count % 500 == 0 else 0
                        print(f"✅ Fixed {self.fixed_count} files... ({rate:.1f} files/sec)")
                    
                    return True
            
            return False
            
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
            self.error_count += 1
            return False
    
    def get_remaining_files(self):
        """Get list of files that still need processing"""
        html_files = []
        for root, dirs, files in os.walk(self.root_directory):
            if 'backup' in root:
                continue
            for file in files:
                if file.endswith('.html'):
                    html_files.append(os.path.join(root, file))
        return html_files
    
    def run_deployment(self):
        """Execute the complete HIVESTORM deployment"""
        print("🚀 HIVESTORM COMPLETE URL DEPLOYMENT STARTING")
        print("=" * 70)
        print(f"📁 Root directory: {self.root_directory}")
        print(f"🌐 Target domain: {self.production_domain}")
        print("🎯 Fixing ALL pages.dev references:")
        print("   • Canonical URLs")
        print("   • Open Graph URLs") 
        print("   • Twitter Card URLs")
        print("   • All href/src/content attributes")
        print("=" * 70)
        
        # Find all HTML files
        html_files = self.find_all_html_files()
        self.total_files = len(html_files)
        
        print(f"📊 Found {self.total_files} HTML files to process")
        print("🔧 Processing files...")
        print("-" * 50)
        
        # Process all files
        for file_path in html_files:
            self.process_file(file_path)
        
        # Final verification
        print("\n🔍 Final verification...")
        remaining_refs = 0
        try:
            result = os.popen(f'grep -r "it-era.pages.dev" {self.root_directory} --include="*.html" --exclude-dir=backup | wc -l').read().strip()
            remaining_refs = int(result)
        except:
            pass
        
        # Final summary
        elapsed = time.time() - self.start_time
        print("\n" + "=" * 70)
        print("🎉 HIVESTORM COMPLETE DEPLOYMENT FINISHED!")
        print("=" * 70)
        print(f"✅ Files Processed: {self.fixed_count}")
        print(f"❌ Errors: {self.error_count}")
        print(f"📊 Total Files: {self.total_files}")
        print(f"🔍 Remaining pages.dev refs: {remaining_refs}")
        print(f"⏱️  Execution Time: {elapsed:.2f} seconds")
        print(f"⚡ Processing Rate: {self.total_files/elapsed:.1f} files/second")
        
        if remaining_refs == 0:
            print("🎯 HIVESTORM Task #1 - URL Deployment: ✅ COMPLETE!")
        else:
            print(f"⚠️  {remaining_refs} references still need manual review")
        
        print("=" * 70)
        
        return self.fixed_count, self.error_count, remaining_refs


def main():
    parser = argparse.ArgumentParser(description='HIVESTORM Complete URL Deployment for IT-ERA')
    parser.add_argument('--domain', default='it-era.it', help='Production domain name')
    parser.add_argument('--path', default='.', help='Path to project root directory')
    
    args = parser.parse_args()
    
    root_path = os.path.abspath(args.path)
    
    if not os.path.exists(root_path):
        print(f"❌ Directory not found: {root_path}")
        return 1
    
    # Execute HIVESTORM complete deployment
    deployment = HIVESTORMCompleteDeployment(root_path, args.domain)
    fixed, errors, remaining = deployment.run_deployment()
    
    if errors > 0:
        print(f"⚠️  Deployment completed with {errors} errors")
        return 1
    elif remaining > 0:
        print(f"⚠️  Deployment completed but {remaining} references need review")
        return 1
    else:
        print(f"🎯 HIVESTORM Complete Deployment: SUCCESS!")
        return 0


if __name__ == "__main__":
    exit(main())