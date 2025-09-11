/**
 * IT-ERA Form Handler
 * Handles form submissions with validation and analytics tracking
 */

class ITERAFormHandler {
    constructor() {
        this.init();
    }

    init() {
        // Initialize form handlers when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupForms());
        } else {
            this.setupForms();
        }
    }

    setupForms() {
        const forms = document.querySelectorAll('form[data-itera-form]');
        forms.forEach(form => this.setupForm(form));
    }

    setupForm(form) {
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
        });
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form
        if (!this.validateForm(form)) {
            return;
        }

        // Show loading state
        this.setFormLoading(form, true);

        try {
            // Track form submission
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_submit', {
                    event_category: 'engagement',
                    event_label: form.id || 'contact_form',
                    service_type: this.detectServiceType()
                });
            }

            // Submit form (placeholder - replace with actual endpoint)
            const response = await this.submitForm(data);
            
            if (response.success) {
                this.showSuccess(form);
                form.reset();
            } else {
                this.showError(form, response.message || 'Errore durante l\'invio');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError(form, 'Errore di connessione. Riprova più tardi.');
        } finally {
            this.setFormLoading(form, false);
        }
    }

    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = 'Questo campo è obbligatorio';
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Inserisci un indirizzo email valido';
            }
        }

        // Phone validation
        if (field.type === 'tel' && value) {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                message = 'Inserisci un numero di telefono valido';
            }
        }

        this.showFieldValidation(field, isValid, message);
        return isValid;
    }

    showFieldValidation(field, isValid, message) {
        // Remove existing validation
        field.classList.remove('is-valid', 'is-invalid');
        const existingFeedback = field.parentNode.querySelector('.invalid-feedback, .valid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        if (!isValid && message) {
            field.classList.add('is-invalid');
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = message;
            field.parentNode.appendChild(feedback);
        } else if (field.value.trim()) {
            field.classList.add('is-valid');
        }
    }

    async submitForm(data) {
        // Placeholder implementation
        // In production, replace with actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, message: 'Form submitted successfully' });
            }, 1000);
        });
    }

    setFormLoading(form, loading) {
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
            if (loading) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Invio in corso...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = submitBtn.dataset.originalText || 'Invia';
            }
        }
    }

    showSuccess(form) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show mt-3';
        alert.innerHTML = `
            <strong>Grazie!</strong> Il tuo messaggio è stato inviato con successo. Ti contatteremo presto.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        form.parentNode.insertBefore(alert, form.nextSibling);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    showError(form, message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alert.innerHTML = `
            <strong>Errore!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        form.parentNode.insertBefore(alert, form.nextSibling);
    }

    detectServiceType() {
        const title = document.title.toLowerCase();
        if (title.includes('assistenza')) return 'assistenza-it';
        if (title.includes('sicurezza')) return 'sicurezza-informatica';
        if (title.includes('cloud')) return 'cloud-storage';
        if (title.includes('microsoft')) return 'microsoft-365';
        return 'general';
    }
}

// Initialize form handler
new ITERAFormHandler();
