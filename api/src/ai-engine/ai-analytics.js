/**
 * AI Analytics and Performance Monitoring for IT-ERA Chatbot
 * Tracks AI performance, costs, and conversation quality
 */

import { AIConfig } from './ai-config.js';

class AIAnalytics {
  constructor() {
    this.metrics = {
      conversations: new Map(),
      dailyStats: new Map(),
      performance: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalCost: 0,
        totalResponseTime: 0,
        cacheHits: 0,
        escalations: 0,
      },
      leads: {
        total: 0,
        qualified: 0,
        highPriority: 0,
        converted: 0,
      },
    };
  }

  /**
   * Track AI request and response
   */
  trackAIRequest(sessionId, request, response, error = null) {
    const timestamp = Date.now();
    const today = this.getDateKey(new Date());
    
    // Update performance metrics
    this.metrics.performance.totalRequests++;
    
    if (error) {
      this.metrics.performance.failedRequests++;
      this.logError(sessionId, error, request);
    } else {
      this.metrics.performance.successfulRequests++;
      
      // Track costs
      if (response.cost) {
        this.metrics.performance.totalCost += response.cost;
      }
      
      // Track response time
      if (response.responseTime) {
        this.metrics.performance.totalResponseTime += response.responseTime;
      }
      
      // Track cache usage
      if (response.cached) {
        this.metrics.performance.cacheHits++;
      }
      
      // Track escalations
      if (response.escalate) {
        this.metrics.performance.escalations++;
        this.trackEscalation(sessionId, response.escalationType, response.priority);
      }
    }
    
    // Update daily stats
    if (!this.metrics.dailyStats.has(today)) {
      this.metrics.dailyStats.set(today, {
        date: today,
        requests: 0,
        success: 0,
        failures: 0,
        cost: 0,
        avgResponseTime: 0,
        leads: 0,
        escalations: 0,
      });
    }
    
    const dailyStat = this.metrics.dailyStats.get(today);
    dailyStat.requests++;
    
    if (error) {
      dailyStat.failures++;
    } else {
      dailyStat.success++;
      dailyStat.cost += response.cost || 0;
      dailyStat.avgResponseTime = (dailyStat.avgResponseTime + (response.responseTime || 0)) / 2;
      
      if (response.escalate) {
        dailyStat.escalations++;
      }
    }
    
    // Track conversation details
    this.updateConversationMetrics(sessionId, request, response, error);
  }

  /**
   * Track lead generation and qualification
   */
  trackLead(sessionId, leadData, priority = 'low', qualified = false) {
    this.metrics.leads.total++;
    
    if (qualified) {
      this.metrics.leads.qualified++;
    }
    
    if (priority === 'high' || priority === 'immediate') {
      this.metrics.leads.highPriority++;
    }
    
    // Update conversation with lead data
    if (this.metrics.conversations.has(sessionId)) {
      const conversation = this.metrics.conversations.get(sessionId);
      conversation.leadData = leadData;
      conversation.leadPriority = priority;
      conversation.leadQualified = qualified;
    }
    
    // Update daily stats
    const today = this.getDateKey(new Date());
    const dailyStat = this.metrics.dailyStats.get(today);
    if (dailyStat) {
      dailyStat.leads++;
    }
    
    console.log(`📊 Lead tracked: ${priority} priority, qualified: ${qualified}`);
  }

  /**
   * Track escalation details
   */
  trackEscalation(sessionId, type, priority, reason = '') {
    const escalation = {
      sessionId,
      type,
      priority,
      reason,
      timestamp: Date.now(),
    };
    
    // Update conversation
    if (this.metrics.conversations.has(sessionId)) {
      const conversation = this.metrics.conversations.get(sessionId);
      conversation.escalated = true;
      conversation.escalationType = type;
      conversation.escalationReason = reason;
    }
    
    console.log(`🚨 Escalation tracked: ${type} (${priority}) - ${reason}`);
  }

  /**
   * Track conversation completion/conversion
   */
  trackConversion(sessionId, conversionType = 'email_handoff', value = 0) {
    this.metrics.leads.converted++;
    
    if (this.metrics.conversations.has(sessionId)) {
      const conversation = this.metrics.conversations.get(sessionId);
      conversation.converted = true;
      conversation.conversionType = conversionType;
      conversation.conversionValue = value;
    }
    
    console.log(`💰 Conversion tracked: ${conversionType}, value: €${value}`);
  }

  /**
   * Update conversation-level metrics
   */
  updateConversationMetrics(sessionId, request, response, error) {
    if (!this.metrics.conversations.has(sessionId)) {
      this.metrics.conversations.set(sessionId, {
        sessionId,
        startTime: Date.now(),
        messageCount: 0,
        totalCost: 0,
        totalResponseTime: 0,
        intents: [],
        escalated: false,
        leadQualified: false,
        converted: false,
      });
    }
    
    const conversation = this.metrics.conversations.get(sessionId);
    conversation.messageCount++;
    conversation.lastActivity = Date.now();
    
    if (!error) {
      conversation.totalCost += response.cost || 0;
      conversation.totalResponseTime += response.responseTime || 0;
      
      if (response.intent && !conversation.intents.includes(response.intent)) {
        conversation.intents.push(response.intent);
      }
    }
  }

  /**
   * Get comprehensive analytics report
   */
  getAnalyticsReport(timeframe = 'today') {
    const report = {
      timestamp: new Date().toISOString(),
      timeframe,
      summary: this.getPerformanceSummary(),
      leads: this.getLeadAnalytics(),
      costs: this.getCostAnalytics(),
      quality: this.getQualityMetrics(),
      trends: this.getTrendAnalysis(timeframe),
    };
    
    return report;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const perf = this.metrics.performance;
    const successRate = perf.totalRequests > 0 ? 
      (perf.successfulRequests / perf.totalRequests * 100).toFixed(2) : 0;
    const avgResponseTime = perf.successfulRequests > 0 ? 
      Math.round(perf.totalResponseTime / perf.successfulRequests) : 0;
    const cacheHitRate = perf.totalRequests > 0 ? 
      (perf.cacheHits / perf.totalRequests * 100).toFixed(2) : 0;
    
    return {
      totalRequests: perf.totalRequests,
      successRate: `${successRate}%`,
      avgResponseTime: `${avgResponseTime}ms`,
      cacheHitRate: `${cacheHitRate}%`,
      totalCost: `$${perf.totalCost.toFixed(4)}`,
      escalationRate: perf.totalRequests > 0 ? 
        `${(perf.escalations / perf.totalRequests * 100).toFixed(2)}%` : '0%',
    };
  }

  /**
   * Get lead analytics
   */
  getLeadAnalytics() {
    const leads = this.metrics.leads;
    const qualificationRate = leads.total > 0 ? 
      (leads.qualified / leads.total * 100).toFixed(2) : 0;
    const conversionRate = leads.qualified > 0 ? 
      (leads.converted / leads.qualified * 100).toFixed(2) : 0;
    const highPriorityRate = leads.total > 0 ? 
      (leads.highPriority / leads.total * 100).toFixed(2) : 0;
    
    return {
      totalLeads: leads.total,
      qualifiedLeads: leads.qualified,
      qualificationRate: `${qualificationRate}%`,
      highPriorityLeads: leads.highPriority,
      highPriorityRate: `${highPriorityRate}%`,
      convertedLeads: leads.converted,
      conversionRate: `${conversionRate}%`,
    };
  }

  /**
   * Get cost analytics
   */
  getCostAnalytics() {
    const totalCost = this.metrics.performance.totalCost;
    const totalRequests = this.metrics.performance.totalRequests;
    const costPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    const costPerLead = this.metrics.leads.total > 0 ? totalCost / this.metrics.leads.total : 0;
    
    return {
      totalCost: `€${totalCost.toFixed(6)}`,
      costPerRequest: `€${costPerRequest.toFixed(6)}`,
      costPerLead: `€${costPerLead.toFixed(6)}`,
      averageSessionCost: this.getAverageSessionCost(),
      costEfficiency: this.calculateCostEfficiency(),
    };
  }

  /**
   * Get quality metrics
   */
  getQualityMetrics() {
    const conversations = Array.from(this.metrics.conversations.values());
    const completedConversations = conversations.filter(c => c.messageCount >= 3);
    
    const avgMessageCount = conversations.length > 0 ? 
      conversations.reduce((sum, c) => sum + c.messageCount, 0) / conversations.length : 0;
    
    const avgSessionDuration = conversations.length > 0 ? 
      conversations.reduce((sum, c) => sum + (c.lastActivity - c.startTime), 0) / conversations.length : 0;
    
    return {
      totalConversations: conversations.length,
      completedConversations: completedConversations.length,
      avgMessageCount: Math.round(avgMessageCount * 100) / 100,
      avgSessionDuration: `${Math.round(avgSessionDuration / 1000)}s`,
      engagementRate: conversations.length > 0 ? 
        `${(completedConversations.length / conversations.length * 100).toFixed(2)}%` : '0%',
    };
  }

  /**
   * Get trend analysis
   */
  getTrendAnalysis(timeframe) {
    const dailyStats = Array.from(this.metrics.dailyStats.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (dailyStats.length < 2) {
      return { trend: 'insufficient_data', message: 'Need more data for trend analysis' };
    }
    
    const recent = dailyStats.slice(-3); // Last 3 days
    const trends = {
      requests: this.calculateTrend(recent.map(d => d.requests)),
      successRate: this.calculateTrend(recent.map(d => d.success / d.requests * 100)),
      costs: this.calculateTrend(recent.map(d => d.cost)),
      leads: this.calculateTrend(recent.map(d => d.leads)),
    };
    
    return trends;
  }

  /**
   * Calculate trend direction
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first * 100);
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Get average session cost
   */
  getAverageSessionCost() {
    const conversations = Array.from(this.metrics.conversations.values());
    if (conversations.length === 0) return '$0.0000';
    
    const totalCost = conversations.reduce((sum, c) => sum + c.totalCost, 0);
    const avgCost = totalCost / conversations.length;
    
    return `$${avgCost.toFixed(4)}`;
  }

  /**
   * Calculate cost efficiency
   */
  calculateCostEfficiency() {
    const totalCost = this.metrics.performance.totalCost;
    const conversions = this.metrics.leads.converted;
    
    if (conversions === 0) return 'No conversions yet';
    
    const costPerConversion = totalCost / conversions;
    return `$${costPerConversion.toFixed(4)} per conversion`;
  }

  /**
   * Log error details
   */
  logError(sessionId, error, request) {
    console.error('🔴 AI Analytics Error:', {
      sessionId,
      error: error.message,
      request: request?.message?.substring(0, 100),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get date key for daily stats
   */
  getDateKey(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Export analytics data
   */
  exportData() {
    return {
      metrics: {
        ...this.metrics,
        conversations: Array.from(this.metrics.conversations.entries()),
        dailyStats: Array.from(this.metrics.dailyStats.entries()),
      },
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Reset analytics data (call daily)
   */
  resetDailyData() {
    // Keep only last 30 days of daily stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const [dateKey, _] of this.metrics.dailyStats.entries()) {
      if (new Date(dateKey) < thirtyDaysAgo) {
        this.metrics.dailyStats.delete(dateKey);
      }
    }
    
    // Clean up old conversations (keep last 1000)
    if (this.metrics.conversations.size > 1000) {
      const conversations = Array.from(this.metrics.conversations.entries())
        .sort(([,a], [,b]) => b.lastActivity - a.lastActivity);
      
      // Keep most recent 1000
      const toKeep = conversations.slice(0, 1000);
      this.metrics.conversations.clear();
      
      for (const [sessionId, data] of toKeep) {
        this.metrics.conversations.set(sessionId, data);
      }
    }
    
    console.log('📊 Analytics daily cleanup completed');
  }

  /**
   * Health check for analytics system
   */
  healthCheck() {
    const health = {
      status: 'healthy',
      checks: {
        metricsTracking: this.metrics.performance.totalRequests > 0,
        conversationTracking: this.metrics.conversations.size > 0,
        dailyStatsTracking: this.metrics.dailyStats.size > 0,
        leadTracking: this.metrics.leads.total >= 0,
      },
      stats: {
        totalSessions: this.metrics.conversations.size,
        dailyStatsEntries: this.metrics.dailyStats.size,
        memoryUsage: this.estimateMemoryUsage(),
      },
    };
    
    // Check if any critical systems are failing
    const criticalChecks = Object.values(health.checks);
    if (criticalChecks.some(check => !check)) {
      health.status = 'degraded';
    }
    
    return health;
  }

  /**
   * Estimate memory usage of analytics data
   */
  estimateMemoryUsage() {
    const dataSize = JSON.stringify(this.exportData()).length;
    return `${Math.round(dataSize / 1024)} KB`;
  }
}

// Create singleton instance
const aiAnalytics = new AIAnalytics();

export { aiAnalytics, AIAnalytics };
export default aiAnalytics;