/**
 * IT-ERA Form Handler
 * JavaScript per gestione form di contatto con validazione e feedback
 */

class ITERAFormHandler {
  constructor() {
    // Endpoint principale con dominio it-era.it
    this.apiEndpoint = 'https://api.it-era.it/api/contact';
    // Fallback su Workers.dev se necessario
    this.fallbackEndpoint = 'https://it-era-contact-api.andrea-panzeri.workers.dev/api/contact';
    this.isSubmitting = false;
    this.init();
  }

  init() {
    // Trova tutti i form di contatto nella pagina
    const forms = document.querySelectorAll('.contact-form form, #contactForm, #preventivo-form');
    forms.forEach(form => this.setupForm(form));
  }

  setupForm(form) {
    // Aggiungi listener per submit
    form.addEventListener('submit', (e) => this.handleSubmit(e, form));
    
    // Aggiungi validazione real-time
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearError(input));
    });

    // Aggiungi feedback container se non esiste
    if (!form.querySelector('.form-feedback')) {
      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'form-feedback';
      form.appendChild(feedbackDiv);
    }
  }

  validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const name = field.name;
    let isValid = true;
    let errorMessage = '';

    // Validazione per campo richiesto
    if (field.hasAttribute('required') && !value) {
      errorMessage = 'Questo campo è obbligatorio';
      isValid = false;
    }
    // Validazione email
    else if (type === 'email' || name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errorMessage = 'Inserisci un\'email valida';
        isValid = false;
      }
    }
    // Validazione telefono
    else if (type === 'tel' || name === 'telefono' || name === 'phone') {
      const phoneRegex = /^(\+39)?[\s]?[0-9]{3,4}[\s]?[0-9]{6,7}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        errorMessage = 'Inserisci un numero di telefono valido';
        isValid = false;
      }
    }
    // Validazione nome (minimo 2 caratteri)
    else if (name === 'nome' || name === 'name') {
      if (value.length < 2) {
        errorMessage = 'Il nome deve avere almeno 2 caratteri';
        isValid = false;
      }
    }

    if (!isValid) {
      this.showFieldError(field, errorMessage);
    } else {
      this.clearError(field);
    }

    return isValid;
  }

  showFieldError(field, message) {
    // Rimuovi errore esistente
    this.clearError(field);
    
    // Aggiungi classe errore
    field.classList.add('is-invalid');
    
    // Crea elemento errore
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    // Inserisci dopo il campo
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
  }

  clearError(field) {
    field.classList.remove('is-invalid');
    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  async handleSubmit(e, form) {
    e.preventDefault();

    // Previeni doppio invio
    if (this.isSubmitting) return;

    // Valida tutti i campi
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    if (!isValid) {
      this.showFeedback(form, 'Correggi gli errori nel modulo', 'error');
      return;
    }

    this.isSubmitting = true;
    this.showLoading(form, true);

    try {
      // Raccogli dati del form
      const formData = new FormData(form);
      const data = {
        nome: formData.get('nome') || formData.get('name'),
        email: formData.get('email'),
        telefono: formData.get('telefono') || formData.get('phone'),
        azienda: formData.get('azienda') || formData.get('company'),
        comune: formData.get('comune') || formData.get('city'),
        dipendenti: formData.get('dipendenti') || formData.get('employees'),
        messaggio: formData.get('messaggio') || formData.get('message'),
        servizi: this.getSelectedServices(form),
        urgenza: formData.get('urgenza') || 'normale',
        privacy: formData.get('privacy') === 'on' || formData.get('privacy') === '1',
        formType: form.dataset.formType || 'preventivo',
        sendCopy: formData.get('sendCopy') === 'on'
      };

      // Invia richiesta con fallback automatico
      let response;
      try {
        response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
      } catch (primaryError) {
        console.log('Tentativo con endpoint fallback...');
        response = await fetch(this.fallbackEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
      }

      const result = await response.json();

      if (response.ok && result.success) {
        // Successo
        this.showFeedback(form, result.message || 'Richiesta inviata con successo!', 'success');
        
        // Mostra ticket ID se presente
        if (result.ticketId) {
          this.showTicketInfo(form, result.ticketId);
        }

        // Reset form
        form.reset();
        
        // Traccia conversione (se hai Google Analytics)
        if (typeof gtag !== 'undefined') {
          gtag('event', 'form_submit', {
            'event_category': 'engagement',
            'event_label': data.formType
          });
        }

        // Reindirizza dopo 3 secondi (opzionale)
        if (form.dataset.redirectUrl) {
          setTimeout(() => {
            window.location.href = form.dataset.redirectUrl;
          }, 3000);
        }
      } else {
        // Errore
        const errorMessage = result.errors ? result.errors.join(', ') : 
                           result.error || 'Errore durante l\'invio. Riprova.';
        this.showFeedback(form, errorMessage, 'error');
      }
    } catch (error) {
      console.error('Errore invio form:', error);
      this.showFeedback(form, 
        'Errore di connessione. Verifica la tua connessione internet e riprova.', 
        'error'
      );
    } finally {
      this.isSubmitting = false;
      this.showLoading(form, false);
    }
  }

  getSelectedServices(form) {
    const services = [];
    const checkboxes = form.querySelectorAll('input[type="checkbox"][name="servizi"]:checked, input[type="checkbox"][name="services"]:checked');
    checkboxes.forEach(cb => services.push(cb.value));
    
    // Fallback per select multiplo
    const select = form.querySelector('select[name="servizi"], select[name="services"]');
    if (select && select.multiple) {
      Array.from(select.selectedOptions).forEach(option => services.push(option.value));
    }
    
    return services;
  }

  showLoading(form, show) {
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (!submitBtn) return;

    if (show) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Invio in corso...';
    } else {
      submitBtn.disabled = false;
      if (submitBtn.dataset.originalText) {
        submitBtn.textContent = submitBtn.dataset.originalText;
      }
    }
  }

  showFeedback(form, message, type) {
    const feedbackDiv = form.querySelector('.form-feedback');
    if (!feedbackDiv) return;

    // Classi per diversi tipi di feedback
    const classes = {
      success: 'alert alert-success',
      error: 'alert alert-danger',
      warning: 'alert alert-warning',
      info: 'alert alert-info'
    };

    feedbackDiv.className = `form-feedback ${classes[type] || classes.info}`;
    feedbackDiv.innerHTML = `
      <div class="d-flex align-items-center">
        ${type === 'success' ? '<i class="bi bi-check-circle-fill me-2"></i>' : ''}
        ${type === 'error' ? '<i class="bi bi-exclamation-triangle-fill me-2"></i>' : ''}
        <span>${message}</span>
      </div>
    `;
    
    // Scroll al feedback
    feedbackDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Nascondi dopo 10 secondi se successo
    if (type === 'success') {
      setTimeout(() => {
        feedbackDiv.style.opacity = '0';
        setTimeout(() => {
          feedbackDiv.innerHTML = '';
          feedbackDiv.style.opacity = '1';
        }, 300);
      }, 10000);
    }
  }

  showTicketInfo(form, ticketId) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'alert alert-info mt-3';
    infoDiv.innerHTML = `
      <strong>Ticket di riferimento:</strong> ${ticketId}<br>
      <small>Conserva questo codice per riferimenti futuri</small>
    `;
    form.appendChild(infoDiv);
  }
}

