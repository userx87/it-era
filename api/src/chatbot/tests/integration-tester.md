# Integration Tester Agent - Comprehensive Testing Strategy

## Mission
Design and implement comprehensive testing for chatbot system and email integration.

## Testing Architecture Overview

### 1. Test Categories
- **Unit Tests**: Individual component testing
- **Integration Tests**: Chatbot ↔ Email system
- **E2E Tests**: Full user conversation flows  
- **Load Tests**: Performance and rate limiting
- **Security Tests**: Input validation and XSS prevention

## Email Integration Testing

### 2. Email System Integration Tests
```javascript
// Test email forwarding functionality
describe('Email Integration', () => {
  test('should forward chat to email when contact requested', async () => {
    const chatMessage = {
      message: 'Vorrei essere contattato per un preventivo',
      sessionId: 'test_session_001',
      context: {
        userEmail: 'test@example.com',
        userName: 'Mario Rossi'
      }
    };
    
    const response = await fetch('https://it-era-chatbot.bulltech.workers.dev/api/chat', {
      method: 'POST',
      body: JSON.stringify(chatMessage)
    });
    
    const result = await response.json();
    
    expect(result.action).toBe('email_forwarded');
    expect(result.response).toContain('team');
    
    // Verify email was actually sent
    const emailCheck = await checkEmailDelivery('test_session_001');
    expect(emailCheck.sent).toBe(true);
  });
  
  test('should handle email system failure gracefully', async () => {
    // Simulate email worker being down
    mockEmailWorkerFailure();
    
    const response = await sendChatMessage('Contattami per favore');
    
    expect(response.response).toContain('errore');
    expect(response.fallbackAction).toBe('show_contact_form');
  });
});
```

### 3. Conversation Flow Tests
```javascript
describe('Conversation Flows', () => {
  test('greeting → services inquiry → contact request', async () => {
    const session = new TestSession();
    
    // Step 1: Greeting
    let response = await session.send('Ciao');
    expect(response.intent).toBe('GREETING');
    expect(response.response).toContain('IT-ERA');
    
    // Step 2: Services inquiry
    response = await session.send('Che servizi offrite?');
    expect(response.intent).toBe('SERVICES_INQUIRY');
    expect(response.response).toContain('servizi');
    
    // Step 3: Contact request
    response = await session.send('Vorrei essere contattato');
    expect(response.intent).toBe('CONTACT_REQUEST');
    expect(response.action).toBe('request_contact_info');
    
    // Step 4: Provide contact info
    response = await session.send('mario.rossi@example.com, 333-1234567');
    expect(response.action).toBe('email_forwarded');
    expect(response.entities.email).toBe('mario.rossi@example.com');
  });
  
  test('multilanguage support', async () => {
    const session = new TestSession();
    
    // English input
    let response = await session.send('Hello, what services do you provide?');
    expect(response.language).toBe('en');
    expect(response.response).toMatch(/services|provide/i);
    
    // Italian input  
    response = await session.send('Grazie, vorrei un preventivo');
    expect(response.language).toBe('it');
    expect(response.response).toMatch(/preventivo|contatto/i);
  });
});
```

### 4. Widget UI Tests (Playwright)
```javascript
// E2E tests for chat widget
describe('Chat Widget E2E', () => {
  test('should open and close chat widget', async ({ page }) => {
    await page.goto('https://www.it-era.it');
    
    // Check widget is present
    const toggle = page.locator('#chatbot-toggle');
    await expect(toggle).toBeVisible();
    
    // Open chat window
    await toggle.click();
    const window = page.locator('#chatbot-window');
    await expect(window).toBeVisible();
    
    // Close chat window
    await page.locator('.chatbot-close').click();
    await expect(window).not.toBeVisible();
  });
  
  test('should send message and receive response', async ({ page }) => {
    await page.goto('https://www.it-era.it');
    await page.locator('#chatbot-toggle').click();
    
    // Send message
    await page.fill('#chatbot-input', 'Ciao, come stai?');
    await page.click('#chatbot-send');
    
    // Check user message appears
    await expect(page.locator('.message.user')).toContainText('Ciao, come stai?');
    
    // Check bot response appears
    await expect(page.locator('.message.bot')).toBeVisible();
    await expect(page.locator('.message.bot')).toContainText('IT-ERA');
  });
  
  test('should integrate with existing contact forms', async ({ page }) => {
    await page.goto('https://www.it-era.it/contact');
    
    // Check chatbot enhancement button exists
    const chatButton = page.locator('button:has-text("Chiedilo al chatbot")');
    await expect(chatButton).toBeVisible();
    
    await chatButton.click();
    
    // Verify chatbot opens with form context
    const chatWindow = page.locator('#chatbot-window');
    await expect(chatWindow).toBeVisible();
  });
});
```

