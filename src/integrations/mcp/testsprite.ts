/**
 * TestSprite MCP Integration Module
 * Provides test automation and management capabilities through TestSprite API
 */

import { MCPIntegrationManager } from './index';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.mcp') });

export interface TestSpriteConfig {
  apiKey: string;
  apiUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface TestCase {
  id?: string;
  name: string;
  description: string;
  steps: string[];
  expectedResult: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'draft' | 'ready' | 'in_progress' | 'completed';
}

export interface TestSuite {
  id?: string;
  name: string;
  description: string;
  testCases: TestCase[];
  tags?: string[];
}

export interface TestRun {
  id?: string;
  suiteId: string;
  environment: string;
  startTime?: Date;
  endTime?: Date;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  results?: TestResult[];
}

export interface TestResult {
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped' | 'blocked';
  executionTime?: number;
  errorMessage?: string;
  stackTrace?: string;
  screenshots?: string[];
}

/**
 * TestSprite MCP Client
 * Manages test automation through TestSprite's MCP interface
 */
export class TestSpriteMCPClient {
  private config: TestSpriteConfig;
  private manager: typeof MCPIntegrationManager;
  private serverName = 'testsprite';

  constructor(config?: Partial<TestSpriteConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.TESTSPRITE_API_KEY || '',
      apiUrl: config?.apiUrl || process.env.TESTSPRITE_API_URL || 'https://api.testsprite.com',
      timeout: config?.timeout || parseInt(process.env.TESTSPRITE_TIMEOUT || '30000'),
      retryAttempts: config?.retryAttempts || parseInt(process.env.TESTSPRITE_RETRY_ATTEMPTS || '3'),
      retryDelay: config?.retryDelay || parseInt(process.env.TESTSPRITE_RETRY_DELAY || '1000')
    };

    if (!this.config.apiKey) {
      throw new Error('TestSprite API key is required');
    }

    this.manager = MCPIntegrationManager;
    this.initialize();
  }

  /**
   * Initialize the TestSprite MCP connection
   */
  private initialize(): void {
    // Set authentication for TestSprite server
    this.manager.setAuthentication(this.serverName, this.config.apiKey);

    // Register custom TestSprite configuration if not already registered
    if (!this.manager.getServerStatus(this.serverName).registered) {
      this.manager.registerServer(this.serverName, {
        serverName: this.serverName,
        command: 'npx',
        args: ['@testsprite/testsprite-mcp'],
        type: 'stdio',
        timeout: this.config.timeout,
        retryAttempts: this.config.retryAttempts,
        retryDelay: this.config.retryDelay
      });
    }
  }

