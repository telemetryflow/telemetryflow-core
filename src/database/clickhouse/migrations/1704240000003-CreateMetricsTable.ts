import { ClickHouseClient } from '@clickhouse/client';

export async function up(client: ClickHouseClient, database: string): Promise<void> {
  console.log('📊 Creating metrics table and views...');

  // Create metrics table
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${database}.metrics (
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
      SETTINGS index_granularity = 8192
    `,
  });

  // Create indexes
  const indexes = [
    { name: 'idx_timestamp', column: 'timestamp', type: 'minmax' },
    { name: 'idx_metric_name', column: 'metric_name', type: 'bloom_filter' },
    { name: 'idx_service_name', column: 'service_name', type: 'bloom_filter' },
    { name: 'idx_organization_id', column: 'organization_id', type: 'bloom_filter' },
    { name: 'idx_workspace_id', column: 'workspace_id', type: 'bloom_filter' },
    { name: 'idx_tenant_id', column: 'tenant_id', type: 'bloom_filter' },
  ];

  for (const idx of indexes) {
    try {
      await client.command({
        query: `ALTER TABLE ${database}.metrics ADD INDEX IF NOT EXISTS ${idx.name} ${idx.column} TYPE ${idx.type} GRANULARITY 1`,
      });
    } catch (error) {
      // Index might already exist
    }
  }

  // Create materialized view for 1-minute aggregations
  await client.command({
    query: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.metrics_1m
      ENGINE = AggregatingMergeTree()
      PARTITION BY toYYYYMM(minute)
      ORDER BY (service_name, metric_name, minute)
      AS SELECT
        toStartOfMinute(timestamp) AS minute,
        service_name,
        metric_name,
        metric_type,
        avgState(value) AS avg_value,
        minState(value) AS min_value,
        maxState(value) AS max_value,
        sumState(value) AS sum_value,
        countState() AS count
      FROM ${database}.metrics
      GROUP BY minute, service_name, metric_name, metric_type
    `,
  });

  // Create materialized view for hourly aggregations
  await client.command({
    query: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.metrics_1h
      ENGINE = AggregatingMergeTree()
      PARTITION BY toYYYYMM(hour)
      ORDER BY (service_name, metric_name, hour)
      AS SELECT
        toStartOfHour(timestamp) AS hour,
        service_name,
        metric_name,
        metric_type,
        avgState(value) AS avg_value,
        minState(value) AS min_value,
        maxState(value) AS max_value,
        sumState(value) AS sum_value,
        countState() AS count
      FROM ${database}.metrics
      GROUP BY hour, service_name, metric_name, metric_type
    `,
  });

  console.log('   ✅ Metrics table and views created');
}

export async function down(client: ClickHouseClient, database: string): Promise<void> {
  console.log('🗑️  Dropping metrics table and views...');

  await client.command({
    query: `DROP VIEW IF EXISTS ${database}.metrics_1h`,
  });

  await client.command({
    query: `DROP VIEW IF EXISTS ${database}.metrics_1m`,
  });

  await client.command({
    query: `DROP TABLE IF EXISTS ${database}.metrics`,
  });

  console.log('   ✅ Metrics table and views dropped');
}