### 5. Load & Performance Tests
```javascript
// Performance testing with k6 or similar
import { check, sleep } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up
    { duration: '5m', target: 50 },   // Stay at 50 concurrent
    { duration: '1m', target: 0 },    // Ramp down
  ],
};

export default function() {
  // Test chatbot API under load
  const response = http.post('https://it-era-chatbot.bulltech.workers.dev/api/chat', 
    JSON.stringify({
      message: 'Load test message',
      sessionId: `session_${__VU}_${__ITER}`
    }), 
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has response field': (r) => JSON.parse(r.body).response !== undefined,
  });
  
  sleep(1);
}
```

### 6. Security Tests  
```javascript
describe('Security Tests', () => {
  test('should sanitize user input', async () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '../../etc/passwd',
      'DROP TABLE users;'
    ];
    
    for (const input of maliciousInputs) {
      const response = await sendChatMessage(input);
      
      // Ensure no script execution or injection
      expect(response.response).not.toContain('<script>');
      expect(response.response).not.toContain('javascript:');
      expect(response.status).not.toBe('error');
    }
  });
  
  test('should handle rate limiting', async () => {
    const sessionId = 'rate_limit_test';
    const promises = [];
    
    // Send 100 requests rapidly
    for (let i = 0; i < 100; i++) {
      promises.push(sendChatMessage('test message', sessionId));
    }
    
    const results = await Promise.all(promises);
    const rateLimited = results.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### 7. Memory & Context Tests
```javascript
describe('Memory Integration', () => {
  test('should persist conversation context', async () => {
    const session = new TestSession('persistent_test');
    
    // First conversation
    await session.send('Mi chiamo Mario Rossi');
    await session.send('Lavoro in una azienda di 50 dipendenti');
    
    // New session with same ID
    const session2 = new TestSession('persistent_test');
    const response = await session2.send('Ricordi il mio nome?');
    
    expect(response.response).toContain('Mario');
  });
  
  test('should handle memory namespace correctly', async () => {
    // Verify using production namespace
    const memoryCheck = await fetch('https://it-era-chatbot.bulltech.workers.dev/api/memory-check');
    const data = await memoryCheck.json();
    
    expect(data.namespace).toBe('production');
    expect(data.keysStartWith).toContain('chatbot/');
  });
});
```

### 8. Automated Testing Pipeline
```yaml
# .github/workflows/chatbot-tests.yml
name: Chatbot Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm install
        
      - name: Unit tests
        run: npm run test:unit
        
      - name: Integration tests  
        run: npm run test:integration
        
      - name: E2E tests
        run: npm run test:e2e
        
      - name: Security tests
        run: npm run test:security
        
      - name: Deploy to staging
        if: success()
        run: wrangler deploy --env staging
```

### 9. Test Data Management
```javascript
// Test fixtures
const TEST_CONVERSATIONS = {
  greeting: {
    input: 'Ciao',
    expectedIntent: 'GREETING',
    expectedResponse: /ciao|buongiorno|assistente/i
  },
  services: {
    input: 'Che servizi offrite?',
    expectedIntent: 'SERVICES_INQUIRY',
    expectedResponse: /servizi|soluzioni|digitali/i
  },
  contact: {
    input: 'Vorrei essere contattato',
    expectedIntent: 'CONTACT_REQUEST',
    expectedAction: 'request_contact_info'
  }
};
```

### 10. Monitoring & Alerting Tests
```javascript
describe('Health Monitoring', () => {
  test('health endpoint responds correctly', async () => {
    const response = await fetch('https://it-era-chatbot.bulltech.workers.dev/health');
    const health = await response.json();
    
    expect(health.status).toBe('ok');
    expect(health.dependencies.emailWorker).toBe('healthy');
    expect(health.dependencies.memory).toBe('connected');
  });
});
```

## Test Execution Strategy
1. **Pre-commit**: Unit tests and linting
2. **PR Creation**: Integration tests
3. **Staging Deploy**: E2E and load tests  
4. **Production Deploy**: Health checks and smoke tests
5. **Continuous**: Security scans and performance monitoring

---
*Agent: Integration Tester | Task: Comprehensive Testing | Memory: chatbot/testing/strategy*