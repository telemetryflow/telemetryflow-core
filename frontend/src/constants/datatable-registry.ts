/**
 * TelemetryFlow Datatable Registry
 *
 * Central inventory — per-module definitions are in ./datatables/ for maintainability.
 * This file re-aggregates them into the single DATATABLE_REGISTRY array.
 *
 * Usage:
 *   import { DATATABLE_REGISTRY, getDataTableById } from '@/constants/datatable-registry';
 */

// ─── Types (re-exported from datatables/types.ts) ──────────────────────────────

export type { DataTableModuleCode, DataTableColumn, DataTableFeatures, DataTableDefinition } from "./datatables/types";

import type { DataTableModuleCode, DataTableDefinition } from "./datatables/types";

// ─── Per-Module Imports ──────────────────────────────────────────────────────

import { AID_DATATABLE_REGISTRY, PRM_DATATABLE_REGISTRY } from "./datatables/datatable-registry-ai-intelligence";
import { CST_DATATABLE_REGISTRY } from "./datatables/datatable-registry-cost-optimization";
import { AGT_DATATABLE_REGISTRY } from "./datatables/datatable-registry-agent";
import { ALR_DATATABLE_REGISTRY } from "./datatables/datatable-registry-alerts";
import { APK_DATATABLE_REGISTRY } from "./datatables/datatable-registry-api-keys";
import { AUD_DATATABLE_REGISTRY } from "./datatables/datatable-registry-audit";
import { IAM_DATATABLE_REGISTRY } from "./datatables/datatable-registry-iam";
import { INF_DATATABLE_REGISTRY } from "./datatables/datatable-registry-infra";
import { K8S_DATATABLE_REGISTRY } from "./datatables/datatable-registry-k8s";
import { LLM_DATATABLE_REGISTRY } from "./datatables/datatable-registry-llm";
import { LOG_DATATABLE_REGISTRY } from "./datatables/datatable-registry-logs";
import { MET_DATATABLE_REGISTRY } from "./datatables/datatable-registry-metrics";
import { NWM_DATATABLE_REGISTRY } from "./datatables/datatable-registry-network-map";
import { NOT_DATATABLE_REGISTRY } from "./datatables/datatable-registry-notifications";
import { RPT_DATATABLE_REGISTRY } from "./datatables/datatable-registry-reports";
import { RET_DATATABLE_REGISTRY } from "./datatables/datatable-registry-retention";
import { SVM_DATATABLE_REGISTRY } from "./datatables/datatable-registry-service-map";
import { STP_DATATABLE_REGISTRY } from "./datatables/datatable-registry-status-page";
import { SUB_DATATABLE_REGISTRY } from "./datatables/datatable-registry-subscription";
import { TEN_DATATABLE_REGISTRY } from "./datatables/datatable-registry-tenancy";
import { TRC_DATATABLE_REGISTRY } from "./datatables/datatable-registry-traces";
import { UPT_DATATABLE_REGISTRY } from "./datatables/datatable-registry-uptime";
import { INV_DATATABLE_REGISTRY } from "./datatables/datatable-registry-dbm";
import { DBM_MARIADB_DATATABLES } from "./datatables/datatable-registry-db-mariadb";
import { DBM_PERCONA_DATATABLES } from "./datatables/datatable-registry-db-percona";
import { DBM_MYSQL_DATATABLES } from "./datatables/datatable-registry-db-mysql";
import { DBM_POSTGRESQL_DATATABLES } from "./datatables/datatable-registry-db-postgresql";
import { DBM_CLICKHOUSE_DATATABLES } from "./datatables/datatable-registry-db-clickhouse";
import { DBM_AWS_DYNAMODB_DATATABLES } from "./datatables/datatable-registry-db-aws-dynamodb";
import { DBM_AWS_RDS_AURORA_DATATABLES } from "./datatables/datatable-registry-db-aws-rds-aurora";
import { DBM_AWS_RDS_MYSQL_DATATABLES } from "./datatables/datatable-registry-db-aws-rds-mysql";
import { DBM_COCKROACHDB_DATATABLES } from "./datatables/datatable-registry-db-cockroachdb";
import { DBM_MONGODB_ATLAS_DATATABLES } from "./datatables/datatable-registry-db-mongodb-atlas";
import { DBM_MONGODB_COMMUNITY_DATATABLES } from "./datatables/datatable-registry-db-mongodb-community";
import { DBM_MSSQL_DATATABLES } from "./datatables/datatable-registry-db-mssql";
import { DBM_SQLITE3_DATATABLES } from "./datatables/datatable-registry-db-sqlite3";
import { DBM_TIMESCALEDB_DATATABLES } from "./datatables/datatable-registry-db-timescaledb";
import { QRY_DATATABLES } from "./datatables/datatable-registry-qan";

