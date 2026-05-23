/**
 * Graph Registry — EXEMPLARS (EXP)
 * 5 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const EXP_GRAPHS: GraphDefinition[] = [
  // │ EXEMPLARS (EXP) - 5 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "EXP10001",
    module: "EXP",
    title: "Exemplars",
    component: "StatPanel",
    chartType: "stat",
    signalType: "exemplars",
    unit: "count",
    description: "Total exemplars count",
    dataSource: "total exemplars",
    defaultQueries: [
      { dialect: "tfql", expression: "FETCH exemplars AGGREGATE count(*)", legendFormat: "Exemplars", seriesKey: "__name__" },
    ],
    view: "telemetry/exemplars/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "EXP10002",
    module: "EXP",
    title: "Metrics",
    component: "StatPanel",
    chartType: "stat",
    signalType: "exemplars",
    unit: "count",
    description: "Unique metrics with exemplars",
    dataSource: "unique metrics count",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH exemplars AGGREGATE count_distinct(metric_name)",
        legendFormat: "Metrics",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/exemplars/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "EXP10003",
    module: "EXP",
    title: "Linked Traces",
    component: "StatPanel",
    chartType: "stat",
    signalType: "exemplars",
    unit: "count",
    description: "Exemplars with trace ID links",
    dataSource: "exemplars with trace links",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH exemplars AGGREGATE count_distinct(trace_id)",
        legendFormat: "Linked Traces",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/exemplars/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "EXP10004",
    module: "EXP",
    title: "Services",
    component: "StatPanel",
    chartType: "stat",
    signalType: "exemplars",
    unit: "count",
    description: "Unique services producing exemplars",
    dataSource: "unique services count",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH exemplars AGGREGATE count_distinct(service_name)",
        legendFormat: "Services",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/exemplars/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "EXP10005",
    module: "EXP",
    title: "Exemplar Distribution",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "exemplars",
    unit: "count",
    description: "Exemplar distribution over time (top 5 metrics)",
    dataSource: "chartData (top 5 metrics grouped)",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "exemplars{} | count by (metric_name) over time(5m)",
        legendFormat: "{{metric_name}}",
        seriesKey: "metric_name",
      },
    ],
    view: "telemetry/exemplars/index.vue",
    position: "main-chart",
    toggleable: true,
  },

];
