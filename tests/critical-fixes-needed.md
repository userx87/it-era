# Critical Fixes Required for IT-ERA Chatbot Production Deployment

## 🚨 IMMEDIATE FIXES REQUIRED (BLOCKERS)

### 1. API Endpoint Configuration Issue
**Priority**: CRITICAL  
**Impact**: Widget cannot connect to deployed worker

**Problem**:
- Widget hardcoded endpoint: `https://it-era-chatbot.bulltech.workers.dev/api/chat`  
- Wrangler config shows worker name: `it-era-chatbot`  
- Production URL will be: `https://it-era-chatbot.YOUR_SUBDOMAIN.workers.dev/api/chat`

**Fix Required**:
Update `/api/src/chatbot/widget/chat-widget.js` line 10:

```javascript
// CURRENT (WILL FAIL)
apiEndpoint: options.apiEndpoint || 'https://it-era-chatbot.bulltech.workers.dev/api/chat',

// FIX NEEDED - Update to actual production URL
apiEndpoint: options.apiEndpoint || 'https://it-era-chatbot.2842eac6595a0ac8086c76cee3409a24.workers.dev/api/chat',
```

### 2. Environment Variables Missing
**Priority**: HIGH  
**Impact**: AI features will not work without API keys

**Missing Secrets**:
```bash
# Required for production deployment
wrangler secret put OPENROUTER_API_KEY
wrangler secret put OPENAI_API_KEY  # Alternative
wrangler secret put ANTHROPIC_API_KEY  # Alternative

# Optional for enhanced features  
wrangler secret put SENDGRID_API_KEY  # For email integration
```

**Verification**:
```bash
wrangler secret list --name it-era-chatbot
```

### 3. Worker Main File Mismatch  
**Priority**: MEDIUM  
**Impact**: Deployment will use different worker than intended

**Current Config**: 
- `wrangler-chatbot.toml` points to: `src/chatbot/api/chatbot-worker-simple.js`
- Complex AI worker exists at: `src/chatbot/api/chatbot-worker.js`

**Decision Needed**:
Choose which worker to deploy:
- **Simple Worker**: Basic functionality, minimal AI, faster responses
- **Complex Worker**: Full AI integration, more features, higher cost

**Recommendation**: Start with simple worker for production stability

## 🔧 CONFIGURATION FIXES

### 1. Update Widget Endpoint Configuration

```javascript
// File: /api/src/chatbot/widget/chat-widget.js
// Line: 10

// FIND THIS:
apiEndpoint: options.apiEndpoint || 'https://it-era-chatbot.bulltech.workers.dev/api/chat',

// REPLACE WITH:
apiEndpoint: options.apiEndpoint || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:8787/api/chat'  // Development
    : 'https://it-era-chatbot.2842eac6595a0ac8086c76cee3409a24.workers.dev/api/chat', // Production
```

### 2. Enable CORS for Production Domain

Add to `wrangler-chatbot.toml`:
```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://it-era.it,https://www.it-era.it,https://it-era.pages.dev"
```

### 3. Configure Monitoring (Recommended)

Add to production environment:
```toml
[env.production.vars]
ENABLE_ANALYTICS = "true"
LOG_LEVEL = "info" 
SENTRY_DSN = "your-sentry-dsn-here"  # Optional
```

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment (Must Complete)
- [ ] Update widget API endpoint to correct production URL
- [ ] Set required environment secrets (API keys)  
- [ ] Choose and configure main worker file
- [ ] Test health check endpoint responds correctly
- [ ] Verify KV namespaces exist and are configured
- [ ] Update CORS allowed origins for production domain

### Deployment Steps
```bash
# 1. Deploy to staging first
wrangler deploy --env staging

# 2. Test staging deployment
node tests/run-chatbot-tests.js --url https://it-era-chatbot-staging.ACCOUNT.workers.dev

# 3. Deploy to production (if staging tests pass)
wrangler deploy --env production

# 4. Test production deployment
node tests/run-chatbot-tests.js --url https://it-era-chatbot-prod.ACCOUNT.workers.dev
```

### Post-Deployment Validation
- [ ] Health check returns 200 OK
- [ ] Widget loads on target website  
- [ ] Basic conversation flow works
- [ ] Teams notifications are sent correctly
- [ ] Rate limiting is functional
- [ ] Session persistence works
- [ ] AI fallback mechanisms work

## 🔍 TESTING COMMANDS

### Local Testing
```bash
# Start local development
cd api
wrangler dev --env development

# Run comprehensive tests
node tests/run-chatbot-tests.js --url http://localhost:8787

# Test in browser
open tests/browser-integration-test.html
```

### Production Testing  
```bash
# Test production endpoint
node tests/run-chatbot-tests.js

# Quick health check
curl https://it-era-chatbot-prod.ACCOUNT.workers.dev/health

# Test basic chat flow
curl -X POST https://it-era-chatbot-prod.ACCOUNT.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'
```

## 💡 RECOMMENDATIONS FOR PRODUCTION

### 1. Start with Simple Configuration
- Use `chatbot-worker-simple.js` for initial deployment
- Enable AI features after basic functionality is confirmed
- Monitor costs and performance before full AI rollout

### 2. Implement Gradual Rollout
- Deploy to staging environment first
- Test with limited traffic (specific pages)
- Monitor error rates and response times
- Gradually increase traffic exposure

### 3. Set Up Monitoring
- Configure error alerts for failed requests
- Monitor response times and success rates
- Track Teams webhook delivery rates
- Monitor AI API costs and usage

### 4. Prepare Rollback Plan
- Keep previous working version of worker
- Document rollback procedures
- Set up quick disable mechanism if needed

## 🚨 RED FLAGS - DO NOT DEPLOY IF:
- Health check endpoint returns errors
- Widget fails to load in browser test
- Teams webhook integration is not working
- API endpoints return 5xx errors consistently
- Response times exceed 10 seconds regularly

## 📞 EMERGENCY CONTACTS
If critical issues arise during deployment:
1. Check worker logs: `wrangler tail --env production`
2. Revert to previous version if necessary
3. Contact development team with error logs
4. Use fallback contact methods (direct phone/email) if chat is down

---

**Last Updated**: August 24, 2025  
**Next Review**: After deployment completion