// Re-export per-module arrays for direct access
export {
  AID_DATATABLE_REGISTRY,
  PRM_DATATABLE_REGISTRY,
  CST_DATATABLE_REGISTRY,
  AGT_DATATABLE_REGISTRY,
  ALR_DATATABLE_REGISTRY,
  APK_DATATABLE_REGISTRY,
  AUD_DATATABLE_REGISTRY,
  IAM_DATATABLE_REGISTRY,
  INF_DATATABLE_REGISTRY,
  K8S_DATATABLE_REGISTRY,
  LLM_DATATABLE_REGISTRY,
  LOG_DATATABLE_REGISTRY,
  MET_DATATABLE_REGISTRY,
  NWM_DATATABLE_REGISTRY,
  NOT_DATATABLE_REGISTRY,
  RPT_DATATABLE_REGISTRY,
  RET_DATATABLE_REGISTRY,
  SVM_DATATABLE_REGISTRY,
  STP_DATATABLE_REGISTRY,
  SUB_DATATABLE_REGISTRY,
  TEN_DATATABLE_REGISTRY,
  TRC_DATATABLE_REGISTRY,
  UPT_DATATABLE_REGISTRY,
  INV_DATATABLE_REGISTRY,
  DBM_MARIADB_DATATABLES,
  DBM_PERCONA_DATATABLES,
  DBM_MYSQL_DATATABLES,
  DBM_POSTGRESQL_DATATABLES,
  DBM_CLICKHOUSE_DATATABLES,
  DBM_AWS_DYNAMODB_DATATABLES,
  DBM_AWS_RDS_AURORA_DATATABLES,
  DBM_AWS_RDS_MYSQL_DATATABLES,
  DBM_COCKROACHDB_DATATABLES,
  DBM_MONGODB_ATLAS_DATATABLES,
  DBM_MONGODB_COMMUNITY_DATATABLES,
  DBM_MSSQL_DATATABLES,
  DBM_SQLITE3_DATATABLES,
  DBM_TIMESCALEDB_DATATABLES,
  QRY_DATATABLES,
};

// ─── Aggregated Registry ────────────────────────────────────────────────────

