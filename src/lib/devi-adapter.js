/**
 * DEVI Adapter - Minimal Integration Utilities
 * Applies unified components to existing templates
 * @version 1.0.0
 */

import { injectGtag } from './analytics.js';

// Site configuration
let siteConfig = null;

/**
 * Load site configuration
 */
async function loadSiteConfig() {
  if (siteConfig) return siteConfig;
  
  try {
    const response = await fetch('/src/config/site.json');
    siteConfig = await response.json();
    return siteConfig;
  } catch (error) {
    console.error('[DEVI] Failed to load site config:', error);
    // Fallback configuration
    return {
      company: {
        phone: "039 888 2041",
        email: "info@it-era.it",
        vat: "10524040966"
      }
    };
  }
}

/**
 * Apply unified footer to page
 */
export async function applyUnifiedFooter() {
  const config = await loadSiteConfig();
  const footerContainer = document.querySelector('footer') || document.querySelector('.footer');
  
  if (!footerContainer) {
    console.warn('[DEVI] No footer container found');
    return;
  }
  
  try {
    const response = await fetch('/templates/_footer.html');
    let footerHTML = await response.text();
    
    // Replace placeholders
    footerHTML = footerHTML.replace('{{CURRENT_YEAR}}', new Date().getFullYear());
    footerHTML = footerHTML.replace('{{PHONE}}', config.company.phone);
    footerHTML = footerHTML.replace('{{EMAIL}}', config.company.email);
    footerHTML = footerHTML.replace('{{VAT}}', config.company.vat);
    
    footerContainer.outerHTML = footerHTML;
    console.log('[DEVI] Unified footer applied');
    
  } catch (error) {
    console.error('[DEVI] Failed to apply unified footer:', error);
  }
}

/**
 * Validate and fix phone numbers
 */
export async function validatePhoneNumbers() {
  const config = await loadSiteConfig();
  const canonicalPhone = config.company.phone;
  
  // Find all phone links
  const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
  let fixedCount = 0;
  
  phoneLinks.forEach(link => {
    const currentHref = link.getAttribute('href');
    const currentPhone = currentHref.replace('tel:', '').replace(/\s/g, '');
    const canonicalPhoneClean = canonicalPhone.replace(/\s/g, '');
    
    if (currentPhone !== canonicalPhoneClean) {
      link.setAttribute('href', `tel:${canonicalPhone}`);
      link.textContent = canonicalPhone;
      fixedCount++;
    }
  });
  
  if (fixedCount > 0) {
    console.log(`[DEVI] Fixed ${fixedCount} phone numbers to canonical: ${canonicalPhone}`);
  }
}

/**
 * Initialize analytics if in production
 */
export function initializeAnalytics() {
  // Auto-initialize GA4 (already handled in analytics.js)
  injectGtag();
}

/**
 * Add navigation data attributes for tracking
 */
export function enhanceNavigation() {
  const nav = document.querySelector('nav[data-navigation-source]');
  if (nav) {
    nav.setAttribute('data-devi-enhanced', 'true');
    nav.setAttribute('data-enhanced-timestamp', Date.now());
  }
}

/**
 * Main DEVI initialization
 * Call this on page load
 */
export async function initializeDEVI() {
  try {
    console.log('[DEVI] Initializing minimal adaptations...');
    
    // Run adaptations in parallel
    await Promise.all([
      validatePhoneNumbers(),
      applyUnifiedFooter()
    ]);
    
    // Initialize analytics
    initializeAnalytics();
    
    // Enhance navigation
    enhanceNavigation();
    
    console.log('[DEVI] Initialization complete');
    
  } catch (error) {
    console.error('[DEVI] Initialization failed:', error);
  }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDEVI);
  } else {
    initializeDEVI();
  }
}