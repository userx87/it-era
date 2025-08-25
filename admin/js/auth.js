// SECURE Authentication Management with JWT Validation
class AuthManager {
    constructor() {
        // Initialize with TokenManager integration
        this.tokenManager = window.tokenManager || null;
        this.user = null;
        this.isAuthenticated = false;
        this.lastAuthCheck = null;
        this.authCheckInterval = 5 * 60 * 1000; // 5 minutes
        
        // Bind methods to maintain context
        this.checkAuth = this.checkAuth.bind(this);
        this.validateJWT = this.validateJWT.bind(this);
        this.isTokenExpired = this.isTokenExpired.bind(this);
        
        // Setup token manager event listeners
        this.setupTokenManagerEvents();
    }
    
    /**
     * Setup event listeners for TokenManager
     */
    setupTokenManagerEvents() {
        // Listen for token refresh events
        document.addEventListener('tokenRefreshed', (event) => {
            console.info('AuthManager: Token refreshed automatically');
            this.lastAuthCheck = Date.now();
            
            // Show subtle notification
            if (typeof showNotification === 'function') {
                showNotification('Sessione rinnovata automaticamente', 'info');
            }
        });

        // Listen for token expiration events
        document.addEventListener('tokenExpired', (event) => {
            console.warn('AuthManager: Token expired event received');
            this.handleTokenExpiration(event.detail);
        });
    }

    /**
     * Handle token expiration
     */
    handleTokenExpiration(detail) {
        this.user = null;
        this.isAuthenticated = false;
        this.lastAuthCheck = null;
        
        // Clear application state
        this.clearApplicationState();
        
        // Show login modal with expiration message
        if (typeof showNotification === 'function') {
            showNotification('Sessione scaduta. Effettua nuovamente il login.', 'warning');
        }
        
        this.showLoginModal();
    }

    /**
     * Get current token from TokenManager
     */
    get token() {
        return this.tokenManager ? this.tokenManager.getToken() : null;
    }

    /**
     * Get token payload from TokenManager
     */
    get tokenPayload() {
        return this.tokenManager ? this.tokenManager.tokenPayload : null;
    }

