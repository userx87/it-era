# IT-ERA Chatbot UI Testing Suite

Comprehensive UI testing suite for the IT-ERA Swarm Chatbot using Puppeteer and Jest.

## 🎯 Overview

This testing suite validates the complete user interface of the IT-ERA chatbot system against the Product Specification Document (PSD) requirements, ensuring optimal performance, accessibility, and user experience.

## 📋 Test Categories

### 1. UI Responsiveness Testing (`ui-responsiveness.test.js`)
- ✅ Page load performance across all viewports (mobile, tablet, desktop)
- ✅ Component visibility and layout adaptation
- ✅ CSS animations and transitions
- ✅ Cross-browser compatibility
- ✅ Performance metrics display

### 2. Chatbot Interface Testing (`chatbot-interface.test.js`)
- ✅ Chat message input/output functionality
- ✅ Test scenario button interactions
- ✅ Status indicators and real-time metrics
- ✅ Options buttons and conversation flow
- ✅ Error handling and edge cases

### 3. Admin Panel Testing (`admin-panel.test.js`)
- ✅ Tab switching and navigation
- ✅ Configuration management (AI models, swarm settings)
- ✅ Business rules and pattern management
- ✅ Real-time metrics and monitoring
- ✅ Deploy and emergency functions

### 4. Interaction Flow Testing (`interaction-flow.test.js`)
- ✅ Complete user journey validation
- ✅ High-value lead scenario workflow
- ✅ Urgent support escalation flow
- ✅ Form validation and error handling
- ✅ Message history and persistence

### 5. Performance UI Testing (`performance-ui.test.js`)
- ✅ Page load time measurement
- ✅ JavaScript execution performance
- ✅ API response time validation
- ✅ Memory usage monitoring
- ✅ Lighthouse performance audit

### 6. Accessibility Testing (`accessibility.test.js`)
- ✅ WCAG 2.1 AA compliance verification
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Color contrast validation
- ✅ Mobile accessibility standards

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Chrome/Chromium browser

### Installation
```bash
# Navigate to the test directory
cd /Users/andreapanzeri/progetti/IT-ERA/tests/puppeteer-ui

# Install dependencies
npm install

# Make run script executable
chmod +x run-all-tests.js
```

### Running Tests

#### Run All Tests
```bash
# Complete test suite execution
node run-all-tests.js

# OR using npm script
npm run test:all
```

#### Run Individual Test Suites
```bash
# UI Responsiveness
npm run test:ui

# Chatbot Interface
npm run test:chatbot

# Admin Panel
npm run test:admin

# Interaction Flow
npm run test:flow

# Performance
npm run test:performance

# Accessibility
npm run test:accessibility
```

#### Generate Reports Only
```bash
npm run report
```

## 📊 Test Configuration

### Performance Thresholds (Based on PSD Requirements)
- **Response Time**: < 1.6 seconds
- **Page Load**: < 3.0 seconds
- **Cost per Query**: < €0.04
- **Lead Score Accuracy**: > 85%
- **Error Rate**: < 5%

### Test URLs
- **Test Page**: `/api/docs/test-swarm-chatbot.html`
- **Admin Panel**: `/api/docs/admin-chatbot.html`
- **Target API**: `https://it-era-chatbot-staging.bulltech.workers.dev`

### Viewports Tested
- **Mobile**: 375×667px
- **Tablet**: 768×1024px
- **Desktop**: 1920×1080px
- **Large Desktop**: 2560×1440px

## 📁 Output Structure

```
tests/puppeteer-ui/
├── screenshots/           # Test screenshots
├── reports/              # Individual test results (JSON)
├── lighthouse-reports/   # Lighthouse audit reports
└── final-reports/        # Comprehensive reports
    ├── comprehensive-ui-test-report.html
    ├── TEST-SUMMARY.md
    └── test-results-data.json
```

## 🔍 Key Features

### Automated Screenshot Capture
- Full-page and element-specific screenshots
- Categorized by test type and viewport
- Visual regression testing support

### Performance Monitoring
- Real-time metrics collection
- Memory usage tracking
- Network performance analysis
- Core Web Vitals measurement

### Accessibility Validation
- Automated axe-core auditing
- Keyboard navigation testing
- Color contrast verification
- Mobile touch target validation

### PSD Compliance Checking
- Response time validation against 1.6s requirement
- Cost optimization verification
- Lead scoring accuracy testing
- Business rules enforcement validation

## 🧪 Test Scenarios

### High-Value Lead Flow
Tests the complete journey of a high-value prospect:
1. Landing on test page
2. Selecting high-value lead scenario
3. Receiving swarm-processed response
4. Verifying lead score ≥85
5. Interacting with option buttons

### Urgent Support Workflow
Validates emergency escalation process:
1. Urgent support scenario trigger
2. Priority escalation verification
3. Case number assignment
4. Response time under 1 second
5. Teams notification simulation

### Admin Panel Management
Tests administrative control functions:
1. Configuration management
2. Business rules updates
3. Real-time monitoring
4. Emergency swarm disable
5. Deploy and rollback operations

## 📈 Performance Benchmarks

| Metric | Target | Current | Status |
|--------|---------|---------|--------|
| Page Load Time | < 3s | TBD | Pending |
| API Response | < 1.6s | TBD | Pending |
| Lighthouse Score | > 80 | TBD | Pending |
| Memory Usage | < 50MB | TBD | Pending |
| WCAG Violations | 0 | TBD | Pending |

## 🛠️ Troubleshooting

### Common Issues

#### Puppeteer Launch Errors
```bash
# Install Chrome dependencies on Linux
sudo apt-get install -y libgconf-2-4 libxss1 libxtst6 libgtk-3-0 libgbm-dev

# For sandbox issues
npm test -- --no-sandbox
```

#### Network Timeouts
- Increase timeout in `jest.setup.js`
- Check staging API availability
- Verify network connectivity

#### Screenshot Directory Issues
```bash
# Ensure directories exist
mkdir -p screenshots reports lighthouse-reports final-reports
```

### Debug Mode
```bash
# Run with detailed logging
DEBUG=puppeteer* npm test

# Run single test with debugging
npx jest ui-responsiveness.test.js --verbose --detectOpenHandles
```

## 🔧 Configuration Options

### Environment Variables
```bash
# Set custom test URLs
export TEST_PAGE_URL="file:///path/to/test-page.html"
export ADMIN_PAGE_URL="file:///path/to/admin-page.html"
export API_URL="https://custom-api.domain.com"

# Performance thresholds
export RESPONSE_TIME_THRESHOLD=1600
export COST_THRESHOLD=0.04
```

### Jest Configuration
Modify `package.json` for custom Jest settings:
```json
{
  "jest": {
    "testTimeout": 120000,
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
    "testMatch": ["**/*.test.js"]
  }
}
```

## 📋 CI/CD Integration

### GitHub Actions Example
```yaml
name: UI Tests
on: [push, pull_request]
jobs:
  ui-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd tests/puppeteer-ui && npm install
      - run: cd tests/puppeteer-ui && node run-all-tests.js
      - uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: tests/puppeteer-ui/final-reports/
```

## 📞 Support

For issues with the testing suite:
1. Check the troubleshooting section above
2. Review the generated error logs in `reports/`
3. Contact the development team with specific error details

## 🤝 Contributing

When adding new tests:
1. Follow the existing test structure
2. Add comprehensive assertions
3. Include screenshot captures
4. Update this README with new test descriptions
5. Ensure PSD compliance validation

---

**Testing Suite Version**: 1.0.0  
**Last Updated**: 2025-08-24  
**Compatibility**: Node.js 16+, Chrome/Chromium 90+