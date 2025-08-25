# IT-ERA Security & JWT System - Deployment Guide

## 🛡️ Overview

This guide covers the deployment of the enterprise-grade security and JWT authentication system for IT-ERA. The system implements comprehensive security measures including advanced JWT management, rate limiting, session management, and DDoS protection.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    IT-ERA Security System                       │
├─────────────────────────────────────────────────────────────────┤
│  Cloudflare Workers (Edge)  │  KV Storage  │  Security Layers   │
├─────────────────────────────┼──────────────┼───────────────────────┤
│  • JWT Management           │  • Sessions  │  • Rate Limiting     │
│  • Authentication           │  • Tokens    │  • DDoS Protection   │
│  • Session Management       │  • Blacklist │  • Security Headers  │
│  • Rate Limiting            │  • Logs      │  • CORS Protection   │
│  • Encryption               │  • Metrics   │  • CSP Policies      │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Configure JWT Secrets

Generate and configure cryptographically secure secrets:

```bash
# Configure secrets for production
npm run configure-secrets:production

# Configure secrets for staging
npm run configure-secrets:staging

# Configure secrets for all environments
npm run configure-secrets:all
```

### 2. Deploy Authentication System

```bash
# Deploy to staging (recommended first)
npm run deploy:auth:staging

# Deploy to production
npm run deploy:auth:production

# Dry run (test without deploying)
npm run deploy:auth:dry-run
```

### 3. Verify Deployment

```bash
# Check health status
npm run health:auth:staging
npm run health:auth:production
```

## 🔐 Security Components

### JWT Security Manager (`jwt-config.js`)
- **Secure Token Generation**: Cryptographically secure 64-byte secrets
- **Advanced Validation**: Algorithm enforcement, blacklisting, anti-tampering
- **Token Lifecycle**: 15-minute access tokens, 7-day refresh tokens
- **Security Claims**: IP tracking, device fingerprinting, session correlation

### Rate Limiter (`rate-limiter.js`)
- **Multi-Layer Protection**: Basic, burst, DDoS, progressive penalties
- **Smart Detection**: Geographic impossibility, suspicious patterns
- **Adaptive Responses**: Progressive penalties, IP reputation scoring
- **Emergency Controls**: Whitelist management, emergency bypass

### Session Manager (`session-manager.js`)
- **Secure Sessions**: Cryptographically secure session IDs
- **Activity Monitoring**: IP changes, geographic impossibility
- **Concurrent Limits**: Maximum 3 sessions per user
- **Cleanup Automation**: Expired session removal, audit trails

### Encryption Utils (`encryption-utils.js`)
- **AES-GCM Encryption**: 256-bit keys with authenticated encryption
- **Data Protection**: PII encryption, session data protection
- **Key Management**: User-specific keys, secure key derivation
- **Integrity Verification**: Data checksums, tamper detection

## 🛠️ Manual Secret Configuration

If you need to configure secrets manually:

```bash
# Navigate to API directory
cd api

# Set JWT secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put JWT_REFRESH_SECRET
npx wrangler secret put ENCRYPTION_KEY

# Set additional security secrets
npx wrangler secret put CSRF_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler secret put WEBHOOK_SECRET
```

## 🌍 Environment Configuration

### Production Environment
- **Worker Name**: `it-era-auth-prod`
- **URL**: `https://auth.it-era.it`
- **CORS Origins**: `www.it-era.it`, `it-era.it`, `admin.it-era.it`
- **Security Level**: Maximum

### Staging Environment  
- **Worker Name**: `it-era-auth-staging`
- **URL**: `https://auth-staging.it-era.pages.dev`
- **CORS Origins**: Staging domains + production domains
- **Security Level**: High

### Development Environment
- **Worker Name**: `it-era-auth-dev`
- **URL**: `http://localhost:8787`
- **CORS Origins**: localhost ports
- **Security Level**: Relaxed for testing

## 📡 API Endpoints

### Authentication Endpoints

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@it-era.it",
  "password": "secure_password",
  "rememberMe": false
}
```

```http
POST /api/auth/refresh
Authorization: Bearer [refresh_token]
```

```http
GET /api/auth/verify
Authorization: Bearer [access_token]
```

```http
POST /api/auth/logout
Authorization: Bearer [access_token]
```

### Session Management

```http
GET /api/auth/sessions
Authorization: Bearer [access_token]
```

```http
DELETE /api/auth/sessions
Authorization: Bearer [access_token]
Content-Type: application/json

