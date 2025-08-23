#!/bin/bash

# IT-ERA Docker Entrypoint Script
# Script di avvio per container IT-ERA

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== IT-ERA Container Starting ===${NC}"

# Funzione di logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Verifica environment
check_environment() {
    log "Controllo ambiente..."
    
    # Verifica Python
    if ! command -v python3 &> /dev/null; then
        error "Python3 non trovato"
        exit 1
    fi
    
    # Verifica directory necessarie
    local directories=("database" "logs" "config" "automations" "api" "web")
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            warning "Directory $dir non trovata, la creo..."
            mkdir -p "$dir"
        fi
    done
    
    log "Ambiente verificato"
}

# Inizializza database se necessario
init_database() {
    log "Controllo database..."
    
    if [ ! -f "database/it_era.db" ]; then
        log "Database non trovato, inizializzo..."
        python3 database/init_db.py
        
        if [ $? -eq 0 ]; then
            log "Database inizializzato con successo"
        else
            error "Errore inizializzazione database"
            exit 1
        fi
    else
        log "Database esistente trovato"
    fi
}

# Avvia cronjob per automazioni
setup_cron() {
    log "Configurazione cronjob..."
    
    # Crea crontab per automazioni
    cat > /tmp/it-era-cron << EOF
# IT-ERA Automated Tasks
# Controllo orario
0 * * * * cd $IT_ERA_HOME && python3 automations/sync/sync_manager.py hourly >> logs/cron.log 2>&1

# Sincronizzazione giornaliera alle 6:00
0 6 * * * cd $IT_ERA_HOME && python3 automations/sync/sync_manager.py daily >> logs/cron.log 2>&1

# Report settimanale ogni lunedì alle 8:00
0 8 * * 1 cd $IT_ERA_HOME && python3 automations/sync/sync_manager.py weekly >> logs/cron.log 2>&1

# Pulizia log ogni domenica alle 23:00
0 23 * * 0 cd $IT_ERA_HOME && python3 config/logging_config.py cleanup >> logs/cron.log 2>&1
EOF

    # Installa crontab (solo se non in modalità worker)
    if [ "$WORKER_MODE" != "true" ]; then
        crontab /tmp/it-era-cron
        log "Cronjob configurati"
    fi
}

# Funzione health check
health_check() {
    log "Controllo salute sistema..."
    
    # Test database
    if python3 -c "import sqlite3; sqlite3.connect('database/it_era.db').execute('SELECT 1')" 2>/dev/null; then
        log "✓ Database OK"
    else
        error "✗ Database non raggiungibile"
        return 1
    fi
    
    # Test logging
    if python3 -c "from config.logging_config import setup_component_logger; setup_component_logger('health')" 2>/dev/null; then
        log "✓ Logging OK"
    else
        warning "✗ Sistema logging con problemi"
    fi
    
    log "Health check completato"
    return 0
}

# Avvia servizio web Flask
start_web() {
    log "Avvio servizio web IT-ERA..."
    
    cd web
    export FLASK_APP=app.py
    export FLASK_ENV=${FLASK_ENV:-development}
    
    if [ "$FLASK_ENV" = "production" ]; then
        # Produzione: usa Gunicorn
        gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 120 app:app
    else
        # Development: usa Flask dev server
        python3 -m flask run --host=0.0.0.0 --port=5000
    fi
}

# Avvia worker background
start_worker() {
    log "Avvio worker IT-ERA..."
    
    # Avvia servizio di monitoraggio continuo
    while true; do
        python3 automations/sync/sync_manager.py hourly
        sleep 3600  # Attendi 1 ora
    done
}

# Avvia shell interattiva
start_shell() {
    log "Avvio shell IT-ERA..."
    exec /bin/bash
}

# Esegui comando personalizzato
run_command() {
    log "Esecuzione comando: $*"
    exec "$@"
}

# Main execution
main() {
    # Controlli preliminari
    check_environment
    init_database
    setup_cron
    
    # Health check
    if ! health_check; then
        error "Health check fallito"
        exit 1
    fi
    
    # Determina modalità di esecuzione
    case "${1:-web}" in
        "web")
            start_web
            ;;
        "worker")
            start_worker
            ;;
        "shell")
            start_shell
            ;;
        "health")
            health_check
            exit $?
            ;;
        "sync-daily")
            python3 automations/sync/sync_manager.py daily
            ;;
        "sync-hourly")
            python3 automations/sync/sync_manager.py hourly
            ;;
        *)
            run_command "$@"
            ;;
    esac
}

# Trap per gestire shutdown graceful
trap 'log "Ricevuto segnale di shutdown..."; exit 0' SIGTERM SIGINT

# Esegui main
main "$@"
