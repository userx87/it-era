/**
 * IT-ERA Chatbot Integration Library
 * Dynamic chatbot loading with configuration management
 */

export class ITERAChatbot {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: '/api/src/chatbot/api/chatbot-worker.js',
      position: 'bottom-right',
      theme: 'it-era',
      greeting: 'Ciao! Sono l\'assistente IT-ERA. Come posso aiutarti?',
      enabled: true,
      autoInit: true,
      ...config
    };
    
    if (this.config.autoInit) {
      this.init();
    }
  }

  init() {
    if (!this.shouldLoadChatbot()) return;
    
    this.loadChatbotScript()
      .then(() => this.initializeWidget())
      .catch(error => console.warn('Chatbot loading failed:', error));
  }

  shouldLoadChatbot() {
    // Only load in production or specific environments
    if (typeof window === 'undefined') return false;
    if (!this.config.enabled) return false;
    
    const hostname = window.location.hostname;
    return hostname === 'it-era.it' || 
           hostname.includes('it-era') || 
           hostname === 'localhost' ||
           hostname === '127.0.0.1';
  }

  async loadChatbotScript() {
    return new Promise((resolve, reject) => {
      if (document.getElementById('itera-chatbot-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'itera-chatbot-script';
      script.src = this.config.apiEndpoint.replace('chatbot-worker.js', 'chat-widget.js');
      script.async = true;
      
      script.onload = resolve;
      script.onerror = reject;
      
      document.body.appendChild(script);
    });
  }

  initializeWidget() {
    if (typeof window.initChatWidget === 'function') {
      const contextualConfig = this.getContextualConfig();
      
      window.initChatWidget({
        ...this.config,
        ...contextualConfig
      });
      
      this.bindEvents();
    }
  }

  getContextualConfig() {
    const pathname = window.location.pathname;
    let greeting = this.config.greeting;
    let context = '';

    // Customize greeting based on page context
    if (pathname.includes('assistenza-it')) {
      greeting = 'Hai bisogno di assistenza IT? Chiedimi pure!';
      context = 'assistenza-it';
    } else if (pathname.includes('sicurezza-informatica')) {
      greeting = 'Vuoi proteggere la tua azienda? Posso aiutarti!';
      context = 'sicurezza';
    } else if (pathname.includes('cloud-storage')) {
      greeting = 'Interessato al cloud storage? Dimmi di più!';
      context = 'cloud';
    } else if (pathname.includes('commercialisti')) {
      greeting = 'Servizi IT per commercialisti? Sono qui per aiutarti!';
      context = 'commercialisti';
    } else if (pathname.includes('studi-legali')) {
      greeting = 'Soluzioni IT per studi legali? Parliamone!';
      context = 'legali';
    }

    return {
      greeting,
      context,
      cityTarget: this.extractCityFromPath(pathname)
    };
  }

  extractCityFromPath(pathname) {
    const cityMatch = pathname.match(/\/([^\/]+)\/[^\/]+$/);
    return cityMatch ? cityMatch[1] : '';
  }

  bindEvents() {
    // Track chatbot interactions
    if (typeof window.gtag === 'function') {
      window.addEventListener('chatbot:message', (event) => {
        window.gtag('event', 'chatbot_interaction', {
          event_category: 'engagement',
          event_label: 'message_sent',
          custom_parameter_1: event.detail.context || '',
          custom_parameter_2: event.detail.cityTarget || ''
        });
      });

      window.addEventListener('chatbot:open', () => {
        window.gtag('event', 'chatbot_open', {
          event_category: 'engagement',
          event_label: 'widget_opened'
        });
      });
    }
  }

  // Public API methods
  show() {
    if (window.chatbotWidget) {
      window.chatbotWidget.show();
    }
  }

  hide() {
    if (window.chatbotWidget) {
      window.chatbotWidget.hide();
    }
  }

  destroy() {
    if (window.chatbotWidget) {
      window.chatbotWidget.destroy();
    }
    
    const script = document.getElementById('itera-chatbot-script');
    if (script) {
      script.remove();
    }
  }
}

// Auto-initialize for IT-ERA
export function initITERAChatbot(config = {}) {
  return new ITERAChatbot(config);
}

// Default export for easy usage
export default ITERAChatbot;