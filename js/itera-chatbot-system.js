/**
 * IT-ERA Unified Chatbot System
 * Integrazione completa con analytics, Resend, AI e sistema esistente
 * Versione unificata che sostituisce chat-widget-loader.js e smart-chatbot.js
 */

class ITERAChatbotSystem {
    constructor() {
        this.isInitialized = false;
        this.isVisible = false;
        this.conversationId = this.generateConversationId();
        this.messageHistory = [];
        this.userProfile = {};
        
        // Configurazione integrata
        this.config = {
            // UI Configuration
            position: 'bottom-right',
            theme: 'it-era-professional',
            autoOpen: false,
            showWelcome: true,
            minimized: true,
            
            // AI Configuration
            useAI: true,
            maxRetries: 3,
            timeout: 15000,
            fallbackEnabled: true,
            
            // Emergency Detection
            emergencyKeywords: [
                'emergenza', 'urgente', 'critico', 'bloccato', 'non funziona',
                'virus', 'hacker', 'rubati', 'perso', 'cancellato', 'rotto',
                'server down', 'rete down', 'backup', 'recupero dati'
            ],
            
            // Business Hours
            businessHours: {
                start: 8,
                end: 18,
                timezone: 'Europe/Rome'
            }
        };
        
        // Integrazione con sistemi esistenti
        this.analytics = null;
        this.resendIntegration = null;
        this.secureConfig = null;
        this.aiConfig = null;
        
        this.init();
    }
    
    generateConversationId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async init() {
        if (this.isInitialized) return;
        
        console.log('🤖 Initializing IT-ERA Unified Chatbot System...');
        
        // Aspetta che i sistemi esistenti siano caricati
        await this.waitForDependencies();
        
        // Integra con sistemi esistenti
        this.integrateWithExistingSystems();
        
        // Crea l'interfaccia chatbot
        this.createChatInterface();
        
        // Inizializza funzionalità
        this.initializeFeatures();
        
        // Setup event listeners
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('✅ IT-ERA Chatbot System initialized successfully');
        
        // Track initialization
        this.trackEvent('chatbot_initialized', {
            conversation_id: this.conversationId,
            timestamp: new Date().toISOString()
        });
    }
    
