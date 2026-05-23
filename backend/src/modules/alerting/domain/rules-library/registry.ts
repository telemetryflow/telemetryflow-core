/**
 * Alert Rules Registry
 * Central registry for all alert rule templates
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  RuleCategory,
  CategoryMetadata,
} from "./types";

// Import all category rules
import {
  HostHardwareCategory,
  HostHardwareRules,
} from "./categories/host-hardware";
import { ContainersCategory, ContainerRules } from "./categories/containers";
import { KubernetesCategory, KubernetesRules } from "./categories/kubernetes";
import {
  AlertmanagerCategory,
  AlertmanagerRules,
} from "./categories/alertmanager";
import { EtcdCategory, EtcdRules } from "./categories/etcd";
import {
  MySQLCategory,
  MySQLRules,
  MariaDBCategory,
  MariaDBRules,
  PostgreSQLCategory,
  PostgreSQLRules,
  MongoDBCategory,
  MongoDBRules,
  RedisCategory,
  RedisRules,
  ElasticsearchCategory,
  ElasticsearchRules,
  PerconaCategory,
  PerconaRules,
  DatabaseRules,
} from "./categories/databases";
import {
  RabbitMQCategory,
  RabbitMQRules,
  KafkaCategory,
  KafkaRules,
  NATSCategory,
  NATSRules,
  MessageQueueRules,
} from "./categories/message-queues";
import {
  NginxCategory,
  NginxRules,
  ApacheCategory,
  ApacheRules,
  HAProxyCategory,
  HAProxyRules,
  TraefikCategory,
  TraefikRules,
  WebServerRules,
} from "./categories/web-servers";
import {
  BlackboxCategory,
  BlackboxRules,
  SSLTLSCategory,
  SSLTLSRules,
  DNSCategory,
  DNSRules,
  NetworkSecurityRules,
} from "./categories/network-security";
import {
  CephCategory,
  CephRules,
  MinioCategory,
  MinioRules,
  ZFSCategory,
  ZFSRules,
  StorageRules,
} from "./categories/storage";
import {
  PrometheusCategory,
  PrometheusRules,
  LokiCategory,
  LokiRules,
  ThanosCategory,
  ThanosRules,
  GrafanaCategory,
  GrafanaRules,
  OpenTelemetryCategory,
  OpenTelemetryRules,
  ObservabilityRules,
} from "./categories/observability";
import { TFOAgentCategory, TFOAgentRules } from "./categories/tfo-agent";
import {
  TFOCollectorCategory,
  TFOCollectorRules,
} from "./categories/tfo-collector";
import {
  ClickHouseCategory,
  ClickHouseRules,
} from "./categories/clickhouse";

/**
 * All registered categories
 */
export const AlertRulesRegistry: Record<RuleCategory, AlertRuleCategory> = {
  // Host & Infrastructure
  [RuleCategory.HOST_HARDWARE]: HostHardwareCategory,
  [RuleCategory.PROMETHEUS]: PrometheusCategory,
  [RuleCategory.SMART_DEVICE]: HostHardwareCategory, // Subset

  // Containers
  [RuleCategory.DOCKER]: ContainersCategory,

  // Kubernetes & Orchestration
  [RuleCategory.KUBERNETES]: KubernetesCategory,
  [RuleCategory.NOMAD]: KubernetesCategory, // Similar patterns
  [RuleCategory.ALERTMANAGER]: AlertmanagerCategory,
  [RuleCategory.ETCD]: EtcdCategory,

  // Databases
  [RuleCategory.MYSQL]: MySQLCategory,
  [RuleCategory.MARIADB]: MariaDBCategory,
  [RuleCategory.PERCONA]: PerconaCategory,
  [RuleCategory.POSTGRESQL]: PostgreSQLCategory,
  [RuleCategory.MONGODB]: MongoDBCategory,
  [RuleCategory.REDIS]: RedisCategory,
  [RuleCategory.ELASTICSEARCH]: ElasticsearchCategory,
  [RuleCategory.CLICKHOUSE]: ClickHouseCategory,
  [RuleCategory.CASSANDRA]: MongoDBCategory, // Similar patterns
  [RuleCategory.SQLITE3]: PostgreSQLCategory, // Similar patterns

  // Message Queues
  [RuleCategory.RABBITMQ]: RabbitMQCategory,
  [RuleCategory.KAFKA]: KafkaCategory,
  [RuleCategory.NATS]: NATSCategory,
  [RuleCategory.PULSAR]: KafkaCategory, // Similar patterns

  // Web Servers
  [RuleCategory.NGINX]: NginxCategory,
  [RuleCategory.APACHE]: ApacheCategory,
  [RuleCategory.HAPROXY]: HAProxyCategory,
  [RuleCategory.TRAEFIK]: TraefikCategory,

  // Network & Security
  [RuleCategory.BLACKBOX]: BlackboxCategory,
  [RuleCategory.SSL_TLS]: SSLTLSCategory,
  [RuleCategory.DNS]: DNSCategory,

  // Storage
  [RuleCategory.CEPH]: CephCategory,
  [RuleCategory.MINIO]: MinioCategory,
  [RuleCategory.ZFS]: ZFSCategory,

  // Observability
  [RuleCategory.LOKI]: LokiCategory,
  [RuleCategory.THANOS]: ThanosCategory,
  [RuleCategory.GRAFANA]: GrafanaCategory,
  [RuleCategory.OPENTELEMETRY]: OpenTelemetryCategory,

  // TelemetryFlow Platform
  [RuleCategory.TFO_AGENT]: TFOAgentCategory,
  [RuleCategory.TFO_COLLECTOR]: TFOCollectorCategory,

  // Windows
  [RuleCategory.WINDOWS]: HostHardwareCategory, // Similar patterns

  // VMware
  [RuleCategory.VMWARE]: HostHardwareCategory, // Similar patterns

  // Application Runtime
  [RuleCategory.JVM]: OpenTelemetryCategory,
  [RuleCategory.PHP_FPM]: OpenTelemetryCategory,
  [RuleCategory.NODEJS]: OpenTelemetryCategory,

  [RuleCategory.QUERY_ANALYTICS]: PostgreSQLCategory,
};

