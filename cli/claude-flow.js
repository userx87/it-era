#!/usr/bin/env node

/**
 * Claude Flow CLI Tool
 * Command-line interface for Claude Flow operations
 */

const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');

// Simple color functions as fallback
const chalk = {
    blue: { bold: (text) => `\x1b[1m\x1b[34m${text}\x1b[0m` },
    green: { bold: (text) => `\x1b[1m\x1b[32m${text}\x1b[0m` },
    red: { bold: (text) => `\x1b[1m\x1b[31m${text}\x1b[0m` },
    yellow: { bold: (text) => `\x1b[1m\x1b[33m${text}\x1b[0m` },
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`
};

// Simple spinner as fallback
const ora = (text) => ({
    start: () => ({
        succeed: (msg) => console.log(`✅ ${msg || text}`),
        fail: (msg) => console.log(`❌ ${msg || text}`),
        stop: () => {}
    })
});

// Simple table as fallback
const Table = function(options) {
    this.head = options.head || [];
    this.rows = [];
    this.push = (row) => this.rows.push(row);
    this.toString = () => {
        let result = this.head.join(' | ') + '\n';
        result += this.head.map(() => '---').join(' | ') + '\n';
        result += this.rows.map(row => row.join(' | ')).join('\n');
        return result;
    };
};

// Simple inquirer as fallback
const inquirer = {
    prompt: (questions) => {
        return new Promise((resolve) => {
            const answers = {};
            questions.forEach(q => {
                if (q.type === 'input') {
                    answers[q.name] = q.default || '';
                }
            });
            resolve(answers);
        });
    }
};

// Import Claude Flow components
const ClaudeFlowEngine = require('../lib/claude-flow/ClaudeFlowEngine');

const program = new Command();

// Global engine instance
let engine = null;

// Initialize engine
async function initEngine() {
    if (!engine) {
        const spinner = ora('Initializing Claude Flow Engine...').start();
        try {
            engine = new ClaudeFlowEngine({
                debug: program.opts().debug || false
            });
            await engine.initialize();
            spinner.succeed('Claude Flow Engine initialized');
        } catch (error) {
            spinner.fail(`Failed to initialize engine: ${error.message}`);
            process.exit(1);
        }
    }
    return engine;
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('it-IT');
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function getStatusColor(status) {
    const colors = {
        'active': 'green',
        'running': 'blue',
        'completed': 'green',
        'failed': 'red',
        'ended': 'gray'
    };
    return colors[status] || 'white';
}

// Session Commands
program
    .command('session')
    .description('Session management commands')
    .addCommand(
        new Command('create')
            .description('Create a new session')
            .option('-n, --name <name>', 'Session name')
            .option('-d, --description <description>', 'Session description')
            .action(async (options) => {
                const engine = await initEngine();
                
                let name = options.name;
                let description = options.description;
                
                if (!name) {
                    const answers = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'name',
                            message: 'Session name:',
                            default: `Session ${Date.now()}`
                        },
                        {
                            type: 'input',
                            name: 'description',
                            message: 'Description (optional):'
                        }
                    ]);
                    name = answers.name;
                    description = answers.description;
                }
                
                const spinner = ora('Creating session...').start();
                try {
                    const session = await engine.createSession({ name, description });
                    spinner.succeed(`Session created: ${session.id}`);
                    
                    console.log(chalk.green('\n✅ Session Details:'));
                    console.log(`ID: ${session.id}`);
                    console.log(`Name: ${session.name}`);
                    console.log(`Description: ${session.description || 'N/A'}`);
                    console.log(`Started: ${formatDate(session.startTime)}`);
                } catch (error) {
                    spinner.fail(`Failed to create session: ${error.message}`);
                }
            })
    )
    .addCommand(
        new Command('list')
            .description('List all sessions')
            .option('-a, --active', 'Show only active sessions')
            .action(async (options) => {
                const engine = await initEngine();
                
                const spinner = ora('Loading sessions...').start();
                try {
                    const sessions = engine.sessionManager.getSessions();
                    spinner.stop();
                    
                    let filteredSessions = sessions;
                    if (options.active) {
                        filteredSessions = sessions.filter(s => s.status === 'active');
                    }
                    
                    if (filteredSessions.length === 0) {
                        console.log(chalk.yellow('No sessions found'));
                        return;
                    }
                    
                    const table = new Table({
                        head: ['ID', 'Name', 'Status', 'Started', 'Workflows', 'Duration'],
                        colWidths: [38, 25, 12, 20, 10, 15]
                    });
                    
                    filteredSessions.forEach(session => {
                        const duration = session.endTime ? 
                            formatDuration(new Date(session.endTime) - new Date(session.startTime)) :
                            formatDuration(Date.now() - new Date(session.startTime));
                            
                        table.push([
                            session.id.substring(0, 8) + '...',
                            session.name,
                            chalk[getStatusColor(session.status)](session.status),
                            formatDate(session.startTime).split(' ')[0],
                            session.workflows.length,
                            duration
                        ]);
                    });
                    
                    console.log(table.toString());
                } catch (error) {
                    spinner.fail(`Failed to load sessions: ${error.message}`);
                }
            })
    )
    .addCommand(
        new Command('end')
            .description('End a session')
            .argument('<sessionId>', 'Session ID')
            .action(async (sessionId) => {
                const engine = await initEngine();
                
                const spinner = ora('Ending session...').start();
                try {
                    const session = await engine.endSession(sessionId);
                    spinner.succeed(`Session ended: ${session.id}`);
                } catch (error) {
                    spinner.fail(`Failed to end session: ${error.message}`);
                }
            })
    );

// Workflow Commands
program
    .command('workflow')
    .description('Workflow management commands')
    .addCommand(
        new Command('list')
            .description('List available workflows')
            .action(async () => {
                const engine = await initEngine();
                
                const workflows = engine.workflowEngine.getWorkflowDefinitions();
                
                if (workflows.length === 0) {
                    console.log(chalk.yellow('No workflows available'));
                    return;
                }
                
                console.log(chalk.blue('\n📋 Available Workflows:'));
                workflows.forEach((workflow, index) => {
                    console.log(`${index + 1}. ${chalk.green(workflow)}`);
                });
            })
    )
    .addCommand(
        new Command('execute')
            .description('Execute a workflow')
            .argument('<workflowName>', 'Workflow name')
            .option('-s, --session <sessionId>', 'Session ID')
            .action(async (workflowName, options) => {
                const engine = await initEngine();
                
                let sessionId = options.session;
                
                // Create session if not provided
                if (!sessionId) {
                    const session = await engine.createSession({
                        name: `Workflow: ${workflowName}`,
                        description: `Auto-created for workflow execution`
                    });
                    sessionId = session.id;
                    console.log(chalk.blue(`Created session: ${sessionId}`));
                }
                
                const spinner = ora(`Executing workflow: ${workflowName}...`).start();
                try {
                    const workflow = await engine.executeWorkflow(workflowName, { sessionId });
                    spinner.succeed(`Workflow started: ${workflow.id}`);
                    
                    console.log(chalk.green('\n✅ Workflow Details:'));
                    console.log(`ID: ${workflow.id}`);
                    console.log(`Name: ${workflow.name}`);
                    console.log(`Session: ${sessionId}`);
                    console.log(`Status: ${workflow.status}`);
                    console.log(`Started: ${formatDate(workflow.startTime)}`);
                } catch (error) {
                    spinner.fail(`Failed to execute workflow: ${error.message}`);
                }
            })
    )
    .addCommand(
        new Command('status')
            .description('Get workflow status')
            .argument('<workflowId>', 'Workflow ID')
            .action(async (workflowId) => {
                const engine = await initEngine();
                
                const workflow = engine.workflowEngine.getWorkflow(workflowId);
                
                if (!workflow) {
                    console.log(chalk.red('Workflow not found'));
                    return;
                }
                
                console.log(chalk.blue('\n📊 Workflow Status:'));
                console.log(`ID: ${workflow.id}`);
                console.log(`Name: ${workflow.name}`);
                console.log(`Status: ${chalk[getStatusColor(workflow.status)](workflow.status)}`);
                console.log(`Progress: ${workflow.progress}%`);
                console.log(`Started: ${formatDate(workflow.startTime)}`);
                
                if (workflow.endTime) {
                    console.log(`Ended: ${formatDate(workflow.endTime)}`);
                    console.log(`Duration: ${formatDuration(new Date(workflow.endTime) - new Date(workflow.startTime))}`);
                }
                
                if (workflow.steps.length > 0) {
                    console.log(chalk.blue('\n📝 Steps:'));
                    workflow.steps.forEach((step, index) => {
                        const status = step.success ? chalk.green('✓') : chalk.red('✗');
                        console.log(`${index + 1}. ${status} ${step.name}`);
                    });
                }
                
                if (workflow.error) {
                    console.log(chalk.red('\n❌ Error:'));
                    console.log(workflow.error.message);
                }
            })
    );

// Memory Commands
program
    .command('memory')
    .description('Memory management commands')
    .addCommand(
        new Command('store')
            .description('Store data in memory')
            .argument('<key>', 'Memory key')
            .argument('<data>', 'Data to store (JSON string)')
            .option('-n, --namespace <namespace>', 'Namespace', 'default')
            .action(async (key, data, options) => {
                const engine = await initEngine();
                
                try {
                    const parsedData = JSON.parse(data);
                    const id = await engine.storeMemory(key, parsedData, options.namespace);
                    console.log(chalk.green(`✅ Data stored with ID: ${id}`));
                } catch (error) {
                    console.log(chalk.red(`❌ Failed to store data: ${error.message}`));
                }
            })
    )
    .addCommand(
        new Command('get')
            .description('Retrieve data from memory')
            .argument('<key>', 'Memory key')
            .option('-n, --namespace <namespace>', 'Namespace', 'default')
            .action(async (key, options) => {
                const engine = await initEngine();
                
                try {
                    const data = await engine.retrieveMemory(key, options.namespace);
                    if (data === null) {
                        console.log(chalk.yellow('Data not found'));
                    } else {
                        console.log(chalk.green('✅ Retrieved data:'));
                        console.log(JSON.stringify(data, null, 2));
                    }
                } catch (error) {
                    console.log(chalk.red(`❌ Failed to retrieve data: ${error.message}`));
                }
            })
    )
    .addCommand(
        new Command('search')
            .description('Search memory')
            .argument('<query>', 'Search query')
            .option('-n, --namespace <namespace>', 'Namespace filter')
            .option('-l, --limit <limit>', 'Result limit', '20')
            .action(async (query, options) => {
                const engine = await initEngine();
                
                try {
                    const results = await engine.searchMemory(query, {
                        namespace: options.namespace,
                        limit: parseInt(options.limit)
                    });
                    
                    if (results.length === 0) {
                        console.log(chalk.yellow('No results found'));
                        return;
                    }
                    
                    console.log(chalk.blue(`\n🔍 Found ${results.length} results:`));
                    
                    const table = new Table({
                        head: ['Namespace', 'Key', 'Size', 'Timestamp'],
                        colWidths: [15, 30, 10, 20]
                    });
                    
                    results.forEach(result => {
                        table.push([
                            result.namespace,
                            result.key,
                            `${result.size}B`,
                            formatDate(result.timestamp)
                        ]);
                    });
                    
                    console.log(table.toString());
                } catch (error) {
                    console.log(chalk.red(`❌ Search failed: ${error.message}`));
                }
            })
    );

// Status Command
program
    .command('status')
    .description('Show Claude Flow system status')
    .action(async () => {
        const engine = await initEngine();
        
        const status = engine.getStatus();
        const memoryStats = engine.memorySystem.getStats();
        const integrationStatus = engine.auggieIntegration.getIntegrationStatus();
        
        console.log(chalk.blue('\n🚀 Claude Flow System Status\n'));
        
        // System Status
        console.log(chalk.green('System:'));
        console.log(`  Version: ${status.version}`);
        console.log(`  Initialized: ${status.initialized ? '✅' : '❌'}`);
        console.log(`  Uptime: ${formatDuration(status.uptime)}`);
        console.log(`  Active Sessions: ${engine.sessionManager.getActiveSessions().length}`);
        console.log(`  Active Workflows: ${status.activeWorkflows}`);
        
        // Memory Status
        console.log(chalk.green('\nMemory:'));
        console.log(`  Operations: ${memoryStats.operations}`);
        console.log(`  Hit Rate: ${memoryStats.hitRate}`);
        console.log(`  Size: ${memoryStats.memorySize} items`);
        console.log(`  Namespaces: ${memoryStats.namespaces}`);
        
        // Integration Status
        console.log(chalk.green('\nIntegration:'));
        console.log(`  Auggie Available: ${integrationStatus.auggieAvailable ? '✅' : '❌'}`);
        console.log(`  Hybrid Mode: ${integrationStatus.hybridMode ? '✅' : '❌'}`);
        console.log(`  Current Provider: ${integrationStatus.currentProvider}`);
        
        // Metrics
        console.log(chalk.green('\nMetrics:'));
        console.log(`  Sessions Created: ${status.metrics.sessionsCreated}`);
        console.log(`  Workflows Executed: ${status.metrics.workflowsExecuted}`);
        console.log(`  Memory Operations: ${status.metrics.memoryOperations}`);
        console.log(`  Errors: ${status.metrics.errors}`);
    });

// Interactive Mode
program
    .command('interactive')
    .alias('i')
    .description('Start interactive mode')
    .action(async () => {
        const engine = await initEngine();
        
        console.log(chalk.blue('\n🤖 Claude Flow Interactive Mode'));
        console.log(chalk.gray('Type "help" for available commands, "exit" to quit\n'));
        
        while (true) {
            const { command } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'command',
                    message: 'claude-flow>',
                    prefix: ''
                }
            ]);
            
            if (command.toLowerCase() === 'exit') {
                break;
            }
            
            if (command.toLowerCase() === 'help') {
                console.log(chalk.blue('\nAvailable commands:'));
                console.log('  session create - Create new session');
                console.log('  session list - List sessions');
                console.log('  workflow list - List workflows');
                console.log('  workflow execute <name> - Execute workflow');
                console.log('  memory search <query> - Search memory');
                console.log('  status - Show system status');
                console.log('  help - Show this help');
                console.log('  exit - Exit interactive mode\n');
                continue;
            }
            
            // Parse and execute command
            try {
                const args = command.split(' ');
                await program.parseAsync(['node', 'claude-flow', ...args], { from: 'user' });
            } catch (error) {
                console.log(chalk.red(`❌ Error: ${error.message}`));
            }
        }
        
        console.log(chalk.blue('👋 Goodbye!'));
    });

// Program configuration
program
    .name('claude-flow')
    .description('Claude Flow CLI - Advanced AI workflow automation for IT-ERA')
    .version('1.0.0')
    .option('-d, --debug', 'Enable debug mode')
    .option('-v, --verbose', 'Verbose output');

// Error handling
program.exitOverride();

try {
    program.parse();
} catch (error) {
    if (error.code !== 'commander.help' && error.code !== 'commander.version') {
        console.error(chalk.red(`❌ Error: ${error.message}`));
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🛑 Shutting down Claude Flow...'));
    if (engine) {
        await engine.shutdown();
    }
    process.exit(0);
});
