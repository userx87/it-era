#!/usr/bin/env node

/**
 * IT-ERA CI/CD Pipeline Verification Script
 * 
 * This script verifies that all pipeline components are properly configured
 * and ready for production deployment verification.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class PipelineVerifier {
  constructor() {
    this.results = {
      workflowFiles: [],
      endpoints: [],
      configuration: [],
      security: [],
      overall: 'unknown'
    };
    
    this.requiredWorkflows = [
      'production-deployment-verification.yml',
      'continuous-monitoring.yml',
      'deployment-validation.yml',
      'performance-benchmarking.yml'
    ];
    
    this.endpoints = [
      {
        name: 'Chatbot API',
        url: 'https://it-era-chatbot-prod.bulltech.workers.dev/api/chat',
        method: 'POST',
        expectedStatus: 200
      },
      {
        name: 'Email API',
        url: 'https://it-era-email.bulltech.workers.dev/api',
        method: 'GET',
        expectedStatus: 200
      },
      {
        name: 'Health Check',
        url: 'https://it-era-chatbot-prod.bulltech.workers.dev/health',
        method: 'GET',
        expectedStatus: 200
      }
    ];
  }
  
  log(message, type = 'info') {
    const prefix = {
      'info': '🔍',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'title': '🚀'
    };
    
    console.log(`${prefix[type]} ${message}`);
  }
  
  async verifyWorkflowFiles() {
    this.log('Verifying GitHub Actions workflow files...', 'title');
    
    const workflowsDir = path.join(__dirname, '../workflows');
    
    if (!fs.existsSync(workflowsDir)) {
      this.log('Workflows directory not found!', 'error');
      return false;
    }
    
    let allWorkflowsFound = true;
    
    for (const workflow of this.requiredWorkflows) {
      const workflowPath = path.join(workflowsDir, workflow);
      
      if (fs.existsSync(workflowPath)) {
        const content = fs.readFileSync(workflowPath, 'utf8');
        const size = (content.length / 1024).toFixed(2);
        
        this.log(`Found ${workflow} (${size}KB)`, 'success');
        this.results.workflowFiles.push({ name: workflow, status: 'found', size: `${size}KB` });
        
        // Basic validation checks
        if (!content.includes('on:')) {
          this.log(`${workflow}: Missing trigger configuration`, 'warning');
        }
        
        if (!content.includes('jobs:')) {
          this.log(`${workflow}: Missing jobs configuration`, 'warning');
        }
        
      } else {
        this.log(`Missing workflow file: ${workflow}`, 'error');
        this.results.workflowFiles.push({ name: workflow, status: 'missing' });
        allWorkflowsFound = false;
      }
    }
    
    return allWorkflowsFound;
  }
  
  async testEndpoint(endpoint) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = new URL(endpoint.url);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://it-era.it',
          'User-Agent': 'IT-ERA-Pipeline-Verifier/1.0'
        },
        timeout: 10000
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const success = res.statusCode === endpoint.expectedStatus;
          
          resolve({
            success,
            statusCode: res.statusCode,
            responseTime,
            dataSize: data.length
          });
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Timeout',
          responseTime: 10000
        });
      });
      
      // Send test data for POST requests
      if (endpoint.method === 'POST') {
        req.write(JSON.stringify({
          message: 'Pipeline verification test',
          sessionId: 'pipeline-verify-' + Date.now()
        }));
      }
      
      req.end();
    });
  }
  
  async verifyEndpoints() {
    this.log('Verifying production API endpoints...', 'title');
    
    for (const endpoint of this.endpoints) {
      this.log(`Testing ${endpoint.name}...`, 'info');
      
      const result = await this.testEndpoint(endpoint);
      
      if (result.success) {
        this.log(`${endpoint.name}: Healthy (${result.responseTime}ms)`, 'success');
        this.results.endpoints.push({
          name: endpoint.name,
          status: 'healthy',
          responseTime: result.responseTime,
          statusCode: result.statusCode
        });
      } else {
        this.log(`${endpoint.name}: Failed - ${result.error || `HTTP ${result.statusCode}`} (${result.responseTime}ms)`, 'error');
        this.results.endpoints.push({
          name: endpoint.name,
          status: 'failed',
          error: result.error || `HTTP ${result.statusCode}`,
          responseTime: result.responseTime
        });
      }
    }
  }
  
  async verifyConfiguration() {
    this.log('Verifying configuration files...', 'title');
    
    const configFiles = [
      { path: '../../api/wrangler.toml', name: 'Email API Wrangler Config' },
      { path: '../../api/wrangler-chatbot.toml', name: 'Chatbot API Wrangler Config' },
      { path: '../../api/package.json', name: 'API Package Config' },
      { path: '../README-CICD-PIPELINE.md', name: 'Pipeline Documentation' }
    ];
    
    for (const config of configFiles) {
      const configPath = path.join(__dirname, config.path);
      
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        const size = (content.length / 1024).toFixed(2);
        
        this.log(`${config.name}: Found (${size}KB)`, 'success');
        this.results.configuration.push({ name: config.name, status: 'found', size: `${size}KB` });
        
        // Specific validations
        if (config.path.includes('wrangler.toml')) {
          if (!content.includes('account_id')) {
            this.log(`${config.name}: Missing account_id`, 'warning');
          }
          if (!content.includes('compatibility_date')) {
            this.log(`${config.name}: Missing compatibility_date`, 'warning');
          }
          if (!content.includes('[env.production]') && !content.includes('ENVIRONMENT = "production"')) {
            this.log(`${config.name}: Missing production environment config`, 'warning');
          }
        }
      } else {
        this.log(`${config.name}: Missing`, 'error');
        this.results.configuration.push({ name: config.name, status: 'missing' });
      }
    }
  }
  
  async verifySecurityConfiguration() {
    this.log('Verifying security configuration...', 'title');
    
    // Test CORS configuration
    this.log('Testing CORS configuration...', 'info');
    
    try {
      const corsTest = await this.testCORS();
      
      if (corsTest.success) {
        this.log('CORS configuration: Properly configured', 'success');
        this.results.security.push({ check: 'CORS', status: 'configured' });
      } else {
        this.log('CORS configuration: Issues detected', 'warning');
        this.results.security.push({ check: 'CORS', status: 'issues', details: corsTest.error });
      }
    } catch (error) {
      this.log(`CORS test failed: ${error.message}`, 'error');
      this.results.security.push({ check: 'CORS', status: 'failed', error: error.message });
    }
    
    // Check for hardcoded secrets in workflow files
    this.log('Scanning for hardcoded secrets...', 'info');
    
    const workflowsDir = path.join(__dirname, '../workflows');
    let secretsFound = false;
    
    if (fs.existsSync(workflowsDir)) {
      const files = fs.readdirSync(workflowsDir);
      
      for (const file of files) {
        const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        
        // Look for potential hardcoded secrets
        const secretPatterns = [
          /api_key.*[=:].*(sk-|pk_)[a-zA-Z0-9]{32,}/i,
          /token.*[=:].*(ghp_|gho_|ghu_|ghs_)[a-zA-Z0-9_]{36,}/i,
          /webhook.*[=:].*https:\/\/.*\.webhook\.office\.com/i
        ];
        
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            this.log(`Potential hardcoded secret in ${file}`, 'warning');
            secretsFound = true;
          }
        }
      }
    }
    
    if (!secretsFound) {
      this.log('Secret scanning: No hardcoded secrets detected', 'success');
      this.results.security.push({ check: 'Secrets', status: 'clean' });
    }
  }
  
  async testCORS() {
    return new Promise((resolve) => {
      const options = {
        hostname: 'it-era-chatbot-prod.bulltech.workers.dev',
        port: 443,
        path: '/api/chat',
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://it-era.it',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout: 5000
      };
      
      const req = https.request(options, (res) => {
        const corsHeaders = {
          'access-control-allow-origin': res.headers['access-control-allow-origin'],
          'access-control-allow-methods': res.headers['access-control-allow-methods'],
          'access-control-allow-headers': res.headers['access-control-allow-headers']
        };
        
        const hasOrigin = corsHeaders['access-control-allow-origin'];
        const allowsPost = corsHeaders['access-control-allow-methods']?.includes('POST');
        const allowsContentType = corsHeaders['access-control-allow-headers']?.includes('content-type');
        
        resolve({
          success: hasOrigin && (allowsPost || res.statusCode === 200),
          headers: corsHeaders
        });
      });
      
      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });
      
      req.end();
    });
  }
  
  generateReport() {
    this.log('Generating verification report...', 'title');
    
    const workflowsHealthy = this.results.workflowFiles.every(w => w.status === 'found');
    const endpointsHealthy = this.results.endpoints.every(e => e.status === 'healthy');
    const configHealthy = this.results.configuration.every(c => c.status === 'found');
    const securityHealthy = this.results.security.every(s => s.status !== 'failed');
    
    this.results.overall = workflowsHealthy && endpointsHealthy && configHealthy && securityHealthy ? 'healthy' : 'issues';
    
    const report = {
      timestamp: new Date().toISOString(),
      overall_status: this.results.overall,
      summary: {
        workflows: `${this.results.workflowFiles.filter(w => w.status === 'found').length}/${this.requiredWorkflows.length}`,
        endpoints: `${this.results.endpoints.filter(e => e.status === 'healthy').length}/${this.endpoints.length}`,
        configuration: `${this.results.configuration.filter(c => c.status === 'found').length}/${this.results.configuration.length}`,
        security: `${this.results.security.filter(s => s.status !== 'failed').length}/${this.results.security.length}`
      },
      details: this.results
    };
    
    // Save report
    fs.writeFileSync(
      path.join(__dirname, '../pipeline-verification-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    // Display summary
    console.log('\\n' + '='.repeat(60));
    console.log('📊 IT-ERA PIPELINE VERIFICATION REPORT');
    console.log('='.repeat(60));
    console.log(`🕐 Timestamp: ${report.timestamp}`);
    console.log(`🎯 Overall Status: ${this.results.overall === 'healthy' ? '✅ HEALTHY' : '⚠️ ISSUES DETECTED'}`);
    console.log('');
    console.log('📋 Component Status:');
    console.log(`  🔧 Workflows: ${report.summary.workflows} configured`);
    console.log(`  🌐 Endpoints: ${report.summary.endpoints} healthy`);
    console.log(`  ⚙️  Configuration: ${report.summary.configuration} found`);
    console.log(`  🛡️  Security: ${report.summary.security} checks passed`);
    console.log('');
    
    if (this.results.overall === 'healthy') {
      console.log('🎉 All systems are ready for production deployment!');
      console.log('');
      console.log('🚀 Next steps:');
      console.log('  1. Commit and push workflow files to repository');
      console.log('  2. Configure GitHub secrets (TEAMS_WEBHOOK_URL)');
      console.log('  3. Enable workflow permissions in repository settings');
      console.log('  4. Trigger initial deployment verification');
    } else {
      console.log('⚠️  Issues detected - review the details above');
      console.log('');
      console.log('🔧 Recommended actions:');
      
      if (!workflowsHealthy) {
        console.log('  - Ensure all workflow files are present in .github/workflows/');
      }
      if (!endpointsHealthy) {
        console.log('  - Check API endpoint availability and configuration');
      }
      if (!configHealthy) {
        console.log('  - Verify Wrangler and package configuration files');
      }
      if (!securityHealthy) {
        console.log('  - Address security configuration issues');
      }
    }
    
    console.log('');
    console.log(`📄 Full report saved: ${path.join(__dirname, '../pipeline-verification-report.json')}`);
    console.log('='.repeat(60));
  }
  
  async run() {
    console.log('🚀 IT-ERA CI/CD Pipeline Verification\\n');
    
    try {
      await this.verifyWorkflowFiles();
      await this.verifyEndpoints();
      await this.verifyConfiguration();
      await this.verifySecurityConfiguration();
      
      this.generateReport();
      
      process.exit(this.results.overall === 'healthy' ? 0 : 1);
    } catch (error) {
      this.log(`Verification failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  const verifier = new PipelineVerifier();
  verifier.run();
}

module.exports = PipelineVerifier;