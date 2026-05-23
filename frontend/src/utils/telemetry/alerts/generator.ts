/**
 * Alerts Generator
 * Generate mock alerts and alert rules
 */

import type {
  AlertRule,
  AlertCondition,
  AlertSeverity,
  Alert,
  AlertStatus,
  Incident,
  TimeRange,
} from "../types";
import {
  createSeededRandom,
  generateAlertId,
  generateUUID,
  generateTimestamps,
  getDefaultTimeRange,
} from "../common/generator";
import { MOCK_SERVICES, DEFAULT_THRESHOLDS } from "../constants";

// ============================================
// Alert Generator Config
// ============================================

export interface AlertGeneratorConfig {
  name: string;
  severity: AlertSeverity;
  source: "metrics" | "logs" | "traces";
  condition: AlertCondition;
}

// ============================================
// Alert Rule Generator
// ============================================

export function generateAlertRule(config: AlertGeneratorConfig): AlertRule {
  const random = createSeededRandom(config.name.length);

  return {
    id: generateAlertId(),
    name: config.name,
    description: `Alert when ${config.name.toLowerCase().replace(/_/g, " ")}`,
    enabled: true,
    query: generateAlertQuery(config.source, config.name),
    condition: config.condition,
    duration: random.pick(["30s", "1m", "5m", "10m"]),
    severity: config.severity,
    labels: {
      source: config.source,
      team: random.pick(["platform", "backend", "frontend", "devops"]),
    },
    annotations: {
      summary: `${config.name} triggered`,
      description: `The alert ${config.name} has been triggered`,
      runbook_url: `https://runbooks.telemetryflow.id/${config.name.toLowerCase().replace(/ /g, "-")}`,
    },
    createdAt: Date.now() - random.nextInt(86400000, 86400000 * 30),
    updatedAt: Date.now() - random.nextInt(0, 86400000 * 7),
  };
}

function generateAlertQuery(source: string, name: string): string {
  switch (source) {
    case "metrics":
      return `${name.toLowerCase().replace(/ /g, "_")} > threshold`;
    case "logs":
      return `severity:error AND service:* | count > threshold`;
    case "traces":
      return `latency_p99 > threshold_ms`;
    default:
      return name;
  }
}

// ============================================
// Alert Generator
// ============================================

export function generateAlert(rule: AlertRule, triggeredAt: number): Alert {
  const random = createSeededRandom(triggeredAt);

  return {
    id: generateAlertId(triggeredAt),
    ruleId: rule.id,
    ruleName: rule.name,
    status: random.pick<AlertStatus>(["firing", "pending", "resolved"]),
    severity: rule.severity,
    value: rule.condition.threshold * random.nextFloat(1.1, 2),
    labels: {
      ...rule.labels,
      service: random.pick(MOCK_SERVICES),
      instance: `instance-${random.nextInt(1, 5)}`,
    },
    annotations: rule.annotations,
    startsAt: triggeredAt,
    endsAt: random.nextBool(0.3)
      ? triggeredAt + random.nextInt(60000, 3600000)
      : undefined,
    updatedAt: triggeredAt + random.nextInt(0, 60000),
  };
}

export function generateActiveAlert(
  ruleName: string,
  severity: AlertSeverity,
): Alert {
  const random = createSeededRandom(ruleName.length);

  return {
    id: generateAlertId(),
    ruleId: generateAlertId(),
    ruleName,
    status: "firing",
    severity,
    value: random.nextFloat(80, 100),
    labels: {
      service: random.pick(MOCK_SERVICES),
      instance: `instance-${random.nextInt(1, 5)}`,
    },
    annotations: {
      summary: `${ruleName} is active`,
      description: `The alert ${ruleName} is currently firing`,
    },
    startsAt: Date.now() - random.nextInt(60000, 3600000),
    updatedAt: Date.now() - random.nextInt(0, 60000),
  };
}

// ============================================
// Incident Generator
// ============================================

export function generateIncident(alerts: Alert[]): Incident {
  const random = createSeededRandom(alerts.length);
  const severity = alerts.reduce<AlertSeverity>((max, a) => {
    const order: AlertSeverity[] = ["info", "warning", "critical"];
    return order.indexOf(a.severity) > order.indexOf(max) ? a.severity : max;
  }, "info");

  const earliestAlert = alerts.reduce((earliest, a) =>
    a.startsAt < earliest.startsAt ? a : earliest,
  );

  return {
    id: generateUUID(),
    title: `Incident: ${alerts[0]?.ruleName ?? "Unknown"}`,
    description: `${alerts.length} related alert(s) detected`,
    severity,
    status: random.pick(["open", "acknowledged", "resolved"]),
    alerts,
    assignee: random.nextBool(0.5)
      ? random.pick(["alice", "bob", "charlie", "diana"])
      : undefined,
    createdAt: earliestAlert.startsAt,
    updatedAt: Date.now() - random.nextInt(0, 3600000),
    resolvedAt: random.nextBool(0.3)
      ? Date.now() - random.nextInt(0, 3600000)
      : undefined,
  };
}

