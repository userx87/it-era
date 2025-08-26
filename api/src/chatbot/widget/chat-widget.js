/**
 * Mark - IT-ERA Personal Assistant Chat Widget
 * Modern WhatsApp-style chat interface with full-screen capability
 * and customer data collection before chat
 */

class MarkChatWidget {
  constructor(options = {}) {
    this.config = {
      apiEndpoint: options.apiEndpoint || 'https://it-era.it/api/chat',
      position: options.position || 'bottom-right',
      primaryColor: options.primaryColor || '#25D366',
      secondaryColor: options.secondaryColor || '#128C7E',
      autoOpen: options.autoOpen || false,
      greeting: options.greeting || "Ciao sono Mark, assistente di IT-ERA, come posso aiutarti?",
      companyName: options.companyName || 'Mark',
      botName: 'Mark',
      ...options
    };
    
    this.sessionId = null;
    this.conversationId = null;
    this.isOpen = false;
    this.isFullScreen = false;
    this.isLoading = false;
    this.isTyping = false;
    this.messages = [];
    this.leadData = {};
    this.customerData = {
      nome: '',
      cognome: '',
      email: '',
      telefono: ''
    };
    this.isDataCollected = false;
    this.showingDataForm = false;
    this.conversationMetrics = {
      messageCount: 0,
      aiResponses: 0,
      averageResponseTime: 0,
      totalCost: 0
    };
    this.suggestions = [];
    this.quickReplies = [];
    this.escalationMode = false;
    
    // Conversation ID management
    this.conversationCache = new Map();
    this.storageKey = 'itera_conversations';
    this.currentConversationKey = 'itera_current_conversation';
    this.maxCachedConversations = 50;
    
    // Initialize conversation management
    this.initConversationManager();
    
    // Vision capabilities
    this.visionEnabled = true;
    this.maxImages = 5;
    this.maxImageSize = 20 * 1024 * 1024; // 20MB
    this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.uploadedImages = [];
    
    this.init();
  }
  
  /**
   * Initialize conversation ID management system
   */
  initConversationManager() {
    this.loadConversationsFromStorage();
    this.loadCurrentConversation();
  }
  
