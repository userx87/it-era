/**
 * Mark Chatbot - Enhanced UX Implementation
 * Trasforma l'attuale chatbot IT-ERA in Mark con personalità più calda
 */

class MarkChatbot {
  constructor(options = {}) {
    this.config = {
      // Core Configuration
      apiEndpoint: options.apiEndpoint || 'https://it-era.it/api/chat',
      position: options.position || 'bottom-right',
      
      // Mark's Color Palette - Colori più caldi
      primaryColor: '#4A90E2',      // Blu più caldo
      secondaryColor: '#7B68EE',    // Viola amichevole  
      accentColor: '#50C878',       // Verde di successo
      warmColor: '#FF8C42',         // Arancio caldo
      
      // Personalità di Mark
      botName: 'Mark',
      greeting: "Ciao! Sono Mark 👋 Il tuo assistente IT personale di IT-ERA. Come posso esserti utile oggi?",
      personality: 'friendly',      // friendly, professional, casual
      useEmoji: true,
      
      // UX Settings
      expandOnClick: true,          // Espansione a schermo intero
      showTypingIndicator: true,    // "Mark sta scrivendo..."
      autoShowForm: true,           // Form automatico dopo 3 messaggi
      mobileFullscreen: true,       // Full-screen su mobile
      
      ...options
    };
    
    this.state = {
      isOpen: false,
      isExpanded: false,
      isTyping: false,
      sessionId: null,
      messageCount: 0,
      formShown: false,
      isMobile: window.innerWidth < 768
    };
    
    this.init();
  }
  
  init() {
    this.createMarkInterface();
    this.attachEventListeners();
    this.setupMobileHandlers();
    
    // Auto-open se richiesto
    if (this.config.autoOpen) {
      setTimeout(() => this.openChat(), 2000);
    }
  }
  
  /**
   * Crea l'interfaccia completa di Mark
   */
  createMarkInterface() {
    // Container principale
    this.container = document.createElement('div');
    this.container.id = 'mark-chat-widget';
    this.container.className = `mark-chat-widget ${this.config.position}`;
    
    this.container.innerHTML = `
      <!-- Floating Action Button con avatar Mark -->
      <div class="mark-fab" id="mark-fab">
        <div class="mark-fab-avatar">
          <span class="mark-avatar-initial">M</span>
          <div class="mark-avatar-pulse"></div>
        </div>
        <div class="mark-notification-badge hidden" id="mark-notification">1</div>
      </div>
      
      <!-- Chat Container -->
      <div class="mark-chat-container hidden" id="mark-chat-container">
        <!-- Header -->
        <div class="mark-chat-header">
          <div class="mark-header-info">
            <div class="mark-avatar">
              <div class="mark-avatar-circle">
                <span class="mark-avatar-initial">M</span>
                <div class="mark-avatar-pulse"></div>
              </div>
              <div class="mark-status-indicator online"></div>
            </div>
            <div class="mark-header-text">
              <h4>Mark</h4>
              <p class="mark-status-text">Assistente IT di IT-ERA</p>
            </div>
          </div>
          <div class="mark-header-actions">
            <button class="mark-expand-btn" id="mark-expand" title="Espandi chat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
            <button class="mark-close-btn" id="mark-close" title="Chiudi chat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Messages Area -->
        <div class="mark-messages-container" id="mark-messages">
          <div class="mark-welcome-screen" id="mark-welcome">
            <div class="mark-welcome-avatar">
              <div class="mark-avatar-large">
                <span>M</span>
              </div>
            </div>
            <h3>Ciao! Sono Mark 👋</h3>
            <p>Il tuo assistente IT personale di IT-ERA</p>
            <div class="mark-quick-starters">
              <button class="mark-quick-reply" data-text="Ho bisogno di un preventivo">
                💰 Preventivo
              </button>
              <button class="mark-quick-reply" data-text="Ho un problema urgente">
                🚨 Problema urgente  
              </button>
              <button class="mark-quick-reply" data-text="Vorrei solo informazioni">
                💬 Informazioni
              </button>
            </div>
          </div>
          
          <div class="mark-messages" id="mark-messages-list">
            <!-- Messages will be added here -->
          </div>
          
          <!-- Typing Indicator -->
          <div class="mark-typing hidden" id="mark-typing">
            <div class="mark-avatar-small">
              <span>M</span>
            </div>
            <div class="mark-typing-content">
              <span class="mark-typing-text">Mark sta scrivendo</span>
              <div class="mark-typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Customer Form -->
        <div class="mark-form-container hidden" id="mark-form-container">
          <div class="mark-form-header">
            <h3>👋 Facciamo conoscenza!</h3>
            <p>Aiutami a personalizzare l'assistenza per te</p>
          </div>
          
          <form class="mark-form" id="mark-customer-form">
            <div class="mark-form-group">
              <label for="mark-name" class="mark-form-label">Come ti chiami? *</label>
              <input type="text" id="mark-name" name="name" class="mark-form-input" required>
            </div>
            
            <div class="mark-form-group">
              <label for="mark-email" class="mark-form-label">Email *</label>
              <input type="email" id="mark-email" name="email" class="mark-form-input" required>
            </div>
            
            <div class="mark-form-group">
              <label for="mark-company" class="mark-form-label">Azienda</label>
              <input type="text" id="mark-company" name="company" class="mark-form-input">
            </div>
            
            <div class="mark-form-row">
              <div class="mark-form-group">
                <label for="mark-phone" class="mark-form-label">Telefono</label>
                <input type="tel" id="mark-phone" name="phone" class="mark-form-input">
              </div>
              <div class="mark-form-group">
                <label for="mark-city" class="mark-form-label">Città</label>
                <select id="mark-city" name="city" class="mark-form-select">
                  <option value="">Seleziona...</option>
                  <option value="milano">Milano</option>
                  <option value="monza">Monza</option>
                  <option value="bergamo">Bergamo</option>
                  <option value="lecco">Lecco</option>
                  <option value="como">Como</option>
                </select>
              </div>
            </div>
            
            <div class="mark-form-actions">
              <button type="button" class="mark-btn-secondary" id="mark-form-skip">
                Saltiamo per ora
              </button>
              <button type="submit" class="mark-btn-primary">
                Continua la chat →
              </button>
            </div>
          </form>
        </div>
        
        <!-- Input Area -->
        <div class="mark-input-area" id="mark-input-area">
          <div class="mark-input-container">
            <textarea 
              id="mark-input" 
              class="mark-input"
              placeholder="Scrivi a Mark..."
              rows="1"
              maxlength="500"
            ></textarea>
            <button class="mark-send-button" id="mark-send" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Overlay per mobile/expanded -->
      <div class="mark-overlay hidden" id="mark-overlay"></div>
    `;
    
    // Aggiungi CSS
    this.injectStyles();
    
    // Aggiungi al DOM
    document.body.appendChild(this.container);
  }
  
