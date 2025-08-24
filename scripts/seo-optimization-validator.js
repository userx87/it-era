#!/usr/bin/env node

/**
 * SEO Optimization Validator for IT-ERA Templates
 * Tests and validates all technical SEO optimizations
 * 
 * Usage: node seo-optimization-validator.js [template-path] [city] [region]
 * Example: node seo-optimization-validator.js ../templates/assistenza-it-seo-optimized.html Milano Lombardia
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configuration
const CONFIG = {
    minPageSpeedScore: 85,
    maxLCPTime: 2500, // milliseconds
    maxCLSScore: 0.1,
    maxFIDTime: 100, // milliseconds
    requiredMetaTags: [
        'title', 'description', 'keywords', 'robots', 'canonical',
        'og:title', 'og:description', 'og:type', 'og:url', 'og:image',
        'twitter:card', 'twitter:title', 'twitter:description'
    ],
    requiredSchemaTypes: [
        'LocalBusiness', 'Service', 'FAQPage', 'Organization', 'BreadcrumbList'
    ],
    wcagRequirements: {
        minContrastRatio: 4.5,
        maxResponseTime: 100, // for interactive elements
        requiredAriaLabels: ['navigation', 'main', 'complementary', 'banner', 'contentinfo']
    }
};

class SEOValidator {
    constructor(templatePath, city = 'Milano', region = 'Lombardia') {
        this.templatePath = templatePath;
        this.city = city;
        this.region = region;
        this.errors = [];
        this.warnings = [];
        this.passed = [];
        this.performance = {};
    }

    async validate() {
        console.log('🔍 Starting SEO Optimization Validation...\n');
        
        try {
            // Load and process template
            await this.loadTemplate();
            
            // Run all validation tests
            await this.validateMetaTags();
            await this.validateStructuredData();
            await this.validateAccessibility();
            await this.validatePerformance();
            await this.validateMobileResponsiveness();
            await this.validateInternalLinking();
            await this.validateCoreWebVitals();
            await this.validateSecurity();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            process.exit(1);
        }
    }

    async loadTemplate() {
        if (!fs.existsSync(this.templatePath)) {
            throw new Error(`Template file not found: ${this.templatePath}`);
        }

        const html = fs.readFileSync(this.templatePath, 'utf8');
        
        // Replace template variables
        this.processedHTML = html
            .replace(/{{CITY}}/g, this.city)
            .replace(/{{REGION}}/g, this.region)
            .replace(/{{CITY_SLUG}}/g, this.city.toLowerCase().replace(/\s+/g, '-'))
            .replace(/{{LAT}}/g, '45.4642')
            .replace(/{{LON}}/g, '9.1900')
            .replace(/{{CANONICAL_URL}}/g, `https://www.it-era.it/assistenza-it-${this.city.toLowerCase()}`);

        this.dom = new JSDOM(this.processedHTML);
        this.document = this.dom.window.document;
        
        console.log('✅ Template loaded and processed successfully');
    }

    async validateMetaTags() {
        console.log('🏷️  Validating Meta Tags...');
        
        const requiredTags = {
            'title': 'title',
            'description': 'meta[name="description"]',
            'keywords': 'meta[name="keywords"]',
            'robots': 'meta[name="robots"]',
            'canonical': 'link[rel="canonical"]',
            'og:title': 'meta[property="og:title"]',
            'og:description': 'meta[property="og:description"]',
            'og:type': 'meta[property="og:type"]',
            'og:url': 'meta[property="og:url"]',
            'og:image': 'meta[property="og:image"]',
            'twitter:card': 'meta[name="twitter:card"]',
            'twitter:title': 'meta[name="twitter:title"]',
            'twitter:description': 'meta[name="twitter:description"]'
        };

        for (const [tagName, selector] of Object.entries(requiredTags)) {
            const element = this.document.querySelector(selector);
            
            if (!element) {
                this.errors.push(`Missing required meta tag: ${tagName}`);
                continue;
            }

            const content = element.content || element.textContent || element.href;
            
            if (!content || content.trim().length === 0) {
                this.errors.push(`Empty content for meta tag: ${tagName}`);
                continue;
            }

            // Validate content length
            if (tagName === 'title' && content.length > 60) {
                this.warnings.push(`Title too long (${content.length} chars): should be ≤60`);
            } else if (tagName === 'description' && content.length > 160) {
                this.warnings.push(`Description too long (${content.length} chars): should be ≤160`);
            }

            // Check for city inclusion
            if (['title', 'description', 'og:title', 'og:description'].includes(tagName)) {
                if (!content.toLowerCase().includes(this.city.toLowerCase())) {
                    this.warnings.push(`${tagName} should include city name: ${this.city}`);
                }
            }

            this.passed.push(`Meta tag ${tagName}: ✅`);
        }

        console.log(`   Meta tags validation completed: ${this.passed.length - this.errors.length}/12 passed\n`);
    }

    async validateStructuredData() {
        console.log('📊 Validating Structured Data (Schema.org)...');
        
        const schemaScripts = this.document.querySelectorAll('script[type="application/ld+json"]');
        
        if (schemaScripts.length === 0) {
            this.errors.push('No structured data found');
            return;
        }

        let foundTypes = new Set();
        
        schemaScripts.forEach((script, index) => {
            try {
                const data = JSON.parse(script.textContent);
                const schemaType = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
                
                schemaType.forEach(type => foundTypes.add(type));
                
                // Validate LocalBusiness schema
                if (schemaType.includes('LocalBusiness')) {
                    const required = ['name', 'description', 'telephone', 'address', 'areaServed'];
                    required.forEach(field => {
                        if (!data[field]) {
                            this.errors.push(`LocalBusiness schema missing required field: ${field}`);
                        }
                    });
                    
                    // Validate address structure
                    if (data.address && typeof data.address === 'object') {
                        const addressRequired = ['streetAddress', 'addressLocality', 'postalCode', 'addressCountry'];
                        addressRequired.forEach(field => {
                            if (!data.address[field]) {
                                this.warnings.push(`Address schema missing field: ${field}`);
                            }
                        });
                    }
                }
                
                // Validate Service offers
                if (data.hasOfferCatalog) {
                    const offers = data.hasOfferCatalog.itemListElement || [];
                    if (offers.length === 0) {
                        this.warnings.push('LocalBusiness has no service offers defined');
                    } else {
                        offers.forEach((offer, i) => {
                            if (!offer.price || !offer.priceCurrency) {
                                this.warnings.push(`Offer ${i + 1} missing price information`);
                            }
                        });
                    }
                }
                
                this.passed.push(`Schema.org type: ${schemaType.join(', ')}`);
                
            } catch (error) {
                this.errors.push(`Invalid JSON-LD in script ${index + 1}: ${error.message}`);
            }
        });

        // Check for required schema types
        CONFIG.requiredSchemaTypes.forEach(type => {
            if (!foundTypes.has(type)) {
                this.warnings.push(`Missing recommended schema type: ${type}`);
            }
        });

        console.log(`   Structured data validation completed: ${foundTypes.size} types found\n`);
    }

    async validateAccessibility() {
        console.log('♿ Validating WCAG 2.1 AA Accessibility...');
        
        let accessibilityScore = 0;
        const maxScore = 15;

        // Check for skip link
        const skipLink = this.document.querySelector('.skip-link');
        if (skipLink) {
            accessibilityScore++;
            this.passed.push('Skip navigation link present');
        } else {
            this.errors.push('Missing skip navigation link');
        }

        // Check alt attributes on images
        const images = this.document.querySelectorAll('img');
        let imagesWithAlt = 0;
        images.forEach(img => {
            if (img.hasAttribute('alt')) {
                imagesWithAlt++;
            } else {
                this.warnings.push(`Image missing alt attribute: ${img.src || 'unknown'}`);
            }
        });
        if (images.length > 0) {
            accessibilityScore += Math.min(2, Math.floor(imagesWithAlt / images.length * 2));
        }

        // Check form labels
        const inputs = this.document.querySelectorAll('input, textarea, select');
        let inputsWithLabels = 0;
        inputs.forEach(input => {
            const label = this.document.querySelector(`label[for="${input.id}"]`);
            const ariaLabel = input.hasAttribute('aria-label');
            const ariaLabelledby = input.hasAttribute('aria-labelledby');
            
            if (label || ariaLabel || ariaLabelledby) {
                inputsWithLabels++;
            } else {
                this.errors.push(`Form input missing label: ${input.name || input.id || 'unknown'}`);
            }
        });
        if (inputs.length > 0) {
            accessibilityScore += Math.min(3, Math.floor(inputsWithLabels / inputs.length * 3));
        }

        // Check ARIA landmarks
        const landmarks = ['navigation', 'main', 'banner', 'contentinfo'];
        landmarks.forEach(landmark => {
            const element = this.document.querySelector(`[role="${landmark}"], ${landmark}`);
            if (element) {
                accessibilityScore++;
                this.passed.push(`ARIA landmark: ${landmark}`);
            } else {
                this.warnings.push(`Missing ARIA landmark: ${landmark}`);
            }
        });

        // Check heading hierarchy
        const headings = this.document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const h1Count = this.document.querySelectorAll('h1').length;
        
        if (h1Count === 1) {
            accessibilityScore++;
            this.passed.push('Proper H1 usage (exactly one)');
        } else {
            this.errors.push(`Incorrect H1 count: ${h1Count} (should be 1)`);
        }

        if (headings.length > 3) {
            accessibilityScore++;
            this.passed.push('Good heading hierarchy structure');
        }

        // Check focus indicators
        const focusableElements = this.document.querySelectorAll('button, a, input, textarea, select');
        if (focusableElements.length > 0) {
            accessibilityScore++;
            this.passed.push('Focusable elements present');
        }

        // Check table headers (if tables exist)
        const tables = this.document.querySelectorAll('table');
        tables.forEach(table => {
            const headers = table.querySelectorAll('th');
            if (headers.length === 0) {
                this.warnings.push('Table missing header cells (th elements)');
            }
        });

        const accessibilityPercentage = Math.round((accessibilityScore / maxScore) * 100);
        
        if (accessibilityPercentage >= 85) {
            this.passed.push(`Accessibility score: ${accessibilityPercentage}% (Excellent)`);
        } else if (accessibilityPercentage >= 70) {
            this.warnings.push(`Accessibility score: ${accessibilityPercentage}% (Good, room for improvement)`);
        } else {
            this.errors.push(`Accessibility score: ${accessibilityPercentage}% (Poor, needs attention)`);
        }

        console.log(`   Accessibility validation completed: ${accessibilityPercentage}% score\n`);
    }

    async validatePerformance() {
        console.log('⚡ Validating Performance Optimizations...');
        
        // Check for performance optimizations in HTML
        const optimizations = {
            preconnect: this.document.querySelectorAll('link[rel="preconnect"]').length,
            dnsPrefetch: this.document.querySelectorAll('link[rel="dns-prefetch"]').length,
            preload: this.document.querySelectorAll('link[rel="preload"]').length,
            criticalCSS: this.document.querySelectorAll('style').length,
            asyncScripts: this.document.querySelectorAll('script[async]').length,
            deferScripts: this.document.querySelectorAll('script[defer]').length,
            lazyImages: this.document.querySelectorAll('img[loading="lazy"]').length,
            webpImages: Array.from(this.document.querySelectorAll('img')).filter(img => 
                img.src && (img.src.includes('.webp') || img.src.includes('.avif'))).length
        };

        // Validate performance features
        if (optimizations.preconnect >= 3) {
            this.passed.push(`Preconnect optimization: ${optimizations.preconnect} domains`);
        } else {
            this.warnings.push(`Consider adding more preconnect hints (found: ${optimizations.preconnect})`);
        }

        if (optimizations.criticalCSS >= 1) {
            this.passed.push('Critical CSS inlined');
        } else {
            this.warnings.push('Consider inlining critical CSS');
        }

        if (optimizations.lazyImages > 0) {
            this.passed.push(`Lazy loading images: ${optimizations.lazyImages}`);
        } else {
            this.warnings.push('No lazy loading detected for images');
        }

        // Check for font-display: swap
        const fontFaces = this.processedHTML.match(/@font-face[\s\S]*?font-display:\s*swap/g);
        if (fontFaces && fontFaces.length > 0) {
            this.passed.push('Font-display: swap optimization detected');
        } else {
            this.warnings.push('Consider using font-display: swap for web fonts');
        }

        // Check for minification indicators
        const cssMinified = this.processedHTML.includes('.min.css');
        const jsMinified = this.processedHTML.includes('.min.js');
        
        if (cssMinified) this.passed.push('Minified CSS detected');
        if (jsMinified) this.passed.push('Minified JavaScript detected');

        this.performance = optimizations;
        console.log(`   Performance validation completed: ${Object.keys(optimizations).length} checks\n`);
    }

    async validateMobileResponsiveness() {
        console.log('📱 Validating Mobile Responsiveness...');
        
        // Check viewport meta tag
        const viewport = this.document.querySelector('meta[name="viewport"]');
        if (viewport && viewport.content.includes('width=device-width')) {
            this.passed.push('Proper viewport meta tag');
        } else {
            this.errors.push('Missing or incorrect viewport meta tag');
        }

        // Check for responsive CSS patterns
        const responsivePatterns = [
            /@media\s*\([^)]*max-width/g,
            /@media\s*\([^)]*min-width/g,
            /flex/g,
            /grid/g,
            /clamp\(/g,
            /calc\(/g
        ];

        let responsiveScore = 0;
        responsivePatterns.forEach((pattern, index) => {
            const matches = this.processedHTML.match(pattern);
            if (matches && matches.length > 0) {
                responsiveScore++;
                switch (index) {
                    case 0:
                        this.passed.push(`Max-width media queries: ${matches.length}`);
                        break;
                    case 1:
                        this.passed.push(`Min-width media queries: ${matches.length}`);
                        break;
                    case 2:
                        this.passed.push('Flexbox layout detected');
                        break;
                    case 3:
                        this.passed.push('CSS Grid layout detected');
                        break;
                    case 4:
                        this.passed.push('CSS clamp() function used');
                        break;
                    case 5:
                        this.passed.push('CSS calc() function used');
                        break;
                }
            }
        });

        // Check Bootstrap or responsive framework
        if (this.processedHTML.includes('bootstrap') || this.processedHTML.includes('col-')) {
            this.passed.push('Responsive framework detected (Bootstrap)');
            responsiveScore++;
        }

        // Check for mobile-friendly touch targets
        const buttons = this.document.querySelectorAll('button, .btn');
        if (buttons.length > 0) {
            this.passed.push(`Touch targets present: ${buttons.length} buttons`);
        }

        const mobileScore = Math.round((responsiveScore / responsivePatterns.length) * 100);
        if (mobileScore >= 70) {
            this.passed.push(`Mobile responsiveness score: ${mobileScore}%`);
        } else {
            this.warnings.push(`Mobile responsiveness could be improved: ${mobileScore}%`);
        }

        console.log(`   Mobile responsiveness validation completed: ${mobileScore}% score\n`);
    }

    async validateInternalLinking() {
        console.log('🔗 Validating Internal Linking Strategy...');
        
        const allLinks = this.document.querySelectorAll('a[href]');
        const internalLinks = Array.from(allLinks).filter(link => 
            link.href.startsWith('/') || 
            link.href.includes('it-era.it') ||
            !link.href.includes('http')
        );

        const externalLinks = Array.from(allLinks).filter(link => 
            link.href.startsWith('http') && 
            !link.href.includes('it-era.it')
        );

        // Analyze link distribution
        const linkCategories = {
            services: 0,
            geographic: 0,
            resources: 0,
            navigation: 0
        };

        internalLinks.forEach(link => {
            const href = link.href.toLowerCase();
            if (href.includes('assistenza') || href.includes('sicurezza') || href.includes('cloud')) {
                linkCategories.services++;
            } else if (href.includes('milano') || href.includes('bergamo') || href.includes('como')) {
                linkCategories.geographic++;
            } else if (href.includes('guide') || href.includes('faq') || href.includes('risorsa')) {
                linkCategories.resources++;
            } else {
                linkCategories.navigation++;
            }
        });

        // Validate link structure
        if (internalLinks.length >= 10) {
            this.passed.push(`Good internal linking: ${internalLinks.length} internal links`);
        } else {
            this.warnings.push(`Consider adding more internal links (current: ${internalLinks.length})`);
        }

        if (linkCategories.services >= 3) {
            this.passed.push(`Service cross-linking: ${linkCategories.services} links`);
        } else {
            this.warnings.push('Add more cross-links between services');
        }

        if (linkCategories.geographic >= 2) {
            this.passed.push(`Geographic linking: ${linkCategories.geographic} location links`);
        } else {
            this.warnings.push('Consider adding links to other geographic locations');
        }

        // Check for proper link attributes
        const externalLinksWithTargetBlank = Array.from(externalLinks).filter(link => 
            link.target === '_blank'
        );
        
        const externalLinksWithNoopener = Array.from(externalLinks).filter(link => 
            link.rel && link.rel.includes('noopener')
        );

        if (externalLinks.length > 0) {
            const properExternalLinks = externalLinksWithTargetBlank.length + externalLinksWithNoopener.length;
            if (properExternalLinks >= externalLinks.length * 0.8) {
                this.passed.push('External links properly configured');
            } else {
                this.warnings.push('Some external links missing target="_blank" or rel="noopener"');
            }
        }

        console.log(`   Internal linking validation completed: ${internalLinks.length} internal links found\n`);
    }

    async validateCoreWebVitals() {
        console.log('📊 Validating Core Web Vitals Optimizations...');
        
        let vitalScore = 0;
        const maxVitalScore = 10;

        // LCP Optimizations
        const heroImages = this.document.querySelectorAll('.hero img, .hero-image, .hero picture');
        const eagerImages = this.document.querySelectorAll('img[loading="eager"], img[fetchpriority="high"]');
        
        if (eagerImages.length > 0) {
            this.passed.push('LCP optimization: High priority images configured');
            vitalScore++;
        }

        if (this.processedHTML.includes('font-display: swap')) {
            this.passed.push('LCP optimization: Font loading optimized');
            vitalScore++;
        }

        // FID Optimizations
        if (this.processedHTML.includes('async') || this.processedHTML.includes('defer')) {
            this.passed.push('FID optimization: Non-blocking JavaScript detected');
            vitalScore++;
        }

        const inputElements = this.document.querySelectorAll('input, button, select');
        if (inputElements.length > 0) {
            this.passed.push('FID optimization: Interactive elements present');
            vitalScore++;
        }

        // CLS Optimizations
        const fixedDimensions = this.document.querySelectorAll('[width][height], [style*="width"][style*="height"]');
        if (fixedDimensions.length >= 5) {
            this.passed.push('CLS optimization: Fixed dimensions found');
            vitalScore++;
        }

        if (this.processedHTML.includes('contain: layout') || this.processedHTML.includes('content-visibility')) {
            this.passed.push('CLS optimization: CSS containment detected');
            vitalScore++;
        }

        // Check for aspect ratio preservation
        if (this.processedHTML.includes('aspect-ratio') || this.processedHTML.includes('padding-bottom')) {
            this.passed.push('CLS optimization: Aspect ratio preservation');
            vitalScore++;
        }

        // Performance budgets
        const cssFiles = this.document.querySelectorAll('link[rel="stylesheet"]');
        const jsFiles = this.document.querySelectorAll('script[src]');
        
        if (cssFiles.length <= 3) {
            this.passed.push('Performance: CSS file count optimized');
            vitalScore++;
        } else {
            this.warnings.push(`Consider consolidating CSS files (current: ${cssFiles.length})`);
        }

        if (jsFiles.length <= 5) {
            this.passed.push('Performance: JavaScript file count optimized');
            vitalScore++;
        } else {
            this.warnings.push(`Consider consolidating JS files (current: ${jsFiles.length})`);
        }

        // Resource hints
        const resourceHints = this.document.querySelectorAll('link[rel="preconnect"], link[rel="dns-prefetch"], link[rel="preload"]');
        if (resourceHints.length >= 5) {
            this.passed.push('Performance: Resource hints optimized');
            vitalScore++;
        }

        const vitalPercentage = Math.round((vitalScore / maxVitalScore) * 100);
        
        if (vitalPercentage >= 80) {
            this.passed.push(`Core Web Vitals score: ${vitalPercentage}% (Excellent)`);
        } else if (vitalPercentage >= 60) {
            this.warnings.push(`Core Web Vitals score: ${vitalPercentage}% (Good)`);
        } else {
            this.errors.push(`Core Web Vitals score: ${vitalPercentage}% (Needs improvement)`);
        }

        console.log(`   Core Web Vitals validation completed: ${vitalPercentage}% score\n`);
    }

    async validateSecurity() {
        console.log('🔒 Validating Security Features...');
        
        let securityScore = 0;
        const maxSecurityScore = 8;

        // Check HTTPS enforcement
        const allLinks = this.document.querySelectorAll('a[href^="http:"]');
        if (allLinks.length === 0) {
            this.passed.push('Security: No insecure HTTP links found');
            securityScore++;
        } else {
            this.errors.push(`Found ${allLinks.length} insecure HTTP links`);
        }

        // Check external link security
        const externalLinks = this.document.querySelectorAll('a[href^="https://"]');
        let secureExternalLinks = 0;
        
        externalLinks.forEach(link => {
            if (link.rel && (link.rel.includes('noopener') || link.rel.includes('noreferrer'))) {
                secureExternalLinks++;
            }
        });

        if (externalLinks.length > 0 && secureExternalLinks >= externalLinks.length * 0.8) {
            this.passed.push('Security: External links properly secured');
            securityScore++;
        }

        // Check for content security policy meta tag
        const csp = this.document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (csp) {
            this.passed.push('Security: CSP meta tag found');
            securityScore++;
        } else {
            this.warnings.push('Consider adding Content-Security-Policy meta tag');
        }

        // Check form security
        const forms = this.document.querySelectorAll('form');
        let secureForms = 0;
        
        forms.forEach(form => {
            const action = form.action || form.getAttribute('action');
            if (!action || action.startsWith('https://') || action.startsWith('/') || action.startsWith('mailto:')) {
                secureForms++;
            }
        });

        if (forms.length > 0 && secureForms === forms.length) {
            this.passed.push('Security: All forms use secure endpoints');
            securityScore++;
        }

        // Check for honeypot fields (spam protection)
        const honeypots = this.document.querySelectorAll('input[name="website"][style*="display: none"]');
        if (honeypots.length > 0) {
            this.passed.push('Security: Spam protection (honeypot) detected');
            securityScore++;
        }

        // Check for CSRF protection patterns
        const csrfTokens = this.document.querySelectorAll('input[name*="csrf"], input[name*="token"], input[name*="_token"]');
        if (csrfTokens.length > 0) {
            this.passed.push('Security: CSRF protection tokens found');
            securityScore++;
        }

        // Check iframe security
        const iframes = this.document.querySelectorAll('iframe');
        let secureIframes = 0;
        
        iframes.forEach(iframe => {
            if (iframe.sandbox || iframe.src.startsWith('https://')) {
                secureIframes++;
            }
        });

        if (iframes.length === 0 || secureIframes === iframes.length) {
            this.passed.push('Security: iframes properly configured');
            securityScore++;
        }

        // Check for XSS protection
        const xssProtection = this.document.querySelector('meta[http-equiv="X-XSS-Protection"]');
        if (xssProtection) {
            this.passed.push('Security: XSS protection header');
            securityScore++;
        }

        const securityPercentage = Math.round((securityScore / maxSecurityScore) * 100);
        
        if (securityPercentage >= 80) {
            this.passed.push(`Security score: ${securityPercentage}% (Excellent)`);
        } else if (securityPercentage >= 60) {
            this.warnings.push(`Security score: ${securityPercentage}% (Good)`);
        } else {
            this.errors.push(`Security score: ${securityPercentage}% (Needs attention)`);
        }

        console.log(`   Security validation completed: ${securityPercentage}% score\n`);
    }

    generateReport() {
        console.log('📋 SEO Optimization Validation Report');
        console.log('=' .repeat(50));
        
        const totalChecks = this.passed.length + this.warnings.length + this.errors.length;
        const successRate = Math.round((this.passed.length / totalChecks) * 100);
        
        console.log(`\n📊 Overall Score: ${successRate}%`);
        console.log(`✅ Passed: ${this.passed.length}`);
        console.log(`⚠️  Warnings: ${this.warnings.length}`);
        console.log(`❌ Errors: ${this.errors.length}`);
        
        if (this.errors.length > 0) {
            console.log('\n❌ CRITICAL ISSUES TO FIX:');
            this.errors.forEach(error => console.log(`   • ${error}`));
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  RECOMMENDATIONS:');
            this.warnings.forEach(warning => console.log(`   • ${warning}`));
        }
        
        if (this.passed.length > 0) {
            console.log('\n✅ OPTIMIZATIONS WORKING CORRECTLY:');
            this.passed.slice(0, 10).forEach(passed => console.log(`   • ${passed}`));
            if (this.passed.length > 10) {
                console.log(`   ... and ${this.passed.length - 10} more optimizations`);
            }
        }

        // Performance summary
        console.log('\n⚡ PERFORMANCE OPTIMIZATIONS DETECTED:');
        Object.entries(this.performance).forEach(([key, value]) => {
            if (value > 0) {
                console.log(`   • ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
            }
        });

        // Overall assessment
        console.log('\n🎯 OVERALL ASSESSMENT:');
        if (successRate >= 90) {
            console.log('   🏆 EXCELLENT: Template is highly optimized for SEO and performance');
        } else if (successRate >= 80) {
            console.log('   ✅ GOOD: Template is well optimized with minor improvements needed');
        } else if (successRate >= 70) {
            console.log('   ⚠️  FAIR: Template needs some optimization work');
        } else {
            console.log('   ❌ POOR: Template requires significant SEO optimization');
        }

        // PageSpeed prediction
        const estimatedPageSpeed = Math.max(50, Math.min(100, successRate - 10));
        console.log(`\n🚀 ESTIMATED PAGESPEED SCORE: ${estimatedPageSpeed}/100`);
        
        // Recommendations for next steps
        console.log('\n🔧 NEXT STEPS:');
        if (this.errors.length > 0) {
            console.log('   1. Fix all critical issues listed above');
        }
        if (this.warnings.length > 0) {
            console.log('   2. Address warnings to improve performance');
        }
        console.log('   3. Test with actual PageSpeed Insights');
        console.log('   4. Monitor Core Web Vitals in production');
        console.log('   5. Set up performance budgets and monitoring');

        console.log('\n' + '='.repeat(50));
        
        // Exit with error code if critical issues found
        if (this.errors.length > 0) {
            console.log('⚠️  Validation completed with critical issues');
            process.exit(1);
        } else {
            console.log('✅ Validation completed successfully');
            process.exit(0);
        }
    }
}

// CLI execution
if (require.main === module) {
    const [,, templatePath, city, region] = process.argv;
    
    if (!templatePath) {
        console.error('Usage: node seo-optimization-validator.js <template-path> [city] [region]');
        console.error('Example: node seo-optimization-validator.js ../templates/assistenza-it-seo-optimized.html Milano Lombardia');
        process.exit(1);
    }
    
    const validator = new SEOValidator(
        path.resolve(templatePath),
        city || 'Milano',
        region || 'Lombardia'
    );
    
    validator.validate().catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = SEOValidator;