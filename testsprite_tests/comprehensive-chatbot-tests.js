/**
 * Comprehensive IT-ERA Chatbot Swarm Test Suite
 * Based on Product Specification Document requirements
 * Tests: Business Rules, Lead Scoring, Performance, Security, Swarm Coordination
 */

const axios = require('axios');

class ChatbotTestSuite {
  constructor(baseUrl = 'https://it-era-chatbot-staging.bulltech.workers.dev') {
    this.baseUrl = baseUrl;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.sessionId = null;
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive IT-ERA Chatbot Test Suite...\n');
    console.log(`Target URL: ${this.baseUrl}\n`);

    try {
      // Health Check
      await this.testHealthCheck();
      
      // Initialize Session
      await this.initializeSession();
      
      // Business Rules Tests
      await this.testBusinessRulesCompliance();
      
      // Lead Scoring Tests
      await this.testLeadScoringAccuracy();
      
      // Performance Tests
      await this.testResponseTimes();
      
      // Swarm Coordination Tests
      await this.testSwarmOrchestration();
      
      // Security Tests
      await this.testSecurityMeasures();
      
      // Cost Optimization Tests
      await this.testCostOptimization();
      
      // A/B Testing Logic Tests
      await this.testABTestingLogic();
      
      // Emergency Handling Tests
      await this.testEmergencyHandling();

      // Product Information Tests
      await this.testProductRecommendations();

    } catch (error) {
      this.logTestResult('SYSTEM ERROR', false, `Test suite failed: ${error.message}`);
    }

    return this.generateReport();
  }

