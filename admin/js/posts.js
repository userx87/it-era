/**
 * IT-ERA Admin Panel - Posts Management
 * 
 * Complete CRUD operations for blog posts with rich text editor,
 * categories, tags, SEO optimization, and content management.
 */

class PostsManager {
    constructor() {
        this.posts = [];
        this.categories = [];
        this.tags = [];
        this.currentPost = null;
        this.editor = null;
        
        // Pagination
        this.currentPage = 1;
        this.itemsPerPage = CONFIG.ITEMS_PER_PAGE || 20;
        this.totalPosts = 0;
        
        // Filters
        this.filters = {
            status: 'all',
            category: 'all',
            search: '',
            dateFrom: '',
            dateTo: '',
            author: 'all'
        };
        
        // Cache
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        this.init();
    }

    /**
     * Initialize posts manager
     */
    init() {
        console.info('PostsManager: Initializing posts management system');
        
        this.setupEventListeners();
        this.initializeRichEditor();
        this.loadCategories();
        this.loadInitialData();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'postForm') {
                e.preventDefault();
                this.handlePostSubmit(e.target);
            }
        });

        // Filter changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('post-filter')) {
                this.handleFilterChange(e.target);
            }
        });

        // Search
        document.addEventListener('input', (e) => {
            if (e.target.id === 'postsSearch') {
                this.debounce(() => {
                    this.filters.search = e.target.value;
                    this.loadPosts();
                }, 500)();
            }
        });

        // Bulk actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('bulk-action-btn')) {
                this.handleBulkAction(e.target.dataset.action);
            }
        });
    }

    /**
     * Initialize rich text editor
     */
    initializeRichEditor() {
        // Simple rich text editor implementation
        this.editor = {
            content: '',
            
            init: (element) => {
                if (!element) return;
                
                element.contentEditable = true;
                element.className += ' editor-content';
                
                // Add toolbar
                const toolbar = this.createEditorToolbar();
                element.parentNode.insertBefore(toolbar, element);
                
                // Handle content changes
                element.addEventListener('input', () => {
                    this.editor.content = element.innerHTML;
                });
                
                // Handle paste (clean up HTML)
                element.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text/plain');
                    document.execCommand('insertText', false, text);
                });
            },
            
            getContent: () => this.editor.content,
            setContent: (content) => {
                this.editor.content = content;
                const editorElement = document.querySelector('.editor-content');
                if (editorElement) {
                    editorElement.innerHTML = content;
                }
            }
        };
    }

    /**
     * Create editor toolbar
     */
    createEditorToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';
        
        const tools = [
            { command: 'bold', icon: 'fas fa-bold', title: 'Grassetto' },
            { command: 'italic', icon: 'fas fa-italic', title: 'Corsivo' },
            { command: 'underline', icon: 'fas fa-underline', title: 'Sottolineato' },
            { separator: true },
            { command: 'justifyLeft', icon: 'fas fa-align-left', title: 'Allinea a sinistra' },
            { command: 'justifyCenter', icon: 'fas fa-align-center', title: 'Centra' },
            { command: 'justifyRight', icon: 'fas fa-align-right', title: 'Allinea a destra' },
            { separator: true },
            { command: 'insertOrderedList', icon: 'fas fa-list-ol', title: 'Lista numerata' },
            { command: 'insertUnorderedList', icon: 'fas fa-list-ul', title: 'Lista puntata' },
            { separator: true },
            { command: 'createLink', icon: 'fas fa-link', title: 'Inserisci link' },
            { command: 'unlink', icon: 'fas fa-unlink', title: 'Rimuovi link' }
        ];
        
        tools.forEach(tool => {
            if (tool.separator) {
                const separator = document.createElement('span');
                separator.className = 'toolbar-separator mx-2';
                separator.innerHTML = '|';
                toolbar.appendChild(separator);
            } else {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-sm btn-outline-secondary me-1';
                button.innerHTML = `<i class="${tool.icon}"></i>`;
                button.title = tool.title;
                button.onclick = () => this.executeEditorCommand(tool.command);
                toolbar.appendChild(button);
            }
        });
        
        return toolbar;
    }

    /**
     * Execute editor command
     */
    executeEditorCommand(command) {
        if (command === 'createLink') {
            const url = prompt('Inserisci URL:');
            if (url) {
                document.execCommand('createLink', false, url);
            }
        } else {
            document.execCommand(command, false, null);
        }
        
        // Update content
        const editorElement = document.querySelector('.editor-content');
        if (editorElement) {
            this.editor.content = editorElement.innerHTML;
        }
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            this.showLoading('postsContent', true);
            
            await Promise.all([
                this.loadPosts(),
                this.loadCategories(),
                this.loadTags()
            ]);
            
            this.renderPostsInterface();
            
        } catch (error) {
            console.error('PostsManager: Failed to load initial data:', error);
            this.showError('Errore durante il caricamento dei dati');
        } finally {
            this.showLoading('postsContent', false);
        }
    }

    /**
     * Load posts with filters and pagination
     */
    async loadPosts() {
        try {
            const cacheKey = `posts_${JSON.stringify(this.filters)}_${this.currentPage}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    this.posts = cached.data.posts;
                    this.totalPosts = cached.data.total;
                    return;
                }
            }

            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.filters
            });

            const response = await securityGuard.makeSecureRequest(`/posts?${params}`);
            
            if (response.success) {
                this.posts = response.data.posts || [];
                this.totalPosts = response.data.total || 0;
                
                // Cache the results
                this.cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });
                
                console.info(`PostsManager: Loaded ${this.posts.length} posts`);
            } else {
                throw new Error(response.error || 'Errore durante il caricamento dei posts');
            }
        } catch (error) {
            console.error('PostsManager: Failed to load posts:', error);
            this.posts = [];
            this.totalPosts = 0;
            throw error;
        }
    }

    /**
     * Load categories
     */
    async loadCategories() {
        try {
            const response = await securityGuard.makeSecureRequest('/posts/categories');
            
            if (response.success) {
                this.categories = response.data || [];
            }
        } catch (error) {
            console.error('PostsManager: Failed to load categories:', error);
            this.categories = [];
        }
    }

    /**
     * Load tags
     */
    async loadTags() {
        try {
            const response = await securityGuard.makeSecureRequest('/posts/tags');
            
            if (response.success) {
                this.tags = response.data || [];
            }
        } catch (error) {
            console.error('PostsManager: Failed to load tags:', error);
            this.tags = [];
        }
    }

    /**
     * Render posts interface
     */
    renderPostsInterface() {
        const container = document.getElementById('postsContent');
        
        container.innerHTML = `
            <!-- Filters and Search -->
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="input-group">
                        <input type="text" class="form-control" id="postsSearch" 
                               placeholder="Cerca posts..." value="${this.filters.search}">
                        <button class="btn btn-outline-secondary" type="button">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-2">
                    <select class="form-select post-filter" data-filter="status">
                        <option value="all">Tutti gli stati</option>
                        <option value="published" ${this.filters.status === 'published' ? 'selected' : ''}>Pubblicati</option>
                        <option value="draft" ${this.filters.status === 'draft' ? 'selected' : ''}>Bozze</option>
                        <option value="archived" ${this.filters.status === 'archived' ? 'selected' : ''}>Archiviati</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <select class="form-select post-filter" data-filter="category">
                        <option value="all">Tutte le categorie</option>
                        ${this.categories.map(cat => 
                            `<option value="${cat.id}" ${this.filters.category === cat.id ? 'selected' : ''}>${cat.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="col-md-2">
                    <input type="date" class="form-control post-filter" data-filter="dateFrom" 
                           value="${this.filters.dateFrom}" placeholder="Data da">
                </div>
                <div class="col-md-2">
                    <input type="date" class="form-control post-filter" data-filter="dateTo" 
                           value="${this.filters.dateTo}" placeholder="Data a">
                </div>
            </div>

            <!-- Bulk Actions -->
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="d-flex align-items-center">
                        <input type="checkbox" class="form-check-input me-2" id="selectAllPosts" 
                               onchange="postsManager.toggleSelectAll(this.checked)">
                        <label for="selectAllPosts" class="form-check-label me-3">Seleziona tutto</label>
                        <button class="btn btn-sm btn-outline-danger bulk-action-btn me-2" 
                                data-action="delete" disabled>
                            <i class="fas fa-trash me-1"></i>Elimina
                        </button>
                        <button class="btn btn-sm btn-outline-warning bulk-action-btn me-2" 
                                data-action="archive" disabled>
                            <i class="fas fa-archive me-1"></i>Archivia
                        </button>
                        <button class="btn btn-sm btn-outline-success bulk-action-btn" 
                                data-action="publish" disabled>
                            <i class="fas fa-eye me-1"></i>Pubblica
                        </button>
                    </div>
                </div>
                <div class="col-md-6 text-end">
                    <span class="text-muted">Totale: ${this.totalPosts} posts</span>
                </div>
            </div>

            <!-- Posts Table -->
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th width="50">
                                <input type="checkbox" class="form-check-input" id="selectAllHeader">
                            </th>
                            <th>Titolo</th>
                            <th>Autore</th>
                            <th>Categoria</th>
                            <th>Stato</th>
                            <th>Data</th>
                            <th width="150">Azioni</th>
                        </tr>
                    </thead>
                    <tbody id="postsTableBody">
                        ${this.renderPostsTable()}
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            ${this.renderPagination()}

            <!-- Post Form Modal -->
            ${this.renderPostModal()}
        `;

        this.setupTableEventListeners();
    }

    /**
     * Render posts table
     */
    renderPostsTable() {
        if (this.posts.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-inbox fa-2x mb-2"></i>
                            <p>Nessun post trovato</p>
                            <button class="btn btn-primary" onclick="postsManager.showCreateModal()">
                                Crea il primo post
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        return this.posts.map(post => {
            const statusClass = {
                'published': 'success',
                'draft': 'warning',
                'archived': 'danger'
            }[post.status] || 'secondary';

            const statusText = {
                'published': 'Pubblicato',
                'draft': 'Bozza',
                'archived': 'Archiviato'
            }[post.status] || post.status;

            return `
                <tr>
                    <td>
                        <input type="checkbox" class="form-check-input post-select" 
                               value="${post.id}" onchange="postsManager.updateBulkActions()">
                    </td>
                    <td>
                        <div>
                            <strong>${this.escapeHtml(post.title)}</strong>
                            <br>
                            <small class="text-muted">${this.escapeHtml(post.excerpt || '').substring(0, 100)}...</small>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="user-avatar me-2">
                                ${(post.author?.name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                                <div>${this.escapeHtml(post.author?.name || 'Sconosciuto')}</div>
                                <small class="text-muted">${this.escapeHtml(post.author?.email || '')}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-info">${this.escapeHtml(post.category?.name || 'Nessuna')}</span>
                        ${post.tags?.map(tag => 
                            `<span class="badge bg-light text-dark ms-1">${this.escapeHtml(tag.name)}</span>`
                        ).join('') || ''}
                    </td>
                    <td>
                        <span class="status-badge status-${post.status}">${statusText}</span>
                    </td>
                    <td>
                        <div>${this.formatDate(post.created_at)}</div>
                        <small class="text-muted">Aggiornato: ${this.formatDate(post.updated_at)}</small>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="postsManager.editPost('${post.id}')"
                                    title="Modifica">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-success" onclick="postsManager.previewPost('${post.id}')"
                                    title="Anteprima">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="postsManager.deletePost('${post.id}')"
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
     * Render pagination
     */
    renderPagination() {
        const totalPages = Math.ceil(this.totalPosts / this.itemsPerPage);
        
        if (totalPages <= 1) return '';

        let paginationHTML = '<nav aria-label="Posts pagination"><ul class="pagination justify-content-center">';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="postsManager.changePage(${this.currentPage - 1})">
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
                    <button class="page-link" onclick="postsManager.changePage(1)">1</button>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <button class="page-link" onclick="postsManager.changePage(${i})">${i}</button>
                </li>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="postsManager.changePage(${totalPages})">${totalPages}</button>
                </li>
            `;
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="postsManager.changePage(${this.currentPage + 1})">
                    Successivo
                </button>
            </li>
        `;
        
        paginationHTML += '</ul></nav>';
        
        return paginationHTML;
    }

    /**
     * Render post modal
     */
    renderPostModal() {
        return `
            <div class="modal fade" id="postModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="postModalTitle">Nuovo Post</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="postForm">
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-lg-8">
                                        <!-- Main Content -->
                                        <div class="mb-3">
                                            <label class="form-label">Titolo *</label>
                                            <input type="text" class="form-control" id="postTitle" required
                                                   placeholder="Inserisci il titolo del post">
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Slug URL</label>
                                            <input type="text" class="form-control" id="postSlug"
                                                   placeholder="slug-automatico">
                                            <small class="form-text text-muted">Lascia vuoto per generazione automatica</small>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Contenuto *</label>
                                            <div id="postContentEditor" class="border rounded">
                                                <!-- Rich editor will be initialized here -->
                                            </div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Estratto</label>
                                            <textarea class="form-control" id="postExcerpt" rows="3"
                                                      placeholder="Breve descrizione del post"></textarea>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-4">
                                        <!-- Sidebar -->
                                        <div class="card mb-3">
                                            <div class="card-header">
                                                <h6 class="mb-0">Pubblicazione</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="mb-3">
                                                    <label class="form-label">Stato</label>
                                                    <select class="form-select" id="postStatus">
                                                        <option value="draft">Bozza</option>
                                                        <option value="published">Pubblicato</option>
                                                        <option value="archived">Archiviato</option>
                                                    </select>
                                                </div>
                                                
                                                <div class="mb-3">
                                                    <label class="form-label">Data pubblicazione</label>
                                                    <input type="datetime-local" class="form-control" id="postPublishDate">
                                                </div>
                                                
                                                <div class="form-check">
                                                    <input type="checkbox" class="form-check-input" id="postFeatured">
                                                    <label class="form-check-label" for="postFeatured">
                                                        Post in evidenza
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="card mb-3">
                                            <div class="card-header">
                                                <h6 class="mb-0">Categoria e Tag</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="mb-3">
                                                    <label class="form-label">Categoria</label>
                                                    <select class="form-select" id="postCategory">
                                                        <option value="">Seleziona categoria</option>
                                                        ${this.categories.map(cat => 
                                                            `<option value="${cat.id}">${cat.name}</option>`
                                                        ).join('')}
                                                    </select>
                                                </div>
                                                
                                                <div class="mb-3">
                                                    <label class="form-label">Tag</label>
                                                    <input type="text" class="form-control" id="postTags"
                                                           placeholder="Inserisci tag separati da virgole">
                                                    <small class="form-text text-muted">Es: tecnologia, web, sviluppo</small>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="card mb-3">
                                            <div class="card-header">
                                                <h6 class="mb-0">Immagine in evidenza</h6>
                                            </div>
                                            <div class="card-body">
                                                <div id="featuredImagePreview" class="mb-3 d-none">
                                                    <img src="" alt="Featured image" class="img-fluid rounded">
                                                    <button type="button" class="btn btn-sm btn-outline-danger mt-2" 
                                                            onclick="postsManager.removeFeaturedImage()">
                                                        Rimuovi immagine
                                                    </button>
                                                </div>
                                                <button type="button" class="btn btn-outline-primary" 
                                                        onclick="postsManager.selectFeaturedImage()">
                                                    <i class="fas fa-image me-1"></i>Seleziona immagine
                                                </button>
                                                <input type="hidden" id="postFeaturedImage">
                                            </div>
                                        </div>
                                        
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="mb-0">SEO</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="mb-3">
                                                    <label class="form-label">Titolo SEO</label>
                                                    <input type="text" class="form-control" id="postSeoTitle"
                                                           placeholder="Titolo per motori di ricerca">
                                                    <small class="form-text text-muted">Max 60 caratteri</small>
                                                </div>
                                                
                                                <div class="mb-3">
                                                    <label class="form-label">Meta Description</label>
                                                    <textarea class="form-control" id="postMetaDescription" rows="3"
                                                              placeholder="Descrizione per motori di ricerca"></textarea>
                                                    <small class="form-text text-muted">Max 160 caratteri</small>
                                                </div>
                                                
                                                <div class="mb-3">
                                                    <label class="form-label">Focus Keyword</label>
                                                    <input type="text" class="form-control" id="postFocusKeyword"
                                                           placeholder="Parola chiave principale">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                                <button type="button" class="btn btn-outline-primary" id="savePostDraft">
                                    Salva Bozza
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <span id="postSubmitText">Salva Post</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup table event listeners
     */
    setupTableEventListeners() {
        // Auto-generate slug from title
        const titleInput = document.getElementById('postTitle');
        const slugInput = document.getElementById('postSlug');
        
        if (titleInput && slugInput) {
            titleInput.addEventListener('input', () => {
                if (!this.currentPost || !this.currentPost.id) {
                    slugInput.value = this.generateSlug(titleInput.value);
                }
            });
        }

        // Save draft button
        const saveDraftBtn = document.getElementById('savePostDraft');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => {
                document.getElementById('postStatus').value = 'draft';
                this.submitPost();
            });
        }
    }

    /**
     * Show create post modal
     */
    showCreateModal() {
        this.currentPost = null;
        
        // Reset form
        document.getElementById('postForm').reset();
        document.getElementById('postModalTitle').textContent = 'Nuovo Post';
        document.getElementById('postSubmitText').textContent = 'Crea Post';
        
        // Initialize editor
        const editorContainer = document.getElementById('postContentEditor');
        editorContainer.innerHTML = '<div class="editor-content" style="min-height: 200px; padding: 1rem;"></div>';
        this.editor.init(editorContainer.querySelector('.editor-content'));
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('postModal'));
        modal.show();
    }

    /**
     * Edit existing post
     */
    async editPost(postId) {
        try {
            this.showLoading('postModal', true);
            
            const response = await securityGuard.makeSecureRequest(`/posts/${postId}`);
            
            if (response.success) {
                this.currentPost = response.data;
                this.populatePostForm(this.currentPost);
                
                const modal = new bootstrap.Modal(document.getElementById('postModal'));
                modal.show();
            } else {
                throw new Error(response.error || 'Errore durante il caricamento del post');
            }
        } catch (error) {
            console.error('PostsManager: Failed to edit post:', error);
            this.showError('Errore durante il caricamento del post');
        } finally {
            this.showLoading('postModal', false);
        }
    }

    /**
     * Populate post form with existing data
     */
    populatePostForm(post) {
        document.getElementById('postModalTitle').textContent = 'Modifica Post';
        document.getElementById('postSubmitText').textContent = 'Aggiorna Post';
        
        document.getElementById('postTitle').value = post.title || '';
        document.getElementById('postSlug').value = post.slug || '';
        document.getElementById('postExcerpt').value = post.excerpt || '';
        document.getElementById('postStatus').value = post.status || 'draft';
        document.getElementById('postCategory').value = post.category_id || '';
        document.getElementById('postFeatured').checked = post.featured || false;
        document.getElementById('postSeoTitle').value = post.seo_title || '';
        document.getElementById('postMetaDescription').value = post.meta_description || '';
        document.getElementById('postFocusKeyword').value = post.focus_keyword || '';
        
        // Set publish date
        if (post.publish_date) {
            const date = new Date(post.publish_date);
            document.getElementById('postPublishDate').value = date.toISOString().slice(0, 16);
        }
        
        // Set tags
        if (post.tags && post.tags.length > 0) {
            document.getElementById('postTags').value = post.tags.map(tag => tag.name).join(', ');
        }
        
        // Set featured image
        if (post.featured_image) {
            this.setFeaturedImagePreview(post.featured_image);
        }
        
        // Initialize editor with content
        const editorContainer = document.getElementById('postContentEditor');
        editorContainer.innerHTML = '<div class="editor-content" style="min-height: 200px; padding: 1rem;"></div>';
        this.editor.init(editorContainer.querySelector('.editor-content'));
        this.editor.setContent(post.content || '');
    }

    /**
     * Handle post form submission
     */
    async handlePostSubmit(form) {
        try {
            await this.submitPost();
        } catch (error) {
            console.error('PostsManager: Post submission failed:', error);
        }
    }

    /**
     * Submit post data
     */
    async submitPost() {
        try {
            const formData = this.collectPostData();
            
            // Validate required fields
            if (!formData.title.trim()) {
                throw new Error('Il titolo è obbligatorio');
            }
            
            if (!formData.content.trim()) {
                throw new Error('Il contenuto è obbligatorio');
            }

            const url = this.currentPost ? `/posts/${this.currentPost.id}` : '/posts';
            const method = this.currentPost ? 'PUT' : 'POST';

            const response = await securityGuard.makeSecureRequest(url, {
                method,
                body: JSON.stringify(formData)
            });

            if (response.success) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('postModal'));
                modal.hide();
                
                // Clear cache
                this.cache.clear();
                
                // Reload posts
                await this.loadPosts();
                this.renderPostsInterface();
                
                const action = this.currentPost ? 'aggiornato' : 'creato';
                this.showSuccess(`Post ${action} con successo`);
                
            } else {
                throw new Error(response.error || 'Errore durante il salvataggio');
            }
        } catch (error) {
            console.error('PostsManager: Submit failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Collect post data from form
     */
    collectPostData() {
        return {
            title: document.getElementById('postTitle').value.trim(),
            slug: document.getElementById('postSlug').value.trim() || this.generateSlug(document.getElementById('postTitle').value),
            content: this.editor.getContent(),
            excerpt: document.getElementById('postExcerpt').value.trim(),
            status: document.getElementById('postStatus').value,
            category_id: document.getElementById('postCategory').value || null,
            featured: document.getElementById('postFeatured').checked,
            featured_image: document.getElementById('postFeaturedImage').value || null,
            publish_date: document.getElementById('postPublishDate').value || null,
            tags: this.parseTags(document.getElementById('postTags').value),
            seo_title: document.getElementById('postSeoTitle').value.trim(),
            meta_description: document.getElementById('postMetaDescription').value.trim(),
            focus_keyword: document.getElementById('postFocusKeyword').value.trim()
        };
    }

    /**
     * Parse tags from input
     */
    parseTags(tagsString) {
        if (!tagsString.trim()) return [];
        
        return tagsString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => ({ name: tag }));
    }

    /**
     * Generate URL slug from title
     */
    generateSlug(title) {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }

    /**
     * Delete post
     */
    async deletePost(postId) {
        if (!confirm('Sei sicuro di voler eliminare questo post? Questa azione non può essere annullata.')) {
            return;
        }

        try {
            const response = await securityGuard.makeSecureRequest(`/posts/${postId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.cache.clear();
                await this.loadPosts();
                this.renderPostsInterface();
                this.showSuccess('Post eliminato con successo');
            } else {
                throw new Error(response.error || 'Errore durante l\'eliminazione');
            }
        } catch (error) {
            console.error('PostsManager: Delete failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Preview post
     */
    previewPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            window.open(`/preview/post/${post.slug || post.id}`, '_blank');
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
        this.loadPosts().then(() => this.renderPostsInterface());
    }

    /**
     * Change page
     */
    async changePage(page) {
        if (page < 1) return;
        
        this.currentPage = page;
        
        try {
            await this.loadPosts();
            this.renderPostsInterface();
            
            // Scroll to top of table
            document.querySelector('.table-responsive').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        } catch (error) {
            console.error('PostsManager: Page change failed:', error);
            this.showError('Errore durante il caricamento della pagina');
        }
    }

    /**
     * Toggle select all posts
     */
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.post-select');
        checkboxes.forEach(cb => {
            cb.checked = checked;
        });
        this.updateBulkActions();
    }

    /**
     * Update bulk actions availability
     */
    updateBulkActions() {
        const selected = document.querySelectorAll('.post-select:checked').length;
        const bulkButtons = document.querySelectorAll('.bulk-action-btn');
        
        bulkButtons.forEach(btn => {
            btn.disabled = selected === 0;
        });
    }

    /**
     * Handle bulk actions
     */
    async handleBulkAction(action) {
        const selectedIds = Array.from(document.querySelectorAll('.post-select:checked'))
            .map(cb => cb.value);
        
        if (selectedIds.length === 0) return;

        const confirmMessages = {
            delete: 'Sei sicuro di voler eliminare i post selezionati?',
            archive: 'Sei sicuro di voler archiviare i post selezionati?',
            publish: 'Sei sicuro di voler pubblicare i post selezionati?'
        };

        if (!confirm(confirmMessages[action])) return;

        try {
            const response = await securityGuard.makeSecureRequest('/posts/bulk', {
                method: 'POST',
                body: JSON.stringify({
                    action,
                    post_ids: selectedIds
                })
            });

            if (response.success) {
                this.cache.clear();
                await this.loadPosts();
                this.renderPostsInterface();
                
                const actionMessages = {
                    delete: 'eliminati',
                    archive: 'archiviati', 
                    publish: 'pubblicati'
                };
                
                this.showSuccess(`${selectedIds.length} post ${actionMessages[action]} con successo`);
            } else {
                throw new Error(response.error || 'Errore durante l\'operazione');
            }
        } catch (error) {
            console.error('PostsManager: Bulk action failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Select featured image
     */
    selectFeaturedImage() {
        // This would typically open a media picker modal
        // For now, we'll simulate it with a file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // In a real implementation, you'd upload the file here
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.setFeaturedImagePreview(e.target.result);
                    document.getElementById('postFeaturedImage').value = 'uploaded_image_id';
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    /**
     * Set featured image preview
     */
    setFeaturedImagePreview(imageSrc) {
        const preview = document.getElementById('featuredImagePreview');
        const img = preview.querySelector('img');
        
        img.src = imageSrc;
        preview.classList.remove('d-none');
    }

    /**
     * Remove featured image
     */
    removeFeaturedImage() {
        document.getElementById('featuredImagePreview').classList.add('d-none');
        document.getElementById('postFeaturedImage').value = '';
    }

    /**
     * Utility functions
     */
    escapeHtml(text) {
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

// Global posts manager instance
const postsManager = new PostsManager();

// Export for use in other modules
window.postsManager = postsManager;

console.info('PostsManager: Posts management system initialized successfully');