// ============================================
// Mock Alert Rules
// ============================================

export function generateMockAlertRules(): AlertRule[] {
  return [
    generateAlertRule({
      name: "HighCPUUsage",
      severity: "warning",
      source: "metrics",
      condition: { operator: "gt", threshold: DEFAULT_THRESHOLDS.CPU.warning },
    }),
    generateAlertRule({
      name: "CriticalCPUUsage",
      severity: "critical",
      source: "metrics",
      condition: { operator: "gt", threshold: DEFAULT_THRESHOLDS.CPU.critical },
    }),
    generateAlertRule({
      name: "HighMemoryUsage",
      severity: "warning",
      source: "metrics",
      condition: {
        operator: "gt",
        threshold: DEFAULT_THRESHOLDS.MEMORY.warning,
      },
    }),
    generateAlertRule({
      name: "CriticalMemoryUsage",
      severity: "critical",
      source: "metrics",
      condition: {
        operator: "gt",
        threshold: DEFAULT_THRESHOLDS.MEMORY.critical,
      },
    }),
    generateAlertRule({
      name: "DiskSpaceLow",
      severity: "warning",
      source: "metrics",
      condition: { operator: "gt", threshold: DEFAULT_THRESHOLDS.DISK.warning },
    }),
    generateAlertRule({
      name: "DiskSpaceCritical",
      severity: "critical",
      source: "metrics",
      condition: {
        operator: "gt",
        threshold: DEFAULT_THRESHOLDS.DISK.critical,
      },
    }),
    generateAlertRule({
      name: "HighErrorRate",
      severity: "warning",
      source: "logs",
      condition: {
        operator: "gt",
        threshold: DEFAULT_THRESHOLDS.ERROR_RATE.warning,
      },
    }),
    generateAlertRule({
      name: "CriticalErrorRate",
      severity: "critical",
      source: "logs",
      condition: {
        operator: "gt",
        threshold: DEFAULT_THRESHOLDS.ERROR_RATE.critical,
      },
    }),
    generateAlertRule({
      name: "HighLatencyP95",
      severity: "warning",
      source: "traces",
      condition: {
        operator: "gt",
        threshold: DEFAULT_THRESHOLDS.LATENCY_P95.warning,
      },
    }),
    generateAlertRule({
      name: "CriticalLatencyP95",
      severity: "critical",
      source: "traces",
      condition: {
        operator: "gt",
        threshold: DEFAULT_THRESHOLDS.LATENCY_P95.critical,
      },
    }),
    generateAlertRule({
      name: "PodCrashLooping",
      severity: "critical",
      source: "metrics",
      condition: { operator: "gt", threshold: 5 },
    }),
    generateAlertRule({
      name: "NodeNotReady",
      severity: "critical",
      source: "metrics",
      condition: { operator: "eq", threshold: 0 },
    }),
    generateAlertRule({
      name: "PodPending",
      severity: "warning",
      source: "metrics",
      condition: { operator: "gt", threshold: 5 },
    }),
    generateAlertRule({
      name: "DeploymentUnavailable",
      severity: "critical",
      source: "metrics",
      condition: { operator: "gt", threshold: 0 },
    }),
  ];
}

export function generateMockAlerts(
  count: number,
  timeRange?: TimeRange,
): Alert[] {
  const range = timeRange ?? getDefaultTimeRange();
  const rules = generateMockAlertRules();
  const random = createSeededRandom(count);
  const timestamps = generateTimestamps(range.start, range.end, count);

  return timestamps.map((ts) => {
    const rule = random.pick(rules);
    return generateAlert(rule, ts);
  });
}

export function generateMockActiveAlerts(count: number): Alert[] {
  const rules = generateMockAlertRules();
  const random = createSeededRandom(count);

  return Array.from({ length: count }, () => {
    const rule = random.pick(rules);
    const alert = generateAlert(
      rule,
      Date.now() - random.nextInt(60000, 7200000),
    );
    alert.status = "firing";
    alert.endsAt = undefined;
    return alert;
  });
}

export function generateMockIncidents(count: number): Incident[] {
  const alerts = generateMockActiveAlerts(count * 2);
  const random = createSeededRandom(count);

  const incidents: Incident[] = [];
  for (let i = 0; i < count; i++) {
    const alertCount = random.nextInt(1, 4);
    const incidentAlerts = alerts.splice(0, alertCount);
    if (incidentAlerts.length > 0) {
      incidents.push(generateIncident(incidentAlerts));
    }
  }

  return incidents;
}
