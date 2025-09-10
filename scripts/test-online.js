#!/usr/bin/env node

/**
 * IT-ERA Online Testing Suite
 * Comprehensive testing for deployed website
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ITERAOnlineTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || this.getDeployedUrl();
        this.emergencyPhone = '039 888 2041';
        this.testResults = {
            connectivity: {},
            performance: {},
            functionality: {},
            seo: {},
            security: {},
            emergency: {}
        };
        
        console.log(`🧪 IT-ERA Online Testing Suite initialized for ${this.baseUrl}`);
    }
    
    getDeployedUrl() {
        try {
            // Try to read from deployment report
            const reportPath = path.join(projectRoot, 'simple-deployment-report.json');
            if (fs.existsSync(reportPath)) {
                const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
                if (report.deploymentUrl) {
                    return report.deploymentUrl;
                }
            }
            
            // Fallback to production domain
            return 'https://it-era.it';
        } catch (error) {
            console.warn('⚠️ Could not determine deployed URL, using production domain');
            return 'https://it-era.it';
        }
    }
    
    async testConnectivity() {
        console.log('🌐 Testing website connectivity...');
        
        try {
            const response = await fetch(this.baseUrl);
            const responseTime = Date.now();
            
            this.testResults.connectivity = {
                status: response.status,
                ok: response.ok,
                responseTime: responseTime,
                headers: Object.fromEntries(response.headers.entries()),
                passed: response.ok
            };
            
            console.log(`📡 Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
            console.log(`⏱️ Response time: ${responseTime}ms`);
            
            return response.ok;
        } catch (error) {
            console.error('❌ Connectivity test failed:', error.message);
            this.testResults.connectivity = { passed: false, error: error.message };
            return false;
        }
    }
    
    async testEmergencyContact() {
        console.log('📞 Testing emergency contact functionality...');
        
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Test phone number presence
            const phoneRegex = /039[\s\-]*888[\s\-]*2041/g;
            const phoneMatches = html.match(phoneRegex) || [];
            
            // Test tel: links
            const telRegex = /tel:\+?39[\s\-]*039[\s\-]*888[\s\-]*2041/g;
            const telMatches = html.match(telRegex) || [];
            
            // Test emergency keywords
            const emergencyKeywords = ['emergenza', 'urgente', 'immediato', '24/7', '15 minuti'];
            const keywordMatches = emergencyKeywords.filter(keyword => 
                html.toLowerCase().includes(keyword.toLowerCase())
            );
            
            this.testResults.emergency = {
                phoneDisplays: phoneMatches.length,
                telLinks: telMatches.length,
                emergencyKeywords: keywordMatches.length,
                keywordsFound: keywordMatches,
                passed: phoneMatches.length > 0 && telMatches.length > 0
            };
            
            console.log(`📱 Phone displays: ${phoneMatches.length} ${phoneMatches.length > 0 ? '✅' : '❌'}`);
            console.log(`☎️ Tel links: ${telMatches.length} ${telMatches.length > 0 ? '✅' : '❌'}`);
            console.log(`🚨 Emergency keywords: ${keywordMatches.length} ${keywordMatches.length > 0 ? '✅' : '❌'}`);
            
            return phoneMatches.length > 0 && telMatches.length > 0;
        } catch (error) {
            console.error('❌ Emergency contact test failed:', error.message);
            this.testResults.emergency = { passed: false, error: error.message };
            return false;
        }
    }
    
    async testLombardyCoverage() {
        console.log('🗺️ Testing Lombardy coverage...');
        
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            const lombardyCities = [
                'Milano', 'Bergamo', 'Brescia', 'Monza', 'Como', 
                'Cremona', 'Lecco', 'Lodi', 'Mantova', 'Pavia', 
                'Sondrio', 'Varese', 'Lombardia'
            ];
            
            const foundCities = lombardyCities.filter(city => 
                html.includes(city)
            );
            
            this.testResults.seo.lombardyCoverage = {
                totalCities: lombardyCities.length,
                foundCities: foundCities.length,
                cities: foundCities,
                coverage: Math.round((foundCities.length / lombardyCities.length) * 100),
                passed: foundCities.length >= 8
            };
            
            console.log(`🏙️ Cities found: ${foundCities.length}/${lombardyCities.length} (${Math.round((foundCities.length / lombardyCities.length) * 100)}%)`);
            console.log(`📍 Coverage: ${foundCities.length >= 8 ? '✅' : '⚠️'}`);
            
            return foundCities.length >= 8;
        } catch (error) {
            console.error('❌ Lombardy coverage test failed:', error.message);
            return false;
        }
    }
    
    async testStructuredData() {
        console.log('📋 Testing structured data...');
        
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Find JSON-LD scripts
            const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
            const jsonLdMatches = html.match(jsonLdRegex) || [];
            
            let validSchemas = 0;
            const schemaTypes = [];
            
            jsonLdMatches.forEach(match => {
                try {
                    const jsonContent = match.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
                    const schema = JSON.parse(jsonContent.trim());
                    
                    if (schema['@type']) {
                        schemaTypes.push(schema['@type']);
                        validSchemas++;
                    }
                } catch (error) {
                    console.warn('⚠️ Invalid JSON-LD schema found');
                }
            });
            
            this.testResults.seo.structuredData = {
                totalSchemas: jsonLdMatches.length,
                validSchemas: validSchemas,
                schemaTypes: schemaTypes,
                passed: validSchemas >= 3
            };
            
            console.log(`📊 Structured data schemas: ${validSchemas} ${validSchemas >= 3 ? '✅' : '⚠️'}`);
            console.log(`🏷️ Schema types: ${schemaTypes.join(', ')}`);
            
            return validSchemas >= 3;
        } catch (error) {
            console.error('❌ Structured data test failed:', error.message);
            return false;
        }
    }
    
    async runLighthouseAudit() {
        console.log('🔍 Running comprehensive Lighthouse audit...');
        
        try {
            const outputPath = './lighthouse-online-test.json';
            execSync(
                `lighthouse ${this.baseUrl} --output=json --output-path=${outputPath} --chrome-flags="--headless"`,
                { cwd: projectRoot, stdio: 'pipe' }
            );
            
            const report = JSON.parse(fs.readFileSync(path.join(projectRoot, outputPath), 'utf8'));
            
            const scores = {
                performance: Math.round(report.categories.performance.score * 100),
                accessibility: Math.round(report.categories.accessibility.score * 100),
                bestPractices: Math.round(report.categories['best-practices'].score * 100),
                seo: Math.round(report.categories.seo.score * 100)
            };
            
            const audits = report.audits;
            const vitals = {
                fcp: Math.round(audits['first-contentful-paint'].numericValue),
                lcp: Math.round(audits['largest-contentful-paint'].numericValue),
                tbt: Math.round(audits['total-blocking-time'].numericValue),
                cls: audits['cumulative-layout-shift'].numericValue.toFixed(3)
            };
            
            this.testResults.performance = { scores, vitals };
            
            console.log('📊 Lighthouse Results (Online):');
            console.log(`   Performance: ${scores.performance}/100 ${this.getStatusIcon(scores.performance, 90)}`);
            console.log(`   Accessibility: ${scores.accessibility}/100 ${this.getStatusIcon(scores.accessibility, 80)}`);
            console.log(`   Best Practices: ${scores.bestPractices}/100 ${this.getStatusIcon(scores.bestPractices, 90)}`);
            console.log(`   SEO: ${scores.seo}/100 ${this.getStatusIcon(scores.seo, 85)}`);
            
            console.log('⚡ Core Web Vitals (Online):');
            console.log(`   FCP: ${vitals.fcp}ms ${this.getStatusIcon(vitals.fcp, 1800, true)}`);
            console.log(`   LCP: ${vitals.lcp}ms ${this.getStatusIcon(vitals.lcp, 2500, true)}`);
            console.log(`   TBT: ${vitals.tbt}ms ${this.getStatusIcon(vitals.tbt, 300, true)}`);
            console.log(`   CLS: ${vitals.cls} ${this.getStatusIcon(parseFloat(vitals.cls), 0.1, true)}`);
            
            return scores.performance >= 90 && scores.seo >= 85;
        } catch (error) {
            console.error('❌ Lighthouse audit failed:', error.message);
            return false;
        }
    }
    
    async testMobileResponsiveness() {
        console.log('📱 Testing mobile responsiveness...');
        
        try {
            // Test different viewport sizes
            const viewports = [
                { name: 'Mobile', width: 375, height: 667 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Desktop', width: 1920, height: 1080 }
            ];
            
            const responsiveResults = [];
            
            for (const viewport of viewports) {
                try {
                    const outputPath = `./lighthouse-${viewport.name.toLowerCase()}-online.json`;
                    execSync(
                        `lighthouse ${this.baseUrl} --output=json --output-path=${outputPath} --chrome-flags="--headless --window-size=${viewport.width},${viewport.height}"`,
                        { cwd: projectRoot, stdio: 'pipe' }
                    );
                    
                    const report = JSON.parse(fs.readFileSync(path.join(projectRoot, outputPath), 'utf8'));
                    const score = Math.round(report.categories.performance.score * 100);
                    
                    responsiveResults.push({
                        viewport: viewport.name,
                        score: score,
                        passed: score >= 80
                    });
                    
                    console.log(`   ${viewport.name}: ${score}/100 ${this.getStatusIcon(score, 80)}`);
                } catch (error) {
                    console.warn(`⚠️ ${viewport.name} test failed`);
                    responsiveResults.push({
                        viewport: viewport.name,
                        score: 0,
                        passed: false
                    });
                }
            }
            
            this.testResults.functionality.responsive = responsiveResults;
            return responsiveResults.every(result => result.passed);
        } catch (error) {
            console.error('❌ Mobile responsiveness test failed:', error.message);
            return false;
        }
    }
    
    async testSecurityHeaders() {
        console.log('🔒 Testing security headers...');
        
        try {
            const response = await fetch(this.baseUrl);
            const headers = response.headers;
            
            const securityHeaders = {
                'x-frame-options': headers.get('x-frame-options'),
                'x-content-type-options': headers.get('x-content-type-options'),
                'x-xss-protection': headers.get('x-xss-protection'),
                'strict-transport-security': headers.get('strict-transport-security'),
                'content-security-policy': headers.get('content-security-policy')
            };
            
            const presentHeaders = Object.entries(securityHeaders)
                .filter(([key, value]) => value !== null).length;
            
            this.testResults.security = {
                headers: securityHeaders,
                presentHeaders: presentHeaders,
                totalHeaders: Object.keys(securityHeaders).length,
                passed: presentHeaders >= 3
            };
            
            console.log(`🛡️ Security headers: ${presentHeaders}/${Object.keys(securityHeaders).length} ${presentHeaders >= 3 ? '✅' : '⚠️'}`);
            
            return presentHeaders >= 3;
        } catch (error) {
            console.error('❌ Security headers test failed:', error.message);
            return false;
        }
    }
    
    getStatusIcon(value, threshold, isLowerBetter = false) {
        if (isLowerBetter) {
            return value <= threshold ? '✅' : '⚠️';
        } else {
            return value >= threshold ? '✅' : '⚠️';
        }
    }
    
    async generateOnlineTestReport() {
        console.log('📋 Generating comprehensive online test report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            emergencyPhone: this.emergencyPhone,
            testResults: this.testResults,
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                overallStatus: 'unknown'
            }
        };
        
        // Calculate summary
        const allTests = [
            this.testResults.connectivity?.passed,
            this.testResults.emergency?.passed,
            this.testResults.seo?.lombardyCoverage?.passed,
            this.testResults.seo?.structuredData?.passed,
            this.testResults.performance?.scores?.performance >= 90,
            this.testResults.performance?.scores?.seo >= 85,
            this.testResults.functionality?.responsive?.every(r => r.passed),
            this.testResults.security?.passed
        ].filter(test => test !== undefined);
        
        report.summary.totalTests = allTests.length;
        report.summary.passedTests = allTests.filter(test => test === true).length;
        report.summary.failedTests = allTests.filter(test => test === false).length;
        report.summary.overallStatus = report.summary.failedTests === 0 ? 'PASSED' : 'NEEDS_ATTENTION';
        
        fs.writeFileSync(
            path.join(projectRoot, 'online-test-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('✅ Online test report saved to online-test-report.json');
        return report;
    }
    
    async runAllTests() {
        console.log('🚀 Starting comprehensive online testing...\n');
        
        try {
            // Core functionality tests
            await this.testConnectivity();
            await this.testEmergencyContact();
            await this.testLombardyCoverage();
            await this.testStructuredData();
            
            // Performance tests
            await this.runLighthouseAudit();
            await this.testMobileResponsiveness();
            
            // Security tests
            await this.testSecurityHeaders();
            
            // Generate comprehensive report
            const report = await this.generateOnlineTestReport();
            
            console.log('\n🎉 Online testing completed!');
            console.log(`📊 Overall Status: ${report.summary.overallStatus}`);
            console.log(`✅ Passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
            console.log(`⚠️ Needs Attention: ${report.summary.failedTests}/${report.summary.totalTests}`);
            
            if (report.summary.overallStatus === 'PASSED') {
                console.log('\n🎉 All tests passed! Website is ready for production.');
            } else {
                console.log('\n⚠️ Some tests need attention. Check the report for details.');
            }
            
            return report;
            
        } catch (error) {
            console.error('💥 Online testing failed:', error);
            process.exit(1);
        }
    }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const baseUrl = process.argv[2];
    const tester = new ITERAOnlineTester(baseUrl);
    tester.runAllTests().catch(console.error);
}

export default ITERAOnlineTester;
