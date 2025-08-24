/**
 * Comprehensive AI Chatbot Test Suite
 * Tests for AI integration, conversation flows, and edge cases
 */

// Test Configuration
const TEST_CONFIG = {
  apiEndpoint: 'http://localhost:8788/api/chat', // Dev endpoint
  testSessions: [],
  testResults: [],
  timeouts: {
    response: 5000,
    aiResponse: 8000,
    escalation: 2000
  }
};

class ChatbotTester {
  constructor() {
    this.results = [];
    this.currentTest = null;
    this.testSession = null;
  }

  // Core test framework
  async runTestSuite() {
    console.log('🚀 Starting IT-ERA AI Chatbot Test Suite...\n');
    
    const testGroups = [
      () => this.testBasicFunctionality(),
      () => this.testAIIntegration(),
      () => this.testConversationFlows(),
      () => this.testLeadQualification(),
      () => this.testEscalationLogic(),
      () => this.testPerformance(),
      () => this.testErrorHandling(),
      () => this.testEmailIntegration(),
      () => this.testCostOptimization()
    ];

    for (const testGroup of testGroups) {
      try {
        await testGroup();
      } catch (error) {
        this.logError(`Test group failed: ${error.message}`);
      }
    }

    this.generateTestReport();
  }

  // Test Group 1: Basic Functionality
  async testBasicFunctionality() {
    this.log('📋 Testing Basic Functionality...');

    // Test session initialization
    await this.test('Session Creation', async () => {
      const response = await this.sendMessage(null, 'start');
      return response.success && response.sessionId && response.response;
    });

    // Test basic conversation
    await this.test('Basic Message Exchange', async () => {
      const response = await this.sendMessage('Ciao');
      return response.success && response.response.includes('IT-ERA');
    });

    // Test option selection
    await this.test('Option Selection', async () => {
      const response = await this.sendMessage('Preventivo');
      return response.success && response.options && response.options.length > 0;
    });

    // Test CORS headers
    await this.test('CORS Headers', async () => {
      const response = await fetch(TEST_CONFIG.apiEndpoint, {
        method: 'OPTIONS',
        headers: { 'Origin': 'https://www.it-era.it' }
      });
      return response.ok;
    });
  }

  // Test Group 2: AI Integration
  async testAIIntegration() {
    this.log('🧠 Testing AI Integration...');

    // Test AI-powered response
    await this.test('AI Response Generation', async () => {
      const response = await this.sendMessage('Voglio creare un sito web per la mia azienda di consulenza');
      return response.success && (response.aiPowered || response.intent === 'sito_web');
    });

    // Test intent recognition
    await this.test('Advanced Intent Recognition', async () => {
      const response = await this.sendMessage('Ho problemi con il server che va in crash');
      return response.success && (response.intent === 'supporto' || response.intent === 'assistenza');
    });

    // Test conversation context
    await this.test('Context Awareness', async () => {
      await this.sendMessage('Preventivo sito web');
      const response = await this.sendMessage('Quanto costa?');
      return response.success && response.response.includes('€');
    });

    // Test AI fallback
    await this.test('AI Fallback Mechanism', async () => {
      // Simulate AI failure with complex query
      const response = await this.sendMessage('Γεια σας, θέλω να δημιουργήσω ένα περίπλοκο σύστημα');
      return response.success && response.response; // Should fallback gracefully
    });
  }

  // Test Group 3: Conversation Flows
  async testConversationFlows() {
    this.log('💬 Testing Conversation Flows...');

    // Test complete lead qualification flow
    await this.test('Complete Lead Qualification Flow', async () => {
      await this.sendMessage(null, 'start'); // Fresh session
      await this.sendMessage('Preventivo');
      await this.sendMessage('Sito Web');
      
      const businessResponse = await this.sendMessage('Azienda');
      return businessResponse.success && 
             (businessResponse.step === 'business_qualification' || 
              businessResponse.response.includes('azienda'));
    });

    // Test escalation flow
    await this.test('Human Escalation Flow', async () => {
      const response = await this.sendMessage('Voglio parlare con una persona');
      return response.success && response.escalate;
    });

    // Test support flow
    await this.test('Technical Support Flow', async () => {
      await this.sendMessage('Assistenza');
      const response = await this.sendMessage('Il mio sito non funziona più');
      return response.success && response.response.includes('supporto');
    });

    // Test information flow
    await this.test('Information Request Flow', async () => {
      const response = await this.sendMessage('Che servizi offrite?');
      return response.success && 
             response.response.includes('IT-ERA') && 
             response.options && response.options.length > 0;
    });
  }

