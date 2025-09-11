/**
 * IT-ERA Smart Chatbot with OpenAI GPT Integration
 * Advanced AI-powered customer support
 */

class ITERASmartChatbot {
    constructor() {
        this.isInitialized = false;
        this.conversationHistory = [];
        this.userSession = this.generateSessionId();
        this.isTyping = false;
        
        // Inizializza quando la pagina è caricata
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    generateSessionId() {
        return 'itera_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    init() {
        if (this.isInitialized) return;
        
        console.log('🤖 Inizializzazione IT-ERA Smart Chatbot...');
        
        // Aspetta che Tawk.to sia caricato
        this.waitForTawkTo(() => {
            this.enhanceTawkTo();
            this.setupCustomHandlers();
            this.isInitialized = true;
            console.log('✅ IT-ERA Smart Chatbot inizializzato con successo');
        });
    }
    
    waitForTawkTo(callback, maxAttempts = 50) {
        let attempts = 0;
        
        const checkTawk = () => {
            attempts++;
            
            if (window.Tawk_API && window.Tawk_API.onLoad) {
                callback();
            } else if (attempts < maxAttempts) {
                setTimeout(checkTawk, 200);
            } else {
                console.warn('⚠️ Tawk.to non trovato, attivazione chatbot standalone');
                this.createStandaloneChatbot();
            }
        };
        
        checkTawk();
    }
    
    enhanceTawkTo() {
        // Personalizza Tawk.to con AI
        window.Tawk_API.onLoad = () => {
            console.log('🚀 Tawk.to caricato, attivazione AI...');
            
            // Personalizza il widget
            window.Tawk_API.setAttributes({
                'name': 'Visitatore IT-ERA',
                'email': '',
                'company': '',
                'sector': 'general'
            });
            
            // Messaggio di benvenuto intelligente
            this.sendWelcomeMessage();
        };
        
        // Intercetta messaggi utente per AI processing
        window.Tawk_API.onChatMessageVisitor = (message) => {
            this.processUserMessage(message.text);
        };
        
        // Gestisci inizio chat
        window.Tawk_API.onChatStarted = () => {
            console.log('💬 Chat iniziata con IT-ERA Smart Bot');
            this.conversationHistory = [];
        };
    }
    
    async sendWelcomeMessage() {
        const hour = new Date().getHours();
        let greeting = 'Buongiorno';
        
        if (hour >= 12 && hour < 18) greeting = 'Buon pomeriggio';
        else if (hour >= 18) greeting = 'Buonasera';
        
        const welcomeMessage = `${greeting}! 👋 Sono l'assistente virtuale di IT-ERA.

🚨 **EMERGENZA IT?** Chiama subito: **039 888 2041**
⚡ Risposta garantita in 15 minuti!

Come posso aiutarti oggi? Scrivi il tuo problema e ti fornirò supporto immediato! 💻`;
        
        // Invia messaggio tramite Tawk.to
        if (window.Tawk_API && window.Tawk_API.addEvent) {
            window.Tawk_API.addEvent({
                event: 'welcome_message',
                metadata: {
                    message: welcomeMessage,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
    
    async processUserMessage(message) {
        if (this.isTyping) return;
        
        console.log('📝 Messaggio utente:', message);
        
        // Aggiungi alla cronologia
        this.conversationHistory.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });
        
        // Analizza il messaggio
        const analysis = this.analyzeMessage(message);
        
        // Mostra indicatore di digitazione
        this.showTypingIndicator();
        
        try {
            // Genera risposta AI
            const aiResponse = await this.generateAIResponse(message, analysis);
            
            // Invia risposta
            await this.sendBotResponse(aiResponse, analysis);
            
        } catch (error) {
            console.error('❌ Errore AI Response:', error);
            await this.sendFallbackResponse(analysis);
        } finally {
            this.hideTypingIndicator();
        }
    }
    
    analyzeMessage(message) {
        // Enhanced analysis with new AI capabilities
        const urgencyAnalysis = window.ITERA_AI.detectUrgency(message);
        const sectorAnalysis = window.ITERA_AI.detectSector(message);
        const serviceAnalysis = window.ITERA_AI.getServiceRecommendation(message);
        const sentimentAnalysis = window.ITERA_AI.detectSentiment(message);

        const analysis = {
            // Enhanced urgency with scoring
            isUrgent: urgencyAnalysis.isUrgent || urgencyAnalysis.score >= 7,
            urgencyScore: urgencyAnalysis.score,
            urgencyLevel: urgencyAnalysis.level,

            // Enhanced sector detection
            sector: sectorAnalysis.sector || sectorAnalysis,
            sectorConfidence: sectorAnalysis.confidence || 0,

            // Enhanced service recommendation
            recommendedService: serviceAnalysis.service || serviceAnalysis,
            serviceConfidence: serviceAnalysis.confidence || 0,

            // Enhanced sentiment
            sentiment: sentimentAnalysis.sentiment || this.detectSentiment(message),
            sentimentConfidence: sentimentAnalysis.confidence || 0,

            // Traditional analysis for backward compatibility
            intent: this.detectIntent(message),

            // New analytics data
            timestamp: Date.now(),
            messageLength: message.length,
            hasEmergencyKeywords: this.hasEmergencyKeywords(message)
        };

        // Track analysis for analytics
        if (window.ITERA_AI.analyticsConfig.enabled) {
            window.ITERA_AI.sendAnalytics('message_analysis', analysis);
        }

        console.log('🔍 Enhanced message analysis:', analysis);
        return analysis;
    }

    // Enhanced emergency detection
    hasEmergencyKeywords(message) {
        const emergencyKeywords = [
            'emergenza', 'emergency', 'urgente', 'subito', 'immediato',
            'bloccato', 'down', 'non funziona', 'hackerato', 'virus',
            'ransomware', 'attacco', 'sicurezza compromessa', 'dati persi',
            'server down', 'rete down', 'email down', 'sistema compromesso'
        ];

        return emergencyKeywords.some(keyword =>
            message.toLowerCase().includes(keyword)
        );
    }

    // Enhanced urgency escalation
    handleUrgentMessage(analysis) {
        if (analysis.urgencyLevel === 'critical' || analysis.urgencyScore >= 15) {
            // Critical urgency - immediate escalation
            this.triggerEmergencyProtocol(analysis);
            return true;
        } else if (analysis.isUrgent || analysis.urgencyScore >= 7) {
            // High urgency - priority handling
            this.triggerPriorityHandling(analysis);
            return true;
        }
        return false;
    }

    triggerEmergencyProtocol(analysis) {
        console.log('🚨 EMERGENCY PROTOCOL TRIGGERED:', analysis);

        // Show emergency contact immediately
        this.showEmergencyContact();

        // Track emergency event
        if (window.ITERA_AI.analyticsConfig.enabled) {
            window.ITERA_AI.sendAnalytics('emergency_triggered', {
                urgencyScore: analysis.urgencyScore,
                sector: analysis.sector,
                timestamp: Date.now()
            });
        }

        // Auto-escalate to human if available
        this.escalateToHuman(analysis);
    }

    triggerPriorityHandling(analysis) {
        console.log('⚡ PRIORITY HANDLING ACTIVATED:', analysis);

        // Reduce response time
        this.priorityMode = true;

        // Track priority event
        if (window.ITERA_AI.analyticsConfig.enabled) {
            window.ITERA_AI.sendAnalytics('priority_triggered', {
                urgencyScore: analysis.urgencyScore,
                sector: analysis.sector
            });
        }
    }

    showEmergencyContact() {
        const emergencyWidget = document.createElement('div');
        emergencyWidget.className = 'emergency-contact-widget';
        emergencyWidget.innerHTML = `
            <div class="emergency-alert">
                <h3>🚨 EMERGENZA IT RILEVATA</h3>
                <p><strong>Chiama IMMEDIATAMENTE:</strong></p>
                <a href="tel:0398882041" class="emergency-phone">039 888 2041</a>
                <p class="emergency-guarantee">⚡ Risposta garantita in 15 minuti!</p>
            </div>
        `;

        // Insert at top of chat
        const chatContainer = document.querySelector('.chat-messages') || document.body;
        chatContainer.insertBefore(emergencyWidget, chatContainer.firstChild);

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (emergencyWidget.parentNode) {
                emergencyWidget.parentNode.removeChild(emergencyWidget);
            }
        }, 30000);
    }

    escalateToHuman(analysis) {
        // In a real implementation, this would connect to a human operator
        console.log('👤 Escalating to human operator:', analysis);

        // For now, just show a message
        this.addSystemMessage(`
            🔄 **Escalation in corso...**

            La tua richiesta è stata classificata come emergenza e inoltrata al nostro team tecnico.

            **Contatta immediatamente: 039 888 2041**
        `);
    }

    addSystemMessage(message) {
        if (window.Tawk_API && window.Tawk_API.addEvent) {
            window.Tawk_API.addEvent({
                event: 'system_message',
                metadata: {
                    message: message,
                    timestamp: new Date().toISOString(),
                    type: 'escalation'
                }
            });
        }
    }

    detectSentiment(message) {
        const positiveWords = ['grazie', 'perfetto', 'ottimo', 'bene', 'soddisfatto'];
        const negativeWords = ['problema', 'errore', 'non funziona', 'bloccato', 'frustrato'];
        
        const positive = positiveWords.some(word => message.toLowerCase().includes(word));
        const negative = negativeWords.some(word => message.toLowerCase().includes(word));
        
        if (positive && !negative) return 'positive';
        if (negative && !positive) return 'negative';
        return 'neutral';
    }
    
    detectIntent(message) {
        const intents = {
            'get_info': ['info', 'informazioni', 'cosa', 'come', 'quando'],
            'request_support': ['aiuto', 'supporto', 'problema', 'assistenza'],
            'get_quote': ['preventivo', 'prezzo', 'costo', 'quanto'],
            'emergency': ['emergenza', 'urgente', 'subito', 'immediato'],
            'contact': ['contatto', 'telefono', 'email', 'chiamare']
        };
        
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
                return intent;
            }
        }
        
        return 'general';
    }
    
