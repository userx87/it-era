#!/usr/bin/env node

const puppeteer = require('puppeteer');
const axios = require('axios');
const chalk = require('chalk');
const Table = require('cli-table3');

class DeploymentVerifier {
    constructor() {
        this.baseUrl = 'https://it-era.pages.dev';
        this.sectorPages = [
            { name: 'PMI e Startup', url: '/pages/settori-pmi-startup.html', expected: true },
            { name: 'Studi Medici', url: '/pages/settori-studi-medici.html', expected: true },
            { name: 'Commercialisti', url: '/pages/settori-commercialisti.html', expected: true },
            { name: 'Studi Legali', url: '/pages/settori-studi-legali.html', expected: true }
        ];
        this.alternativePatterns = [
            '/pages/servizi-pmi-startup.html',
            '/pages/servizi-studi-medici.html', 
            '/pages/servizi-commercialisti.html',
            '/pages/servizi-studi-legali.html',
            '/settori-pmi-startup.html',
            '/settori-studi-medici.html',
            '/settori-commercialisti.html',
            '/settori-studi-legali.html'
        ];
        this.results = {
            urlTests: [],
            navigationTests: [],
            contentTests: [],
            discrepancies: []
        };
    }

    async init() {
        console.log(chalk.blue.bold('🚀 IT-ERA Deployment Verification Tool'));
        console.log(chalk.gray('Testing sector pages deployment at https://it-era.pages.dev\n'));
        
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Set realistic user agent
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }

    async testUrlStatus() {
        console.log(chalk.yellow('📡 Testing URL Status Codes...'));
        
        for (const sector of this.sectorPages) {
            const fullUrl = `${this.baseUrl}${sector.url}`;
            try {
                const response = await axios.get(fullUrl, {
                    timeout: 10000,
                    validateStatus: (status) => status < 500
                });
                
                this.results.urlTests.push({
                    name: sector.name,
                    url: fullUrl,
                    status: response.status,
                    accessible: response.status === 200 || response.status === 308,
                    redirected: response.status === 308 || response.status === 301,
                    finalUrl: response.request?.responseURL || fullUrl
                });
                
                console.log(chalk.green(`✓ ${sector.name}: ${response.status}`));
            } catch (error) {
                this.results.urlTests.push({
                    name: sector.name,
                    url: fullUrl,
                    status: error.response?.status || 'ERROR',
                    accessible: false,
                    error: error.message
                });
                
                console.log(chalk.red(`✗ ${sector.name}: ${error.message}`));
            }
        }
    }

    async testAlternativeUrls() {
        console.log(chalk.yellow('\n🔍 Testing Alternative URL Patterns...'));
        
        for (const altUrl of this.alternativePatterns) {
            const fullUrl = `${this.baseUrl}${altUrl}`;
            try {
                const response = await axios.get(fullUrl, {
                    timeout: 5000,
                    validateStatus: (status) => status < 500
                });
                
                if (response.status === 200) {
                    console.log(chalk.cyan(`✓ Found alternative: ${altUrl} (${response.status})`));
                    this.results.discrepancies.push({
                        type: 'alternative_found',
                        url: altUrl,
                        status: response.status,
                        message: 'Alternative URL pattern exists'
                    });
                }
            } catch (error) {
                // Silent fail for alternatives
            }
        }
    }

