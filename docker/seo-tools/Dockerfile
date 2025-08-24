# IT-ERA SEO Tools Container
# Multi-stage build for optimized production image

FROM node:18-bullseye-slim as node-stage

# Install Node.js SEO tools
RUN npm install -g \
    lighthouse-ci@0.12.x \
    htmlhint@1.1.x \
    pa11y@6.2.x \
    sitemap-checker@1.1.x \
    broken-link-checker@0.7.x

FROM php:8.2-cli-bullseye as php-stage

# Install PHP extensions needed for SEO tools
RUN apt-get update && apt-get install -y \
    libxml2-dev \
    libcurl4-openssl-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-install \
    dom \
    curl \
    xml \
    zip \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

FROM python:3.11-slim-bullseye

# Metadata
LABEL maintainer="IT-ERA <info@it-era.it>"
LABEL description="SEO tools container for automated website optimization"
LABEL version="1.0.0"

# Environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Rome
ENV PATH="/opt/seo-tools/bin:${PATH}"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Basic utilities
    curl \
    wget \
    unzip \
    git \
    cron \
    supervisor \
    # Build tools
    build-essential \
    # XML/HTML processing
    libxml2-utils \
    xmlstarlet \
    # Image processing (for SEO analysis)
    imagemagick \
    # Network tools
    dnsutils \
    netcat-openbsd \
    # PHP runtime
    php8.1-cli \
    php8.1-xml \
    php8.1-curl \
    php8.1-zip \
    php8.1-mbstring \
    # Node.js (already in base image)
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    # Cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy Node.js tools from node-stage
COPY --from=node-stage /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=node-stage /usr/local/bin/lighthouse* /usr/local/bin/
COPY --from=node-stage /usr/local/bin/htmlhint /usr/local/bin/
COPY --from=node-stage /usr/local/bin/pa11y /usr/local/bin/
COPY --from=node-stage /usr/local/bin/sitemap-checker /usr/local/bin/
COPY --from=node-stage /usr/local/bin/blc /usr/local/bin/

# Copy PHP from php-stage
COPY --from=php-stage /usr/local/bin/php /usr/local/bin/php
COPY --from=php-stage /usr/local/bin/composer /usr/local/bin/composer

# Install Python SEO tools
RUN pip install --no-cache-dir \
    beautifulsoup4==4.12.2 \
    lxml==4.9.3 \
    requests==2.31.0 \
    validators==0.22.0 \
    selenium==4.15.0 \
    scrapy==2.11.0 \
    advertools==0.14.2 \
    yake==0.4.8 \
    nltk==3.8.1

# Create application directory structure
RUN mkdir -p /opt/seo-tools/{bin,config,scripts,logs,reports,data}

# Create non-root user for security
RUN useradd -r -u 1001 -m -c "SEO Tools User" -d /opt/seo-tools -s /bin/bash seouser \
    && chown -R seouser:seouser /opt/seo-tools

# Install additional SEO analysis tools
WORKDIR /opt/seo-tools

# Create SEO analysis scripts
COPY <<EOF /opt/seo-tools/scripts/seo_analyzer.py
#!/usr/bin/env python3
"""
Comprehensive SEO Analysis Tool for IT-ERA
Analyzes websites for SEO compliance and performance
"""

import sys
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import validators
import time
import subprocess
import os

