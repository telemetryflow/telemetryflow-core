# ClickHouse Seeds

Sample data seeds for ClickHouse database.

## Available Seeds

| File | Description | Records | Dependencies |
|------|-------------|---------|-------------|
| `001-sample-audit-logs.ts` | Sample audit log entries | 5 | Migration 001 |
| `002-sample-metrics.ts` | Sample performance metrics | 240 | Migration 003 |
| `003-sample-traces.ts` | Sample distributed traces | 30 spans (10 traces) | Migration 004 |

## Running Seeds

```bash
# Run all ClickHouse seeds
pnpm db:seed:clickhouse

# Run all seeds (PostgreSQL + ClickHouse)
pnpm db:seed

# Run migrations + seeds
pnpm db:migrate:seed
```

## Seed Structure

Each seed exports a `seed()` function:

```typescript
import { ClickHouseClient } from '@clickhouse/client';

export async function seed(client: ClickHouseClient, database: string): Promise<void> {
  const data = [/* sample data */];

  await client.insert({
    table: `${database}.table_name`,
    values: data,
    format: 'JSONEachRow',
  });
}
```

## Sample Data Details

### 001-sample-audit-logs.ts (5 records)
- User login events
- Permission changes
- Entity CRUD operations
- Timestamps: Last 24 hours

### 002-sample-metrics.ts (240 records)
- 60 CPU usage metrics (1 per minute)
- 60 Memory usage metrics
- 60 HTTP request counts
- 60 Response time metrics
- Timestamps: Last 1 hour

### 003-sample-traces.ts (30 spans = 10 traces)
- 10 complete HTTP request traces
- Each trace: 3 spans (HTTP → Service → Database)
- 2 error traces included
- Timestamps: Last 30 minutes

## Adding New Seed

1. Create file: `00X-sample-description.ts`
2. Implement `seed()` function
3. Ensure migration exists for target table
4. Run seeds

Example:
```typescript
import { ClickHouseClient } from '@clickhouse/client';

export async function seed(client: ClickHouseClient, database: string): Promise<void> {
  const events = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      event_name: 'user.signup',
      timestamp: new Date().toISOString(),
      data: JSON.stringify({ email: 'user@example.com' }),
    },
  ];

  await client.insert({
    table: `${database}.events`,
    values: events,
    format: 'JSONEachRow',
  });

  console.log(`✅ Seeded ${events.length} events`);
}
```

## Idempotency

Seeds are NOT idempotent by default:
- Running seeds multiple times will insert duplicate data
- Use `pnpm db:cleanup` before re-seeding
- Or add existence checks in seed functions

## Environment Variables

```env
CLICKHOUSE_HOST=172.151.151.40
CLICKHOUSE_PORT=8123
CLICKHOUSE_DB=telemetryflow_db
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=telemetryflow123
```

## Troubleshooting

### Table Does Not Exist
```bash
# Run migrations first
pnpm db:migrate:clickhouse

# Then run seeds
pnpm db:seed:clickhouse
```

### Duplicate Data
```bash
# Clean database
pnpm db:cleanup

# Re-run migrations and seeds
pnpm db:migrate:seed
```

### Connection Error
```bash
# Check ClickHouse is running
docker ps | grep clickhouse

# Verify .env configuration
grep CLICKHOUSE_ .env
```

## References

- [ClickHouse INSERT](https://clickhouse.com/docs/en/sql-reference/statements/insert-into)
- [ClickHouse Data Types](https://clickhouse.com/docs/en/sql-reference/data-types)
