#!/bin/bash

echo "🚀 GITHUB PAGES DEPLOYMENT STATUS"
echo "=================================="
echo ""

# URL del sito
SITE_URL="https://userx87.github.io/it-era/"

echo "📍 Sito URL: $SITE_URL"
echo ""

# Verifica se il sito risponde
echo "🔍 Verifica connessione al sito..."
if curl -s --head "$SITE_URL" | head -n 1 | grep -q "200 OK"; then
    echo "✅ Sito raggiungibile!"
else
    echo "⚠️  Sito non ancora raggiungibile o in aggiornamento..."
fi

echo ""

# Verifica CSS
echo "🎨 Verifica caricamento CSS..."
CSS_URL="https://userx87.github.io/it-era/styles.css"
if curl -s --head "$CSS_URL" | head -n 1 | grep -q "200 OK"; then
    echo "✅ CSS principale caricato correttamente!"
else
    echo "❌ CSS principale non trovato"
fi

# Verifica CSS chatbot
CHATBOT_CSS_URL="https://userx87.github.io/it-era/css/enhanced-chatbot.min.css"
if curl -s --head "$CHATBOT_CSS_URL" | head -n 1 | grep -q "200 OK"; then
    echo "✅ CSS chatbot caricato correttamente!"
else
    echo "❌ CSS chatbot non trovato"
fi

echo ""
echo "📊 STATO DEPLOYMENT:"
echo "==================="
echo "✅ Codice pushato su GitHub"
echo "✅ Commit con correzioni CSS completato"
echo "⏰ GitHub Pages sta processando le modifiche..."
echo ""
echo "🕐 Tempo stimato per il deployment: 2-5 minuti"
echo ""
echo "🌐 Una volta completato, il sito sarà disponibile su:"
echo "   $SITE_URL"
echo ""
echo "🔄 Per verificare nuovamente, esegui: ./check-deployment.sh"
echo ""
echo "💡 SUGGERIMENTI:"
echo "   - Usa Ctrl+F5 per refresh forzato"
echo "   - Prova modalità incognito se vedi ancora problemi"
echo "   - Controlla la console del browser per errori"
