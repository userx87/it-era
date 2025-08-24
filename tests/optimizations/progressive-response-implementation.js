/**
 * IMMEDIATE FIX #3: Progressive Response Strategy  
 * Deploy: 48 hours
 * Impact: Immediate user feedback while processing
 */

// Progressive response phases
const RESPONSE_PHASES = {
  IMMEDIATE: {
    delay: 0,
    message: "💭 Sto analizzando la tua richiesta...",
    duration: 200
  },
  THINKING: {
    delay: 200,
    message: "🤖 Consultando i nostri sistemi...",
    duration: 1000
  },
  PROCESSING: {
    delay: 1200,
    message: "⚡ Generando risposta personalizzata...",
    duration: 1500
  },
  FINALIZING: {
    delay: 2700,
    message: "✨ Completando l'analisi...",
    duration: 800
  }
};

// Intent-specific response strategies
const PROGRESSIVE_STRATEGIES = {
  'generale': {
    showProgress: false,
    estimatedTime: 500,
    phases: ['IMMEDIATE']
  },
  'preventivo': {
    showProgress: true,
    estimatedTime: 3000,
    phases: ['IMMEDIATE', 'THINKING', 'PROCESSING'],
    customMessages: {
      THINKING: "💰 Calcolando il miglior preventivo per te...",
      PROCESSING: "📊 Analizzando le tue esigenze..."
    }
  },
  'emergenza': {
    showProgress: false,
    estimatedTime: 800,
    phases: ['IMMEDIATE'],
    customMessages: {
      IMMEDIATE: "🚨 Rilevata emergenza - preparando risposta prioritaria..."
    }
  },
  'sicurezza': {
    showProgress: true,
    estimatedTime: 2500,
    phases: ['IMMEDIATE', 'THINKING', 'PROCESSING'],
    customMessages: {
      THINKING: "🛡️ Consultando database sicurezza...",
      PROCESSING: "🔍 Analizzando soluzioni WatchGuard..."
    }
  },
  'supporto': {
    showProgress: true,
    estimatedTime: 2000,
    phases: ['IMMEDIATE', 'THINKING'],
    customMessages: {
      THINKING: "🛠️ Identificando la soluzione migliore..."
    }
  },
  'backup': {
    showProgress: true,
    estimatedTime: 2200,
    phases: ['IMMEDIATE', 'THINKING', 'PROCESSING'],
    customMessages: {
      THINKING: "💾 Analizzando strategie di backup...",
      PROCESSING: "☁️ Valutando soluzioni cloud..."
    }
  }
};

class ProgressiveResponseManager {
  constructor() {
    this.activeResponses = new Map();
    this.updateCallbacks = new Map();
  }

  // Start progressive response
  startProgressiveResponse(sessionId, message, intent, callback) {
    const strategy = PROGRESSIVE_STRATEGIES[intent] || PROGRESSIVE_STRATEGIES['generale'];
    
    if (!strategy.showProgress) {
      // For fast responses, just return immediate acknowledgment
      return {
        immediate: true,
        response: strategy.customMessages?.IMMEDIATE || RESPONSE_PHASES.IMMEDIATE.message,
        estimatedTime: strategy.estimatedTime,
        loading: false
      };
    }

    // Store callback for updates
    this.updateCallbacks.set(sessionId, callback);
    
    // Initialize response state
    const responseState = {
      sessionId,
      message,
      intent,
      strategy,
      currentPhase: 0,
      startTime: Date.now(),
      phases: strategy.phases,
      completed: false
    };
    
    this.activeResponses.set(sessionId, responseState);
    
    // Start the progress sequence
    this.executeProgressiveSequence(responseState);
    
    // Return immediate response
    const firstPhase = strategy.phases[0];
    const customMessage = strategy.customMessages?.[firstPhase];
    const phaseConfig = RESPONSE_PHASES[firstPhase];
    
    return {
      immediate: true,
      response: customMessage || phaseConfig.message,
      estimatedTime: strategy.estimatedTime,
      loading: true,
      progress: 0,
      phase: firstPhase.toLowerCase()
    };
  }

  // Execute the progressive sequence
  async executeProgressiveSequence(responseState) {
    const { sessionId, strategy, phases } = responseState;
    
    for (let i = 1; i < phases.length; i++) {
      const phase = phases[i];
      const phaseConfig = RESPONSE_PHASES[phase];
      const customMessage = strategy.customMessages?.[phase];
      
      // Wait for the appropriate delay
      await new Promise(resolve => setTimeout(resolve, phaseConfig.delay));
      
      // Check if response is still active
      if (!this.activeResponses.has(sessionId)) return;
      
      // Send progress update
      const progressPercent = Math.round((i / phases.length) * 70); // Max 70% until completion
      
      this.sendUpdate(sessionId, {
        response: customMessage || phaseConfig.message,
        loading: true,
        progress: progressPercent,
        phase: phase.toLowerCase(),
        estimated_remaining: Math.max(strategy.estimatedTime - (Date.now() - responseState.startTime), 500)
      });
      
      responseState.currentPhase = i;
    }
  }

  // Complete the progressive response with final result
  completeResponse(sessionId, finalResponse) {
    const responseState = this.activeResponses.get(sessionId);
    if (!responseState) return false;
    
    responseState.completed = true;
    const totalTime = Date.now() - responseState.startTime;
    
    // Send final update
    this.sendUpdate(sessionId, {
      response: finalResponse.message,
      options: finalResponse.options,
      loading: false,
      progress: 100,
      phase: 'completed',
      source: finalResponse.source,
      processingTime: totalTime,
      metadata: finalResponse.metadata
    });
    
    // Cleanup
    this.cleanup(sessionId);
    return true;
  }

