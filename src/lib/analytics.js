/**
 * IT-ERA Analytics - Minimal GA4 Loader
 * Conditional loading only in production with valid GA_MEASUREMENT_ID
 * @version 1.0.0
 */

// Production environment detection
const isProduction = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location?.hostname;
  return hostname === 'it-era.it' || hostname === 'www.it-era.it';
};

// Environment variable detection (Vite/Webpack/etc.)
const getGAId = () => {
  // Check multiple possible env variable names
  if (typeof import !== 'undefined' && import.meta?.env) {
    return import.meta.env.VITE_GA_MEASUREMENT_ID || 
           import.meta.env.GA_MEASUREMENT_ID ||
           import.meta.env.GOOGLE_ANALYTICS_ID;
  }
  
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_GA_MEASUREMENT_ID || 
           process.env.GA_MEASUREMENT_ID ||
           process.env.GOOGLE_ANALYTICS_ID;
  }
  
  // Fallback to hardcoded for IT-ERA production
  if (isProduction()) {
    return 'G-T5VWN9EH21';
  }
  
  return null;
};

/**
 * Inject Google Tag (gtag) script conditionally
 * Only loads in production environment with valid GA ID
 * @param {string} id - GA4 Measurement ID (optional, auto-detected)
 */
export function injectGtag(id) {
  // Skip if not browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.log('[Analytics] Skipping: Not browser environment');
    return;
  }
  
  // Skip if script already loaded
  if (document.getElementById('ga-script')) {
    console.log('[Analytics] GA4 already loaded');
    return;
  }
  
  // Get GA ID (parameter or auto-detect)
  const gaId = id || getGAId();
  
  // Skip if no valid GA ID
  if (!gaId) {
    console.log('[Analytics] Skipping: No GA4 ID found');
    return;
  }
  
  // Skip in development (unless forced)
  if (!isProduction() && !window.FORCE_ANALYTICS) {
    console.log('[Analytics] Skipping: Development environment');
    return;
  }
  
  try {
    // Create and inject script
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
    
    // Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    
    // Configure GA4
    gtag('js', new Date());
    gtag('config', gaId, {
      anonymize_ip: true,
      allow_google_signals: false,
      send_page_view: true
    });
    
    console.log(`[Analytics] GA4 loaded: ${gaId}`);
    
    // Track initial page view
    gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href
    });
    
  } catch (error) {
    console.error('[Analytics] Error loading GA4:', error);
  }
}

/**
 * Track custom events (if GA4 is loaded)
 * @param {string} eventName - Event name
 * @param {object} parameters - Event parameters
 */
export function trackEvent(eventName, parameters = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
}

/**
 * Track page views (for SPA navigation)
 * @param {string} pageTitle - Page title
 * @param {string} pageLocation - Page URL
 */
export function trackPageView(pageTitle, pageLocation) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', getGAId(), {
      page_title: pageTitle,
      page_location: pageLocation
    });
  }
}

// Auto-initialize on script load (optional)
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectGtag();
  });
} else if (typeof window !== 'undefined') {
  // DOM already loaded
  setTimeout(injectGtag, 100);
}