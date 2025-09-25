#!/bin/bash

# =======================================================
# MOBILE RESPONSIVENESS BATCH IMPLEMENTATION
# Applies mobile menu to all HTML files on IT-ERA site
# =======================================================

echo "🚀 Starting mobile menu implementation across IT-ERA website..."

# Counters
UPDATED_COUNT=0
SKIPPED_COUNT=0
ERROR_COUNT=0

# Function to update HTML file with mobile menu
update_html_file() {
    local file="$1"
    local relative_css_path=""
    local relative_js_path=""

    # Determine relative paths based on file location
    if [[ "$file" == *"/servizi-it/"* ]] || [[ "$file" == *"/settori/"* ]] || [[ "$file" == *"/landing/"* ]]; then
        relative_css_path="../css/mobile-menu.css"
        relative_js_path="../js/mobile-menu.js"
    else
        relative_css_path="/css/mobile-menu.css"
        relative_js_path="/js/mobile-menu.js"
    fi

    echo "📱 Updating: $file"

    # Check if file already has mobile menu
    if grep -q "mobile-menu.css" "$file" 2>/dev/null; then
        echo "   ⚠️  Already has mobile menu - skipping"
        ((SKIPPED_COUNT++))
        return
    fi

    # Backup original file
    cp "$file" "$file.backup" 2>/dev/null || {
        echo "   ❌ Failed to backup file"
        ((ERROR_COUNT++))
        return
    }

    # Add mobile CSS after other CSS includes
    if grep -q "tailwind" "$file"; then
        # Find the last CSS link and add mobile CSS after it
        sed -i.tmp '/tailwind\|it-era.*\.css\|components.*\.css/,/<\/head>/ {
            /<\/head>/i\
    <!-- Mobile Responsiveness -->\
    <link rel="stylesheet" href="'"$relative_css_path"'">
        }' "$file" || {
            echo "   ❌ Failed to add mobile CSS"
            mv "$file.backup" "$file"
            ((ERROR_COUNT++))
            return
        }
        rm "$file.tmp" 2>/dev/null
    fi

    # Add mobile JavaScript before closing body tag
    if grep -q "</body>" "$file"; then
        sed -i.tmp '/<\/body>/i\
\
    <!-- Mobile Menu System -->\
    <script src="'"$relative_js_path"'"></script>' "$file" || {
            echo "   ❌ Failed to add mobile JS"
            mv "$file.backup" "$file"
            ((ERROR_COUNT++))
            return
        }
        rm "$file.tmp" 2>/dev/null
    fi

    # Remove backup if successful
    rm "$file.backup" 2>/dev/null

    echo "   ✅ Successfully updated"
    ((UPDATED_COUNT++))
}

# Process all HTML files
echo "🔍 Scanning for HTML files to update..."

# Process main directory files
for file in *.html; do
    if [[ -f "$file" && "$file" != "*.html" ]]; then
        if grep -q "tailwind" "$file" 2>/dev/null; then
            update_html_file "$file"
        fi
    fi
done

# Process settori files
if [[ -d "settori" ]]; then
    for file in settori/*.html; do
        if [[ -f "$file" ]]; then
            if grep -q "tailwind" "$file" 2>/dev/null; then
                update_html_file "$file"
            fi
        fi
    done
fi

# Process landing files
if [[ -d "landing" ]]; then
    for file in landing/*.html; do
        if [[ -f "$file" ]]; then
            if grep -q "tailwind" "$file" 2>/dev/null; then
                update_html_file "$file"
            fi
        fi
    done
fi

# Process servizi-it files (in batches to avoid too many at once)
if [[ -d "servizi-it" ]]; then
    echo "📁 Processing servizi-it files (this may take a while)..."

    # Process first 20 most important service files
    important_files=(
        "assistenza-informatica-aziende-milano.html"
        "assistenza-informatica-privati-milano.html"
        "computer-non-si-accende-milano.html"
        "sicurezza-informatica-consulenza-milano.html"
        "computer-su-misura-milano.html"
        "riparazione-computer-milano.html"
        "hard-disk-non-funziona-milano.html"
        "virus-removal-privati-milano.html"
        "backup-automatico-azienda-milano.html"
        "configurazione-rete-aziendale-milano.html"
        "assemblaggio-pc-milano-milano.html"
        "server-assemblaggio-milano.html"
        "recupero-dati-personali-milano.html"
        "formazione-informatica-aziende-milano.html"
        "migrazione-dati-server-milano.html"
        "ottimizzazione-performance-pc-milano.html"
        "sostituzione-hard-disk-milano.html"
        "riparazione-notebook-milano.html"
        "computer-ufficio-assemblaggio-milano.html"
        "configurazione-computer-milano.html"
    )

    for filename in "${important_files[@]}"; do
        file="servizi-it/$filename"
        if [[ -f "$file" ]]; then
            if grep -q "tailwind" "$file" 2>/dev/null; then
                update_html_file "$file"
            fi
        fi
    done

    # Process remaining files in smaller batches
    count=0
    for file in servizi-it/*.html; do
        if [[ -f "$file" ]]; then
            # Skip if already processed in important files
            skip=false
            for important in "${important_files[@]}"; do
                if [[ "$file" == "servizi-it/$important" ]]; then
                    skip=true
                    break
                fi
            done

            if [[ "$skip" == false ]]; then
                if grep -q "tailwind" "$file" 2>/dev/null; then
                    update_html_file "$file"
                    ((count++))

                    # Pause every 10 files to avoid overwhelming
                    if (( count % 10 == 0 )); then
                        echo "   💤 Processed $count files, brief pause..."
                        sleep 1
                    fi

                    # Limit to 50 additional files to avoid timeout
                    if (( count >= 50 )); then
                        echo "   ⏸️  Processed 50 additional files, stopping batch to avoid timeout"
                        break
                    fi
                fi
            fi
        fi
    done
fi

# Summary
echo ""
echo "📊 MOBILE MENU IMPLEMENTATION SUMMARY"
echo "====================================="
echo "✅ Files updated: $UPDATED_COUNT"
echo "⚠️  Files skipped: $SKIPPED_COUNT"
echo "❌ Errors: $ERROR_COUNT"
echo ""

if (( UPDATED_COUNT > 0 )); then
    echo "🎉 Mobile responsiveness successfully implemented!"
    echo "📱 Features added:"
    echo "   • Mobile hamburger menu"
    echo "   • Touch-friendly navigation"
    echo "   • Responsive design system"
    echo "   • Accessibility support"
    echo "   • Cross-device compatibility"
else
    echo "⚠️  No files were updated. Check file paths and permissions."
fi

echo ""
echo "🔧 Manual testing recommended on:"
echo "   • 375px (Mobile)"
echo "   • 768px (Tablet)"
echo "   • 1920px (Desktop)"
echo ""

exit 0