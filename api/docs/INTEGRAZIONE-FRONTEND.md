# 🎨 Guida Integrazione Frontend - Sistema Email IT-ERA

## Quick Start (5 minuti)

### 1️⃣ Copia questo codice nel tuo HTML

```html
<!-- Aggiungi dove vuoi il form -->
<div id="contact-form-container"></div>

<!-- Prima del tag </body> -->
<script>
// Configurazione Form IT-ERA
const ITERA_API = 'https://it-era-email.bulltech.workers.dev/api/contact';

// Auto-init form
document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('contact-form-container');
  if (container) {
    container.innerHTML = `
      <form id="itera-contact-form" class="contact-form">
        <h2>Richiedi Informazioni</h2>
        
        <div class="form-group">
          <input type="text" name="nome" required minlength="2" placeholder="Nome e Cognome *">
        </div>
        
        <div class="form-group">
          <input type="email" name="email" required placeholder="Email *">
        </div>
        
        <div class="form-group">
          <input type="tel" name="telefono" required placeholder="Telefono *">
        </div>
        
        <div class="form-group">
          <input type="text" name="azienda" placeholder="Azienda">
        </div>
        
        <div class="form-group">
          <textarea name="messaggio" rows="4" placeholder="Il tuo messaggio"></textarea>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" name="privacy" required>
            <span>Ho letto e accetto la privacy policy *</span>
          </label>
        </div>
        
        <button type="submit" class="submit-btn">
          <span class="btn-text">Invia Richiesta</span>
          <span class="btn-loading" style="display:none;">Invio in corso...</span>
        </button>
        
        <div class="form-feedback"></div>
      </form>
    `;
    
    // Gestione invio
    const form = document.getElementById('itera-contact-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('.submit-btn');
      const btnText = form.querySelector('.btn-text');
      const btnLoading = form.querySelector('.btn-loading');
      const feedback = form.querySelector('.form-feedback');
      
      // Disabilita form
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      
      // Raccogli dati
      const formData = new FormData(form);
      const data = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        azienda: formData.get('azienda') || '',
        messaggio: formData.get('messaggio') || '',
        privacy: formData.get('privacy') === 'on',
        formType: 'contatto'
      };
      
      try {
        const response = await fetch(ITERA_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          feedback.className = 'form-feedback success';
          feedback.innerHTML = `
            ✅ ${result.message}
            <br><small>Ticket: ${result.ticketId}</small>
          `;
          form.reset();
        } else {
          feedback.className = 'form-feedback error';
          feedback.innerHTML = '❌ ' + (result.error || 'Errore invio');
        }
      } catch (error) {
        feedback.className = 'form-feedback error';
        feedback.innerHTML = '❌ Errore di connessione';
      } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
      }
    });
  }
});
</script>

<!-- CSS Base (personalizzabile) -->
<style>
.contact-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input {
  margin-right: 8px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-feedback {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  display: none;
}

.form-feedback:not(:empty) {
  display: block;
}

.form-feedback.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.form-feedback.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
```

### 2️⃣ Fatto! Il form è pronto 🎉

---

## 🚀 Integrazione Avanzata

### WordPress

```php
// functions.php
function itera_contact_form_shortcode() {
    ob_start();
    ?>
    <div id="itera-form"></div>
    <script>
    // Inserisci il codice JavaScript sopra
    </script>
    <style>
    /* Inserisci CSS sopra */
    </style>
    <?php
    return ob_get_clean();
}
add_shortcode('itera_contact', 'itera_contact_form_shortcode');

// Uso: [itera_contact]
```

### Vue.js 3

