# IT-ERA Blog System API Endpoints Specification

## API Base URL
Production: `https://it-era.it/api/v1`
Development: `http://localhost:3000/api/v1`

## Authentication
- **Public API**: No authentication required
- **Admin API**: JWT Bearer token required
- **Webhook API**: API key or signed requests for security

## Response Format Standards

### Success Response
```json
{
    "success": true,
    "data": {
        // Response data
    },
    "meta": {
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 100,
            "totalPages": 5,
            "hasNext": true,
            "hasPrev": false
        },
        "timestamp": "2024-08-24T10:30:00Z"
    }
}
```

### Error Response
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input data",
        "details": [
            {
                "field": "title",
                "message": "Title is required"
            }
        ]
    },
    "timestamp": "2024-08-24T10:30:00Z"
}
```

## 1. Public Blog API

### 1.1 Blog Posts

#### GET /api/v1/blog/posts
Get paginated list of published blog posts

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Posts per page (default: 12, max: 50)
- `category` (string): Filter by category slug
- `tag` (string): Filter by tag slug
- `featured` (boolean): Filter featured posts only
- `sort` (string): Sort order - `newest`, `oldest`, `popular` (default: newest)
- `search` (string): Full-text search query

**Response Example:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title": "Come Proteggere la Tua Azienda dai Cyberattacchi",
            "slug": "proteggere-azienda-cyberattacchi",
            "excerpt": "Guida completa per implementare strategie di sicurezza informatica efficaci nella tua azienda lombarda.",
            "featured_image": "https://cdn.it-era.it/blog/cyberattacchi-2024.jpg",
            "featured": true,
            "published_at": "2024-08-20T09:00:00Z",
            "reading_time": 8,
            "view_count": 1247,
            "author": {
                "name": "Marco Rossi",
                "avatar": "https://cdn.it-era.it/avatars/marco-rossi.jpg"
            },
            "categories": ["Sicurezza Informatica"],
            "tags": ["Antivirus", "Firewall", "Lombardia"],
            "meta_title": "Proteggere Azienda dai Cyberattacchi - Guida IT-ERA",
            "meta_description": "Scopri come proteggere la tua azienda dai cyberattacchi con le strategie di sicurezza informatica professionali di IT-ERA."
        }
    ],
    "meta": {
        "pagination": {
            "page": 1,
            "limit": 12,
            "total": 156,
            "totalPages": 13,
            "hasNext": true,
            "hasPrev": false
        }
    }
}
```

#### GET /api/v1/blog/posts/:slug
Get single blog post by slug

**Response Example:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "title": "Come Proteggere la Tua Azienda dai Cyberattacchi",
        "slug": "proteggere-azienda-cyberattacchi",
        "content": "<p>Il contenuto completo dell'articolo...</p>",
        "excerpt": "Guida completa per implementare...",
        "featured_image": "https://cdn.it-era.it/blog/cyberattacchi-2024.jpg",
        "published_at": "2024-08-20T09:00:00Z",
        "updated_at": "2024-08-21T14:30:00Z",
        "reading_time": 8,
        "view_count": 1247,
        "author": {
            "name": "Marco Rossi",
            "bio": "Esperto in sicurezza informatica con 15 anni di esperienza",
            "avatar": "https://cdn.it-era.it/avatars/marco-rossi.jpg"
        },
        "categories": [
            {
                "id": 2,
                "name": "Sicurezza Informatica",
                "slug": "sicurezza-informatica",
                "color": "#dc3545"
            }
        ],
        "tags": [
            {
                "id": 5,
                "name": "Antivirus",
                "slug": "antivirus"
            },
            {
                "id": 6,
                "name": "Firewall",
                "slug": "firewall"
            }
        ],
        "related_posts": [
            {
                "id": 15,
                "title": "Backup Aziendale: Strategie Vincenti",
                "slug": "backup-aziendale-strategie",
                "featured_image": "https://cdn.it-era.it/blog/backup-2024.jpg"
            }
        ],
        "meta_title": "Proteggere Azienda dai Cyberattacchi - Guida IT-ERA",
        "meta_description": "Scopri come proteggere la tua azienda...",
        "canonical_url": "https://it-era.it/blog/proteggere-azienda-cyberattacchi"
    }
}
```

#### GET /api/v1/blog/posts/featured
Get featured blog posts

**Query Parameters:**
- `limit` (number): Number of posts (default: 5, max: 10)

#### POST /api/v1/blog/posts/:id/view
Track post view for analytics

**Request Body:**
```json
{
    "referrer": "https://google.com",
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.1"
}
```

### 1.2 Categories

#### GET /api/v1/blog/categories
Get all categories with post counts

**Response Example:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Assistenza IT",
            "slug": "assistenza-it",
            "description": "Articoli su assistenza tecnica e supporto informatico",
            "color": "#0056cc",
            "icon": "fas fa-tools",
            "post_count": 45,
            "meta_title": "Assistenza IT - Guide e Consigli | IT-ERA",
            "meta_description": "Scopri guide e consigli per l'assistenza IT aziendale"
        }
    ]
}
```

