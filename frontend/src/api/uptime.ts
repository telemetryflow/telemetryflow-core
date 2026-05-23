/**
 * Uptime Monitoring API client
 * TASK-09: Frontend API client for Uptime module
 */

import { collectorClient } from "./collector";
import { config } from "@/config";
import { useAlertsStore } from "@/store";
import type {
  Monitor,
  MonitorResponse,
  UptimeCheck,
  UptimeStats,
  DailyUptimeStat,
  HourlyUptimeStat,
  LatencyPercentiles,
  CreateMonitorRequest,
  UpdateMonitorRequest,
  ListMonitorsQuery,
  GetChecksQuery,
  PaginatedMonitors,
  MonitorType,
  MonitorStatus,
  CheckStatus,
  HttpMethod,
} from "@/types/uptime";
import { transformMonitor } from "@/types/uptime";

// ==================== ENDPOINTS ====================

export const UPTIME_ENDPOINTS = {
  MONITORS: "/api/v2/uptime/monitors",
  MONITOR: (id: string) => `/api/v2/uptime/monitors/${id}`,
  PAUSE: (id: string) => `/api/v2/uptime/monitors/${id}/pause`,
  RESUME: (id: string) => `/api/v2/uptime/monitors/${id}/resume`,
  CHECKS: (id: string) => `/api/v2/uptime/monitors/${id}/checks`,
  STATS: (id: string) => `/api/v2/uptime/monitors/${id}/stats`,
  DAILY_STATS: (id: string) => `/api/v2/uptime/monitors/${id}/daily-stats`,
  HOURLY_STATS: (id: string) => `/api/v2/uptime/monitors/${id}/hourly-stats`,
  SSL_TREND: (id: string) => `/api/v2/uptime/monitors/${id}/ssl-trend`,
  SSL_SUMMARY: "/api/v2/uptime/monitors/ssl-summary",
  TEST: "/api/v2/uptime/monitors/test",
  GROUPS: "/api/v2/uptime/groups",
  GROUP: (id: string) => `/api/v2/uptime/groups/${id}`,
} as const;

// ==================== MOCK DATA ====================

/**
 * MOCK MONITOR DEFINITIONS
 * 
 * IMPORTANT: These 3 monitors match EXACTLY with backend seeds
 * Location: backend/src/modules/monitoring/uptime/infrastructure/persistence/seeds/index.ts
 * 
 * DO NOT add dummy/fake monitors here - only real production monitors
 */
const MOCK_MONITOR_DEFINITIONS: Array<{
  name: string;
  url: string;
  type: MonitorType;
  status: MonitorStatus;
  interval: number;
  timeout: number;
  retries: number;
  httpMethod?: HttpMethod;
  tags: string[];
  description: string;
  groupId: string;
  groupName: string;
  uptimeOverrides: {
    uptime24h: number;
    uptime7d: number;
    uptime30d: number;
    uptime90d: number;
    avgResponseTime24h: number;
    avgResponseTime7d?: number;
  };
  /** SSL certificate profile — synced with backend CH seed (1719000000020) */
  ssl: {
    daysUntilExpiry: number;  // as of today (matches sslBaseDays in CH seed)
    issuer: string;
    subject: string;
  } | null;
}> = [
  // ==================== REAL MONITORS - Synced with Backend Seeds ====================
  {
    name: "TelemetryFlow Official Website",
    url: "https://telemetryflow.id",
    type: "https",
    status: "up",
    interval: 60,
    timeout: 30,
    retries: 3,
    httpMethod: "GET",
    tags: ["observability", "telemetryflow", "website"],
    description: "TelemetryFlow Official Website (Landing Page)",
    groupId: "group-production-services",
    groupName: "Production Services",
    uptimeOverrides: {
      uptime24h: 100.0,
      uptime7d: 99.98,
      uptime30d: 99.95,
      uptime90d: 99.92,
      avgResponseTime24h: 145,
      avgResponseTime7d: 152,
    },
    ssl: {
      daysUntilExpiry: 39,
      issuer: "Let's Encrypt",
      subject: "CN=telemetryflow.id",
    },
  },
  {
    name: "TelemetryFlow Demo Website",
    url: "https://demo.telemetryflow.id",
    type: "https",
    status: "up",
    interval: 60,
    timeout: 30,
    retries: 3,
    httpMethod: "GET",
    tags: ["observability", "telemetryflow", "demo"],
    description: "TelemetryFlow Demo Environment Website",
    groupId: "group-production-services",
    groupName: "Production Services",
    uptimeOverrides: {
      uptime24h: 100.0,
      uptime7d: 99.95,
      uptime30d: 99.90,
      uptime90d: 99.88,
      avgResponseTime24h: 180,
      avgResponseTime7d: 195,
    },
    ssl: {
      daysUntilExpiry: 39,
      issuer: "Let's Encrypt",
      subject: "CN=demo.telemetryflow.id",
    },
  },
  {
    name: "TelemetryFlow GitHub Repository",
    url: "https://github.com/telemetryflow",
    type: "https",
    status: "up",
    interval: 120,
    timeout: 30,
    retries: 2,
    httpMethod: "GET",
    tags: ["observability", "telemetryflow", "github", "repository"],
    description: "TelemetryFlow GitHub Organization Repository",
    groupId: "group-production-services",
    groupName: "Production Services",
    uptimeOverrides: {
      uptime24h: 100.0,
      uptime7d: 99.99,
      uptime30d: 99.97,
      uptime90d: 99.95,
      avgResponseTime24h: 120,
      avgResponseTime7d: 135,
    },
    ssl: {
      daysUntilExpiry: 86,
      issuer: "DigiCert Global CA G2",
      subject: "CN=github.com",
    },
  },
  // ==================== END OF REAL MONITORS ====================
];

