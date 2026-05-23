/**
 * TelemetryFlow Stat Panel Registry
 *
 * Central inventory — per-module definitions are in ./stat-panels/ for maintainability.
 * This file re-aggregates them into the single STAT_PANEL_REGISTRY array.
 *
 * Usage:
 *   import { STAT_PANEL_REGISTRY, getStatPanelById } from '@/constants/stat-panel-registry';
 */

// ─── Types (re-exported from stat-panels/types.ts) ──────────────────────────────

export type {
  StatPanelModuleCode,
  StatPanelColor,
  StatPanelSize,
  StatPanelDefinition,
} from "./stat-panels/types";

import type {
  StatPanelModuleCode,
  StatPanelColor,
  StatPanelDefinition,
} from "./stat-panels/types";

// ─── Extended Module Metadata ────────────────────────────────────────────────────

export const STAT_PANEL_MODULE_METADATA: Record<
  StatPanelModuleCode,
  { name: string; description: string; basePath: string }
> = {
  HOM: {
    name: "Home",
    description: "Home dashboard overview",
    basePath: "views/home",
  },
  MET: {
    name: "Metrics",
    description: "Metrics explorer & detail",
    basePath: "views/telemetry/metrics",
  },
  TRC: {
    name: "Traces",
    description: "Distributed tracing",
    basePath: "views/telemetry/traces",
  },
  LOG: {
    name: "Logs",
    description: "Log management",
    basePath: "views/telemetry/logs",
  },
  COR: {
    name: "Correlations",
    description: "Cross-signal correlations",
    basePath: "views/telemetry/correlations",
  },
  EXP: {
    name: "Exemplars",
    description: "Exemplar distribution & linking",
    basePath: "views/telemetry/exemplars",
  },
  ALR: {
    name: "Alerts",
    description: "Alert management & rules",
    basePath: "views/alerts",
  },
  RPT: {
    name: "Reports",
    description: "Report generation & analytics",
    basePath: "views/reports",
  },
  UPT: {
    name: "Uptime",
    description: "Uptime monitoring",
    basePath: "views/monitoring/uptime",
  },
  STP: {
    name: "Status Page",
    description: "Public/private status pages",
    basePath: "views/monitoring/status-page",
  },
  SVM: {
    name: "Service Map",
    description: "Service topology & dependencies",
    basePath: "views/monitoring/service-map",
  },
  NWM: {
    name: "Network Map",
    description: "Infrastructure network topology",
    basePath: "views/monitoring/network-map",
  },
  K8S: {
    name: "Kubernetes",
    description: "Kubernetes cluster monitoring",
    basePath: "views/monitoring/kubernetes",
  },
  INF: {
    name: "Infrastructure",
    description: "VM/host monitoring",
    basePath: "views/monitoring/infra",
  },
  AGT: {
    name: "Agent",
    description: "Telemetry agent fleet",
    basePath: "views/monitoring/agent",
  },
  RET: {
    name: "Retention",
    description: "Data retention policies",
    basePath: "views/settings/retention",
  },
  SUB: {
    name: "Subscription",
    description: "Subscription & billing",
    basePath: "views/settings/subscription",
  },
  IAM: {
    name: "IAM",
    description: "Identity & access management",
    basePath: "views/iam",
  },
  TEN: {
    name: "Tenancy",
    description: "Multi-tenancy management",
    basePath: "views/tenancy",
  },
  AUD: {
    name: "Audit",
    description: "Audit logging & compliance",
    basePath: "views/audit",
  },
  APK: {
    name: "API Keys",
    description: "API key management",
    basePath: "views/settings/api-keys",
  },
  NOT: {
    name: "Notifications",
    description: "Notification channel management",
    basePath: "views/settings/notification-channels",
  },
  LLM: {
    name: "LLM",
    description: "AI/LLM provider management",
    basePath: "views/settings/ai-assistant",
  },
  DMS: {
    name: "Data Masking",
    description: "PII data masking policies",
    basePath: "views/settings/data-masking",
  },
  AID: {
    name: "AI Intelligence",
    description: "Anomaly detection & AI insights",
    basePath: "views/ai-intelligence/anomaly-detection",
  },
  CRM: {
    name: "Corrective Maintenance",
    description: "Remediation plans & automated corrective actions",
    basePath: "views/ai-intelligence/corrective-maintenance",
  },
  PRM: {
    name: "Predictive Maintenance",
    description: "Failure probability prediction & resource health scoring",
    basePath: "views/ai-intelligence/predictive-maintenance",
  },
  CST: {
    name: "Cost Optimization",
    description: "Multi-cloud cost analysis, budgets & AI recommendations",
    basePath: "views/ai-intelligence/cost-optimization",
  },
  INV: {
    name: "DB Inventory",
    description: "Database monitoring inventory & fleet management",
    basePath: "views/db-monitoring/inventory",
  },
  DBM: {
    name: "Database Monitoring",
    description: "Database monitoring & analytics across all engines",
    basePath: "views/db-monitoring",
  },
  QRY: {
    name: "Query Analytics",
    description: "Shared query analytics (QAN) across all database engines",
    basePath: "views/db-monitoring/query-analytics",
  },
};

