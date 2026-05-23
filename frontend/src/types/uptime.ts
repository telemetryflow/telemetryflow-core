/**
 * Uptime Monitoring Types
 * TASK-09: Frontend types for Uptime module
 *
 * Matches backend DTOs from monitoring/uptime module
 */

// ==================== GLOBAL UPTIME COLORS ====================

/**
 * Canonical uptime color palette — use these everywhere for consistency.
 *   Green  → Up / Success
 *   Red    → Down / Failure
 *   Gray   → No Data / Paused / Unknown
 *   Orange → Other Issues (degraded, timeout, error, pending)
 */
export const UPTIME_COLORS = {
  up: "#22c55e",
  down: "#ef4444",
  noData: "#9ca3af",
  issues: "#f59e0b",
} as const;

// ==================== ENUMS ====================

export type MonitorType =
  | "http"
  | "https"
  | "tcp"
  | "ping"
  | "dns"
  | "udp"
  | "smtp"
  | "pop3"
  | "imap"
  | "keyword"
  | "json_query"
  | "grpc"
  | "docker"
  | "postgres"
  | "mysql"
  | "mongodb"
  | "redis"
  | "kafka"
  | "rabbitmq"
  | "mqtt"
  | "websocket"
  | "ssl_certificate"
  | "game_server"
  | "custom";

export const MONITOR_TYPES: Record<
  MonitorType,
  { label: string; icon: string; color: string }
> = {
  http: { label: "HTTP", icon: "carbon:http", color: "info" },
  https: { label: "HTTPS", icon: "carbon:locked", color: "success" },
  tcp: { label: "TCP", icon: "carbon:port-input", color: "default" },
  ping: { label: "Ping/ICMP", icon: "carbon:network-2", color: "default" },
  dns: { label: "DNS", icon: "carbon:dns-services", color: "info" },
  udp: { label: "UDP", icon: "carbon:network-3", color: "default" },
  smtp: { label: "SMTP", icon: "carbon:email", color: "warning" },
  pop3: { label: "POP3", icon: "carbon:email", color: "warning" },
  imap: { label: "IMAP", icon: "carbon:email", color: "warning" },
  keyword: { label: "Keyword", icon: "carbon:search", color: "info" },
  json_query: { label: "JSON Query", icon: "carbon:json", color: "info" },
  grpc: { label: "gRPC", icon: "carbon:api", color: "purple" },
  docker: { label: "Docker", icon: "carbon:logo-docker", color: "info" },
  postgres: { label: "PostgreSQL", icon: "carbon:db2-database", color: "info" },
  mysql: { label: "MySQL", icon: "carbon:db2-database", color: "warning" },
  mongodb: { label: "MongoDB", icon: "carbon:db2-database", color: "success" },
  redis: { label: "Redis", icon: "carbon:db2-database", color: "error" },
  kafka: { label: "Kafka", icon: "carbon:flow-stream", color: "default" },
  rabbitmq: { label: "RabbitMQ", icon: "carbon:queue", color: "warning" },
  mqtt: { label: "MQTT", icon: "carbon:iot-connect", color: "info" },
  websocket: { label: "WebSocket", icon: "carbon:two-way", color: "info" },
  ssl_certificate: {
    label: "SSL Certificate",
    icon: "carbon:certificate",
    color: "success",
  },
  game_server: {
    label: "Game Server",
    icon: "carbon:game-console",
    color: "purple",
  },
  custom: { label: "Custom", icon: "carbon:settings", color: "default" },
};

export type MonitorStatus =
  | "up"
  | "down"
  | "degraded"
  | "paused"
  | "pending"
  | "unknown";

export const MONITOR_STATUS: Record<
  MonitorStatus,
  { label: string; color: string; icon: string }
> = {
  up: { label: "Up", color: "success", icon: "carbon:checkmark-filled" },
  down: { label: "Down", color: "error", icon: "carbon:close-filled" },
  degraded: {
    label: "Degraded",
    color: "warning",
    icon: "carbon:warning-filled",
  },
  paused: { label: "Paused", color: "default", icon: "carbon:pause-filled" },   // Gray
  pending: { label: "Pending", color: "warning", icon: "carbon:time" },         // Orange
  unknown: { label: "Unknown", color: "default", icon: "carbon:help" },         // Gray
};

export type CheckStatus = "success" | "failure" | "timeout" | "error";

export const CHECK_STATUS: Record<
  CheckStatus,
  { label: string; color: string }
> = {
  success: { label: "Success", color: "success" },   // Green
  failure: { label: "Failure", color: "error" },     // Red
  timeout: { label: "Timeout", color: "warning" },   // Orange
  error: { label: "Error", color: "warning" },       // Orange
};

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

// ==================== CORE TYPES ====================

