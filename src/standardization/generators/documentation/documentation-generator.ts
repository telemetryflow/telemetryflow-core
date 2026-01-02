/**
 * Main documentation generator that orchestrates all documentation generation
 */

import { DocumentationGenerator as IDocumentationGenerator, ApiDocumentation } from '../../interfaces/documentation.interface';
import { ModuleStructure, ControllerInfo, EntityInfo, HandlerInfo } from '../../interfaces/module-structure.interface';
import { ReadmeGenerator } from './readme-generator';
import { ApiDocsGenerator } from './api-docs-generator';
import { ERDGenerator } from './erd-generator';
import { DFDGenerator } from './dfd-generator';

export class DocumentationGenerator implements IDocumentationGenerator {
  private readmeGenerator: ReadmeGenerator;
  private apiDocsGenerator: ApiDocsGenerator;
  private erdGenerator: ERDGenerator;
  private dfdGenerator: DFDGenerator;

  constructor() {
    this.readmeGenerator = new ReadmeGenerator();
    this.apiDocsGenerator = new ApiDocsGenerator();
    this.erdGenerator = new ERDGenerator();
    this.dfdGenerator = new DFDGenerator();
  }

  async generateReadme(moduleStructure: ModuleStructure): Promise<string> {
    return await this.readmeGenerator.generateReadme(moduleStructure);
  }

  async generateApiDocs(controllers: ControllerInfo[]): Promise<ApiDocumentation> {
    return await this.apiDocsGenerator.generateApiDocs(controllers);
  }

  async generateERD(entities: EntityInfo[]): Promise<string> {
    return await this.erdGenerator.generateERD(entities);
  }

  async generateDFD(handlers: HandlerInfo[]): Promise<string> {
    return await this.dfdGenerator.generateDFD(handlers);
  }

  async generateCompleteDocumentation(
    moduleStructure: ModuleStructure,
    controllers: ControllerInfo[],
    entities: EntityInfo[],
    handlers: HandlerInfo[]
  ): Promise<{
    readme: string;
    apiDocs: ApiDocumentation;
    erd: string;
    dfd: string;
    index: string;
    testingGuide: string;
    testPatterns: string;
  }> {
    const [readme, apiDocs, erd, dfd] = await Promise.all([
      this.generateReadme(moduleStructure),
      this.generateApiDocs(controllers),
      this.generateERD(entities),
      this.generateDFD(handlers)
    ]);

    const index = this.generateIndexDoc(moduleStructure);
    const testingGuide = this.generateTestingGuide(moduleStructure);
    const testPatterns = this.generateTestPatterns(moduleStructure);

    return {
      readme,
      apiDocs,
      erd,
      dfd,
      index,
      testingGuide,
      testPatterns
    };
  }

