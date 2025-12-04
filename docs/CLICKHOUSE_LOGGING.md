# ClickHouse Logging - TelemetryFlow Core

Complete guide for storing logs, metrics, traces, and audit logs in ClickHouse.

## Overview

TelemetryFlow Core uses ClickHouse as a high-performance storage backend for:
- **Audit Logs** - IAM audit trail (user actions, entity changes)
- **Application Logs** - All application and infrastructure logs
- **Metrics** - Performance and business metrics
- **Traces** - Distributed tracing data (OpenTelemetry)

## Architecture

```
Application → ClickHouse Client → ClickHouse
Winston Logger → ClickHouse Transport → ClickHouse
OTEL Collector → ClickHouse Exporter → ClickHouse
```

## Database Schema

### Migration Files

Located in `src/database/clickhouse/migrations/`:

| Migration | Description | Tables/Views |
|-----------|-------------|--------------|
| `1704240000001-CreateAuditLogsTable.ts` | Audit logs with materialized views | audit_logs, audit_logs_stats, audit_logs_user_activity |
| `1704240000002-CreateLogsTable.ts` | Application logs with error tracking | logs, logs_stats, logs_errors |
| `1704240000003-CreateMetricsTable.ts` | Metrics with 1m/1h aggregations | metrics, metrics_1m, metrics_1h |
| `1704240000004-CreateTracesTable.ts` | Distributed traces with statistics | traces, traces_stats, traces_errors |

### 1. Audit Logs Table

Stores IAM audit trail for user actions and entity changes.

**Retention**: 90 days
**Partition**: Monthly (YYYYMM)

**Key Columns**:
- `id` - UUID (auto-generated)
- `timestamp` - Event timestamp (DateTime64)
- `user_id`, `user_email`, `user_first_name`, `user_last_name` - User info
- `event_type` - AUTH, AUTHZ, DATA, SYSTEM
- `action` - Action performed (e.g., CREATE, UPDATE, DELETE)
- `resource` - Resource affected (e.g., users, roles)
- `result` - SUCCESS, FAILURE, DENIED
- `error_message` - Error details if failed
- `ip_address`, `user_agent` - Request metadata
- `tenant_id`, `workspace_id`, `organization_id` - Multi-tenancy
- `session_id` - Session tracking
- `duration_ms` - Operation duration

**Materialized Views**:
- `audit_logs_stats` - Statistics by event type and result
- `audit_logs_user_activity` - User activity summary

### 2. Logs Table

Stores application and infrastructure logs.

**Retention**: 30 days
**Partition**: Daily (YYYYMMDD)

**Columns**:
- `timestamp` - Log timestamp
- `observed_timestamp` - Ingestion timestamp
- `trace_id` - Trace correlation ID
- `span_id` - Span correlation ID
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

### 2. Metrics Table

Stores performance and business metrics.

**Retention**: 90 days
**Partition**: Daily (YYYYMMDD)

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

### 3. Traces Table

Stores distributed tracing spans.

**Retention**: 7 days
**Partition**: Daily (YYYYMMDD)

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

### 4. Audit Logs Table

Stores IAM audit trail.

**Retention**: 90 days
**Partition**: Monthly (YYYYMM)

See [001-audit-logs.sql](../src/database/clickhouse/migrations/001-audit-logs.sql)

## Setup

### 1. Run Migrations

```bash
# Run all ClickHouse migrations (recommended)
pnpm db:migrate:clickhouse

# Run all migrations (PostgreSQL + ClickHouse)
pnpm db:migrate

# Run migrations + seeds
pnpm db:migrate:seed
```

Migrations are TypeScript files that use `@clickhouse/client` and are located in:
- `src/database/clickhouse/migrations/`

Each migration exports `up()` and `down()` functions for schema changes.

### 2. Seed Sample Data (Optional)

```bash
# Run all ClickHouse seeds
pnpm db:seed:clickhouse

# Run all seeds (PostgreSQL + ClickHouse)
pnpm db:seed
```

Seeds are located in:
- `src/database/clickhouse/seeds/`

