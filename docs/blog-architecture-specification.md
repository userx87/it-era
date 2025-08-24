# IT-ERA Blog System Architecture Specification

## Overview
Complete architectural design for IT-ERA's blog system with SEO-optimized content management, n8n integration, and scalable infrastructure.

## 1. Database Schema Design (PostgreSQL)

### Core Tables

#### 1.1 blog_posts
```sql
CREATE TABLE blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
    featured_image VARCHAR(500),
    featured BOOLEAN DEFAULT FALSE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- SEO Fields
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    canonical_url VARCHAR(500),
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    reading_time INTEGER, -- in minutes
    
    -- Content Management
    version INTEGER DEFAULT 1,
    language VARCHAR(5) DEFAULT 'it',
    
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX idx_blog_posts_featured ON blog_posts(featured, status);
```

#### 1.2 categories
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50), -- Font Awesome icon class
    parent_id INTEGER REFERENCES categories(id),
    display_order INTEGER DEFAULT 0,
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_category_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
```

#### 1.3 tags
```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7),
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_tag_slug CHECK (slug ~ '^[a-z0-9-]+$')
);
```

#### 1.4 users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'author')),
    bio TEXT,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Authentication
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE
);
```

#### 1.5 post_categories (Many-to-Many)
```sql
CREATE TABLE post_categories (
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);
```

#### 1.6 post_tags (Many-to-Many)
```sql
CREATE TABLE post_tags (
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);
```

#### 1.7 comments (Optional)
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id),
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    author_website VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_post_status ON comments(post_id, status);
```

#### 1.8 blog_analytics
```sql
CREATE TABLE blog_analytics (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES blog_posts(id),
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    avg_time_on_page INTEGER, -- seconds
    referrer_domain VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(post_id, date)
);
```

### Database Views for Performance

#### 1.9 Published Posts View
```sql
CREATE VIEW published_posts AS
SELECT 
    p.*,
    u.first_name || ' ' || u.last_name as author_name,
    u.avatar_url as author_avatar,
    ARRAY_AGG(DISTINCT c.name) as categories,
    ARRAY_AGG(DISTINCT t.name) as tags
FROM blog_posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN post_categories pc ON p.id = pc.post_id
LEFT JOIN categories c ON pc.category_id = c.id
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
WHERE p.status = 'published'
GROUP BY p.id, u.first_name, u.last_name, u.avatar_url;
```

## 2. API Architecture

### 2.1 Backend Technology Stack
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **File Upload**: Cloudinary or local storage
- **Validation**: Joi or Zod
- **Rate Limiting**: express-rate-limit
- **Caching**: Redis

### 2.2 API Endpoints Structure

#### Public API Endpoints
```javascript
// Blog Posts
GET    /api/v1/blog/posts                 // List published posts (paginated)
GET    /api/v1/blog/posts/:slug           // Get single post by slug
GET    /api/v1/blog/posts/featured        // Get featured posts
GET    /api/v1/blog/categories            // List all categories
GET    /api/v1/blog/categories/:slug      // Get posts by category
GET    /api/v1/blog/tags                  // List all tags
GET    /api/v1/blog/tags/:slug            // Get posts by tag
GET    /api/v1/blog/search                // Search posts
POST   /api/v1/blog/posts/:id/view        // Track post view
GET    /api/v1/blog/sitemap               // XML sitemap
GET    /api/v1/blog/rss                   // RSS feed
```

#### Admin API Endpoints
```javascript
// Authentication
POST   /api/v1/auth/login                 // Admin login
POST   /api/v1/auth/logout                // Admin logout
POST   /api/v1/auth/refresh               // Refresh access token
POST   /api/v1/auth/forgot-password       // Password reset request
POST   /api/v1/auth/reset-password        // Password reset

