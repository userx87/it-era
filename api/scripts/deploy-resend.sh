#!/bin/bash

# Deploy Script per IT-ERA API con Resend
# Script per deploy del worker Cloudflare con integrazione Resend

set -e

echo "🚀 Deploy IT-ERA API con Resend Integration"
echo "=========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verifica prerequisiti
log "Verifica prerequisiti..."

if ! command -v wrangler &> /dev/null; then
    error "Wrangler CLI non trovato. Installa con: npm install -g wrangler"
fi

if ! command -v jq &> /dev/null; then
    warning "jq non trovato. L'output JSON sarà meno leggibile."
fi

# Verifica autenticazione Cloudflare
log "Verifica autenticazione Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    error "Non sei autenticato con Cloudflare. Esegui: wrangler auth login"
fi

# Verifica configurazione
log "Verifica configurazione wrangler.toml..."
if [ ! -f "wrangler.toml" ]; then
    error "File wrangler.toml non trovato"
fi

# Backup del worker corrente (se necessario)
if [ "$1" == "--backup" ]; then
    log "Backup del worker corrente..."
    mkdir -p backups
    backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    wrangler deployment tail --name it-era-email > "backups/${backup_name}.log" 2>/dev/null || true
    success "Backup creato in backups/${backup_name}.log"
fi

# Configura secrets se non esistono
log "Configurazione secrets..."

# Lista dei secrets richiesti
secrets_needed=("RESEND_API_KEY")

for secret in "${secrets_needed[@]}"; do
    log "Verifica secret: $secret"
    
    case $secret in
        "RESEND_API_KEY")
            if [ -z "$RESEND_API_KEY" ]; then
                warning "RESEND_API_KEY non trovata nell'ambiente"
                read -p "Inserisci la tua Resend API Key (re_...): " api_key
                if [[ $api_key =~ ^re_[a-zA-Z0-9_]+$ ]]; then
                    echo "$api_key" | wrangler secret put RESEND_API_KEY
                    success "RESEND_API_KEY configurata"
                else
                    error "Formato API key non valido. Deve iniziare con 're_'"
                fi
            else
                echo "$RESEND_API_KEY" | wrangler secret put RESEND_API_KEY
                success "RESEND_API_KEY aggiornata dall'ambiente"
            fi
            ;;
    esac
done

# Opzionale: Configura Telegram se fornito
if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
    log "Configurazione notifiche Telegram..."
    echo "$TELEGRAM_BOT_TOKEN" | wrangler secret put TELEGRAM_BOT_TOKEN
    echo "$TELEGRAM_CHAT_ID" | wrangler secret put TELEGRAM_CHAT_ID
    success "Telegram configurato"
fi

# Test del worker prima del deploy
log "Test del codice..."
if ! node -c contact-form-resend.js; then
    error "Errori di sintassi nel codice JavaScript"
fi
success "Codice validato"

# Deploy del worker
log "Deploy del worker Cloudflare..."

# Aggiorna il main file in wrangler.toml
if grep -q 'main = "contact-form.js"' wrangler.toml; then
    log "Aggiornamento wrangler.toml per usare contact-form-resend.js..."
    sed -i '' 's/main = "contact-form.js"/main = "contact-form-resend.js"/' wrangler.toml
    success "wrangler.toml aggiornato"
fi

# Deploy production
wrangler deploy --env production

if [ $? -eq 0 ]; then
    success "Deploy completato con successo!"
else
    error "Deploy fallito"
fi

# Test del worker deployato
log "Test del worker deployato..."
worker_url="https://it-era-email.bulltech.workers.dev"

# Health check
log "Health check..."
health_response=$(curl -s "${worker_url}/health" || echo "ERROR")

if echo "$health_response" | grep -q '"status":"ok"'; then
    success "Worker online e funzionante"
    echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
else
    warning "Health check fallito. Risposta: $health_response"
fi

# Test CORS
log "Test CORS..."
cors_response=$(curl -s -I -X OPTIONS \
    -H "Origin: https://it-era.it" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "${worker_url}/api/contact" | head -1)

if echo "$cors_response" | grep -q "200"; then
    success "CORS configurato correttamente"
else
    warning "Problema con CORS: $cors_response"
fi

# Mostra informazioni finali
echo ""
echo "=========================================="
success "Deploy completato!"
echo ""
echo "📋 Informazioni Worker:"
echo "   URL: ${worker_url}"
echo "   API Endpoint: ${worker_url}/api/contact"
echo "   Health Check: ${worker_url}/health"
echo ""
echo "🔧 Prossimi passi:"
echo "   1. Verifica che il dominio it-era.it sia configurato su Resend"
echo "   2. Se il dominio non è verificato, le email saranno inviate da onboarding@resend.dev"
echo "   3. Testa l'invio di un form dal sito web"
echo "   4. Monitora i logs con: wrangler tail"
echo ""
echo "📊 Per monitorare:"
echo "   wrangler tail --env production"
echo ""
echo "🔍 Per rollback:"
echo "   git checkout HEAD~1 -- contact-form-resend.js && ./scripts/deploy-resend.sh"
echo ""

# Test opzionale con dati di esempio
if [ "$1" == "--test" ]; then
    log "Test con dati di esempio..."
    test_data='{
        "nome": "Test Deploy",
        "email": "test@example.com",
        "telefono": "1234567890",
        "messaggio": "Test automatico deploy script",
        "privacy": true,
        "formType": "test"
    }'
    
    test_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: https://it-era.it" \
        -d "$test_data" \
        "${worker_url}/api/contact")
    
    echo "Risposta test:"
    echo "$test_response" | jq '.' 2>/dev/null || echo "$test_response"
fi

success "Script completato!"