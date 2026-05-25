/**
 * Context Collector Service
 * Collects real telemetry context from ClickHouse materialized views (timescale)
 * and PostgreSQL (non-timescale) for AI analysis.
 *
 * All queries are scoped to the requesting organization (knowledge-base isolation).
 *
 * ClickHouse — raw tables + materialized views:
 *   metrics      → metrics_5m  (AggMT)
 *   logs         → logs_1h (SumMT) + logs raw
 *   traces       → service_latency_percentiles_1h + service_error_rates_1h
 *   exemplars    → exemplars raw + exemplars_1h
 *   uptime       → uptime_checks raw (aggregated with standard functions)
 *   status-page  → uptime_checks raw (latest per monitor)
 *   audit        → audit_logs raw + audit_logs_1h aggregated stats
 *   correlations → metrics + logs + traces + signal_correlations_1h
 *   infra-*      → metrics_5m filtered by category
 *
 * PostgreSQL + ClickHouse hybrid:
 *   kubernetes   → kubernetes_clusters (PG) + kubernetes_metrics_1h (CH AggMT)
 *   agents       → agents (PG) + vm_metrics_1h (CH AggMT)
 *   service-map  → service_map_services + service_map_dependencies (PG) + service_map_metrics_1h (CH SumMT)
 *   network-map  → network_map_nodes + network_map_connections (PG)
 *                  + network_map_traffic_1h + network_map_connection_metrics_1h (CH SumMT)
 *
 * PostgreSQL only:
 *   alerts       → alert_rules + alert_instances
 *   alert-rules  → alert_rules + alert_instances (same as alerts)
 *   iam + sub    → users + roles + role_permissions
 *   tenancy + sub→ organizations + workspaces
 *   retention    → retention_policies
 *   subscription → plans
 *   api-keys     → api_keys
 *   notifications→ notification_channels
 *   reports      → report_definitions + report_executions
 *   data-masking → data_masking_policies
 *   ai-assistant → llm_providers
 *   system-setup → notification_channels + api_keys + sso_providers
 *   account-*    → users + user_sessions (user-scoped via userId)
 */

import { Injectable, Logger, Optional } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ClickHouseService } from "../../../../shared/clickhouse/clickhouse.service";
import type { ContextType } from "../../domain/aggregates/Conversation";
import type { TelemetryContext } from "./PromptBuilder.service";

// ── Option types ──────────────────────────────────────────────────────────────

export interface CollectContextOptions {
  organizationId: string;
  userId?: string;
  contextType: ContextType;
  contextId?: string;
  timeRange?: { from: Date; to: Date };
  maxItems?: number;
}

// ── ClickHouse row types ──────────────────────────────────────────────────────

interface MetricAggRow {
  service_name: string;
  metric_name: string;
  metric_type: string;
  avg_val: number;
  max_val: number;
  min_val: number;
  sample_count: number;
}

interface LogSeverityRow {
  service_name: string;
  severity_text: string;
  total: number;
}

interface LogErrorRow {
  severity_text: string;
  service_name: string;
  body: string;
  timestamp: string;
}

interface ServiceLatencyRow {
  service_name: string;
  requests: number;
  avg_ms: number;
  p95_ms: number;
  p99_ms: number;
}

interface ServiceErrorRateRow {
  service_name: string;
  total_reqs: number;
  errors: number;
  error_rate_pct: number;
}

interface UptimeMonitorRow {
  monitor_id: string;
  monitor_name: string;
  region: string;
  total_checks: number;
  success_count: number;
  failure_count: number;
  availability_pct: number;
  avg_response_ms: number;
  p95_response_ms: number;
  max_response_ms: number;
}

interface ExemplarRow {
  timestamp: string;
  metric_name: string;
  service_name: string;
  trace_id: string;
  span_id: string;
  value: number;
}

interface AuditLogRow {
  timestamp: string;
  user_id: string;
  user_email: string;
  event_type: string;
  action: string;
  resource: string;
  resource_id: string;
  result: string;
  ip_address: string;
}

interface AuditStatsRow {
  hour: string;
  event_type: string;
  result: string;
  count: number;
}

interface SignalCorrelationRow {
  service_name: string;
  correlation_type: string;
  count: number;
}

interface KubernetesMetricRow {
  resource_type: string;
  resource_name: string;
  namespace: string;
  metric_name: string;
  avg_value: number;
  max_value: number;
}

interface K8sNodeRow {
  name: string;
  status: string;
  roles: string[];
  cpu_capacity: string | null;
  memory_capacity: string | null;
  conditions: Array<{ type: string; status: string }>;
  cluster_name: string;
}

interface K8sPodRow {
  name: string;
  phase: string;
  restart_count: number;
  namespace_name: string | null;
  cluster_name: string;
}

interface K8sDeploymentRow {
  name: string;
  replicas: number;
  ready_replicas: number;
  unavailable_replicas: number;
  namespace_name: string | null;
  cluster_name: string;
}

interface K8sPVRow {
  name: string;
  phase: string;
  capacity: Record<string, string>;
  storage_class_name: string;
  cluster_name: string;
}

interface VmMetricRow {
  vm_id: string;
  metric_name: string;
  avg_value: number;
  max_value: number;
}

interface ServiceMapMetricRow {
  service_id: string;
  service_name: string;
  avg_health_score: number;
  avg_latency: number;
  avg_error_rate: number;
  avg_request_rate: number;
}

interface NetworkTrafficRow {
  node_id: string;
  node_name: string;
  avg_cpu_usage: number;
  avg_memory_usage: number;
  avg_network_in: number;
  avg_network_out: number;
  avg_error_rate: number;
}

interface NetworkConnectionMetricRow {
  connection_id: string;
  avg_bandwidth: number;
  avg_latency: number;
  avg_packet_loss: number;
  total_bytes_sent: number;
  total_bytes_received: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a Date as "YYYY-MM-DD HH:MM:SS" for ClickHouse DateTime params */
function fmtCH(d: Date): string {
  return d.toISOString().replace("T", " ").split(".")[0];
}

@Injectable()
export class ContextCollectorService {
  private readonly logger = new Logger(ContextCollectorService.name);

  constructor(
    @Optional()
    private readonly clickhouse?: ClickHouseService,
    @Optional()
    @InjectDataSource()
    private readonly dataSource?: DataSource,
  ) {}

  // ── Public API ──────────────────────────────────────────────────────────────

  async collectContext(
    options: CollectContextOptions,
  ): Promise<TelemetryContext> {
    const { contextType, organizationId, contextId, userId } = options;
    const timeRange = options.timeRange ?? this.defaultRange();

    this.logger.log(
      `[ContextCollector] type="${contextType}" org="${organizationId}" ` +
        `from=${fmtCH(timeRange.from)} to=${fmtCH(timeRange.to)} ` +
        `ch=${this.clickhouse ? "connected" : "MISSING"} pg=${this.dataSource ? "connected" : "MISSING"}`,
    );

    try {
      // 5-second timeout so slow sources never block chat
      const ctx = await Promise.race([
        this.dispatch(contextType, organizationId, contextId, timeRange, userId),
        new Promise<TelemetryContext>((_, reject) =>
          setTimeout(() => reject(new Error("context-timeout")), 5000),
        ),
      ]);
      this.logger.log(
        `[ContextCollector] type="${contextType}" summary="${ctx.summary.substring(0, 120)}"`,
      );
      return ctx;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "context-timeout") {
        this.logger.warn(
          `[ContextCollector] TIMEOUT for type="${contextType}"`,
        );
        return this.unavailable(
          contextType,
          timeRange,
          "Query timed out after 5 seconds",
        );
      }
      this.logger.error(
        `[ContextCollector] ERROR for type="${contextType}": ${err}`,
      );
      return this.unavailable(contextType, timeRange, String(err));
    }
  }

  // ── Dispatch ────────────────────────────────────────────────────────────────

  private dispatch(
    contextType: ContextType,
    organizationId: string,
    contextId: string | undefined,
    timeRange: { from: Date; to: Date },
    userId?: string,
  ): Promise<TelemetryContext> {
    switch (contextType) {
      // ── ClickHouse timescale ──
      case "metrics":
        return this.metricsContext(organizationId, timeRange, contextId);
      case "logs":
        return this.logsContext(organizationId, timeRange, contextId);
      case "traces":
        return this.tracesContext(organizationId, timeRange, contextId);
      case "exemplars":
        return this.exemplarsContext(organizationId, timeRange, contextId);
      case "correlations":
      case "dashboard":
        return this.correlationsContext(organizationId, timeRange);
      case "uptime":
        return this.uptimeContext(organizationId, timeRange);
      case "status-page":
        return this.statusPageContext(organizationId, timeRange);
      case "audit":
        return this.auditContext(organizationId, timeRange);
      case "infra-overview":
        return this.infraOverviewContext(organizationId, timeRange);
      case "infra-cpu":
        return this.infraContext(organizationId, timeRange, "cpu");
      case "infra-memory":
        return this.infraContext(organizationId, timeRange, "memory");
      case "infra-storage":
        return this.infraContext(organizationId, timeRange, "disk");
      case "infra-network":
        return this.infraContext(organizationId, timeRange, "network");
      // ── PG + CH hybrid ──
      case "kubernetes-overview":
        return this.kubernetesContext(organizationId, timeRange);
      case "kubernetes-clusters":
        return this.kubernetesClustersContext(organizationId, timeRange);
      case "kubernetes-namespaces":
        return this.kubernetesNamespacesContext(organizationId, timeRange);
      case "kubernetes-nodes":
        return this.kubernetesNodesContext(organizationId, timeRange);
      case "kubernetes-pods":
        return this.kubernetesPodsContext(organizationId, timeRange);
      case "kubernetes-deployments":
        return this.kubernetesDeploymentsContext(organizationId, timeRange);
      case "kubernetes-pv":
        return this.kubernetesPVContext(organizationId, timeRange);
      // K8s sub-features: reuse full kubernetes context (system prompt differentiates focus)
      case "kubernetes-api-server":
        return this.kubernetesApiServerContext(organizationId, timeRange);
      case "kubernetes-coredns":
        return this.kubernetesCoreDNSContext(organizationId, timeRange);
      case "agents":
        return this.agentsContext(organizationId, timeRange);
      case "service-map":
        return this.serviceMapContext(organizationId, timeRange);
      case "network-map":
        return this.networkMapContext(organizationId, timeRange);
      // ── PostgreSQL non-timescale ──
      case "alerts":
        return this.alertsContext(organizationId, timeRange);
      // Alert sub-features
      case "alert-rules":
        return this.alertsContext(organizationId, timeRange);
      case "iam":
        return this.iamContext(organizationId);
      // IAM sub-features: delegate to parent context (system prompt focuses analysis)
      case "iam-users":
      case "iam-roles":
      case "iam-permissions":
      case "iam-matrix":
      case "iam-assignments":
        return this.iamContext(organizationId);
      case "tenancy":
        return this.tenancyContext(organizationId);
      // Tenancy sub-features: delegate to parent context
      case "tenancy-regions":
      case "tenancy-organizations":
      case "tenancy-workspaces":
      case "tenancy-tenants":
        return this.tenancyContext(organizationId);
      case "retention":
        return this.retentionContext(organizationId);
      case "subscription":
        return this.subscriptionContext(organizationId);
      case "api-keys":
        return this.apiKeysContext(organizationId);
      case "notifications":
        return this.notificationsContext(organizationId);
      // System sub-features
      case "system-channels":
        return this.notificationsContext(organizationId);
      case "account-notifications":
        return this.notificationsContext(organizationId);
      case "reports":
        return this.reportsContext(organizationId);
      // Account organization: surface tenancy/org data for the current user
      case "account-organization":
        return this.tenancyContext(organizationId);
      case "anomaly-detection":
        return this.anomalyDetectionContext(organizationId, timeRange);
      case "corrective-maintenance":
        return this.correctiveMaintenanceContext(organizationId, timeRange);
      case "predictive-maintenance":
        return this.predictiveMaintenanceContext(organizationId, timeRange);
      case "cost-optimization":
        return this.costOptimizationContext(organizationId, timeRange);
      // Config pages with live PG data
      case "data-masking":
        return this.dataMaskingContext(organizationId);
      case "ai-assistant":
        return this.aiAssistantContext(organizationId);
      case "system-setup":
        return this.systemSetupContext(organizationId);
      // Account pages — need userId for user-scoped queries
      case "account-profile":
      case "account-security":
      case "account-sessions":
      case "account-preferences":
        return userId
          ? this.accountContext(userId, organizationId, contextType)
          : Promise.resolve(this.empty(contextType, timeRange));
      // DB Monitoring Inventory
      case "db-monitoring-inventory":
        return this.dbInventoryContext(organizationId);
      // DB Monitoring MariaDB
      case "db-monitoring-mariadb":
        return this.dbMariaDBContext(organizationId, timeRange);
      // DB Monitoring MySQL/MariaDB/Percona
      case "db-monitoring-mysql":
        return this.dbMysqlContext(organizationId, timeRange);
      // DB Monitoring Percona
      case "db-monitoring-percona":
        return this.dbPerconaContext(organizationId, timeRange);
      // DB Monitoring SQLite3
      case "db-monitoring-sqlite3":
        return this.dbSqlite3Context(organizationId, timeRange);
      // DB Monitoring TimescaleDB
      case "db-monitoring-timescaledb":
        return this.dbTimescaledbContext(organizationId, timeRange);
      // DB Monitoring Aurora
      case "db-monitoring-aurora":
        return this.dbAuroraContext(organizationId, timeRange, contextId);
      // DB Monitoring MSSQL
      case "db-monitoring-mssql":
        return this.collectDbMonitoringMssqlContext({ organizationId, userId, contextType, contextId, timeRange });
      // DB Monitoring — additional engines
      case "db-monitoring-postgresql":
        return this.dbEngineMetricsContext("db-monitoring-postgresql", "db.postgresql%", organizationId, timeRange, "PostgreSQL");
      case "db-monitoring-mongodb-community":
        return this.dbEngineMetricsContext("db-monitoring-mongodb-community", "db.mongodb%", organizationId, timeRange, "MongoDB Community");
      case "db-monitoring-mongodb-atlas":
        return this.dbEngineMetricsContext("db-monitoring-mongodb-atlas", "db.mongodb_atlas%", organizationId, timeRange, "MongoDB Atlas");
      case "db-monitoring-aws-rds-mysql":
        return this.dbEngineMetricsContext("db-monitoring-aws-rds-mysql", "db.aws_rds_mysql%", organizationId, timeRange, "AWS RDS MySQL");
      case "db-monitoring-aws-rds-aurora":
        return this.dbEngineMetricsContext("db-monitoring-aws-rds-aurora", "db.aurora%", organizationId, timeRange, "AWS RDS Aurora");
      case "db-monitoring-aws-dynamodb":
        return this.dbEngineMetricsContext("db-monitoring-aws-dynamodb", "db.aws_dynamodb%", organizationId, timeRange, "AWS DynamoDB");
      case "db-monitoring-cockroachdb":
        return this.dbEngineMetricsContext("db-monitoring-cockroachdb", "db.cockroachdb%", organizationId, timeRange, "CockroachDB");
      // DB Monitoring — QAN
      case "db-monitoring-qan":
        return this.dbMonitoringQanContext(organizationId, timeRange);
      default:
        return Promise.resolve(this.empty(contextType, timeRange));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ClickHouse — pure timescale contexts
  // ══════════════════════════════════════════════════════════════════════════

  // ── Metrics ─────────────────────────────────────────────────────────────────

  private async metricsContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
    metricName?: string,
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable("metrics", timeRange, "ClickHouse not connected");
    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();
    const metricFilter = metricName
      ? "AND metric_name = {metricName:String}"
      : "";

    const result = await client.query({
      query: `
        SELECT
          service_name,
          metric_name,
          metric_type,
          round(avgMerge(avg_value), 4)   AS avg_val,
          round(maxMerge(max_value), 4)   AS max_val,
          round(minMerge(min_value), 4)   AS min_val,
          countMerge(count)               AS sample_count
        FROM ${db}.metrics_5m
        WHERE five_minutes >= {fromTime:DateTime}
          AND five_minutes <= {toTime:DateTime}
          AND organization_id = {orgId:String}
          ${metricFilter}
        GROUP BY service_name, metric_name, metric_type
        ORDER BY sample_count DESC
        LIMIT {limit:UInt32}
      `,
      query_params: {
        fromTime: fmtCH(timeRange.from),
        toTime: fmtCH(timeRange.to),
        orgId: organizationId,
        ...(metricName ? { metricName } : {}),
        limit: 30,
      },
      format: "JSONEachRow",
    });
    const rows = await result.json<MetricAggRow>();

    const highlights: string[] = [];
    if (rows.length === 0) {
      highlights.push("No metric data available for the selected time range.");
    } else {
      const services = [...new Set(rows.map((r) => r.service_name))];
      highlights.push(
        `${rows.length} metric series across ${services.length} service(s).`,
      );
      const spikes = rows.filter(
        (r) => r.avg_val > 0 && r.max_val > r.avg_val * 3,
      );
      if (spikes.length > 0) {
        highlights.push(
          `Potential spikes in: ${spikes.map((r) => `${r.service_name}/${r.metric_name}`).join(", ")}.`,
        );
      }
    }
    return {
      type: "metrics",
      timeRange,
      summary: highlights.join(" "),
      data: { metrics: rows, highlights },
    };
  }

  // ── Logs ─────────────────────────────────────────────────────────────────────

  private async logsContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
    serviceName?: string,
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable("logs", timeRange, "ClickHouse not connected");
    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();
    const svcFilter = serviceName ? "AND service_name = {svcName:String}" : "";

    const sevResult = await client.query({
      query: `
        SELECT service_name, severity_text, sum(count) AS total
        FROM ${db}.logs_1h
        WHERE hour >= {fromTime:DateTime}
          AND hour <= {toTime:DateTime}
          AND organization_id = {orgId:String}
          ${svcFilter}
        GROUP BY service_name, severity_text
        ORDER BY total DESC
        LIMIT 50
      `,
      query_params: {
        fromTime: fmtCH(timeRange.from),
        toTime: fmtCH(timeRange.to),
        orgId: organizationId,
        ...(serviceName ? { svcName: serviceName } : {}),
      },
      format: "JSONEachRow",
    });
    const severityRows = await sevResult.json<LogSeverityRow>();

    const errResult = await client.query({
      query: `
        SELECT severity_text, service_name,
               substring(body, 1, 300) AS body,
               timestamp
        FROM ${db}.logs
        WHERE timestamp >= {fromTime:DateTime64(9)}
          AND organization_id = {orgId:String}
          AND severity_text IN ('ERROR', 'FATAL', 'CRITICAL')
          ${svcFilter}
        ORDER BY timestamp DESC
        LIMIT 20
      `,
      query_params: {
        fromTime: fmtCH(timeRange.from),
        orgId: organizationId,
        ...(serviceName ? { svcName: serviceName } : {}),
      },
      format: "JSONEachRow",
    });
    const errorRows = await errResult.json<LogErrorRow>();

    const bySeverity: Record<string, number> = {};
    let totalLogs = 0;
    for (const row of severityRows) {
      bySeverity[row.severity_text] =
        (bySeverity[row.severity_text] ?? 0) + Number(row.total);
      totalLogs += Number(row.total);
    }

    const highlights: string[] = [];
    if (totalLogs === 0) {
      highlights.push("No log data available for the selected time range.");
    } else {
      highlights.push(`${totalLogs.toLocaleString()} total log entries.`);
      if (bySeverity["ERROR"])
        highlights.push(`${bySeverity["ERROR"]} ERROR logs.`);
      if (bySeverity["FATAL"])
        highlights.push(`${bySeverity["FATAL"]} FATAL logs.`);
      if (bySeverity["WARN"] || bySeverity["WARNING"]) {
        highlights.push(
          `${(bySeverity["WARN"] ?? 0) + (bySeverity["WARNING"] ?? 0)} WARN logs.`,
        );
      }
      if (errorRows.length > 0) {
        highlights.push(
          `Recent errors: ${errorRows
            .slice(0, 3)
            .map((r) => `[${r.service_name}] ${r.body.substring(0, 80)}`)
            .join(" | ")}`,
        );
      }
    }
    return {
      type: "logs",
      timeRange,
      summary: highlights.join(" "),
      data: {
        severityDistribution: bySeverity,
        totalLogs,
        recentErrors: errorRows,
        highlights,
      },
    };
  }

