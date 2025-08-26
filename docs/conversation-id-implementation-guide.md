# Conversation ID System - Implementation Guide
*IT-ERA Chatbot Platform - Developer Implementation Reference*

## Quick Implementation Reference

This guide provides developers with the practical implementation details for the Conversation ID system architecture.

## 1. Core Implementation Components

### 1.1 Conversation ID Generator

```javascript
// /api/src/utils/conversation-id-generator.js
class ConversationIDGenerator {
  static ENVIRONMENTS = {
    PRODUCTION: 'P',
    STAGING: 'S', 
    DEVELOPMENT: 'D'
  };

  static generate(environment = 'P') {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .substring(0, 15); // YYYYMMDD_HHMMSS
    
    const random = Array.from({length: 12}, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    
    const conversationId = `ITERA_${timestamp}_${random}_${environment}`;
    
    // Validate format
    if (!this.validate(conversationId)) {
      throw new Error('Generated conversation ID failed validation');
    }
    
    return conversationId;
  }

  static validate(conversationId) {
    const pattern = /^ITERA_\d{8}_\d{6}_[A-Z0-9]{12}_[PSD]$/;
    return pattern.test(conversationId) && conversationId.length === 32;
  }

  static parse(conversationId) {
    if (!this.validate(conversationId)) {
      throw new Error('Invalid conversation ID format');
    }

    const parts = conversationId.split('_');
    return {
      prefix: parts[0],
      date: parts[1],
      time: parts[2], 
      random: parts[3],
      environment: parts[4],
      timestamp: new Date(`${parts[1].substring(0,4)}-${parts[1].substring(4,6)}-${parts[1].substring(6,8)}T${parts[2].substring(0,2)}:${parts[2].substring(2,4)}:${parts[2].substring(4,6)}.000Z`)
    };
  }

  static getEnvironment() {
    const env = process.env.ENVIRONMENT || 'development';
    return {
      'production': this.ENVIRONMENTS.PRODUCTION,
      'staging': this.ENVIRONMENTS.STAGING,
      'development': this.ENVIRONMENTS.DEVELOPMENT
    }[env.toLowerCase()] || this.ENVIRONMENTS.DEVELOPMENT;
  }
}

export default ConversationIDGenerator;
```

### 1.2 Storage Manager

