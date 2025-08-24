#!/bin/bash

# IT-ERA SEO Automation - Cron Job Setup Script
# Creates automated SEO workflows for comprehensive site optimization

set -euo pipefail

# Configuration
PROJECT_ROOT="/var/www/it-era"
LOGS_DIR="/var/log/it-era-seo"
PHP_BIN=$(which php)
NODE_BIN=$(which node)
SITE_URL="https://it-era.pages.dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "${LOGS_DIR}/cron-setup.log"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') $1" >> "${LOGS_DIR}/cron-setup.log"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
    echo "[WARNING] $(date '+%Y-%m-%d %H:%M:%S') $1" >> "${LOGS_DIR}/cron-setup.log"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') $1" >> "${LOGS_DIR}/cron-setup.log"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if [[ ! -d "$PROJECT_ROOT" ]]; then
        error "Project root directory not found: $PROJECT_ROOT"
    fi
    
    if [[ -z "$PHP_BIN" ]]; then
        error "PHP not found. Please install PHP."
    fi
    
    if [[ -z "$NODE_BIN" ]]; then
        warn "Node.js not found. Some features may not work."
    fi
    
    # Create logs directory
    mkdir -p "$LOGS_DIR"
    chmod 755 "$LOGS_DIR"
    
    # Create SEO scripts directory if not exists
    mkdir -p "${PROJECT_ROOT}/scripts/seo"
    
    log "Prerequisites check completed"
}

