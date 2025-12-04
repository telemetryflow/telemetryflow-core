# IAM Module - Complete DDD Implementation Plan

## Overview
Complete Domain-Driven Design implementation for Identity & Access Management (IAM) core engine module.

## Module Structure

```
backend/src/modules/iam/
├── domain/                          # Domain Layer (Business Logic)
│   ├── aggregates/                  # Aggregate Roots
│   │   ├── User.ts                  # ✅ User aggregate (identity, profile, MFA)
│   │   ├── Role.ts                  # ✅ Role aggregate (permissions)
│   │   ├── Permission.ts            # ⚠️ Permission aggregate
│   │   ├── Group.ts                 # ⚠️ Group aggregate
│   │   ├── Region.ts                # ⚠️ Region aggregate
│   │   ├── Organization.ts          # ⚠️ Organization aggregate
│   │   ├── Workspace.ts             # ⚠️ Workspace aggregate
│   │   ├── Tenant.ts                # ✅ Tenant aggregate
│   │   └── AuditLog.ts              # ⚠️ AuditLog aggregate
│   ├── entities/                    # Domain Entities
│   │   ├── UserProfile.ts           # ✅ User profile entity
│   │   ├── MFASettings.ts           # ✅ MFA settings entity
│   │   └── UserRole.ts              # ⚠️ User-Role relationship
│   ├── value-objects/               # Value Objects
│   │   ├── UserId.ts                # ✅ User ID value object
│   │   ├── Email.ts                 # ✅ Email value object
│   │   ├── Password.ts              # ✅ Password value object
│   │   ├── RoleId.ts                # ✅ Role ID value object
│   │   ├── PermissionId.ts          # ⚠️ Permission ID
│   │   ├── TenantId.ts              # ✅ Tenant ID value object
│   │   └── OrganizationId.ts        # ⚠️ Organization ID
│   ├── events/                      # Domain Events
│   │   ├── UserCreatedEvent.ts      # ✅ User created event
│   │   ├── UserActivatedEvent.ts    # ✅ User activated event
│   │   ├── MFAEnabledEvent.ts       # ✅ MFA enabled event
│   │   ├── RoleAssignedEvent.ts     # ⚠️ Role assigned event
│   │   └── AuditLogCreatedEvent.ts  # ⚠️ Audit log created event
│   ├── repositories/                # Repository Interfaces
│   │   ├── IUserRepository.ts       # ✅ User repository interface
│   │   ├── IRoleRepository.ts       # ⚠️ Role repository interface
│   │   ├── IPermissionRepository.ts # ⚠️ Permission repository interface
│   │   ├── ITenantRepository.ts     # ⚠️ Tenant repository interface
│   │   └── IAuditLogRepository.ts   # ⚠️ Audit log repository interface
│   └── services/                    # Domain Services
│       ├── PasswordService.ts       # ✅ Password hashing/validation
│       ├── MFAService.ts            # ✅ MFA TOTP generation/validation
│       └── PermissionService.ts     # ⚠️ Permission evaluation
│
├── application/                     # Application Layer (Use Cases)
│   ├── commands/                    # Commands (Write Operations)
│   │   ├── users/
│   │   │   ├── CreateUserCommand.ts         # ✅ Create user
│   │   │   ├── UpdateUserCommand.ts         # ✅ Update user
│   │   │   ├── DeleteUserCommand.ts         # ✅ Delete user
│   │   │   ├── ActivateUserCommand.ts       # ✅ Activate user
│   │   │   ├── DeactivateUserCommand.ts     # ✅ Deactivate user
│   │   │   ├── ChangePasswordCommand.ts     # ✅ Change password
│   │   │   ├── EnableMFACommand.ts          # ✅ Enable MFA
│   │   │   └── DisableMFACommand.ts         # ✅ Disable MFA
│   │   ├── roles/
│   │   │   ├── CreateRoleCommand.ts         # ⚠️ Create role
│   │   │   ├── UpdateRoleCommand.ts         # ⚠️ Update role
│   │   │   ├── DeleteRoleCommand.ts         # ⚠️ Delete role
│   │   │   ├── AssignPermissionCommand.ts   # ⚠️ Assign permission
│   │   │   └── RemovePermissionCommand.ts   # ⚠️ Remove permission
│   │   ├── permissions/
│   │   │   ├── CreatePermissionCommand.ts   # ⚠️ Create permission
│   │   │   ├── UpdatePermissionCommand.ts   # ⚠️ Update permission
│   │   │   └── DeletePermissionCommand.ts   # ⚠️ Delete permission
│   │   ├── tenants/
│   │   │   ├── CreateTenantCommand.ts       # ⚠️ Create tenant
│   │   │   ├── UpdateTenantCommand.ts       # ⚠️ Update tenant
│   │   │   └── DeleteTenantCommand.ts       # ⚠️ Delete tenant
│   │   ├── organizations/
│   │   │   ├── CreateOrganizationCommand.ts # ⚠️ Create organization
│   │   │   ├── UpdateOrganizationCommand.ts # ⚠️ Update organization
│   │   │   └── DeleteOrganizationCommand.ts # ⚠️ Delete organization
│   │   ├── workspaces/
│   │   │   ├── CreateWorkspaceCommand.ts    # ⚠️ Create workspace
│   │   │   ├── UpdateWorkspaceCommand.ts    # ⚠️ Update workspace
│   │   │   └── DeleteWorkspaceCommand.ts    # ⚠️ Delete workspace
│   │   ├── regions/
│   │   │   ├── CreateRegionCommand.ts       # ⚠️ Create region
│   │   │   ├── UpdateRegionCommand.ts       # ⚠️ Update region
│   │   │   └── DeleteRegionCommand.ts       # ⚠️ Delete region
│   │   └── audit/
│   │       └── CreateAuditLogCommand.ts     # ⚠️ Create audit log
│   │
│   ├── queries/                     # Queries (Read Operations)
│   │   ├── users/
│   │   │   ├── GetUserQuery.ts              # ✅ Get user by ID
│   │   │   ├── ListUsersQuery.ts            # ✅ List users with filters
│   │   │   └── GetUserByEmailQuery.ts       # ✅ Get user by email
│   │   ├── roles/
│   │   │   ├── GetRoleQuery.ts              # ⚠️ Get role by ID
│   │   │   └── ListRolesQuery.ts            # ⚠️ List roles
│   │   ├── permissions/
│   │   │   ├── GetPermissionQuery.ts        # ⚠️ Get permission by ID
│   │   │   └── ListPermissionsQuery.ts      # ⚠️ List permissions
│   │   ├── tenants/
│   │   │   ├── GetTenantQuery.ts            # ⚠️ Get tenant by ID
│   │   │   └── ListTenantsQuery.ts          # ⚠️ List tenants
│   │   ├── organizations/
│   │   │   ├── GetOrganizationQuery.ts      # ⚠️ Get organization by ID
│   │   │   └── ListOrganizationsQuery.ts    # ⚠️ List organizations
│   │   ├── workspaces/
│   │   │   ├── GetWorkspaceQuery.ts         # ⚠️ Get workspace by ID
│   │   │   └── ListWorkspacesQuery.ts       # ⚠️ List workspaces
│   │   ├── regions/
│   │   │   ├── GetRegionQuery.ts            # ⚠️ Get region by ID
│   │   │   └── ListRegionsQuery.ts          # ⚠️ List regions
│   │   └── audit/
│   │       ├── GetAuditLogQuery.ts          # ⚠️ Get audit log by ID
│   │       ├── ListAuditLogsQuery.ts        # ⚠️ List audit logs
│   │       └── GetUserActivityQuery.ts      # ⚠️ Get user activity
│   │
│   └── handlers/                    # Command & Query Handlers
│       ├── users/
│       │   ├── CreateUserHandler.ts         # ✅ Create user handler
│       │   ├── UpdateUserHandler.ts         # ✅ Update user handler
│       │   ├── DeleteUserHandler.ts         # ✅ Delete user handler
│       │   ├── ActivateUserHandler.ts       # ✅ Activate user handler
│       │   ├── ChangePasswordHandler.ts     # ✅ Change password handler
│       │   ├── GetUserHandler.ts            # ✅ Get user handler
│       │   └── ListUsersHandler.ts          # ✅ List users handler
│       ├── roles/                           # ⚠️ Role handlers
│       ├── permissions/                     # ⚠️ Permission handlers
│       ├── tenants/                         # ⚠️ Tenant handlers
│       ├── organizations/                   # ⚠️ Organization handlers
│       ├── workspaces/                      # ⚠️ Workspace handlers
│       ├── regions/                         # ⚠️ Region handlers
│       └── audit/                           # ⚠️ Audit handlers
│
├── infrastructure/                  # Infrastructure Layer (Technical Details)
│   ├── persistence/
│   │   ├── entities/                # TypeORM Entities
│   │   │   ├── UserEntity.ts                # ⚠️ User entity (map to 'users' table)
│   │   │   ├── RoleEntity.ts                # ⚠️ Role entity (map to 'roles' table)
│   │   │   ├── PermissionEntity.ts          # ⚠️ Permission entity
│   │   │   ├── RolePermissionEntity.ts      # ⚠️ Role-Permission junction
│   │   │   ├── UserRoleEntity.ts            # ⚠️ User-Role junction
│   │   │   ├── TenantEntity.ts              # ⚠️ Tenant entity
│   │   │   ├── OrganizationEntity.ts        # ⚠️ Organization entity
│   │   │   ├── WorkspaceEntity.ts           # ⚠️ Workspace entity
│   │   │   ├── RegionEntity.ts              # ⚠️ Region entity
│   │   │   ├── GroupUserEntity.ts           # ⚠️ Group entity
│   │   │   ├── MFASecretEntity.ts           # ⚠️ MFA secret entity
│   │   │   ├── MFAAttemptEntity.ts          # ⚠️ MFA attempt entity
│   │   │   └── AuditLogEntity.ts            # ⚠️ Audit log entity (PostgreSQL)
│   │   ├── repositories/            # Repository Implementations
│   │   │   ├── UserRepository.ts            # ⚠️ User repository (PostgreSQL)
│   │   │   ├── RoleRepository.ts            # ⚠️ Role repository
│   │   │   ├── PermissionRepository.ts      # ⚠️ Permission repository
│   │   │   ├── TenantRepository.ts          # ⚠️ Tenant repository
│   │   │   ├── OrganizationRepository.ts    # ⚠️ Organization repository
│   │   │   ├── WorkspaceRepository.ts       # ⚠️ Workspace repository
│   │   │   ├── RegionRepository.ts          # ⚠️ Region repository
│   │   │   └── AuditLogRepository.ts        # ⚠️ Audit log repository (PostgreSQL)
│   │   ├── clickhouse/              # ClickHouse Schemas & Repositories
│   │   │   ├── AuditLog.clickhouse.ts       # ✅ ClickHouse audit log schema
│   │   │   └── ClickHouseAuditRepository.ts # ✅ ClickHouse audit repository
│   │   ├── migrations/              # Database Migrations
│   │   │   └── README.md                    # ⚠️ Note: Tables already exist, no migration needed
│   │   └── seeds/                   # Seed Data
│   │       ├── 001-regions.seed.ts          # ⚠️ Seed regions
│   │       ├── 002-organizations.seed.ts    # ⚠️ Seed organizations
│   │       ├── 003-workspaces.seed.ts       # ⚠️ Seed workspaces
│   │       ├── 004-tenants.seed.ts          # ⚠️ Seed tenants
│   │       ├── 005-permissions.seed.ts      # ⚠️ Seed permissions
│   │       ├── 006-roles.seed.ts            # ⚠️ Seed roles
│   │       └── 007-users.seed.ts            # ⚠️ Seed users
│   └── events/                      # Event Publishers
│       └── DomainEventPublisher.ts          # ⚠️ Event publisher
│
├── presentation/                    # Presentation Layer (API)
│   ├── controllers/
│   │   ├── UserController.ts                # ✅ User endpoints (8/8 complete)
│   │   ├── RoleController.ts                # ⚠️ Role endpoints (0/5)
│   │   ├── PermissionController.ts          # ⚠️ Permission endpoints (0/6)
│   │   ├── TenantController.ts              # ⚠️ Tenant endpoints (0/2)
│   │   ├── OrganizationController.ts        # ⚠️ Organization endpoints (0/7)
│   │   ├── WorkspaceController.ts           # ⚠️ Workspace endpoints (0/2)
│   │   ├── RegionController.ts              # ⚠️ Region endpoints (0/2)
│   │   └── AuditLogController.ts            # ⚠️ Audit endpoints (0/6)
│   ├── dtos/                        # Data Transfer Objects
│   │   ├── users/
│   │   │   ├── CreateUserDto.ts             # ✅ Create user DTO
│   │   │   ├── UpdateUserDto.ts             # ✅ Update user DTO
│   │   │   ├── UserResponseDto.ts           # ✅ User response DTO
│   │   │   └── ListUsersDto.ts              # ✅ List users DTO
│   │   ├── roles/                           # ⚠️ Role DTOs
│   │   ├── permissions/                     # ⚠️ Permission DTOs
│   │   ├── tenants/                         # ⚠️ Tenant DTOs
│   │   ├── organizations/                   # ⚠️ Organization DTOs
│   │   ├── workspaces/                      # ⚠️ Workspace DTOs
│   │   ├── regions/                         # ⚠️ Region DTOs
│   │   └── audit/                           # ⚠️ Audit DTOs
│   └── validators/                  # Request Validators
│       └── UserValidator.ts                 # ⚠️ User validation rules
│
├── docs/                            # Module Documentation
│   ├── MODULE.md                            # ⚠️ Module overview
│   ├── ARCHITECTURE.md                      # ⚠️ Architecture decisions
│   ├── API.md                               # ⚠️ API documentation
│   └── api/
│       └── openapi.yaml                     # ⚠️ OpenAPI specification
│
├── __tests__/                       # Module Tests
│   ├── unit/                        # Unit Tests
│   │   ├── domain/                          # ⚠️ Domain tests
│   │   ├── application/                     # ⚠️ Application tests
│   │   └── infrastructure/                  # ⚠️ Infrastructure tests
│   ├── integration/                 # Integration Tests
│   │   └── api/                             # ⚠️ API tests
│   └── e2e/                         # End-to-End Tests
│       └── iam.e2e-spec.ts                  # ⚠️ E2E tests
│
├── iam.module.ts                    # ✅ NestJS Module Configuration
└── package.json                     # ⚠️ Module-specific scripts (optional)
```

