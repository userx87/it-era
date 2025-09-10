#!/bin/bash

# IT-ERA Cloudflare Pages Deployment Script
# Automatizza il deployment su Cloudflare Pages con ottimizzazioni

set -e

echo "🚀 IT-ERA Cloudflare Deployment Starting..."

# Configuration
PROJECT_NAME="it-era"
BUILD_DIR="web"
DEPLOY_DIR="dist"
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI not found. Installing..."
        npm install -g wrangler
    fi
    
    # Check authentication
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        print_warning "CLOUDFLARE_API_TOKEN not set. Checking wrangler auth..."
        if ! wrangler whoami &> /dev/null; then
            print_error "Not authenticated with Cloudflare. Run: wrangler login"
            exit 1
        fi
    fi
    
    print_success "Prerequisites check completed"
}

# Optimize assets before deployment
optimize_assets() {
    print_status "Optimizing assets..."
    
    # Create dist directory
    rm -rf $DEPLOY_DIR
    mkdir -p $DEPLOY_DIR
    
    # Copy web files
    cp -r $BUILD_DIR/* $DEPLOY_DIR/
    
    # Minify HTML files
    if command -v html-minifier &> /dev/null; then
        find $DEPLOY_DIR -name "*.html" -exec html-minifier --collapse-whitespace --remove-comments --minify-css --minify-js {} --output {} \;
        print_success "HTML files minified"
    else
        print_warning "html-minifier not found, skipping HTML minification"
    fi
    
    # Optimize CSS (if postcss is available)
    if command -v postcss &> /dev/null; then
        find $DEPLOY_DIR -name "*.css" -exec postcss {} --use autoprefixer --use cssnano --replace \;
        print_success "CSS optimized"
    else
        print_warning "PostCSS not found, skipping CSS optimization"
    fi
    
    # Generate sitemap if not exists
    if [ ! -f "$DEPLOY_DIR/sitemap.xml" ]; then
        generate_sitemap
    fi
    
    print_success "Asset optimization completed"
}

# Generate sitemap
generate_sitemap() {
    print_status "Generating sitemap..."
    
    cat > "$DEPLOY_DIR/sitemap.xml" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://it-era.it/</loc>
        <lastmod>$(date -I)</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://it-era.it/pages/assistenza-it.html</loc>
        <lastmod>$(date -I)</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>https://it-era.it/pages/sicurezza-informatica.html</loc>
        <lastmod>$(date -I)</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>https://it-era.it/pages/cloud-storage-aziendale.html</loc>
        <lastmod>$(date -I)</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>https://it-era.it/pages/settori-studi-medici.html</loc>
        <lastmod>$(date -I)</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://it-era.it/pages/it-commercialisti-lombardia.html</loc>
        <lastmod>$(date -I)</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://it-era.it/pages/settori-studi-legali.html</loc>
        <lastmod>$(date -I)</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://it-era.it/pages/settori-pmi-startup.html</loc>
        <lastmod>$(date -I)</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://it-era.it/pages/chi-siamo.html</loc>
        <lastmod>$(date -I)</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>https://it-era.it/pages/contatti.html</loc>
        <lastmod>$(date -I)</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
EOF

    # Add all city pages dynamically
    if [ -d "$DEPLOY_DIR/pages" ]; then
        find "$DEPLOY_DIR/pages" -name "assistenza-it-*.html" | head -20 | while read -r file; do
            filename=$(basename "$file")
            echo "    <url>" >> "$DEPLOY_DIR/sitemap.xml"
            echo "        <loc>https://it-era.it/pages/$filename</loc>" >> "$DEPLOY_DIR/sitemap.xml"
            echo "        <lastmod>$(date -I)</lastmod>" >> "$DEPLOY_DIR/sitemap.xml"
            echo "        <changefreq>monthly</changefreq>" >> "$DEPLOY_DIR/sitemap.xml"
            echo "        <priority>0.6</priority>" >> "$DEPLOY_DIR/sitemap.xml"
            echo "    </url>" >> "$DEPLOY_DIR/sitemap.xml"
        done
    fi
    
    echo "</urlset>" >> "$DEPLOY_DIR/sitemap.xml"
    
    print_success "Sitemap generated with $(grep -c '<url>' $DEPLOY_DIR/sitemap.xml) URLs"
}

# Deploy to Cloudflare Pages
deploy_to_cloudflare() {
    print_status "Deploying to Cloudflare Pages..."
    
    # Deploy with wrangler
    if wrangler pages deploy $DEPLOY_DIR --project-name=$PROJECT_NAME; then
        print_success "Deployment successful!"
        
        # Get deployment URL
        DEPLOY_URL=$(wrangler pages project list | grep $PROJECT_NAME | awk '{print $3}')
        if [ -n "$DEPLOY_URL" ]; then
            print_success "Live at: $DEPLOY_URL"
        fi
    else
        print_error "Deployment failed!"
        exit 1
    fi
}

# Configure Cloudflare Pages settings
configure_pages() {
    print_status "Configuring Cloudflare Pages settings..."
    
    # Custom domain configuration (if needed)
    if [ -n "$CUSTOM_DOMAIN" ]; then
        print_status "Setting custom domain: $CUSTOM_DOMAIN"
        # wrangler pages domain add $CUSTOM_DOMAIN --project-name=$PROJECT_NAME
    fi
    
    # Security headers
    create_headers_file
    
    print_success "Pages configuration completed"
}

# Create _headers file for security and performance
create_headers_file() {
    print_status "Creating security headers..."
    
    cat > "$DEPLOY_DIR/_headers" << EOF
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com;

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=3600

/sitemap.xml
  Cache-Control: public, max-age=86400
EOF
    
    print_success "Security headers configured"
}

# Create redirects for SEO
create_redirects() {
    print_status "Setting up redirects..."
    
    cat > "$DEPLOY_DIR/_redirects" << EOF
# Redirect old URLs if any
/home /
/homepage /

# Redirect www to non-www
https://www.it-era.it/* https://it-era.it/:splat 301!

# Trailing slash redirects
/pages/ /pages
/servizi/ /servizi

# Service redirects
/assistenza-it /pages/assistenza-it.html
/sicurezza-informatica /pages/sicurezza-informatica.html
/cloud-storage /pages/cloud-storage-aziendale.html

# Sector redirects
/studi-medici /pages/settori-studi-medici.html
/commercialisti /pages/it-commercialisti-lombardia.html
/studi-legali /pages/settori-studi-legali.html
/pmi-startup /pages/settori-pmi-startup.html

# Contact redirects
/contatti /pages/contatti.html
/chi-siamo /pages/chi-siamo.html

# 404 fallback
/* /index.html 404
EOF
    
    print_success "Redirects configured"
}

# Generate deployment report
generate_report() {
    print_status "Generating deployment report..."
    
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    REPORT_FILE="web/reports/deploy-$(date '+%Y%m%d-%H%M%S').json"
    
    mkdir -p web/reports
    
    cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "project_name": "$PROJECT_NAME",
  "deployment_status": "success",
  "files_deployed": $(find $DEPLOY_DIR -type f | wc -l),
  "total_size": "$(du -sh $DEPLOY_DIR | cut -f1)",
  "sitemap_urls": $(grep -c '<url>' $DEPLOY_DIR/sitemap.xml 2>/dev/null || echo 0),
  "security_headers": "enabled",
  "performance_optimizations": "enabled",
  "custom_domain": "${CUSTOM_DOMAIN:-none}",
  "deployment_url": "https://$PROJECT_NAME.pages.dev"
}
EOF
    
    print_success "Deployment report saved: $REPORT_FILE"
    cat "$REPORT_FILE"
}

# Performance testing
run_performance_tests() {
    print_status "Running basic performance checks..."
    
    if command -v lighthouse &> /dev/null; then
        print_status "Running Lighthouse audit..."
        lighthouse "https://$PROJECT_NAME.pages.dev" --output=json --output-path="web/reports/lighthouse-$(date +%Y%m%d).json" --chrome-flags="--headless" || print_warning "Lighthouse audit failed"
    else
        print_warning "Lighthouse not found, skipping performance audit"
    fi
}

# Main deployment flow
main() {
    print_status "Starting IT-ERA deployment process..."
    
    check_prerequisites
    optimize_assets
    create_headers_file
    create_redirects
    deploy_to_cloudflare
    configure_pages
    generate_report
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Your website is now live at: https://$PROJECT_NAME.pages.dev"
    
    # Optional performance test
    if [ "$RUN_PERFORMANCE_TEST" = "true" ]; then
        run_performance_tests
    fi
}

# Handle script arguments
case "$1" in
    "deploy")
        main
        ;;
    "optimize")
        optimize_assets
        ;;
    "sitemap")
        generate_sitemap
        ;;
    "test")
        run_performance_tests
        ;;
    *)
        echo "Usage: $0 {deploy|optimize|sitemap|test}"
        echo "  deploy   - Full deployment to Cloudflare Pages"
        echo "  optimize - Only optimize assets"
        echo "  sitemap  - Generate sitemap only"
        echo "  test     - Run performance tests"
        exit 1
        ;;
esac