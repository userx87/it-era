#!/bin/bash
# IT-ERA GA4 Integration Cron Setup Script
# Sets up daily cron job for automated GA4 integration

SCRIPT_DIR="/Users/andreapanzeri/progetti/IT-ERA/scripts"
PHP_SCRIPT="$SCRIPT_DIR/cron-ga4-integrator.php"
LOG_DIR="/Users/andreapanzeri/progetti/IT-ERA/logs"

echo "🚀 IT-ERA GA4 Cron Job Setup"
echo "==============================="

# Create logs directory if it doesn't exist
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    echo "✅ Created logs directory: $LOG_DIR"
fi

# Make PHP script executable
chmod +x "$PHP_SCRIPT"
echo "✅ Made PHP script executable"

# Check if PHP is available
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed or not in PATH"
    exit 1
fi

# Test script execution
echo "🧪 Testing script execution..."
php "$PHP_SCRIPT" --test
if [ $? -eq 0 ]; then
    echo "✅ Script test successful"
else
    echo "❌ Script test failed"
    exit 1
fi

# Create cron job (runs daily at 2 AM)
CRON_JOB="0 2 * * * /usr/bin/php $PHP_SCRIPT >> $LOG_DIR/cron-ga4.log 2>&1"

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo "📅 Schedule: Daily at 2:00 AM"
echo "📄 Log file: $LOG_DIR/cron-ga4.log"

echo ""
echo "🔧 To manage the cron job:"
echo "  View cron jobs:    crontab -l"
echo "  Edit cron jobs:    crontab -e" 
echo "  Remove all jobs:   crontab -r"

echo ""
echo "📊 Manual execution:"
echo "  Test run:          php $PHP_SCRIPT"
echo "  View logs:         tail -f $LOG_DIR/ga4-integration.log"

echo ""
echo "🎯 GA4 Integration Cron Job Setup Complete!"