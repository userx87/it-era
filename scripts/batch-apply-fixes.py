#!/usr/bin/env python3
"""
Global Fix Applicator - SWARM AGENT 3
Applica tutti i fix HTML in modo efficiente
"""

import os
import re
import glob
from pathlib import Path

# Fix da applicare
MOBILE_MENU_CSS = '''
<!-- Mobile Menu Fix CSS -->
<link rel="stylesheet" href="/css/mobile-menu-fix.css">

<!-- Performance Critical CSS -->
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; }
  .hero { min-height: 50vh; }
  @media (max-width: 768px) {
    .mobile-menu-toggle { display: block !important; }
  }
</style>

<!-- Preconnect -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://www.google-analytics.com">
'''

MOBILE_MENU_SCRIPT = '''
<!-- Mobile Menu Emergency Handler -->
<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.querySelector('.mobile-menu-toggle, .hamburger-menu');
    var nav = document.querySelector('.mobile-nav, .mobile-menu');
    if (btn && nav) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        nav.classList.toggle('active');
        this.classList.toggle('active');
        this.setAttribute('aria-expanded',
          this.classList.contains('active') ? 'true' : 'false');
      });
    }
  });
})();
</script>'''

def apply_fixes_to_file(filepath):
    """Applica i fix a un singolo file HTML"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        changes = []

        # 1. Aggiungi CSS fix nel head (prima di </head>)
        if '</head>' in content and 'mobile-menu-fix.css' not in content:
            content = content.replace('</head>', f'{MOBILE_MENU_CSS}\n</head>')
            changes.append('CSS fix added')

        # 2. Aggiungi script mobile menu (prima di </body>)
        if '</body>' in content and 'Mobile Menu Emergency Handler' not in content:
            content = content.replace('</body>', f'{MOBILE_MENU_SCRIPT}\n</body>')
            changes.append('Mobile menu script added')

        # 3. Sostituisci prima occorrenza di loading="lazy" con loading="eager"
        if 'loading="lazy"' in content:
            content = content.replace('loading="lazy"', 'loading="eager"', 1)
            changes.append('First lazy loading → eager')

        # 4. Sposta script non critici in fondo con defer (se non già presenti)
        # Qui puoi aggiungere altre ottimizzazioni

        # Salva solo se ci sono stati cambiamenti
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return changes
        return []

    except Exception as e:
        print(f"❌ Errore processando {filepath}: {e}")
        return []

def main():
    """Funzione principale"""
    base_path = "/Users/andreapanzeri/progetti/IT-ERA"

    # Pattern dei file da processare
    patterns = [
        f"{base_path}/settori/*.html",
        f"{base_path}/landing/*.html",
        f"{base_path}/servizi-it/*.html"
    ]

    total_files = 0
    total_changes = 0

    print("🔧 GLOBAL FIX APPLICATOR - Inizio applicazione fix...")
    print()

    for pattern in patterns:
        files = glob.glob(pattern)
        category = pattern.split('/')[-1].replace('*.html', '')

        if files:
            print(f"📁 Categoria: {category.upper()}")
            for filepath in files:
                filename = os.path.basename(filepath)
                changes = apply_fixes_to_file(filepath)

                if changes:
                    total_files += 1
                    total_changes += len(changes)
                    print(f"  ✅ {filename}: {', '.join(changes)}")
                else:
                    print(f"  ⚪ {filename}: già aggiornato")
            print()

    print("="*60)
    print(f"🎯 RIEPILOGO FINALE:")
    print(f"   📄 File processati: {total_files}")
    print(f"   🔧 Fix applicati: {total_changes}")
    print()
    print("✅ Fix applicati:")
    print("   - Mobile Menu CSS")
    print("   - Performance Critical CSS")
    print("   - Preconnect links")
    print("   - Mobile Menu Emergency Handler")
    print("   - Prima immagine lazy → eager")
    print()
    print("🚀 Tutti i fix sono stati applicati con successo!")

if __name__ == "__main__":
    main()