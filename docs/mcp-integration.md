# MCP Integration Documentation for IT-ERA

## Overview

This document describes the Model Context Protocol (MCP) integration for IT-ERA, enabling seamless connection with external services and automated testing through TestSprite.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   IT-ERA Application            │
├─────────────────────────────────────────────────┤
│           MCP Integration Manager               │
├────────────┬────────────┬────────────┬─────────┤
│ Claude Flow│ Ruv Swarm  │ TestSprite │ Future  │
│    MCP     │    MCP     │    MCP     │  MCPs   │
└────────────┴────────────┴────────────┴─────────┘
```

## Configured MCP Servers

### 1. Claude Flow
- **Purpose**: AI agent orchestration and swarm coordination
- **Command**: `npx claude-flow@alpha mcp start`
- **Type**: stdio
- **Features**:
  - Swarm initialization and management
  - Agent spawning and coordination
  - Task orchestration
  - Memory management
  - Neural training

### 2. Ruv Swarm
- **Purpose**: Distributed agent coordination without timeouts
- **Command**: `npx ruv-swarm@latest mcp start`
- **Type**: stdio
- **Features**:
  - Mesh topology management
  - Agent metrics and monitoring
  - Benchmark execution
  - DAA (Decentralized Autonomous Agents)

### 3. TestSprite
- **Purpose**: Automated testing and quality assurance
- **Command**: `npx @testsprite/testsprite-mcp`
- **Type**: stdio
- **Authentication**: API Key (stored in .env.mcp)
- **Features**:
  - Test case management
  - Test suite execution
  - Visual regression testing
  - Test scheduling
  - Performance metrics

## Installation

1. **Install dependencies**:
```bash
npm install @testsprite/testsprite-mcp --save
npm install dotenv --save
```

2. **Configure MCP servers** in `.mcp.json`:
```json
{
  "mcpServers": {
    "testsprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp"],
      "type": "stdio",
      "env": {
        "TESTSPRITE_API_KEY": "your-api-key"
      }
    }
  }
}
```

3. **Set environment variables** in `.env.mcp`:
```env
TESTSPRITE_API_KEY=your-api-key-here
TESTSPRITE_API_URL=https://api.testsprite.com
TESTSPRITE_TIMEOUT=30000
```

## Core Components

### MCPIntegrationManager

The central manager for all MCP connections:

```typescript
import MCPIntegrationManager from './src/integrations/mcp';

// Register a new server
MCPIntegrationManager.registerServer('custom-mcp', {
  serverName: 'custom-mcp',
  command: 'npx',
  args: ['custom-mcp-server'],
  type: 'stdio'
});

// Execute a tool
const response = await MCPIntegrationManager.executeTool({
  server: 'testsprite',
  tool: 'create_test_case',
  arguments: { /* ... */ }
});
```

### Key Features

1. **Circuit Breaker Pattern**: Automatic fault tolerance
2. **Request Batching**: Optimized API calls
3. **Authentication Management**: Secure token handling
4. **Data Transformation**: Convert between formats
5. **Resource Caching**: Performance optimization

## TestSprite Integration

### Creating Test Cases

```typescript
import { testSpriteClient } from './src/integrations/mcp/testsprite';

const testCase = await testSpriteClient.createTestCase({
  name: 'Verify Landing Page',
  description: 'Test landing page functionality',
  steps: [
    'Navigate to page',
    'Verify elements',
    'Submit form'
  ],
  expectedResult: 'Page works correctly',
  priority: 'high'
});
```

### Executing Test Suites

```typescript
const testRun = await testSpriteClient.executeTestSuite(
  suiteId,
  'production',
  {
    parallel: true,
    maxWorkers: 3,
    continueOnFailure: true
  }
);
```

### Visual Regression Testing

```typescript
const visualResult = await testSpriteClient.runVisualTest(
  testCaseId,
  baselineId
);

if (!visualResult.passed) {
  console.log('Visual differences detected:', visualResult.differences);
}
```

## Usage Examples

### 1. Test Landing Pages

```typescript
import { testLandingPages } from './src/integrations/mcp/examples/testsprite-usage';

// Run comprehensive landing page tests
const results = await testLandingPages();
console.log('Test Report:', results.reportUrl);
```

### 2. Schedule Recurring Tests

```typescript
// Schedule daily regression tests
await testSpriteClient.scheduleTestExecution(suiteId, {
  cron: '0 2 * * *', // 2 AM daily
  recurring: true
});
```

### 3. Import/Export Tests

```typescript
// Export tests to JSON
const exportUrl = await testSpriteClient.exportTestCases(
  testCaseIds,
  'json'
);

// Import from Gherkin
const imported = await testSpriteClient.importTestCases(
  gherkinContent,
  'gherkin'
);
```

## Error Handling

The integration includes comprehensive error handling:

1. **Circuit Breaker**: Prevents cascading failures
2. **Retry Logic**: Automatic retry with exponential backoff
3. **Timeout Protection**: Configurable timeouts for all operations
4. **Graceful Degradation**: Fallback mechanisms for service unavailability

## Security Considerations

1. **API Keys**: Store in `.env.mcp` (never commit)
2. **Authentication**: Per-server token management
3. **Input Validation**: All inputs validated before sending
4. **Secure Communication**: HTTPS for all API calls
5. **Rate Limiting**: Built-in request throttling

## Performance Optimization

1. **Request Batching**: Combine multiple requests
2. **Resource Caching**: 5-minute cache for resources
3. **Parallel Execution**: Multi-threaded test execution
4. **Connection Pooling**: Reuse connections when possible

## Monitoring and Metrics

### Get MCP Metrics

```typescript
const metrics = MCPIntegrationManager.getMetrics();
console.log('Active Servers:', metrics.servers);
console.log('Authenticated:', metrics.authenticatedServers);
```

### Test Metrics

```typescript
const testMetrics = await testSpriteClient.getTestMetrics();
console.log('Pass Rate:', testMetrics.passRate + '%');
console.log('Avg Execution:', testMetrics.averageExecutionTime + 'ms');
```

## Troubleshooting

### Common Issues

1. **Connection Failed**:
   - Check if MCP server is installed
   - Verify command and args in .mcp.json
   - Check network connectivity

2. **Authentication Error**:
   - Verify API key in .env.mcp
   - Check token expiration
   - Ensure proper permissions

3. **Timeout Issues**:
   - Increase timeout in configuration
   - Check server response time
   - Verify network latency

### Debug Mode

Enable debug logging:

```typescript
MCPIntegrationManager.on('request:completed', (data) => {
  console.log('Request completed:', data);
});

MCPIntegrationManager.on('request:failed', (data) => {
  console.error('Request failed:', data);
});
```

## Best Practices

1. **Always use environment variables** for sensitive data
2. **Implement proper error handling** for all MCP calls
3. **Use batching** for multiple similar requests
4. **Monitor circuit breaker** status regularly
5. **Cache resources** when appropriate
6. **Document all custom MCP tools**
7. **Test integration** thoroughly before production

## Future Enhancements

1. **WebSocket Support**: Real-time communication
2. **GraphQL Integration**: Advanced querying
3. **Custom Transformers**: Extensible data transformation
4. **Distributed Tracing**: End-to-end monitoring
5. **Auto-discovery**: Automatic MCP server detection

## Support

For issues or questions:
- GitHub Issues: [IT-ERA Repository]
- TestSprite Documentation: https://docs.testsprite.com
- Claude Flow Documentation: https://github.com/ruvnet/claude-flow
- Ruv Swarm Documentation: https://github.com/ruvnet/ruv-swarm

## License

This integration is part of the IT-ERA project and follows the project's licensing terms.