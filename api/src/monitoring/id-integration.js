/**
 * ID System Monitoring Integration
 * Integrates conversation ID monitoring with existing IT-ERA monitoring infrastructure
 * Provides unified monitoring, alerting, and reporting across all systems
 */

import idSystemMonitor from './id-system-monitor.js';
import idDashboard from './id-dashboard.js';
import { healthMonitor } from './health-monitor.js';
import hybridPerformanceMonitor from '../ai-engine/hybrid-performance-monitor.js';
import aiAnalytics from '../ai-engine/ai-analytics.js';

class IDMonitoringIntegration {
  constructor(options = {}) {
    this.options = {
      enableUnifiedAlerts: options.enableUnifiedAlerts !== false,
      enableCrossSystemMetrics: options.enableCrossSystemMetrics !== false,
      enableAutomatedReporting: options.enableAutomatedReporting !== false,
      reportingSchedule: options.reportingSchedule || '0 0 * * *', // Daily at midnight
      alertingChannels: options.alertingChannels || ['console', 'webhook'],
      ...options
    };

    this.integrationStatus = {
      healthMonitor: false,
      hybridPerformance: false,
      aiAnalytics: false,
      dashboard: false,
      idSystem: false
    };

    this.unifiedMetrics = {
      system: {},
      performance: {},
      health: {},
      quality: {}
    };

    this.crossSystemAlerts = [];
    this.reportingScheduler = null;
  }

  /**
   * Initialize integration with all monitoring systems
   */
  async initialize() {
    console.log('🔗 Initializing ID System Monitoring Integration...');

    try {
      // Initialize ID system monitoring
      await this.initializeIDSystemMonitoring();
      
      // Initialize dashboard
      await this.initializeDashboard();
      
      // Integrate with existing systems
      await this.integrateWithHealthMonitor();
      await this.integrateWithHybridPerformance();
      await this.integrateWithAIAnalytics();
      
      // Setup unified alerting
      if (this.options.enableUnifiedAlerts) {
        this.setupUnifiedAlerting();
      }
      
      // Setup automated reporting
      if (this.options.enableAutomatedReporting) {
        this.setupAutomatedReporting();
      }
      
      // Start cross-system monitoring
      this.startCrossSystemMonitoring();
      
      console.log('✅ ID System Monitoring Integration initialized successfully');
      console.log('📊 Integration status:', this.integrationStatus);
      
    } catch (error) {
      console.error('❌ Failed to initialize ID System Monitoring Integration:', error);
      throw error;
    }
  }

  /**
   * Initialize ID system monitoring
   */
  async initializeIDSystemMonitoring() {
    try {
      await idSystemMonitor.startMonitoring();
      this.integrationStatus.idSystem = true;
      console.log('✅ ID System Monitor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ID System Monitor:', error);
      this.integrationStatus.idSystem = false;
    }
  }

  /**
   * Initialize dashboard
   */
  async initializeDashboard() {
    try {
      idDashboard.initialize();
      this.integrationStatus.dashboard = true;
      console.log('✅ ID Dashboard initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ID Dashboard:', error);
      this.integrationStatus.dashboard = false;
    }
  }

  /**
   * Integrate with health monitor
   */
  async integrateWithHealthMonitor() {
    try {
      // Register ID system health checks with main health monitor
      healthMonitor.registerHealthCheck(
        'conversation_id_system',
        () => this.getIDSystemHealthCheck(),
        { timeout: 10000, critical: true }
      );

      // Register unified system health check
      healthMonitor.registerHealthCheck(
        'unified_monitoring_health',
        () => this.getUnifiedSystemHealth(),
        { timeout: 15000, critical: false }
      );

      this.integrationStatus.healthMonitor = true;
      console.log('✅ Health Monitor integration completed');
    } catch (error) {
      console.error('❌ Failed to integrate with Health Monitor:', error);
      this.integrationStatus.healthMonitor = false;
    }
  }

  /**
   * Integrate with hybrid performance monitor
   */
  async integrateWithHybridPerformance() {
    try {
      // Enhance hybrid performance monitor with ID system metrics
      const originalTrackRequest = hybridPerformanceMonitor.trackRequest.bind(hybridPerformanceMonitor);
      
      hybridPerformanceMonitor.trackRequest = (model, responseTime, cost, success, context) => {
        // Track original metrics
        originalTrackRequest(model, responseTime, cost, success, context);
        
        // Track ID system correlation
        if (context.sessionId) {
          this.trackIDSystemCorrelation(context.sessionId, {
            model,
            responseTime,
            cost,
            success,
            timestamp: Date.now()
          });
        }
      };

      this.integrationStatus.hybridPerformance = true;
      console.log('✅ Hybrid Performance Monitor integration completed');
    } catch (error) {
      console.error('❌ Failed to integrate with Hybrid Performance Monitor:', error);
      this.integrationStatus.hybridPerformance = false;
    }
  }