  private generateIndexDoc(moduleStructure: ModuleStructure): string {
    const moduleName = this.formatModuleName(moduleStructure.name);
    
    return `# ${moduleName} Module Documentation Index

Welcome to the ${moduleName} module documentation. This index provides navigation to all available documentation.

## 📚 Documentation Structure

### Core Documentation
- **[README.md](../README.md)** - Main module overview and getting started guide
- **[Architecture Overview](#architecture)** - System architecture and design patterns
- **[API Documentation](#api-documentation)** - Complete API reference and examples

### Technical Documentation
- **[Entity Relationship Diagram](ERD.mermaid.md)** - Database schema and relationships
- **[Data Flow Diagram](DFD.mermaid.md)** - Application data flow and CQRS patterns
- **[Testing Guide](TESTING.md)** - Testing strategy and execution guide
- **[Test Patterns](TEST_PATTERNS.md)** - Testing patterns and examples

### API Reference
- **[OpenAPI Specification](openapi.yaml)** - Machine-readable API specification
- **[Endpoints Documentation](api/endpoints.md)** - Detailed endpoint documentation
- **[Authentication Guide](api/authentication.md)** - Authentication and authorization

## 🏗️ Architecture

The ${moduleName} module follows **Domain-Driven Design (DDD)** with **CQRS** architecture:

### Layer Structure
\`\`\`
${moduleStructure.name}/
├── domain/           # Business logic (${moduleStructure.layers.domain.aggregates.length} aggregates)
├── application/      # Use cases (${moduleStructure.layers.application.commands.length + moduleStructure.layers.application.queries.length} operations)
├── infrastructure/   # Technical implementation
└── presentation/     # API layer (${moduleStructure.layers.presentation.controllers.length} controllers)
\`\`\`

### Key Components
- **Aggregates**: ${moduleStructure.layers.domain.aggregates.length} domain aggregates
- **Commands**: ${moduleStructure.layers.application.commands.length} write operations
- **Queries**: ${moduleStructure.layers.application.queries.length} read operations
- **Controllers**: ${moduleStructure.layers.presentation.controllers.length} REST endpoints
- **Entities**: ${moduleStructure.layers.infrastructure.entities.length} database entities

## 🔌 API Documentation

### Quick Start
1. **Authentication**: Obtain JWT token via \`/api/auth/login\`
2. **Authorization**: Include \`Bearer <token>\` in requests
3. **Endpoints**: See [endpoints documentation](api/endpoints.md)

### Available Controllers
${this.generateControllersList(moduleStructure)}

### OpenAPI Integration
- **Swagger UI**: \`http://localhost:3000/api\`
- **Specification**: [openapi.yaml](openapi.yaml)

## 🧪 Testing

### Test Coverage
- **Overall**: ≥90% required
- **Domain Layer**: ≥95% required
- **Application Layer**: ≥90% required
- **Infrastructure Layer**: ≥85% required
- **Presentation Layer**: ≥85% required

### Test Types
- **Unit Tests**: ${moduleStructure.tests.unit.length} files
- **Integration Tests**: ${moduleStructure.tests.integration.length} files
- **E2E Tests**: ${moduleStructure.tests.e2e.length} files
- **BDD Tests**: Available via Postman collections (see docs/postman/)

### Running Tests
\`\`\`bash
# All tests with coverage
pnpm test:cov

# Specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:bdd
\`\`\`

## 🗄️ Database

### Schema Overview
- **Tables**: ${moduleStructure.layers.infrastructure.entities.length} main entities
- **Migrations**: ${moduleStructure.layers.infrastructure.migrations.length} migration files
- **Seeds**: ${moduleStructure.layers.infrastructure.seeds.length} seed files

### Database Operations
\`\`\`bash
# Run migrations
pnpm db:migrate

# Seed test data
pnpm db:seed

# Generate migration
pnpm migration:generate -- --name NewMigration
\`\`\`

## 🚀 Development

### Prerequisites
- Node.js 22+
- PostgreSQL 16+
- pnpm 10.24.0+

### Development Commands
\`\`\`bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Generate documentation
pnpm generate:docs
\`\`\`

## 📋 Quality Gates

The module must pass all quality gates:

- ✅ **Documentation**: Complete README, API docs, diagrams
- ✅ **Test Coverage**: ≥90% overall, ≥95% domain layer
- ✅ **File Structure**: DDD compliance, naming conventions
- ✅ **Database Patterns**: Proper migrations, seeds, constraints
- ✅ **API Standards**: Swagger docs, validation, error handling
- ✅ **Build Quality**: Zero errors, lint compliance

## 🔗 Related Documentation

### TelemetryFlow Core
- **[Main README](../../README.md)** - Project overview
- **[Architecture Guide](../../docs/ARCHITECTURE_DIAGRAMS.md)** - System architecture
- **[Contributing Guide](../../CONTRIBUTING.md)** - Development guidelines

### Other Modules
- **[Audit Module](../audit/README.md)** - Audit logging system
- **[Auth Module](../auth/README.md)** - Authentication services
- **[Cache Module](../cache/README.md)** - Caching layer

---

**Last Updated**: ${new Date().toISOString().split('T')[0]}
**Module Version**: 1.0.0
**Documentation Version**: 1.0.0
`;
  }

