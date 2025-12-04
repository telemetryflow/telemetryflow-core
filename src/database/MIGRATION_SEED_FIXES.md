# Database Migration & Seed Fixes

## Issues Fixed

### 1. TypeORM Synchronize Disabled
**File**: `src/app.module.ts`

**Problem**: `synchronize: false` prevented TypeORM from auto-creating tables in development.

**Fix**: Changed to `synchronize: process.env.NODE_ENV === 'development'`

**Impact**: Tables are now automatically created from entities in development mode.

### 2. Conflicting Migrations
**Files**: 
- `src/database/postgres/migrations/001-create-role-permissions-table.sql`
- `src/database/postgres/migrations/1704240000000-CreateIAMTables.ts`

**Problem**: 
- SQL migration tried to create `role_permissions` table
- TypeORM migration tried to create ALL IAM tables
- TypeORM synchronize also creates tables from entities
- Result: Conflicts and "relation already exists" errors

**Fix**: 
- Removed both migration files
- Use TypeORM entities as single source of truth
- TypeORM synchronize handles table creation in development

**Impact**: No more migration conflicts, clean table creation.

### 3. Workspace UUID Not Generated
**File**: `src/database/postgres/seeds/001-iam-roles-permissions.seed.ts`

**Problem**: Workspace entity uses `@PrimaryColumn('uuid')` which requires manual UUID generation, but seed was not providing it.

**Fix**: Added `workspace_id: randomUUID()` when creating workspace.

**Impact**: Workspace records can now be created successfully.

### 3. Groups Seed Using Hardcoded UUIDs
**File**: `src/database/postgres/seeds/003-groups.seed.ts`

**Problem**: 
- Used hardcoded organization UUIDs that don't match auto-generated IDs
- Used raw SQL instead of repository pattern
- Hardcoded group IDs instead of letting database generate them

**Fix**: 
- Changed to use repository pattern
- Fetch organization dynamically by code
- Let database auto-generate group IDs

**Impact**: Groups seed now works with any organization setup.

## Entity Primary Key Types

### Auto-Generated (No Manual UUID Needed)
These entities use `@PrimaryGeneratedColumn('uuid')`:
- ✅ User
- ✅ Role  
- ✅ Permission
- ✅ Tenant
- ✅ Organization
- ✅ Region
- ✅ Group
- ✅ AuditLog

### Manual UUID Required
These entities use `@PrimaryColumn('uuid')`:
- ⚠️ Workspace - **Fixed**: Added `randomUUID()` in seed
- ⚠️ RolePermission - Junction table (composite key)
- ⚠️ UserPermission - Junction table (composite key)
- ⚠️ UserRole - Junction table (composite key)

## Migration Order

### Correct Order:
1. **TypeORM Auto-Sync** - Creates base tables from entities
2. **SQL Migrations** - Adds additional tables/constraints
3. **Seeds** - Populates initial data

### Why This Order Matters:
- SQL migrations reference tables created by TypeORM
- Seeds reference data from previous seeds
- Foreign key constraints require parent tables to exist first

## Seed Dependencies

```
001-iam-roles-permissions.seed.ts
  ├─ Creates: Region
  ├─ Creates: Organization (depends on Region)
  ├─ Creates: Workspace (depends on Organization)
  ├─ Creates: Tenant (depends on Workspace)
  ├─ Creates: Permissions
  └─ Creates: Roles

002-auth-test-users.seed.ts
  ├─ Depends on: Tenant (from seed 001)
  ├─ Depends on: Roles (from seed 001)
  └─ Creates: Users

003-groups.seed.ts
  ├─ Depends on: Organization (from seed 001)
  └─ Creates: Groups
```

## Best Practices

### 1. Use Repository Pattern
```typescript
// ✅ Good
const entity = repository.create(data);
await repository.save(entity);

// ❌ Bad
await dataSource.query(`INSERT INTO ...`);
```

### 2. Dynamic References
```typescript
// ✅ Good - Fetch by unique code
const org = await orgRepo.findOne({ where: { code: 'DEVOPSCORNER' } });

// ❌ Bad - Hardcoded UUID
const organizationId = '811a6697-169b-4b01-823a-066edae34b55';
```

### 3. UUID Generation
```typescript
import { randomUUID } from 'crypto';

// For @PrimaryColumn entities
const entity = repository.create({
  id: randomUUID(),  // Manual UUID
  // ... other fields
});

// For @PrimaryGeneratedColumn entities
const entity = repository.create({
  // id is auto-generated
  // ... other fields
});
```

### 4. Check Existence Before Creating
```typescript
let entity = await repository.findOne({ where: { code: 'UNIQUE_CODE' } });
if (!entity) {
  entity = repository.create(data);
  await repository.save(entity);
}
```

### 5. Validate Dependencies
```typescript
const parent = await parentRepo.findOne({ where: { code: 'PARENT' } });
if (!parent) {
  throw new Error('Parent entity not found. Run previous seed first!');
}
```

## Testing Seeds

### Reset and Re-run
```bash
# Drop all tables
docker exec telemetryflow_core_postgres psql -U postgres -d telemetryflow_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restart backend (triggers TypeORM sync)
docker-compose restart backend

# Run seeds
pnpm run db:seed:postgres
```

### Verify Data
```bash
# Check table counts
docker exec telemetryflow_core_postgres psql -U postgres -d telemetryflow_db -c "
  SELECT 'users' as table, COUNT(*) FROM users
  UNION ALL SELECT 'roles', COUNT(*) FROM roles
  UNION ALL SELECT 'permissions', COUNT(*) FROM permissions
  UNION ALL SELECT 'groups', COUNT(*) FROM groups;
"
```

## Common Errors

### Error: "relation does not exist"
**Cause**: TypeORM hasn't created tables yet
**Fix**: Ensure `synchronize: true` in development and restart backend

### Error: "null value in column violates not-null constraint"
**Cause**: Missing required field (often primary key)
**Fix**: Add UUID generation for `@PrimaryColumn` entities

### Error: "duplicate key value violates unique constraint"
**Cause**: Seed running multiple times
**Fix**: Add existence check before creating records

### Error: "insert or update on table violates foreign key constraint"
**Cause**: Parent record doesn't exist
**Fix**: Ensure seeds run in correct order and validate dependencies

## Files Modified

1. ✅ `src/app.module.ts` - Enabled TypeORM synchronize
2. ✅ `src/database/postgres/seeds/001-iam-roles-permissions.seed.ts` - Added workspace UUID
3. ✅ `src/database/postgres/seeds/003-groups.seed.ts` - Fixed to use repository pattern
4. ✅ `src/database/postgres/migrations/run-migrations.sh` - Handle no migrations gracefully
5. ✅ `src/database/postgres/migrations/README.md` - Updated documentation

## Files Removed

1. ❌ `src/database/postgres/migrations/001-create-role-permissions-table.sql` - Conflicted with TypeORM
2. ❌ `src/database/postgres/migrations/1704240000000-CreateIAMTables.ts` - Conflicted with synchronize

## Verification

Run full database setup:
```bash
# Clean start
docker-compose down -v
docker-compose up -d

# Wait for services
sleep 30

# Run seeds
pnpm run db:seed:postgres

# Verify
curl http://localhost:3000/api/v2/users
```

Expected result: 5 users, 5 roles, 22 permissions, 4 groups
