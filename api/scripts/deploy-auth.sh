#!/bin/bash

# IT-ERA Authentication Worker Deployment Script
# Deploys the standalone authentication worker to Cloudflare Workers

set -e

echo "🚀 Starting IT-ERA Admin Authentication Worker Deployment"
echo "=================================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in
if ! wrangler auth whoami &> /dev/null; then
    echo "⚠️  Please login to Cloudflare first:"
    echo "wrangler auth login"
    exit 1
fi

echo "✅ Wrangler CLI found and authenticated"

# Navigate to the API directory
cd "$(dirname "$0")/.."
echo "📁 Working directory: $(pwd)"

# Check if auth worker exists
if [ ! -f "src/auth/auth-worker.js" ]; then
    echo "❌ Authentication worker not found at src/auth/auth-worker.js"
    exit 1
fi

echo "✅ Authentication worker found"

# Set JWT secret (if not already set)
echo "🔐 Setting up JWT secret..."
if ! wrangler secret list --name it-era-admin-auth | grep -q "JWT_SECRET"; then
    echo "Setting JWT_SECRET..."
    echo "it-era-admin-jwt-secret-$(date +%s)" | wrangler secret put JWT_SECRET --name it-era-admin-auth
    echo "✅ JWT_SECRET set"
else
    echo "✅ JWT_SECRET already configured"
fi

# Deploy to development first
echo "🚧 Deploying to development environment..."
wrangler deploy --config wrangler-auth.toml --env development

if [ $? -eq 0 ]; then
    echo "✅ Development deployment successful"
else
    echo "❌ Development deployment failed"
    exit 1
fi

# Test development endpoint
echo "🧪 Testing development endpoint..."
DEV_URL=$(wrangler whoami | grep "account" | head -1 | sed 's/.*account //' | sed 's/ .*//')
DEV_ENDPOINT="https://it-era-admin-auth-dev.$DEV_URL.workers.dev/admin/api/auth/login"

# Simple curl test
curl -X POST "$DEV_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@it-era.it","password":"admin123!"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | head -10

echo ""

# Ask for production deployment confirmation
read -p "🚀 Deploy to production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    wrangler deploy --config wrangler-auth.toml --env production
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Production deployment successful!"
        echo ""
        echo "📍 Authentication endpoints:"
        echo "   Login: https://it-era.pages.dev/admin/api/auth/login"
        echo "   Verify: https://it-era.pages.dev/admin/api/auth/verify"
        echo ""
        echo "🧪 Test credentials:"
        echo "   Email: admin@it-era.it"
        echo "   Password: admin123!"
        echo ""
        echo "🔧 Next steps:"
        echo "   1. Test the login endpoint with the admin panel"
        echo "   2. Update admin panel to use the new authentication"
        echo "   3. Add more users to the production database"
        echo ""
    else
        echo "❌ Production deployment failed"
        exit 1
    fi
else
    echo "⏭️  Skipped production deployment"
    echo ""
    echo "🧪 Development endpoint:"
    echo "   $DEV_ENDPOINT"
    echo ""
    echo "To deploy to production later, run:"
    echo "   wrangler deploy --config wrangler-auth.toml --env production"
fi

echo "✅ Deployment script completed!"