/**
 * ID System Monitoring Dashboard
 * Real-time dashboard for conversation ID system metrics and health
 * Provides REST API endpoints and WebSocket real-time updates
 */

import idSystemMonitor from './id-system-monitor.js';
import { healthMonitor } from './health-monitor.js';

class IDSystemDashboard {
  constructor(options = {}) {
    this.options = {
      realTimeUpdates: options.realTimeUpdates !== false,
      updateInterval: options.updateInterval || 5000, // 5 seconds
      maxDataPoints: options.maxDataPoints || 100,
      enableWebSocket: options.enableWebSocket !== false,
      ...options
    };

    this.realTimeData = {
      performance: [],
      alerts: [],
      health: [],
      storage: []
    };

    this.connectedClients = new Set();
    this.updateInterval = null;
  }

  /**
   * Initialize dashboard
   */
  initialize() {
    if (this.options.realTimeUpdates) {
      this.startRealTimeUpdates();
    }
    console.log('📊 ID System Dashboard initialized');
  }

  /**
   * Start real-time data collection
   */
  startRealTimeUpdates() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      this.collectRealTimeData();
      this.broadcastUpdates();
    }, this.options.updateInterval);

    console.log('🔄 Real-time dashboard updates started');
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('⏹️ Real-time dashboard updates stopped');
  }

  /**
   * Collect real-time data
   */
  collectRealTimeData() {
    const timestamp = Date.now();
    const dashboardData = idSystemMonitor.getDashboardData();

    // Performance data point
    const performancePoint = {
      timestamp,
      idGeneration: {
        averageTime: dashboardData.performance.idGeneration.averageTime,
        successRate: dashboardData.performance.idGeneration.successRate,
        rate: parseFloat(dashboardData.performance.idGeneration.rate) || 0
      },
      storage: {
        readTime: dashboardData.performance.storage.averageReadTime,
        writeTime: dashboardData.performance.storage.averageWriteTime,
        successRate: dashboardData.performance.storage.successRate,
        totalIds: dashboardData.performance.storage.usage.totalIds
      },
      caching: {
        hitRate: dashboardData.performance.caching.hitRate,
        responseTime: dashboardData.performance.caching.averageResponseTime
      }
    };

    this.realTimeData.performance.push(performancePoint);

    // Health data point
    const healthPoint = {
      timestamp,
      overallHealth: dashboardData.health.systemStatus,
      healthScore: this.calculateHealthScore(dashboardData),
      alertCount: dashboardData.alerts.total,
      criticalAlerts: dashboardData.alerts.bySeverity.critical
    };

    this.realTimeData.health.push(healthPoint);

    // Storage data point
    const storagePoint = {
      timestamp,
      totalIds: dashboardData.performance.storage.usage.totalIds,
      activeIds: dashboardData.performance.storage.usage.activeIds,
      expiredIds: dashboardData.performance.storage.usage.expiredIds,
      storageSize: dashboardData.performance.storage.usage.storageSize
    };

    this.realTimeData.storage.push(storagePoint);

    // Keep only recent data points
    for (const key in this.realTimeData) {
      if (this.realTimeData[key].length > this.options.maxDataPoints) {
        this.realTimeData[key] = this.realTimeData[key].slice(-this.options.maxDataPoints);
      }
    }
  }

  /**
   * Calculate health score for dashboard
   */
  calculateHealthScore(dashboardData) {
    let score = 100;

    // ID Generation health (30% weight)
    const idGenScore = Math.min(100, dashboardData.performance.idGeneration.successRate);
    const idGenTime = dashboardData.performance.idGeneration.averageTime;
    const idGenTimeScore = Math.max(0, 100 - (idGenTime / 2)); // Penalty for slow generation
    const idGenHealth = (idGenScore * 0.7) + (idGenTimeScore * 0.3);

    // Storage health (25% weight)
    const storageScore = Math.min(100, dashboardData.performance.storage.successRate);
    const storageTime = (dashboardData.performance.storage.averageReadTime + dashboardData.performance.storage.averageWriteTime) / 2;
    const storageTimeScore = Math.max(0, 100 - (storageTime / 5)); // Penalty for slow storage
    const storageHealth = (storageScore * 0.8) + (storageTimeScore * 0.2);

    // Cache health (20% weight)
    const cacheScore = Math.min(100, dashboardData.performance.caching.hitRate);

    // Alert health (15% weight)
    const alertScore = Math.max(0, 100 - (dashboardData.alerts.bySeverity.critical * 20) - (dashboardData.alerts.bySeverity.high * 10));

    // Duplicate health (10% weight)
    const duplicateRate = parseFloat(dashboardData.quality.overall.duplicateRate) || 0;
    const duplicateScore = Math.max(0, 100 - (duplicateRate * 50));

    // Weighted average
    score = (
      (idGenHealth * 0.30) +
      (storageHealth * 0.25) +
      (cacheScore * 0.20) +
      (alertScore * 0.15) +
      (duplicateScore * 0.10)
    );

    return Math.round(score);
  }

  /**
   * Broadcast updates to connected clients
   */
  broadcastUpdates() {
    if (this.connectedClients.size === 0) return;

    const update = {
      type: 'dashboard_update',
      timestamp: Date.now(),
      data: {
        realTime: this.realTimeData,
        current: idSystemMonitor.getDashboardData()
      }
    };

    // In a real implementation, this would use WebSocket
    // For now, we'll store the latest update for polling
    this.latestUpdate = update;
  }

  /**
   * Get dashboard overview data
   */
  getOverview() {
    const dashboardData = idSystemMonitor.getDashboardData();
    const healthData = healthMonitor.getCurrentHealth();

    return {
      timestamp: new Date().toISOString(),
      status: {
        overall: dashboardData.health.systemStatus,
        healthScore: this.calculateHealthScore(dashboardData),
        isMonitoring: dashboardData.monitoring.status === 'active'
      },
      performance: {
        idGeneration: {
          total: dashboardData.performance.idGeneration.totalGenerated,
          averageTime: dashboardData.performance.idGeneration.averageTime,
          successRate: dashboardData.performance.idGeneration.successRate,
          rate: dashboardData.performance.idGeneration.rate
        },
        storage: {
          operations: dashboardData.performance.storage.totalOperations,
          readTime: dashboardData.performance.storage.averageReadTime,
          writeTime: dashboardData.performance.storage.averageWriteTime,
          successRate: dashboardData.performance.storage.successRate,
          usage: dashboardData.performance.storage.usage
        },
        caching: {
          hitRate: dashboardData.performance.caching.hitRate,
          responseTime: dashboardData.performance.caching.averageResponseTime,
          requests: dashboardData.performance.caching.totalRequests
        }
      },
      quality: {
        duplicates: {
          detected: dashboardData.quality.duplicates.detected,
          prevented: dashboardData.quality.duplicates.prevented,
          rate: dashboardData.quality.overall.duplicateRate,
          preventionRate: dashboardData.quality.overall.preventionEfficiency
        },
        validation: dashboardData.quality.validation
      },
      alerts: {
        total: dashboardData.alerts.total,
        breakdown: dashboardData.alerts.bySeverity,
        recent: dashboardData.alerts.recent
      },
      uptime: dashboardData.uptime,
      insights: dashboardData.insights,
      trends: dashboardData.trends
    };
  }

  /**
   * Get detailed performance metrics
   */
  getPerformanceMetrics(timeframe = '1h') {
    const now = Date.now();
    const timeframes = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };

    const timeLimit = timeframes[timeframe] || timeframes['1h'];
    const cutoff = now - timeLimit;

    // Filter real-time data by timeframe
    const filteredData = {
      performance: this.realTimeData.performance.filter(p => p.timestamp > cutoff),
      health: this.realTimeData.health.filter(h => h.timestamp > cutoff),
      storage: this.realTimeData.storage.filter(s => s.timestamp > cutoff)
    };

    // Calculate aggregated metrics
    const metrics = this.calculateAggregatedMetrics(filteredData);

    return {
      timeframe,
      period: {
        start: new Date(cutoff).toISOString(),
        end: new Date(now).toISOString(),
        duration: timeLimit
      },
      data: filteredData,
      aggregated: metrics,
      summary: this.generatePerformanceSummary(metrics)
    };
  }

  /**
   * Calculate aggregated metrics from filtered data
   */
  calculateAggregatedMetrics(data) {
    const { performance, health, storage } = data;

    if (performance.length === 0) {
      return { status: 'no_data', message: 'No data available for specified timeframe' };
    }

    // Performance aggregations
    const idGenTimes = performance.map(p => p.idGeneration.averageTime).filter(t => t > 0);
    const idGenRates = performance.map(p => p.idGeneration.rate).filter(r => r > 0);
    const hitRates = performance.map(p => p.caching.hitRate).filter(h => h >= 0);

    // Health aggregations
    const healthScores = health.map(h => h.healthScore).filter(s => s > 0);
    const alertCounts = health.map(h => h.alertCount);

    // Storage aggregations
    const storageSizes = storage.map(s => s.storageSize).filter(size => size > 0);

    return {
      idGeneration: {
        averageTime: {
          min: Math.min(...idGenTimes),
          max: Math.max(...idGenTimes),
          avg: idGenTimes.reduce((a, b) => a + b, 0) / idGenTimes.length,
          median: this.calculateMedian(idGenTimes)
        },
        rate: {
          min: Math.min(...idGenRates),
          max: Math.max(...idGenRates),
          avg: idGenRates.reduce((a, b) => a + b, 0) / idGenRates.length
        }
      },
      caching: {
        hitRate: {
          min: Math.min(...hitRates),
          max: Math.max(...hitRates),
          avg: hitRates.reduce((a, b) => a + b, 0) / hitRates.length
        }
      },
      health: {
        score: {
          min: Math.min(...healthScores),
          max: Math.max(...healthScores),
          avg: healthScores.reduce((a, b) => a + b, 0) / healthScores.length
        },
        alerts: {
          total: Math.max(...alertCounts),
          average: alertCounts.reduce((a, b) => a + b, 0) / alertCounts.length
        }
      },
      storage: {
        size: {
          min: Math.min(...storageSizes),
          max: Math.max(...storageSizes),
          growth: storageSizes.length > 1 ? ((storageSizes[storageSizes.length - 1] - storageSizes[0]) / storageSizes[0] * 100) : 0
        }
      },
      dataPoints: performance.length
    };
  }

  /**
   * Calculate median value
   */
  calculateMedian(values) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  /**
   * Generate performance summary
   */
  generatePerformanceSummary(metrics) {
    if (metrics.status === 'no_data') {
      return { status: 'no_data', insights: [] };
    }

    const summary = [];

    // ID Generation performance
    if (metrics.idGeneration.averageTime.avg < 50) {
      summary.push({ type: 'positive', message: `Excellent ID generation performance: ${metrics.idGeneration.averageTime.avg.toFixed(2)}ms average` });
    } else if (metrics.idGeneration.averageTime.avg > 100) {
      summary.push({ type: 'negative', message: `Slow ID generation: ${metrics.idGeneration.averageTime.avg.toFixed(2)}ms average` });
    }

    // Cache performance
    if (metrics.caching.hitRate.avg > 90) {
      summary.push({ type: 'positive', message: `High cache efficiency: ${metrics.caching.hitRate.avg.toFixed(2)}% hit rate` });
    } else if (metrics.caching.hitRate.avg < 70) {
      summary.push({ type: 'warning', message: `Low cache efficiency: ${metrics.caching.hitRate.avg.toFixed(2)}% hit rate` });
    }

    // Health trends
    if (metrics.health.score.avg > 90) {
      summary.push({ type: 'positive', message: `Excellent system health: ${metrics.health.score.avg.toFixed(0)} average score` });
    } else if (metrics.health.score.avg < 70) {
      summary.push({ type: 'negative', message: `System health concerns: ${metrics.health.score.avg.toFixed(0)} average score` });
    }

    // Storage growth
    if (metrics.storage.size.growth > 50) {
      summary.push({ type: 'warning', message: `Rapid storage growth: ${metrics.storage.size.growth.toFixed(2)}% increase` });
    }

    return {
      status: 'ok',
      insights: summary,
      dataQuality: metrics.dataPoints > 10 ? 'good' : 'limited'
    };
  }

  /**
   * Get alert history and analysis
   */
  getAlertAnalysis(timeframe = '24h') {
    const dashboardData = idSystemMonitor.getDashboardData();
    const now = Date.now();
    
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const timeLimit = timeframes[timeframe] || timeframes['24h'];
    const cutoff = now - timeLimit;

    // Get all alerts from monitor
    const allAlerts = idSystemMonitor.alertHistory || [];
    const filteredAlerts = allAlerts.filter(alert => alert.timestamp > cutoff);

    // Analyze alert patterns
    const analysis = this.analyzeAlertPatterns(filteredAlerts);

    return {
      timeframe,
      period: {
        start: new Date(cutoff).toISOString(),
        end: new Date(now).toISOString()
      },
      alerts: {
        total: filteredAlerts.length,
        bySeverity: {
          critical: filteredAlerts.filter(a => a.severity === 'critical').length,
          high: filteredAlerts.filter(a => a.severity === 'high').length,
          medium: filteredAlerts.filter(a => a.severity === 'medium').length,
          low: filteredAlerts.filter(a => a.severity === 'low').length
        },
        byType: this.groupAlertsByType(filteredAlerts),
        byComponent: this.groupAlertsByComponent(filteredAlerts),
        timeline: this.createAlertTimeline(filteredAlerts)
      },
      analysis,
      recommendations: this.generateAlertRecommendations(analysis)
    };
  }

  /**
   * Analyze alert patterns
   */
  analyzeAlertPatterns(alerts) {
    if (alerts.length === 0) {
      return { status: 'no_alerts', message: 'No alerts in specified timeframe' };
    }

    // Pattern detection
    const patterns = {
      spikes: this.detectAlertSpikes(alerts),
      recurring: this.detectRecurringAlerts(alerts),
      escalation: this.detectAlertEscalation(alerts)
    };

    // Frequency analysis
    const hourly = this.groupAlertsByHour(alerts);
    const daily = this.groupAlertsByDay(alerts);

    // Component analysis
    const mostProblematic = this.findMostProblematicComponents(alerts);

    return {
      status: 'analyzed',
      totalAlerts: alerts.length,
      alertRate: (alerts.length / ((Date.now() - Math.min(...alerts.map(a => a.timestamp))) / 3600000)).toFixed(2) + ' alerts/hour',
      patterns,
      frequency: { hourly, daily },
      problematicComponents: mostProblematic,
      severity: {
        distribution: this.calculateSeverityDistribution(alerts),
        trend: this.calculateSeverityTrend(alerts)
      }
    };
  }

  /**
   * Detect alert spikes
   */
  detectAlertSpikes(alerts) {
    // Group alerts by 15-minute windows
    const windows = {};
    alerts.forEach(alert => {
      const window = Math.floor(alert.timestamp / (15 * 60 * 1000)) * (15 * 60 * 1000);
      windows[window] = (windows[window] || 0) + 1;
    });

    const counts = Object.values(windows);
    const average = counts.reduce((a, b) => a + b, 0) / counts.length;
    const threshold = Math.max(5, average * 3); // Spike if 3x average or >5 alerts

    const spikes = Object.entries(windows)
      .filter(([_, count]) => count >= threshold)
      .map(([timestamp, count]) => ({
        timestamp: parseInt(timestamp),
        count,
        severity: count > threshold * 2 ? 'severe' : 'moderate'
      }));

    return {
      detected: spikes.length > 0,
      count: spikes.length,
      spikes: spikes.sort((a, b) => b.count - a.count).slice(0, 5), // Top 5
      analysis: spikes.length > 0 ? 
        `${spikes.length} alert spikes detected, highest: ${Math.max(...spikes.map(s => s.count))} alerts` :
        'No significant alert spikes detected'
    };
  }

  /**
   * Detect recurring alerts
   */
  detectRecurringAlerts(alerts) {
    const byTypeAndComponent = {};
    
    alerts.forEach(alert => {
      const key = `${alert.type}:${alert.component}`;
      if (!byTypeAndComponent[key]) {
        byTypeAndComponent[key] = [];
      }
      byTypeAndComponent[key].push(alert.timestamp);
    });

    const recurring = Object.entries(byTypeAndComponent)
      .filter(([_, timestamps]) => timestamps.length >= 3)
      .map(([key, timestamps]) => {
        const [type, component] = key.split(':');
        const intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
          intervals.push(timestamps[i] - timestamps[i-1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        
        return {
          type,
          component,
          count: timestamps.length,
          averageInterval: avgInterval,
          lastOccurrence: Math.max(...timestamps),
          pattern: avgInterval < 3600000 ? 'frequent' : avgInterval < 86400000 ? 'hourly' : 'daily'
        };
      });

    return {
      detected: recurring.length > 0,
      count: recurring.length,
      alerts: recurring.sort((a, b) => b.count - a.count),
      analysis: recurring.length > 0 ?
        `${recurring.length} recurring alert patterns detected` :
        'No recurring alert patterns detected'
    };
  }

  /**
   * Detect alert escalation patterns
   */
  detectAlertEscalation(alerts) {
    // Look for patterns where alerts escalate from low to high severity
    const escalations = [];
    const sortedAlerts = alerts.sort((a, b) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < sortedAlerts.length - 1; i++) {
      const current = sortedAlerts[i];
      const next = sortedAlerts[i + 1];
      
      if (current.component === next.component && 
          this.getSeverityLevel(current.severity) < this.getSeverityLevel(next.severity) &&
          next.timestamp - current.timestamp < 1800000) { // Within 30 minutes
        escalations.push({
          component: current.component,
          from: current.severity,
          to: next.severity,
          timespan: next.timestamp - current.timestamp,
          startTime: current.timestamp
        });
      }
    }

    return {
      detected: escalations.length > 0,
      count: escalations.length,
      escalations: escalations.slice(-10), // Last 10
      analysis: escalations.length > 0 ?
        `${escalations.length} alert escalations detected` :
        'No alert escalations detected'
    };
  }

  /**
   * Get numeric severity level for comparison
   */
  getSeverityLevel(severity) {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity] || 0;
  }

  /**
   * Group alerts by type
   */
  groupAlertsByType(alerts) {
    const grouped = {};
    alerts.forEach(alert => {
      grouped[alert.type] = (grouped[alert.type] || 0) + 1;
    });
    return Object.entries(grouped)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * Group alerts by component
   */
  groupAlertsByComponent(alerts) {
    const grouped = {};
    alerts.forEach(alert => {
      grouped[alert.component] = (grouped[alert.component] || 0) + 1;
    });
    return Object.entries(grouped)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([component, count]) => ({ component, count }));
  }

  /**
   * Create alert timeline
   */
  createAlertTimeline(alerts) {
    const timeline = {};
    alerts.forEach(alert => {
      const hour = new Date(alert.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
      if (!timeline[hour]) {
        timeline[hour] = { total: 0, bySeverity: {} };
      }
      timeline[hour].total++;
      timeline[hour].bySeverity[alert.severity] = (timeline[hour].bySeverity[alert.severity] || 0) + 1;
    });

    return Object.entries(timeline)
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => new Date(a.hour) - new Date(b.hour));
  }

  /**
   * Find most problematic components
   */
  findMostProblematicComponents(alerts) {
    const componentScore = {};
    
    alerts.forEach(alert => {
      const component = alert.component;
      if (!componentScore[component]) {
        componentScore[component] = { score: 0, alerts: 0, critical: 0, high: 0 };
      }
      
      componentScore[component].alerts++;
      
      // Weight by severity
      const weights = { low: 1, medium: 2, high: 3, critical: 5 };
      componentScore[component].score += weights[alert.severity] || 1;
      
      if (alert.severity === 'critical') componentScore[component].critical++;
      if (alert.severity === 'high') componentScore[component].high++;
    });

    return Object.entries(componentScore)
      .sort(([,a], [,b]) => b.score - a.score)
      .slice(0, 5)
      .map(([component, data]) => ({ component, ...data }));
  }

  /**
   * Generate alert recommendations
   */
  generateAlertRecommendations(analysis) {
    const recommendations = [];

    if (analysis.patterns.spikes.detected) {
      recommendations.push({
        type: 'immediate',
        priority: 'high',
        title: 'Alert Spikes Detected',
        description: `${analysis.patterns.spikes.count} alert spikes detected. Investigate root cause to prevent system instability.`,
        action: 'Review system logs and identify common patterns in spike periods'
      });
    }

    if (analysis.patterns.recurring.detected) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Recurring Alert Patterns',
        description: `${analysis.patterns.recurring.count} recurring alert patterns detected. These may indicate systemic issues.`,
        action: 'Implement preventive measures for recurring alert types'
      });
    }

    if (analysis.patterns.escalation.detected) {
      recommendations.push({
        type: 'monitoring',
        priority: 'high',
        title: 'Alert Escalations Detected',
        description: `${analysis.patterns.escalation.count} alert escalations detected. Early intervention could prevent critical issues.`,
        action: 'Implement early warning systems and faster response procedures'
      });
    }

    if (analysis.problematicComponents.length > 0) {
      const top = analysis.problematicComponents[0];
      recommendations.push({
        type: 'maintenance',
        priority: 'medium',
        title: `Focus on ${top.component} Component`,
        description: `${top.component} has the highest alert score (${top.score}). May need attention or optimization.`,
        action: `Review and optimize ${top.component} component configuration and performance`
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive system report
   */
  generateSystemReport() {
    const overview = this.getOverview();
    const performanceMetrics = this.getPerformanceMetrics('24h');
    const alertAnalysis = this.getAlertAnalysis('24h');
    const monitorReport = idSystemMonitor.generateReport('24h');

    return {
      title: 'IT-ERA Conversation ID System - Comprehensive Report',
      generatedAt: new Date().toISOString(),
      reportPeriod: '24 hours',
      
      executiveSummary: {
        overallHealth: overview.status.overall,
        healthScore: overview.status.healthScore,
        totalIDsGenerated: overview.performance.idGeneration.total,
        systemUptime: overview.uptime.formatted,
        criticalAlerts: overview.alerts.breakdown.critical,
        keyInsights: overview.insights.slice(0, 3)
      },

      performance: {
        current: overview.performance,
        trends: performanceMetrics.aggregated,
        summary: performanceMetrics.summary
      },

      quality: {
        current: overview.quality,
        trends: monitorReport.quality
      },

      reliability: {
        uptime: overview.uptime,
        healthChecks: monitorReport.health.healthChecks,
        systemHealth: monitorReport.health.systemHealth
      },

      alerts: {
        current: overview.alerts,
        analysis: alertAnalysis.analysis,
        patterns: alertAnalysis.alerts,
        recommendations: alertAnalysis.recommendations
      },

      recommendations: monitorReport.recommendations,
      
      technicalDetails: {
        monitoringSystem: monitorReport,
        realTimeData: {
          dataPoints: this.realTimeData.performance.length,
          lastUpdate: this.realTimeData.performance.length > 0 ? 
            new Date(this.realTimeData.performance[this.realTimeData.performance.length - 1].timestamp).toISOString() : null
        }
      }
    };
  }

  /**
   * Get real-time dashboard data for API
   */
  getRealTimeDashboard() {
    return {
      timestamp: new Date().toISOString(),
      overview: this.getOverview(),
      realTimeData: this.realTimeData,
      latestUpdate: this.latestUpdate,
      isRealTime: this.options.realTimeUpdates,
      updateInterval: this.options.updateInterval
    };
  }
}

// Export singleton instance
const idDashboard = new IDSystemDashboard({
  realTimeUpdates: true,
  updateInterval: 5000,
  maxDataPoints: 100
});

export { IDSystemDashboard, idDashboard };
export default idDashboard;