/**
 * Latency percentiles in milliseconds
 */
export interface LatencyPercentiles {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

/**
 * Per-day uptime data from ClickHouse uptime_checks_1d materialized view
 */
export interface DailyUptimeStat {
  date: string;
  totalChecks: number;
  successCount: number;
  failureCount: number;
  uptimePercentage: number;
}

/**
 * Per-hour uptime data from ClickHouse uptime_checks_1h materialized view
 */
export interface HourlyUptimeStat {
  hour: string;
  totalChecks: number;
  successCount: number;
  failureCount: number;
  avgResponseTimeMs: number;
}

/**
 * Uptime statistics
 */
export interface UptimeStats {
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  uptime90d: number;
  avgResponseTime24h: number;
  avgResponseTime7d?: number;
  percentiles24h?: LatencyPercentiles;
  percentiles7d?: LatencyPercentiles;
  percentiles30d?: LatencyPercentiles;
  percentiles90d?: LatencyPercentiles;
}

/**
 * Monitor entity
 */
export interface Monitor {
  id: string;
  name: string;
  url: string;
  type: MonitorType;
  status: MonitorStatus;
  description?: string;

  // Configuration
  interval: number;
  timeout: number;
  retries: number;
  isActive: boolean;
  isPaused: boolean;

  // HTTP config
  httpMethod?: HttpMethod;
  httpHeaders?: Record<string, string>;
  httpBody?: string;
  acceptedStatusCodes?: number[];

  // Advanced config
  maxRedirects?: number;
  ignoreTlsErrors?: boolean;
  sslExpiryWarningDays?: number;
  upsideDown?: boolean;

  // Cached SSL certificate info (from last successful TLS check)
  sslCert?: {
    valid: boolean;
    issuer?: string;
    subject?: string;
    validFrom?: number;
    validTo?: number;
    daysUntilExpiry?: number;
    protocol?: string;
    cipher?: string;
  };

  // Statistics
  uptimeStats?: UptimeStats;
  lastCheckAt?: number;
  lastResponseTime?: number;
  consecutiveDownCount: number;
  consecutiveUpCount: number;

  // Check history heartbeats (last 100 checks, oldest first)
  heartbeats: Array<{ status: string; checkedAt: number }>;

  // Notifications
  notificationChannels?: string[];

