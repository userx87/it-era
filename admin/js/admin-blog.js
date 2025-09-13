/**
 * IT-ERA Admin Blog Management System
 * Handles blog article CRUD operations, SEO optimization, and content management
 */

class AdminBlog {
    constructor() {
        this.articles = [];
        this.selectedArticles = new Set();
        this.currentEditingId = null;
        this.storageKey = 'blog_articles';
        
        this.init();
    }

    init() {
        this.loadArticles();
        this.setupEventListeners();
        
        console.log('📝 Admin Blog Management initialized');
    }

    setupEventListeners() {
        // Article form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'article-form') {
                e.preventDefault();
                this.saveArticle();
            }
        });

        // Title to slug generation
        document.addEventListener('input', (e) => {
            if (e.target.id === 'article-title') {
                this.generateSlug(e.target.value);
            }
            if (e.target.id === 'article-meta-description') {
                this.updateMetaDescriptionCount(e.target.value);
            }
        });

        // Search and filter
        document.addEventListener('input', (e) => {
            if (e.target.id === 'article-search') {
                this.filterArticles();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'article-filter') {
                this.filterArticles();
            }
        });
    }

    loadArticles() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            this.articles = stored ? JSON.parse(stored) : this.getDefaultArticles();
        } catch (error) {
            console.error('Error loading articles:', error);
            this.articles = this.getDefaultArticles();
        }
    }

    saveArticles() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.articles));
        } catch (error) {
            console.error('Error saving articles:', error);
            window.adminAuth.showNotification('Error saving articles', 'error');
        }
    }

    getDefaultArticles() {
        return [
            {
                id: this.generateId(),
                title: 'Sicurezza Informatica per PMI: Guida Completa 2025',
                slug: 'sicurezza-informatica-pmi-guida-2025',
                content: 'La sicurezza informatica è fondamentale per le PMI...',
                category: 'sicurezza',
                tags: ['sicurezza', 'pmi', 'cybersecurity'],
                metaDescription: 'Guida completa alla sicurezza informatica per PMI. Scopri come proteggere la tua azienda dai cyber attacchi.',
                focusKeyword: 'sicurezza informatica PMI',
                featuredImage: '',
                published: true,
                date: new Date().toISOString(),
                author: 'IT-ERA Team',
                lastModified: new Date().toISOString()
            },
            {
                id: this.generateId(),
                title: 'Cloud Computing: Vantaggi e Svantaggi per le Aziende',
                slug: 'cloud-computing-vantaggi-svantaggi-aziende',
                content: 'Il cloud computing offre numerosi vantaggi...',
                category: 'cloud',
                tags: ['cloud', 'aziende', 'tecnologia'],
                metaDescription: 'Scopri vantaggi e svantaggi del cloud computing per le aziende. Guida completa per la migrazione al cloud.',
                focusKeyword: 'cloud computing aziende',
                featuredImage: '',
                published: true,
                date: new Date(Date.now() - 86400000).toISOString(),
                author: 'IT-ERA Team',
                lastModified: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: this.generateId(),
                title: 'Backup Automatico: Come Proteggere i Dati Aziendali',
                slug: 'backup-automatico-proteggere-dati-aziendali',
                content: 'Il backup automatico è essenziale...',
                category: 'backup',
                tags: ['backup', 'dati', 'protezione'],
                metaDescription: 'Guida al backup automatico per proteggere i dati aziendali. Strategie e best practices per la sicurezza.',
                focusKeyword: 'backup automatico dati',
                featuredImage: '',
                published: false,
                date: new Date(Date.now() - 172800000).toISOString(),
                author: 'IT-ERA Team',
                lastModified: new Date(Date.now() - 172800000).toISOString()
            }
        ];
    }

    initializeArticlesList() {
        this.renderArticlesTable();
    }

    renderArticlesTable() {
        const container = document.getElementById('articles-table-container');
        if (!container) return;

        const filteredArticles = this.getFilteredArticles();

        if (filteredArticles.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 mb-4">
                        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                    <p class="text-gray-600 mb-4">Create your first article to get started.</p>
                    <button onclick="window.adminDashboard.navigateToSection('blog-create')" class="btn btn-primary">
                        Create Article
                    </button>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th class="w-12">
                            <input type="checkbox" id="select-all-articles" onchange="window.adminBlog.toggleSelectAll(this.checked)">
                        </th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredArticles.map(article => this.renderArticleRow(article)).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    renderArticleRow(article) {
        const statusClass = article.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
        const statusText = article.published ? 'Published' : 'Draft';

        return `
            <tr>
                <td>
                    <input type="checkbox" value="${article.id}" onchange="window.adminBlog.toggleArticleSelection('${article.id}', this.checked)">
                </td>
                <td>
                    <div>
                        <h4 class="font-medium text-gray-900">${this.escapeHtml(article.title)}</h4>
                        <p class="text-sm text-gray-500">/${article.slug}</p>
                    </div>
                </td>
                <td>
                    <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        ${this.escapeHtml(article.category || 'Uncategorized')}
                    </span>
                </td>
                <td>
                    <span class="px-2 py-1 text-xs rounded-full ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="text-sm text-gray-600">
                    ${this.formatDate(article.date)}
                </td>
                <td>
                    <div class="flex items-center space-x-2">
                        <button onclick="window.adminBlog.editArticle('${article.id}')" 
                                class="btn btn-sm btn-secondary" title="Edit">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="window.adminBlog.previewArticle('${article.id}')" 
                                class="btn btn-sm btn-secondary" title="Preview">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </button>
                        <button onclick="window.adminBlog.togglePublishStatus('${article.id}')" 
                                class="btn btn-sm ${article.published ? 'btn-warning' : 'btn-success'}" 
                                title="${article.published ? 'Unpublish' : 'Publish'}">
                            ${article.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onclick="window.adminBlog.deleteArticle('${article.id}')" 
                                class="btn btn-sm btn-danger" title="Delete">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getFilteredArticles() {
        const searchTerm = document.getElementById('article-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('article-filter')?.value || '';

        return this.articles.filter(article => {
            const matchesSearch = !searchTerm || 
                article.title.toLowerCase().includes(searchTerm) ||
                article.content.toLowerCase().includes(searchTerm) ||
                (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm)));

            const matchesCategory = !categoryFilter || article.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });
    }

    filterArticles() {
        this.renderArticlesTable();
    }

    initializeEditor() {
        // Set current date as default
        const dateInput = document.getElementById('article-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().slice(0, 16);
        }

        // Initialize meta description counter
        this.updateMetaDescriptionCount('');
    }

    generateSlug(title) {
        const slugInput = document.getElementById('article-slug');
        if (!slugInput || slugInput.value) return; // Don't override manual input

        const slug = title
            .toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[ñ]/g, 'n')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');

        slugInput.value = slug;
    }

    updateMetaDescriptionCount(text) {
        const counter = document.getElementById('meta-description-count');
        if (counter) {
            counter.textContent = text.length;
            counter.parentElement.className = text.length > 160 ? 'text-sm text-red-500 mt-1' : 'text-sm text-gray-500 mt-1';
        }
    }

    saveArticle() {
        if (!window.adminAuth.requirePermission('blog')) return;

        const formData = this.getFormData();
        if (!this.validateArticleData(formData)) return;

        try {
            if (this.currentEditingId) {
                this.updateExistingArticle(formData);
            } else {
                this.createNewArticle(formData);
            }

            this.saveArticles();
            window.adminAuth.showNotification('Article saved successfully!', 'success');
            
            // Navigate back to articles list
            window.adminDashboard.navigateToSection('blog-articles');
            
        } catch (error) {
            console.error('Error saving article:', error);
            window.adminAuth.showNotification('Error saving article', 'error');
        }
    }

    getFormData() {
        return {
            title: document.getElementById('article-title')?.value || '',
            slug: document.getElementById('article-slug')?.value || '',
            content: document.getElementById('article-content')?.value || '',
            category: document.getElementById('article-category')?.value || '',
            tags: document.getElementById('article-tags')?.value.split(',').map(tag => tag.trim()).filter(tag => tag),
            metaDescription: document.getElementById('article-meta-description')?.value || '',
            focusKeyword: document.getElementById('article-focus-keyword')?.value || '',
            featuredImage: document.getElementById('article-featured-image')?.value || '',
            published: document.getElementById('article-published')?.checked || false,
            date: document.getElementById('article-date')?.value || new Date().toISOString()
        };
    }

    validateArticleData(data) {
        if (!data.title.trim()) {
            window.adminAuth.showNotification('Title is required', 'error');
            return false;
        }

        if (!data.content.trim()) {
            window.adminAuth.showNotification('Content is required', 'error');
            return false;
        }

        if (!data.slug.trim()) {
            this.generateSlug(data.title);
            data.slug = document.getElementById('article-slug')?.value || '';
        }

        // Check for duplicate slug
        const existingArticle = this.articles.find(article => 
            article.slug === data.slug && article.id !== this.currentEditingId
        );

        if (existingArticle) {
            window.adminAuth.showNotification('URL slug already exists', 'error');
            return false;
        }

        return true;
    }

    createNewArticle(data) {
        const article = {
            id: this.generateId(),
            ...data,
            author: window.adminAuth.getCurrentUser(),
            lastModified: new Date().toISOString()
        };

        this.articles.unshift(article);
    }

    updateExistingArticle(data) {
        const index = this.articles.findIndex(article => article.id === this.currentEditingId);
        if (index !== -1) {
            this.articles[index] = {
                ...this.articles[index],
                ...data,
                lastModified: new Date().toISOString()
            };
        }
    }

    editArticle(id) {
        const article = this.articles.find(a => a.id === id);
        if (!article) return;

        this.currentEditingId = id;
        window.adminDashboard.navigateToSection('blog-create');

        // Wait for content to load, then populate form
        setTimeout(() => {
            this.populateForm(article);
        }, 100);
    }

    populateForm(article) {
        const fields = {
            'article-title': article.title,
            'article-slug': article.slug,
            'article-content': article.content,
            'article-category': article.category,
            'article-tags': article.tags ? article.tags.join(', ') : '',
            'article-meta-description': article.metaDescription,
            'article-focus-keyword': article.focusKeyword,
            'article-featured-image': article.featuredImage,
            'article-date': article.date ? new Date(article.date).toISOString().slice(0, 16) : ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });

        const publishedCheckbox = document.getElementById('article-published');
        if (publishedCheckbox) {
            publishedCheckbox.checked = article.published;
        }

        this.updateMetaDescriptionCount(article.metaDescription || '');
    }

    deleteArticle(id) {
        if (!window.adminAuth.requirePermission('blog')) return;

        const article = this.articles.find(a => a.id === id);
        if (!article) return;

        if (confirm(`Are you sure you want to delete "${article.title}"?`)) {
            this.articles = this.articles.filter(a => a.id !== id);
            this.saveArticles();
            this.renderArticlesTable();
            window.adminAuth.showNotification('Article deleted successfully', 'success');
        }
    }

    togglePublishStatus(id) {
        if (!window.adminAuth.requirePermission('blog')) return;

        const article = this.articles.find(a => a.id === id);
        if (!article) return;

        article.published = !article.published;
        article.lastModified = new Date().toISOString();
        
        this.saveArticles();
        this.renderArticlesTable();
        
        const status = article.published ? 'published' : 'unpublished';
        window.adminAuth.showNotification(`Article ${status} successfully`, 'success');
    }

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][value]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            this.toggleArticleSelection(checkbox.value, checked);
        });
    }

    toggleArticleSelection(id, selected) {
        if (selected) {
            this.selectedArticles.add(id);
        } else {
            this.selectedArticles.delete(id);
        }
    }

    bulkPublish() {
        if (!window.adminAuth.requirePermission('blog')) return;
        
        if (this.selectedArticles.size === 0) {
            window.adminAuth.showNotification('No articles selected', 'warning');
            return;
        }

        this.selectedArticles.forEach(id => {
            const article = this.articles.find(a => a.id === id);
            if (article) {
                article.published = true;
                article.lastModified = new Date().toISOString();
            }
        });

        this.saveArticles();
        this.renderArticlesTable();
        this.selectedArticles.clear();
        
        window.adminAuth.showNotification(`${this.selectedArticles.size} articles published`, 'success');
    }

    bulkUnpublish() {
        if (!window.adminAuth.requirePermission('blog')) return;
        
        if (this.selectedArticles.size === 0) {
            window.adminAuth.showNotification('No articles selected', 'warning');
            return;
        }

        this.selectedArticles.forEach(id => {
            const article = this.articles.find(a => a.id === id);
            if (article) {
                article.published = false;
                article.lastModified = new Date().toISOString();
            }
        });

        this.saveArticles();
        this.renderArticlesTable();
        this.selectedArticles.clear();
        
        window.adminAuth.showNotification(`${this.selectedArticles.size} articles unpublished`, 'success');
    }

    previewArticle(id) {
        const article = id ? this.articles.find(a => a.id === id) : this.getFormData();
        if (!article) return;

        // Create preview window
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        previewWindow.document.write(this.generatePreviewHTML(article));
    }

    generatePreviewHTML(article) {
        return `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${this.escapeHtml(article.title)} | IT-ERA Blog</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                    h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
                    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
                    .content { white-space: pre-wrap; }
                    .preview-notice { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="preview-notice">
                    <strong>Preview Mode</strong> - This is how your article will appear on the website.
                </div>
                <h1>${this.escapeHtml(article.title)}</h1>
                <div class="meta">
                    Published: ${this.formatDate(article.date)} | 
                    Category: ${this.escapeHtml(article.category || 'Uncategorized')} |
                    Author: ${this.escapeHtml(article.author || 'IT-ERA Team')}
                </div>
                <div class="content">${this.escapeHtml(article.content)}</div>
            </body>
            </html>
        `;
    }

    saveDraft() {
        const formData = this.getFormData();
        formData.published = false;
        
        if (!this.validateArticleData(formData)) return;

        try {
            if (this.currentEditingId) {
                this.updateExistingArticle(formData);
            } else {
                this.createNewArticle(formData);
            }

            this.saveArticles();
            window.adminAuth.showNotification('Draft saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving draft:', error);
            window.adminAuth.showNotification('Error saving draft', 'error');
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize blog management
document.addEventListener('DOMContentLoaded', function() {
    window.adminBlog = new AdminBlog();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminBlog;
}
