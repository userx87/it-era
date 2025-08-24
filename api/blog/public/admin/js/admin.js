// Main Admin Panel Controller
let currentEditor = null;
let currentView = 'dashboard';

// Initialize admin panel
async function initializeAdmin() {
    // Check authentication
    const isAuthenticated = await authManager.checkAuth();
    
    if (!isAuthenticated) {
        authManager.showLoginModal();
        return;
    }

    // Load initial view
    await loadDashboard();
    
    // Set up navigation
    setupNavigation();
    
    // Set up periodic updates
    setupPeriodicUpdates();
    
    console.log('IT-ERA Blog Admin Panel initialized successfully');
}

// Setup navigation
function setupNavigation() {
    // Update navigation active states
    document.addEventListener('click', (e) => {
        if (e.target.closest('.nav-link')) {
            const navLinks = document.querySelectorAll('.sidebar .nav-link');
            navLinks.forEach(link => link.classList.remove('active'));
            e.target.closest('.nav-link').classList.add('active');
        }
    });
}

// Setup periodic updates
function setupPeriodicUpdates() {
    // Update post counts every 30 seconds
    setInterval(updatePostCounts, 30000);
    
    // Check for new notifications every minute
    setInterval(checkNotifications, 60000);
}

// Update post counts in sidebar
async function updatePostCounts() {
    try {
        const response = await apiManager.getPosts({ limit: 1 });
        const totalPosts = response.data.pagination.total;
        
        document.getElementById('postCount').textContent = totalPosts;
    } catch (error) {
        console.error('Failed to update post counts:', error);
    }
}

// Check for notifications
async function checkNotifications() {
    // This could check for scheduled posts, webhook failures, etc.
    try {
        const scheduledPosts = await apiManager.getScheduledPosts();
        
        // Check for posts that should have been published
        const now = new Date();
        const overduePosts = scheduledPosts.data.scheduled_posts.filter(post => {
            return new Date(post.scheduled_for) < now;
        });
        
        if (overduePosts.length > 0) {
            showNotification(`${overduePosts.length} post programmati sono in ritardo`, 'warning');
        }
    } catch (error) {
        console.error('Failed to check notifications:', error);
    }
}

// Navigation functions
async function loadDashboard() {
    currentView = 'dashboard';
    showLoading();
    
    try {
        const dashboardData = await apiManager.getDashboard();
        renderDashboard(dashboardData.data);
    } catch (error) {
        handleAPIError(error, 'Errore caricamento dashboard');
    } finally {
        hideLoading();
    }
}

async function loadPosts() {
    currentView = 'posts';
    showLoading();
    
    try {
        const postsData = await apiManager.getPosts({ limit: 20 });
        renderPostsList(postsData.data);
    } catch (error) {
        handleAPIError(error, 'Errore caricamento post');
    } finally {
        hideLoading();
    }
}

async function loadCategories() {
    currentView = 'categories';
    showLoading();
    
    try {
        const categoriesData = await apiManager.getCategories({ include_inactive: true, include_stats: true });
        renderCategoriesList(categoriesData.data);
    } catch (error) {
        handleAPIError(error, 'Errore caricamento categorie');
    } finally {
        hideLoading();
    }
}

async function loadTags() {
    currentView = 'tags';
    showLoading();
    
    try {
        const tagsData = await apiManager.getTags({ include_stats: true });
        renderTagsList(tagsData.data);
    } catch (error) {
        handleAPIError(error, 'Errore caricamento tag');
    } finally {
        hideLoading();
    }
}

async function loadMedia() {
    currentView = 'media';
    showLoading();
    
    try {
        const mediaData = await apiManager.getMedia({ limit: 50 });
        renderMediaLibrary(mediaData.data);
    } catch (error) {
        handleAPIError(error, 'Errore caricamento media');
    } finally {
        hideLoading();
    }
}

async function loadAnalytics() {
    currentView = 'analytics';
    showLoading();
    
    try {
        const analyticsData = await apiManager.getAnalyticsDashboard();
        renderAnalyticsDashboard(analyticsData.data);
    } catch (error) {
        handleAPIError(error, 'Errore caricamento analytics');
    } finally {
        hideLoading();
    }
}

async function loadCalendar() {
    currentView = 'calendar';
    showLoading();
    
    try {
        const now = new Date();
        const calendarData = await apiManager.getContentCalendar(now.getFullYear(), now.getMonth() + 1);
        renderContentCalendar(calendarData.data);
    } catch (error) {
        handleAPIError(error, 'Errore caricamento calendario');
    } finally {
        hideLoading();
    }
}

async function loadWebhooks() {
    currentView = 'webhooks';
    showLoading();
    
    try {
        const webhooksData = await apiManager.getWebhookLogs({ limit: 50 });
        renderWebhooksList(webhooksData.data);
    } catch (error) {
        handleAPIError(error, 'Errore caricamento webhooks');
    } finally {
        hideLoading();
    }
}

