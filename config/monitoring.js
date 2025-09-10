/**
 * IT-ERA Performance Monitoring Configuration
 * Manages performance tracking, alerts, and monitoring
 */

const monitoringConfig = {
    // Core Web Vitals thresholds
    coreWebVitals: {
        lcp: {
            good: 2500,      // Largest Contentful Paint (ms)
            needsImprovement: 4000,
            poor: Infinity
        },
        fid: {
            good: 100,       // First Input Delay (ms)
            needsImprovement: 300,
            poor: Infinity
        },
        cls: {
            good: 0.1,       // Cumulative Layout Shift
            needsImprovement: 0.25,
            poor: Infinity
        },
        fcp: {
            good: 1800,      // First Contentful Paint (ms)
            needsImprovement: 3000,
            poor: Infinity
        },
        ttfb: {
            good: 800,       // Time to First Byte (ms)
            needsImprovement: 1800,
            poor: Infinity
        }
    },

    // Performance budgets
    performanceBudgets: {
        // Page load times (ms)
        loadTimes: {
            homepage: 3000,
            servicesPage: 3500,
            contactPage: 2500,
            cityPages: 3000
        },
        
        // Resource sizes (KB)
        resourceSizes: {
            totalPageSize: 2000,
            images: 800,
            css: 150,
            javascript: 300,
            fonts: 100
        },
        
        // Network requests
        requests: {
            total: 50,
            images: 20,
            css: 5,
            javascript: 10
        }
    },

    // Monitoring endpoints
    endpoints: [
        {
            name: 'Homepage',
            url: '/',
            critical: true,
            expectedResponseTime: 2000
        },
        {
            name: 'Services',
            url: '/servizi',
            critical: true,
            expectedResponseTime: 2500
        },
        {
            name: 'Contact',
            url: '/contatti',
            critical: true,
            expectedResponseTime: 2000
        },
        {
            name: 'Milano City Page',
            url: '/assistenza-it-milano',
            critical: false,
            expectedResponseTime: 3000
        },
        {
            name: 'Health Check',
            url: '/health',
            critical: true,
            expectedResponseTime: 500
        },
        {
            name: 'Sitemap',
            url: '/sitemap.xml',
            critical: false,
            expectedResponseTime: 1000
        }
    ],

    // Alert thresholds
    alerts: {
        // Response time alerts (ms)
        responseTime: {
            warning: 3000,
            critical: 5000
        },
        
        // Error rate alerts (%)
        errorRate: {
            warning: 1,
            critical: 5
        },
        
        // Availability alerts (%)
        availability: {
            warning: 99,
            critical: 95
        },
        
        // Core Web Vitals alerts
        coreWebVitals: {
            lcpWarning: 3000,
            lcpCritical: 4000,
            fidWarning: 200,
            fidCritical: 300,
            clsWarning: 0.15,
            clsCritical: 0.25
        }
    },

    // Monitoring services configuration
    services: {
        // Uptime Robot
        uptimeRobot: {
            enabled: process.env.ENABLE_UPTIME_MONITORING === 'true',
            apiKey: process.env.UPTIME_ROBOT_API_KEY,
            monitorInterval: 300 // 5 minutes
        },
        
        // Pingdom
        pingdom: {
            enabled: process.env.ENABLE_PINGDOM === 'true',
            apiKey: process.env.PINGDOM_API_KEY,
            checkInterval: 60 // 1 minute
        },
        
        // New Relic
        newRelic: {
            enabled: process.env.ENABLE_NEW_RELIC === 'true',
            licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
            appName: 'IT-ERA Website'
        },
        
        // Sentry (Error Monitoring)
        sentry: {
            enabled: process.env.ENABLE_SENTRY === 'true',
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'production'
        }
    },

    // Notification settings
    notifications: {
        email: {
            enabled: process.env.ENABLE_EMAIL_ALERTS === 'true',
            recipients: [
                'admin@it-era.it',
                'tech@it-era.it'
            ],
            smtp: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        },
        
        slack: {
            enabled: process.env.ENABLE_SLACK_ALERTS === 'true',
            webhookUrl: process.env.SLACK_WEBHOOK_URL,
            channel: '#it-era-alerts'
        },
        
        sms: {
            enabled: process.env.ENABLE_SMS_ALERTS === 'true',
            provider: 'twilio',
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            fromNumber: process.env.TWILIO_FROM_NUMBER,
            recipients: ['+39123456789']
        }
    }
};

