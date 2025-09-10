/**
 * Claude Flow Integration Tests
 * End-to-end integration tests for the complete system
 */

const request = require('supertest');
const ClaudeFlowEngine = require('../../lib/claude-flow/ClaudeFlowEngine');
const fs = require('fs-extra');
const path = require('path');

// Mock Express app for API testing
const express = require('express');
const claudeFlowRouter = require('../../api/claude-flow');

describe('Claude Flow Integration Tests', () => {
    let app;
    let engine;
    let testMemoryPath;
    
    beforeAll(async () => {
        // Setup test environment
        testMemoryPath = path.join(__dirname, 'integration-test-memory');
        await fs.remove(testMemoryPath);
        
        // Create Express app with Claude Flow API
        app = express();
        app.use(express.json());
        app.use('/api/claude-flow', claudeFlowRouter);
        
        // Initialize engine
        engine = new ClaudeFlowEngine({
            debug: false,
            memoryBackend: 'filesystem',
            basePath: testMemoryPath
        });
        
        await engine.initialize();
    });
    
    afterAll(async () => {
        if (engine) {
            await engine.shutdown();
        }
        await fs.remove(testMemoryPath);
    });
    
    describe('API Integration', () => {
        test('should get health status', async () => {
            const response = await request(app)
                .get('/api/claude-flow/health')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.status).toBe('healthy');
            expect(response.body.claudeFlow).toBeDefined();
            expect(response.body.claudeFlow.initialized).toBe(true);
        });
        
        test('should create session via API', async () => {
            const sessionData = {
                name: 'API Test Session',
                description: 'Created via API integration test'
            };
            
            const response = await request(app)
                .post('/api/claude-flow/sessions')
                .send(sessionData)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.session).toBeDefined();
            expect(response.body.session.name).toBe(sessionData.name);
            expect(response.body.session.description).toBe(sessionData.description);
            expect(response.body.session.status).toBe('active');
        });
        
        test('should list sessions via API', async () => {
            // Create a test session first
            await request(app)
                .post('/api/claude-flow/sessions')
                .send({ name: 'List Test Session' });
            
            const response = await request(app)
                .get('/api/claude-flow/sessions')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.sessions).toBeDefined();
            expect(Array.isArray(response.body.sessions)).toBe(true);
            expect(response.body.sessions.length).toBeGreaterThan(0);
        });
        
        test('should execute workflow via API', async () => {
            // Create session first
            const sessionResponse = await request(app)
                .post('/api/claude-flow/sessions')
                .send({ name: 'Workflow Test Session' });
            
            const sessionId = sessionResponse.body.session.id;
            
            const workflowResponse = await request(app)
                .post('/api/claude-flow/workflows/execute')
                .send({
                    workflowName: 'code_analysis',
                    sessionId: sessionId
                })
                .expect(200);
            
            expect(workflowResponse.body.success).toBe(true);
            expect(workflowResponse.body.workflow).toBeDefined();
            expect(workflowResponse.body.workflow.name).toBe('code_analysis');
            expect(workflowResponse.body.workflow.sessionId).toBe(sessionId);
        });
        
        test('should store and retrieve memory via API', async () => {
            const testData = {
                message: 'Integration test data',
                timestamp: Date.now(),
                nested: {
                    value: 42,
                    array: [1, 2, 3]
                }
            };
            
            // Store memory
            const storeResponse = await request(app)
                .post('/api/claude-flow/memory')
                .send({
                    key: 'integration-test',
                    data: testData,
                    namespace: 'test'
                })
                .expect(200);
            
            expect(storeResponse.body.success).toBe(true);
            expect(storeResponse.body.key).toBe('integration-test');
            expect(storeResponse.body.namespace).toBe('test');
            
            // Retrieve memory
            const retrieveResponse = await request(app)
                .get('/api/claude-flow/memory/test/integration-test')
                .expect(200);
            
            expect(retrieveResponse.body.success).toBe(true);
            expect(retrieveResponse.body.data).toEqual(testData);
        });
        
        test('should search memory via API', async () => {
            // Store some test data
            await request(app)
                .post('/api/claude-flow/memory')
                .send({
                    key: 'search-test-1',
                    data: { type: 'user', name: 'John Doe' },
                    namespace: 'search-test'
                });
            
            await request(app)
                .post('/api/claude-flow/memory')
                .send({
                    key: 'search-test-2',
                    data: { type: 'admin', name: 'Jane Smith' },
                    namespace: 'search-test'
                });
            
            // Search memory
            const searchResponse = await request(app)
                .get('/api/claude-flow/memory/search?q=John&namespace=search-test')
                .expect(200);
            
            expect(searchResponse.body.success).toBe(true);
            expect(searchResponse.body.results).toBeDefined();
            expect(searchResponse.body.results.length).toBeGreaterThan(0);
            expect(searchResponse.body.results[0].key).toContain('search-test-1');
        });
        
        test('should get analytics via API', async () => {
            const response = await request(app)
                .get('/api/claude-flow/analytics')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.analytics).toBeDefined();
            expect(response.body.analytics.engine).toBeDefined();
            expect(response.body.analytics.memory).toBeDefined();
            expect(response.body.analytics.integration).toBeDefined();
        });
    });
    
    describe('End-to-End Workflows', () => {
        test('should complete full session lifecycle', async () => {
            // 1. Create session
            const sessionResponse = await request(app)
                .post('/api/claude-flow/sessions')
                .send({
                    name: 'E2E Test Session',
                    description: 'End-to-end test session'
                });
            
            const sessionId = sessionResponse.body.session.id;
            
            // 2. Store some memory data
            await request(app)
                .post('/api/claude-flow/memory')
                .send({
                    key: 'e2e-data',
                    data: { phase: 'initialization', status: 'complete' },
                    namespace: `session:${sessionId}`
                });
            
            // 3. Execute workflow
            const workflowResponse = await request(app)
                .post('/api/claude-flow/workflows/execute')
                .send({
                    workflowName: 'code_analysis',
                    sessionId: sessionId
                });
            
            const workflowId = workflowResponse.body.workflow.id;
            
            // 4. Check workflow status
            const statusResponse = await request(app)
                .get(`/api/claude-flow/workflows/${workflowId}`)
                .expect(200);
            
            expect(statusResponse.body.success).toBe(true);
            expect(statusResponse.body.workflow.id).toBe(workflowId);
            
            // 5. Verify session has workflow
            const sessionCheckResponse = await request(app)
                .get(`/api/claude-flow/sessions/${sessionId}`)
                .expect(200);
            
            expect(sessionCheckResponse.body.session.workflows.length).toBeGreaterThan(0);
            
            // 6. End session
            const endResponse = await request(app)
                .delete(`/api/claude-flow/sessions/${sessionId}`)
                .expect(200);
            
            expect(endResponse.body.success).toBe(true);
            expect(endResponse.body.session.status).toBe('ended');
        });
        
        test('should handle concurrent operations', async () => {
            const promises = [];
            
            // Create multiple sessions concurrently
            for (let i = 0; i < 5; i++) {
                promises.push(
                    request(app)
                        .post('/api/claude-flow/sessions')
                        .send({ name: `Concurrent Session ${i}` })
                );
            }
            
            const responses = await Promise.all(promises);
            
            // All should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
            
            // Verify all sessions were created
            const listResponse = await request(app)
                .get('/api/claude-flow/sessions')
                .expect(200);
            
            expect(listResponse.body.sessions.length).toBeGreaterThanOrEqual(5);
        });
        
        test('should handle memory operations across namespaces', async () => {
            const namespaces = ['users', 'products', 'orders'];
            const storePromises = [];
            
            // Store data in different namespaces
            namespaces.forEach((namespace, index) => {
                storePromises.push(
                    request(app)
                        .post('/api/claude-flow/memory')
                        .send({
                            key: `item-${index}`,
                            data: { namespace, index, timestamp: Date.now() },
                            namespace
                        })
                );
            });
            
            await Promise.all(storePromises);
            
            // Search across all namespaces
            const searchResponse = await request(app)
                .get('/api/claude-flow/memory/search?q=timestamp')
                .expect(200);
            
            expect(searchResponse.body.results.length).toBeGreaterThanOrEqual(3);
            
            // Verify different namespaces are represented
            const foundNamespaces = new Set(
                searchResponse.body.results.map(r => r.namespace)
            );
            
            expect(foundNamespaces.size).toBeGreaterThanOrEqual(3);
        });
    });
    
    describe('Error Handling Integration', () => {
        test('should handle invalid session ID gracefully', async () => {
            const response = await request(app)
                .get('/api/claude-flow/sessions/invalid-uuid')
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
        });
        
        test('should handle non-existent session', async () => {
            const validUuid = '550e8400-e29b-41d4-a716-446655440000';
            
            const response = await request(app)
                .get(`/api/claude-flow/sessions/${validUuid}`)
                .expect(404);
            
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Session not found');
        });
        
        test('should handle invalid workflow execution', async () => {
            const response = await request(app)
                .post('/api/claude-flow/workflows/execute')
                .send({
                    workflowName: 'non-existent-workflow'
                })
                .expect(500);
            
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Failed to execute workflow');
        });
        
        test('should handle invalid memory operations', async () => {
            // Invalid JSON data
            const response = await request(app)
                .post('/api/claude-flow/memory')
                .send({
                    key: 'test',
                    // Missing data field
                    namespace: 'test'
                })
                .expect(400);
            
            expect(response.body.success).toBe(false);
        });
        
        test('should handle memory not found', async () => {
            const response = await request(app)
                .get('/api/claude-flow/memory/nonexistent/nonexistent-key')
                .expect(404);
            
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Memory not found');
        });
    });
    
    describe('Performance Integration', () => {
        test('should handle large memory operations efficiently', async () => {
            const largeData = {
                items: Array.from({ length: 1000 }, (_, i) => ({
                    id: i,
                    name: `Item ${i}`,
                    data: `Large data string for item ${i}`.repeat(10)
                }))
            };
            
            const startTime = Date.now();
            
            const storeResponse = await request(app)
                .post('/api/claude-flow/memory')
                .send({
                    key: 'large-data',
                    data: largeData,
                    namespace: 'performance'
                })
                .expect(200);
            
            const storeTime = Date.now() - startTime;
            
            expect(storeResponse.body.success).toBe(true);
            expect(storeTime).toBeLessThan(5000); // Should complete within 5 seconds
            
            // Retrieve the data
            const retrieveStartTime = Date.now();
            
            const retrieveResponse = await request(app)
                .get('/api/claude-flow/memory/performance/large-data')
                .expect(200);
            
            const retrieveTime = Date.now() - retrieveStartTime;
            
            expect(retrieveResponse.body.success).toBe(true);
            expect(retrieveResponse.body.data.items.length).toBe(1000);
            expect(retrieveTime).toBeLessThan(2000); // Should retrieve within 2 seconds
        });
        
        test('should handle multiple concurrent workflows', async () => {
            // Create session
            const sessionResponse = await request(app)
                .post('/api/claude-flow/sessions')
                .send({ name: 'Performance Test Session' });
            
            const sessionId = sessionResponse.body.session.id;
            
            // Execute multiple workflows concurrently
            const workflowPromises = [];
            const workflowNames = ['code_analysis', 'performance_optimization', 'run_tests'];
            
            workflowNames.forEach(workflowName => {
                workflowPromises.push(
                    request(app)
                        .post('/api/claude-flow/workflows/execute')
                        .send({ workflowName, sessionId })
                );
            });
            
            const startTime = Date.now();
            const responses = await Promise.all(workflowPromises);
            const totalTime = Date.now() - startTime;
            
            // All workflows should start successfully
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
            
            expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
        });
    });
});
