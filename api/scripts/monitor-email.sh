#!/bin/bash

# 📊 Script di Monitoring Sistema Email IT-ERA
# Monitora in tempo reale lo stato del sistema email

set -e

# Colori output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurazione
API_URL="https://it-era-email.bulltech.workers.dev"
CHECK_INTERVAL=30 # secondi tra i check
LOG_FILE="/tmp/it-era-email-monitor.log"

# Contatori
TOTAL_CHECKS=0
SUCCESSFUL_CHECKS=0
FAILED_CHECKS=0
EMAILS_SENT=0

clear

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        📊 IT-ERA Email System Monitor v1.0            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}[INFO]${NC} Avvio monitoring sistema email..."
echo -e "${BLUE}[INFO]${NC} API: $API_URL"
echo -e "${BLUE}[INFO]${NC} Check interval: ${CHECK_INTERVAL}s"
echo -e "${BLUE}[INFO]${NC} Log file: $LOG_FILE"
echo ""

# Funzione per check health
check_health() {
    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_URL/health" 2>/dev/null)
    local body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]{3}$//')
    local status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
    
    if [ "$status" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Funzione per ottenere metriche
get_metrics() {
    # Simula recupero metriche (in produzione, leggerebbe da KV o database)
    echo "$(date +%s)"
}

# Funzione per formattare uptime
format_uptime() {
    local seconds=$1
    local days=$((seconds / 86400))
    local hours=$(((seconds % 86400) / 3600))
    local minutes=$(((seconds % 3600) / 60))
    local secs=$((seconds % 60))
    
    if [ $days -gt 0 ]; then
        echo "${days}d ${hours}h ${minutes}m ${secs}s"
    elif [ $hours -gt 0 ]; then
        echo "${hours}h ${minutes}m ${secs}s"
    elif [ $minutes -gt 0 ]; then
        echo "${minutes}m ${secs}s"
    else
        echo "${secs}s"
    fi
}

# Funzione per visualizzare dashboard
show_dashboard() {
    local uptime_percent=0
    if [ $TOTAL_CHECKS -gt 0 ]; then
        uptime_percent=$((SUCCESSFUL_CHECKS * 100 / TOTAL_CHECKS))
    fi
    
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║        📊 IT-ERA Email System Monitor v1.0            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Status
    if [ "$LAST_CHECK_STATUS" = "UP" ]; then
        echo -e "🟢 Status: ${GREEN}ONLINE${NC}"
    else
        echo -e "🔴 Status: ${RED}OFFLINE${NC}"
    fi
    
    # Timestamp
    echo -e "🕐 Last Check: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Statistiche
    echo -e "${BLUE}═══ STATISTICHE ═══${NC}"
    echo -e "Total Checks:     $TOTAL_CHECKS"
    echo -e "Successful:       ${GREEN}$SUCCESSFUL_CHECKS${NC}"
    echo -e "Failed:          ${RED}$FAILED_CHECKS${NC}"
    echo -e "Uptime:          ${uptime_percent}%"
    echo -e "Running Time:    $(format_uptime $ELAPSED_TIME)"
    echo ""
    
    # Performance
    if [ ! -z "$LAST_RESPONSE_TIME" ]; then
        echo -e "${BLUE}═══ PERFORMANCE ═══${NC}"
        echo -e "Response Time:   ${LAST_RESPONSE_TIME}ms"
        echo -e "Avg Response:    ${AVG_RESPONSE_TIME}ms"
        echo ""
    fi
    
    # Limiti
    echo -e "${BLUE}═══ LIMITI GIORNALIERI ═══${NC}"
    echo -e "Email inviate:   $EMAILS_SENT / 95"
    echo -e "Rimanenti:       $((95 - EMAILS_SENT))"
    
    local percent_used=$((EMAILS_SENT * 100 / 95))
    echo -n "Utilizzo:        ["
    
    # Progress bar
    local bar_width=30
    local filled=$((percent_used * bar_width / 100))
    local empty=$((bar_width - filled))
    
    for ((i=0; i<filled; i++)); do echo -n "█"; done
    for ((i=0; i<empty; i++)); do echo -n "░"; done
    echo "] ${percent_used}%"
    echo ""
    
    # Alerts
    if [ $FAILED_CHECKS -gt 5 ]; then
        echo -e "${RED}⚠️  ALERT: Sistema instabile - $FAILED_CHECKS fallimenti${NC}"
    fi
    
    if [ $EMAILS_SENT -gt 85 ]; then
        echo -e "${YELLOW}⚠️  WARNING: Vicino al limite giornaliero (${EMAILS_SENT}/95)${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}[Premi Ctrl+C per uscire]${NC}"
}

# Funzione per test email
send_test_email() {
    echo -e "\n${BLUE}[TEST]${NC} Invio email di test..."
    
    local test_data='{
        "nome": "Monitor Test",
        "email": "monitor@it-era.it",
        "telefono": "039 888 2041",
        "messaggio": "Test automatico dal sistema di monitoring",
        "privacy": true,
        "formType": "monitoring-test"
    }'
    
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: https://it-era.it" \
        -d "$test_data" \
        "$API_URL/api/contact" 2>/dev/null)
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Email di test inviata con successo${NC}"
        local ticket=$(echo "$response" | grep -o '"ticketId":"[^"]*"' | cut -d'"' -f4)
        echo -e "${BLUE}[INFO]${NC} Ticket: $ticket"
        ((EMAILS_SENT++))
    else
        echo -e "${RED}❌ Errore invio email di test${NC}"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    fi
}

