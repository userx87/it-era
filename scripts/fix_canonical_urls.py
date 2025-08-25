#!/usr/bin/env python3
"""
Fix Canonical URLs Script for IT-ERA
Updates all canonical URLs from it-era.pages.dev to it-era.it
"""

import os
import re
import glob
import argparse
from pathlib import Path

def fix_canonical_urls(web_directory, production_domain="it-era.it"):
    """Fix canonical URLs in all HTML files"""
    
    print(f"🔧 Starting canonical URL fix...")
    print(f"📁 Directory: {web_directory}")
    print(f"🌐 Target domain: {production_domain}")
    
    # Patterns to find and replace
    old_pattern = r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']https://it-era\.pages\.dev([^"\']*)["\'][^>]*/?>'
    
    def create_new_canonical(match):
        path = match.group(1)
        
        # Clean up the path
        if path.endswith('.html'):
            # Remove .html extension for clean URLs
            path = path.replace('.html', '')
        
        # Handle pages-generated directory
        if '/pages-generated/' in path:
            path = path.replace('/pages-generated/', '/')
        
        # Handle regular pages directory
        if path.startswith('/pages/'):
            path = path.replace('/pages/', '/')
        
        return f'<link rel="canonical" href="https://{production_domain}{path}"/>'
    
    # Find all HTML files
    html_files = []
    
    # Main pages
    html_files.extend(glob.glob(os.path.join(web_directory, "*.html")))
    
    # Pages directory
    pages_dir = os.path.join(web_directory, "pages")
    if os.path.exists(pages_dir):
        html_files.extend(glob.glob(os.path.join(pages_dir, "*.html")))
    
    # Generated pages directory
    generated_dir = os.path.join(web_directory, "pages-generated")
    if os.path.exists(generated_dir):
        html_files.extend(glob.glob(os.path.join(generated_dir, "*.html")))
    
    print(f"📊 Found {len(html_files)} HTML files to process")
    
    fixed_count = 0
    error_count = 0
    
    for file_path in html_files:
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if file has canonical URL to fix
            if 'it-era.pages.dev' in content and 'rel="canonical"' in content:
                # Fix canonical URLs
                new_content = re.sub(old_pattern, create_new_canonical, content)
                
                # Write back if changed
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    
                    fixed_count += 1
                    
                    # Show progress every 100 files
                    if fixed_count % 100 == 0:
                        print(f"✅ Fixed {fixed_count} files...")
        
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
            error_count += 1
    
    print(f"\n🎉 Canonical URL fix complete!")
    print(f"✅ Fixed: {fixed_count} files")
    print(f"❌ Errors: {error_count} files")
    print(f"📊 Total processed: {len(html_files)} files")
    
    return fixed_count, error_count


def main():
    parser = argparse.ArgumentParser(description='Fix canonical URLs for IT-ERA website')
    parser.add_argument('--domain', default='it-era.it', help='Production domain name')
    parser.add_argument('--path', default='../web/', help='Path to web directory')
    
    args = parser.parse_args()
    
    web_path = os.path.abspath(args.path)
    
    if not os.path.exists(web_path):
        print(f"❌ Directory not found: {web_path}")
        return 1
    
    fixed, errors = fix_canonical_urls(web_path, args.domain)
    
    if errors > 0:
        print(f"⚠️  Completed with {errors} errors")
        return 1
    else:
        print(f"🎯 All canonical URLs fixed successfully!")
        return 0


if __name__ == "__main__":
    exit(main())