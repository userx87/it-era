/**
 * Cost Monitoring and Optimization System
 * Tracks API usage, optimizes costs, and provides budget controls
 */

export class CostOptimizer {
  constructor(config = {}) {
    this.config = {
      dailyBudget: config.dailyBudget || 10.0, // $10/day
      monthlyBudget: config.monthlyBudget || 250.0, // $250/month
      alertThresholds: config.alertThresholds || [0.5, 0.75, 0.9], // 50%, 75%, 90%
      costPerToken: {
        'gpt-4o-mini': 0.00015,
        'gpt-4o': 0.03,
        'claude-3-haiku': 0.00025,
        'claude-3-sonnet': 0.003
      },
      cacheTTL: config.cacheTTL || 3600, // 1 hour
      ...config
    };
    
    this.usage = {
      daily: new Map(),
      monthly: new Map(),
      sessions: new Map(),
      cache: new Map()
    };
    
    this.alerts = [];
    this.optimizations = [];
  }

  /**
   * Track API call and calculate cost
   */
  trackAPICall(sessionId, model, inputTokens, outputTokens, cached = false) {
    const cost = cached ? 0 : this.calculateCost(model, inputTokens, outputTokens);
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7); // YYYY-MM
    
    // Update daily usage
    const dailyUsage = this.usage.daily.get(today) || { calls: 0, cost: 0, tokens: 0 };
    dailyUsage.calls++;
    dailyUsage.cost += cost;
    dailyUsage.tokens += inputTokens + outputTokens;
    this.usage.daily.set(today, dailyUsage);
    
    // Update monthly usage
    const monthlyUsage = this.usage.monthly.get(month) || { calls: 0, cost: 0, tokens: 0 };
    monthlyUsage.calls++;
    monthlyUsage.cost += cost;
    monthlyUsage.tokens += inputTokens + outputTokens;
    this.usage.monthly.set(month, monthlyUsage);
    
    // Update session usage
    const sessionUsage = this.usage.sessions.get(sessionId) || { calls: 0, cost: 0, tokens: 0 };
    sessionUsage.calls++;
    sessionUsage.cost += cost;
    sessionUsage.tokens += inputTokens + outputTokens;
    this.usage.sessions.set(sessionId, sessionUsage);
    
    // Check budget alerts
    this.checkBudgetAlerts(dailyUsage.cost, monthlyUsage.cost);
    