  // Organization
  tags: string[];
  groupId?: string;
  organizationId: string;
  workspaceId?: string;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * Monitor from backend response (snake_case)
 */
export interface MonitorResponse {
  id: string;
  name: string;
  url: string;
  type: MonitorType;
  status: MonitorStatus;
  description?: string;
  interval: number;
  timeout: number;
  retries: number;
  is_active: boolean;
  is_paused: boolean;
  http_method?: HttpMethod;
  http_headers?: Record<string, string>;
  http_body?: string;
  accepted_status_codes?: number[];
  max_redirects?: number;
  ignore_tls_errors?: boolean;
  ssl_expiry_warning_days?: number;
  metadata?: Record<string, unknown>;
  uptime_stats?: {
    uptime_24h: number;
    uptime_7d: number;
    uptime_30d: number;
    uptime_90d: number;
    avg_response_time_24h: number;
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
  };
  last_check_at?: string;
  last_response_time?: number;
  consecutive_down_count: number;
  consecutive_up_count: number;
  heartbeats?: Array<{ status: string; checked_at: string }>;
  notification_channels?: string[];
  tags: string[];
  group_id?: string;
  organization_id: string;
  workspace_id?: string;
  // Cached SSL cert info from most recent TLS check (optional — backend populates if available)
  ssl_cert?: {
    valid: boolean;
    issuer?: string;
    subject?: string;
    valid_from?: string;
    valid_to?: string;
    days_until_expiry?: number;
    protocol?: string;
    cipher?: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Transform backend response to frontend type
 */
export function transformMonitor(response: MonitorResponse): Monitor {
  return {
    id: response.id,
    name: response.name,
    url: response.url,
    type: response.type,
    status: response.status,
    description: response.description,
    interval: response.interval,
    timeout: response.timeout,
    retries: response.retries,
    isActive: response.is_active,
    isPaused: response.is_paused,
    httpMethod: response.http_method,
    httpHeaders: response.http_headers,
    httpBody: response.http_body,
    acceptedStatusCodes: response.accepted_status_codes,
    maxRedirects: response.max_redirects,
    ignoreTlsErrors: response.ignore_tls_errors,
    sslExpiryWarningDays: response.ssl_expiry_warning_days,
    upsideDown: (response.metadata as any)?.upsideDown ?? false,
    uptimeStats: response.uptime_stats
      ? {
          uptime24h: response.uptime_stats.uptime_24h,
          uptime7d: response.uptime_stats.uptime_7d,
          uptime30d: response.uptime_stats.uptime_30d,
          uptime90d: response.uptime_stats.uptime_90d,
          avgResponseTime24h: response.uptime_stats.avg_response_time_24h,
          percentiles24h: response.uptime_stats.percentiles_24h,
          percentiles7d: response.uptime_stats.percentiles_7d,
          percentiles30d: response.uptime_stats.percentiles_30d,
          percentiles90d: response.uptime_stats.percentiles_90d,
        }
      : undefined,
    lastCheckAt: response.last_check_at
      ? new Date(response.last_check_at).getTime()
      : undefined,
    lastResponseTime: response.last_response_time,
    consecutiveDownCount: response.consecutive_down_count,
    consecutiveUpCount: response.consecutive_up_count,
    heartbeats: (response.heartbeats || []).map((hb) => ({
      status: hb.status,
      checkedAt: new Date(hb.checked_at).getTime(),
    })),
    notificationChannels: response.notification_channels || [],
    tags: response.tags || [],
    groupId: response.group_id,
    organizationId: response.organization_id,
    workspaceId: response.workspace_id,
    // ssl_cert: only set when backend returns this field — no mock fallback
    sslCert: response.ssl_cert
      ? {
          valid: response.ssl_cert.valid,
          issuer: response.ssl_cert.issuer,
          subject: response.ssl_cert.subject,
          validFrom: response.ssl_cert.valid_from
            ? new Date(response.ssl_cert.valid_from).getTime()
            : undefined,
          validTo: response.ssl_cert.valid_to
            ? new Date(response.ssl_cert.valid_to).getTime()
            : undefined,
          daysUntilExpiry: response.ssl_cert.days_until_expiry,
          protocol: response.ssl_cert.protocol,
          cipher: response.ssl_cert.cipher,
        }
      : undefined,
    createdAt: new Date(response.created_at).getTime(),
    updatedAt: new Date(response.updated_at).getTime(),
  };
}

/**
 * Monitor group
 */
export interface MonitorGroup {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isExpanded: boolean;
  monitorIds: string[];
  organizationId: string;
  workspaceId?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Uptime check result
 */
export interface UptimeCheck {
  id: string;
  monitorId: string;
  status: CheckStatus;
  statusCode?: number;
  responseTime: number;
  timing?: {
    dnsLookup?: number;
    tcpConnection?: number;
    tlsHandshake?: number;
    firstByte?: number;
    contentTransfer?: number;
    total: number;
  };
  sslInfo?: {
    valid: boolean;
    issuer?: string;
    subject?: string;
    validFrom?: number;
    validTo?: number;
    daysUntilExpiry?: number;
  };
  message?: string;
  error?: string;
  ipAddress?: string;
  region?: string;
  checkedAt: number;
}

// ==================== REQUEST TYPES ====================

export interface CreateMonitorRequest {
  name: string;
  url: string;
  type?: MonitorType;
  description?: string;
  interval?: number;
  timeout?: number;
  retries?: number;
  httpConfig?: {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: string;
    acceptedStatusCodes?: number[];
    maxRedirects?: number;
    ignoreTlsErrors?: boolean;
  };
  sslConfig?: {
    expiryDaysWarning?: number;
  };
  notificationChannels?: string[];
  tags?: string[];
  groupId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateMonitorRequest {
  name?: string;
  url?: string;
  type?: MonitorType;
  description?: string;
  interval?: number;
  timeout?: number;
  retries?: number;
  httpConfig?: {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: string;
    acceptedStatusCodes?: number[];
    maxRedirects?: number;
    ignoreTlsErrors?: boolean;
  };
  sslConfig?: {
    expiryDaysWarning?: number;
  };
  notificationChannels?: string[];
  tags?: string[];
  groupId?: string;
  metadata?: Record<string, unknown>;
}

export interface ListMonitorsQuery {
  name?: string;
  status?: MonitorStatus;
  type?: MonitorType;
  groupId?: string;
  page?: number;
  pageSize?: number;
}

export interface GetChecksQuery {
  from?: string;
  to?: string;
  limit?: number;
}

// ==================== RESPONSE TYPES ====================

export interface PaginatedMonitors {
  data: Monitor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ==================== UI HELPERS ====================

/**
 * Format uptime percentage
 */
export function formatUptime(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

/**
 * Get uptime color based on percentage
 */
export function getUptimeColor(percentage: number): string {
  if (percentage >= 99) return "success";    // Green
  if (percentage >= 90) return "warning";    // Orange
  return "error";                            // Red
}

/**
 * Format response time
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get status icon
 */
export function getStatusIcon(status: MonitorStatus): string {
  return MONITOR_STATUS[status]?.icon || "carbon:help";
}
