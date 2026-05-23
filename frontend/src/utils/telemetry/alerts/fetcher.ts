/**
 * Alerts Fetcher
 * Fetch alerts and alert rules from TFO v2 endpoints
 */

import type {
  DataSourceConfig,
  TelemetryResponse,
  AlertRule,
  Alert,
  Incident,
  TimeRange,
} from "../types";
import { fetchTelemetryData, createSuccessResponse } from "../common/fetcher";
import { TFO_V2_ENDPOINTS } from "../constants";
import {
  generateMockAlertRules,
  generateMockAlerts,
  generateMockActiveAlerts,
  generateMockIncidents,
} from "./generator";

// ============================================
// Fetch Alert Rules
// ============================================

export async function fetchAlertRules(
  source: DataSourceConfig,
): Promise<TelemetryResponse<AlertRule[]>> {
  if (source.type === "mock") {
    const rules = generateMockAlertRules();
    return createSuccessResponse<AlertRule[]>(rules, "mock");
  }

  return fetchTelemetryData<AlertRule[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.ALERTS_RULES,
    method: "GET",
  });
}

export async function fetchAlertRule(
  source: DataSourceConfig,
  ruleId: string,
): Promise<TelemetryResponse<AlertRule>> {
  if (source.type === "mock") {
    const rules = generateMockAlertRules();
    const rule = rules.find((r) => r.id === ruleId) ?? rules[0];
    return createSuccessResponse<AlertRule>(rule, "mock");
  }

  return fetchTelemetryData<AlertRule>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.ALERTS_RULES}/${ruleId}`,
    method: "GET",
  });
}

// ============================================
// Fetch Active Alerts
// ============================================

export async function fetchActiveAlerts(
  source: DataSourceConfig,
): Promise<TelemetryResponse<Alert[]>> {
  if (source.type === "mock") {
    const alerts = generateMockActiveAlerts(5);
    return createSuccessResponse<Alert[]>(alerts, "mock");
  }

  return fetchTelemetryData<Alert[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.ALERTS,
    method: "GET",
    params: { status: "firing" },
  });
}

// ============================================
// Fetch Alert History
// ============================================

export async function fetchAlertHistory(
  source: DataSourceConfig,
  timeRange: TimeRange,
): Promise<TelemetryResponse<Alert[]>> {
  if (source.type === "mock") {
    const alerts = generateMockAlerts(50, timeRange);
    return createSuccessResponse<Alert[]>(alerts, "mock");
  }

  return fetchTelemetryData<Alert[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.ALERTS_HISTORY,
    method: "GET",
    timeRange,
  });
}

// ============================================
// Fetch Incidents
// ============================================

export async function fetchIncidents(
  source: DataSourceConfig,
): Promise<TelemetryResponse<Incident[]>> {
  if (source.type === "mock") {
    const incidents = generateMockIncidents(5);
    return createSuccessResponse<Incident[]>(incidents, "mock");
  }

  return fetchTelemetryData<Incident[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.ALERTS_INCIDENTS,
    method: "GET",
  });
}

export async function fetchIncident(
  source: DataSourceConfig,
  incidentId: string,
): Promise<TelemetryResponse<Incident>> {
  if (source.type === "mock") {
    const incidents = generateMockIncidents(1);
    return createSuccessResponse<Incident>(incidents[0], "mock");
  }

  return fetchTelemetryData<Incident>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.ALERTS_INCIDENTS}/${incidentId}`,
    method: "GET",
  });
}

// ============================================
// Alert Rule CRUD Operations
// ============================================

export async function createAlertRule(
  source: DataSourceConfig,
  rule: Omit<AlertRule, "id" | "createdAt" | "updatedAt">,
): Promise<TelemetryResponse<AlertRule>> {
  if (source.type === "mock") {
    const newRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return createSuccessResponse<AlertRule>(newRule, "mock");
  }

  return fetchTelemetryData<AlertRule>({
    source,
    endpoint: TFO_V2_ENDPOINTS.ALERTS_RULES,
    method: "POST",
    body: rule,
  });
}

export async function updateAlertRule(
  source: DataSourceConfig,
  ruleId: string,
  updates: Partial<AlertRule>,
): Promise<TelemetryResponse<AlertRule>> {
  if (source.type === "mock") {
    const rules = generateMockAlertRules();
    const rule = rules.find((r) => r.id === ruleId) ?? rules[0];
    const updatedRule: AlertRule = {
      ...rule,
      ...updates,
      updatedAt: Date.now(),
    };
    return createSuccessResponse<AlertRule>(updatedRule, "mock");
  }

  return fetchTelemetryData<AlertRule>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.ALERTS_RULES}/${ruleId}`,
    method: "POST",
    body: updates,
  });
}

export async function deleteAlertRule(
  source: DataSourceConfig,
  ruleId: string,
): Promise<TelemetryResponse<void>> {
  if (source.type === "mock") {
    return createSuccessResponse<void>(undefined, "mock");
  }

  return fetchTelemetryData<void>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.ALERTS_RULES}/${ruleId}`,
    method: "POST",
    body: { _delete: true },
  });
}

export async function toggleAlertRule(
  source: DataSourceConfig,
  ruleId: string,
  enabled: boolean,
): Promise<TelemetryResponse<AlertRule>> {
  return updateAlertRule(source, ruleId, { enabled });
}

// ============================================
// Alert Operations
// ============================================

export async function acknowledgeAlert(
  source: DataSourceConfig,
  alertId: string,
): Promise<TelemetryResponse<Alert>> {
  if (source.type === "mock") {
    const alerts = generateMockActiveAlerts(1);
    alerts[0].status = "pending";
    return createSuccessResponse<Alert>(alerts[0], "mock");
  }

  return fetchTelemetryData<Alert>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.ALERTS}/${alertId}/acknowledge`,
    method: "POST",
  });
}

export async function resolveAlert(
  source: DataSourceConfig,
  alertId: string,
): Promise<TelemetryResponse<Alert>> {
  if (source.type === "mock") {
    const alerts = generateMockActiveAlerts(1);
    alerts[0].status = "resolved";
    alerts[0].endsAt = Date.now();
    return createSuccessResponse<Alert>(alerts[0], "mock");
  }

  return fetchTelemetryData<Alert>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.ALERTS}/${alertId}/resolve`,
    method: "POST",
  });
}

// ============================================
// Alert Statistics
// ============================================

export async function fetchAlertStats(
  source: DataSourceConfig,
  timeRange: TimeRange,
): Promise<
  TelemetryResponse<{
    total: number;
    firing: number;
    resolved: number;
    bySeverity: { critical: number; warning: number; info: number };
    byService: Record<string, number>;
  }>
> {
  if (source.type === "mock") {
    const alerts = generateMockAlerts(100, timeRange);
    const firing = alerts.filter((a) => a.status === "firing").length;
    const resolved = alerts.filter((a) => a.status === "resolved").length;

    const bySeverity = {
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      info: alerts.filter((a) => a.severity === "info").length,
    };

    const byService: Record<string, number> = {};
    for (const alert of alerts) {
      const service = alert.labels["service"] ?? "unknown";
      byService[service] = (byService[service] ?? 0) + 1;
    }

    return createSuccessResponse(
      { total: alerts.length, firing, resolved, bySeverity, byService },
      "mock",
    );
  }

  return fetchTelemetryData({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.ALERTS}/stats`,
    method: "GET",
    timeRange,
  });
}