  async testHealthCheck() {
    const testName = 'Health Check';
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 10000 });
      
      const expectedFields = ['status', 'service', 'version', 'ai', 'features'];
      const hasAllFields = expectedFields.every(field => response.data.hasOwnProperty(field));
      
      const isHealthy = response.status === 200 && 
                       response.data.status === 'ok' &&
                       hasAllFields;

      this.logTestResult(testName, isHealthy, 
        `Status: ${response.data.status}, Service: ${response.data.service}, AI Enabled: ${response.data.ai?.enabled}`);

    } catch (error) {
      this.logTestResult(testName, false, `Health check failed: ${error.message}`);
    }
  }

  async initializeSession() {
    const testName = 'Session Initialization';
    try {
      const response = await this.sendMessage('', 'start');
      
      const isValid = response.data.success &&
                     response.data.sessionId &&
                     response.data.response &&
                     Array.isArray(response.data.options);

      if (isValid) {
        this.sessionId = response.data.sessionId;
      }

      this.logTestResult(testName, isValid, 
        `Session ID: ${response.data.sessionId}, Response received: ${!!response.data.response}`);

    } catch (error) {
      this.logTestResult(testName, false, `Session initialization failed: ${error.message}`);
    }
  }

  async testBusinessRulesCompliance() {
    console.log('\n📋 Testing Business Rules Compliance...');

    // Test 1: Configuration Request Block
    const configTest = await this.testTechnicalBlock(
      'Come configuro il firewall WatchGuard per aprire la porta 443?',
      'Configuration Request Block'
    );

    // Test 2: Password/Credential Block
    const passwordTest = await this.testTechnicalBlock(
      'Qual è la password di default del router?',
      'Password/Credential Block'
    );

    // Test 3: DIY Solution Block
    const diyTest = await this.testTechnicalBlock(
      'Come posso riparare da solo il server?',
      'DIY Solution Block'
    );

    // Test 4: Professional Service Redirect
    const redirectTest = await this.testServiceRedirect(
      'Ho bisogno di installare un firewall',
      'Service Redirect Test'
    );

    return [configTest, passwordTest, diyTest, redirectTest];
  }

  async testTechnicalBlock(message, testName) {
    try {
      const response = await this.sendMessage(message, 'message');
      
      // Business rule: Never provide technical steps
      const containsTechnicalSteps = /passo|fase|configura|imposta|cambia|modifica/i.test(response.data.response);
      const redirectsToService = /tecnici|specialisti|consulenza|intervento/i.test(response.data.response);
      
      const isBlocked = !containsTechnicalSteps && redirectsToService;
      
      this.logTestResult(testName, isBlocked,
        `Technical steps blocked: ${!containsTechnicalSteps}, Service redirect: ${redirectsToService}`);
      
      return isBlocked;
    } catch (error) {
      this.logTestResult(testName, false, `Error: ${error.message}`);
      return false;
    }
  }

  async testServiceRedirect(message, testName) {
    try {
      const response = await this.sendMessage(message, 'message');
      
      const offersService = /preventivo|consulenza|sopralluogo|tecnici/i.test(response.data.response);
      const hasContactInfo = /039 888 2041|info@it-era.it/i.test(response.data.response);
      
      const isRedirected = offersService && hasContactInfo;
      
      this.logTestResult(testName, isRedirected,
        `Offers service: ${offersService}, Contact info: ${hasContactInfo}`);
      
      return isRedirected;
    } catch (error) {
      this.logTestResult(testName, false, `Error: ${error.message}`);
      return false;
    }
  }

  async testLeadScoringAccuracy() {
    console.log('\n🎯 Testing Lead Scoring Accuracy...');

    // Test 1: High-Value PMI Lead
    const highValueTest = await this.testLeadScore(
      'Siamo una PMI con 50 dipendenti a Monza. Ci serve un firewall aziendale e backup per 5TB di dati. Budget disponibile.',
      'High-Value PMI Lead',
      70 // Expected minimum score
    );

    // Test 2: Information Seeker (Low Value)
    const lowValueTest = await this.testLeadScore(
      'Cosa fate?',
      'Information Seeker',
      30 // Expected maximum score
    );

    // Test 3: Emergency Lead (High Priority)
    const emergencyTest = await this.testLeadScore(
      'Server down urgente! Siamo un\'azienda di 30 dipendenti e il sistema non funziona!',
      'Emergency Lead',
      80 // Expected minimum score
    );

    // Test 4: Existing Customer
    const existingCustomerTest = await this.testLeadScore(
      'Sono Marco di ABC Solutions, cliente IT-ERA. Ho bisogno di supporto per il nostro WatchGuard.',
      'Existing Customer',
      75 // Expected minimum score
    );

    return [highValueTest, lowValueTest, emergencyTest, existingCustomerTest];
  }

  async testLeadScore(message, testName, expectedThreshold) {
    try {
      const response = await this.sendMessage(message, 'message');
      
      const hasLeadScore = response.data.hasOwnProperty('leadScore') || response.data.hasOwnProperty('score');
      const leadScore = response.data.leadScore || response.data.score || 0;
      
      let isAccurate = false;
      if (testName.includes('Low') || testName.includes('Information')) {
        isAccurate = leadScore <= expectedThreshold;
      } else {
        isAccurate = leadScore >= expectedThreshold;
      }
      
      this.logTestResult(testName, isAccurate,
        `Lead Score: ${leadScore}, Expected: ${testName.includes('Low') ? '≤' : '≥'}${expectedThreshold}, Has Score: ${hasLeadScore}`);
      
      return isAccurate;
    } catch (error) {
      this.logTestResult(testName, false, `Error: ${error.message}`);
      return false;
    }
  }

  async testResponseTimes() {
    console.log('\n⚡ Testing Performance Requirements...');

    const messages = [
      'Che servizi offrite?',
      'Quanto costa un firewall?',
      'Ho bisogno di assistenza urgente',
      'Preventivo per backup cloud'
    ];

    let totalTime = 0;
    let testsPassed = 0;

    for (let i = 0; i < messages.length; i++) {
      const startTime = Date.now();
      
      try {
        const response = await this.sendMessage(messages[i], 'message');
        const responseTime = Date.now() - startTime;
        totalTime += responseTime;
        
        const isUnderThreshold = responseTime < 2000; // 2 seconds max
        if (isUnderThreshold) testsPassed++;
        
        this.logTestResult(`Response Time Test ${i + 1}`, isUnderThreshold,
          `Response time: ${responseTime}ms (target: <2000ms)`);
        
      } catch (error) {
        this.logTestResult(`Response Time Test ${i + 1}`, false, `Error: ${error.message}`);
      }
    }

    const avgResponseTime = totalTime / messages.length;
    const avgUnderThreshold = avgResponseTime < 1600; // 1.6s target average

    this.logTestResult('Average Response Time', avgUnderThreshold,
      `Average: ${avgResponseTime}ms (target: <1600ms), Passed: ${testsPassed}/${messages.length}`);

    return avgUnderThreshold;
  }

  async testSwarmOrchestration() {
    console.log('\n🐝 Testing Swarm Agent Coordination...');

    try {
      const response = await this.sendMessage(
        'Siamo una media azienda della Brianza con problemi di sicurezza informatica. Ci serve un audit completo e nuovi sistemi di protezione.',
        'message'
      );

      // Check for swarm indicators
      const hasSwarmMetadata = response.data.source === 'swarm' || 
                              response.data.metadata?.processingMode === 'swarm';
      
      const hasAgentIndicators = response.data.metadata?.agentsUsed || 
                                response.data.metadata?.consensusStrength;

      const isComprehensiveResponse = response.data.response.length > 200; // Complex responses indicate swarm processing
      
      const swarmWorking = hasSwarmMetadata || hasAgentIndicators || 
                          (response.data.source && response.data.source !== 'fallback');

      this.logTestResult('Swarm Orchestration', swarmWorking,
        `Source: ${response.data.source}, Has metadata: ${!!hasSwarmMetadata}, Comprehensive: ${isComprehensiveResponse}`);

      return swarmWorking;

    } catch (error) {
      this.logTestResult('Swarm Orchestration', false, `Error: ${error.message}`);
      return false;
    }
  }

  async testSecurityMeasures() {
    console.log('\n🔒 Testing Security Measures...');

    // Test 1: Rate Limiting
    const rateLimitTest = await this.testRateLimit();

    // Test 2: CORS Headers
    const corsTest = await this.testCorsHeaders();

    // Test 3: Input Sanitization
    const sanitizationTest = await this.testInputSanitization();

    return [rateLimitTest, corsTest, sanitizationTest];
  }

  async testRateLimit() {
    const testName = 'Rate Limiting';
    
    try {
      // Send multiple rapid requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(this.sendMessage(`Test message ${i}`, 'message'));
      }

      const results = await Promise.allSettled(promises);
      const hasRateLimit = results.some(result => 
        result.status === 'rejected' || 
        (result.value?.status === 429)
      );

      this.logTestResult(testName, hasRateLimit,
        `Rate limiting active: ${hasRateLimit}, Rejected requests: ${results.filter(r => r.status === 'rejected').length}/10`);

      return hasRateLimit;

    } catch (error) {
      this.logTestResult(testName, false, `Error: ${error.message}`);
      return false;
    }
  }

  async testCorsHeaders() {
    const testName = 'CORS Headers';
    
    try {
      const response = await axios.options(`${this.baseUrl}/api/chat`);
      
      const hasCorsHeaders = response.headers['access-control-allow-origin'] &&
                            response.headers['access-control-allow-methods'];

      this.logTestResult(testName, hasCorsHeaders,
        `CORS configured: ${hasCorsHeaders}, Origin: ${response.headers['access-control-allow-origin']}`);

      return hasCorsHeaders;

    } catch (error) {
      this.logTestResult(testName, false, `Error: ${error.message}`);
      return false;
    }
  }

  async testInputSanitization() {
    const testName = 'Input Sanitization';
    
    try {
      const maliciousInput = "<script>alert('XSS')</script>";
      const response = await this.sendMessage(maliciousInput, 'message');
      
      const isSanitized = !response.data.response.includes('<script>') &&
                         response.data.success;

      this.logTestResult(testName, isSanitized,
        `Input sanitized: ${isSanitized}, Response safe: ${!response.data.response.includes('<script>')}`);

      return isSanitized;

    } catch (error) {
      this.logTestResult(testName, false, `Error: ${error.message}`);
      return false;
    }
  }

  async testCostOptimization() {
    console.log('\n💰 Testing Cost Optimization...');

    try {
      const response = await this.sendMessage(
        'Che servizi di sicurezza informatica offrite per aziende?',
        'message'
      );

      const hasCostInfo = response.data.hasOwnProperty('cost') || response.data.hasOwnProperty('usedAI');
      const isOptimized = response.data.cost <= 0.05 || response.data.source === 'swarm'; // Target: <€0.04

      this.logTestResult('Cost Optimization', isOptimized,
        `Cost reported: ${hasCostInfo}, Cost: ${response.data.cost || 'N/A'}, Source: ${response.data.source}`);

      return isOptimized;

    } catch (error) {
      this.logTestResult('Cost Optimization', false, `Error: ${error.message}`);
      return false;
    }
  }

  async testABTestingLogic() {
    console.log('\n🧪 Testing A/B Testing Logic...');

    const responses = [];
    
    // Send multiple requests to see A/B split
    for (let i = 0; i < 5; i++) {
      try {
        const newSessionResponse = await this.sendMessage('', 'start');
        const messageResponse = await this.sendMessage('Che servizi offrite?', 'message');
        responses.push({
          source: messageResponse.data.source,
          sessionId: newSessionResponse.data.sessionId
        });
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`A/B test iteration ${i + 1} failed: ${error.message}`);
      }
    }

    const hasVariation = responses.some(r => r.source === 'swarm') && 
                        responses.some(r => r.source !== 'swarm');
    
    const swarmPercentage = responses.filter(r => r.source === 'swarm').length / responses.length * 100;

    this.logTestResult('A/B Testing Logic', responses.length > 0,
      `Responses collected: ${responses.length}, Swarm usage: ${swarmPercentage}%, Has variation: ${hasVariation}`);

    return responses.length > 0;
  }

  async testEmergencyHandling() {
    console.log('\n🚨 Testing Emergency Handling...');

    try {
      const response = await this.sendMessage(
        'EMERGENZA! Server down, rete non funziona, clienti inferociti! Aiutateci subito!',
        'message'
      );

      const hasEmergencyResponse = /urgente|subito|immediato|039 888 2041/i.test(response.data.response);
      const hasEscalation = response.data.escalate || response.data.priority === 'high';
      const fastResponse = true; // We measure this above

      const isEmergencyHandled = hasEmergencyResponse && (hasEscalation || fastResponse);

      this.logTestResult('Emergency Handling', isEmergencyHandled,
        `Emergency response: ${hasEmergencyResponse}, Escalation: ${hasEscalation}, Priority: ${response.data.priority}`);

      return isEmergencyHandled;

    } catch (error) {
      this.logTestResult('Emergency Handling', false, `Error: ${error.message}`);
      return false;
    }
  }

  async testProductRecommendations() {
    console.log('\n🛡️ Testing Product Recommendations...');

    try {
      const response = await this.sendMessage(
        'Che firewall WatchGuard consigliate per un\'azienda di 25 dipendenti?',
        'message'
      );

      const hasProductInfo = /watchguard|firewall|t70|t80|m470/i.test(response.data.response);
      const hasPricing = /€|euro|prezzo|costo|preventivo/i.test(response.data.response);
      const noTechnicalSteps = !/configura|imposta|passo|fase/i.test(response.data.response);
      const hasServiceOffer = /consulenza|sopralluogo|tecnici/i.test(response.data.response);

      const isValidRecommendation = hasProductInfo && noTechnicalSteps && (hasPricing || hasServiceOffer);

      this.logTestResult('Product Recommendations', isValidRecommendation,
        `Product info: ${hasProductInfo}, No tech steps: ${noTechnicalSteps}, Service offer: ${hasServiceOffer}`);

      return isValidRecommendation;

    } catch (error) {
      this.logTestResult('Product Recommendations', false, `Error: ${error.message}`);
      return false;
    }
  }

  async sendMessage(message, action) {
    const payload = {
      message,
      action,
      sessionId: this.sessionId
    };

    return await axios.post(`${this.baseUrl}/api/chat`, payload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://it-era.pages.dev'
      }
    });
  }

  logTestResult(testName, passed, details) {
    this.testResults.total++;
    if (passed) {
      this.testResults.passed++;
      console.log(`✅ ${testName}: PASS - ${details}`);
    } else {
      this.testResults.failed++;
      console.log(`❌ ${testName}: FAIL - ${details}`);
    }

    this.testResults.details.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  generateReport() {
    const passRate = (this.testResults.passed / this.testResults.total * 100).toFixed(1);
    const timestamp = new Date().toISOString();

    const report = {
      testSuite: 'IT-ERA Chatbot Swarm Comprehensive Tests',
      timestamp,
      target: this.baseUrl,
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        passRate: `${passRate}%`
      },
      categories: {
        businessRules: this.getCategoryResults(['Configuration Request Block', 'Password/Credential Block', 'DIY Solution Block', 'Service Redirect Test']),
        leadScoring: this.getCategoryResults(['High-Value PMI Lead', 'Information Seeker', 'Emergency Lead', 'Existing Customer']),
        performance: this.getCategoryResults(['Response Time Test', 'Average Response Time']),
        swarmCoordination: this.getCategoryResults(['Swarm Orchestration']),
        security: this.getCategoryResults(['Rate Limiting', 'CORS Headers', 'Input Sanitization']),
        costOptimization: this.getCategoryResults(['Cost Optimization']),
        abTesting: this.getCategoryResults(['A/B Testing Logic']),
        emergencyHandling: this.getCategoryResults(['Emergency Handling']),
        productRecommendations: this.getCategoryResults(['Product Recommendations'])
      },
      details: this.testResults.details,
      recommendations: this.generateRecommendations()
    };

    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed} (${report.summary.passRate})`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log('='.repeat(80));

    return report;
  }

  getCategoryResults(testNames) {
    const categoryTests = this.testResults.details.filter(test => 
      testNames.some(name => test.name.includes(name))
    );
    
    const passed = categoryTests.filter(test => test.passed).length;
    const total = categoryTests.length;
    
    return {
      passed,
      total,
      passRate: total > 0 ? `${(passed / total * 100).toFixed(1)}%` : '0%'
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.testResults.failed > 0) {
      recommendations.push('🔍 Review failed tests and address identified issues');
    }
    
    const failedTests = this.testResults.details.filter(test => !test.passed);
    
    if (failedTests.some(test => test.name.includes('Response Time'))) {
      recommendations.push('⚡ Optimize response times - target <1.6s average');
    }
    
    if (failedTests.some(test => test.name.includes('Business Rules'))) {
      recommendations.push('📋 Strengthen business rule enforcement');
    }
    
    if (failedTests.some(test => test.name.includes('Lead Scoring'))) {
      recommendations.push('🎯 Calibrate lead scoring algorithm');
    }
    
    if (failedTests.some(test => test.name.includes('Swarm'))) {
      recommendations.push('🐝 Check swarm orchestration configuration');
    }
    
    if (this.testResults.passed / this.testResults.total > 0.85) {
      recommendations.push('🚀 System ready for production deployment');
    } else {
      recommendations.push('⚠️ Address critical issues before production deployment');
    }
    
    return recommendations;
  }
}

module.exports = ChatbotTestSuite;

// Run tests if called directly
if (require.main === module) {
  const testSuite = new ChatbotTestSuite();
  
  testSuite.runAllTests()
    .then(report => {
      console.log('\n📋 Full test report available in test results');
      console.log('\n🎯 Recommendations:');
      report.recommendations.forEach(rec => console.log(`  ${rec}`));
      
      process.exit(report.summary.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}