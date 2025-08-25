/**
 * IT-ERA Admin Panel - Settings Management
 * 
 * Complete system configuration management with categories,
 * validation, backup/restore, and environment-specific settings.
 */

class SettingsManager {
    constructor() {
        this.settings = {};
        this.categories = [];
        this.originalSettings = {};
        this.hasUnsavedChanges = false;
        
        // Settings validation rules
        this.validationRules = {
            required: ['site_name', 'site_url', 'admin_email'],
            email: ['admin_email', 'smtp_username', 'contact_email'],
            url: ['site_url', 'api_base_url'],
            number: ['smtp_port', 'session_timeout', 'file_max_size'],
            boolean: ['maintenance_mode', 'debug_mode', 'cache_enabled']
        };
        
        // Auto-save configuration
        this.autoSaveEnabled = true;
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
        
        this.init();
    }

    /**
     * Initialize settings manager
     */
    init() {
        console.info('SettingsManager: Initializing settings management system');
        
        this.setupEventListeners();
        this.loadInitialData();
        this.setupAutoSave();
        this.setupBeforeUnloadWarning();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form changes tracking
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('setting-input')) {
                this.handleSettingChange(e.target);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('setting-input')) {
                this.handleSettingChange(e.target);
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('settings-form')) {
                e.preventDefault();
                this.saveSettings(e.target.dataset.category);
            }
        });

        // Action buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('save-settings-btn')) {
                this.saveSettings(e.target.dataset.category);
            }
            if (e.target.classList.contains('reset-settings-btn')) {
                this.resetSettings(e.target.dataset.category);
            }
            if (e.target.id === 'backupSettings') {
                this.exportSettings();
            }
            if (e.target.id === 'restoreSettings') {
                this.showRestoreModal();
            }
            if (e.target.id === 'testEmailSettings') {
                this.testEmailSettings();
            }
        });

        // File upload for restore
        document.addEventListener('change', (e) => {
            if (e.target.id === 'settingsFileInput') {
                this.handleRestoreFile(e.target.files[0]);
            }
        });
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        if (!this.autoSaveEnabled) return;
        
        this.autoSaveTimer = setInterval(() => {
            if (this.hasUnsavedChanges) {
                this.saveAllSettings(true); // Silent save
            }
        }, this.autoSaveInterval);
    }

    /**
     * Setup before unload warning
     */
    setupBeforeUnloadWarning() {
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'Hai modifiche non salvate. Sei sicuro di voler uscire?';
                return e.returnValue;
            }
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            this.showLoading('settingsContent', true);
            
            await Promise.all([
                this.loadSettings(),
                this.loadSettingsCategories()
            ]);
            
            this.renderSettingsInterface();
            
        } catch (error) {
            console.error('SettingsManager: Failed to load initial data:', error);
            this.showError('Errore durante il caricamento delle impostazioni');
        } finally {
            this.showLoading('settingsContent', false);
        }
    }

    /**
     * Load all settings
     */
    async loadSettings() {
        try {
            const response = await securityGuard.makeSecureRequest('/settings');
            
            if (response.success) {
                this.settings = response.data || {};
                this.originalSettings = JSON.parse(JSON.stringify(this.settings));
                
                console.info(`SettingsManager: Loaded ${Object.keys(this.settings).length} settings`);
            } else {
                throw new Error(response.error || 'Errore durante il caricamento delle impostazioni');
            }
        } catch (error) {
            console.error('SettingsManager: Failed to load settings:', error);
            this.settings = {};
            this.originalSettings = {};
            throw error;
        }
    }

    /**
     * Load settings categories
     */
    async loadSettingsCategories() {
        try {
            const response = await securityGuard.makeSecureRequest('/settings/categories');
            
            if (response.success) {
                this.categories = response.data || [];
            } else {
                // Fallback to default categories
                this.categories = this.getDefaultCategories();
            }
        } catch (error) {
            console.error('SettingsManager: Failed to load categories:', error);
            this.categories = this.getDefaultCategories();
        }
    }

    /**
     * Get default settings categories
     */
    getDefaultCategories() {
        return [
            {
                id: 'general',
                name: 'Generale',
                icon: 'fas fa-cog',
                description: 'Impostazioni generali del sito',
                settings: ['site_name', 'site_description', 'site_url', 'timezone', 'language']
            },
            {
                id: 'email',
                name: 'Email',
                icon: 'fas fa-envelope',
                description: 'Configurazione email e SMTP',
                settings: ['admin_email', 'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_encryption']
            },
            {
                id: 'security',
                name: 'Sicurezza',
                icon: 'fas fa-shield-alt',
                description: 'Impostazioni di sicurezza e autenticazione',
                settings: ['session_timeout', 'max_login_attempts', 'password_min_length', 'require_2fa', 'allowed_file_types']
            },
            {
                id: 'performance',
                name: 'Performance',
                icon: 'fas fa-tachometer-alt',
                description: 'Cache, ottimizzazioni e performance',
                settings: ['cache_enabled', 'cache_ttl', 'compression_enabled', 'cdn_enabled', 'cdn_url']
            },
            {
                id: 'maintenance',
                name: 'Manutenzione',
                icon: 'fas fa-wrench',
                description: 'Modalità manutenzione e debug',
                settings: ['maintenance_mode', 'maintenance_message', 'debug_mode', 'log_level', 'backup_frequency']
            },
            {
                id: 'integrations',
                name: 'Integrazioni',
                icon: 'fas fa-plug',
                description: 'API esterne e servizi di terze parti',
                settings: ['google_analytics_id', 'recaptcha_site_key', 'recaptcha_secret_key', 'aws_access_key', 'aws_secret_key']
            }
        ];
    }

    /**
     * Render settings interface
     */
    renderSettingsInterface() {
        const container = document.getElementById('settingsContent');
        
        container.innerHTML = `
            <!-- Settings Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3>Configurazione Sistema</h3>
                    <p class="text-muted mb-0">Gestisci le impostazioni del pannello amministrativo</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-success" id="backupSettings">
                        <i class="fas fa-download me-1"></i>Esporta
                    </button>
                    <button class="btn btn-outline-primary" id="restoreSettings">
                        <i class="fas fa-upload me-1"></i>Importa
                    </button>
                    <button class="btn btn-success" onclick="settingsManager.saveAllSettings()">
                        <i class="fas fa-save me-1"></i>Salva Tutto
                    </button>
                </div>
            </div>

            <!-- Unsaved Changes Alert -->
            <div id="unsavedChangesAlert" class="alert alert-warning d-none">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Hai modifiche non salvate
                    </div>
                    <div>
                        <button class="btn btn-sm btn-warning me-2" onclick="settingsManager.saveAllSettings()">
                            Salva Ora
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="settingsManager.discardChanges()">
                            Annulla
                        </button>
                    </div>
                </div>
            </div>

            <!-- Settings Tabs -->
            <ul class="nav nav-tabs mb-4">
                ${this.categories.map((category, index) => `
                    <li class="nav-item">
                        <a class="nav-link ${index === 0 ? 'active' : ''}" 
                           id="${category.id}-tab" 
                           data-bs-toggle="tab" 
                           href="#${category.id}Panel">
                            <i class="${category.icon} me-1"></i>${category.name}
                        </a>
                    </li>
                `).join('')}
            </ul>

            <!-- Settings Content -->
            <div class="tab-content">
                ${this.categories.map((category, index) => `
                    <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
                         id="${category.id}Panel">
                        <div class="row">
                            <div class="col-lg-8">
                                <div class="card">
                                    <div class="card-header">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 class="mb-0">
                                                    <i class="${category.icon} me-2"></i>${category.name}
                                                </h5>
                                                <small class="text-muted">${category.description}</small>
                                            </div>
                                            <div>
                                                <button class="btn btn-sm btn-outline-secondary reset-settings-btn me-2" 
                                                        data-category="${category.id}">
                                                    <i class="fas fa-undo me-1"></i>Reset
                                                </button>
                                                <button class="btn btn-sm btn-primary save-settings-btn" 
                                                        data-category="${category.id}">
                                                    <i class="fas fa-save me-1"></i>Salva
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <form class="settings-form" data-category="${category.id}">
                                            ${this.renderCategorySettings(category)}
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Informazioni</h6>
                                    </div>
                                    <div class="card-body">
                                        ${this.renderCategoryInfo(category)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Restore Settings Modal -->
            ${this.renderRestoreModal()}
        `;

        this.updateUnsavedChangesAlert();
    }

    /**
     * Render category settings form
     */
    renderCategorySettings(category) {
        if (!category.settings || category.settings.length === 0) {
            return '<p class="text-muted">Nessuna impostazione configurata per questa categoria.</p>';
        }

        return category.settings.map(settingKey => {
            const setting = this.getSettingDefinition(settingKey);
            const value = this.settings[settingKey] || setting.default || '';
            
            return this.renderSettingField(settingKey, setting, value);
        }).join('');
    }

    /**
     * Get setting definition with metadata
     */
    getSettingDefinition(key) {
        const definitions = {
            // General
            site_name: { type: 'text', label: 'Nome Sito', default: 'IT-ERA Admin', required: true },
            site_description: { type: 'textarea', label: 'Descrizione Sito', default: 'Pannello amministrativo IT-ERA' },
            site_url: { type: 'url', label: 'URL Sito', default: 'https://it-era.it', required: true },
            timezone: { type: 'select', label: 'Fuso Orario', default: 'Europe/Rome', options: this.getTimezoneOptions() },
            language: { type: 'select', label: 'Lingua', default: 'it', options: [{ value: 'it', label: 'Italiano' }, { value: 'en', label: 'English' }] },
            
            // Email
            admin_email: { type: 'email', label: 'Email Amministratore', required: true },
            smtp_host: { type: 'text', label: 'Host SMTP', default: 'smtp.gmail.com' },
            smtp_port: { type: 'number', label: 'Porta SMTP', default: 587 },
            smtp_username: { type: 'email', label: 'Username SMTP' },
            smtp_password: { type: 'password', label: 'Password SMTP' },
            smtp_encryption: { type: 'select', label: 'Crittografia', default: 'tls', options: [{ value: 'none', label: 'Nessuna' }, { value: 'ssl', label: 'SSL' }, { value: 'tls', label: 'TLS' }] },
            
            // Security
            session_timeout: { type: 'number', label: 'Timeout Sessione (minuti)', default: 30 },
            max_login_attempts: { type: 'number', label: 'Max Tentativi Login', default: 5 },
            password_min_length: { type: 'number', label: 'Lunghezza Min Password', default: 8 },
            require_2fa: { type: 'boolean', label: '2FA Obbligatorio', default: false },
            allowed_file_types: { type: 'text', label: 'Tipi File Permessi', default: 'jpg,jpeg,png,gif,pdf,doc,docx' },
            
            // Performance
            cache_enabled: { type: 'boolean', label: 'Cache Abilitata', default: true },
            cache_ttl: { type: 'number', label: 'TTL Cache (secondi)', default: 3600 },
            compression_enabled: { type: 'boolean', label: 'Compressione Abilitata', default: true },
            cdn_enabled: { type: 'boolean', label: 'CDN Abilitato', default: false },
            cdn_url: { type: 'url', label: 'URL CDN' },
            
            // Maintenance
            maintenance_mode: { type: 'boolean', label: 'Modalità Manutenzione', default: false },
            maintenance_message: { type: 'textarea', label: 'Messaggio Manutenzione', default: 'Sito in manutenzione' },
            debug_mode: { type: 'boolean', label: 'Modalità Debug', default: false },
            log_level: { type: 'select', label: 'Livello Log', default: 'info', options: [{ value: 'debug', label: 'Debug' }, { value: 'info', label: 'Info' }, { value: 'warning', label: 'Warning' }, { value: 'error', label: 'Error' }] },
            backup_frequency: { type: 'select', label: 'Frequenza Backup', default: 'daily', options: [{ value: 'hourly', label: 'Ogni ora' }, { value: 'daily', label: 'Giornaliero' }, { value: 'weekly', label: 'Settimanale' }] },
            
            // Integrations
            google_analytics_id: { type: 'text', label: 'Google Analytics ID' },
            recaptcha_site_key: { type: 'text', label: 'reCAPTCHA Site Key' },
            recaptcha_secret_key: { type: 'password', label: 'reCAPTCHA Secret Key' },
            aws_access_key: { type: 'text', label: 'AWS Access Key' },
            aws_secret_key: { type: 'password', label: 'AWS Secret Key' }
        };
        
        return definitions[key] || { type: 'text', label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };
    }

    /**
     * Render individual setting field
     */
    renderSettingField(key, setting, value) {
        const fieldId = `setting_${key}`;
        const isRequired = setting.required || this.validationRules.required.includes(key);
        const hasError = this.hasValidationError(key, value);
        
        let fieldHTML = '';
        
        switch (setting.type) {
            case 'boolean':
                fieldHTML = `
                    <div class="form-check form-switch">
                        <input type="checkbox" class="form-check-input setting-input" 
                               id="${fieldId}" name="${key}" ${value ? 'checked' : ''}>
                        <label class="form-check-label" for="${fieldId}">
                            ${setting.label} ${isRequired ? '*' : ''}
                        </label>
                    </div>
                `;
                break;
                
            case 'select':
                fieldHTML = `
                    <label class="form-label" for="${fieldId}">
                        ${setting.label} ${isRequired ? '*' : ''}
                    </label>
                    <select class="form-select setting-input ${hasError ? 'is-invalid' : ''}" 
                            id="${fieldId}" name="${key}" ${isRequired ? 'required' : ''}>
                        <option value="">Seleziona...</option>
                        ${(setting.options || []).map(opt => 
                            `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`
                        ).join('')}
                    </select>
                `;
                break;
                
            case 'textarea':
                fieldHTML = `
                    <label class="form-label" for="${fieldId}">
                        ${setting.label} ${isRequired ? '*' : ''}
                    </label>
                    <textarea class="form-control setting-input ${hasError ? 'is-invalid' : ''}" 
                              id="${fieldId}" name="${key}" rows="3" 
                              ${isRequired ? 'required' : ''}>${this.escapeHtml(value)}</textarea>
                `;
                break;
                
            case 'password':
                fieldHTML = `
                    <label class="form-label" for="${fieldId}">
                        ${setting.label} ${isRequired ? '*' : ''}
                    </label>
                    <div class="input-group">
                        <input type="password" class="form-control setting-input ${hasError ? 'is-invalid' : ''}" 
                               id="${fieldId}" name="${key}" value="${this.escapeHtml(value)}" 
                               ${isRequired ? 'required' : ''}>
                        <button class="btn btn-outline-secondary" type="button" 
                                onclick="settingsManager.togglePasswordVisibility('${fieldId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                `;
                break;
                
            default:
                fieldHTML = `
                    <label class="form-label" for="${fieldId}">
                        ${setting.label} ${isRequired ? '*' : ''}
                    </label>
                    <input type="${setting.type}" class="form-control setting-input ${hasError ? 'is-invalid' : ''}" 
                           id="${fieldId}" name="${key}" value="${this.escapeHtml(value)}" 
                           ${isRequired ? 'required' : ''}
                           ${setting.type === 'number' && setting.min ? `min="${setting.min}"` : ''}
                           ${setting.type === 'number' && setting.max ? `max="${setting.max}"` : ''}>
                `;
                break;
        }
        
        const helpText = setting.help ? `<small class="form-text text-muted">${setting.help}</small>` : '';
        const errorText = hasError ? `<div class="invalid-feedback">Valore non valido</div>` : '';
        
        return `
            <div class="mb-3">
                ${fieldHTML}
                ${helpText}
                ${errorText}
            </div>
        `;
    }

    /**
     * Render category information
     */
    renderCategoryInfo(category) {
        const categoryInfo = {
            general: `
                <p>Configura le informazioni base del sito e le impostazioni regionali.</p>
                <h6>Suggerimenti:</h6>
                <ul class="small">
                    <li>Il nome del sito apparirà nel titolo delle pagine</li>
                    <li>L'URL deve includere il protocollo (http/https)</li>
                    <li>Il fuso orario influenza la visualizzazione delle date</li>
                </ul>
            `,
            email: `
                <p>Configura il sistema di invio email per notifiche e comunicazioni.</p>
                <div class="mb-3">
                    <button class="btn btn-sm btn-outline-primary w-100" id="testEmailSettings">
                        <i class="fas fa-paper-plane me-1"></i>Test Email
                    </button>
                </div>
                <h6>SMTP Comuni:</h6>
                <ul class="small">
                    <li><strong>Gmail:</strong> smtp.gmail.com:587 (TLS)</li>
                    <li><strong>Outlook:</strong> smtp-mail.outlook.com:587 (TLS)</li>
                    <li><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (TLS)</li>
                </ul>
            `,
            security: `
                <p>Configura le impostazioni di sicurezza per proteggere il sistema.</p>
                <h6>Raccomandazioni:</h6>
                <ul class="small">
                    <li>Password minima di 8 caratteri</li>
                    <li>Abilita 2FA per maggiore sicurezza</li>
                    <li>Limita i tipi di file caricabili</li>
                    <li>Timeout sessione non superiore a 60 minuti</li>
                </ul>
            `,
            performance: `
                <p>Ottimizza le performance del sistema attraverso cache e CDN.</p>
                <h6>Suggerimenti:</h6>
                <ul class="small">
                    <li>Abilita la cache per migliorare i tempi di risposta</li>
                    <li>Usa compressione per ridurre il traffico</li>
                    <li>Configura un CDN per file statici</li>
                </ul>
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="fas fa-info-circle"></i>
                        Le modifiche alla cache richiedono il riavvio del sistema
                    </small>
                </div>
            `,
            maintenance: `
                <p>Gestisci la modalità manutenzione e il debug del sistema.</p>
                <div class="alert alert-warning alert-sm">
                    <i class="fas fa-exclamation-triangle"></i>
                    <small>La modalità manutenzione impedirà l'accesso agli utenti normali</small>
                </div>
                <h6>Livelli Log:</h6>
                <ul class="small">
                    <li><strong>Debug:</strong> Tutte le informazioni</li>
                    <li><strong>Info:</strong> Informazioni generali</li>
                    <li><strong>Warning:</strong> Solo avvisi ed errori</li>
                    <li><strong>Error:</strong> Solo errori critici</li>
                </ul>
            `,
            integrations: `
                <p>Configura l'integrazione con servizi esterni e API.</p>
                <h6>Servizi Disponibili:</h6>
                <ul class="small">
                    <li><strong>Google Analytics:</strong> Tracking visite</li>
                    <li><strong>reCAPTCHA:</strong> Protezione anti-spam</li>
                    <li><strong>AWS:</strong> Storage cloud</li>
                </ul>
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="fas fa-key"></i>
                        Le chiavi API vengono crittografate nel database
                    </small>
                </div>
            `
        };
        
        return categoryInfo[category.id] || '<p>Informazioni non disponibili per questa categoria.</p>';
    }

    /**
     * Get timezone options
     */
    getTimezoneOptions() {
        return [
            { value: 'Europe/Rome', label: 'Europa/Roma' },
            { value: 'Europe/London', label: 'Europa/Londra' },
            { value: 'Europe/Paris', label: 'Europa/Parigi' },
            { value: 'America/New_York', label: 'America/New York' },
            { value: 'America/Los_Angeles', label: 'America/Los Angeles' },
            { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
            { value: 'UTC', label: 'UTC' }
        ];
    }

    /**
     * Render restore modal
     */
    renderRestoreModal() {
        return `
            <div class="modal fade" id="restoreModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Ripristina Impostazioni</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Seleziona file di backup</label>
                                <input type="file" class="form-control" id="settingsFileInput" 
                                       accept=".json" required>
                                <small class="form-text text-muted">
                                    Seleziona un file JSON esportato in precedenza
                                </small>
                            </div>
                            
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>Attenzione:</strong> Questa operazione sovrascriverà tutte le impostazioni attuali.
                            </div>
                            
                            <div id="restorePreview" class="d-none">
                                <h6>Anteprima Ripristino:</h6>
                                <div id="restorePreviewContent" class="small bg-light p-3 rounded"></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="confirmRestore" disabled>
                                Ripristina Impostazioni
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Handle setting change
     */
    handleSettingChange(input) {
        const key = input.name;
        let value;
        
        if (input.type === 'checkbox') {
            value = input.checked;
        } else {
            value = input.value;
        }
        
        // Update settings
        this.settings[key] = value;
        
        // Validate setting
        this.validateSetting(key, value, input);
        
        // Mark as changed
        this.hasUnsavedChanges = true;
        this.updateUnsavedChangesAlert();
        
        // Real-time validation feedback
        this.updateFieldValidation(input, key, value);
    }

    /**
     * Validate individual setting
     */
    validateSetting(key, value, inputElement) {
        const errors = [];
        
        // Required validation
        if (this.validationRules.required.includes(key) && !value) {
            errors.push('Campo obbligatorio');
        }
        
        // Email validation
        if (this.validationRules.email.includes(key) && value && !this.isValidEmail(value)) {
            errors.push('Email non valida');
        }
        
        // URL validation
        if (this.validationRules.url.includes(key) && value && !this.isValidURL(value)) {
            errors.push('URL non valido');
        }
        
        // Number validation
        if (this.validationRules.number.includes(key) && value && isNaN(value)) {
            errors.push('Deve essere un numero');
        }
        
        // Update field state
        if (inputElement) {
            inputElement.classList.toggle('is-invalid', errors.length > 0);
            inputElement.classList.toggle('is-valid', errors.length === 0 && value);
        }
        
        return errors;
    }

    /**
     * Check if setting has validation error
     */
    hasValidationError(key, value) {
        return this.validateSetting(key, value).length > 0;
    }

    /**
     * Update field validation styling
     */
    updateFieldValidation(input, key, value) {
        const errors = this.validateSetting(key, value, input);
        
        // Update field classes
        input.classList.remove('is-valid', 'is-invalid');
        if (errors.length > 0) {
            input.classList.add('is-invalid');
        } else if (value) {
            input.classList.add('is-valid');
        }
        
        // Update error message
        let errorElement = input.parentNode.querySelector('.invalid-feedback');
        if (!errorElement && errors.length > 0) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            input.parentNode.appendChild(errorElement);
        }
        
        if (errorElement) {
            errorElement.textContent = errors[0] || '';
            errorElement.style.display = errors.length > 0 ? 'block' : 'none';
        }
    }

    /**
     * Save settings for specific category
     */
    async saveSettings(category, silent = false) {
        try {
            if (!silent) {
                this.showLoading('settingsContent', true);
            }
            
            // Get settings for this category
            const categoryObj = this.categories.find(cat => cat.id === category);
            if (!categoryObj) {
                throw new Error('Categoria non trovata');
            }
            
            const categorySettings = {};
            categoryObj.settings.forEach(key => {
                if (this.settings.hasOwnProperty(key)) {
                    categorySettings[key] = this.settings[key];
                }
            });
            
            const response = await securityGuard.makeSecureRequest('/settings', {
                method: 'PUT',
                body: JSON.stringify({
                    category: category,
                    settings: categorySettings
                })
            });
            
            if (response.success) {
                // Update original settings
                Object.assign(this.originalSettings, categorySettings);
                
                // Check if we still have unsaved changes
                this.checkUnsavedChanges();
                
                if (!silent) {
                    this.showSuccess(`Impostazioni ${categoryObj.name} salvate con successo`);
                }
            } else {
                throw new Error(response.error || 'Errore durante il salvataggio');
            }
            
        } catch (error) {
            console.error('SettingsManager: Save failed:', error);
            if (!silent) {
                this.showError(error.message);
            }
        } finally {
            if (!silent) {
                this.showLoading('settingsContent', false);
            }
        }
    }

    /**
     * Save all settings
     */
    async saveAllSettings(silent = false) {
        try {
            if (!silent) {
                this.showLoading('settingsContent', true);
            }
            
            const response = await securityGuard.makeSecureRequest('/settings', {
                method: 'PUT',
                body: JSON.stringify({
                    settings: this.settings
                })
            });
            
            if (response.success) {
                this.originalSettings = JSON.parse(JSON.stringify(this.settings));
                this.hasUnsavedChanges = false;
                this.updateUnsavedChangesAlert();
                
                if (!silent) {
                    this.showSuccess('Tutte le impostazioni salvate con successo');
                }
            } else {
                throw new Error(response.error || 'Errore durante il salvataggio');
            }
            
        } catch (error) {
            console.error('SettingsManager: Save all failed:', error);
            if (!silent) {
                this.showError(error.message);
            }
        } finally {
            if (!silent) {
                this.showLoading('settingsContent', false);
            }
        }
    }

    /**
     * Reset settings for specific category
     */
    async resetSettings(category) {
        if (!confirm('Sei sicuro di voler ripristinare le impostazioni originali per questa categoria?')) {
            return;
        }
        
        try {
            const categoryObj = this.categories.find(cat => cat.id === category);
            if (!categoryObj) {
                throw new Error('Categoria non trovata');
            }
            
            // Reset to original values
            categoryObj.settings.forEach(key => {
                if (this.originalSettings.hasOwnProperty(key)) {
                    this.settings[key] = this.originalSettings[key];
                    
                    // Update form field
                    const field = document.querySelector(`[name="${key}"]`);
                    if (field) {
                        if (field.type === 'checkbox') {
                            field.checked = this.settings[key];
                        } else {
                            field.value = this.settings[key] || '';
                        }
                        
                        // Clear validation classes
                        field.classList.remove('is-valid', 'is-invalid');
                    }
                }
            });
            
            this.checkUnsavedChanges();
            this.showSuccess(`Impostazioni ${categoryObj.name} ripristinate`);
            
        } catch (error) {
            console.error('SettingsManager: Reset failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Check for unsaved changes
     */
    checkUnsavedChanges() {
        this.hasUnsavedChanges = JSON.stringify(this.settings) !== JSON.stringify(this.originalSettings);
        this.updateUnsavedChangesAlert();
    }

    /**
     * Update unsaved changes alert
     */
    updateUnsavedChangesAlert() {
        const alert = document.getElementById('unsavedChangesAlert');
        if (alert) {
            alert.classList.toggle('d-none', !this.hasUnsavedChanges);
        }
    }

    /**
     * Discard all changes
     */
    discardChanges() {
        if (confirm('Sei sicuro di voler annullare tutte le modifiche non salvate?')) {
            this.settings = JSON.parse(JSON.stringify(this.originalSettings));
            this.hasUnsavedChanges = false;
            this.renderSettingsInterface();
            this.showSuccess('Modifiche annullate');
        }
    }

    /**
     * Export settings
     */
    async exportSettings() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                settings: this.settings
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `it-era-settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showSuccess('Impostazioni esportate con successo');
            
        } catch (error) {
            console.error('SettingsManager: Export failed:', error);
            this.showError('Errore durante l\'esportazione');
        }
    }

    /**
     * Show restore modal
     */
    showRestoreModal() {
        const modal = new bootstrap.Modal(document.getElementById('restoreModal'));
        modal.show();
    }

    /**
     * Handle restore file selection
     */
    handleRestoreFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.settings) {
                    throw new Error('File non valido: mancano le impostazioni');
                }
                
                // Show preview
                this.showRestorePreview(data);
                
                // Enable confirm button
                document.getElementById('confirmRestore').disabled = false;
                document.getElementById('confirmRestore').onclick = () => {
                    this.confirmRestore(data.settings);
                };
                
            } catch (error) {
                console.error('SettingsManager: Invalid restore file:', error);
                this.showError('File di backup non valido');
            }
        };
        
        reader.readAsText(file);
    }

    /**
     * Show restore preview
     */
    showRestorePreview(data) {
        const preview = document.getElementById('restorePreview');
        const content = document.getElementById('restorePreviewContent');
        
        const settingsCount = Object.keys(data.settings).length;
        const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString('it-IT') : 'Sconosciuta';
        
        content.innerHTML = `
            <strong>Data backup:</strong> ${timestamp}<br>
            <strong>Impostazioni:</strong> ${settingsCount}<br>
            <strong>Versione:</strong> ${data.version || 'Non specificata'}<br><br>
            <strong>Impostazioni che saranno ripristinate:</strong><br>
            ${Object.keys(data.settings).slice(0, 10).join(', ')}${settingsCount > 10 ? '...' : ''}
        `;
        
        preview.classList.remove('d-none');
    }

    /**
     * Confirm restore
     */
    async confirmRestore(settingsData) {
        try {
            const response = await securityGuard.makeSecureRequest('/settings', {
                method: 'PUT',
                body: JSON.stringify({
                    settings: settingsData,
                    restore: true
                })
            });
            
            if (response.success) {
                this.settings = { ...settingsData };
                this.originalSettings = JSON.parse(JSON.stringify(this.settings));
                this.hasUnsavedChanges = false;
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('restoreModal'));
                modal.hide();
                
                // Re-render interface
                this.renderSettingsInterface();
                
                this.showSuccess('Impostazioni ripristinate con successo');
            } else {
                throw new Error(response.error || 'Errore durante il ripristino');
            }
            
        } catch (error) {
            console.error('SettingsManager: Restore failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Test email settings
     */
    async testEmailSettings() {
        try {
            const emailSettings = {
                smtp_host: this.settings.smtp_host,
                smtp_port: this.settings.smtp_port,
                smtp_username: this.settings.smtp_username,
                smtp_password: this.settings.smtp_password,
                smtp_encryption: this.settings.smtp_encryption,
                admin_email: this.settings.admin_email
            };
            
            this.showLoading('testEmailSettings', true);
            
            const response = await securityGuard.makeSecureRequest('/settings/test-email', {
                method: 'POST',
                body: JSON.stringify(emailSettings)
            });
            
            if (response.success) {
                this.showSuccess('Email di test inviata con successo!');
            } else {
                throw new Error(response.error || 'Test email fallito');
            }
            
        } catch (error) {
            console.error('SettingsManager: Email test failed:', error);
            this.showError(`Test email fallito: ${error.message}`);
        } finally {
            this.showLoading('testEmailSettings', false);
        }
    }

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility(fieldId) {
        const field = document.getElementById(fieldId);
        const button = field.nextElementSibling;
        const icon = button.querySelector('i');
        
        if (field.type === 'password') {
            field.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            field.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    /**
     * Validation helpers
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Utility functions
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(elementId, show) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (show) {
            if (element.tagName === 'BUTTON') {
                element.disabled = true;
                element.innerHTML = '<div class="spinner-border spinner-border-sm me-2" role="status"></div>Loading...';
            } else {
                element.style.position = 'relative';
                const overlay = document.createElement('div');
                overlay.className = 'loading-overlay';
                overlay.innerHTML = `
                    <div class="text-center">
                        <div class="spinner-border mb-3" role="status"></div>
                        <div>Caricamento...</div>
                    </div>
                `;
                element.appendChild(overlay);
            }
        } else {
            if (element.tagName === 'BUTTON') {
                element.disabled = false;
                element.innerHTML = element.dataset.originalText || element.innerHTML;
            } else {
                const overlay = element.querySelector('.loading-overlay');
                if (overlay) {
                    overlay.remove();
                }
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
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
    }
}

// Global settings manager instance
const settingsManager = new SettingsManager();

// Export for use in other modules
window.settingsManager = settingsManager;

console.info('SettingsManager: Settings management system initialized successfully');