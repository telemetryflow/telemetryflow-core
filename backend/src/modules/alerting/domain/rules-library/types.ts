/**
 * Alert Rules Library Types
 */

export type AlertSeverity = "critical" | "warning" | "info";

/**
 * Alert source type enumeration
 * Defines the data source for alert rules
 */
export enum AlertSourceType {
  PROMETHEUS = "prometheus",
  TFO_AGENT = "tfo-agent",
  TFO_COLLECTOR = "tfo-collector",
  CUSTOM = "custom",
}

/**
 * Query language for alert conditions
 */
export enum QueryLanguage {
  CONDITION = "condition",
  TFQL = "tfql",
  PROMQL = "promql",
  ELASTICSEARCH = "elasticsearch",
  SQL = "sql",
}

export type ConditionOperator =
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "eq"
  | "neq"
  | "contains"
  | "not_contains"
  | "regex"
  | "is_null"
  | "is_not_null";

export type ConditionAggregation =
  | "avg"
  | "sum"
  | "min"
  | "max"
  | "count"
  | "rate"
  | "p50"
  | "p90"
  | "p95"
  | "p99"
  | "last";

/**
 * Alert rule category enumeration
 */
export enum RuleCategory {
  // Host & Infrastructure
  HOST_HARDWARE = "host-hardware",
  PROMETHEUS = "prometheus",
  SMART_DEVICE = "smart-device",

  // Containers & Orchestration
  DOCKER = "docker",
  KUBERNETES = "kubernetes",
  NOMAD = "nomad",
  ALERTMANAGER = "alertmanager",
  ETCD = "etcd",

  // Databases
  MYSQL = "mysql",
  MARIADB = "mariadb",
  PERCONA = "percona",
  POSTGRESQL = "postgresql",
  MONGODB = "mongodb",
  REDIS = "redis",
  ELASTICSEARCH = "elasticsearch",
  CLICKHOUSE = "clickhouse",
  CASSANDRA = "cassandra",
  SQLITE3 = "sqlite3",
  QUERY_ANALYTICS = "query-analytics",

  // Message Queues
  RABBITMQ = "rabbitmq",
  KAFKA = "kafka",
  NATS = "nats",
  PULSAR = "pulsar",

  // Web Servers & Proxies
  NGINX = "nginx",
  APACHE = "apache",
  HAPROXY = "haproxy",
  TRAEFIK = "traefik",

  // Network & Security
  BLACKBOX = "blackbox",
  SSL_TLS = "ssl-tls",
  DNS = "dns",

  // Storage
  CEPH = "ceph",
  MINIO = "minio",
  ZFS = "zfs",

  // Observability
  LOKI = "loki",
  THANOS = "thanos",
  GRAFANA = "grafana",
  OPENTELEMETRY = "opentelemetry",

  // TelemetryFlow Platform
  TFO_AGENT = "tfo-agent",
  TFO_COLLECTOR = "tfo-collector",

  // Windows
  WINDOWS = "windows",

  // VMware
  VMWARE = "vmware",

  // Application Runtime
  JVM = "jvm",
  PHP_FPM = "php-fpm",
  NODEJS = "nodejs",
}

/**
 * Alert condition template
 */
export interface AlertConditionTemplate {
  metric: string;
  aggregation: ConditionAggregation;
  operator: ConditionOperator;
  threshold: number;
  duration: string;
  labels?: Record<string, string>;
}

/**
 * Alert rule template definition
 */
export interface AlertRuleTemplate {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  subcategory?: string;
  severity: AlertSeverity;
  conditions: AlertConditionTemplate[];
  evaluationInterval: string;
  forDuration: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  runbook?: string;
  enabled: boolean;

  // Query configuration
  sourceType: AlertSourceType;
  queryLanguage?: QueryLanguage;
  tfqlQuery?: string;

  // Prometheus query (for reference)
  promql?: string;

  // Source reference
  source?: {
    name: string;
    url?: string;
  };
}

/**
 * Category metadata
 */
export interface CategoryMetadata {
  id: RuleCategory;
  name: string;
  description: string;
  icon: string;
  exporter?: string;
  documentationUrl?: string;
  ruleCount: number;
}

