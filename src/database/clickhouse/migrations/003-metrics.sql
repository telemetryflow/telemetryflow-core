-- ClickHouse Metrics Schema
-- TelemetryFlow Core - Application and Infrastructure Metrics

-- Use database
USE ${CLICKHOUSE_DB};

-- Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
    -- Timestamps
    timestamp DateTime64(9),
    
    -- Metric identification
    metric_name String,
    metric_type Enum8('gauge' = 1, 'counter' = 2, 'histogram' = 3, 'summary' = 4),
    
    -- Metric value
    value Float64,
    
    -- Service information
    service_name String,
    
    -- Multi-tenancy
    organization_id String DEFAULT '',
    workspace_id String DEFAULT '',
    tenant_id String DEFAULT '',
    
    -- Attributes
    resource_attributes Map(String, String),
    metric_attributes Map(String, String),
    
    -- Unit
    unit String DEFAULT ''
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (service_name, metric_name, timestamp)
TTL toDateTime(timestamp) + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- Create indexes
ALTER TABLE metrics ADD INDEX IF NOT EXISTS idx_timestamp timestamp TYPE minmax GRANULARITY 1;
ALTER TABLE metrics ADD INDEX IF NOT EXISTS idx_metric_name metric_name TYPE bloom_filter GRANULARITY 1;
ALTER TABLE metrics ADD INDEX IF NOT EXISTS idx_service_name service_name TYPE bloom_filter GRANULARITY 1;
ALTER TABLE metrics ADD INDEX IF NOT EXISTS idx_organization_id organization_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE metrics ADD INDEX IF NOT EXISTS idx_workspace_id workspace_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE metrics ADD INDEX IF NOT EXISTS idx_tenant_id tenant_id TYPE bloom_filter GRANULARITY 1;

-- Create materialized view for metric aggregations (1 minute)
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_1m
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(timestamp_1m)
ORDER BY (service_name, metric_name, timestamp_1m)
AS SELECT
    toStartOfMinute(timestamp) AS timestamp_1m,
    service_name,
    metric_name,
    metric_type,
    avgState(value) AS avg_value,
    minState(value) AS min_value,
    maxState(value) AS max_value,
    sumState(value) AS sum_value,
    countState() AS count_value,
    organization_id,
    workspace_id,
    tenant_id
FROM metrics
GROUP BY timestamp_1m, service_name, metric_name, metric_type, organization_id, workspace_id, tenant_id;

-- Create materialized view for metric aggregations (1 hour)
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_1h
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(timestamp_1h)
ORDER BY (service_name, metric_name, timestamp_1h)
AS SELECT
    toStartOfHour(timestamp) AS timestamp_1h,
    service_name,
    metric_name,
    metric_type,
    avgState(value) AS avg_value,
    minState(value) AS min_value,
    maxState(value) AS max_value,
    sumState(value) AS sum_value,
    countState() AS count_value,
    organization_id,
    workspace_id,
    tenant_id
FROM metrics
GROUP BY timestamp_1h, service_name, metric_name, metric_type, organization_id, workspace_id, tenant_id;