// Posts Management
GET    /api/v1/admin/posts                // List all posts (with drafts)
POST   /api/v1/admin/posts                // Create new post
GET    /api/v1/admin/posts/:id            // Get post for editing
PUT    /api/v1/admin/posts/:id            // Update post
DELETE /api/v1/admin/posts/:id            // Delete post
POST   /api/v1/admin/posts/:id/publish    // Publish post
POST   /api/v1/admin/posts/:id/schedule   // Schedule post
POST   /api/v1/admin/posts/bulk-action    // Bulk operations

// Categories Management
GET    /api/v1/admin/categories           // List categories
POST   /api/v1/admin/categories           // Create category
PUT    /api/v1/admin/categories/:id       // Update category
DELETE /api/v1/admin/categories/:id       // Delete category

// Tags Management
GET    /api/v1/admin/tags                 // List tags
POST   /api/v1/admin/tags                 // Create tag
PUT    /api/v1/admin/tags/:id             // Update tag
DELETE /api/v1/admin/tags/:id             // Delete tag

// Media Management
POST   /api/v1/admin/media/upload         // Upload images
GET    /api/v1/admin/media                // List uploaded media
DELETE /api/v1/admin/media/:id            // Delete media

// Analytics
GET    /api/v1/admin/analytics/overview   // Dashboard metrics
GET    /api/v1/admin/analytics/posts      // Post performance
GET    /api/v1/admin/analytics/traffic    // Traffic analytics
```

#### n8n Webhook Endpoints
```javascript
// Content Automation
POST   /api/v1/webhooks/n8n/auto-publish // Auto-publish scheduled posts
POST   /api/v1/webhooks/n8n/seo-check    // SEO validation webhook
POST   /api/v1/webhooks/n8n/social-share // Social media sharing
POST   /api/v1/webhooks/n8n/backup       // Content backup
POST   /api/v1/webhooks/n8n/analytics    // Analytics data sync
```

### 2.3 API Response Format
```javascript
// Success Response
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
            "totalPages": 5
        }
    }
}

// Error Response
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
    }
}
```

## 3. Frontend Architecture

### 3.1 Technology Stack
- **Framework**: Vanilla JavaScript or Alpine.js for lightweight interaction
- **Styling**: Tailwind CSS (consistent with IT-ERA design)
- **Build Tool**: Vite or Webpack
- **SEO**: Server-side rendering or static generation
- **Rich Text Editor**: Quill.js or TinyMCE for admin

### 3.2 Public Blog Structure

#### 3.2.1 Blog Homepage (`/blog`)
```html
<!-- /web/blog/index.html -->
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog IT-ERA - Novità su Assistenza IT e Sicurezza Informatica</title>
    <meta name="description" content="Scopri gli ultimi aggiornamenti su assistenza IT, sicurezza informatica e cloud storage. Guide pratiche e consigli per aziende in Lombardia.">
    <!-- Schema.org markup -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Blog IT-ERA",
        "description": "Blog su assistenza IT e sicurezza informatica"
    }
    </script>
</head>
<body>
    <!-- Navigation Component -->
    <div id="navigation-container"></div>
    
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div class="container mx-auto px-4">
            <h1 class="text-4xl font-bold mb-4">Blog IT-ERA</h1>
            <p class="text-xl">Aggiornamenti su assistenza IT, sicurezza informatica e tecnologia</p>
        </div>
    </section>
    
    <!-- Featured Posts -->
    <section id="featured-posts" class="py-12">
        <!-- Dynamic content -->
    </section>
    
    <!-- Recent Posts Grid -->
    <section id="recent-posts" class="py-12">
        <!-- Dynamic content -->
    </section>
    
    <!-- Categories Sidebar -->
    <aside id="categories-sidebar">
        <!-- Dynamic content -->
    </aside>
    
    <!-- Footer Component -->
    <div id="footer-container"></div>
    
    <script src="/js/blog-public.js"></script>
