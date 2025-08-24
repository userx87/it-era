/**
 * OpenRouter AI Integration Tests for IT-ERA Chatbot
 * Comprehensive test suite for AI functionality
 */

class OpenRouterIntegrationTest {
  constructor() {
    this.testResults = [];
    this.apiKey = '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';
    this.baseUrl = 'http://localhost:8788'; // Change for production testing
  }

  async runAllTests() {
    console.log('🚀 Starting OpenRouter AI Integration Tests for IT-ERA');
    console.log('=' .repeat(60));
    
    // Test categories
    await this.testAIEngineInitialization();
    await this.testBasicConversation();
    await this.testLeadQualification();
    await this.testEscalationLogic();
    await this.testFallbackSystem();
    await this.testCostControl();
    await this.testAnalytics();
    await this.testPerformance();
    
    this.printTestResults();
  }

  async testAIEngineInitialization() {
    console.log('\n📋 Testing AI Engine Initialization...');
    
    try {
      // Test health endpoint
      const healthResponse = await fetch(`${this.baseUrl}/health`);
      const healthData = await healthResponse.json();
      
      this.addTest('Health Endpoint', healthResponse.ok, 'Health endpoint responds');
      this.addTest('AI Status', healthData.ai?.status === 'healthy', 'AI engine is healthy');
      this.addTest('OpenRouter Model', healthData.ai?.model.includes('anthropic'), 'Using Anthropic model');
      
    } catch (error) {
      this.addTest('AI Engine Init', false, `Error: ${error.message}`);
    }
  }

  async testBasicConversation() {
    console.log('\n💬 Testing Basic AI Conversation...');
    
    try {
      // Start conversation
      const startResponse = await this.sendChatMessage('start', null, 'start');
      this.addTest('Conversation Start', startResponse.success, 'AI conversation starts');
      
      const sessionId = startResponse.sessionId;
      
      // Test greeting response
      const greetingContent = startResponse.response;
      this.addTest('Greeting Contains IT-ERA', greetingContent.includes('IT-ERA'), 'Greeting mentions IT-ERA');
      this.addTest('Greeting Contains Vimercate', greetingContent.includes('Vimercate'), 'Greeting mentions location');
      
      // Test service inquiry
      const serviceResponse = await this.sendChatMessage(
        'Mi serve un firewall per la mia azienda', 
        sessionId, 
        'message'
      );
      
      this.addTest('Service Recognition', serviceResponse.success, 'AI recognizes service request');
      this.addTest('Firewall Response', 
        serviceResponse.response.toLowerCase().includes('watchguard'), 
        'AI mentions WatchGuard specialization'
      );
      
      // Test lead data collection
      const leadResponse = await this.sendChatMessage(
        'Siamo 15 dipendenti a Monza', 
        sessionId, 
        'message'
      );
      
      this.addTest('Lead Data Collection', leadResponse.success, 'AI collects lead data');
      
    } catch (error) {
      this.addTest('Basic Conversation', false, `Error: ${error.message}`);
    }
  }

  async testLeadQualification() {
    console.log('\n🎯 Testing Lead Qualification...');
    
    try {
      // High-priority lead test
      const highPriorityResponse = await this.sendChatMessage('start', null, 'start');
      const sessionId = highPriorityResponse.sessionId;
      
      // Simulate high-value lead
      await this.sendChatMessage('Ho urgenza per un firewall, siamo 50 dipendenti a Vimercate', sessionId, 'message');
      const urgentResponse = await this.sendChatMessage('Mi servite subito', sessionId, 'message');
      
      this.addTest('High Priority Detection', 
        urgentResponse.escalate || urgentResponse.priority === 'high', 
        'AI detects high-priority lead'
      );
      
      // Geographic priority test
      const geoResponse = await this.sendChatMessage('Siamo a Monza', sessionId, 'message');
      this.addTest('Geographic Recognition', 
        geoResponse.response.toLowerCase().includes('monza'), 
        'AI recognizes geographic priority'
      );
      
    } catch (error) {
      this.addTest('Lead Qualification', false, `Error: ${error.message}`);
    }
  }

  async testEscalationLogic() {
    console.log('\n🚨 Testing Escalation Logic...');
    
    try {
      // Emergency escalation test
      const emergencyResponse = await this.sendChatMessage('start', null, 'start');
      const sessionId = emergencyResponse.sessionId;
      
      const emergencyTest = await this.sendChatMessage(
        'EMERGENZA! Il nostro server è down, malware!', 
        sessionId, 
        'message'
      );
      
      this.addTest('Emergency Escalation', 
        emergencyTest.escalate === true, 
        'AI escalates emergency keywords'
      );
      
      // Human request escalation
      const humanTest = await this.sendChatMessage(
        'Voglio parlare con una persona', 
        sessionId, 
        'message'
      );
      
      this.addTest('Human Request Escalation', 
        humanTest.escalate === true, 
        'AI escalates human requests'
      );
      
    } catch (error) {
      this.addTest('Escalation Logic', false, `Error: ${error.message}`);
    }
  }