{
  "sessionId": "session_id_to_terminate"
}
```

### Security Status

```http
GET /api/auth/security-status
Authorization: Bearer [access_token]
```

## 🚦 Rate Limiting

The system implements multi-layer rate limiting:

| Action | Limit | Window | Penalty |
|--------|-------|--------|---------|
| Login | 5 attempts | 15 minutes | Progressive |
| API Calls | 100 requests | 1 hour | Standard |
| Token Requests | 10 requests | 5 minutes | Progressive |
| Burst Protection | 20 requests | 1 minute | Immediate |
| DDoS Protection | 1000 requests | 1 minute | 1-hour ban |

## 🔒 Security Headers

The system automatically adds comprehensive security headers:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'...
```

## 📊 Monitoring & Logging

### Security Events Logged
- Authentication attempts (success/failure)
- Rate limiting violations
- Suspicious activity detection
- Session lifecycle events
- Token operations
- Security policy violations

### Log Retention
- Security logs: 30 days
- Session logs: 7 days  
- Error logs: 7 days
- Audit trails: 90 days

### Performance Metrics
- Authentication latency
- Token validation time
- Rate limiting overhead
- Session lookup performance

## 🚨 Security Incident Response

### Automatic Responses
- **Failed Logins**: Progressive penalties, account lockout
- **DDoS Attacks**: Automatic IP banning, rate limiting
- **Suspicious Activity**: Session locking, security alerts
- **Token Compromise**: Blacklisting, forced re-authentication

### Manual Response Procedures
1. **Identify Threat**: Check security logs and metrics
2. **Assess Impact**: Determine scope and severity
3. **Contain Threat**: Block IPs, revoke tokens, lock accounts
4. **Investigate**: Analyze attack patterns and vectors
5. **Recover**: Restore services, update security measures
6. **Document**: Create incident report and lessons learned

## 🛡️ Security Audit Checklist

See [`api/src/security/security-audit.md`](api/src/security/security-audit.md) for the comprehensive security audit checklist covering:

- ✅ JWT Token Security
- ✅ Session Management  
- ✅ Rate Limiting & DDoS Protection
- ✅ Security Headers & CORS
- ✅ Data Protection & Encryption
- ✅ Monitoring & Alerting
- ✅ Configuration Security
- ✅ Incident Response

**Current Security Grade: A+**

## 🔧 Troubleshooting

### Common Issues

1. **Secret Configuration Fails**
   ```bash
   # Check if you're authenticated with Wrangler
   npx wrangler whoami
   
   # Login if needed
   npx wrangler login
   ```

2. **Deployment Fails**
   ```bash
   # Check wrangler configuration
   npx wrangler config list
   
   # Validate configuration file
   npx wrangler validate
   ```

3. **Rate Limiting Too Strict**
   - Check rate limiting logs
   - Adjust limits in rate-limiter.js
   - Use emergency bypass if needed

4. **CORS Issues**
   - Verify allowed origins in cors.js
   - Check origin header in requests
   - Ensure HTTPS in production

### Debug Mode

Enable debug logging by setting environment variables:

```bash
# In wrangler.toml
[vars]
DEBUG_MODE = "true"
LOG_LEVEL = "debug"
```

## 📞 Support

For security issues or deployment problems:

1. **Check Security Logs**: Review KV storage for security events
2. **Monitor Dashboard**: Use Cloudflare Workers dashboard
3. **Emergency Contact**: IT-ERA Security Team
4. **Documentation**: Refer to security audit checklist

## 🔄 Maintenance

### Regular Tasks
- **Secret Rotation**: Every 90 days
- **Security Audit**: Monthly
- **Log Review**: Weekly
- **Performance Monitoring**: Daily

### Updates
- **Security Patches**: As needed
- **Rate Limit Adjustments**: Based on usage patterns
- **CORS Updates**: When adding new domains
- **Encryption Updates**: Annually or as required

---

## 📋 Quick Reference

### Essential Commands
```bash
# Setup and deploy
npm run configure-secrets:production
npm run deploy:auth:production

# Monitor and maintain
npm run health:auth:production
npm run security:audit

# Emergency procedures
npx wrangler secret put EMERGENCY_BYPASS_KEY
node scripts/deploy-secure-auth.js rollback --env production
```

### Security Contacts
- **Security Team**: security@it-era.it
- **Emergency**: +39 039 888 2041
- **Documentation**: See security-audit.md

---

*This guide is maintained by the IT-ERA Security Team. Last updated: 2025-01-25*