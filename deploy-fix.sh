#!/bin/bash

echo "🚀 IT-ERA Deploy Fix Script"
echo "=========================="

# 1. Backup configurazione attuale
echo "📦 Backup configurazione..."
cp vercel.json vercel.json.backup

# 2. Applica configurazione corretta
echo "🔧 Applicando configurazione corretta..."
cp vercel-fix.json vercel.json

# 3. Pulizia file duplicati
echo "🧹 Pulizia file duplicati..."
node cleanup-duplicates.js

# 4. Deploy
echo "🚀 Deploy su Vercel..."
vercel --prod

echo "✅ Deploy completato!"
echo "🌐 Controlla: https://vercel.com/dashboard"
