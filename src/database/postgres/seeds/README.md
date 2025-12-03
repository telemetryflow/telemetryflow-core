# Database Seeds

This directory contains database seeding scripts for the TelemetryFlow Core 5-Tier RBAC system.

## 🎯 5-Tier RBAC System

The seeding implements a complete 5-tier Role-Based Access Control system:

1. **Super Administrator** (Tier 1) - Platform management across all organizations
2. **Administrator** (Tier 2) - Full CRUD within organization  
3. **Developer** (Tier 3) - Create/Read/Update (no delete)
4. **Viewer** (Tier 4) - Read-only access
5. **Demo** (Tier 5) - Demo access in demo organization only

## 📁 Seed Files

### 001-iam-roles-permissions.seed.ts
**Complete IAM System Setup**
- ✅ 3 Regions (APS3, USE1, EUW1)
- ✅ 3 Organizations (DevOpsCorner, TelemetryFlow, Demo)
- ✅ 3 Workspaces (one per organization)
- ✅ 3 Tenants (one per workspace)
- ✅ 22 Permissions (platform, users, roles, permissions, tenants, organizations, workspaces)
- ✅ 5 Roles (5-tier RBAC with proper permission assignments)
- ✅ 5 Default Users (one per role tier)

### 002-groups.seed.ts
**User Groups**
- ✅ Engineering Team
- ✅ DevOps Team  
- ✅ Management Team
- ✅ Demo Users

## 🚀 Usage

### Run All Seeds
```bash
# Using npm script
pnpm run db:seed:iam

# Direct execution
npx ts-node src/database/postgres/seeds/run-seeds.ts
```

### Import in Code
```typescript
import { runAllSeeds } from './seeds';

await runAllSeeds(dataSource);
```

## 👤 Default Users

| Email | Password | Role | Tier | Organization |
|-------|----------|------|------|--------------|
| superadmin.telemetryflow@telemetryflow.id | SuperAdmin@123456 | Super Administrator | 1 | TelemetryFlow |
| administrator.telemetryflow@telemetryflow.id | Admin@123456 | Administrator | 2 | TelemetryFlow |
| developer.telemetryflow@telemetryflow.id | Developer@123456 | Developer | 3 | TelemetryFlow |
| viewer.telemetryflow@telemetryflow.id | Viewer@123456 | Viewer | 4 | TelemetryFlow |
| demo.telemetryflow@telemetryflow.id | Demo@123456 | Demo | 5 | Demo |

⚠️ **Security Warning**: Change these passwords in production!

## 🔐 Permission Matrix

| Permission | Super Admin | Administrator | Developer | Viewer | Demo |
|------------|-------------|---------------|-----------|--------|------|
| platform:manage | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:* | ✅ | ✅ | Read only | Read only | Read only |
| roles:* | ✅ | ✅ | Read only | Read only | Read only |
| organizations:* | ✅ | Read/Update | Read only | Read only | Read only |
| tenants:* | ✅ | ✅ | Create/Read/Update | Read only | Create/Read/Update |
| workspaces:* | ✅ | ✅ | Create/Read/Update | Read only | Create/Read/Update |

## 🏗️ Database Structure

```
Regions (3)
├── Organizations (3)
    ├── Workspaces (3)
        └── Tenants (3)

Permissions (22)
├── Roles (5)
    └── Users (5)
        └── Groups (4)
```

## 🔄 Execution Order

1. **Regions** → **Organizations** → **Workspaces** → **Tenants**
2. **Permissions** → **Roles** → **Role-Permission Mappings**
3. **Users** → **User-Role Assignments**
4. **Groups**

## ✨ Features

- **Idempotent**: Safe to run multiple times (uses `ON CONFLICT DO NOTHING`)
- **Consistent UUIDs**: Fixed UUIDs for core entities
- **Password Hashing**: Argon2 for secure password storage
- **Multi-tenancy**: Organization-scoped data isolation
- **Demo Isolation**: Demo users restricted to demo organization

## 🛡️ Security

- All passwords are hashed with Argon2
- Demo users isolated to demo organization
- Proper permission inheritance
- Organization-level data scoping
- Email verification enabled for all users

---

**Status**: ✅ Complete 5-Tier RBAC System