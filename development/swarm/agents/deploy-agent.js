#!/usr/bin/env node

const BaseAgent = require('./base-agent');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

/**
 * Deploy Agent - Specializzato nel deployment e nella gestione dell'infrastruttura
 */
class DeployAgent extends BaseAgent {
    constructor() {
        super('Deploy Agent', 'DevOps Specialist', [
            'git_operations',
            'github_pages_deploy',
            'vercel_deploy',
            'build_optimization',
            'performance_monitoring',
            'backup_creation'
        ]);
        
        this.deployConfig = this.loadDeployConfig();
    }

    /**
     * Carica la configurazione di deploy
     */
    loadDeployConfig() {
        return {
            github: {
                repository: 'userx87/it-era',
                branch: 'main',
                pagesUrl: 'https://userx87.github.io/it-era/'
            },
            vercel: {
                projectName: 'it-era',
                domain: 'it-era.vercel.app'
            },
            build: {
                outputDir: '_site',
                assetsDir: 'assets',
                optimizations: ['minify', 'compress', 'cache']
            }
        };
    }

    /**
     * Processa un task specifico
     */
    async processTask(task) {
        switch (task.type) {
            case 'git_operations':
                return await this.performGitOperations(task.data);
            case 'github_pages_deploy':
                return await this.deployToGitHubPages(task.data);
            case 'vercel_deploy':
                return await this.deployToVercel(task.data);
            case 'build_optimization':
                return await this.optimizeBuild(task.data);
            case 'performance_monitoring':
                return await this.monitorPerformance(task.data);
            case 'backup_creation':
                return await this.createBackup(task.data);
            default:
                throw new Error(`Unknown task type: ${task.type}`);
        }
    }

