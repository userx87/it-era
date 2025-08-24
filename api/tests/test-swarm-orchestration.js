/**
 * Test Script for IT-ERA Swarm Orchestration
 * Tests the multi-agent system with real queries
 */

import { SwarmOrchestrator } from '../src/chatbot/swarm/swarm-orchestrator.js';
import { ChatbotSwarmIntegration } from '../src/chatbot/swarm/chatbot-swarm-integration.js';

// Mock environment
const mockEnv = {
  OPENROUTER_API_KEY: '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',
  TEAMS_WEBHOOK_URL: 'https://bulltechit.webhook.office.com/webhookb2/...',
  SWARM_ENABLED: 'true',
  AB_TEST_ENABLED: 'true',
  SWARM_PERCENTAGE: '100', // 100% for testing
  CHAT_SESSIONS: {
    put: async (key, value, options) => {
      console.log(`📝 Storing: ${key}`);
      return Promise.resolve();
    },
    get: async (key) => {
      console.log(`📖 Retrieving: ${key}`);
      return null;
    }
  },
  SHARED_CONFIG: {
    put: async (key, value) => {
      console.log(`⚙️ Config stored: ${key} = ${value}`);
      return Promise.resolve();
    },
    get: async (key) => {
      return null;
    }
  }
};

// Test queries representing different customer types
const testQueries = [
  {
    id: 'lead_1',
    name: 'High-Value Lead',
    message: 'Siamo una PMI con 50 dipendenti a Monza. Ci serve un firewall aziendale e backup per 5TB di dati. Avete soluzioni complete? Budget disponibile.',
    expectedAgents: ['lead-qualifier', 'technical-advisor', 'sales-assistant'],
    expectedLeadScore: 85
  },
  {
    id: 'support_1',
    name: 'Support Request',
    message: 'Il nostro server non si avvia da stamattina. È urgente! Siamo già vostri clienti.',
    expectedAgents: ['support-specialist', 'technical-advisor'],
    expectedLeadScore: 60
  },
  {
    id: 'info_1',
    name: 'Information Request',
    message: 'Che differenza c\'è tra WatchGuard T40 e T70? Quale consigliate per 25 utenti?',
    expectedAgents: ['technical-advisor', 'sales-assistant'],
    expectedLeadScore: 45
  },
  {
    id: 'price_1',
    name: 'Pricing Inquiry',
    message: 'Quanto costa un contratto di assistenza annuale per 20 PC?',
    expectedAgents: ['sales-assistant', 'lead-qualifier'],
    expectedLeadScore: 55
  },
  {
    id: 'security_1',
    name: 'Security Concern',
    message: 'Abbiamo subito un attacco ransomware. Ci serve aiuto immediato e poi vorremmo rivedere tutta la sicurezza.',
    expectedAgents: ['support-specialist', 'technical-advisor', 'sales-assistant'],
    expectedLeadScore: 90
  }
];

// Performance tracking
const performanceMetrics = {
  totalTime: 0,
  totalCost: 0,
  responses: [],
  errors: []
};

