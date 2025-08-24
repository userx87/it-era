#!/bin/bash

# IT-ERA Chatbot Swarm Deployment Script
# Progressive rollout with monitoring

set -e

echo "🚀 IT-ERA Chatbot Swarm Deployment"
echo "==================================="
echo ""

# Configuration
ENV=${1:-staging}
SWARM_PERCENTAGE=${2:-10}

echo "📋 Deployment Configuration:"
echo "  Environment: $ENV"
echo "  Initial Swarm Traffic: ${SWARM_PERCENTAGE}%"
echo ""

# Step 1: Test the build
echo "1️⃣ Testing build..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi
echo "✅ Build successful"
echo ""

# Step 2: Run tests
echo "2️⃣ Running tests..."
node tests/test-swarm-orchestration.js
if [ $? -ne 0 ]; then
  echo "❌ Tests failed!"
  exit 1
fi
echo "✅ Tests passed"
echo ""

# Step 3: Set environment variables
echo "3️⃣ Configuring environment variables..."
wrangler secret put SWARM_ENABLED --env $ENV <<< "true"
wrangler secret put AB_TEST_ENABLED --env $ENV <<< "true"
wrangler secret put SWARM_PERCENTAGE --env $ENV <<< "$SWARM_PERCENTAGE"
wrangler secret put OPENROUTER_API_KEY --env $ENV <<< "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"
echo "✅ Environment configured"
echo ""

# Step 4: Deploy to Cloudflare
echo "4️⃣ Deploying to Cloudflare Workers..."
if [ "$ENV" = "production" ]; then
  echo "⚠️ PRODUCTION DEPLOYMENT - Confirming..."
  read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
  fi
  wrangler deploy --env production
else
  wrangler deploy --env $ENV
fi

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed!"
  exit 1
fi
echo "✅ Deployed successfully"
echo ""

# Step 5: Verify deployment
echo "5️⃣ Verifying deployment..."
if [ "$ENV" = "production" ]; then
  ENDPOINT="https://it-era-chatbot.bulltech.workers.dev"
else
  ENDPOINT="https://it-era-chatbot-${ENV}.bulltech.workers.dev"
fi

HEALTH_CHECK=$(curl -s "$ENDPOINT/health")
echo "Health check response:"
echo "$HEALTH_CHECK" | jq '.'

# Check if swarm is enabled
SWARM_STATUS=$(echo "$HEALTH_CHECK" | jq -r '.features.swarmEnabled // false')
if [ "$SWARM_STATUS" = "true" ]; then
  echo "✅ Swarm orchestration is active"
else
  echo "⚠️ Swarm orchestration is not active"
fi
echo ""

# Step 6: Monitor initial performance
echo "6️⃣ Monitoring initial performance (30 seconds)..."
echo "Please test the chatbot at: https://it-era.pages.dev"
echo ""

for i in {1..6}; do
  echo -n "Monitoring... ($((i*5))/30 seconds)"
  sleep 5
  echo -ne "\r"
done
echo ""

# Step 7: Progressive rollout plan
echo "7️⃣ Progressive Rollout Plan:"
echo "================================"
echo "Day 1-2:   10% traffic → Monitor metrics"
echo "Day 3-4:   25% traffic → Check performance"
echo "Day 5-6:   50% traffic → Validate stability"
echo "Day 7:     75% traffic → Final validation"
echo "Day 8:    100% traffic → Full production"
echo ""

# Step 8: Monitoring commands
echo "📊 Monitoring Commands:"
echo "================================"
echo "# View real-time logs:"
echo "wrangler tail --env $ENV"
echo ""
echo "# Check KV storage:"
echo "wrangler kv:key list --namespace-id 988273308c524f4191ab95ed641dc05b"
echo ""
echo "# Get performance metrics:"
echo "curl $ENDPOINT/api/metrics"
echo ""
echo "# Adjust swarm percentage:"
echo "wrangler secret put SWARM_PERCENTAGE --env $ENV"
echo ""

# Step 9: Rollback instructions
echo "🔄 Rollback Instructions (if needed):"
echo "================================"
echo "# Quick disable swarm:"
echo "wrangler secret put SWARM_ENABLED --env $ENV <<< 'false'"
echo ""
echo "# Full rollback:"
echo "git checkout previous-version"
echo "wrangler deploy --env $ENV"
echo ""

echo "✅ Deployment Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Monitor error rates and response times"
echo "2. Check Teams notifications for high-value leads"
echo "3. Review A/B test metrics after 24 hours"
echo "4. Adjust swarm percentage based on performance"
echo "5. Document any issues or improvements needed"
echo ""
echo "🎉 Swarm orchestration is now live at ${SWARM_PERCENTAGE}% traffic!"