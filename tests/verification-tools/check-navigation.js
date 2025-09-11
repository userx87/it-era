#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');

class NavigationChecker {
    constructor() {
        this.baseUrl = 'https://it-era.pages.dev';
    }

    async checkHomepageNavigation() {
        console.log(chalk.blue.bold('🧭 Homepage Navigation Analysis'));
        console.log(chalk.gray(`Analyzing navigation at: ${this.baseUrl}\n`));

        try {
            const response = await axios.get(this.baseUrl, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });

            const html = response.data;
            
            // Find all links
            const linkMatches = html.match(/<a[^>]*href=['""]([^'""]*)['""][^>]*>([^<]*)<\/a>/gi) || [];
            
            console.log(chalk.blue(`Found ${linkMatches.length} total links on homepage`));

            // Analyze sector-related links
            const sectorLinks = [];
            
            linkMatches.forEach(linkHtml => {
                const hrefMatch = linkHtml.match(/href=['""]([^'""]*)['""]>/i);
                const textMatch = linkHtml.match(/>([^<]*)</);
                
                if (hrefMatch && textMatch) {
                    const href = hrefMatch[1];
                    const text = textMatch[1].trim();
                    
                    // Check if this is a sector-related link
                    if (this.isSectorLink(href, text)) {
                        sectorLinks.push({
                            href: href,
                            text: text,
                            fullHtml: linkHtml
                        });
                    }
                }
            });

            console.log(chalk.green(`\n✅ Found ${sectorLinks.length} sector-related links:\n`));

            sectorLinks.forEach((link, index) => {
                console.log(chalk.cyan(`${index + 1}. "${link.text}"`));
                console.log(chalk.blue(`   URL: ${link.href}`));
                console.log(chalk.gray(`   HTML: ${link.fullHtml}`));
                console.log();
            });

            // Check for navigation menus/dropdowns
            console.log(chalk.yellow('🔍 Looking for navigation structures...'));
            
            const navStructures = this.findNavigationStructures(html);
            
            if (navStructures.length > 0) {
                console.log(chalk.green(`\nFound ${navStructures.length} navigation structures:`));
                navStructures.forEach((nav, index) => {
                    console.log(chalk.cyan(`\n${index + 1}. ${nav.type}:`));
                    console.log(chalk.gray(nav.content.substring(0, 200) + '...'));
                });
            } else {
                console.log(chalk.red('No specific navigation structures found'));
            }

            // Test if sector pages are linked correctly
            await this.testSectorLinkConnectivity(sectorLinks);

            return {
                totalLinks: linkMatches.length,
                sectorLinks: sectorLinks,
                navigationStructures: navStructures
            };

        } catch (error) {
            console.error(chalk.red('Failed to analyze homepage navigation:'), error.message);
            return null;
        }
    }

    isSectorLink(href, text) {
        const sectorKeywords = [
            'settori', 'servizi', 'pmi', 'startup', 'medici', 'commercial', 'legal', 
            'studi medici', 'studi legali', 'commercialisti'
        ];
        
        const hrefLower = href.toLowerCase();
        const textLower = text.toLowerCase();
        
        return sectorKeywords.some(keyword => 
            hrefLower.includes(keyword) || textLower.includes(keyword)
        );
    }

    findNavigationStructures(html) {
        const structures = [];
        
        // Look for navigation elements
        const navMatches = html.match(/<nav[^>]*>[\s\S]*?<\/nav>/gi) || [];
        navMatches.forEach(nav => {
            structures.push({
                type: 'Navigation Element',
                content: nav
            });
        });

        // Look for dropdown structures
        const dropdownMatches = html.match(/<[^>]*class=[^>]*dropdown[^>]*>[\s\S]*?<\/[^>]*>/gi) || [];
        dropdownMatches.forEach(dropdown => {
            structures.push({
                type: 'Dropdown Structure',
                content: dropdown
            });
        });

        // Look for menu structures
        const menuMatches = html.match(/<[^>]*class=[^>]*menu[^>]*>[\s\S]*?<\/[^>]*>/gi) || [];
        menuMatches.forEach(menu => {
            structures.push({
                type: 'Menu Structure',
                content: menu
            });
        });

        return structures;
    }

    async testSectorLinkConnectivity(sectorLinks) {
        console.log(chalk.yellow('\n🔗 Testing sector link connectivity...'));
        
        for (const link of sectorLinks) {
            let testUrl = link.href;
            
            // Convert relative URLs to absolute
            if (testUrl.startsWith('/')) {
                testUrl = this.baseUrl + testUrl;
            } else if (!testUrl.startsWith('http')) {
                testUrl = this.baseUrl + '/' + testUrl;
            }
            
            try {
                const response = await axios.get(testUrl, {
                    timeout: 10000,
                    validateStatus: (status) => status < 500
                });
                
                const status = response.status;
                const statusColor = status === 200 ? chalk.green : 
                                  status < 400 ? chalk.yellow : chalk.red;
                
                console.log(statusColor(`  ✓ "${link.text}" → ${status} (${testUrl})`));
                
            } catch (error) {
                console.log(chalk.red(`  ✗ "${link.text}" → ${error.response?.status || 'ERROR'} (${testUrl})`));
            }
        }
    }

    async run() {
        try {
            const result = await this.checkHomepageNavigation();
            
            console.log(chalk.blue.bold('\n📋 NAVIGATION ANALYSIS SUMMARY'));
            console.log(chalk.gray('═'.repeat(50)));
            
            if (result) {
                console.log(chalk.blue(`Total links found: ${result.totalLinks}`));
                console.log(chalk.blue(`Sector-related links: ${result.sectorLinks.length}`));
                console.log(chalk.blue(`Navigation structures: ${result.navigationStructures.length}`));
                
                if (result.sectorLinks.length > 0) {
                    console.log(chalk.green('\n✅ Sector navigation is present on homepage'));
                } else {
                    console.log(chalk.red('\n❌ No sector navigation found on homepage'));
                }
            }
            
            return result;
            
        } catch (error) {
            console.error(chalk.red('Fatal error during navigation analysis:'), error);
            throw error;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const checker = new NavigationChecker();
    checker.run().catch(console.error);
}

module.exports = NavigationChecker;