/**
 * StatPanel Helper Utilities
 * Global helpers for StatPanel component configuration, trends, and value colors
 * Integrates with time-range utilities for time picker synchronization
 */

import {
  getTimeRangeFromTimestamps,
  getTimeRangeTitleSuffix,
  getTrendComparisonSuffix,
} from "./time-range";

/**
 * StatPanel color types (matches StatPanel.vue props)
 */
export type StatPanelColor =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "purple";

/**
 * Status color types for status icons
 */
export type StatStatusColor = "success" | "warning" | "error" | "info";

/**
 * Trend direction types
 */
export type TrendDirection = "up" | "down" | "stable";

/**
 * StatPanel color hex values
 * Used for custom styling, charts, and other components
 */
export const STAT_PANEL_COLORS: Record<StatPanelColor, string> = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
};

/**
 * Status icon colors (hex values)
 */
export const STATUS_ICON_COLORS: Record<StatStatusColor, string> = {
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#06b6d4",
};

/**
 * Value color configuration for semantic coloring
 */
export const VALUE_COLORS = {
  // Severity/Level colors
  severity: {
    trace: "#9ca3af",
    debug: "#60a5fa",
    info: "#22c55e",
    warn: "#f59e0b",
    error: "#ef4444",
    fatal: "#dc2626",
  },
  // Status colors
  status: {
    healthy: "#22c55e",
    running: "#22c55e",
    online: "#22c55e",
    active: "#22c55e",
    warning: "#f59e0b",
    pending: "#f59e0b",
    degraded: "#f59e0b",
    critical: "#ef4444",
    error: "#ef4444",
    offline: "#ef4444",
    stopped: "#6b7280",
    unknown: "#9ca3af",
  },
  // Numeric threshold colors (for percentages, usage, etc.)
  threshold: {
    low: "#22c55e", // < 60%
    medium: "#f59e0b", // 60-85%
    high: "#ef4444", // > 85%
  },
} as const;

/**
 * Trend configuration interface
 */
export interface TrendConfig {
  direction: TrendDirection;
  value: string;
  suffix?: string;
}

/**
 * Status icon configuration interface
 */
export interface StatusIconConfig {
  icon: string;
  color: StatStatusColor;
}

/**
 * Full StatPanel configuration interface
 */
export interface StatPanelConfig {
  title: string;
  titleSuffix?: string;
  value: number | string;
  valueColor?: string;
  unit?: string;
  icon?: string;
  iconColor?: string;
  trend?: TrendDirection;
  trendValue?: string;
  trendSuffix?: string;
  statusIcon?: string;
  statusColor?: StatStatusColor;
  color: StatPanelColor;
  size?: "default" | "small";
}

/**
 * Thresholds for value color determination
 */
export interface ValueThresholds {
  warning: number;
  critical: number;
}

/**
 * Default thresholds for common use cases
 */
export const DEFAULT_THRESHOLDS: Record<string, ValueThresholds> = {
  percentage: { warning: 60, critical: 85 },
  cpu: { warning: 70, critical: 90 },
  memory: { warning: 75, critical: 90 },
  disk: { warning: 80, critical: 95 },
  errorRate: { warning: 1, critical: 5 },
};

/**
 * Get value color based on numeric value and thresholds
 * Returns hex color string for styling
 *
 * @param value - Numeric value to evaluate
 * @param thresholds - Warning and critical thresholds
 * @returns Hex color string
 */
export function getValueColor(
  value: number,
  thresholds: ValueThresholds = DEFAULT_THRESHOLDS.percentage,
): string {
  if (value >= thresholds.critical) return VALUE_COLORS.threshold.high;
  if (value >= thresholds.warning) return VALUE_COLORS.threshold.medium;
  return VALUE_COLORS.threshold.low;
}

/**
 * Get value color by status string
 * Maps status strings to appropriate colors
 *
 * @param status - Status string (e.g., 'running', 'error', 'pending')
 * @returns Hex color string
 */