#### GET /api/v1/blog/categories/:slug
Get posts by category

**Query Parameters:**
- `page`, `limit`, `sort` (same as posts endpoint)

### 1.3 Tags

#### GET /api/v1/blog/tags
Get all tags with usage counts

#### GET /api/v1/blog/tags/:slug
Get posts by tag

### 1.4 Search

#### GET /api/v1/blog/search
Full-text search across blog posts

**Query Parameters:**
- `q` (string, required): Search query
- `page`, `limit`, `category`, `tag` (filters)

**Response includes highlighted search terms:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title": "Come Proteggere la Tua <mark>Azienda</mark>...",
            "excerpt": "...implementare strategie per la tua <mark>azienda</mark>...",
            "relevance_score": 0.95
        }
    ]
}
```

### 1.5 Feeds & Sitemaps

#### GET /api/v1/blog/sitemap.xml
Generate XML sitemap for blog posts

#### GET /api/v1/blog/feed.xml
Generate RSS feed

#### GET /api/v1/blog/feed.json
Generate JSON feed

## 2. Admin API (Authentication Required)

### 2.1 Authentication

#### POST /api/v1/auth/login
Admin authentication

**Request Body:**
```json
{
    "email": "admin@it-era.it",
    "password": "securepassword"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g...",
        "expires_in": 3600,
        "user": {
            "id": 1,
            "username": "admin",
            "email": "admin@it-era.it",
            "role": "admin",
            "first_name": "IT",
            "last_name": "ERA"
        }
    }
}
```

#### POST /api/v1/auth/refresh
Refresh access token

**Request Body:**
```json
{
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

#### POST /api/v1/auth/logout
Logout and invalidate tokens

#### POST /api/v1/auth/forgot-password
Password reset request

#### POST /api/v1/auth/reset-password
Complete password reset

### 2.2 Posts Management

#### GET /api/v1/admin/posts
Get all posts (including drafts) with admin metadata

**Query Parameters:**
- `status` (string): Filter by status (draft, published, scheduled, archived)
- `author` (number): Filter by author ID
- `page`, `limit`, `search`, `category`, `tag`

**Response includes admin fields:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title": "Draft Post Title",
            "slug": "draft-post-title",
            "status": "draft",
            "created_at": "2024-08-24T10:00:00Z",
            "updated_at": "2024-08-24T15:30:00Z",
            "scheduled_at": null,
            "published_at": null,
            "author": {
                "id": 1,
                "name": "Admin User"
            },
            "seo_analysis": {
                "title_length": 45,
                "title_optimal": true,
                "meta_description_optimal": false,
                "content_length": 1200,
                "readability_score": 65
            },
            "analytics": {
                "total_views": 0,
                "unique_visitors": 0
            }
        }
    ]
}
```

#### POST /api/v1/admin/posts
Create new blog post

**Request Body:**
```json
{
    "title": "New Blog Post Title",
    "content": "<p>Blog post content here...</p>",
    "excerpt": "Short description of the post",
    "featured_image": "https://cdn.it-era.it/uploads/image.jpg",
    "status": "draft",
    "featured": false,
    "categories": [1, 2],
    "tags": [5, 8, 12],
    "meta_title": "Custom Meta Title",
    "meta_description": "Custom meta description for SEO",
    "canonical_url": "https://it-era.it/blog/custom-url",
    "scheduled_at": "2024-08-25T09:00:00Z"
}
```

#### GET /api/v1/admin/posts/:id
Get single post for editing (includes revisions)

#### PUT /api/v1/admin/posts/:id
Update existing post

#### DELETE /api/v1/admin/posts/:id
Delete post (moves to trash)

#### POST /api/v1/admin/posts/:id/publish
Publish draft or scheduled post immediately

#### POST /api/v1/admin/posts/:id/schedule
Schedule post for future publication

**Request Body:**
```json
{
    "scheduled_at": "2024-08-25T09:00:00Z"
}
```

#### POST /api/v1/admin/posts/:id/duplicate
Create copy of existing post

#### POST /api/v1/admin/posts/bulk-action
Perform bulk actions on multiple posts

**Request Body:**
```json
{
    "action": "publish|unpublish|delete|archive",
    "post_ids": [1, 2, 3, 4]
}
```

### 2.3 Categories Management

#### GET /api/v1/admin/categories
Get all categories with detailed statistics

#### POST /api/v1/admin/categories
Create new category

**Request Body:**
```json
{
    "name": "New Category",
    "description": "Category description",
    "color": "#ff6b35",
    "icon": "fas fa-laptop",
    "parent_id": null,
    "meta_title": "SEO title for category",
    "meta_description": "SEO description for category"
}
```

#### PUT /api/v1/admin/categories/:id
Update category

#### DELETE /api/v1/admin/categories/:id
Delete category (moves posts to uncategorized or reassigns)

#### POST /api/v1/admin/categories/reorder
Reorder categories for display

**Request Body:**
```json
{
    "category_orders": [
        {"id": 1, "display_order": 1},
        {"id": 2, "display_order": 2}
    ]
}
```

### 2.4 Tags Management

#### GET /api/v1/admin/tags
Get all tags with usage statistics

#### POST /api/v1/admin/tags
Create new tag

#### PUT /api/v1/admin/tags/:id
Update tag

#### DELETE /api/v1/admin/tags/:id
Delete tag (removes from posts)

#### POST /api/v1/admin/tags/merge
Merge multiple tags into one

**Request Body:**
```json
{
    "source_tag_ids": [5, 8, 12],
    "target_tag_id": 3
}
```

### 2.5 Media Management

#### GET /api/v1/admin/media
Get media library files

**Query Parameters:**
- `type` (string): Filter by MIME type (image, video, document)
- `search` (string): Search filenames
- `page`, `limit`

#### POST /api/v1/admin/media/upload
Upload new media file

**Request:** Multipart form with file upload

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 15,
        "filename": "blog-image-2024.jpg",
        "file_url": "https://cdn.it-era.it/uploads/blog-image-2024.jpg",
        "file_size": 245760,
        "width": 1200,
        "height": 800,
        "mime_type": "image/jpeg"
    }
}
```