class SEOAnalyzer:
    def __init__(self, base_url="https://it-era.pages.dev"):
        self.base_url = base_url
        self.results = {
            'url': base_url,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'score': 0,
            'issues': [],
            'warnings': [],
            'metrics': {}
        }
    
    def analyze_url(self, url):
        """Analyze a single URL for SEO compliance"""
        try:
            response = requests.get(url, timeout=30)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Title analysis
            title = soup.find('title')
            if not title:
                self.results['issues'].append(f"Missing title tag: {url}")
            elif len(title.get_text()) > 60:
                self.results['warnings'].append(f"Title too long (>60 chars): {url}")
            
            # Meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if not meta_desc:
                self.results['issues'].append(f"Missing meta description: {url}")
            elif len(meta_desc.get('content', '')) > 160:
                self.results['warnings'].append(f"Meta description too long: {url}")
            
            # H1 tags
            h1_tags = soup.find_all('h1')
            if not h1_tags:
                self.results['issues'].append(f"Missing H1 tag: {url}")
            elif len(h1_tags) > 1:
                self.results['warnings'].append(f"Multiple H1 tags: {url}")
            
            # Images without alt text
            images = soup.find_all('img')
            for img in images:
                if not img.get('alt'):
                    self.results['warnings'].append(f"Image missing alt text: {url}")
            
            # Calculate performance metrics
            self.results['metrics'][url] = {
                'response_time': response.elapsed.total_seconds(),
                'content_size': len(response.content),
                'status_code': response.status_code
            }
            
        except Exception as e:
            self.results['issues'].append(f"Analysis error for {url}: {str(e)}")
    
    def calculate_score(self):
        """Calculate overall SEO score"""
        base_score = 100
        penalty = len(self.results['issues']) * 10 + len(self.results['warnings']) * 2
        self.results['score'] = max(0, base_score - penalty)
        return self.results['score']
    
    def generate_report(self):
        """Generate comprehensive SEO report"""
        self.calculate_score()
        return self.results

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "https://it-era.pages.dev"
    analyzer = SEOAnalyzer()
    analyzer.analyze_url(url)
    
    report = analyzer.generate_report()
    print(json.dumps(report, indent=2))
EOF

# Create lighthouse runner script
COPY <<EOF /opt/seo-tools/scripts/lighthouse_runner.sh
#!/bin/bash
# Lighthouse Performance Analysis Runner

set -euo pipefail

URL="\${1:-https://it-era.pages.dev}"
OUTPUT_DIR="/opt/seo-tools/reports/lighthouse"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")

mkdir -p "\$OUTPUT_DIR"

echo "Running Lighthouse analysis for: \$URL"

# Run Lighthouse with comprehensive audits
lighthouse "\$URL" \
    --output=html \
    --output=json \
    --output-path="\$OUTPUT_DIR/lighthouse-\$TIMESTAMP" \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --throttling-method=simulate \
    --form-factor=desktop \
    --quiet

echo "Lighthouse report generated: \$OUTPUT_DIR/lighthouse-\$TIMESTAMP.html"

# Extract key metrics
SCORE=\$(cat "\$OUTPUT_DIR/lighthouse-\$TIMESTAMP.report.json" | jq '.categories.performance.score * 100')
echo "Performance Score: \$SCORE"

# Return score for automation
exit 0
EOF

# Create comprehensive SEO audit script
COPY <<EOF /opt/seo-tools/scripts/comprehensive_audit.sh
#!/bin/bash
# Comprehensive SEO Audit Script for IT-ERA

set -euo pipefail

SITE_URL="\${1:-https://it-era.pages.dev}"
OUTPUT_DIR="/opt/seo-tools/reports/audit"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")

mkdir -p "\$OUTPUT_DIR"

echo "Starting comprehensive SEO audit for: \$SITE_URL"

# 1. Basic SEO Analysis
echo "1. Running basic SEO analysis..."
python3 /opt/seo-tools/scripts/seo_analyzer.py "\$SITE_URL" > "\$OUTPUT_DIR/seo-analysis-\$TIMESTAMP.json"

# 2. HTML Validation
echo "2. Checking HTML structure..."
htmlhint --config /opt/seo-tools/config/htmlhint.json "\$SITE_URL" > "\$OUTPUT_DIR/html-validation-\$TIMESTAMP.txt" || true

# 3. Accessibility Check
echo "3. Running accessibility audit..."
pa11y "\$SITE_URL" --reporter json > "\$OUTPUT_DIR/accessibility-\$TIMESTAMP.json" || true

# 4. Performance Analysis
echo "4. Running performance analysis..."
bash /opt/seo-tools/scripts/lighthouse_runner.sh "\$SITE_URL"

