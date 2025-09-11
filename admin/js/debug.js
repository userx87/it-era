// Debug utilities for IT-ERA Admin Panel
class DebugManager {
    constructor() {
        this.isDebugMode = localStorage.getItem('it_era_debug') === 'true';
        this.logs = [];
        this.maxLogs = 100;
        
        if (this.isDebugMode) {
            this.enableDebugMode();
        }
    }
    
    enableDebugMode() {
        console.log('🔧 IT-ERA Admin Debug Mode Enabled');
        this.addDebugPanel();
        this.interceptFetch();
        this.logConfigCheck();
    }
    
    disableDebugMode() {
        localStorage.removeItem('it_era_debug');
        location.reload();
    }
    
    toggleDebugMode() {
        if (this.isDebugMode) {
            this.disableDebugMode();
        } else {
            localStorage.setItem('it_era_debug', 'true');
            location.reload();
        }
    }
    
    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            message,
            type,
            data
        };
        
        this.logs.push(logEntry);
        
        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        
        // Console output with styling
        const style = this.getConsoleStyle(type);
        console.log(`%c[${timestamp}] ${message}`, style, data || '');
        
        // Update debug panel if visible
        this.updateDebugPanel();
    }
    
    getConsoleStyle(type) {
        const styles = {
            info: 'color: #0056cc; font-weight: bold;',
            success: 'color: #28a745; font-weight: bold;',
            warning: 'color: #ffc107; font-weight: bold;',
            error: 'color: #dc3545; font-weight: bold;',
            api: 'color: #17a2b8; font-weight: bold;'
        };
        return styles[type] || styles.info;
    }
    
    logConfigCheck() {
        this.log('Checking CONFIG object', 'info');
        
        if (typeof CONFIG !== 'undefined') {
            this.log('✅ CONFIG object found', 'success', {
                API_BASE_URL: CONFIG.API_BASE_URL,
                ADMIN_API_BASE_URL: CONFIG.ADMIN_API_BASE_URL
            });
        } else {
            this.log('❌ CONFIG object not found!', 'error');
        }
        
        if (typeof authManager !== 'undefined') {
            this.log('✅ authManager found', 'success', {
                isAuthenticated: authManager.isAuthenticated,
                token: authManager.token ? '***masked***' : null
            });
        } else {
            this.log('❌ authManager not found!', 'error');
        }
        
        if (typeof apiManager !== 'undefined') {
            this.log('✅ apiManager found', 'success', {
                baseURL: apiManager.baseURL,
                adminBaseURL: apiManager.adminBaseURL
            });
        } else {
            this.log('❌ apiManager not found!', 'error');
        }
    }
    
    interceptFetch() {
        const originalFetch = window.fetch;
        const debugManager = this;
        
        window.fetch = async function(...args) {
            const url = args[0];
            const options = args[1] || {};
            
            debugManager.log(`📡 API Request: ${options.method || 'GET'} ${url}`, 'api', {
                url,
                method: options.method || 'GET',
                headers: options.headers,
                body: options.body
            });
            
            try {
                const response = await originalFetch.apply(this, args);
                
                debugManager.log(`📡 API Response: ${response.status} ${url}`, 
                    response.ok ? 'success' : 'error', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                });
                
                return response;
            } catch (error) {
                debugManager.log(`📡 API Error: ${url}`, 'error', error);
                throw error;
            }
        };
    }
    
    addDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'it-era-debug-panel';
        debugPanel.innerHTML = `
            <div style="position: fixed; top: 10px; left: 10px; z-index: 99999; background: #000; color: #fff; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; max-width: 400px; max-height: 300px; overflow-y: auto;">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                    <strong>🔧 IT-ERA Debug Panel</strong>
                    <div style="margin-left: auto;">
                        <button onclick="debugManager.clearLogs()" style="background: #dc3545; color: white; border: none; padding: 2px 5px; margin-right: 5px; border-radius: 3px; cursor: pointer;">Clear</button>
                        <button onclick="debugManager.testAPI()" style="background: #0056cc; color: white; border: none; padding: 2px 5px; margin-right: 5px; border-radius: 3px; cursor: pointer;">Test API</button>
                        <button onclick="debugManager.toggleDebugMode()" style="background: #6c757d; color: white; border: none; padding: 2px 5px; border-radius: 3px; cursor: pointer;">×</button>
                    </div>
                </div>
                <div id="debug-logs" style="max-height: 250px; overflow-y: auto;">
                    <!-- Logs will be populated here -->
                </div>
            </div>
        `;
        
        document.body.appendChild(debugPanel);
        window.debugManager = this; // Make available globally for buttons
    }
    
    updateDebugPanel() {
        const logsContainer = document.getElementById('debug-logs');
        if (!logsContainer) return;
        
        const logsHtml = this.logs.slice(-20).map(log => {
            const color = this.getLogColor(log.type);
            return `<div style="color: ${color}; margin-bottom: 2px; font-size: 11px;">
                [${log.timestamp.split('T')[1].split('.')[0]}] ${log.message}
            </div>`;
        }).join('');
        
        logsContainer.innerHTML = logsHtml;
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
    
    getLogColor(type) {
        const colors = {
            info: '#0056cc',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            api: '#17a2b8'
        };
        return colors[type] || colors.info;
    }
    
    clearLogs() {
        this.logs = [];
        this.updateDebugPanel();
        console.clear();
        this.log('Debug logs cleared', 'info');
    }
    
    async testAPI() {
        this.log('🧪 Starting API connectivity test', 'info');
        
        // Test 1: Health check
        try {
            const healthResponse = await fetch(`${CONFIG.API_BASE_URL.replace('/api', '')}/health`);
            const healthData = await healthResponse.json();
            this.log('✅ Health check passed', 'success', healthData);
        } catch (error) {
            this.log('❌ Health check failed', 'error', error.message);
        }
        
        // Test 2: Login attempt with test credentials
        try {
            const loginResponse = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'admin@it-era.it',
                    password: 'admin123'
                })
            });
            
            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                this.log('✅ Test login successful', 'success', { user: loginData.data.user.email });
            } else {
                const errorData = await loginResponse.json();
                this.log('⚠️ Test login failed (expected)', 'warning', errorData);
            }
        } catch (error) {
            this.log('❌ Test login error', 'error', error.message);
        }
        
        // Test 3: CORS check
        try {
            const corsResponse = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'OPTIONS',
                headers: {
                    'Origin': window.location.origin,
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type'
                }
            });
            
            if (corsResponse.ok) {
                this.log('✅ CORS check passed', 'success');
            } else {
                this.log('❌ CORS check failed', 'error');
            }
        } catch (error) {
            this.log('❌ CORS test error', 'error', error.message);
        }
        
        this.log('🧪 API test completed', 'info');
    }
    
    exportLogs() {
        const logsData = JSON.stringify(this.logs, null, 2);
        const blob = new Blob([logsData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `it-era-debug-logs-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log('📥 Debug logs exported', 'info');
    }
}

// Initialize debug manager
const debugManager = new DebugManager();

// Add keyboard shortcut to toggle debug mode (Ctrl+Shift+D)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        debugManager.toggleDebugMode();
    }
});

// Console helper commands
window.itEraDebug = {
    enable: () => debugManager.toggleDebugMode(),
    test: () => debugManager.testAPI(),
    clear: () => debugManager.clearLogs(),
    export: () => debugManager.exportLogs(),
    config: () => console.log('CONFIG:', typeof CONFIG !== 'undefined' ? CONFIG : 'Not found'),
    auth: () => console.log('authManager:', typeof authManager !== 'undefined' ? authManager : 'Not found'),
    api: () => console.log('apiManager:', typeof apiManager !== 'undefined' ? apiManager : 'Not found')
};

console.log('🔧 IT-ERA Debug utilities loaded. Use Ctrl+Shift+D to toggle debug panel or window.itEraDebug for commands.');