#### PUT /api/v1/admin/media/:id
Update media metadata (alt text, caption)

#### DELETE /api/v1/admin/media/:id
Delete media file

### 2.6 Comments Management (Optional)

#### GET /api/v1/admin/comments
Get all comments with moderation status

#### PUT /api/v1/admin/comments/:id
Update comment status (approve, reject, spam)

#### DELETE /api/v1/admin/comments/:id
Delete comment

#### POST /api/v1/admin/comments/bulk-action
Bulk approve/reject/delete comments

### 2.7 Analytics & Reports

#### GET /api/v1/admin/analytics/overview
Dashboard overview statistics

**Response:**
```json
{
    "success": true,
    "data": {
        "posts": {
            "total": 156,
            "published": 134,
            "drafts": 15,
            "scheduled": 7
        },
        "views": {
            "total": 45230,
            "this_month": 8945,
            "last_month": 7823,
            "growth": 14.3
        },
        "popular_posts": [
            {
                "id": 5,
                "title": "Backup Cloud per Aziende",
                "views": 2340
            }
        ],
        "top_categories": [
            {
                "name": "Sicurezza Informatica",
                "post_count": 45,
                "views": 15670
            }
        ]
    }
}
```

#### GET /api/v1/admin/analytics/posts/:id
Detailed analytics for specific post

#### GET /api/v1/admin/analytics/traffic
Traffic analytics with sources and demographics

#### GET /api/v1/admin/analytics/search-terms
Most searched terms and keywords

#### GET /api/v1/admin/analytics/export
Export analytics data (CSV, JSON)

### 2.8 SEO Tools

#### POST /api/v1/admin/seo/analyze-post
Analyze post SEO and provide recommendations

