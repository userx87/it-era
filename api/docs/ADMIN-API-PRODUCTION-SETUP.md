# IT-ERA Admin API - Production Setup Guide

## Overview

This guide covers the complete setup and deployment of the IT-ERA Admin API to production, including security configuration, environment variables, and monitoring.

## Prerequisites

1. **Cloudflare Workers Account** with appropriate permissions
2. **Wrangler CLI** installed and authenticated
3. **Node.js** 18+ for local testing
4. **Domain access** for IT-ERA (it-era.pages.dev)

## Environment Variables & Secrets

### Required Secrets (Production)

Set these secrets using `wrangler secret put`:

```bash
# Navigate to the api directory
cd /Users/andreapanzeri/progetti/IT-ERA/api

# Set JWT secret (use a strong 256-bit key)
wrangler secret put JWT_SECRET --name it-era-admin-api

# Set encryption key for sensitive data
wrangler secret put ENCRYPTION_KEY --name it-era-admin-api

# Optional: Set internal API key for service-to-service communication
wrangler secret put API_KEY --name it-era-admin-api
```

### Generating Secure Keys

```bash
# Generate JWT secret (256-bit)
openssl rand -base64 32

# Generate encryption key
openssl rand -hex 32

# Generate API key
openssl rand -base64 24
```

### Environment Variables (wrangler-admin-api.toml)

These are already configured in the TOML file:

```toml
[env.production.vars]
ENVIRONMENT = "production"
API_URL = "https://it-era.pages.dev"
ADMIN_URL = "https://it-era.pages.dev/admin"
SERVICE_NAME = "IT-ERA Admin API"
VERSION = "1.0.0"
```

## KV Namespaces Setup

### Create KV Namespaces

```bash
# Create sessions namespace
wrangler kv:namespace create "ADMIN_SESSIONS"
wrangler kv:namespace create "ADMIN_SESSIONS" --preview

# Create rate limiting namespace
wrangler kv:namespace create "RATE_LIMITS"
wrangler kv:namespace create "RATE_LIMITS" --preview
```

### Update wrangler-admin-api.toml

Replace the placeholder IDs with actual namespace IDs:

```toml
[[kv_namespaces]]
binding = "ADMIN_SESSIONS"
id = "your-actual-sessions-namespace-id"
preview_id = "your-actual-sessions-preview-id"

[[kv_namespaces]]
binding = "RATE_LIMITS"
id = "your-actual-rate-limits-namespace-id"
preview_id = "your-actual-rate-limits-preview-id"
```

## D1 Database Setup (Optional for Future Enhancement)

### Create D1 Database

```bash
# Create production database
wrangler d1 create it-era-admin

# Create preview database
wrangler d1 create it-era-admin-preview
```

### Update wrangler-admin-api.toml

```toml
[[d1_databases]]
binding = "ADMIN_DB"
database_name = "it-era-admin"
database_id = "your-actual-database-id"
preview_database_id = "your-actual-preview-database-id"
```

### Database Schema (Future Use)

```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor',
    avatar TEXT,
    permissions TEXT, -- JSON array
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Posts table
CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    category TEXT,
    tags TEXT, -- JSON array
    featured_image TEXT,
    seo_title TEXT,
    meta_description TEXT,
    focus_keyword TEXT,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    FOREIGN KEY (author_id) REFERENCES users (id)
);

-- Media table
CREATE TABLE media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    alt TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
);

-- Settings table
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL, -- JSON
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
    FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Sessions table (for persistent sessions)
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Analytics events table
CREATE TABLE analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    event_data TEXT, -- JSON
    user_id TEXT,
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## R2 Bucket Setup (Optional for Media Storage)

### Create R2 Bucket

```bash
# Create media bucket
wrangler r2 bucket create it-era-media

# Create preview bucket
wrangler r2 bucket create it-era-media-preview
```

### Update wrangler-admin-api.toml

```toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "it-era-media"
preview_bucket_name = "it-era-media-preview"
```

## Deployment Steps

### 1. Validate Configuration

```bash
# Check wrangler configuration
wrangler config list

# Validate worker syntax
node -c src/admin/admin-api-worker-complete.js

