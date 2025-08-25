#!/bin/bash

# IT-ERA Chatbot Professional Test Runner
# This script runs comprehensive E2E tests for the IT-ERA chatbot

set -e  # Exit on any error

echo "🚀 Starting IT-ERA Chatbot E2E Test Suite"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ to run tests."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "16" ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create necessary directories
echo "📁 Setting up test directories..."
mkdir -p screenshots
mkdir -p reports

# Clean previous test results
echo "🧹 Cleaning previous test results..."
rm -f test-report.json
rm -f reports/chatbot-test-report.html
rm -f screenshots/*.png

# Run the chatbot test
echo "🎯 Running IT-ERA Chatbot E2E Tests..."
echo "Target URL: https://www.it-era.it"
echo "Expected Greeting: [IT-ERA] Ciao, come posso aiutarti?"
echo ""

# Run with verbose output and proper error handling
if npm run test:chatbot; then
    echo ""
    echo "✅ CHATBOT TESTS COMPLETED SUCCESSFULLY!"
    echo "📊 Test reports available:"
    echo "   - JSON Report: test-report.json"
    echo "   - HTML Report: reports/chatbot-test-report.html"
    echo "   - Screenshots: screenshots/"
    echo ""
    
    # Show summary if test report exists
    if [ -f "test-report.json" ]; then
        echo "📈 Test Summary:"
        echo "   - Network Requests: $(jq '.totalNetworkRequests // 0' test-report.json)"
        echo "   - Console Errors: $(jq '.consoleErrors // 0' test-report.json)"
        echo "   - Page Errors: $(jq '.pageErrors // 0' test-report.json)"
    fi
    
    echo ""
    echo "🎉 All tests passed! Chatbot is working correctly."
    
else
    echo ""
    echo "❌ CHATBOT TESTS FAILED!"
    echo "📋 Check the following:"
    echo "   1. Website accessibility: https://www.it-era.it"
    echo "   2. Chatbot widget loading correctly"
    echo "   3. Network connectivity"
    echo "   4. Screenshots in screenshots/ directory for debugging"
    echo ""
    echo "📊 Reports still generated for analysis:"
    echo "   - JSON Report: test-report.json"
    echo "   - HTML Report: reports/chatbot-test-report.html"
    echo ""
    exit 1
fi

echo "🔍 Opening test report in browser (if available)..."
if command -v open &> /dev/null; then
    open reports/chatbot-test-report.html 2>/dev/null || true
elif command -v xdg-open &> /dev/null; then
    xdg-open reports/chatbot-test-report.html 2>/dev/null || true
fi

echo "✨ Test execution complete!"