</body>
</html>
```

#### 3.2.2 Individual Post Template (`/blog/:slug`)
```html
<!-- Template for individual blog posts -->
<!DOCTYPE html>
<html lang="it">
<head>
    <!-- Dynamic meta tags from database -->
    <title>{{post.meta_title || post.title}}</title>
    <meta name="description" content="{{post.meta_description || post.excerpt}}">
    <link rel="canonical" href="{{post.canonical_url}}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="{{post.title}}">
    <meta property="og:description" content="{{post.excerpt}}">
    <meta property="og:image" content="{{post.featured_image}}">
    <meta property="og:type" content="article">
    
    <!-- Article Schema -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "{{post.title}}",
        "description": "{{post.excerpt}}",
        "author": {
            "@type": "Person",
            "name": "{{post.author_name}}"
        },
        "datePublished": "{{post.created_at}}",
        "dateModified": "{{post.updated_at}}",
        "image": "{{post.featured_image}}"
    }
    </script>
</head>
<body>
    <!-- Navigation -->
    <div id="navigation-container"></div>
    
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
        <a href="/">Home</a> > 
        <a href="/blog">Blog</a> > 
        <span>{{post.title}}</span>
    </nav>
    
    <!-- Article -->
    <article class="blog-post">
        <header>
            <h1>{{post.title}}</h1>
            <div class="post-meta">
                <span class="author">{{post.author_name}}</span>
                <time datetime="{{post.created_at}}">{{formatted_date}}</time>
                <span class="reading-time">{{post.reading_time}} min di lettura</span>
            </div>
            <img src="{{post.featured_image}}" alt="{{post.title}}" class="featured-image">
        </header>
        
        <div class="post-content">
            {{post.content}}
        </div>
        
        <footer class="post-footer">
            <div class="tags">
                {{#each post.tags}}
                <a href="/blog/tag/{{this.slug}}" class="tag">{{this.name}}</a>
                {{/each}}
            </div>
            
            <div class="categories">
                {{#each post.categories}}
                <a href="/blog/category/{{this.slug}}" class="category">{{this.name}}</a>
                {{/each}}
            </div>
        </footer>
    </article>
    
    <!-- Related Posts -->
    <section id="related-posts">
        <!-- Dynamic content -->
    </section>
    
    <!-- Comments Section (if enabled) -->
    <section id="comments">
        <!-- Dynamic content -->
    </section>
    
    <div id="footer-container"></div>
    
    <script>
        // Track page view
        fetch('/api/v1/blog/posts/{{post.id}}/view', { method: 'POST' });
    </script>
</body>
</html>
```

### 3.3 Admin Panel Structure

#### 3.3.1 Admin Dashboard (`/admin`)
```javascript
// Admin SPA structure
const adminApp = {
    routes: {
        '/admin': 'Dashboard',
        '/admin/posts': 'PostsList',
        '/admin/posts/new': 'PostEditor',
        '/admin/posts/:id/edit': 'PostEditor',
        '/admin/categories': 'CategoriesManager',
        '/admin/tags': 'TagsManager',
        '/admin/media': 'MediaLibrary',
        '/admin/analytics': 'Analytics',
        '/admin/settings': 'Settings'
    },
    
    components: {
        Dashboard: {
            template: `
                <div class="dashboard">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>Posts Pubblicati</h3>
                            <span class="stat-number">{{publishedCount}}</span>
                        </div>
                        <div class="stat-card">
                            <h3>Bozze</h3>
                            <span class="stat-number">{{draftsCount}}</span>
                        </div>
                        <div class="stat-card">
                            <h3>Visualizzazioni Totali</h3>
                            <span class="stat-number">{{totalViews}}</span>
                        </div>
                    </div>
                    <div class="recent-activity">
                        <!-- Recent posts, comments, etc. -->
                    </div>
                </div>
            `
        },
        
        PostEditor: {
            template: `
                <form class="post-editor">
                    <div class="editor-header">
                        <input type="text" v-model="post.title" placeholder="Titolo del post">
                        <button @click="saveDraft">Salva Bozza</button>
                        <button @click="publish" class="btn-primary">Pubblica</button>
                    </div>
                    
                    <div class="editor-main">
                        <div class="content-editor">
                            <div id="quill-editor"></div>
                        </div>
                        
                        <div class="sidebar">
                            <!-- SEO Settings -->
                            <div class="panel">
                                <h3>SEO</h3>
                                <input v-model="post.meta_title" placeholder="Meta Title">
                                <textarea v-model="post.meta_description" placeholder="Meta Description"></textarea>
                                <input v-model="post.canonical_url" placeholder="Canonical URL">
                            </div>
                            
                            <!-- Categories & Tags -->
                            <div class="panel">
                                <h3>Categorie</h3>
                                <select v-model="post.categories" multiple>
                                    <option v-for="cat in categories" :value="cat.id">{{cat.name}}</option>
                                </select>
                            </div>
                            
                            <!-- Featured Image -->
                            <div class="panel">
                                <h3>Immagine in Evidenza</h3>
                                <div class="image-upload">
                                    <input type="file" @change="uploadImage">
                                    <img v-if="post.featured_image" :src="post.featured_image">
                                </div>
                            </div>
                            
                            <!-- Publishing Options -->
                            <div class="panel">
                                <h3>Pubblicazione</h3>
                                <select v-model="post.status">
                                    <option value="draft">Bozza</option>
                                    <option value="published">Pubblicato</option>
                                    <option value="scheduled">Programmato</option>
                                </select>
                                
                                <input v-if="post.status === 'scheduled'" 
                                       type="datetime-local" 
                                       v-model="post.scheduled_at">
                                
                                <label>
                                    <input type="checkbox" v-model="post.featured">
                                    Post in evidenza
                                </label>
                            </div>
                        </div>
                    </div>
                </form>
            `
        }
    }
};
```

## 4. Integration Points

### 4.1 n8n Webhook Integration

#### 4.1.1 Auto-Publishing Workflow
```javascript
// n8n workflow for scheduled publishing
const autoPublishWorkflow = {
    trigger: {
        type: 'cron',
        expression: '*/15 * * * *' // Every 15 minutes
    },
    
    nodes: [
        {
            name: 'Check Scheduled Posts',
            type: 'http-request',
            parameters: {
                url: 'https://it-era.it/api/v1/admin/posts?status=scheduled&due=true',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer {{$node["Get Token"].json["token"]}}'
                }
            }
        },
        
        {
            name: 'Publish Posts',
            type: 'http-request',
            parameters: {
                url: 'https://it-era.it/api/v1/webhooks/n8n/auto-publish',
                method: 'POST',
                body: {
                    posts: '{{$node["Check Scheduled Posts"].json["data"]}}'
                }
            }
        },
        
        {
            name: 'Notify Admin',
            type: 'email',
            parameters: {
                to: 'info@it-era.it',
                subject: 'Posts pubblicati automaticamente',
                body: 'Sono stati pubblicati {{$node["Publish Posts"].json["published_count"]}} posts.'
            }
        }
    ]
};
```

#### 4.1.2 SEO Analysis Webhook
```javascript
// SEO analysis workflow
const seoAnalysisWorkflow = {
    trigger: {
        type: 'webhook',
        path: '/seo-check'
    },
    
    nodes: [
        {
            name: 'Analyze Content',
            type: 'function',
            code: `
                const post = items[0].json;
                
                // SEO Analysis
                const analysis = {
                    title_length: post.title.length,
                    title_optimal: post.title.length >= 30 && post.title.length <= 60,
                    
                    meta_description_length: post.meta_description?.length || 0,
                    meta_description_optimal: post.meta_description && 
                                            post.meta_description.length >= 120 && 
                                            post.meta_description.length <= 160,
                    
                    content_length: post.content.replace(/<[^>]*>/g, '').length,
                    content_optimal: post.content.replace(/<[^>]*>/g, '').length >= 300,
                    
                    has_featured_image: !!post.featured_image,
                    
                    readability_score: calculateReadability(post.content)
                };
                
                return [{ json: analysis }];
            `
        },
        
        {
            name: 'Update SEO Score',
            type: 'http-request',
            parameters: {
                url: 'https://it-era.it/api/v1/admin/posts/{{$node["Trigger"].json["post_id"]}}/seo',
                method: 'PUT',
                body: {
                    seo_analysis: '{{$node["Analyze Content"].json}}'
                }
            }
        }
    ]
};
```

### 4.2 SEO Optimization Features

#### 4.2.1 Automatic Meta Generation
```javascript
class SEOOptimizer {
    static generateMetaTitle(post) {
        const baseTitle = post.title;
        const cityKeywords = this.extractCityKeywords(post.content);
        const serviceKeywords = this.extractServiceKeywords(post.content);
        
        let metaTitle = baseTitle;
        
        if (cityKeywords.length > 0) {
            metaTitle += ` - ${cityKeywords[0]}`;
        }
        
        if (metaTitle.length <= 45) {
            metaTitle += ' | IT-ERA';
        }
        
        return metaTitle.substring(0, 60);
    }
    
    static generateMetaDescription(post) {
        let description = post.excerpt || 
                         this.extractFirstParagraph(post.content) ||
                         post.content.replace(/<[^>]*>/g, '').substring(0, 140);
        
        // Add call-to-action
        if (description.length < 130) {
            description += ' Contatta IT-ERA per assistenza professionale.';
        }
        
        return description.substring(0, 160);
    }
    
    static generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ñ]/g, 'n')
            .replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }
    
    static calculateReadingTime(content) {
        const wordsPerMinute = 200;
        const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }
}
```

#### 4.2.2 Sitemap Generation
```javascript
// Automatic sitemap generation
class SitemapGenerator {
    static async generateSitemap() {
        const posts = await BlogPost.findAll({
            where: { status: 'published' },
            order: [['updated_at', 'DESC']]
        });
        
        const categories = await Category.findAll();
        const tags = await Tag.findAll({ where: { usage_count: { [Op.gt]: 0 } } });
        
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Blog Homepage -->
    <url>
        <loc>https://it-era.it/blog</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`;
        
        // Add blog posts
        posts.forEach(post => {
            sitemap += `
    <url>
        <loc>https://it-era.it/blog/${post.slug}</loc>
        <lastmod>${post.updated_at.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`;
        });
        
        // Add categories
        categories.forEach(category => {
            sitemap += `
    <url>
        <loc>https://it-era.it/blog/category/${category.slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>`;
        });
        
        // Add tags
        tags.forEach(tag => {
            sitemap += `
    <url>
        <loc>https://it-era.it/blog/tag/${tag.slug}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>`;
        });
        
        sitemap += '\n</urlset>';
        
        return sitemap;
    }
}
```

### 4.3 Content Scheduling System

#### 4.3.1 Scheduling Logic
```javascript
class ContentScheduler {
    static async schedulePost(postId, scheduledAt) {
        await BlogPost.update(
            { 
                status: 'scheduled',
                scheduled_at: scheduledAt 
            },
            { where: { id: postId } }
        );
        
        // Trigger n8n workflow
        await this.triggerN8nWorkflow('auto-publish-check');
    }
    
