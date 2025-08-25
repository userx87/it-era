# IT-ERA Admin Authentication Worker Deployment Guide

## 🚀 Quick Deploy

The authentication endpoint is now ready to deploy and fix the 404 error at `https://it-era.pages.dev/admin/api/auth/login`.

### Step 1: Deploy the Authentication Worker

```bash
# Navigate to API directory
cd /Users/andreapanzeri/progetti/IT-ERA/api

# Run deployment script
./scripts/deploy-auth.sh
```

### Step 2: Test the Endpoint

```bash
# Run automated tests
node tests/auth-test.js prod

# Manual test with curl
curl -X POST "https://it-era.pages.dev/admin/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@it-era.it","password":"admin123!"}'
```

## 🔧 Implementation Details

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/api/auth/login` | POST | User authentication |
| `/admin/api/auth/verify` | POST | Token verification |
| `/admin/api/auth/*` | OPTIONS | CORS preflight |

### Test Credentials

```json
{
  "email": "admin@it-era.it",
  "password": "admin123!"
}
```

### Response Format

**Successful Login:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-001",
    "email": "admin@it-era.it",
    "name": "IT-ERA Admin",
    "role": "admin",
    "avatar": "/assets/admin-avatar.png"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

## 🛠️ Configuration

### Environment Variables

Set these secrets using Wrangler:

```bash
# JWT signing secret
wrangler secret put JWT_SECRET --name it-era-admin-auth

# Optional: API rate limiting
wrangler secret put RATE_LIMIT_KEY --name it-era-admin-auth
```

### CORS Configuration

Pre-configured for:
- Origin: `https://it-era.pages.dev`
- Methods: `GET, POST, PUT, DELETE, OPTIONS`
- Headers: `Content-Type, Authorization, X-Requested-With`

## 🧪 Testing

### Automated Testing

```bash
# Test production endpoint
node tests/auth-test.js prod

# Test development endpoint
node tests/auth-test.js dev
```

### Manual Testing

1. **Login Test:**
   ```bash
   curl -X POST "https://it-era.pages.dev/admin/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@it-era.it","password":"admin123!"}'
   ```

2. **Token Verification:**
   ```bash
   curl -X POST "https://it-era.pages.dev/admin/api/auth/verify" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

3. **CORS Test:**
   ```bash
   curl -X OPTIONS "https://it-era.pages.dev/admin/api/auth/login" \
     -H "Origin: https://it-era.pages.dev" \
     -H "Access-Control-Request-Method: POST"
   ```

## 🔐 Security Features

- **JWT HS256 Signing**: Industry-standard token security
- **CORS Protection**: Prevents unauthorized cross-origin requests  
- **Input Validation**: Email and password validation
- **Secure Headers**: Proper HTTP security headers
- **Rate Limiting Ready**: Infrastructure for rate limiting

## 🚀 Next Steps

1. **Deploy the worker** using the provided script
2. **Test the endpoints** with the admin panel
3. **Update admin panel** frontend to use new authentication
4. **Add production users** to the database
5. **Configure monitoring** for the authentication service

## 📋 File Structure

```
/api/
├── src/auth/
│   └── auth-worker.js          # Main authentication worker
├── scripts/
│   └── deploy-auth.sh          # Deployment script
├── tests/
│   └── auth-test.js           # Comprehensive test suite
├── wrangler-auth.toml         # Cloudflare Workers config
└── docs/
    └── AUTH-DEPLOYMENT-GUIDE.md
```

## 🐛 Troubleshooting

### 404 Error Still Occurs
- Verify the worker is deployed to the correct route
- Check the Cloudflare Workers dashboard
- Ensure the route pattern matches: `it-era.pages.dev/admin/api/auth/*`

### Authentication Fails
- Check JWT_SECRET is properly configured
- Verify CORS headers are correct
- Test with the provided credentials

### CORS Issues
- Ensure the admin panel origin is whitelisted
- Check preflight OPTIONS requests are handled
- Verify all required headers are included

## 📞 Support

If you encounter issues:
1. Check the deployment logs: `wrangler tail --name it-era-admin-auth`
2. Test with the automated test suite: `node tests/auth-test.js`
3. Verify configuration: `wrangler whoami && wrangler secret list --name it-era-admin-auth`