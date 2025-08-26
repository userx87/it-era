/**
 * IT-ERA Universal Google Analytics 4 Tracking Script
 * HIVESTORM Task #7: Deploy GA4 tracking to all 1,427 pages
 * 
 * This script provides comprehensive tracking for:
 * - Page views with service categorization
 * - Contact form conversions
 * - Phone and email click tracking
 * - Chatbot interactions
 * - Enhanced ecommerce for service inquiries
 * - GDPR compliant cookie consent
 */

(function() {
    'use strict';
    
    // Configuration - Update these IDs for production
    const CONFIG = {
        GA4_ID: 'G-XXXXXXXXX', // Replace with actual GA4 Measurement ID
        GTM_ID: 'GTM-XXXXXXX',  // Replace with actual GTM Container ID
        DEBUG: false // Set to true for development
    };
    
    // Service type detection and value mapping
    const SERVICE_VALUES = {
        'assistenza-it': { value: 290, category: 'IT Support' },
        'sicurezza-informatica': { value: 899, category: 'Cybersecurity' },
        'cloud-storage': { value: 50, category: 'Cloud Services' }
    };
    
    // Initialize tracking when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        // Check GDPR consent first
        if (!checkGDPRConsent()) {
            showConsentBanner();
            return;
        }
        
        initializeGA4();
        setupEventListeners();
        trackInitialPageView();
        
        if (CONFIG.DEBUG) {
            console.log('IT-ERA Analytics: Initialized successfully');
        }
    }
    
    /**
     * Initialize Google Analytics 4 with GTM
     */
    function initializeGA4() {
        // Prevent double initialization
        if (window.gtag) return;
        
        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        
        function gtag(){
            dataLayer.push(arguments);
        }
        window.gtag = gtag;
        
        // Configure consent mode for GDPR
        gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied', // Always deny ads for GDPR compliance
            functionality_storage: 'granted',
            personalization_storage: 'denied',
            security_storage: 'granted'
        });
        
        gtag('js', new Date());
        
        // Load GTM
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${CONFIG.GTM_ID}`;
        document.head.appendChild(script);
        
        // Configure GA4
        gtag('config', CONFIG.GA4_ID, {
            cookie_flags: 'SameSite=Strict;Secure',
            enhanced_measurement: true,
            allow_google_signals: false, // GDPR compliance
            allow_ad_personalization_signals: false,
            linker: {
                domains: ['it-era.it', 'www.it-era.it']
            },
            custom_map: {
                'custom_dimension_1': 'service_type',
                'custom_dimension_2': 'city',
                'custom_dimension_3': 'page_category'
            }
        });
        
        if (CONFIG.DEBUG) {
            console.log('GA4 initialized with ID:', CONFIG.GA4_ID);
        }
    }
    
    /**
     * Track initial page view with enhanced data
     */
    function trackInitialPageView() {
        const pageData = getPageData();
        
        gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            service_type: pageData.serviceType,
            city: pageData.city,
            page_category: pageData.category
        });
        
        // If it's a service page, track service view
        if (pageData.serviceType !== 'general') {
            trackServiceView(pageData.serviceType, pageData.city);
        }
        
        if (CONFIG.DEBUG) {
            console.log('Page view tracked:', pageData);
        }
    }
    
    /**
     * Set up event listeners for tracking
     */
    function setupEventListeners() {
        // Track phone clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href^="tel:"]');
            if (link) {
                const phone = link.href.replace('tel:', '');
                trackPhoneClick(phone);
            }
        });
        
        // Track email clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href^="mailto:"]');
            if (link) {
                const email = link.href.replace('mailto:', '');
                trackEmailClick(email);
            }
        });
        
        // Track contact forms
        const forms = document.querySelectorAll('form[id*="contact"], form[data-form-type]');
        forms.forEach(form => {
            // Track form start
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', function() {
                    if (!form.dataset.started) {
                        form.dataset.started = 'true';
                        trackFormEvent('form_start', { form_id: form.id });
                    }
                });
            });
            
            // Track form submission
            form.addEventListener('submit', function(e) {
                const formData = new FormData(form);
                const data = {};
                for (let [key, value] of formData.entries()) {
                    data[key] = value;
                }
                
                trackFormSubmission(data, form);
            });
        });
        
        // Track chatbot events (if chatbot exists)
        if (window.ITERAChatbot) {
            // Override chatbot tracking functions
            const originalTrackEvent = window.ITERAChatbot.trackEvent || function(){};
            window.ITERAChatbot.trackEvent = function(eventName, properties) {
                trackChatbotEvent(eventName, properties);
                originalTrackEvent.call(this, eventName, properties);
            };
        }
        
        // Track scroll depth
        let maxScroll = 0;
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
                if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
                    maxScroll = scrollPercent;
                    gtag('event', 'scroll', {
                        scroll_depth: scrollPercent
                    });
                }
            }, 100);
        });
    }
    
    /**
     * Track service view with enhanced ecommerce
     */
    function trackServiceView(serviceType, city) {
        const serviceConfig = SERVICE_VALUES[serviceType];
        if (!serviceConfig) return;
        
        gtag('event', 'view_item', {
            currency: 'EUR',
            value: serviceConfig.value,
            items: [{
                item_id: `${serviceType}-${city}`,
                item_name: `${serviceConfig.category} - ${city}`,
                item_category: serviceConfig.category,
                price: serviceConfig.value,
                quantity: 1
            }]
        });
    }
    
    /**
     * Track phone click as conversion
     */
    function trackPhoneClick(phone) {
        const pageData = getPageData();
        
        gtag('event', 'phone_click', {
            phone_number: phone,
            service_type: pageData.serviceType,
            city: pageData.city
        });
        
        // Track as conversion
        const serviceConfig = SERVICE_VALUES[pageData.serviceType];
        if (serviceConfig) {
            gtag('event', 'generate_lead', {
                currency: 'EUR',
                value: serviceConfig.value,
                lead_type: 'phone_call',
                service_type: pageData.serviceType,
                city: pageData.city
            });
        }
        
        if (CONFIG.DEBUG) {
            console.log('Phone click tracked:', phone);
        }
    }
    
    /**
     * Track email click
     */
    function trackEmailClick(email) {
        const pageData = getPageData();
        
        gtag('event', 'email_click', {
            email_address: email,
            service_type: pageData.serviceType,
            city: pageData.city
        });
        
        if (CONFIG.DEBUG) {
            console.log('Email click tracked:', email);
        }
    }
    
    /**
     * Track form events
     */
    function trackFormEvent(eventType, data = {}) {
        const pageData = getPageData();
        
        gtag('event', eventType, {
            ...data,
            service_type: pageData.serviceType,
            city: pageData.city
        });
    }
    
    /**
     * Track form submission as conversion
     */
    function trackFormSubmission(formData, form) {
        const pageData = getPageData();
        const serviceConfig = SERVICE_VALUES[pageData.serviceType];
        
        // Track form submission
        trackFormEvent('form_submit', {
            form_id: form.id,
            form_type: form.dataset.formType || 'contact'
        });
        
        // Track as lead generation (conversion)
        gtag('event', 'generate_lead', {
            currency: 'EUR',
            value: serviceConfig ? serviceConfig.value : 100,
            lead_type: 'contact_form',
            service_type: pageData.serviceType,
            city: pageData.city,
            company_name: formData.azienda || '',
            urgency: formData.urgenza || 'normale'
        });
        
        // Enhanced ecommerce - track as "purchase"
        if (serviceConfig) {
            gtag('event', 'purchase', {
                transaction_id: `lead-${Date.now()}`,
                currency: 'EUR',
                value: serviceConfig.value,
                items: [{
                    item_id: `${pageData.serviceType}-${pageData.city}`,
                    item_name: `${serviceConfig.category} Lead - ${pageData.city}`,
                    item_category: serviceConfig.category,
                    price: serviceConfig.value,
                    quantity: 1
                }]
            });
        }
        
        if (CONFIG.DEBUG) {
            console.log('Form submission tracked:', { pageData, formData });
        }
    }
    
    /**
     * Track chatbot interactions
     */
    function trackChatbotEvent(eventName, properties = {}) {
        const pageData = getPageData();
        
        gtag('event', `chatbot_${eventName}`, {
            ...properties,
            service_type: pageData.serviceType,
            city: pageData.city
        });
        
        if (CONFIG.DEBUG) {
            console.log('Chatbot event tracked:', eventName, properties);
        }
    }
    
    /**
     * Get page data for tracking
     */
    function getPageData() {
        const pathname = window.location.pathname;
        let serviceType = 'general';
        let city = 'Unknown';
        let category = 'other';
        
        // Detect service type
        if (pathname.includes('assistenza-it')) serviceType = 'assistenza-it';
        else if (pathname.includes('sicurezza-informatica')) serviceType = 'sicurezza-informatica';
        else if (pathname.includes('cloud-storage')) serviceType = 'cloud-storage';
        
        // Extract city from URL
        const cityMatch = pathname.match(/-([\w-]+)\.html$/);
        if (cityMatch) {
            city = cityMatch[1].split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
        
        // Determine page category
        if (pathname.includes('/pages/')) category = 'service_page';
        else if (pathname === '/' || pathname === '/index.html') category = 'homepage';
        
        return { serviceType, city, category };
    }
    
    /**
     * GDPR Consent Management
     */
    function checkGDPRConsent() {
        const consent = localStorage.getItem('ga_consent');
        return consent === 'granted';
    }
    
    function showConsentBanner() {
        // Simple consent banner (you can customize this)
        const banner = document.createElement('div');
        banner.id = 'gdpr-consent-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1a1a1a;
            color: white;
            padding: 15px 20px;
            z-index: 9999;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        `;
        
        banner.innerHTML = `
            <p style="margin: 0 0 10px 0;">
                Utilizziamo i cookie per migliorare la tua esperienza. I dati sono trattati nel rispetto del GDPR.
            </p>
            <button onclick="acceptConsent()" style="background: #0066cc; color: white; border: none; padding: 8px 16px; margin: 0 5px; border-radius: 4px; cursor: pointer;">
                Accetta
            </button>
            <button onclick="rejectConsent()" style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; margin: 0 5px; border-radius: 4px; cursor: pointer;">
                Rifiuta
            </button>
        `;
        
        document.body.appendChild(banner);
        
        // Global functions for banner
        window.acceptConsent = function() {
            localStorage.setItem('ga_consent', 'granted');
            banner.remove();
            init();
        };
        
        window.rejectConsent = function() {
            localStorage.setItem('ga_consent', 'denied');
            banner.remove();
            // Don't initialize tracking
        };
    }
    
    /**
     * Public API for manual event tracking
     */
    window.IT_ERA_TRACKING = {
        trackEvent: function(eventName, parameters = {}) {
            if (window.gtag) {
                gtag('event', eventName, parameters);
            }
        },
        
        trackConversion: function(value, currency = 'EUR') {
            if (window.gtag) {
                gtag('event', 'conversion', {
                    currency: currency,
                    value: value
                });
            }
        },
        
        trackServiceInquiry: function(serviceType, city) {
            trackServiceView(serviceType, city);
        }
    };
    
})();