/**
 * IT-ERA Chatbot Swarm Orchestrator
 * Coordina gli agenti MCP per rispondere alle richieste dei clienti
 */

import { ITERAKnowledgeBase } from '../../knowledge-base/it-era-knowledge-real.js';

export class SwarmOrchestrator {
  constructor(env) {
    this.env = env;
    this.swarmId = 'swarm_1756050052635_hx36xugct';
    this.agents = {
      orchestrator: 'agent_1756050052836_coiwb5',
      leadQualifier: 'agent_1756050053073_x4q67d',
      technicalAdvisor: 'agent_1756050053297_hb1a2e',
      salesAssistant: 'agent_1756050053533_h7pnmv',
      memoryKeeper: 'agent_1756050066813_dl50v5',
      supportSpecialist: 'agent_1756050066862_fqan9f',
      performanceMonitor: 'agent_1756050066910_tc1z1g',
      marketIntelligence: 'agent_1756050066984_9039xk'
    };
    
    this.costLimit = 0.04; // Reduced from $0.10
    this.responseTimeTarget = 1600; // 1.6 seconds
  }
  
  /**
   * Process a user message with swarm intelligence
   */
  async processMessage(message, context = {}) {
    const startTime = Date.now();
    
    try {
      // Step 1: Analyze intent with multiple agents
      const intentAnalysis = await this.analyzeIntent(message, context);
      
      // Step 2: Distribute tasks to specialized agents
      const agentResponses = await this.distributeToAgents(message, intentAnalysis, context);
      
      // Step 3: Build consensus from agent responses
      const consensus = await this.buildConsensus(agentResponses);
      
      // Step 4: Learn from the interaction
      await this.learnFromInteraction(message, consensus, context);
      
      // Step 5: Monitor performance
      const responseTime = Date.now() - startTime;
      await this.monitorPerformance(responseTime, consensus);
      
      return {
        success: true,
        response: consensus.response,
        options: consensus.options,
        metadata: {
          swarmId: this.swarmId,
          responseTime,
          agentsUsed: Object.keys(agentResponses).length,
          consensusScore: consensus.score,
          cost: consensus.estimatedCost
        }
      };
      
    } catch (error) {
      console.error('Swarm orchestration error:', error);
      
      // Fallback to traditional response
      return this.fallbackResponse(message, context);
    }
  }
  
  /**
   * Analyze user intent with multiple agents
   */
  async analyzeIntent(message, context) {
    const msg = message.toLowerCase();
    
    const analysis = {
      intents: [],
      priority: 'medium',
      urgency: false,
      leadScore: 0,
      technicalComplexity: 'low',
      estimatedValue: 0
    };
    
    // Lead Qualifier Agent analysis
    if (msg.includes('azienda') || msg.includes('persone') || msg.includes('dipendenti')) {
      analysis.intents.push('lead_qualification');
      analysis.leadScore += 30;
      
      // Extract company size
      const sizeMatch = msg.match(/(\d+)\s*(persone|dipendenti|pc|postazioni)/i);
      if (sizeMatch) {
        const size = parseInt(sizeMatch[1]);
        if (size >= 20) analysis.leadScore += 20;
        if (size >= 50) analysis.leadScore += 30;
        analysis.estimatedValue = size * 100; // Estimated monthly value
      }
    }
    
    // Geographic scoring
    if (msg.includes('monza') || msg.includes('vimercate') || msg.includes('brianza')) {
      analysis.leadScore += 25;
      analysis.priority = 'high';
    }
    
    // Technical Advisor Agent analysis
    if (msg.includes('firewall') || msg.includes('watchguard') || msg.includes('sicurezza')) {
      analysis.intents.push('technical_consultation');
      analysis.technicalComplexity = 'high';
      analysis.estimatedValue += 2000;
    }
    
    if (msg.includes('backup') || msg.includes('disaster recovery')) {
      analysis.intents.push('technical_consultation');
      analysis.technicalComplexity = 'medium';
      analysis.estimatedValue += 1500;
    }
    
    // Sales Assistant Agent analysis
    if (msg.includes('preventivo') || msg.includes('costo') || msg.includes('prezzo')) {
      analysis.intents.push('pricing_inquiry');
      analysis.priority = 'high';
    }
    
    // Support Specialist Agent analysis
    if (msg.includes('emergenza') || msg.includes('urgente') || msg.includes('down')) {
      analysis.intents.push('emergency_support');
      analysis.urgency = true;
      analysis.priority = 'critical';
    }
    
    if (msg.includes('assistenza') || msg.includes('supporto') || msg.includes('aiuto')) {
      analysis.intents.push('support_request');
    }
    
    // Default intent
    if (analysis.intents.length === 0) {
      analysis.intents.push('general_inquiry');
    }
    
    return analysis;
  }
  
