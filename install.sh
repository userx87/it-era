#!/bin/bash

# IT-ERA Installation Script
# Script di installazione automatica per il sistema IT-ERA

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variabili
IT_ERA_HOME="/Users/andreapanzeri/progetti/IT-ERA"
PYTHON_CMD="python3"
PIP_CMD="pip3"

# Funzioni utility
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"
}

# Banner
show_banner() {
    echo -e "${BLUE}"
    cat << "EOF"
 ___ _____      _____ ____      _    
|_ _|_   _|    | ____|  _ \    / \   
 | |  | |_____ |  _| | |_) |  / _ \  
 | |  | |_____|| |___|  _ <  / ___ \ 
|___| |_|     |_____|_| \_\/_/   \_\

Ecosistema di Automazione IT - Bulltech Informatica
EOF
    echo -e "${NC}"
}

# Verifica prerequisiti
check_prerequisites() {
    log "Controllo prerequisiti..."
    
    # Python 3
    if ! command -v $PYTHON_CMD &> /dev/null; then
        error "Python 3 non trovato. Installa Python 3.11+"
        exit 1
    fi
    
    python_version=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
    info "Python trovato: $python_version"
    
    # Pip
    if ! command -v $PIP_CMD &> /dev/null; then
        error "pip3 non trovato"
        exit 1
    fi
    
    # Git (opzionale)
    if command -v git &> /dev/null; then
        info "Git disponibile: $(git --version)"
    else
        warn "Git non trovato - alcune funzionalità potrebbero essere limitate"
    fi
    
    # SQLite
    if command -v sqlite3 &> /dev/null; then
        info "SQLite disponibile: $(sqlite3 --version)"
    else
        warn "SQLite3 non trovato - verrà usato il modulo Python"
    fi
    
    log "Prerequisiti verificati ✓"
}

# Installazione dipendenze Python
install_dependencies() {
    log "Installazione dipendenze Python..."
    
    cd "$IT_ERA_HOME"
    
    # Aggiorna pip
    $PIP_CMD install --upgrade pip
    
    # Installa dipendenze
    if [ -f requirements.txt ]; then
        $PIP_CMD install -r requirements.txt
        log "Dipendenze installate ✓"
    else
        error "File requirements.txt non trovato"
        exit 1
    fi
}

# Inizializzazione database
init_database() {
    log "Inizializzazione database..."
    
    cd "$IT_ERA_HOME"
    
    if [ -f database/init_db.py ]; then
        $PYTHON_CMD database/init_db.py
        
        if [ $? -eq 0 ]; then
            log "Database inizializzato ✓"
        else
            error "Errore inizializzazione database"
            exit 1
        fi
    else
        error "Script inizializzazione database non trovato"
        exit 1
    fi
}

# Configurazione permessi
setup_permissions() {
    log "Configurazione permessi..."
    
    cd "$IT_ERA_HOME"
    
    # Rendi eseguibili gli script
    chmod +x automations/sync/sync_manager.py
    chmod +x automations/backup/backup_manager.py
    chmod +x api/integrations.py
    chmod +x database/init_db.py
    chmod +x web/app.py
    
    # Crea directory se mancanti
    mkdir -p logs config/private backups
    
    # Permessi sicuri per config
    chmod 700 config/private
    
    if [ -f config/.backup_key ]; then
        chmod 600 config/.backup_key
    fi
    
    log "Permessi configurati ✓"
}

# Configurazione cronjob
setup_cron() {
    log "Configurazione cronjob..."
    
    # Crea file crontab temporaneo
    cat > /tmp/it-era-cron << EOF
# IT-ERA Automated Tasks
# Controllo orario
0 * * * * cd $IT_ERA_HOME && $PYTHON_CMD automations/sync/sync_manager.py hourly >> logs/cron.log 2>&1

# Sincronizzazione giornaliera alle 6:00
0 6 * * * cd $IT_ERA_HOME && $PYTHON_CMD automations/sync/sync_manager.py daily >> logs/cron.log 2>&1

# Report settimanale ogni lunedì alle 8:00
0 8 * * 1 cd $IT_ERA_HOME && $PYTHON_CMD automations/sync/sync_manager.py weekly >> logs/cron.log 2>&1

# Pulizia log ogni domenica alle 23:00
0 23 * * 0 cd $IT_ERA_HOME && $PYTHON_CMD config/logging_config.py cleanup >> logs/cron.log 2>&1
EOF
    
    # Chiedi se installare cronjob
    echo -e "${YELLOW}"
    read -p "Vuoi installare i cronjob automatici? [y/N]: " install_cron
    echo -e "${NC}"
    
    if [[ $install_cron =~ ^[Yy]$ ]]; then
        # Backup crontab esistente
        if crontab -l > /dev/null 2>&1; then
            crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S)
            log "Crontab esistente salvato in backup"
        fi
        
        # Aggiungi nuovi job
        (crontab -l 2>/dev/null; cat /tmp/it-era-cron) | crontab -
        log "Cronjob installati ✓"
        
        info "Cronjob configurati:"
        info "- Controllo orario ogni ora"
        info "- Sincronizzazione giornaliera alle 6:00"
        info "- Report settimanale lunedì alle 8:00"
    else
        info "Cronjob non installati - puoi configurarli manualmente usando:"
        info "cat /tmp/it-era-cron"
    fi
    
    rm -f /tmp/it-era-cron
}

