/**
 * Stat Panel Registry — METRICS (MET)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const MET_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ METRICS (MET) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "MET20001",
    module: "MET",
    title: "Total Metrics",
    icon: "carbon:chart-line",
    color: "primary",
    unit: "count",
    size: "small",
    dataSource: "metricsStore.metricNames.length",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total unique metric names",
    view: "telemetry/metrics/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "MET20002",
    module: "MET",
    title: "Data Points",
    icon: "carbon:data-table",
    color: "purple",
    unit: "count",
    size: "small",
    dataSource: "metricsStore.dataPoints",
    hasTrend: true,
    hasTimeRange: true,
    description: "Total data points ingested in time range",
    view: "telemetry/metrics/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "MET20003",
    module: "MET",
    title: "Active Series",
    icon: "carbon:analytics",
    color: "success",
    unit: "count",
    size: "small",
    dataSource: "metricsStore.activeSeries",
    hasTrend: true,
    hasTimeRange: true,
    description: "Currently active time series in time range",
    view: "telemetry/metrics/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "MET20004",
    module: "MET",
    title: "Avg Rate /min",
    icon: "carbon:meter",
    color: "warning",
    unit: "/min",
    size: "small",
    dataSource: "metricsStore.avgRate",
    hasTrend: true,
    hasTimeRange: true,
    description: "Average ingestion rate per minute",
    view: "telemetry/metrics/index.vue",
    position: "stats-row",
  },
];
