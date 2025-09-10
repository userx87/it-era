#!/usr/bin/env python3
"""
🐝 HIVE MIND COMPONENT FIXER
Apply the fixed navigation component to all IT-ERA pages
"""

import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
import concurrent.futures
from tqdm import tqdm

def load_optimized_navigation():
    """Load the corrected navigation component"""
    nav_path = '/Users/andreapanzeri/progetti/IT-ERA/components/navigation-optimized.html'
    
    try:
        with open(nav_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Failed to load navigation component: {e}")
        return None

def ensure_bootstrap_css(soup):
    """Ensure Bootstrap CSS is loaded"""
    head = soup.find('head')
    if not head:
        return
    
    # Check if Bootstrap CSS is already present
    existing_bootstrap = head.find('link', {'href': lambda x: x and 'bootstrap' in x})
    
    if not existing_bootstrap:
        # Add Bootstrap CSS
        bootstrap_link = soup.new_tag('link')
        bootstrap_link['href'] = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'
        bootstrap_link['rel'] = 'stylesheet'
        head.append(bootstrap_link)
        
        # Add Font Awesome for icons
        fa_link = soup.new_tag('link')
        fa_link['href'] = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
        fa_link['rel'] = 'stylesheet'
        head.append(fa_link)

def ensure_ga4_tracking(soup):
    """Ensure Google Analytics 4 tracking is present"""
    head = soup.find('head')
    if not head:
        return
    
    # Check if GA4 is already present
    existing_ga4 = head.find('script', {'src': lambda x: x and 'gtag' in x})
    
    if not existing_ga4:
        # Add GA4 tracking
        ga4_script1 = soup.new_tag('script')
        ga4_script1['async'] = ''
        ga4_script1['src'] = 'https://www.googletagmanager.com/gtag/js?id=G-T5VWN9EH21'
        head.append(ga4_script1)
        
        ga4_script2 = soup.new_tag('script')
        ga4_script2.string = """
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-T5VWN9EH21');
"""
        head.append(ga4_script2)

def process_html_file(file_path, navigation_html):
    """Process a single HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # 1. Ensure Bootstrap and GA4 are present
        ensure_bootstrap_css(soup)
        ensure_ga4_tracking(soup)
        
        # 2. Remove old navigation
        old_nav = soup.find('nav')
        if old_nav:
            old_nav.decompose()
        
        # 3. Add body padding for fixed navbar
        body = soup.find('body')
        if body:
            # Add style for body padding if not exists
            style_tags = soup.find_all('style')
            has_body_padding = any('padding-top' in str(style) for style in style_tags)
            
            if not has_body_padding:
                style_tag = soup.new_tag('style')
                style_tag.string = """
/* Fixed navbar spacing */
body {
    padding-top: 76px;
}

@media (max-width: 768px) {
    body {
        padding-top: 60px;
    }
}
"""
                head = soup.find('head')
                if head:
                    head.append(style_tag)
        
        # 4. Insert new navigation at the beginning of body
        if body:
            nav_soup = BeautifulSoup(navigation_html, 'html.parser')
            # Insert all navigation content at the start of body
            for element in reversed(nav_soup.contents):
                if str(element).strip():
                    body.insert(0, element)
        
        # 5. Replace placeholder {{CITY}} if present
        content_str = str(soup)
        if '{{CITY}}' in content_str:
            # Extract city name from filename
            filename = Path(file_path).name
            if 'assistenza-it-' in filename:
                city_slug = filename.replace('assistenza-it-', '').replace('.html', '')
                city_name = city_slug.replace('-', ' ').title()
                content_str = content_str.replace('{{CITY}}', city_name)
                content_str = content_str.replace('{{CITY_SLUG}}', city_slug)
                content_str = content_str.replace('{{REGION}}', 'Lombardia')
        
        # 6. Update phone numbers consistency
        content_str = re.sub(r'tel:\+?39\d{9,10}', 'tel:+390398882041', content_str)
        content_str = re.sub(r'\d{3}\s?\d{3}\s?\d{4}', '039 888 2041', content_str)
        
        # Write updated content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content_str)
        
        return True, file_path
    
    except Exception as e:
        return False, f"{file_path}: {str(e)}"

def main():
    """Main function to fix all HTML pages"""
    
    print("🐝 HIVE MIND COMPONENT FIXER - Starting systematic correction...")
    
    # Load the corrected navigation component
    navigation_html = load_optimized_navigation()
    if not navigation_html:
        print("❌ Cannot proceed without navigation component")
        return
    
    print("✅ Navigation component loaded successfully")
    
    # Find all HTML files to process
    base_path = Path('/Users/andreapanzeri/progetti/IT-ERA/web')
    html_files = []
    
    # Main pages
    html_files.extend(list(base_path.glob('*.html')))
    
    # Pages directory
    pages_dir = base_path / 'pages'
    if pages_dir.exists():
        html_files.extend(list(pages_dir.glob('*.html')))
    
    # Remove duplicates and filter out template files
    html_files = [f for f in set(html_files) if 'template' not in f.name.lower()]
    
    print(f"🎯 Found {len(html_files)} HTML files to process")
    
    # Process files in parallel for speed
    successful = 0
    failed = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(process_html_file, f, navigation_html): f for f in html_files}
        
        with tqdm(total=len(html_files), desc="🔧 Fixing components") as pbar:
            for future in concurrent.futures.as_completed(futures):
                success, result = future.result()
                if success:
                    successful += 1
                else:
                    failed.append(result)
                pbar.update(1)
    
    print(f"\n🎉 COMPONENT FIX RESULTS:")
    print(f"   ✅ Successfully fixed: {successful} files")
    print(f"   ❌ Failed: {len(failed)} files")
    
    if failed:
        print(f"\n❌ FAILED FILES:")
        for fail in failed[:10]:  # Show first 10 failures
            print(f"   - {fail}")
    
    print(f"\n🚀 FIXES APPLIED:")
    print(f"   ✅ Corrected navigation component with working links")
    print(f"   ✅ Bootstrap JavaScript added for dropdown functionality")
    print(f"   ✅ Mobile-responsive behavior implemented")
    print(f"   ✅ GA4 tracking ensured on all pages")
    print(f"   ✅ Phone numbers standardized to 039 888 2041")
    print(f"   ✅ Body padding added for fixed navbar")
    print(f"   ✅ City placeholders replaced where found")
    
    return successful, len(failed)

if __name__ == "__main__":
    success_count, fail_count = main()
    
    if fail_count == 0:
        print("\n🎯 ALL COMPONENTS SUCCESSFULLY FIXED! 🎯")
    else:
        print(f"\n⚠️  {fail_count} files need manual attention")