# Create cron scripts
create_cron_scripts() {
    log "Creating SEO cron scripts..."
    
    # Daily sitemap generation script
    cat > "${PROJECT_ROOT}/scripts/seo/daily-sitemap.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

PROJECT_ROOT="/var/www/it-era"
LOGS_DIR="/var/log/it-era-seo"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

# Logging
exec 1> >(tee -a "${LOGS_DIR}/daily-sitemap.log")
exec 2>&1

echo "[$(date)] Starting daily sitemap generation..."

cd "$PROJECT_ROOT"

# Generate sitemap
if php scripts/generate_sitemap.php; then
    echo "[$(date)] Sitemap generated successfully"
    
    # Submit to search engines
    curl -s "https://www.google.com/ping?sitemap=https://it-era.pages.dev/sitemap.xml" || echo "Google ping failed"
    curl -s "https://www.bing.com/ping?sitemap=https://it-era.pages.dev/sitemap.xml" || echo "Bing ping failed"
    
    # Update RSS feeds if exists
    if [[ -f "scripts/generate_rss.php" ]]; then
        php scripts/generate_rss.php
    fi
    
    echo "[$(date)] Daily sitemap task completed successfully"
else
    echo "[$(date)] ERROR: Sitemap generation failed"
    exit 1
fi
EOF

    # Weekly SEO audit script
    cat > "${PROJECT_ROOT}/scripts/seo/weekly-audit.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

PROJECT_ROOT="/var/www/it-era"
LOGS_DIR="/var/log/it-era-seo"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
REPORT_DIR="${PROJECT_ROOT}/reports/seo"

# Logging
exec 1> >(tee -a "${LOGS_DIR}/weekly-audit.log")
exec 2>&1

echo "[$(date)] Starting weekly SEO audit..."

# Create reports directory
mkdir -p "$REPORT_DIR"

cd "$PROJECT_ROOT"

# Run SEO validation if exists
if [[ -f "scripts/validate_seo.py" ]]; then
    echo "[$(date)] Running SEO validation..."
    python3 scripts/validate_seo.py > "${REPORT_DIR}/seo-validation-${TIMESTAMP}.json"
fi

# Check broken links if tool exists
if command -v linkchecker >/dev/null 2>&1; then
    echo "[$(date)] Checking for broken links..."
    linkchecker --output=csv --file-output=csv:"${REPORT_DIR}/broken-links-${TIMESTAMP}.csv" https://it-era.pages.dev/ || true
fi

# Generate performance report
if [[ -f "scripts/performance_check.php" ]]; then
    echo "[$(date)] Running performance check..."
    php scripts/performance_check.php > "${REPORT_DIR}/performance-${TIMESTAMP}.json"
fi

# Send notification if configured
if [[ -f "scripts/send_notification.php" ]]; then
    php scripts/send_notification.php "Weekly SEO audit completed" "${REPORT_DIR}/seo-validation-${TIMESTAMP}.json"
fi

echo "[$(date)] Weekly SEO audit completed"
EOF

    # Hourly RSS update script
    cat > "${PROJECT_ROOT}/scripts/seo/hourly-rss.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

PROJECT_ROOT="/var/www/it-era"
LOGS_DIR="/var/log/it-era-seo"

# Logging
exec 1> >(tee -a "${LOGS_DIR}/hourly-rss.log")
exec 2>&1

echo "[$(date)] Starting hourly RSS update..."

cd "$PROJECT_ROOT"

# Update blog RSS if exists
if [[ -f "scripts/update_blog_rss.php" ]]; then
    if php scripts/update_blog_rss.php; then
        echo "[$(date)] Blog RSS updated successfully"
    else
        echo "[$(date)] ERROR: Blog RSS update failed"
        exit 1
    fi
else
    echo "[$(date)] Blog RSS script not found, skipping..."
fi

# Update news RSS if exists
if [[ -f "scripts/update_news_rss.php" ]]; then
    if php scripts/update_news_rss.php; then
        echo "[$(date)] News RSS updated successfully"
    else
        echo "[$(date)] ERROR: News RSS update failed"
    fi
fi

echo "[$(date)] Hourly RSS update completed"
EOF

    # Monthly comprehensive report script
    cat > "${PROJECT_ROOT}/scripts/seo/monthly-report.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

PROJECT_ROOT="/var/www/it-era"
LOGS_DIR="/var/log/it-era-seo"
REPORT_DIR="${PROJECT_ROOT}/reports/seo"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
MONTH=$(date '+%Y-%m')

# Logging
exec 1> >(tee -a "${LOGS_DIR}/monthly-report.log")
exec 2>&1

echo "[$(date)] Starting monthly comprehensive SEO report..."

# Create reports directory
mkdir -p "$REPORT_DIR/monthly"

cd "$PROJECT_ROOT"

# Comprehensive SEO analysis
echo "[$(date)] Running comprehensive SEO analysis..."

REPORT_FILE="${REPORT_DIR}/monthly/comprehensive-report-${MONTH}.html"

cat > "$REPORT_FILE" << HTML_START
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA - Report SEO Mensile ${MONTH}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #0056cc; color: white; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #0056cc; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .error { color: #dc3545; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>IT-ERA - Report SEO Mensile</h1>
        <p>Periodo: ${MONTH} | Generato: $(date)</p>
    </div>
HTML_START

# Add sitemap status
echo "    <div class=\"section\">" >> "$REPORT_FILE"
echo "        <h2>Stato Sitemap</h2>" >> "$REPORT_FILE"
if [[ -f "${PROJECT_ROOT}/web/sitemap.xml" ]]; then
    SITEMAP_SIZE=$(wc -l < "${PROJECT_ROOT}/web/sitemap.xml")
    echo "        <div class=\"metric success\">Sitemap: ${SITEMAP_SIZE} URLs</div>" >> "$REPORT_FILE"
else
    echo "        <div class=\"metric error\">Sitemap: Non trovato</div>" >> "$REPORT_FILE"
fi
echo "    </div>" >> "$REPORT_FILE"

# Add pages count
echo "    <div class=\"section\">" >> "$REPORT_FILE"
echo "        <h2>Statistiche Pagine</h2>" >> "$REPORT_FILE"
if [[ -d "${PROJECT_ROOT}/web/pages" ]]; then
    PAGE_COUNT=$(find "${PROJECT_ROOT}/web/pages" -name "*.html" | wc -l)
    echo "        <div class=\"metric success\">Pagine totali: ${PAGE_COUNT}</div>" >> "$REPORT_FILE"
fi
if [[ -d "${PROJECT_ROOT}/web/pages-draft" ]]; then
    DRAFT_COUNT=$(find "${PROJECT_ROOT}/web/pages-draft" -name "*.html" | wc -l)
    echo "        <div class=\"metric warning\">Pagine draft: ${DRAFT_COUNT}</div>" >> "$REPORT_FILE"
fi
echo "    </div>" >> "$REPORT_FILE"

# Close HTML
echo "</body></html>" >> "$REPORT_FILE"

# Send report via email if configured
if [[ -f "scripts/send_email_report.php" ]]; then
    php scripts/send_email_report.php "$REPORT_FILE" "Report SEO Mensile IT-ERA - ${MONTH}"
fi

echo "[$(date)] Monthly comprehensive report completed: $REPORT_FILE"
EOF

    # Make all scripts executable
    chmod +x "${PROJECT_ROOT}/scripts/seo/"*.sh
    
    log "SEO cron scripts created successfully"
}

