/**
 * Monitoring API Endpoints
 * Provides REST API endpoints for the ID system monitoring dashboard
 * Integrates with existing IT-ERA API infrastructure
 */

import idSystemMonitor from './id-system-monitor.js';
import idDashboard from './id-dashboard.js';
import idMonitoringIntegration from './id-integration.js';
import { healthMonitor } from './health-monitor.js';

class MonitoringAPI {
  constructor() {
    this.apiVersion = '1.0.0';
    this.endpoints = {
      dashboard: '/api/monitoring/id-system/dashboard',
      overview: '/api/monitoring/id-system/overview',
      performance: '/api/monitoring/id-system/performance',
      alerts: '/api/monitoring/id-system/alerts',
      health: '/api/monitoring/id-system/health',
      unified: '/api/monitoring/unified',
      reports: '/api/monitoring/reports',
      metrics: '/api/monitoring/metrics'
    };
  }

  /**
   * Initialize monitoring API
   */
  async initialize() {
    console.log('🚀 Initializing Monitoring API...');
    
    try {
      // Initialize monitoring integration
      await idMonitoringIntegration.initialize();
      
      console.log('✅ Monitoring API initialized successfully');
      console.log('📍 Available endpoints:', Object.values(this.endpoints));
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Monitoring API:', error);
      throw error;
    }
  }

  /**
   * Handle API requests
   */
  async handleRequest(request, pathname, searchParams) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route to appropriate handler
      if (pathname.startsWith('/api/monitoring/id-system/dashboard')) {
        return await this.handleDashboardRequest(request, searchParams, corsHeaders);
      }
      
      if (pathname.startsWith('/api/monitoring/id-system/overview')) {
        return await this.handleOverviewRequest(request, searchParams, corsHeaders);
      }
      
      if (pathname.startsWith('/api/monitoring/id-system/performance')) {
        return await this.handlePerformanceRequest(request, searchParams, corsHeaders);
      }
      
      if (pathname.startsWith('/api/monitoring/id-system/alerts')) {
        return await this.handleAlertsRequest(request, searchParams, corsHeaders);
      }
      
      if (pathname.startsWith('/api/monitoring/id-system/health')) {
        return await this.handleHealthRequest(request, searchParams, corsHeaders);
      }
      
      if (pathname.startsWith('/api/monitoring/unified')) {
        return await this.handleUnifiedRequest(request, searchParams, corsHeaders);
      }
      
      if (pathname.startsWith('/api/monitoring/reports')) {
        return await this.handleReportsRequest(request, searchParams, corsHeaders);
      }
      
      if (pathname.startsWith('/api/monitoring/metrics')) {
        return await this.handleMetricsRequest(request, searchParams, corsHeaders);
      }

      // API info endpoint
      if (pathname === '/api/monitoring' || pathname === '/api/monitoring/') {
        return this.handleApiInfoRequest(corsHeaders);
      }

      // Not found
      return new Response(JSON.stringify({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: Object.values(this.endpoints)
      }), {
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error('Monitoring API error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  /**
   * Handle dashboard requests
   */
  async handleDashboardRequest(request, searchParams, corsHeaders) {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: corsHeaders
      });
    }

    const realTime = searchParams.get('realtime') === 'true';
    
    if (realTime) {
      const dashboardData = idDashboard.getRealTimeDashboard();
      return new Response(JSON.stringify({
        success: true,
        data: dashboardData,
        type: 'realtime_dashboard'
      }), {
        headers: corsHeaders
      });
    } else {
      const overviewData = idDashboard.getOverview();
      return new Response(JSON.stringify({
        success: true,
        data: overviewData,
        type: 'dashboard_overview'
      }), {
        headers: corsHeaders
      });
    }
  }

