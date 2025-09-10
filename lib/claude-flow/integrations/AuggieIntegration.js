/**
 * Auggie Integration for Claude Flow
 * Seamless integration with existing IT-ERA Auggie system
 */

const EventEmitter = require('events');
const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class AuggieIntegration extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            auggieEnabled: process.env.AUGGIE_ENABLED !== 'false',
            auggieCommand: config.auggieCommand || 'auggie',
            rulesPath: config.rulesPath || path.join(process.cwd(), '.augment', 'rules', 'it-era-rules.md'),
            tempPath: config.tempPath || path.join(process.cwd(), '.claude-flow', 'temp'),
            debug: config.debug || false,
            ...config
        };
        
        this.claudeFlowEngine = config.claudeFlowEngine;
        this.auggieAvailable = false;
        this.initialized = false;
        
        // Integration state
        this.hybridMode = true;
        this.fallbackChain = ['claude-flow', 'auggie', 'static'];
        this.currentProvider = 'claude-flow';
        
        // Performance tracking
        this.stats = {
            claudeFlowCalls: 0,
            auggieCalls: 0,
            hybridCalls: 0,
            fallbacks: 0,
            errors: 0
        };
    }
    
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Ensure temp directory exists
            await fs.ensureDir(this.config.tempPath);
            
            // Check Auggie availability
            this.auggieAvailable = await this.checkAuggieInstallation();
            
            // Setup hybrid integration with existing systems
            await this.setupHybridIntegration();
            
            this.initialized = true;
            this.log('Auggie integration initialized', {
                auggieAvailable: this.auggieAvailable,
                hybridMode: this.hybridMode
            });
            
            this.emit('initialized');
        } catch (error) {
            this.logError('Failed to initialize Auggie integration', error);
            throw error;
        }
    }
    
    async checkAuggieInstallation() {
        try {
            const version = execSync(`${this.config.auggieCommand} --version`, { 
                encoding: 'utf8',
                timeout: 5000 
            }).trim();
            
            this.log(`Auggie detected: ${version}`);
            return true;
        } catch (error) {
            this.log('Auggie not available, using Claude Flow only');
            return false;
        }
    }
    
    async setupHybridIntegration() {
        // Enhance existing IT-ERA AI systems with Claude Flow
        if (typeof window !== 'undefined') {
            await this.enhanceClientSideIntegration();
        }
        
        // Setup server-side integration
        await this.enhanceServerSideIntegration();
    }
    
    async enhanceClientSideIntegration() {
        // This would run in browser context
        // Enhance existing ITERA_AI and ITERASmartChatbot
        
        const integrationScript = `
        // Claude Flow Integration Enhancement
        if (window.ITERA_AI) {
            const originalCallOpenAI = window.ITERA_AI.callOpenAI;
            
            window.ITERA_AI.callClaudeFlow = async function(messages, options = {}) {
                try {
                    const response = await fetch('/api/claude-flow/ai-task', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages,
                            options,
                            provider: 'claude-flow'
                        })
                    });
                    
                    return await response.json();
                } catch (error) {
                    console.error('Claude Flow AI call failed:', error);
                    throw error;
                }
            };
            
            window.ITERA_AI.hybridAICall = async function(messages, options = {}) {
                const providers = ['claude-flow', 'openai'];
                
                for (const provider of providers) {
                    try {
                        if (provider === 'claude-flow') {
                            return await this.callClaudeFlow(messages, options);
                        } else if (provider === 'openai') {
                            return await originalCallOpenAI.call(this, messages, options);
                        }
                    } catch (error) {
                        console.warn(\`\${provider} failed, trying next provider\`, error);
                        continue;
                    }
                }
                
                throw new Error('All AI providers failed');
            };
            
            // Override default AI call to use hybrid approach
            window.ITERA_AI.callOpenAI = window.ITERA_AI.hybridAICall;
        }
        
        // Enhance chatbot with Claude Flow workflows
        if (window.ITERASmartChatbot) {
            const originalGenerateAIResponse = window.ITERASmartChatbot.prototype.generateAIResponse;
            
            window.ITERASmartChatbot.prototype.generateAIResponse = async function(message, analysis) {
                // Check if this should trigger a workflow
                const workflowTrigger = this.detectWorkflowTrigger(message, analysis);
                
                if (workflowTrigger) {
                    return await this.executeClaudeFlowWorkflow(workflowTrigger, message, analysis);
                }
                
                // Use hybrid AI call
                return await originalGenerateAIResponse.call(this, message, analysis);
            };
            
            window.ITERASmartChatbot.prototype.detectWorkflowTrigger = function(message, analysis) {
                const triggers = {
                    'analyze code': 'code_analysis',
                    'run tests': 'run_tests',
                    'optimize performance': 'performance_optimization',
                    'deploy': 'deploy'
                };
                
                const lowerMessage = message.toLowerCase();
                for (const [trigger, workflow] of Object.entries(triggers)) {
                    if (lowerMessage.includes(trigger)) {
                        return workflow;
                    }
                }
                
                return null;
            };
            
            window.ITERASmartChatbot.prototype.executeClaudeFlowWorkflow = async function(workflowName, message, analysis) {
                try {
                    const response = await fetch('/api/claude-flow/execute-workflow', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            workflowName,
                            options: {
                                trigger: 'chatbot',
                                message,
                                analysis
                            }
                        })
                    });
                    
                    const result = await response.json();
                    
                    return \`🤖 Ho eseguito il workflow "\${workflowName}" per te!\\n\\n\${result.summary}\\n\\nVuoi vedere i dettagli completi?\`;
                } catch (error) {
                    console.error('Workflow execution failed:', error);
                    return 'Mi dispiace, si è verificato un errore durante l\\'esecuzione del workflow. Riprova più tardi.';
                }
            };
        }
        `;
        
        // Store integration script for client-side injection
        await fs.writeFile(
            path.join(this.config.tempPath, 'client-integration.js'),
            integrationScript,
            'utf8'
        );
    }
    
    async enhanceServerSideIntegration() {
        // Server-side enhancements would be handled by API endpoints
        this.log('Server-side integration setup complete');
    }
    
    async executeHybridTask(task, options = {}) {
        this.stats.hybridCalls++;
        
        try {
            // Determine best provider for this task
            const provider = this.selectProvider(task, options);
            
            switch (provider) {
                case 'claude-flow':
                    return await this.executeClaudeFlowTask(task, options);
                
                case 'auggie':
                    return await this.executeAuggieTask(task, options);
                
                default:
                    return await this.executeStaticResponse(task, options);
            }
        } catch (error) {
            this.stats.errors++;
            this.logError('Hybrid task execution failed', error);
            
            // Try fallback providers
            return await this.executeFallbackTask(task, options, error);
        }
    }
    
    selectProvider(task, options) {
        // Smart provider selection based on task type and context
        if (task.type === 'workflow' || task.type === 'automation') {
            return 'claude-flow';
        }
        
        if (task.type === 'code_generation' && this.auggieAvailable) {
            return 'auggie';
        }
        
        if (task.urgency === 'high' || options.requiresRealTime) {
            return 'claude-flow';
        }
        
        return this.currentProvider;
    }
    
    async executeClaudeFlowTask(task, options) {
        this.stats.claudeFlowCalls++;
        
        if (!this.claudeFlowEngine) {
            throw new Error('Claude Flow engine not available');
        }
        
        switch (task.type) {
            case 'workflow':
                return await this.claudeFlowEngine.executeWorkflow(task.workflow, options);
            
            case 'memory':
                return await this.executeMemoryTask(task, options);
            
            case 'analysis':
                return await this.executeAnalysisTask(task, options);
            
            default:
                throw new Error(`Unsupported Claude Flow task type: ${task.type}`);
        }
    }
    
    async executeAuggieTask(task, options) {
        this.stats.auggieCalls++;
        
        if (!this.auggieAvailable) {
            throw new Error('Auggie not available');
        }
        
        // Create instruction file
        const instructionFile = path.join(this.config.tempPath, `instruction-${Date.now()}.txt`);
        await fs.writeFile(instructionFile, task.instruction, 'utf8');
        
        try {
            const args = [
                '--print',
                '--rules', this.config.rulesPath,
                '--instruction-file', instructionFile
            ];
            
            if (options.quiet) args.push('--quiet');
            if (options.continue) args.push('--continue');
            
            const result = execSync(`${this.config.auggieCommand} ${args.join(' ')}`, {
                encoding: 'utf8',
                cwd: process.cwd(),
                timeout: options.timeout || 60000
            });
            
            return {
                provider: 'auggie',
                result: result.trim(),
                success: true
            };
        } finally {
            // Clean up instruction file
            await fs.remove(instructionFile);
        }
    }
    
    async executeMemoryTask(task, options) {
        const { operation, key, data, namespace } = task;
        const memorySystem = this.claudeFlowEngine.memorySystem;
        
        switch (operation) {
            case 'store':
                return await memorySystem.store(key, data, namespace);
            case 'retrieve':
                return await memorySystem.retrieve(key, namespace);
            case 'search':
                return await memorySystem.search(key, options);
            default:
                throw new Error(`Unknown memory operation: ${operation}`);
        }
    }
    
    async executeAnalysisTask(task, options) {
        // Create analysis workflow
        const workflow = await this.claudeFlowEngine.executeWorkflow('code_analysis', {
            target: task.target,
            analysisType: task.analysisType,
            ...options
        });
        
        return {
            provider: 'claude-flow',
            workflowId: workflow.id,
            analysis: workflow.result
        };
    }
    
    async executeStaticResponse(task, options) {
        // Fallback static responses for common tasks
        const staticResponses = {
            greeting: 'Ciao! Sono l\'assistente AI di IT-ERA. Come posso aiutarti?',
            emergency: '🚨 Per emergenze IT chiama subito: 039 888 2041',
            services: 'I nostri servizi includono: assistenza IT, cybersecurity, cloud storage, backup e disaster recovery.',
            contact: 'Contattaci: 039 888 2041 | info@it-era.it | Viale Risorgimento 32, Vimercate MB'
        };
        
        return {
            provider: 'static',
            response: staticResponses[task.type] || 'Mi dispiace, non posso elaborare questa richiesta al momento.',
            success: true
        };
    }
    
    async executeFallbackTask(task, options, originalError) {
        this.stats.fallbacks++;
        
        for (const provider of this.fallbackChain) {
            if (provider === this.currentProvider) continue; // Skip the failed provider
            
            try {
                this.log(`Trying fallback provider: ${provider}`);
                
                const fallbackTask = { ...task, provider };
                return await this.executeHybridTask(fallbackTask, options);
            } catch (error) {
                this.log(`Fallback provider ${provider} also failed`, error.message);
                continue;
            }
        }
        
        // All providers failed
        throw new Error(`All providers failed. Original error: ${originalError.message}`);
    }
    
    getIntegrationStatus() {
        return {
            initialized: this.initialized,
            auggieAvailable: this.auggieAvailable,
            hybridMode: this.hybridMode,
            currentProvider: this.currentProvider,
            fallbackChain: this.fallbackChain,
            stats: this.stats
        };
    }
    
    async createAuggieWorkflow(name, instruction) {
        if (!this.auggieAvailable) {
            throw new Error('Auggie not available for workflow creation');
        }
        
        const workflowDefinition = {
            name,
            description: `Auggie-powered workflow: ${name}`,
            steps: [
                {
                    name: 'Execute Auggie Command',
                    type: 'custom',
                    params: {
                        handler: async (workflow, step) => {
                            return await this.executeAuggieTask({
                                type: 'instruction',
                                instruction
                            }, {});
                        }
                    }
                }
            ]
        };
        
        // Register with Claude Flow workflow engine
        if (this.claudeFlowEngine && this.claudeFlowEngine.workflowEngine) {
            this.claudeFlowEngine.workflowEngine.registerWorkflow(name, workflowDefinition);
        }
        
        return workflowDefinition;
    }
    
    async shutdown() {
        this.log('Auggie integration shutdown');
        this.emit('shutdown');
    }
    
    log(message, data = {}) {
        if (this.config.debug) {
            console.log(`[AuggieIntegration] ${message}`, data);
        }
    }
    
    logError(message, error) {
        console.error(`[AuggieIntegration] ERROR: ${message}`, error);
    }
}

module.exports = AuggieIntegration;
