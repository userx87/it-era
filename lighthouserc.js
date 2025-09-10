/**
 * Lighthouse CI Configuration for IT-ERA
 * Performance, accessibility, SEO, and best practices testing
 */

export default {
  ci: {
    // Collection settings
    collect: {
      // URLs to test
      url: [
        'http://localhost:8080/',
        'http://localhost:8080/contatti.html',
        'http://localhost:8080/assistenza-it-milano.html',
        'http://localhost:8080/sicurezza-informatica-milano.html',
        'http://localhost:8080/cloud-storage-milano.html',
        'http://localhost:8080/riparazione-pc-milano.html'
      ],
      
      // Collection options
      numberOfRuns: 3,
      settings: {
        // Chrome flags for consistent testing
        chromeFlags: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--headless'
        ],
        
        // Lighthouse configuration
        preset: 'desktop',
        
        // Custom audit configuration
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo'
        ],
        
        // Skip certain audits that may be flaky in CI
        skipAudits: [
          'uses-http2',
          'canonical'
        ],
        
        // Throttling settings
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    },
    
    // Upload settings (for CI/CD)
    upload: {
      target: 'filesystem',
      outputDir: './tests/reports/lighthouse'
    },
    
    // Assertion settings - IT-ERA quality standards
    assert: {
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // Accessibility specific
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        
        // SEO specific
        'document-title': 'error',
        'meta-description': 'error',
        'robots-txt': 'warn',
        'hreflang': 'warn',
        
        // Best practices
        'uses-https': 'error',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
        
        // Performance budgets
        'resource-summary:document:size': ['error', { maxNumericValue: 50000 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 200000 }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 100000 }],
        'resource-summary:image:size': ['error', { maxNumericValue: 500000 }],
        
        // Network requests
        'network-requests': ['warn', { maxNumericValue: 50 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'unused-javascript': ['warn', { maxNumericValue: 50000 }]
      }
    },
    
    // Server configuration for local testing
    server: {
      command: 'npm run preview',
      port: 8080,
      timeout: 30000
    }
  },
  
  // Custom configuration for IT-ERA specific tests
  extends: [
    // Custom preset for Italian business sites
    {
      settings: {
        // Locale for Italian content
        locale: 'it-IT',
        
        // Custom user agent
        userAgent: 'IT-ERA Lighthouse Audit',
        
        // Additional form factors
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        }
      }
    }
  ]
};
