#!/bin/bash

# Script per test rapidi SendGrid tramite curl
# Eseguibile direttamente da terminale per diagnosi immediate

echo "🚀 TEST RAPIDI SENDGRID - IT-ERA.IT"
echo "===================================="

API_KEY="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"

echo ""
echo "🔍 Test 1: Verifica API Key e Permessi"
echo "--------------------------------------"
curl -s -X GET "https://api.sendgrid.com/v3/scopes" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "🔍 Test 2: Verifica Domini Autenticati"
echo "--------------------------------------"
curl -s -X GET "https://api.sendgrid.com/v3/whitelabel/domains" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "🔍 Test 3: Verifica Sender Identity"
echo "-----------------------------------"
curl -s -X GET "https://api.sendgrid.com/v3/verified_senders" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "🔍 Test 4: Tentativo Invio Email"
echo "--------------------------------"
curl -s -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{
      "to": [{"email": "andrea@bulltech.it"}]
    }],
    "from": {
      "email": "info@it-era.it",
      "name": "IT-ERA Sistema Test"
    },
    "subject": "Test Diagnostico SendGrid",
    "content": [{
      "type": "text/html",
      "value": "<h1>Test</h1><p>Questo è un test diagnostico.</p>"
    }]
  }' -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "🔍 Test 5: Verifica Account Info"
echo "-------------------------------"
curl -s -X GET "https://api.sendgrid.com/v3/user/account" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "✅ Test completati! Analizza i risultati sopra."
echo "=============================================="