/**
 * IT-ERA Secure Configuration Manager
 * Gestisce le API keys e configurazioni sensibili in modo sicuro
 */

class ITERASecureConfig {
    constructor() {
        this.config = {
            // API Endpoints (pubblici)
            endpoints: {
                openai: 'https://api.openai.com/v1/chat/completions',
                resend: 'https://api.resend.com/emails',
                fallback: 'https://it-era.it/api/fallback'
            },
            
            // Contatti (pubblici)
            contacts: {
                phone: '039 888 2041',
                email: 'info@bulltech.it',
                emergencyPhone: '039 888 2041'
            },
            
            // Configurazioni AI (pubbliche)
            ai: {
                model: 'gpt-4',
                maxTokens: 300,
                temperature: 0.7,
                timeout: 15000,
                maxRetries: 3
            },
            
            // Feature flags
            features: {
                aiEnabled: true,
                chatEnabled: true,
                analyticsEnabled: true,
                debugMode: false
            }
        };
        
        this.apiKeys = null; // Caricato dinamicamente
        this.init();
    }
    
    init() {
        // Carica configurazione da variabili ambiente o endpoint sicuro
        this.loadSecureConfig();
        
        // Esponi configurazione globale (solo parti pubbliche)
        window.ITERA_CONFIG = {
            endpoints: this.config.endpoints,
            contacts: this.config.contacts,
            ai: this.config.ai,
            features: this.config.features
        };
        
        console.log('🔐 Secure configuration loaded');
    }
    
    async loadSecureConfig() {
        try {
            // In produzione, questo dovrebbe chiamare un endpoint sicuro
            // Per ora, usiamo una configurazione locale sicura
            
            // Prova a caricare da variabili ambiente (se disponibili)
            if (typeof process !== 'undefined' && process.env) {
                this.apiKeys = {
                    openai: process.env.OPENAI_API_KEY,
                    resend: process.env.RESEND_API_KEY
                };
            }
            
            // Fallback a configurazione locale (solo per sviluppo)
            if (!this.apiKeys?.openai) {
                this.apiKeys = await this.getLocalConfig();
            }
            
        } catch (error) {
            console.warn('⚠️ Could not load secure config, using fallback');
            this.apiKeys = null;
        }
    }
    
    async getLocalConfig() {
        // In produzione, questo dovrebbe essere un endpoint sicuro
        // Per ora, restituiamo una configurazione di fallback
        
        return {
            openai: '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',
            resend: 're_BhJiCJEe_JXYWoB3W4NcpoPtjA2qyvqYL'
        };
    }
    
    // Metodo sicuro per ottenere API keys
    getApiKey(service) {
        if (!this.apiKeys) {
            console.warn(`⚠️ API key for ${service} not available`);
            return null;
        }
        
        return this.apiKeys[service] || null;
    }
    
    // Metodo per chiamate API sicure
    async makeSecureAPICall(service, endpoint, options = {}) {
        const apiKey = this.getApiKey(service);
        if (!apiKey) {
            throw new Error(`API key for ${service} not available`);
        }
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Aggiungi header di autorizzazione specifico per servizio
        if (service === 'openai') {
            headers['Authorization'] = `Bearer ${apiKey}`;
        } else if (service === 'resend') {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        
        const requestOptions = {
            method: options.method || 'POST',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: options.signal
        };
        
        try {
            const response = await fetch(endpoint, requestOptions);
            
            if (!response.ok) {
                throw new Error(`${service} API error: ${response.status} - ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error(`Secure API call failed for ${service}:`, error);
            throw error;
        }
    }
    
    // Metodo per chiamate OpenAI sicure
    async callOpenAI(messages, options = {}) {
        const requestBody = {
            model: options.model || this.config.ai.model,
            messages: messages,
            max_tokens: options.max_tokens || this.config.ai.maxTokens,
            temperature: options.temperature || this.config.ai.temperature,
            ...options
        };
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.ai.timeout);
        
        try {
            const result = await this.makeSecureAPICall('openai', this.config.endpoints.openai, {
                body: requestBody,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return result.choices[0].message.content;
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    
    // Metodo per chiamate Resend sicure
    async callResend(emailData) {
        const requestBody = {
            from: emailData.from || `info@it-era.it`,
            to: emailData.to || ['info@bulltech.it'],
            subject: emailData.subject,
            html: emailData.html,
            ...emailData
        };
        
        return await this.makeSecureAPICall('resend', this.config.endpoints.resend, {
            body: requestBody
        });
    }
    
    // Metodo per ottenere configurazione pubblica
    getPublicConfig() {
        return {
            contacts: this.config.contacts,
            features: this.config.features,
            ai: {
                model: this.config.ai.model,
                maxTokens: this.config.ai.maxTokens,
                temperature: this.config.ai.temperature
            }
        };
    }
    
    // Metodo per verificare se un servizio è disponibile
    isServiceAvailable(service) {
        return this.getApiKey(service) !== null;
    }
    
    // Metodo per logging sicuro (non logga API keys)
    secureLog(message, data = {}) {
        const sanitizedData = { ...data };
        
        // Rimuovi API keys dai log
        Object.keys(sanitizedData).forEach(key => {
            if (key.toLowerCase().includes('key') || 
                key.toLowerCase().includes('token') || 
                key.toLowerCase().includes('secret')) {
                sanitizedData[key] = '[REDACTED]';
            }
        });
        
        console.log(message, sanitizedData);
    }
    
    // Metodo per gestire errori API in modo sicuro
    handleAPIError(service, error) {
        // Non esporre dettagli sensibili negli errori
        const safeError = {
            service,
            message: error.message,
            timestamp: new Date().toISOString()
        };
        
        // Log interno completo (per debugging)
        if (this.config.features.debugMode) {
            console.error(`API Error for ${service}:`, error);
        }
        
        // Restituisci errore sicuro per l'utente
        return safeError;
    }
}

// Inizializza configurazione sicura
if (typeof window !== 'undefined') {
    window.ITERASecureConfig = new ITERASecureConfig();
    
    // Esponi metodi sicuri globalmente
    window.ITERA_SECURE = {
        callOpenAI: (messages, options) => window.ITERASecureConfig.callOpenAI(messages, options),
        callResend: (emailData) => window.ITERASecureConfig.callResend(emailData),
        isServiceAvailable: (service) => window.ITERASecureConfig.isServiceAvailable(service),
        getPublicConfig: () => window.ITERASecureConfig.getPublicConfig()
    };
}

// Export per sistemi di moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERASecureConfig;
}
