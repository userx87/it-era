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
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) {
        console.error('Main content area not found');
        return;
    }
    
    showLoading();
    
    try {
        // Show loading state
        mainContent.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        
        // Try to load dashboard data
        const dashboardData = await apiManager.getDashboard();
        
        if (dashboardData && dashboardData.data) {
            renderDashboard(dashboardData.data);
        } else {
            // Fallback dashboard when API is not available
            renderFallbackDashboard();
        }
    } catch (error) {
        console.warn('API not available, showing fallback dashboard:', error.message);
        renderFallbackDashboard();
    } finally {
        hideLoading();
    }
}

// Fallback dashboard for when API is not available
function renderFallbackDashboard() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row">
                <div class="col-12">
                    <h1 class="h3 mb-4"><i class="bi bi-speedometer2 me-2"></i>Dashboard IT-ERA</h1>
                </div>
            </div>
            
            <div class="row g-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 class="mb-0">--</h4>
                                    <p class="mb-0">Post Totali</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-file-text" style="font-size: 2rem;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 class="mb-0">--</h4>
                                    <p class="mb-0">Pubblicati</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-check-circle" style="font-size: 2rem;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 class="mb-0">--</h4>
                                    <p class="mb-0">Programmati</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-clock" style="font-size: 2rem;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 class="mb-0">--</h4>
                                    <p class="mb-0">Visualizzazioni</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-eye" style="font-size: 2rem;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="bi bi-info-circle me-2"></i>Sistema IT-ERA Blog</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info">
                                <h6><i class="bi bi-tools me-2"></i>Sistema in Configurazione</h6>
                                <p class="mb-0">Il pannello di amministrazione è attivo e funzionante. Le statistiche complete saranno disponibili una volta configurata l'API del blog.</p>
                            </div>
                            
                            <h6 class="mt-3">Funzionalità Disponibili:</h6>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i>Gestione Post e Categorie</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Sistema di Autenticazione</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Interfaccia Amministrativa</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Media Library</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Analytics Dashboard</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadPosts() {
    currentView = 'posts';
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) {
        console.error('Main content area not found');
        return;
    }
    
    showLoading();
    
    try {
        // Show loading state
        mainContent.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        
        const postsData = await apiManager.getPosts({ limit: 20 });
        
        if (postsData && postsData.data) {
            renderPostsList(postsData.data);
        } else {
            renderFallbackPosts();
        }
    } catch (error) {
        console.warn('Posts API not available, showing fallback:', error.message);
        renderFallbackPosts();
    } finally {
        hideLoading();
    }
}

// Fallback posts view
function renderFallbackPosts() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h1 class="h3 mb-0"><i class="bi bi-file-text me-2"></i>Gestione Post</h1>
                        <button class="btn btn-primary" onclick="showCreatePostModal()">
                            <i class="bi bi-plus-circle me-2"></i>Nuovo Post
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Elenco Post</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info">
                                <h6><i class="bi bi-info-circle me-2"></i>API Blog in Configurazione</h6>
                                <p class="mb-0">La gestione post sarà disponibile una volta configurata l'API del blog. Nel frattempo è possibile testare l'interfaccia.</p>
                            </div>
                            
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Titolo</th>
                                            <th>Categoria</th>
                                            <th>Stato</th>
                                            <th>Data</th>
                                            <th>Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td colspan="5" class="text-center text-muted py-4">
                                                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                                                <br>
                                                <strong>Nessun post disponibile</strong>
                                                <br>
                                                <small>Configurare l'API per visualizzare i post</small>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadCategories() {
    currentView = 'categories';
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) return;
    
    showLoading();
    
    try {
        mainContent.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 400px;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        
        const categoriesData = await apiManager.getCategories({ include_inactive: true, include_stats: true });
        
        if (categoriesData && categoriesData.data) {
            renderCategoriesList(categoriesData.data);
        } else {
            renderFallbackCategories();
        }
    } catch (error) {
        console.warn('Categories API not available:', error.message);
        renderFallbackCategories();
    } finally {
        hideLoading();
    }
}

