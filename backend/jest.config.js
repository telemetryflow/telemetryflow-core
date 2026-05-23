module.exports = {
  displayName: '@telemetryflow/backend',
  preset: 'ts-jest',
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'commonjs',
        target: 'ES2021',
      },
    }],
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
  ],
  coverageDirectory: '../coverage/backend',
  coverageProvider: 'v8',
  moduleNameMapper: {
    '^uuid$': '<rootDir>/test/__mocks__/uuid.js',
    '^@/logger$': '<rootDir>/src/shared/logger',
    '^@/logger/(.*)$': '<rootDir>/src/shared/logger/$1',
    '^@/database/(.*)$': '<rootDir>/src/database/$1',
    '^@/core/(.*)$': '<rootDir>/src/core/$1',
    '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/common/(.*)$': '<rootDir>/src/common/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    '^@/constants/(.*)$': '<rootDir>/src/constants/$1',
  },
};
