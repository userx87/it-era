/**
 * IT-ERA Universal Chatbot Integration Script
 * Da aggiungere in ogni pagina del sito per attivare il chatbot
 * 
 * UTILIZZO:
 * 1. Aggiungi questo script prima del tag </body> di ogni pagina
 * 2. Il chatbot apparirà automaticamente in basso a destra
 * 3. Configurazione automatica per tutte le pagine IT-ERA
 */

(function() {
    'use strict';
    
    // Configurazione IT-ERA Chatbot
    const ITERA_CHATBOT_CONFIG = {
        // API Endpoint (aggiorna con il tuo worker deployato)
        apiEndpoint: 'https://it-era-chatbot.bulltech.workers.dev/api/chat',
        
        // Stile e posizionamento
        position: 'bottom-right', // bottom-right, bottom-left, custom
        theme: 'it-era', // it-era, dark, light
        
        // Comportamento
        autoOpen: false, // true = si apre automaticamente dopo 10 secondi
        showOnPages: ['all'], // ['all'] o array specifico ['index.html', 'servizi.html']
        
        // Personalizzazione IT-ERA
        companyName: 'IT-ERA',
        welcomeMessage: '👋 Ciao! Come posso aiutarti con i servizi IT?',
        
        // Analytics (opzionale)
        trackEvents: true,
        gaTrackingId: null, // Inserisci GA4 ID se vuoi tracking
        
        // Responsive
        mobileBreakpoint: 768,
        hiddenOnMobile: false
    };
    
    // CSS del chatbot widget
    const CHATBOT_STYLES = `
        <style id="it-era-chatbot-styles">
            /* IT-ERA Chatbot Widget Styles */
            #it-era-chatbot-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            #it-era-chatbot-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            #it-era-chatbot-button:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            }
            
            #it-era-chatbot-button svg {
                width: 24px;
                height: 24px;
                fill: white;
            }
            
            /* Pulse animation per attirare attenzione */
            @keyframes it-era-pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            .it-era-pulse {
                animation: it-era-pulse 2s infinite;
            }
            
            /* Notification badge */
            .it-era-notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 20px;
                height: 20px;
                background: #ef4444;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: white;
                font-weight: bold;
                border: 2px solid white;
            }
            
            /* Chat Window */
            #it-era-chatbot-window {
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 380px;
                height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                display: none;
                flex-direction: column;
                overflow: hidden;
                z-index: 10001;
                border: 1px solid #e5e7eb;
            }
            
            /* Header */
            .it-era-chat-header {
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: white;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .it-era-chat-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .it-era-chat-header .company-info {
                font-size: 12px;
                opacity: 0.9;
            }
            
            .it-era-close-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 20px;
                padding: 0;
                width: 24px;
                height: 24px;
            }
            
            /* Messages area */
            .it-era-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #f9fafb;
            }
            
            .it-era-message {
                margin-bottom: 16px;
                display: flex;
                flex-direction: column;
            }
            
            .it-era-message.bot {
                align-items: flex-start;
            }
            
            .it-era-message.user {
                align-items: flex-end;
            }
            
            .it-era-message-bubble {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .it-era-message.bot .it-era-message-bubble {
                background: white;
                border: 1px solid #e5e7eb;
            }
            
            .it-era-message.user .it-era-message-bubble {
                background: #2563eb;
                color: white;
            }
            
            /* Options buttons */
            .it-era-options {
                margin-top: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .it-era-option-btn {
                background: white;
                border: 2px solid #2563eb;
                color: #2563eb;
                padding: 8px 12px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                text-align: left;
                transition: all 0.2s;
            }
            
            .it-era-option-btn:hover {
                background: #2563eb;
                color: white;
            }
            
            /* Input area */
            .it-era-input-area {
                padding: 16px 20px;
                border-top: 1px solid #e5e7eb;
                background: white;
                display: flex;
                gap: 8px;
            }
            
            .it-era-message-input {
                flex: 1;
                border: 1px solid #d1d5db;
                border-radius: 20px;
                padding: 8px 16px;
                font-size: 14px;
                outline: none;
            }
            
            .it-era-message-input:focus {
                border-color: #2563eb;
            }
            
            .it-era-send-btn {
                background: #2563eb;
                border: none;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            /* Loading */
            .it-era-typing {
                display: flex;
                gap: 4px;
                padding: 8px 0;
            }
            
            .it-era-typing-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #9ca3af;
                animation: it-era-typing-animation 1.4s infinite ease-in-out;
            }
            
            .it-era-typing-dot:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .it-era-typing-dot:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes it-era-typing-animation {
                0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                #it-era-chatbot-window {
                    bottom: 80px;
                    right: 10px;
                    left: 10px;
                    width: auto;
                    height: 400px;
                }
                
                #it-era-chatbot-container {
                    bottom: 15px;
                    right: 15px;
                }
                
                #it-era-chatbot-button {
                    width: 50px;
                    height: 50px;
                }
            }
            
            /* Animazioni di apertura */
            @keyframes it-era-slide-up {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .it-era-slide-up {
                animation: it-era-slide-up 0.3s ease-out;
            }
        </style>
    `;
    
    // HTML del chatbot widget
    const CHATBOT_HTML = `
        <div id="it-era-chatbot-container">
            <!-- Pulsante chatbot -->
            <button id="it-era-chatbot-button" title="Chatta con IT-ERA">
                <!-- Icona chat -->
                <svg viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <!-- Badge notifica (nascosto di default) -->
                <span class="it-era-notification-badge" id="it-era-notification" style="display: none;">1</span>
            </button>
            
            <!-- Finestra chat -->
            <div id="it-era-chatbot-window">
                <div class="it-era-chat-header">
                    <div>
                        <h3>IT-ERA Assistenza</h3>
                        <div class="company-info">039 888 2041 • Vimercate (MB)</div>
                    </div>
                    <button class="it-era-close-btn" id="it-era-close-chat">×</button>
                </div>
                
                <div class="it-era-messages" id="it-era-messages">
                    <!-- I messaggi verranno inseriti qui -->
                </div>
                
                <div class="it-era-input-area">
                    <input type="text" id="it-era-message-input" class="it-era-message-input" 
                           placeholder="Scrivi un messaggio..." maxlength="500">
                    <button id="it-era-send-btn" class="it-era-send-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Funzione principale di inizializzazione
    function initializeITERAChatbot() {
        // Controlla se dovrebbe essere mostrato su questa pagina
        if (!shouldShowOnCurrentPage()) {
            return;
        }
        
        // Aggiungi CSS
        document.head.insertAdjacentHTML('beforeend', CHATBOT_STYLES);
        
        // Aggiungi HTML
        document.body.insertAdjacentHTML('beforeend', CHATBOT_HTML);
        
        // Inizializza eventi
        setupEventListeners();
        
        // Auto-open dopo delay se configurato
        if (ITERA_CHATBOT_CONFIG.autoOpen) {
            setTimeout(() => {
                document.getElementById('it-era-notification').style.display = 'block';
                document.getElementById('it-era-chatbot-button').classList.add('it-era-pulse');
            }, 10000); // 10 secondi
        }
        
        // Track page view
        trackEvent('chatbot_loaded', { page: window.location.pathname });
        
        console.log('✅ IT-ERA Chatbot initialized successfully');
    }
    
    // Verifica se mostrare il chatbot sulla pagina corrente
    function shouldShowOnCurrentPage() {
        if (ITERA_CHATBOT_CONFIG.showOnPages.includes('all')) {
            return true;
        }
        
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        return ITERA_CHATBOT_CONFIG.showOnPages.includes(currentPage);
    }
    
    // Setup eventi
    function setupEventListeners() {
        const button = document.getElementById('it-era-chatbot-button');
        const window_element = document.getElementById('it-era-chatbot-window');
        const closeBtn = document.getElementById('it-era-close-chat');
        const input = document.getElementById('it-era-message-input');
        const sendBtn = document.getElementById('it-era-send-btn');
        
        // Apri/chiudi chatbot
        button.addEventListener('click', () => {
            const isVisible = window_element.style.display === 'flex';
            
            if (isVisible) {
                closeChatbot();
            } else {
                openChatbot();
            }
        });
        
        // Chiudi chatbot
        closeBtn.addEventListener('click', closeChatbot);
        
        // Invia messaggio con Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Invia messaggio con pulsante
        sendBtn.addEventListener('click', sendMessage);
        
        // Chiudi se clicchi fuori (opzionale)
        document.addEventListener('click', (e) => {
            if (!document.getElementById('it-era-chatbot-container').contains(e.target)) {
                // Potresti decidere di chiudere qui o lasciare aperto
                // closeChatbot();
            }
        });
    }
    
    // Apri chatbot
    function openChatbot() {
        const window_element = document.getElementById('it-era-chatbot-window');
        const notification = document.getElementById('it-era-notification');
        const button = document.getElementById('it-era-chatbot-button');
        
        window_element.style.display = 'flex';
        window_element.classList.add('it-era-slide-up');
        
        // Nascondi notifica e pulse
        notification.style.display = 'none';
        button.classList.remove('it-era-pulse');
        
        // Inizia conversazione se è la prima volta
        if (!window.iteraChatSession) {
            startConversation();
        }
        
        // Focus su input
        document.getElementById('it-era-message-input').focus();
        
        trackEvent('chatbot_opened');
    }
    
    // Chiudi chatbot
    function closeChatbot() {
        const window_element = document.getElementById('it-era-chatbot-window');
        window_element.style.display = 'none';
        
        trackEvent('chatbot_closed');
    }
    
    // Inizia conversazione
    async function startConversation() {
        try {
            showTyping();
            
            const response = await fetch(ITERA_CHATBOT_CONFIG.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'start',
                    page: window.location.pathname,
                    referrer: document.referrer
                })
            });
            
            const data = await response.json();
            
            hideTyping();
            
            if (data.success) {
                window.iteraChatSession = data.sessionId;
                addMessage('bot', data.response, data.options);
            } else {
                addMessage('bot', 'Scusa, c\\'è stato un problema. Puoi chiamarci al 039 888 2041 per assistenza immediata.');
            }
            
        } catch (error) {
            hideTyping();
            addMessage('bot', 'Problemi di connessione. Contattaci direttamente al 039 888 2041 o email: info@it-era.it');
            console.error('Chatbot connection error:', error);
        }
    }
    
    // Invia messaggio utente
    async function sendMessage() {
        const input = document.getElementById('it-era-message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Aggiungi messaggio utente
        addMessage('user', message);
        input.value = '';
        
        // Mostra typing
        showTyping();
        
        try {
            const response = await fetch(ITERA_CHATBOT_CONFIG.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'message',
                    message: message,
                    sessionId: window.iteraChatSession
                })
            });
            
            const data = await response.json();
            
            hideTyping();
            
            if (data.success) {
                addMessage('bot', data.response, data.options);
                
                // Se c'è escalation, mostra messaggio speciale
                if (data.escalate) {
                    setTimeout(() => {
                        addMessage('bot', '📞 Un nostro consulente ti ricontatterà entro 24 ore. Per urgenze chiama: 039 888 2041');
                    }, 1000);
                }
            } else {
                addMessage('bot', 'Scusa, non sono riuscito a processare la richiesta. Contattaci al 039 888 2041.');
            }
            
        } catch (error) {
            hideTyping();
            addMessage('bot', 'Errore di connessione. Per assistenza immediata: 039 888 2041');
            console.error('Send message error:', error);
        }
        
        trackEvent('message_sent', { message: message.substring(0, 50) });
    }
    
    // Aggiungi messaggio alla chat
    function addMessage(type, content, options = null) {
        const messagesContainer = document.getElementById('it-era-messages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `it-era-message ${type}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'it-era-message-bubble';
        bubbleDiv.innerHTML = content.replace(/\\n/g, '<br>');
        
        messageDiv.appendChild(bubbleDiv);
        
        // Aggiungi opzioni se presenti (solo per bot)
        if (type === 'bot' && options && options.length > 0) {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'it-era-options';
            
            options.forEach(option => {
                const optionBtn = document.createElement('button');
                optionBtn.className = 'it-era-option-btn';
                optionBtn.textContent = option;
                optionBtn.addEventListener('click', () => {
                    // Simula invio messaggio
                    document.getElementById('it-era-message-input').value = option;
                    sendMessage();
                });
                optionsDiv.appendChild(optionBtn);
            });
            
            messageDiv.appendChild(optionsDiv);
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Mostra typing indicator
    function showTyping() {
        const messagesContainer = document.getElementById('it-era-messages');
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'it-era-message bot';
        typingDiv.id = 'it-era-typing-indicator';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'it-era-typing';
        typingContent.innerHTML = '<div class="it-era-typing-dot"></div><div class="it-era-typing-dot"></div><div class="it-era-typing-dot"></div>';
        
        typingDiv.appendChild(typingContent);
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Nascondi typing indicator
    function hideTyping() {
        const typingIndicator = document.getElementById('it-era-typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Tracking eventi (Google Analytics o altro)
    function trackEvent(eventName, properties = {}) {
        if (!ITERA_CHATBOT_CONFIG.trackEvents) return;
        
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                custom_parameter_1: properties.page || '',
                custom_parameter_2: properties.message || '',
                event_category: 'chatbot'
            });
        }
        
        // Console log per debug
        if (window.location.hostname === 'localhost') {
            console.log('📊 Chatbot Event:', eventName, properties);
        }
    }
    
    // Inizializza quando il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeITERAChatbot);
    } else {
        initializeITERAChatbot();
    }
    
    // Esponi API globale per controllo esterno
    window.ITERAChatbot = {
        open: openChatbot,
        close: closeChatbot,
        sendMessage: (msg) => {
            document.getElementById('it-era-message-input').value = msg;
            sendMessage();
        },
        config: ITERA_CHATBOT_CONFIG
    };
    
})();