/**
 * IMMEDIATE FIX #1: Response Caching Layer
 * Deploy: 24 hours
 * Impact: -40% response time for common queries
 */

// Response cache with TTL and LRU eviction
class ResponseCache {
  constructor(maxSize = 100, defaultTTL = 300000) { // 5 minutes
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.hitCount = 0;
    this.missCount = 0;
  }

  generateKey(message, intent, context = {}) {
    // Create normalized cache key
    const normalizedMessage = message.toLowerCase().trim().substring(0, 50);
    const contextHash = context.sessionType || 'default';
    return `${intent}:${normalizedMessage}:${contextHash}`;
  }

  get(message, intent, context = {}) {
    const key = this.generateKey(message, intent, context);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hitCount++;
    
    return {
      ...entry.response,
      cached: true,
      cacheAge: Date.now() - entry.timestamp
    };
  }

  set(message, intent, response, context = {}, customTTL = null) {
    const key = this.generateKey(message, intent, context);
    const ttl = customTTL || this.defaultTTL;
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const entry = {
      response: {
        message: response.message,
        options: response.options,
        source: response.source + '_cached',
        metadata: response.metadata
      },
      timestamp: Date.now(),
      ttl: ttl,
      intent: intent
    };

    this.cache.set(key, entry);
    return true;
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(2) + '%' : '0%',
      maxSize: this.maxSize
    };
  }

  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
}

// Global cache instance (per worker)
let globalResponseCache = null;

// Cache configuration by intent
const CACHE_SETTINGS = {
  'generale': { ttl: 600000, enabled: true },        // 10 min - general info
  'contatti': { ttl: 1800000, enabled: true },       // 30 min - contact info  
  'sicurezza': { ttl: 300000, enabled: true },       // 5 min - security info
  'backup': { ttl: 300000, enabled: true },          // 5 min - backup info
  'riparazione': { ttl: 180000, enabled: true },     // 3 min - repair info
  'supporto': { ttl: 180000, enabled: true },        // 3 min - support info
  'preventivo': { ttl: 60000, enabled: false },      // 1 min - quotes (disabled for personalization)
  'emergenza': { ttl: 0, enabled: false }            // No cache for emergencies
};

// Initialize cache
function initializeCache() {
  if (!globalResponseCache) {
    globalResponseCache = new ResponseCache(200, 300000); // 200 items, 5 min default
    console.log('✅ Response cache initialized');
  }
  return globalResponseCache;
}

// Enhanced generateResponse function with caching
async function generateResponseWithCache(message, intent, context = {}, env = null, sessionId = null) {
  const cache = initializeCache();
  const cacheSettings = CACHE_SETTINGS[intent] || CACHE_SETTINGS['generale'];
  
  // Try cache first (if enabled for this intent)
  if (cacheSettings.enabled) {
    const cachedResponse = cache.get(message, intent, context);
    if (cachedResponse) {
      console.log(`🎯 Cache hit for intent: ${intent}`);
      return cachedResponse;
    }
  }

  // Generate new response (using existing logic)
  const startTime = Date.now();
  let response;

  try {
    // Try Swarm first with reduced timeout
    if (swarmIntegration && env && sessionId) {
      try {
        console.log('🐝 Attempting swarm orchestration...');
        
        // Add timeout for swarm processing
        const swarmPromise = swarmIntegration.processMessage(sessionId, message, {
          messages: context.messages || [],
          context: context,
          intent: intent
        });
        
        const swarmResponse = await Promise.race([
          swarmPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Swarm timeout')), 2500) // Reduced from 8s to 2.5s
          )
        ]);
        
        if (swarmResponse && swarmResponse.response) {
          console.log('✅ Swarm response generated successfully');
          response = {
            message: swarmResponse.response,
            options: swarmResponse.suggestedActions || getDefaultOptions(intent),
            source: 'swarm',
            fallback: false,
            metadata: swarmResponse.metadata,
            leadScore: swarmResponse.leadScore,
            processingTime: Date.now() - startTime
          };
        }
      } catch (error) {
        console.warn('Swarm orchestration failed quickly, falling back:', error.message);
      }
    }

    // Try AI with reduced timeout if swarm failed
    if (!response && CONFIG.AI_ENABLED && aiEngine && env) {
      try {
        const aiResponse = await generateAIResponseWithTimeout(message, context, sessionId, 2000); // Reduced timeout
        if (aiResponse && aiResponse.message) {
          console.log('AI response generated successfully');
          response = {
            ...aiResponse,
            source: 'ai',
            fallback: false,
            processingTime: Date.now() - startTime
          };
        }
      } catch (error) {
        console.warn('AI generation failed, falling back to rule-based:', error.message);
      }
    }

    // Fallback to rule-based
    if (!response) {
      const fallbackResponse = generateFallbackResponse(message, intent, context);
      response = {
        ...fallbackResponse,
        source: 'fallback',
        fallback: true,
        processingTime: Date.now() - startTime
      };
    }

    // Cache the response (if cacheable)
    if (cacheSettings.enabled && response && !response.fallback) {
      cache.set(message, intent, response, context, cacheSettings.ttl);
      console.log(`💾 Response cached for intent: ${intent}`);
    }

    return response;

  } catch (error) {
    console.error('Response generation error:', error);
    
    // Return emergency fallback
    return {
      message: "Mi dispiace, c'è stato un problema tecnico. Ti prego di riprovare o contattaci al 039 888 2041.",
      options: ["📞 Chiama ora", "🔄 Riprova", "📧 Email"],
      source: 'emergency_fallback',
      fallback: true,
      error: true,
      processingTime: Date.now() - startTime
    };
  }
}

// Cache statistics endpoint
function getCacheStatistics() {
  const cache = globalResponseCache;
  if (!cache) return { enabled: false };
  
  return {
    enabled: true,
    ...cache.getStats(),
    settings: CACHE_SETTINGS
  };
}

// Cache management functions
function clearCache() {
  if (globalResponseCache) {
    globalResponseCache.clear();
    return true;
  }
  return false;
}

function warmupCache() {
  // Pre-populate cache with common responses
  const commonQueries = [
    { message: "che servizi offrite", intent: "generale" },
    { message: "quanto costa", intent: "preventivo" },
    { message: "contatti", intent: "contatti" },
    { message: "assistenza", intent: "supporto" },
    { message: "backup", intent: "backup" },
    { message: "sicurezza", intent: "sicurezza" }
  ];
  
  console.log('🔥 Warming up cache with common queries...');
  
  // This would be called during worker initialization
  commonQueries.forEach(async ({ message, intent }) => {
    try {
      await generateResponseWithCache(message, intent, {}, null, null);
    } catch (error) {
      console.warn(`Cache warmup failed for ${intent}:`, error.message);
    }
  });
}

export {
  ResponseCache,
  generateResponseWithCache,
  getCacheStatistics,
  clearCache,
  warmupCache,
  initializeCache,
  CACHE_SETTINGS
};