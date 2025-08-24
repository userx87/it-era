/**
 * Enhanced AI Widget Methods
 * Additional functionality for AI-powered chat features
 */

// Add these methods to the ITERAChatWidget class:

updateConversationMetrics(result, responseTime) {
  if (result.aiPowered) this.conversationMetrics.aiResponses++;
  
  this.conversationMetrics.averageResponseTime = 
    (this.conversationMetrics.averageResponseTime * (this.conversationMetrics.messageCount - 1) + responseTime) 
    / this.conversationMetrics.messageCount;
  
  if (result.cost) {
    this.conversationMetrics.totalCost += result.cost;
  }
}

showAIStatus(cached = false) {
  const aiStatus = document.getElementById('itera-ai-status');
  const aiText = aiStatus.querySelector('.itera-ai-text');
  
  aiText.textContent = cached ? 'Risposta Rapida' : 'Risposta AI';
  aiStatus.classList.remove('hidden');
  
  setTimeout(() => {
    aiStatus.classList.add('hidden');
  }, 3000);
}

showEnhancedLoading(show, customText = null) {
  const loading = document.getElementById('itera-chat-loading');
  const loadingText = document.getElementById('itera-loading-text');
  const sendBtn = document.getElementById('itera-chat-send');
  
  this.isLoading = show;
  
  if (show) {
    if (customText) loadingText.textContent = customText;
    loading.classList.remove('hidden');
    sendBtn.disabled = true;
    
    // Simulate realistic AI thinking time
    this.showTypingAnimation();
  } else {
    loading.classList.add('hidden');
    sendBtn.disabled = false;
    loadingText.textContent = "L'assistente sta scrivendo...";
  }
  
  this.scrollToBottom();
}

showTypingAnimation() {
  const messages = [
    "Analizando la tua richiesta...",
    "Consultando il database servizi...",
    "Preparando risposta personalizzata...",
    "Quasi pronto..."
  ];
  
  let index = 0;
  const loadingText = document.getElementById('itera-loading-text');
  
  const interval = setInterval(() => {
    if (!this.isLoading || index >= messages.length) {
      clearInterval(interval);
      return;
    }
    
    loadingText.textContent = messages[index];
    index++;
  }, 800);
}

updateSmartSuggestions(result) {
  if (!result.suggestions && !result.options) return;
  
  const suggestionsContainer = document.getElementById('itera-suggestions');
  const container = suggestionsContainer.querySelector('.itera-suggestions-container');
  
  // Generate contextual suggestions
  const suggestions = this.generateContextualSuggestions(result);
  
  if (suggestions.length > 0) {
    container.innerHTML = suggestions.map(suggestion => 
      `<div class="itera-suggestion" data-text="${suggestion}">${suggestion}</div>`
    ).join('');
    
    // Add click listeners
    container.querySelectorAll('.itera-suggestion').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = e.target.dataset.text;
        document.getElementById('itera-chat-textarea').value = text;
        this.hideSuggestions();
      });
    });
    
    suggestionsContainer.classList.remove('hidden');
    
    // Auto-hide after 10 seconds
    setTimeout(() => this.hideSuggestions(), 10000);
  }
}

generateContextualSuggestions(result) {
  const suggestions = [];
  
  switch (result.intent) {
    case 'preventivo':
      suggestions.push('Quanto costa mediamente?', 'Tempi di realizzazione?', 'Esempi di lavori simili?');
      break;
    case 'sito_web':
      suggestions.push('Include hosting?', 'È mobile responsive?', 'Include SEO?');
      break;
    case 'ecommerce':
      suggestions.push('Gestione pagamenti?', 'Catalogo prodotti?', 'Corrieri integrati?');
      break;
    case 'supporto':
      suggestions.push('È un problema urgente', 'Serve intervento on-site', 'Consulenza telefonica');
      break;
    default:
      if (result.step === 'business_qualification') {
        suggestions.push('Siamo una PMI', 'Budget limitato', 'Progetto urgente');
      }
  }
  
  return suggestions;
}

handleEscalation(result) {
  this.escalationMode = true;
  
  // Show escalation UI
  this.showEscalationBanner(result.escalationType, result.priority);
  
  // Update input placeholder
  const textarea = document.getElementById('itera-chat-textarea');
  textarea.placeholder = "Un esperto umano ti assisterà a breve. Scrivi eventuali dettagli aggiuntivi...";
  
  // Show priority-based message
  if (result.priority === 'high' || result.priority === 'immediate') {
    this.addSystemMessage('🚀 Alta priorità: Un nostro consulente senior ti contatterà entro 2 ore lavorative.');
  }
}