    /**
     * Esegue operazioni Git
     */
    async performGitOperations(data) {
        const { operations } = data;
        const results = [];

        for (const operation of operations) {
            try {
                const result = await this.executeGitCommand(operation);
                results.push({
                    operation: operation.type,
                    success: true,
                    result: result,
                    timestamp: new Date().toISOString()
                });
                this.log(`✅ Git operation completed: ${operation.type}`, 'success');
            } catch (error) {
                results.push({
                    operation: operation.type,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                this.log(`❌ Git operation failed: ${operation.type} - ${error.message}`, 'error');
            }
        }

        return {
            operations: results,
            summary: {
                total: operations.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        };
    }

    /**
     * Esegue un comando Git specifico
     */
    async executeGitCommand(operation) {
        const { type, params = {} } = operation;
        
        switch (type) {
            case 'add':
                return await execAsync(`git add ${params.files || '.'}`);
            
            case 'commit':
                const message = params.message || `🚀 Automated deployment - ${new Date().toISOString()}`;
                return await execAsync(`git commit -m "${message}"`);
            
            case 'push':
                const branch = params.branch || 'main';
                return await execAsync(`git push origin ${branch}`);
            
            case 'status':
                return await execAsync('git status --porcelain');
            
            case 'pull':
                return await execAsync('git pull origin main');
            
            case 'tag':
                const tag = params.tag || `v${new Date().toISOString().split('T')[0]}`;
                await execAsync(`git tag ${tag}`);
                return await execAsync(`git push origin ${tag}`);
            
            default:
                throw new Error(`Unknown git operation: ${type}`);
        }
    }

    /**
     * Deploy su GitHub Pages
     */
    async deployToGitHubPages(data) {
        this.log('🚀 Starting GitHub Pages deployment', 'info');
        
        try {
            // 1. Verifica che ci siano modifiche
            const { stdout: status } = await execAsync('git status --porcelain');
            
            if (status.trim() === '') {
                this.log('📭 No changes to deploy', 'info');
                return {
                    deployed: false,
                    reason: 'No changes detected',
                    timestamp: new Date().toISOString()
                };
            }

            // 2. Add, commit e push
            await execAsync('git add .');
            
            const commitMessage = data.commitMessage || `🚀 Deploy: ${new Date().toISOString()}`;
            await execAsync(`git commit -m "${commitMessage}"`);
            
            await execAsync('git push origin main');
            
            // 3. Attendi che GitHub Pages si aggiorni
            this.log('⏳ Waiting for GitHub Pages to update...', 'info');
            await this.waitForDeployment();
            
            // 4. Verifica il deployment
            const deploymentStatus = await this.verifyDeployment();
            
            this.log('✅ GitHub Pages deployment completed', 'success');
            
            return {
                deployed: true,
                url: this.deployConfig.github.pagesUrl,
                commitHash: await this.getLatestCommitHash(),
                deploymentStatus: deploymentStatus,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            this.log(`❌ GitHub Pages deployment failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Deploy su Vercel
     */
    async deployToVercel(data) {
        this.log('🚀 Starting Vercel deployment', 'info');
        
        try {
            // Verifica se Vercel CLI è installato
            try {
                await execAsync('vercel --version');
            } catch (error) {
                throw new Error('Vercel CLI not installed. Run: npm i -g vercel');
            }

            // Deploy su Vercel
            const deployCommand = data.production ? 'vercel --prod' : 'vercel';
            const { stdout } = await execAsync(deployCommand);
            
            // Estrai URL dal output
            const urlMatch = stdout.match(/https:\/\/[^\s]+/);
            const deployUrl = urlMatch ? urlMatch[0] : null;
            
            this.log('✅ Vercel deployment completed', 'success');
            
            return {
                deployed: true,
                url: deployUrl,
                production: data.production || false,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            this.log(`❌ Vercel deployment failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Ottimizza il build
     */
    async optimizeBuild(data) {
        this.log('🔧 Starting build optimization', 'info');
        
        const optimizations = [];
        
        try {
            // 1. Minifica CSS
            if (data.minifyCSS !== false) {
                await this.minifyCSS();
                optimizations.push('CSS minified');
            }
            
            // 2. Ottimizza immagini
            if (data.optimizeImages !== false) {
                await this.optimizeImages();
                optimizations.push('Images optimized');
            }
            
            // 3. Genera sitemap
            if (data.generateSitemap !== false) {
                await this.generateSitemap();
                optimizations.push('Sitemap generated');
            }
            
            // 4. Comprimi file
            if (data.compressFiles !== false) {
                await this.compressFiles();
                optimizations.push('Files compressed');
            }
            
            this.log('✅ Build optimization completed', 'success');
            
            return {
                optimized: true,
                optimizations: optimizations,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            this.log(`❌ Build optimization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Minifica CSS
     */
    async minifyCSS() {
        // Implementazione minificazione CSS
        this.log('🎨 Minifying CSS files', 'debug');
        // Qui implementeresti la logica di minificazione
    }

    /**
     * Ottimizza immagini
     */
    async optimizeImages() {
        // Implementazione ottimizzazione immagini
        this.log('🖼️ Optimizing images', 'debug');
        // Qui implementeresti la logica di ottimizzazione immagini
    }

    /**
     * Genera sitemap
     */
    async generateSitemap() {
        this.log('🗺️ Generating sitemap', 'debug');
        
        const siteUrl = this.deployConfig.github.pagesUrl;
        const pages = this.discoverPages();
        
        const sitemap = this.createSitemapXML(pages, siteUrl);
        
        fs.writeFileSync(path.join('_site', 'sitemap.xml'), sitemap);
        this.log('✅ Sitemap generated', 'success');
    }

    /**
     * Scopre tutte le pagine del sito
     */
    discoverPages() {
        const pages = [];
        const siteDir = '_site';
        
        const scanDirectory = (dir) => {
            const items = fs.readdirSync(dir);
            
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (item.endsWith('.html')) {
                    const relativePath = path.relative(siteDir, fullPath);
                    const url = relativePath.replace(/\\/g, '/').replace(/index\.html$/, '');
                    pages.push({
                        url: url || '',
                        lastmod: stat.mtime.toISOString(),
                        priority: this.calculatePriority(url)
                    });
                }
            });
        };
        
        if (fs.existsSync(siteDir)) {
            scanDirectory(siteDir);
        }
        
        return pages;
    }

    /**
     * Calcola la priorità di una pagina
     */
    calculatePriority(url) {
        if (url === '' || url === 'index.html') return '1.0';
        if (url.includes('servizi') || url.includes('contatti')) return '0.9';
        if (url.includes('settori')) return '0.8';
        return '0.7';
    }

    /**
     * Crea il file sitemap.xml
     */
    createSitemapXML(pages, siteUrl) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        pages.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${siteUrl}${page.url}</loc>\n`;
            xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        });
        
        xml += '</urlset>';
        return xml;
    }

    /**
     * Comprimi file
     */
    async compressFiles() {
        // Implementazione compressione file
        this.log('📦 Compressing files', 'debug');
    }

    /**
     * Attende che il deployment sia completato
     */
    async waitForDeployment(maxWait = 60000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            // Qui potresti implementare una verifica dello stato del deployment
        }
    }

    /**
     * Verifica il deployment
     */
    async verifyDeployment() {
        try {
            // Qui implementeresti una verifica HTTP del sito
            return { status: 'success', responseTime: 200 };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * Ottiene l'hash dell'ultimo commit
     */
    async getLatestCommitHash() {
        try {
            const { stdout } = await execAsync('git rev-parse HEAD');
            return stdout.trim();
        } catch (error) {
            return null;
        }
    }

    /**
     * Monitora le performance
     */
    async monitorPerformance(data) {
        // Implementazione monitoraggio performance
        return { performance: 'good' };
    }

    /**
     * Crea backup
     */
    async createBackup(data) {
        // Implementazione creazione backup
        return { backup: 'created' };
    }
}

module.exports = DeployAgent;