    async generateAIResponse(message, analysis) {
        const startTime = performance.now();

        // Handle urgent messages first
        const isHandledUrgent = this.handleUrgentMessage(analysis);

        // Prepare enhanced context for AI
        const enhancedContext = this.buildEnhancedContext(message, analysis);

        const messages = [
            ...this.conversationHistory.slice(-5), // Last 5 messages for context
            {
                role: 'user',
                content: enhancedContext
            }
        ];

        // Determine AI options based on analysis
        const aiOptions = this.getAIOptions(analysis);

        try {
            const response = await window.ITERA_AI.callOpenAI(messages, aiOptions);

            // Post-process response based on analysis
            const enhancedResponse = this.enhanceResponse(response, analysis);

            // Add to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: enhancedResponse,
                timestamp: new Date().toISOString(),
                analysis: analysis,
                responseTime: performance.now() - startTime
            });

            // Track response analytics
            if (window.ITERA_AI.analyticsConfig.enabled) {
                window.ITERA_AI.sendAnalytics('ai_response_generated', {
                    responseTime: performance.now() - startTime,
                    urgencyLevel: analysis.urgencyLevel,
                    sector: analysis.sector,
                    responseLength: enhancedResponse.length
                });
            }

            return enhancedResponse;

        } catch (error) {
            console.error('❌ AI Response generation failed:', error);

            // Enhanced fallback based on analysis
            return this.getEnhancedFallback(analysis, error);
        }
    }

    buildEnhancedContext(message, analysis) {
        return `${message}

ANALISI AVANZATA:
- Urgenza: ${analysis.urgencyLevel} (Score: ${analysis.urgencyScore})
- Settore: ${analysis.sector} (Confidence: ${analysis.sectorConfidence})
- Servizio: ${analysis.recommendedService} (Confidence: ${analysis.serviceConfidence})
- Sentiment: ${analysis.sentiment} (Confidence: ${analysis.sentimentConfidence})
- Intent: ${analysis.intent}
- Emergenza: ${analysis.hasEmergencyKeywords ? 'SÌ' : 'NO'}
- Lunghezza messaggio: ${analysis.messageLength}

ISTRUZIONI SPECIFICHE:
${this.getContextualInstructions(analysis)}`;
    }

    getContextualInstructions(analysis) {
        let instructions = [];

        if (analysis.urgencyLevel === 'critical') {
            instructions.push('- PRIORITÀ MASSIMA: Fornisci numero emergenza 039 888 2041 IMMEDIATAMENTE');
            instructions.push('- Usa tono urgente ma professionale');
            instructions.push('- Menziona garanzia 15 minuti');
        }

        if (analysis.sector === 'medical') {
            instructions.push('- Menziona compliance GDPR sanitario');
            instructions.push('- Enfatizza sicurezza dati pazienti');
            instructions.push('- Usa terminologia medica appropriata');
        } else if (analysis.sector === 'legal') {
            instructions.push('- Menziona compliance GDPR legale');
            instructions.push('- Enfatizza riservatezza documenti');
            instructions.push('- Usa terminologia legale appropriata');
        }

        if (analysis.sentiment === 'negative') {
            instructions.push('- Usa tono empatico e rassicurante');
            instructions.push('- Offri soluzioni immediate');
        }

        return instructions.join('\n');
    }

    getAIOptions(analysis) {
        const baseOptions = {
            max_tokens: 250,
            temperature: 0.7,
            sector: analysis.sector
        };

        // Adjust based on urgency
        if (analysis.urgencyLevel === 'critical') {
            baseOptions.max_tokens = 150; // Shorter, more direct
            baseOptions.temperature = 0.5; // More focused
        } else if (analysis.urgencyLevel === 'high') {
            baseOptions.max_tokens = 200;
            baseOptions.temperature = 0.6;
        }

        // Adjust based on sentiment
        if (analysis.sentiment === 'negative') {
            baseOptions.temperature = 0.8; // More empathetic
        }

        return baseOptions;
    }

    enhanceResponse(response, analysis) {
        let enhanced = response;

        // Add emergency contact for urgent situations
        if (analysis.urgencyLevel === 'critical' && !enhanced.includes('039 888 2041')) {
            enhanced = `🚨 **EMERGENZA**: Chiama subito 039 888 2041!\n\n${enhanced}`;
        }

        // Add sector-specific compliance notes
        if (analysis.sector === 'medical' && !enhanced.includes('GDPR')) {
            enhanced += '\n\n🏥 *IT-ERA garantisce compliance GDPR sanitario.*';
        } else if (analysis.sector === 'legal' && !enhanced.includes('GDPR')) {
            enhanced += '\n\n⚖️ *IT-ERA assicura compliance GDPR legale.*';
        }

        return enhanced;
    }

    getEnhancedFallback(analysis, error) {
        if (analysis.urgencyLevel === 'critical') {
            return `🚨 **EMERGENZA IT RILEVATA**

Sistema temporaneamente non disponibile, ma la tua emergenza è prioritaria!

**CHIAMA IMMEDIATAMENTE: 039 888 2041**
⚡ Risposta garantita in 15 minuti!

IT-ERA è sempre pronto per le emergenze informatiche!`;
        }

        return window.ITERA_AI.getFallbackResponse(error.name === 'AbortError' ? 'timeout' : 'general');
    }

    async sendBotResponse(response, analysis) {
        // Aggiungi emoji e formattazione basata sull'analisi
        let formattedResponse = response;
        
        if (analysis.isUrgent) {
            formattedResponse = `🚨 **EMERGENZA RILEVATA** 🚨\n\n${response}\n\n📞 **CHIAMA SUBITO: 039 888 2041**`;
        }
        
        // Aggiungi CTA specifico per settore
        if (analysis.sector === 'medical') {
            formattedResponse += '\n\n🏥 Specializzati in GDPR sanitario e sistemi medici';
        } else if (analysis.sector === 'legal') {
            formattedResponse += '\n\n⚖️ Esperti in sicurezza dati per studi legali';
        }
        
        // Invia tramite Tawk.to o chatbot standalone
        if (window.Tawk_API && window.Tawk_API.addEvent) {
            window.Tawk_API.addEvent({
                event: 'ai_response',
                metadata: {
                    message: formattedResponse,
                    analysis: analysis,
                    timestamp: new Date().toISOString()
                }
            });
        }
        
        console.log('🤖 Risposta AI inviata:', formattedResponse);
    }
    
    async sendFallbackResponse(analysis) {
        let fallback = window.ITERA_AI.getFallbackResponse();
        
        if (analysis.isUrgent) {
            fallback = `🚨 **EMERGENZA IT RILEVATA** 🚨\n\nChiama IMMEDIATAMENTE: **039 888 2041**\nRisposta garantita in 15 minuti!\n\nIT-ERA è sempre pronto per le tue emergenze informatiche! ⚡`;
        }
        
        await this.sendBotResponse(fallback, analysis);
    }
    
    showTypingIndicator() {
        this.isTyping = true;

        // Create enhanced typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.id = 'typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        // Add to chat messages
        const messagesContainer = this.getMessagesContainer();
        if (messagesContainer) {
            messagesContainer.appendChild(typingIndicator);
            this.scrollToBottom();
        }

        // Send via Tawk.to if available
        if (window.Tawk_API && window.Tawk_API.addEvent) {
            window.Tawk_API.addEvent({
                event: 'typing_indicator',
                metadata: {
                    status: 'started',
                    timestamp: new Date().toISOString()
                }
            });
        }

        console.log('💬 Enhanced typing indicator shown');
    }

    hideTypingIndicator() {
        this.isTyping = false;

        // Remove typing indicator
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }

        // Send via Tawk.to if available
        if (window.Tawk_API && window.Tawk_API.addEvent) {
            window.Tawk_API.addEvent({
                event: 'typing_indicator',
                metadata: {
                    status: 'stopped',
                    timestamp: new Date().toISOString()
                }
            });
        }

        console.log('💬 Enhanced typing indicator hidden');
    }

    getMessagesContainer() {
        // Try to find messages container in different chatbot implementations
        return document.querySelector('.chat-messages') ||
               document.querySelector('.chatbot-messages') ||
               document.querySelector('#chat-messages') ||
               document.querySelector('.tawk-messages');
    }

    scrollToBottom() {
        const container = this.getMessagesContainer();
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    createStandaloneChatbot() {
        // Crea chatbot standalone se Tawk.to non è disponibile
        console.log('🔧 Creazione chatbot standalone...');
        
        const chatWidget = document.createElement('div');
        chatWidget.id = 'itera-standalone-chat';
        chatWidget.innerHTML = `
            <div class="chat-widget">
                <div class="chat-header">
                    <h4>💬 IT-ERA Assistant</h4>
                    <span class="chat-status">🟢 Online</span>
                </div>
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" id="chat-input" placeholder="Scrivi il tuo problema IT...">
                    <button id="chat-send">📤</button>
                </div>
            </div>
        `;
        
        // Aggiungi stili
        const styles = `
            <style>
            #itera-standalone-chat {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                z-index: 9999;
                font-family: Inter, sans-serif;
            }
            .chat-widget { height: 100%; display: flex; flex-direction: column; }
            .chat-header { background: #0056cc; color: white; padding: 15px; border-radius: 10px 10px 0 0; }
            .chat-messages { flex: 1; padding: 15px; overflow-y: auto; }
            .chat-input { display: flex; padding: 15px; border-top: 1px solid #eee; }
            #chat-input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            #chat-send { margin-left: 10px; padding: 10px 15px; background: #0056cc; color: white; border: none; border-radius: 5px; cursor: pointer; }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.appendChild(chatWidget);
        
        // Setup event handlers per chatbot standalone
        this.setupStandaloneChatHandlers();
    }
    
    setupStandaloneChatHandlers() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        const messages = document.getElementById('chat-messages');
        
        const sendMessage = async () => {
            const message = input.value.trim();
            if (!message) return;
            
            // Aggiungi messaggio utente
            messages.innerHTML += `<div class="user-message"><strong>Tu:</strong> ${message}</div>`;
            input.value = '';
            
            // Processa con AI
            await this.processUserMessage(message);
        };
        
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    setupCustomHandlers() {
        // Setup handlers personalizzati per analytics e tracking
        document.addEventListener('click', (e) => {
            if (e.target.matches('[href^="tel:"]')) {
                this.trackEvent('phone_click', {
                    number: e.target.href.replace('tel:', ''),
                    source: 'chatbot_recommendation'
                });
            }
        });
    }
    
    trackEvent(eventName, data) {
        // Google Analytics tracking
        if (window.gtag) {
            window.gtag('event', eventName, {
                event_category: 'chatbot',
                event_label: 'ai_interaction',
                custom_parameters: data
            });
        }
        
        console.log('📊 Event tracked:', eventName, data);
    }
}

// Inizializza il chatbot quando la pagina è pronta
window.ITERASmartChatbot = new ITERASmartChatbot();

// Export per testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERASmartChatbot;
}
