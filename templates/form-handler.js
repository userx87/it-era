/**
 * Advanced Contact Form Handler with Resend Integration
 * Cybersecurity Landing Page - IT-ERA
 */

class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitButton = null;
        this.originalButtonText = '';
        this.apiEndpoint = '/api/contact'; // Update with your endpoint
        this.init();
    }

    init() {
        if (!this.form) return;
        
        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.originalButtonText = this.submitButton?.innerHTML || 'Invia Richiesta';
        
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.addRealTimeValidation();
        this.addCyberSecurityEnhancements();
    }

    addRealTimeValidation() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const name = field.name;
        let isValid = true;
        let errorMessage = '';

        // Remove existing error styling
        this.clearFieldError(field);

        // Required field validation
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'Campo obbligatorio';
        }

        // Email validation
        if (name === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Email non valida';
            }
        }

        // Phone validation
        if (name === 'telefono' && value) {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Numero di telefono non valido';
            }
        }

        // Security validation for potential threats
        if (this.containsSuspiciousContent(value)) {
            isValid = false;
            errorMessage = 'Contenuto non consentito rilevato';
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    containsSuspiciousContent(value) {
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /SELECT.*FROM/i,
            /DROP.*TABLE/i,
            /UNION.*SELECT/i
        ];

        return suspiciousPatterns.some(pattern => pattern.test(value));
    }

    showFieldError(field, message) {
        field.style.borderColor = 'var(--cyber-danger)';
        field.style.boxShadow = '0 0 10px rgba(255, 0, 51, 0.3)';
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = `
            color: var(--cyber-danger);
            font-size: 0.8rem;
            margin-top: 0.25rem;
            animation: shake 0.3s ease-in-out;
        `;
        errorDiv.textContent = message;
        
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }

    clearFieldError(field) {
        field.style.borderColor = '';
        field.style.boxShadow = '';
        
        const errorMessage = field.parentNode.querySelector('.field-error');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        // Validate all fields
        const inputs = this.form.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showGlobalError('Completa tutti i campi obbligatori correttamente');
            return;
        }

        // Check privacy policy
        const privacyCheckbox = this.form.querySelector('#privacy');
        if (!privacyCheckbox?.checked) {
            this.showGlobalError('Accetta la privacy policy per continuare');
            return;
        }

        // Show loading state
        this.setSubmitState('loading');

        try {
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData.entries());
            
            // Add security metadata
            data.timestamp = new Date().toISOString();
            data.userAgent = navigator.userAgent;
            data.referrer = document.referrer;
            data.pageUrl = window.location.href;
            
            const response = await this.submitToResend(data);
            
            if (response.success) {
                this.showSuccess();
                this.trackConversion('contact_form_submit');
            } else {
                throw new Error(response.message || 'Errore durante l\'invio');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showGlobalError('Si è verificato un errore. Riprova tra qualche minuto.');
        } finally {
            this.setSubmitState('idle');
        }
    }

    async submitToResend(data) {
        // This would typically call your backend endpoint that handles Resend integration
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    setSubmitState(state) {
        if (!this.submitButton) return;

        switch (state) {
            case 'loading':
                this.submitButton.disabled = true;
                this.submitButton.innerHTML = `
                    <i class="bi bi-arrow-clockwise me-2 rotating"></i>
                    Invio in corso...
                `;
                break;
            case 'success':
                this.submitButton.innerHTML = `
                    <i class="bi bi-check-circle me-2"></i>
                    Richiesta Inviata!
                `;
                this.submitButton.style.background = 'var(--cyber-success)';
                break;
            case 'idle':
            default:
                this.submitButton.disabled = false;
                this.submitButton.innerHTML = this.originalButtonText;
                this.submitButton.style.background = '';
                break;
        }
    }

    showSuccess() {
        // Remove any existing messages
        this.clearGlobalMessages();
        
        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.style.cssText = `
            background: rgba(0, 255, 68, 0.1);
            border: 1px solid var(--cyber-success);
            color: var(--cyber-success);
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 1rem;
            animation: slideInUp 0.5s ease;
        `;
        successDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-shield-check me-3" style="font-size: 1.5rem;"></i>
                <div>
                    <h6 class="mb-1">Assessment Richiesto con Successo!</h6>
                    <small>Ti contatteremo entro 2 ore lavorative per programmare l'assessment gratuito.</small>
                </div>
            </div>
        `;
        
        this.form.insertBefore(successDiv, this.form.firstChild);
        this.setSubmitState('success');
        
        // Reset form after delay
        setTimeout(() => {
            this.form.reset();
            successDiv.remove();
            this.setSubmitState('idle');
        }, 5000);
    }

    showGlobalError(message) {
        this.clearGlobalMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.style.cssText = `
            background: rgba(255, 0, 51, 0.1);
            border: 1px solid var(--cyber-danger);
            color: var(--cyber-danger);
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 1rem;
            animation: shake 0.5s ease;
        `;
        errorDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-exclamation-triangle me-3"></i>
                <span>${message}</span>
            </div>
        `;
        
        this.form.insertBefore(errorDiv, this.form.firstChild);
    }

    clearGlobalMessages() {
        const alerts = this.form.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }

    addCyberSecurityEnhancements() {
        // Add honeypot field (hidden from users, catches bots)
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website_url';
        honeypot.style.cssText = `
            position: absolute;
            left: -9999px;
            top: -9999px;
            opacity: 0;
            pointer-events: none;
        `;
        honeypot.setAttribute('tabindex', '-1');
        honeypot.setAttribute('autocomplete', 'off');
        this.form.appendChild(honeypot);

        // Add CSRF-like token (timestamp)
        const csrfToken = document.createElement('input');
        csrfToken.type = 'hidden';
        csrfToken.name = 'form_token';
        csrfToken.value = btoa(Date.now().toString());
        this.form.appendChild(csrfToken);
    }

    trackConversion(eventName) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'cybersecurity',
                event_label: 'contact_form',
                value: 1
            });
        }

        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', {
                content_name: 'Cybersecurity Assessment',
                content_category: 'IT Security'
            });
        }
    }
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .rotating {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .field-error {
        animation: shake 0.3s ease-in-out;
    }
`;
document.head.appendChild(style);

// Initialize form handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactFormHandler();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContactFormHandler;
}