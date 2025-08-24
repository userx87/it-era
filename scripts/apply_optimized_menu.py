#!/usr/bin/env python3
"""
Apply optimized conversion-focused navigation to all IT-ERA pages
"""

import os
from pathlib import Path
from bs4 import BeautifulSoup
import concurrent.futures
from datetime import datetime

# Optimized navigation HTML
OPTIMIZED_NAV = '''<!-- Optimized Navigation with Conversion Focus -->
<nav class="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm">
    <div class="container">
        <a class="navbar-brand fw-bold" href="/">
            <span style="color: #0056cc;">IT</span>-ERA
        </a>
        
        <!-- Emergency CTA for Mobile -->
        <div class="d-lg-none ms-auto me-2">
            <a href="tel:+390398882041" class="btn btn-danger btn-sm">
                🚨 Emergenza
            </a>
        </div>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto align-items-lg-center">
                <!-- Emergency Support - Primary CTA -->
                <li class="nav-item d-none d-lg-block">
                    <a class="nav-link text-danger fw-bold" href="tel:+390398882041">
                        🚨 Supporto Urgente
                    </a>
                </li>
                
                <!-- Services Dropdown with Icons -->
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        Servizi
                    </a>
                    <ul class="dropdown-menu">
                        <li class="dropdown-header text-muted small">ASSISTENZA IMMEDIATA</li>
                        <li><a class="dropdown-item" href="/pages/assistenza-it-milano.html">
                            🔧 Assistenza IT <span class="badge bg-danger ms-2">15min</span>
                        </a></li>
                        <li><a class="dropdown-item" href="/pages/sicurezza-informatica-milano.html">
                            🛡️ Sicurezza Informatica
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li class="dropdown-header text-muted small">SOLUZIONI CLOUD</li>
                        <li><a class="dropdown-item" href="/pages/cloud-storage-milano.html">
                            ☁️ Cloud Storage
                        </a></li>
                        <li><a class="dropdown-item" href="#backup">
                            💾 Backup Automatico
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li class="dropdown-header text-muted small">PACCHETTI SPECIALI</li>
                        <li><a class="dropdown-item" href="#all-inclusive">
                            ⭐ All-Inclusive PMI <span class="badge bg-success ms-2">-30%</span>
                        </a></li>
                    </ul>
                </li>
                
                <!-- Industry Sectors Dropdown -->
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        Settori
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#pmi">
                            🏢 PMI e Startup
                        </a></li>
                        <li><a class="dropdown-item" href="#studi">
                            ⚕️ Studi Medici
                        </a></li>
                        <li><a class="dropdown-item" href="#commercialisti">
                            📊 Commercialisti
                        </a></li>
                        <li><a class="dropdown-item" href="#avvocati">
                            ⚖️ Studi Legali
                        </a></li>
                        <li><a class="dropdown-item" href="#industria">
                            🏭 Industria 4.0
                        </a></li>
                        <li><a class="dropdown-item" href="#retail">
                            🛍️ Retail e GDO
                        </a></li>
                    </ul>
                </li>
                
                <!-- Coverage Areas -->
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        Zone Coperte
                    </a>
                    <ul class="dropdown-menu dropdown-menu-columns">
                        <div class="row g-0">
                            <div class="col-6">
                                <li class="dropdown-header text-muted small">MILANO E BRIANZA</li>
                                <li><a class="dropdown-item small" href="/pages/assistenza-it-milano.html">Milano</a></li>
                                <li><a class="dropdown-item small" href="/pages/assistenza-it-monza.html">Monza</a></li>
                                <li><a class="dropdown-item small" href="/pages/assistenza-it-vimercate.html">Vimercate</a></li>
                                <li><a class="dropdown-item small" href="/pages/assistenza-it-seregno.html">Seregno</a></li>
                                <li><a class="dropdown-item small" href="/pages/assistenza-it-lissone.html">Lissone</a></li>
                            </div>
                            <div class="col-6">
                                <li class="dropdown-header text-muted small">COMO E LECCO</li>
                                <li><a class="dropdown-item small" href="/pages/assistenza-it-como.html">Como</a></li>
                                <li><a class="dropdown-item small" href="/pages/assistenza-it-lecco.html">Lecco</a></li>
                                <li><a class="dropdown-item small" href="/pages/assistenza-it-cantu.html">Cantù</a></li>
                                <li><a class="dropdown-item small" href="/pages/assistenza-it-merate.html">Merate</a></li>
                                <li><a class="dropdown-item small" href="#" class="text-primary">Vedi tutte →</a></li>
                            </div>
                        </div>
                    </ul>
                </li>
                
                <!-- Why IT-ERA -->
                <li class="nav-item">
                    <a class="nav-link" href="#perche">Perché IT-ERA</a>
                </li>
                
                <!-- Contact -->
                <li class="nav-item">
                    <a class="nav-link" href="#contatti">Contatti</a>
                </li>
                
                <!-- Primary CTA Button -->
                <li class="nav-item ms-lg-3">
                    <a href="tel:+390398882041" class="btn btn-primary">
                        📞 039 888 2041
                    </a>
                </li>
            </ul>
        </div>
    </div>
</nav>'''