# Test installazione
test_installation() {
    log "Test installazione..."
    
    cd "$IT_ERA_HOME"
    
    # Test database
    if $PYTHON_CMD -c "import sqlite3; sqlite3.connect('database/it_era.db').execute('SELECT 1')" 2>/dev/null; then
        log "✓ Database OK"
    else
        error "✗ Database non accessibile"
        return 1
    fi
    
    # Test logging
    if $PYTHON_CMD -c "from config.logging_config import setup_component_logger; setup_component_logger('test')" 2>/dev/null; then
        log "✓ Sistema logging OK"
    else
        warn "✗ Sistema logging con problemi"
    fi
    
    # Test web app (solo verifica import)
    if $PYTHON_CMD -c "from web.app import app; print('Web app OK')" 2>/dev/null; then
        log "✓ Web application OK"
    else
        warn "✗ Web application con problemi"
    fi
    
    log "Test completati ✓"
}

# Configurazione environment
setup_environment() {
    log "Configurazione environment..."
    
    cd "$IT_ERA_HOME"
    
    # Crea file .env di esempio se non esiste
    if [ ! -f config/.env ]; then
        cat > config/.env << EOF
# IT-ERA Environment Configuration

# Database
IT_ERA_DB_PATH=$IT_ERA_HOME/database/it_era.db

# Flask Web App
FLASK_ENV=development
FLASK_SECRET_KEY=change-this-in-production
PORT=5000

# Email Notifications
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_app_password

# API Keys (sostituisci con i tuoi)
HUBSPOT_API_TOKEN=your_hubspot_token
BITDEFENDER_API_KEY=your_bitdefender_key

# Dynamics 365
DYNAMICS_TENANT_ID=your_tenant_id
DYNAMICS_CLIENT_ID=your_client_id
DYNAMICS_CLIENT_SECRET=your_client_secret

# Wasabi/S3
WASABI_ENDPOINT=https://s3.wasabisys.com
WASABI_ACCESS_KEY=your_access_key
WASABI_SECRET_KEY=your_secret_key
WASABI_BUCKET=your_bucket_name

# Redis (se usato)
REDIS_PASSWORD=itera_redis_2024

# MySQL/MariaDB (se usato)
MYSQL_ROOT_PASSWORD=itera_root_2024
MYSQL_PASSWORD=itera_pass_2024
EOF
        
        log "File .env creato in config/.env"
        warn "IMPORTANTE: Modifica config/.env con le tue credenziali!"
    else
        info "File .env già esistente"
    fi
}

# Main installation
main() {
    show_banner
    
    log "Installazione IT-ERA in corso..."
    log "Directory: $IT_ERA_HOME"
    
    # Verifica directory
    if [ ! -d "$IT_ERA_HOME" ]; then
        error "Directory IT-ERA non trovata: $IT_ERA_HOME"
        exit 1
    fi
    
    cd "$IT_ERA_HOME"
    
    # Esegui installazione
    check_prerequisites
    install_dependencies
    setup_permissions
    setup_environment
    init_database
    test_installation
    setup_cron
    
    echo -e "${GREEN}"
    cat << "EOF"

 ✅ INSTALLAZIONE COMPLETATA CON SUCCESSO!

 Prossimi passi:
 1. Modifica config/.env con le tue credenziali API
 2. Avvia la web app: python3 web/app.py
 3. Apri http://localhost:5000
 4. Configura i tuoi primi backup e integrazioni

 Per supporto: support@bulltech.it
 
EOF
    echo -e "${NC}"
    
    # Mostra comandi utili
    info "Comandi utili:"
    echo "  cd $IT_ERA_HOME"
    echo "  python3 web/app.py                                    # Avvia web app"
    echo "  python3 automations/sync/sync_manager.py daily        # Sync manuale"
    echo "  python3 api/integrations.py sync-all                  # Sync CRM"
    echo "  python3 automations/backup/backup_manager.py list     # Lista backup"
    echo ""
    
    log "Installazione IT-ERA completata!"
}

# Verifica se eseguito come script principale
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
