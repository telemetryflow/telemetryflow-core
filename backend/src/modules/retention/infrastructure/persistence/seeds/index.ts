/**
 * Retention Module Seeds
 *
 * Creates production-ready retention policies for both organizations:
 *
 * A. Environment-Specific Retention (56 policies)
 *    - 14 data types x 2 environments x 2 organizations
 *    - Staging: short retention, no archive
 *    - Production: long retention, archived to S3
 *
 * B. Backup Schedules (6 policies)
 *    - Daily / Weekly / Monthly per organization
 *    - Executed outside operational hours: 01:00-04:00 GMT+7 (18:00-21:00 UTC)
 *    - PostgreSQL & ClickHouse raw -> S3
 *
 * C. ClickHouse Cleanup (3 policies)
 *    - DevOpsCorner: 7 days
 *    - TelemetryFlow: 5 days
 *    - Global default: 31 days
 */

import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { BaseSeed } from '../../../../../database/shared/BaseSeed';

type DataType =
  | 'metrics'
  | 'logs'
  | 'traces'
  | 'exemplars'
  | 'alerts'
  | 'uptime'
  | 'audit_logs'
  | 'kubernetes_metrics'
  | 'llm_usage_raw'
  | 'network_map_connection_metrics'
  | 'network_map_traffic'
  | 'service_map_metrics'
  | 'signal_correlations'
  | 'vm_metrics';

interface RetentionDef {
  dataType: DataType;
  stagingDays: number;
  productionDays: number;
}

interface OrgInfo {
  organizationId: string;
  code: string;
  name: string;
  s3Prefix: string;
}

/** Data type retention settings per environment */
const RETENTION_DEFS: RetentionDef[] = [
  { dataType: 'logs',       stagingDays: 7,  productionDays: 60  },
  { dataType: 'metrics',    stagingDays: 14, productionDays: 90  },
  { dataType: 'traces',     stagingDays: 3,  productionDays: 30  },
  { dataType: 'exemplars',  stagingDays: 3,  productionDays: 14  },
  { dataType: 'alerts',     stagingDays: 30, productionDays: 90 },
  { dataType: 'uptime',     stagingDays: 14, productionDays: 90  },
  // ClickHouse-only tables (TTL aligned)
  { dataType: 'audit_logs',                     stagingDays: 30, productionDays: 90  },
  { dataType: 'kubernetes_metrics',             stagingDays: 7,  productionDays: 30  },
  { dataType: 'llm_usage_raw',                  stagingDays: 14, productionDays: 90  },
  { dataType: 'network_map_connection_metrics', stagingDays: 14, productionDays: 90  },
  { dataType: 'network_map_traffic',            stagingDays: 14, productionDays: 90  },
  { dataType: 'service_map_metrics',            stagingDays: 14, productionDays: 90  },
  { dataType: 'signal_correlations',            stagingDays: 3,  productionDays: 7   },
  { dataType: 'vm_metrics',                     stagingDays: 7,  productionDays: 30  },
];

/**
 * Backup schedule definitions
 * All scheduled outside operational hours: 01:00-04:00 GMT+7 = 18:00-21:00 UTC
 */
const BACKUP_SCHEDULES = [
  {
    scheduleType: 'daily',
    label: 'Daily Backup Schedule',
    description: 'Daily backup of PostgreSQL & ClickHouse raw data to S3. Runs at 01:00 GMT+7 (18:00 UTC).',
    retentionDays: 1,
    cronExpression: '0 18 * * *',
  },
  {
    scheduleType: 'weekly',
    label: 'Weekly Backup Schedule',
    description: 'Weekly backup every Friday of PostgreSQL & ClickHouse raw data to S3. Runs at 02:00 GMT+7 Saturday (19:00 UTC Friday).',
    retentionDays: 7,
    cronExpression: '0 19 * * 5',
  },
  {
    scheduleType: 'monthly',
    label: 'Monthly Backup Schedule',
    description: 'Monthly backup on 1st of PostgreSQL & ClickHouse raw data to S3. Runs at 03:00 GMT+7 2nd (20:00 UTC 1st).',
    retentionDays: 30,
    cronExpression: '0 20 1 * *',
  },
];

