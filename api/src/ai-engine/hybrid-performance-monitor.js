/**
 * Hybrid Performance Monitor for IT-ERA Chatbot AI Strategy
 * Real-time monitoring and optimization of GPT-4o Mini + DeepSeek hybrid approach
 * Target: <€0.04/conversation, <2s response time
 */

import { AIConfig } from './ai-config.js';

class HybridPerformanceMonitor {
  constructor() {
    this.metrics = {
      realTime: {
        currentHour: {
          totalRequests: 0,
          totalCost: 0,
          totalResponseTime: 0,
          successfulRequests: 0,
          failedRequests: 0,
          modelBreakdown: new Map(),
          averageCostPerConversation: 0,
          averageResponseTime: 0
        },
        currentDay: {
          totalRequests: 0,
          totalCost: 0,
          successRate: 0,
          modelUsagePercentage: new Map(),
          costSavingsVsBaseline: 0,
          targetsMet: {
            costPerConversation: false,
            responseTime: false,
            overallPerformance: false
          }
        }
      },
      historical: {
        hourlyData: [], // Last 24 hours
        dailyData: [], // Last 30 days
        trends: {
          costTrend: 'stable',
          performanceTrend: 'stable',
          qualityTrend: 'stable'
        }
      },
      alerts: [],
      optimizationRecommendations: []
    };

    // Performance targets from config
    this.targets = {
      costPerConversation: AIConfig.OPENROUTER.HYBRID_STRATEGY.TARGET_COST_PER_CONVERSATION,
      responseTime: AIConfig.OPENROUTER.HYBRID_STRATEGY.TARGET_RESPONSE_TIME_MS,
      successRate: 0.95, // 95% success rate target
      costSavings: 0.30 // 30% cost savings vs single model approach
    };

    // Baseline costs for comparison (single model approach)
    this.baseline = {
      claude35Sonnet: 0.085, // Estimated €0.085 per conversation
      gpt4o: 0.065 // Estimated €0.065 per conversation
    };

    // Alert thresholds
    this.alertThresholds = {
      highCostPerConversation: this.targets.costPerConversation * 1.2,
      slowResponseTime: this.targets.responseTime * 1.5,
      lowSuccessRate: 0.85,
      costSpikePercentage: 50 // 50% increase from baseline
    };

    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(intervalMs = 60000) { // Default: check every minute
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectRealTimeMetrics();
      this.analyzePerformanceTrends();
      this.checkAlerts();
      this.generateOptimizationRecommendations();
    }, intervalMs);

