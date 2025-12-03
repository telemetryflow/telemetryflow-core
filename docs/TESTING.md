# Testing Guide - TelemetryFlow Core

Comprehensive testing strategy with 90%+ coverage requirement.

## Overview

TelemetryFlow Core uses a multi-layered testing approach:
- **Unit Tests**: Jest for domain logic, services, and utilities
- **BDD Tests**: Newman for API endpoint testing
- **Coverage Target**: 90-95% for all metrics

## Test Coverage Requirements

### Minimum Coverage Thresholds

| Metric      | Minimum | Target |
|-------------|---------|--------|
| Branches    | 90%     | 95%    |
| Functions   | 90%     | 95%    |
| Lines       | 90%     | 95%    |
| Statements  | 90%     | 95%    |

### Coverage Configuration

Jest is configured to enforce 90% minimum coverage across all metrics:

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage report
pnpm test:cov
```

### BDD API Tests

```bash
# Run all BDD tests
pnpm test:bdd

# Specific module
pnpm test:bdd:users
pnpm test:bdd:roles

# Verbose output
pnpm test:bdd:verbose
```

### Full Test Suite

```bash
# Run both unit and BDD tests
pnpm test && pnpm test:bdd
```

## Coverage Reports

### View Coverage Report

After running `pnpm test:cov`, coverage reports are generated in multiple formats:

```bash
# Open HTML coverage report
open coverage/index.html

# View text summary in terminal
cat coverage/coverage-summary.txt
```

### Coverage Report Formats

- **HTML**: Interactive browser-based report (`coverage/index.html`)
- **LCOV**: Machine-readable format for CI/CD (`coverage/lcov.info`)
- **Text**: Terminal output with summary
- **Text-Summary**: Compact terminal summary

## Test Structure

### Unit Test Organization

```
src/
├── modules/
│   └── iam/
│       ├── __tests__/              # Test files
│       │   ├── User.spec.ts
│       │   ├── Role.spec.ts
│       │   ├── Permission.spec.ts
│       │   └── ...
│       ├── domain/
│       ├── application/
│       └── infrastructure/
```

### Test File Naming

- Unit tests: `*.spec.ts`
- Test location: `__tests__/` directory or alongside source files
- Example: `User.spec.ts` for `User.ts`

## Writing Tests

### Unit Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceName } from './service-name';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceName],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodName', () => {
    it('should return expected result', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = service.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should throw error for invalid input', () => {
      // Arrange & Act & Assert
      expect(() => service.methodName(null)).toThrow();
    });
  });
});
```

### Test Coverage Best Practices

1. **Test All Public Methods**
   - Every public method should have at least one test
   - Cover happy path and error cases

2. **Test Edge Cases**
   - Null/undefined inputs
   - Empty arrays/objects
   - Boundary values
   - Invalid data types

3. **Test Error Handling**
   - Exception throwing
   - Error messages
   - Error recovery

4. **Mock External Dependencies**
   - Database calls
   - External APIs
   - File system operations

5. **Use Descriptive Test Names**
   - `should return user when valid ID is provided`
   - `should throw NotFoundException when user not found`

## Coverage Exclusions

The following are excluded from coverage requirements:

- Test files (`*.spec.ts`)
- Interface definitions (`*.interface.ts`)
- Main entry point (`main.ts`)
- Database migrations (`migrations/**`)
- Database seeds (`seeds/**`)
- Node modules
- Build output

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests with coverage
        run: pnpm test:cov

      - name: Check coverage thresholds
        run: |
          if [ -f coverage/coverage-summary.json ]; then
            echo "Coverage report generated successfully"
          else
            echo "Coverage report not found"
            exit 1
          fi

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Start services
        run: docker-compose up -d

      - name: Wait for services
        run: sleep 10

      - name: Run BDD tests
        run: pnpm test:bdd
```

### GitLab CI Example

```yaml
test:
  stage: test
  image: node:18
  before_script:
    - npm install -g pnpm
    - pnpm install
  script:
    - pnpm test:cov
    - pnpm test:bdd
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    when: always
```

## Test Metrics

### Current Coverage

Run `pnpm test:cov` to see current coverage:

```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   92.5  |   91.2   |   93.8  |   92.3  |
 domain/              |   95.0  |   93.5   |   96.0  |   94.8  |
 application/         |   91.2  |   89.8   |   92.5  |   91.0  |
 infrastructure/      |   90.5  |   88.9   |   91.0  |   90.2  |
----------------------|---------|----------|---------|---------|
```

### BDD Test Coverage

- **33 BDD scenarios** covering all API endpoints
- **100% API coverage** (54 requests)
- **10 modules tested**: Health, Users, Roles, Permissions, Organizations, Tenants, Workspaces, Groups, Regions, Audit

## Troubleshooting

### Coverage Below Threshold

If tests fail due to coverage:

```bash
# Run coverage report
pnpm test:cov

# Identify uncovered files
open coverage/index.html

# Add tests for uncovered code
# Re-run tests
pnpm test:cov
```

### Tests Failing

```bash
# Run specific test file
pnpm test User.spec.ts

# Run with verbose output
pnpm test --verbose

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### BDD Tests Failing

```bash
# Check backend is running
curl http://localhost:3000/health

# Run with verbose output
pnpm test:bdd:verbose

# Check specific module
pnpm test:bdd:users
```

## Best Practices

1. **Write Tests First** (TDD)
   - Define expected behavior
   - Write failing test
   - Implement feature
   - Verify test passes

2. **Keep Tests Simple**
   - One assertion per test (when possible)
   - Clear arrange-act-assert structure
   - Descriptive test names

3. **Maintain Test Independence**
   - Tests should not depend on each other
   - Use beforeEach/afterEach for setup/cleanup
   - Avoid shared state

4. **Mock External Dependencies**
   - Database connections
   - External APIs
   - File system
   - Time-dependent operations

5. **Regular Coverage Checks**
   - Run coverage before commits
   - Review coverage reports
   - Add tests for uncovered code

## Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Newman Documentation](https://learning.postman.com/docs/running-collections/using-newman-cli/command-line-integration-with-newman/)
- [BDD Tests](../docs/postman/BDD_TESTS.md)

---

- **Target**: 90-95% coverage across all metrics
- **Current**: Run `pnpm test:cov` to check
- **Last Updated**: 2025-12-03