showEscalationBanner(type, priority) {
  const banner = document.createElement('div');
  banner.className = 'itera-escalation-banner';
  banner.innerHTML = `
    <div class="escalation-content">
      <span class="escalation-icon">👨‍💻</span>
      <span class="escalation-text">Passaggio a operatore umano...</span>
      <span class="escalation-priority ${priority}">${this.formatPriority(priority)}</span>
    </div>
  `;
  
  const messagesContainer = document.getElementById('itera-chat-messages');
  messagesContainer.appendChild(banner);
  this.scrollToBottom();
}

showDataCollectionForm(result) {
  const formHtml = `
    <div class="itera-data-collection" id="itera-data-collection">
      <div class="form-header">
        <h4>📋 Completa i tuoi dati</h4>
        <p>Per un preventivo personalizzato</p>
      </div>
      
      <div class="form-fields">
        <input type="text" placeholder="Nome e Cognome*" id="contact_name" required>
        <input type="text" placeholder="Nome Azienda" id="company_name">
        <input type="email" placeholder="Email*" id="email" required>
        <input type="tel" placeholder="Telefono*" id="phone" required>
        <input type="text" placeholder="Città" id="location">
        
        <select id="company_size">
          <option value="">Dimensione azienda</option>
          <option value="1-5">1-5 dipendenti</option>
          <option value="6-15">6-15 dipendenti</option>
          <option value="16-50">16-50 dipendenti</option>
          <option value="51-100">51-100 dipendenti</option>
          <option value="100+">100+ dipendenti</option>
        </select>
        
        <select id="budget_range">
          <option value="">Budget previsto</option>
          <option value="< €5.000">< €5.000</option>
          <option value="€5.000-€15.000">€5.000-€15.000</option>
          <option value="€15.000-€30.000">€15.000-€30.000</option>
          <option value="€30.000+">€30.000+</option>
          <option value="Da valutare">Da valutare</option>
        </select>
        
        <textarea placeholder="Note aggiuntive..." id="additional_notes" rows="2"></textarea>
      </div>
      
      <div class="form-actions">
        <button class="btn-primary" onclick="window.ITERAChat.submitDataCollection()">
          📧 Invia Richiesta
        </button>
        <button class="btn-secondary" onclick="window.ITERAChat.hideDataCollection()">
          Continua Chat
        </button>
      </div>
    </div>
  `;
  
  const messagesContainer = document.getElementById('itera-chat-messages');
  const formContainer = document.createElement('div');
  formContainer.innerHTML = formHtml;
  messagesContainer.appendChild(formContainer);
  
  this.scrollToBottom();
}

async submitDataCollection() {
  const formData = {
    contact_name: document.getElementById('contact_name').value,
    company_name: document.getElementById('company_name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    location: document.getElementById('location').value,
    company_size: document.getElementById('company_size').value,
    budget_range: document.getElementById('budget_range').value,
    message: document.getElementById('additional_notes').value
  };
  
  // Validation
  if (!formData.contact_name || !formData.email || !formData.phone) {
    this.showFormError('Compila i campi obbligatori (Nome, Email, Telefono)');
    return;
  }
  
  // Update lead data
  this.leadData = { ...this.leadData, ...formData };
  
  try {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'email_handoff',
        sessionId: this.sessionId,
        leadData: this.leadData
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      this.addSystemMessage(`✅ Perfetto! ${result.message}`);
      this.hideDataCollection();
      
      // Show completion options
      setTimeout(() => {
        this.addBotMessage(
          'Grazie per i tuoi dati! Hai altre domande mentre aspetti il nostro contatto?',
          ['Altre Info', 'Chiudi Chat', 'Cambia Richiesta']
        );
      }, 1000);
      
    } else {
      this.showFormError(result.error || 'Errore nell\'invio. Riprova.');
    }
    
  } catch (error) {
    console.error('Form submission error:', error);
    this.showFormError('Errore di connessione. Riprova o contattaci direttamente.');
  }
}

showFormError(message) {
  const existingError = document.querySelector('.form-error');
  if (existingError) existingError.remove();
  
  const error = document.createElement('div');
  error.className = 'form-error';
  error.textContent = message;
  error.style.cssText = 'color: #ff4444; font-size: 12px; margin: 5px 0; padding: 5px; background: #ffe6e6; border-radius: 4px;';
  
  const formActions = document.querySelector('.form-actions');
  formActions.insertBefore(error, formActions.firstChild);
}

