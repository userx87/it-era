/**
 * Jest Configuration for IT-ERA Test Suite
 * Comprehensive testing setup for AI components, chatbot, and integrations
 */

export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Module paths
  roots: ['<rootDir>/tests', '<rootDir>/lib', '<rootDir>/api'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
    '<rootDir>/web/js/**/*.test.js'
  ],

  // Environment overrides for specific test patterns
  projects: [
    {
      displayName: 'claude-flow',
      testMatch: ['<rootDir>/tests/claude-flow/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'web',
      testMatch: ['<rootDir>/tests/**/*.test.js', '!<rootDir>/tests/claude-flow/**/*.test.js'],
      testEnvironment: 'jsdom'
    }
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js'
  ],
  
  // Module name mapping for imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/web/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Specific thresholds for Claude Flow components
    './lib/claude-flow/ClaudeFlowEngine.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './lib/claude-flow/MemorySystem.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'lib/**/*.js',
    'api/**/*.js',
    '!**/*.test.js',
    '!**/*.spec.js',
    '!node_modules/**',
    '!tests/**'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Global variables available in tests
  globals: {
    'window': {},
    'document': {},
    'navigator': {},
    'location': {}
  },
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'https://it-era.it',
    userAgent: 'IT-ERA Test Suite'
  },
  
  // Reporter configuration
  reporters: ['default'],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/coverage/',
    '<rootDir>/tests/reports/'
  ]
};
