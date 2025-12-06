# ClickHouse Seeds

Sample data seeds for ClickHouse database.

## Available Seeds

| File | Description | Records | Dependencies |
|------|-------------|---------|-------------|
| `1704240000001-seed-sample-audit-logs.ts` | Sample audit log entries | 5 | Migration 1 |
| `1704240000002-seed-sample-logs.ts` | Sample application logs | 10 | Migration 2 |
| `1704240000003-seed-sample-metrics.ts` | Sample performance metrics | 240 | Migration 3 |
| `1704240000004-seed-sample-traces.ts` | Sample distributed traces | 30 spans (10 traces) | Migration 4 |

## Running Seeds

```bash
# Run all ClickHouse seeds (recommended)
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
  console.log('🌱 Seeding sample data...');
  
  const data = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      // ... other fields
    },
  ];

  await client.insert({
    table: `${database}.table_name`,
    values: data,
    format: 'JSONEachRow',
  });
  
  console.log(`   ✅ Seeded ${data.length} records`);
}
```

## Sample Data Details

### 1704240000001-seed-sample-audit-logs.ts (5 records)
**Purpose**: Sample audit log entries for testing

**Data**:
- User login events (AUTH)
- Permission changes (AUTHZ)
- Entity CRUD operations (DATA)
- System events (SYSTEM)
- Mix of SUCCESS, FAILURE, DENIED results

**Timestamps**: Last 24 hours

### 1704240000002-seed-sample-logs.ts (10 records)
**Purpose**: Sample application logs with different severity levels

**Data**:
- ERROR logs (severity 17-20)
- WARN logs (severity 13-16)
- INFO logs (severity 9-12)
- DEBUG logs (severity 5-8)
- Trace correlation IDs included

**Timestamps**: Last 1 hour

### 1704240000003-seed-sample-metrics.ts (240 records)
**Purpose**: Sample performance metrics for monitoring

**Data**:
- 60 CPU usage metrics (1 per minute)
- 60 Memory usage metrics (1 per minute)
- 60 HTTP request counts (1 per minute)
- 60 Response time metrics (1 per minute)
- Metric types: gauge, counter, histogram

**Timestamps**: Last 1 hour

### 1704240000004-seed-sample-traces.ts (30 spans = 10 traces)
**Purpose**: Sample distributed traces for OpenTelemetry

**Data**:
- 10 complete HTTP request traces
- Each trace: 3 spans (HTTP → Service → Database)
- 2 error traces included (status_code = ERROR)
- 8 successful traces (status_code = OK)
- Span kinds: SERVER, INTERNAL, CLIENT

**Timestamps**: Last 30 minutes

## Adding New Seed

1. Create file: `1704240000XXX-seed-sample-description.ts`
2. Implement `seed()` function
3. Ensure migration exists for target table
4. Add to `index.ts` exports
5. Run seeds

Example:
```typescript
import { ClickHouseClient } from '@clickhouse/client';

export async function seedSampleEvents(client: ClickHouseClient, database: string): Promise<void> {
  console.log('🌱 Seeding sample events...');
  
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

  console.log(`   ✅ Seeded ${events.length} events`);
}
```

## Idempotency

⚠️ **Seeds are NOT idempotent by default**:
- Running seeds multiple times will insert duplicate data
- Use `pnpm db:cleanup` before re-seeding
- Or add existence checks in seed functions

To make seeds idempotent:
```typescript
export async function seed(client: ClickHouseClient, database: string): Promise<void> {
  // Check if already seeded
  const result = await client.query({
    query: `SELECT count() as count FROM ${database}.table_name`,
    format: 'JSONEachRow',
  });
  
  const data = await result.json();
  if (data[0].count > 0) {
    console.log('   ⚠️  Already seeded. Skipping...');
    return;
  }
  
  // Seed data...
}
```

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
# Clean database (drops all tables)
pnpm db:cleanup

# Re-run migrations and seeds
pnpm db:migrate:seed
```

### Connection Error
```bash
# Check ClickHouse is running
docker ps | grep clickhouse

# Test connection
docker exec telemetryflow_core_clickhouse clickhouse-client --query "SELECT 1"

# Verify .env configuration
grep CLICKHOUSE_ .env
```

### Insert Fails
```bash
# Check table exists
docker exec telemetryflow_core_clickhouse clickhouse-client \
  --query "SHOW TABLES FROM telemetryflow_db"

# Check table schema
docker exec telemetryflow_core_clickhouse clickhouse-client \
  --query "DESCRIBE telemetryflow_db.audit_logs"
```

## Querying Sample Data

After seeding, query the data:

```bash
# Audit logs
docker exec telemetryflow_core_clickhouse clickhouse-client \
  --query "SELECT * FROM telemetryflow_db.audit_logs ORDER BY timestamp DESC LIMIT 5"

# Application logs
docker exec telemetryflow_core_clickhouse clickhouse-client \
  --query "SELECT * FROM telemetryflow_db.logs ORDER BY timestamp DESC LIMIT 10"

# Metrics
docker exec telemetryflow_core_clickhouse clickhouse-client \
  --query "SELECT * FROM telemetryflow_db.metrics ORDER BY timestamp DESC LIMIT 10"

# Traces
docker exec telemetryflow_core_clickhouse clickhouse-client \
  --query "SELECT * FROM telemetryflow_db.traces ORDER BY timestamp DESC LIMIT 10"
```

## References

- [ClickHouse INSERT](https://clickhouse.com/docs/en/sql-reference/statements/insert-into)
- [ClickHouse Data Types](https://clickhouse.com/docs/en/sql-reference/data-types)
- [ClickHouse Client](https://github.com/ClickHouse/clickhouse-js)

---

**Last Updated**: 2025-12-06  
**Total Seeds**: 4  
**Total Records**: 285 (5 audit logs + 10 logs + 240 metrics + 30 trace spans)