```vue
<template>
  <form @submit.prevent="sendForm" class="contact-form">
    <h2>Contattaci</h2>
    
    <input v-model="form.nome" type="text" placeholder="Nome *" required>
    <input v-model="form.email" type="email" placeholder="Email *" required>
    <input v-model="form.telefono" type="tel" placeholder="Telefono *" required>
    <input v-model="form.azienda" type="text" placeholder="Azienda">
    <textarea v-model="form.messaggio" placeholder="Messaggio"></textarea>
    
    <label>
      <input v-model="form.privacy" type="checkbox" required>
      Accetto la privacy policy
    </label>
    
    <button type="submit" :disabled="loading">
      {{ loading ? 'Invio...' : 'Invia' }}
    </button>
    
    <div v-if="status" :class="['alert', status.type]">
      {{ status.message }}
    </div>
  </form>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const form = ref({
      nome: '',
      email: '',
      telefono: '',
      azienda: '',
      messaggio: '',
      privacy: false
    });
    
    const loading = ref(false);
    const status = ref(null);
    
    const sendForm = async () => {
      loading.value = true;
      
      try {
        const response = await fetch('https://it-era-email.bulltech.workers.dev/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form.value)
        });
        
        const result = await response.json();
        
        if (result.success) {
          status.value = { type: 'success', message: result.message };
          // Reset form
          Object.keys(form.value).forEach(key => {
            form.value[key] = key === 'privacy' ? false : '';
          });
        } else {
          status.value = { type: 'error', message: result.error };
        }
      } catch (error) {
        status.value = { type: 'error', message: 'Errore di connessione' };
      } finally {
        loading.value = false;
      }
    };
    
    return { form, loading, status, sendForm };
  }
};
</script>
```

### React con TypeScript

```tsx
import React, { useState } from 'react';

interface FormData {
  nome: string;
  email: string;
  telefono: string;
  azienda?: string;
  messaggio?: string;
  privacy: boolean;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  ticketId?: string;
}

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telefono: '',
    azienda: '',
    messaggio: '',
    privacy: false
  });
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('https://it-era-email.bulltech.workers.dev/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: `${result.message} - Ticket: ${result.ticketId}`
        });
        // Reset form
        setFormData({
          nome: '',
          email: '',
          telefono: '',
          azienda: '',
          messaggio: '',
          privacy: false
        });
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Errore durante l\'invio'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Errore di connessione al server'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <h2>Richiedi Preventivo</h2>
      
      <input
        type="text"
        name="nome"
        value={formData.nome}
        onChange={handleChange}
        placeholder="Nome e Cognome *"
        required
        minLength={2}
      />
      
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email *"
        required
      />
      
      <input
        type="tel"
        name="telefono"
        value={formData.telefono}
        onChange={handleChange}
        placeholder="Telefono *"
        required
      />
      
      <input
        type="text"
        name="azienda"
        value={formData.azienda}
        onChange={handleChange}
        placeholder="Azienda"
      />
      
      <textarea
        name="messaggio"
        value={formData.messaggio}
        onChange={handleChange}
        placeholder="Il tuo messaggio"
        rows={4}
      />
      
      <label>
        <input
          type="checkbox"
          name="privacy"
          checked={formData.privacy}
          onChange={handleChange}
          required
        />
        Accetto la privacy policy *
      </label>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Invio in corso...' : 'Invia Richiesta'}
      </button>
      
      {status && (
        <div className={`alert ${status.type}`}>
          {status.message}
        </div>
      )}
    </form>
  );
};

export default ContactForm;
```

### jQuery (Legacy)

```javascript
$(document).ready(function() {
  $('#contact-form').on('submit', function(e) {
    e.preventDefault();
    
    var $form = $(this);
    var $btn = $form.find('button[type="submit"]');
    var $feedback = $form.find('.form-feedback');
    
    // Disabilita form
    $btn.prop('disabled', true).text('Invio in corso...');
    
    // Raccogli dati
    var formData = {
      nome: $form.find('[name="nome"]').val(),
      email: $form.find('[name="email"]').val(),
      telefono: $form.find('[name="telefono"]').val(),
      azienda: $form.find('[name="azienda"]').val(),
      messaggio: $form.find('[name="messaggio"]').val(),
      privacy: $form.find('[name="privacy"]').is(':checked'),
      formType: 'contatto'
    };
    
    // Invia richiesta
    $.ajax({
      url: 'https://it-era-email.bulltech.workers.dev/api/contact',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(formData),
      success: function(result) {
        if (result.success) {
          $feedback
            .removeClass('error')
            .addClass('success')
            .html('✅ ' + result.message + '<br>Ticket: ' + result.ticketId)
            .show();
          $form[0].reset();
        } else {
          $feedback
            .removeClass('success')
            .addClass('error')
            .html('❌ ' + result.error)
            .show();
        }
      },
      error: function() {
        $feedback
          .removeClass('success')
          .addClass('error')
          .html('❌ Errore di connessione')
          .show();
      },
      complete: function() {
        $btn.prop('disabled', false).text('Invia Richiesta');
      }
    });
  });
});
```

