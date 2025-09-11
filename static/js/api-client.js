/**
 * IT-ERA API Client
 * Gestisce le chiamate API per form, preventivi e tracking
 */

const API_BASE = 'https://api.bulltech.it';
// Fallback per sviluppo locale
const API_FALLBACK = 'http://localhost:8788';

class ITERAClient {
  constructor() {
    this.baseURL = API_BASE;
    this.checkAvailability();
  }

  /**
   * Verifica disponibilità API
   */
  async checkAvailability() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (!response.ok) {
        console.warn('API principale non disponibile, uso fallback');
        this.baseURL = API_FALLBACK;
      }
    } catch (error) {
      console.warn('API principale non raggiungibile:', error.message);
      this.baseURL = API_FALLBACK;
    }
  }

  /**
   * Invia form contatto
   */
  async submitContactForm(formData) {
    try {
      const response = await fetch(`${this.baseURL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      const result = await response.json();
      
      // Track conversione
      if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
          'event_category': 'form_submission',
          'event_label': formData.service || 'contact',
          'value': 1
        });
      }

      return result;
    } catch (error) {
      console.error('Errore invio form:', error);
      throw error;
    }
  }

  /**
   * Calcola preventivo
   */
  async calculateQuote(quoteData) {
    try {
      const response = await fetch(`${this.baseURL}/api/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Errore calcolo preventivo:', error);
      throw error;
    }
  }

  /**
   * Ottieni listino prezzi
   */
  async getPricing() {
    try {
      const response = await fetch(`${this.baseURL}/api/pricing`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Errore recupero prezzi:', error);
      throw error;
    }
  }

  /**
   * Traccia evento analytics
   */
  async trackEvent(eventData) {
    try {
      const response = await fetch(`${this.baseURL}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer,
        }),
      });

      if (!response.ok) {
        console.warn('Errore tracking evento');
      }
    } catch (error) {
      console.warn('Tracking fallito:', error);
    }
  }
}

// Inizializza client globale
window.iteraAPI = new ITERAClient();

/**
 * Helper per gestire form submission
 */
document.addEventListener('DOMContentLoaded', function() {
  // Intercetta tutti i form con classe .api-form
  const forms = document.querySelectorAll('.api-form');
  
  forms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      try {
        // Mostra loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Invio in corso...';
        
        // Raccogli dati form
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Aggiungi metadati
        data.source = window.location.pathname;
        data.timestamp = new Date().toISOString();
        
        // Invia a API
        const result = await window.iteraAPI.submitContactForm(data);
        
        // Mostra successo
        submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Inviato con successo!';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-success');
        
        // Mostra messaggio successo
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success mt-3';
        successAlert.innerHTML = `
          <i class="fas fa-check-circle me-2"></i>
          <strong>Grazie per averci contattato!</strong><br>
          Ti risponderemo entro 4 ore lavorative.
        `;
        form.appendChild(successAlert);
        
        // Reset form dopo 3 secondi
        setTimeout(() => {
          form.reset();
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          submitBtn.classList.remove('btn-success');
          submitBtn.classList.add('btn-primary');
          successAlert.remove();
        }, 3000);
        
      } catch (error) {
        // Mostra errore
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mt-3';
        errorAlert.innerHTML = `
          <i class="fas fa-exclamation-triangle me-2"></i>
          <strong>Si è verificato un errore.</strong><br>
Per favore riprova o chiamaci allo 039 888 2041.
        `;
        form.appendChild(errorAlert);
        
        setTimeout(() => {
          errorAlert.remove();
        }, 5000);
      }
    });
  });
  
  // Traccia page view
  window.iteraAPI.trackEvent({
    event: 'page_view',
    page: window.location.pathname,
  });
  
  // Traccia click su CTA
  document.querySelectorAll('.btn-primary, .btn-warning').forEach(btn => {
    btn.addEventListener('click', function() {
      window.iteraAPI.trackEvent({
        event: 'cta_click',
        label: btn.textContent,
        href: btn.href || '#',
      });
    });
  });
  
  // Traccia scroll depth
  let maxScroll = 0;
  window.addEventListener('scroll', function() {
    const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    
    if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
      maxScroll = scrollPercent;
      window.iteraAPI.trackEvent({
        event: 'scroll_depth',
        depth: scrollPercent,
      });
    }
  });
});

/**
 * Utility per calcolo preventivi inline
 */
window.calculateInstantQuote = function(service, options) {
  const quoteDisplay = document.getElementById('quote-display');
  if (!quoteDisplay) return;
  
  quoteDisplay.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcolo in corso...';
  
  window.iteraAPI.calculateQuote({
    service: service,
    ...options
  }).then(quote => {
    quoteDisplay.innerHTML = `
      <div class="card bg-success text-white">
        <div class="card-body">
          <h5>Il tuo preventivo:</h5>
          <div class="display-4">€${quote.total}/mese</div>
          <small>IVA esclusa • ${quote.discount}% di sconto applicato</small>
        </div>
      </div>
    `;
  }).catch(error => {
    quoteDisplay.innerHTML = '<div class="alert alert-danger">Errore nel calcolo. Riprova.</div>';
  });
};
