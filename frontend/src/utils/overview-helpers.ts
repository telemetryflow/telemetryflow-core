/**
 * Overview Panel Utilities
 *
 * Helper functions for creating overview panel component configurations.
 * These utilities help standardize the creation of:
 * - StatCard: Cards with icon, value, and label
 * - DetailBox: Small boxes showing label, value, and percent/unit
 * - QuotaItem: Quota usage items (used/hard limit)
 * - CapacityItem: Capacity details (used/total with unit)
 * - HealthCard: Health percentage display with status
 * - ResourceCard: Resource usage card with progress bar
 */

import { getUsageStatus, getHealthStatus } from "./status";

// ============================================
// Types (OVERVIEW_ prefix for clarity)
// ============================================

/**
 * Color variants for overview stat cards
 */
export type OverviewStatCardColor =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "purple"
  | "cyan"
  | "gray";

/**
 * Icon type variants for overview stat cards (defines background/color styling)
 */
export type OverviewStatCardIconType =
  | "total"
  | "ready"
  | "not-ready"
  | "master"
  | "worker"
  | "running"
  | "pending"
  | "succeeded"
  | "failed"
  | "unknown"
  | "active"
  | "terminating"
  | "namespaces"
  | "cpu"
  | "ram"
  | "storage"
  | "network";

/**
 * Configuration for an overview stat card
 */
export interface OverviewStatCardConfig {
  icon: string;
  iconType: OverviewStatCardIconType;
  value: number | string;
  label: string;
}

/**
 * Configuration for an overview detail box
 */
export interface OverviewDetailBoxConfig {
  label: string;
  value: number | string;
  percent?: number;
  unit?: string;
  highlight?: boolean;
}

/**
 * Configuration for an overview quota/capacity item
 */
export interface OverviewQuotaItemConfig {
  label: string;
  value: number | string;
  unit?: string;
}

/**
 * Configuration for an overview health card
 */
export interface OverviewHealthCardConfig {
  icon: string;
  title: string;
  percentage: number;
  status?: {
    icon: string;
    text: string;
    color: string;
  };
}

/**
 * Configuration for an overview resource usage card
 */
export interface OverviewResourceCardConfig {
  icon: string;
  iconType: "cpu" | "ram" | "storage" | "network";
  label: string;
  percentage: number;
  status?: {
    icon: string;
    text: string;
    color: string;
  };
  details: OverviewDetailBoxConfig[] | OverviewQuotaItemConfig[];
}

// ============================================
// Icon Type Colors
// ============================================

/**
 * Color mapping for overview stat card icon types
 */
export const OVERVIEW_STAT_CARD_COLORS: Record<
  OverviewStatCardIconType,
  { bg: string; color: string }