```javascript
// /api/src/storage/conversation-storage-manager.js
import ConversationIDGenerator from '../utils/conversation-id-generator.js';

class ConversationStorageManager {
  constructor(kvNamespace, databaseConnection, environment) {
    this.kvStore = kvNamespace;
    this.db = databaseConnection;
    this.env = environment;
    this.KV_TTL = 86400; // 24 hours
    this.KV_PREFIX = 'conv:';
  }

  async createConversation(initialData = {}) {
    const conversationId = ConversationIDGenerator.generate(
      ConversationIDGenerator.getEnvironment()
    );
    
    const conversation = {
      id: conversationId,
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      status: 'active',
      messageCount: 0,
      metadata: initialData.metadata || {},
      messages: [],
      ...initialData
    };

    // Store in KV for immediate access
    await this.storeInKV(conversationId, conversation);
    
    // Log creation for analytics
    this.logConversationEvent(conversationId, 'created');
    
    return conversation;
  }

  async getConversation(conversationId) {
    try {
      // Try KV first (active conversations)
      let conversation = await this.getFromKV(conversationId);
      
      if (conversation) {
        // Update last access time
        conversation.lastAccess = new Date().toISOString();
        await this.storeInKV(conversationId, conversation, true); // Extend TTL
        return conversation;
      }

      // Try database (archived conversations)
      conversation = await this.getFromDatabase(conversationId);
      
      if (conversation && this.shouldReactivate(conversation)) {
        // Move back to KV if recently accessed
        await this.storeInKV(conversationId, conversation);
        this.logConversationEvent(conversationId, 'reactivated');
      }
      
      return conversation;
      
    } catch (error) {
      console.error(`Error retrieving conversation ${conversationId}:`, error);
      throw error;
    }
  }

  async updateConversation(conversationId, updates) {
    const conversation = await this.getConversation(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Apply updates
    Object.assign(conversation, updates, {
      lastActivity: new Date().toISOString()
    });

    // Store updated version
    await this.storeInKV(conversationId, conversation, true); // Extend TTL
    
    this.logConversationEvent(conversationId, 'updated');
    
    return conversation;
  }

  async archiveConversation(conversationId, reason = 'completed') {
    const conversation = await this.getConversation(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Update status and archive info
    conversation.status = 'archived';
    conversation.archivedAt = new Date().toISOString();
    conversation.archiveReason = reason;

    // Store in database
    await this.storeInDatabase(conversation);
    
    // Remove from KV
    await this.removeFromKV(conversationId);
    
    this.logConversationEvent(conversationId, 'archived', { reason });
    
    return conversation;
  }

  async extendConversation(conversationId, hours = 24) {
    const conversation = await this.getConversation(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const maxHours = 168; // 7 days maximum
    const extensionHours = Math.min(hours, maxHours);
    const newTTL = extensionHours * 3600; // Convert to seconds

    // Store with extended TTL
    await this.storeInKV(conversationId, conversation, false, newTTL);
    
    this.logConversationEvent(conversationId, 'extended', { 
      hours: extensionHours 
    });
    
    return conversation;
  }

  // Private methods
  async storeInKV(conversationId, conversation, extendTTL = false, customTTL = null) {
    const key = `${this.KV_PREFIX}${conversationId}`;
    const ttl = customTTL || (extendTTL ? this.KV_TTL * 2 : this.KV_TTL);
    
    await this.kvStore.put(key, JSON.stringify(conversation), {
      expirationTtl: ttl
    });
  }

  async getFromKV(conversationId) {
    const key = `${this.KV_PREFIX}${conversationId}`;
    const data = await this.kvStore.get(key);
    return data ? JSON.parse(data) : null;
  }

  async removeFromKV(conversationId) {
    const key = `${this.KV_PREFIX}${conversationId}`;
    await this.kvStore.delete(key);
  }

  async storeInDatabase(conversation) {
    if (!this.db) return; // Skip if no database configured
    
    const query = `
      INSERT INTO conversations (
        id, created, last_activity, status, message_count, 
        metadata, messages, archived_at, archive_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) 
      DO UPDATE SET
        last_activity = EXCLUDED.last_activity,
        status = EXCLUDED.status,
        message_count = EXCLUDED.message_count,
        metadata = EXCLUDED.metadata,
        messages = EXCLUDED.messages,
        archived_at = EXCLUDED.archived_at,
        archive_reason = EXCLUDED.archive_reason
    `;
    
    await this.db.query(query, [
      conversation.id,
      conversation.created,
      conversation.lastActivity,
      conversation.status,
      conversation.messageCount || 0,
      JSON.stringify(conversation.metadata || {}),
      JSON.stringify(conversation.messages || []),
      conversation.archivedAt || null,
      conversation.archiveReason || null
    ]);
  }

  async getFromDatabase(conversationId) {
    if (!this.db) return null;
    
    const query = `
      SELECT * FROM conversations 
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [conversationId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      created: row.created,
      lastActivity: row.last_activity,
      status: row.status,
      messageCount: row.message_count,
      metadata: JSON.parse(row.metadata || '{}'),
      messages: JSON.parse(row.messages || '[]'),
      archivedAt: row.archived_at,
      archiveReason: row.archive_reason
    };
  }

  shouldReactivate(conversation) {
    if (!conversation.lastActivity) return false;
    
    const lastActivity = new Date(conversation.lastActivity);
    const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
    
    // Reactivate if accessed within last 2 hours
    return hoursSinceActivity < 2;
  }

  logConversationEvent(conversationId, event, metadata = {}) {
    // Implementation depends on your logging system
    console.log(`[CONVERSATION] ${event.toUpperCase()}: ${conversationId}`, metadata);
  }
}

export default ConversationStorageManager;
```

### 1.3 API Routes Implementation

```javascript
// /api/src/routes/conversations.js
import ConversationStorageManager from '../storage/conversation-storage-manager.js';
import ConversationIDGenerator from '../utils/conversation-id-generator.js';

