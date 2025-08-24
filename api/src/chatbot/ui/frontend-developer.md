# Frontend Developer Agent - Chat Widget UI

## Mission
Create responsive chat widget that integrates seamlessly with existing IT-ERA website forms and design.

## Website Integration Analysis
- **Existing Forms**: Contact forms throughout the website
- **Design System**: Need to match current IT-ERA branding
- **Framework**: Vanilla JS for maximum compatibility
- **Integration Points**: Replace or enhance existing contact forms

## Chat Widget Architecture

### 1. Widget Structure
```html
<!-- Chat Widget Container -->
<div id="it-era-chatbot" class="chatbot-widget">
  <div class="chatbot-toggle" id="chatbot-toggle">
    <svg><!-- Chat Icon --></svg>
  </div>
  
  <div class="chatbot-window" id="chatbot-window">
    <div class="chatbot-header">
      <h3>Assistente IT-ERA</h3>
      <button class="chatbot-close">&times;</button>
    </div>
    
    <div class="chatbot-messages" id="chatbot-messages">
      <!-- Messages appear here -->
    </div>
    
    <div class="chatbot-input-area">
      <input type="text" id="chatbot-input" placeholder="Scrivi il tuo messaggio...">
      <button id="chatbot-send">Invia</button>
    </div>
  </div>
</div>
```

### 2. CSS Styling (IT-ERA Brand Compliant)
```css
.chatbot-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  font-family: 'Arial', sans-serif;
}

.chatbot-toggle {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3);
  transition: all 0.3s ease;
}

.chatbot-window {
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  display: none;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 20px;
}

.chatbot-header {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 15px;
  display: flex;
  justify-content: between;
  align-items: center;
}

.chatbot-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 15px;
  word-wrap: break-word;
}

.message.user {
  background: #007bff;
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 5px;
}

.message.bot {
  background: #f1f3f5;
  color: #333;
  align-self: flex-start;
  border-bottom-left-radius: 5px;
}

.chatbot-input-area {
  padding: 15px;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 10px;
}

.chatbot-input-area input {
  flex: 1;
  padding: 10px;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  outline: none;
}

.chatbot-input-area button {
  padding: 10px 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}
```

### 3. JavaScript Core Functionality
```javascript
class ITEraChatbot {
  constructor() {
    this.isOpen = false;
    this.sessionId = this.generateSessionId();
    this.apiEndpoint = 'https://it-era-chatbot.bulltech.workers.dev/api/chat';
    this.init();
  }
  
  init() {
    this.createWidget();
    this.attachEventListeners();
    this.loadWelcomeMessage();
  }
  
  createWidget() {
    // Create widget DOM elements dynamically
    const widget = document.createElement('div');
    widget.innerHTML = this.getWidgetHTML();
    document.body.appendChild(widget);
  }
  
  attachEventListeners() {
    const toggle = document.getElementById('chatbot-toggle');
    const close = document.querySelector('.chatbot-close');
    const input = document.getElementById('chatbot-input');
    const send = document.getElementById('chatbot-send');
    
    toggle.addEventListener('click', () => this.toggleWidget());
    close.addEventListener('click', () => this.closeWidget());
    send.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }
  
  async sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to UI
    this.addMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    this.showTyping();
    
    try {
      // Send to chatbot API
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId: this.sessionId,
          context: this.getContext()
        })
      });
      
      const data = await response.json();
      
      // Remove typing indicator and add bot response
      this.hideTyping();
      this.addMessage(data.response, 'bot');
      
      // Handle special actions (like email forwarding confirmation)
      if (data.action === 'email_forwarded') {
        this.addMessage('Ho inviato la tua richiesta al team! Ti contatteranno presto.', 'bot');
      }
      
    } catch (error) {
      this.hideTyping();
      this.addMessage('Scusa, c\'è stato un errore. Riprova più tardi.', 'bot');
      console.error('Chatbot error:', error);
    }
  }
  
  addMessage(text, sender) {
    const messages = document.getElementById('chatbot-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;
    messageEl.textContent = text;
    messages.appendChild(messageEl);
    messages.scrollTop = messages.scrollHeight;
  }
  
  toggleWidget() {
    const window = document.getElementById('chatbot-window');
    this.isOpen = !this.isOpen;
    window.style.display = this.isOpen ? 'flex' : 'none';
  }
  
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', () => {
  new ITEraChatbot();
});
```

### 4. Form Integration Enhancement
```javascript
// Enhance existing contact forms
class FormIntegration {
  static enhanceContactForms() {
    const forms = document.querySelectorAll('form[action*="contact"]');
    
    forms.forEach(form => {
      // Add "Ask chatbot first" button
      const chatButton = document.createElement('button');
      chatButton.type = 'button';
      chatButton.textContent = '💬 Chiedilo al chatbot';
      chatButton.className = 'btn btn-secondary';
      chatButton.onclick = () => {
        // Pre-fill chatbot with form context
        window.itEraChatbot.openWithContext('form_help');
      };
      
      form.appendChild(chatButton);
    });
  }
}

// Initialize form enhancements
document.addEventListener('DOMContentLoaded', FormIntegration.enhanceContactForms);
```

### 5. Mobile Responsiveness
```css
@media (max-width: 768px) {
  .chatbot-window {
    width: calc(100vw - 40px);
    height: 70vh;
    bottom: 90px;
    right: 20px;
  }
  
  .chatbot-widget {
    bottom: 20px;
    right: 20px;
  }
}
```

### 6. Accessibility Features
```javascript
// ARIA labels and keyboard navigation
class AccessibilityEnhancements {
  static apply() {
    const toggle = document.getElementById('chatbot-toggle');
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('aria-label', 'Apri chat assistente IT-ERA');
    toggle.setAttribute('tabindex', '0');
    
    // Keyboard support
    toggle.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
    });
  }
}
```

### 7. Deployment Integration
```html
<!-- Add to IT-ERA website head -->
<link rel="stylesheet" href="https://it-era-chatbot.bulltech.workers.dev/widget.css">
<script src="https://it-era-chatbot.bulltech.workers.dev/widget.js" defer></script>
```

## Performance Optimizations
- **Lazy Loading**: Only load widget when user interacts
- **Message Caching**: Store recent messages locally
- **API Debouncing**: Prevent spam requests
- **Smooth Animations**: CSS transitions for better UX

---
*Agent: Frontend Developer | Task: Chat Widget UI | Memory: chatbot/frontend/widget*