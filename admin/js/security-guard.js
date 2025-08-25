/**
 * IT-ERA Admin Panel - Security Guard
 * 
 * Advanced security system with authentication, authorization,
 * session management, and protection against common attacks.
 */

class SecurityGuard {
    constructor() {
        this.tokenManager = window.tokenManager;
        this.isAuthenticated = false;
        this.userPermissions = new Set();
        this.securityEvents = [];
        
        // Security configuration
        this.config = {
            MAX_LOGIN_ATTEMPTS: 5,
            LOGIN_COOLDOWN: 15 * 60 * 1000, // 15 minutes
            SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
            PASSWORD_MIN_LENGTH: 8,
            REQUIRE_STRONG_PASSWORD: true,
            ENABLE_2FA: false,
            CSP_ENABLED: true
        };
        
        // Rate limiting storage
        this.rateLimits = new Map();
        this.loginAttempts = new Map();
        
        this.init();
    }

    /**
     * Initialize security guard
     */
    init() {
        console.info('SecurityGuard: Initializing security system');
        
        this.setupEventListeners();
        this.setupCSPPolicy();
        this.setupSessionMonitoring();
        this.checkAuthentication();
        
        // Clean old rate limit data periodically
        setInterval(() => this.cleanupRateLimits(), 5 * 60 * 1000);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for token events
        document.addEventListener('tokenExpired', (e) => {
            this.handleTokenExpired(e.detail);
        });

        document.addEventListener('tokenRefreshed', (e) => {
            this.handleTokenRefreshed(e.detail);
        });

        // Setup visibility change handler for session management
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkSessionValidity();
            }
        });

        // Setup beforeunload handler
        window.addEventListener('beforeunload', () => {
            this.updateLastActivity();
        });

        // Monitor for security violations
        this.setupSecurityMonitoring();
    }

    /**
     * Setup Content Security Policy
     */
    setupCSPPolicy() {
        if (!this.config.CSP_ENABLED) return;

        // Add CSP meta tag if not already present
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            const cspMeta = document.createElement('meta');
            cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
            cspMeta.setAttribute('content', this.getCSPDirectives());
            document.head.appendChild(cspMeta);
        }
    }

    /**
     * Get CSP directives
     */
    getCSPDirectives() {
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
            "img-src 'self' data: https:",
            "font-src 'self' https://cdnjs.cloudflare.com",
            "connect-src 'self'",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'"
        ].join('; ');
    }

    /**
     * Setup session monitoring
     */
    setupSessionMonitoring() {
        // Check session validity every 5 minutes
        setInterval(() => {
            if (this.isAuthenticated) {
                this.checkSessionValidity();
            }
        }, 5 * 60 * 1000);

        // Activity tracking
        const activityEvents = ['click', 'keypress', 'scroll', 'mousemove'];
        activityEvents.forEach(event => {
            document.addEventListener(event, this.throttle(() => {
                this.updateLastActivity();
            }, 60000)); // Update once per minute max
        });
    }

    /**
     * Setup security monitoring
     */
    setupSecurityMonitoring() {
        // Monitor for potential XSS attempts
        window.addEventListener('error', (e) => {
            if (e.message && e.message.includes('script')) {
                this.logSecurityEvent('POTENTIAL_XSS', {
                    message: e.message,
                    source: e.filename,
                    line: e.lineno
                });
            }
        });

        // Monitor for console access (dev tools)
        let devtools = {
            open: false,
            orientation: null
        };

        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSecurityEvent('DEVTOOLS_OPENED', {
                        timestamp: new Date().toISOString()
                    });
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    /**
     * Check current authentication status
     */
    async checkAuthentication() {
        try {
            const token = this.tokenManager.getToken();
            
            if (!token) {
                this.handleUnauthenticated();
                return false;
            }

            // Validate token with server
            const response = await this.makeSecureRequest('/auth/validate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.success) {
                this.isAuthenticated = true;
                this.userPermissions = new Set(response.data.permissions || []);
                this.showAdminInterface();
                return true;
            } else {
                this.handleUnauthenticated();
                return false;
            }
        } catch (error) {
            console.error('SecurityGuard: Authentication check failed:', error);
            this.handleUnauthenticated();
            return false;
        }
    }

    /**
     * Perform login with security checks
     */
    async login(credentials) {
        try {
            const clientId = this.getClientFingerprint();
            
            // Check rate limiting
            if (!this.checkRateLimit('login', clientId)) {
                throw new Error('Troppi tentativi di login. Riprova più tardi.');
            }

            // Check login attempts
            if (!this.checkLoginAttempts(clientId)) {
                throw new Error('Account temporaneamente bloccato per sicurezza.');
            }

            // Validate credentials format
            this.validateCredentials(credentials);

            const response = await this.makeSecureRequest('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Fingerprint': clientId
                },
                body: JSON.stringify({
                    ...credentials,
                    clientInfo: this.getClientInfo()
                })
            });

            if (response.success) {
                // Clear login attempts on success
                this.loginAttempts.delete(clientId);
                
                // Store token
                const stored = this.tokenManager.storeToken(
                    response.data.token,
                    response.data.refreshToken,
                    credentials.rememberMe || false
                );

                if (stored) {
                    this.isAuthenticated = true;
                    this.userPermissions = new Set(response.data.permissions || []);
                    
                    this.logSecurityEvent('LOGIN_SUCCESS', {
                        userId: response.data.user?.id,
                        timestamp: new Date().toISOString()
                    });

                    return {
                        success: true,
                        user: response.data.user
                    };
                } else {
                    throw new Error('Errore durante il salvataggio della sessione');
                }
            } else {
                // Record failed attempt
                this.recordLoginAttempt(clientId, false);
                
                throw new Error(response.error || 'Credenziali non valide');
            }
        } catch (error) {
            this.logSecurityEvent('LOGIN_FAILED', {
                error: error.message,
                clientId: this.getClientFingerprint()
            });

            throw error;
        }
    }

    /**
     * Perform logout
     */
    async logout() {
        try {
            const token = this.tokenManager.getToken();
            
            if (token) {
                // Notify server of logout
                await this.makeSecureRequest('/auth/logout', {
                    method: 'POST',
                    headers: this.tokenManager.getAuthHeaders()
                }).catch(() => {
                    // Continue with logout even if server request fails
                    console.warn('SecurityGuard: Logout notification to server failed');
                });
            }

            this.isAuthenticated = false;
            this.userPermissions.clear();
            this.tokenManager.clearTokens();
            
            this.logSecurityEvent('LOGOUT', {
                timestamp: new Date().toISOString()
            });

            this.handleUnauthenticated();
            
        } catch (error) {
            console.error('SecurityGuard: Logout failed:', error);
            // Force local logout even if server logout fails
            this.isAuthenticated = false;
            this.userPermissions.clear();
            this.tokenManager.clearTokens();
            this.handleUnauthenticated();
        }
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(permission) {
        if (!this.isAuthenticated) {
            return false;
        }
        
        return this.userPermissions.has(permission) || 
               this.userPermissions.has('admin') ||
               this.userPermissions.has('*');
    }

    /**
     * Check if user has any of the specified permissions
     */
    hasAnyPermission(permissions) {
        return permissions.some(permission => this.hasPermission(permission));
    }

    /**
     * Make secure API request with automatic token handling
     */
    async makeSecureRequest(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Client-Fingerprint': this.getClientFingerprint(),
            ...options.headers
        };

        // Add authentication headers if available
        if (this.isAuthenticated && this.tokenManager.getToken()) {
            Object.assign(headers, this.tokenManager.getAuthHeaders());
        }

        const requestOptions = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${url}`, requestOptions);
            const data = await response.json();

            // Handle authentication errors
            if (response.status === 401) {
                this.handleTokenExpired();
                throw new Error('Sessione scaduta');
            }

            // Handle authorization errors
            if (response.status === 403) {
                throw new Error('Accesso non autorizzato');
            }

            // Handle rate limiting
            if (response.status === 429) {
                throw new Error('Troppe richieste. Riprova più tardi.');
            }

            return data;
            
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Errore di connessione al server');
            }
            throw error;
        }
    }

    /**
     * Validate credentials format
     */
    validateCredentials(credentials) {
        if (!credentials.email || !credentials.password) {
            throw new Error('Email e password sono obbligatori');
        }

        if (!this.isValidEmail(credentials.email)) {
            throw new Error('Formato email non valido');
        }

        if (credentials.password.length < this.config.PASSWORD_MIN_LENGTH) {
            throw new Error(`La password deve essere di almeno ${this.config.PASSWORD_MIN_LENGTH} caratteri`);
        }

        if (this.config.REQUIRE_STRONG_PASSWORD && !this.isStrongPassword(credentials.password)) {
            throw new Error('La password deve contenere almeno una maiuscola, una minuscola, un numero e un carattere speciale');
        }
    }

    /**
     * Check if email format is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Check if password is strong
     */
    isStrongPassword(password) {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        return strongRegex.test(password);
    }

    /**
     * Check rate limiting
     */
    checkRateLimit(action, identifier, limit = 10, window = 60000) {
        const key = `${action}:${identifier}`;
        const now = Date.now();
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, []);
        }
        
        const attempts = this.rateLimits.get(key);
        
        // Remove old attempts outside the window
        const recentAttempts = attempts.filter(time => now - time < window);
        this.rateLimits.set(key, recentAttempts);
        
        if (recentAttempts.length >= limit) {
            return false;
        }
        
        recentAttempts.push(now);
        return true;
    }

    /**
     * Check login attempts
     */
    checkLoginAttempts(clientId) {
        const attempts = this.loginAttempts.get(clientId) || { count: 0, lastAttempt: 0 };
        const now = Date.now();
        
        // Reset counter if cooldown period has passed
        if (now - attempts.lastAttempt > this.config.LOGIN_COOLDOWN) {
            attempts.count = 0;
        }
        
        return attempts.count < this.config.MAX_LOGIN_ATTEMPTS;
    }

    /**
     * Record login attempt
     */
    recordLoginAttempt(clientId, success) {
        if (success) {
            this.loginAttempts.delete(clientId);
            return;
        }
        
        const attempts = this.loginAttempts.get(clientId) || { count: 0, lastAttempt: 0 };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        
        this.loginAttempts.set(clientId, attempts);
    }

    /**
     * Get client fingerprint for tracking
     */
    getClientFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Client fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        return btoa(fingerprint).substring(0, 32);
    }

    /**
     * Get client information
     */
    getClientInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Check session validity
     */
    async checkSessionValidity() {
        if (!this.isAuthenticated) return;

        const lastActivity = this.getLastActivity();
        const now = Date.now();
        
        // Check for session timeout
        if (now - lastActivity > this.config.SESSION_TIMEOUT) {
            console.warn('SecurityGuard: Session timeout detected');
            this.handleSessionTimeout();
            return;
        }

        // Validate token with server periodically
        try {
            const token = this.tokenManager.getToken();
            if (token) {
                const response = await this.makeSecureRequest('/auth/validate', {
                    method: 'POST'
                });
                
                if (!response.success) {
                    this.handleTokenExpired();
                }
            }
        } catch (error) {
            console.error('SecurityGuard: Session validation failed:', error);
        }
    }

    /**
     * Handle unauthenticated state
     */
    handleUnauthenticated() {
        this.isAuthenticated = false;
        this.userPermissions.clear();
        
        // Hide admin interface
        document.getElementById('adminInterface').classList.add('d-none');
        
        // Show auth modal
        const authModal = new bootstrap.Modal(document.getElementById('authModal'));
        authModal.show();
    }

    /**
     * Show admin interface
     */
    showAdminInterface() {
        // Hide auth modal
        const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (authModal) {
            authModal.hide();
        }
        
        // Show admin interface
        document.getElementById('adminInterface').classList.remove('d-none');
        
        // Initialize dashboard
        if (window.dashboardManager) {
            window.dashboardManager.init();
        }
    }

    /**
     * Handle token expiration
     */
    handleTokenExpired(detail) {
        console.warn('SecurityGuard: Token expired', detail);
        
        this.logSecurityEvent('TOKEN_EXPIRED', detail);
        this.handleUnauthenticated();
        
        this.showAlert('Sessione scaduta. Effettua nuovamente il login.', 'warning');
    }

    /**
     * Handle token refresh
     */
    handleTokenRefreshed(detail) {
        console.info('SecurityGuard: Token refreshed', detail);
        
        this.logSecurityEvent('TOKEN_REFRESHED', detail);
        this.showAlert('Sessione rinnovata automaticamente.', 'success', 3000);
    }

    /**
     * Handle session timeout
     */
    handleSessionTimeout() {
        console.warn('SecurityGuard: Session timeout');
        
        this.logSecurityEvent('SESSION_TIMEOUT', {
            lastActivity: new Date(this.getLastActivity()).toISOString()
        });
        
        this.logout();
        this.showAlert('Sessione scaduta per inattività.', 'warning');
    }

    /**
     * Update last activity timestamp
     */
    updateLastActivity() {
        if (this.isAuthenticated) {
            localStorage.setItem('lastActivity', Date.now().toString());
        }
    }

    /**
     * Get last activity timestamp
     */
    getLastActivity() {
        const stored = localStorage.getItem('lastActivity');
        return stored ? parseInt(stored) : Date.now();
    }

    /**
     * Log security event
     */
    logSecurityEvent(type, data) {
        const event = {
            type,
            timestamp: new Date().toISOString(),
            clientId: this.getClientFingerprint(),
            ...data
        };
        
        this.securityEvents.push(event);
        
        // Keep only last 100 events
        if (this.securityEvents.length > 100) {
            this.securityEvents = this.securityEvents.slice(-100);
        }
        
        // Send critical events to server
        const criticalEvents = ['LOGIN_FAILED', 'POTENTIAL_XSS', 'DEVTOOLS_OPENED'];
        if (criticalEvents.includes(type)) {
            this.reportSecurityEvent(event).catch(console.error);
        }
    }

    /**
     * Report security event to server
     */
    async reportSecurityEvent(event) {
        try {
            await this.makeSecureRequest('/security/event', {
                method: 'POST',
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error('SecurityGuard: Failed to report security event:', error);
        }
    }

    /**
     * Clean up old rate limit data
     */
    cleanupRateLimits() {
        const now = Date.now();
        const cleanupThreshold = 60 * 60 * 1000; // 1 hour
        
        for (const [key, attempts] of this.rateLimits.entries()) {
            const recentAttempts = attempts.filter(time => now - time < cleanupThreshold);
            if (recentAttempts.length === 0) {
                this.rateLimits.delete(key);
            } else {
                this.rateLimits.set(key, recentAttempts);
            }
        }
    }

    /**
     * Show alert message
     */
    showAlert(message, type = 'info', duration = 5000) {
        const alertContainer = document.getElementById('alertContainer') || document.body;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
        
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto remove alert
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, duration);
    }

    /**
     * Throttle function calls
     */
    throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return (...args) => {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    /**
     * Get security status
     */
    getSecurityStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            permissions: Array.from(this.userPermissions),
            tokenInfo: this.tokenManager.getTokenInfo(),
            recentEvents: this.securityEvents.slice(-10),
            rateLimits: Object.fromEntries(this.rateLimits),
            loginAttempts: Object.fromEntries(this.loginAttempts)
        };
    }
}

// Global security guard instance
const securityGuard = new SecurityGuard();

// Export for use in other modules
window.securityGuard = securityGuard;

console.info('SecurityGuard: Security system initialized successfully');