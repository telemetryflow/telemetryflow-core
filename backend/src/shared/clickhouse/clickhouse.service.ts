import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { createClient, ClickHouseClient } from "@clickhouse/client";
import { ConfigService } from "@nestjs/config";
import { TELEMETRYFLOW_SOFT_LIMIT, TELEMETRYFLOW_HARD_LIMIT } from "@/shared/constants/telemetry-limits";

const MODULE_NAME = "ClickHouse";

export interface LogRecord {
  timestamp?: Date | string;
  observed_timestamp?: Date | string;
  trace_id: string;
  span_id: string;
  trace_flags: number;
  severity_text: string;
  severity_number: number;
  service_name: string;
  organization_id?: string;
  workspace_id?: string;
  tenant_id?: string;
  body: string;
  resource_attributes?: Record<string, string>;
  scope_name?: string;
  scope_version?: string;
  log_attributes?: Record<string, string>;
}

export interface MetricRecord {
  timestamp: Date | string;
  metric_name: string;
  metric_type: "gauge" | "counter" | "histogram" | "summary";
  value: number;
  service_name: string;
  organization_id?: string;
  workspace_id?: string;
  tenant_id?: string;
  resource_attributes?: Record<string, string>;
  metric_attributes?: Record<string, string>;
  labels?: Record<string, string>; // Alias for metric_attributes (Prometheus-style)
  unit?: string;
}

export interface TraceRecord {
  timestamp: Date | string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  span_name: string;
  span_kind:
    | "UNSPECIFIED"
    | "INTERNAL"
    | "SERVER"
    | "CLIENT"
    | "PRODUCER"
    | "CONSUMER";
  service_name: string;
  organization_id?: string;
  workspace_id?: string;
  tenant_id?: string;
  status_code: "UNSET" | "OK" | "ERROR";
  status_message?: string;
  duration_ns: number;
  resource_attributes?: Record<string, string>;
  span_attributes?: Record<string, string>;
  events?: string[];
}

export interface ExemplarRecord {
  timestamp: Date | string;
  metric_name: string;
  value: number;
  trace_id: string;
  span_id: string;
  labels: Record<string, string>;
  filtered_labels: Record<string, string>;
  service_name: string;
  organization_id: string;
  workspace_id?: string;
  tenant_id?: string;
}

export interface VMMetricRecord {
  timestamp: Date | string;
  vm_id: string;
  metric_name: string;
  value: number;
  unit: string;
  labels: Record<string, string>;
  organization_id: string;
  workspace_id?: string;
  tenant_id?: string;
}

export interface KubernetesMetricRecord {
  timestamp: string;       // ISO8601 DateTime64(3)
  cluster_id: string;
  resource_type: string;   // 'node' | 'pod'
  resource_name: string;
  namespace: string;       // '' for cluster-scoped (node)
  metric_name: string;     // e.g. 'k8s.node.cpu.usage'
  value: number;
  labels: Record<string, string>;
  organization_id: string;
  workspace_id: string;
  tenant_id: string;
  /** Identifies the data source — 'sync_agent' | 'otlp' | 'prometheus'. Defaults to 'sync_agent' at DB level. */
  ingestion_source?: string;
  /** Version column for ReplacingMergeTree — latest ingestion_time wins on dedup. Defaults to now64(3) at DB level. */
  ingestion_time?: string;
}

export interface PrometheusMetricRecord {
  timestamp: string;       // ISO8601 DateTime64(3)
  metric_name: string;     // e.g. 'apiserver_request_total'
  labels: Record<string, string>;
  value: number;
  organization_id: string;
  workspace_id?: string;
  tenant_id?: string;
  /** Identifies the Prometheus source — 'prometheus_remote_write' | 'tfo_agent'. Defaults to 'prometheus_remote_write' at DB level. */
  ingestion_source?: string;
  /** Version column for ReplacingMergeTree dedup. Defaults to now64(3) at DB level. */
  ingestion_time?: string;
}

export interface KubernetesPodLogRecord {
  timestamp: string;        // ISO8601 DateTime64(3)
  cluster_id: string;
  organization_id: string;
  workspace_id: string;
  namespace: string;
  pod_name: string;
  container_name: string;
  node_name: string;
  deployment_name: string;
  log_line: string;
  labels: Record<string, string>;
}

