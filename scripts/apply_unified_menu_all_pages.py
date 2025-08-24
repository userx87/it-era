#!/usr/bin/env python3
"""
Apply Unified Navigation Menu to ALL Pages
===========================================
This script replaces the navigation menu in all HTML pages with the unified component
from /components/navigation-optimized.html which includes the Blog link.
"""

import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def load_navigation_component():
    """Load the unified navigation component"""
    component_path = Path('components/navigation-optimized.html')
    
    if not component_path.exists():
        logging.error(f"Navigation component not found at {component_path}")
        return None
    
    with open(component_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    logging.info("✅ Loaded unified navigation component")
    return content

def extract_navigation_from_component(component_html):
    """Extract just the nav element and its styles from the component"""
    soup = BeautifulSoup(component_html, 'html.parser')
    
    # Get the nav element
    nav = soup.find('nav')
    
    # Get the style element
    style = soup.find('style')
    
    if not nav:
        logging.error("No nav element found in component")
        return None, None
    
    return str(nav), str(style) if style else ""

def update_page_navigation(file_path, nav_html, nav_style):
    """Update a single page's navigation"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Find existing nav element
        existing_nav = soup.find('nav', class_='navbar')
        
        if not existing_nav:
            logging.warning(f"No navbar found in {file_path}")
            return False
        
        # Replace the existing nav with the new one
        new_nav = BeautifulSoup(nav_html, 'html.parser').nav
        existing_nav.replace_with(new_nav)
        
        # Check if nav styles already exist, if not add them
        existing_nav_style = soup.find('style', id='nav-optimized-styles')
        if not existing_nav_style and nav_style:
            # Add style tag to head
            style_tag = BeautifulSoup(nav_style, 'html.parser').style
            style_tag['id'] = 'nav-optimized-styles'
            
            if soup.head:
                soup.head.append(style_tag)
            else:
                # If no head, add before nav
                new_nav.insert_before(style_tag)
        
        # Save the updated content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        
        return True
        
    except Exception as e:
        logging.error(f"Error updating {file_path}: {str(e)}")
        return False

def process_all_pages():
    """Process all HTML pages in the web directory"""
    
    # Load the unified navigation component
    component_html = load_navigation_component()
    if not component_html:
        return
    
    nav_html, nav_style = extract_navigation_from_component(component_html)
    if not nav_html:
        return
    
    # Directories to process
    directories = [
        'web',              # Homepage
        'web/pages',        # Service pages
        'web/pages-draft',  # Draft pages
        'web/blog'          # Blog pages
    ]
    
    total_updated = 0
    total_failed = 0
    
    for directory in directories:
        dir_path = Path(directory)
        if not dir_path.exists():
            logging.warning(f"Directory {directory} does not exist")
            continue
        
        # Find all HTML files
        html_files = list(dir_path.glob('*.html'))
        
        if directory == 'web':
            # Only process index.html in root
            html_files = [f for f in html_files if f.name == 'index.html']
        
        logging.info(f"\n📁 Processing {len(html_files)} files in {directory}")
        
        for file_path in html_files:
            # Skip certain files
            if file_path.name in ['navigation-optimized.html', 'footer.html']:
                continue
            
            logging.info(f"  Updating: {file_path.name}")
            
            if update_page_navigation(file_path, nav_html, nav_style):
                total_updated += 1
            else:
                total_failed += 1
    
    # Summary
    print("\n" + "="*60)
    print("UNIFIED NAVIGATION UPDATE SUMMARY")
    print("="*60)
    print(f"✅ Successfully updated: {total_updated} pages")
    print(f"❌ Failed to update: {total_failed} pages")
    print(f"📝 Blog link now available on all pages")
    print("\nKey updates:")
    print("  • Homepage (index.html)")
    print("  • All service pages in /pages")
    print("  • All draft pages in /pages-draft")
    print("  • Blog pages in /blog")
    print("\n🎯 Next step: Deploy to Cloudflare Pages")

def main():
    """Main execution"""
    print("🚀 Starting Unified Navigation Update")
    print("="*60)
    
    # Create backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backup/nav_update_{timestamp}"
    
    process_all_pages()
    
    print("\n✅ Navigation update complete!")
    print("All pages now have the unified menu with Blog link")

if __name__ == "__main__":
    main()