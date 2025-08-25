// API Helper Functions
class APIManager {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.adminBaseURL = CONFIG.ADMIN_API_BASE_URL;
    }

    // SECURE API request with enhanced authentication validation
    async request(endpoint, options = {}) {
        // SECURITY CHECK: Ensure authentication before ANY API request
        if (!authManager.isAuthenticated || !authManager.token) {
            console.error('APIManager: No authentication - blocking API request');
            authManager.logout();
            throw new Error('Authentication required. Please login again.');
        }

        // Validate JWT token before request
        if (!authManager.validateJWT() || authManager.isTokenExpired()) {
            console.error('APIManager: Invalid or expired token - blocking API request');
            authManager.logout();
            throw new Error('Session expired. Please login again.');
        }

        // Construct URL properly for admin API endpoints
        let url;
        if (endpoint.startsWith('http')) {
            url = endpoint;
        } else if (endpoint.startsWith('/admin')) {
            url = `${this.baseURL}${endpoint}`;
        } else {
            url = `${this.baseURL}${endpoint}`;
        }
        
        const defaultOptions = {
            headers: {
                ...authManager.getAuthHeaders(),
                'X-Requested-With': 'XMLHttpRequest', // CSRF protection
                'X-Admin-Panel': 'IT-ERA-Admin-v1', // Additional security header
            },
            credentials: 'include', // Include cookies for additional security
            timeout: 30000 // 30 second timeout
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
            console.log(`APIManager: Making ${config.method || 'GET'} request to: ${url}`);
            const response = await fetch(url, config);
            
            // Handle authentication errors
            if (response.status === 401 || response.status === 403) {
                console.error('APIManager: Authentication failed - status:', response.status);
                authManager.logout();
                throw new Error('Session expired or access denied. Please login again.');
            }

            // Handle other HTTP errors
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
                } catch (e) {
                    errorMessage = `HTTP error! status: ${response.status} - ${errorText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`APIManager: Request successful for: ${url}`);
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
        return this.get('/admin/api/posts', params);
    }

    async getPost(id) {
        return this.get(`/admin/api/posts/${id}`);
    }

    async createPost(postData) {
        return this.post('/admin/api/posts', postData);
    }

    async updatePost(id, postData) {
        return this.put(`/admin/api/posts/${id}`, postData);
    }

    async deletePost(id) {
        return this.delete(`/admin/api/posts/${id}`);
    }

    async publishPost(id) {
        return this.post(`/admin/api/posts/${id}/publish`);
    }

    async unpublishPost(id) {
        return this.post(`/admin/api/posts/${id}/unpublish`);
    }

    // Categories API
    async getCategories(params = {}) {
        return this.get('/admin/api/categories', params);
    }

    async getCategory(id) {
        return this.get(`/admin/api/categories/${id}`);
    }

    async createCategory(categoryData) {
        return this.post('/admin/api/categories', categoryData);
    }

    async updateCategory(id, categoryData) {
        return this.put(`/admin/api/categories/${id}`, categoryData);
    }

    async deleteCategory(id) {
        return this.delete(`/admin/api/categories/${id}`);
    }

    async toggleCategoryStatus(id) {
        return this.post(`/admin/api/categories/${id}/toggle-status`);
    }

    // Tags API
    async getTags(params = {}) {
        return this.get('/admin/api/tags', params);
    }

    async getTag(id) {
        return this.get(`/admin/api/tags/${id}`);
    }

    async createTag(tagData) {
        return this.post('/admin/api/tags', tagData);
    }

    async updateTag(id, tagData) {
        return this.put(`/admin/api/tags/${id}`, tagData);
    }

    async deleteTag(id) {
        return this.delete(`/admin/api/tags/${id}`);
    }

    async bulkCreateTags(tags) {
        return this.post('/admin/api/tags/bulk-create', { tags });
    }

    async mergeTags(sourceTagId, targetTagId, deleteSource = true) {
        return this.post('/admin/api/tags/merge', {
            source_tag_id: sourceTagId,
            target_tag_id: targetTagId,
            delete_source: deleteSource
        });
    }

    // Media API
    async getMedia(params = {}) {
        return this.get('/admin/api/media', params);
    }

    async getMediaFile(id) {
        return this.get(`/admin/api/media/${id}`);
    }

    async uploadMedia(files, metadata = {}) {
        const formData = new FormData();
        
        files.forEach(file => {
            formData.append('files', file);
        });

        if (metadata.alt_text) formData.append('alt_text', metadata.alt_text);
        if (metadata.caption) formData.append('caption', metadata.caption);

        return this.upload('/admin/api/media/upload', formData);
    }

    async updateMedia(id, mediaData) {
        return this.put(`/admin/api/media/${id}`, mediaData);
    }

    async deleteMedia(id) {
        return this.delete(`/admin/api/media/${id}`);
    }

    async bulkDeleteMedia(mediaIds) {
        return this.post('/admin/api/media/bulk-delete', { media_ids: mediaIds });
    }

    async getMediaStats() {
        return this.get('/admin/api/media/stats');
    }

    // Analytics API
    async getAnalyticsDashboard(timeframe = '30') {
        return this.get('/admin/api/analytics/dashboard', { timeframe });
    }

    async getPostAnalytics(postId, timeframe = '30') {
        return this.get(`/admin/api/analytics/posts/${postId}`, { timeframe });
    }

    async trackEvent(event, postId = null, categoryId = null, metadata = {}) {
        return this.post('/admin/api/analytics/track', {
            event,
            post_id: postId,
            category_id: categoryId,
            metadata
        });
    }

    async exportAnalytics(params = {}) {
        return this.get('/admin/api/analytics/export', params);
    }

    async getRealtimeAnalytics(minutes = 60) {
        return this.get('/admin/api/analytics/realtime', { minutes });
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
        return this.get('/admin/api/webhooks/logs', params);
    }

    async retryWebhook(logId) {
        return this.post(`/admin/api/webhooks/retry/${logId}`);
    }

    // Users API (admin only)
    async getUsers(params = {}) {
        return this.get('/admin/api/users', params);
    }

    async createUser(userData) {
        return this.post('/admin/api/users', userData);
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

    // Dashboard API  
    async getDashboard() {
        return this.get('/admin/api/dashboard');
    }

    async getStats() {
        return this.get('/admin/api/stats/overview');
    }
}

// Global API manager instance
const apiManager = new APIManager();

// Utility functions
function handleAPIError(error, context = '', defaultMessage = 'Si è verificato un errore') {
    // Use the new notification manager
    if (window.notificationManager) {
        return notificationManager.handleApiError(error, context);
    }
    
    // Fallback for backward compatibility
    console.error('API Error:', error);
    
    let message = defaultMessage;
    if (error && error.message) {
        message = error.message;
    }
    
    if (typeof showNotification === 'function') {
        showNotification(message, 'danger');
    }
    return message;
}

// Loading state management - now handled by NotificationManager
let activeRequests = 0;

// Backward compatibility functions
function showLoading(element = null, message = 'Caricamento...') {
    activeRequests++;
    
    if (window.notificationManager) {
        const elementId = element ? element.id || `element_${Date.now()}` : null;
        if (element && !element.id) {
            element.id = elementId;
        }
        notificationManager.showLoading(elementId, message);
    } else {
        // Fallback implementation
        if (!element) {
            document.body.style.cursor = 'wait';
        }
    }
}

function hideLoading(element = null) {
    activeRequests = Math.max(0, activeRequests - 1);
    
    if (window.notificationManager) {
        const elementId = element ? element.id : null;
        notificationManager.hideLoading(elementId);
    } else {
        // Fallback implementation
        if (!element && activeRequests === 0) {
            document.body.style.cursor = 'default';
        }
    }
}