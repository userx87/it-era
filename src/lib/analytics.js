/**
 * IT-ERA Analytics Library
 * Conditional GA4 injection for production environments
 */

export function injectGtag(id) {
  if (typeof window === 'undefined' || !id) return;
  if (document.getElementById('ga-script')) return;
  
  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', id, {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
    custom_map: {
      'custom_parameter_1': 'service_type',
      'custom_parameter_2': 'city_target'
    }
  });
}

export function trackEvent(eventName, parameters = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: parameters.category || 'engagement',
      event_label: parameters.label || '',
      value: parameters.value || 1,
      custom_parameter_1: parameters.service_type || '',
      custom_parameter_2: parameters.city_target || '',
      ...parameters
    });
  }
}

export function trackConversion(conversionId, conversionLabel, value = 1) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${conversionId}/${conversionLabel}`,
      value: value,
      currency: 'EUR'
    });
  }
}

// Initialize analytics for IT-ERA production
export function initITERAAnalytics() {
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'it-era.it' || 
       window.location.hostname.includes('it-era'))) {
    injectGtag('G-T5VWN9EH21');
    
    // Track page view with city context
    const cityMatch = window.location.pathname.match(/\/([^\/]+)\/[^\/]+$/);
    const city = cityMatch ? cityMatch[1] : '';
    
    trackEvent('page_view', {
      page_title: document.title,
      page_location: window.location.href,
      city_target: city,
      service_type: getServiceTypeFromPath(window.location.pathname)
    });
  }
}

function getServiceTypeFromPath(pathname) {
  if (pathname.includes('assistenza-it')) return 'assistenza-it';
  if (pathname.includes('sicurezza-informatica')) return 'sicurezza-informatica';
  if (pathname.includes('cloud-storage')) return 'cloud-storage';
  if (pathname.includes('commercialisti')) return 'settore-commercialisti';
  if (pathname.includes('studi-legali')) return 'settore-legali';
  if (pathname.includes('medici')) return 'settore-medici';
  if (pathname.includes('pmi')) return 'settore-pmi';
  return 'generic';
}