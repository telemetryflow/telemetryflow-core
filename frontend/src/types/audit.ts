/**
 * Audit Module Types
 * TASK-08: Synchronize audit module with frontend
 *
 * Matches backend ClickHouse audit_logs table structure
 */

import type { BaseStatistics, TrendInfo } from "./statistics";

// ==================== ENUMS ====================

/**
 * Audit event types (matches backend Enum8)
 */
export type AuditEventType = "AUTH" | "AUTHZ" | "DATA" | "SYSTEM";

export const AUDIT_EVENT_TYPES: Record<
  AuditEventType,
  { label: string; value: number; color: string }
> = {
  AUTH: { label: "Authentication", value: 1, color: "info" },
  AUTHZ: { label: "Authorization", value: 2, color: "warning" },
  DATA: { label: "Data Operation", value: 3, color: "success" },
  SYSTEM: { label: "System", value: 4, color: "default" },
};

/**
 * Audit result states (matches backend Enum8)
 */
export type AuditResult = "SUCCESS" | "FAILURE" | "DENIED";

export const AUDIT_RESULTS: Record<
  AuditResult,
  { label: string; value: number; color: string }
> = {
  SUCCESS: { label: "Success", value: 1, color: "success" },
  FAILURE: { label: "Failure", value: 2, color: "error" },
  DENIED: { label: "Denied", value: 3, color: "warning" },
};

// ==================== CORE TYPES ====================

/**
 * Audit log entry (matches ClickHouse audit_logs table)
 */
export interface AuditLog {
  // Core identifiers
  id: string;
  timestamp: number; // Unix timestamp in ms
  createdAt: number;

  // User information
  userId: string;
  userEmail: string;
  userFirstName?: string;
  userLastName?: string;

  // Event information
  eventType: AuditEventType;
  action: string;
  resource: string;
  resourceId?: string;
  result: AuditResult;

  // Error information
  errorMessage?: string;
  errorCode?: string;

  // Request information
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;

  // Metadata
  metadata?: Record<string, unknown>;
  durationMs?: number;

  // Multi-tenancy
  tenantId?: string;
  workspaceId?: string;
  organizationId?: string;
  organizationName?: string;
  regionId?: string;

  // Session tracking
  sessionId?: string;
  correlationId?: string;
}

/**
 * Audit log from backend API response (snake_case)
 */
export interface AuditLogResponse {
  id: string;
  timestamp: string;
  created_at: string;
  user_id: string;
  user_email: string;
  user_first_name?: string;
  user_last_name?: string;
  event_type: AuditEventType;
  action: string;
  resource: string;
  resource_id?: string;
  result: AuditResult;
  error_message?: string;
  error_code?: string;
  ip_address?: string;
  user_agent?: string;
  request_method?: string;
  request_path?: string;
  metadata?: string; // JSON string
  duration_ms?: number;
  tenant_id?: string;
  workspace_id?: string;
  organization_id?: string;
  organization_name?: string;
  region_id?: string;
  session_id?: string;
  correlation_id?: string;
}

/**
 * Transform backend response to frontend type
 */
export function transformAuditLog(response: AuditLogResponse): AuditLog {
  return {
    id: response.id,
    timestamp: new Date(response.timestamp).getTime(),
    createdAt: response.created_at ? new Date(response.created_at).getTime() : new Date(response.timestamp).getTime(),
    userId: response.user_id,
    userEmail: response.user_email,
    userFirstName: response.user_first_name,
    userLastName: response.user_last_name,
    eventType: response.event_type,
    action: response.action,
    resource: response.resource,
    resourceId: response.resource_id,
    result: response.result,
    errorMessage: response.error_message,
    errorCode: response.error_code,
    ipAddress: response.ip_address,
    userAgent: response.user_agent,
    requestMethod: response.request_method,
    requestPath: response.request_path,
    metadata: response.metadata ? JSON.parse(response.metadata) : undefined,
    durationMs: response.duration_ms,
    tenantId: response.tenant_id,
    workspaceId: response.workspace_id,
    organizationId: response.organization_id,
    organizationName: response.organization_name,
    regionId: response.region_id,
    sessionId: response.session_id,
    correlationId: response.correlation_id,
  };
}

// ==================== STATISTICS TYPES ====================

/**
 * Audit statistics by event type
 */
export interface AuditEventTypeStats {
  AUTH: number;
  AUTHZ: number;
  DATA: number;
  SYSTEM: number;
}

/**
 * Audit statistics by result
 */
export interface AuditResultStats {
  SUCCESS: number;
  FAILURE: number;
  DENIED: number;
}

