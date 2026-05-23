/**
 * Alerting API client
 * Communicates with backend AlertRulesController at /api/v2/alert-rules
 * and AlertInstancesController at /api/v2/alert-instances
 */

import { iamClient } from "./iam";
import { config } from "@/config";
import { mockAlertStats } from "@/mocks/api-stats";
import type { LogAlertRule, TriggeredAlert } from "@/types";
import type { Alert, AlertStatus, AlertSeverity } from "@/types";

export interface AlertStatsResponse {
  total: number;
  firing: number;
  acknowledged: number;
  resolved: number;
  silenced: number;
  bySeverity: {
    critical: number;
    warning: number;
    info: number;
  };
}

/** Backend alert rule shape (camelCase from TypeORM entity) */
interface BackendAlertRule {
  id: string;
  name: string;
  description?: string;
  severity: string;
  conditions: any[];
  queryString?: string;
  queryLanguage?: string;
  queryTarget?: string;
  sourceType?: string;
  enabled: boolean;
  state?: string;
  evaluationInterval?: string;
  forDuration?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  notificationChannels?: Array<{ channelId: string; sendOnResolve?: boolean }>;
  createdAt: string;
  updatedAt: string;
}

/** Backend alert instance shape */
interface BackendAlertInstance {
  id: string;
  alertRuleId: string;
  status: string;
  severity: string;
  title: string;
  description?: string;
  currentValue: number;
  threshold: number;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  startsAt: string;
  endsAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

/** Convert backend operator enum to display symbol */
const OPERATOR_MAP: Record<string, string> = {
  gt: ">", gte: ">=", lt: "<", lte: "<=", eq: "=", neq: "!=",
};

/** Convert display symbol back to backend operator enum */
const REVERSE_OPERATOR_MAP: Record<string, string> = {
  ">": "gt", ">=": "gte", "<": "lt", "<=": "lte", "=": "eq", "!=": "neq",
};

/** Convert seconds to duration string (e.g. 300 → "5m") */
function secondsToDuration(seconds: number): string {
  if (seconds >= 3600 && seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}

/** Map frontend condition → backend AlertConditionDto */
function mapConditionToBackend(c: any): any {
  return {
    metric: c.metric || c.field || "log_count",
    aggregation: c.aggregation || "count",
    operator: REVERSE_OPERATOR_MAP[c.operator] || c.operator || "gt",
    threshold: c.threshold ?? c.value ?? 0,
    duration: c.duration || (c.timeWindow ? secondsToDuration(c.timeWindow) : "5m"),
    ...(c.labels ? { labels: c.labels } : {}),
  };
}

/** Parse duration string like "5m", "1h" to seconds */
function parseDurationToSeconds(dur: string | number | undefined): number {
  if (typeof dur === "number") return dur;
  if (!dur) return 300;
  const match = String(dur).match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 300;
  const n = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return n;
    case "m": return n * 60;
    case "h": return n * 3600;
    case "d": return n * 86400;
    default: return 300;
  }
}

/** Map backend alert rule → frontend LogAlertRule */
function mapAlertRule(rule: BackendAlertRule): LogAlertRule {
  const notifChannels = Array.isArray(rule.notificationChannels) ? rule.notificationChannels : [];
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description || "",
    query: rule.queryString || "",
    conditions: Array.isArray(rule.conditions)
      ? rule.conditions.map((c: any) => ({
          field: c.field || c.metric || "count",
          operator: OPERATOR_MAP[c.operator] || c.operator || ">",
          value: c.value ?? c.threshold ?? 0,
          timeWindow: c.timeWindow ?? parseDurationToSeconds(c.duration),
        }))
      : [],
    severity: (rule.severity || "warning") as "info" | "warning" | "critical",
    enabled: rule.enabled,
    useDefaultChannels: notifChannels.length === 0,
    channelIds: notifChannels.map((c) => c.channelId),
    createdAt: new Date(rule.createdAt).getTime(),
    updatedAt: new Date(rule.updatedAt).getTime(),
  };
}

/** Map backend alert instance → frontend TriggeredAlert */
function mapAlertInstance(
  inst: BackendAlertInstance,
  ruleName?: string,
): TriggeredAlert {
  const labels = inst.labels || {};
  return {
    id: inst.id,
    ruleId: inst.alertRuleId,
    ruleName: ruleName || inst.title.split(" on ")[0] || inst.title,
    status: inst.status === "resolved" ? "resolved" : "firing",
    firedAt: new Date(inst.startsAt).getTime(),
    resolvedAt: inst.resolvedAt
      ? new Date(inst.resolvedAt).getTime()
      : inst.endsAt
        ? new Date(inst.endsAt).getTime()
        : undefined,
    value: inst.currentValue,
    service: labels.service || undefined,
    message: inst.description || inst.title,
  };
}

