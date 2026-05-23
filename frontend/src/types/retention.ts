/**
 * Retention Policy Types
 * TASK-10: Frontend types for Retention module
 *
 * Matches backend DTOs from retention module
 */

// ==================== ENUMS ====================

export type DataType =
  | "metrics"
  | "logs"
  | "traces"
  | "exemplars"
  | "uptime"
  | "alerts"
  | "audit_logs"
  | "kubernetes_metrics"
  | "llm_usage_raw"
  | "network_map_connection_metrics"
  | "network_map_traffic"
  | "service_map_metrics"
  | "signal_correlations"
  | "vm_metrics";

export const DATA_TYPES: Record<
  DataType,
  { label: string; icon: string; color: string; hexColor: string }
> = {
  metrics:                        { label: "Metrics",             icon: "carbon:chart-line",           color: "success", hexColor: "#22c55e" }, // green
  logs:                           { label: "Logs",                icon: "carbon:document",             color: "info",    hexColor: "#3b82f6" }, // blue
  traces:                         { label: "Traces",              icon: "carbon:flow",                 color: "warning", hexColor: "#f59e0b" }, // amber
  exemplars:                      { label: "Exemplars",           icon: "carbon:link",                 color: "info",    hexColor: "#a855f7" }, // purple
  uptime:                         { label: "Uptime",              icon: "carbon:activity",             color: "success", hexColor: "#14b8a6" }, // teal
  alerts:                         { label: "Alerts",              icon: "carbon:warning-alt",          color: "error",   hexColor: "#ef4444" }, // red (exclusive)
  audit_logs:                     { label: "Audit Logs",          icon: "carbon:document-security",    color: "info",    hexColor: "#6366f1" }, // indigo
  kubernetes_metrics:             { label: "Kubernetes",          icon: "carbon:container-services",   color: "info",    hexColor: "#0ea5e9" }, // sky
  llm_usage_raw:                  { label: "LLM Usage",           icon: "carbon:machine-learning-model", color: "info",  hexColor: "#8b5cf6" }, // violet
  network_map_connection_metrics: { label: "Network Connections", icon: "carbon:network-overlay",      color: "info",    hexColor: "#ec4899" }, // pink
  network_map_traffic:            { label: "Network Traffic",     icon: "carbon:flow-stream",          color: "success", hexColor: "#84cc16" }, // lime
  service_map_metrics:            { label: "Service Map",         icon: "carbon:flow-connection",      color: "success", hexColor: "#10b981" }, // emerald
  signal_correlations:            { label: "Correlations",        icon: "carbon:connect",              color: "info",    hexColor: "#06b6d4" }, // cyan
  vm_metrics:                     { label: "VM Metrics",          icon: "carbon:virtual-machine",      color: "warning", hexColor: "#f97316" }, // orange
};

// ==================== CORE TYPES ====================

/**
 * Retention policy entity
 */
