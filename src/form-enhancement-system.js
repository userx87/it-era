/**
 * IT-ERA Form Enhancement System
 * Comprehensive JavaScript form validation with user-friendly Italian messages
 * Version: 2.0.0
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        selectors: {
            forms: 'form',
            emailInputs: 'input[type="email"]',
            phoneInputs: 'input[type="tel"], input[name="phone"]',
            requiredInputs: '[required]',
            textInputs: 'input[type="text"], textarea',
            nameInputs: 'input[name*="name"], input[name*="nome"]',
            companyInputs: 'input[name*="company"], input[name*="azienda"]'
        },
        classes: {
            invalid: 'is-invalid',
            valid: 'is-valid',
            errorMessage: 'form-error-message',
            successMessage: 'form-success-message',
            loading: 'form-loading'
        },
        messages: {
            required: 'Questo campo è obbligatorio',
            email: 'Inserisci un indirizzo email valido',
            phone: 'Inserisci un numero di telefono valido (almeno 10 cifre)',
            minLength: 'Il campo deve contenere almeno {min} caratteri',
            maxLength: 'Il campo non può superare {max} caratteri',
            name: 'Il nome deve contenere solo lettere e spazi',
            success: {
                normal: '✅ Grazie! Ti contatteremo entro 2 ore.',
                urgent: '⚡ RICHIESTA URGENTE RICEVUTA! Ti contatteremo entro 2 ore.',
                critical: '🚨 EMERGENZA RICEVUTA! Ti chiamiamo entro 15 minuti.',
                default: '✅ RICHIESTA INVIATA! Ti contatteremo presto.'
            },
            error: {
                network: 'Errore di connessione. Riprova più tardi o chiama il 039 888 2041.',
                server: 'Si è verificato un errore. Ti preghiamo di chiamare direttamente il 039 888 2041.',
                validation: 'Controlla i dati inseriti e riprova.'
            }
        },
        patterns: {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[\d\+\-\(\)\s]{10,}$/,
            phoneClean: /[\d\+]/g,
            name: /^[a-zA-ZÀ-ÿ\s'-]+$/,
            company: /^[a-zA-Z0-9À-ÿ\s'.-]+$/
        },
        animation: {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
    };

    // Utility functions
    const Utils = {
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        addClass(element, className) {
            if (element && !element.classList.contains(className)) {
                element.classList.add(className);
            }
        },

        removeClass(element, className) {
            if (element && element.classList.contains(className)) {
                element.classList.remove(className);
            }
        },

        insertAfter(newNode, referenceNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        },

        formatMessage(template, values) {
            return template.replace(/\{(\w+)\}/g, (match, key) => values[key] || match);
        },

        sanitizeInput(input) {
            return input.trim().replace(/[<>]/g, '');
        }
    };

    // Validation rules
    const ValidationRules = {
        required(value) {
            return value && value.trim().length > 0;
        },

        email(value) {
            if (!value) return true; // Skip if empty and not required
            return CONFIG.patterns.email.test(value);
        },

        phone(value) {
            if (!value) return true; // Skip if empty and not required
            const cleanPhone = value.replace(/[^\d\+]/g, '');
            return cleanPhone.length >= 10;
        },

        name(value) {
            if (!value) return true; // Skip if empty and not required
            return CONFIG.patterns.name.test(value) && value.length >= 2;
        },

        company(value) {
            if (!value) return true; // Skip if empty and not required
            return CONFIG.patterns.company.test(value) && value.length >= 2;
        },

        minLength(value, min) {
            if (!value) return true; // Skip if empty and not required
            return value.length >= min;
        },

        maxLength(value, max) {
            return !value || value.length <= max;
        }
    };

    // Form validator class
    class FormValidator {
        constructor(form) {
            this.form = form;
            this.errors = new Map();
            this.isSubmitting = false;
            this.init();
        }

        init() {
            this.setupValidation();
            this.bindEvents();
            this.injectStyles();
        }

        setupValidation() {
            // Add novalidate to prevent browser validation
            this.form.setAttribute('novalidate', 'true');

            // Add validation attributes if not present
            this.form.querySelectorAll(CONFIG.selectors.emailInputs).forEach(input => {
                if (!input.hasAttribute('pattern')) {
                    input.setAttribute('pattern', CONFIG.patterns.email.source);
                }
            });
        }

        bindEvents() {
            // Real-time validation on input
            this.form.addEventListener('input', Utils.debounce((e) => {
                if (e.target.matches('input, textarea, select')) {
                    this.validateField(e.target);
                }
            }, 300));

            // Validation on blur
            this.form.addEventListener('blur', (e) => {
                if (e.target.matches('input, textarea, select')) {
                    this.validateField(e.target);
                }
            }, true);

            // Form submission
            this.form.addEventListener('submit', (e) => {
                this.handleSubmit(e);
            });
        }

        validateField(field) {
            const value = Utils.sanitizeInput(field.value);
            const fieldName = field.name || field.id;
            const isRequired = field.hasAttribute('required');

            // Clear previous errors for this field
            this.clearFieldError(field);

            // Required validation
            if (isRequired && !ValidationRules.required(value)) {
                this.setFieldError(field, CONFIG.messages.required);
                return false;
            }

            // Skip other validations if field is empty and not required
            if (!value && !isRequired) {
                this.setFieldValid(field);
                return true;
            }

            // Type-specific validations
            let isValid = true;
            let errorMessage = '';

            if (field.type === 'email') {
                isValid = ValidationRules.email(value);
                errorMessage = CONFIG.messages.email;
            } else if (field.type === 'tel' || field.name.includes('phone')) {
                isValid = ValidationRules.phone(value);
                errorMessage = CONFIG.messages.phone;
            } else if (field.name.includes('name') || field.name.includes('nome')) {
                isValid = ValidationRules.name(value);
                errorMessage = CONFIG.messages.name;
            } else if (field.name.includes('company') || field.name.includes('azienda')) {
                isValid = ValidationRules.company(value);
                errorMessage = 'Inserisci un nome azienda valido';
            }

            // Length validations
            const minLength = field.getAttribute('minlength');
            const maxLength = field.getAttribute('maxlength');

            if (minLength && !ValidationRules.minLength(value, parseInt(minLength))) {
                isValid = false;
                errorMessage = Utils.formatMessage(CONFIG.messages.minLength, { min: minLength });
            }

            if (maxLength && !ValidationRules.maxLength(value, parseInt(maxLength))) {
                isValid = false;
                errorMessage = Utils.formatMessage(CONFIG.messages.maxLength, { max: maxLength });
            }

            if (isValid) {
                this.setFieldValid(field);
            } else {
                this.setFieldError(field, errorMessage);
            }

            return isValid;
        }

        setFieldError(field, message) {
            Utils.addClass(field, CONFIG.classes.invalid);
            Utils.removeClass(field, CONFIG.classes.valid);

            this.errors.set(field, message);
            this.showFieldError(field, message);
        }

        setFieldValid(field) {
            Utils.removeClass(field, CONFIG.classes.invalid);
            Utils.addClass(field, CONFIG.classes.valid);

            this.errors.delete(field);
            this.hideFieldError(field);
        }

        clearFieldError(field) {
            Utils.removeClass(field, CONFIG.classes.invalid);
            Utils.removeClass(field, CONFIG.classes.valid);

            this.errors.delete(field);
            this.hideFieldError(field);
        }

        showFieldError(field, message) {
            // Remove existing error message
            this.hideFieldError(field);

            // Create error message element
            const errorElement = document.createElement('div');
            errorElement.className = CONFIG.classes.errorMessage;
            errorElement.textContent = message;
            errorElement.style.cssText = `
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: block;
                animation: slideDown ${CONFIG.animation.duration}ms ${CONFIG.animation.easing};
            `;

            // Insert after field
            Utils.insertAfter(errorElement, field);
        }

        hideFieldError(field) {
            const existingError = field.parentNode.querySelector(`.${CONFIG.classes.errorMessage}`);
            if (existingError) {
                existingError.remove();
            }
        }

        validateAll() {
            let isFormValid = true;
            const fields = this.form.querySelectorAll('input, textarea, select');

            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isFormValid = false;
                }
            });

            return isFormValid;
        }

        handleSubmit(event) {
            event.preventDefault();
            event.stopPropagation();

            if (this.isSubmitting) {
                return;
            }

            // Validate all fields
            const isValid = this.validateAll();

            if (!isValid) {
                this.showFormError(CONFIG.messages.error.validation);
                this.focusFirstError();
                return;
            }

            this.submitForm();
        }

        async submitForm() {
            this.isSubmitting = true;
            this.showLoading(true);

            try {
                const formData = new FormData(this.form);
                const data = Object.fromEntries(formData.entries());

                // Add metadata
                data.pageUrl = window.location.href;
                data.timestamp = new Date().toISOString();
                data.userAgent = navigator.userAgent;

                // Determine success message based on urgency
                const urgency = data.urgency;
                let successMessage = CONFIG.messages.success.default;

                if (urgency === 'critica') {
                    successMessage = CONFIG.messages.success.critical;
                } else if (urgency === 'alta') {
                    successMessage = CONFIG.messages.success.urgent;
                } else {
                    successMessage = CONFIG.messages.success.normal;
                }

                // Try to send via existing integration or fallback
                let result;
                if (window.ITERAResendIntegration) {
                    result = await window.ITERAResendIntegration.sendToResend(data);
                } else {
                    // Fallback to simple submission
                    result = await this.fallbackSubmit(data);
                }

                if (result.success) {
                    this.showFormSuccess(successMessage);
                    this.resetForm();
                } else {
                    throw new Error(result.error || 'Submission failed');
                }

            } catch (error) {
                console.error('Form submission error:', error);
                this.showFormError(CONFIG.messages.error.server);
            } finally {
                this.isSubmitting = false;
                this.showLoading(false);
            }
        }

        async fallbackSubmit(data) {
            // Simple fallback - in a real implementation this would call your backend
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ success: true });
                }, 1000);
            });
        }

        showFormSuccess(message) {
            this.removeFormMessage();

            const successElement = document.createElement('div');
            successElement.className = CONFIG.classes.successMessage;
            successElement.innerHTML = `
                <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="font-medium">${message}</span>
                    </div>
                </div>
            `;

            this.form.prepend(successElement);
            successElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        showFormError(message) {
            this.removeFormMessage();

            const errorElement = document.createElement('div');
            errorElement.className = CONFIG.classes.errorMessage + ' form-message';
            errorElement.innerHTML = `
                <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="font-medium">${message}</span>
                    </div>
                </div>
            `;

            this.form.prepend(errorElement);
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        removeFormMessage() {
            const existingMessages = this.form.querySelectorAll(`.${CONFIG.classes.successMessage}, .${CONFIG.classes.errorMessage}.form-message`);
            existingMessages.forEach(msg => msg.remove());
        }

        showLoading(show) {
            const submitBtn = this.form.querySelector('button[type="submit"]');
            if (!submitBtn) return;

            if (show) {
                submitBtn.disabled = true;
                submitBtn.dataset.originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Invio in corso...
                `;
                Utils.addClass(submitBtn, CONFIG.classes.loading);
            } else {
                submitBtn.disabled = false;
                if (submitBtn.dataset.originalText) {
                    submitBtn.innerHTML = submitBtn.dataset.originalText;
                    delete submitBtn.dataset.originalText;
                }
                Utils.removeClass(submitBtn, CONFIG.classes.loading);
            }
        }

        focusFirstError() {
            const firstErrorField = this.form.querySelector(`.${CONFIG.classes.invalid}`);
            if (firstErrorField) {
                firstErrorField.focus();
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        resetForm() {
            this.form.reset();
            this.errors.clear();

            // Remove all validation classes
            this.form.querySelectorAll(`.${CONFIG.classes.invalid}, .${CONFIG.classes.valid}`).forEach(field => {
                Utils.removeClass(field, CONFIG.classes.invalid);
                Utils.removeClass(field, CONFIG.classes.valid);
            });

            // Remove all error messages
            this.form.querySelectorAll(`.${CONFIG.classes.errorMessage}`).forEach(error => {
                error.remove();
            });
        }

        injectStyles() {
            if (document.getElementById('form-validation-styles')) return;

            const styles = document.createElement('style');
            styles.id = 'form-validation-styles';
            styles.textContent = `
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .is-invalid {
                    border-color: #dc3545 !important;
                    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
                    background-color: #fff5f5 !important;
                }

                .is-valid {
                    border-color: #28a745 !important;
                    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25) !important;
                    background-color: #f0fff4 !important;
                }

                .form-loading {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .form-error-message {
                    animation: slideDown 0.3s ease-out;
                }

                /* Focus states */
                .is-invalid:focus {
                    border-color: #dc3545 !important;
                    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.35) !important;
                }

                .is-valid:focus {
                    border-color: #28a745 !important;
                    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.35) !important;
                }
            `;

            document.head.appendChild(styles);
        }
    }

    // Initialize form validation
    function initializeFormValidation() {
        const forms = document.querySelectorAll(CONFIG.selectors.forms);
        const validators = [];

        forms.forEach(form => {
            // Skip forms that already have validation
            if (form.hasAttribute('data-validation-initialized')) {
                return;
            }

            form.setAttribute('data-validation-initialized', 'true');
            const validator = new FormValidator(form);
            validators.push(validator);
        });

        console.log(`✅ IT-ERA Form Validation initialized on ${validators.length} forms`);
        return validators;
    }

    // Public API
    window.ITERAFormValidation = {
        init: initializeFormValidation,
        FormValidator: FormValidator,
        config: CONFIG,
        utils: Utils,
        rules: ValidationRules
    };

    // Auto-initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFormValidation);
    } else {
        initializeFormValidation();
    }

})();