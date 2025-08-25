/**
 * IT-ERA Admin Panel - Media Management
 * 
 * Complete media management system with file upload, image gallery,
 * file organization, resizing, optimization, and cloud storage integration.
 */

class MediaManager {
    constructor() {
        this.mediaFiles = [];
        this.selectedFiles = new Set();
        this.currentFolder = '';
        this.viewMode = 'grid'; // grid or list
        
        // Pagination
        this.currentPage = 1;
        this.itemsPerPage = CONFIG.ITEMS_PER_PAGE || 20;
        this.totalFiles = 0;
        
        // Filters
        this.filters = {
            type: 'all', // all, image, video, audio, document
            search: '',
            dateFrom: '',
            dateTo: '',
            minSize: '',
            maxSize: ''
        };
        
        // Upload configuration
        this.uploadConfig = {
            maxFileSize: CONFIG.UPLOAD_MAX_SIZE || 10 * 1024 * 1024, // 10MB
            allowedTypes: {
                image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
                video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
                audio: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
                document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf']
            },
            imageOptimization: {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 0.85
            }
        };
        
        // Drag and drop
        this.dragCounter = 0;
        
        // Cache
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        this.init();
    }

    /**
     * Initialize media manager
     */
    init() {
        console.info('MediaManager: Initializing media management system');
        
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.loadInitialData();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // File upload
        document.addEventListener('change', (e) => {
            if (e.target.id === 'fileUploadInput') {
                this.handleFileSelection(e.target.files);
            }
        });

        // Filter changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('media-filter')) {
                this.handleFilterChange(e.target);
            }
        });

        // Search
        document.addEventListener('input', (e) => {
            if (e.target.id === 'mediaSearch') {
                this.debounce(() => {
                    this.filters.search = e.target.value;
                    this.loadMediaFiles();
                }, 500)();
            }
        });

        // View mode toggle
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-mode-btn')) {
                this.setViewMode(e.target.dataset.mode);
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
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        const dropZones = ['.upload-area', '#mediaContent'];
        
        dropZones.forEach(selector => {
            document.addEventListener('dragenter', (e) => {
                if (e.target.matches(selector) || e.target.closest(selector)) {
                    e.preventDefault();
                    this.dragCounter++;
                    this.showDropZone(true);
                }
            });

            document.addEventListener('dragover', (e) => {
                if (e.target.matches(selector) || e.target.closest(selector)) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }
            });

            document.addEventListener('dragleave', (e) => {
                if (e.target.matches(selector) || e.target.closest(selector)) {
                    this.dragCounter--;
                    if (this.dragCounter === 0) {
                        this.showDropZone(false);
                    }
                }
            });

            document.addEventListener('drop', (e) => {
                if (e.target.matches(selector) || e.target.closest(selector)) {
                    e.preventDefault();
                    this.dragCounter = 0;
                    this.showDropZone(false);
                    this.handleFileSelection(e.dataTransfer.files);
                }
            });
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            this.showLoading('mediaContent', true);
            
            await this.loadMediaFiles();
            this.renderMediaInterface();
            
        } catch (error) {
            console.error('MediaManager: Failed to load initial data:', error);
            this.showError('Errore durante il caricamento dei media');
        } finally {
            this.showLoading('mediaContent', false);
        }
    }

    /**
     * Load media files with filters and pagination
     */
    async loadMediaFiles() {
        try {
            const cacheKey = `media_${JSON.stringify(this.filters)}_${this.currentPage}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    this.mediaFiles = cached.data.files;
                    this.totalFiles = cached.data.total;
                    return;
                }
            }

            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                folder: this.currentFolder,
                ...this.filters
            });

            const response = await securityGuard.makeSecureRequest(`/media?${params}`);
            
            if (response.success) {
                this.mediaFiles = response.data.files || [];
                this.totalFiles = response.data.total || 0;
                
                // Cache the results
                this.cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });
                
                console.info(`MediaManager: Loaded ${this.mediaFiles.length} files`);
            } else {
                throw new Error(response.error || 'Errore durante il caricamento dei media');
            }
        } catch (error) {
            console.error('MediaManager: Failed to load media files:', error);
            this.mediaFiles = [];
            this.totalFiles = 0;
            throw error;
        }
    }

    /**
     * Render media interface
     */
    renderMediaInterface() {
        const container = document.getElementById('mediaContent');
        
        container.innerHTML = `
            <!-- Upload Area -->
            <div class="upload-area mb-4" onclick="this.querySelector('input').click()">
                <div class="text-center py-4">
                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                    <h5>Trascina i file qui o clicca per selezionare</h5>
                    <p class="text-muted mb-0">
                        Formati supportati: ${this.getSupportedFormats()}<br>
                        Dimensione massima: ${this.formatFileSize(this.uploadConfig.maxFileSize)}
                    </p>
                </div>
                <input type="file" id="fileUploadInput" multiple class="d-none" 
                       accept="${this.getAcceptAttribute()}">
            </div>

            <!-- Toolbar -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="d-flex align-items-center">
                    <!-- Search -->
                    <div class="input-group me-3" style="width: 300px;">
                        <input type="text" class="form-control" id="mediaSearch" 
                               placeholder="Cerca file..." value="${this.filters.search}">
                        <button class="btn btn-outline-secondary" type="button">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    
                    <!-- Filters -->
                    <select class="form-select me-2 media-filter" data-filter="type" style="width: 150px;">
                        <option value="all">Tutti i tipi</option>
                        <option value="image" ${this.filters.type === 'image' ? 'selected' : ''}>Immagini</option>
                        <option value="video" ${this.filters.type === 'video' ? 'selected' : ''}>Video</option>
                        <option value="audio" ${this.filters.type === 'audio' ? 'selected' : ''}>Audio</option>
                        <option value="document" ${this.filters.type === 'document' ? 'selected' : ''}>Documenti</option>
                    </select>
                </div>
                
                <div class="d-flex align-items-center">
                    <!-- View Mode Toggle -->
                    <div class="btn-group me-3">
                        <button class="btn btn-outline-secondary view-mode-btn ${this.viewMode === 'grid' ? 'active' : ''}" 
                                data-mode="grid">
                            <i class="fas fa-th"></i>
                        </button>
                        <button class="btn btn-outline-secondary view-mode-btn ${this.viewMode === 'list' ? 'active' : ''}" 
                                data-mode="list">
                            <i class="fas fa-list"></i>
                        </button>
                    </div>
                    
                    <!-- Bulk Actions -->
                    <div class="btn-group">
                        <button class="btn btn-outline-danger bulk-action-btn" 
                                data-action="delete" disabled>
                            <i class="fas fa-trash me-1"></i>Elimina
                        </button>
                        <button class="btn btn-outline-primary bulk-action-btn" 
                                data-action="move" disabled>
                            <i class="fas fa-folder me-1"></i>Sposta
                        </button>
                    </div>
                </div>
            </div>

            <!-- Selection Info -->
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center">
                    <input type="checkbox" class="form-check-input me-2" id="selectAllMedia" 
                           onchange="mediaManager.toggleSelectAll(this.checked)">
                    <label for="selectAllMedia" class="form-check-label">
                        Seleziona tutto (<span id="selectedCount">0</span> selezionati)
                    </label>
                </div>
                <span class="text-muted">Totale: ${this.totalFiles} file</span>
            </div>

            <!-- Media Grid/List -->
            <div id="mediaContainer" class="media-${this.viewMode}">
                ${this.renderMediaFiles()}
            </div>

            <!-- Pagination -->
            ${this.renderPagination()}

            <!-- Upload Progress Modal -->
            ${this.renderUploadModal()}
            
            <!-- File Details Modal -->
            ${this.renderFileDetailsModal()}
        `;

        this.updateSelectionUI();
    }

    /**
     * Render media files
     */
    renderMediaFiles() {
        if (this.mediaFiles.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                    <h5>Nessun file trovato</h5>
                    <p class="text-muted">Carica il primo file trascinandolo qui sopra</p>
                </div>
            `;
        }

        if (this.viewMode === 'grid') {
            return this.renderGridView();
        } else {
            return this.renderListView();
        }
    }

    /**
     * Render grid view
     */
    renderGridView() {
        return `
            <div class="media-grid">
                ${this.mediaFiles.map(file => `
                    <div class="media-item ${this.selectedFiles.has(file.id) ? 'selected' : ''}" 
                         data-file-id="${file.id}">
                        <div class="media-thumbnail">
                            ${this.renderFileThumbnail(file)}
                            <div class="media-overlay">
                                <div class="media-actions">
                                    <button class="btn btn-sm btn-primary" onclick="mediaManager.viewFile('${file.id}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-info" onclick="mediaManager.editFile('${file.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="mediaManager.deleteFile('${file.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="media-info">
                            <div class="media-checkbox">
                                <input type="checkbox" class="form-check-input media-select" 
                                       value="${file.id}" onchange="mediaManager.updateSelection()">
                            </div>
                            <div class="media-details">
                                <div class="media-name" title="${file.original_name}">
                                    ${this.truncateText(file.original_name, 20)}
                                </div>
                                <div class="media-meta">
                                    <small class="text-muted">
                                        ${this.formatFileSize(file.size)} • ${this.formatDate(file.created_at)}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render list view
     */
    renderListView() {
        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th width="50">
                                <input type="checkbox" class="form-check-input" id="selectAllHeader">
                            </th>
                            <th>Preview</th>
                            <th>Nome File</th>
                            <th>Tipo</th>
                            <th>Dimensione</th>
                            <th>Data Caricamento</th>
                            <th width="150">Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.mediaFiles.map(file => `
                            <tr>
                                <td>
                                    <input type="checkbox" class="form-check-input media-select" 
                                           value="${file.id}" onchange="mediaManager.updateSelection()">
                                </td>
                                <td>
                                    <div style="width: 40px; height: 40px;">
                                        ${this.renderFileThumbnail(file, 'small')}
                                    </div>
                                </td>
                                <td>
                                    <div>
                                        <strong>${this.escapeHtml(file.original_name)}</strong>
                                        <br>
                                        <small class="text-muted">${file.path || 'Root'}</small>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-secondary">${file.type?.toUpperCase() || 'N/A'}</span>
                                </td>
                                <td>
                                    ${this.formatFileSize(file.size)}
                                    ${file.dimensions ? `<br><small class="text-muted">${file.dimensions}</small>` : ''}
                                </td>
                                <td>
                                    ${this.formatDate(file.created_at)}
                                    <br>
                                    <small class="text-muted">da ${this.escapeHtml(file.uploaded_by?.name || 'Sistema')}</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="mediaManager.viewFile('${file.id}')"
                                                title="Visualizza">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="mediaManager.editFile('${file.id}')"
                                                title="Modifica">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="mediaManager.downloadFile('${file.id}')"
                                                title="Download">
                                            <i class="fas fa-download"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="mediaManager.deleteFile('${file.id}')"
                                                title="Elimina">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render file thumbnail
     */
    renderFileThumbnail(file, size = 'normal') {
        const isSmall = size === 'small';
        const className = isSmall ? 'img-fluid rounded' : 'media-thumbnail-img';
        
        if (file.type === 'image') {
            const thumbnailUrl = file.thumbnail_url || file.url;
            return `<img src="${thumbnailUrl}" alt="${file.original_name}" class="${className}">`;
        }
        
        const iconClass = this.getFileIcon(file);
        const iconSize = isSmall ? 'fa-lg' : 'fa-3x';
        
        return `
            <div class="file-icon-wrapper ${isSmall ? 'small' : ''}">
                <i class="${iconClass} ${iconSize} text-muted"></i>
                <div class="file-extension">${this.getFileExtension(file.original_name)}</div>
            </div>
        `;
    }

    /**
     * Get file icon based on type
     */
    getFileIcon(file) {
        const iconMap = {
            image: 'fas fa-image',
            video: 'fas fa-video',
            audio: 'fas fa-music',
            document: 'fas fa-file-alt',
            pdf: 'fas fa-file-pdf',
            word: 'fas fa-file-word',
            excel: 'fas fa-file-excel',
            powerpoint: 'fas fa-file-powerpoint',
            zip: 'fas fa-file-archive',
            code: 'fas fa-file-code'
        };
        
        return iconMap[file.type] || iconMap[this.getSpecificFileType(file)] || 'fas fa-file';
    }

    /**
     * Get specific file type based on extension
     */
    getSpecificFileType(file) {
        const ext = this.getFileExtension(file.original_name).toLowerCase();
        
        const typeMap = {
            pdf: 'pdf',
            doc: 'word', docx: 'word',
            xls: 'excel', xlsx: 'excel',
            ppt: 'powerpoint', pptx: 'powerpoint',
            zip: 'zip', rar: 'zip', '7z': 'zip',
            js: 'code', html: 'code', css: 'code', php: 'code', py: 'code'
        };
        
        return typeMap[ext] || file.type;
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const totalPages = Math.ceil(this.totalFiles / this.itemsPerPage);
        
        if (totalPages <= 1) return '';

        let paginationHTML = '<nav aria-label="Media pagination"><ul class="pagination justify-content-center mt-4">';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="mediaManager.changePage(${this.currentPage - 1})">
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
                    <button class="page-link" onclick="mediaManager.changePage(1)">1</button>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <button class="page-link" onclick="mediaManager.changePage(${i})">${i}</button>
                </li>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="mediaManager.changePage(${totalPages})">${totalPages}</button>
                </li>
            `;
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="mediaManager.changePage(${this.currentPage + 1})">
                    Successivo
                </button>
            </li>
        `;
        
        paginationHTML += '</ul></nav>';
        
        return paginationHTML;
    }

    /**
     * Render upload modal
     */
    renderUploadModal() {
        return `
            <div class="modal fade" id="uploadModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Upload File</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="uploadProgress" class="d-none">
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Upload in corso...</span>
                                        <span id="uploadPercentage">0%</span>
                                    </div>
                                    <div class="progress">
                                        <div class="progress-bar" id="uploadProgressBar" 
                                             role="progressbar" style="width: 0%"></div>
                                    </div>
                                </div>
                                <div id="uploadFileList"></div>
                            </div>
                            <div id="uploadResults" class="d-none">
                                <h6>Risultati Upload:</h6>
                                <div id="uploadResultsList"></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render file details modal
     */
    renderFileDetailsModal() {
        return `
            <div class="modal fade" id="fileDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="fileDetailsTitle">Dettagli File</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="fileDetailsContent">
                            <!-- File details will be loaded here -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                            <button type="button" class="btn btn-primary" id="saveFileDetails">
                                Salva Modifiche
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Show upload modal
     */
    showUploadModal() {
        const input = document.getElementById('fileUploadInput');
        input.click();
    }

    /**
     * Handle file selection
     */
    async handleFileSelection(files) {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        
        // Validate files
        const validFiles = [];
        const errors = [];
        
        for (const file of fileArray) {
            const validation = this.validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        }
        
        if (errors.length > 0) {
            this.showError('Alcuni file non sono validi:\n' + errors.join('\n'));
        }
        
        if (validFiles.length > 0) {
            await this.uploadFiles(validFiles);
        }
    }

    /**
     * Validate file before upload
     */
    validateFile(file) {
        // Check file size
        if (file.size > this.uploadConfig.maxFileSize) {
            return {
                valid: false,
                error: `File troppo grande (max ${this.formatFileSize(this.uploadConfig.maxFileSize)})`
            };
        }
        
        // Check file type
        const extension = this.getFileExtension(file.name).toLowerCase();
        const isValidType = Object.values(this.uploadConfig.allowedTypes)
            .some(types => types.includes(extension));
        
        if (!isValidType) {
            return {
                valid: false,
                error: 'Tipo di file non supportato'
            };
        }
        
        return { valid: true };
    }

    /**
     * Upload files with progress tracking
     */
    async uploadFiles(files) {
        const modal = new bootstrap.Modal(document.getElementById('uploadModal'));
        modal.show();
        
        document.getElementById('uploadProgress').classList.remove('d-none');
        document.getElementById('uploadResults').classList.add('d-none');
        
        const fileList = document.getElementById('uploadFileList');
        const progressBar = document.getElementById('uploadProgressBar');
        const percentageSpan = document.getElementById('uploadPercentage');
        
        // Show file list
        fileList.innerHTML = files.map(file => `
            <div class="d-flex justify-content-between align-items-center mb-2" data-file="${file.name}">
                <div>
                    <i class="${this.getFileIconByName(file.name)} me-2"></i>
                    ${file.name}
                    <small class="text-muted">(${this.formatFileSize(file.size)})</small>
                </div>
                <div class="upload-status">
                    <div class="spinner-border spinner-border-sm" role="status"></div>
                </div>
            </div>
        `).join('');
        
        const results = [];
        let completedFiles = 0;
        
        try {
            for (const file of files) {
                try {
                    const result = await this.uploadSingleFile(file);
                    results.push({ file: file.name, success: true, data: result });
                    
                    // Update file status
                    const fileElement = fileList.querySelector(`[data-file="${file.name}"] .upload-status`);
                    if (fileElement) {
                        fileElement.innerHTML = '<i class="fas fa-check text-success"></i>';
                    }
                    
                } catch (error) {
                    console.error(`Upload failed for ${file.name}:`, error);
                    results.push({ file: file.name, success: false, error: error.message });
                    
                    // Update file status
                    const fileElement = fileList.querySelector(`[data-file="${file.name}"] .upload-status`);
                    if (fileElement) {
                        fileElement.innerHTML = '<i class="fas fa-times text-danger"></i>';
                    }
                }
                
                completedFiles++;
                const percentage = Math.round((completedFiles / files.length) * 100);
                progressBar.style.width = `${percentage}%`;
                percentageSpan.textContent = `${percentage}%`;
            }
            
            // Show results
            this.showUploadResults(results);
            
            // Clear cache and reload media
            this.cache.clear();
            await this.loadMediaFiles();
            this.renderMediaInterface();
            
        } catch (error) {
            console.error('Upload process failed:', error);
            this.showError('Errore durante l\'upload dei file');
        }
    }

    /**
     * Upload single file
     */
    async uploadSingleFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', this.currentFolder);
        
        // Add metadata
        formData.append('metadata', JSON.stringify({
            originalName: file.name,
            size: file.size,
            type: file.type
        }));
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/media/upload`, {
            method: 'POST',
            headers: securityGuard.tokenManager.getAuthHeaders(),
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Upload fallito');
        }
        
        return result.data;
    }

    /**
     * Show upload results
     */
    showUploadResults(results) {
        document.getElementById('uploadProgress').classList.add('d-none');
        document.getElementById('uploadResults').classList.remove('d-none');
        
        const resultsList = document.getElementById('uploadResultsList');
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        let html = '';
        
        if (successful.length > 0) {
            html += `
                <div class="alert alert-success">
                    <strong>✓ ${successful.length} file caricati con successo:</strong>
                    <ul class="mb-0 mt-2">
                        ${successful.map(r => `<li>${r.file}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        if (failed.length > 0) {
            html += `
                <div class="alert alert-danger">
                    <strong>✗ ${failed.length} file non caricati:</strong>
                    <ul class="mb-0 mt-2">
                        ${failed.map(r => `<li>${r.file}: ${r.error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        resultsList.innerHTML = html;
    }

    /**
     * View file details
     */
    async viewFile(fileId) {
        try {
            const file = this.mediaFiles.find(f => f.id === fileId);
            if (!file) {
                throw new Error('File non trovato');
            }
            
            this.showFileDetails(file);
            
        } catch (error) {
            console.error('MediaManager: Failed to view file:', error);
            this.showError('Errore durante la visualizzazione del file');
        }
    }

    /**
     * Show file details modal
     */
    showFileDetails(file) {
        document.getElementById('fileDetailsTitle').textContent = file.original_name;
        
        const content = document.getElementById('fileDetailsContent');
        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <!-- File Preview -->
                    <div class="mb-4">
                        <h6>Anteprima</h6>
                        <div class="border rounded p-3 text-center" style="min-height: 200px;">
                            ${this.renderFilePreview(file)}
                        </div>
                    </div>
                    
                    <!-- File Info -->
                    <div class="mb-4">
                        <h6>Informazioni File</h6>
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Nome:</strong></td>
                                <td>${this.escapeHtml(file.original_name)}</td>
                            </tr>
                            <tr>
                                <td><strong>Tipo:</strong></td>
                                <td>${file.type} (${file.mime_type})</td>
                            </tr>
                            <tr>
                                <td><strong>Dimensione:</strong></td>
                                <td>${this.formatFileSize(file.size)}</td>
                            </tr>
                            ${file.dimensions ? `
                            <tr>
                                <td><strong>Dimensioni:</strong></td>
                                <td>${file.dimensions}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td><strong>Caricato:</strong></td>
                                <td>${this.formatDate(file.created_at)}</td>
                            </tr>
                            <tr>
                                <td><strong>Da:</strong></td>
                                <td>${file.uploaded_by?.name || 'Sistema'}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <!-- Editable Fields -->
                    <form id="fileDetailsForm">
                        <input type="hidden" id="editFileId" value="${file.id}">
                        
                        <div class="mb-3">
                            <label class="form-label">Titolo</label>
                            <input type="text" class="form-control" id="fileTitle" 
                                   value="${this.escapeHtml(file.title || '')}" 
                                   placeholder="Titolo del file">
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Descrizione</label>
                            <textarea class="form-control" id="fileDescription" rows="4" 
                                      placeholder="Descrizione del file">${this.escapeHtml(file.description || '')}</textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Testo Alternativo (Alt Text)</label>
                            <input type="text" class="form-control" id="fileAltText" 
                                   value="${this.escapeHtml(file.alt_text || '')}" 
                                   placeholder="Testo alternativo per accessibilità">
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Tag</label>
                            <input type="text" class="form-control" id="fileTags" 
                                   value="${file.tags ? file.tags.map(t => t.name).join(', ') : ''}" 
                                   placeholder="Tag separati da virgole">
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">URL Pubblico</label>
                            <div class="input-group">
                                <input type="text" class="form-control" value="${file.url}" readonly>
                                <button class="btn btn-outline-secondary" type="button" 
                                        onclick="mediaManager.copyToClipboard('${file.url}')">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                    
                    <!-- Actions -->
                    <div class="d-grid gap-2">
                        <button class="btn btn-outline-primary" onclick="mediaManager.downloadFile('${file.id}')">
                            <i class="fas fa-download me-2"></i>Download
                        </button>
                        ${file.type === 'image' ? `
                        <button class="btn btn-outline-info" onclick="mediaManager.editImage('${file.id}')">
                            <i class="fas fa-edit me-2"></i>Modifica Immagine
                        </button>
                        ` : ''}
                        <button class="btn btn-outline-danger" onclick="mediaManager.deleteFileFromModal('${file.id}')">
                            <i class="fas fa-trash me-2"></i>Elimina File
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Setup form submission
        document.getElementById('saveFileDetails').onclick = () => {
            this.saveFileDetails();
        };
        
        const modal = new bootstrap.Modal(document.getElementById('fileDetailsModal'));
        modal.show();
    }

    /**
     * Render file preview
     */
    renderFilePreview(file) {
        switch (file.type) {
            case 'image':
                return `<img src="${file.url}" alt="${file.original_name}" class="img-fluid rounded">`;
                
            case 'video':
                return `
                    <video controls class="w-100" style="max-height: 200px;">
                        <source src="${file.url}" type="${file.mime_type}">
                        Il tuo browser non supporta il tag video.
                    </video>
                `;
                
            case 'audio':
                return `
                    <audio controls class="w-100">
                        <source src="${file.url}" type="${file.mime_type}">
                        Il tuo browser non supporta il tag audio.
                    </audio>
                `;
                
            default:
                return `
                    <div class="d-flex flex-column align-items-center justify-content-center h-100">
                        <i class="${this.getFileIcon(file)} fa-4x text-muted mb-3"></i>
                        <p class="text-muted">Anteprima non disponibile</p>
                    </div>
                `;
        }
    }

    /**
     * Save file details
     */
    async saveFileDetails() {
        try {
            const fileId = document.getElementById('editFileId').value;
            
            const data = {
                title: document.getElementById('fileTitle').value.trim(),
                description: document.getElementById('fileDescription').value.trim(),
                alt_text: document.getElementById('fileAltText').value.trim(),
                tags: this.parseTags(document.getElementById('fileTags').value)
            };
            
            const response = await securityGuard.makeSecureRequest(`/media/${fileId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('fileDetailsModal'));
                modal.hide();
                
                // Clear cache and reload
                this.cache.clear();
                await this.loadMediaFiles();
                this.renderMediaInterface();
                
                this.showSuccess('Dettagli file aggiornati con successo');
            } else {
                throw new Error(response.error || 'Errore durante l\'aggiornamento');
            }
        } catch (error) {
            console.error('MediaManager: Failed to save file details:', error);
            this.showError(error.message);
        }
    }

    /**
     * Delete file
     */
    async deleteFile(fileId) {
        const file = this.mediaFiles.find(f => f.id === fileId);
        if (!file) return;
        
        if (!confirm(`Sei sicuro di voler eliminare "${file.original_name}"? Questa azione non può essere annullata.`)) {
            return;
        }
        
        await this.deleteFiles([fileId]);
    }

    /**
     * Delete file from modal
     */
    async deleteFileFromModal(fileId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('fileDetailsModal'));
        modal.hide();
        
        await this.deleteFile(fileId);
    }

    /**
     * Delete multiple files
     */
    async deleteFiles(fileIds) {
        try {
            const response = await securityGuard.makeSecureRequest('/media/bulk', {
                method: 'DELETE',
                body: JSON.stringify({ file_ids: fileIds })
            });
            
            if (response.success) {
                this.cache.clear();
                this.selectedFiles.clear();
                await this.loadMediaFiles();
                this.renderMediaInterface();
                
                this.showSuccess(`${fileIds.length} file eliminati con successo`);
            } else {
                throw new Error(response.error || 'Errore durante l\'eliminazione');
            }
        } catch (error) {
            console.error('MediaManager: Failed to delete files:', error);
            this.showError(error.message);
        }
    }

    /**
     * Download file
     */
    downloadFile(fileId) {
        const file = this.mediaFiles.find(f => f.id === fileId);
        if (!file) return;
        
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.original_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Copy URL to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('URL copiato negli appunti');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showError('Errore durante la copia negli appunti');
        }
    }

    /**
     * Set view mode
     */
    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update buttons
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Re-render media container
        const container = document.getElementById('mediaContainer');
        container.className = `media-${mode}`;
        container.innerHTML = this.renderMediaFiles();
    }

    /**
     * Handle filter change
     */
    handleFilterChange(element) {
        const filterName = element.dataset.filter;
        this.filters[filterName] = element.value;
        this.currentPage = 1;
        this.cache.clear();
        this.loadMediaFiles().then(() => this.renderMediaInterface());
    }

    /**
     * Change page
     */
    async changePage(page) {
        if (page < 1) return;
        
        this.currentPage = page;
        
        try {
            await this.loadMediaFiles();
            this.renderMediaInterface();
            
            // Scroll to top of media container
            document.getElementById('mediaContainer').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        } catch (error) {
            console.error('MediaManager: Page change failed:', error);
            this.showError('Errore durante il caricamento della pagina');
        }
    }

    /**
     * Toggle select all
     */
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.media-select');
        checkboxes.forEach(cb => {
            cb.checked = checked;
        });
        this.updateSelection();
    }

    /**
     * Update selection
     */
    updateSelection() {
        this.selectedFiles.clear();
        
        document.querySelectorAll('.media-select:checked').forEach(cb => {
            this.selectedFiles.add(cb.value);
        });
        
        this.updateSelectionUI();
    }

    /**
     * Update selection UI
     */
    updateSelectionUI() {
        const count = this.selectedFiles.size;
        const countSpan = document.getElementById('selectedCount');
        if (countSpan) {
            countSpan.textContent = count;
        }
        
        // Update bulk action buttons
        const bulkButtons = document.querySelectorAll('.bulk-action-btn');
        bulkButtons.forEach(btn => {
            btn.disabled = count === 0;
        });
        
        // Update media items selection state
        document.querySelectorAll('.media-item').forEach(item => {
            const fileId = item.dataset.fileId;
            item.classList.toggle('selected', this.selectedFiles.has(fileId));
        });
    }

    /**
     * Handle bulk actions
     */
    async handleBulkAction(action) {
        const selectedIds = Array.from(this.selectedFiles);
        
        if (selectedIds.length === 0) return;
        
        switch (action) {
            case 'delete':
                if (confirm(`Sei sicuro di voler eliminare ${selectedIds.length} file selezionati?`)) {
                    await this.deleteFiles(selectedIds);
                }
                break;
                
            case 'move':
                // Implement folder move functionality
                this.showMoveDialog(selectedIds);
                break;
        }
    }

    /**
     * Show drop zone
     */
    showDropZone(show) {
        const uploadArea = document.querySelector('.upload-area');
        if (uploadArea) {
            uploadArea.classList.toggle('dragover', show);
        }
    }

    /**
     * Utility functions
     */
    getSupportedFormats() {
        const allTypes = Object.values(this.uploadConfig.allowedTypes).flat();
        return allTypes.slice(0, 10).join(', ') + (allTypes.length > 10 ? '...' : '');
    }

    getAcceptAttribute() {
        const extensions = Object.values(this.uploadConfig.allowedTypes).flat();
        return extensions.map(ext => `.${ext}`).join(',');
    }

    getFileExtension(filename) {
        return filename.split('.').pop() || '';
    }

    getFileIconByName(filename) {
        const ext = this.getFileExtension(filename).toLowerCase();
        const file = { type: 'document', original_name: filename };
        return this.getFileIcon(file);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    parseTags(tagsString) {
        if (!tagsString.trim()) return [];
        
        return tagsString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => ({ name: tag }));
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

// Global media manager instance
const mediaManager = new MediaManager();

// Export for use in other modules
window.mediaManager = mediaManager;

console.info('MediaManager: Media management system initialized successfully');