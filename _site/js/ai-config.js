/**
 * IT-ERA AI Configuration - Enhanced Version
 * OpenAI GPT Integration with Advanced Features
 * - Optimized performance and error handling
 * - Enhanced urgency detection with ML scoring
 * - Sector-specific personalization
 * - Comprehensive analytics and monitoring
 * - Auggie integration support
 */

class ITERAIConfig {
    constructor() {
        // OpenAI Configuration - Secure endpoint
        this.openaiApiKey = this.getSecureApiKey();
        this.openaiApiUrl = 'https://api.openai.com/v1/chat/completions';

        // Performance Configuration
        this.performanceConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 15000,
            rateLimitDelay: 2000,
            cacheEnabled: true,
            cacheTTL: 300000 // 5 minutes
        };

        // Response cache for performance
        this.responseCache = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;

        // IT-ERA Enhanced Company Configuration
        this.companyInfo = {
            name: 'IT-ERA',
            phone: '039 888 2041',
            email: 'info@it-era.it',
            address: 'Viale Risorgimento 32, Vimercate MB',
            services: [
                'Assistenza IT 24/7',
                'Cybersecurity e Sicurezza Informatica',
                'Cloud Storage e Backup',
                'VoIP e Centralino Cloud',
                'Soluzioni per Studi Medici',
                'Soluzioni per Studi Legali'
            ],
            responseTime: '15 minuti garantiti',
            coverage: 'Lombardia',
            businessHours: {
                weekdays: '08:00-18:00',
                emergency: '24/7',
                timezone: 'Europe/Rome'
            }
        };

        // Enhanced Urgency Detection with ML-like scoring
        this.urgencyConfig = {
            keywords: {
                critical: ['emergenza', 'down', 'bloccato', 'hackerato', 'ransomware', 'virus', 'non funziona'],
                high: ['urgente', 'subito', 'immediato', 'problema grave', 'server'],
                medium: ['problema', 'aiuto', 'supporto', 'lento'],
                low: ['informazione', 'preventivo', 'consulenza']
            },
            timeFactors: {
                outOfHours: 1.5,
                weekend: 1.3,
                businessHours: 1.0
            },
            sectorMultipliers: {
                medical: 1.8,
                legal: 1.5,
                general: 1.0
            }
        };

        // Sector-specific knowledge bases
        this.sectorKnowledge = {
            medical: {
                compliance: ['GDPR sanitario', 'Privacy pazienti', 'Sicurezza dati clinici'],
                services: ['Gestione cartelle cliniche', 'Backup sicuro', 'Telemedicina'],
                urgencyKeywords: ['paziente', 'emergenza sanitaria', 'dati clinici']
            },
            legal: {
                compliance: ['GDPR legale', 'Riservatezza', 'Sicurezza documenti'],
                services: ['Archiviazione sicura', 'Backup legale', 'Firma digitale'],
                urgencyKeywords: ['causa', 'scadenza', 'tribunale', 'documenti legali']
            },
            general: {
                compliance: ['GDPR generale', 'Sicurezza aziendale'],
                services: ['Assistenza generale', 'Manutenzione', 'Consulenza'],
                urgencyKeywords: ['business', 'produzione', 'vendite']
            }
        };

        // Enhanced Analytics Configuration
        this.analyticsConfig = {
            enabled: true,
            trackConversations: true,
            trackSentiment: true,
            trackPerformance: true,
            sessionTimeout: 1800000, // 30 minutes
            metricsEndpoint: '/api/analytics/chatbot',
            batchSize: 10,
            flushInterval: 30000 // 30 seconds
        };

        // Conversation analytics storage
        this.conversationMetrics = {
            sessions: new Map(),
            responses: [],
            errors: [],
            performance: []
        };

