/**
 * Audit Module ClickHouse Seeds Index
 *
 * Audit module typically doesn't need seeds in production.
 * Seeds here are for development/testing purposes only.
 */

import type { ClickHouseSeed } from '../../../../../../database/shared/interfaces';

/**
 * All Audit module ClickHouse seeds (empty for production)
 */
export const AuditClickHouseSeeds: (new () => ClickHouseSeed)[] = [];

/**
 * Audit Module ClickHouse seed configuration
 */
export const AuditClickHouseSeedConfig = {
  moduleName: 'audit',
  database: 'clickhouse' as const,
  seeds: AuditClickHouseSeeds,
};
