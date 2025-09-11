#!/usr/bin/env node

/**
 * 🚀 DEPLOY TO ROOT - Sposta tutto da _site alla root per GitHub Pages
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Funzioni di colore
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// File e directory da escludere dal deploy
const EXCLUDE_FROM_ROOT = [
    '.git',
    '.gitignore',
    'node_modules',
    'package.json',
    'package-lock.json',
    'swarm',
    'scripts',
    'README.md',
    'README-FINAL.md',
    'SWARM-README.md',
    'SEO-STRATEGY-PLAN.md',
    '*.js',
    '_site'
];

class RootDeployer {
    constructor() {
        this.sourceDir = '_site';
        this.targetDir = '.';
        this.moved = 0;
        this.errors = [];
    }

    async deploy() {
        console.log(colors.bold(colors.blue('\n🚀 DEPLOY TO ROOT FOR GITHUB PAGES')));
        console.log(colors.blue('=========================================\n'));

        try {
            // 1. Verifica che _site esista
            if (!fs.existsSync(this.sourceDir)) {
                throw new Error('Directory _site non trovata!');
            }

            // 2. Backup dei file importanti
            await this.backupImportantFiles();

            // 3. Pulisci la root (mantieni file importanti)
            await this.cleanRoot();

            // 4. Copia tutto da _site alla root
            await this.copyToRoot();

            // 5. Ripristina file importanti
            await this.restoreImportantFiles();

            // 6. Crea .nojekyll
            await this.createNoJekyll();

            // 7. Commit e push
            await this.commitAndPush();

            this.showResults();

        } catch (error) {
            console.error(colors.red(`❌ Errore durante il deploy: ${error.message}`));
            process.exit(1);
        }
    }

    async backupImportantFiles() {
        console.log(colors.yellow('📦 Backup file importanti...'));
        
        const importantFiles = [
            '.gitignore',
            'package.json',
            'package-lock.json',
            'README.md',
            'README-FINAL.md',
            'SWARM-README.md'
        ];

        if (!fs.existsSync('.backup')) {
            fs.mkdirSync('.backup');
        }

        for (const file of importantFiles) {
            if (fs.existsSync(file)) {
                fs.copyFileSync(file, path.join('.backup', file));
                console.log(`  ✅ Backup: ${file}`);
            }
        }

        // Backup directory swarm
        if (fs.existsSync('swarm')) {
            this.copyDirectory('swarm', '.backup/swarm');
            console.log(`  ✅ Backup: swarm/`);
        }
    }

    async cleanRoot() {
        console.log(colors.yellow('🧹 Pulizia root directory...'));
        
        const items = fs.readdirSync('.');
        
        for (const item of items) {
            // Salta file e directory importanti
            if (this.shouldSkipItem(item)) {
                continue;
            }

            const fullPath = path.join('.', item);
            
            try {
                if (fs.statSync(fullPath).isDirectory()) {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                    console.log(`  🗑️ Rimossa directory: ${item}`);
                } else {
                    fs.unlinkSync(fullPath);
                    console.log(`  🗑️ Rimosso file: ${item}`);
                }
            } catch (error) {
                console.log(`  ⚠️ Impossibile rimuovere: ${item}`);
            }
        }
    }

    shouldSkipItem(item) {
        const skipItems = [
            '.git',
            '.backup',
            '_site',
            'node_modules',
            'swarm',
            'package.json',
            'package-lock.json',
            '.gitignore',
            'README.md',
            'README-FINAL.md',
            'SWARM-README.md',
            'deploy-to-root.js',
            'swarm-simple.js',
            'create-all-seo-pages.js'
        ];

        return skipItems.includes(item) || item.startsWith('.');
    }

    async copyToRoot() {
        console.log(colors.yellow('📁 Copia file da _site alla root...'));
        
        const items = fs.readdirSync(this.sourceDir);
        
        for (const item of items) {
            const sourcePath = path.join(this.sourceDir, item);
            const targetPath = path.join('.', item);
            
            try {
                if (fs.statSync(sourcePath).isDirectory()) {
                    this.copyDirectory(sourcePath, targetPath);
                    console.log(`  ✅ Copiata directory: ${item}`);
                } else {
                    fs.copyFileSync(sourcePath, targetPath);
                    console.log(`  ✅ Copiato file: ${item}`);
                }
                this.moved++;
            } catch (error) {
                this.errors.push({ item, error: error.message });
                console.log(`  ❌ Errore copia: ${item}`);
            }
        }
    }

    copyDirectory(source, target) {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }

        const items = fs.readdirSync(source);
        
        for (const item of items) {
            const sourcePath = path.join(source, item);
            const targetPath = path.join(target, item);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectory(sourcePath, targetPath);
            } else {
                fs.copyFileSync(sourcePath, targetPath);
            }
        }
    }

    async restoreImportantFiles() {
        console.log(colors.yellow('🔄 Ripristino file importanti...'));
        
        if (!fs.existsSync('.backup')) {
            return;
        }

        const items = fs.readdirSync('.backup');
        
        for (const item of items) {
            const sourcePath = path.join('.backup', item);
            const targetPath = path.join('.', item);
            
            try {
                if (fs.statSync(sourcePath).isDirectory()) {
                    this.copyDirectory(sourcePath, targetPath);
                } else {
                    fs.copyFileSync(sourcePath, targetPath);
                }
                console.log(`  ✅ Ripristinato: ${item}`);
            } catch (error) {
                console.log(`  ⚠️ Errore ripristino: ${item}`);
            }
        }

        // Rimuovi backup
        fs.rmSync('.backup', { recursive: true, force: true });
    }

    async createNoJekyll() {
        console.log(colors.yellow('📄 Creazione .nojekyll...'));
        fs.writeFileSync('.nojekyll', '');
        console.log('  ✅ File .nojekyll creato');
    }

    async commitAndPush() {
        console.log(colors.yellow('🚀 Commit e push...'));
        
        try {
            await execAsync('git add .');
            await execAsync('git commit -m "🚀 Deploy to root for GitHub Pages"');
            await execAsync('git push origin main');
            console.log('  ✅ Deploy completato');
        } catch (error) {
            console.log(`  ⚠️ Errore Git: ${error.message}`);
        }
    }

    showResults() {
        console.log(colors.bold(colors.green('\n🎉 DEPLOY TO ROOT COMPLETATO!')));
        console.log(colors.green('====================================='));
        console.log(`📁 File/directory spostati: ${colors.bold(this.moved.toString())}`);
        console.log(`❌ Errori: ${colors.bold(this.errors.length.toString())}`);
        
        if (this.errors.length > 0) {
            console.log(colors.red('\n⚠️ ERRORI:'));
            this.errors.forEach(error => {
                console.log(`  ❌ ${error.item}: ${error.error}`);
            });
        }

        console.log(colors.cyan('\n🌐 Il sito dovrebbe ora essere disponibile su:'));
        console.log(colors.bold(colors.cyan('  https://userx87.github.io/it-era/')));
        console.log(colors.yellow('\n⏳ Attendi 2-5 minuti per la propagazione di GitHub Pages'));
    }
}

async function main() {
    const deployer = new RootDeployer();
    await deployer.deploy();
}

if (require.main === module) {
    main();
}

module.exports = RootDeployer;