    async waitForDependencies() {
        // Aspetta che i sistemi esistenti siano caricati
        const maxWait = 10000; // 10 secondi
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (window.ITERAAnalytics && 
                window.ITERAResendIntegration && 
                window.ITERASecureConfig) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    integrateWithExistingSystems() {
        // Integrazione con Analytics
        this.analytics = window.ITERAAnalytics;
        
        // Integrazione con Resend
        this.resendIntegration = window.ITERAResendIntegration;
        
        // Integrazione con Secure Config
        this.secureConfig = window.ITERASecureConfig;
        
        // Integrazione con AI Config (se disponibile)
        this.aiConfig = window.ITERAIConfig || null;
        
        console.log('🔗 Integrated with existing systems:', {
            analytics: !!this.analytics,
            resend: !!this.resendIntegration,
            secureConfig: !!this.secureConfig,
            aiConfig: !!this.aiConfig
        });
    }
    
    createChatInterface() {
        // Rimuovi chatbot esistenti
        const existingWidgets = document.querySelectorAll('[id*="chat"], [id*="tawk"]');
        existingWidgets.forEach(widget => widget.remove());
        
        // Crea il nuovo widget
        const chatWidget = document.createElement('div');
        chatWidget.id = 'itera-chatbot-system';
        chatWidget.className = 'itera-chatbot-widget';
        
        chatWidget.innerHTML = `
            <!-- Chat Toggle Button -->
            <div class="chat-toggle ${this.config.minimized ? 'minimized' : ''}" id="chat-toggle">
                <div class="chat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <div class="chat-badge" id="chat-badge">
                    <span class="badge-text">💬</span>
                </div>
                <div class="chat-status">
                    <span class="status-dot"></span>
                    <span class="status-text">Online</span>
                </div>
            </div>
            
            <!-- Chat Window -->
            <div class="chat-window ${this.config.minimized ? 'hidden' : ''}" id="chat-window">
                <!-- Header -->
                <div class="chat-header">
                    <div class="header-info">
                        <div class="company-logo">🏢</div>
                        <div class="header-text">
                            <h4>IT-ERA Assistant</h4>
                            <span class="online-status">🟢 Online - Risposta in 15 min</span>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="minimize-btn" id="minimize-chat">−</button>
                        <button class="close-btn" id="close-chat">×</button>
                    </div>
                </div>
                
                <!-- Messages Area -->
                <div class="chat-messages" id="chat-messages">
                    ${this.config.showWelcome ? this.getWelcomeMessage() : ''}
                </div>
                
                <!-- Typing Indicator -->
                <div class="typing-indicator hidden" id="typing-indicator">
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <span class="typing-text">IT-ERA sta scrivendo...</span>
                </div>
                
                <!-- Input Area -->
                <div class="chat-input-area">
                    <div class="input-container">
                        <input type="text" 
                               id="chat-input" 
                               placeholder="Descrivi il tuo problema IT..." 
                               maxlength="500"
                               autocomplete="off">
                        <button id="send-message" class="send-btn" disabled>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22,2 15,22 11,13 2,9"></polygon>
                            </svg>
                        </button>
                    </div>
                    <div class="input-footer">
                        <span class="powered-by">Powered by IT-ERA AI</span>
                        <span class="char-count">0/500</span>
                    </div>
                </div>
                
                <!-- Emergency Banner -->
                <div class="emergency-banner hidden" id="emergency-banner">
                    <div class="emergency-content">
                        <span class="emergency-icon">🚨</span>
                        <div class="emergency-text">
                            <strong>Emergenza IT Rilevata</strong>
                            <p>Ti chiamiamo subito!</p>
                        </div>
                        <button class="emergency-call-btn" onclick="window.open('tel:+390398882041')">
                            📞 039 888 2041
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(chatWidget);
        this.loadChatStyles();
    }
    
    getWelcomeMessage() {
        const currentHour = new Date().getHours();
        const isBusinessHours = currentHour >= this.config.businessHours.start && 
                               currentHour < this.config.businessHours.end;
        
        return `
            <div class="message bot-message welcome-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-text">
                        <p><strong>Ciao! 👋 Sono l'assistente IT-ERA</strong></p>
                        <p>Come posso aiutarti con i tuoi problemi informatici?</p>
                        ${!isBusinessHours ? '<p class="after-hours">⏰ Siamo fuori orario, ma per emergenze chiama il <strong>039 888 2041</strong></p>' : ''}
                    </div>
                    <div class="quick-actions">
                        <button class="quick-btn emergency" data-message="Ho un'emergenza informatica urgente">
                            🚨 Emergenza IT
                        </button>
                        <button class="quick-btn quote" data-message="Vorrei un preventivo per assistenza informatica">
                            💰 Preventivo
                        </button>
                        <button class="quick-btn support" data-message="Ho bisogno di supporto tecnico">
                            🔧 Supporto
                        </button>
                        <button class="quick-btn operator" data-message="Voglio parlare con un operatore">
                            👤 Operatore
                        </button>
                    </div>
                </div>
                <div class="message-time">${this.formatTime(new Date())}</div>
            </div>
        `;
    }

    initializeFeatures() {
        // Inizializza rilevamento emergenze
        this.initEmergencyDetection();

        // Inizializza AI responses (se disponibile)
        if (this.aiConfig) {
            this.initAIResponses();
        }

        // Inizializza lead capture
        this.initLeadCapture();

        // Inizializza business hours detection
        this.initBusinessHoursDetection();
    }

    setupEventListeners() {
        const chatToggle = document.getElementById('chat-toggle');
        const chatWindow = document.getElementById('chat-window');
        const minimizeBtn = document.getElementById('minimize-chat');
        const closeBtn = document.getElementById('close-chat');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-message');

        // Toggle chat
        chatToggle?.addEventListener('click', () => this.toggleChat());

        // Minimize/Close
        minimizeBtn?.addEventListener('click', () => this.minimizeChat());
        closeBtn?.addEventListener('click', () => this.closeChat());

        // Input handling
        chatInput?.addEventListener('input', (e) => this.handleInputChange(e));
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send button
        sendBtn?.addEventListener('click', () => this.sendMessage());

        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-btn')) {
                const message = e.target.getAttribute('data-message');
                if (message) {
                    this.sendMessage(message);
                }
            }
        });

        // Emergency call button tracking
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('emergency-call-btn')) {
                this.trackEvent('emergency_call_clicked', {
                    conversation_id: this.conversationId,
                    source: 'chatbot_emergency_banner'
                });
            }
        });
    }

    toggleChat() {
        const chatWindow = document.getElementById('chat-window');
        const chatToggle = document.getElementById('chat-toggle');

        if (this.isVisible) {
            this.minimizeChat();
        } else {
            this.showChat();
        }
    }

    showChat() {
        const chatWindow = document.getElementById('chat-window');
        const chatToggle = document.getElementById('chat-toggle');

        chatWindow?.classList.remove('hidden');
        chatToggle?.classList.remove('minimized');
        this.isVisible = true;

        // Focus input
        setTimeout(() => {
            document.getElementById('chat-input')?.focus();
        }, 300);

        // Track chat opened
        this.trackEvent('chatbot_opened', {
            conversation_id: this.conversationId,
            timestamp: new Date().toISOString()
        });
    }

    minimizeChat() {
        const chatWindow = document.getElementById('chat-window');
        const chatToggle = document.getElementById('chat-toggle');

        chatWindow?.classList.add('hidden');
        chatToggle?.classList.add('minimized');
        this.isVisible = false;

        // Track chat minimized
        this.trackEvent('chatbot_minimized', {
            conversation_id: this.conversationId,
            message_count: this.messageHistory.length
        });
    }

    closeChat() {
        this.minimizeChat();

        // Track chat closed
        this.trackEvent('chatbot_closed', {
            conversation_id: this.conversationId,
            message_count: this.messageHistory.length,
            session_duration: Date.now() - this.sessionStart
        });
    }

    handleInputChange(e) {
        const input = e.target;
        const sendBtn = document.getElementById('send-message');
        const charCount = document.querySelector('.char-count');

        // Update character count
        if (charCount) {
            charCount.textContent = `${input.value.length}/500`;
        }

        // Enable/disable send button
        if (sendBtn) {
            sendBtn.disabled = input.value.trim().length === 0;
        }

        // Auto-resize input (se necessario)
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    async sendMessage(messageText = null) {
        const chatInput = document.getElementById('chat-input');
        const message = messageText || chatInput?.value.trim();

        if (!message) return;

        // Clear input
        if (chatInput && !messageText) {
            chatInput.value = '';
            chatInput.style.height = 'auto';
            document.querySelector('.char-count').textContent = '0/500';
            document.getElementById('send-message').disabled = true;
        }

        // Add user message to chat
        this.addMessage(message, 'user');

        // Store in history
        this.messageHistory.push({
            type: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });

        // Track message sent
        this.trackEvent('chatbot_message_sent', {
            conversation_id: this.conversationId,
            message_length: message.length,
            message_count: this.messageHistory.length
        });

        // Check for emergency
        const isEmergency = this.detectEmergency(message);
        if (isEmergency) {
            this.handleEmergency(message);
            return;
        }

        // Show typing indicator
        this.showTypingIndicator();

        // Process message
        try {
            const response = await this.processMessage(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');

            // Store bot response
            this.messageHistory.push({
                type: 'bot',
                content: response,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error processing message:', error);
            this.hideTypingIndicator();
            this.addMessage(this.getFallbackResponse(), 'bot');
        }
    }

    detectEmergency(message) {
        const lowerMessage = message.toLowerCase();

        // Check for emergency keywords
        const hasEmergencyKeyword = this.config.emergencyKeywords.some(keyword =>
            lowerMessage.includes(keyword.toLowerCase())
        );

        // Check for urgency indicators
        const urgencyIndicators = [
            'subito', 'immediatamente', 'ora', 'adesso', 'veloce',
            'aiuto', 'help', 'sos', 'panico', 'disperato'
        ];

        const hasUrgencyIndicator = urgencyIndicators.some(indicator =>
            lowerMessage.includes(indicator)
        );

        // Check for business impact keywords
        const businessImpactKeywords = [
            'bloccato', 'fermo', 'non posso lavorare', 'tutto fermo',
            'clienti', 'perdite', 'fatturato', 'business'
        ];

        const hasBusinessImpact = businessImpactKeywords.some(keyword =>
            lowerMessage.includes(keyword)
        );

        // Emergency score calculation
        let emergencyScore = 0;
        if (hasEmergencyKeyword) emergencyScore += 3;
        if (hasUrgencyIndicator) emergencyScore += 2;
        if (hasBusinessImpact) emergencyScore += 2;

        // Additional scoring for specific scenarios
        if (lowerMessage.includes('virus') || lowerMessage.includes('hacker')) emergencyScore += 3;
        if (lowerMessage.includes('server') && lowerMessage.includes('down')) emergencyScore += 3;
        if (lowerMessage.includes('backup') && lowerMessage.includes('perso')) emergencyScore += 3;

        return emergencyScore >= 3;
    }

    handleEmergency(message) {
        // Show emergency banner
        const emergencyBanner = document.getElementById('emergency-banner');
        emergencyBanner?.classList.remove('hidden');

        // Add emergency response
        const emergencyResponse = `
            🚨 <strong>EMERGENZA IT RILEVATA</strong><br><br>

            Ho capito che hai un problema urgente. Per le emergenze IT, il nostro team è disponibile 24/7.<br><br>

            <strong>📞 CHIAMA SUBITO: 039 888 2041</strong><br>
            <em>Risposta garantita entro 15 minuti</em><br><br>

            Nel frattempo, puoi anche:<br>
            • 📧 Scrivere a: info@it-era.it<br>
            • 💬 WhatsApp: +39 039 888 2041<br><br>

            <strong>Il nostro team ti contatterà immediatamente!</strong>
        `;

        this.addMessage(emergencyResponse, 'bot', true);

        // Track emergency
        this.trackEvent('emergency_detected', {
            conversation_id: this.conversationId,
            message: message,
            timestamp: new Date().toISOString(),
            emergency_type: 'chatbot_detection'
        });

        // Send emergency notification via Resend (if available)
        if (this.resendIntegration) {
            this.sendEmergencyNotification(message);
        }

        // Auto-scroll to show emergency banner
        setTimeout(() => {
            const chatMessages = document.getElementById('chat-messages');
            chatMessages?.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
        }, 500);
    }

    async sendEmergencyNotification(message) {
        try {
            const payload = {
                type: 'emergency_chatbot',
                message: message,
                conversation_id: this.conversationId,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                page_url: window.location.href,
                urgency: 'CRITICAL'
            };

            await this.resendIntegration.sendToResend(payload);
            console.log('🚨 Emergency notification sent via Resend');

        } catch (error) {
            console.error('Failed to send emergency notification:', error);
        }
    }

    async processMessage(message) {
        // Try AI response first (if available)
        if (this.aiConfig && this.config.useAI) {
            try {
                const aiResponse = await this.getAIResponse(message);
                if (aiResponse) {
                    return aiResponse;
                }
            } catch (error) {
                console.warn('AI response failed, using fallback:', error);
            }
        }

        // Use rule-based responses
        return this.getRuleBasedResponse(message);
    }

    async getAIResponse(message) {
        if (!this.aiConfig) return null;

        try {
            // Use existing AI config if available
            const response = await this.aiConfig.generateResponse(message, {
                context: 'chatbot',
                conversation_history: this.messageHistory.slice(-5), // Last 5 messages
                user_profile: this.userProfile
            });

            return response;

        } catch (error) {
            console.error('AI response error:', error);
            return null;
        }
    }

    getRuleBasedResponse(message) {
        const lowerMessage = message.toLowerCase();

        // Greeting responses
        if (lowerMessage.includes('ciao') || lowerMessage.includes('salve') || lowerMessage.includes('buongiorno')) {
            return `Ciao! 👋 Sono l'assistente IT-ERA. Come posso aiutarti con i tuoi problemi informatici oggi?`;
        }

        // Service inquiries
        if (lowerMessage.includes('servizi') || lowerMessage.includes('cosa fate')) {
            return `IT-ERA offre servizi completi di assistenza informatica:<br><br>
                🔧 <strong>Assistenza IT 24/7</strong><br>
                🛡️ <strong>Cybersecurity e Sicurezza</strong><br>
                ☁️ <strong>Cloud Storage e Backup</strong><br>
                📞 <strong>VoIP e Centralino Cloud</strong><br>
                🏥 <strong>Soluzioni per Studi Medici</strong><br>
                ⚖️ <strong>Soluzioni per Studi Legali</strong><br><br>
                Vuoi saperne di più su un servizio specifico?`;
        }

        // Pricing inquiries
        if (lowerMessage.includes('prezzo') || lowerMessage.includes('costo') || lowerMessage.includes('preventivo')) {
            return `Per un preventivo personalizzato, posso metterti in contatto con il nostro team commerciale:<br><br>
                📞 <strong>Chiama: 039 888 2041</strong><br>
                📧 <strong>Email: info@it-era.it</strong><br><br>
                La prima consulenza è sempre <strong>GRATUITA</strong>! 🎉<br><br>
                Vuoi che ti chiami un nostro consulente?`;
        }

        // Contact information
        if (lowerMessage.includes('contatti') || lowerMessage.includes('telefono') || lowerMessage.includes('email')) {
            return `Ecco come puoi contattare IT-ERA:<br><br>
                📞 <strong>Telefono: 039 888 2041</strong><br>
                📧 <strong>Email: info@it-era.it</strong><br>
                📍 <strong>Sede: Viale Risorgimento 32, Vimercate MB</strong><br>
                🕒 <strong>Orari: Lun-Ven 8:00-18:00</strong><br>
                🚨 <strong>Emergenze: 24/7</strong><br><br>
                Per emergenze, chiama subito il nostro numero!`;
        }

        // Technical problems
        if (lowerMessage.includes('problema') || lowerMessage.includes('non funziona') || lowerMessage.includes('errore')) {
            return `Capisco che hai un problema tecnico. Per aiutarti al meglio:<br><br>
                🔍 <strong>Descrivi il problema in dettaglio</strong><br>
                💻 <strong>Che dispositivo stai usando?</strong><br>
                ⚠️ <strong>Quando è iniziato il problema?</strong><br><br>
                Per assistenza immediata:<br>
                📞 <strong>Chiama: 039 888 2041</strong><br><br>
                Il nostro team tecnico ti aiuterà subito!`;
        }

        // Default response
        return `Grazie per il tuo messaggio! 😊<br><br>
            Per una risposta più specifica, ti consiglio di:<br><br>
            📞 <strong>Chiamare: 039 888 2041</strong><br>
            📧 <strong>Scrivere a: info@it-era.it</strong><br><br>
            Il nostro team di esperti IT ti darà tutto il supporto di cui hai bisogno!<br><br>
            <em>Tempo di risposta garantito: 15 minuti</em> ⏱️`;
    }

