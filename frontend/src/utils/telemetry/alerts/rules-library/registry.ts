/**
 * Alert Rules Registry
 * Central registry for all alert rule templates (frontend)
 */

import type {
  AlertRuleTemplate,
  CategoryMetadata,
  AlertSeverity,
  CategoryDisplayConfig,
} from "./types";
import { RuleCategory, CategoryDisplayConfigs } from "./types";

// Import all category rules
import {
  HostHardwareRules,
  HostHardwareCategory,
} from "./categories/host-hardware";
import { ContainerRules, ContainersCategory } from "./categories/containers";
import { KubernetesRules, KubernetesCategory } from "./categories/kubernetes";
import { AlertmanagerRules, AlertmanagerCategory } from "./categories/alertmanager";
import { EtcdRules, EtcdCategory } from "./categories/etcd";
import { DatabaseRules, DatabaseCategories } from "./categories/databases";
import {
  MessageQueueRules,
  MessageQueueCategories,
} from "./categories/message-queues";
import { WebServerRules, WebServerCategories } from "./categories/web-servers";
import {
  NetworkSecurityRules,
  NetworkSecurityCategories,
} from "./categories/network-security";
import { StorageRules, StorageCategories } from "./categories/storage";
import {
  ObservabilityRules,
  ObservabilityCategories,
} from "./categories/observability";
import { TFOAgentRules, TFOAgentCategory } from "./categories/tfo-agent";
import {
  TFOCollectorRules,
  TFOCollectorCategory,
} from "./categories/tfo-collector";

/**
 * All rules by category
 */
const AllRulesByCategory: Partial<Record<RuleCategory, AlertRuleTemplate[]>> = {
  [RuleCategory.HOST_HARDWARE]: HostHardwareRules,
  [RuleCategory.DOCKER]: ContainerRules,
  [RuleCategory.KUBERNETES]: KubernetesRules,
  [RuleCategory.ALERTMANAGER]: AlertmanagerRules,
  [RuleCategory.ETCD]: EtcdRules,
  [RuleCategory.TFO_AGENT]: TFOAgentRules,
  [RuleCategory.TFO_COLLECTOR]: TFOCollectorRules,
};

// Merge database rules
DatabaseCategories.forEach((cat) => {
  const rules = DatabaseRules.filter((r) => r.category === cat.metadata.id);
  AllRulesByCategory[cat.metadata.id] = rules;
});

// Merge message queue rules
MessageQueueCategories.forEach((cat) => {
  const rules = MessageQueueRules.filter((r) => r.category === cat.metadata.id);
  AllRulesByCategory[cat.metadata.id] = rules;
});

// Merge web server rules
WebServerCategories.forEach((cat) => {
  const rules = WebServerRules.filter((r) => r.category === cat.metadata.id);
  AllRulesByCategory[cat.metadata.id] = rules;
});

// Merge network security rules
NetworkSecurityCategories.forEach((cat) => {
  const rules = NetworkSecurityRules.filter(
    (r) => r.category === cat.metadata.id,
  );
  AllRulesByCategory[cat.metadata.id] = rules;
});

// Merge storage rules
StorageCategories.forEach((cat) => {
  const rules = StorageRules.filter((r) => r.category === cat.metadata.id);
  AllRulesByCategory[cat.metadata.id] = rules;
});

// Merge observability rules
ObservabilityCategories.forEach((cat) => {
  const rules = ObservabilityRules.filter(
    (r) => r.category === cat.metadata.id,
  );
  AllRulesByCategory[cat.metadata.id] = rules;
});

/**
 * Get rules by category
 */
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
  const categories: CategoryMetadata[] = [
    HostHardwareCategory.metadata,
    ContainersCategory.metadata,
    KubernetesCategory.metadata,
    AlertmanagerCategory.metadata,
    EtcdCategory.metadata,
    ...DatabaseCategories.map((c) => c.metadata),
    ...MessageQueueCategories.map((c) => c.metadata),
    ...WebServerCategories.map((c) => c.metadata),
    ...NetworkSecurityCategories.map((c) => c.metadata),
    ...StorageCategories.map((c) => c.metadata),
    ...ObservabilityCategories.map((c) => c.metadata),
    TFOAgentCategory.metadata,
    TFOCollectorCategory.metadata,
  ];

  return categories;
}

/**
 * Get category display config
 */
export function getCategoryDisplay(
  category: RuleCategory,
): CategoryDisplayConfig | undefined {
  return CategoryDisplayConfigs.find((c) => c.id === category);
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
  severity: AlertSeverity,
): AlertRuleTemplate[] {
  return getAllRules().filter((rule) => rule.severity === severity);
}

/**
 * Get rule count per category
 */
export function getRuleCountByCategory(): Partial<
  Record<RuleCategory, number>
> {
  const counts: Partial<Record<RuleCategory, number>> = {};

  Object.entries(AllRulesByCategory).forEach(([category, rules]) => {
    if (rules) {
      counts[category as RuleCategory] = rules.length;
    }
  });

  return counts;
}

/**
 * Get total rule count
 */
export function getTotalRuleCount(): number {
  return getAllRules().length;
}

/**
 * Get categories grouped by type
 */
export function getCategoriesGrouped(): Record<string, CategoryMetadata[]> {
  const allCategories = getAllCategories();

  return {
    "TelemetryFlow Platform": allCategories.filter((c) =>
      [RuleCategory.TFO_AGENT, RuleCategory.TFO_COLLECTOR].includes(c.id),
    ),
    Infrastructure: allCategories.filter((c) =>
      [
        RuleCategory.HOST_HARDWARE,
        RuleCategory.DOCKER,
        RuleCategory.KUBERNETES,
        RuleCategory.ALERTMANAGER,
        RuleCategory.ETCD,
      ].includes(c.id),
    ),
    Databases: allCategories.filter((c) =>
      [
        RuleCategory.MYSQL,
        RuleCategory.POSTGRESQL,
        RuleCategory.MONGODB,
        RuleCategory.REDIS,
        RuleCategory.ELASTICSEARCH,
      ].includes(c.id),
    ),
    "Message Queues": allCategories.filter((c) =>
      [RuleCategory.RABBITMQ, RuleCategory.KAFKA, RuleCategory.NATS].includes(
        c.id,
      ),
    ),
    "Web Servers": allCategories.filter((c) =>
      [
        RuleCategory.NGINX,
        RuleCategory.APACHE,
        RuleCategory.HAPROXY,
        RuleCategory.TRAEFIK,
      ].includes(c.id),
    ),
    "Network & Security": allCategories.filter((c) =>
      [RuleCategory.BLACKBOX, RuleCategory.SSL_TLS, RuleCategory.DNS].includes(
        c.id,
      ),
    ),
    Storage: allCategories.filter((c) =>
      [RuleCategory.CEPH, RuleCategory.MINIO, RuleCategory.ZFS].includes(c.id),
    ),
    Observability: allCategories.filter((c) =>
      [
        RuleCategory.PROMETHEUS,
        RuleCategory.LOKI,
        RuleCategory.THANOS,
        RuleCategory.GRAFANA,
        RuleCategory.OPENTELEMETRY,
      ].includes(c.id),
    ),
  };
}