  private generateTestingGuide(moduleStructure: ModuleStructure): string {
    const moduleName = this.formatModuleName(moduleStructure.name);
    
    return `# ${moduleName} Module Testing Guide

This guide provides comprehensive information about testing the ${moduleName} module.

## Testing Philosophy

The ${moduleName} module follows a **test-driven development (TDD)** approach with comprehensive coverage requirements:

- **Domain Layer**: ≥95% coverage (business logic is critical)
- **Application Layer**: ≥90% coverage (use cases and handlers)
- **Infrastructure Layer**: ≥85% coverage (database and external integrations)
- **Presentation Layer**: ≥85% coverage (controllers and DTOs)
- **Overall Module**: ≥90% coverage

## Test Structure

\`\`\`
tests/
├── unit/                   # Unit tests (${moduleStructure.tests.unit.length} files)
│   ├── domain/             # Domain layer tests
│   ├── application/        # Application layer tests
│   └── README.md
├── integration/            # Integration tests (${moduleStructure.tests.integration.length} files)
│   ├── repositories/       # Repository integration tests
│   └── README.md
├── e2e/                   # End-to-end tests (${moduleStructure.tests.e2e.length} files)
│   ├── controllers/        # Controller E2E tests
│   └── README.md
├── fixtures/               # Test data (${moduleStructure.tests.fixtures.length} files)
├── mocks/                  # Mock implementations (${moduleStructure.tests.mocks.length} files)
└── postman/               # BDD tests (1 collections)
\`\`\`

## Running Tests

### All Tests
\`\`\`bash
# Run all tests
pnpm test

# Run with coverage report
pnpm test:cov

# Run with watch mode
pnpm test:watch
\`\`\`

### Specific Test Types
\`\`\`bash
# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests only
pnpm test:e2e

# BDD tests (Postman/Newman)
pnpm test:bdd
pnpm test:bdd:verbose
\`\`\`

### Module-Specific Tests
\`\`\`bash
# Test specific module
pnpm test -- --testPathPattern=${moduleStructure.name}

# Test specific file
pnpm test -- UserRepository.spec.ts

# Test with specific pattern
pnpm test -- --testNamePattern="should create user"
\`\`\`

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual components in isolation

**Location**: \`tests/unit/\`

**Coverage Target**: ≥95% for domain, ≥90% for application

**Examples**:
\`\`\`typescript
// Domain aggregate test
describe('User Aggregate', () => {
  it('should create user with valid email', () => {
    const email = Email.create('test@example.com');
    const user = User.create(email);
    
    expect(user.email).toEqual(email);
    expect(user.isActive).toBe(true);
  });
});

// Command handler test
describe('CreateUserHandler', () => {
  it('should create user successfully', async () => {
    const command = new CreateUserCommand('test@example.com');
    await handler.execute(command);
    
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
\`\`\`

### 2. Integration Tests

**Purpose**: Test component interactions with real dependencies

**Location**: \`tests/integration/\`

**Coverage Target**: ≥85%

**Examples**:
\`\`\`typescript
// Repository integration test
describe('UserRepository Integration', () => {
  it('should save and retrieve user', async () => {
    const user = User.create(Email.create('test@example.com'));
    
    await repository.save(user);
    const retrieved = await repository.findById(user.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved!.email.value).toBe('test@example.com');
  });
});
\`\`\`

### 3. End-to-End Tests

**Purpose**: Test complete user workflows through the API

**Location**: \`tests/e2e/\`

**Coverage Target**: ≥85%

**Examples**:
\`\`\`typescript
// Controller E2E test
describe('User Controller E2E', () => {
  it('should create user via API', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', \`Bearer \${token}\`)
      .send({ email: 'test@example.com' });
    
    expect(response.status).toBe(201);
  });
});
\`\`\`

### 4. BDD Tests

**Purpose**: Test business scenarios using Gherkin syntax

**Location**: \`tests/postman/\`

**Tool**: Postman Collections with Newman

**Examples**:
\`\`\`gherkin
Feature: User Management
  Scenario: Create new user
    Given I am authenticated as an administrator
    When I create a user with email "test@example.com"
    Then the user should be created successfully
    And the user should be active
\`\`\`

## Test Data Management

### Fixtures

**Location**: \`tests/fixtures/\`

**Purpose**: Provide consistent test data

\`\`\`typescript
// User fixture
export const userFixture = {
  validUser: {
    email: 'test@example.com',
    isActive: true
  },
  invalidUser: {
    email: 'invalid-email'
  }
};
\`\`\`

### Mocks

**Location**: \`tests/mocks/\`

**Purpose**: Mock external dependencies

\`\`\`typescript
// Repository mock
export const mockUserRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn()
};
\`\`\`

### Database Setup

**Test Database**: Separate database for testing

\`\`\`typescript
// Test database configuration
beforeAll(async () => {
  await testDb.connect();
  await testDb.runMigrations();
});

beforeEach(async () => {
  await testDb.clearData();
  await testDb.seedTestData();
});

afterAll(async () => {
  await testDb.disconnect();
});
\`\`\`

## Coverage Requirements

### Coverage Thresholds

\`\`\`json
{
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "src/modules/${moduleStructure.name}/domain/**": {
      "branches": 95,
      "functions": 95,
      "lines": 95,
      "statements": 95
    }
  }
}
\`\`\`

### Coverage Reports

\`\`\`bash
# Generate coverage report
pnpm test:cov

# View HTML report
open coverage/lcov-report/index.html

# View coverage summary
pnpm test:cov --coverageReporters=text-summary
\`\`\`

## Testing Best Practices

### 1. Test Naming
\`\`\`typescript
// Good: Descriptive test names
it('should throw error when creating user with invalid email', () => {});

// Bad: Vague test names
it('should fail', () => {});
\`\`\`

### 2. Test Structure (AAA Pattern)
\`\`\`typescript
it('should create user with valid data', () => {
  // Arrange
  const email = Email.create('test@example.com');
  
  // Act
  const user = User.create(email);
  
  // Assert
  expect(user.email).toEqual(email);
});
\`\`\`

### 3. Test Independence
\`\`\`typescript
// Each test should be independent
beforeEach(() => {
  // Reset state before each test
  jest.clearAllMocks();
});
\`\`\`

### 4. Mock External Dependencies
\`\`\`typescript
// Mock external services
jest.mock('../external-service');
\`\`\`

### 5. Test Edge Cases
\`\`\`typescript
describe('Email validation', () => {
  it('should accept valid email', () => {});
  it('should reject empty email', () => {});
  it('should reject invalid format', () => {});
  it('should reject email without domain', () => {});
});
\`\`\`

## Debugging Tests

### Debug Configuration
\`\`\`json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "\${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
\`\`\`

### Debug Commands
\`\`\`bash
# Debug specific test
pnpm test:debug -- --testNamePattern="should create user"

# Debug with breakpoints
node --inspect-brk node_modules/.bin/jest --runInBand
\`\`\`

## Continuous Integration

### GitHub Actions
\`\`\`yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test:cov
  
- name: Upload coverage
  uses: codecov/codecov-action@v1
\`\`\`

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No test files should be skipped
- BDD scenarios must pass

## Performance Testing

### Load Testing
\`\`\`bash
# API load testing with artillery
pnpm test:load

# Database performance testing
pnpm test:db-performance
\`\`\`

### Memory Testing
\`\`\`bash
# Memory leak detection
pnpm test:memory
\`\`\`

---

**Remember**: Good tests are the foundation of maintainable code. Write tests that document behavior, catch regressions, and enable confident refactoring.
`;
  }

