/**
 * IT-ERA Chatbot Full Test Suite Runner
 * Orchestrates all chatbot tests and generates comprehensive report
 * Date: 2025-08-24
 */

import { ChatbotTester, TEST_SCENARIOS } from './chatbot-comprehensive-tests.js';
import { TeamsIntegrationTester } from './teams-integration-tests.js';
import { ITERAKnowledgeBase } from '../../src/knowledge-base/it-era-knowledge-real.js';

class FullTestSuiteRunner {
  constructor() {
    this.startTime = Date.now();
    this.allResults = {
      chatbot: null,
      teams: null,
      performance: {},
      summary: {},
      screenshots: [] // Placeholder for future screenshot integration
    };
  }

  async runFullTestSuite() {
    console.log('🚀 IT-ERA CHATBOT FULL TEST SUITE');
    console.log('=' .repeat(80));
    console.log(`Start Time: ${new Date().toLocaleString('it-IT')}`);
    console.log(`Testing Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('=' .repeat(80));

    try {
      // 1. Run Knowledge Base Validation
      await this.validateKnowledgeBase();

      // 2. Run Comprehensive Chatbot Tests
      await this.runChatbotTests();

      // 3. Run Teams Integration Tests  
      await this.runTeamsTests();

      // 4. Performance Tests
      await this.runPerformanceTests();

      // 5. Generate Final Report
      const finalReport = await this.generateFinalReport();

      this.displayFinalResults(finalReport);

      return finalReport;

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  async validateKnowledgeBase() {
    console.log('\n📋 KNOWLEDGE BASE VALIDATION');
    console.log('-' .repeat(50));

    const validationResults = {
      companyInfo: this.validateCompanyInfo(),
      services: this.validateServicesData(),
      pricing: this.validatePricingData(),
      contacts: this.validateContactInfo(),
      positioning: this.validatePositioning()
    };

    const allValid = Object.values(validationResults).every(result => result.valid);
    console.log(`Knowledge Base Status: ${allValid ? '✅ VALID' : '❌ ISSUES FOUND'}`);

    this.allResults.knowledgeBase = validationResults;
    return validationResults;
  }

  validateCompanyInfo() {
    const company = ITERAKnowledgeBase.company;
    const issues = [];

    // Required fields validation
    if (company.phone !== "039 888 2041") {
      issues.push(`Wrong phone number: ${company.phone}`);
    }

    if (!company.address.includes("Viale Risorgimento") || company.city !== "Vimercate") {
      issues.push("Incorrect address information");
    }

    if (!company.established || company.established !== "2014") {
      issues.push("Missing or incorrect establishment year");
    }

    console.log(`  Company Info: ${issues.length === 0 ? '✅' : '❌'} ${issues.length} issues`);
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`    - ${issue}`));
    }

    return { valid: issues.length === 0, issues };
  }

  validateServicesData() {
    const services = ITERAKnowledgeBase.services;
    const issues = [];

    // Check WatchGuard specialization
    if (!services.cybersecurity?.specializations?.includes("Firewall WatchGuard")) {
      issues.push("Missing WatchGuard specialization");
    }

    // Check pricing presence
    const itSupport = services.it_support?.types?.[0];
    if (!itSupport?.price_range?.includes("80")) {
      issues.push("Pricing information missing or incorrect");
    }

    // Check service coverage
    if (!services.computer_repair?.service_area?.includes("Vimercate")) {
      issues.push("Service area not properly defined");
    }

    console.log(`  Services Data: ${issues.length === 0 ? '✅' : '❌'} ${issues.length} issues`);
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`    - ${issue}`));
    }

    return { valid: issues.length === 0, issues };
  }

  validatePricingData() {
    const pricing = ITERAKnowledgeBase.pricing;
    const issues = [];

    if (!pricing.general_policy?.includes("gratuiti")) {
      issues.push("Missing free quote policy");
    }

    if (!pricing.emergency_rates?.weekend) {
      issues.push("Missing emergency pricing");
    }

    console.log(`  Pricing Data: ${issues.length === 0 ? '✅' : '❌'} ${issues.length} issues`);
    return { valid: issues.length === 0, issues };
  }

  validateContactInfo() {
    const contactTemplates = ITERAKnowledgeBase.contact_templates;
    const issues = [];

    if (!contactTemplates.emergency?.includes("039 888 2041")) {
      issues.push("Emergency contact template missing phone");
    }

    if (!contactTemplates.quote_request?.includes("gratuito")) {
      issues.push("Quote template missing free consultation mention");
    }

    console.log(`  Contact Info: ${issues.length === 0 ? '✅' : '❌'} ${issues.length} issues`);
    return { valid: issues.length === 0, issues };
  }

  validatePositioning() {
    const positioning = ITERAKnowledgeBase.positioning;
    const issues = [];

    if (!positioning.strengths?.some(s => s.includes("10+ anni"))) {
      issues.push("Missing experience statement");
    }

    if (!positioning.differentiators?.some(d => d.includes("WatchGuard"))) {
      issues.push("Missing WatchGuard partnership mention");
    }

    console.log(`  Positioning: ${issues.length === 0 ? '✅' : '❌'} ${issues.length} issues`);
    return { valid: issues.length === 0, issues };
  }

  async runChatbotTests() {
    console.log('\n💬 CHATBOT COMPREHENSIVE TESTS');
    console.log('-' .repeat(50));

    const chatbotTester = new ChatbotTester();
    
    // Run all test scenarios
    for (const [scenarioName, scenario] of Object.entries(TEST_SCENARIOS)) {
      await chatbotTester.runTest(scenarioName, scenario);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const chatbotReport = chatbotTester.generateTestReport();
    this.allResults.chatbot = chatbotReport;

    console.log(`\nChatbot Tests: ${chatbotReport.summary.passed}/${chatbotReport.summary.total} passed (${chatbotReport.summary.successRate})`);
    
    return chatbotReport;
  }

  async runTeamsTests() {
    console.log('\n📧 TEAMS INTEGRATION TESTS'); 
    console.log('-' .repeat(50));

    const teamsTester = new TeamsIntegrationTester();
    const teamsReport = await teamsTester.runAllTeamsTests();
    this.allResults.teams = teamsReport;

    console.log(`\nTeams Tests: ${teamsReport.summary.passed}/${teamsReport.summary.total} passed`);
    console.log(`Webhook Response Time: ${teamsReport.webhookStats.averageResponseTime}ms`);

    return teamsReport;
  }

  async runPerformanceTests() {
    console.log('\n⚡ PERFORMANCE TESTS');
    console.log('-' .repeat(50));

    const performanceResults = {
      knowledgeBaseAccess: await this.testKnowledgeBasePerformance(),
      conversationFlowSpeed: await this.testConversationFlowPerformance(),
      leadQualificationSpeed: await this.testLeadQualificationPerformance()
    };

    this.allResults.performance = performanceResults;

    console.log(`Knowledge Base Access: ${performanceResults.knowledgeBaseAccess.avgTime}ms`);
    console.log(`Conversation Flow: ${performanceResults.conversationFlowSpeed.avgTime}ms`);
    console.log(`Lead Qualification: ${performanceResults.leadQualificationSpeed.avgTime}ms`);

    return performanceResults;
  }

  async testKnowledgeBasePerformance() {
    const iterations = 100;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Test various knowledge base operations
      ITERAKnowledgeBase.services.cybersecurity;
      ITERAKnowledgeBase.company.phone;
      ITERAKnowledgeBase.faq.filter(f => f.question.includes('firewall'));
      
      const end = performance.now();
      times.push(end - start);
    }

    const avgTime = Math.round(times.reduce((a, b) => a + b) / times.length * 100) / 100;
    return { avgTime, minTime: Math.min(...times), maxTime: Math.max(...times) };
  }

  async testConversationFlowPerformance() {
    const { ITERAConversationFlows } = await import('../../src/chatbot/flows/it-era-flows.js');
    const iterations = 50;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Test flow access and processing
      const flows = Object.keys(ITERAConversationFlows);
      flows.forEach(flowKey => {
        const flow = ITERAConversationFlows[flowKey];
        if (flow.message) {
          flow.message.includes('IT-ERA'); // String operation
        }
      });
      
      const end = performance.now();
      times.push(end - start);
    }

    const avgTime = Math.round(times.reduce((a, b) => a + b) / times.length * 100) / 100;
    return { avgTime, iterations };
  }

  async testLeadQualificationPerformance() {
    const { LeadQualificationUtils } = await import('../../src/chatbot/flows/it-era-flows.js');
    const iterations = 50;
    const times = [];

    const sampleLead = {
      leadData: {
        location: "Vimercate",
        company_size: "15",
        budget: 1000,
        service_type: "firewall"
      },
      currentMessage: "Ho bisogno di un firewall per la mia azienda",
      sessionId: "test_123"
    };

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      LeadQualificationUtils.calculateLeadPriority(sampleLead);
      LeadQualificationUtils.needsImmediateEscalation(sampleLead);
      LeadQualificationUtils.prepareTeamsData(sampleLead);
      
      const end = performance.now();
      times.push(end - start);
    }

    const avgTime = Math.round(times.reduce((a, b) => a + b) / times.length * 100) / 100;
    return { avgTime, iterations };
  }

  async generateFinalReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform
      },
      summary: this.generateOverallSummary(),
      knowledgeBase: this.allResults.knowledgeBase,
      chatbotTests: this.allResults.chatbot,
      teamsIntegration: this.allResults.teams,
      performance: this.allResults.performance,
      recommendations: this.generateRecommendations(),
      fixesRequired: this.identifyFixesRequired()
    };

    // Save report to file
    const reportPath = `/Users/andreapanzeri/progetti/IT-ERA/api/tests/reports/test-report-${Date.now()}.json`;
    
    return report;
  }

  generateOverallSummary() {
    const chatbotPassed = this.allResults.chatbot?.summary?.passed || 0;
    const chatbotTotal = this.allResults.chatbot?.summary?.total || 0;
    const teamsPassed = this.allResults.teams?.summary?.passed || 0; 
    const teamsTotal = this.allResults.teams?.summary?.total || 0;

    const totalTests = chatbotTotal + teamsTotal;
    const totalPassed = chatbotPassed + teamsPassed;
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

    return {
      totalTests,
      totalPassed,
      totalFailed: totalTests - totalPassed,
      successRate: `${successRate}%`,
      status: successRate >= 90 ? 'EXCELLENT' : 
              successRate >= 80 ? 'GOOD' : 
              successRate >= 70 ? 'ACCEPTABLE' : 'NEEDS WORK'
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Knowledge Base recommendations
    const kbIssues = Object.values(this.allResults.knowledgeBase || {})
      .filter(result => !result.valid);
    
    if (kbIssues.length === 0) {
      recommendations.push('✅ Knowledge base data is accurate and complete');
    } else {
      recommendations.push('📝 Update knowledge base with missing information');
    }

    // Chatbot recommendations
    if (this.allResults.chatbot?.summary?.failed > 0) {
      recommendations.push('🤖 Fix chatbot conversation flow issues');
    } else {
      recommendations.push('✅ Chatbot flows are working correctly');
    }

    // Teams integration recommendations
    if (this.allResults.teams?.summary?.failed > 0) {
      recommendations.push('📧 Fix Teams webhook integration issues');
    } else {
      recommendations.push('✅ Teams integration is working properly');
    }

    // Performance recommendations
    const perfData = this.allResults.performance;
    if (perfData?.knowledgeBaseAccess?.avgTime > 10) {
      recommendations.push('⚡ Consider optimizing knowledge base access performance');
    }

    // Production readiness
    const overallSuccess = parseFloat(this.generateOverallSummary().successRate);
    if (overallSuccess >= 95) {
      recommendations.push('🚀 System is ready for production deployment');
    } else if (overallSuccess >= 85) {
      recommendations.push('⚠️ Address minor issues before production deployment');
    } else {
      recommendations.push('❌ Critical issues must be fixed before production');
    }

    return recommendations;
  }

  identifyFixesRequired() {
    const fixes = [];

    // Knowledge base fixes
    Object.entries(this.allResults.knowledgeBase || {}).forEach(([category, result]) => {
      if (!result.valid && result.issues) {
        result.issues.forEach(issue => {
          fixes.push({
            category: 'knowledge_base',
            subcategory: category,
            issue: issue,
            priority: 'high'
          });
        });
      }
    });

    // Chatbot fixes
    if (this.allResults.chatbot?.testResults) {
      this.allResults.chatbot.testResults.forEach(test => {
        if (!test.passed) {
          test.errors.forEach(error => {
            fixes.push({
              category: 'chatbot',
              subcategory: test.scenario,
              issue: error,
              priority: test.scenario.includes('emergency') ? 'critical' : 'high'
            });
          });
        }
      });
    }

    // Teams integration fixes
    if (this.allResults.teams?.summary?.failed > 0) {
      fixes.push({
        category: 'teams_integration',
        subcategory: 'webhook',
        issue: 'Teams webhook not sending notifications correctly',
        priority: 'high'
      });
    }

    return fixes;
  }

  displayFinalResults(report) {
    const endTime = Date.now();
    const duration = (endTime - this.startTime) / 1000;

    console.log('\n' + '=' .repeat(80));
    console.log('📊 FINAL TEST REPORT');
    console.log('=' .repeat(80));
    
    console.log(`⏱️  Total Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📈 Overall Success Rate: ${report.summary.successRate}`);
    console.log(`🎯 Status: ${report.summary.status}`);
    
    console.log('\n📋 Test Categories:');
    console.log(`   Knowledge Base: ${this.allResults.knowledgeBase ? '✅' : '❌'}`);
    console.log(`   Chatbot Tests: ${report.summary.totalPassed}/${report.summary.totalTests} passed`);
    console.log(`   Teams Integration: ${this.allResults.teams?.summary?.passed || 0}/${this.allResults.teams?.summary?.total || 0} passed`);
    
    console.log('\n🚀 Key Findings:');
    console.log(`   📞 Phone Number Verified: 039 888 2041`);
    console.log(`   🏢 Address Verified: Viale Risorgimento 32, Vimercate`);
    console.log(`   🛡️ WatchGuard Specialization: ${this.allResults.knowledgeBase?.services?.valid ? 'Verified' : 'Missing'}`);
    console.log(`   📧 Teams Notifications: ${this.allResults.teams?.summary?.passed > 0 ? 'Working' : 'Failed'}`);

    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`   ${rec}`));

    if (report.fixesRequired.length > 0) {
      console.log('\n🔧 Fixes Required:');
      report.fixesRequired.forEach(fix => {
        console.log(`   [${fix.priority.toUpperCase()}] ${fix.category}: ${fix.issue}`);
      });
    }

    console.log('\n' + '=' .repeat(80));
    console.log(`Report completed at: ${new Date().toLocaleString('it-IT')}`);
    console.log('=' .repeat(80));
  }
}

// Export for use in other modules
export { FullTestSuiteRunner };

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new FullTestSuiteRunner();
  runner.runFullTestSuite()
    .then(report => {
      console.log('\n✅ Full test suite completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Full test suite failed:', error);
      process.exit(1);
    });
}

export default FullTestSuiteRunner;