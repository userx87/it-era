# IT-ERA SEO System

Comprehensive PHP SEO indexing and sitemap generation system for IT-ERA website optimization.

## 🚀 Features

- **Automated Sitemap Generation**: XML sitemaps with images, priorities, and change frequencies
- **Google Indexing API Integration**: Submit pages to Google for faster indexing
- **SEO Monitoring**: Performance monitoring, broken link checking, and health reports
- **Structured Data Generation**: Schema.org markup for improved search visibility
- **Meta Tags Optimization**: Auto-generation of titles, descriptions, Open Graph, and Twitter Cards
- **Cron Automation**: Scheduled tasks for daily, weekly, and monthly SEO maintenance

## 📁 File Structure

```
scripts/
├── seo-config.php                 # Main configuration file
├── seo-indexer.php                # Sitemap generation and indexing
├── google-indexing.php            # Google Indexing API integration
├── seo-monitor.php                # SEO monitoring and health checks
├── structured-data-generator.php   # Schema.org markup generation
├── meta-generator.php             # Meta tags generation
├── seo-cron.php                   # Cron master script
├── composer.json                  # Dependencies and scripts
├── logs/                          # Log files directory
└── reports/                       # SEO reports directory
```

## 🔧 Installation

1. **Install Dependencies**:
   ```bash
   cd scripts
   composer install
   ```

2. **Configure Google API** (Optional):
   ```bash
   # Add Google service account JSON file
   cp your-service-account.json google-service-account.json
   
   # Update seo-config.php with your API keys
   ```

3. **Set Permissions**:
   ```bash
   chmod +x *.php
   mkdir -p logs reports
   chmod 755 logs reports
   ```

## 🎯 Usage

### Individual Scripts

#### 1. Generate Sitemap
```bash
# Generate complete sitemap
php seo-indexer.php --sitemap-only --verbose

# Full indexing process
php seo-indexer.php --verbose
```

#### 2. Submit to Google
```bash
# Submit recent updates (last 7 days)
php google-indexing.php --recent=7 --verbose

# Submit entire sitemap
php google-indexing.php --sitemap --verbose

# Check indexing status
php google-indexing.php --status=https://it-era.pages.dev/pages/assistenza-it-milano.html
```

#### 3. SEO Monitoring
```bash
# Complete health check
php seo-monitor.php --check-all --verbose

# Performance check only
php seo-monitor.php --performance --verbose

# Check broken links
php seo-monitor.php --links --verbose
```

#### 4. Generate Structured Data
```bash
# Generate Schema markup for all pages
php structured-data-generator.php --generate-all --verbose

# Generate for specific page
php structured-data-generator.php --page=https://it-era.pages.dev/pages/assistenza-it-milano.html
```

#### 5. Generate Meta Tags
```bash
# Generate meta tags for all pages
php meta-generator.php --generate-all --verbose

# Generate for specific page
php meta-generator.php --page=/pages/assistenza-it-milano.html
```

### Composer Scripts

```bash
# Full SEO maintenance
composer run seo:full

# Daily tasks
composer run seo:daily

# Weekly tasks
composer run seo:weekly

# Monthly tasks
composer run seo:monthly

# Individual tasks
composer run sitemap
composer run meta
composer run schema
composer run monitor
```

## ⚙️ Cron Automation

### Recommended Cron Schedule

Add to your crontab (`crontab -e`):

```bash
# Daily SEO tasks (6:00 AM)
0 6 * * * cd /path/to/IT-ERA/scripts && php seo-cron.php --daily >> logs/cron.log 2>&1

# Weekly SEO tasks (Sunday 2:00 AM)
0 2 * * 0 cd /path/to/IT-ERA/scripts && php seo-cron.php --weekly >> logs/cron.log 2>&1

# Monthly SEO tasks (1st day 1:00 AM)
0 1 1 * * cd /path/to/IT-ERA/scripts && php seo-cron.php --monthly >> logs/cron.log 2>&1
```

### Manual Cron Execution

