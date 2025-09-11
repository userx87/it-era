/**
 * IT-ERA A/B Test Configurations
 * Defines test variants and their implementations
 * Part of the Hive Mind Performance Optimization Strategy
 */

// CTA Button Color Test Configuration
const ctaButtonTest = {
  id: 'cta_button_test',
  name: 'CTA Button Color Test',
  variants: {
    control: {
      name: 'Blue Button (Control)',
      css: `
        .btn-primary {
          background-color: #0056cc !important;
          border-color: #0056cc !important;
        }
        .btn-primary:hover {
          background-color: #0041a3 !important;
          border-color: #0041a3 !important;
        }
      `
    },
    green: {
      name: 'Green Button (Test)',
      css: `
        .btn-primary {
          background-color: #00b336 !important;
          border-color: #00b336 !important;
        }
        .btn-primary:hover {
          background-color: #009428 !important;
          border-color: #009428 !important;
        }
      `
    }
  }
};

// Hero Section Headline Test Configuration
const heroSectionTest = {
  id: 'hero_section_test',
  name: 'Hero Section Headline Test',
  variants: {
    control: {
      name: 'Original Headline',
      content: {
        'h1.hero-title': {
          text: 'Assistenza IT e Sicurezza Informatica per Aziende in Lombardia'
        },
        '.hero-subtitle': {
          text: 'Il partner tecnologico di fiducia per PMI in Lombardia. Assistenza IT 24/7, Cloud Storage, Cybersecurity, VoIP.'
        }
      }
    },
    benefit_focused: {
      name: 'Benefit-Focused Headline',
      content: {
        'h1.hero-title': {
          text: 'Riduci i Costi IT del 40% e Aumenta la Produttività Aziendale'
        },
        '.hero-subtitle': {
          text: 'Soluzioni IT complete per PMI: assistenza 24/7, sicurezza garantita, cloud storage illimitato. Risultati misurabili in 30 giorni.'
        }
      }
    }
  }
};

// Contact Form Position Test Configuration
const contactFormTest = {
  id: 'contact_form_test',
  name: 'Contact Form Position Test',
  variants: {
    control: {
      name: 'Sidebar Form (Control)',
      css: `
        .contact-form-container {
          position: relative;
          display: block;
        }
      `
    },
    sticky: {
      name: 'Sticky Bottom Form (Test)',
      css: `
        .contact-form-container {
          position: fixed !important;
          bottom: 20px !important;
          right: 20px !important;
          z-index: 1000 !important;
          max-width: 300px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          border-radius: 8px !important;
          background: white !important;
          padding: 20px !important;
        }
        
        @media (max-width: 768px) {
          .contact-form-container {
            bottom: 10px !important;
            right: 10px !important;
            left: 10px !important;
            max-width: none !important;
          }
        }
      `
    }
  }
};

// Service Cards Layout Test Configuration
const serviceCardsTest = {
  id: 'service_cards_test',
  name: 'Service Cards Layout Test',
  variants: {
    control: {
      name: 'Grid Layout (Control)',
      css: `
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
      `
    },
    carousel: {
      name: 'Carousel Layout (Test)',
      css: `
        .services-grid {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          gap: 1rem;
          padding-bottom: 1rem;
        }
        
        .services-grid .card {
          flex: 0 0 300px;
          scroll-snap-align: start;
        }
        
        .services-grid::-webkit-scrollbar {
          height: 8px;
        }
        
        .services-grid::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .services-grid::-webkit-scrollbar-thumb {
          background: #0056cc;
          border-radius: 4px;
        }
      `
    }
  }
};