Sample data includes:
- 5 audit log entries
- 240 metrics (last 1 hour)
- 30 trace spans (10 traces, last 30 minutes)

### 3. Configure Environment

```env
# ClickHouse Configuration
CLICKHOUSE_HOST=172.151.151.40
CLICKHOUSE_PORT=8123
CLICKHOUSE_DB=telemetryflow_db
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=telemetryflow123
```

### 4. Verify Setup

```bash
# Check ClickHouse is running
docker ps | grep clickhouse

# Check tables exist
docker exec telemetryflow_core_clickhouse clickhouse-client \
  --query "SHOW TABLES FROM telemetryflow_db"

# Expected output:
# audit_logs
# audit_logs_stats
# audit_logs_user_activity
# logs
# logs_errors
# logs_stats
# metrics
# metrics_1h
# metrics_1m
# traces
# traces_errors
# traces_stats
```

## Usage

### Direct ClickHouse Client

```typescript
import { createClient } from '@clickhouse/client';

const client = createClient({
  url: `http://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT}`,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
});

// Insert audit log
await client.insert({
  table: 'telemetryflow_db.audit_logs',
  values: [{
    timestamp: new Date().toISOString(),
    user_id: 'user-123',
    user_email: 'user@example.com',
    event_type: 'DATA',
    action: 'CREATE',
    resource: 'users',
    result: 'SUCCESS',
    tenant_id: 'tenant-123',
    organization_id: 'org-123',
  }],
  format: 'JSONEachRow',
});

// Query logs
const result = await client.query({
  query: `
    SELECT * FROM telemetryflow_db.logs
    WHERE severity_text = 'ERROR'
    AND timestamp >= now() - INTERVAL 1 HOUR
    ORDER BY timestamp DESC
    LIMIT 100
  `,
  format: 'JSONEachRow',
});

const logs = await result.json();
```

## Querying Data

### Query Audit Logs

```sql
-- Recent audit events
SELECT
  timestamp,
  user_email,
  event_type,
  action,
  resource,
  result
FROM telemetryflow_db.audit_logs
WHERE timestamp >= now() - INTERVAL 1 HOUR
ORDER BY timestamp DESC
LIMIT 100;

-- Failed operations
SELECT
  timestamp,
  user_email,
  action,
  resource,
  error_message
FROM telemetryflow_db.audit_logs
WHERE result = 'FAILURE'
  AND timestamp >= today()
ORDER BY timestamp DESC;

-- User activity summary
SELECT
  user_email,
  event_type,
  count() AS event_count
FROM telemetryflow_db.audit_logs
WHERE timestamp >= now() - INTERVAL 24 HOUR
GROUP BY user_email, event_type
ORDER BY event_count DESC;

-- Audit statistics (materialized view)
SELECT * FROM telemetryflow_db.audit_logs_stats
WHERE date = today()
ORDER BY event_count DESC;
```

### Query Logs

```sql
-- Recent error logs
SELECT timestamp, service_name, body, trace_id
FROM telemetryflow_db.logs
WHERE severity_text = 'ERROR'
  AND timestamp >= now() - INTERVAL 1 HOUR
ORDER BY timestamp DESC
LIMIT 100;

-- Logs by organization
SELECT timestamp, severity_text, body
FROM telemetryflow_db.logs
WHERE organization_id = 'org-123'
  AND timestamp >= today()
ORDER BY timestamp DESC;

-- Log statistics
SELECT
  toStartOfHour(timestamp) AS hour,
  service_name,
  severity_text,
  count() AS count
FROM telemetryflow_db.logs
WHERE timestamp >= now() - INTERVAL 24 HOUR
GROUP BY hour, service_name, severity_text
ORDER BY hour DESC;

-- Error logs (materialized view)
SELECT * FROM telemetryflow_db.logs_errors
WHERE date = today()
ORDER BY timestamp DESC;
```

### Query Metrics

```sql
-- Metric values over time
SELECT
  toStartOfMinute(timestamp) AS minute,
  metric_name,
  avg(value) AS avg_value,
  max(value) AS max_value
