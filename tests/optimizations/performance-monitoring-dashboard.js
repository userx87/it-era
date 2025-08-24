/**
 * Performance Monitoring & Metrics Dashboard
 * Deploy: 48 hours
 * Impact: Real-time performance tracking and optimization insights
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // Response time metrics
      responseTimes: [],
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      averageResponseTime: 0,
      
      // Request metrics
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      
      // Agent metrics
      swarmRequests: 0,
      aiRequests: 0,
      fallbackRequests: 0,
      
      // Circuit breaker metrics
      circuitBreakerActivations: 0,
      
      // Error metrics
      errors: [],
      errorRate: 0,
      
      // Timestamp
      lastUpdated: Date.now(),
      startTime: Date.now()
    };
    
    this.alerts = [];
    this.thresholds = {
      responseTime: {
        warning: 2000,   // 2s
        critical: 5000   // 5s
      },
      errorRate: {
        warning: 0.05,   // 5%
        critical: 0.10   // 10%
      },
      cacheHitRate: {
        warning: 0.40,   // 40%
        target: 0.60     // 60%
      }
    };
    
    // Keep sliding window of last 1000 requests
    this.maxMetricsHistory = 1000;
  }

  /**
   * Record a request completion
   */
  recordRequest(responseData) {
    const {
      responseTime,
      source,
      success = true,
      cached = false,
      error = null,
      sessionId = null
    } = responseData;

    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      if (error) {
        this.recordError(error, sessionId);
      }
    }
    
    if (cached) {
      this.metrics.cachedRequests++;
    }
    
    // Record response time
    if (responseTime && responseTime > 0) {
      this.metrics.responseTimes.push({
        time: responseTime,
        timestamp: Date.now(),
        source: source || 'unknown',
        cached
      });
      
      // Keep sliding window
      if (this.metrics.responseTimes.length > this.maxMetricsHistory) {
        this.metrics.responseTimes = this.metrics.responseTimes.slice(-this.maxMetricsHistory);
      }
      
      this.updateResponseTimeStats();
    }
    
    // Track by source
    switch (source) {
      case 'swarm':
      case 'swarm_protected':
        this.metrics.swarmRequests++;
        break;
      case 'ai':
      case 'ai_protected':
        this.metrics.aiRequests++;
        break;
      case 'fallback':
      case 'fallback_protected':
      case 'emergency_fallback':
        this.metrics.fallbackRequests++;
        break;
    }
    
    this.updateDerivedMetrics();
    this.checkAlerts();
  }

  /**
   * Record an error
   */
  recordError(error, sessionId = null) {
    const errorRecord = {
      message: error.message || error,
      timestamp: Date.now(),
      sessionId,
      stack: error.stack || null
    };
    
    this.metrics.errors.push(errorRecord);
    
    // Keep last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }
  }

  /**
   * Record circuit breaker activation
   */
  recordCircuitBreakerActivation(service) {
    this.metrics.circuitBreakerActivations++;
    
    this.alerts.push({
      type: 'circuit_breaker',
      service,
      message: `Circuit breaker activated for ${service}`,
      timestamp: Date.now(),
      severity: 'warning'
    });
  }

  /**
   * Update response time statistics
   */
  updateResponseTimeStats() {
    if (this.metrics.responseTimes.length === 0) return;
    
    const times = this.metrics.responseTimes.map(r => r.time).sort((a, b) => a - b);
    const len = times.length;
    
    // Calculate percentiles
    this.metrics.p50ResponseTime = this.getPercentile(times, 0.5);
    this.metrics.p95ResponseTime = this.getPercentile(times, 0.95);
    this.metrics.p99ResponseTime = this.getPercentile(times, 0.99);
    
    // Calculate average
    this.metrics.averageResponseTime = times.reduce((sum, time) => sum + time, 0) / len;
  }

  /**
   * Get percentile value
   */
  getPercentile(sortedArray, percentile) {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Update derived metrics
   */
  updateDerivedMetrics() {
    // Error rate
    this.metrics.errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.failedRequests / this.metrics.totalRequests 
      : 0;
    
    // Cache hit rate
    this.metrics.cacheHitRate = this.metrics.totalRequests > 0
      ? this.metrics.cachedRequests / this.metrics.totalRequests
      : 0;
    
    this.metrics.lastUpdated = Date.now();
  }

  /**
   * Check for alert conditions
   */
  checkAlerts() {
    const now = Date.now();
    
    // Response time alerts
    if (this.metrics.p95ResponseTime > this.thresholds.responseTime.critical) {
      this.addAlert('response_time', 'critical', 
        `P95 response time ${this.metrics.p95ResponseTime}ms exceeds critical threshold`);
    } else if (this.metrics.p95ResponseTime > this.thresholds.responseTime.warning) {
      this.addAlert('response_time', 'warning',
        `P95 response time ${this.metrics.p95ResponseTime}ms exceeds warning threshold`);
    }
    
    // Error rate alerts
    if (this.metrics.errorRate > this.thresholds.errorRate.critical) {
      this.addAlert('error_rate', 'critical',
        `Error rate ${(this.metrics.errorRate * 100).toFixed(2)}% exceeds critical threshold`);
    } else if (this.metrics.errorRate > this.thresholds.errorRate.warning) {
      this.addAlert('error_rate', 'warning',
        `Error rate ${(this.metrics.errorRate * 100).toFixed(2)}% exceeds warning threshold`);
    }
    
    // Cache hit rate alerts
    if (this.metrics.cacheHitRate < this.thresholds.cacheHitRate.warning) {
      this.addAlert('cache_hit_rate', 'warning',
        `Cache hit rate ${(this.metrics.cacheHitRate * 100).toFixed(2)}% below expected level`);
    }
  }

  /**
   * Add alert with deduplication
   */
  addAlert(type, severity, message) {
    const now = Date.now();
    
    // Check for recent similar alerts (deduplicate within 5 minutes)
    const recentSimilar = this.alerts.find(alert => 
      alert.type === type && 
      alert.severity === severity && 
      (now - alert.timestamp) < 300000
    );
    
    if (!recentSimilar) {
      this.alerts.push({
        type,
        severity,
        message,
        timestamp: now
      });
      
      // Keep last 50 alerts
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50);
      }
      
      console.warn(`🚨 ${severity.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Get current metrics summary
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const requestsPerMinute = this.metrics.totalRequests > 0 
      ? (this.metrics.totalRequests / (uptime / 60000)).toFixed(2)
      : 0;

    return {
      // Performance metrics
      responseTime: {
        average: Math.round(this.metrics.averageResponseTime),
        p50: Math.round(this.metrics.p50ResponseTime),
        p95: Math.round(this.metrics.p95ResponseTime),
        p99: Math.round(this.metrics.p99ResponseTime)
      },
      
      // Request metrics
      requests: {
        total: this.metrics.totalRequests,
        successful: this.metrics.successfulRequests,
        failed: this.metrics.failedRequests,
        cached: this.metrics.cachedRequests,
        perMinute: parseFloat(requestsPerMinute)
      },
      
      // Source distribution
      sources: {
        swarm: this.metrics.swarmRequests,
        ai: this.metrics.aiRequests,
        fallback: this.metrics.fallbackRequests
      },
      
      // Rates
      rates: {
        success: this.metrics.totalRequests > 0 
          ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
          : '0%',
        error: (this.metrics.errorRate * 100).toFixed(2) + '%',
        cache: (this.metrics.cacheHitRate * 100).toFixed(2) + '%'
      },
      
      // System health
      health: {
        status: this.getHealthStatus(),
        uptime: Math.round(uptime / 1000), // seconds
        circuitBreakerActivations: this.metrics.circuitBreakerActivations,
        activeAlerts: this.alerts.filter(a => Date.now() - a.timestamp < 3600000).length // Last hour
      },
      
      // Timestamps
      lastUpdated: this.metrics.lastUpdated,
      generatedAt: Date.now()
    };
  }

  /**
   * Determine overall health status
   */
  getHealthStatus() {
    const recentAlerts = this.alerts.filter(a => Date.now() - a.timestamp < 300000); // Last 5 minutes
    const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical');
    const warningAlerts = recentAlerts.filter(a => a.severity === 'warning');
    
    if (criticalAlerts.length > 0) return 'critical';
    if (warningAlerts.length > 2) return 'degraded';
    if (this.metrics.p95ResponseTime > this.thresholds.responseTime.warning) return 'warning';
    
    return 'healthy';
  }

  /**
   * Get detailed performance report
   */
  getDetailedReport() {
    const baseMetrics = this.getMetrics();
    const now = Date.now();
    
    return {
      ...baseMetrics,
      
      // Alert history
      alerts: this.alerts.filter(a => now - a.timestamp < 3600000), // Last hour
      
      // Error analysis
      errors: {
        recent: this.metrics.errors.filter(e => now - e.timestamp < 3600000),
        byType: this.analyzeErrorsByType(),
        topErrors: this.getTopErrors()
      },
      
      // Performance trends
      trends: {
        responseTime: this.getResponseTimeTrend(),
        requestVolume: this.getRequestVolumeTrend(),
        errorRate: this.getErrorRateTrend()
      },
      
      // Recommendations
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Analyze errors by type
   */
  analyzeErrorsByType() {
    const errorCounts = {};
    const recentErrors = this.metrics.errors.filter(e => 
      Date.now() - e.timestamp < 3600000
    );
    
    recentErrors.forEach(error => {
      const type = this.classifyError(error.message);
      errorCounts[type] = (errorCounts[type] || 0) + 1;
    });
    
    return errorCounts;
  }

  /**
   * Classify error by type
   */
  classifyError(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('timeout')) return 'timeout';
    if (msg.includes('circuit')) return 'circuit_breaker';
    if (msg.includes('ai') || msg.includes('swarm')) return 'ai_service';
    if (msg.includes('network') || msg.includes('fetch')) return 'network';
    if (msg.includes('storage') || msg.includes('kv')) return 'storage';
    
    return 'unknown';
  }

  /**
   * Get top errors by frequency
   */
  getTopErrors() {
    const errorCounts = {};
    const recentErrors = this.metrics.errors.filter(e => 
      Date.now() - e.timestamp < 3600000
    );
    
    recentErrors.forEach(error => {
      const key = error.message.substring(0, 100);
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
  }

  /**
   * Get response time trend (last hour, 5-minute buckets)
   */
  getResponseTimeTrend() {
    const buckets = 12; // 12 five-minute buckets = 1 hour
    const bucketSize = 300000; // 5 minutes in ms
    const now = Date.now();
    const trend = [];
    
    for (let i = buckets - 1; i >= 0; i--) {
      const bucketStart = now - (i + 1) * bucketSize;
      const bucketEnd = now - i * bucketSize;
      
      const bucketData = this.metrics.responseTimes.filter(rt => 
        rt.timestamp >= bucketStart && rt.timestamp < bucketEnd
      );
      
      if (bucketData.length > 0) {
        const times = bucketData.map(rt => rt.time).sort((a, b) => a - b);
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const p95Time = this.getPercentile(times, 0.95);
        
        trend.push({
          timestamp: bucketStart,
          average: Math.round(avgTime),
          p95: Math.round(p95Time),
          count: bucketData.length
        });
      } else {
        trend.push({
          timestamp: bucketStart,
          average: 0,
          p95: 0,
          count: 0
        });
      }
    }
    
    return trend;
  }

  /**
   * Get request volume trend
   */
  getRequestVolumeTrend() {
    // Simplified implementation - would expand in production
    const bucketsPerHour = 12;
    const trend = [];
    
    for (let i = 0; i < bucketsPerHour; i++) {
      trend.push({
        timestamp: Date.now() - (bucketsPerHour - i) * 300000,
        requests: Math.floor(this.metrics.totalRequests / bucketsPerHour), // Simplified
        errors: Math.floor(this.metrics.failedRequests / bucketsPerHour)
      });
    }
    
    return trend;
  }

  /**
   * Get error rate trend
   */
  getErrorRateTrend() {
    // Simplified - would expand with actual time-based error tracking
    return {
      current: this.metrics.errorRate,
      trend: 'stable', // would calculate based on historical data
      change: 0
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Response time recommendations
    if (this.metrics.p95ResponseTime > 3000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Consider enabling more aggressive caching or reducing swarm complexity',
        action: 'optimize_response_time'
      });
    }
    
    // Cache recommendations
    if (this.metrics.cacheHitRate < 0.5) {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        message: 'Cache hit rate is below 50%. Review caching strategy.',
        action: 'improve_caching'
      });
    }
    
    // Error rate recommendations
    if (this.metrics.errorRate > 0.05) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'High error rate detected. Review error logs and implement fixes.',
        action: 'reduce_errors'
      });
    }
    
    // Circuit breaker recommendations
    if (this.metrics.circuitBreakerActivations > 10) {
      recommendations.push({
        type: 'stability',
        priority: 'medium',
        message: 'Frequent circuit breaker activations. Check service dependencies.',
        action: 'review_dependencies'
      });
    }
    
    return recommendations;
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset() {
    this.metrics = {
      responseTimes: [],
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      swarmRequests: 0,
      aiRequests: 0,
      fallbackRequests: 0,
      circuitBreakerActivations: 0,
      errors: [],
      errorRate: 0,
      lastUpdated: Date.now(),
      startTime: Date.now()
    };
    
    this.alerts = [];
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics() {
    return {
      prometheus: this.getPrometheusMetrics(),
      json: this.getMetrics(),
      dashboard: this.getDashboardData()
    };
  }

  /**
   * Get Prometheus-formatted metrics
   */
  getPrometheusMetrics() {
    const metrics = this.getMetrics();
    
    return [
      `# HELP chatbot_response_time_seconds Response time in seconds`,
      `# TYPE chatbot_response_time_seconds histogram`,
      `chatbot_response_time_seconds{quantile="0.5"} ${metrics.responseTime.p50 / 1000}`,
      `chatbot_response_time_seconds{quantile="0.95"} ${metrics.responseTime.p95 / 1000}`,
      `chatbot_response_time_seconds{quantile="0.99"} ${metrics.responseTime.p99 / 1000}`,
      ``,
      `# HELP chatbot_requests_total Total number of requests`,
      `# TYPE chatbot_requests_total counter`,
      `chatbot_requests_total{status="success"} ${metrics.requests.successful}`,
      `chatbot_requests_total{status="failed"} ${metrics.requests.failed}`,
      ``,
      `# HELP chatbot_cache_hits_total Cache hits`,
      `# TYPE chatbot_cache_hits_total counter`,
      `chatbot_cache_hits_total ${metrics.requests.cached}`,
      ``,
      `# HELP chatbot_error_rate Error rate percentage`,
      `# TYPE chatbot_error_rate gauge`,
      `chatbot_error_rate ${this.metrics.errorRate}`
    ].join('\n');
  }

  /**
   * Get dashboard-specific data
   */
  getDashboardData() {
    const metrics = this.getMetrics();
    
    return {
      kpis: {
        responseTime: {
          current: metrics.responseTime.p95,
          target: 1600,
          status: metrics.responseTime.p95 <= 1600 ? 'good' : 'warning'
        },
        errorRate: {
          current: parseFloat(metrics.rates.error),
          target: 2,
          status: parseFloat(metrics.rates.error) <= 2 ? 'good' : 'warning'
        },
        cacheHitRate: {
          current: parseFloat(metrics.rates.cache),
          target: 60,
          status: parseFloat(metrics.rates.cache) >= 60 ? 'good' : 'warning'
        }
      },
      charts: {
        responseTimeTrend: this.getResponseTimeTrend(),
        requestVolume: this.getRequestVolumeTrend(),
        sourceDistribution: [
          { name: 'Swarm', value: metrics.sources.swarm },
          { name: 'AI', value: metrics.sources.ai },
          { name: 'Fallback', value: metrics.sources.fallback }
        ]
      },
      alerts: this.alerts.filter(a => Date.now() - a.timestamp < 3600000),
      recommendations: this.generateRecommendations()
    };
  }
}

// Global performance monitor instance
let globalPerformanceMonitor = null;

function initializePerformanceMonitor() {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor();
    console.log('✅ Performance monitor initialized');
  }
  return globalPerformanceMonitor;
}

export {
  PerformanceMonitor,
  initializePerformanceMonitor
};