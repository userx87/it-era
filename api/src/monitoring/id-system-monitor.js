/**
 * Conversation ID System Advanced Monitoring
 * Comprehensive monitoring for ID generation, storage, caching, and health
 * Integrates with IT-ERA existing monitoring infrastructure
 */

import { HealthMonitor, CommonHealthChecks } from './health-monitor.js';
import hybridPerformanceMonitor from '../ai-engine/hybrid-performance-monitor.js';

class ConversationIDMonitor {
  constructor(options = {}) {
    this.options = {
      alertingEnabled: options.alertingEnabled !== false,
      healthCheckInterval: options.healthCheckInterval || 60000, // 1 minute
      metricsRetentionHours: options.metricsRetentionHours || 24,
      duplicateAlertThreshold: options.duplicateAlertThreshold || 5,
      performanceThresholds: {
        idGeneration: options.performanceThresholds?.idGeneration || 50, // ms
        storageOp: options.performanceThresholds?.storageOp || 100, // ms
        cacheHit: options.performanceThresholds?.cacheHit || 95, // percentage
      },
      ...options
    };

    // Core metrics storage
    this.metrics = {
      performance: {
        idGeneration: {
          totalGenerated: 0,
          averageTime: 0,
          maxTime: 0,
          minTime: Infinity,
          recentTimes: [], // Last 100 generation times
          failureCount: 0,
          successRate: 100
        },
        storage: {
          totalOperations: 0,
          readOperations: 0,
          writeOperations: 0,
          averageReadTime: 0,
          averageWriteTime: 0,
          failureCount: 0,
          successRate: 100,
          usage: {
            totalIds: 0,
            activeIds: 0,
            expiredIds: 0,
            storageSize: 0
          }
        },
        caching: {
          totalRequests: 0,
          hits: 0,
          misses: 0,
          hitRate: 0,
          averageResponseTime: 0,
          evictions: 0,
          memoryUsage: 0
        }
      },
      quality: {
        duplicates: {
          detected: 0,
          prevented: 0,
          history: [] // Recent duplicate attempts
        },
        validation: {
          totalValidations: 0,
          validIds: 0,
          invalidIds: 0,
          validationRate: 100
        },
        uniqueness: {
          totalChecks: 0,
          collisions: 0,
          collisionRate: 0
        }
      },
      health: {
        systemStatus: 'healthy',
        lastHealthCheck: null,
        criticalIssues: [],
        warnings: [],
        uptime: Date.now()
      },
      alerts: []
    };

    // Health monitor integration
    this.healthMonitor = new HealthMonitor({
      checkInterval: this.options.healthCheckInterval,
      alertThreshold: 3,
      maxHistorySize: 100
    });

    // Performance tracking
    this.performanceHistory = [];
    this.alertHistory = [];
    
    // Monitoring state
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.metricsCleanupInterval = null;

    this.setupHealthChecks();
  }

  /**
   * Initialize monitoring system
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.warn('ID System monitoring already running');
      return;
    }

    console.log('🔍 Starting Conversation ID System monitoring...');
    
    this.isMonitoring = true;
    this.metrics.health.uptime = Date.now();

    // Start health monitoring
    this.healthMonitor.startMonitoring();

    // Start metrics collection
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.generateInsights();
    }, 30000); // Every 30 seconds

    // Start periodic cleanup
    this.metricsCleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // Every 5 minutes

    console.log('✅ ID System monitoring started successfully');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.healthMonitor.stopMonitoring();

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.metricsCleanupInterval) {
      clearInterval(this.metricsCleanupInterval);
      this.metricsCleanupInterval = null;
    }

    console.log('🛑 ID System monitoring stopped');
  }

  /**
   * Setup health checks for ID system components
   */
  setupHealthChecks() {
    // ID Generation health check
    this.healthMonitor.registerHealthCheck(
      'id_generation_performance',
      () => this.checkIDGenerationHealth(),
      { timeout: 5000, critical: true }
    );

    // Storage health check
    this.healthMonitor.registerHealthCheck(
      'id_storage_health',
      () => this.checkStorageHealth(),
      { timeout: 10000, critical: true }
    );

    // Cache performance check
    this.healthMonitor.registerHealthCheck(
      'id_cache_performance',
      () => this.checkCacheHealth(),
      { timeout: 5000, critical: false }
    );

    // Duplicate detection check
    this.healthMonitor.registerHealthCheck(
      'duplicate_prevention',
      () => this.checkDuplicateHealth(),
      { timeout: 3000, critical: true }
    );

    // Overall system integrity
    this.healthMonitor.registerHealthCheck(
      'id_system_integrity',
      () => this.checkSystemIntegrity(),
      { timeout: 8000, critical: true }
    );
  }

