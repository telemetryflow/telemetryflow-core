/**
 * Stat Panel Registry — API KEYS (APK)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const APK_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ API KEYS (APK) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "APK20001",
    module: "APK",
    title: "Total Keys",
    icon: "carbon:password",
    color: "primary",
    valueColor: "#3b82f6",
    unit: "count",
    size: "small",
    dataSource: "apiKeysStore.totalKeys",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total API keys",
    view: "settings/api-keys/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "APK20002",
    module: "APK",
    title: "Active Keys",
    icon: "carbon:checkmark-filled",
    color: "success",
    valueColor: "#22c55e",
    unit: "count",
    size: "small",
    dataSource: "apiKeysStore.activeKeys",
    hasTrend: false,
    hasTimeRange: false,
    description: "Active API keys",
    view: "settings/api-keys/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "APK20003",
    module: "APK",
    title: "Expired Keys",
    icon: "carbon:time",
    color: "warning",
    valueColor: "#f59e0b",
    unit: "count",
    size: "small",
    dataSource: "apiKeysStore.expiredKeys",
    hasTrend: false,
    hasTimeRange: false,
    description: "Expired API keys",
    view: "settings/api-keys/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "APK20004",
    module: "APK",
    title: "Revoked Keys",
    icon: "carbon:close-filled",
    color: "error",
    valueColor: "#ef4444",
    unit: "count",
    size: "small",
    dataSource: "apiKeysStore.revokedKeys",
    hasTrend: false,
    hasTimeRange: false,
    description: "Revoked API keys",
    view: "settings/api-keys/index.vue",
    position: "stats-row",
  },
];