/**
 * Get monitoring configuration for current environment
 */
function getMonitoringConfig(env = 'production') {
    const config = { ...monitoringConfig };
    
    // Adjust thresholds for development
    if (env === 'development') {
        // Relax performance budgets for development
        Object.keys(config.performanceBudgets.loadTimes).forEach(key => {
            config.performanceBudgets.loadTimes[key] *= 2;
        });
        
        // Disable external monitoring services in development
        Object.keys(config.services).forEach(service => {
            config.services[service].enabled = false;
        });
    }
    
    return config;
}

/**
 * Check if performance metric is within acceptable range
 */
function checkPerformanceMetric(metricName, value, thresholds) {
    if (value <= thresholds.good) {
        return { status: 'good', score: 100 };
    } else if (value <= thresholds.needsImprovement) {
        return { status: 'needs-improvement', score: 75 };
    } else {
        return { status: 'poor', score: 25 };
    }
}

/**
 * Generate performance report
 */
function generatePerformanceReport(metrics) {
    const config = getMonitoringConfig();
    const report = {
        timestamp: new Date().toISOString(),
        overall: { score: 0, status: 'unknown' },
        coreWebVitals: {},
        recommendations: []
    };
    
    // Evaluate Core Web Vitals
    Object.keys(config.coreWebVitals).forEach(metric => {
        if (metrics[metric] !== undefined) {
            const result = checkPerformanceMetric(
                metric,
                metrics[metric],
                config.coreWebVitals[metric]
            );
            report.coreWebVitals[metric] = {
                value: metrics[metric],
                ...result
            };
        }
    });
    
    // Calculate overall score
    const scores = Object.values(report.coreWebVitals).map(m => m.score);
    report.overall.score = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    
    // Determine overall status
    if (report.overall.score >= 90) {
        report.overall.status = 'good';
    } else if (report.overall.score >= 70) {
        report.overall.status = 'needs-improvement';
    } else {
        report.overall.status = 'poor';
    }
    
    // Generate recommendations
    report.recommendations = generateRecommendations(report.coreWebVitals);
    
    return report;
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(coreWebVitals) {
    const recommendations = [];
    
    // LCP recommendations
    if (coreWebVitals.lcp && coreWebVitals.lcp.status !== 'good') {
        recommendations.push({
            metric: 'LCP',
            issue: 'Slow Largest Contentful Paint',
            suggestions: [
                'Optimize images and use modern formats (WebP, AVIF)',
                'Implement lazy loading for below-the-fold content',
                'Minimize render-blocking resources',
                'Use a CDN for faster content delivery'
            ]
        });
    }
    
    // FID recommendations
    if (coreWebVitals.fid && coreWebVitals.fid.status !== 'good') {
        recommendations.push({
            metric: 'FID',
            issue: 'Poor First Input Delay',
            suggestions: [
                'Reduce JavaScript execution time',
                'Split large JavaScript bundles',
                'Use web workers for heavy computations',
                'Optimize third-party scripts'
            ]
        });
    }
    
    // CLS recommendations
    if (coreWebVitals.cls && coreWebVitals.cls.status !== 'good') {
        recommendations.push({
            metric: 'CLS',
            issue: 'High Cumulative Layout Shift',
            suggestions: [
                'Set explicit dimensions for images and videos',
                'Reserve space for dynamic content',
                'Avoid inserting content above existing content',
                'Use CSS aspect-ratio for responsive media'
            ]
        });
    }
    
    return recommendations;
}

/**
 * Send performance alert
 */
async function sendPerformanceAlert(alertType, message, severity = 'warning') {
    const config = getMonitoringConfig();
    
    // Email alert
    if (config.notifications.email.enabled) {
        // Implementation would go here
        console.log(`📧 Email alert: ${alertType} - ${message}`);
    }
    
    // Slack alert
    if (config.notifications.slack.enabled) {
        // Implementation would go here
        console.log(`💬 Slack alert: ${alertType} - ${message}`);
    }
    
    // SMS alert for critical issues
    if (severity === 'critical' && config.notifications.sms.enabled) {
        // Implementation would go here
        console.log(`📱 SMS alert: ${alertType} - ${message}`);
    }
}

module.exports = {
    monitoringConfig,
    getMonitoringConfig,
    checkPerformanceMetric,
    generatePerformanceReport,
    generateRecommendations,
    sendPerformanceAlert
};
