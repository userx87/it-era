/**
 * IT-ERA Admin Panel - Users Management
 * 
 * Complete user management system with roles, permissions,
 * user creation, editing, and access control management.
 */

class UsersManager {
    constructor() {
        this.users = [];
        this.roles = [];
        this.permissions = [];
        this.currentUser = null;
        
        // Pagination
        this.currentPage = 1;
        this.itemsPerPage = CONFIG.ITEMS_PER_PAGE || 20;
        this.totalUsers = 0;
        
        // Filters
        this.filters = {
            status: 'all', // all, active, inactive, pending
            role: 'all',
            search: '',
            dateFrom: '',
            dateTo: ''
        };
        
        // Cache
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        this.init();
    }

    /**
     * Initialize users manager
     */
    init() {
        console.info('UsersManager: Initializing user management system');
        
        this.setupEventListeners();
        this.loadInitialData();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'userForm') {
                e.preventDefault();
                this.handleUserSubmit(e.target);
            }
            if (e.target.id === 'roleForm') {
                e.preventDefault();
                this.handleRoleSubmit(e.target);
            }
        });

        // Filter changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('user-filter')) {
                this.handleFilterChange(e.target);
            }
        });

        // Search
        document.addEventListener('input', (e) => {
            if (e.target.id === 'usersSearch') {
                this.debounce(() => {
                    this.filters.search = e.target.value;
                    this.loadUsers();
                }, 500)();
            }
        });

        // Bulk actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('bulk-action-btn')) {
                this.handleBulkAction(e.target.dataset.action);
            }
        });

        // Password generation
        document.addEventListener('click', (e) => {
            if (e.target.id === 'generatePassword') {
                this.generatePassword();
            }
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            this.showLoading('usersContent', true);
            
            await Promise.all([
                this.loadUsers(),
                this.loadRoles(),
                this.loadPermissions()
            ]);
            
            this.renderUsersInterface();
            
        } catch (error) {
            console.error('UsersManager: Failed to load initial data:', error);
            this.showError('Errore durante il caricamento dei dati utenti');
        } finally {
            this.showLoading('usersContent', false);
        }
    }

    /**
     * Load users with filters and pagination
     */
    async loadUsers() {
        try {
            const cacheKey = `users_${JSON.stringify(this.filters)}_${this.currentPage}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    this.users = cached.data.users;
                    this.totalUsers = cached.data.total;
                    return;
                }
            }

            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.filters
            });

            const response = await securityGuard.makeSecureRequest(`/users?${params}`);
            
            if (response.success) {
                this.users = response.data.users || [];
                this.totalUsers = response.data.total || 0;
                
                // Cache the results
                this.cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });
                
                console.info(`UsersManager: Loaded ${this.users.length} users`);
            } else {
                throw new Error(response.error || 'Errore durante il caricamento degli utenti');
            }
        } catch (error) {
            console.error('UsersManager: Failed to load users:', error);
            this.users = [];
            this.totalUsers = 0;
            throw error;
        }
    }

    /**
     * Load roles
     */
    async loadRoles() {
        try {
            const response = await securityGuard.makeSecureRequest('/users/roles');
            
            if (response.success) {
                this.roles = response.data || [];
            }
        } catch (error) {
            console.error('UsersManager: Failed to load roles:', error);
            this.roles = [];
        }
    }

    /**
     * Load permissions
     */
    async loadPermissions() {
        try {
            const response = await securityGuard.makeSecureRequest('/users/permissions');
            
            if (response.success) {
                this.permissions = response.data || [];
            }
        } catch (error) {
            console.error('UsersManager: Failed to load permissions:', error);
            this.permissions = [];
        }
    }

    /**
     * Render users interface
     */
    renderUsersInterface() {
        const container = document.getElementById('usersContent');
        
        container.innerHTML = `
            <!-- Tabs -->
            <ul class="nav nav-tabs mb-4">
                <li class="nav-item">
                    <a class="nav-link active" id="users-tab" data-bs-toggle="tab" href="#usersPanel">
                        <i class="fas fa-users me-1"></i>Utenti
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="roles-tab" data-bs-toggle="tab" href="#rolesPanel">
                        <i class="fas fa-user-tag me-1"></i>Ruoli e Permessi
                    </a>
                </li>
            </ul>

            <div class="tab-content">
                <!-- Users Panel -->
                <div class="tab-pane fade show active" id="usersPanel">
                    <!-- Filters and Search -->
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="input-group">
                                <input type="text" class="form-control" id="usersSearch" 
                                       placeholder="Cerca utenti..." value="${this.filters.search}">
                                <button class="btn btn-outline-secondary" type="button">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select user-filter" data-filter="status">
                                <option value="all">Tutti gli stati</option>
                                <option value="active" ${this.filters.status === 'active' ? 'selected' : ''}>Attivi</option>
                                <option value="inactive" ${this.filters.status === 'inactive' ? 'selected' : ''}>Inattivi</option>
                                <option value="pending" ${this.filters.status === 'pending' ? 'selected' : ''}>In attesa</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select user-filter" data-filter="role">
                                <option value="all">Tutti i ruoli</option>
                                ${this.roles.map(role => 
                                    `<option value="${role.id}" ${this.filters.role === role.id ? 'selected' : ''}>${role.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control user-filter" data-filter="dateFrom" 
                                   value="${this.filters.dateFrom}" placeholder="Data da">
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control user-filter" data-filter="dateTo" 
                                   value="${this.filters.dateTo}" placeholder="Data a">
                        </div>
                    </div>

                    <!-- Bulk Actions -->
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="d-flex align-items-center">
                                <input type="checkbox" class="form-check-input me-2" id="selectAllUsers" 
                                       onchange="usersManager.toggleSelectAll(this.checked)">
                                <label for="selectAllUsers" class="form-check-label me-3">Seleziona tutto</label>
                                <button class="btn btn-sm btn-outline-success bulk-action-btn me-2" 
                                        data-action="activate" disabled>
                                    <i class="fas fa-check me-1"></i>Attiva
                                </button>
                                <button class="btn btn-sm btn-outline-warning bulk-action-btn me-2" 
                                        data-action="deactivate" disabled>
                                    <i class="fas fa-pause me-1"></i>Disattiva
                                </button>
                                <button class="btn btn-sm btn-outline-danger bulk-action-btn" 
                                        data-action="delete" disabled>
                                    <i class="fas fa-trash me-1"></i>Elimina
                                </button>
                            </div>
                        </div>
                        <div class="col-md-6 text-end">
                            <span class="text-muted">Totale: ${this.totalUsers} utenti</span>
                        </div>
                    </div>

                    <!-- Users Table -->
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th width="50">
                                        <input type="checkbox" class="form-check-input" id="selectAllHeader">
                                    </th>
                                    <th>Utente</th>
                                    <th>Ruolo</th>
                                    <th>Stato</th>
                                    <th>Ultimo Accesso</th>
                                    <th>Data Registrazione</th>
                                    <th width="150">Azioni</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                                ${this.renderUsersTable()}
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    ${this.renderPagination()}
                </div>

                <!-- Roles Panel -->
                <div class="tab-pane fade" id="rolesPanel">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="card">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">Ruoli</h5>
                                    <button class="btn btn-primary btn-sm" onclick="usersManager.showCreateRoleModal()">
                                        <i class="fas fa-plus me-1"></i>Nuovo Ruolo
                                    </button>
                                </div>
                                <div class="card-body">
                                    <div id="rolesContainer">
                                        ${this.renderRolesList()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Permessi Disponibili</h5>
                                </div>
                                <div class="card-body">
                                    <div id="permissionsContainer">
                                        ${this.renderPermissionsList()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Form Modal -->
            ${this.renderUserModal()}
            
            <!-- Role Form Modal -->
            ${this.renderRoleModal()}
        `;

        this.setupTableEventListeners();
    }

    /**
     * Render users table
     */
    renderUsersTable() {
        if (this.users.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-user-slash fa-2x mb-2"></i>
                            <p>Nessun utente trovato</p>
                            <button class="btn btn-primary" onclick="usersManager.showCreateModal()">
                                Crea il primo utente
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        return this.users.map(user => {
            const statusClass = {
                'active': 'success',
                'inactive': 'secondary',
                'pending': 'warning',
                'blocked': 'danger'
            }[user.status] || 'secondary';

            const statusText = {
                'active': 'Attivo',
                'inactive': 'Inattivo',
                'pending': 'In attesa',
                'blocked': 'Bloccato'
            }[user.status] || user.status;

            return `
                <tr>
                    <td>
                        <input type="checkbox" class="form-check-input user-select" 
                               value="${user.id}" onchange="usersManager.updateBulkActions()">
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="user-avatar me-3">
                                ${(user.name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                                <div><strong>${this.escapeHtml(user.name || 'N/A')}</strong></div>
                                <div class="text-muted">${this.escapeHtml(user.email)}</div>
                                ${user.phone ? `<small class="text-muted">${this.escapeHtml(user.phone)}</small>` : ''}
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-info">${this.escapeHtml(user.role?.name || 'Nessuno')}</span>
                        ${user.permissions?.length ? `
                            <br><small class="text-muted">${user.permissions.length} permessi</small>
                        ` : ''}
                    </td>
                    <td>
                        <span class="status-badge status-${user.status}">${statusText}</span>
                        ${user.email_verified_at ? '' : '<br><small class="text-warning">Email non verificata</small>'}
                    </td>
                    <td>
                        ${user.last_login_at ? this.formatDate(user.last_login_at) : 
                          '<span class="text-muted">Mai</span>'}
                        ${user.last_login_ip ? `<br><small class="text-muted">${user.last_login_ip}</small>` : ''}
                    </td>
                    <td>
                        ${this.formatDate(user.created_at)}
                        <br>
                        <small class="text-muted">da ${this.escapeHtml(user.created_by?.name || 'Sistema')}</small>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="usersManager.editUser('${user.id}')"
                                    title="Modifica">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-info" onclick="usersManager.viewUserDetails('${user.id}')"
                                    title="Dettagli">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${user.status === 'active' ? 
                                `<button class="btn btn-outline-warning" onclick="usersManager.toggleUserStatus('${user.id}', 'inactive')"
                                         title="Disattiva">
                                    <i class="fas fa-pause"></i>
                                </button>` :
                                `<button class="btn btn-outline-success" onclick="usersManager.toggleUserStatus('${user.id}', 'active')"
                                         title="Attiva">
                                    <i class="fas fa-play"></i>
                                </button>`
                            }
                            <button class="btn btn-outline-danger" onclick="usersManager.deleteUser('${user.id}')"
                                    title="Elimina">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render roles list
     */
    renderRolesList() {
        if (this.roles.length === 0) {
            return '<p class="text-muted">Nessun ruolo configurato</p>';
        }

        return this.roles.map(role => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title">${this.escapeHtml(role.name)}</h6>
                            <p class="card-text text-muted">${this.escapeHtml(role.description || '')}</p>
                            <div class="d-flex flex-wrap">
                                ${(role.permissions || []).map(perm => 
                                    `<span class="badge bg-light text-dark me-1 mb-1">${perm.name}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="usersManager.editRole('${role.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="usersManager.deleteRole('${role.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">
                            ${role.users_count || 0} utenti • 
                            Creato: ${this.formatDate(role.created_at)}
                        </small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render permissions list
     */
    renderPermissionsList() {
        if (this.permissions.length === 0) {
            return '<p class="text-muted">Nessun permesso disponibile</p>';
        }

        // Group permissions by category
        const groupedPermissions = this.permissions.reduce((groups, permission) => {
            const category = permission.category || 'General';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(permission);
            return groups;
        }, {});

        return Object.entries(groupedPermissions).map(([category, perms]) => `
            <div class="mb-3">
                <h6 class="text-primary">${category}</h6>
                <div class="ps-3">
                    ${perms.map(perm => `
                        <div class="d-flex justify-content-between align-items-center py-1">
                            <div>
                                <strong>${perm.name}</strong>
                                ${perm.description ? `<br><small class="text-muted">${perm.description}</small>` : ''}
                            </div>
                            <code class="text-muted">${perm.slug}</code>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
        
        if (totalPages <= 1) return '';

        let paginationHTML = '<nav aria-label="Users pagination"><ul class="pagination justify-content-center mt-4">';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="usersManager.changePage(${this.currentPage - 1})">
                    Precedente
                </button>
            </li>
        `;
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="usersManager.changePage(1)">1</button>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <button class="page-link" onclick="usersManager.changePage(${i})">${i}</button>
                </li>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="usersManager.changePage(${totalPages})">${totalPages}</button>
                </li>
            `;
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="usersManager.changePage(${this.currentPage + 1})">
                    Successivo
                </button>
            </li>
        `;
        
        paginationHTML += '</ul></nav>';
        
        return paginationHTML;
    }

    /**
     * Render user modal
     */
    renderUserModal() {
        return `
            <div class="modal fade" id="userModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="userModalTitle">Nuovo Utente</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="userForm">
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Nome *</label>
                                            <input type="text" class="form-control" id="userName" required
                                                   placeholder="Nome completo">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Email *</label>
                                            <input type="email" class="form-control" id="userEmail" required
                                                   placeholder="indirizzo@email.com">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Password *</label>
                                            <div class="input-group">
                                                <input type="password" class="form-control" id="userPassword"
                                                       placeholder="Password sicura">
                                                <button class="btn btn-outline-secondary" type="button" 
                                                        id="generatePassword">
                                                    <i class="fas fa-random"></i>
                                                </button>
                                                <button class="btn btn-outline-secondary" type="button" 
                                                        onclick="usersManager.togglePasswordVisibility('userPassword')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </div>
                                            <small class="form-text text-muted">
                                                Almeno 8 caratteri con maiuscole, minuscole, numeri e simboli
                                            </small>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Telefono</label>
                                            <input type="tel" class="form-control" id="userPhone"
                                                   placeholder="+39 123 456 7890">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Ruolo</label>
                                            <select class="form-select" id="userRole">
                                                <option value="">Nessun ruolo</option>
                                                ${this.roles.map(role => 
                                                    `<option value="${role.id}">${role.name}</option>`
                                                ).join('')}
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Stato</label>
                                            <select class="form-select" id="userStatus">
                                                <option value="active">Attivo</option>
                                                <option value="inactive">Inattivo</option>
                                                <option value="pending">In attesa</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Permessi Aggiuntivi</label>
                                    <div class="border rounded p-3" style="max-height: 200px; overflow-y: auto;">
                                        ${this.renderPermissionsCheckboxes()}
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="form-check mb-3">
                                            <input type="checkbox" class="form-check-input" id="userEmailVerified">
                                            <label class="form-check-label" for="userEmailVerified">
                                                Email verificata
                                            </label>
                                        </div>
                                        
                                        <div class="form-check mb-3">
                                            <input type="checkbox" class="form-check-input" id="userSendWelcome" checked>
                                            <label class="form-check-label" for="userSendWelcome">
                                                Invia email di benvenuto
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                                <button type="submit" class="btn btn-primary">
                                    <span id="userSubmitText">Crea Utente</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render role modal
     */
    renderRoleModal() {
        return `
            <div class="modal fade" id="roleModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="roleModalTitle">Nuovo Ruolo</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="roleForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">Nome Ruolo *</label>
                                    <input type="text" class="form-control" id="roleName" required
                                           placeholder="Es: Administrator, Editor, Viewer">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Descrizione</label>
                                    <textarea class="form-control" id="roleDescription" rows="3"
                                              placeholder="Breve descrizione del ruolo"></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Permessi</label>
                                    <div class="border rounded p-3" style="max-height: 300px; overflow-y: auto;">
                                        ${this.renderPermissionsCheckboxes('role')}
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                                <button type="submit" class="btn btn-primary">
                                    <span id="roleSubmitText">Crea Ruolo</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render permissions checkboxes
     */
    renderPermissionsCheckboxes(prefix = 'user') {
        if (this.permissions.length === 0) {
            return '<p class="text-muted">Nessun permesso disponibile</p>';
        }

        // Group permissions by category
        const groupedPermissions = this.permissions.reduce((groups, permission) => {
            const category = permission.category || 'General';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(permission);
            return groups;
        }, {});

        return Object.entries(groupedPermissions).map(([category, perms]) => `
            <div class="mb-3">
                <h6 class="text-primary mb-2">${category}</h6>
                <div class="ps-3">
                    ${perms.map(perm => `
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input ${prefix}-permission" 
                                   value="${perm.id}" id="${prefix}Perm${perm.id}">
                            <label class="form-check-label" for="${prefix}Perm${perm.id}">
                                ${perm.name}
                                ${perm.description ? `<br><small class="text-muted">${perm.description}</small>` : ''}
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Setup table event listeners
     */
    setupTableEventListeners() {
        // Form validation
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('input', this.validateUserForm.bind(this));
        }
    }

    /**
     * Show create user modal
     */
    showCreateModal() {
        this.currentUser = null;
        
        // Reset form
        document.getElementById('userForm').reset();
        document.getElementById('userModalTitle').textContent = 'Nuovo Utente';
        document.getElementById('userSubmitText').textContent = 'Crea Utente';
        
        // Clear permission checkboxes
        document.querySelectorAll('.user-permission').forEach(cb => {
            cb.checked = false;
        });
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        modal.show();
    }

    /**
     * Edit existing user
     */
    async editUser(userId) {
        try {
            this.showLoading('userModal', true);
            
            const response = await securityGuard.makeSecureRequest(`/users/${userId}`);
            
            if (response.success) {
                this.currentUser = response.data;
                this.populateUserForm(this.currentUser);
                
                const modal = new bootstrap.Modal(document.getElementById('userModal'));
                modal.show();
            } else {
                throw new Error(response.error || 'Errore durante il caricamento dell\'utente');
            }
        } catch (error) {
            console.error('UsersManager: Failed to edit user:', error);
            this.showError('Errore durante il caricamento dell\'utente');
        } finally {
            this.showLoading('userModal', false);
        }
    }

    /**
     * Populate user form with existing data
     */
    populateUserForm(user) {
        document.getElementById('userModalTitle').textContent = 'Modifica Utente';
        document.getElementById('userSubmitText').textContent = 'Aggiorna Utente';
        
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userRole').value = user.role_id || '';
        document.getElementById('userStatus').value = user.status || 'active';
        document.getElementById('userEmailVerified').checked = !!user.email_verified_at;
        
        // Don't populate password for existing users
        document.getElementById('userPassword').removeAttribute('required');
        document.getElementById('userPassword').placeholder = 'Lascia vuoto per non modificare';
        
        // Set permissions
        document.querySelectorAll('.user-permission').forEach(cb => {
            cb.checked = false;
        });
        
        if (user.permissions) {
            user.permissions.forEach(perm => {
                const checkbox = document.getElementById(`userPerm${perm.id}`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    }

    /**
     * Handle user form submission
     */
    async handleUserSubmit(form) {
        try {
            await this.submitUser();
        } catch (error) {
            console.error('UsersManager: User submission failed:', error);
        }
    }

    /**
     * Submit user data
     */
    async submitUser() {
        try {
            const formData = this.collectUserData();
            
            // Validate required fields
            if (!formData.name.trim()) {
                throw new Error('Il nome è obbligatorio');
            }
            
            if (!formData.email.trim()) {
                throw new Error('L\'email è obbligatoria');
            }
            
            if (!this.isValidEmail(formData.email)) {
                throw new Error('Formato email non valido');
            }
            
            if (!this.currentUser && !formData.password) {
                throw new Error('La password è obbligatoria per nuovi utenti');
            }

            const url = this.currentUser ? `/users/${this.currentUser.id}` : '/users';
            const method = this.currentUser ? 'PUT' : 'POST';

            const response = await securityGuard.makeSecureRequest(url, {
                method,
                body: JSON.stringify(formData)
            });

            if (response.success) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
                modal.hide();
                
                // Clear cache
                this.cache.clear();
                
                // Reload users
                await this.loadUsers();
                this.renderUsersInterface();
                
                const action = this.currentUser ? 'aggiornato' : 'creato';
                this.showSuccess(`Utente ${action} con successo`);
                
            } else {
                throw new Error(response.error || 'Errore durante il salvataggio');
            }
        } catch (error) {
            console.error('UsersManager: Submit failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Collect user data from form
     */
    collectUserData() {
        const selectedPermissions = Array.from(document.querySelectorAll('.user-permission:checked'))
            .map(cb => cb.value);
        
        const data = {
            name: document.getElementById('userName').value.trim(),
            email: document.getElementById('userEmail').value.trim(),
            phone: document.getElementById('userPhone').value.trim(),
            role_id: document.getElementById('userRole').value || null,
            status: document.getElementById('userStatus').value,
            email_verified_at: document.getElementById('userEmailVerified').checked ? new Date().toISOString() : null,
            permissions: selectedPermissions,
            send_welcome: document.getElementById('userSendWelcome').checked
        };
        
        // Only include password if provided
        const password = document.getElementById('userPassword').value.trim();
        if (password) {
            data.password = password;
        }
        
        return data;
    }

    /**
     * Validate user form
     */
    validateUserForm() {
        const form = document.getElementById('userForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value.trim();
        
        let isValid = true;
        
        if (!name) {
            isValid = false;
        }
        
        if (!email || !this.isValidEmail(email)) {
            isValid = false;
        }
        
        if (!this.currentUser && !password) {
            isValid = false;
        }
        
        if (password && password.length < 8) {
            isValid = false;
        }
        
        submitBtn.disabled = !isValid;
    }

    /**
     * Generate random password
     */
    generatePassword() {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        document.getElementById('userPassword').value = password;
        this.showSuccess('Password generata automaticamente');
    }

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const button = input.nextElementSibling.nextElementSibling;
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    /**
     * View user details
     */
    async viewUserDetails(userId) {
        // Implementation for viewing user details in a modal or separate page
        try {
            const user = this.users.find(u => u.id === userId);
            if (user) {
                alert(`Dettagli utente:\n\nNome: ${user.name}\nEmail: ${user.email}\nRuolo: ${user.role?.name || 'Nessuno'}\nStato: ${user.status}`);
            }
        } catch (error) {
            console.error('UsersManager: Failed to view user details:', error);
            this.showError('Errore durante il caricamento dei dettagli');
        }
    }

    /**
     * Toggle user status
     */
    async toggleUserStatus(userId, newStatus) {
        try {
            const response = await securityGuard.makeSecureRequest(`/users/${userId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            if (response.success) {
                this.cache.clear();
                await this.loadUsers();
                this.renderUsersInterface();
                
                const statusText = newStatus === 'active' ? 'attivato' : 'disattivato';
                this.showSuccess(`Utente ${statusText} con successo`);
            } else {
                throw new Error(response.error || 'Errore durante il cambio stato');
            }
        } catch (error) {
            console.error('UsersManager: Failed to toggle user status:', error);
            this.showError(error.message);
        }
    }

    /**
     * Delete user
     */
    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        if (!confirm(`Sei sicuro di voler eliminare l'utente "${user.name}"? Questa azione non può essere annullata.`)) {
            return;
        }

        try {
            const response = await securityGuard.makeSecureRequest(`/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.cache.clear();
                await this.loadUsers();
                this.renderUsersInterface();
                this.showSuccess('Utente eliminato con successo');
            } else {
                throw new Error(response.error || 'Errore durante l\'eliminazione');
            }
        } catch (error) {
            console.error('UsersManager: Delete failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Handle filter changes
     */
    handleFilterChange(element) {
        const filterName = element.dataset.filter;
        this.filters[filterName] = element.value;
        this.currentPage = 1;
        this.cache.clear();
        this.loadUsers().then(() => this.renderUsersInterface());
    }

    /**
     * Change page
     */
    async changePage(page) {
        if (page < 1) return;
        
        this.currentPage = page;
        
        try {
            await this.loadUsers();
            this.renderUsersInterface();
            
            // Scroll to top of table
            document.querySelector('.table-responsive').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        } catch (error) {
            console.error('UsersManager: Page change failed:', error);
            this.showError('Errore durante il caricamento della pagina');
        }
    }

    /**
     * Toggle select all users
     */
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.user-select');
        checkboxes.forEach(cb => {
            cb.checked = checked;
        });
        this.updateBulkActions();
    }

    /**
     * Update bulk actions availability
     */
    updateBulkActions() {
        const selected = document.querySelectorAll('.user-select:checked').length;
        const bulkButtons = document.querySelectorAll('.bulk-action-btn');
        
        bulkButtons.forEach(btn => {
            btn.disabled = selected === 0;
        });
    }

    /**
     * Handle bulk actions
     */
    async handleBulkAction(action) {
        const selectedIds = Array.from(document.querySelectorAll('.user-select:checked'))
            .map(cb => cb.value);
        
        if (selectedIds.length === 0) return;

        const confirmMessages = {
            activate: 'Sei sicuro di voler attivare gli utenti selezionati?',
            deactivate: 'Sei sicuro di voler disattivare gli utenti selezionati?',
            delete: 'Sei sicuro di voler eliminare gli utenti selezionati? Questa azione non può essere annullata.'
        };

        if (!confirm(confirmMessages[action])) return;

        try {
            const response = await securityGuard.makeSecureRequest('/users/bulk', {
                method: 'POST',
                body: JSON.stringify({
                    action,
                    user_ids: selectedIds
                })
            });

            if (response.success) {
                this.cache.clear();
                await this.loadUsers();
                this.renderUsersInterface();
                
                const actionMessages = {
                    activate: 'attivati',
                    deactivate: 'disattivati',
                    delete: 'eliminati'
                };
                
                this.showSuccess(`${selectedIds.length} utenti ${actionMessages[action]} con successo`);
            } else {
                throw new Error(response.error || 'Errore durante l\'operazione');
            }
        } catch (error) {
            console.error('UsersManager: Bulk action failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Show create role modal
     */
    showCreateRoleModal() {
        this.currentRole = null;
        
        // Reset form
        document.getElementById('roleForm').reset();
        document.getElementById('roleModalTitle').textContent = 'Nuovo Ruolo';
        document.getElementById('roleSubmitText').textContent = 'Crea Ruolo';
        
        // Clear permission checkboxes
        document.querySelectorAll('.role-permission').forEach(cb => {
            cb.checked = false;
        });
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('roleModal'));
        modal.show();
    }

    /**
     * Edit role
     */
    async editRole(roleId) {
        try {
            const role = this.roles.find(r => r.id === roleId);
            if (!role) throw new Error('Ruolo non trovato');
            
            this.currentRole = role;
            this.populateRoleForm(role);
            
            const modal = new bootstrap.Modal(document.getElementById('roleModal'));
            modal.show();
        } catch (error) {
            console.error('UsersManager: Failed to edit role:', error);
            this.showError('Errore durante il caricamento del ruolo');
        }
    }

    /**
     * Populate role form
     */
    populateRoleForm(role) {
        document.getElementById('roleModalTitle').textContent = 'Modifica Ruolo';
        document.getElementById('roleSubmitText').textContent = 'Aggiorna Ruolo';
        
        document.getElementById('roleName').value = role.name || '';
        document.getElementById('roleDescription').value = role.description || '';
        
        // Set permissions
        document.querySelectorAll('.role-permission').forEach(cb => {
            cb.checked = false;
        });
        
        if (role.permissions) {
            role.permissions.forEach(perm => {
                const checkbox = document.getElementById(`rolePerm${perm.id}`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    }

    /**
     * Handle role form submission
     */
    async handleRoleSubmit(form) {
        try {
            await this.submitRole();
        } catch (error) {
            console.error('UsersManager: Role submission failed:', error);
        }
    }

    /**
     * Submit role data
     */
    async submitRole() {
        try {
            const formData = this.collectRoleData();
            
            // Validate required fields
            if (!formData.name.trim()) {
                throw new Error('Il nome del ruolo è obbligatorio');
            }

            const url = this.currentRole ? `/users/roles/${this.currentRole.id}` : '/users/roles';
            const method = this.currentRole ? 'PUT' : 'POST';

            const response = await securityGuard.makeSecureRequest(url, {
                method,
                body: JSON.stringify(formData)
            });

            if (response.success) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('roleModal'));
                modal.hide();
                
                // Reload roles
                await this.loadRoles();
                this.renderUsersInterface();
                
                const action = this.currentRole ? 'aggiornato' : 'creato';
                this.showSuccess(`Ruolo ${action} con successo`);
                
            } else {
                throw new Error(response.error || 'Errore durante il salvataggio');
            }
        } catch (error) {
            console.error('UsersManager: Role submit failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Collect role data from form
     */
    collectRoleData() {
        const selectedPermissions = Array.from(document.querySelectorAll('.role-permission:checked'))
            .map(cb => cb.value);
        
        return {
            name: document.getElementById('roleName').value.trim(),
            description: document.getElementById('roleDescription').value.trim(),
            permissions: selectedPermissions
        };
    }

    /**
     * Delete role
     */
    async deleteRole(roleId) {
        const role = this.roles.find(r => r.id === roleId);
        if (!role) return;
        
        if (role.users_count > 0) {
            this.showError('Impossibile eliminare un ruolo assegnato a degli utenti');
            return;
        }
        
        if (!confirm(`Sei sicuro di voler eliminare il ruolo "${role.name}"?`)) {
            return;
        }

        try {
            const response = await securityGuard.makeSecureRequest(`/users/roles/${roleId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                await this.loadRoles();
                this.renderUsersInterface();
                this.showSuccess('Ruolo eliminato con successo');
            } else {
                throw new Error(response.error || 'Errore durante l\'eliminazione');
            }
        } catch (error) {
            console.error('UsersManager: Role delete failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Utility functions
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
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
                    <div>Caricamento...</div>
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
}

// Global users manager instance
const usersManager = new UsersManager();

// Export for use in other modules
window.usersManager = usersManager;

console.info('UsersManager: User management system initialized successfully');