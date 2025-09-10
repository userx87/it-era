#!/usr/bin/env node

/**
 * IT-ERA Cloudflare Pages Deployment Script
 * Automated deployment with performance validation
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ITERACloudflareDeployment {
    constructor() {
        this.deploymentId = null;
        this.deploymentUrl = null;
        this.customDomain = 'it-era.it';
        this.emergencyPhone = '039 888 2041';
        
        console.log('🚀 IT-ERA Cloudflare Deployment initialized');
    }
    
    async checkPrerequisites() {
        console.log('🔍 Checking deployment prerequisites...');
        
        try {
            // Check if wrangler is installed
            execSync('wrangler --version', { encoding: 'utf8' });
            console.log('✅ Wrangler CLI available');
        } catch (error) {
            console.error('❌ Wrangler CLI not found. Installing...');
            execSync('npm install -g wrangler', { stdio: 'inherit' });
        }
        
        // Check if user is authenticated
        try {
            execSync('wrangler whoami', { encoding: 'utf8' });
            console.log('✅ Cloudflare authentication verified');
        } catch (error) {
            console.error('❌ Not authenticated with Cloudflare');
            console.log('Please run: wrangler login');
            process.exit(1);
        }
        
        // Verify optimized files exist
        const criticalFiles = [
            'web/index.html',
            'web/styles.css',
            'web/menu-clean.html',
            'web/js/ai-config.js',
            'web/js/auggie-integration.js',
            '_headers',
            '_redirects'
        ];
        
        for (const file of criticalFiles) {
            if (!fs.existsSync(path.join(projectRoot, file))) {
                console.error(`❌ Critical file missing: ${file}`);
                process.exit(1);
            }
        }
        
        console.log('✅ All critical files present');
    }
    
    async buildProject() {
        console.log('🔨 Building project for deployment...');
        
        try {
            // Run build process
            execSync('npm run build', { 
                cwd: projectRoot, 
                stdio: 'inherit' 
            });
            
            // Verify build output
            if (!fs.existsSync(path.join(projectRoot, 'web'))) {
                throw new Error('Build output directory not found');
            }
            
            console.log('✅ Project built successfully');
        } catch (error) {
            console.error('❌ Build failed:', error.message);
            process.exit(1);
        }
    }
    
    async deployToCloudflare() {
        console.log('☁️ Deploying to Cloudflare Pages...');
        
        try {
            // Deploy using wrangler
            const deployOutput = execSync(
                'wrangler pages deploy web --project-name=it-era-website --compatibility-date=2024-09-07',
                { 
                    cwd: projectRoot, 
                    encoding: 'utf8' 
                }
            );
            
            // Extract deployment URL from output
            const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
            if (urlMatch) {
                this.deploymentUrl = urlMatch[0];
                console.log(`✅ Deployed to: ${this.deploymentUrl}`);
            }
            
            // Extract deployment ID
            const idMatch = deployOutput.match(/Deployment ID: ([a-f0-9-]+)/);
            if (idMatch) {
                this.deploymentId = idMatch[1];
                console.log(`📋 Deployment ID: ${this.deploymentId}`);
            }
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            process.exit(1);
        }
    }
    
    async configureCustomDomain() {
        console.log('🌐 Configuring custom domain...');
        
        try {
            // Add custom domain
            execSync(
                `wrangler pages domain add ${this.customDomain} --project-name=it-era-website`,
                { cwd: projectRoot, stdio: 'inherit' }
            );
            
            console.log(`✅ Custom domain ${this.customDomain} configured`);
            
            // Configure www redirect
            execSync(
                `wrangler pages domain add www.${this.customDomain} --project-name=it-era-website`,
                { cwd: projectRoot, stdio: 'inherit' }
            );
            
            console.log(`✅ WWW redirect configured`);
            
        } catch (error) {
            console.warn('⚠️ Custom domain configuration may need manual setup:', error.message);
        }
    }
    
    async runPerformanceTests() {
        console.log('🧪 Running performance tests...');
        
        const testUrl = this.deploymentUrl || `https://${this.customDomain}`;
        
        try {
            // Run Lighthouse audit
            console.log('🔍 Running Lighthouse audit...');
            const lighthouseResult = execSync(
                `lighthouse ${testUrl} --output=json --output-path=./deployment-lighthouse-report.json --chrome-flags="--headless"`,
                { cwd: projectRoot, encoding: 'utf8' }
            );
            
            // Parse results
            const report = JSON.parse(fs.readFileSync(path.join(projectRoot, 'deployment-lighthouse-report.json'), 'utf8'));
            
            const scores = {
                performance: Math.round(report.categories.performance.score * 100),
                accessibility: Math.round(report.categories.accessibility.score * 100),
                bestPractices: Math.round(report.categories['best-practices'].score * 100),
                seo: Math.round(report.categories.seo.score * 100)
            };
            
            console.log('📊 Lighthouse Scores:');
            console.log(`   Performance: ${scores.performance}/100 ${scores.performance >= 95 ? '✅' : '⚠️'}`);
            console.log(`   Accessibility: ${scores.accessibility}/100 ${scores.accessibility >= 80 ? '✅' : '⚠️'}`);
            console.log(`   Best Practices: ${scores.bestPractices}/100 ${scores.bestPractices >= 95 ? '✅' : '⚠️'}`);
            console.log(`   SEO: ${scores.seo}/100 ${scores.seo >= 90 ? '✅' : '⚠️'}`);
            
            // Core Web Vitals
            const audits = report.audits;
            const vitals = {
                fcp: Math.round(audits['first-contentful-paint'].numericValue),
                lcp: Math.round(audits['largest-contentful-paint'].numericValue),
                tbt: Math.round(audits['total-blocking-time'].numericValue),
                cls: audits['cumulative-layout-shift'].numericValue.toFixed(3)
            };
            
            console.log('⚡ Core Web Vitals:');
            console.log(`   FCP: ${vitals.fcp}ms ${vitals.fcp < 1800 ? '✅' : '⚠️'}`);
            console.log(`   LCP: ${vitals.lcp}ms ${vitals.lcp < 2500 ? '✅' : '⚠️'}`);
            console.log(`   TBT: ${vitals.tbt}ms ${vitals.tbt < 300 ? '✅' : '⚠️'}`);
            console.log(`   CLS: ${vitals.cls} ${parseFloat(vitals.cls) < 0.1 ? '✅' : '⚠️'}`);
            
            return { scores, vitals };
            
        } catch (error) {
            console.error('❌ Performance tests failed:', error.message);
            return null;
        }
    }
    
    async testEmergencyContact() {
        console.log('📞 Testing emergency contact functionality...');
        
        const testUrl = this.deploymentUrl || `https://${this.customDomain}`;
        
        try {
            // Test emergency phone link
            const response = await fetch(testUrl);
            const html = await response.text();
            
            const phoneLinks = html.match(/tel:\+390398882041/g) || [];
            const phoneDisplays = html.match(/039\s*888\s*2041/g) || [];
            
            console.log(`📱 Emergency phone links found: ${phoneLinks.length} ${phoneLinks.length > 0 ? '✅' : '❌'}`);
            console.log(`📞 Phone number displays found: ${phoneDisplays.length} ${phoneDisplays.length > 0 ? '✅' : '❌'}`);
            
            return phoneLinks.length > 0 && phoneDisplays.length > 0;
            
        } catch (error) {
            console.error('❌ Emergency contact test failed:', error.message);
            return false;
        }
    }
    
    async generateDeploymentReport() {
        console.log('📋 Generating deployment report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            deploymentId: this.deploymentId,
            deploymentUrl: this.deploymentUrl,
            customDomain: this.customDomain,
            emergencyPhone: this.emergencyPhone,
            status: 'deployed',
            tests: {
                performance: await this.runPerformanceTests(),
                emergencyContact: await this.testEmergencyContact()
            }
        };
        
        fs.writeFileSync(
            path.join(projectRoot, 'deployment-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('✅ Deployment report saved to deployment-report.json');
        return report;
    }
    
    async deploy() {
        try {
            await this.checkPrerequisites();
            await this.buildProject();
            await this.deployToCloudflare();
            await this.configureCustomDomain();
            
            // Wait for deployment to propagate
            console.log('⏳ Waiting for deployment to propagate...');
            await new Promise(resolve => setTimeout(resolve, 30000));
            
            const report = await this.generateDeploymentReport();
            
            console.log('\n🎉 Deployment completed successfully!');
            console.log(`🌐 Live URL: https://${this.customDomain}`);
            console.log(`📞 Emergency Contact: ${this.emergencyPhone}`);
            console.log(`📋 Deployment ID: ${this.deploymentId}`);
            
            return report;
            
        } catch (error) {
            console.error('💥 Deployment failed:', error);
            process.exit(1);
        }
    }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const deployment = new ITERACloudflareDeployment();
    deployment.deploy().catch(console.error);
}

export default ITERACloudflareDeployment;