  /**
   * Load cached conversations from localStorage
   */
  loadConversationsFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const conversations = JSON.parse(stored);
        Object.entries(conversations).forEach(([id, data]) => {
          this.conversationCache.set(id, data);
        });
      }
    } catch (error) {
      console.warn('Error loading conversations from storage:', error);
    }
  }
  
  /**
   * Save conversations to localStorage
   */
  saveConversationsToStorage() {
    try {
      const conversations = {};
      this.conversationCache.forEach((data, id) => {
        conversations[id] = data;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    } catch (error) {
      console.warn('Error saving conversations to storage:', error);
    }
  }
  
  /**
   * Load current conversation from storage
   */
  loadCurrentConversation() {
    try {
      const currentId = localStorage.getItem(this.currentConversationKey);
      if (currentId && this.conversationCache.has(currentId)) {
        this.conversationId = currentId;
        const conversation = this.conversationCache.get(currentId);
        this.sessionId = conversation.sessionId;
        this.messages = conversation.messages || [];
        this.leadData = conversation.leadData || {};
        this.conversationMetrics = conversation.metrics || {
          messageCount: 0,
          aiResponses: 0,
          averageResponseTime: 0,
          totalCost: 0
        };
      }
    } catch (error) {
      console.warn('Error loading current conversation:', error);
    }
  }
  
  /**
   * Generate a new conversation ID
   */
  generateConversationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `conv_${timestamp}_${random}`;
  }
  
  /**
   * Save current conversation state
   */
  saveConversationState() {
    if (!this.conversationId) {
      this.conversationId = this.generateConversationId();
    }
    
    const conversationData = {
      id: this.conversationId,
      sessionId: this.sessionId,
      messages: this.messages,
      leadData: this.leadData,
      metrics: this.conversationMetrics,
      timestamp: Date.now(),
      lastActivity: new Date().toISOString()
    };
    
    this.conversationCache.set(this.conversationId, conversationData);
    
    // Cleanup old conversations if exceeding limit
    if (this.conversationCache.size > this.maxCachedConversations) {
      this.cleanupOldConversations();
    }
    
    this.saveConversationsToStorage();
    localStorage.setItem(this.currentConversationKey, this.conversationId);
    
    // Update UI
    this.updateConversationIdDisplay();
  }
  
  /**
   * Cleanup old conversations
   */
  cleanupOldConversations() {
    const conversations = Array.from(this.conversationCache.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp);
    
    // Keep only the most recent conversations
    const toKeep = conversations.slice(0, this.maxCachedConversations);
    const toDelete = conversations.slice(this.maxCachedConversations);
    
    this.conversationCache.clear();
    toKeep.forEach(([id, data]) => {
      this.conversationCache.set(id, data);
    });
    
    console.log(`Cleaned up ${toDelete.length} old conversations`);
  }
  
  /**
   * Restore conversation by ID
   */
  async restoreConversation(conversationId) {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }
      
      const conversation = this.conversationCache.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found in cache');
      }
      
      // Clear current state
      this.clearCurrentConversation();
      
      // Restore conversation state
      this.conversationId = conversationId;
      this.sessionId = conversation.sessionId;
      this.messages = conversation.messages || [];
      this.leadData = conversation.leadData || {};
      this.conversationMetrics = conversation.metrics || {
        messageCount: 0,
        aiResponses: 0,
        averageResponseTime: 0,
        totalCost: 0
      };
      
      // Update storage
      localStorage.setItem(this.currentConversationKey, conversationId);
      
      // Restore messages in UI
      await this.restoreMessagesUI();
      
      // Update conversation ID display
      this.updateConversationIdDisplay();
      
      this.addBotMessage('[IT-ERA] Conversazione ripristinata con successo.', []);
      
      return true;
    } catch (error) {
      console.error('Error restoring conversation:', error);
      this.addBotMessage(`[IT-ERA] Errore nel ripristino della conversazione: ${error.message}`, 
                        ['Nuova Conversazione', 'Riprova']);
      return false;
    }
  }
  
  /**
   * Clear current conversation
   */
  clearCurrentConversation() {
    const messagesContainer = document.getElementById('itera-chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    this.messages = [];
    this.leadData = {};
    this.conversationMetrics = {
      messageCount: 0,
      aiResponses: 0,
      averageResponseTime: 0,
      totalCost: 0
    };
  }
  
  /**
   * Restore messages in UI
   */
  async restoreMessagesUI() {
    const messagesContainer = document.getElementById('itera-chat-messages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';
    
    // Add initial greeting
    const greetingDiv = document.createElement('div');
    greetingDiv.className = 'itera-chat-message bot';
    greetingDiv.innerHTML = `
      <div class="itera-chat-message-content">
        ${this.config.greeting}
      </div>
    `;
    messagesContainer.appendChild(greetingDiv);
    
    // Restore messages with animation delay
    for (let i = 0; i < this.messages.length; i++) {
      const message = this.messages[i];
      await new Promise(resolve => {
        setTimeout(() => {
          if (message.type === 'user') {
            this.addUserMessage(message.content, false);
          } else {
            this.addBotMessage(message.content, message.options || [], false);
          }
          resolve();
        }, i * 100); // Stagger message restoration
      });
    }
    
    this.scrollToBottom();
  }
  
  /**
   * Copy conversation ID to clipboard
   */
  async copyConversationId() {
    try {
      if (!this.conversationId) {
        throw new Error('Nessuna conversazione attiva');
      }
      
      await navigator.clipboard.writeText(this.conversationId);
      
      // Show success feedback
      this.showTemporaryMessage('ID conversazione copiato!', 'success');
      
      return true;
    } catch (error) {
      console.error('Error copying conversation ID:', error);
      
      // Fallback for older browsers
      this.fallbackCopyToClipboard(this.conversationId || '');
      
      return false;
    }
  }
  
  /**
   * Fallback copy method for older browsers
   */
  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showTemporaryMessage('ID conversazione copiato!', 'success');
    } catch (error) {
      this.showTemporaryMessage('Errore nella copia', 'error');
    }
    
    document.body.removeChild(textArea);
  }
  
  /**
   * Show temporary message
   */
  showTemporaryMessage(message, type = 'info') {
    const container = document.getElementById('itera-chat-window');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `itera-temp-notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
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
      <div class="mark-chat-button" id="mark-chat-button">
        <div class="mark-chat-button-icon">
          <div class="mark-avatar">
            <span>M</span>
          </div>
        </div>
        <div class="mark-chat-button-badge hidden">1</div>
      </div>
      
      <!-- Customer Data Collection Form -->
      <div class="mark-data-form" id="mark-data-form">
        <div class="mark-data-header">
          <div class="mark-data-avatar">
            <span>M</span>
          </div>
          <div class="mark-data-info">
            <h3>Ciao sono Mark!</h3>
            <p>Per offrirti un'assistenza personalizzata, mi servono alcuni dati:</p>
          </div>
          <button class="mark-data-close" id="mark-data-close">×</button>
        </div>
        
        <form class="mark-data-form-content" id="mark-data-form-content">
          <div class="mark-form-group">
            <label for="mark-nome">Nome *</label>
            <input type="text" id="mark-nome" name="nome" placeholder="Il tuo nome" required>
          </div>
          
          <div class="mark-form-group">
            <label for="mark-cognome">Cognome *</label>
            <input type="text" id="mark-cognome" name="cognome" placeholder="Il tuo cognome" required>
          </div>
          
          <div class="mark-form-group">
            <label for="mark-email">Email *</label>
            <input type="email" id="mark-email" name="email" placeholder="la.tua@email.it" required>
          </div>
          
          <div class="mark-form-group">
            <label for="mark-telefono">Telefono</label>
            <input type="tel" id="mark-telefono" name="telefono" placeholder="+39 123 456 7890">
          </div>
          
          <button type="submit" class="mark-form-submit" id="mark-form-submit">
            Inizia Chat con Mark
          </button>
        </form>
      </div>
      
      <!-- Chat Window -->
      <div class="mark-chat-window hidden" id="mark-chat-window">
        <!-- Header -->
        <div class="mark-chat-header">
          <div class="mark-header-left">
            <button class="mark-back-btn" id="mark-back-btn" title="Torna alla finestra normale">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5m7-7l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="mark-header-avatar">
              <span>M</span>
            </div>
            <div class="mark-header-info">
              <h4>Mark</h4>
              <p class="mark-typing-status">online</p>
            </div>
          </div>
          <div class="mark-header-actions">
            <button class="mark-fullscreen-btn" id="mark-fullscreen-btn" title="Schermo intero">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8 0h3a2 2 0 002-2v-3m0-8V5a2 2 0 00-2-2h-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="mark-chat-close" id="mark-chat-close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Messages -->
        <div class="mark-chat-messages" id="mark-chat-messages">
          <!-- Messages will be populated here -->
        </div>
        
        <!-- Enhanced Loading & Typing Indicators -->
        <div class="mark-typing-indicator hidden" id="mark-typing-indicator">
          <div class="mark-typing-avatar">
            <span>M</span>
          </div>
          <div class="mark-typing-bubble">
            <div class="mark-typing-dots">
              <div class="mark-typing-dot"></div>
              <div class="mark-typing-dot"></div>
              <div class="mark-typing-dot"></div>
            </div>
            <span class="mark-typing-text">Mark sta scrivendo...</span>
          </div>
        </div>
        
        <!-- Input -->
        <div class="mark-chat-input">
          <div class="mark-input-container">
            <textarea 
              id="mark-chat-textarea" 
              placeholder="Scrivi un messaggio..."
              rows="1"
              maxlength="2000"
            ></textarea>
            <button class="mark-send-btn" id="mark-send-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Fullscreen Overlay -->
      <div class="mark-fullscreen-overlay hidden" id="mark-fullscreen-overlay">
        <div class="mark-fullscreen-header">
          <div class="mark-fullscreen-info">
            <div class="mark-fullscreen-avatar">
              <span>M</span>
            </div>
            <div class="mark-fullscreen-details">
              <h3>Mark</h3>
              <p class="mark-fullscreen-status">Assistente IT-ERA</p>
            </div>
          </div>
          <button class="mark-exit-fullscreen" id="mark-exit-fullscreen" title="Esci da schermo intero">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="mark-fullscreen-messages" id="mark-fullscreen-messages">
          <!-- Fullscreen messages container -->
        </div>
        
        <div class="mark-fullscreen-input">
          <div class="mark-fullscreen-input-container">
            <textarea 
              id="mark-fullscreen-textarea" 
              placeholder="Scrivi un messaggio..."
              rows="1"
            ></textarea>
            <button class="mark-fullscreen-send" id="mark-fullscreen-send">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
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
      /* Mark Chat Widget - WhatsApp Style */
      .itera-chat-widget {
        position: fixed;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      
      .itera-chat-widget.bottom-right {
        bottom: 24px;
        right: 24px;
      }
      
      .itera-chat-widget.bottom-left {
        bottom: 24px;
        left: 24px;
      }
      
      /* Mark Chat Button */
      .mark-chat-button {
        width: 64px;
        height: 64px;
        background: ${this.config.primaryColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 16px rgba(0,0,0,0.12), 0 4px 24px rgba(0,0,0,0.08);
        transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        position: relative;
        border: none;
        outline: none;
      }
      
      .mark-chat-button:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.1);
        background: ${this.config.secondaryColor};
      }
      
      .mark-avatar {
        width: 36px;
        height: 36px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 600;
        color: white;
      }
      
      .mark-chat-button-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #ff3b30;
        color: white;
        border-radius: 50%;
        min-width: 20px;
        height: 20px;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        padding: 0 4px;
        border: 2px solid white;
      }
      
      /* Customer Data Form */
      .mark-data-form {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
        overflow: hidden;
        animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
      
      .mark-data-header {
        background: ${this.config.primaryColor};
        color: white;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .mark-data-avatar {
        width: 48px;
        height: 48px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 600;
      }
      
      .mark-data-info h3 {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .mark-data-info p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }
      
      .mark-data-close {
        margin-left: auto;
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 50%;
        transition: background 0.2s ease;
      }
      
      .mark-data-close:hover {
        background: rgba(255,255,255,0.1);
      }
      
      .mark-data-form-content {
        padding: 24px;
      }
      
      .mark-form-group {
        margin-bottom: 20px;
      }
      
      .mark-form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #333;
        font-size: 14px;
      }
      
      .mark-form-group input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e1e5e9;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
      }
      
      .mark-form-group input:focus {
        outline: none;
        border-color: ${this.config.primaryColor};
      }
      
      .mark-form-submit {
        width: 100%;
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        padding: 14px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .mark-form-submit:hover {
        background: ${this.config.secondaryColor};
        transform: translateY(-1px);
      }
      
      /* Chat Window */
      .mark-chat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        height: 520px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      /* Chat Header */
      .mark-chat-header {
        background: ${this.config.primaryColor};
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      
      .mark-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }
      
      .mark-back-btn {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        transition: background 0.2s ease;
        display: none;
      }
      
      .mark-back-btn:hover {
        background: rgba(255,255,255,0.1);
      }
      
      .mark-header-avatar {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 600;
      }
      
      .mark-header-info h4 {
        margin: 0 0 2px 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .mark-typing-status {
        margin: 0;
        font-size: 12px;
        opacity: 0.8;
        font-weight: 400;
      }
      
      .mark-header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .mark-fullscreen-btn, .mark-chat-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 6px;
        border-radius: 50%;
        transition: all 0.2s ease;
        opacity: 0.8;
      }
      
      .mark-fullscreen-btn:hover, .mark-chat-close:hover {
        background: rgba(255,255,255,0.1);
        opacity: 1;
      }
      
      /* Messages Container */
      .mark-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f5f5f5;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .mark-chat-messages::-webkit-scrollbar {
        width: 6px;
      }
      
      .mark-chat-messages::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .mark-chat-messages::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.2);
        border-radius: 3px;
      }
      
      .mark-message {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        max-width: 85%;
        animation: messageSlide 0.3s ease;
      }
      
      .mark-message.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      
      .mark-message.bot {
        align-self: flex-start;
      }
      
      .mark-message-avatar {
        width: 32px;
        height: 32px;
        background: ${this.config.primaryColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: white;
        flex-shrink: 0;
      }
      
      .mark-message-bubble {
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
        word-wrap: break-word;
        position: relative;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      
      .mark-message.user .mark-message-bubble {
        background: ${this.config.primaryColor};
        color: white;
        border-bottom-right-radius: 6px;
      }
      
      .mark-message.bot .mark-message-bubble {
        background: white;
        color: #333;
        border-bottom-left-radius: 6px;
      }
      
      .mark-message-time {
        font-size: 11px;
        opacity: 0.6;
        margin-top: 4px;
        text-align: right;
      }
      
      .mark-message.bot .mark-message-time {
        text-align: left;
      }
      
      /* Typing Indicator */
      .mark-typing-indicator {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 20px;
        background: #f5f5f5;
        animation: fadeIn 0.3s ease;
      }
      
      .mark-typing-avatar {
        width: 32px;
        height: 32px;
        background: ${this.config.primaryColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: white;
        flex-shrink: 0;
      }
      
      .mark-typing-bubble {
        background: white;
        border-radius: 18px;
        border-bottom-left-radius: 6px;
        padding: 12px 16px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .mark-typing-dots {
        display: flex;
        gap: 3px;
      }
      
      .mark-typing-dot {
        width: 8px;
        height: 8px;
        background: ${this.config.primaryColor};
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
      }
      
      .mark-typing-dot:nth-child(1) { animation-delay: -0.32s; }
      .mark-typing-dot:nth-child(2) { animation-delay: -0.16s; }
      .mark-typing-dot:nth-child(3) { animation-delay: 0s; }
      
      @keyframes typing {
        0%, 80%, 100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% {
          transform: scale(1.2);
          opacity: 1;
        }
      }
      
      .mark-typing-text {
        font-size: 12px;
        color: #666;
        font-style: italic;
      }
      
      /* Input Area */
      .mark-chat-input {
        padding: 16px 20px;
        background: white;
        border-top: 1px solid #e1e5e9;
      }
      
      .mark-input-container {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        background: #f5f5f5;
        border-radius: 24px;
        padding: 8px 16px;
      }
      
      #mark-chat-textarea {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        max-height: 100px;
        min-height: 20px;
        line-height: 1.4;
        padding: 6px 0;
      }
      
      #mark-chat-textarea::placeholder {
        color: #999;
      }
      
      .mark-send-btn {
        width: 32px;
        height: 32px;
        background: ${this.config.primaryColor};
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: white;
        flex-shrink: 0;
      }
      
      .mark-send-btn:hover {
        background: ${this.config.secondaryColor};
        transform: scale(1.1);
      }
      
      .mark-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      /* Fullscreen Mode */
      .mark-fullscreen-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        z-index: 1000000;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
      
      .mark-fullscreen-header {
        background: ${this.config.primaryColor};
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .mark-fullscreen-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .mark-fullscreen-avatar {
        width: 48px;
        height: 48px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 600;
      }
      
      .mark-fullscreen-details h3 {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
      }
      
      .mark-fullscreen-status {
        margin: 0;
        font-size: 14px;
        opacity: 0.8;
      }
      
      .mark-exit-fullscreen {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: all 0.2s ease;
      }
      
      .mark-exit-fullscreen:hover {
        background: rgba(255,255,255,0.1);
      }
      
      .mark-fullscreen-messages {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        background: #f5f5f5;
      }
      
      .mark-fullscreen-input {
        padding: 20px 24px;
        background: white;
        border-top: 1px solid #e1e5e9;
      }
      
      .mark-fullscreen-input-container {
        display: flex;
        align-items: flex-end;
        gap: 16px;
        background: #f5f5f5;
        border-radius: 24px;
        padding: 12px 20px;
        max-width: 800px;
        margin: 0 auto;
      }
      
      #mark-fullscreen-textarea {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 16px;
        font-family: inherit;
        resize: none;
        max-height: 120px;
        min-height: 24px;
        line-height: 1.4;
        padding: 8px 0;
      }
      
      .mark-fullscreen-send {
        width: 40px;
        height: 40px;
        background: ${this.config.primaryColor};
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: white;
      }
      
      .mark-fullscreen-send:hover {
        background: ${this.config.secondaryColor};
        transform: scale(1.1);
      }
      
      /* Animations */
      @keyframes messageSlide {
        from {
          opacity: 0;
          transform: translateY(15px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* Utility Classes */
      .hidden {
        display: none !important;
      }
      
      .mark-chat-window.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        height: 100vh;
        border-radius: 0;
        z-index: 1000000;
      }
      
      .mark-chat-window.fullscreen .mark-back-btn {
        display: block;
      }
      
      /* Mobile Responsive */
      @media (max-width: 480px) {
        .mark-data-form, .mark-chat-window {
          width: calc(100vw - 20px);
          left: 10px;
          right: 10px;
        }
        
        .mark-chat-window {
          height: calc(100vh - 100px);
        }
        
        .mark-data-form {
          bottom: 90px;
        }
        
        .mark-fullscreen-messages {
          padding: 16px;
        }
        
        .mark-fullscreen-input {
          padding: 16px;
        }
        
        .mark-fullscreen-input-container {
          padding: 8px 16px;
        }
      }
    `;
      
      .itera-restore-modal-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .itera-restore-modal-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      .itera-restore-modal-close:hover {
        background: rgba(255,255,255,0.1);
      }
      
      .itera-restore-modal-body {
        padding: 20px;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .itera-restore-modal-body p {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #333;
      }
      
      #itera-restore-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        font-size: 12px;
        font-family: monospace;
        margin-bottom: 20px;
        outline: none;
        transition: border-color 0.2s ease;
      }
      
      #itera-restore-input:focus {
        border-color: ${this.config.primaryColor};
      }
      
      .itera-restore-recent p {
        font-size: 12px;
        font-weight: 600;
        color: #666;
        margin-bottom: 8px;
      }
      
      .itera-recent-conversations {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 120px;
        overflow-y: auto;
      }
      
      .itera-recent-conversation {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: #f9f9f9;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 11px;
      }
      
      .itera-recent-conversation:hover {
        background: ${this.config.primaryColor};
        color: white;
      }
      
      .itera-recent-conversation-id {
        font-family: monospace;
        font-weight: 600;
      }
      
      .itera-recent-conversation-time {
        opacity: 0.6;
        font-size: 10px;
      }
      
      .itera-restore-modal-footer {
        padding: 16px 20px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .itera-restore-cancel {
        padding: 8px 16px;
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
      }
      
      .itera-restore-cancel:hover {
        background: #e0e0e0;
      }
      
      .itera-restore-confirm {
        padding: 8px 16px;
        background: ${this.config.primaryColor};
        border: none;
        border-radius: 6px;
        color: white;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s ease;
      }
      
      .itera-restore-confirm:hover {
        background: ${this.config.secondaryColor};
      }
      
      .itera-restore-confirm:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      /* Temporary Notifications */
      .itera-temp-notification {
        position: absolute;
        top: -40px;
        right: 0;
        background: #4CAF50;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        z-index: 1001;
        animation: slideDown 0.3s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .itera-temp-notification.error {
        background: #f44336;
      }
      
      .itera-temp-notification.fade-out {
        animation: fadeOut 0.3s ease;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fadeOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-10px);
        }
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
        
        .itera-restore-modal-content {
          width: 95%;
          margin: 10px;
        }
        
        #itera-conversation-id-text {
          max-width: 40px;
        }
        
        .itera-conversation-dropdown {
          min-width: 160px;
        }
      }
    `;
  }
  
  attachEventListeners() {
    // Mark chat button
    const button = document.getElementById('mark-chat-button');
    if (button) {
      button.addEventListener('click', () => this.showDataForm());
    }
    
    // Data form listeners
    this.attachDataFormListeners();
    
    // Chat window listeners
    this.attachChatWindowListeners();
    
    // Fullscreen listeners
    this.attachFullscreenListeners();
  }
  
  attachDataFormListeners() {
    const form = document.getElementById('mark-data-form-content');
    const closeBtn = document.getElementById('mark-data-close');
    
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleDataFormSubmit();
      });
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideDataForm());
    }
  }
  
  attachChatWindowListeners() {
    const closeBtn = document.getElementById('mark-chat-close');
    const sendBtn = document.getElementById('mark-send-btn');
    const textarea = document.getElementById('mark-chat-textarea');
    const fullscreenBtn = document.getElementById('mark-fullscreen-btn');
    const backBtn = document.getElementById('mark-back-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeChat());
    }
    
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }
    
    if (textarea) {
      textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      
      textarea.addEventListener('input', () => this.adjustTextareaHeight(textarea));
    }
    
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }
    
    if (backBtn) {
      backBtn.addEventListener('click', () => this.exitFullscreen());
    }
  }
  
  attachFullscreenListeners() {
    const exitBtn = document.getElementById('mark-exit-fullscreen');
    const sendBtn = document.getElementById('mark-fullscreen-send');
    const textarea = document.getElementById('mark-fullscreen-textarea');
    
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.exitFullscreen());
    }
    
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage(true)); // true for fullscreen
    }
    
    if (textarea) {
      textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage(true);
        }
      });
      
      textarea.addEventListener('input', () => this.adjustTextareaHeight(textarea));
    }
  }
  
  // === MARK INTERFACE METHODS ===
  
  showDataForm() {
    if (this.isDataCollected) {
      // If data is already collected, show chat directly
      this.showChat();
      return;
    }
    
    const dataForm = document.getElementById('mark-data-form');
    const chatWindow = document.getElementById('mark-chat-window');
    
    if (dataForm) {
      dataForm.classList.remove('hidden');
      this.showingDataForm = true;
      
      // Focus first input
      setTimeout(() => {
        const firstInput = document.getElementById('mark-nome');
        if (firstInput) firstInput.focus();
      }, 100);
    }
    
    if (chatWindow) {
      chatWindow.classList.add('hidden');
    }
  }
  
  hideDataForm() {
    const dataForm = document.getElementById('mark-data-form');
    if (dataForm) {
      dataForm.classList.add('hidden');
      this.showingDataForm = false;
    }
  }
  
  handleDataFormSubmit() {
    // Collect form data
    this.customerData.nome = document.getElementById('mark-nome')?.value || '';
    this.customerData.cognome = document.getElementById('mark-cognome')?.value || '';
    this.customerData.email = document.getElementById('mark-email')?.value || '';
    this.customerData.telefono = document.getElementById('mark-telefono')?.value || '';
    
    // Validate required fields
    if (!this.customerData.nome.trim() || !this.customerData.cognome.trim() || !this.customerData.email.trim()) {
      alert('Per favore compila tutti i campi obbligatori (Nome, Cognome, Email)');
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.customerData.email)) {
      alert('Per favore inserisci un indirizzo email valido');
      return;
    }
    
    // Mark data as collected
    this.isDataCollected = true;
    
    // Hide form and show chat
    this.hideDataForm();
    this.showChat();
  }
  
  showChat() {
    const chatWindow = document.getElementById('mark-chat-window');
    if (chatWindow) {
      chatWindow.classList.remove('hidden');
      this.isOpen = true;
      
      // Start conversation if not already started
      if (!this.sessionId) {
        this.startMarkConversation();
      }
      
      // Focus textarea
      setTimeout(() => {
        const textarea = document.getElementById('mark-chat-textarea');
        if (textarea) textarea.focus();
      }, 300);
    }
  }
  
  async startMarkConversation() {
    // Show typing indicator
    this.showTypingIndicator(true);
    
    // Simulate Mark's response
    setTimeout(() => {
      this.showTypingIndicator(false);
      this.addMarkMessage(this.config.greeting, false);
      
      // Auto expand to fullscreen after first message
      setTimeout(() => {
        this.toggleFullscreen();
      }, 1000);
    }, 1500);
    
    // Generate session
    this.sessionId = `mark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.conversationId = this.generateConversationId();
    this.saveConversationState();
  }
  
  toggleFullscreen() {
    const chatWindow = document.getElementById('mark-chat-window');
    const fullscreenOverlay = document.getElementById('mark-fullscreen-overlay');
    
    if (!this.isFullScreen) {
      // Enter fullscreen
      if (chatWindow) chatWindow.classList.add('hidden');
      if (fullscreenOverlay) {
        fullscreenOverlay.classList.remove('hidden');
        this.syncMessagesToFullscreen();
      }
      this.isFullScreen = true;
    } else {
      this.exitFullscreen();
    }
  }
  
  exitFullscreen() {
    const chatWindow = document.getElementById('mark-chat-window');
    const fullscreenOverlay = document.getElementById('mark-fullscreen-overlay');
    
    if (fullscreenOverlay) fullscreenOverlay.classList.add('hidden');
    if (chatWindow) chatWindow.classList.remove('hidden');
    this.isFullScreen = false;
  }
  
  syncMessagesToFullscreen() {
    const regularMessages = document.getElementById('mark-chat-messages');
    const fullscreenMessages = document.getElementById('mark-fullscreen-messages');
    
    if (regularMessages && fullscreenMessages) {
      fullscreenMessages.innerHTML = regularMessages.innerHTML;
      fullscreenMessages.scrollTop = fullscreenMessages.scrollHeight;
    }
  }
  
  // === MARK MESSAGING METHODS ===
  
  addMarkMessage(text, isUser = false) {
    const messagesContainer = this.isFullScreen 
      ? document.getElementById('mark-fullscreen-messages') 
      : document.getElementById('mark-chat-messages');
      
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `mark-message ${isUser ? 'user' : 'bot'}`;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    
    if (isUser) {
      messageDiv.innerHTML = `
        <div class="mark-message-bubble">
          ${text}
          <div class="mark-message-time">${timeStr}</div>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="mark-message-avatar">
          <span>M</span>
        </div>
        <div class="mark-message-bubble">
          ${text}
          <div class="mark-message-time">${timeStr}</div>
        </div>
      `;
    }
    
    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
    
    // Save to message history
    this.messages.push({
      type: isUser ? 'user' : 'bot',
      content: text,
      timestamp: Date.now()
    });
    
    // Sync to both containers if in fullscreen
    if (this.isFullScreen) {
      this.syncMessagesToFullscreen();
    }
  }
  
  showTypingIndicator(show) {
    const typingIndicator = document.getElementById('mark-typing-indicator');
    const typingStatus = document.querySelector('.mark-typing-status');
    
    if (show) {
      if (typingIndicator) {
        typingIndicator.classList.remove('hidden');
        this.scrollToBottom();
      }
      if (typingStatus) {
        typingStatus.textContent = 'sta scrivendo...';
      }
    } else {
      if (typingIndicator) {
        typingIndicator.classList.add('hidden');
      }
      if (typingStatus) {
        typingStatus.textContent = 'online';
      }
    }
  }
  
  async sendMessage(isFullscreen = false) {
    const textareaId = isFullscreen ? 'mark-fullscreen-textarea' : 'mark-chat-textarea';
    const textarea = document.getElementById(textareaId);
    
    if (!textarea) return;
    
    const message = textarea.value.trim();
    if (!message || this.isLoading) return;
    
    // Clear input
    textarea.value = '';
    this.adjustTextareaHeight(textarea);
    
    // Add user message
    this.addMarkMessage(message, true);
    
    // Show typing indicator
    this.showTypingIndicator(true);
    
    // Simulate API call or use real API
    try {
      setTimeout(async () => {
        this.showTypingIndicator(false);
        
        // Simple response logic for demo
        let response = "Grazie per il messaggio! Come posso aiutarti?";
        
        if (message.toLowerCase().includes('preventivo')) {
          response = `Perfetto ${this.customerData.nome}! Ti aiuto subito con il preventivo. Che tipo di servizio IT ti serve?`;
        } else if (message.toLowerCase().includes('assistenza')) {
          response = `Ciao ${this.customerData.nome}, sono qui per supportarti! Descrivi il problema che stai riscontrando.`;
        } else if (message.toLowerCase().includes('ciao') || message.toLowerCase().includes('salve')) {
          response = `Ciao ${this.customerData.nome}! Sono Mark, il tuo assistente personale IT-ERA. Come posso aiutarti oggi?`;
        }
        
        this.addMarkMessage(response, false);
      }, Math.random() * 1000 + 500); // Random delay 500-1500ms
      
    } catch (error) {
      this.showTypingIndicator(false);
      this.addMarkMessage("Mi dispiace, si è verificato un errore. Riprova tra poco.", false);
    }
  }
  
  adjustTextareaHeight(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  }
  
  closeChat() {
    const chatWindow = document.getElementById('mark-chat-window');
    const dataForm = document.getElementById('mark-data-form');
    const fullscreenOverlay = document.getElementById('mark-fullscreen-overlay');
    
    if (chatWindow) chatWindow.classList.add('hidden');
    if (dataForm) dataForm.classList.add('hidden');
    if (fullscreenOverlay) fullscreenOverlay.classList.add('hidden');
    
    this.isOpen = false;
    this.isFullScreen = false;
    this.showingDataForm = false;
  }
  
  scrollToBottom() {
    const container = this.isFullScreen 
      ? document.getElementById('mark-fullscreen-messages')
      : document.getElementById('mark-chat-messages');
      
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }
  
  // === COMPATIBILITY METHODS (keep some old methods for backwards compatibility) ===
  
  /**
   * Attach event listeners for restore modal
   */
  attachRestoreModalEventListeners() {
    const modal = document.getElementById('itera-restore-modal');
    const closeBtn = document.getElementById('itera-restore-modal-close');
    const cancelBtn = document.getElementById('itera-restore-cancel');
    const confirmBtn = document.getElementById('itera-restore-confirm');
    const input = document.getElementById('itera-restore-input');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideRestoreModal());
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideRestoreModal());
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.handleRestoreConfirm());
    }
    
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleRestoreConfirm();
        }
      });
      
      input.addEventListener('input', () => {
        const confirmBtn = document.getElementById('itera-restore-confirm');
        if (confirmBtn) {
          confirmBtn.disabled = input.value.trim().length === 0;
        }
      });
    }
    
    // Close modal when clicking outside
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideRestoreModal();
        }
      });
    }
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
    
    // Update conversation ID display
    this.updateConversationIdDisplay();
    
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
          timestamp: Date.now(),
          conversationId: this.conversationId // Include existing conversation ID if any
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (result.success) {
        this.sessionId = result.sessionId;
        
        // Generate conversation ID if not exists
        if (!this.conversationId) {
          this.conversationId = this.generateConversationId();
        }
        
        // Save conversation state
        this.saveConversationState();
        
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
      
      // Generate conversation ID even for fallback
      if (!this.conversationId) {
        this.conversationId = this.generateConversationId();
      }
      
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
      
      // Save fallback conversation state
      this.saveConversationState();
    } finally {
      this.showLoading(false);
      this.updateConversationIdDisplay();
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
          conversationId: this.conversationId,
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
      this.handleConversationError(error, 'sendMessage');
      this.showEscalationOptions();
    } finally {
      this.showEnhancedLoading(false);
    }
  }
  
  addUserMessage(text, saveToHistory = true) {
    const messagesContainer = document.getElementById('itera-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'itera-chat-message user';
    messageDiv.innerHTML = `
      <div class="itera-chat-message-content">${text}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    
    // Save to message history
    if (saveToHistory) {
      this.messages.push({
        type: 'user',
        content: text,
        timestamp: Date.now()
      });
      this.saveConversationState();
    }
    
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
    
    // Save to message history
    if (result.saveToHistory !== false) {
      this.messages.push({
        type: 'bot',
        content: result.response,
        options: result.options || [],
        timestamp: Date.now(),
        aiPowered: result.aiPowered || false,
        intent: result.intent || 'general'
      });
      this.saveConversationState();
    }
    
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
  
  /**
   * Update conversation ID display
   */
  updateConversationIdDisplay() {
    const conversationIdText = document.getElementById('itera-conversation-id-text');
    if (conversationIdText && this.conversationId) {
      // Show only last 8 characters for brevity
      const displayId = this.conversationId.length > 8 
        ? '...' + this.conversationId.slice(-8)
        : this.conversationId;
      conversationIdText.textContent = displayId;
      conversationIdText.title = `ID Completo: ${this.conversationId} (Clicca per copiare)`;
    }
  }
  
  /**
   * Start a new conversation
   */
  async startNewConversation() {
    try {
      // Save current conversation if exists
      if (this.conversationId && this.messages.length > 0) {
        this.saveConversationState();
      }
      
      // Clear current state
      this.clearCurrentConversation();
      this.sessionId = null;
      this.conversationId = null;
      
      // Remove current conversation from storage
      localStorage.removeItem(this.currentConversationKey);
      
      // Start fresh conversation
      await this.startConversation();
      
      this.addBotMessage('[IT-ERA] Nuova conversazione iniziata.', []);
      
    } catch (error) {
      console.error('Error starting new conversation:', error);
      this.addBotMessage('[IT-ERA] Errore nell\'avvio della nuova conversazione.', ['Riprova']);
    }
  }
  
  /**
   * Show restore conversation modal
   */
  showRestoreModal() {
    const modal = document.getElementById('itera-restore-modal');
    const input = document.getElementById('itera-restore-input');
    const recentContainer = document.getElementById('itera-recent-conversations');
    
    if (!modal) return;
    
    // Clear input
    if (input) {
      input.value = '';
      input.focus();
    }
    
    // Populate recent conversations
    this.populateRecentConversations(recentContainer);
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Update confirm button state
    const confirmBtn = document.getElementById('itera-restore-confirm');
    if (confirmBtn) {
      confirmBtn.disabled = true;
    }
  }
  
  /**
   * Hide restore conversation modal
   */
  hideRestoreModal() {
    const modal = document.getElementById('itera-restore-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }
  
  /**
   * Populate recent conversations list
   */
  populateRecentConversations(container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    // Get recent conversations sorted by timestamp
    const conversations = Array.from(this.conversationCache.entries())
      .filter(([id]) => id !== this.conversationId) // Exclude current conversation
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, 5); // Show only 5 most recent
    
    if (conversations.length === 0) {
      container.innerHTML = '<p style="font-size: 11px; color: #999; margin: 8px 0;">Nessuna conversazione precedente trovata.</p>';
      return;
    }
    
    conversations.forEach(([id, data]) => {
      const conversationEl = document.createElement('div');
      conversationEl.className = 'itera-recent-conversation';
      
      const shortId = id.length > 20 ? '...' + id.slice(-12) : id;
      const timeAgo = this.formatTimeAgo(data.timestamp);
      const messageCount = data.messages ? data.messages.length : 0;
      
      conversationEl.innerHTML = `
        <div>
          <div class="itera-recent-conversation-id">${shortId}</div>
          <div class="itera-recent-conversation-time">${timeAgo} • ${messageCount} messaggi</div>
        </div>
      `;
      
      conversationEl.addEventListener('click', () => {
        const input = document.getElementById('itera-restore-input');
        if (input) {
          input.value = id;
          const confirmBtn = document.getElementById('itera-restore-confirm');
          if (confirmBtn) {
            confirmBtn.disabled = false;
          }
        }
      });
      
      container.appendChild(conversationEl);
    });
  }
  
  /**
   * Format time ago string
   */
  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}g fa`;
    if (hours > 0) return `${hours}h fa`;
    if (minutes > 0) return `${minutes}m fa`;
    return 'Ora';
  }
  
  /**
   * Handle restore confirmation
   */
  async handleRestoreConfirm() {
    const input = document.getElementById('itera-restore-input');
    const conversationId = input ? input.value.trim() : '';
    
    if (!conversationId) {
      this.showTemporaryMessage('Inserisci un ID conversazione valido', 'error');
      return;
    }
    
    // Hide modal first
    this.hideRestoreModal();
    
    // Show loading
    this.showLoading(true);
    
    try {
      const success = await this.restoreConversation(conversationId);
      if (success) {
        this.showTemporaryMessage('Conversazione ripristinata con successo!', 'success');
      }
    } catch (error) {
      console.error('Error in handleRestoreConfirm:', error);
      this.showTemporaryMessage('Errore nel ripristino della conversazione', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  /**
   * Enhanced message handling with error context
   */
  handleConversationError(error, context = '') {
    console.error(`Conversation error (${context}):`, error);
    
    let errorMessage = '[IT-ERA] Si è verificato un errore';
    let options = ['Riprova', 'Nuova Conversazione'];
    
    if (this.conversationId) {
      errorMessage += `. ID conversazione: ${this.conversationId.slice(-8)}`;
      options.push('Copia ID Conversazione');
    }
    
    this.addBotMessage(errorMessage, options);
  }
  
  // Legacy method for backwards compatibility
  addBotMessage(text, options = [], saveToHistory = true) {
    const fakeResult = {
      response: text,
      options: options,
      aiPowered: false,
      intent: 'general',
      saveToHistory: saveToHistory
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
      conversationId: this.conversationId,
      sessionId: this.sessionId,
      messageCount: this.messages.length,
      leadData: this.leadData,
      timestamp: Date.now()
    };
  }
  
  /**
   * Enhanced loading with custom messages
   */
  showEnhancedLoading(show, message = 'L\'assistente sta scrivendo...') {
    const loading = document.getElementById('itera-chat-loading');
    const loadingText = document.getElementById('itera-loading-text');
    const sendBtn = document.getElementById('itera-chat-send');
    
    this.isLoading = show;
    
    if (show) {
      loading.classList.remove('hidden');
      if (loadingText) {
        loadingText.textContent = message;
      }
      sendBtn.disabled = true;
    } else {
      loading.classList.add('hidden');
      sendBtn.disabled = false;
    }
    
    this.scrollToBottom();
  }
  
  /**
   * Update conversation metrics
   */
  updateConversationMetrics(result, responseTime) {
    if (result.aiPowered) {
      this.conversationMetrics.aiResponses++;
    }
    
    // Update average response time
    const totalResponses = this.conversationMetrics.aiResponses + 1;
    this.conversationMetrics.averageResponseTime = 
      (this.conversationMetrics.averageResponseTime * (totalResponses - 1) + responseTime) / totalResponses;
    
    if (result.cost) {
      this.conversationMetrics.totalCost += result.cost;
    }
    
    // Save updated metrics
    this.saveConversationState();
  }
  
  /**
   * Show AI status indicator
   */
  showAIStatus(cached = false) {
    const aiStatus = document.getElementById('itera-ai-status');
    if (aiStatus) {
      const badge = aiStatus.querySelector('.itera-ai-text');
      if (badge) {
        badge.textContent = cached ? 'Risposta AI (Cache)' : 'Risposta AI';
      }
      aiStatus.classList.remove('hidden');
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        aiStatus.classList.add('hidden');
      }, 3000);
    }
  }
  
  /**
   * Handle escalation
   */
  handleEscalation(result) {
    this.escalationMode = true;
    
    // Add visual indicator
    const header = document.querySelector('.itera-chat-header');
    if (header) {
      header.classList.add('escalation-mode');
    }
    
    // Show escalation message
    if (result.escalationMessage) {
      this.addBotMessage(result.escalationMessage, result.escalationOptions || []);
    }
  }
  
  /**
   * Update smart suggestions
   */
  updateSmartSuggestions(result) {
    const suggestionsContainer = document.getElementById('itera-suggestions');
    const suggestionsContent = document.querySelector('.itera-suggestions-container');
    
    if (result.suggestions && result.suggestions.length > 0 && suggestionsContent) {
      suggestionsContent.innerHTML = '';
      
      result.suggestions.forEach(suggestion => {
        const suggestionEl = document.createElement('button');
        suggestionEl.className = 'itera-suggestion';
        suggestionEl.textContent = suggestion;
        suggestionEl.addEventListener('click', () => {
          document.getElementById('itera-chat-textarea').value = suggestion;
          this.sendMessage();
        });
        suggestionsContent.appendChild(suggestionEl);
      });
      
      suggestionsContainer.classList.remove('hidden');
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        suggestionsContainer.classList.add('hidden');
      }, 10000);
    } else if (suggestionsContainer) {
      suggestionsContainer.classList.add('hidden');
    }
  }
  
  /**
   * Show data collection form
   */
  showDataCollectionForm(result) {
    // This would integrate with existing form systems
    console.log('Data collection triggered:', result);
    
    // For now, show a message
    this.addBotMessage(
      '[IT-ERA] Per completare la richiesta, abbiamo bisogno di alcuni dati aggiuntivi.',
      ['Compila Form', 'Continua Chat', 'Chiamata Diretta']
    );
  }
  
  /**
   * Show escalation options
   */
  showEscalationOptions() {
    const quickReplies = document.getElementById('itera-quick-replies');
    const quickRepliesContainer = document.querySelector('.itera-quick-replies-container');
    
    if (quickRepliesContainer) {
      quickRepliesContainer.innerHTML = '';
      
      const escalationOptions = [
        'Contatta Specialista',
        'Chiamata Diretta: 039 888 2041',
        'Email: info@it-era.it',
        'Riprova Conversazione'
      ];
      
      escalationOptions.forEach(option => {
        const optionEl = document.createElement('button');
        optionEl.className = 'itera-quick-reply';
        optionEl.textContent = option;
        optionEl.addEventListener('click', () => {
          if (option.includes('Chiamata Diretta')) {
            window.open('tel:+390398882041', '_self');
          } else if (option.includes('Email')) {
            window.open('mailto:info@it-era.it', '_blank');
          } else {
            document.getElementById('itera-chat-textarea').value = option;
            this.sendMessage();
          }
        });
        quickRepliesContainer.appendChild(optionEl);
      });
      
      quickReplies.classList.remove('hidden');
    }
  }
  
  /**
   * Track option selection for analytics
   */
  trackOptionSelection(option, index, intent) {
    // Analytics tracking
    console.log('Option selected:', { option, index, intent, conversationId: this.conversationId });
    
    // Could send to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'chatbot_option_selected', {
        option_text: option,
        option_index: index,
        intent: intent,
        conversation_id: this.conversationId
      });
    }
  }
  
  /**
   * Format message text with basic formatting
   */
  formatMessageText(text) {
    if (!text) return '';
    
    // Basic formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
      .replace(/\n/g, '<br>') // line breaks
      .replace(/`(.*?)`/g, '<code>$1</code>'); // `code`
  }
  
  /**
   * Play message sound (optional)
   */
  playMessageSound() {
    // Optional sound notification
    if (this.config.enableSounds) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzuXz/LNeTMFJHfH8N+UPAgWZLfj57BJAAYTKcaGVdtdFjdGn7/owHDRJgtVAGFGICwtQjENJGgdSAJgACQMAJcAUJAGgIjQ4OPyABYMwMCJFgRzUPB4BgkXjQG4PBCQY9CQJgrGBPLCkJDPYwA3c'); 
        audio.volume = 0.1;
        audio.play().catch(() => {}); // Ignore errors
      } catch (error) {
        // Ignore sound errors
      }
    }
  }
  
  /**
   * Hide input suggestions
   */
  hideInputSuggestions() {
    const suggestions = document.getElementById('itera-input-suggestions');
    if (suggestions) {
      suggestions.classList.add('hidden');
    }
  }
}

// Auto-init Mark Chat Widget
document.addEventListener('DOMContentLoaded', function() {
  // Configurazione di default per Mark
  if (typeof window.markChatConfig === 'undefined') {
    window.markChatConfig = {
      apiEndpoint: 'https://it-era.it/api/chat',
      position: 'bottom-right',
      primaryColor: '#25D366',
      secondaryColor: '#128C7E',
      autoOpen: false,
      companyName: 'Mark',
      botName: 'Mark',
      greeting: 'Ciao sono Mark, assistente di IT-ERA, come posso aiutarti?'
    };
  }
  
  // Inizializza Mark Chat Widget
  window.MarkChat = new MarkChatWidget(window.markChatConfig);
  
  // Mantieni compatibilità per codice esistente
  window.ITERAChat = window.MarkChat;
});

// Export per uso come modulo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkChatWidget;
}