// Read notification channel IDs directly from the alerts store for mock integration
function getStoredChannelIds(): string[] {
  try {
    const alertsStore = useAlertsStore();
    return alertsStore.notificationChannels
      .filter((c: { enabled: boolean }) => c.enabled)
      .map((c: { id: string }) => c.id);
  } catch {
    // Fallback: read from localStorage if store is not available
    try {
      const saved = localStorage.getItem("tfo-viz-notification-channels");
      if (saved) {
        const channels = JSON.parse(saved) as Array<{
          id: string;
          enabled: boolean;
        }>;
        return channels.filter((c) => c.enabled).map((c) => c.id);
      }
    } catch {
      // ignore
    }
  }
  return [];
}

// ==================== MOCK PERSISTENCE ====================

const MOCK_MONITORS_KEY = "tfo-viz-mock-monitors";

function loadMockMonitors(): Monitor[] | null {
  try {
    const saved = localStorage.getItem(MOCK_MONITORS_KEY);
    if (saved) return JSON.parse(saved) as Monitor[];
  } catch {
    /* ignore */
  }
  return null;
}

function saveMockMonitors(monitors: Monitor[]) {
  try {
    localStorage.setItem(MOCK_MONITORS_KEY, JSON.stringify(monitors));
  } catch {
    /* ignore */
  }
}

/** Get or create persisted mock monitors */
function getMockMonitors(): Monitor[] {
  // Check if we have persisted mock monitors
  let monitors = loadMockMonitors();

  if (monitors && monitors.length > 0) {
    // Verify channel IDs still match the current store
    const currentChannelIds = getStoredChannelIds();
    const firstMonitorWithChannels = monitors.find(
      (m) => m.notificationChannels?.length,
    );
    if (firstMonitorWithChannels && currentChannelIds.length > 0) {
      const hasMatch = firstMonitorWithChannels.notificationChannels!.some(
        (id) => currentChannelIds.includes(id),
      );
      if (!hasMatch) {
        // Channel IDs changed (store re-seeded), regenerate monitors
        monitors = null;
      }
    }
  }

  if (!monitors || monitors.length === 0) {
    // Generate only 3 real monitors (matching backend seeds)
    monitors = generateMockMonitors(3);
    saveMockMonitors(monitors);
  }

  return monitors;
}

