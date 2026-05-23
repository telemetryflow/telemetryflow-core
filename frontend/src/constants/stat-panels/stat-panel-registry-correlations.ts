/**
 * Stat Panel Registry — CORRELATIONS (COR)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const COR_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ CORRELATIONS (COR) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "COR20001",
    module: "COR",
    title: "Total Signals",
    icon: "carbon:connect",
    color: "purple",
    unit: "count",
    size: "small",
    dataSource: "computed total (logs + traces + exemplars)",
    hasTrend: false,
    hasTimeRange: true,
    description: "Total correlated signals in time range",
    view: "telemetry/correlations/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "COR20002",
    module: "COR",
    title: "Correlated Traces",
    icon: "carbon:flow",
    color: "primary",
    unit: "count",
    size: "small",
    dataSource: "correlated count",
    hasTrend: true,
    hasTimeRange: true,
    description: "Traces with cross-signal correlations",
    view: "telemetry/correlations/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "COR20003",
    module: "COR",
    title: "Error Correlations",
    icon: "carbon:warning-filled",
    color: "error",
    unit: "count",
    size: "small",
    dataSource: "error correlation count",
    hasTrend: true,
    hasTimeRange: true,
    description: "Error-related signal correlations",
    view: "telemetry/correlations/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "COR20004",
    module: "COR",
    title: "Avg Response",
    icon: "carbon:time",
    color: "success",
    unit: "ms",
    size: "small",
    dataSource: "avg response time",
    hasTrend: true,
    hasTimeRange: true,
    description: "Average response time across correlated signals",
    view: "telemetry/correlations/index.vue",
    position: "stats-row",
  },
];
