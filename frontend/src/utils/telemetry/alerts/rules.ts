/**
 * Alert Rules Utilities
 * Helpers for creating and managing alert rules
 */

import type {
  AlertRule,
  AlertCondition,
  AlertSeverity,
  AlertRuleTemplate,
  LogLevel,
} from "../types";
import { generateAlertId } from "../common/generator";
import { VM_METRICS, K8S_METRICS, DEFAULT_THRESHOLDS } from "../constants";

// ============================================
// Preset Alert Rules
// ============================================

export const PRESET_ALERT_RULES: Record<string, AlertRuleTemplate> = {
  HIGH_CPU: {
    id: "preset_high_cpu",
    name: "High CPU Usage",
    description: "Alert when CPU usage exceeds threshold",
    category: "infrastructure",
    query: `${VM_METRICS.CPU.UTILIZATION} > threshold`,
    condition: { operator: "gt", threshold: DEFAULT_THRESHOLDS.CPU.warning },
    severity: "warning",
    labels: { category: "cpu", resource: "infrastructure" },
    annotations: {
      summary: "High CPU usage detected",
      runbook_url: "https://runbooks.telemetryflow.id/high-cpu",
    },
  },
  CRITICAL_CPU: {
    id: "preset_critical_cpu",
    name: "Critical CPU Usage",
    description: "Alert when CPU usage is critically high",
    category: "infrastructure",
    query: `${VM_METRICS.CPU.UTILIZATION} > threshold`,
    condition: { operator: "gt", threshold: DEFAULT_THRESHOLDS.CPU.critical },
    severity: "critical",
    labels: { category: "cpu", resource: "infrastructure" },
    annotations: {
      summary: "Critical CPU usage",
      runbook_url: "https://runbooks.telemetryflow.id/critical-cpu",
    },
  },
  HIGH_MEMORY: {
    id: "preset_high_memory",
    name: "High Memory Usage",
    description: "Alert when memory usage exceeds threshold",
    category: "infrastructure",
    query: `${VM_METRICS.MEMORY.UTILIZATION} > threshold`,
    condition: { operator: "gt", threshold: DEFAULT_THRESHOLDS.MEMORY.warning },
    severity: "warning",
    labels: { category: "memory", resource: "infrastructure" },
    annotations: {
      summary: "High memory usage detected",
      runbook_url: "https://runbooks.telemetryflow.id/high-memory",
    },
  },
  CRITICAL_MEMORY: {
    id: "preset_critical_memory",
    name: "Critical Memory Usage",
    description: "Alert when memory usage is critically high",
    category: "infrastructure",
    query: `${VM_METRICS.MEMORY.UTILIZATION} > threshold`,
    condition: {
      operator: "gt",
      threshold: DEFAULT_THRESHOLDS.MEMORY.critical,
    },
    severity: "critical",
    labels: { category: "memory", resource: "infrastructure" },
    annotations: {
      summary: "Critical memory usage",
      runbook_url: "https://runbooks.telemetryflow.id/critical-memory",
    },
  },
  DISK_FULL: {
    id: "preset_disk_full",
    name: "Disk Space Critical",
    description: "Alert when disk space is running out",
    category: "infrastructure",
    query: `${VM_METRICS.FILESYSTEM.UTILIZATION} > threshold`,
    condition: { operator: "gt", threshold: DEFAULT_THRESHOLDS.DISK.critical },
    severity: "critical",
    labels: { category: "disk", resource: "infrastructure" },
    annotations: {
      summary: "Disk space critically low",
      runbook_url: "https://runbooks.telemetryflow.id/disk-full",
    },
  },
  HIGH_ERROR_RATE: {
    id: "preset_high_error_rate",
    name: "High Error Rate",
    description: "Alert when error rate exceeds threshold",
    category: "application",
    query: "error_rate > threshold",
    condition: {
      operator: "gt",
      threshold: DEFAULT_THRESHOLDS.ERROR_RATE.warning,
    },
    severity: "warning",
    labels: { category: "errors", resource: "application" },
    annotations: {
      summary: "High error rate detected",
      runbook_url: "https://runbooks.telemetryflow.id/high-errors",
    },
  },
  HIGH_LATENCY: {
    id: "preset_high_latency",
    name: "High Latency P95",
    description: "Alert when P95 latency exceeds threshold",
    category: "application",
    query: "latency_p95 > threshold",
    condition: {
      operator: "gt",
      threshold: DEFAULT_THRESHOLDS.LATENCY_P95.warning,
    },
    severity: "warning",
    labels: { category: "latency", resource: "application" },
    annotations: {
      summary: "High latency detected",
      runbook_url: "https://runbooks.telemetryflow.id/high-latency",
    },
  },
  POD_CRASH_LOOP: {
    id: "preset_pod_crash_loop",
    name: "Pod CrashLoopBackOff",
    description: "Alert when pods are crash looping",
    category: "kubernetes",
    query: `${K8S_METRICS.CONTAINER.RESTARTS} > threshold`,
    condition: { operator: "gt", threshold: 5 },
    severity: "critical",
    labels: { category: "pods", resource: "kubernetes" },
    annotations: {
      summary: "Pod is crash looping",
      runbook_url: "https://runbooks.telemetryflow.id/pod-crash",
    },
  },
  NODE_NOT_READY: {
    id: "preset_node_not_ready",
    name: "Node Not Ready",
    description: "Alert when Kubernetes node is not ready",
    category: "kubernetes",
    query: `${K8S_METRICS.NODE.CONDITION}{condition="Ready"} == 0`,
    condition: { operator: "eq", threshold: 0 },
    severity: "critical",
    labels: { category: "nodes", resource: "kubernetes" },
    annotations: {
      summary: "Kubernetes node is not ready",
      runbook_url: "https://runbooks.telemetryflow.id/node-not-ready",
    },
  },
  DEPLOYMENT_UNAVAILABLE: {
    id: "preset_deployment_unavailable",
    name: "Deployment Unavailable",
    description: "Alert when deployment has unavailable replicas",
    category: "kubernetes",
    query: `${K8S_METRICS.DEPLOYMENT.UNAVAILABLE} > 0`,
    condition: { operator: "gt", threshold: 0 },
    severity: "warning",
    labels: { category: "deployments", resource: "kubernetes" },
    annotations: {
      summary: "Deployment has unavailable replicas",
      runbook_url: "https://runbooks.telemetryflow.id/deployment-unavailable",
    },
  },
};