  // ── Traces ───────────────────────────────────────────────────────────────────

  private async tracesContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
    _traceId?: string,
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable("traces", timeRange, "ClickHouse not connected");
    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();
    const baseParams = {
      fromTime: fmtCH(timeRange.from),
      toTime: fmtCH(timeRange.to),
      orgId: organizationId,
      limit: 20,
    };

    const latencyResult = await client.query({
      query: `
        SELECT
          service_name,
          countMerge(request_count)                              AS requests,
          round(avgMerge(avg_duration_ns) / 1e6, 2)             AS avg_ms,
          round(quantileMerge(0.95)(p95_duration_ns) / 1e6, 2)  AS p95_ms,
          round(quantileMerge(0.99)(p99_duration_ns) / 1e6, 2)  AS p99_ms
        FROM ${db}.service_latency_percentiles_1h
        WHERE hour >= {fromTime:DateTime}
          AND hour <= {toTime:DateTime}
          AND organization_id = {orgId:String}
        GROUP BY service_name
        ORDER BY p95_ms DESC
        LIMIT {limit:UInt32}
      `,
      query_params: baseParams,
      format: "JSONEachRow",
    });
    const latencyRows = await latencyResult.json<ServiceLatencyRow>();

    const errRateResult = await client.query({
      query: `
        SELECT
          service_name,
          sum(total_requests)                                       AS total_reqs,
          sum(error_count)                                          AS errors,
          round(sum(error_count) * 100.0 / sum(total_requests), 2) AS error_rate_pct
        FROM ${db}.service_error_rates_1h
        WHERE hour >= {fromTime:DateTime}
          AND hour <= {toTime:DateTime}
          AND organization_id = {orgId:String}
        GROUP BY service_name
        HAVING total_reqs > 0
        ORDER BY error_rate_pct DESC
        LIMIT {limit:UInt32}
      `,
      query_params: baseParams,
      format: "JSONEachRow",
    });
    const errRateRows = await errRateResult.json<ServiceErrorRateRow>();

