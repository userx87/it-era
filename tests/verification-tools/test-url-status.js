#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');

class UrlStatusTester {
    constructor() {
        this.baseUrl = 'https://it-era.pages.dev';
        this.testUrls = [
            // Expected sector pages
            '/pages/settori-pmi-startup.html',
            '/pages/settori-studi-medici.html',
            '/pages/settori-commercialisti.html',
            '/pages/settori-studi-legali.html',
            
            // Alternative patterns to check
            '/pages/servizi-pmi-startup.html',
            '/pages/servizi-studi-medici.html',
            '/pages/servizi-commercialisti.html',
            '/pages/servizi-studi-legali.html',
            
            // Root level alternatives
            '/settori-pmi-startup.html',
            '/settori-studi-medici.html',
            '/settori-commercialisti.html',
            '/settori-studi-legali.html',
            
            // Additional common patterns
            '/pmi-startup.html',
            '/studi-medici.html',
            '/commercialisti.html',
            '/studi-legali.html'
        ];
    }

    async testUrl(url) {
        const fullUrl = `${this.baseUrl}${url}`;
        try {
            const response = await axios.get(fullUrl, {
                timeout: 10000,
                validateStatus: (status) => status < 500,
                maxRedirects: 5
            });

            return {
                url: fullUrl,
                path: url,
                status: response.status,
                success: response.status === 200,
                redirect: response.status >= 300 && response.status < 400,
                finalUrl: response.request?.responseURL || fullUrl,
                headers: response.headers
            };
        } catch (error) {
            return {
                url: fullUrl,
                path: url,
                status: error.response?.status || 'ERROR',
                success: false,
                error: error.message,
                errorCode: error.code
            };
        }
    }

    async testAllUrls() {
        console.log(chalk.blue.bold('🔍 URL Status Testing Tool'));
        console.log(chalk.gray(`Testing ${this.testUrls.length} URLs at ${this.baseUrl}\n`));

        const results = {
            found: [],
            notFound: [],
            redirected: [],
            errors: []
        };

        for (const url of this.testUrls) {
            process.stdout.write(chalk.gray(`Testing ${url}... `));
            
            const result = await this.testUrl(url);
            
            if (result.success) {
                console.log(chalk.green(`✓ ${result.status}`));
                results.found.push(result);
            } else if (result.redirect) {
                console.log(chalk.yellow(`→ ${result.status} (${result.finalUrl})`));
                results.redirected.push(result);
            } else if (result.status === 404) {
                console.log(chalk.red(`✗ 404`));
                results.notFound.push(result);
            } else {
                console.log(chalk.red(`✗ ${result.status || result.error}`));
                results.errors.push(result);
            }
        }

        this.printSummary(results);
        return results;
    }

    printSummary(results) {
        console.log(chalk.blue.bold('\n📊 URL Test Results Summary:'));
        console.log(chalk.gray('=' * 50));

        // Found URLs
        if (results.found.length > 0) {
            console.log(chalk.green.bold(`\n✓ Found (${results.found.length}):`));
            results.found.forEach(r => {
                console.log(chalk.green(`  ${r.path} → ${r.status}`));
            });
        }

        // Redirected URLs
        if (results.redirected.length > 0) {
            console.log(chalk.yellow.bold(`\n→ Redirected (${results.redirected.length}):`));
            results.redirected.forEach(r => {
                console.log(chalk.yellow(`  ${r.path} → ${r.status} → ${r.finalUrl}`));
            });
        }

        // Not Found URLs
        if (results.notFound.length > 0) {
            console.log(chalk.red.bold(`\n✗ Not Found (${results.notFound.length}):`));
            results.notFound.forEach(r => {
                console.log(chalk.red(`  ${r.path} → 404`));
            });
        }

        // Error URLs
        if (results.errors.length > 0) {
            console.log(chalk.red.bold(`\n❌ Errors (${results.errors.length}):`));
            results.errors.forEach(r => {
                console.log(chalk.red(`  ${r.path} → ${r.error || r.status}`));
            });
        }

        // Overall summary
        const total = this.testUrls.length;
        const successful = results.found.length + results.redirected.length;
        console.log(chalk.blue.bold(`\n📋 Overall: ${successful}/${total} accessible (${Math.round(successful/total*100)}%)`));
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new UrlStatusTester();
    tester.testAllUrls().catch(console.error);
}

module.exports = UrlStatusTester;