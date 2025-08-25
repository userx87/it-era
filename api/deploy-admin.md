# IT-ERA Admin Panel Backend Deployment Guide

## Overview

Complete backend API for the IT-ERA admin panel with:
- JWT authentication with role-based access control
- Full CRUD operations for posts, categories, tags, media
- Analytics and reporting
- User management
- System settings
- Content calendar
- Webhooks integration

## Architecture

```
/api/src/admin/
├── index.js                 # Main admin API router
├── auth/
│   └── jwt-auth.js         # JWT authentication system
├── controllers/
│   ├── admin-dashboard.js  # Dashboard with statistics
│   ├── posts-controller.js # Posts CRUD operations
│   ├── categories-controller.js # Categories management
│   ├── tags-controller.js  # Tags management
│   ├── media-controller.js # File upload & management
│   ├── analytics-controller.js # Analytics & reporting
│   ├── users-controller.js # User management (admin)
│   ├── settings-controller.js # System configuration
│   ├── calendar-controller.js # Editorial calendar
│   └── webhooks-controller.js # Webhooks management
├── utils/
│   ├── cors.js            # CORS configuration
│   ├── validation.js      # Input validation
│   ├── crypto.js          # Password hashing & crypto
│   └── error-handler.js   # Centralized error handling
├── database/
│   └── schema.sql         # Complete database schema
└── blog-api.js           # Public blog API endpoints
```

## Database Setup

### 1. Create D1 Database

```bash
# Create the blog database
wrangler d1 create it-era-blog

# Add the database binding to wrangler.toml
[[d1_databases]]
binding = "BLOG_DB"
database_name = "it-era-blog"
database_id = "your-database-id-here"
```

### 2. Initialize Database Schema

```bash
# Initialize the database with the complete schema
wrangler d1 execute it-era-blog --file=src/admin/database/schema.sql

# For local development
wrangler d1 execute it-era-blog --local --file=src/admin/database/schema.sql
```

## Environment Variables

Add these secrets using Wrangler:

```bash
# JWT secret for token signing
wrangler secret put JWT_SECRET

# Email service configuration (optional)
wrangler secret put SENDGRID_API_KEY
wrangler secret put RESEND_API_KEY

# Webhook signing secret (optional)
wrangler secret put WEBHOOK_SECRET
```

## API Endpoints

### Authentication
```
POST /admin/api/login          # User login
POST /admin/api/register       # User registration (first user becomes admin)
GET  /admin/api/profile        # Get user profile
PUT  /admin/api/profile        # Update user profile
```

### Dashboard
```
GET  /admin/api/dashboard      # Dashboard overview with stats
GET  /admin/api/dashboard/stats # Detailed statistics
```

### Posts Management
```
GET    /admin/api/posts              # List posts (paginated, filtered)
GET    /admin/api/posts/:id          # Get single post
POST   /admin/api/posts              # Create new post
PUT    /admin/api/posts/:id          # Update post
DELETE /admin/api/posts/:id          # Delete post
POST   /admin/api/posts/:id/publish  # Publish post
POST   /admin/api/posts/:id/draft    # Set post to draft
```

### Categories & Tags
```
GET    /admin/api/categories         # List categories
POST   /admin/api/categories         # Create category
PUT    /admin/api/categories/:id     # Update category
DELETE /admin/api/categories/:id     # Delete category

GET    /admin/api/tags               # List tags
POST   /admin/api/tags               # Create tag
PUT    /admin/api/tags/:id           # Update tag
DELETE /admin/api/tags/:id           # Delete tag
```

### Media Management
```
GET    /admin/api/media              # List media files
POST   /admin/api/media              # Upload media file
PUT    /admin/api/media/:id          # Update media metadata
DELETE /admin/api/media/:id          # Delete media file
```

### Analytics
```
GET  /admin/api/analytics/overview   # Analytics overview
GET  /admin/api/analytics/posts      # Post analytics
GET  /admin/api/analytics/traffic    # Traffic analytics
```

