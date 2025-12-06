# PostgreSQL Migrations

TypeScript migrations for PostgreSQL database schema using TypeORM.

## Available Migrations

| File | Description | Tables | Status |
|------|-------------|--------|--------|
| `1704240000000-InitialSchema.ts` | UUID extension setup | - | ✅ Active |
| `1704240000001-CreateRegionsTable.ts` | Create regions table | regions | ✅ Active |
| `1704240000002-CreateOrganizationsTable.ts` | Create organizations table | organizations | ✅ Active |
| `1704240000003-CreateWorkspacesTable.ts` | Create workspaces table | workspaces | ✅ Active |
| `1704240000004-CreateTenantsTable.ts` | Create tenants table | tenants | ✅ Active |
| `1704240000005-CreateGroupsTable.ts` | Create groups table | groups | ✅ Active |
| `1704240000006-CreateUsersTable.ts` | Create users table | users | ✅ Active |
| `1704240000007-CreateRBACTables.ts` | Create RBAC tables | roles, permissions | ✅ Active |
| `1704240000008-CreateJunctionTables.ts` | Create junction tables | user_roles, user_permissions, role_permissions | ✅ Active |

## Running Migrations

### Automated Runner (Recommended)
```bash
# Run all PostgreSQL migrations
pnpm db:migrate:postgres

# Run all migrations (PostgreSQL + ClickHouse)
pnpm db:migrate

# Run migrations + seeds
pnpm db:migrate:seed
```

### Manual Execution
```bash
# Using ts-node
ts-node src/database/postgres/migrations/run-migrations.ts
```

## Tables Created

All 13 IAM tables are created by these migrations:

**Core Tables (8 tables):**
- `regions` - Geographic regions
- `tenants` - Top-level tenant organizations
- `organizations` - Business units within tenants
- `workspaces` - Project workspaces within organizations
- `users` - User accounts with profiles
- `roles` - Role definitions (5-tier RBAC)
- `permissions` - Permission definitions (22+ permissions)
- `groups` - User groups

**Junction Tables (3 tables):**
- `user_roles` - User-role assignments (many-to-many)
- `user_permissions` - Direct user permissions (many-to-many)
- `role_permissions` - Role-permission mappings (many-to-many)

## Migration Structure

Each migration implements the TypeORM `MigrationInterface`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationName1704240000000 implements MigrationInterface {
  name = 'MigrationName1704240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tables with IF NOT EXISTS
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "table_name" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        ...
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables with IF EXISTS
    await queryRunner.query(`DROP TABLE IF EXISTS "table_name" CASCADE`);
  }
}
```

## Idempotency

All migrations are idempotent:
- ✅ Use `IF NOT EXISTS` for CREATE statements
- ✅ Use `IF EXISTS` for DROP statements
- ✅ Safe to run multiple times
- ✅ No errors if tables already exist

## Validation

Migrations validate:
- ✅ Table existence before creation
- ✅ Foreign key constraints
- ✅ Index uniqueness
- ✅ Data type compatibility
- ✅ UUID extension availability

## Troubleshooting

### Duplicate Migration Error
```bash
# Error: Duplicate migrations detected
# Cause: index.ts or run-migrations.ts being treated as migration

# Solution: Already fixed with glob pattern [0-9]*.ts
# Only files starting with numbers are treated as migrations
```

### Tables Not Created
```bash
# Check if migrations ran
docker exec telemetryflow_core_postgres psql -U postgres -d telemetryflow_db -c "\dt"

# Run migrations manually
pnpm db:migrate:postgres
```

### Migration Fails
```bash
# Check database connection
docker exec telemetryflow_core_postgres pg_isready -U postgres

# Check existing tables
docker exec telemetryflow_core_postgres psql -U postgres -d telemetryflow_db -c "\dt"

# Check migration logs
pnpm db:migrate:postgres
```

### Foreign Key Violations
```bash
# Migrations run in order (1 → 2 → 3 → ...)
# Ensure all dependencies exist before creating foreign keys
# All migrations handle this correctly
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

- [TypeORM Migrations](https://typeorm.io/migrations)
- [TypeORM Query Runner](https://typeorm.io/query-runner)
- [PostgreSQL CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)

---

**Last Updated**: 2025-12-06  
**Total Migrations**: 9  
**Total Tables**: 13 (8 core + 3 junction + 2 system)