    async testHomepageNavigation() {
        console.log(chalk.yellow('\n🧭 Testing Homepage Navigation...'));
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // Wait for page to fully load
            await this.page.waitForTimeout(3000);
            
            // Look for Settori dropdown
            const settoriDropdown = await this.page.$('[data-dropdown="settori"], .dropdown-settori, a[href*="settori"]');
            
            if (settoriDropdown) {
                console.log(chalk.green('✓ Found Settori dropdown/menu'));
                
                // Try to hover or click to reveal menu
                await settoriDropdown.hover();
                await this.page.waitForTimeout(1000);
                
                // Look for sector links
                const sectorLinks = await this.page.$$eval('a[href*="settori"]', links => 
                    links.map(link => ({
                        text: link.textContent.trim(),
                        href: link.href,
                        visible: link.offsetParent !== null
                    }))
                );
                
                this.results.navigationTests.push({
                    type: 'dropdown_found',
                    links: sectorLinks,
                    success: sectorLinks.length > 0
                });
                
                console.log(chalk.blue(`Found ${sectorLinks.length} sector links:`));
                sectorLinks.forEach(link => {
                    console.log(chalk.gray(`  - ${link.text}: ${link.href}`));
                });
                
            } else {
                console.log(chalk.red('✗ Settori dropdown not found'));
                this.results.navigationTests.push({
                    type: 'dropdown_not_found',
                    success: false
                });
            }
            
        } catch (error) {
            console.log(chalk.red(`✗ Homepage navigation test failed: ${error.message}`));
            this.results.navigationTests.push({
                type: 'navigation_error',
                error: error.message,
                success: false
            });
        }
    }

    async testPageContent() {
        console.log(chalk.yellow('\n📄 Testing Page Content...'));
        
        for (const result of this.results.urlTests) {
            if (result.accessible) {
                try {
                    await this.page.goto(result.url, { waitUntil: 'networkidle2' });
                    await this.page.waitForTimeout(2000);
                    
                    // Check for key content elements
                    const title = await this.page.title();
                    const h1 = await this.page.$eval('h1', el => el.textContent.trim()).catch(() => null);
                    const hasContent = await this.page.$eval('body', el => el.textContent.trim().length > 100).catch(() => false);
                    
                    // Check for sector-specific content
                    const pageText = await this.page.$eval('body', el => el.textContent.toLowerCase()).catch(() => '');
                    const containsSectorKeywords = this.checkSectorKeywords(result.name, pageText);
                    
                    this.results.contentTests.push({
                        name: result.name,
                        url: result.url,
                        title,
                        h1,
                        hasContent,
                        containsSectorKeywords,
                        contentValid: hasContent && containsSectorKeywords
                    });
                    
                    const status = hasContent && containsSectorKeywords ? '✓' : '⚠';
                    console.log(chalk.green(`${status} ${result.name}: Title="${title}", H1="${h1}"`));
                    
                } catch (error) {
                    console.log(chalk.red(`✗ Content test failed for ${result.name}: ${error.message}`));
                    this.results.contentTests.push({
                        name: result.name,
                        url: result.url,
                        error: error.message,
                        contentValid: false
                    });
                }
            }
        }
    }

    checkSectorKeywords(sectorName, pageText) {
        const keywords = {
            'PMI e Startup': ['pmi', 'startup', 'piccole', 'medie', 'imprese', 'innovazione'],
            'Studi Medici': ['medici', 'sanitario', 'cliniche', 'ambulatori', 'pazienti'],
            'Commercialisti': ['commercialisti', 'contabilità', 'fiscale', 'consulenza'],
            'Studi Legali': ['legali', 'avvocati', 'giuridica', 'tribunale', 'cause']
        };
        
        const sectorKeywords = keywords[sectorName] || [];
        return sectorKeywords.some(keyword => pageText.includes(keyword));
    }

    async generateReport() {
        console.log(chalk.blue.bold('\n📊 DEPLOYMENT VERIFICATION REPORT'));
        console.log(chalk.gray('=' * 60));
        
        // URL Status Table
        const urlTable = new Table({
            head: ['Sector', 'URL', 'Status', 'Accessible', 'Notes'],
            colWidths: [20, 35, 10, 12, 25]
        });
        
        this.results.urlTests.forEach(test => {
            const status = test.accessible ? chalk.green(test.status) : chalk.red(test.status);
            const accessible = test.accessible ? chalk.green('✓') : chalk.red('✗');
            const notes = test.redirected ? 'Redirected' : test.error ? 'Error' : 'Direct';
            
            urlTable.push([test.name, test.url, status, accessible, notes]);
        });
        
        console.log('\n🔗 URL Status Tests:');
        console.log(urlTable.toString());
        
        // Navigation Results
        console.log('\n🧭 Navigation Tests:');
        this.results.navigationTests.forEach(test => {
            if (test.type === 'dropdown_found') {
                console.log(chalk.green(`✓ Settori menu found with ${test.links.length} links`));
            } else {
                console.log(chalk.red('✗ Settori menu not found or inaccessible'));
            }
        });
        
        // Content Results
        const contentTable = new Table({
            head: ['Sector', 'Title Valid', 'Content Valid', 'Keywords Match'],
            colWidths: [20, 15, 15, 18]
        });
        
        this.results.contentTests.forEach(test => {
            const titleValid = test.title ? chalk.green('✓') : chalk.red('✗');
            const contentValid = test.hasContent ? chalk.green('✓') : chalk.red('✗');
            const keywordsMatch = test.containsSectorKeywords ? chalk.green('✓') : chalk.red('✗');
            
            contentTable.push([test.name, titleValid, contentValid, keywordsMatch]);
        });
        
        console.log('\n📄 Content Tests:');
        console.log(contentTable.toString());
        
        // Discrepancies
        if (this.results.discrepancies.length > 0) {
            console.log('\n⚠️  Discrepancies Found:');
            this.results.discrepancies.forEach(disc => {
                console.log(chalk.yellow(`  - ${disc.message}: ${disc.url}`));
            });
        }
        
        // Summary
        const totalTests = this.results.urlTests.length;
        const accessiblePages = this.results.urlTests.filter(t => t.accessible).length;
        const validContent = this.results.contentTests.filter(t => t.contentValid).length;
        
        console.log(chalk.blue.bold('\n📋 SUMMARY:'));
        console.log(`Total Sector Pages Tested: ${totalTests}`);
        console.log(`Accessible Pages: ${accessiblePages}/${totalTests} (${Math.round(accessiblePages/totalTests*100)}%)`);
        console.log(`Valid Content: ${validContent}/${totalTests} (${Math.round(validContent/totalTests*100)}%)`);
        
        if (accessiblePages === totalTests && validContent === totalTests) {
            console.log(chalk.green.bold('\n🎉 ALL TESTS PASSED - Deployment is successful!'));
        } else {
            console.log(chalk.red.bold('\n❌ DEPLOYMENT ISSUES DETECTED'));
            console.log(chalk.yellow('Check the results above for specific failures.'));
        }
    }

    async run() {
        try {
            await this.init();
            await this.testUrlStatus();
            await this.testAlternativeUrls();
            await this.testHomepageNavigation();
            await this.testPageContent();
            await this.generateReport();
        } catch (error) {
            console.error(chalk.red('Fatal error during verification:'), error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run verification if called directly
if (require.main === module) {
    const verifier = new DeploymentVerifier();
    verifier.run().catch(console.error);
}

module.exports = DeploymentVerifier;