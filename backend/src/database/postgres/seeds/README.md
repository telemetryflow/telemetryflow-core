# PostgreSQL Seeds

TypeScript seed data for PostgreSQL database.

## Available Seeds

| File                                          | Description                | Dependencies | Records                                                         |
| --------------------------------------------- | -------------------------- | ------------ | --------------------------------------------------------------- |
| `1704240000001-seed-iam-roles-permissions.ts` | Base IAM data              | None         | 1 region, 1 tenant, 1 org, 1 workspace, 22 permissions, 5 roles |
| `1704240000002-seed-auth-test-users.ts`       | Test users for 5-tier RBAC | Seed 1       | 5 users                                                         |
| `1704240000003-seed-groups.ts`                | User groups                | Seed 1       | 4 groups                                                        |

## Running Seeds

```bash
# Run all PostgreSQL seeds (recommended)
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
  ├─ Creates: Region (ap-southeast-3)
  ├─ Creates: Tenant (TelemetryFlow)
  ├─ Creates: Organization (DevOpsCorner, depends on Tenant)
  ├─ Creates: Workspace (Production, depends on Organization)
  ├─ Creates: 22 Permissions (IAM operations)
  └─ Creates: 5 Roles (Super Admin, Administrator, Developer, Viewer, Demo)

1704240000002-seed-auth-test-users.ts
  ├─ Requires: Tenant from seed 1
  ├─ Requires: Organization from seed 1
  ├─ Requires: Roles from seed 1
  └─ Creates: 5 Users (one per role tier)

1704240000003-seed-groups.ts
  ├─ Requires: Organization from seed 1
  └─ Creates: 4 Groups (Engineering, DevOps, Management, Demo Users)
```

## Seed Structure

Each seed exports a function:

```typescript
import { DataSource } from "typeorm";

export async function seedName(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(Entity);

  // Check if already seeded (idempotency)
  const count = await repository.count();
  if (count > 0) {
    console.log("   ⚠️  Already seeded. Skipping...");
    return;
  }

  // Create records
  const entity = repository.create(data);
  await repository.save(entity);

  console.log(`   ✅ Created ${count} records`);
}
```

## Validation

All seeds validate dependencies:

```typescript
// Example from 1704240000002-seed-auth-test-users.ts
const defaultTenant = await tenantRepo.findOne({
  where: { code: "DEVOPSCORNER" },
});

if (!defaultTenant) {
  console.error("   ❌ Default tenant not found. Run IAM seed first!");
  throw new Error("Missing default tenant");
}
```

## Default Credentials

### Test Users (5-Tier RBAC)

| Email                                        | Password          | Role                | Tier |
| -------------------------------------------- | ----------------- | ------------------- | ---- |
| superadmin.telemetryflow@telemetryflow.id    | SuperAdmin@654123 | Super Administrator | 1    |
| administrator.telemetryflow@telemetryflow.id | Admin@654123      | Administrator       | 2    |
| developer.telemetryflow@telemetryflow.id     | Developer@654123  | Developer           | 3    |
| viewer.telemetryflow@telemetryflow.id        | Viewer@654123     | Viewer              | 4    |
| demo.telemetryflow@telemetryflow.id          | Demo@654123       | Demo                | 5    |

⚠️ **Change these passwords in production!**

### Default Organization Structure

- **Region**: ap-southeast-3 (Asia Pacific Jakarta)
- **Tenant**: TelemetryFlow (code: DEVOPSCORNER)
- **Organization**: DevOpsCorner (slug: devopscorner)
- **Workspace**: Production (slug: production)

### Default Groups

1. **Engineering Team** - Software engineering and development team
2. **DevOps Team** - DevOps and infrastructure team
3. **Management Team** - Management and leadership team
4. **Demo Users** - Demo environment users

## Adding New Seed

1. Create file: `1704240000XXX-seed-name.ts`
2. Export function: `export async function seedName(dataSource: DataSource)`
3. Add to `index.ts` exports
4. Run seeds

Example:

```typescript
import { DataSource } from "typeorm";
import { Entity } from "../../../modules/iam/infrastructure/persistence/entities/Entity.entity";

export async function seedNewData(dataSource: DataSource): Promise<void> {
  console.log("🌱 Seeding new data...");

  const repo = dataSource.getRepository(Entity);

  // Check if already seeded
  const existing = await repo.count();
  if (existing > 0) {
    console.log("   ⚠️  Already seeded. Skipping...");
    return;
  }

  // Create data
  const data = repo.create({
    /* ... */
  });
  await repo.save(data);

  console.log("   ✅ Seeded successfully");
}
```

## Idempotency

All seeds are idempotent (can run multiple times):

- ✅ Check if data exists before creating
- ✅ Use unique constraints (code, email, slug)
- ✅ Skip if already seeded
- ✅ No duplicate data errors

## Troubleshooting

### Seed Fails with "Missing dependency"

```bash
# Ensure seeds run in order
# Run all seeds together
pnpm db:seed:postgres
```

### Duplicate Key Error

```bash
# Seeds already run, data exists
# This is expected - seeds are idempotent
# Output will show: "⚠️  Already seeded. Skipping..."
```

### Foreign Key Violation

```bash
# Ensure dependencies exist
# Run seed 1 first, then seed 2, then seed 3
# Or run all together: pnpm db:seed:postgres
```

### User Creation Fails

```bash
# Check if tenant and organization exist
docker exec telemetryflow_core_postgres psql -U postgres -d telemetryflow_db \
  -c "SELECT * FROM tenants;"

# Check if roles exist
docker exec telemetryflow_core_postgres psql -U postgres -d telemetryflow_db \
  -c "SELECT * FROM roles;"

# Re-run seed 1 if missing
pnpm db:seed:postgres
```

## Environment Variables

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=telemetryflow_db
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=telemetryflow123
```

## References

- [TypeORM Repository API](https://typeorm.io/repository-api)
- [TypeORM Entities](https://typeorm.io/entities)
- [TypeORM DataSource](https://typeorm.io/data-source)

---

**Last Updated**: 2025-12-06
**Total Seeds**: 3
**Total Records**: 1 region, 1 tenant, 1 org, 1 workspace, 22 permissions, 5 roles, 5 users, 4 groups