// Pricing Display Test Configuration
const pricingDisplayTest = {
  id: 'pricing_display_test',
  name: 'Pricing Display Test',
  variants: {
    control: {
      name: 'Hidden Pricing (Control)',
      css: `
        .pricing-info {
          display: none;
        }
      `
    },
    visible: {
      name: 'Visible Pricing (Test)',
      css: `
        .pricing-info {
          display: block !important;
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
          border-left: 4px solid #0056cc;
        }
        
        .pricing-info .price {
          font-size: 1.5rem;
          font-weight: bold;
          color: #0056cc;
        }
        
        .pricing-info .price-note {
          font-size: 0.9rem;
          color: #666;
          margin-top: 0.5rem;
        }
      `,
      content: {
        '.pricing-info': {
          html: `
            <div class="price">A partire da €99/mese</div>
            <div class="price-note">Prezzo base per PMI fino a 10 postazioni. Preventivo gratuito personalizzato.</div>
          `
        }
      }
    }
  }
};

// Test Configuration Registry
const testConfigs = {
  cta_button_test: ctaButtonTest,
  hero_section_test: heroSectionTest,
  contact_form_test: contactFormTest,
  service_cards_test: serviceCardsTest,
  pricing_display_test: pricingDisplayTest
};

/**
 * Initialize A/B tests on page load
 */
function initializeABTests() {
  if (!window.abTesting) {
    console.warn('A/B Testing framework not loaded');
    return;
  }
  
  // Apply each test configuration
  Object.entries(testConfigs).forEach(([testId, config]) => {
    const applied = window.abTesting.applyVariant(testId, config.variants);
    if (applied) {
      console.log(`Applied A/B test: ${config.name}`);
    }
  });
  
  // Setup conversion tracking for specific elements
  setupConversionTracking();
}

/**
 * Setup conversion tracking for key elements
 */
function setupConversionTracking() {
  // Track CTA button clicks
  document.querySelectorAll('.btn-primary').forEach(button => {
    if (!button.dataset.abTrack) {
      button.dataset.abTrack = 'cta_click';
    }
  });
  
  // Track contact form submissions
  document.querySelectorAll('form[action*="contact"]').forEach(form => {
    form.addEventListener('submit', () => {
      window.abTesting?.trackConversion('contact_form_submit', {
        form_id: form.id,
        form_action: form.action
      });
    });
  });
  
  // Track phone number clicks
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
      window.abTesting?.trackConversion('phone_click', {
        phone_number: link.href.replace('tel:', '')
      });
    });
  });
  
  // Track service page visits
  if (window.location.pathname.includes('assistenza-it') || 
      window.location.pathname.includes('sicurezza-informatica') ||
      window.location.pathname.includes('cloud-storage')) {
    window.abTesting?.trackConversion('service_page_view', {
      service_type: getServiceTypeFromPath(window.location.pathname)
    });
  }
  
  // Track scroll depth
  let maxScrollDepth = 0;
  window.addEventListener('scroll', throttle(() => {
    const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    if (scrollDepth > maxScrollDepth) {
      maxScrollDepth = scrollDepth;
      
      // Track milestone scroll depths
      if ([25, 50, 75, 90].includes(scrollDepth)) {
        window.abTesting?.trackConversion('scroll_depth', {
          depth: scrollDepth,
          page: window.location.pathname
        });
      }
    }
  }, 1000));
}

/**
 * Get service type from URL path
 */
function getServiceTypeFromPath(path) {
  if (path.includes('assistenza-it')) return 'it_support';
  if (path.includes('sicurezza-informatica')) return 'cybersecurity';
  if (path.includes('cloud-storage')) return 'cloud_storage';
  if (path.includes('voip-telefonia')) return 'voip';
  if (path.includes('microsoft-365')) return 'microsoft_365';
  return 'other';
}

/**
 * Throttle function for performance
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Get test configuration by ID
 */
function getTestConfig(testId) {
  return testConfigs[testId] || null;
}

/**
 * Get all test configurations
 */
function getAllTestConfigs() {
  return testConfigs;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeABTests);
} else {
  initializeABTests();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testConfigs,
    initializeABTests,
    getTestConfig,
    getAllTestConfigs
  };
} else if (typeof window !== 'undefined') {
  window.ABTestConfigs = {
    testConfigs,
    initializeABTests,
    getTestConfig,
    getAllTestConfigs
  };
}
