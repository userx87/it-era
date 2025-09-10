#!/usr/bin/env node

/**
 * IT-ERA Menu Links Tester
 * Tests all menu links to ensure they work correctly
 */

import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ITERAMenuLinksTester {
    constructor() {
        this.baseUrl = 'https://it-era.it';
        this.webDir = path.join(projectRoot, 'web');
        this.results = {
            working: [],
            broken: [],
            redirects: [],
            total: 0
        };
        
        console.log('🧪 IT-ERA Menu Links Tester initialized');
    }
    
    async testUrl(url) {
        return new Promise((resolve) => {
            const request = https.get(url, (response) => {
                const statusCode = response.statusCode;
                const location = response.headers.location;
                
                resolve({
                    url,
                    statusCode,
                    location,
                    success: statusCode >= 200 && statusCode < 400
                });
            });
            
            request.on('error', (error) => {
                resolve({
                    url,
                    statusCode: 0,
                    error: error.message,
                    success: false
                });
            });
            
            request.setTimeout(10000, () => {
                request.destroy();
                resolve({
                    url,
                    statusCode: 0,
                    error: 'Timeout',
                    success: false
                });
            });
        });
    }
    
    async extractMenuLinks() {
        console.log('🔍 Extracting menu links...');
        
        const menuFile = path.join(this.webDir, 'menu-clean.html');
        const menuContent = await fs.readFile(menuFile, 'utf8');
        
        // Extract all href links
        const hrefRegex = /href="([^"]+)"/g;
        const links = [];
        let match;
        
        while ((match = hrefRegex.exec(menuContent)) !== null) {
            const href = match[1];
            if (href.startsWith('/') && href.endsWith('.html')) {
                links.push(href);
            }
        }
        
        console.log(`📋 Found ${links.length} HTML links in menu`);
        return links;
    }
    
    async testAllLinks() {
        console.log('🚀 Starting menu links test...\n');
        
        const menuLinks = await this.extractMenuLinks();
        this.results.total = menuLinks.length;
        
        console.log('Testing links:');
        console.log('='.repeat(50));
        
        for (const link of menuLinks) {
            const fullUrl = `${this.baseUrl}${link}`;
            const result = await this.testUrl(fullUrl);
            
            if (result.success) {
                if (result.statusCode >= 300 && result.statusCode < 400) {
                    this.results.redirects.push(result);
                    console.log(`🔄 ${result.statusCode} ${link} → ${result.location}`);
                } else {
                    this.results.working.push(result);
                    console.log(`✅ ${result.statusCode} ${link}`);
                }
            } else {
                this.results.broken.push(result);
                console.log(`❌ ${result.statusCode || 'ERR'} ${link} ${result.error ? `(${result.error})` : ''}`);
            }
            
            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return this.results;
    }
    
    async generateReport() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 MENU LINKS TEST RESULTS');
        console.log('='.repeat(50));
        
        console.log(`✅ Working links: ${this.results.working.length}`);
        console.log(`🔄 Redirects: ${this.results.redirects.length}`);
        console.log(`❌ Broken links: ${this.results.broken.length}`);
        console.log(`📊 Total tested: ${this.results.total}`);
        
        const successRate = ((this.results.working.length + this.results.redirects.length) / this.results.total * 100).toFixed(1);
        console.log(`📈 Success rate: ${successRate}%`);
        
        if (this.results.broken.length > 0) {
            console.log('\n❌ BROKEN LINKS:');
            this.results.broken.forEach(result => {
                console.log(`   ${result.url} - ${result.error || result.statusCode}`);
            });
        }
        
        if (this.results.redirects.length > 0) {
            console.log('\n🔄 REDIRECTS:');
            this.results.redirects.forEach(result => {
                console.log(`   ${result.url} → ${result.location}`);
            });
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            summary: {
                total: this.results.total,
                working: this.results.working.length,
                redirects: this.results.redirects.length,
                broken: this.results.broken.length,
                successRate: parseFloat(successRate)
            },
            results: this.results
        };
        
        await fs.writeFile(
            path.join(projectRoot, 'menu-links-test-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📋 Detailed report saved to menu-links-test-report.json');
        
        return report;
    }
    
    async run() {
        try {
            await this.testAllLinks();
            const report = await this.generateReport();
            
            if (report.summary.broken === 0) {
                console.log('\n🎉 All menu links are working correctly!');
                process.exit(0);
            } else {
                console.log(`\n⚠️ Found ${report.summary.broken} broken links that need attention.`);
                process.exit(1);
            }
            
        } catch (error) {
            console.error('💥 Menu links test failed:', error);
            process.exit(1);
        }
    }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new ITERAMenuLinksTester();
    tester.run().catch(console.error);
}

export default ITERAMenuLinksTester;
