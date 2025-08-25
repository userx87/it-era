/**
 * IT-ERA Admin Panel - JWT Token Manager
 * 
 * Secure token persistence and management system with auto-refresh,
 * encryption, and "Remember Me" functionality.
 */

class TokenManager {
    constructor() {
        this.token = null;
        this.refreshToken = null;
        this.tokenPayload = null;
        this.refreshTimer = null;
        this.rememberMe = false;
        this.encryptionKey = this.generateEncryptionKey();
        
        // Constants
        this.REFRESH_BUFFER_TIME = 5 * 60 * 1000; // 5 minutes before expiry
        this.MAX_RETRY_ATTEMPTS = 3;
        this.RETRY_DELAY = 1000; // 1 second
        
        this.init();
    }

    /**
     * Initialize token manager and restore existing tokens
     */
    init() {
        console.info('TokenManager: Initializing secure token management');
        this.loadStoredTokens();
        this.setupAutoRefresh();
        this.setupBeforeUnloadHandler();
    }

    /**
     * Generate encryption key for token storage
     */
    generateEncryptionKey() {
        const userAgent = navigator.userAgent;
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 15);
        
        // Create a simple encryption key from available browser data
        return btoa(userAgent + timestamp + random).substring(0, 32);
    }

    /**
     * Simple encryption for token storage
     */
    encrypt(data) {
        try {
            const jsonString = JSON.stringify(data);
            return btoa(jsonString + '|' + this.encryptionKey);
        } catch (error) {
            console.error('TokenManager: Encryption failed:', error);
            return null;
        }
    }

    /**
     * Simple decryption for token storage
     */
    decrypt(encryptedData) {
        try {
            const decoded = atob(encryptedData);
            const parts = decoded.split('|');
            
            if (parts.length !== 2 || parts[1] !== this.encryptionKey) {
                console.warn('TokenManager: Invalid encryption key or format');
                return null;
            }
            
            return JSON.parse(parts[0]);
        } catch (error) {
            console.error('TokenManager: Decryption failed:', error);
            return null;
        }
    }

    /**
     * Store token securely with encryption
     */
    storeToken(token, refreshToken = null, rememberMe = false) {
        try {
            this.token = token;
            this.refreshToken = refreshToken;
            this.rememberMe = rememberMe;
            
            // Parse token payload
            this.tokenPayload = this.parseJWTPayload(token);
            
            if (!this.tokenPayload) {
                throw new Error('Invalid JWT token structure');
            }

            const tokenData = {
                token: token,
                refreshToken: refreshToken,
                timestamp: Date.now(),
                expiresAt: this.tokenPayload.exp * 1000,
                rememberMe: rememberMe
            };

            const encryptedData = this.encrypt(tokenData);
            
            if (!encryptedData) {
                throw new Error('Token encryption failed');
            }

            const storage = rememberMe ? localStorage : sessionStorage;
            
            // Store encrypted token
            storage.setItem('it_era_admin_token', encryptedData);
            
            // Store token metadata for quick access
            storage.setItem('it_era_token_meta', JSON.stringify({
                hasToken: true,
                expiresAt: this.tokenPayload.exp * 1000,
                rememberMe: rememberMe,
                lastActivity: Date.now()
            }));

            console.info('TokenManager: Token stored securely', {
                storage: rememberMe ? 'localStorage' : 'sessionStorage',
                expiresAt: new Date(this.tokenPayload.exp * 1000).toISOString(),
                timeToExpiry: this.getTimeToExpiry()
            });

            this.setupAutoRefresh();
            return true;

        } catch (error) {
            console.error('TokenManager: Failed to store token:', error);
            this.clearTokens();
            return false;
        }
    }

    /**
     * Load stored tokens from storage
     */
    loadStoredTokens() {
        try {
            // Check both storage types
            let encryptedData = localStorage.getItem('it_era_admin_token');
            let isFromLocalStorage = true;
            
            if (!encryptedData) {
                encryptedData = sessionStorage.getItem('it_era_admin_token');
                isFromLocalStorage = false;
            }

            if (!encryptedData) {
                console.info('TokenManager: No stored tokens found');
                return false;
            }

            const tokenData = this.decrypt(encryptedData);
            
            if (!tokenData) {
                console.warn('TokenManager: Failed to decrypt stored token');
                this.clearTokens();
                return false;
            }

            // Validate token age (max 30 days)
            const tokenAge = Date.now() - tokenData.timestamp;
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            
            if (tokenAge > maxAge) {
                console.warn('TokenManager: Stored token is too old');
                this.clearTokens();
                return false;
            }

            // Check if token is expired
            if (Date.now() >= tokenData.expiresAt) {
                console.info('TokenManager: Stored token is expired');
                
                // Try to refresh if we have a refresh token
                if (tokenData.refreshToken) {
                    this.refreshToken = tokenData.refreshToken;
                    return this.attemptTokenRefresh();
                }
                
                this.clearTokens();
                return false;
            }

            this.token = tokenData.token;
            this.refreshToken = tokenData.refreshToken;
            this.rememberMe = tokenData.rememberMe;
            this.tokenPayload = this.parseJWTPayload(tokenData.token);

            console.info('TokenManager: Tokens loaded successfully', {
                source: isFromLocalStorage ? 'localStorage' : 'sessionStorage',
                expiresAt: new Date(tokenData.expiresAt).toISOString(),
                timeToExpiry: this.getTimeToExpiry()
            });

            return true;

        } catch (error) {
            console.error('TokenManager: Failed to load stored tokens:', error);
            this.clearTokens();
            return false;
        }
    }

    /**
     * Parse JWT payload from token
     */
    parseJWTPayload(token) {
        try {
            if (!token || typeof token !== 'string') {
                return null;
            }

            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }

            const payload = JSON.parse(atob(parts[1]));
            
            // Validate required fields
            if (!payload.sub || !payload.exp || !payload.iat) {
                return null;
            }

            return payload;
        } catch (error) {
            console.error('TokenManager: JWT parsing failed:', error);
            return null;
        }
    }

    /**
     * Get current valid token
     */
    getToken() {
        if (!this.token || !this.tokenPayload) {
            return null;
        }

        // Check if token is expired
        if (this.isTokenExpired()) {
            console.warn('TokenManager: Token is expired');
            return null;
        }

        return this.token;
    }

    /**
     * Check if current token is expired
     */
    isTokenExpired() {
        if (!this.tokenPayload || !this.tokenPayload.exp) {
            return true;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        const bufferTime = 30; // 30 second buffer
        
        return currentTime >= (this.tokenPayload.exp - bufferTime);
    }

    /**
     * Get time remaining until token expiry
     */
    getTimeToExpiry() {
        if (!this.tokenPayload || !this.tokenPayload.exp) {
            return 0;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = this.tokenPayload.exp - currentTime;
        
        return Math.max(0, timeRemaining * 1000); // Convert to milliseconds
    }

    /**
     * Setup automatic token refresh
     */
    setupAutoRefresh() {
        // Clear existing timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        if (!this.token || !this.tokenPayload) {
            return;
        }

        const timeToExpiry = this.getTimeToExpiry();
        const refreshTime = Math.max(0, timeToExpiry - this.REFRESH_BUFFER_TIME);

        console.info('TokenManager: Auto-refresh scheduled', {
            timeToExpiry: Math.floor(timeToExpiry / 1000) + 's',
            refreshIn: Math.floor(refreshTime / 1000) + 's'
        });

        this.refreshTimer = setTimeout(() => {
            console.info('TokenManager: Auto-refresh triggered');
            this.attemptTokenRefresh();
        }, refreshTime);
    }

    /**
     * Attempt to refresh the current token
     */
    async attemptTokenRefresh(retryCount = 0) {
        if (!this.refreshToken) {
            console.warn('TokenManager: No refresh token available');
            return false;
        }

        try {
            console.info(`TokenManager: Attempting token refresh (attempt ${retryCount + 1}/${this.MAX_RETRY_ATTEMPTS})`);

            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.refreshToken}`
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken
                }),
                timeout: 10000
            });

            if (!response.ok) {
                throw new Error(`Refresh failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.data && data.data.token) {
                // Store new token
                const newRefreshToken = data.data.refreshToken || this.refreshToken;
                
                if (this.storeToken(data.data.token, newRefreshToken, this.rememberMe)) {
                    console.info('TokenManager: Token refreshed successfully');
                    
                    // Dispatch event for UI updates
                    this.dispatchTokenRefreshEvent();
                    
                    return true;
                } else {
                    throw new Error('Failed to store refreshed token');
                }
            } else {
                throw new Error(data.error || data.message || 'Invalid refresh response');
            }

        } catch (error) {
            console.error('TokenManager: Token refresh failed:', error);

            // Retry with exponential backoff
            if (retryCount < this.MAX_RETRY_ATTEMPTS - 1) {
                const delay = this.RETRY_DELAY * Math.pow(2, retryCount);
                
                console.info(`TokenManager: Retrying refresh in ${delay}ms`);
                
                setTimeout(() => {
                    this.attemptTokenRefresh(retryCount + 1);
                }, delay);
                
                return false;
            }

            // Max retries reached, force logout
            console.error('TokenManager: Max refresh retries reached, forcing logout');
            this.handleTokenExpired();
            return false;
        }
    }

    /**
     * Handle token expiration
     */
    handleTokenExpired() {
        console.warn('TokenManager: Token expired, initiating logout');
        
        this.clearTokens();
        
        // Dispatch token expired event
        const event = new CustomEvent('tokenExpired', {
            detail: {
                reason: 'Token expired and refresh failed',
                timestamp: new Date().toISOString()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Dispatch token refresh event
     */
    dispatchTokenRefreshEvent() {
        const event = new CustomEvent('tokenRefreshed', {
            detail: {
                newToken: this.token,
                expiresAt: this.tokenPayload.exp * 1000,
                timestamp: new Date().toISOString()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Clear all stored tokens
     */
    clearTokens() {
        console.info('TokenManager: Clearing all stored tokens');

        // Clear memory
        this.token = null;
        this.refreshToken = null;
        this.tokenPayload = null;
        this.rememberMe = false;

        // Clear timers
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        // Clear storage
        localStorage.removeItem('it_era_admin_token');
        localStorage.removeItem('it_era_token_meta');
        sessionStorage.removeItem('it_era_admin_token');
        sessionStorage.removeItem('it_era_token_meta');

        // Clear any legacy token storage
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminToken');
    }

    /**
     * Get authorization headers for API requests
     */
    getAuthHeaders() {
        const token = this.getToken();
        
        if (!token) {
            return {};
        }

        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = this.getToken();
        return token !== null && !this.isTokenExpired();
    }

    /**
     * Get token information for debugging
     */
    getTokenInfo() {
        if (!this.token || !this.tokenPayload) {
            return null;
        }

        return {
            isValid: this.isAuthenticated(),
            expiresAt: new Date(this.tokenPayload.exp * 1000).toISOString(),
            timeToExpiry: this.getTimeToExpiry(),
            hasRefreshToken: !!this.refreshToken,
            rememberMe: this.rememberMe,
            subject: this.tokenPayload.sub,
            issuedAt: new Date(this.tokenPayload.iat * 1000).toISOString()
        };
    }

    /**
     * Setup before unload handler to update last activity
     */
    setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            if (this.isAuthenticated()) {
                const storage = this.rememberMe ? localStorage : sessionStorage;
                const meta = JSON.parse(storage.getItem('it_era_token_meta') || '{}');
                
                meta.lastActivity = Date.now();
                storage.setItem('it_era_token_meta', JSON.stringify(meta));
            }
        });
    }

    /**
     * Validate token format and structure
     */
    validateTokenStructure(token) {
        try {
            if (!token || typeof token !== 'string') {
                return false;
            }

            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }

            // Validate header
            const header = JSON.parse(atob(parts[0]));
            if (!header.alg || !header.typ || header.typ !== 'JWT') {
                return false;
            }

            // Validate payload
            const payload = JSON.parse(atob(parts[1]));
            if (!payload.sub || !payload.exp || !payload.iat) {
                return false;
            }

            // Check token age (not too old)
            const issuedAt = payload.iat * 1000;
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            
            if (Date.now() - issuedAt > maxAge) {
                return false;
            }

            return true;

        } catch (error) {
            console.error('TokenManager: Token validation failed:', error);
            return false;
        }
    }

    /**
     * Force token refresh (manual trigger)
     */
    async forceRefresh() {
        console.info('TokenManager: Manual token refresh requested');
        return await this.attemptTokenRefresh();
    }
}

// Global token manager instance
const tokenManager = new TokenManager();

// Export for use in other modules
window.tokenManager = tokenManager;

console.info('TokenManager: JWT Token Manager initialized successfully');