## Implementation Status

### ✅ Completed (Week 1 - Users Module)
- [x] User aggregate with domain logic
- [x] User commands (Create, Update, Delete, Activate, ChangePassword)
- [x] User queries (Get, List, GetByEmail)
- [x] User command handlers (7/7)
- [x] User query handlers (2/2)
- [x] User controller (8/8 endpoints)
- [x] User DTOs (Create, Update, Response, List)
- [x] Domain events (UserCreated, UserActivated, MFAEnabled)
- [x] Value objects (UserId, Email, Password, RoleId, TenantId)
- [x] Domain services (PasswordService, MFAService)
- [x] ClickHouse audit log schema & repository

### ⚠️ In Progress / Pending

#### Week 2: Roles Module (5 endpoints)
- [ ] Role aggregate
- [ ] Role commands (Create, Update, Delete, AssignPermission, RemovePermission)
- [ ] Role queries (Get, List)
- [ ] Role handlers
- [ ] Role controller
- [ ] Role DTOs
- [ ] RoleEntity (map to existing 'roles' table)
- [ ] RoleRepository

#### Week 3: Permissions Module (6 endpoints)
- [ ] Permission aggregate
- [ ] Permission commands (Create, Update, Delete)
- [ ] Permission queries (Get, List, CheckPermission)
- [ ] Permission handlers
- [ ] Permission controller
- [ ] Permission DTOs
- [ ] PermissionEntity (map to existing 'permissions' table)
- [ ] PermissionRepository
- [ ] PermissionService (permission evaluation)