function renderFallbackCategories() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h1 class="h3 mb-0"><i class="bi bi-folder me-2"></i>Gestione Categorie</h1>
                        <button class="btn btn-primary" onclick="showCreateCategoryModal()">
                            <i class="bi bi-plus-circle me-2"></i>Nuova Categoria
                        </button>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="alert alert-info">
                        <h6><i class="bi bi-info-circle me-2"></i>Configurazione API</h6>
                        <p class="mb-0">La gestione categorie sarà disponibile una volta configurata l'API.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadTags() {
    currentView = 'tags';
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) return;
    
    showLoading();
    
    try {
        mainContent.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 400px;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        
        const tagsData = await apiManager.getTags({ include_stats: true });
        
        if (tagsData && tagsData.data) {
            renderTagsList(tagsData.data);
        } else {
            renderFallbackTags();
        }
    } catch (error) {
        console.warn('Tags API not available:', error.message);
        renderFallbackTags();
    } finally {
        hideLoading();
    }
}

function renderFallbackTags() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h1 class="h3 mb-0"><i class="bi bi-tags me-2"></i>Gestione Tag</h1>
                        <button class="btn btn-primary" onclick="showCreateTagModal()">
                            <i class="bi bi-plus-circle me-2"></i>Nuovo Tag
                        </button>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="alert alert-info">
                        <h6><i class="bi bi-info-circle me-2"></i>Configurazione API</h6>
                        <p class="mb-0">La gestione tag sarà disponibile una volta configurata l'API.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadMedia() {
    currentView = 'media';
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) return;
    
    showLoading();
    
    try {
        mainContent.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 400px;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        
        const mediaData = await apiManager.getMedia({ limit: 50 });
        
        if (mediaData && mediaData.data) {
            renderMediaLibrary(mediaData.data);
        } else {
            renderFallbackMedia();
        }
    } catch (error) {
        console.warn('Media API not available:', error.message);
        renderFallbackMedia();
    } finally {
        hideLoading();
    }
}

function renderFallbackMedia() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h1 class="h3 mb-0"><i class="bi bi-image me-2"></i>Media Library</h1>
                        <button class="btn btn-primary" onclick="showUploadModal()">
                            <i class="bi bi-upload me-2"></i>Carica Media
                        </button>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="alert alert-info">
                        <h6><i class="bi bi-info-circle me-2"></i>Media Library</h6>
                        <p class="mb-0">La gestione media sarà disponibile una volta configurata l'API.</p>
                    </div>
                    <div class="text-center py-5">
                        <i class="bi bi-images" style="font-size: 4rem; color: #ccc;"></i>
                        <br><br>
                        <h5 class="text-muted">Nessun media disponibile</h5>
                        <p class="text-muted">I file media appariranno qui una volta caricati</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadAnalytics() {
    currentView = 'analytics';
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) return;
    
    showLoading();
    
    try {
        mainContent.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 400px;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        
        const analyticsData = await apiManager.getAnalyticsDashboard();
        
        if (analyticsData && analyticsData.data) {
            renderAnalyticsDashboard(analyticsData.data);
        } else {
            renderFallbackAnalytics();
        }
    } catch (error) {
        console.warn('Analytics API not available:', error.message);
        renderFallbackAnalytics();
    } finally {
        hideLoading();
    }
}

function renderFallbackAnalytics() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row">
                <div class="col-12">
                    <h1 class="h3 mb-4"><i class="bi bi-graph-up me-2"></i>Analytics</h1>
                </div>
            </div>
            <div class="row g-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="bi bi-eye" style="font-size: 2rem; color: #007bff;"></i>
                            <h4 class="mt-2">--</h4>
                            <p class="text-muted mb-0">Visualizzazioni</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="bi bi-people" style="font-size: 2rem; color: #28a745;"></i>
                            <h4 class="mt-2">--</h4>
                            <p class="text-muted mb-0">Visitatori</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="bi bi-clock" style="font-size: 2rem; color: #ffc107;"></i>
                            <h4 class="mt-2">--</h4>
                            <p class="text-muted mb-0">Tempo Medio</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <i class="bi bi-graph-up" style="font-size: 2rem; color: #dc3545;"></i>
                            <h4 class="mt-2">--%</h4>
                            <p class="text-muted mb-0">Bounce Rate</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body text-center py-5">
                            <i class="bi bi-bar-chart" style="font-size: 4rem; color: #ccc;"></i>
                            <br><br>
                            <h5 class="text-muted">Analytics in Configurazione</h5>
                            <p class="text-muted">I dati di analytics saranno disponibili una volta configurata l'integrazione.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadCalendar() {
    currentView = 'calendar';
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) return;
    
    showLoading();
    
    try {
        mainContent.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 400px;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        
        const now = new Date();
        const calendarData = await apiManager.getContentCalendar(now.getFullYear(), now.getMonth() + 1);
        
        if (calendarData && calendarData.data) {
            renderContentCalendar(calendarData.data);
        } else {
            renderFallbackCalendar();
        }
    } catch (error) {
        console.warn('Calendar API not available:', error.message);
        renderFallbackCalendar();
    } finally {
        hideLoading();
    }
}

