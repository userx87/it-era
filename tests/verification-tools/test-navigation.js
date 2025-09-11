#!/usr/bin/env node

const puppeteer = require('puppeteer');
const chalk = require('chalk');

class NavigationTester {
    constructor() {
        this.baseUrl = 'https://it-era.pages.dev';
        this.expectedSectors = [
            'PMI e Startup',
            'Studi Medici', 
            'Commercialisti',
            'Studi Legali'
        ];
    }

    async init() {
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    }

    async testHomepageNavigation() {
        console.log(chalk.blue.bold('🧭 Homepage Navigation Testing'));
        console.log(chalk.gray(`Loading homepage: ${this.baseUrl}\n`));

        try {
            // Navigate to homepage
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            await this.page.waitForTimeout(3000);

            console.log(chalk.green('✓ Homepage loaded successfully'));

            // Take screenshot for reference
            await this.page.screenshot({ path: 'verification-tools/homepage-screenshot.png', fullPage: true });
            console.log(chalk.gray('📸 Homepage screenshot saved'));

            // Test different navigation patterns
            const results = await this.testMultipleNavigationPatterns();
            
            return results;

        } catch (error) {
            console.log(chalk.red(`❌ Failed to load homepage: ${error.message}`));
            return { success: false, error: error.message };
        }
    }

    async testMultipleNavigationPatterns() {
        const patterns = [
            { name: 'Settori Dropdown', selector: '[data-dropdown="settori"]' },
            { name: 'Settori Menu', selector: '.dropdown-settori' },
            { name: 'Navigation Menu', selector: 'nav a[href*="settori"]' },
            { name: 'Header Links', selector: 'header a[href*="settori"]' },
            { name: 'Any Settori Link', selector: 'a[href*="settori"]' },
            { name: 'Services Menu', selector: 'a[href*="servizi"]' },
            { name: 'Dropdown Toggle', selector: '.dropdown-toggle' },
            { name: 'Menu Button', selector: '.menu-btn, .hamburger' }
        ];

        const results = [];

        for (const pattern of patterns) {
            console.log(chalk.yellow(`Testing: ${pattern.name}...`));
            
            try {
                const element = await this.page.$(pattern.selector);
                
                if (element) {
                    console.log(chalk.green(`✓ Found ${pattern.name}`));
                    
                    // Try to interact with the element
                    const interactionResult = await this.testElementInteraction(element, pattern.name);
                    
                    results.push({
                        pattern: pattern.name,
                        selector: pattern.selector,
                        found: true,
                        interaction: interactionResult
                    });
                } else {
                    console.log(chalk.gray(`- ${pattern.name} not found`));
                    results.push({
                        pattern: pattern.name,
                        selector: pattern.selector,
                        found: false
                    });
                }
            } catch (error) {
                console.log(chalk.red(`✗ Error testing ${pattern.name}: ${error.message}`));
                results.push({
                    pattern: pattern.name,
                    selector: pattern.selector,
                    found: false,
                    error: error.message
                });
            }
        }

        // Look for any links that might lead to sector pages
        await this.findAllSectorRelatedLinks();

        return results;
    }

    async testElementInteraction(element, elementName) {
        try {
            // Get element info
            const elementInfo = await element.evaluate(el => ({
                tagName: el.tagName,
                className: el.className,
                id: el.id,
                href: el.href,
                text: el.textContent?.trim(),
                visible: el.offsetParent !== null
            }));

            console.log(chalk.blue(`  Element info: ${elementInfo.tagName}.${elementInfo.className}`));
            console.log(chalk.blue(`  Text: "${elementInfo.text}"`));
            
            if (elementInfo.href) {
                console.log(chalk.blue(`  Href: ${elementInfo.href}`));
            }

            // Try hover to reveal dropdown
            await element.hover();
            await this.page.waitForTimeout(1000);

            // Look for revealed menu items
            const menuItems = await this.page.$$eval('a[href*="settori"], a[href*="servizi"]', links =>
                links.filter(link => link.offsetParent !== null).map(link => ({
                    text: link.textContent.trim(),
                    href: link.href,
                    visible: link.offsetParent !== null
                }))
            );

            if (menuItems.length > 0) {
                console.log(chalk.cyan(`  Found ${menuItems.length} menu items after hover:`));
                menuItems.forEach(item => {
                    console.log(chalk.cyan(`    - ${item.text}: ${item.href}`));
                });
            }

            return {
                elementInfo,
                menuItems,
                success: true
            };

        } catch (error) {
            console.log(chalk.red(`  Interaction failed: ${error.message}`));
            return {
                success: false,
                error: error.message
            };
        }
    }

