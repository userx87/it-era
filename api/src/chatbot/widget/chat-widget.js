/**
 * IT-ERA AI-Powered Chat Widget
 * Enhanced responsive chat widget with AI features, advanced UX,
 * dynamic suggestions, and intelligent escalation handling
 */

class ITERAChatWidget {
  constructor(options = {}) {
    this.config = {
      apiEndpoint: options.apiEndpoint || 'https://it-era.it/api/chat',
      position: options.position || 'bottom-right',
      primaryColor: options.primaryColor || '#667eea',
      secondaryColor: options.secondaryColor || '#764ba2',
      autoOpen: options.autoOpen || false,
      greeting: options.greeting || "[IT-ERA] Ciao, come posso aiutarti?",
      companyName: options.companyName || 'IT-ERA',
      ...options
    };
    
    this.sessionId = null;
    this.isOpen = false;
    this.isLoading = false;
    this.isTyping = false;
    this.messages = [];
    this.leadData = {};
    this.conversationMetrics = {
      messageCount: 0,
      aiResponses: 0,
      averageResponseTime: 0,
      totalCost: 0
    };
    this.suggestions = [];
    this.quickReplies = [];
    this.escalationMode = false;
    
    // Vision capabilities
    this.visionEnabled = true;
    this.maxImages = 5;
    this.maxImageSize = 20 * 1024 * 1024; // 20MB
    this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.uploadedImages = [];
    
    this.init();
  }
  
  init() {
    this.createWidget();
    this.attachEventListeners();
    
    if (this.config.autoOpen) {
      setTimeout(() => this.openChat(), 2000);
    }
  }
  
  createWidget() {
    // Container principale
    this.container = document.createElement('div');
    this.container.id = 'itera-chat-widget';
    this.container.className = `itera-chat-widget ${this.config.position}`;
    
    this.container.innerHTML = `
      <!-- Floating Button -->
      <div class="itera-chat-button" id="itera-chat-button">
        <div class="itera-chat-button-icon">
          <svg class="chat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg class="close-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="itera-chat-button-badge hidden">1</div>
      </div>
      
      <!-- Chat Window -->
      <div class="itera-chat-window hidden" id="itera-chat-window">
        <!-- Header -->
        <div class="itera-chat-header">
          <div class="itera-chat-header-info">
            <div class="itera-chat-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor"/>
                <circle cx="9" cy="9" r="1.5" fill="white"/>
                <circle cx="15" cy="9" r="1.5" fill="white"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="itera-chat-header-text">
              <h4>${this.config.companyName}</h4>
              <p>Assistente virtuale</p>
            </div>
          </div>
          <button class="itera-chat-close" id="itera-chat-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <!-- Messages -->
        <div class="itera-chat-messages" id="itera-chat-messages">
          <div class="itera-chat-message bot">
            <div class="itera-chat-message-content">
              ${this.config.greeting}
            </div>
          </div>
        </div>
        
        <!-- Input -->
        <div class="itera-chat-input">
          <div class="itera-chat-input-area">
            <!-- Smart input suggestions -->
            <div class="itera-input-suggestions hidden" id="itera-input-suggestions">
              <div class="itera-suggestion-item" data-text="Ho bisogno di un preventivo">💰 Preventivo</div>
              <div class="itera-suggestion-item" data-text="Vorrei assistenza tecnica">🔧 Assistenza</div>
              <div class="itera-suggestion-item" data-text="Parlare con una persona">👤 Operatore umano</div>
            </div>
            
            <div class="itera-input-container">
              <textarea 
                id="itera-chat-textarea" 
                placeholder="Scrivi un messaggio o carica immagini per assistenza tecnica..."
                rows="1"
                maxlength="1000"
              ></textarea>
              
              <!-- Image upload button -->
              <button class="itera-image-upload" id="itera-image-upload" title="Carica immagini">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2"/>
                  <polyline points="21,15 16,10 5,21" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
              
              <!-- Hidden file input -->
              <input 
                type="file" 
                id="itera-file-input" 
                multiple 
                accept="image/*" 
                style="display: none;"
              />
              
              <!-- Voice input button (future feature) -->
              <button class="itera-voice-input hidden" id="itera-voice-input" title="Messaggio vocale">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" stroke-width="2"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
              
              <button class="itera-chat-send" id="itera-chat-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Image Preview Area -->
        <div class="itera-image-preview hidden" id="itera-image-preview">
          <div class="itera-image-preview-header">
            <span>📸 Immagini caricate:</span>
            <button class="itera-clear-images" id="itera-clear-images">✕</button>
          </div>
          <div class="itera-image-preview-container" id="itera-image-preview-container">
            <!-- Dynamic image previews -->
          </div>
          <div class="itera-image-help">
            💡 Carica screenshot di errori, foto di hardware o diagrammi per assistenza specializzata
          </div>
        </div>
        
        <!-- Enhanced Loading & Typing Indicators -->
        <div class="itera-chat-loading hidden" id="itera-chat-loading">
          <div class="itera-typing-indicator">
            <div class="itera-typing-dot"></div>
            <div class="itera-typing-dot"></div>
            <div class="itera-typing-dot"></div>
          </div>
          <span id="itera-loading-text">L'assistente sta scrivendo...</span>
        </div>
        
        <!-- AI Status Indicator -->
        <div class="itera-ai-status hidden" id="itera-ai-status">
          <div class="itera-ai-badge">
            <span class="itera-ai-icon">🤖</span>
            <span class="itera-ai-text">Risposta AI</span>
          </div>
        </div>
        
        <!-- Vision Analysis Indicator -->
        <div class="itera-vision-status hidden" id="itera-vision-status">
          <div class="itera-vision-badge">
            <span class="itera-vision-icon">👁️</span>
            <span class="itera-vision-text">Analisi immagini in corso...</span>
          </div>
        </div>
        
        <!-- Quick Replies -->
        <div class="itera-quick-replies hidden" id="itera-quick-replies">
          <div class="itera-quick-replies-header">Risposte rapide:</div>
          <div class="itera-quick-replies-container"></div>
        </div>
        
        <!-- Smart Suggestions -->
        <div class="itera-suggestions hidden" id="itera-suggestions">
          <div class="itera-suggestions-header">💡 Suggerimenti:</div>
          <div class="itera-suggestions-container"></div>
        </div>
      </div>
    `;
    
    // Aggiungi CSS
    if (!document.getElementById('itera-chat-styles')) {
      const styles = this.createStyles();
      const styleElement = document.createElement('style');
      styleElement.id = 'itera-chat-styles';
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    }
    
    // Aggiungi al DOM
    document.body.appendChild(this.container);
  }
  
