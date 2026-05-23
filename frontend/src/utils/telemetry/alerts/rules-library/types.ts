/**
 * Alert Rules Library Types
 * Mirrors backend types for frontend use
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
  POSTGRESQL = "postgresql",
  MONGODB = "mongodb",
  REDIS = "redis",
  ELASTICSEARCH = "elasticsearch",
  CLICKHOUSE = "clickhouse",
  CASSANDRA = "cassandra",

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
  sourceType?: AlertSourceType;
  queryLanguage?: QueryLanguage;
  queryTarget?: string;
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

/**
 * Category display configuration
 */
export interface CategoryDisplayConfig {
  id: RuleCategory;
  label: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * Category display configurations for UI
 */
export const CategoryDisplayConfigs: CategoryDisplayConfig[] = [
  // Host & Infrastructure
  {
    id: RuleCategory.HOST_HARDWARE,
    label: "Host & Hardware",
    icon: "carbon:bare-metal-server",
    color: "#6366f1",
    description: "Server and hardware monitoring",
  },
  {
    id: RuleCategory.PROMETHEUS,
    label: "Prometheus",
    icon: "logos:prometheus",
    color: "#e6522c",
    description: "Prometheus self-monitoring",
  },

  // Containers
  {
    id: RuleCategory.DOCKER,
    label: "Docker",
    icon: "logos:docker-icon",
    color: "#2496ed",
    description: "Container monitoring",
  },
  {
    id: RuleCategory.KUBERNETES,
    label: "Kubernetes",
    icon: "logos:kubernetes",
    color: "#326ce5",
    description: "Kubernetes cluster monitoring",
  },
  {
    id: RuleCategory.ALERTMANAGER,
    label: "Alertmanager",
    icon: "logos:prometheus",
    color: "#e6522c",
    description: "Prometheus Alertmanager monitoring",
  },
  {
    id: RuleCategory.ETCD,
    label: "etcd",
    icon: "simple-icons:etcd",
    color: "#419eda",
    description: "etcd distributed key-value store monitoring",
  },

  // Databases
  {
    id: RuleCategory.MYSQL,
    label: "MySQL",
    icon: "logos:mysql",
    color: "#4479a1",
    description: "MySQL database monitoring",
  },
  {
    id: RuleCategory.POSTGRESQL,
    label: "PostgreSQL",
    icon: "logos:postgresql",
    color: "#336791",
    description: "PostgreSQL database monitoring",
  },
  {
    id: RuleCategory.MONGODB,
    label: "MongoDB",
    icon: "logos:mongodb",
    color: "#13aa52",
    description: "MongoDB database monitoring",
  },
  {
    id: RuleCategory.REDIS,
    label: "Redis",
    icon: "logos:redis",
    color: "#dc382d",
    description: "Redis cache monitoring",
  },
  {
    id: RuleCategory.ELASTICSEARCH,
    label: "Elasticsearch",
    icon: "logos:elasticsearch",
    color: "#005571",
    description: "Elasticsearch cluster monitoring",
  },

  // Message Queues
  {
    id: RuleCategory.RABBITMQ,
    label: "RabbitMQ",
    icon: "logos:rabbitmq",
    color: "#ff6600",
    description: "RabbitMQ message broker monitoring",
  },
  {
    id: RuleCategory.KAFKA,
    label: "Kafka",
    icon: "logos:kafka",
    color: "#231f20",
    description: "Apache Kafka monitoring",
  },

  // Web Servers
  {
    id: RuleCategory.NGINX,
    label: "Nginx",
    icon: "logos:nginx",
    color: "#009639",
    description: "Nginx web server monitoring",
  },
  {
    id: RuleCategory.HAPROXY,
    label: "HAProxy",
    icon: "simple-icons:haproxy",
    color: "#106da9",
    description: "HAProxy load balancer monitoring",
  },
  {
    id: RuleCategory.TRAEFIK,
    label: "Traefik",
    icon: "logos:traefik",
    color: "#37abc8",
    description: "Traefik edge router monitoring",
  },

  // Network & Security
  {
    id: RuleCategory.BLACKBOX,
    label: "Blackbox",
    icon: "mdi:probe",
    color: "#ff5722",
    description: "Endpoint probing and monitoring",
  },
  {
    id: RuleCategory.SSL_TLS,
    label: "SSL/TLS",
    icon: "mdi:certificate",
    color: "#4caf50",
    description: "Certificate monitoring",
  },
  {
    id: RuleCategory.DNS,
    label: "DNS",
    icon: "mdi:dns",
    color: "#03a9f4",
    description: "DNS monitoring",
  },

  // Storage
  {
    id: RuleCategory.CEPH,
    label: "Ceph",
    icon: "logos:ceph",
    color: "#ef5c55",
    description: "Ceph storage monitoring",
  },
  {
    id: RuleCategory.MINIO,
    label: "MinIO",
    icon: "simple-icons:minio",
    color: "#c72c48",
    description: "MinIO object storage monitoring",
  },

  // Observability
  {
    id: RuleCategory.LOKI,
    label: "Loki",
    icon: "simple-icons:grafana",
    color: "#f46800",
    description: "Grafana Loki log aggregation",
  },
  {
    id: RuleCategory.THANOS,
    label: "Thanos",
    icon: "simple-icons:thanos",
    color: "#6d41a1",
    description: "Thanos distributed Prometheus",
  },
  {
    id: RuleCategory.GRAFANA,
    label: "Grafana",
    icon: "logos:grafana",
    color: "#f46800",
    description: "Grafana monitoring",
  },
  {
    id: RuleCategory.OPENTELEMETRY,
    label: "OpenTelemetry",
    icon: "simple-icons:opentelemetry",
    color: "#425cc7",
    description: "OpenTelemetry Collector monitoring",
  },

  // TelemetryFlow Platform
  {
    id: RuleCategory.TFO_AGENT,
    label: "TFO-Agent",
    icon: "mdi:robot",
    color: "#10b981",
    description: "TelemetryFlow Agent host monitoring",
  },
  {
    id: RuleCategory.TFO_COLLECTOR,
    label: "TFO-Collector",
    icon: "mdi:pipe",
    color: "#8b5cf6",
    description: "TelemetryFlow OTEL Collector monitoring",
  },
];