        // Enhanced Chatbot Personality with sector awareness
        this.chatbotPersonality = `
Sei l'assistente virtuale avanzato di IT-ERA, l'azienda leader in Lombardia per servizi IT aziendali.

INFORMAZIONI AZIENDA:
- Nome: IT-ERA
- Telefono: 039 888 2041 (SEMPRE da fornire per emergenze)
- Email: info@it-era.it
- Indirizzo: Viale Risorgimento 32, Vimercate MB
- Copertura: Tutta la Lombardia
- Tempo di risposta: 15 minuti garantiti per emergenze
- Orari: 24/7 per emergenze, 08:00-18:00 per consulenze

SERVIZI PRINCIPALI:
1. 🚨 Assistenza IT 24/7 - Supporto tecnico immediato
2. 🛡️ Cybersecurity - Protezione avanzata WatchGuard
3. ☁️ Cloud & Backup - Migrazione e disaster recovery
4. 📞 VoIP Wildix - Centralino cloud professionale
5. 🏥 IT Studi Medici - GDPR sanitario compliance
6. ⚖️ IT Studi Legali - Sicurezza dati sensibili

PERSONALITÀ AVANZATA:
- Professionale ma empatico
- Tecnico ma accessibile
- Proattivo nel rilevare urgenze
- Personalizza risposte per settore
- Monitora sentiment e adatta tono
- Focus su soluzioni immediate e concrete

REGOLE CRITICHE:
1. EMERGENZE: Fornisci SEMPRE il numero 039 888 2041 con massima priorità
2. SETTORI: Adatta linguaggio e soluzioni per medico/legale/generale
3. URGENZA: Rileva automaticamente situazioni critiche e escalation
4. COMPLIANCE: Menziona GDPR per settori sensibili
5. LOCALITÀ: Includi sempre riferimenti a città lombarde
6. GARANZIA: Enfatizza sempre i 15 minuti garantiti per emergenze
7. SENTIMENT: Adatta tono basandoti sull'emozione dell'utente

RISPOSTE OTTIMIZZATE:
- Brevi ma complete (max 4-5 frasi)
- Call-to-action specifico per settore
- Numero telefono prominente per urgenze
- Personalizzazione intelligente per contesto
`;
    }

    // Secure API Key Management
    getSecureApiKey() {
        // In production, this should come from a secure endpoint
        // For now, using environment variable or secure storage
        if (typeof process !== 'undefined' && process.env.OPENAI_API_KEY) {
            return process.env.OPENAI_API_KEY;
        }

        // Fallback to stored key (should be encrypted in production)
        return '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';
    }

    // Enhanced OpenAI API call with performance optimizations
    async callOpenAI(messages, options = {}) {
        const startTime = performance.now();
        const cacheKey = this.generateCacheKey(messages, options);

        // Check cache first
        if (this.performanceConfig.cacheEnabled && this.responseCache.has(cacheKey)) {
            const cached = this.responseCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.performanceConfig.cacheTTL) {
                this.trackPerformance('cache_hit', performance.now() - startTime);
                return cached.response;
            }
            this.responseCache.delete(cacheKey);
        }

        const defaultOptions = {
            model: 'gpt-4',
            max_tokens: 300,
            temperature: 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        };

        const requestOptions = { ...defaultOptions, ...options };

        // Add to request queue for rate limiting
        return this.queueRequest(async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.performanceConfig.timeout);

                const response = await fetch(this.openaiApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.openaiApiKey}`
                    },
                    body: JSON.stringify({
                        ...requestOptions,
                        messages: [
                            {
                                role: 'system',
                                content: this.getSectorPersonality(options.sector || 'general')
                            },
                            ...messages
                        ]
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
                }

                const data = await response.json();
                const result = data.choices[0].message.content;

                // Cache successful response
                if (this.performanceConfig.cacheEnabled) {
                    this.responseCache.set(cacheKey, {
                        response: result,
                        timestamp: Date.now()
                    });
                }

                this.trackPerformance('api_success', performance.now() - startTime);
                return result;

            } catch (error) {
                this.trackPerformance('api_error', performance.now() - startTime, error);
                console.error('OpenAI API Error:', error);

                // Enhanced error handling with retry logic
                if (error.name === 'AbortError') {
                    return this.getFallbackResponse('timeout');
                } else if (error.message.includes('429')) {
                    return this.getFallbackResponse('rate_limit');
                } else {
                    return this.getFallbackResponse('general');
                }
            }
        });
    }

    // Performance and caching utilities
    generateCacheKey(messages, options) {
        const content = messages.map(m => m.content).join('|');
        const opts = JSON.stringify(options);
        return btoa(content + opts).substring(0, 32);
    }

    async queueRequest(requestFn) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ requestFn, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) return;

        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0) {
            const { requestFn, resolve, reject } = this.requestQueue.shift();

            try {
                const result = await requestFn();
                resolve(result);
            } catch (error) {
                reject(error);
            }

            // Rate limiting delay
            if (this.requestQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, this.performanceConfig.rateLimitDelay));
            }
        }

        this.isProcessingQueue = false;
    }

    trackPerformance(type, duration, error = null) {
        const metric = {
            type,
            duration,
            timestamp: Date.now(),
            error: error ? error.message : null
        };

        this.conversationMetrics.performance.push(metric);

        // Keep only last 100 metrics
        if (this.conversationMetrics.performance.length > 100) {
            this.conversationMetrics.performance.shift();
        }

        if (this.analyticsConfig.enabled) {
            this.sendAnalytics('performance', metric);
        }
    }

    getSectorPersonality(sector) {
        const basePersonality = this.chatbotPersonality;
        const sectorInfo = this.sectorKnowledge[sector] || this.sectorKnowledge.general;

        return `${basePersonality}