export function getValueColorByStatus(status: string): string {
  const normalizedStatus = status.toLowerCase();
  return (
    VALUE_COLORS.status[normalizedStatus as keyof typeof VALUE_COLORS.status] ||
    VALUE_COLORS.status.unknown
  );
}

/**
 * Get value color by severity level
 * Maps log severity levels to colors
 *
 * @param severity - Severity level (trace, debug, info, warn, error, fatal)
 * @returns Hex color string
 */
export function getValueColorBySeverity(severity: string): string {
  const normalizedSeverity = severity.toLowerCase();
  return (
    VALUE_COLORS.severity[
      normalizedSeverity as keyof typeof VALUE_COLORS.severity
    ] || VALUE_COLORS.severity.info
  );
}

/**
 * Get StatPanel color based on numeric value and thresholds
 * Returns StatPanelColor type for the color prop
 *
 * @param value - Numeric value to evaluate
 * @param thresholds - Warning and critical thresholds
 * @param defaultColor - Color to use when value is below warning threshold
 * @returns StatPanelColor
 */
export function getStatPanelColor(
  value: number,
  thresholds: ValueThresholds = DEFAULT_THRESHOLDS.percentage,
  defaultColor: StatPanelColor = "info",
): StatPanelColor {
  if (value >= thresholds.critical) return "error";
  if (value >= thresholds.warning) return "warning";
  return defaultColor;
}

/**
 * Get StatPanel color from status string
 *
 * @param status - Status string (e.g., 'running', 'error', 'pending')
 * @param defaultColor - Default color if status not recognized
 * @returns StatPanelColor
 */
export function getStatPanelColorByStatus(
  status: string,
  defaultColor: StatPanelColor = "primary",
): StatPanelColor {
  const normalizedStatus = status.toLowerCase();
  const statusMap: Record<string, StatPanelColor> = {
    healthy: "success",
    running: "success",
    online: "success",
    active: "success",
    ready: "success",
    warning: "warning",
    pending: "warning",
    degraded: "warning",
    critical: "error",
    error: "error",
    offline: "error",
    failed: "error",
    stopped: "info",
    unknown: "info",
  };
  return statusMap[normalizedStatus] || defaultColor;
}

/**
 * Build trend configuration from trend value
 *
 * @param trendValue - Trend percentage (positive = up, negative = down)
 * @param suffix - Optional suffix (e.g., "vs 1H")
 * @returns TrendConfig object
 */
export function buildTrendConfig(
  trendValue: number,
  suffix?: string,
): TrendConfig {
  // Normalize -0 to 0
  const normalized = trendValue === 0 ? 0 : trendValue;

  let direction: TrendDirection = "stable";
  if (normalized > 0) direction = "up";
  if (normalized < 0) direction = "down";

  const formattedValue = normalized > 0 ? `+${normalized}%` : `${normalized}%`;

  return {
    direction,
    value: formattedValue,
    suffix,
  };
}

/**
 * Build status icon configuration
 *
 * @param status - Status string or boolean for simple healthy/unhealthy
 * @returns StatusIconConfig object
 */
export function buildStatusIconConfig(
  status: string | boolean,
): StatusIconConfig {
  if (typeof status === "boolean") {
    return {
      icon: status ? "carbon:checkmark-filled" : "carbon:close-filled",
      color: status ? "success" : "error",
    };
  }

  const normalizedStatus = status.toLowerCase();
  const iconMap: Record<string, StatusIconConfig> = {
    healthy: { icon: "carbon:checkmark-filled", color: "success" },
    running: { icon: "carbon:checkmark-filled", color: "success" },
    online: { icon: "carbon:checkmark-filled", color: "success" },
    active: { icon: "carbon:checkmark-filled", color: "success" },
    ready: { icon: "carbon:checkmark-filled", color: "success" },
    warning: { icon: "carbon:warning-filled", color: "warning" },
    pending: { icon: "carbon:time", color: "warning" },
    degraded: { icon: "carbon:warning-alt-filled", color: "warning" },
    critical: { icon: "carbon:close-filled", color: "error" },
    error: { icon: "carbon:close-filled", color: "error" },
    offline: { icon: "carbon:close-filled", color: "error" },
    failed: { icon: "carbon:close-filled", color: "error" },
    stopped: { icon: "carbon:pause-filled", color: "info" },
    unknown: { icon: "carbon:help-filled", color: "info" },
  };

  return (
    iconMap[normalizedStatus] || { icon: "carbon:help-filled", color: "info" }
  );
}

