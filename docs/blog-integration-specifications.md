# IT-ERA Blog System Integration Specifications

## n8n Webhook Integration & Automation Workflows

### 1. n8n Workflow Configurations

#### 1.1 Auto-Publishing Workflow
**Trigger:** Cron Schedule (every 15 minutes)
**Purpose:** Automatically publish scheduled blog posts

```json
{
    "name": "IT-ERA Blog Auto-Publish",
    "nodes": [
        {
            "name": "Scheduler",
            "type": "n8n-nodes-base.cron",
            "parameters": {
                "rule": {
                    "interval": [{"field": "minute", "interval": 15}]
                }
            }
        },
        {
            "name": "Get Scheduled Posts",
            "type": "n8n-nodes-base.httpRequest",
            "parameters": {
                "url": "https://it-era.it/api/v1/webhooks/n8n/scheduled-posts",
                "method": "GET",
                "headers": {
                    "Authorization": "Bearer {{$env.BLOG_API_TOKEN}}",
                    "Content-Type": "application/json"
                }
            }
        },
        {
            "name": "Check Posts Due",
            "type": "n8n-nodes-base.if",
            "parameters": {
                "conditions": {
                    "number": [
                        {
                            "value1": "{{$json.data.length}}",
                            "operation": "larger",
                            "value2": 0
                        }
                    ]
                }
            }
        },
        {
            "name": "Publish Posts",
            "type": "n8n-nodes-base.httpRequest",
            "parameters": {
                "url": "https://it-era.it/api/v1/webhooks/n8n/auto-publish",
                "method": "POST",
                "body": {
                    "posts": "{{$node['Get Scheduled Posts'].json.data}}",
                    "timestamp": "{{new Date().toISOString()}}"
                }
            }
        },
        {
            "name": "Update Sitemap",
            "type": "n8n-nodes-base.httpRequest",
            "parameters": {
                "url": "https://it-era.it/api/v1/admin/seo/sitemap/regenerate",
                "method": "POST"
            }
        },
        {
            "name": "Send Notification",
            "type": "n8n-nodes-base.emailSend",
            "parameters": {
                "to": "info@it-era.it",
                "subject": "Posts pubblicati automaticamente",
                "text": "Sono stati pubblicati {{$node['Publish Posts'].json.published_count}} posts sul blog IT-ERA.",
                "html": "<h2>Pubblicazione Automatica Blog</h2><p>Sono stati pubblicati <strong>{{$node['Publish Posts'].json.published_count}}</strong> posts.</p><ul>{{#each $node['Publish Posts'].json.published_posts}}<li><a href='https://it-era.it/blog/{{this.slug}}'>{{this.title}}</a></li>{{/each}}</ul>"
            }
        }
    ],
    "connections": {
        "Scheduler": { "main": [["Get Scheduled Posts"]] },
        "Get Scheduled Posts": { "main": [["Check Posts Due"]] },
        "Check Posts Due": { 
            "main": [
                ["Publish Posts"],
                []
            ]
        },
        "Publish Posts": { "main": [["Update Sitemap", "Send Notification"]] }
    }
}
```

#### 1.2 SEO Analysis Workflow
**Trigger:** Webhook on post creation/update
**Purpose:** Analyze content for SEO optimization