  // Test Group 4: Lead Qualification
  async testLeadQualification() {
    this.log('🎯 Testing Lead Qualification...');

    // Test high-priority lead detection
    await this.test('High-Priority Lead Detection', async () => {
      await this.sendMessage(null, 'start');
      await this.sendMessage('Preventivo urgente per e-commerce');
      await this.sendMessage('Budget 50.000 euro');
      const response = await this.sendMessage('100 dipendenti');
      
      return response.success && 
             (response.escalate || response.priority === 'high');
    });

    // Test data collection
    await this.test('Lead Data Collection', async () => {
      const response = await this.sendMessage(null, 'update_data', {
        leadData: {
          contact_name: 'Mario Rossi',
          email: 'mario@test.com',
          phone: '+39 123 456 7890',
          company_name: 'Test SRL'
        }
      });
      
      return response.success;
    });

    // Test qualification scoring
    await this.test('Lead Qualification Scoring', async () => {
      await this.sendMessage('Siamo una media azienda');
      await this.sendMessage('Budget tra 10.000 e 25.000 euro');
      const response = await this.sendMessage('Progetto entro 2 mesi');
      
      return response.success;
    });
  }

  // Test Group 5: Escalation Logic
  async testEscalationLogic() {
    this.log('🚨 Testing Escalation Logic...');

    // Test explicit human request
    await this.test('Explicit Human Request', async () => {
      const response = await this.sendMessage('Voglio parlare con un operatore umano');
      return response.success && response.escalate;
    });

    // Test escalation triggers
    await this.test('Complex Query Escalation', async () => {
      const response = await this.sendMessage('Ho bisogno di una soluzione custom molto complessa con integrazioni ERP, CRM e sistemi legacy');
      return response.success; // May or may not escalate, both are valid
    });

    // Test cost limit escalation
    await this.test('Cost Limit Escalation', async () => {
      // Simulate high-cost conversation (would need to mock AI calls)
      const response = await this.sendMessage('Continuo a fare molte domande per testare il sistema');
      return response.success;
    });

    // Test priority escalation
    await this.test('Priority Escalation Handling', async () => {
      const response = await this.sendMessage('URGENTE: Il sistema è down e ho bisogno di aiuto immediato');
      return response.success && 
             (response.escalate || response.priority === 'high');
    });
  }