// Assign notification channels to monitors based on tags/criticality
function assignChannelsToMonitor(
  tags: string[],
  index: number,
  channelIds: string[],
): string[] | undefined {
  if (channelIds.length === 0) return undefined;

  const isCritical = tags.includes("critical");
  const isProduction = tags.includes("production");
  const isStaging = tags.includes("staging");

  if (isCritical && isProduction) {
    // Critical production: 3-4 channels
    const count = Math.min(channelIds.length, 3 + (index % 2));
    return channelIds.slice(0, count);
  }
  if (isProduction) {
    // Production: 1-2 channels
    const count = Math.min(channelIds.length, 1 + (index % 2));
    return channelIds.slice(0, count);
  }
  if (isStaging) {
    // Staging: 1 channel (every other monitor)
    if (index % 2 === 0 && channelIds.length > 0) {
      return [channelIds[0]];
    }
    return undefined;
  }
  // Internal/dev: occasional channel
  if (index % 3 === 0 && channelIds.length > 2) {
    return [channelIds[2]];
  }
  return undefined;
}

function generateMockMonitors(count: number): Monitor[] {
  const now = Date.now();
  const monitors: Monitor[] = [];
  const channelIds = getStoredChannelIds();

  // Use predefined monitors first
  const definitions = MOCK_MONITOR_DEFINITIONS.slice(
    0,
    Math.min(count, MOCK_MONITOR_DEFINITIONS.length),
  );

  definitions.forEach((def, i) => {
    const createdDaysAgo = Math.floor(Math.random() * 90) + 7;

    monitors.push({
      id: `monitor-${i + 1}`,
      name: def.name,
      url: def.url,
      type: def.type,
      status: def.status,
      description: def.description,
      interval: def.interval,
      timeout: def.timeout,
      retries: def.retries,
      isActive: true,
      isPaused: def.status === "paused",
      httpMethod: def.httpMethod,
      notificationChannels: assignChannelsToMonitor(def.tags, i, channelIds),
      uptimeStats: {
        uptime24h: def.uptimeOverrides.uptime24h,
        uptime7d: def.uptimeOverrides.uptime7d,
        uptime30d: def.uptimeOverrides.uptime30d,
        uptime90d: def.uptimeOverrides.uptime90d,
        avgResponseTime24h: def.uptimeOverrides.avgResponseTime24h,
        avgResponseTime7d: def.uptimeOverrides.avgResponseTime7d,
      },
      lastCheckAt: now - Math.floor(Math.random() * def.interval * 1000),
      lastResponseTime:
        def.status === "up"
          ? Math.max(
              50,
              def.uptimeOverrides.avgResponseTime24h +
                Math.floor(Math.random() * 40) -
                20,
            )
          : def.status === "degraded"
            ? Math.floor(Math.random() * 500) + 400
            : Math.floor(Math.random() * 2000) + 1000,
      consecutiveDownCount:
        def.status === "down" ? Math.floor(Math.random() * 10) + 1 : 0,
      consecutiveUpCount:
        def.status === "up" ? Math.floor(Math.random() * 500) + 100 : 0,
      heartbeats: Array.from({ length: 40 }, (_, j) => ({
        status: def.status === "down" ? "failure"
          : def.status === "degraded" ? (Math.random() > 0.15 ? "success" : "failure")
          : (Math.random() > 0.02 ? "success" : "failure"),
        checkedAt: now - (40 - j) * 60 * 1000,
      })),
      sslCert: def.ssl
        ? {
            valid: true,
            issuer: def.ssl.issuer,
            subject: def.ssl.subject,
            validFrom: now - 60 * 24 * 60 * 60 * 1000,
            validTo: now + def.ssl.daysUntilExpiry * 24 * 60 * 60 * 1000,
            daysUntilExpiry: def.ssl.daysUntilExpiry,
            protocol: "TLSv1.3",
            cipher: "TLS_AES_128_GCM_SHA256",
          }
        : undefined,
      tags: def.tags,
      groupId: def.groupId,
      organizationId: "org-devopscorner",
      createdAt: now - createdDaysAgo * 24 * 60 * 60 * 1000,
      updatedAt: now - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000),
    });
  });

  return monitors;
}