  /**
   * Track ID generation performance
   */
  trackIDGeneration(sessionId, generationTime, success = true, metadata = {}) {
    const perf = this.metrics.performance.idGeneration;
    
    perf.totalGenerated++;
    
    if (success) {
      // Update timing metrics
      perf.recentTimes.push(generationTime);
      if (perf.recentTimes.length > 100) {
        perf.recentTimes.shift();
      }
      
      perf.averageTime = perf.recentTimes.reduce((a, b) => a + b, 0) / perf.recentTimes.length;
      perf.maxTime = Math.max(perf.maxTime, generationTime);
      perf.minTime = Math.min(perf.minTime, generationTime);
    } else {
      perf.failureCount++;
    }

    perf.successRate = ((perf.totalGenerated - perf.failureCount) / perf.totalGenerated) * 100;

    // Performance alert check
    if (generationTime > this.options.performanceThresholds.idGeneration) {
      this.addAlert({
        type: 'performance_degradation',
        severity: 'medium',
        component: 'id_generation',
        message: `Slow ID generation detected: ${generationTime}ms`,
        sessionId,
        generationTime,
        threshold: this.options.performanceThresholds.idGeneration,
        metadata
      });
    }

    // Failure alert
    if (!success) {
      this.addAlert({
        type: 'generation_failure',
        severity: 'high',
        component: 'id_generation',
        message: 'ID generation failed',
        sessionId,
        metadata
      });
    }
  }

  /**
   * Track storage operations
   */
  trackStorageOperation(operation, sessionId, duration, success = true, metadata = {}) {
    const storage = this.metrics.performance.storage;
    
    storage.totalOperations++;
    
    if (operation === 'read') {
      storage.readOperations++;
      if (success) {
        storage.averageReadTime = (storage.averageReadTime * (storage.readOperations - 1) + duration) / storage.readOperations;
      }
    } else if (operation === 'write') {
      storage.writeOperations++;
      if (success) {
        storage.averageWriteTime = (storage.averageWriteTime * (storage.writeOperations - 1) + duration) / storage.writeOperations;
      }
    }

    if (!success) {
      storage.failureCount++;
    }

    storage.successRate = ((storage.totalOperations - storage.failureCount) / storage.totalOperations) * 100;

    // Performance alert
    if (duration > this.options.performanceThresholds.storageOp) {
      this.addAlert({
        type: 'storage_performance',
        severity: 'medium',
        component: 'storage',
        message: `Slow storage ${operation} operation: ${duration}ms`,
        operation,
        sessionId,
        duration,
        threshold: this.options.performanceThresholds.storageOp,
        metadata
      });
    }

    // Failure alert
    if (!success) {
      this.addAlert({
        type: 'storage_failure',
        severity: 'high',
        component: 'storage',
        message: `Storage ${operation} operation failed`,
        operation,
        sessionId,
        metadata
      });
    }
  }

  /**
   * Track cache operations
   */
  trackCacheOperation(operation, sessionId, hit = false, responseTime = 0, metadata = {}) {
    const cache = this.metrics.performance.caching;
    
    cache.totalRequests++;
    
    if (hit) {
      cache.hits++;
    } else {
      cache.misses++;
    }

    cache.hitRate = (cache.hits / cache.totalRequests) * 100;
    cache.averageResponseTime = (cache.averageResponseTime * (cache.totalRequests - 1) + responseTime) / cache.totalRequests;

    // Cache performance alert
    if (cache.hitRate < this.options.performanceThresholds.cacheHit && cache.totalRequests > 10) {
      this.addAlert({
        type: 'cache_performance',
        severity: 'medium',
        component: 'cache',
        message: `Low cache hit rate: ${cache.hitRate.toFixed(2)}%`,
        hitRate: cache.hitRate,
        threshold: this.options.performanceThresholds.cacheHit,
        sessionId,
        metadata
      });
    }
  }