    console.log('🔄 Hybrid Performance Monitor started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Hybrid Performance Monitor stopped');
  }

  /**
   * Track individual request performance
   */
  trackRequest(model, responseTime, cost, success, context = {}) {
    const currentHour = this.metrics.realTime.currentHour;
    
    // Update basic metrics
    currentHour.totalRequests++;
    currentHour.totalCost += cost;
    currentHour.totalResponseTime += responseTime;
    
    if (success) {
      currentHour.successfulRequests++;
    } else {
      currentHour.failedRequests++;
    }

    // Update model breakdown
    if (!currentHour.modelBreakdown.has(model)) {
      currentHour.modelBreakdown.set(model, {
        requests: 0,
        totalCost: 0,
        totalResponseTime: 0,
        successCount: 0,
        avgCost: 0,
        avgResponseTime: 0,
        successRate: 0
      });
    }

    const modelStats = currentHour.modelBreakdown.get(model);
    modelStats.requests++;
    modelStats.totalCost += cost;
    modelStats.totalResponseTime += responseTime;
    if (success) modelStats.successCount++;

    // Update averages
    modelStats.avgCost = modelStats.totalCost / modelStats.requests;
    modelStats.avgResponseTime = modelStats.totalResponseTime / modelStats.requests;
    modelStats.successRate = modelStats.successCount / modelStats.requests;

    // Update overall averages
    currentHour.averageCostPerConversation = currentHour.totalCost / currentHour.totalRequests;
    currentHour.averageResponseTime = currentHour.totalResponseTime / currentHour.totalRequests;

    // Log significant events
    this.logSignificantEvents(model, responseTime, cost, success, context);

    // Immediate alert check for critical issues
    this.checkImmediateAlerts(model, responseTime, cost, success);
  }

  /**
   * Log significant events for analysis
   */
  logSignificantEvents(model, responseTime, cost, success, context) {
    // Log high cost requests
    if (cost > this.targets.costPerConversation * 2) {
      console.warn(`💸 High cost request: ${model} - €${cost.toFixed(6)} (${context.sessionId})`);
    }

    // Log slow responses
    if (responseTime > this.targets.responseTime * 2) {
      console.warn(`🐌 Slow response: ${model} - ${responseTime}ms (${context.sessionId})`);
    }

    // Log failures
    if (!success) {
      console.error(`❌ Failed request: ${model} - ${context.error || 'Unknown error'} (${context.sessionId})`);
    }

    // Log successful optimizations
    if (success && cost < this.targets.costPerConversation && responseTime < this.targets.responseTime) {
      console.log(`✅ Optimal request: ${model} - €${cost.toFixed(6)}, ${responseTime}ms (${context.sessionId})`);
    }
  }

  /**
   * Check for immediate alerts
   */
  checkImmediateAlerts(model, responseTime, cost, success) {
    const now = Date.now();

    // Cost spike alert
    if (cost > this.alertThresholds.highCostPerConversation) {
      this.addAlert({
        type: 'cost_spike',
        severity: 'high',
        message: `High cost detected: €${cost.toFixed(6)} with model ${model}`,
        timestamp: now,
        model,
        value: cost
      });
    }

    // Performance alert
    if (responseTime > this.alertThresholds.slowResponseTime) {
      this.addAlert({
        type: 'slow_response',
        severity: 'medium',
        message: `Slow response detected: ${responseTime}ms with model ${model}`,
        timestamp: now,
        model,
        value: responseTime
      });
    }

    // Failure alert
    if (!success) {
      this.addAlert({
        type: 'request_failure',
        severity: 'high',
        message: `Request failure with model ${model}`,
        timestamp: now,
        model
      });
    }
  }

  /**
   * Add alert to the system
   */
  addAlert(alert) {
    this.metrics.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }

    // Log based on severity
    if (alert.severity === 'high') {
      console.error(`🚨 HIGH ALERT: ${alert.message}`);
    } else if (alert.severity === 'medium') {
      console.warn(`⚠️ MEDIUM ALERT: ${alert.message}`);
    } else {
      console.log(`ℹ️ INFO ALERT: ${alert.message}`);
    }
  }

  /**
   * Collect real-time metrics
   */
  collectRealTimeMetrics() {
    const currentHour = this.metrics.realTime.currentHour;
    const currentDay = this.metrics.realTime.currentDay;

    // Calculate success rate
    const successRate = currentHour.totalRequests > 0 ? 
      currentHour.successfulRequests / currentHour.totalRequests : 0;

    // Update daily metrics
    currentDay.successRate = successRate;
    currentDay.totalRequests += currentHour.totalRequests;
    currentDay.totalCost += currentHour.totalCost;

    // Check if targets are met
    currentDay.targetsMet = {
      costPerConversation: currentHour.averageCostPerConversation <= this.targets.costPerConversation,
      responseTime: currentHour.averageResponseTime <= this.targets.responseTime,
      overallPerformance: successRate >= this.targets.successRate
    };

    // Calculate cost savings vs baseline
    const avgBaselineCost = (this.baseline.claude35Sonnet + this.baseline.gpt4o) / 2;
    currentDay.costSavingsVsBaseline = ((avgBaselineCost - currentHour.averageCostPerConversation) / avgBaselineCost) * 100;

    // Update model usage percentages
    for (const [model, stats] of currentHour.modelBreakdown.entries()) {
      const percentage = (stats.requests / currentHour.totalRequests) * 100;
      currentDay.modelUsagePercentage.set(model, percentage);
    }
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends() {
    // Store hourly data
    this.metrics.historical.hourlyData.push({
      timestamp: Date.now(),
      ...this.metrics.realTime.currentHour
    });

    // Keep only last 24 hours
    if (this.metrics.historical.hourlyData.length > 24) {
      this.metrics.historical.hourlyData = this.metrics.historical.hourlyData.slice(-24);
    }

    // Calculate trends
    this.calculateTrends();

    // Reset hourly metrics
    this.resetHourlyMetrics();
  }

  /**
   * Calculate performance trends
   */
  calculateTrends() {
    const hourlyData = this.metrics.historical.hourlyData;
    if (hourlyData.length < 3) return; // Need at least 3 data points

    const recent = hourlyData.slice(-3);
    const trends = this.metrics.historical.trends;

    // Cost trend
    const costValues = recent.map(d => d.averageCostPerConversation);
    trends.costTrend = this.calculateTrendDirection(costValues);

    // Performance trend
    const responseTimeValues = recent.map(d => d.averageResponseTime);
    trends.performanceTrend = this.calculateTrendDirection(responseTimeValues, true); // Reverse for performance

    // Quality trend
    const successRateValues = recent.map(d => d.successfulRequests / Math.max(d.totalRequests, 1));
    trends.qualityTrend = this.calculateTrendDirection(successRateValues);
  }

  /**
   * Calculate trend direction
   */
  calculateTrendDirection(values, reverse = false) {
    if (values.length < 2) return 'stable';

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    const threshold = 5; // 5% change threshold
    
    if (Math.abs(change) < threshold) return 'stable';
    
    const increasing = change > 0;
    if (reverse) {
      return increasing ? 'declining' : 'improving';
    } else {
      return increasing ? 'improving' : 'declining';
    }
  }

  /**
   * Check for performance alerts
   */
  checkAlerts() {
    const currentHour = this.metrics.realTime.currentHour;
    const currentDay = this.metrics.realTime.currentDay;
    const now = Date.now();

    // Overall performance alerts
    if (!currentDay.targetsMet.costPerConversation) {
      this.addAlert({
        type: 'cost_target_missed',
        severity: 'medium',
        message: `Cost target missed: €${currentHour.averageCostPerConversation.toFixed(6)} > €${this.targets.costPerConversation}`,
        timestamp: now,
        value: currentHour.averageCostPerConversation
      });
    }

    if (!currentDay.targetsMet.responseTime) {
      this.addAlert({
        type: 'response_time_target_missed',
        severity: 'medium',
        message: `Response time target missed: ${Math.round(currentHour.averageResponseTime)}ms > ${this.targets.responseTime}ms`,
        timestamp: now,
        value: currentHour.averageResponseTime
      });
    }

    // Success rate alert
    if (currentDay.successRate < this.alertThresholds.lowSuccessRate) {
      this.addAlert({
        type: 'low_success_rate',
        severity: 'high',
        message: `Low success rate detected: ${(currentDay.successRate * 100).toFixed(2)}%`,
        timestamp: now,
        value: currentDay.successRate
      });
    }

    // Trend alerts
    const trends = this.metrics.historical.trends;
    if (trends.costTrend === 'declining') {
      this.addAlert({
        type: 'cost_trend_negative',
        severity: 'medium',
        message: 'Cost efficiency is declining over time',
        timestamp: now
      });
    }

    if (trends.performanceTrend === 'declining') {
      this.addAlert({
        type: 'performance_trend_negative',
        severity: 'medium',
        message: 'Response time performance is declining',
        timestamp: now
      });
    }
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations() {
    const recommendations = [];
    const currentHour = this.metrics.realTime.currentHour;
    const currentDay = this.metrics.realTime.currentDay;
    
    // Cost optimization recommendations
    if (currentHour.averageCostPerConversation > this.targets.costPerConversation) {
      const gpt4oMiniUsage = currentDay.modelUsagePercentage.get('openai/gpt-4o-mini') || 0;
      const deepseekUsage = currentDay.modelUsagePercentage.get('deepseek/deepseek-chat') || 0;
      
      if (gpt4oMiniUsage > deepseekUsage) {
        recommendations.push({
          type: 'cost_optimization',
          priority: 'high',
          action: 'increase_deepseek_usage',
          message: 'Consider routing more technical conversations to DeepSeek to reduce costs',
          expectedSavings: `€${((currentHour.averageCostPerConversation - this.targets.costPerConversation) * 0.6).toFixed(6)} per conversation`
        });
      }
    }

    // Performance optimization recommendations
    if (currentHour.averageResponseTime > this.targets.responseTime) {
      recommendations.push({
        type: 'performance_optimization',
        priority: 'medium',
        action: 'optimize_prompts',
        message: 'Consider reducing prompt complexity or switching to faster models for simple queries',
        expectedImprovement: `${Math.round((currentHour.averageResponseTime - this.targets.responseTime) * 0.4)}ms reduction`
      });
    }

    // Quality optimization recommendations
    if (currentDay.successRate < this.targets.successRate) {
      recommendations.push({
        type: 'quality_optimization',
        priority: 'high',
        action: 'improve_error_handling',
        message: 'Implement better error handling and fallback mechanisms',
        expectedImprovement: `+${((this.targets.successRate - currentDay.successRate) * 100).toFixed(1)}% success rate`
      });
    }

    // Model balance recommendations
    const modelBreakdown = Array.from(currentDay.modelUsagePercentage.entries());
    const mostUsedModel = modelBreakdown.sort(([,a], [,b]) => b - a)[0];
    
    if (mostUsedModel && mostUsedModel[1] > 80) {
      recommendations.push({
        type: 'load_balancing',
        priority: 'low',
        action: 'rebalance_models',
        message: `${mostUsedModel[0]} is handling ${mostUsedModel[1].toFixed(1)}% of requests. Consider better load distribution.`,
        expectedBenefit: 'Improved resilience and potential cost optimization'
      });
    }

    // Update recommendations
    this.metrics.optimizationRecommendations = recommendations;
  }

  /**
   * Reset hourly metrics
   */
  resetHourlyMetrics() {
    this.metrics.realTime.currentHour = {
      totalRequests: 0,
      totalCost: 0,
      totalResponseTime: 0,
      successfulRequests: 0,
      failedRequests: 0,
      modelBreakdown: new Map(),
      averageCostPerConversation: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    const currentHour = this.metrics.realTime.currentHour;
    const currentDay = this.metrics.realTime.currentDay;
    const trends = this.metrics.historical.trends;

    return {
      timestamp: new Date().toISOString(),
      monitoring: {
        status: this.isMonitoring ? 'active' : 'inactive',
        uptime: this.isMonitoring ? 'running' : 'stopped'
      },
      realTime: {
        current: {
          requests: currentHour.totalRequests,
          avgCostPerConversation: Number(currentHour.averageCostPerConversation.toFixed(6)),
          avgResponseTime: Math.round(currentHour.averageResponseTime),
          successRate: Number(((currentHour.successfulRequests / Math.max(currentHour.totalRequests, 1)) * 100).toFixed(2))
        },
        targets: {
          costPerConversation: this.targets.costPerConversation,
          responseTime: this.targets.responseTime,
          successRate: this.targets.successRate
        },
        targetsMet: currentDay.targetsMet
      },
      performance: {
        trends: trends,
        costSavingsVsBaseline: Number(currentDay.costSavingsVsBaseline.toFixed(2)),
        modelUsage: Object.fromEntries(currentDay.modelUsagePercentage.entries())
      },
      alerts: {
        total: this.metrics.alerts.length,
        recent: this.metrics.alerts.slice(-10), // Last 10 alerts
        critical: this.metrics.alerts.filter(a => a.severity === 'high').length
      },
      recommendations: this.metrics.optimizationRecommendations,
      insights: this.generatePerformanceInsights()
    };
  }

  /**
   * Generate performance insights
   */
  generatePerformanceInsights() {
    const insights = [];
    const currentHour = this.metrics.realTime.currentHour;
    const currentDay = this.metrics.realTime.currentDay;

    // Performance status
    if (currentDay.targetsMet.costPerConversation && currentDay.targetsMet.responseTime && currentDay.targetsMet.overallPerformance) {
      insights.push('🎯 All performance targets are being met successfully!');
    } else {
      insights.push('⚠️ Some performance targets need attention');
    }

    // Cost effectiveness
    if (currentDay.costSavingsVsBaseline > 20) {
      insights.push(`💰 Excellent cost savings: ${currentDay.costSavingsVsBaseline.toFixed(1)}% vs single-model approach`);
    } else if (currentDay.costSavingsVsBaseline > 0) {
      insights.push(`💸 Moderate cost savings: ${currentDay.costSavingsVsBaseline.toFixed(1)}% vs single-model approach`);
    } else {
      insights.push('📈 Cost optimization opportunities available');
    }

    // Model efficiency
    const modelBreakdown = Array.from(currentDay.modelUsagePercentage.entries());
    if (modelBreakdown.length > 1) {
      const balance = Math.abs(modelBreakdown[0][1] - modelBreakdown[1][1]);
      if (balance < 20) {
        insights.push('⚖️ Good model usage balance maintained');
      } else {
        insights.push('🔄 Consider rebalancing model usage for optimal performance');
      }
    }

    // Trend analysis
    const trends = this.metrics.historical.trends;
    if (trends.costTrend === 'improving' && trends.performanceTrend === 'improving') {
      insights.push('📈 Both cost and performance trends are positive');
    } else if (trends.costTrend === 'declining' || trends.performanceTrend === 'declining') {
      insights.push('📉 Some performance metrics are declining - review needed');
    }

    return insights;
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics() {
    return {
      realTimeMetrics: this.metrics.realTime,
      historicalData: this.metrics.historical,
      alerts: this.metrics.alerts,
      recommendations: this.metrics.optimizationRecommendations,
      configuration: {
        targets: this.targets,
        baseline: this.baseline,
        alertThresholds: this.alertThresholds
      },
      exportTimestamp: new Date().toISOString()
    };
  }

  /**
   * Health check for monitor itself
   */
  healthCheck() {
    return {
      status: this.isMonitoring ? 'healthy' : 'inactive',
      monitoring: this.isMonitoring,
      dataPoints: this.metrics.historical.hourlyData.length,
      alertsActive: this.metrics.alerts.length,
      recommendationsCount: this.metrics.optimizationRecommendations.length,
      lastUpdate: new Date().toISOString()
    };
  }
}

// Create singleton instance
const hybridPerformanceMonitor = new HybridPerformanceMonitor();

export { hybridPerformanceMonitor, HybridPerformanceMonitor };
export default hybridPerformanceMonitor;