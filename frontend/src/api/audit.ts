/**
 * Audit API client
 * Supports both mock data (useMock=true) and real ClickHouse backend (useMock=false)
 */

import { iamClient } from "./iam";
import { config } from "@/config";
import { MOCK_AUDIT_LOGS, generateAuditLogs } from "@/mocks";
import type {
  AuditLog,
  AuditLogResponse,
  AuditLogQueryParams,
  AuditStatistics,
  AuditStatsQueryParams,
  AuditExportOptions,
  AuditEventType,
  AuditResult,
  PaginatedAuditLogs,
} from "@/types/audit";
import { transformAuditLog } from "@/types/audit";

// ==================== ENDPOINTS ====================

export const AUDIT_ENDPOINTS = {
  BASE: "/audit/logs",
  SINGLE: (id: string) => `/audit/logs/${id}`,
  COUNT: "/audit/count",
  STATS: "/audit/statistics",
  EXPORT: "/audit/export",
} as const;

// ==================== MOCK DATA GENERATORS ====================

function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("maxExclusive must be a positive integer");
  }

  const maxUint32 = 0x100000000;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const buffer = new Uint32Array(1);

  let value: number;
  do {
    globalThis.crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return value % maxExclusive;
}

function pickRandom<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty array");
  }
  return items[secureRandomInt(items.length)];
}

function generateMockAuditLogs(count: number): AuditLog[] {
  const eventTypes: AuditEventType[] = ["AUTH", "AUTHZ", "DATA", "SYSTEM"];
  const results: AuditResult[] = ["SUCCESS", "FAILURE", "DENIED"];
  const actions: Record<AuditEventType, string[]> = {
    AUTH: ["login", "logout", "login_failed", "password_reset", "token_refresh"],
    AUTHZ: ["access_granted", "access_denied", "permission_check", "role_assigned"],
    DATA: ["create", "read", "update", "delete", "export"],
    SYSTEM: ["startup", "config_change", "migration_run", "error"],
  };
  const resources = [
    "user", "organization", "workspace", "dashboard",
    "alert", "agent", "cluster", "api_key",
  ];
  const users = [
    { id: "user-001", email: "admin@telemetryflow.id", firstName: "Admin", lastName: "DevOps" },
    { id: "user-002", email: "developer@telemetryflow.id", firstName: "John", lastName: "Developer" },
    { id: "user-003", email: "viewer@telemetryflow.id", firstName: "Jane", lastName: "Viewer" },
    { id: "user-004", email: "support@telemetryflow.id", firstName: "Support", lastName: "Team" },
  ];
  const ips = ["192.168.1.100", "10.0.0.50", "172.16.0.25", "203.0.113.42"];
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
  ];

  const logs: AuditLog[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const eventType = pickRandom(eventTypes);
    const result = pickRandom(results);
    const action = pickRandom(actions[eventType]);
    const user = pickRandom(users);
    const resource = pickRandom(resources);
    const timestamp = now - secureRandomInt(7 * 24 * 60 * 60 * 1000);

    logs.push({
      id: `audit-${Date.now()}-${i}`,
      timestamp,
      createdAt: timestamp,
      userId: user.id,
      userEmail: user.email,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      eventType,
      action,
      resource,
      resourceId: `${resource}-${secureRandomInt(1000)}`,
      result,
      errorMessage: result === "FAILURE" ? `${action} operation failed` : undefined,
      errorCode: result === "FAILURE" ? `ERR_${action.toUpperCase()}` : undefined,
      ipAddress: pickRandom(ips),
      userAgent: pickRandom(userAgents),
      requestMethod: eventType === "DATA"
        ? pickRandom(["GET", "POST", "PUT", "DELETE"])
        : "POST",
      requestPath: `/api/v2/${resource}s`,
      durationMs: secureRandomInt(500) + 10,
      tenantId: "tenant-devopscorner",
      workspaceId: "workspace-default",
      organizationId: "org-devopscorner",
      organizationName: "DevOpsCorner",
      regionId: "ap-southeast-1",
      sessionId: `session-${crypto.randomUUID()}`,
      correlationId: `corr-${crypto.randomUUID()}`,
    });
  }

  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