> = {
  // General
  total: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },
  namespaces: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },

  // Node status
  ready: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
  "not-ready": { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
  master: { bg: "rgba(234, 179, 8, 0.15)", color: "#eab308" },
  worker: { bg: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" },

  // Pod status
  running: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
  pending: { bg: "rgba(234, 179, 8, 0.15)", color: "#eab308" },
  succeeded: { bg: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" },
  failed: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
  unknown: { bg: "rgba(107, 114, 128, 0.15)", color: "#6b7280" },

  // Namespace status
  active: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
  terminating: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },

  // Resource types
  cpu: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },
  ram: { bg: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" },
  storage: { bg: "rgba(234, 179, 8, 0.15)", color: "#eab308" },
  network: { bg: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" },
};

/**
 * Icons for overview panel components
 */
export const OVERVIEW_PANEL_ICONS = {
  // Nodes
  node: "carbon:server-proxy",
  controlPlane: "carbon:star-filled",
  worker: "carbon:server-dns",

  // Pods
  pod: "carbon:cube",
  container: "carbon:container-software",
  play: "carbon:play-filled",

  // Status
  checkmark: "carbon:checkmark-outline",
  checkmarkFilled: "carbon:checkmark-filled",
  warning: "carbon:warning-alt",
  close: "carbon:close-outline",
  closeFilled: "carbon:close-filled",
  time: "carbon:time",
  help: "carbon:help",

  // Resources
  cpu: "carbon:chip",
  memory: "ph:memory-fill",
  storage: "carbon:data-volume",
  network: "carbon:network-3",
  box: "carbon:box",

  // Kubernetes
  kubernetes: "simple-icons:kubernetes",
  namespace: "carbon:catalog",
  deployment: "carbon:deploy",
  service: "carbon:service-id",
} as const;

// ============================================
// Factory Functions (OVERVIEW_ prefix for clarity)
// ============================================

/**
 * Create a stat card configuration for overview panels
 */
export function createOverviewStatCard(
  icon: string,
  iconType: OverviewStatCardIconType,
  value: number | string,
  label: string,
): OverviewStatCardConfig {
  return { icon, iconType, value, label };
}

/**
 * Create node stat cards for Kubernetes overview
 */
export function createOverviewNodeStatCards(stats: {
  total: number;
  ready: number;
  notReady: number;
  masters: number;
  workers: number;
}): OverviewStatCardConfig[] {
  return [
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.node,
      "total",
      stats.total,
      "Total Nodes",
    ),
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.checkmark,
      "ready",
      stats.ready,
      "Ready",
    ),
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.warning,
      "not-ready",
      stats.notReady,
      "Not Ready",
    ),
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.controlPlane,
      "master",
      stats.masters,
      "Control Plane",
    ),
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.worker,
      "worker",
      stats.workers,
      "Workers",
    ),
  ];
}

/**
 * Create pod stat cards for Kubernetes overview
 */
export function createOverviewPodStatCards(stats: {
  total: number;
  running: number;
  pending: number;
  succeeded: number;
  failed: number;
  unknown: number;
}): OverviewStatCardConfig[] {
  return [
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.pod,
      "total",
      stats.total,
      "Total Pods",
    ),
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.play,
      "running",
      stats.running,
      "Running",
    ),
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.time,
      "pending",
      stats.pending,
      "Pending",
    ),
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.checkmarkFilled,
      "succeeded",
      stats.succeeded,
      "Succeeded",
    ),
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.closeFilled,
      "failed",
      stats.failed,
      "Failed",
    ),
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.help,
      "unknown",
      stats.unknown,
      "Unknown",
    ),
  ];
}

/**
 * Create namespace stat cards for Kubernetes overview
 */
export function createOverviewNamespaceStatCards(stats: {
  total: number;
  active: number;
  terminating: number;
}): OverviewStatCardConfig[] {
  return [
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.box,
      "namespaces",
      stats.total,
      "Total Namespaces",
    ),
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.checkmark,
      "active",
      stats.active,
      "Active",
    ),
    createOverviewStatCard(
      OVERVIEW_PANEL_ICONS.close,
      "terminating",
      stats.terminating,
      "Terminating",
    ),
  ];
}

/**
 * Create a detail box configuration for overview panels
 */
export function createOverviewDetailBox(
  label: string,
  value: number | string,
  options?: { percent?: number; unit?: string; highlight?: boolean },
): OverviewDetailBoxConfig {
  return {
    label,
    value,
    percent: options?.percent,
    unit: options?.unit,
    highlight: options?.highlight ?? false,
  };
}

/**
 * Create detail boxes for resource usage (Real, Requests, Limits, Total pattern)
 */
export function createOverviewResourceDetailBoxes(usage: {
  real: number;
  requests: number;
  limits: number;
  total: number;
  realPercent: number;
  requestsPercent: number;
  limitsPercent: number;
  unit: string;
}): OverviewDetailBoxConfig[] {
  return [
    createOverviewDetailBox("Real", formatOverviewValue(usage.real), {
      percent: usage.realPercent,
    }),
    createOverviewDetailBox("Requests", formatOverviewValue(usage.requests), {
      percent: usage.requestsPercent,
    }),
    createOverviewDetailBox("Limits", formatOverviewValue(usage.limits), {
      percent: usage.limitsPercent,
    }),
    createOverviewDetailBox("Total", formatOverviewValue(usage.total), {
      unit: usage.unit,
      highlight: true,
    }),
  ];
}

