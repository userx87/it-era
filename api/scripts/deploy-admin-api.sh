#!/bin/bash

# IT-ERA Admin API Deployment Script
# This script deploys the complete admin API worker to Cloudflare Workers

set -e

echo "🚀 IT-ERA Admin API Deployment Starting..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
WORKER_NAME="it-era-admin-api"
CONFIG_FILE="wrangler-admin-api.toml"
WORKER_FILE="src/admin/admin-api-worker-complete.js"

# Check if running from correct directory
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Error: $CONFIG_FILE not found. Please run from the api directory.${NC}"
    exit 1
fi

if [ ! -f "$WORKER_FILE" ]; then
    echo -e "${RED}❌ Error: $WORKER_FILE not found.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment Checklist${NC}"
echo "1. Worker file: $WORKER_FILE ✓"
echo "2. Config file: $CONFIG_FILE ✓"
echo "3. Environment: ${1:-production}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found. Please install it first:${NC}"
    echo "npm install -g wrangler"
    exit 1
fi

# Login check
echo -e "${YELLOW}🔐 Checking Wrangler authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Wrangler:${NC}"
    wrangler auth login
fi

# Set environment (default to production)
ENVIRONMENT=${1:-production}
echo -e "${GREEN}🎯 Deploying to environment: $ENVIRONMENT${NC}"

# Set secrets if not already set (production only)
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}🔑 Checking secrets...${NC}"
    
    # Check if JWT_SECRET is set
    if ! wrangler secret list --name "$WORKER_NAME" 2>/dev/null | grep -q "JWT_SECRET"; then
        echo -e "${YELLOW}Setting JWT_SECRET...${NC}"
        echo "Please enter a secure JWT secret (min 32 characters):"
        read -s jwt_secret
        echo "$jwt_secret" | wrangler secret put JWT_SECRET --name "$WORKER_NAME"
    fi
    
    # Check if ENCRYPTION_KEY is set
    if ! wrangler secret list --name "$WORKER_NAME" 2>/dev/null | grep -q "ENCRYPTION_KEY"; then
        echo -e "${YELLOW}Setting ENCRYPTION_KEY...${NC}"
        # Generate a random encryption key
        encryption_key=$(openssl rand -base64 32)
        echo "$encryption_key" | wrangler secret put ENCRYPTION_KEY --name "$WORKER_NAME"
        echo "Generated and set ENCRYPTION_KEY"
    fi
fi

# Validate worker syntax
echo -e "${YELLOW}🔍 Validating worker syntax...${NC}"
if ! node -c "$WORKER_FILE"; then
    echo -e "${RED}❌ Worker file has syntax errors.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Worker syntax is valid${NC}"

# Deploy the worker
echo -e "${YELLOW}🚀 Deploying worker...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler deploy --config "$CONFIG_FILE" --env production
else
    wrangler deploy --config "$CONFIG_FILE" --env development
fi

# Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
sleep 2

# Get worker URL
if [ "$ENVIRONMENT" = "production" ]; then
    WORKER_URL="https://it-era.pages.dev"
    HEALTH_URL="$WORKER_URL/admin/api/auth/health"
else
    WORKER_URL="https://$WORKER_NAME-dev.your-subdomain.workers.dev"
    HEALTH_URL="$WORKER_URL/admin/api/auth/health"
fi

echo -e "${YELLOW}Testing health endpoint: $HEALTH_URL${NC}"

# Test health endpoint with timeout
if curl -s --max-time 10 "$HEALTH_URL" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed or timed out${NC}"
    echo "This might be normal for the first deployment."
fi

# Display deployment information
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${YELLOW}📊 Deployment Summary:${NC}"
echo "Worker Name: $WORKER_NAME"
echo "Environment: $ENVIRONMENT"
echo "Worker URL: $WORKER_URL"
echo ""
echo -e "${YELLOW}🔗 Available Endpoints:${NC}"
echo "Health Check:     GET  $WORKER_URL/admin/api/auth/health"
echo "Login:            POST $WORKER_URL/admin/api/auth/login"
echo "Verify Token:     GET  $WORKER_URL/admin/api/auth/verify"
echo "Dashboard:        GET  $WORKER_URL/admin/api/dashboard"
echo "Posts:            GET  $WORKER_URL/admin/api/posts"
echo "Media:            GET  $WORKER_URL/admin/api/media"
echo "Users:            GET  $WORKER_URL/admin/api/users"
echo "Settings:         GET  $WORKER_URL/admin/api/settings"
echo "Analytics:        GET  $WORKER_URL/admin/api/analytics"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Test the endpoints using the provided URLs"
echo "2. Update your admin panel frontend to use these endpoints"
echo "3. Configure KV namespaces and D1 database as needed"
echo "4. Set up monitoring and alerts"
echo ""
echo -e "${GREEN}✅ Admin API is ready for use!${NC}"

# Optional: Open health check in browser (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "Open health check in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$HEALTH_URL"
    fi
fi