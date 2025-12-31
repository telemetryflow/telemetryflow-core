/**
 * Unit tests for main documentation generator
 */

import { DocumentationGenerator } from '../documentation-generator';
import { ModuleStructure, ControllerInfo, EntityInfo, HandlerInfo } from '../../../interfaces/module-structure.interface';

describe('DocumentationGenerator', () => {
  let generator: DocumentationGenerator;
  let mockModuleStructure: ModuleStructure;
  let mockControllers: ControllerInfo[];
  let mockEntities: EntityInfo[];
  let mockHandlers: HandlerInfo[];

  beforeEach(() => {
    generator = new DocumentationGenerator();
    mockModuleStructure = createMockModuleStructure();
    mockControllers = createMockControllers();
    mockEntities = createMockEntities();
    mockHandlers = createMockHandlers();
  });

  describe('generateReadme', () => {
    it('should delegate to ReadmeGenerator', async () => {
      // Act
      const readme = await generator.generateReadme(mockModuleStructure);

      // Assert
      expect(readme).toContain('# IAM Module');
      expect(readme).toContain('## Overview');
      expect(readme).toContain('## Architecture');
    });
  });

  describe('generateApiDocs', () => {
    it('should delegate to ApiDocsGenerator', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs).toHaveProperty('openapi');
      expect(apiDocs).toHaveProperty('endpoints');
      expect(apiDocs).toHaveProperty('authentication');
      expect(apiDocs).toHaveProperty('examples');
    });
  });

  describe('generateERD', () => {
    it('should delegate to ERDGenerator', async () => {
      // Act
      const erd = await generator.generateERD(mockEntities);

      // Assert
      expect(erd).toContain('# Entity Relationship Diagram');
      expect(erd).toContain('```mermaid');
      expect(erd).toContain('erDiagram');
    });
  });

  describe('generateDFD', () => {
    it('should delegate to DFDGenerator', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('# Data Flow Diagram');
      expect(dfd).toContain('```mermaid');
      expect(dfd).toContain('flowchart TD');
    });
  });

  describe('generateCompleteDocumentation', () => {
    it('should generate all documentation types', async () => {
      // Act
      const docs = await generator.generateCompleteDocumentation(
        mockModuleStructure,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs).toHaveProperty('readme');
      expect(docs).toHaveProperty('apiDocs');
      expect(docs).toHaveProperty('erd');
      expect(docs).toHaveProperty('dfd');
      expect(docs).toHaveProperty('index');
      expect(docs).toHaveProperty('testingGuide');
      expect(docs).toHaveProperty('testPatterns');
    });

    it('should generate index documentation with navigation', async () => {
      // Act
      const docs = await generator.generateCompleteDocumentation(
        mockModuleStructure,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.index).toContain('# IAM Module Documentation Index');
      expect(docs.index).toContain('## 📚 Documentation Structure');
      expect(docs.index).toContain('### Core Documentation');
      expect(docs.index).toContain('- **[README.md](../README.md)**');
      expect(docs.index).toContain('### Technical Documentation');
      expect(docs.index).toContain('- **[Entity Relationship Diagram](ERD.mermaid.md)**');
      expect(docs.index).toContain('- **[Data Flow Diagram](DFD.mermaid.md)**');
    });

    it('should include module statistics in index', async () => {
      // Act
      const docs = await generator.generateCompleteDocumentation(
        mockModuleStructure,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.index).toContain('- **Aggregates**: 2 domain aggregates');
      expect(docs.index).toContain('- **Commands**: 2 write operations');
      expect(docs.index).toContain('- **Queries**: 1 read operations');
      expect(docs.index).toContain('- **Controllers**: 1 REST endpoints');
      expect(docs.index).toContain('- **Entities**: 2 database entities');
    });

    it('should include API documentation section in index', async () => {
      // Act
      const docs = await generator.generateCompleteDocumentation(
        mockModuleStructure,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.index).toContain('## 🔌 API Documentation');
      expect(docs.index).toContain('### Quick Start');
      expect(docs.index).toContain('1. **Authentication**: Obtain JWT token via `/api/auth/login`');
      expect(docs.index).toContain('2. **Authorization**: Include `Bearer <token>` in requests');
      expect(docs.index).toContain('### Available Controllers');
      expect(docs.index).toContain('- **UserController**: Manages user resources');
    });

    it('should generate comprehensive testing guide', async () => {
      // Act
      const docs = await generator.generateCompleteDocumentation(
        mockModuleStructure,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.testingGuide).toContain('# IAM Module Testing Guide');
      expect(docs.testingGuide).toContain('## Testing Philosophy');
      expect(docs.testingGuide).toContain('- **Domain Layer**: ≥95% coverage');
      expect(docs.testingGuide).toContain('- **Application Layer**: ≥90% coverage');
      expect(docs.testingGuide).toContain('- **Infrastructure Layer**: ≥85% coverage');
      expect(docs.testingGuide).toContain('- **Presentation Layer**: ≥85% coverage');
    });

    it('should include test structure in testing guide', async () => {
      // Act
      const docs = await generator.generateCompleteDocumentation(
        mockModuleStructure,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.testingGuide).toContain('├── unit/                   # Unit tests (1 files)');
      expect(docs.testingGuide).toContain('├── integration/            # Integration tests (1 files)');
      expect(docs.testingGuide).toContain('├── e2e/                   # End-to-end tests (1 files)');
      expect(docs.testingGuide).toContain('└── postman/               # BDD tests (1 collections)');
    });

    it('should generate test patterns with templates', async () => {
      // Act
      const docs = await generator.generateCompleteDocumentation(
        mockModuleStructure,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.testPatterns).toContain('# IAM Module Test Patterns');
      expect(docs.testPatterns).toContain('## Domain Layer Test Patterns');
      expect(docs.testPatterns).toContain('### Aggregate Test Pattern');
      expect(docs.testPatterns).toContain('describe(\'{{AggregateeName}} Aggregate\', () => {');
      expect(docs.testPatterns).toContain('### Value Object Test Pattern');
      expect(docs.testPatterns).toContain('## Application Layer Test Patterns');
      expect(docs.testPatterns).toContain('### Command Handler Test Pattern');
      expect(docs.testPatterns).toContain('### Query Handler Test Pattern');
    });

    it('should include infrastructure test patterns', async () => {
      // Act
      const docs = await generator.generateCompleteDocumentation(
        mockModuleStructure,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.testPatterns).toContain('## Infrastructure Layer Test Patterns');
      expect(docs.testPatterns).toContain('### Repository Integration Test Pattern');
      expect(docs.testPatterns).toContain('beforeEach(async () => {');
      expect(docs.testPatterns).toContain('testingModule = await Test.createTestingModule({');
    });

    it('should include presentation layer test patterns', async () => {
      // Act
      const docs = await generator.generateCompleteDocumentation(
        mockModuleStructure,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.testPatterns).toContain('## Presentation Layer Test Patterns');
      expect(docs.testPatterns).toContain('### Controller E2E Test Pattern');
      expect(docs.testPatterns).toContain('describe(\'{{Entity}}Controller E2E\', () => {');
      expect(docs.testPatterns).toContain('request(app.getHttpServer())');
    });

    it('should include test utilities and builders', async () => {
      // Act
      const docs = await generator.generateCompleteDocumentation(
        mockModuleStructure,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.testPatterns).toContain('## Test Utilities');
      expect(docs.testPatterns).toContain('### Test Data Builders');
      expect(docs.testPatterns).toContain('export class {{Entity}}TestDataBuilder {');
      expect(docs.testPatterns).toContain('### Custom Matchers');
      expect(docs.testPatterns).toContain('expect.extend({');
    });

    it('should include BDD test patterns', async () => {
      // Act
      const docs = await generator.generateCompleteDocumentation(
        mockModuleStructure,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.testPatterns).toContain('## BDD Test Patterns');
      expect(docs.testPatterns).toContain('### Postman Collection Structure');
      expect(docs.testPatterns).toContain('"name": "{{ModuleName}} BDD Tests"');
      expect(docs.testPatterns).toContain('"method": "POST"');
    });

    it('should handle modules with no controllers gracefully', async () => {
      // Arrange
      const moduleWithNoControllers = {
        ...mockModuleStructure,
        layers: {
          ...mockModuleStructure.layers,
          presentation: {
            ...mockModuleStructure.layers.presentation,
            controllers: []
          }
        }
      };

      // Act
      const docs = await generator.generateCompleteDocumentation(
        moduleWithNoControllers,
        [],
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.index).toContain('- No controllers defined');
    });

    it('should handle modules with no tests gracefully', async () => {
      // Arrange
      const moduleWithNoTests = {
        ...mockModuleStructure,
        tests: {
          unit: [],
          integration: [],
          e2e: [],
          fixtures: [],
          mocks: [],
          coverage: {
            lines: { total: 0, covered: 0, percentage: 0 },
            functions: { total: 0, covered: 0, percentage: 0 },
            branches: { total: 0, covered: 0, percentage: 0 },
            statements: { total: 0, covered: 0, percentage: 0 }
          }
        }
      };

      // Act
      const docs = await generator.generateCompleteDocumentation(
        moduleWithNoTests,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.testingGuide).toContain('├── unit/                   # Unit tests (0 files)');
      expect(docs.testingGuide).toContain('├── integration/            # Integration tests (0 files)');
    });
  });

  describe('edge cases', () => {
    it('should handle empty inputs gracefully', async () => {
      // Arrange
      const emptyModule = createEmptyModuleStructure();

      // Act
      const docs = await generator.generateCompleteDocumentation(
        emptyModule,
        [],
        [],
        []
      );

      // Assert
      expect(docs.readme).toContain('# Empty Module');
      expect(docs.index).toContain('# Empty Module Documentation Index');
      expect(docs.testingGuide).toContain('# Empty Module Testing Guide');
      expect(docs.testPatterns).toContain('# Empty Module Test Patterns');
    });

    it('should handle module names with special characters', async () => {
      // Arrange
      const moduleWithSpecialName = {
        ...mockModuleStructure,
        name: 'user-auth@v2'
      };

      // Act
      const docs = await generator.generateCompleteDocumentation(
        moduleWithSpecialName,
        mockControllers,
        mockEntities,
        mockHandlers
      );

      // Assert
      expect(docs.index).toContain('# User-auth@v2 Module Documentation Index');
      expect(docs.testingGuide).toContain('# User-auth@v2 Module Testing Guide');
    });
  });

  // Helper functions
  function createMockModuleStructure(): ModuleStructure {
    return {
      name: 'iam',
      path: '/src/modules/iam',
      layers: {
        domain: {
          aggregates: [
            { name: 'User.ts', path: '/domain/aggregates/User.ts', size: 1000, exists: true, lastModified: new Date(), className: 'User', methods: [], properties: [], events: [] },
            { name: 'Role.ts', path: '/domain/aggregates/Role.ts', size: 800, exists: true, lastModified: new Date(), className: 'Role', methods: [], properties: [], events: [] }
          ],
          entities: [],
          valueObjects: [],
          events: [],
          repositories: [],
          services: []
        },
        application: {
          commands: [
            { name: 'CreateUser.command.ts', path: '/application/commands/CreateUser.command.ts', size: 200, exists: true, lastModified: new Date(), className: 'CreateUserCommand', properties: [] },
            { name: 'UpdateUser.command.ts', path: '/application/commands/UpdateUser.command.ts', size: 200, exists: true, lastModified: new Date(), className: 'UpdateUserCommand', properties: [] }
          ],
          queries: [
            { name: 'GetUser.query.ts', path: '/application/queries/GetUser.query.ts', size: 150, exists: true, lastModified: new Date(), className: 'GetUserQuery', properties: [], returnType: 'UserResponseDto' }
          ],
          handlers: [],
          dtos: []
        },
        infrastructure: {
          entities: [
            { name: 'User.entity.ts', path: '/infrastructure/persistence/entities/User.entity.ts', size: 800, exists: true, lastModified: new Date(), className: 'UserEntity', properties: [], relationships: [] },
            { name: 'Role.entity.ts', path: '/infrastructure/persistence/entities/Role.entity.ts', size: 600, exists: true, lastModified: new Date(), className: 'RoleEntity', properties: [], relationships: [] }
          ],
          repositories: [],
          mappers: [],
          migrations: [],
          seeds: [],
          processors: []
        },
        presentation: {
          controllers: [
            { name: 'User.controller.ts', path: '/presentation/controllers/User.controller.ts', size: 1200, exists: true, lastModified: new Date(), className: 'UserController', basePath: '/users', endpoints: [], guards: [], decorators: [] }
          ],
          dtos: [],
          guards: [],
          decorators: []
        }
      },
      documentation: {
        readme: { name: 'README.md', path: '/README.md', size: 5000, exists: true, lastModified: new Date() },
        apiDocs: [],
        diagrams: [],
        guides: []
      },
      tests: {
        unit: [
          { name: 'User.spec.ts', path: '/tests/unit/User.spec.ts', size: 800, exists: true, lastModified: new Date(), testType: 'unit', targetFile: 'User.ts', testCases: [] }
        ],
        integration: [
          { name: 'UserRepository.integration.spec.ts', path: '/tests/integration/UserRepository.integration.spec.ts', size: 1000, exists: true, lastModified: new Date(), testType: 'integration', targetFile: 'UserRepository.ts', testCases: [] }
        ],
        e2e: [
          { name: 'User.controller.e2e.spec.ts', path: '/tests/e2e/User.controller.e2e.spec.ts', size: 1200, exists: true, lastModified: new Date(), testType: 'e2e', targetFile: 'User.controller.ts', testCases: [] }
        ],
        fixtures: [],
        mocks: [],
        coverage: {
          lines: { total: 100, covered: 95, percentage: 95 },
          functions: { total: 50, covered: 48, percentage: 96 },
          branches: { total: 30, covered: 28, percentage: 93 },
          statements: { total: 120, covered: 115, percentage: 96 }
        }
      },
      configuration: {
        moduleFile: { name: 'iam.module.ts', path: '/iam.module.ts', size: 800, exists: true, lastModified: new Date() },
        dependencies: [],
        exports: []
      },
      metadata: {
        version: '1.0.0',
        description: 'IAM module',
        author: 'Test',
        license: 'MIT',
        keywords: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }

  function createMockControllers(): ControllerInfo[] {
    return [
      {
        name: 'UserController',
        path: '/controllers/User.controller.ts',
        size: 1200,
        exists: true,
        lastModified: new Date(),
        className: 'UserController',
        basePath: '/users',
        endpoints: [],
        guards: [],
        decorators: []
      }
    ];
  }

  function createMockEntities(): EntityInfo[] {
    return [
      {
        name: 'User.entity.ts',
        path: '/entities/User.entity.ts',
        size: 800,
        exists: true,
        lastModified: new Date(),
        className: 'UserEntity',
        properties: [],
        relationships: []
      }
    ];
  }

  function createMockHandlers(): HandlerInfo[] {
    return [
      {
        name: 'CreateUserHandler',
        path: '/handlers/CreateUser.handler.ts',
        size: 500,
        exists: true,
        lastModified: new Date(),
        className: 'CreateUserHandler',
        handlerType: 'command',
        targetClass: 'CreateUserCommand',
        dependencies: []
      }
    ];
  }

  function createEmptyModuleStructure(): ModuleStructure {
    return {
      name: 'empty',
      path: '/empty',
      layers: {
        domain: { aggregates: [], entities: [], valueObjects: [], events: [], repositories: [], services: [] },
        application: { commands: [], queries: [], handlers: [], dtos: [] },
        infrastructure: { entities: [], repositories: [], mappers: [], migrations: [], seeds: [], processors: [] },
        presentation: { controllers: [], dtos: [], guards: [], decorators: [] }
      },
      documentation: {
        readme: { name: '', path: '', size: 0, exists: false, lastModified: new Date() },
        apiDocs: [],
        diagrams: [],
        guides: []
      },
      tests: {
        unit: [],
        integration: [],
        e2e: [],
        fixtures: [],
        mocks: [],
        coverage: { lines: { total: 0, covered: 0, percentage: 0 }, functions: { total: 0, covered: 0, percentage: 0 }, branches: { total: 0, covered: 0, percentage: 0 }, statements: { total: 0, covered: 0, percentage: 0 } }
      },
      configuration: {
        moduleFile: { name: '', path: '', size: 0, exists: false, lastModified: new Date() },
        dependencies: [],
        exports: []
      },
      metadata: {
        version: '1.0.0',
        description: 'Empty module',
        author: 'Test',
        license: 'MIT',
        keywords: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }
});