function generateMockChecks(monitorId: string, count: number): UptimeCheck[] {
  const checks: UptimeCheck[] = [];
  const now = Date.now();
  const statuses: CheckStatus[] = [
    "success",
    "success",
    "success",
    "success",
    "failure",
    "timeout",
  ];

  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const responseTime =
      status === "success"
        ? Math.floor(Math.random() * 500) + 50
        : Math.floor(Math.random() * 2000) + 1000;

    checks.push({
      id: `check-${Date.now()}-${i}`,
      monitorId,
      status,
      statusCode:
        status === "success" ? 200 : status === "failure" ? 500 : undefined,
      responseTime,
      timing: {
        dnsLookup: Math.floor(Math.random() * 50),
        tcpConnection: Math.floor(Math.random() * 100),
        tlsHandshake: Math.floor(Math.random() * 150),
        firstByte: Math.floor(Math.random() * 200),
        contentTransfer: Math.floor(Math.random() * 100),
        total: responseTime,
      },
      message:
        status === "success"
          ? "OK"
          : status === "failure"
            ? "Server error"
            : "Connection timed out",
      error: status !== "success" ? `Error: ${status}` : undefined,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      region: ["ap-southeast-3", "ap-southeast-1"][
        Math.floor(Math.random() * 2)
      ],
      checkedAt: now - i * 60000, // 1 minute intervals
    });
  }

  return checks;
}

// ==================== API CLIENT ====================

