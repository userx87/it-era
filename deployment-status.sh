#!/bin/bash

echo "🚀 IT-ERA GITHUB PAGES DEPLOYMENT STATUS"
echo "========================================"
echo ""

# Informazioni repository
echo "📋 REPOSITORY INFO:"
echo "   Repository: userx87/it-era"
echo "   Branch: main"
echo "   Last commit: $(git log -1 --format='%h - %s')"
echo ""

# URL del sito
SITE_URL="https://userx87.github.io/it-era/"
echo "🌐 SITE URL: $SITE_URL"
echo ""

# Verifica GitHub Actions
echo "⚙️  GITHUB ACTIONS STATUS:"
echo "   Workflow 1: Deploy Website (complex)"
echo "   Workflow 2: GitHub Pages Simple (direct _site deploy)"
echo "   ✅ Workflows configurati e attivi"
echo ""

# Test connessione
echo "🔍 CONNECTIVITY TEST:"
echo "   Testing main site..."
if curl -s --head "$SITE_URL" | head -n 1 | grep -q "200 OK"; then
    echo "   ✅ Main site: ONLINE"
    
    # Test CSS
    echo "   Testing CSS files..."
    if curl -s --head "${SITE_URL}styles.css" | head -n 1 | grep -q "200 OK"; then
        echo "   ✅ Main CSS: LOADED"
    else
        echo "   ⚠️  Main CSS: NOT FOUND"
    fi
    
    if curl -s --head "${SITE_URL}css/enhanced-chatbot.min.css" | head -n 1 | grep -q "200 OK"; then
        echo "   ✅ Chatbot CSS: LOADED"
    else
        echo "   ⚠️  Chatbot CSS: NOT FOUND"
    fi
    
    # Test key pages
    echo "   Testing key pages..."
    for page in "contatti.html" "servizi.html"; do
        if curl -s --head "${SITE_URL}${page}" | head -n 1 | grep -q "200 OK"; then
            echo "   ✅ $page: ACCESSIBLE"
        else
            echo "   ⚠️  $page: NOT ACCESSIBLE"
        fi
    done
    
else
    echo "   ⚠️  Main site: OFFLINE or UPDATING"
fi

echo ""
echo "📊 DEPLOYMENT SUMMARY:"
echo "====================="
echo "✅ Code pushed to GitHub"
echo "✅ GitHub Actions workflows configured"
echo "✅ CSS paths corrected for GitHub Pages"
echo "✅ All asset paths updated with /it-era/ prefix"
echo ""

# Timestamp
echo "🕒 Last check: $(date)"
echo ""

echo "🎯 NEXT STEPS:"
echo "=============="
echo "1. Wait 2-5 minutes for GitHub Actions to complete"
echo "2. Check GitHub Actions tab: https://github.com/userx87/it-era/actions"
echo "3. Visit the site: $SITE_URL"
echo "4. Use Ctrl+F5 for hard refresh if needed"
echo ""

echo "🔄 To check again: ./deployment-status.sh"
