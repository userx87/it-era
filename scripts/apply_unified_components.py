#!/usr/bin/env python3
"""
Apply unified header, menu, footer and fixes to all IT-ERA pages
"""

import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
import concurrent.futures
from tqdm import tqdm

# Unified navigation HTML
UNIFIED_NAV = """
    <!-- Skip navigation link for accessibility -->
    <a href="#main-content" class="skip-link">Vai al contenuto principale</a>
    
    <!-- Unified Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-light fixed-top" role="navigation" aria-label="Menu principale">
        <div class="container">
            <a class="navbar-brand" href="/">
                <i class="fas fa-cogs me-2"></i>
                <strong>IT-ERA</strong>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Apri menu di navigazione">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav mx-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/">Home</a>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="servicesDropdown" role="button" 
                           data-bs-toggle="dropdown" aria-expanded="false">
                            Servizi
                        </a>
                        <ul class="dropdown-menu" aria-labelledby="servicesDropdown">
                            <li><a class="dropdown-item" href="#assistenza-it">Assistenza IT</a></li>
                            <li><a class="dropdown-item" href="#cloud-storage">Cloud Storage</a></li>
                            <li><a class="dropdown-item" href="#sicurezza">Sicurezza Informatica</a></li>
                            <li><a class="dropdown-item" href="#backup">Backup & Disaster Recovery</a></li>
                            <li><a class="dropdown-item" href="#voip">VoIP & Telefonia</a></li>
                            <li><a class="dropdown-item" href="#firewall">Firewall WatchGuard</a></li>
                        </ul>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#chi-siamo">Chi Siamo</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#contatti">Contatti</a>
                    </li>
                </ul>
                <div class="d-flex align-items-center">
                    <a href="tel:+390398882041" class="btn btn-primary">
                        <i class="fas fa-phone me-2"></i>039 888 2041
                    </a>
                </div>
            </div>
        </div>
    </nav>
"""

# Unified footer HTML
UNIFIED_FOOTER = """
    <!-- Unified Footer -->
    <footer class="bg-dark text-white py-5 mt-5">
        <div class="container">
            <div class="row">
                <div class="col-md-4 mb-4">
                    <h5><i class="fas fa-cogs me-2"></i>IT-ERA</h5>
                    <p>Il tuo partner tecnologico di fiducia per soluzioni IT innovative e affidabili.</p>
                    <div class="contact-info">
                        <p><i class="fas fa-map-marker-alt me-2"></i>Viale Risorgimento 32, Vimercate MB</p>
                        <p><i class="fas fa-phone me-2"></i>039 888 2041</p>
                        <p><i class="fas fa-envelope me-2"></i>info@it-era.it</p>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <h5>Servizi</h5>
                    <ul class="list-unstyled">
                        <li><a href="#assistenza-it" class="text-white-50">Assistenza IT</a></li>
                        <li><a href="#cloud-storage" class="text-white-50">Cloud Storage</a></li>
                        <li><a href="#sicurezza" class="text-white-50">Sicurezza Informatica</a></li>
                        <li><a href="#backup" class="text-white-50">Backup & DR</a></li>
                        <li><a href="#voip" class="text-white-50">VoIP & Telefonia</a></li>
                        <li><a href="#firewall" class="text-white-50">Firewall Solutions</a></li>
                    </ul>
                </div>
                <div class="col-md-4 mb-4">
                    <h5>Seguici</h5>
                    <div class="social-links mb-3">
                        <a href="#" class="text-white-50 me-3"><i class="fab fa-linkedin fa-lg"></i></a>
                        <a href="#" class="text-white-50 me-3"><i class="fab fa-facebook fa-lg"></i></a>
                        <a href="#" class="text-white-50 me-3"><i class="fab fa-twitter fa-lg"></i></a>
                    </div>
                    <p class="text-white-50 small">
                        © 2024 IT-ERA. Tutti i diritti riservati.<br>
                        <a href="/privacy" class="text-white-50">Privacy Policy</a> | 
                        <a href="/cookie" class="text-white-50">Cookie Policy</a>
                    </p>
                </div>
            </div>
        </div>
    </footer>
"""

# CSS fixes for menu overlap
MENU_FIX_CSS = """
        /* Menu overlap fix */
        body {
            padding-top: 76px; /* Compensate for fixed navbar */
        }
        
        .navbar {
            background-color: white !important;
            box-shadow: 0 2px 4px rgba(0,0,0,.1);
            z-index: 1030;
        }
        
        @media (max-width: 768px) {
            body {
                padding-top: 60px; /* Smaller padding on mobile */
            }
        }
        
        /* Skip navigation link */
        .skip-link {
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 9999;
            border-radius: 4px;
            font-weight: bold;
        }
        
        .skip-link:focus {
            top: 6px;
            outline: 2px solid #007bff;
            outline-offset: 2px;
        }
        
        /* Enhanced focus indicators for accessibility */
        button:focus, .btn:focus, a:focus, input:focus, textarea:focus, select:focus {
            outline: 2px solid #007bff !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25) !important;
        }
"""

