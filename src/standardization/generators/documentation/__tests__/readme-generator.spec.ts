/**
 * Unit tests for README generator
 */

import { ReadmeGenerator } from '../readme-generator';
import { ModuleStructure } from '../../../interfaces/module-structure.interface';

describe('ReadmeGenerator', () => {
  let generator: ReadmeGenerator;
  let mockModuleStructure: ModuleStructure;

  beforeEach(() => {
    generator = new ReadmeGenerator();
    mockModuleStructure = createMockModuleStructure();
  });

  describe('generateReadme', () => {
    it('should generate README with all required sections', async () => {
      // Act
      const readme = await generator.generateReadme(mockModuleStructure);

      // Assert
      expect(readme).toContain('# IAM Module');
      expect(readme).toContain('## Overview');
      expect(readme).toContain('## Architecture');
      expect(readme).toContain('## Features');
      expect(readme).toContain('## API Documentation');
      expect(readme).toContain('## Database Schema');
      expect(readme).toContain('## Getting Started');
      expect(readme).toContain('## Testing');
      expect(readme).toContain('## Development Guide');
      expect(readme).toContain('## License');
    });

    it('should include module statistics in overview', async () => {
      // Act
      const readme = await generator.generateReadme(mockModuleStructure);

      // Assert
      expect(readme).toContain('| **Aggregates** | 3 domain aggregates |');
      expect(readme).toContain('| **Commands** | 5 write operations |');
      expect(readme).toContain('| **Queries** | 3 read operations |');
      expect(readme).toContain('| **Controllers** | 2 REST controllers |');
    });

    it('should generate proper architecture diagram', async () => {
      // Act
      const readme = await generator.generateReadme(mockModuleStructure);

      // Assert
      expect(readme).toContain('```mermaid');
      expect(readme).toContain('graph TB');
      expect(readme).toContain('Presentation Layer');
      expect(readme).toContain('Application Layer');
      expect(readme).toContain('Domain Layer');
      expect(readme).toContain('Infrastructure Layer');
    });

    it('should handle module with no controllers', async () => {
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
      const readme = await generator.generateReadme(moduleWithNoControllers);

      // Assert
      expect(readme).toContain('| None | - | No controllers defined |');
    });

    it('should handle module with no database entities', async () => {
      // Arrange
      const moduleWithNoEntities = {
        ...mockModuleStructure,
        layers: {
          ...mockModuleStructure.layers,
          infrastructure: {
            ...mockModuleStructure.layers.infrastructure,
            entities: []
          }
        }
      };

      // Act
      const readme = await generator.generateReadme(moduleWithNoEntities);

      // Assert
      expect(readme).toContain('- No database entities defined');
    });

    it('should generate usage examples with correct module name', async () => {
      // Act
      const readme = await generator.generateReadme(mockModuleStructure);

      // Assert
      expect(readme).toContain('fetch(\'/api/iam\'');
      expect(readme).toContain('import { IAM } from \'./domain/aggregates\'');
    });

    it('should include test structure information', async () => {
      // Act
      const readme = await generator.generateReadme(mockModuleStructure);

      // Assert
      expect(readme).toContain('Unit tests (2 files)');
      expect(readme).toContain('Integration tests (1 files)');
      expect(readme).toContain('End-to-end tests (1 files)');
      expect(readme).toContain('BDD tests (see docs/postman/)');
    });

    it('should format module name correctly', async () => {
      // Arrange
      const moduleWithLowercaseName = {
        ...mockModuleStructure,
        name: 'user-management'
      };

      // Act
      const readme = await generator.generateReadme(moduleWithLowercaseName);

      // Assert
      expect(readme).toContain('# User-management Module');
      expect(readme).toContain('The User-management module');
    });

    it('should include migration and seed information', async () => {
      // Act
      const readme = await generator.generateReadme(mockModuleStructure);

      // Assert
      expect(readme).toContain('- `1704240000001-CreateUsersTable.ts`');
      expect(readme).toContain('- `1704240000001-seed-iam-users.ts`');
    });

    it('should generate proper development commands', async () => {
      // Act
      const readme = await generator.generateReadme(mockModuleStructure);

      // Assert
      expect(readme).toContain('pnpm dev');
      expect(readme).toContain('pnpm build');
      expect(readme).toContain('pnpm test');
      expect(readme).toContain('pnpm db:migrate');
    });
  });

  describe('edge cases', () => {
    it('should handle empty module structure gracefully', async () => {
      // Arrange
      const emptyModule: ModuleStructure = {
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

      // Act
      const readme = await generator.generateReadme(emptyModule);

      // Assert
      expect(readme).toContain('# Empty Module');
      expect(readme).toContain('| **Aggregates** | 0 domain aggregates |');
      expect(readme).toContain('| **Commands** | 0 write operations |');
    });

    it('should handle special characters in module name', async () => {
      // Arrange
      const moduleWithSpecialChars = {
        ...mockModuleStructure,
        name: 'user-auth@v2'
      };

      // Act
      const readme = await generator.generateReadme(moduleWithSpecialChars);

      // Assert
      expect(readme).toContain('# User-auth@v2 Module');
    });
  });

  function createMockModuleStructure(): ModuleStructure {
    return {
      name: 'iam',
      path: '/src/modules/iam',
      layers: {
        domain: {
          aggregates: [
            { name: 'User.ts', path: '/domain/aggregates/User.ts', size: 1000, exists: true, lastModified: new Date(), className: 'User', methods: [], properties: [], events: [] },
            { name: 'Role.ts', path: '/domain/aggregates/Role.ts', size: 800, exists: true, lastModified: new Date(), className: 'Role', methods: [], properties: [], events: [] },
            { name: 'Permission.ts', path: '/domain/aggregates/Permission.ts', size: 600, exists: true, lastModified: new Date(), className: 'Permission', methods: [], properties: [], events: [] }
          ],
          entities: [
            { name: 'MFASettings.ts', path: '/domain/entities/MFASettings.ts', size: 400, exists: true, lastModified: new Date(), className: 'MFASettings', properties: [], relationships: [] }
          ],
          valueObjects: [
            { name: 'UserId.ts', path: '/domain/value-objects/UserId.ts', size: 200, exists: true, lastModified: new Date(), className: 'UserId', valueType: 'string', validation: [] },
            { name: 'Email.ts', path: '/domain/value-objects/Email.ts', size: 300, exists: true, lastModified: new Date(), className: 'Email', valueType: 'string', validation: [] }
          ],
          events: [
            { name: 'UserCreated.event.ts', path: '/domain/events/UserCreated.event.ts', size: 250, exists: true, lastModified: new Date(), className: 'UserCreatedEvent', eventType: 'domain', properties: [] }
          ],
          repositories: [
            { name: 'IUserRepository.ts', path: '/domain/repositories/IUserRepository.ts', size: 300, exists: true, lastModified: new Date(), interfaceName: 'IUserRepository', methods: [], entityType: 'User' }
          ],
          services: []
        },
        application: {
          commands: [
            { name: 'CreateUser.command.ts', path: '/application/commands/CreateUser.command.ts', size: 200, exists: true, lastModified: new Date(), className: 'CreateUserCommand', properties: [] },
            { name: 'UpdateUser.command.ts', path: '/application/commands/UpdateUser.command.ts', size: 200, exists: true, lastModified: new Date(), className: 'UpdateUserCommand', properties: [] },
            { name: 'DeleteUser.command.ts', path: '/application/commands/DeleteUser.command.ts', size: 150, exists: true, lastModified: new Date(), className: 'DeleteUserCommand', properties: [] },
            { name: 'AssignRole.command.ts', path: '/application/commands/AssignRole.command.ts', size: 180, exists: true, lastModified: new Date(), className: 'AssignRoleCommand', properties: [] },
            { name: 'RevokeRole.command.ts', path: '/application/commands/RevokeRole.command.ts', size: 180, exists: true, lastModified: new Date(), className: 'RevokeRoleCommand', properties: [] }
          ],
          queries: [
            { name: 'GetUser.query.ts', path: '/application/queries/GetUser.query.ts', size: 150, exists: true, lastModified: new Date(), className: 'GetUserQuery', properties: [], returnType: 'UserResponseDto' },
            { name: 'ListUsers.query.ts', path: '/application/queries/ListUsers.query.ts', size: 200, exists: true, lastModified: new Date(), className: 'ListUsersQuery', properties: [], returnType: 'UserResponseDto[]' },
            { name: 'GetUserRoles.query.ts', path: '/application/queries/GetUserRoles.query.ts', size: 180, exists: true, lastModified: new Date(), className: 'GetUserRolesQuery', properties: [], returnType: 'RoleResponseDto[]' }
          ],
          handlers: [
            { name: 'CreateUser.handler.ts', path: '/application/handlers/CreateUser.handler.ts', size: 500, exists: true, lastModified: new Date(), className: 'CreateUserHandler', handlerType: 'command', targetClass: 'CreateUserCommand', dependencies: [] },
            { name: 'GetUser.handler.ts', path: '/application/handlers/GetUser.handler.ts', size: 400, exists: true, lastModified: new Date(), className: 'GetUserHandler', handlerType: 'query', targetClass: 'GetUserQuery', dependencies: [] }
          ],
          dtos: [
            { name: 'UserResponse.dto.ts', path: '/application/dto/UserResponse.dto.ts', size: 300, exists: true, lastModified: new Date(), className: 'UserResponseDto', type: 'response', properties: [], validations: [] }
          ]
        },
        infrastructure: {
          entities: [
            { name: 'User.entity.ts', path: '/infrastructure/persistence/entities/User.entity.ts', size: 800, exists: true, lastModified: new Date(), className: 'UserEntity', properties: [], relationships: [] },
            { name: 'Role.entity.ts', path: '/infrastructure/persistence/entities/Role.entity.ts', size: 600, exists: true, lastModified: new Date(), className: 'RoleEntity', properties: [], relationships: [] }
          ],
          repositories: [
            { name: 'UserRepository.ts', path: '/infrastructure/persistence/repositories/UserRepository.ts', size: 1000, exists: true, lastModified: new Date(), className: 'UserRepository', interfaceName: 'IUserRepository', entityType: 'User', methods: [] }
          ],
          mappers: [
            { name: 'UserMapper.ts', path: '/infrastructure/persistence/mappers/UserMapper.ts', size: 400, exists: true, lastModified: new Date(), className: 'UserMapper', sourceType: 'User', targetType: 'UserEntity', methods: [] }
          ],
          migrations: [
            { name: '1704240000001-CreateUsersTable.ts', path: '/infrastructure/persistence/migrations/1704240000001-CreateUsersTable.ts', size: 600, exists: true, lastModified: new Date(), timestamp: '1704240000001', description: 'CreateUsersTable', hasUp: true, hasDown: true, tables: [] }
          ],
          seeds: [
            { name: '1704240000001-seed-iam-users.ts', path: '/infrastructure/persistence/seeds/1704240000001-seed-iam-users.ts', size: 400, exists: true, lastModified: new Date(), timestamp: '1704240000001', module: 'iam', entity: 'users', isIdempotent: true }
          ],
          processors: []
        },
        presentation: {
          controllers: [
            { name: 'User.controller.ts', path: '/presentation/controllers/User.controller.ts', size: 1200, exists: true, lastModified: new Date(), className: 'UserController', basePath: '/users', endpoints: [], guards: [], decorators: [] },
            { name: 'Role.controller.ts', path: '/presentation/controllers/Role.controller.ts', size: 800, exists: true, lastModified: new Date(), className: 'RoleController', basePath: '/roles', endpoints: [], guards: [], decorators: [] }
          ],
          dtos: [
            { name: 'CreateUserRequest.dto.ts', path: '/presentation/dto/CreateUserRequest.dto.ts', size: 250, exists: true, lastModified: new Date(), className: 'CreateUserRequestDto', type: 'request', properties: [], validations: [] }
          ],
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
          { name: 'User.spec.ts', path: '/tests/unit/User.spec.ts', size: 800, exists: true, lastModified: new Date(), testType: 'unit', targetFile: 'User.ts', testCases: [] },
          { name: 'Role.spec.ts', path: '/tests/unit/Role.spec.ts', size: 600, exists: true, lastModified: new Date(), testType: 'unit', targetFile: 'Role.ts', testCases: [] }
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
        dependencies: ['@nestjs/common', '@nestjs/cqrs'],
        exports: ['IAMModule']
      },
      metadata: {
        version: '1.0.0',
        description: 'Identity and Access Management module',
        author: 'TelemetryFlow Team',
        license: 'MIT',
        keywords: ['iam', 'auth', 'rbac'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      }
    };
  }
});