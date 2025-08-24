/**
 * IT-ERA API Gateway
 * Combina tutti i worker in un unico endpoint
 */

import contactFormHandler from '../contact-form.js';
import quoteCalculatorHandler from '../quote-calculator.js';
import analyticsHandler from '../analytics.js';
import adminApiHandler from './admin/index.js';
import { BlogAPI } from './admin/blog-api.js';
import chatbotHandler from './chatbot/api/chatbot-worker.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    
    // Handle CORS preflight for chatbot endpoints
    if (request.method === 'OPTIONS' && (
        url.pathname.startsWith('/api/chat') || 
        url.pathname === '/health' || 
        url.pathname === '/analytics'
    )) {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Chatbot-Request, User-Agent',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // Route to appropriate handler based on path
    if (url.pathname.startsWith('/api/contact')) {
      return contactFormHandler.fetch(request, env, ctx);
    }
    
    if (url.pathname.startsWith('/api/quote') || url.pathname.startsWith('/api/pricing') || url.pathname.startsWith('/api/hourly-quote')) {
      return quoteCalculatorHandler.fetch(request, env, ctx);
    }
    
    // Chatbot endpoints - prioritize before analytics to avoid conflicts
    if (url.pathname.startsWith('/api/chat') || 
        (url.pathname === '/health' && request.headers.get('User-Agent')?.includes('chatbot')) ||
        (url.pathname === '/analytics' && request.method === 'GET' && request.headers.get('X-Chatbot-Request'))) {
      try {
        return await chatbotHandler.fetch(request, env, ctx);
      } catch (error) {
        console.error('Chatbot handler error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Chatbot service temporarily unavailable',
          fallback: 'Please contact support at info@it-era.it or call 039 888 2041',
          timestamp: new Date().toISOString()
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Chatbot-Request',
          },
        });
      }
    }
    
    if (url.pathname.startsWith('/api/track') || url.pathname.startsWith('/api/analytics')) {
      return analyticsHandler.fetch(request, env, ctx);
    }
    
    // Admin API routes
    if (url.pathname.startsWith('/admin/api/')) {
      return adminApiHandler.fetch(request, env, ctx);
    }
    
    // Public Blog API routes  
    if (url.pathname.startsWith('/api/posts') || 
        url.pathname.startsWith('/api/categories') ||
        url.pathname.startsWith('/api/tags') ||
        url.pathname.startsWith('/api/search') ||
        (url.pathname.startsWith('/api/track') && url.pathname.includes('view'))) {
      const blogAPI = new BlogAPI(env);
      return await blogAPI.handleRequest(request, env, ctx);
    }
    
    // Health check endpoint - Enhanced with chatbot status
    if (url.pathname === '/api/health') {
      try {
        // Check if we can also get chatbot status
        let chatbotStatus = 'unknown';
        try {
          const chatbotHealthCheck = await chatbotHandler.fetch(
            new Request(request.url.replace('/api/health', '/health'), {
              method: 'GET',
              headers: { 'User-Agent': 'chatbot-health-check' }
            }), 
            env, 
            ctx
          );
          if (chatbotHealthCheck.ok) {
            const chatbotHealth = await chatbotHealthCheck.json();
            chatbotStatus = chatbotHealth.status || 'healthy';
          }
        } catch (e) {
          chatbotStatus = 'error';
        }

        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT || 'production',
          services: {
            api: 'healthy',
            chatbot: chatbotStatus,
            contact: 'healthy',
            quotes: 'healthy',
            analytics: 'healthy'
          }
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          status: 'degraded',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT || 'production',
          error: 'Health check failed',
          services: {
            api: 'healthy',
            chatbot: 'error',
            contact: 'healthy', 
            quotes: 'healthy',
            analytics: 'healthy'
          }
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }
    
    // API documentation
    if (url.pathname === '/api' || url.pathname === '/api/') {
      return new Response(JSON.stringify({
        name: 'IT-ERA API',
        version: '1.0.0',
        endpoints: {
          contact: {
            'POST /api/contact': 'Invia form contatto',
          },
          pricing: {
            'GET /api/pricing': 'Ottieni listino prezzi',
            'POST /api/quote': 'Calcola preventivo personalizzato',
            'GET /api/quote/:id': 'Recupera preventivo salvato',
            'POST /api/hourly-quote': 'Calcola monte ore',
          },
          analytics: {
            'POST /api/track': 'Traccia evento',
            'GET /api/analytics/dashboard': 'Dashboard metriche',
            'GET /api/analytics/realtime': 'Dati in tempo reale',
            'GET /api/analytics/report': 'Report dettagliato',
            'POST /api/analytics/goal': 'Traccia conversione',
          },
          chatbot: {
            'POST /api/chat': 'AI-powered chatbot interface',
            'GET /health': 'Chatbot health check',
            'GET /analytics': 'Chatbot analytics (with X-Chatbot-Request header)',
          },
          health: {
            'GET /api/health': 'Status API',
          },
          admin: {
            'POST /admin/api/login': 'Admin login',
            'GET /admin/api/dashboard': 'Admin dashboard',
            'GET /admin/api/posts': 'Manage posts',
            'GET /admin/api/users': 'Manage users (admin)',
            'GET /admin/api/analytics/overview': 'Analytics overview',
            'GET /admin/api/settings': 'System settings (admin)',
            'Full API documentation': 'https://api.it-era.it/admin/api/',
          },
        },
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // 404 for unknown endpoints
    return new Response(JSON.stringify({
      error: 'Endpoint not found',
      path: url.pathname,
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
