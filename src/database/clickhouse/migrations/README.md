# ClickHouse Migrations

TypeScript migrations for ClickHouse database schema.

## Available Migrations

| File | Description | Tables/Views | Status |
|------|-------------|--------------|--------|
| `1704240000001-CreateAuditLogsTable.ts` | Audit logs with materialized views | audit_logs, audit_logs_stats, audit_logs_user_activity | ✅ Active |
| `1704240000002-CreateLogsTable.ts` | Application logs with error tracking | logs, logs_stats, logs_errors | ✅ Active |
| `1704240000003-CreateMetricsTable.ts` | Metrics with 1m/1h aggregations | metrics, metrics_1m, metrics_1h | ✅ Active |
| `1704240000004-CreateTracesTable.ts` | Distributed traces with statistics | traces, traces_stats, traces_errors | ✅ Active |

## Running Migrations

```bash
# Run all ClickHouse migrations (recommended)
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
  console.log('📊 Creating table_name table and views...');
  
  // Create database if not exists
  await client.command({
    query: `CREATE DATABASE IF NOT EXISTS ${database}`,
  });

  // Create table
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${database}.table_name (
        id UUID DEFAULT generateUUIDv4(),
        timestamp DateTime64(3) DEFAULT now64(3),
        ...
      ) ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (timestamp, id)
      TTL timestamp + INTERVAL 90 DAY
    `,
  });
  
  // Create materialized views
  await client.command({
    query: `CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.table_stats ...`,
  });
  
  console.log('   ✅ Created table_name table and views');
}

export async function down(client: ClickHouseClient, database: string): Promise<void> {
  // Drop materialized views first
  await client.command({
    query: `DROP VIEW IF EXISTS ${database}.table_stats`,
  });
  
  // Drop table
  await client.command({
    query: `DROP TABLE IF EXISTS ${database}.table_name`,
  });
}
```

## Tables Created

### 1. audit_logs
**Purpose**: IAM audit trail for compliance and security

**Columns**:
- `id` - UUID (auto-generated)
- `timestamp` - Event timestamp (DateTime64)
- `user_id`, `user_email`, `user_first_name`, `user_last_name` - User info
- `event_type` - AUTH, AUTHZ, DATA, SYSTEM
- `action` - Action performed
- `resource` - Resource affected
- `result` - SUCCESS, FAILURE, DENIED
- `error_message` - Error details
- `ip_address`, `user_agent` - Request metadata
- `tenant_id`, `workspace_id`, `organization_id` - Multi-tenancy
- `session_id` - Session tracking
- `duration_ms` - Operation duration

**Materialized Views**:
- `audit_logs_stats` - Statistics by event type and result
- `audit_logs_user_activity` - User activity summary

**Retention**: 90 days

### 2. logs
**Purpose**: Application and infrastructure logs

**Columns**:
- `timestamp` - Log timestamp
- `trace_id`, `span_id` - Trace correlation
- `severity_text` - Log level (ERROR, WARN, INFO, etc.)
- `severity_number` - Numeric severity (1-21)
- `service_name` - Service identifier
- `organization_id`, `workspace_id`, `tenant_id` - Multi-tenancy
- `body` - Log message
- `resource_attributes` - Resource metadata
- `log_attributes` - Additional attributes

**Materialized Views**:
- `logs_stats` - Log statistics by service and severity
- `logs_errors` - Error logs only (severity >= 17)

**Retention**: 30 days

### 3. metrics
**Purpose**: Performance and business metrics

**Columns**:
- `timestamp` - Metric timestamp
- `metric_name` - Metric identifier
- `metric_type` - gauge, counter, histogram, summary
- `value` - Metric value
- `service_name` - Service identifier
- `organization_id`, `workspace_id`, `tenant_id` - Multi-tenancy
- `resource_attributes` - Resource metadata
- `metric_attributes` - Metric labels
- `unit` - Measurement unit

**Materialized Views**:
- `metrics_1m` - 1-minute aggregations
- `metrics_1h` - 1-hour aggregations

**Retention**: 90 days

### 4. traces
**Purpose**: Distributed tracing spans (OpenTelemetry)

**Columns**:
- `timestamp` - Span timestamp
- `trace_id` - Trace identifier
- `span_id` - Span identifier
- `parent_span_id` - Parent span ID
- `span_name` - Operation name
- `span_kind` - INTERNAL, SERVER, CLIENT, etc.
- `service_name` - Service identifier
- `organization_id`, `workspace_id`, `tenant_id` - Multi-tenancy
- `status_code` - UNSET, OK, ERROR
- `duration_ns` - Span duration in nanoseconds
- `resource_attributes` - Resource metadata
- `span_attributes` - Span metadata

**Materialized Views**:
- `traces_stats` - Trace statistics by service
- `traces_errors` - Error traces only

**Retention**: 7 days

## Adding New Migration

1. Create file: `1704240000XXX-CreateTableName.ts`
2. Implement `up()` and `down()` functions
3. Add idempotency checks (`IF NOT EXISTS`, `IF EXISTS`)
4. Run migrations

Example:
```typescript
import { ClickHouseClient } from '@clickhouse/client';