```bash
# Full maintenance (run once)
php seo-cron.php --full --verbose

# Daily tasks
php seo-cron.php --daily --verbose

# Weekly tasks
php seo-cron.php --weekly --verbose

# Monthly tasks
php seo-cron.php --monthly --verbose
```

## 📊 Configuration

Edit `seo-config.php` to customize:

```php
return [
    'site' => [
        'url' => 'https://it-era.pages.dev',
        'name' => 'IT-ERA - Assistenza Informatica Professionale',
        // ... other settings
    ],
    'google' => [
        'indexing_api_key' => 'your-api-key',
        'service_account_file' => '/scripts/google-service-account.json'
    ],
    // ... other configuration options
];
```

## 📈 Reports and Monitoring

### Generated Reports

- **SEO Health Reports**: `reports/seo-health-*.json`
- **Execution Reports**: `reports/cron-execution-*.json`
- **Weekly Reports**: `reports/weekly-report-*.json`
- **Monthly Reports**: `reports/monthly-report-*.json`

### Log Files

- **Main Logs**: `logs/seo-*.log`
- **Error Logs**: `logs/seo-*-errors.log`
- **Cron Logs**: `logs/seo-cron.log`

### Key Metrics Monitored

1. **Performance**:
   - Page load times
   - Site speed metrics
   - Core Web Vitals

2. **SEO Health**:
   - Missing meta tags
   - Duplicate content
   - Broken links
   - Schema markup coverage

3. **Indexing Status**:
   - Google submission success rate
   - Sitemap validation
   - Index coverage

## 🔍 Google Integration

### Setup Google Indexing API

1. **Create Google Cloud Project**
2. **Enable Indexing API**
3. **Create Service Account**
4. **Download JSON key file**
5. **Add domain to Search Console**
6. **Grant service account permissions**

### API Limits

- **Daily quota**: 200 requests
- **Rate limit**: 1 request per second
- **Batch support**: Yes (with delays)

## 🛠 Troubleshooting

### Common Issues

1. **Permission Errors**:
   ```bash
   chmod 755 scripts/*.php
   chmod 755 scripts/logs scripts/reports
   ```

2. **Missing Extensions**:
   ```bash
   # Install required PHP extensions
   sudo apt-get install php-dom php-xml php-json
   ```

3. **Google API Errors**:
   - Check service account permissions
   - Verify API quotas
   - Ensure domain is verified in Search Console

4. **Memory Issues**:
   ```bash
   # Increase PHP memory limit
   php -d memory_limit=512M seo-indexer.php --generate-all
   ```

### Debug Mode

Enable verbose output for debugging:

```bash
php seo-cron.php --daily --verbose
```

### Log Analysis

```bash
# Check recent errors
tail -f logs/seo-cron-errors.log

# Monitor execution
tail -f logs/seo-cron.log

# Check Google API usage
grep "SUBMISSION" logs/google-indexing.log | tail -20
```

## 📋 Maintenance Tasks

### Daily
- Update sitemap with recent changes
- Submit new/updated pages to Google
- Quick performance check

### Weekly
- Full meta tags review and update
- Comprehensive SEO health check
- Broken links analysis
- Generate weekly performance report

### Monthly
- Full structured data update
- Comprehensive SEO audit
- Clean old logs and reports
- Generate monthly trend analysis

## 🎯 Performance Optimization

The system includes several optimizations:

1. **Efficient File Processing**: Processes only changed files when possible
2. **Rate Limiting**: Respects Google API limits
3. **Batch Operations**: Groups related tasks for efficiency
4. **Caching**: Caches frequently accessed data
5. **Error Recovery**: Continues processing despite individual failures

## 📞 Support

For issues or questions:
- **Email**: info@it-era.it
- **Phone**: 039 888 2041
- **Address**: Viale Risorgimento 32, Vimercate MB

## 📝 License

This SEO system is proprietary software developed for IT-ERA.

---

**IT-ERA** - Professional IT Services in Lombardy