/**
 * Create a quota item configuration for overview panels
 */
export function createOverviewQuotaItem(
  label: string,
  value: number | string,
  unit?: string,
): OverviewQuotaItemConfig {
  return { label, value, unit };
}

/**
 * Create quota items for resource quota (Used/Hard Limit pattern)
 */
export function createOverviewQuotaItems(quota: {
  used: number;
  hard: number;
  unit: string;
}): OverviewQuotaItemConfig[] {
  return [
    createOverviewQuotaItem("Used", `${quota.used} ${quota.unit}`),
    createOverviewQuotaItem("Hard Limit", `${quota.hard} ${quota.unit}`),
  ];
}

/**
 * Create capacity items for resource capacity (Used/Total pattern)
 */
export function createOverviewCapacityItems(capacity: {
  used: number;
  total: number;
  unit: string;
}): OverviewQuotaItemConfig[] {
  return [
    createOverviewQuotaItem("Used", `${capacity.used} ${capacity.unit}`),
    createOverviewQuotaItem("Total", `${capacity.total} ${capacity.unit}`),
  ];
}

/**
 * Create a health card configuration for overview panels
 */
export function createOverviewHealthCard(
  icon: string,
  title: string,
  percentage: number,
  options?: { thresholds?: { good: number; warning: number } },
): OverviewHealthCardConfig {
  const status = getHealthStatus(percentage, options?.thresholds);
  return {
    icon,
    title,
    percentage,
    status: {
      icon: status.icon,
      text: status.status,
      color: status.color,
    },
  };
}

/**
 * Create a pod health card for Kubernetes overview
 */
export function createOverviewPodHealthCard(stats: {
  total: number;
  running: number;
  succeeded: number;
}): OverviewHealthCardConfig {
  const healthPercentage =
    stats.total === 0
      ? 100
      : ((stats.running + stats.succeeded) / stats.total) * 100;
  return createOverviewHealthCard(
    OVERVIEW_PANEL_ICONS.container,
    "Pod Health",
    healthPercentage,
  );
}

/**
 * Create a resource card configuration for overview panels
 */
export function createOverviewResourceCard(
  icon: string,
  iconType: "cpu" | "ram" | "storage" | "network",
  label: string,
  percentage: number,
  details: OverviewDetailBoxConfig[] | OverviewQuotaItemConfig[],
  options?: { thresholds?: { good: number; warning: number } },
): OverviewResourceCardConfig {
  const status = getUsageStatus(percentage, options?.thresholds);
  return {
    icon,
    iconType,
    label,
    percentage,
    status: {
      icon: status.icon,
      text: status.status,
      color: status.color,
    },
    details,
  };
}

/**
 * Create CPU resource card with usage breakdown
 */
export function createOverviewCpuResourceCard(
  usage: {
    real: number;
    requests: number;
    limits: number;
    total: number;
    realPercent: number;
    requestsPercent: number;
    limitsPercent: number;
  },
  options?: { thresholds?: { good: number; warning: number } },
): OverviewResourceCardConfig {
  const detailBoxes = createOverviewResourceDetailBoxes({
    ...usage,
    unit: "cores",
  });
  return createOverviewResourceCard(
    OVERVIEW_PANEL_ICONS.cpu,
    "cpu",
    "CPU Usage",
    usage.realPercent,
    detailBoxes,
    options,
  );
}

/**
 * Create Memory resource card with usage breakdown
 */
export function createOverviewMemoryResourceCard(
  usage: {
    real: number;
    requests: number;
    limits: number;
    total: number;
    realPercent: number;
    requestsPercent: number;
    limitsPercent: number;
  },
  options?: { thresholds?: { good: number; warning: number } },
): OverviewResourceCardConfig {
  const detailBoxes = createOverviewResourceDetailBoxes({
    ...usage,
    unit: "GiB",
  });
  return createOverviewResourceCard(
    OVERVIEW_PANEL_ICONS.memory,
    "ram",
    "Memory Usage",
    usage.realPercent,
    detailBoxes,
    options,
  );
}