export const alertingApi = {
  /**
   * Get alert statistics (active counts by status and severity).
   */
  async getStats(): Promise<AlertStatsResponse> {
    if (config.useMock) {
      return mockAlertStats();
    }

    try {
      const data = await iamClient.get<any>("/alert-instances/stats");
      return data?.data || data || {
        total: 0,
        firing: 0,
        acknowledged: 0,
        resolved: 0,
        silenced: 0,
        bySeverity: { critical: 0, warning: 0, info: 0 },
      };
    } catch {
      return {
        total: 0,
        firing: 0,
        acknowledged: 0,
        resolved: 0,
        silenced: 0,
        bySeverity: { critical: 0, warning: 0, info: 0 },
      };
    }
  },

  // ─── Alert Rules ──────────────────────────────────────────────────────────

  /**
   * List alert rules (optionally filtered by queryTarget or graphId).
   */
  async listRules(params?: {
    page?: number;
    pageSize?: number;
    queryTarget?: string;
    graphId?: string;
  }): Promise<{ items: LogAlertRule[]; total: number }> {
    try {
      const data = await iamClient.get<any>("/alert-rules", {
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 50,
          ...(params?.graphId && { graphId: params.graphId }),
        },
      });
      // iamClient.get() already unwraps response.data
      const payload = data?.data || data || {};
      const items: BackendAlertRule[] = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];

      let mapped = items.map(mapAlertRule);

      // Client-side filter by queryTarget if needed (backend may not support it)
      if (params?.queryTarget) {
        const target = params.queryTarget;
        mapped = mapped.filter((_, i) => {
          const raw = items[i];
          return raw.queryTarget === target;
        });
      }

      return { items: mapped, total: mapped.length };
    } catch (e) {
      console.error("[alertingApi] listRules:", e);
      return { items: [], total: 0 };
    }
  },

  /**
   * Create a new alert rule.
   */
  async createRule(data: {
    name: string;
    description?: string;
    severity: string;
    conditions?: any[];
    queryString?: string;
    queryLanguage?: string;
    queryTarget?: string;
    evaluationInterval?: string;
    forDuration?: string;
    notificationChannels?: Array<{ channelId: string; sendOnResolve?: boolean }>;
    labels?: Record<string, string>;
  }): Promise<LogAlertRule | null> {
    try {
      // Map conditions from frontend format to backend format
      const payload = {
        ...data,
        conditions: Array.isArray(data.conditions)
          ? data.conditions.map(mapConditionToBackend)
          : [],
      };
      const result = await iamClient.post<any>("/alert-rules", payload);
      const rule = result?.data || result;
      return rule ? mapAlertRule(rule) : null;
    } catch (e) {
      console.error("[alertingApi] createRule:", e);
      return null;
    }
  },

  /**
   * Update an alert rule.
   */
  async updateRule(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      severity: string;
      conditions: any[];
      queryString: string;
      queryLanguage: string;
      queryTarget: string;
      notificationChannels: Array<{ channelId: string; sendOnResolve?: boolean }>;
    }>,
  ): Promise<LogAlertRule | null> {
    try {
      // Map conditions from frontend format to backend format
      const payload = {
        ...data,
        ...(Array.isArray(data.conditions)
          ? { conditions: data.conditions.map(mapConditionToBackend) }
          : {}),
      };
      const result = await iamClient.patch<any>(`/alert-rules/${id}`, payload);
      const rule = result?.data || result;
      return rule ? mapAlertRule(rule) : null;
    } catch (e) {
      console.error("[alertingApi] updateRule:", e);
      return null;
    }
  },

  /**
   * Delete an alert rule.
   */
  async deleteRule(id: string): Promise<boolean> {
    try {
      await iamClient.delete(`/alert-rules/${id}`);
      return true;
    } catch (e) {
      console.error("[alertingApi] deleteRule:", e);
      return false;
    }
  },

  /**
   * Enable an alert rule.
   */
  async enableRule(id: string): Promise<boolean> {
    try {
      await iamClient.post(`/alert-rules/${id}/enable`);
      return true;
    } catch (e) {
      console.error("[alertingApi] enableRule:", e);
      return false;
    }
  },

  /**
   * Disable an alert rule.
   */
  async disableRule(id: string): Promise<boolean> {
    try {
      await iamClient.post(`/alert-rules/${id}/disable`);
      return true;
    } catch (e) {
      console.error("[alertingApi] disableRule:", e);
      return false;
    }
  },

  // ─── Alert Instances ──────────────────────────────────────────────────────

  /**
   * List alert instances with optional filters.
   */
  async listInstances(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    severity?: string;
    alertRuleId?: string;
  }): Promise<{ items: TriggeredAlert[]; total: number }> {
    try {
      const data = await iamClient.get<any>("/alert-instances", {
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 50,
          ...(params?.status && { status: params.status }),
          ...(params?.severity && { severity: params.severity }),
          ...(params?.alertRuleId && { alertRuleId: params.alertRuleId }),
        },
      });
      // iamClient.get() already unwraps response.data
      const payload = data?.data || data || {};
      const items: BackendAlertInstance[] = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];

      const mapped = items.map((inst) => mapAlertInstance(inst));
      return { items: mapped, total: payload.total ?? mapped.length };
    } catch (e) {
      console.error("[alertingApi] listInstances:", e);
      return { items: [], total: 0 };
    }
  },
  // ─── Graph-linked Alert Rules ─────────────────────────────────────────────

  /**
   * Fetch the alert rule linked to a specific graph registry ID.
   * Returns null if none exists yet.
   */
  async getByGraphId(graphId: string): Promise<LogAlertRule | null> {
    try {
      const { items } = await alertingApi.listRules({ graphId, pageSize: 1 });
      return items[0] ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Create an alert rule pre-linked to a graph registry ID.
   * Stores graphId in the rule's labels so it can be retrieved later.
   */
  async createRuleForGraph(
    graphId: string,
    graphTitle: string,
    notificationChannelIds: string[],
    queryPayload?: {
      queryLanguage: string;
      queryString: string;
      conditions: Array<{
        metric: string;
        aggregation?: string;
        operator?: string;
        threshold: number;
        duration: string;
      }>;
    },
  ): Promise<LogAlertRule | null> {
    const payload = queryPayload ?? {
      queryLanguage: "condition",
      queryString: "",
      conditions: [
        {
          metric: graphId,
          aggregation: "avg",
          operator: ">=",
          threshold: 0,
          duration: "5m",
        },
      ],
    };

    return alertingApi.createRule({
      name: `Alert: ${graphTitle}`,
      description: `Auto-created alert for graph ${graphId}`,
      severity: "warning",
      conditions: payload.conditions,
      queryLanguage: payload.queryLanguage,
      queryString: payload.queryString || undefined,
      notificationChannels: notificationChannelIds.map((id) => ({
        channelId: id,
        sendOnResolve: true,
      })),
      labels: { graphId },
    } as any);
  },

  // ─── Notification Channels ────────────────────────────────────────────────

  /**
   * List all notification channels for the current organization.
   */
  async listNotificationChannels(): Promise<
    Array<{ id: string; name: string; type: string; enabled: boolean }>
  > {
    try {
      const data = await iamClient.get<any>("/notification-channels");
      const payload = data?.data || data || {};
      const items = Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];
      return items.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        enabled: ch.enabled !== false,
      }));
    } catch (e) {
      console.error("[alertingApi] listNotificationChannels:", e);
      return [];
    }
  },

  // ─── Alert Instances (mapped to main Alert type) ─────────────────────────

  /**
   * List alert instances mapped to the main page Alert type.
   * Used by the main /alerts page to show real backend data.
   */
  async listInstancesAsAlerts(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    severity?: string;
  }): Promise<{ items: Alert[]; total: number }> {
    try {
      const data = await iamClient.get<any>("/alert-instances", {
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 100,
          ...(params?.status && { status: params.status }),
          ...(params?.severity && { severity: params.severity }),
        },
      });
      const payload = data?.data || data || {};
      const items: BackendAlertInstance[] = Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];

      const mapped: Alert[] = items.map((inst) => ({
        id: inst.id,
        ruleId: inst.alertRuleId,
        ruleName: inst.title,
        status: (inst.status === "resolved"
          ? "resolved"
          : inst.status === "acknowledged"
            ? "pending"
            : "firing") as AlertStatus,
        severity: (inst.severity || "warning") as AlertSeverity,
        value: inst.currentValue,
        labels: inst.labels || {},
        annotations: {
          summary: inst.description || inst.title,
          ...(inst.annotations || {}),
        },
        startsAt: new Date(inst.startsAt).getTime(),
        endsAt: inst.endsAt ? new Date(inst.endsAt).getTime() : undefined,
        updatedAt: new Date(inst.createdAt).getTime(),
      }));

      return { items: mapped, total: payload.total ?? mapped.length };
    } catch (e) {
      console.error("[alertingApi] listInstancesAsAlerts:", e);
      return { items: [], total: 0 };
    }
  },
};

export default alertingApi;