def process_html_file(file_path):
    """Process a single HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # 1. Remove old navigation
        old_nav = soup.find('nav')
        if old_nav:
            old_nav.decompose()
        
        # 2. Remove old footer
        old_footer = soup.find('footer')
        if old_footer:
            old_footer.decompose()
        
        # 3. Add/update CSS in head
        style_tag = soup.find('style')
        if not style_tag:
            style_tag = soup.new_tag('style')
            if soup.head:
                soup.head.append(style_tag)
        
        # Check if menu fix CSS already exists
        if style_tag and 'padding-top: 76px' not in str(style_tag):
            style_tag.string = (style_tag.string or '') + MENU_FIX_CSS
        
        # 4. Insert new navigation after body tag
        body = soup.find('body')
        if body:
            # Parse and insert new nav at beginning of body
            nav_soup = BeautifulSoup(UNIFIED_NAV, 'html.parser')
            for element in reversed(nav_soup.contents):
                if str(element).strip():
                    body.insert(0, element)
            
            # Add main wrapper if not exists
            main_tag = soup.find('main', id='main-content')
            if not main_tag:
                # Find first section or div after nav
                first_content = body.find(['section', 'div'], class_=True)
                if first_content:
                    # Wrap existing content in main tag
                    main_tag = soup.new_tag('main', id='main-content')
                    # Move all content except nav and footer into main
                    nav_element = body.find('nav')
                    next_sibling = nav_element.next_sibling if nav_element else body.contents[0]
                    elements_to_wrap = []
                    while next_sibling:
                        if next_sibling.name != 'footer' and next_sibling.name != 'script':
                            elements_to_wrap.append(next_sibling)
                        next_sibling = next_sibling.next_sibling
                    
                    if nav_element:
                        nav_element.insert_after(main_tag)
                    else:
                        body.insert(0, main_tag)
                    
                    for element in elements_to_wrap:
                        if hasattr(element, 'extract'):
                            element.extract()
                            main_tag.append(element)
            
            # 5. Add footer before closing body tag
            footer_soup = BeautifulSoup(UNIFIED_FOOTER, 'html.parser')
            body.append(footer_soup)
        
        # 6. Update phone numbers
        content = str(soup)
        # Replace old numbers with new one
        old_numbers = [
            '031 2289170', '031-2289170', '+390312289170', '+39 031 2289170',
            '800-CLOUD-IT', '800 123 456', '039 888 2041'  # Keep our correct number
        ]
        
        for old_num in old_numbers:
            if old_num != '039 888 2041':  # Don't replace if it's already correct
                content = content.replace(old_num, '039 888 2041')
        
        # Update tel: links
        content = re.sub(r'tel:\+?39\d{9,10}', 'tel:+390398882041', content)
        
        # 7. Update address
        old_addresses = [
            'Via Garibaldi 7, 22073 Fino Mornasco (CO)',
            'Via Garibaldi 7, Fino Mornasco',
            'Via Example 123'
        ]
        
        new_address = 'Viale Risorgimento 32, Vimercate MB'
        for old_addr in old_addresses:
            content = content.replace(old_addr, new_address)
        
        # Write updated content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True, file_path
    
    except Exception as e:
        return False, f"{file_path}: {str(e)}"

def main():
    """Main function to process all HTML files"""
    
    # Find all HTML files
    pages_dir = Path('/Users/andreapanzeri/progetti/IT-ERA/web/pages')
    draft_dir = Path('/Users/andreapanzeri/progetti/IT-ERA/web/pages-draft')
    
    html_files = []
    if pages_dir.exists():
        html_files.extend(list(pages_dir.glob('*.html')))
    if draft_dir.exists():
        html_files.extend(list(draft_dir.glob('*.html')))
    
    print(f"🚀 Found {len(html_files)} HTML files to process")
    
    # Process files in parallel for speed
    successful = 0
    failed = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_html_file, f): f for f in html_files}
        
        with tqdm(total=len(html_files), desc="Processing files") as pbar:
            for future in concurrent.futures.as_completed(futures):
                success, result = future.result()
                if success:
                    successful += 1
                else:
                    failed.append(result)
                pbar.update(1)
    
    print(f"\n✅ Successfully processed: {successful} files")
    if failed:
        print(f"❌ Failed: {len(failed)} files")
        for fail in failed[:10]:  # Show first 10 failures
            print(f"   - {fail}")
    
    print("\n🎯 Summary:")
    print(f"   - Unified navigation applied")
    print(f"   - Unified footer applied")
    print(f"   - Menu overlap fix applied")
    print(f"   - Phone updated to: 039 888 2041")
    print(f"   - Address updated to: Viale Risorgimento 32, Vimercate MB")

if __name__ == "__main__":
    main()