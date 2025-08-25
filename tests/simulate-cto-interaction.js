/**
 * Live CTO Simulation - Interactive Testing
 * Simulates real-time interaction between Ing. Roberto Ferrari and IT-ERA Chatbot
 */

const readline = require('readline');
const fetch = require('node-fetch');

class LiveCTOSimulation {
  constructor() {
    this.profile = {
      name: "Ing. Roberto Ferrari",
      company: "TechInnovate SPA", 
      role: "CTO",
      location: "Milano",
      employees: 50,
      budget: "€50,000+"
    };

    this.sessionId = null;
    this.chatbotEndpoint = 'https://it-era-chatbot.bulltech.workers.dev/api/chat';
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.conversationLog = [];
    this.technicalScore = 0;
    this.responseCount = 0;
  }

  /**
   * Start interactive CTO simulation
   */
  async startSimulation() {
    console.log("=".repeat(80));
    console.log("🎯 IT-ERA CHATBOT - SIMULAZIONE CTO INTERATTIVA");
    console.log("=".repeat(80));
    console.log(`👤 Profilo: ${this.profile.name}, ${this.profile.role} di ${this.profile.company}`);
    console.log(`🏢 Scenario: Valutazione chatbot per migrazione Kubernetes (${this.profile.employees} dipendenti)`);
    console.log(`💰 Budget: ${this.profile.budget}`);
    console.log("=".repeat(80));

    console.log("\n🤖 Inizializzo sessione chatbot...");
    await this.initializeSession();

    console.log("\n📝 ISTRUZIONI:");
    console.log("- Scrivi messaggi come faresti da CTO tecnico");
    console.log("- Usa terminologia Kubernetes, Docker, DevOps");
    console.log("- Testa la competenza tecnica del chatbot");
    console.log("- Digita 'quit' per terminare e vedere il report");
    console.log("- Digita 'score' per vedere il punteggio corrente");
    console.log("- Digita 'suggest' per suggerimenti di test");

    await this.startInteractiveConversation();
  }