export async function up(client: ClickHouseClient, database: string): Promise<void> {
  console.log('📊 Creating events table...');
  
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${database}.events (
        id UUID DEFAULT generateUUIDv4(),
        event_name String,
        timestamp DateTime64(3),
        data String
      ) ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (timestamp, id)
      TTL timestamp + INTERVAL 30 DAY
    `,
  });
  
  console.log('   ✅ Created events table');
}

export async function down(client: ClickHouseClient, database: string): Promise<void> {
  await client.command({
    query: `DROP TABLE IF EXISTS ${database}.events`,
  });
}
```

## Idempotency

All migrations are idempotent:
- ✅ Use `IF NOT EXISTS` for CREATE statements
- ✅ Use `IF EXISTS` for DROP statements
- ✅ Safe to run multiple times
- ✅ No errors if tables already exist

## Environment Variables

```env
CLICKHOUSE_HOST=172.151.151.40
CLICKHOUSE_PORT=8123
CLICKHOUSE_DB=telemetryflow_db
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=telemetryflow123
```

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
docker exec telemetryflow_core_clickhouse clickhouse-client \
  --query "SHOW DATABASES"

# Check tables
docker exec telemetryflow_core_clickhouse clickhouse-client \
  --query "SHOW TABLES FROM telemetryflow_db"
```

### Password Error
```bash
# Verify .env has CLICKHOUSE_PASSWORD
grep CLICKHOUSE_PASSWORD .env

# Should show: CLICKHOUSE_PASSWORD=telemetryflow123
```

### Container Unhealthy
```bash
# Check logs
docker logs telemetryflow_core_clickhouse --tail 50

# Check error log
docker exec telemetryflow_core_clickhouse \
  cat /var/log/clickhouse-server/clickhouse-server.err.log

# Fix permissions (if needed)
sudo chown -R 101:101 /opt/data/docker/telemetryflow-core/clickhouse
sudo chmod -R 777 /opt/data/docker/telemetryflow-core/clickhouse
docker restart telemetryflow_core_clickhouse
```

## References

- [ClickHouse SQL Reference](https://clickhouse.com/docs/en/sql-reference)
- [ClickHouse MergeTree Engine](https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree)
- [ClickHouse Materialized Views](https://clickhouse.com/docs/en/sql-reference/statements/create/view#materialized-view)
- [ClickHouse TTL](https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree#table_engine-mergetree-ttl)

---

**Last Updated**: 2025-12-06  
**Total Migrations**: 4  
**Total Tables**: 4 (audit_logs, logs, metrics, traces)  
**Total Views**: 8 (2 per table)