addSystemMessage(text) {
  const messagesContainer = document.getElementById('itera-chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'itera-chat-message system';
  messageDiv.innerHTML = `
    <div class="itera-system-message">
      ${text}
    </div>
  `;
  messagesContainer.appendChild(messageDiv);
  this.scrollToBottom();
}

hideDataCollection() {
  const form = document.getElementById('itera-data-collection');
  if (form) form.remove();
}

hideSuggestions() {
  document.getElementById('itera-suggestions').classList.add('hidden');
}

hideInputSuggestions() {
  document.getElementById('itera-input-suggestions').classList.add('hidden');
}

showEscalationOptions() {
  const options = [
    '📞 Chiamata Urgente',
    '📧 Email Dettagliata', 
    '💬 Chat con Operatore',
    '🔄 Riprova AI'
  ];
  
  this.addBotMessage(
    'Come preferisci essere assistito?',
    options
  );
}

formatMessageText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

addEmojiToOption(option, intent) {
  const emojiMap = {
    'Preventivo': '💰',
    'Assistenza': '🔧',
    'Info Servizi': 'ℹ️',
    'Sito Web': '🌐',
    'E-commerce': '🛒',
    'App Mobile': '📱',
    'Operatore Umano': '👨‍💻',
    'Parlare con umano': '👨‍💻',
    'Chiamatemi': '📞',
    'Email': '📧'
  };
  
  const emoji = emojiMap[option] || '';
  return emoji ? `${emoji} ${option}` : option;
}

formatPriority(priority) {
  const priorityMap = {
    'immediate': '🔴 Immediata',
    'high': '🟠 Alta',
    'medium': '🟡 Media',
    'low': '🟢 Bassa'
  };
  
  return priorityMap[priority] || priority;
}

trackOptionSelection(option, index, intent) {
  // Track user preferences for future AI improvements
  const tracking = {
    option,
    index, 
    intent,
    timestamp: Date.now(),
    sessionId: this.sessionId
  };
  
  console.log('Option selected:', tracking);
  // Here you could send analytics to your tracking system
}

playMessageSound() {
  // Subtle notification sound (optional)
  if (this.config.playSound && !this.isOpen) {
    // Play a subtle notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1O2vbiMFl7Hg7KNQDgxBxtvqm18cGQ==');
      audio.volume = 0.1;
      audio.play().catch(() => {});
    } catch (e) {}
  }
}

// Add enhanced CSS for new elements
getEnhancedCSS() {
  return `
    .itera-escalation-banner {
      background: linear-gradient(135deg, #ff9800, #f57c00);
      color: white;
      padding: 12px;
      margin: 8px 0;
      border-radius: 8px;
      font-size: 13px;
    }
    
    .escalation-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .escalation-priority {
      background: rgba(255,255,255,0.2);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      margin-left: auto;
    }
    
    .itera-data-collection {
      background: #f8f9ff;
      border: 2px solid ${this.config.primaryColor};
      border-radius: 12px;
      padding: 16px;
      margin: 10px 0;
    }
    
    .form-header h4 {
      margin: 0 0 4px 0;
      color: ${this.config.primaryColor};
      font-size: 16px;
    }
    
    .form-header p {
      margin: 0 0 12px 0;
      color: #666;
      font-size: 12px;
    }
    
    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .form-fields input, .form-fields select, .form-fields textarea {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
    }
    
    .form-fields input:focus, .form-fields select:focus, .form-fields textarea:focus {
      outline: none;
      border-color: ${this.config.primaryColor};
    }
    
    .form-actions {
      display: flex;
      gap: 8px;
    }
    
    .btn-primary, .btn-secondary {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-primary {
      background: ${this.config.primaryColor};
      color: white;
    }
    
    .btn-primary:hover {
      background: ${this.config.secondaryColor};
      transform: translateY(-1px);
    }
    
    .btn-secondary {
      background: white;
      color: ${this.config.primaryColor};
      border: 1px solid ${this.config.primaryColor};
    }
    
    .btn-secondary:hover {
      background: #f5f5f5;
    }
    
    .itera-system-message {
      background: #e8f5e8;
      border: 1px solid #4caf50;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      color: #2e7d32;
      text-align: center;
    }
    
    .itera-message-metadata {
      display: flex;
      gap: 4px;
      margin-top: 4px;
      font-size: 10px;
    }
    
    .ai-badge, .cached-badge, .time-badge {
      background: rgba(102, 126, 234, 0.1);
      color: ${this.config.primaryColor};
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid rgba(102, 126, 234, 0.2);
    }
    
    .cached-badge {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
      border-color: rgba(76, 175, 80, 0.2);
    }
    
    .time-badge {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
      border-color: rgba(255, 152, 0, 0.2);
    }
  `;
}

export default {
  updateConversationMetrics,
  showAIStatus,
  showEnhancedLoading,
  showTypingAnimation,
  updateSmartSuggestions,
  generateContextualSuggestions,
  handleEscalation,
  showEscalationBanner,
  showDataCollectionForm,
  submitDataCollection,
  showFormError,
  addSystemMessage,
  hideDataCollection,
  hideSuggestions,
  hideInputSuggestions,
  showEscalationOptions,
  formatMessageText,
  addEmojiToOption,
  formatPriority,
  trackOptionSelection,
  playMessageSound,
  getEnhancedCSS
};