export class RetentionPoliciesSeed extends BaseSeed {
  name = 'RetentionPoliciesSeed';
  moduleName = 'retention';
  order = 1;
  dependencies = ['OrganizationsSeed'];

  async run(dataSource: DataSource): Promise<void> {
    this.log('Seeding retention policies...');

    // ── Check table exists ──────────────────────────────────────────────
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'retention_policies'
      )
    `);

    if (!tableExists[0].exists) {
      this.logError('retention_policies table does not exist. Run migrations first.');
      return;
    }

    // ── Look up both organizations ──────────────────────────────────────
    const devOpsCorner = await this.findRecord<{ organization_id: string }>(
      dataSource, 'organizations', { code: 'DEVOPSCORNER' },
    );
    const telemetryFlow = await this.findRecord<{ organization_id: string }>(
      dataSource, 'organizations', { code: 'TELEMETRYFLOW' },
    );

    if (!devOpsCorner) {
      this.logError('DevOpsCorner organization not found. Run OrganizationsSeed first.');
      return;
    }
    if (!telemetryFlow) {
      this.logError('TelemetryFlow organization not found. Run OrganizationsSeed first.');
      return;
    }

    const orgs: OrgInfo[] = [
      {
        organizationId: devOpsCorner.organization_id,
        code: 'DEVOPSCORNER',
        name: 'DevOpsCorner',
        s3Prefix: 'devopscorner',
      },
      {
        organizationId: telemetryFlow.organization_id,
        code: 'TELEMETRYFLOW',
        name: 'TelemetryFlow',
        s3Prefix: 'telemetryflow',
      },
    ];

    let inserted = 0;
    let skipped = 0;

    // ── A. Environment-Specific Retention Policies ──────────────────────
    for (const org of orgs) {
      for (const def of RETENTION_DEFS) {
        // Staging policy
        const stagingOk = await this.seedPolicy(dataSource, {
          name: `${org.name} - ${capitalize(def.dataType)} Retention (Staging)`,
          description: `${org.name} staging environment ${def.dataType} retention (${def.stagingDays} days)`,
          data_type: def.dataType,
          retention_days: def.stagingDays,
          archive_enabled: false,
          archive_destination: null,
          filters: JSON.stringify({ environment: 'staging', policy_type: 'retention' }),
          is_default: false,
          is_active: true,
          organization_id: org.organizationId,
        });
        stagingOk ? inserted++ : skipped++;

        // Production policy
        const prodOk = await this.seedPolicy(dataSource, {
          name: `${org.name} - ${capitalize(def.dataType)} Retention (Production)`,
          description: `${org.name} production environment ${def.dataType} retention (${def.productionDays} days) with S3 archive`,
          data_type: def.dataType,
          retention_days: def.productionDays,
          archive_enabled: true,
          archive_destination: `s3://telemetryflow-backup/${org.s3Prefix}/production/${def.dataType}`,
          filters: JSON.stringify({ environment: 'production', policy_type: 'retention' }),
          is_default: false,
          is_active: true,
          organization_id: org.organizationId,
        });
        prodOk ? inserted++ : skipped++;
      }
    }

    // ── B. Backup Schedule Policies ─────────────────────────────────────
    for (const org of orgs) {
      for (const schedule of BACKUP_SCHEDULES) {
        const ok = await this.seedPolicy(dataSource, {
          name: `${org.name} - ${schedule.label}`,
          description: schedule.description,
          data_type: 'logs',
          retention_days: schedule.retentionDays,
          archive_enabled: true,
          archive_destination: `s3://telemetryflow-backup/${org.s3Prefix}/backups/${schedule.scheduleType}`,
          filters: JSON.stringify({
            policy_type: 'backup_schedule',
            schedule_type: schedule.scheduleType,
            backup_target: 'postgresql,clickhouse',
            cron_expression: schedule.cronExpression,
          }),
          is_default: false,
          is_active: true,
          organization_id: org.organizationId,
        });
        ok ? inserted++ : skipped++;
      }
    }

    // ── C. ClickHouse Cleanup Policies ──────────────────────────────────
    const clickHouseCleanups = [
      {
        name: 'DevOpsCorner - ClickHouse Cleanup (7 days)',
        description: 'ClickHouse data cleanup for DevOpsCorner organization. Data older than 7 days is removed.',
        retentionDays: 7,
        organizationId: devOpsCorner.organization_id as string | null,
        isDefault: false,
      },
      {
        name: 'TelemetryFlow - ClickHouse Cleanup (5 days)',
        description: 'ClickHouse data cleanup for TelemetryFlow organization. Data older than 5 days is removed.',
        retentionDays: 5,
        organizationId: telemetryFlow.organization_id as string | null,
        isDefault: false,
      },
      {
        name: 'Default ClickHouse Cleanup (31 days)',
        description: 'Global default ClickHouse data cleanup for all organizations. Data older than 31 days is removed.',
        retentionDays: 31,
        organizationId: null as string | null,
        isDefault: true,
      },
    ];

    for (const cleanup of clickHouseCleanups) {
      const ok = await this.seedPolicy(dataSource, {
        name: cleanup.name,
        description: cleanup.description,
        data_type: 'logs',
        retention_days: cleanup.retentionDays,
        archive_enabled: false,
        archive_destination: null,
        filters: JSON.stringify({
          policy_type: 'clickhouse_cleanup',
          cleanup_scope: 'all_tables',
          ...(cleanup.isDefault ? { is_global_default: 'true' } : {}),
        }),
        is_default: cleanup.isDefault,
        is_active: true,
        organization_id: cleanup.organizationId,
      });
      ok ? inserted++ : skipped++;
    }

    this.log(`Retention policies seeded: ${inserted} created, ${skipped} skipped`);
  }

  /**
   * Insert a single retention policy if it doesn't exist.
   * Uses (name, organization_id) as the uniqueness check.
   */
  private async seedPolicy(
    dataSource: DataSource,
    data: {
      name: string;
      description: string;
      data_type: string;
      retention_days: number;
      archive_enabled: boolean;
      archive_destination: string | null;
      filters: string;
      is_default: boolean;
      is_active: boolean;
      organization_id: string | null;
    },
  ): Promise<boolean> {
    // Check existence: handle NULL organization_id
    if (data.organization_id === null) {
      const exists = await dataSource.query(
        `SELECT id FROM retention_policies WHERE name = $1 AND organization_id IS NULL`,
        [data.name],
      );
      if (exists.length > 0) {
        this.logSkip(`Policy exists: ${data.name}`);
        return false;
      }
    } else {
      const exists = await dataSource.query(
        `SELECT id FROM retention_policies WHERE name = $1 AND organization_id = $2`,
        [data.name, data.organization_id],
      );
      if (exists.length > 0) {
        this.logSkip(`Policy exists: ${data.name}`);
        return false;
      }
    }

    await dataSource.query(
      `INSERT INTO retention_policies (
        id, name, description, data_type, retention_days, archive_enabled,
        archive_destination, filters, is_default, is_active, organization_id,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [
        randomUUID(),
        data.name,
        data.description,
        data.data_type,
        data.retention_days,
        data.archive_enabled,
        data.archive_destination,
        data.filters,
        data.is_default,
        data.is_active,
        data.organization_id,
      ],
    );

    this.logSuccess(`Created policy: ${data.name}`);
    return true;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Module Exports ────────────────────────────────────────────────────────────

export const RetentionSeeds = [RetentionPoliciesSeed];

export const RetentionSeedConfig = {
  moduleName: 'retention',
  database: 'postgres' as const,
  seeds: RetentionSeeds,
};

export async function runRetentionSeeds(dataSource: DataSource): Promise<void> {
  console.log('\n========================================');
  console.log('Running Retention Module Seeds');
  console.log('========================================\n');

  for (const SeedClass of RetentionSeeds) {
    const seed = new SeedClass();
    await seed.run(dataSource);
  }

  console.log('\n========================================');
  console.log('Retention Module Seeds Complete');
  console.log('========================================\n');
}
