/**
 * Stat Panel Registry — REPORTS (RPT)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const RPT_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ REPORTS (RPT) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "RPT20001",
    module: "RPT",
    title: "Total Reports",
    icon: "carbon:report",
    color: "primary",
    valueColor: "#3b82f6",
    unit: "count",
    size: "small",
    dataSource: "reportsStore.stats.totalDefinitions",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total report definitions",
    view: "reports/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "RPT20002",
    module: "RPT",
    title: "Active Schedules",
    icon: "carbon:time",
    color: "success",
    valueColor: "#22c55e",
    unit: "count",
    size: "small",
    dataSource: "reportsStore.stats.activeSchedules",
    hasTrend: false,
    hasTimeRange: false,
    description: "Active report schedules",
    view: "reports/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "RPT20003",
    module: "RPT",
    title: "Last 24h Executions",
    icon: "carbon:play",
    color: "info",
    valueColor: "#06b6d4",
    unit: "count",
    size: "small",
    dataSource: "reportsStore.stats.last24hExecutions",
    hasTrend: false,
    hasTimeRange: false,
    description: "Report executions in last 24 hours",
    view: "reports/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "RPT20004",
    module: "RPT",
    title: "Failed Rate",
    icon: "carbon:warning-alt",
    color: "error",
    valueColor: "#ef4444",
    unit: "%",
    size: "small",
    dataSource: "reportsStore.stats.failedRate",
    hasTrend: false,
    hasTimeRange: false,
    description: "Report execution failure rate",
    view: "reports/index.vue",
    position: "stats-row",
  },
];
