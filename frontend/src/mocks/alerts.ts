/**
 * Alerts Mock Data Generator
 * Generates mock alert and rule data for development and demo purposes
 */

import { SERVICES, randomId } from "./shared";

// Types for alerts
export interface MockAlert {
  ruleId: string;
  ruleName: string;
  status: "firing" | "resolved" | "pending";
  severity: "critical" | "warning" | "info";
  value: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: number;
  endsAt?: number;
}

export interface MockAlertRule {
  name: string;
  query: string;
  condition: {
    operator: "gt" | "lt" | "eq" | "gte" | "lte";
    threshold: number;
  };
  severity: "critical" | "warning" | "info";
  annotations: Record<string, string>;
}

/**
 * Generate default demo alerts
 */
export function generateDemoAlerts(): MockAlert[] {
  const now = Date.now();

  return [
    {
      ruleId: "1",
      ruleName: "High Error Rate",
      status: "firing",
      severity: "critical",
      value: 5.2,
      labels: { service: "api-gateway" },
      annotations: { summary: "Error rate exceeded 5%" },
      startsAt: now - 3600000,
    },
    {
      ruleId: "2",
      ruleName: "High Latency",
      status: "firing",
      severity: "warning",
      value: 850,
      labels: { service: "payment-service" },
      annotations: { summary: "P95 latency above 500ms" },
      startsAt: now - 1800000,
    },
    {
      ruleId: "3",
      ruleName: "Memory Usage High",
      status: "resolved",
      severity: "warning",
      value: 85,
      labels: { service: "user-service" },
      annotations: { summary: "Memory usage above 80%" },
      startsAt: now - 7200000,
      endsAt: now - 3600000,
    },
  ];
}

/**
 * Generate default demo alert rules
 */
export function generateDemoAlertRules(): MockAlertRule[] {
  return [
    {
      name: "High Error Rate",
      query:
        'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05',
      condition: { operator: "gt", threshold: 5 },
      severity: "critical",
      annotations: { description: "Alert when error rate exceeds 5%" },
    },
    {
      name: "High Latency P95",
      query:
        "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5",
      condition: { operator: "gt", threshold: 500 },
      severity: "warning",
      annotations: { description: "Alert when P95 latency exceeds 500ms" },
    },
  ];
}

/**
 * Generate a random alert for a service
 */
export function generateRandomAlert(service?: string): MockAlert {
  const now = Date.now();
  const targetService =
    service || SERVICES[Math.floor(Math.random() * SERVICES.length)];
  const alertTypes = [
    {
      name: "High Error Rate",
      severity: "critical" as const,
      value: () => 3 + Math.random() * 7,
    },
    {
      name: "High Latency",
      severity: "warning" as const,
      value: () => 500 + Math.random() * 1000,
    },
    {
      name: "Memory Usage High",
      severity: "warning" as const,
      value: () => 75 + Math.random() * 20,
    },
    {
      name: "CPU Usage High",
      severity: "warning" as const,
      value: () => 80 + Math.random() * 15,
    },
    {
      name: "Connection Pool Exhausted",
      severity: "critical" as const,
      value: () => 95 + Math.random() * 5,
    },
  ];

  const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
  const isResolved = Math.random() > 0.7;
  const startsAt = now - Math.floor(Math.random() * 7200000);

  return {
    ruleId: randomId(8),
    ruleName: alertType.name,
    status: isResolved ? "resolved" : "firing",
    severity: alertType.severity,
    value: alertType.value(),
    labels: { service: targetService },
    annotations: { summary: `${alertType.name} detected on ${targetService}` },
    startsAt,
    endsAt: isResolved
      ? startsAt + Math.floor(Math.random() * 3600000)
      : undefined,
  };
}

/**
 * Generate multiple random alerts
 */
export function generateRandomAlerts(count: number = 5): MockAlert[] {
  const alerts: MockAlert[] = [];
  for (let i = 0; i < count; i++) {
    alerts.push(generateRandomAlert());
  }
  return alerts.sort((a, b) => b.startsAt - a.startsAt);
}

/**
 * Generate alert rule templates
 */
export function getAlertRuleTemplates(): Array<{
  name: string;
  description: string;
  query: string;
  defaultThreshold: number;
  severity: "critical" | "warning" | "info";
}> {
  return [
    {
      name: "High Error Rate",
      description: "Alert when error rate exceeds threshold",
      query:
        'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100',
      defaultThreshold: 5,
      severity: "critical",
    },
    {
      name: "High Latency P95",
      description: "Alert when P95 latency exceeds threshold",
      query:
        "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000",
      defaultThreshold: 500,
      severity: "warning",
    },
    {
      name: "High Latency P99",
      description: "Alert when P99 latency exceeds threshold",
      query:
        "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) * 1000",
      defaultThreshold: 1000,
      severity: "critical",
    },
    {
      name: "High Memory Usage",
      description: "Alert when memory usage exceeds threshold",
      query: "process_resident_memory_bytes / 1024 / 1024 / 1024",
      defaultThreshold: 4,
      severity: "warning",
    },
    {
      name: "High Request Rate",
      description: "Alert when request rate exceeds threshold",
      query: "sum(rate(http_requests_total[5m]))",
      defaultThreshold: 1000,
      severity: "info",
    },
  ];
}

// Export alerts mock data service
export const alertsMock = {
  getDemoAlerts: generateDemoAlerts,
  getDemoAlertRules: generateDemoAlertRules,
  generateAlert: generateRandomAlert,
  generateAlerts: generateRandomAlerts,
  getAlertRuleTemplates,
};