# 5. Sitemap Check
echo "5. Checking sitemap..."
if curl -f -s "\$SITE_URL/sitemap.xml" > /tmp/sitemap.xml; then
    xmllint --noout /tmp/sitemap.xml && echo "Sitemap is valid XML" || echo "Sitemap XML validation failed"
    echo "Sitemap URLs count: \$(grep -c '<url>' /tmp/sitemap.xml)"
else
    echo "Sitemap not found or inaccessible"
fi

# 6. Broken Links Check (limited to prevent long runtime)
echo "6. Checking for broken links (limited scan)..."
blc "\$SITE_URL" --recursive --filter-level 1 --max-sockets 10 > "\$OUTPUT_DIR/broken-links-\$TIMESTAMP.txt" || true

# Generate summary report
echo "7. Generating summary report..."
cat > "\$OUTPUT_DIR/audit-summary-\$TIMESTAMP.json" << SUMMARY
{
    "timestamp": "\$(date -Iseconds)",
    "site_url": "\$SITE_URL",
    "audit_files": {
        "seo_analysis": "seo-analysis-\$TIMESTAMP.json",
        "html_validation": "html-validation-\$TIMESTAMP.txt",
        "accessibility": "accessibility-\$TIMESTAMP.json",
        "broken_links": "broken-links-\$TIMESTAMP.txt"
    },
    "status": "completed"
}
SUMMARY

echo "Comprehensive SEO audit completed!"
echo "Reports saved in: \$OUTPUT_DIR"
EOF

# Create monitoring script
COPY <<EOF /opt/seo-tools/scripts/monitor_seo.sh
#!/bin/bash
# SEO Monitoring Script

set -euo pipefail

SITE_URL="\${1:-https://it-era.pages.dev}"
METRICS_FILE="/opt/seo-tools/data/monitoring-metrics.json"

# Ensure data directory exists
mkdir -p /opt/seo-tools/data

# Check site availability
START_TIME=\$(date +%s%3N)
HTTP_CODE=\$(curl -o /dev/null -s -w "%{http_code}" "\$SITE_URL" || echo "000")
END_TIME=\$(date +%s%3N)
RESPONSE_TIME=\$((END_TIME - START_TIME))

# Check sitemap
SITEMAP_STATUS="error"
if curl -f -s "\$SITE_URL/sitemap.xml" > /dev/null 2>&1; then
    SITEMAP_STATUS="ok"
fi

# Generate metrics
cat > "\$METRICS_FILE" << METRICS
{
    "timestamp": "\$(date -Iseconds)",
    "site_url": "\$SITE_URL",
    "metrics": {
        "response_time_ms": \$RESPONSE_TIME,
        "http_status": "\$HTTP_CODE",
        "sitemap_status": "\$SITEMAP_STATUS",
        "availability": "\$([ "\$HTTP_CODE" = "200" ] && echo "up" || echo "down")"
    }
}
METRICS

echo "SEO monitoring completed. Status: \$HTTP_CODE, Response time: \${RESPONSE_TIME}ms"
EOF

# Create configuration files
RUN mkdir -p /opt/seo-tools/config

# HTMLHint configuration
COPY <<EOF /opt/seo-tools/config/htmlhint.json
{
  "doctype-first": true,
  "doctype-html5": true,
  "title-require": true,
  "alt-require": true,
  "attr-lowercase": true,
  "attr-no-duplication": true,
  "attr-unsafe-chars": true,
  "attr-value-double-quotes": true,
  "attr-value-not-empty": false,
  "tag-pair": true,
  "tag-self-close": false,
  "tagname-lowercase": true,
  "empty-tag-not-self-closed": true,
  "src-not-empty": true,
  "head-script-disabled": true,
  "img-alt-require": true,
  "spec-char-escape": true,
  "id-unique": true,
  "inline-style-disabled": false,
  "inline-script-disabled": false,
  "space-tab-mixed-disabled": "space",
  "id-class-ad-disabled": true,
  "href-abs-or-rel": false,
  "attr-banned": false
}
EOF

