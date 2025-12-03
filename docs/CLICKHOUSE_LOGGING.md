# ClickHouse Logging - TelemetryFlow Core

Complete guide for storing logs, metrics, and traces in ClickHouse.

## Overview

TelemetryFlow Core uses ClickHouse as a high-performance storage backend for:
- **Application Logs** - All application and infrastructure logs
- **Metrics** - Performance and business metrics
- **Traces** - Distributed tracing data
- **Audit Logs** - IAM audit trail

## Architecture

```
Winston Logger → ClickHouse Transport → ClickHouse
OTEL Collector → ClickHouse Exporter → ClickHouse
Application → ClickHouseService → ClickHouse
```

## Database Schema

### 1. Logs Table

Stores application and infrastructure logs with OTLP support.

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
# Run all ClickHouse migrations
pnpm db:migrate:clickhouse

# Or manually
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < src/database/clickhouse/migrations/002-logs.sql
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < src/database/clickhouse/migrations/003-metrics.sql
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < src/database/clickhouse/migrations/004-traces.sql
```

### 2. Configure Environment

```env
# ClickHouse Configuration
CLICKHOUSE_HOST=http://172.151.151.40:8123
CLICKHOUSE_DB=telemetryflow_db
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```

### 3. Import ClickHouse Module

```typescript
// app.module.ts
import { ClickHouseModule } from './shared/clickhouse/clickhouse.module';

@Module({
  imports: [
    ClickHouseModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Usage

### Logging with Winston

Winston automatically sends logs to ClickHouse via the ClickHouse transport.

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('MyService');

logger.log('User created', {
  organization_id: 'org-123',
  workspace_id: 'ws-456',
  tenant_id: 'tenant-789',
});

logger.error('Failed to process request', {
  trace_id: 'abc123',
  span_id: 'def456',
});
```

### Direct ClickHouse Service

```typescript
import { ClickHouseService } from './shared/clickhouse/clickhouse.service';

@Injectable()
export class MyService {
  constructor(private readonly clickHouse: ClickHouseService) {}

  async logCustomEvent() {
    await this.clickHouse.insertLog({
      timestamp: new Date(),
      trace_id: 'trace-123',
      span_id: 'span-456',
      trace_flags: 0,
      severity_text: 'INFO',
      severity_number: 9,
      service_name: 'telemetryflow-core',
      organization_id: 'org-123',
      body: 'Custom event occurred',
      resource_attributes: {},
      log_attributes: { custom: 'data' },
    });
  }

  async queryLogs() {
    const logs = await this.clickHouse.queryLogs({
      startTime: new Date(Date.now() - 3600000), // Last hour
      service_name: 'telemetryflow-core',
      severity: 'ERROR',
      limit: 100,
    });
    return logs;
  }
}
```

### Metrics

```typescript
await this.clickHouse.insertMetric({
  timestamp: new Date(),
  metric_name: 'http_requests_total',
  metric_type: 'counter',
  value: 1,
  service_name: 'telemetryflow-core',
  organization_id: 'org-123',
  metric_attributes: {
    method: 'GET',
    path: '/api/users',
    status: '200',
  },
});
```

### Traces

```typescript
await this.clickHouse.insertTrace({
  timestamp: new Date(),
  trace_id: 'trace-123',
  span_id: 'span-456',
  parent_span_id: 'span-parent',
  span_name: 'GET /api/users',
  span_kind: 'SERVER',
  service_name: 'telemetryflow-core',
  status_code: 'OK',
  duration_ns: 1500000, // 1.5ms
  resource_attributes: {},
  span_attributes: {
    'http.method': 'GET',
    'http.url': '/api/users',
    'http.status_code': '200',
  },
});
```

## Querying Data

### Query Logs

```sql
-- Recent error logs
SELECT timestamp, service_name, body, trace_id
FROM logs
WHERE severity_text = 'ERROR'
  AND timestamp >= now() - INTERVAL 1 HOUR
ORDER BY timestamp DESC
LIMIT 100;

-- Logs by organization
SELECT timestamp, severity_text, body
FROM logs
WHERE organization_id = 'org-123'
  AND timestamp >= today()
ORDER BY timestamp DESC;

-- Log statistics
SELECT 
  toStartOfHour(timestamp) AS hour,
  service_name,
  severity_text,
  count() AS count
FROM logs
WHERE timestamp >= now() - INTERVAL 24 HOUR
GROUP BY hour, service_name, severity_text
ORDER BY hour DESC;
```

### Query Metrics

```sql
-- Metric values over time
SELECT 
  toStartOfMinute(timestamp) AS minute,
  metric_name,
  avg(value) AS avg_value,
  max(value) AS max_value
FROM metrics
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
FROM metrics_1m
WHERE timestamp_1m >= now() - INTERVAL 1 HOUR
GROUP BY timestamp_1m, metric_name
ORDER BY timestamp_1m DESC;
```

### Query Traces

```sql
-- Slow traces
SELECT 
  timestamp,
  trace_id,
  span_name,
  duration_ns / 1000000 AS duration_ms
FROM traces
WHERE duration_ns > 1000000000 -- > 1 second
  AND timestamp >= now() - INTERVAL 1 HOUR
ORDER BY duration_ns DESC
LIMIT 100;

-- Error traces
SELECT *
FROM traces_errors
WHERE date = today()
ORDER BY timestamp DESC;

-- Trace statistics
SELECT 
  service_name,
  span_name,
  count() AS count,
  avg(duration_ns) / 1000000 AS avg_duration_ms,
  max(duration_ns) / 1000000 AS max_duration_ms
FROM traces
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY service_name, span_name
ORDER BY count DESC;
```

## Performance Optimization

### Batch Inserts

Always use batch inserts for better performance:

```typescript
// Good - Batch insert
const logs = [...]; // Array of 100 logs
await this.clickHouse.insertLogs(logs);

// Bad - Individual inserts
for (const log of logs) {
  await this.clickHouse.insertLog(log); // Slow!
}
```

### Winston Transport Batching

The Winston ClickHouse transport automatically batches logs:

- **Batch Size**: 100 logs (configurable)
- **Flush Interval**: 5 seconds (configurable)
- **Auto-flush**: On batch size reached

### Materialized Views

Use materialized views for pre-aggregated data:

```sql
-- Query pre-aggregated 1-minute metrics (fast)
SELECT * FROM metrics_1m WHERE timestamp_1m >= now() - INTERVAL 1 HOUR;

-- Instead of aggregating raw data (slow)
SELECT toStartOfMinute(timestamp), avg(value)
FROM metrics
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY toStartOfMinute(timestamp);
```

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

### Logs Not Appearing

1. Check ClickHouse is running:
   ```bash
   docker ps | grep clickhouse
   ```

2. Check migrations ran:
   ```bash
   docker exec telemetryflow_core_clickhouse clickhouse-client -q "SHOW TABLES FROM telemetryflow_db"
   ```

3. Check Winston transport is configured:
   ```typescript
   // Verify ClickHouseService is injected
   ```

### High Memory Usage

- Reduce batch size in Winston transport
- Increase flush interval
- Check TTL is working (old data being deleted)

### Slow Queries

- Use materialized views for aggregations
- Add appropriate indexes
- Partition by time for better performance

## Resources

- [ClickHouse Documentation](https://clickhouse.com/docs)
- [ClickHouse Client](https://github.com/ClickHouse/clickhouse-js)
- [Winston Transports](https://github.com/winstonjs/winston#transports)

---

**Last Updated**: 2025-12-03
**Retention Policies**: Logs (30d), Metrics (90d), Traces (7d), Audit (90d)