    addMessage(content, type, isHTML = false) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const avatar = type === 'bot' ? '🤖' : '👤';
        const time = this.formatTime(new Date());

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">
                    ${isHTML ? content : this.escapeHtml(content)}
                </div>
            </div>
            <div class="message-time">${time}</div>
        `;

        chatMessages.appendChild(messageDiv);

        // Auto-scroll to bottom
        setTimeout(() => {
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
        }, 100);

        // Add animation
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';

        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 50);
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator?.classList.remove('hidden');

        // Auto-scroll to show typing indicator
        const chatMessages = document.getElementById('chat-messages');
        setTimeout(() => {
            chatMessages?.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
        }, 100);
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator?.classList.add('hidden');
    }

    formatTime(date) {
        return date.toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getFallbackResponse() {
        return `Mi dispiace, al momento non riesco a elaborare la tua richiesta. 😔<br><br>
            Per assistenza immediata, contatta il nostro team:<br><br>
            📞 <strong>Telefono: 039 888 2041</strong><br>
            📧 <strong>Email: info@it-era.it</strong><br><br>
            Siamo qui per aiutarti! 💪`;
    }

    // Integration methods
    initEmergencyDetection() {
        console.log('🚨 Emergency detection initialized');
    }

    initAIResponses() {
        console.log('🤖 AI responses initialized');
    }

    initLeadCapture() {
        // Setup lead capture after certain interactions
        this.leadCaptureThreshold = 3; // After 3 messages
        console.log('📊 Lead capture initialized');
    }

    initBusinessHoursDetection() {
        this.sessionStart = Date.now();
        console.log('🕒 Business hours detection initialized');
    }

    // Analytics integration
    trackEvent(eventName, properties = {}) {
        if (this.analytics) {
            this.analytics.trackEvent(eventName, {
                ...properties,
                source: 'chatbot',
                chatbot_version: '2.0'
            });
        }

        // Also log to console for debugging
        console.log(`📊 Chatbot Event: ${eventName}`, properties);
    }

    // Lead capture after engagement
    checkLeadCapture() {
        if (this.messageHistory.length >= this.leadCaptureThreshold && !this.leadCaptured) {
            this.showLeadCaptureForm();
        }
    }

    showLeadCaptureForm() {
        const leadCaptureMessage = `
            Vedo che sei interessato ai nostri servizi! 😊<br><br>