/**
 * Create a complete StatPanel configuration
 * Factory function to build StatPanelConfig with sensible defaults
 *
 * @param options - Partial StatPanelConfig with required fields
 * @returns Complete StatPanelConfig
 */
export function createStatPanelConfig(
  options: Pick<StatPanelConfig, "title" | "value"> & Partial<StatPanelConfig>,
): StatPanelConfig {
  return {
    color: "primary",
    size: "default",
    ...options,
  };
}

/**
 * Create StatPanel config with trend
 * Convenience function for stat panels with trend display
 *
 * @param options - Base options
 * @param trendValue - Trend percentage
 * @param trendSuffix - Optional trend suffix
 * @returns StatPanelConfig with trend
 */
export function createStatPanelWithTrend(
  options: Pick<StatPanelConfig, "title" | "value" | "icon"> &
    Partial<StatPanelConfig>,
  trendValue: number,
  trendSuffix?: string,
): StatPanelConfig {
  // Don't show trend indicator when value is 0 (avoids displaying "0%" or "-0%")
  if (trendValue === 0) {
    return createStatPanelConfig(options);
  }
  const trendConfig = buildTrendConfig(trendValue, trendSuffix);
  return createStatPanelConfig({
    ...options,
    trend: trendConfig.direction,
    trendValue: trendConfig.value,
    trendSuffix: trendConfig.suffix,
  });
}

/**
 * Create StatPanel config with status icon
 * Convenience function for stat panels with status icon display
 *
 * @param options - Base options
 * @param status - Status string or boolean
 * @returns StatPanelConfig with status icon
 */
export function createStatPanelWithStatus(
  options: Pick<StatPanelConfig, "title" | "value" | "icon"> &
    Partial<StatPanelConfig>,
  status: string | boolean,
): StatPanelConfig {
  const statusConfig = buildStatusIconConfig(status);
  return createStatPanelConfig({
    ...options,
    statusIcon: statusConfig.icon,
    statusColor: statusConfig.color,
    color: getStatPanelColorByStatus(
      typeof status === "boolean" ? (status ? "healthy" : "error") : status,
    ),
  });
}

/**
 * Create StatPanel config for percentage values
 * Automatically sets color based on thresholds
 *
 * @param options - Base options (value should be percentage 0-100)
 * @param thresholds - Custom thresholds
 * @returns StatPanelConfig with threshold-based color
 */
export function createStatPanelForPercentage(
  options: Pick<StatPanelConfig, "title" | "value" | "icon"> &
    Partial<StatPanelConfig>,
  thresholds: ValueThresholds = DEFAULT_THRESHOLDS.percentage,
): StatPanelConfig {
  const numValue =
    typeof options.value === "number"
      ? options.value
      : parseFloat(String(options.value)) || 0;
  return createStatPanelConfig({
    ...options,
    unit: options.unit ?? "%",
    color: getStatPanelColor(numValue, thresholds),
    valueColor: getValueColor(numValue, thresholds),
  });
}

/**
 * Common stat panel icons
 * Centralized icon constants for consistency
 */