  private generateTestPatterns(moduleStructure: ModuleStructure): string {
    const moduleName = this.formatModuleName(moduleStructure.name);
    
    return `# ${moduleName} Module Test Patterns

This document provides reusable test patterns and templates for the ${moduleName} module.

## Domain Layer Test Patterns

### Aggregate Test Pattern

\`\`\`typescript
// Template for testing domain aggregates
describe('{{AggregateeName}} Aggregate', () => {
  describe('create', () => {
    it('should create {{aggregate}} with valid data', () => {
      // Arrange
      const validData = createValidData();
      
      // Act
      const {{aggregate}} = {{AggregateeName}}.create(validData);
      
      // Assert
      expect({{aggregate}}).toBeDefined();
      expect({{aggregate}}.id).toBeDefined();
      expect({{aggregate}}.getUncommittedEvents()).toHaveLength(1);
      expect({{aggregate}}.getUncommittedEvents()[0]).toBeInstanceOf({{AggregateeName}}CreatedEvent);
    });

    it('should throw error with invalid data', () => {
      // Arrange
      const invalidData = createInvalidData();
      
      // Act & Assert
      expect(() => {{AggregateeName}}.create(invalidData)).toThrow(DomainError);
    });
  });

  describe('business methods', () => {
    let {{aggregate}}: {{AggregateeName}};

    beforeEach(() => {
      {{aggregate}} = {{AggregateeName}}.create(createValidData());
      {{aggregate}}.markEventsAsCommitted(); // Clear creation event
    });

    it('should perform business operation successfully', () => {
      // Arrange
      const operationData = createOperationData();
      
      // Act
      {{aggregate}}.performOperation(operationData);
      
      // Assert
      expect({{aggregate}}.someProperty).toBe(expectedValue);
      expect({{aggregate}}.getUncommittedEvents()).toHaveLength(1);
    });

    it('should enforce business rules', () => {
      // Arrange
      const invalidOperation = createInvalidOperation();
      
      // Act & Assert
      expect(() => {{aggregate}}.performOperation(invalidOperation))
        .toThrow('Business rule violation message');
    });
  });
});
\`\`\`

### Value Object Test Pattern

\`\`\`typescript
// Template for testing value objects
describe('{{ValueObjectName}} Value Object', () => {
  describe('create', () => {
    it('should create with valid value', () => {
      // Arrange
      const validValue = 'valid-value';
      
      // Act
      const vo = {{ValueObjectName}}.create(validValue);
      
      // Assert
      expect(vo.value).toBe(validValue);
    });

    it('should throw error with invalid value', () => {
      // Arrange
      const invalidValue = 'invalid-value';
      
      // Act & Assert
      expect(() => {{ValueObjectName}}.create(invalidValue))
        .toThrow(DomainError);
    });
  });

  describe('equals', () => {
    it('should be equal when values are same', () => {
      // Arrange
      const value = 'same-value';
      const vo1 = {{ValueObjectName}}.create(value);
      const vo2 = {{ValueObjectName}}.create(value);
      
      // Act & Assert
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should not be equal when values differ', () => {
      // Arrange
      const vo1 = {{ValueObjectName}}.create('value1');
      const vo2 = {{ValueObjectName}}.create('value2');
      
      // Act & Assert
      expect(vo1.equals(vo2)).toBe(false);
    });
  });
});
\`\`\`

## Application Layer Test Patterns

### Command Handler Test Pattern

\`\`\`typescript
// Template for testing command handlers
describe('{{CommandName}}Handler', () => {
  let handler: {{CommandName}}Handler;
  let mockRepository: jest.Mocked<I{{Entity}}Repository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn()
    };
    
    mockEventBus = {
      publish: jest.fn()
    };

    handler = new {{CommandName}}Handler(mockRepository, mockEventBus);
  });

  describe('execute', () => {
    it('should execute command successfully', async () => {
      // Arrange
      const command = new {{CommandName}}Command(validCommandData);
      const expectedEntity = createExpectedEntity();
      
      // Act
      await handler.execute(command);
      
      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(expectedEntity)
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any({{Entity}}CreatedEvent)
      );
    });

    it('should throw error when entity already exists', async () => {
      // Arrange
      const command = new {{CommandName}}Command(duplicateData);
      mockRepository.findByEmail.mockResolvedValue(existingEntity);
      
      // Act & Assert
      await expect(handler.execute(command))
        .rejects.toThrow('Entity already exists');
      
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      // Arrange
      const command = new {{CommandName}}Command(validCommandData);
      mockRepository.save.mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(handler.execute(command))
        .rejects.toThrow('Database error');
    });
  });
});
\`\`\`

### Query Handler Test Pattern

\`\`\`typescript
// Template for testing query handlers
describe('{{QueryName}}Handler', () => {
  let handler: {{QueryName}}Handler;
  let mockRepository: jest.Mocked<I{{Entity}}Repository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByEmail: jest.fn()
    };

    handler = new {{QueryName}}Handler(mockRepository);
  });

  describe('execute', () => {
    it('should return entity when found', async () => {
      // Arrange
      const query = new {{QueryName}}Query(validId);
      const expectedEntity = createExpectedEntity();
      mockRepository.findById.mockResolvedValue(expectedEntity);
      
      // Act
      const result = await handler.execute(query);
      
      // Assert
      expect(result).toEqual({{Entity}}ResponseDto.fromDomain(expectedEntity));
      expect(mockRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: validId })
      );
    });

    it('should throw error when entity not found', async () => {
      // Arrange
      const query = new {{QueryName}}Query(nonExistentId);
      mockRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(handler.execute(query))
        .rejects.toThrow(NotFoundException);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const query = new {{QueryName}}Query(validId);
      mockRepository.findById.mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(handler.execute(query))
        .rejects.toThrow('Database error');
    });
  });
});
\`\`\`

## Infrastructure Layer Test Patterns

### Repository Integration Test Pattern

\`\`\`typescript
// Template for testing repository implementations
describe('{{Entity}}Repository Integration', () => {
  let repository: {{Entity}}Repository;
  let testingModule: TestingModule;
  let dataSource: DataSource;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig),
        TypeOrmModule.forFeature([{{Entity}}Entity])
      ],
      providers: [{{Entity}}Repository, {{Entity}}Mapper]
    }).compile();

    repository = testingModule.get<{{Entity}}Repository>({{Entity}}Repository);
    dataSource = testingModule.get<DataSource>(DataSource);
    
    // Clean database
    await dataSource.synchronize(true);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  describe('save', () => {
    it('should save entity successfully', async () => {
      // Arrange
      const entity = {{Entity}}.create(createValidData());
      
      // Act
      await repository.save(entity);
      
      // Assert
      const saved = await repository.findById(entity.id);
      expect(saved).toBeDefined();
      expect(saved!.id).toEqual(entity.id);
    });

    it('should update existing entity', async () => {
      // Arrange
      const entity = {{Entity}}.create(createValidData());
      await repository.save(entity);
      
      entity.updateProperty(newValue);
      
      // Act
      await repository.save(entity);
      
      // Assert
      const updated = await repository.findById(entity.id);
      expect(updated!.property).toBe(newValue);
    });
  });

  describe('findById', () => {
    it('should return entity when exists', async () => {
      // Arrange
      const entity = {{Entity}}.create(createValidData());
      await repository.save(entity);
      
      // Act
      const found = await repository.findById(entity.id);
      
      // Assert
      expect(found).toBeDefined();
      expect(found!.id).toEqual(entity.id);
    });

    it('should return null when not exists', async () => {
      // Arrange
      const nonExistentId = {{Entity}}Id.generate();
      
      // Act
      const found = await repository.findById(nonExistentId);
      
      // Assert
      expect(found).toBeNull();
    });
  });
});
\`\`\`

## Presentation Layer Test Patterns

### Controller E2E Test Pattern

\`\`\`typescript
// Template for testing controllers
describe('{{Entity}}Controller E2E', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Get authentication token
    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /{{entities}}', () => {
    it('should create {{entity}} successfully', async () => {
      // Arrange
      const createRequest = {
        property: 'valid-value'
      };
      
      // Act
      const response = await request(app.getHttpServer())
        .post('/{{entities}}')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send(createRequest);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        property: createRequest.property
      });
    });

    it('should return 400 for invalid data', async () => {
      // Arrange
      const invalidRequest = {
        property: '' // Invalid empty value
      };
      
      // Act
      const response = await request(app.getHttpServer())
        .post('/{{entities}}')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send(invalidRequest);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('validation');
    });

    it('should return 401 without authentication', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/{{entities}}')
        .send({ property: 'value' });
      
      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 403 without proper permissions', async () => {
      // Arrange
      const limitedToken = await getAuthToken(app, 'viewer');
      
      // Act
      const response = await request(app.getHttpServer())
        .post('/{{entities}}')
        .set('Authorization', \`Bearer \${limitedToken}\`)
        .send({ property: 'value' });
      
      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('GET /{{entities}}/:id', () => {
    it('should return {{entity}} when exists', async () => {
      // Arrange
      const created = await createTestEntity();
      
      // Act
      const response = await request(app.getHttpServer())
        .get(\`/{{entities}}/\${created.id}\`)
        .set('Authorization', \`Bearer \${authToken}\`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(created.id);
    });

    it('should return 404 when not exists', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/{{entities}}/non-existent-id')
        .set('Authorization', \`Bearer \${authToken}\`);
      
      // Assert
      expect(response.status).toBe(404);
    });
  });
});
\`\`\`

## Test Utilities

### Test Data Builders

\`\`\`typescript
// Builder pattern for test data
export class {{Entity}}TestDataBuilder {
  private data: Partial<{{Entity}}Data> = {};

  static create(): {{Entity}}TestDataBuilder {
    return new {{Entity}}TestDataBuilder();
  }

  withEmail(email: string): {{Entity}}TestDataBuilder {
    this.data.email = email;
    return this;
  }

  withValidData(): {{Entity}}TestDataBuilder {
    this.data = {
      email: 'test@example.com',
      isActive: true
    };
    return this;
  }

  build(): {{Entity}}Data {
    return {
      email: 'default@example.com',
      isActive: true,
      ...this.data
    };
  }

  buildDomain(): {{Entity}} {
    const data = this.build();
    return {{Entity}}.create(Email.create(data.email));
  }
}

// Usage
const user = {{Entity}}TestDataBuilder
  .create()
  .withEmail('custom@example.com')
  .buildDomain();
\`\`\`

### Custom Matchers

\`\`\`typescript
// Custom Jest matchers
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      message: () => \`expected \${received} \${pass ? 'not ' : ''}to be a valid email\`,
      pass
    };
  },

  toHaveDomainEvent(received: AggregateRoot, eventType: any) {
    const events = received.getUncommittedEvents();
    const hasEvent = events.some(event => event instanceof eventType);
    
    return {
      message: () => \`expected aggregate \${hasEvent ? 'not ' : ''}to have \${eventType.name} event\`,
      pass: hasEvent
    };
  }
});

// Usage
expect('test@example.com').toBeValidEmail();
expect(user).toHaveDomainEvent(UserCreatedEvent);
\`\`\`

### Test Database Utilities

\`\`\`typescript
// Database test utilities
export class TestDatabase {
  private dataSource: DataSource;

  async connect(): Promise<void> {
    this.dataSource = new DataSource(testDatabaseConfig);
    await this.dataSource.initialize();
  }

  async disconnect(): Promise<void> {
    await this.dataSource.destroy();
  }

  async clearData(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;
    
    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.clear();
    }
  }

  async seedTestData(): Promise<void> {
    // Seed basic test data
    await this.seedUsers();
    await this.seedRoles();
  }

  private async seedUsers(): Promise<void> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const testUsers = [
      { email: 'test1@example.com', isActive: true },
      { email: 'test2@example.com', isActive: false }
    ];
    
    await userRepository.save(testUsers);
  }
}
\`\`\`

## BDD Test Patterns

### Postman Collection Structure

\`\`\`json
{
  "info": {
    "name": "{{ModuleName}} BDD Tests",
    "description": "Behavior-driven tests for {{ModuleName}} module"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login as Administrator",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/login",
            "body": {
              "email": "admin@example.com",
              "password": "password"
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Should login successfully', function () {",
                  "    pm.response.to.have.status(200);",
                  "    pm.expect(pm.response.json()).to.have.property('access_token');",
                  "    pm.globals.set('authToken', pm.response.json().access_token);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "{{Entity}} Management",
      "item": [
        {
          "name": "Create {{Entity}} - Happy Path",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/{{entities}}",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "body": {
              "property": "valid-value"
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Should create {{entity}} successfully', function () {",
                  "    pm.response.to.have.status(201);",
                  "    const response = pm.response.json();",
                  "    pm.expect(response).to.have.property('id');",
                  "    pm.globals.set('{{entity}}Id', response.id);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`

---

These patterns provide a solid foundation for comprehensive testing of the ${moduleName} module. Adapt them to your specific domain requirements while maintaining the testing principles and coverage standards.
`;
  }

  private formatModuleName(name: string): string {
    // Special cases for acronyms
    const acronyms: Record<string, string> = {
      'iam': 'IAM',
      'api': 'API',
      'jwt': 'JWT',
      'rbac': 'RBAC',
      'oauth': 'OAuth',
      'saml': 'SAML'
    };
    
    const lowerName = name.toLowerCase();
    if (acronyms[lowerName]) {
      return acronyms[lowerName];
    }
    
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  private generateControllersList(moduleStructure: ModuleStructure): string {
    if (moduleStructure.layers.presentation.controllers.length === 0) {
      return '- No controllers defined';
    }

    return moduleStructure.layers.presentation.controllers
      .map(controller => {
        const name = controller.className.replace('Controller', '');
        return `- **${controller.className}**: Manages ${name.toLowerCase()} resources`;
      })
      .join('\n');
  }
}