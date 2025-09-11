#!/usr/bin/env node

const SEOAgent = require('./agents/seo-agent');
const DeployAgent = require('./agents/deploy-agent');
const fs = require('fs');
const path = require('path');

// Funzioni di colore semplici
const chalk = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`
};

// Cron semplice se non disponibile
let cron;
try {
    cron = require('node-cron');
} catch (error) {
    cron = {
        schedule: (pattern, callback) => {
            console.log(`Cron scheduled: ${pattern}`);
            // Implementazione semplificata per test
        }
    };
}

/**
 * Swarm Coordinator - Coordina tutti gli agenti del sistema
 */
class SwarmCoordinator {
    constructor() {
        this.agents = new Map();
        this.tasks = [];
        this.workflows = new Map();
        this.isRunning = false;
        this.startTime = null;
        
        // Inizializza agenti
        this.initializeAgents();
        
        // Carica workflows
        this.loadWorkflows();
        
        this.log('🐝 Swarm Coordinator initialized', 'info');
    }

    /**
     * Inizializza tutti gli agenti
     */
    initializeAgents() {
        // Agente SEO
        const seoAgent = new SEOAgent();
        this.agents.set('seo', seoAgent);
        
        // Agente Deploy
        const deployAgent = new DeployAgent();
        this.agents.set('deploy', deployAgent);
        
        this.log(`🤖 Initialized ${this.agents.size} agents`, 'success');
    }

    /**
     * Carica i workflows predefiniti
     */
    loadWorkflows() {
        // Workflow completo di deploy
        this.workflows.set('full_deploy', {
            name: 'Full Deploy Workflow',
            description: 'Crea pagine SEO, ottimizza e fa deploy',
            steps: [
                { agent: 'seo', task: 'create_seo_pages', priority: 1 },
                { agent: 'deploy', task: 'build_optimization', priority: 2 },
                { agent: 'deploy', task: 'git_operations', priority: 3 },
                { agent: 'deploy', task: 'github_pages_deploy', priority: 4 }
            ]
        });

        // Workflow solo SEO
        this.workflows.set('seo_only', {
            name: 'SEO Content Creation',
            description: 'Crea solo contenuti SEO ottimizzati',
            steps: [
                { agent: 'seo', task: 'create_seo_pages', priority: 1 },
                { agent: 'seo', task: 'optimize_content', priority: 2 }
            ]
        });

        // Workflow solo deploy
        this.workflows.set('deploy_only', {
            name: 'Deploy Only',
            description: 'Ottimizza e fa deploy del contenuto esistente',
            steps: [
                { agent: 'deploy', task: 'build_optimization', priority: 1 },
                { agent: 'deploy', task: 'github_pages_deploy', priority: 2 }
            ]
        });

        this.log(`📋 Loaded ${this.workflows.size} workflows`, 'info');
    }

    /**
     * Sistema di logging
     */
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const colorMap = {
            info: chalk.blue,
            success: chalk.green,
            warning: chalk.yellow,
            error: chalk.red,
            debug: chalk.gray
        };
        
        const coloredMessage = colorMap[level] ? colorMap[level](message) : message;
        console.log(`[${timestamp}] [SWARM] ${coloredMessage}`);
    }

    /**
     * Esegue un workflow completo
     */
    async executeWorkflow(workflowName, data = {}) {
        const workflow = this.workflows.get(workflowName);
        if (!workflow) {
            throw new Error(`Workflow '${workflowName}' not found`);
        }

        this.log(`🚀 Starting workflow: ${workflow.name}`, 'info');
        this.isRunning = true;
        this.startTime = new Date();

        const results = [];
        
        try {
            // Ordina i step per priorità
            const sortedSteps = workflow.steps.sort((a, b) => a.priority - b.priority);
            
            for (const step of sortedSteps) {
                this.log(`📋 Executing step: ${step.task} on ${step.agent}`, 'info');
                
                const agent = this.agents.get(step.agent);
                if (!agent) {
                    throw new Error(`Agent '${step.agent}' not found`);
                }

                // Prepara i dati per il task
                const taskData = this.prepareTaskData(step, data);
                
                // Assegna e esegue il task
                const taskId = agent.addTask({
                    type: step.task,
                    data: taskData,
                    workflow: workflowName,
                    step: step.priority
                });

                const result = await agent.executeTask(taskId);
                
                results.push({
                    step: step.priority,
                    agent: step.agent,
                    task: step.task,
                    result: result,
                    timestamp: new Date().toISOString()
                });

                this.log(`✅ Step completed: ${step.task}`, 'success');
            }

            this.log(`🎉 Workflow '${workflow.name}' completed successfully`, 'success');
            
        } catch (error) {
            this.log(`❌ Workflow failed: ${error.message}`, 'error');
            throw error;
        } finally {
            this.isRunning = false;
        }

        return {
            workflow: workflowName,
            success: true,
            steps: results,
            duration: new Date() - this.startTime,
            completedAt: new Date().toISOString()
        };
    }

    /**
     * Prepara i dati per un task specifico
     */
    prepareTaskData(step, baseData) {
        const taskData = { ...baseData };
        
        // Dati specifici per task SEO
        if (step.task === 'create_seo_pages') {
            taskData.pages = taskData.pages || this.getDefaultSEOPages();
        }
        
        // Dati specifici per task di deploy
        if (step.task === 'git_operations') {
            taskData.operations = taskData.operations || [
                { type: 'add', params: { files: '.' } },
                { type: 'commit', params: { message: '🚀 Swarm automated deployment' } },
                { type: 'push', params: { branch: 'main' } }
            ];
        }

        return taskData;
    }

    /**
     * Ottiene le pagine SEO di default da creare
     */
    getDefaultSEOPages() {
        return [
            {
                type: 'service_page',
                url: '/servizi/backup-disaster-recovery.html',
                data: {
                    service: 'Backup e Disaster Recovery',
                    location: 'Milano',
                    benefits: 'Protezione dati garantita, ripristino rapido, continuità operativa'
                }
            },
            {
                type: 'service_page',
                url: '/servizi/microsoft-365-aziende.html',
                data: {
                    service: 'Microsoft 365 per Aziende',
                    location: 'Milano',
                    benefits: 'Produttività aumentata, collaborazione cloud, sicurezza enterprise'
                }
            },
            {
                type: 'sector_page',
                url: '/settori/industria-manifatturiera.html',
                data: {
                    sector: 'Industria Manifatturiera',
                    location: 'Lombardia',
                    specific_benefits: 'ERP integrati, automazione industriale, Industry 4.0'
                }
            },
            {
                type: 'location_page',
                url: '/zone/assistenza-it-bergamo.html',
                data: {
                    location: 'Bergamo',
                    coverage: 'Provincia di Bergamo e hinterland'
                }
            }
        ];
    }

    /**
     * Esegue il workflow completo di implementazione SEO
     */
    async implementSEOStrategy() {
        this.log('🎯 Starting complete SEO implementation', 'info');
        
        const seoData = {
            pages: [
                // Servizi specifici
                {
                    type: 'service_page',
                    url: '/servizi/backup-disaster-recovery.html',
                    data: {
                        service: 'Backup e Disaster Recovery',
                        location: 'Milano',
                        benefits: 'Protezione dati garantita, ripristino rapido in caso di emergenza'
                    }
                },
                {
                    type: 'service_page',
                    url: '/servizi/microsoft-365-aziende.html',
                    data: {
                        service: 'Microsoft 365 per Aziende',
                        location: 'Milano',
                        benefits: 'Produttività cloud, collaborazione avanzata, sicurezza enterprise'
                    }
                },
                {
                    type: 'service_page',
                    url: '/servizi/virtualizzazione-server.html',
                    data: {
                        service: 'Virtualizzazione Server',
                        location: 'Milano',
                        benefits: 'Riduzione costi hardware, scalabilità, alta disponibilità'
                    }
                },
                // Settori aggiuntivi
                {
                    type: 'sector_page',
                    url: '/settori/industria-manifatturiera.html',
                    data: {
                        sector: 'Industria Manifatturiera',
                        location: 'Lombardia',
                        specific_benefits: 'ERP integrati, automazione, Industry 4.0'
                    }
                },
                {
                    type: 'sector_page',
                    url: '/settori/settore-sanitario.html',
                    data: {
                        sector: 'Settore Sanitario',
                        location: 'Milano',
                        specific_benefits: 'Cartelle cliniche digitali, GDPR compliance'
                    }
                },
                // Pagine geografiche
                {
                    type: 'location_page',
                    url: '/zone/assistenza-it-bergamo.html',
                    data: {
                        location: 'Bergamo',
                        coverage: 'Provincia di Bergamo e Valle Seriana'
                    }
                },
                {
                    type: 'location_page',
                    url: '/zone/assistenza-it-brescia.html',
                    data: {
                        location: 'Brescia',
                        coverage: 'Provincia di Brescia e Franciacorta'
                    }
                }
            ]
        };

        return await this.executeWorkflow('full_deploy', seoData);
    }

    /**
     * Programma esecuzioni automatiche
     */
    scheduleAutomatedTasks() {
        // Deploy automatico ogni giorno alle 2:00
        cron.schedule('0 2 * * *', async () => {
            this.log('⏰ Starting scheduled deployment', 'info');
            try {
                await this.executeWorkflow('deploy_only');
                this.log('✅ Scheduled deployment completed', 'success');
            } catch (error) {
                this.log(`❌ Scheduled deployment failed: ${error.message}`, 'error');
            }
        });

        // Backup settimanale ogni domenica alle 3:00
        cron.schedule('0 3 * * 0', async () => {
            this.log('⏰ Starting weekly backup', 'info');
            try {
                const deployAgent = this.agents.get('deploy');
                await deployAgent.addTask({ type: 'backup_creation', data: {} });
                await deployAgent.executeAllTasks();
                this.log('✅ Weekly backup completed', 'success');
            } catch (error) {
                this.log(`❌ Weekly backup failed: ${error.message}`, 'error');
            }
        });

        this.log('📅 Automated tasks scheduled', 'info');
    }

    /**
     * Ottiene lo stato di tutti gli agenti
     */
    getSwarmStatus() {
        const agentStatuses = {};
        
        this.agents.forEach((agent, name) => {
            agentStatuses[name] = agent.getStatus();
        });

        return {
            coordinator: {
                isRunning: this.isRunning,
                startTime: this.startTime,
                agentsCount: this.agents.size,
                workflowsCount: this.workflows.size
            },
            agents: agentStatuses,
            workflows: Array.from(this.workflows.keys())
        };
    }

    /**
     * Salva lo stato del swarm
     */
    saveSwarmState() {
        const state = this.getSwarmStatus();
        const stateFile = path.join(__dirname, 'state', 'swarm-state.json');
        
        if (!fs.existsSync(path.dirname(stateFile))) {
            fs.mkdirSync(path.dirname(stateFile), { recursive: true });
        }
        
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
        this.log('💾 Swarm state saved', 'debug');
    }

    /**
     * Arresta il swarm
     */
    async shutdown() {
        this.log('🛑 Shutting down swarm...', 'warning');
        
        // Salva lo stato
        this.saveSwarmState();
        
        // Salva lo stato di tutti gli agenti
        this.agents.forEach(agent => {
            agent.saveState();
        });
        
        this.log('✅ Swarm shutdown completed', 'success');
    }
}

module.exports = SwarmCoordinator;
