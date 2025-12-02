-- ClickHouse Audit Logs Schema
-- TelemetryFlow Core - Audit Module

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ${CLICKHOUSE_DB:telemetryflow_db};

-- Use database
USE ${CLICKHOUSE_DB:telemetryflow_db};

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    -- Primary fields
    id UUID DEFAULT generateUUIDv4(),
    timestamp DateTime64(3) DEFAULT now64(3),
    
    -- User information
    user_id String,
    user_email String,
    user_first_name String,
    user_last_name String,
    
    -- Event information
    event_type Enum8('AUTH' = 1, 'AUTHZ' = 2, 'DATA' = 3, 'SYSTEM' = 4),
    action String,
    resource String,
    result Enum8('SUCCESS' = 1, 'FAILURE' = 2, 'DENIED' = 3),
    
    -- Error information
    error_message String,
    
    -- Request information
    ip_address String,
    user_agent String,
    
    -- Additional metadata
    metadata String, -- JSON string
    
    -- Multi-tenancy
    tenant_id String,
    workspace_id String,
    organization_id String,
    
    -- Session tracking
    session_id String,
    
    -- Performance tracking
    duration_ms UInt32,
    
    -- Timestamps
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, event_type, user_id)
TTL timestamp + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- Create indexes for common queries (skip if already exists)
-- Note: ClickHouse doesn't support IF NOT EXISTS for indexes, so we skip errors
-- Index on user_id for user activity queries
ALTER TABLE audit_logs ADD INDEX IF NOT EXISTS idx_user_id user_id TYPE bloom_filter GRANULARITY 1;

-- Index on event_type for filtering by event type
ALTER TABLE audit_logs ADD INDEX IF NOT EXISTS idx_event_type event_type TYPE set(0) GRANULARITY 1;

-- Index on result for filtering by result
ALTER TABLE audit_logs ADD INDEX IF NOT EXISTS idx_result result TYPE set(0) GRANULARITY 1;

-- Index on action for filtering by action
ALTER TABLE audit_logs ADD INDEX IF NOT EXISTS idx_action action TYPE bloom_filter GRANULARITY 1;

-- Index on tenant_id for multi-tenancy
ALTER TABLE audit_logs ADD INDEX IF NOT EXISTS idx_tenant_id tenant_id TYPE bloom_filter GRANULARITY 1;

-- Index on organization_id for multi-tenancy
ALTER TABLE audit_logs ADD INDEX IF NOT EXISTS idx_organization_id organization_id TYPE bloom_filter GRANULARITY 1;

-- Create materialized view for statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS audit_logs_stats
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, event_type, result)
AS SELECT
    toDate(timestamp) AS date,
    event_type,
    result,
    count() AS count
FROM audit_logs
GROUP BY date, event_type, result;

-- Create materialized view for user activity
CREATE MATERIALIZED VIEW IF NOT EXISTS audit_logs_user_activity
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, user_id, event_type)
AS SELECT
    toDate(timestamp) AS date,
    user_id,
    event_type,
    count() AS count
FROM audit_logs
WHERE user_id != ''
GROUP BY date, user_id, event_type;
