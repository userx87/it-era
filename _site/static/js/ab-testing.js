/**
 * IT-ERA A/B Testing Framework
 * Advanced A/B testing system with statistical significance and conversion tracking
 * Part of the Hive Mind Performance Optimization Strategy
 */

class ABTestingFramework {
  constructor(options = {}) {
    this.config = {
      // API endpoints
      apiEndpoint: options.apiEndpoint || '/api/ab-testing',
      trackingEndpoint: options.trackingEndpoint || '/api/tracking',
      
      // Test configuration
      defaultTrafficSplit: options.defaultTrafficSplit || 50, // 50/50 split
      minSampleSize: options.minSampleSize || 100,
      confidenceLevel: options.confidenceLevel || 0.95,
      
      // Storage
      storageKey: options.storageKey || 'it_era_ab_tests',
      cookieExpiry: options.cookieExpiry || 30, // days
      
      // Analytics integration
      enableGA4: options.enableGA4 !== false,
      enableGTM: options.enableGTM !== false,
      
      // Debug mode
      debug: options.debug || false,
      
      ...options
    };
    
    this.activeTests = new Map();
    this.userAssignments = new Map();
    this.conversionEvents = new Set();
    this.initialized = false;
    
    this.init();
  }

  /**
   * Initialize A/B testing framework
   */
  async init() {
    if (this.initialized) return;
    
    try {
      // Load user assignments from storage
      this.loadUserAssignments();
      
      // Load active tests from server
      await this.loadActiveTests();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize analytics integration
      this.initializeAnalytics();
      
      this.initialized = true;
      this.log('A/B Testing Framework initialized');
      
    } catch (error) {
      console.error('❌ A/B Testing initialization failed:', error);
    }
  }

