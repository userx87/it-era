#!/usr/bin/env node

/**
 * IT-ERA Chatbot Swarm Testing Suite
 * Tests the deployed staging environment with comprehensive validation
 */

const fetch = require('node-fetch');

const STAGING_URL = 'https://it-era-chatbot-staging.bulltech.workers.dev';
const TEST_TIMEOUT = 15000; // 15 seconds

class ChatbotSwarmTester {
  constructor() {
    this.results = {
      healthCheck: null,
      highValueLead: null,
      technicalBlock: null,
      urgentSupport: null,
      productInfo: null,
      performance: {
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity
      },
      businessRulesCompliance: [],
      leadScoringAccuracy: []
    };
    this.responseTimes = [];
  }

  async measureResponseTime(testFunction) {
    const start = Date.now();
    const result = await testFunction();
    const responseTime = Date.now() - start;
    
    this.responseTimes.push(responseTime);
    this.updatePerformanceMetrics(responseTime);
    
    return { result, responseTime };
  }

  updatePerformanceMetrics(responseTime) {
    this.results.performance.maxResponseTime = Math.max(
      this.results.performance.maxResponseTime, 
      responseTime
    );
    this.results.performance.minResponseTime = Math.min(
      this.results.performance.minResponseTime, 
      responseTime
    );
    this.results.performance.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  async testHealthEndpoint() {
    console.log('🔍 Testing /health endpoint...');
    
    try {
      const response = await fetch(`${STAGING_URL}/health`, {
        method: 'GET',
        timeout: TEST_TIMEOUT
      });

      const data = await response.json();
      
      return {
        status: response.status,
        success: response.ok,
        data: data,
        swarmActive: data?.swarm?.status === 'active' || data?.status === 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 500,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testChatAPI(scenario, message) {
    console.log(`🤖 Testing scenario: ${scenario}`);
    
    try {
      const sessionId = `test-${Date.now()}`;
      
      // First, start the session
      const startResponse = await fetch(`${STAGING_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          sessionId: sessionId
        }),
        timeout: TEST_TIMEOUT
      });
      
      if (!startResponse.ok) {
        console.warn('Session start failed, proceeding with direct message');
      }
      
      // Then send the actual message
      const response = await fetch(`${STAGING_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'message',
          message: message,
          sessionId: sessionId,
          metadata: {
            testScenario: scenario,
            timestamp: new Date().toISOString()
          }
        }),
        timeout: TEST_TIMEOUT
      });

      const data = await response.json();
      
      return {
        status: response.status,
        success: response.ok,
        response: data,
        scenario: scenario,
        message: message,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 500,
        success: false,
        error: error.message,
        scenario: scenario,
        message: message,
        timestamp: new Date().toISOString()
      };
    }
  }

  analyzeBusinessRulesCompliance(testResult) {
    const compliance = {
      scenario: testResult.scenario,
      passed: false,
      reasons: []
    };

    if (!testResult.success) {
      compliance.reasons.push('API call failed');
      return compliance;
    }

    const response = testResult.response;

    switch (testResult.scenario) {
      case 'technical-block':
        // Should block technical solutions
        const blockedPhrases = [
          'non posso fornire soluzioni tecniche',
          'non fornisco supporto tecnico',
          'contatta il supporto tecnico',
          'rivolgersi al team tecnico'
        ];
        compliance.passed = blockedPhrases.some(phrase => 
          response.message?.toLowerCase().includes(phrase.toLowerCase())
        );
        if (!compliance.passed) {
          compliance.reasons.push('Failed to block technical request');
        }
        break;

      case 'high-value-lead':
        // Should show high engagement for valuable leads
        compliance.passed = response.leadScore >= 80 || 
          response.message?.length > 100;
        if (!compliance.passed) {
          compliance.reasons.push('Low engagement for high-value lead');
        }
        break;

      case 'urgent-support':
        // Should prioritize urgent requests
        const urgentKeywords = [
          'urgente', 'immediato', 'priorità', 'critico'
        ];
        compliance.passed = urgentKeywords.some(keyword => 
          response.message?.toLowerCase().includes(keyword)
        ) || response.priority === 'high';
        if (!compliance.passed) {
          compliance.reasons.push('Failed to recognize urgency');
        }
        break;

      case 'product-info':
        // Should provide helpful product information
        compliance.passed = response.message?.length > 50 &&
          !response.message?.includes('non posso');
        if (!compliance.passed) {
          compliance.reasons.push('Insufficient product information');
        }
        break;
    }

    return compliance;
  }

  async runAllTests() {
    console.log('🚀 Starting IT-ERA Chatbot Swarm Test Suite...\n');

    // Test 1: Health Check
    const healthTest = await this.measureResponseTime(() => 
      this.testHealthEndpoint()
    );
    this.results.healthCheck = healthTest;
    
    console.log(`✅ Health Check: ${healthTest.result.success ? 'PASS' : 'FAIL'} (${healthTest.responseTime}ms)`);

    // Test 2: High-Value Lead Scenario
    const highValueTest = await this.measureResponseTime(() => 
      this.testChatAPI(
        'high-value-lead',
        'Salve, sono il direttore IT di una PMI con 150 dipendenti. Stiamo valutando di modernizzare la nostra infrastruttura IT con un budget di 200.000€. Potreste aiutarci con una consulenza strategica?'
      )
    );
    this.results.highValueLead = highValueTest;
    console.log(`✅ High-Value Lead: ${highValueTest.result.success ? 'PASS' : 'FAIL'} (${highValueTest.responseTime}ms)`);

    // Test 3: Technical Request Blocking
    const technicalTest = await this.measureResponseTime(() => 
      this.testChatAPI(
        'technical-block',
        'Come posso configurare il firewall pfSense per bloccare il traffico P2P sulla mia rete aziendale?'
      )
    );
    this.results.technicalBlock = technicalTest;
    console.log(`✅ Technical Block: ${technicalTest.result.success ? 'PASS' : 'FAIL'} (${technicalTest.responseTime}ms)`);

    // Test 4: Urgent Support
    const urgentTest = await this.measureResponseTime(() => 
      this.testChatAPI(
        'urgent-support',
        'URGENTE: I nostri server sono down da 2 ore e stiamo perdendo vendite. Abbiamo bisogno di supporto immediato!'
      )
    );
    this.results.urgentSupport = urgentTest;
    console.log(`✅ Urgent Support: ${urgentTest.result.success ? 'PASS' : 'FAIL'} (${urgentTest.responseTime}ms)`);

    // Test 5: Product Information
    const productTest = await this.measureResponseTime(() => 
      this.testChatAPI(
        'product-info',
        'Quali sono i vostri servizi di cybersecurity per piccole e medie imprese?'
      )
    );
    this.results.productInfo = productTest;
    console.log(`✅ Product Info: ${productTest.result.success ? 'PASS' : 'FAIL'} (${productTest.responseTime}ms)`);

    // Analyze Business Rules Compliance
    [
      this.results.highValueLead.result,
      this.results.technicalBlock.result,
      this.results.urgentSupport.result,
      this.results.productInfo.result
    ].forEach(result => {
      const compliance = this.analyzeBusinessRulesCompliance(result);
      this.results.businessRulesCompliance.push(compliance);
    });

    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 IT-ERA CHATBOT SWARM TEST REPORT');
    console.log('=' .repeat(50));
    
    // Performance Summary
    console.log('\n🚀 PERFORMANCE METRICS:');
    console.log(`Average Response Time: ${this.results.performance.averageResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${this.results.performance.maxResponseTime}ms`);
    console.log(`Min Response Time: ${this.results.performance.minResponseTime}ms`);
    console.log(`Performance Target (<2000ms): ${this.results.performance.averageResponseTime < 2000 ? '✅ PASS' : '❌ FAIL'}`);

    // API Endpoints Status
    console.log('\n🔌 API ENDPOINTS:');
    console.log(`Health Endpoint: ${this.results.healthCheck.result.success ? '✅ ACTIVE' : '❌ DOWN'}`);
    console.log(`Swarm Status: ${this.results.healthCheck.result.swarmActive ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log(`Chat API: ${[this.results.highValueLead, this.results.technicalBlock, this.results.urgentSupport, this.results.productInfo].every(t => t.result.success) ? '✅ OPERATIONAL' : '⚠️ ISSUES'}`);

    // Business Rules Compliance
    console.log('\n📋 BUSINESS RULES COMPLIANCE:');
    const totalRules = this.results.businessRulesCompliance.length;
    const passedRules = this.results.businessRulesCompliance.filter(r => r.passed).length;
    console.log(`Compliance Rate: ${passedRules}/${totalRules} (${((passedRules/totalRules)*100).toFixed(1)}%)`);

    this.results.businessRulesCompliance.forEach(rule => {
      console.log(`  ${rule.scenario}: ${rule.passed ? '✅ PASS' : '❌ FAIL'}`);
      if (!rule.passed && rule.reasons.length > 0) {
        rule.reasons.forEach(reason => console.log(`    - ${reason}`));
      }
    });

    // Detailed Test Results
    console.log('\n🔍 DETAILED RESULTS:');
    
    if (this.results.healthCheck.result.success) {
      console.log('\nHealth Check Response:', JSON.stringify(this.results.healthCheck.result.data, null, 2));
    }

    [
      ['High-Value Lead', this.results.highValueLead.result],
      ['Technical Block', this.results.technicalBlock.result], 
      ['Urgent Support', this.results.urgentSupport.result],
      ['Product Info', this.results.productInfo.result]
    ].forEach(([name, result]) => {
      console.log(`\n${name} Response:`);
      if (result.success && result.response) {
        console.log(`Message: ${result.response.message || 'No message'}`);
        console.log(`Lead Score: ${result.response.leadScore || 'N/A'}`);
        console.log(`Priority: ${result.response.priority || 'N/A'}`);
      } else {
        console.log(`Error: ${result.error || 'Unknown error'}`);
      }
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (this.results.performance.averageResponseTime > 2000) {
      console.log('⚠️ Response times exceed target. Consider optimizing DeepSeek integration.');
    }
    
    const failedRules = this.results.businessRulesCompliance.filter(r => !r.passed);
    if (failedRules.length > 0) {
      console.log('⚠️ Some business rules are not working correctly. Review swarm agent logic.');
      failedRules.forEach(rule => {
        console.log(`   - Fix ${rule.scenario} scenario`);
      });
    }
    
    if (!this.results.healthCheck.result.swarmActive) {
      console.log('🚨 Swarm system appears inactive. Check agent deployment and coordination.');
    }
    
    if (passedRules === totalRules && this.results.performance.averageResponseTime < 2000) {
      console.log('🎉 All tests passed! System is performing optimally.');
    }

    console.log('\n' + '=' .repeat(50));
    console.log('Test completed at:', new Date().toISOString());
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ChatbotSwarmTester();
  tester.runAllTests().catch(console.error);
}

module.exports = ChatbotSwarmTester;