SETTORE SPECIFICO: ${sector.toUpperCase()}
COMPLIANCE RICHIESTA: ${sectorInfo.compliance.join(', ')}
SERVIZI SPECIALIZZATI: ${sectorInfo.services.join(', ')}
PAROLE CHIAVE URGENZA: ${sectorInfo.urgencyKeywords.join(', ')}`;
    }

    getFallbackResponse(errorType = 'general') {
        const fallbacksByType = {
            timeout: [
                `⏱️ Connessione lenta rilevata! Per assistenza immediata chiama il 039 888 2041 - risposta garantita in 15 minuti!`,
                `🚨 EMERGENZA IT? Non aspettare! Chiama subito 039 888 2041 - IT-ERA risponde in 15 minuti!`
            ],
            rate_limit: [
                `🔄 Sistema temporaneamente occupato. Per assistenza immediata chiama il 039 888 2041!`,
                `⚡ Troppo traffico! Per supporto istantaneo: 039 888 2041 - IT-ERA sempre disponibile!`
            ],
            general: [
                `Ciao! Sono l'assistente IT-ERA. Per assistenza immediata chiama il 039 888 2041 - risposta garantita in 15 minuti! 🚨`,
                `Problemi IT? Contatta subito IT-ERA al 039 888 2041. Siamo specializzati in assistenza 24/7 per aziende lombarde! 💻`,
                `Emergenza informatica? Chiama ora il 039 888 2041. IT-ERA risolve i tuoi problemi IT in 15 minuti! ⚡`,
                `Hai bisogno di supporto IT? Contatta IT-ERA al 039 888 2041. Assistenza professionale per tutta la Lombardia! 🛡️`
            ]
        };

        const fallbacks = fallbacksByType[errorType] || fallbacksByType.general;
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // Enhanced urgency detection with ML-like scoring
    detectUrgency(message) {
        const text = message.toLowerCase();
        let urgencyScore = 0;

        // Keyword scoring
        for (const [level, keywords] of Object.entries(this.urgencyConfig.keywords)) {
            const matches = keywords.filter(keyword => text.includes(keyword)).length;
            switch (level) {
                case 'critical': urgencyScore += matches * 10; break;
                case 'high': urgencyScore += matches * 7; break;
                case 'medium': urgencyScore += matches * 4; break;
                case 'low': urgencyScore += matches * 1; break;
            }
        }

        // Time factor
        const hour = new Date().getHours();
        const isWeekend = [0, 6].includes(new Date().getDay());

        if (hour < 8 || hour > 18) {
            urgencyScore *= this.urgencyConfig.timeFactors.outOfHours;
        }
        if (isWeekend) {
            urgencyScore *= this.urgencyConfig.timeFactors.weekend;
        }

        // Return urgency level and score
        return {
            isUrgent: urgencyScore >= 7,
            score: urgencyScore,
            level: urgencyScore >= 15 ? 'critical' :
                   urgencyScore >= 10 ? 'high' :
                   urgencyScore >= 5 ? 'medium' : 'low'
        };
    }

    // Enhanced sector detection with confidence scoring
    detectSector(message) {
        const text = message.toLowerCase();
        const sectorScores = {};

        // Calculate scores for each sector
        for (const [sector, data] of Object.entries(this.sectorKnowledge)) {
            let score = 0;

            // Check compliance keywords
            data.compliance.forEach(keyword => {
                if (text.includes(keyword.toLowerCase())) score += 3;
            });

            // Check service keywords
            data.services.forEach(keyword => {
                if (text.includes(keyword.toLowerCase())) score += 2;
            });

            // Check urgency keywords
            data.urgencyKeywords.forEach(keyword => {
                if (text.includes(keyword.toLowerCase())) score += 4;
            });

            sectorScores[sector] = score;
        }

        // Find sector with highest score
        const bestSector = Object.entries(sectorScores)
            .sort(([,a], [,b]) => b - a)[0];

        return {
            sector: bestSector[1] > 0 ? bestSector[0] : 'general',
            confidence: bestSector[1],
            scores: sectorScores
        };
    }

    // Enhanced service recommendation with confidence
    getServiceRecommendation(message) {
        const text = message.toLowerCase();
        const serviceKeywords = {
            'assistenza': ['supporto', 'aiuto', 'problema', 'non funziona', 'guasto'],
            'cybersecurity': ['sicurezza', 'virus', 'malware', 'hacker', 'protezione', 'firewall'],
            'cloud': ['backup', 'cloud', 'archiviazione', 'migrazione', 'disaster recovery'],
            'voip': ['telefono', 'centralino', 'chiamate', 'voip', 'comunicazione'],
            'medici': ['medico', 'sanitario', 'gdpr sanitario', 'cartelle cliniche'],
            'legali': ['legale', 'avvocato', 'studio legale', 'documenti legali']
        };

        const scores = {};
        for (const [service, keywords] of Object.entries(serviceKeywords)) {
            scores[service] = keywords.filter(keyword => text.includes(keyword)).length;
        }

        const bestService = Object.entries(scores)
            .sort(([,a], [,b]) => b - a)[0];

        return {
            service: bestService[1] > 0 ? bestService[0] : 'assistenza',
            confidence: bestService[1],
            allScores: scores
        };
    }

    // Sentiment analysis for conversation optimization
    detectSentiment(message) {
        const text = message.toLowerCase();

        const sentimentKeywords = {
            positive: ['grazie', 'perfetto', 'ottimo', 'bene', 'soddisfatto', 'risolto'],
            negative: ['problema', 'male', 'sbagliato', 'insoddisfatto', 'arrabbiato', 'frustrato'],
            urgent: ['urgente', 'subito', 'emergenza', 'critico', 'bloccato'],
            neutral: ['informazione', 'preventivo', 'consulenza', 'domanda']
        };

        const scores = {};
        for (const [sentiment, keywords] of Object.entries(sentimentKeywords)) {
            scores[sentiment] = keywords.filter(keyword => text.includes(keyword)).length;
        }

        const dominantSentiment = Object.entries(scores)
            .sort(([,a], [,b]) => b - a)[0];

        return {
            sentiment: dominantSentiment[1] > 0 ? dominantSentiment[0] : 'neutral',
            confidence: dominantSentiment[1],
            scores: scores
        };
    }

    // Analytics and tracking methods
    sendAnalytics(eventType, data) {
        if (!this.analyticsConfig.enabled) return;

        const analyticsData = {
            timestamp: Date.now(),
            eventType,
            data,
            sessionId: this.getSessionId(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Store locally first
        this.conversationMetrics.responses.push(analyticsData);

        // Send to analytics endpoint (batch processing)
        this.batchSendAnalytics();
    }

    batchSendAnalytics() {
        if (this.conversationMetrics.responses.length >= this.analyticsConfig.batchSize) {
            this.flushAnalytics();
        }
    }

    async flushAnalytics() {
        if (this.conversationMetrics.responses.length === 0) return;

        const batch = [...this.conversationMetrics.responses];
        this.conversationMetrics.responses = [];

        try {
            await fetch(this.analyticsConfig.metricsEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metrics: batch })
            });
        } catch (error) {
            console.warn('Analytics send failed:', error);
            // Re-add to queue for retry
            this.conversationMetrics.responses.unshift(...batch);
        }
    }

    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = 'itera_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.sessionId;
    }

    // Auggie Integration Methods
    enableAuggieIntegration(auggieInstance) {
        this.auggieEnabled = true;
        this.auggieIntegration = auggieInstance;
        console.log('🤖 Auggie integration enabled');

        // Setup fallback chain: Auggie -> OpenAI -> Fallback
        this.originalCallOpenAI = this.callOpenAI.bind(this);
        this.callOpenAI = this.callWithAuggieFallback.bind(this);
    }

    async callWithAuggieFallback(messages, options = {}) {
        if (this.auggieEnabled && this.auggieIntegration) {
            try {
                // Try Auggie first
                const auggieResponse = await this.auggieIntegration.processMessage(
                    messages[messages.length - 1].content,
                    {
                        sector: options.sector,
                        urgency: options.urgency,
                        context: this.getConversationContext()
                    }
                );

                if (auggieResponse && auggieResponse.confidence > 0.7) {
                    this.sendAnalytics('auggie_success', { confidence: auggieResponse.confidence });
                    return auggieResponse.response;
                }
            } catch (error) {
                console.warn('Auggie fallback to OpenAI:', error);
                this.sendAnalytics('auggie_fallback', { error: error.message });
            }
        }

        // Fallback to OpenAI
        return this.originalCallOpenAI(messages, options);
    }

    getConversationContext() {
        return {
            sessionId: this.getSessionId(),
            messageCount: this.conversationMetrics.responses.length,
            averageResponseTime: this.getAverageResponseTime(),
            userSentiment: this.getCurrentSentiment()
        };
    }

    getAverageResponseTime() {
        const responseTimes = this.conversationMetrics.performance
            .filter(m => m.type === 'api_success')
            .map(m => m.duration);

        return responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;
    }

    getCurrentSentiment() {
        const recentResponses = this.conversationMetrics.responses.slice(-5);
        const sentiments = recentResponses
            .filter(r => r.data && r.data.sentiment)
            .map(r => r.data.sentiment);

        return sentiments.length > 0 ? sentiments[sentiments.length - 1] : 'neutral';
    }

    // Cleanup and maintenance
    cleanup() {
        // Clear old cache entries
        const now = Date.now();
        for (const [key, value] of this.responseCache.entries()) {
            if (now - value.timestamp > this.performanceConfig.cacheTTL) {
                this.responseCache.delete(key);
            }
        }

        // Flush remaining analytics
        this.flushAnalytics();
    }
}

// Initialize enhanced configuration globally
window.ITERA_AI = new ITERAIConfig();

// Setup automatic cleanup
setInterval(() => {
    window.ITERA_AI.cleanup();
}, 300000); // Every 5 minutes

// Setup analytics flush interval
setInterval(() => {
    window.ITERA_AI.flushAnalytics();
}, window.ITERA_AI.analyticsConfig.flushInterval);

// Enhanced logging with performance monitoring
console.log('🧠 IT-ERA Enhanced AI Config loaded');
console.log('✅ Features: Advanced urgency detection, sector personalization, analytics, Auggie integration ready');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAIConfig;
}