  /**
   * Handle overview requests
   */
  async handleOverviewRequest(request, searchParams, corsHeaders) {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: corsHeaders
      });
    }

    const overview = idDashboard.getOverview();
    const systemStatus = idMonitoringIntegration.getSystemStatus();

    return new Response(JSON.stringify({
      success: true,
      data: {
        idSystem: overview,
        unified: systemStatus,
        api: {
          version: this.apiVersion,
          endpoints: this.endpoints
        }
      },
      timestamp: new Date().toISOString()
    }), {
      headers: corsHeaders
    });
  }

  /**
   * Handle performance requests
   */
  async handlePerformanceRequest(request, searchParams, corsHeaders) {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: corsHeaders
      });
    }

    const timeframe = searchParams.get('timeframe') || '1h';
    const component = searchParams.get('component');

    try {
      const performanceData = idDashboard.getPerformanceMetrics(timeframe);
      
      let filteredData = performanceData;
      
      // Filter by component if requested
      if (component && ['id_generation', 'storage', 'caching'].includes(component)) {
        filteredData = {
          ...performanceData,
          data: {
            performance: performanceData.data.performance.map(p => ({
              timestamp: p.timestamp,
              [component]: p[component]
            }))
          }
        };
      }

      return new Response(JSON.stringify({
        success: true,
        data: filteredData,
        query: { timeframe, component }
      }), {
        headers: corsHeaders
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve performance data',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  /**
   * Handle alerts requests
   */
  async handleAlertsRequest(request, searchParams, corsHeaders) {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: corsHeaders
      });
    }

    const timeframe = searchParams.get('timeframe') || '24h';
    const severity = searchParams.get('severity');
    const component = searchParams.get('component');

    try {
      const alertAnalysis = idDashboard.getAlertAnalysis(timeframe);
      
      let filteredAlerts = alertAnalysis;
      
      // Apply filters
      if (severity || component) {
        const originalAlerts = idSystemMonitor.alertHistory || [];
        let filtered = [...originalAlerts];
        
        if (severity) {
          filtered = filtered.filter(alert => alert.severity === severity);
        }
        
        if (component) {
          filtered = filtered.filter(alert => alert.component === component);
        }
        
        // Recalculate analysis with filtered data
        filteredAlerts = {
          ...alertAnalysis,
          alerts: {
            ...alertAnalysis.alerts,
            total: filtered.length,
            filtered: true,
            filters: { severity, component }
          }
        };
      }

      return new Response(JSON.stringify({
        success: true,
        data: filteredAlerts,
        query: { timeframe, severity, component }
      }), {
        headers: corsHeaders
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve alert data',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  /**
   * Handle health requests
   */
  async handleHealthRequest(request, searchParams, corsHeaders) {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: corsHeaders
      });
    }

    const detailed = searchParams.get('detailed') === 'true';

    try {
      const currentHealth = await healthMonitor.getCurrentHealth();
      const healthStats = healthMonitor.getHealthStats();
      const idSystemHealth = idSystemMonitor.getDashboardData();

      const healthData = {
        timestamp: new Date().toISOString(),
        overall: {
          status: currentHealth.status,
          summary: currentHealth.summary
        },
        systems: {
          idSystem: {
            status: idSystemHealth.health.systemStatus,
            uptime: idSystemHealth.uptime.formatted,
            alertCount: idSystemHealth.alerts.total
          },
          healthMonitor: {
            status: healthStats.isMonitoring ? 'active' : 'inactive',
            checks: healthStats.registeredChecks,
            successRate: healthStats.successRate
          }
        }
      };

      if (detailed) {
        healthData.detailed = {
          healthChecks: currentHealth.checks,
          history: healthMonitor.getHealthHistory(10),
          stats: healthStats
        };
      }

      return new Response(JSON.stringify({
        success: true,
        data: healthData
      }), {
        headers: corsHeaders
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve health data',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  /**
   * Handle unified monitoring requests
   */
  async handleUnifiedRequest(request, searchParams, corsHeaders) {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: corsHeaders
      });
    }

    const section = searchParams.get('section') || 'all';

    try {
      const unifiedMetrics = idMonitoringIntegration.getUnifiedMetrics();
      const systemStatus = idMonitoringIntegration.getSystemStatus();

      let responseData = {
        timestamp: new Date().toISOString(),
        integration: systemStatus.integration,
        metrics: unifiedMetrics,
        status: systemStatus
      };

      // Filter by section if requested
      if (section !== 'all' && ['performance', 'health', 'alerts', 'integration'].includes(section)) {
        responseData = {
          timestamp: responseData.timestamp,
          section,
          data: responseData[section] || responseData.metrics[section] || {}
        };
      }

      return new Response(JSON.stringify({
        success: true,
        data: responseData
      }), {
        headers: corsHeaders
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve unified monitoring data',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  /**
   * Handle reports requests
   */
  async handleReportsRequest(request, searchParams, corsHeaders) {
    if (request.method === 'GET') {
      const reportType = searchParams.get('type') || 'system';
      const format = searchParams.get('format') || 'json';

      try {
        let report;
        
        if (reportType === 'system') {
          report = idDashboard.generateSystemReport();
        } else if (reportType === 'unified') {
          report = idMonitoringIntegration.lastAutomatedReport || 
                   await idMonitoringIntegration.generateAutomatedReport();
        } else if (reportType === 'monitoring') {
          report = idSystemMonitor.generateReport('24h');
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid report type',
            availableTypes: ['system', 'unified', 'monitoring']
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Format handling
        if (format === 'json') {
          return new Response(JSON.stringify({
            success: true,
            report: report,
            type: reportType,
            format: format
          }), {
            headers: corsHeaders
          });
        } else if (format === 'summary') {
          return new Response(JSON.stringify({
            success: true,
            summary: {
              title: report.title,
              generatedAt: report.generatedAt,
              overallHealth: report.summary?.overallHealth || report.executiveSummary?.overallHealth,
              keyMetrics: {
                totalIDs: report.summary?.totalIDsGenerated || report.executiveSummary?.totalIDsGenerated,
                uptime: report.summary?.systemUptime || report.executiveSummary?.systemUptime,
                alerts: report.summary?.totalAlerts || report.executiveSummary?.criticalAlerts
              }
            },
            type: reportType,
            format: format
          }), {
            headers: corsHeaders
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Unsupported format',
            availableFormats: ['json', 'summary']
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to generate report',
          message: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (request.method === 'POST') {
      // Trigger manual report generation
      try {
        const report = await idMonitoringIntegration.generateAutomatedReport();
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Report generated successfully',
          report: {
            generatedAt: report.generatedAt,
            overallHealth: report.summary.overallHealth,
            totalAlerts: report.summary.totalAlerts
          }
        }), {
          headers: corsHeaders
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to generate report',
          message: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: corsHeaders
    });
  }

  /**
   * Handle metrics requests
   */
  async handleMetricsRequest(request, searchParams, corsHeaders) {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: corsHeaders
      });
    }

    const type = searchParams.get('type') || 'all';
    const format = searchParams.get('format') || 'json';

    try {
      let metrics = {};
      
      if (type === 'all' || type === 'id-system') {
        metrics.idSystem = idSystemMonitor.exportMetrics();
      }
      
      if (type === 'all' || type === 'unified') {
        metrics.unified = idMonitoringIntegration.getUnifiedMetrics();
      }
      
      if (type === 'all' || type === 'dashboard') {
        metrics.dashboard = idDashboard.getRealTimeDashboard();
      }

      // Format for prometheus if requested
      if (format === 'prometheus') {
        const prometheusMetrics = this.convertToPrometheusFormat(metrics);
        return new Response(prometheusMetrics, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain'
          }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: metrics,
        type: type,
        format: format,
        exportedAt: new Date().toISOString()
      }), {
        headers: corsHeaders
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to export metrics',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  /**
   * Handle API info request
   */
  handleApiInfoRequest(corsHeaders) {
    return new Response(JSON.stringify({
      success: true,
      api: {
        name: 'IT-ERA ID System Monitoring API',
        version: this.apiVersion,
        description: 'Advanced monitoring and analytics for conversation ID system',
        endpoints: this.endpoints,
        features: [
          'Real-time performance monitoring',
          'Advanced alerting and health checks',
          'Unified system integration',
          'Automated reporting',
          'Cross-system correlation analysis',
          'Performance trend analysis'
        ],
        documentation: {
          dashboard: 'Real-time dashboard data with optional real-time updates',
          overview: 'System overview with key metrics and status',
          performance: 'Performance metrics with configurable timeframes',
          alerts: 'Alert analysis with filtering and pattern detection',
          health: 'System health status and health checks',
          unified: 'Unified monitoring across all systems',
          reports: 'Automated and on-demand reporting',
          metrics: 'Metrics export in various formats including Prometheus'
        }
      },
      timestamp: new Date().toISOString()
    }), {
      headers: corsHeaders
    });
  }

  /**
   * Convert metrics to Prometheus format
   */
  convertToPrometheusFormat(metrics) {
    let prometheus = '';
    const timestamp = Date.now();

    // Helper function to add metric
    const addMetric = (name, value, labels = {}, help = '') => {
      if (help) {
        prometheus += `# HELP ${name} ${help}\n`;
        prometheus += `# TYPE ${name} gauge\n`;
      }
      
      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      
      const labelPart = labelStr ? `{${labelStr}}` : '';
      prometheus += `${name}${labelPart} ${value} ${timestamp}\n`;
    };

    // ID System metrics
    if (metrics.idSystem) {
      const idMetrics = metrics.idSystem.metrics;
      
      addMetric('itera_id_generation_total', idMetrics.performance.idGeneration.totalGenerated, 
                {}, 'Total number of IDs generated');
      addMetric('itera_id_generation_average_time_ms', idMetrics.performance.idGeneration.averageTime,
                {}, 'Average ID generation time in milliseconds');
      addMetric('itera_id_generation_success_rate', idMetrics.performance.idGeneration.successRate / 100,
                {}, 'ID generation success rate (0-1)');
      
      addMetric('itera_storage_operations_total', idMetrics.performance.storage.totalOperations,
                {}, 'Total storage operations');
      addMetric('itera_storage_success_rate', idMetrics.performance.storage.successRate / 100,
                {}, 'Storage operations success rate (0-1)');
      
      addMetric('itera_cache_hit_rate', idMetrics.performance.caching.hitRate / 100,
                {}, 'Cache hit rate (0-1)');
      addMetric('itera_cache_requests_total', idMetrics.performance.caching.totalRequests,
                {}, 'Total cache requests');
      
      addMetric('itera_duplicates_detected_total', idMetrics.quality.duplicates.detected,
                {}, 'Total duplicate IDs detected');
      addMetric('itera_duplicates_prevented_total', idMetrics.quality.duplicates.prevented,
                {}, 'Total duplicate IDs prevented');
      
      addMetric('itera_alerts_total', idMetrics.alerts.length, { severity: 'all' },
                'Total alerts by severity');
      
      // Alert breakdown by severity
      const alertSeverities = ['critical', 'high', 'medium', 'low'];
      alertSeverities.forEach(severity => {
        const count = idMetrics.alerts.filter(a => a.severity === severity).length;
        addMetric('itera_alerts_total', count, { severity });
      });
    }

    // Unified metrics
    if (metrics.unified) {
      const unified = metrics.unified;
      
      if (unified.performance) {
        addMetric('itera_system_health_score', unified.health?.overall === 'excellent' ? 1 :
                                                unified.health?.overall === 'good' ? 0.8 :
                                                unified.health?.overall === 'fair' ? 0.6 :
                                                unified.health?.overall === 'poor' ? 0.4 : 0.2,
                  {}, 'Overall system health score (0-1)');
      }
    }

    return prometheus;
  }

  /**
   * Get API status
   */
  getStatus() {
    return {
      version: this.apiVersion,
      endpoints: this.endpoints,
      monitoring: {
        idSystem: idSystemMonitor.isMonitoring,
        dashboard: idDashboard.options.realTimeUpdates,
        integration: Object.values(idMonitoringIntegration.integrationStatus).filter(s => s).length
      },
      lastUpdate: new Date().toISOString()
    };
  }
}

// Export singleton instance
const monitoringAPI = new MonitoringAPI();

export { MonitoringAPI, monitoringAPI };
export default monitoringAPI;