// ============================================
// Alert Rule Builders
// ============================================

export function createMetricAlertRule(
  name: string,
  metricName: string,
  threshold: number,
  operator: AlertCondition["operator"],
  severity: AlertSeverity = "warning",
): AlertRule {
  return {
    id: generateAlertId(),
    name,
    description: `Alert when ${metricName} ${operator} ${threshold}`,
    enabled: true,
    query: `${metricName} ${operatorToSymbol(operator)} ${threshold}`,
    condition: { operator, threshold },
    duration: "5m",
    severity,
    labels: { source: "metrics", metric: metricName },
    annotations: { summary: name },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createLogAlertRule(
  name: string,
  pattern: string,
  severity: LogLevel,
  countThreshold: number,
  windowSeconds: number,
): AlertRule {
  return {
    id: generateAlertId(),
    name,
    description: `Alert when log pattern "${pattern}" appears ${countThreshold}+ times in ${windowSeconds}s`,
    enabled: true,
    query: `severity:${severity} AND "${pattern}" | count > ${countThreshold}`,
    condition: { operator: "gt", threshold: countThreshold },
    duration: `${windowSeconds}s`,
    severity:
      severity === "error" || severity === "fatal" ? "critical" : "warning",
    labels: { source: "logs", pattern },
    annotations: { summary: name },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createTraceAlertRule(
  name: string,
  service: string,
  latencyThreshold: number,
  percentile: "p50" | "p95" | "p99" = "p95",
): AlertRule {
  return {
    id: generateAlertId(),
    name,
    description: `Alert when ${service} ${percentile} latency exceeds ${latencyThreshold}ms`,
    enabled: true,
    query: `service:${service} | latency_${percentile} > ${latencyThreshold}`,
    condition: { operator: "gt", threshold: latencyThreshold },
    duration: "5m",
    severity: latencyThreshold > 1000 ? "critical" : "warning",
    labels: { source: "traces", service, percentile },
    annotations: { summary: name },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ============================================
// Rule Utilities
// ============================================

function operatorToSymbol(operator: AlertCondition["operator"]): string {
  switch (operator) {
    case "gt":
      return ">";
    case "gte":
      return ">=";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    case "eq":
      return "==";
    case "neq":
      return "!=";
    default:
      return ">";
  }
}

export function symbolToOperator(symbol: string): AlertCondition["operator"] {
  switch (symbol) {
    case ">":
      return "gt";
    case ">=":
      return "gte";
    case "<":
      return "lt";
    case "<=":
      return "lte";
    case "==":
    case "=":
      return "eq";
    case "!=":
    case "<>":
      return "neq";
    default:
      return "gt";
  }
}

export function evaluateCondition(
  value: number,
  condition: AlertCondition,
): boolean {
  switch (condition.operator) {
    case "gt":
      return value > condition.threshold;
    case "gte":
      return value >= condition.threshold;
    case "lt":
      return value < condition.threshold;
    case "lte":
      return value <= condition.threshold;
    case "eq":
      return value === condition.threshold;
    case "neq":
      return value !== condition.threshold;
    default:
      return false;
  }
}

// ============================================
// Template Utilities
// ============================================

export function getPresetRulesByCategory(
  category: AlertRuleTemplate["category"],
): AlertRuleTemplate[] {
  return Object.values(PRESET_ALERT_RULES).filter(
    (r) => r.category === category,
  );
}

export function templateToRule(template: AlertRuleTemplate): AlertRule {
  return {
    id: generateAlertId(),
    name: template.name,
    description: template.description,
    enabled: true,
    query: template.query,
    condition: template.condition,
    duration: "5m",
    severity: template.severity,
    labels: template.labels,
    annotations: template.annotations,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function validateAlertRule(rule: Partial<AlertRule>): string[] {
  const errors: string[] = [];

  if (!rule.name || rule.name.trim().length === 0) {
    errors.push("Name is required");
  }

  if (!rule.query || rule.query.trim().length === 0) {
    errors.push("Query is required");
  }

  if (!rule.condition) {
    errors.push("Condition is required");
  } else {
    if (!rule.condition.operator) {
      errors.push("Condition operator is required");
    }
    if (
      rule.condition.threshold === undefined ||
      rule.condition.threshold === null
    ) {
      errors.push("Condition threshold is required");
    }
  }

  if (!rule.severity) {
    errors.push("Severity is required");
  }

  return errors;
}
