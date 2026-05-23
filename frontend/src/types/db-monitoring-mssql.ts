export type AuthType = "sql_server" | "windows_ntlm" | "windows_kerberos";
export type InstanceStatus = "online" | "offline" | "degraded" | "unknown";
export type EngineEdition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type WaitCategoryType = "CPU" | "IO" | "Lock" | "Latch" | "Network" | "Memory" | "Parallelism" | "AlwaysOn";
export type RuleOperator = "gt" | "gte" | "lt" | "lte" | "eq";
export type RuleSeverity = "info" | "warning" | "critical";

export interface MssqlInstance {
  id: string;
  name: string;
  displayName?: string;
  host: string;
  port: number;
  instanceName?: string;
  authType: AuthType;
  username?: string;
  domain?: string;
  databaseName: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
  edition?: string;
  productVersion?: string;
  engineEdition?: EngineEdition;
  status: InstanceStatus;
  lastSeenAt?: string;
  tags: Record<string, unknown>;
  collectionIntervalSeconds: number;
  queryAnalyticsEnabled: boolean;
  indexMonitoringEnabled: boolean;
  agMonitoringEnabled: boolean;
  includeDatabases?: string[];
  excludeDatabases?: string[];
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MssqlInstanceDetail extends MssqlInstance {
  latestMetrics?: MssqlMetricPoint[];
}

export interface MssqlMetricsSummary {
  totalInstances: number;
  onlineInstances: number;
  offlineInstances: number;
  degradedInstances: number;
  unknownInstances: number;
}

export interface MssqlInstanceListResult {
  data: MssqlInstance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MssqlMetricPoint {
  timestamp: string;
  metric_name: string;
  value: number;
  labels?: Record<string, string>;
}

export interface MssqlMetricsResponse {
  instanceId: string;
  from: string;
  to: string;
  step: number;
  table: string;
  series: MssqlMetricPoint[];
}

export interface MssqlQueryStats {
  query_hash: string;
  sql_text: string;
  database_name: string;
  execution_count: number;
  total_worker_time_us: number;
  total_elapsed_time_us: number;
  total_logical_reads: number;
  total_logical_writes: number;
  total_rows: number;
}

export interface MssqlQueryDetail {
  query_hash: string;
  sql_text: string;
  database_name: string;
  execution_count: number;
  total_worker_time_us: number;
  total_elapsed_time_us: number;
  total_logical_reads: number;
  trend: MssqlQueryTrendPoint[];
}

export interface MssqlQueryTrendPoint {
  hour: string;
  execution_count: number;
  total_worker_time_us: number;
  total_elapsed_time_us: number;
  total_logical_reads: number;
}

export interface MssqlWaitStats {
  wait_type: string;
  wait_category: WaitCategoryType;
  waiting_tasks_count: number;
  wait_time_ms: number;
  signal_wait_time_ms: number;
  resource_wait_time_ms: number;
  max_wait_time_ms: number;
}

export interface MssqlWaitCategory {
  wait_category: WaitCategoryType;
  total_wait_time_ms: number;
  total_waiting_tasks: number;
  total_signal_wait_ms: number;
  total_resource_wait_ms: number;
}

export interface MssqlWaitTrendPoint {
  hour: string;
  wait_category: WaitCategoryType;
  total_wait_time_ms: number;
  total_waiting_tasks: number;
}

export interface MssqlMonitoringRule {
  id: string;
  instanceId: string;
  metricName: string;
  operator: RuleOperator;
  threshold: number;
  durationSeconds: number;
  severity: RuleSeverity;
  enabled: boolean;
  notificationChannelIds: string[];
  cooldownSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface MssqlStats {
  totalInstances: number;
  onlineInstances: number;
  offlineInstances: number;
  degradedInstances: number;
  unknownInstances: number;
}

export interface MssqlMetricsQuery {
  metric_names?: string[];
  from?: string;
  to?: string;
  step?: string;
  timezone?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  host: string;
  port: number;
  message: string;
  edition?: string;
  productVersion?: string;
}
