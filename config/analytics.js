/**
 * IT-ERA Analytics Configuration
 * Manages tracking codes and analytics settings
 */

const analytics = {
    // Google Analytics 4
    googleAnalytics: {
        measurementId: process.env.GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
        enabled: process.env.ENABLE_ANALYTICS === 'true' || process.env.NODE_ENV === 'production'
    },
    
    // Google Tag Manager
    googleTagManager: {
        containerId: process.env.GTM_CONTAINER_ID || 'GTM-XXXXXXX',
        enabled: process.env.ENABLE_GTM === 'true' || process.env.NODE_ENV === 'production'
    },
    
    // Facebook Pixel
    facebookPixel: {
        pixelId: process.env.FB_PIXEL_ID || 'YOUR_PIXEL_ID',
        enabled: process.env.ENABLE_FB_PIXEL === 'true' || false
    },
    
    // Microsoft Clarity
    microsoftClarity: {
        projectId: process.env.CLARITY_PROJECT_ID || 'YOUR_CLARITY_ID',
        enabled: process.env.ENABLE_CLARITY === 'true' || false
    },
    
    // Hotjar
    hotjar: {
        siteId: process.env.HOTJAR_SITE_ID || 'YOUR_HOTJAR_ID',
        enabled: process.env.ENABLE_HOTJAR === 'true' || false
    },
    
    // Cookie Consent
    cookieConsent: {
        enabled: process.env.ENABLE_COOKIE_CONSENT === 'true' || true,
        privacyPolicyUrl: '/privacy'
    }
};

/**
 * Get analytics configuration for templates
 */
function getAnalyticsConfig(env = 'production') {
    const config = { ...analytics };
    
    // Disable all analytics in development unless explicitly enabled
    if (env === 'development') {
        Object.keys(config).forEach(key => {
            if (config[key] && typeof config[key] === 'object' && 'enabled' in config[key]) {
                config[key].enabled = process.env[`ENABLE_${key.toUpperCase()}`] === 'true';
            }
        });
    }
    
    return config;
}

/**
 * Check if any analytics is enabled
 */
function isAnalyticsEnabled(env = 'production') {
    const config = getAnalyticsConfig(env);
    return Object.values(config).some(service => 
        service && typeof service === 'object' && service.enabled
    );
}

/**
 * Get tracking events configuration
 */
function getTrackingEvents() {
    return {
        // Page views
        pageView: {
            event: 'page_view',
            parameters: ['page_title', 'page_location', 'page_referrer']
        },
        
        // Contact form
        contactForm: {
            event: 'contact_form_submit',
            parameters: ['form_name', 'city', 'service_type']
        },
        
        // Phone calls
        phoneCall: {
            event: 'phone_call',
            parameters: ['phone_number', 'source_page']
        },
        
        // WhatsApp clicks
        whatsappClick: {
            event: 'whatsapp_click',
            parameters: ['source_page', 'message_type']
        },
        
        // Service inquiries
        serviceInquiry: {
            event: 'service_inquiry',
            parameters: ['service_name', 'city', 'urgency_level']
        },
        
        // City page views
        cityPageView: {
            event: 'city_page_view',
            parameters: ['city_name', 'service_type']
        }
    };
}

module.exports = {
    analytics,
    getAnalyticsConfig,
    isAnalyticsEnabled,
    getTrackingEvents
};
