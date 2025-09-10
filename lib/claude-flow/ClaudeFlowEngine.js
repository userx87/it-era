/**
 * Claude Flow Engine - Main orchestration system
 * Integrates with IT-ERA's existing Auggie system
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const SessionManager = require('./SessionManager');
const MemorySystem = require('./MemorySystem');
const WorkflowEngine = require('./WorkflowEngine');
const AuggieIntegration = require('./integrations/AuggieIntegration');

class ClaudeFlowEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enabled: process.env.CLAUDE_FLOW_ENABLED !== 'false',
            debug: process.env.CLAUDE_FLOW_DEBUG === 'true',
            autoSave: true,
            autoSaveInterval: 30000, // 30 seconds
            maxSessions: 10,
            memoryBackend: process.env.CLAUDE_FLOW_MEMORY_BACKEND || 'filesystem',
            ...config
        };
        
        this.version = '1.0.0';
        this.initialized = false;
        this.startTime = Date.now();
        
        // Core components
        this.sessionManager = null;
        this.memorySystem = null;
        this.workflowEngine = null;
        this.auggieIntegration = null;
        
        // State tracking
        this.currentSession = null;
        this.activeWorkflows = new Map();
        this.metrics = {
            sessionsCreated: 0,
            workflowsExecuted: 0,
            memoryOperations: 0,
            errors: 0
        };
        
        this.log('Claude Flow Engine initialized', { version: this.version });
    }
    
    async initialize() {
        if (this.initialized) {
            return this;
        }
        
        try {
            this.log('Initializing Claude Flow Engine...');
            
            // Initialize core components
            this.memorySystem = new MemorySystem({
                backend: this.config.memoryBackend,
                autoSave: this.config.autoSave,
                debug: this.config.debug
            });
            await this.memorySystem.initialize();
            
            this.sessionManager = new SessionManager({
                memorySystem: this.memorySystem,
                maxSessions: this.config.maxSessions,
                debug: this.config.debug
            });
            await this.sessionManager.initialize();
            
            this.workflowEngine = new WorkflowEngine({
                memorySystem: this.memorySystem,
                sessionManager: this.sessionManager,
                debug: this.config.debug
            });
            await this.workflowEngine.initialize();
            
            // Initialize Auggie integration
            this.auggieIntegration = new AuggieIntegration({
                claudeFlowEngine: this,
                debug: this.config.debug
            });
            await this.auggieIntegration.initialize();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start auto-save if enabled
            if (this.config.autoSave) {
                this.startAutoSave();
            }
            
            this.initialized = true;
            this.log('Claude Flow Engine initialized successfully');
            this.emit('initialized');
            
            return this;
        } catch (error) {
            this.logError('Failed to initialize Claude Flow Engine', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        // Session events
        this.sessionManager.on('sessionCreated', (session) => {
            this.metrics.sessionsCreated++;
            this.emit('sessionCreated', session);
        });
        
        this.sessionManager.on('sessionEnded', (session) => {
            this.emit('sessionEnded', session);
        });
        
        // Workflow events
        this.workflowEngine.on('workflowStarted', (workflow) => {
            this.activeWorkflows.set(workflow.id, workflow);
            this.emit('workflowStarted', workflow);
        });
        
        this.workflowEngine.on('workflowCompleted', (workflow) => {
            this.activeWorkflows.delete(workflow.id);
            this.metrics.workflowsExecuted++;
            this.emit('workflowCompleted', workflow);
        });
        
        this.workflowEngine.on('workflowFailed', (workflow, error) => {
            this.activeWorkflows.delete(workflow.id);
            this.metrics.errors++;
            this.emit('workflowFailed', workflow, error);
        });
        
        // Memory events
        this.memorySystem.on('memoryStored', (key, data) => {
            this.metrics.memoryOperations++;
            this.emit('memoryStored', key, data);
        });
        
        this.memorySystem.on('memoryRetrieved', (key, data) => {
            this.metrics.memoryOperations++;
            this.emit('memoryRetrieved', key, data);
        });
    }
    
    startAutoSave() {
        setInterval(async () => {
            try {
                await this.saveState();
                this.log('Auto-save completed');
            } catch (error) {
                this.logError('Auto-save failed', error);
            }
        }, this.config.autoSaveInterval);
    }
    
    async createSession(options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        const session = await this.sessionManager.createSession({
            name: options.name || `Session ${Date.now()}`,
            description: options.description || 'Claude Flow session',
            metadata: options.metadata || {},
            ...options
        });
        
        this.currentSession = session;
        this.log('Session created', { sessionId: session.id });
        
        return session;
    }
    
    async getSession(sessionId) {
        return await this.sessionManager.getSession(sessionId);
    }
    
    async endSession(sessionId) {
        const session = await this.sessionManager.endSession(sessionId);
        
        if (this.currentSession && this.currentSession.id === sessionId) {
            this.currentSession = null;
        }
        
        this.log('Session ended', { sessionId });
        return session;
    }
    
    async executeWorkflow(workflowName, options = {}) {
        if (!this.currentSession) {
            throw new Error('No active session. Create a session first.');
        }
        
        const workflow = await this.workflowEngine.executeWorkflow(workflowName, {
            sessionId: this.currentSession.id,
            ...options
        });
        
        this.log('Workflow executed', { 
            workflowName, 
            workflowId: workflow.id,
            sessionId: this.currentSession.id 
        });
        
        return workflow;
    }
    
    async storeMemory(key, data, namespace = 'default') {
        return await this.memorySystem.store(key, data, namespace);
    }
    
    async retrieveMemory(key, namespace = 'default') {
        return await this.memorySystem.retrieve(key, namespace);
    }
    
    async searchMemory(query, options = {}) {
        return await this.memorySystem.search(query, options);
    }
    
    async saveState() {
        const state = {
            version: this.version,
            timestamp: new Date().toISOString(),
            currentSession: this.currentSession,
            activeWorkflows: Array.from(this.activeWorkflows.values()),
            metrics: this.metrics,
            uptime: Date.now() - this.startTime
        };
        
        await this.memorySystem.store('engine/state', state, 'system');
        return state;
    }
    
    async loadState() {
        try {
            const state = await this.memorySystem.retrieve('engine/state', 'system');
            if (state) {
                this.metrics = state.metrics || this.metrics;
                this.log('State loaded', { timestamp: state.timestamp });
            }
            return state;
        } catch (error) {
            this.logError('Failed to load state', error);
            return null;
        }
    }
    
    getStatus() {
        return {
            version: this.version,
            initialized: this.initialized,
            enabled: this.config.enabled,
            uptime: Date.now() - this.startTime,
            currentSession: this.currentSession ? {
                id: this.currentSession.id,
                name: this.currentSession.name,
                startTime: this.currentSession.startTime
            } : null,
            activeWorkflows: this.activeWorkflows.size,
            metrics: this.metrics,
            components: {
                sessionManager: !!this.sessionManager,
                memorySystem: !!this.memorySystem,
                workflowEngine: !!this.workflowEngine,
                auggieIntegration: !!this.auggieIntegration
            }
        };
    }
    
    async shutdown() {
        this.log('Shutting down Claude Flow Engine...');
        
        try {
            // Save final state
            await this.saveState();
            
            // End current session
            if (this.currentSession) {
                await this.endSession(this.currentSession.id);
            }
            
            // Shutdown components
            if (this.workflowEngine) {
                await this.workflowEngine.shutdown();
            }
            
            if (this.sessionManager) {
                await this.sessionManager.shutdown();
            }
            
            if (this.memorySystem) {
                await this.memorySystem.shutdown();
            }
            
            this.initialized = false;
            this.log('Claude Flow Engine shutdown complete');
            this.emit('shutdown');
        } catch (error) {
            this.logError('Error during shutdown', error);
            throw error;
        }
    }
    
    log(message, data = {}) {
        if (this.config.debug) {
            console.log(`[ClaudeFlow] ${moment().format('HH:mm:ss')} ${message}`, data);
        }
        
        // Store log in memory for debugging
        this.memorySystem?.store(`logs/${Date.now()}`, {
            timestamp: new Date().toISOString(),
            level: 'info',
            message,
            data
        }, 'system').catch(() => {}); // Silent fail for logging
    }
    
    logError(message, error) {
        console.error(`[ClaudeFlow] ERROR: ${message}`, error);
        this.metrics.errors++;
        
        // Store error in memory
        this.memorySystem?.store(`errors/${Date.now()}`, {
            timestamp: new Date().toISOString(),
            level: 'error',
            message,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        }, 'system').catch(() => {}); // Silent fail for logging
        
        this.emit('error', error);
    }
}

module.exports = ClaudeFlowEngine;
