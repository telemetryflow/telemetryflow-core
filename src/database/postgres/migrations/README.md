# PostgreSQL Migrations

Database schema migrations for TelemetryFlow Core.

## Files

- `1704240000000-CreateIAMTables.ts` - IAM module tables (users, roles, permissions, etc.)

## Usage

### Run Migrations

```bash
# Run all pending migrations
pnpm run migration:run

# Generate new migration
pnpm run migration:generate -- src/database/postgres/migrations/MigrationName

# Revert last migration
pnpm run migration:revert
```

### Manual Execution

```bash
# Using TypeORM CLI
npx typeorm-ts-node-commonjs migration:run -d src/database/typeorm.config.ts
```

## Tables Created

### IAM Module
- `regions` - Geographic regions
- `organizations` - Business organizations
- `workspaces` - Project workspaces
- `tenants` - Multi-tenant isolation
- `users` - User accounts
- `roles` - Role definitions
- `permissions` - Permission definitions
- `groups` - User groups
- `user_roles` - User-Role assignments
- `user_permissions` - Direct user permissions
- `role_permissions` - Role-Permission mappings
- `user_groups` - User-Group memberships
