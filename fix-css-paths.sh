#!/bin/bash

# Script per correggere i percorsi CSS e fare il deploy su GitHub Pages

echo "🔧 Correzione percorsi CSS per GitHub Pages..."

# Aggiungi tutte le modifiche
git add _site/

# Commit delle modifiche
git commit -m "Fix: Corretti percorsi CSS, JS e immagini per GitHub Pages

- Sostituito combined.min.css con styles.css principale
- Aggiunto enhanced-chatbot.min.css per il chatbot
- Corretti tutti i percorsi relativi per GitHub Pages (/it-era/)
- Aggiornati percorsi in tutte le pagine HTML
- Corretti percorsi favicon e icone"

# Push su GitHub
git push origin main

echo "✅ Modifiche inviate a GitHub Pages!"
echo "🌐 Il sito sarà aggiornato in pochi minuti su: https://userx87.github.io/it-era/"
echo ""
echo "📋 Modifiche apportate:"
echo "   - Corretti percorsi CSS in index.html, contatti.html, servizi.html"
echo "   - Aggiornati percorsi nelle pagine dei settori"
echo "   - Corretti percorsi JavaScript e immagini"
echo "   - Aggiornati percorsi favicon e icone"
echo ""
echo "⏰ Attendi 2-3 minuti per la propagazione delle modifiche"
