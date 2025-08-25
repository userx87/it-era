/**
 * IT-ERA Chatbot Technical Assessment
 * Simulating Ing. Roberto Ferrari - CTO of TechInnovate SPA
 * Testing technical competence and enterprise readiness
 */

class CTOTechnicalTest {
  constructor() {
    this.profile = {
      name: "Ing. Roberto Ferrari",
      company: "TechInnovate SPA",
      employees: 50,
      location: "Milano",
      budget: "€50,000+",
      expertise: "Kubernetes, Docker, CI/CD, Cloud Architecture",
      personality: "Highly technical, tests knowledge depth, uses Italian technical jargon"
    };
    
    this.testScenarios = [];
    this.results = [];
    this.chatbotEndpoint = 'https://it-era-chatbot.bulltech.workers.dev/api/chat';
  }

  /**
   * Phase 1: Initial Technical Greeting and Credibility Test
   */
  async testInitialCredibility() {
    const scenarios = [
      {
        id: "greeting_technical",
        message: "Buonasera, sono Ing. Roberto Ferrari, CTO di TechInnovate SPA a Milano. Gestisco un'infrastruttura con 50+ dipendenti e sto valutando una migrazione verso Kubernetes. Prima di procedere, vorrei capire il vostro livello di competenza tecnica. Che esperienza avete con container orchestration e microservizi?",
        expectedElements: [
          "Riconoscimento del livello tecnico",
          "Menzione di competenze K8s/Docker",
          "Approccio professionale enterprise",
          "Domande di approfondimento"
        ],
        difficulty: "medium",
        category: "credibility_check"
      },
      {
        id: "quick_technical_filter",
        message: "Avete esperienza con Helm charts e gestione dei secrets in ambiente Kubernetes? E con CI/CD usando GitLab CI o Jenkins?",
        expectedElements: [
          "Conoscenza specifica di Helm",
          "Gestione sicura dei secrets",
          "CI/CD pipeline experience",
          "Best practices mention"
        ],
        difficulty: "high",
        category: "technical_depth"
      }
    ];

    return await this.executeTestScenarios(scenarios, "Initial Credibility");
  }

  /**
   * Phase 2: Deep Technical Architecture Questions
   */
  async testArchitecturalKnowledge() {
    const scenarios = [
      {
        id: "k8s_architecture",
        message: "La nostra architettura attuale è basata su VM tradizionali. Stiamo considerando un approccio ibrido con K8s on-premises e cloud. Che strategia consigliereste per gestire service mesh, ingress controller e storage persistente? Avete esperienza con Istio o Linkerd?",
        expectedElements: [
          "Service mesh comparison",
          "Ingress controller options (nginx, traefik)",
          "Persistent storage solutions",
          "Hybrid cloud strategies",
          "Migration planning"
        ],
        difficulty: "very_high",
        category: "architecture"
      },
      {
        id: "security_compliance",
        message: "Essendo nel settore finanziario, dobbiamo rispettare GDPR e PCI-DSS. Come gestite la sicurezza in Kubernetes? Quali sono le vostre best practices per network policies, RBAC e audit logging?",
        expectedElements: [
          "Compliance understanding",
          "K8s security features",
          "Network policies expertise",
          "RBAC implementation",
          "Audit mechanisms"
        ],
        difficulty: "very_high",
        category: "security"
      },
      {
        id: "performance_monitoring",
        message: "Attualmente usiamo Prometheus + Grafana per monitoring. In ambiente containerizzato, che approccio consigliate per observability? Jaeger per tracing, Fluentd per logging? E per l'autoscaling basato su metriche custom?",
        expectedElements: [
          "Observability stack knowledge",
          "Tracing solutions comparison",
          "Logging aggregation",
          "Custom metrics HPA",
          "Performance optimization"
        ],
        difficulty: "very_high",
        category: "monitoring"
      }
    ];

    return await this.executeTestScenarios(scenarios, "Architectural Knowledge");
  }