function renderFallbackCalendar() {
    const mainContent = document.getElementById('mainContent');
    const currentDate = new Date();
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    
    mainContent.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row">
                <div class="col-12">
                    <h1 class="h3 mb-4"><i class="bi bi-calendar me-2"></i>Calendario Editoriale</h1>
                </div>
            </div>
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}</h5>
                                <div class="btn-group">
                                    <button class="btn btn-outline-secondary btn-sm">
                                        <i class="bi bi-chevron-left"></i>
                                    </button>
                                    <button class="btn btn-outline-secondary btn-sm">
                                        <i class="bi bi-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info">
                                <h6><i class="bi bi-info-circle me-2"></i>Calendario in Configurazione</h6>
                                <p class="mb-0">Il calendario editoriale sarà disponibile una volta configurata l'API.</p>
                            </div>
                            <div class="text-center py-4">
                                <i class="bi bi-calendar3" style="font-size: 4rem; color: #ccc;"></i>
                                <br><br>
                                <h5 class="text-muted">Nessun evento programmato</h5>
                                <p class="text-muted">Gli articoli programmati appariranno qui</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Prossimi Eventi</h6>
                        </div>
                        <div class="card-body">
                            <p class="text-muted text-center">Nessun evento programmato</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadWebhooks() {
    currentView = 'webhooks';
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) return;
    
    showLoading();
    
    try {
        mainContent.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 400px;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        
        const webhooksData = await apiManager.getWebhookLogs({ limit: 50 });
        
        if (webhooksData && webhooksData.data) {
            renderWebhooksList(webhooksData.data);
        } else {
            renderFallbackWebhooks();
        }
    } catch (error) {
        console.warn('Webhooks API not available:', error.message);
        renderFallbackWebhooks();
    } finally {
        hideLoading();
    }
}

function renderFallbackWebhooks() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h1 class="h3 mb-0"><i class="bi bi-arrow-repeat me-2"></i>Gestione Webhooks</h1>
                        <button class="btn btn-primary" onclick="showCreateWebhookModal()">
                            <i class="bi bi-plus-circle me-2"></i>Nuovo Webhook
                        </button>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Log Webhooks</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info">
                                <h6><i class="bi bi-info-circle me-2"></i>Sistema Webhooks</h6>
                                <p class="mb-0">La gestione webhooks sarà disponibile una volta configurata l'API.</p>
                            </div>
                            <div class="text-center py-4">
                                <i class="bi bi-arrow-repeat" style="font-size: 4rem; color: #ccc;"></i>
                                <br><br>
                                <h5 class="text-muted">Nessun webhook configurato</h5>
                                <p class="text-muted">I log dei webhook appariranno qui</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Stato Sistema</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="me-3">
                                    <div class="badge bg-warning">CONFIG</div>
                                </div>
                                <div>
                                    <div class="fw-bold">In Configurazione</div>
                                    <small class="text-muted">API non configurata</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadUsers() {
    currentView = 'users';
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) return;
    
    // Check admin permissions (if auth system is available)
    try {
        if (authManager && authManager.user && authManager.user.role !== 'admin') {
            showNotification('Accesso negato: solo gli amministratori possono gestire gli utenti', 'error');
            return;
        }
    } catch (e) {
        // Auth manager not available, continue
    }
    
    showLoading();
    
    try {
        mainContent.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 400px;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        
        const usersData = await apiManager.getUsers();
        
        if (usersData && usersData.data) {
            renderUsersList(usersData.data);
        } else {
            renderFallbackUsers();
        }
    } catch (error) {
        console.warn('Users API not available:', error.message);
        renderFallbackUsers();
    } finally {
        hideLoading();
    }
}

