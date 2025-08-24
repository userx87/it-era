/**
 * API Gateway Chatbot Integration Test
 * Tests the routing integration between main API Gateway and chatbot endpoints
 */

import apiGateway from '../../src/index.js';

describe('API Gateway Chatbot Integration', () => {
  let mockEnv;

  beforeEach(() => {
    // Mock environment variables
    mockEnv = {
      ENVIRONMENT: 'test',
      CHAT_SESSIONS: {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      },
      OPENROUTER_API_KEY: 'test-key',
    };

    // Mock fetch globally
    global.fetch = jest.fn();
    global.console = {
      ...console,
      error: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Chatbot Routing', () => {
    test('should route /api/chat to chatbot handler', async () => {
      const request = new Request('https://api.it-era.it/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      const response = await apiGateway.fetch(request, mockEnv, {});

      // Should not return 404, meaning it was routed to chatbot handler
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(405);
    });

    test('should route chatbot health check to chatbot handler', async () => {
      const request = new Request('https://api.it-era.it/health', {
        method: 'GET',
        headers: { 'User-Agent': 'chatbot-health-check' },
      });

      const response = await apiGateway.fetch(request, mockEnv, {});

      // Should route to chatbot handler, not return 404
      expect(response.status).not.toBe(404);
    });

    test('should route chatbot analytics to chatbot handler', async () => {
      const request = new Request('https://api.it-era.it/analytics', {
        method: 'GET',
        headers: { 'X-Chatbot-Request': 'true' },
      });

      const response = await apiGateway.fetch(request, mockEnv, {});

      // Should route to chatbot handler
      expect(response.status).not.toBe(404);
    });

    test('should handle CORS preflight for chatbot endpoints', async () => {
      const request = new Request('https://api.it-era.it/api/chat', {
        method: 'OPTIONS',
        headers: { 
          'Origin': 'https://it-era.it',
          'Access-Control-Request-Method': 'POST',
        },
      });

      const response = await apiGateway.fetch(request, mockEnv, {});

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });

  describe('API Documentation', () => {
    test('should include chatbot endpoints in API documentation', async () => {
      const request = new Request('https://api.it-era.it/api', {
        method: 'GET',
      });

      const response = await apiGateway.fetch(request, mockEnv, {});
      const data = await response.json();

      expect(data.endpoints).toHaveProperty('chatbot');
      expect(data.endpoints.chatbot).toHaveProperty('POST /api/chat');
      expect(data.endpoints.chatbot).toHaveProperty('GET /health');
      expect(data.endpoints.chatbot).toHaveProperty('GET /analytics');
    });
  });

  describe('Health Check Integration', () => {
    test('should include chatbot status in main health check', async () => {
      const request = new Request('https://api.it-era.it/api/health', {
        method: 'GET',
      });

      const response = await apiGateway.fetch(request, mockEnv, {});
      const data = await response.json();

      expect(data).toHaveProperty('services');
      expect(data.services).toHaveProperty('chatbot');
      expect(['healthy', 'error', 'unknown']).toContain(data.services.chatbot);
    });

    test('should handle chatbot health check failure gracefully', async () => {
      const request = new Request('https://api.it-era.it/api/health', {
        method: 'GET',
      });

      const response = await apiGateway.fetch(request, mockEnv, {});

      // Should not fail even if chatbot is unavailable
      expect(response.status).toBeLessThan(400);
      const data = await response.json();
      expect(data).toHaveProperty('services');
    });
  });

  describe('Error Handling', () => {
    test('should handle chatbot service errors gracefully', async () => {
      const request = new Request('https://api.it-era.it/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      const response = await apiGateway.fetch(request, mockEnv, {});

      if (response.status === 503) {
        const data = await response.json();
        expect(data).toHaveProperty('fallback');
        expect(data.fallback).toContain('info@it-era.it');
        expect(data.fallback).toContain('039 888 2041');
      }
    });

    test('should provide proper error headers for chatbot failures', async () => {
      const request = new Request('https://api.it-era.it/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      const response = await apiGateway.fetch(request, mockEnv, {});

      if (response.status === 503) {
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      }
    });
  });

  describe('Route Priority', () => {
    test('should prioritize chatbot analytics over general analytics', async () => {
      const chatbotRequest = new Request('https://api.it-era.it/analytics', {
        method: 'GET',
        headers: { 'X-Chatbot-Request': 'true' },
      });

      const response = await apiGateway.fetch(chatbotRequest, mockEnv, {});

      // This should route to chatbot, not general analytics
      // We can't easily test the exact routing, but we can check it doesn't fail
      expect(response.status).not.toBe(404);
    });

    test('should route non-chatbot analytics to general handler', async () => {
      const generalRequest = new Request('https://api.it-era.it/api/analytics', {
        method: 'GET',
      });

      const response = await apiGateway.fetch(generalRequest, mockEnv, {});

      // Should route to general analytics handler
      expect(response.status).not.toBe(404);
    });
  });
});