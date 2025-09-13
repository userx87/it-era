/**
 * IT-ERA RESEND.COM INTEGRATION MODULE
 * Modulo universale per l'invio di tutti i form tramite Resend.com
 * Endpoint: https://it-era-resend.bulltech.workers.dev/api/contact
 */

class ITERAResendIntegration {
    constructor() {
        this.config = {
            apiEndpoints: [
                'https://it-era.netlify.app/.netlify/functions/contact',
                'https://it-era-resend.bulltech.workers.dev/api/contact',
                '/api/contact'
            ],
            fallbackEndpoint: 'mailto:info@it-era.it',
            timeout: 15000,
            retryAttempts: 2,
            retryDelay: 1000
        };
        
        this.formTypes = {
            'business-quote-form': {
                type: 'preventivo-aziendale',
                subject: 'Richiesta Preventivo Aziendale - IT-ERA',
                priority: 'high',
                autoReply: true
            },
            'home-booking-form': {
                type: 'prenotazione-privati',
                subject: 'Prenotazione Intervento Privati - IT-ERA',
                priority: 'medium',
                autoReply: true
            },
            'hardware-repair-form': {
                type: 'riparazione-hardware',
                subject: 'Richiesta Riparazione Hardware - IT-ERA',
                priority: 'medium',
                autoReply: true
            },
            'assembly-quote-form': {
                type: 'preventivo-assemblaggio',
                subject: 'Preventivo Assemblaggio PC - IT-ERA',
                priority: 'medium',
                autoReply: true
            },
            'specialized-service-form': {
                type: 'servizi-specializzati',
                subject: 'Richiesta Servizi Specializzati - IT-ERA',
                priority: 'high',
                autoReply: true
            },
            'emergency-form': {
                type: 'emergenza-it',
                subject: '🚨 EMERGENZA IT - Richiesta Immediata',
                priority: 'urgent',
                autoReply: true
            },
            'contact-form': {
                type: 'contatto-generale',
                subject: 'Nuovo Contatto - IT-ERA',
                priority: 'medium',
                autoReply: true
            }
        };
        
        this.init();
    }

    init() {
        console.log('🚀 IT-ERA Resend Integration initialized');
        this.setupFormListeners();
        this.setupGlobalErrorHandling();
    }

    /**
     * Setup automatico dei listener per tutti i form
     */
    setupFormListeners() {
        // Cerca tutti i form con data-resend="true" o ID specifici
        const forms = document.querySelectorAll('form[data-resend="true"], #business-quote-form, #home-booking-form, #hardware-repair-form, #assembly-quote-form, #specialized-service-form, #emergency-form, form[aria-label*="contatto"]');
        
        forms.forEach(form => {
            this.attachFormHandler(form);
        });
        
        console.log(`📧 Attached Resend handlers to ${forms.length} forms`);
    }

    /**
     * Attacca handler a un form specifico
     */
    attachFormHandler(form) {
        if (form.dataset.resendAttached === 'true') {
            return; // Già attaccato
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmission(form, e);
        });
        
