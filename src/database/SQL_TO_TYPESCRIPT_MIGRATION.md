# SQL to TypeScript Migration

All SQL files have been converted to TypeScript for better type safety, maintainability, and consistency.

## Files Converted

### ClickHouse Migrations
| Old SQL File | New TypeScript File | Status |
|--------------|---------------------|--------|
| `001-audit-logs.sql` | `001-audit-logs.ts` | ✅ Converted |
| `002-logs.sql` | `002-logs.ts` | ✅ Converted |
| `003-metrics.sql` | `003-metrics.ts` | ✅ Created |
| `004-traces.sql` | `004-traces.ts` | ✅ Created |

### ClickHouse Seeds
| Old SQL File | New TypeScript File | Status |
|--------------|---------------------|--------|
| `001-sample-audit-logs.sql` | `001-sample-audit-logs.ts` | ✅ Converted |
| *(New)* | `002-sample-metrics.ts` | ✅ Created |
| *(New)* | `003-sample-traces.ts` | ✅ Created |

### PostgreSQL Migrations
| Old SQL File | New TypeScript File | Status |
|--------------|---------------------|--------|
| `001-create-role-permissions-table.sql` | *(Removed - handled by TypeORM)* | ✅ Removed |
| `1704240000000-CreateIAMTables.ts` | *(Removed - handled by TypeORM)* | ✅ Removed |

**Note**: PostgreSQL uses TypeORM `synchronize: true` in development. Tables are auto-created from entities.

## Benefits of TypeScript Migrations

### 1. Type Safety
```typescript
// ✅ TypeScript - Type-safe
export async function up(client: ClickHouseClient, database: string): Promise<void> {
  await client.command({ query: `...` });
}

// ❌ SQL - No type checking
CREATE TABLE IF NOT EXISTS ...
```

### 2. Environment Variables
```typescript
// ✅ TypeScript - Direct access
const database = process.env.CLICKHOUSE_DB || 'telemetry';

// ❌ SQL - Requires shell substitution
USE ${CLICKHOUSE_DB};
```

### 3. Error Handling
```typescript
// ✅ TypeScript - Try/catch
try {
  await client.command({ query: `...` });
} catch (error) {
  console.error('Migration failed:', error);
}

// ❌ SQL - No error handling
CREATE TABLE ...
```

### 4. Programmatic Control
```typescript
// ✅ TypeScript - Conditional logic
if (await tableExists(client, 'audit_logs')) {
  console.log('Table already exists, skipping...');
  return;
}

// ❌ SQL - Limited control flow
CREATE TABLE IF NOT EXISTS ...
```

### 5. Reusability
```typescript
// ✅ TypeScript - Shared functions
const indexes = [
  { name: 'idx_user_id', column: 'user_id', type: 'bloom_filter' },
  { name: 'idx_event_type', column: 'event_type', type: 'set(0)' },
];

for (const idx of indexes) {
  await createIndex(client, database, 'audit_logs', idx);
}

// ❌ SQL - Repetitive
ALTER TABLE audit_logs ADD INDEX idx_user_id ...
ALTER TABLE audit_logs ADD INDEX idx_event_type ...
```

## Migration Structure

### TypeScript Migration Template
```typescript
import { ClickHouseClient } from '@clickhouse/client';

export async function up(client: ClickHouseClient, database: string): Promise<void> {
  console.log('📊 Creating table...');

  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${database}.table_name (
        id UUID DEFAULT generateUUIDv4(),
        -- columns...
      )
      ENGINE = MergeTree()
      ORDER BY (id)
    `,
  });

  console.log('   ✅ Table created');
}

export async function down(client: ClickHouseClient, database: string): Promise<void> {
  console.log('🗑️  Dropping table...');

  await client.command({
    query: `DROP TABLE IF EXISTS ${database}.table_name`,
  });

  console.log('   ✅ Table dropped');
}
```

### TypeScript Seed Template
```typescript
import { ClickHouseClient } from '@clickhouse/client';

export async function seed(client: ClickHouseClient, database: string): Promise<void> {
  console.log('📊 Seeding data...');

  const data = [
    { id: 'uuid-1', name: 'Item 1' },
    { id: 'uuid-2', name: 'Item 2' },
  ];

  await client.insert({
    table: `${database}.table_name`,
    values: data,
    format: 'JSONEachRow',
  });

  console.log(`   ✅ Seeded ${data.length} records`);
}
```

## Running Migrations & Seeds

### ClickHouse
```bash
# Run all migrations
pnpm run db:migrate:clickhouse

# Run all seeds
pnpm run db:seed:clickhouse

# Or directly
ts-node src/database/clickhouse/migrations/run-migrations.ts
ts-node src/database/clickhouse/seeds/run-seeds.ts
```

### PostgreSQL
```bash
# Run migrations (currently none - using TypeORM synchronize)
pnpm run db:migrate:postgres

# Run seeds
pnpm run db:seed:postgres

# Or directly
ts-node src/database/postgres/seeds/run-seeds.ts
```

### All Databases
```bash
# Run all migrations
pnpm run db:migrate

# Run all seeds
pnpm run db:seed

# Run migrations + seeds
pnpm run db:migrate:seed
```

## Migration Runner

### ClickHouse Runner
**File**: `src/database/clickhouse/migrations/run-migrations.ts`

Features:
- ✅ Automatic migration discovery
- ✅ Sequential execution
- ✅ Error handling
- ✅ Progress logging
- ✅ Environment variable support

### PostgreSQL Runner
**File**: `src/database/postgres/migrations/run-migrations.sh`

Features:
- ✅ Handles empty migrations
- ✅ Informative messages
- ✅ TypeORM synchronize explanation

## Adding New Migrations

### ClickHouse Migration
1. Create file: `src/database/clickhouse/migrations/00X-name.ts`
2. Implement `up()` and `down()` functions
3. Run: `pnpm run db:migrate:clickhouse`

### ClickHouse Seed
1. Create file: `src/database/clickhouse/seeds/00X-name.ts`
2. Implement `seed()` function
3. Run: `pnpm run db:seed:clickhouse`

### PostgreSQL Migration
1. Modify entity in `src/modules/iam/infrastructure/persistence/entities/`
2. Development: TypeORM auto-syncs
3. Production: Generate migration with TypeORM CLI

## Environment Variables

Required for ClickHouse migrations:
```env
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DB=telemetry
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=telemetryflow123
```

## Troubleshooting

### Migration Fails
```bash
# Check ClickHouse is running
docker-compose ps clickhouse

# Check connection
curl http://localhost:8123/ping

# Check database exists
docker exec telemetryflow_core_clickhouse clickhouse-client -q "SHOW DATABASES"
```

### TypeScript Compilation Errors
```bash
# Install dependencies
pnpm install

# Check TypeScript version
pnpm list typescript

# Compile manually
tsc src/database/clickhouse/migrations/001-audit-logs.ts
```

## Files Removed

All SQL files have been removed:
- ❌ `src/database/clickhouse/migrations/*.sql`
- ❌ `src/database/clickhouse/seeds/*.sql`
- ❌ `src/database/postgres/migrations/*.sql`

## Next Steps

1. ✅ Convert remaining ClickHouse migrations (003-metrics, 004-traces)
2. ✅ Create seed runner for ClickHouse TypeScript seeds
3. ✅ Update documentation
4. ✅ Test all migrations in clean environment

## References

- [ClickHouse Node.js Client](https://clickhouse.com/docs/en/integrations/language-clients/nodejs)
- [TypeORM Migrations](https://typeorm.io/migrations)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
