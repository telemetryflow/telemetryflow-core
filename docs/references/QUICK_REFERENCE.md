# TelemetryFlow Core - Quick Reference

## 🚀 Quick Start

```bash
# Full bootstrap (recommended)
bash scripts/bootstrap.sh --dev

# Or step by step
pnpm install
docker-compose up -d
pnpm run db:seed:iam
pnpm run dev
```

Access: http://localhost:3000/api

## 📁 Project Structure

```
telemetryflow-core/
├── src/
│   ├── main.ts              # Entry point
│   ├── app.module.ts        # Root module
│   ├── shared/domain/       # DDD base classes
│   └── modules/iam/         # IAM module
│       ├── domain/          # Business logic
│       ├── application/     # Use cases (CQRS)
│       ├── infrastructure/  # Database, events
│       └── presentation/    # API controllers
├── scripts/
│   └── seed-iam.ts         # Database seeding
├── docker-compose.yml       # PostgreSQL
└── .env                     # Configuration
```

## 🎯 Common Commands

```bash
# Bootstrap
bash scripts/bootstrap.sh           # Full setup
bash scripts/bootstrap.sh --dev     # Setup and start dev
bash scripts/bootstrap.sh --skip-seed  # Skip seeding

# Development
pnpm run dev              # Start with hot reload
pnpm run start:debug      # Start with debugger

# Build & Run
pnpm run build            # Build for production
pnpm run start            # Start production

# Database
docker-compose up -d     # Start PostgreSQL
docker-compose down      # Stop PostgreSQL
pnpm run db:seed         # Seed all data
pnpm run db:seed:iam     # Seed IAM only
pnpm run db:generate-sample --count 50  # Generate sample data

# Testing
pnpm run test             # Run tests
pnpm run test:watch       # Watch mode
pnpm run test:cov         # With coverage

# Code Quality
pnpm run lint             # Lint and fix
```

## 🔑 Key Endpoints

### Users
```
POST   /api/users              Create user
GET    /api/users              List users
GET    /api/users/:id          Get user
PUT    /api/users/:id          Update user
DELETE /api/users/:id          Delete user
POST   /api/users/:id/activate Activate user
```

### Roles
```
POST   /api/roles                      Create role
GET    /api/roles                      List roles
GET    /api/roles/:id                  Get role
PUT    /api/roles/:id                  Update role
DELETE /api/roles/:id                  Delete role
POST   /api/roles/:roleId/users/:userId   Assign role
DELETE /api/roles/:roleId/users/:userId   Revoke role
```

### Permissions
```
POST   /api/permissions        Create permission
GET    /api/permissions        List permissions
GET    /api/permissions/:id    Get permission
PUT    /api/permissions/:id    Update permission
DELETE /api/permissions/:id    Delete permission
```

### Tenants
```
POST   /api/tenants            Create tenant
GET    /api/tenants            List tenants
GET    /api/tenants/:id        Get tenant
PUT    /api/tenants/:id        Update tenant
DELETE /api/tenants/:id        Delete tenant
```

### Organizations
```
POST   /api/organizations      Create organization
GET    /api/organizations      List organizations
GET    /api/organizations/:id  Get organization
PUT    /api/organizations/:id  Update organization
DELETE /api/organizations/:id  Delete organization
```

### Workspaces
```
POST   /api/workspaces         Create workspace
GET    /api/workspaces         List workspaces
GET    /api/workspaces/:id     Get workspace
PUT    /api/workspaces/:id     Update workspace
DELETE /api/workspaces/:id     Delete workspace
```

### Groups
```
POST   /api/groups                     Create group
GET    /api/groups                     List groups
GET    /api/groups/:id                 Get group
PUT    /api/groups/:id                 Update group
DELETE /api/groups/:id                 Delete group
POST   /api/groups/:groupId/users/:userId  Add user to group
DELETE /api/groups/:groupId/users/:userId  Remove user from group
```

### Regions
```
POST   /api/regions            Create region
GET    /api/regions            List regions
GET    /api/regions/:id        Get region
PUT    /api/regions/:id        Update region
DELETE /api/regions/:id        Delete region
```