class ConversationRoutes {
  constructor(app, kvNamespace, database) {
    this.storage = new ConversationStorageManager(kvNamespace, database);
    this.setupRoutes(app);
  }

  setupRoutes(app) {
    // Create conversation
    app.post('/api/v1/conversations', async (req, res) => {
      try {
        const { userAgent, initialContext, source } = req.body;
        
        const conversation = await this.storage.createConversation({
          metadata: {
            userAgent: userAgent || req.headers['user-agent'],
            source: source || 'api',
            clientIP: req.headers['cf-connecting-ip'] || req.ip,
            ...initialContext
          }
        });
        
        res.json({
          success: true,
          conversationId: conversation.id,
          data: conversation
        });
        
      } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create conversation'
        });
      }
    });

    // Get conversation
    app.get('/api/v1/conversations/:id', async (req, res) => {
      try {
        const { id } = req.params;
        
        if (!ConversationIDGenerator.validate(id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid conversation ID format'
          });
        }
        
        const conversation = await this.storage.getConversation(id);
        
        if (!conversation) {
          return res.status(404).json({
            success: false,
            error: 'Conversation not found'
          });
        }
        
        res.json({
          success: true,
          data: conversation
        });
        
      } catch (error) {
        console.error('Error retrieving conversation:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve conversation'
        });
      }
    });

    // Update conversation
    app.put('/api/v1/conversations/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        
        if (!ConversationIDGenerator.validate(id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid conversation ID format'
          });
        }
        
        const conversation = await this.storage.updateConversation(id, updates);
        
        res.json({
          success: true,
          data: conversation
        });
        
      } catch (error) {
        console.error('Error updating conversation:', error);
        
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: 'Conversation not found'
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Failed to update conversation'
          });
        }
      }
    });

    // Extend conversation TTL
    app.put('/api/v1/conversations/:id/extend', async (req, res) => {
      try {
        const { id } = req.params;
        const { extensionHours = 24, reason } = req.body;
        
        if (!ConversationIDGenerator.validate(id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid conversation ID format'
          });
        }
        
        if (extensionHours < 1 || extensionHours > 168) {
          return res.status(400).json({
            success: false,
            error: 'Extension hours must be between 1 and 168 (7 days)'
          });
        }
        
        const conversation = await this.storage.extendConversation(id, extensionHours);
        
        res.json({
          success: true,
          data: conversation,
          extended: extensionHours
        });
        
      } catch (error) {
        console.error('Error extending conversation:', error);
        
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: 'Conversation not found'
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Failed to extend conversation'
          });
        }
      }
    });

    // Archive conversation
    app.delete('/api/v1/conversations/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { reason = 'manual', preserveData = true } = req.body;
        
        if (!ConversationIDGenerator.validate(id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid conversation ID format'
          });
        }
        
        const conversation = await this.storage.archiveConversation(id, reason);
        
        res.json({
          success: true,
          data: preserveData ? conversation : { id: conversation.id, status: 'archived' }
        });
        
      } catch (error) {
        console.error('Error archiving conversation:', error);
        
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: 'Conversation not found'
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Failed to archive conversation'
          });
        }
      }
    });
  }
}

export default ConversationRoutes;
```

## 2. Integration with Existing Chatbot

### 2.1 Updated Session Management

```javascript
// /api/src/chatbot/api/chatbot-worker.js - Updated session functions
import ConversationStorageManager from '../../storage/conversation-storage-manager.js';

// Initialize storage manager
let storageManager = null;

async function initializeStorage(env) {
  if (!storageManager) {
    storageManager = new ConversationStorageManager(
      env.CHAT_SESSIONS,
      null, // Database connection if available
      env.ENVIRONMENT
    );
  }
  return storageManager;
}