# Setup cron jobs
setup_cron_jobs() {
    log "Setting up cron jobs..."
    
    # Backup current crontab
    crontab -l > "${LOGS_DIR}/crontab-backup-$(date +%Y%m%d-%H%M%S).txt" 2>/dev/null || true
    
    # Create temporary crontab file
    TEMP_CRON=$(mktemp)
    
    # Keep existing cron jobs
    crontab -l 2>/dev/null > "$TEMP_CRON" || true
    
    # Add IT-ERA SEO jobs header
    echo "" >> "$TEMP_CRON"
    echo "# IT-ERA SEO Automation Jobs - Generated $(date)" >> "$TEMP_CRON"
    echo "# DO NOT EDIT MANUALLY - Use cron-setup.sh to modify" >> "$TEMP_CRON"
    
    # Daily sitemap generation (3:00 AM)
    echo "0 3 * * * ${PROJECT_ROOT}/scripts/seo/daily-sitemap.sh >/dev/null 2>&1" >> "$TEMP_CRON"
    
    # Weekly SEO audit (Sundays at 4:00 AM)
    echo "0 4 * * 0 ${PROJECT_ROOT}/scripts/seo/weekly-audit.sh >/dev/null 2>&1" >> "$TEMP_CRON"
    
    # Hourly RSS feed update (every hour at minute 15)
    echo "15 * * * * ${PROJECT_ROOT}/scripts/seo/hourly-rss.sh >/dev/null 2>&1" >> "$TEMP_CRON"
    
    # Monthly comprehensive report (1st of month at 5:00 AM)
    echo "0 5 1 * * ${PROJECT_ROOT}/scripts/seo/monthly-report.sh >/dev/null 2>&1" >> "$TEMP_CRON"
    
    # Daily log cleanup (keep last 30 days)
    echo "0 2 * * * find ${LOGS_DIR} -name '*.log' -mtime +30 -delete >/dev/null 2>&1" >> "$TEMP_CRON"
    
    # Install new crontab
    if crontab "$TEMP_CRON"; then
        log "Cron jobs installed successfully"
    else
        error "Failed to install cron jobs"
    fi
    
    # Cleanup
    rm "$TEMP_CRON"
    
    # Show installed cron jobs
    info "Installed IT-ERA SEO cron jobs:"
    crontab -l | grep -A 10 "IT-ERA SEO Automation"
}

# Create log rotation configuration
setup_log_rotation() {
    log "Setting up log rotation..."
    
    cat > "/etc/logrotate.d/it-era-seo" << EOF
${LOGS_DIR}/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        # Send USR1 signal to any running processes if needed
        /bin/true
    endscript
}
EOF

    log "Log rotation configured"
}

