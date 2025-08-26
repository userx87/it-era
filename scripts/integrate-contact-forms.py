#!/usr/bin/env python3
"""
IT-ERA Contact Form Integration Script
Integrates contact forms into all existing pages
"""

import os
import glob
import re
from pathlib import Path

def integrate_contact_forms():
    """Integrate contact forms into all HTML pages"""
    
    # Paths
    base_path = Path(__file__).parent.parent
    pages_path = base_path / "web" / "pages"
    pages_draft_path = base_path / "web" / "pages-draft"
    
    # Contact integration script tag
    integration_script = """
<!-- IT-ERA Contact System Integration -->
<script src="/api/contact-system/components/contact-integration.js"></script>
"""
    
    processed_count = 0
    
    # Process production pages
    if pages_path.exists():
        for html_file in glob.glob(str(pages_path / "*.html")):
            if integrate_to_file(html_file, integration_script):
                processed_count += 1
                
    # Process draft pages
    if pages_draft_path.exists():
        for html_file in glob.glob(str(pages_draft_path / "*.html")):
            if integrate_to_file(html_file, integration_script):
                processed_count += 1
                
    print(f"✅ Contact forms integrated into {processed_count} pages")
    return processed_count

def integrate_to_file(file_path, integration_script):
    """Integrate contact form into a single HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Skip if already has contact integration
        if 'contact-integration.js' in content:
            return False
            
        # Insert before closing body tag
        if '</body>' in content:
            content = content.replace('</body>', f'{integration_script}\n</body>')
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
            return True
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        
    return False

if __name__ == "__main__":
    integrate_contact_forms()