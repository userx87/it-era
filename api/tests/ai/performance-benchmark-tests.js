/**
 * IT-ERA AI Chatbot Performance Benchmark Suite
 * Tests performance, cost control, and scalability
 * Author: Testing Specialist  
 * Date: 2025-08-24
 */

// Performance Test Configuration
const PERFORMANCE_CONFIG = {
  testDuration: 60000, // 1 minute test runs
  maxConcurrentUsers: 10,
  messageRates: [1, 5, 10, 20], // Messages per minute
  costLimits: {
    perConversation: 0.10, // $0.10
    perHour: 5.00, // $5.00 
    dailyBudget: 50.00 // $50.00
  },
  responseTimeTargets: {
    normal: 5000, // 5s normal responses
    ai: 8000, // 8s AI responses  
    fallback: 2000, // 2s fallback
    cache: 500 // 500ms cached responses
  },
  loadTestScenarios: {
    light: { users: 2, rate: 5 },
    medium: { users: 5, rate: 10 },
    heavy: { users: 10, rate: 20 },
    stress: { users: 20, rate: 30 }
  }
};

class PerformanceBenchmarkTester {
  constructor() {
    this.results = [];
    this.metrics = {
      responseTimes: [],
      aiCallCosts: [],
      cacheHitRates: [],
      throughput: [],
      errorRates: [],
      concurrencyResults: []
    };
    this.testSession = null;
  }

  async runPerformanceBenchmarks() {
    console.log('⚡ IT-ERA AI CHATBOT PERFORMANCE BENCHMARK SUITE');
    console.log('=' .repeat(80));
    
    try {
      await this.testResponseTimeBaseline();
      await this.testCachePerformance();
      await this.testCostOptimization();
      await this.testConcurrentUsers();
      await this.testLoadScenarios();
      await this.testScalabilityLimits();
      await this.testMemoryUsage();
      
      this.generatePerformanceReport();
      
    } catch (error) {
      console.error('❌ Performance test suite failed:', error);
      throw error;
    }
  }

