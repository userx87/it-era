#!/usr/bin/env node

/**
 * IT-ERA GITHUB DEPLOY DIAGNOSTICS
 * Sistema di diagnostica e risoluzione problemi deploy GitHub
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class GitHubDeployDiagnostics {
    constructor() {
        this.config = {
            repoOwner: 'userx87',
            repoName: 'it-era',
            mainBranch: 'main',
            productionBranch: 'production',
            githubPagesUrl: 'https://userx87.github.io/it-era',
            vercelUrl: 'https://it-era.vercel.app'
        };
        
        this.diagnostics = [];
        this.fixes = [];
        this.issues = [];
    }

    async runFullDiagnostics() {
        console.log('🔍 IT-ERA GitHub Deploy Diagnostics');
        console.log('=====================================\n');
        
        try {
            // 1. Controlli Git locali
            await this.checkGitStatus();
            
            // 2. Controlli branch
            await this.checkBranches();
            
            // 3. Controlli workflow GitHub Actions
            await this.checkGitHubWorkflows();
            
            // 4. Controlli file di configurazione
            await this.checkConfigFiles();
            
            // 5. Controlli permessi e secrets
            await this.checkPermissionsAndSecrets();
            
            // 6. Test connettività
            await this.testConnectivity();
            
            // 7. Controlli specifici GitHub Pages
            await this.checkGitHubPages();
            
            // 8. Controlli Vercel
            await this.checkVercelConfig();
            
            // Genera report
            await this.generateReport();
            
            // Suggerisci fix automatici
            await this.suggestFixes();
            
        } catch (error) {
            console.error('❌ Diagnostics failed:', error.message);
            this.issues.push({
                type: 'critical',
                message: `Diagnostics failed: ${error.message}`,
                fix: 'Check system requirements and permissions'
            });
        }
    }

    async checkGitStatus() {
        console.log('📋 Checking Git status...');
        
        try {
            // Controlla se siamo in un repo Git
            const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            
            if (gitStatus.trim()) {
                this.issues.push({
                    type: 'warning',
                    message: 'Uncommitted changes detected',
                    details: gitStatus.trim(),
                    fix: 'Commit or stash changes before deploying'
                });
            } else {
                this.diagnostics.push('✅ Working directory clean');
            }
            
            // Controlla branch corrente
            const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
            this.diagnostics.push(`📍 Current branch: ${currentBranch}`);
            
            // Controlla remote
            const remotes = execSync('git remote -v', { encoding: 'utf8' });
            if (!remotes.includes('github.com')) {
                this.issues.push({
                    type: 'error',
                    message: 'GitHub remote not configured',
                    fix: 'Add GitHub remote: git remote add origin https://github.com/userx87/it-era.git'
                });
            } else {
                this.diagnostics.push('✅ GitHub remote configured');
            }
            
        } catch (error) {
            this.issues.push({
                type: 'error',
                message: 'Not a Git repository or Git not installed',
                fix: 'Initialize Git repository: git init'
            });
        }
    }

    async checkBranches() {
        console.log('🌿 Checking branches...');
        
        try {
            const branches = execSync('git branch -a', { encoding: 'utf8' });
            
            // Controlla branch main
            if (!branches.includes('main')) {
                this.issues.push({
                    type: 'warning',
                    message: 'Main branch not found',
                    fix: 'Create main branch: git checkout -b main'
                });
            } else {
                this.diagnostics.push('✅ Main branch exists');
            }
            
            // Controlla branch production
            if (!branches.includes('production')) {
                this.issues.push({
                    type: 'info',
                    message: 'Production branch not found',
                    fix: 'Create production branch: git checkout -b production'
                });
            } else {
                this.diagnostics.push('✅ Production branch exists');
            }
            
            // Controlla se i branch sono aggiornati
            try {
                execSync('git fetch origin', { stdio: 'ignore' });
                const behind = execSync('git rev-list --count HEAD..origin/main', { encoding: 'utf8' }).trim();
                
                if (parseInt(behind) > 0) {
                    this.issues.push({
                        type: 'warning',
                        message: `Local branch is ${behind} commits behind origin/main`,
                        fix: 'Pull latest changes: git pull origin main'
                    });
                } else {
                    this.diagnostics.push('✅ Branch up to date with remote');
                }
            } catch (error) {
                this.diagnostics.push('⚠️ Could not check remote status');
            }
            
        } catch (error) {
            this.issues.push({
                type: 'error',
                message: 'Could not check branches',
                details: error.message
            });
        }
    }

    async checkGitHubWorkflows() {
        console.log('⚙️ Checking GitHub Actions workflows...');
        
        const workflowsDir = '.github/workflows';
        
        try {
            await fs.access(workflowsDir);
            const workflows = await fs.readdir(workflowsDir);
            
            this.diagnostics.push(`📁 Found ${workflows.length} workflow files`);
            
            // Controlla workflow specifici
            const requiredWorkflows = [
                'deploy-website.yml',
                'deploy-admin-panel.yml'
            ];
            
            for (const workflow of requiredWorkflows) {
                if (workflows.includes(workflow)) {
                    // Controlla contenuto workflow
                    const workflowPath = path.join(workflowsDir, workflow);
                    const content = await fs.readFile(workflowPath, 'utf8');
                    
                    // Controlli specifici
                    if (!content.includes('actions/checkout@v4')) {
                        this.issues.push({
                            type: 'warning',
                            message: `${workflow}: Using outdated checkout action`,
                            fix: 'Update to actions/checkout@v4'
                        });
                    }
                    
                    if (!content.includes('permissions:')) {
                        this.issues.push({
                            type: 'error',
                            message: `${workflow}: Missing permissions configuration`,
                            fix: 'Add permissions section for GitHub Pages deployment'
                        });
                    }
                    
                    this.diagnostics.push(`✅ ${workflow} exists and configured`);
                } else {
                    this.issues.push({
                        type: 'error',
                        message: `Missing workflow: ${workflow}`,
                        fix: `Create ${workflow} in .github/workflows/`
                    });
                }
            }
            
        } catch (error) {
            this.issues.push({
                type: 'error',
                message: 'GitHub workflows directory not found',
                fix: 'Create .github/workflows/ directory and add deployment workflows'
            });
        }
    }

    async checkConfigFiles() {
        console.log('📄 Checking configuration files...');
        
        const configFiles = [
            { file: 'package.json', required: true },
            { file: 'vercel.json', required: false },
            { file: '_headers', required: false },
            { file: '_redirects', required: false },
            { file: 'CNAME', required: false }
        ];
        
        for (const config of configFiles) {
            try {
                await fs.access(config.file);
                
                if (config.file === 'package.json') {
                    const pkg = JSON.parse(await fs.readFile(config.file, 'utf8'));
                    
                    // Controlla scripts di deploy
                    if (!pkg.scripts?.deploy) {
                        this.issues.push({
                            type: 'warning',
                            message: 'No deploy script in package.json',
                            fix: 'Add deploy script: "deploy": "vercel --prod"'
                        });
                    }
                    
                    // Controlla dipendenze
                    if (!pkg.devDependencies?.vercel && !pkg.dependencies?.vercel) {
                        this.issues.push({
                            type: 'info',
                            message: 'Vercel CLI not in dependencies',
                            fix: 'Install Vercel CLI: npm install -g vercel'
                        });
                    }
                }
                
                this.diagnostics.push(`✅ ${config.file} exists`);
                
            } catch (error) {
                if (config.required) {
                    this.issues.push({
                        type: 'error',
                        message: `Required file missing: ${config.file}`,
                        fix: `Create ${config.file}`
                    });
                } else {
                    this.diagnostics.push(`ℹ️ Optional file ${config.file} not found`);
                }
            }
        }
    }

    async checkPermissionsAndSecrets() {
        console.log('🔐 Checking permissions and secrets...');
        
        // Nota: Non possiamo controllare i secrets direttamente, ma possiamo suggerire
        this.diagnostics.push('ℹ️ GitHub secrets check (manual verification required):');
        
        const requiredSecrets = [
            'CLOUDFLARE_API_TOKEN',
            'CLOUDFLARE_ACCOUNT_ID',
            'VERCEL_TOKEN'
        ];
        
        this.diagnostics.push('📋 Required GitHub secrets:');
        requiredSecrets.forEach(secret => {
            this.diagnostics.push(`   - ${secret}`);
        });
        
        // Controlla file .env.example
        try {
            const envExample = await fs.readFile('.env.example', 'utf8');
            this.diagnostics.push('✅ .env.example found - use as reference for secrets');
        } catch (error) {
            this.issues.push({
                type: 'warning',
                message: '.env.example not found',
                fix: 'Create .env.example with required environment variables'
            });
        }
    }

    async testConnectivity() {
        console.log('🌐 Testing connectivity...');
        
        const urls = [
            { name: 'GitHub Pages', url: this.config.githubPagesUrl },
            { name: 'Vercel', url: this.config.vercelUrl }
        ];
        
        for (const { name, url } of urls) {
            try {
                // Simuliamo un test di connettività (in un ambiente reale useresti fetch o axios)
                this.diagnostics.push(`🔗 ${name}: ${url}`);
                this.diagnostics.push(`   Status: Testing required (manual check)`);
            } catch (error) {
                this.issues.push({
                    type: 'warning',
                    message: `Could not reach ${name}`,
                    details: error.message
                });
            }
        }
    }

    async checkGitHubPages() {
        console.log('📄 Checking GitHub Pages configuration...');
        
        // Controlla se esiste _site directory
        try {
            await fs.access('_site');
            this.diagnostics.push('✅ _site directory exists');
        } catch (error) {
            this.issues.push({
                type: 'warning',
                message: '_site directory not found',
                fix: 'Build site before deployment or check build process'
            });
        }
        
        // Controlla index.html nella root o _site
        const indexLocations = ['index.html', '_site/index.html'];
        let indexFound = false;
        
        for (const location of indexLocations) {
            try {
                await fs.access(location);
                this.diagnostics.push(`✅ Index file found: ${location}`);
                indexFound = true;
                break;
            } catch (error) {
                // Continue checking
            }
        }
        
        if (!indexFound) {
            this.issues.push({
                type: 'error',
                message: 'No index.html found',
                fix: 'Create index.html in root or _site directory'
            });
        }
    }

    async checkVercelConfig() {
        console.log('⚡ Checking Vercel configuration...');
        
        try {
            const vercelConfig = await fs.readFile('vercel.json', 'utf8');
            const config = JSON.parse(vercelConfig);
            
            // Controlli configurazione Vercel
            if (!config.builds) {
                this.issues.push({
                    type: 'warning',
                    message: 'No builds configuration in vercel.json',
                    fix: 'Add builds configuration for static site'
                });
            }
            
            if (!config.routes) {
                this.diagnostics.push('ℹ️ No custom routes in vercel.json');
            }
            
            this.diagnostics.push('✅ vercel.json configured');
            
        } catch (error) {
            this.diagnostics.push('ℹ️ vercel.json not found (using defaults)');
        }
    }

    async generateReport() {
        console.log('\n📊 DIAGNOSTICS REPORT');
        console.log('=====================\n');
        
        // Mostra diagnostics
        if (this.diagnostics.length > 0) {
            console.log('✅ SUCCESSFUL CHECKS:');
            this.diagnostics.forEach(item => console.log(`   ${item}`));
            console.log('');
        }
        
        // Mostra issues
        if (this.issues.length > 0) {
            console.log('⚠️ ISSUES FOUND:');
            this.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. [${issue.type.toUpperCase()}] ${issue.message}`);
                if (issue.details) {
                    console.log(`      Details: ${issue.details}`);
                }
                console.log(`      Fix: ${issue.fix}`);
                console.log('');
            });
        } else {
            console.log('🎉 No issues found! Deploy should work correctly.\n');
        }
        
        // Salva report su file
        const report = {
            timestamp: new Date().toISOString(),
            diagnostics: this.diagnostics,
            issues: this.issues,
            summary: {
                totalChecks: this.diagnostics.length,
                totalIssues: this.issues.length,
                criticalIssues: this.issues.filter(i => i.type === 'error').length,
                warnings: this.issues.filter(i => i.type === 'warning').length
            }
        };
        
        await fs.writeFile('github-deploy-diagnostics-report.json', JSON.stringify(report, null, 2));
        console.log('💾 Report saved to: github-deploy-diagnostics-report.json\n');
    }

    async suggestFixes() {
        console.log('🔧 SUGGESTED FIXES');
        console.log('==================\n');
        
        const criticalIssues = this.issues.filter(i => i.type === 'error');
        const warnings = this.issues.filter(i => i.type === 'warning');
        
        if (criticalIssues.length > 0) {
            console.log('🚨 CRITICAL FIXES (must be resolved):');
            criticalIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue.fix}`);
            });
            console.log('');
        }
        
        if (warnings.length > 0) {
            console.log('⚠️ RECOMMENDED FIXES:');
            warnings.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue.fix}`);
            });
            console.log('');
        }
        
        // Genera script di fix automatico
        await this.generateFixScript();
    }

    async generateFixScript() {
        const fixScript = `#!/bin/bash

# IT-ERA GitHub Deploy Fix Script
# Auto-generated on ${new Date().toISOString()}

echo "🔧 IT-ERA GitHub Deploy Fix Script"
echo "=================================="

# Fix Git configuration
echo "📋 Checking Git configuration..."
git config --global user.name "IT-ERA Deploy" 2>/dev/null || echo "Set Git user name: git config --global user.name 'Your Name'"
git config --global user.email "info@it-era.it" 2>/dev/null || echo "Set Git email: git config --global user.email 'your-email@example.com'"

# Create missing directories
echo "📁 Creating missing directories..."
mkdir -p .github/workflows
mkdir -p _site

# Fix package.json scripts
echo "📦 Checking package.json..."
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json missing - create it manually"
fi

# Check GitHub workflows
echo "⚙️ Checking GitHub workflows..."
if [ ! -f ".github/workflows/deploy-website.yml" ]; then
    echo "❌ deploy-website.yml missing - create it manually"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Review and fix any critical issues above"
echo "2. Commit all changes: git add . && git commit -m 'Fix deploy issues'"
echo "3. Push to GitHub: git push origin main"
echo "4. Check GitHub Actions tab for deployment status"
echo "5. Verify site is accessible at: ${this.config.githubPagesUrl}"

echo ""
echo "📞 Need help? Contact IT-ERA: 039 888 2041"
`;
        
        await fs.writeFile('fix-github-deploy.sh', fixScript);
        
        // Make executable on Unix systems
        try {
            await fs.chmod('fix-github-deploy.sh', '755');
        } catch (error) {
            // Ignore on Windows
        }
        
        console.log('🔧 Fix script generated: fix-github-deploy.sh');
        console.log('   Run with: ./fix-github-deploy.sh\n');
    }
}

// Main execution
if (require.main === module) {
    const diagnostics = new GitHubDeployDiagnostics();
    diagnostics.runFullDiagnostics().catch(console.error);
}

module.exports = GitHubDeployDiagnostics;
