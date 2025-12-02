# TelemetryFlow Core - Setup Guide

## Overview

TelemetryFlow Core is a backend-only application featuring the IAM (Identity and Access Management) module built with Domain-Driven Design (DDD) principles and CQRS pattern.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 16+
- Docker & Docker Compose (optional, for database)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database

#### Option A: Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432.

#### Option B: Using Existing PostgreSQL

Update `.env` file with your PostgreSQL credentials.

### 3. Configure Environment

The `.env` file is already created with default values. Update if needed:

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=telemetryflow_core

# JWT
JWT_SECRET=telemetryflow-core-secret-key-change-in-production
JWT_EXPIRES_IN=1d
```

### 4. Seed Database

```bash
pnpm run db:seed:iam
```

This will create:
- Database tables
- Sample tenants, organizations, workspaces
- Sample users with roles and permissions
- Sample regions

### 5. Start Development Server

```bash
pnpm run dev
```

The application will be available at:
- API: http://localhost:3000
- Swagger Documentation: http://localhost:3000/api

## Project Structure

```
telemetryflow-core/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── shared/                 # Shared domain primitives
│   │   └── domain/
│   │       ├── Entity.ts
│   │       ├── ValueObject.ts
│   │       ├── AggregateRoot.ts
│   │       └── DomainEvent.ts
│   └── modules/
│       └── iam/                # IAM Module (DDD)
│           ├── domain/         # Business logic
│           │   ├── aggregates/     # User, Role, Permission, Tenant, etc.
│           │   ├── entities/       # MFASettings, UserProfile
│           │   ├── value-objects/  # UserId, Email, RoleId, etc.
│           │   ├── events/         # Domain events
│           │   ├── repositories/   # Repository interfaces
│           │   └── services/       # Domain services
│           ├── application/    # Use cases (CQRS)
│           │   ├── commands/       # Write operations
│           │   ├── queries/        # Read operations
│           │   ├── handlers/       # Command/Query handlers
│           │   └── dto/            # Application DTOs
│           ├── infrastructure/ # Technical implementation
│           │   ├── persistence/    # TypeORM repositories & entities
│           │   └── messaging/      # Event processors
│           └── presentation/   # API layer
│               ├── controllers/    # REST controllers
│               ├── dto/            # Request/Response DTOs
│               ├── guards/         # Authorization guards
│               └── decorators/     # Custom decorators
├── scripts/
│   └── seed-iam.ts            # Database seeding script
├── docker-compose.yml          # PostgreSQL container
├── package.json
├── tsconfig.json
└── README.md
```

## IAM Module Features

### Multi-Tenant Hierarchy
- **Tenant**: Top-level organization
- **Organization**: Business unit within tenant
- **Workspace**: Project/team workspace within organization
- **Region**: Geographic deployment region

### User Management
- User CRUD operations
- User activation/deactivation
- Password management
- User profiles

### Access Control
- **RBAC**: Role-Based Access Control
- **Direct Permissions**: Assign permissions directly to users
- **Group Management**: User groups with inherited permissions
- **Permission Service**: Centralized permission evaluation

### Domain Events
- UserCreated, UserUpdated
- RoleAssigned, RoleRevoked
- PermissionAssigned, PermissionRevoked
- TenantCreated, OrganizationCreated, WorkspaceCreated
- And more...

## API Endpoints

### Users
- `POST /api/users` - Create user
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/activate` - Activate user

### Roles
- `POST /api/roles` - Create role
- `GET /api/roles` - List roles
- `GET /api/roles/:id` - Get role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `POST /api/roles/:roleId/users/:userId` - Assign role to user
- `DELETE /api/roles/:roleId/users/:userId` - Revoke role from user

### Permissions
- `POST /api/permissions` - Create permission
- `GET /api/permissions` - List permissions
- `GET /api/permissions/:id` - Get permission
- `PUT /api/permissions/:id` - Update permission
- `DELETE /api/permissions/:id` - Delete permission

