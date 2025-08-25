#!/bin/bash

# IT-ERA Resend Contact Form Deployment Script
# Deploys the Resend.com contact form worker to Cloudflare Workers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
API_DIR="$PROJECT_ROOT/api"

echo -e "${BLUE}🚀 IT-ERA Resend Contact Form Deployment${NC}"
echo "============================================="

# Check if we're in the right directory
if [[ ! -f "$API_DIR/wrangler-resend.toml" ]]; then
    echo -e "${RED}❌ Error: wrangler-resend.toml not found in $API_DIR${NC}"
    echo "Make sure you're running this script from the project root or that the configuration exists."
    exit 1
fi

# Change to API directory
cd "$API_DIR"

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: Wrangler CLI not found${NC}"
    echo "Please install Wrangler: npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
echo -e "${YELLOW}🔐 Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Cloudflare${NC}"
    echo "Please login first: wrangler login"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated to Cloudflare${NC}"

# Validate worker code
echo -e "${YELLOW}🔍 Validating worker code...${NC}"
if [[ ! -f "src/email/resend-contact-worker.js" ]]; then
    echo -e "${RED}❌ Error: Worker file not found: src/email/resend-contact-worker.js${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Worker file found${NC}"

# Check for required secrets
echo -e "${YELLOW}🔑 Checking Resend API key configuration...${NC}"

# Prompt for Resend API key if not set
read -p "Enter your Resend API key (or press Enter if already configured): " RESEND_API_KEY

if [[ -n "$RESEND_API_KEY" ]]; then
    echo -e "${YELLOW}📝 Setting Resend API key...${NC}"
    echo "$RESEND_API_KEY" | wrangler secret put RESEND_API_KEY --config wrangler-resend.toml
    echo -e "${GREEN}✅ API key configured${NC}"
fi

# Deploy to staging first
echo -e "${YELLOW}🚀 Deploying to staging...${NC}"
wrangler deploy --config wrangler-resend.toml --env staging || true

# Ask for confirmation before production deployment
echo -e "${YELLOW}⚠️  Ready to deploy to production?${NC}"
read -p "This will update the live contact form API. Continue? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚀 Deploying to production...${NC}"
    
    # Deploy with specific configuration
    wrangler deploy --config wrangler-resend.toml --env production
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Production deployment successful!${NC}"
        echo ""
        echo "🎉 Contact form API is now live at:"
        echo "   https://it-era-resend.bulltech.workers.dev"
        echo ""
        echo "📧 Email delivery via Resend.com is active"
        echo "📊 Form submissions will be tracked and monitored"
        echo ""
        
        # Test the endpoint
        echo -e "${YELLOW}🧪 Testing deployed endpoint...${NC}"
        ENDPOINT="https://it-era-resend.bulltech.workers.dev/api/contact"
        
        # Test with curl if available
        if command -v curl &> /dev/null; then
            HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" -X OPTIONS "$ENDPOINT")
            if [[ $HTTP_STATUS -eq 200 ]]; then
                echo -e "${GREEN}✅ Endpoint is responding correctly${NC}"
            else
                echo -e "${YELLOW}⚠️  Endpoint returned status: $HTTP_STATUS${NC}"
            fi
        fi
        
        echo ""
        echo "🔧 Next steps:"
        echo "1. Run the form integration script to update all pages"
        echo "2. Test contact forms on landing pages"
        echo "3. Monitor form submissions in Cloudflare Workers dashboard"
        echo "4. Set up custom domain (api.it-era.it) if needed"
        
    else
        echo -e "${RED}❌ Production deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Production deployment skipped${NC}"
fi

echo -e "${BLUE}🎯 Deployment process completed${NC}"

# Show final URLs and commands
echo ""
echo "📋 Useful commands:"
echo "   View logs: wrangler tail --config wrangler-resend.toml"
echo "   Update secrets: wrangler secret put RESEND_API_KEY --config wrangler-resend.toml"
echo "   Check status: wrangler deployments list --config wrangler-resend.toml"
echo ""
echo "🔗 Resources:"
echo "   Worker Dashboard: https://dash.cloudflare.com/workers"
echo "   Resend Dashboard: https://resend.com/emails"
echo "   Form Integration Script: python3 scripts/integrate_contact_forms.py"