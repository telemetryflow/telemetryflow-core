# PostgreSQL Seeds

Sample data for TelemetryFlow Core IAM module.

## Seed Files

### 001-iam-roles-permissions.seed.ts
Creates foundational IAM data:
- ✅ Default region (ap-southeast-3)
- ✅ Default organization (DevOpsCorner)
- ✅ Default workspace (TelemetryFlow POC)
- ✅ Default tenant (DevOpsCorner)
- ✅ 22 permissions (users, roles, tenants, organizations, workspaces, platform)
- ✅ 5 roles (5-Tier RBAC: Super Admin, Admin, Developer, Viewer, Demo)

### 002-iam-data.seed.ts
Alternative comprehensive seed (includes users):
- ✅ 3 regions (Jakarta, Virginia, Ireland)
- ✅ Organization, workspace, tenant
- ✅ 22 permissions
- ✅ 5 roles (5-Tier RBAC)
- ✅ 5 default users with passwords

### 003-auth-test-users.seed.ts
Creates test users only:
- ✅ 5 users (Super Admin, Admin, Developer, Viewer, Demo)
- ✅ Default password: `TelemetryFlow@2024`

### 004-groups.seed.ts
Creates user groups:
- ✅ 3 groups (Engineering, Operations, Management)
- ✅ Linked to default organization

## Usage

### Run All Seeds (Recommended)
```bash
pnpm run db:seed:iam
```

This runs seeds in order:
1. `001-iam-roles-permissions.seed.ts`
2. `003-auth-test-users.seed.ts`
3. `004-groups.seed.ts`

### Run Individual Seeds
```bash
# IAM foundation only
ts-node src/database/postgres/seeds/001-iam-roles-permissions.seed.ts

# Complete IAM with users
ts-node src/database/postgres/seeds/002-iam-data.seed.ts

# Users only
ts-node src/database/postgres/seeds/003-auth-test-users.seed.ts
```

## Default Users

| Email | Password | Role | Tier |
|-------|----------|------|------|
| superadmin.telemetryflow@telemetryflow.id | TelemetryFlow@2024 | Super Administrator | 1 |
| administrator.telemetryflow@telemetryflow.id | TelemetryFlow@2024 | Administrator | 2 |
| developer.telemetryflow@telemetryflow.id | TelemetryFlow@2024 | Developer | 3 |
| viewer.telemetryflow@telemetryflow.id | TelemetryFlow@2024 | Viewer | 4 |
| demo.telemetryflow@telemetryflow.id | TelemetryFlow@2024 | Demo | 5 |

**Note:** `002-iam-data.seed.ts` uses different passwords (e.g., `SuperAdmin@123456`)

## Idempotency

All seeds check for existing data before inserting:
- ✅ Skip if data already exists
- ✅ Safe to run multiple times
- ✅ No duplicate entries

## Seed Order

Managed by `index.ts`:
```typescript
export const SEED_ORDER = [
  '001-iam-roles-permissions',
  '003-auth-test-users',
  '004-groups',
] as const;
```

## Files

- `001-iam-roles-permissions.seed.ts` - IAM foundation
- `002-iam-data.seed.ts` - Complete IAM (alternative)
- `003-auth-test-users.seed.ts` - Test users
- `004-groups.seed.ts` - User groups
- `index.ts` - Seed orchestration
- `run-seeds.ts` - Seed runner script
- `README.md` - This file
