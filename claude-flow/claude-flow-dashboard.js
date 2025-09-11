/**
 * Claude Flow Dashboard JavaScript
 * Interactive dashboard for managing Claude Flow system
 */

class ClaudeFlowDashboard {
    constructor() {
        this.apiBase = '/api/claude-flow';
        this.refreshInterval = 30000; // 30 seconds
        this.refreshTimer = null;
        
        this.sessions = [];
        this.workflows = [];
        this.analytics = null;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing Claude Flow Dashboard...');
        
        // Load initial data
        await this.loadSystemStatus();
        await this.loadSessions();
        await this.loadWorkflows();
        await this.loadAnalytics();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start auto-refresh
        this.startAutoRefresh();
        
        console.log('✅ Claude Flow Dashboard initialized');
    }
    
    setupEventListeners() {
        // Tab change events
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (event) => {
                const target = event.target.getAttribute('data-bs-target');
                this.onTabChange(target);
            });
        });
        
        // Memory search
        document.getElementById('memorySearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchMemory();
            }
        });
    }
    
    async onTabChange(target) {
        switch (target) {
            case '#sessions':
                await this.loadSessions();
                break;
            case '#workflows':
                await this.loadWorkflows();
                break;
            case '#memory':
                await this.loadMemoryContent();
                break;
            case '#analytics':
                await this.loadAnalytics();
                break;
        }
    }
    
    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'API call failed');
            }
            
            return data;
        } catch (error) {
            console.error(`API call failed: ${endpoint}`, error);
            this.showError(`API Error: ${error.message}`);
            throw error;
        }
    }
    
    async loadSystemStatus() {
        try {
            const data = await this.apiCall('/health');
            
            document.getElementById('systemStatus').innerHTML = 
                data.claudeFlow.initialized ? 
                '<i class="fas fa-check-circle text-success"></i> Online' :
                '<i class="fas fa-times-circle text-danger"></i> Offline';
                
        } catch (error) {
            document.getElementById('systemStatus').innerHTML = 
                '<i class="fas fa-times-circle text-danger"></i> Error';
        }
    }
    
    async loadSessions() {
        try {
            const data = await this.apiCall('/sessions');
            this.sessions = data.sessions;
            
            this.renderSessions();
            this.updateSessionsMetric();
        } catch (error) {
            document.getElementById('sessionsList').innerHTML = 
                '<div class="alert alert-danger">Errore nel caricamento delle sessioni</div>';
        }
    }
    
    renderSessions() {
        const container = document.getElementById('sessionsList');
        
        if (this.sessions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Nessuna sessione trovata</p>
                    <button class="btn btn-claude-flow" onclick="dashboard.createSession()">
                        <i class="fas fa-plus me-2"></i>
                        Crea Prima Sessione
                    </button>
                </div>
            `;
            return;
        }
        
        const sessionsHtml = this.sessions.map(session => `
            <div class="card mb-3 fade-in">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title mb-2">
                                <i class="fas fa-play-circle me-2"></i>
                                ${session.name}
                            </h6>
                            <p class="card-text text-muted small mb-2">
                                ID: ${session.id}
                            </p>
                            <p class="card-text small mb-2">
                                <i class="fas fa-clock me-1"></i>
                                Iniziata: ${new Date(session.startTime).toLocaleString('it-IT')}
                            </p>
                            ${session.endTime ? `
                                <p class="card-text small mb-2">
                                    <i class="fas fa-stop-circle me-1"></i>
                                    Terminata: ${new Date(session.endTime).toLocaleString('it-IT')}
                                </p>
                            ` : ''}
                            <p class="card-text small">
                                <i class="fas fa-tasks me-1"></i>
                                Workflow: ${session.workflowsCount}
                            </p>
                        </div>
                        <div class="text-end">
                            <span class="status-badge status-${session.status}">
                                ${this.getStatusLabel(session.status)}
                            </span>
                            <div class="mt-2">
                                <button class="btn btn-sm btn-outline-primary me-1" 
                                        onclick="dashboard.viewSession('${session.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${session.status === 'active' ? `
                                    <button class="btn btn-sm btn-outline-danger" 
                                            onclick="dashboard.endSession('${session.id}')">
                                        <i class="fas fa-stop"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = sessionsHtml;
    }
    
    async loadWorkflows() {
        try {
            const data = await this.apiCall('/workflows');
            this.workflows = data.workflows;
            
            this.renderAvailableWorkflows();
            this.updateWorkflowsMetric();
        } catch (error) {
            document.getElementById('availableWorkflows').innerHTML = 
                '<div class="alert alert-danger">Errore nel caricamento dei workflow</div>';
        }
    }
    
    renderAvailableWorkflows() {
        const container = document.getElementById('availableWorkflows');
        
        if (this.workflows.length === 0) {
            container.innerHTML = '<p class="text-muted">Nessun workflow disponibile</p>';
            return;
        }
        
        const workflowsHtml = this.workflows.map(workflow => `
            <div class="card mb-2">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${workflow}</h6>
                        </div>
                        <button class="btn btn-sm btn-claude-flow" 
                                onclick="dashboard.executeWorkflow('${workflow}')">
                            <i class="fas fa-play me-1"></i>
                            Esegui
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = workflowsHtml;
    }
    
    async loadMemoryContent() {
        try {
            const data = await this.apiCall('/memory/search?q=&limit=50');
            this.renderMemoryContent(data.results);
        } catch (error) {
            document.getElementById('memoryContent').innerHTML = 
                '<div class="alert alert-danger">Errore nel caricamento della memoria</div>';
        }
    }
    
    renderMemoryContent(results) {
        const container = document.getElementById('memoryContent');
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-database fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Nessun dato in memoria</p>
                </div>
            `;
            return;
        }
        
        const memoryHtml = results.map(item => `
            <div class="memory-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">
                            <span class="badge bg-secondary me-2">${item.namespace}</span>
                            ${item.key}
                        </h6>
                        <p class="small text-muted mb-1">
                            <i class="fas fa-clock me-1"></i>
                            ${new Date(item.timestamp).toLocaleString('it-IT')}
                        </p>
                        <p class="small text-muted mb-0">
                            <i class="fas fa-weight me-1"></i>
                            ${item.size} bytes
                        </p>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="dashboard.viewMemoryItem('${item.namespace}', '${item.key}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = memoryHtml;
    }
    
    async loadAnalytics() {
        try {
            const data = await this.apiCall('/analytics');
            this.analytics = data.analytics;
            
            this.renderAnalytics();
            this.updateMetrics();
        } catch (error) {
            document.getElementById('analyticsContent').innerHTML = 
                '<div class="alert alert-danger">Errore nel caricamento delle analytics</div>';
        }
    }
    
    renderAnalytics() {
        const container = document.getElementById('analyticsContent');
        
        if (!this.analytics) {
            container.innerHTML = '<p class="text-muted">Nessun dato disponibile</p>';
            return;
        }
        
        const analyticsHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Sistema</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Versione:</strong> ${this.analytics.engine.version}</p>
                            <p><strong>Uptime:</strong> ${Math.round(this.analytics.engine.uptime / 1000 / 60)} minuti</p>
                            <p><strong>Sessioni create:</strong> ${this.analytics.engine.metrics.sessionsCreated}</p>
                            <p><strong>Workflow eseguiti:</strong> ${this.analytics.engine.metrics.workflowsExecuted}</p>
                            <p><strong>Errori:</strong> ${this.analytics.engine.metrics.errors}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Memoria</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Operazioni:</strong> ${this.analytics.memory.operations}</p>
                            <p><strong>Hit Rate:</strong> ${this.analytics.memory.hitRate}</p>
                            <p><strong>Dimensione:</strong> ${this.analytics.memory.memorySize} elementi</p>
                            <p><strong>Namespace:</strong> ${this.analytics.memory.namespaces}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Integrazione Auggie</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Stato:</strong> 
                                ${this.analytics.integration.initialized ? 
                                    '<span class="badge bg-success">Inizializzato</span>' : 
                                    '<span class="badge bg-danger">Non inizializzato</span>'}
                            </p>
                            <p><strong>Auggie disponibile:</strong> 
                                ${this.analytics.integration.auggieAvailable ? 
                                    '<span class="badge bg-success">Sì</span>' : 
                                    '<span class="badge bg-warning">No</span>'}
                            </p>
                            <p><strong>Modalità ibrida:</strong> 
                                ${this.analytics.integration.hybridMode ? 
                                    '<span class="badge bg-info">Attiva</span>' : 
                                    '<span class="badge bg-secondary">Disattiva</span>'}
                            </p>
                            <p><strong>Provider corrente:</strong> ${this.analytics.integration.currentProvider}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = analyticsHtml;
    }
    
    updateMetrics() {
        if (!this.analytics) return;
        
        // Update memory metric
        document.getElementById('memoryUsage').innerHTML = 
            `${this.analytics.memory.memorySize} elementi`;
    }
    
    updateSessionsMetric() {
        const activeSessions = this.sessions.filter(s => s.status === 'active').length;
        document.getElementById('activeSessions').innerHTML = activeSessions.toString();
    }
    
    updateWorkflowsMetric() {
        // This would be updated with actual running workflows data
        document.getElementById('activeWorkflows').innerHTML = '0';
    }
    
    // Action methods
    createSession() {
        const modal = new bootstrap.Modal(document.getElementById('createSessionModal'));
        modal.show();
    }
    
    async submitCreateSession() {
        const name = document.getElementById('sessionName').value;
        const description = document.getElementById('sessionDescription').value;
        
        if (!name) {
            this.showError('Nome sessione richiesto');
            return;
        }
        
        try {
            await this.apiCall('/sessions', {
                method: 'POST',
                body: JSON.stringify({ name, description })
            });
            
            this.showSuccess('Sessione creata con successo');
            bootstrap.Modal.getInstance(document.getElementById('createSessionModal')).hide();
            
            // Reset form
            document.getElementById('createSessionForm').reset();
            
            // Reload sessions
            await this.loadSessions();
        } catch (error) {
            this.showError('Errore nella creazione della sessione');
        }
    }
    
    executeWorkflow(workflowName) {
        // Populate workflow select
        const select = document.getElementById('workflowName');
        select.innerHTML = `<option value="${workflowName}" selected>${workflowName}</option>`;
        
        // Populate session select
        const sessionSelect = document.getElementById('workflowSession');
        sessionSelect.innerHTML = '<option value="">Crea nuova sessione</option>';
        
        this.sessions.filter(s => s.status === 'active').forEach(session => {
            sessionSelect.innerHTML += `<option value="${session.id}">${session.name}</option>`;
        });
        
        const modal = new bootstrap.Modal(document.getElementById('executeWorkflowModal'));
        modal.show();
    }
    
    async submitExecuteWorkflow() {
        const workflowName = document.getElementById('workflowName').value;
        const sessionId = document.getElementById('workflowSession').value;
        
        if (!workflowName) {
            this.showError('Workflow richiesto');
            return;
        }
        
        try {
            const payload = { workflowName };
            if (sessionId) {
                payload.sessionId = sessionId;
            }
            
            await this.apiCall('/workflows/execute', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            this.showSuccess('Workflow avviato con successo');
            bootstrap.Modal.getInstance(document.getElementById('executeWorkflowModal')).hide();
            
            // Reload data
            await this.loadSessions();
            await this.loadWorkflows();
        } catch (error) {
            this.showError('Errore nell\'esecuzione del workflow');
        }
    }
    
    async searchMemory() {
        const query = document.getElementById('memorySearch').value;
        
        try {
            const data = await this.apiCall(`/memory/search?q=${encodeURIComponent(query)}&limit=50`);
            this.renderMemoryContent(data.results);
        } catch (error) {
            this.showError('Errore nella ricerca');
        }
    }
    
    async endSession(sessionId) {
        if (!confirm('Sei sicuro di voler terminare questa sessione?')) {
            return;
        }
        
        try {
            await this.apiCall(`/sessions/${sessionId}`, {
                method: 'DELETE'
            });
            
            this.showSuccess('Sessione terminata');
            await this.loadSessions();
        } catch (error) {
            this.showError('Errore nella terminazione della sessione');
        }
    }
    
    async refreshDashboard() {
        await this.loadSystemStatus();
        await this.loadSessions();
        await this.loadWorkflows();
        await this.loadAnalytics();
        
        this.showSuccess('Dashboard aggiornata');
    }
    
    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            this.refreshDashboard();
        }, this.refreshInterval);
    }
    
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    
    // Utility methods
    getStatusLabel(status) {
        const labels = {
            'active': 'Attiva',
            'ended': 'Terminata',
            'running': 'In esecuzione',
            'completed': 'Completato',
            'failed': 'Fallito'
        };
        return labels[status] || status;
    }
    
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    showError(message) {
        this.showToast(message, 'danger');
    }
    
    showToast(message, type = 'info') {
        // Create toast element
        const toastHtml = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        // Add to toast container (create if doesn't exist)
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        
        container.insertAdjacentHTML('beforeend', toastHtml);
        
        // Show toast
        const toastElement = container.lastElementChild;
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        // Remove after hiding
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Global functions for HTML onclick handlers
window.createSession = () => dashboard.createSession();
window.submitCreateSession = () => dashboard.submitCreateSession();
window.submitExecuteWorkflow = () => dashboard.submitExecuteWorkflow();
window.searchMemory = () => dashboard.searchMemory();
window.refreshDashboard = () => dashboard.refreshDashboard();

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ClaudeFlowDashboard();
});
