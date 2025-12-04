# PostgreSQL Migrations

TypeScript migrations for PostgreSQL database schema using TypeORM.

## Available Migrations

| File | Description | Tables | Status |
|------|-------------|--------|--------|
| `1704240000000-InitialSchema.ts` | Deprecated placeholder | - | ⚠️ Deprecated |
| `1704240000001-CreateRegionsTable.ts` | Create regions table | regions | ✅ Active |
| `1704240000002-CreateOrganizationsTable.ts` | Create organizations table | organizations | ✅ Active |
| `1704240000003-CreateWorkspacesTable.ts` | Create workspaces table | workspaces | ✅ Active |
| `1704240000004-CreateTenantsTable.ts` | Create tenants table | tenants | ✅ Active |
| `1704240000005-CreateGroupsTable.ts` | Create groups table | groups | ✅ Active |
| `1704240000006-CreateUsersTable.ts` | Create users table | users | ✅ Active |
| `1704240000007-CreateRBACTables.ts` | Create RBAC tables | roles, permissions | ✅ Active |
| `1704240000008-CreateJunctionTables.ts` | Create junction tables | user_roles, user_permissions, role_permissions | ✅ Active |

## Current Approach

### Development
- **TypeORM Synchronize**: `synchronize: true` in `src/app.module.ts`
- Tables auto-created from entities
- No manual migrations needed

### Production
- **TypeORM Migrations**: `synchronize: false`
- Use TypeORM CLI to generate and run migrations
- Migration file available as template

## Running Migrations

### Automated Runner
```bash
# Run all migrations
pnpm db:migrate:postgres

# Or run with seeds
pnpm db:migrate:seed
```

### Development (Auto-Sync)
```bash
# Tables created automatically on backend start
docker-compose restart backend
```

### Production (TypeORM CLI)
```bash
# Generate migration from entity changes
pnpm run migration:generate -- src/database/postgres/migrations/MigrationName

# Run migrations
pnpm run migration:run

# Revert migration
pnpm run migration:revert
```

## Tables Created

All 11 IAM tables are created from TypeORM entities:

**Core Tables:**
- `users` - User accounts
- `roles` - RBAC roles
- `permissions` - Permission definitions
- `tenants` - Tenant organizations
- `organizations` - Business units
- `workspaces` - Project workspaces
- `regions` - Geographic regions
- `groups` - User groups

**Junction Tables:**
- `user_roles` - User-role assignments
- `user_permissions` - Direct user permissions
- `role_permissions` - Role-permission mappings

## Migration Structure

TypeORM migration template:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationName1234567890000 implements MigrationInterface {
  name = 'MigrationName1234567890000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create/alter tables
    await queryRunner.query(`CREATE TABLE ...`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes
    await queryRunner.query(`DROP TABLE ...`);
  }
}
```

## TypeORM CLI Commands

Add to `package.json`:
```json
{
  "scripts": {
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/database/typeorm.config.ts",
    "migration:create": "typeorm-ts-node-commonjs migration:create",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d src/database/typeorm.config.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/database/typeorm.config.ts",
    "migration:show": "typeorm-ts-node-commonjs migration:show -d src/database/typeorm.config.ts"
  }
}
```

## Entity-First Development

1. **Create/modify entity** in `src/modules/iam/infrastructure/persistence/entities/`
2. **Development**: TypeORM auto-syncs changes
3. **Production**: Generate migration with CLI

### Example: Add New Column
```typescript
// 1. Update entity
@Entity('users')
export class UserEntity {
  // ... existing columns
  
  @Column({ nullable: true })
  phone: string; // New column
}

// 2. Development: Restart backend (auto-syncs)
// 3. Production: Generate migration
pnpm run migration:generate -- src/database/postgres/migrations/AddPhoneToUsers
```

## Validation

Migrations validate:
- ✅ Table existence before creation
- ✅ Foreign key constraints
- ✅ Index uniqueness
- ✅ Data type compatibility

## Troubleshooting

### Tables Not Created
```bash
# Check synchronize setting
grep "synchronize" src/app.module.ts

# Should show: synchronize: process.env.NODE_ENV === 'development'

# Restart backend
docker-compose restart backend
```

### Migration Fails
```bash
# Check database connection
docker exec telemetryflow_core_postgres pg_isready -U postgres

# Check existing tables
docker exec telemetryflow_core_postgres psql -U postgres -d telemetryflow_db -c "\dt"
```

## References

- [TypeORM Migrations](https://typeorm.io/migrations)
- [TypeORM Entities](https://typeorm.io/entities)