  /**
   * Integrate with AI analytics
   */
  async integrateWithAIAnalytics() {
    try {
      // Enhance AI analytics with ID system data
      const originalTrackAIRequest = aiAnalytics.trackAIRequest.bind(aiAnalytics);
      
      aiAnalytics.trackAIRequest = (sessionId, request, response, error) => {
        // Track original analytics
        originalTrackAIRequest(sessionId, request, response, error);
        
        // Track ID system metrics correlation
        this.trackAISessionCorrelation(sessionId, {
          request,
          response,
          error,
          timestamp: Date.now()
        });
      };

      this.integrationStatus.aiAnalytics = true;
      console.log('✅ AI Analytics integration completed');
    } catch (error) {
      console.error('❌ Failed to integrate with AI Analytics:', error);
      this.integrationStatus.aiAnalytics = false;
    }
  }

  /**
   * Get ID system health check for main health monitor
   */
  async getIDSystemHealthCheck() {
    try {
      const dashboardData = idSystemMonitor.getDashboardData();
      const healthScore = idDashboard.calculateHealthScore ? 
        idDashboard.calculateHealthScore(dashboardData) : 85;

      if (healthScore < 60) {
        return {
          status: 'UNHEALTHY',
          message: `ID System health score: ${healthScore}`,
          data: {
            healthScore,
            totalIDs: dashboardData.performance.idGeneration.totalGenerated,
            successRate: dashboardData.performance.idGeneration.successRate,
            duplicates: dashboardData.quality.duplicates.detected,
            criticalAlerts: dashboardData.alerts.bySeverity.critical
          }
        };
      }

      if (healthScore < 80) {
        return {
          status: 'DEGRADED',
          message: `ID System health score: ${healthScore}`,
          data: {
            healthScore,
            totalIDs: dashboardData.performance.idGeneration.totalGenerated,
            successRate: dashboardData.performance.idGeneration.successRate
          }
        };
      }

      return {
        status: 'HEALTHY',
        message: `ID System healthy (score: ${healthScore})`,
        data: {
          healthScore,
          totalIDs: dashboardData.performance.idGeneration.totalGenerated,
          successRate: dashboardData.performance.idGeneration.successRate,
          uptime: dashboardData.uptime.formatted
        }
      };

    } catch (error) {
      return {
        status: 'ERROR',
        message: `ID System health check failed: ${error.message}`,
        data: { error: error.message }
      };
    }
  }

  /**
   * Get unified system health check
   */
  async getUnifiedSystemHealth() {
    try {
      const systems = {
        idSystem: this.integrationStatus.idSystem,
        healthMonitor: this.integrationStatus.healthMonitor,
        hybridPerformance: this.integrationStatus.hybridPerformance,
        aiAnalytics: this.integrationStatus.aiAnalytics,
        dashboard: this.integrationStatus.dashboard
      };

      const totalSystems = Object.keys(systems).length;
      const healthySystems = Object.values(systems).filter(status => status).length;
      const healthPercentage = (healthySystems / totalSystems) * 100;

      const unifiedMetrics = this.getUnifiedMetrics();
      
      if (healthPercentage < 60) {
        return {
          status: 'UNHEALTHY',
          message: `Only ${healthySystems}/${totalSystems} monitoring systems healthy`,
          data: { systems, healthPercentage, unifiedMetrics }
        };
      }

      if (healthPercentage < 80) {
        return {
          status: 'DEGRADED',
          message: `${healthySystems}/${totalSystems} monitoring systems healthy`,
          data: { systems, healthPercentage, unifiedMetrics }
        };
      }

      return {
        status: 'HEALTHY',
        message: `All ${healthySystems}/${totalSystems} monitoring systems healthy`,
        data: { systems, healthPercentage, unifiedMetrics }
      };

    } catch (error) {
      return {
        status: 'ERROR',
        message: `Unified health check failed: ${error.message}`,
        data: { error: error.message }
      };
    }
  }

