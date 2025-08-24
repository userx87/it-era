// API Helper Functions
class APIManager {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.adminBaseURL = CONFIG.ADMIN_API_BASE_URL;
    }

    // Generic API request
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('/admin/api') ? endpoint : `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: authManager.getAuthHeaders()
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                authManager.logout();
                throw new Error('Session expired. Please login again.');
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const searchParams = new URLSearchParams(params);
        const url = `${endpoint}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        return this.request(url);
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Upload file
    async upload(endpoint, formData) {
        const headers = { ...authManager.getAuthHeaders() };
        delete headers['Content-Type']; // Let browser set content-type for FormData

        return this.request(endpoint, {
            method: 'POST',
            headers,
            body: formData
        });
    }

    // Posts API
    async getPosts(params = {}) {
        return this.get('/posts', params);
    }

    async getPost(id) {
        return this.get(`/posts/${id}`);
    }

    async createPost(postData) {
        return this.post('/posts', postData);
    }

    async updatePost(id, postData) {
        return this.put(`/posts/${id}`, postData);
    }

    async deletePost(id) {
        return this.delete(`/posts/${id}`);
    }

    async publishPost(id) {
        return this.post(`/posts/${id}/publish`);
    }

    async unpublishPost(id) {
        return this.post(`/posts/${id}/unpublish`);
    }

    // Categories API
    async getCategories(params = {}) {
        return this.get('/categories', params);
    }

    async getCategory(id) {
        return this.get(`/categories/${id}`);
    }

    async createCategory(categoryData) {
        return this.post('/categories', categoryData);
    }

    async updateCategory(id, categoryData) {
        return this.put(`/categories/${id}`, categoryData);
    }

    async deleteCategory(id) {
        return this.delete(`/categories/${id}`);
    }

    async toggleCategoryStatus(id) {
        return this.post(`/categories/${id}/toggle-status`);
    }

    // Tags API
    async getTags(params = {}) {
        return this.get('/tags', params);
    }

    async getTag(id) {
        return this.get(`/tags/${id}`);
    }

    async createTag(tagData) {
        return this.post('/tags', tagData);
    }

    async updateTag(id, tagData) {
        return this.put(`/tags/${id}`, tagData);
    }

    async deleteTag(id) {
        return this.delete(`/tags/${id}`);
    }

    async bulkCreateTags(tags) {
        return this.post('/tags/bulk-create', { tags });
    }

    async mergeTags(sourceTagId, targetTagId, deleteSource = true) {
        return this.post('/tags/merge', {
            source_tag_id: sourceTagId,
            target_tag_id: targetTagId,
            delete_source: deleteSource
        });
    }

    // Media API
    async getMedia(params = {}) {
        return this.get('/media', params);
    }

    async getMediaFile(id) {
        return this.get(`/media/${id}`);
    }

    async uploadMedia(files, metadata = {}) {
        const formData = new FormData();
        
        files.forEach(file => {
            formData.append('files', file);
        });

        if (metadata.alt_text) formData.append('alt_text', metadata.alt_text);
        if (metadata.caption) formData.append('caption', metadata.caption);

        return this.upload('/media/upload', formData);
    }

    async updateMedia(id, mediaData) {
        return this.put(`/media/${id}`, mediaData);
    }

    async deleteMedia(id) {
        return this.delete(`/media/${id}`);
    }

    async bulkDeleteMedia(mediaIds) {
        return this.post('/media/bulk-delete', { media_ids: mediaIds });
    }

    async getMediaStats() {
        return this.get('/media/stats');
    }

    // Analytics API
    async getAnalyticsDashboard(timeframe = '30') {
        return this.get('/analytics/dashboard', { timeframe });
    }

    async getPostAnalytics(postId, timeframe = '30') {
        return this.get(`/analytics/posts/${postId}`, { timeframe });
    }

    async trackEvent(event, postId = null, categoryId = null, metadata = {}) {
        return this.post('/analytics/track', {
            event,
            post_id: postId,
            category_id: categoryId,
            metadata
        });
    }

    async exportAnalytics(params = {}) {
        return this.get('/analytics/export', params);
    }

    async getRealtimeAnalytics(minutes = 60) {
        return this.get('/analytics/realtime', { minutes });
    }

    // Admin API
    async getDashboard() {
        return this.get('/admin/api/dashboard');
    }

    async getOverviewStats(timeframe = '30') {
        return this.get('/admin/api/stats/overview', { timeframe });
    }

    async getScheduledPosts() {
        return this.get('/admin/api/posts/scheduled');
    }

    async bulkActionPosts(action, postIds) {
        return this.post('/admin/api/posts/bulk-action', { action, post_ids: postIds });
    }

    async getContentCalendar(year, month) {
        return this.get('/admin/api/content-calendar', { year, month });
    }

    async getSEOAnalysis() {
        return this.get('/admin/api/seo-analysis');
    }

    async exportPosts(params = {}) {
        return this.get('/admin/api/export/posts', params);
    }

    // Webhooks API
    async getWebhookLogs(params = {}) {
        return this.get('/webhooks/logs', params);
    }

    async retryWebhook(logId) {
        return this.post(`/webhooks/retry/${logId}`);
    }

    // Users API (admin only)
    async getUsers(params = {}) {
        return this.get('/admin/api/users', params);
    }

    async createUser(userData) {
        return this.post('/auth/register', userData);
    }

    async updateUser(id, userData) {
        return this.put(`/admin/api/users/${id}`, userData);
    }

    async deleteUser(id) {
        return this.delete(`/admin/api/users/${id}`);
    }

    // Settings API (admin only)
    async getSettings() {
        return this.get('/admin/api/settings');
    }

    async updateSettings(settings) {
        return this.put('/admin/api/settings', settings);
    }
}

// Global API manager instance
const apiManager = new APIManager();

// Utility functions
function handleAPIError(error, defaultMessage = 'Si è verificato un errore') {
    console.error('API Error:', error);
    
    let message = defaultMessage;
    
    if (error.message) {
        message = error.message;
    }
    
    showNotification(message, 'error');
    return message;
}

// Loading state management
let activeRequests = 0;

function showLoading(element = null) {
    activeRequests++;
    
    if (element) {
        element.style.position = 'relative';
        
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        
        element.appendChild(overlay);
    } else {
        // Show global loading indicator
        document.body.style.cursor = 'wait';
    }
}

function hideLoading(element = null) {
    activeRequests = Math.max(0, activeRequests - 1);
    
    if (element) {
        const overlay = element.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    } else if (activeRequests === 0) {
        document.body.style.cursor = 'default';
    }
}