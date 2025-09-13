/*!
 * IT-ERA Navigation Consistency Validator
 * Specialized Puppeteer testing for navigation consistency across all pages
 * Ensures 100% success rate for navigation components
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class NavigationConsistencyValidator {
    constructor() {
        this.version = '2.0.0';
        this.startTime = Date.now();
        this.results = {
            totalPages: 0,
            passedPages: 0,
            failedPages: 0,
            testResults: [],
            summary: {
                headerComponents: { passed: 0, total: 0 },
                navigationLinks: { passed: 0, total: 0 },
                mobileMenu: { passed: 0, total: 0 },
                dropdownMenu: { passed: 0, total: 0 },
                footerComponents: { passed: 0, total: 0 },
                chatbotComponents: { passed: 0, total: 0 },
                componentsSystem: { passed: 0, total: 0 }
            }
        };
        
        this.testPages = [
            { name: 'Homepage', path: 'index.html', type: 'core', architecture: 'inline' },
            { name: 'Servizi', path: 'servizi.html', type: 'core', architecture: 'components' },
            { name: 'Contatti', path: 'contatti.html', type: 'core', architecture: 'components' },
            { name: 'Commercialisti', path: 'settori/commercialisti.html', type: 'sector', architecture: 'components' },
            { name: 'PMI Startup', path: 'settori/pmi-startup.html', type: 'sector', architecture: 'components' },
            { name: 'Studi Legali', path: 'settori/studi-legali.html', type: 'sector', architecture: 'components' },
            { name: 'Industria 4.0', path: 'settori/industria-40.html', type: 'sector', architecture: 'components' },
            { name: 'Retail GDO', path: 'settori/retail-gdo.html', type: 'sector', architecture: 'components' },
            { name: 'Studi Medici', path: 'settori/studi-medici/index.html', type: 'sector', architecture: 'components' },
            { name: 'Assistenza Emergenza', path: 'landing/assistenza-emergenza.html', type: 'landing', architecture: 'components' },
            { name: 'Cloud Migration', path: 'landing/cloud-migration.html', type: 'landing', architecture: 'components' },
            { name: 'Digitalizzazione PMI', path: 'landing/digitalizzazione-pmi.html', type: 'landing', architecture: 'components' },
            { name: 'Sicurezza Informatica', path: 'landing/sicurezza-informatica.html', type: 'landing', architecture: 'components' },
            { name: 'Software Commercialisti', path: 'landing/software-commercialisti.html', type: 'landing', architecture: 'components' }
        ];
    }

    async validateNavigationConsistency() {
        console.log('🚀 Starting IT-ERA Navigation Consistency Validation v2.0.0\n');
        console.log('=' .repeat(80));
        console.log('🧭 NAVIGATION CONSISTENCY VALIDATION SUITE');
        console.log('=' .repeat(80));
        console.log(`Testing ${this.testPages.length} pages for navigation consistency...\n`);
        
        const browser = await puppeteer.launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
            defaultViewport: { width: 1920, height: 1080 }
        });
        
        try {
            this.results.totalPages = this.testPages.length;
            
            for (const testPage of this.testPages) {
                console.log(`🧪 Testing: ${testPage.name} (${testPage.type} - ${testPage.architecture})`);
                
                const pageResult = await this.validatePageNavigation(browser, testPage);
                this.results.testResults.push(pageResult);
                
                if (pageResult.passed) {
                    this.results.passedPages++;
                    console.log(`  ✅ PASSED: All navigation components working correctly`);
                } else {
                    this.results.failedPages++;
                    console.log(`  ❌ FAILED: ${pageResult.issues.length} issues found`);
                    pageResult.issues.forEach(issue => console.log(`     - ${issue}`));
                }
                
                console.log(''); // Empty line for readability
            }
            
            await this.generateValidationReport();
            
        } finally {
            console.log('\n🔍 Browser kept open for manual inspection...');
            console.log('Press Ctrl+C when done reviewing.');
            
            // Keep browser open for manual inspection
            await new Promise(() => {}); // Wait indefinitely
        }
    }

    async validatePageNavigation(browser, testPage) {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        const result = {
            page: testPage.name,
            path: testPage.path,
            type: testPage.type,
            architecture: testPage.architecture,
            passed: true,
            issues: [],
            tests: {
                headerComponent: false,
                navigationLinks: false,
                mobileMenu: false,
                dropdownMenu: false,
                footerComponent: false,
                chatbotComponent: false,
                componentsSystem: false
            }
        };

        try {
            const url = `file://${__dirname}/${testPage.path}`;
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
            
            // Wait for components to load
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Test 1: Header Component
            const headerExists = await this.testHeaderComponent(page, testPage.architecture);
            result.tests.headerComponent = headerExists;
            this.updateSummary('headerComponents', headerExists);
            if (!headerExists) {
                result.issues.push('Header component not found or not loaded correctly');
                result.passed = false;
            }

            // Test 2: Navigation Links
            const navLinksOK = await this.testNavigationLinks(page);
            result.tests.navigationLinks = navLinksOK;
            this.updateSummary('navigationLinks', navLinksOK);
            if (!navLinksOK) {
                result.issues.push('Insufficient navigation links (expected at least 3)');
                result.passed = false;
            }

            // Test 3: Mobile Menu
            const mobileMenuOK = await this.testMobileMenu(page);
            result.tests.mobileMenu = mobileMenuOK;
            this.updateSummary('mobileMenu', mobileMenuOK);
            if (!mobileMenuOK) {
                result.issues.push('Mobile menu components not found');
                result.passed = false;
            }

            // Test 4: Dropdown Menu (Settori)
            const dropdownOK = await this.testDropdownMenu(page);
            result.tests.dropdownMenu = dropdownOK;
            this.updateSummary('dropdownMenu', dropdownOK);
            if (!dropdownOK) {
                result.issues.push('Settori dropdown menu not found');
                result.passed = false;
            }

            // Test 5: Footer Component
            const footerExists = await this.testFooterComponent(page, testPage.architecture);
            result.tests.footerComponent = footerExists;
            this.updateSummary('footerComponents', footerExists);
            if (!footerExists) {
                result.issues.push('Footer component not found');
                result.passed = false;
            }

            // Test 6: Chatbot Component
            const chatbotExists = await this.testChatbotComponent(page, testPage.architecture);
            result.tests.chatbotComponent = chatbotExists;
            this.updateSummary('chatbotComponents', chatbotExists);
            if (!chatbotExists) {
                result.issues.push('Chatbot component not found');
                result.passed = false;
            }

            // Test 7: Components System (for component-based pages)
            if (testPage.architecture === 'components') {
                const componentsSystemOK = await this.testComponentsSystem(page);
                result.tests.componentsSystem = componentsSystemOK;
                this.updateSummary('componentsSystem', componentsSystemOK);
                if (!componentsSystemOK) {
                    result.issues.push('Components system not working correctly');
                    result.passed = false;
                }
            } else {
                result.tests.componentsSystem = true; // N/A for inline pages
                this.updateSummary('componentsSystem', true);
            }

            // Test mobile responsiveness
            await this.testMobileResponsiveness(page, result);

        } catch (error) {
            result.passed = false;
            result.issues.push(`Page load error: ${error.message}`);
        } finally {
            await page.close();
        }

        return result;
    }

    async testHeaderComponent(page, architecture) {
        if (architecture === 'inline') {
            // For inline pages, check for direct header element
            const header = await page.$('header');
            return !!header;
        } else {
            // For component-based pages, check for placeholder and loaded content
            const placeholder = await page.$('#header-placeholder');
            const headerContent = await page.$('#header-placeholder header, header');
            return !!(placeholder && headerContent);
        }
    }

    async testNavigationLinks(page) {
        const navLinks = await page.$$('nav a, .nav-link, a[href="/"], a[href="/servizi.html"], a[href="/contatti.html"]');
        return navLinks.length >= 3;
    }

    async testMobileMenu(page) {
        const mobileMenuButton = await page.$('#mobile-menu-button');
        const mobileMenu = await page.$('#mobile-menu');
        return !!(mobileMenuButton && mobileMenu);
    }

    async testDropdownMenu(page) {
        const dropdownTrigger = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(btn => btn.textContent.includes('Settori'));
        });
        return dropdownTrigger;
    }

    async testFooterComponent(page, architecture) {
        const footer = await page.$('footer');
        if (architecture === 'components') {
            const placeholder = await page.$('#footer-placeholder');
            return !!(footer && placeholder);
        }
        return !!footer;
    }

    async testChatbotComponent(page, architecture) {
        const chatbotButton = await page.$('#chatbot-button');
        if (architecture === 'components') {
            const placeholder = await page.$('#chatbot-placeholder');
            return !!(chatbotButton || placeholder);
        }
        return !!chatbotButton;
    }

    async testComponentsSystem(page) {
        const componentsLoaderScript = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            return scripts.some(script => 
                script.src.includes('components-loader.js') || 
                script.textContent.includes('ITERAComponents')
            );
        });
        return componentsLoaderScript;
    }

    async testMobileResponsiveness(page, result) {
        // Test mobile viewport
        await page.setViewport({ width: 375, height: 667 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mobileMenuVisible = await page.evaluate(() => {
            const button = document.querySelector('#mobile-menu-button');
            return button && window.getComputedStyle(button).display !== 'none';
        });
        
        if (!mobileMenuVisible) {
            result.issues.push('Mobile menu button not visible on mobile viewport');
            result.passed = false;
        }
        
        // Reset to desktop viewport
        await page.setViewport({ width: 1920, height: 1080 });
    }

    updateSummary(category, passed) {
        this.results.summary[category].total++;
        if (passed) {
            this.results.summary[category].passed++;
        }
    }

    async generateValidationReport() {
        const duration = Date.now() - this.startTime;
        const successRate = ((this.results.passedPages / this.results.totalPages) * 100).toFixed(1);
        
        const report = {
            timestamp: new Date().toISOString(),
            version: this.version,
            duration: duration,
            summary: {
                totalPages: this.results.totalPages,
                passedPages: this.results.passedPages,
                failedPages: this.results.failedPages,
                successRate: `${successRate}%`,
                status: successRate === '100.0' ? 'PERFECT' : successRate >= '95.0' ? 'EXCELLENT' : 'NEEDS_IMPROVEMENT'
            },
            componentTests: this.results.summary,
            detailedResults: this.results.testResults,
            recommendations: this.generateRecommendations()
        };
        
        // Save detailed report
        const reportPath = path.join(__dirname, 'navigation-consistency-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Display summary
        console.log('\n' + '='.repeat(80));
        console.log('📊 NAVIGATION CONSISTENCY VALIDATION REPORT');
        console.log('='.repeat(80));
        console.log(`Overall Success Rate: ${this.results.passedPages}/${this.results.totalPages} (${successRate}%)`);
        console.log(`Status: ${report.summary.status}`);
        console.log(`Duration: ${Math.round(duration / 1000)}s`);
        
        console.log('\n📋 Component Test Results:');
        Object.entries(this.results.summary).forEach(([component, result]) => {
            const percentage = result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : 0;
            console.log(`  ${component}: ${result.passed}/${result.total} (${percentage}%)`);
        });
        
        if (this.results.failedPages > 0) {
            console.log('\n❌ Failed Pages:');
            this.results.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`  - ${result.page}: ${result.issues.join(', ')}`);
            });
        }
        
        console.log(`\n📝 Detailed report saved to: ${reportPath}`);
        
        if (successRate === '100.0') {
            console.log('\n🎉 PERFECT SCORE! All navigation components are working correctly across all pages.');
        } else {
            console.log(`\n⚠️ ${this.results.failedPages} pages need attention for navigation consistency.`);
        }
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        Object.entries(this.results.summary).forEach(([component, result]) => {
            const percentage = result.total > 0 ? (result.passed / result.total) * 100 : 0;
            
            if (percentage < 100) {
                recommendations.push({
                    component,
                    priority: percentage < 80 ? 'HIGH' : 'MEDIUM',
                    message: `${component} tests show ${percentage.toFixed(1)}% success rate. Review failed pages and fix component loading issues.`
                });
            }
        });
        
        return recommendations;
    }
}

// Export for use in other modules
module.exports = NavigationConsistencyValidator;

// Run if called directly
if (require.main === module) {
    const validator = new NavigationConsistencyValidator();
    validator.validateNavigationConsistency().catch(console.error);
}
