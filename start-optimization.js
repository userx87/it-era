#!/usr/bin/env node

/**
 * IT-ERA OPTIMIZATION LAUNCHER
 * Starts the automated task execution system with intelligent monitoring
 */

const TaskRunner = require('./task-runner-system');
const { spawn } = require('child_process');
const fs = require('fs').promises;

class OptimizationLauncher {
    constructor() {
        this.runner = null;
        this.logFile = `logs/optimization-${Date.now()}.log`;
    }

    async start() {
        console.log('🚀 IT-ERA OPTIMIZATION SYSTEM LAUNCHER');
        console.log('=' .repeat(50));
        console.log('📅 Started:', new Date().toLocaleString());
        console.log('📁 Working Directory:', process.cwd());
        console.log('📝 Log File:', this.logFile);
        console.log('');

        // Initialize logging
        await this.setupLogging();

        // Check prerequisites
        await this.checkPrerequisites();

        // Start task runner
        await this.startTaskRunner();
    }

    async setupLogging() {
        try {
            await fs.mkdir('logs', { recursive: true });
            await fs.writeFile(this.logFile, `IT-ERA Optimization Started: ${new Date().toISOString()}\n`);
            console.log('✅ Logging system initialized');
        } catch (error) {
            console.log('⚠️ Logging setup failed:', error.message);
        }
    }

    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        const checks = [
            { name: 'Git Repository', check: () => this.checkGit() },
            { name: 'Node.js Dependencies', check: () => this.checkNodeDeps() },
            { name: 'GitHub Connection', check: () => this.checkGitHub() },
            { name: 'Branch Structure', check: () => this.checkBranches() }
        ];

        for (const check of checks) {
            try {
                await check.check();
                console.log(`  ✅ ${check.name}`);
            } catch (error) {
                console.log(`  ⚠️ ${check.name}: ${error.message}`);
            }
        }
        console.log('');
    }

    async checkGit() {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        
        await execAsync('git status');
    }

    async checkNodeDeps() {
        try {
            require('puppeteer');
        } catch (error) {
            throw new Error('Puppeteer not found - run: npm install puppeteer');
        }
    }

    async checkGitHub() {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        
        await execAsync('git remote -v');
    }

    async checkBranches() {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        
        const { stdout } = await execAsync('git branch -a');
        const branches = stdout.split('\n').map(b => b.trim());
        
        const requiredBranches = [
            'settore-studi-legali',
            'settore-industria-40', 
            'settore-retail-gdo'
        ];
        
        for (const branch of requiredBranches) {
            if (!branches.some(b => b.includes(branch))) {
                throw new Error(`Branch ${branch} not found`);
            }
        }
    }

    async startTaskRunner() {
        console.log('🚀 STARTING AUTOMATED TASK EXECUTION');
        console.log('⚡ Tasks will run in parallel with intelligent prioritization');
        console.log('📊 Progress updates every 120 seconds');
        console.log('🔄 Press Ctrl+C to stop gracefully');
        console.log('');

        try {
            this.runner = new TaskRunner();
            await this.runner.initialize();
            
            // Log to file
            await this.logMessage('Task Runner initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to start task runner:', error.message);
            await this.logMessage(`ERROR: ${error.message}`);
            process.exit(1);
        }
    }

    async logMessage(message) {
        try {
            const timestamp = new Date().toISOString();
            await fs.appendFile(this.logFile, `[${timestamp}] ${message}\n`);
        } catch (error) {
            // Silent fail for logging
        }
    }

    setupGracefulShutdown() {
        process.on('SIGINT', async () => {
            console.log('\n🛑 Graceful shutdown initiated...');
            await this.logMessage('Graceful shutdown initiated');
            
            if (this.runner) {
                console.log('📊 Final progress report:');
                this.runner.displayProgress();
            }
            
            console.log('✅ Shutdown complete');
            process.exit(0);
        });
    }
}

// Quick start function for immediate execution
async function quickStart() {
    console.log('⚡ QUICK START MODE - IMMEDIATE EXECUTION');
    console.log('🎯 Starting high-priority tasks immediately...');
    console.log('');

    const launcher = new OptimizationLauncher();
    launcher.setupGracefulShutdown();
    await launcher.start();
}

// Main execution
if (require.main === module) {
    quickStart().catch(error => {
        console.error('❌ Launcher failed:', error.message);
        process.exit(1);
    });
}

module.exports = OptimizationLauncher;
