/**
 * IT-ERA Admin Panel - Enhanced Notification Manager
 * 
 * Provides comprehensive feedback system with loading states,
 * error handling, and user-friendly notifications.
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.loadingStates = new Map();
        this.init();
    }

    /**
     * Initialize notification system
     */
    init() {
        this.createNotificationContainer();
        this.setupGlobalErrorHandler();
        console.info('NotificationManager: Notification system initialized');
    }

    /**
     * Create notification container
     */
    createNotificationContainer() {
        let container = document.getElementById('notificationContainer');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '10000';
            container.style.maxWidth = '400px';
            document.body.appendChild(container);
        }

        return container;
    }

    /**
     * Setup global error handler for unhandled promises
     */
    setupGlobalErrorHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // Show user-friendly error for unhandled API errors
            if (event.reason && event.reason.message) {
                this.showError(
                    'Si è verificato un errore imprevisto. Riprova o contatta il supporto.',
                    { duration: 8000 }
                );
            }
        });

        // Handle global JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('Global JavaScript error:', event.error);
            
            // Don't show notifications for script loading errors
            if (!event.filename || event.filename.includes('.js')) {
                return;
            }
            
            this.showError(
                'Si è verificato un errore nell\'interfaccia. Ricarica la pagina.',
                { duration: 10000 }
            );
        });
    }

    /**
     * Show success notification
     */
    showSuccess(message, options = {}) {
        return this.showNotification(message, 'success', options);
    }

    /**
     * Show error notification
     */
    showError(message, options = {}) {
        return this.showNotification(message, 'danger', {
            duration: 8000,
            persistent: false,
            ...options
        });
    }

    /**
     * Show warning notification
     */
    showWarning(message, options = {}) {
        return this.showNotification(message, 'warning', options);
    }

    /**
     * Show info notification
     */
    showInfo(message, options = {}) {
        return this.showNotification(message, 'info', options);
    }

    /**
     * Show notification with full customization
     */
    showNotification(message, type = 'info', options = {}) {
        const config = {
            duration: 5000,
            persistent: false,
            showProgress: true,
            allowHtml: false,
            icon: this.getTypeIcon(type),
            ...options
        };

        const notification = this.createNotificationElement(message, type, config);
        const container = this.createNotificationContainer();
        
        // Add notification with animation
        container.appendChild(notification);
        notification.classList.add('show');

        // Store notification reference
        const notificationId = Date.now().toString();
        this.notifications.push({ id: notificationId, element: notification });

        // Auto-remove if not persistent
        if (!config.persistent && config.duration > 0) {
            const progressBar = notification.querySelector('.progress-bar');
            
            if (progressBar && config.showProgress) {
                // Animate progress bar
                progressBar.style.transition = `width ${config.duration}ms linear`;
                setTimeout(() => {
                    progressBar.style.width = '0%';
                }, 100);
            }

            setTimeout(() => {
                this.removeNotification(notificationId);
            }, config.duration);
        }

        return notificationId;
    }

    /**
     * Create notification DOM element
     */
    createNotificationElement(message, type, config) {
        const notification = document.createElement('div');
        notification.className = `toast align-items-center text-white bg-${type} border-0 mb-2`;
        notification.setAttribute('role', 'alert');

        const progressBar = config.showProgress && !config.persistent ? 
            `<div class="progress position-absolute bottom-0 start-0 w-100" style="height: 3px;">
                <div class="progress-bar bg-white opacity-50" style="width: 100%;"></div>
            </div>` : '';

        notification.innerHTML = `
            <div class="d-flex position-relative">
                <div class="toast-body d-flex align-items-center">
                    ${config.icon ? `<i class="${config.icon} me-2"></i>` : ''}
                    <div class="flex-grow-1">
                        ${config.allowHtml ? message : this.escapeHtml(message)}
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Close"></button>
                ${progressBar}
            </div>
        `;

        // Setup close button
        const closeBtn = notification.querySelector('.btn-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        });

        return notification;
    }

    /**
     * Remove notification by ID
     */
    removeNotification(notificationId) {
        const notificationIndex = this.notifications.findIndex(n => n.id === notificationId);
        
        if (notificationIndex > -1) {
            const notification = this.notifications[notificationIndex];
            
            if (notification.element && notification.element.parentNode) {
                notification.element.classList.remove('show');
                
                setTimeout(() => {
                    if (notification.element.parentNode) {
                        notification.element.remove();
                    }
                }, 300);
            }
            
            this.notifications.splice(notificationIndex, 1);
        }
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications.forEach(notification => {
            if (notification.element && notification.element.parentNode) {
                notification.element.remove();
            }
        });
        
        this.notifications = [];
    }

    /**
     * Show loading state for an element or globally
     */
    showLoading(elementId = null, message = 'Caricamento...') {
        const loadingId = elementId || 'global';
        
        if (this.loadingStates.has(loadingId)) {
            return; // Already showing loading
        }

        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                this.showElementLoading(element, message);
                this.loadingStates.set(loadingId, { type: 'element', element });
            }
        } else {
            this.showGlobalLoading(message);
            this.loadingStates.set(loadingId, { type: 'global' });
        }
    }

    /**
     * Hide loading state
     */
    hideLoading(elementId = null) {
        const loadingId = elementId || 'global';
        const loadingState = this.loadingStates.get(loadingId);
        
        if (!loadingState) {
            return; // Not showing loading
        }

        if (loadingState.type === 'element' && loadingState.element) {
            this.hideElementLoading(loadingState.element);
        } else if (loadingState.type === 'global') {
            this.hideGlobalLoading();
        }
        
        this.loadingStates.delete(loadingId);
    }

    /**
     * Show loading overlay on specific element
     */
    showElementLoading(element, message) {
        // Remove existing overlay
        const existingOverlay = element.querySelector('.loading-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75';
        overlay.style.zIndex = '1000';

        overlay.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary mb-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="small text-muted">${this.escapeHtml(message)}</div>
            </div>
        `;

        // Make element relative if needed
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(overlay);
    }

    /**
     * Hide loading overlay from element
     */
    hideElementLoading(element) {
        const overlay = element.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Show global loading overlay
     */
    showGlobalLoading(message) {
        let overlay = document.getElementById('globalLoadingOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'globalLoadingOverlay';
            overlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50';
            overlay.style.zIndex = '10000';

            overlay.innerHTML = `
                <div class="text-center text-white">
                    <div class="spinner-border mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div id="globalLoadingMessage">${this.escapeHtml(message)}</div>
                </div>
            `;

            document.body.appendChild(overlay);
        } else {
            document.getElementById('globalLoadingMessage').textContent = message;
        }
    }

    /**
     * Hide global loading overlay
     */
    hideGlobalLoading() {
        const overlay = document.getElementById('globalLoadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Show confirmation dialog
     */
    showConfirmation(message, title = 'Conferma', options = {}) {
        return new Promise((resolve) => {
            const config = {
                confirmText: 'Conferma',
                cancelText: 'Annulla',
                confirmClass: 'btn-primary',
                cancelClass: 'btn-secondary',
                ...options
            };

            // Create modal
            const modalId = 'confirmationModal_' + Date.now();
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = modalId;
            modal.setAttribute('tabindex', '-1');

            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${this.escapeHtml(title)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${this.escapeHtml(message)}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn ${config.cancelClass}" data-bs-dismiss="modal">
                                ${this.escapeHtml(config.cancelText)}
                            </button>
                            <button type="button" class="btn ${config.confirmClass}" id="confirmBtn_${modalId}">
                                ${this.escapeHtml(config.confirmText)}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Setup event handlers
            const confirmBtn = document.getElementById(`confirmBtn_${modalId}`);
            const bootstrapModal = new bootstrap.Modal(modal);

            confirmBtn.addEventListener('click', () => {
                bootstrapModal.hide();
                resolve(true);
            });

            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                resolve(false);
            });

            bootstrapModal.show();
        });
    }

    /**
     * Get icon for notification type
     */
    getTypeIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            danger: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };

        return icons[type] || icons.info;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Handle API errors with user-friendly messages
     */
    handleApiError(error, context = '') {
        console.error(`API Error${context ? ` (${context})` : ''}:`, error);

        let message = 'Si è verificato un errore imprevisto';
        let showDetails = false;

        if (error && typeof error === 'object') {
            if (error.message) {
                if (error.message.includes('Authentication required')) {
                    message = 'Sessione scaduta. Effettua nuovamente il login.';
                } else if (error.message.includes('Accesso non autorizzato')) {
                    message = 'Non hai i permessi necessari per questa operazione.';
                } else if (error.message.includes('connessione')) {
                    message = 'Errore di connessione. Controlla la tua connessione internet.';
                } else if (error.message.includes('timeout')) {
                    message = 'Il server non risponde. Riprova più tardi.';
                } else {
                    message = error.message;
                    showDetails = true;
                }
            }
        } else if (typeof error === 'string') {
            message = error;
        }

        this.showError(message, {
            duration: showDetails ? 10000 : 6000
        });

        return message;
    }
}

// Global notification manager instance
const notificationManager = new NotificationManager();

// Global helper functions for backward compatibility
function showNotification(message, type = 'info', duration = 5000) {
    return notificationManager.showNotification(message, type, { duration });
}

function showSuccess(message) {
    return notificationManager.showSuccess(message);
}

function showError(message) {
    return notificationManager.showError(message);
}

function showWarning(message) {
    return notificationManager.showWarning(message);
}

function showInfo(message) {
    return notificationManager.showInfo(message);
}

function showLoading(elementId, message) {
    return notificationManager.showLoading(elementId, message);
}

function hideLoading(elementId) {
    return notificationManager.hideLoading(elementId);
}

// Export for use in other modules
window.notificationManager = notificationManager;

console.info('NotificationManager: Enhanced notification system initialized');