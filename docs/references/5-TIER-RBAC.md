# 5-Tier RBAC System

TelemetryFlow Core implements a comprehensive 5-tier Role-Based Access Control system.

## Role Hierarchy

```
Tier 1: Super Administrator (Global)
  └─ Tier 2: Administrator (Organization-scoped)
      └─ Tier 3: Developer (Create/Read/Update)
          └─ Tier 4: Viewer (Read-only)
              └─ Tier 5: Demo (Demo org only)
```

## Roles

### Tier 1: Super Administrator
- **Scope**: Global (all organizations)
- **Permissions**: All platform management
- **Use Case**: Platform administrators, DevOps team

### Tier 2: Administrator
- **Scope**: Organization-scoped
- **Permissions**: Full CRUD within organization
- **Use Case**: Organization admins, team leads

### Tier 3: Developer
- **Scope**: Organization-scoped
- **Permissions**: Create/Read/Update (no delete)
- **Use Case**: Software developers, DevOps engineers

### Tier 4: Viewer
- **Scope**: Organization-scoped
- **Permissions**: Read-only access
- **Use Case**: Business analysts, stakeholders

### Tier 5: Demo
- **Scope**: Demo organization only
- **Permissions**: Developer access in demo org
- **Use Case**: Product demos, trial accounts

## Default Users

| Email | Password | Role | Tier |
|-------|----------|------|------|
| superadmin.telemetryflow@telemetryflow.id | SuperAdmin@123456 | Super Administrator | 1 |
| administrator.telemetryflow@telemetryflow.id | Admin@123456 | Administrator | 2 |
| developer.telemetryflow@telemetryflow.id | Developer@123456 | Developer | 3 |
| viewer.telemetryflow@telemetryflow.id | Viewer@123456 | Viewer | 4 |
| demo.telemetryflow@telemetryflow.id | Demo@123456 | Demo | 5 |

## Permissions

### IAM Permissions
- `iam:users:read`, `iam:users:create`, `iam:users:update`, `iam:users:delete`
- `iam:roles:read`, `iam:roles:create`, `iam:roles:update`, `iam:roles:delete`
- `iam:permissions:read`
- `iam:organizations:read`, `iam:organizations:update`
- `iam:tenants:read`, `iam:tenants:create`, `iam:tenants:update`, `iam:tenants:delete`
- `iam:workspaces:read`, `iam:workspaces:create`, `iam:workspaces:update`, `iam:workspaces:delete`
- `iam:regions:read`

### Platform Permissions
- `platform:manage` - Platform management
- `system:admin` - System administration

## Permission Matrix

| Permission | Super Admin | Administrator | Developer | Viewer | Demo |
|------------|-------------|---------------|-----------|--------|------|
| Platform Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| User CRUD | ✅ | ✅ | C/R/U | R | C/R/U |
| Role CRUD | ✅ | ✅ | R | R | R |
| Tenant CRUD | ✅ | ✅ | C/R/U | R | C/R/U |
| Workspace CRUD | ✅ | ✅ | C/R/U | R | C/R/U |
| Delete Operations | ✅ | ✅ | ❌ | ❌ | ❌ |
| Scope | Global | Organization | Organization | Organization | Demo Org |

Legend: C=Create, R=Read, U=Update, D=Delete

## Security Features

- ✅ Multi-tenancy isolation
- ✅ Organization-level data scoping
- ✅ Hierarchical role inheritance
- ✅ Explicit permission assignment
- ✅ Demo environment isolation

## Usage

### Login
```bash
# Super Administrator
Email: superadmin.telemetryflow@telemetryflow.id
Password: SuperAdmin@123456

# Administrator
Email: administrator.telemetryflow@telemetryflow.id
Password: Admin@123456

# Developer
Email: developer.telemetryflow@telemetryflow.id
Password: Developer@123456

# Viewer
Email: viewer.telemetryflow@telemetryflow.local
Password: Password123!

# Demo
Email: demo.telemetryflow@telemetryflow.local
Password: Password123!
```

### API Access
All users can access the API at: http://localhost:3000/api

Use Swagger UI to test different permission levels.

## Documentation

Full documentation: [docs/5-TIER-RBAC-SYSTEM.md](./docs/5-TIER-RBAC-SYSTEM.md)

## Seeding

The 5-tier RBAC system is automatically seeded when running:

```bash
pnpm run db:seed:iam
```

Or via bootstrap:

```bash
bash scripts/bootstrap.sh
```
