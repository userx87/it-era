/**
 * IT-ERA Admin Authentication System
 * Handles login, session management, and access control
 */

class AdminAuth {
    constructor() {
        this.sessionKey = 'itera_admin_session';
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
        this.credentials = {
            // In production, these should be stored securely server-side
            'admin': 'IT-ERA2025!Admin',
            'editor': 'IT-ERA2025!Editor',
            'seo': 'IT-ERA2025!SEO'
        };
        
        this.permissions = {
            'admin': ['blog', 'seo', 'sitemap', 'users', 'settings'],
            'editor': ['blog', 'seo'],
            'seo': ['seo', 'sitemap']
        };
        
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.setupEventListeners();
        this.setupSessionTimeout();
    }

    setupEventListeners() {
        // Login form
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Session activity tracking
        document.addEventListener('click', () => this.updateActivity());
        document.addEventListener('keypress', () => this.updateActivity());
    }

    setupSessionTimeout() {
        // Check session validity every minute
        setInterval(() => {
            if (this.isSessionExpired()) {
                this.logout();
                this.showNotification('Session expired. Please login again.', 'warning');
            }
        }, 60000);
    }

    handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('auth-error');
        
        // Clear previous errors
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
        
        // Validate credentials
        if (this.validateCredentials(username, password)) {
            this.createSession(username);
            this.showDashboard();
            this.showNotification(`Welcome back, ${username}!`, 'success');
        } else {
            errorDiv.textContent = 'Invalid username or password';
            errorDiv.classList.remove('hidden');
            
            // Add shake animation to form
            const authCheck = document.getElementById('auth-check');
            authCheck.classList.add('animate-shake');
            setTimeout(() => authCheck.classList.remove('animate-shake'), 500);
        }
    }

    validateCredentials(username, password) {
        return this.credentials[username] && this.credentials[username] === password;
    }

    createSession(username) {
        const session = {
            username: username,
            role: this.getUserRole(username),
            loginTime: Date.now(),
            lastActivity: Date.now(),
            permissions: this.permissions[this.getUserRole(username)] || []
        };
        
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
        this.currentSession = session;
    }

    getUserRole(username) {
        // Determine role based on username or could be from database
        if (username === 'admin') return 'admin';
        if (username === 'editor') return 'editor';
        if (username === 'seo') return 'seo';
        return 'viewer';
    }

    checkExistingSession() {
        const sessionData = localStorage.getItem(this.sessionKey);
        
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                
                if (this.isSessionValid(session)) {
                    this.currentSession = session;
                    this.showDashboard();
                    this.updateUserInfo();
                    return;
                }
            } catch (error) {
                console.error('Invalid session data:', error);
            }
        }
        
        this.showLogin();
    }

    isSessionValid(session) {
        if (!session || !session.loginTime || !session.lastActivity) {
            return false;
        }
        
        const now = Date.now();
        const sessionAge = now - session.loginTime;
        const inactivityTime = now - session.lastActivity;
        
        // Session expires after 8 hours or 2 hours of inactivity
        return sessionAge < this.sessionTimeout && inactivityTime < (2 * 60 * 60 * 1000);
    }

    isSessionExpired() {
        return !this.currentSession || !this.isSessionValid(this.currentSession);
    }

    updateActivity() {
        if (this.currentSession) {
            this.currentSession.lastActivity = Date.now();
            localStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));
        }
    }

    showLogin() {
        document.getElementById('auth-check').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('auth-check').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        this.updateUserInfo();
    }

    updateUserInfo() {
        if (this.currentSession) {
            const userNameEl = document.getElementById('user-name');
            const userInitialEl = document.getElementById('user-initial');
            
            if (userNameEl) {
                userNameEl.textContent = this.currentSession.username;
            }
            
            if (userInitialEl) {
                userInitialEl.textContent = this.currentSession.username.charAt(0).toUpperCase();
            }
        }
    }

    logout() {
        localStorage.removeItem(this.sessionKey);
        this.currentSession = null;
        this.showLogin();
        
        // Clear form
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.reset();
        }
        
        this.showNotification('Logged out successfully', 'success');
    }

    hasPermission(permission) {
        return this.currentSession && 
               this.currentSession.permissions && 
               this.currentSession.permissions.includes(permission);
    }

    requirePermission(permission) {
        if (!this.hasPermission(permission)) {
            this.showNotification('Access denied. Insufficient permissions.', 'error');
            return false;
        }
        return true;
    }

    getCurrentUser() {
        return this.currentSession ? this.currentSession.username : null;
    }

    getCurrentRole() {
        return this.currentSession ? this.currentSession.role : null;
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="mr-3">
                        ${this.getNotificationIcon(type)}
                    </div>
                    <span>${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
            error: '<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
            warning: '<svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>',
            info: '<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        };
        return icons[type] || icons.info;
    }

    // Security helpers
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    validateCSRF(token) {
        // In production, implement proper CSRF validation
        return true;
    }

    logSecurityEvent(event, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            user: this.getCurrentUser(),
            ip: 'client-side', // In production, get from server
            details: details
        };
        
        console.log('Security Event:', logEntry);
        
        // In production, send to server for logging
        // this.sendSecurityLog(logEntry);
    }
}

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
    .animate-shake {
        animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize authentication system
window.adminAuth = new AdminAuth();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminAuth;
}
