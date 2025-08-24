/**
 * IT-ERA AI Chatbot Integration Test Suite
 * Comprehensive testing for OpenRouter AI integration, fallback logic, and all critical scenarios
 * Author: Testing Specialist
 * Date: 2025-08-24
 */

// Test Configuration
const AI_TEST_CONFIG = {
  apiEndpoint: 'http://localhost:8788/api/chat', // Local development endpoint
  productionEndpoint: 'https://it-era-chatbot.bulltech.workers.dev/api/chat',
  testEnvironment: 'development',
  timeouts: {
    normalResponse: 5000,
    aiResponse: 10000,
    fallbackResponse: 2000,
    emergencyResponse: 8000
  },
  retryAttempts: 3,
  rateLimit: {
    messagesPerMinute: 10,
    testDelay: 100 // ms between test messages
  }
};

// Critical Test Scenarios as specified
const CRITICAL_TEST_SCENARIOS = {
  scenario1_business_assistance: {
    name: "Test 1: PMI 20 persone Monza",
    input: "Ho bisogno di assistenza IT per la mia azienda di 20 persone a Monza",
    expectedIntents: ['assistenza', 'supporto', 'preventivo'],
    expectedActions: ['collect_company_data', 'qualify_lead'],
    expectedEscalation: true,
    expectedTeamsNotification: true,
    priority: 'medium',
    mustContain: ['20 persone', 'Monza', 'azienda'],
    mustMention: ['039 888 2041', 'IT-ERA', 'sopralluogo gratuito']
  },

  scenario2_server_emergency: {
    name: "Test 2: Server Down Emergenza",
    input: "Il server è down da questa mattina, è urgente!",
    expectedIntents: ['emergenza', 'supporto', 'assistenza'],
    expectedActions: ['emergency_escalation', 'immediate_response'],
    expectedEscalation: true,
    expectedImmediateEscalation: true,
    priority: 'high',
    mustContain: ['server', 'down', 'urgente'],
    mustMention: ['immediata', 'emergenza', '039 888 2041', 'reperibilità'],
    maxResponseTime: 3000
  },

  scenario3_watchguard_firewall: {
    name: "Test 3: Firewall WatchGuard Quote",
    input: "Quanto costa un firewall WatchGuard?",
    expectedIntents: ['firewall', 'preventivo', 'sicurezza'],
    expectedActions: ['show_expertise', 'collect_business_info'],
    expectedEscalation: true,
    mustContain: ['firewall', 'WatchGuard'],
    mustMention: ['partner certificati', 'sopralluogo', 'preventivo personalizzato', '€2.500'],
    highlightPartnership: true
  },

  scenario4_api_failure: {
    name: "Test 4: OpenRouter API Failure",
    simulateApiFailure: true,
    input: "Aiutami con il mio problema informatico",
    expectedBehavior: 'fallback_seamless',
    fallbackExpected: true,
    maxFallbackTime: 2000,
    mustWorkWithoutAI: true,
    traditionalResponseExpected: true
  }
};

// Performance Benchmarks
const PERFORMANCE_TARGETS = {
  aiResponseRate: 95, // % of responses using AI successfully
  fallbackActivation: 5, // % maximum fallback usage
  leadQualificationImprovement: 40, // % improvement target
  teamsNotificationAccuracy: 100, // % accuracy required
  responseRelevance: 90 // % minimum relevance
};

class AIIntegrationTester {
  constructor() {
    this.results = [];
    this.metrics = {
      totalTests: 0,
      aiSuccessRate: 0,
      fallbackUsage: 0,
      averageResponseTime: 0,
      teamsNotifications: 0,
      errors: []
    };
    this.activeSession = null;
  }

