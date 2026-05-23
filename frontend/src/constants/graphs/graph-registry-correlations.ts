/**
 * Graph Registry — CORRELATIONS (COR)
 * 10 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const COR_GRAPHS: GraphDefinition[] = [
  // │ CORRELATIONS (COR) - 10 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "COR10001",
    module: "COR",
    title: "Total Signals",
    component: "StatPanel",
    chartType: "stat",
    signalType: "correlations",
    unit: "count",
    description: "Total correlated signals",
    dataSource: "computed total",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH correlations AGGREGATE count_distinct(signal_id)",
        legendFormat: "Total Signals",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/correlations/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "COR10002",
    module: "COR",
    title: "Correlated Traces",
    component: "StatPanel",
    chartType: "stat",
    signalType: "correlations",
    unit: "count",
    description: "Traces with cross-signal correlations",
    dataSource: "correlated count",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'sum(rate(traces_total{service_name="{{service_name}}"}[$__rate_interval]))',
        legendFormat: "Correlated Traces",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE rate(*) INTERVAL {{interval}}",
        legendFormat: "Correlated Traces",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/correlations/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "COR10003",
    module: "COR",
    title: "Error Correlations",
    component: "StatPanel",
    chartType: "stat",
    signalType: "correlations",
    unit: "count",
    description: "Error-related signal correlations",
    dataSource: "error correlation count",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'sum(rate(traces_total{service_name="{{service_name}}", status_code="ERROR"}[$__rate_interval])) / sum(rate(traces_total{service_name="{{service_name}}"}[$__rate_interval])) * 100',
        legendFormat: "Error Correlations",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE service_name = '{{service_name}}' AND status_code = 'ERROR' AGGREGATE rate(*) INTERVAL {{interval}}",
        legendFormat: "Error Correlations",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/correlations/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "COR10004",
    module: "COR",
    title: "Avg Response",
    component: "StatPanel",
    chartType: "stat",
    signalType: "correlations",
    unit: "ms",
    description: "Average response time across correlated signals",
    dataSource: "avg response time",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'avg(trace_duration_ms{service_name="{{service_name}}"})',
        legendFormat: "Avg Response",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE avg(duration_ns) / 1000000 INTERVAL {{interval}}",
        legendFormat: "Avg Response",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/correlations/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "COR10005",
    module: "COR",
    title: "Request Rate",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "metrics",
    unit: "req/s",
    description: "Request rate time series (time-based correlation)",
    dataSource: "mockMetricData",
    defaultQueries: [
      {
        dialect: "promql",
        expression: "rate(http_requests_total[$__rate_interval])",
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "telemetry/correlations/index.vue",
    position: "time-based-row1",
    toggleable: true,
  },
  {
    graphId: "COR10006",
    module: "COR",
    title: "Error Rate",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "metrics",
    unit: "errors",
    description: "Error rate time series (time-based correlation)",
    dataSource: "mockErrorData",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'rate(http_requests_total{status=~"5.."}[$__rate_interval])',
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "telemetry/correlations/index.vue",
    position: "time-based-row2",
    toggleable: true,
  },
  {
    graphId: "COR10007",
    module: "COR",
    title: "P50 - P99 Latency",
    component: "TimeSeriesChart",
    chartType: "timeseries",
    signalType: "metrics",
    unit: "ms",
    description: "P99 latency time series (time-based correlation)",
    dataSource: "mockLatencyData",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[$__rate_interval]))",
        legendFormat: "{{le}}",
        seriesKey: "le",
      },
    ],
    view: "telemetry/correlations/index.vue",
    position: "time-based-row3",
    toggleable: true,
  },
  {
    graphId: "COR10008",
    module: "COR",
    title: "Correlated Events",
    component: "Custom",
    chartType: "timeseries",
    signalType: "correlations",
    unit: "",
    description: "Scrollable event timeline with signal type badges",
    dataSource: "visibleEvents",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH correlations WHERE correlation_id = '{{correlation_id}}'",
        legend: "Events",
        legendFormat: "Correlated Events",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/correlations/index.vue",
    position: "time-based-timeline",
    toggleable: false,
  },
  {
    graphId: "COR10009",
    module: "COR",
    title: "Logs by Trace",
    component: "BarChart",
    chartType: "bar",
    signalType: "correlations",
    unit: "count",
    description: "Log count per trace (trace-based correlation)",
    dataSource: "traceCorrelationCategories / logsPerTraceSeries",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'count_over_time({service_name="{{service_name}}", severity_text="{{severity}}"}[$__rate_interval])',
        legendFormat: "Logs by Trace",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH logs WHERE service_name = '{{service_name}}' AND severity_text = '{{severity}}' AGGREGATE count(*) INTERVAL {{interval}}",
        legendFormat: "Logs by Trace",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/correlations/index.vue",
    position: "trace-based-row1",
    toggleable: true,
  },
  {
    graphId: "COR10010",
    module: "COR",
    title: "Latency Distribution",
    component: "BarChart",
    chartType: "bar",
    signalType: "correlations",
    unit: "count",
    description: "Latency bucket distribution (trace-based correlation)",
    dataSource: "latencyBuckets / latencyDistributionSeries",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'histogram_quantile(0.5, sum(rate(trace_duration_ms_bucket{service_name="{{service_name}}"}[$__rate_interval])) by (le))',
        legendFormat: "{{le}}",
        seriesKey: "le",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE p50(duration_ns) / 1000000 INTERVAL {{interval}}",
        legendFormat: "p50",
        seriesKey: "percentile",
      },
      {
        dialect: "promql",
        expression:
          'histogram_quantile(0.9, sum(rate(trace_duration_ms_bucket{service_name="{{service_name}}"}[$__rate_interval])) by (le))',
        legendFormat: "{{le}}",
        seriesKey: "le",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE p90(duration_ns) / 1000000 INTERVAL {{interval}}",
        legendFormat: "p90",
        seriesKey: "percentile",
      },
      {
        dialect: "promql",
        expression:
          'histogram_quantile(0.99, sum(rate(trace_duration_ms_bucket{service_name="{{service_name}}"}[$__rate_interval])) by (le))',
        legendFormat: "{{le}}",
        seriesKey: "le",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE p99(duration_ns) / 1000000 INTERVAL {{interval}}",
        legendFormat: "p99",
        seriesKey: "percentile",
      },
    ],
    view: "telemetry/correlations/index.vue",
    position: "trace-based-row2",
    toggleable: false,
  },

];
