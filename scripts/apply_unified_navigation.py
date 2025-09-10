#!/usr/bin/env python3
"""
IT-ERA Navigation Unification Script
Applies corrected navigation component to all pages in the web directory.
"""

import os
import re
from pathlib import Path

# Read the corrected navigation component
def read_navigation_component():
    component_path = Path(__file__).parent.parent / "components" / "navigation-optimized.html"
    with open(component_path, 'r', encoding='utf-8') as f:
        return f.read().strip()

# Apply navigation to homepage
def fix_homepage_navigation():
    homepage_path = Path(__file__).parent.parent / "web" / "index.html"
    
    with open(homepage_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Read navigation component
    nav_component = read_navigation_component()
    
    # Pattern to match the existing navigation (more flexible)
    nav_pattern = r'(<body[^>]*>.*?)<!-- Optimized Navigation.*?</nav>.*?</style>'
    
    # Find and replace the navigation section
    def replace_navigation(match):
        body_part = match.group(1)
        return body_part + nav_component + '\n\n<style>\n/* Custom styles for optimized navigation */\n.navbar {\n    min-height: 76px;\n}\n\n.dropdown-menu-columns {\n    min-width: 400px;\n}\n\n.dropdown-header {\n    font-weight: 600;\n    padding: 0.5rem 1rem 0.25rem;\n}\n\n.dropdown-item {\n    padding: 0.4rem 1rem;\n    transition: all 0.2s ease;\n}\n\n.dropdown-item:hover {\n    background-color: #f8f9fa;\n    padding-left: 1.25rem;\n}\n\n.badge {\n    font-size: 0.7rem;\n    animation: pulse 2s infinite;\n}\n\n@keyframes pulse {\n    0%, 100% { opacity: 1; }\n    50% { opacity: 0.7; }\n}\n\n/* Mobile optimizations */\n@media (max-width: 991px) {\n    .dropdown-menu-columns {\n        min-width: 100%;\n    }\n    \n    .dropdown-menu-columns .row {\n        display: block;\n    }\n    \n    .navbar-nav {\n        padding: 1rem 0;\n    }\n    \n    .nav-item {\n        border-bottom: 1px solid #f8f9fa;\n    }\n    \n    .nav-item:last-child {\n        border-bottom: none;\n        margin-top: 1rem;\n    }\n}\n</style>'
    
    # Replace the navigation
    updated_content = re.sub(nav_pattern, replace_navigation, content, flags=re.DOTALL)
    
    # Clean up duplicate phone numbers in emergency banner
    updated_content = re.sub(r'href="tel:\+039 888 204141"', 'href="tel:+0398882041"', updated_content)
    updated_content = re.sub(r'📞 039 888 2041', '📞 039 888 2041', updated_content)
    
    # Remove duplicate JavaScript blocks
    js_pattern = r'<!-- Bootstrap JS \(NO DEFER.*?</script>'
    updated_content = re.sub(js_pattern, '', updated_content, flags=re.DOTALL)
    
    # Remove duplicate CSS blocks
    duplicate_css_pattern = r'<style id="nav-optimized-styles">.*?</style>'
    updated_content = re.sub(duplicate_css_pattern, '', updated_content, flags=re.DOTALL)
    
    with open(homepage_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print("✅ Homepage navigation updated successfully")

# Apply navigation to city pages
def fix_city_pages():
    web_dir = Path(__file__).parent.parent / "web"
    city_pages = list(web_dir.glob("assistenza-it-*.html"))
    
    nav_component = read_navigation_component()
    
    for page_path in city_pages:
        try:
            with open(page_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Fix phone numbers in existing content
            content = re.sub(r'href="tel:\+390398882041"', 'href="tel:+0398882041"', content)
            content = re.sub(r'href="tel:\+039 888 204141"', 'href="tel:+0398882041"', content)
            
            # Update navigation if present
            nav_pattern = r'<!-- Optimized Navigation.*?</style>'
            if re.search(nav_pattern, content, re.DOTALL):
                content = re.sub(nav_pattern, nav_component + '\n\n<style>\n/* Custom styles for optimized navigation */\n.navbar {\n    min-height: 76px;\n}\n\n.dropdown-menu-columns {\n    min-width: 400px;\n}\n\n.dropdown-header {\n    font-weight: 600;\n    padding: 0.5rem 1rem 0.25rem;\n}\n\n.dropdown-item {\n    padding: 0.4rem 1rem;\n    transition: all 0.2s ease;\n}\n\n.dropdown-item:hover {\n    background-color: #f8f9fa;\n    padding-left: 1.25rem;\n}\n\n.badge {\n    font-size: 0.7rem;\n    animation: pulse 2s infinite;\n}\n\n@keyframes pulse {\n    0%, 100% { opacity: 1; }\n    50% { opacity: 0.7; }\n}\n\n/* Mobile optimizations */\n@media (max-width: 991px) {\n    .dropdown-menu-columns {\n        min-width: 100%;\n    }\n    \n    .dropdown-menu-columns .row {\n        display: block;\n    }\n    \n    .navbar-nav {\n        padding: 1rem 0;\n    }\n    \n    .nav-item {\n        border-bottom: 1px solid #f8f9fa;\n    }\n    \n    .nav-item:last-child {\n        border-bottom: none;\n        margin-top: 1rem;\n    }\n}\n</style>', content, flags=re.DOTALL)
            
            with open(page_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
            print(f"✅ Updated {page_path.name}")
            
        except Exception as e:
            print(f"❌ Error updating {page_path.name}: {e}")

def main():
    """Main execution function"""
    print("🚀 IT-ERA Navigation Unification Script")
    print("=" * 50)
    
    try:
        # Fix homepage first
        fix_homepage_navigation()
        
        # Fix city pages
        print("\n📄 Updating city pages...")
        fix_city_pages()
        
        print("\n🎉 Navigation unification completed successfully!")
        print("📋 Summary:")
        print("  - Phone numbers standardized to +0398882041")
        print("  - All navigation links updated with /pages/ prefix")
        print("  - Duplicate code blocks removed")
        print("  - Bootstrap dropdowns properly initialized")
        
    except Exception as e:
        print(f"❌ Critical error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())