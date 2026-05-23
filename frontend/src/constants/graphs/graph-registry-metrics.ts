/**
 * Graph Registry — METRICS (MET)
 * 7 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const MET_GRAPHS: GraphDefinition[] = [
  // │ METRICS (MET) - 7 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "MET10001",
    module: "MET",
    title: "Total Metrics",
    component: "StatPanel",
    chartType: "stat",
    signalType: "metrics",
    unit: "count",
    description: "Total unique metric names",
    dataSource: "metricsStore.metricNames.length",
    defaultQueries: [
      { dialect: "promql", expression: 'count({__name__=~".+"})', legendFormat: "Total Metrics", seriesKey: "__name__" },
    ],
    view: "telemetry/metrics/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "MET10002",
    module: "MET",
    title: "Data Points",
    component: "StatPanel",
    chartType: "stat",
    signalType: "metrics",
    unit: "count",
    description: "Total data points ingested",
    dataSource: "metricsStore.dataPoints",
    defaultQueries: [
      {
        dialect: "promql",
        expression: "sum(scrape_samples_scraped)",
        legendFormat: "Data Points",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/metrics/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "MET10003",
    module: "MET",
    title: "Active Series",
    component: "StatPanel",
    chartType: "stat",
    signalType: "metrics",
    unit: "count",
    description: "Currently active time series",
    dataSource: "metricsStore.activeSeries",
    defaultQueries: [
      {
        dialect: "promql",
        expression: "sum(scrape_series_added)",
        legendFormat: "Active Series",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/metrics/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "MET10004",
    module: "MET",
    title: "Avg Rate /min",
    component: "StatPanel",
    chartType: "stat",
    signalType: "metrics",
    unit: "/min",
    description: "Average ingestion rate per minute",
    dataSource: "metricsStore.avgRate",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          "sum(rate(prometheus_tsdb_head_samples_appended_total[$__rate_interval])) * 60",
        legendFormat: "Avg Rate /min",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/metrics/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "MET10005",
    module: "MET",
    title: "Metrics Explorer",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "metrics",
    unit: "dynamic",
    description: "Interactive metric explorer with query results",
    dataSource: "chartData (query result)",
    defaultQueries: [
      { dialect: "promql", expression: "{__name__=~'.+'}", legendFormat: "Metrics Explorer", seriesKey: "__name__" },
      { dialect: "tfql", expression: "{__name__=~'.+'}", legendFormat: "Metrics Explorer", seriesKey: "__name__" },
    ],
    view: "telemetry/metrics/index.vue",
    position: "explorer-area",
    toggleable: true,
  },
  {
    graphId: "MET10006",
    module: "MET",
    title: "Metrics Explorer (Bar)",
    component: "BarChart",
    chartType: "bar",
    signalType: "metrics",
    unit: "dynamic",
    description: "Bar chart view of metric explorer results",
    dataSource: "metricsBarCategories / metricsBarSeries",
    defaultQueries: [
      {
        dialect: "promql",
        expression: "topk(10, {__name__=~'.+'})",
        legendFormat: "Metrics Explorer (Bar)",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/metrics/index.vue",
    position: "explorer-area",
    toggleable: true,
  },
  {
    graphId: "MET10007",
    module: "MET",
    title: "Metric Time Series",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "metrics",
    unit: "dynamic",
    description: "Single metric detail view with all label combinations",
    dataSource: "chartData (single metric all series)",
    defaultQueries: [
      {
        dialect: "promql",
        expression: "<metric_name>{<label_filters>}",
        legendFormat: "Metric Time Series",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/metrics/detail.vue",
    position: "main-chart",
    toggleable: true,
  },

];