#### Week 4: Tenants & Organizations (9 endpoints)
- [ ] Tenant aggregate
- [ ] Organization aggregate
- [ ] Workspace aggregate
- [ ] Region aggregate
- [ ] Commands for all 4 entities
- [ ] Queries for all 4 entities
- [ ] Handlers for all 4 entities
- [ ] Controllers (Tenant, Organization, Workspace, Region)
- [ ] DTOs for all 4 entities
- [ ] Entities (map to existing tables)
- [ ] Repositories

#### Week 5: Audit Logs Module (6 endpoints)
- [ ] AuditLog aggregate
- [ ] AuditLog commands (Create)
- [ ] AuditLog queries (Get, List, GetUserActivity, GetSuspiciousActivity, GetStatistics)
- [ ] AuditLog handlers
- [ ] AuditLog controller
- [ ] AuditLog DTOs
- [ ] AuditLogEntity (PostgreSQL)
- [ ] AuditLogRepository (PostgreSQL)
- [ ] ClickHouseAuditRepository (already created ✅)

#### Week 6: Groups Module (4 endpoints)
- [ ] Group aggregate
- [ ] Group commands (Create, Update, Delete, AddUser, RemoveUser)
- [ ] Group queries (Get, List)
- [ ] Group handlers
- [ ] Group controller
- [ ] Group DTOs
- [ ] GroupUserEntity (map to existing 'group_users' table)
- [ ] GroupRepository

