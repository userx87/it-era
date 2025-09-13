/**
 * IT-ERA Chat Widget Loader - Modular External System
 * Carica e gestisce il widget chat in modo sicuro e modulare
 */

class ITERAChatWidgetLoader {
    constructor() {
        this.isLoaded = false;
        this.chatWidget = null;
        this.config = {
            // Configurazione sicura
            apiEndpoint: 'https://api.openai.com/v1/chat/completions',
            fallbackPhone: '039 888 2041',
            fallbackEmail: 'info@bulltech.it',
            
            // UI Configuration
            position: 'bottom-right',
            theme: 'it-era',
            autoOpen: false,
            showWelcome: true,
            
            // AI Configuration
            useAI: true,
            maxRetries: 3,
            timeout: 15000
        };
        
        this.init();
    }
    
    init() {
        // Carica solo se non già caricato
        if (this.isLoaded) return;
        
        console.log('🚀 Loading IT-ERA Chat Widget...');
        
        // Aspetta che il DOM sia pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadWidget());
        } else {
            this.loadWidget();
        }
    }
    
    async loadWidget() {
        try {
            // Crea il widget HTML
            this.createWidgetHTML();
            
            // Carica gli stili
            this.loadStyles();
            
            // Inizializza la funzionalità
            this.initializeChat();
            
            // Carica AI se disponibile
            await this.initializeAI();
            
            this.isLoaded = true;
            console.log('✅ IT-ERA Chat Widget loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading chat widget:', error);
            this.loadFallbackWidget();
        }
    }
    
    createWidgetHTML() {
        // Rimuovi widget esistente se presente
        const existing = document.getElementById('itera-chat-widget');
        if (existing) existing.remove();
        
        // Crea il nuovo widget
        const widget = document.createElement('div');
        widget.id = 'itera-chat-widget';
        widget.innerHTML = `
            <!-- Chat Button -->
            <div id="chat-button" class="itera-chat-button">
                <div class="chat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <div class="chat-notification" id="chat-notification">1</div>
            </div>
            
            <!-- Chat Window -->
            <div id="chat-window" class="itera-chat-window hidden">
                <!-- Header -->
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-status online"></div>
                        <div class="chat-title">
                            <h4>Assistenza IT-ERA</h4>
                            <span class="chat-subtitle">Supporto tecnico online</span>
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button id="chat-minimize" class="chat-action-btn">−</button>
                        <button id="chat-close" class="chat-action-btn">×</button>
                    </div>
                </div>
                
                <!-- Messages -->
                <div class="chat-messages" id="chat-messages">
                    <div class="welcome-message">
                        <div class="bot-avatar">🤖</div>
                        <div class="message-content">
                            <p><strong>Ciao! 👋</strong></p>
                            <p>Sono l'assistente virtuale di IT-ERA. Come posso aiutarti?</p>
                            <div class="quick-actions">
                                <button class="quick-btn" data-message="Ho un problema urgente con il computer">🚨 Emergenza IT</button>
                                <button class="quick-btn" data-message="Vorrei un preventivo per assistenza">💰 Preventivo</button>
                                <button class="quick-btn" data-message="Voglio parlare con un operatore">👤 Operatore</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Typing Indicator -->
                <div class="typing-indicator hidden" id="typing-indicator">
                    <div class="bot-avatar">🤖</div>
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
                
                <!-- Input -->
                <div class="chat-input">
                    <div class="input-container">
                        <input type="text" id="chat-input" placeholder="Scrivi il tuo messaggio..." maxlength="500">
                        <button id="chat-send" class="send-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22,2 15,22 11,13 2,9"></polygon>
                            </svg>
                        </button>
                    </div>
                    <div class="input-footer">
                        <span class="powered-by">Powered by IT-ERA AI</span>
                        <span class="char-count" id="char-count">0/500</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
        this.chatWidget = widget;
    }
    
    loadStyles() {
        // Carica CSS solo se non già presente
        if (document.getElementById('itera-chat-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'itera-chat-styles';
        styles.textContent = `
            /* IT-ERA Chat Widget Styles */
            #itera-chat-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            .itera-chat-button {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #1e40af, #3b82f6);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(30, 64, 175, 0.3);
                transition: all 0.3s ease;
                position: relative;
            }
            
            .itera-chat-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(30, 64, 175, 0.4);
            }
            
            .chat-icon {
                width: 24px;
                height: 24px;
                color: white;
            }
            
            .chat-notification {
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
                font-size: 12px;
                font-weight: bold;
                animation: pulse 2s infinite;
            }
            
            .itera-chat-window {
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
            
            .itera-chat-window.hidden {
                opacity: 0;
                transform: scale(0.8);
                pointer-events: none;
            }
            
            .chat-header {
                background: linear-gradient(135deg, #1e40af, #3b82f6);
                color: white;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chat-header-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .chat-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #10b981;
                animation: pulse 2s infinite;
            }
            
            .chat-title h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .chat-subtitle {
                font-size: 12px;
                opacity: 0.8;
            }
            
            .chat-actions {
                display: flex;
                gap: 8px;
            }
            
            .chat-action-btn {
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
                transition: background 0.2s;
            }
            
            .chat-action-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .chat-messages {
                flex: 1;
                padding: 16px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .welcome-message, .message {
                display: flex;
                gap: 12px;
                align-items: flex-start;
            }
            
            .bot-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #f3f4f6;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }
            
            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #1e40af;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 600;
                flex-shrink: 0;
            }
            
            .message-content {
                flex: 1;
                background: #f8fafc;
                padding: 12px;
                border-radius: 12px;
                border-top-left-radius: 4px;
            }
            
            .user-message .message-content {
                background: #1e40af;
                color: white;
                border-top-left-radius: 12px;
                border-top-right-radius: 4px;
            }
            
            .quick-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 12px;
            }
            
            .quick-btn {
                background: white;
                border: 1px solid #e5e7eb;
                padding: 8px 12px;
                border-radius: 8px;
                cursor: pointer;
                text-align: left;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .quick-btn:hover {
                background: #f3f4f6;
                border-color: #1e40af;
            }
            
            .typing-indicator {
                display: flex;
                gap: 12px;
                align-items: center;
                padding: 0 16px;
                margin-bottom: 16px;
            }
            
            .typing-dots {
                display: flex;
                gap: 4px;
                padding: 12px;
                background: #f8fafc;
                border-radius: 12px;
                border-top-left-radius: 4px;
            }
            
            .typing-dots span {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #9ca3af;
                animation: typing 1.4s infinite ease-in-out;
            }
            
            .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
            .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
            
            .chat-input {
                border-top: 1px solid #e5e7eb;
                padding: 16px;
            }
            
            .input-container {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            
            #chat-input {
                flex: 1;
                border: 1px solid #e5e7eb;
                border-radius: 24px;
                padding: 12px 16px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }
            
            #chat-input:focus {
                border-color: #1e40af;
            }
            
            .send-btn {
                width: 40px;
                height: 40px;
                background: #1e40af;
                border: none;
                border-radius: 50%;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            
            .send-btn:hover {
                background: #1d4ed8;
            }
            
            .send-btn svg {
                width: 16px;
                height: 16px;
            }
            
            .input-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 8px;
                font-size: 12px;
                color: #6b7280;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }
            
            /* Mobile Responsive */
            @media (max-width: 480px) {
                .itera-chat-window {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 100px);
                    bottom: 80px;
                    right: 20px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    initializeChat() {
        const button = document.getElementById('chat-button');
        const window = document.getElementById('chat-window');
        const closeBtn = document.getElementById('chat-close');
        const minimizeBtn = document.getElementById('chat-minimize');
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        const charCount = document.getElementById('char-count');
        
        // Toggle chat window
        button?.addEventListener('click', () => this.toggleChat());
        closeBtn?.addEventListener('click', () => this.closeChat());
        minimizeBtn?.addEventListener('click', () => this.minimizeChat());
        
        // Send message
        sendBtn?.addEventListener('click', () => this.sendMessage());
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Character counter
        input?.addEventListener('input', (e) => {
            const count = e.target.value.length;
            if (charCount) charCount.textContent = `${count}/500`;
        });
        
        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-btn')) {
                const message = e.target.dataset.message;
                if (message) {
                    this.sendUserMessage(message);
                }
            }
        });
        
        // Hide notification after first interaction
        setTimeout(() => {
            const notification = document.getElementById('chat-notification');
            if (notification) notification.style.display = 'none';
        }, 5000);
    }
    
    async initializeAI() {
        // Carica configurazione AI se disponibile
        if (window.ITERA_AI) {
            console.log('🤖 AI integration available');
            this.aiEnabled = true;
        } else {
            console.log('⚠️ AI not available, using fallback responses');
            this.aiEnabled = false;
        }
    }
    
    toggleChat() {
        const window = document.getElementById('chat-window');
        if (window) {
            window.classList.toggle('hidden');
            
            // Focus input when opening
            if (!window.classList.contains('hidden')) {
                setTimeout(() => {
                    const input = document.getElementById('chat-input');
                    if (input) input.focus();
                }, 300);
            }
        }
    }
    
    closeChat() {
        const window = document.getElementById('chat-window');
        if (window) {
            window.classList.add('hidden');
        }
    }
    
    minimizeChat() {
        this.closeChat();
    }
    
    sendMessage() {
        const input = document.getElementById('chat-input');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        this.sendUserMessage(message);
        input.value = '';
        
        // Update character counter
        const charCount = document.getElementById('char-count');
        if (charCount) charCount.textContent = '0/500';
    }
    
    sendUserMessage(message) {
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTyping();
        
        // Process message
        setTimeout(() => {
            this.processMessage(message);
        }, 1000);
    }
    
    addMessage(content, type = 'bot') {
        const messages = document.getElementById('chat-messages');
        if (!messages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const avatar = type === 'user' ? 
            '<div class="user-avatar">Tu</div>' : 
            '<div class="bot-avatar">🤖</div>';
        
        messageDiv.innerHTML = `
            ${avatar}
            <div class="message-content">
                ${content}
            </div>
        `;
        
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }
    
    showTyping() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.classList.remove('hidden');
            
            // Scroll to bottom
            const messages = document.getElementById('chat-messages');
            if (messages) {
                messages.scrollTop = messages.scrollHeight;
            }
        }
    }
    
    hideTyping() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }
    
    async processMessage(message) {
        try {
            let response;
            
            // Check for operator request
            if (this.isOperatorRequest(message)) {
                response = this.getOperatorResponse();
            }
            // Check for emergency
            else if (this.isEmergency(message)) {
                response = this.getEmergencyResponse();
            }
            // Use AI if available
            else if (this.aiEnabled && window.ITERA_AI) {
                response = await this.getAIResponse(message);
            }
            // Fallback response
            else {
                response = this.getFallbackResponse(message);
            }
            
            this.hideTyping();
            this.addMessage(response, 'bot');
            
        } catch (error) {
            console.error('Error processing message:', error);
            this.hideTyping();
            this.addMessage(this.getErrorResponse(), 'bot');
        }
    }
    
    isOperatorRequest(message) {
        const operatorKeywords = ['operatore', 'umano', 'persona', 'parlare con', 'assistenza umana'];
        return operatorKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
    }
    
    isEmergency(message) {
        const emergencyKeywords = ['urgente', 'emergenza', 'subito', 'aiuto', 'problema grave', 'non funziona'];
        return emergencyKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
    }
    
    getOperatorResponse() {
        return `
            <p><strong>🔄 Trasferimento a operatore umano</strong></p>
            <p>Ti sto mettendo in contatto con un nostro tecnico specializzato.</p>
            <div class="quick-actions">
                <button class="quick-btn" onclick="window.open('tel:+390398882041')">📞 Chiama: 039 888 2041</button>
                <button class="quick-btn" onclick="window.open('mailto:info@bulltech.it')">✉️ Email: info@bulltech.it</button>
            </div>
            <p><small>Tempo di risposta medio: 5 minuti</small></p>
        `;
    }
    
    getEmergencyResponse() {
        return `
            <p><strong>🚨 EMERGENZA IT RILEVATA</strong></p>
            <p>Per problemi urgenti, contattaci immediatamente:</p>
            <div class="quick-actions">
                <button class="quick-btn" onclick="window.open('tel:+390398882041')" style="background: #ef4444; color: white; border-color: #ef4444;">🚨 CHIAMA ORA: 039 888 2041</button>
            </div>
            <p><strong>Risposta garantita in 15 minuti!</strong></p>
            <p>Siamo specializzati in interventi di emergenza IT per aziende e privati.</p>
        `;
    }
    
    async getAIResponse(message) {
        try {
            // Use existing AI system if available
            const messages = [
                {
                    role: 'system',
                    content: 'Sei l\'assistente virtuale di IT-ERA. Rispondi in modo professionale e utile. Includi sempre il numero di telefono 039 888 2041 per assistenza diretta.'
                },
                {
                    role: 'user',
                    content: message
                }
            ];
            
            const response = await window.ITERA_AI.callOpenAI(messages, {
                max_tokens: 200,
                temperature: 0.7
            });
            
            return response;
            
        } catch (error) {
            console.error('AI Response error:', error);
            return this.getFallbackResponse(message);
        }
    }
    
    getFallbackResponse(message) {
        const responses = [
            `Grazie per il tuo messaggio! Un nostro tecnico ti risponderà al più presto. Per assistenza immediata chiama il <strong>039 888 2041</strong>.`,
            `Ho ricevuto la tua richiesta. Per supporto tecnico urgente, contattaci al <strong>039 888 2041</strong> o scrivi a info@bulltech.it.`,
            `Messaggio ricevuto! Il nostro team IT è a tua disposizione al <strong>039 888 2041</strong> per qualsiasi emergenza.`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    getErrorResponse() {
        return `
            <p>Si è verificato un problema tecnico. Ti preghiamo di contattarci direttamente:</p>
            <div class="quick-actions">
                <button class="quick-btn" onclick="window.open('tel:+390398882041')">📞 039 888 2041</button>
                <button class="quick-btn" onclick="window.open('mailto:info@bulltech.it')">✉️ info@bulltech.it</button>
            </div>
        `;
    }
    
    loadFallbackWidget() {
        // Carica widget semplificato in caso di errori
        console.log('Loading fallback chat widget...');
        
        const fallback = document.createElement('div');
        fallback.innerHTML = `
            <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
                <a href="tel:+390398882041" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #1e40af, #3b82f6);
                    color: white;
                    border-radius: 50%;
                    text-decoration: none;
                    box-shadow: 0 4px 20px rgba(30, 64, 175, 0.3);
                    font-size: 24px;
                ">📞</a>
            </div>
        `;
        
        document.body.appendChild(fallback);
    }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    window.ITERAChatWidget = new ITERAChatWidgetLoader();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAChatWidgetLoader;
}
