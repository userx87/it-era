# IT-ERA Chatbot Production Deployment with Custom Domain

## Quick Start

Deploy the updated chatbot with custom domain `it-era.it/api`:

```bash
cd /Users/andreapanzeri/progetti/IT-ERA/api
wrangler deploy --config wrangler-chatbot.toml --env production
```

## Pre-Deployment Checklist

### 1. DNS Configuration (Critical)
```bash
# Verify DNS record exists
nslookup api.it-era.it
# Should resolve to Cloudflare proxy IP
```

### 2. Cloudflare Settings
- [ ] Custom domain `api.it-era.it` configured in Workers dashboard
- [ ] Route `it-era.it/api/*` pointing to `it-era-chatbot-prod`
- [ ] SSL/TLS mode set to "Full" or "Full (Strict)"
- [ ] Zone `it-era.it` active and proxied

### 3. Worker Configuration
- [ ] `wrangler-chatbot.toml` updated with custom domain routes
- [ ] Environment variables set for production
- [ ] Secrets configured (if any)

## Deployment Commands

### Production Deployment
```bash
# Deploy to production with custom domain
wrangler deploy --config wrangler-chatbot.toml --env production

# Verify deployment
wrangler list

# Check logs
wrangler tail --config wrangler-chatbot.toml --env production
```

### Alternative: Staging First
```bash
# Deploy to staging first
wrangler deploy --config wrangler-chatbot.toml --env staging

# Test staging endpoint
curl -X POST https://it-era-chatbot-staging.bulltech.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# If successful, deploy to production
wrangler deploy --config wrangler-chatbot.toml --env production
```

## Verification Steps

### 1. Health Check
```bash
# Test new custom domain endpoint
curl -X GET https://it-era.it/api/health

# Expected response:
# {"status": "healthy", "timestamp": "...", "version": "..."}
```

### 2. Chat Endpoint
```bash
# Test chat functionality
curl -X POST https://it-era.it/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "page": "/"
  }'

# Expected: JSON response with sessionId
```

### 3. Frontend Integration
1. Open https://it-era.it
2. Click chatbot button
3. Verify chat loads without errors
4. Send test message
5. Check browser console for errors

### 4. CORS Verification
```bash
# Test CORS preflight
curl -X OPTIONS https://it-era.it/api/chat \
  -H "Origin: https://it-era.it" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Should return CORS headers
```

## Monitoring Commands

### Real-time Logs
```bash
# Watch production logs
wrangler tail --config wrangler-chatbot.toml --env production

# Filter for errors only
wrangler tail --config wrangler-chatbot.toml --env production --format=pretty | grep ERROR
```

### Performance Testing
```bash
# Load test the endpoint
for i in {1..10}; do
  curl -X POST https://it-era.it/api/chat \
    -H "Content-Type: application/json" \
    -d '{"action": "start"}' \
    -w "Response time: %{time_total}s\n" \
    -s -o /dev/null
done
```

## Rollback Procedure

If issues occur with custom domain:

### Quick Rollback
```bash
# Temporarily disable custom domain route in Cloudflare Dashboard
# Workers & Pages → it-era-chatbot-prod → Settings → Domains & Routes
# Delete or disable the custom domain entry
```

### Code Rollback
```bash
# Revert to previous API endpoint in frontend
# Update /web/index.html
sed -i 's|https://it-era.it/api/chat|https://it-era-chatbot-prod.bulltech.workers.dev/api/chat|g' /Users/andreapanzeri/progetti/IT-ERA/web/index.html

# Redeploy with original configuration
wrangler deploy --config wrangler-chatbot.toml --env production
```

## Common Issues & Solutions

### 1. 522 Connection Timed Out
**Cause:** Worker not responding or deployed incorrectly
**Solution:**
```bash
wrangler deploy --config wrangler-chatbot.toml --env production --compatibility-date 2024-01-23
```

### 2. SSL Certificate Issues
**Cause:** Custom domain SSL not provisioned yet
**Solution:** Wait 15 minutes, then test again

### 3. CORS Errors
**Cause:** Missing CORS headers in worker
**Solution:** Verify worker handles OPTIONS requests

### 4. Route Not Working
**Cause:** Route pattern mismatch
**Solution:** Verify exact pattern: `it-era.it/api/*`

## Performance Expectations

### Response Times
- Health endpoint: <100ms
- Chat start: <500ms  
- Chat message: <1500ms

### Availability
- Target: 99.9% uptime
- Monitoring: Cloudflare Analytics
- Alerting: Configure via Cloudflare

## Security Checklist

- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] CORS configured for it-era.it origin only
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] No sensitive data in logs
- [ ] Environment secrets not exposed

## Post-Deployment Tasks

1. **Update Documentation**
   - Update API documentation with new endpoints
   - Notify team of endpoint change

2. **Analytics Update**
   - Update tracking for new domain
   - Verify Google Analytics continues working

3. **Monitoring Setup**
   - Configure alerts for new endpoint
   - Update uptime monitoring

4. **Performance Baseline**
   - Record baseline performance metrics
   - Set up automated testing

## Emergency Contacts

- **Cloudflare Support:** https://dash.cloudflare.com/support
- **Wrangler Issues:** https://github.com/cloudflare/workers-sdk/issues
- **IT-ERA Tech Lead:** [Contact information]

---

**Deployment Date:** [To be filled]
**Deployed By:** [To be filled]
**Version:** v2.0.0-custom-domain
**Next Review:** 30 days post-deployment