// Updated session creation
async function getOrCreateSession(sessionId, CHAT_SESSIONS, env) {
  const storage = await initializeStorage(env);
  
  if (!sessionId) {
    // Create new conversation using the new system
    const conversation = await storage.createConversation({
      metadata: {
        source: 'chatbot_widget',
        created: Date.now()
      }
    });
    
    return {
      id: conversation.id,
      created: Date.now(),
      messages: [],
      context: {},
      step: "greeting",
      leadData: {}
    };
  }
  
  // Try to get existing conversation
  try {
    const conversation = await storage.getConversation(sessionId);
    
    if (conversation) {
      // Convert to legacy format for compatibility
      return {
        id: conversation.id,
        created: new Date(conversation.created).getTime(),
        messages: conversation.messages || [],
        context: conversation.metadata?.context || {},
        step: conversation.metadata?.step || "greeting",
        leadData: conversation.metadata?.leadData || {}
      };
    }
    
    // Conversation not found, create new one
    const newConversation = await storage.createConversation({
      metadata: {
        source: 'chatbot_widget_recovery',
        originalSessionId: sessionId,
        created: Date.now()
      }
    });
    
    return {
      id: newConversation.id,
      created: Date.now(),
      messages: [],
      context: {},
      step: "greeting",
      leadData: {}
    };
    
  } catch (error) {
    console.error('Session retrieval error:', error);
    
    // Fallback to basic session creation
    return {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created: Date.now(),
      messages: [],
      context: {},
      step: "greeting",
      leadData: {}
    };
  }
}

// Updated session saving
async function saveSession(session, CHAT_SESSIONS, env) {
  const storage = await initializeStorage(env);
  
  try {
    // Update conversation in new system
    await storage.updateConversation(session.id, {
      messages: session.messages || [],
      metadata: {
        ...session.context,
        step: session.step,
        leadData: session.leadData,
        lastActivity: Date.now()
      },
      messageCount: (session.messages || []).length
    });
    
  } catch (error) {
    console.error('Session save error:', error);
    
    // Fallback to legacy KV storage
    try {
      await CHAT_SESSIONS.put(session.id, JSON.stringify(session), {
        expirationTtl: CONFIG.MAX_SESSION_DURATION
      });
    } catch (fallbackError) {
      console.error('Fallback session save failed:', fallbackError);
    }
  }
}
```

## 3. Database Schema

### 3.1 PostgreSQL Schema

```sql
-- /api/database/conversation-schema.sql
CREATE TABLE conversations (
    id VARCHAR(32) PRIMARY KEY,
    created TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    message_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    messages JSONB NOT NULL DEFAULT '[]',
    archived_at TIMESTAMP WITH TIME ZONE,
    archive_reason VARCHAR(50),
    
    -- Performance indexes
    CONSTRAINT conversations_status_check CHECK (status IN ('active', 'completed', 'archived', 'deleted')),
    CONSTRAINT conversations_id_format CHECK (id ~ '^ITERA_\d{8}_\d{6}_[A-Z0-9]{12}_[PSD]$')
);

-- Indexes for performance
CREATE INDEX idx_conversations_created ON conversations(created);
CREATE INDEX idx_conversations_last_activity ON conversations(last_activity);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_metadata_gin ON conversations USING GIN(metadata);

-- Partitioning by month for large datasets
CREATE TABLE conversations_2025_01 PARTITION OF conversations
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Add more monthly partitions as needed
CREATE TABLE conversations_2025_02 PARTITION OF conversations
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Analytics view
CREATE VIEW conversation_analytics AS
SELECT 
    DATE_TRUNC('day', created) as date,
    COUNT(*) as total_conversations,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_conversations,
    AVG(message_count) as avg_message_count,
    AVG(EXTRACT(EPOCH FROM (last_activity - created))) as avg_duration_seconds
FROM conversations 
GROUP BY DATE_TRUNC('day', created)
ORDER BY date DESC;

-- Cleanup function for old conversations
CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete conversations older than 7 years
    DELETE FROM conversations 
    WHERE created < NOW() - INTERVAL '7 years'
    AND status IN ('archived', 'completed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-old-conversations', '0 2 * * 0', 'SELECT cleanup_old_conversations();');
```

## 4. Environment Configuration

### 4.1 Cloudflare Worker Configuration

```toml
# /api/wrangler-chatbot.toml - Updated configuration
name = "it-era-chatbot"
main = "src/chatbot/api/chatbot-worker.js"
compatibility_date = "2024-01-23"

