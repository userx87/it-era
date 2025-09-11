/**
 * IT-ERA Auggie Integration Bridge
 * Connects Auggie AI with existing IT-ERA AI systems
 */

class ITERAuggieIntegration {
    constructor() {
        this.isInitialized = false;
        this.auggieAvailable = false;
        this.fallbackToOpenAI = true;
        
        // Check if Auggie is available
        this.checkAuggieAvailability();
        
        // Initialize integration
        this.init();
    }
    
    async checkAuggieAvailability() {
        try {
            // Check if Auggie CLI is available (for development)
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                this.auggieAvailable = await this.testAuggieCLI();
            }
            
            console.log('🔍 Auggie availability:', this.auggieAvailable);
        } catch (error) {
            console.warn('⚠️ Auggie not available, using fallback:', error.message);
            this.auggieAvailable = false;
        }
    }
    
    async testAuggieCLI() {
        // This would be used in development environment
        // In production, we'd use Auggie API if available
        return false; // For now, always fallback to OpenAI
    }
    
    init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing IT-ERA Auggie Integration...');
        
        // Enhance existing AI config
        this.enhanceAIConfig();
        
        // Enhance existing chatbot
        this.enhanceChatbot();
        
        // Setup hybrid AI routing
        this.setupHybridRouting();
        
        this.isInitialized = true;
        console.log('✅ IT-ERA Auggie Integration initialized');
    }
    
    enhanceAIConfig() {
        if (window.ITERA_AI) {
            // Add Auggie methods to existing AI config
            window.ITERA_AI.useAuggie = this.auggieAvailable;
            window.ITERA_AI.auggieIntegration = this;
            
            // Override callOpenAI to route through hybrid system
            const originalCallOpenAI = window.ITERA_AI.callOpenAI.bind(window.ITERA_AI);
            
            window.ITERA_AI.callOpenAI = async (messages, options = {}) => {
                return await this.hybridAICall(messages, options, originalCallOpenAI);
            };
            
            console.log('🔧 Enhanced ITERA_AI with Auggie integration');
        }
    }
    
    enhanceChatbot() {
        if (window.ITERASmartChatbot) {
            // Add Auggie capabilities to existing chatbot
            const originalGenerateAIResponse = window.ITERASmartChatbot.prototype.generateAIResponse;
            
            window.ITERASmartChatbot.prototype.generateAIResponse = async function(message, analysis) {
                const integration = window.ITERA_AI?.auggieIntegration;
                if (integration && integration.auggieAvailable) {
                    return await integration.generateAuggieResponse(message, analysis, this.conversationHistory);
                }
                
                // Fallback to original method
                return await originalGenerateAIResponse.call(this, message, analysis);
            };
            
            console.log('🤖 Enhanced ITERASmartChatbot with Auggie integration');
        }
    }
    
    setupHybridRouting() {
        this.routingRules = {
            // Use Auggie for code-related queries
            code: {
                keywords: ['codice', 'script', 'programmazione', 'sviluppo', 'bug', 'errore tecnico'],
                useAuggie: true
            },
            
            // Use Auggie for technical analysis
            technical: {
                keywords: ['analisi', 'diagnostica', 'sistema', 'configurazione', 'ottimizzazione'],
                useAuggie: true
            },
            
            // Use OpenAI for customer service
            customer: {
                keywords: ['preventivo', 'prezzo', 'contatto', 'informazioni', 'servizi'],
                useAuggie: false
            },
            
            // Use OpenAI for emergency
            emergency: {
                keywords: ['emergenza', 'urgente', 'subito', 'problema grave'],
                useAuggie: false
            }
        };
    }
    
    async hybridAICall(messages, options = {}, fallbackFunction) {
        try {
            // Determine which AI to use based on context
            const shouldUseAuggie = this.shouldUseAuggie(messages);
            
            if (shouldUseAuggie && this.auggieAvailable) {
                console.log('🧠 Routing to Auggie AI...');
                return await this.callAuggieAPI(messages, options);
            } else {
                console.log('🤖 Routing to OpenAI...');
                return await fallbackFunction(messages, options);
            }
        } catch (error) {
            console.error('❌ Hybrid AI call failed:', error);
            
            // Always fallback to OpenAI on error
            if (fallbackFunction) {
                return await fallbackFunction(messages, options);
            }
            
            throw error;
        }
    }
    
    shouldUseAuggie(messages) {
        if (!this.auggieAvailable) return false;
        
        // Analyze last message to determine routing
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || !lastMessage.content) return false;
        
        const content = lastMessage.content.toLowerCase();
        
        // Check routing rules
        for (const [category, rule] of Object.entries(this.routingRules)) {
            const hasKeyword = rule.keywords.some(keyword => content.includes(keyword));
            if (hasKeyword) {
                console.log(`📋 Routing decision: ${category} -> ${rule.useAuggie ? 'Auggie' : 'OpenAI'}`);
                return rule.useAuggie;
            }
        }
        
        // Default to OpenAI for customer-facing interactions
        return false;
    }
    
    async callAuggieAPI(messages, options = {}) {
        // This would call Auggie API in production
        // For now, we simulate Auggie response with enhanced context
        
        const prompt = this.buildAuggiePrompt(messages);
        
        // Simulate Auggie API call
        // In real implementation, this would call Auggie's API endpoint
        const response = await this.simulateAuggieResponse(prompt, options);
        
        return response;
    }
    
    buildAuggiePrompt(messages) {
        const context = `
Sei l'assistente AI di IT-ERA, azienda di cybersecurity e assistenza IT in Lombardia.

CONTESTO AZIENDALE:
- Telefono emergenze: 039 888 2041
- Risposta garantita: 15 minuti
- Copertura: Lombardia
- Servizi: Cybersecurity, Cloud, VoIP, Assistenza IT 24/7

ISTRUZIONI:
- Risposte professionali in italiano
- Per emergenze, mostra sempre il numero di telefono
- Includi CTA specifici per settore (medico/legale)
- Mantieni tono tecnico ma accessibile
`;

        const conversation = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        
        return `${context}\n\nCONVERSAZIONE:\n${conversation}`;
    }
    
    async simulateAuggieResponse(prompt, options = {}) {
        // This simulates what Auggie would return
        // In production, replace with actual Auggie API call
        
        return `🧠 **Risposta Auggie-Enhanced**

Basandomi sull'analisi del codice e del contesto IT-ERA, ecco la mia risposta ottimizzata:

${this.generateContextualResponse(prompt)}

---
*Powered by Auggie AI + IT-ERA Intelligence*`;
    }
    
    generateContextualResponse(prompt) {
        // Generate a contextual response based on IT-ERA knowledge
        if (prompt.includes('emergenza') || prompt.includes('urgente')) {
            return `🚨 **EMERGENZA RILEVATA**

Contatta IMMEDIATAMENTE il nostro team:
📞 **039 888 2041**
⚡ Risposta garantita in 15 minuti

Il nostro team di cybersecurity è sempre pronto per le emergenze IT!`;
        }
        
        if (prompt.includes('codice') || prompt.includes('script')) {
            return `💻 **Analisi Tecnica**

Ho analizzato il contesto del tuo progetto IT-ERA. Per assistenza tecnica specializzata:

📞 **039 888 2041** - Team tecnico disponibile 24/7
🔧 Supporto per sviluppo e debugging
🛡️ Analisi di sicurezza del codice`;
        }
        
        return `💡 **Assistenza IT-ERA**

Per questa richiesta, il nostro team può aiutarti:

📞 **039 888 2041** - Chiamata diretta
📧 info@it-era.it
⚡ Risposta garantita in 15 minuti

Siamo specializzati in soluzioni IT per la Lombardia!`;
    }
    
    async generateAuggieResponse(message, analysis, conversationHistory) {
        const messages = [
            ...conversationHistory.slice(-3), // Last 3 messages for context
            {
                role: 'user',
                content: `${message}
                
ANALISI CONTESTO:
- Urgenza: ${analysis.isUrgent ? 'ALTA' : 'normale'}
- Settore: ${analysis.sector}
- Servizio: ${analysis.recommendedService}
- Intent: ${analysis.intent}`
            }
        ];
        
        return await this.callAuggieAPI(messages, {
            max_tokens: 200,
            temperature: 0.8
        });
    }
    
    // Utility methods
    getStatus() {
        return {
            initialized: this.isInitialized,
            auggieAvailable: this.auggieAvailable,
            fallbackEnabled: this.fallbackToOpenAI,
            routingRules: Object.keys(this.routingRules)
        };
    }
    
    enableAuggie() {
        this.auggieAvailable = true;
        console.log('✅ Auggie enabled');
    }
    
    disableAuggie() {
        this.auggieAvailable = false;
        console.log('⚠️ Auggie disabled, using OpenAI fallback');
    }
}

// Initialize Auggie Integration
window.ITERAuggieIntegration = new ITERAuggieIntegration();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAuggieIntegration;
}

console.log('🔗 IT-ERA Auggie Integration loaded');