export const STAT_PANEL_ICONS = {
  // Infrastructure
  cpu: "carbon:chip",
  memory: "ph:memory-fill",
  disk: "carbon:data-volume",
  storage: "carbon:data-volume",
  network: "carbon:network-3",
  vm: "carbon:virtual-machine",
  server: "carbon:server-dns",
  container: "carbon:container-software",

  // Kubernetes
  kubernetes: "simple-icons:kubernetes",
  node: "carbon:kubernetes-worker-node",
  pod: "carbon:kubernetes-pod",
  deployment: "carbon:deploy",
  service: "carbon:service-id",
  namespace: "carbon:ibm-cloud-pak--business-automation",
  cluster: "carbon:network-4",

  // Telemetry
  log: "carbon:document",
  logs: "carbon:list-numbered",
  trace: "carbon:flow",
  metric: "carbon:chart-line",
  alert: "carbon:notification",
  error: "carbon:warning-alt",

  // Agents
  agent: "carbon:ai-results",
  bot: "carbon:bot",
  online: "carbon:checkmark-filled",
  offline: "carbon:close-filled",

  // Status
  healthy: "carbon:checkmark-filled",
  warning: "carbon:warning-filled",
  critical: "carbon:close-filled",
  info: "carbon:information-filled",
  pending: "carbon:time",
  unknown: "carbon:help-filled",

  // Charts & Metrics
  chart: "carbon:chart-line",
  chartAverage: "carbon:chart-average",

  // General
  count: "carbon:hashtag",
  percentage: "carbon:percentage",
  duration: "carbon:time",
  request: "carbon:arrow-right",
  response: "carbon:arrow-left",
  throughput: "carbon:activity",
} as const;

/**
 * Get hex color value for StatPanelColor
 *
 * @param color - StatPanelColor type
 * @returns Hex color string
 */
export function getStatPanelHexColor(color: StatPanelColor): string {
  return STAT_PANEL_COLORS[color];
}

/**
 * Get contrasting text color for a StatPanelColor
 * Always returns white for better readability on colored backgrounds
 *
 * @param _color - StatPanelColor type (unused, always returns white)
 * @returns White hex color for text
 */
export function getStatPanelTextColor(_color: StatPanelColor): string {
  return "#ffffff";
}

/**
 * Get light background color for a StatPanelColor (for badges, tags)
 *
 * @param color - StatPanelColor type
 * @returns Hex color string with reduced opacity (CSS rgba equivalent)
 */
export function getStatPanelBgColor(color: StatPanelColor): string {
  const bgColors: Record<StatPanelColor, string> = {
    primary: "rgba(59, 130, 246, 0.1)",
    success: "rgba(34, 197, 94, 0.1)",
    warning: "rgba(245, 158, 11, 0.1)",
    error: "rgba(239, 68, 68, 0.1)",
    info: "rgba(6, 182, 212, 0.1)",
    purple: "rgba(139, 92, 246, 0.1)",
  };
  return bgColors[color];
}

// ============================================================================
// Time Range Integrated Functions
// These functions accept start/end timestamps to sync with header time picker
// ============================================================================

/**
 * Time range parameters for stat panel functions
 */
export interface TimeRangeParams {
  start: number;
  end: number;
}

/**
 * Create StatPanel config with time range suffix
 * Automatically adds titleSuffix based on time range (e.g., "(1h)")
 *
 * @param options - Base options
 * @param timeRange - Time range with start and end timestamps
 * @returns StatPanelConfig with titleSuffix
 */
export function createStatPanelWithTimeRange(
  options: Pick<StatPanelConfig, "title" | "value" | "icon"> &
    Partial<StatPanelConfig>,
  timeRange: TimeRangeParams,
): StatPanelConfig {
  const titleSuffix = getTimeRangeTitleSuffix(timeRange.start, timeRange.end);
  return createStatPanelConfig({
    ...options,
    titleSuffix,
  });
}

/**
 * Create StatPanel config with trend and time range
 * Includes both trend display and time range suffix
 *
 * @param options - Base options
 * @param trendValue - Trend percentage
 * @param timeRange - Time range with start and end timestamps
 * @param includeTrendSuffix - Whether to include "vs Xh ago" suffix (default: true)
 * @returns StatPanelConfig with trend and time range
 */
