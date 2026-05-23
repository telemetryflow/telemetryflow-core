/**
 * Alert Rules Library
 * Pre-configured alert rule templates based on awesome-prometheus-alerts
 * @see https://samber.github.io/awesome-prometheus-alerts/
 */

// Types & Interfaces
export * from "./types";
export { AlertSourceType, QueryLanguage } from "./types";

// Categories
export {
  HostHardwareRules,
  HostHardwareCategory,
} from "./categories/host-hardware";
export { ContainerRules, ContainersCategory } from "./categories/containers";
export { KubernetesRules, KubernetesCategory } from "./categories/kubernetes";
export { AlertmanagerRules, AlertmanagerCategory } from "./categories/alertmanager";
export { EtcdRules, EtcdCategory } from "./categories/etcd";
export {
  DatabaseRules,
  DatabaseCategories,
  MySQLCategory,
  PostgreSQLCategory,
  MongoDBCategory,
  RedisCategory,
  ElasticsearchCategory,
} from "./categories/databases";
export {
  MessageQueueRules,
  MessageQueueCategories,
  RabbitMQCategory,
  KafkaCategory,
  NATSCategory,
} from "./categories/message-queues";
export {
  WebServerRules,
  WebServerCategories,
  NginxCategory,
  ApacheCategory,
  HAProxyCategory,
  TraefikCategory,
} from "./categories/web-servers";
export {
  NetworkSecurityRules,
  NetworkSecurityCategories,
  BlackboxCategory,
  SSLTLSCategory,
  DNSCategory,
} from "./categories/network-security";
export {
  StorageRules,
  StorageCategories,
  CephCategory,
  MinioCategory,
  ZFSCategory,
} from "./categories/storage";
export {
  ObservabilityRules,
  ObservabilityCategories,
  PrometheusCategory,
  LokiCategory,
  ThanosCategory,
  GrafanaCategory,
  OpenTelemetryCategory,
} from "./categories/observability";

// TelemetryFlow Platform
export { TFOAgentRules, TFOAgentCategory } from "./categories/tfo-agent";
export {
  TFOCollectorRules,
  TFOCollectorCategory,
} from "./categories/tfo-collector";

// Registry
export {
  getRulesByCategory,
  getAllRules,
  getRuleById,
  getAllCategories,
  getCategoryDisplay,
  searchRules,
  getRulesBySeverity,
  getRuleCountByCategory,
  getTotalRuleCount,
  getCategoriesGrouped,
} from "./registry";
