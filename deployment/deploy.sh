#!/bin/bash
# IT-ERA Plesk Deployment Script

echo "🚀 Starting IT-ERA deployment..."

# Upload files to Plesk
echo "📁 Uploading files..."

# Method 1: Using SCP (SSH porta 4522)
# scp -P 4522 -r * it-era.it_jk05qj1z25@65.109.30.171:/var/www/vhosts/it-era.it/httpdocs/

# Method 2: Using FTP (manual upload required)
echo "📋 Manual upload required via Plesk File Manager:"
echo "   Server: 65.109.30.171"
echo "   Username: it-era.it_jk05qj1z25"
echo "   Directory: /httpdocs/"

# Install dependencies
echo "📦 Install dependencies in Plesk Node.js terminal:"
echo "   npm install"

# Start application
echo "🚀 Start Node.js application in Plesk:"
echo "   Application startup file: server.js"
echo "   Environment: production"

echo "✅ Deployment instructions complete!"
