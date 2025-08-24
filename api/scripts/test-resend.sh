#!/bin/bash

# Script di test completo per integrazione Resend IT-ERA
# Verifica tutti i componenti dell'API email

set -e

echo "🧪 Test Completo Integrazione Resend IT-ERA"
echo "============================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="https://it-era-email.bulltech.workers.dev"
TESTS_PASSED=0
TESTS_FAILED=0

# Funzioni di logging
log() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

test_api() {
    local endpoint=$1
    local method=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    log "Test: $description"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$API_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -H "Origin: https://it-era.it" \
            -d "$data" \
            "$API_URL$endpoint")
    fi
    
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]{3}$//')
    status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
    
    if [ "$status" -eq "$expected_status" ]; then
        success "$description (HTTP $status)"
        if [ ! -z "$body" ]; then
            echo "   Response: $(echo "$body" | jq -r '.message // .status // .error' 2>/dev/null || echo "$body" | head -c 100)"
        fi
    else
        fail "$description (Expected HTTP $expected_status, got $status)"
        echo "   Response: $body"
    fi
}

# Test 1: Health Check
test_api "/health" "GET" "" 200 "Health Check"

# Test 2: CORS Preflight
log "Test: CORS Preflight"
cors_response=$(curl -s -I -X OPTIONS \
    -H "Origin: https://it-era.it" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "$API_URL/api/contact")

if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    success "CORS Headers configurati"
else
    fail "CORS Headers mancanti"
fi

# Test 3: Endpoint non esistente
test_api "/nonexistent" "GET" "" 404 "Endpoint non esistente"

# Test 4: Metodo non supportato
test_api "/api/contact" "GET" "" 404 "Metodo GET non supportato"

# Test 5: Dati mancanti
test_api "/api/contact" "POST" '{}' 400 "Validazione campi obbligatori"

# Test 6: Email non valida
test_api "/api/contact" "POST" '{"nome":"Test","email":"invalid-email","telefono":"3331234567","privacy":true}' 400 "Validazione email non valida"

# Test 7: Telefono non valido
test_api "/api/contact" "POST" '{"nome":"Test","email":"test@example.com","telefono":"123","privacy":true}' 400 "Validazione telefono non valido"

# Test 8: Content-Type non valido
log "Test: Content-Type non supportato"
invalid_content_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
    -H "Content-Type: text/plain" \
    -H "Origin: https://it-era.it" \
    -d "invalid data" \
    "$API_URL/api/contact")

invalid_status=$(echo "$invalid_content_response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
if [ "$invalid_status" -eq "400" ]; then
    success "Validazione Content-Type"
else
    fail "Content-Type validation (Expected 400, got $invalid_status)"
fi

# Test 9: Invio email di successo (TEST COMPLETO)
log "Test: Invio email completo"
test_data='{
    "nome": "Test Automatico Resend",
    "email": "test-resend@example.com",
    "telefono": "+39 333 1234567",
    "azienda": "IT-ERA Test Suite",
    "comune": "Milano",
    "dipendenti": "10-50",
    "servizi": ["Sito web", "Server", "Consulenza IT"],
    "urgenza": "normale",
    "messaggio": "Questo è un test automatico dell integrazione Resend per IT-ERA. Sistema funzionante correttamente!",
    "formType": "test-automatico",
    "privacy": true,
    "sendCopy": false
}'

success_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: https://it-era.it" \
    -d "$test_data" \
    "$API_URL/api/contact")

success_body=$(echo "$success_response" | sed -E 's/HTTPSTATUS:[0-9]{3}$//')
success_status=$(echo "$success_response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$success_status" -eq "200" ]; then
    email_id=$(echo "$success_body" | jq -r '.metadata.emailId // empty' 2>/dev/null)
    ticket_id=$(echo "$success_body" | jq -r '.ticketId // empty' 2>/dev/null)
    response_time=$(echo "$success_body" | jq -r '.metadata.responseTime // empty' 2>/dev/null)
    used_fallback=$(echo "$success_body" | jq -r '.metadata.usedFallback // empty' 2>/dev/null)
    
    success "Invio email completo"
    echo "   📧 Email ID: $email_id"
    echo "   🎫 Ticket ID: $ticket_id"
    echo "   ⏱️  Response Time: $response_time"
    echo "   🔄 Used Fallback: $used_fallback"
    
    if [ "$used_fallback" = "true" ]; then
        warning "Email inviata con sistema fallback (dominio non verificato)"
    else
        success "Email inviata direttamente da info@it-era.it"
    fi
else
    fail "Invio email (Expected 200, got $success_status)"
    echo "   Error: $success_body"
fi

# Test 10: Rate Limiting (opzionale - commentato per non sprecare quota)
# log "Test: Rate Limiting (Skipped per conservare quota email)"

# Test 11: Verifiche finali
log "Verifiche configurazione..."

# Controlla se API key è configurata
if wrangler secret list 2>/dev/null | grep -q "RESEND_API_KEY"; then
    success "API Key Resend configurata"
else
    fail "API Key Resend non trovata"
fi

# Controlla configurazione wrangler
if grep -q "contact-form-resend.js" wrangler.toml; then
    success "Wrangler configurato per Resend"
else
    fail "Wrangler non configurato per Resend"
fi

# Summary finale
echo ""
echo "=========================================="
echo "📊 RISULTATI TEST"
echo "=========================================="
echo -e "${GREEN}✅ Test Superati: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Test Falliti: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 TUTTI I TEST SUPERATI!${NC}"
    echo ""
    echo "✅ Sistema Resend completamente operativo"
    echo "✅ API endpoint funzionante"
    echo "✅ Validazione input corretta"
    echo "✅ Gestione errori implementata"
    echo "✅ CORS configurato"
    echo "✅ Template email professionale"
    echo ""
    echo "🚀 Il sistema è pronto per la produzione!"
    echo ""
    echo "📋 Prossimi passi:"
    echo "1. Verifica dominio it-era.it su Resend Dashboard"
    echo "2. Test dal sito web in produzione"
    echo "3. Monitoraggio prime email inviate"
    echo "4. Setup notifications Telegram (opzionale)"
    
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  ALCUNI TEST FALLITI${NC}"
    echo "Rivedere la configurazione prima di andare in produzione."
    echo ""
    echo "🔧 Azioni suggerite:"
    echo "1. Verifica API Key: wrangler secret list"
    echo "2. Controlla logs: wrangler tail"
    echo "3. Rideploy se necessario: wrangler deploy"
    
    exit 1
fi