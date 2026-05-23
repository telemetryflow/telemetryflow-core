/**
 * Stat Panel Registry — EXEMPLARS (EXP)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const EXP_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ EXEMPLARS (EXP) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "EXP20001",
    module: "EXP",
    title: "Exemplars",
    icon: "carbon:link",
    color: "warning",
    unit: "count",
    size: "small",
    dataSource: "exemplarsStore.exemplars.length",
    hasTrend: true,
    hasTimeRange: true,
    description: "Total exemplars count in time range",
    view: "telemetry/exemplars/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "EXP20002",
    module: "EXP",
    title: "Metrics",
    icon: "carbon:chart-line",
    color: "primary",
    unit: "count",
    size: "small",
    dataSource: "exemplarsStore.metricNames.length",
    hasTrend: false,
    hasTimeRange: false,
    description: "Unique metrics with exemplars",
    view: "telemetry/exemplars/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "EXP20003",
    module: "EXP",
    title: "Linked Traces",
    icon: "carbon:flow",
    color: "purple",
    unit: "count",
    size: "small",
    dataSource: "exemplars with trace links",
    hasTrend: true,
    hasTimeRange: true,
    description: "Exemplars with trace ID links",
    view: "telemetry/exemplars/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "EXP20004",
    module: "EXP",
    title: "Services",
    icon: "carbon:service-id",
    color: "success",
    unit: "count",
    size: "small",
    dataSource: "unique services count",
    hasTrend: false,
    hasTimeRange: false,
    description: "Unique services producing exemplars",
    view: "telemetry/exemplars/index.vue",
    position: "stats-row",
  },
];
