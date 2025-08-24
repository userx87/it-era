/**
 * IT-ERA Chatbot Integration Tests
 * Tests real integration with IT-ERA knowledge base and Teams webhook
 */

const CHATBOT_ENDPOINT = 'http://localhost:8788/api/chat';
const TEST_TIMEOUT = 30000;

// Test configuration with real IT-ERA data
const TEST_CONFIG = {
  real_contact_info: {
    phone: "039 888 2041",
    address: "Viale Risorgimento, 32, Vimercate (MB)",
    email: "info@it-era.it",
    services: ["firewall", "assistenza IT", "backup", "sicurezza"]
  },
  teams_webhook: {
    url: "https://bulltechit.webhook.office.com/webhookb2/621e560e-86d9-478c-acfc-496624a88b79@f6ba30ad-37c0-41bf-a994-e434c59b4b2a/IncomingWebhook/fb2b1700f71c4806bdcbf0fc873952d0/c0aa99b7-8edb-41b4-b139-0ec4dd7864d5/V2l2_rh4MbAzeQQ4SpDifcMFLsktri3ocfMcQGZ6OHUmI1",
    timeout: 10000
  }
};

class ChatbotIntegrationTester {
  constructor() {
    this.sessionId = null;
    this.testResults = [];
  }

  /**
   * Test chatbot startup and greeting
   */
  async testChatbotStartup() {
    console.log('🚀 Testing chatbot startup...');
    
    try {
      const response = await fetch(CHATBOT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.it-era.it'
        },
        body: JSON.stringify({
          action: 'start'
        })
      });

      const data = await response.json();
      