  /**
   * Setup unified alerting across all systems
   */
  setupUnifiedAlerting() {
    console.log('🚨 Setting up unified alerting...');

    // Monitor for cross-system correlation alerts
    setInterval(() => {
      this.checkCrossSystemAlerts();
    }, 30000); // Every 30 seconds

    // Monitor for cascading failures
    setInterval(() => {
      this.checkCascadingFailures();
    }, 60000); // Every minute

    console.log('✅ Unified alerting setup completed');
  }

  /**
   * Setup automated reporting
   */
  setupAutomatedReporting() {
    console.log('📊 Setting up automated reporting...');

    // For now, we'll use a simple interval instead of cron
    // In production, you'd use a proper job scheduler
    const reportInterval = 24 * 60 * 60 * 1000; // 24 hours

    this.reportingScheduler = setInterval(() => {
      this.generateAutomatedReport();
    }, reportInterval);

    // Generate initial report
    setTimeout(() => {
      this.generateAutomatedReport();
    }, 60000); // After 1 minute

    console.log('✅ Automated reporting setup completed');
  }

  /**
   * Start cross-system monitoring
   */
  startCrossSystemMonitoring() {
    setInterval(() => {
      this.collectUnifiedMetrics();
      this.analyzeSystemCorrelations();
    }, 30000); // Every 30 seconds

    console.log('🔍 Cross-system monitoring started');
  }

  /**
   * Track ID system correlation with AI performance
   */
  trackIDSystemCorrelation(sessionId, aiMetrics) {
    // Store correlation data for analysis
    if (!this.unifiedMetrics.correlations) {
      this.unifiedMetrics.correlations = [];
    }

    this.unifiedMetrics.correlations.push({
      sessionId,
      timestamp: Date.now(),
      type: 'ai_performance',
      data: aiMetrics
    });

    // Keep only recent correlations (last 1000)
    if (this.unifiedMetrics.correlations.length > 1000) {
      this.unifiedMetrics.correlations = this.unifiedMetrics.correlations.slice(-1000);
    }
  }

  /**
   * Track AI session correlation with ID system
   */
  trackAISessionCorrelation(sessionId, aiData) {
    // Store AI session correlation data
    if (!this.unifiedMetrics.aiCorrelations) {
      this.unifiedMetrics.aiCorrelations = [];
    }

    this.unifiedMetrics.aiCorrelations.push({
      sessionId,
      timestamp: Date.now(),
      type: 'ai_session',
      data: aiData
    });

    // Keep only recent correlations (last 1000)
    if (this.unifiedMetrics.aiCorrelations.length > 1000) {
      this.unifiedMetrics.aiCorrelations = this.unifiedMetrics.aiCorrelations.slice(-1000);
    }
  }

  /**
   * Collect unified metrics from all systems
   */
  collectUnifiedMetrics() {
    const timestamp = Date.now();

    try {
      // ID System metrics
      const idDashboardData = idSystemMonitor.getDashboardData();
      
      // Health Monitor metrics
      const healthStats = healthMonitor.getHealthStats();
      
      // Hybrid Performance metrics
      let hybridReport = null;
      if (typeof hybridPerformanceMonitor.getPerformanceReport === 'function') {
        hybridReport = hybridPerformanceMonitor.getPerformanceReport();
      }
      
      // AI Analytics metrics
      let aiReport = null;
      if (typeof aiAnalytics.getAnalyticsReport === 'function') {
        aiReport = aiAnalytics.getAnalyticsReport('today');
      }

      this.unifiedMetrics = {
        timestamp,
        system: {
          uptime: Date.now() - (idDashboardData.uptime?.milliseconds || 0),
          integrationStatus: this.integrationStatus,
          healthMonitor: {
            totalChecks: healthStats.totalChecks,
            successRate: healthStats.successRate,
            isMonitoring: healthStats.isMonitoring
          }
        },
        performance: {
          idSystem: {
            generationTime: idDashboardData.performance.idGeneration.averageTime,
            successRate: idDashboardData.performance.idGeneration.successRate,
            totalGenerated: idDashboardData.performance.idGeneration.totalGenerated
          },
          storage: {
            readTime: idDashboardData.performance.storage.averageReadTime,
            writeTime: idDashboardData.performance.storage.averageWriteTime,
            successRate: idDashboardData.performance.storage.successRate
          },
          caching: {
            hitRate: idDashboardData.performance.caching.hitRate,
            responseTime: idDashboardData.performance.caching.averageResponseTime
          },
          hybrid: hybridReport ? {
            costEfficiency: hybridReport.realTime.targetsMet.costPerConversation,
            responseTime: hybridReport.realTime.targetsMet.responseTime,
            overallPerformance: hybridReport.realTime.targetsMet.overallPerformance
          } : null
        },
        health: {
          idSystem: idDashboardData.health.systemStatus,
          overall: this.calculateOverallHealthScore(),
          criticalAlerts: idDashboardData.alerts.bySeverity.critical,
          totalAlerts: idDashboardData.alerts.total
        },
        quality: {
          idSystem: {
            duplicateRate: parseFloat(idDashboardData.quality.overall.duplicateRate) || 0,
            preventionRate: parseFloat(idDashboardData.quality.overall.preventionEfficiency) || 100
          },
          aiSystem: aiReport ? {
            successRate: aiReport.performance?.successRate || 100,
            averageResponseTime: aiReport.performance?.averageResponseTime || 0
          } : null
        }
      };

    } catch (error) {
      console.error('Error collecting unified metrics:', error);
    }
  }

