/**
 * Google Analytics 4 Configuration for IT-ERA
 * HIVESTORM Task #7: Universal GA4 tracking system
 * 
 * Features:
 * - Service-specific tracking by page type
 * - Contact form conversion tracking
 * - Enhanced ecommerce for lead generation
 * - GDPR compliant cookie consent
 * - Cross-domain tracking setup
 * - Performance monitoring
 */

// GA4 Configuration
const GA4_CONFIG = {
    // Production GA4 Property ID for it-era.it
    MEASUREMENT_ID: 'G-XXXXXXXXX', // Replace with actual GA4 ID
    
    // GTM Container ID
    GTM_CONTAINER_ID: 'GTM-XXXXXXX', // Replace with actual GTM ID
    
    // Cookie settings (GDPR compliant)
    COOKIE_CONFIG: {
        cookie_flags: 'SameSite=Strict;Secure',
        cookie_expires: 63072000, // 2 years in seconds
        allow_google_signals: false, // Disabled for GDPR compliance
        allow_ad_personalization_signals: false
    },
    
    // Service categories mapping
    SERVICE_CATEGORIES: {
        'assistenza-it': {
            category: 'IT Support',
            value: 290, // €290 monthly service value
            currency: 'EUR'
        },
        'sicurezza-informatica': {
            category: 'Cybersecurity',
            value: 899, // €899 monthly service value
            currency: 'EUR'
        },
        'cloud-storage': {
            category: 'Cloud Services',
            value: 50, // €50 monthly service value
            currency: 'EUR'
        }
    },
    
    // Event tracking configuration
    EVENTS: {
        // Page view events
        PAGE_VIEW: 'page_view',
        
        // Engagement events
        PHONE_CLICK: 'phone_click',
        EMAIL_CLICK: 'email_click',
        FORM_START: 'form_start',
        FORM_SUBMIT: 'form_submit',
        CHATBOT_OPEN: 'chatbot_open',
        CHATBOT_MESSAGE: 'chatbot_message',
        
        // Service interest events
        SERVICE_VIEW: 'service_view',
        PRICING_VIEW: 'pricing_view',
        DEMO_REQUEST: 'demo_request',
        
        // Conversion events
        LEAD_GENERATED: 'generate_lead',
        CONTACT_FORM_CONVERSION: 'contact_form_conversion',
        PHONE_CONVERSION: 'phone_conversion',
        
        // Enhanced ecommerce
        SELECT_ITEM: 'select_item',
        VIEW_ITEM: 'view_item',
        ADD_TO_CART: 'add_to_cart', // Service inquiry
        PURCHASE: 'purchase' // Service signup
    },
    
    // Custom dimensions
    CUSTOM_DIMENSIONS: {
        city: 'city',
        service_type: 'service_type',
        page_category: 'page_category',
        user_type: 'user_type',
        company_size: 'company_size'
    },
    
    // Debug mode (set to false for production)
    DEBUG_MODE: false
};

/**
 * Initialize Google Analytics 4 with GTM
 */
