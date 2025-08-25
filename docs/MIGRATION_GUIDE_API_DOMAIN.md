# IT-ERA API Domain Migration Guide

## 📋 Migration from Workers.dev to Custom Domain

This guide covers the complete migration from `bulltech.workers.dev` endpoints to the new custom domain `it-era.it/api`.

## 🔄 Endpoint Changes

### Before (Old)
```
Chatbot API: https://it-era-chatbot-prod.bulltech.workers.dev/api/chat
Contact API: https://it-era-email.bulltech.workers.dev/api/contact
Health Check: https://it-era-chatbot-prod.bulltech.workers.dev/health
```

### After (New)
```
Chatbot API: https://it-era.it/api/chat
Contact API: https://it-era.it/api/contact
Health Check: https://it-era.it/api/health
```

## 🛠️ Files Updated

### Frontend Files
- ✅ `/web/index.html` - Main website chatbot widget
- ✅ `/docs/chatbot-embeddable-clean.html` - Documentation examples
- ✅ `/api/src/chatbot/widget/chat-widget.js` - Chatbot widget class

### Backend Configuration
- ✅ `/api/src/chatbot/api/chatbot-worker.js` - Main chatbot worker
- ✅ `/api/src/form-handler.js` - Form submission handler
- ✅ `/api/wrangler-chatbot.toml` - Custom domain routes configured

### Wrangler Configuration
The production environment in `wrangler-chatbot.toml` now includes:
```toml
[[env.production.routes]]
pattern = "it-era.it/api*"
zone_name = "it-era.it"
```

## 🧪 Testing Migration

### 1. Test Endpoints
```bash
# Health check
curl https://it-era.it/api/health

# Chatbot initialization
curl -X POST https://it-era.it/api/chat \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Contact form
curl -X POST https://it-era.it/api/contact \
  -H "Content-Type: application/json" \
  -d '{"nome": "Test", "email": "test@example.com", "messaggio": "Test message"}'
```

### 2. Frontend Integration Test
```javascript
// Test chatbot widget with new endpoint
const chatWidget = new ITERAChatWidget({
  apiEndpoint: 'https://it-era.it/api/chat',
  companyName: 'IT-ERA'
});
```

## 🔒 Security & Performance Benefits

### Custom Domain Advantages
1. **Professional Branding** - Clean `it-era.it/api` URLs
2. **SSL/TLS** - Full HTTPS encryption with custom certificates
3. **Caching** - Improved caching strategies
4. **Rate Limiting** - Better control over API usage
5. **Analytics** - Enhanced tracking and monitoring

### Cloudflare Workers Routing
- Automatic routing to correct worker based on path
- Edge deployment for global performance
- Built-in DDoS protection and security

## 📊 Migration Status

### ✅ Completed
- Main website widget endpoints updated
- Documentation examples updated
- Chatbot worker configuration updated
- Form handler API endpoint updated
- Wrangler production routes configured

### 🔄 Infrastructure
- DNS routing: `it-era.it/api/*` → Cloudflare Workers
- SSL certificate: Automatic via Cloudflare
- Edge caching: Enabled for static assets

## 🚀 Deployment Steps

1. **Deploy Updated Workers**
   ```bash
   cd api
   wrangler deploy --env production
   ```

2. **Verify DNS Routing**
   - Domain `it-era.it` points to Cloudflare
   - Routes configured in Cloudflare dashboard
   - Workers bound to custom routes

3. **Test All Endpoints**
   - Chatbot functionality on main website
   - Contact form submissions
   - Health check responses

## 📞 Support

For any issues with the migration:
- Check Cloudflare Workers logs in dashboard
- Verify DNS propagation: `dig it-era.it`
- Test endpoints individually
- Review worker deployment status

## 🔮 Future Enhancements

With custom domain in place, we can now implement:
- API versioning (`/api/v1/`, `/api/v2/`)
- Enhanced monitoring and analytics
- Custom rate limiting rules
- Advanced caching strategies
- Webhook endpoints for integrations

---

**Migration completed:** ✅ All frontend files now use `https://it-era.it/api/*` endpoints