#### Week 7: User Roles & Permissions (4 endpoints)
- [ ] UserRole entity
- [ ] UserPermission entity
- [ ] Commands (AssignRole, RemoveRole, GrantPermission, RevokePermission)
- [ ] Queries (GetUserRoles, GetUserPermissions)
- [ ] Handlers
- [ ] Controller endpoints
- [ ] DTOs

#### Week 8-12: Testing, Documentation, Optimization
- [ ] Unit tests for all aggregates
- [ ] Unit tests for all handlers
- [ ] Integration tests for all repositories
- [ ] E2E tests for all API endpoints
- [ ] API documentation (OpenAPI)
- [ ] Module documentation
- [ ] Architecture documentation
- [ ] Performance optimization
- [ ] Security audit

## Database Schema Alignment

### ⚠️ CRITICAL: Entity Mapping Required

All TypeORM entities MUST map to existing PostgreSQL tables:

```typescript
// Example: UserEntity.ts
@Entity('users')  // ← Map to existing 'users' table
export class UserEntity {
  @Column({ name: 'firstName' })  // ← Map to existing column names
  firstName: string;
  
  // ... other mappings
}
```

### Existing Tables (No Migration Needed)
- ✅ users (25 columns with MFA, lockout, password history)
- ✅ roles
- ✅ permissions
- ✅ role_permissions (junction table)
- ✅ user_roles (junction table)
- ✅ tenants
- ✅ workspaces
- ✅ organizations
- ✅ regions
- ✅ group_users
- ✅ mfa_secrets
- ✅ mfa_attempts
- ✅ audit_logs (PostgreSQL)
- ✅ audit_logs (ClickHouse)

