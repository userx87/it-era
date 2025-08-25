/**
 * IT-ERA Admin Panel - Central Authentication Guard System
 * CRITICAL SECURITY: This file implements authentication guards to prevent unauthorized access
 */

// Security Guard System - Prevents ANY access without valid JWT
class SecurityGuard {
    constructor() {
        this.isSecurityCheckComplete = false;
        this.token = null;
        this.tokenPayload = null;
        
        // Initialize security check IMMEDIATELY
        this.initializeSecurity();
    }

    /**
     * CRITICAL: Initialize security check before ANY other operations
     */
    async initializeSecurity() {
        // Hide ALL UI content until security check passes
        this.hideUIContent();
        
        // Show security loading screen
        this.showSecurityLoading();
        
        // Perform comprehensive security validation
        const isSecure = await this.performSecurityCheck();
        
        if (!isSecure) {
            // BLOCK ALL ACCESS - redirect to login
            this.blockAccess();
            return;
        }
        
        // Security passed - allow UI to load
        this.allowAccess();
    }

    /**
     * Hide all UI content until security check passes
     */
    hideUIContent() {
        const body = document.body;
        if (body) {
            // Create security overlay that blocks ALL content
            const securityOverlay = document.createElement('div');
            securityOverlay.id = 'security-overlay';
            securityOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #ffffff;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            `;
            body.appendChild(securityOverlay);
        }
    }