# KV Namespaces for conversation storage
[[kv_namespaces]]
binding = "CHAT_SESSIONS"
id = "988273308c524f4191ab95ed641dc05b"

[[kv_namespaces]]
binding = "SHARED_CONFIG"
id = "e8bd03a1105a46208000adfc1cc84487"

# Add new namespace for analytics
[[kv_namespaces]]
binding = "CONVERSATION_ANALYTICS"
id = "new-analytics-namespace-id"

[vars]
ENVIRONMENT = "production"
MAX_SESSION_DURATION = "86400"  # 24 hours in seconds
CONVERSATION_EXTENSION_MAX_HOURS = "168"  # 7 days max
ANALYTICS_RETENTION_DAYS = "90"

[env.development.vars]
ENVIRONMENT = "development"
MAX_SESSION_DURATION = "3600"  # 1 hour for dev
```

### 4.2 Environment Variables

```bash
# /api/.env.example - Updated environment configuration

# Core Configuration
ENVIRONMENT=production
NODE_ENV=production

# Conversation ID System
CONVERSATION_TTL_HOURS=24
CONVERSATION_MAX_EXTENSION_HOURS=168
CONVERSATION_CLEANUP_INTERVAL_HOURS=6

# Storage Configuration
KV_PREFIX=conv:
DATABASE_URL=postgresql://user:pass@host:5432/database
DATABASE_POOL_SIZE=10

# Monitoring
METRICS_ENABLED=true
ANALYTICS_RETENTION_DAYS=90
ALERT_WEBHOOK_URL=https://your-alerts-endpoint.com

# Security
CONVERSATION_ENCRYPTION_KEY=your-encryption-key-here
API_RATE_LIMIT_PER_MINUTE=60

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_DAYS=30
```

## 5. Testing Implementation

### 5.1 Unit Tests

```javascript
// /api/tests/conversation-id-system.test.js
import ConversationIDGenerator from '../src/utils/conversation-id-generator.js';
import ConversationStorageManager from '../src/storage/conversation-storage-manager.js';

describe('Conversation ID System', () => {
  describe('ConversationIDGenerator', () => {
    test('generates valid conversation IDs', () => {
      const id = ConversationIDGenerator.generate('P');
      
      expect(id).toHaveLength(32);
      expect(id).toMatch(/^ITERA_\d{8}_\d{6}_[A-Z0-9]{12}_P$/);
      expect(ConversationIDGenerator.validate(id)).toBe(true);
    });

    test('generates unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        const id = ConversationIDGenerator.generate('P');
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    });

    test('parses conversation IDs correctly', () => {
      const id = 'ITERA_20250125_143052_A7B9X2M8P4Q1_P';
      const parsed = ConversationIDGenerator.parse(id);
      
      expect(parsed.prefix).toBe('ITERA');
      expect(parsed.date).toBe('20250125');
      expect(parsed.time).toBe('143052');
      expect(parsed.random).toBe('A7B9X2M8P4Q1');
      expect(parsed.environment).toBe('P');
      expect(parsed.timestamp).toBeInstanceOf(Date);
    });

    test('rejects invalid formats', () => {
      const invalidIds = [
        'INVALID_FORMAT',
        'ITERA_20250125_143052_SHORT_P',
        'ITERA_20250125_143052_A7B9X2M8P4Q1_X',
        'ITERA_2025125_143052_A7B9X2M8P4Q1_P'
      ];

      invalidIds.forEach(id => {
        expect(ConversationIDGenerator.validate(id)).toBe(false);
        expect(() => ConversationIDGenerator.parse(id)).toThrow();
      });
    });
  });

  describe('ConversationStorageManager', () => {
    let storageManager;
    let mockKV;
    let mockDB;

    beforeEach(() => {
      mockKV = {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };

      mockDB = {
        query: jest.fn()
      };

      storageManager = new ConversationStorageManager(mockKV, mockDB, 'test');
    });

    test('creates new conversations', async () => {
      mockKV.put.mockResolvedValue();
      
      const conversation = await storageManager.createConversation({
        metadata: { source: 'test' }
      });

      expect(conversation.id).toMatch(/^ITERA_\d{8}_\d{6}_[A-Z0-9]{12}_[PSD]$/);
      expect(conversation.status).toBe('active');
      expect(conversation.metadata.source).toBe('test');
      expect(mockKV.put).toHaveBeenCalled();
    });

    test('retrieves conversations from KV', async () => {
      const testConversation = {
        id: 'ITERA_20250125_143052_A7B9X2M8P4Q1_P',
        status: 'active',
        created: new Date().toISOString()
      };

      mockKV.get.mockResolvedValue(JSON.stringify(testConversation));
      mockKV.put.mockResolvedValue(); // For TTL extension

      const result = await storageManager.getConversation(testConversation.id);

      expect(result.id).toBe(testConversation.id);
      expect(result.lastAccess).toBeDefined();
      expect(mockKV.put).toHaveBeenCalledTimes(1); // TTL extension
    });

    test('archives conversations properly', async () => {
      const testConversation = {
        id: 'ITERA_20250125_143052_A7B9X2M8P4Q1_P',
        status: 'active'
      };

      mockKV.get.mockResolvedValue(JSON.stringify(testConversation));
      mockKV.delete.mockResolvedValue();
      mockDB.query.mockResolvedValue({ rows: [] });

      const result = await storageManager.archiveConversation(
        testConversation.id, 
        'completed'
      );

      expect(result.status).toBe('archived');
      expect(result.archivedAt).toBeDefined();
      expect(result.archiveReason).toBe('completed');
      expect(mockKV.delete).toHaveBeenCalled();
      expect(mockDB.query).toHaveBeenCalled();
    });
  });
});
```

### 5.2 Integration Tests

```javascript
// /api/tests/conversation-api.integration.test.js
import request from 'supertest';
import app from '../src/app.js';

