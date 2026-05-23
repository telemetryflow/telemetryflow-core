# Auth Module Migrations

This directory contains database migrations for the Auth module.

## Migration Timestamp Range

Auth module uses timestamp range: **1739404800000 - 1739999999999**

## Migrations

### 1739404800000-CreateAuthTables.ts

Creates core authentication tables:

- `devices`: Known devices for device fingerprinting
- `sessions`: Active user sessions with tokens
- `security_logs`: Security event audit trail

**Note**: The `users` table is managed by the IAM module.

## Running Migrations

Migrations are automatically run when the application starts or can be run manually:

```bash
# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## Creating New Migrations

When creating new migrations for the Auth module:

1. Use timestamp in the Auth module range (1739404800000+)
2. Follow naming convention: `{timestamp}-{DescriptiveName}.ts`
3. Extend `BaseMigration` class
4. Set `moduleName = 'auth'`
5. Add to `index.ts` exports

Example:

```typescript
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class AddNewAuthField1739404900000 extends BaseMigration {
  name = "AddNewAuthField1739404900000";
  moduleName = "auth";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Migration logic
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback logic
  }
}
```