  /**
   * Track duplicate detection
   */
  trackDuplicateDetection(sessionId, isDuplicate, preventedDuplicate = false, metadata = {}) {
    const duplicates = this.metrics.quality.duplicates;
    
    if (isDuplicate) {
      duplicates.detected++;
      duplicates.history.push({
        sessionId,
        timestamp: Date.now(),
        prevented: preventedDuplicate,
        metadata
      });
      
      // Keep only last 50 duplicate events
      if (duplicates.history.length > 50) {
        duplicates.history.shift();
      }
      
      if (preventedDuplicate) {
        duplicates.prevented++;
      }

      // Duplicate alert
      this.addAlert({
        type: 'duplicate_detected',
        severity: preventedDuplicate ? 'low' : 'high',
        component: 'duplicate_detection',
        message: preventedDuplicate ? 
          `Duplicate ID prevented for session ${sessionId}` : 
          `Duplicate ID detected for session ${sessionId}`,
        sessionId,
        prevented: preventedDuplicate,
        metadata
      });
    }
  }

  /**
   * Update storage usage metrics
   */
  updateStorageUsage(totalIds, activeIds, expiredIds, storageSize) {
    const usage = this.metrics.performance.storage.usage;
    
    usage.totalIds = totalIds;
    usage.activeIds = activeIds;
    usage.expiredIds = expiredIds;
    usage.storageSize = storageSize;

    // Storage capacity alerts
    if (storageSize > 100 * 1024 * 1024) { // 100MB
      this.addAlert({
        type: 'storage_capacity',
        severity: 'medium',
        component: 'storage',
        message: `High storage usage: ${(storageSize / 1024 / 1024).toFixed(2)}MB`,
        storageSize,
        totalIds,
        activeIds
      });
    }
  }

  /**
   * Add alert to system
   */
  addAlert(alert) {
    if (!this.options.alertingEnabled) return;

    const alertWithTimestamp = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.metrics.alerts.push(alertWithTimestamp);
    this.alertHistory.push(alertWithTimestamp);

    // Keep only last 100 alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts.shift();
    }

    // Log alert based on severity
    if (alert.severity === 'high') {
      console.error(`🚨 ID SYSTEM HIGH ALERT: ${alert.message}`, alert);
    } else if (alert.severity === 'medium') {
      console.warn(`⚠️ ID SYSTEM MEDIUM ALERT: ${alert.message}`, alert);
    } else {
      console.log(`ℹ️ ID SYSTEM INFO: ${alert.message}`, alert);
    }

