# ClickHouse Migrations

TypeScript migrations for ClickHouse database schema.

## Available Migrations

| File | Description | Tables/Views | Status |
|------|-------------|--------------|--------|
| `001-audit-logs.ts` | Audit logs with materialized views | audit_logs, audit_logs_stats, audit_logs_user_activity | ✅ Active |
| `002-logs.ts` | Application logs with error tracking | logs, logs_stats, logs_errors | ✅ Active |
| `003-metrics.ts` | Metrics with 1m/1h aggregations | metrics, metrics_1m, metrics_1h | ✅ Active |
| `004-traces.ts` | Distributed traces with statistics | traces, traces_stats, traces_errors | ✅ Active |

## Running Migrations

```bash
# Run all ClickHouse migrations
pnpm db:migrate:clickhouse

# Run all migrations (PostgreSQL + ClickHouse)
pnpm db:migrate

# Run migrations + seeds
pnpm db:migrate:seed
```

## Migration Structure

Each migration exports `up()` and `down()` functions:

```typescript
import { ClickHouseClient } from '@clickhouse/client';

export async function up(client: ClickHouseClient, database: string): Promise<void> {
  // Create tables, indexes, materialized views
  await client.exec({
    query: `CREATE TABLE IF NOT EXISTS ${database}.table_name ...`,
  });
}

export async function down(client: ClickHouseClient, database: string): Promise<void> {
  // Drop tables, indexes, materialized views
  await client.exec({
    query: `DROP TABLE IF EXISTS ${database}.table_name`,
  });
}
```

## Tables Created

### 1. audit_logs
- User activity tracking
- Entity change history
- Materialized views: `audit_logs_stats`, `audit_logs_user_activity`

### 2. logs
- Application logs (info, warn, error)
- Error tracking and statistics
- Materialized views: `logs_stats`, `logs_errors`

### 3. metrics
- System and application metrics
- Time-series aggregations
- Materialized views: `metrics_1m` (1-minute), `metrics_1h` (1-hour)

### 4. traces
- Distributed tracing (OpenTelemetry)
- Span statistics and error tracking
- Materialized views: `traces_stats`, `traces_errors`

## Adding New Migration

1. Create file: `00X-table-name.ts`
2. Implement `up()` and `down()` functions
3. Add idempotency checks (`IF NOT EXISTS`, `IF EXISTS`)
4. Run migrations

Example:
```typescript
export async function up(client: ClickHouseClient, database: string): Promise<void> {
  await client.exec({
    query: `
      CREATE TABLE IF NOT EXISTS ${database}.events (
        id UUID DEFAULT generateUUIDv4(),
        event_name String,
        timestamp DateTime64(3),
        data String
      ) ENGINE = MergeTree()
      ORDER BY (timestamp, id)
    `,
  });
}

export async function down(client: ClickHouseClient, database: string): Promise<void> {
  await client.exec({
    query: `DROP TABLE IF EXISTS ${database}.events`,
  });
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

## Validation

Migrations validate:
- ✅ Table existence before creation (`IF NOT EXISTS`)
- ✅ Table existence before dropping (`IF EXISTS`)
- ✅ Idempotency (can run multiple times safely)
- ✅ Database parameter injection

## Troubleshooting

### Connection Failed
```bash
# Check ClickHouse is running
docker ps | grep clickhouse

# Test connection
docker exec telemetryflow_core_clickhouse clickhouse-client --query "SELECT 1"
```

### Migration Fails
```bash
# Check database exists
docker exec telemetryflow_core_clickhouse clickhouse-client --query "SHOW DATABASES"

# Check tables
docker exec telemetryflow_core_clickhouse clickhouse-client --query "SHOW TABLES FROM telemetryflow_db"
```

### Password Error
```bash
# Verify .env has CLICKHOUSE_PASSWORD
grep CLICKHOUSE_PASSWORD .env

# Should show: CLICKHOUSE_PASSWORD=telemetryflow123
```

## References

- [ClickHouse SQL Reference](https://clickhouse.com/docs/en/sql-reference)
- [ClickHouse MergeTree Engine](https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree)
- [ClickHouse Materialized Views](https://clickhouse.com/docs/en/sql-reference/statements/create/view#materialized-view)