            Lasciami i tuoi contatti per ricevere:<br>
            ✅ <strong>Consulenza gratuita personalizzata</strong><br>
            ✅ <strong>Preventivo su misura</strong><br>
            ✅ <strong>Chiamata entro 2 ore</strong><br><br>

            <div class="lead-capture-form">
                <input type="text" id="lead-name" placeholder="Il tuo nome" class="lead-input">
                <input type="email" id="lead-email" placeholder="La tua email" class="lead-input">
                <input type="tel" id="lead-phone" placeholder="Il tuo telefono" class="lead-input">
                <button onclick="window.ITERAChatbot.submitLeadCapture()" class="lead-submit-btn">
                    📞 Richiedi Consulenza Gratuita
                </button>
            </div>
        `;

        this.addMessage(leadCaptureMessage, 'bot', true);
        this.leadCaptured = true;

        this.trackEvent('lead_capture_shown', {
            conversation_id: this.conversationId,
            message_count: this.messageHistory.length
        });
    }

    async submitLeadCapture() {
        const name = document.getElementById('lead-name')?.value;
        const email = document.getElementById('lead-email')?.value;
        const phone = document.getElementById('lead-phone')?.value;

        if (!name || !email || !phone) {
            alert('Per favore compila tutti i campi');
            return;
        }

        // Send via Resend integration
        if (this.resendIntegration) {
            try {
                const payload = {
                    type: 'chatbot_lead',
                    full_name: name,
                    email: email,
                    phone: phone,
                    conversation_id: this.conversationId,
                    message_history: this.messageHistory,
                    source: 'chatbot_lead_capture',
                    timestamp: new Date().toISOString()
                };

                await this.resendIntegration.sendToResend(payload);

                this.addMessage(`
                    Perfetto! 🎉<br><br>
                    I tuoi dati sono stati inviati al nostro team.<br>
                    <strong>Ti chiamiamo entro 2 ore!</strong><br><br>
                    Nel frattempo, per urgenze:<br>
                    📞 <strong>039 888 2041</strong>
                `, 'bot', true);

                this.trackEvent('lead_captured', {
                    conversation_id: this.conversationId,
                    name: name,
                    email: email,
                    phone: phone
                });

            } catch (error) {
                console.error('Lead capture failed:', error);
                this.addMessage(`
                    Si è verificato un errore. 😔<br><br>
                    Chiama direttamente:<br>
                    📞 <strong>039 888 2041</strong><br>
                    📧 <strong>info@it-era.it</strong>
                `, 'bot', true);
            }
        }
    }

    loadChatStyles() {
        // Check if styles already loaded
        if (document.getElementById('itera-chatbot-styles')) return;

        const style = document.createElement('style');
        style.id = 'itera-chatbot-styles';
        style.textContent = `
            /* IT-ERA Chatbot Styles */
            .itera-chatbot-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            /* Chat Toggle Button */
            .chat-toggle {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(30, 64, 175, 0.3);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .chat-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(30, 64, 175, 0.4);
            }