# Create monitoring script
create_monitoring() {
    log "Creating SEO monitoring script..."
    
    cat > "${PROJECT_ROOT}/scripts/seo/monitor-status.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

PROJECT_ROOT="/var/www/it-era"
LOGS_DIR="/var/log/it-era-seo"
STATUS_FILE="${PROJECT_ROOT}/reports/seo/monitor-status.json"

# Create status directory
mkdir -p "$(dirname "$STATUS_FILE")"

# Check last execution times
SITEMAP_LOG="${LOGS_DIR}/daily-sitemap.log"
AUDIT_LOG="${LOGS_DIR}/weekly-audit.log"
RSS_LOG="${LOGS_DIR}/hourly-rss.log"

# Generate status JSON
cat > "$STATUS_FILE" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "site_url": "https://it-era.pages.dev",
    "status": {
        "sitemap": {
            "last_run": "$(test -f "$SITEMAP_LOG" && tail -n 1 "$SITEMAP_LOG" | head -c 19 || echo "Never")",
            "status": "$(test -f "${PROJECT_ROOT}/web/sitemap.xml" && echo "OK" || echo "ERROR")"
        },
        "audit": {
            "last_run": "$(test -f "$AUDIT_LOG" && tail -n 1 "$AUDIT_LOG" | head -c 19 || echo "Never")",
            "reports_count": $(find "${PROJECT_ROOT}/reports/seo" -name "seo-validation-*.json" 2>/dev/null | wc -l)
        },
        "rss": {
            "last_run": "$(test -f "$RSS_LOG" && tail -n 1 "$RSS_LOG" | head -c 19 || echo "Never")",
            "status": "$(test -f "${PROJECT_ROOT}/web/rss.xml" && echo "OK" || echo "MISSING")"
        }
    },
    "metrics": {
        "total_pages": $(find "${PROJECT_ROOT}/web/pages" -name "*.html" 2>/dev/null | wc -l),
        "draft_pages": $(find "${PROJECT_ROOT}/web/pages-draft" -name "*.html" 2>/dev/null | wc -l),
        "log_size_mb": $(du -sm "$LOGS_DIR" 2>/dev/null | cut -f1)
    }
}
EOF

echo "Status updated: $STATUS_FILE"
EOF

    chmod +x "${PROJECT_ROOT}/scripts/seo/monitor-status.sh"
    
    # Add monitoring to crontab (every 5 minutes)
    TEMP_CRON=$(mktemp)
    crontab -l 2>/dev/null > "$TEMP_CRON" || true
    echo "*/5 * * * * ${PROJECT_ROOT}/scripts/seo/monitor-status.sh >/dev/null 2>&1" >> "$TEMP_CRON"
    crontab "$TEMP_CRON"
    rm "$TEMP_CRON"
    
    log "SEO monitoring configured"
}

# Main execution
main() {
    log "Starting IT-ERA SEO Automation Setup"
    
    check_prerequisites
    create_cron_scripts
    setup_cron_jobs
    setup_log_rotation
    create_monitoring
    
    log "IT-ERA SEO Automation setup completed successfully!"
    
    info "Summary of installed automation:"
    info "- Daily sitemap generation and submission (3:00 AM)"
    info "- Weekly SEO audit (Sunday 4:00 AM)"
    info "- Hourly RSS feed updates (:15 past each hour)"
    info "- Monthly comprehensive reports (1st of month 5:00 AM)"
    info "- Status monitoring (every 5 minutes)"
    info "- Log rotation (daily, keep 30 days)"
    
    info "Logs location: $LOGS_DIR"
    info "Reports location: ${PROJECT_ROOT}/reports/seo"
    
    warn "Remember to configure email notifications in send_notification.php"
    warn "Ensure all required PHP scripts exist in the scripts directory"
}

# Handle script arguments
case "${1:-help}" in
    "install")
        main
        ;;
    "remove")
        log "Removing IT-ERA SEO cron jobs..."
        TEMP_CRON=$(mktemp)
        crontab -l 2>/dev/null | grep -v "IT-ERA SEO" | grep -v "${PROJECT_ROOT}/scripts/seo" > "$TEMP_CRON" || true
        crontab "$TEMP_CRON"
        rm "$TEMP_CRON"
        log "IT-ERA SEO cron jobs removed"
        ;;
    "status")
        log "IT-ERA SEO Automation Status:"
        crontab -l | grep -A 10 "IT-ERA SEO" || info "No IT-ERA SEO jobs found"
        ;;
    "help"|*)
        echo "IT-ERA SEO Automation Setup"
        echo "Usage: $0 {install|remove|status|help}"
        echo ""
        echo "Commands:"
        echo "  install - Install all SEO automation cron jobs"
        echo "  remove  - Remove all IT-ERA SEO cron jobs"
        echo "  status  - Show current cron job status"
        echo "  help    - Show this help message"
        ;;
esac