        form.dataset.resendAttached = 'true';
        console.log(`📝 Form handler attached: ${form.id || form.className}`);
    }

    /**
     * Gestisce l'invio del form
     */
    async handleFormSubmission(form, event) {
        const formId = form.id || 'unknown-form';
        const formConfig = this.formTypes[formId] || this.formTypes['contact-form'];
        
        console.log(`📤 Processing form submission: ${formId}`);
        
        // Ottieni dati del form
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Validazione base
        const validation = this.validateFormData(data, formId);
        if (!validation.isValid) {
            this.showError(form, validation.errors.join(', '));
            return;
        }
        
        // Mostra stato di caricamento
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.innerHTML : '';
        this.showLoadingState(submitButton);
        
        try {
            // Prepara payload per Resend
            const payload = this.preparePayload(data, formConfig, formId);
            
            // Invia tramite Resend
            const result = await this.sendToResend(payload);
            
            if (result.success) {
                this.showSuccess(form, formConfig);
                this.trackConversion(formId, data);
                
                // Reset form dopo successo
                setTimeout(() => {
                    form.reset();
                }, 2000);
            } else {
                throw new Error(result.error || 'Errore durante l\'invio');
            }
            
        } catch (error) {
            console.error('❌ Form submission error:', error);
            this.showError(form, 'Errore durante l\'invio. Riprova o chiama il 039 888 2041');
            
            // Fallback: mostra numero di telefono
            this.showPhoneFallback(form);
            
        } finally {
            this.resetLoadingState(submitButton, originalButtonText);
        }
    }

    /**
     * Valida i dati del form
     */
    validateFormData(data, formId) {
        const errors = [];
        
        // Validazioni comuni
        if (!data.privacy) {
            errors.push('Devi accettare la privacy policy');
        }
        
        // Validazioni specifiche per tipo di form
        switch (formId) {
            case 'business-quote-form':
                if (!data.company_name) errors.push('Nome azienda richiesto');
                if (!data.contact_name) errors.push('Nome contatto richiesto');
                if (!data.email) errors.push('Email richiesta');
                if (!data.phone) errors.push('Telefono richiesto');
                break;
                
            case 'home-booking-form':
                if (!data.full_name) errors.push('Nome e cognome richiesti');
                if (!data.phone) errors.push('Telefono richiesto');
                if (!data.problem_type) errors.push('Tipo di problema richiesto');
                break;
                
            case 'emergency-form':
                if (!data.phone) errors.push('Telefono richiesto per emergenze');
                if (!data.problem_description) errors.push('Descrizione problema richiesta');
                break;
                
            default:
                if (!data.email && !data.phone) {
                    errors.push('Email o telefono richiesti');
                }
        }
        
        // Validazione email se presente
        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Email non valida');
        }
        
        // Validazione telefono se presente
        if (data.phone && !this.isValidPhone(data.phone)) {
            errors.push('Numero di telefono non valido');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Invia i dati tramite Formspree con fallback
     */
    async sendToResend(payload) {
        try {
            // Prepara i dati per Formspree
            const formData = new FormData();
            formData.append('name', payload.full_name || payload.nome || 'Nome non fornito');
            formData.append('email', payload.email || '');
            formData.append('phone', payload.phone || payload.telefono || '');
            formData.append('company', payload.company || payload.azienda || '');
            formData.append('message', payload.message || payload.messaggio || payload.project_description || '');
            formData.append('service_type', payload.service_type || payload.formType || 'Contatto generico');
            formData.append('page', payload.pagina || document.title);
            formData.append('url', window.location.href);

            // Invia tramite Formspree
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Form inviato con successo tramite Formspree:', result);
                return { success: true, data: result };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Errore invio form:', error);

            // Fallback: apri client email
            this.openEmailFallback(payload);

            return {
                success: false,
                error: 'Problema temporaneo. Abbiamo aperto il tuo client email come alternativa.'
            };
        }
    }

    /**
     * Fallback: apre client email con dati precompilati
     */
    openEmailFallback(payload) {
        const subject = encodeURIComponent(`Contatto dal sito IT-ERA - ${payload.service_type || 'Richiesta informazioni'}`);
        const body = encodeURIComponent(`
Nome: ${payload.full_name || payload.nome || ''}
Email: ${payload.email || ''}
Telefono: ${payload.phone || payload.telefono || ''}
Azienda: ${payload.company || payload.azienda || ''}
Servizio: ${payload.service_type || 'Non specificato'}

Messaggio:
${payload.message || payload.messaggio || payload.project_description || ''}

---
Inviato da: ${window.location.href}
Data: ${new Date().toLocaleString('it-IT')}
        `);

        const mailtoLink = `mailto:info@it-era.it?subject=${subject}&body=${body}`;
        window.open(mailtoLink, '_blank');
    }

    /**
     * Prepara il payload per Resend
     */
    preparePayload(formData, formConfig, formId) {
        const currentPage = window.location.pathname;
        const pageTitle = document.title;
        
        return {
            // Dati del form
            ...formData,
            
            // Metadati
            formType: formConfig.type,
            formId: formId,
            subject: formConfig.subject,
            priority: formConfig.priority,
            autoReply: formConfig.autoReply,
            
            // Informazioni pagina
            pagina: pageTitle,
            pageUrl: window.location.href,
            referrer: document.referrer,
            
            // Informazioni tecniche
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            
            // Informazioni sessione
            sessionId: this.getSessionId(),
            visitCount: this.getVisitCount(),
            
            // Geolocalizzazione (se disponibile)
            location: this.getLocationInfo(),
            
            // UTM parameters (se presenti)
            utm: this.getUTMParameters()
        };
    }

    /**
     * Invia i dati a Resend con retry logic
     */
    async sendToResend(payload) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                console.log(`📤 Sending to Resend (attempt ${attempt}/${this.config.retryAttempts})`);
                
                const response = await fetch(this.config.apiEndpoints[0], {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(this.config.timeout)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log('✅ Resend response:', result);
                
                return {
                    success: true,
                    data: result
                };
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.config.retryAttempts) {
                    await this.delay(this.config.retryDelay * attempt);
                }
            }
        }
        
        return {
            success: false,
            error: lastError.message
        };
    }

    /**
     * Mostra stato di caricamento
     */
    showLoadingState(button) {
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Invio in corso...';
            button.classList.add('opacity-75');
        }
    }

    /**
     * Reset stato di caricamento
     */
    resetLoadingState(button, originalText) {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
            button.classList.remove('opacity-75');
        }
    }

    /**
     * Mostra messaggio di successo
     */
    showSuccess(form, formConfig) {
        const message = this.createMessage('success', this.getSuccessMessage(formConfig));
        this.showMessage(form, message);
    }

    /**
     * Mostra messaggio di errore
     */
    showError(form, errorText) {
        const message = this.createMessage('error', errorText);
        this.showMessage(form, message);
    }

    /**
     * Mostra fallback con numero di telefono
     */
    showPhoneFallback(form) {
        const fallbackMessage = `
            <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 class="font-semibold text-blue-900 mb-2">🚨 Problemi con l'invio?</h4>
                <p class="text-blue-800 mb-3">Contattaci direttamente:</p>
                <div class="flex flex-col sm:flex-row gap-2">
                    <a href="tel:+390398882041" class="btn-primary bg-blue-600 hover:bg-blue-700 text-center">
                        📞 Chiama: 039 888 2041
                    </a>
                    <a href="mailto:info@it-era.it" class="btn-secondary border-blue-600 text-blue-600 hover:bg-blue-50 text-center">
                        ✉️ Email: info@it-era.it
                    </a>
                </div>
            </div>
        `;
        
        const fallbackDiv = document.createElement('div');
        fallbackDiv.innerHTML = fallbackMessage;
        form.appendChild(fallbackDiv);
    }

    /**
     * Crea elemento messaggio
     */
    createMessage(type, text) {
        const colors = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };
        
        return `
            <div class="mt-4 p-4 border rounded-lg ${colors[type]} form-message">
                <div class="flex items-start">
                    <span class="mr-2 text-lg">${icons[type]}</span>
                    <div class="flex-1">
                        <p class="font-medium">${text}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Mostra messaggio nel form
     */
    showMessage(form, messageHtml) {
        // Rimuovi messaggi precedenti
        const existingMessages = form.querySelectorAll('.form-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Aggiungi nuovo messaggio
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = messageHtml;
        form.appendChild(messageDiv);
        
        // Scroll al messaggio
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-remove dopo 10 secondi per messaggi di successo
        if (messageHtml.includes('bg-green-50')) {
            setTimeout(() => {
                messageDiv.remove();
            }, 10000);
        }
    }

    /**
     * Ottieni messaggio di successo personalizzato
     */
    getSuccessMessage(formConfig) {
        const messages = {
            'preventivo-aziendale': 'Richiesta preventivo inviata! Ti ricontatteremo entro 2 ore lavorative.',
            'prenotazione-privati': 'Prenotazione ricevuta! Ti ricontatteremo entro 2 ore per confermare.',
            'riparazione-hardware': 'Richiesta riparazione inviata! Ti contatteremo per la diagnosi gratuita.',
            'preventivo-assemblaggio': 'Richiesta preventivo PC inviata! Ti invieremo un preventivo dettagliato.',
            'servizi-specializzati': 'Richiesta servizi inviata! Un nostro esperto ti contatterà presto.',
            'emergenza-it': '🚨 Emergenza ricevuta! Ti stiamo chiamando immediatamente.',
            'contatto-generale': 'Messaggio inviato! Ti risponderemo il prima possibile.'
        };
        
        return messages[formConfig.type] || 'Messaggio inviato con successo!';
    }

    /**
     * Track conversione per analytics
     */
    trackConversion(formId, data) {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                'event_category': 'contact',
                'event_label': formId,
                'value': 1
            });
        }
        
        // IT-ERA Analytics
        if (window.ITERAAnalytics) {
            window.ITERAAnalytics.trackConversion('form_submission', {
                formId: formId,
                formType: this.formTypes[formId]?.type || 'unknown',
                page: window.location.pathname
            });
        }
        
        console.log('📊 Conversion tracked:', formId);
    }

    /**
     * Utility methods
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidPhone(phone) {
        // Accetta formati italiani comuni
        return /^[\+]?[0-9\s\-\(\)]{8,15}$/.test(phone.replace(/\s/g, ''));
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('itera_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('itera_session_id', sessionId);
        }
        return sessionId;
    }

    getVisitCount() {
        const count = parseInt(localStorage.getItem('itera_visit_count') || '0') + 1;
        localStorage.setItem('itera_visit_count', count.toString());
        return count;
    }

    getLocationInfo() {
        // Informazioni di base sulla località (senza geolocalizzazione precisa)
        return {
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            userAgent: navigator.userAgent
        };
    }

    getUTMParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            utm_source: urlParams.get('utm_source'),
            utm_medium: urlParams.get('utm_medium'),
            utm_campaign: urlParams.get('utm_campaign'),
            utm_term: urlParams.get('utm_term'),
            utm_content: urlParams.get('utm_content')
        };
    }

    setupGlobalErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.message && event.reason.message.includes('resend')) {
                console.error('🚨 Unhandled Resend error:', event.reason);
                // Non mostrare errori tecnici all'utente
                event.preventDefault();
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Auto-inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.ITERAResend = new ITERAResendIntegration();
});

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAResendIntegration;
}
