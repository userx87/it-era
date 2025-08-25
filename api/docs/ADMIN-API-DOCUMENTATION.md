# IT-ERA Admin API Documentation

## Overview

The IT-ERA Admin API provides comprehensive endpoints for managing the admin panel, including authentication, content management, user administration, and analytics.

**Base URL:** `https://it-era.it/admin/api`

## Authentication

All protected endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Getting a Token

Use the login endpoint to obtain a JWT token:

```bash
curl -X POST https://it-era.it/admin/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@it-era.it","password":"admin123"}'
```

## Endpoints

### 🔐 Authentication Endpoints

#### Health Check
```
GET /admin/api/auth/health
```

Returns system health and available endpoints.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "IT-ERA Admin API",
    "version": "1.0.0",
    "environment": "production",
    "timestamp": "2024-08-25T10:30:00Z",
    "endpoints": {
      "authentication": {
        "login": "POST /admin/api/auth/login",
        "verify": "GET /admin/api/auth/verify"
      },
      "management": {
        "dashboard": "GET /admin/api/dashboard",
        "posts": "GET|POST /admin/api/posts",
        "media": "GET|POST /admin/api/media",
        "users": "GET|POST /admin/api/users",
        "settings": "GET|PUT /admin/api/settings",
        "analytics": "GET /admin/api/analytics"
      }
    }
  }
}
```

#### Login
```
POST /admin/api/auth/login
```

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@it-era.it",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin-001",
      "username": "admin",
      "email": "admin@it-era.it",
      "name": "IT-ERA Administrator",
      "role": "admin",
      "avatar": "/assets/admin-avatar.png",
      "permissions": ["read", "write", "delete", "manage_users", "manage_settings"]
    }
  }
}
```

#### Verify Token
```
GET /admin/api/auth/verify
Authorization: Bearer <token>
```

Verify JWT token validity and get user information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "admin-001",
      "email": "admin@it-era.it",
      "name": "IT-ERA Administrator",
      "role": "admin"
    },
    "permissions": ["read", "write", "delete", "manage_users", "manage_settings"]
  }
}
```

### 📊 Dashboard Endpoint

#### Get Dashboard Data
```
GET /admin/api/dashboard
Authorization: Bearer <token>
```

Get dashboard statistics and recent activity.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "posts": {
        "total": 2,
        "published": 1,
        "draft": 1,
        "scheduled": 0
      },
      "media": {
        "total": 2,
        "total_size": 444192,
        "images": 2
      },
      "users": {
        "total": 2,
        "admins": 1,
        "editors": 1,
        "active": 2
      },
      "analytics": {
        "total_views": 2140,
        "avg_views": 1070,
        "top_post": "Sicurezza Informatica per PMI: Guida Completa 2024"
      }
    },
    "recent_activity": [
      {
        "type": "post_created",
        "message": "New post: \"Sicurezza Informatica per PMI: Guida Completa 2024\" created",
        "user": "IT-ERA Administrator",
        "timestamp": "2024-08-20T10:00:00Z"
      }
    ],
    "quick_actions": [
      {"name": "Create Post", "url": "/admin/posts/new", "icon": "plus"},
      {"name": "Upload Media", "url": "/admin/media/upload", "icon": "upload"}
    ]
  }
}
```

### 📝 Posts Management

#### Get Posts
```
GET /admin/api/posts
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `status` (string) - Filter by status: published, draft, scheduled
- `search` (string) - Search in title, content, and tags

**Example:**
```bash
GET /admin/api/posts?page=1&limit=10&status=published&search=sicurezza
```

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "Sicurezza Informatica per PMI: Guida Completa 2024",
        "slug": "sicurezza-informatica-pmi-guida-2024",
        "excerpt": "Guida completa alla sicurezza informatica per PMI nel 2024",
        "author_name": "IT-ERA Administrator",
        "status": "published",
        "category": "Sicurezza",
        "tags": ["sicurezza", "pmi", "cybersecurity"],
        "views": 1250,
        "created_at": "2024-08-20T10:00:00Z",
        "published_at": "2024-08-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### Create Post
```
POST /admin/api/posts
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "New Blog Post",
  "slug": "new-blog-post",
  "content": "Post content here...",
  "excerpt": "Brief description",
  "status": "draft",
  "category": "Technology",
  "tags": ["tech", "guide"],
  "featured_image": "/assets/images/post-image.jpg",
  "seo_title": "SEO optimized title",
  "meta_description": "SEO meta description",
  "focus_keyword": "main keyword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Post created successfully",
    "post": {
      "id": 3,
      "title": "New Blog Post",
      "slug": "new-blog-post",
      "status": "draft",
      "author_id": "admin-001",
      "created_at": "2024-08-25T10:30:00Z"
    }
  }
}
```

#### Update Post
```
PUT /admin/api/posts/{id}
Authorization: Bearer <token>
```

**Request Body:** Same as create post

#### Delete Post
```
DELETE /admin/api/posts/{id}
Authorization: Bearer <token>
```

### 🖼️ Media Management

#### Get Media
```
GET /admin/api/media
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `type` (string) - Filter by MIME type prefix: image, application

