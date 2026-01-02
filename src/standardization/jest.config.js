module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 15000, // Increased timeout for complex tests
  // Memory management
  maxWorkers: 1,
  workerIdleMemoryLimit: '256MB', // Reduced memory limit
  // Increase heap size for Node.js
  setupFilesAfterEnv: [],
  // Reduce memory usage
  clearMocks: true,
  restoreMocks: true,
  // Force garbage collection
  forceExit: true,
  // Detect open handles
  detectOpenHandles: true,
  // Specific timeout for problematic tests
  testPathIgnorePatterns: [],
  // Add memory cleanup
  globalTeardown: undefined
};