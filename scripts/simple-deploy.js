#!/usr/bin/env node

/**
 * IT-ERA Simple Deployment Script
 * Simplified deployment for immediate testing
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ITERASimpleDeployment {
    constructor() {
        this.deploymentUrl = null;
        this.emergencyPhone = '039 888 2041';
        
        console.log('🚀 IT-ERA Simple Deployment initialized');
    }
    
    async checkPrerequisites() {
        console.log('🔍 Checking deployment prerequisites...');
        
        try {
            // Check if wrangler is installed
            execSync('wrangler --version', { encoding: 'utf8' });
            console.log('✅ Wrangler CLI available');
        } catch (error) {
            console.error('❌ Wrangler CLI not found. Installing...');
            execSync('npm install -g wrangler@latest', { stdio: 'inherit' });
        }
        
        // Check authentication
        try {
            const whoami = execSync('wrangler whoami', { encoding: 'utf8' });
            console.log('✅ Cloudflare authentication verified');
            console.log('👤 User:', whoami.trim());
        } catch (error) {
            console.error('❌ Not authenticated with Cloudflare');
            console.log('🔐 Please run: wrangler login');
            console.log('Then run this script again.');
            process.exit(1);
        }
    }
    
    async buildProject() {
        console.log('🔨 Building project for deployment...');
        
        try {
            // Ensure web directory exists and has content
            if (!fs.existsSync(path.join(projectRoot, 'web'))) {
                throw new Error('Web directory not found');
            }
            
            // Check for index.html
            if (!fs.existsSync(path.join(projectRoot, 'web/index.html'))) {
                throw new Error('index.html not found in web directory');
            }
            
            console.log('✅ Project ready for deployment');
        } catch (error) {
            console.error('❌ Build preparation failed:', error.message);
            process.exit(1);
        }
    }
    
    async deployToCloudflare() {
        console.log('☁️ Deploying to Cloudflare Pages...');
        
        try {
            // Simple deployment command
            const deployOutput = execSync(
                'wrangler pages deploy web --project-name=it-era-website --compatibility-date=2024-09-07',
                { 
                    cwd: projectRoot, 
                    encoding: 'utf8',
                    stdio: 'pipe'
                }
            );
            
            console.log('📤 Deployment output:');
            console.log(deployOutput);
            
            // Extract deployment URL from output
            const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
            if (urlMatch) {
                this.deploymentUrl = urlMatch[0];
                console.log(`✅ Deployed to: ${this.deploymentUrl}`);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            console.log('📋 Error details:', error.stdout || error.stderr);
            
            // Try alternative deployment method
            console.log('🔄 Trying alternative deployment...');
            try {
                const altOutput = execSync(
                    'wrangler pages deploy web',
                    { 
                        cwd: projectRoot, 
                        encoding: 'utf8',
                        stdio: 'pipe'
                    }
                );
                
                console.log('📤 Alternative deployment output:');
                console.log(altOutput);
                
                const altUrlMatch = altOutput.match(/https:\/\/[^\s]+/);
                if (altUrlMatch) {
                    this.deploymentUrl = altUrlMatch[0];
                    console.log(`✅ Deployed to: ${this.deploymentUrl}`);
                    return true;
                }
                
            } catch (altError) {
                console.error('❌ Alternative deployment also failed:', altError.message);
                return false;
            }
        }
    }
    
    async testDeployment() {
        if (!this.deploymentUrl) {
            console.log('⚠️ No deployment URL available for testing');
            return false;
        }
        
        console.log('🧪 Testing deployed website...');
        
        try {
            // Test basic connectivity
            const response = await fetch(this.deploymentUrl);
            if (response.ok) {
                console.log('✅ Website is accessible');
                
                // Test emergency contact
                const html = await response.text();
                const phoneFound = html.includes(this.emergencyPhone);
                console.log(`📞 Emergency contact (${this.emergencyPhone}): ${phoneFound ? '✅ Found' : '❌ Missing'}`);
                
                return true;
            } else {
                console.log(`❌ Website returned status: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Testing failed:', error.message);
            return false;
        }
    }
    
    async runLighthouseTest() {
        if (!this.deploymentUrl) {
            console.log('⚠️ No deployment URL available for Lighthouse testing');
            return null;
        }
        
        console.log('🔍 Running Lighthouse test on deployed site...');
        
        try {
            const outputPath = './lighthouse-deployed.json';
            execSync(
                `lighthouse ${this.deploymentUrl} --output=json --output-path=${outputPath} --chrome-flags="--headless"`,
                { cwd: projectRoot, stdio: 'inherit' }
            );
            
            // Read and parse results
            const report = JSON.parse(fs.readFileSync(path.join(projectRoot, outputPath), 'utf8'));
            
            const scores = {
                performance: Math.round(report.categories.performance.score * 100),
                accessibility: Math.round(report.categories.accessibility.score * 100),
                bestPractices: Math.round(report.categories['best-practices'].score * 100),
                seo: Math.round(report.categories.seo.score * 100)
            };
            
            console.log('📊 Lighthouse Scores (Deployed):');
            console.log(`   Performance: ${scores.performance}/100 ${scores.performance >= 90 ? '✅' : '⚠️'}`);
            console.log(`   Accessibility: ${scores.accessibility}/100 ${scores.accessibility >= 80 ? '✅' : '⚠️'}`);
            console.log(`   Best Practices: ${scores.bestPractices}/100 ${scores.bestPractices >= 90 ? '✅' : '⚠️'}`);
            console.log(`   SEO: ${scores.seo}/100 ${scores.seo >= 85 ? '✅' : '⚠️'}`);
            
            return scores;
            
        } catch (error) {
            console.error('❌ Lighthouse test failed:', error.message);
            return null;
        }
    }
    
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            deploymentUrl: this.deploymentUrl,
            emergencyPhone: this.emergencyPhone,
            status: this.deploymentUrl ? 'deployed' : 'failed',
            nextSteps: [
                'Configure custom domain (it-era.it)',
                'Set up DNS records',
                'Enable SSL/TLS',
                'Configure redirects',
                'Monitor performance'
            ]
        };
        
        fs.writeFileSync(
            path.join(projectRoot, 'simple-deployment-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('📋 Deployment report saved to simple-deployment-report.json');
        return report;
    }
    
    async deploy() {
        try {
            await this.checkPrerequisites();
            await this.buildProject();
            
            const deploySuccess = await this.deployToCloudflare();
            
            if (deploySuccess) {
                await this.testDeployment();
                await this.runLighthouseTest();
            }
            
            const report = await this.generateReport();
            
            console.log('\n🎉 Simple deployment completed!');
            if (this.deploymentUrl) {
                console.log(`🌐 Live URL: ${this.deploymentUrl}`);
                console.log(`📞 Emergency Contact: ${this.emergencyPhone}`);
                console.log('\n📋 Next Steps:');
                console.log('1. Configure custom domain (it-era.it)');
                console.log('2. Set up DNS records');
                console.log('3. Run comprehensive online tests');
                console.log('4. Monitor performance metrics');
            } else {
                console.log('❌ Deployment failed - check logs above');
            }
            
            return report;
            
        } catch (error) {
            console.error('💥 Deployment failed:', error);
            process.exit(1);
        }
    }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const deployment = new ITERASimpleDeployment();
    deployment.deploy().catch(console.error);
}

export default ITERASimpleDeployment;
