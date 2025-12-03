-- ClickHouse Traces Schema
-- TelemetryFlow Core - Distributed Tracing

-- Use database
USE ${CLICKHOUSE_DB};

-- Create traces table
CREATE TABLE IF NOT EXISTS traces (
    -- Timestamps
    timestamp DateTime64(9),
    
    -- Trace identification
    trace_id String,
    span_id String,
    parent_span_id String DEFAULT '',
    
    -- Span information
    span_name String,
    span_kind Enum8('UNSPECIFIED' = 0, 'INTERNAL' = 1, 'SERVER' = 2, 'CLIENT' = 3, 'PRODUCER' = 4, 'CONSUMER' = 5),
    
    -- Service information
    service_name String,
    
    -- Multi-tenancy
    organization_id String DEFAULT '',
    workspace_id String DEFAULT '',
    tenant_id String DEFAULT '',
    
    -- Status
    status_code Enum8('UNSET' = 0, 'OK' = 1, 'ERROR' = 2),
    status_message String DEFAULT '',
    
    -- Duration
    duration_ns UInt64,
    
    -- Attributes
    resource_attributes Map(String, String),
    span_attributes Map(String, String),
    
    -- Events
    events Array(String) DEFAULT []
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (service_name, trace_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 7 DAY
SETTINGS index_granularity = 8192;

-- Create indexes
ALTER TABLE traces ADD INDEX IF NOT EXISTS idx_timestamp timestamp TYPE minmax GRANULARITY 1;
ALTER TABLE traces ADD INDEX IF NOT EXISTS idx_trace_id trace_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE traces ADD INDEX IF NOT EXISTS idx_span_id span_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE traces ADD INDEX IF NOT EXISTS idx_service_name service_name TYPE bloom_filter GRANULARITY 1;
ALTER TABLE traces ADD INDEX IF NOT EXISTS idx_span_name span_name TYPE bloom_filter GRANULARITY 1;
ALTER TABLE traces ADD INDEX IF NOT EXISTS idx_organization_id organization_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE traces ADD INDEX IF NOT EXISTS idx_workspace_id workspace_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE traces ADD INDEX IF NOT EXISTS idx_tenant_id tenant_id TYPE bloom_filter GRANULARITY 1;

-- Create materialized view for trace statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS traces_stats
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, service_name, span_name)
AS SELECT
    toDate(timestamp) AS date,
    service_name,
    span_name,
    status_code,
    count() AS count,
    avg(duration_ns) AS avg_duration_ns,
    max(duration_ns) AS max_duration_ns,
    min(duration_ns) AS min_duration_ns
FROM traces
GROUP BY date, service_name, span_name, status_code;

-- Create materialized view for error traces
CREATE MATERIALIZED VIEW IF NOT EXISTS traces_errors
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, service_name, timestamp)
AS SELECT
    toDate(timestamp) AS date,
    timestamp,
    trace_id,
    span_id,
    service_name,
    span_name,
    status_message,
    duration_ns,
    organization_id,
    workspace_id,
    tenant_id
FROM traces
WHERE status_code = 'ERROR';