## 🏗️ Architecture Patterns

### DDD Layers
```
Domain Layer         → Business logic (aggregates, entities, value objects)
Application Layer    → Use cases (commands, queries, handlers)
Infrastructure Layer → Technical details (database, messaging)
Presentation Layer   → API (controllers, DTOs, guards)
```

### CQRS Pattern
```
Commands → Write operations → Command Handlers
Queries  → Read operations  → Query Handlers
```

### Multi-Tenant Hierarchy
```
Tenant
  └── Organization
       └── Workspace
            └── Users, Roles, Permissions
```

## 📊 Database Schema

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
- `user_permissions` - Direct user permissions
- `role_permissions` - Role-Permission mappings
- `group_users` - Group memberships
- `group_permissions` - Group permissions

## 🔐 Environment Variables

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
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
```

## 🧪 Testing

```bash
# Run all tests
pnpm run test

# Run specific test file
pnpm run test -- User.spec.ts

# Run with coverage
pnpm run test:cov

# Watch mode
pnpm run test:watch
```

## 📦 Key Dependencies

```json
{
  "@nestjs/common": "^11.1.9",
  "@nestjs/core": "^11.1.9",
  "@nestjs/cqrs": "^11.0.3",
  "@nestjs/typeorm": "^11.0.0",
  "typeorm": "^0.3.27",
  "pg": "^8.16.3",
  "argon2": "^0.44.0",
  "class-validator": "^0.14.3"
}
```

## 🎨 DDD Components

### Aggregates (8)
- User, Role, Permission
- Tenant, Organization, Workspace
- Group, Region

### Value Objects (10)
- UserId, Email, RoleId
- TenantId, OrganizationId, WorkspaceId
- PermissionId, GroupId, RegionId
- UserRole

### Domain Events (25+)
- UserCreated, RoleAssigned, PermissionGranted
- TenantCreated, OrganizationCreated
- WorkspaceCreated, GroupCreated
- And more...

### Commands (33)
- Create*, Update*, Delete* operations
- AssignRoleToUser, RevokeRoleFromUser
- AssignPermissionToUser, RevokePermissionFromUser
- AddUserToGroup, RemoveUserFromGroup
- ActivateUser, ChangePassword

### Queries (18)
- Get*, List* operations
- GetUserRoles, GetUserPermissions
- GetRoleUsers

## 🔍 Troubleshooting

### Port in use
```bash
# Change port in .env
PORT=3001
```

### Database connection failed
```bash
# Check PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Module not found
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeORM sync issues
```bash
# Drop and recreate database
docker-compose down -v
docker-compose up -d
pnpm run db:seed:iam
```

## 📚 Documentation

- [README.md](./README.md) - Main documentation
- [SETUP.md](./SETUP.md) - Detailed setup guide
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Project overview
- [src/modules/iam/README.md](./src/modules/iam/README.md) - IAM module docs
- [src/modules/iam/docs/](./src/modules/iam/docs/) - Additional docs

## 🌐 URLs

- Application: http://localhost:3000
- Swagger UI: http://localhost:3000/api
- Health Check: http://localhost:3000/health

## 💡 Tips

1. **Use Swagger UI** for API exploration and testing
2. **Check logs** for debugging: `docker-compose logs -f`
3. **Run tests** before committing: `pnpm run test`
4. **Lint code** regularly: `pnpm run lint`
5. **Read IAM docs** in `src/modules/iam/docs/` for detailed info

## 🎯 Next Steps

1. Add authentication (JWT)
2. Add authorization guards
3. Add MFA support
4. Add audit logging
5. Add caching (Redis)
6. Add rate limiting
7. Add API keys
8. Add SSO integration

## 📞 Support

For issues:
1. Check documentation
2. Review error logs
3. Check database connection
4. Verify environment variables
5. Review IAM module docs

## 🔖 Version

- **Version**: 1.0.0
- **NestJS**: 11.x
- **TypeScript**: 5.9
- **PostgreSQL**: 16
- **Node.js**: 18+