function renderFallbackUsers() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h1 class="h3 mb-0"><i class="bi bi-people me-2"></i>Gestione Utenti</h1>
                        <button class="btn btn-primary" onclick="showCreateUserModal()">
                            <i class="bi bi-person-plus me-2"></i>Nuovo Utente
                        </button>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Elenco Utenti</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-warning">
                        <h6><i class="bi bi-shield-exclamation me-2"></i>Sezione Amministratore</h6>
                        <p class="mb-0">La gestione utenti è riservata agli amministratori e sarà disponibile una volta configurata l'API di autenticazione.</p>
                    </div>
                    <div class="text-center py-4">
                        <i class="bi bi-people" style="font-size: 4rem; color: #ccc;"></i>
                        <br><br>
                        <h5 class="text-muted">Gestione Utenti</h5>
                        <p class="text-muted">Configurare l'API per visualizzare gli utenti</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadSettings() {
    currentView = 'settings';
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) return;
    
    // Check admin permissions (if auth system is available)
    try {
        if (authManager && authManager.user && authManager.user.role !== 'admin') {
            showNotification('Accesso negato: solo gli amministratori possono modificare le impostazioni', 'error');
            return;
        }
    } catch (e) {
        // Auth manager not available, continue
    }
    
    showLoading();
    
    try {
        mainContent.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 400px;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        
        const settingsData = await apiManager.getSettings();
        
        if (settingsData && settingsData.data) {
            renderSettingsPanel(settingsData.data);
        } else {
            renderFallbackSettings();
        }
    } catch (error) {
        console.warn('Settings API not available:', error.message);
        renderFallbackSettings();
    } finally {
        hideLoading();
    }
}

function renderFallbackSettings() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row">
                <div class="col-12">
                    <h1 class="h3 mb-4"><i class="bi bi-gear me-2"></i>Impostazioni Sistema</h1>
                </div>
            </div>
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Configurazione IT-ERA Blog</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-warning">
                                <h6><i class="bi bi-shield-exclamation me-2"></i>Sezione Amministratore</h6>
                                <p class="mb-0">Le impostazioni di sistema sono riservate agli amministratori e saranno disponibili una volta configurata l'API.</p>
                            </div>
                            
                            <h6 class="mt-3">Configurazioni Disponibili:</h6>
                            <div class="list-group list-group-flush">
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-1">Configurazione API</h6>
                                        <small class="text-muted">Endpoint e chiavi di accesso</small>
                                    </div>
                                    <span class="badge bg-warning">Pending</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-1">Impostazioni SEO</h6>
                                        <small class="text-muted">Meta tags e configurazioni SEO</small>
                                    </div>
                                    <span class="badge bg-warning">Pending</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-1">Configurazione Email</h6>
                                        <small class="text-muted">SMTP e notifiche</small>
                                    </div>
                                    <span class="badge bg-warning">Pending</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-1">Backup e Sicurezza</h6>
                                        <small class="text-muted">Configurazioni di backup automatico</small>
                                    </div>
                                    <span class="badge bg-warning">Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Stato Sistema</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Pannello Admin</span>
                                    <span class="badge bg-success">Attivo</span>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>API Blog</span>
                                    <span class="badge bg-warning">Config</span>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Database</span>
                                    <span class="badge bg-warning">Config</span>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Sicurezza</span>
                                    <span class="badge bg-success">Attivo</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
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

// Helper functions for modal creation
function showCreatePostModal() {
    showNotification('Funzione Nuovo Post in sviluppo', 'info');
}

function showCreateCategoryModal() {
    showNotification('Funzione Nuova Categoria in sviluppo', 'info');
}

function showCreateTagModal() {
    showNotification('Funzione Nuovo Tag in sviluppo', 'info');
}

function showUploadModal() {
    showNotification('Funzione Upload Media in sviluppo', 'info');
}

function showCreateWebhookModal() {
    showNotification('Funzione Nuovo Webhook in sviluppo', 'info');
}

function showCreateUserModal() {
    showNotification('Funzione Nuovo Utente in sviluppo', 'info');
}

// User profile and settings functions
function showProfile() {
    showNotification('Profilo utente in sviluppo', 'info');
}

function changePassword() {
    showNotification('Cambio password in sviluppo', 'info');
}

function logout() {
    if (typeof authManager !== 'undefined' && authManager.logout) {
        authManager.logout();
    } else {
        // Fallback logout
        localStorage.removeItem('blog_admin_token');
        location.reload();
    }
}

function viewSite() {
    window.open('https://it-era.pages.dev', '_blank');
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