export const DATATABLE_REGISTRY: DataTableDefinition[] = [
  ...AID_DATATABLE_REGISTRY,
  ...PRM_DATATABLE_REGISTRY,
  ...CST_DATATABLE_REGISTRY,
  ...AGT_DATATABLE_REGISTRY,
  ...ALR_DATATABLE_REGISTRY,
  ...APK_DATATABLE_REGISTRY,
  ...AUD_DATATABLE_REGISTRY,
  ...IAM_DATATABLE_REGISTRY,
  ...INF_DATATABLE_REGISTRY,
  ...K8S_DATATABLE_REGISTRY,
  ...LLM_DATATABLE_REGISTRY,
  ...LOG_DATATABLE_REGISTRY,
  ...MET_DATATABLE_REGISTRY,
  ...NWM_DATATABLE_REGISTRY,
  ...NOT_DATATABLE_REGISTRY,
  ...RPT_DATATABLE_REGISTRY,
  ...RET_DATATABLE_REGISTRY,
  ...SVM_DATATABLE_REGISTRY,
  ...STP_DATATABLE_REGISTRY,
  ...SUB_DATATABLE_REGISTRY,
  ...TEN_DATATABLE_REGISTRY,
  ...TRC_DATATABLE_REGISTRY,
  ...UPT_DATATABLE_REGISTRY,
  ...INV_DATATABLE_REGISTRY,
  ...DBM_MARIADB_DATATABLES,
  ...DBM_PERCONA_DATATABLES,
  ...DBM_MYSQL_DATATABLES,
  ...DBM_POSTGRESQL_DATATABLES,
  ...DBM_CLICKHOUSE_DATATABLES,
  ...DBM_AWS_DYNAMODB_DATATABLES,
  ...DBM_AWS_RDS_AURORA_DATATABLES,
  ...DBM_AWS_RDS_MYSQL_DATATABLES,
  ...DBM_COCKROACHDB_DATATABLES,
  ...DBM_MONGODB_ATLAS_DATATABLES,
  ...DBM_MONGODB_COMMUNITY_DATATABLES,
  ...DBM_MSSQL_DATATABLES,
  ...DBM_SQLITE3_DATATABLES,
  ...DBM_TIMESCALEDB_DATATABLES,
  ...QRY_DATATABLES,
];

// ─── Helper Functions ───────────────────────────────────────────────────────────

/**
 * Get a datatable definition by its unique datatableId
 */
export function getDataTableById(
  datatableId: string,
): DataTableDefinition | undefined {
  return DATATABLE_REGISTRY.find((d) => d.datatableId === datatableId);
}

/**
 * Get all datatables for a specific module
 */
export function getDataTablesByModule(
  module: DataTableModuleCode,
): DataTableDefinition[] {
  return DATATABLE_REGISTRY.filter((d) => d.module === module);
}

/**
 * Get all datatables with pagination
 */
export function getPaginatedDataTables(): DataTableDefinition[] {
  return DATATABLE_REGISTRY.filter((d) => d.features.pagination);
}

/**
 * Get all datatables with search support
 */
export function getSearchableDataTables(): DataTableDefinition[] {
  return DATATABLE_REGISTRY.filter((d) => d.features.search);
}

/**
 * Get all datatables with export support
 */
export function getExportableDataTables(): DataTableDefinition[] {
  return DATATABLE_REGISTRY.filter((d) => d.features.export);
}

/**
 * Get all datatables with row click support
 */
export function getClickableDataTables(): DataTableDefinition[] {
  return DATATABLE_REGISTRY.filter((d) => d.features.rowClick);
}

/**
 * Get module-level datatable statistics
 */
export function getDataTableModuleStats(): Record<
  DataTableModuleCode,
  {
    total: number;
    totalColumns: number;
    withPagination: number;
    withSearch: number;
  }
> {
  const result = {} as Record<
    DataTableModuleCode,
    {
      total: number;
      totalColumns: number;
      withPagination: number;
      withSearch: number;
    }
  >;

  const allCodes: DataTableModuleCode[] = [
    "HOM",
    "MET",
    "TRC",
    "LOG",
    "COR",
    "EXP",
    "ALR",
    "RPT",
    "UPT",
    "STP",
    "SVM",
    "NWM",
    "K8S",
    "INF",
    "AGT",
    "RET",
    "SUB",
    "IAM",
    "TEN",
    "AUD",
    "APK",
    "NOT",
    "LLM",
  ];

  for (const code of allCodes) {
    const tables = getDataTablesByModule(code);
    result[code] = {
      total: tables.length,
      totalColumns: tables.reduce((acc, t) => acc + t.columns.length, 0),
      withPagination: tables.filter((t) => t.features.pagination).length,
      withSearch: tables.filter((t) => t.features.search).length,
    };
  }

  return result;
}

/**
 * Total datatable count
 */
export const TOTAL_DATATABLES = DATATABLE_REGISTRY.length;
