/*!
 * IT-ERA Analytics & Tracking System
 * Centralized analytics and tracking functionality
 */

// ============================================
// GOOGLE ANALYTICS 4 CONFIGURATION
// ============================================

// Initialize Google Analytics 4
function initializeGA4() {
    // Load Google Analytics 4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    
    // Configure GA4
    gtag('config', 'GA_MEASUREMENT_ID', {
        'page_title': document.title,
        'page_location': window.location.href,
        'content_group1': getPageCategory()
    });

    console.log('📊 Google Analytics 4 initialized');
}

// ============================================
// PAGE TRACKING FUNCTIONS
// ============================================

// Get page category for analytics
function getPageCategory() {
    const path = window.location.pathname;
    
    if (path === '/' || path === '/index.html') return 'Homepage';
    if (path.includes('/servizi')) return 'Servizi';
    if (path.includes('/contatti')) return 'Contatti';
    if (path.includes('/settori')) return 'Settori';
    if (path.includes('/chi-siamo')) return 'Chi Siamo';
    
    return 'Other';
}

// Track page view
function trackPageView(pageName = null) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            'page_title': pageName || document.title,
            'page_location': window.location.href,
            'page_category': getPageCategory()
        });
        
        console.log('📊 Page view tracked:', pageName || document.title);
    }
}

// ============================================
// USER INTERACTION TRACKING
// ============================================

// Track button clicks
function trackButtonClick(buttonText, buttonType = 'generic') {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'button_click', {
            'button_text': buttonText,
            'button_type': buttonType,
            'page_location': window.location.href
        });
        
        console.log('🎯 Button click tracked:', buttonText);
    }
}

// Track phone calls
function trackPhoneCall(phoneNumber) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'phone_call', {
            'phone_number': phoneNumber,
            'page_location': window.location.href,
            'event_category': 'contact'
        });
        
        console.log('📞 Phone call tracked:', phoneNumber);
    }
}

// Track form submissions
function trackFormSubmission(formName, formType = 'contact') {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submit', {
            'form_name': formName,
            'form_type': formType,
            'page_location': window.location.href,
            'event_category': 'lead_generation'
        });
        
        console.log('📝 Form submission tracked:', formName);
    }
}

// Track service interest
function trackServiceInterest(serviceName, action = 'view') {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'service_interest', {
            'service_name': serviceName,
            'action': action,
            'page_location': window.location.href,
            'event_category': 'services'
        });
        
        console.log('🔧 Service interest tracked:', serviceName, action);
    }
}

// ============================================
// PERFORMANCE TRACKING
// ============================================

// Track page performance
function trackPagePerformance() {
    window.addEventListener('load', function() {
        if ('performance' in window) {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
            
            // Log performance metrics
            console.log('📊 Page Performance:', {
                loadTime: loadTime + 'ms',
                domContentLoaded: domContentLoaded + 'ms',
                firstPaint: performance.getEntriesByType('paint')[0]?.startTime + 'ms'
            });
            
            // Track to analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_performance', {
                    'page_load_time': Math.round(loadTime),
                    'dom_content_loaded': Math.round(domContentLoaded),
                    'page_title': document.title,
                    'page_location': window.location.href
                });
            }
        }
    });
}

// Track scroll depth
function trackScrollDepth() {
    let maxScroll = 0;
    const scrollThresholds = [25, 50, 75, 90, 100];
    
    window.addEventListener('scroll', function() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        scrollThresholds.forEach(threshold => {
            if (scrollPercent >= threshold && maxScroll < threshold) {
                maxScroll = threshold;
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'scroll_depth', {
                        'scroll_percentage': threshold,
                        'page_location': window.location.href,
                        'event_category': 'engagement'
                    });
                }
                
                console.log('📊 Scroll depth:', threshold + '%');
            }
        });
    });
}

// ============================================
// CHATBOT TRACKING
// ============================================

// Track chatbot interactions
function trackChatbotInteraction(action, details = null) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'chatbot_interaction', {
            'action': action,
            'details': details,
            'page_location': window.location.href,
            'event_category': 'engagement'
        });
        
        console.log('🤖 Chatbot interaction tracked:', action, details);
    }
}

// ============================================
// ERROR TRACKING
// ============================================

// Track JavaScript errors
function trackJavaScriptErrors() {
    window.addEventListener('error', function(event) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'javascript_error', {
                'error_message': event.message,
                'error_filename': event.filename,
                'error_line': event.lineno,
                'page_location': window.location.href,
                'event_category': 'technical'
            });
        }
        
        console.error('❌ JavaScript error tracked:', event.message);
    });
}

// ============================================
// AUTO-TRACKING SETUP
// ============================================

// Automatically track common interactions
function setupAutoTracking() {
    // Track all button clicks
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // Track button clicks
        if (target.matches('.btn, .btn-primary, .btn-secondary, button')) {
            const buttonText = target.textContent.trim();
            const buttonType = target.className.includes('btn-primary') ? 'primary' : 
                              target.className.includes('btn-secondary') ? 'secondary' : 'generic';
            trackButtonClick(buttonText, buttonType);
        }
        
        // Track phone number clicks
        if (target.matches('a[href^="tel:"]')) {
            const phoneNumber = target.getAttribute('href').replace('tel:', '');
            trackPhoneCall(phoneNumber);
        }
        
        // Track service card clicks
        if (target.closest('.card-service, .service-card')) {
            const serviceCard = target.closest('.card-service, .service-card');
            const serviceName = serviceCard.querySelector('h2, h3, .service-title')?.textContent.trim();
            if (serviceName) {
                trackServiceInterest(serviceName, 'card_click');
            }
        }
        
        // Track chatbot interactions
        if (target.matches('#chatbot-button')) {
            trackChatbotInteraction('open');
        }
        
        if (target.matches('#chatbot-close')) {
            trackChatbotInteraction('close');
        }
    });
    
    // Track form submissions
    document.addEventListener('submit', function(event) {
        const form = event.target;
        const formName = form.getAttribute('name') || form.getAttribute('id') || 'unnamed_form';
        const formType = form.getAttribute('data-form-type') || 'contact';
        
        trackFormSubmission(formName, formType);
    });
    
    console.log('🎯 Auto-tracking setup completed');
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize analytics system
function initializeAnalytics() {
    // Initialize GA4 (uncomment when ready to use)
    // initializeGA4();
    
    // Setup performance tracking
    trackPagePerformance();
    
    // Setup scroll depth tracking
    trackScrollDepth();
    
    // Setup error tracking
    trackJavaScriptErrors();
    
    // Setup auto-tracking
    setupAutoTracking();
    
    console.log('📊 IT-ERA Analytics System initialized');
}

// ============================================
// EXPORT FUNCTIONS FOR MANUAL USE
// ============================================

// Make functions available globally
window.ITERAAnalytics = {
    trackPageView,
    trackButtonClick,
    trackPhoneCall,
    trackFormSubmission,
    trackServiceInterest,
    trackChatbotInteraction,
    initializeGA4
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAnalytics);