  createStyles() {
    return `
      /* IT-ERA Chat Widget Styles */
      .itera-chat-widget {
        position: fixed;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .itera-chat-widget.bottom-right {
        bottom: 20px;
        right: 20px;
      }
      
      .itera-chat-widget.bottom-left {
        bottom: 20px;
        left: 20px;
      }
      
      .itera-chat-button {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        position: relative;
      }
      
      .itera-chat-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(0,0,0,0.2);
      }
      
      .itera-chat-button-icon {
        color: white;
        transition: all 0.3s ease;
      }
      
      .itera-chat-button-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ff4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
      
      .itera-chat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: slideUp 0.3s ease;
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .itera-chat-header {
        background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .itera-chat-header-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .itera-chat-avatar {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .itera-chat-header-text h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .itera-chat-header-text p {
        margin: 0;
        font-size: 12px;
        opacity: 0.9;
      }
      
      .itera-chat-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      .itera-chat-close:hover {
        background: rgba(255,255,255,0.1);
      }
      
      .itera-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .itera-chat-message {
        max-width: 85%;
        animation: messageSlide 0.3s ease;
      }
      
      @keyframes messageSlide {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .itera-chat-message.user {
        align-self: flex-end;
      }
      
      .itera-chat-message.bot {
        align-self: flex-start;
      }
      
      .itera-chat-message-content {
        background: #f1f3f4;
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
        white-space: pre-wrap;
      }
      
      .itera-chat-message.user .itera-chat-message-content {
        background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
        color: white;
      }
      
      .itera-chat-options {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      
      .itera-chat-option {
        background: white;
        border: 2px solid ${this.config.primaryColor};
        color: ${this.config.primaryColor};
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .itera-chat-option:hover {
        background: ${this.config.primaryColor};
        color: white;
      }
      
      .itera-chat-input {
        border-top: 1px solid #e0e0e0;
        padding: 16px;
      }
      
      .itera-chat-input-area {
        display: flex;
        align-items: flex-end;
        gap: 8px;
      }
      
      #itera-chat-textarea {
        flex: 1;
        border: 1px solid #e0e0e0;
        border-radius: 20px;
        padding: 12px 16px;
        font-size: 14px;
        resize: none;
        max-height: 80px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s ease;
      }
      
      #itera-chat-textarea:focus {
        border-color: ${this.config.primaryColor};
      }
      
      .itera-chat-send {
        background: ${this.config.primaryColor};
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .itera-chat-send:hover {
        background: ${this.config.secondaryColor};
        transform: scale(1.1);
      }
      
      .itera-chat-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      .itera-chat-loading {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f9f9f9;
        border-top: 1px solid #e0e0e0;
        font-size: 12px;
        color: #666;
      }
      
      .itera-typing-indicator {
        display: flex;
        gap: 3px;
      }
      
      .itera-typing-dot {
        width: 6px;
        height: 6px;
        background: ${this.config.primaryColor};
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
      }
      
      .itera-typing-dot:nth-child(1) { animation-delay: -0.32s; }
      .itera-typing-dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes typing {
        0%, 80%, 100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      .hidden {
        display: none !important;
      }
      
      /* AI-specific styles */
      .itera-ai-status {
        position: absolute;
        top: -35px;
        right: 0;
        background: rgba(102, 126, 234, 0.1);
        border: 1px solid rgba(102, 126, 234, 0.2);
        border-radius: 15px;
        padding: 4px 8px;
        font-size: 11px;
        color: ${this.config.primaryColor};
        backdrop-filter: blur(5px);
        animation: aiPulse 2s infinite;
      }
      
      @keyframes aiPulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
      
      .itera-ai-badge {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .itera-ai-icon {
        font-size: 10px;
      }
      
      .itera-quick-replies, .itera-suggestions {
        padding: 12px;
        background: #f9f9ff;
        border-top: 1px solid #e0e0e0;
        font-size: 12px;
      }
      
      .itera-quick-replies-header, .itera-suggestions-header {
        margin-bottom: 8px;
        font-weight: 600;
        color: ${this.config.primaryColor};
      }
      
      .itera-quick-replies-container, .itera-suggestions-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      
      .itera-quick-reply, .itera-suggestion {
        background: white;
        border: 1px solid ${this.config.primaryColor};
        color: ${this.config.primaryColor};
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .itera-quick-reply:hover, .itera-suggestion:hover {
        background: ${this.config.primaryColor};
        color: white;
        transform: translateY(-1px);
      }
      
      .itera-input-suggestions {
        background: white;
        border: 1px solid #e0e0e0;
        border-bottom: none;
        border-radius: 8px 8px 0 0;
        padding: 8px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      
      .itera-suggestion-item {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 12px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .itera-suggestion-item:hover {
        background: ${this.config.primaryColor};
        color: white;
        border-color: ${this.config.primaryColor};
      }
      
      .itera-input-container {
        display: flex;
        align-items: flex-end;
        gap: 8px;
      }
      
      .itera-voice-input {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .itera-voice-input:hover {
        background: ${this.config.primaryColor};
        color: white;
        border-color: ${this.config.primaryColor};
      }
      
      /* Enhanced typing indicator */
      .itera-chat-loading {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(90deg, #f9f9f9, #f0f0f0, #f9f9f9);
        background-size: 200% 100%;
        animation: loadingShimmer 2s infinite;
        border-top: 1px solid #e0e0e0;
        font-size: 12px;
        color: #666;
      }
      
      @keyframes loadingShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      /* Message enhancements */
      .itera-chat-message.ai-powered .itera-chat-message-content {
        position: relative;
      }
      
      .itera-chat-message.ai-powered .itera-chat-message-content::after {
        content: '🤖';
        position: absolute;
        bottom: -15px;
        right: 0;
        font-size: 10px;
        opacity: 0.5;
      }
      
      .itera-chat-message.escalation .itera-chat-message-content {
        border-left: 3px solid #ff9800;
        background: linear-gradient(135deg, #fff3e0, #ffffff);
      }
      
      /* CRITICAL: Emergency message styling */
      .itera-chat-message.emergency-critical {
        animation: emergency-pulse 2s infinite;
      }
      
      .itera-chat-message.emergency-critical .itera-chat-message-content {
        border: 2px solid #dc3545;
        border-left: 5px solid #dc3545;
        background: linear-gradient(135deg, #ffebee, #ffffff);
        box-shadow: 0 4px 20px rgba(220, 53, 69, 0.3);
        font-weight: 600;
      }
      
      .itera-chat-message.emergency-critical .itera-chat-option {
        background: #dc3545;
        color: white;
        font-weight: 600;
        border: none;
        animation: emergency-button-pulse 1.5s infinite;
      }
      
      .itera-chat-message.emergency-critical .itera-chat-option:hover {
        background: #c82333;
        transform: scale(1.05);
      }
      
      @keyframes emergency-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      
      @keyframes emergency-button-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      
      /* Mobile responsive */
      @media (max-width: 480px) {
        .itera-chat-window {
          width: 95vw;
          height: 75vh;
          bottom: 80px;
          right: 2.5vw;
          left: 2.5vw;
        }
        
        .itera-chat-widget.bottom-right {
          right: 20px;
        }
        
        .itera-chat-widget.bottom-left {
          left: 20px;
        }
        
        .itera-input-suggestions {
          flex-direction: column;
          gap: 4px;
        }
        
        .itera-quick-replies-container, .itera-suggestions-container {
          flex-direction: column;
        }
      }
    `;
  }
  
