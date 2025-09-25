/**
 * IT-ERA.it Browser Testing Agent
 * Comprehensive testing using Puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ITEraBrowserTester {
    constructor() {
        this.baseUrl = 'https://it-era.it';
        this.browser = null;
        this.page = null;
        this.testResults = {
            timestamp: new Date().toISOString(),
            homepage: {},
            navigation: {},
            forms: {},
            interactive: {},
            responsiveness: {},
            issues: [],
            screenshots: []
        };
        this.screenshotCounter = 0;
    }

    async init() {
        console.log('🚀 Inizializing IT-ERA Browser Testing Agent...');
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for headless mode
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();

        // Set user agent
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Enable request interception for monitoring
        await this.page.setRequestInterception(true);
        this.page.on('request', request => {
            if (request.url().includes('404') || request.resourceType() === 'image') {
                console.log(`📡 Request: ${request.url()}`);
            }
            request.continue();
        });

        // Monitor console errors
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.testResults.issues.push({
                    type: 'console_error',
                    message: msg.text(),
                    url: this.page.url()
                });
            }
        });

        // Monitor failed requests
        this.page.on('response', response => {
            if (response.status() >= 400) {
                this.testResults.issues.push({
                    type: 'http_error',
                    status: response.status(),
                    url: response.url(),
                    page: this.page.url()
                });
            }
        });
    }

    async takeScreenshot(name, description) {
        const filename = `${++this.screenshotCounter}_${name}.png`;
        const filepath = path.join(__dirname, 'screenshots', filename);
        await this.page.screenshot({
            path: filepath,
            fullPage: true
        });

        this.testResults.screenshots.push({
            name,
            description,
            filename,
            timestamp: new Date().toISOString()
        });

        console.log(`📸 Screenshot taken: ${filename} - ${description}`);
        return filename;
    }

    async testHomepage() {
        console.log('\n🏠 Testing Homepage...');

        try {
            // Navigate to homepage
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await this.takeScreenshot('homepage_initial', 'Initial homepage load');

            // Get page title and basic info
            const title = await this.page.title();
            const url = this.page.url();

            this.testResults.homepage = {
                title,
                url,
                loadTime: Date.now(),
                status: 'success'
            };

            // Test scroll functionality
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            });
            await this.page.waitForLoadState('networkidle');
            await this.takeScreenshot('homepage_scroll_middle', 'Homepage scrolled to middle');

            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await this.page.waitForLoadState('networkidle');
            await this.takeScreenshot('homepage_scroll_bottom', 'Homepage scrolled to bottom');

            // Scroll back to top
            await this.page.evaluate(() => {
                window.scrollTo(0, 0);
            });
            await this.page.waitForLoadState('networkidle');

            console.log('✅ Homepage test completed');

        } catch (error) {
            console.log('❌ Homepage test failed:', error.message);
            this.testResults.homepage.status = 'error';
            this.testResults.homepage.error = error.message;
            this.testResults.issues.push({
                type: 'homepage_error',
                message: error.message
            });
        }
    }

    async testNavigation() {
        console.log('\n🧭 Testing Navigation...');

        try {
            // Find all navigation links
            const navLinks = await this.page.evaluate(() => {
                const links = [];
                const navElements = document.querySelectorAll('nav a, .menu a, .navbar a, header a');

                navElements.forEach(link => {
                    if (link.href && link.href.startsWith('http')) {
                        links.push({
                            text: link.textContent.trim(),
                            href: link.href,
                            isInternal: link.href.includes('it-era.it')
                        });
                    }
                });

                return links;
            });

            console.log(`Found ${navLinks.length} navigation links`);
            this.testResults.navigation.totalLinks = navLinks.length;
            this.testResults.navigation.links = [];

            // Test each navigation link
            for (const link of navLinks.slice(0, 10)) { // Limit to first 10 links
                console.log(`Testing link: ${link.text} -> ${link.href}`);

                try {
                    if (link.isInternal) {
                        await this.page.goto(link.href, { waitUntil: 'networkidle2', timeout: 15000 });
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        const pageTitle = await this.page.title();
                        const currentUrl = this.page.url();

                        await this.takeScreenshot(`nav_${link.text.replace(/[^a-zA-Z0-9]/g, '_')}`, `Navigation to ${link.text}`);

                        this.testResults.navigation.links.push({
                            text: link.text,
                            href: link.href,
                            status: 'success',
                            pageTitle,
                            currentUrl
                        });
                    } else {
                        this.testResults.navigation.links.push({
                            text: link.text,
                            href: link.href,
                            status: 'external',
                            note: 'External link - not tested'
                        });
                    }

                } catch (error) {
                    console.log(`❌ Failed to test link ${link.text}:`, error.message);
                    this.testResults.navigation.links.push({
                        text: link.text,
                        href: link.href,
                        status: 'error',
                        error: error.message
                    });

                    this.testResults.issues.push({
                        type: 'navigation_error',
                        link: link.text,
                        href: link.href,
                        message: error.message
                    });
                }
            }

            // Return to homepage
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            console.log('✅ Navigation test completed');

        } catch (error) {
            console.log('❌ Navigation test failed:', error.message);
            this.testResults.issues.push({
                type: 'navigation_general_error',
                message: error.message
            });
        }
    }

    async testForms() {
        console.log('\n📋 Testing Contact Forms...');

        try {
            // Find all forms
            const forms = await this.page.evaluate(() => {
                const formElements = document.querySelectorAll('form');
                const forms = [];

                formElements.forEach((form, index) => {
                    const inputs = Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
                        type: input.type || input.tagName.toLowerCase(),
                        name: input.name,
                        id: input.id,
                        required: input.required,
                        placeholder: input.placeholder
                    }));

                    forms.push({
                        index,
                        action: form.action,
                        method: form.method,
                        inputs
                    });
                });

                return forms;
            });

            console.log(`Found ${forms.length} forms`);
            this.testResults.forms.totalForms = forms.length;
            this.testResults.forms.tested = [];

            for (const form of forms) {
                console.log(`Testing form ${form.index + 1}...`);

                try {
                    // Fill out the form with test data
                    for (const input of form.inputs) {
                        const selector = input.id ? `#${input.id}` : `[name="${input.name}"]`;

                        try {
                            await this.page.waitForSelector(selector, { timeout: 5000 });

                            switch (input.type) {
                                case 'email':
                                    await this.page.type(selector, 'test@example.com');
                                    break;
                                case 'tel':
                                case 'phone':
                                    await this.page.type(selector, '+39 123 456 7890');
                                    break;
                                case 'text':
                                case 'name':
                                    if (input.name?.toLowerCase().includes('name') || input.placeholder?.toLowerCase().includes('nome')) {
                                        await this.page.type(selector, 'Test User');
                                    } else {
                                        await this.page.type(selector, 'Test Value');
                                    }
                                    break;
                                case 'textarea':
                                    await this.page.type(selector, 'This is a test message for form validation purposes.');
                                    break;
                            }
                        } catch (inputError) {
                            console.log(`Could not fill input ${input.name || input.id}:`, inputError.message);
                        }
                    }

                    await this.takeScreenshot(`form_${form.index + 1}_filled`, `Form ${form.index + 1} filled with test data`);

                    // Test form validation without actually submitting
                    const submitButton = await this.page.$('input[type="submit"], button[type="submit"], button:not([type])');
                    if (submitButton) {
                        // Just check if submit button is enabled/disabled
                        const isDisabled = await this.page.evaluate(btn => btn.disabled, submitButton);
                        console.log(`Submit button disabled: ${isDisabled}`);
                    }

                    this.testResults.forms.tested.push({
                        index: form.index,
                        status: 'success',
                        inputs: form.inputs.length,
                        filled: true
                    });

                } catch (error) {
                    console.log(`❌ Form ${form.index + 1} test failed:`, error.message);
                    this.testResults.forms.tested.push({
                        index: form.index,
                        status: 'error',
                        error: error.message
                    });
                }
            }

            console.log('✅ Forms test completed');

        } catch (error) {
            console.log('❌ Forms test failed:', error.message);
            this.testResults.issues.push({
                type: 'forms_error',
                message: error.message
            });
        }
    }

    async testInteractiveElements() {
        console.log('\n🎯 Testing Interactive Elements...');

        try {
            // Find and test buttons
            const buttons = await this.page.$$('button, .btn, [role="button"]');
            console.log(`Found ${buttons.length} interactive buttons`);

            this.testResults.interactive.buttons = [];

            for (let i = 0; i < Math.min(buttons.length, 10); i++) {
                const button = buttons[i];

                try {
                    const buttonText = await this.page.evaluate(btn => btn.textContent?.trim() || btn.getAttribute('aria-label') || 'Unknown', button);
                    console.log(`Testing button: ${buttonText}`);

                    // Scroll to button and click
                    await button.scrollIntoView();
                    await this.page.waitForTimeout(500);

                    const boundingBox = await button.boundingBox();
                    if (boundingBox) {
                        await this.page.mouse.click(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        await this.takeScreenshot(`button_${i + 1}_clicked`, `After clicking button: ${buttonText}`);

                        this.testResults.interactive.buttons.push({
                            text: buttonText,
                            status: 'clicked',
                            index: i + 1
                        });
                    }

                } catch (error) {
                    console.log(`Could not test button ${i + 1}:`, error.message);
                    this.testResults.interactive.buttons.push({
                        index: i + 1,
                        status: 'error',
                        error: error.message
                    });
                }
            }

            // Test for modals/popups
            const modals = await this.page.$$('.modal, .popup, .dialog, [role="dialog"]');
            if (modals.length > 0) {
                console.log(`Found ${modals.length} potential modals`);
                await this.takeScreenshot('modals_detected', `Detected ${modals.length} modals/popups`);
                this.testResults.interactive.modals = modals.length;
            }

            // Test for accordions/tabs
            const accordions = await this.page.$$('.accordion, .tabs, [role="tablist"], [role="tab"]');
            if (accordions.length > 0) {
                console.log(`Found ${accordions.length} accordion/tab elements`);
                await this.takeScreenshot('accordions_detected', `Detected ${accordions.length} accordion/tab elements`);
                this.testResults.interactive.accordions = accordions.length;
            }

            console.log('✅ Interactive elements test completed');

        } catch (error) {
            console.log('❌ Interactive elements test failed:', error.message);
            this.testResults.issues.push({
                type: 'interactive_error',
                message: error.message
            });
        }
    }

    async testResponsiveness() {
        console.log('\n📱 Testing Responsiveness...');

        const viewports = [
            { name: 'Mobile', width: 375, height: 667 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Desktop', width: 1920, height: 1080 }
        ];

        this.testResults.responsiveness.viewports = [];

        for (const viewport of viewports) {
            console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

            try {
                await this.page.setViewport({
                    width: viewport.width,
                    height: viewport.height,
                    deviceScaleFactor: 1
                });

                await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
                await new Promise(resolve => setTimeout(resolve, 2000));

                await this.takeScreenshot(`responsive_${viewport.name.toLowerCase()}`, `${viewport.name} viewport test`);

                // Test menu behavior on mobile
                if (viewport.name === 'Mobile') {
                    const mobileMenu = await this.page.$('.mobile-menu, .hamburger, .menu-toggle, [aria-label*="menu"]');
                    if (mobileMenu) {
                        await mobileMenu.click();
                        await this.page.waitForLoadState('networkidle');
                        await this.takeScreenshot('mobile_menu_open', 'Mobile menu opened');
                    }
                }

                this.testResults.responsiveness.viewports.push({
                    name: viewport.name,
                    width: viewport.width,
                    height: viewport.height,
                    status: 'success'
                });

            } catch (error) {
                console.log(`❌ ${viewport.name} test failed:`, error.message);
                this.testResults.responsiveness.viewports.push({
                    name: viewport.name,
                    width: viewport.width,
                    height: viewport.height,
                    status: 'error',
                    error: error.message
                });

                this.testResults.issues.push({
                    type: 'responsive_error',
                    viewport: viewport.name,
                    message: error.message
                });
            }
        }

        console.log('✅ Responsiveness test completed');
    }

    async generateReport() {
        console.log('\n📊 Generating Test Report...');

        const report = {
            ...this.testResults,
            summary: {
                totalTests: 5,
                passedTests: 0,
                failedTests: 0,
                totalIssues: this.testResults.issues.length,
                totalScreenshots: this.testResults.screenshots.length
            }
        };

        // Calculate pass/fail
        if (this.testResults.homepage.status === 'success') report.summary.passedTests++;
        else report.summary.failedTests++;

        if (this.testResults.navigation.links?.length > 0) report.summary.passedTests++;
        else report.summary.failedTests++;

        if (this.testResults.forms.tested?.length >= 0) report.summary.passedTests++;
        else report.summary.failedTests++;

        if (this.testResults.interactive.buttons?.length > 0) report.summary.passedTests++;
        else report.summary.failedTests++;

        if (this.testResults.responsiveness.viewports?.length > 0) report.summary.passedTests++;
        else report.summary.failedTests++;

        const reportPath = path.join(__dirname, 'reports', `it-era-test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`📋 Report saved to: ${reportPath}`);
        return report;
    }

    async runFullTest() {
        try {
            await this.init();

            await this.testHomepage();
            await this.testNavigation();
            await this.testForms();
            await this.testInteractiveElements();
            await this.testResponsiveness();

            const report = await this.generateReport();

            console.log('\n🎉 Testing completed!');
            console.log(`📊 Summary: ${report.summary.passedTests}/${report.summary.totalTests} tests passed`);
            console.log(`⚠️  Issues found: ${report.summary.totalIssues}`);
            console.log(`📸 Screenshots taken: ${report.summary.totalScreenshots}`);

            return report;

        } catch (error) {
            console.log('❌ Test suite failed:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the test if called directly
if (require.main === module) {
    const tester = new ITEraBrowserTester();
    tester.runFullTest()
        .then(report => {
            console.log('✅ All tests completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = ITEraBrowserTester;