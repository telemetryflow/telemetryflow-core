/**
 * Audit Migration (ClickHouse): Create Audit Logs Table
 * Timestamp: 1709000000001 (Audit module range)
 *
 * Stores audit logs for:
 * - Authentication events (login, logout, failed attempts)
 * - Authorization events (access granted/denied)
 * - Data events (create, update, delete operations)
 * - System events (configuration changes, errors)
 */

import { ClickHouseClient } from '@clickhouse/client';
import { BaseClickHouseMigration } from '../../../../../../database/shared/BaseClickHouseMigration';

export class CreateAuditLogsTable1709000000001 extends BaseClickHouseMigration {
  name = 'CreateAuditLogsTable1709000000001';
  moduleName = 'audit';

  async up(client: ClickHouseClient, database: string): Promise<void> {
    this.log('Creating audit_logs table and views...');

    // Ensure database exists
    await this.createDatabaseIfNotExists(client, database);

    // Create audit_logs table
    const createTableQuery = `
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
      TTL toDateTime(timestamp) + INTERVAL 90 DAY
      SETTINGS index_granularity = 8192
    `;

    await this.createTableIfNotExists(client, database, 'audit_logs', createTableQuery);

    // Create indexes
    const indexes = [
      { name: 'idx_user_id', column: 'user_id', type: 'bloom_filter' },
      { name: 'idx_event_type', column: 'event_type', type: 'set(0)' },
      { name: 'idx_result', column: 'result', type: 'set(0)' },
      { name: 'idx_action', column: 'action', type: 'bloom_filter' },
      { name: 'idx_resource', column: 'resource', type: 'bloom_filter' },
      { name: 'idx_tenant_id', column: 'tenant_id', type: 'bloom_filter' },
      { name: 'idx_organization_id', column: 'organization_id', type: 'bloom_filter' },
      { name: 'idx_session_id', column: 'session_id', type: 'bloom_filter' },
      { name: 'idx_correlation_id', column: 'correlation_id', type: 'bloom_filter' },
    ];

    for (const idx of indexes) {
      try {
        await client.command({
          query: `ALTER TABLE ${database}.audit_logs ADD INDEX IF NOT EXISTS ${idx.name} ${idx.column} TYPE ${idx.type} GRANULARITY 1`,
        });
        this.log(`Created index: ${idx.name}`);
      } catch (_error) {
        // Index might already exist, continue
        this.log(`Index ${idx.name} may already exist, skipping`);
      }
    }

    // Create materialized view for statistics
    const statsViewExists = await this.viewExists(client, database, 'audit_logs_stats');
    if (!statsViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.audit_logs_stats
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
      this.log('Created materialized view: audit_logs_stats');
    }

    // Create materialized view for user activity
    const activityViewExists = await this.viewExists(client, database, 'audit_logs_user_activity');
    if (!activityViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.audit_logs_user_activity
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
      this.log('Created materialized view: audit_logs_user_activity');
    }

    // Create materialized view for organization activity
    const orgActivityViewExists = await this.viewExists(client, database, 'audit_logs_org_activity');
    if (!orgActivityViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.audit_logs_org_activity
          ENGINE = SummingMergeTree()
          PARTITION BY toYYYYMM(date)
          ORDER BY (date, organization_id, event_type)
          AS SELECT
            toDate(timestamp) AS date,
            organization_id,
            event_type,
            result,
            count() AS count
          FROM ${database}.audit_logs
          WHERE organization_id != ''
          GROUP BY date, organization_id, event_type, result
        `,
      });
      this.log('Created materialized view: audit_logs_org_activity');
    }

    this.log('Audit logs table and views created successfully');
  }

  async down(client: ClickHouseClient, database: string): Promise<void> {
    this.log('Dropping audit_logs table and views...');

    await this.dropViewIfExists(client, database, 'audit_logs_org_activity');
    await this.dropViewIfExists(client, database, 'audit_logs_user_activity');
    await this.dropViewIfExists(client, database, 'audit_logs_stats');
    await this.dropTableIfExists(client, database, 'audit_logs');

    this.log('Audit logs table and views dropped');
  }
}