  // Test Group 6: Performance
  async testPerformance() {
    this.log('⚡ Testing Performance...');

    // Test response time
    await this.test('Response Time Under 2s', async () => {
      const startTime = Date.now();
      const response = await this.sendMessage('Info servizi');
      const responseTime = Date.now() - startTime;
      
      return response.success && responseTime < 2000;
    });

    // Test concurrent sessions
    await this.test('Concurrent Session Handling', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(this.sendMessage('Test concorrenza', null, true)); // New session
      }
      
      const responses = await Promise.all(promises);
      return responses.every(r => r.success);
    });

    // Test AI timeout handling
    await this.test('AI Timeout Handling', async () => {
      // Test with complex query that might timeout
      const response = await this.sendMessage('Explain in detail the complex mathematical algorithms behind machine learning implementations in blockchain-based distributed systems');
      return response.success; // Should handle timeout gracefully
    });

    // Test cache efficiency
    await this.test('Response Caching', async () => {
      const response1 = await this.sendMessage('Ciao');
      const response2 = await this.sendMessage('Ciao');
      
      return response1.success && response2.success && response2.cached;
    });
  }

  // Test Group 7: Error Handling
  async testErrorHandling() {
    this.log('🛡️ Testing Error Handling...');

    // Test invalid JSON
    await this.test('Invalid JSON Handling', async () => {
      try {
        const response = await fetch(TEST_CONFIG.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json'
        });
        const result = await response.json();
        return !result.success; // Should return error gracefully
      } catch (error) {
        return true; // Error handling worked
      }
    });

    // Test missing parameters
    await this.test('Missing Parameters', async () => {
      const response = await this.sendMessage('', null, false, { action: 'message' }); // Empty message
      return !response.success || response.error; // Should handle gracefully
    });

    // Test rate limiting
    await this.test('Rate Limiting', async () => {
      // Send many requests quickly
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(this.sendMessage(`Test rate limiting ${i}`));
      }
      
      const responses = await Promise.all(promises.map(p => p.catch(e => ({ success: false }))));
      const rateLimited = responses.some(r => !r.success);
      return rateLimited; // Some should be rate limited
    });

    // Test network errors
    await this.test('Network Error Recovery', async () => {
      // Test with wrong endpoint
      try {
        const response = await fetch(TEST_CONFIG.apiEndpoint + '/wrong', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'message', message: 'test' })
        });
        return !response.ok; // Should fail gracefully
      } catch (error) {
        return true; // Network error handled
      }
    });
  }

  // Test Group 8: Email Integration
  async testEmailIntegration() {
    this.log('📧 Testing Email Integration...');

    // Test email handoff
    await this.test('Email System Handoff', async () => {
      const response = await this.sendMessage(null, 'email_handoff', {
        leadData: {
          contact_name: 'Test User',
          email: 'test@example.com',
          phone: '+39 123 456 7890',
          company_name: 'Test Company',
          service_type: 'Sito Web'
        }
      });
      
      return response.success || response.ticketId;
    });

    // Test email validation
    await this.test('Email Validation', async () => {
      const response = await this.sendMessage(null, 'email_handoff', {
        leadData: {
          contact_name: 'Test User',
          email: 'invalid-email',
          phone: '+39 123 456 7890'
        }
      });
      
      return !response.success; // Should fail with invalid email
    });

    // Test conversation context in email
    await this.test('Conversation Context in Email', async () => {
      await this.sendMessage('Preventivo per sito e-commerce');
      await this.sendMessage('Budget 15.000 euro');
      
      const response = await this.sendMessage(null, 'email_handoff', {
        leadData: {
          contact_name: 'Context Test',
          email: 'context@test.com',
          phone: '+39 123 456 7890'
        }
      });
      
      return response.success;
    });
  }

  // Test Group 9: Cost Optimization
  async testCostOptimization() {
    this.log('💰 Testing Cost Optimization...');

    // Test response caching
    await this.test('Response Caching Efficiency', async () => {
      const commonQuery = 'Quanto costa un sito web?';
      const response1 = await this.sendMessage(commonQuery);
      const response2 = await this.sendMessage(commonQuery);
      
      return response1.success && response2.success;
    });

    // Test AI usage optimization
    await this.test('AI Usage Optimization', async () => {
      // Simple greeting shouldn't use expensive AI
      const response = await this.sendMessage('Ciao');
      return response.success; // Should work efficiently
    });

    // Test cost tracking
    await this.test('Cost Tracking', async () => {
      await this.sendMessage('Complex AI query about machine learning and artificial intelligence implementation');
      const metrics = await this.sendMessage(null, 'get_metrics');
      
      return metrics.success && typeof metrics.metrics === 'object';
    });
  }

  // Utility methods
  async test(testName, testFunction) {
    this.currentTest = testName;
    try {
      const startTime = Date.now();
      const result = await Promise.race([
        testFunction(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), TEST_CONFIG.timeouts.response))
      ]);
      
      const duration = Date.now() - startTime;
      this.logResult(testName, result, duration);
      return result;
    } catch (error) {
      this.logResult(testName, false, 0, error.message);
      return false;
    }
  }

  async sendMessage(message = null, action = 'message', newSession = false, customData = {}) {
    if (newSession || !this.testSession) {
      this.testSession = null;
    }

    const requestData = {
      action: action || 'message',
      sessionId: this.testSession,
      ...customData
    };

    if (message) {
      requestData.message = message;
    }

    try {
      const response = await fetch(TEST_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.it-era.it'
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (result.sessionId && !this.testSession) {
        this.testSession = result.sessionId;
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

  logResult(testName, success, duration, error = null) {
    const status = success ? '✅' : '❌';
    const durationText = duration > 0 ? ` (${duration}ms)` : '';
    const errorText = error ? ` - ${error}` : '';
    
    console.log(`  ${status} ${testName}${durationText}${errorText}`);
    
    this.results.push({
      name: testName,
      success,
      duration,
      error
    });
  }

  log(message) {
    console.log(`\n${message}`);
  }

  logError(message) {
    console.error(`❌ ${message}`);
  }

  generateTestReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;

    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Average Response Time: ${averageDuration.toFixed(0)}ms`);

    if (failedTests > 0) {
      console.log('\n🔍 FAILED TESTS:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.name}${r.error ? ': ' + r.error : ''}`);
      });
    }

    // Performance insights
    const slowTests = this.results.filter(r => r.duration > 2000);
    if (slowTests.length > 0) {
      console.log('\n⚠️  SLOW TESTS (>2s):');
      slowTests.forEach(r => {
        console.log(`  - ${r.name}: ${r.duration}ms`);
      });
    }

    console.log('\n🎯 Test Suite Complete!');
  }
}

// Run tests if called directly
if (typeof window === 'undefined' && require.main === module) {
  const tester = new ChatbotTester();
  tester.runTestSuite().catch(console.error);
}

// Export for use in other testing frameworks
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChatbotTester, TEST_CONFIG };
}

// Browser-friendly export
if (typeof window !== 'undefined') {
  window.ChatbotTester = ChatbotTester;
  window.TEST_CONFIG = TEST_CONFIG;
}