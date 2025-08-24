#!/bin/bash

# IT-ERA PC Repair Template Visual Validation Runner
# This script runs comprehensive visual testing with Puppeteer

set -e

echo "🚀 IT-ERA PC Repair Template Visual Validation Suite"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "pc-repair-visual-test.js" ]; then
    echo "❌ Test file not found. Make sure you're in the correct directory."
    exit 1
fi

# Create directories if they don't exist
mkdir -p screenshots reports sample-pages

echo "📋 Pre-flight checks..."
echo "✅ Node.js: $(node --version)"
echo "✅ Test directory: $(pwd)"
echo "✅ Required directories created"
echo ""

# Check if sample page exists
if [ ! -f "sample-pages/riparazione-pc-milano.html" ]; then
    echo "⚠️  Sample page not found - test will create one"
fi

echo "🧪 Running comprehensive visual validation tests..."
echo ""

# Run the test suite
if npm test; then
    echo ""
    echo "🎉 Visual validation completed successfully!"
    echo ""
    
    # Show test results summary
    echo "📊 Test Results Summary:"
    echo "======================="
    
    # Count files in directories
    SCREENSHOT_COUNT=$(find screenshots -name "*.png" 2>/dev/null | wc -l || echo "0")
    REPORT_COUNT=$(find reports -name "*.html" 2>/dev/null | wc -l || echo "0")
    
    echo "📸 Screenshots captured: $SCREENSHOT_COUNT"
    echo "📄 Reports generated: $REPORT_COUNT"
    
    # Show latest report
    LATEST_REPORT=$(find reports -name "*.html" -type f -exec ls -t {} + | head -1 2>/dev/null || echo "")
    if [ -n "$LATEST_REPORT" ]; then
        echo "🌐 Latest report: $LATEST_REPORT"
        echo ""
        echo "💡 To view the report, open: file://$PWD/$LATEST_REPORT"
    fi
    
    # Show screenshot directory
    if [ "$SCREENSHOT_COUNT" -gt 0 ]; then
        echo "📸 Screenshots saved in: $PWD/screenshots/"
        echo ""
        echo "📱 Mobile screenshots:"
        find screenshots -name "*mobile*" -type f 2>/dev/null | sort || true
        echo ""
        echo "🖥️  Desktop screenshots:"
        find screenshots -name "*.png" -not -name "*mobile*" -type f 2>/dev/null | sort || true
    fi
    
else
    echo ""
    echo "❌ Visual validation failed!"
    echo "Check the output above for error details."
    exit 1
fi

echo ""
echo "✅ Validation complete! Check the HTML report for detailed results."