  /**
   * Initialize chatbot session
   */
  async initializeSession() {
    try {
      const response = await fetch(this.chatbotEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          userAgent: 'CTO-Simulation/1.0'
        })
      });

      const result = await response.json();
      if (result.success) {
        this.sessionId = result.sessionId;
        console.log(`✅ Sessione inizializzata: ${this.sessionId}`);
        
        // Show initial chatbot greeting
        console.log("\n🤖 CHATBOT:");
        console.log(result.response);
        if (result.options) {
          console.log("Opzioni:", result.options.join(" | "));
        }
        
        this.logInteraction('bot', result.response, result);
      } else {
        throw new Error('Failed to initialize session');
      }
    } catch (error) {
      console.error("❌ Errore inizializzazione:", error.message);
      process.exit(1);
    }
  }

  /**
   * Start interactive conversation loop
   */
  async startInteractiveConversation() {
    console.log("\n" + "-".repeat(60));
    console.log("💬 CONVERSAZIONE INTERATTIVA INIZIATA");
    console.log("-".repeat(60));

    return new Promise((resolve) => {
      const askQuestion = () => {
        this.rl.question('\n👤 CTO> ', async (input) => {
          const message = input.trim();

          // Handle special commands
          if (message.toLowerCase() === 'quit') {
            await this.endSimulation();
            resolve();
            return;
          }

          if (message.toLowerCase() === 'score') {
            this.showCurrentScore();
            askQuestion();
            return;
          }

          if (message.toLowerCase() === 'suggest') {
            this.showTestSuggestions();
            askQuestion();
            return;
          }

          if (message === '') {
            console.log("⚠️ Inserisci un messaggio o 'quit' per terminare");
            askQuestion();
            return;
          }

          // Send message to chatbot
          await this.sendMessage(message);
          askQuestion();
        });
      };

      askQuestion();
    });
  }

  /**
   * Send message to chatbot and process response
   */
  async sendMessage(message) {
    console.log("\n⏳ Invio messaggio al chatbot...");
    
    const startTime = Date.now();
    this.logInteraction('user', message);

    try {
      const response = await fetch(this.chatbotEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          message: message,
          sessionId: this.sessionId,
          leadData: {
            company_name: this.profile.company,
            sector: "Technology",
            budget_range: this.profile.budget,
            company_size: this.profile.employees,
            urgency: 'high',
            technical_level: 'expert'
          }
        })
      });

      const result = await response.json();
      const responseTime = Date.now() - startTime;

      if (result.success) {
        // Display response
        console.log("\n🤖 CHATBOT:");
        console.log(result.response);
        
        if (result.options && result.options.length > 0) {
          console.log("\n📋 Opzioni disponibili:");
          result.options.forEach((option, index) => {
            console.log(`  ${index + 1}. ${option}`);
          });
        }

        // Show technical indicators
        this.showTechnicalIndicators(result, responseTime);
        
        // Update technical score
        this.updateTechnicalScore(message, result, responseTime);
        
        this.logInteraction('bot', result.response, result);

      } else {
        console.log("❌ Errore chatbot:", result.error || 'Unknown error');
      }

    } catch (error) {
      console.error("❌ Errore comunicazione:", error.message);
    }
  }

  /**
   * Show technical indicators for response
   */
  showTechnicalIndicators(result, responseTime) {
    const indicators = [];
    
    if (result.aiPowered) indicators.push("🤖 AI");
    if (result.cached) indicators.push("⚡ Cached");
    if (result.escalate) indicators.push("🚨 Escalation");
    if (responseTime < 1000) indicators.push("⚡ Fast");
    else if (responseTime > 3000) indicators.push("🐌 Slow");

    if (indicators.length > 0) {
      console.log(`\n📊 Indicatori: ${indicators.join(" | ")} | ⏱️ ${responseTime}ms`);
    }

    // Technical depth analysis
    const technicalTerms = this.countTechnicalTerms(result.response);
    if (technicalTerms > 0) {
      console.log(`🔧 Termini tecnici rilevati: ${technicalTerms}`);
    }
  }

  /**
   * Update technical competence score
   */
  updateTechnicalScore(userMessage, botResponse, responseTime) {
    this.responseCount++;
    
    let scoreIncrement = 0;
    
    // User message complexity
    const userTechTerms = this.countTechnicalTerms(userMessage);
    const userComplexity = userTechTerms >= 3 ? 'high' : userTechTerms >= 1 ? 'medium' : 'low';
    
    // Bot response analysis
    const botTechTerms = this.countTechnicalTerms(botResponse.response);
    const responseLength = botResponse.response.length;
    
    // Scoring algorithm
    if (userComplexity === 'high') {
      if (botTechTerms >= 2 && responseLength > 100) scoreIncrement = 15;
      else if (botTechTerms >= 1) scoreIncrement = 8;
      else scoreIncrement = -5; // Penalty for non-technical response to technical question
    } else if (userComplexity === 'medium') {
      if (botTechTerms >= 1) scoreIncrement = 10;
      else scoreIncrement = 5;
    } else {
      scoreIncrement = 5; // Base score
    }
    
    // Performance bonus/penalty
    if (responseTime < 1000) scoreIncrement += 2;
    else if (responseTime > 3000) scoreIncrement -= 2;
    
    // Escalation bonus for complex queries
    if (botResponse.escalate && userComplexity === 'high') scoreIncrement += 5;
    
    // AI usage bonus for technical queries
    if (botResponse.aiPowered && userTechTerms >= 2) scoreIncrement += 3;
    
    this.technicalScore += scoreIncrement;
    
    // Prevent negative scores
    if (this.technicalScore < 0) this.technicalScore = 0;
  }

  /**
   * Count technical terms in text
   */
  countTechnicalTerms(text) {
    const technicalTerms = [
      'kubernetes', 'k8s', 'docker', 'container', 'microservizi', 'microservices',
      'helm', 'istio', 'linkerd', 'prometheus', 'grafana', 'jaeger',
      'ci/cd', 'jenkins', 'gitlab', 'devops', 'terraform', 'ansible',
      'cloud', 'aws', 'azure', 'gcp', 'hybrid', 'on-premises',
      'rbac', 'network policy', 'ingress', 'service mesh', 'etcd',
      'compliance', 'gdpr', 'pci-dss', 'security', 'audit',
      'monitoring', 'observability', 'logging', 'tracing',
      'autoscaling', 'hpa', 'cluster', 'node', 'pod',
      'persistent volume', 'storage', 'backup', 'disaster recovery'
    ];
    
    const lowerText = text.toLowerCase();
    return technicalTerms.filter(term => lowerText.includes(term)).length;
  }

  /**
   * Show current technical score
   */
  showCurrentScore() {
    const avgScore = this.responseCount > 0 ? (this.technicalScore / this.responseCount).toFixed(1) : 0;
    
    console.log("\n📊 PUNTEGGIO TECNICO CORRENTE:");
    console.log(`Total Score: ${this.technicalScore} punti`);
    console.log(`Messaggi scambiati: ${this.responseCount}`);
    console.log(`Score medio: ${avgScore}/messaggio`);
    
    let evaluation = "";
    if (avgScore >= 12) evaluation = "🟢 ECCELLENTE - Competenza enterprise";
    else if (avgScore >= 8) evaluation = "🟡 BUONO - Competenza adeguata";
    else if (avgScore >= 5) evaluation = "🟠 SUFFICIENTE - Migliorabile";
    else evaluation = "🔴 INSUFFICIENTE - Non adatto enterprise";
    
    console.log(`Valutazione: ${evaluation}`);
  }

  /**
   * Show test suggestions for CTO
   */
  showTestSuggestions() {
    const suggestions = [
      "🔧 'Che esperienza avete con Kubernetes service mesh e Istio?'",
      "☁️ 'Come gestite la migrazione da VM a container per un'architettura ibrida?'",
      "🔒 'Quali best practices seguite per RBAC e network policies in K8s?'",
      "📊 'Che stack di monitoring consigliate: Prometheus/Grafana vs alternatives?'",
      "🚨 'Scenario critico: cluster K8s con failure su 2 zone su 3, come procedete?'",
      "💰 'Budget €50k per migrazione K8s: potete fare un breakdown dettagliato?'",
      "⏰ 'Timeline Q2 2024 per completare migrazione: è fattibile?'",
      "🆘 'URGENTE: nodo K8s non risponde, pods non si reschedulano. Supporto 24/7?'"
    ];

    console.log("\n💡 SUGGERIMENTI DI TEST TECNICI:");
    suggestions.forEach(suggestion => console.log(`  ${suggestion}`));
    console.log("\nCopia e incolla uno dei suggerimenti o scrivi la tua domanda tecnica.");
  }

  /**
   * Log interaction for final report
   */
  logInteraction(sender, message, result = null) {
    this.conversationLog.push({
      timestamp: new Date().toISOString(),
      sender: sender,
      message: message,
      result: result,
      technicalTerms: this.countTechnicalTerms(message)
    });
  }

  /**
   * End simulation and generate report
   */
  async endSimulation() {
    console.log("\n" + "=".repeat(80));
    console.log("📋 TERMINAZIONE SIMULAZIONE CTO");
    console.log("=".repeat(80));

    this.showFinalReport();
    
    // Save detailed log
    const reportPath = `./cto-live-simulation-${Date.now()}.json`;
    const fs = require('fs');
    
    const fullReport = {
      profile: this.profile,
      sessionId: this.sessionId,
      duration: this.conversationLog.length > 0 ? 
        new Date(this.conversationLog[this.conversationLog.length - 1].timestamp) - new Date(this.conversationLog[0].timestamp) : 0,
      finalScore: this.technicalScore,
      averageScore: this.responseCount > 0 ? (this.technicalScore / this.responseCount) : 0,
      messageCount: this.responseCount,
      conversationLog: this.conversationLog,
      evaluation: this.getFinalEvaluation()
    };

    fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));
    console.log(`\n💾 Report dettagliato salvato: ${reportPath}`);
    
    this.rl.close();
  }

  /**
   * Show final report
   */
  showFinalReport() {
    const avgScore = this.responseCount > 0 ? (this.technicalScore / this.responseCount).toFixed(1) : 0;
    const evaluation = this.getFinalEvaluation();

    console.log(`\n👤 CTO: ${this.profile.name}`);
    console.log(`🏢 Azienda: ${this.profile.company}`);
    console.log(`💬 Messaggi scambiati: ${this.responseCount}`);
    console.log(`📊 Punteggio finale: ${this.technicalScore} (${avgScore}/messaggio)`);
    console.log(`🎯 Valutazione: ${evaluation.grade} - ${evaluation.verdict}`);
    
    console.log(`\n📝 FEEDBACK CTO:`);
    console.log(evaluation.feedback);
    
    console.log(`\n🤝 RACCOMANDAZIONE:`);
    console.log(evaluation.recommendation);
  }

  /**
   * Generate final evaluation
   */
  getFinalEvaluation() {
    const avgScore = this.responseCount > 0 ? (this.technicalScore / this.responseCount) : 0;
    
    if (avgScore >= 12) {
      return {
        grade: "A",
        verdict: "ECCELLENTE",
        feedback: "Il chatbot ha dimostrato competenza tecnica di alto livello. Le risposte sono state pertinenti e tecnicamente accurate. Può gestire interazioni enterprise complesse.",
        recommendation: "✅ APPROVATO per deployment enterprise. Budget confermato €50k. Procediamo con pilot project."
      };
    } else if (avgScore >= 8) {
      return {
        grade: "B",
        verdict: "BUONO",
        feedback: "Competenza tecnica adeguata ma con margini di miglioramento. Alcune risposte sono state generiche su temi complessi.",
        recommendation: "⚠️ APPROVAZIONE CONDIZIONATA. Budget ridotto a €25k per test estesi prima del deployment completo."
      };
    } else if (avgScore >= 5) {
      return {
        grade: "C",
        verdict: "SUFFICIENTE",
        feedback: "Competenza tecnica di base presente ma insufficiente per scenari enterprise complessi. Necessari miglioramenti significativi.",
        recommendation: "🟡 NON RACCOMANDATO per enterprise. Budget €10k solo per pilot limitato e training intensivo."
      };
    } else {
      return {
        grade: "F",
        verdict: "INSUFFICIENTE",
        feedback: "Competenza tecnica inadeguata per le nostre esigenze. Il chatbot non ispira fiducia per questioni mission-critical.",
        recommendation: "❌ RESPINTO. Non procediamo con questo fornitore. Cercare alternative più competenti tecnicamente."
      };
    }
  }
}

// Execute simulation if run directly
if (require.main === module) {
  const simulation = new LiveCTOSimulation();
  simulation.startSimulation().catch(console.error);
}

module.exports = LiveCTOSimulation;