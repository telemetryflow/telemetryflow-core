import { ClickHouseClient } from '@clickhouse/client';

export async function up(client: ClickHouseClient, database: string): Promise<void> {
  console.log('🔍 Creating traces table and views...');

  // Create traces table
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${database}.traces (
        -- Timestamps
        timestamp DateTime64(9),
        
        -- Trace identification
        trace_id String,
        span_id String,
        parent_span_id String,
        
        -- Span information
        span_name String,
        span_kind Enum8('INTERNAL' = 1, 'SERVER' = 2, 'CLIENT' = 3, 'PRODUCER' = 4, 'CONSUMER' = 5),
        
        -- Service information
        service_name String,
        
        -- Status
        status_code Enum8('UNSET' = 0, 'OK' = 1, 'ERROR' = 2),
        status_message String,
        
        -- Duration
        duration_ns UInt64,
        
        -- Multi-tenancy
        organization_id String DEFAULT '',
        workspace_id String DEFAULT '',
        tenant_id String DEFAULT '',
        
        -- Attributes
        resource_attributes Map(String, String),
        span_attributes Map(String, String),
        
        -- Events and links
        events String DEFAULT '',
        links String DEFAULT ''
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMMDD(timestamp)
      ORDER BY (service_name, trace_id, timestamp)
      TTL toDateTime(timestamp) + INTERVAL 30 DAY
      SETTINGS index_granularity = 8192
    `,
  });

  // Create indexes
  const indexes = [
    { name: 'idx_timestamp', column: 'timestamp', type: 'minmax' },
    { name: 'idx_trace_id', column: 'trace_id', type: 'bloom_filter' },
    { name: 'idx_span_id', column: 'span_id', type: 'bloom_filter' },
    { name: 'idx_service_name', column: 'service_name', type: 'bloom_filter' },
    { name: 'idx_span_name', column: 'span_name', type: 'bloom_filter' },
    { name: 'idx_status_code', column: 'status_code', type: 'set(0)' },
    { name: 'idx_organization_id', column: 'organization_id', type: 'bloom_filter' },
    { name: 'idx_workspace_id', column: 'workspace_id', type: 'bloom_filter' },
    { name: 'idx_tenant_id', column: 'tenant_id', type: 'bloom_filter' },
  ];

  for (const idx of indexes) {
    try {
      await client.command({
        query: `ALTER TABLE ${database}.traces ADD INDEX IF NOT EXISTS ${idx.name} ${idx.column} TYPE ${idx.type} GRANULARITY 1`,
      });
    } catch (error) {
      // Index might already exist
    }
  }

  // Create materialized view for trace statistics
  await client.command({
    query: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.traces_stats
      ENGINE = SummingMergeTree()
      PARTITION BY toYYYYMM(date)
      ORDER BY (date, service_name, span_name, status_code)
      AS SELECT
        toDate(timestamp) AS date,
        service_name,
        span_name,
        status_code,
        count() AS count,
        avg(duration_ns) AS avg_duration_ns,
        quantile(0.95)(duration_ns) AS p95_duration_ns,
        quantile(0.99)(duration_ns) AS p99_duration_ns
      FROM ${database}.traces
      GROUP BY date, service_name, span_name, status_code
    `,
  });

  // Create materialized view for error traces
  await client.command({
    query: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.traces_errors
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
      FROM ${database}.traces
      WHERE status_code = 'ERROR'
    `,
  });

  console.log('   ✅ Traces table and views created');
}

export async function down(client: ClickHouseClient, database: string): Promise<void> {
  console.log('🗑️  Dropping traces table and views...');

  await client.command({
    query: `DROP VIEW IF EXISTS ${database}.traces_errors`,
  });

  await client.command({
    query: `DROP VIEW IF EXISTS ${database}.traces_stats`,
  });

  await client.command({
    query: `DROP TABLE IF EXISTS ${database}.traces`,
  });

  console.log('   ✅ Traces table and views dropped');
}