    async findAllSectorRelatedLinks() {
        console.log(chalk.yellow('\n🔍 Searching for all sector-related links...'));
        
        try {
            const allLinks = await this.page.$$eval('a', links =>
                links
                    .filter(link => {
                        const href = link.href.toLowerCase();
                        const text = link.textContent.toLowerCase();
                        return href.includes('settori') || href.includes('servizi') || 
                               text.includes('pmi') || text.includes('startup') || 
                               text.includes('medici') || text.includes('commercial') || 
                               text.includes('legal');
                    })
                    .map(link => ({
                        text: link.textContent.trim(),
                        href: link.href,
                        visible: link.offsetParent !== null,
                        className: link.className,
                        id: link.id
                    }))
            );

            if (allLinks.length > 0) {
                console.log(chalk.cyan(`Found ${allLinks.length} sector-related links:`));
                allLinks.forEach(link => {
                    const visibility = link.visible ? chalk.green('visible') : chalk.gray('hidden');
                    console.log(chalk.cyan(`  - ${link.text} (${visibility}): ${link.href}`));
                });
            } else {
                console.log(chalk.red('No sector-related links found'));
            }

            return allLinks;

        } catch (error) {
            console.log(chalk.red(`Error finding links: ${error.message}`));
            return [];
        }
    }

    async testDirectNavigation() {
        console.log(chalk.yellow('\n🎯 Testing direct navigation to sector pages...'));

        const sectorUrls = [
            '/pages/settori-pmi-startup.html',
            '/pages/settori-studi-medici.html',
            '/pages/settori-commercialisti.html',
            '/pages/settori-studi-legali.html'
        ];

        const results = [];

        for (const url of sectorUrls) {
            const fullUrl = `${this.baseUrl}${url}`;
            try {
                console.log(chalk.gray(`Navigating to: ${url}`));
                
                const response = await this.page.goto(fullUrl, { waitUntil: 'networkidle2' });
                const status = response.status();

                if (status === 200) {
                    const title = await this.page.title();
                    console.log(chalk.green(`✓ Loaded successfully: "${title}"`));
                    
                    results.push({
                        url,
                        success: true,
                        status,
                        title
                    });
                } else {
                    console.log(chalk.yellow(`⚠ Unexpected status: ${status}`));
                    results.push({
                        url,
                        success: false,
                        status
                    });
                }

            } catch (error) {
                console.log(chalk.red(`✗ Failed: ${error.message}`));
                results.push({
                    url,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    async run() {
        try {
            await this.init();
            
            const navigationResults = await this.testHomepageNavigation();
            const directResults = await this.testDirectNavigation();
            
            // Generate summary
            console.log(chalk.blue.bold('\n📊 Navigation Test Summary'));
            console.log(chalk.gray('=' * 50));

            console.log(chalk.blue('\n🧭 Homepage Navigation:'));
            const foundPatterns = navigationResults.filter(r => r.found);
            console.log(`Found patterns: ${foundPatterns.length}/${navigationResults.length}`);

            console.log(chalk.blue('\n🎯 Direct Navigation:'));
            const successfulDirect = directResults.filter(r => r.success);
            console.log(`Successful direct access: ${successfulDirect.length}/${directResults.length}`);

            if (foundPatterns.length === 0 && successfulDirect.length === 0) {
                console.log(chalk.red.bold('\n❌ NAVIGATION ISSUES DETECTED'));
                console.log(chalk.yellow('No working navigation patterns found for sector pages.'));
            } else {
                console.log(chalk.green.bold('\n✅ Some navigation methods are working'));
            }

        } catch (error) {
            console.error(chalk.red('Fatal error during navigation testing:'), error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new NavigationTester();
    tester.run().catch(console.error);
}

module.exports = NavigationTester;