# Additional CSS for optimized navigation
MENU_CSS = '''
/* Optimized Navigation Styles */
.navbar {
    min-height: 76px;
}

.dropdown-menu-columns {
    min-width: 400px;
}

.dropdown-header {
    font-weight: 600;
    padding: 0.5rem 1rem 0.25rem;
}

.dropdown-item {
    padding: 0.4rem 1rem;
    transition: all 0.2s ease;
}

.dropdown-item:hover {
    background-color: #f8f9fa;
    padding-left: 1.25rem;
}

.badge {
    font-size: 0.7rem;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

/* Mobile optimizations */
@media (max-width: 991px) {
    .dropdown-menu-columns {
        min-width: 100%;
    }
    
    .dropdown-menu-columns .row {
        display: block;
    }
    
    .navbar-nav {
        padding: 1rem 0;
    }
    
    .nav-item {
        border-bottom: 1px solid #f8f9fa;
    }
    
    .nav-item:last-child {
        border-bottom: none;
        margin-top: 1rem;
    }
}'''

def process_html_file(file_path):
    """Process a single HTML file to apply optimized navigation"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Remove existing navigation
        for nav in soup.find_all('nav'):
            nav.decompose()
        
        # Add optimized navigation after body tag
        body = soup.find('body')
        if body:
            # Parse the new navigation HTML
            nav_soup = BeautifulSoup(OPTIMIZED_NAV, 'html.parser')
            nav_element = nav_soup.find('nav')
            
            # Insert at the beginning of body
            if nav_element:
                body.insert(0, nav_element)
        
        # Add or update the menu CSS
        style_tag = soup.find('style', string=lambda text: 'Optimized Navigation Styles' in text if text else False)
        if not style_tag:
            # Find existing style tag or create new one
            head = soup.find('head')
            if head:
                new_style = soup.new_tag('style')
                new_style.string = MENU_CSS
                head.append(new_style)
        
        # Ensure body has proper padding for fixed navbar
        body = soup.find('body')
        if body:
            if 'style' in body.attrs:
                if 'padding-top' not in body['style']:
                    body['style'] += '; padding-top: 76px;'
            else:
                body['style'] = 'padding-top: 76px;'
        
        # Write the modified content back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        
        return f"✅ {file_path}"
    
    except Exception as e:
        return f"❌ {file_path}: {str(e)}"

def main():
    """Main function to apply optimized navigation to all pages"""
    print("🚀 Applying optimized conversion-focused navigation to all IT-ERA pages")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Define directories to process
    base_dir = Path('/Users/andreapanzeri/progetti/IT-ERA')
    directories = [
        base_dir / 'web' / 'pages',
        base_dir / 'web' / 'pages-draft',
        base_dir / 'templates'
    ]
    
    # Also process the homepage
    homepage = base_dir / 'web' / 'index.html'
    
    # Collect all HTML files
    html_files = []
    
    # Add homepage
    if homepage.exists():
        html_files.append(homepage)
    
    # Add all HTML files from directories
    for directory in directories:
        if directory.exists():
            html_files.extend(directory.glob('*.html'))
    
    print(f"📁 Found {len(html_files)} HTML files to process")
    
    # Process files in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(process_html_file, html_files))
    
    # Count results
    success_count = sum(1 for r in results if r.startswith('✅'))
    error_count = sum(1 for r in results if r.startswith('❌'))
    
    print(f"\n📊 Results:")
    print(f"   ✅ Successfully updated: {success_count} files")
    print(f"   ❌ Errors: {error_count} files")
    
    # Print errors if any
    if error_count > 0:
        print("\n⚠️ Errors encountered:")
        for result in results:
            if result.startswith('❌'):
                print(f"   {result}")
    
    print(f"\n✨ Process completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("🎯 Optimized navigation applied with:")
    print("   - Emergency support as primary CTA")
    print("   - Industry-specific targeting")
    print("   - Coverage areas dropdown")
    print("   - Mobile-optimized emergency button")
    print("   - Conversion-focused badges and urgency indicators")

if __name__ == "__main__":
    main()