    static async publishScheduledPosts() {
        const now = new Date();
        
        const scheduledPosts = await BlogPost.findAll({
            where: {
                status: 'scheduled',
                scheduled_at: { [Op.lte]: now }
            }
        });
        
        for (const post of scheduledPosts) {
            await this.publishPost(post.id);
            
            // Log publication
            console.log(`Published scheduled post: ${post.title}`);
            
            // Send notification
            await this.notifyPublication(post);
        }
        
        return scheduledPosts.length;
    }
    
    static async publishPost(postId) {
        await BlogPost.update(
            { 
                status: 'published',
                published_at: new Date()
            },
            { where: { id: postId } }
        );
        
        // Update tag usage counts
        await this.updateTagUsage(postId);
        
        // Generate/update sitemap
        await SitemapGenerator.generateAndSave();
        
        // Clear cache
        await CacheManager.clearBlogCache();
    }
}
```

## 5. File Structure Recommendations

```
/blog-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── auth.js
│   │   │   └── cloudinary.js
│   │   ├── controllers/
│   │   │   ├── blog.controller.js
│   │   │   ├── admin.controller.js
│   │   │   ├── auth.controller.js
│   │   │   └── webhook.controller.js
│   │   ├── models/
│   │   │   ├── BlogPost.js
│   │   │   ├── Category.js
│   │   │   ├── Tag.js
│   │   │   ├── User.js
│   │   │   └── Comment.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   ├── rateLimit.middleware.js
│   │   │   └── cache.middleware.js
│   │   ├── routes/
│   │   │   ├── blog.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── auth.routes.js
│   │   │   └── webhook.routes.js
│   │   ├── services/
│   │   │   ├── blog.service.js
│   │   │   ├── seo.service.js
│   │   │   ├── media.service.js
│   │   │   ├── analytics.service.js
│   │   │   └── cache.service.js
│   │   ├── utils/
│   │   │   ├── slugify.js
│   │   │   ├── seo-optimizer.js
│   │   │   ├── content-scheduler.js
│   │   │   └── sitemap-generator.js
│   │   └── app.js
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── schema.sql
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   ├── blog/
│   │   │   ├── index.html
│   │   │   ├── post.html
│   │   │   ├── category.html
│   │   │   └── tag.html
│   │   └── admin/
│   │       ├── index.html
│   │       ├── login.html
│   │       └── dashboard.html
│   ├── src/
│   │   ├── js/
│   │   │   ├── blog/
│   │   │   │   ├── blog-public.js
│   │   │   │   ├── post-viewer.js
│   │   │   │   └── search.js
│   │   │   └── admin/
│   │   │       ├── admin-app.js
│   │   │       ├── post-editor.js
│   │   │       ├── media-manager.js
│   │   │       └── analytics.js
│   │   ├── css/
│   │   │   ├── blog.css
│   │   │   └── admin.css
│   │   └── components/
│   │       ├── rich-text-editor/
│   │       ├── image-upload/
│   │       └── seo-panel/
│   ├── build/
│   └── package.json
├── n8n-workflows/
│   ├── auto-publish.json
│   ├── seo-analysis.json
│   ├── social-sharing.json
│   └── backup.json
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
└── docs/
    ├── api-documentation.md
    ├── deployment-guide.md
    └── user-manual.md
