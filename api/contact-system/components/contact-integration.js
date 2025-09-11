/**
 * IT-ERA Contact Form Integration Script
 * Automatically injects contact forms into existing pages
 */

(function() {
  'use strict';
  
  // Configuration
  const CONTACT_API_URL = '/api/contact';
  const FORM_CONTAINER_SELECTOR = '#contact-form, .contact-form, [data-contact-form]';
  
  // Check if contact form should be injected
  function shouldInjectForm() {
    // Don't inject if form already exists
    if (document.querySelector('.it-era-contact-form')) return false;
    
    // Don't inject on specific pages
    const excludePages = ['/privacy-policy', '/cookie-policy', '/sitemap'];
    const currentPath = window.location.pathname.toLowerCase();
    
    return !excludePages.some(page => currentPath.includes(page));
  }
  
  // Get contact form HTML
  function getContactFormHTML() {
    return `
    <!-- IT-ERA Universal Contact Form -->
    <style>
    .it-era-contact-form {
      max-width: 600px;
      margin: 40px auto;
      padding: 30px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 86, 204, 0.1);
      border: 1px solid #e1e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .it-era-contact-form h2 {
      color: #0056cc;
      text-align: center;
      margin-bottom: 8px;
      font-size: 28px;
      font-weight: 700;
    }

    .it-era-contact-form .form-subtitle {
      text-align: center;
      color: #6c757d;
      margin-bottom: 30px;
      font-size: 16px;
    }

    .it-era-form-group {
      margin-bottom: 20px;
    }

    .it-era-form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #2c3e50;
      font-size: 14px;
    }

    .it-era-form-group .required {
      color: #dc3545;
    }

    .it-era-form-group input,
    .it-era-form-group select,
    .it-era-form-group textarea {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e8f0;
      border-radius: 8px;
      font-size: 16px;
      transition: all 0.3s ease;
      font-family: inherit;
      background: #ffffff;
      box-sizing: border-box;
    }

    .it-era-form-group input:focus,
    .it-era-form-group select:focus,
    .it-era-form-group textarea:focus {
      outline: none;
      border-color: #0056cc;
      box-shadow: 0 0 0 3px rgba(0, 86, 204, 0.1);
    }

    .it-era-form-group textarea {
      min-height: 120px;
      resize: vertical;
    }

    .it-era-form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .it-era-gdpr-notice {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 13px;
      color: #6c757d;
      border-left: 4px solid #0056cc;
    }

    .it-era-submit-btn {
      background: linear-gradient(135deg, #0056cc, #0041a3);
      color: white;
      padding: 15px 40px;
      border: none;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
      position: relative;
      overflow: hidden;
    }

    .it-era-submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 86, 204, 0.3);
    }

    .it-era-submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .it-era-loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: it-era-spin 1s ease-in-out infinite;
      margin-right: 10px;
    }

    @keyframes it-era-spin {
      to { transform: rotate(360deg); }
    }

    .it-era-message {
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 500;
    }

    .it-era-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .it-era-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .it-era-contact-info {
      background: linear-gradient(135deg, #0056cc, #0041a3);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
      text-align: center;
    }

    .it-era-contact-info h3 {
      margin: 0 0 15px 0;
      font-size: 20px;
    }

    .it-era-contact-info p {
      margin: 5px 0;
      opacity: 0.9;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .it-era-contact-form {
        margin: 20px;
        padding: 20px;
      }
      
      .it-era-form-row {
        grid-template-columns: 1fr;
        gap: 15px;
      }
      
      .it-era-contact-form h2 {
        font-size: 24px;
      }
    }

    /* Service-specific themes */
    body.service-sicurezza .it-era-contact-form h2 { color: #dc3545; }
    body.service-sicurezza .it-era-gdpr-notice { border-left-color: #dc3545; }
    body.service-sicurezza .it-era-form-group input:focus,
    body.service-sicurezza .it-era-form-group select:focus,
    body.service-sicurezza .it-era-form-group textarea:focus {
      border-color: #dc3545;
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
    body.service-sicurezza .it-era-submit-btn {
      background: linear-gradient(135deg, #dc3545, #a71e2a);
    }
    body.service-sicurezza .it-era-contact-info {
      background: linear-gradient(135deg, #dc3545, #a71e2a);
    }

    body.service-cloud .it-era-contact-form h2 { color: #17a2b8; }
    body.service-cloud .it-era-gdpr-notice { border-left-color: #17a2b8; }
    body.service-cloud .it-era-form-group input:focus,
    body.service-cloud .it-era-form-group select:focus,
    body.service-cloud .it-era-form-group textarea:focus {
      border-color: #17a2b8;
      box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.1);
    }
    body.service-cloud .it-era-submit-btn {
      background: linear-gradient(135deg, #17a2b8, #117a8b);
    }
    body.service-cloud .it-era-contact-info {
      background: linear-gradient(135deg, #17a2b8, #117a8b);
    }
    </style>

    <div class="it-era-contact-form" id="itEraContactForm">
      <h2>Richiedi Informazioni</h2>
      <p class="form-subtitle">Il nostro team ti risponderà entro 2 ore durante l'orario lavorativo</p>
      
      <form id="itEraContactFormElement" novalidate>
        <div class="it-era-form-row">
          <div class="it-era-form-group">
            <label for="it-era-nome">Nome e Cognome <span class="required">*</span></label>
            <input type="text" id="it-era-nome" name="nome" required>
          </div>
          
          <div class="it-era-form-group">
            <label for="it-era-email">Email <span class="required">*</span></label>
            <input type="email" id="it-era-email" name="email" required>
          </div>
        </div>
        
        <div class="it-era-form-row">
          <div class="it-era-form-group">
            <label for="it-era-telefono">Telefono</label>
            <input type="tel" id="it-era-telefono" name="telefono">
          </div>
          
          <div class="it-era-form-group">
            <label for="it-era-azienda">Azienda</label>
            <input type="text" id="it-era-azienda" name="azienda">
          </div>
        </div>
        
        <div class="it-era-form-group">
          <label for="it-era-servizio">Servizio di interesse</label>
          <select id="it-era-servizio" name="servizio">
            <option value="">Seleziona un servizio...</option>
            <option value="assistenza-it">Assistenza IT</option>
            <option value="sicurezza-informatica">Sicurezza Informatica</option>
            <option value="cloud-storage">Cloud Storage</option>
            <option value="consulenza-generale">Consulenza Generale</option>
            <option value="altro">Altro</option>
          </select>
        </div>
        
        <div class="it-era-form-group">
          <label for="it-era-messaggio">Messaggio <span class="required">*</span></label>
          <textarea id="it-era-messaggio" name="messaggio" placeholder="Descrivi la tua richiesta..." required></textarea>
        </div>
        
        <div class="it-era-gdpr-notice">
          <p><strong>Privacy:</strong> I tuoi dati sono trattati secondo il GDPR. 
          Utilizzando questo modulo accetti il trattamento dei dati per rispondere alla tua richiesta. 
          <a href="/privacy-policy" target="_blank">Leggi l'informativa privacy</a></p>
        </div>
        
        <button type="submit" class="it-era-submit-btn" id="itEraSubmitBtn">
          <span id="itEraSubmitText">Invia Richiesta</span>
        </button>
      </form>
      
      <div id="itEraResponseMessage"></div>
      
      <div class="it-era-contact-info">
        <h3>Contatti Diretti</h3>
        <p><strong>📞 Telefono:</strong> 039 888 2041</p>
        <p><strong>📧 Email:</strong> info@it-era.it</p>
        <p><strong>📍 Indirizzo:</strong> Viale Risorgimento 32, Vimercate MB</p>
      </div>
    </div>
    `;
  }
  
  // Inject contact form
  function injectContactForm() {
    if (!shouldInjectForm()) return;
    
    // Find container or create one
    let container = document.querySelector(FORM_CONTAINER_SELECTOR);
    
    if (!container) {
      // Create container before footer or at end of main content
      const footer = document.querySelector('footer');
      const main = document.querySelector('main, .main-content, #main-content');
      
      container = document.createElement('div');
      container.setAttribute('data-contact-form', 'auto-injected');
      
      if (footer && footer.parentNode) {
        footer.parentNode.insertBefore(container, footer);
      } else if (main) {
        main.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    }
    
    // Inject form HTML
    container.innerHTML = getContactFormHTML();
    
    // Initialize form functionality
    initializeContactForm();
  }
  
  // Initialize contact form functionality
  function initializeContactForm() {
    const form = document.getElementById('itEraContactFormElement');
    const submitBtn = document.getElementById('itEraSubmitBtn');
    const submitText = document.getElementById('itEraSubmitText');
    const responseMessage = document.getElementById('itEraResponseMessage');
    
    if (!form) return;
    
    // Auto-detect service type
    function detectServiceType() {
      const url = window.location.href.toLowerCase();
      if (url.includes('sicurezza-informatica')) return 'sicurezza-informatica';
      if (url.includes('cloud-storage')) return 'cloud-storage';
      if (url.includes('assistenza-it')) return 'assistenza-it';
      return 'generale';
    }
    
    // Apply service styling
    function applyServiceStyling() {
      const serviceType = detectServiceType();
      
      if (serviceType === 'sicurezza-informatica') {
        document.body.classList.add('service-sicurezza');
      } else if (serviceType === 'cloud-storage') {
        document.body.classList.add('service-cloud');
      }
      
      // Pre-select service
      const serviceSelect = document.getElementById('it-era-servizio');
      if (serviceSelect && serviceType !== 'generale') {
        serviceSelect.value = serviceType;
      }
    }
    
    // Validation
    function validateForm(formData) {
      const errors = [];
      
      if (!formData.nome.trim()) errors.push('Nome e cognome è obbligatorio');
      if (!formData.email.trim()) errors.push('Email è obbligatoria');
      else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) errors.push('Email non valida');
      if (!formData.messaggio.trim()) errors.push('Il messaggio è obbligatorio');
      else if (formData.messaggio.trim().length < 10) errors.push('Il messaggio deve essere di almeno 10 caratteri');
      
      return errors;
    }
    
    // Show message
    function showMessage(message, type) {
      responseMessage.innerHTML = \`<div class="it-era-message it-era-\${type}">\${message}</div>\`;
      responseMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Submit form
    async function submitForm(formData) {
      try {
        const response = await fetch(CONTACT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            pageUrl: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          showMessage(
            \`✅ <strong>Richiesta inviata con successo!</strong><br>
            Ticket ID: <strong>\${result.ticketId}</strong><br>
            Riceverai una conferma via email entro pochi minuti.\`, 
            'success'
          );
          form.reset();
          
          // Track conversion
          if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
              'event_category': 'Contact',
              'event_label': detectServiceType(),
              'value': 1
            });
          }
        } else {
          showMessage(\`❌ <strong>Errore:</strong> \${result.error}\`, 'error');
        }
        
      } catch (error) {
        console.error('Form submission error:', error);
        showMessage(
          '❌ <strong>Errore di connessione.</strong><br>Riprova tra qualche minuto o chiamaci al 039 888 2041', 
          'error'
        );
      }
    }
    
    // Form submit handler
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      const errors = validateForm(data);
      if (errors.length > 0) {
        showMessage(\`❌ <strong>Errori:</strong><br>• \${errors.join('<br>• ')}\`, 'error');
        return;
      }
      
      submitBtn.disabled = true;
      submitText.innerHTML = '<span class="it-era-loading"></span>Invio in corso...';
      responseMessage.innerHTML = '';
      
      try {
        await submitForm(data);
      } finally {
        submitBtn.disabled = false;
        submitText.innerHTML = 'Invia Richiesta';
      }
    });
    
    // Initialize
    applyServiceStyling();
  }
  
  // Auto-inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectContactForm);
  } else {
    injectContactForm();
  }
  
})();