describe('Conversation API Integration', () => {
  let testConversationId;

  test('POST /api/v1/conversations creates new conversation', async () => {
    const response = await request(app)
      .post('/api/v1/conversations')
      .send({
        source: 'test',
        initialContext: { test: true }
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.conversationId).toMatch(/^ITERA_\d{8}_\d{6}_[A-Z0-9]{12}_[PSD]$/);
    
    testConversationId = response.body.conversationId;
  });

  test('GET /api/v1/conversations/:id retrieves conversation', async () => {
    const response = await request(app)
      .get(`/api/v1/conversations/${testConversationId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(testConversationId);
  });

  test('PUT /api/v1/conversations/:id/extend extends TTL', async () => {
    const response = await request(app)
      .put(`/api/v1/conversations/${testConversationId}/extend`)
      .send({
        extensionHours: 48,
        reason: 'complex_issue'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.extended).toBe(48);
  });

  test('DELETE /api/v1/conversations/:id archives conversation', async () => {
    const response = await request(app)
      .delete(`/api/v1/conversations/${testConversationId}`)
      .send({
        reason: 'test_completed',
        preserveData: true
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('archived');
  });
});
```

## 6. Deployment Checklist

### 6.1 Pre-Deployment

- [ ] Update Cloudflare KV namespaces
- [ ] Deploy database schema
- [ ] Update environment variables
- [ ] Run full test suite
- [ ] Update Cloudflare Worker configuration

### 6.2 Deployment Steps

```bash
# 1. Deploy database schema
psql -h your-db-host -U username -d database -f database/conversation-schema.sql

# 2. Update environment variables in Cloudflare Dashboard

# 3. Deploy Cloudflare Worker
wrangler publish --env production

# 4. Verify deployment
npm run test:integration

# 5. Monitor initial performance
curl https://api.it-era.it/health
```

### 6.3 Post-Deployment

- [ ] Monitor error rates and performance
- [ ] Verify conversation creation works
- [ ] Test conversation retrieval and updates
- [ ] Confirm archiving process functions
- [ ] Validate analytics collection

---

This implementation guide provides all the necessary code and procedures to implement the Conversation ID system architecture. The modular design ensures compatibility with the existing chatbot while providing enhanced functionality and scalability.