/**
 * TelemetryFlow Graph Registry
 *
 * Central inventory of ALL graphs, charts, and visualizations across the platform.
 * Each graph has a unique graphId (3-letter module code + 5-digit number = 8 chars).
 *
 * This registry is the single source of truth for:
 * - Graph identification (graphId)
 * - Default queries (TFQL / PromQL)
 * - Chart type configuration
 * - Data source mapping
 * - Signal type classification (metrics, logs, traces, correlations, etc.)
 *
 * Graph definitions are split into per-module files under ./graphs/ for maintainability.
 * This file re-aggregates them into the single GRAPH_REGISTRY array.
 *
 * Usage:
 *   import { GRAPH_REGISTRY, getGraphById, getGraphsByModule } from '@/constants/graph-registry';
 */

// ─── Types (re-exported from graphs/types.ts) ──────────────────────────────────

export type {
  ModuleCode,
  ChartType,
  SignalType,
  QueryDialect,
  GraphDefaultQuery,
  GraphDefinition,
} from "./graphs/types";

import type { ModuleCode, ChartType, SignalType, GraphDefinition } from "./graphs/types";

// ─── Module Metadata ────────────────────────────────────────────────────────────

export const MODULE_METADATA: Record<
  ModuleCode,
  { name: string; description: string; basePath: string }