### Tenants
- `POST /api/tenants` - Create tenant
- `GET /api/tenants` - List tenants
- `GET /api/tenants/:id` - Get tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - List organizations
- `GET /api/organizations/:id` - Get organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces` - List workspaces
- `GET /api/workspaces/:id` - Get workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - List groups
- `GET /api/groups/:id` - Get group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:groupId/users/:userId` - Add user to group
- `DELETE /api/groups/:groupId/users/:userId` - Remove user from group

### Regions
- `POST /api/regions` - Create region
- `GET /api/regions` - List regions
- `GET /api/regions/:id` - Get region
- `PUT /api/regions/:id` - Update region
- `DELETE /api/regions/:id` - Delete region

## Development

### Available Scripts

```bash
# Development
pnpm run dev              # Start with hot reload
pnpm run start:debug      # Start with debugger

# Build
pnpm run build            # Build for production
pnpm run start            # Start production build

# Testing
pnpm run test             # Run tests
pnpm run test:watch       # Run tests in watch mode
pnpm run test:cov         # Run tests with coverage

# Code Quality
pnpm run lint             # Lint and fix code

# Database
pnpm run db:seed:iam      # Seed IAM data
```

### Testing

The IAM module includes comprehensive tests:
- Unit tests for domain aggregates
- Unit tests for command/query handlers
- Integration tests for controllers
- E2E tests for API endpoints

Run tests:
```bash
npm run test
```

## Architecture Patterns

### Domain-Driven Design (DDD)
- **Aggregates**: User, Role, Permission, Tenant, Organization, Workspace, Group, Region
- **Value Objects**: UserId, Email, RoleId, TenantId, etc.
- **Domain Events**: Event-driven communication
- **Domain Services**: Complex business logic

### CQRS (Command Query Responsibility Segregation)
- **Commands**: Write operations (Create, Update, Delete)
- **Queries**: Read operations (Get, List)
- **Handlers**: Separate handlers for commands and queries

### Clean Architecture
- **Domain Layer**: Pure business logic, no dependencies
- **Application Layer**: Use cases, orchestration
- **Infrastructure Layer**: Database, external services
- **Presentation Layer**: API controllers, DTOs

## Database Schema

### Core Tables
- `users` - User accounts
- `roles` - Role definitions
- `permissions` - Permission definitions
- `tenants` - Tenant organizations
- `organizations` - Business units
- `workspaces` - Project workspaces
- `groups` - User groups
- `regions` - Geographic regions

### Mapping Tables
- `user_roles` - User-Role assignments
- `user_permissions` - Direct user-permission assignments
- `role_permissions` - Role-Permission mappings
- `group_users` - Group-User memberships
- `group_permissions` - Group-Permission mappings

## Production Deployment

### Environment Variables

Update these for production:

```env
NODE_ENV=production
PORT=3000

# Use strong database credentials
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-db-user
DB_PASSWORD=your-strong-password
DB_DATABASE=telemetryflow_core

# Use strong JWT secret
JWT_SECRET=your-very-strong-secret-key-min-32-chars
JWT_EXPIRES_IN=1d
```

### Build and Run

```bash
# Build
pnpm run build

# Start
pnpm run start
```

### Docker Deployment

Create a Dockerfile:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

Build and run:
```bash
docker build -t telemetryflow-core .
docker run -p 3000:3000 --env-file .env telemetryflow-core
```

## Troubleshooting

### Database Connection Issues

1. Check PostgreSQL is running:
```bash
docker-compose ps
```

2. Test connection:
```bash
psql -h localhost -U postgres -d telemetryflow_core
```

3. Check environment variables in `.env`

### Port Already in Use

Change the PORT in `.env` file:
```env
PORT=3001
```

### Module Not Found Errors

Reinstall dependencies:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Support

For issues and questions:
- Check the [README.md](./README.md)
- Review IAM module documentation in `src/modules/iam/docs/`
- Check API documentation at http://localhost:3000/api

## License

See LICENSE file for details.
