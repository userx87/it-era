/* IT-ERA Assistenza Informatica - Modular JavaScript */
/* =================================================== */

document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            
            // Update aria-expanded
            const isExpanded = !mobileMenu.classList.contains('hidden');
            mobileMenuBtn.setAttribute('aria-expanded', isExpanded);
            
            // Change icon
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.className = isExpanded ? 'fas fa-times text-xl' : 'fas fa-bars text-xl';
            }
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar scroll effect
    let lastScrollY = window.scrollY;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });

    // Form submission function
    async function submitForm(data, submitBtn, originalText, form) {
        try {
            const response = await fetch('https://it-era-resend.bulltech.workers.dev/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    formType: 'preventivo-assistenza-informatica',
                    pagina: 'Assistenza Informatica Lombardia',
                    pageUrl: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();

            if (result.success) {
                // Track successful form submission
                trackInteraction('form_submit', 'preventivo-gratuito-success');

                // Show success message
                showFormMessage('✅ <strong>Richiesta inviata con successo!</strong><br>Ti contatteremo entro 24 ore lavorative.', 'success');

                // Reset form
                form.reset();

                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });

            } else {
                throw new Error(result.error || 'Errore durante l\'invio');
            }

        } catch (error) {
            console.error('Form submission error:', error);

            // Track failed form submission
            trackInteraction('form_submit', 'preventivo-gratuito-error');

            // Show error message
            showFormMessage('❌ <strong>Errore durante l\'invio.</strong><br>Riprova o chiamaci al 039 888 2041.', 'error');

        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Show form message function
    function showFormMessage(message, type) {
        // Get local message container
        const messageContainer = document.getElementById('form-messages');
        if (!messageContainer) return;

        // Set message content and styling
        messageContainer.className = `p-4 rounded-lg mb-6 ${
            type === 'success'
                ? 'bg-green-100/20 border border-green-400/30 text-green-100'
                : 'bg-red-100/20 border border-red-400/30 text-red-100'
        }`;
        messageContainer.innerHTML = message;
        messageContainer.classList.remove('hidden');

        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                messageContainer.classList.add('hidden');
            }, 5000);
        }
    }

    // Form handling
    const preventivoForm = document.getElementById('preventivo-form');
    if (preventivoForm) {
        preventivoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Validate required fields
            const requiredFields = ['nome', 'email', 'telefono', 'privacy'];
            let isValid = true;
            
            requiredFields.forEach(field => {
                const input = this.querySelector(`[name="${field}"]`);
                if (!data[field] || (field === 'privacy' && !input.checked)) {
                    isValid = false;
                    input.classList.add('border-red-500');
                    
                    // Remove error class after user interaction
                    input.addEventListener('input', function() {
                        this.classList.remove('border-red-500');
                    });
                    input.addEventListener('change', function() {
                        this.classList.remove('border-red-500');
                    });
                } else {
                    input.classList.remove('border-red-500');
                }
            });
            
            if (!isValid) {
                showFormMessage('❌ <strong>Campi obbligatori mancanti</strong><br>Compila tutti i campi contrassegnati con *', 'error');
                return;
            }

            // Hide any previous messages
            const messageContainer = document.getElementById('form-messages');
            if (messageContainer) {
                messageContainer.classList.add('hidden');
            }
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Invio in corso...';
            submitBtn.disabled = true;
            
            // Submit form to Resend API
            submitForm(data, submitBtn, originalText, this);
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for fade-in animation
    document.querySelectorAll('.problem-card, .pricing-card, .sector-card, .testimonial-card').forEach(el => {
        fadeObserver.observe(el);
    });

    // Enhanced analytics tracking
    function trackInteraction(action, label, value = null) {
        if (typeof gtag !== 'undefined') {
            const eventData = {
                event_category: 'engagement',
                event_label: label,
                page_location: window.location.href
            };
            
            if (value) {
                eventData.value = value;
            }
            
            gtag('event', action, eventData);
        }
        
        // Console log for debugging
        console.log('Analytics Event:', action, label, value);
    }

    // Track phone calls
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        link.addEventListener('click', function() {
            const phoneNumber = this.getAttribute('href').replace('tel:', '');
            trackInteraction('phone_call', 'click', phoneNumber);
        });
    });

    // Track email clicks
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.addEventListener('click', function() {
            const email = this.getAttribute('href').replace('mailto:', '');
            trackInteraction('email_click', 'click', email);
        });
    });

    // Track external links
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
            link.addEventListener('click', function() {
                trackInteraction('external_link', this.href);
            });
        }
    });

    // Track scroll depth
    let maxScroll = 0;
    const scrollMilestones = [25, 50, 75, 90, 100];
    
    window.addEventListener('scroll', function() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            
            // Track milestone reached
            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && maxScroll < milestone + 5) {
                    trackInteraction('scroll_depth', `${milestone}%`);
                }
            });
        }
    });

    // Track time on page
    let startTime = Date.now();
    let timeTracked = false;
    
    // Track after 30 seconds
    setTimeout(() => {
        if (!timeTracked) {
            trackInteraction('time_on_page', '30_seconds');
            timeTracked = true;
        }
    }, 30000);
    
    // Track on page unload
    window.addEventListener('beforeunload', function() {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        trackInteraction('time_on_page', `${timeOnPage}_seconds_total`);
    });

    // Track CTA clicks
    document.querySelectorAll('[data-cta]').forEach(element => {
        element.addEventListener('click', function() {
            const ctaName = this.getAttribute('data-cta');
            trackInteraction('cta_click', ctaName);
        });
    });

    // Lazy loading for images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Keyboard navigation improvements
    document.addEventListener('keydown', function(e) {
        // Escape key closes mobile menu
        if (e.key === 'Escape' && mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.focus();
        }
    });

    // Focus management for dropdown menus
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const trigger = dropdown.querySelector('[data-bs-toggle="dropdown"]');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (trigger && menu) {
            trigger.addEventListener('keydown', function(e) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    menu.classList.add('show');
                    const firstLink = menu.querySelector('a');
                    if (firstLink) firstLink.focus();
                }
            });
        }
    });

    // Console branding
    console.log('%cIT-ERA Assistenza Informatica', 'color: #1e40af; font-size: 24px; font-weight: bold;');
    console.log('%cTemplate professionale ottimizzato per conversioni', 'color: #666; font-size: 14px;');
    console.log('%cVersione: 2.0.0 | Sviluppato con ❤️ per IT-ERA', 'color: #059669; font-size: 12px;');

    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                
                if (loadTime > 0) {
                    trackInteraction('page_load_time', Math.round(loadTime) + 'ms');
                }
            }, 0);
        });
    }

});

// Export functions for external use
window.ITERA = window.ITERA || {};
window.ITERA.assistenzaInformatica = {
    version: '2.0.0',
    initialized: true,
    trackInteraction: function(action, label, value) {
        // Public method to track custom interactions
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: 'engagement',
                event_label: label,
                value: value
            });
        }
    }
};