    // Check for critical alert patterns
    this.checkCriticalAlertPatterns(alert);
  }

  /**
   * Check for critical alert patterns
   */
  checkCriticalAlertPatterns(newAlert) {
    const recentAlerts = this.metrics.alerts.slice(-10);
    
    // Multiple failures in short time
    const failureAlerts = recentAlerts.filter(a => 
      a.type.includes('failure') && 
      Date.now() - a.timestamp < 300000 // Last 5 minutes
    );

    if (failureAlerts.length >= 5) {
      this.addAlert({
        type: 'system_instability',
        severity: 'critical',
        component: 'overall',
        message: `Multiple failures detected: ${failureAlerts.length} failures in 5 minutes`,
        failureCount: failureAlerts.length,
        pattern: 'multiple_failures'
      });
    }

    // Duplicate spike
    if (newAlert.type === 'duplicate_detected') {
      const duplicateAlerts = recentAlerts.filter(a => 
        a.type === 'duplicate_detected' && 
        Date.now() - a.timestamp < 600000 // Last 10 minutes
      );

      if (duplicateAlerts.length >= this.options.duplicateAlertThreshold) {
        this.addAlert({
          type: 'duplicate_spike',
          severity: 'critical',
          component: 'duplicate_detection',
          message: `Duplicate spike detected: ${duplicateAlerts.length} duplicates in 10 minutes`,
          duplicateCount: duplicateAlerts.length,
          threshold: this.options.duplicateAlertThreshold
        });
      }
    }
  }

  /**
   * Health check implementations
   */
  async checkIDGenerationHealth() {
    const perf = this.metrics.performance.idGeneration;
    
    if (perf.successRate < 95 && perf.totalGenerated > 10) {
      return {
        status: 'UNHEALTHY',
        message: `Low ID generation success rate: ${perf.successRate.toFixed(2)}%`,
        data: { successRate: perf.successRate, totalGenerated: perf.totalGenerated }
      };
    }

    if (perf.averageTime > this.options.performanceThresholds.idGeneration * 2) {
      return {
        status: 'UNHEALTHY',
        message: `Slow ID generation: ${perf.averageTime.toFixed(2)}ms average`,
        data: { averageTime: perf.averageTime, threshold: this.options.performanceThresholds.idGeneration }
      };
    }

    return {
      status: 'HEALTHY',
      message: `ID generation: ${perf.successRate.toFixed(2)}% success, ${perf.averageTime.toFixed(2)}ms avg`,
      data: { successRate: perf.successRate, averageTime: perf.averageTime, totalGenerated: perf.totalGenerated }
    };
  }

  async checkStorageHealth() {
    const storage = this.metrics.performance.storage;
    
    if (storage.successRate < 98 && storage.totalOperations > 10) {
      return {
        status: 'UNHEALTHY',
        message: `Storage operation failures: ${storage.successRate.toFixed(2)}% success rate`,
        data: { successRate: storage.successRate, failureCount: storage.failureCount }
      };
    }

    const avgTime = (storage.averageReadTime + storage.averageWriteTime) / 2;
    if (avgTime > this.options.performanceThresholds.storageOp * 2) {
      return {
        status: 'UNHEALTHY',
        message: `Slow storage operations: ${avgTime.toFixed(2)}ms average`,
        data: { averageTime: avgTime, readTime: storage.averageReadTime, writeTime: storage.averageWriteTime }
      };
    }

    return {
      status: 'HEALTHY',
      message: `Storage: ${storage.successRate.toFixed(2)}% success, R:${storage.averageReadTime.toFixed(2)}ms W:${storage.averageWriteTime.toFixed(2)}ms`,
      data: { 
        successRate: storage.successRate, 
        readTime: storage.averageReadTime, 
        writeTime: storage.averageWriteTime,
        totalOperations: storage.totalOperations
      }
    };
  }

  async checkCacheHealth() {
    const cache = this.metrics.performance.caching;
    
    if (cache.hitRate < this.options.performanceThresholds.cacheHit && cache.totalRequests > 20) {
      return {
        status: 'UNHEALTHY',
        message: `Low cache hit rate: ${cache.hitRate.toFixed(2)}%`,
        data: { hitRate: cache.hitRate, hits: cache.hits, misses: cache.misses }
      };
    }

    return {
      status: 'HEALTHY',
      message: `Cache: ${cache.hitRate.toFixed(2)}% hit rate, ${cache.averageResponseTime.toFixed(2)}ms avg`,
      data: { hitRate: cache.hitRate, averageResponseTime: cache.averageResponseTime, totalRequests: cache.totalRequests }
    };
  }

  async checkDuplicateHealth() {
    const duplicates = this.metrics.quality.duplicates;
    
    // Check recent duplicate rate
    const recentDuplicates = duplicates.history.filter(d => Date.now() - d.timestamp < 3600000); // Last hour
    
    if (recentDuplicates.length > 10) {
      return {
        status: 'UNHEALTHY',
        message: `High duplicate rate: ${recentDuplicates.length} duplicates in last hour`,
        data: { recentDuplicates: recentDuplicates.length, totalDetected: duplicates.detected }
      };
    }

    const preventionRate = duplicates.detected > 0 ? (duplicates.prevented / duplicates.detected) * 100 : 100;
    
    if (preventionRate < 90 && duplicates.detected > 5) {
      return {
        status: 'UNHEALTHY',
        message: `Low duplicate prevention rate: ${preventionRate.toFixed(2)}%`,
        data: { preventionRate, detected: duplicates.detected, prevented: duplicates.prevented }
      };
    }

    return {
      status: 'HEALTHY',
      message: `Duplicates: ${duplicates.detected} detected, ${duplicates.prevented} prevented (${preventionRate.toFixed(2)}% prevention)`,
      data: { detected: duplicates.detected, prevented: duplicates.prevented, preventionRate }
    };
  }

  async checkSystemIntegrity() {
    const criticalAlerts = this.metrics.alerts.filter(a => 
      a.severity === 'critical' && 
      Date.now() - a.timestamp < 1800000 // Last 30 minutes
    );

    if (criticalAlerts.length > 0) {
      return {
        status: 'UNHEALTHY',
        message: `${criticalAlerts.length} critical alerts in last 30 minutes`,
        data: { criticalAlerts: criticalAlerts.length, alerts: criticalAlerts }
      };
    }

    // Check if monitoring is healthy
    const uptime = Date.now() - this.metrics.health.uptime;
    
    return {
      status: 'HEALTHY',
      message: `System integrity good, ${(uptime / 1000 / 60).toFixed(2)} minutes uptime`,
      data: { uptime, isMonitoring: this.isMonitoring, alertCount: this.metrics.alerts.length }
    };
  }

  /**
   * Collect real-time metrics
   */
  collectMetrics() {
    const timestamp = Date.now();
    
    // Calculate derived metrics
    const idGen = this.metrics.performance.idGeneration;
    const storage = this.metrics.performance.storage;
    const cache = this.metrics.performance.caching;
    
    const snapshot = {
      timestamp,
      performance: {
        idGeneration: {
          rate: idGen.totalGenerated > 0 ? (idGen.totalGenerated / ((timestamp - this.metrics.health.uptime) / 60000)).toFixed(2) : 0,
          averageTime: idGen.averageTime,
          successRate: idGen.successRate
        },
        storage: {
          operationsRate: storage.totalOperations > 0 ? (storage.totalOperations / ((timestamp - this.metrics.health.uptime) / 60000)).toFixed(2) : 0,
          averageReadTime: storage.averageReadTime,
          averageWriteTime: storage.averageWriteTime,
          successRate: storage.successRate,
          usage: storage.usage
        },
        caching: {
          hitRate: cache.hitRate,
          averageResponseTime: cache.averageResponseTime,
          requestsRate: cache.totalRequests > 0 ? (cache.totalRequests / ((timestamp - this.metrics.health.uptime) / 60000)).toFixed(2) : 0
        }
      },
      quality: {
        duplicateRate: this.metrics.quality.duplicates.detected > 0 ? 
          (this.metrics.quality.duplicates.detected / idGen.totalGenerated * 100).toFixed(4) : 0,
        preventionRate: this.metrics.quality.duplicates.detected > 0 ? 
          (this.metrics.quality.duplicates.prevented / this.metrics.quality.duplicates.detected * 100).toFixed(2) : 100
      },
      health: {
        totalAlerts: this.metrics.alerts.length,
        criticalAlerts: this.metrics.alerts.filter(a => a.severity === 'critical').length,
        isHealthy: this.metrics.health.systemStatus === 'healthy'
      }
    };

    this.performanceHistory.push(snapshot);

    // Keep only recent history
    const maxHistoryAge = this.options.metricsRetentionHours * 60 * 60 * 1000;
    this.performanceHistory = this.performanceHistory.filter(s => 
      timestamp - s.timestamp < maxHistoryAge
    );
  }

  /**
   * Check for alerts based on current metrics
   */
  checkAlerts() {
    // This is called periodically to check for systemic issues
    const now = Date.now();
    
    // Check for alert storms
    const recentAlerts = this.metrics.alerts.filter(a => now - a.timestamp < 600000); // Last 10 minutes
    if (recentAlerts.length > 20) {
      this.addAlert({
        type: 'alert_storm',
        severity: 'critical',
        component: 'monitoring',
        message: `Alert storm detected: ${recentAlerts.length} alerts in 10 minutes`,
        alertCount: recentAlerts.length
      });
    }

    // Check for system degradation trends
    if (this.performanceHistory.length > 5) {
      const recent = this.performanceHistory.slice(-5);
      const averageResponseTime = recent.reduce((sum, h) => sum + parseFloat(h.performance.idGeneration.averageTime), 0) / recent.length;
      
      if (averageResponseTime > this.options.performanceThresholds.idGeneration * 1.5) {
        this.addAlert({
          type: 'performance_trend',
          severity: 'medium',
          component: 'performance',
          message: `ID generation performance degrading: ${averageResponseTime.toFixed(2)}ms average`,
          averageTime: averageResponseTime,
          threshold: this.options.performanceThresholds.idGeneration
        });
      }
    }
  }

  /**
   * Generate performance insights
   */
  generateInsights() {
    const insights = [];
    const perf = this.metrics.performance;
    
    // Performance insights
    if (perf.idGeneration.averageTime < this.options.performanceThresholds.idGeneration / 2) {
      insights.push(`✅ Excellent ID generation performance: ${perf.idGeneration.averageTime.toFixed(2)}ms average`);
    }
    
    if (perf.caching.hitRate > 90) {
      insights.push(`🎯 High cache efficiency: ${perf.caching.hitRate.toFixed(2)}% hit rate`);
    }
    
    if (perf.storage.successRate >= 99) {
      insights.push(`🏆 Outstanding storage reliability: ${perf.storage.successRate.toFixed(2)}% success rate`);
    }
    
    // Quality insights
    const duplicateRate = perf.idGeneration.totalGenerated > 0 ? 
      (this.metrics.quality.duplicates.detected / perf.idGeneration.totalGenerated * 100) : 0;
      
    if (duplicateRate < 0.1) {
      insights.push(`🔒 Excellent ID uniqueness: ${duplicateRate.toFixed(4)}% duplicate rate`);
    }
    
    this.metrics.insights = insights;
  }

  /**
   * Clean up old metrics
   */
  cleanupOldMetrics() {
    const now = Date.now();
    const maxAge = this.options.metricsRetentionHours * 60 * 60 * 1000;
    
    // Clean old alerts
    this.metrics.alerts = this.metrics.alerts.filter(a => now - a.timestamp < maxAge);
    this.alertHistory = this.alertHistory.filter(a => now - a.timestamp < maxAge * 7); // Keep alert history longer
    
    // Clean old duplicate history
    this.metrics.quality.duplicates.history = this.metrics.quality.duplicates.history.filter(d => 
      now - d.timestamp < maxAge
    );
    
    // Clean performance history is handled in collectMetrics()
    
    console.log('🧹 ID System metrics cleanup completed');
  }

  /**
   * Get comprehensive monitoring dashboard data
   */
  getDashboardData() {
    const uptime = Date.now() - this.metrics.health.uptime;
    const healthStatus = this.healthMonitor.getHealthStats();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: {
        milliseconds: uptime,
        formatted: this.formatUptime(uptime)
      },
      monitoring: {
        status: this.isMonitoring ? 'active' : 'inactive',
        healthChecksRegistered: healthStatus.registeredChecks,
        healthCheckSuccess: healthStatus.successRate
      },
      performance: {
        idGeneration: {
          ...this.metrics.performance.idGeneration,
          rate: this.metrics.performance.idGeneration.totalGenerated > 0 ? 
            (this.metrics.performance.idGeneration.totalGenerated / (uptime / 60000)).toFixed(2) + ' IDs/min' : '0 IDs/min'
        },
        storage: {
          ...this.metrics.performance.storage,
          operationsRate: this.metrics.performance.storage.totalOperations > 0 ? 
            (this.metrics.performance.storage.totalOperations / (uptime / 60000)).toFixed(2) + ' ops/min' : '0 ops/min'
        },
        caching: {
          ...this.metrics.performance.caching,
          efficiency: this.metrics.performance.caching.hitRate > 90 ? 'Excellent' :
                     this.metrics.performance.caching.hitRate > 75 ? 'Good' :
                     this.metrics.performance.caching.hitRate > 50 ? 'Fair' : 'Poor'
        }
      },
      quality: {
        ...this.metrics.quality,
        overall: {
          duplicateRate: this.metrics.performance.idGeneration.totalGenerated > 0 ? 
            ((this.metrics.quality.duplicates.detected / this.metrics.performance.idGeneration.totalGenerated) * 100).toFixed(4) + '%' : '0%',
          preventionEfficiency: this.metrics.quality.duplicates.detected > 0 ? 
            ((this.metrics.quality.duplicates.prevented / this.metrics.quality.duplicates.detected) * 100).toFixed(2) + '%' : '100%'
        }
      },
      alerts: {
        total: this.metrics.alerts.length,
        bySeverity: {
          critical: this.metrics.alerts.filter(a => a.severity === 'critical').length,
          high: this.metrics.alerts.filter(a => a.severity === 'high').length,
          medium: this.metrics.alerts.filter(a => a.severity === 'medium').length,
          low: this.metrics.alerts.filter(a => a.severity === 'low').length
        },
        recent: this.metrics.alerts.slice(-10)
      },
      health: {
        ...this.metrics.health,
        systemStatus: this.calculateOverallHealth(),
        healthChecks: this.healthMonitor.getHealthStats()
      },
      insights: this.metrics.insights || [],
      trends: this.calculateTrends()
    };
  }

  /**
   * Calculate overall system health
   */
  calculateOverallHealth() {
    const perf = this.metrics.performance;
    const quality = this.metrics.quality;
    
    let healthScore = 100;
    
    // Performance factors
    if (perf.idGeneration.successRate < 95) healthScore -= 20;
    if (perf.storage.successRate < 98) healthScore -= 15;
    if (perf.caching.hitRate < 50) healthScore -= 10;
    
    // Quality factors
    const duplicateRate = perf.idGeneration.totalGenerated > 0 ? 
      (quality.duplicates.detected / perf.idGeneration.totalGenerated * 100) : 0;
    if (duplicateRate > 1) healthScore -= 15;
    
    // Alert factors
    const criticalAlerts = this.metrics.alerts.filter(a => 
      a.severity === 'critical' && 
      Date.now() - a.timestamp < 1800000
    );
    healthScore -= criticalAlerts.length * 10;
    
    if (healthScore >= 90) return 'excellent';
    if (healthScore >= 75) return 'good';
    if (healthScore >= 60) return 'fair';
    if (healthScore >= 40) return 'poor';
    return 'critical';
  }

  /**
   * Calculate performance trends
   */
  calculateTrends() {
    if (this.performanceHistory.length < 3) {
      return { status: 'insufficient_data', message: 'Not enough data for trend analysis' };
    }
    
    const recent = this.performanceHistory.slice(-10);
    const older = this.performanceHistory.slice(-20, -10);
    
    if (older.length === 0) {
      return { status: 'insufficient_data', message: 'Not enough historical data' };
    }
    
    const recentAvgIdTime = recent.reduce((sum, h) => sum + h.performance.idGeneration.averageTime, 0) / recent.length;
    const olderAvgIdTime = older.reduce((sum, h) => sum + h.performance.idGeneration.averageTime, 0) / older.length;
    
    const recentHitRate = recent.reduce((sum, h) => sum + h.performance.caching.hitRate, 0) / recent.length;
    const olderHitRate = older.reduce((sum, h) => sum + h.performance.caching.hitRate, 0) / older.length;
    
    return {
      idGeneration: {
        trend: recentAvgIdTime < olderAvgIdTime ? 'improving' : recentAvgIdTime > olderAvgIdTime ? 'degrading' : 'stable',
        change: ((recentAvgIdTime - olderAvgIdTime) / olderAvgIdTime * 100).toFixed(2) + '%'
      },
      caching: {
        trend: recentHitRate > olderHitRate ? 'improving' : recentHitRate < olderHitRate ? 'degrading' : 'stable',
        change: ((recentHitRate - olderHitRate) / olderHitRate * 100).toFixed(2) + '%'
      },
      overall: this.performanceHistory.length >= 20 ? 'stable' : 'warming_up'
    };
  }

  /**
   * Format uptime for display
   */
  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Export metrics for external systems
   */
  exportMetrics() {
    return {
      systemInfo: {
        name: 'IT-ERA Conversation ID System Monitor',
        version: '1.0.0',
        uptime: Date.now() - this.metrics.health.uptime,
        isMonitoring: this.isMonitoring
      },
      metrics: this.metrics,
      dashboard: this.getDashboardData(),
      performanceHistory: this.performanceHistory.slice(-100), // Last 100 snapshots
      alertHistory: this.alertHistory.slice(-50), // Last 50 alerts
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Generate monitoring report
   */
  generateReport(timeframe = '24h') {
    const dashboard = this.getDashboardData();
    const health = this.healthMonitor.getCurrentHealth();
    
    return {
      title: `IT-ERA Conversation ID System Monitoring Report`,
      timeframe,
      generatedAt: new Date().toISOString(),
      summary: {
        overallHealth: dashboard.health.systemStatus,
        totalIDsGenerated: dashboard.performance.idGeneration.totalGenerated,
        averageGenerationTime: dashboard.performance.idGeneration.averageTime,
        storageSuccessRate: dashboard.performance.storage.successRate,
        cacheHitRate: dashboard.performance.caching.hitRate,
        duplicatesDetected: dashboard.quality.duplicates.detected,
        duplicatesPrevented: dashboard.quality.duplicates.prevented,
        totalAlerts: dashboard.alerts.total,
        criticalAlerts: dashboard.alerts.bySeverity.critical
      },
      performance: dashboard.performance,
      quality: dashboard.quality,
      health: {
        systemHealth: dashboard.health,
        healthChecks: health,
        uptime: dashboard.uptime
      },
      alerts: dashboard.alerts,
      insights: dashboard.insights,
      trends: dashboard.trends,
      recommendations: this.generateRecommendations(dashboard)
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(dashboard) {
    const recommendations = [];
    
    // Performance recommendations
    if (dashboard.performance.idGeneration.averageTime > this.options.performanceThresholds.idGeneration) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        component: 'id_generation',
        issue: 'Slow ID generation',
        recommendation: 'Optimize ID generation algorithm or increase system resources',
        expectedImpact: 'Reduced response time and improved user experience'
      });
    }
    
    if (dashboard.performance.caching.hitRate < 75) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        component: 'caching',
        issue: 'Low cache hit rate',
        recommendation: 'Review cache configuration and increase cache size if needed',
        expectedImpact: 'Faster response times and reduced storage load'
      });
    }
    
    // Quality recommendations
    const duplicateRate = parseFloat(dashboard.quality.overall.duplicateRate);
    if (duplicateRate > 0.5) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        component: 'duplicate_prevention',
        issue: 'High duplicate rate',
        recommendation: 'Strengthen unique ID generation algorithm and implement better collision detection',
        expectedImpact: 'Improved system reliability and data integrity'
      });
    }
    
    // Health recommendations
    if (dashboard.alerts.bySeverity.critical > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'critical',
        component: 'system_health',
        issue: 'Critical alerts present',
        recommendation: 'Investigate and resolve critical alerts immediately',
        expectedImpact: 'Prevent system failures and data loss'
      });
    }
    
    // Storage recommendations
    if (dashboard.performance.storage.usage.storageSize > 50 * 1024 * 1024) { // 50MB
      recommendations.push({
        type: 'capacity',
        priority: 'medium',
        component: 'storage',
        issue: 'Growing storage usage',
        recommendation: 'Implement automated cleanup of expired IDs and monitor capacity',
        expectedImpact: 'Prevent storage capacity issues and maintain performance'
      });
    }
    
    return recommendations;
  }
}

// Export singleton instance
const idSystemMonitor = new ConversationIDMonitor({
  alertingEnabled: true,
  healthCheckInterval: 60000, // 1 minute
  metricsRetentionHours: 24,
  duplicateAlertThreshold: 5,
  performanceThresholds: {
    idGeneration: 50, // ms
    storageOp: 100, // ms
    cacheHit: 95 // percentage
  }
});

export { ConversationIDMonitor, idSystemMonitor };
export default idSystemMonitor;