  // Test Group 1: Response Time Baseline
  async testResponseTimeBaseline() {
    console.log('\n⏱️  RESPONSE TIME BASELINE');
    console.log('-' .repeat(40));

    const testQueries = [
      { query: 'Ciao', type: 'greeting', target: 1000 },
      { query: 'Info servizi', type: 'info', target: 2000 },
      { query: 'Preventivo sito web', type: 'quote', target: 3000 },
      { query: 'Assistenza server down urgente', type: 'emergency', target: 5000 },
      { query: 'Implementazione sistema complesso con integrazione ERP e CRM', type: 'complex_ai', target: 8000 }
    ];

    for (const test of testQueries) {
      await this.measureResponseTime(test);
      await this.delay(200); // Prevent rate limiting
    }

    const avgResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;
    console.log(`📊 Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log('✅ Response time baseline completed\n');
  }

  async measureResponseTime(test) {
    console.log(`   Testing: ${test.query.substring(0, 30)}...`);
    
    const measurements = [];
    const attempts = 3; // Multiple measurements for accuracy

    for (let i = 0; i < attempts; i++) {
      const startTime = Date.now();
      try {
        const response = await this.sendTestMessage(test.query);
        const responseTime = Date.now() - startTime;
        
        if (response.success) {
          measurements.push(responseTime);
          this.metrics.responseTimes.push(responseTime);
          
          // Track AI usage and costs
          if (response.aiPowered) {
            this.metrics.aiCallCosts.push(response.cost || 0);
          }
        }
      } catch (error) {
        console.log(`     ❌ Attempt ${i + 1} failed: ${error.message}`);
      }
      
      await this.delay(100);
    }

    if (measurements.length > 0) {
      const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const status = avgTime <= test.target ? '✅' : '⚠️';
      console.log(`     ${status} ${test.type}: ${avgTime.toFixed(0)}ms (target: ${test.target}ms)`);
      
      return { 
        type: test.type, 
        averageTime: avgTime, 
        target: test.target, 
        success: avgTime <= test.target,
        measurements 
      };
    }

    return { type: test.type, success: false, error: 'All attempts failed' };
  }

  // Test Group 2: Cache Performance
  async testCachePerformance() {
    console.log('\n💾 CACHE PERFORMANCE TESTING');
    console.log('-' .repeat(40));

    const commonQueries = [
      'Ciao come va?',
      'Che servizi offrite?', 
      'Quanto costa un sito web?',
      'Dove siete ubicati?',
      'Orari di apertura'
    ];

    let cacheHits = 0;
    let totalRequests = 0;

    for (const query of commonQueries) {
      // First request - should not be cached
      const response1 = await this.sendTestMessage(query);
      totalRequests++;
      
      await this.delay(100);
      
      // Second request - should be cached
      const response2 = await this.sendTestMessage(query);
      totalRequests++;
      
      if (response2.cached || response1.response === response2.response) {
        cacheHits++;
        console.log(`   ✅ Cache hit for: "${query.substring(0, 20)}..."`);
      } else {
        console.log(`   ⚠️  No cache hit for: "${query.substring(0, 20)}..."`);
      }
      
      await this.delay(200);
    }

    const cacheHitRate = (cacheHits / commonQueries.length) * 100;
    this.metrics.cacheHitRates.push(cacheHitRate);
    
    console.log(`📊 Cache Hit Rate: ${cacheHitRate.toFixed(1)}%`);
    console.log('✅ Cache performance testing completed\n');
  }

  // Test Group 3: Cost Optimization
  async testCostOptimization() {
    console.log('\n💰 COST OPTIMIZATION TESTING');
    console.log('-' .repeat(40));

    // Simulate a conversation that should trigger cost controls
    let totalCost = 0;
    const expensiveQueries = [
      'Spiegami in dettaglio tutti i vostri servizi',
      'Analizza le mie esigenze IT complete',
      'Confronta tutte le soluzioni disponibili',
      'Dimmi tutto sui firewall enterprise',
      'Consulenza completa per trasformazione digitale'
    ];

    console.log('   Testing cost accumulation and limits...');

    for (let i = 0; i < expensiveQueries.length; i++) {
      const response = await this.sendTestMessage(expensiveQueries[i]);
      
      if (response.cost) {
        totalCost += response.cost;
        console.log(`     Query ${i + 1}: $${response.cost.toFixed(4)} | Total: $${totalCost.toFixed(4)}`);
      }

      // Check if cost limit protection kicks in
      if (response.intent === 'cost_limit_reached') {
        console.log(`   ✅ Cost limit protection activated at $${totalCost.toFixed(4)}`);
        break;
      }

      await this.delay(100);
    }

    // Test cost tracking
    const metricsResponse = await this.sendTestMessage(null, null, 'get_metrics');
    if (metricsResponse.success && metricsResponse.metrics) {
      console.log(`   📊 Session Cost: $${metricsResponse.metrics.totalCost || 0}`);
      console.log(`   📊 AI Usage: ${metricsResponse.metrics.aiUsage || 0} calls`);
    }

    console.log('✅ Cost optimization testing completed\n');
  }

  // Test Group 4: Concurrent Users
  async testConcurrentUsers() {
    console.log('\n👥 CONCURRENT USERS TESTING');
    console.log('-' .repeat(40));

    for (const [level, config] of Object.entries(PERFORMANCE_CONFIG.loadTestScenarios)) {
      console.log(`   Testing ${level} load: ${config.users} users, ${config.rate} msg/min`);
      
      const result = await this.simulateConcurrentUsers(config.users, config.rate);
      this.metrics.concurrencyResults.push({
        level,
        ...config,
        ...result
      });

      console.log(`     ✅ ${result.successRate.toFixed(1)}% success rate`);
      console.log(`     📊 Avg response: ${result.averageResponseTime.toFixed(0)}ms`);
      
      await this.delay(5000); // Cool down between tests
    }

    console.log('✅ Concurrent users testing completed\n');
  }

  async simulateConcurrentUsers(userCount, messageRate) {
    const users = [];
    const results = [];
    const testDuration = 30000; // 30 seconds
    const messagesPerUser = Math.floor((messageRate / userCount) * (testDuration / 60000));

    console.log(`     Simulating ${userCount} users sending ${messagesPerUser} messages each...`);

    // Create concurrent user sessions
    for (let i = 0; i < userCount; i++) {
      users.push(this.simulateUser(i, messagesPerUser, results));
    }

    // Wait for all users to complete
    await Promise.all(users);

    // Analyze results
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.length - successfulRequests;
    const successRate = (successfulRequests / results.length) * 100;
    const averageResponseTime = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests;

    return {
      totalRequests: results.length,
      successfulRequests,
      failedRequests,
      successRate,
      averageResponseTime: averageResponseTime || 0,
      throughput: successfulRequests / (testDuration / 1000) // requests per second
    };
  }

  async simulateUser(userId, messageCount, results) {
    const userQueries = [
      'Ciao, ho bisogno di assistenza',
      'Preventivo per la mia azienda',
      'Che servizi IT offrite?',
      'Informazioni sui prezzi',
      'Assistenza tecnica urgente'
    ];

    for (let i = 0; i < messageCount; i++) {
      const query = userQueries[Math.floor(Math.random() * userQueries.length)];
      const startTime = Date.now();
      
      try {
        const response = await this.sendTestMessage(`[User${userId}] ${query}`, true); // New session for each user
        const responseTime = Date.now() - startTime;
        
        results.push({
          userId,
          messageIndex: i,
          query,
          success: response.success,
          responseTime,
          aiPowered: response.aiPowered,
          cached: response.cached
        });
        
      } catch (error) {
        results.push({
          userId,
          messageIndex: i,
          query,
          success: false,
          responseTime: Date.now() - startTime,
          error: error.message
        });
      }

      // Random delay between user messages
      await this.delay(Math.random() * 2000 + 1000);
    }
  }

  // Test Group 5: Load Scenarios
  async testLoadScenarios() {
    console.log('\n🔥 LOAD SCENARIO TESTING');
    console.log('-' .repeat(40));

    // Test rapid-fire requests
    await this.testRapidFireRequests();
    
    // Test sustained load
    await this.testSustainedLoad();
    
    // Test burst traffic
    await this.testBurstTraffic();

    console.log('✅ Load scenario testing completed\n');
  }

  async testRapidFireRequests() {
    console.log('   Testing rapid-fire requests...');
    
    const rapidRequests = Array(20).fill(null).map((_, i) => 
      this.sendTestMessage(`Rapid test ${i}`)
    );

    const startTime = Date.now();
    const responses = await Promise.all(rapidRequests);
    const duration = Date.now() - startTime;

    const successCount = responses.filter(r => r.success).length;
    const successRate = (successCount / responses.length) * 100;
    const throughput = responses.length / (duration / 1000);

    console.log(`     📊 ${successCount}/${responses.length} successful (${successRate.toFixed(1)}%)`);
    console.log(`     📊 Throughput: ${throughput.toFixed(1)} requests/second`);
  }

  async testSustainedLoad() {
    console.log('   Testing sustained load (2 minutes)...');
    
    const testDuration = 120000; // 2 minutes
    const requestInterval = 2000; // 2 seconds between requests
    const startTime = Date.now();
    let requestCount = 0;
    let successCount = 0;

    while (Date.now() - startTime < testDuration) {
      try {
        const response = await this.sendTestMessage(`Sustained load test ${requestCount}`);
        if (response.success) successCount++;
        requestCount++;
      } catch (error) {
        requestCount++;
      }
      
      await this.delay(requestInterval);
    }

    const actualDuration = Date.now() - startTime;
    const successRate = (successCount / requestCount) * 100;
    
    console.log(`     📊 ${successCount}/${requestCount} successful over ${(actualDuration/1000).toFixed(0)}s`);
    console.log(`     📊 Success rate: ${successRate.toFixed(1)}%`);
  }

  async testBurstTraffic() {
    console.log('   Testing burst traffic patterns...');
    
    // Simulate 3 bursts of traffic with quiet periods
    for (let burst = 1; burst <= 3; burst++) {
      console.log(`     Burst ${burst}:`);
      
      const burstRequests = Array(15).fill(null).map((_, i) =>
        this.sendTestMessage(`Burst ${burst} request ${i}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(burstRequests);
      const duration = Date.now() - startTime;

      const successCount = responses.filter(r => r.success).length;
      const avgResponseTime = responses
        .filter(r => r.success && r.responseTime)
        .reduce((sum, r) => sum + (r.responseTime || 0), 0) / successCount;

      console.log(`       ${successCount}/${responses.length} successful in ${duration}ms`);
      console.log(`       Avg response time: ${avgResponseTime.toFixed(0)}ms`);

      // Quiet period between bursts
      if (burst < 3) {
        await this.delay(10000); // 10 second quiet period
      }
    }
  }

