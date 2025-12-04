import { ClickHouseClient } from '@clickhouse/client';

export async function up(client: ClickHouseClient, database: string): Promise<void> {
  console.log('📊 Creating audit_logs table and views...');

  // Create database if not exists
  await client.command({
    query: `CREATE DATABASE IF NOT EXISTS ${database}`,
  });

  // Create audit_logs table
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${database}.audit_logs (
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
        metadata String,
        
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
      SETTINGS index_granularity = 8192
    `,
  });

  // Create indexes
  const indexes = [
    { name: 'idx_user_id', column: 'user_id', type: 'bloom_filter' },
    { name: 'idx_event_type', column: 'event_type', type: 'set(0)' },
    { name: 'idx_result', column: 'result', type: 'set(0)' },
    { name: 'idx_action', column: 'action', type: 'bloom_filter' },
    { name: 'idx_tenant_id', column: 'tenant_id', type: 'bloom_filter' },
    { name: 'idx_organization_id', column: 'organization_id', type: 'bloom_filter' },
  ];

  for (const idx of indexes) {
    try {
      await client.command({
        query: `ALTER TABLE ${database}.audit_logs ADD INDEX IF NOT EXISTS ${idx.name} ${idx.column} TYPE ${idx.type} GRANULARITY 1`,
      });
    } catch (error) {
      // Index might already exist, continue
    }
  }

  // Create materialized view for statistics
  await client.command({
    query: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.audit_logs_stats
      ENGINE = SummingMergeTree()
      PARTITION BY toYYYYMM(date)
      ORDER BY (date, event_type, result)
      AS SELECT
        toDate(timestamp) AS date,
        event_type,
        result,
        count() AS count
      FROM ${database}.audit_logs
      GROUP BY date, event_type, result
    `,
  });

  // Create materialized view for user activity
  await client.command({
    query: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.audit_logs_user_activity
      ENGINE = SummingMergeTree()
      PARTITION BY toYYYYMM(date)
      ORDER BY (date, user_id, event_type)
      AS SELECT
        toDate(timestamp) AS date,
        user_id,
        event_type,
        count() AS count
      FROM ${database}.audit_logs
      WHERE user_id != ''
      GROUP BY date, user_id, event_type
    `,
  });

  console.log('   ✅ Audit logs table and views created');
}

export async function down(client: ClickHouseClient, database: string): Promise<void> {
  console.log('🗑️  Dropping audit_logs table and views...');

  await client.command({
    query: `DROP VIEW IF EXISTS ${database}.audit_logs_user_activity`,
  });

  await client.command({
    query: `DROP VIEW IF EXISTS ${database}.audit_logs_stats`,
  });

  await client.command({
    query: `DROP TABLE IF EXISTS ${database}.audit_logs`,
  });

  console.log('   ✅ Audit logs table and views dropped');
}
