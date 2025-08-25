/**
 * IT-ERA Chatbot Test Scenarios Execution
 * Comprehensive testing of all conversation scenarios from Hive Mind analysis
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ChatbotTestScenarios {
  constructor() {
    this.apiEndpoint = 'https://it-era-chatbot.bulltech.workers.dev/api/chat';
    this.testResults = [];
    this.scenarios = this.getTestScenarios();
  }

  getTestScenarios() {
    return [
      {
        id: 'pmi_cybersecurity',
        name: 'PMI Manager Cybersecurity Urgent',
        persona: 'Marco Rossi - Manager PMI Monza',
        expectedScore: 95,
        messages: [
          "Ciao, sono Marco Rossi, manager di una PMI a Monza. Dopo un tentativo di ransomware la scorsa settimana, il mio CEO vuole implementare una soluzione di cybersecurity seria. Abbiamo 15 dipendenti, budget €10-15k, e dobbiamo agire entro questo mese.",
          "Perfetto, ci interessa molto WatchGuard. Avete esperienza specifica con ransomware protection?",
          "Ottimo, vorrei parlare con un vostro specialista. Quando possiamo fare una call?"
        ],
        expectedBehaviors: [
          'urgency_recognition',
          'watchguard_partnership_mention',
          'budget_acknowledgment',
          'specific_timeline',
          'escalation_within_3_messages'
        ],
        criticalFailures: [
          'no_urgency_response',
          'generic_cybersecurity_info',
          'delayed_escalation'
        ]
      },

      {
        id: 'medical_gdpr',
        name: 'Medical Clinic GDPR Compliance',
        persona: 'Dott.ssa Bianchi - Direttore Clinica',
        expectedScore: 92,
        messages: [
          "Buongiorno, sono la Dott.ssa Bianchi, direttore sanitario di una clinica privata a Vimercate. Devo implementare un sistema IT GDPR-compliant per 12 postazioni. Budget €25-30k. Quali soluzioni proponete per il settore sanitario?",
          "Interessante. Avete già lavorato con altre cliniche? Servono referenze.",
          "Perfetto, vorrei vedere un preventivo dettagliato."
        ],
        expectedBehaviors: [
          'gdpr_expertise_demonstrated',
          'healthcare_sector_recognition',
          'client_references_offered',
          'technical_security_details',
          'professional_medical_tone'
        ],
        criticalFailures: [
          'generic_gdpr_response',
          'no_healthcare_focus',
          'missing_compliance_details'
        ]
      },

      {
        id: 'commercialista_roi',
        name: 'Commercialista ROI Analysis',
        persona: 'Dott. Colombo - Commercialista Como',
        expectedScore: 75,
        messages: [
          "Salve, sono il Dott. Colombo, commercialista con studio a Como. 6 postazioni, vorrei passare al cloud ma devo giustificare l'investimento ai soci. Potete fornirmi un'analisi ROI dettagliata?",
          "Mi servono numeri precisi: quanto risparmio, in quanto tempo break-even?",
          "Interessante, ma vorrei vedere i calcoli dettagliati."
        ],
        expectedBehaviors: [
          'roi_calculator_activation',
          'specific_numbers_provided',
          'breakeven_timeline',
          'monthly_savings_calculation',
          'business_professional_tone'
        ],
        criticalFailures: [
          'no_roi_calculation',
          'generic_cost_info',
          'missing_specific_numbers'
        ]
      },

      {
        id: 'emergency_server_crash',
        name: 'Emergency Server Crash',
        persona: 'Andrea Verdi - IT Manager Bergamo',
        expectedScore: 68,
        messages: [
          "URGENTE! Andrea qui da Bergamo, il nostro server principale è down da 2 ore, produzione ferma, perdendo soldi ogni minuto. Serve intervento IMMEDIATO!",
          "Ho bisogno del vostro numero di emergenza SUBITO",
          "Quanto tempo ci mettete ad arrivare on-site?"
        ],
        expectedBehaviors: [
          'immediate_emergency_recognition',
          'phone_number_display',
          'eta_provided',
          'bypass_normal_flows',
          'urgent_escalation_tone'
        ],
        criticalFailures: [
          'delayed_emergency_response',
          'missing_phone_number',
          'normal_conversation_flow',
          'no_immediate_action'
        ]
      },

      {
        id: 'price_conscious_sme',
        name: 'Price-Conscious Small Business',
        persona: 'Silvia Martinelli - Piccola Azienda Como',
        expectedScore: 70,
        messages: [
          "Ciao, sono Silvia, ho una piccola azienda a Como. Mi servirerebbe un sito web ma i preventivi che ho ricevuto sono tutti sui €3-4k. Il mio budget è massimo €2k. Fate prezzi più competitivi?",
          "€2k è davvero il mio limite massimo. Cosa include esattamente?",
          "Interessante, possiamo vederci per parlarne?"
        ],
        expectedBehaviors: [
          'no_price_apologies',
          'value_demonstration',
          'entry_level_options',
          'local_presence_advantage',
          'friendly_professional_tone'
        ],
        criticalFailures: [
          'apologizing_for_pricing',
          'dismissing_budget',
          'no_value_proposition'
        ]
      },

      {
        id: 'technical_cto',
        name: 'Technical CTO Enterprise',
        persona: 'Ing. Ferrari - CTO Manifatturiero',
        expectedScore: 74,
        messages: [
          "Buongiorno, sono l'Ing. Ferrari, CTO di un'azienda manifatturiera. Stiamo valutando migration a Kubernetes per le nostre applicazioni. Avete expertise in container orchestration, service mesh, e GitOps workflows? Budget €50k+.",
          "Interessante. Che experience avete con Istio e ArgoCD?",
          "Vorrei fare una call tecnica con il vostro CTO. È possibile?"
        ],
        expectedBehaviors: [
          'technical_depth_demonstrated',
          'kubernetes_expertise_shown',
          'enterprise_solution_focus',
          'technical_escalation_offered',
          'professional_technical_tone'
        ],
        criticalFailures: [
          'insufficient_technical_depth',
          'generic_enterprise_response',
          'no_technical_escalation'
        ]
      }
    ];
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive Chatbot QA Testing...\n');
    
    const browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 }
    });

    try {
      for (const scenario of this.scenarios) {
        console.log(`\n🎯 Testing Scenario: ${scenario.name}`);
        console.log(`👤 Persona: ${scenario.persona}`);
        console.log(`📊 Expected Score: ${scenario.expectedScore}/100\n`);

        const result = await this.testScenario(browser, scenario);
        this.testResults.push(result);

        // Brief pause between scenarios
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      await this.generateReport();
      
    } finally {
      await browser.close();
    }
  }

  async testScenario(browser, scenario) {
    const page = await browser.newPage();
    const startTime = Date.now();
    
    try {
      // Navigate to a test page or directly test API
      const sessionId = await this.startChatSession();
      const conversationFlow = [];
      
      for (let i = 0; i < scenario.messages.length; i++) {
        const message = scenario.messages[i];
        console.log(`  💬 Sending: ${message.substring(0, 60)}...`);
        
        const response = await this.sendMessage(sessionId, message);
        const responseTime = Date.now();
        
        conversationFlow.push({
          userMessage: message,
          botResponse: response,
          timestamp: responseTime,
          messageIndex: i + 1
        });

        // Analyze response for expected behaviors
        const behaviorAnalysis = this.analyzeBehaviors(response, scenario.expectedBehaviors);
        const failureCheck = this.checkCriticalFailures(response, scenario.criticalFailures);
        
        console.log(`  ✅ Response received (${response.responseTime || 'N/A'}ms)`);
        
        // Brief pause between messages
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const testResult = this.evaluateScenario(scenario, conversationFlow);
      console.log(`  📊 Final Score: ${testResult.score}/100 (Expected: ${scenario.expectedScore})`);
      
      if (testResult.score >= scenario.expectedScore * 0.9) {
        console.log(`  ✅ PASS - Acceptable performance`);
      } else if (testResult.score >= scenario.expectedScore * 0.7) {
        console.log(`  ⚠️  PARTIAL - Needs improvement`);
      } else {
        console.log(`  ❌ FAIL - Critical issues identified`);
      }

      return testResult;

    } catch (error) {
      console.error(`  ❌ ERROR in scenario ${scenario.id}:`, error.message);
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        score: 0,
        status: 'ERROR',
        error: error.message,
        duration: Date.now() - startTime
      };
    } finally {
      await page.close();
    }
  }

  async startChatSession() {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      const result = await response.json();
      return result.sessionId || `test_${Date.now()}`;
    } catch (error) {
      console.warn('  ⚠️ Using fallback session ID');
      return `fallback_${Date.now()}`;
    }
  }

  async sendMessage(sessionId, message) {
    try {
      const startTime = Date.now();
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          message: message,
          sessionId: sessionId
        })
      });
      
      const result = await response.json();
      result.responseTime = Date.now() - startTime;
      
      return result;
      
    } catch (error) {
      console.error('    ❌ API Error:', error.message);
      return {
        success: false,
        error: error.message,
        response: '[ERROR] Could not get response from chatbot API'
      };
    }
  }

  analyzeBehaviors(response, expectedBehaviors) {
    const analysis = {
      detected: [],
      missing: [],
      score: 0
    };

    expectedBehaviors.forEach(behavior => {
      const detected = this.checkBehavior(response, behavior);
      
      if (detected) {
        analysis.detected.push(behavior);
      } else {
        analysis.missing.push(behavior);
      }
    });

    analysis.score = (analysis.detected.length / expectedBehaviors.length) * 100;
    return analysis;
  }

  checkBehavior(response, behavior) {
    const text = (response.response || '').toLowerCase();
    const options = (response.options || []).join(' ').toLowerCase();
    const fullResponse = `${text} ${options}`;

    const behaviorChecks = {
      urgency_recognition: () => 
        fullResponse.includes('urgente') || 
        fullResponse.includes('immediato') || 
        fullResponse.includes('subito') ||
        response.priority === 'high' ||
        response.escalate,

      watchguard_partnership: () =>
        fullResponse.includes('watchguard') ||
        fullResponse.includes('partner') ||
        fullResponse.includes('certificat'),

      budget_acknowledgment: () =>
        fullResponse.includes('€') ||
        fullResponse.includes('budget') ||
        fullResponse.includes('invest'),

      specific_timeline: () =>
        fullResponse.includes('ora') ||
        fullResponse.includes('giorn') ||
        fullResponse.includes('settiman') ||
        fullResponse.includes('mese'),

      escalation_within_3_messages: () =>
        response.escalate || 
        fullResponse.includes('specialist') ||
        fullResponse.includes('contatt') ||
        fullResponse.includes('call'),

      gdpr_expertise_demonstrated: () =>
        fullResponse.includes('gdpr') ||
        fullResponse.includes('privacy') ||
        fullResponse.includes('compliance') ||
        fullResponse.includes('sicurezza dati'),

      healthcare_sector_recognition: () =>
        fullResponse.includes('clinic') ||
        fullResponse.includes('sanitar') ||
        fullResponse.includes('medic') ||
        fullResponse.includes('pazient'),

      roi_calculator_activation: () =>
        fullResponse.includes('roi') ||
        fullResponse.includes('risparmio') ||
        fullResponse.includes('€') ||
        fullResponse.includes('%'),

      immediate_emergency_recognition: () =>
        response.emergency ||
        response.priority === 'immediate' ||
        fullResponse.includes('emergenza') ||
        fullResponse.includes('039 888 2041'),

      phone_number_display: () =>
        fullResponse.includes('039 888 2041') ||
        fullResponse.includes('telefon') ||
        fullResponse.includes('chiam'),

      technical_depth_demonstrated: () =>
        fullResponse.includes('kubernetes') ||
        fullResponse.includes('docker') ||
        fullResponse.includes('container') ||
        fullResponse.includes('gitops'),

      no_price_apologies: () =>
        !fullResponse.includes('scusa') &&
        !fullResponse.includes('dispiace') &&
        !fullResponse.includes('purtroppo'),

      value_demonstration: () =>
        fullResponse.includes('include') ||
        fullResponse.includes('valore') ||
        fullResponse.includes('comprende')
    };

    const checker = behaviorChecks[behavior];
    return checker ? checker() : false;
  }

  checkCriticalFailures(response, criticalFailures) {
    const failures = [];
    const text = (response.response || '').toLowerCase();

    criticalFailures.forEach(failure => {
      const detected = this.detectFailure(response, failure);
      if (detected) {
        failures.push(failure);
      }
    });

    return failures;
  }

  detectFailure(response, failure) {
    const text = (response.response || '').toLowerCase();
    
    const failureChecks = {
      no_urgency_response: () => 
        !response.escalate && 
        !text.includes('urgent') && 
        !text.includes('immediat'),

      generic_cybersecurity_info: () =>
        text.includes('sicurezza informatica') && 
        !text.includes('watchguard') && 
        !text.includes('ransomware'),

      delayed_escalation: () =>
        !response.escalate && 
        !text.includes('specialist'),

      no_roi_calculation: () =>
        !text.includes('€') && 
        !text.includes('%') && 
        !text.includes('risparmio'),

      missing_phone_number: () =>
        response.emergency && 
        !text.includes('039 888 2041')
    };

    const checker = failureChecks[failure];
    return checker ? checker() : false;
  }

  evaluateScenario(scenario, conversationFlow) {
    let totalScore = 0;
    let maxScore = 100;
    
    // Behavior analysis across all messages
    const allBehaviors = [];
    const allFailures = [];
    
    conversationFlow.forEach(exchange => {
      const behaviorAnalysis = this.analyzeBehaviors(exchange.botResponse, scenario.expectedBehaviors);
      const failureCheck = this.checkCriticalFailures(exchange.botResponse, scenario.criticalFailures);
      
      allBehaviors.push(behaviorAnalysis);
      allFailures.push(...failureCheck);
    });

    // Calculate behavior score (70% of total)
    const behaviorScore = this.calculateBehaviorScore(allBehaviors, scenario.expectedBehaviors);
    totalScore += behaviorScore * 0.7;

    // Calculate response quality score (20% of total)
    const qualityScore = this.calculateQualityScore(conversationFlow);
    totalScore += qualityScore * 0.2;

    // Calculate technical performance score (10% of total)
    const performanceScore = this.calculatePerformanceScore(conversationFlow);
    totalScore += performanceScore * 0.1;

    // Deduct points for critical failures
    const failurePenalty = allFailures.length * 15;
    totalScore = Math.max(0, totalScore - failurePenalty);

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      persona: scenario.persona,
      score: Math.round(totalScore),
      expectedScore: scenario.expectedScore,
      status: this.getStatus(totalScore, scenario.expectedScore),
      details: {
        behaviorScore: Math.round(behaviorScore),
        qualityScore: Math.round(qualityScore),
        performanceScore: Math.round(performanceScore),
        failurePenalty: failurePenalty,
        criticalFailures: allFailures,
        conversationFlow: conversationFlow.length,
        totalMessages: scenario.messages.length
      },
      recommendations: this.generateRecommendations(scenario, allBehaviors, allFailures)
    };
  }

  calculateBehaviorScore(behaviorAnalyses, expectedBehaviors) {
    const detectedBehaviors = new Set();
    
    behaviorAnalyses.forEach(analysis => {
      analysis.detected.forEach(behavior => {
        detectedBehaviors.add(behavior);
      });
    });

    return (detectedBehaviors.size / expectedBehaviors.length) * 100;
  }

  calculateQualityScore(conversationFlow) {
    let score = 100;
    
    conversationFlow.forEach(exchange => {
      const response = exchange.botResponse;
      
      // Check response exists and is meaningful
      if (!response.response || response.response.length < 20) {
        score -= 15;
      }
      
      // Check for IT-ERA branding
      if (!response.response.includes('IT-ERA')) {
        score -= 5;
      }
      
      // Check for professional tone (no excessive casualness)
      if (response.response.includes('ciao ciao') || response.response.includes('😊😊')) {
        score -= 10;
      }
      
      // Check for errors
      if (response.error) {
        score -= 20;
      }
    });

    return Math.max(0, score);
  }

  calculatePerformanceScore(conversationFlow) {
    let score = 100;
    
    conversationFlow.forEach(exchange => {
      const response = exchange.botResponse;
      
      // Check response time (target: <2s)
      if (response.responseTime > 3000) {
        score -= 20;
      } else if (response.responseTime > 2000) {
        score -= 10;
      }
      
      // Check for timeouts
      if (response.error && response.error.includes('timeout')) {
        score -= 30;
      }
      
      // Check API success
      if (!response.success) {
        score -= 25;
      }
    });

    return Math.max(0, score);
  }

  getStatus(score, expectedScore) {
    if (score >= expectedScore * 0.9) {
      return 'PASS';
    } else if (score >= expectedScore * 0.7) {
      return 'PARTIAL';
    } else {
      return 'FAIL';
    }
  }

  generateRecommendations(scenario, behaviorAnalyses, criticalFailures) {
    const recommendations = [];
    
    // Find consistently missing behaviors
    const missingBehaviors = new Set();
    behaviorAnalyses.forEach(analysis => {
      analysis.missing.forEach(behavior => {
        missingBehaviors.add(behavior);
      });
    });

    // Generate specific recommendations
    if (missingBehaviors.has('urgency_recognition')) {
      recommendations.push('Improve urgency detection keywords and response speed');
    }
    
    if (missingBehaviors.has('roi_calculator_activation')) {
      recommendations.push('Fix ROI calculator integration for financial queries');
    }
    
    if (missingBehaviors.has('phone_number_display')) {
      recommendations.push('Ensure phone number 039 888 2041 appears in emergency responses');
    }
    
    if (missingBehaviors.has('technical_depth_demonstrated')) {
      recommendations.push('Expand technical knowledge base for enterprise clients');
    }

    // Handle critical failures
    if (criticalFailures.includes('delayed_escalation')) {
      recommendations.push('Implement immediate escalation for high-priority scenarios');
    }
    
    if (criticalFailures.includes('missing_phone_number')) {
      recommendations.push('CRITICAL: Fix emergency phone number display');
    }

    return recommendations;
  }

  async generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, 'reports', `test-scenarios-report-${timestamp}.json`);
    
    const summary = {
      totalScenarios: this.testResults.length,
      passedScenarios: this.testResults.filter(r => r.status === 'PASS').length,
      partialScenarios: this.testResults.filter(r => r.status === 'PARTIAL').length,
      failedScenarios: this.testResults.filter(r => r.status === 'FAIL').length,
      overallScore: Math.round(this.testResults.reduce((sum, r) => sum + r.score, 0) / this.testResults.length),
      timestamp: new Date().toISOString()
    };

    const report = {
      summary,
      testResults: this.testResults,
      scenarioDetails: this.scenarios,
      recommendations: this.generateOverallRecommendations()
    };

    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log('\n📊 TEST SUMMARY');
      console.log('================');
      console.log(`Total Scenarios: ${summary.totalScenarios}`);
      console.log(`✅ Passed: ${summary.passedScenarios}`);
      console.log(`⚠️  Partial: ${summary.partialScenarios}`);
      console.log(`❌ Failed: ${summary.failedScenarios}`);
      console.log(`📊 Overall Score: ${summary.overallScore}/100`);
      console.log(`📄 Report saved: ${reportPath}`);

      // Generate readable markdown report
      await this.generateMarkdownReport(report, timestamp);
      
    } catch (error) {
      console.error('Error generating report:', error);
    }
  }

  generateOverallRecommendations() {
    const allRecommendations = [];
    const failedScenarios = this.testResults.filter(r => r.status === 'FAIL');
    const criticalIssues = [];

    this.testResults.forEach(result => {
      if (result.recommendations) {
        allRecommendations.push(...result.recommendations);
      }
      
      if (result.details && result.details.criticalFailures.length > 0) {
        criticalIssues.push(...result.details.criticalFailures);
      }
    });

    // Group recommendations by frequency
    const recommendationCounts = {};
    allRecommendations.forEach(rec => {
      recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
    });

    // Sort by frequency
    const prioritizedRecommendations = Object.entries(recommendationCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([rec, count]) => ({ recommendation: rec, frequency: count }));

    return {
      critical: criticalIssues,
      prioritized: prioritizedRecommendations,
      failedScenariosCount: failedScenarios.length,
      totalIssues: allRecommendations.length
    };
  }

  async generateMarkdownReport(report, timestamp) {
    const markdownPath = path.join(__dirname, 'reports', `test-scenarios-report-${timestamp}.md`);
    
    let markdown = `# IT-ERA Chatbot Test Scenarios Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
    markdown += `**Overall Score:** ${report.summary.overallScore}/100\n\n`;
    
    markdown += `## Summary\n\n`;
    markdown += `- **Total Scenarios:** ${report.summary.totalScenarios}\n`;
    markdown += `- **✅ Passed:** ${report.summary.passedScenarios}\n`;
    markdown += `- **⚠️ Partial:** ${report.summary.partialScenarios}\n`;
    markdown += `- **❌ Failed:** ${report.summary.failedScenarios}\n\n`;
    
    markdown += `## Detailed Results\n\n`;
    
    this.testResults.forEach(result => {
      const emoji = result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌';
      
      markdown += `### ${emoji} ${result.scenarioName}\n`;
      markdown += `**Persona:** ${result.persona}\n`;
      markdown += `**Score:** ${result.score}/${result.expectedScore} (${result.status})\n\n`;
      
      if (result.recommendations && result.recommendations.length > 0) {
        markdown += `**Recommendations:**\n`;
        result.recommendations.forEach(rec => {
          markdown += `- ${rec}\n`;
        });
        markdown += `\n`;
      }
    });
    
    markdown += `## Priority Recommendations\n\n`;
    
    if (report.recommendations.prioritized.length > 0) {
      report.recommendations.prioritized.slice(0, 5).forEach(item => {
        markdown += `- **[${item.frequency}x]** ${item.recommendation}\n`;
      });
    }
    
    try {
      await fs.writeFile(markdownPath, markdown);
      console.log(`📄 Markdown report saved: ${markdownPath}`);
    } catch (error) {
      console.error('Error generating markdown report:', error);
    }
  }
}

// Execute tests if run directly
if (require.main === module) {
  const tester = new ChatbotTestScenarios();
  
  tester.runAllTests().then(() => {
    console.log('\n✅ All tests completed!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = ChatbotTestScenarios;