    const highlights: string[] = [];
    if (latencyRows.length === 0 && errRateRows.length === 0) {
      highlights.push("No trace data available for the selected time range.");
    } else {
      if (latencyRows.length > 0) {
        highlights.push(`Latency data for ${latencyRows.length} service(s).`);
        const slow = latencyRows.filter((r) => Number(r.p95_ms) > 1000);
        if (slow.length > 0) {
          highlights.push(
            `Slow services (p95>1s): ${slow.map((r) => `${r.service_name} p95=${r.p95_ms}ms`).join(", ")}.`,
          );
        }
      }
      if (errRateRows.length > 0) {
        const highErr = errRateRows.filter((r) => Number(r.error_rate_pct) > 5);
        if (highErr.length > 0) {
          highlights.push(
            `High error rate: ${highErr.map((r) => `${r.service_name} ${r.error_rate_pct}%`).join(", ")}.`,
          );
        }
      }
    }
    return {
      type: "traces",
      timeRange,
      summary: highlights.join(" "),
      data: {
        serviceLatencies: latencyRows,
        serviceErrorRates: errRateRows,
        highlights,
      },
    };
  }

  // ── Exemplars ────────────────────────────────────────────────────────────────

  private async exemplarsContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
    metricName?: string,
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable(
        "exemplars",
        timeRange,
        "ClickHouse not connected",
      );
    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();
    const metricFilter = metricName
      ? "AND metric_name = {metricName:String}"
      : "";

    const result = await client.query({
      query: `
        SELECT
          timestamp,
          metric_name,
          service_name,
          trace_id,
          span_id,
          round(value, 4) AS value
        FROM ${db}.exemplars
        WHERE timestamp >= {fromTime:DateTime64(9)}
          AND timestamp <= {toTime:DateTime64(9)}
          AND organization_id = {orgId:String}
          ${metricFilter}
        ORDER BY timestamp DESC
        LIMIT 50
      `,
      query_params: {
        fromTime: fmtCH(timeRange.from),
        toTime: fmtCH(timeRange.to),
        orgId: organizationId,
        ...(metricName ? { metricName } : {}),
      },
      format: "JSONEachRow",
    });
    const rows = await result.json<ExemplarRow>();

    const highlights: string[] = [];
    if (rows.length === 0) {
      highlights.push("No exemplars found for the selected time range.");
    } else {
      const metrics = [...new Set(rows.map((r) => r.metric_name))];
      const services = [...new Set(rows.map((r) => r.service_name))];
      highlights.push(
        `${rows.length} exemplars across ${metrics.length} metric(s) for ${services.length} service(s).`,
      );
      highlights.push(
        `Sample trace IDs: ${rows
          .slice(0, 5)
          .map((r) => r.trace_id.substring(0, 8) + "...")
          .join(", ")}`,
      );
    }
    return {
      type: "exemplars",
      timeRange,
      summary: highlights.join(" "),
      data: { exemplars: rows, highlights },
    };
  }

  // ── Uptime ───────────────────────────────────────────────────────────────────

  private async uptimeContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable("uptime", timeRange, "ClickHouse not connected");
    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    // Query raw uptime_checks table with standard aggregations
    // (avoids AggregatingMergeTree Merge-function type errors from uptime_checks_1h)
    const result = await client.query({
      query: `
        SELECT
          monitor_id,
          monitor_name,
          region,
          count()                                               AS total_checks,
          countIf(status = 'success')                          AS success_count,
          countIf(status IN ('failure', 'timeout', 'error'))   AS failure_count,
          round(
            if(count() > 0,
               countIf(status = 'success') * 100.0 / count(), 0
            ), 2)                                              AS availability_pct,
          round(avg(response_time), 0)                         AS avg_response_ms,
          round(quantile(0.95)(response_time), 0)              AS p95_response_ms,
          round(max(response_time), 0)                         AS max_response_ms
        FROM ${db}.uptime_checks
        WHERE checked_at >= {fromTime:DateTime64(3)}
          AND checked_at <= {toTime:DateTime64(3)}
          AND organization_id = {orgId:String}
        GROUP BY monitor_id, monitor_name, region
        ORDER BY availability_pct ASC
        LIMIT 50
      `,
      query_params: {
        fromTime: fmtCH(timeRange.from),
        toTime: fmtCH(timeRange.to),
        orgId: organizationId,
      },
      format: "JSONEachRow",
    });
    const monitors = await result.json<UptimeMonitorRow>();

    const highlights: string[] = [];
    if (monitors.length === 0) {
      highlights.push(
        `[SYSTEM] No uptime monitor data found in ClickHouse for the time range ` +
          `${fmtCH(timeRange.from)} to ${fmtCH(timeRange.to)}. ` +
          `This means either no uptime monitors are configured in this organization, ` +
          `or no checks have been recorded in this period. ` +
          `Inform the user of this and suggest they configure monitors in the Uptime Monitoring section.`,
      );
    } else {
      const avgAvail =
        monitors.reduce((s, r) => s + Number(r.availability_pct), 0) /
        monitors.length;
      highlights.push(
        `${monitors.length} monitor(s). Average availability: ${avgAvail.toFixed(2)}%.`,
      );

      const belowSla = monitors.filter(
        (r) => Number(r.availability_pct) < 99.0,
      );
      if (belowSla.length > 0) {
        highlights.push(
          `Below 99% SLA: ${belowSla.map((r) => `${r.monitor_name} (${r.availability_pct}%)`).join(", ")}.`,
        );
      }
      const slow = monitors.filter((r) => Number(r.p95_response_ms) > 2000);
      if (slow.length > 0) {
        highlights.push(
          `Slow monitors (p95>2s): ${slow.map((r) => `${r.monitor_name} ${r.p95_response_ms}ms`).join(", ")}.`,
        );
      }
    }
    return {
      type: "uptime",
      timeRange,
      summary: highlights.join(" "),
      data: { monitors, highlights },
    };
  }

  // ── Status-page ──────────────────────────────────────────────────────────────

  private async statusPageContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable(
        "status-page",
        timeRange,
        "ClickHouse not connected",
      );
    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    const result = await client.query({
      query: `
        SELECT
          monitor_id, monitor_name, status, response_time,
          checked_at, region
        FROM ${db}.uptime_checks
        WHERE checked_at >= {fromTime:DateTime64(3)}
          AND organization_id = {orgId:String}
        ORDER BY checked_at DESC
        LIMIT 200
      `,
      query_params: { fromTime: fmtCH(timeRange.from), orgId: organizationId },
      format: "JSONEachRow",
    });
    const rawChecks = await result.json<{
      monitor_id: string;
      monitor_name: string;
      status: string;
      response_time: number;
      checked_at: string;
      region: string;
    }>();

    // Latest status per monitor
    const latestByMonitor = new Map<string, (typeof rawChecks)[0]>();
    for (const check of rawChecks) {
      if (!latestByMonitor.has(check.monitor_id))
        latestByMonitor.set(check.monitor_id, check);
    }
    const currentStatus = [...latestByMonitor.values()];

    const highlights: string[] = [];
    if (currentStatus.length === 0) {
      highlights.push("No status data available.");
    } else {
      const operational = currentStatus.filter(
        (c) => c.status === "success",
      ).length;
      const down = currentStatus.filter((c) => c.status !== "success");
      highlights.push(
        `${operational}/${currentStatus.length} monitors operational.`,
      );
      if (down.length > 0) {
        highlights.push(
          `Failing: ${down.map((c) => `${c.monitor_name} [${c.status}]`).join(", ")}.`,
        );
      }
    }
    return {
      type: "status-page",
      timeRange,
      summary: highlights.join(" "),
      data: { currentStatus, totalMonitors: currentStatus.length, highlights },
    };
  }

  // ── Audit (ClickHouse audit_logs) ────────────────────────────────────────────

  private async auditContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable("audit", timeRange, "ClickHouse not connected");
    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    // Recent raw audit events
    const rawResult = await client.query({
      query: `
        SELECT
          timestamp,
          user_id,
          user_email,
          event_type,
          action,
          resource,
          resource_id,
          result,
          ip_address
        FROM ${db}.audit_logs
        WHERE timestamp >= {fromTime:DateTime64(3)}
          AND timestamp <= {toTime:DateTime64(3)}
          AND organization_id = {orgId:String}
        ORDER BY timestamp DESC
        LIMIT 100
      `,
      query_params: {
        fromTime: fmtCH(timeRange.from),
        toTime: fmtCH(timeRange.to),
        orgId: organizationId,
      },
      format: "JSONEachRow",
    });
    const events = await rawResult.json<AuditLogRow>();

    // Aggregated stats from audit_logs_1h (SummingMergeTree)
    const statsResult = await client.query({
      query: `
        SELECT
          hour,
          event_type,
          result,
          sum(count) AS count
        FROM ${db}.audit_logs_1h
        WHERE hour >= {fromTime:DateTime}
          AND hour <= {toTime:DateTime}
          AND organization_id = {orgId:String}
        GROUP BY hour, event_type, result
        ORDER BY hour DESC, count DESC
        LIMIT 50
      `,
      query_params: {
        fromTime: fmtCH(timeRange.from),
        toTime: fmtCH(timeRange.to),
        orgId: organizationId,
      },
      format: "JSONEachRow",
    });
    const stats = await statsResult.json<AuditStatsRow>();

    const highlights: string[] = [];
    if (events.length === 0 && stats.length === 0) {
      highlights.push("No audit events found for the selected time range.");
    } else {
      const failures = events.filter(
        (e) => e.result === "FAILURE" || e.result === "DENIED",
      );
      const actorSet = new Set(events.map((e) => e.user_email));
      highlights.push(
        `${events.length} audit events by ${actorSet.size} actor(s).`,
      );
      if (failures.length > 0) {
        highlights.push(
          `${failures.length} FAILURE/DENIED actions — potential security concern.`,
        );
      }
      const byAction: Record<string, number> = {};
      for (const e of events)
        byAction[e.action] = (byAction[e.action] ?? 0) + 1;
      const topActions = Object.entries(byAction)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([action, count]) => `${action}(${count})`);
      if (topActions.length > 0)
        highlights.push(`Top actions: ${topActions.join(", ")}.`);
    }
    return {
      type: "audit",
      timeRange,
      summary: highlights.join(" "),
      data: { events, stats, highlights },
    };
  }

  // ── Correlations / Dashboard ─────────────────────────────────────────────────

  private async correlationsContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [metricsCtx, logsCtx, tracesCtx, correlationsCtx] =
      await Promise.allSettled([
        this.metricsContext(organizationId, timeRange),
        this.logsContext(organizationId, timeRange),
        this.tracesContext(organizationId, timeRange),
        this.signalCorrelationsData(organizationId, timeRange),
      ]);

    const combined: Record<string, unknown> = {};
    const highlights: string[] = ["Cross-signal summary:"];

    if (
      metricsCtx.status === "fulfilled" &&
      (metricsCtx.value.data as any)?.metrics?.length > 0
    ) {
      combined.metrics = (metricsCtx.value.data as any).metrics;
      highlights.push(
        `Metrics: ${(metricsCtx.value.data as any).highlights?.join(" ")}`,
      );
    }
    if (
      logsCtx.status === "fulfilled" &&
      (logsCtx.value.data as any)?.totalLogs > 0
    ) {
      combined.logs = logsCtx.value.data;
      highlights.push(
        `Logs: ${(logsCtx.value.data as any).highlights?.join(" ")}`,
      );
    }
    if (
      tracesCtx.status === "fulfilled" &&
      (tracesCtx.value.data as any)?.serviceLatencies?.length > 0
    ) {
      combined.traces = tracesCtx.value.data;
      highlights.push(
        `Traces: ${(tracesCtx.value.data as any).highlights?.join(" ")}`,
      );
    }
    if (
      correlationsCtx.status === "fulfilled" &&
      (correlationsCtx.value as SignalCorrelationRow[]).length > 0
    ) {
      combined.signalCorrelations = correlationsCtx.value;
      const topCorrelations = (correlationsCtx.value as SignalCorrelationRow[])
        .slice(0, 5)
        .map((c) => `${c.service_name}/${c.correlation_type}(${c.count})`)
        .join(", ");
      highlights.push(`Signal correlations: ${topCorrelations}.`);
    }

    if (highlights.length === 1)
      highlights.push("No telemetry data available for this time range.");
    return {
      type: "correlations",
      timeRange,
      summary: highlights.join(" "),
      data: combined,
    };
  }

  /** signal_correlations_1h (SummingMergeTree) — used by correlations context */
  private async signalCorrelationsData(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<SignalCorrelationRow[]> {
    if (!this.clickhouse) return [];
    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();
    try {
      const result = await client.query({
        query: `
          SELECT
            service_name,
            correlation_type,
            sum(count) AS count
          FROM ${db}.signal_correlations_1h
          WHERE hour >= {fromTime:DateTime}
            AND hour <= {toTime:DateTime}
            AND organization_id = {orgId:String}
          GROUP BY service_name, correlation_type
          ORDER BY count DESC
          LIMIT 30
        `,
        query_params: {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
        },
        format: "JSONEachRow",
      });
      return await result.json<SignalCorrelationRow>();
    } catch {
      return [];
    }
  }

  // ── Infrastructure ───────────────────────────────────────────────────────────

  private async infraContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
    metricCategory: "cpu" | "memory" | "disk" | "network",
  ): Promise<TelemetryContext> {
    // VM/host metrics are stored in vm_metrics_1h (from agent heartbeats),
    // NOT in metrics_5m which holds OTEL service-level metrics.
    const patterns: Record<string, string> = {
      cpu: "cpu",
      memory: "mem",
      disk: "disk",
      network: "net",
    };

    const [agentsResult, vmMetrics] = await Promise.allSettled([
      this.pgQuery<{ id: string; name: string; host: string; status: string }>(
        `SELECT id, name, host, status FROM agents WHERE organization_id = $1 AND deleted_at IS NULL LIMIT 50`,
        [organizationId],
      ),
      this.chQuerySafe<VmMetricRow>(
        `SELECT
           vm_id, metric_name,
           round(avgMerge(avg_value), 2) AS avg_value,
           round(maxMerge(max_value), 2) AS max_value
         FROM {db}.vm_metrics_1h
         WHERE hour >= {fromTime:DateTime}
           AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String}
           AND lowerUTF8(metric_name) LIKE {pattern:String}
         GROUP BY vm_id, metric_name
         ORDER BY avg_value DESC
         LIMIT 30`,
        {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
          pattern: `%${patterns[metricCategory]}%`,
        },
      ),
    ]);

    const agentRows =
      agentsResult.status === "fulfilled" ? agentsResult.value : [];
    const rows = vmMetrics.status === "fulfilled" ? vmMetrics.value : [];
    const agentMap = new Map(agentRows.map((a) => [a.id, a]));

    const highlights: string[] =
      rows.length === 0
        ? [`No ${metricCategory} metrics recorded in this time range.`]
        : [
            `${rows.length} ${metricCategory} metric series across ${new Set(rows.map((r) => r.vm_id)).size} VM(s).`,
            ...rows
              .filter((r) => Number(r.avg_value) > 80)
              .slice(0, 5)
              .map((r) => {
                const agent = agentMap.get(r.vm_id);
                const label = agent ? `${agent.name}(${agent.host})` : r.vm_id;
                return `High ${r.metric_name} on ${label}: avg=${r.avg_value}`;
              }),
          ];

    return {
      type: `infra-${metricCategory}` as ContextType,
      timeRange,
      summary: highlights.join(" "),
      data: { metrics: rows, agents: agentRows, highlights },
    };
  }

  private async infraOverviewContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [cpu, memory, disk, network] = await Promise.allSettled([
      this.infraContext(organizationId, timeRange, "cpu"),
      this.infraContext(organizationId, timeRange, "memory"),
      this.infraContext(organizationId, timeRange, "disk"),
      this.infraContext(organizationId, timeRange, "network"),
    ]);

    const sections: string[] = [];
    if (cpu.status === "fulfilled") sections.push(`[CPU] ${cpu.value.summary}`);
    if (memory.status === "fulfilled")
      sections.push(`[Memory] ${memory.value.summary}`);
    if (disk.status === "fulfilled")
      sections.push(`[Disk] ${disk.value.summary}`);
    if (network.status === "fulfilled")
      sections.push(`[Network] ${network.value.summary}`);

    return {
      type: "infra-overview",
      timeRange,
      summary: sections.join(" | "),
      data: {
        cpu: cpu.status === "fulfilled" ? cpu.value.data : null,
        memory: memory.status === "fulfilled" ? memory.value.data : null,
        disk: disk.status === "fulfilled" ? disk.value.data : null,
        network: network.status === "fulfilled" ? network.value.data : null,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PostgreSQL + ClickHouse hybrid contexts
  // ══════════════════════════════════════════════════════════════════════════

  // ── Kubernetes ───────────────────────────────────────────────────────────────

  private async kubernetesContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [
      clusters,
      nodes,
      failingPods,
      degradedDeployments,
      pvIssues,
      k8sMetrics,
    ] = await Promise.allSettled([
      // Cluster inventory
      this.pgQuery<{
        id: string;
        name: string;
        provider: string;
        region: string;
        status: string;
        node_count: number;
        pod_count: number;
        namespace_count: number;
        version: string;
      }>(
        `SELECT id, name, provider, region, status, node_count, pod_count, namespace_count, version
         FROM kubernetes_clusters
         WHERE organization_id = $1 AND deleted_at IS NULL
         ORDER BY name LIMIT 20`,
        [organizationId],
      ),
      // Node health — all nodes with their conditions
      this.pgQuery<K8sNodeRow>(
        `SELECT kn.name, kn.status, kn.roles, kn.cpu_capacity, kn.memory_capacity,
                kn.conditions, kc.name AS cluster_name
         FROM kubernetes_nodes kn
         JOIN kubernetes_clusters kc ON kn.cluster_id = kc.id
         WHERE kc.organization_id = $1
         ORDER BY kn.status DESC
         LIMIT 50`,
        [organizationId],
      ),
      // Pods in Failed/Unknown phase or high restart count
      this.pgQuery<K8sPodRow>(
        `SELECT kp.name, kp.phase, kp.restart_count,
                kns.name AS namespace_name, kc.name AS cluster_name
         FROM kubernetes_pods kp
         JOIN kubernetes_clusters kc ON kp.cluster_id = kc.id
         LEFT JOIN kubernetes_namespaces kns ON kp.namespace_id = kns.id
         WHERE kc.organization_id = $1
           AND (kp.phase IN ('Failed', 'Unknown') OR kp.restart_count > 5)
         ORDER BY kp.restart_count DESC
         LIMIT 30`,
        [organizationId],
      ),
      // Deployments with unavailable replicas
      this.pgQuery<K8sDeploymentRow>(
        `SELECT kd.name, kd.replicas, kd.ready_replicas, kd.unavailable_replicas,
                kns.name AS namespace_name, kc.name AS cluster_name
         FROM kubernetes_deployments kd
         JOIN kubernetes_clusters kc ON kd.cluster_id = kc.id
         LEFT JOIN kubernetes_namespaces kns ON kd.namespace_id = kns.id
         WHERE kc.organization_id = $1 AND kd.unavailable_replicas > 0
         ORDER BY kd.unavailable_replicas DESC
         LIMIT 20`,
        [organizationId],
      ),
      // PVs not in Bound phase
      this.pgQuery<K8sPVRow>(
        `SELECT kpv.name, kpv.phase, kpv.capacity, kpv.storage_class_name,
                kc.name AS cluster_name
         FROM kubernetes_persistent_volumes kpv
         JOIN kubernetes_clusters kc ON kpv.cluster_id = kc.id
         WHERE kc.organization_id = $1 AND kpv.phase != 'Bound'
         ORDER BY kpv.phase
         LIMIT 20`,
        [organizationId],
      ),
      // CH: resource metrics (node + pod level)
      this.chQuerySafe<KubernetesMetricRow>(
        `SELECT
           resource_type, resource_name, namespace, metric_name,
           round(avgMerge(avg_value), 2) AS avg_value,
           round(maxMerge(max_value), 2) AS max_value
         FROM {db}.kubernetes_metrics_1h
         WHERE hour >= {fromTime:DateTime}
           AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String}
         GROUP BY resource_type, resource_name, namespace, metric_name
         ORDER BY avg_value DESC
         LIMIT 50`,
        {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
        },
      ),
    ]);

    const clusterRows = clusters.status === "fulfilled" ? clusters.value : [];
    const nodeRows = nodes.status === "fulfilled" ? nodes.value : [];
    const podRows = failingPods.status === "fulfilled" ? failingPods.value : [];
    const deployRows =
      degradedDeployments.status === "fulfilled"
        ? degradedDeployments.value
        : [];
    const pvRows = pvIssues.status === "fulfilled" ? pvIssues.value : [];
    const metricRows =
      k8sMetrics.status === "fulfilled" ? k8sMetrics.value : [];

    const highlights: string[] = [];

    // Clusters
    if (clusterRows.length === 0) {
      highlights.push("No Kubernetes clusters registered.");
    } else {
      const healthy = clusterRows.filter((c) => c.status === "healthy").length;
      const degraded = clusterRows.filter((c) => c.status === "degraded");
      const totalPods = clusterRows.reduce(
        (s, c) => s + Number(c.pod_count),
        0,
      );
      const totalNodes = clusterRows.reduce(
        (s, c) => s + Number(c.node_count),
        0,
      );
      highlights.push(
        `${clusterRows.length} cluster(s): ${healthy} healthy. Total: ${totalNodes} node(s), ${totalPods} pod(s).`,
      );
      if (degraded.length > 0)
        highlights.push(
          `Degraded clusters: ${degraded.map((c) => c.name).join(", ")}.`,
        );
    }

    // Nodes
    const notReadyNodes = nodeRows.filter(
      (n) =>
        n.status !== "Ready" ||
        (n.conditions || []).some(
          (cd) => cd.type === "Ready" && cd.status !== "True",
        ),
    );
    if (notReadyNodes.length > 0) {
      highlights.push(
        `NotReady nodes: ${notReadyNodes
          .map((n) => `${n.name}(${n.cluster_name})`)
          .slice(0, 5)
          .join(", ")}.`,
      );
    } else if (nodeRows.length > 0) {
      highlights.push(`All ${nodeRows.length} node(s) are Ready.`);
    }

    // Pods
    if (podRows.length > 0) {
      const failed = podRows.filter((p) => p.phase === "Failed");
      const crashing = podRows.filter((p) => p.restart_count > 5);
      if (failed.length > 0)
        highlights.push(
          `Failed pods: ${failed
            .map((p) => `${p.name}(${p.namespace_name ?? "?"})`)
            .slice(0, 5)
            .join(", ")}.`,
        );
      if (crashing.length > 0)
        highlights.push(
          `High-restart pods: ${crashing
            .map((p) => `${p.name}(restarts=${p.restart_count})`)
            .slice(0, 5)
            .join(", ")}.`,
        );
    }

    // Deployments
    if (deployRows.length > 0) {
      highlights.push(
        `Degraded deployments: ${deployRows
          .map((d) => `${d.name}(${d.ready_replicas}/${d.replicas} ready)`)
          .slice(0, 5)
          .join(", ")}.`,
      );
    }

    // PVs
    if (pvRows.length > 0) {
      highlights.push(
        `PV issues: ${pvRows
          .map((pv) => `${pv.name}(${pv.phase})`)
          .slice(0, 5)
          .join(", ")}.`,
      );
    }

    // CH resource metrics
    if (metricRows.length > 0) {
      const highCpu = metricRows.filter(
        (m) =>
          m.metric_name.toLowerCase().includes("cpu") &&
          Number(m.avg_value) > 80,
      );
      const highMem = metricRows.filter(
        (m) =>
          m.metric_name.toLowerCase().includes("mem") &&
          Number(m.avg_value) > 85,
      );
      if (highCpu.length > 0)
        highlights.push(
          `High CPU resources: ${highCpu
            .map((m) => `${m.resource_name}(${m.avg_value}%)`)
            .slice(0, 3)
            .join(", ")}.`,
        );
      if (highMem.length > 0)
        highlights.push(
          `High Memory resources: ${highMem
            .map((m) => `${m.resource_name}(${m.avg_value}%)`)
            .slice(0, 3)
            .join(", ")}.`,
        );
    }

    return {
      type: "kubernetes-overview",
      timeRange,
      summary: highlights.join(" "),
      data: {
        clusters: clusterRows,
        nodes: nodeRows,
        pods: podRows,
        deployments: deployRows,
        persistentVolumes: pvRows,
        metrics: metricRows,
        highlights,
      },
    };
  }

  private async kubernetesClustersContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [clusters, k8sMetrics] = await Promise.allSettled([
      this.pgQuery<{
        id: string;
        name: string;
        provider: string;
        region: string;
        status: string;
        node_count: number;
        pod_count: number;
        namespace_count: number;
        version: string;
      }>(
        `SELECT id, name, provider, region, status, node_count, pod_count, namespace_count, version
         FROM kubernetes_clusters
         WHERE organization_id = $1 AND deleted_at IS NULL
         ORDER BY name LIMIT 30`,
        [organizationId],
      ),
      this.chQuerySafe<KubernetesMetricRow>(
        `SELECT resource_type, resource_name, namespace, metric_name,
                round(avgMerge(avg_value), 2) AS avg_value,
                round(maxMerge(max_value), 2) AS max_value
         FROM {db}.kubernetes_metrics_1h
         WHERE hour >= {fromTime:DateTime} AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String} AND resource_type = 'node'
         GROUP BY resource_type, resource_name, namespace, metric_name
         ORDER BY avg_value DESC LIMIT 50`,
        {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
        },
      ),
    ]);

    const clusterRows = clusters.status === "fulfilled" ? clusters.value : [];
    const metricRows =
      k8sMetrics.status === "fulfilled" ? k8sMetrics.value : [];
    const degraded = clusterRows.filter((c) => c.status !== "healthy");
    const highlights: string[] =
      clusterRows.length === 0
        ? ["No Kubernetes clusters registered."]
        : [
            `${clusterRows.length} cluster(s): ${clusterRows.filter((c) => c.status === "healthy").length} healthy, ${degraded.length} degraded.`,
            ...degraded
              .slice(0, 5)
              .map(
                (c) =>
                  `Degraded: ${c.name} (${c.provider}/${c.region}, v${c.version})`,
              ),
          ];

    return {
      type: "kubernetes-clusters",
      timeRange,
      summary: highlights.join(" "),
      data: { clusters: clusterRows, metrics: metricRows, highlights },
    };
  }

  private async kubernetesNamespacesContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [namespaces, nsMetrics] = await Promise.allSettled([
      this.pgQuery<{
        id: string;
        name: string;
        status: string;
        cluster_name: string;
        labels: Record<string, string>;
      }>(
        `SELECT kns.id, kns.name, kns.status, kc.name AS cluster_name, kns.labels
         FROM kubernetes_namespaces kns
         JOIN kubernetes_clusters kc ON kns.cluster_id = kc.id
         WHERE kc.organization_id = $1
         ORDER BY kns.name LIMIT 50`,
        [organizationId],
      ),
      this.chQuerySafe<KubernetesMetricRow>(
        `SELECT resource_type, resource_name, namespace, metric_name,
                round(avgMerge(avg_value), 2) AS avg_value,
                round(maxMerge(max_value), 2) AS max_value
         FROM {db}.kubernetes_metrics_1h
         WHERE hour >= {fromTime:DateTime} AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String} AND namespace != ''
         GROUP BY resource_type, resource_name, namespace, metric_name
         ORDER BY avg_value DESC LIMIT 50`,
        {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
        },
      ),
    ]);

    const nsRows = namespaces.status === "fulfilled" ? namespaces.value : [];
    const metricRows = nsMetrics.status === "fulfilled" ? nsMetrics.value : [];
    const activeNs = nsRows.filter((n) => n.status === "Active");
    const highlights: string[] = [
      `${nsRows.length} namespace(s) across clusters. ${activeNs.length} Active.`,
      ...metricRows
        .filter((m) => Number(m.avg_value) > 80)
        .slice(0, 5)
        .map(
          (m) =>
            `High ${m.metric_name} in namespace ${m.namespace}: avg=${m.avg_value}`,
        ),
    ];

    return {
      type: "kubernetes-namespaces",
      timeRange,
      summary: highlights.join(" "),
      data: { namespaces: nsRows, metrics: metricRows, highlights },
    };
  }

  private async kubernetesNodesContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [nodes, nodeMetrics] = await Promise.allSettled([
      this.pgQuery<K8sNodeRow>(
        `SELECT kn.name, kn.status, kn.roles, kn.cpu_capacity, kn.memory_capacity,
                kn.conditions, kc.name AS cluster_name
         FROM kubernetes_nodes kn
         JOIN kubernetes_clusters kc ON kn.cluster_id = kc.id
         WHERE kc.organization_id = $1
         ORDER BY kn.status DESC LIMIT 100`,
        [organizationId],
      ),
      this.chQuerySafe<KubernetesMetricRow>(
        `SELECT resource_type, resource_name, namespace, metric_name,
                round(avgMerge(avg_value), 2) AS avg_value,
                round(maxMerge(max_value), 2) AS max_value
         FROM {db}.kubernetes_metrics_1h
         WHERE hour >= {fromTime:DateTime} AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String} AND resource_type = 'node'
         GROUP BY resource_type, resource_name, namespace, metric_name
         ORDER BY avg_value DESC LIMIT 50`,
        {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
        },
      ),
    ]);

    const nodeRows = nodes.status === "fulfilled" ? nodes.value : [];
    const metricRows =
      nodeMetrics.status === "fulfilled" ? nodeMetrics.value : [];
    const notReady = nodeRows.filter((n) => n.status !== "Ready");
    const highlights: string[] = [
      `${nodeRows.length} node(s): ${nodeRows.length - notReady.length} Ready, ${notReady.length} NotReady.`,
      ...notReady
        .slice(0, 5)
        .map(
          (n) => `NotReady: ${n.name} on ${n.cluster_name} (roles: ${n.roles})`,
        ),
      ...metricRows
        .filter((m) => Number(m.avg_value) > 85)
        .slice(0, 3)
        .map(
          (m) =>
            `High ${m.metric_name} on node ${m.resource_name}: avg=${m.avg_value}`,
        ),
    ];

    return {
      type: "kubernetes-nodes",
      timeRange,
      summary: highlights.join(" "),
      data: { nodes: nodeRows, metrics: metricRows, highlights },
    };
  }

  private async kubernetesPodsContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [allPods, podMetrics] = await Promise.allSettled([
      this.pgQuery<K8sPodRow>(
        `SELECT kp.name, kp.phase, kp.restart_count,
                kns.name AS namespace_name, kc.name AS cluster_name
         FROM kubernetes_pods kp
         JOIN kubernetes_clusters kc ON kp.cluster_id = kc.id
         LEFT JOIN kubernetes_namespaces kns ON kp.namespace_id = kns.id
         WHERE kc.organization_id = $1
         ORDER BY kp.restart_count DESC, kp.phase LIMIT 100`,
        [organizationId],
      ),
      this.chQuerySafe<KubernetesMetricRow>(
        `SELECT resource_type, resource_name, namespace, metric_name,
                round(avgMerge(avg_value), 2) AS avg_value,
                round(maxMerge(max_value), 2) AS max_value
         FROM {db}.kubernetes_metrics_1h
         WHERE hour >= {fromTime:DateTime} AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String} AND resource_type = 'pod'
         GROUP BY resource_type, resource_name, namespace, metric_name
         ORDER BY avg_value DESC LIMIT 50`,
        {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
        },
      ),
    ]);

    const podRows = allPods.status === "fulfilled" ? allPods.value : [];
    const metricRows =
      podMetrics.status === "fulfilled" ? podMetrics.value : [];
    const failed = podRows.filter((p) => p.phase === "Failed");
    const crashing = podRows.filter((p) => p.restart_count > 5);
    const running = podRows.filter((p) => p.phase === "Running");
    const highlights: string[] = [
      `${podRows.length} pod(s): ${running.length} Running, ${failed.length} Failed, ${crashing.length} high-restart.`,
      ...failed
        .slice(0, 5)
        .map(
          (p) =>
            `Failed: ${p.name} in ${p.namespace_name ?? "?"} (${p.cluster_name})`,
        ),
      ...crashing
        .slice(0, 5)
        .map((p) => `CrashLoop: ${p.name} restarts=${p.restart_count}`),
    ];

    return {
      type: "kubernetes-pods",
      timeRange,
      summary: highlights.join(" "),
      data: { pods: podRows, metrics: metricRows, highlights },
    };
  }

  private async kubernetesDeploymentsContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [deployments, depMetrics] = await Promise.allSettled([
      this.pgQuery<K8sDeploymentRow>(
        `SELECT kd.name, kd.replicas, kd.ready_replicas, kd.unavailable_replicas,
                kns.name AS namespace_name, kc.name AS cluster_name
         FROM kubernetes_deployments kd
         JOIN kubernetes_clusters kc ON kd.cluster_id = kc.id
         LEFT JOIN kubernetes_namespaces kns ON kd.namespace_id = kns.id
         WHERE kc.organization_id = $1
         ORDER BY kd.unavailable_replicas DESC LIMIT 50`,
        [organizationId],
      ),
      this.chQuerySafe<KubernetesMetricRow>(
        `SELECT resource_type, resource_name, namespace, metric_name,
                round(avgMerge(avg_value), 2) AS avg_value,
                round(maxMerge(max_value), 2) AS max_value
         FROM {db}.kubernetes_metrics_1h
         WHERE hour >= {fromTime:DateTime} AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String} AND resource_type = 'deployment'
         GROUP BY resource_type, resource_name, namespace, metric_name
         ORDER BY avg_value DESC LIMIT 50`,
        {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
        },
      ),
    ]);

    const deployRows =
      deployments.status === "fulfilled" ? deployments.value : [];
    const metricRows =
      depMetrics.status === "fulfilled" ? depMetrics.value : [];
    const degraded = deployRows.filter(
      (d) => Number(d.unavailable_replicas) > 0,
    );
    const healthy = deployRows.length - degraded.length;
    const highlights: string[] = [
      `${deployRows.length} deployment(s): ${healthy} healthy, ${degraded.length} degraded.`,
      ...degraded
        .slice(0, 5)
        .map(
          (d) =>
            `Degraded: ${d.name} in ${d.namespace_name ?? "?"} — ${d.ready_replicas}/${d.replicas} ready`,
        ),
    ];

    return {
      type: "kubernetes-deployments",
      timeRange,
      summary: highlights.join(" "),
      data: { deployments: deployRows, metrics: metricRows, highlights },
    };
  }

  private async kubernetesPVContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const pvs = await this.pgQuery<K8sPVRow>(
      `SELECT kpv.name, kpv.phase, kpv.capacity, kpv.storage_class_name,
              kc.name AS cluster_name
       FROM kubernetes_persistent_volumes kpv
       JOIN kubernetes_clusters kc ON kpv.cluster_id = kc.id
       WHERE kc.organization_id = $1
       ORDER BY kpv.phase, kpv.name LIMIT 50`,
      [organizationId],
    ).catch(() => [] as K8sPVRow[]);

    const unbound = pvs.filter((pv) => pv.phase !== "Bound");
    const highlights: string[] = [
      `${pvs.length} Persistent Volume(s): ${pvs.length - unbound.length} Bound, ${unbound.length} unbound.`,
      ...unbound
        .slice(0, 5)
        .map(
          (pv) =>
            `Unbound PV: ${pv.name} (${pv.phase}) on ${pv.cluster_name} [${pv.storage_class_name}]`,
        ),
    ];

    return {
      type: "kubernetes-pv",
      timeRange,
      summary: highlights.join(" "),
      data: { persistentVolumes: pvs, highlights },
    };
  }

  // ── K8s API Server ──────────────────────────────────────────────────────────

  private async kubernetesApiServerContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [clusters, apiMetrics] = await Promise.allSettled([
      this.pgQuery<{ id: string; name: string; status: string; version: string }>(
        `SELECT id, name, status, version
         FROM kubernetes_clusters
         WHERE organization_id = $1 AND deleted_at IS NULL
         ORDER BY name LIMIT 10`,
        [organizationId],
      ),
      this.chQuerySafe<KubernetesMetricRow>(
        `SELECT
           resource_type, resource_name, namespace, metric_name,
           round(avgMerge(avg_value), 4) AS avg_value,
           round(maxMerge(max_value), 4) AS max_value
         FROM {db}.kubernetes_metrics_1h
         WHERE hour >= {fromTime:DateTime}
           AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String}
           AND (
             metric_name LIKE 'apiserver%'
             OR metric_name LIKE 'etcd%'
             OR resource_type = 'apiserver'
           )
         GROUP BY resource_type, resource_name, namespace, metric_name
         ORDER BY avg_value DESC
         LIMIT 50`,
        {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
        },
      ),
    ]);

    const clusterRows = clusters.status === "fulfilled" ? clusters.value : [];
    const metricRows = apiMetrics.status === "fulfilled" ? apiMetrics.value : [];

    const highlights: string[] = [];
    if (clusterRows.length > 0) {
      highlights.push(`${clusterRows.length} cluster(s) registered. API server health tracked per cluster.`);
    }

    const latencyMetrics = metricRows.filter(
      (m) => m.metric_name.includes("latency") || m.metric_name.includes("duration"),
    );
    const errorMetrics = metricRows.filter(
      (m) => m.metric_name.includes("error") || m.metric_name.includes("failed"),
    );

    if (latencyMetrics.length > 0) {
      const maxLatency = Math.max(...latencyMetrics.map((m) => Number(m.max_value)));
      highlights.push(`API server max request latency: ${maxLatency.toFixed(3)}s`);
    }
    if (errorMetrics.length > 0) {
      highlights.push(`${errorMetrics.length} API server error metric(s) detected.`);
    }
    if (metricRows.length === 0) {
      highlights.push("No API server metrics found for the selected time range.");
    }

    return {
      type: "kubernetes-api-server",
      timeRange,
      summary: highlights.join(" "),
      data: { clusters: clusterRows, apiServerMetrics: metricRows, highlights },
    };
  }

  // ── K8s CoreDNS ─────────────────────────────────────────────────────────────

  private async kubernetesCoreDNSContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [clusters, dnsMetrics] = await Promise.allSettled([
      this.pgQuery<{ id: string; name: string; status: string }>(
        `SELECT id, name, status
         FROM kubernetes_clusters
         WHERE organization_id = $1 AND deleted_at IS NULL
         ORDER BY name LIMIT 10`,
        [organizationId],
      ),
      this.chQuerySafe<KubernetesMetricRow>(
        `SELECT
           resource_type, resource_name, namespace, metric_name,
           round(avgMerge(avg_value), 4) AS avg_value,
           round(maxMerge(max_value), 4) AS max_value
         FROM {db}.kubernetes_metrics_1h
         WHERE hour >= {fromTime:DateTime}
           AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String}
           AND (
             metric_name LIKE 'coredns%'
             OR resource_type = 'coredns'
             OR (namespace = 'kube-system' AND resource_name LIKE 'coredns%')
           )
         GROUP BY resource_type, resource_name, namespace, metric_name
         ORDER BY avg_value DESC
         LIMIT 50`,
        {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
        },
      ),
    ]);

    const clusterRows = clusters.status === "fulfilled" ? clusters.value : [];
    const metricRows = dnsMetrics.status === "fulfilled" ? dnsMetrics.value : [];

    const highlights: string[] = [];
    if (clusterRows.length > 0) {
      highlights.push(`CoreDNS monitoring across ${clusterRows.length} cluster(s).`);
    }

    const errorMetrics = metricRows.filter(
      (m) => m.metric_name.includes("error") || m.metric_name.includes("failed"),
    );
    const latencyMetrics = metricRows.filter(
      (m) => m.metric_name.includes("duration") || m.metric_name.includes("latency"),
    );
    const cacheMetrics = metricRows.filter(
      (m) => m.metric_name.includes("cache"),
    );

    if (latencyMetrics.length > 0) {
      const maxLatency = Math.max(...latencyMetrics.map((m) => Number(m.max_value)));
      highlights.push(`CoreDNS max request duration: ${maxLatency.toFixed(3)}s`);
    }
    if (errorMetrics.length > 0) {
      highlights.push(`${errorMetrics.length} DNS error metric(s) observed.`);
    }
    if (cacheMetrics.length > 0) {
      highlights.push(`${cacheMetrics.length} CoreDNS cache metric(s) available.`);
    }
    if (metricRows.length === 0) {
      highlights.push("No CoreDNS metrics found. Ensure CoreDNS metrics are enabled in your cluster.");
    }

    return {
      type: "kubernetes-coredns",
      timeRange,
      summary: highlights.join(" "),
      data: { clusters: clusterRows, coreDNSMetrics: metricRows, highlights },
    };
  }

  // ── Agents ───────────────────────────────────────────────────────────────────

  private async agentsContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [agents, vmMetrics] = await Promise.allSettled([
      this.pgQuery<{
        id: string;
        name: string;
        type: string;
        host: string;
        status: string;
        version: string;
        last_heartbeat: string | null;
      }>(
        `SELECT id, name, type, host, status, version, last_heartbeat
         FROM agents
         WHERE organization_id = $1 AND deleted_at IS NULL
         ORDER BY last_heartbeat DESC NULLS LAST
         LIMIT 50`,
        [organizationId],
      ),
      this.chQuerySafe<VmMetricRow>(
        `SELECT
           vm_id, metric_name,
           round(avgMerge(avg_value), 2) AS avg_value,
           round(maxMerge(max_value), 2) AS max_value
         FROM {db}.vm_metrics_1h
         WHERE hour >= {fromTime:DateTime}
           AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String}
         GROUP BY vm_id, metric_name
         ORDER BY avg_value DESC
         LIMIT 100`,
        {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
        },
      ),
    ]);

    const agentRows = agents.status === "fulfilled" ? agents.value : [];
    const vmRows = vmMetrics.status === "fulfilled" ? vmMetrics.value : [];

    const highlights: string[] = [];
    if (agentRows.length === 0) {
      highlights.push("No monitoring agents registered.");
    } else {
      const healthy = agentRows.filter((a) => a.status === "healthy").length;
      const offline = agentRows.filter((a) => a.status === "offline");
      highlights.push(`${agentRows.length} agent(s): ${healthy} healthy.`);
      if (offline.length > 0) {
        highlights.push(
          `Offline: ${offline.map((a) => `${a.name}(${a.host})`).join(", ")}.`,
        );
      }
    }
    if (vmRows.length > 0) {
      const highCpu = vmRows.filter(
        (m) =>
          m.metric_name.toLowerCase().includes("cpu") &&
          Number(m.avg_value) > 80,
      );
      if (highCpu.length > 0) {
        highlights.push(
          `High CPU VMs: ${highCpu
            .map((m) => `${m.vm_id}(${m.avg_value}%)`)
            .slice(0, 3)
            .join(", ")}.`,
        );
      }
    }

    return {
      type: "agents",
      timeRange,
      summary: highlights.join(" "),
      data: { agents: agentRows, vmMetrics: vmRows, highlights },
    };
  }

  // ── Service Map ──────────────────────────────────────────────────────────────

  private async serviceMapContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [services, dependencies, svcMetrics] = await Promise.allSettled([
      this.pgQuery<{
        id: string;
        name: string;
        type: string;
        status: string;
        environment: string | null;
      }>(
        `SELECT id, name, type, status, environment
         FROM service_map_services
         WHERE organization_id = $1 AND deleted_at IS NULL
         LIMIT 100`,
        [organizationId],
      ),
      this.pgQuery<{
        id: string;
        source_service_id: string;
        target_service_id: string;
        type: string;
        status: string;
        protocol: string | null;
        latency_ms: number | null;
        error_rate: number | null;
      }>(
        `SELECT id, source_service_id, target_service_id, type, status,
                protocol, latency_ms, error_rate
         FROM service_map_dependencies
         WHERE organization_id = $1 AND deleted_at IS NULL
         LIMIT 200`,
        [organizationId],
      ),
      this.chQuerySafe<ServiceMapMetricRow>(
        `SELECT
           service_id, service_name,
           avg(avg_health_score)  AS avg_health_score,
           avg(avg_latency)       AS avg_latency,
           avg(avg_error_rate)    AS avg_error_rate,
           avg(avg_request_rate)  AS avg_request_rate
         FROM {db}.service_map_metrics_1h
         WHERE hour >= {fromTime:DateTime}
           AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String}
         GROUP BY service_id, service_name
         ORDER BY avg_error_rate DESC
         LIMIT 50`,
        {
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
          orgId: organizationId,
        },
      ),
    ]);

    const svcRows = services.status === "fulfilled" ? services.value : [];
    const depRows =
      dependencies.status === "fulfilled" ? dependencies.value : [];
    const metricRows =
      svcMetrics.status === "fulfilled" ? svcMetrics.value : [];

    const highlights: string[] = [];
    if (svcRows.length === 0) {
      highlights.push("No service map data available.");
    } else {
      const unhealthy = svcRows.filter(
        (s) => s.status !== "healthy" && s.status !== "active",
      );
      highlights.push(
        `${svcRows.length} service(s), ${depRows.length} dependency/ies.`,
      );
      if (unhealthy.length > 0) {
        highlights.push(
          `Unhealthy: ${unhealthy.map((s) => s.name).join(", ")}.`,
        );
      }
    }
    if (metricRows.length > 0) {
      const highError = metricRows.filter((m) => Number(m.avg_error_rate) > 5);
      if (highError.length > 0) {
        highlights.push(
          `High error rate services: ${highError.map((m) => `${m.service_name}(${Number(m.avg_error_rate).toFixed(1)}%)`).join(", ")}.`,
        );
      }
    }

    return {
      type: "service-map",
      timeRange,
      summary: highlights.join(" "),
      data: {
        services: svcRows,
        dependencies: depRows,
        metrics: metricRows,
        highlights,
      },
    };
  }

  // ── Network Map ──────────────────────────────────────────────────────────────

  private async networkMapContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [nodes, connections, trafficMetrics, connectionMetrics] =
      await Promise.allSettled([
        this.pgQuery<{
          id: string;
          name: string;
          type: string;
          status: string;
          ip_address: string | null;
          region: string | null;
        }>(
          `SELECT id, name, type, status, ip_address, region
         FROM network_map_nodes
         WHERE organization_id = $1 AND deleted_at IS NULL
         LIMIT 100`,
          [organizationId],
        ),
        this.pgQuery<{
          id: string;
          source_node_id: string;
          target_node_id: string;
          type: string;
          status: string;
          protocol: string | null;
          latency: number | null;
        }>(
          `SELECT id, source_node_id, target_node_id, type, status, protocol, latency
         FROM network_map_connections
         WHERE organization_id = $1 AND deleted_at IS NULL
         LIMIT 200`,
          [organizationId],
        ),
        this.chQuerySafe<NetworkTrafficRow>(
          `SELECT
           node_id, node_name,
           avg(avg_cpu_usage)         AS avg_cpu_usage,
           avg(avg_memory_usage)      AS avg_memory_usage,
           avg(avg_network_in)        AS avg_network_in,
           avg(avg_network_out)       AS avg_network_out,
           avg(avg_error_rate)        AS avg_error_rate
         FROM {db}.network_map_traffic_1h
         WHERE hour >= {fromTime:DateTime}
           AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String}
         GROUP BY node_id, node_name
         ORDER BY avg_error_rate DESC
         LIMIT 50`,
          {
            fromTime: fmtCH(timeRange.from),
            toTime: fmtCH(timeRange.to),
            orgId: organizationId,
          },
        ),
        this.chQuerySafe<NetworkConnectionMetricRow>(
          `SELECT
           connection_id,
           avg(avg_bandwidth)    AS avg_bandwidth,
           avg(avg_latency)      AS avg_latency,
           avg(avg_packet_loss)  AS avg_packet_loss,
           sum(total_bytes_sent) AS total_bytes_sent,
           sum(total_bytes_received) AS total_bytes_received
         FROM {db}.network_map_connection_metrics_1h
         WHERE hour >= {fromTime:DateTime}
           AND hour <= {toTime:DateTime}
           AND organization_id = {orgId:String}
         GROUP BY connection_id
         ORDER BY avg_packet_loss DESC
         LIMIT 50`,
          {
            fromTime: fmtCH(timeRange.from),
            toTime: fmtCH(timeRange.to),
            orgId: organizationId,
          },
        ),
      ]);

    const nodeRows = nodes.status === "fulfilled" ? nodes.value : [];
    const connRows =
      connections.status === "fulfilled" ? connections.value : [];
    const trafficRows =
      trafficMetrics.status === "fulfilled" ? trafficMetrics.value : [];
    const connMetricRows =
      connectionMetrics.status === "fulfilled" ? connectionMetrics.value : [];

    const highlights: string[] = [];
    if (nodeRows.length === 0) {
      highlights.push("No network topology data available.");
    } else {
      highlights.push(
        `${nodeRows.length} node(s), ${connRows.length} connection(s).`,
      );
      const byType: Record<string, number> = {};
      for (const n of nodeRows) byType[n.type] = (byType[n.type] ?? 0) + 1;
      highlights.push(
        `Types: ${Object.entries(byType)
          .map(([t, c]) => `${t}(${c})`)
          .join(", ")}.`,
      );
    }
    if (connMetricRows.length > 0) {
      const highLoss = connMetricRows.filter(
        (c) => Number(c.avg_packet_loss) > 1,
      );
      if (highLoss.length > 0) {
        highlights.push(
          `${highLoss.length} connection(s) with >1% packet loss.`,
        );
      }
    }

    return {
      type: "network-map",
      timeRange,
      summary: highlights.join(" "),
      data: {
        nodes: nodeRows,
        connections: connRows,
        traffic: trafficRows,
        connectionMetrics: connMetricRows,
        highlights,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PostgreSQL — non-timescale contexts
  // All queries filtered by organization_id for knowledge-base isolation
  // ══════════════════════════════════════════════════════════════════════════

  // ── Alerts ───────────────────────────────────────────────────────────────────

  private async alertsContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    const [rules, instances] = await Promise.all([
      this.pgQuery<{
        id: string;
        name: string;
        severity: string;
        state: string;
        enabled: boolean;
        last_triggered_at: string | null;
      }>(
        `SELECT id, name, severity, state, enabled, last_triggered_at
         FROM alert_rules
         WHERE organization_id = $1 AND deleted_at IS NULL
         ORDER BY last_triggered_at DESC NULLS LAST
         LIMIT 50`,
        [organizationId],
      ),
      this.pgQuery<{
        title: string;
        severity: string;
        status: string;
        starts_at: string;
        service_name: string | null;
      }>(
        `SELECT title, severity, status, starts_at, labels->>'service' AS service_name
         FROM alert_instances
         WHERE organization_id = $1
           AND starts_at >= $2
           AND starts_at <= $3
         ORDER BY starts_at DESC
         LIMIT 100`,
        [
          organizationId,
          timeRange.from.toISOString(),
          timeRange.to.toISOString(),
        ],
      ),
    ]);

    const firing = instances.filter((i) => i.status === "firing");
    const resolved = instances.filter((i) => i.status === "resolved");
    const criticals = firing.filter((i) => i.severity === "critical");
    const highlights: string[] = [];

    if (rules.length === 0 && instances.length === 0) {
      highlights.push("No alert rules or instances found.");
    } else {
      highlights.push(`${rules.length} rule(s) configured.`);
      if (firing.length > 0) {
        highlights.push(
          `${firing.length} firing (${criticals.length} critical).`,
        );
      }
      if (resolved.length > 0)
        highlights.push(`${resolved.length} resolved in window.`);
      const topFiring = firing
        .slice(0, 5)
        .map((i) => `${i.title}[${i.severity}]`)
        .join(", ");
      if (topFiring) highlights.push(`Active: ${topFiring}.`);
    }
    return {
      type: "alerts",
      timeRange,
      summary: highlights.join(" "),
      data: {
        rules,
        firingInstances: firing,
        resolvedInstances: resolved,
        highlights,
      },
    };
  }

  // ── IAM ──────────────────────────────────────────────────────────────────────

  private async iamContext(organizationId: string): Promise<TelemetryContext> {
    const timeRange = this.defaultRange();
    const [users, roles] = await Promise.all([
      this.pgQuery<{
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        is_active: boolean;
        last_login_at: string | null;
      }>(
        `SELECT id, email, first_name, last_name, is_active, last_login_at
         FROM users
         WHERE organization_id = $1 AND deleted_at IS NULL
         ORDER BY last_login_at DESC NULLS LAST
         LIMIT 50`,
        [organizationId],
      ),
      this.pgQuery<{ id: string; name: string; description: string | null }>(
        `SELECT id, name, description
         FROM roles
         WHERE organization_id = $1 AND deleted_at IS NULL
         ORDER BY name`,
        [organizationId],
      ),
    ]);

    const active = users.filter((u) => u.is_active).length;
    const neverLoggedIn = users.filter((u) => !u.last_login_at).length;
    const highlights: string[] = [];

    if (users.length === 0) {
      highlights.push("No users found for this organization.");
    } else {
      highlights.push(`${users.length} user(s) — ${active} active.`);
      if (neverLoggedIn > 0)
        highlights.push(`${neverLoggedIn} user(s) have never logged in.`);
      highlights.push(
        `${roles.length} role(s): ${roles.map((r) => r.name).join(", ")}.`,
      );
    }
    return {
      type: "iam",
      timeRange,
      summary: highlights.join(" "),
      data: { users, roles, highlights },
    };
  }

  // ── Tenancy ──────────────────────────────────────────────────────────────────

  private async tenancyContext(
    organizationId: string,
  ): Promise<TelemetryContext> {
    const timeRange = this.defaultRange();
    const [orgs, workspaces] = await Promise.all([
      this.pgQuery<{
        id: string;
        name: string;
        plan: string;
        region: string;
        status: string;
      }>(
        `SELECT id, name, plan, region, status FROM organizations WHERE id = $1 AND deleted_at IS NULL`,
        [organizationId],
      ),
      this.pgQuery<{
        id: string;
        name: string;
        status: string;
        created_at: string;
      }>(
        `SELECT id, name, status, created_at
         FROM workspaces
         WHERE organization_id = $1 AND deleted_at IS NULL
         ORDER BY created_at LIMIT 20`,
        [organizationId],
      ),
    ]);

    const highlights: string[] = [];
    if (orgs.length === 0) {
      highlights.push("Organization not found.");
    } else {
      const org = orgs[0];
      highlights.push(
        `Organization: ${org.name} — plan: ${org.plan}, region: ${org.region}, status: ${org.status}.`,
      );
      highlights.push(`${workspaces.length} workspace(s) configured.`);
    }
    return {
      type: "tenancy",
      timeRange,
      summary: highlights.join(" "),
      data: { organization: orgs[0] ?? null, workspaces, highlights },
    };
  }

  // ── Retention ────────────────────────────────────────────────────────────────

  private async retentionContext(
    organizationId: string,
  ): Promise<TelemetryContext> {
    const timeRange = this.defaultRange();
    const policies = await this.pgQuery<{
      id: string;
      name: string;
      data_type: string;
      retention_days: number;
      archive_enabled: boolean;
      is_default: boolean;
      is_active: boolean;
    }>(
      `SELECT id, name, data_type, retention_days, archive_enabled, is_default, is_active
       FROM retention_policies
       WHERE organization_id = $1
       ORDER BY data_type`,
      [organizationId],
    );

    const highlights: string[] = [];
    if (policies.length === 0) {
      highlights.push(
        "No retention policies configured (using system defaults).",
      );
    } else {
      highlights.push(`${policies.length} retention policy/ies.`);
      const shortest = policies.reduce((a, b) =>
        Number(a.retention_days) < Number(b.retention_days) ? a : b,
      );
      const longest = policies.reduce((a, b) =>
        Number(a.retention_days) > Number(b.retention_days) ? a : b,
      );
      highlights.push(
        `Range: ${shortest.retention_days}d (${shortest.data_type}) to ${longest.retention_days}d (${longest.data_type}).`,
      );
      const archived = policies.filter((p) => p.archive_enabled).length;
      if (archived > 0)
        highlights.push(`${archived} policy/ies have archiving enabled.`);
    }
    return {
      type: "retention",
      timeRange,
      summary: highlights.join(" "),
      data: { policies, highlights },
    };
  }

  // ── Subscription ─────────────────────────────────────────────────────────────

  private async subscriptionContext(
    organizationId: string,
  ): Promise<TelemetryContext> {
    const timeRange = this.defaultRange();
    const plans = await this.pgQuery<{
      id: string;
      name: string;
      type: string;
      is_active: boolean;
      trial_days: number;
      features: unknown[];
    }>(
      `SELECT p.id, p.name, p.type, p.is_active, p.trial_days, p.features
       FROM plans p
       INNER JOIN organizations o ON o.plan = p.type
       WHERE o.id = $1 AND p.is_active = true
       LIMIT 5`,
      [organizationId],
    );

    const highlights: string[] = [];
    if (plans.length === 0) {
      highlights.push("No subscription plan information available.");
    } else {
      const plan = plans[0];
      highlights.push(`Current plan: ${plan.name} (${plan.type}).`);
      if (plan.trial_days > 0)
        highlights.push(`Trial period: ${plan.trial_days} days.`);
      if (Array.isArray(plan.features)) {
        highlights.push(`${plan.features.length} feature(s) included.`);
      }
    }
    return {
      type: "subscription",
      timeRange,
      summary: highlights.join(" "),
      data: { plan: plans[0] ?? null, highlights },
    };
  }

  // ── API Keys ─────────────────────────────────────────────────────────────────

  private async apiKeysContext(
    organizationId: string,
  ): Promise<TelemetryContext> {
    const timeRange = this.defaultRange();
    const keys = await this.pgQuery<{
      id: string;
      name: string;
      key_hint: string;
      is_active: boolean;
      expires_at: string | null;
      last_used_at: string | null;
      usage_count: number;
    }>(
      `SELECT id, name, key_hint, is_active, expires_at, last_used_at, usage_count
       FROM api_keys
       WHERE organization_id = $1 AND deleted_at IS NULL
       ORDER BY last_used_at DESC NULLS LAST
       LIMIT 50`,
      [organizationId],
    );

    const now = new Date();
    const active = keys.filter((k) => k.is_active).length;
    const expired = keys.filter(
      (k) => k.expires_at && new Date(k.expires_at) < now,
    );
    const neverUsed = keys.filter((k) => !k.last_used_at);
    const highlights: string[] = [];

    if (keys.length === 0) {
      highlights.push("No API keys created.");
    } else {
      highlights.push(`${keys.length} API key(s) — ${active} active.`);
      if (expired.length > 0)
        highlights.push(`${expired.length} expired key(s) to revoke.`);
      if (neverUsed.length > 0)
        highlights.push(`${neverUsed.length} key(s) never used.`);
    }
    return {
      type: "api-keys",
      timeRange,
      summary: highlights.join(" "),
      data: { keys, highlights },
    };
  }

  // ── Notifications ────────────────────────────────────────────────────────────

  private async notificationsContext(
    organizationId: string,
  ): Promise<TelemetryContext> {
    const timeRange = this.defaultRange();
    const channels = await this.pgQuery<{
      id: string;
      name: string;
      type: string;
      enabled: boolean;
      verified: boolean;
      last_tested_at: string | null;
    }>(
      `SELECT id, name, type, enabled, verified, last_tested_at
       FROM notification_channels
       WHERE organization_id = $1 AND deleted_at IS NULL
       ORDER BY type, name`,
      [organizationId],
    );

    const enabled = channels.filter((c) => c.enabled).length;
    const unverified = channels.filter((c) => !c.verified);
    const highlights: string[] = [];

    if (channels.length === 0) {
      highlights.push("No notification channels configured.");
    } else {
      highlights.push(`${channels.length} channel(s) — ${enabled} enabled.`);
      if (unverified.length > 0) {
        highlights.push(
          `Unverified: ${unverified.map((c) => `${c.name}(${c.type})`).join(", ")}.`,
        );
      }
      const byType: Record<string, number> = {};
      for (const c of channels) byType[c.type] = (byType[c.type] ?? 0) + 1;
      highlights.push(
        `Types: ${Object.entries(byType)
          .map(([t, n]) => `${t}(${n})`)
          .join(", ")}.`,
      );
    }
    return {
      type: "notifications",
      timeRange,
      summary: highlights.join(" "),
      data: { channels, highlights },
    };
  }

  // ── Reports ──────────────────────────────────────────────────────────────────

  private async reportsContext(
    organizationId: string,
  ): Promise<TelemetryContext> {
    const timeRange = this.defaultRange();
    const [definitions, executions] = await Promise.all([
      this.pgQuery<{
        id: string;
        name: string;
        type: string;
        schedule: string;
        enabled: boolean;
        created_at: string;
      }>(
        `SELECT id, name, type, schedule, enabled, created_at
         FROM report_definitions
         WHERE organization_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [organizationId],
      ),
      this.pgQuery<{
        report_definition_id: string;
        status: string;
        started_at: string;
        completed_at: string | null;
      }>(
        `SELECT report_definition_id, status, started_at, completed_at
         FROM report_executions
         WHERE organization_id = $1
           AND started_at >= $2
         ORDER BY started_at DESC
         LIMIT 50`,
        [
          organizationId,
          new Date(Date.now() - 7 * 24 * 3600_000).toISOString(),
        ],
      ),
    ]);

    const scheduled = definitions.filter(
      (r) => r.schedule && r.schedule !== "manual",
    ).length;
    const failed = executions.filter((e) => e.status === "failed").length;
    const highlights: string[] = [];

    if (definitions.length === 0) {
      highlights.push("No reports defined.");
    } else {
      highlights.push(
        `${definitions.length} report definition(s) — ${scheduled} scheduled.`,
      );
      if (executions.length > 0) {
        highlights.push(
          `${executions.length} execution(s) in the last 7 days.`,
        );
        if (failed > 0) highlights.push(`${failed} failed execution(s).`);
      }
    }
    return {
      type: "reports",
      timeRange,
      summary: highlights.join(" "),
      data: { definitions, executions, highlights },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** Safe PostgreSQL raw query — returns [] on error or no DataSource */
  private async pgQuery<T>(sql: string, params: unknown[]): Promise<T[]> {
    if (!this.dataSource) return [];
    try {
      return await this.dataSource.query(sql, params);
    } catch (err) {
      this.logger.warn(`PG query failed: ${err}`);
      return [];
    }
  }

  /**
   * Safe ClickHouse query using template `{db}` placeholder for the database name.
   * Returns [] on error or no ClickHouseService.
   */
  private async chQuerySafe<T>(
    queryTemplate: string,
    queryParams: Record<string, unknown>,
  ): Promise<T[]> {
    if (!this.clickhouse) return [];
    const db = this.clickhouse.getDatabase();
    const client = this.clickhouse.getClient();
    try {
      const result = await client.query({
        query: queryTemplate.replaceAll("{db}", db),
        query_params: queryParams,
        format: "JSONEachRow",
      });
      return await result.json<T>();
    } catch (err) {
      this.logger.warn(`CH query failed: ${err}`);
      return [];
    }
  }

  private defaultRange(): { from: Date; to: Date } {
    const now = new Date();
    return { from: new Date(now.getTime() - 60 * 60 * 1000), to: now };
  }

  // ── Data Masking ─────────────────────────────────────────────────────────────

  private async dataMaskingContext(
    organizationId: string,
  ): Promise<TelemetryContext> {
    const policies = await this.pgQuery<{
      id: string;
      name: string;
      is_enabled: boolean;
      rules: unknown[];
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, name, is_enabled, rules, created_at, updated_at
       FROM data_masking_policies
       WHERE organization_id = $1 AND deleted_at IS NULL
       ORDER BY name`,
      [organizationId],
    ).catch(() => [] as { id: string; name: string; is_enabled: boolean; rules: unknown[]; created_at: string; updated_at: string }[]);

    const now = new Date();
    const timeRange = { from: new Date(now.getTime() - 24 * 60 * 60 * 1000), to: now };

    const enabled = policies.filter((p) => p.is_enabled);
    const disabled = policies.filter((p) => !p.is_enabled);
    const totalRules = policies.reduce(
      (sum, p) => sum + (Array.isArray(p.rules) ? p.rules.length : 0),
      0,
    );

    const highlights: string[] = [
      `${policies.length} PII masking policy(ies): ${enabled.length} active, ${disabled.length} disabled.`,
      `Total masking rules: ${totalRules}.`,
    ];
    if (disabled.length > 0) {
      highlights.push(`Disabled policies: ${disabled.map((p) => p.name).join(", ")}.`);
    }
    if (policies.length === 0) {
      highlights.push("No data masking policies configured — sensitive fields may be exposed in telemetry data.");
    }

    return {
      type: "data-masking",
      timeRange,
      summary: highlights.join(" "),
      data: { policies, highlights },
    };
  }

  // ── AI Assistant (LLM Providers) ─────────────────────────────────────────────

  private async aiAssistantContext(
    organizationId: string,
  ): Promise<TelemetryContext> {
    const providers = await this.pgQuery<{
      id: string;
      name: string;
      provider_type: string;
      model_id: string;
      api_key_hint: string;
      is_default: boolean;
      is_active: boolean;
      usage_count: number;
      last_used_at: string | null;
      created_at: string;
    }>(
      `SELECT id, name, provider_type, model_id, api_key_hint,
              is_default, is_active, usage_count, last_used_at, created_at
       FROM llm_providers
       WHERE organization_id = $1
       ORDER BY is_default DESC, is_active DESC, name`,
      [organizationId],
    ).catch(() => [] as { id: string; name: string; provider_type: string; model_id: string; api_key_hint: string; is_default: boolean; is_active: boolean; usage_count: number; last_used_at: string | null; created_at: string }[]);

    const now = new Date();
    const timeRange = { from: new Date(now.getTime() - 24 * 60 * 60 * 1000), to: now };

    const active = providers.filter((p) => p.is_active);
    const defaultProvider = providers.find((p) => p.is_default);
    const totalUsage = providers.reduce((sum, p) => sum + Number(p.usage_count), 0);

    const highlights: string[] = [
      `${providers.length} LLM provider(s) configured: ${active.length} active.`,
    ];
    if (defaultProvider) {
      highlights.push(`Default model: ${defaultProvider.name} (${defaultProvider.model_id}).`);
    } else {
      highlights.push("No default provider set — chat will fail until one is configured.");
    }
    if (totalUsage > 0) {
      highlights.push(`Total requests processed: ${totalUsage.toLocaleString()}.`);
    }
    if (active.length === 0) {
      highlights.push("WARNING: No active LLM providers — AI assistant is non-functional.");
    }

    return {
      type: "ai-assistant",
      timeRange,
      summary: highlights.join(" "),
      data: { providers, highlights },
    };
  }

  // ── System Setup ─────────────────────────────────────────────────────────────

  private async systemSetupContext(
    organizationId: string,
  ): Promise<TelemetryContext> {
    const [channels, apiKeys, ssoProviders] = await Promise.allSettled([
      this.pgQuery<{ id: string; type: string; enabled: boolean; verified: boolean }>(
        `SELECT id, type, enabled, verified
         FROM notification_channels
         WHERE organization_id = $1 AND deleted_at IS NULL`,
        [organizationId],
      ),
      this.pgQuery<{ id: string; name: string; is_active: boolean; last_used_at: string | null }>(
        `SELECT id, name, is_active, last_used_at
         FROM api_keys
         WHERE organization_id = $1 AND deleted_at IS NULL`,
        [organizationId],
      ),
      this.pgQuery<{ id: string; provider_type: string; is_enabled: boolean }>(
        `SELECT id, provider_type, is_enabled
         FROM sso_providers
         WHERE organization_id = $1 AND deleted_at IS NULL`,
        [organizationId],
      ).catch(() => [] as { id: string; provider_type: string; is_enabled: boolean }[]),
    ]);

    const now = new Date();
    const timeRange = { from: new Date(now.getTime() - 24 * 60 * 60 * 1000), to: now };

    const channelRows = channels.status === "fulfilled" ? channels.value : [];
    const apiKeyRows = apiKeys.status === "fulfilled" ? apiKeys.value : [];
    const ssoRows = ssoProviders.status === "fulfilled" ? ssoProviders.value : [];

    const activeChannels = channelRows.filter((c) => c.enabled && c.verified);
    const activeKeys = apiKeyRows.filter((k) => k.is_active);
    const activeSso = ssoRows.filter((s) => s.is_enabled);

    const highlights: string[] = [
      `Notification channels: ${channelRows.length} total, ${activeChannels.length} active & verified.`,
      `API keys: ${apiKeyRows.length} total, ${activeKeys.length} active.`,
    ];
    if (ssoRows.length > 0) {
      highlights.push(`SSO providers: ${activeSso.length}/${ssoRows.length} enabled.`);
    }
    if (channelRows.length === 0) {
      highlights.push("No notification channels configured.");
    }

    return {
      type: "system-setup",
      timeRange,
      summary: highlights.join(" "),
      data: {
        notificationChannels: channelRows,
        apiKeys: apiKeyRows,
        ssoProviders: ssoRows,
        highlights,
      },
    };
  }

  // ── Account Contexts (user-scoped) ───────────────────────────────────────────

  private async accountContext(
    userId: string,
    organizationId: string,
    contextType: ContextType,
  ): Promise<TelemetryContext> {
    const now = new Date();
    const timeRange = { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now };

    const [userRow, sessionRows] = await Promise.allSettled([
      this.pgQuery<{
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        is_mfa_enabled: boolean;
        last_login_at: string | null;
        status: string;
        created_at: string;
      }>(
        `SELECT u.id, u.email, u.first_name, u.last_name,
                u.is_mfa_enabled, u.last_login_at, u.status, u.created_at
         FROM users u
         WHERE u.id = $1 AND u.organization_id = $2`,
        [userId, organizationId],
      ),
      this.pgQuery<{
        id: string;
        ip_address: string;
        user_agent: string;
        created_at: string;
        last_active_at: string;
      }>(
        `SELECT id, ip_address, user_agent, created_at, last_active_at
         FROM user_sessions
         WHERE user_id = $1 AND expires_at > NOW()
         ORDER BY last_active_at DESC
         LIMIT 20`,
        [userId],
      ).catch(() => [] as { id: string; ip_address: string; user_agent: string; created_at: string; last_active_at: string }[]),
    ]);

    const user = userRow.status === "fulfilled" ? userRow.value[0] : null;
    const sessions = sessionRows.status === "fulfilled" ? sessionRows.value : [];

    const highlights: string[] = [];

    if (user) {
      highlights.push(`User: ${user.email} (${user.status}).`);
      highlights.push(`MFA: ${user.is_mfa_enabled ? "enabled" : "DISABLED — security risk"}.`);
      if (user.last_login_at) {
        highlights.push(`Last login: ${new Date(user.last_login_at).toISOString()}.`);
      }
    }

    if (contextType === "account-sessions") {
      highlights.push(`Active sessions: ${sessions.length}.`);
      if (sessions.length > 5) {
        highlights.push(`High number of concurrent sessions (${sessions.length}) — review for unauthorized access.`);
      }
    }

    return {
      type: contextType,
      timeRange,
      summary: highlights.join(" ") || `Account context for user ${userId}.`,
      data: {
        user,
        activeSessions: contextType === "account-sessions" ? sessions : undefined,
        highlights,
      },
    };
  }

  // ── Anomaly Detection ──────────────────────────────────────────────────────

  private async anomalyDetectionContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable("anomaly-detection", timeRange, "ClickHouse not connected");
    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    try {
      const result = await client.query({
        query: `
          SELECT
            detection_rule_id,
            metric_name,
            signal_type,
            severity,
            round(anomaly_score, 4)      AS anomaly_score,
            round(z_score, 4)            AS z_score,
            round(sigma_level, 4)        AS sigma_level,
            round(observed_value, 4)     AS observed_value,
            round(expected_value, 4)     AS expected_value,
            toString(timestamp)          AS timestamp
          FROM ${db}.anomaly_events
          WHERE organization_id = {orgId:String}
            AND timestamp >= {fromTime:DateTime}
            AND timestamp <= {toTime:DateTime}
          ORDER BY anomaly_score DESC
          LIMIT 50
        `,
        query_params: {
          orgId: organizationId,
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
        },
        format: "JSONEachRow",
      });

      const rows = await result.json<{
        detection_rule_id: string;
        metric_name: string;
        signal_type: string;
        severity: string;
        anomaly_score: number;
        z_score: number;
        sigma_level: number;
        observed_value: number;
        expected_value: number;
        timestamp: string;
      }>();

      if (rows.length === 0) return this.empty("anomaly-detection", timeRange);

      const criticalCount = rows.filter((r) => r.severity === "critical").length;
      const warningCount = rows.filter((r) => r.severity === "warning").length;
      const topAnomaly = rows[0];

      const summary =
        `Detected ${rows.length} anomaly event(s) in the period. ` +
        `${criticalCount} critical, ${warningCount} warning. ` +
        `Highest anomaly score: ${topAnomaly.anomaly_score.toFixed(3)} for metric "${topAnomaly.metric_name}" ` +
        `(sigma=${topAnomaly.sigma_level.toFixed(2)}, observed=${topAnomaly.observed_value}, expected=${topAnomaly.expected_value}).`;

      return {
        type: "anomaly-detection",
        timeRange,
        summary,
        data: { events: rows, total: rows.length, criticalCount, warningCount },
      };
    } catch (err) {
      return this.unavailable(
        "anomaly-detection",
        timeRange,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // ── Corrective Maintenance ────────────────────────────────────────────────

  private async correctiveMaintenanceContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    // Collect recent anomaly events (last 1h) from ClickHouse as trigger context
    const recentAnomalies: unknown[] = [];
    if (this.clickhouse) {
      try {
        const client = this.clickhouse.getClient();
        const db = this.clickhouse.getDatabase();
        const result = await client.query({
          query: `
            SELECT
              metric_name, signal_type, severity,
              round(anomaly_score, 4) AS anomaly_score,
              round(observed_value, 4) AS observed_value,
              round(expected_value, 4) AS expected_value,
              toString(timestamp) AS timestamp
            FROM ${db}.anomaly_events
            WHERE organization_id = {orgId:String}
              AND timestamp >= now() - INTERVAL 1 HOUR
            ORDER BY anomaly_score DESC
            LIMIT 20
          `,
          query_params: { orgId: organizationId },
          format: "JSONEachRow",
        });
        const rows = await result.json();
        recentAnomalies.push(...rows);
      } catch {
        // non-fatal
      }
    }

    // Collect existing remediation plans summary from PostgreSQL
    const existingPlans: unknown[] = [];
    if (this.dataSource) {
      try {
        const rows = await this.dataSource.query(
          `SELECT id, trigger_type, title, status, risk_level, created_at
           FROM remediation_plans
           WHERE organization_id = $1 AND deleted_at IS NULL
           ORDER BY created_at DESC LIMIT 10`,
          [organizationId],
        );
        existingPlans.push(...rows);
      } catch {
        // non-fatal
      }
    }

    // When any anomaly is log-based, fetch sample log lines for richer remediation context
    const logSamples: unknown[] = [];
    const hasLogAnomaly = recentAnomalies.some(
      (a: any) => a.signal_type === "log",
    );
    if (hasLogAnomaly && this.clickhouse) {
      try {
        const client = this.clickhouse.getClient();
        const db = this.clickhouse.getDatabase();
        const result = await client.query({
          query: `
            SELECT
              toString(timestamp) AS timestamp,
              severity_text,
              body,
              service_name
            FROM ${db}.logs
            WHERE organization_id = {orgId:String}
              AND timestamp >= now() - INTERVAL 1 HOUR
              AND severity_text IN ('ERROR', 'FATAL', 'WARN')
            ORDER BY timestamp DESC
            LIMIT 50
          `,
          query_params: { orgId: organizationId },
          format: "JSONEachRow",
        });
        const rows = await result.json();
        logSamples.push(...rows);
      } catch {
        // non-fatal
      }
    }

    const summary =
      `Corrective maintenance context: ${recentAnomalies.length} recent anomaly event(s) in the last 1 hour. ` +
      `${existingPlans.length} existing remediation plan(s) on record.` +
      (logSamples.length ? ` ${logSamples.length} recent error/warn log sample(s) included.` : "");

    return {
      type: "corrective-maintenance",
      timeRange,
      summary,
      data: {
        recentAnomalies,
        existingPlans,
        logSamples: logSamples.length ? logSamples : undefined,
      },
    };
  }

  // ── Predictive Maintenance ────────────────────────────────────────────────

  private async predictiveMaintenanceContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable("predictive-maintenance", timeRange, "ClickHouse not connected");
    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    try {
      const result = await client.query({
        query: `
          SELECT
            resource_type,
            resource_identifier,
            horizon,
            avg(failure_probability) AS avg_failure_prob,
            min(health_score)        AS min_health_score,
            avg(health_score)        AS avg_health_score,
            any(health_status)       AS latest_status,
            count()                  AS prediction_count
          FROM ${db}.predictions
          WHERE
            organization_id = {organizationId:String}
            AND timestamp BETWEEN {fromTime:String} AND {toTime:String}
          GROUP BY resource_type, resource_identifier, horizon
          ORDER BY avg_failure_prob DESC
          LIMIT 50
        `,
        format: "JSONEachRow",
        query_params: {
          organizationId,
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
        },
      });

      const rows = await result.json<{
        resource_type: string;
        resource_identifier: string;
        horizon: string;
        avg_failure_prob: number;
        min_health_score: number;
        avg_health_score: number;
        latest_status: string;
        prediction_count: number;
      }>();

      if (rows.length === 0) return this.empty("predictive-maintenance", timeRange);

      const highRisk = rows.filter((r) => r.avg_failure_prob > 0.7).length;
      const critical = rows.filter((r) => r.latest_status === "critical" || r.latest_status === "failing").length;
      const top = rows[0];

      const summary =
        `Predictive maintenance context: ${rows.length} resource/horizon combination(s) analyzed. ` +
        `${highRisk} high-risk prediction(s) (failure prob > 70%). ${critical} in critical/failing health status. ` +
        `Highest risk: ${top.resource_type}/${top.resource_identifier} at horizon ${top.horizon} — ` +
        `failure prob ${(top.avg_failure_prob * 100).toFixed(1)}%, health score ${top.avg_health_score.toFixed(0)}/100 (${top.latest_status}).`;

      return {
        type: "predictive-maintenance",
        timeRange,
        summary,
        data: { predictions: rows, total: rows.length, highRisk, critical },
      };
    } catch (err) {
      return this.unavailable(
        "predictive-maintenance",
        timeRange,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // ── Cost Optimization ──────────────────────────────────────────────────────

  private async costOptimizationContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable("cost-optimization", timeRange, "ClickHouse not connected");
    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    try {
      // Query cost summary from daily MV for efficiency
      const [costResult, topServicesResult, providerResult] = await Promise.all([
        client.query({
          query: `
            SELECT
              sum(total_cost_usd) AS total_cost_usd,
              count()             AS line_count
            FROM ${db}.cost_data_daily_mv
            WHERE organization_id = {orgId:String}
              AND day >= {fromTime:DateTime}
              AND day <= {toTime:DateTime}
          `,
          query_params: {
            orgId: organizationId,
            fromTime: fmtCH(timeRange.from),
            toTime: fmtCH(timeRange.to),
          },
          format: "JSONEachRow",
        }),
        client.query({
          query: `
            SELECT
              service_name,
              provider,
              sum(total_cost_usd) AS total_cost_usd
            FROM ${db}.cost_data_daily_mv
            WHERE organization_id = {orgId:String}
              AND day >= {fromTime:DateTime}
              AND day <= {toTime:DateTime}
            GROUP BY service_name, provider
            ORDER BY total_cost_usd DESC
            LIMIT 10
          `,
          query_params: {
            orgId: organizationId,
            fromTime: fmtCH(timeRange.from),
            toTime: fmtCH(timeRange.to),
          },
          format: "JSONEachRow",
        }),
        client.query({
          query: `
            SELECT
              provider,
              sum(total_cost_usd) AS total_cost_usd
            FROM ${db}.cost_data_daily_mv
            WHERE organization_id = {orgId:String}
              AND day >= {fromTime:DateTime}
              AND day <= {toTime:DateTime}
            GROUP BY provider
            ORDER BY total_cost_usd DESC
          `,
          query_params: {
            orgId: organizationId,
            fromTime: fmtCH(timeRange.from),
            toTime: fmtCH(timeRange.to),
          },
          format: "JSONEachRow",
        }),
      ]);

      const costRows = await costResult.json<{ total_cost_usd: number; line_count: number }>();
      const serviceRows = await topServicesResult.json<{ service_name: string; provider: string; total_cost_usd: number }>();
      const providerRows = await providerResult.json<{ provider: string; total_cost_usd: number }>();

      if (costRows.length === 0 || costRows[0].line_count === 0)
        return this.empty("cost-optimization", timeRange);

      const totalCost = costRows[0].total_cost_usd;
      const highlights: string[] = [
        `Total cloud spend: $${totalCost.toFixed(2)} across ${providerRows.length} provider(s).`,
      ];

      if (serviceRows.length > 0) {
        highlights.push(
          `Top services: ${serviceRows.slice(0, 5).map((s) => `${s.service_name} ($${s.total_cost_usd.toFixed(2)})`).join(", ")}.`,
        );
      }

      if (providerRows.length > 1) {
        highlights.push(
          `Provider breakdown: ${providerRows.map((p) => `${p.provider}: $${p.total_cost_usd.toFixed(2)}`).join(", ")}.`,
        );
      }

      return {
        type: "cost-optimization",
        timeRange,
        summary: highlights.join(" "),
        data: {
          totalCost,
          topServices: serviceRows,
          providerBreakdown: providerRows,
          highlights,
        },
      };
    } catch (err) {
      return this.unavailable(
        "cost-optimization",
        timeRange,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  /** DB Monitoring Inventory — fleet summary from PostgreSQL */
  private async dbInventoryContext(
    organizationId: string,
  ): Promise<TelemetryContext> {
    const timeRange = this.defaultRange();

    if (!this.dataSource) {
      return this.unavailable("db-monitoring-inventory", timeRange, "PostgreSQL dataSource not available");
    }

    try {
      const repo = this.dataSource.getRepository("database_instances" as any);

      const [
        totalCount,
        statusRows,
        typeRows,
        providerRows,
        offlineInstances,
        recentInstances,
        ruleCount,
        tagDistribution,
      ] = await Promise.all([
        repo.count({ where: { organizationId, deletedAt: (null as any) } } as any),

        repo.createQueryBuilder("di")
          .select("di.status", "status")
          .addSelect("COUNT(*)", "count")
          .where("di.organization_id = :orgId", { orgId: organizationId })
          .andWhere("di.deleted_at IS NULL")
          .groupBy("di.status")
          .getRawMany(),

        repo.createQueryBuilder("di")
          .select("di.type", "type")
          .addSelect("COUNT(*)", "count")
          .where("di.organization_id = :orgId", { orgId: organizationId })
          .andWhere("di.deleted_at IS NULL")
          .groupBy("di.type")
          .getRawMany(),

        repo.createQueryBuilder("di")
          .select("di.provider", "provider")
          .addSelect("COUNT(*)", "count")
          .where("di.organization_id = :orgId", { orgId: organizationId })
          .andWhere("di.deleted_at IS NULL")
          .groupBy("di.provider")
          .getRawMany(),

        repo.createQueryBuilder("di")
          .select(["di.id", "di.name", "di.type", "di.host", "di.port", "di.status", "di.last_error", "di.last_seen_at"])
          .where("di.organization_id = :orgId", { orgId: organizationId })
          .andWhere("di.deleted_at IS NULL")
          .andWhere("di.status IN (:...statuses)", { statuses: ["offline", "degraded"] })
          .orderBy("di.last_seen_at", "ASC")
          .limit(10)
          .getRawMany(),

        repo.createQueryBuilder("di")
          .select(["di.id", "di.name", "di.type", "di.status", "di.created_at"])
          .where("di.organization_id = :orgId", { orgId: organizationId })
          .andWhere("di.deleted_at IS NULL")
          .orderBy("di.created_at", "DESC")
          .limit(5)
          .getRawMany(),

        this.dataSource.getRepository("database_monitoring_rules" as any)
          .count({ where: { organizationId, enabled: true, deletedAt: (null as any) } } as any)
          .catch(() => 0),

        this.dataSource.getRepository("database_instance_tags" as any)
          .createQueryBuilder("t")
          .select("t.key", "key")
          .addSelect("COUNT(*)", "count")
          .innerJoin("database_instances", "di", "di.id = t.instance_id")
          .where("di.organization_id = :orgId", { orgId: organizationId })
          .andWhere("di.deleted_at IS NULL")
          .groupBy("t.key")
          .orderBy("count", "DESC")
          .limit(10)
          .getRawMany()
          .catch(() => []),
      ]);

      const statusMap: Record<string, number> = {};
      for (const r of statusRows) {
        statusMap[r.status] = parseInt(r.count, 10);
      }

      const typeDistribution: Record<string, number> = {};
      for (const r of typeRows) {
        typeDistribution[r.type] = parseInt(r.count, 10);
      }

      const providerDistribution: Record<string, number> = {};
      for (const r of providerRows) {
        providerDistribution[r.provider] = parseInt(r.count, 10);
      }

      const offlineCount = offlineInstances.length;
      const _degradedCount = offlineInstances.filter((i: any) => i.di_status === "degraded").length;

      const summary =
        `DB Fleet Inventory: ${totalCount} total instances. ` +
        `Status: online=${statusMap["online"] ?? 0}, offline=${statusMap["offline"] ?? 0}, ` +
        `degraded=${statusMap["degraded"] ?? 0}, unknown=${statusMap["unknown"] ?? 0}, ` +
        `maintenance=${statusMap["maintenance"] ?? 0}. ` +
        `Types: ${Object.entries(typeDistribution).map(([k, v]) => `${k}(${v})`).join(", ")}. ` +
        `Providers: ${Object.entries(providerDistribution).map(([k, v]) => `${k}(${v})`).join(", ")}. ` +
        `${offlineCount} instances offline/degraded. ` +
        `${ruleCount} active monitoring rules.`;

      return {
        type: "db-monitoring-inventory",
        timeRange,
        summary,
        data: {
          total: totalCount,
          statusDistribution: statusMap,
          typeDistribution,
          providerDistribution,
          offlineOrDegraded: offlineInstances,
          recentlyRegistered: recentInstances,
          activeRules: ruleCount,
          tagDistribution,
        },
      };
    } catch (err) {
      return this.unavailable(
        "db-monitoring-inventory",
        timeRange,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  /** DB Monitoring MariaDB — MariaDB-specific metrics from ClickHouse */
  private async dbMariaDBContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse) {
      return this.unavailable("db-monitoring-mariadb", timeRange, "ClickHouse not connected");
    }

    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    try {
      const metricsQuery = `
        SELECT
          metric_name,
          avg(value_float) as avg_value,
          max(value_float) as max_value,
          min(value_float) as min_value,
          count() as sample_count
        FROM ${db}.db_mysql_metrics
        WHERE organization_id = {orgId:String}
          AND timestamp >= {from:DateTime64}
          AND timestamp <= {to:DateTime64}
          AND labels LIKE '%mariadb%'
        GROUP BY metric_name
        ORDER BY metric_name
      `;

      const replicationQuery = `
        SELECT
          JSONExtractString(labels, 'channel') as channel,
          avg(CASE WHEN metric_name = 'db.mysql.replication.lag_seconds' THEN value_float ELSE 0 END) as avg_lag,
          max(CASE WHEN metric_name = 'db.mysql.replication.lag_seconds' THEN value_float ELSE 0 END) as max_lag,
          count() as sample_count
        FROM ${db}.db_mysql_metrics
        WHERE organization_id = {orgId:String}
          AND timestamp >= {from:DateTime64}
          AND timestamp <= {to:DateTime64}
          AND metric_name LIKE 'db.mysql.replication.%'
        GROUP BY channel
        ORDER BY channel
      `;

      const userStatsQuery = `
        SELECT
          JSONExtractString(labels, 'user') as user,
          sum(CASE WHEN metric_name = 'db.mysql.userstats.cpu_time' THEN value_float ELSE 0 END) as total_cpu,
          sum(CASE WHEN metric_name = 'db.mysql.userstats.rows_read' THEN value_float ELSE 0 END) as total_rows_read,
          sum(CASE WHEN metric_name = 'db.mysql.userstats.rows_written' THEN value_float ELSE 0 END) as total_rows_written
        FROM ${db}.db_mysql_metrics
        WHERE organization_id = {orgId:String}
          AND timestamp >= {from:DateTime64}
          AND timestamp <= {to:DateTime64}
          AND metric_name LIKE 'db.mysql.userstats.%'
        GROUP BY user
        ORDER BY total_cpu DESC
        LIMIT 10
      `;

      const [metricsResult, replicationResult, userStatsResult] = await Promise.all([
        client.query({ query: metricsQuery, query_params: { orgId: organizationId, from: fmtCH(timeRange.from), to: fmtCH(timeRange.to) }, format: "JSONEachRow" }),
        client.query({ query: replicationQuery, query_params: { orgId: organizationId, from: fmtCH(timeRange.from), to: fmtCH(timeRange.to) }, format: "JSONEachRow" }),
        client.query({ query: userStatsQuery, query_params: { orgId: organizationId, from: fmtCH(timeRange.from), to: fmtCH(timeRange.to) }, format: "JSONEachRow" }),
      ]);

      const metrics = await metricsResult.json<any[]>();
      const replication = await replicationResult.json<any[]>();
      const userStats = await userStatsResult.json<any[]>();

      const metricNames = metrics.map((r: any) => r.metric_name);

      const queryCacheMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.mysql.qcache."));
      const ariaMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.mysql.aria."));
      const threadPoolMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.mysql.threadpool."));
      const columnStoreMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.mysql.columnstore."));
      const spiderMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.mysql.spider."));

      const hasQueryCache = queryCacheMetrics.length > 0;
      const hasAria = ariaMetrics.length > 0;
      const hasThreadPool = threadPoolMetrics.length > 0;
      const hasColumnStore = columnStoreMetrics.length > 0;
      const hasSpider = spiderMetrics.length > 0;

      const summary =
        `MariaDB Monitoring: ${metricNames.length} distinct metrics. ` +
        `Features detected: Query Cache=${hasQueryCache}, Aria=${hasAria}, Thread Pool=${hasThreadPool}, ` +
        `ColumnStore=${hasColumnStore}, Spider=${hasSpider}. ` +
        `Replication: ${replication.length} channels. ` +
        `User Stats: ${userStats.length} active users.`;

      return {
        type: "db-monitoring-mariadb",
        timeRange,
        summary,
        data: {
          metricCount: metricNames.length,
          features: { queryCache: hasQueryCache, aria: hasAria, threadPool: hasThreadPool, columnStore: hasColumnStore, spider: hasSpider },
          queryCache: queryCacheMetrics,
          aria: ariaMetrics,
          threadPool: threadPoolMetrics,
          columnStore: columnStoreMetrics,
          spider: spiderMetrics,
          replicationChannels: replication,
          topUsers: userStats,
        },
      };
    } catch (err) {
      return this.unavailable(
        "db-monitoring-mariadb",
        timeRange,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  /** MySQL/MariaDB/Percona monitoring context for LLM analysis */
  private async dbMysqlContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse) {
      return this.unavailable("db-monitoring-mysql", timeRange, "ClickHouse not connected");
    }

    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    try {
      const metricsQuery = `
        SELECT
          metric_name,
          avg(metric_value) as avg_value,
          max(metric_value) as max_value,
          min(metric_value) as min_value,
          count() as sample_count
        FROM ${db}.db_mysql_metrics
        WHERE organization_id = {orgId:String}
          AND timestamp >= {from:DateTime64}
          AND timestamp <= {to:DateTime64}
        GROUP BY metric_name
        ORDER BY metric_name
      `;

      const slowQueriesQuery = `
        SELECT digest_text, schema_name, sum(calls) as total_calls, avg(avg_time_us) as avg_time_us
        FROM ${db}.db_mysql_queries
        WHERE organization_id = {orgId:String}
          AND timestamp >= {from:DateTime64}
          AND timestamp <= {to:DateTime64}
        GROUP BY digest_text, schema_name
        ORDER BY avg_time_us DESC
        LIMIT 10
      `;

      const [metricsResult, slowQueriesResult] = await Promise.all([
        client.query({ query: metricsQuery, query_params: { orgId: organizationId, from: fmtCH(timeRange.from), to: fmtCH(timeRange.to) }, format: "JSONEachRow" }),
        client.query({ query: slowQueriesQuery, query_params: { orgId: organizationId, from: fmtCH(timeRange.from), to: fmtCH(timeRange.to) }, format: "JSONEachRow" }),
      ]);

      const metrics = await metricsResult.json<any[]>();
      const slowQueries = await slowQueriesResult.json<any[]>();

      const connectionMetrics = metrics.filter((r: any) => r.metric_name?.includes("connection"));
      const bufferPoolMetrics = metrics.filter((r: any) => r.metric_name?.includes("buffer_pool"));
      const replicationMetrics = metrics.filter((r: any) => r.metric_name?.includes("replication"));
      const innodbMetrics = metrics.filter((r: any) => r.metric_name?.includes("innodb"));

      const summary =
        `MySQL Monitoring: ${metrics.length} distinct metrics. ` +
        `Connections: ${connectionMetrics.length} metrics. ` +
        `Buffer Pool: ${bufferPoolMetrics.length} metrics. ` +
        `InnoDB: ${innodbMetrics.length} metrics. ` +
        `Replication: ${replicationMetrics.length} metrics. ` +
        `Top Slow Queries: ${slowQueries.length}.`;

      return {
        type: "db-monitoring-mysql",
        timeRange,
        summary,
        data: {
          metricCount: metrics.length,
          connections: connectionMetrics,
          bufferPool: bufferPoolMetrics,
          innodb: innodbMetrics,
          replication: replicationMetrics,
          topSlowQueries: slowQueries,
        },
      };
    } catch (err) {
      return this.unavailable(
        "db-monitoring-mysql",
        timeRange,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private async dbPerconaContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse) {
      return this.unavailable("db-monitoring-percona", timeRange, "ClickHouse not connected");
    }

    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    try {
      const perconaQuery = `
        SELECT
          metric_name,
          avg(metric_value) as avg_value,
          max(metric_value) as max_value,
          min(metric_value) as min_value,
          count() as sample_count
        FROM ${db}.db_mysql_metrics
        WHERE organization_id = {orgId:String}
          AND timestamp >= {from:DateTime64}
          AND timestamp <= {to:DateTime64}
          AND (
            metric_name LIKE 'db.mysql.query_response_time%'
            OR metric_name LIKE 'db.mysql.pxc%'
            OR metric_name LIKE 'db.mysql.threadpool%'
            OR metric_name LIKE 'db.mysql.xtrabackup%'
            OR metric_name LIKE 'db.mysql.audit%'
            OR metric_name LIKE 'db.mysql.userstats%'
          )
        GROUP BY metric_name
        ORDER BY metric_name
      `;

      const result = await client.query({
        query: perconaQuery,
        query_params: { orgId: organizationId, from: fmtCH(timeRange.from), to: fmtCH(timeRange.to) },
        format: "JSONEachRow",
      });
      const metrics = await result.json<any[]>();

      const qrtMetrics = metrics.filter((r: any) => r.metric_name?.includes("query_response_time"));
      const pxcMetrics = metrics.filter((r: any) => r.metric_name?.includes("pxc"));
      const threadPoolMetrics = metrics.filter((r: any) => r.metric_name?.includes("threadpool"));
      const xtrabackupMetrics = metrics.filter((r: any) => r.metric_name?.includes("xtrabackup"));
      const auditMetrics = metrics.filter((r: any) => r.metric_name?.includes("audit"));
      const userStatsMetrics = metrics.filter((r: any) => r.metric_name?.includes("userstats"));

      const summary =
        `Percona Monitoring: ${metrics.length} distinct metrics. ` +
        `QRT: ${qrtMetrics.length} metrics (latency percentiles). ` +
        `PXC Cluster: ${pxcMetrics.length} metrics (health, flow control, throughput). ` +
        `Thread Pool: ${threadPoolMetrics.length} metrics (active/idle/high-prio). ` +
        `XtraBackup: ${xtrabackupMetrics.length} metrics (changed pages). ` +
        `Audit: ${auditMetrics.length} metrics (events, log size). ` +
        `User Stats: ${userStatsMetrics.length} metrics.`;

      return {
        type: "db-monitoring-percona",
        timeRange,
        summary,
        data: {
          metricCount: metrics.length,
          queryResponseTime: qrtMetrics,
          pxcCluster: pxcMetrics,
          threadPool: threadPoolMetrics,
          xtrabackup: xtrabackupMetrics,
          audit: auditMetrics,
          userStats: userStatsMetrics,
        },
      };
    } catch (err) {
      return this.unavailable(
        "db-monitoring-percona",
        timeRange,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  /** Used when there is genuinely no data for the time range (table exists, query succeeded, 0 rows) */
  private empty(
    contextType: ContextType,
    timeRange: { from: Date; to: Date },
  ): TelemetryContext {
    return {
      type: contextType,
      timeRange,
      summary:
        `[SYSTEM] No data found in the "${contextType}" data source for the period ${fmtCH(timeRange.from)} → ${fmtCH(timeRange.to)}. ` +
        `Tell the user there is no recorded data in this time window and suggest adjusting the time range or checking if the relevant monitors/services are configured.`,
      data: { available: false, rowCount: 0 },
    };
  }

  /** SQLite3 database monitoring context for LLM analysis */
  private async dbSqlite3Context(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse) {
      return this.unavailable("db-monitoring-sqlite3", timeRange, "ClickHouse not connected");
    }

    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    try {
      const metricsQuery = `
        SELECT
          metric_name,
          avg(value_float) as avg_value,
          max(value_float) as max_value,
          min(value_float) as min_value,
          count() as sample_count
        FROM ${db}.db_sqlite3_metrics
        WHERE organization_id = {orgId:String}
          AND timestamp >= {from:DateTime64}
          AND timestamp <= {to:DateTime64}
        GROUP BY metric_name
        ORDER BY metric_name
      `;

      const integrityQuery = `
        SELECT
          JSONExtractString(labels, 'check_type') as check_type,
          JSONExtractString(labels, 'status') as status,
          count() as check_count,
          avg(CASE WHEN metric_name = 'db.sqlite3.integrity.duration_ms' THEN value_float ELSE 0 END) as avg_duration_ms
        FROM ${db}.db_sqlite3_integrity
        WHERE organization_id = {orgId:String}
          AND timestamp >= {from:DateTime64}
          AND timestamp <= {to:DateTime64}
        GROUP BY check_type, status
        ORDER BY check_type, status
      `;

      const [metricsResult, integrityResult] = await Promise.all([
        client.query({ query: metricsQuery, query_params: { orgId: organizationId, from: fmtCH(timeRange.from), to: fmtCH(timeRange.to) }, format: "JSONEachRow" }),
        client.query({ query: integrityQuery, query_params: { orgId: organizationId, from: fmtCH(timeRange.from), to: fmtCH(timeRange.to) }, format: "JSONEachRow" }),
      ]);

      const metrics = await metricsResult.json<any[]>();
      const integrity = await integrityResult.json<any[]>();

      const fileMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.sqlite3.file."));
      const pageMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.sqlite3.page."));
      const cacheMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.sqlite3.cache."));
      const walMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.sqlite3.wal."));
      const busyMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.sqlite3.busy."));

      const failedChecks = integrity.filter((r: any) => r.status === "FAIL");
      const hasIntegrityIssues = failedChecks.length > 0;

      const summary =
        `SQLite3 Monitoring: ${metrics.length} distinct metrics. ` +
        `Categories: File=${fileMetrics.length}, Page=${pageMetrics.length}, Cache=${cacheMetrics.length}, ` +
        `WAL=${walMetrics.length}, Lock=${busyMetrics.length}. ` +
        `Integrity: ${integrity.length} check results, ${failedChecks.length} failures. ` +
        `Knowledge: WAL mode provides better concurrency than rollback journal. ` +
        `synchronous=FULL is safest but slower; NORMAL with WAL is safe and faster. ` +
        `Consider VACUUM for high-utilization databases. ` +
        `mmap_size can improve read performance on 64-bit systems. ` +
        `auto_vacuum=INCREMENTAL prevents uncontrolled growth but may fragment.`;

      return {
        type: "db-monitoring-sqlite3",
        timeRange,
        summary,
        data: {
          metricCount: metrics.length,
          fileMetrics,
          pageMetrics,
          cacheMetrics,
          walMetrics,
          busyMetrics,
          integrity,
          hasIntegrityIssues,
          recommendations: {
            walVsRollback: "WAL mode provides better read concurrency and is crash-safe. Use journal_mode=WAL for most workloads.",
            synchronousModes: "FULL is safest (commits wait for disk fsync). NORMAL with WAL is nearly as safe and much faster. OFF is dangerous.",
            cacheSize: "Larger cache_size reduces disk I/O. Set to -(available_memory_MB) for negative KB or positive page count.",
            mmapSize: "Memory-mapped I/O speeds up reads on 64-bit systems. Set mmap_size=268435456 (256MB) for medium databases.",
            vacuum: "VACUUM rebuilds the entire database, defragmenting and shrinking. Use auto_vacuum=INCREMENTAL for gradual reclaim.",
            walAutocheckpoint: "Controls when WAL is checkpointed. Lower values use less disk but checkpoint more often. Default 1000 is usually fine.",
          },
        },
      };
    } catch (err) {
      return this.unavailable(
        "db-monitoring-sqlite3",
        timeRange,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private async dbTimescaledbContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse) {
      return this.unavailable("db-monitoring-timescaledb", timeRange, "ClickHouse not connected");
    }

    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    try {
      const metricsQuery = `
        SELECT
          metric_name,
          avg(metric_value) as avg_value,
          max(metric_value) as max_value,
          min(metric_value) as min_value,
          count() as sample_count
        FROM ${db}.db_timescaledb_metrics
        WHERE organization_id = {orgId:String}
          AND timestamp >= {from:DateTime64}
          AND timestamp <= {to:DateTime64}
        GROUP BY metric_name
        ORDER BY metric_name
      `;

      const metricsResult = await client.query({
        query: metricsQuery,
        query_params: { orgId: organizationId, from: fmtCH(timeRange.from), to: fmtCH(timeRange.to) },
        format: "JSONEachRow",
      });

      const metrics = await metricsResult.json<any[]>();

      const hypertableMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.timescaledb.hypertable."));
      const chunkMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.timescaledb.chunks."));
      const compressionMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.timescaledb.compression."));
      const caggMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.timescaledb.cagg."));
      const jobMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.timescaledb.job"));
      const retentionMetrics = metrics.filter((r: any) => r.metric_name?.startsWith("db.timescaledb.retention."));

      const avgCompressionRatio = (compressionMetrics.find((r: any) => r.metric_name === "db.timescaledb.compression.ratio") as any)?.avg_value;
      const totalHypertableBytes = hypertableMetrics.filter((r: any) => r.metric_name.endsWith("total_bytes")).reduce((sum: number, r: any) => sum + Number((r as any).avg_value || 0), 0);

      const summary =
        `TimescaleDB Monitoring: ${metrics.length} distinct metrics. ` +
        `Categories: Hypertable=${hypertableMetrics.length}, Chunks=${chunkMetrics.length}, ` +
        `Compression=${compressionMetrics.length}, CAgg=${caggMetrics.length}, ` +
        `Jobs=${jobMetrics.length}, Retention=${retentionMetrics.length}. ` +
        `Total hypertable data: ${(totalHypertableBytes / 1e9).toFixed(1)} GB. ` +
        `Avg compression ratio: ${avgCompressionRatio?.toFixed(2) ?? "N/A"}x. ` +
        `Knowledge: Hypertables partition PG tables by time/space. ` +
        `Chunk interval affects query performance — smaller intervals = more chunks, more parallelism but more overhead. ` +
        `Compression uses columnar encoding and typically achieves 90%+ space savings. ` +
        `Continuous aggregates pre-compute results for time buckets. ` +
        `Retention policies automate data lifecycle management.`;

      return {
        type: "db-monitoring-timescaledb",
        timeRange,
        summary,
        data: {
          metricCount: metrics.length,
          hypertableMetrics,
          chunkMetrics,
          compressionMetrics,
          caggMetrics,
          jobMetrics,
          retentionMetrics,
          totalHypertableBytes,
          avgCompressionRatio,
          recommendations: {
            chunkInterval: "Smaller intervals (1h-1d) benefit point queries. Larger intervals (7d-30d) benefit analytical queries. Monitor chunk count — >10K chunks per hypertable may slow planning.",
            compression: "Enable segment-by on high-cardinality columns, order-by on time. Set compress_after based on query patterns — data accessed frequently should stay uncompressed.",
            continuousAggregates: "Use materialized_only=true for dashboards (consistent reads). Monitor materialization lag — growing lag indicates the refresh job cannot keep up.",
            retention: "Set drop_after policies per hypertable. Monitor oldest_data_age to verify policies execute. Missing retention leads to unbounded disk growth.",
            jobScheduling: "Monitor job failures and crashes. Stuck jobs (exceeding max_runtime) may need manual cancellation via remove_job(). Schedule compression after peak hours.",
            distributed: "For multi-node: monitor chunk distribution skew across data nodes. A skew > 2x indicates imbalance. Use move_chunk() to rebalance.",
          },
        },
      };
    } catch (err) {
      return this.unavailable(
        "db-monitoring-timescaledb",
        timeRange,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // ── DB Monitoring: Aurora ─────────────────────────────────────────────────

  private async dbAuroraContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
    contextId?: string,
  ): Promise<TelemetryContext> {
    if (!this.clickhouse) {
      return this.unavailable("db-monitoring-aurora", timeRange, "ClickHouse not connected");
    }

    const client = this.clickhouse.getClient();
    const db = this.clickhouse.getDatabase();

    try {
      // Cluster topology from PG
      const clusters = await this.dataSource.query(
        `SELECT id, cluster_identifier, engine_type, engine_version, cluster_status,
                writer_instance_id, reader_instance_ids, is_serverless_v2,
                min_acu, max_acu, is_global_database, last_topology_sync_at
         FROM aurora_cluster_topology
         WHERE organization_id = $1 AND deleted_at IS NULL`,
        [organizationId],
      );

      const targetCluster = contextId
        ? clusters.find((c: any) => c.id === contextId)
        : clusters[0];

      if (!targetCluster) {
        return {
          type: "db-monitoring-aurora",
          timeRange,
          summary: "No Aurora clusters registered for this organization.",
          data: { clusters: [], metrics: [] },
        };
      }

      // Instances from PG
      const instances = await this.dataSource.query(
        `SELECT instance_identifier, role, instance_class, availability_zone,
                status, is_serverless_v2, current_acu
         FROM aurora_instance_status
         WHERE cluster_topology_id = $1 AND deleted_at IS NULL`,
        [targetCluster.id],
      );

      // Recent metrics from CH (1h)
      const metricsResult = await client.query({
        query: `
          SELECT metric_name, avg(avg_value) AS avg_val, max(max_value) AS max_val, min(min_value) AS min_val
          FROM ${db}.db_aurora_metrics_1m
          WHERE organization_id = {orgId:String}
            AND cluster_identifier = {clusterId:String}
            AND timestamp_1m >= {fromTime:DateTime64(3)}
            AND timestamp_1m <= {toTime:DateTime64(3)}
          GROUP BY metric_name
          ORDER BY avg_val DESC
          LIMIT 30
        `,
        query_params: {
          orgId: organizationId,
          clusterId: targetCluster.cluster_identifier,
          fromTime: timeRange.from.toISOString().replace("T", " ").replace("Z", ""),
          toTime: timeRange.to.toISOString().replace("T", " ").replace("Z", ""),
        },
        format: "JSONEachRow",
      });
      const metrics = (await metricsResult.json()) as any[];

      // Top SQL (1h)
      const topSQLResult = await client.query({
        query: `
          SELECT sql_digest, left(sql_text, 200) AS sql_preview, sum(load_aas) AS total_load,
                 avg(avg_latency_ms) AS avg_latency
          FROM ${db}.db_aurora_queries
          WHERE organization_id = {orgId:String}
            AND cluster_identifier = {clusterId:String}
            AND timestamp >= {fromTime:DateTime64(3)}
          GROUP BY sql_digest, sql_preview
          ORDER BY total_load DESC
          LIMIT 10
        `,
        query_params: {
          orgId: organizationId,
          clusterId: targetCluster.cluster_identifier,
          fromTime: timeRange.from.toISOString().replace("T", " ").replace("Z", ""),
        },
        format: "JSONEachRow",
      });
      const topSQL = (await topSQLResult.json()) as any[];

      // Recent events
      const eventsResult = await client.query({
        query: `
          SELECT event_type, severity, count() AS event_count
          FROM ${db}.db_aurora_events
          WHERE organization_id = {orgId:String}
            AND cluster_identifier = {clusterId:String}
            AND timestamp >= {fromTime:DateTime64(3)}
          GROUP BY event_type, severity
          ORDER BY event_count DESC
        `,
        query_params: {
          orgId: organizationId,
          clusterId: targetCluster.cluster_identifier,
          fromTime: timeRange.from.toISOString().replace("T", " ").replace("Z", ""),
        },
        format: "JSONEachRow",
      });
      const events = (await eventsResult.json()) as any[];

      const writer = instances.find((i: any) => i.role === "writer");
      const readers = instances.filter((i: any) => i.role === "reader");

      const summary = [
        `Aurora Cluster: ${targetCluster.cluster_identifier} (${targetCluster.engine_type} ${targetCluster.engine_version})`,
        `Status: ${targetCluster.cluster_status}`,
        `Topology: 1 writer (${writer?.instance_class || "unknown"}) + ${readers.length} reader(s)`,
        targetCluster.is_serverless_v2 ? `Serverless v2: ACU ${targetCluster.min_acu}-${targetCluster.max_acu}` : null,
        targetCluster.is_global_database ? "Global Database: enabled" : null,
        `Metrics collected: ${metrics.length} metric types in time range`,
        `Top SQL queries: ${topSQL.length} unique digests`,
        `Events: ${events.map((e: any) => `${e.event_type}(${e.event_count})`).join(", ") || "none"}`,
      ].filter(Boolean).join(". ");

      return {
        type: "db-monitoring-aurora",
        timeRange,
        summary,
        data: {
          cluster: targetCluster,
          instances: { writer, readers },
          metrics,
          topSQL,
          events,
        },
      };
    } catch (err) {
      return this.unavailable(
        "db-monitoring-aurora",
        timeRange,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // ── DB Monitoring — MSSQL ─────────────────────────────────────────────────────

  private async collectDbMonitoringMssqlContext(
    opts: CollectContextOptions,
  ): Promise<TelemetryContext> {
    const { organizationId, contextId: instanceId, timeRange } = opts;
    const from = timeRange?.from ?? new Date(Date.now() - 3600_000);
    const to = timeRange?.to ?? new Date();
    const maxItems = opts.maxItems ?? 10;

    try {
      // Instance overview from PostgreSQL
      const instances = await this.dataSource.query(
        `SELECT id, name, host, port, edition, product_version, engine_edition, status, last_seen_at
         FROM mssql_instances
         WHERE organization_id = $1 AND deleted_at IS NULL
         ORDER BY status, name
         LIMIT 50`,
        [organizationId],
      );

      const targetInstance = instanceId
        ? instances.find((i: any) => i.id === instanceId)
        : instances[0];

      // Key metrics from ClickHouse
      const chClient = this.clickhouse?.getClient();
      const chDb = this.clickhouse?.getDatabase();

      let metrics: any[] = [];
      try {
        const metricsResult = await chClient.query({
          query: `
            SELECT metric_name, avg(value) as avg_value, max(value) as max_value, min(value) as min_value
            FROM ${chDb}.db_mssql_metrics
            WHERE instance_id = {instanceId:String}
              AND organization_id = {organizationId:String}
              AND timestamp >= {fromTime:String}
              AND timestamp <= {toTime:String}
              AND metric_name IN (
                'db.mssql.batch_requests_per_sec',
                'db.mssql.page_life_expectancy',
                'db.mssql.buffer_cache_hit_ratio',
                'db.mssql.user_connections',
                'db.mssql.deadlocks_per_sec',
                'db.mssql.sql_compilations_per_sec',
                'db.mssql.memory_grants_pending'
              )
            GROUP BY metric_name
          `,
          format: "JSONEachRow",
          query_params: {
            instanceId: targetInstance?.id || "none",
            organizationId,
            fromTime: from.toISOString(),
            toTime: to.toISOString(),
          },
        });
        metrics = await metricsResult.json() as any[];
      } catch {
        // ClickHouse may not have data yet
      }

      // Top queries by CPU
      let topQueries: any[] = [];
      try {
        const queriesResult = await chClient.query({
          query: `
            SELECT query_hash, any(sql_text) as sql_text, sum(total_worker_time_us) as total_cpu_us,
                   sum(execution_count) as exec_count
            FROM ${chDb}.db_mssql_queries
            WHERE instance_id = {instanceId:String}
              AND organization_id = {organizationId:String}
              AND timestamp >= {fromTime:String}
            GROUP BY query_hash
            ORDER BY total_cpu_us DESC
            LIMIT ${maxItems}
          `,
          format: "JSONEachRow",
          query_params: {
            instanceId: targetInstance?.id || "none",
            organizationId,
            fromTime: from.toISOString(),
          },
        });
        topQueries = await queriesResult.json() as any[];
      } catch {
        /* intentionally ignored */
      }

      // Wait stats by category
      let waitCategories: any[] = [];
      try {
        const waitsResult = await chClient.query({
          query: `
            SELECT wait_category, sum(wait_time_ms) as total_wait_ms, sum(waiting_tasks_count) as total_tasks
            FROM ${chDb}.db_mssql_waits
            WHERE instance_id = {instanceId:String}
              AND organization_id = {organizationId:String}
              AND timestamp >= {fromTime:String}
            GROUP BY wait_category
            ORDER BY total_wait_ms DESC
          `,
          format: "JSONEachRow",
          query_params: {
            instanceId: targetInstance?.id || "none",
            organizationId,
            fromTime: from.toISOString(),
          },
        });
        waitCategories = await waitsResult.json() as any[];
      } catch {
        /* intentionally ignored */
      }

      const summary = [
        `MSSQL Monitoring: ${instances.length} instances registered.`,
        targetInstance
          ? `Target: ${targetInstance.name} (${targetInstance.host}:${targetInstance.port}, ${targetInstance.edition || "unknown edition"}, ${targetInstance.status})`
          : "No specific instance targeted.",
        metrics.length > 0 ? `Key metrics: ${metrics.map((m: any) => `${m.metric_name}=${Number(m.avg_value).toFixed(2)}`).join(", ")}` : "No metric data available.",
        topQueries.length > 0 ? `Top ${topQueries.length} queries by CPU identified.` : "No query data available.",
        waitCategories.length > 0 ? `Wait categories: ${waitCategories.map((w: any) => `${w.wait_category}=${Number(w.total_wait_ms).toFixed(0)}ms`).join(", ")}` : "No wait data available.",
      ].join(" ");

      return {
        type: "db-monitoring-mssql",
        timeRange,
        summary,
        data: {
          instances,
          targetInstance: targetInstance || null,
          metrics,
          topQueries,
          waitCategories,
        },
      };
    } catch (err) {
      return this.unavailable(
        "db-monitoring-mssql",
        timeRange,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // ── DB Monitoring — Generic Engine Metrics ─────────────────────────────────

  private async dbEngineMetricsContext(
    contextType: ContextType,
    metricPattern: string,
    organizationId: string,
    timeRange: { from: Date; to: Date },
    engineLabel: string,
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable(contextType, timeRange, "ClickHouse not connected");
    try {
      const client = this.clickhouse.getClient();
      const db = this.clickhouse.getDatabase();

      const result = await client.query({
        query: `
          SELECT metric_name, round(avgMerge(avg_value), 4) AS avg_val, round(maxMerge(max_value), 4) AS max_val
          FROM ${db}.metrics_5m
          WHERE metric_name LIKE {pattern:String}
            AND organization_id = {orgId:String}
            AND five_minutes >= {fromTime:DateTime}
            AND five_minutes <= {toTime:DateTime}
          GROUP BY metric_name ORDER BY avg_val DESC LIMIT 20
        `,
        query_params: {
          pattern: metricPattern,
          orgId: organizationId,
          fromTime: fmtCH(timeRange.from),
          toTime: fmtCH(timeRange.to),
        },
        format: "JSONEachRow",
      });
      const rows = await result.json<{ metric_name: string; avg_val: number; max_val: number }[]>();
      const summary = rows.length > 0
        ? `${engineLabel} Monitoring: ${rows.length} metrics. Top: ${rows.slice(0, 5).map((r: any) => `${r.metric_name}=${Number(r.avg_val).toFixed(2)}`).join(", ")}`
        : `No ${engineLabel} monitoring data available in the selected time range.`;
      return { type: contextType, timeRange, summary, data: { metrics: rows } };
    } catch (err) {
      return this.unavailable(contextType, timeRange, err instanceof Error ? err.message : String(err));
    }
  }

  // ── DB Monitoring — QAN (Query Analytics) ──────────────────────────────────

  private async dbMonitoringQanContext(
    organizationId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TelemetryContext> {
    if (!this.clickhouse)
      return this.unavailable("db-monitoring-qan", timeRange, "ClickHouse not connected");
    try {
      const client = this.clickhouse.getClient();
      const db = this.clickhouse.getDatabase();

      const engines = ["mysql", "postgresql", "clickhouse", "mongodb"];
      let allQueries: { engine: string; fingerprint: string; avg_duration_ms: number; calls: string }[] = [];

      for (const engine of engines) {
        const tableName = `db_${engine}_queries`;
        try {
          const result = await client.query({
            query: `
              SELECT {engine:String} AS engine, fingerprint, avg_duration_ms, sum(calls) AS calls
              FROM ${db}.${tableName}
              WHERE organization_id = {orgId:String}
                AND timestamp >= {fromTime:DateTime}
                AND timestamp <= {toTime:DateTime}
              GROUP BY fingerprint, avg_duration_ms
              ORDER BY avg_duration_ms DESC LIMIT 10
            `,
            query_params: {
              engine,
              orgId: organizationId,
              fromTime: fmtCH(timeRange.from),
              toTime: fmtCH(timeRange.to),
            },
            format: "JSONEachRow",
          });
          const rows: any[] = await result.json();
          allQueries = allQueries.concat(rows as typeof allQueries);
        } catch { /* table may not exist for this engine */ }
      }

      allQueries.sort((a, b) => b.avg_duration_ms - a.avg_duration_ms);
      const topQueries = allQueries.slice(0, 10);

      const summary = topQueries.length > 0
        ? `Query Analytics: ${topQueries.length} slowest queries across engines. Top: ${topQueries.slice(0, 5).map(q => `[${q.engine}] ${(q.fingerprint ?? "").substring(0, 60)}... avg=${Number(q.avg_duration_ms).toFixed(1)}ms`).join("; ")}`
        : "No query analytics data available in the selected time range.";

      return {
        type: "db-monitoring-qan",
        timeRange,
        summary,
        data: { topSlowQueries: topQueries, engineCount: engines.length },
      };
    } catch (err) {
      return this.unavailable("db-monitoring-qan", timeRange, err instanceof Error ? err.message : String(err));
    }
  }

  /** Used when the data source itself is unreachable (connection down, timeout, exception) */
  private unavailable(
    contextType: ContextType,
    timeRange: { from: Date; to: Date },
    reason: string,
  ): TelemetryContext {
    return {
      type: contextType,
      timeRange,
      summary:
        `[SYSTEM] The data source for context "${contextType}" is currently unavailable. Reason: ${reason}. ` +
        `Inform the user that the monitoring backend cannot be reached at this moment and data cannot be retrieved. ` +
        `Do NOT ask the user to provide data manually — this is a system connectivity issue.`,
      data: { available: false, reason },
    };
  }
}
