/**
 * Jest Setup Configuration
 * Global setup for all tests
 */

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in test environment
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    // Suppress debug logs in tests
    debug: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Setup global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  createMockSession: () => ({
    id: 'test-session-id',
    name: 'Test Session',
    status: 'active',
    startTime: new Date().toISOString(),
    endTime: null,
    workflows: [],
    memory: {
      namespace: 'session:test-session-id',
      keys: new Set()
    },
    stats: {
      workflowsExecuted: 0,
      memoryOperations: 0,
      checkpointsCreated: 0,
      errors: 0
    }
  }),
  
  createMockWorkflow: () => ({
    id: 'test-workflow-id',
    name: 'test_workflow',
    status: 'running',
    startTime: new Date().toISOString(),
    endTime: null,
    steps: [],
    progress: 0,
    result: null,
    error: null
  })
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});
