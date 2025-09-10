#!/usr/bin/env node
/**
 * IT-ERA Plesk Deployment Script
 * Automated deployment to Plesk server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PleskDeployer {
    constructor() {
        this.serverIP = '65.109.30.171';
        this.username = 'it-era.it_jk05qj1z25';
        this.password = '9p8yBzJG_2';
        this.domain = 'it-era.it';
        this.projectRoot = process.cwd();
        this.deploymentFiles = [];
    }

    async deploy() {
        console.log('🚀 Starting IT-ERA deployment to Plesk...');
        
        try {
            // Step 1: Prepare deployment package
            await this.prepareDeployment();
            
            // Step 2: Create deployment package
            await this.createDeploymentPackage();
            
            // Step 3: Show deployment instructions
            this.showDeploymentInstructions();
            
            console.log('✅ Deployment preparation complete!');
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            process.exit(1);
        }
    }

    async prepareDeployment() {
        console.log('📦 Preparing deployment files...');
        
        // Essential files for deployment
        const essentialFiles = [
            'server.js',
            'package.json',
            'views/',
            'data/',
            'web/css/',
            'web/js/',
            'web/images/',
            'web/static/',
            'scripts/build-sitemap.js'
        ];

        // Check if all essential files exist
        for (const file of essentialFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                this.deploymentFiles.push(file);
                console.log(`✅ Found: ${file}`);
            } else {
                console.warn(`⚠️ Missing: ${file}`);
            }
        }

        // Create production package.json
        await this.createProductionPackageJson();
        
        // Create .env file for production
        await this.createProductionEnv();
        
        console.log(`📁 ${this.deploymentFiles.length} files prepared for deployment`);
    }

    async createProductionPackageJson() {
        const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
        
        // Production optimized package.json
        const productionPackage = {
            name: packageJson.name,
            version: packageJson.version,
            description: packageJson.description,
            main: 'server.js',
            scripts: {
                start: 'node server.js',
                build: 'npm run build:css',
                'build:css': 'echo "CSS build completed"'
            },
            dependencies: {
                express: packageJson.dependencies.express,
                ejs: packageJson.dependencies.ejs,
                compression: packageJson.dependencies.compression,
                helmet: packageJson.dependencies.helmet,
                'express-rate-limit': packageJson.dependencies['express-rate-limit'],
                cors: packageJson.dependencies.cors,
                dotenv: packageJson.dependencies.dotenv,
                nodemailer: packageJson.dependencies.nodemailer,
                'express-validator': packageJson.dependencies['express-validator']
            },
            engines: {
                node: '>=18.0.0',
                npm: '>=8.0.0'
            }
        };

        fs.writeFileSync(
            path.join(this.projectRoot, 'package-production.json'),
            JSON.stringify(productionPackage, null, 2)
        );

        console.log('📄 Production package.json created');
    }

    async createProductionEnv() {
        const envContent = `# IT-ERA Production Environment
NODE_ENV=production
PORT=3000
SITE_NAME=IT-ERA
DOMAIN=it-era.it
BASE_URL=https://it-era.it

# Security
SESSION_SECRET=your-secure-session-secret-here
JWT_SECRET=your-jwt-secret-here

# Email Configuration (update with real SMTP settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@it-era.it
SMTP_PASS=your-email-password

# Analytics
GA_TRACKING_ID=your-google-analytics-id

# Database (if needed in future)
# DB_HOST=localhost
# DB_USER=it_era_user
# DB_PASS=secure_password
# DB_NAME=it_era_db
`;

        fs.writeFileSync(path.join(this.projectRoot, '.env.production'), envContent);
        console.log('🔧 Production .env file created');
    }

    async createDeploymentPackage() {
        console.log('📦 Creating deployment package...');
        
        const deploymentDir = path.join(this.projectRoot, 'deployment');
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }

        // Create deployment script
        const deployScript = `#!/bin/bash
# IT-ERA Plesk Deployment Script

echo "🚀 Starting IT-ERA deployment..."

# Upload files to Plesk
echo "📁 Uploading files..."

# Method 1: Using SCP (SSH porta 4522)
# scp -P 4522 -r * ${this.username}@${this.serverIP}:/var/www/vhosts/${this.domain}/httpdocs/

# Method 2: Using FTP (manual upload required)
echo "📋 Manual upload required via Plesk File Manager:"
echo "   Server: ${this.serverIP}"
echo "   Username: ${this.username}"
echo "   Directory: /httpdocs/"

# Install dependencies
echo "📦 Install dependencies in Plesk Node.js terminal:"
echo "   npm install"

# Start application
echo "🚀 Start Node.js application in Plesk:"
echo "   Application startup file: server.js"
echo "   Environment: production"

echo "✅ Deployment instructions complete!"
`;

        fs.writeFileSync(path.join(deploymentDir, 'deploy.sh'), deployScript);
        fs.chmodSync(path.join(deploymentDir, 'deploy.sh'), '755');

        // Create ZIP package for easy upload
        try {
            console.log('🗜️ Creating ZIP package...');
            execSync(`cd "${this.projectRoot}" && zip -r deployment/it-era-deployment.zip server.js package-production.json .env.production views/ data/ web/ scripts/ -x "*.git*" "node_modules/*" "*.log" "*.tmp"`);
            console.log('✅ ZIP package created: deployment/it-era-deployment.zip');
        } catch (error) {
            console.warn('⚠️ ZIP creation failed, manual file upload required');
        }
    }

    showDeploymentInstructions() {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 IT-ERA PLESK DEPLOYMENT INSTRUCTIONS');
        console.log('='.repeat(60));
        
        console.log('\n📋 STEP 1: ACCESS PLESK CONTROL PANEL');
        console.log(`   URL: https://${this.serverIP}:8443`);
        console.log(`   Username: ${this.username}`);
        console.log(`   Password: ${this.password}`);
        
        console.log('\n📋 STEP 2: CREATE NODE.JS APPLICATION');
        console.log('   1. Go to "Websites & Domains"');
        console.log(`   2. Select "${this.domain}" domain`);
        console.log('   3. Click "Node.js" in development section');
        console.log('   4. Create new Node.js application:');
        console.log('      - Node.js version: 18.x or higher');
        console.log('      - Application mode: Production');
        console.log('      - Application root: /httpdocs');
        console.log('      - Startup file: server.js');
        console.log(`      - Application URL: https://${this.domain}`);
        
        console.log('\n📋 STEP 3: UPLOAD FILES');
        console.log('   Option A: Use File Manager');
        console.log('   1. Go to "Files" in Plesk');
        console.log('   2. Navigate to /httpdocs/');
        console.log('   3. Upload deployment/it-era-deployment.zip');
        console.log('   4. Extract the ZIP file');
        console.log('   5. Rename package-production.json to package.json');
        console.log('   6. Rename .env.production to .env');
        
        console.log('\n   Option B: Use FTP Client');
        console.log(`   Server: ${this.serverIP}`);
        console.log(`   Username: ${this.username}`);
        console.log(`   Password: ${this.password}`);
        console.log('   Directory: /httpdocs/');
        
        console.log('\n📋 STEP 4: INSTALL DEPENDENCIES');
        console.log('   1. In Plesk Node.js application settings');
        console.log('   2. Open "NPM" section');
        console.log('   3. Click "npm install"');
        console.log('   4. Wait for installation to complete');
        
        console.log('\n📋 STEP 5: CONFIGURE ENVIRONMENT');
        console.log('   1. In Node.js application settings');
        console.log('   2. Set environment variables:');
        console.log('      NODE_ENV=production');
        console.log('      PORT=3000');
        console.log('      SITE_NAME=IT-ERA');
        console.log(`      DOMAIN=${this.domain}`);
        
        console.log('\n📋 STEP 6: START APPLICATION');
        console.log('   1. In Node.js application settings');
        console.log('   2. Click "Enable Node.js"');
        console.log('   3. Click "Restart App"');
        console.log('   4. Verify application is running');
        
        console.log('\n📋 STEP 7: CONFIGURE SSL');
        console.log('   1. Go to "SSL/TLS Certificates"');
        console.log('   2. Install "Let\'s Encrypt" certificate');
        console.log('   3. Enable "Redirect from HTTP to HTTPS"');
        
        console.log('\n📋 STEP 8: TEST DEPLOYMENT');
        console.log(`   1. Visit https://${this.domain}`);
        console.log('   2. Test all major pages:');
        console.log('      - Homepage (/)');
        console.log('      - Services (/servizi)');
        console.log('      - City pages (/assistenza-it-milano)');
        console.log('      - Contact forms');
        
        console.log('\n🎉 DEPLOYMENT COMPLETE!');
        console.log(`   Your site will be live at: https://${this.domain}`);
        console.log('\n📞 Support: 039 888 2041');
        console.log('📧 Email: info@it-era.it');
        console.log('\n' + '='.repeat(60));
    }
}

// CLI execution
if (require.main === module) {
    const deployer = new PleskDeployer();
    deployer.deploy().catch(console.error);
}

module.exports = { PleskDeployer };