```json
{
    "name": "IT-ERA Blog SEO Analysis",
    "nodes": [
        {
            "name": "Webhook Trigger",
            "type": "n8n-nodes-base.webhook",
            "parameters": {
                "path": "blog-seo-check",
                "httpMethod": "POST",
                "responseMode": "responseNode"
            }
        },
        {
            "name": "Extract Post Data",
            "type": "n8n-nodes-base.function",
            "parameters": {
                "functionCode": `
                const post = items[0].json;
                
                // Clean HTML content for analysis
                const cleanContent = post.content.replace(/<[^>]*>/g, '');
                const wordCount = cleanContent.split(/\\s+/).length;
                
                // Analyze title
                const titleLength = post.title.length;
                const titleOptimal = titleLength >= 30 && titleLength <= 60;
                
                // Analyze meta description
                const metaDescLength = (post.meta_description || '').length;
                const metaDescOptimal = metaDescLength >= 120 && metaDescLength <= 160;
                
                // Extract keywords (simple frequency analysis)
                const words = cleanContent.toLowerCase()
                    .replace(/[^a-zA-Z\\s]/g, '')
                    .split(/\\s+/)
                    .filter(word => word.length > 3);
                    
                const wordFreq = {};
                words.forEach(word => {
                    wordFreq[word] = (wordFreq[word] || 0) + 1;
                });
                
                const topKeywords = Object.entries(wordFreq)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([word, freq]) => ({word, frequency: freq}));
                
                // Calculate readability score (simplified Flesch-Kincaid)
                const sentences = cleanContent.split(/[.!?]+/).length;
                const syllables = cleanContent.match(/[aeiouy]+/gi)?.length || 0;
                const readabilityScore = 206.835 - (1.015 * (wordCount / sentences)) - (84.6 * (syllables / wordCount));
                
                const analysis = {
                    post_id: post.id,
                    title_analysis: {
                        length: titleLength,
                        optimal: titleOptimal,
                        recommendation: titleOptimal ? 'Lunghezza ottimale' : 
                            titleLength < 30 ? 'Titolo troppo corto (min 30 caratteri)' : 'Titolo troppo lungo (max 60 caratteri)'
                    },
                    meta_description_analysis: {
                        length: metaDescLength,
                        optimal: metaDescOptimal,
                        recommendation: !post.meta_description ? 'Meta description mancante' :
                            metaDescOptimal ? 'Lunghezza ottimale' :
                            metaDescLength < 120 ? 'Meta description troppo corta (min 120 caratteri)' : 
                            'Meta description troppo lunga (max 160 caratteri)'
                    },
                    content_analysis: {
                        word_count: wordCount,
                        optimal: wordCount >= 300,
                        recommendation: wordCount < 300 ? 'Contenuto troppo breve (min 300 parole)' : 'Lunghezza contenuto appropriata'
                    },
                    readability: {
                        score: Math.round(readabilityScore),
                        level: readabilityScore > 90 ? 'Molto facile' :
                               readabilityScore > 80 ? 'Facile' :
                               readabilityScore > 70 ? 'Medio' :
                               readabilityScore > 60 ? 'Difficile' : 'Molto difficile'
                    },
                    keywords: topKeywords,
                    images: {
                        has_featured: !!post.featured_image,
                        recommendation: !post.featured_image ? 'Aggiungi immagine in evidenza' : 'Immagine presente'
                    },
                    overall_score: Math.round((
                        (titleOptimal ? 20 : 10) +
                        (metaDescOptimal ? 20 : post.meta_description ? 10 : 0) +
                        (wordCount >= 300 ? 20 : 10) +
                        (post.featured_image ? 20 : 0) +
                        (readabilityScore > 60 ? 20 : 10)
                    ))
                };
                
                return [{ json: analysis }];
                `
            }
        },
        {
            "name": "Check IT-ERA Keywords",
            "type": "n8n-nodes-base.function",
            "parameters": {
                "functionCode": `
                const analysis = items[0].json;
                const content = $node["Webhook Trigger"].json.content.toLowerCase();
                const title = $node["Webhook Trigger"].json.title.toLowerCase();
                
                // IT-ERA specific keywords
                const itEraKeywords = [
                    'assistenza it', 'sicurezza informatica', 'cloud storage',
                    'it-era', 'lombardia', 'milano', 'monza', 'bergamo', 'como',
                    'backup', 'server', 'rete', 'antivirus', 'firewall'
                ];
                
                const foundKeywords = itEraKeywords.filter(keyword => 
                    content.includes(keyword) || title.includes(keyword)
                );
                
                const missingKeywords = itEraKeywords.filter(keyword => 
                    !content.includes(keyword) && !title.includes(keyword)
                );
                
                analysis.it_era_keywords = {
                    found: foundKeywords,
                    missing: missingKeywords.slice(0, 5), // Show top 5 suggestions
                    density: foundKeywords.length / itEraKeywords.length,
                    recommendation: foundKeywords.length < 3 ? 
                        'Aggiungi più parole chiave IT-ERA specifiche' : 
                        'Buona ottimizzazione per parole chiave IT-ERA'
                };
                
                // Update overall score based on IT-ERA keywords
                if (foundKeywords.length >= 3) {
                    analysis.overall_score = Math.min(100, analysis.overall_score + 10);
                }
                
                return [{ json: analysis }];
                `
            }
        },
        {
            "name": "Save SEO Analysis",
            "type": "n8n-nodes-base.httpRequest",
            "parameters": {
                "url": "https://it-era.it/api/v1/admin/posts/{{$node['Webhook Trigger'].json.id}}/seo-analysis",
                "method": "PUT",
                "body": "={{$json}}",
                "headers": {
                    "Authorization": "Bearer {{$env.BLOG_API_TOKEN}}",
                    "Content-Type": "application/json"
                }
            }
        },
        {
            "name": "Generate Recommendations",
            "type": "n8n-nodes-base.function",
            "parameters": {
                "functionCode": `
                const analysis = $node["Check IT-ERA Keywords"].json;
                
                const recommendations = [];
                
                // Title recommendations
                if (!analysis.title_analysis.optimal) {
                    recommendations.push({
                        type: 'title',
                        priority: 'high',
                        message: analysis.title_analysis.recommendation
                    });
                }
                
                // Meta description recommendations
                if (!analysis.meta_description_analysis.optimal) {
                    recommendations.push({
                        type: 'meta_description',
                        priority: 'high',
                        message: analysis.meta_description_analysis.recommendation
                    });
                }
                
                // Content recommendations
                if (!analysis.content_analysis.optimal) {
                    recommendations.push({
                        type: 'content',
                        priority: 'medium',
                        message: analysis.content_analysis.recommendation
                    });
                }
                
                // Image recommendations
                if (!analysis.images.has_featured) {
                    recommendations.push({
                        type: 'images',
                        priority: 'medium',
                        message: analysis.images.recommendation
                    });
                }
                
                // Keyword recommendations
                if (analysis.it_era_keywords.found.length < 3) {
                    recommendations.push({
                        type: 'keywords',
                        priority: 'high',
                        message: analysis.it_era_keywords.recommendation,
                        suggestions: analysis.it_era_keywords.missing
                    });
                }
                
                // Readability recommendations
                if (analysis.readability.score < 60) {
                    recommendations.push({
                        type: 'readability',
                        priority: 'medium',
                        message: 'Semplifica il linguaggio per migliorare la leggibilità'
                    });
                }
                
                return [{
                    json: {
                        post_id: analysis.post_id,
                        overall_score: analysis.overall_score,
                        recommendations: recommendations,
                        analysis_complete: true,
                        timestamp: new Date().toISOString()
                    }
                }];
                `
            }
        },
        {
            "name": "Send SEO Report",
            "type": "n8n-nodes-base.emailSend",
            "parameters": {
                "to": "{{$node['Webhook Trigger'].json.author_email}}",
                "cc": "info@it-era.it",
                "subject": "Analisi SEO: {{$node['Webhook Trigger'].json.title}}",
                "html": `
                <h2>Analisi SEO Completata</h2>
                <p><strong>Post:</strong> {{$node['Webhook Trigger'].json.title}}</p>
                <p><strong>Punteggio SEO:</strong> {{$node['Generate Recommendations'].json.overall_score}}/100</p>
                
                <h3>Raccomandazioni:</h3>
                <ul>
                {{#each $node['Generate Recommendations'].json.recommendations}}
                <li><strong>{{this.type}}:</strong> {{this.message}}
                {{#if this.suggestions}}
                <br><em>Suggerimenti: {{join this.suggestions ', '}}</em>
                {{/if}}
                </li>
                {{/each}}
                </ul>
                
                <p><a href="https://it-era.it/admin/posts/{{$node['Webhook Trigger'].json.id}}/edit">Modifica Post</a></p>
                `
            }
        },
        {
            "name": "Webhook Response",
            "type": "n8n-nodes-base.respondToWebhook",
            "parameters": {
                "respondWith": "json",
                "responseBody": "={{$node['Generate Recommendations'].json}}"
            }
        }
    ]
}
```

#### 1.3 Social Media Sharing Workflow
**Trigger:** Webhook on post publication
**Purpose:** Automatically share new posts on social media

```json
{
    "name": "IT-ERA Blog Social Sharing",
    "nodes": [
        {
            "name": "Post Published Webhook",
            "type": "n8n-nodes-base.webhook",
            "parameters": {
                "path": "post-published",
                "httpMethod": "POST"
            }
        },
        {
            "name": "Generate Social Content",
            "type": "n8n-nodes-base.function",
            "parameters": {
                "functionCode": `
                const post = items[0].json;
                const baseUrl = 'https://it-era.it';
                const postUrl = baseUrl + '/blog/' + post.slug;
                
                // Generate platform-specific content
                const socialContent = {
                    linkedin: {
                        message: post.title + '\\n\\n' + 
                                post.excerpt + '\\n\\n' +
                                'Scopri di più sul nostro blog: ' + postUrl + '\\n\\n' +
                                '#AssistenzaIT #SicurezzaInformatica #ITLombardia #ITERA',
                        url: postUrl,
                        image: post.featured_image
                    },
                    facebook: {
                        message: '🔧 Nuovo articolo sul blog IT-ERA!\\n\\n' + 
                                post.title + '\\n\\n' + 
                                post.excerpt.substring(0, 200) + '...\\n\\n' +
                                'Leggi l\\'articolo completo ➡️ ' + postUrl,
                        url: postUrl,
                        image: post.featured_image
                    },
                    twitter: {
                        message: '📝 ' + post.title + '\\n\\n' + 
                                (post.excerpt.length > 180 ? 
                                post.excerpt.substring(0, 180) + '...' : 
                                post.excerpt) + '\\n\\n' + postUrl + 
                                ' #AssistenzaIT #ITLombardia',
                        url: postUrl,
                        image: post.featured_image
                    }
                };
                
                return [{ json: { post, socialContent } }];
                `
            }
        },
        {
            "name": "Share on LinkedIn",
            "type": "n8n-nodes-base.linkedIn",
            "parameters": {
                "operation": "post",
                "text": "={{$json.socialContent.linkedin.message}}",
                "shareUrl": "={{$json.socialContent.linkedin.url}}",
                "imageUrl": "={{$json.socialContent.linkedin.image}}"
            }
        },
        {
            "name": "Share on Facebook",
            "type": "n8n-nodes-base.facebook",
            "parameters": {
                "operation": "post",
                "message": "={{$json.socialContent.facebook.message}}",
                "link": "={{$json.socialContent.facebook.url}}",
                "picture": "={{$json.socialContent.facebook.image}}"
            }
        },
        {
            "name": "Share on Twitter",
            "type": "n8n-nodes-base.twitter",
            "parameters": {
                "operation": "tweet",
                "text": "={{$json.socialContent.twitter.message}}",
                "media": "={{$json.socialContent.twitter.image}}"
            }
        },
        {
            "name": "Log Social Sharing",
            "type": "n8n-nodes-base.httpRequest",
            "parameters": {
                "url": "https://it-era.it/api/v1/webhooks/n8n/social-log",
                "method": "POST",
                "body": {
                    "post_id": "={{$json.post.id}}",
                    "platforms": ["linkedin", "facebook", "twitter"],
                    "shared_at": "={{new Date().toISOString()}}",
                    "linkedin_result": "={{$node['Share on LinkedIn'].json}}",
                    "facebook_result": "={{$node['Share on Facebook'].json}}",
                    "twitter_result": "={{$node['Share on Twitter'].json}}"
                }
            }
        }
    ]
}
```

### 2. SEO Optimization Features

#### 2.1 Automatic Meta Tag Generation
```javascript
class SEOOptimizer {
    // Generate optimized meta title
    static generateMetaTitle(post) {
        let title = post.title;
        
        // Add location keywords if detected in content
        const locationKeywords = this.extractLocationKeywords(post.content);
        if (locationKeywords.length > 0 && title.length <= 45) {
            title += ` - ${locationKeywords[0]}`;
        }
        
        // Add brand if space allows
        if (title.length <= 50) {
            title += ' | IT-ERA';
        }
        
        return title.substring(0, 60);
    }
    
    // Generate optimized meta description
    static generateMetaDescription(post) {
        let description = post.excerpt || this.extractFirstSentence(post.content);
        
        // Ensure minimum length
        if (description.length < 120) {
            description += ' Scopri i consigli degli esperti IT-ERA.';
        }
        
        // Add call-to-action
        if (description.length < 140) {
            description += ' Contatta i nostri tecnici specializzati.';
        }
        
        return description.substring(0, 160);
    }
    
    // Extract location keywords from content
    static extractLocationKeywords(content) {
        const locations = [
            'Milano', 'Monza', 'Bergamo', 'Como', 'Lecco', 'Lodi',
            'Lombardia', 'Brianza', 'Vimercate', 'Desio', 'Seregno'
        ];
        
        return locations.filter(location => 
            content.toLowerCase().includes(location.toLowerCase())
        );
    }
    
    // Calculate content reading time
    static calculateReadingTime(content) {
        const wordsPerMinute = 200;
        const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        return Math.max(1, Math.round(words / wordsPerMinute));
    }
    
    // Generate structured data for blog posts
    static generateStructuredData(post, author, categories) {
        return {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt,
            "image": post.featured_image,
            "author": {
                "@type": "Person",
                "name": author.first_name + " " + author.last_name,
                "url": `https://it-era.it/team/${author.username}`
            },
            "publisher": {
                "@type": "Organization",
                "name": "IT-ERA",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://it-era.it/assets/logo.png"
                },
                "url": "https://it-era.it",
                "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "+39 039 888 2041",
                    "contactType": "customer service",
                    "areaServed": "IT",
                    "availableLanguage": "Italian"
                }
            },
            "datePublished": post.published_at,
            "dateModified": post.updated_at,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://it-era.it/blog/${post.slug}`
            },
            "articleSection": categories.map(cat => cat.name),
            "keywords": post.tags.join(", "),
            "wordCount": this.calculateWordCount(post.content),
            "timeRequired": `PT${this.calculateReadingTime(post.content)}M`
        };
    }
}
```

#### 2.2 Content Scheduling System
```javascript
class ContentScheduler {
    // Schedule post for optimal publishing time
    static async schedulePost(postId, preferredDate, options = {}) {
        const post = await BlogPost.findById(postId);
        const optimalTimes = await this.getOptimalPublishingTimes();
        
        let scheduledTime;
        
        if (preferredDate) {
            // Use preferred date but optimize time
            scheduledTime = this.optimizePublishingTime(preferredDate, optimalTimes);
        } else {
            // Auto-schedule for next optimal slot
            scheduledTime = this.getNextOptimalSlot(optimalTimes);
        }
        
        await BlogPost.update(postId, {
            status: 'scheduled',
            scheduled_at: scheduledTime
        });
        
        // Schedule n8n workflow
        await this.scheduleN8nWorkflow(postId, scheduledTime);
        
        return scheduledTime;
    }
    
