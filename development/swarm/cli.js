#!/usr/bin/env node

const { Command } = require('commander');
const SwarmCoordinator = require('./swarm-coordinator');
const chalk = require('chalk');
const Table = require('cli-table3');
const ora = require('ora');

const program = new Command();
const swarm = new SwarmCoordinator();

// Configurazione CLI
program
    .name('swarm')
    .description('🐝 IT-ERA Swarm Multi-Agent System')
    .version('1.0.0');

/**
 * Comando per eseguire workflow
 */
program
    .command('run <workflow>')
    .description('Execute a specific workflow')
    .option('-d, --data <data>', 'JSON data for the workflow')
    .action(async (workflow, options) => {
        const spinner = ora(`🚀 Executing workflow: ${workflow}`).start();
        
        try {
            let data = {};
            if (options.data) {
                data = JSON.parse(options.data);
            }
            
            const result = await swarm.executeWorkflow(workflow, data);
            
            spinner.succeed(`✅ Workflow '${workflow}' completed successfully`);
            
            // Mostra risultati
            console.log('\n📊 WORKFLOW RESULTS:');
            console.log(`Duration: ${Math.round(result.duration / 1000)}s`);
            console.log(`Steps completed: ${result.steps.length}`);
            
            // Tabella dei risultati
            const table = new Table({
                head: ['Step', 'Agent', 'Task', 'Status'],
                colWidths: [8, 15, 25, 15]
            });
            
            result.steps.forEach(step => {
                table.push([
                    step.step,
                    step.agent,
                    step.task,
                    step.result ? chalk.green('✅ Success') : chalk.red('❌ Failed')
                ]);
            });
            
            console.log(table.toString());
            
        } catch (error) {
            spinner.fail(`❌ Workflow failed: ${error.message}`);
            process.exit(1);
        }
    });

/**
 * Comando per implementare la strategia SEO completa
 */
program
    .command('implement-seo')
    .description('🎯 Implement complete SEO strategy')
    .action(async () => {
        const spinner = ora('🎯 Implementing complete SEO strategy...').start();
        
        try {
            const result = await swarm.implementSEOStrategy();
            
            spinner.succeed('✅ SEO strategy implemented successfully');
            
            console.log('\n🎉 SEO IMPLEMENTATION COMPLETED:');
            console.log(`📄 Pages created: ${result.steps.find(s => s.task === 'create_seo_pages')?.result?.created || 0}`);
            console.log(`🚀 Deployment: ${result.steps.find(s => s.task === 'github_pages_deploy')?.result?.deployed ? 'Success' : 'Failed'}`);
            console.log(`🌐 Site URL: https://userx87.github.io/it-era/`);
            
        } catch (error) {
            spinner.fail(`❌ SEO implementation failed: ${error.message}`);
            process.exit(1);
        }
    });

/**
 * Comando per fare deploy
 */
program
    .command('deploy')
    .description('🚀 Deploy to GitHub Pages')
    .option('-m, --message <message>', 'Commit message')
    .action(async (options) => {
        const spinner = ora('🚀 Deploying to GitHub Pages...').start();
        
        try {
            const data = {};
            if (options.message) {
                data.commitMessage = options.message;
            }
            
            const result = await swarm.executeWorkflow('deploy_only', data);
            
            spinner.succeed('✅ Deployment completed successfully');
            
            const deployResult = result.steps.find(s => s.task === 'github_pages_deploy')?.result;
            if (deployResult) {
                console.log(`\n🌐 Site deployed: ${deployResult.url}`);
                console.log(`📝 Commit: ${deployResult.commitHash}`);
            }
            
        } catch (error) {
            spinner.fail(`❌ Deployment failed: ${error.message}`);
            process.exit(1);
        }
    });

/**
 * Comando per mostrare lo stato del swarm
 */
program
    .command('status')
    .description('📊 Show swarm status')
    .action(() => {
        const status = swarm.getSwarmStatus();
        
        console.log(chalk.blue.bold('\n🐝 SWARM STATUS\n'));
        
        // Stato coordinatore
        console.log(chalk.yellow('📋 Coordinator:'));
        console.log(`  Running: ${status.coordinator.isRunning ? chalk.green('Yes') : chalk.gray('No')}`);
        console.log(`  Agents: ${status.coordinator.agentsCount}`);
        console.log(`  Workflows: ${status.coordinator.workflowsCount}`);
        
        // Stato agenti
        console.log(chalk.yellow('\n🤖 Agents:'));
        const agentTable = new Table({
            head: ['Agent', 'Status', 'Tasks', 'Completed', 'Success Rate'],
            colWidths: [15, 12, 8, 12, 15]
        });
        
        Object.entries(status.agents).forEach(([name, agent]) => {
            const metrics = swarm.agents.get(name).getMetrics();
            agentTable.push([
                agent.name,
                agent.status === 'idle' ? chalk.green('Idle') : chalk.yellow(agent.status),
                agent.tasksCount,
                agent.completedTasks,
                `${Math.round(metrics.successRate)}%`
            ]);
        });
        
        console.log(agentTable.toString());
        
        // Workflows disponibili
        console.log(chalk.yellow('\n📋 Available Workflows:'));
        status.workflows.forEach(workflow => {
            console.log(`  • ${workflow}`);
        });
    });