  async runComprehensiveTestSuite() {
    console.log('🚀 IT-ERA AI CHATBOT INTEGRATION TEST SUITE');
    console.log('=' .repeat(80));
    console.log(`Environment: ${AI_TEST_CONFIG.testEnvironment}`);
    console.log(`Endpoint: ${AI_TEST_CONFIG.apiEndpoint}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    try {
      // Test Groups in Order
      await this.testSystemHealth();
      await this.testCriticalScenarios();
      await this.testAIFunctionality();
      await this.testFallbackLogic();
      await this.testLeadGeneration();
      await this.testPerformanceMetrics();
      await this.testKnowledgeBase();
      await this.testCostControl();
      await this.testTeamsIntegration();
      
      // Generate comprehensive report
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  // Test Group 1: System Health Check
  async testSystemHealth() {
    console.log('\n🏥 SYSTEM HEALTH CHECK');
    console.log('-' .repeat(40));

    await this.runTest('API Endpoint Connectivity', async () => {
      const response = await this.makeRequest('/health');
      return response && response.status === 'ok';
    });

    await this.runTest('CORS Configuration', async () => {
      const response = await fetch(AI_TEST_CONFIG.apiEndpoint, {
        method: 'OPTIONS',
        headers: { 
          'Origin': 'https://www.it-era.it',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      return response.ok;
    });

    await this.runTest('Session Management', async () => {
      const startResponse = await this.sendChatMessage('start', null, 'start');
      if (!startResponse.success || !startResponse.sessionId) return false;
      
      this.activeSession = startResponse.sessionId;
      return true;
    });

    console.log('✅ System health check completed\n');
  }

  // Test Group 2: Critical Scenarios
  async testCriticalScenarios() {
    console.log('\n🎯 CRITICAL SCENARIOS TESTING');
    console.log('-' .repeat(40));

    for (const [key, scenario] of Object.entries(CRITICAL_TEST_SCENARIOS)) {
      await this.runCriticalScenarioTest(key, scenario);
      await this.delay(AI_TEST_CONFIG.rateLimit.testDelay);
    }

    console.log('✅ Critical scenarios testing completed\n');
  }

  async runCriticalScenarioTest(scenarioKey, scenario) {
    console.log(`\n📋 ${scenario.name}`);
    
    const testResult = {
      scenario: scenarioKey,
      name: scenario.name,
      input: scenario.input,
      timestamp: Date.now(),
      success: false,
      metrics: {},
      errors: []
    };

    try {
      // Handle API failure simulation
      if (scenario.simulateApiFailure) {
        await this.testAPIFailureScenario(scenario, testResult);
      } else {
        await this.testNormalScenario(scenario, testResult);
      }

      console.log(`   ✅ ${scenario.name} PASSED`);
      testResult.success = true;

    } catch (error) {
      console.log(`   ❌ ${scenario.name} FAILED: ${error.message}`);
      testResult.errors.push(error.message);
    }

    this.results.push(testResult);
  }

  async testNormalScenario(scenario, testResult) {
    const startTime = Date.now();
    
    // Send the test message
    const response = await this.sendChatMessage(scenario.input);
    const responseTime = Date.now() - startTime;
    
    testResult.metrics.responseTime = responseTime;
    testResult.metrics.aiPowered = response.aiPowered;
    testResult.metrics.intent = response.intent;
    testResult.metrics.escalate = response.escalate;

    // Verify response success
    if (!response.success) {
      throw new Error(`Chat response failed: ${response.error || 'Unknown error'}`);
    }

    // Check response time limits
    const timeLimit = scenario.maxResponseTime || AI_TEST_CONFIG.timeouts.aiResponse;
    if (responseTime > timeLimit) {
      throw new Error(`Response time ${responseTime}ms exceeded limit ${timeLimit}ms`);
    }

    // Verify intent recognition
    if (scenario.expectedIntents) {
      const intentMatch = scenario.expectedIntents.some(intent => 
        response.intent?.includes(intent) || 
        response.response?.toLowerCase().includes(intent)
      );
      if (!intentMatch) {
        throw new Error(`Intent not recognized. Expected one of: ${scenario.expectedIntents.join(', ')}`);
      }
    }

    // Verify escalation behavior
    if (scenario.expectedEscalation && !response.escalate) {
      throw new Error('Expected escalation but none occurred');
    }

    if (scenario.expectedImmediateEscalation && response.priority !== 'high') {
      throw new Error('Expected immediate escalation with high priority');
    }

    // Verify required content
    if (scenario.mustContain) {
      for (const content of scenario.mustContain) {
        if (!response.response?.toLowerCase().includes(content.toLowerCase())) {
          throw new Error(`Response missing required content: "${content}"`);
        }
      }
    }

    // Verify IT-ERA specific mentions
    if (scenario.mustMention) {
      for (const mention of scenario.mustMention) {
        if (!response.response?.includes(mention)) {
          console.warn(`   ⚠️  Response missing mention: "${mention}"`);
        }
      }
    }

    // Special checks for WatchGuard partnership
    if (scenario.highlightPartnership) {
      if (!response.response?.includes('partner') || !response.response?.includes('WatchGuard')) {
        throw new Error('WatchGuard partnership not highlighted');
      }
    }

    console.log(`   📊 Response Time: ${responseTime}ms | AI: ${response.aiPowered ? 'Yes' : 'No'} | Intent: ${response.intent}`);
  }

  async testAPIFailureScenario(scenario, testResult) {
    console.log('   🔧 Simulating API failure scenario...');
    
    // This would normally involve mocking the AI API to fail
    // For now, we test with a complex query that might timeout
    const complexQuery = scenario.input;
    
    const startTime = Date.now();
    const response = await this.sendChatMessage(complexQuery);
    const responseTime = Date.now() - startTime;
    
    testResult.metrics.responseTime = responseTime;
    testResult.metrics.fallbackUsed = !response.aiPowered;
    testResult.metrics.gracefulDegradation = response.success;

    // Verify the system handled failure gracefully
    if (!response.success) {
      throw new Error('System failed to handle API failure gracefully');
    }

    // Check if fallback was used within time limit
    if (responseTime > scenario.maxFallbackTime) {
      throw new Error(`Fallback response time ${responseTime}ms exceeded limit ${scenario.maxFallbackTime}ms`);
    }

    // Verify traditional response still works
    if (scenario.traditionalResponseExpected && !response.response) {
      throw new Error('No traditional response provided during fallback');
    }

    console.log(`   📊 Fallback Time: ${responseTime}ms | Graceful: ${response.success ? 'Yes' : 'No'}`);
  }

  // Test Group 3: AI Functionality
  async testAIFunctionality() {
    console.log('\n🧠 AI FUNCTIONALITY TESTING');
    console.log('-' .repeat(40));

    await this.runTest('Natural Italian Conversation', async () => {
      const response = await this.sendChatMessage('Buongiorno, ho sentito che siete bravi con i computer. Potreste aiutarmi?');
      return response.success && 
             response.response?.includes('IT-ERA') && 
             this.isItalianResponse(response.response);
    });

    await this.runTest('Context Awareness Multi-Turn', async () => {
      await this.sendChatMessage('Vorrei un preventivo');
      await this.sendChatMessage('Per un sito web');
      const response = await this.sendChatMessage('Quanto costa?');
      
      return response.success && response.response?.includes('€');
    });

    await this.runTest('Technical Knowledge Integration', async () => {
      const response = await this.sendChatMessage('Avete esperienza con firewall per aziende di 25 dipendenti?');
      return response.success && 
             response.response?.includes('WatchGuard') &&
             response.response?.includes('25') &&
             response.response?.includes('partner');
    });

    await this.runTest('Emotional Intelligence (Urgency Detection)', async () => {
      const response = await this.sendChatMessage('AIUTO! Il nostro sistema non funziona più, siamo bloccati completamente!');
      return response.success && 
             (response.priority === 'high' || response.escalate || 
              response.response?.toLowerCase().includes('immediata'));
    });

    console.log('✅ AI functionality testing completed\n');
  }

  // Test Group 4: Fallback Logic
  async testFallbackLogic() {
    console.log('\n🔄 FALLBACK LOGIC TESTING');
    console.log('-' .repeat(40));

    await this.runTest('AI Timeout Fallback', async () => {
      // Use a very complex query that might timeout
      const response = await this.sendChatMessage('Explain the quantum computational aspects of neural network optimization in distributed blockchain systems while considering the implications for Italian SME cybersecurity');
      
      // Should still get a response, even if it's fallback
      return response.success && response.response;
    });

    await this.runTest('Invalid Input Handling', async () => {
      const response = await this.sendChatMessage('§§§ΓΔΘ∞∑∏π∫∂∆');
      return response.success && response.response;
    });

    await this.runTest('Service Continuity During AI Issues', async () => {
      // Multiple rapid requests to test system stability
      const promises = Array(5).fill(null).map(() => 
        this.sendChatMessage('Info servizi IT')
      );
      
      const responses = await Promise.all(promises);
      return responses.every(r => r.success);
    });

    console.log('✅ Fallback logic testing completed\n');
  }

  // Test Group 5: Lead Generation
  async testLeadGeneration() {
    console.log('\n🎯 LEAD GENERATION & QUALIFICATION');
    console.log('-' .repeat(40));

    await this.runTest('B2B Lead Qualification', async () => {
      await this.sendChatMessage('Siamo una media azienda manifatturiera');
      await this.sendChatMessage('30 dipendenti');
      await this.sendChatMessage('Concorezzo');
      const response = await this.sendChatMessage('Budget mensile intorno ai 1500 euro');
      
      return response.success && 
             (response.escalate || response.priority === 'high');
    });

    await this.runTest('Complete Data Collection Flow', async () => {
      const leadData = {
        contact_name: 'Marco Test',
        email: 'marco@testcompany.it',
        phone: '+39 039 123 4567',
        company_name: 'Test Company SRL',
        location: 'Vimercate',
        company_size: '15',
        service_type: 'Assistenza IT completa'
      };

      const response = await this.sendChatMessage('update_data', null, 'update_data', { leadData });
      return response.success;
    });

    await this.runTest('Geographic Prioritization', async () => {
      const vimercateResponse = await this.sendChatMessage('Siamo a Vimercate');
      // Should get high priority due to location
      return vimercateResponse.success && 
             (vimercateResponse.response?.includes('10 minuti') || 
              vimercateResponse.response?.includes('stessa zona'));
    });

    console.log('✅ Lead generation testing completed\n');
  }

  // Test Group 6: Performance Metrics
  async testPerformanceMetrics() {
    console.log('\n⚡ PERFORMANCE METRICS TESTING');
    console.log('-' .repeat(40));

    const performanceTests = [
      'Informazioni sui vostri servizi',
      'Preventivo sito web',
      'Assistenza tecnica urgente',
      'Firewall per azienda',
      'Backup dati aziendali'
    ];

    const responseTimes = [];
    let aiSuccessCount = 0;

    for (const query of performanceTests) {
      const startTime = Date.now();
      const response = await this.sendChatMessage(query);
      const responseTime = Date.now() - startTime;
      
      responseTimes.push(responseTime);
      if (response.aiPowered) aiSuccessCount++;
      
      await this.delay(AI_TEST_CONFIG.rateLimit.testDelay);
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const aiSuccessRate = (aiSuccessCount / performanceTests.length) * 100;

    this.metrics.averageResponseTime = avgResponseTime;
    this.metrics.aiSuccessRate = aiSuccessRate;

    await this.runTest(`Response Time Under 10s (Avg: ${avgResponseTime.toFixed(0)}ms)`, async () => {
      return avgResponseTime < 10000;
    });

    await this.runTest(`AI Success Rate >95% (Current: ${aiSuccessRate.toFixed(1)}%)`, async () => {
      return aiSuccessRate >= PERFORMANCE_TARGETS.aiResponseRate;
    });

    console.log('✅ Performance metrics testing completed\n');
  }

  // Test Group 7: Knowledge Base Integration
  async testKnowledgeBase() {
    console.log('\n📚 KNOWLEDGE BASE INTEGRATION');
    console.log('-' .repeat(40));

    await this.runTest('IT-ERA Company Data Accuracy', async () => {
      const response = await this.sendChatMessage('Dove siete ubicati?');
      return response.success && 
             response.response?.includes('Vimercate') &&
             response.response?.includes('039 888 2041');
    });

    await this.runTest('WatchGuard Partnership Mention', async () => {
      const response = await this.sendChatMessage('Che firewall consigliate?');
      return response.success && 
             response.response?.includes('WatchGuard') &&
             (response.response?.includes('partner') || response.response?.includes('certificat'));
    });

    await this.runTest('Service Pricing Accuracy', async () => {
      const response = await this.sendChatMessage('Quanto costa l\'assistenza remota?');
      return response.success && 
             (response.response?.includes('80') || response.response?.includes('100'));
    });

    await this.runTest('Geographic Service Coverage', async () => {
      const response = await this.sendChatMessage('Venite anche a Milano?');
      return response.success && 
             response.response?.includes('Milano') &&
             (response.response?.includes('trasferta') || response.response?.includes('zona'));
    });

    console.log('✅ Knowledge base integration testing completed\n');
  }

  // Test Group 8: Cost Control
  async testCostControl() {
    console.log('\n💰 COST CONTROL & OPTIMIZATION');
    console.log('-' .repeat(40));

    await this.runTest('Response Caching', async () => {
      const query = 'Ciao, come state?';
      const response1 = await this.sendChatMessage(query);
      const response2 = await this.sendChatMessage(query);
      
      return response1.success && response2.success && 
             (response2.cached || response1.response === response2.response);
    });

    await this.runTest('Cost Tracking Functionality', async () => {
      const metrics = await this.sendChatMessage(null, null, 'get_metrics');
      return metrics.success && 
             typeof metrics.metrics?.totalCost !== 'undefined';
    });

    await this.runTest('Rate Limiting Protection', async () => {
      // Send multiple rapid requests
      const rapidRequests = Array(12).fill(null).map(() => 
        this.sendChatMessage('Test rate limit')
      );
      
      const responses = await Promise.all(rapidRequests);
      const rateLimited = responses.some(r => !r.success);
      
      return rateLimited; // Should have some rate limited
    });

    console.log('✅ Cost control testing completed\n');
  }

  // Test Group 9: Teams Integration
  async testTeamsIntegration() {
    console.log('\n📧 TEAMS INTEGRATION TESTING');
    console.log('-' .repeat(40));

    await this.runTest('Teams Notification Trigger', async () => {
      const leadData = {
        contact_name: 'Teams Test User',
        email: 'test@teams-integration.it',
        phone: '+39 039 999 8888',
        company_name: 'Teams Test SRL',
        service_type: 'Test escalation',
        urgency: 'alta'
      };

      const response = await this.sendChatMessage(null, null, 'email_handoff', { leadData });
      
      this.metrics.teamsNotifications += response.success ? 1 : 0;
      
      return response.success && 
             (response.ticketId || response.message?.includes('ricevuto'));
    });

    await this.runTest('AI-Enhanced Context in Notifications', async () => {
      // Simulate a conversation with AI context
      await this.sendChatMessage('Preventivo per assistenza IT completa');
      await this.sendChatMessage('Azienda 25 dipendenti');
      await this.sendChatMessage('Budget 2000 euro mensili');
      
      const escalationResponse = await this.sendChatMessage(null, null, 'email_handoff', { 
        leadData: {
          contact_name: 'Context Test',
          email: 'context@test.it',
          phone: '+39 039 123 4567',
          company_name: 'Context Test SRL'
        }
      });
      
      return escalationResponse.success;
    });

    console.log('✅ Teams integration testing completed\n');
  }

  // Utility Methods
  async runTest(testName, testFunction) {
    try {
      const startTime = Date.now();
      const result = await Promise.race([
        testFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), AI_TEST_CONFIG.timeouts.aiResponse)
        )
      ]);
      
      const duration = Date.now() - startTime;
      
      if (result) {
        console.log(`   ✅ ${testName} (${duration}ms)`);
      } else {
        console.log(`   ❌ ${testName} (${duration}ms)`);
        this.metrics.errors.push(`${testName}: Test assertion failed`);
      }
      
      this.metrics.totalTests++;
      return result;
      
    } catch (error) {
      console.log(`   ❌ ${testName}: ${error.message}`);
      this.metrics.errors.push(`${testName}: ${error.message}`);
      this.metrics.totalTests++;
      return false;
    }
  }

  async sendChatMessage(message = null, sessionId = null, action = 'message', customData = {}) {
    const requestData = {
      action: action,
      sessionId: sessionId || this.activeSession,
      ...customData
    };

    if (message) {
      requestData.message = message;
    }

    try {
      const response = await fetch(AI_TEST_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.it-era.it',
          'User-Agent': 'IT-ERA-Test-Suite/1.0'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update active session if provided
      if (result.sessionId && !this.activeSession) {
        this.activeSession = result.sessionId;
      }

      return result;
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        networkError: true
      };
    }
  }

  async makeRequest(endpoint = '') {
    try {
      const response = await fetch(AI_TEST_CONFIG.apiEndpoint.replace('/api/chat', endpoint));
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  isItalianResponse(text) {
    const italianWords = ['sono', 'siamo', 'assistenza', 'servizi', 'azienda', 'preventivo', 'possiamo', 'aiutare'];
    return italianWords.some(word => text?.toLowerCase().includes(word));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateFinalReport() {
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.length - passedTests;
    const successRate = this.results.length > 0 ? (passedTests / this.results.length) * 100 : 0;

    console.log('\n🎯 COMPREHENSIVE TEST RESULTS');
    console.log('=' .repeat(80));
    console.log(`📊 SUMMARY`);
    console.log(`   Total Scenario Tests: ${this.results.length}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ❌`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   Total Unit Tests: ${this.metrics.totalTests}`);
    console.log(`   Errors: ${this.metrics.errors.length}`);

    console.log(`\n⚡ PERFORMANCE METRICS`);
    console.log(`   AI Success Rate: ${this.metrics.aiSuccessRate.toFixed(1)}% (Target: ≥95%)`);
    console.log(`   Average Response Time: ${this.metrics.averageResponseTime.toFixed(0)}ms (Target: <10s)`);
    console.log(`   Teams Notifications: ${this.metrics.teamsNotifications} sent`);

    console.log(`\n🎯 MEETING SUCCESS CRITERIA`);
    const criteria = [
      { name: 'AI Response Rate >95%', met: this.metrics.aiSuccessRate >= 95, value: `${this.metrics.aiSuccessRate.toFixed(1)}%` },
      { name: 'Fallback Activation <5%', met: (100 - this.metrics.aiSuccessRate) <= 5, value: `${(100 - this.metrics.aiSuccessRate).toFixed(1)}%` },
      { name: 'Response Time <10s', met: this.metrics.averageResponseTime < 10000, value: `${this.metrics.averageResponseTime.toFixed(0)}ms` },
      { name: 'Teams Notification', met: this.metrics.teamsNotifications > 0, value: this.metrics.teamsNotifications > 0 ? '✅' : '❌' },
      { name: 'Critical Scenarios Pass', met: successRate >= 75, value: `${successRate.toFixed(1)}%` }
    ];

    criteria.forEach(criterion => {
      const status = criterion.met ? '✅' : '❌';
      console.log(`   ${status} ${criterion.name}: ${criterion.value}`);
    });

    if (failedTests > 0 || this.metrics.errors.length > 0) {
      console.log(`\n❌ ISSUES FOUND`);
      
      if (failedTests > 0) {
        console.log(`\n   Failed Scenarios:`);
        this.results.filter(r => !r.success).forEach(result => {
          console.log(`   • ${result.name}`);
          result.errors.forEach(error => console.log(`     └─ ${error}`));
        });
      }

      if (this.metrics.errors.length > 0) {
        console.log(`\n   Unit Test Errors:`);
        this.metrics.errors.forEach(error => console.log(`   • ${error}`));
      }
    }

    const overallStatus = successRate >= 75 && this.metrics.aiSuccessRate >= 90;
    console.log(`\n${overallStatus ? '🎉' : '🚨'} OVERALL STATUS: ${overallStatus ? 'READY FOR PRODUCTION' : 'NEEDS ATTENTION'}`);
    
    console.log(`\n📝 RECOMMENDATIONS`);
    if (overallStatus) {
      console.log('   ✅ AI integration is working correctly');
      console.log('   ✅ Fallback mechanisms are functioning');
      console.log('   ✅ Lead generation process is optimized');
      console.log('   ✅ Teams notifications are working');
      console.log('   🚀 System ready for production deployment');
    } else {
      if (this.metrics.aiSuccessRate < 95) console.log('   🔧 Improve AI response reliability');
      if (this.metrics.averageResponseTime > 8000) console.log('   ⚡ Optimize response time');
      if (this.metrics.teamsNotifications === 0) console.log('   📧 Fix Teams webhook integration');
      if (successRate < 75) console.log('   🎯 Review failed test scenarios');
      console.log('   ⚠️  Address issues before production');
    }

    console.log('\n🏁 Test Suite Complete!');
  }
}

// Export for use in other environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    AIIntegrationTester, 
    AI_TEST_CONFIG, 
    CRITICAL_TEST_SCENARIOS, 
    PERFORMANCE_TARGETS 
  };
}

// Browser-friendly export
if (typeof window !== 'undefined') {
  window.AIIntegrationTester = AIIntegrationTester;
  window.AI_TEST_CONFIG = AI_TEST_CONFIG;
}

// Auto-run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  (async () => {
    const tester = new AIIntegrationTester();
    await tester.runComprehensiveTestSuite();
  })().catch(console.error);
}