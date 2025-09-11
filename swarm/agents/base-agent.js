#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// UUID semplice se il modulo non è disponibile
let uuidv4;
try {
    uuidv4 = require('uuid').v4;
} catch (error) {
    uuidv4 = () => 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Funzioni di colore semplici
const chalk = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`
};

/**
 * Base Agent Class - Classe base per tutti gli agenti del sistema
 */
class BaseAgent {
    constructor(name, role, capabilities = []) {
        this.id = uuidv4();
        this.name = name;
        this.role = role;
        this.capabilities = capabilities;
        this.status = 'idle'; // idle, working, completed, error
        this.tasks = [];
        this.results = [];
        this.createdAt = new Date().toISOString();
        this.lastActivity = new Date().toISOString();
        
        // Logging
        this.logFile = path.join(__dirname, '../logs', `${this.name.toLowerCase().replace(/\s+/g, '-')}.log`);
        this.ensureLogDirectory();
        
        this.log(`🤖 Agent ${this.name} initialized with role: ${this.role}`);
    }

    /**
     * Assicura che la directory dei log esista
     */
    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    /**
     * Sistema di logging per l'agente
     */
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}\n`;
        
        // Console output con colori
        const colorMap = {
            info: chalk.blue,
            success: chalk.green,
            warning: chalk.yellow,
            error: chalk.red,
            debug: chalk.gray
        };
        
        console.log(colorMap[level] ? colorMap[level](logEntry.trim()) : logEntry.trim());
        
        // File output
        fs.appendFileSync(this.logFile, logEntry);
        
        this.lastActivity = timestamp;
    }

    /**
     * Aggiunge un task alla coda dell'agente
     */
    addTask(task) {
        const taskWithId = {
            id: uuidv4(),
            ...task,
            status: 'pending',
            assignedAt: new Date().toISOString(),
            agentId: this.id
        };
        
        this.tasks.push(taskWithId);
        this.log(`📋 New task assigned: ${task.name || task.type}`, 'info');
        
        return taskWithId.id;
    }

    /**
     * Esegue un task specifico
     */
    async executeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            this.log(`❌ Task ${taskId} not found`, 'error');
            return null;
        }

        this.status = 'working';
        task.status = 'in_progress';
        task.startedAt = new Date().toISOString();
        
        this.log(`🚀 Starting task: ${task.name || task.type}`, 'info');

        try {
            // Chiama il metodo specifico dell'agente
            const result = await this.processTask(task);
            
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
            task.result = result;
            
            this.results.push({
                taskId: taskId,
                result: result,
                completedAt: task.completedAt
            });
            
            this.log(`✅ Task completed: ${task.name || task.type}`, 'success');
            this.status = 'idle';
            
            return result;
            
        } catch (error) {
            task.status = 'error';
            task.error = error.message;
            task.failedAt = new Date().toISOString();
            
            this.log(`❌ Task failed: ${error.message}`, 'error');
            this.status = 'error';
            
            throw error;
        }
    }

    /**
     * Metodo da implementare negli agenti specifici
     */
    async processTask(task) {
        throw new Error(`processTask method must be implemented by ${this.constructor.name}`);
    }

    /**
     * Esegue tutti i task in coda
     */
    async executeAllTasks() {
        const pendingTasks = this.tasks.filter(t => t.status === 'pending');
        
        if (pendingTasks.length === 0) {
            this.log('📭 No pending tasks to execute', 'info');
            return [];
        }

        this.log(`🔄 Executing ${pendingTasks.length} pending tasks`, 'info');
        
        const results = [];
        for (const task of pendingTasks) {
            try {
                const result = await this.executeTask(task.id);
                results.push(result);
            } catch (error) {
                this.log(`❌ Failed to execute task ${task.id}: ${error.message}`, 'error');
                results.push(null);
            }
        }
        
        return results;
    }

    /**
     * Ottiene lo stato dell'agente
     */
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            role: this.role,
            status: this.status,
            capabilities: this.capabilities,
            tasksCount: this.tasks.length,
            completedTasks: this.tasks.filter(t => t.status === 'completed').length,
            pendingTasks: this.tasks.filter(t => t.status === 'pending').length,
            errorTasks: this.tasks.filter(t => t.status === 'error').length,
            lastActivity: this.lastActivity,
            createdAt: this.createdAt
        };
    }

    /**
     * Resetta l'agente
     */
    reset() {
        this.tasks = [];
        this.results = [];
        this.status = 'idle';
        this.log('🔄 Agent reset completed', 'info');
    }

    /**
     * Salva lo stato dell'agente su file
     */
    saveState() {
        const stateFile = path.join(__dirname, '../state', `${this.name.toLowerCase().replace(/\s+/g, '-')}-state.json`);
        const stateDir = path.dirname(stateFile);
        
        if (!fs.existsSync(stateDir)) {
            fs.mkdirSync(stateDir, { recursive: true });
        }
        
        const state = {
            ...this.getStatus(),
            tasks: this.tasks,
            results: this.results
        };
        
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
        this.log(`💾 State saved to ${stateFile}`, 'debug');
    }

    /**
     * Carica lo stato dell'agente da file
     */
    loadState() {
        const stateFile = path.join(__dirname, '../state', `${this.name.toLowerCase().replace(/\s+/g, '-')}-state.json`);
        
        if (fs.existsSync(stateFile)) {
            try {
                const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                this.tasks = state.tasks || [];
                this.results = state.results || [];
                this.log(`📂 State loaded from ${stateFile}`, 'debug');
            } catch (error) {
                this.log(`❌ Failed to load state: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Verifica se l'agente può gestire un tipo di task
     */
    canHandle(taskType) {
        return this.capabilities.includes(taskType) || this.capabilities.includes('*');
    }

    /**
     * Ottiene metriche di performance
     */
    getMetrics() {
        const completedTasks = this.tasks.filter(t => t.status === 'completed');
        const errorTasks = this.tasks.filter(t => t.status === 'error');
        
        let avgExecutionTime = 0;
        if (completedTasks.length > 0) {
            const totalTime = completedTasks.reduce((sum, task) => {
                if (task.startedAt && task.completedAt) {
                    return sum + (new Date(task.completedAt) - new Date(task.startedAt));
                }
                return sum;
            }, 0);
            avgExecutionTime = totalTime / completedTasks.length;
        }
        
        return {
            totalTasks: this.tasks.length,
            completedTasks: completedTasks.length,
            errorTasks: errorTasks.length,
            successRate: this.tasks.length > 0 ? (completedTasks.length / this.tasks.length) * 100 : 0,
            avgExecutionTime: Math.round(avgExecutionTime),
            uptime: new Date() - new Date(this.createdAt)
        };
    }
}

module.exports = BaseAgent;
