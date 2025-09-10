/**
 * Claude Flow Session Manager
 * Advanced session management with checkpoints and state tracking
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class SessionManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxSessions: config.maxSessions || 10,
            sessionTimeout: config.sessionTimeout || 3600000, // 1 hour
            checkpointInterval: config.checkpointInterval || 300000, // 5 minutes
            debug: config.debug || false,
            ...config
        };
        
        this.memorySystem = config.memorySystem;
        this.sessions = new Map();
        this.checkpointTimers = new Map();
        this.initialized = false;
    }
    
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Load existing sessions from memory
            await this.loadSessions();
            
            this.initialized = true;
            this.log('Session manager initialized');
            this.emit('initialized');
        } catch (error) {
            this.logError('Failed to initialize session manager', error);
            throw error;
        }
    }
    
    async createSession(options = {}) {
        try {
            // Check session limit
            if (this.sessions.size >= this.config.maxSessions) {
                await this.cleanupOldSessions();
            }
            
            const session = {
                id: uuidv4(),
                name: options.name || `Session ${Date.now()}`,
                description: options.description || '',
                startTime: new Date().toISOString(),
                endTime: null,
                status: 'active',
                metadata: options.metadata || {},
                checkpoints: [],
                workflows: [],
                memory: {
                    namespace: `session:${uuidv4()}`,
                    keys: new Set()
                },
                stats: {
                    workflowsExecuted: 0,
                    memoryOperations: 0,
                    checkpointsCreated: 0,
                    errors: 0
                }
            };
            
            // Store session
            this.sessions.set(session.id, session);
            
            // Save to persistent memory
            await this.saveSession(session);
            
            // Start checkpoint timer
            this.startCheckpointTimer(session.id);
            
            this.log('Session created', { 
                sessionId: session.id, 
                name: session.name 
            });
            
            this.emit('sessionCreated', session);
            return session;
        } catch (error) {
            this.logError('Failed to create session', error);
            throw error;
        }
    }
    
    async getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            return session;
        }
        
        // Try loading from memory
        const loadedSession = await this.loadSession(sessionId);
        if (loadedSession) {
            this.sessions.set(sessionId, loadedSession);
            return loadedSession;
        }
        
        return null;
    }
    
    async updateSession(sessionId, updates) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }
            
            // Apply updates
            Object.assign(session, updates);
            session.updatedTime = new Date().toISOString();
            
            // Save updated session
            await this.saveSession(session);
            
            this.log('Session updated', { sessionId, updates });
            this.emit('sessionUpdated', session);
            
            return session;
        } catch (error) {
            this.logError(`Failed to update session: ${sessionId}`, error);
            throw error;
        }
    }
    
    async endSession(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }
            
            // Update session status
            session.status = 'ended';
            session.endTime = new Date().toISOString();
            session.duration = moment(session.endTime).diff(moment(session.startTime));
            
            // Stop checkpoint timer
            this.stopCheckpointTimer(sessionId);
            
            // Create final checkpoint
            await this.createCheckpoint(sessionId, 'Session ended');
            
            // Save final session state
            await this.saveSession(session);
            
            this.log('Session ended', { 
                sessionId, 
                duration: session.duration 
            });
            
            this.emit('sessionEnded', session);
            return session;
        } catch (error) {
            this.logError(`Failed to end session: ${sessionId}`, error);
            throw error;
        }
    }
    
    async createCheckpoint(sessionId, description = '') {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }
            
            const checkpoint = {
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                description,
                sessionState: {
                    workflows: [...session.workflows],
                    stats: { ...session.stats },
                    metadata: { ...session.metadata }
                },
                memorySnapshot: await this.createMemorySnapshot(session.memory.namespace)
            };
            
            session.checkpoints.push(checkpoint);
            session.stats.checkpointsCreated++;
            
            // Keep only last 10 checkpoints
            if (session.checkpoints.length > 10) {
                session.checkpoints = session.checkpoints.slice(-10);
            }
            
            await this.saveSession(session);
            
            this.log('Checkpoint created', { 
                sessionId, 
                checkpointId: checkpoint.id,
                description 
            });
            
            this.emit('checkpointCreated', session, checkpoint);
            return checkpoint;
        } catch (error) {
            this.logError(`Failed to create checkpoint: ${sessionId}`, error);
            throw error;
        }
    }
    
    async restoreCheckpoint(sessionId, checkpointId) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }
            
            const checkpoint = session.checkpoints.find(cp => cp.id === checkpointId);
            if (!checkpoint) {
                throw new Error(`Checkpoint not found: ${checkpointId}`);
            }
            
            // Restore session state
            session.workflows = checkpoint.sessionState.workflows;
            session.stats = checkpoint.sessionState.stats;
            session.metadata = checkpoint.sessionState.metadata;
            
            // Restore memory snapshot
            await this.restoreMemorySnapshot(session.memory.namespace, checkpoint.memorySnapshot);
            
            await this.saveSession(session);
            
            this.log('Checkpoint restored', { 
                sessionId, 
                checkpointId,
                timestamp: checkpoint.timestamp 
            });
            
            this.emit('checkpointRestored', session, checkpoint);
            return session;
        } catch (error) {
            this.logError(`Failed to restore checkpoint: ${sessionId}`, error);
            throw error;
        }
    }
    
    async addWorkflow(sessionId, workflow) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }
            
            session.workflows.push({
                id: workflow.id,
                name: workflow.name,
                status: workflow.status,
                startTime: workflow.startTime,
                endTime: workflow.endTime,
                result: workflow.result
            });
            
            session.stats.workflowsExecuted++;
            await this.saveSession(session);
            
            this.emit('workflowAdded', session, workflow);
        } catch (error) {
            this.logError(`Failed to add workflow to session: ${sessionId}`, error);
            throw error;
        }
    }
    
    async addMemoryKey(sessionId, key) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }
            
            session.memory.keys.add(key);
            session.stats.memoryOperations++;
            await this.saveSession(session);
        } catch (error) {
            this.logError(`Failed to add memory key to session: ${sessionId}`, error);
        }
    }
    
    getSessions() {
        return Array.from(this.sessions.values());
    }
    
    getActiveSessions() {
        return this.getSessions().filter(session => session.status === 'active');
    }
    
    async cleanupOldSessions() {
        const now = Date.now();
        const sessionsToRemove = [];
        
        for (const session of this.sessions.values()) {
            const sessionAge = now - new Date(session.startTime).getTime();
            if (sessionAge > this.config.sessionTimeout && session.status === 'active') {
                sessionsToRemove.push(session.id);
            }
        }
        
        for (const sessionId of sessionsToRemove) {
            await this.endSession(sessionId);
            this.sessions.delete(sessionId);
        }
        
        if (sessionsToRemove.length > 0) {
            this.log('Cleaned up old sessions', { count: sessionsToRemove.length });
        }
    }
    
    startCheckpointTimer(sessionId) {
        const timer = setInterval(async () => {
            try {
                await this.createCheckpoint(sessionId, 'Auto checkpoint');
            } catch (error) {
                this.logError(`Auto checkpoint failed for session: ${sessionId}`, error);
            }
        }, this.config.checkpointInterval);
        
        this.checkpointTimers.set(sessionId, timer);
    }
    
    stopCheckpointTimer(sessionId) {
        const timer = this.checkpointTimers.get(sessionId);
        if (timer) {
            clearInterval(timer);
            this.checkpointTimers.delete(sessionId);
        }
    }
    
    async createMemorySnapshot(namespace) {
        if (!this.memorySystem) return {};
        
        try {
            const keys = this.memorySystem.getKeys(namespace);
            const snapshot = {};
            
            for (const key of keys) {
                const data = await this.memorySystem.retrieve(key, namespace);
                if (data) {
                    snapshot[key] = data;
                }
            }
            
            return snapshot;
        } catch (error) {
            this.logError('Failed to create memory snapshot', error);
            return {};
        }
    }
    
    async restoreMemorySnapshot(namespace, snapshot) {
        if (!this.memorySystem || !snapshot) return;
        
        try {
            // Clear existing namespace
            await this.memorySystem.clear(namespace);
            
            // Restore snapshot data
            for (const [key, data] of Object.entries(snapshot)) {
                await this.memorySystem.store(key, data, namespace);
            }
        } catch (error) {
            this.logError('Failed to restore memory snapshot', error);
        }
    }
    
    async saveSession(session) {
        if (this.memorySystem) {
            await this.memorySystem.store(`session:${session.id}`, session, 'sessions');
        }
    }
    
    async loadSession(sessionId) {
        if (this.memorySystem) {
            return await this.memorySystem.retrieve(`session:${sessionId}`, 'sessions');
        }
        return null;
    }
    
    async loadSessions() {
        if (!this.memorySystem) return;
        
        try {
            const sessionKeys = this.memorySystem.getKeys('sessions');
            for (const key of sessionKeys) {
                const session = await this.memorySystem.retrieve(key, 'sessions');
                if (session) {
                    this.sessions.set(session.id, session);
                    
                    // Restart checkpoint timer for active sessions
                    if (session.status === 'active') {
                        this.startCheckpointTimer(session.id);
                    }
                }
            }
            
            this.log(`Loaded ${this.sessions.size} sessions from memory`);
        } catch (error) {
            this.logError('Failed to load sessions', error);
        }
    }
    
    async shutdown() {
        // Stop all checkpoint timers
        for (const timer of this.checkpointTimers.values()) {
            clearInterval(timer);
        }
        this.checkpointTimers.clear();
        
        // End all active sessions
        const activeSessions = this.getActiveSessions();
        for (const session of activeSessions) {
            await this.endSession(session.id);
        }
        
        this.log('Session manager shutdown');
        this.emit('shutdown');
    }
    
    log(message, data = {}) {
        if (this.config.debug) {
            console.log(`[SessionManager] ${message}`, data);
        }
    }
    
    logError(message, error) {
        console.error(`[SessionManager] ERROR: ${message}`, error);
    }
}

module.exports = SessionManager;