/**
 * All rules by category (flattened)
 */
const AllRulesByCategory: Record<RuleCategory, AlertRuleTemplate[]> = {
  [RuleCategory.HOST_HARDWARE]: HostHardwareRules,
  [RuleCategory.PROMETHEUS]: PrometheusRules,
  [RuleCategory.SMART_DEVICE]: [],

  [RuleCategory.DOCKER]: ContainerRules,

  [RuleCategory.KUBERNETES]: KubernetesRules,
  [RuleCategory.NOMAD]: [],
  [RuleCategory.ALERTMANAGER]: AlertmanagerRules,
  [RuleCategory.ETCD]: EtcdRules,

  [RuleCategory.MYSQL]: MySQLRules,
  [RuleCategory.MARIADB]: MariaDBRules,
  [RuleCategory.PERCONA]: PerconaRules,
  [RuleCategory.POSTGRESQL]: PostgreSQLRules,
  [RuleCategory.MONGODB]: MongoDBRules,
  [RuleCategory.REDIS]: RedisRules,
  [RuleCategory.ELASTICSEARCH]: ElasticsearchRules,
  [RuleCategory.CLICKHOUSE]: ClickHouseRules,
  [RuleCategory.CASSANDRA]: [],
  [RuleCategory.SQLITE3]: [],

  [RuleCategory.RABBITMQ]: RabbitMQRules,
  [RuleCategory.KAFKA]: KafkaRules,
  [RuleCategory.NATS]: NATSRules,
  [RuleCategory.PULSAR]: [],

  [RuleCategory.NGINX]: NginxRules,
  [RuleCategory.APACHE]: ApacheRules,
  [RuleCategory.HAPROXY]: HAProxyRules,
  [RuleCategory.TRAEFIK]: TraefikRules,

  [RuleCategory.BLACKBOX]: BlackboxRules,
  [RuleCategory.SSL_TLS]: SSLTLSRules,
  [RuleCategory.DNS]: DNSRules,

  [RuleCategory.CEPH]: CephRules,
  [RuleCategory.MINIO]: MinioRules,
  [RuleCategory.ZFS]: ZFSRules,

  [RuleCategory.LOKI]: LokiRules,
  [RuleCategory.THANOS]: ThanosRules,
  [RuleCategory.GRAFANA]: GrafanaRules,
  [RuleCategory.OPENTELEMETRY]: OpenTelemetryRules,

  // TelemetryFlow Platform
  [RuleCategory.TFO_AGENT]: TFOAgentRules,
  [RuleCategory.TFO_COLLECTOR]: TFOCollectorRules,

  [RuleCategory.WINDOWS]: [],
  [RuleCategory.VMWARE]: [],

  [RuleCategory.JVM]: [],
  [RuleCategory.PHP_FPM]: [],
  [RuleCategory.NODEJS]: [],

  [RuleCategory.QUERY_ANALYTICS]: [],
};
export function getRulesByCategory(
  category: RuleCategory,
): AlertRuleTemplate[] {
  return AllRulesByCategory[category] || [];
}

/**
 * Get all rules across all categories
 */
export function getAllRules(): AlertRuleTemplate[] {
  return [
    ...HostHardwareRules,
    ...ContainerRules,
    ...KubernetesRules,
    ...AlertmanagerRules,
    ...EtcdRules,
    ...DatabaseRules,
    ...MessageQueueRules,
    ...WebServerRules,
    ...NetworkSecurityRules,
    ...StorageRules,
    ...ObservabilityRules,
    ...TFOAgentRules,
    ...TFOCollectorRules,
    ...ClickHouseRules,
  ];
}

/**
 * Get a rule by ID
 */
export function getRuleById(id: string): AlertRuleTemplate | undefined {
  return getAllRules().find((rule) => rule.id === id);
}

/**
 * Get all category metadata
 */
export function getAllCategories(): CategoryMetadata[] {
  const categories = new Map<string, CategoryMetadata>();

  Object.values(AlertRulesRegistry).forEach((cat) => {
    if (!categories.has(cat.metadata.id)) {
      categories.set(cat.metadata.id, cat.metadata);
    }
  });

  return Array.from(categories.values());
}

/**
 * Search rules by name or description
 */
export function searchRules(query: string): AlertRuleTemplate[] {
  const loweredQuery = query.toLowerCase();
  return getAllRules().filter(
    (rule) =>
      rule.name.toLowerCase().includes(loweredQuery) ||
      rule.description.toLowerCase().includes(loweredQuery),
  );
}

/**
 * Get rules by severity
 */
export function getRulesBySeverity(
  severity: "critical" | "warning" | "info",
): AlertRuleTemplate[] {
  return getAllRules().filter((rule) => rule.severity === severity);
}

/**
 * Get rule count per category
 */
export function getRuleCountByCategory(): Record<RuleCategory, number> {
  const counts = {} as Record<RuleCategory, number>;

  Object.entries(AllRulesByCategory).forEach(([category, rules]) => {
    counts[category as RuleCategory] = rules.length;
  });

  return counts;
}

/**
 * Get total rule count
 */
export function getTotalRuleCount(): number {
  return getAllRules().length;
}
