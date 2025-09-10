#!/usr/bin/env python3
"""
IT-ERA Unified Styles Applicator
Applica automaticamente il sistema CSS unificato e i componenti UX/UI a tutte le pagine
"""

import os
import re
import glob
from pathlib import Path

class ITERAStylesApplicator:
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.web_dir = self.base_dir / "web"
        self.components_dir = self.base_dir / "components"
        
        # Contatori per statistiche
        self.pages_processed = 0
        self.pages_updated = 0
        self.errors = []
        
    def load_components(self):
        """Carica tutti i componenti necessari"""
        components = {}
        
        # Carica navigation ottimizzata
        nav_file = self.components_dir / "navigation-optimized.html"
        if nav_file.exists():
            with open(nav_file, 'r', encoding='utf-8') as f:
                components['navigation'] = f.read()
        
        # Carica live chat
        chat_file = self.components_dir / "live-chat-tawk.html"
        if chat_file.exists():
            with open(chat_file, 'r', encoding='utf-8') as f:
                components['live_chat'] = f.read()
        
        # Carica form contatto hero
        form_file = self.components_dir / "contact-form-hero.html"
        if form_file.exists():
            with open(form_file, 'r', encoding='utf-8') as f:
                components['contact_form'] = f.read()

        # Carica CSP headers aggiornati
        csp_file = self.components_dir / "csp-headers.html"
        if csp_file.exists():
            with open(csp_file, 'r', encoding='utf-8') as f:
                components['csp_headers'] = f.read()

        return components
    
    def get_unified_css_link(self):
        """Genera il link al CSS unificato"""
        return '<link rel="stylesheet" href="/css/unified-styles.css">'
    
    def process_html_file(self, file_path, components):
        """Processa un singolo file HTML"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            updated = False
            
            # 1. Aggiungi CSS unificato se non presente
            css_link = self.get_unified_css_link()
            if css_link not in content and '</head>' in content:
                content = content.replace('</head>', f'    {css_link}\n</head>')
                updated = True
                print(f"  ✅ Aggiunto CSS unificato")

            # 1.5. Aggiungi CSP headers se non presenti
            if 'csp_headers' in components and 'Content-Security-Policy' not in content:
                if '<head>' in content:
                    content = content.replace('<head>', f'<head>\n{components["csp_headers"]}')
                    updated = True
                    print(f"  ✅ CSP headers aggiornati")
            
            # 2. Aggiorna navigation se presente
            if 'navigation-optimized.html' in content and 'navigation' in components:
                # Trova e sostituisci il blocco navigation esistente
                nav_pattern = r'<!-- Optimized Navigation.*?</nav>'
                if re.search(nav_pattern, content, re.DOTALL):
                    content = re.sub(nav_pattern, components['navigation'], content, flags=re.DOTALL)
                    updated = True
                    print(f"  ✅ Navigation aggiornata")
            
            # 3. Aggiungi live chat prima di </body> se non presente
            if 'live_chat' in components and 'Tawk_API' not in content:
                if '</body>' in content:
                    content = content.replace('</body>', f'{components["live_chat"]}\n</body>')
                    updated = True
                    print(f"  ✅ Live chat aggiunta")
            
            # 4. Aggiungi form contatto hero nella homepage
            if file_path.name == 'index.html' and 'contact_form' in components:
                if 'hero-contact-section' not in content:
                    # Trova la sezione hero esistente e aggiungi il form dopo
                    hero_pattern = r'(<section[^>]*hero[^>]*>.*?</section>)'
                    if re.search(hero_pattern, content, re.DOTALL | re.IGNORECASE):
                        content = re.sub(hero_pattern, r'\1\n' + components['contact_form'], content, flags=re.DOTALL | re.IGNORECASE)
                        updated = True
                        print(f"  ✅ Form contatto hero aggiunto")
            
            # 5. Ottimizza meta tags per WCAG AA
            if '<meta name="viewport"' not in content:
                viewport_meta = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
                if '<head>' in content:
                    content = content.replace('<head>', f'<head>\n    {viewport_meta}')
                    updated = True
                    print(f"  ✅ Viewport meta aggiunto")
            
            # 6. Aggiungi skip navigation per accessibility
            if 'skip-navigation' not in content and '<body' in content:
                skip_nav = '''<a href="#main-content" class="skip-navigation">Salta al contenuto principale</a>'''
                content = re.sub(r'(<body[^>]*>)', r'\1\n' + skip_nav, content)
                updated = True
                print(f"  ✅ Skip navigation aggiunto")
            
            # 7. Aggiungi main content wrapper se mancante
            if '<main' not in content and updated:
                # Trova il contenuto principale e wrappalo in <main>
                body_pattern = r'(<body[^>]*>)(.*?)(</body>)'
                match = re.search(body_pattern, content, re.DOTALL)
                if match:
                    body_start, body_content, body_end = match.groups()
                    # Aggiungi id="main-content" al main wrapper
                    if '<nav' in body_content:
                        # Separa nav dal resto del contenuto
                        nav_end = body_content.find('</nav>') + 6
                        nav_part = body_content[:nav_end]
                        main_part = body_content[nav_end:]
                        new_content = f'{body_start}{nav_part}\n<main id="main-content">{main_part}</main>\n{body_end}'
                        content = new_content
                        print(f"  ✅ Main content wrapper aggiunto")
            
            # Salva solo se ci sono stati cambiamenti
            if updated and content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.pages_updated += 1
                return True
            
            return False
            
        except Exception as e:
            error_msg = f"Errore processando {file_path}: {str(e)}"
            self.errors.append(error_msg)
            print(f"  ❌ {error_msg}")
            return False
    
    def apply_to_all_pages(self):
        """Applica gli stili unificati a tutte le pagine HTML"""
        print("🚀 Avvio applicazione stili unificati IT-ERA...")
        
        # Carica componenti
        components = self.load_components()
        print(f"📦 Caricati {len(components)} componenti")
        
        # Trova tutti i file HTML
        html_files = list(self.web_dir.glob("*.html"))
        print(f"📄 Trovati {len(html_files)} file HTML da processare")
        
        # Processa ogni file
        for html_file in html_files:
            print(f"\n🔧 Processando: {html_file.name}")
            self.pages_processed += 1
            
            if self.process_html_file(html_file, components):
                print(f"  ✅ Aggiornato con successo")
            else:
                print(f"  ℹ️  Nessun aggiornamento necessario")
        
        # Statistiche finali
        print(f"\n📊 STATISTICHE FINALI:")
        print(f"   📄 Pagine processate: {self.pages_processed}")
        print(f"   ✅ Pagine aggiornate: {self.pages_updated}")
        print(f"   ❌ Errori: {len(self.errors)}")
        
        if self.errors:
            print(f"\n❌ ERRORI RISCONTRATI:")
            for error in self.errors:
                print(f"   • {error}")
        
        print(f"\n🎉 Applicazione stili unificati completata!")
        print(f"💡 Tutte le pagine ora utilizzano il design system IT-ERA unificato")
        
        return {
            'processed': self.pages_processed,
            'updated': self.pages_updated,
            'errors': len(self.errors)
        }

def main():
    """Funzione principale"""
    applicator = ITERAStylesApplicator()
    results = applicator.apply_to_all_pages()
    
    # Exit code basato sui risultati
    if results['errors'] > 0:
        exit(1)
    else:
        exit(0)

if __name__ == "__main__":
    main()
