// Authentication Management
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('blog_admin_token');
        this.user = null;
        this.isAuthenticated = false;
    }

    // Check if user is authenticated
    async checkAuth() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.data.user;
                this.isAuthenticated = true;
                this.updateUI();
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
            return false;
        }
    }

    // Login user
    async login(email, password) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.data.token;
                this.user = data.data.user;
                this.isAuthenticated = true;
                
                localStorage.setItem('blog_admin_token', this.token);
                
                this.updateUI();
                this.hideLoginModal();
                
                showNotification('Login effettuato con successo', 'success');
                return true;
            } else {
                throw new Error(data.error || 'Login fallito');
            }
        } catch (error) {
            console.error('Login failed:', error);
            showNotification(error.message, 'error');
            return false;
        }
    }

    // Logout user
    logout() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        
        localStorage.removeItem('blog_admin_token');
        
        this.showLoginModal();
        this.updateUI();
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

    // Get authorization headers
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
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

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Accesso...';
    submitButton.disabled = true;
    
    await authManager.login(email, password);
    
    submitButton.innerHTML = originalText;
    submitButton.disabled = false;
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