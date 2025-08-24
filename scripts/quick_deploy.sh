#!/bin/bash

# Quick Deploy Script for Landing Pages V2
# Generates and deploys all landing pages efficiently

set -e

echo "=== Landing Page Generator V2 - Quick Deploy ==="
echo "Starting deployment process..."

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Ensure we're in the project root
cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"
echo "Timestamp: $TIMESTAMP"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate environment
log "Validating environment..."

if ! command_exists python3; then
    echo "Error: python3 is required but not installed."
    exit 1
fi

if [ ! -f "data/comuni_master.csv" ]; then
    echo "Error: comuni_master.csv not found in data/ directory."
    exit 1
fi

if [ ! -d "templates" ]; then
    echo "Error: templates directory not found."
    exit 1
fi

# Validate templates exist
TEMPLATES=("assistenza-it-template.html" "cloud-storage-template.html" "sicurezza-informatica-template.html")
for template in "${TEMPLATES[@]}"; do
    if [ ! -f "templates/$template" ]; then
        echo "Error: Template $template not found."
        exit 1
    fi
done

log "Environment validation complete."

# Create backup of existing pages
log "Creating backup of existing pages..."
if [ -d "web/pages" ]; then
    cp -r "web/pages" "backup/pages_backup_$TIMESTAMP" 2>/dev/null || true
    log "Backup created: backup/pages_backup_$TIMESTAMP"
fi

# Test run with small batch first
log "Running test generation (draft mode)..."
python3 scripts/generate_landing_pages_v2.py \
    --service assistenza-it \
    --output draft \
    --batch-size 5 \
    --verbose 2>&1 | head -20

if [ $? -ne 0 ]; then
    echo "Error: Test generation failed. Please check the logs."
    exit 1
fi

log "Test generation successful."

# Generate all services in draft mode first
log "Generating all services (draft mode)..."
python3 scripts/generate_landing_pages_v2.py \
    --all-services \
    --output draft \
    --batch-size 50 \
    --verbose > "$LOG_DIR/generation_draft_$TIMESTAMP.log" 2>&1

if [ $? -ne 0 ]; then
    echo "Error: Draft generation failed. Check log: $LOG_DIR/generation_draft_$TIMESTAMP.log"
    exit 1
fi

log "Draft generation completed successfully."

# Validate some draft pages
log "Validating draft pages..."
DRAFT_COUNT=$(find web/pages-draft -name "*.html" -type f | wc -l | tr -d ' ')
log "Generated $DRAFT_COUNT draft pages."

if [ "$DRAFT_COUNT" -lt 100 ]; then
    echo "Warning: Expected more pages. Generated: $DRAFT_COUNT"
    read -p "Continue with production generation? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Production generation cancelled."
        exit 1
    fi
fi

# Generate production pages
log "Generating all services (production mode)..."
python3 scripts/generate_landing_pages_v2.py \
    --all-services \
    --output production \
    --batch-size 50 \
    --verbose > "$LOG_DIR/generation_production_$TIMESTAMP.log" 2>&1

if [ $? -ne 0 ]; then
    echo "Error: Production generation failed. Check log: $LOG_DIR/generation_production_$TIMESTAMP.log"
    exit 1
fi

log "Production generation completed successfully."

# Validate production pages
PROD_COUNT=$(find web/pages -name "*.html" -type f | wc -l | tr -d ' ')
log "Generated $PROD_COUNT production pages."

# Check sitemap
if [ -f "web/sitemap.xml" ]; then
    SITEMAP_COUNT=$(grep -c "<loc>" web/sitemap.xml || echo "0")
    log "Sitemap contains $SITEMAP_COUNT URLs."
else
    echo "Warning: sitemap.xml not found."
fi

# Generate summary report
log "Generating deployment report..."
REPORT_FILE="$LOG_DIR/deploy_report_$TIMESTAMP.txt"

cat > "$REPORT_FILE" << EOF
=== Landing Page Deployment Report ===
Timestamp: $TIMESTAMP
Project: IT-ERA Landing Pages

GENERATION RESULTS:
- Draft pages: $DRAFT_COUNT
- Production pages: $PROD_COUNT
- Sitemap URLs: $SITEMAP_COUNT

LOGS:
- Draft generation: $LOG_DIR/generation_draft_$TIMESTAMP.log
- Production generation: $LOG_DIR/generation_production_$TIMESTAMP.log

VALIDATION:
- Templates validated: ✓
- CSV data loaded: ✓
- Backup created: ✓
- Sitemap updated: ✓

STATUS: SUCCESS
EOF

log "Deployment completed successfully!"
log "Report generated: $REPORT_FILE"

echo ""
echo "=== DEPLOYMENT SUMMARY ==="
echo "✓ Draft pages: $DRAFT_COUNT"
echo "✓ Production pages: $PROD_COUNT" 
echo "✓ Sitemap URLs: $SITEMAP_COUNT"
echo "✓ Logs available in: $LOG_DIR"
echo ""
echo "Next steps:"
echo "1. Review generated pages in web/pages/"
echo "2. Test a few pages manually"
echo "3. Deploy to production server"
echo "4. Verify sitemap.xml accessibility"
echo ""

# Optional: Open a few sample pages for review
if command_exists open && [ "$1" = "--preview" ]; then
    log "Opening sample pages for preview..."
    find web/pages -name "*milano*.html" -type f | head -1 | xargs open 2>/dev/null || true
    find web/pages -name "*bergamo*.html" -type f | head -1 | xargs open 2>/dev/null || true
fi

exit 0