  attachEventListeners() {
    const button = document.getElementById('itera-chat-button');
    const closeBtn = document.getElementById('itera-chat-close');
    const sendBtn = document.getElementById('itera-chat-send');
    const textarea = document.getElementById('itera-chat-textarea');
    
    button.addEventListener('click', () => this.toggleChat());
    closeBtn.addEventListener('click', () => this.closeChat());
    sendBtn.addEventListener('click', () => this.sendMessage());
    
    textarea.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    textarea.addEventListener('input', this.adjustTextareaHeight);
  }
  
  adjustTextareaHeight() {
    const textarea = document.getElementById('itera-chat-textarea');
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
  
  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }
  
  async openChat() {
    const window = document.getElementById('itera-chat-window');
    const button = document.getElementById('itera-chat-button');
    const chatIcon = button.querySelector('.chat-icon');
    const closeIcon = button.querySelector('.close-icon');
    
    window.classList.remove('hidden');
    chatIcon.classList.add('hidden');
    closeIcon.classList.remove('hidden');
    
    this.isOpen = true;
    
    // Inizia conversazione se non esiste sessione
    if (!this.sessionId) {
      await this.startConversation();
    }
    
    // Focus textarea
    setTimeout(() => {
      document.getElementById('itera-chat-textarea').focus();
    }, 300);
  }
  