  // Test Group 6: Scalability Limits
  async testScalabilityLimits() {
    console.log('\n📈 SCALABILITY LIMITS TESTING');
    console.log('-' .repeat(40));

    // Find the maximum concurrent users the system can handle
    let maxUsers = 1;
    let systemLimit = false;

    while (!systemLimit && maxUsers <= 50) {
      console.log(`   Testing ${maxUsers} concurrent users...`);
      
      const result = await this.simulateConcurrentUsers(maxUsers, 10);
      
      if (result.successRate < 80 || result.averageResponseTime > 15000) {
        console.log(`     ⚠️  System limits reached at ${maxUsers} users`);
        console.log(`     📊 Success rate: ${result.successRate.toFixed(1)}%`);
        console.log(`     📊 Avg response: ${result.averageResponseTime.toFixed(0)}ms`);
        systemLimit = true;
      } else {
        console.log(`     ✅ Handled ${maxUsers} users successfully`);
        maxUsers *= 2; // Double the load
      }
      
      await this.delay(5000); // Cool down
    }

    console.log(`📊 Maximum concurrent users: ${maxUsers / 2}`);
    console.log('✅ Scalability limits testing completed\n');
  }

  // Test Group 7: Memory Usage
  async testMemoryUsage() {
    console.log('\n🧠 MEMORY USAGE TESTING');
    console.log('-' .repeat(40));

    // Simulate long conversations to test memory management
    const longConversation = [
      'Ciao, vorrei informazioni sui vostri servizi',
      'Siamo una azienda di 50 dipendenti',
      'Abbiamo sede a Milano',
      'Ci serve assistenza IT completa',
      'Anche backup e sicurezza',
      'Che tipo di firewall consigliate?',
      'WatchGuard va bene per noi?',
      'Quanto costa tutto il pacchetto?',
      'Possiamo avere un preventivo dettagliato?',
      'Quando potreste fare un sopralluogo?'
    ];

    console.log('   Testing session memory management...');

    let sessionSize = 0;
    for (let i = 0; i < longConversation.length; i++) {
      const response = await this.sendTestMessage(longConversation[i]);
      
      if (response.success) {
        // Rough estimate of session data size
        const messageData = JSON.stringify({
          input: longConversation[i],
          output: response.response,
          context: response.context || {}
        });
        sessionSize += messageData.length;
      }
      
      await this.delay(200);
    }

    console.log(`   📊 Estimated session size: ${(sessionSize / 1024).toFixed(1)} KB`);

    // Test multiple sessions
    console.log('   Testing multiple session management...');
    
    const sessionPromises = Array(10).fill(null).map((_, i) =>
      this.sendTestMessage(`Session ${i} test message`, true)
    );

    const sessionResponses = await Promise.all(sessionPromises);
    const successfulSessions = sessionResponses.filter(r => r.success).length;
    
    console.log(`   📊 ${successfulSessions}/10 sessions created successfully`);
    console.log('✅ Memory usage testing completed\n');
  }

