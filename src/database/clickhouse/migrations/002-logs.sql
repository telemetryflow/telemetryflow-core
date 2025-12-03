-- ClickHouse Logs Schema
-- TelemetryFlow Core - Application and Infrastructure Logs
-- Stores logs with OTLP observed_timestamp support

-- Use database
USE ${CLICKHOUSE_DB};

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
    -- Timestamps
    timestamp DateTime64(9),
    observed_timestamp DateTime64(9) DEFAULT now64(9),
    
    -- Trace correlation
    trace_id String,
    span_id String,
    trace_flags UInt32,
    
    -- Severity
    severity_text String,
    severity_number UInt8,
    
    -- Service information
    service_name String,
    
    -- Multi-tenancy
    organization_id String DEFAULT '',
    workspace_id String DEFAULT '',
    tenant_id String DEFAULT '',
    
    -- Log content
    body String,
    
    -- Attributes
    resource_attributes Map(String, String),
    scope_name String,
    scope_version String,
    log_attributes Map(String, String)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (service_name, timestamp)
TTL toDateTime(timestamp) + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;

-- Create indexes for common queries
ALTER TABLE logs ADD INDEX IF NOT EXISTS idx_timestamp timestamp TYPE minmax GRANULARITY 1;
ALTER TABLE logs ADD INDEX IF NOT EXISTS idx_trace_id trace_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE logs ADD INDEX IF NOT EXISTS idx_service_name service_name TYPE bloom_filter GRANULARITY 1;
ALTER TABLE logs ADD INDEX IF NOT EXISTS idx_severity severity_text TYPE set(10) GRANULARITY 1;
ALTER TABLE logs ADD INDEX IF NOT EXISTS idx_organization_id organization_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE logs ADD INDEX IF NOT EXISTS idx_workspace_id workspace_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE logs ADD INDEX IF NOT EXISTS idx_tenant_id tenant_id TYPE bloom_filter GRANULARITY 1;

-- Create materialized view for log statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS logs_stats
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, service_name, severity_text)
AS SELECT
    toDate(timestamp) AS date,
    service_name,
    severity_text,
    count() AS count
FROM logs
GROUP BY date, service_name, severity_text;

-- Create materialized view for error logs
CREATE MATERIALIZED VIEW IF NOT EXISTS logs_errors
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, service_name, timestamp)
AS SELECT
    toDate(timestamp) AS date,
    timestamp,
    service_name,
    severity_text,
    body,
    trace_id,
    organization_id,
    workspace_id,
    tenant_id
FROM logs
WHERE severity_number >= 17; -- ERROR and above (ERROR=17, FATAL=21)