  /**
   * Load user assignments from localStorage/cookies
   */
  loadUserAssignments() {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([testId, assignment]) => {
          this.userAssignments.set(testId, assignment);
        });
      }
    } catch (error) {
      this.log('Failed to load user assignments:', error);
    }
  }

  /**
   * Save user assignments to localStorage
   */
  saveUserAssignments() {
    try {
      const data = Object.fromEntries(this.userAssignments);
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      this.log('Failed to save user assignments:', error);
    }
  }

  /**
   * Load active tests from server
   */
  async loadActiveTests() {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/active`);
      if (response.ok) {
        const tests = await response.json();
        tests.forEach(test => {
          this.activeTests.set(test.id, test);
        });
        this.log(`Loaded ${tests.length} active tests`);
      }
    } catch (error) {
      this.log('Failed to load active tests:', error);
    }
  }

  /**
   * Setup event listeners for conversion tracking
   */
  setupEventListeners() {
    // Track form submissions
    document.addEventListener('submit', (event) => {
      this.trackConversion('form_submit', {
        form: event.target.id || event.target.className,
        url: window.location.href
      });
    });
    
    // Track button clicks
    document.addEventListener('click', (event) => {
      if (event.target.matches('[data-ab-track]')) {
        const eventName = event.target.dataset.abTrack;
        this.trackConversion(eventName, {
          element: event.target.tagName,
          text: event.target.textContent.trim(),
          url: window.location.href
        });
      }
    });
    
    // Track page views
    this.trackConversion('page_view', {
      url: window.location.href,
      referrer: document.referrer
    });
  }

  /**
   * Initialize analytics integration
   */
  initializeAnalytics() {
    // Send test assignments to GA4
    if (this.config.enableGA4 && typeof gtag !== 'undefined') {
      this.userAssignments.forEach((assignment, testId) => {
        gtag('config', 'G-T5VWN9EH21', {
          custom_map: {
            'custom_dimension_4': 'ab_test_' + testId
          }
        });
        
        gtag('event', 'ab_test_assignment', {
          test_id: testId,
          variant: assignment.variant,
          custom_dimension_4: assignment.variant
        });
      });
    }
  }

  /**
   * Get or assign user to test variant
   */
  getTestVariant(testId) {
    // Check if user already assigned
    if (this.userAssignments.has(testId)) {
      return this.userAssignments.get(testId);
    }
    
    // Get test configuration
    const test = this.activeTests.get(testId);
    if (!test || !test.active) {
      return null;
    }
    
    // Assign user to variant
    const assignment = this.assignUserToVariant(test);
    this.userAssignments.set(testId, assignment);
    this.saveUserAssignments();
    
    // Track assignment
    this.trackAssignment(testId, assignment);
    
    return assignment;
  }

  /**
   * Assign user to test variant based on traffic split
   */
  assignUserToVariant(test) {
    const userId = this.getUserId();
    const hash = this.hashString(userId + test.id);
    const bucket = hash % 100;
    
    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight || (100 / test.variants.length);
      if (bucket < cumulativeWeight) {
        return {
          variant: variant.id,
          assignedAt: Date.now(),
          userId: userId
        };
      }
    }
    
    // Fallback to control
    return {
      variant: test.variants[0].id,
      assignedAt: Date.now(),
      userId: userId
    };
  }

  /**
   * Get or generate user ID
   */
  getUserId() {
    let userId = localStorage.getItem('it_era_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('it_era_user_id', userId);
    }
    return userId;
  }

  /**
   * Hash string for consistent bucketing
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Track test assignment
   */
  trackAssignment(testId, assignment) {
    this.sendEvent('assignment', {
      test_id: testId,
      variant: assignment.variant,
      user_id: assignment.userId,
      timestamp: assignment.assignedAt
    });
    
    this.log(`User assigned to test ${testId}, variant ${assignment.variant}`);
  }

  /**
   * Track conversion event
   */
  trackConversion(eventName, data = {}) {
    // Prevent duplicate events
    const eventKey = `${eventName}_${Date.now()}`;
    if (this.conversionEvents.has(eventKey)) return;
    this.conversionEvents.add(eventKey);
    
    // Clean up old events (keep last 100)
    if (this.conversionEvents.size > 100) {
      const oldEvents = Array.from(this.conversionEvents).slice(0, -100);
      oldEvents.forEach(event => this.conversionEvents.delete(event));
    }
    
    // Send conversion for all active tests
    this.userAssignments.forEach((assignment, testId) => {
      this.sendEvent('conversion', {
        test_id: testId,
        variant: assignment.variant,
        user_id: assignment.userId,
        event_name: eventName,
        event_data: data,
        timestamp: Date.now()
      });
    });
    
    // Send to GA4
    if (this.config.enableGA4 && typeof gtag !== 'undefined') {
      gtag('event', 'ab_test_conversion', {
        event_name: eventName,
        event_data: JSON.stringify(data)
      });
    }
    
    this.log(`Conversion tracked: ${eventName}`, data);
  }

  /**
   * Send event to tracking endpoint
   */
  async sendEvent(eventType, data) {
    try {
      await fetch(this.config.trackingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: eventType,
          data: data,
          timestamp: Date.now(),
          url: window.location.href,
          user_agent: navigator.userAgent
        })
      });
    } catch (error) {
      this.log('Failed to send event:', error);
    }
  }

  /**
   * Apply test variant to page
   */
  applyVariant(testId, variantConfig) {
    const assignment = this.getTestVariant(testId);
    if (!assignment) return false;
    
    const variant = variantConfig[assignment.variant];
    if (!variant) return false;
    
    // Apply CSS changes
    if (variant.css) {
      this.applyCSSChanges(variant.css);
    }
    
    // Apply content changes
    if (variant.content) {
      this.applyContentChanges(variant.content);
    }
    
    // Apply JavaScript changes
    if (variant.javascript) {
      this.applyJavaScriptChanges(variant.javascript);
    }
    
    this.log(`Applied variant ${assignment.variant} for test ${testId}`);
    return true;
  }

  /**
   * Apply CSS changes
   */
  applyCSSChanges(cssChanges) {
    const style = document.createElement('style');
    style.textContent = cssChanges;
    style.setAttribute('data-ab-test', 'true');
    document.head.appendChild(style);
  }

  /**
   * Apply content changes
   */
  applyContentChanges(contentChanges) {
    Object.entries(contentChanges).forEach(([selector, content]) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (content.html) {
          element.innerHTML = content.html;
        } else if (content.text) {
          element.textContent = content.text;
        } else if (content.attributes) {
          Object.entries(content.attributes).forEach(([attr, value]) => {
            element.setAttribute(attr, value);
          });
        }
      });
    });
  }

  /**
   * Apply JavaScript changes
   */
  applyJavaScriptChanges(jsCode) {
    try {
      const script = document.createElement('script');
      script.textContent = jsCode;
      script.setAttribute('data-ab-test', 'true');
      document.head.appendChild(script);
    } catch (error) {
      this.log('Failed to apply JavaScript changes:', error);
    }
  }

  /**
   * Get test results and statistics
   */
  async getTestResults(testId) {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/${testId}/results`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      this.log('Failed to get test results:', error);
    }
    return null;
  }

  /**
   * Calculate statistical significance
   */
  calculateSignificance(controlConversions, controlSample, testConversions, testSample) {
    const p1 = controlConversions / controlSample;
    const p2 = testConversions / testSample;
    const pPool = (controlConversions + testConversions) / (controlSample + testSample);
    
    const se = Math.sqrt(pPool * (1 - pPool) * (1/controlSample + 1/testSample));
    const zScore = (p2 - p1) / se;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    return {
      zScore,
      pValue,
      significant: pValue < (1 - this.config.confidenceLevel),
      confidenceLevel: this.config.confidenceLevel,
      improvement: ((p2 - p1) / p1) * 100
    };
  }

  /**
   * Normal cumulative distribution function
   */
  normalCDF(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  erf(x) {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }

  /**
   * Debug logging
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[AB Testing]', ...args);
    }
  }

  /**
   * Get current test assignments
   */
  getCurrentAssignments() {
    return Object.fromEntries(this.userAssignments);
  }

  /**
   * Force assignment to specific variant (for testing)
   */
  forceVariant(testId, variantId) {
    if (this.config.debug) {
      this.userAssignments.set(testId, {
        variant: variantId,
        assignedAt: Date.now(),
        userId: this.getUserId(),
        forced: true
      });
      this.saveUserAssignments();
      this.log(`Forced assignment: ${testId} -> ${variantId}`);
    }
  }

  /**
   * Clear all test assignments
   */
  clearAssignments() {
    this.userAssignments.clear();
    localStorage.removeItem(this.config.storageKey);
    this.log('All test assignments cleared');
  }
}

// Auto-initialize
let abTesting;
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    abTesting = new ABTestingFramework({
      debug: window.location.search.includes('ab_debug=true')
    });
    window.abTesting = abTesting;
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ABTestingFramework;
} else if (typeof window !== 'undefined') {
  window.ABTestingFramework = ABTestingFramework;
}