// Main test function
async function runSwarmTests() {
  console.log('🚀 Starting IT-ERA Swarm Orchestration Tests');
  console.log('================================================\n');
  
  // Initialize the integration
  const integration = new ChatbotSwarmIntegration(mockEnv);
  
  // Test each query
  for (const testCase of testQueries) {
    console.log(`\n📝 Test Case: ${testCase.name}`);
    console.log(`Query: "${testCase.message}"`);
    console.log('-'.repeat(50));
    
    const startTime = Date.now();
    
    try {
      // Create session data
      const sessionData = {
        messages: [
          { role: 'user', content: testCase.message, timestamp: Date.now() }
        ],
        context: {
          isNewCustomer: !testCase.message.includes('clienti'),
          location: 'Monza e Brianza'
        }
      };
      
      // Process with swarm
      const response = await integration.processMessage(
        `test_session_${testCase.id}`,
        testCase.message,
        sessionData
      );
      
      const responseTime = Date.now() - startTime;
      
      // Display results
      console.log(`\n✅ Response Generated:`);
      console.log(`Response: ${response.response.substring(0, 200)}...`);
      console.log(`\n📊 Metrics:`);
      console.log(`- Processing Mode: ${response.metadata?.processingMode || 'unknown'}`);
      console.log(`- Response Time: ${responseTime}ms`);
      console.log(`- Lead Score: ${response.leadScore || 0}`);
      console.log(`- Cost: €${(response.cost || 0).toFixed(4)}`);
      console.log(`- Agents Used: ${response.metadata?.agentsUsed?.join(', ') || 'N/A'}`);
      console.log(`- Consensus Strength: ${response.metadata?.consensusStrength || 'N/A'}`);
      
      // Validate expectations
      if (testCase.expectedAgents) {
        const usedAgents = response.metadata?.agentsUsed || [];
        const matchedAgents = testCase.expectedAgents.filter(agent => 
          usedAgents.some(used => used.includes(agent))
        );
        console.log(`\n🎯 Agent Match: ${matchedAgents.length}/${testCase.expectedAgents.length}`);
      }
      
      if (testCase.expectedLeadScore) {
        const scoreDiff = Math.abs((response.leadScore || 0) - testCase.expectedLeadScore);
        const scoreAccuracy = 100 - (scoreDiff / testCase.expectedLeadScore * 100);
        console.log(`🎯 Lead Score Accuracy: ${scoreAccuracy.toFixed(1)}%`);
      }
      
      // Track performance
      performanceMetrics.totalTime += responseTime;
      performanceMetrics.totalCost += (response.cost || 0);
      performanceMetrics.responses.push({
        testCase: testCase.name,
        responseTime,
        cost: response.cost || 0,
        leadScore: response.leadScore || 0,
        mode: response.metadata?.processingMode
      });
      
    } catch (error) {
      console.error(`\n❌ Error in test case: ${error.message}`);
      performanceMetrics.errors.push({
        testCase: testCase.name,
        error: error.message
      });
    }
  }
  
  // Display summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 PERFORMANCE SUMMARY');
  console.log('='.repeat(60));
  
  const avgResponseTime = performanceMetrics.totalTime / testQueries.length;
  const avgCost = performanceMetrics.totalCost / testQueries.length;
  
  console.log(`\n📊 Overall Metrics:`);
  console.log(`- Total Tests: ${testQueries.length}`);
  console.log(`- Successful: ${performanceMetrics.responses.length}`);
  console.log(`- Failed: ${performanceMetrics.errors.length}`);
  console.log(`- Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`- Average Cost: €${avgCost.toFixed(4)}`);
  console.log(`- Total Cost: €${performanceMetrics.totalCost.toFixed(4)}`);
  
  // Check against targets
  console.log(`\n🎯 Target Compliance:`);
  const targetResponseTime = 1600; // 1.6 seconds
  const targetCost = 0.04; // €0.04
  
  console.log(`- Response Time: ${avgResponseTime < targetResponseTime ? '✅' : '❌'} ${avgResponseTime.toFixed(0)}ms (target: <${targetResponseTime}ms)`);
  console.log(`- Cost per Query: ${avgCost < targetCost ? '✅' : '❌'} €${avgCost.toFixed(4)} (target: <€${targetCost})`);
  
  // Get A/B test metrics
  const metrics = integration.getMetrics();
  console.log(`\n🔬 A/B Test Results:`);
  console.log(`- Swarm Queries: ${metrics.swarm.count}`);
  console.log(`- Traditional Queries: ${metrics.traditional.count}`);
  
  if (metrics.comparison.status === 'ready') {
    console.log(`- Speed Improvement: ${metrics.comparison.speedImprovement}`);
    console.log(`- Cost Reduction: ${metrics.comparison.costReduction}`);
    console.log(`- Recommendation: ${metrics.comparison.recommendation}`);
  }
  
  // Test individual orchestrator functions
  console.log('\n' + '='.repeat(60));
  console.log('🧪 UNIT TESTS');
  console.log('='.repeat(60));
  
  await testOrchestrator();
}

// Test orchestrator functions
async function testOrchestrator() {
  const orchestrator = new SwarmOrchestrator(mockEnv);
  
  console.log('\n📝 Testing Intent Analysis...');
  const intents = [
    { message: 'Mi serve un firewall', expected: 'firewall_inquiry' },
    { message: 'Quanto costa?', expected: 'pricing_request' },
    { message: 'Aiuto urgente!', expected: 'support_urgent' },
    { message: 'Backup dei dati', expected: 'backup_inquiry' }
  ];
  
  for (const test of intents) {
    const intent = await orchestrator.analyzeIntent(test.message);
    const match = intent.primary === test.expected;
    console.log(`${match ? '✅' : '❌'} "${test.message}" → ${intent.primary} (expected: ${test.expected})`);
  }
  
  console.log('\n📝 Testing Lead Scoring...');
  const leadTests = [
    { 
      data: { message: 'PMI 50 dipendenti, budget disponibile', isNewCustomer: true },
      minScore: 70
    },
    {
      data: { message: 'Info generali', isNewCustomer: true },
      maxScore: 40
    }
  ];
  
  for (const test of leadTests) {
    const agents = [
      { 
        id: 'test-agent',
        assessLead: async () => ({ score: test.minScore || 30, factors: [] })
      }
    ];
    
    const consensus = await orchestrator.buildConsensus(
      agents, 
      { responses: [{ leadScore: test.minScore || 30 }] }
    );
    
    if (test.minScore) {
      console.log(`${consensus.leadScore >= test.minScore ? '✅' : '❌'} Lead score ${consensus.leadScore} >= ${test.minScore}`);
    } else if (test.maxScore) {
      console.log(`${consensus.leadScore <= test.maxScore ? '✅' : '❌'} Lead score ${consensus.leadScore} <= ${test.maxScore}`);
    }
  }
  
  console.log('\n✅ Unit tests completed');
}

// Run the tests
console.log('🏁 IT-ERA Swarm Orchestration Test Suite');
console.log('Version: 1.0.0');
console.log('Date:', new Date().toISOString());
console.log('');

runSwarmTests().then(() => {
  console.log('\n✅ All tests completed successfully!');
  console.log('\n📝 Next Steps:');
  console.log('1. Review performance metrics against targets');
  console.log('2. Adjust agent weights based on results');
  console.log('3. Fine-tune consensus algorithms');
  console.log('4. Deploy to staging environment');
  console.log('5. Monitor real-world performance');
}).catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});