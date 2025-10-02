#!/usr/bin/env python3
import os
import re
from pathlib import Path

def update_html_file(filepath):
    """Aggiorna un file HTML per includere il contact form handler"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Controlla se ha già lo script
        if 'contact-form-handler.js' in content:
            return False, "Already has handler"

        # Controlla se ha un form
        if not re.search(r'<form', content, re.IGNORECASE):
            return False, "No form found"

        # Trova il tag </body> e inserisci lo script prima
        script_tag = '\n    <!-- IT-ERA Contact Form Handler -->\n    <script src="/js/contact-form-handler.js"></script>\n'

        # Cerca </body>
        if '</body>' in content:
            content = content.replace('</body>', script_tag + '</body>')
        elif '</BODY>' in content:
            content = content.replace('</BODY>', script_tag + '</BODY>')
        else:
            # Se non c'è </body>, aggiungi alla fine del file
            content += script_tag

        # Salva il file aggiornato
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        return True, "Updated successfully"

    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    # Directory radice del progetto
    root_dir = Path('/Users/andreapanzeri/progetti/IT-ERA')

    # Pattern da includere
    include_patterns = [
        'index.html',
        'contatti.html',
        'servizi-it/*.html',
        'landing/*.html',
        'settori/*.html',
        'blog/*.html',
        'development/templates/*.html'
    ]

    # Pattern da escludere
    exclude_patterns = [
        'node_modules',
        '.next',
        'backup',
        'test-',
        '-old',
        '-backup',
        '-redesigned'
    ]

    updated_count = 0
    skipped_count = 0
    error_count = 0

    print("🔧 Updating HTML files with contact form handler...")
    print("=" * 60)

    # Trova tutti i file HTML
    html_files = []
    for pattern in include_patterns:
        if '*' in pattern:
            # È un pattern glob
            base_path = pattern.split('*')[0]
            for file in root_dir.glob(pattern):
                if file.is_file():
                    # Controlla se è da escludere
                    skip = False
                    for exclude in exclude_patterns:
                        if exclude in str(file):
                            skip = True
                            break
                    if not skip:
                        html_files.append(file)
        else:
            # È un file specifico
            file = root_dir / pattern
            if file.exists():
                html_files.append(file)

    print(f"Found {len(html_files)} HTML files to check\n")

    # Aggiorna ogni file
    for filepath in html_files:
        relative_path = filepath.relative_to(root_dir)
        success, message = update_html_file(filepath)

        if success:
            print(f"✅ {relative_path}")
            updated_count += 1
        elif "Already has handler" in message:
            # Non mostrare questi per evitare troppo output
            skipped_count += 1
        elif "No form found" in message:
            skipped_count += 1
        else:
            print(f"❌ {relative_path}: {message}")
            error_count += 1

    print("\n" + "=" * 60)
    print("📊 Summary:")
    print(f"✅ Updated: {updated_count} files")
    print(f"⏭️  Skipped: {skipped_count} files")
    print(f"❌ Errors: {error_count} files")

    if updated_count > 0:
        print("\n✨ All forms are now connected to the Next.js API!")
        print("📝 Remember to:")
        print("   1. Test the forms on different pages")
        print("   2. Verify domain on Resend for production")
        print("   3. Update NODE_ENV=production when deploying")

if __name__ == "__main__":
    main()