async function loadUsers() {
    if (authManager.user.role !== 'admin') {
        showNotification('Accesso negato: solo gli amministratori possono gestire gli utenti', 'error');
        return;
    }
    
    currentView = 'users';
    showLoading();
    
    try {
        const usersData = await apiManager.getUsers();
        renderUsersList(usersData.data);
    } catch (error) {
        handleAPIError(error, 'Errore caricamento utenti');
    } finally {
        hideLoading();
    }
}

async function loadSettings() {
    if (authManager.user.role !== 'admin') {
        showNotification('Accesso negato: solo gli amministratori possono modificare le impostazioni', 'error');
        return;
    }
    
    currentView = 'settings';
    showLoading();
    
    try {
        const settingsData = await apiManager.getSettings();
        renderSettingsPanel(settingsData.data);
    } catch (error) {
        handleAPIError(error, 'Errore caricamento impostazioni');
    } finally {
        hideLoading();
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after timeout
    const timeout = type === 'error' ? CONFIG.NOTIFICATIONS.ERROR_TIMEOUT : 
                   type === 'success' ? CONFIG.NOTIFICATIONS.SUCCESS_TIMEOUT : 
                   CONFIG.NOTIFICATIONS.DEFAULT_TIMEOUT;
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, timeout);
}

function showModal(title, body, buttons = []) {
    const modal = document.getElementById('genericModal');
    
    document.getElementById('genericModalTitle').textContent = title;
    document.getElementById('genericModalBody').innerHTML = body;
    
    const footer = document.getElementById('genericModalFooter');
    footer.innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>';
    
    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn ${button.class || 'btn-primary'}`;
        btn.textContent = button.text;
        btn.onclick = button.onclick ? new Function(button.onclick) : null;
        footer.appendChild(btn);
    });
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    return modalInstance;
}

function hideModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('genericModal'));
    if (modal) {
        modal.hide();
    }
}

function formatDate(dateString, includeTime = false) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return date.toLocaleDateString(CONFIG.DATE_LOCALE, options);
}

function formatNumber(number) {
    if (number === null || number === undefined) return '0';
    return new Intl.NumberFormat(CONFIG.DATE_LOCALE).format(number);
}

function getServiceBadge(serviceCategory) {
    if (!serviceCategory) return '';
    
    const service = CONFIG.SERVICES[serviceCategory];
    if (!service) return serviceCategory;
    
    return `<span class="badge service-${serviceCategory}">${service.name}</span>`;
}

function getStatusBadge(status) {
    const statusConfig = CONFIG.POST_STATUSES[status];
    if (!statusConfig) return status;
    
    return `<span class="badge ${statusConfig.class}"><i class="${statusConfig.icon} me-1"></i>${statusConfig.name}</span>`;
}

function getUserRoleBadge(role) {
    const roleConfig = CONFIG.USER_ROLES[role];
    if (!roleConfig) return role;
    
    return `<span class="badge" style="background-color: ${roleConfig.color}; color: white;">${roleConfig.name}</span>`;
}

// Editor utilities
function initializeEditor(elementId, initialContent = '') {
    if (currentEditor) {
        currentEditor.destroy();
        currentEditor = null;
    }

    ClassicEditor
        .create(document.querySelector(`#${elementId}`), CONFIG.EDITOR_CONFIG)
        .then(editor => {
            currentEditor = editor;
            if (initialContent) {
                editor.setData(initialContent);
            }
            return editor;
        })
        .catch(error => {
            console.error('Editor initialization error:', error);
            showNotification('Errore inizializzazione editor', 'error');
        });
}

function getEditorContent() {
    return currentEditor ? currentEditor.getData() : '';
}

function setEditorContent(content) {
    if (currentEditor) {
        currentEditor.setData(content);
    }
}

// Search and filter utilities
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// File upload utilities
function handleFileUpload(files, callback) {
    const validFiles = [];
    const errors = [];
    
    Array.from(files).forEach(file => {
        if (file.size > CONFIG.UPLOAD.MAX_FILE_SIZE) {
            errors.push(`${file.name}: File troppo grande (max ${CONFIG.UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB)`);
        } else if (!CONFIG.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
            errors.push(`${file.name}: Tipo file non supportato`);
        } else {
            validFiles.push(file);
        }
    });
    
    if (errors.length > 0) {
        showNotification(errors.join('<br>'), 'error');
    }
    
    if (validFiles.length > 0) {
        callback(validFiles);
    }
}

// Export utilities
function downloadCSV(data, filename) {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+S or Cmd+S to save current form
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        
        const activeModal = document.querySelector('.modal.show');
        if (activeModal) {
            const saveButton = activeModal.querySelector('.btn-primary');
            if (saveButton && saveButton.onclick) {
                saveButton.click();
            }
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const activeModal = bootstrap.Modal.getInstance(document.querySelector('.modal.show'));
        if (activeModal) {
            activeModal.hide();
        }
    }
});