```

## 6. Performance & Caching Strategy

### 6.1 Database Optimization
- **Indexes**: All frequently queried columns
- **Connection Pooling**: PgBouncer for production
- **Read Replicas**: For analytics and reporting
- **Query Optimization**: Use EXPLAIN ANALYZE

### 6.2 Caching Layers
```javascript
// Redis caching strategy
const cacheStrategy = {
    // Page-level caching
    blogHomepage: { ttl: 900 }, // 15 minutes
    blogPost: { ttl: 3600 }, // 1 hour
    categoryPages: { ttl: 1800 }, // 30 minutes
    
    // Data-level caching
    publishedPosts: { ttl: 600 }, // 10 minutes
    categories: { ttl: 3600 }, // 1 hour
    tags: { ttl: 3600 }, // 1 hour
    
    // Analytics caching
    postViews: { ttl: 300 }, // 5 minutes
    popularPosts: { ttl: 1800 } // 30 minutes
};
```

### 6.3 CDN Strategy
- **Static Assets**: Images, CSS, JS via Cloudinary/CloudFlare
- **Blog Images**: Optimized and resized automatically
- **Cache Headers**: Proper HTTP caching headers

This architecture provides a scalable, SEO-optimized blog system that integrates seamlessly with IT-ERA's existing infrastructure while providing powerful content management capabilities and automation through n8n integration.