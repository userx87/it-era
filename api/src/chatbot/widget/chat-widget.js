/**
 * IT-ERA Chat Widget
 * Widget chat responsive per sito web con integrazione sistema email
 */

class ITERAChatWidget {
  constructor(options = {}) {
    this.config = {
      apiEndpoint: options.apiEndpoint || 'https://it-era-chatbot.bulltech.workers.dev/api/chat',
      position: options.position || 'bottom-right',
      primaryColor: options.primaryColor || '#667eea',
      secondaryColor: options.secondaryColor || '#764ba2',
      autoOpen: options.autoOpen || false,
      greeting: options.greeting || "Ciao! Come posso aiutarti?",
      companyName: options.companyName || 'IT-ERA',
      ...options
    };
    
    this.sessionId = null;
    this.isOpen = false;
    this.isLoading = false;
    this.messages = [];
    
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
            <textarea 
              id="itera-chat-textarea" 
              placeholder="Scrivi un messaggio..."
              rows="1"
              maxlength="500"
            ></textarea>
            <button class="itera-chat-send" id="itera-chat-send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Loading -->
        <div class="itera-chat-loading hidden" id="itera-chat-loading">
          <div class="itera-typing-indicator">
            <div class="itera-typing-dot"></div>
            <div class="itera-typing-dot"></div>
            <div class="itera-typing-dot"></div>
          </div>
          <span>L'assistente sta scrivendo...</span>
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
      
      /* Mobile responsive */
      @media (max-width: 480px) {
        .itera-chat-window {
          width: 90vw;
          height: 70vh;
          bottom: 80px;
          right: 5vw;
        }
        
        .itera-chat-widget.bottom-right {
          right: 20px;
        }
        
        .itera-chat-widget.bottom-left {
          left: 20px;
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
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.sessionId = result.sessionId;
        this.addBotMessage(result.response, result.options);
      }
    } catch (error) {
      console.error('Chat start error:', error);
      this.addBotMessage('Scusa, c\'è stato un errore. Riprova più tardi.');
    }
  }
  
  async sendMessage() {
    const textarea = document.getElementById('itera-chat-textarea');
    const message = textarea.value.trim();
    
    if (!message || this.isLoading) return;
    
    // Aggiungi messaggio utente
    this.addUserMessage(message);
    textarea.value = '';
    textarea.style.height = 'auto';
    
    // Mostra loading
    this.showLoading(true);
    
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'message',
          message: message,
          sessionId: this.sessionId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.addBotMessage(result.response, result.options);
        
        // Se è un intent che richiede email, mostra form
        if (['preventivo', 'supporto'].includes(result.intent)) {
          setTimeout(() => {
            this.showEmailForm();
          }, 1000);
        }
      } else {
        this.addBotMessage('Scusa, non ho capito. Puoi ripetere?');
      }
      
    } catch (error) {
      console.error('Chat message error:', error);
      this.addBotMessage('C\'è stato un errore di connessione. Riprova.');
    } finally {
      this.showLoading(false);
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
  
  addBotMessage(text, options = []) {
    const messagesContainer = document.getElementById('itera-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'itera-chat-message bot';
    
    let optionsHtml = '';
    if (options && options.length > 0) {
      optionsHtml = `
        <div class="itera-chat-options">
          ${options.map(option => `
            <button class="itera-chat-option" data-option="${option}">
              ${option}
            </button>
          `).join('')}
        </div>
      `;
    }
    
    messageDiv.innerHTML = `
      <div class="itera-chat-message-content">${text}</div>
      ${optionsHtml}
    `;
    
    messagesContainer.appendChild(messageDiv);
    
    // Aggiungi event listener per opzioni
    if (options && options.length > 0) {
      messageDiv.querySelectorAll('.itera-chat-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const option = e.target.dataset.option;
          document.getElementById('itera-chat-textarea').value = option;
          this.sendMessage();
        });
      });
    }
    
    this.scrollToBottom();
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
      apiEndpoint: 'https://it-era-chatbot.bulltech.workers.dev/api/chat',
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