// Dashboard rendering and functionality
function renderDashboard(data) {
    const content = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2"><i class="bi bi-speedometer2 me-2"></i>Dashboard</h1>
            <div class="btn-toolbar mb-2 mb-md-0">
                <div class="btn-group me-2">
                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="loadDashboard()">
                        <i class="bi bi-arrow-clockwise me-1"></i>Aggiorna
                    </button>
                </div>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="row mb-4">
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card stat-card stat-posts">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="stat-label mb-1">Totale Post</div>
                                <div class="stat-number text-primary">${formatNumber(data.stats?.posts?.total || data.posts?.total || 0)}</div>
                            </div>
                            <div class="col-auto">
                                <i class="bi bi-file-text fa-2x text-gray-300"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-muted small">
                            <span class="text-success">${formatNumber(data.stats?.posts?.published || data.posts?.published || 0)} pubblicati</span> •
                            <span class="text-warning">${formatNumber(data.stats?.posts?.draft || data.posts?.draft || 0)} bozze</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card stat-card stat-views">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="stat-label mb-1">Visualizzazioni</div>
                                <div class="stat-number text-success">${formatNumber(data.stats?.views?.month || data.views?.month || 0)}</div>
                            </div>
                            <div class="col-auto">
                                <i class="bi bi-eye fa-2x text-gray-300"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-muted small">
                            Post pubblicati
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card stat-card stat-categories">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="stat-label mb-1">Categorie</div>
                                <div class="stat-number text-info">${formatNumber(data.stats?.categories || data.categories || 0)}</div>
                            </div>
                            <div class="col-auto">
                                <i class="bi bi-folder fa-2x text-gray-300"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-muted small">
                            Attive
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card stat-card stat-tags">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="stat-label mb-1">Tag</div>
                                <div class="stat-number text-warning">${formatNumber(data.stats?.tags || data.tags || 0)}</div>
                            </div>
                            <div class="col-auto">
                                <i class="bi bi-tags fa-2x text-gray-300"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-muted small">
                            Totali
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Recent Posts -->
            <div class="col-lg-8 mb-4">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">Post Recenti</h5>
                        <button class="btn btn-sm btn-outline-primary" onclick="loadPosts()">
                            Vedi tutti
                        </button>
                    </div>
                    <div class="card-body">
                        ${renderRecentPosts(data.stats?.recent_posts || data.recent_posts || [])}
                    </div>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="col-lg-4 mb-4">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Statistiche Post</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="postsStatusChart" style="height: 200px;"></canvas>
                    </div>
                </div>

            </div>
        </div>

        <div class="row">
            <!-- Popular Posts -->

            <!-- Webhook Activity -->
            ${data.webhooks && data.webhooks.length > 0 ? `
            <div class="col-lg-6 mb-4">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">Attività Webhook</h5>
                        <button class="btn btn-sm btn-outline-secondary" onclick="loadWebhooks()">
                            Dettagli
                        </button>
                    </div>
                    <div class="card-body">
                        ${renderWebhookActivity(data.webhooks)}
                    </div>
                </div>
            </div>
            ` : ''}
        </div>

        ${(data.stats?.posts?.monthly || data.posts?.monthly || []).length > 0 ? `
        <div class="row">
            <div class="col-12 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Attività Mensile</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="monthlyActivityChart" style="height: 300px;"></canvas>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
    `;

    document.getElementById('mainContent').innerHTML = content;

    // Initialize charts
    setTimeout(() => {
        renderPostStatusChart(data.stats?.posts?.byStatus || data.posts?.byStatus || []);
        if ((data.stats?.posts?.monthly || data.posts?.monthly || []).length > 0) {
            renderMonthlyActivityChart(data.stats?.posts?.monthly || data.posts?.monthly);
        }
    }, 100);
}

function renderRecentPosts(posts) {
    if (posts.length === 0) {
        return '<p class="text-muted text-center py-3">Nessun post trovato</p>';
    }

    return `
        <div class="table-responsive">
            <table class="table table-hover">
                <tbody>
                    ${posts.map(post => `
                        <tr>
                            <td>
                                <div class="d-flex align-items-start">
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">
                                            <a href="#" onclick="editPost(${post.id})" class="text-decoration-none">
                                                ${post.title}
                                            </a>
                                        </h6>
                                        <small class="text-muted">
                                            di ${post.author_name} • 
                                            ${formatDate(post.published_at || post.created_at, true)}
                                        </small>
                                        ${post.service_category ? `<br><small>${getServiceBadge(post.service_category)}</small>` : ''}
                                    </div>
                                    <div class="text-end">
                                        ${getStatusBadge(post.status)}
                                        ${post.view_count > 0 ? `<br><small class="text-muted">${formatNumber(post.view_count)} views</small>` : ''}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderPopularPosts(posts) {
    return `
        <div class="list-group list-group-flush">
            ${posts.map((post, index) => `
                <div class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="me-auto">
                        <span class="badge bg-primary rounded-pill me-2">${index + 1}</span>
                        <strong>${post.title}</strong>
                        <br>
                        <small class="text-muted">${formatDate(post.published_at)}</small>
                    </div>
                    <span class="badge bg-success rounded-pill">${formatNumber(post.view_count)} views</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderServiceStats(services) {
    return services.map(service => {
        const serviceConfig = CONFIG.SERVICES[service.service_category];
        return `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <i class="${serviceConfig?.icon || 'bi-circle'} me-2" style="color: ${serviceConfig?.color || '#6c757d'}"></i>
                    ${serviceConfig?.name || service.service_category}
                </div>
                <span class="badge bg-secondary">${service.count}</span>
            </div>
        `;
    }).join('');
}

function renderWebhookActivity(webhooks) {
    return `
        <div class="list-group list-group-flush">
            ${webhooks.slice(0, 5).map(webhook => {
                const isSuccess = webhook.status === 'processed';
                return `
                    <div class="list-group-item d-flex justify-content-between align-items-center py-2">
                        <div>
                            <i class="bi ${isSuccess ? 'bi-check-circle text-success' : 'bi-x-circle text-danger'} me-2"></i>
                            <strong>${webhook.webhook_type}</strong>
                            ${webhook.error_message ? `<br><small class="text-danger">${webhook.error_message}</small>` : ''}
                        </div>
                        <small class="text-muted">${formatDate(webhook.created_at, true)}</small>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderPostStatusChart(statusData) {
    const ctx = document.getElementById('postsStatusChart');
    if (!ctx) return;

    const labels = statusData.map(item => CONFIG.POST_STATUSES[item.status]?.name || item.status);
    const data = statusData.map(item => item.count);
    const colors = statusData.map(item => {
        switch(item.status) {
            case 'published': return '#28a745';
            case 'draft': return '#6c757d';
            case 'scheduled': return '#fd7e14';
            case 'archived': return '#6f42c1';
            default: return '#17a2b8';
        }
    });

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        fontSize: 12
                    }
                }
            }
        }
    });
}

function renderMonthlyActivityChart(monthlyData) {
    const ctx = document.getElementById('monthlyActivityChart');
    if (!ctx) return;

    const labels = monthlyData.map(item => {
        const [year, month] = item.month.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString(CONFIG.DATE_LOCALE, { month: 'short', year: '2-digit' });
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.reverse(),
            datasets: [
                {
                    label: 'Post Creati',
                    data: monthlyData.map(item => item.posts_created).reverse(),
                    borderColor: CONFIG.COLORS.PRIMARY,
                    backgroundColor: CONFIG.COLORS.PRIMARY + '20',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Post Pubblicati',
                    data: monthlyData.map(item => item.posts_published).reverse(),
                    borderColor: CONFIG.COLORS.SUCCESS,
                    backgroundColor: CONFIG.COLORS.SUCCESS + '20',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            ...CONFIG.CHART_OPTIONS,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}