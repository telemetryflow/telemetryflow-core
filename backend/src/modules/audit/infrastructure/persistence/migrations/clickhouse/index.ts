/**
 * Audit Module ClickHouse Migrations Index
 *
 * Exports all Audit ClickHouse migrations in execution order.
 * Timestamp range: 1709000000001 - 1709999999999
 */

import type { ClickHouseMigration } from '../../../../../../database/shared/interfaces';

// Import all migrations
import { CreateAuditLogsTable1709000000001 } from './1709000000001-CreateAuditLogsTable';
import { AddAuditLogsIntervalViews1709000000002 } from './1709000000002-AddAuditLogsIntervalViews';

/**
 * All Audit module ClickHouse migrations in execution order
 */
export const AuditClickHouseMigrations: (new () => ClickHouseMigration)[] = [
  CreateAuditLogsTable1709000000001,
  AddAuditLogsIntervalViews1709000000002,
];

/**
 * Audit Module ClickHouse migration configuration
 */
export const AuditClickHouseMigrationConfig = {
  moduleName: 'audit',
  database: 'clickhouse' as const,
  migrations: AuditClickHouseMigrations,
};

// Re-export individual migrations
export { CreateAuditLogsTable1709000000001 };
export { AddAuditLogsIntervalViews1709000000002 };
