/**
 * Tests for DocumentationValidator
 */

import { DocumentationValidatorImpl } from '../documentation-validator';
import { IssueSeverity } from '../../../interfaces/validation.interface';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn()
}));

describe('DocumentationValidator', () => {
  let validator: DocumentationValidatorImpl;
  const mockFs = require('fs/promises');

  beforeEach(() => {
    validator = new DocumentationValidatorImpl();
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should fail validation when README.md is missing', async () => {
      // Arrange
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const target = {
        modulePath: '/test/module',
        moduleName: 'test-module'
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThanOrEqual(1);
      expect(result.issues.some(issue => issue.message.includes('README.md file does not exist'))).toBe(true);
    });

    it('should pass validation with complete documentation', async () => {
      // Arrange - Create a comprehensive README that meets 500+ line requirement
      const baseContent = `# Test Module

## Overview
This is a comprehensive test module with all required sections and detailed documentation.
The module implements a complete Domain-Driven Design (DDD) architecture with CQRS patterns.
It provides robust functionality for managing business entities and use cases.
This module serves as a reference implementation for best practices in software architecture.
The implementation follows industry standards and provides comprehensive functionality.

## Architecture
The module follows DDD patterns with clear separation of concerns across four distinct layers:

### Domain Layer
- Contains business logic and domain entities
- Implements aggregates, value objects, and domain events
- Defines repository interfaces for data access
- Maintains business invariants and rules
- Provides domain services for complex business operations
- Ensures data consistency and business rule enforcement

### Application Layer
- Implements use cases through CQRS commands and queries
- Contains command and query handlers
- Manages application-specific business logic
- Coordinates between domain and infrastructure layers
- Handles cross-cutting concerns like validation and authorization
- Provides application services for orchestrating complex workflows

### Infrastructure Layer
- Provides concrete implementations of repository interfaces
- Handles database persistence through TypeORM entities
- Manages external service integrations
- Implements messaging and event processing
- Handles technical concerns like caching and logging
- Provides adapters for external systems and APIs

### Presentation Layer
- Exposes REST API endpoints through controllers
- Handles request/response transformation
- Implements authentication and authorization
- Provides API documentation through Swagger
- Manages HTTP-specific concerns like routing and middleware
- Handles input validation and error responses

## Features
- Feature 1: Complete CRUD operations for all entities
- Feature 2: Comprehensive validation and error handling
- Feature 3: Full audit logging and traceability
- Feature 4: Role-based access control (RBAC)
- Feature 5: Event-driven architecture with domain events
- Feature 6: Comprehensive test coverage (>90%)
- Feature 7: API documentation with OpenAPI/Swagger
- Feature 8: Database migrations and seeding
- Feature 9: Performance monitoring and metrics
- Feature 10: Security best practices implementation
- Feature 11: Caching and performance optimization
- Feature 12: Internationalization and localization support
- Feature 13: Real-time notifications and updates
- Feature 14: Advanced search and filtering capabilities
- Feature 15: Data export and import functionality

## API Documentation
Complete API documentation with examples and detailed endpoint descriptions.
All endpoints are documented using OpenAPI/Swagger specifications.
The API follows REST conventions and provides consistent response formats.

### Authentication Endpoints
- POST /auth/login - User authentication with email and password
- POST /auth/logout - User logout and session termination
- POST /auth/refresh - JWT token refresh for extended sessions
- POST /auth/forgot-password - Password reset request
- POST /auth/reset-password - Password reset confirmation
- GET /auth/profile - Get current user profile information

### User Management Endpoints
- GET /users - List all users with pagination and filtering
- GET /users/:id - Get user by ID with detailed information
- POST /users - Create new user with validation
- PUT /users/:id - Update user information completely
- PATCH /users/:id - Partial user information update
- DELETE /users/:id - Soft delete user account
- POST /users/:id/activate - Activate user account
- POST /users/:id/deactivate - Deactivate user account

### Role Management Endpoints
- GET /roles - List all roles with permissions
- GET /roles/:id - Get role by ID with detailed permissions
- POST /roles - Create new role with permission assignment
- PUT /roles/:id - Update role information and permissions
- DELETE /roles/:id - Delete role (if not assigned to users)
- POST /roles/:id/permissions - Add permissions to role
- DELETE /roles/:id/permissions/:permissionId - Remove permission from role

### Permission Management Endpoints
- GET /permissions - List all available permissions
- GET /permissions/:id - Get permission details
- POST /permissions - Create new permission
- PUT /permissions/:id - Update permission information
- DELETE /permissions/:id - Delete permission (if not assigned)

## Database Schema
Detailed database schema with relationships and constraints.
The schema is designed for optimal performance and data integrity.

### Core Tables
- users: User account information with authentication details
- roles: Role definitions with hierarchical structure
- permissions: System permissions with resource-action mapping
- user_roles: Many-to-many relationship between users and roles
- role_permissions: Many-to-many relationship between roles and permissions
- organizations: Multi-tenant organization structure
- tenants: Tenant-specific configuration and settings
- workspaces: Workspace organization within tenants

### Audit Tables
- audit_logs: Complete audit trail of all operations
- user_sessions: Active user session tracking and management
- login_attempts: Failed login attempt tracking for security
- password_history: Password change history for compliance
- permission_changes: Permission assignment change tracking

### Configuration Tables
- system_settings: Global system configuration parameters
- user_preferences: User-specific preference settings
- notification_settings: Notification configuration per user
- feature_flags: Feature toggle configuration
- api_keys: API key management for external integrations

## Getting Started
Step-by-step guide to get started with the module.
Follow these instructions to set up a complete development environment.

### Prerequisites
- Node.js 18+ installed on your system
- PostgreSQL 14+ database server
- pnpm package manager (recommended over npm)
- Docker and Docker Compose (for containerized development)
- Git for version control
- IDE with TypeScript support (VS Code recommended)

### Installation
1. Clone the repository from the main branch
2. Install dependencies: pnpm install
3. Copy environment template: cp .env.example .env
4. Set up environment variables in .env file
5. Start database services: docker-compose up -d postgres
6. Run database migrations: pnpm db:migrate
7. Seed initial data: pnpm db:seed
8. Start development server: pnpm dev
9. Access API documentation at http://localhost:3000/api
10. Run tests to verify setup: pnpm test

### Configuration
Configure the following environment variables in your .env file:

#### Database Configuration
- DATABASE_URL: PostgreSQL connection string
- DATABASE_HOST: Database server hostname
- DATABASE_PORT: Database server port (default: 5432)
- DATABASE_NAME: Database name
- DATABASE_USERNAME: Database username
- DATABASE_PASSWORD: Database password

#### Authentication Configuration
- JWT_SECRET: Secret key for JWT tokens (minimum 32 characters)
- JWT_EXPIRES_IN: Token expiration time (default: 24h)
- SESSION_SECRET: Secret key for sessions (minimum 32 characters)
- BCRYPT_ROUNDS: Password hashing rounds (default: 12)

#### Application Configuration
- NODE_ENV: Environment (development, production, test)
- PORT: Application port (default: 3000)
- API_PREFIX: API route prefix (default: /api)
- CORS_ORIGIN: Allowed CORS origins
- RATE_LIMIT_MAX: Maximum requests per window
- RATE_LIMIT_WINDOW: Rate limiting window in milliseconds

## Testing
Comprehensive testing strategy and examples covering all layers.
The testing approach ensures high code quality and reliability.

### Unit Tests
- Domain entity tests with comprehensive business logic validation
- Value object validation tests with edge cases
- Command/query handler tests with mocking
- Repository implementation tests with database mocking
- Service layer tests with dependency injection
- Utility function tests with various input scenarios

### Integration Tests
- Database integration tests with real database connections
- API endpoint tests with complete request/response cycles
- Service integration tests with external dependencies
- Event handling tests with message processing
- Authentication flow tests with real JWT tokens
- Permission validation tests with role-based access

### End-to-End Tests
- Complete user workflow tests from registration to usage
- Authentication flow tests with multiple user types
- Permission validation tests across different roles
- API integration tests with real HTTP requests
- Database transaction tests with rollback scenarios
- Error handling tests with various failure modes

### Performance Tests
- Load testing with multiple concurrent users
- Stress testing with high request volumes
- Memory usage profiling and optimization
- Database query performance analysis
- API response time benchmarking
- Scalability testing with increasing load

### Test Commands
- pnpm test: Run all tests with coverage reporting
- pnpm test:unit: Run unit tests only
- pnpm test:integration: Run integration tests with database
- pnpm test:e2e: Run end-to-end tests with full application
- pnpm test:coverage: Generate detailed coverage report
- pnpm test:watch: Run tests in watch mode for development
- pnpm test:debug: Run tests with debugging enabled

## Development Guide
Guidelines for developers contributing to this module.
Follow these standards to maintain code quality and consistency.

### Code Standards
- Follow TypeScript strict mode configuration
- Use ESLint and Prettier for consistent code formatting
- Implement comprehensive error handling with custom exceptions
- Write descriptive commit messages following conventional commits
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Follow SOLID principles in class design
- Implement proper logging for debugging and monitoring

### Architecture Patterns
- Follow DDD principles strictly with clear boundaries
- Implement CQRS for command/query separation
- Use dependency injection for loose coupling
- Apply SOLID principles throughout the codebase
- Implement repository pattern for data access
- Use factory pattern for complex object creation
- Apply observer pattern for event handling
- Implement strategy pattern for algorithm variations

### Database Guidelines
- Use migrations for all schema changes
- Implement proper indexing for query performance
- Follow naming conventions for tables and columns
- Use soft deletes where data retention is required
- Implement foreign key constraints for data integrity
- Use transactions for multi-table operations
- Optimize queries for performance
- Document complex queries with comments

### API Guidelines
- Follow REST conventions for endpoint design
- Implement proper HTTP status codes
- Use consistent error response format across endpoints
- Document all endpoints with Swagger/OpenAPI
- Implement request validation with class-validator
- Use DTOs for request/response transformation
- Implement proper authentication and authorization
- Add rate limiting for API protection

### Security Guidelines
- Validate all input data thoroughly
- Use parameterized queries to prevent SQL injection
- Implement proper authentication mechanisms
- Use HTTPS for all communications
- Store sensitive data securely
- Implement proper session management
- Use CORS configuration appropriately
- Regular security audits and updates

## License
Apache-v2.0 License for open source usage and distribution.
See LICENSE file for complete terms and conditions.

## Additional Documentation
For more detailed information, see the docs/ directory:
- API Reference: Complete endpoint documentation with examples
- Architecture Diagrams: Visual representation of system design
- Database Schema: Detailed ERD and table specifications
- Development Workflows: Step-by-step development processes
- Deployment Guide: Production deployment instructions
- Troubleshooting: Common issues and solutions

## Code Examples

\`\`\`typescript
// Example: Creating a new user
const createUserCommand = new CreateUserCommand(
  'user@example.com',
  'John Doe',
  'organization-id'
);

const result = await commandBus.execute(createUserCommand);
console.log('User created successfully:', result);
\`\`\`

\`\`\`typescript
// Example: Querying users with pagination
const getUserQuery = new GetUserQuery('user-id');
const user = await queryBus.execute(getUserQuery);

const listUsersQuery = new ListUsersQuery({
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'DESC'
});
const users = await queryBus.execute(listUsersQuery);
\`\`\`

\`\`\`typescript
// Example: Role assignment with validation
const assignRoleCommand = new AssignRoleCommand(
  'user-id',
  'role-id'
);

try {
  await commandBus.execute(assignRoleCommand);
  console.log('Role assigned successfully');
} catch (error) {
  console.error('Role assignment failed:', error.message);
}
\`\`\`

\`\`\`typescript
// Example: Event handling
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    // Send welcome notification
    await this.notificationService.sendWelcomeEmail(event.userId);
    
    // Log audit event
    await this.auditService.logUserCreation(event);
  }
}
\`\`\`

\`\`\`typescript
// Example: Repository implementation
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userMapper: UserMapper
  ) {}

  async save(user: User): Promise<void> {
    const entity = this.userMapper.toEntity(user);
    await this.userRepository.save(entity);
  }

  async findById(id: UserId): Promise<User | null> {
    const entity = await this.userRepository.findOne({
      where: { id: id.value },
      relations: ['roles', 'permissions']
    });
    
    return entity ? this.userMapper.toDomain(entity) : null;
  }
}
\`\`\`

## Contributing
We welcome contributions from the community. Please follow these guidelines:

1. Fork the repository and create a feature branch
2. Follow the coding standards and architecture patterns
3. Write comprehensive tests for new functionality
4. Update documentation for any API changes
5. Submit a pull request with detailed description
6. Ensure all CI/CD checks pass
7. Respond to code review feedback promptly

## Support
For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting documentation
- Review existing issues and discussions
- Contact the development team for urgent matters

## Changelog
See CHANGELOG.md for detailed version history and changes.

## Roadmap
See ROADMAP.md for planned features and improvements.
`;

      // Create content that's definitely over 500 lines
      const lines = baseContent.split('\n');
      
      // Ensure we have over 500 lines by repeating if necessary
      let finalContent = baseContent;
      while (finalContent.split('\n').length < 520) {
        finalContent += '\n\n## Additional Section\nThis is additional content to ensure we meet the minimum line requirement.\n';
      }

      // Mock file system calls
      mockFs.readFile.mockImplementation((path: string) => {
        if (path.includes('README.md')) {
          return Promise.resolve(finalContent);
        }
        return Promise.reject(new Error('File not found'));
      });

      mockFs.access.mockImplementation((path: string) => {
        if (path.includes('docs')) {
          return Promise.resolve(undefined); // docs directory exists
        }
        return Promise.reject(new Error('Path not found'));
      });

      mockFs.readdir.mockImplementation((path: string) => {
        if (path.includes('docs')) {
          return Promise.resolve(['api-reference.md', 'architecture.md']); // docs directory has files
        }
        return Promise.resolve([]);
      });

      mockFs.stat.mockImplementation((path: string) => {
        if (path.includes('docs')) {
          return Promise.resolve({
            isDirectory: () => true,
            size: 1024,
            mtime: new Date()
          });
        } else if (path.includes('README.md')) {
          return Promise.resolve({
            isDirectory: () => false,
            size: finalContent.length,
            mtime: new Date()
          });
        }
        return Promise.reject(new Error('Path not found'));
      });

      const target = {
        modulePath: '/test/module',
        moduleName: 'test-module'
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(80);
      expect(result.metadata?.moduleName).toBe('test-module');
    });

    it('should identify missing required sections', async () => {
      // Arrange
      const incompleteReadme = `
# Test Module

## Overview
Basic overview only.
      `;

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(incompleteReadme);
      mockFs.stat.mockResolvedValue({
        size: incompleteReadme.length,
        mtime: new Date()
      });

      const target = {
        modulePath: '/test/module',
        moduleName: 'test-module'
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      
      const missingSectionIssues = result.issues.filter(issue => 
        issue.message.includes('section') && issue.message.includes('missing')
      );
      expect(missingSectionIssues.length).toBeGreaterThan(0);
    });

    it('should handle validation errors gracefully', async () => {
      // Arrange
      mockFs.readFile.mockRejectedValue(new Error('Permission denied'));

      const target = {
        modulePath: '/invalid/path',
        moduleName: 'invalid-module'
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.severity === IssueSeverity.ERROR)).toBe(true);
    });
  });

  describe('getRequirements', () => {
    it('should return all documentation requirements', () => {
      // Act
      const requirements = validator.getRequirements();

      // Assert
      expect(requirements).toHaveLength(6);
      expect(requirements.map(r => r.id)).toContain('readme-exists');
      expect(requirements.map(r => r.id)).toContain('readme-length');
      expect(requirements.map(r => r.id)).toContain('readme-sections');
      expect(requirements.map(r => r.id)).toContain('api-docs-exist');
      expect(requirements.map(r => r.id)).toContain('openapi-spec');
      expect(requirements.map(r => r.id)).toContain('diagrams-exist');
    });
  });
});