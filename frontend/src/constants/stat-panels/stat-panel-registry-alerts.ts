/**
 * Stat Panel Registry — ALERTS (ALR)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const ALR_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ ALERTS (ALR) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "ALR20001",
    module: "ALR",
    title: "Critical",
    icon: "carbon:close-filled",
    color: "error",
    valueColor: "#ef4444",
    unit: "count",
    size: "small",
    dataSource: "alertsStore critical count",
    hasTrend: false,
    hasTimeRange: false,
    description: "Critical severity firing alerts",
    view: "alerts/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "ALR20002",
    module: "ALR",
    title: "Warning",
    icon: "carbon:warning-filled",
    color: "warning",
    valueColor: "#f59e0b",
    unit: "count",
    size: "small",
    dataSource: "alertsStore warning count",
    hasTrend: false,
    hasTimeRange: false,
    description: "Warning severity firing alerts",
    view: "alerts/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "ALR20003",
    module: "ALR",
    title: "Info",
    icon: "carbon:information-filled",
    color: "primary",
    valueColor: "#3b82f6",
    unit: "count",
    size: "small",
    dataSource: "alertsStore info count",
    hasTrend: false,
    hasTimeRange: false,
    description: "Info severity firing alerts",
    view: "alerts/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "ALR20004",
    module: "ALR",
    title: "Resolved",
    icon: "carbon:checkmark-filled",
    color: "success",
    valueColor: "#22c55e",
    unit: "count",
    size: "small",
    dataSource: "alertsStore resolved count",
    hasTrend: false,
    hasTimeRange: false,
    description: "Resolved alerts",
    view: "alerts/index.vue",
    position: "stats-row",
  },
];