/**
 * Comando per creare pagine SEO specifiche
 */
program
    .command('create-pages')
    .description('📄 Create specific SEO pages')
    .option('-t, --type <type>', 'Page type (service, sector, location)')
    .option('-c, --config <config>', 'JSON configuration for pages')
    .action(async (options) => {
        const spinner = ora('📄 Creating SEO pages...').start();
        
        try {
            let pages = [];
            
            if (options.config) {
                pages = JSON.parse(options.config);
            } else {
                // Pagine di default basate sul tipo
                switch (options.type) {
                    case 'service':
                        pages = [
                            {
                                type: 'service_page',
                                url: '/servizi/sicurezza-informatica-avanzata.html',
                                data: {
                                    service: 'Sicurezza Informatica Avanzata',
                                    location: 'Milano',
                                    benefits: 'Protezione completa, firewall enterprise, monitoraggio 24/7'
                                }
                            }
                        ];
                        break;
                    case 'sector':
                        pages = [
                            {
                                type: 'sector_page',
                                url: '/settori/settore-finanziario.html',
                                data: {
                                    sector: 'Settore Finanziario',
                                    location: 'Milano',
                                    specific_benefits: 'Compliance PCI-DSS, sicurezza transazioni'
                                }
                            }
                        ];
                        break;
                    case 'location':
                        pages = [
                            {
                                type: 'location_page',
                                url: '/zone/assistenza-it-monza.html',
                                data: {
                                    location: 'Monza',
                                    coverage: 'Brianza e hinterland milanese'
                                }
                            }
                        ];
                        break;
                    default:
                        throw new Error('Specify page type: service, sector, or location');
                }
            }
            
            const seoAgent = swarm.agents.get('seo');
            const taskId = seoAgent.addTask({
                type: 'create_seo_pages',
                data: { pages }
            });
            
            const result = await seoAgent.executeTask(taskId);
            
            spinner.succeed(`✅ Created ${result.created} SEO pages`);
            
            // Mostra pagine create
            console.log('\n📄 CREATED PAGES:');
            result.pages.forEach(page => {
                console.log(`  • ${page.url} (${page.wordCount} words)`);
            });
            
        } catch (error) {
            spinner.fail(`❌ Failed to create pages: ${error.message}`);
            process.exit(1);
        }
    });

/**
 * Comando per programmare task automatici
 */
program
    .command('schedule')
    .description('📅 Start automated task scheduling')
    .action(() => {
        console.log(chalk.blue('📅 Starting automated task scheduling...'));
        
        swarm.scheduleAutomatedTasks();
        
        console.log(chalk.green('✅ Automated tasks scheduled:'));
        console.log('  • Daily deployment at 2:00 AM');
        console.log('  • Weekly backup on Sunday at 3:00 AM');
        console.log('\nPress Ctrl+C to stop scheduling');
        
        // Mantieni il processo attivo
        process.on('SIGINT', async () => {
            console.log(chalk.yellow('\n🛑 Stopping scheduled tasks...'));
            await swarm.shutdown();
            process.exit(0);
        });
    });

/**
 * Comando per mostrare i workflow disponibili
 */
program
    .command('workflows')
    .description('📋 List available workflows')
    .action(() => {
        console.log(chalk.blue.bold('\n📋 AVAILABLE WORKFLOWS\n'));
        
        swarm.workflows.forEach((workflow, name) => {
            console.log(chalk.yellow(`🔄 ${name}:`));
            console.log(`  Name: ${workflow.name}`);
            console.log(`  Description: ${workflow.description}`);
            console.log(`  Steps: ${workflow.steps.length}`);
            
            workflow.steps.forEach(step => {
                console.log(`    ${step.priority}. ${step.task} (${step.agent})`);
            });
            console.log('');
        });
    });

/**
 * Comando per reset degli agenti
 */
program
    .command('reset')
    .description('🔄 Reset all agents')
    .action(() => {
        console.log(chalk.yellow('🔄 Resetting all agents...'));
        
        swarm.agents.forEach(agent => {
            agent.reset();
        });
        
        console.log(chalk.green('✅ All agents reset successfully'));
    });

// Gestione errori globali
process.on('unhandledRejection', (error) => {
    console.error(chalk.red(`❌ Unhandled error: ${error.message}`));
    process.exit(1);
});

// Esegui il CLI
program.parse();

// Se nessun comando è specificato, mostra l'help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