  // Utility Methods
  async sendTestMessage(message = 'test', newSession = false, action = 'message', customData = {}) {
    if (newSession) {
      this.testSession = null;
    }

    const requestData = {
      action: message ? action : (action !== 'message' ? action : 'start'),
      sessionId: this.testSession,
      ...customData
    };

    if (message) {
      requestData.message = message;
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch('http://localhost:8788/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.it-era.it',
          'User-Agent': 'IT-ERA-Performance-Test/1.0'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      
      // Update session if provided
      if (result.sessionId && !this.testSession) {
        this.testSession = result.sessionId;
      }

      return {
        ...result,
        responseTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        networkError: true
      };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generatePerformanceReport() {
    console.log('\n📊 PERFORMANCE BENCHMARK REPORT');
    console.log('=' .repeat(80));

    // Response Time Analysis
    if (this.metrics.responseTimes.length > 0) {
      const avgResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;
      const maxResponseTime = Math.max(...this.metrics.responseTimes);
      const minResponseTime = Math.min(...this.metrics.responseTimes);
      
      console.log(`⏱️  RESPONSE TIMES`);
      console.log(`   Average: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`   Minimum: ${minResponseTime}ms`);
      console.log(`   Maximum: ${maxResponseTime}ms`);
      console.log(`   Target: <8000ms (${avgResponseTime < 8000 ? '✅' : '❌'})`);
    }

    // Cost Analysis
    if (this.metrics.aiCallCosts.length > 0) {
      const totalAICost = this.metrics.aiCallCosts.reduce((a, b) => a + b, 0);
      const avgCostPerCall = totalAICost / this.metrics.aiCallCosts.length;
      
      console.log(`\n💰 COST ANALYSIS`);
      console.log(`   Total AI Calls: ${this.metrics.aiCallCosts.length}`);
      console.log(`   Total Cost: $${totalAICost.toFixed(4)}`);
      console.log(`   Avg Cost/Call: $${avgCostPerCall.toFixed(4)}`);
      console.log(`   Target: <$0.10/conversation (${avgCostPerCall < 0.10 ? '✅' : '❌'})`);
    }

    // Cache Performance
    if (this.metrics.cacheHitRates.length > 0) {
      const avgCacheHitRate = this.metrics.cacheHitRates.reduce((a, b) => a + b, 0) / this.metrics.cacheHitRates.length;
      
      console.log(`\n💾 CACHE PERFORMANCE`);
      console.log(`   Average Hit Rate: ${avgCacheHitRate.toFixed(1)}%`);
      console.log(`   Target: >20% (${avgCacheHitRate > 20 ? '✅' : '❌'})`);
    }

    // Concurrency Results
    if (this.metrics.concurrencyResults.length > 0) {
      console.log(`\n👥 CONCURRENCY PERFORMANCE`);
      this.metrics.concurrencyResults.forEach(result => {
        console.log(`   ${result.level.toUpperCase()}: ${result.users} users, ${result.successRate.toFixed(1)}% success`);
      });
      
      const heavyLoad = this.metrics.concurrencyResults.find(r => r.level === 'heavy');
      if (heavyLoad) {
        console.log(`   Heavy Load Target: >90% success (${heavyLoad.successRate > 90 ? '✅' : '❌'})`);
      }
    }

    // Overall Assessment
    const performanceScore = this.calculatePerformanceScore();
    
    console.log(`\n🎯 OVERALL PERFORMANCE SCORE: ${performanceScore}/100`);
    
    if (performanceScore >= 90) {
      console.log(`🎉 EXCELLENT: System ready for production`);
    } else if (performanceScore >= 75) {
      console.log(`✅ GOOD: Minor optimizations recommended`);
    } else if (performanceScore >= 60) {
      console.log(`⚠️  FAIR: Performance improvements needed`);
    } else {
      console.log(`❌ POOR: Major performance issues detected`);
    }

    // Recommendations
    console.log(`\n📝 RECOMMENDATIONS`);
    const recommendations = this.generateRecommendations(performanceScore);
    recommendations.forEach(rec => console.log(`   ${rec}`));

    console.log('\n🏁 Performance Benchmark Complete!');
  }

  calculatePerformanceScore() {
    let score = 100;

    // Response time penalty
    if (this.metrics.responseTimes.length > 0) {
      const avgResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;
      if (avgResponseTime > 8000) score -= 20;
      else if (avgResponseTime > 5000) score -= 10;
      else if (avgResponseTime > 3000) score -= 5;
    }

    // Concurrency penalty
    const heavyLoad = this.metrics.concurrencyResults.find(r => r.level === 'heavy');
    if (heavyLoad && heavyLoad.successRate < 90) score -= 15;

    // Cache efficiency bonus/penalty
    if (this.metrics.cacheHitRates.length > 0) {
      const avgCacheHitRate = this.metrics.cacheHitRates.reduce((a, b) => a + b, 0) / this.metrics.cacheHitRates.length;
      if (avgCacheHitRate > 50) score += 5;
      else if (avgCacheHitRate < 20) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  generateRecommendations(score) {
    const recommendations = [];

    if (this.metrics.responseTimes.length > 0) {
      const avgResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;
      if (avgResponseTime > 5000) {
        recommendations.push('🔧 Optimize AI response generation time');
      }
    }

    const heavyLoad = this.metrics.concurrencyResults.find(r => r.level === 'heavy');
    if (heavyLoad && heavyLoad.successRate < 90) {
      recommendations.push('📈 Improve concurrent user handling capacity');
    }

    if (this.metrics.cacheHitRates.length > 0) {
      const avgCacheHitRate = this.metrics.cacheHitRates.reduce((a, b) => a + b, 0) / this.metrics.cacheHitRates.length;
      if (avgCacheHitRate < 30) {
        recommendations.push('💾 Implement better response caching strategy');
      }
    }

    if (this.metrics.aiCallCosts.length > 0) {
      const avgCostPerCall = this.metrics.aiCallCosts.reduce((a, b) => a + b, 0) / this.metrics.aiCallCosts.length;
      if (avgCostPerCall > 0.05) {
        recommendations.push('💰 Optimize AI call costs with better prompts');
      }
    }

    if (score >= 90) {
      recommendations.push('🚀 System performance is excellent - ready for production');
    } else if (score >= 75) {
      recommendations.push('✅ Good performance - minor optimizations will improve user experience');
    } else {
      recommendations.push('⚠️  Performance improvements required before production deployment');
    }

    return recommendations;
  }
}

// Export for use in other environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceBenchmarkTester, PERFORMANCE_CONFIG };
}

// Browser-friendly export
if (typeof window !== 'undefined') {
  window.PerformanceBenchmarkTester = PerformanceBenchmarkTester;
}

// Auto-run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  (async () => {
    const tester = new PerformanceBenchmarkTester();
    await tester.runPerformanceBenchmarks();
  })().catch(console.error);
}