FROM telemetryflow_db.metrics
WHERE metric_name = 'http_requests_total'
  AND timestamp >= now() - INTERVAL 1 HOUR
GROUP BY minute, metric_name
ORDER BY minute DESC;

-- Aggregated metrics (1-minute)
SELECT
  timestamp_1m,
  metric_name,
  avgMerge(avg_value) AS avg,
  maxMerge(max_value) AS max
FROM telemetryflow_db.metrics_1m
WHERE timestamp_1m >= now() - INTERVAL 1 HOUR
GROUP BY timestamp_1m, metric_name
ORDER BY timestamp_1m DESC;

-- Aggregated metrics (1-hour)
SELECT
  timestamp_1h,
  metric_name,
  avgMerge(avg_value) AS avg,
  maxMerge(max_value) AS max
FROM telemetryflow_db.metrics_1h
WHERE timestamp_1h >= now() - INTERVAL 24 HOUR
GROUP BY timestamp_1h, metric_name
ORDER BY timestamp_1h DESC;
```

### Query Traces

```sql
-- Slow traces
SELECT
  timestamp,
  trace_id,
  span_name,
  duration_ns / 1000000 AS duration_ms
FROM telemetryflow_db.traces
WHERE duration_ns > 1000000000 -- > 1 second
  AND timestamp >= now() - INTERVAL 1 HOUR
ORDER BY duration_ns DESC
LIMIT 100;

-- Error traces (materialized view)
SELECT *
FROM telemetryflow_db.traces_errors
WHERE date = today()
ORDER BY timestamp DESC;

-- Trace statistics
SELECT
  service_name,
  span_name,
  count() AS count,
  avg(duration_ns) / 1000000 AS avg_duration_ms,
  max(duration_ns) / 1000000 AS max_duration_ms
FROM telemetryflow_db.traces
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY service_name, span_name
ORDER BY count DESC;

-- Trace statistics (materialized view)
SELECT * FROM telemetryflow_db.traces_stats
WHERE date = today()
ORDER BY span_count DESC;
```

## Performance Optimization

### Batch Inserts

Always use batch inserts for better performance:

```typescript
import { createClient } from '@clickhouse/client';

const client = createClient({
  url: `http://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT}`,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
});

// Good - Batch insert
const logs = [
  { timestamp: new Date(), severity_text: 'INFO', body: 'Log 1' },
  { timestamp: new Date(), severity_text: 'INFO', body: 'Log 2' },
  // ... 100 logs
];

await client.insert({
  table: 'telemetryflow_db.logs',
  values: logs,
  format: 'JSONEachRow',
});

// Bad - Individual inserts (slow!)
for (const log of logs) {
  await client.insert({
    table: 'telemetryflow_db.logs',
    values: [log],
    format: 'JSONEachRow',
  });
}
```

### Materialized Views

Use materialized views for pre-aggregated data:

```sql
-- Query pre-aggregated 1-minute metrics (fast)
SELECT * FROM telemetryflow_db.metrics_1m
WHERE timestamp_1m >= now() - INTERVAL 1 HOUR;

-- Instead of aggregating raw data (slow)
SELECT toStartOfMinute(timestamp), avg(value)
FROM telemetryflow_db.metrics
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY toStartOfMinute(timestamp);
```

### Available Materialized Views

| Table | Materialized View | Purpose |
|-------|-------------------|---------|
| audit_logs | audit_logs_stats | Event statistics by type and result |
| audit_logs | audit_logs_user_activity | User activity summary |
| logs | logs_stats | Log statistics by service and severity |
| logs | logs_errors | Error logs only (severity >= 17) |
| metrics | metrics_1m | 1-minute aggregations |
| metrics | metrics_1h | 1-hour aggregations |
| traces | traces_stats | Trace statistics by service |
| traces | traces_errors | Error traces only |

## Monitoring

### Check Table Sizes

```sql
SELECT
  table,
  formatReadableSize(sum(bytes)) AS size,
  sum(rows) AS rows
FROM system.parts
WHERE database = 'telemetryflow_db'
  AND active