  /**
   * Phase 3: Edge Cases and Problem-Solving
   */
  async testProblemSolving() {
    const scenarios = [
      {
        id: "disaster_recovery",
        message: "Scenario critico: abbiamo un cluster K8s multi-zone che sta subendo un'interruzione su due zone su tre. I nostri servizi critici sono configurati con anti-affinity rules. Come gestireste questa situazione per garantire business continuity? E che backup strategy consigliate per etcd?",
        expectedElements: [
          "Multi-zone failure handling",
          "Anti-affinity understanding",
          "Business continuity planning",
          "etcd backup strategies",
          "Emergency procedures"
        ],
        difficulty: "extreme",
        category: "crisis_management"
      },
      {
        id: "resource_optimization",
        message: "Il nostro cluster sta consumando più risorse del previsto. Sospettiamo memory leaks in alcuni microservizi Java e problemi di resource limits. Che tooling usate per profiling e optimization? E come gestite JVM tuning in containers?",
        expectedElements: [
          "Memory profiling tools",
          "JVM container optimization",
          "Resource limits best practices",
          "Performance debugging",
          "Cost optimization strategies"
        ],
        difficulty: "very_high",
        category: "optimization"
      }
    ];

    return await this.executeTestScenarios(scenarios, "Problem Solving");
  }

  /**
   * Phase 4: Business and Commercial Evaluation
   */
  async testBusinessAcumen() {
    const scenarios = [
      {
        id: "cost_benefit_analysis",
        message: "Budget disponibile: €50k per la migrazione iniziale, poi €8k/mese per maintenance. Potete fornire un breakdown dettagliato dei costi? Include licensing (se necessario), training del team, downtime stimato e ROI timeline?",
        expectedElements: [
          "Detailed cost breakdown",
          "Training considerations",
          "Downtime estimation",
          "ROI analysis",
          "Long-term cost planning"
        ],
        difficulty: "high",
        category: "commercial"
      },
      {
        id: "timeline_planning",
        message: "Timeline critico: dobbiamo completare la migrazione entro Q2 2024. Abbiamo 3 team di sviluppo, 2 DevOps engineer e 1 system admin. È fattibile? Che approach consigliate: big-bang migration o strangler pattern?",
        expectedElements: [
          "Timeline assessment",
          "Resource evaluation",
          "Migration strategies",
          "Team training plan",
          "Risk mitigation"
        ],
        difficulty: "high",
        category: "project_management"
      }
    ];

    return await this.executeTestScenarios(scenarios, "Business Acumen");
  }

  /**
   * Phase 5: Stress Testing and Escalation
   */
  async testEscalationHandling() {
    const scenarios = [
      {
        id: "complex_scenario",
        message: "Scenario complesso: stiamo pianificando una migrazione da bare-metal a cloud ibrido (AWS + on-premises) con requisiti di latenza < 10ms per alcune applicazioni trading. Serve consulenza specialistica per network architecture, SD-WAN integration e real-time data synchronization. Quando possiamo avere un technical meeting con i vostri solution architects?",
        expectedElements: [
          "Recognition of complexity",
          "Escalation to specialists",
          "Meeting scheduling",
          "Technical expertise acknowledgment",
          "Enterprise-level handling"
        ],
        difficulty: "extreme",
        category: "escalation"
      },
      {
        id: "immediate_support",
        message: "URGENTE: abbiamo un issue critico in produzione. Uno dei nostri nodi K8s non risponde e i pods non si stanno reschedulando correttamente. Avete supporto 24/7? Possiamo avere assistenza immediata?",
        expectedElements: [
          "Emergency response",
          "24/7 support availability",
          "Immediate escalation",
          "Clear next steps",
          "Professional urgency handling"
        ],
        difficulty: "extreme",
        category: "emergency"
      }
    ];

    return await this.executeTestScenarios(scenarios, "Escalation Handling");
  }