/**
 * Create CPU quota card
 */
export function createOverviewCpuQuotaCard(
  quota: { used: number; hard: number; percentage: number },
  options?: { thresholds?: { good: number; warning: number } },
): OverviewResourceCardConfig {
  const quotaItems = createOverviewQuotaItems({ ...quota, unit: "cores" });
  return createOverviewResourceCard(
    OVERVIEW_PANEL_ICONS.cpu,
    "cpu",
    "CPU Quota",
    quota.percentage,
    quotaItems,
    options,
  );
}

/**
 * Create Memory quota card
 */
export function createOverviewMemoryQuotaCard(
  quota: { used: number; hard: number; percentage: number },
  options?: { thresholds?: { good: number; warning: number } },
): OverviewResourceCardConfig {
  const quotaItems = createOverviewQuotaItems({ ...quota, unit: "GiB" });
  return createOverviewResourceCard(
    OVERVIEW_PANEL_ICONS.memory,
    "ram",
    "Memory Quota",
    quota.percentage,
    quotaItems,
    options,
  );
}

/**
 * Create CPU capacity card
 */
export function createOverviewCpuCapacityCard(
  capacity: { used: number; total: number; percentage: number },
  options?: { thresholds?: { good: number; warning: number } },
): OverviewResourceCardConfig {
  const capacityItems = createOverviewCapacityItems({
    ...capacity,
    unit: "cores",
  });
  return createOverviewResourceCard(
    OVERVIEW_PANEL_ICONS.cpu,
    "cpu",
    "CPU Capacity",
    capacity.percentage,
    capacityItems,
    options,
  );
}

/**
 * Create Memory capacity card
 */
export function createOverviewMemoryCapacityCard(
  capacity: { used: number; total: number; percentage: number },
  options?: { thresholds?: { good: number; warning: number } },
): OverviewResourceCardConfig {
  const capacityItems = createOverviewCapacityItems({
    ...capacity,
    unit: "GiB",
  });
  return createOverviewResourceCard(
    OVERVIEW_PANEL_ICONS.memory,
    "ram",
    "Memory Capacity",
    capacity.percentage,
    capacityItems,
    options,
  );
}

// ============================================
// Utility Functions (OVERVIEW_ prefix for clarity)
// ============================================

/**
 * Format number value with max 2 decimal places
 */
export function formatOverviewValue(value: number): string {
  return Number(value.toFixed(2)).toString();
}

/**
 * Format percentage with exactly 2 decimal places
 */
export function formatOverviewPercent(value: number): string {
  return value.toFixed(2);
}

/**
 * Format percentage with 1 decimal place
 */
export function formatOverviewPercentShort(value: number): string {
  return value.toFixed(1);
}

/**
 * Get icon style for overview stat card
 */
export function getOverviewStatCardIconStyle(
  iconType: OverviewStatCardIconType,
): { background: string; color: string } {
  const colors =
    OVERVIEW_STAT_CARD_COLORS[iconType] || OVERVIEW_STAT_CARD_COLORS.total;
  return {
    background: colors.bg,
    color: colors.color,
  };
}

/**
 * Get health card icon style based on percentage
 */
export function getOverviewHealthIconStyle(color: string): {
  background: string;
  color: string;
} {
  return {
    background: `${color}20`,
    color,
  };
}

/**
 * Calculate health percentage from running/total stats
 */
export function calculateOverviewHealthPercentage(
  running: number,
  succeeded: number,
  total: number,
): number {
  if (total === 0) return 100;
  return ((running + succeeded) / total) * 100;
}

/**
 * Calculate usage percentage
 */
export function calculateOverviewUsagePercentage(
  used: number,
  total: number,
): number {
  if (total === 0) return 0;
  return (used / total) * 100;
}