### User Management (Admin Only)
```
GET    /admin/api/users              # List users
POST   /admin/api/users              # Create user
PUT    /admin/api/users/:id          # Update user
DELETE /admin/api/users/:id          # Delete user
```

### Settings (Admin Only)
```
GET  /admin/api/settings             # Get settings
PUT  /admin/api/settings             # Update settings
```

### Calendar
```
GET  /admin/api/calendar             # Get calendar events
POST /admin/api/calendar/events      # Create calendar event
PUT  /admin/api/calendar/events/:id  # Update calendar event
```

### Webhooks (Admin Only)
```
GET    /admin/api/webhooks           # List webhooks
POST   /admin/api/webhooks           # Create webhook
PUT    /admin/api/webhooks/:id       # Update webhook
DELETE /admin/api/webhooks/:id       # Delete webhook
```

## Public Blog API

Public endpoints for frontend consumption:

```
GET  /api/posts                      # List published posts
GET  /api/posts/:slug                # Get single post by slug
GET  /api/categories                 # List categories
GET  /api/tags                       # List tags
GET  /api/search?q=query             # Search posts
POST /api/track/view                 # Track page views
```

## Role-Based Access Control

### Roles:
- **admin**: Full access to all features
- **editor**: Can manage all content, limited user access
- **author**: Can only manage their own content

### Permissions:
- Authors can only see/edit their own posts
- Editors can manage all content and most settings
- Admins have full system access including user management

## Authentication Flow

1. **Login**: POST to `/admin/api/login` with email/password
2. **Token**: Receive JWT token valid for 24 hours
3. **Headers**: Include `Authorization: Bearer <token>` in requests
4. **Refresh**: Re-login when token expires

## File Upload

Media files are handled through the `/admin/api/media` endpoint:
- Supports images, documents, and other file types
- Files are validated for size and type
- Optional integration with Cloudflare R2 for storage

## Analytics Tracking

The system tracks:
- Page views and unique visitors
- Post performance metrics
- Traffic sources and user behavior
- Admin panel usage statistics

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": true,
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## CORS Configuration

CORS is configured to allow admin panel access:
- Allows all origins (configure for production)
- Supports all HTTP methods
- Includes necessary headers for authentication

## Deployment Steps

1. **Database Setup**:
   ```bash
   wrangler d1 create it-era-blog
   wrangler d1 execute it-era-blog --file=src/admin/database/schema.sql
   ```

2. **Configure Secrets**:
   ```bash
   wrangler secret put JWT_SECRET
   # Add your secure JWT secret
   ```

3. **Update wrangler.toml**:
   - Add database binding
   - Configure routes if needed

4. **Deploy**:
   ```bash
   wrangler deploy
   ```

5. **Test**:
   ```bash
   # Test health endpoint
   curl https://your-worker.your-subdomain.workers.dev/admin/api/health
   
   # Test login (use default admin credentials from schema.sql)
   curl -X POST https://your-worker.your-subdomain.workers.dev/admin/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@it-era.it","password":"admin123"}'
   ```

## Security Considerations

1. **Change Default Credentials**: Update the default admin password immediately
2. **JWT Secret**: Use a strong, unique JWT secret
3. **CORS**: Configure specific origins for production
4. **Input Validation**: All inputs are validated and sanitized
5. **Rate Limiting**: Consider adding rate limiting for production use

## Integration with Admin Panel

The admin panel at https://it-era.it/admin/ should be configured to use:
- API Base URL: `https://your-api-url/admin/api`
- Authentication: JWT tokens in Authorization header
- CORS: Ensure admin panel domain is allowed

## Monitoring and Maintenance

- Monitor API performance through Cloudflare analytics
- Check error logs regularly
- Update dependencies and security patches
- Backup database regularly using D1 export features

This backend provides a complete, production-ready API for the IT-ERA admin panel with comprehensive features for blog management, user administration, and content analytics.