## API Endpoints Progress

### Users (8/8 - 100% Complete) ✅
- [x] POST /api/v2/iam/users - Create user
- [x] GET /api/v2/iam/users - List users
- [x] GET /api/v2/iam/users/:id - Get user
- [x] PATCH /api/v2/iam/users/:id - Update user
- [x] DELETE /api/v2/iam/users/:id - Delete user
- [x] POST /api/v2/iam/users/:id/activate - Activate user
- [x] POST /api/v2/iam/users/:id/deactivate - Deactivate user
- [x] POST /api/v2/iam/users/:id/change-password - Change password

### Roles (0/5 - 0% Complete) ⚠️
- [ ] POST /api/v2/iam/roles - Create role
- [ ] GET /api/v2/iam/roles - List roles
- [ ] GET /api/v2/iam/roles/:id - Get role
- [ ] PATCH /api/v2/iam/roles/:id - Update role
- [ ] DELETE /api/v2/iam/roles/:id - Delete role

### Permissions (0/6 - 0% Complete) ⚠️
- [ ] POST /api/v2/iam/permissions - Create permission
- [ ] GET /api/v2/iam/permissions - List permissions
- [ ] GET /api/v2/iam/permissions/:id - Get permission
- [ ] PATCH /api/v2/iam/permissions/:id - Update permission
- [ ] DELETE /api/v2/iam/permissions/:id - Delete permission
- [ ] POST /api/v2/iam/permissions/check - Check permission