    // Get optimal publishing times based on analytics
    static async getOptimalPublishingTimes() {
        const analytics = await BlogAnalytics.aggregate([
            {
                $group: {
                    _id: {
                        hour: { $hour: "$published_at" },
                        dayOfWeek: { $dayOfWeek: "$published_at" }
                    },
                    avgViews: { $avg: "$views" },
                    postCount: { $sum: 1 }
                }
            },
            { $sort: { avgViews: -1 } },
            { $limit: 10 }
        ]);
        
        return analytics.map(item => ({
            hour: item._id.hour,
            dayOfWeek: item._id.dayOfWeek,
            performance: item.avgViews
        }));
    }
    
    // Auto-publish scheduled posts
    static async publishScheduledPosts() {
        const now = new Date();
        const scheduledPosts = await BlogPost.findAll({
            where: {
                status: 'scheduled',
                scheduled_at: { [Op.lte]: now }
            },
            include: ['author', 'categories', 'tags']
        });
        
        const publishResults = [];
        
        for (const post of scheduledPosts) {
            try {
                // Update post status
                await post.update({
                    status: 'published',
                    published_at: now
                });
                
                // Generate and update SEO elements
                await this.generateSEOElements(post);
                
                // Update sitemap
                await SitemapGenerator.updateSitemap();
                
                // Trigger social sharing
                await this.triggerSocialSharing(post);
                
                // Clear caches
                await CacheService.clearBlogCaches();
                
                publishResults.push({
                    id: post.id,
                    title: post.title,
                    success: true
                });
                
                console.log(`Published scheduled post: ${post.title}`);
                
            } catch (error) {
                console.error(`Error publishing post ${post.id}:`, error);
                publishResults.push({
                    id: post.id,
                    title: post.title,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return publishResults;
    }
    
    // Generate SEO elements for published post
    static async generateSEOElements(post) {
        if (!post.meta_title) {
            post.meta_title = SEOOptimizer.generateMetaTitle(post);
        }
        
        if (!post.meta_description) {
            post.meta_description = SEOOptimizer.generateMetaDescription(post);
        }
        
        if (!post.canonical_url) {
            post.canonical_url = `https://it-era.it/blog/${post.slug}`;
        }
        
        // Update reading time
        post.reading_time = SEOOptimizer.calculateReadingTime(post.content);
        
        await post.save();
        
        return post;
    }
}
```

### 3. Performance Optimization

#### 3.1 Caching Strategy
```javascript
// Redis caching implementation
class CacheService {
    static async cachePost(slug, postData, ttl = 3600) {
        const key = `blog:post:${slug}`;
        await redis.setex(key, ttl, JSON.stringify(postData));
    }
    
    static async getCachedPost(slug) {
        const key = `blog:post:${slug}`;
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    
    static async cachePostList(cacheKey, posts, ttl = 900) {
        await redis.setex(cacheKey, ttl, JSON.stringify(posts));
    }
    
    static async clearBlogCaches() {
        const pattern = 'blog:*';
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }
    
    // Cache warming for popular posts
    static async warmCache() {
        const popularPosts = await BlogPost.findAll({
            where: { status: 'published' },
            order: [['view_count', 'DESC']],
            limit: 50,
            include: ['author', 'categories', 'tags']
        });
        
        for (const post of popularPosts) {
            await this.cachePost(post.slug, post);
        }
    }
}
```

#### 3.2 Database Optimization
```sql
-- Additional indexes for performance
CREATE INDEX CONCURRENTLY idx_blog_posts_published_featured 
ON blog_posts(published_at DESC, featured DESC) 
WHERE status = 'published';

CREATE INDEX CONCURRENTLY idx_blog_posts_category_published 
ON blog_posts(status, published_at DESC) 
INCLUDE (id, title, slug, excerpt, featured_image);

CREATE INDEX CONCURRENTLY idx_blog_analytics_date_views 
ON blog_analytics(date DESC, views DESC);

-- Materialized view for popular posts
CREATE MATERIALIZED VIEW popular_posts_week AS
SELECT 
    p.id, p.title, p.slug, p.featured_image,
    SUM(ba.views) as weekly_views
FROM blog_posts p
JOIN blog_analytics ba ON p.id = ba.post_id
WHERE ba.date >= CURRENT_DATE - INTERVAL '7 days'
    AND p.status = 'published'
GROUP BY p.id, p.title, p.slug, p.featured_image
ORDER BY weekly_views DESC
LIMIT 10;

-- Auto-refresh materialized view
CREATE OR REPLACE FUNCTION refresh_popular_posts()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW popular_posts_week;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (use with pg_cron or external scheduler)
SELECT cron.schedule('refresh-popular-posts', '0 */6 * * *', 'SELECT refresh_popular_posts();');
```

### 4. Integration with IT-ERA Main Site

#### 4.1 Shared Components Integration
```javascript
// Component loader for shared IT-ERA elements
class ComponentLoader {
    static async loadNavigationComponent() {
        const response = await fetch('/components/navigation-optimized.html');
        const navigationHTML = await response.text();
        
        document.getElementById('navigation-container').innerHTML = navigationHTML;
        
        // Initialize navigation functionality
        this.initializeNavigation();
    }
    
    static async loadFooterComponent() {
        const response = await fetch('/components/footer.html');
        const footerHTML = await response.text();
        
        document.getElementById('footer-container').innerHTML = footerHTML;
    }
    
    static initializeNavigation() {
        // Add active state for blog navigation
        const currentPath = window.location.pathname;
        const blogNavItem = document.querySelector('[href="/blog"]');
        
        if (currentPath.startsWith('/blog') && blogNavItem) {
            blogNavItem.classList.add('active');
        }
    }
    
    // Load shared styles from main IT-ERA site
    static loadSharedStyles() {
        const links = [
            '/css/shared/variables.css',
            '/css/shared/typography.css',
            '/css/shared/components.css'
        ];
        
        links.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        });
    }
}
```

#### 4.2 Unified Contact Information
```javascript
// Shared contact information service
class ContactService {
    static getCompanyInfo() {
        return {
            name: 'IT-ERA',
            phone: '039 888 2041',
            email: 'info@it-era.it',
            address: {
                street: 'Viale Risorgimento 32',
                city: 'Vimercate',
                region: 'MB',
                postalCode: '20871',
                country: 'Italia'
            },
            vat: '10524040966',
            website: 'https://it-era.it',
            social: {
                linkedin: 'https://linkedin.com/company/it-era',
                facebook: 'https://facebook.com/itera.assistenza'
            }
        };
    }
    
    // Generate structured data for contact information
    static getContactStructuredData() {
        const info = this.getCompanyInfo();
        
        return {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": info.name,
            "image": "https://it-era.it/assets/logo.png",
            "telephone": info.phone,
            "email": info.email,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": info.address.street,
                "addressLocality": info.address.city,
                "addressRegion": info.address.region,
                "postalCode": info.address.postalCode,
                "addressCountry": info.address.country
            },
            "url": info.website,
            "sameAs": Object.values(info.social),
            "priceRange": "€€",
            "serviceArea": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                    "@type": "GeoCoordinates",
                    "latitude": 45.6275,
                    "longitude": 9.3623
                },
                "geoRadius": "50000"
            },
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Servizi IT",
                "itemListElement": [
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Assistenza IT",
                            "description": "Supporto tecnico informatico per aziende"
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Sicurezza Informatica",
                            "description": "Soluzioni di cybersecurity per proteggere i dati aziendali"
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Cloud Storage",
                            "description": "Servizi di archiviazione cloud sicura e backup"
                        }
                    }
                ]
            }
        };
    }
}
```

This comprehensive integration specification ensures the IT-ERA blog system seamlessly integrates with existing infrastructure while providing powerful automation, SEO optimization, and performance features through n8n workflows and modern web technologies.