#!/usr/bin/env node

/**
 * Comprehensive Validation Suite for IT-ERA Assistenza-IT Pages
 * 
 * This suite validates:
 * 1. Placeholder replacement ({{CITY}}, {{CITY_SLUG}}, etc.)
 * 2. Contact form functionality
 * 3. Mobile responsiveness
 * 4. Performance and loading speed
 * 5. Internal link validation
 * 6. SEO compliance
 * 
 * Usage: node comprehensive-validation-suite.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ValidationSuite {
    constructor() {
        this.browser = null;
        this.results = {
            summary: {
                totalPages: 0,
                passedPages: 0,
                failedPages: 0,
                issues: []
            },
            pageResults: {}
        };
        
        // Sample of 10 assistenza-it pages for testing
        this.testPages = [
            'assistenza-it-milano.html',
            'assistenza-it-monza.html',
            'assistenza-it-bergamo.html',
            'assistenza-it-como.html',
            'assistenza-it-lecco.html',
            'assistenza-it-vimercate.html',
            'assistenza-it-seregno.html',
            'assistenza-it-lissone.html',
            'assistenza-it-dalmine.html',
            'assistenza-it-bollate.html'
        ];
        
        this.baseUrl = 'https://it-era.pages.dev/pages/';
        this.localPath = '/Users/andreapanzeri/progetti/IT-ERA/web/pages/';
    }

    async init() {
        console.log('🚀 Initializing Comprehensive Validation Suite...');
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });
    }

    async validatePage(pageName) {
        console.log(`\n📋 Validating: ${pageName}`);
        
        const page = await this.browser.newPage();
        const pageResults = {
            pageName,
            scores: {
                placeholders: 0,
                forms: 0,
                mobile: 0,
                performance: 0,
                links: 0,
                seo: 0
            },
            issues: [],
            details: {}
        };

        try {
            // Set user agent for mobile testing
            await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15');
            
            // Navigate to page
            const url = `${this.baseUrl}${pageName}`;
            const startTime = Date.now();
            
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            const loadTime = Date.now() - startTime;
            pageResults.details.loadTime = loadTime;

            // Run all validation tests
            await this.validatePlaceholders(page, pageResults);
            await this.validateContactForm(page, pageResults);
            await this.validateMobileResponsive(page, pageResults);
            await this.validatePerformance(page, pageResults, loadTime);
            await this.validateInternalLinks(page, pageResults);
            await this.validateSEO(page, pageResults);

            // Calculate overall score
            const scores = pageResults.scores;
            const overallScore = Math.round(
                (scores.placeholders + scores.forms + scores.mobile + 
                 scores.performance + scores.links + scores.seo) / 6
            );
            
            pageResults.overallScore = overallScore;
            console.log(`📊 Overall Score for ${pageName}: ${overallScore}/100`);

        } catch (error) {
            pageResults.issues.push({
                type: 'CRITICAL_ERROR',
                message: `Failed to load or validate page: ${error.message}`
            });
            pageResults.overallScore = 0;
            console.error(`❌ Critical error validating ${pageName}:`, error.message);
        }

        await page.close();
        return pageResults;
    }

    async validatePlaceholders(page, results) {
        console.log('  🔍 Testing placeholder replacement...');
        
        try {
            const content = await page.content();
            const placeholderIssues = [];
            
            // Check for common placeholder patterns
            const placeholders = [
                '{{CITY}}',
                '{{CITY_SLUG}}',
                '{{PROVINCE}}',
                '{{REGION}}',
                '{{SERVICE_NAME}}',
                '{{PLACEHOLDER}}'
            ];

            let foundPlaceholders = 0;
            placeholders.forEach(placeholder => {
                if (content.includes(placeholder)) {
                    foundPlaceholders++;
                    placeholderIssues.push({
                        type: 'PLACEHOLDER_NOT_REPLACED',
                        message: `Found unreplaced placeholder: ${placeholder}`
                    });
                }
            });

            // Check for proper city name replacement
            const cityName = await page.$eval('title', el => el.textContent);
            const match = cityName.match(/Assistenza IT\s+(.+?)\s+\|/);
            if (match) {
                const extractedCity = match[1];
                results.details.cityName = extractedCity;
                
                // Verify city name appears in content
                const cityCount = (content.match(new RegExp(extractedCity, 'gi')) || []).length;
                if (cityCount < 5) {
                    placeholderIssues.push({
                        type: 'INSUFFICIENT_CITY_REFERENCES',
                        message: `City "${extractedCity}" appears only ${cityCount} times in content`
                    });
                }
            } else {
                placeholderIssues.push({
                    type: 'CITY_NOT_FOUND_IN_TITLE',
                    message: 'Could not extract city name from title'
                });
            }

            // Score calculation
            if (foundPlaceholders === 0 && placeholderIssues.length <= 1) {
                results.scores.placeholders = 100;
            } else if (foundPlaceholders === 0) {
                results.scores.placeholders = 85;
            } else if (foundPlaceholders <= 2) {
                results.scores.placeholders = 60;
            } else {
                results.scores.placeholders = 20;
            }

            results.issues.push(...placeholderIssues);
            console.log(`    ✅ Placeholder Score: ${results.scores.placeholders}/100`);

        } catch (error) {
            results.issues.push({
                type: 'PLACEHOLDER_TEST_ERROR',
                message: `Failed to test placeholders: ${error.message}`
            });
            results.scores.placeholders = 0;
        }
    }

    async validateContactForm(page, results) {
        console.log('  📝 Testing contact form functionality...');
        
        try {
            const formIssues = [];
            
            // Check if form exists
            const form = await page.$('#contactForm');
            if (!form) {
                formIssues.push({
                    type: 'FORM_NOT_FOUND',
                    message: 'Contact form with ID "contactForm" not found'
                });
                results.scores.forms = 0;
                results.issues.push(...formIssues);
                return;
            }

            // Check required fields
            const requiredFields = ['nome', 'email', 'telefono'];
            let missingFields = 0;
            
            for (const field of requiredFields) {
                const element = await page.$(`input[name="${field}"]`);
                if (!element) {
                    missingFields++;
                    formIssues.push({
                        type: 'REQUIRED_FIELD_MISSING',
                        message: `Required field "${field}" not found`
                    });
                } else {
                    const isRequired = await page.$eval(`input[name="${field}"]`, el => el.hasAttribute('required'));
                    if (!isRequired) {
                        formIssues.push({
                            type: 'FIELD_NOT_REQUIRED',
                            message: `Field "${field}" should be marked as required`
                        });
                    }
                }
            }

            // Test form interaction
            try {
                await page.type('input[name="nome"]', 'Test User');
                await page.type('input[name="email"]', 'test@example.com');
                await page.type('input[name="telefono"]', '+39 123 456 7890');
                
                // Check if privacy checkbox exists
                const privacyCheckbox = await page.$('input[name="privacy"]');
                if (!privacyCheckbox) {
                    formIssues.push({
                        type: 'PRIVACY_CHECKBOX_MISSING',
                        message: 'Privacy consent checkbox not found'
                    });
                }

            } catch (error) {
                formIssues.push({
                    type: 'FORM_INTERACTION_ERROR',
                    message: `Could not interact with form fields: ${error.message}`
                });
            }

            // Score calculation
            if (formIssues.length === 0) {
                results.scores.forms = 100;
            } else if (missingFields === 0 && formIssues.length <= 2) {
                results.scores.forms = 80;
            } else if (missingFields <= 1) {
                results.scores.forms = 60;
            } else {
                results.scores.forms = 30;
            }

            results.issues.push(...formIssues);
            console.log(`    ✅ Form Score: ${results.scores.forms}/100`);

        } catch (error) {
            results.issues.push({
                type: 'FORM_TEST_ERROR',
                message: `Failed to test contact form: ${error.message}`
            });
            results.scores.forms = 0;
        }
    }

    async validateMobileResponsive(page, results) {
        console.log('  📱 Testing mobile responsiveness...');
        
        try {
            const mobileIssues = [];
            
            // Test different viewport sizes
            const viewports = [
                { width: 375, height: 667, name: 'iPhone SE' },
                { width: 768, height: 1024, name: 'iPad' },
                { width: 1200, height: 800, name: 'Desktop' }
            ];

            for (const viewport of viewports) {
                await page.setViewport(viewport);
                await page.waitForTimeout(500); // Allow for responsive adjustments
                
                // Check if navigation menu works on mobile
                if (viewport.width <= 768) {
                    const navToggle = await page.$('.navbar-toggler');
                    if (!navToggle) {
                        mobileIssues.push({
                            type: 'MOBILE_NAV_MISSING',
                            message: `Mobile navigation toggle not found at ${viewport.name} viewport`
                        });
                    } else {
                        // Test if toggle is clickable
                        const isVisible = await page.$eval('.navbar-toggler', el => {
                            const style = window.getComputedStyle(el);
                            return style.display !== 'none' && style.visibility !== 'hidden';
                        });
                        
                        if (!isVisible) {
                            mobileIssues.push({
                                type: 'MOBILE_NAV_HIDDEN',
                                message: `Mobile navigation toggle is hidden at ${viewport.name} viewport`
                            });
                        }
                    }
                }

                // Check for horizontal scrolling
                const hasHorizontalScroll = await page.evaluate(() => {
                    return document.documentElement.scrollWidth > window.innerWidth;
                });

                if (hasHorizontalScroll) {
                    mobileIssues.push({
                        type: 'HORIZONTAL_SCROLL',
                        message: `Page has horizontal scroll at ${viewport.name} viewport`
                    });
                }

                // Check if content is readable (font size)
                const fontSize = await page.$eval('body', el => {
                    return window.getComputedStyle(el).fontSize;
                });
                
                const fontSizeValue = parseInt(fontSize);
                if (viewport.width <= 768 && fontSizeValue < 14) {
                    mobileIssues.push({
                        type: 'SMALL_FONT_MOBILE',
                        message: `Font size too small (${fontSize}) for mobile viewport`
                    });
                }
            }

            // Reset to desktop viewport
            await page.setViewport({ width: 1200, height: 800 });

            // Score calculation
            if (mobileIssues.length === 0) {
                results.scores.mobile = 100;
            } else if (mobileIssues.length <= 2) {
                results.scores.mobile = 80;
            } else if (mobileIssues.length <= 4) {
                results.scores.mobile = 60;
            } else {
                results.scores.mobile = 30;
            }

            results.issues.push(...mobileIssues);
            console.log(`    ✅ Mobile Score: ${results.scores.mobile}/100`);

        } catch (error) {
            results.issues.push({
                type: 'MOBILE_TEST_ERROR',
                message: `Failed to test mobile responsiveness: ${error.message}`
            });
            results.scores.mobile = 0;
        }
    }

    async validatePerformance(page, results, loadTime) {
        console.log('  ⚡ Testing performance and loading speed...');
        
        try {
            const performanceIssues = [];
            
            // Analyze load time
            if (loadTime > 5000) {
                performanceIssues.push({
                    type: 'SLOW_LOAD_TIME',
                    message: `Page load time is too slow: ${loadTime}ms`
                });
            } else if (loadTime > 3000) {
                performanceIssues.push({
                    type: 'MODERATE_LOAD_TIME',
                    message: `Page load time is moderate: ${loadTime}ms`
                });
            }

            // Check resource loading
            const metrics = await page.metrics();
            results.details.metrics = metrics;

            // Check for render-blocking resources
            const stylesheets = await page.$$('link[rel="stylesheet"]');
            const scripts = await page.$$('script[src]');
            
            if (stylesheets.length > 5) {
                performanceIssues.push({
                    type: 'TOO_MANY_STYLESHEETS',
                    message: `Too many stylesheets (${stylesheets.length}), consider combining`
                });
            }

            if (scripts.length > 8) {
                performanceIssues.push({
                    type: 'TOO_MANY_SCRIPTS',
                    message: `Too many scripts (${scripts.length}), consider combining`
                });
            }

            // Check for large images without optimization
            const images = await page.$$('img');
            let unoptimizedImages = 0;
            
            for (const img of images) {
                const src = await img.evaluate(el => el.src);
                if (src && !src.includes('webp') && !src.includes('data:image/svg')) {
                    unoptimizedImages++;
                }
            }

            if (unoptimizedImages > 3) {
                performanceIssues.push({
                    type: 'UNOPTIMIZED_IMAGES',
                    message: `${unoptimizedImages} images without WebP optimization`
                });
            }

            // Score calculation
            let performanceScore = 100;
            if (loadTime > 5000) performanceScore -= 40;
            else if (loadTime > 3000) performanceScore -= 20;
            else if (loadTime > 2000) performanceScore -= 10;
            
            performanceScore -= Math.min(performanceIssues.length * 10, 40);
            results.scores.performance = Math.max(performanceScore, 0);

            results.issues.push(...performanceIssues);
            console.log(`    ✅ Performance Score: ${results.scores.performance}/100`);

        } catch (error) {
            results.issues.push({
                type: 'PERFORMANCE_TEST_ERROR',
                message: `Failed to test performance: ${error.message}`
            });
            results.scores.performance = 0;
        }
    }

    async validateInternalLinks(page, results) {
        console.log('  🔗 Testing internal links...');
        
        try {
            const linkIssues = [];
            
            // Get all internal links
            const links = await page.$$eval('a[href]', links => 
                links.map(link => ({
                    href: link.href,
                    text: link.textContent.trim()
                })).filter(link => 
                    link.href.includes('it-era.pages.dev') || 
                    link.href.startsWith('/') ||
                    link.href.startsWith('#')
                )
            );

            results.details.internalLinksCount = links.length;

            // Test a sample of links
            const sampleLinks = links.slice(0, 10); // Test first 10 links
            let brokenLinks = 0;

            for (const link of sampleLinks) {
                try {
                    if (link.href.startsWith('#')) {
                        // Check if anchor exists on page
                        const anchor = await page.$(link.href);
                        if (!anchor) {
                            brokenLinks++;
                            linkIssues.push({
                                type: 'BROKEN_ANCHOR_LINK',
                                message: `Anchor link "${link.href}" target not found`
                            });
                        }
                    } else if (link.href.startsWith('/') || link.href.includes('it-era.pages.dev')) {
                        // Test internal page links (simplified check)
                        const newPage = await this.browser.newPage();
                        try {
                            const response = await newPage.goto(link.href, { 
                                waitUntil: 'networkidle2',
                                timeout: 10000 
                            });
                            if (!response.ok()) {
                                brokenLinks++;
                                linkIssues.push({
                                    type: 'BROKEN_INTERNAL_LINK',
                                    message: `Internal link "${link.href}" returns ${response.status()}`
                                });
                            }
                        } catch (error) {
                            brokenLinks++;
                            linkIssues.push({
                                type: 'BROKEN_INTERNAL_LINK',
                                message: `Internal link "${link.href}" failed to load: ${error.message}`
                            });
                        }
                        await newPage.close();
                    }
                } catch (error) {
                    linkIssues.push({
                        type: 'LINK_TEST_ERROR',
                        message: `Error testing link "${link.href}": ${error.message}`
                    });
                }
            }

            // Score calculation
            const linkSuccessRate = sampleLinks.length > 0 ? 
                ((sampleLinks.length - brokenLinks) / sampleLinks.length) * 100 : 100;
            
            results.scores.links = Math.round(linkSuccessRate);
            results.issues.push(...linkIssues);
            console.log(`    ✅ Links Score: ${results.scores.links}/100`);

        } catch (error) {
            results.issues.push({
                type: 'LINK_TEST_ERROR',
                message: `Failed to test internal links: ${error.message}`
            });
            results.scores.links = 0;
        }
    }

    async validateSEO(page, results) {
        console.log('  🔍 Testing SEO compliance...');
        
        try {
            const seoIssues = [];
            
            // Check title tag
            const title = await page.$eval('title', el => el.textContent);
            if (!title || title.length < 30 || title.length > 60) {
                seoIssues.push({
                    type: 'TITLE_LENGTH_ISSUE',
                    message: `Title length (${title?.length || 0}) should be 30-60 characters`
                });
            }

            // Check meta description
            const metaDescription = await page.$eval('meta[name="description"]', 
                el => el.getAttribute('content')).catch(() => null);
            if (!metaDescription || metaDescription.length < 120 || metaDescription.length > 160) {
                seoIssues.push({
                    type: 'META_DESCRIPTION_ISSUE',
                    message: `Meta description length (${metaDescription?.length || 0}) should be 120-160 characters`
                });
            }

            // Check canonical URL
            const canonical = await page.$('link[rel="canonical"]');
            if (!canonical) {
                seoIssues.push({
                    type: 'CANONICAL_MISSING',
                    message: 'Canonical URL tag is missing'
                });
            }

            // Check structured data
            const jsonLd = await page.$('script[type="application/ld+json"]');
            if (!jsonLd) {
                seoIssues.push({
                    type: 'STRUCTURED_DATA_MISSING',
                    message: 'JSON-LD structured data is missing'
                });
            }

            // Check Open Graph tags
            const ogTitle = await page.$('meta[property="og:title"]');
            const ogDescription = await page.$('meta[property="og:description"]');
            
            if (!ogTitle || !ogDescription) {
                seoIssues.push({
                    type: 'OPEN_GRAPH_INCOMPLETE',
                    message: 'Open Graph title or description is missing'
                });
            }

            // Check heading structure
            const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', els => 
                els.map(el => ({ tag: el.tagName, text: el.textContent.trim() }))
            );

            const h1Count = headings.filter(h => h.tag === 'H1').length;
            if (h1Count !== 1) {
                seoIssues.push({
                    type: 'H1_COUNT_ISSUE',
                    message: `Found ${h1Count} H1 tags, should be exactly 1`
                });
            }

            // Score calculation
            let seoScore = 100;
            seoScore -= seoIssues.length * 15;
            results.scores.seo = Math.max(seoScore, 0);

            results.issues.push(...seoIssues);
            console.log(`    ✅ SEO Score: ${results.scores.seo}/100`);

        } catch (error) {
            results.issues.push({
                type: 'SEO_TEST_ERROR',
                message: `Failed to test SEO compliance: ${error.message}`
            });
            results.scores.seo = 0;
        }
    }

    async runValidation() {
        console.log('🎯 Starting comprehensive validation of assistenza-it pages...\n');
        
        this.results.summary.totalPages = this.testPages.length;

        for (const pageName of this.testPages) {
            const pageResults = await this.validatePage(pageName);
            this.results.pageResults[pageName] = pageResults;
            
            if (pageResults.overallScore >= 70) {
                this.results.summary.passedPages++;
            } else {
                this.results.summary.failedPages++;
            }
        }

        await this.generateReport();
    }

    async generateReport() {
        console.log('\n📊 Generating comprehensive validation report...');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/validation/validation-report-${timestamp}.json`;
        const htmlReportPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/validation/validation-report-${timestamp}.html`;

        // Save JSON report
        await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
        
        // Generate HTML report
        const htmlReport = this.generateHTMLReport();
        await fs.writeFile(htmlReportPath, htmlReport);

        // Generate console summary
        this.printSummary();

        console.log(`\n📁 Reports saved:`);
        console.log(`   JSON: ${reportPath}`);
        console.log(`   HTML: ${htmlReportPath}`);
    }

    generateHTMLReport() {
        const results = this.results;
        const timestamp = new Date().toLocaleString();
        
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #007bff; }
        .page-result { margin-bottom: 30px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; }
        .page-header { background: #343a40; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; }
        .score { font-size: 1.5em; font-weight: bold; padding: 5px 15px; border-radius: 20px; }
        .score.excellent { background: #28a745; color: white; }
        .score.good { background: #ffc107; color: black; }
        .score.poor { background: #dc3545; color: white; }
        .scores-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; padding: 20px; background: #f8f9fa; }
        .score-item { text-align: center; }
        .score-item .label { font-size: 0.9em; color: #666; margin-bottom: 5px; }
        .score-item .value { font-size: 1.2em; font-weight: bold; color: #333; }
        .issues { padding: 20px; }
        .issue { margin-bottom: 10px; padding: 10px; border-left: 4px solid #dc3545; background: #f8d7da; }
        .issue.warning { border-left-color: #ffc107; background: #fff3cd; }
        .issue-type { font-weight: bold; color: #721c24; }
        .issue.warning .issue-type { color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 IT-ERA Assistenza-IT Pages Validation Report</h1>
            <p>Generated on: ${timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Pages</h3>
                <div class="number">${results.summary.totalPages}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="number" style="color: #28a745;">${results.summary.passedPages}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="number" style="color: #dc3545;">${results.summary.failedPages}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="number">${Math.round((results.summary.passedPages / results.summary.totalPages) * 100)}%</div>
            </div>
        </div>

        ${Object.entries(results.pageResults).map(([pageName, pageResult]) => {
            const scoreClass = pageResult.overallScore >= 80 ? 'excellent' : 
                             pageResult.overallScore >= 60 ? 'good' : 'poor';
            
            return `
            <div class="page-result">
                <div class="page-header">
                    <h2>${pageName}</h2>
                    <div class="score ${scoreClass}">${pageResult.overallScore}/100</div>
                </div>
                
                <div class="scores-grid">
                    <div class="score-item">
                        <div class="label">Placeholders</div>
                        <div class="value">${pageResult.scores.placeholders}/100</div>
                    </div>
                    <div class="score-item">
                        <div class="label">Forms</div>
                        <div class="value">${pageResult.scores.forms}/100</div>
                    </div>
                    <div class="score-item">
                        <div class="label">Mobile</div>
                        <div class="value">${pageResult.scores.mobile}/100</div>
                    </div>
                    <div class="score-item">
                        <div class="label">Performance</div>
                        <div class="value">${pageResult.scores.performance}/100</div>
                    </div>
                    <div class="score-item">
                        <div class="label">Links</div>
                        <div class="value">${pageResult.scores.links}/100</div>
                    </div>
                    <div class="score-item">
                        <div class="label">SEO</div>
                        <div class="value">${pageResult.scores.seo}/100</div>
                    </div>
                </div>
                
                ${pageResult.issues.length > 0 ? `
                <div class="issues">
                    <h3>Issues Found (${pageResult.issues.length})</h3>
                    ${pageResult.issues.map(issue => `
                        <div class="issue ${issue.type.includes('WARNING') ? 'warning' : ''}">
                            <div class="issue-type">${issue.type}</div>
                            <div>${issue.message}</div>
                        </div>
                    `).join('')}
                </div>
                ` : '<div class="issues"><h3 style="color: #28a745;">✅ No Issues Found</h3></div>'}
            </div>
            `;
        }).join('')}
        
    </div>
</body>
</html>`;
    }

    printSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 VALIDATION SUMMARY REPORT');
        console.log('='.repeat(80));
        console.log(`📄 Total Pages Tested: ${this.results.summary.totalPages}`);
        console.log(`✅ Passed (≥70 score): ${this.results.summary.passedPages}`);
        console.log(`❌ Failed (<70 score): ${this.results.summary.failedPages}`);
        console.log(`📈 Success Rate: ${Math.round((this.results.summary.passedPages / this.results.summary.totalPages) * 100)}%`);
        
        console.log('\n📋 INDIVIDUAL PAGE SCORES:');
        console.log('-'.repeat(80));
        
        Object.entries(this.results.pageResults).forEach(([pageName, result]) => {
            const status = result.overallScore >= 70 ? '✅' : '❌';
            console.log(`${status} ${pageName.padEnd(35)} | Score: ${result.overallScore.toString().padStart(3)}/100 | Issues: ${result.issues.length}`);
        });

        console.log('\n🔍 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
        console.log('-'.repeat(80));
        
        const criticalIssues = [];
        Object.entries(this.results.pageResults).forEach(([pageName, result]) => {
            result.issues.forEach(issue => {
                if (issue.type.includes('CRITICAL') || issue.type.includes('PLACEHOLDER_NOT_REPLACED') || issue.type.includes('FORM_NOT_FOUND')) {
                    criticalIssues.push({ page: pageName, issue });
                }
            });
        });

        if (criticalIssues.length === 0) {
            console.log('✅ No critical issues found!');
        } else {
            criticalIssues.forEach(item => {
                console.log(`❌ ${item.page}: ${item.issue.type} - ${item.issue.message}`);
            });
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Main execution
async function main() {
    const validator = new ValidationSuite();
    
    try {
        await validator.init();
        await validator.runValidation();
    } catch (error) {
        console.error('❌ Validation suite failed:', error);
        process.exit(1);
    } finally {
        await validator.cleanup();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = ValidationSuite;