    /**
     * Show security loading screen
     */
    showSecurityLoading() {
        const overlay = document.getElementById('security-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Verifica sicurezza...</span>
                    </div>
                    <h5 class="text-muted">Verifica autenticazione...</h5>
                    <p class="text-muted">Controllo credenziali di accesso</p>
                </div>
            `;
        }
    }

    /**
     * CRITICAL: Comprehensive security validation with TokenManager integration
     */
    async performSecurityCheck() {
        try {
            // Wait for TokenManager to be available
            if (!window.tokenManager) {
                console.warn('Security Check Failed: TokenManager not available');
                return false;
            }

            // Step 1: Check TokenManager authentication status
            if (!window.tokenManager.isAuthenticated()) {
                console.warn('Security Check Failed: TokenManager reports not authenticated');
                return false;
            }

            // Step 2: Get validated token from TokenManager
            this.token = window.tokenManager.getToken();
            if (!this.token) {
                console.warn('Security Check Failed: No valid token from TokenManager');
                return false;
            }

            // Step 3: Get token payload from TokenManager
            this.tokenPayload = window.tokenManager.tokenPayload;
            if (!this.tokenPayload) {
                console.warn('Security Check Failed: No token payload available');
                return false;
            }

            // Step 4: Validate token with server (optional - TokenManager handles most validation)
            const isValidOnServer = await this.validateTokenWithServer();
            if (!isValidOnServer) {
                console.warn('Security Check Failed: Server validation failed');
                // Don't clear tokens here - let TokenManager handle expiration
                window.tokenManager.handleTokenExpired();
                return false;
            }

            console.info('Security Check Passed: Authentication validated via TokenManager');
            return true;

        } catch (error) {
            console.error('Security Check Failed: Unexpected error:', error);
            // Let TokenManager handle cleanup
            if (window.tokenManager) {
                window.tokenManager.handleTokenExpired();
            }
            return false;
        }
    }

    /**
     * Check if JWT token is expired
     */
    isTokenExpired() {
        if (!this.tokenPayload || !this.tokenPayload.exp) {
            return true;
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        const tokenExpiration = this.tokenPayload.exp;
        
        // Add 60 second buffer for clock skew
        return currentTime >= (tokenExpiration - 60);
    }

    /**
     * Validate token with server using TokenManager headers
     */
    async validateTokenWithServer() {
        try {
            const headers = window.tokenManager ? 
                window.tokenManager.getAuthHeaders() : 
                {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                };

            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/verify`, {
                method: 'GET',
                headers: headers,
                timeout: 10000 // 10 second timeout
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            return data.success === true && data.data && data.data.user;

        } catch (error) {
            console.error('Server token validation failed:', error);
            return false;
        }
    }

    /**
     * Clear invalid or expired tokens using TokenManager
     */
    clearInvalidToken() {
        // Use TokenManager to clear tokens if available
        if (window.tokenManager) {
            window.tokenManager.clearTokens();
        } else {
            // Fallback to manual clearing
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
        }
        
        this.token = null;
        this.tokenPayload = null;
    }

    /**
     * BLOCK access - show login modal and prevent any UI interaction
     */
    blockAccess() {
        const overlay = document.getElementById('security-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="text-center">
                    <div class="alert alert-danger">
                        <i class="bi bi-shield-x fs-1 text-danger mb-3"></i>
                        <h4>Accesso Negato</h4>
                        <p>Credenziali di autenticazione non valide o scadute.</p>
                        <p>Effettua il login per continuare.</p>
                    </div>
                </div>
            `;
        }

        // Force show login modal after short delay
        setTimeout(() => {
            this.forceLogin();
        }, 2000);
    }

    /**
     * Allow access - remove security overlay and initialize app
     */
    allowAccess() {
        this.isSecurityCheckComplete = true;
        
        // Remove security overlay
        const overlay = document.getElementById('security-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Initialize the admin panel
        this.initializeAdminPanel();
    }

    /**
     * Force user to login
     */
    forceLogin() {
        // Ensure login modal exists
        if (!document.getElementById('loginModal')) {
            console.error('Login modal not found - creating emergency login');
            this.createEmergencyLogin();
            return;
        }

        // Remove security overlay
        const overlay = document.getElementById('security-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Show login modal with backdrop that cannot be dismissed
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'), {
            backdrop: 'static',
            keyboard: false
        });
        loginModal.show();
    }

    /**
     * Create emergency login if modal doesn't exist
     */
    createEmergencyLogin() {
        document.body.innerHTML = `
            <div class="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
                <div class="card shadow-lg" style="max-width: 400px; width: 100%;">
                    <div class="card-header bg-primary text-white text-center">
                        <h5 class="mb-0">
                            <i class="bi bi-shield-lock me-2"></i>IT-ERA Admin Login
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-warning">
                            <strong>Sicurezza:</strong> Autenticazione richiesta per l'accesso.
                        </div>
                        <form id="emergencyLoginForm">
                            <div class="mb-3">
                                <label for="loginEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="loginEmail" required>
                            </div>
                            <div class="mb-3">
                                <label for="loginPassword" class="form-label">Password</label>
                                <input type="password" class="form-control" id="loginPassword" required>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-box-arrow-in-right me-2"></i>Accedi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Add emergency login handler
        document.getElementById('emergencyLoginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Attempt login (will be handled by auth manager)
            if (window.authManager) {
                const success = await authManager.login(email, password);
                if (success) {
                    location.reload(); // Reload to restart security check
                }
            }
        });
    }

    /**
     * Initialize admin panel after security check passes
     */
    initializeAdminPanel() {
        // Call the main initialization function if it exists
        if (typeof initializeAdmin === 'function') {
            initializeAdmin();
        }
        
        // Dispatch security complete event
        document.dispatchEvent(new CustomEvent('securityCheckComplete', {
            detail: { 
                authenticated: true,
                token: this.token,
                payload: this.tokenPayload
            }
        }));
    }

    /**
     * Get current authentication status
     */
    getAuthStatus() {
        return {
            isAuthenticated: this.isSecurityCheckComplete,
            token: this.token,
            payload: this.tokenPayload,
            isExpired: this.isTokenExpired()
        };
    }
}

// Global security guard instance - MUST be initialized before anything else
const securityGuard = new SecurityGuard();

// Enhanced page visibility change handler for security
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && securityGuard.isSecurityCheckComplete) {
        // Re-validate token when page becomes visible again
        setTimeout(() => {
            securityGuard.performSecurityCheck().then(isValid => {
                if (!isValid) {
                    securityGuard.blockAccess();
                }
            });
        }, 1000);
    }
});

// Periodic token validation (every 5 minutes)
setInterval(() => {
    if (securityGuard.isSecurityCheckComplete) {
        securityGuard.performSecurityCheck().then(isValid => {
            if (!isValid) {
                console.warn('Periodic security check failed - blocking access');
                securityGuard.blockAccess();
            }
        });
    }
}, 5 * 60 * 1000); // 5 minutes

// Export for global access
window.securityGuard = securityGuard;

// Console warning for security
console.warn('🛡️ IT-ERA Admin Panel - Security Guard Active');
console.warn('⚠️ All access is monitored and logged');
console.warn('🔒 Unauthorized access attempts will be blocked');