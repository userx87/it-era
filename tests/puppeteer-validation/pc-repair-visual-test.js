const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

/**
 * Comprehensive Puppeteer Visual Testing Suite for PC Repair Template
 * 
 * This suite performs:
 * 1. Visual inspection with screenshots
 * 2. Content validation (no placeholders, specific text checks)
 * 3. Chatbot functionality testing
 * 4. Contact form validation
 * 5. Mobile responsive testing
 * 6. Performance testing (Core Web Vitals)
 * 7. Navigation menu testing
 */

class PCRepairVisualValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            testResults: [],
            screenshots: [],
            performance: {},
            errors: [],
            warnings: []
        };
        
        this.screenshotDir = path.join(__dirname, 'screenshots');
        this.reportDir = path.join(__dirname, 'reports');
        this.samplePagePath = path.join(__dirname, 'sample-pages', 'riparazione-pc-milano.html');
    }

    async init() {
        console.log('🚀 Initializing Puppeteer Visual Testing Suite...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for CI/CD
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Enable console log capture
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.results.errors.push({
                    type: 'console-error',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Enable network monitoring
        await this.page.setRequestInterception(true);
        this.page.on('request', (req) => {
            req.continue();
        });
        
        this.page.on('response', (res) => {
            if (!res.ok() && res.status() !== 304) {
                this.results.warnings.push({
                    type: 'network-warning',
                    url: res.url(),
                    status: res.status(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        console.log('✅ Puppeteer initialized successfully');
    }

    async loadTestPage() {
        console.log('📄 Loading PC Repair test page...');
        
        const fileUrl = `file://${this.samplePagePath}`;
        console.log(`Loading: ${fileUrl}`);
        
        await this.page.goto(fileUrl, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Wait for essential elements to load
        await this.page.waitForSelector('main#main-content', { timeout: 10000 });
        await this.page.waitForSelector('.hero-section', { timeout: 5000 });
        
        console.log('✅ Test page loaded successfully');
    }

    async takeScreenshot(name, description, options = {}) {
        const filename = `${Date.now()}_${name}.png`;
        const filepath = path.join(this.screenshotDir, filename);
        
        const defaultOptions = {
            fullPage: true,
            type: 'png',
            ...options
        };
        
        await this.page.screenshot({ 
            path: filepath, 
            ...defaultOptions 
        });
        
        this.results.screenshots.push({
            name,
            description,
            filename,
            filepath,
            timestamp: new Date().toISOString()
        });
        
        console.log(`📸 Screenshot saved: ${name} (${filename})`);
        return filepath;
    }

    async testHeroSectionVisual() {
        console.log('🏛️ Testing Hero Section Visual Elements...');
        
        const testResult = {
            testName: 'Hero Section Visual',
            status: 'passed',
            issues: [],
            screenshots: []
        };

        try {
            // Scroll to hero section
            await this.page.evaluate(() => {
                document.querySelector('.hero-section').scrollIntoView();
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Take hero section screenshot
            await this.takeScreenshot('hero-section', 'Hero section with title, badges and CTA buttons');
            
            // Check hero title
            const heroTitle = await this.page.$eval('h1', el => el.textContent.trim());
            if (!heroTitle.includes('Riparazione PC Milano')) {
                testResult.issues.push('Hero title missing or incorrect');
                testResult.status = 'failed';
            }
            
            // Check badges are visible
            const badges = await this.page.$$('.badge-custom');
            if (badges.length < 4) {
                testResult.issues.push(`Expected 4 badges, found ${badges.length}`);
                testResult.status = 'warning';
            }
            
            // Check badges content - should NOT contain "gratuito"
            const badgeTexts = await this.page.$$eval('.badge-custom', badges => 
                badges.map(badge => badge.textContent.trim())
            );
            
            const hasGratuito = badgeTexts.some(text => text.toLowerCase().includes('gratuito'));
            if (hasGratuito) {
                testResult.issues.push('Found "gratuito" text in badges - should be replaced');
                testResult.status = 'failed';
            }
            
            // Check for "Assistenza presso di noi" text
            const hasAssistenzaPressoDiNoi = badgeTexts.some(text => 
                text.includes('Assistenza presso di noi')
            );
            if (!hasAssistenzaPressoDiNoi) {
                testResult.issues.push('Missing "Assistenza presso di noi" text');
                testResult.status = 'failed';
            }
            
            // Check CTA buttons
            const ctaButtons = await this.page.$$('.hero-section .btn');
            if (ctaButtons.length < 2) {
                testResult.issues.push('Hero section should have at least 2 CTA buttons');
                testResult.status = 'warning';
            }
            
            console.log('✅ Hero section visual test completed');
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.issues.push(`Error testing hero section: ${error.message}`);
            console.error('❌ Hero section test failed:', error);
        }
        
        this.results.testResults.push(testResult);
        return testResult;
    }

    async testNavigationMenu() {
        console.log('🧭 Testing Navigation Menu...');
        
        const testResult = {
            testName: 'Navigation Menu',
            status: 'passed',
            issues: [],
            screenshots: []
        };

        try {
            // Test navigation is visible
            await this.page.waitForSelector('.navbar', { timeout: 5000 });
            
            // Take navigation screenshot
            await this.takeScreenshot('navigation-menu', 'Navigation menu with all dropdowns');
            
            // Test dropdowns
            const dropdowns = [
                { selector: '[data-bs-toggle="dropdown"]:nth-of-type(1)', name: 'Services' },
                { selector: '[data-bs-toggle="dropdown"]:nth-of-type(2)', name: 'Clienti' },
                { selector: '[data-bs-toggle="dropdown"]:nth-of-type(3)', name: 'Zone Coperte' }
            ];
            
            for (const dropdown of dropdowns) {
                try {
                    // Hover over dropdown
                    await this.page.hover(dropdown.selector);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Click dropdown
                    await this.page.click(dropdown.selector);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Check if dropdown opened
                    const dropdownMenu = await this.page.$('.dropdown-menu.show');
                    if (!dropdownMenu) {
                        testResult.issues.push(`${dropdown.name} dropdown did not open`);
                        testResult.status = 'warning';
                    }
                    
                    // Take screenshot of open dropdown
                    await this.takeScreenshot(`dropdown-${dropdown.name.toLowerCase()}`, `${dropdown.name} dropdown menu opened`);
                    
                    // Close dropdown
                    await this.page.keyboard.press('Escape');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (error) {
                    testResult.issues.push(`Error testing ${dropdown.name} dropdown: ${error.message}`);
                    testResult.status = 'warning';
                }
            }
            
            // Test emergency phone link
            const emergencyLink = await this.page.$('a[href="tel:+390398882041"]');
            if (!emergencyLink) {
                testResult.issues.push('Emergency phone link not found');
                testResult.status = 'failed';
            }
            
            console.log('✅ Navigation menu test completed');
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.issues.push(`Error testing navigation: ${error.message}`);
            console.error('❌ Navigation test failed:', error);
        }
        
        this.results.testResults.push(testResult);
        return testResult;
    }

    async testContentValidation() {
        console.log('📝 Testing Content Validation...');
        
        const testResult = {
            testName: 'Content Validation',
            status: 'passed',
            issues: [],
            screenshots: []
        };

        try {
            // Get all page content
            const pageContent = await this.page.content();
            
            // Check for placeholder text that should be replaced
            const placeholderPatterns = [
                /\{\{CITY\}\}/g,
                /\{\{REGION\}\}/g,
                /\{\{PROVINCE\}\}/g,
                /\{\{SERVICE\}\}/g
            ];
            
            placeholderPatterns.forEach(pattern => {
                const matches = pageContent.match(pattern);
                if (matches) {
                    testResult.issues.push(`Found unreplaced placeholders: ${matches.join(', ')}`);
                    testResult.status = 'failed';
                }
            });
            
            // Check for "gratuito" text anywhere on the page
            const gratuitoMatches = pageContent.toLowerCase().match(/gratuito/g);
            if (gratuitoMatches && gratuitoMatches.length > 0) {
                testResult.issues.push(`Found ${gratuitoMatches.length} instances of "gratuito" text`);
                testResult.status = 'failed';
            }
            
            // Verify "Assistenza presso di noi" appears
            const assistenzaMatches = pageContent.match(/Assistenza presso di noi/g);
            if (!assistenzaMatches || assistenzaMatches.length < 2) {
                testResult.issues.push('"Assistenza presso di noi" should appear multiple times on the page');
                testResult.status = 'failed';
            }
            
            // Check pricing section has no warranty mentions (should be "copertura")
            const warrantyMatches = pageContent.toLowerCase().match(/garanzia/g);
            if (warrantyMatches && warrantyMatches.length > 0) {
                // Check if they're replaced with "copertura"
                const coperturaMatches = pageContent.toLowerCase().match(/copertura/g);
                if (!coperturaMatches || coperturaMatches.length < 2) {
                    testResult.issues.push('Warranty terms should use "copertura" instead of "garanzia"');
                    testResult.status = 'warning';
                }
            }
            
            // Check for "Senza Costo" instead of "Gratis"
            const gratisMatches = pageContent.toLowerCase().match(/gratis(?!ssimo)/g); // Exclude "gratuito"
            if (gratisMatches && gratisMatches.length > 0) {
                testResult.issues.push(`Found ${gratisMatches.length} instances of "gratis" - should be "senza costo"`);
                testResult.status = 'warning';
            }
            
            // Verify essential content elements are present
            const essentialContent = [
                'Milano',
                'Lombardia',
                'HP',
                'Dell',
                'notebook',
                'desktop',
                '039 888 2041',
                'info@it-era.it'
            ];
            
            essentialContent.forEach(content => {
                if (!pageContent.includes(content)) {
                    testResult.issues.push(`Missing essential content: ${content}`);
                    testResult.status = 'failed';
                }
            });
            
            console.log('✅ Content validation completed');
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.issues.push(`Error validating content: ${error.message}`);
            console.error('❌ Content validation failed:', error);
        }
        
        this.results.testResults.push(testResult);
        return testResult;
    }

    async testChatbotFunctionality() {
        console.log('🤖 Testing Chatbot Functionality...');
        
        const testResult = {
            testName: 'Chatbot Functionality',
            status: 'passed',
            issues: [],
            screenshots: []
        };

        try {
            // Scroll to bottom to ensure chatbot is visible
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if chatbot toggle button exists
            const chatToggle = await this.page.$('#itera-chatbot-toggle');
            if (!chatToggle) {
                testResult.issues.push('Chatbot toggle button not found');
                testResult.status = 'failed';
                this.results.testResults.push(testResult);
                return testResult;
            }
            
            // Take screenshot of chatbot button
            await this.takeScreenshot('chatbot-closed', 'Chatbot toggle button visible');
            
            // Click to open chatbot
            await this.page.click('#itera-chatbot-toggle');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if chatbot window opened
            const chatWindow = await this.page.$('#itera-chatbot-window');
            const isVisible = await this.page.evaluate(() => {
                const window = document.getElementById('itera-chatbot-window');
                return window && window.style.display === 'flex';
            });
            
            if (!isVisible) {
                testResult.issues.push('Chatbot window did not open');
                testResult.status = 'failed';
            } else {
                // Take screenshot of open chatbot
                await this.takeScreenshot('chatbot-open', 'Chatbot window opened with welcome message');
                
                // Test sending a message
                await this.page.type('#itera-chatbot-input', 'Il mio PC non si accende');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await this.page.click('#itera-chatbot-send');
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for bot response
                
                // Take screenshot of chat conversation
                await this.takeScreenshot('chatbot-conversation', 'Chatbot conversation with user message and bot response');
                
                // Check if bot responded
                const messages = await this.page.$$('.itera-chatbot-messages > div');
                if (messages.length < 2) {
                    testResult.issues.push('Bot did not respond to user message');
                    testResult.status = 'warning';
                }
                
                // Test close button
                await this.page.click('#itera-chatbot-close');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const isStillVisible = await this.page.evaluate(() => {
                    const window = document.getElementById('itera-chatbot-window');
                    return window && window.style.display === 'flex';
                });
                
                if (isStillVisible) {
                    testResult.issues.push('Chatbot window did not close');
                    testResult.status = 'warning';
                }
            }
            
            console.log('✅ Chatbot functionality test completed');
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.issues.push(`Error testing chatbot: ${error.message}`);
            console.error('❌ Chatbot test failed:', error);
        }
        
        this.results.testResults.push(testResult);
        return testResult;
    }

    async testContactForm() {
        console.log('📋 Testing Contact Form...');
        
        const testResult = {
            testName: 'Contact Form',
            status: 'passed',
            issues: [],
            screenshots: []
        };

        try {
            // Scroll to contact form
            await this.page.evaluate(() => {
                document.getElementById('contatti').scrollIntoView();
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Take screenshot of contact form
            await this.takeScreenshot('contact-form', 'Contact form section');
            
            // Check if form exists
            const form = await this.page.$('#contactForm');
            if (!form) {
                testResult.issues.push('Contact form not found');
                testResult.status = 'failed';
                this.results.testResults.push(testResult);
                return testResult;
            }
            
            // Test form fields
            const requiredFields = [
                { selector: 'input[name="nome"]', name: 'Nome' },
                { selector: 'input[name="email"]', name: 'Email' },
                { selector: 'input[name="telefono"]', name: 'Telefono' }
            ];
            
            for (const field of requiredFields) {
                const element = await this.page.$(field.selector);
                if (!element) {
                    testResult.issues.push(`Required field missing: ${field.name}`);
                    testResult.status = 'failed';
                }
            }
            
            // Fill out form
            await this.page.type('input[name="nome"]', 'Test User');
            await this.page.type('input[name="email"]', 'test@example.com');
            await this.page.type('input[name="telefono"]', '123456789');
            await this.page.type('textarea[name="problema"]', 'Test problem description');
            
            // Accept privacy policy
            await this.page.click('#privacy');
            
            // Take screenshot of filled form
            await this.takeScreenshot('contact-form-filled', 'Contact form filled with test data');
            
            // Test form submission
            await this.page.click('button[type="submit"]');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check for success message
            const successMessage = await this.page.$('.alert-success');
            if (!successMessage) {
                testResult.issues.push('Form submission did not show success message');
                testResult.status = 'warning';
            } else {
                await this.takeScreenshot('contact-form-success', 'Contact form submitted successfully');
            }
            
            console.log('✅ Contact form test completed');
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.issues.push(`Error testing contact form: ${error.message}`);
            console.error('❌ Contact form test failed:', error);
        }
        
        this.results.testResults.push(testResult);
        return testResult;
    }

    async testMobileResponsive() {
        console.log('📱 Testing Mobile Responsive Design...');
        
        const testResult = {
            testName: 'Mobile Responsive',
            status: 'passed',
            issues: [],
            screenshots: []
        };

        try {
            // Test different viewport sizes
            const viewports = [
                { width: 375, height: 667, name: 'iPhone SE' },
                { width: 768, height: 1024, name: 'iPad' },
                { width: 414, height: 896, name: 'iPhone 11 Pro Max' }
            ];
            
            for (const viewport of viewports) {
                await this.page.setViewport(viewport);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Take screenshot at this viewport
                await this.takeScreenshot(`mobile-${viewport.name.toLowerCase().replace(/\s+/g, '-')}`, 
                                        `Page at ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
                
                // Test mobile navigation
                if (viewport.width < 768) {
                    const hamburgerButton = await this.page.$('.navbar-toggler');
                    if (!hamburgerButton) {
                        testResult.issues.push(`Mobile navigation toggle missing at ${viewport.name}`);
                        testResult.status = 'failed';
                    } else {
                        // Test opening mobile menu
                        await this.page.click('.navbar-toggler');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        await this.takeScreenshot(`mobile-menu-${viewport.name.toLowerCase().replace(/\s+/g, '-')}`, 
                                                `Mobile navigation menu at ${viewport.name}`);
                        
                        // Close mobile menu
                        await this.page.click('.navbar-toggler');
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
                
                // Check if content is readable (not overlapping)
                const heroHeight = await this.page.evaluate(() => {
                    const hero = document.querySelector('.hero-section');
                    return hero ? hero.offsetHeight : 0;
                });
                
                if (heroHeight < 200) {
                    testResult.issues.push(`Hero section too small at ${viewport.name} (${heroHeight}px)`);
                    testResult.status = 'warning';
                }
                
                // Check if pricing cards stack properly on mobile
                if (viewport.width < 768) {
                    const pricingCards = await this.page.$$('.pricing-card');
                    if (pricingCards.length > 0) {
                        const cardWidth = await this.page.evaluate(() => {
                            const card = document.querySelector('.pricing-card');
                            return card ? card.offsetWidth : 0;
                        });
                        
                        if (cardWidth > viewport.width - 40) { // Account for padding
                            testResult.issues.push(`Pricing cards too wide for ${viewport.name} viewport`);
                            testResult.status = 'warning';
                        }
                    }
                }
            }
            
            // Reset to desktop viewport
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            console.log('✅ Mobile responsive test completed');
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.issues.push(`Error testing mobile responsive: ${error.message}`);
            console.error('❌ Mobile responsive test failed:', error);
        }
        
        this.results.testResults.push(testResult);
        return testResult;
    }

    async testPerformance() {
        console.log('⚡ Testing Performance and Core Web Vitals...');
        
        const testResult = {
            testName: 'Performance & Core Web Vitals',
            status: 'passed',
            issues: [],
            screenshots: []
        };

        try {
            // Reload page to get fresh metrics
            await this.page.reload({ waitUntil: 'networkidle0' });
            
            // Get performance metrics
            const metrics = await this.page.metrics();
            
            // Get Core Web Vitals using evaluate
            const webVitals = await this.page.evaluate(() => {
                return new Promise((resolve) => {
                    // Simple performance measurement
                    const perfData = performance.getEntriesByType('navigation')[0];
                    const paintEntries = performance.getEntriesByType('paint');
                    
                    const result = {
                        // Page load timing
                        domContentLoaded: perfData ? perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart : 0,
                        loadComplete: perfData ? perfData.loadEventEnd - perfData.loadEventStart : 0,
                        
                        // Paint timings
                        firstPaint: 0,
                        firstContentfulPaint: 0,
                        
                        // Resource counts
                        resourceCount: performance.getEntriesByType('resource').length
                    };
                    
                    // Get paint metrics
                    paintEntries.forEach(entry => {
                        if (entry.name === 'first-paint') {
                            result.firstPaint = entry.startTime;
                        } else if (entry.name === 'first-contentful-paint') {
                            result.firstContentfulPaint = entry.startTime;
                        }
                    });
                    
                    resolve(result);
                });
            });
            
            // Store performance results
            this.results.performance = {
                metrics,
                webVitals,
                timestamp: new Date().toISOString()
            };
            
            // Check performance thresholds
            if (webVitals.firstContentfulPaint > 2500) {
                testResult.issues.push(`First Contentful Paint too slow: ${webVitals.firstContentfulPaint}ms (should be < 2500ms)`);
                testResult.status = 'warning';
            }
            
            if (webVitals.loadComplete > 5000) {
                testResult.issues.push(`Page load too slow: ${webVitals.loadComplete}ms (should be < 5000ms)`);
                testResult.status = 'warning';
            }
            
            if (webVitals.resourceCount > 50) {
                testResult.issues.push(`Too many resources loaded: ${webVitals.resourceCount} (should be < 50)`);
                testResult.status = 'warning';
            }
            
            // Check JavaScript heap size
            if (metrics.JSHeapUsedSize > 50000000) { // 50MB
                testResult.issues.push(`High JavaScript heap usage: ${Math.round(metrics.JSHeapUsedSize / 1000000)}MB`);
                testResult.status = 'warning';
            }
            
            console.log('✅ Performance test completed');
            console.log(`📊 Performance Summary:
- First Contentful Paint: ${webVitals.firstContentfulPaint}ms
- Load Complete: ${webVitals.loadComplete}ms
- Resources Loaded: ${webVitals.resourceCount}
- JS Heap: ${Math.round(metrics.JSHeapUsedSize / 1000000)}MB`);
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.issues.push(`Error testing performance: ${error.message}`);
            console.error('❌ Performance test failed:', error);
        }
        
        this.results.testResults.push(testResult);
        return testResult;
    }

    async testPricingSection() {
        console.log('💰 Testing Pricing Section...');
        
        const testResult = {
            testName: 'Pricing Section',
            status: 'passed',
            issues: [],
            screenshots: []
        };

        try {
            // Scroll to pricing section
            await this.page.evaluate(() => {
                document.getElementById('prezzi').scrollIntoView();
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Take screenshot of pricing section
            await this.takeScreenshot('pricing-section', 'Pricing section with all three plans');
            
            // Check pricing cards
            const pricingCards = await this.page.$$('.pricing-card');
            if (pricingCards.length !== 3) {
                testResult.issues.push(`Expected 3 pricing cards, found ${pricingCards.length}`);
                testResult.status = 'failed';
            }
            
            // Check for warranty mentions (should be replaced with "copertura")
            const pricingContent = await this.page.$eval('#prezzi', el => el.textContent);
            const warrantyCount = (pricingContent.toLowerCase().match(/garanzia/g) || []).length;
            const coperturaCount = (pricingContent.toLowerCase().match(/copertura/g) || []).length;
            
            if (warrantyCount > 0 && coperturaCount === 0) {
                testResult.issues.push('Pricing section uses "garanzia" instead of "copertura"');
                testResult.status = 'failed';
            }
            
            // Check pricing amounts
            const prices = await this.page.$$eval('.price', prices => 
                prices.map(price => price.textContent.trim())
            );
            
            const expectedPrices = ['€45', '€65', '€85'];
            expectedPrices.forEach((expectedPrice, index) => {
                if (!prices[index] || !prices[index].includes(expectedPrice)) {
                    testResult.issues.push(`Expected price ${expectedPrice} at position ${index + 1}`);
                    testResult.status = 'warning';
                }
            });
            
            // Test CTA buttons in pricing cards
            const ctaButtons = await this.page.$$('.pricing-card button');
            if (ctaButtons.length !== 3) {
                testResult.issues.push(`Expected 3 CTA buttons in pricing cards, found ${ctaButtons.length}`);
                testResult.status = 'warning';
            }
            
            console.log('✅ Pricing section test completed');
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.issues.push(`Error testing pricing section: ${error.message}`);
            console.error('❌ Pricing section test failed:', error);
        }
        
        this.results.testResults.push(testResult);
        return testResult;
    }

    async generateReport() {
        console.log('📊 Generating Visual Validation Report...');
        
        const reportData = {
            ...this.results,
            summary: {
                totalTests: this.results.testResults.length,
                passedTests: this.results.testResults.filter(t => t.status === 'passed').length,
                failedTests: this.results.testResults.filter(t => t.status === 'failed').length,
                warningTests: this.results.testResults.filter(t => t.status === 'warning').length,
                totalScreenshots: this.results.screenshots.length,
                totalErrors: this.results.errors.length,
                totalWarnings: this.results.warnings.length
            }
        };
        
        // Generate HTML report
        const htmlReport = this.generateHTMLReport(reportData);
        
        // Save JSON report
        const jsonReportPath = path.join(this.reportDir, `pc-repair-validation-${Date.now()}.json`);
        await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));
        
        // Save HTML report
        const htmlReportPath = path.join(this.reportDir, `pc-repair-validation-${Date.now()}.html`);
        await fs.writeFile(htmlReportPath, htmlReport);
        
        console.log(`✅ Reports generated:
📄 JSON: ${jsonReportPath}
🌐 HTML: ${htmlReportPath}`);
        
        return { jsonReportPath, htmlReportPath, reportData };
    }

    generateHTMLReport(data) {
        const { summary, testResults, screenshots, performance, errors, warnings } = data;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PC Repair Template - Visual Validation Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0d6efd, #0a58ca); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #0d6efd; }
        .summary-card.passed { border-left-color: #28a745; }
        .summary-card.failed { border-left-color: #dc3545; }
        .summary-card.warning { border-left-color: #ffc107; }
        .test-result { margin-bottom: 20px; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
        .test-header { padding: 15px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
        .test-content { padding: 15px; }
        .status-badge { padding: 4px 12px; border-radius: 20px; color: white; font-size: 0.8rem; font-weight: bold; }
        .status-passed { background: #28a745; }
        .status-failed { background: #dc3545; }
        .status-warning { background: #ffc107; color: #333; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .screenshot { border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
        .screenshot img { width: 100%; height: 200px; object-fit: cover; }
        .screenshot-info { padding: 15px; background: #f8f9fa; }
        .performance-metrics { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .metric { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid #e9ecef; }
        .issue { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
        .issue.error { background: #f8d7da; border-left-color: #dc3545; }
        .timestamp { color: #6c757d; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 PC Repair Template - Visual Validation Report</h1>
            <p>Comprehensive testing results for IT-ERA PC repair landing page</p>
            <p class="timestamp">Generated: ${new Date(data.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="content">
            <h2>📊 Test Summary</h2>
            <div class="summary">
                <div class="summary-card">
                    <h3>${summary.totalTests}</h3>
                    <p>Total Tests</p>
                </div>
                <div class="summary-card passed">
                    <h3>${summary.passedTests}</h3>
                    <p>Passed</p>
                </div>
                <div class="summary-card failed">
                    <h3>${summary.failedTests}</h3>
                    <p>Failed</p>
                </div>
                <div class="summary-card warning">
                    <h3>${summary.warningTests}</h3>
                    <p>Warnings</p>
                </div>
                <div class="summary-card">
                    <h3>${summary.totalScreenshots}</h3>
                    <p>Screenshots</p>
                </div>
            </div>

            ${performance && Object.keys(performance).length > 0 ? `
            <h2>⚡ Performance Metrics</h2>
            <div class="performance-metrics">
                <div class="metric">
                    <span>First Contentful Paint:</span>
                    <strong>${performance.webVitals?.firstContentfulPaint || 'N/A'}ms</strong>
                </div>
                <div class="metric">
                    <span>Load Complete:</span>
                    <strong>${performance.webVitals?.loadComplete || 'N/A'}ms</strong>
                </div>
                <div class="metric">
                    <span>Resources Loaded:</span>
                    <strong>${performance.webVitals?.resourceCount || 'N/A'}</strong>
                </div>
                <div class="metric">
                    <span>JS Heap Size:</span>
                    <strong>${performance.metrics?.JSHeapUsedSize ? Math.round(performance.metrics.JSHeapUsedSize / 1000000) + 'MB' : 'N/A'}</strong>
                </div>
            </div>
            ` : ''}

            <h2>🧪 Test Results</h2>
            ${testResults.map(test => `
                <div class="test-result">
                    <div class="test-header">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3>${test.testName}</h3>
                            <span class="status-badge status-${test.status}">${test.status.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="test-content">
                        ${test.issues.length > 0 ? `
                            <h4>Issues Found:</h4>
                            ${test.issues.map(issue => `<div class="issue ${test.status === 'failed' ? 'error' : ''}">${issue}</div>`).join('')}
                        ` : '<p style="color: #28a745;">✅ All checks passed!</p>'}
                    </div>
                </div>
            `).join('')}

            ${screenshots.length > 0 ? `
            <h2>📸 Screenshots</h2>
            <div class="screenshots">
                ${screenshots.map(screenshot => `
                    <div class="screenshot">
                        <img src="${screenshot.filename}" alt="${screenshot.description}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y4ZjlmYSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Yzc1N2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TY3JlZW5zaG90IG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';">
                        <div class="screenshot-info">
                            <h4>${screenshot.name}</h4>
                            <p>${screenshot.description}</p>
                            <p class="timestamp">${new Date(screenshot.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${errors.length > 0 ? `
            <h2>🚨 Errors</h2>
            ${errors.map(error => `<div class="issue error">${error.message} <span class="timestamp">(${new Date(error.timestamp).toLocaleString()})</span></div>`).join('')}
            ` : ''}

            ${warnings.length > 0 ? `
            <h2>⚠️ Warnings</h2>
            ${warnings.map(warning => `<div class="issue">${warning.type}: ${warning.message || warning.url} <span class="timestamp">(${new Date(warning.timestamp).toLocaleString()})</span></div>`).join('')}
            ` : ''}
        </div>
    </div>
</body>
</html>`;
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Visual Testing Suite...\n');
        
        try {
            await this.init();
            await this.loadTestPage();
            
            // Run all test suites
            const tests = [
                () => this.testHeroSectionVisual(),
                () => this.testNavigationMenu(),
                () => this.testContentValidation(),
                () => this.testPricingSection(),
                () => this.testChatbotFunctionality(),
                () => this.testContactForm(),
                () => this.testMobileResponsive(),
                () => this.testPerformance()
            ];
            
            for (const test of tests) {
                await test();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause between tests
            }
            
            // Generate final report
            const report = await this.generateReport();
            
            console.log('\n🎉 Visual Testing Suite Completed!');
            console.log(`📊 Summary:
- Total Tests: ${report.reportData.summary.totalTests}
- Passed: ${report.reportData.summary.passedTests}
- Failed: ${report.reportData.summary.failedTests}
- Warnings: ${report.reportData.summary.warningTests}
- Screenshots: ${report.reportData.summary.totalScreenshots}
`);
            
            return report;
            
        } catch (error) {
            console.error('❌ Fatal error in testing suite:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Export for use in other modules or run directly
module.exports = PCRepairVisualValidator;

// Run if called directly
if (require.main === module) {
    (async () => {
        const validator = new PCRepairVisualValidator();
        try {
            await validator.runAllTests();
            console.log('✅ All tests completed successfully!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Tests failed:', error);
            process.exit(1);
        }
    })();
}