# PostgreSQL Seeds

TypeScript seed data for PostgreSQL database.

## Available Seeds

| File | Description | Dependencies | Records |
|------|-------------|--------------|---------|
| `1704240000001-seed-iam-roles-permissions.ts` | Base IAM data | None | 1 region, 1 org, 1 workspace, 1 tenant, 22 permissions, 5 roles |
| `1704240000002-seed-auth-test-users.ts` | Test users for 5-tier RBAC | Seed 1704240000001 | 5 users |
| `1704240000003-seed-groups.ts` | User groups | Seed 1704240000001 | 4 groups |

## Running Seeds

```bash
# Run all PostgreSQL seeds
pnpm db:seed:postgres

# Or use alias
pnpm db:seed:iam

# Run all seeds (PostgreSQL + ClickHouse)
pnpm db:seed

# Run migrations + seeds
pnpm db:migrate:seed
```

## Seed Order & Dependencies

```
1704240000001-seed-iam-roles-permissions.ts (Base)
  ├─ Creates: Region
  ├─ Creates: Organization (depends on Region)
  ├─ Creates: Workspace (depends on Organization)
  ├─ Creates: Tenant (depends on Workspace)
  ├─ Creates: 22 Permissions
  └─ Creates: 5 Roles

1704240000002-seed-auth-test-users.ts
  ├─ Requires: Tenant from seed 1704240000001
  ├─ Requires: Roles from seed 1704240000001
  └─ Creates: 5 Users (one per role tier)

1704240000003-seed-groups.ts
  ├─ Requires: Organization from seed 1704240000001
  └─ Creates: 4 Groups
```

## Seed Structure

Each seed exports a function:

```typescript
import { DataSource } from 'typeorm';

export async function seedName(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(Entity);
  
  // Check if already seeded
  const count = await repository.count();
  if (count > 0) {
    console.log('Already seeded, skipping...');
    return;
  }
  
  // Create records
  const entity = repository.create(data);
  await repository.save(entity);
}
```

## Validation

All seeds validate dependencies:

```typescript
// Example from 1704240000002-seed-auth-test-users.ts
const defaultTenant = await tenantRepo.findOne({ 
  where: { code: 'DEVOPSCORNER' } 
});

if (!defaultTenant) {
  throw new Error('Missing default tenant. Run IAM seed first!');
}
```

## Default Credentials

### Test Users
| Email | Password | Role |
|-------|----------|------|
| superadmin.telemetryflow@telemetryflow.id | TelemetryFlow@2024 | Super Administrator |
| administrator.telemetryflow@telemetryflow.id | TelemetryFlow@2024 | Administrator |
| developer.telemetryflow@telemetryflow.id | TelemetryFlow@2024 | Developer |
| viewer.telemetryflow@telemetryflow.id | TelemetryFlow@2024 | Viewer |
| demo.telemetryflow@telemetryflow.id | TelemetryFlow@2024 | Demo |

⚠️ **Change these passwords in production!**

## Adding New Seed

1. Create file: `1704240000XXX-seed-name.ts`
2. Export function: `export async function seedName(dataSource: DataSource)`
3. Add to `run-seeds.ts`
4. Run seeds

## Idempotency

All seeds are idempotent (can run multiple times):
- Check if data exists before creating
- Use unique constraints (code, email)
- Skip if already seeded

## Troubleshooting

### Seed Fails with "Missing dependency"
```bash
# Run seeds in order
pnpm run db:seed:postgres
```

### Duplicate Key Error
```bash
# Seeds already run, data exists
# This is expected - seeds are idempotent
```

### Foreign Key Violation
```bash
# Ensure dependencies exist
# Run seed 1704240000001 first, then 1704240000002, then 1704240000003
```

## References

- [TypeORM Repository API](https://typeorm.io/repository-api)
- [TypeORM Entities](https://typeorm.io/entities)
