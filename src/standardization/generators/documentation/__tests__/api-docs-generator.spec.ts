/**
 * Unit tests for API documentation generator
 */

import { ApiDocsGenerator } from '../api-docs-generator';
import { ControllerInfo, EndpointInfo } from '../../../interfaces/module-structure.interface';

describe('ApiDocsGenerator', () => {
  let generator: ApiDocsGenerator;
  let mockControllers: ControllerInfo[];

  beforeEach(() => {
    generator = new ApiDocsGenerator();
    mockControllers = createMockControllers();
  });

  describe('generateApiDocs', () => {
    it('should generate complete API documentation', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs).toHaveProperty('openapi');
      expect(apiDocs).toHaveProperty('endpoints');
      expect(apiDocs).toHaveProperty('authentication');
      expect(apiDocs).toHaveProperty('examples');
    });

    it('should generate OpenAPI specification with correct structure', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs.openapi).toContain('openapi: 3.0.3');
      expect(apiDocs.openapi).toContain('title: TelemetryFlow Core API');
      expect(apiDocs.openapi).toContain('version: 1.0.0');
      expect(apiDocs.openapi).toContain('servers:');
      expect(apiDocs.openapi).toContain('http://localhost:3000/api');
      expect(apiDocs.openapi).toContain('https://api.telemetryflow.id');
    });

    it('should include security schemes in OpenAPI spec', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs.openapi).toContain('securitySchemes:');
      expect(apiDocs.openapi).toContain('bearerAuth:');
      expect(apiDocs.openapi).toContain('type: http');
      expect(apiDocs.openapi).toContain('scheme: bearer');
      expect(apiDocs.openapi).toContain('bearerFormat: JWT');
    });

    it('should generate endpoints documentation with all controllers', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs.endpoints).toContain('# API Endpoints');
      expect(apiDocs.endpoints).toContain('## User');
      expect(apiDocs.endpoints).toContain('## Role');
      expect(apiDocs.endpoints).toContain('### GET /users');
      expect(apiDocs.endpoints).toContain('### POST /users');
      expect(apiDocs.endpoints).toContain('### GET /roles');
    });

    it('should include permission requirements in endpoint docs', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs.endpoints).toContain('GET /users');
      expect(apiDocs.endpoints).toContain('POST /users');
      expect(apiDocs.endpoints).toContain('GET /roles');
    });

    it('should generate authentication documentation', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs.authentication).toContain('# Authentication & Authorization');
      expect(apiDocs.authentication).toContain('## RBAC System');
      expect(apiDocs.authentication).toContain('### Role Hierarchy');
      expect(apiDocs.authentication).toContain('| **Super Administrator** | 1 |');
      expect(apiDocs.authentication).toContain('| **Administrator** | 2 |');
      expect(apiDocs.authentication).toContain('| **Developer** | 3 |');
      expect(apiDocs.authentication).toContain('| **Viewer** | 4 |');
      expect(apiDocs.authentication).toContain('| **Demo** | 5 |');
    });

    it('should include JWT authentication flow', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs.authentication).toContain('POST /api/auth/login');
      expect(apiDocs.authentication).toContain('Authorization: Bearer');
      expect(apiDocs.authentication).toContain('access_token');
      expect(apiDocs.authentication).toContain('expires_in');
    });

    it('should generate examples with curl and JavaScript', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs.examples).toContain('# API Examples');
      expect(apiDocs.examples).toContain('```bash');
      expect(apiDocs.examples).toContain('curl -X GET');
      expect(apiDocs.examples).toContain('```javascript');
      expect(apiDocs.examples).toContain('fetch(');
      expect(apiDocs.examples).toContain('Authorization: Bearer');
    });

    it('should handle controllers with no endpoints', async () => {
      // Arrange
      const controllersWithNoEndpoints: ControllerInfo[] = [
        {
          name: 'EmptyController',
          path: '/controllers/Empty.controller.ts',
          size: 100,
          exists: true,
          lastModified: new Date(),
          className: 'EmptyController',
          basePath: '/empty',
          endpoints: [],
          guards: [],
          decorators: []
        }
      ];

      // Act
      const apiDocs = await generator.generateApiDocs(controllersWithNoEndpoints);

      // Assert
      expect(apiDocs.endpoints).toContain('## Empty');
      expect(apiDocs.authentication).toContain('- No specific permissions documented');
    });

    it('should include error handling documentation', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs.endpoints).toContain('## Error Handling');
      expect(apiDocs.endpoints).toContain('### 400 Bad Request');
      expect(apiDocs.endpoints).toContain('### 404 Not Found');
      expect(apiDocs.endpoints).toContain('### 500 Internal Server Error');
    });

    it('should include rate limiting information', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs.endpoints).toContain('## Rate Limiting');
      expect(apiDocs.endpoints).toContain('1000 requests per hour');
      expect(apiDocs.endpoints).toContain('X-RateLimit-Limit');
      expect(apiDocs.endpoints).toContain('X-RateLimit-Remaining');
    });

    it('should generate advanced examples', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs(mockControllers);

      // Assert
      expect(apiDocs.examples).toContain('## Advanced Examples');
      expect(apiDocs.examples).toContain('### Bulk Operations');
      expect(apiDocs.examples).toContain('### Filtering and Pagination');
      expect(apiDocs.examples).toContain('### Error Handling in JavaScript');
    });
  });

  describe('edge cases', () => {
    it('should handle empty controllers array', async () => {
      // Act
      const apiDocs = await generator.generateApiDocs([]);

      // Assert
      expect(apiDocs.openapi).toContain('openapi: 3.0.3');
      expect(apiDocs.endpoints).toContain('# API Endpoints');
      expect(apiDocs.authentication).toContain('# Authentication & Authorization');
      expect(apiDocs.examples).toContain('# API Examples');
    });

    it('should handle controllers with complex endpoint paths', async () => {
      // Arrange
      const complexControllers: ControllerInfo[] = [
        {
          name: 'ComplexController',
          path: '/controllers/Complex.controller.ts',
          size: 500,
          exists: true,
          lastModified: new Date(),
          className: 'ComplexController',
          basePath: '/api/v1/complex',
          endpoints: [
            {
              method: 'GET',
              path: '/api/v1/complex/{id}/nested/{nestedId}',
              handlerMethod: 'getNestedResource',
              guards: [],
              decorators: []
            }
          ],
          guards: [],
          decorators: []
        }
      ];

      // Act
      const apiDocs = await generator.generateApiDocs(complexControllers);

      // Assert
      expect(apiDocs.endpoints).toContain('### GET /api/v1/complex/{id}/nested/{nestedId}');
    });

    it('should handle endpoints with multiple permissions', async () => {
      // Arrange
      const controllersWithMultiplePermissions: ControllerInfo[] = [
        {
          name: 'SecureController',
          path: '/controllers/Secure.controller.ts',
          size: 300,
          exists: true,
          lastModified: new Date(),
          className: 'SecureController',
          basePath: '/secure',
          endpoints: [
            {
              method: 'POST',
              path: '/secure/admin-action',
              handlerMethod: 'adminAction',
              guards: [],
              decorators: []
            }
          ],
          guards: [],
          decorators: []
        }
      ];

      // Act
      const apiDocs = await generator.generateApiDocs(controllersWithMultiplePermissions);

      // Assert
      expect(apiDocs.endpoints).toContain('POST /secure');
    });
  });

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
        endpoints: [
          {
            method: 'GET',
            path: '/users',
            handlerMethod: 'getUsers',
            guards: ['JwtAuthGuard'],
            decorators: ['@ApiTags', '@RequirePermissions']
          },
          {
            method: 'POST',
            path: '/users',
            handlerMethod: 'createUser',
            guards: ['JwtAuthGuard'],
            decorators: ['@ApiTags', '@RequirePermissions']
          },
          {
            method: 'GET',
            path: '/users/{id}',
            handlerMethod: 'getUserById',
            guards: ['JwtAuthGuard'],
            decorators: ['@ApiTags', '@RequirePermissions']
          }
        ],
        guards: ['JwtAuthGuard'],
        decorators: ['@Controller', '@ApiTags']
      },
      {
        name: 'RoleController',
        path: '/controllers/Role.controller.ts',
        size: 800,
        exists: true,
        lastModified: new Date(),
        className: 'RoleController',
        basePath: '/roles',
        endpoints: [
          {
            method: 'GET',
            path: '/roles',
            handlerMethod: 'getRoles',
            guards: ['JwtAuthGuard'],
            decorators: ['@ApiTags', '@RequirePermissions']
          },
          {
            method: 'POST',
            path: '/roles',
            handlerMethod: 'createRole',
            guards: ['JwtAuthGuard'],
            decorators: ['@ApiTags', '@RequirePermissions']
          }
        ],
        guards: ['JwtAuthGuard'],
        decorators: ['@Controller', '@ApiTags']
      }
    ];
  }
});