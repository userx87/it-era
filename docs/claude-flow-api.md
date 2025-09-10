# Claude Flow API Reference

## Base URL
```
/api/claude-flow
```

## Authentication
Currently, no authentication is required for local development. In production, implement appropriate authentication mechanisms.

## Response Format
All API responses follow this format:

```json
{
  "success": true|false,
  "data": {...},
  "error": "Error message if success is false",
  "timestamp": "2024-12-10T10:30:00.000Z"
}
```

## Rate Limiting
- General API: 100 requests per 15 minutes per IP
- Workflow execution: 10 requests per 5 minutes per IP

## Endpoints

### System Health

#### GET /health
Get system health status.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "claudeFlow": {
    "version": "1.0.0",
    "initialized": true,
    "uptime": 123456,
    "currentSession": null,
    "activeWorkflows": 0,
    "metrics": {
      "sessionsCreated": 5,
      "workflowsExecuted": 12,
      "memoryOperations": 45,
      "errors": 0
    }
  }
}
```

### Session Management

#### POST /sessions
Create a new session.

**Request Body:**
```json
{
  "name": "Session Name",
  "description": "Optional description",
  "metadata": {
    "key": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "name": "Session Name",
    "description": "Optional description",
    "status": "active",
    "startTime": "2024-12-10T10:30:00.000Z",
    "endTime": null,
    "metadata": {},
    "workflows": [],
    "memory": {
      "namespace": "session:uuid",
      "keys": []
    },
    "stats": {
      "workflowsExecuted": 0,
      "memoryOperations": 0,
      "checkpointsCreated": 0,
      "errors": 0
    }
  }
}
```

#### GET /sessions
List all sessions.

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `ended`)
- `limit` (optional): Limit number of results (default: 50)

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "uuid",
      "name": "Session Name",
      "status": "active",
      "startTime": "2024-12-10T10:30:00.000Z",
      "endTime": null,
      "workflowsCount": 2
    }
  ]
}
```

#### GET /sessions/{sessionId}
Get specific session details.

**Path Parameters:**
- `sessionId`: UUID of the session

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "name": "Session Name",
    "status": "active",
    "startTime": "2024-12-10T10:30:00.000Z",
    "workflows": [],
    "checkpoints": [],
    "memory": {
      "namespace": "session:uuid",
      "keys": []
    }
  }
}
```

#### DELETE /sessions/{sessionId}
End a session.

**Path Parameters:**
- `sessionId`: UUID of the session

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "status": "ended",
    "endTime": "2024-12-10T11:30:00.000Z",
    "duration": 3600000
  }
}
```

### Workflow Management

#### GET /workflows
List available workflow definitions.

**Response:**
```json
{
  "success": true,
  "workflows": [
    "code_analysis",
    "performance_optimization",
    "run_tests",
    "deploy"
  ]
}
```

#### POST /workflows/execute
Execute a workflow.

**Request Body:**
```json
{
  "workflowName": "code_analysis",
  "sessionId": "optional-uuid",
  "options": {
    "target": "all",
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "workflow": {
    "id": "uuid",
    "name": "code_analysis",
    "status": "running",
    "sessionId": "uuid",
    "startTime": "2024-12-10T10:30:00.000Z",
    "progress": 0
  }
}
```

#### GET /workflows/{workflowId}
Get workflow status and details.

**Path Parameters:**
- `workflowId`: UUID of the workflow

**Response:**
```json
{
  "success": true,
  "workflow": {
    "id": "uuid",
    "name": "code_analysis",
    "status": "completed",
    "sessionId": "uuid",
    "startTime": "2024-12-10T10:30:00.000Z",
    "endTime": "2024-12-10T10:35:00.000Z",
    "progress": 100,
    "steps": [
      {
        "name": "Scan Files",
        "type": "file_operation",
        "success": true,
        "result": {...}
      }
    ],
    "result": {
      "summary": "Analysis completed successfully",
      "details": {...}
    }
  }
}
```

### Memory Management

#### POST /memory
Store data in memory.

**Request Body:**
```json
{
  "key": "memory-key",
  "data": {
    "any": "data structure",
    "numbers": 42,
    "arrays": [1, 2, 3]
  },
  "namespace": "optional-namespace"
}
```

**Response:**
```json
{
  "success": true,
  "id": "uuid",
  "key": "memory-key",
  "namespace": "optional-namespace"
}
```