      if (data.success && data.sessionId) {
        this.sessionId = data.sessionId;
        console.log('✅ Chatbot startup successful');
        console.log('Session ID:', this.sessionId);
        console.log('Response:', data.response);
        return { success: true, data };
      } else {
        throw new Error(`Startup failed: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('❌ Chatbot startup failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test conversation with real IT-ERA knowledge
   */
  async testRealKnowledgeIntegration() {
    console.log('🧠 Testing real IT-ERA knowledge integration...');
    
    const testQuestions = [
      "Che servizi offrite?",
      "Quanto costa un firewall?",
      "Fate assistenza a Vimercate?",
      "Qual è il vostro numero di telefono?",
      "Dove siete situati?"
    ];

    const results = [];

    for (const question of testQuestions) {
      try {
        const response = await fetch(CHATBOT_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://www.it-era.it'
          },
          body: JSON.stringify({
            action: 'message',
            message: question,
            sessionId: this.sessionId
          })
        });

        const data = await response.json();
        
        if (data.success) {
          const containsRealInfo = this.validateRealITERAInfo(data.response);
          results.push({
            question,
            response: data.response,
            containsRealInfo,
            aiPowered: data.aiPowered
          });
          
          console.log(`📝 Q: ${question}`);
          console.log(`📋 A: ${data.response.substring(0, 200)}...`);
          console.log(`✅ Contains real IT-ERA info: ${containsRealInfo}`);
          console.log('---');
        } else {
          results.push({
            question,
            error: data.error || 'Unknown error',
            success: false
          });
        }
      } catch (error) {
        console.error(`❌ Error testing question "${question}":`, error);
        results.push({
          question,
          error: error.message,
          success: false
        });
      }
    }

    const successfulTests = results.filter(r => r.containsRealInfo).length;
    console.log(`✅ Knowledge integration: ${successfulTests}/${testQuestions.length} tests passed`);
    
    return { results, successRate: successfulTests / testQuestions.length };
  }

  /**
   * Validate response contains real IT-ERA information
   */
  validateRealITERAInfo(response) {
    const realInfo = TEST_CONFIG.real_contact_info;
    const lowerResponse = response.toLowerCase();
    
    const checks = [
      lowerResponse.includes('039 888 2041') || lowerResponse.includes('039-888-2041'),
      lowerResponse.includes('vimercate'),
      lowerResponse.includes('risorgimento') || lowerResponse.includes('viale'),
      lowerResponse.includes('firewall') || lowerResponse.includes('watchguard'),
      lowerResponse.includes('assistenza') || lowerResponse.includes('supporto'),
      lowerResponse.includes('info@it-era.it') || lowerResponse.includes('it-era.it')
    ];
    
    return checks.filter(Boolean).length >= 2; // At least 2 real info pieces
  }

  /**
   * Test escalation and Teams webhook
   */
  async testEscalationAndTeamsWebhook() {
    console.log('📞 Testing escalation and Teams webhook...');
    
    try {
      // Trigger escalation by requesting human contact
      const escalationResponse = await fetch(CHATBOT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.it-era.it'
        },
        body: JSON.stringify({
          action: 'message',
          message: 'Vorrei parlare con un operatore umano per un preventivo firewall urgente',
          sessionId: this.sessionId
        })
      });

      const escalationData = await escalationResponse.json();
      console.log('Escalation response:', escalationData);

      if (escalationData.success && escalationData.escalate) {
        console.log('✅ Escalation triggered successfully');
        
        // Test Teams webhook by sending test notification
        const teamsTest = await this.testTeamsWebhookDirect();
        
        return {
          escalation: { success: true, data: escalationData },
          teamsWebhook: teamsTest
        };
      } else {
        throw new Error('Escalation not triggered');
      }
    } catch (error) {
      console.error('❌ Escalation test failed:', error);
      return {
        escalation: { success: false, error: error.message },
        teamsWebhook: { success: false, error: 'Escalation failed' }
      };
    }
  }

  /**
   * Test Teams webhook directly
   */
  async testTeamsWebhookDirect() {
    console.log('🔗 Testing Teams webhook directly...');
    
    const testCard = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": "Test IT-ERA Chatbot Integration",
      "themeColor": "4CAF50",
      "sections": [{
        "activityTitle": "🧪 **Chatbot Integration Test**",
        "activitySubtitle": `Test completato: ${new Date().toLocaleString('it-IT')}`,
        "facts": [
          { "name": "Status", "value": "Integration Test in Progress" },
          { "name": "Session ID", "value": this.sessionId || 'test-session' },
          { "name": "Telefono IT-ERA", "value": "039 888 2041" },
          { "name": "Sede", "value": "Viale Risorgimento 32, Vimercate" }
        ]
      }]
    };

    try {
      const response = await fetch(TEST_CONFIG.teams_webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'IT-ERA-Chatbot-Test/1.0'
        },
        body: JSON.stringify(testCard)
      });

      if (response.ok) {
        console.log('✅ Teams webhook test successful');
        return { success: true, status: response.status };
      } else {
        const errorText = await response.text().catch(() => 'No error text');
        throw new Error(`Teams webhook failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Teams webhook test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test complete lead collection and handoff
   */
  async testLeadCollectionHandoff() {
    console.log('📋 Testing lead collection and handoff...');
    
    try {
      // Simulate lead data collection
      const leadData = {
        contact_name: "Mario Rossi Test",
        email: "mario.rossi.test@example.com",
        phone: "335 123 4567",
        company_name: "Test Company Srl",
        location: "Vimercate",
        company_size: 15,
        service_type: "firewall",
        urgency: "alta",
        budget_range: "€2000-5000",
        message: "Test di integrazione chatbot per preventivo firewall WatchGuard"
      };

      const handoffResponse = await fetch(CHATBOT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.it-era.it'
        },
        body: JSON.stringify({
          action: 'email_handoff',
          sessionId: this.sessionId,
          leadData: leadData,
          escalationReason: 'test_integration'
        })
      });

      const handoffData = await handoffResponse.json();
      
      if (handoffData.success) {
        console.log('✅ Lead handoff successful');
        console.log('Ticket ID:', handoffData.ticketId);
        console.log('Expected response time:', handoffData.expectedResponseTime);
        return { success: true, data: handoffData };
      } else {
        throw new Error(`Handoff failed: ${JSON.stringify(handoffData)}`);
      }
    } catch (error) {
      console.error('❌ Lead handoff test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run complete integration test suite
   */
  async runCompleteTestSuite() {
    console.log('🧪 Starting IT-ERA Chatbot Integration Test Suite');
    console.log('=' .repeat(60));
    
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Startup
    testResults.tests.startup = await this.testChatbotStartup();
    
    if (!testResults.tests.startup.success) {
      console.log('❌ Cannot proceed with other tests - startup failed');
      return testResults;
    }

    // Test 2: Knowledge Integration
    testResults.tests.knowledge = await this.testRealKnowledgeIntegration();
    
    // Test 3: Escalation and Teams
    testResults.tests.escalation = await this.testEscalationAndTeamsWebhook();
    
    // Test 4: Lead Collection
    testResults.tests.leadHandoff = await this.testLeadCollectionHandoff();
    
    // Generate summary
    const allTests = Object.values(testResults.tests);
    const successfulTests = allTests.filter(test => test.success || test.successRate > 0.7).length;
    
    console.log('=' .repeat(60));
    console.log('🎯 TEST SUITE SUMMARY');
    console.log(`✅ Successful tests: ${successfulTests}/${allTests.length}`);
    console.log(`🔗 Session ID used: ${this.sessionId}`);
    console.log(`📞 Real IT-ERA contact: 039 888 2041`);
    console.log(`🏢 Real IT-ERA address: Viale Risorgimento 32, Vimercate`);
    console.log('=' .repeat(60));
    
    testResults.summary = {
      totalTests: allTests.length,
      successfulTests: successfulTests,
      successRate: successfulTests / allTests.length,
      sessionId: this.sessionId,
      realContactInfo: TEST_CONFIG.real_contact_info
    };
    
    return testResults;
  }
}

// Export for use in Node.js or browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatbotIntegrationTester;
} else if (typeof window !== 'undefined') {
  window.ChatbotIntegrationTester = ChatbotIntegrationTester;
}

// Auto-run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new ChatbotIntegrationTester();
  tester.runCompleteTestSuite()
    .then(results => {
      console.log('Test results:', JSON.stringify(results, null, 2));
      process.exit(results.summary.successRate > 0.8 ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}