# Main monitoring loop
START_TIME=$(date +%s)
TOTAL_RESPONSE_TIME=0
AVG_RESPONSE_TIME=0

# Trap per cleanup
trap 'echo -e "\n${YELLOW}[INFO]${NC} Arresto monitoring..."; exit 0' INT TERM

echo -e "${GREEN}[START]${NC} Monitoring avviato - $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Menu interattivo
echo -e "${CYAN}Comandi disponibili durante il monitoring:${NC}"
echo -e "  ${YELLOW}t${NC} - Invia email di test"
echo -e "  ${YELLOW}l${NC} - Mostra ultimi log"
echo -e "  ${YELLOW}r${NC} - Reset contatori"
echo -e "  ${YELLOW}q${NC} - Quit"
echo ""

while true; do
    # Calcola tempo trascorso
    CURRENT_TIME=$(date +%s)
    ELAPSED_TIME=$((CURRENT_TIME - START_TIME))
    
    # Esegui health check
    START_CHECK=$(date +%s%N)
    
    if check_health; then
        END_CHECK=$(date +%s%N)
        LAST_RESPONSE_TIME=$(((END_CHECK - START_CHECK) / 1000000))
        TOTAL_RESPONSE_TIME=$((TOTAL_RESPONSE_TIME + LAST_RESPONSE_TIME))
        
        ((SUCCESSFUL_CHECKS++))
        LAST_CHECK_STATUS="UP"
        
        echo "$(date '+%Y-%m-%d %H:%M:%S') - UP - ${LAST_RESPONSE_TIME}ms" >> "$LOG_FILE"
    else
        ((FAILED_CHECKS++))
        LAST_CHECK_STATUS="DOWN"
        
        echo "$(date '+%Y-%m-%d %H:%M:%S') - DOWN" >> "$LOG_FILE"
        
        # Alert su failure
        echo -e "\n${RED}⚠️  ALERT: Sistema email non risponde!${NC}"
        echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} Health check fallito"
    fi
    
    ((TOTAL_CHECKS++))
    
    # Calcola media response time
    if [ $SUCCESSFUL_CHECKS -gt 0 ]; then
        AVG_RESPONSE_TIME=$((TOTAL_RESPONSE_TIME / SUCCESSFUL_CHECKS))
    fi
    
    # Aggiorna dashboard
    show_dashboard
    
    # Check input utente (non-blocking)
    read -t $CHECK_INTERVAL -n 1 user_input || true
    
    case "$user_input" in
        t|T)
            send_test_email
            sleep 3
            ;;
        l|L)
            echo -e "\n${BLUE}═══ ULTIMI LOG ═══${NC}"
            tail -10 "$LOG_FILE"
            echo -e "\n${CYAN}[Premi invio per continuare]${NC}"
            read
            ;;
        r|R)
            echo -e "\n${YELLOW}[RESET]${NC} Reset contatori..."
            TOTAL_CHECKS=0
            SUCCESSFUL_CHECKS=0
            FAILED_CHECKS=0
            EMAILS_SENT=0
            START_TIME=$(date +%s)
            ;;
        q|Q)
            echo -e "\n${YELLOW}[EXIT]${NC} Arresto monitoring..."
            exit 0
            ;;
    esac
done