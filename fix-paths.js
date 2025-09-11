#!/usr/bin/env node

/**
 * 🔧 FIX PATHS - Rimuove /it-era/ da tutti i link interni
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

class PathFixer {
    constructor() {
        this.fixed = 0;
        this.errors = [];
    }

    async fixAllPaths() {
        console.log(colors.bold(colors.blue('\n🔧 FIXING INTERNAL PATHS')));
        console.log(colors.blue('============================\n'));

        try {
            // Trova tutti i file HTML
            const htmlFiles = await this.findHtmlFiles('.');
            
            console.log(colors.yellow(`📄 Trovati ${htmlFiles.length} file HTML da processare\n`));

            // Processa ogni file
            for (const file of htmlFiles) {
                try {
                    await this.fixFileLinks(file);
                    this.fixed++;
                    console.log(`  ✅ ${file}`);
                } catch (error) {
                    this.errors.push({ file, error: error.message });
                    console.log(`  ❌ ${file} - ${error.message}`);
                }
            }

            // Commit e push
            await this.commitChanges();

            this.showResults();

        } catch (error) {
            console.error(colors.red(`❌ Errore: ${error.message}`));
            process.exit(1);
        }
    }

    async findHtmlFiles(dir) {
        const htmlFiles = [];
        
        const scanDirectory = (currentDir) => {
            // Salta alcune directory
            if (currentDir.includes('node_modules') || 
                currentDir.includes('.git') || 
                currentDir.includes('_site')) {
                return;
            }

            const items = fs.readdirSync(currentDir);
            
            items.forEach(item => {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (item.endsWith('.html')) {
                    htmlFiles.push(fullPath);
                }
            });
        };
        
        scanDirectory(dir);
        return htmlFiles;
    }

    async fixFileLinks(filePath) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Pattern da sostituire
        const patterns = [
            // Link href
            { from: /href="\/it-era\//g, to: 'href="/' },
            { from: /href='\/it-era\//g, to: "href='/" },
            
            // Src per immagini, CSS, JS
            { from: /src="\/it-era\//g, to: 'src="/' },
            { from: /src='\/it-era\//g, to: "src='/" },
            
            // Action per form
            { from: /action="\/it-era\//g, to: 'action="/' },
            { from: /action='\/it-era\//g, to: "action='/" },
            
            // URL nei meta tag
            { from: /content="https:\/\/userx87\.github\.io\/it-era\/it-era\//g, to: 'content="https://userx87.github.io/it-era/' },
            
            // URL assoluti nei meta tag
            { from: /"https:\/\/userx87\.github\.io\/it-era\/it-era\//g, to: '"https://userx87.github.io/it-era/' },
            
            // Altri pattern comuni
            { from: /url\(\/it-era\//g, to: 'url(/' },
            { from: /'\/it-era\//g, to: "'/" },
            { from: /"\/it-era\//g, to: '"/' }
        ];

        // Applica tutte le sostituzioni
        patterns.forEach(pattern => {
            if (pattern.from.test(content)) {
                content = content.replace(pattern.from, pattern.to);
                modified = true;
            }
        });

        // Salva solo se modificato
        if (modified) {
            fs.writeFileSync(filePath, content);
        }
    }

    async commitChanges() {
        console.log(colors.yellow('\n🚀 Commit delle modifiche...'));
        
        try {
            await execAsync('git add .');
            await execAsync('git commit -m "🔧 Fix internal paths - remove /it-era/ prefix"');
            await execAsync('git push origin main');
            console.log('  ✅ Modifiche committate e pushate');
        } catch (error) {
            console.log(`  ⚠️ Errore Git: ${error.message}`);
        }
    }

    showResults() {
        console.log(colors.bold(colors.green('\n🎉 PATH FIXING COMPLETATO!')));
        console.log(colors.green('==============================='));
        console.log(`📄 File processati: ${colors.bold(this.fixed.toString())}`);
        console.log(`❌ Errori: ${colors.bold(this.errors.length.toString())}`);
        
        if (this.errors.length > 0) {
            console.log(colors.red('\n⚠️ ERRORI:'));
            this.errors.forEach(error => {
                console.log(`  ❌ ${error.file}: ${error.error}`);
            });
        }

        console.log(colors.cyan('\n🌐 Il sito dovrebbe ora funzionare correttamente:'));
        console.log(colors.bold(colors.cyan('  https://userx87.github.io/it-era/')));
        console.log(colors.yellow('\n⏳ Attendi 2-3 minuti per la propagazione di GitHub Pages'));
    }
}

async function main() {
    const fixer = new PathFixer();
    await fixer.fixAllPaths();
}

if (require.main === module) {
    main();
}

module.exports = PathFixer;
