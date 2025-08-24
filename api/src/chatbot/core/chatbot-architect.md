# System Architect Agent - Chatbot Architecture

## Mission
Design comprehensive chatbot architecture that seamlessly integrates with existing IT-ERA email system.

## Email System Integration Analysis
- **Provider**: Resend via Cloudflare Workers
- **API Endpoint**: https://it-era-email.bulltech.workers.dev/api/contact
- **Health Endpoint**: https://it-era-email.bulltech.workers.dev/health
- **Sender**: info@it-era.it → andrea@bulltech.it
- **Rate Limit**: 95 emails/day
- **Worker Name**: it-era-email

## Architecture Overview

### 1. Chatbot Core Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Chat Widget   │────│  Chatbot API     │────│  Email Bridge   │
│   (Frontend)    │    │  (Workers)       │    │  (Existing)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────┴────────┐             │
         │              │                 │             │
         │       ┌──────▼──────┐   ┌──────▼──────┐     │
         │       │  NLP Engine │   │   Context   │     │
         │       │   (Core)    │   │   Memory    │     │
         │       └─────────────┘   └─────────────┘     │
         │                                             │
         └─────────────────────────────────────────────┘
```

### 2. Integration Strategy
- **Reuse existing Cloudflare Workers infrastructure**
- **Share authentication and configuration**
- **Maintain same deployment patterns (wrangler)**
- **Use production memory namespace for consistency**

### 3. Conversation Flow Design
```
User Message → Intent Recognition → Response Generation
     ↓              ↓                    ↓
Context Update → Action Routing → Email Forwarding
     ↓              ↓                    ↓
Memory Store → API Response → UI Update
```

### 4. Memory Keys Structure
- `chatbot/conversations/{sessionId}`
- `chatbot/context/{userId}`
- `chatbot/intents/training-data`
- `chatbot/email-integrations/routing`

### 5. Deployment Architecture
- **New Worker**: `it-era-chatbot.bulltech.workers.dev`
- **Shared Config**: Reuse email system environment variables
- **Cross-Origin**: Configure for existing website integration

## Next Steps
1. Define conversation intents and responses
2. Design API endpoints for chat interactions
3. Plan email forwarding logic integration
4. Create development and testing workflow

---
*Agent: System Architect | Task: Architecture Design | Memory: production namespace*