    /**
     * CRITICAL: Enhanced authentication check with TokenManager integration
     */
    async checkAuth() {
        // Check TokenManager first
        if (!this.tokenManager) {
            console.error('AuthManager: TokenManager not available');
            this.logout();
            return false;
        }

        // Use TokenManager's authentication check
        if (!this.tokenManager.isAuthenticated()) {
            console.warn('AuthManager: TokenManager reports not authenticated');
            this.logout();
            return false;
        }

        const token = this.tokenManager.getToken();
        if (!token) {
            console.warn('AuthManager: No valid token available');
            this.logout();
            return false;
        }

        // Skip server validation if recently checked (within 1 minute)
        const now = Date.now();
        if (this.lastAuthCheck && (now - this.lastAuthCheck) < 60000 && this.isAuthenticated) {
            return true;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/verify`, {
                method: 'GET',
                headers: this.tokenManager.getAuthHeaders(),
                timeout: 10000 // 10 second timeout
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.data && data.data.user) {
                    this.user = data.data.user;
                    this.isAuthenticated = true;
                    this.lastAuthCheck = now;
                    this.updateUI();
                    return true;
                } else {
                    console.warn('AuthManager: Invalid server response');
                    this.logout();
                    return false;
                }
            } else {
                console.warn('AuthManager: Server returned non-OK status:', response.status);
                
                // If 401 Unauthorized, let TokenManager handle it
                if (response.status === 401) {
                    this.tokenManager.handleTokenExpired();
                } else {
                    this.logout();
                }
                return false;
            }
        } catch (error) {
            console.error('AuthManager: Auth check failed:', error);
            this.logout();
            return false;
        }
    }

    /**
     * Validate JWT format and structure
     */
    validateJWT() {
        if (!this.token || typeof this.token !== 'string') {
            return false;
        }

        // JWT must have exactly 3 parts separated by dots
        const tokenParts = this.token.split('.');
        if (tokenParts.length !== 3) {
            console.warn('AuthManager: Invalid JWT format - wrong number of parts');
            return false;
        }

        try {
            // Decode and validate header
            const header = JSON.parse(atob(tokenParts[0]));
            if (!header.alg || !header.typ || header.typ !== 'JWT') {
                console.warn('AuthManager: Invalid JWT header');
                return false;
            }

            // Decode and validate payload
            this.tokenPayload = JSON.parse(atob(tokenParts[1]));
            if (!this.tokenPayload.sub || !this.tokenPayload.exp || !this.tokenPayload.iat) {
                console.warn('AuthManager: Invalid JWT payload - missing required fields');
                return false;
            }

            return true;
        } catch (error) {
            console.warn('AuthManager: JWT decode failed:', error);
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
        
        // Add 30 second buffer for clock skew
        const isExpired = currentTime >= (tokenExpiration - 30);
        
        if (isExpired) {
            console.warn('AuthManager: Token expired at', new Date(tokenExpiration * 1000));
        }
        
        return isExpired;
    }

    // SECURE Login with enhanced validation and TokenManager integration
    async login(email, password, rememberMe = false) {
        try {
            // Input validation
            if (!email || !password) {
                throw new Error('Email e password sono obbligatori');
            }
            
            if (!this.validateEmail(email)) {
                throw new Error('Formato email non valido');
            }
            
            if (password.length < 6) {
                throw new Error('Password troppo corta');
            }

            // Check TokenManager availability
            if (!this.tokenManager) {
                throw new Error('Sistema di autenticazione non disponibile');
            }

            // Clear any existing authentication data
            this.logout();

            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    email: email.toLowerCase().trim(), 
                    password: password,
                    rememberMe: rememberMe
                }),
                credentials: 'include', // Include cookies for additional security
                timeout: 15000 // 15 second timeout
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Errore del server: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            if (data.success && data.data && data.data.token && data.data.user) {
                // Validate the received JWT token
                const receivedToken = data.data.token;
                const refreshToken = data.data.refreshToken;
                
                if (!this.tokenManager.validateTokenStructure(receivedToken)) {
                    throw new Error('Token ricevuto non valido');
                }
                
                // Store token using TokenManager
                if (!this.tokenManager.storeToken(receivedToken, refreshToken, rememberMe)) {
                    throw new Error('Impossibile memorizzare il token di autenticazione');
                }
                
                this.user = data.data.user;
                this.isAuthenticated = true;
                this.lastAuthCheck = Date.now();
                
                // Update UI
                this.updateUI();
                this.hideLoginModal();
                
                // Show success message
                if (typeof showNotification === 'function') {
                    const storageType = rememberMe ? 'memorizzato localmente' : 'sessione corrente';
                    showNotification(`Login effettuato con successo (${storageType})`, 'success');
                }
                
                console.info('AuthManager: Login successful for user:', this.user.email, {
                    rememberMe: rememberMe,
                    tokenInfo: this.tokenManager.getTokenInfo()
                });
                
                return true;
            } else {
                throw new Error(data.error || data.message || 'Login fallito - risposta server non valida');
            }
        } catch (error) {
            console.error('AuthManager: Login failed:', error);
            
            // Clear any partial authentication data
            this.logout();
            
            if (typeof showNotification === 'function') {
                showNotification(error.message, 'error');
            }
            return false;
        }
    }

    /**
     * Validate email format
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate received token format
     */
    validateReceivedToken(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }

        // Basic JWT format check
        const parts = token.split('.');
        if (parts.length !== 3) {
            return false;
        }

        try {
            // Try to decode header and payload
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));
            
            return header.typ === 'JWT' && payload.sub && payload.exp;
        } catch (error) {
            return false;
        }
    }

    // SECURE Logout with complete token cleanup using TokenManager
    logout() {
        console.info('AuthManager: Performing secure logout');
        
        // Clear authentication state
        this.user = null;
        this.isAuthenticated = false;
        this.lastAuthCheck = null;
        
        // Use TokenManager to clear all tokens
        if (this.tokenManager) {
            this.tokenManager.clearTokens();
        }
        
        // Clear any cached user data
        localStorage.removeItem('user_data');
        sessionStorage.removeItem('user_data');
        
        // Clear any legacy token storage
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('remember_token');
        
        // Show login modal with security message
        this.showLoginModal();
        this.updateUI();
        
        // Clear any application state
        this.clearApplicationState();
    }

    /**
     * Clear application state on logout
     */
    clearApplicationState() {
        // Clear main content
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
                    <div class="text-center">
                        <i class="bi bi-shield-lock fs-1 text-muted mb-3"></i>
                        <h5 class="text-muted">Sessione terminata</h5>
                        <p class="text-muted">Effettua il login per continuare</p>
                    </div>
                </div>
            `;
        }
        
        // Reset user display
        const currentUser = document.getElementById('currentUser');
        if (currentUser) {
            currentUser.textContent = 'Non autenticato';
        }
        
        // Hide all admin-only sections
        document.querySelectorAll('.admin-only').forEach(section => {
            section.style.display = 'none';
        });
        
        // Hide all editor-only sections
        document.querySelectorAll('.editor-only').forEach(section => {
            section.style.display = 'none';
        });
    }

