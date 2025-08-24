/**
 * MCP Integration Layer for IT-ERA
 * Manages external service connections through Model Context Protocol
 */

import { EventEmitter } from 'events';

export interface MCPConfig {
  serverName: string;
  command: string;
  args: string[];
  type: 'stdio' | 'websocket';
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface MCPRequest {
  server: string;
  tool: string;
  arguments: Record<string, any>;
  requestId?: string;
}

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
}

export interface MCPResource {
  name: string;
  uri: string;
  description: string;
  mimeType: string;
  server: string;
}

/**
 * Circuit Breaker implementation for fault tolerance
 */
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - (this.lastFailureTime || 0) > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }
}

/**
 * Request Batcher for optimizing API calls
 */
class RequestBatcher {
  private queue: MCPRequest[] = [];
  private timer: NodeJS.Timeout | null = null;
  
  constructor(
    private batchSize: number = 10,
    private batchDelay: number = 100,
    private processBatch: (requests: MCPRequest[]) => Promise<MCPResponse[]>
  ) {}

  async add(request: MCPRequest): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        ...request,
        requestId: request.requestId || this.generateRequestId()
      });

      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    try {
      await this.processBatch(batch);
    } catch (error) {
      console.error('Batch processing failed:', error);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Main MCP Integration Manager
 */
export class MCPIntegrationManager extends EventEmitter {
  private servers: Map<string, MCPConfig> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private requestBatchers: Map<string, RequestBatcher> = new Map();
  private authTokens: Map<string, string> = new Map();
  private resourceCache: Map<string, MCPResource[]> = new Map();

  constructor() {
    super();
    this.loadConfiguration();
  }

  /**
   * Load MCP configuration from project settings
   */
  private loadConfiguration(): void {
    try {
      const config = require('../../../.mcp.json');
      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        this.registerServer(name, serverConfig as MCPConfig);
      }
    } catch (error) {
      console.error('Failed to load MCP configuration:', error);
    }
  }

  /**
   * Register a new MCP server
   */
  registerServer(name: string, config: MCPConfig): void {
    this.servers.set(name, config);
    this.circuitBreakers.set(name, new CircuitBreaker());
    
    const batcher = new RequestBatcher(
      10,
      100,
      (requests) => this.processBatch(name, requests)
    );
    this.requestBatchers.set(name, batcher);
    
    this.emit('server:registered', { name, config });
  }

  /**
   * Set authentication token for a server
   */
  setAuthentication(server: string, token: string): void {
    this.authTokens.set(server, token);
    this.emit('auth:updated', { server });
  }

  /**
   * Execute a tool on an MCP server
   */
  async executeTool(request: MCPRequest): Promise<MCPResponse> {
    const breaker = this.circuitBreakers.get(request.server);
    if (!breaker) {
      throw new Error(`Server ${request.server} not registered`);
    }

    return breaker.execute(async () => {
      const batcher = this.requestBatchers.get(request.server);
      if (batcher && this.shouldBatch(request)) {
        return batcher.add(request);
      }
      
      return this.executeDirectRequest(request);
    });
  }

  /**
   * Check if a request should be batched
   */
  private shouldBatch(request: MCPRequest): boolean {
    const batchableTools = ['memory_usage', 'agent_list', 'task_status'];
    return batchableTools.includes(request.tool);
  }

  /**
   * Execute a direct request without batching
   */
  private async executeDirectRequest(request: MCPRequest): Promise<MCPResponse> {
    const startTime = Date.now();
    
    try {
      const server = this.servers.get(request.server);
      if (!server) {
        throw new Error(`Server ${request.server} not found`);
      }

      const authToken = this.authTokens.get(request.server);
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      const response = await this.sendRequest(server, request.tool, {
        ...request.arguments,
        headers
      });

      const duration = Date.now() - startTime;
      this.emit('request:completed', {
        server: request.server,
        tool: request.tool,
        duration
      });

      return {
        success: true,
        data: response,
        requestId: request.requestId
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.emit('request:failed', {
        server: request.server,
        tool: request.tool,
        duration,
        error
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: request.requestId
      };
    }
  }

  /**
   * Process a batch of requests
   */
  private async processBatch(server: string, requests: MCPRequest[]): Promise<MCPResponse[]> {
    const responses: MCPResponse[] = [];
    
    for (const request of requests) {
      const response = await this.executeDirectRequest(request);
      responses.push(response);
    }
    
    return responses;
  }

  /**
   * Send request to MCP server (implementation depends on server type)
   */
  private async sendRequest(
    server: MCPConfig,
    tool: string,
    args: Record<string, any>
  ): Promise<any> {
    if (server.type === 'stdio') {
      return this.sendStdioRequest(server, tool, args);
    } else if (server.type === 'websocket') {
      return this.sendWebSocketRequest(server, tool, args);
    }
    
    throw new Error(`Unsupported server type: ${server.type}`);
  }

  /**
   * Send request via stdio
   */
  private async sendStdioRequest(
    server: MCPConfig,
    tool: string,
    args: Record<string, any>
  ): Promise<any> {
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn(server.command, [...server.args, tool], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      process.stdin.write(JSON.stringify(args));
      process.stdin.end();

      let output = '';
      let error = '';

      process.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      process.stderr.on('data', (data: Buffer) => {
        error += data.toString();
      });

      process.on('close', (code: number) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            resolve(output);
          }
        } else {
          reject(new Error(error || `Process exited with code ${code}`));
        }
      });

      if (server.timeout) {
        setTimeout(() => {
          process.kill();
          reject(new Error('Request timeout'));
        }, server.timeout);
      }
    });
  }

  /**
   * Send request via WebSocket
   */
  private async sendWebSocketRequest(
    server: MCPConfig,
    tool: string,
    args: Record<string, any>
  ): Promise<any> {
    throw new Error('WebSocket support not yet implemented');
  }

  /**
   * List available resources from all servers
   */
  async listResources(serverName?: string): Promise<MCPResource[]> {
    const cacheKey = serverName || 'all';
    
    if (this.resourceCache.has(cacheKey)) {
      return this.resourceCache.get(cacheKey)!;
    }

    const resources: MCPResource[] = [];
    const servers = serverName 
      ? [serverName] 
      : Array.from(this.servers.keys());

    for (const server of servers) {
      try {
        const response = await this.executeTool({
          server,
          tool: 'list_resources',
          arguments: {}
        });

        if (response.success && Array.isArray(response.data)) {
          resources.push(...response.data);
        }
      } catch (error) {
        console.error(`Failed to list resources from ${server}:`, error);
      }
    }

    this.resourceCache.set(cacheKey, resources);
    
    setTimeout(() => {
      this.resourceCache.delete(cacheKey);
    }, 300000);

    return resources;
  }

  /**
   * Access a specific resource
   */
  async accessResource(server: string, uri: string): Promise<any> {
    return this.executeTool({
      server,
      tool: 'access_resource',
      arguments: { uri }
    });
  }

  /**
   * Transform data between different formats
   */
  transformData(data: any, fromFormat: string, toFormat: string): any {
    const transformers: Record<string, Record<string, (data: any) => any>> = {
      json: {
        xml: (data) => this.jsonToXml(data),
        csv: (data) => this.jsonToCsv(data),
        yaml: (data) => this.jsonToYaml(data)
      },
      xml: {
        json: (data) => this.xmlToJson(data)
      },
      csv: {
        json: (data) => this.csvToJson(data)
      },
      yaml: {
        json: (data) => this.yamlToJson(data)
      }
    };

    const transformer = transformers[fromFormat]?.[toFormat];
    if (!transformer) {
      throw new Error(`Transformation from ${fromFormat} to ${toFormat} not supported`);
    }

    return transformer(data);
  }

  private jsonToXml(data: any): string {
    const convert = (obj: any, rootName = 'root'): string => {
      if (typeof obj !== 'object') return String(obj);
      
      let xml = `<${rootName}>`;
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            xml += convert(item, key);
          });
        } else if (typeof value === 'object') {
          xml += convert(value, key);
        } else {
          xml += `<${key}>${value}</${key}>`;
        }
      }
      xml += `</${rootName}>`;
      
      return xml;
    };
    
    return convert(data);
  }

  private jsonToCsv(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => 
      headers.map(header => JSON.stringify(obj[header] ?? '')).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }

  private jsonToYaml(data: any): string {
    const convert = (obj: any, indent = 0): string => {
      const spaces = ' '.repeat(indent);
      
      if (typeof obj !== 'object' || obj === null) {
        return `${spaces}${obj}`;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => `${spaces}- ${convert(item, 0)}`).join('\n');
      }
      
      return Object.entries(obj)
        .map(([key, value]) => {
          if (typeof value === 'object') {
            return `${spaces}${key}:\n${convert(value, indent + 2)}`;
          }
          return `${spaces}${key}: ${value}`;
        })
        .join('\n');
    };
    
    return convert(data);
  }

  private xmlToJson(xml: string): any {
    return {};
  }

  private csvToJson(csv: string): any[] {
    const lines = csv.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {} as any);
    });
  }

  private yamlToJson(yaml: string): any {
    return {};
  }

  /**
   * Get server status
   */
  getServerStatus(serverName: string): {
    registered: boolean;
    circuitBreakerState?: string;
    authenticated: boolean;
  } {
    const registered = this.servers.has(serverName);
    const breaker = this.circuitBreakers.get(serverName);
    const authenticated = this.authTokens.has(serverName);
    
    return {
      registered,
      circuitBreakerState: breaker ? 'CLOSED' : undefined,
      authenticated
    };
  }

  /**
   * Reset circuit breaker for a server
   */
  resetCircuitBreaker(serverName: string): void {
    const breaker = this.circuitBreakers.get(serverName);
    if (breaker) {
      breaker.reset();
      this.emit('circuit:reset', { server: serverName });
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): Record<string, any> {
    return {
      servers: Array.from(this.servers.keys()),
      totalServers: this.servers.size,
      authenticatedServers: this.authTokens.size,
      cachedResources: this.resourceCache.size
    };
  }
}

export default new MCPIntegrationManager();