  closeChat() {
    const window = document.getElementById('itera-chat-window');
    const button = document.getElementById('itera-chat-button');
    const chatIcon = button.querySelector('.chat-icon');
    const closeIcon = button.querySelector('.close-icon');
    
    window.classList.add('hidden');
    chatIcon.classList.remove('hidden');
    closeIcon.classList.add('hidden');
    
    this.isOpen = false;
  }
  
  async startConversation() {
    // Show immediate fallback while initializing
    this.showLoading(true);
    
    try {
      // OPTIMIZED with timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (result.success) {
        this.sessionId = result.sessionId;
        
        // SECURITY CRITICAL: Sanitize response to prevent system prompt exposure
        const sanitizedResponse = this.sanitizeResponse(result.response);
        this.addBotMessage(sanitizedResponse, result.options);
        
        // Track performance
        if (result.responseTime) {
          this.conversationMetrics.averageResponseTime = result.responseTime;
        }
      } else {
        throw new Error('Server returned error');
      }
    } catch (error) {
      console.error('Chat start error:', error);
      
      // PROFESSIONAL FALLBACK with [IT-ERA] prefix
      if (error.name === 'AbortError') {
        this.addBotMessage('[IT-ERA] Il sistema sta caricando. Nel frattempo, come possiamo assistervi?', 
                          ['Richiedi Preventivo', 'Assistenza Tecnica', 'Contatta Direttamente']);
      } else {
        this.addBotMessage('[IT-ERA] Benvenuto! Il nostro team è a vostra disposizione per qualsiasi esigenza IT. Come possiamo supportarvi?', 
                          ['Preventivo Gratuito', 'Assistenza Immediata', 'Chiamata Diretta']);
      }
      
      // Generate a local session ID
      this.sessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * SECURITY CRITICAL: Sanitize responses to prevent system prompt exposure
   */
  sanitizeResponse(message) {
    if (!message || typeof message !== 'string') {
      return "[IT-ERA] Ciao, come posso aiutarti?";
    }
    
    // Check for system prompt indicators that should NEVER be shown to users
    const systemPromptIndicators = [
      'INIZIO:',
      'RISPOSTA TIPO',
      'SYSTEM_PROMPT', 
      'Sei l\'assistente virtuale',
      'REGOLE ASSOLUTE',
      'IDENTITÀ:',
      'generateSystemPrompt',
      'BusinessRules',
      'console.log',
      'systemPrompt',
      '# IDENTITÀ',
      'COMPORTAMENTO CONVERSAZIONALE',
      'OBIETTIVI PRIMARI',
      'Ogni conversazione inizia con',
      'Buongiorno, sono l\'assistente di IT-ERA',
      'Capisco perfettamente il suo problema'
    ];
    
    // If message contains any system prompt indicators, replace with safe greeting
    for (const indicator of systemPromptIndicators) {
      if (message.includes(indicator)) {
        console.error('SECURITY ALERT: System prompt exposed in response, using safe fallback');
        return "[IT-ERA] Ciao, come posso aiutarti?";
      }
    }
    
    return message;
  }
  
  async sendMessage() {
    const textarea = document.getElementById('itera-chat-textarea');
    const message = textarea.value.trim();
    
    if (!message || this.isLoading) return;
    
    // Clear input and suggestions
    textarea.value = '';
    textarea.style.height = 'auto';
    this.hideInputSuggestions();
    
    // Add user message with timestamp
    this.addUserMessage(message);
    this.conversationMetrics.messageCount++;
    
    // Show enhanced loading with professional messaging
    this.showEnhancedLoading(true, '[IT-ERA] Il nostro sistema sta elaborando la vostra richiesta...');
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'message',
          message: message,
          sessionId: this.sessionId,
          leadData: this.leadData,
          timestamp: Date.now()
        })
      });
      
      const result = await response.json();
      const responseTime = Date.now() - startTime;
      
      if (result.success) {
        // Update metrics
        this.updateConversationMetrics(result, responseTime);
        
        // Show AI status if AI-powered
        if (result.aiPowered) {
          this.showAIStatus(result.cached);
        }
        
        // Add bot message with enhanced features
        this.addEnhancedBotMessage(result);
        
        // Handle escalation mode
        if (result.escalate) {
          this.handleEscalation(result);
        }
        
        // Show smart suggestions
        this.updateSmartSuggestions(result);
        
        // Handle data collection
        if (result.step === 'contact_collection' || result.escalate) {
          setTimeout(() => this.showDataCollectionForm(result), 1000);
        }
        
      } else {
        this.addBotMessage('[IT-ERA] Non ho compreso completamente la vostra richiesta. Potete specificare meglio come possiamo assistervi?', 
                          ['Richiedi Preventivo', 'Supporto Tecnico', 'Contatta Specialista']);
      }
      
    } catch (error) {
      console.error('Enhanced chat error:', error);
      this.addBotMessage(
        '[IT-ERA] Stiamo riscontrando un rallentamento temporaneo. Il nostro team tecnico è comunque disponibile per assistervi immediatamente.',
        ['Contatta Specialista', 'Riprova Messaggio', 'Chiamata Diretta']
      );
      this.showEscalationOptions();
    } finally {
      this.showEnhancedLoading(false);
    }
  }
  
  addUserMessage(text) {
    const messagesContainer = document.getElementById('itera-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'itera-chat-message user';
    messageDiv.innerHTML = `
      <div class="itera-chat-message-content">${text}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }
  
  addEnhancedBotMessage(result) {
    const messagesContainer = document.getElementById('itera-chat-messages');
    const messageDiv = document.createElement('div');
    
    // Enhanced message classes
    let messageClasses = 'itera-chat-message bot';
    if (result.aiPowered) messageClasses += ' ai-powered';
    if (result.escalate) messageClasses += ' escalation';
    if (result.cached) messageClasses += ' cached';
    
    // CRITICAL: Emergency message styling
    if (result.emergency || result.priority === 'immediate' || result.bypassedAllFlows) {
      messageClasses += ' emergency-critical';
    }
    
    messageDiv.className = messageClasses;
    
    let optionsHtml = '';
    if (result.options && result.options.length > 0) {
      optionsHtml = `
        <div class="itera-chat-options">
          ${result.options.map((option, index) => `
            <button class="itera-chat-option" data-option="${option}" data-index="${index}">
              ${option}
            </button>
          `).join('')}
        </div>
      `;
    }
    
    // Enhanced message content with metadata
    let metadataHtml = '';
    if (result.aiPowered || result.responseTime > 3000) {
      metadataHtml = `
        <div class="itera-message-metadata">
          ${result.aiPowered ? '<span class="ai-badge">🤖 AI</span>' : ''}
          ${result.cached ? '<span class="cached-badge">⚡ Cached</span>' : ''}
          ${result.responseTime > 3000 ? `<span class="time-badge">${(result.responseTime/1000).toFixed(1)}s</span>` : ''}
        </div>
      `;
    }
    
    messageDiv.innerHTML = `
      <div class="itera-chat-message-content">
        ${this.formatMessageText(this.sanitizeResponse(result.response))}
        ${metadataHtml}
      </div>
      ${optionsHtml}
    `;
    
    messagesContainer.appendChild(messageDiv);
    
    // Enhanced event listeners for options
    if (result.options && result.options.length > 0) {
      messageDiv.querySelectorAll('.itera-chat-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const option = e.target.dataset.option;
          const index = e.target.dataset.index;
          
          // Track option selection
          this.trackOptionSelection(option, index, result.intent);
          
          // Auto-fill and send
          document.getElementById('itera-chat-textarea').value = option;
          this.sendMessage();
        });
      });
    }
    
    this.scrollToBottom();
    this.playMessageSound();
  }
  
  // Legacy method for backwards compatibility
  addBotMessage(text, options = []) {
    const fakeResult = {
      response: text,
      options: options,
      aiPowered: false,
      intent: 'general'
    };
    this.addEnhancedBotMessage(fakeResult);
  }
  
  showEmailForm() {
    const text = `Perfetto! Per inviarti il preventivo personalizzato, ho bisogno di alcuni dati:
    
📝 **Compila il form qui sotto:**`;
    
    this.addBotMessage(text);
    
    // Integrazione con form esistente (da implementare)
    const formHtml = `
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #666;">
          <a href="#" onclick="window.ITERAChat.openEmailForm()" style="color: ${this.config.primaryColor};">
            👉 Clicca qui per aprire il form di contatto
          </a>
        </p>
        <p style="margin: 0; font-size: 11px; color: #999;">
          Il form si aprirà con i dati già precompilati dalla nostra conversazione
        </p>
      </div>
    `;
    
    const messagesContainer = document.getElementById('itera-chat-messages');
    const formDiv = document.createElement('div');
    formDiv.innerHTML = formHtml;
    messagesContainer.appendChild(formDiv);
    
    this.scrollToBottom();
  }
  
  showLoading(show) {
    const loading = document.getElementById('itera-chat-loading');
    const sendBtn = document.getElementById('itera-chat-send');
    
    this.isLoading = show;
    
    if (show) {
      loading.classList.remove('hidden');
      sendBtn.disabled = true;
    } else {
      loading.classList.add('hidden');  
      sendBtn.disabled = false;
    }
    
    this.scrollToBottom();
  }
  
  scrollToBottom() {
    const messagesContainer = document.getElementById('itera-chat-messages');
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  }
  
  // API pubbliche
  openEmailForm() {
    // Integrazione con form esistente
    if (typeof ITERAFormHandler !== 'undefined') {
      // Pre-compila form con dati da chat
      const formData = this.getCollectedData();
      // Logica per aprire/precompilare form
    }
    
    // Fallback: scroll to form
    const form = document.querySelector('#contactForm, .contact-form form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
      this.closeChat();
    }
  }
  
  getCollectedData() {
    // Estrae dati dalla conversazione per precompilare form
    return {
      // Da implementare logica di estrazione
    };
  }
}

// Auto-init se configurazione presente
document.addEventListener('DOMContentLoaded', function() {
  // Configurazione di default per IT-ERA
  if (typeof window.iteraChatConfig === 'undefined') {
    window.iteraChatConfig = {
      apiEndpoint: 'https://it-era.it/api/chat',
      position: 'bottom-right',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      autoOpen: false,
      companyName: 'IT-ERA'
    };
  }
  
  // Inizializza widget
  window.ITERAChat = new ITERAChatWidget(window.iteraChatConfig);
});

// Export per uso come modulo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ITERAChatWidget;
}