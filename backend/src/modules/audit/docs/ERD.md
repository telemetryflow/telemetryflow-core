# Audit Module - Entity Relationship Diagram

## Overview

This ERD represents the Audit module entities stored in ClickHouse for high-performance audit logging and analytics.

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ AuditLog : "generates"
    Organization ||--o{ AuditLog : "contains"
    Tenant ||--o{ AuditLog : "belongs to"

    AuditLog {
        uuid id PK
        datetime64 timestamp
        string user_id FK
        string user_email
        string user_first_name
        string user_last_name
        enum8 event_type "AUTH|AUTHZ|DATA|SYSTEM"
        string action
        string resource
        string resource_id
        enum8 result "SUCCESS|FAILURE|DENIED"
        string error_message
        string error_code
        string ip_address
        string user_agent
        string request_method
        string request_path
        string metadata
        string tenant_id FK
        string workspace_id
        string organization_id FK
        string region_id
        string session_id
        string correlation_id
        uint32 duration_ms
        datetime64 created_at
    }

    AuditLogStats {
        date date PK
        enum8 event_type PK
        enum8 result PK
        uint64 count
    }

    AuditLogUserActivity {
        date date PK
        string user_id PK
        enum8 event_type PK
        uint64 count
    }

    AuditLogOrgActivity {
        date date PK
        string organization_id PK
        enum8 event_type PK
        enum8 result PK
        uint64 count
    }

    AuditLog ||--|| AuditLogStats : "aggregates to"
    AuditLog ||--|| AuditLogUserActivity : "aggregates to"
    AuditLog ||--|| AuditLogOrgActivity : "aggregates to"
```

## Detailed Schema

### audit_logs Table (ClickHouse)

```sql
CREATE TABLE audit_logs (
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
    resource_id String,
    result Enum8('SUCCESS' = 1, 'FAILURE' = 2, 'DENIED' = 3),

    -- Error information
    error_message String,
    error_code String,

    -- Request information
    ip_address String,
    user_agent String,
    request_method String,
    request_path String,

    -- Additional metadata (JSON string)
    metadata String,

    -- Multi-tenancy
    tenant_id String,
    workspace_id String,
    organization_id String,
    region_id String,

    -- Session tracking
    session_id String,
    correlation_id String,

    -- Performance tracking
    duration_ms UInt32,

    -- Timestamps
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, event_type, user_id)
TTL timestamp + INTERVAL 90 DAY
SETTINGS index_granularity = 8192
```

### Indexes

```sql
-- Bloom filter indexes for high-cardinality columns
CREATE INDEX idx_user_id ON audit_logs(user_id) TYPE bloom_filter;
CREATE INDEX idx_action ON audit_logs(action) TYPE bloom_filter;
CREATE INDEX idx_resource ON audit_logs(resource) TYPE bloom_filter;
CREATE INDEX idx_tenant_id ON audit_logs(tenant_id) TYPE bloom_filter;
CREATE INDEX idx_organization_id ON audit_logs(organization_id) TYPE bloom_filter;
CREATE INDEX idx_session_id ON audit_logs(session_id) TYPE bloom_filter;
CREATE INDEX idx_correlation_id ON audit_logs(correlation_id) TYPE bloom_filter;

-- Set indexes for low-cardinality enums
CREATE INDEX idx_event_type ON audit_logs(event_type) TYPE set(0);
CREATE INDEX idx_result ON audit_logs(result) TYPE set(0);
```

## Materialized Views

### Statistics View

```mermaid
flowchart LR
    A[audit_logs] --> B[SummingMergeTree]
    B --> C[audit_logs_stats]
    C --> D[Daily aggregates by event_type and result]
```

### User Activity View

```mermaid
flowchart LR
    A[audit_logs] --> B[SummingMergeTree]
    B --> C[audit_logs_user_activity]
    C --> D[Daily aggregates by user_id and event_type]
```

### Organization Activity View

```mermaid
flowchart LR
    A[audit_logs] --> B[SummingMergeTree]
    B --> C[audit_logs_org_activity]
    C --> D[Daily aggregates by organization_id, event_type, result]
```

## Cardinality Summary

| Field | Cardinality | Index Type |
|-------|-------------|------------|
| event_type | Very Low (4 values) | set(0) |
| result | Very Low (3 values) | set(0) |
| user_id | High | bloom_filter |
| action | Medium | bloom_filter |
| resource | High | bloom_filter |
| tenant_id | Low | bloom_filter |
| organization_id | Low | bloom_filter |

## Audit Log Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: Event occurs
    Created --> Stored: Insert to ClickHouse
    Stored --> Aggregated: Materialized views update
    Stored --> Queryable: Available for search
    Queryable --> Exported: Compliance export
    Queryable --> Expired: TTL reached (90 days)
    Expired --> [*]: Auto-deleted
```