### Tenants (0/2 - 0% Complete) ⚠️
- [ ] POST /api/v2/iam/tenants - Create tenant
- [ ] GET /api/v2/iam/tenants - List tenants

### Organizations (0/7 - 0% Complete) ⚠️
- [ ] POST /api/v2/iam/organizations - Create organization
- [ ] GET /api/v2/iam/organizations - List organizations
- [ ] GET /api/v2/iam/organizations/:id - Get organization
- [ ] PATCH /api/v2/iam/organizations/:id - Update organization
- [ ] DELETE /api/v2/iam/organizations/:id - Delete organization
- [ ] GET /api/v2/iam/organizations/:id/workspaces - Get workspaces
- [ ] GET /api/v2/iam/organizations/:id/users - Get users

### Workspaces (0/2 - 0% Complete) ⚠️
- [ ] POST /api/v2/iam/workspaces - Create workspace
- [ ] GET /api/v2/iam/workspaces - List workspaces

### Regions (0/2 - 0% Complete) ⚠️
- [ ] POST /api/v2/iam/regions - Create region
- [ ] GET /api/v2/iam/regions - List regions

### Audit Logs (0/6 - 0% Complete) ⚠️
- [ ] GET /api/v2/iam/audit-logs - List audit logs
- [ ] GET /api/v2/iam/audit-logs/:id - Get audit log
- [ ] GET /api/v2/iam/audit-logs/user/:userId - Get user activity
- [ ] GET /api/v2/iam/audit-logs/suspicious - Get suspicious activity
- [ ] GET /api/v2/iam/audit-logs/statistics - Get statistics
- [ ] POST /api/v2/iam/audit-logs/export - Export audit logs

## Total Progress: 8/38 Endpoints (21%)

## Next Steps

1. **Week 2 (Current)**: Implement Roles module
   - Create Role aggregate
   - Implement role commands & queries
   - Create role handlers
   - Build role controller
   - Map RoleEntity to existing 'roles' table

2. **Week 3**: Implement Permissions module
   - Create Permission aggregate
   - Implement permission commands & queries
   - Create permission handlers
   - Build permission controller
   - Implement PermissionService for RBAC

3. **Week 4**: Implement Tenants & Organizations
   - Create all 4 aggregates (Tenant, Organization, Workspace, Region)
   - Implement multi-tenancy hierarchy
   - Create all handlers
   - Build all controllers

4. **Week 5**: Implement Audit Logs
   - Create AuditLog aggregate
   - Implement audit queries (PostgreSQL + ClickHouse)
   - Create audit handlers
   - Build audit controller

5. **Week 6-12**: Complete remaining modules, testing, and documentation

## Key Decisions

1. **No Database Migration**: All tables already exist. Only entity mapping required.
2. **Multi-Database**: PostgreSQL for OLTP, ClickHouse for OLAP (audit logs).
3. **CQRS Pattern**: Separate commands and queries for better scalability.
4. **Event-Driven**: Domain events for cross-module communication.
5. **Zero Dependencies**: Each module is self-contained (except shared kernel).

## Success Criteria

- [ ] All 38 API endpoints implemented
- [ ] 100% test coverage (unit + integration + E2E)
- [ ] Complete API documentation (OpenAPI)
- [ ] Performance benchmarks (< 100ms response time)
- [ ] Security audit passed
- [ ] Production-ready deployment
