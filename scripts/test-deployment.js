#!/usr/bin/env node

/**
 * IT-ERA Deployment Testing Suite
 * Comprehensive testing for deployed website
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ITERADeploymentTester {
    constructor(baseUrl = 'https://it-era.it') {
        this.baseUrl = baseUrl;
        this.emergencyPhone = '039 888 2041';
        this.testResults = {
            performance: {},
            functionality: {},
            accessibility: {},
            seo: {},
            security: {}
        };
        
        console.log(`🧪 IT-ERA Deployment Testing Suite initialized for ${baseUrl}`);
    }
    
    async runLighthouseAudit() {
        console.log('🔍 Running Lighthouse performance audit...');
        
        try {
            execSync(
                `lighthouse ${this.baseUrl} --output=json --output-path=./deployed-lighthouse-report.json --chrome-flags="--headless"`,
                { cwd: projectRoot, stdio: 'inherit' }
            );
            
            const report = JSON.parse(fs.readFileSync(path.join(projectRoot, 'deployed-lighthouse-report.json'), 'utf8'));
            
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
            
            console.log('📊 Lighthouse Results:');
            console.log(`   Performance: ${scores.performance}/100 ${this.getStatusIcon(scores.performance, 95)}`);
            console.log(`   Accessibility: ${scores.accessibility}/100 ${this.getStatusIcon(scores.accessibility, 80)}`);
            console.log(`   Best Practices: ${scores.bestPractices}/100 ${this.getStatusIcon(scores.bestPractices, 95)}`);
            console.log(`   SEO: ${scores.seo}/100 ${this.getStatusIcon(scores.seo, 90)}`);
            
            console.log('⚡ Core Web Vitals:');
            console.log(`   FCP: ${vitals.fcp}ms ${this.getStatusIcon(vitals.fcp, 1800, true)}`);
            console.log(`   LCP: ${vitals.lcp}ms ${this.getStatusIcon(vitals.lcp, 2500, true)}`);
            console.log(`   TBT: ${vitals.tbt}ms ${this.getStatusIcon(vitals.tbt, 300, true)}`);
            console.log(`   CLS: ${vitals.cls} ${this.getStatusIcon(parseFloat(vitals.cls), 0.1, true)}`);
            
            return true;
        } catch (error) {
            console.error('❌ Lighthouse audit failed:', error.message);
            return false;
        }
    }
    
    async testEmergencyContactLinks() {
        console.log('📞 Testing emergency contact functionality...');
        
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Test phone links
            const phoneLinks = html.match(/tel:\+390398882041/g) || [];
            const phoneDisplays = html.match(/039\s*888\s*2041/g) || [];
            const emergencyButtons = html.match(/supporto\s*urgente/gi) || [];
            
            this.testResults.functionality.emergencyContact = {
                phoneLinks: phoneLinks.length,
                phoneDisplays: phoneDisplays.length,
                emergencyButtons: emergencyButtons.length,
                passed: phoneLinks.length > 0 && phoneDisplays.length > 0
            };
            
            console.log(`📱 Phone links found: ${phoneLinks.length} ${this.getStatusIcon(phoneLinks.length, 1)}`);
            console.log(`📞 Phone displays found: ${phoneDisplays.length} ${this.getStatusIcon(phoneDisplays.length, 1)}`);
            console.log(`🚨 Emergency buttons found: ${emergencyButtons.length} ${this.getStatusIcon(emergencyButtons.length, 1)}`);
            
            return phoneLinks.length > 0 && phoneDisplays.length > 0;
        } catch (error) {
            console.error('❌ Emergency contact test failed:', error.message);
            return false;
        }
    }
    
    async testNavigationDropdowns() {
        console.log('🧭 Testing navigation functionality...');
        
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Test navigation elements
            const dropdownMenus = html.match(/dropdown-menu/g) || [];
            const navLinks = html.match(/nav-link/g) || [];
            const serviceLinks = html.match(/assistenza-it-|sicurezza-informatica-|cloud-storage-/g) || [];
            
            this.testResults.functionality.navigation = {
                dropdownMenus: dropdownMenus.length,
                navLinks: navLinks.length,
                serviceLinks: serviceLinks.length,
                passed: dropdownMenus.length > 0 && navLinks.length > 0
            };
            
            console.log(`📋 Dropdown menus: ${dropdownMenus.length} ${this.getStatusIcon(dropdownMenus.length, 1)}`);
            console.log(`🔗 Navigation links: ${navLinks.length} ${this.getStatusIcon(navLinks.length, 5)}`);
            console.log(`🛠️ Service links: ${serviceLinks.length} ${this.getStatusIcon(serviceLinks.length, 3)}`);
            
            return dropdownMenus.length > 0 && navLinks.length > 0;
        } catch (error) {
            console.error('❌ Navigation test failed:', error.message);
            return false;
        }
    }
    
    async testResponsiveDesign() {
        console.log('📱 Testing responsive design...');
        
        try {
            // Test different viewport sizes
            const viewports = [
                { name: 'Mobile', width: 375, height: 667 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Desktop', width: 1920, height: 1080 }
            ];
            
            const responsiveTests = [];
            
            for (const viewport of viewports) {
                try {
                    execSync(
                        `lighthouse ${this.baseUrl} --output=json --output-path=./responsive-${viewport.name.toLowerCase()}-report.json --chrome-flags="--headless --window-size=${viewport.width},${viewport.height}"`,
                        { cwd: projectRoot, stdio: 'pipe' }
                    );
                    
                    const report = JSON.parse(fs.readFileSync(path.join(projectRoot, `responsive-${viewport.name.toLowerCase()}-report.json`), 'utf8'));
                    const score = Math.round(report.categories.performance.score * 100);
                    
                    responsiveTests.push({
                        viewport: viewport.name,
                        score: score,
                        passed: score >= 85
                    });
                    
                    console.log(`   ${viewport.name} (${viewport.width}x${viewport.height}): ${score}/100 ${this.getStatusIcon(score, 85)}`);
                } catch (error) {
                    console.warn(`⚠️ ${viewport.name} test failed:`, error.message);
                    responsiveTests.push({
                        viewport: viewport.name,
                        score: 0,
                        passed: false
                    });
                }
            }
            
            this.testResults.functionality.responsive = responsiveTests;
            return responsiveTests.every(test => test.passed);
        } catch (error) {
            console.error('❌ Responsive design test failed:', error.message);
            return false;
        }
    }
    
    async testAIIntegrations() {
        console.log('🧠 Testing AI integrations...');
        
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Test AI integration elements
            const auggieReferences = html.match(/auggie/gi) || [];
            const openaiReferences = html.match(/openai|gpt/gi) || [];
            const chatbotElements = html.match(/chatbot|chat/gi) || [];
            const aiConfigScript = html.includes('ai-config.js');
            
            this.testResults.functionality.aiIntegrations = {
                auggieReferences: auggieReferences.length,
                openaiReferences: openaiReferences.length,
                chatbotElements: chatbotElements.length,
                aiConfigScript: aiConfigScript,
                passed: aiConfigScript && chatbotElements.length > 0
            };
            
            console.log(`🧠 Auggie references: ${auggieReferences.length} ${this.getStatusIcon(auggieReferences.length, 1)}`);
            console.log(`🤖 OpenAI references: ${openaiReferences.length} ${this.getStatusIcon(openaiReferences.length, 1)}`);
            console.log(`💬 Chatbot elements: ${chatbotElements.length} ${this.getStatusIcon(chatbotElements.length, 1)}`);
            console.log(`⚙️ AI config script: ${aiConfigScript ? 'Found' : 'Missing'} ${aiConfigScript ? '✅' : '❌'}`);
            
            return aiConfigScript && chatbotElements.length > 0;
        } catch (error) {
            console.error('❌ AI integrations test failed:', error.message);
            return false;
        }
    }
    
    async testServiceWorker() {
        console.log('⚙️ Testing service worker functionality...');
        
        try {
            const swResponse = await fetch(`${this.baseUrl}/sw.js`);
            const swExists = swResponse.ok;
            
            if (swExists) {
                const swContent = await swResponse.text();
                const hasCaching = swContent.includes('cache');
                const hasOfflineSupport = swContent.includes('offline');
                
                this.testResults.functionality.serviceWorker = {
                    exists: swExists,
                    hasCaching: hasCaching,
                    hasOfflineSupport: hasOfflineSupport,
                    passed: swExists && hasCaching
                };
                
                console.log(`📄 Service worker exists: ${swExists ? 'Yes' : 'No'} ${swExists ? '✅' : '❌'}`);
                console.log(`💾 Caching implemented: ${hasCaching ? 'Yes' : 'No'} ${hasCaching ? '✅' : '❌'}`);
                console.log(`📴 Offline support: ${hasOfflineSupport ? 'Yes' : 'No'} ${hasOfflineSupport ? '✅' : '❌'}`);
                
                return swExists && hasCaching;
            } else {
                console.log('❌ Service worker not found');
                return false;
            }
        } catch (error) {
            console.error('❌ Service worker test failed:', error.message);
            return false;
        }
    }
    
    async testInternalLinks() {
        console.log('🔗 Testing internal links...');
        
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Extract internal links
            const linkMatches = html.match(/href="([^"]*\.html)"/g) || [];
            const links = linkMatches.map(match => match.match(/href="([^"]*)"/)[1]);
            
            let workingLinks = 0;
            let brokenLinks = 0;
            
            for (const link of links.slice(0, 10)) { // Test first 10 links
                try {
                    const linkUrl = link.startsWith('http') ? link : `${this.baseUrl}${link}`;
                    const linkResponse = await fetch(linkUrl, { method: 'HEAD' });
                    
                    if (linkResponse.ok) {
                        workingLinks++;
                    } else {
                        brokenLinks++;
                        console.warn(`⚠️ Broken link: ${link} (${linkResponse.status})`);
                    }
                } catch (error) {
                    brokenLinks++;
                    console.warn(`⚠️ Link error: ${link}`);
                }
            }
            
            this.testResults.functionality.internalLinks = {
                totalTested: links.length,
                workingLinks: workingLinks,
                brokenLinks: brokenLinks,
                passed: brokenLinks === 0
            };
            
            console.log(`🔗 Links tested: ${links.length}`);
            console.log(`✅ Working links: ${workingLinks}`);
            console.log(`❌ Broken links: ${brokenLinks} ${brokenLinks === 0 ? '✅' : '⚠️'}`);
            
            return brokenLinks === 0;
        } catch (error) {
            console.error('❌ Internal links test failed:', error.message);
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
    
    async generateTestReport() {
        console.log('📋 Generating comprehensive test report...');
        
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
            this.testResults.performance.scores?.performance >= 95,
            this.testResults.performance.scores?.accessibility >= 80,
            this.testResults.performance.scores?.seo >= 90,
            this.testResults.functionality.emergencyContact?.passed,
            this.testResults.functionality.navigation?.passed,
            this.testResults.functionality.aiIntegrations?.passed,
            this.testResults.functionality.serviceWorker?.passed,
            this.testResults.functionality.internalLinks?.passed
        ].filter(test => test !== undefined);
        
        report.summary.totalTests = allTests.length;
        report.summary.passedTests = allTests.filter(test => test === true).length;
        report.summary.failedTests = allTests.filter(test => test === false).length;
        report.summary.overallStatus = report.summary.failedTests === 0 ? 'PASSED' : 'FAILED';
        
        fs.writeFileSync(
            path.join(projectRoot, 'deployment-test-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('✅ Test report saved to deployment-test-report.json');
        return report;
    }
    
    async runAllTests() {
        console.log('🚀 Starting comprehensive deployment testing...\n');
        
        try {
            // Performance tests
            await this.runLighthouseAudit();
            console.log('');
            
            // Functionality tests
            await this.testEmergencyContactLinks();
            await this.testNavigationDropdowns();
            await this.testResponsiveDesign();
            await this.testAIIntegrations();
            await this.testServiceWorker();
            await this.testInternalLinks();
            
            // Generate report
            const report = await this.generateTestReport();
            
            console.log('\n🎉 Testing completed!');
            console.log(`📊 Overall Status: ${report.summary.overallStatus}`);
            console.log(`✅ Passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
            console.log(`❌ Failed: ${report.summary.failedTests}/${report.summary.totalTests}`);
            
            return report;
            
        } catch (error) {
            console.error('💥 Testing failed:', error);
            process.exit(1);
        }
    }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const baseUrl = process.argv[2] || 'https://it-era.it';
    const tester = new ITERADeploymentTester(baseUrl);
    tester.runAllTests().catch(console.error);
}

export default ITERADeploymentTester;