export interface RetentionPolicy {
  id: string;
  name: string;
  description?: string;
  dataType: DataType;
  retentionDays: number;
  archiveEnabled: boolean;
  archiveDestination?: string;
  filters?: Record<string, string>;
  isDefault: boolean;
  isActive: boolean;
  organizationId?: string;
  lastEnforcedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Retention policy from backend response (camelCase — NestJS backend)
 */
export interface RetentionPolicyResponse {
  id: string;
  name: string;
  description?: string;
  dataType: DataType;
  retentionDays: number;
  archiveEnabled: boolean;
  archiveDestination?: string;
  filters?: Record<string, string>;
  isDefault: boolean;
  isActive: boolean;
  organizationId?: string;
  lastEnforcedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform backend response to frontend type
 */
export function transformRetentionPolicy(
  response: RetentionPolicyResponse,
): RetentionPolicy {
  return {
    id: response.id,
    name: response.name,
    description: response.description,
    dataType: response.dataType,
    retentionDays: response.retentionDays,
    archiveEnabled: response.archiveEnabled,
    archiveDestination: response.archiveDestination,
    filters: response.filters,
    isDefault: response.isDefault,
    isActive: response.isActive,
    organizationId: response.organizationId,
    lastEnforcedAt: response.lastEnforcedAt
      ? new Date(response.lastEnforcedAt).getTime()
      : undefined,
    createdAt: new Date(response.createdAt).getTime(),
    updatedAt: new Date(response.updatedAt).getTime(),
  };
}

/**
 * Retention statistics for a data type
 */
export interface RetentionStatistics {
  dataType: DataType;
  totalRecords: number;
  oldestRecord?: number;
  newestRecord?: number;
  estimatedSize: string;
  retentionPolicy?: {
    name: string;
    retentionDays: number;
    cutoffDate: number;
  };
  recordsToDelete?: number;
  estimatedSizeToDelete?: string;
}

/**
 * Retention statistics from backend response (camelCase — NestJS backend)
 */
export interface RetentionStatisticsResponse {
  dataType: DataType;
  totalRecords: number;
  oldestRecord?: string;
  newestRecord?: string;
  estimatedSize: string;
  retentionPolicy?: {
    name: string;
    retentionDays: number;
    cutoffDate: string;
  };
  recordsToDelete?: number;
  estimatedSizeToDelete?: string;
}

/**
 * Transform backend statistics response to frontend type
 */
export function transformRetentionStatistics(
  response: RetentionStatisticsResponse,
): RetentionStatistics {
  return {
    dataType: response.dataType,
    totalRecords: response.totalRecords,
    oldestRecord: response.oldestRecord
      ? new Date(response.oldestRecord).getTime()
      : undefined,
    newestRecord: response.newestRecord
      ? new Date(response.newestRecord).getTime()
      : undefined,
    estimatedSize: response.estimatedSize,
    retentionPolicy: response.retentionPolicy
      ? {
          name: response.retentionPolicy.name,
          retentionDays: response.retentionPolicy.retentionDays,
          cutoffDate: new Date(response.retentionPolicy.cutoffDate).getTime(),
        }
      : undefined,
    recordsToDelete: response.recordsToDelete,
    estimatedSizeToDelete: response.estimatedSizeToDelete,
  };
}

/**
 * Enforcement result
 */
export interface EnforceRetentionResult {
  dataType: DataType;
  recordsDeleted: number;
  spaceReclaimed: string;
  duration: number;
  dryRun: boolean;
  errors?: string[];
}

/**
 * Enforcement result from backend response (camelCase — NestJS backend)
 */
export interface EnforceRetentionResultResponse {
  dataType: DataType;
  recordsDeleted: number;
  spaceReclaimed: string;
  duration: number;
  dryRun: boolean;
  errors?: string[];
}

/**
 * Transform enforcement result response
 */
export function transformEnforceResult(
  response: EnforceRetentionResultResponse,
): EnforceRetentionResult {
  return {
    dataType: response.dataType,
    recordsDeleted: response.recordsDeleted,
    spaceReclaimed: response.spaceReclaimed,
    duration: response.duration,
    dryRun: response.dryRun,
    errors: response.errors,
  };
}

// ==================== REQUEST TYPES ====================

/**
 * Create retention policy request
 */
export interface CreateRetentionPolicyRequest {
  name: string;
  description?: string;
  dataType: DataType;
  retentionDays: number;
  archiveEnabled?: boolean;
  archiveDestination?: string;
  filters?: Record<string, string>;
}

/**
 * Update retention policy request
 */
export interface UpdateRetentionPolicyRequest {
  name?: string;
  description?: string;
  retentionDays?: number;
  archiveEnabled?: boolean;
  archiveDestination?: string;
  filters?: Record<string, string>;
  isActive?: boolean;
}

/**
 * List retention policies query params
 */
export interface ListRetentionPoliciesQuery {
  dataType?: DataType;
  includeDefaults?: boolean;
}

/**
 * Enforce retention request
 */
export interface EnforceRetentionRequest {
  dataType?: DataType;
  dryRun?: boolean;
}

// ==================== UI HELPERS ====================

/**
 * Format retention days to human-readable string
 */
export function formatRetentionDays(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    if (remainingDays === 0) {
      return `${years} year${years > 1 ? "s" : ""}`;
    }
    return `${years} year${years > 1 ? "s" : ""} ${remainingDays} day${remainingDays > 1 ? "s" : ""}`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? "s" : ""} (${days} days)`;
  }
  return `${days} day${days > 1 ? "s" : ""}`;
}

/**
 * Get retention policy status
 */
export type RetentionPolicyStatus = "active" | "inactive" | "default";

export function getRetentionPolicyStatus(
  policy: RetentionPolicy,
): RetentionPolicyStatus {
  if (policy.isDefault) return "default";
  return policy.isActive ? "active" : "inactive";
}

export const RETENTION_POLICY_STATUS: Record<
  RetentionPolicyStatus,
  { label: string; color: string }
> = {
  active: { label: "Active", color: "success" },
  inactive: { label: "Inactive", color: "default" },
  default: { label: "System Default", color: "info" },
};

/**
 * Common retention day presets
 */
export const RETENTION_DAY_PRESETS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
  { label: "180 days", value: 180 },
  { label: "1 year", value: 365 },
  { label: "2 years", value: 730 },
  { label: "3 years", value: 1095 },
  { label: "5 years", value: 1825 },
  { label: "10 years", value: 3650 },
];
