#!/usr/bin/env python3
"""
IT-ERA Lombardy City Pages Generator
Generates service pages for all major cities in Lombardy region
"""

import json
import os
import sys
import argparse
from pathlib import Path
import re
from datetime import datetime

class LombardyPagesGenerator:
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.data_file = self.base_dir / "data" / "cities_lombardia.json"
        self.template_file = self.base_dir / "templates" / "service-city-lombardia.html"
        self.output_dir = self.base_dir / "web" / "pages-generated"
        self.cities = []
        
    def load_cities(self):
        """Load cities data from JSON file"""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                self.cities = json.load(f)
            print(f"✓ Loaded {len(self.cities)} cities from {self.data_file}")
        except FileNotFoundError:
            print(f"✗ Error: {self.data_file} not found")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"✗ Error parsing JSON: {e}")
            sys.exit(1)
            
    def load_template(self):
        """Load the HTML template"""
        try:
            with open(self.template_file, 'r', encoding='utf-8') as f:
                self.template = f.read()
            print(f"✓ Loaded template from {self.template_file}")
        except FileNotFoundError:
            print(f"✗ Error: Template {self.template_file} not found")
            print("Creating default template...")
            self.create_default_template()
            with open(self.template_file, 'r', encoding='utf-8') as f:
                self.template = f.read()
                
    def create_default_template(self):
        """Create default service-city template"""
        default_template = '''<!doctype html>
<html lang="it">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Servizi IT {{city}} | Assistenza Informatica {{provincia}} | IT-ERA</title>
    <meta name="description" content="Assistenza informatica e sicurezza IT per aziende a {{city}} ({{provincia}}). IT-ERA: partner tecnologico affidabile per la tua trasformazione digitale.">
    <meta name="keywords" content="assistenza IT {{city}}, sicurezza informatica {{city}}, servizi IT {{provincia}}, supporto tecnico {{city}}">
    <link rel="canonical" href="https://it-era.it/servizi-{{slug}}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="Servizi IT {{city}} - Assistenza Informatica {{provincia}}">
    <meta property="og:description" content="Assistenza informatica professionale e sicurezza IT per aziende a {{city}} ({{provincia}}). Supporto 24/7, consulenza e soluzioni su misura.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://it-era.it/servizi-{{slug}}">
    
    <!-- Schema.org -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "IT-ERA - Servizi IT {{city}}",
        "description": "Assistenza informatica e sicurezza IT per aziende a {{city}}",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Viale Risorgimento 32",
            "addressLocality": "Vimercate",
            "addressRegion": "MB",
            "postalCode": "20871",
            "addressCountry": "IT"
        },
        "telephone": "039 888 2041",
        "email": "info@it-era.it",
        "areaServed": {
            "@type": "City",
            "name": "{{city}}",
            "containedIn": "{{provincia}}, Lombardia, Italia"
        },
        "serviceType": "IT Support"
    }
    </script>
    
    <!-- GA4 + GTM Tracking -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-T5VWN9EH21"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-T5VWN9EH21');
    </script>
    
    <!-- GTM -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-KPF3JZT');</script>
</head>
<body>
    <!-- GTM (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KPF3JZT"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    
    <header>
        <nav>
            <!-- Navigation will be unified via apply_unified_components.py -->
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <div class="container">
                <h1>Servizi IT e Assistenza Informatica a {{city}}</h1>
                <p class="lead">Partner tecnologico di fiducia per aziende in {{provincia}}. Supporto IT professionale, sicurezza informatica e soluzioni cloud su misura.</p>
                <div class="cta-buttons">
                    <a href="tel:0398882041" class="btn btn-primary">Chiama Ora: 039 888 2041</a>
                    <a href="/contatti" class="btn btn-secondary">Richiedi Preventivo</a>
                </div>
            </div>
        </section>
        
        <section class="services">
            <div class="container">
                <h2>I Nostri Servizi IT a {{city}}</h2>
                <div class="services-grid">
                    <div class="service-card">
                        <h3>🔧 Assistenza IT</h3>
                        <p>Supporto tecnico 24/7, help desk e interventi on-site per la tua azienda a {{city}}.</p>
                        <a href="/assistenza-it" class="btn-service">Scopri di più</a>
                    </div>
                    <div class="service-card">
                        <h3>🛡️ Sicurezza Informatica</h3>
                        <p>Protezione avanzata contro cyber minacce, firewall e sistemi di backup per {{city}}.</p>
                        <a href="/sicurezza-informatica" class="btn-service">Scopri di più</a>
                    </div>
                    <div class="service-card">
                        <h3>☁️ Cloud Storage</h3>
                        <p>Soluzioni cloud sicure e scalabili per archiviazione e collaborazione aziendale.</p>
                        <a href="/cloud-storage" class="btn-service">Scopri di più</a>
                    </div>
                    <div class="service-card">
                        <h3>💻 Riparazione PC</h3>
                        <p>Riparazione e manutenzione computer, laptop e server per aziende di {{city}}.</p>
                        <a href="/riparazione-pc" class="btn-service">Scopri di più</a>
                    </div>
                </div>
            </div>
        </section>
        
        <section class="contact-local">
            <div class="container">
                <h2>Contattaci per {{city}} e Provincia di {{provincia}}</h2>
                <div class="contact-info">
                    <div class="contact-item">
                        <strong>📞 Telefono:</strong> <a href="tel:0398882041">039 888 2041</a>
                    </div>
                    <div class="contact-item">
                        <strong>📧 Email:</strong> <a href="mailto:info@it-era.it">info@it-era.it</a>
                    </div>
                    <div class="contact-item">
                        <strong>📍 Sede:</strong> Viale Risorgimento 32, Vimercate (MB)
                    </div>
                    <div class="contact-item">
                        <strong>🏛️ P.IVA:</strong> 10524040966
                    </div>
                </div>
            </div>
        </section>
    </main>
    
    <footer>
        <!-- Footer will be unified via apply_unified_components.py -->
    </footer>
    
    <style>
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .hero { padding: 80px 0; background: linear-gradient(135deg, #0056cc 0%, #004999 100%); color: white; text-align: center; }
    .hero h1 { font-size: 2.5rem; margin-bottom: 20px; }
    .lead { font-size: 1.2rem; margin-bottom: 30px; }
    .cta-buttons { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
    .btn { padding: 15px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; transition: all 0.3s; }
    .btn-primary { background: #ff6b35; color: white; }
    .btn-secondary { background: transparent; color: white; border: 2px solid white; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
    .services { padding: 80px 0; }
    .services h2 { text-align: center; margin-bottom: 50px; font-size: 2rem; }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }
    .service-card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; }
    .service-card h3 { margin-bottom: 15px; color: #0056cc; }
    .btn-service { display: inline-block; margin-top: 15px; padding: 10px 20px; background: #0056cc; color: white; text-decoration: none; border-radius: 5px; }
    .contact-local { padding: 60px 0; background: #f8f9fa; }
    .contact-local h2 { text-align: center; margin-bottom: 40px; }
    .contact-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
    .contact-item { padding: 15px; background: white; border-radius: 5px; }
    @media (max-width: 768px) {
        .hero h1 { font-size: 2rem; }
        .cta-buttons { flex-direction: column; align-items: center; }
        .services-grid { grid-template-columns: 1fr; }
    }
    </style>
</body>
</html>'''
        
        os.makedirs(self.template_file.parent, exist_ok=True)
        with open(self.template_file, 'w', encoding='utf-8') as f:
            f.write(default_template)
        print(f"✓ Created default template at {self.template_file}")
    
    def generate_slug(self, city_name):
        """Generate URL-friendly slug from city name"""
        # Convert to lowercase
        slug = city_name.lower()
        # Replace spaces with hyphens
        slug = slug.replace(' ', '-')
        # Remove apostrophes and other special characters
        slug = re.sub(r"[''`]", '', slug)
        # Remove any other special characters except hyphens
        slug = re.sub(r'[^a-z0-9-]', '', slug)
        # Remove multiple consecutive hyphens
        slug = re.sub(r'-+', '-', slug)
        # Remove leading/trailing hyphens
        slug = slug.strip('-')
        return slug
        
    def generate_page(self, city, dry_run=False):
        """Generate a single city page"""
        city_name = city['comune']
        province = city['provincia']
        slug = self.generate_slug(city_name)
        
        # Replace template variables
        content = self.template
        content = content.replace('{{city}}', city_name)
        content = content.replace('{{provincia}}', province)
        content = content.replace('{{slug}}', slug)
        
        # Output filename
        filename = f"servizi-{slug}.html"
        output_file = self.output_dir / filename
        
        if dry_run:
            print(f"[DRY RUN] Would create: {output_file}")
            return filename
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Write file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
            
        return filename
        
    def generate_all_pages(self, dry_run=False, limit=None):
        """Generate all city pages"""
        if not dry_run:
            print(f"Generating pages in: {self.output_dir}")
            
        generated = []
        cities_to_process = self.cities[:limit] if limit else self.cities
        
        for i, city in enumerate(cities_to_process, 1):
            print(f"[{i:2d}/{len(cities_to_process):2d}] {city['comune']} ({city['provincia']})")
            filename = self.generate_page(city, dry_run)
            generated.append({
                'filename': filename,
                'city': city['comune'],
                'province': city['provincia'],
                'slug': self.generate_slug(city['comune'])
            })
            
        if not dry_run:
            print(f"\n✓ Generated {len(generated)} pages in {self.output_dir}")
        else:
            print(f"\n[DRY RUN] Would generate {len(generated)} pages")
            
        return generated
        
    def run(self, dry_run=False, limit=None):
        """Main execution method"""
        print("=== IT-ERA Lombardy Pages Generator ===")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if dry_run:
            print("🔍 DRY RUN MODE - No files will be created")
        if limit:
            print(f"📊 LIMIT: Processing only first {limit} cities")
            
        # Load data and template
        self.load_cities()
        self.load_template()
        
        # Generate pages
        generated = self.generate_all_pages(dry_run, limit)
        
        print(f"\n🎯 Summary:")
        print(f"   Cities processed: {len(generated)}")
        print(f"   Output directory: {self.output_dir}")
        
        if not dry_run:
            print(f"\n💡 Next steps:")
            print(f"   1. Run unified components: python3 scripts/apply_unified_components.py")
            print(f"   2. Update sitemap: npm run build:sitemap")
            print(f"   3. Test pages: npm run validate")
            
        return generated

def main():
    parser = argparse.ArgumentParser(description='Generate IT-ERA Lombardy city pages')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Preview what would be generated without creating files')
    parser.add_argument('--limit', type=int, 
                       help='Limit number of cities to process (for testing)')
    
    args = parser.parse_args()
    
    generator = LombardyPagesGenerator()
    try:
        generator.run(dry_run=args.dry_run, limit=args.limit)
    except KeyboardInterrupt:
        print("\n⚠️ Generation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()