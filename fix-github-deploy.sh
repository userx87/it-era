#!/bin/bash

# IT-ERA GitHub Deploy Fix Script
# Auto-generated on 2025-09-13T07:40:00.703Z

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
echo "5. Verify site is accessible at: https://userx87.github.io/it-era"

echo ""
echo "📞 Need help? Contact IT-ERA: 039 888 2041"