            .chat-toggle.minimized {
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { box-shadow: 0 4px 20px rgba(30, 64, 175, 0.3); }
                50% { box-shadow: 0 4px 20px rgba(30, 64, 175, 0.6); }
                100% { box-shadow: 0 4px 20px rgba(30, 64, 175, 0.3); }
            }

            .chat-icon {
                color: white;
                transition: transform 0.3s ease;
            }

            .chat-toggle:hover .chat-icon {
                transform: scale(1.2);
            }

            .chat-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
            }

            .chat-status {
                position: absolute;
                bottom: -25px;
                right: 0;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .chat-toggle:hover .chat-status {
                opacity: 1;
            }

            .status-dot {
                display: inline-block;
                width: 6px;
                height: 6px;
                background: #10b981;
                border-radius: 50%;
                margin-right: 4px;
            }

            /* Chat Window */
            .chat-window {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 380px;
                height: 500px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transition: all 0.3s ease;
                transform-origin: bottom right;
            }

            .chat-window.hidden {
                opacity: 0;
                transform: scale(0.8) translateY(20px);
                pointer-events: none;
            }

            /* Chat Header */
            .chat-header {
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                color: white;
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .header-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .company-logo {
                font-size: 24px;
            }

            .header-text h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }

            .online-status {
                font-size: 12px;
                opacity: 0.9;
            }

            .header-actions {
                display: flex;
                gap: 8px;
            }

            .minimize-btn, .close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: background 0.2s ease;
            }

            .minimize-btn:hover, .close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            /* Messages Area */
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                background: #f8fafc;
            }

            .message {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
                align-items: flex-start;
            }

            .user-message {
                flex-direction: row-reverse;
            }

            .message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }

            .bot-message .message-avatar {
                background: #e0e7ff;
            }

            .user-message .message-avatar {
                background: #dbeafe;
            }

            .message-content {
                max-width: 80%;
                position: relative;
            }

            .message-text {
                background: white;
                padding: 12px 16px;
                border-radius: 16px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                line-height: 1.4;
            }

            .user-message .message-text {
                background: #3b82f6;
                color: white;
            }

            .message-time {
                font-size: 11px;
                color: #6b7280;
                margin-top: 4px;
                text-align: center;
            }

            /* Welcome Message */
            .welcome-message .message-text {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 1px solid #0ea5e9;
            }

            /* Quick Actions */
            .quick-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-top: 12px;
            }

            .quick-btn {
                background: white;
                border: 1px solid #d1d5db;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
            }

            .quick-btn:hover {
                background: #f3f4f6;
                border-color: #9ca3af;
            }

            .quick-btn.emergency {
                background: #fef2f2;
                border-color: #fca5a5;
                color: #dc2626;
            }

            .quick-btn.emergency:hover {
                background: #fee2e2;
            }

            /* Typing Indicator */
            .typing-indicator {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                background: #f1f5f9;
                margin: 0 16px 16px;
                border-radius: 12px;
            }

            .typing-dots {
                display: flex;
                gap: 4px;
            }

            .typing-dots span {
                width: 6px;
                height: 6px;
                background: #64748b;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }

            .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
            .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

            @keyframes typing {
                0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }

            .typing-text {
                font-size: 12px;
                color: #64748b;
                font-style: italic;
            }

            /* Input Area */
            .chat-input-area {
                border-top: 1px solid #e5e7eb;
                background: white;
                padding: 16px;
            }

            .input-container {
                display: flex;
                gap: 8px;
                align-items: flex-end;
            }

            #chat-input {
                flex: 1;
                border: 1px solid #d1d5db;
                border-radius: 12px;
                padding: 12px 16px;
                font-size: 14px;
                resize: none;
                outline: none;
                transition: border-color 0.2s ease;
                min-height: 20px;
                max-height: 100px;
            }

            #chat-input:focus {
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .send-btn {
                background: #3b82f6;
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .send-btn:hover:not(:disabled) {
                background: #2563eb;
                transform: scale(1.05);
            }

            .send-btn:disabled {
                background: #9ca3af;
                cursor: not-allowed;
                transform: none;
            }

            .input-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 8px;
                font-size: 11px;
                color: #6b7280;
            }

            /* Emergency Banner */
            .emergency-banner {
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                border: 1px solid #fca5a5;
                border-radius: 12px;
                padding: 12px;
                margin: 0 16px 16px;
                animation: emergencyPulse 2s infinite;
            }

            @keyframes emergencyPulse {
                0% { border-color: #fca5a5; }
                50% { border-color: #ef4444; }
                100% { border-color: #fca5a5; }
            }

            .emergency-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .emergency-icon {
                font-size: 24px;
                animation: shake 0.5s infinite;
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-2px); }
                75% { transform: translateX(2px); }
            }

            .emergency-text {
                flex: 1;
            }

            .emergency-text strong {
                color: #dc2626;
                display: block;
                margin-bottom: 4px;
            }

            .emergency-text p {
                margin: 0;
                font-size: 12px;
                color: #7f1d1d;
            }

            .emergency-call-btn {
                background: #dc2626;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease;
                white-space: nowrap;
            }

            .emergency-call-btn:hover {
                background: #b91c1c;
            }

            /* Lead Capture Form */
            .lead-capture-form {
                margin-top: 12px;
                padding: 16px;
                background: #f8fafc;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }

            .lead-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                margin-bottom: 8px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s ease;
            }

            .lead-input:focus {
                border-color: #3b82f6;
            }

            .lead-submit-btn {
                width: 100%;
                background: #10b981;
                color: white;
                border: none;
                padding: 12px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease;
            }

            .lead-submit-btn:hover {
                background: #059669;
            }

            /* Mobile Responsive */
            @media (max-width: 480px) {
                .itera-chatbot-widget {
                    bottom: 10px;
                    right: 10px;
                    left: 10px;
                }

                .chat-window {
                    width: 100%;
                    height: 70vh;
                    bottom: 80px;
                    right: 0;
                    left: 0;
                }

                .quick-actions {
                    grid-template-columns: 1fr;
                }
            }

            /* Utility Classes */
            .hidden {
                display: none !important;
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other systems to load
    setTimeout(() => {
        window.ITERAChatbot = new ITERAChatbotSystem();
    }, 1000);
});

// Export for global access
window.ITERAChatbotSystem = ITERAChatbotSystem;
