# Backend Developer Agent - API & Email Integration

## Mission
Build Cloudflare Workers API for chatbot with seamless email system integration.

## Email System Integration Analysis
From memory: `it-era/email-system/config`
- **Existing Worker**: it-era-email.bulltech.workers.dev
- **API Pattern**: POST /api/contact
- **Health Check**: GET /health
- **Rate Limit**: 95 emails/day
- **Provider**: Resend

## New Chatbot Worker Architecture

### 1. Worker Structure: `it-era-chatbot`
```javascript
// src/chatbot/worker/index.js
export default {
  async fetch(request, env, ctx) {
    const router = new Router();
    
    // Chatbot API endpoints
    router.post('/api/chat', handleChatMessage);
    router.post('/api/forward-email', handleEmailForward);
    router.get('/health', handleHealth);
    
    return router.handle(request);
  }
}
```

### 2. Chat Message Handler
```javascript
async function handleChatMessage(request, env) {
  const { message, sessionId, context } = await request.json();
  
  // 1. NLP Processing
  const intent = await classifyIntent(message);
  const entities = extractEntities(message);
  
  // 2. Generate Response
  const response = await generateResponse(intent, entities, context);
  
  // 3. Update Context Memory
  await updateSessionContext(sessionId, { intent, entities, response });
  
  // 4. Check Email Forwarding
  if (shouldForwardToEmail(intent, entities)) {
    await forwardToEmailSystem(entities, message, sessionId);
  }
  
  return new Response(JSON.stringify({
    response: response.text,
    action: response.action,
    sessionId
  }));
}
```

### 3. Email Forwarding Bridge
```javascript
async function forwardToEmailSystem(entities, originalMessage, sessionId) {
  // Reuse existing email worker configuration
  const emailPayload = {
    from: entities.email || 'chatbot@it-era.it',
    name: entities.name || 'Utente Chatbot',
    subject: `Richiesta da Chatbot - Sessione: ${sessionId}`,
    message: `
      Messaggio originale: ${originalMessage}
      
      Dati utente:
      - Nome: ${entities.name || 'Non fornito'}
      - Email: ${entities.email || 'Non fornita'}
      - Telefono: ${entities.phone || 'Non fornito'}
      
      Contesto conversazione disponibile in memoria: chatbot/conversations/${sessionId}
    `
  };
  
  // Call existing email worker
  const response = await fetch('https://it-era-email.bulltech.workers.dev/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailPayload)
  });
  
  return response.json();
}
```

### 4. Memory Integration
```javascript
// Context management using production namespace
class ChatbotMemory {
  static async saveSession(sessionId, data) {
    await MEMORY.put(`chatbot/conversations/${sessionId}`, JSON.stringify(data));
  }
  
  static async getSession(sessionId) {
    const data = await MEMORY.get(`chatbot/conversations/${sessionId}`);
    return data ? JSON.parse(data) : null;
  }
  
  static async updateUserContext(userId, context) {
    await MEMORY.put(`chatbot/context/${userId}`, JSON.stringify(context));
  }
}
```

### 5. CORS Configuration
```javascript
// Allow integration with existing IT-ERA website
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.it-era.it',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
```

### 6. Environment Variables
```toml
# wrangler.toml for it-era-chatbot
[env.production.vars]
RESEND_API_KEY = "re_xxx" # Reuse from email worker
MEMORY_NAMESPACE = "production"
EMAIL_WORKER_URL = "https://it-era-email.bulltech.workers.dev"
RATE_LIMIT = "200" # Higher for chatbot interactions
```

### 7. Deployment Pipeline
```bash
# Same deployment pattern as email worker
wrangler deploy --env production --name it-era-chatbot
```

## API Endpoints Design

### POST /api/chat
- **Input**: `{ message, sessionId, userId?, context? }`
- **Output**: `{ response, action, sessionId, shouldEmail? }`

### POST /api/forward-email  
- **Input**: `{ sessionId, userEmail, message, context }`
- **Output**: `{ emailSent, emailId, error? }`

### GET /health
- **Output**: `{ status, dependencies: { emailWorker, memory } }`

## Integration Hooks
```javascript
// Hooks for coordination
export async function preTask(description) {
  await fetch('claude-flow-hooks/pre-task', {
    body: JSON.stringify({ description, agent: 'backend-developer' })
  });
}

export async function postEdit(file, memoryKey) {
  await fetch('claude-flow-hooks/post-edit', {
    body: JSON.stringify({ file, memoryKey, agent: 'backend-developer' })
  });
}
```

---
*Agent: Backend Developer | Task: API & Email Integration | Memory: chatbot/backend/api*