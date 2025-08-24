#!/bin/bash

# Script per configurare SendGrid con Cloudflare Workers
# IT-ERA Email System Setup

echo "🚀 Configurazione SendGrid per IT-ERA..."

# Imposta la API Key di SendGrid come secret
echo "📝 Impostazione SendGrid API Key..."
wrangler secret put SENDGRID_API_KEY

echo "✅ Secret configurato!"
echo ""
echo "📋 Prossimi passi:"
echo "1. Incolla la tua API key SendGrid quando richiesto"
echo "2. Premi ENTER per confermare"
echo ""
echo "🔄 Deploy del Worker..."
wrangler deploy

echo "✅ Worker deployato con successo!"
echo ""
echo "📧 Il sistema email è ora configurato e pronto!"
echo "Endpoint: https://api.bulltech.it/api/contact"