/**
 * Audit statistics response (extends BaseStatistics for composable compatibility)
 */
export interface AuditStatistics extends BaseStatistics {
  byEventType: AuditEventTypeStats;
  byResult: AuditResultStats;
  byUser?: Record<string, number>;
  byOrganization?: Record<string, number>;
  trends?: {
    total?: TrendInfo;
    failures?: TrendInfo;
  };
}

/**
 * User activity statistics
 */
export interface UserActivityStats {
  userId: string;
  userEmail: string;
  totalEvents: number;
  lastActivity: number;
  byEventType: Partial<AuditEventTypeStats>;
}

/**
 * Organization activity statistics
 */
export interface OrganizationActivityStats {
  organizationId: string;
  organizationName?: string;
  totalEvents: number;
  byEventType: Partial<AuditEventTypeStats>;
  byResult: Partial<AuditResultStats>;
}

// ==================== QUERY TYPES ====================

/**
 * Audit log query parameters
 */
export interface AuditLogQueryParams {
  // Pagination
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;

  // Filters
  userId?: string;
  userEmail?: string;
  action?: string;
  eventType?: AuditEventType;
  result?: AuditResult;
  resource?: string;
  resourceId?: string;
  search?: string;

  // Time range
  from?: string; // ISO date string
  to?: string; // ISO date string

  // Multi-tenancy
  tenantId?: string;
  workspaceId?: string;
  organizationId?: string;

  // Sorting
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated audit logs response
 */
export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Audit statistics query parameters
 */
export interface AuditStatsQueryParams {
  // Time range
  from?: string;
  to?: string;

  // Group by
  groupBy?: "eventType" | "result" | "user" | "organization" | "day" | "hour";

  // Filters
  organizationId?: string;
  workspaceId?: string;
  tenantId?: string;

  // Active UI filters (sync stat panels with datatable)
  eventType?: AuditEventType;
  result?: AuditResult;
  userEmail?: string;
}

// ==================== EXPORT TYPES ====================

/**
 * Audit export format
 */
export type AuditExportFormat = "json" | "csv";

/**
 * Audit export options
 */
export interface AuditExportOptions {
  format: AuditExportFormat;
  from?: string;
  to?: string;
  eventType?: AuditEventType;
  result?: AuditResult;
  limit?: number;
}

// ==================== UI HELPER TYPES ====================

/**
 * Audit log filter configuration
 */
export interface AuditLogFilter {
  eventTypes: AuditEventType[];
  results: AuditResult[];
  dateRange: {
    from: number | null;
    to: number | null;
  };
  searchText: string;
  userId?: string;
}

/**
 * Default filter values
 */
export const DEFAULT_AUDIT_FILTER: AuditLogFilter = {
  eventTypes: [],
  results: [],
  dateRange: {
    from: null,
    to: null,
  },
  searchText: "",
};

// ==================== COMMON ACTIONS ====================

/**
 * Common audit actions by event type
 */
export const COMMON_AUDIT_ACTIONS: Record<AuditEventType, string[]> = {
  AUTH: [
    "login",
    "logout",
    "login_failed",
    "password_reset",
    "password_change",
    "token_refresh",
    "mfa_enabled",
    "mfa_disabled",
    "session_created",
    "session_expired",
  ],
  AUTHZ: [
    "access_granted",
    "access_denied",
    "permission_check",
    "role_assigned",
    "role_removed",
    "api_key_used",
  ],
  DATA: [
    "create",
    "read",
    "update",
    "delete",
    "export",
    "import",
    "bulk_create",
    "bulk_update",
    "bulk_delete",
  ],
  SYSTEM: [
    "startup",
    "shutdown",
    "config_change",
    "migration_run",
    "backup_created",
    "backup_restored",
    "error",
    "warning",
  ],
};

/**
 * Get human-readable action label
 */
export function getActionLabel(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get event type badge color
 */
export function getEventTypeColor(eventType: AuditEventType): string {
  return AUDIT_EVENT_TYPES[eventType]?.color || "default";
}

/**
 * Get result badge color
 */
export function getResultColor(result: AuditResult): string {
  return AUDIT_RESULTS[result]?.color || "default";
}

/**
 * Format user display name from audit log
 */
export function formatAuditUserName(log: AuditLog): string {
  if (log.userFirstName && log.userLastName) {
    return `${log.userFirstName} ${log.userLastName}`;
  }
  if (log.userEmail) {
    return log.userEmail;
  }
  return log.userId || "Unknown";
}