**Response:**
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": 1,
        "filename": "sicurezza-pmi.jpg",
        "original_name": "sicurezza-informatica-pmi.jpg",
        "url": "/assets/images/sicurezza-pmi.jpg",
        "type": "image/jpeg",
        "size": 245760,
        "width": 1200,
        "height": 675,
        "alt": "Sicurezza informatica per PMI",
        "uploaded_at": "2024-08-20T09:45:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "pages": 1
    }
  }
}
```

#### Upload Media
```
POST /admin/api/media
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (file) - The file to upload
- `alt` (string, optional) - Alt text for images

**Supported Types:**
- Images: JPEG, PNG, GIF, WebP (max 10MB)
- Documents: PDF, plain text (max 10MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "File uploaded successfully",
    "media": {
      "id": 3,
      "filename": "upload_1635789012345.jpg",
      "original_name": "my-image.jpg",
      "url": "/assets/uploads/upload_1635789012345.jpg",
      "type": "image/jpeg",
      "size": 524288
    }
  }
}
```

### 👥 User Management (Admin Only)

#### Get Users
```
GET /admin/api/users
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "admin-001",
        "username": "admin",
        "email": "admin@it-era.it",
        "name": "IT-ERA Administrator",
        "role": "admin",
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": "2024-08-25T10:30:00Z",
        "is_active": true
      }
    ]
  }
}
```

#### Create User
```
POST /admin/api/users
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "email": "newuser@it-era.it",
  "password": "securepassword123",
  "name": "New User",
  "role": "editor",
  "username": "newuser"
}
```

### ⚙️ Settings Management (Admin Only)

#### Get Settings
```
GET /admin/api/settings
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "site": {
        "title": "IT-ERA Blog",
        "description": "Il blog ufficiale di IT-ERA",
        "url": "https://it-era.it/blog",
        "logo": "/assets/logo.png"
      },
      "seo": {
        "google_analytics_id": "G-XXXXXXXXXX",
        "default_meta_description": "IT-ERA - Soluzioni informatiche professionali"
      },
      "security": {
        "max_login_attempts": 5,
        "session_timeout": 86400,
        "require_2fa": false
      }
    }
  }
}
```

#### Update Settings
```
PUT /admin/api/settings
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "site": {
    "title": "Updated Blog Title",
    "description": "Updated description"
  },
  "seo": {
    "google_analytics_id": "G-NEWTRACKINGID"
  }
}
```

### 📈 Analytics

#### Get Analytics
```
GET /admin/api/analytics
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (string) - Time period: 7d, 30d, 90d (default: 7d)
- `metric` (string) - Specific metric or 'all' (default: all)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_views": 2140,
      "unique_visitors": 1450,
      "page_views": 3200,
      "bounce_rate": 0.32,
      "avg_session_duration": 185
    },
    "posts_performance": [
      {
        "id": 1,
        "title": "Sicurezza Informatica per PMI: Guida Completa 2024",
        "views": 1250,
        "engagement_rate": 0.75
      }
    ],
    "traffic_sources": [
      {"source": "Organic Search", "visits": 820, "percentage": 45.2},
      {"source": "Direct", "visits": 520, "percentage": 28.7}
    ],
    "time_series": {
      "views": [120, 156, 189, 234, 201, 178, 234, 267, 189, 145, 198, 234, 278, 256],
      "visitors": [98, 123, 145, 178, 165, 134, 189, 201, 145, 112, 156, 178, 201, 189]
    }
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-08-25T10:30:00Z"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (endpoint/resource not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

- **General endpoints:** 100 requests per hour per IP
- **Authentication endpoints:** 5 requests per minute per IP
- **File upload endpoints:** 10 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635789012
```

## Security Features

### CORS
CORS is configured to allow requests from:
- `https://it-era.it`
- `https://www.it-era.it`
- `https://it-era.it`
- Development domains (localhost)

### Security Headers
All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`

### JWT Security
- Tokens expire after 24 hours
- HS256 algorithm with secure secret
- Payload includes user permissions

## Development Testing

### Test Users
```
Admin User:
- Email: admin@it-era.it
- Password: admin123
- Role: admin

Editor User:
- Email: editor@it-era.it
- Password: editor123
- Role: editor
```

### cURL Examples

**Login:**
```bash
curl -X POST https://it-era.it/admin/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@it-era.it","password":"admin123"}'
```

**Get Dashboard (with token):**
```bash
curl -X GET https://it-era.it/admin/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Post:**
```bash
curl -X POST https://it-era.it/admin/api/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "content": "This is a test post content",
    "status": "draft"
  }'
```

## Deployment

1. **Deploy the worker:**
   ```bash
   cd /path/to/api
   ./scripts/deploy-admin-api.sh production
   ```

2. **Set production secrets:**
   ```bash
   wrangler secret put JWT_SECRET --name it-era-admin-api
   wrangler secret put ENCRYPTION_KEY --name it-era-admin-api
   ```

3. **Configure KV namespaces and D1 database in wrangler-admin-api.toml**

## Support

For technical support or questions about the Admin API, contact the development team or refer to the main project documentation.

---

**Last Updated:** August 25, 2024  
**API Version:** 1.0.0