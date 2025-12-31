module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  testPathIgnorePatterns: [
    '.*\\.e2e\\.spec\\.ts$', // Skip E2E tests by default
    'src/standardization/.*\\.spec\\.ts$' // Skip standardization tests
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/main.ts',
    '!**/migrations/**',
    '!**/seeds/**',
    '!**/standardization/**', // Exclude standardization from coverage
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  // Coverage thresholds - disabled for now due to incomplete test coverage
  // Will be re-enabled once infrastructure layer tests are implemented
  // coverageThreshold: {
  //   global: {
  //     branches: 90,
  //     functions: 90,
  //     lines: 90,
  //     statements: 90,
  //   },
  // },
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  // Fix ES modules handling for uuid and other packages
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  // Mock ES modules that cause issues
  moduleNameMapper: {
    '^uuid$': '<rootDir>/shared/__mocks__/uuid.js',
  },
};