/**
 * Rule group within a category
 */
export interface RuleGroup {
  id: string;
  name: string;
  description: string;
  rules: AlertRuleTemplate[];
}

/**
 * Complete category definition
 */
export interface AlertRuleCategory {
  metadata: CategoryMetadata;
  groups: RuleGroup[];
}

/**
 * Default threshold values for common metrics
 */
export const DefaultThresholds = {
  // CPU
  CPU_USAGE_WARNING: 80,
  CPU_USAGE_CRITICAL: 90,
  CPU_LOAD_WARNING: 0.8,
  CPU_LOAD_CRITICAL: 1.0,

  // Memory
  MEMORY_USAGE_WARNING: 80,
  MEMORY_USAGE_CRITICAL: 90,
  SWAP_USAGE_WARNING: 50,
  SWAP_USAGE_CRITICAL: 80,

  // Disk
  DISK_USAGE_WARNING: 80,
  DISK_USAGE_CRITICAL: 90,
  DISK_INODE_WARNING: 80,
  DISK_INODE_CRITICAL: 90,
  DISK_IO_UTIL_WARNING: 80,
  DISK_IO_UTIL_CRITICAL: 90,

  // Network
  NETWORK_ERROR_RATE_WARNING: 1,
  NETWORK_ERROR_RATE_CRITICAL: 5,
  NETWORK_PACKET_DROP_WARNING: 1,
  NETWORK_PACKET_DROP_CRITICAL: 5,

  // HTTP
  HTTP_ERROR_RATE_WARNING: 1,
  HTTP_ERROR_RATE_CRITICAL: 5,
  HTTP_LATENCY_WARNING_MS: 500,
  HTTP_LATENCY_CRITICAL_MS: 1000,

  // Database
  DB_CONNECTION_USAGE_WARNING: 80,
  DB_CONNECTION_USAGE_CRITICAL: 90,
  DB_REPLICATION_LAG_WARNING_SEC: 30,
  DB_REPLICATION_LAG_CRITICAL_SEC: 60,

  // Container
  CONTAINER_CPU_WARNING: 80,
  CONTAINER_CPU_CRITICAL: 90,
  CONTAINER_MEMORY_WARNING: 80,
  CONTAINER_MEMORY_CRITICAL: 90,

  // SSL
  SSL_EXPIRY_WARNING_DAYS: 30,
  SSL_EXPIRY_CRITICAL_DAYS: 7,

  // TFO-Agent
  AGENT_HEARTBEAT_MISSING_WARNING_SEC: 60,
  AGENT_HEARTBEAT_MISSING_CRITICAL_SEC: 300,
  AGENT_RESPONSE_TIME_WARNING_MS: 500,
  AGENT_RESPONSE_TIME_CRITICAL_MS: 2000,

  // TFO-Collector (OTEL)
  COLLECTOR_DROPPED_SPANS_WARNING: 10,
  COLLECTOR_DROPPED_SPANS_CRITICAL: 100,
  COLLECTOR_DROPPED_METRICS_WARNING: 10,
  COLLECTOR_DROPPED_METRICS_CRITICAL: 100,
  COLLECTOR_DROPPED_LOGS_WARNING: 10,
  COLLECTOR_DROPPED_LOGS_CRITICAL: 100,
  COLLECTOR_QUEUE_SIZE_WARNING: 80,
  COLLECTOR_QUEUE_SIZE_CRITICAL: 95,
  COLLECTOR_EXPORT_FAILURE_WARNING: 5,
  COLLECTOR_EXPORT_FAILURE_CRITICAL: 20,
} as const;

/**
 * Default duration values
 */
export const DefaultDurations = {
  INSTANT: "0s",
  SHORT: "1m",
  MEDIUM: "5m",
  LONG: "15m",
  EXTENDED: "30m",
  HOUR: "1h",
} as const;

/**
 * Default evaluation intervals
 */
export const DefaultIntervals = {
  FAST: "15s",
  NORMAL: "1m",
  SLOW: "5m",
} as const;
