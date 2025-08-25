#!/bin/bash

# IT-ERA Admin Panel Deployment Script
# GitHub Deployment Master Agent
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        error "Wrangler CLI is not installed. Installing..."
        npm install -g wrangler
    fi
    
    # Check if we're logged in to Cloudflare
    if ! wrangler whoami &> /dev/null; then
        warning "Not logged in to Cloudflare. Please run: wrangler login"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Function to build the project
build_project() {
    log "Building admin panel..."
    
    cd "$DEPLOYMENT_DIR/cloudflare"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Set environment variables
    export ENVIRONMENT="${1:-production}"
    if [ "$ENVIRONMENT" = "production" ]; then
        export API_BASE_URL="https://it-era-admin-auth-production.bulltech.workers.dev"
    else
        export API_BASE_URL="https://it-era-admin-auth-staging.bulltech.workers.dev"
    fi
    
    # Build the project
    npm run build
    
    success "Build completed"
}

# Function to deploy to Cloudflare Pages
deploy_cloudflare() {
    local environment=${1:-production}
    log "Deploying to Cloudflare Pages ($environment)..."
    
    cd "$DEPLOYMENT_DIR/cloudflare"
    
    if [ "$environment" = "production" ]; then
        wrangler pages deploy dist --env production
    else
        wrangler pages deploy dist --env staging
    fi
    
    success "Deployment to Cloudflare Pages completed"
}

# Function to create manual deployment package
create_manual_package() {
    log "Creating manual deployment package..."
    
    local package_dir="$DEPLOYMENT_DIR/manual/it-era-admin-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$package_dir"
    
    # Copy built files
    cp -r "$DEPLOYMENT_DIR/cloudflare/dist/"* "$package_dir/"
    
    # Create deployment instructions
    cat > "$package_dir/DEPLOYMENT_INSTRUCTIONS.txt" << EOF
IT-ERA Admin Panel - Manual Deployment Package
Generated: $(date)

CONTENTS:
- index.html: Main application file
- js/: JavaScript files
- css/: Stylesheets  
- images/: Image assets
- _headers: HTTP headers configuration
- _redirects: URL redirects configuration

DEPLOYMENT INSTRUCTIONS:

1. FTP/SFTP Upload:
   - Upload all files to your web server's document root
   - Ensure _headers and _redirects are supported by your server
   - For Apache servers, you may need to convert _headers to .htaccess

2. Static File Hosting:
   - Upload to any static file hosting service
   - Ensure proper CORS headers are configured
   - Set up SPA routing for /admin/* paths

3. CDN Deployment:
   - Upload to your CDN provider
   - Configure origin server settings
   - Enable gzip compression

CONFIGURATION:
- API endpoints are configured in js/config.js
- Update API_BASE_URL if needed for your environment
- Ensure CORS is properly configured on your API server

VERIFICATION:
1. Access the admin panel at your deployed URL
2. Check browser console for any errors
3. Test login functionality
4. Verify all admin features are working

For support: contact IT-ERA technical team
EOF
    
    # Create ZIP package
    cd "$DEPLOYMENT_DIR/manual"
    zip -r "$(basename "$package_dir").zip" "$(basename "$package_dir")"
    
    success "Manual deployment package created: $package_dir.zip"
    
    echo "$package_dir.zip"
}

# Function to verify deployment
verify_deployment() {
    local url=${1:-"https://it-era-admin-panel.pages.dev"}
    log "Verifying deployment at $url..."
    
    # Test if the site is accessible
    if curl -s --head "$url" | head -n 1 | grep -q "200 OK"; then
        success "Deployment is accessible"
    else
        warning "Deployment may not be accessible yet. Please check manually."
    fi
    
    # TODO: Add more comprehensive verification
    log "Manual verification recommended:"
    echo "1. Visit $url"
    echo "2. Test login functionality"
    echo "3. Check all admin panel sections"
    echo "4. Verify API connectivity"
}

# Main deployment function
main() {
    local deployment_type=${1:-"cloudflare"}
    local environment=${2:-"production"}
    
    log "Starting IT-ERA Admin Panel deployment..."
    log "Deployment type: $deployment_type"
    log "Environment: $environment"
    
    case $deployment_type in
        "cloudflare")
            check_prerequisites
            build_project "$environment"
            deploy_cloudflare "$environment"
            verify_deployment
            ;;
        "manual")
            build_project "$environment"
            package_path=$(create_manual_package)
            log "Manual deployment package ready: $package_path"
            ;;
        "build-only")
            build_project "$environment"
            success "Build completed. Files available in: $DEPLOYMENT_DIR/cloudflare/dist"
            ;;
        *)
            error "Unknown deployment type: $deployment_type"
            echo "Usage: $0 [cloudflare|manual|build-only] [production|staging]"
            exit 1
            ;;
    esac
    
    success "Deployment process completed!"
}

# Help function
show_help() {
    echo "IT-ERA Admin Panel Deployment Script"
    echo ""
    echo "Usage: $0 [DEPLOYMENT_TYPE] [ENVIRONMENT]"
    echo ""
    echo "DEPLOYMENT_TYPE:"
    echo "  cloudflare    Deploy to Cloudflare Pages (default)"
    echo "  manual        Create manual deployment package"
    echo "  build-only    Build only, no deployment"
    echo ""
    echo "ENVIRONMENT:"
    echo "  production    Production environment (default)"
    echo "  staging       Staging environment"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy to Cloudflare Pages (production)"
    echo "  $0 cloudflare staging        # Deploy to Cloudflare Pages (staging)"
    echo "  $0 manual                    # Create manual deployment package"
    echo "  $0 build-only                # Build only"
}

# Parse command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

main "$@"