/**
 * IT-ERA Admin Dashboard Main Controller
 * Handles navigation, content loading, and dashboard functionality
 */

class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard-overview';
        this.contentCache = new Map();
        this.stats = {
            totalArticles: 0,
            seoScore: 0,
            pageSpeedScore: 0,
            brokenLinksCount: 0
        };
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.loadDashboardStats();
        this.setupAutoRefresh();
        this.checkSystemStatus();
        
        console.log('🎛️ Admin Dashboard initialized');
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-section]');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });
    }

    navigateToSection(sectionId) {
        // Check permissions
        const requiredPermission = this.getSectionPermission(sectionId);
        if (requiredPermission && !window.adminAuth.hasPermission(requiredPermission)) {
            window.adminAuth.showNotification('Access denied for this section', 'error');
            return;
        }

        // Update navigation
        this.updateActiveNavItem(sectionId);
        
        // Hide all content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${sectionId}-content`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            this.currentSection = sectionId;
            
            // Load section content if needed
            this.loadSectionContent(sectionId);
        }
    }

    updateActiveNavItem(sectionId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    getSectionPermission(sectionId) {
        const permissions = {
            'blog-articles': 'blog',
            'blog-create': 'blog',
            'seo-health': 'seo',
            'keyword-analyzer': 'seo',
            'page-speed': 'seo',
            'broken-links': 'seo',
            'sitemap-generator': 'sitemap',
            'sitemap-validator': 'sitemap'
        };
        
        return permissions[sectionId];
    }

    async loadSectionContent(sectionId) {
        const contentDiv = document.getElementById(`${sectionId}-content`);
        if (!contentDiv) return;

        // Check if content is already cached
        if (this.contentCache.has(sectionId)) {
            contentDiv.innerHTML = this.contentCache.get(sectionId);
            this.initializeSectionFeatures(sectionId);
            return;
        }

        // Show loading state
        contentDiv.innerHTML = this.getLoadingHTML();

        try {
            let content = '';
            
            switch (sectionId) {
                case 'blog-articles':
                    content = await this.loadBlogArticlesContent();
                    break;
                case 'blog-create':
                    content = await this.loadBlogCreateContent();
                    break;
                case 'seo-health':
                    content = await this.loadSEOHealthContent();
                    break;
                case 'keyword-analyzer':
                    content = await this.loadKeywordAnalyzerContent();
                    break;
                case 'page-speed':
                    content = await this.loadPageSpeedContent();
                    break;
                case 'broken-links':
                    content = await this.loadBrokenLinksContent();
                    break;
                case 'sitemap-generator':
                    content = await this.loadSitemapGeneratorContent();
                    break;
                case 'sitemap-validator':
                    content = await this.loadSitemapValidatorContent();
                    break;
                default:
                    content = '<div class="p-8 text-center text-gray-500">Content not found</div>';
            }
            
            // Cache and display content
            this.contentCache.set(sectionId, content);
            contentDiv.innerHTML = content;
            
            // Initialize section-specific features
            this.initializeSectionFeatures(sectionId);
            
        } catch (error) {
            console.error(`Error loading ${sectionId} content:`, error);
            contentDiv.innerHTML = this.getErrorHTML('Failed to load content');
        }
    }

    initializeSectionFeatures(sectionId) {
        switch (sectionId) {
            case 'blog-articles':
                if (window.adminBlog) {
                    window.adminBlog.initializeArticlesList();
                }
                break;
            case 'blog-create':
                if (window.adminBlog) {
                    window.adminBlog.initializeEditor();
                }
                break;
            case 'seo-health':
                if (window.adminSEO) {
                    window.adminSEO.initializeSEOHealth();
                }
                break;
            case 'sitemap-generator':
                if (window.adminSitemap) {
                    window.adminSitemap.initializeGenerator();
                }
                break;
        }
    }

    async loadDashboardStats() {
        try {
            // Load blog articles count
            await this.updateBlogStats();
            
            // Load SEO stats
            await this.updateSEOStats();
            
            // Load recent articles
            await this.loadRecentArticles();
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    async updateBlogStats() {
        try {
            const articles = await this.getBlogArticles();
            this.stats.totalArticles = articles.length;
            
            const totalArticlesEl = document.getElementById('total-articles');
            if (totalArticlesEl) {
                totalArticlesEl.textContent = this.stats.totalArticles;
            }
        } catch (error) {
            console.error('Error updating blog stats:', error);
        }
    }

    async updateSEOStats() {
        try {
            // Simulate SEO score calculation
            const seoScore = await this.calculateSEOScore();
            this.stats.seoScore = seoScore;
            
            const seoScoreEl = document.getElementById('seo-score');
            if (seoScoreEl) {
                seoScoreEl.textContent = `${seoScore}/100`;
            }
            
            // Update page speed score
            const pageSpeedScore = await this.getPageSpeedScore();
            this.stats.pageSpeedScore = pageSpeedScore;
            
            const pageSpeedEl = document.getElementById('page-speed-score');
            if (pageSpeedEl) {
                pageSpeedEl.textContent = `${pageSpeedScore}/100`;
            }
            
            // Update broken links count
            const brokenLinks = await this.checkBrokenLinks();
            this.stats.brokenLinksCount = brokenLinks.length;
            
            const brokenLinksEl = document.getElementById('broken-links-count');
            if (brokenLinksEl) {
                brokenLinksEl.textContent = this.stats.brokenLinksCount;
            }
            
        } catch (error) {
            console.error('Error updating SEO stats:', error);
        }
    }

    async loadRecentArticles() {
        try {
            const articles = await this.getBlogArticles();
            const recentArticles = articles.slice(0, 5);
            
            const recentArticlesEl = document.getElementById('recent-articles');
            if (recentArticlesEl && recentArticles.length > 0) {
                recentArticlesEl.innerHTML = recentArticles.map(article => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">${article.title}</h4>
                            <p class="text-sm text-gray-500">${this.formatDate(article.date)}</p>
                        </div>
                        <span class="px-2 py-1 text-xs rounded-full ${article.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                            ${article.published ? 'Published' : 'Draft'}
                        </span>
                    </div>
                `).join('');
            } else if (recentArticlesEl) {
                recentArticlesEl.innerHTML = '<div class="text-center text-gray-500 py-4">No articles found</div>';
            }
        } catch (error) {
            console.error('Error loading recent articles:', error);
        }
    }

    async getBlogArticles() {
        // In a real implementation, this would fetch from an API or file system
        // For now, we'll simulate with localStorage or return mock data
        try {
            const stored = localStorage.getItem('blog_articles');
            return stored ? JSON.parse(stored) : this.getMockArticles();
        } catch (error) {
            return this.getMockArticles();
        }
    }

    getMockArticles() {
        return [
            {
                id: '1',
                title: 'Sicurezza Informatica per PMI: Guida Completa 2025',
                slug: 'sicurezza-informatica-pmi-guida-2025',
                date: new Date().toISOString(),
                published: true,
                category: 'Sicurezza'
            },
            {
                id: '2',
                title: 'Cloud Computing: Vantaggi e Svantaggi per le Aziende',
                slug: 'cloud-computing-vantaggi-svantaggi-aziende',
                date: new Date(Date.now() - 86400000).toISOString(),
                published: true,
                category: 'Cloud'
            },
            {
                id: '3',
                title: 'Backup Automatico: Come Proteggere i Dati Aziendali',
                slug: 'backup-automatico-proteggere-dati-aziendali',
                date: new Date(Date.now() - 172800000).toISOString(),
                published: false,
                category: 'Backup'
            }
        ];
    }

    async calculateSEOScore() {
        // Simulate SEO score calculation
        // In production, this would analyze actual pages
        return Math.floor(Math.random() * 20) + 80; // 80-100
    }

    async getPageSpeedScore() {
        // Simulate page speed score
        return Math.floor(Math.random() * 15) + 85; // 85-100
    }

    async checkBrokenLinks() {
        // Simulate broken links check
        return []; // No broken links for now
    }

    checkSystemStatus() {
        // All systems operational for now
        // In production, this would check actual system health
    }

    setupAutoRefresh() {
        // Refresh dashboard stats every 5 minutes
        setInterval(() => {
            if (this.currentSection === 'dashboard-overview') {
                this.loadDashboardStats();
            }
        }, 5 * 60 * 1000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getLoadingHTML() {
        return `
            <div class="flex items-center justify-center py-12">
                <div class="loading-spinner mr-3"></div>
                <span class="text-gray-600">Loading...</span>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="text-center py-12">
                <div class="text-red-600 mb-4">
                    <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Error</h3>
                <p class="text-gray-600">${message}</p>
                <button onclick="location.reload()" class="mt-4 btn btn-primary">
                    Retry
                </button>
            </div>
        `;
    }

    // Content loading methods (to be implemented by specific modules)
    async loadBlogArticlesContent() {
        return `
            <div class="mb-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-3xl font-bold text-gray-900 mb-2">Blog Articles</h2>
                        <p class="text-gray-600">Manage your blog posts and content</p>
                    </div>
                    <button onclick="window.adminDashboard.navigateToSection('blog-create')" class="btn btn-primary">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Create New Article
                    </button>
                </div>

                <div class="admin-card">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <div class="flex items-center space-x-4">
                                <input type="text" id="article-search" placeholder="Search articles..."
                                       class="form-input w-64">
                                <select id="article-filter" class="form-select">
                                    <option value="">All Categories</option>
                                    <option value="sicurezza">Sicurezza</option>
                                    <option value="cloud">Cloud</option>
                                    <option value="backup">Backup</option>
                                </select>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button class="btn btn-secondary btn-sm" onclick="window.adminBlog.bulkPublish()">
                                    Bulk Publish
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="window.adminBlog.bulkUnpublish()">
                                    Bulk Unpublish
                                </button>
                            </div>
                        </div>

                        <div id="articles-table-container">
                            <div class="loading-spinner mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadBlogCreateContent() {
        return `
            <div class="mb-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-3xl font-bold text-gray-900 mb-2">Create Article</h2>
                        <p class="text-gray-600">Write and publish new blog content</p>
                    </div>
                    <button onclick="window.adminDashboard.navigateToSection('blog-articles')" class="btn btn-secondary">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Back to Articles
                    </button>
                </div>

                <form id="article-form" class="space-y-6">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div class="lg:col-span-2">
                            <div class="admin-card p-6 mb-6">
                                <div class="form-group">
                                    <label class="form-label">Article Title *</label>
                                    <input type="text" id="article-title" name="title" required
                                           class="form-input" placeholder="Enter article title">
                                </div>

                                <div class="form-group">
                                    <label class="form-label">URL Slug</label>
                                    <input type="text" id="article-slug" name="slug"
                                           class="form-input" placeholder="auto-generated-from-title">
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Content *</label>
                                    <textarea id="article-content" name="content" required
                                              class="form-input form-textarea" rows="20"
                                              placeholder="Write your article content here..."></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="lg:col-span-1">
                            <div class="admin-card p-6 mb-6">
                                <h3 class="text-lg font-semibold mb-4">Article Settings</h3>

                                <div class="form-group">
                                    <label class="form-label">Category</label>
                                    <select id="article-category" name="category" class="form-input form-select">
                                        <option value="">Select category</option>
                                        <option value="sicurezza">Sicurezza Informatica</option>
                                        <option value="cloud">Cloud Computing</option>
                                        <option value="backup">Backup e Recovery</option>
                                        <option value="networking">Networking</option>
                                        <option value="software">Software</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Tags</label>
                                    <input type="text" id="article-tags" name="tags"
                                           class="form-input" placeholder="tag1, tag2, tag3">
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Publication Date</label>
                                    <input type="datetime-local" id="article-date" name="date"
                                           class="form-input">
                                </div>

                                <div class="form-group">
                                    <label class="flex items-center">
                                        <input type="checkbox" id="article-published" name="published"
                                               class="mr-2">
                                        <span class="form-label mb-0">Publish immediately</span>
                                    </label>
                                </div>
                            </div>

                            <div class="admin-card p-6 mb-6">
                                <h3 class="text-lg font-semibold mb-4">SEO Settings</h3>

                                <div class="form-group">
                                    <label class="form-label">Meta Description</label>
                                    <textarea id="article-meta-description" name="metaDescription"
                                              class="form-input" rows="3" maxlength="160"
                                              placeholder="Brief description for search engines (max 160 chars)"></textarea>
                                    <div class="text-sm text-gray-500 mt-1">
                                        <span id="meta-description-count">0</span>/160 characters
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Focus Keyword</label>
                                    <input type="text" id="article-focus-keyword" name="focusKeyword"
                                           class="form-input" placeholder="Main SEO keyword">
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Featured Image URL</label>
                                    <input type="url" id="article-featured-image" name="featuredImage"
                                           class="form-input" placeholder="https://example.com/image.jpg">
                                </div>
                            </div>

                            <div class="space-y-3">
                                <button type="submit" class="btn btn-primary w-full">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
                                    </svg>
                                    Save Article
                                </button>

                                <button type="button" class="btn btn-secondary w-full" onclick="window.adminBlog.previewArticle()">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    Preview
                                </button>

                                <button type="button" class="btn btn-warning w-full" onclick="window.adminBlog.saveDraft()">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                    </svg>
                                    Save as Draft
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;
    }

    async loadSEOHealthContent() {
        return '<div id="seo-health-placeholder">SEO health content will be loaded here</div>';
    }

    async loadKeywordAnalyzerContent() {
        return '<div id="keyword-analyzer-placeholder">Keyword analyzer content will be loaded here</div>';
    }

    async loadPageSpeedContent() {
        return '<div id="page-speed-placeholder">Page speed content will be loaded here</div>';
    }

    async loadBrokenLinksContent() {
        return '<div id="broken-links-placeholder">Broken links content will be loaded here</div>';
    }

    async loadSitemapGeneratorContent() {
        return '<div id="sitemap-generator-placeholder">Sitemap generator content will be loaded here</div>';
    }

    async loadSitemapValidatorContent() {
        return '<div id="sitemap-validator-placeholder">Sitemap validator content will be loaded here</div>';
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth to be ready
    setTimeout(() => {
        window.adminDashboard = new AdminDashboard();
    }, 100);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}