// CSS da aggiungere al tuo stylesheet
const formStyles = `
<style>
.form-feedback {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  display: none;
}

.form-feedback:not(:empty) {
  display: block;
}

.invalid-feedback {
  display: block;
  color: #dc3545;
  font-size: 0.875em;
  margin-top: 0.25rem;
}

.is-invalid {
  border-color: #dc3545 !important;
}

.is-invalid:focus {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.2em;
}

.alert {
  position: relative;
  padding: 1rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
}

.alert-success {
  color: #0f5132;
  background-color: #d1e7dd;
  border-color: #badbcc;
}

.alert-danger {
  color: #842029;
  background-color: #f8d7da;
  border-color: #f5c2c7;
}

.alert-info {
  color: #055160;
  background-color: #cff4fc;
  border-color: #b6effb;
}

.alert-warning {
  color: #664d03;
  background-color: #fff3cd;
  border-color: #ffecb5;
}
</style>
`;

// Inizializza quando DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ITERAFormHandler();
    
    // Aggiungi stili se non esistono
    if (!document.querySelector('#itera-form-styles')) {
      const styleElement = document.createElement('div');
      styleElement.id = 'itera-form-styles';
      styleElement.innerHTML = formStyles;
      document.head.appendChild(styleElement.firstElementChild);
    }
  });
} else {
  new ITERAFormHandler();
}