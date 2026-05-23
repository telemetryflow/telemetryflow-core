/**
 * Stat Panel Registry — RETENTION (RET)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const RET_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ RETENTION (RET) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "RET20001",
    module: "RET",
    title: "Total Policies",
    icon: "carbon:chart-line",
    color: "primary",
    unit: "count",
    size: "small",
    dataSource: "stats.totalPolicies",
    hasTrend: false,
    hasTimeRange: true,
    description: "Total retention policies",
    view: "settings/retention/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "RET20002",
    module: "RET",
    title: "Active",
    icon: "carbon:checkmark-filled",
    color: "success",
    unit: "count",
    size: "small",
    dataSource: "stats.active",
    hasTrend: false,
    hasTimeRange: true,
    description: "Active retention policies",
    view: "settings/retention/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "RET20003",
    module: "RET",
    title: "Custom Policies",
    icon: "carbon:ai-results",
    color: "info",
    unit: "count",
    size: "small",
    dataSource: "stats.custom",
    hasTrend: false,
    hasTimeRange: true,
    description: "Custom retention policies",
    view: "settings/retention/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "RET20004",
    module: "RET",
    title: "With Archive",
    icon: "carbon:data-volume",
    color: "warning",
    unit: "count",
    size: "small",
    dataSource: "stats.withArchive",
    hasTrend: false,
    hasTimeRange: true,
    description: "Policies with archive enabled",
    view: "settings/retention/index.vue",
    position: "stats-row",
  },
];
