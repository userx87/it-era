/**
 * IT-ERA API Gateway
 * Combina tutti i worker in un unico endpoint
 */

import contactFormHandler from '../contact-form.js';
import quoteCalculatorHandler from '../quote-calculator.js';
import analyticsHandler from '../analytics.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Route to appropriate handler based on path
    if (url.pathname.startsWith('/api/contact')) {
      return contactFormHandler.fetch(request, env, ctx);
    }
    
    if (url.pathname.startsWith('/api/quote') || url.pathname.startsWith('/api/pricing') || url.pathname.startsWith('/api/hourly-quote')) {
      return quoteCalculatorHandler.fetch(request, env, ctx);
    }
    
    if (url.pathname.startsWith('/api/track') || url.pathname.startsWith('/api/analytics')) {
      return analyticsHandler.fetch(request, env, ctx);
    }
    
    // Health check endpoint
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'production',
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
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
          health: {
            'GET /api/health': 'Status API',
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