> = {
  HOM: {
    name: "Home",
    description: "Home dashboard overview",
    basePath: "views/home",
  },
  DSH: {
    name: "Dashboards",
    description: "Custom dashboard builder & viewer",
    basePath: "views/dashboards",
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
    description: "Multi-tenant workspace management",
    basePath: "views/settings/tenancy",
  },
  AUD: {
    name: "Audit",
    description: "Audit logs & compliance",
    basePath: "views/audit",
  },
  APK: {
    name: "API Keys",
    description: "API key management",
    basePath: "views/settings/api-keys",
  },
  NOT: {
    name: "Notifications",
    description: "Notification channels & rules",
    basePath: "views/settings/notifications",
  },
  LLM: {
    name: "LLM",
    description: "LLM observability & tracing",
    basePath: "views/monitoring/llm",
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

// ─── Per-Module Graph Imports ────────────────────────────────────────────────────

import { HOM_GRAPHS } from "./graphs/graph-registry-home";
import { DSH_GRAPHS } from "./graphs/graph-registry-dashboards";
import { MET_GRAPHS } from "./graphs/graph-registry-metrics";
import { TRC_GRAPHS } from "./graphs/graph-registry-traces";
import { LOG_GRAPHS } from "./graphs/graph-registry-logs";
import { COR_GRAPHS } from "./graphs/graph-registry-correlations";
import { EXP_GRAPHS } from "./graphs/graph-registry-exemplars";
import { ALR_GRAPHS } from "./graphs/graph-registry-alerts";
import { RPT_GRAPHS } from "./graphs/graph-registry-reports";
import { UPT_GRAPHS } from "./graphs/graph-registry-uptime";
import { STP_GRAPHS } from "./graphs/graph-registry-status-page";
import { SVM_GRAPHS } from "./graphs/graph-registry-service-map";
import { NWM_GRAPHS } from "./graphs/graph-registry-network-map";
import { K8S_GRAPHS } from "./graphs/graph-registry-k8s";
import { INF_GRAPHS } from "./graphs/graph-registry-infra";
import { AGT_GRAPHS } from "./graphs/graph-registry-agent";
import { RET_GRAPHS } from "./graphs/graph-registry-retention";
import { SUB_GRAPHS } from "./graphs/graph-registry-subscription";
import { AUD_GRAPHS } from "./graphs/graph-registry-audit";
import { IAM_GRAPHS } from "./graphs/graph-registry-iam";
import { AID_GRAPHS, PRM_GRAPHS } from "./graphs/graph-registry-ai-intelligence";
import { CST_GRAPHS } from "./graphs/graph-registry-cost-optimization";
import { INV_GRAPHS } from "./graphs/graph-registry-dbm";
import { DBM_MARIADB_GRAPHS } from "./graphs/graph-registry-db-mariadb";
import { DBM_PERCONA_GRAPHS } from "./graphs/graph-registry-db-percona";
import { DBM_MYSQL_GRAPHS } from "./graphs/graph-registry-db-mysql";
import { DBM_POSTGRESQL_GRAPHS } from "./graphs/graph-registry-db-postgresql";
import { DBM_CLICKHOUSE_GRAPHS } from "./graphs/graph-registry-db-clickhouse";
import { DBM_AWS_DYNAMODB_GRAPHS } from "./graphs/graph-registry-db-aws-dynamodb";
import { DBM_AWS_RDS_AURORA_GRAPHS } from "./graphs/graph-registry-db-aws-rds-aurora";
import { DBM_AWS_RDS_MYSQL_GRAPHS } from "./graphs/graph-registry-db-aws-rds-mysql";
import { DBM_COCKROACHDB_GRAPHS } from "./graphs/graph-registry-db-cockroachdb";
import { DBM_MONGODB_ATLAS_GRAPHS } from "./graphs/graph-registry-db-mongodb-atlas";
import { DBM_MONGODB_COMMUNITY_GRAPHS } from "./graphs/graph-registry-db-mongodb-community";
import { DBM_MSSQL_GRAPHS } from "./graphs/graph-registry-db-mssql";
import { DBM_SQLITE3_GRAPHS } from "./graphs/graph-registry-db-sqlite3";
import { DBM_TIMESCALEDB_GRAPHS } from "./graphs/graph-registry-db-timescaledb";
import { QRY_GRAPHS } from "./graphs/graph-registry-qan";

// Re-export per-module arrays for direct access
export {
  AID_GRAPHS,
  PRM_GRAPHS,
  CST_GRAPHS,
  HOM_GRAPHS,
  DSH_GRAPHS,
  MET_GRAPHS,
  TRC_GRAPHS,
  LOG_GRAPHS,
  COR_GRAPHS,
  EXP_GRAPHS,
  ALR_GRAPHS,
  RPT_GRAPHS,
  UPT_GRAPHS,
  STP_GRAPHS,
  SVM_GRAPHS,
  NWM_GRAPHS,
  K8S_GRAPHS,
  INF_GRAPHS,
  AGT_GRAPHS,
  RET_GRAPHS,
  SUB_GRAPHS,
  AUD_GRAPHS,
  IAM_GRAPHS,
  INV_GRAPHS,
  DBM_MARIADB_GRAPHS,
  DBM_PERCONA_GRAPHS,
  DBM_MYSQL_GRAPHS,
  DBM_POSTGRESQL_GRAPHS,
  DBM_CLICKHOUSE_GRAPHS,
  DBM_AWS_DYNAMODB_GRAPHS,
  DBM_AWS_RDS_AURORA_GRAPHS,
  DBM_AWS_RDS_MYSQL_GRAPHS,
  DBM_COCKROACHDB_GRAPHS,
  DBM_MONGODB_ATLAS_GRAPHS,
  DBM_MONGODB_COMMUNITY_GRAPHS,
  DBM_MSSQL_GRAPHS,
  DBM_SQLITE3_GRAPHS,
  DBM_TIMESCALEDB_GRAPHS,
  QRY_GRAPHS,
};

// ─── Aggregated Graph Registry ──────────────────────────────────────────────────

export const GRAPH_REGISTRY: GraphDefinition[] = [
  ...AID_GRAPHS,
  ...PRM_GRAPHS,
  ...CST_GRAPHS,
  ...HOM_GRAPHS,
  ...DSH_GRAPHS,
  ...MET_GRAPHS,
  ...TRC_GRAPHS,
  ...LOG_GRAPHS,
  ...COR_GRAPHS,
  ...EXP_GRAPHS,
  ...ALR_GRAPHS,
  ...RPT_GRAPHS,
  ...UPT_GRAPHS,
  ...STP_GRAPHS,
  ...SVM_GRAPHS,
  ...NWM_GRAPHS,
  ...K8S_GRAPHS,
  ...INF_GRAPHS,
  ...AGT_GRAPHS,
  ...RET_GRAPHS,
  ...SUB_GRAPHS,
  ...AUD_GRAPHS,
  ...IAM_GRAPHS,
  ...INV_GRAPHS,
  ...DBM_MARIADB_GRAPHS,
  ...DBM_PERCONA_GRAPHS,
  ...DBM_MYSQL_GRAPHS,
  ...DBM_POSTGRESQL_GRAPHS,
  ...DBM_CLICKHOUSE_GRAPHS,
  ...DBM_AWS_DYNAMODB_GRAPHS,
  ...DBM_AWS_RDS_AURORA_GRAPHS,
  ...DBM_AWS_RDS_MYSQL_GRAPHS,
  ...DBM_COCKROACHDB_GRAPHS,
  ...DBM_MONGODB_ATLAS_GRAPHS,
  ...DBM_MONGODB_COMMUNITY_GRAPHS,
  ...DBM_MSSQL_GRAPHS,
  ...DBM_SQLITE3_GRAPHS,
  ...DBM_TIMESCALEDB_GRAPHS,
  ...QRY_GRAPHS,
];

// ─── Helper Functions ───────────────────────────────────────────────────────────

/**
 * Get a graph definition by its unique graphId
 */
export function getGraphById(graphId: string): GraphDefinition | undefined {
  return GRAPH_REGISTRY.find((g) => g.graphId === graphId);
}

/**
 * Get all graphs for a specific module
 */
export function getGraphsByModule(module: ModuleCode): GraphDefinition[] {
  return GRAPH_REGISTRY.filter((g) => g.module === module);
}

/**
 * Get all graphs of a specific chart type
 */
export function getGraphsByChartType(chartType: ChartType): GraphDefinition[] {
  return GRAPH_REGISTRY.filter((g) => g.chartType === chartType);
}

/**
 * Get all graphs of a specific signal type
 */
export function getGraphsBySignalType(
  signalType: SignalType,
): GraphDefinition[] {
  return GRAPH_REGISTRY.filter((g) => g.signalType === signalType);
}

/**
 * Get all stat panel graphs
 */
export function getStatPanels(): GraphDefinition[] {
  return GRAPH_REGISTRY.filter((g) => g.chartType === "stat");
}

/**
 * Get all charts (non-stat visualizations)
 */
export function getCharts(): GraphDefinition[] {
  return GRAPH_REGISTRY.filter((g) => g.chartType !== "stat");
}

/**
 * Get all toggleable graphs (line/area/bar switch)
 */
export function getToggleableGraphs(): GraphDefinition[] {
  return GRAPH_REGISTRY.filter((g) => g.toggleable);
}

/**
 * Get graphs that have default queries
 */
export function getQueryableGraphs(): GraphDefinition[] {
  return GRAPH_REGISTRY.filter((g) => g.defaultQueries.length > 0);
}

/**
 * Get module-level statistics
 */
export function getModuleStats(): Record<
  ModuleCode,
  {
    total: number;
    stats: number;
    charts: number;
    topology: number;
    custom: number;
  }
> {
  const result = {} as Record<
    ModuleCode,
    {
      total: number;
      stats: number;
      charts: number;
      topology: number;
      custom: number;
    }
  >;

  for (const code of Object.keys(MODULE_METADATA) as ModuleCode[]) {
    const graphs = getGraphsByModule(code);
    result[code] = {
      total: graphs.length,
      stats: graphs.filter((g) => g.chartType === "stat").length,
      charts: graphs.filter((g) =>
        [
          "timeseries",
          "bar",
          "gauge",
          "heatmap",
          "scatter",
          "dynamic",
        ].includes(g.chartType),
      ).length,
      topology: graphs.filter((g) => g.chartType === "topology").length,
      custom: graphs.filter((g) =>
        [
          "waterfall",
          "flamegraph",
          "sparkline",
          "progress",
          "mini-bars",
        ].includes(g.chartType),
      ).length,
    };
  }

  return result;
}

/**
 * Total graph count
 */
export const TOTAL_GRAPHS = GRAPH_REGISTRY.length;
