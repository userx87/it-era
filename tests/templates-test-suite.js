/**
 * IT-ERA Templates Comprehensive Test Suite
 * Tests all templates for SEO, accessibility, performance, conversion optimization
 */

const { JSDOM } = require('jsdom');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class ITEraTemplateTestSuite {
    constructor() {
        this.testResults = [];
        this.templates = [
            {
                name: 'assistenza-it-template-new.html',
                path: '/Users/andreapanzeri/progetti/IT-ERA/templates/assistenza-it-template-new.html',
                type: 'assistenza-it',
                expectedCTAs: ['039 888 2041', 'Richiedi Assistenza', 'Inizia Ora']
            },
            {
                name: 'sicurezza-informatica-modern.html', 
                path: '/Users/andreapanzeri/progetti/IT-ERA/templates/sicurezza-informatica-modern.html',
                type: 'sicurezza-informatica',
                expectedCTAs: ['Security Assessment Gratuito', 'Demo Live SOC', 'Scegli SOC Advanced']
            },
            {
                name: 'cloud-storage-perfect.html',
                path: '/Users/andreapanzeri/progetti/IT-ERA/templates/cloud-storage-perfect.html', 
                type: 'cloud-storage',
                expectedCTAs: ['Inizia Gratis', 'Configura Backup', 'Inizia Gratis Ora']
            }
        ];
    }

    async runAllTests() {
        console.log('🚀 Starting IT-ERA Template Test Suite...');
        
        for (const template of this.templates) {
            console.log(`\n📄 Testing template: ${template.name}`);
            
            const dom = await this.loadTemplate(template.path);
            if (!dom) continue;
            
            // Run all test categories
            await this.testSEOOptimization(dom, template);
            await this.testAccessibility(dom, template);
            await this.testMobileResponsiveness(dom, template);
            await this.testFormFunctionality(dom, template);
            await this.testPerformance(dom, template);
            await this.testConversionOptimization(dom, template);
            await this.testTemplatePlaceholders(dom, template);
        }
        
        // Generate comprehensive report
        await this.generateReport();
    }

    async loadTemplate(templatePath) {
        try {
            const html = await fs.readFile(templatePath, 'utf8');
            return new JSDOM(html, {
                url: 'https://it-era.pages.dev',
                referrer: 'https://it-era.pages.dev',
                contentType: 'text/html',
                includeNodeLocations: true,
                storageQuota: 10000000
            });
        } catch (error) {
            console.error(`❌ Failed to load template ${templatePath}:`, error.message);
            return null;
        }
    }

    async testSEOOptimization(dom, template) {
        const document = dom.window.document;
        const results = [];

        // Title tag test
        const title = document.querySelector('title');
        results.push({
            test: 'Title Tag',
            status: title && title.textContent.length > 30 && title.textContent.length < 60 ? 'PASS' : 'FAIL',
            value: title ? title.textContent : 'Missing',
            recommendation: title ? (title.textContent.length > 60 ? 'Shorten title to under 60 chars' : 'Good length') : 'Add title tag'
        });

        // Meta description test
        const metaDesc = document.querySelector('meta[name="description"]');
        results.push({
            test: 'Meta Description',
            status: metaDesc && metaDesc.content.length > 120 && metaDesc.content.length < 160 ? 'PASS' : 'FAIL',
            value: metaDesc ? metaDesc.content : 'Missing',
            recommendation: metaDesc ? (metaDesc.content.length > 160 ? 'Shorten description to under 160 chars' : 'Good length') : 'Add meta description'
        });

        // H1 structure test
        const h1Tags = document.querySelectorAll('h1');
        results.push({
            test: 'H1 Structure',
            status: h1Tags.length === 1 ? 'PASS' : 'FAIL',
            value: `Found ${h1Tags.length} H1 tags`,
            recommendation: h1Tags.length === 1 ? 'Perfect' : h1Tags.length > 1 ? 'Use only one H1 tag' : 'Add H1 tag'
        });

        // Schema.org structured data test
        const schemaScript = document.querySelector('script[type="application/ld+json"]');
        let schemaValid = false;
        if (schemaScript) {
            try {
                const schema = JSON.parse(schemaScript.textContent);
                schemaValid = schema['@context'] === 'https://schema.org' && schema['@type'];
            } catch (e) {
                schemaValid = false;
            }
        }
        results.push({
            test: 'Schema.org Structured Data',
            status: schemaValid ? 'PASS' : 'FAIL',
            value: schemaValid ? 'Valid LocalBusiness schema found' : 'Invalid or missing schema',
            recommendation: schemaValid ? 'Schema implemented correctly' : 'Add valid LocalBusiness schema.org markup'
        });

        // Open Graph tags test
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDescription = document.querySelector('meta[property="og:description"]');
        const ogImage = document.querySelector('meta[property="og:image"]');
        results.push({
            test: 'Open Graph Tags',
            status: ogTitle && ogDescription && ogImage ? 'PASS' : 'WARN',
            value: `Title: ${!!ogTitle}, Description: ${!!ogDescription}, Image: ${!!ogImage}`,
            recommendation: ogTitle && ogDescription && ogImage ? 'All OG tags present' : 'Complete Open Graph implementation'
        });

        // Canonical URL test
        const canonical = document.querySelector('link[rel="canonical"]');
        results.push({
            test: 'Canonical URL',
            status: canonical ? 'PASS' : 'FAIL',
            value: canonical ? canonical.href : 'Missing',
            recommendation: canonical ? 'Canonical URL set' : 'Add canonical URL'
        });

        this.testResults.push({
            template: template.name,
            category: 'SEO Optimization',
            results: results
        });
    }

    async testAccessibility(dom, template) {
        const document = dom.window.document;
        const results = [];

        // Skip link test
        const skipLink = document.querySelector('.skip-link, a[href="#main-content"]');
        results.push({
            test: 'Skip Navigation Link',
            status: skipLink ? 'PASS' : 'FAIL',
            value: skipLink ? 'Skip link found' : 'Missing',
            recommendation: skipLink ? 'Skip navigation implemented' : 'Add skip to content link for screen readers'
        });

        // Alt text for images
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
        results.push({
            test: 'Image Alt Text',
            status: imagesWithoutAlt.length === 0 ? 'PASS' : 'FAIL',
            value: `${images.length} images, ${imagesWithoutAlt.length} without alt text`,
            recommendation: imagesWithoutAlt.length === 0 ? 'All images have alt text' : 'Add alt text to all images'
        });

        // Form labels test
        const inputs = document.querySelectorAll('input, textarea, select');
        let inputsWithoutLabels = 0;
        inputs.forEach(input => {
            const hasLabel = document.querySelector(`label[for="${input.id}"]`) || 
                             input.getAttribute('aria-label') || 
                             input.getAttribute('placeholder');
            if (!hasLabel) inputsWithoutLabels++;
        });
        results.push({
            test: 'Form Input Labels',
            status: inputsWithoutLabels === 0 ? 'PASS' : 'FAIL',
            value: `${inputs.length} inputs, ${inputsWithoutLabels} without labels`,
            recommendation: inputsWithoutLabels === 0 ? 'All inputs properly labeled' : 'Add labels or aria-label to all form inputs'
        });

        // Color contrast test (basic check for dark backgrounds with light text)
        const darkBackgrounds = document.querySelectorAll('.bg-dark, .navbar-dark, [style*="background: #"], [style*="background-color: #"]');
        results.push({
            test: 'Color Contrast Elements',
            status: darkBackgrounds.length > 0 ? 'WARN' : 'PASS',
            value: `${darkBackgrounds.length} elements with potential contrast issues`,
            recommendation: 'Manual color contrast testing recommended with tools like WebAIM Contrast Checker'
        });

        // ARIA landmarks
        const main = document.querySelector('main');
        const nav = document.querySelector('nav');
        const footer = document.querySelector('footer');
        results.push({
            test: 'ARIA Landmarks',
            status: main && nav && footer ? 'PASS' : 'WARN',
            value: `Main: ${!!main}, Nav: ${!!nav}, Footer: ${!!footer}`,
            recommendation: main && nav && footer ? 'Semantic landmarks present' : 'Ensure main, nav, and footer elements are present'
        });

        // Focus indicators check
        const styleSheets = document.querySelectorAll('style');
        let hasFocusStyles = false;
        styleSheets.forEach(style => {
            if (style.textContent.includes(':focus')) {
                hasFocusStyles = true;
            }
        });
        results.push({
            test: 'Focus Indicators',
            status: hasFocusStyles ? 'PASS' : 'FAIL',
            value: hasFocusStyles ? 'Focus styles detected' : 'No focus styles found',
            recommendation: hasFocusStyles ? 'Focus indicators implemented' : 'Add visible focus indicators for keyboard navigation'
        });

        this.testResults.push({
            template: template.name,
            category: 'Accessibility (WCAG AAA)',
            results: results
        });
    }

    async testMobileResponsiveness(dom, template) {
        const document = dom.window.document;
        const results = [];

        // Viewport meta tag test
        const viewport = document.querySelector('meta[name="viewport"]');
        results.push({
            test: 'Viewport Meta Tag',
            status: viewport && viewport.content.includes('width=device-width') ? 'PASS' : 'FAIL',
            value: viewport ? viewport.content : 'Missing',
            recommendation: viewport ? 'Viewport properly configured' : 'Add viewport meta tag for mobile responsiveness'
        });

        // Bootstrap responsive classes
        const html = document.documentElement.outerHTML;
        const responsiveClasses = ['col-sm-', 'col-md-', 'col-lg-', 'col-xl-', 'd-sm-', 'd-md-', 'd-lg-'];
        const hasResponsive = responsiveClasses.some(cls => html.includes(cls));
        results.push({
            test: 'Responsive Grid Classes',
            status: hasResponsive ? 'PASS' : 'WARN',
            value: hasResponsive ? 'Bootstrap responsive classes found' : 'Limited responsive classes',
            recommendation: hasResponsive ? 'Responsive design implemented' : 'Add more responsive breakpoint classes'
        });

        // Touch target size check (buttons should be at least 44px)
        const buttons = document.querySelectorAll('button, .btn, a[class*="btn"]');
        results.push({
            test: 'Touch Target Size',
            status: buttons.length > 0 ? 'WARN' : 'PASS',
            value: `${buttons.length} interactive elements found`,
            recommendation: 'Verify all buttons/links are at least 44px in height for touch accessibility'
        });

        // Mobile navigation test
        const mobileToggle = document.querySelector('.navbar-toggler, [data-bs-toggle="collapse"]');
        results.push({
            test: 'Mobile Navigation',
            status: mobileToggle ? 'PASS' : 'FAIL',
            value: mobileToggle ? 'Mobile menu toggle found' : 'No mobile navigation',
            recommendation: mobileToggle ? 'Mobile navigation implemented' : 'Add mobile-friendly navigation toggle'
        });

        // Media queries in CSS
        const styleContent = Array.from(document.querySelectorAll('style'))
            .map(style => style.textContent).join(' ');
        const hasMediaQueries = styleContent.includes('@media');
        results.push({
            test: 'CSS Media Queries',
            status: hasMediaQueries ? 'PASS' : 'WARN',
            value: hasMediaQueries ? 'Media queries detected' : 'No media queries found',
            recommendation: hasMediaQueries ? 'Responsive CSS implemented' : 'Add media queries for mobile optimization'
        });

        this.testResults.push({
            template: template.name,
            category: 'Mobile Responsiveness',
            results: results
        });
    }

    async testFormFunctionality(dom, template) {
        const document = dom.window.document;
        const results = [];

        // Contact form presence
        const contactForm = document.querySelector('#contactForm, form[id*="contact"]');
        results.push({
            test: 'Contact Form Present',
            status: contactForm ? 'PASS' : 'FAIL',
            value: contactForm ? 'Contact form found' : 'No contact form',
            recommendation: contactForm ? 'Contact form implemented' : 'Add contact form for lead generation'
        });

        if (contactForm) {
            // Required field validation
            const requiredFields = contactForm.querySelectorAll('[required]');
            results.push({
                test: 'Required Field Validation',
                status: requiredFields.length >= 3 ? 'PASS' : 'WARN',
                value: `${requiredFields.length} required fields`,
                recommendation: requiredFields.length >= 3 ? 'Good required field coverage' : 'Consider adding more required fields (name, email, phone)'
            });

            // Form method and action
            const method = contactForm.method.toLowerCase();
            const hasAction = !!contactForm.action || contactForm.hasAttribute('onsubmit');
            results.push({
                test: 'Form Submission Method',
                status: method === 'post' && hasAction ? 'PASS' : 'WARN',
                value: `Method: ${method}, Has action/handler: ${hasAction}`,
                recommendation: method === 'post' && hasAction ? 'Form properly configured' : 'Ensure POST method and proper form handler'
            });

            // Privacy checkbox
            const privacyCheckbox = contactForm.querySelector('input[name*="privacy"], input[name*="consent"]');
            results.push({
                test: 'Privacy Consent',
                status: privacyCheckbox ? 'PASS' : 'FAIL',
                value: privacyCheckbox ? 'Privacy consent found' : 'No privacy consent',
                recommendation: privacyCheckbox ? 'GDPR compliance implemented' : 'Add privacy consent checkbox for GDPR compliance'
            });
        }

        // Resend API integration check
        const scripts = document.querySelectorAll('script');
        let hasFormHandler = false;
        scripts.forEach(script => {
            if (script.src && script.src.includes('form-handler')) {
                hasFormHandler = true;
            }
            if (script.textContent && (script.textContent.includes('resend') || script.textContent.includes('contact'))) {
                hasFormHandler = true;
            }
        });
        results.push({
            test: 'Form Handler Integration',
            status: hasFormHandler ? 'PASS' : 'WARN',
            value: hasFormHandler ? 'Form handler detected' : 'No form handler found',
            recommendation: hasFormHandler ? 'Form submission configured' : 'Add form submission handler with Resend API integration'
        });

        this.testResults.push({
            template: template.name,
            category: 'Form Functionality',
            results: results
        });
    }

    async testPerformance(dom, template) {
        const document = dom.window.document;
        const results = [];

        // External resource count
        const externalLinks = document.querySelectorAll('link[href^="http"], script[src^="http"]');
        results.push({
            test: 'External Resources',
            status: externalLinks.length < 10 ? 'PASS' : 'WARN',
            value: `${externalLinks.length} external resources`,
            recommendation: externalLinks.length < 10 ? 'Good resource count' : 'Consider reducing external dependencies for faster loading'
        });

        // CDN usage
        const cdnResources = Array.from(externalLinks).filter(link => 
            link.href && (link.href.includes('cdn.') || link.href.includes('jsdelivr') || link.href.includes('cdnjs'))
        );
        results.push({
            test: 'CDN Usage',
            status: cdnResources.length > 0 ? 'PASS' : 'WARN',
            value: `${cdnResources.length} CDN resources`,
            recommendation: cdnResources.length > 0 ? 'Using CDN for performance' : 'Consider using CDN for better performance'
        });

        // Image optimization check
        const images = document.querySelectorAll('img');
        const optimizedImages = Array.from(images).filter(img => 
            img.src && (img.src.includes('.webp') || img.loading === 'lazy' || img.hasAttribute('loading'))
        );
        results.push({
            test: 'Image Optimization',
            status: images.length === 0 || optimizedImages.length > 0 ? 'PASS' : 'WARN',
            value: `${optimizedImages.length}/${images.length} images optimized`,
            recommendation: images.length === 0 ? 'No images to optimize' : optimizedImages.length > 0 ? 'Some optimization present' : 'Add lazy loading and consider WebP format'
        });

        // Inline CSS size check
        const inlineStyles = document.querySelectorAll('style');
        let totalCSSLength = 0;
        inlineStyles.forEach(style => totalCSSLength += style.textContent.length);
        results.push({
            test: 'Inline CSS Size',
            status: totalCSSLength < 50000 ? 'PASS' : 'WARN',
            value: `${(totalCSSLength / 1000).toFixed(1)}KB inline CSS`,
            recommendation: totalCSSLength < 50000 ? 'Reasonable CSS size' : 'Consider extracting large CSS to external files'
        });

        // JavaScript defer/async attributes
        const jsScripts = document.querySelectorAll('script[src]');
        const deferredScripts = Array.from(jsScripts).filter(script => script.defer || script.async);
        results.push({
            test: 'JavaScript Loading',
            status: deferredScripts.length === jsScripts.length ? 'PASS' : 'WARN',
            value: `${deferredScripts.length}/${jsScripts.length} scripts deferred/async`,
            recommendation: deferredScripts.length === jsScripts.length ? 'All scripts optimized' : 'Add defer/async attributes to non-critical scripts'
        });

        this.testResults.push({
            template: template.name,
            category: 'Performance Optimization',
            results: results
        });
    }

    async testConversionOptimization(dom, template) {
        const document = dom.window.document;
        const results = [];

        // Primary CTA buttons
        const ctaButtons = document.querySelectorAll('.btn-primary, .btn-cyber, .btn-primary-custom, [class*="btn"][class*="primary"]');
        results.push({
            test: 'Primary CTA Buttons',
            status: ctaButtons.length >= 2 ? 'PASS' : 'WARN',
            value: `${ctaButtons.length} primary CTA buttons found`,
            recommendation: ctaButtons.length >= 2 ? 'Good CTA coverage' : 'Add more prominent call-to-action buttons'
        });

        // Phone number CTAs
        const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
        results.push({
            test: 'Phone Number CTAs',
            status: phoneLinks.length >= 2 ? 'PASS' : 'WARN',
            value: `${phoneLinks.length} clickable phone numbers`,
            recommendation: phoneLinks.length >= 2 ? 'Good phone CTA coverage' : 'Add more clickable phone numbers for immediate contact'
        });

        // Trust signals (testimonials, reviews, certifications)
        const trustElements = document.querySelectorAll('.testimonial, .rating, .badge, .security-badge, .certification');
        results.push({
            test: 'Trust Signals',
            status: trustElements.length >= 3 ? 'PASS' : 'WARN',
            value: `${trustElements.length} trust signal elements`,
            recommendation: trustElements.length >= 3 ? 'Good trust signal coverage' : 'Add more testimonials, ratings, or certification badges'
        });

        // Pricing transparency
        const pricingElements = document.querySelectorAll('.price, .pricing-card, [class*="price"]');
        results.push({
            test: 'Pricing Transparency',
            status: pricingElements.length >= 1 ? 'PASS' : 'WARN',
            value: `${pricingElements.length} pricing elements`,
            recommendation: pricingElements.length >= 1 ? 'Pricing information visible' : 'Add clear pricing information to build trust'
        });

        // Urgency/scarcity elements
        const urgencyElements = document.querySelectorAll('.badge-danger, [class*="urgent"], [class*="emergency"]');
        const scarcityText = document.body.textContent.toLowerCase();
        const hasUrgencyText = scarcityText.includes('urgente') || scarcityText.includes('emergenza') || scarcityText.includes('24/7');
        results.push({
            test: 'Urgency/Emergency Elements',
            status: urgencyElements.length >= 1 || hasUrgencyText ? 'PASS' : 'WARN',
            value: `${urgencyElements.length} urgency elements, urgency text: ${hasUrgencyText}`,
            recommendation: urgencyElements.length >= 1 || hasUrgencyText ? 'Urgency messaging present' : 'Add urgency elements for immediate response services'
        });

        // Social proof (client count, years in business)
        const socialProof = document.querySelectorAll('.stats-number, .stats-card');
        const bodyText = document.body.textContent;
        const hasClientCount = /\d+\+?\s*(client|aziend|anni)/i.test(bodyText);
        results.push({
            test: 'Social Proof Statistics',
            status: socialProof.length >= 2 || hasClientCount ? 'PASS' : 'WARN',
            value: `${socialProof.length} stat elements, client mentions: ${hasClientCount}`,
            recommendation: socialProof.length >= 2 || hasClientCount ? 'Social proof present' : 'Add statistics about clients served, years in business, etc.'
        });

        this.testResults.push({
            template: template.name,
            category: 'Conversion Optimization',
            results: results
        });
    }

    async testTemplatePlaceholders(dom, template) {
        const document = dom.window.document;
        const results = [];

        const html = document.documentElement.outerHTML;
        
        // Check for city placeholders
        const cityPlaceholders = html.match(/\{\{CITY\}\}/g);
        results.push({
            test: 'City Placeholders',
            status: cityPlaceholders && cityPlaceholders.length >= 3 ? 'PASS' : 'FAIL',
            value: cityPlaceholders ? `${cityPlaceholders.length} {{CITY}} placeholders` : 'No city placeholders',
            recommendation: cityPlaceholders && cityPlaceholders.length >= 3 ? 'City templating implemented' : 'Add {{CITY}} placeholders for localization'
        });

        // Check for region placeholders
        const regionPlaceholders = html.match(/\{\{REGION\}\}/g);
        results.push({
            test: 'Region Placeholders',
            status: regionPlaceholders && regionPlaceholders.length >= 1 ? 'PASS' : 'WARN',
            value: regionPlaceholders ? `${regionPlaceholders.length} {{REGION}} placeholders` : 'No region placeholders',
            recommendation: regionPlaceholders && regionPlaceholders.length >= 1 ? 'Region templating implemented' : 'Consider adding {{REGION}} placeholders'
        });

        // Check for city slug placeholders
        const citySlugPlaceholders = html.match(/\{\{CITY_SLUG\}\}/g);
        results.push({
            test: 'City Slug Placeholders',
            status: citySlugPlaceholders && citySlugPlaceholders.length >= 1 ? 'PASS' : 'WARN',
            value: citySlugPlaceholders ? `${citySlugPlaceholders.length} {{CITY_SLUG}} placeholders` : 'No city slug placeholders',
            recommendation: citySlugPlaceholders && citySlugPlaceholders.length >= 1 ? 'URL templating implemented' : 'Add {{CITY_SLUG}} for URL generation'
        });

        // Check for hardcoded city names that should be templated
        const hardcodedCities = html.match(/Milano(?!\s*\{\{)/g);
        results.push({
            test: 'Hardcoded City Names',
            status: !hardcodedCities || hardcodedCities.length === 0 ? 'PASS' : 'WARN',
            value: hardcodedCities ? `${hardcodedCities.length} hardcoded "Milano" references` : 'No hardcoded cities found',
            recommendation: !hardcodedCities || hardcodedCities.length === 0 ? 'No hardcoded city names' : 'Replace hardcoded city names with {{CITY}} placeholders'
        });

        // Template consistency check
        const allPlaceholders = html.match(/\{\{[A-Z_]+\}\}/g);
        const uniquePlaceholders = allPlaceholders ? [...new Set(allPlaceholders)] : [];
        results.push({
            test: 'Template Placeholder Consistency',
            status: uniquePlaceholders.length >= 2 ? 'PASS' : 'WARN',
            value: `${uniquePlaceholders.length} unique placeholders: ${uniquePlaceholders.join(', ')}`,
            recommendation: uniquePlaceholders.length >= 2 ? 'Good placeholder coverage' : 'Add more template placeholders for better localization'
        });

        this.testResults.push({
            template: template.name,
            category: 'Template Placeholders',
            results: results
        });
    }

    async generateReport() {
        const reportDate = new Date().toISOString().split('T')[0];
        const report = {
            testDate: reportDate,
            summary: this.generateSummary(),
            templateResults: this.testResults,
            recommendations: this.generateRecommendations()
        };

        // Write JSON report
        await fs.writeFile(
            `/Users/andreapanzeri/progetti/IT-ERA/tests/template-test-report-${reportDate}.json`,
            JSON.stringify(report, null, 2)
        );

        // Write HTML report
        const htmlReport = this.generateHTMLReport(report);
        await fs.writeFile(
            `/Users/andreapanzeri/progetti/IT-ERA/tests/template-test-report-${reportDate}.html`,
            htmlReport
        );

        console.log(`\n📋 Test Report Generated:`);
        console.log(`- JSON: /tests/template-test-report-${reportDate}.json`);
        console.log(`- HTML: /tests/template-test-report-${reportDate}.html`);

        return report;
    }

    generateSummary() {
        const summary = {};
        
        this.templates.forEach(template => {
            const templateResults = this.testResults.filter(r => r.template === template.name);
            let totalTests = 0;
            let passedTests = 0;
            let failedTests = 0;
            let warnings = 0;
            
            templateResults.forEach(category => {
                category.results.forEach(result => {
                    totalTests++;
                    if (result.status === 'PASS') passedTests++;
                    else if (result.status === 'FAIL') failedTests++;
                    else if (result.status === 'WARN') warnings++;
                });
            });
            
            summary[template.name] = {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                warnings: warnings,
                score: Math.round((passedTests / totalTests) * 100)
            };
        });
        
        return summary;
    }

    generateRecommendations() {
        const recommendations = {
            critical: [],
            important: [],
            minor: []
        };

        this.testResults.forEach(categoryResult => {
            categoryResult.results.forEach(result => {
                if (result.status === 'FAIL') {
                    if (result.test.includes('SEO') || result.test.includes('Form') || result.test.includes('Accessibility')) {
                        recommendations.critical.push({
                            template: categoryResult.template,
                            category: categoryResult.category,
                            test: result.test,
                            recommendation: result.recommendation
                        });
                    } else {
                        recommendations.important.push({
                            template: categoryResult.template,
                            category: categoryResult.category,
                            test: result.test,
                            recommendation: result.recommendation
                        });
                    }
                } else if (result.status === 'WARN') {
                    recommendations.minor.push({
                        template: categoryResult.template,
                        category: categoryResult.category,
                        test: result.test,
                        recommendation: result.recommendation
                    });
                }
            });
        });

        return recommendations;
    }

    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Template Test Report - ${report.testDate}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .test-pass { color: #198754; }
        .test-fail { color: #dc3545; }
        .test-warn { color: #fd7e14; }
        .score-excellent { background: #198754; }
        .score-good { background: #20c997; }
        .score-fair { background: #ffc107; }
        .score-poor { background: #dc3545; }
    </style>
</head>
<body class="bg-light">
    <div class="container py-5">
        <div class="row">
            <div class="col-12">
                <h1 class="mb-4">🧪 IT-ERA Template Test Report</h1>
                <p class="text-muted">Generated on ${report.testDate}</p>
                
                <!-- Summary Cards -->
                <div class="row mb-5">
                    ${Object.entries(report.summary).map(([template, summary]) => `
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">${template}</h6>
                                <span class="badge ${summary.score >= 90 ? 'score-excellent' : summary.score >= 80 ? 'score-good' : summary.score >= 70 ? 'score-fair' : 'score-poor'} text-white">
                                    ${summary.score}%
                                </span>
                            </div>
                            <div class="card-body">
                                <div class="row text-center">
                                    <div class="col-3">
                                        <div class="test-pass">${summary.passed}</div>
                                        <small>Pass</small>
                                    </div>
                                    <div class="col-3">
                                        <div class="test-fail">${summary.failed}</div>
                                        <small>Fail</small>
                                    </div>
                                    <div class="col-3">
                                        <div class="test-warn">${summary.warnings}</div>
                                        <small>Warn</small>
                                    </div>
                                    <div class="col-3">
                                        <div class="text-muted">${summary.total}</div>
                                        <small>Total</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>

                <!-- Detailed Results -->
                ${report.templateResults.map(categoryResult => `
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">${categoryResult.template} - ${categoryResult.category}</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Test</th>
                                        <th>Status</th>
                                        <th>Value</th>
                                        <th>Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${categoryResult.results.map(result => `
                                    <tr>
                                        <td>${result.test}</td>
                                        <td><span class="badge ${result.status === 'PASS' ? 'bg-success' : result.status === 'FAIL' ? 'bg-danger' : 'bg-warning'}">${result.status}</span></td>
                                        <td><small>${result.value}</small></td>
                                        <td><small>${result.recommendation}</small></td>
                                    </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                `).join('')}

                <!-- Recommendations -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">📋 Recommendations</h5>
                    </div>
                    <div class="card-body">
                        ${report.recommendations.critical.length > 0 ? `
                        <h6 class="text-danger">🚨 Critical Issues</h6>
                        <ul class="list-group list-group-flush mb-3">
                            ${report.recommendations.critical.map(rec => `
                            <li class="list-group-item">
                                <strong>${rec.template}</strong> - ${rec.category}: ${rec.test}
                                <br><small class="text-muted">${rec.recommendation}</small>
                            </li>
                            `).join('')}
                        </ul>
                        ` : ''}

                        ${report.recommendations.important.length > 0 ? `
                        <h6 class="text-warning">⚠️ Important Issues</h6>
                        <ul class="list-group list-group-flush mb-3">
                            ${report.recommendations.important.map(rec => `
                            <li class="list-group-item">
                                <strong>${rec.template}</strong> - ${rec.category}: ${rec.test}
                                <br><small class="text-muted">${rec.recommendation}</small>
                            </li>
                            `).join('')}
                        </ul>
                        ` : ''}

                        ${report.recommendations.minor.length > 0 ? `
                        <h6 class="text-info">💡 Minor Improvements</h6>
                        <ul class="list-group list-group-flush">
                            ${report.recommendations.minor.map(rec => `
                            <li class="list-group-item">
                                <strong>${rec.template}</strong> - ${rec.category}: ${rec.test}
                                <br><small class="text-muted">${rec.recommendation}</small>
                            </li>
                            `).join('')}
                        </ul>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
        `;
    }
}

// Export for use
module.exports = ITEraTemplateTestSuite;

// Run tests if called directly
if (require.main === module) {
    const testSuite = new ITEraTemplateTestSuite();
    testSuite.runAllTests()
        .then(() => console.log('✅ All tests completed successfully'))
        .catch(error => console.error('❌ Test suite failed:', error));
}