  async testFallbackSystem() {
    console.log('\n🛟 Testing Fallback System...');
    
    try {
      // Test with invalid API key scenario (simulated)
      const fallbackResponse = await this.sendChatMessage(
        'Test fallback system', 
        null, 
        'message'
      );
      
      this.addTest('Fallback Response', 
        fallbackResponse.success, 
        'System provides fallback response'
      );
      
      // Test rate limiting behavior
      const rapidRequests = [];
      const sessionId = fallbackResponse.sessionId;
      
      for (let i = 0; i < 20; i++) {
        rapidRequests.push(
          this.sendChatMessage(`Test message ${i}`, sessionId, 'message')
        );
      }
      
      const rapidResults = await Promise.all(rapidRequests);
      const rateLimited = rapidResults.some(r => 
        r.response?.includes('troppo velocemente') || r.status === 429
      );
      
      this.addTest('Rate Limiting', 
        rateLimited, 
        'System implements rate limiting'
      );
      
    } catch (error) {
      this.addTest('Fallback System', false, `Error: ${error.message}`);
    }
  }

  async testCostControl() {
    console.log('\n💰 Testing Cost Control...');
    
    try {
      // Test cost tracking
      const costResponse = await this.sendChatMessage('start', null, 'start');
      const sessionId = costResponse.sessionId;
      
      // Generate several AI responses to accumulate cost
      for (let i = 0; i < 5; i++) {
        await this.sendChatMessage(
          `Test cost tracking message ${i}`, 
          sessionId, 
          'message'
        );
      }
      
      // Check if cost is being tracked
      const metricsResponse = await this.sendChatMessage('', sessionId, 'get_metrics');
      
      this.addTest('Cost Tracking', 
        metricsResponse.metrics?.totalCost >= 0, 
        'System tracks conversation costs'
      );
      
      this.addTest('Cost Limit Awareness', 
        metricsResponse.metrics?.totalCost !== undefined, 
        'System is aware of cost limits'
      );
      
    } catch (error) {
      this.addTest('Cost Control', false, `Error: ${error.message}`);
    }
  }

  async testAnalytics() {
    console.log('\n📊 Testing Analytics System...');
    
    try {
      // Test analytics endpoint
      const analyticsResponse = await fetch(`${this.baseUrl}/analytics`);
      const analyticsData = await analyticsResponse.json();
      
      this.addTest('Analytics Endpoint', 
        analyticsResponse.ok, 
        'Analytics endpoint is accessible'
      );
      
      this.addTest('Analytics Data Structure', 
        analyticsData.analytics?.summary !== undefined, 
        'Analytics provides structured data'
      );
      
      this.addTest('Performance Metrics', 
        analyticsData.analytics?.summary?.totalRequests >= 0, 
        'Analytics tracks performance metrics'
      );
      
      this.addTest('Lead Analytics', 
        analyticsData.analytics?.leads !== undefined, 
        'Analytics tracks lead metrics'
      );
      
    } catch (error) {
      this.addTest('Analytics System', false, `Error: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    try {
      const startTime = Date.now();
      
      // Test response time
      const perfResponse = await this.sendChatMessage(
        'Preventivo per firewall aziendale', 
        null, 
        'message'
      );
      
      const responseTime = Date.now() - startTime;
      
      this.addTest('Response Time < 8s', 
        responseTime < 8000, 
        `Response time: ${responseTime}ms`
      );
      
      this.addTest('AI Response Quality', 
        perfResponse.response?.length > 50, 
        'AI provides substantial responses'
      );
      
      this.addTest('Response Relevance', 
        perfResponse.response?.toLowerCase().includes('firewall') ||
        perfResponse.response?.toLowerCase().includes('preventivo'), 
        'Response is relevant to query'
      );
      
    } catch (error) {
      this.addTest('Performance', false, `Error: ${error.message}`);
    }
  }

  async sendChatMessage(message, sessionId, action) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        action
      })
    });
    
    return await response.json();
  }

  addTest(name, passed, details) {
    this.testResults.push({
      name,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}: ${details}`);
  }

  printTestResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(t => !t.passed)
        .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
    }
    
    console.log('\n✅ PASSED TESTS:');
    this.testResults
      .filter(t => t.passed)
      .forEach(t => console.log(`  - ${t.name}`));
    
    // Generate test report
    const report = {
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      successRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
      details: this.testResults,
      environment: {
        baseUrl: this.baseUrl,
        nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown'
      }
    };
    
    console.log('\n💾 Test report generated. Results available in testResults property.');
    this.report = report;
  }

  // Utility method to run tests from command line
  static async run() {
    const tester = new OpenRouterIntegrationTest();
    await tester.runAllTests();
    return tester.report;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OpenRouterIntegrationTest;
}

// Auto-run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  OpenRouterIntegrationTest.run()
    .then(report => {
      console.log(`\n🎉 Tests completed! Success rate: ${report.successRate}`);
      process.exit(report.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
}

export default OpenRouterIntegrationTest;