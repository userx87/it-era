/**
 * Claude Flow Analytics System
 * Comprehensive monitoring and analytics for Claude Flow operations
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class AnalyticsSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enabled: config.enabled !== false,
            dataPath: config.dataPath || path.join(process.cwd(), '.claude-flow', 'analytics'),
            retentionDays: config.retentionDays || 30,
            batchSize: config.batchSize || 100,
            flushInterval: config.flushInterval || 60000, // 1 minute
            debug: config.debug || false,
            ...config
        };
        
        // Analytics data storage
        this.metrics = {
            sessions: {
                created: 0,
                ended: 0,
                active: 0,
                totalDuration: 0,
                averageDuration: 0
            },
            workflows: {
                executed: 0,
                completed: 0,
                failed: 0,
                totalDuration: 0,
                averageDuration: 0,
                byType: new Map()
            },
            memory: {
                operations: 0,
                stores: 0,
                retrievals: 0,
                searches: 0,
                hitRate: 0,
                totalSize: 0,
                namespaces: 0
            },
            errors: {
                total: 0,
                byType: new Map(),
                byComponent: new Map()
            },
            performance: {
                responseTime: {
                    min: Infinity,
                    max: 0,
                    average: 0,
                    p95: 0,
                    p99: 0
                },
                throughput: {
                    requestsPerSecond: 0,
                    operationsPerSecond: 0
                }
            }
        };
        
        // Event buffer for batch processing
        this.eventBuffer = [];
        this.flushTimer = null;
        
        // Performance tracking
        this.responseTimes = [];
        this.requestCounts = new Map();
        
        this.initialized = false;
    }
    
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Ensure analytics directory exists
            await fs.ensureDir(this.config.dataPath);
            
            // Load existing metrics
            await this.loadMetrics();
            
            // Start flush timer
            if (this.config.enabled) {
                this.startFlushTimer();
            }
            
            this.initialized = true;
            this.log('Analytics system initialized');
            this.emit('initialized');
        } catch (error) {
            this.logError('Failed to initialize analytics system', error);
            throw error;
        }
    }
    
    // Event tracking methods
    trackSessionCreated(session) {
        if (!this.config.enabled) return;
        
        this.metrics.sessions.created++;
        this.metrics.sessions.active++;
        
        this.addEvent('session_created', {
            sessionId: session.id,
            name: session.name,
            timestamp: session.startTime
        });
        
        this.log('Session created tracked', { sessionId: session.id });
    }
    
    trackSessionEnded(session) {
        if (!this.config.enabled) return;
        
        this.metrics.sessions.ended++;
        this.metrics.sessions.active = Math.max(0, this.metrics.sessions.active - 1);
        
        const duration = new Date(session.endTime) - new Date(session.startTime);
        this.metrics.sessions.totalDuration += duration;
        this.metrics.sessions.averageDuration = 
            this.metrics.sessions.totalDuration / this.metrics.sessions.ended;
        
        this.addEvent('session_ended', {
            sessionId: session.id,
            duration,
            workflowsExecuted: session.workflows.length,
            timestamp: session.endTime
        });
        
        this.log('Session ended tracked', { sessionId: session.id, duration });
    }
    
    trackWorkflowStarted(workflow) {
        if (!this.config.enabled) return;
        
        this.metrics.workflows.executed++;
        
        // Track by workflow type
        const count = this.metrics.workflows.byType.get(workflow.name) || 0;
        this.metrics.workflows.byType.set(workflow.name, count + 1);
        
        this.addEvent('workflow_started', {
            workflowId: workflow.id,
            name: workflow.name,
            sessionId: workflow.sessionId,
            timestamp: workflow.startTime
        });
        
        this.log('Workflow started tracked', { workflowId: workflow.id });
    }
    
    trackWorkflowCompleted(workflow) {
        if (!this.config.enabled) return;
        
        this.metrics.workflows.completed++;
        
        const duration = new Date(workflow.endTime) - new Date(workflow.startTime);
        this.metrics.workflows.totalDuration += duration;
        this.metrics.workflows.averageDuration = 
            this.metrics.workflows.totalDuration / this.metrics.workflows.completed;
        
        this.addEvent('workflow_completed', {
            workflowId: workflow.id,
            name: workflow.name,
            duration,
            stepsCompleted: workflow.steps.length,
            timestamp: workflow.endTime
        });
        
        this.log('Workflow completed tracked', { workflowId: workflow.id, duration });
    }
    
    trackWorkflowFailed(workflow, error) {
        if (!this.config.enabled) return;
        
        this.metrics.workflows.failed++;
        this.trackError(error, 'workflow');
        
        this.addEvent('workflow_failed', {
            workflowId: workflow.id,
            name: workflow.name,
            error: error.message,
            timestamp: workflow.endTime || new Date().toISOString()
        });
        
        this.log('Workflow failed tracked', { workflowId: workflow.id, error: error.message });
    }
    
    trackMemoryOperation(operation, key, namespace, success = true, responseTime = 0) {
        if (!this.config.enabled) return;
        
        this.metrics.memory.operations++;
        
        switch (operation) {
            case 'store':
                this.metrics.memory.stores++;
                break;
            case 'retrieve':
                this.metrics.memory.retrievals++;
                if (success) {
                    // Update hit rate calculation
                    const totalRetrieval = this.metrics.memory.retrievals;
                    const currentHitRate = this.metrics.memory.hitRate;
                    this.metrics.memory.hitRate = 
                        ((currentHitRate * (totalRetrieval - 1)) + (success ? 1 : 0)) / totalRetrieval;
                }
                break;
            case 'search':
                this.metrics.memory.searches++;
                break;
        }
        
        this.trackResponseTime(responseTime);
        
        this.addEvent('memory_operation', {
            operation,
            key,
            namespace,
            success,
            responseTime,
            timestamp: new Date().toISOString()
        });
    }
    
    trackError(error, component = 'unknown') {
        if (!this.config.enabled) return;
        
        this.metrics.errors.total++;
        
        // Track by error type
        const errorType = error.name || 'UnknownError';
        const typeCount = this.metrics.errors.byType.get(errorType) || 0;
        this.metrics.errors.byType.set(errorType, typeCount + 1);
        
        // Track by component
        const componentCount = this.metrics.errors.byComponent.get(component) || 0;
        this.metrics.errors.byComponent.set(component, componentCount + 1);
        
        this.addEvent('error', {
            type: errorType,
            message: error.message,
            component,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        this.log('Error tracked', { type: errorType, component });
    }
    
    trackResponseTime(responseTime) {
        if (!this.config.enabled || !responseTime) return;
        
        this.responseTimes.push(responseTime);
        
        // Keep only last 1000 response times for performance
        if (this.responseTimes.length > 1000) {
            this.responseTimes = this.responseTimes.slice(-1000);
        }
        
        // Update performance metrics
        this.updatePerformanceMetrics();
    }
    
    updatePerformanceMetrics() {
        if (this.responseTimes.length === 0) return;
        
        const sorted = [...this.responseTimes].sort((a, b) => a - b);
        
        this.metrics.performance.responseTime.min = Math.min(...sorted);
        this.metrics.performance.responseTime.max = Math.max(...sorted);
        this.metrics.performance.responseTime.average = 
            sorted.reduce((sum, time) => sum + time, 0) / sorted.length;
        
        // Calculate percentiles
        const p95Index = Math.floor(sorted.length * 0.95);
        const p99Index = Math.floor(sorted.length * 0.99);
        
        this.metrics.performance.responseTime.p95 = sorted[p95Index] || 0;
        this.metrics.performance.responseTime.p99 = sorted[p99Index] || 0;
    }
    
    updateThroughputMetrics() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        
        // Count requests in the last second
        let recentRequests = 0;
        for (const [timestamp, count] of this.requestCounts.entries()) {
            if (timestamp >= oneSecondAgo) {
                recentRequests += count;
            } else {
                // Clean up old entries
                this.requestCounts.delete(timestamp);
            }
        }
        
        this.metrics.performance.throughput.requestsPerSecond = recentRequests;
        this.metrics.performance.throughput.operationsPerSecond = 
            this.metrics.memory.operations + this.metrics.workflows.executed;
    }
    
    addEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: new Date().toISOString()
        };
        
        this.eventBuffer.push(event);
        
        // Flush if buffer is full
        if (this.eventBuffer.length >= this.config.batchSize) {
            this.flushEvents();
        }
        
        this.emit('event', event);
    }
    
    async flushEvents() {
        if (this.eventBuffer.length === 0) return;
        
        try {
            const events = [...this.eventBuffer];
            this.eventBuffer = [];
            
            // Save events to file
            const filename = `events-${moment().format('YYYY-MM-DD-HH')}.json`;
            const filepath = path.join(this.config.dataPath, filename);
            
            let existingEvents = [];
            if (await fs.pathExists(filepath)) {
                existingEvents = await fs.readJson(filepath);
            }
            
            existingEvents.push(...events);
            await fs.writeJson(filepath, existingEvents, { spaces: 2 });
            
            this.log(`Flushed ${events.length} events to ${filename}`);
        } catch (error) {
            this.logError('Failed to flush events', error);
        }
    }
    
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flushEvents();
            this.updateThroughputMetrics();
        }, this.config.flushInterval);
    }
    
    stopFlushTimer() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }
    
    async saveMetrics() {
        try {
            const metricsFile = path.join(this.config.dataPath, 'metrics.json');
            const metricsData = {
                ...this.metrics,
                // Convert Maps to Objects for JSON serialization
                workflows: {
                    ...this.metrics.workflows,
                    byType: Object.fromEntries(this.metrics.workflows.byType)
                },
                errors: {
                    ...this.metrics.errors,
                    byType: Object.fromEntries(this.metrics.errors.byType),
                    byComponent: Object.fromEntries(this.metrics.errors.byComponent)
                },
                lastUpdated: new Date().toISOString()
            };
            
            await fs.writeJson(metricsFile, metricsData, { spaces: 2 });
            this.log('Metrics saved');
        } catch (error) {
            this.logError('Failed to save metrics', error);
        }
    }
    
    async loadMetrics() {
        try {
            const metricsFile = path.join(this.config.dataPath, 'metrics.json');
            
            if (await fs.pathExists(metricsFile)) {
                const metricsData = await fs.readJson(metricsFile);
                
                // Restore metrics
                Object.assign(this.metrics, metricsData);
                
                // Convert Objects back to Maps
                if (metricsData.workflows?.byType) {
                    this.metrics.workflows.byType = new Map(Object.entries(metricsData.workflows.byType));
                }
                
                if (metricsData.errors?.byType) {
                    this.metrics.errors.byType = new Map(Object.entries(metricsData.errors.byType));
                }
                
                if (metricsData.errors?.byComponent) {
                    this.metrics.errors.byComponent = new Map(Object.entries(metricsData.errors.byComponent));
                }
                
                this.log('Metrics loaded from disk');
            }
        } catch (error) {
            this.logError('Failed to load metrics', error);
        }
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            workflows: {
                ...this.metrics.workflows,
                byType: Object.fromEntries(this.metrics.workflows.byType)
            },
            errors: {
                ...this.metrics.errors,
                byType: Object.fromEntries(this.metrics.errors.byType),
                byComponent: Object.fromEntries(this.metrics.errors.byComponent)
            },
            timestamp: new Date().toISOString()
        };
    }
    
    generateReport() {
        const metrics = this.getMetrics();
        
        return {
            summary: {
                totalSessions: metrics.sessions.created,
                activeSessions: metrics.sessions.active,
                totalWorkflows: metrics.workflows.executed,
                successRate: metrics.workflows.executed > 0 ? 
                    ((metrics.workflows.completed / metrics.workflows.executed) * 100).toFixed(2) + '%' : '0%',
                errorRate: metrics.workflows.executed > 0 ?
                    ((metrics.workflows.failed / metrics.workflows.executed) * 100).toFixed(2) + '%' : '0%',
                memoryHitRate: (metrics.memory.hitRate * 100).toFixed(2) + '%',
                averageResponseTime: metrics.performance.responseTime.average.toFixed(2) + 'ms'
            },
            performance: metrics.performance,
            topWorkflows: Array.from(metrics.workflows.byType.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5),
            topErrors: Array.from(metrics.errors.byType.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5),
            generatedAt: new Date().toISOString()
        };
    }
    
    async cleanup() {
        const cutoffDate = moment().subtract(this.config.retentionDays, 'days');
        
        try {
            const files = await fs.readdir(this.config.dataPath);
            
            for (const file of files) {
                if (file.startsWith('events-') && file.endsWith('.json')) {
                    const dateMatch = file.match(/events-(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) {
                        const fileDate = moment(dateMatch[1]);
                        if (fileDate.isBefore(cutoffDate)) {
                            await fs.remove(path.join(this.config.dataPath, file));
                            this.log(`Cleaned up old analytics file: ${file}`);
                        }
                    }
                }
            }
        } catch (error) {
            this.logError('Failed to cleanup old analytics files', error);
        }
    }
    
    async shutdown() {
        this.stopFlushTimer();
        await this.flushEvents();
        await this.saveMetrics();
        await this.cleanup();
        
        this.log('Analytics system shutdown');
        this.emit('shutdown');
    }
    
    log(message, data = {}) {
        if (this.config.debug) {
            console.log(`[Analytics] ${message}`, data);
        }
    }
    
    logError(message, error) {
        console.error(`[Analytics] ERROR: ${message}`, error);
    }
}

module.exports = AnalyticsSystem;