function initializeGA4() {
    // Check if already initialized
    if (window.gtag || window.dataLayer) {
        console.warn('GA4: Already initialized');
        return;
    }
    
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // gtag helper function
    function gtag(){
        dataLayer.push(arguments);
    }
    window.gtag = gtag;
    
    // Configure GA4
    gtag('js', new Date());
    gtag('config', GA4_CONFIG.MEASUREMENT_ID, {
        // Enhanced measurement
        enhanced_measurement: true,
        
        // Cookie configuration (GDPR compliant)
        ...GA4_CONFIG.COOKIE_CONFIG,
        
        // Custom parameters
        custom_map: GA4_CONFIG.CUSTOM_DIMENSIONS,
        
        // Debug mode
        debug_mode: GA4_CONFIG.DEBUG_MODE,
        
        // Site performance tracking
        site_speed_sample_rate: 100,
        
        // Cross-domain tracking
        linker: {
            domains: ['it-era.it', 'www.it-era.it'],
            accept_incoming: true
        }
    });
    
    // Load GTM script
    const gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${GA4_CONFIG.GTM_CONTAINER_ID}`;
    document.head.appendChild(gtmScript);
    
    if (GA4_CONFIG.DEBUG_MODE) {
        console.log('GA4: Initialized with config:', GA4_CONFIG);
    }
}

/**
 * Track page view with service categorization
 */
function trackPageView() {
    const pathname = window.location.pathname;
    const serviceType = detectServiceType(pathname);
    const city = extractCityFromPath(pathname);
    
    gtag('event', GA4_CONFIG.EVENTS.PAGE_VIEW, {
        page_title: document.title,
        page_location: window.location.href,
        [GA4_CONFIG.CUSTOM_DIMENSIONS.service_type]: serviceType,
        [GA4_CONFIG.CUSTOM_DIMENSIONS.city]: city,
        [GA4_CONFIG.CUSTOM_DIMENSIONS.page_category]: getPageCategory(pathname)
    });
    
    if (GA4_CONFIG.DEBUG_MODE) {
        console.log('GA4: Page view tracked', { serviceType, city, pathname });
    }
}

/**
 * Track service view with enhanced ecommerce
 */
function trackServiceView(serviceType, city) {
    const serviceConfig = GA4_CONFIG.SERVICE_CATEGORIES[serviceType];
    if (!serviceConfig) return;
    
    gtag('event', GA4_CONFIG.EVENTS.VIEW_ITEM, {
        currency: serviceConfig.currency,
        value: serviceConfig.value,
        items: [{
            item_id: `${serviceType}-${city}`,
            item_name: `${serviceConfig.category} - ${city}`,
            item_category: serviceConfig.category,
            price: serviceConfig.value,
            quantity: 1
        }],
        [GA4_CONFIG.CUSTOM_DIMENSIONS.service_type]: serviceType,
        [GA4_CONFIG.CUSTOM_DIMENSIONS.city]: city
    });
}

/**
 * Track contact form events
 */
function trackFormEvent(eventType, formData = {}) {
    const serviceType = detectServiceType(window.location.pathname);
    const city = extractCityFromPath(window.location.pathname);
    
    const eventData = {
        [GA4_CONFIG.CUSTOM_DIMENSIONS.service_type]: serviceType,
        [GA4_CONFIG.CUSTOM_DIMENSIONS.city]: city,
        form_type: formData.formType || 'contact',
        ...formData
    };
    
    if (eventType === 'form_submit') {
        // Track as conversion
        gtag('event', GA4_CONFIG.EVENTS.LEAD_GENERATED, {
            currency: GA4_CONFIG.SERVICE_CATEGORIES[serviceType]?.currency || 'EUR',
            value: GA4_CONFIG.SERVICE_CATEGORIES[serviceType]?.value || 0,
            ...eventData
        });
    }
    
    gtag('event', eventType, eventData);
    
    if (GA4_CONFIG.DEBUG_MODE) {
        console.log('GA4: Form event tracked', { eventType, eventData });
    }
}

/**
 * Track phone clicks as conversion
 */
function trackPhoneClick(phoneNumber) {
    const serviceType = detectServiceType(window.location.pathname);
    const city = extractCityFromPath(window.location.pathname);
    
    gtag('event', GA4_CONFIG.EVENTS.PHONE_CLICK, {
        phone_number: phoneNumber,
        [GA4_CONFIG.CUSTOM_DIMENSIONS.service_type]: serviceType,
        [GA4_CONFIG.CUSTOM_DIMENSIONS.city]: city
    });
    
    // Track as conversion
    gtag('event', GA4_CONFIG.EVENTS.PHONE_CONVERSION, {
        currency: GA4_CONFIG.SERVICE_CATEGORIES[serviceType]?.currency || 'EUR',
        value: GA4_CONFIG.SERVICE_CATEGORIES[serviceType]?.value || 0,
        conversion_type: 'phone_call'
    });
    
    if (GA4_CONFIG.DEBUG_MODE) {
        console.log('GA4: Phone click tracked', { phoneNumber, serviceType, city });
    }
}

/**
 * Track email clicks
 */
function trackEmailClick(email) {
    const serviceType = detectServiceType(window.location.pathname);
    const city = extractCityFromPath(window.location.pathname);
    
    gtag('event', GA4_CONFIG.EVENTS.EMAIL_CLICK, {
        email_address: email,
        [GA4_CONFIG.CUSTOM_DIMENSIONS.service_type]: serviceType,
        [GA4_CONFIG.CUSTOM_DIMENSIONS.city]: city
    });
    
    if (GA4_CONFIG.DEBUG_MODE) {
        console.log('GA4: Email click tracked', { email, serviceType, city });
    }
}

/**
 * Track chatbot interactions
 */
function trackChatbotEvent(eventType, message = '') {
    const serviceType = detectServiceType(window.location.pathname);
    const city = extractCityFromPath(window.location.pathname);
    
    gtag('event', eventType, {
        [GA4_CONFIG.CUSTOM_DIMENSIONS.service_type]: serviceType,
        [GA4_CONFIG.CUSTOM_DIMENSIONS.city]: city,
        message_length: message.length
    });
    
    if (GA4_CONFIG.DEBUG_MODE) {
        console.log('GA4: Chatbot event tracked', { eventType, serviceType, city });
    }
}

/**
 * Utility functions
 */
function detectServiceType(pathname) {
    if (pathname.includes('assistenza-it')) return 'assistenza-it';
    if (pathname.includes('sicurezza-informatica')) return 'sicurezza-informatica';
    if (pathname.includes('cloud-storage')) return 'cloud-storage';
    return 'general';
}

function extractCityFromPath(pathname) {
    // Extract city from URLs like /pages/assistenza-it-milano.html
    const match = pathname.match(/\/(?:assistenza-it|sicurezza-informatica|cloud-storage)-(.+?)\.html/);
    return match ? match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
}

function getPageCategory(pathname) {
    if (pathname.includes('/pages/')) return 'service_page';
    if (pathname === '/' || pathname === '/index.html') return 'homepage';
    return 'other';
}

/**
 * Enhanced ecommerce tracking for service inquiries
 */
function trackServiceInquiry(serviceType, city, formData) {
    const serviceConfig = GA4_CONFIG.SERVICE_CATEGORIES[serviceType];
    if (!serviceConfig) return;
    
    // Track as "add to cart" (service inquiry)
    gtag('event', GA4_CONFIG.EVENTS.ADD_TO_CART, {
        currency: serviceConfig.currency,
        value: serviceConfig.value,
        items: [{
            item_id: `${serviceType}-${city}`,
            item_name: `${serviceConfig.category} - ${city}`,
            item_category: serviceConfig.category,
            price: serviceConfig.value,
            quantity: 1
        }],
        ...formData
    });
}

/**
 * GDPR Compliance functions
 */
function isConsentGiven() {
    // Check if user has given consent (integrate with your consent management)
    return localStorage.getItem('ga_consent') === 'granted';
}

function grantConsent() {
    localStorage.setItem('ga_consent', 'granted');
    gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied' // Always denied for GDPR compliance
    });
}

function denyConsent() {
    localStorage.setItem('ga_consent', 'denied');
    gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied'
    });
}

// Export for use in templates
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GA4_CONFIG,
        initializeGA4,
        trackPageView,
        trackServiceView,
        trackFormEvent,
        trackPhoneClick,
        trackEmailClick,
        trackChatbotEvent,
        trackServiceInquiry,
        isConsentGiven,
        grantConsent,
        denyConsent
    };
} else {
    // Browser environment
    window.GA4_TRACKING = {
        initializeGA4,
        trackPageView,
        trackServiceView,
        trackFormEvent,
        trackPhoneClick,
        trackEmailClick,
        trackChatbotEvent,
        trackServiceInquiry,
        isConsentGiven,
        grantConsent,
        denyConsent
    };
}