## 🎯 Form Specializzati

### Form Preventivo Dettagliato

```html
<form id="preventivo-form" data-form-type="preventivo">
  <!-- Dati base -->
  <fieldset>
    <legend>Dati di Contatto</legend>
    <input type="text" name="nome" required placeholder="Nome *">
    <input type="email" name="email" required placeholder="Email *">
    <input type="tel" name="telefono" required placeholder="Telefono *">
    <input type="text" name="azienda" placeholder="Azienda">
  </fieldset>
  
  <!-- Servizi -->
  <fieldset>
    <legend>Servizi Richiesti</legend>
    <label><input type="checkbox" name="servizi" value="Sito web"> Sito Web</label>
    <label><input type="checkbox" name="servizi" value="E-commerce"> E-commerce</label>
    <label><input type="checkbox" name="servizi" value="App mobile"> App Mobile</label>
    <label><input type="checkbox" name="servizi" value="Assistenza IT"> Assistenza IT</label>
    <label><input type="checkbox" name="servizi" value="Server"> Server e Cloud</label>
    <label><input type="checkbox" name="servizi" value="Cybersecurity"> Cybersecurity</label>
  </fieldset>
  
  <!-- Dettagli -->
  <fieldset>
    <legend>Dettagli Progetto</legend>
    <select name="dipendenti">
      <option value="">Numero dipendenti</option>
      <option value="1-10">1-10</option>
      <option value="10-50">10-50</option>
      <option value="50-100">50-100</option>
      <option value="100+">Oltre 100</option>
    </select>
    
    <select name="urgenza">
      <option value="normale">Tempistica normale</option>
      <option value="urgente">Urgente (entro 7 giorni)</option>
    </select>
    
    <textarea name="messaggio" rows="5" placeholder="Descrivi il tuo progetto..."></textarea>
  </fieldset>
  
  <label>
    <input type="checkbox" name="privacy" required>
    Ho letto e accetto la privacy policy
  </label>
  
  <button type="submit">Richiedi Preventivo</button>
</form>
```

### Form Assistenza Tecnica

```javascript
// Form per ticket di supporto
const supportForm = {
  nome: 'Mario Rossi',
  email: 'mario@azienda.it',
  telefono: '02 1234567',
  azienda: 'Rossi SRL',
  
  // Campi specifici supporto
  urgenza: 'urgente',
  servizi: ['Assistenza IT', 'Server'],
  messaggio: 'Server down da 2 ore, necessario intervento urgente',
  
  // Tipo form
  formType: 'supporto',
  privacy: true
};

// Invio con priorità
fetch('https://it-era-email.bulltech.workers.dev/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(supportForm)
});
```

## 🔐 Validazione Avanzata

### Validazione Real-time

