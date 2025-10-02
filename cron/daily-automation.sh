#!/bin/bash

# IT-ERA Daily Automation Script
# Esegue tutti i task automatici giornalieri
# Schedulato per esecuzione alle 9:00 AM

echo "=================================================="
echo "🤖 IT-ERA Daily Automation - $(date)"
echo "=================================================="

# Cambia alla directory del progetto
cd /Users/andreapanzeri/progetti/IT-ERA

# 1. SEO Daily Tasks
echo ""
echo "📊 Running SEO optimization tasks..."
node scripts/seo-daily-cron.js

# 2. Blog Article Generation
echo ""
echo "📝 Generating new blog article..."
cd blog
node seo-blog-generator.js
cd ..

# 3. Sitemap Update
echo ""
echo "🗺️ Updating sitemap..."
node generate-sitemap.js

# 4. Performance Check
echo ""
echo "⚡ Running performance checks..."
if [ -f "scripts/performance-check.js" ]; then
    node scripts/performance-check.js
fi

# 5. Backup
echo ""
echo "💾 Creating daily backup..."
DATE=$(date +%Y%m%d)
mkdir -p backups
tar -czf backups/daily-backup-$DATE.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=backups \
    .

# 6. Send Report Email
echo ""
echo "📧 Sending daily report to info@bulltech.it..."
node scripts/send-daily-report.js 2>/dev/null || echo "Report script not found, skipping..."

echo ""
echo "=================================================="
echo "✅ Daily automation completed at $(date)"
echo "=================================================="

# Log completion
echo "$(date): Daily automation completed" >> logs/cron.log