#### GET /memory/{namespace}/{key}
Retrieve data from memory.

**Path Parameters:**
- `namespace`: Memory namespace
- `key`: Memory key

**Response:**
```json
{
  "success": true,
  "key": "memory-key",
  "namespace": "namespace",
  "data": {
    "stored": "data"
  }
}
```

#### GET /memory/search
Search memory.

**Query Parameters:**
- `q`: Search query (required)
- `namespace`: Filter by namespace (optional)
- `limit`: Limit results (optional, default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "query": "search term",
  "results": [
    {
      "key": "memory-key",
      "namespace": "namespace",
      "timestamp": "2024-12-10T10:30:00.000Z",
      "size": 1024,
      "data": {...}
    }
  ]
}
```

#### DELETE /memory/{namespace}/{key}
Delete data from memory.

**Path Parameters:**
- `namespace`: Memory namespace
- `key`: Memory key

**Response:**
```json
{
  "success": true,
  "deleted": true
}
```

### AI Integration

#### POST /ai-task
Execute AI task through hybrid integration.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Analyze this code for issues"
    }
  ],
  "options": {
    "model": "claude-3-sonnet",
    "temperature": 0.7
  },
  "provider": "claude-flow"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "provider": "claude-flow",
    "response": "AI generated response",
    "confidence": 0.95,
    "tokens_used": 150
  }
}
```

### Analytics

#### GET /analytics
Get comprehensive system analytics.

**Response:**
```json
{
  "success": true,
  "analytics": {
    "engine": {
      "version": "1.0.0",
      "uptime": 123456,
      "metrics": {
        "sessionsCreated": 10,
        "workflowsExecuted": 25,
        "memoryOperations": 100,
        "errors": 2
      }
    },
    "memory": {
      "operations": 100,
      "hitRate": "85.5%",
      "memorySize": 50,
      "namespaces": 5
    },
    "integration": {
      "initialized": true,
      "auggieAvailable": true,
      "hybridMode": true,
      "currentProvider": "claude-flow",
      "stats": {
        "claudeFlowCalls": 15,
        "auggieCalls": 8,
        "hybridCalls": 23,
        "fallbacks": 2
      }
    }
  }
}
```

## Error Codes

### 400 Bad Request
- Invalid request format
- Missing required parameters
- Validation errors

### 404 Not Found
- Session not found
- Workflow not found
- Memory key not found

### 429 Too Many Requests
- Rate limit exceeded

### 500 Internal Server Error
- System initialization failed
- Workflow execution failed
- Memory operation failed

## Error Response Format
```json
{
  "success": false,
  "error": "Error description",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ],
  "timestamp": "2024-12-10T10:30:00.000Z"
}
```

## WebSocket Events (Future)
Real-time updates for workflow progress and system events.

```javascript
const ws = new WebSocket('ws://localhost:3000/api/claude-flow/ws');

ws.on('workflow_progress', (data) => {
  console.log(`Workflow ${data.workflowId} progress: ${data.progress}%`);
});

ws.on('session_created', (data) => {
  console.log(`New session created: ${data.sessionId}`);
});
```

## SDK Examples

### JavaScript/Node.js
```javascript
const ClaudeFlowClient = require('./claude-flow-client');

const client = new ClaudeFlowClient('http://localhost:3000');

// Create session
const session = await client.sessions.create({
  name: 'My Session'
});

// Execute workflow
const workflow = await client.workflows.execute('code_analysis', {
  sessionId: session.id
});

// Store memory
await client.memory.store('results', { data: 'value' }, 'analysis');
```

### Python
```python
import requests

class ClaudeFlowClient:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def create_session(self, name, description=None):
        response = requests.post(f"{self.base_url}/api/claude-flow/sessions", 
                               json={"name": name, "description": description})
        return response.json()
    
    def execute_workflow(self, workflow_name, session_id=None):
        response = requests.post(f"{self.base_url}/api/claude-flow/workflows/execute",
                               json={"workflowName": workflow_name, "sessionId": session_id})
        return response.json()

# Usage
client = ClaudeFlowClient("http://localhost:3000")
session = client.create_session("Python Session")
workflow = client.execute_workflow("code_analysis", session["session"]["id"])
```

## Rate Limiting Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702198800
```

## Versioning
API version is included in response headers:
```
X-API-Version: 1.0.0
```

Future versions will be accessible via:
```
/api/claude-flow/v2/...
```
