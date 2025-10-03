/**
 * Universal Contact Form Handler
 * Centralized form submission logic for all contact forms across all pages
 *
 * Usage in HTML:
 * <form class="universal-contact-form" data-service="Nome Servizio" data-urgency="medium">
 *   <input type="text" name="name" required>
 *   <input type="email" name="email" required>
 *   <input type="tel" name="phone">
 *   <input type="text" name="company">
 *   <textarea name="message" required></textarea>
 *   <button type="submit">Invia</button>
 * </form>
 *
 * <script src="/js/contact-form-universal.js"></script>
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        apiEndpoint: '/api/contact',
        formSelector: '.universal-contact-form, form[action*="contact"]',
        submitSelector: 'button[type="submit"]',
        successMessage: '✅ Messaggio inviato con successo! Ti contatteremo presto.',
        errorMessage: '❌ Errore nell\'invio. Riprova o contattaci direttamente.',
        loadingText: 'Invio in corso...',
        defaultService: 'Richiesta informazioni'
    };

    /**
     * Initialize all contact forms on the page
     */
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachFormHandlers);
        } else {
            attachFormHandlers();
        }
    }

    /**
     * Attach handlers to all contact forms
     */
    function attachFormHandlers() {
        const forms = document.querySelectorAll(CONFIG.formSelector);

        forms.forEach(form => {
            // Skip if already initialized
            if (form.dataset.universalFormInit) return;

            form.addEventListener('submit', handleSubmit);
            form.dataset.universalFormInit = 'true';

            console.log('[ContactForm] Handler attached to form:', form);
        });

        console.log(`[ContactForm] Initialized ${forms.length} contact form(s)`);
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector(CONFIG.submitSelector);
        const formData = new FormData(form);

        // Disable submit button
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = CONFIG.loadingText;
        }

        try {
            // Extract form data
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone') || formData.get('telefono'),
                company: formData.get('company') || formData.get('azienda'),
                service: form.dataset.service || formData.get('service') || CONFIG.defaultService,
                message: formData.get('message') || formData.get('messaggio'),
                urgency: form.dataset.urgency || formData.get('urgency') || 'medium'
            };

            // Validate required fields
            if (!data.name || !data.email || !data.message) {
                throw new Error('Compila tutti i campi obbligatori');
            }

            // Send to API
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success
                showMessage(form, CONFIG.successMessage, 'success');
                form.reset();

                // Track conversion (if analytics available)
                if (window.gtag) {
                    window.gtag('event', 'form_submit', {
                        event_category: 'Contact',
                        event_label: data.service,
                        value: 1
                    });
                }
            } else {
                // API returned error
                throw new Error(result.error || result.message || 'Errore sconosciuto');
            }

        } catch (error) {
            console.error('[ContactForm] Submission error:', error);
            showMessage(form, `${CONFIG.errorMessage}<br><small>${error.message}</small>`, 'error');
        } finally {
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }

    /**
     * Show message to user
     */
    function showMessage(form, message, type = 'info') {
        // Remove existing message
        const existing = form.querySelector('.form-message');
        if (existing) existing.remove();

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `form-message form-message-${type}`;
        messageEl.innerHTML = message;
        messageEl.style.cssText = `
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.5;
            ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
            ${type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
            ${type === 'info' ? 'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;' : ''}
        `;

        // Insert before submit button or at end of form
        const submitBtn = form.querySelector(CONFIG.submitSelector);
        if (submitBtn) {
            submitBtn.parentNode.insertBefore(messageEl, submitBtn);
        } else {
            form.appendChild(messageEl);
        }

        // Auto-remove success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageEl.style.transition = 'opacity 0.5s';
                messageEl.style.opacity = '0';
                setTimeout(() => messageEl.remove(), 500);
            }, 5000);
        }
    }

    /**
     * Public API
     */
    window.UniversalContactForm = {
        init: init,
        attachHandlers: attachFormHandlers,
        handleSubmit: handleSubmit
    };

    // Auto-initialize
    init();

})();