export function createStatPanelWithTrendAndTimeRange(
  options: Pick<StatPanelConfig, "title" | "value" | "icon"> &
    Partial<StatPanelConfig>,
  trendValue: number,
  timeRange: TimeRangeParams,
  includeTrendSuffix = true,
): StatPanelConfig {
  const titleSuffix = getTimeRangeTitleSuffix(timeRange.start, timeRange.end);

  // Don't show trend indicator when value is 0 (avoids displaying "0%" or "-0%")
  if (trendValue === 0) {
    return createStatPanelConfig({
      ...options,
      titleSuffix,
    });
  }

  const trendSuffix = includeTrendSuffix
    ? getTrendComparisonSuffix(timeRange.start, timeRange.end)
    : undefined;
  const trendConfig = buildTrendConfig(trendValue, trendSuffix);

  return createStatPanelConfig({
    ...options,
    titleSuffix,
    trend: trendConfig.direction,
    trendValue: trendConfig.value,
    trendSuffix: trendConfig.suffix,
  });
}

/**
 * Create StatPanel config with status and time range
 * Includes status icon and time range suffix
 *
 * @param options - Base options
 * @param status - Status string or boolean
 * @param timeRange - Time range with start and end timestamps
 * @returns StatPanelConfig with status and time range
 */
export function createStatPanelWithStatusAndTimeRange(
  options: Pick<StatPanelConfig, "title" | "value" | "icon"> &
    Partial<StatPanelConfig>,
  status: string | boolean,
  timeRange: TimeRangeParams,
): StatPanelConfig {
  const titleSuffix = getTimeRangeTitleSuffix(timeRange.start, timeRange.end);
  const statusConfig = buildStatusIconConfig(status);

  return createStatPanelConfig({
    ...options,
    titleSuffix,
    statusIcon: statusConfig.icon,
    statusColor: statusConfig.color,
    color: getStatPanelColorByStatus(
      typeof status === "boolean" ? (status ? "healthy" : "error") : status,
    ),
  });
}

/**
 * Create StatPanel config for percentage with time range
 * Includes threshold-based color and time range suffix
 *
 * @param options - Base options (value should be percentage 0-100)
 * @param timeRange - Time range with start and end timestamps
 * @param thresholds - Custom thresholds
 * @returns StatPanelConfig with percentage styling and time range
 */
export function createStatPanelForPercentageWithTimeRange(
  options: Pick<StatPanelConfig, "title" | "value" | "icon"> &
    Partial<StatPanelConfig>,
  timeRange: TimeRangeParams,
  thresholds: ValueThresholds = DEFAULT_THRESHOLDS.percentage,
): StatPanelConfig {
  const titleSuffix = getTimeRangeTitleSuffix(timeRange.start, timeRange.end);
  const numValue =
    typeof options.value === "number"
      ? options.value
      : parseFloat(String(options.value)) || 0;

  return createStatPanelConfig({
    ...options,
    titleSuffix,
    unit: options.unit ?? "%",
    color: getStatPanelColor(numValue, thresholds),
    valueColor: getValueColor(numValue, thresholds),
  });
}

/**
 * Get time range info for display
 * Returns label and suffix based on time range
 *
 * @param timeRange - Time range with start and end timestamps
 * @returns Object with label and suffix
 */
export function getTimeRangeDisplayInfo(timeRange: TimeRangeParams): {
  label: string;
  shortLabel: string;
  titleSuffix: string;
  trendSuffix: string;
} {
  const rangeInfo = getTimeRangeFromTimestamps(timeRange.start, timeRange.end);
  return {
    label: rangeInfo.label,
    shortLabel: rangeInfo.shortLabel,
    titleSuffix: `(${rangeInfo.shortLabel})`,
    trendSuffix: `vs ${rangeInfo.shortLabel} ago`,
  };
}
