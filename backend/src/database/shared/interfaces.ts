/**
 * Shared interfaces for modular migrations and seeds
 *
 * This module provides common interfaces for both PostgreSQL (TypeORM)
 * and ClickHouse database migrations and seeds.
 */

import { QueryRunner, DataSource } from "typeorm";
import { ClickHouseClient } from "@clickhouse/client";

// ============================================================================
// PostgreSQL (TypeORM) Interfaces
// ============================================================================

/**
 * Interface for module migration metadata
 */
export interface ModuleMigrationMeta {
  /** Migration class name */
  name: string;
  /** Timestamp identifier (13 digits) */
  timestamp: number;
  /** Module that owns this migration */
  moduleName: string;
}

/**
 * Interface for PostgreSQL module migrations
 */
export interface PostgresMigration extends ModuleMigrationMeta {
  up(queryRunner: QueryRunner): Promise<void>;
  down(queryRunner: QueryRunner): Promise<void>;
}

/**
 * Interface for module seed metadata
 */
export interface ModuleSeedMeta {
  /** Seed identifier name */
  name: string;
  /** Execution order within module */
  order: number;
  /** Module that owns this seed */
  moduleName: string;
  /** Other seeds that must run first (by name) */
  dependencies: string[];
}

/**
 * Interface for PostgreSQL module seeds
 */
export interface PostgresSeed extends ModuleSeedMeta {
  run(dataSource: DataSource): Promise<void>;
}

// ============================================================================
// ClickHouse Interfaces
// ============================================================================

/**
 * Interface for ClickHouse module migrations
 */
export interface ClickHouseMigration extends ModuleMigrationMeta {
  up(client: ClickHouseClient, database: string): Promise<void>;
  down(client: ClickHouseClient, database: string): Promise<void>;
}

/**
 * Interface for ClickHouse module seeds
 */
export interface ClickHouseSeed extends ModuleSeedMeta {
  run(client: ClickHouseClient, database: string): Promise<void>;
}

// ============================================================================
// Module Configuration Interfaces
// ============================================================================

/**
 * Configuration for a module's PostgreSQL migrations
 */
export interface PostgresModuleConfig {
  moduleName: string;
  migrations: (new () => PostgresMigration)[];
  seeds: (new () => PostgresSeed)[];
}

/**
 * Configuration for a module's ClickHouse migrations
 */
export interface ClickHouseModuleConfig {
  moduleName: string;
  migrations: (new () => ClickHouseMigration)[];
  seeds: (new () => ClickHouseSeed)[];
}

// ============================================================================
// Timestamp Ranges per Module
// ============================================================================

/**
 * Timestamp ranges allocated to each module
 * Format: 13-digit timestamp (milliseconds since epoch)
 *
 * | Module             | Range Start     | Range End        |
 * |--------------------|-----------------|------------------|
 * | IAM                | 1700000000001   | 1700999999999    |
 * | Telemetry (legacy) | 1704000000001   | 1704999999999    |
 * | Auth               | 1706000000001   | 1706999999999    |
 * | Notification       | 1707000000001   | 1707999999999    |
 * | Telemetry/API Keys | 1708000000001   | 1708999999999    |
 * | Audit/SSO          | 1709000000001   | 1709999999999    |
 * | Dashboard/Alerting | 1710000000001   | 1710999999999    |
 * | Monitoring (Agent) | 1711000000001   | 1711000000010    |
 * | Monitoring (K8s)   | 1711000000011   | 1711000000030    |
 * | Monitoring (VM)    | 1711000000031   | 1711000000050    |
 * | Tenancy            | 1715000000001   | 1715999999999    |
 * | Retention          | 1717000000001   | 1717999999999    |
 * | Subscription       | 1718000000001   | 1718999999999    |
 * | Uptime             | 1719000000001   | 1719999999999    |
 * | Status Page/SvcMap | 1720000000001   | 1720999999999    |
 * | LLM/Network Map    | 1721000000001   | 1721999999999    |
 */
export const MODULE_TIMESTAMP_RANGES = {
  iam: { start: 1700000000001, end: 1700999999999 },
  "telemetry-legacy": { start: 1704000000001, end: 1704999999999 },
  auth: { start: 1706000000001, end: 1706999999999 },
  notification: { start: 1707000000001, end: 1707999999999 },
  telemetry: { start: 1708000000001, end: 1708999999999 },
  "api-keys": { start: 1708000000001, end: 1708999999999 },
  audit: { start: 1709000000001, end: 1709999999999 },
  sso: { start: 1709000000001, end: 1709999999999 },
  dashboard: { start: 1710000000001, end: 1710999999999 },
  alerting: { start: 1710000000001, end: 1710999999999 },
  "monitoring-agent": { start: 1711000000001, end: 1711000000010 },
  "monitoring-kubernetes": { start: 1711000000011, end: 1711000000030 },
  "monitoring-vm": { start: 1711000000031, end: 1711000000050 },
  tenancy: { start: 1715000000001, end: 1715999999999 },
  retention: { start: 1717000000001, end: 1717999999999 },
  subscription: { start: 1718000000001, end: 1718999999999 },
  uptime: { start: 1719000000001, end: 1719999999999 },
  "status-page": { start: 1720000000001, end: 1720999999999 },
  "service-map": { start: 1720000000001, end: 1720999999999 },
  llm: { start: 1721000000001, end: 1721999999999 },
  "network-map": { start: 1721000000001, end: 1721999999999 },
  "monitoring-db-clickhouse": { start: 1724007000001, end: 1724007009999 },
  "monitoring-db-inventory": { start: 1724100000001, end: 1724100009999 },
  "monitoring-db-mysql": { start: 1724200000001, end: 1724200009999 },
  "monitoring-db-monitoring": { start: 1724001000001, end: 1724001009999 },
} as const;

export type ModuleName = keyof typeof MODULE_TIMESTAMP_RANGES;

/**
 * Helper function to validate timestamp is within module range
 */
export function validateTimestamp(
  timestamp: number,
  moduleName: ModuleName,
): boolean {
  const range = MODULE_TIMESTAMP_RANGES[moduleName];
  return timestamp >= range.start && timestamp <= range.end;
}

/**
 * Helper function to extract timestamp from migration class name
 * Example: CreateRegionsTable1700000000001 => 1700000000001
 */
export function extractTimestamp(className: string): number {
  const match = className.match(/(\d{13})$/);
  return match ? parseInt(match[1], 10) : 0;
}