// ─── Per-Module Imports ──────────────────────────────────────────────────────

import { AID_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-ai-intelligence";
import { CST_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-cost-optimization";
import { AGT_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-agent";
import { ALR_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-alerts";
import { APK_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-api-keys";
import { AUD_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-audit";
import { COR_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-correlations";
import { DMS_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-data-masking";
import { EXP_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-exemplars";
import { HOM_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-home";
import { IAM_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-iam";
import { INF_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-infra";
import { K8S_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-k8s";
import { LLM_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-llm";
import { MET_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-metrics";
import { NWM_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-network-map";
import { NOT_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-notifications";
import { RPT_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-reports";
import { RET_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-retention";
import { SVM_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-service-map";
import { STP_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-status-page";
import { SUB_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-subscription";
import { TEN_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-tenancy";
import { TRC_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-traces";
import { UPT_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-uptime";
import { INV_STAT_PANEL_REGISTRY } from "./stat-panels/stat-panel-registry-dbm";
import { DBM_MARIADB_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-mariadb";
import { DBM_PERCONA_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-percona";
import { DBM_MYSQL_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-mysql";
import { DBM_POSTGRESQL_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-postgresql";
import { DBM_CLICKHOUSE_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-clickhouse";
import { DBM_AWS_DYNAMODB_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-aws-dynamodb";
import { DBM_AWS_RDS_AURORA_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-aws-rds-aurora";
import { DBM_AWS_RDS_MYSQL_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-aws-rds-mysql";
import { DBM_COCKROACHDB_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-cockroachdb";
import { DBM_MONGODB_ATLAS_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-mongodb-atlas";
import { DBM_MONGODB_COMMUNITY_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-mongodb-community";
import { DBM_MSSQL_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-mssql";
import { DBM_SQLITE3_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-sqlite3";
import { DBM_TIMESCALEDB_STAT_PANELS } from "./stat-panels/stat-panel-registry-db-timescaledb";
import { QRY_STAT_PANELS } from "./stat-panels/stat-panel-registry-qan";

// Re-export per-module arrays for direct access
export {
  AID_STAT_PANEL_REGISTRY,
  CST_STAT_PANEL_REGISTRY,
  AGT_STAT_PANEL_REGISTRY,
  ALR_STAT_PANEL_REGISTRY,
  APK_STAT_PANEL_REGISTRY,
  AUD_STAT_PANEL_REGISTRY,
  COR_STAT_PANEL_REGISTRY,
  DMS_STAT_PANEL_REGISTRY,
  EXP_STAT_PANEL_REGISTRY,
  HOM_STAT_PANEL_REGISTRY,
  IAM_STAT_PANEL_REGISTRY,
  INF_STAT_PANEL_REGISTRY,
  K8S_STAT_PANEL_REGISTRY,
  LLM_STAT_PANEL_REGISTRY,
  MET_STAT_PANEL_REGISTRY,
  NWM_STAT_PANEL_REGISTRY,
  NOT_STAT_PANEL_REGISTRY,
  RPT_STAT_PANEL_REGISTRY,
  RET_STAT_PANEL_REGISTRY,
  SVM_STAT_PANEL_REGISTRY,
  STP_STAT_PANEL_REGISTRY,
  SUB_STAT_PANEL_REGISTRY,
  TEN_STAT_PANEL_REGISTRY,
  TRC_STAT_PANEL_REGISTRY,
  UPT_STAT_PANEL_REGISTRY,
  INV_STAT_PANEL_REGISTRY,
  DBM_MARIADB_STAT_PANELS,
  DBM_PERCONA_STAT_PANELS,
  DBM_MYSQL_STAT_PANELS,
  DBM_POSTGRESQL_STAT_PANELS,
  DBM_CLICKHOUSE_STAT_PANELS,
  DBM_AWS_DYNAMODB_STAT_PANELS,
  DBM_AWS_RDS_AURORA_STAT_PANELS,
  DBM_AWS_RDS_MYSQL_STAT_PANELS,
  DBM_COCKROACHDB_STAT_PANELS,
  DBM_MONGODB_ATLAS_STAT_PANELS,
  DBM_MONGODB_COMMUNITY_STAT_PANELS,
  DBM_MSSQL_STAT_PANELS,
  DBM_SQLITE3_STAT_PANELS,
  DBM_TIMESCALEDB_STAT_PANELS,
  QRY_STAT_PANELS,
};

// ─── Aggregated Registry ────────────────────────────────────────────────────

export const STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  ...AID_STAT_PANEL_REGISTRY,
  ...CST_STAT_PANEL_REGISTRY,
  ...AGT_STAT_PANEL_REGISTRY,
  ...ALR_STAT_PANEL_REGISTRY,
  ...APK_STAT_PANEL_REGISTRY,
  ...AUD_STAT_PANEL_REGISTRY,
  ...COR_STAT_PANEL_REGISTRY,
  ...DMS_STAT_PANEL_REGISTRY,
  ...EXP_STAT_PANEL_REGISTRY,
  ...HOM_STAT_PANEL_REGISTRY,
  ...IAM_STAT_PANEL_REGISTRY,
  ...INF_STAT_PANEL_REGISTRY,
  ...K8S_STAT_PANEL_REGISTRY,
  ...LLM_STAT_PANEL_REGISTRY,
  ...MET_STAT_PANEL_REGISTRY,
  ...NWM_STAT_PANEL_REGISTRY,
  ...NOT_STAT_PANEL_REGISTRY,
  ...RPT_STAT_PANEL_REGISTRY,
  ...RET_STAT_PANEL_REGISTRY,
  ...SVM_STAT_PANEL_REGISTRY,
  ...STP_STAT_PANEL_REGISTRY,
  ...SUB_STAT_PANEL_REGISTRY,
  ...TEN_STAT_PANEL_REGISTRY,
  ...TRC_STAT_PANEL_REGISTRY,
  ...UPT_STAT_PANEL_REGISTRY,
  ...INV_STAT_PANEL_REGISTRY,
  ...DBM_MARIADB_STAT_PANELS,
  ...DBM_PERCONA_STAT_PANELS,
  ...DBM_MYSQL_STAT_PANELS,
  ...DBM_POSTGRESQL_STAT_PANELS,
  ...DBM_CLICKHOUSE_STAT_PANELS,
  ...DBM_AWS_DYNAMODB_STAT_PANELS,
  ...DBM_AWS_RDS_AURORA_STAT_PANELS,
  ...DBM_AWS_RDS_MYSQL_STAT_PANELS,
  ...DBM_COCKROACHDB_STAT_PANELS,
  ...DBM_MONGODB_ATLAS_STAT_PANELS,
  ...DBM_MONGODB_COMMUNITY_STAT_PANELS,
  ...DBM_MSSQL_STAT_PANELS,
  ...DBM_SQLITE3_STAT_PANELS,
  ...DBM_TIMESCALEDB_STAT_PANELS,
  ...QRY_STAT_PANELS,
];

// ─── Helper Functions ───────────────────────────────────────────────────────────

/**
 * Get a stat panel definition by its unique statPanelId
 */
export function getStatPanelById(
  statPanelId: string,
): StatPanelDefinition | undefined {
  return STAT_PANEL_REGISTRY.find((s) => s.statPanelId === statPanelId);
}

/**
 * Get all stat panels for a specific module
 */
export function getStatPanelsByModule(
  module: StatPanelModuleCode,
): StatPanelDefinition[] {
  return STAT_PANEL_REGISTRY.filter((s) => s.module === module);
}

/**
 * Get all stat panels with trend support
 */
export function getStatPanelsWithTrend(): StatPanelDefinition[] {
  return STAT_PANEL_REGISTRY.filter((s) => s.hasTrend);
}

/**
 * Get all stat panels with time range support
 */
export function getStatPanelsWithTimeRange(): StatPanelDefinition[] {
  return STAT_PANEL_REGISTRY.filter((s) => s.hasTimeRange);
}

/**
 * Get stat panels by color
 */
export function getStatPanelsByColor(
  color: StatPanelColor,
): StatPanelDefinition[] {
  return STAT_PANEL_REGISTRY.filter((s) => s.color === color);
}

/**
 * Get stat panels for index pages (not detail panels)
 */
export function getIndexStatPanels(): StatPanelDefinition[] {
  return STAT_PANEL_REGISTRY.filter((s) => !s.position.startsWith("detail"));
}

/**
 * Get stat panels for detail/rightbar panels
 */
export function getDetailStatPanels(): StatPanelDefinition[] {
  return STAT_PANEL_REGISTRY.filter((s) => s.position.startsWith("detail"));
}

/**
 * Get module-level stat panel statistics
 */
export function getStatPanelModuleStats(): Record<
  StatPanelModuleCode,
  {
    total: number;
    indexPanels: number;
    detailPanels: number;
    withTrend: number;
  }
> {
  const result = {} as Record<
    StatPanelModuleCode,
    {
      total: number;
      indexPanels: number;
      detailPanels: number;
      withTrend: number;
    }
  >;

  for (const code of Object.keys(
    STAT_PANEL_MODULE_METADATA,
  ) as StatPanelModuleCode[]) {
    const panels = getStatPanelsByModule(code);
    result[code] = {
      total: panels.length,
      indexPanels: panels.filter((p) => !p.position.startsWith("detail"))
        .length,
      detailPanels: panels.filter((p) => p.position.startsWith("detail"))
        .length,
      withTrend: panels.filter((p) => p.hasTrend).length,
    };
  }

  return result;
}

/**
 * Total stat panel count
 */
export const TOTAL_STAT_PANELS = STAT_PANEL_REGISTRY.length;