export const uptimeApi = {
  /**
   * List monitors with optional filters
   */
  async listMonitors(
    query: ListMonitorsQuery = {},
  ): Promise<PaginatedMonitors> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      let monitors = getMockMonitors();

      if (query.status) {
        monitors = monitors.filter((m) => m.status === query.status);
      }
      if (query.type) {
        monitors = monitors.filter((m) => m.type === query.type);
      }
      if (query.groupId) {
        monitors = monitors.filter((m) => m.groupId === query.groupId);
      }

      const page = query.page || 1;
      const pageSize = query.pageSize || 20;
      const total = monitors.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const data = monitors.slice(start, start + pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    }

    const response = await collectorClient.get<{
      items: MonitorResponse[];
      total: number;
      page: number;
      limit: number;
    }>(UPTIME_ENDPOINTS.MONITORS, {
      params: {
        status: query.status,
        type: query.type,
        group_id: query.groupId,
        page: query.page,
        limit: query.pageSize,
        _t: Date.now(), // Force cache bust
      },
    });

    return {
      data: response.data.items.map(transformMonitor),
      total: response.data.total,
      page: response.data.page,
      pageSize: response.data.limit,
      totalPages: Math.ceil(response.data.total / response.data.limit),
      hasNext: response.data.page * response.data.limit < response.data.total,
      hasPrevious: response.data.page > 1,
    };
  },

  /**
   * Get a single monitor
   */
  async getMonitor(id: string): Promise<Monitor> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const monitors = getMockMonitors();
      return monitors.find((m) => m.id === id) || { ...monitors[0], id };
    }

    const response = await collectorClient.get<MonitorResponse>(
      UPTIME_ENDPOINTS.MONITOR(id),
    );
    return transformMonitor(response.data);
  },

  /**
   * Create a new monitor
   */
  async createMonitor(data: CreateMonitorRequest): Promise<Monitor> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const now = Date.now();

      const newMonitor: Monitor = {
        id: `monitor-${now}`,
        name: data.name,
        url: data.url,
        type: data.type || "https",
        status: "pending",
        description: data.description,
        interval: data.interval || 60,
        timeout: data.timeout || 30,
        retries: data.retries || 3,
        isActive: true,
        isPaused: false,
        httpMethod: data.httpConfig?.method,
        httpHeaders: data.httpConfig?.headers,
        httpBody: data.httpConfig?.body,
        acceptedStatusCodes: data.httpConfig?.acceptedStatusCodes,
        maxRedirects: data.httpConfig?.maxRedirects,
        ignoreTlsErrors: data.httpConfig?.ignoreTlsErrors,
        sslExpiryWarningDays: data.sslConfig?.expiryDaysWarning,
        upsideDown: (data.metadata as any)?.upsideDown ?? false,
        notificationChannels: data.notificationChannels,
        consecutiveDownCount: 0,
        consecutiveUpCount: 0,
        heartbeats: [],
        tags: data.tags || [],
        groupId: data.groupId,
        organizationId: "org-devopscorner",
        createdAt: now,
        updatedAt: now,
      };

      // Persist to mock storage
      const monitors = getMockMonitors();
      monitors.unshift(newMonitor);
      saveMockMonitors(monitors);

      return newMonitor;
    }

    const response = await collectorClient.post<MonitorResponse>(
      UPTIME_ENDPOINTS.MONITORS,
      {
        name: data.name,
        url: data.url,
        type: data.type,
        description: data.description,
        interval: data.interval,
        timeout: data.timeout,
        retries: data.retries,
        http_config: data.httpConfig
          ? {
              method: data.httpConfig.method,
              headers: data.httpConfig.headers,
              body: data.httpConfig.body,
              accepted_status_codes: data.httpConfig.acceptedStatusCodes,
              max_redirects: data.httpConfig.maxRedirects,
              ignore_tls_errors: data.httpConfig.ignoreTlsErrors,
            }
          : undefined,
        ssl_config: data.sslConfig
          ? { expiry_days_warning: data.sslConfig.expiryDaysWarning }
          : undefined,
        metadata: data.metadata,
        notification_channels: data.notificationChannels,
        tags: data.tags,
        group_id: data.groupId,
      },
    );

    return transformMonitor(response.data);
  },

  /**
   * Update a monitor
   */
  async updateMonitor(
    id: string,
    data: UpdateMonitorRequest,
  ): Promise<Monitor> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const monitors = getMockMonitors();
      const idx = monitors.findIndex((m) => m.id === id);
      const monitor = idx >= 0 ? monitors[idx] : monitors[0];

      const updated: Monitor = {
        ...monitor,
        id,
        name: data.name || monitor.name,
        url: data.url || monitor.url,
        description: data.description || monitor.description,
        interval: data.interval || monitor.interval,
        timeout: data.timeout || monitor.timeout,
        retries: data.retries || monitor.retries,
        maxRedirects: data.httpConfig?.maxRedirects ?? monitor.maxRedirects,
        ignoreTlsErrors:
          data.httpConfig?.ignoreTlsErrors ?? monitor.ignoreTlsErrors,
        sslExpiryWarningDays:
          data.sslConfig?.expiryDaysWarning ?? monitor.sslExpiryWarningDays,
        upsideDown: (data.metadata as any)?.upsideDown ?? monitor.upsideDown,
        notificationChannels:
          data.notificationChannels ?? monitor.notificationChannels,
        tags: data.tags || monitor.tags,
        groupId: data.groupId || monitor.groupId,
        updatedAt: Date.now(),
      };

      // Persist updated monitor
      if (idx >= 0) {
        monitors[idx] = updated;
        saveMockMonitors(monitors);
      }

      return updated;
    }

    const payload = {
      name: data.name,
      url: data.url,
      type: data.type,
      description: data.description,
      interval: data.interval,
      timeout: data.timeout,
      retries: data.retries,
      http_config: data.httpConfig
        ? {
            method: data.httpConfig.method,
            headers: data.httpConfig.headers,
            body: data.httpConfig.body,
            accepted_status_codes: data.httpConfig.acceptedStatusCodes,
            max_redirects: data.httpConfig.maxRedirects,
            ignore_tls_errors: data.httpConfig.ignoreTlsErrors,
          }
        : undefined,
      ssl_config: data.sslConfig
        ? { expiry_days_warning: data.sslConfig.expiryDaysWarning }
        : undefined,
      metadata: data.metadata,
      notification_channels: data.notificationChannels,
      tags: data.tags,
      group_id: data.groupId,
    };

    const response = await collectorClient.put<MonitorResponse>(
      UPTIME_ENDPOINTS.MONITOR(id),
      payload,
    );

    return transformMonitor(response.data);
  },

  /**
   * Delete a monitor
   */
  async deleteMonitor(id: string): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const monitors = getMockMonitors();
      const filtered = monitors.filter((m) => m.id !== id);
      saveMockMonitors(filtered);
      return;
    }

    await collectorClient.delete(UPTIME_ENDPOINTS.MONITOR(id));
  },

  /**
   * Pause a monitor
   */
  async pauseMonitor(id: string): Promise<Monitor> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const monitors = getMockMonitors();
      const idx = monitors.findIndex((m) => m.id === id);
      if (idx >= 0) {
        monitors[idx] = {
          ...monitors[idx],
          isPaused: true,
          status: "paused",
          updatedAt: Date.now(),
        };
        saveMockMonitors(monitors);
        return monitors[idx];
      }
      return {
        ...monitors[0],
        id,
        isPaused: true,
        status: "paused",
        updatedAt: Date.now(),
      };
    }

    const response = await collectorClient.post<MonitorResponse>(
      UPTIME_ENDPOINTS.PAUSE(id),
    );
    return transformMonitor(response.data);
  },

  /**
   * Resume a monitor
   */
  async resumeMonitor(id: string): Promise<Monitor> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const monitors = getMockMonitors();
      const idx = monitors.findIndex((m) => m.id === id);
      if (idx >= 0) {
        monitors[idx] = {
          ...monitors[idx],
          isPaused: false,
          status: "pending",
          updatedAt: Date.now(),
        };
        saveMockMonitors(monitors);
        return monitors[idx];
      }
      return {
        ...monitors[0],
        id,
        isPaused: false,
        status: "pending",
        updatedAt: Date.now(),
      };
    }

    const response = await collectorClient.post<MonitorResponse>(
      UPTIME_ENDPOINTS.RESUME(id),
    );
    return transformMonitor(response.data);
  },

  /**
   * Get check history for a monitor
   */
  async getMonitorChecks(
    id: string,
    query: GetChecksQuery = {},
  ): Promise<UptimeCheck[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockChecks(id, query.limit || 100);
    }

    interface BackendCheck {
      id: string;
      monitor_id: string;
      status: CheckStatus;
      status_code?: number;
      response_time: number;
      timing?: {
        dns_lookup?: number;
        tcp_connection?: number;
        tls_handshake?: number;
        first_byte?: number;
        content_transfer?: number;
        total: number;
      };
      ssl_info?: {
        valid?: boolean;
        issuer?: string;
        subject?: string;
        valid_from?: string | number;
        valid_to?: string | number;
        days_until_expiry?: number;
        daysUntilExpiry?: number;
      };
      message?: string;
      error?: string;
      ip_address?: string;
      region?: string;
      checked_at: string;
    }

    const response = await collectorClient.get<{ data: BackendCheck[]; total: number }>(
      UPTIME_ENDPOINTS.CHECKS(id),
      {
        params: {
          from: query.from,
          to: query.to,
          limit: query.limit,
        },
      },
    );

    const checks = response.data.data || [];
    return checks.map((c) => ({
      id: c.id,
      monitorId: c.monitor_id,
      status: c.status,
      statusCode: c.status_code,
      responseTime: c.response_time,
      timing: c.timing
        ? {
            dnsLookup: c.timing.dns_lookup,
            tcpConnection: c.timing.tcp_connection,
            tlsHandshake: c.timing.tls_handshake,
            firstByte: c.timing.first_byte,
            contentTransfer: c.timing.content_transfer,
            total: c.timing.total,
          }
        : undefined,
      sslInfo: c.ssl_info
        ? {
            valid: c.ssl_info.valid ?? true,
            issuer: c.ssl_info.issuer,
            subject: c.ssl_info.subject,
            validFrom: c.ssl_info.valid_from
              ? typeof c.ssl_info.valid_from === "string"
                ? new Date(c.ssl_info.valid_from).getTime()
                : c.ssl_info.valid_from
              : undefined,
            validTo: c.ssl_info.valid_to
              ? typeof c.ssl_info.valid_to === "string"
                ? new Date(c.ssl_info.valid_to).getTime()
                : c.ssl_info.valid_to
              : undefined,
            daysUntilExpiry: c.ssl_info.days_until_expiry ?? c.ssl_info.daysUntilExpiry,
          }
        : undefined,
      message: c.message,
      error: c.error,
      ipAddress: c.ip_address,
      region: c.region,
      checkedAt: new Date(c.checked_at.endsWith("Z") || c.checked_at.includes("+") ? c.checked_at : c.checked_at + "Z").getTime(),
    }));
  },

  /**
   * Get statistics for a monitor
   */
  async getMonitorStats(id: string): Promise<UptimeStats> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const uptime = 95 + Math.random() * 5;
      const baseResponseTime = Math.floor(Math.random() * 500) + 50;
      
      // Generate realistic percentile values (P50 < P75 < P90 < P95 < P99)
      const generatePercentiles = (baseTime: number): LatencyPercentiles => {
        const p50 = Math.floor(baseTime * (0.7 + Math.random() * 0.2));
        const p75 = Math.floor(p50 * (1.2 + Math.random() * 0.3));
        const p90 = Math.floor(p75 * (1.3 + Math.random() * 0.4));
        const p95 = Math.floor(p90 * (1.2 + Math.random() * 0.3));
        const p99 = Math.floor(p95 * (1.5 + Math.random() * 0.5));
        return { p50, p75, p90, p95, p99 };
      };

      return {
        uptime24h: uptime,
        uptime7d: uptime - Math.random() * 2,
        uptime30d: uptime - Math.random() * 3,
        uptime90d: uptime - Math.random() * 5,
        avgResponseTime24h: baseResponseTime,
        avgResponseTime7d: Math.floor(Math.random() * 500) + 50,
        percentiles24h: generatePercentiles(baseResponseTime),
        percentiles7d: generatePercentiles(baseResponseTime * 1.1),
        percentiles30d: generatePercentiles(baseResponseTime * 1.15),
        percentiles90d: generatePercentiles(baseResponseTime * 1.2),
      };
    }

    interface BackendStats {
      uptime_24h: number;
      uptime_7d: number;
      uptime_30d: number;
      uptime_90d: number;
      avg_response_time_24h: number;
      avg_response_time_7d?: number;
      percentiles_24h?: {
        p50: number;
        p75: number;
        p90: number;
        p95: number;
        p99: number;
      };
      percentiles_7d?: {
        p50: number;
        p75: number;
        p90: number;
        p95: number;
        p99: number;
      };
      percentiles_30d?: {
        p50: number;
        p75: number;
        p90: number;
        p95: number;
        p99: number;
      };
      percentiles_90d?: {
        p50: number;
        p75: number;
        p90: number;
        p95: number;
        p99: number;
      };
    }

    const response = await collectorClient.get<BackendStats>(
      UPTIME_ENDPOINTS.STATS(id),
    );

    return {
      uptime24h: response.data.uptime_24h,
      uptime7d: response.data.uptime_7d,
      uptime30d: response.data.uptime_30d,
      uptime90d: response.data.uptime_90d,
      avgResponseTime24h: response.data.avg_response_time_24h,
      avgResponseTime7d: response.data.avg_response_time_7d,
      percentiles24h: response.data.percentiles_24h,
      percentiles7d: response.data.percentiles_7d,
      percentiles30d: response.data.percentiles_30d,
      percentiles90d: response.data.percentiles_90d,
    };
  },

  /**
   * Get per-day uptime stats from ClickHouse materialized view
   * Used for status page vertical bars (real per-day data)
   */
  async getDailyStats(
    id: string,
    days: number = 90,
  ): Promise<DailyUptimeStat[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Generate deterministic mock daily stats
      const result: DailyUptimeStat[] = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        // Deterministic pattern: mostly up, occasional failures
        const seed = (i * 7 + 3) % 100;
        const totalChecks = 1440; // 1 check per minute
        const failureCount = seed < 5 ? Math.floor(seed * 3) + 1 : seed < 10 ? 1 : 0;
        const successCount = totalChecks - failureCount;
        result.push({
          date: dateStr,
          totalChecks,
          successCount,
          failureCount,
          uptimePercentage: parseFloat(
            ((successCount / totalChecks) * 100).toFixed(2),
          ),
        });
      }
      return result;
    }

    interface BackendDailyStats {
      monitorId: string;
      days: Array<{
        date: string;
        totalChecks: number;
        successCount: number;
        failureCount: number;
        uptimePercentage: number;
      }>;
    }

    const response = await collectorClient.get<BackendDailyStats>(
      UPTIME_ENDPOINTS.DAILY_STATS(id),
      { params: { days } },
    );

    return response.data.days || [];
  },

  /**
   * Get per-hour uptime stats from ClickHouse materialized view
   * Used for bar charts to show granular hourly up/down status
   */
  async getHourlyStats(
    id: string,
    hours: number = 24,
  ): Promise<HourlyUptimeStat[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      // Generate deterministic mock hourly stats
      const result: HourlyUptimeStat[] = [];
      const now = new Date();
      for (let i = hours - 1; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i, 0, 0, 0);
        const hourStr = hour.toISOString();
        // Deterministic pattern: mostly up, occasional failures
        const seed = (i * 13 + 7) % 100;
        const totalChecks = 60; // 1 check per minute per hour
        const failureCount = seed < 5 ? Math.floor(seed * 2) + 1 : seed < 8 ? 1 : 0;
        const successCount = totalChecks - failureCount;
        const avgResponseTimeMs = 120 + (seed % 40) * 5 + (failureCount > 0 ? 300 : 0);
        result.push({
          hour: hourStr,
          totalChecks,
          successCount,
          failureCount,
          avgResponseTimeMs: parseFloat(avgResponseTimeMs.toFixed(2)),
        });
      }
      return result;
    }

    interface BackendHourlyStats {
      monitorId: string;
      hours: Array<{
        hour: string;
        totalChecks: number;
        successCount: number;
        failureCount: number;
        avgResponseTimeMs: number;
      }>;
    }

    const response = await collectorClient.get<BackendHourlyStats>(
      UPTIME_ENDPOINTS.HOURLY_STATS(id),
      { params: { hours } },
    );

    return response.data.hours || [];
  },

  /**
   * Get org-wide SSL certificate summary stats from ClickHouse.
   * Returns: total monitors with SSL data, near-expiry count (<30d), min and max days remaining.
   * Real data only — no mock fallback.
   */
  async getSSLSummary(): Promise<{
    total: number;
    nearExpiry: number;
    minDays: number;
    maxDays: number;
    perMonitor?: { monitorId: string; days: number }[];
  }> {
    const response = await collectorClient.get<{
      total: number;
      nearExpiry: number;
      minDays: number;
      maxDays: number;
      perMonitor?: { monitorId: string; days: number }[];
    }>(UPTIME_ENDPOINTS.SSL_SUMMARY);
    return response.data;
  },

  /**
   * Test a monitor URL without saving.
   * Returns an immediate check result (status, statusCode, responseTime, error).
   */
  async testMonitor(payload: {
    url: string;
    type?: MonitorType;
    timeout?: number;
    http_config?: {
      method?: HttpMethod;
      headers?: Record<string, string>;
      body?: string;
      ignore_tls_errors?: boolean;
    };
  }): Promise<{
    status: CheckStatus;
    statusCode?: number;
    responseTime: number;
    message?: string;
    error?: string;
    timing?: Record<string, number>;
    ipAddress?: string;
  }> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const isUp = Math.random() > 0.2;
      return {
        status: isUp ? "success" : "failure",
        statusCode: isUp ? 200 : 503,
        responseTime: isUp ? Math.floor(Math.random() * 300) + 50 : 0,
        message: isUp ? "OK" : "Connection refused",
        error: isUp ? undefined : "ECONNREFUSED",
      };
    }

    const response = await collectorClient.post<{
      status: CheckStatus;
      statusCode?: number;
      responseTime: number;
      message?: string;
      error?: string;
      timing?: Record<string, number>;
      ipAddress?: string;
    }>(UPTIME_ENDPOINTS.TEST, payload);
    return response.data;
  },

  /**
   * Get per-hour SSL days remaining trend from ClickHouse materialized view.
   * Only populated for HTTPS / ssl_certificate monitors.
   */
  async getSSLTrend(
    id: string,
    hours: number = 168,
  ): Promise<{ hour: string; minSslDays: number }[]> {
    const response = await collectorClient.get<{
      monitorId: string;
      points: Array<{ hour: string; minSslDays: number }>;
    }>(UPTIME_ENDPOINTS.SSL_TREND(id), { params: { hours } });

    return response.data.points || [];
  },
};

export default uptimeApi;