export interface KubernetesEventRecord {
  timestamp: string;
  cluster_id: string;
  organization_id: string;
  workspace_id: string;
  namespace: string;
  type: string;
  reason: string;
  message: string;
  source: string;
  involved_kind: string;
  involved_name: string;
  count: number;
  first_timestamp: string;
  last_timestamp: string;
}

export interface KubernetesNodeLogRecord {
  timestamp: string;
  cluster_id: string;
  organization_id: string;
  workspace_id: string;
  node_name: string;
  source: string;
  log_line: string;
}

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger(MODULE_NAME);
  private client: ClickHouseClient;
  private database: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const hostOrUrl = this.configService.get<string>(
      "CLICKHOUSE_HOST",
      "localhost",
    );
    const port = this.configService.get<number>("CLICKHOUSE_PORT", 8123);
    const database = this.configService.get<string>(
      "CLICKHOUSE_DB",
      "telemetryflow_db",
    );
    const username = this.configService.get<string>(
      "CLICKHOUSE_USER",
      "default",
    );
    const password = this.configService.get<string>("CLICKHOUSE_PASSWORD", "");

    // Build URL: if CLICKHOUSE_HOST is already a URL use it as-is, otherwise construct from host+port
    const url =
      hostOrUrl.startsWith("http://") || hostOrUrl.startsWith("https://")
        ? hostOrUrl
        : `http://${hostOrUrl}:${port}`;

    const requestTimeout = this.configService.get<number>(
      "CLICKHOUSE_REQUEST_TIMEOUT",
      120,
    );

    this.database = database;
    this.client = createClient({
      url,
      database,
      username,
      password,
      request_timeout: requestTimeout * 1000, // ms — transport-level safety net
    });

    this.logger.log(`ClickHouse client initialized: ${url}/${database}`);
  }

  getClient(): ClickHouseClient {
    return this.client;
  }

  /**
   * Returns the configured ClickHouse database name (e.g. "telemetryflow_db").
   * Use this to build fully-qualified table references: `${db}.tablename`
   */
  getDatabase(): string {
    return this.database;
  }

  /**
   * Qualify a table name with the configured database prefix.
   * e.g. qualifyTable("metrics") → "telemetryflow_db.metrics"
   */
  qualifyTable(table: string): string {
    return `${this.database}.${table}`;
  }

  // ==================== LOGS ====================

  async insertLog(log: LogRecord): Promise<void> {
    try {
      await this.client.insert({
        table: this.qualifyTable("logs"),
        values: [log],
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(`Failed to insert log: ${error.message}`, error.stack);
      throw error;
    }
  }

  async insertLogs(logs: LogRecord[]): Promise<void> {
    if (logs.length === 0) return;

    try {
      await this.client.insert({
        table: this.qualifyTable("logs"),
        values: logs,
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(`Failed to insert logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  async queryLogs(params: {
    startTime?: Date;
    endTime?: Date;
    service_name?: string;
    severity?: string;
    trace_id?: string;
    organization_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<LogRecord[]> {
    const {
      startTime,
      endTime,
      service_name,
      severity,
      trace_id,
      organization_id,
      limit = 100,
      offset = 0,
    } = params;

    const conditions: string[] = [];
    const queryParams: Record<string, string | number> = {
      qLimit: limit,
      qOffset: offset,
    };

    if (startTime) {
      conditions.push("timestamp >= {startTime:DateTime64(9)}");
      queryParams.startTime = startTime.toISOString().replace("T", " ").replace("Z", "");
    }
    if (endTime) {
      conditions.push("timestamp <= {endTime:DateTime64(9)}");
      queryParams.endTime = endTime.toISOString().replace("T", " ").replace("Z", "");
    }
    if (service_name) {
      conditions.push("service_name = {service_name:String}");
      queryParams.service_name = service_name;
    }
    if (severity) {
      conditions.push("severity_text = {severity:String}");
      queryParams.severity = severity;
    }
    if (trace_id) {
      conditions.push("trace_id = {trace_id:String}");
      queryParams.trace_id = trace_id;
    }
    if (organization_id) {
      conditions.push("organization_id = {organization_id:String}");
      queryParams.organization_id = organization_id;
    }

    const where = conditions.length > 0 ? conditions.join(" AND ") : "1=1";
    const logsTable = this.qualifyTable("logs");
    const query = `
      SELECT
        timestamp, observed_timestamp, trace_id, span_id, trace_flags,
        severity_text, severity_number, service_name,
        organization_id, workspace_id, tenant_id,
        body, resource_attributes, scope_name, scope_version, log_attributes
      FROM ${logsTable}
      WHERE ${where}
      ORDER BY timestamp DESC
      LIMIT {qLimit:UInt32} OFFSET {qOffset:UInt32}`;

    const result = await this.client.query({
      query,
      query_params: queryParams,
      format: "JSONEachRow",
    });
    return result.json() as Promise<LogRecord[]>;
  }

  // ==================== METRICS ====================

  async insertMetric(metric: MetricRecord): Promise<void> {
    try {
      await this.client.insert({
        table: this.qualifyTable("metrics"),
        values: [metric],
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(
        `Failed to insert metric: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async insertMetrics(metrics: MetricRecord[]): Promise<void> {
    if (metrics.length === 0) return;

    try {
      await this.client.insert({
        table: this.qualifyTable("metrics"),
        values: metrics,
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(
        `Failed to insert metrics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async queryMetrics(params: {
    startTime?: Date;
    endTime?: Date;
    service_name?: string;
    metric_name?: string;
    organization_id?: string;
    limit?: number;
  }): Promise<MetricRecord[]> {
    const {
      startTime,
      endTime,
      service_name,
      metric_name,
      organization_id,
      limit = TELEMETRYFLOW_SOFT_LIMIT,
    } = params;

    const conditions: string[] = [];
    const queryParams: Record<string, string | number> = { qLimit: Math.min(limit, TELEMETRYFLOW_HARD_LIMIT) };

    if (startTime) {
      conditions.push("timestamp >= {startTime:DateTime64(9)}");
      queryParams.startTime = startTime.toISOString().replace("T", " ").replace("Z", "");
    }
    if (endTime) {
      conditions.push("timestamp <= {endTime:DateTime64(9)}");
      queryParams.endTime = endTime.toISOString().replace("T", " ").replace("Z", "");
    }
    if (service_name) {
      conditions.push("service_name = {service_name:String}");
      queryParams.service_name = service_name;
    }
    if (metric_name) {
      conditions.push("metric_name = {metric_name:String}");
      queryParams.metric_name = metric_name;
    }
    if (organization_id) {
      conditions.push("organization_id = {organization_id:String}");
      queryParams.organization_id = organization_id;
    }

    const where = conditions.length > 0 ? conditions.join(" AND ") : "1=1";
    const metricsTable = this.qualifyTable("metrics");
    const query = `
      SELECT
        timestamp, metric_name, metric_type, value, service_name,
        organization_id, workspace_id, tenant_id,
        resource_attributes, metric_attributes, unit
      FROM ${metricsTable}
      WHERE ${where}
      ORDER BY timestamp DESC
      LIMIT {qLimit:UInt32}`;

    const result = await this.client.query({
      query,
      query_params: queryParams,
      format: "JSONEachRow",
    });
    return result.json() as Promise<MetricRecord[]>;
  }

  // ==================== TRACES ====================

  async insertTrace(trace: TraceRecord): Promise<void> {
    try {
      await this.client.insert({
        table: this.qualifyTable("traces"),
        values: [trace],
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(
        `Failed to insert trace: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async insertTraces(traces: TraceRecord[]): Promise<void> {
    if (traces.length === 0) return;

    try {
      await this.client.insert({
        table: this.qualifyTable("traces"),
        values: traces,
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(
        `Failed to insert traces: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async queryTraces(params: {
    startTime?: Date;
    endTime?: Date;
    service_name?: string;
    trace_id?: string;
    organization_id?: string;
    limit?: number;
  }): Promise<TraceRecord[]> {
    const {
      startTime,
      endTime,
      service_name,
      trace_id,
      organization_id,
      limit = 100,
    } = params;

    const conditions: string[] = [];
    const queryParams: Record<string, string | number> = { qLimit: limit };

    if (startTime) {
      conditions.push("timestamp >= {startTime:DateTime64(9)}");
      queryParams.startTime = startTime.toISOString().replace("T", " ").replace("Z", "");
    }
    if (endTime) {
      conditions.push("timestamp <= {endTime:DateTime64(9)}");
      queryParams.endTime = endTime.toISOString().replace("T", " ").replace("Z", "");
    }
    if (service_name) {
      conditions.push("service_name = {service_name:String}");
      queryParams.service_name = service_name;
    }
    if (trace_id) {
      conditions.push("trace_id = {trace_id:String}");
      queryParams.trace_id = trace_id;
    }
    if (organization_id) {
      conditions.push("organization_id = {organization_id:String}");
      queryParams.organization_id = organization_id;
    }

    const where = conditions.length > 0 ? conditions.join(" AND ") : "1=1";
    const tracesTable = this.qualifyTable("traces");
    const query = `
      SELECT
        timestamp, trace_id, span_id, parent_span_id, span_name, span_kind,
        service_name, organization_id, workspace_id, tenant_id,
        status_code, status_message, duration_ns,
        resource_attributes, span_attributes, events
      FROM ${tracesTable}
      WHERE ${where}
      ORDER BY timestamp DESC
      LIMIT {qLimit:UInt32}`;

    const result = await this.client.query({
      query,
      query_params: queryParams,
      format: "JSONEachRow",
    });
    return result.json() as Promise<TraceRecord[]>;
  }

  // ==================== EXEMPLARS ====================

  async insertExemplars(exemplars: ExemplarRecord[]): Promise<void> {
    if (exemplars.length === 0) return;

    try {
      await this.client.insert({
        table: this.qualifyTable("exemplars"),
        values: exemplars,
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(
        `Failed to insert exemplars: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ==================== KUBERNETES METRICS ====================

  async insertKubernetesMetrics(records: KubernetesMetricRecord[]): Promise<void> {
    if (records.length === 0) return;
    try {
      await this.client.insert({
        table: this.qualifyTable("kubernetes_metrics"),
        values: records,
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(`Failed to insert K8s metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  async insertKubernetesPodLogs(records: KubernetesPodLogRecord[]): Promise<void> {
    if (records.length === 0) return;
    try {
      await this.client.insert({
        table: this.qualifyTable("kubernetes_pod_logs"),
        values: records,
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(`Failed to insert K8s pod logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Dual-write pod logs to the main unified logs table.
   *
   * Maps KubernetesPodLogRecord → LogRecord using OTLP semantic conventions:
   *   - service_name = 'k8s.pod' (stable prefix for efficient ORDER BY range scans)
   *   - body = log_line
   *   - resource_attributes = k8s.* attributes (queryable via bloom filter indexes)
   *
   * This enables pod logs to appear in the unified Logs view/search alongside
   * application traces and OTLP logs, while kubernetes_pod_logs retains the
   * K8s-specific view with 7-day TTL for the Kubernetes monitoring dashboard.
   *
   * Write errors are non-fatal — the primary kubernetes_pod_logs write path
   * is not affected if this secondary write fails.
   */
  async insertKubernetesPodLogsToMainLogs(records: KubernetesPodLogRecord[]): Promise<void> {
    if (records.length === 0) return;
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    const logRecords: LogRecord[] = records.map((r) => ({
      timestamp: r.timestamp,
      observed_timestamp: now,
      trace_id: "",
      span_id: "",
      trace_flags: 0,
      severity_text: "INFO",
      severity_number: 9,
      service_name: "k8s.pod",
      organization_id: r.organization_id,
      workspace_id: r.workspace_id,
      tenant_id: "",
      body: r.log_line,
      resource_attributes: {
        "k8s.cluster.id": r.cluster_id,
        "k8s.namespace.name": r.namespace,
        "k8s.pod.name": r.pod_name,
        "k8s.container.name": r.container_name,
        "k8s.node.name": r.node_name,
        "k8s.deployment.name": r.deployment_name,
        ...r.labels,
      },
      scope_name: "k8s-pod-logs",
      scope_version: "1.0.0",
      log_attributes: {},
    }));

    try {
      await this.insertLogs(logRecords);
    } catch (error) {
      this.logger.error(
        `Failed to dual-write pod logs to main logs table: ${error.message}`,
        error.stack,
      );
      // Non-fatal — primary kubernetes_pod_logs write already succeeded
    }
  }

  // ==================== AUDIT LOGS DUAL-WRITE ====================

  /**
   * Dual-write audit events to the main unified logs table.
   *
   * Maps audit log row → LogRecord using a consistent convention:
   *   - service_name = 'audit'
   *   - scope_name   = 'audit-logs'
   *   - body         = human-readable summary of the audit event
   *   - resource_attributes = audit.* prefixed fields for filtering
   *
   * This enables audit events to appear in the unified Logs view alongside
   * application/K8s logs, while audit_logs retains the compliance-specific
   * view with 90-day TTL.
   *
   * Write errors are non-fatal — the primary audit_logs write is not affected.
   */
  async insertAuditLogsToMainLogs(row: {
    timestamp: string;
    event_type: string;
    action: string;
    resource: string;
    resource_id: string;
    result: string;
    user_id: string;
    user_email: string;
    ip_address: string;
    organization_id: string;
    workspace_id: string;
    tenant_id: string;
    duration_ms: number;
    error_message: string;
  }): Promise<void> {
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");

    // Map result to severity
    let severity_text = "INFO";
    let severity_number = 9;
    if (row.result === "FAILURE" || row.result === "DENIED") {
      if (row.event_type === "AUTH") {
        severity_text = "WARN";
        severity_number = 13;
      } else {
        severity_text = "ERROR";
        severity_number = 17;
      }
    }

    const resourcePart = row.resource ? ` ${row.resource}` : "";
    const logRecord: LogRecord = {
      timestamp: row.timestamp,
      observed_timestamp: now,
      trace_id: "",
      span_id: "",
      trace_flags: 0,
      severity_text,
      severity_number,
      service_name: "audit",
      organization_id: row.organization_id || "",
      workspace_id: row.workspace_id || "",
      tenant_id: row.tenant_id || "",
      body: `[${row.event_type}] ${row.action}${resourcePart} → ${row.result}`,
      resource_attributes: {
        "audit.user_id": row.user_id || "",
        "audit.user_email": row.user_email || "",
        "audit.event_type": row.event_type || "",
        "audit.action": row.action || "",
        "audit.resource": row.resource || "",
        "audit.resource_id": row.resource_id || "",
        "audit.result": row.result || "",
        "audit.ip_address": row.ip_address || "",
      },
      scope_name: "audit-logs",
      scope_version: "1.0.0",
      log_attributes: {},
    };

    try {
      await this.insertLogs([logRecord]);
    } catch (error) {
      this.logger.error(
        `Failed to dual-write audit log to main logs table: ${error.message}`,
        error.stack,
      );
      // Non-fatal — primary audit_logs write already succeeded
    }
  }

  // ==================== AGENT LOGS DUAL-WRITE ====================

  /**
   * Dual-write agent heartbeat events to the main unified logs table.
   *
   * Maps agent heartbeat data → LogRecord:
   *   - service_name = 'tfo.agent'
   *   - scope_name   = 'agent-logs'
   *
   * Write errors are non-fatal.
   */
  async insertAgentLogsToMainLogs(records: {
    timestamp: string;
    agent_id: string;
    hostname: string;
    status: string;
    message: string;
    organization_id: string;
    workspace_id: string;
    tenant_id: string;
  }[]): Promise<void> {
    if (records.length === 0) return;
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");

    const logRecords: LogRecord[] = records.map((r) => ({
      timestamp: r.timestamp,
      observed_timestamp: now,
      trace_id: "",
      span_id: "",
      trace_flags: 0,
      severity_text: r.status === "HEALTHY" ? "INFO" : "WARN",
      severity_number: r.status === "HEALTHY" ? 9 : 13,
      service_name: "tfo.agent",
      organization_id: r.organization_id || "",
      workspace_id: r.workspace_id || "",
      tenant_id: r.tenant_id || "",
      body: r.message,
      resource_attributes: {
        "agent.id": r.agent_id || "",
        "agent.hostname": r.hostname || "",
        "agent.status": r.status || "",
      },
      scope_name: "agent-logs",
      scope_version: "1.0.0",
      log_attributes: {},
    }));

    try {
      await this.insertLogs(logRecords);
    } catch (error) {
      this.logger.error(
        `Failed to dual-write agent logs to main logs table: ${error.message}`,
        error.stack,
      );
    }
  }

  // ==================== INFRASTRUCTURE LOGS DUAL-WRITE ====================

  /**
   * Dual-write infrastructure/VM events to the main unified logs table.
   *
   * Maps VM heartbeat metrics → LogRecord:
   *   - service_name = 'tfo.infrastructure'
   *   - scope_name   = 'infra-logs'
   *
   * Write errors are non-fatal.
   */
  async insertInfraLogsToMainLogs(records: {
    timestamp: string;
    vm_id: string;
    hostname: string;
    event: string;
    message: string;
    organization_id: string;
    workspace_id: string;
    tenant_id: string;
  }[]): Promise<void> {
    if (records.length === 0) return;
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");

    const logRecords: LogRecord[] = records.map((r) => ({
      timestamp: r.timestamp,
      observed_timestamp: now,
      trace_id: "",
      span_id: "",
      trace_flags: 0,
      severity_text: "INFO",
      severity_number: 9,
      service_name: "tfo.infrastructure",
      organization_id: r.organization_id || "",
      workspace_id: r.workspace_id || "",
      tenant_id: r.tenant_id || "",
      body: r.message,
      resource_attributes: {
        "vm.id": r.vm_id || "",
        "vm.hostname": r.hostname || "",
        "infra.event": r.event || "",
      },
      scope_name: "infra-logs",
      scope_version: "1.0.0",
      log_attributes: {},
    }));

    try {
      await this.insertLogs(logRecords);
    } catch (error) {
      this.logger.error(
        `Failed to dual-write infra logs to main logs table: ${error.message}`,
        error.stack,
      );
    }
  }

  // ==================== UPTIME LOGS DUAL-WRITE ====================

  /**
   * Dual-write uptime check results to the main unified logs table.
   * Maps uptime check → LogRecord with service_name = 'tfo.uptime'.
   * Write errors are non-fatal.
   */
  async insertUptimeLogsToMainLogs(records: {
    timestamp: string;
    monitor_id: string;
    monitor_name: string;
    status: string;
    status_code?: number;
    response_time: number;
    message?: string;
    error?: string;
    target_url: string;
    organization_id: string;
    workspace_id: string;
    tenant_id: string;
  }[]): Promise<void> {
    if (records.length === 0) return;
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");

    const logRecords: LogRecord[] = records.map((r) => {
      const isDown = r.status !== "success";
      return {
        timestamp: r.timestamp,
        observed_timestamp: now,
        trace_id: "",
        span_id: "",
        trace_flags: 0,
        severity_text: isDown ? "ERROR" : "INFO",
        severity_number: isDown ? 17 : 9,
        service_name: "tfo.uptime",
        organization_id: r.organization_id || "",
        workspace_id: r.workspace_id || "",
        tenant_id: r.tenant_id || "",
        body: isDown
          ? `Uptime check FAILED: ${r.monitor_name} (${r.target_url}) - ${r.error || r.message || "timeout"}`
          : `Uptime check OK: ${r.monitor_name} (${r.target_url}) ${r.response_time}ms`,
        resource_attributes: {
          "uptime.monitor_id": r.monitor_id || "",
          "uptime.monitor_name": r.monitor_name || "",
          "uptime.target": r.target_url || "",
          "uptime.status": r.status || "",
          "uptime.status_code": String(r.status_code || ""),
          "uptime.response_time_ms": String(r.response_time || 0),
        },
        scope_name: "uptime-logs",
        scope_version: "1.0.0",
        log_attributes: {},
      };
    });

    try {
      await this.insertLogs(logRecords);
    } catch (error) {
      this.logger.error(
        `Failed to dual-write uptime logs to main logs table: ${error.message}`,
        error.stack,
      );
    }
  }

  // ==================== STATUS PAGE LOGS DUAL-WRITE ====================

  /**
   * Dual-write status page incident events to the main unified logs table.
   * Maps incident events → LogRecord with service_name = 'tfo.status-page'.
   * Write errors are non-fatal.
   */
  async insertStatusPageLogsToMainLogs(records: {
    timestamp: string;
    incident_id: string;
    incident_title: string;
    status: string;
    impact: string;
    message?: string;
    status_page_id: string;
    organization_id: string;
    workspace_id: string;
    tenant_id: string;
  }[]): Promise<void> {
    if (records.length === 0) return;
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");

    const logRecords: LogRecord[] = records.map((r) => {
      const isHighImpact = r.impact === "critical" || r.impact === "major";
      return {
        timestamp: r.timestamp,
        observed_timestamp: now,
        trace_id: "",
        span_id: "",
        trace_flags: 0,
        severity_text: isHighImpact ? "ERROR" : r.impact === "minor" ? "WARN" : "INFO",
        severity_number: isHighImpact ? 17 : r.impact === "minor" ? 13 : 9,
        service_name: "tfo.status-page",
        organization_id: r.organization_id || "",
        workspace_id: r.workspace_id || "",
        tenant_id: r.tenant_id || "",
        body: `[${r.status.toUpperCase()}] ${r.incident_title}${r.message ? " - " + r.message : ""}`,
        resource_attributes: {
          "status_page.incident_id": r.incident_id || "",
          "status_page.incident_title": r.incident_title || "",
          "status_page.status": r.status || "",
          "status_page.impact": r.impact || "",
          "status_page.page_id": r.status_page_id || "",
        },
        scope_name: "status-page-logs",
        scope_version: "1.0.0",
        log_attributes: {},
      };
    });

    try {
      await this.insertLogs(logRecords);
    } catch (error) {
      this.logger.error(
        `Failed to dual-write status page logs to main logs table: ${error.message}`,
        error.stack,
      );
    }
  }

  // ==================== K8S EVENTS DUAL-WRITE ====================

  /**
   * Dual-write Kubernetes events to the main unified logs table.
   * Maps K8s events → LogRecord with service_name = 'k8s.events'.
   * Write errors are non-fatal.
   */
  async insertK8sEventsToMainLogs(records: {
    timestamp: string;
    cluster_id: string;
    type: string;
    reason: string;
    message: string;
    source: string;
    involved_kind: string;
    involved_name: string;
    namespace: string;
    count: number;
    organization_id: string;
    workspace_id: string;
    tenant_id: string;
  }[]): Promise<void> {
    if (records.length === 0) return;
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");

    const logRecords: LogRecord[] = records.map((r) => {
      const isWarning = r.type === "Warning";
      return {
        timestamp: r.timestamp,
        observed_timestamp: now,
        trace_id: "",
        span_id: "",
        trace_flags: 0,
        severity_text: isWarning ? "WARN" : "INFO",
        severity_number: isWarning ? 13 : 9,
        service_name: "k8s.events",
        organization_id: r.organization_id || "",
        workspace_id: r.workspace_id || "",
        tenant_id: r.tenant_id || "",
        body: `[${r.type}] ${r.involved_kind}/${r.involved_name}: ${r.reason} - ${r.message}`,
        resource_attributes: {
          "k8s.cluster.id": r.cluster_id || "",
          "k8s.namespace.name": r.namespace || "",
          "k8s.event.type": r.type || "",
          "k8s.event.reason": r.reason || "",
          "k8s.event.source": r.source || "",
          "k8s.event.involved_kind": r.involved_kind || "",
          "k8s.event.involved_name": r.involved_name || "",
          "k8s.event.count": String(r.count || 1),
        },
        scope_name: "k8s-events",
        scope_version: "1.0.0",
        log_attributes: {},
      };
    });

    try {
      await this.insertLogs(logRecords);
    } catch (error) {
      this.logger.error(
        `Failed to dual-write K8s events to main logs table: ${error.message}`,
        error.stack,
      );
    }
  }

  // ==================== K8S EVENTS DEDICATED TABLE ====================

  /**
   * Insert K8s events into the dedicated kubernetes_events ClickHouse table.
   * This is the primary write for event analytics (14-day TTL).
   * The dual-write to the unified logs table is handled separately.
   */
  async insertK8sEvents(records: KubernetesEventRecord[]): Promise<void> {
    if (records.length === 0) return;
    try {
      await this.getClient().insert({
        table: this.qualifyTable("kubernetes_events"),
        values: records,
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(
        `Failed to insert K8s events to kubernetes_events table: ${error.message}`,
        error.stack,
      );
    }
  }

  // ==================== K8S NODE LOGS ====================

  /**
   * Insert K8s node logs into the dedicated kubernetes_node_logs ClickHouse table.
   * Primary write for node-level logs (kubelet, kube-proxy, containerd) with 7-day TTL.
   */
  async insertK8sNodeLogs(records: KubernetesNodeLogRecord[]): Promise<void> {
    if (records.length === 0) return;
    try {
      await this.getClient().insert({
        table: this.qualifyTable("kubernetes_node_logs"),
        values: records,
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(
        `Failed to insert K8s node logs: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Dual-write K8s node logs to the main unified logs table.
   * Maps node log records → LogRecord with service_name = 'k8s.node'.
   * Write errors are non-fatal.
   */
  async insertK8sNodeLogsToMainLogs(records: KubernetesNodeLogRecord[]): Promise<void> {
    if (records.length === 0) return;
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");

    const logRecords: LogRecord[] = records.map((r) => ({
      timestamp: r.timestamp,
      observed_timestamp: now,
      trace_id: "",
      span_id: "",
      trace_flags: 0,
      severity_text: "INFO",
      severity_number: 9,
      service_name: "k8s.node",
      organization_id: r.organization_id || "",
      workspace_id: r.workspace_id || "",
      tenant_id: "",
      body: r.log_line,
      resource_attributes: {
        "k8s.cluster.id": r.cluster_id,
        "k8s.node.name": r.node_name,
        "k8s.node.log.source": r.source,
      },
      scope_name: "k8s-node-logs",
      scope_version: "1.0.0",
      log_attributes: {},
    }));

    try {
      await this.insertLogs(logRecords);
    } catch (error) {
      this.logger.error(
        `Failed to dual-write K8s node logs to main logs table: ${error.message}`,
        error.stack,
      );
    }
  }

  // ==================== PROMETHEUS METRICS ====================

  async insertPrometheusMetrics(records: PrometheusMetricRecord[]): Promise<void> {
    if (records.length === 0) return;
    try {
      await this.client.insert({
        table: this.qualifyTable("prometheus_metrics"),
        values: records,
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(`Failed to insert Prometheus metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==================== VM METRICS ====================

  async insertVMMetrics(records: VMMetricRecord[]): Promise<void> {
    if (records.length === 0) return;

    try {
      const table = this.qualifyTable("vm_metrics");
      await this.client.insert({
        table,
        values: records,
        format: "JSONEachRow",
      });
    } catch (error) {
      this.logger.error(
        `Failed to insert VM metrics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async queryVMMetrics(params: {
    vmId: string;
    startTime?: Date;
    endTime?: Date;
    metricName?: string;
    organizationId?: string;
    limit?: number;
  }): Promise<VMMetricRecord[]> {
    const { vmId, startTime, endTime, metricName, organizationId, limit = TELEMETRYFLOW_SOFT_LIMIT } = params;

    const conditions: string[] = ["vm_id = {vmId:UUID}"];
    const queryParams: Record<string, string | number> = { vmId, qLimit: limit };

    if (startTime) {
      conditions.push("timestamp >= {startTime:DateTime64(3)}");
      queryParams.startTime = startTime.toISOString().replace("T", " ").replace("Z", "");
    }
    if (endTime) {
      conditions.push("timestamp <= {endTime:DateTime64(3)}");
      queryParams.endTime = endTime.toISOString().replace("T", " ").replace("Z", "");
    }
    if (metricName) {
      conditions.push("metric_name = {metricName:String}");
      queryParams.metricName = metricName;
    }
    if (organizationId) {
      conditions.push("organization_id = {organizationId:String}");
      queryParams.organizationId = organizationId;
    }

    const vmMetricsTable = this.qualifyTable("vm_metrics");
    const query = `
      SELECT timestamp, vm_id, metric_name, value, unit, labels,
             organization_id, workspace_id, tenant_id
      FROM ${vmMetricsTable}
      WHERE ${conditions.join(" AND ")}
      ORDER BY timestamp DESC
      LIMIT {qLimit:UInt32}`;

    const result = await this.client.query({
      query,
      query_params: queryParams,
      format: "JSONEachRow",
    });
    return result.json() as Promise<VMMetricRecord[]>;
  }

  // ==================== UTILITY ====================

  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      this.logger.error(`ClickHouse ping failed: ${error.message}`);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
    this.logger.log(`ClickHouse client closed`);
  }
}
