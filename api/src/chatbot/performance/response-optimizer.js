/**
 * IT-ERA Chatbot Performance Optimizer
 * Optimizes response times and handles caching for critical chatbot functions
 */

export class ResponseOptimizer {
  constructor(config = {}) {
    this.config = {
      cacheTimeout: config.cacheTimeout || 300, // 5 minutes
      maxResponseTime: config.maxResponseTime || 2000, // 2 seconds
      fallbackTimeout: config.fallbackTimeout || 1000, // 1 second
      ...config
    };
    
    this.cache = new Map();
    this.performanceMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      timeoutCount: 0
    };
  }

  /**
   * Generate optimized greeting with caching
   */
  async getOptimizedGreeting(context = {}) {
    const startTime = Date.now();
    const cacheKey = `greeting_${context.userAgent || 'default'}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTimeout * 1000) {
        this.performanceMetrics.cacheHits++;
        return {
          ...cached.response,
          cached: true,
          responseTime: Date.now() - startTime
        };
      }
    }

    // Generate new optimized greeting
    const greeting = {
      message: "[IT-ERA] Benvenuto! Siamo il vostro partner tecnologico di fiducia, specializzato in soluzioni IT avanzate per aziende. Il nostro team è pronto ad assistervi con competenza e professionalità. Come possiamo supportare la vostra crescita digitale?",
      options: [
        "Richiedi Preventivo", 
        "Assistenza Tecnica", 
        "Informazioni Servizi", 
        "Contatta Specialista"
      ],
      nextStep: "service_selection",
      intent: "greeting",
      confidence: 1.0,
      aiPowered: false,
      priority: "high"
    };

    // Cache the response
    this.cache.set(cacheKey, {
      response: greeting,
      timestamp: Date.now()
    });

    this.performanceMetrics.totalRequests++;
    return {
      ...greeting,
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Optimize API response with timeout handling
   */
  async optimizeApiResponse(apiCall, timeoutMs = this.config.maxResponseTime) {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        this.performanceMetrics.timeoutCount++;
      }, timeoutMs);

      const response = await Promise.race([
        apiCall(controller.signal),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ]);

      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      this.updateResponseMetrics(responseTime);
      
      return {
        ...response,
        responseTime,
        optimized: true
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.name === 'AbortError' || error.message === 'Timeout') {
        return this.getFallbackResponse(responseTime);
      }
      
      throw error;
    }
  }

  /**
   * Get professional fallback response
   */
  getFallbackResponse(responseTime) {
    return {
      message: "[IT-ERA] Il sistema sta caricando. Nel frattempo, come possiamo assistervi?",
      options: [
        "Richiedi Preventivo",
        "Assistenza Immediata", 
        "Contatta Direttamente"
      ],
      nextStep: "fallback_selection",
      fallback: true,
      responseTime,
      aiPowered: false
    };
  }

  /**
   * Update performance metrics
   */
  updateResponseMetrics(responseTime) {
    this.performanceMetrics.totalRequests++;
    
    const current = this.performanceMetrics.averageResponseTime;
    const count = this.performanceMetrics.totalRequests;
    
    this.performanceMetrics.averageResponseTime = 
      ((current * (count - 1)) + responseTime) / count;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.totalRequests > 0 ? 
        (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests) * 100 : 0,
      timeoutRate: this.performanceMetrics.totalRequests > 0 ?
        (this.performanceMetrics.timeoutCount / this.performanceMetrics.totalRequests) * 100 : 0
    };
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.cacheTimeout * 1000) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    return expiredKeys.length;
  }

  /**
   * Professional error messages with [IT-ERA] prefix
   */
  getErrorMessages() {
    return {
      timeout: "[IT-ERA] Stiamo riscontrando un rallentamento temporaneo. Il nostro team è comunque disponibile per assistervi.",
      connection: "[IT-ERA] Problema di connessione rilevato. I nostri specialisti sono pronti a supportarvi direttamente.",
      server: "[IT-ERA] Servizio temporaneamente non disponibile. Vi mettiamo in contatto con un nostro consulente.",
      general: "[IT-ERA] Si è verificato un inconveniente tecnico. Il nostro supporto tecnico può assistervi immediatamente."
    };
  }
}

export default ResponseOptimizer;