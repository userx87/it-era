# API Gateway Chatbot Integration

## Overview

The IT-ERA API Gateway has been enhanced to include routing for the AI-powered chatbot service. This integration allows all services to be accessed through a unified API endpoint while maintaining proper error handling, CORS configuration, and service isolation.

## Integration Points

### 1. Chatbot Endpoints

The following chatbot endpoints are now routed through the main API Gateway:

- `POST /api/chat` - Main chatbot interface
- `GET /health` - Chatbot-specific health check (with `User-Agent: chatbot*`)
- `GET /analytics` - Chatbot analytics (with `X-Chatbot-Request: true` header)

### 2. Routing Priority

The routing is configured with the following priority order:

1. **Contact Forms** - `/api/contact/*`
2. **Quotes & Pricing** - `/api/quote/*`, `/api/pricing/*`, `/api/hourly-quote/*`
3. **Chatbot Endpoints** - `/api/chat/*`, `/health` (with chatbot UA), `/analytics` (with chatbot header)
4. **General Analytics** - `/api/track/*`, `/api/analytics/*`
5. **Admin API** - `/admin/api/*`
6. **Blog API** - `/api/posts/*`, `/api/categories/*`, etc.

### 3. CORS Configuration

Enhanced CORS handling for chatbot endpoints:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Chatbot-Request, User-Agent
Access-Control-Max-Age: 86400
```

### 4. Error Handling

Chatbot service failures are handled gracefully:

- **503 Service Unavailable** - When chatbot service is down
- **Fallback Information** - Contact details provided in error response
- **Proper Headers** - CORS headers maintained even during errors

## Health Check Enhancement

The main API health check (`/api/health`) now includes chatbot service status:

```json
{
  "status": "healthy",
  "timestamp": "2024-08-24T16:30:00.000Z",
  "environment": "production",
  "services": {
    "api": "healthy",
    "chatbot": "healthy",
    "contact": "healthy",
    "quotes": "healthy",
    "analytics": "healthy"
  }
}
```

## API Documentation Update

The API documentation (`/api`) now includes chatbot endpoints:

```json
{
  "endpoints": {
    "chatbot": {
      "POST /api/chat": "AI-powered chatbot interface",
      "GET /health": "Chatbot health check",
      "GET /analytics": "Chatbot analytics (with X-Chatbot-Request header)"
    }
  }
}
```

## Configuration Updates

### Wrangler Configuration

Added to `wrangler.toml`:

```toml
# Chatbot KV namespace
[[kv_namespaces]]
binding = "CHAT_SESSIONS"
id = "988273308c524f4191ab95ed641dc05b"

[vars]
# Chatbot configuration
MAX_SESSION_DURATION = "1800"
RATE_LIMIT_MESSAGES = "100"
```

### Environment Variables

Required environment variables:
- `CHAT_SESSIONS` - KV namespace for chat sessions
- `OPENROUTER_API_KEY` - AI service API key (optional)
- `MAX_SESSION_DURATION` - Session timeout in seconds
- `RATE_LIMIT_MESSAGES` - Rate limit per hour per IP

## Testing

### Integration Test

```bash
cd /api/tests
node deployment-test.js
```

### Manual Testing

Test chatbot integration:

```bash
# Health check
curl https://api.it-era.it/api/health

# Chatbot health
curl -H "User-Agent: chatbot-health-check" https://api.it-era.it/health

# CORS preflight
curl -X OPTIONS -H "Origin: https://it-era.it" https://api.it-era.it/api/chat

# Start chat session
curl -X POST -H "Content-Type: application/json" \
     -d '{"action":"start"}' \
     https://api.it-era.it/api/chat
```

## Deployment Checklist

- [x] Chatbot handler imported and integrated
- [x] Routing priority configured correctly
- [x] CORS preflight handling added
- [x] Error handling with fallback information
- [x] Health check integration
- [x] API documentation updated
- [x] Environment variables configured
- [x] KV namespace bindings added
- [x] Integration tests created

## Security Considerations

1. **Rate Limiting** - Applied at chatbot handler level
2. **CORS Policy** - Configured to allow all origins for chatbot
3. **Error Messages** - Generic errors to prevent information leakage
4. **API Keys** - Properly handled through environment variables

## Troubleshooting

### Common Issues

1. **404 Not Found on /api/chat**
   - Check that chatbot handler import is correct
   - Verify routing order in index.js

2. **CORS Errors**
   - Ensure CORS preflight handler is before routing
   - Check allowed headers configuration

3. **Health Check Shows Chatbot as 'error'**
   - Verify KV namespace bindings
   - Check environment variables
   - Review chatbot handler logs

4. **Service Unavailable (503)**
   - Check if chatbot dependencies are available
   - Verify API keys and environment setup
   - Review error logs for specific issues

### Monitoring

Monitor integration health through:
- Main API health endpoint: `/api/health`
- Chatbot-specific health: `/health` (with chatbot User-Agent)
- Error rates in Cloudflare dashboard
- KV namespace usage metrics

## Performance Impact

The integration adds minimal performance overhead:
- ~1ms additional routing logic
- Health check includes one additional sub-request
- CORS preflight adds one extra check
- Error handling adds try/catch wrapper

## Future Enhancements

1. **Load Balancing** - Route to multiple chatbot instances
2. **Circuit Breaker** - Automatic failover during outages
3. **Metrics Collection** - Enhanced monitoring and analytics
4. **A/B Testing** - Route percentage of traffic to different versions
5. **Caching** - Cache chatbot responses for common queries