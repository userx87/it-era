/**
 * IT-ERA Admin Panel - Dashboard Management
 * 
 * Dashboard with real-time statistics, activity monitoring,
 * system status, and quick access to management functions.
 */

class DashboardManager {
    constructor() {
        this.stats = {};
        this.activities = [];
        this.systemStatus = {};
        
        // Refresh intervals
        this.statsRefreshInterval = 30000; // 30 seconds
        this.activityRefreshInterval = 60000; // 1 minute
        this.statusRefreshInterval = 120000; // 2 minutes
        
        // Timers
        this.timers = {
            stats: null,
            activity: null,
            status: null
        };
        
        // Chart instances
        this.charts = {};
        
        this.init();
    }

    /**
     * Initialize dashboard manager
     */
    init() {
        console.info('DashboardManager: Initializing dashboard system');
        
        this.setupEventListeners();
        this.loadInitialData();
        this.setupRefreshTimers();
        this.setupAuthenticationHandler();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-section]')) {
                e.preventDefault();
                this.showSection(e.target.dataset.section);
            }
        });

        // Login form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'loginForm') {
                e.preventDefault();
                this.handleLogin(e.target);
            }
        });

        // Logout
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logoutBtn') {
                e.preventDefault();
                this.handleLogout();
            }
        });

        // Refresh buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('refresh-stats')) {
                this.loadStats();
            }
            if (e.target.classList.contains('refresh-activity')) {
                this.loadRecentActivity();
            }
        });

        // Window focus events for real-time updates
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadStats();
                this.loadRecentActivity();
            }
        });
    }

    /**
     * Setup authentication handler
     */
    setupAuthenticationHandler() {
        // Check authentication on load
        if (securityGuard.isAuthenticated()) {
            this.showAdminInterface();
        } else {
            this.showAuthModal();
        }
    }

    /**
     * Setup refresh timers
     */
    setupRefreshTimers() {
        // Only set up timers if user is authenticated
        if (!securityGuard.isAuthenticated()) {
            return;
        }

        this.timers.stats = setInterval(() => {
            if (!document.hidden) {
                this.loadStats();
            }
        }, this.statsRefreshInterval);

        this.timers.activity = setInterval(() => {
            if (!document.hidden) {
                this.loadRecentActivity();
            }
        }, this.activityRefreshInterval);

        this.timers.status = setInterval(() => {
            if (!document.hidden) {
                this.loadSystemStatus();
            }
        }, this.statusRefreshInterval);
    }

    /**
     * Load initial dashboard data
     */
    async loadInitialData() {
        if (!securityGuard.isAuthenticated()) {
            return;
        }

        try {
            this.showLoading('dashboardSection', true);
            
            await Promise.all([
                this.loadStats(),
                this.loadRecentActivity(),
                this.loadSystemStatus()
            ]);
            
            this.updateDashboardDisplay();
            
        } catch (error) {
            console.error('DashboardManager: Failed to load initial data:', error);
            this.showError('Errore durante il caricamento del dashboard');
        } finally {
            this.showLoading('dashboardSection', false);
        }
    }

    /**
     * Load dashboard statistics
     */
    async loadStats() {
        try {
            const response = await securityGuard.makeSecureRequest('/dashboard/stats');
            
            if (response.success) {
                this.stats = response.data || {};
                this.updateStatsDisplay();
            } else {
                throw new Error(response.error || 'Errore durante il caricamento delle statistiche');
            }
        } catch (error) {
            console.error('DashboardManager: Failed to load stats:', error);
            // Don't show error for background refreshes
        }
    }

    /**
     * Load recent activity
     */
    async loadRecentActivity() {
        try {
            const response = await securityGuard.makeSecureRequest('/dashboard/activity');
            
            if (response.success) {
                this.activities = response.data || [];
                this.updateActivityDisplay();
            } else {
                throw new Error(response.error || 'Errore durante il caricamento dell\'attività');
            }
        } catch (error) {
            console.error('DashboardManager: Failed to load activity:', error);
        }
    }

    /**
     * Load system status
     */
    async loadSystemStatus() {
        try {
            const response = await securityGuard.makeSecureRequest('/dashboard/status');
            
            if (response.success) {
                this.systemStatus = response.data || {};
                this.updateSystemStatusDisplay();
            } else {
                throw new Error(response.error || 'Errore durante il caricamento dello stato sistema');
            }
        } catch (error) {
            console.error('DashboardManager: Failed to load system status:', error);
        }
    }

    /**
     * Update dashboard display
     */
    updateDashboardDisplay() {
        this.updateStatsDisplay();
        this.updateActivityDisplay();
        this.updateSystemStatusDisplay();
        this.updateUserInfo();
    }

    /**
     * Update statistics display
     */
    updateStatsDisplay() {
        // Update stat cards
        const statCards = {
            totalPosts: { element: 'totalPosts', value: this.stats.posts_count || 0 },
            totalMedia: { element: 'totalMedia', value: this.stats.media_count || 0 },
            totalUsers: { element: 'totalUsers', value: this.stats.users_count || 0 },
            storageUsage: { element: 'storageUsage', value: this.formatStorageUsage(this.stats.storage_used || 0) }
        };

        Object.entries(statCards).forEach(([key, config]) => {
            const element = document.getElementById(config.element);
            if (element) {
                this.animateCounterTo(element, config.value);
            }
        });
    }

    /**
     * Update activity display
     */
    updateActivityDisplay() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        if (this.activities.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-clock fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Nessuna attività recente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="activity-list">
                ${this.activities.slice(0, 10).map(activity => `
                    <div class="activity-item d-flex align-items-start mb-3">
                        <div class="activity-icon me-3">
                            <i class="${this.getActivityIcon(activity.type)} text-${this.getActivityColor(activity.type)}"></i>
                        </div>
                        <div class="activity-content flex-grow-1">
                            <div class="activity-text">
                                ${this.formatActivityText(activity)}
                            </div>
                            <div class="activity-meta">
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>
                                    ${this.formatRelativeTime(activity.created_at)}
                                    ${activity.user ? `• ${activity.user.name}` : ''}
                                    ${activity.ip_address ? `• ${activity.ip_address}` : ''}
                                </small>
                            </div>
                        </div>
                    </div>
                `).join('')}
                
                ${this.activities.length > 10 ? `
                    <div class="text-center mt-3">
                        <button class="btn btn-sm btn-outline-secondary" onclick="dashboardManager.viewAllActivity()">
                            Vedi tutte le attività
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Update system status display
     */
    updateSystemStatusDisplay() {
        // This would typically show system health, server status, etc.
        // For now, we'll just log the status
        if (Object.keys(this.systemStatus).length > 0) {
            console.info('DashboardManager: System status updated', this.systemStatus);
        }
    }

    /**
     * Update user info in navigation
     */
    updateUserInfo() {
        const userElement = document.getElementById('currentUser');
        if (userElement && this.stats.current_user) {
            userElement.textContent = this.stats.current_user.name || 'Admin';
        }
    }

    /**
     * Handle login
     */
    async handleLogin(form) {
        try {
            this.showLoginLoading(true);
            
            const formData = new FormData(form);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password'),
                rememberMe: formData.get('rememberMe') === 'on'
            };
            
            const result = await securityGuard.login(credentials);
            
            if (result.success) {
                this.showAdminInterface();
                this.loadInitialData();
                this.setupRefreshTimers();
                this.showSuccess('Login effettuato con successo');
            }
            
        } catch (error) {
            console.error('DashboardManager: Login failed:', error);
            this.showLoginError(error.message);
        } finally {
            this.showLoginLoading(false);
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            await securityGuard.logout();
        } catch (error) {
            console.error('DashboardManager: Logout failed:', error);
        }
        
        this.clearRefreshTimers();
        this.showAuthModal();
    }

    /**
     * Show admin interface
     */
    showAdminInterface() {
        document.getElementById('adminInterface').classList.remove('d-none');
        
        const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (authModal) {
            authModal.hide();
        }
    }

    /**
     * Show authentication modal
     */
    showAuthModal() {
        document.getElementById('adminInterface').classList.add('d-none');
        
        const authModal = new bootstrap.Modal(document.getElementById('authModal'));
        authModal.show();
    }

    /**
     * Show login loading state
     */
    showLoginLoading(show) {
        const loginDiv = document.getElementById('auth-login');
        const loadingDiv = document.getElementById('auth-loading');
        
        if (show) {
            loginDiv.classList.add('d-none');
            loadingDiv.classList.remove('d-none');
        } else {
            loginDiv.classList.remove('d-none');
            loadingDiv.classList.add('d-none');
        }
    }

    /**
     * Show login error
     */
    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('d-none');
        }
    }

    /**
     * Show section
     */
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.add('d-none');
        });
        
        // Show requested section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Initialize section-specific functionality
        this.initializeSection(sectionName);
    }

    /**
     * Initialize section-specific functionality
     */
    initializeSection(sectionName) {
        switch (sectionName) {
            case 'posts':
                if (window.postsManager && !window.postsManager.initialized) {
                    window.postsManager.loadInitialData();
                    window.postsManager.initialized = true;
                }
                break;
                
            case 'media':
                if (window.mediaManager && !window.mediaManager.initialized) {
                    window.mediaManager.loadInitialData();
                    window.mediaManager.initialized = true;
                }
                break;
                
            case 'users':
                if (window.usersManager && !window.usersManager.initialized) {
                    window.usersManager.loadInitialData();
                    window.usersManager.initialized = true;
                }
                break;
                
            case 'settings':
                if (window.settingsManager && !window.settingsManager.initialized) {
                    window.settingsManager.loadInitialData();
                    window.settingsManager.initialized = true;
                }
                break;
        }
    }

    /**
     * View all activity
     */
    viewAllActivity() {
        // This would typically open a dedicated activity log page
        alert('Funzionalità in sviluppo: Log completo delle attività');
    }

    /**
     * Activity helpers
     */
    getActivityIcon(type) {
        const icons = {
            login: 'fas fa-sign-in-alt',
            logout: 'fas fa-sign-out-alt',
            create: 'fas fa-plus',
            update: 'fas fa-edit',
            delete: 'fas fa-trash',
            upload: 'fas fa-upload',
            download: 'fas fa-download',
            settings: 'fas fa-cog',
            error: 'fas fa-exclamation-triangle'
        };
        
        return icons[type] || 'fas fa-info';
    }

    getActivityColor(type) {
        const colors = {
            login: 'success',
            logout: 'secondary',
            create: 'primary',
            update: 'info',
            delete: 'danger',
            upload: 'success',
            download: 'info',
            settings: 'warning',
            error: 'danger'
        };
        
        return colors[type] || 'primary';
    }

    formatActivityText(activity) {
        const templates = {
            login: 'Accesso effettuato',
            logout: 'Disconnessione',
            create: `Creato ${activity.resource_type || 'elemento'}: ${activity.resource_name || ''}`,
            update: `Aggiornato ${activity.resource_type || 'elemento'}: ${activity.resource_name || ''}`,
            delete: `Eliminato ${activity.resource_type || 'elemento'}: ${activity.resource_name || ''}`,
            upload: `Caricato file: ${activity.resource_name || ''}`,
            download: `Scaricato file: ${activity.resource_name || ''}`,
            settings: 'Modificate impostazioni sistema',
            error: `Errore: ${activity.message || ''}`
        };
        
        return templates[activity.type] || activity.message || 'Attività sconosciuta';
    }

    /**
     * Utility functions
     */
    formatStorageUsage(bytes) {
        if (bytes === 0) return '0 GB';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Pochi secondi fa';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minuto${minutes > 1 ? 'i' : ''} fa`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ora${hours > 1 ? 'e' : ''} fa`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            if (days < 7) {
                return `${days} giorno${days > 1 ? 'i' : ''} fa`;
            } else {
                return date.toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        }
    }

    animateCounterTo(element, targetValue) {
        const currentValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
        
        if (typeof targetValue === 'string') {
            element.textContent = targetValue;
            return;
        }
        
        const duration = 1000; // 1 second
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            const currentNumber = Math.floor(currentValue + (targetValue - currentValue) * easedProgress);
            
            element.textContent = currentNumber.toLocaleString('it-IT');
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    clearRefreshTimers() {
        Object.values(this.timers).forEach(timer => {
            if (timer) {
                clearInterval(timer);
            }
        });
        
        this.timers = {
            stats: null,
            activity: null,
            status: null
        };
    }

    showLoading(containerId, show) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (show) {
            container.style.position = 'relative';
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border mb-3" role="status"></div>
                    <div>Caricamento dashboard...</div>
                </div>
            `;
            container.appendChild(overlay);
        } else {
            const overlay = container.querySelector('.loading-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showAlert(message, type) {
        if (window.securityGuard) {
            securityGuard.showAlert(message, type);
        } else {
            alert(message);
        }
    }

    /**
     * Cleanup on destroy
     */
    destroy() {
        this.clearRefreshTimers();
    }
}

// Global function for section navigation (used by onclick handlers)
function showSection(sectionName) {
    if (window.dashboardManager) {
        window.dashboardManager.showSection(sectionName);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Global dashboard manager instance
    window.dashboardManager = new DashboardManager();
});

console.info('DashboardManager: Dashboard system initialized successfully');