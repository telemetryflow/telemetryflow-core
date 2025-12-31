module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.property\\.spec\\.ts$',
  testPathIgnorePatterns: [
    '.*\\.e2e\\.spec\\.ts$', // Skip E2E tests by default
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
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  moduleNameMapper: {
    '^uuid$': '<rootDir>/shared/__mocks__/uuid.js',
  },
};