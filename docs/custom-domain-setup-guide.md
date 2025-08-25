# IT-ERA Chatbot Custom Domain Setup Guide

## Overview
This guide configures the IT-ERA chatbot API to use the custom domain `it-era.it/api` instead of the default Cloudflare Workers subdomain.

## DNS Configuration

### Required DNS Records

Add these DNS records in your domain registrar or Cloudflare DNS settings:

```
Type: CNAME
Name: api
Target: it-era-chatbot-prod.bulltech.workers.dev
Proxy Status: Proxied (Orange Cloud in Cloudflare)
```

**Alternative A Record (if CNAME doesn't work):**
```
Type: A
Name: api
Value: [Cloudflare Worker IP - contact Cloudflare support for this]
Proxy Status: Proxied
```

## Cloudflare Workers Custom Domain Setup

### Step 1: Configure Custom Domain in Cloudflare Dashboard

1. Go to Cloudflare Dashboard
2. Select your zone: `it-era.it`
3. Navigate to **Workers & Pages** → **Overview**
4. Find your worker: `it-era-chatbot-prod`
5. Click **Settings** → **Domains & Routes**
6. Click **Add Custom Domain**
7. Enter: `api.it-era.it`
8. Click **Add Custom Domain**

### Step 2: Configure Routes (Alternative Method)

If custom domain doesn't work, use routes:

1. In Cloudflare Dashboard
2. Go to **Workers & Pages** → **Overview**
3. Find your worker: `it-era-chatbot-prod`
4. Click **Settings** → **Domains & Routes**
5. Click **Add Route**
6. Route: `it-era.it/api/*`
7. Worker: `it-era-chatbot-prod`
8. Environment: `production`

### Step 3: Deploy Updated Configuration

```bash
# Deploy with custom domain configuration
cd /Users/andreapanzeri/progetti/IT-ERA/api
wrangler deploy --config wrangler-chatbot.toml --env production
```

### Step 4: Verify SSL Certificate

1. Wait 5-10 minutes for SSL provisioning
2. Test endpoint: `https://it-era.it/api/health`
3. Verify SSL certificate is valid

## Updated Endpoints

### Before (Workers subdomain)
```
https://it-era-chatbot-prod.bulltech.workers.dev/api/chat
```

### After (Custom domain)
```
https://it-era.it/api/chat
```

## Testing the Setup

### 1. Health Check
```bash
curl -X GET https://it-era.it/api/health
```

### 2. Chat Endpoint Test
```bash
curl -X POST https://it-era.it/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "page": "/test"
  }'
```

### 3. Frontend Testing
1. Open `https://it-era.it`
2. Click the chatbot button
3. Verify it loads and responds
4. Check browser console for any CORS errors

## Troubleshooting

### Common Issues

**1. 522 Connection Timed Out**
- Solution: Check Worker is deployed and healthy
- Verify: `wrangler deploy --config wrangler-chatbot.toml --env production`

**2. 525 SSL Handshake Failed**
- Solution: Wait for SSL certificate provisioning (up to 15 minutes)
- Alternative: Use Flexible SSL temporarily

**3. CORS Errors**
- Solution: Verify CORS headers in worker code
- Check: Worker handles OPTIONS requests correctly

**4. 404 Not Found**
- Solution: Verify route pattern matches exactly: `it-era.it/api/*`
- Check: Worker is assigned to correct zone

### Verification Commands

```bash
# Check DNS resolution
nslookup api.it-era.it

# Check SSL certificate
openssl s_client -connect api.it-era.it:443 -servername api.it-era.it

# Test HTTP/HTTPS redirect
curl -I http://it-era.it/api/health
curl -I https://it-era.it/api/health

# Verify worker deployment
wrangler dev --config wrangler-chatbot.toml --env production
```

## Configuration Files Updated

1. `/api/wrangler-chatbot.toml` - Added custom domain routes
2. `/web/index.html` - Updated API endpoint URL
3. `/api/src/chatbot/widget/chat-widget.js` - Updated default endpoint

## Production Deployment Checklist

- [ ] DNS CNAME record created and propagating
- [ ] Cloudflare custom domain configured
- [ ] Worker deployed with updated wrangler.toml
- [ ] SSL certificate provisioned and valid
- [ ] Health endpoint responding
- [ ] Chat endpoint functional
- [ ] Frontend chatbot working
- [ ] CORS headers correct
- [ ] Analytics and monitoring updated with new endpoint

## Monitoring

After deployment, monitor:
- Endpoint response times
- Error rates
- SSL certificate expiration
- DNS propagation status

## Support

For issues with this setup:
1. Check Cloudflare Worker logs: `wrangler tail --config wrangler-chatbot.toml --env production`
2. Verify DNS propagation: https://dnschecker.org/
3. Test SSL: https://www.ssllabs.com/ssltest/

---

**Status:** Ready for production deployment
**Last Updated:** 2024-08-25
**Next Review:** Before domain changes