```javascript
// Validazione mentre l'utente digita
document.querySelectorAll('input, textarea').forEach(field => {
  field.addEventListener('blur', function() {
    validateField(this);
  });
  
  field.addEventListener('input', function() {
    clearError(this);
  });
});

function validateField(field) {
  const value = field.value.trim();
  let isValid = true;
  let errorMsg = '';
  
  // Validazione per tipo
  switch(field.name) {
    case 'nome':
      if (value.length < 2) {
        errorMsg = 'Nome troppo corto';
        isValid = false;
      }
      break;
      
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errorMsg = 'Email non valida';
        isValid = false;
      }
      break;
      
    case 'telefono':
      const telRegex = /^(\+39)?[\s]?[0-9]{3,4}[\s]?[0-9]{6,7}$/;
      if (!telRegex.test(value.replace(/\s/g, ''))) {
        errorMsg = 'Telefono non valido';
        isValid = false;
      }
      break;
  }
  
  if (!isValid) {
    showError(field, errorMsg);
  }
  
  return isValid;
}

function showError(field, message) {
  field.classList.add('error');
  
  // Mostra messaggio errore
  let errorEl = field.nextElementSibling;
  if (!errorEl || !errorEl.classList.contains('error-message')) {
    errorEl = document.createElement('span');
    errorEl.className = 'error-message';
    field.parentNode.insertBefore(errorEl, field.nextSibling);
  }
  errorEl.textContent = message;
}

function clearError(field) {
  field.classList.remove('error');
  const errorEl = field.nextElementSibling;
  if (errorEl && errorEl.classList.contains('error-message')) {
    errorEl.remove();
  }
}
```

## 📊 Analytics e Tracking

### Google Analytics 4

```javascript
// Traccia invio form
function trackFormSubmit(result, formType) {
  if (typeof gtag !== 'undefined') {
    if (result.success) {
      // Conversione riuscita
      gtag('event', 'generate_lead', {
        'value': 1,
        'currency': 'EUR',
        'form_type': formType,
        'ticket_id': result.ticketId
      });
    } else {
      // Errore form
      gtag('event', 'form_error', {
        'form_type': formType,
        'error_message': result.error
      });
    }
  }
}
```

### Facebook Pixel

```javascript
// Traccia lead Facebook
function trackFacebookLead(result) {
  if (typeof fbq !== 'undefined' && result.success) {
    fbq('track', 'Lead', {
      value: 1,
      currency: 'EUR',
      content_name: 'Contact Form',
      ticket_id: result.ticketId
    });
  }
}
```

## 🎨 Styling Professionale

### CSS Moderno con Animazioni

```css
/* Form IT-ERA Professional */
.itera-form {
  --primary: #667eea;
  --secondary: #764ba2;
  --success: #10b981;
  --error: #ef4444;
  
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

.itera-form input,
.itera-form textarea,
.itera-form select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.itera-form input:focus,
.itera-form textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgb(102 126 234 / 0.1);
}

.itera-form input.error {
  border-color: var(--error);
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.itera-form button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.itera-form button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgb(102 126 234 / 0.3);
}

.itera-form button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Loading animation */
.itera-form button.loading::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  margin: auto;
  border: 2px solid transparent;
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Success/Error messages */
.form-feedback {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-feedback.success {
  background: rgb(16 185 129 / 0.1);
  color: var(--success);
  border: 1px solid rgb(16 185 129 / 0.2);
}

.form-feedback.error {
  background: rgb(239 68 68 / 0.1);
  color: var(--error);
  border: 1px solid rgb(239 68 68 / 0.2);
}

/* Responsive */
@media (max-width: 640px) {
  .itera-form {
    padding: 1.5rem;
    margin: 1rem;
  }
}
```

## 🚀 Performance Tips

### Lazy Loading

```javascript
// Carica form solo quando visibile
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadContactForm();
      observer.unobserve(entry.target);
    }
  });
});

observer.observe(document.getElementById('contact-section'));
```

### Debounce Validazione

```javascript
// Evita validazioni eccessive
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const validateEmail = debounce((email) => {
  // Validazione email
}, 500);
```

## ✅ Checklist Integrazione

- [ ] Form HTML con campi obbligatori
- [ ] Validazione client-side attiva
- [ ] Gestione stati loading/success/error
- [ ] Feedback visivo chiaro
- [ ] Mobile responsive
- [ ] Accessibilità (ARIA labels)
- [ ] Test invio reale
- [ ] Analytics configurate
- [ ] Fallback per JS disabilitato

---

**Supporto Tecnico**: andrea@bulltech.it | 039 888 2041
*Sistema Email IT-ERA v2.0 - Integrazione Frontend*