# Supervisor configuration for scheduled tasks
COPY <<EOF /etc/supervisor/conf.d/seo-tools.conf
[program:seo-cron]
command=crond -f
autostart=true
autorestart=true
user=root
stdout_logfile=/opt/seo-tools/logs/cron.log
stderr_logfile=/opt/seo-tools/logs/cron.error.log

[program:seo-monitor]
command=bash -c 'while true; do /opt/seo-tools/scripts/monitor_seo.sh; sleep 300; done'
autostart=true
autorestart=true
user=seouser
stdout_logfile=/opt/seo-tools/logs/monitor.log
stderr_logfile=/opt/seo-tools/logs/monitor.error.log
EOF

# Make scripts executable
RUN chmod +x /opt/seo-tools/scripts/*.sh \
    && chmod +x /opt/seo-tools/scripts/*.py

# Create crontab for automated SEO tasks
RUN echo "# IT-ERA SEO Automation Cron Jobs" > /tmp/seo-crontab \
    && echo "# Daily sitemap check at 3:00 AM" >> /tmp/seo-crontab \
    && echo "0 3 * * * /opt/seo-tools/scripts/monitor_seo.sh > /opt/seo-tools/logs/daily.log 2>&1" >> /tmp/seo-crontab \
    && echo "# Comprehensive audit on Sundays at 4:00 AM" >> /tmp/seo-crontab \
    && echo "0 4 * * 0 /opt/seo-tools/scripts/comprehensive_audit.sh > /opt/seo-tools/logs/weekly-audit.log 2>&1" >> /tmp/seo-crontab \
    && echo "# Hourly monitoring" >> /tmp/seo-crontab \
    && echo "*/5 * * * * /opt/seo-tools/scripts/monitor_seo.sh > /dev/null 2>&1" >> /tmp/seo-crontab \
    && crontab -u seouser /tmp/seo-crontab \
    && rm /tmp/seo-crontab

# Create entry point script
COPY <<EOF /opt/seo-tools/bin/docker-entrypoint.sh
#!/bin/bash
set -euo pipefail

# Initialize logs directory
mkdir -p /opt/seo-tools/logs /opt/seo-tools/reports /opt/seo-tools/data
chown -R seouser:seouser /opt/seo-tools/logs /opt/seo-tools/reports /opt/seo-tools/data

# Start supervisor for scheduled tasks
echo "Starting SEO Tools container..."
echo "Available commands:"
echo "  seo-analyze <url>     - Analyze URL for SEO compliance"
echo "  seo-audit <url>       - Run comprehensive audit"
echo "  seo-monitor <url>     - Monitor site availability and performance"
echo "  lighthouse <url>      - Run Lighthouse performance audit"

# If no command provided, run supervisor
if [ \$# -eq 0 ]; then
    exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
fi

# Execute provided command
case "\$1" in
    "seo-analyze")
        python3 /opt/seo-tools/scripts/seo_analyzer.py "\${2:-https://it-era.pages.dev}"
        ;;
    "seo-audit")
        bash /opt/seo-tools/scripts/comprehensive_audit.sh "\${2:-https://it-era.pages.dev}"
        ;;
    "seo-monitor")
        bash /opt/seo-tools/scripts/monitor_seo.sh "\${2:-https://it-era.pages.dev}"
        ;;
    "lighthouse")
        bash /opt/seo-tools/scripts/lighthouse_runner.sh "\${2:-https://it-era.pages.dev}"
        ;;
    "shell")
        exec /bin/bash
        ;;
    *)
        echo "Unknown command: \$1"
        echo "Use 'shell' to get an interactive shell"
        exit 1
        ;;
esac
EOF

RUN chmod +x /opt/seo-tools/bin/docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:9001/status || exit 1

# Expose supervisor web interface port
EXPOSE 9001

# Set final permissions
RUN chown -R seouser:seouser /opt/seo-tools

# Switch to non-root user
USER seouser

# Set working directory
WORKDIR /opt/seo-tools

# Set entry point
ENTRYPOINT ["/opt/seo-tools/bin/docker-entrypoint.sh"]

# Default command
CMD []