function generateMockAuditStats(params: AuditStatsQueryParams = {}): AuditStatistics {
  // Compute stats from the real mock log set so they're consistent with the datatable
  const baseLogs = MOCK_AUDIT_LOGS.length > 0 ? [...MOCK_AUDIT_LOGS] : generateAuditLogs(200);
  let logs: AuditLog[] = baseLogs.map(log => ({
    ...log,
    timestamp: typeof log.timestamp === 'string' ? parseInt(log.timestamp) : log.timestamp
  } as AuditLog));

  // Apply the same filters as the datatable
  if (params.eventType) {
    logs = logs.filter((l) => l.eventType === params.eventType);
  }
  if (params.result) {
    logs = logs.filter((l) => l.result === params.result);
  }
  if (params.userEmail) {
    const q = params.userEmail.toLowerCase();
    logs = logs.filter((l) => l.userEmail?.toLowerCase().includes(q));
  }
  if (params.from) {
    const fromTs = new Date(params.from).getTime();
    logs = logs.filter((l) => l.timestamp >= fromTs);
  }
  if (params.to) {
    const toTs = new Date(params.to).getTime();
    logs = logs.filter((l) => l.timestamp <= toTs);
  }

  const total = logs.length;
  if (total === 0) {
    return {
      total: 0,
      timestamp: Date.now(),
      byEventType: { AUTH: 0, AUTHZ: 0, DATA: 0, SYSTEM: 0 },
      byResult: { SUCCESS: 0, FAILURE: 0, DENIED: 0 },
      byUser: {},
      trends: {
        total: { current: 0, previous: 0, changePercent: 0, direction: "stable" },
        failures: { current: 0, previous: 0, changePercent: 0, direction: "stable" },
      },
    };
  }

  const byEventType = logs.reduce((acc, l) => {
    acc[l.eventType] = (acc[l.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byResult = logs.reduce((acc, l) => {
    acc[l.result] = (acc[l.result] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byUser = logs.reduce((acc, l) => {
    if (l.userEmail) acc[l.userEmail] = (acc[l.userEmail] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const failureCount = byResult["FAILURE"] || 0;
  const previousTotal = Math.floor(total * (0.8 + secureRandomInt(100) / 250));
  const previousFailures = Math.floor(failureCount * (0.8 + secureRandomInt(100) / 250));

  return {
    total,
    timestamp: Date.now(),
    byEventType: {
      AUTH: byEventType["AUTH"] || 0,
      AUTHZ: byEventType["AUTHZ"] || 0,
      DATA: byEventType["DATA"] || 0,
      SYSTEM: byEventType["SYSTEM"] || 0,
    },
    byResult: {
      SUCCESS: byResult["SUCCESS"] || 0,
      FAILURE: failureCount,
      DENIED: byResult["DENIED"] || 0,
    },
    byUser,
    trends: {
      total: {
        current: total,
        previous: previousTotal,
        changePercent: Math.round(((total - previousTotal) / previousTotal) * 100),
        direction: total > previousTotal ? "up" : total < previousTotal ? "down" : "stable",
      },
      failures: {
        current: failureCount,
        previous: previousFailures,
        changePercent: previousFailures > 0
          ? Math.round(((failureCount - previousFailures) / previousFailures) * 100)
          : 0,
        direction: failureCount > previousFailures ? "up" : failureCount < previousFailures ? "down" : "stable",
      },
    },
  };
}

// ==================== BACKEND RESPONSE TYPES ====================

interface BackendPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

interface BackendAuditStatsResponse {
  total: number;
  timestamp: string;
  by_event_type: { AUTH: number; AUTHZ: number; DATA: number; SYSTEM: number };
  by_result: { SUCCESS: number; FAILURE: number; DENIED: number };
  by_user?: Record<string, number>;
  by_organization?: Record<string, number>;
  trends?: {
    total?: { current: number; previous: number; change_percent: number; direction: "up" | "down" | "stable" };
    failures?: { current: number; previous: number; change_percent: number; direction: "up" | "down" | "stable" };
  };
}

function transformAuditStats(response: BackendAuditStatsResponse): AuditStatistics {
  return {
    total: response.total,
    timestamp: new Date(response.timestamp).getTime(),
    byEventType: response.by_event_type,
    byResult: response.by_result,
    byUser: response.by_user,
    byOrganization: response.by_organization,
    trends: response.trends
      ? {
          total: response.trends.total
            ? {
                current: response.trends.total.current,
                previous: response.trends.total.previous,
                changePercent: response.trends.total.change_percent,
                direction: response.trends.total.direction,
              }
            : undefined,
          failures: response.trends.failures
            ? {
                current: response.trends.failures.current,
                previous: response.trends.failures.previous,
                changePercent: response.trends.failures.change_percent,
                direction: response.trends.failures.direction,
              }
            : undefined,
        }
      : undefined,
  };
}

// ==================== GRAPH MOCK GENERATOR ====================

function generateMockGraph(
  type: string,
  params: { from: number; to: number },
): { series: { name: string; data: [number, number][] }[] } {
  const rangeMs = params.to - params.from;
  const hours = Math.max(1, rangeMs / 3600000);
  // Use 5-min intervals for ≤6h, hourly for ≤72h, daily otherwise
  // Enforce minimum 20 points so timeseries charts always render a visible shape
  const interval = hours > 72 ? 86400000 : hours > 6 ? 3600000 : 300000;
  const points = Math.max(20, Math.floor(rangeMs / interval));

  const makeTs = (baseVal: number, variance: number) =>
    Array.from({ length: points }, (_, i) => [
      params.from + i * interval,
      Math.max(0, Math.round(baseVal + (secureRandomInt(200) / 100 - 1) * variance)),
    ] as [number, number]);

  const jitter = (val: number, pct: number) =>
    Math.round(val + (secureRandomInt(200) / 100 - 1) * val * pct);

  switch (type) {
    // ── IAM ──────────────────────────────────────────────────────────────────
    case "registrations":
      return { series: [{ name: "Registrations", data: makeTs(6, 4) }] };
    case "active_users":
      return { series: [{ name: "Active Users", data: makeTs(18, 5) }] };
    case "login_activity":
      return {
        series: [
          { name: "Successful Logins", data: makeTs(160, 35) },
          { name: "Failed Logins", data: makeTs(8, 4) },
        ],
      };
    case "registrations_by_region": {
      const regions = [
        { name: "Southeast Asia", val: 420 },
        { name: "Asia-Pacific", val: 310 },
        { name: "Europe", val: 180 },
        { name: "North America", val: 140 },
        { name: "Middle East", val: 85 },
      ];
      return {
        series: regions.map((r) => ({
          name: r.name,
          data: [[params.to, jitter(r.val, 0.2)] as [number, number]],
        })),
      };
    }
    // ── Audit ─────────────────────────────────────────────────────────────────
    case "audit_events_by_type": {
      const eventTypes = [
        { name: "AUTH", val: 3200 },
        { name: "AUTHZ", val: 1850 },
        { name: "DATA", val: 2740 },
        { name: "SYSTEM", val: 610 },
      ];
      return {
        series: eventTypes.map((e) => ({
          name: e.name,
          data: [[params.to, jitter(e.val, 0.15)] as [number, number]],
        })),
      };
    }
    case "audit_result_distribution": {
      const results = [
        { name: "SUCCESS", val: 6800 },
        { name: "FAILURE", val: 920 },
        { name: "DENIED", val: 380 },
      ];
      return {
        series: results.map((r) => ({
          name: r.name,
          data: [[params.to, jitter(r.val, 0.1)] as [number, number]],
        })),
      };
    }
    case "audit_duration_trend":
      return { series: [{ name: "Avg Duration (ms)", data: makeTs(42, 18) }] };
    case "total_events":
      return { series: [{ name: "Events", data: makeTs(520, 120) }] };
    default:
      return { series: [] };
  }
}

// ==================== API CLIENT ====================

export const auditApi = {
  /**
   * List audit logs with optional filters and pagination
   */
  async listAuditLogs(
    params: AuditLogQueryParams = {},
  ): Promise<PaginatedAuditLogs> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      let logs: AuditLog[] = (
        MOCK_AUDIT_LOGS.length > 0 ? [...MOCK_AUDIT_LOGS] : generateAuditLogs(200)
      ).map((log) => ({
        ...log,
        timestamp:
          typeof log.timestamp === "string"
            ? new Date(log.timestamp).getTime()
            : log.timestamp,
        createdAt:
          log.createdAt ||
          (typeof log.timestamp === "string"
            ? new Date(log.timestamp).getTime()
            : log.timestamp),
        resourceId: log.resourceId || "",
      })) as AuditLog[];

      // Apply filters
      if (params.eventType) {
        logs = logs.filter((l) => l.eventType === params.eventType);
      }
      if (params.result) {
        logs = logs.filter((l) => l.result === params.result);
      }
      if (params.userId) {
        logs = logs.filter((l) => l.userId === params.userId);
      }
      if (params.userEmail) {
        logs = logs.filter((l) =>
          l.userEmail?.toLowerCase().includes(params.userEmail!.toLowerCase()),
        );
      }
      if (params.action) {
        logs = logs.filter((l) =>
          l.action.toLowerCase().includes(params.action!.toLowerCase()),
        );
      }
      if (params.resource) {
        logs = logs.filter((l) => l.resource === params.resource);
      }
      if (params.from) {
        const fromTs = new Date(params.from).getTime();
        logs = logs.filter((l) => {
          const ts = typeof l.timestamp === "string" ? new Date(l.timestamp).getTime() : l.timestamp;
          return ts >= fromTs;
        });
      }
      if (params.to) {
        const toTs = new Date(params.to).getTime();
        logs = logs.filter((l) => {
          const ts = typeof l.timestamp === "string" ? new Date(l.timestamp).getTime() : l.timestamp;
          return ts <= toTs;
        });
      }
      if (params.organizationId) {
        logs = logs.filter((l) => l.organizationId === params.organizationId);
      }

      // Sorting
      if (params.sortBy) {
        const sortKey = params.sortBy as keyof AuditLog;
        const sortOrder = params.sortOrder === "asc" ? 1 : -1;
        logs.sort((a, b) => {
          const aVal = a[sortKey];
          const bVal = b[sortKey];
          if (aVal === undefined) return 1;
          if (bVal === undefined) return -1;
          if (aVal < bVal) return -1 * sortOrder;
          if (aVal > bVal) return 1 * sortOrder;
          return 0;
        });
      }

      // Pagination
      const page = params.page || 1;
      const pageSize = params.pageSize || params.limit || 20;
      const total = logs.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const paginated = logs.slice(start, start + pageSize);

      return {
        data: paginated,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    }

    // Real API call
    const res = await iamClient.get<BackendPaginatedResponse<AuditLogResponse>>(
      AUDIT_ENDPOINTS.BASE,
      {
        params: {
          page: params.page,
          pageSize: params.pageSize || params.limit,
          userId: params.userId,
          userEmail: params.userEmail,
          eventType: params.eventType,
          result: params.result,
          action: params.action,
          resource: params.resource,
          startDate: params.from,
          endDate: params.to,
          search: params.search,
        },
      },
    );

    return {
      data: res.data.map(transformAuditLog),
      total: res.total,
      page: res.page,
      pageSize: res.page_size,
      totalPages: res.total_pages,
      hasNext: res.has_next,
      hasPrevious: res.has_previous,
    };
  },

  /**
   * Get a single audit log by ID
   */
  async getAuditLog(id: string): Promise<AuditLog> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const logs = MOCK_AUDIT_LOGS.length > 0 ? [...MOCK_AUDIT_LOGS] : generateAuditLogs(50);
      const log = logs.find((l) => l.id === id);
      if (!log) {
        return { ...logs[0], id } as AuditLog;
      }
      return log as AuditLog;
    }

    const response = await iamClient.get<AuditLogResponse>(
      AUDIT_ENDPOINTS.SINGLE(id),
    );
    return transformAuditLog(response);
  },

  /**
   * Get audit log count with optional filters
   */
  async getAuditCount(params: AuditLogQueryParams = {}): Promise<number> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const logs = MOCK_AUDIT_LOGS.length > 0 ? MOCK_AUDIT_LOGS : generateAuditLogs(100);
      return logs.length;
    }

    const response = await iamClient.get<{ count: number }>(
      AUDIT_ENDPOINTS.COUNT,
      {
        params: {
          userId: params.userId,
          userEmail: params.userEmail,
          eventType: params.eventType,
          result: params.result,
          action: params.action,
          resource: params.resource,
          startDate: params.from,
          endDate: params.to,
          search: params.search,
        },
      },
    );
    return response.count;
  },

  /**
   * Get audit statistics
   */
  async getAuditStats(
    params: AuditStatsQueryParams = {},
  ): Promise<AuditStatistics> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return generateMockAuditStats(params);
    }

    const response = await iamClient.get<BackendAuditStatsResponse>(
      AUDIT_ENDPOINTS.STATS,
      {
        params: {
          from: params.from,
          to: params.to,
          eventType: params.eventType,
          result: params.result,
          userEmail: params.userEmail,
          organizationId: params.organizationId,
          workspaceId: params.workspaceId,
          groupBy: params.groupBy,
        },
      },
    );
    return transformAuditStats(response);
  },

  /**
   * Export audit logs
   */
  async exportAuditLogs(options: AuditExportOptions): Promise<Blob> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const logs = generateMockAuditLogs(options.limit || 100);
      let filtered = logs;

      if (options.eventType) {
        filtered = filtered.filter((l) => l.eventType === options.eventType);
      }
      if (options.result) {
        filtered = filtered.filter((l) => l.result === options.result);
      }
      if (options.from) {
        const fromTs = new Date(options.from).getTime();
        filtered = filtered.filter((l) => l.timestamp >= fromTs);
      }
      if (options.to) {
        const toTs = new Date(options.to).getTime();
        filtered = filtered.filter((l) => l.timestamp <= toTs);
      }

      if (options.format === "csv") {
        const headers = ["id", "timestamp", "userId", "userEmail", "eventType", "action", "resource", "result", "ipAddress"];
        const csv = [
          headers.join(","),
          ...filtered.map((l) =>
            [l.id, new Date(l.timestamp).toISOString(), l.userId, l.userEmail, l.eventType, l.action, l.resource, l.result, l.ipAddress].join(","),
          ),
        ].join("\n");
        return new Blob([csv], { type: "text/csv" });
      }

      return new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    }

    // Real API call — backend streams file directly
    const blob = await iamClient.get<Blob>(AUDIT_ENDPOINTS.EXPORT, {
      params: {
        format: options.format,
        eventType: options.eventType,
        result: options.result,
        startDate: options.from,
        endDate: options.to,
        pageSize: options.limit || 1000,
      },
      responseType: "blob",
    });
    return blob;
  },

  /**
   * Get recent login events for a user
   */
  async getUserLoginHistory(
    userId: string,
    limit: number = 10,
  ): Promise<AuditLog[]> {
    const result = await this.listAuditLogs({
      userId,
      eventType: "AUTH",
      action: "login",
      limit,
      sortBy: "timestamp",
      sortOrder: "desc",
    });
    return result.data;
  },

  /**
   * Get failed login attempts
   */
  async getFailedLogins(
    params: { from?: string; to?: string; limit?: number } = {},
  ): Promise<AuditLog[]> {
    const result = await this.listAuditLogs({
      eventType: "AUTH",
      result: "FAILURE",
      from: params.from,
      to: params.to,
      limit: params.limit || 50,
      sortBy: "timestamp",
      sortOrder: "desc",
    });
    return result.data;
  },

  /**
   * Get security events (denied access)
   */
  async getSecurityEvents(
    params: { from?: string; to?: string; limit?: number } = {},
  ): Promise<AuditLog[]> {
    const result = await this.listAuditLogs({
      result: "DENIED",
      from: params.from,
      to: params.to,
      limit: params.limit || 50,
      sortBy: "timestamp",
      sortOrder: "desc",
    });
    return result.data;
  },

  /**
   * Get chart series for IAM overview graphs from audit_logs.
   * type: "registrations" | "active_users" | "login_activity" | "registrations_by_region"
   * Returns { series: [{ name, data: [[timestamp_ms, value]] }] }
   */
  async getGraph(
    type: string,
    params: { from: number; to: number },
  ): Promise<{ series: { name: string; data: [number, number][] }[] }> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 150 + secureRandomInt(200)));
      return generateMockGraph(type, params);
    }

    const response = await iamClient.get<{ series: { name: string; data: [number, number][] }[] }>(
      "/audit/graph",
      { params: { type, from: params.from, to: params.to } },
    );
    return response;
  },
};

export default auditApi;