  // Handle response failure
  failResponse(sessionId, error, fallbackResponse = null) {
    const responseState = this.activeResponses.get(sessionId);
    if (!responseState) return false;
    
    const fallback = fallbackResponse || {
      message: "Mi dispiace, c'è stato un problema. Ti prego di riprovare o contattaci al 039 888 2041.",
      options: ["🔄 Riprova", "📞 Chiama ora", "📧 Email"],
      source: 'error_fallback'
    };
    
    this.sendUpdate(sessionId, {
      response: fallback.message,
      options: fallback.options,
      loading: false,
      progress: 100,
      phase: 'error',
      error: true,
      errorMessage: error.message
    });
    
    this.cleanup(sessionId);
    return true;
  }

  // Send update to client
  sendUpdate(sessionId, updateData) {
    const callback = this.updateCallbacks.get(sessionId);
    if (callback && typeof callback === 'function') {
      try {
        callback({
          sessionId,
          timestamp: Date.now(),
          ...updateData
        });
      } catch (error) {
        console.error('Progressive response callback error:', error);
      }
    }
  }

  // Cleanup completed response
  cleanup(sessionId) {
    this.activeResponses.delete(sessionId);
    this.updateCallbacks.delete(sessionId);
  }

  // Cancel ongoing response
  cancelResponse(sessionId) {
    this.cleanup(sessionId);
    console.log(`🛑 Progressive response cancelled for session: ${sessionId}`);
  }

  // Get active responses count
  getActiveCount() {
    return this.activeResponses.size;
  }

  // Get response state
  getResponseState(sessionId) {
    const state = this.activeResponses.get(sessionId);
    if (!state) return null;
    
    return {
      sessionId: state.sessionId,
      intent: state.intent,
      currentPhase: state.phases[state.currentPhase],
      progress: Math.round((state.currentPhase / state.phases.length) * 70),
      elapsed: Date.now() - state.startTime,
      estimated: state.strategy.estimatedTime
    };
  }
}

// Global instance
let globalProgressiveManager = null;

function initializeProgressiveResponse() {
  if (!globalProgressiveManager) {
    globalProgressiveManager = new ProgressiveResponseManager();
    console.log('✅ Progressive response manager initialized');
  }
  return globalProgressiveManager;
}

// Enhanced response generation with progressive feedback
async function generateResponseWithProgressiveFeedback(message, intent, context = {}, env = null, sessionId = null, updateCallback = null) {
  const progressManager = initializeProgressiveResponse();
  
  if (!sessionId || !updateCallback) {
    // Fall back to regular response generation
    return await generateResponseWithCache(message, intent, context, env, sessionId);
  }
  
  try {
    // Start progressive response
    const immediateResponse = progressManager.startProgressiveResponse(
      sessionId, 
      message, 
      intent, 
      updateCallback
    );
    
    // If it's an immediate response (no progress needed)
    if (!immediateResponse.loading) {
      const quickResponse = await generateResponseWithCache(message, intent, context, env, sessionId);
      return quickResponse;
    }
    
    // Background processing
    const processingPromise = (async () => {
      try {
        const finalResponse = await generateResponseWithCache(message, intent, context, env, sessionId);
        progressManager.completeResponse(sessionId, finalResponse);
        return finalResponse;
      } catch (error) {
        console.error('Progressive response processing failed:', error);
        progressManager.failResponse(sessionId, error);
        throw error;
      }
    })();
    
    // Return immediate response while processing continues
    return {
      ...immediateResponse,
      processing: processingPromise // For advanced clients that can await
    };
    
  } catch (error) {
    console.error('Progressive response initialization failed:', error);
    progressManager.failResponse(sessionId, error);
    
    // Fall back to regular response
    return await generateResponseWithCache(message, intent, context, env, sessionId);
  }
}

// WebSocket-like update handler for Server-Sent Events
class SSEProgressiveHandler {
  constructor() {
    this.connections = new Map();
  }
  
  // Add SSE connection
  addConnection(sessionId, response) {
    this.connections.set(sessionId, response);
    
    // Set up SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Send initial connection confirmation
    this.sendSSEMessage(response, {
      type: 'connected',
      sessionId: sessionId,
      timestamp: Date.now()
    });
    
    return response;
  }
  
  // Send SSE message
  sendSSEMessage(response, data) {
    try {
      response.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('SSE send error:', error);
    }
  }
  
  // Progressive update callback for SSE
  createSSECallback(sessionId) {
    return (updateData) => {
      const response = this.connections.get(sessionId);
      if (response) {
        this.sendSSEMessage(response, {
          type: 'progress',
          ...updateData
        });
        
        // Close connection if completed
        if (!updateData.loading) {
          setTimeout(() => {
            this.closeConnection(sessionId);
          }, 1000); // Keep open for 1 second after completion
        }
      }
    };
  }
  
  // Close SSE connection
  closeConnection(sessionId) {
    const response = this.connections.get(sessionId);
    if (response) {
      this.sendSSEMessage(response, {
        type: 'close',
        sessionId: sessionId
      });
      response.end();
      this.connections.delete(sessionId);
    }
  }
  
  // Get active connections count
  getActiveConnectionsCount() {
    return this.connections.size;
  }
}

export {
  ProgressiveResponseManager,
  PROGRESSIVE_STRATEGIES,
  RESPONSE_PHASES,
  initializeProgressiveResponse,
  generateResponseWithProgressiveFeedback,
  SSEProgressiveHandler
};