**Request Body:**
```json
{
    "post_id": 15
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "score": 85,
        "recommendations": [
            {
                "type": "warning",
                "message": "Meta description is too short (95 characters)",
                "suggestion": "Expand to 120-160 characters for better SEO"
            },
            {
                "type": "success",
                "message": "Title length is optimal (48 characters)"
            }
        ],
        "keywords": {
            "primary": "assistenza IT Milano",
            "density": 2.1,
            "suggestions": ["supporto tecnico", "IT aziendale"]
        }
    }
}
```

#### GET /api/v1/admin/seo/sitemap/regenerate
Regenerate and update XML sitemap

#### GET /api/v1/admin/seo/meta-audit
Audit all posts for missing/poor SEO elements

### 2.9 User Management

#### GET /api/v1/admin/users
Get all blog users

#### POST /api/v1/admin/users
Create new user

#### PUT /api/v1/admin/users/:id
Update user profile

#### DELETE /api/v1/admin/users/:id
Deactivate user account

### 2.10 Settings

#### GET /api/v1/admin/settings
Get all blog settings

#### PUT /api/v1/admin/settings
Update blog settings

**Request Body:**
```json
{
    "blog_title": "Blog IT-ERA",
    "posts_per_page": 12,
    "allow_comments": true,
    "moderate_comments": true,
    "seo_auto_generate": true
}
```

## 3. n8n Webhook Integration

### 3.1 Content Automation

#### POST /api/v1/webhooks/n8n/auto-publish
Automatically publish scheduled posts

**Authentication:** API Key or signed request

**Request Body:**
```json
{
    "api_key": "your-webhook-api-key",
    "trigger": "scheduled_check",
    "timestamp": "2024-08-24T10:00:00Z"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "published_posts": [
            {
                "id": 25,
                "title": "Post Published Automatically",
                "published_at": "2024-08-24T10:00:00Z"
            }
        ],
        "count": 1
    }
}
```

#### POST /api/v1/webhooks/n8n/seo-check
Trigger SEO analysis for posts

**Request Body:**
```json
{
    "post_ids": [1, 2, 3],
    "analysis_type": "full|basic"
}
```

#### POST /api/v1/webhooks/n8n/social-share
Auto-share published posts to social media

**Request Body:**
```json
{
    "post_id": 15,
    "platforms": ["facebook", "linkedin", "twitter"],
    "custom_message": "Check out our latest blog post!"
}
```

#### POST /api/v1/webhooks/n8n/backup
Trigger content backup

**Request Body:**
```json
{
    "backup_type": "full|incremental",
    "include_media": true
}
```

#### POST /api/v1/webhooks/n8n/analytics-sync
Sync analytics data with external services

**Request Body:**
```json
{
    "service": "google_analytics|facebook_pixel",
    "date_range": "last_7_days|last_30_days"
}
```

### 3.2 Content Workflow Triggers

#### POST /api/v1/webhooks/n8n/post-published
Triggered when a post is published (outgoing webhook)

#### POST /api/v1/webhooks/n8n/comment-submitted
Triggered when a comment is submitted

#### POST /api/v1/webhooks/n8n/high-traffic-alert
Triggered when a post receives unusually high traffic

## 4. Error Codes

### Authentication Errors
- `AUTH_REQUIRED` (401): Authentication token required
- `AUTH_INVALID` (401): Invalid or expired token
- `AUTH_FORBIDDEN` (403): Insufficient permissions

### Validation Errors
- `VALIDATION_ERROR` (400): Request validation failed
- `DUPLICATE_SLUG` (409): Post slug already exists
- `REQUIRED_FIELD` (400): Required field missing

### Resource Errors
- `POST_NOT_FOUND` (404): Blog post not found
- `CATEGORY_NOT_FOUND` (404): Category not found
- `TAG_NOT_FOUND` (404): Tag not found

### Server Errors
- `DATABASE_ERROR` (500): Database operation failed
- `EXTERNAL_SERVICE_ERROR` (502): n8n webhook or external service error
- `RATE_LIMIT_EXCEEDED` (429): Too many requests

## 5. Rate Limiting

- **Public API**: 100 requests per minute per IP
- **Admin API**: 1000 requests per minute per user
- **Webhook API**: 50 requests per minute per API key

## 6. Caching Headers

- **Public posts**: `Cache-Control: public, max-age=900` (15 minutes)
- **Individual posts**: `Cache-Control: public, max-age=3600` (1 hour)
- **Categories/Tags**: `Cache-Control: public, max-age=1800` (30 minutes)
- **Admin API**: `Cache-Control: no-cache, no-store`