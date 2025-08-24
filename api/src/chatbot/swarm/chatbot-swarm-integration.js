/**
 * IT-ERA Chatbot - Swarm Integration Layer
 * Connects existing chatbot with SwarmOrchestrator
 * Provides A/B testing and fallback mechanisms
 */

import { SwarmOrchestrator } from './swarm-orchestrator.js';
import { BusinessRules, applyBusinessRules, calculateLeadScore, getSuggestedActions } from '../config/business-rules.js';

export class ChatbotSwarmIntegration {
  constructor(env) {
    this.env = env;
    this.orchestrator = new SwarmOrchestrator(env);
    this.abTestEnabled = env.AB_TEST_ENABLED !== 'false';
    this.swarmPercentage = parseInt(env.SWARM_PERCENTAGE || '10'); // Start with 10% traffic
    this.metrics = {
      traditional: { count: 0, totalTime: 0, errors: 0, cost: 0 },
      swarm: { count: 0, totalTime: 0, errors: 0, cost: 0 }
    };
  }

  /**
   * Main entry point for processing messages
   */
  async processMessage(sessionId, message, sessionData) {
    const startTime = Date.now();
    const useSwarm = this.shouldUseSwarm(sessionId);
    
    try {
      let response;
      let cost = 0;
      
      if (useSwarm) {
        console.log(`🐝 Using SWARM orchestration for session ${sessionId}`);
        response = await this.processWithSwarm(sessionId, message, sessionData);
        cost = response.cost || 0.04;
        this.updateMetrics('swarm', startTime, false, cost);
      } else {
        console.log(`📱 Using traditional processing for session ${sessionId}`);
        response = await this.processTraditional(message, sessionData);
        cost = 0.10; // Traditional cost
        this.updateMetrics('traditional', startTime, false, cost);
      }
      
      // Store performance data for analysis
      await this.storePerformanceData(sessionId, useSwarm, Date.now() - startTime, cost);
      
      return response;
    } catch (error) {
      console.error(`Error processing message:`, error);
      
      // Update error metrics
      this.updateMetrics(useSwarm ? 'swarm' : 'traditional', startTime, true, 0);
      
      // Fallback mechanism
      if (useSwarm) {
        console.log('Falling back to traditional processing...');
        try {
          const fallbackResponse = await this.processTraditional(message, sessionData);
          this.updateMetrics('traditional', Date.now(), false, 0.10);
          return fallbackResponse;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Determine whether to use swarm based on A/B testing
   */
  shouldUseSwarm(sessionId) {
    if (!this.abTestEnabled) {
      return true; // If A/B testing disabled, always use swarm
    }
    
    // Use consistent hashing to ensure same session always gets same treatment
    const hash = this.hashString(sessionId);
    return (hash % 100) < this.swarmPercentage;
  }

  /**
   * Process message using SwarmOrchestrator
   */
  async processWithSwarm(sessionId, message, sessionData) {
    const swarmResponse = await this.orchestrator.processMessage(sessionId, message, sessionData);
    
    // Transform swarm response to match existing format
    return {
      response: swarmResponse.response,
      intent: swarmResponse.intent,
      leadScore: swarmResponse.leadScore,
      suggestedActions: swarmResponse.nextSteps,
      metadata: {
        ...swarmResponse.metadata,
        processingMode: 'swarm',
        agentsUsed: swarmResponse.agentsUsed,
        consensusStrength: swarmResponse.consensusStrength
      },
      cost: swarmResponse.cost
    };
  }

  /**
   * Check if message contains blocked patterns
   */
  checkBlockedPatterns(message) {
    for (const pattern of BusinessRules.BLOCKED_PATTERNS) {
      if (pattern.test(message)) {
        // Determina tipo di risposta bloccata
        if (/configur|impost|install/i.test(message)) {
          return BusinessRules.BLOCKED_RESPONSES.configuration;
        }
        if (/password|credenziali|login/i.test(message)) {
          return BusinessRules.BLOCKED_RESPONSES.credentials;
        }
        if (/fai.?da.?te|da.solo|gratis/i.test(message)) {
          return BusinessRules.BLOCKED_RESPONSES.diy;
        }
        return BusinessRules.BLOCKED_RESPONSES.technical_steps;
      }
    }
    return null;
  }

  /**
   * Process message using traditional method (existing logic)
   */
  async processTraditional(message, sessionData) {
    // This would be the existing chatbot logic
    // For now, returning a placeholder that matches the existing format
    const response = await this.callOpenRouterAPI(message, sessionData);
    
    return {
      response: response.text,
      intent: this.detectIntent(message),
      leadScore: this.calculateTraditionalLeadScore(sessionData),
      suggestedActions: [],
      metadata: {
        processingMode: 'traditional',
        model: 'claude-3.5-sonnet'
      }
    };
  }

  /**
   * Call OpenRouter API with DeepSeek and business protection
   */
  async callOpenRouterAPI(message, sessionData) {
    const apiKey = this.env.OPENROUTER_API_KEY || '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';
    
    // Check for blocked patterns first
    const blockedResponse = this.checkBlockedPatterns(message);
    if (blockedResponse) {
      return { text: blockedResponse, blocked: true };
    }
    
    // Use business rules system prompt
    const systemPrompt = BusinessRules.SYSTEM_PROMPT;
    const conversation = sessionData?.messages || [];
    
    // Get model config
    const model = BusinessRules.AI_MODEL;
    const modelConfig = BusinessRules.MODEL_CONFIGS[model] || BusinessRules.MODEL_CONFIGS['deepseek/deepseek-chat-v3.1'];
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.it-era.it',
        'X-Title': 'IT-ERA Chatbot'
      },
      body: JSON.stringify({
        model: model, // DeepSeek per risparmiare!
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversation.slice(-5), // Solo ultimi 5 messaggi per risparmiare token
          { role: 'user', content: message }
        ],
        ...modelConfig // Usa configurazione ottimizzata
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || 'Mi scusi, non ho capito. Può riformulare?',
      usage: data.usage
    };
  }

  /**
   * Detect intent from message (simple implementation)
   */
  detectIntent(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('firewall') || lower.includes('watchguard')) return 'firewall_inquiry';
    if (lower.includes('backup') || lower.includes('veeam')) return 'backup_inquiry';
    if (lower.includes('preventivo') || lower.includes('costo') || lower.includes('prezzo')) return 'pricing_request';
    if (lower.includes('assistenza') || lower.includes('supporto')) return 'support_request';
    if (lower.includes('microsoft') || lower.includes('office')) return 'microsoft_inquiry';
    
    return 'general_inquiry';
  }

  /**
   * Calculate lead score using business rules
   */
  calculateTraditionalLeadScore(sessionData) {
    const messages = sessionData?.messages || [];
    const allText = messages.map(m => m.content).join(' ');
    
    // Use business rules for scoring
    const score = calculateLeadScore(allText, {
      isUrgent: allText.toLowerCase().includes('urgente'),
      messageCount: messages.length
    });
    
    // Check threshold for Teams notification
    if (score >= BusinessRules.LEAD_SCORING_RULES.thresholds.highValue) {
      this.sendTeamsNotification(sessionData, score);
    }
    
    return score;
  }
  
  /**
   * Send Teams notification for high-value leads
   */
  async sendTeamsNotification(sessionData, score) {
    if (!this.env.TEAMS_WEBHOOK_URL) return;
    
    try {
      const lastMessage = sessionData.messages[sessionData.messages.length - 1]?.content || '';
      
      await fetch(this.env.TEAMS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": score >= 85 ? "FF0000" : "FFA500",
          "summary": `🔥 Lead Score: ${score}/100`,
          "sections": [{
            "activityTitle": "**NUOVO LEAD AD ALTO VALORE**",
            "facts": [
              { "name": "Score", "value": `${score}/100` },
              { "name": "Richiesta", "value": lastMessage.substring(0, 100) },
              { "name": "Azione", "value": "Contattare entro 1 ora" }
            ]
          }]
        })
      });
    } catch (error) {
      console.error('Teams notification failed:', error);
    }
  }

  /**
   * Update performance metrics
   */
  updateMetrics(mode, startTime, isError, cost) {
    const metrics = this.metrics[mode];
    metrics.count++;
    if (!isError) {
      metrics.totalTime += Date.now() - startTime;
      metrics.cost += cost;
    } else {
      metrics.errors++;
    }
  }

  /**
   * Store performance data for analysis
   */
  async storePerformanceData(sessionId, useSwarm, responseTime, cost) {
    if (!this.env.CHAT_SESSIONS) return;
    
    const performanceKey = `perf:${sessionId}:${Date.now()}`;
    const performanceData = {
      timestamp: new Date().toISOString(),
      mode: useSwarm ? 'swarm' : 'traditional',
      responseTime,
      cost,
      sessionId
    };
    
    try {
      await this.env.CHAT_SESSIONS.put(
        performanceKey,
        JSON.stringify(performanceData),
        { expirationTtl: 86400 * 7 } // Keep for 7 days
      );
    } catch (error) {
      console.error('Failed to store performance data:', error);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    const calculate = (metrics) => ({
      count: metrics.count,
      avgResponseTime: metrics.count > 0 ? metrics.totalTime / metrics.count : 0,
      errorRate: metrics.count > 0 ? metrics.errors / metrics.count : 0,
      avgCost: metrics.count > 0 ? metrics.cost / metrics.count : 0,
      totalCost: metrics.cost
    });
    
    return {
      traditional: calculate(this.metrics.traditional),
      swarm: calculate(this.metrics.swarm),
      swarmPercentage: this.swarmPercentage,
      comparison: this.calculateComparison()
    };
  }

  /**
   * Calculate performance comparison
   */
  calculateComparison() {
    const trad = this.metrics.traditional;
    const swarm = this.metrics.swarm;
    
    if (trad.count === 0 || swarm.count === 0) {
      return { status: 'insufficient_data' };
    }
    
    const tradAvgTime = trad.totalTime / trad.count;
    const swarmAvgTime = swarm.totalTime / swarm.count;
    const tradAvgCost = trad.cost / trad.count;
    const swarmAvgCost = swarm.cost / swarm.count;
    
    return {
      status: 'ready',
      speedImprovement: ((tradAvgTime - swarmAvgTime) / tradAvgTime * 100).toFixed(1) + '%',
      costReduction: ((tradAvgCost - swarmAvgCost) / tradAvgCost * 100).toFixed(1) + '%',
      errorRateChange: ((swarm.errors / swarm.count) - (trad.errors / trad.count) * 100).toFixed(2) + '%',
      recommendation: this.getRecommendation(swarmAvgTime, tradAvgTime, swarmAvgCost, tradAvgCost)
    };
  }

  /**
   * Get recommendation based on metrics
   */
  getRecommendation(swarmTime, tradTime, swarmCost, tradCost) {
    const timeImprovement = (tradTime - swarmTime) / tradTime;
    const costImprovement = (tradCost - swarmCost) / tradCost;
    
    if (timeImprovement > 0.3 && costImprovement > 0.4) {
      return 'increase_swarm_traffic'; // Swarm is significantly better
    } else if (timeImprovement < -0.1 || costImprovement < -0.1) {
      return 'reduce_swarm_traffic'; // Swarm is worse
    } else {
      return 'maintain_current'; // Similar performance, continue testing
    }
  }

  /**
   * Simple hash function for consistent A/B testing
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Adjust swarm percentage based on performance
   */
  async adjustSwarmPercentage() {
    const metrics = this.getMetrics();
    
    if (metrics.comparison.status !== 'ready') {
      console.log('Not enough data to adjust swarm percentage');
      return;
    }
    
    const recommendation = metrics.comparison.recommendation;
    
    if (recommendation === 'increase_swarm_traffic') {
      this.swarmPercentage = Math.min(this.swarmPercentage + 10, 100);
      console.log(`📈 Increasing swarm traffic to ${this.swarmPercentage}%`);
    } else if (recommendation === 'reduce_swarm_traffic') {
      this.swarmPercentage = Math.max(this.swarmPercentage - 5, 0);
      console.log(`📉 Reducing swarm traffic to ${this.swarmPercentage}%`);
    } else {
      console.log(`➡️ Maintaining swarm traffic at ${this.swarmPercentage}%`);
    }
    
    // Store the new percentage
    if (this.env.SHARED_CONFIG) {
      await this.env.SHARED_CONFIG.put('SWARM_PERCENTAGE', this.swarmPercentage.toString());
    }
  }
}

export default ChatbotSwarmIntegration;