    // Show login modal
    showLoginModal() {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    }

    // Hide login modal
    hideLoginModal() {
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
            loginModal.hide();
        }
    }

    // Update UI based on auth state
    updateUI() {
        if (this.isAuthenticated && this.user) {
            document.getElementById('currentUser').textContent = this.user.full_name || this.user.username;
            
            // Show/hide admin-only sections
            const adminOnlySections = document.querySelectorAll('.admin-only');
            adminOnlySections.forEach(section => {
                if (this.user.role === 'admin') {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
            
            // Show/hide editor+ sections
            const editorOnlySections = document.querySelectorAll('.editor-only');
            editorOnlySections.forEach(section => {
                if (['admin', 'editor'].includes(this.user.role)) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        }
    }

    // Get authorization headers using TokenManager
    getAuthHeaders() {
        if (this.tokenManager) {
            return this.tokenManager.getAuthHeaders();
        }
        
        // Fallback to basic headers if TokenManager not available
        return {
            'Content-Type': 'application/json'
        };
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Password cambiata con successo', 'success');
                return true;
            } else {
                throw new Error(data.error || 'Errore nel cambio password');
            }
        } catch (error) {
            console.error('Change password failed:', error);
            showNotification(error.message, 'error');
            return false;
        }
    }

    // Update profile
    async updateProfile(profileData) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (data.success) {
                this.user = { ...this.user, ...data.data.user };
                this.updateUI();
                showNotification('Profilo aggiornato con successo', 'success');
                return true;
            } else {
                throw new Error(data.error || 'Errore aggiornamento profilo');
            }
        } catch (error) {
            console.error('Update profile failed:', error);
            showNotification(error.message, 'error');
            return false;
        }
    }
}

// Global auth manager instance
const authManager = new AuthManager();

// Login form handler with Remember Me support
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : false;
            
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            
            submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Accesso...';
            submitButton.disabled = true;
            
            await authManager.login(email, password, rememberMe);
            
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        });
    }
});

// Global auth functions
function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        authManager.logout();
    }
}

function showProfile() {
    if (!authManager.user) return;
    
    const modalBody = `
        <form id="profileForm">
            <div class="mb-3">
                <label for="profileFullName" class="form-label">Nome Completo</label>
                <input type="text" class="form-control" id="profileFullName" value="${authManager.user.full_name || ''}" required>
            </div>
            <div class="mb-3">
                <label for="profileEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="profileEmail" value="${authManager.user.email}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Username</label>
                <input type="text" class="form-control" value="${authManager.user.username}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label">Ruolo</label>
                <input type="text" class="form-control" value="${CONFIG.USER_ROLES[authManager.user.role]?.name}" readonly>
            </div>
        </form>
    `;
    
    showModal('Profilo Utente', modalBody, [
        {
            text: 'Salva',
            class: 'btn-primary',
            onclick: 'saveProfile()'
        }
    ]);
}

function saveProfile() {
    const fullName = document.getElementById('profileFullName').value;
    const email = document.getElementById('profileEmail').value;
    
    authManager.updateProfile({ full_name: fullName, email }).then(success => {
        if (success) {
            hideModal();
        }
    });
}

function changePassword() {
    const modalBody = `
        <form id="changePasswordForm">
            <div class="mb-3">
                <label for="currentPassword" class="form-label">Password Attuale</label>
                <input type="password" class="form-control" id="currentPassword" required>
            </div>
            <div class="mb-3">
                <label for="newPassword" class="form-label">Nuova Password</label>
                <input type="password" class="form-control" id="newPassword" required minlength="8">
                <div class="form-text">Minimo 8 caratteri, deve contenere maiuscole, minuscole e numeri</div>
            </div>
            <div class="mb-3">
                <label for="confirmPassword" class="form-label">Conferma Nuova Password</label>
                <input type="password" class="form-control" id="confirmPassword" required>
            </div>
        </form>
    `;
    
    showModal('Cambia Password', modalBody, [
        {
            text: 'Cambia Password',
            class: 'btn-primary',
            onclick: 'savePassword()'
        }
    ]);
}

function savePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('Le password non corrispondono', 'error');
        return;
    }
    
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        showNotification('La password deve contenere almeno una maiuscola, una minuscola e un numero', 'error');
        return;
    }
    
    authManager.changePassword(currentPassword, newPassword).then(success => {
        if (success) {
            hideModal();
        }
    });
}

function viewSite() {
    window.open('/', '_blank');
}