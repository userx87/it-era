/**
 * Claude Flow Engine Tests
 * Comprehensive test suite for the main engine
 */

const ClaudeFlowEngine = require('../../lib/claude-flow/ClaudeFlowEngine');
const fs = require('fs-extra');
const path = require('path');

describe('ClaudeFlowEngine', () => {
    let engine;
    const testMemoryPath = path.join(__dirname, 'test-memory');
    
    beforeEach(async () => {
        // Clean up test memory directory
        await fs.remove(testMemoryPath);
        
        engine = new ClaudeFlowEngine({
            debug: false,
            memoryBackend: 'filesystem',
            basePath: testMemoryPath
        });
    });
    
    afterEach(async () => {
        if (engine && engine.initialized) {
            await engine.shutdown();
        }
        await fs.remove(testMemoryPath);
    });
    
    describe('Initialization', () => {
        test('should initialize successfully', async () => {
            await engine.initialize();
            
            expect(engine.initialized).toBe(true);
            expect(engine.sessionManager).toBeDefined();
            expect(engine.memorySystem).toBeDefined();
            expect(engine.workflowEngine).toBeDefined();
            expect(engine.auggieIntegration).toBeDefined();
        });
        
        test('should not initialize twice', async () => {
            await engine.initialize();
            const firstInit = engine.initialized;
            
            await engine.initialize();
            const secondInit = engine.initialized;
            
            expect(firstInit).toBe(true);
            expect(secondInit).toBe(true);
            expect(engine.sessionManager).toBeDefined();
        });
        
        test('should have correct initial status', async () => {
            await engine.initialize();
            const status = engine.getStatus();
            
            expect(status.version).toBe('1.0.0');
            expect(status.initialized).toBe(true);
            expect(status.enabled).toBe(true);
            expect(status.currentSession).toBeNull();
            expect(status.activeWorkflows).toBe(0);
            expect(status.components.sessionManager).toBe(true);
            expect(status.components.memorySystem).toBe(true);
            expect(status.components.workflowEngine).toBe(true);
            expect(status.components.auggieIntegration).toBe(true);
        });
    });
    
    describe('Session Management', () => {
        beforeEach(async () => {
            await engine.initialize();
        });
        
        test('should create a session', async () => {
            const session = await engine.createSession({
                name: 'Test Session',
                description: 'Test session description'
            });
            
            expect(session).toBeDefined();
            expect(session.id).toBeDefined();
            expect(session.name).toBe('Test Session');
            expect(session.description).toBe('Test session description');
            expect(session.status).toBe('active');
            expect(session.startTime).toBeDefined();
            expect(engine.currentSession).toBe(session);
        });
        
        test('should get a session by ID', async () => {
            const createdSession = await engine.createSession({
                name: 'Test Session'
            });
            
            const retrievedSession = await engine.getSession(createdSession.id);
            
            expect(retrievedSession).toBeDefined();
            expect(retrievedSession.id).toBe(createdSession.id);
            expect(retrievedSession.name).toBe('Test Session');
        });
        
        test('should end a session', async () => {
            const session = await engine.createSession({
                name: 'Test Session'
            });
            
            const endedSession = await engine.endSession(session.id);
            
            expect(endedSession.status).toBe('ended');
            expect(endedSession.endTime).toBeDefined();
            expect(engine.currentSession).toBeNull();
        });
        
        test('should handle non-existent session', async () => {
            const nonExistentId = 'non-existent-id';
            const session = await engine.getSession(nonExistentId);
            
            expect(session).toBeNull();
        });
    });
    
    describe('Memory Operations', () => {
        beforeEach(async () => {
            await engine.initialize();
        });
        
        test('should store and retrieve memory', async () => {
            const testData = { message: 'Hello, World!', timestamp: Date.now() };
            
            await engine.storeMemory('test-key', testData, 'test-namespace');
            const retrievedData = await engine.retrieveMemory('test-key', 'test-namespace');
            
            expect(retrievedData).toEqual(testData);
        });
        
        test('should return null for non-existent memory', async () => {
            const data = await engine.retrieveMemory('non-existent-key', 'test-namespace');
            expect(data).toBeNull();
        });
        
        test('should search memory', async () => {
            const testData1 = { type: 'user', name: 'John Doe' };
            const testData2 = { type: 'admin', name: 'Jane Smith' };
            
            await engine.storeMemory('user1', testData1, 'users');
            await engine.storeMemory('user2', testData2, 'users');
            
            const results = await engine.searchMemory('John', { namespace: 'users' });
            
            expect(results).toHaveLength(1);
            expect(results[0].key).toBe('users:user1');
        });
        
        test('should handle memory operations with default namespace', async () => {
            const testData = { value: 42 };
            
            await engine.storeMemory('default-key', testData);
            const retrievedData = await engine.retrieveMemory('default-key');
            
            expect(retrievedData).toEqual(testData);
        });
    });
    
    describe('Workflow Execution', () => {
        beforeEach(async () => {
            await engine.initialize();
        });
        
        test('should execute a workflow', async () => {
            const session = await engine.createSession({ name: 'Workflow Test' });
            
            const workflow = await engine.executeWorkflow('code_analysis', {
                sessionId: session.id
            });
            
            expect(workflow).toBeDefined();
            expect(workflow.id).toBeDefined();
            expect(workflow.name).toBe('code_analysis');
            expect(workflow.sessionId).toBe(session.id);
            expect(workflow.status).toBe('running');
        });
        
        test('should fail to execute workflow without session', async () => {
            await expect(engine.executeWorkflow('code_analysis')).rejects.toThrow(
                'No active session. Create a session first.'
            );
        });
        
        test('should fail to execute non-existent workflow', async () => {
            const session = await engine.createSession({ name: 'Test' });
            
            await expect(engine.executeWorkflow('non-existent-workflow', {
                sessionId: session.id
            })).rejects.toThrow('Workflow not found: non-existent-workflow');
        });
    });
    
    describe('State Management', () => {
        beforeEach(async () => {
            await engine.initialize();
        });
        
        test('should save and load state', async () => {
            // Create some state
            await engine.createSession({ name: 'Test Session' });
            engine.metrics.sessionsCreated = 5;
            engine.metrics.workflowsExecuted = 10;
            
            // Save state
            const savedState = await engine.saveState();
            
            expect(savedState).toBeDefined();
            expect(savedState.version).toBe('1.0.0');
            expect(savedState.metrics.sessionsCreated).toBe(5);
            expect(savedState.metrics.workflowsExecuted).toBe(10);
            
            // Load state
            const loadedState = await engine.loadState();
            
            expect(loadedState).toBeDefined();
            expect(loadedState.version).toBe('1.0.0');
            expect(loadedState.metrics.sessionsCreated).toBe(5);
            expect(loadedState.metrics.workflowsExecuted).toBe(10);
        });
        
        test('should handle missing state gracefully', async () => {
            const loadedState = await engine.loadState();
            expect(loadedState).toBeNull();
        });
    });
    
    describe('Event Handling', () => {
        beforeEach(async () => {
            await engine.initialize();
        });
        
        test('should emit session events', async () => {
            const sessionCreatedEvents = [];
            const sessionEndedEvents = [];
            
            engine.on('sessionCreated', (session) => {
                sessionCreatedEvents.push(session);
            });
            
            engine.on('sessionEnded', (session) => {
                sessionEndedEvents.push(session);
            });
            
            const session = await engine.createSession({ name: 'Event Test' });
            await engine.endSession(session.id);
            
            expect(sessionCreatedEvents).toHaveLength(1);
            expect(sessionCreatedEvents[0].id).toBe(session.id);
            expect(sessionEndedEvents).toHaveLength(1);
            expect(sessionEndedEvents[0].id).toBe(session.id);
        });
        
        test('should emit workflow events', async () => {
            const workflowStartedEvents = [];
            
            engine.on('workflowStarted', (workflow) => {
                workflowStartedEvents.push(workflow);
            });
            
            const session = await engine.createSession({ name: 'Workflow Event Test' });
            await engine.executeWorkflow('code_analysis', { sessionId: session.id });
            
            // Wait a bit for async workflow execution
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(workflowStartedEvents).toHaveLength(1);
            expect(workflowStartedEvents[0].name).toBe('code_analysis');
        });
        
        test('should emit memory events', async () => {
            const memoryStoredEvents = [];
            const memoryRetrievedEvents = [];
            
            engine.on('memoryStored', (key, data) => {
                memoryStoredEvents.push({ key, data });
            });
            
            engine.on('memoryRetrieved', (key, data) => {
                memoryRetrievedEvents.push({ key, data });
            });
            
            const testData = { test: 'data' };
            await engine.storeMemory('event-test', testData);
            await engine.retrieveMemory('event-test');
            
            expect(memoryStoredEvents).toHaveLength(1);
            expect(memoryStoredEvents[0].key).toBe('default:event-test');
            expect(memoryStoredEvents[0].data).toEqual(testData);
            
            expect(memoryRetrievedEvents).toHaveLength(1);
            expect(memoryRetrievedEvents[0].key).toBe('default:event-test');
            expect(memoryRetrievedEvents[0].data).toEqual(testData);
        });
    });
    
    describe('Error Handling', () => {
        test('should handle initialization errors gracefully', async () => {
            // Create engine with invalid configuration
            const invalidEngine = new ClaudeFlowEngine({
                memoryBackend: 'invalid-backend'
            });
            
            await expect(invalidEngine.initialize()).rejects.toThrow();
        });
        
        test('should track errors in metrics', async () => {
            await engine.initialize();
            
            const initialErrors = engine.metrics.errors;
            
            // Trigger an error by trying to end non-existent session
            try {
                await engine.endSession('non-existent-id');
            } catch (error) {
                // Expected to fail
            }
            
            expect(engine.metrics.errors).toBeGreaterThan(initialErrors);
        });
    });
    
    describe('Shutdown', () => {
        test('should shutdown gracefully', async () => {
            await engine.initialize();
            
            const session = await engine.createSession({ name: 'Shutdown Test' });
            expect(engine.initialized).toBe(true);
            expect(engine.currentSession).toBeDefined();
            
            await engine.shutdown();
            
            expect(engine.initialized).toBe(false);
            expect(engine.currentSession).toBeNull();
        });
        
        test('should save state on shutdown', async () => {
            await engine.initialize();
            
            await engine.createSession({ name: 'Shutdown State Test' });
            engine.metrics.sessionsCreated = 3;
            
            await engine.shutdown();
            
            // Create new engine and load state
            const newEngine = new ClaudeFlowEngine({
                debug: false,
                memoryBackend: 'filesystem',
                basePath: testMemoryPath
            });
            
            await newEngine.initialize();
            const loadedState = await newEngine.loadState();
            
            expect(loadedState).toBeDefined();
            expect(loadedState.metrics.sessionsCreated).toBe(3);
            
            await newEngine.shutdown();
        });
    });
});
