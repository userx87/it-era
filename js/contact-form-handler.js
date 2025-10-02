/**
 * IT-ERA Contact Form Handler
 * Gestisce tutti i form di contatto con l'API Next.js
 */

(function() {
    'use strict';

    // Configurazione
    const API_ENDPOINT = '/api/contact';
    const API_FALLBACK = 'https://it-era.it/api/contact';

    /**
     * Inizializza tutti i form nella pagina
     */
    function initializeForms() {
        // Trova tutti i form di contatto
        const forms = document.querySelectorAll('form.contact-form, form#contact-form, form[action*="contact"], form[action*="php"]');

        forms.forEach(form => {
            attachFormHandler(form);
        });

        // Gestisci anche form newsletter
        const newsletterForms = document.querySelectorAll('form.newsletter-form, form#newsletter-form, form[action*="newsletter"]');
        newsletterForms.forEach(form => {
            attachNewsletterHandler(form);
        });
    }

    /**
     * Attach handler per form contatto
     */
    function attachFormHandler(form) {
        // Previeni invio standard
        form.setAttribute('novalidate', 'true');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Disabilita il form durante l'invio
            const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
            const originalText = submitButton ? submitButton.textContent || submitButton.value : 'Invia';

            if (submitButton) {
                submitButton.disabled = true;
                if (submitButton.tagName === 'BUTTON') {
                    submitButton.textContent = 'Invio in corso...';
                } else {
                    submitButton.value = 'Invio in corso...';
                }
            }

            try {
                // Raccogli dati dal form
                const formData = collectFormData(form);

                // Valida i dati
                const validation = validateFormData(formData);
                if (!validation.valid) {
                    showMessage(form, 'error', validation.message);
                    return;
                }

                // Invia i dati
                const response = await sendFormData(formData);

                if (response.success) {
                    showMessage(form, 'success', response.message || 'Messaggio inviato con successo! Ti contatteremo presto.');
                    form.reset();

                    // Track conversion se Google Analytics è presente
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'contact_form_submission', {
                            'event_category': 'engagement',
                            'event_label': formData.service || 'general'
                        });
                    }
                } else {
                    showMessage(form, 'error', response.message || 'Si è verificato un errore. Riprova più tardi.');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                showMessage(form, 'error', 'Errore di connessione. Riprova più tardi o chiama il 039 888 2041');
            } finally {
                // Riabilita il form
                if (submitButton) {
                    submitButton.disabled = false;
                    if (submitButton.tagName === 'BUTTON') {
                        submitButton.textContent = originalText;
                    } else {
                        submitButton.value = originalText;
                    }
                }
            }
        });
    }

    /**
     * Handler per newsletter form
     */
    function attachNewsletterHandler(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const emailInput = form.querySelector('input[type="email"]');
            if (!emailInput || !emailInput.value) {
                showMessage(form, 'error', 'Inserisci un indirizzo email valido');
                return;
            }

            const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitButton) submitButton.disabled = true;

            try {
                const data = {
                    name: 'Newsletter Subscriber',
                    email: emailInput.value,
                    message: 'Richiesta iscrizione newsletter',
                    service: 'newsletter',
                    urgency: 'low'
                };

                const response = await sendFormData(data);

                if (response.success) {
                    showMessage(form, 'success', 'Iscrizione completata! Controlla la tua email.');
                    form.reset();
                } else {
                    showMessage(form, 'error', 'Errore durante l\'iscrizione. Riprova.');
                }
            } catch (error) {
                showMessage(form, 'error', 'Errore di connessione.');
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    /**
     * Raccoglie i dati dal form
     */
    function collectFormData(form) {
        const data = {};

        // Campi standard
        const fields = ['name', 'nome', 'email', 'phone', 'telefono', 'tel', 'company', 'azienda', 'service', 'servizio', 'message', 'messaggio', 'msg', 'urgency', 'priorita'];

        fields.forEach(field => {
            const input = form.querySelector(`[name="${field}"], [name="${field}[]"], #${field}`);
            if (input) {
                // Mappa i nomi italiani ai nomi inglesi
                let key = field;
                if (field === 'nome') key = 'name';
                if (field === 'telefono' || field === 'tel') key = 'phone';
                if (field === 'azienda') key = 'company';
                if (field === 'servizio') key = 'service';
                if (field === 'messaggio' || field === 'msg') key = 'message';
                if (field === 'priorita') key = 'urgency';

                data[key] = input.value || '';
            }
        });

        // Se mancano campi essenziali, cerca con altri selettori
        if (!data.name) {
            const nameInput = form.querySelector('input[type="text"]:first-of-type');
            if (nameInput) data.name = nameInput.value;
        }

        if (!data.email) {
            const emailInput = form.querySelector('input[type="email"]');
            if (emailInput) data.email = emailInput.value;
        }

        if (!data.message) {
            const textarea = form.querySelector('textarea');
            if (textarea) data.message = textarea.value;
        }

        // Default per urgency se non presente
        if (!data.urgency) {
            data.urgency = 'medium';
        }

        // Aggiungi informazioni sulla pagina
        data.page_url = window.location.href;
        data.page_title = document.title;

        return data;
    }

    /**
     * Valida i dati del form
     */
    function validateFormData(data) {
        if (!data.name || data.name.trim() === '') {
            return { valid: false, message: 'Il nome è obbligatorio' };
        }

        if (!data.email || !isValidEmail(data.email)) {
            return { valid: false, message: 'Email non valida' };
        }

        if (!data.message || data.message.trim() === '') {
            return { valid: false, message: 'Il messaggio è obbligatorio' };
        }

        return { valid: true };
    }

    /**
     * Valida email
     */
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Invia i dati all'API
     */
    async function sendFormData(data) {
        // Prova prima l'endpoint locale
        let endpoint = API_ENDPOINT;

        // Se siamo su un dominio diverso da localhost, usa l'endpoint completo
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            endpoint = API_FALLBACK;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            // Se fallisce, prova il fallback
            if (endpoint !== API_FALLBACK) {
                const fallbackResponse = await fetch(API_FALLBACK, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                return await fallbackResponse.json();
            }
            throw new Error('API request failed');
        }

        return await response.json();
    }

    /**
     * Mostra messaggio di feedback
     */
    function showMessage(form, type, message) {
        // Rimuovi messaggi esistenti
        const existingMessage = form.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Crea nuovo messaggio
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message form-message-${type}`;
        messageDiv.style.cssText = `
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
            font-weight: 500;
            animation: fadeIn 0.3s;
            ${type === 'success' ?
                'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' :
                'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
        `;
        messageDiv.textContent = message;

        // Inserisci il messaggio
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitButton && submitButton.parentNode) {
            submitButton.parentNode.insertBefore(messageDiv, submitButton.nextSibling);
        } else {
            form.appendChild(messageDiv);
        }

        // Rimuovi dopo 5 secondi
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }

    /**
     * Aggiungi stili per animazione
     */
    function addStyles() {
        if (document.getElementById('contact-form-styles')) return;

        const style = document.createElement('style');
        style.id = 'contact-form-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .form-message {
                transition: opacity 0.3s;
            }
        `;
        document.head.appendChild(style);
    }

    // Inizializza quando il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            addStyles();
            initializeForms();
        });
    } else {
        addStyles();
        initializeForms();
    }

    // Esponi funzioni per uso esterno se necessario
    window.ITERAContactForm = {
        init: initializeForms,
        send: sendFormData
    };
})();