  /**
   * Calculate overall health score across all systems
   */
  calculateOverallHealthScore() {
    let totalScore = 0;
    let systemCount = 0;

    // ID System health (30% weight)
    const idHealthMap = { 'excellent': 100, 'good': 85, 'fair': 70, 'poor': 50, 'critical': 20 };
    const idHealth = this.unifiedMetrics.health?.idSystem || 'good';
    totalScore += (idHealthMap[idHealth] || 85) * 0.3;
    systemCount += 0.3;

    // Health Monitor status (20% weight)
    const healthMonitorScore = this.integrationStatus.healthMonitor ? 100 : 0;
    totalScore += healthMonitorScore * 0.2;
    systemCount += 0.2;

    // Performance systems (25% weight each)
    const hybridScore = this.integrationStatus.hybridPerformance ? 100 : 50;
    const aiScore = this.integrationStatus.aiAnalytics ? 100 : 50;
    totalScore += hybridScore * 0.25;
    totalScore += aiScore * 0.25;
    systemCount += 0.5;

    const finalScore = systemCount > 0 ? totalScore / systemCount : 0;
    
    if (finalScore >= 90) return 'excellent';
    if (finalScore >= 80) return 'good';
    if (finalScore >= 70) return 'fair';
    if (finalScore >= 50) return 'poor';
    return 'critical';
  }

  /**
   * Analyze system correlations for patterns
   */
  analyzeSystemCorrelations() {
    if (!this.unifiedMetrics.correlations || this.unifiedMetrics.correlations.length < 10) {
      return;
    }

    // Analyze ID generation time vs AI response time correlation
    const recent = this.unifiedMetrics.correlations.slice(-50);
    
    // Look for patterns where slow ID generation correlates with slow AI responses
    const slowIdPatterns = recent.filter(c => 
      c.data.responseTime > 2000 && // Slow AI response
      Date.now() - c.timestamp < 300000 // Within last 5 minutes
    );

    if (slowIdPatterns.length > 5) {
      this.addCrossSystemAlert({
        type: 'correlation_detected',
        severity: 'medium',
        systems: ['id_system', 'ai_system'],
        message: `Performance correlation detected: ${slowIdPatterns.length} slow responses with potential ID system impact`,
        data: { patternCount: slowIdPatterns.length, timeframe: '5 minutes' }
      });
    }
  }

  /**
   * Check for cross-system alerts
   */
  checkCrossSystemAlerts() {
    const now = Date.now();
    
    // Check if multiple systems have alerts simultaneously
    const idAlerts = idSystemMonitor.metrics?.alerts?.filter(a => now - a.timestamp < 300000) || [];
    const healthAlerts = healthMonitor.getHealthHistory(5).filter(h => h.status !== 'HEALTHY') || [];
    
    if (idAlerts.length > 3 && healthAlerts.length > 0) {
      this.addCrossSystemAlert({
        type: 'multi_system_alerts',
        severity: 'high',
        systems: ['id_system', 'health_monitor'],
        message: `Multiple systems reporting issues: ${idAlerts.length} ID alerts, ${healthAlerts.length} health issues`,
        data: { idAlerts: idAlerts.length, healthIssues: healthAlerts.length }
      });
    }
  }

