/**
 * Status helper utilities for health indicators, resource usage, etc.
 */

export interface StatusBadge {
  color: string;
  status: string;
  icon: string;
}

export interface StatusThresholds {
  good: number;
  warning: number;
}

/**
 * Default thresholds for different status types
 */
export const STATUS_THRESHOLDS = {
  /** Health percentage: >= 95% good, >= 80% warning, else critical */
  health: { good: 95, warning: 80 },
  /** Resource usage: < 60% good, < 85% warning, else critical */
  resourceUsage: { good: 60, warning: 85 },
  /** Generic percentage: < 75% good, < 90% warning, else critical */
  generic: { good: 75, warning: 90 },
} as const;

/**
 * Status colors (consistent across the app)
 */
export const STATUS_COLORS = {
  success: "#22c55e",
  warning: "#eab308",
  error: "#ef4444",
  info: "#3b82f6",
  neutral: "#6b7280",
} as const;

/**
 * Status icons (Carbon icons)
 */
export const STATUS_ICONS = {
  success: "carbon:checkmark-filled",
  warning: "carbon:warning-filled",
  error: "carbon:close-filled",
  info: "carbon:information-filled",
  neutral: "carbon:subtract",
} as const;

/**
 * Get health status badge based on percentage
 * Higher percentage = healthier (e.g., uptime, success rate)
 *
 * @param percentage - Health percentage (0-100)
 * @param thresholds - Custom thresholds (default: 95/80)
 * @returns StatusBadge with color, status text, and icon
 */
export function getHealthStatus(
  percentage: number,
  thresholds: StatusThresholds = STATUS_THRESHOLDS.health,
): StatusBadge {
  if (percentage >= thresholds.good) {
    return {
      color: STATUS_COLORS.success,
      status: "Healthy",
      icon: STATUS_ICONS.success,
    };
  }
  if (percentage >= thresholds.warning) {
    return {
      color: STATUS_COLORS.warning,
      status: "Warning",
      icon: STATUS_ICONS.warning,
    };
  }
  return {
    color: STATUS_COLORS.error,
    status: "Critical",
    icon: STATUS_ICONS.error,
  };
}

/**
 * Get usage status badge based on percentage
 * Lower percentage = better (e.g., CPU/Memory/Disk usage)
 *
 * @param percentage - Usage percentage (0-100)
 * @param thresholds - Custom thresholds (default: 60/85)
 * @returns StatusBadge with color, status text, and icon
 */
export function getUsageStatus(
  percentage: number,
  thresholds: StatusThresholds = STATUS_THRESHOLDS.resourceUsage,
): StatusBadge {
  if (percentage < thresholds.good) {
    return {
      color: STATUS_COLORS.success,
      status: "Healthy",
      icon: STATUS_ICONS.success,
    };
  }
  if (percentage < thresholds.warning) {
    return {
      color: STATUS_COLORS.warning,
      status: "Warning",
      icon: STATUS_ICONS.warning,
    };
  }
  return {
    color: STATUS_COLORS.error,
    status: "Critical",
    icon: STATUS_ICONS.error,
  };
}

/**
 * Get status color based on percentage threshold
 * Used for progress bars, gauges, etc.
 *
 * @param percentage - Percentage value (0-100)
 * @param invert - If true, lower is better (default: false = higher is worse)
 * @param thresholds - Custom thresholds
 * @returns Hex color string
 */
export function getStatusColor(
  percentage: number,
  invert: boolean = false,
  thresholds: StatusThresholds = STATUS_THRESHOLDS.generic,
): string {
  if (invert) {
    // Lower is better (e.g., health percentage)
    if (percentage >= thresholds.good) return STATUS_COLORS.success;
    if (percentage >= thresholds.warning) return STATUS_COLORS.warning;
    return STATUS_COLORS.error;
  }
  // Higher is worse (e.g., usage percentage) - default behavior
  if (percentage >= thresholds.warning) return STATUS_COLORS.error;
  if (percentage >= thresholds.good) return STATUS_COLORS.warning;
  return STATUS_COLORS.success;
}

/**
 * Get resource status type for Naive UI components
 * Used for n-tag type prop, n-progress status, etc.
 *
 * @param usage - Usage percentage (0-100)
 * @param thresholds - Custom thresholds (default: 60/80)
 * @returns Naive UI status type: 'success' | 'warning' | 'error'
 */
export function getResourceStatus(
  usage: number,
  thresholds: { warning: number; critical: number } = {
    warning: 60,
    critical: 80,
  },
): "success" | "warning" | "error" {
  if (usage > thresholds.critical) return "error";
  if (usage > thresholds.warning) return "warning";
  return "success";
}

/**
 * Get CPU usage status
 * Alias for getResourceStatus with CPU-specific naming
 */
export function getCpuStatus(usage: number): "success" | "warning" | "error" {
  return getResourceStatus(usage, { warning: 60, critical: 80 });
}

/**
 * Get Memory usage status
 * Alias for getResourceStatus with Memory-specific naming
 */
export function getMemoryStatus(
  usage: number,
): "success" | "warning" | "error" {
  return getResourceStatus(usage, { warning: 60, critical: 80 });
}

/**
 * Get Storage usage status
 * Alias for getResourceStatus with Storage-specific naming
 */
export function getStorageStatus(
  usage: number,
): "success" | "warning" | "error" {
  return getResourceStatus(usage, { warning: 60, critical: 80 });
}

/**
 * Get network status
 * Alias for getResourceStatus with Network-specific naming
 */
export function getNetworkStatus(
  usage: number,
): "success" | "warning" | "error" {
  return getResourceStatus(usage, { warning: 60, critical: 80 });
}