    return {
      cost,
      dailyCost: dailyUsage.cost,
      monthlyCost: monthlyUsage.cost,
      sessionCost: sessionUsage.cost,
      cached
    };
  }

  /**
   * Calculate cost for API call
   */
  calculateCost(model, inputTokens, outputTokens) {
    const rate = this.config.costPerToken[model] || this.config.costPerToken['gpt-4o-mini'];
    
    // Different pricing for input/output (simplified)
    const inputCost = inputTokens * rate;
    const outputCost = outputTokens * (rate * 1.5); // Output typically costs more
    
    return inputCost + outputCost;
  }

  /**
   * Check if response should be cached
   */
  shouldCache(query, response, intent) {
    const cacheableIntents = ['saluto', 'informazioni', 'servizi', 'faq'];
    const cacheablePatterns = [
      'quanto costa',
      'che servizi',
      'come funziona',
      'tempi di realizz',
      'info'
    ];
    
    // Cache if intent is cacheable
    if (cacheableIntents.includes(intent)) {
      return true;
    }
    
    // Cache if query matches patterns
    const queryLower = query.toLowerCase();
    if (cacheablePatterns.some(pattern => queryLower.includes(pattern))) {
      return true;
    }
    
    // Cache if response is informational and > 50 chars
    if (response.length > 50 && !response.includes('€') && !query.includes('nome')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get cached response if available
   */
  getCachedResponse(query, context = {}) {
    const cacheKey = this.generateCacheKey(query, context);
    const cached = this.usage.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL * 1000) {
      return cached.response;
    }
    
    return null;
  }

  /**
   * Store response in cache
   */
  setCachedResponse(query, context, response) {
    if (!this.shouldCache(query, response.message || '', response.intent)) {
      return;
    }
    
    const cacheKey = this.generateCacheKey(query, context);
    this.usage.cache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.usage.cache.size > 1000) {
      const oldestKey = this.usage.cache.keys().next().value;
      this.usage.cache.delete(oldestKey);
    }
  }

  /**
   * Generate cache key
   */
  generateCacheKey(query, context) {
    const normalizedQuery = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()
      .substring(0, 100);
    
    const contextKey = context.step || 'default';
    return `${normalizedQuery}_${contextKey}`;
  }

  /**
   * Check budget alerts
   */
  checkBudgetAlerts(dailyCost, monthlyCost) {
    const dailyPercentage = dailyCost / this.config.dailyBudget;
    const monthlyPercentage = monthlyCost / this.config.monthlyBudget;
    
    this.config.alertThresholds.forEach(threshold => {
      if (dailyPercentage >= threshold && !this.hasAlert('daily', threshold)) {
        this.addAlert({
          type: 'daily',
          threshold,
          cost: dailyCost,
          budget: this.config.dailyBudget,
          percentage: dailyPercentage,
          timestamp: Date.now()
        });
      }
      
      if (monthlyPercentage >= threshold && !this.hasAlert('monthly', threshold)) {
        this.addAlert({
          type: 'monthly',
          threshold,
          cost: monthlyCost,
          budget: this.config.monthlyBudget,
          percentage: monthlyPercentage,
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * Add budget alert
   */
  addAlert(alert) {
    this.alerts.push(alert);
    console.warn(`💰 BUDGET ALERT: ${alert.type} usage at ${(alert.percentage * 100).toFixed(1)}% ($${alert.cost.toFixed(2)}/${alert.budget})`);
    
    // Keep only recent alerts
    const oneDay = 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter(a => Date.now() - a.timestamp < oneDay);
  }

  /**
   * Check if alert already exists
   */
  hasAlert(type, threshold) {
    return this.alerts.some(a => a.type === type && a.threshold === threshold);
  }

  /**
   * Check if budget exceeded
   */
  isBudgetExceeded(type = 'daily') {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);
    
    if (type === 'daily') {
      const usage = this.usage.daily.get(today);
      return usage ? usage.cost >= this.config.dailyBudget : false;
    } else {
      const usage = this.usage.monthly.get(month);
      return usage ? usage.cost >= this.config.monthlyBudget : false;
    }
  }

  /**
   * Get cost-effective model recommendation
   */
  getOptimalModel(query, context = {}) {
    // Simple query -> use cheaper model
    if (query.length < 50 && !context.requiresAdvanced) {
      return 'gpt-4o-mini';
    }
    
    // Complex business query -> use better model
    if (query.includes('integrazione') || query.includes('complesso') || query.includes('custom')) {
      return 'claude-3-sonnet';
    }
    
    // FAQ or informational -> use fastest/cheapest
    const simplePatterns = ['ciao', 'quanto', 'dove', 'quando', 'info'];
    if (simplePatterns.some(p => query.toLowerCase().includes(p))) {
      return 'gpt-4o-mini';
    }
    
    // Default to balanced option
    return 'gpt-4o-mini';
  }

  /**
   * Optimize query before sending to AI
   */
  optimizeQuery(query, context = {}) {
    // Remove redundant words
    let optimized = query
      .replace(/\b(per favore|per piacere|grazie|prego)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit length for cost control
    if (optimized.length > 500) {
      optimized = optimized.substring(0, 500) + '...';
    }
    
    return optimized;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(period = 'daily') {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);
    
    let usage, budget;
    if (period === 'daily') {
      usage = this.usage.daily.get(today) || { calls: 0, cost: 0, tokens: 0 };
      budget = this.config.dailyBudget;
    } else {
      usage = this.usage.monthly.get(month) || { calls: 0, cost: 0, tokens: 0 };
      budget = this.config.monthlyBudget;
    }
    
    return {
      calls: usage.calls,
      cost: usage.cost,
      tokens: usage.tokens,
      budget,
      percentage: (usage.cost / budget) * 100,
      remaining: budget - usage.cost,
      cacheHitRate: this.getCacheHitRate()
    };
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate() {
    if (this.usage.cache.size === 0) return 0;
    
    // Simplified calculation
    const totalResponses = Array.from(this.usage.daily.values())
      .reduce((sum, day) => sum + day.calls, 0);
    
    return totalResponses > 0 ? (this.usage.cache.size / totalResponses) * 100 : 0;
  }

  /**
   * Generate cost optimization recommendations
   */
  generateOptimizations() {
    const optimizations = [];
    const stats = this.getUsageStats();
    
    // High cost per call
    if (stats.calls > 0 && (stats.cost / stats.calls) > 0.05) {
      optimizations.push({
        type: 'high_cost_per_call',
        description: 'Costo medio per chiamata elevato. Considera modelli più economici.',
        impact: 'medium',
        action: 'Switch to gpt-4o-mini for simple queries'
      });
    }
    
    // Low cache hit rate
    if (stats.cacheHitRate < 20 && stats.calls > 10) {
      optimizations.push({
        type: 'low_cache_rate',
        description: 'Basso tasso di cache hit. Migliora la strategia di caching.',
        impact: 'high',
        action: 'Increase cache TTL and improve cache key generation'
      });
    }
    
    // High budget usage
    if (stats.percentage > 75) {
      optimizations.push({
        type: 'high_budget_usage',
        description: `Utilizzo budget al ${stats.percentage.toFixed(1)}%. Attiva controlli più stringenti.`,
        impact: 'critical',
        action: 'Enable stricter cost controls and increase caching'
      });
    }
    
    return optimizations;
  }

  /**
   * Reset daily statistics (call at midnight)
   */
  resetDailyStats() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Keep only recent daily data
    for (const [date] of this.usage.daily) {
      if (date < yesterday) {
        this.usage.daily.delete(date);
      }
    }
    
    // Clear old alerts
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter(a => a.timestamp > oneDayAgo);
    
    console.log('📊 Daily cost statistics reset');
  }

  /**
   * Export usage data for analysis
   */
  exportUsageData() {
    return {
      daily: Object.fromEntries(this.usage.daily),
      monthly: Object.fromEntries(this.usage.monthly),
      sessions: Object.fromEntries(this.usage.sessions),
      cacheSize: this.usage.cache.size,
      alerts: this.alerts,
      config: this.config,
      optimizations: this.generateOptimizations(),
      stats: {
        daily: this.getUsageStats('daily'),
        monthly: this.getUsageStats('monthly')
      }
    };
  }

  /**
   * Clean up old data
   */
  cleanup() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    // Clean cache
    for (const [key, value] of this.usage.cache) {
      if (now - value.timestamp > this.config.cacheTTL * 1000) {
        this.usage.cache.delete(key);
      }
    }
    
    // Clean old session data
    for (const [sessionId] of this.usage.sessions) {
      // Remove sessions older than 1 week
      if (sessionId.includes('_')) {
        const sessionTime = parseInt(sessionId.split('_')[1]);
        if (now - sessionTime > oneWeek) {
          this.usage.sessions.delete(sessionId);
        }
      }
    }
    
    console.log('🧹 Cost monitoring data cleaned up');
  }
}

export default CostOptimizer;