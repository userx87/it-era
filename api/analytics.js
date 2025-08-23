/**
 * Cloudflare Worker - API Analytics IT-ERA
 * Tracking visite, conversioni e metriche custom
 */

// Configurazione
const CONFIG = {
  // Eventi tracciabili
  EVENTS: {
    PAGE_VIEW: 'page_view',
    FORM_START: 'form_start',
    FORM_SUBMIT: 'form_submit',
    PHONE_CLICK: 'phone_click',
    EMAIL_CLICK: 'email_click',
    DOWNLOAD: 'download',
    SCROLL_DEPTH: 'scroll_depth',
    TIME_ON_PAGE: 'time_on_page',
    PACKAGE_SELECT: 'package_select',
    QUOTE_REQUEST: 'quote_request',
  },
  
  // Dimensioni schermo
  SCREEN_SIZES: {
    mobile: { max: 768 },
    tablet: { min: 769, max: 1024 },
    desktop: { min: 1025 },
  },
  
  // UTM parameters
  UTM_PARAMS: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'],
};

// Analizza User Agent
function parseUserAgent(userAgent) {
  const ua = userAgent.toLowerCase();
  
  // Browser
  let browser = 'unknown';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edge')) browser = 'Edge';
  
  // Device
  let device = 'desktop';
  if (ua.includes('mobile')) device = 'mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'tablet';
  
  // OS
  let os = 'unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { browser, device, os };
}

// Genera session ID
function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Calcola metriche aggregate
async function calculateMetrics(KV, period = 'today') {
  const now = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      endDate = new Date();
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      endDate = new Date();
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
  }
  
  // Recupera metriche dal KV
  const metrics = {
    pageViews: 0,
    uniqueVisitors: 0,
    sessions: 0,
    avgTimeOnSite: 0,
    bounceRate: 0,
    conversionRate: 0,
    topPages: [],
    topReferrers: [],
    deviceBreakdown: {},
    locationBreakdown: {},
  };
  
  // Qui andrebbero le query reali al database
  // Per ora restituiamo dati mock
  return metrics;
}

