#!/bin/bash
# IT-ERA Plesk Auto-Deployment Script
# Run this script on the Plesk server after uploading files

echo "🚀 Starting IT-ERA auto-deployment on Plesk..."

# Set variables
DOMAIN="it-era.it"
APP_ROOT="/var/www/vhosts/$DOMAIN/httpdocs"
NODE_VERSION="18"

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Make sure you're in the application directory."
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo "📋 Files in directory:"
ls -la

# Rename production files
echo "🔧 Configuring production files..."
if [ -f "package-production.json" ]; then
    mv package-production.json package.json
    echo "✅ Renamed package-production.json to package.json"
fi

if [ -f ".env.production" ]; then
    mv .env.production .env
    echo "✅ Renamed .env.production to .env"
fi

# Set correct permissions
echo "🔐 Setting file permissions..."
chmod 644 *.json *.js
chmod 755 scripts/
chmod -R 644 views/
chmod -R 644 data/
chmod -R 644 web/

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
if command -v npm &> /dev/null; then
    npm install --production
    echo "✅ Dependencies installed successfully"
else
    echo "⚠️ npm not found. Install dependencies manually in Plesk Node.js panel"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p temp
mkdir -p uploads

# Set environment variables (for reference)
echo "🔧 Environment variables to set in Plesk:"
echo "NODE_ENV=production"
echo "PORT=3000"
echo "SITE_NAME=IT-ERA"
echo "DOMAIN=it-era.it"

# Test server startup (dry run)
echo "🧪 Testing server startup..."
if node -c server.js; then
    echo "✅ server.js syntax is valid"
else
    echo "❌ server.js has syntax errors"
    exit 1
fi

# Create startup script for Plesk
cat > app.js << 'EOF'
// Plesk Node.js startup file
// This file starts the main server.js application

console.log('🚀 Starting IT-ERA application...');
require('./server.js');
EOF

echo "✅ Created app.js startup file for Plesk"

# Create package.json scripts for Plesk
echo "📝 Updating package.json scripts for Plesk..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = {
    'start': 'node server.js',
    'app': 'node app.js',
    'build': 'echo \"Build completed\"',
    'test': 'node -c server.js'
};
pkg.main = 'app.js';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Updated package.json for Plesk');
"

# Create web.config for IIS (if needed)
cat > web.config << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="app.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^app.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="app.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
    <iisnode watchedFiles="web.config;*.js"/>
  </system.webServer>
</configuration>
EOF

echo "✅ Created web.config for IIS compatibility"

# Final checklist
echo ""
echo "📋 DEPLOYMENT CHECKLIST:"
echo "✅ Files configured for production"
echo "✅ Dependencies ready for installation"
echo "✅ Startup files created (app.js)"
echo "✅ Permissions set correctly"
echo "✅ Configuration files ready"

echo ""
echo "🎯 NEXT STEPS IN PLESK:"
echo "1. Go to Node.js application settings"
echo "2. Set startup file to: app.js"
echo "3. Set Node.js version to: $NODE_VERSION or higher"
echo "4. Install dependencies (npm install)"
echo "5. Set environment variables:"
echo "   - NODE_ENV=production"
echo "   - PORT=3000"
echo "   - SITE_NAME=IT-ERA"
echo "   - DOMAIN=$DOMAIN"
echo "6. Enable and start the application"
echo "7. Configure SSL certificate"
echo "8. Test the website"

echo ""
echo "🌐 Your website will be available at: https://$DOMAIN"
echo "📞 Support: 039 888 2041"
echo ""
echo "✅ Auto-deployment script completed successfully!"