# Test worker locally (optional)
wrangler dev --config wrangler-admin-api.toml --port 8787
```

### 2. Deploy to Production

```bash
# Use the deployment script
./scripts/deploy-admin-api.sh production

# Or deploy manually
wrangler deploy --config wrangler-admin-api.toml --env production
```

### 3. Verify Deployment

```bash
# Test health endpoint
curl https://it-era.pages.dev/admin/api/auth/health

# Test login
curl -X POST https://it-era.pages.dev/admin/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@it-era.it","password":"admin123"}'
```

## Security Configuration

### 1. Update Default Users

**CRITICAL**: Change default passwords immediately after deployment:

```javascript
// In production, replace TEST_USERS with database-backed authentication
// or at minimum change the default passwords
const TEST_USERS = {
  'admin@it-era.it': {
    // ... other fields
    password: 'NEW_SECURE_PASSWORD_HERE' // Change this!
  }
};
```

### 2. CORS Configuration

Verify CORS origins in the worker configuration:

```javascript
const CONFIG = {
  ALLOWED_ORIGINS: [
    'https://it-era.pages.dev',
    'https://www.it-era.it',
    'https://it-era.it'
    // Remove localhost entries in production
  ]
};
```

### 3. Rate Limiting

The API includes built-in rate limiting:
- General endpoints: 100 requests/hour per IP
- Auth endpoints: 5 requests/minute per IP
- Upload endpoints: 10 requests/minute per user

### 4. Security Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`

## Monitoring & Logging

### 1. Cloudflare Analytics

Enable Worker Analytics in the Cloudflare dashboard:
- Go to Workers & Pages
- Select your worker
- Navigate to Observability tab
- Enable analytics and logging

### 2. Custom Logging

The worker includes structured logging:

```javascript
// Example log entries
console.log('🔐 User login:', { userId, email, timestamp });
console.log('📊 API request:', { endpoint, method, responseTime });
console.error('❌ Error:', { error, context, timestamp });
```

### 3. Health Monitoring

Set up monitoring for the health endpoint:

```bash
# Example with curl and cron
*/5 * * * * curl -f https://it-era.pages.dev/admin/api/auth/health || echo "API Down"
```

## Performance Optimization

### 1. Caching Strategy

- JWT tokens cached for 24 hours
- Dashboard data can be cached for 5 minutes
- Static settings cached for 1 hour

### 2. Database Queries (When Using D1)

- Use prepared statements
- Implement connection pooling
- Add appropriate indexes

### 3. Response Optimization

- Compress large responses
- Paginate data endpoints
- Use appropriate HTTP caching headers

## Backup & Recovery

### 1. Database Backups (When Using D1)

```bash
# Export database
wrangler d1 export it-era-admin --output backup-$(date +%Y%m%d).sql

# Restore database
wrangler d1 execute it-era-admin --file backup-20240825.sql
```

### 2. Configuration Backups

- Store `wrangler-admin-api.toml` in version control
- Document all environment variables
- Keep secrets in secure storage

### 3. Disaster Recovery

1. **Worker Re-deployment**: Use deployment script
2. **Database Recovery**: Restore from latest backup
3. **Secret Recovery**: Re-set all secrets from secure storage

## Maintenance Tasks

### Daily
- Monitor error logs
- Check performance metrics
- Review security alerts

### Weekly
- Update dependencies
- Review access logs
- Test backup procedures

### Monthly
- Security audit
- Performance review
- Documentation updates

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate CORS origins

2. **Rate Limiting Issues**
   - Check KV namespace configuration
   - Review rate limit thresholds
   - Monitor IP addresses

3. **Database Connection Issues**
   - Verify D1 binding configuration
   - Check database permissions
   - Review connection limits

### Debug Mode

Enable debug logging by setting environment variable:

```bash
wrangler secret put DEBUG_MODE --name it-era-admin-api
# Set value to "true"
```

## Support Contacts

- **Technical Issues**: Development Team
- **Security Concerns**: Security Team
- **Infrastructure**: DevOps Team

---

**Last Updated**: August 25, 2024
**Document Version**: 1.0.0