  /**
   * Execute test scenarios and collect results
   */
  async executeTestScenarios(scenarios, phaseName) {
    console.log(`\n=== Testing Phase: ${phaseName} ===`);
    const phaseResults = [];

    for (const scenario of scenarios) {
      console.log(`\nTesting scenario: ${scenario.id}`);
      console.log(`Difficulty: ${scenario.difficulty}`);
      console.log(`Message: ${scenario.message.substring(0, 100)}...`);

      try {
        const result = await this.testChatbotResponse(scenario);
        phaseResults.push(result);
        
        // Simulate thinking time like a real CTO
        await this.delay(2000);
        
      } catch (error) {
        console.error(`Error testing scenario ${scenario.id}:`, error);
        phaseResults.push({
          ...scenario,
          response: null,
          score: 0,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    this.results.push({
      phase: phaseName,
      results: phaseResults,
      overallScore: this.calculatePhaseScore(phaseResults)
    });

    return phaseResults;
  }

  /**
   * Test individual chatbot response
   */
  async testChatbotResponse(scenario) {
    const startTime = Date.now();
    
    // Start conversation if needed
    if (!this.sessionId) {
      await this.initializeSession();
    }

    // Send technical message
    const response = await fetch(this.chatbotEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'message',
        message: scenario.message,
        sessionId: this.sessionId,
        leadData: {
          company_name: this.profile.company,
          sector: "Technology/Finance",
          budget_range: this.profile.budget,
          company_size: this.profile.employees,
          urgency: scenario.category === 'emergency' ? 'immediate' : 'high',
          technical_level: 'expert'
        }
      })
    });

    const result = await response.json();
    const responseTime = Date.now() - startTime;

    // Analyze response quality
    const analysis = this.analyzeResponse(result, scenario, responseTime);
    
    return {
      ...scenario,
      response: result,
      analysis: analysis,
      responseTime: responseTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Initialize chat session
   */
  async initializeSession() {
    try {
      const response = await fetch(this.chatbotEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'start',
          userAgent: 'IT-ERA-Technical-Assessment/1.0'
        })
      });

      const result = await response.json();
      if (result.success) {
        this.sessionId = result.sessionId;
        console.log(`Session initialized: ${this.sessionId}`);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  /**
   * Analyze chatbot response quality
   */
  analyzeResponse(result, scenario, responseTime) {
    const analysis = {
      scores: {},
      totalScore: 0,
      feedback: [],
      strengths: [],
      weaknesses: []
    };

    // Technical accuracy (30%)
    analysis.scores.technicalAccuracy = this.evaluateTechnicalAccuracy(result, scenario);
    
    // Professional communication (20%)
    analysis.scores.communication = this.evaluateCommunication(result, scenario);
    
    // Escalation handling (25%)
    analysis.scores.escalation = this.evaluateEscalation(result, scenario);
    
    // Response time (15%)
    analysis.scores.performance = this.evaluatePerformance(responseTime, scenario);
    
    // Completeness (10%)
    analysis.scores.completeness = this.evaluateCompleteness(result, scenario);

    // Calculate weighted total
    analysis.totalScore = (
      analysis.scores.technicalAccuracy * 0.30 +
      analysis.scores.communication * 0.20 +
      analysis.scores.escalation * 0.25 +
      analysis.scores.performance * 0.15 +
      analysis.scores.completeness * 0.10
    );

    // Generate feedback
    analysis.feedback = this.generateFeedback(analysis.scores, scenario);

    return analysis;
  }

  /**
   * Evaluate technical accuracy of response
   */
  evaluateTechnicalAccuracy(result, scenario) {
    if (!result.success || !result.response) return 0;
    
    const response = result.response.toLowerCase();
    const expectedElements = scenario.expectedElements || [];
    
    let score = 50; // Base score for responding
    let foundElements = 0;

    // Check for expected technical elements
    expectedElements.forEach(element => {
      const keywords = element.toLowerCase().split(' ');
      const found = keywords.some(keyword => response.includes(keyword));
      if (found) {
        foundElements++;
        score += (50 / expectedElements.length);
      }
    });

    // Bonus for technical depth
    const technicalIndicators = [
      'kubernetes', 'k8s', 'docker', 'container', 'microservizi',
      'helm', 'istio', 'prometheus', 'grafana', 'ci/cd',
      'devops', 'cloud', 'infrastructure', 'security'
    ];
    
    const techMentions = technicalIndicators.filter(term => response.includes(term)).length;
    if (techMentions >= 3) score += 10;
    if (techMentions >= 5) score += 10;

    return Math.min(100, score);
  }

  /**
   * Evaluate professional communication
   */
  evaluateCommunication(result, scenario) {
    if (!result.success || !result.response) return 0;
    
    const response = result.response;
    let score = 50;

    // Check for professional tone
    if (response.includes('[IT-ERA]') || response.includes('IT-ERA')) score += 15;
    if (response.length > 100) score += 10; // Detailed response
    if (response.includes('?')) score += 10; // Asks clarifying questions
    if (response.includes('esperienza') || response.includes('competenza')) score += 15;

    return Math.min(100, score);
  }

  /**
   * Evaluate escalation handling
   */
  evaluateEscalation(result, scenario) {
    if (!result.success) return 0;
    
    let score = 50;
    
    if (scenario.category === 'escalation' || scenario.category === 'emergency') {
      if (result.escalate) score += 30;
      if (result.priority === 'high' || result.priority === 'immediate') score += 20;
    }
    
    if (scenario.difficulty === 'extreme' || scenario.difficulty === 'very_high') {
      if (result.escalate || result.response.includes('specialist')) score += 25;
    }

    return Math.min(100, score);
  }

  /**
   * Evaluate response performance
   */
  evaluatePerformance(responseTime, scenario) {
    if (responseTime < 1000) return 100;
    if (responseTime < 2000) return 90;
    if (responseTime < 3000) return 80;
    if (responseTime < 5000) return 70;
    return 50;
  }

  /**
   * Evaluate response completeness
   */
  evaluateCompleteness(result, scenario) {
    if (!result.success || !result.response) return 0;
    
    let score = 50;
    
    if (result.options && result.options.length > 0) score += 20;
    if (result.response.length > 200) score += 15;
    if (result.intent) score += 15;
    
    return Math.min(100, score);
  }

  /**
   * Generate detailed feedback
   */
  generateFeedback(scores, scenario) {
    const feedback = [];
    
    if (scores.technicalAccuracy < 70) {
      feedback.push("❌ Risposta tecnicamente insufficiente per un CTO esperto");
    } else if (scores.technicalAccuracy > 85) {
      feedback.push("✅ Buona competenza tecnica dimostrata");
    }
    
    if (scores.escalation < 60 && (scenario.difficulty === 'extreme' || scenario.category === 'emergency')) {
      feedback.push("❌ Gestione escalation inadeguata per scenario critico");
    }
    
    if (scores.communication > 80) {
      feedback.push("✅ Comunicazione professionale appropriata");
    }

    return feedback;
  }

  /**
   * Calculate phase score
   */
  calculatePhaseScore(results) {
    if (results.length === 0) return 0;
    return results.reduce((sum, result) => sum + (result.analysis?.totalScore || 0), 0) / results.length;
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const report = {
      testProfile: this.profile,
      executionTimestamp: new Date().toISOString(),
      phases: this.results,
      overallAssessment: this.calculateOverallAssessment(),
      recommendations: this.generateRecommendations(),
      technicalVerdict: this.generateTechnicalVerdict()
    };

    return report;
  }

  /**
   * Calculate overall assessment
   */
  calculateOverallAssessment() {
    if (this.results.length === 0) return { score: 0, grade: 'F' };
    
    const overallScore = this.results.reduce((sum, phase) => sum + phase.overallScore, 0) / this.results.length;
    
    let grade = 'F';
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';
    
    return { score: overallScore, grade };
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Analyze weak areas
    const avgScores = {
      technicalAccuracy: 0,
      communication: 0,
      escalation: 0,
      performance: 0,
      completeness: 0
    };
    
    let totalTests = 0;
    this.results.forEach(phase => {
      phase.results.forEach(result => {
        if (result.analysis && result.analysis.scores) {
          Object.keys(avgScores).forEach(key => {
            avgScores[key] += result.analysis.scores[key] || 0;
          });
          totalTests++;
        }
      });
    });
    
    Object.keys(avgScores).forEach(key => {
      avgScores[key] /= totalTests;
    });
    
    // Generate specific recommendations
    if (avgScores.technicalAccuracy < 70) {
      recommendations.push({
        priority: 'HIGH',
        area: 'Technical Knowledge',
        recommendation: 'Migliorare la knowledge base con contenuti tecnici specifici su Kubernetes, Docker, DevOps practices e cloud architecture'
      });
    }
    
    if (avgScores.escalation < 70) {
      recommendations.push({
        priority: 'HIGH',
        area: 'Escalation Logic',
        recommendation: 'Implementare regole di escalation più aggressive per scenari enterprise e utenti con profilo tecnico senior'
      });
    }
    
    if (avgScores.communication < 80) {
      recommendations.push({
        priority: 'MEDIUM',
        area: 'Communication',
        recommendation: 'Ottimizzare il tone of voice per comunicazione B2B enterprise e CTO-level interactions'
      });
    }

    return recommendations;
  }

  /**
   * Generate technical verdict from CTO perspective
   */
  generateTechnicalVerdict() {
    const overall = this.calculateOverallAssessment();
    
    let verdict = "";
    
    if (overall.score >= 85) {
      verdict = "APPROVATO: Il chatbot dimostra competenza tecnica adeguata per engagement enterprise. Raccomando di procedere con pilot project.";
    } else if (overall.score >= 70) {
      verdict = "CONDIZIONALMENTE APPROVATO: Competenza di base presente ma necessari miglioramenti per scenari enterprise complessi. Richiede training aggiuntivo prima del deployment.";
    } else if (overall.score >= 55) {
      verdict = "NON RACCOMANDATO: Competenza tecnica insufficiente per engagement enterprise. Necessaria revisione completa della knowledge base.";
    } else {
      verdict = "RESPINTO: Il sistema non soddisfa i requisiti minimi per supporto tecnico enterprise. Sconsiglio fortemente l'implementazione.";
    }
    
    return {
      score: overall.score,
      grade: overall.grade,
      verdict: verdict,
      ctoApproval: overall.score >= 70,
      readyForEnterprise: overall.score >= 85
    };
  }

  /**
   * Utility: delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run complete technical assessment
   */
  async runCompleteAssessment() {
    console.log("=".repeat(80));
    console.log("IT-ERA CHATBOT - TECHNICAL ASSESSMENT");
    console.log(`CTO: ${this.profile.name} - ${this.profile.company}`);
    console.log("=".repeat(80));

    try {
      // Phase 1: Initial credibility
      await this.testInitialCredibility();
      
      // Phase 2: Deep technical knowledge
      await this.testArchitecturalKnowledge();
      
      // Phase 3: Problem-solving
      await this.testProblemSolving();
      
      // Phase 4: Business acumen
      await this.testBusinessAcumen();
      
      // Phase 5: Escalation handling
      await this.testEscalationHandling();
      
      // Generate final report
      const report = this.generateReport();
      
      console.log("\n" + "=".repeat(80));
      console.log("ASSESSMENT COMPLETE");
      console.log("=".repeat(80));
      console.log(`Overall Score: ${report.overallAssessment.score.toFixed(1)}/100`);
      console.log(`Grade: ${report.overallAssessment.grade}`);
      console.log(`CTO Approval: ${report.technicalVerdict.ctoApproval ? 'YES' : 'NO'}`);
      console.log(`Enterprise Ready: ${report.technicalVerdict.readyForEnterprise ? 'YES' : 'NO'}`);
      console.log("\nVerdict:");
      console.log(report.technicalVerdict.verdict);
      
      return report;
      
    } catch (error) {
      console.error("Assessment failed:", error);
      return {
        error: error.message,
        status: 'FAILED',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CTOTechnicalTest;
}

// Browser usage
if (typeof window !== 'undefined') {
  window.CTOTechnicalTest = CTOTechnicalTest;
}