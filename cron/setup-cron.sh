#!/bin/bash

# Setup script per configurare cron job automatico
# Esegui questo script una volta per configurare l'automazione

echo "🔧 Setting up IT-ERA daily automation cron job..."

# Make scripts executable
chmod +x daily-automation.sh
chmod +x ../scripts/seo-daily-cron.js
chmod +x ../scripts/test-email-system.js
chmod +x ../blog/seo-blog-generator.js
chmod +x ../blog/automated-blog-system.js

# Create necessary directories
mkdir -p ../logs
mkdir -p ../backups
mkdir -p ../docs

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create cron job (runs daily at 9:00 AM)
CRON_CMD="0 9 * * * cd $SCRIPT_DIR && ./daily-automation.sh >> ../logs/cron.log 2>&1"

# Check if cron job already exists
crontab -l 2>/dev/null | grep -q "daily-automation.sh"
if [ $? -eq 0 ]; then
    echo "⚠️ Cron job already exists. Updating..."
    # Remove old cron job
    crontab -l 2>/dev/null | grep -v "daily-automation.sh" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo "✅ Cron job configured successfully!"
echo ""
echo "📅 Schedule: Daily at 9:00 AM"
echo "📁 Logs: logs/cron.log"
echo "💾 Backups: backups/"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To edit cron jobs: crontab -e"
echo "To remove cron job: crontab -l | grep -v 'daily-automation.sh' | crontab -"
echo ""
echo "🎯 Daily automation includes:"
echo "  1. SEO optimization and indexing"
echo "  2. Blog article generation"
echo "  3. Sitemap updates"
echo "  4. Performance monitoring"
echo "  5. Daily backups"
echo "  6. Email reports to info@bulltech.it"