// Salva evento nel database
async function saveEvent(event, env) {
  const timestamp = new Date().toISOString();
  const dayKey = timestamp.split('T')[0];
  
  // Salva in KV per aggregazioni rapide
  if (env.ANALYTICS_KV) {
    // Incrementa contatori giornalieri
    const eventKey = `events:${dayKey}:${event.type}`;
    const currentCount = await env.ANALYTICS_KV.get(eventKey) || '0';
    await env.ANALYTICS_KV.put(eventKey, String(parseInt(currentCount) + 1), {
      expirationTtl: 86400 * 90 // 90 giorni
    });
    
    // Salva dettaglio evento
    const detailKey = `event:${timestamp}:${Math.random().toString(36).substring(7)}`;
    await env.ANALYTICS_KV.put(detailKey, JSON.stringify(event), {
      expirationTtl: 86400 * 30 // 30 giorni
    });
  }
  
  // Salva in D1 per query complesse
  if (env.ANALYTICS_DB) {
    try {
      await env.ANALYTICS_DB.prepare(`
        INSERT INTO events (
          session_id, type, page, referrer, user_agent, ip_address,
          country, city, screen_width, screen_height, 
          utm_source, utm_medium, utm_campaign, data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        event.sessionId,
        event.type,
        event.page,
        event.referrer,
        event.userAgent,
        event.ipAddress,
        event.location?.country,
        event.location?.city,
        event.screen?.width,
        event.screen?.height,
        event.utm?.source,
        event.utm?.medium,
        event.utm?.campaign,
        JSON.stringify(event.data || {}),
        timestamp
      ).run();
    } catch (error) {
      console.error('Database error:', error);
    }
  }
}

// API Handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    try {
      // POST /api/track - Traccia evento
      if (url.pathname === '/api/track' && request.method === 'POST') {
        const data = await request.json();
        
        // Informazioni dalla richiesta
        const ipAddress = request.headers.get('CF-Connecting-IP') || 'unknown';
        const userAgent = request.headers.get('User-Agent') || 'unknown';
        const country = request.headers.get('CF-IPCountry') || 'unknown';
        const city = request.cf?.city || 'unknown';
        
        // Parse user agent
        const { browser, device, os } = parseUserAgent(userAgent);
        
        // Costruisci evento
        const event = {
          sessionId: data.sessionId || generateSessionId(),
          type: data.type || CONFIG.EVENTS.PAGE_VIEW,
          page: data.page || url.pathname,
          referrer: data.referrer || request.headers.get('Referer') || 'direct',
          userAgent,
          browser,
          device,
          os,
          ipAddress,
          location: { country, city },
          screen: data.screen || {},
          utm: data.utm || {},
          data: data.data || {},
          timestamp: new Date().toISOString(),
        };
        
        // Salva evento
        await saveEvent(event, env);
        
        // Rispondi con session ID per tracking
        return new Response(JSON.stringify({
          success: true,
          sessionId: event.sessionId,
        }), { headers });
      }
      
      // GET /api/analytics/dashboard - Dashboard metriche
      if (url.pathname === '/api/analytics/dashboard' && request.method === 'GET') {
        const period = url.searchParams.get('period') || 'today';
        const metrics = await calculateMetrics(env.ANALYTICS_KV, period);
        
        return new Response(JSON.stringify({
          success: true,
          period,
          metrics,
        }), { headers });
      }
      
      // GET /api/analytics/realtime - Visitatori in tempo reale
      if (url.pathname === '/api/analytics/realtime' && request.method === 'GET') {
        const realtimeData = {
          activeUsers: 0,
          currentPages: [],
          recentEvents: [],
        };
        
        if (env.ANALYTICS_KV) {
          // Recupera sessioni attive (ultimi 5 minuti)
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
          // Implementa logica per sessioni attive
        }
        
        return new Response(JSON.stringify({
          success: true,
          data: realtimeData,
        }), { headers });
      }
      
      // GET /api/analytics/report - Report dettagliato
      if (url.pathname === '/api/analytics/report' && request.method === 'GET') {
        const startDate = url.searchParams.get('start');
        const endDate = url.searchParams.get('end');
        const type = url.searchParams.get('type') || 'summary';
        
        // Genera report basato su tipo
        const report = {
          type,
          period: { startDate, endDate },
          data: {},
        };
        
        switch (type) {
          case 'conversions':
            // Report conversioni
            report.data = {
              totalConversions: 0,
              conversionRate: 0,
              conversionsBySource: {},
              conversionsByPage: {},
            };
            break;
            
          case 'traffic':
            // Report traffico
            report.data = {
              totalVisits: 0,
              uniqueVisitors: 0,
              pageViews: 0,
              avgSessionDuration: 0,
              topPages: [],
              topReferrers: [],
            };
            break;
            
          case 'engagement':
            // Report engagement
            report.data = {
              avgTimeOnPage: 0,
              bounceRate: 0,
              scrollDepth: {},
              interactions: {},
            };
            break;
            
          default:
            // Report sommario
            report.data = {
              overview: {},
              highlights: [],
              trends: {},
            };
        }
        
        return new Response(JSON.stringify({
          success: true,
          report,
        }), { headers });
      }
      
      // POST /api/analytics/goal - Traccia obiettivo/conversione
      if (url.pathname === '/api/analytics/goal' && request.method === 'POST') {
        const { goalName, goalValue, sessionId, metadata } = await request.json();
        
        // Registra conversione
        const conversion = {
          sessionId: sessionId || generateSessionId(),
          type: 'goal_completion',
          goalName,
          goalValue: goalValue || 1,
          metadata: metadata || {},
          timestamp: new Date().toISOString(),
        };
        
        await saveEvent(conversion, env);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Goal tracked successfully',
        }), { headers });
      }
      
      return new Response(JSON.stringify({
        error: 'Endpoint not found',
      }), { status: 404, headers });
      
    } catch (error) {
      console.error('Analytics error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Analytics error',
      }), { status: 500, headers });
    }
  },
};
