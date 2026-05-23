/**
 * Stat Panel Registry — DATA MASKING (DMS)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const DMS_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ DATA MASKING (DMS) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "DMS20001",
    module: "DMS",
    title: "Total Policies",
    icon: "carbon:policy",
    color: "primary",
    valueColor: "#3b82f6",
    unit: "count",
    size: "small",
    dataSource: "dataMaskingStore.total",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total PII masking policies",
    view: "settings/data-masking/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "DMS20002",
    module: "DMS",
    title: "Active",
    icon: "carbon:checkmark-filled",
    color: "success",
    valueColor: "#22c55e",
    unit: "count",
    size: "small",
    dataSource: "dataMaskingStore.enabledPolicies",
    hasTrend: false,
    hasTimeRange: false,
    description: "Active masking policies",
    view: "settings/data-masking/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "DMS20003",
    module: "DMS",
    title: "Disabled",
    icon: "carbon:warning-alt",
    color: "warning",
    valueColor: "#f59e0b",
    unit: "count",
    size: "small",
    dataSource: "dataMaskingStore.disabledPolicies",
    hasTrend: false,
    hasTimeRange: false,
    description: "Disabled masking policies",
    view: "settings/data-masking/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "DMS20004",
    module: "DMS",
    title: "Active Rules",
    icon: "carbon:filter",
    color: "info",
    valueColor: "#6366f1",
    unit: "count",
    size: "small",
    dataSource: "dataMaskingStore.totalActiveRules",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total active masking rules across all policies",
    view: "settings/data-masking/index.vue",
    position: "stats-row",
  },
];
