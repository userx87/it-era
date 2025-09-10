/**
 * Claude Flow API Endpoints
 * REST API for Claude Flow operations
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const ClaudeFlowEngine = require('../../lib/claude-flow/ClaudeFlowEngine');

const router = express.Router();

// Initialize Claude Flow Engine
let claudeFlowEngine = null;

const initializeEngine = async () => {
    if (!claudeFlowEngine) {
        claudeFlowEngine = new ClaudeFlowEngine({
            debug: process.env.NODE_ENV === 'development'
        });
        await claudeFlowEngine.initialize();
    }
    return claudeFlowEngine;
};

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many API requests, please try again later.'
});

const workflowLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit workflow executions
    message: 'Too many workflow executions, please try again later.'
});

router.use(apiLimiter);

// Middleware for validation error handling
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const engine = await initializeEngine();
        const status = engine.getStatus();
        
        res.json({
            success: true,
            status: 'healthy',
            claudeFlow: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Claude Flow engine not available',
            message: error.message
        });
    }
});

// Session Management Endpoints

// Create new session
router.post('/sessions', [
    body('name').optional().isString().isLength({ min: 1, max: 100 }),
    body('description').optional().isString().isLength({ max: 500 }),
    body('metadata').optional().isObject()
], handleValidationErrors, async (req, res) => {
    try {
        const engine = await initializeEngine();
        const { name, description, metadata } = req.body;
        
        const session = await engine.createSession({
            name,
            description,
            metadata
        });
        
        res.json({
            success: true,
            session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create session',
            message: error.message
        });
    }
});

// Get session
router.get('/sessions/:sessionId', [
    param('sessionId').isUUID()
], handleValidationErrors, async (req, res) => {
    try {
        const engine = await initializeEngine();
        const { sessionId } = req.params;
        
        const session = await engine.getSession(sessionId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        
        res.json({
            success: true,
            session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get session',
            message: error.message
        });
    }
});

// List sessions
router.get('/sessions', async (req, res) => {
    try {
        const engine = await initializeEngine();
        const sessions = engine.sessionManager.getSessions();
        
        res.json({
            success: true,
            sessions: sessions.map(session => ({
                id: session.id,
                name: session.name,
                status: session.status,
                startTime: session.startTime,
                endTime: session.endTime,
                workflowsCount: session.workflows.length
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to list sessions',
            message: error.message
        });
    }
});

// End session
router.delete('/sessions/:sessionId', [
    param('sessionId').isUUID()
], handleValidationErrors, async (req, res) => {
    try {
        const engine = await initializeEngine();
        const { sessionId } = req.params;
        
        const session = await engine.endSession(sessionId);
        
        res.json({
            success: true,
            session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to end session',
            message: error.message
        });
    }
});

// Workflow Endpoints

// Execute workflow
router.post('/workflows/execute', workflowLimiter, [
    body('workflowName').isString().isLength({ min: 1, max: 100 }),
    body('sessionId').optional().isUUID(),
    body('options').optional().isObject()
], handleValidationErrors, async (req, res) => {
    try {
        const engine = await initializeEngine();
        const { workflowName, sessionId, options = {} } = req.body;
        
        // Create session if not provided
        let targetSessionId = sessionId;
        if (!targetSessionId) {
            const session = await engine.createSession({
                name: `Workflow: ${workflowName}`,
                description: `Auto-created session for workflow execution`
            });
            targetSessionId = session.id;
        }
        
        const workflow = await engine.executeWorkflow(workflowName, {
            sessionId: targetSessionId,
            ...options
        });
        
        res.json({
            success: true,
            workflow: {
                id: workflow.id,
                name: workflow.name,
                status: workflow.status,
                sessionId: targetSessionId,
                startTime: workflow.startTime
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to execute workflow',
            message: error.message
        });
    }
});

// Get workflow status
router.get('/workflows/:workflowId', [
    param('workflowId').isUUID()
], handleValidationErrors, async (req, res) => {
    try {
        const engine = await initializeEngine();
        const { workflowId } = req.params;
        
        const workflow = engine.workflowEngine.getWorkflow(workflowId);
        
        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found'
            });
        }
        
        res.json({
            success: true,
            workflow
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow',
            message: error.message
        });
    }
});

// List available workflows
router.get('/workflows', async (req, res) => {
    try {
        const engine = await initializeEngine();
        const definitions = engine.workflowEngine.getWorkflowDefinitions();
        
        res.json({
            success: true,
            workflows: definitions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to list workflows',
            message: error.message
        });
    }
});

// Memory Endpoints

// Store memory
router.post('/memory', [
    body('key').isString().isLength({ min: 1, max: 200 }),
    body('data').exists(),
    body('namespace').optional().isString().isLength({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
    try {
        const engine = await initializeEngine();
        const { key, data, namespace = 'default' } = req.body;
        
        const id = await engine.storeMemory(key, data, namespace);
        
        res.json({
            success: true,
            id,
            key,
            namespace
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to store memory',
            message: error.message
        });
    }
});

// Retrieve memory
router.get('/memory/:namespace/:key', [
    param('namespace').isString().isLength({ min: 1, max: 50 }),
    param('key').isString().isLength({ min: 1, max: 200 })
], handleValidationErrors, async (req, res) => {
    try {
        const engine = await initializeEngine();
        const { namespace, key } = req.params;
        
        const data = await engine.retrieveMemory(key, namespace);
        
        if (data === null) {
            return res.status(404).json({
                success: false,
                error: 'Memory not found'
            });
        }
        
        res.json({
            success: true,
            key,
            namespace,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve memory',
            message: error.message
        });
    }
});

// Search memory
router.get('/memory/search', [
    query('q').isString().isLength({ min: 1, max: 200 }),
    query('namespace').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
    try {
        const engine = await initializeEngine();
        const { q: query, namespace, limit = 20 } = req.query;
        
        const results = await engine.searchMemory(query, {
            namespace,
            limit: parseInt(limit),
            includeData: true
        });
        
        res.json({
            success: true,
            query,
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to search memory',
            message: error.message
        });
    }
});

// AI Task Endpoint (for hybrid integration)
router.post('/ai-task', [
    body('messages').isArray(),
    body('options').optional().isObject(),
    body('provider').optional().isString()
], handleValidationErrors, async (req, res) => {
    try {
        const engine = await initializeEngine();
        const { messages, options = {}, provider = 'claude-flow' } = req.body;
        
        // Execute AI task through Auggie integration
        const result = await engine.auggieIntegration.executeHybridTask({
            type: 'ai_conversation',
            messages,
            provider
        }, options);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'AI task failed',
            message: error.message
        });
    }
});

// Analytics Endpoint
router.get('/analytics', async (req, res) => {
    try {
        const engine = await initializeEngine();
        const status = engine.getStatus();
        const memoryStats = engine.memorySystem.getStats();
        const integrationStatus = engine.auggieIntegration.getIntegrationStatus();
        
        res.json({
            success: true,
            analytics: {
                engine: status,
                memory: memoryStats,
                integration: integrationStatus,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get analytics',
            message: error.message
        });
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Claude Flow API Error:', error);
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

module.exports = router;