  /**
   * Create a new test case
   */
  async createTestCase(testCase: TestCase): Promise<TestCase> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'create_test_case',
      arguments: {
        name: testCase.name,
        description: testCase.description,
        steps: testCase.steps,
        expectedResult: testCase.expectedResult,
        tags: testCase.tags || [],
        priority: testCase.priority || 'medium',
        status: testCase.status || 'draft'
      }
    });

    if (!response.success) {
      throw new Error(`Failed to create test case: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Update an existing test case
   */
  async updateTestCase(id: string, updates: Partial<TestCase>): Promise<TestCase> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'update_test_case',
      arguments: {
        id,
        ...updates
      }
    });

    if (!response.success) {
      throw new Error(`Failed to update test case: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Get test case by ID
   */
  async getTestCase(id: string): Promise<TestCase> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'get_test_case',
      arguments: { id }
    });

    if (!response.success) {
      throw new Error(`Failed to get test case: ${response.error}`);
    }

    return response.data;
  }

  /**
   * List all test cases
   */
  async listTestCases(filters?: {
    tags?: string[];
    priority?: string;
    status?: string;
  }): Promise<TestCase[]> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'list_test_cases',
      arguments: filters || {}
    });

    if (!response.success) {
      throw new Error(`Failed to list test cases: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Create a new test suite
   */
  async createTestSuite(suite: TestSuite): Promise<TestSuite> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'create_test_suite',
      arguments: {
        name: suite.name,
        description: suite.description,
        testCaseIds: suite.testCases.map(tc => tc.id).filter(Boolean),
        tags: suite.tags || []
      }
    });

    if (!response.success) {
      throw new Error(`Failed to create test suite: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Execute a test suite
   */
  async executeTestSuite(
    suiteId: string,
    environment: string,
    options?: {
      parallel?: boolean;
      maxWorkers?: number;
      continueOnFailure?: boolean;
    }
  ): Promise<TestRun> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'execute_test_suite',
      arguments: {
        suiteId,
        environment,
        parallel: options?.parallel || false,
        maxWorkers: options?.maxWorkers || 1,
        continueOnFailure: options?.continueOnFailure || true
      }
    });

    if (!response.success) {
      throw new Error(`Failed to execute test suite: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Get test run results
   */
  async getTestRunResults(runId: string): Promise<TestRun> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'get_test_run',
      arguments: { runId }
    });

    if (!response.success) {
      throw new Error(`Failed to get test run results: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Generate test report
   */
  async generateTestReport(
    runId: string,
    format: 'html' | 'pdf' | 'json' | 'junit'
  ): Promise<string> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'generate_report',
      arguments: {
        runId,
        format
      }
    });

    if (!response.success) {
      throw new Error(`Failed to generate test report: ${response.error}`);
    }

    return response.data.reportUrl || response.data;
  }

  /**
   * Upload screenshot for a test result
   */
  async uploadScreenshot(
    testResultId: string,
    screenshot: Buffer | string,
    filename: string
  ): Promise<string> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'upload_screenshot',
      arguments: {
        testResultId,
        screenshot: screenshot instanceof Buffer ? screenshot.toString('base64') : screenshot,
        filename
      }
    });

    if (!response.success) {
      throw new Error(`Failed to upload screenshot: ${response.error}`);
    }

    return response.data.url;
  }

  /**
   * Create automated test from recording
   */
  async createTestFromRecording(recording: {
    url: string;
    actions: Array<{
      type: 'click' | 'type' | 'navigate' | 'wait' | 'assert';
      selector?: string;
      value?: string;
      timeout?: number;
    }>;
  }): Promise<TestCase> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'create_test_from_recording',
      arguments: recording
    });

    if (!response.success) {
      throw new Error(`Failed to create test from recording: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Run visual regression test
   */
  async runVisualTest(
    testCaseId: string,
    baselineId?: string
  ): Promise<{
    passed: boolean;
    differences?: Array<{
      selector: string;
      diffPercentage: number;
      screenshot: string;
    }>;
  }> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'run_visual_test',
      arguments: {
        testCaseId,
        baselineId
      }
    });

    if (!response.success) {
      throw new Error(`Failed to run visual test: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Schedule test execution
   */
  async scheduleTestExecution(
    suiteId: string,
    schedule: {
      cron?: string;
      date?: Date;
      recurring?: boolean;
    }
  ): Promise<{ scheduleId: string }> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'schedule_test',
      arguments: {
        suiteId,
        ...schedule
      }
    });

    if (!response.success) {
      throw new Error(`Failed to schedule test execution: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Get test metrics and analytics
   */
  async getTestMetrics(
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    totalTests: number;
    passRate: number;
    failRate: number;
    averageExecutionTime: number;
    topFailingTests: TestCase[];
    trendsData: Array<{
      date: string;
      passed: number;
      failed: number;
      skipped: number;
    }>;
  }> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'get_metrics',
      arguments: {
        startDate: timeRange?.start?.toISOString(),
        endDate: timeRange?.end?.toISOString()
      }
    });

    if (!response.success) {
      throw new Error(`Failed to get test metrics: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Export test cases to various formats
   */
  async exportTestCases(
    testCaseIds: string[],
    format: 'csv' | 'json' | 'excel' | 'gherkin'
  ): Promise<string> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'export_test_cases',
      arguments: {
        testCaseIds,
        format
      }
    });

    if (!response.success) {
      throw new Error(`Failed to export test cases: ${response.error}`);
    }

    return response.data.downloadUrl || response.data;
  }

  /**
   * Import test cases from file
   */
  async importTestCases(
    fileContent: string,
    format: 'csv' | 'json' | 'excel' | 'gherkin'
  ): Promise<{ imported: number; failed: number; errors?: string[] }> {
    const response = await this.manager.executeTool({
      server: this.serverName,
      tool: 'import_test_cases',
      arguments: {
        content: fileContent,
        format
      }
    });

    if (!response.success) {
      throw new Error(`Failed to import test cases: ${response.error}`);
    }

    return response.data;
  }
}

// Export singleton instance
export const testSpriteClient = new TestSpriteMCPClient();

// Export default
export default testSpriteClient;