  /**
   * Inietta gli stili CSS di Mark
   */
  injectStyles() {
    if (document.getElementById('mark-chat-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'mark-chat-styles';
    styles.textContent = `
      /* Mark Chatbot CSS Variables */
      :root {
        --mark-primary: ${this.config.primaryColor};
        --mark-secondary: ${this.config.secondaryColor};
        --mark-accent: ${this.config.accentColor};
        --mark-warm: ${this.config.warmColor};
        --mark-bg-light: #F8FAFB;
        --mark-text-primary: #2C3E50;
        --mark-text-secondary: #5A6C7D;
        --mark-text-light: #8A9BA8;
        --mark-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        --mark-radius-sm: 8px;
        --mark-radius-md: 12px;
        --mark-radius-lg: 16px;
        --mark-radius-full: 9999px;
        --mark-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
        --mark-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
        --mark-shadow-lg: 0 8px 32px rgba(74, 144, 226, 0.3);
      }
      
      /* Base Styles */
      .mark-chat-widget {
        position: fixed;
        z-index: 999999;
        font-family: var(--mark-font-family);
        font-size: 16px;
      }
      
      .mark-chat-widget.bottom-right {
        bottom: 24px;
        right: 24px;
      }
      
      .mark-chat-widget.bottom-left {
        bottom: 24px;
        left: 24px;
      }
      
      /* Floating Action Button */
      .mark-fab {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, var(--mark-primary) 0%, var(--mark-secondary) 100%);
        border-radius: var(--mark-radius-full);
        border: none;
        cursor: pointer;
        box-shadow: var(--mark-shadow-lg);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .mark-fab:hover {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 12px 40px rgba(74, 144, 226, 0.4);
      }
      
      .mark-fab-avatar {
        position: relative;
      }
      
      .mark-avatar-initial {
        color: white;
        font-weight: 600;
        font-size: 24px;
        font-family: var(--mark-font-family);
      }
      
      .mark-avatar-pulse {
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border-radius: var(--mark-radius-full);
        border: 2px solid var(--mark-accent);
        opacity: 0;
        animation: markPulse 2s infinite;
      }
      
      @keyframes markPulse {
        0%, 100% { opacity: 0; transform: scale(1); }
        50% { opacity: 0.3; transform: scale(1.1); }
      }
      
      .mark-notification-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--mark-warm);
        color: white;
        border-radius: var(--mark-radius-full);
        width: 24px;
        height: 24px;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
      }
      
      /* Chat Container */
      .mark-chat-container {
        background: white;
        border-radius: var(--mark-radius-lg);
        box-shadow: var(--mark-shadow-md);
        width: 380px;
        height: 600px;
        position: absolute;
        bottom: 80px;
        right: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: markChatExpand 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      @keyframes markChatExpand {
        0% { opacity: 0; transform: scale(0.8) translateY(20px); }
        60% { opacity: 1; transform: scale(1.05) translateY(-5px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      
      /* Chat Header */
      .mark-chat-header {
        background: linear-gradient(135deg, var(--mark-primary) 0%, var(--mark-secondary) 100%);
        color: white;
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .mark-header-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .mark-avatar {
        position: relative;
      }
      
      .mark-avatar-circle {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: var(--mark-radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      
      .mark-status-indicator {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        border-radius: var(--mark-radius-full);
        border: 2px solid white;
      }
      
      .mark-status-indicator.online {
        background: var(--mark-accent);
      }
      
      .mark-header-text h4 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .mark-status-text {
        margin: 0;
        font-size: 12px;
        opacity: 0.9;
      }
      
      .mark-header-actions {
        display: flex;
        gap: 8px;
      }
      
      .mark-expand-btn,
      .mark-close-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        padding: 8px;
        border-radius: var(--mark-radius-sm);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .mark-expand-btn:hover,
      .mark-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      /* Messages Container */
      .mark-messages-container {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }
      
      /* Welcome Screen */
      .mark-welcome-screen {
        padding: 40px 20px;
        text-align: center;
        background: var(--mark-bg-light);
      }
      
      .mark-welcome-avatar {
        margin-bottom: 20px;
      }
      
      .mark-avatar-large {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, var(--mark-primary) 0%, var(--mark-secondary) 100%);
        border-radius: var(--mark-radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
      }
      
      .mark-avatar-large span {
        color: white;
        font-size: 32px;
        font-weight: 600;
      }
      
      .mark-welcome-screen h3 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: var(--mark-text-primary);
      }
      
      .mark-welcome-screen p {
        margin: 0 0 24px 0;
        color: var(--mark-text-secondary);
      }
      
      .mark-quick-starters {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .mark-quick-reply {
        background: white;
        border: 2px solid var(--mark-primary);
        color: var(--mark-primary);
        padding: 12px 20px;
        border-radius: var(--mark-radius-full);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .mark-quick-reply:hover {
        background: var(--mark-primary);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
      }
      
      /* Messages */
      .mark-messages {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .mark-message {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        animation: markMessageSlide 0.4s ease-out;
      }
      
      @keyframes markMessageSlide {
        0% { opacity: 0; transform: translateY(15px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      .mark-message.user {
        flex-direction: row-reverse;
      }
      
      .mark-message-bubble {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: var(--mark-radius-lg);
        font-size: 14px;
        line-height: 1.5;
        position: relative;
      }
      
      .mark-message.bot .mark-message-bubble {
        background: white;
        color: var(--mark-text-primary);
        border: 1px solid #E5E7EB;
        box-shadow: var(--mark-shadow-sm);
      }
      
      .mark-message.user .mark-message-bubble {
        background: linear-gradient(135deg, var(--mark-primary) 0%, var(--mark-secondary) 100%);
        color: white;
      }
      
      .mark-avatar-small {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, var(--mark-primary) 0%, var(--mark-secondary) 100%);
        border-radius: var(--mark-radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .mark-avatar-small span {
        color: white;
        font-size: 14px;
        font-weight: 600;
      }
      
      /* Typing Indicator */
      .mark-typing {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px 20px;
        animation: markSlideIn 0.3s ease-out;
      }
      
      @keyframes markSlideIn {
        0% { opacity: 0; transform: translateX(-20px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      
      .mark-typing-content {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--mark-bg-light);
        padding: 8px 12px;
        border-radius: var(--mark-radius-lg);
      }
      
      .mark-typing-text {
        font-size: 12px;
        color: var(--mark-text-secondary);
        font-style: italic;
      }
      
      .mark-typing-dots {
        display: flex;
        gap: 4px;
      }
      
      .mark-typing-dots span {
        width: 6px;
        height: 6px;
        background: var(--mark-primary);
        border-radius: var(--mark-radius-full);
        animation: markTypingBounce 1.4s infinite ease-in-out;
      }
      
      .mark-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
      .mark-typing-dots span:nth-child(2) { animation-delay: -0.16s; }
      .mark-typing-dots span:nth-child(3) { animation-delay: 0s; }
      
      @keyframes markTypingBounce {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1.2); }
      }
      
      /* Customer Form */
      .mark-form-container {
        background: white;
        border-top: 1px solid #E5E7EB;
        padding: 24px;
        animation: markSlideUp 0.5s ease-out;
      }
      
      @keyframes markSlideUp {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      .mark-form-header {
        text-align: center;
        margin-bottom: 24px;
      }
      
      .mark-form-header h3 {
        font-size: 20px;
        color: var(--mark-text-primary);
        margin-bottom: 8px;
      }
      
      .mark-form-header p {
        color: var(--mark-text-secondary);
        font-size: 14px;
        margin: 0;
      }
      
      .mark-form-group {
        margin-bottom: 16px;
      }
      
      .mark-form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .mark-form-label {
        display: block;
        font-weight: 500;
        color: var(--mark-text-primary);
        margin-bottom: 6px;
        font-size: 14px;
      }
      
      .mark-form-input,
      .mark-form-select {
        width: 100%;
        padding: 12px;
        border: 2px solid #E5E7EB;
        border-radius: var(--mark-radius-sm);
        font-size: 14px;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }
      
      .mark-form-input:focus,
      .mark-form-select:focus {
        outline: none;
        border-color: var(--mark-primary);
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
      }
      
      .mark-form-actions {
        display: flex;
        gap: 12px;
        justify-content: space-between;
        margin-top: 20px;
      }
      
      .mark-btn-primary,
      .mark-btn-secondary {
        padding: 12px 20px;
        border-radius: var(--mark-radius-sm);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        font-size: 14px;
      }
      
      .mark-btn-primary {
        background: linear-gradient(135deg, var(--mark-primary) 0%, var(--mark-secondary) 100%);
        color: white;
        flex: 1;
      }
      
      .mark-btn-secondary {
        background: transparent;
        color: var(--mark-text-secondary);
        border: 1px solid #E5E7EB;
      }
      
      .mark-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(74, 144, 226, 0.3);
      }
      
      .mark-btn-secondary:hover {
        background: var(--mark-bg-light);
        color: var(--mark-text-primary);
      }
      
      /* Input Area */
      .mark-input-area {
        border-top: 1px solid #E5E7EB;
        padding: 16px;
        background: white;
      }
      
      .mark-input-container {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        min-height: 52px;
      }
      
      .mark-input {
        flex: 1;
        min-height: 44px;
        padding: 12px 16px;
        border: 2px solid #E5E7EB;
        border-radius: var(--mark-radius-full);
        font-size: 14px;
        resize: none;
        font-family: var(--mark-font-family);
        transition: all 0.2s ease;
        box-sizing: border-box;
      }
      
      .mark-input:focus {
        outline: none;
        border-color: var(--mark-primary);
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
      }
      
      .mark-send-button {
        min-width: 44px;
        min-height: 44px;
        background: linear-gradient(135deg, var(--mark-primary) 0%, var(--mark-secondary) 100%);
        border: none;
        border-radius: var(--mark-radius-full);
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .mark-send-button:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
      }
      
      .mark-send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      /* Utility Classes */
      .hidden { display: none !important; }
      
      /* Mobile Responsiveness */
      @media (max-width: 768px) {
        .mark-chat-container {
          position: fixed !important;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100% !important;
          height: 100% !important;
          border-radius: 0;
          animation: markMobileSlideUp 0.4s ease-out;
        }
        
        @keyframes markMobileSlideUp {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        
        .mark-form-row {
          grid-template-columns: 1fr;
        }
        
        .mark-quick-starters {
          flex-direction: column;
        }
        
        .mark-fab {
          bottom: 20px;
          right: 20px;
        }
      }
      
      /* Expanded Mode (Desktop) */
      @media (min-width: 769px) {
        .mark-chat-container.expanded {
          width: 800px !important;
          height: 600px !important;
          position: fixed !important;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          right: auto;
          bottom: auto;
          z-index: 1000000;
        }
        
        .mark-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999999;
          backdrop-filter: blur(3px);
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  /**
   * Gestisce gli eventi di interazione
   */
  attachEventListeners() {
    const fab = document.getElementById('mark-fab');
    const close = document.getElementById('mark-close');
    const expand = document.getElementById('mark-expand');
    const send = document.getElementById('mark-send');
    const input = document.getElementById('mark-input');
    const form = document.getElementById('mark-customer-form');
    const formSkip = document.getElementById('mark-form-skip');
    
    // Apertura/chiusura chat
    fab.addEventListener('click', () => this.openChat());
    close.addEventListener('click', () => this.closeChat());
    
    // Espansione (solo desktop)
    if (!this.state.isMobile && expand) {
      expand.addEventListener('click', () => this.toggleExpanded());
    } else if (expand) {
      expand.style.display = 'none';
    }
    
    // Invio messaggi
    send.addEventListener('click', () => this.sendMessage());
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    input.addEventListener('input', () => {
      this.handleInputChange();
      this.autoResize();
    });
    
    // Quick replies
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('mark-quick-reply')) {
        const text = e.target.dataset.text;
        if (text) {
          input.value = text;
          this.sendMessage();
        }
      }
    });
    
    // Form customer
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }
    
    if (formSkip) {
      formSkip.addEventListener('click', () => this.skipForm());
    }
    
    // Overlay per chiudere
    const overlay = document.getElementById('mark-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.closeChat());
    }
  }
  
  /**
   * Setup gestori mobile
   */
  setupMobileHandlers() {
    // Gestione resize
    window.addEventListener('resize', () => {
      const wasMobile = this.state.isMobile;
      this.state.isMobile = window.innerWidth < 768;
      
      if (wasMobile !== this.state.isMobile) {
        this.handleResponsiveChange();
      }
    });
    
    // Gestione keyboard su mobile
    if (this.state.isMobile) {
      this.setupMobileKeyboard();
    }
  }
  
  /**
   * Gestisce il cambio responsive
   */
  handleResponsiveChange() {
    const container = document.getElementById('mark-chat-container');
    const overlay = document.getElementById('mark-overlay');
    
    if (this.state.isMobile) {
      // Da desktop a mobile
      container.classList.remove('expanded');
      overlay.classList.add('hidden');
    }
  }
  
  /**
   * Setup gestione keyboard mobile
   */
  setupMobileKeyboard() {
    const input = document.getElementById('mark-input');
    const container = document.getElementById('mark-chat-container');
    
    // Gestione keyboard show/hide
    let viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    
    const handleViewportChange = () => {
      if (!window.visualViewport) return;
      
      const currentHeight = window.visualViewport.height;
      const heightDiff = viewportHeight - currentHeight;
      
      if (heightDiff > 150) { // Keyboard is open
        container.style.height = `${currentHeight}px`;
        container.classList.add('keyboard-open');
      } else { // Keyboard is closed
        container.style.height = '100vh';
        container.classList.remove('keyboard-open');
      }
    };
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }
  }
  
  /**
   * Apre la chat
   */
  async openChat() {
    const container = document.getElementById('mark-chat-container');
    const fab = document.getElementById('mark-fab');
    const overlay = document.getElementById('mark-overlay');
    const welcome = document.getElementById('mark-welcome');
    
    this.state.isOpen = true;
    
    container.classList.remove('hidden');
    fab.style.display = 'none';
    
    // Su mobile, mostra overlay
    if (this.state.isMobile || this.state.isExpanded) {
      overlay.classList.remove('hidden');
    }
    
    // Se è la prima apertura, mostra welcome screen
    if (!this.state.sessionId) {
      welcome.classList.remove('hidden');
      await this.startSession();
    }
    
    // Focus input dopo l'animazione
    setTimeout(() => {
      const input = document.getElementById('mark-input');
      if (input && !this.state.isMobile) {
        input.focus();
      }
    }, 600);
  }
  
  /**
   * Chiude la chat
   */
  closeChat() {
    const container = document.getElementById('mark-chat-container');
    const fab = document.getElementById('mark-fab');
    const overlay = document.getElementById('mark-overlay');
    
    this.state.isOpen = false;
    this.state.isExpanded = false;
    
    container.classList.add('hidden');
    container.classList.remove('expanded');
    fab.style.display = 'flex';
    overlay.classList.add('hidden');
  }
  
  /**
   * Espande la chat (solo desktop)
   */
  toggleExpanded() {
    if (this.state.isMobile) return;
    
    const container = document.getElementById('mark-chat-container');
    const overlay = document.getElementById('mark-overlay');
    
    this.state.isExpanded = !this.state.isExpanded;
    
    if (this.state.isExpanded) {
      container.classList.add('expanded');
      overlay.classList.remove('hidden');
    } else {
      container.classList.remove('expanded');
      overlay.classList.add('hidden');
    }
  }
  
  /**
   * Gestisce il cambio input
   */
  handleInputChange() {
    const input = document.getElementById('mark-input');
    const send = document.getElementById('mark-send');
    
    const hasText = input.value.trim().length > 0;
    send.disabled = !hasText;
  }
  
  /**
   * Auto-resize textarea
   */
  autoResize() {
    const input = document.getElementById('mark-input');
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }
  
  /**
   * Avvia la sessione
   */
  async startSession() {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.state.sessionId = data.sessionId;
        // Rimuovi welcome screen dopo la risposta
        setTimeout(() => {
          document.getElementById('mark-welcome').classList.add('hidden');
        }, 1000);
      }
    } catch (error) {
      console.error('Session start error:', error);
      // Continua comunque con una sessione locale
      this.state.sessionId = 'local_' + Date.now();
    }
  }
  
  /**
   * Invia un messaggio
   */
  async sendMessage() {
    const input = document.getElementById('mark-input');
    const message = input.value.trim();
    
    if (!message || this.state.isTyping) return;
    
    // Pulisci input
    input.value = '';
    this.handleInputChange();
    this.autoResize();
    
    // Nascondi welcome se visibile
    const welcome = document.getElementById('mark-welcome');
    if (!welcome.classList.contains('hidden')) {
      welcome.classList.add('hidden');
    }
    
    // Aggiungi messaggio utente
    this.addMessage(message, 'user');
    this.state.messageCount++;
    
    // Mostra typing indicator
    this.showTyping();
    
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          message: message,
          sessionId: this.state.sessionId,
          timestamp: Date.now()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Simula delay di scrittura più realistico
        await this.simulateTypingDelay(data.response);
        
        this.hideTyping();
        this.addMessage(data.response, 'bot', data.options);
        
        // Mostra form dopo 3 messaggi
        if (this.state.messageCount >= 3 && !this.state.formShown && this.config.autoShowForm) {
          setTimeout(() => this.showCustomerForm(), 2000);
        }
        
      } else {
        this.hideTyping();
        this.addMessage('Mi dispiace, c\'è stato un problema. Potresti ripetere?', 'bot');
      }
      
    } catch (error) {
      console.error('Send message error:', error);
      this.hideTyping();
      this.addMessage('Ops, qualcosa è andato storto. Riprova tra un momento! 😅', 'bot');
    }
  }
  
  /**
   * Simula delay di scrittura realistico
   */
  async simulateTypingDelay(response) {
    // Calcola delay basato sulla lunghezza del messaggio
    const baseDelay = 800;
    const charDelay = response.length * 20;
    const totalDelay = Math.min(Math.max(baseDelay, charDelay), 3000);
    
    await new Promise(resolve => setTimeout(resolve, totalDelay));
  }
  
  /**
   * Mostra typing indicator
   */
  showTyping() {
    this.state.isTyping = true;
    const typing = document.getElementById('mark-typing');
    typing.classList.remove('hidden');
    this.scrollToBottom();
  }
  
  /**
   * Nasconde typing indicator
   */
  hideTyping() {
    this.state.isTyping = false;
    const typing = document.getElementById('mark-typing');
    typing.classList.add('hidden');
  }
  
  /**
   * Aggiunge un messaggio alla chat
   */
  addMessage(text, sender, options = []) {
    const messagesList = document.getElementById('mark-messages-list');
    const messageEl = document.createElement('div');
    
    messageEl.className = `mark-message ${sender}`;
    
    if (sender === 'bot') {
      messageEl.innerHTML = `
        <div class="mark-avatar-small">
          <span>M</span>
        </div>
        <div class="mark-message-bubble">${this.formatMessage(text)}</div>
      `;
    } else {
      messageEl.innerHTML = `
        <div class="mark-message-bubble">${this.formatMessage(text)}</div>
      `;
    }
    
    messagesList.appendChild(messageEl);
    
    // Aggiungi opzioni se presenti
    if (options && options.length > 0) {
      this.addQuickReplies(options);
    }
    
    this.scrollToBottom();
  }
  
  /**
   * Aggiunge quick replies
   */
  addQuickReplies(options) {
    const messagesList = document.getElementById('mark-messages-list');
    const repliesEl = document.createElement('div');
    
    repliesEl.className = 'mark-quick-replies-container';
    repliesEl.innerHTML = `
      <div class="mark-quick-replies">
        ${options.map(option => `
          <button class="mark-quick-reply" data-text="${option}">
            ${option}
          </button>
        `).join('')}
      </div>
    `;
    
    messagesList.appendChild(repliesEl);
    this.scrollToBottom();
  }
  
  /**
   * Formatta il messaggio (emoji, markdown basic)
   */
  formatMessage(text) {
    // Basic markdown
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
  
  /**
   * Scroll automatico in fondo
   */
  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('mark-messages');
      container.scrollTop = container.scrollHeight;
    }, 100);
  }
  
  /**
   * Mostra form dati cliente
   */
  showCustomerForm() {
    const formContainer = document.getElementById('mark-form-container');
    const inputArea = document.getElementById('mark-input-area');
    
    this.state.formShown = true;
    formContainer.classList.remove('hidden');
    inputArea.classList.add('hidden');
    
    // Scroll to form
    this.scrollToBottom();
    
    // Focus primo campo
    setTimeout(() => {
      const nameInput = document.getElementById('mark-name');
      if (nameInput && !this.state.isMobile) {
        nameInput.focus();
      }
    }, 500);
  }
  
  /**
   * Gestisce submit del form
   */
  handleFormSubmit() {
    const formData = new FormData(document.getElementById('mark-customer-form'));
    const data = Object.fromEntries(formData);
    
    // Valida dati richiesti
    if (!data.name || !data.email) {
      alert('Nome ed email sono richiesti!');
      return;
    }
    
    this.hideCustomerForm();
    this.addMessage(`Perfetto ${data.name}! 🎉 Ora so come aiutarti meglio. Continuiamo pure!`, 'bot');
    
    // Salva dati cliente
    this.customerData = data;
  }
  
  /**
   * Salta il form
   */
  skipForm() {
    this.hideCustomerForm();
    this.addMessage('Nessun problema! Possiamo continuare così. Come posso aiutarti? 😊', 'bot');
  }
  
  /**
   * Nasconde form dati cliente
   */
  hideCustomerForm() {
    const formContainer = document.getElementById('mark-form-container');
    const inputArea = document.getElementById('mark-input-area');
    
    formContainer.classList.add('hidden');
    inputArea.classList.remove('hidden');
    
    // Focus input
    setTimeout(() => {
      const input = document.getElementById('mark-input');
      if (input && !this.state.isMobile) {
        input.focus();
      }
    }, 300);
  }
  
  /**
   * API pubblica per integrazioni esterne
   */
  
  // Apri chat dall'esterno
  open() {
    if (!this.state.isOpen) {
      this.openChat();
    }
  }
  
  // Chiudi chat dall'esterno
  close() {
    if (this.state.isOpen) {
      this.closeChat();
    }
  }
  
  // Invia messaggio dall'esterno
  sendExternalMessage(message) {
    if (this.state.isOpen) {
      const input = document.getElementById('mark-input');
      input.value = message;
      this.sendMessage();
    }
  }
  
  // Mostra notifica
  showNotification(count = 1) {
    const badge = document.getElementById('mark-notification');
    badge.textContent = count;
    badge.classList.remove('hidden');
  }
  
  // Nascondi notifica
  hideNotification() {
    const badge = document.getElementById('mark-notification');
    badge.classList.add('hidden');
  }
}

// Auto-inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  // Configurazione di default per IT-ERA
  if (typeof window.markChatConfig === 'undefined') {
    window.markChatConfig = {
      apiEndpoint: 'https://it-era.it/api/chat',
      position: 'bottom-right',
      autoOpen: false
    };
  }
  
  // Inizializza Mark
  window.MarkChatbot = new MarkChatbot(window.markChatConfig);
});

// Export per moduli
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkChatbot;
}