/**
 * Log data types for TelemetryFlow-Viz
 */

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export type LogSeverityNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24;

export interface LogAttribute {
  key: string;
  value: string | number | boolean;
}

export interface LogRecord {
  id: string;
  timestamp: number;
  observedTimestamp: number;
  severityNumber: LogSeverityNumber;
  severityText: LogLevel;
  body: string;
  attributes: Record<string, string | number | boolean>;
  resource: Record<string, string>;
  traceId?: string;
  spanId?: string;
  traceFlags?: number;
  scopeName?: string;
}

export interface LogQuery {
  query?: string;
  start: number;
  end: number;
  limit?: number;
  offset?: number;
  severityLevels?: LogLevel[];
  services?: string[];
  sources?: string[];
  traceId?: string;
  k8sNamespace?: string;
  k8sPodName?: string;
  k8sContainerName?: string;
  k8sClusterId?: string;
  k8sNodeName?: string;
  k8sDeploymentName?: string;
  hostName?: string;
}

export interface LogQueryResult {
  status: "success" | "error";
  data: LogRecord[];
  total: number;
  hasMore: boolean;
  error?: string;
}

export interface LogStream {
  labels: Record<string, string>;
  entries: LogRecord[];
}

export interface LogAggregation {
  timestamp: number;
  count: number;
  byLevel: Record<LogLevel, number>;
}

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  trace: 1,
  debug: 2,
  info: 3,
  warn: 4,
  error: 5,
  fatal: 6,
};

export const SEVERITY_TO_LEVEL: Record<number, LogLevel> = {
  1: "trace",
  2: "trace",
  3: "trace",
  4: "trace",
  5: "debug",
  6: "debug",
  7: "debug",
  8: "debug",
  9: "info",
  10: "info",
  11: "info",
  12: "info",
  13: "warn",
  14: "warn",
  15: "warn",
  16: "warn",
  17: "error",
  18: "error",
  19: "error",
  20: "error",
  21: "fatal",
  22: "fatal",
  23: "fatal",
  24: "fatal",
};

// ============================================
// Logs Explorer Types (Elasticsearch-like UI)
// ============================================

export type LogsTabType =
  | "discover"
  | "patterns"
  | "stream"
  | "analytics"
  | "alerts";

export type FilterOperator = ":" | ":*" | "<" | ">" | "<=" | ">=" | "exists";

export interface ParsedFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
  negated: boolean;
  pinned: boolean;
}

export type FieldType = "string" | "number" | "boolean" | "date" | "keyword";

export interface FieldTopValue {
  value: string | number | boolean;
  count: number;
  percentage: number;
}

export interface FieldMetadata {
  name: string;
  path: string;
  type: FieldType;
  count: number;
  isNested: boolean;
  parent?: string;
  topValues: FieldTopValue[];
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: ParsedFilter[];
  columns: string[];
  timeRange?: { start: number; end: number };
  createdAt: number;
  updatedAt: number;
}

// Analytics Types
export interface LogPattern {
  id: string;
  pattern: string;
  count: number;
  percentage: number;
  examples: string[];
  level: LogLevel;
  service?: string;
  firstSeen?: number;
  lastSeen?: number;
  histogram?: number[];
}

export interface ErrorAggregation {
  message: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  services: string[];
}

export interface ServiceBreakdown {
  service: string;
  totalLogs: number;
  errorCount: number;
  errorPercentage: number;
  topError: string;
  avgResponseTime?: number;
}

// Alerts Types
export type AlertConditionOperator = ">" | "<" | ">=" | "<=" | "==" | "!=";

export interface LogAlertCondition {
  field: string;
  operator: AlertConditionOperator;
  value: number;
  timeWindow: number; // in seconds
}

export interface LogAlertRule {
  id: string;
  name: string;
  description: string;
  query: string;
  conditions: LogAlertCondition[];
  severity: "info" | "warning" | "critical";
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
  useDefaultChannels?: boolean;
  channelIds?: string[];
}

export type TriggeredAlertStatus = "firing" | "resolved";

export interface TriggeredAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  status: TriggeredAlertStatus;
  firedAt: number;
  resolvedAt?: number;
  value: number;
  service?: string;
  message: string;
}

// Pattern Detection Types
export interface PatternFacetValue {
  value: string;
  count: number;
  percentage: number;
}

export interface PatternFacet {
  name: string;
  icon: string;
  values: PatternFacetValue[];
}

// ============================================
// Log Source Types
// ============================================
export const LOG_SOURCE_LABELS: Record<string, string> = {
  "": "Application",
  otlp: "Application",
  "k8s-pod-logs": "Kubernetes",
  "k8s-events": "K8S Events",
  "audit-logs": "Audit",
  "agent-logs": "Agent",
  "infra-logs": "Infrastructure",
  "uptime-logs": "Uptime",
  "status-page-logs": "Status Page",
};

export const LOG_SOURCE_COLORS: Record<string, string> = {
  "": "#18a058",
  otlp: "#18a058",
  "k8s-pod-logs": "#326ce5",
  "k8s-events": "#2563eb",
  "audit-logs": "#f0a020",
  "agent-logs": "#8b5cf6",
  "infra-logs": "#06b6d4",
  "uptime-logs": "#10b981",
  "status-page-logs": "#f59e0b",
};

export interface LogPatternDetail {
  id: string;
  pattern: string;
  matches: number;
  volume: number[]; // sparkline data
  service: string;
  level: LogLevel;
  examples: LogRecord[];
  firstSeen: number;
  lastSeen: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
}
