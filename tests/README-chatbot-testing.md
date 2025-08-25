# IT-ERA Chatbot Professional Testing Suite

## 🎯 Overview

This comprehensive E2E testing suite validates the IT-ERA chatbot functionality on the production website `https://www.it-era.it` using professional Puppeteer testing practices.

## 🚀 Quick Start

```bash
# Navigate to tests directory
cd tests

# Run the complete chatbot test suite
./run-chatbot-test.sh

# Or run with npm
npm run test:chatbot
```

## 📋 What Gets Tested

### ✅ Website Loading & Accessibility
- ✅ Production URL loads successfully (https://www.it-era.it)
- ✅ Page returns HTTP 200 status
- ✅ Page title contains "IT-ERA"
- ✅ Content loaded properly
- ✅ Performance monitoring (< 15 seconds load time)

### 💬 Chatbot Widget Detection
- ✅ Chatbot widget found on page
- ✅ Multiple selector strategies for widget detection
- ✅ Support for iframe-based chatbots
- ✅ Widget accessibility validation

### 🤖 Chatbot Interaction Flow
- ✅ Chatbot opens when triggered
- ✅ Greeting message verification: `"[IT-ERA] Ciao, come posso aiutarti?"`
- ✅ Message input field detection
- ✅ Message sending capability
- ✅ Response handling
- ✅ Conversation flow testing

### 🔍 Error Monitoring & Reporting
- ✅ Console errors capture and classification
- ✅ Page errors monitoring
- ✅ Network request tracking
- ✅ Failed request detection
- ✅ Critical error identification

### 📸 Visual Documentation
- ✅ Screenshots at each test step
- ✅ Full-page screenshots for debugging
- ✅ Mobile and desktop viewport testing
- ✅ Before/after interaction captures

## 📊 Test Reports

### Generated Reports:
1. **JSON Report** (`test-report.json`) - Detailed technical data
2. **HTML Report** (`reports/chatbot-test-report.html`) - Visual test results
3. **Screenshots** (`screenshots/`) - Visual evidence of each step

### Report Contents:
```json
{
  "timestamp": "2024-08-25T10:30:00.000Z",
  "totalNetworkRequests": 45,
  "consoleErrors": 0,
  "pageErrors": 0,
  "networkRequests": [...],
  "consoleErrors": [...],
  "pageErrors": [...]
}
```

## 🛠️ Technical Implementation

### Architecture:
- **Framework**: Jest + Puppeteer
- **Browser**: Headless Chrome with optimized settings
- **Timeout**: 30-second default with smart retries
- **Error Handling**: Comprehensive with graceful degradation
- **Async/Await**: Full async pattern implementation

### Key Features:
- **Multi-selector Strategy**: Tests multiple possible chatbot selectors
- **Iframe Support**: Handles chatbot implementations within iframes  
- **Network Monitoring**: Tracks all requests for performance analysis
- **Error Classification**: Separates critical from non-critical errors
- **Responsive Testing**: Validates on different viewport sizes

### Browser Configuration:
```javascript
{
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ],
  defaultViewport: {
    width: 1920,
    height: 1080
  }
}
```

## 📝 Test Scripts

### Available Commands:
```bash
# Run all chatbot tests
npm run test:chatbot

# Run with debug mode (sequential, detailed output)
npm run test:chatbot-debug

# Run and capture screenshots
npm run test:screenshots

# Clean test artifacts
npm run clean
```

### Manual Script Execution:
```bash
# Make executable
chmod +x run-chatbot-test.sh

# Run comprehensive test
./run-chatbot-test.sh
```

## 🚨 Error Handling

### Graceful Degradation:
- If chatbot widget not found → Logs warning, continues testing
- If greeting message differs → Logs expected vs actual
- If network timeouts occur → Retry with exponential backoff
- If screenshots fail → Continues test execution

### Critical Failures:
- Website not accessible (non-200 response)
- Page completely fails to load
- Browser crashes or becomes unresponsive

## 🎯 Expected Results

### ✅ Successful Test Run:
```
🚀 Loading IT-ERA website...
✅ Website loaded successfully
🔍 Looking for chatbot widget...
✅ Chatbot widget found with selector: #chatbot-widget
💬 Opening chatbot...
✅ Clicked chatbot trigger: #chatbot-widget button
✅ Greeting found: [IT-ERA] Ciao, come posso aiutarti?
💬 Testing message sending...
✅ Message sent: Ciao, ho bisogno di assistenza per il mio computer
✅ Message interaction completed
⏱️  Page load time: 2847ms
📊 Network requests made: 42
🎯 Greeting message verification: PASSED
✅ All tests passed! Chatbot is working correctly.
```

### 📊 Performance Benchmarks:
- **Page Load**: < 15 seconds (target: < 5 seconds)
- **Chatbot Response**: < 3 seconds
- **Network Requests**: Typical range 30-60 requests
- **Console Errors**: < 5 non-critical errors acceptable

## 🔧 Troubleshooting

### Common Issues:

1. **Chatbot not found**
   - Check if chatbot script is loaded
   - Verify iframe content accessibility
   - Review network requests for chatbot resources

2. **Greeting message mismatch**
   - Verify exact text: `[IT-ERA] Ciao, come posso aiutarti?`
   - Check for dynamic content loading
   - Review screenshots for visual confirmation

3. **Network timeout**
   - Check internet connectivity
   - Verify website is accessible
   - Review firewall/proxy settings

4. **Test environment issues**
   - Ensure Node.js 16+ installed
   - Run `npm install` to install dependencies
   - Check permissions for screenshot directory

### Debug Mode:
```bash
# Run with maximum verbosity
npm run test:chatbot-debug

# Check generated reports
ls -la reports/
ls -la screenshots/
```

## 📈 Continuous Integration

### CI/CD Integration:
```yaml
# Example GitHub Actions
- name: Run Chatbot Tests
  run: |
    cd tests
    npm install
    npm run test:chatbot
```

### Jenkins Integration:
```groovy
stage('Chatbot Testing') {
    steps {
        dir('tests') {
            sh 'npm install'
            sh 'npm run test:chatbot'
        }
    }
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'tests/reports',
                reportFiles: 'chatbot-test-report.html',
                reportName: 'Chatbot Test Report'
            ])
        }
    }
}
```

## 🏆 Best Practices Implemented

1. **Professional Error Handling**: Comprehensive error capture and classification
2. **Visual Documentation**: Screenshots at every critical step
3. **Performance Monitoring**: Load time and resource usage tracking  
4. **Graceful Degradation**: Tests continue even with minor failures
5. **Detailed Reporting**: JSON and HTML reports for analysis
6. **CI/CD Ready**: Designed for automated pipeline integration
7. **Multi-Browser Support**: Configurable browser settings
8. **Security Conscious**: Safe selector strategies and input validation

---

**🎯 Test Goal**: Ensure the IT-ERA chatbot provides a professional, accessible, and reliable customer interaction experience on the production website.

**📞 Support**: For issues with this test suite, contact the IT-ERA development team at info@it-era.it