GROUP BY table
ORDER BY sum(bytes) DESC;
```

### Check Partitions

```sql
SELECT
  table,
  partition,
  sum(rows) AS rows,
  formatReadableSize(sum(bytes)) AS size
FROM system.parts
WHERE database = 'telemetryflow_db'
  AND active
GROUP BY table, partition
ORDER BY table, partition DESC;
```

### TTL Status

```sql
SELECT
  table,
  partition,
  min(min_date) AS oldest_data,
  max(max_date) AS newest_data
FROM system.parts
WHERE database = 'telemetryflow_db'
  AND active
GROUP BY table, partition
ORDER BY table, oldest_data;
```

## Troubleshooting

### ClickHouse Container Unhealthy

**Error**: `container telemetryflow_core_clickhouse is unhealthy`

**Cause**: Old incompatible data from ClickHouse version < 20.7

**Solution**:
```bash
# Stop container
docker stop telemetryflow_core_clickhouse

# Clean data directory
sudo rm -rf /opt/data/docker/telemetryflow-core/clickhouse/*

# Recreate directories with proper permissions
sudo mkdir -p /opt/data/docker/telemetryflow-core/clickhouse/{data,logs}
sudo chown -R 101:101 /opt/data/docker/telemetryflow-core/clickhouse
sudo chmod -R 777 /opt/data/docker/telemetryflow-core/clickhouse

# Start container
docker start telemetryflow_core_clickhouse

# Wait for healthy status
sleep 10 && docker ps --filter name=clickhouse

# Re-run migrations
pnpm db:migrate:clickhouse
```

### Migrations Not Running

1. Check ClickHouse is running:
   ```bash
   docker ps | grep clickhouse
   ```

2. Check connection:
   ```bash
   docker exec telemetryflow_core_clickhouse clickhouse-client --query "SELECT 1"
   ```

3. Verify environment variables:
   ```bash
   grep CLICKHOUSE_ .env
   ```

4. Run migrations manually:
   ```bash
   pnpm db:migrate:clickhouse
   ```

### Tables Not Appearing

1. Check migrations ran successfully:
   ```bash
   docker exec telemetryflow_core_clickhouse clickhouse-client \
     --query "SHOW TABLES FROM telemetryflow_db"
   ```

2. Expected tables:
   - audit_logs, audit_logs_stats, audit_logs_user_activity
   - logs, logs_stats, logs_errors
   - metrics, metrics_1m, metrics_1h
   - traces, traces_stats, traces_errors

3. If missing, re-run migrations:
   ```bash
   pnpm db:migrate:clickhouse
   ```

### Permission Denied Errors

**Error**: `mkdir: cannot create directory '/var/lib/clickhouse/': Permission denied`

**Solution**:
```bash
# Fix directory permissions
sudo chown -R 101:101 /opt/data/docker/telemetryflow-core/clickhouse
sudo chmod -R 777 /opt/data/docker/telemetryflow-core/clickhouse

# Restart container
docker restart telemetryflow_core_clickhouse
```

### High Memory Usage

- Check table sizes (see Monitoring section)
- Verify TTL is working (old data being deleted)
- Consider reducing retention periods in migrations

### Slow Queries

- Use materialized views for aggregations
- Add appropriate indexes
- Partition by time for better performance
- Use `LIMIT` clause to restrict result sets

## Resources

- [ClickHouse Documentation](https://clickhouse.com/docs)
- [ClickHouse Node.js Client](https://github.com/ClickHouse/clickhouse-js)
- [ClickHouse SQL Reference](https://clickhouse.com/docs/en/sql-reference)
- [ClickHouse MergeTree Engine](https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree)
- [ClickHouse Materialized Views](https://clickhouse.com/docs/en/sql-reference/statements/create/view#materialized-view)

## Migration & Seed Documentation

- [ClickHouse Migrations README](../src/database/clickhouse/migrations/README.md)
- [ClickHouse Seeds README](../src/database/clickhouse/seeds/README.md)

---

- **Last Updated**: 2025-12-05
- **Retention Policies**: Audit Logs (90d), Logs (30d), Metrics (90d), Traces (7d)
