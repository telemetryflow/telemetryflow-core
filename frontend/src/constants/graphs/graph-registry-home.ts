/**
 * Graph Registry — HOME (HOM)
 * 8 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const HOM_GRAPHS: GraphDefinition[] = [
  // │ HOME (HOM) - 8 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "HOM10001",
    module: "HOM",
    title: "Total Metrics",
    component: "StatPanel",
    chartType: "stat",
    signalType: "metrics",
    unit: "count",
    description: "Total number of unique metric names discovered",
    dataSource: "metricsStore.metricNames.length",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'count({__name__=~".+"})',
        legendFormat: "Total Metrics",
        seriesKey: "__name__",
      },
    ],
    view: "home/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "HOM10002",
    module: "HOM",
    title: "Log Events",
    component: "StatPanel",
    chartType: "stat",
    signalType: "logs",
    unit: "count",
    description: "Total log events ingested",
    dataSource: "logsStore.totalLogs",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "count_over_time(logs[$__rate_interval])",
        legendFormat: "Log Events",
        seriesKey: "__name__",
      },
    ],
    view: "home/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "HOM10003",
    module: "HOM",
    title: "Traces",
    component: "StatPanel",
    chartType: "stat",
    signalType: "traces",
    unit: "count",
    description: "Total traces collected",
    dataSource: "tracesStore.traces.length",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "count(traces[$__rate_interval])",
        legendFormat: "Traces",
        seriesKey: "__name__",
      },
    ],
    view: "home/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "HOM10004",
    module: "HOM",
    title: "Active Alerts",
    component: "StatPanel",
    chartType: "stat",
    signalType: "alerts",
    unit: "count",
    description: "Currently firing alerts",
    dataSource: "alertsStore.activeAlerts",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'count(ALERTS{alertstate="firing"})',
        legendFormat: "Active Alerts",
        seriesKey: "__name__",
      },
    ],
    view: "home/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "HOM10005",
    module: "HOM",
    title: "Request Rate",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "traces",
    unit: "req/s",
    description:
      "HTTP request throughput derived from trace span count (ClickHouse traces MV)",
    dataSource: "CH MV: traces → traces_1h/daily rollup",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH traces AGGREGATE count",
        legend: "Request Rate",
        legendFormat: "Request Rate",
        seriesKey: "__name__",
      },
    ],
    view: "home/index.vue",
    position: "charts-grid-row1-col1",
    toggleable: true,
  },
  {
    graphId: "HOM10006",
    module: "HOM",
    title: "Latency Distribution",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "traces",
    unit: "ms",
    description:
      "Request latency percentiles from ClickHouse traces MV (span duration P50–P99)",
    dataSource: "CH MV: traces → traces_1h/daily rollup",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH traces latency AGGREGATE percentiles(duration)",
        legend: "Latency",
        legendFormat: "Latency Distribution",
        seriesKey: "__name__",
      },
    ],
    view: "home/index.vue",
    position: "charts-grid-row1-col2",
    toggleable: true,
  },
  {
    graphId: "HOM10007",
    module: "HOM",
    title: "Error Rate",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "traces",
    unit: "%",
    description: "Trace-derived error rate from ClickHouse traces MV",
    dataSource: "CH MV: traces → traces_1h/daily rollup",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH traces AGGREGATE error_rate(*)",
        legend: "Error Rate",
        legendFormat: "Error Rate",
        seriesKey: "__name__",
      },
    ],
    view: "home/index.vue",
    position: "charts-grid-row2-col1",
    toggleable: true,
  },
  {
    graphId: "HOM10008",
    module: "HOM",
    title: "Log Distribution by Level",
    component: "BarChart",
    chartType: "bar",
    signalType: "logs",
    unit: "count",
    description: "Log volume by severity from ClickHouse logs MV",
    dataSource: "CH MV: logs → logs_1h/daily rollup",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH logs AGGREGATE count(*) BY severity_text",
        legendFormat: "{{severity_text}}",
        seriesKey: "severity_text",
      },
    ],
    view: "home/index.vue",
    position: "charts-grid-row2-col2",
    toggleable: true,
  },

];
