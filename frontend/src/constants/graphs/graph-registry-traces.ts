/**
 * Graph Registry — TRACES (TRC)
 * 16 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const TRC_GRAPHS: GraphDefinition[] = [
  // │ TRACES (TRC) - 16 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "TRC10001",
    module: "TRC",
    title: "Traces",
    component: "StatPanel",
    chartType: "stat",
    signalType: "traces",
    unit: "count",
    description: "Total traces in current time range",
    dataSource: "tracesStore.traces.length",
    defaultQueries: [{ dialect: "tfql", expression: "count(traces)", legendFormat: "Total Traces", seriesKey: "__name__" }],
    view: "telemetry/traces/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "TRC10002",
    module: "TRC",
    title: "Services",
    component: "StatPanel",
    chartType: "stat",
    signalType: "traces",
    unit: "count",
    description: "Unique services in traces",
    dataSource: "unique services count",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "count_distinct(traces.service_name)",
        legendFormat: "Services",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "TRC10003",
    module: "TRC",
    title: "OK",
    component: "StatPanel",
    chartType: "stat",
    signalType: "traces",
    unit: "count",
    description: "Successful traces count",
    dataSource: "success trace count",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: 'count(traces{status="ok"})',
        legendFormat: "OK",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "TRC10004",
    module: "TRC",
    title: "Errors",
    component: "StatPanel",
    chartType: "stat",
    signalType: "traces",
    unit: "count",
    description: "Error traces count",
    dataSource: "error trace count",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: 'count(traces{status="error"})',
        legendFormat: "Errors",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "TRC10005",
    module: "TRC",
    title: "Trace Scatter Plot",
    component: "ScatterChart",
    chartType: "scatter",
    signalType: "traces",
    unit: "ms",
    description:
      "Trace duration vs timestamp scatter plot (success=green, error=red)",
    dataSource: "tracesStore.scatterData",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: 'traces{service="<service>", duration>100ms}',
        legendFormat: "Trace Scatter Plot",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/index.vue",
    position: "main-chart-area",
    toggleable: false,
  },
  {
    graphId: "TRC10006",
    module: "TRC",
    title: "Latency & Errors Heatmap",
    component: "HeatmapChart",
    chartType: "heatmap",
    signalType: "traces",
    unit: "requests",
    description:
      "2D heatmap of latency buckets over time (color = request count)",
    dataSource: "heatmapXCategories / heatmapChartData",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "traces.latency_histogram{} by (bucket)",
        legendFormat: "{{bucket}}",
        seriesKey: "bucket",
      },
    ],
    view: "telemetry/traces/index.vue",
    position: "main-chart-area",
    toggleable: false,
  },
  {
    graphId: "TRC10007",
    module: "TRC",
    title: "Duration",
    component: "StatPanel",
    chartType: "stat",
    signalType: "traces",
    unit: "ms",
    description: "Total trace duration",
    dataSource: "trace.duration",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'avg(trace_duration_ms{service_name="{{service_name}}"})',
        legendFormat: "Duration",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE avg(duration_ns) / 1000000 INTERVAL {{interval}}",
        legendFormat: "Duration",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/detail.vue",
    position: "detail-stats-row",
    toggleable: false,
  },
  {
    graphId: "TRC10008",
    module: "TRC",
    title: "Spans",
    component: "StatPanel",
    chartType: "stat",
    signalType: "traces",
    unit: "count",
    description: "Total span count in trace",
    dataSource: "trace.spans.length",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE trace_id = '{{trace_id}}' AGGREGATE count(*)",
        legend: "Span Count",
        legendFormat: "Spans",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/detail.vue",
    position: "detail-stats-row",
    toggleable: false,
  },
  {
    graphId: "TRC10009",
    module: "TRC",
    title: "Services (Detail)",
    component: "StatPanel",
    chartType: "stat",
    signalType: "traces",
    unit: "count",
    description: "Unique services in trace detail",
    dataSource: "unique services in trace",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE trace_id = '{{trace_id}}' AGGREGATE count_distinct(service_name)",
        legend: "Services",
        legendFormat: "Services (Detail)",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/detail.vue",
    position: "detail-stats-row",
    toggleable: false,
  },
  {
    graphId: "TRC10010",
    module: "TRC",
    title: "Errors (Detail)",
    component: "StatPanel",
    chartType: "stat",
    signalType: "traces",
    unit: "count",
    description: "Error spans in trace detail",
    dataSource: "error spans count",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'sum(rate(traces_total{service_name="{{service_name}}", status_code="ERROR"}[$__rate_interval])) / sum(rate(traces_total{service_name="{{service_name}}"}[$__rate_interval])) * 100',
        legendFormat: "Errors (Detail)",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE service_name = '{{service_name}}' AND status_code = 'ERROR' AGGREGATE rate(*) INTERVAL {{interval}}",
        legendFormat: "Errors (Detail)",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/detail.vue",
    position: "detail-stats-row",
    toggleable: false,
  },
  {
    graphId: "TRC10011",
    module: "TRC",
    title: "Waterfall Timeline",
    component: "Custom",
    chartType: "waterfall",
    signalType: "traces",
    unit: "ms",
    description:
      "Hierarchical span timeline with duration bars and service colors",
    dataSource: "flatSpans tree",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE trace_id = '{{trace_id}}' ORDER BY start_time ASC",
        legend: "Waterfall",
        legendFormat: "Waterfall Timeline",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/detail.vue",
    position: "waterfall-tab",
    toggleable: false,
  },
  {
    graphId: "TRC10012",
    module: "TRC",
    title: "Flame Graph",
    component: "Custom",
    chartType: "flamegraph",
    signalType: "traces",
    unit: "ms",
    description: "Depth-based span stacking with self-time visualization",
    dataSource: "flameGraphLevels",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE trace_id = '{{trace_id}}' ORDER BY start_time ASC",
        legend: "Flame Graph",
        legendFormat: "Flame Graph",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/detail.vue",
    position: "flamegraph-tab",
    toggleable: false,
  },
  {
    graphId: "TRC10013",
    module: "TRC",
    title: "Trace Node Graph",
    component: "TraceNodeGraph",
    chartType: "topology",
    signalType: "traces",
    unit: "",
    description: "Service dependency graph per trace (canvas-based)",
    dataSource: "trace spans grouped by service::operation",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE trace_id = '{{trace_id}}' AGGREGATE count(*) GROUP BY service_name",
        legend: "Node Graph",
        legendFormat: "{{service_namelegend}}",
        seriesKey: "service_namelegend",
      },
    ],
    view: "telemetry/traces/detail.vue",
    position: "node-graph-tab",
    toggleable: false,
  },

  // ── Trace Monitor (RED metrics) ──────────────────────────────────────────────
  {
    graphId: "TRC10014",
    module: "TRC",
    title: "Latency (Duration)",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "traces",
    unit: "ms",
    description:
      "Trace latency percentiles (P50, P75, P90, P95, P99) and average over time",
    dataSource: "trace_monitor_latency",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'histogram_quantile(0.5, sum(rate(trace_duration_ms_bucket[$__rate_interval])) by (le))',
        legendFormat: "P50",
        seriesKey: "le",
      },
      {
        dialect: "promql",
        expression:
          'histogram_quantile(0.75, sum(rate(trace_duration_ms_bucket[$__rate_interval])) by (le))',
        legendFormat: "P75",
        seriesKey: "le",
      },
      {
        dialect: "promql",
        expression:
          'histogram_quantile(0.9, sum(rate(trace_duration_ms_bucket[$__rate_interval])) by (le))',
        legendFormat: "P90",
        seriesKey: "le",
      },
      {
        dialect: "promql",
        expression:
          'histogram_quantile(0.95, sum(rate(trace_duration_ms_bucket[$__rate_interval])) by (le))',
        legendFormat: "P95",
        seriesKey: "le",
      },
      {
        dialect: "promql",
        expression:
          'histogram_quantile(0.99, sum(rate(trace_duration_ms_bucket[$__rate_interval])) by (le))',
        legendFormat: "P99",
        seriesKey: "le",
      },
    ],
    view: "telemetry/traces/components/TraceMonitorTab.vue",
    position: "monitor-row-col1",
    toggleable: true,
  },
  {
    graphId: "TRC10015",
    module: "TRC",
    title: "Error Rate",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "traces",
    unit: "%",
    description: "Trace error rate percentage over time",
    dataSource: "trace_monitor_error_rate",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'sum(rate(traces_total{status_code="ERROR"}[$__rate_interval])) / sum(rate(traces_total[$__rate_interval])) * 100',
        legendFormat: "Error Rate",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/components/TraceMonitorTab.vue",
    position: "monitor-row-col2",
    toggleable: true,
  },
  {
    graphId: "TRC10016",
    module: "TRC",
    title: "Request Rate",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "traces",
    unit: "req/s",
    description: "Trace request rate (requests per second) over time",
    dataSource: "trace_monitor_request_rate",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          "sum(rate(traces_total[$__rate_interval]))",
        legendFormat: "Request Rate",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/traces/components/TraceMonitorTab.vue",
    position: "monitor-row-col3",
    toggleable: true,
  },

];