  /**
   * Check for cascading failures
   */
  checkCascadingFailures() {
    const recentFailures = [];
    const now = Date.now();
    const timeWindow = 600000; // 10 minutes

    // Check ID system failures
    const idAlerts = idSystemMonitor.metrics?.alerts?.filter(a => 
      a.severity === 'high' || a.severity === 'critical' &&
      now - a.timestamp < timeWindow
    ) || [];

    // Check system integration failures
    const failedSystems = Object.entries(this.integrationStatus)
      .filter(([_, status]) => !status)
      .map(([system]) => system);

    if (idAlerts.length > 2 && failedSystems.length > 1) {
      this.addCrossSystemAlert({
        type: 'cascading_failure',
        severity: 'critical',
        systems: ['integration', ...failedSystems],
        message: `Potential cascading failure detected: ${idAlerts.length} critical ID alerts, ${failedSystems.length} system failures`,
        data: { 
          criticalAlerts: idAlerts.length, 
          failedSystems: failedSystems,
          timeWindow: '10 minutes'
        }
      });
    }
  }

  /**
   * Add cross-system alert
   */
  addCrossSystemAlert(alert) {
    const alertWithTimestamp = {
      ...alert,
      id: `cross_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      source: 'unified_monitoring'
    };

    this.crossSystemAlerts.push(alertWithTimestamp);

    // Keep only last 100 cross-system alerts
    if (this.crossSystemAlerts.length > 100) {
      this.crossSystemAlerts.shift();
    }

    // Log cross-system alert
    if (alert.severity === 'critical') {
      console.error(`🚨 CRITICAL CROSS-SYSTEM ALERT: ${alert.message}`, alert);
    } else if (alert.severity === 'high') {
      console.error(`⚠️ HIGH CROSS-SYSTEM ALERT: ${alert.message}`, alert);
    } else {
      console.warn(`ℹ️ CROSS-SYSTEM ALERT: ${alert.message}`, alert);
    }

    // Trigger webhook alerts if configured
    if (this.options.alertingChannels.includes('webhook')) {
      this.sendWebhookAlert(alertWithTimestamp);
    }
  }

  /**
   * Send webhook alert
   */
  async sendWebhookAlert(alert) {
    // Implementation would depend on webhook configuration
    console.log('📤 Webhook alert triggered:', alert.message);
  }

  /**
   * Generate automated report
   */
  async generateAutomatedReport() {
    try {
      console.log('📊 Generating automated monitoring report...');
      
      const report = {
        title: 'IT-ERA Unified Monitoring Report',
        generatedAt: new Date().toISOString(),
        reportType: 'automated_daily',
        
        summary: {
          overallHealth: this.unifiedMetrics.health?.overall || 'unknown',
          integrationStatus: this.integrationStatus,
          totalAlerts: (idSystemMonitor.metrics?.alerts?.length || 0) + this.crossSystemAlerts.length,
          crossSystemAlerts: this.crossSystemAlerts.length
        },

        systemStatus: {
          idSystem: idSystemMonitor.getDashboardData(),
          healthMonitor: healthMonitor.getHealthStats(),
          integration: this.getIntegrationStatus()
        },

        performance: this.unifiedMetrics.performance,
        
        alerts: {
          idSystem: idSystemMonitor.metrics?.alerts?.slice(-20) || [],
          crossSystem: this.crossSystemAlerts.slice(-10),
          analysis: this.analyzeAlertPatterns()
        },

        recommendations: this.generateUnifiedRecommendations()
      };

      // In production, this would be sent via email, stored in database, etc.
      console.log('✅ Automated report generated successfully');
      console.log(`📈 Report summary: ${report.summary.overallHealth} health, ${report.summary.totalAlerts} alerts`);

      // Store report for API access
      this.lastAutomatedReport = report;

      return report;

    } catch (error) {
      console.error('❌ Failed to generate automated report:', error);
      return null;
    }
  }

  /**
   * Get integration status details
   */
  getIntegrationStatus() {
    return {
      overall: Object.values(this.integrationStatus).filter(status => status).length / Object.keys(this.integrationStatus).length,
      systems: this.integrationStatus,
      lastMetricsCollection: this.unifiedMetrics.timestamp ? new Date(this.unifiedMetrics.timestamp).toISOString() : null,
      crossSystemAlertsCount: this.crossSystemAlerts.length
    };
  }

  /**
   * Analyze alert patterns across systems
   */
  analyzeAlertPatterns() {
    const now = Date.now();
    const recentAlerts = this.crossSystemAlerts.filter(a => now - a.timestamp < 86400000); // Last 24 hours

    return {
      total: recentAlerts.length,
      bySeverity: {
        critical: recentAlerts.filter(a => a.severity === 'critical').length,
        high: recentAlerts.filter(a => a.severity === 'high').length,
        medium: recentAlerts.filter(a => a.severity === 'medium').length
      },
      byType: this.groupBy(recentAlerts, 'type'),
      patterns: this.detectAlertPatterns(recentAlerts)
    };
  }

  /**
   * Group array by property
   */
  groupBy(array, property) {
    const grouped = {};
    array.forEach(item => {
      const key = item[property] || 'unknown';
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Detect patterns in cross-system alerts
   */
  detectAlertPatterns(alerts) {
    const patterns = [];

    // System correlation patterns
    const systemCorrelations = {};
    alerts.forEach(alert => {
      if (alert.systems && alert.systems.length > 1) {
        const systemPair = alert.systems.sort().join('-');
        systemCorrelations[systemPair] = (systemCorrelations[systemPair] || 0) + 1;
      }
    });

    Object.entries(systemCorrelations).forEach(([systems, count]) => {
      if (count > 2) {
        patterns.push({
          type: 'system_correlation',
          description: `${count} alerts involving ${systems}`,
          severity: count > 5 ? 'high' : 'medium'
        });
      }
    });

    return patterns;
  }

  /**
   * Generate unified recommendations
   */
  generateUnifiedRecommendations() {
    const recommendations = [];

    // Integration health recommendations
    const failedSystems = Object.entries(this.integrationStatus)
      .filter(([_, status]) => !status)
      .map(([system]) => system);

    if (failedSystems.length > 0) {
      recommendations.push({
        type: 'integration',
        priority: 'high',
        title: 'System Integration Issues',
        description: `${failedSystems.length} monitoring systems not properly integrated`,
        action: `Review and fix integration for: ${failedSystems.join(', ')}`,
        systems: failedSystems
      });
    }

    // Cross-system alert recommendations
    if (this.crossSystemAlerts.length > 10) {
      recommendations.push({
        type: 'alerting',
        priority: 'medium',
        title: 'High Cross-System Alert Volume',
        description: `${this.crossSystemAlerts.length} cross-system alerts detected`,
        action: 'Review alert patterns and implement preventive measures'
      });
    }

    // Performance correlation recommendations
    if (this.unifiedMetrics.correlations && this.unifiedMetrics.correlations.length > 100) {
      recommendations.push({
        type: 'performance',
        priority: 'low',
        title: 'Performance Correlation Analysis',
        description: 'Rich correlation data available for analysis',
        action: 'Perform detailed performance correlation analysis to identify optimization opportunities'
      });
    }

    return recommendations;
  }

  /**
   * Get unified metrics for API
   */
  getUnifiedMetrics() {
    return {
      ...this.unifiedMetrics,
      integration: this.getIntegrationStatus(),
      crossSystemAlerts: this.crossSystemAlerts.slice(-20)
    };
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      timestamp: new Date().toISOString(),
      integration: this.getIntegrationStatus(),
      health: this.unifiedMetrics.health,
      performance: this.unifiedMetrics.performance,
      alerts: {
        crossSystem: this.crossSystemAlerts.length,
        recent: this.crossSystemAlerts.slice(-10)
      },
      lastReport: this.lastAutomatedReport ? {
        generatedAt: this.lastAutomatedReport.generatedAt,
        overallHealth: this.lastAutomatedReport.summary.overallHealth
      } : null
    };
  }

  /**
   * Shutdown integration
   */
  async shutdown() {
    console.log('🔌 Shutting down ID System Monitoring Integration...');

    // Stop automated reporting
    if (this.reportingScheduler) {
      clearInterval(this.reportingScheduler);
      this.reportingScheduler = null;
    }

    // Stop monitoring systems
    if (idSystemMonitor.isMonitoring) {
      idSystemMonitor.stopMonitoring();
    }

    if (idDashboard.updateInterval) {
      idDashboard.stopRealTimeUpdates();
    }

    console.log('✅ ID System Monitoring Integration shut down');
  }
}

// Export singleton instance
const idMonitoringIntegration = new IDMonitoringIntegration({
  enableUnifiedAlerts: true,
  enableCrossSystemMetrics: true,
  enableAutomatedReporting: true,
  alertingChannels: ['console', 'webhook']
});

export { IDMonitoringIntegration, idMonitoringIntegration };
export default idMonitoringIntegration;