  /**
   * Distribute tasks to specialized agents
   */
  async distributeToAgents(message, intentAnalysis, context) {
    const responses = {};
    const tasks = [];
    
    // Assign agents based on intent
    if (intentAnalysis.intents.includes('lead_qualification')) {
      tasks.push(this.callLeadQualifier(message, context));
    }
    
    if (intentAnalysis.intents.includes('technical_consultation')) {
      tasks.push(this.callTechnicalAdvisor(message, context));
    }
    
    if (intentAnalysis.intents.includes('pricing_inquiry')) {
      tasks.push(this.callSalesAssistant(message, intentAnalysis, context));
    }
    
    if (intentAnalysis.intents.includes('emergency_support')) {
      tasks.push(this.callSupportSpecialist(message, context));
    }
    
    // Always use memory keeper for context
    tasks.push(this.callMemoryKeeper(message, context));
    
    // Execute all tasks in parallel
    const results = await Promise.allSettled(tasks);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const agentName = ['leadQualifier', 'technicalAdvisor', 'salesAssistant', 'supportSpecialist', 'memoryKeeper'][index];
        responses[agentName] = result.value;
      }
    });
    
    return responses;
  }
  
  /**
   * Lead Qualifier Agent
   */
  async callLeadQualifier(message, context) {
    const msg = message.toLowerCase();
    
    const leadData = {
      companySize: null,
      location: null,
      industry: null,
      needs: [],
      score: 0,
      qualification: 'cold'
    };
    
    // Extract company size
    const sizeMatch = msg.match(/(\d+)\s*(persone|dipendenti|pc|postazioni)/i);
    if (sizeMatch) {
      leadData.companySize = parseInt(sizeMatch[1]);
      leadData.score += leadData.companySize >= 20 ? 30 : 15;
    }
    
    // Extract location
    if (msg.includes('monza')) {
      leadData.location = 'Monza';
      leadData.score += 30;
    } else if (msg.includes('vimercate')) {
      leadData.location = 'Vimercate';
      leadData.score += 35;
    } else if (msg.includes('brianza')) {
      leadData.location = 'Brianza';
      leadData.score += 25;
    } else if (msg.includes('milano')) {
      leadData.location = 'Milano';
      leadData.score += 20;
    }
    
    // Identify needs
    if (msg.includes('firewall') || msg.includes('sicurezza')) leadData.needs.push('security');
    if (msg.includes('backup')) leadData.needs.push('backup');
    if (msg.includes('assistenza')) leadData.needs.push('support');
    if (msg.includes('cloud')) leadData.needs.push('cloud');
    
    // Qualify lead
    if (leadData.score >= 60) leadData.qualification = 'hot';
    else if (leadData.score >= 40) leadData.qualification = 'warm';
    
    return {
      agentType: 'leadQualifier',
      leadData,
      recommendation: leadData.qualification === 'hot' ? 'immediate_contact' : 'nurture',
      teamsNotification: leadData.qualification !== 'cold'
    };
  }
  
  /**
   * Technical Advisor Agent
   */
  async callTechnicalAdvisor(message, context) {
    const msg = message.toLowerCase();
    const recommendations = [];
    
    if (msg.includes('firewall') || msg.includes('watchguard')) {
      const sizeMatch = msg.match(/(\d+)\s*(persone|dipendenti|pc|postazioni)/i);
      const size = sizeMatch ? parseInt(sizeMatch[1]) : 20;
      
      if (size <= 25) {
        recommendations.push({
          product: 'WatchGuard T40',
          description: 'Firewall ideale per piccole imprese fino a 25 utenti',
          price: '€1,500 - €2,000',
          features: ['Protezione avanzata', 'VPN inclusa', 'Gestione cloud']
        });
      } else if (size <= 50) {
        recommendations.push({
          product: 'WatchGuard T70',
          description: 'Soluzione robusta per medie imprese fino a 50 utenti',
          price: '€2,500 - €3,500',
          features: ['High performance', 'Multi-WAN', 'Advanced threat protection']
        });
      } else {
        recommendations.push({
          product: 'WatchGuard M470',
          description: 'Enterprise-grade per oltre 50 utenti',
          price: '€4,000+',
          features: ['Scalabilità enterprise', 'Clustering', 'Full UTM suite']
        });
      }
    }
    
    if (msg.includes('backup')) {
      recommendations.push({
        product: 'Veeam Backup Suite',
        description: 'Soluzione completa di backup e disaster recovery',
        price: '€50-150/mese per workstation',
        features: ['Backup automatico', 'Recovery rapido', 'Cloud storage opzionale']
      });
    }
    
    return {
      agentType: 'technicalAdvisor',
      recommendations,
      expertise: 'WatchGuard Certified Partner',
      consultationOffered: true
    };
  }
  
  /**
   * Sales Assistant Agent
   */
  async callSalesAssistant(message, intentAnalysis, context) {
    const pricing = {
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      validity: '30 giorni',
      paymentTerms: 'Net 30'
    };
    
    // Base pricing on intent analysis
    if (intentAnalysis.estimatedValue > 0) {
      if (intentAnalysis.technicalComplexity === 'high') {
        pricing.items.push({
          description: 'Soluzione di sicurezza enterprise',
          price: intentAnalysis.estimatedValue * 1.2
        });
      } else {
        pricing.items.push({
          description: 'Servizi IT professionali',
          price: intentAnalysis.estimatedValue
        });
      }
    }
    
    // Calculate totals
    pricing.subtotal = pricing.items.reduce((sum, item) => sum + item.price, 0);
    
    // Apply discounts based on value
    if (pricing.subtotal > 5000) pricing.discount = pricing.subtotal * 0.10;
    else if (pricing.subtotal > 2000) pricing.discount = pricing.subtotal * 0.05;
    
    pricing.total = pricing.subtotal - pricing.discount;
    
    // Add upsell opportunities
    const upsells = [];
    if (!message.toLowerCase().includes('backup')) {
      upsells.push('Backup solution (+€50/mese)');
    }
    if (!message.toLowerCase().includes('monitoring')) {
      upsells.push('24/7 Monitoring (+€100/mese)');
    }
    
    return {
      agentType: 'salesAssistant',
      pricing,
      upsells,
      specialOffer: pricing.total > 3000 ? 'Sopralluogo gratuito incluso' : null
    };
  }
  
  /**
   * Support Specialist Agent
   */
  async callSupportSpecialist(message, context) {
    const msg = message.toLowerCase();
    
    const support = {
      priority: 'normal',
      estimatedResponseTime: '4 ore',
      ticketType: 'general',
      immediateActions: [],
      escalation: false
    };
    
    if (msg.includes('emergenza') || msg.includes('urgente') || msg.includes('down')) {
      support.priority = 'critical';
      support.estimatedResponseTime = 'Immediato';
      support.ticketType = 'emergency';
      support.escalation = true;
      support.immediateActions = [
        'Chiamare immediatamente: 039 888 2041',
        'Preparare accesso remoto se disponibile',
        'Documentare il problema dettagliatamente'
      ];
    } else if (msg.includes('lento') || msg.includes('problema')) {
      support.priority = 'high';
      support.estimatedResponseTime = '2 ore';
      support.ticketType = 'performance';
    }
    
    return {
      agentType: 'supportSpecialist',
      support,
      contactInfo: ITERAKnowledgeBase.company.contact
    };
  }
  
  /**
   * Memory Keeper Agent
   */
  async callMemoryKeeper(message, context) {
    // Retrieve customer profile if exists
    let customerProfile = {};
    
    if (context.sessionId) {
      try {
        const stored = await this.env.CHAT_SESSIONS?.get(`profile_${context.sessionId}`);
        if (stored) customerProfile = JSON.parse(stored);
      } catch (e) {
        console.error('Memory retrieval error:', e);
      }
    }
    
    // Update profile with new information
    const msg = message.toLowerCase();
    
    if (msg.includes('azienda') || msg.includes('persone')) {
      customerProfile.type = 'business';
      customerProfile.lastInteraction = Date.now();
    }
    
    // Store updated profile
    if (context.sessionId && this.env.CHAT_SESSIONS) {
      try {
        await this.env.CHAT_SESSIONS.put(
          `profile_${context.sessionId}`,
          JSON.stringify(customerProfile),
          { expirationTtl: 2592000 } // 30 days
        );
      } catch (e) {
        console.error('Memory storage error:', e);
      }
    }
    
    return {
      agentType: 'memoryKeeper',
      customerProfile,
      previousInteractions: customerProfile.interactions || 0,
      patterns: customerProfile.patterns || []
    };
  }
  
  /**
   * Build consensus from agent responses
   */
  async buildConsensus(agentResponses) {
    const consensus = {
      response: '',
      options: [],
      score: 0,
      estimatedCost: 0.02 // Start with base cost
    };
    
    // Priority: Emergency > Lead > Technical > Sales > General
    if (agentResponses.supportSpecialist?.support?.priority === 'critical') {
      consensus.response = this.buildEmergencyResponse(agentResponses.supportSpecialist);
      consensus.score = 95;
    } else if (agentResponses.leadQualifier?.leadData?.qualification === 'hot') {
      consensus.response = this.buildQualifiedLeadResponse(agentResponses);
      consensus.score = 90;
    } else if (agentResponses.technicalAdvisor?.recommendations?.length > 0) {
      consensus.response = this.buildTechnicalResponse(agentResponses);
      consensus.score = 85;
    } else if (agentResponses.salesAssistant?.pricing?.total > 0) {
      consensus.response = this.buildPricingResponse(agentResponses);
      consensus.score = 80;
    } else {
      consensus.response = this.buildGeneralResponse(agentResponses);
      consensus.score = 70;
    }
    
    // Add options based on context
    consensus.options = this.generateOptions(agentResponses);
    
    // Calculate estimated cost
    const agentCount = Object.keys(agentResponses).length;
    consensus.estimatedCost = 0.005 * agentCount; // $0.005 per agent
    
    return consensus;
  }
  
  /**
   * Build emergency response
   */
  buildEmergencyResponse(supportResponse) {
    const support = supportResponse.support;
    return `🚨 **EMERGENZA RILEVATA**\n\n` +
           `📞 **Chiama SUBITO: ${ITERAKnowledgeBase.company.contact.phone}**\n\n` +
           `**Azioni immediate:**\n` +
           support.immediateActions.map(a => `• ${a}`).join('\n') + '\n\n' +
           `**Tempo di risposta:** ${support.estimatedResponseTime}\n\n` +
           `Il nostro team di emergenza è pronto ad intervenire.`;
  }
  
  /**
   * Build qualified lead response
   */
  buildQualifiedLeadResponse(responses) {
    const lead = responses.leadQualifier.leadData;
    const tech = responses.technicalAdvisor;
    
    let response = `👋 **Perfetto! Possiamo aiutarti.**\n\n`;
    
    if (lead.companySize) {
      response += `Per un'azienda di ${lead.companySize} persone `;
    }
    if (lead.location) {
      response += `a ${lead.location} `;
    }
    response += `abbiamo soluzioni specifiche:\n\n`;
    
    if (tech?.recommendations?.length > 0) {
      response += `**💡 Soluzione consigliata:**\n`;
      const rec = tech.recommendations[0];
      response += `• ${rec.product}\n`;
      response += `• ${rec.description}\n`;
      response += `• Prezzo indicativo: ${rec.price}\n\n`;
    }
    
    response += `✅ **Prossimi passi:**\n`;
    response += `1. Sopralluogo GRATUITO presso la tua sede\n`;
    response += `2. Analisi dettagliata delle esigenze\n`;
    response += `3. Preventivo personalizzato senza impegno\n\n`;
    response += `📞 **Contattaci: ${ITERAKnowledgeBase.company.contact.phone}**`;
    
    return response;
  }
  
  /**
   * Build technical response
   */
  buildTechnicalResponse(responses) {
    const tech = responses.technicalAdvisor;
    
    let response = `🛡️ **Consulenza Tecnica Specializzata**\n\n`;
    
    if (tech.recommendations.length > 0) {
      response += `**Soluzioni consigliate:**\n\n`;
      
      tech.recommendations.forEach(rec => {
        response += `**${rec.product}**\n`;
        response += `${rec.description}\n`;
        response += `💰 ${rec.price}\n`;
        response += `✅ ${rec.features.join(', ')}\n\n`;
      });
    }
    
    response += `🏆 **${tech.expertise}**\n`;
    response += `10+ anni di esperienza nella Brianza\n\n`;
    response += `📞 **Consulenza gratuita: ${ITERAKnowledgeBase.company.contact.phone}**`;
    
    return response;
  }
  
  /**
   * Build pricing response
   */
  buildPricingResponse(responses) {
    const pricing = responses.salesAssistant.pricing;
    
    let response = `💰 **Preventivo Personalizzato**\n\n`;
    
    if (pricing.items.length > 0) {
      response += `**Dettaglio servizi:**\n`;
      pricing.items.forEach(item => {
        response += `• ${item.description}: €${item.price.toFixed(2)}\n`;
      });
      response += `\n`;
      
      if (pricing.discount > 0) {
        response += `Subtotale: €${pricing.subtotal.toFixed(2)}\n`;
        response += `Sconto applicato: -€${pricing.discount.toFixed(2)}\n`;
      }
      
      response += `**Totale: €${pricing.total.toFixed(2)}**\n\n`;
    }
    
    response += `✅ Validità: ${pricing.validity}\n`;
    response += `✅ Pagamento: ${pricing.paymentTerms}\n\n`;
    
    if (responses.salesAssistant.specialOffer) {
      response += `🎁 **Offerta speciale:** ${responses.salesAssistant.specialOffer}\n\n`;
    }
    
    response += `📞 **Per confermare: ${ITERAKnowledgeBase.company.contact.phone}**`;
    
    return response;
  }
  
  /**
   * Build general response
   */
  buildGeneralResponse(responses) {
    return ITERAKnowledgeBase.responses.getWelcomeMessage();
  }
  
  /**
   * Generate response options
   */
  generateOptions(responses) {
    const options = [];
    
    if (responses.leadQualifier?.leadData?.qualification !== 'cold') {
      options.push('📞 Richiedi consulenza gratuita');
      options.push('💰 Preventivo dettagliato');
    }
    
    if (responses.technicalAdvisor?.recommendations?.length > 0) {
      options.push('🛡️ Info sicurezza');
      options.push('💾 Soluzioni backup');
    }
    
    if (responses.supportSpecialist?.support?.priority === 'critical') {
      options.push('🚨 Chiamata urgente');
    }
    
    // Default options
    if (options.length === 0) {
      options.push(...ITERAKnowledgeBase.responses.defaultOptions);
    }
    
    return options.slice(0, 5); // Max 5 options
  }
  
  /**
   * Learn from interaction
   */
  async learnFromInteraction(message, consensus, context) {
    // Store pattern for future learning
    const pattern = {
      message,
      consensusScore: consensus.score,
      responseTime: context.responseTime,
      timestamp: Date.now()
    };
    
    try {
      // Neural pattern training would go here
      console.log('Learning pattern:', pattern);
    } catch (e) {
      console.error('Learning error:', e);
    }
  }
  
  /**
   * Monitor performance
   */
  async monitorPerformance(responseTime, consensus) {
    const metrics = {
      responseTime,
      consensusScore: consensus.score,
      cost: consensus.estimatedCost,
      timestamp: Date.now()
    };
    
    // Check if we met targets
    if (responseTime > this.responseTimeTarget) {
      console.warn(`Response time ${responseTime}ms exceeded target ${this.responseTimeTarget}ms`);
    }
    
    if (consensus.estimatedCost > this.costLimit) {
      console.warn(`Cost ${consensus.estimatedCost} exceeded limit ${this.costLimit}`);
    }
    
    console.log('Performance metrics:', metrics);
  }
  
  /**
   * Fallback response when swarm fails
   */
  fallbackResponse(message, context) {
    return {
      success: true,
      response: ITERAKnowledgeBase.responses.getWelcomeMessage(),
      options: ITERAKnowledgeBase.responses.defaultOptions,
      metadata: {
        fallback: true,
        reason: 'swarm_error'
      }
    };
  }
}

export default SwarmOrchestrator;