/**
 * Query Template Registry
 *
 * Maps each chart/widget type to its optimal TFQL and PromQL query patterns,
 * default aggregations, recommended intervals, and chart component bindings.
 *
 * Used by:
 * - Dashboard widget builder to suggest query templates
 * - Dashboard renderer to execute widget queries
 * - Alerting module to construct evaluation queries
 * - Any view that needs chart-ready data from the query system
 */

import type { WidgetType, WidgetQuery } from "@/types/dashboard";

// ============================================
// Query Template Types
// ============================================

export type SignalSource = "metric" | "log" | "trace";
export type AggregationFunction =
  | "count"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "rate"
  | "increase"
  | "irate"
  | "delta"
  | "p50"
  | "p75"
  | "p90"
  | "p95"
  | "p99"
  | "histogram_quantile"
  | "topk"
  | "bottomk";

export type ChartComponentName =
  | "TimeSeriesChart"
  | "BarChart"
  | "GaugeChart"
  | "HeatmapChart"
  | "ScatterChart"
  | "StatPanel"
  | "DataTable"
  | "LogViewer"
  | "TextWidget";

/**
 * Recommended aggregation interval based on time range.
 * Matches backend TimeRange.suggestInterval() logic.
 */
export interface IntervalRecommendation {
  maxDurationMs: number;
  interval: string;
  intervalMs: number;
  label: string;
}

/**
 * A single query template definition for a widget type.
 */
export interface QueryTemplate {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Which widget type this template is for */
  widgetType: WidgetType;
  /** Primary signal source */
  source: SignalSource;
  /** Vue chart component to render */
  component: ChartComponentName;
  /** Default TFQL query pattern (with {{placeholders}}) */
  tfql: string;
  /** Equivalent PromQL pattern (with {{placeholders}}) */
  promql: string;
  /** Default aggregation function */
  defaultAggregation: AggregationFunction;
  /** Supported aggregation functions */
  supportedAggregations: AggregationFunction[];
  /** Whether interval/time bucketing applies */
  requiresInterval: boolean;
  /** Default chart options */
  defaultOptions: {
    unit?: string;
    stacked?: boolean;
    fillOpacity?: number;
    legend?: boolean;
    decimals?: number;
  };
  /** Placeholder variables the template expects */
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  label: string;
  type:
    | "metric_name"
    | "service_name"
    | "label"
    | "severity"
    | "span_name"
    | "duration"
    | "custom";
  required: boolean;
  defaultValue?: string;
}

// ============================================
// Interval Recommendations
// ============================================

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const INTERVAL_RECOMMENDATIONS: IntervalRecommendation[] = [
  {
    maxDurationMs: 1 * HOUR,
    interval: "1m",
    intervalMs: MINUTE,
    label: "1 minute",
  },
  {
    maxDurationMs: 6 * HOUR,
    interval: "5m",
    intervalMs: 5 * MINUTE,
    label: "5 minutes",
  },
  {
    maxDurationMs: 24 * HOUR,
    interval: "15m",
    intervalMs: 15 * MINUTE,
    label: "15 minutes",
  },
  { maxDurationMs: 7 * DAY, interval: "1h", intervalMs: HOUR, label: "1 hour" },
  {
    maxDurationMs: 30 * DAY,
    interval: "6h",
    intervalMs: 6 * HOUR,
    label: "6 hours",
  },
  { maxDurationMs: Infinity, interval: "1d", intervalMs: DAY, label: "1 day" },
];

/**
 * Get recommended aggregation interval for a time range.
 * Mirrors backend TimeRange.suggestInterval().
 */
export function getRecommendedInterval(
  durationMs: number,
): IntervalRecommendation {
  for (const rec of INTERVAL_RECOMMENDATIONS) {
    if (durationMs <= rec.maxDurationMs) {
      return rec;
    }
  }
  return INTERVAL_RECOMMENDATIONS[INTERVAL_RECOMMENDATIONS.length - 1];
}

/**
 * Get recommended interval from start/end timestamps.
 */
export function getIntervalForTimeRange(
  start: number,
  end: number,
): IntervalRecommendation {
  return getRecommendedInterval(end - start);
}

// ============================================
// Query Templates Registry
// ============================================

export const QUERY_TEMPLATES: QueryTemplate[] = [
  // ── TimeSeriesChart Templates ──────────────────────────────────
  {
    id: "timeseries-metric-rate",
    name: "Metric Rate Over Time",
    description: "Time-bucketed rate of a counter metric (e.g., request rate)",
    widgetType: "timeseries",
    source: "metric",
    component: "TimeSeriesChart",
    tfql: "FETCH metrics WHERE metric_name = '{{metric_name}}' AND service_name = '{{service_name}}' TIMERANGE {{timerange}} AGGREGATE rate(value) INTERVAL {{interval}} GROUP BY service_name",
    promql:
      'rate({{metric_name}}{service_name="{{service_name}}"}[{{interval}}])',
    defaultAggregation: "rate",
    supportedAggregations: [
      "rate",
      "increase",
      "irate",
      "delta",
      "avg",
      "sum",
      "min",
      "max",
    ],
    requiresInterval: true,
    defaultOptions: { unit: "req/s", legend: true, fillOpacity: 0.1 },
    variables: [
      {
        name: "metric_name",
        label: "Metric Name",
        type: "metric_name",
        required: true,
        defaultValue: "http_requests_total",
      },
      {
        name: "service_name",
        label: "Service",
        type: "service_name",
        required: false,
        defaultValue: "api-gateway",
      },
    ],
  },
  {
    id: "timeseries-metric-avg",
    name: "Metric Average Over Time",
    description: "Time-bucketed average of a gauge metric (e.g., CPU, memory)",
    widgetType: "timeseries",
    source: "metric",
    component: "TimeSeriesChart",
    tfql: "FETCH metrics WHERE metric_name = '{{metric_name}}' TIMERANGE {{timerange}} AGGREGATE avg(value) INTERVAL {{interval}} GROUP BY service_name",
    promql: "avg_over_time({{metric_name}}[{{interval}}])",
    defaultAggregation: "avg",
    supportedAggregations: ["avg", "min", "max", "sum", "p50", "p95", "p99"],
    requiresInterval: true,
    defaultOptions: { unit: "%", legend: true },
    variables: [
      {
        name: "metric_name",
        label: "Metric Name",
        type: "metric_name",
        required: true,
        defaultValue: "system_cpu_utilization",
      },
    ],
  },
  {
    id: "timeseries-metric-percentile",
    name: "Metric Percentile Over Time",
    description:
      "Time-bucketed percentile of a histogram metric (e.g., latency p99)",
    widgetType: "timeseries",
    source: "metric",
    component: "TimeSeriesChart",
    tfql: "FETCH metrics WHERE metric_name = '{{metric_name}}' TIMERANGE {{timerange}} AGGREGATE p99(value) INTERVAL {{interval}} GROUP BY service_name",
    promql:
      'histogram_quantile(0.99, rate({{metric_name}}_bucket{service_name="{{service_name}}"}[{{interval}}]))',
    defaultAggregation: "p99",
    supportedAggregations: ["p50", "p75", "p90", "p95", "p99", "avg", "max"],
    requiresInterval: true,
    defaultOptions: { unit: "ms", legend: true },
    variables: [
      {
        name: "metric_name",
        label: "Metric Name",
        type: "metric_name",
        required: true,
        defaultValue: "http_request_duration_ms",
      },
      {
        name: "service_name",
        label: "Service",
        type: "service_name",
        required: false,
      },
    ],
  },
  {
    id: "timeseries-log-volume",
    name: "Log Volume Over Time",
    description: "Log count over time grouped by severity",
    widgetType: "timeseries",
    source: "log",
    component: "TimeSeriesChart",
    tfql: "FETCH logs WHERE service_name = '{{service_name}}' TIMERANGE {{timerange}} AGGREGATE count(*) INTERVAL {{interval}} GROUP BY severity_text",
    promql: 'count_over_time({service_name="{{service_name}}"}[{{interval}}])',
    defaultAggregation: "count",
    supportedAggregations: ["count", "sum"],
    requiresInterval: true,
    defaultOptions: { unit: "logs", stacked: true, legend: true },
    variables: [
      {
        name: "service_name",
        label: "Service",
        type: "service_name",
        required: false,
      },
    ],
  },

  // ── BarChart Templates ─────────────────────────────────────────
  {
    id: "bar-metric-topk",
    name: "Top K by Metric",
    description: "Bar chart showing top K services by metric value",
    widgetType: "bar",
    source: "metric",
    component: "BarChart",
    tfql: "FETCH metrics WHERE metric_name = '{{metric_name}}' TIMERANGE {{timerange}} AGGREGATE topk(10, avg(value)) GROUP BY service_name",
    promql: "topk(10, avg by (service_name)({{metric_name}}))",
    defaultAggregation: "topk",
    supportedAggregations: ["topk", "bottomk", "sum", "avg", "count"],
    requiresInterval: false,
    defaultOptions: { legend: false },
    variables: [
      {
        name: "metric_name",
        label: "Metric Name",
        type: "metric_name",
        required: true,
        defaultValue: "http_requests_total",
      },
    ],
  },
  {
    id: "bar-log-severity",
    name: "Logs by Severity",
    description: "Bar chart showing log count grouped by severity level",
    widgetType: "bar",
    source: "log",
    component: "BarChart",
    tfql: "FETCH logs TIMERANGE {{timerange}} AGGREGATE count(*) GROUP BY severity_text",
    promql: 'count by (severity_text)({__name__="logs_total"})',
    defaultAggregation: "count",
    supportedAggregations: ["count", "sum"],
    requiresInterval: false,
    defaultOptions: { stacked: false, legend: false },
    variables: [],
  },
  {
    id: "bar-error-rate-by-service",
    name: "Error Rate by Service",
    description: "Horizontal bar chart showing error rate per service",
    widgetType: "bar",
    source: "metric",
    component: "BarChart",
    tfql: "FETCH metrics WHERE metric_name = 'http_errors_total' TIMERANGE {{timerange}} AGGREGATE rate(value) GROUP BY service_name ORDER BY value DESC LIMIT 10",
    promql: "topk(10, rate(http_errors_total[{{interval}}])) by (service_name)",
    defaultAggregation: "rate",
    supportedAggregations: ["rate", "avg", "sum", "count"],
    requiresInterval: false,
    defaultOptions: { unit: "err/s", legend: false },
    variables: [],
  },

  // ── GaugeChart Templates ───────────────────────────────────────
  {
    id: "gauge-cpu-utilization",
    name: "CPU Utilization Gauge",
    description: "Current CPU utilization percentage",
    widgetType: "gauge",
    source: "metric",
    component: "GaugeChart",
    tfql: "FETCH metrics WHERE metric_name = 'system_cpu_utilization' AND host_name = '{{host_name}}' TIMERANGE LAST 5m AGGREGATE avg(value)",
    promql: 'avg(system_cpu_utilization{host_name="{{host_name}}"})',
    defaultAggregation: "avg",
    supportedAggregations: ["avg", "max", "min", "p95"],
    requiresInterval: false,
    defaultOptions: { unit: "%", decimals: 1 },
    variables: [
      { name: "host_name", label: "Host", type: "label", required: false },
    ],
  },
  {
    id: "gauge-memory-utilization",
    name: "Memory Utilization Gauge",
    description: "Current memory utilization percentage",
    widgetType: "gauge",
    source: "metric",
    component: "GaugeChart",
    tfql: "FETCH metrics WHERE metric_name = 'system_memory_utilization' AND host_name = '{{host_name}}' TIMERANGE LAST 5m AGGREGATE avg(value)",
    promql: 'avg(system_memory_utilization{host_name="{{host_name}}"})',
    defaultAggregation: "avg",
    supportedAggregations: ["avg", "max", "min"],
    requiresInterval: false,
    defaultOptions: { unit: "%", decimals: 1 },
    variables: [
      { name: "host_name", label: "Host", type: "label", required: false },
    ],
  },
  {
    id: "gauge-disk-utilization",
    name: "Disk Utilization Gauge",
    description: "Current disk utilization percentage",
    widgetType: "gauge",
    source: "metric",
    component: "GaugeChart",
    tfql: "FETCH metrics WHERE metric_name = 'system_disk_utilization' AND host_name = '{{host_name}}' TIMERANGE LAST 5m AGGREGATE avg(value)",
    promql: 'avg(system_disk_utilization{host_name="{{host_name}}"})',
    defaultAggregation: "avg",
    supportedAggregations: ["avg", "max"],
    requiresInterval: false,
    defaultOptions: { unit: "%", decimals: 1 },
    variables: [
      { name: "host_name", label: "Host", type: "label", required: false },
    ],
  },

  // ── HeatmapChart Templates ─────────────────────────────────────
  {
    id: "heatmap-latency-distribution",
    name: "Latency Distribution Heatmap",
    description: "Request latency distribution across time buckets",
    widgetType: "heatmap",
    source: "metric",
    component: "HeatmapChart",
    tfql: "FETCH metrics WHERE metric_name = 'http_request_duration_ms' AND service_name = '{{service_name}}' TIMERANGE {{timerange}} AGGREGATE histogram(value, [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]) INTERVAL {{interval}}",
    promql:
      'rate(http_request_duration_ms_bucket{service_name="{{service_name}}"}[{{interval}}])',
    defaultAggregation: "histogram_quantile",
    supportedAggregations: ["histogram_quantile", "count", "sum"],
    requiresInterval: true,
    defaultOptions: { unit: "ms", legend: false },
    variables: [
      {
        name: "service_name",
        label: "Service",
        type: "service_name",
        required: false,
        defaultValue: "api-gateway",
      },
    ],
  },

  // ── ScatterChart Templates ─────────────────────────────────────
  {
    id: "scatter-trace-duration",
    name: "Trace Duration Scatter",
    description:
      "Scatter plot of trace durations over time with error highlighting",
    widgetType: "traces",
    source: "trace",
    component: "ScatterChart",
    tfql: "FETCH traces WHERE service_name = '{{service_name}}' TIMERANGE {{timerange}} LIMIT 500",
    promql: "",
    defaultAggregation: "count",
    supportedAggregations: ["count"],
    requiresInterval: false,
    defaultOptions: { unit: "ms", legend: false },
    variables: [
      {
        name: "service_name",
        label: "Service",
        type: "service_name",
        required: false,
      },
    ],
  },
  {
    id: "scatter-trace-errors",
    name: "Error Traces Scatter",
    description:
      "Scatter plot of only error traces with duration and span count",
    widgetType: "traces",
    source: "trace",
    component: "ScatterChart",
    tfql: "FETCH traces WHERE has_error = true AND service_name = '{{service_name}}' TIMERANGE {{timerange}} LIMIT 200",
    promql: "",
    defaultAggregation: "count",
    supportedAggregations: ["count"],
    requiresInterval: false,
    defaultOptions: { unit: "ms", legend: false },
    variables: [
      {
        name: "service_name",
        label: "Service",
        type: "service_name",
        required: false,
      },
    ],
  },

  // ── StatPanel Templates ────────────────────────────────────────
  {
    id: "stat-request-count",
    name: "Request Count",
    description: "Total request count with trend comparison",
    widgetType: "stat",
    source: "metric",
    component: "StatPanel",
    tfql: "FETCH metrics WHERE metric_name = 'http_requests_total' AND service_name = '{{service_name}}' TIMERANGE {{timerange}} AGGREGATE count(*)",
    promql:
      'sum(increase(http_requests_total{service_name="{{service_name}}"}[{{interval}}]))',
    defaultAggregation: "count",
    supportedAggregations: ["count", "sum", "avg"],
    requiresInterval: false,
    defaultOptions: { unit: "req", decimals: 0 },
    variables: [
      {
        name: "service_name",
        label: "Service",
        type: "service_name",
        required: false,
      },
    ],
  },
  {
    id: "stat-error-rate",
    name: "Error Rate",
    description: "Error rate percentage with severity coloring",
    widgetType: "stat",
    source: "metric",
    component: "StatPanel",
    tfql: "FETCH metrics WHERE metric_name = 'http_error_rate' AND service_name = '{{service_name}}' TIMERANGE {{timerange}} AGGREGATE avg(value)",
    promql:
      'sum(rate(http_errors_total{service_name="{{service_name}}"}[5m])) / sum(rate(http_requests_total{service_name="{{service_name}}"}[5m])) * 100',
    defaultAggregation: "avg",
    supportedAggregations: ["avg", "max", "p99"],
    requiresInterval: false,
    defaultOptions: { unit: "%", decimals: 2 },
    variables: [
      {
        name: "service_name",
        label: "Service",
        type: "service_name",
        required: false,
      },
    ],
  },
  {
    id: "stat-latency-p99",
    name: "P99 Latency",
    description: "99th percentile latency value",
    widgetType: "stat",
    source: "metric",
    component: "StatPanel",
    tfql: "FETCH metrics WHERE metric_name = 'http_request_duration_ms' AND service_name = '{{service_name}}' TIMERANGE {{timerange}} AGGREGATE p99(value)",
    promql:
      'histogram_quantile(0.99, sum(rate(http_request_duration_ms_bucket{service_name="{{service_name}}"}[5m])) by (le))',
    defaultAggregation: "p99",
    supportedAggregations: ["p50", "p75", "p90", "p95", "p99", "avg", "max"],
    requiresInterval: false,
    defaultOptions: { unit: "ms", decimals: 1 },
    variables: [
      {
        name: "service_name",
        label: "Service",
        type: "service_name",
        required: false,
      },
    ],
  },
  {
    id: "stat-uptime",
    name: "Uptime Percentage",
    description: "Service uptime percentage over time range",
    widgetType: "stat",
    source: "metric",
    component: "StatPanel",
    tfql: "FETCH metrics WHERE metric_name = 'uptime_percentage' AND monitor_name = '{{monitor_name}}' TIMERANGE {{timerange}} AGGREGATE avg(value)",
    promql: 'avg_over_time(up{job="{{monitor_name}}"}[{{interval}}]) * 100',
    defaultAggregation: "avg",
    supportedAggregations: ["avg", "min"],
    requiresInterval: false,
    defaultOptions: { unit: "%", decimals: 3 },
    variables: [
      {
        name: "monitor_name",
        label: "Monitor",
        type: "custom",
        required: false,
      },
    ],
  },

  // ── Table Templates ────────────────────────────────────────────
  {
    id: "table-metric-series",
    name: "Metric Series Table",
    description: "Tabular view of metric data with pagination",
    widgetType: "table",
    source: "metric",
    component: "DataTable",
    tfql: "FETCH metrics WHERE metric_name = '{{metric_name}}' TIMERANGE {{timerange}} ORDER BY timestamp DESC LIMIT 100",
    promql: "{{metric_name}}",
    defaultAggregation: "avg",
    supportedAggregations: ["avg", "sum", "min", "max", "count"],
    requiresInterval: false,
    defaultOptions: { legend: false },
    variables: [
      {
        name: "metric_name",
        label: "Metric Name",
        type: "metric_name",
        required: true,
      },
    ],
  },
  {
    id: "table-top-services",
    name: "Top Services Table",
    description: "Table of services sorted by request rate or error rate",
    widgetType: "table",
    source: "metric",
    component: "DataTable",
    tfql: "FETCH metrics WHERE metric_name = 'http_requests_total' TIMERANGE {{timerange}} AGGREGATE sum(value) GROUP BY service_name ORDER BY value DESC LIMIT 20",
    promql: "topk(20, sum by (service_name)(rate(http_requests_total[5m])))",
    defaultAggregation: "sum",
    supportedAggregations: ["sum", "avg", "count", "rate"],
    requiresInterval: false,
    defaultOptions: { legend: false },
    variables: [],
  },

  // ── Log Viewer Templates ───────────────────────────────────────
  {
    id: "logs-search",
    name: "Log Search",
    description: "Full-text log search with severity filter",
    widgetType: "logs",
    source: "log",
    component: "LogViewer",
    tfql: "FETCH logs WHERE body CONTAINS '{{query}}' AND severity_text >= '{{severity}}' TIMERANGE {{timerange}} ORDER BY timestamp DESC LIMIT 200",
    promql: "",
    defaultAggregation: "count",
    supportedAggregations: ["count"],
    requiresInterval: false,
    defaultOptions: {},
    variables: [
      {
        name: "query",
        label: "Search Query",
        type: "custom",
        required: false,
        defaultValue: "",
      },
      {
        name: "severity",
        label: "Min Severity",
        type: "severity",
        required: false,
        defaultValue: "INFO",
      },
    ],
  },
  {
    id: "logs-error-stream",
    name: "Error Log Stream",
    description: "Real-time stream of error and fatal logs",
    widgetType: "logs",
    source: "log",
    component: "LogViewer",
    tfql: "FETCH logs WHERE severity_text IN ('ERROR', 'FATAL') AND service_name = '{{service_name}}' TIMERANGE {{timerange}} ORDER BY timestamp DESC LIMIT 100",
    promql: "",
    defaultAggregation: "count",
    supportedAggregations: ["count"],
    requiresInterval: false,
    defaultOptions: {},
    variables: [
      {
        name: "service_name",
        label: "Service",
        type: "service_name",
        required: false,
      },
    ],
  },

  // ── Text Widget Templates ──────────────────────────────────────
  {
    id: "text-markdown",
    name: "Markdown Text",
    description: "Static markdown content panel",
    widgetType: "text",
    source: "metric",
    component: "TextWidget",
    tfql: "",
    promql: "",
    defaultAggregation: "count",
    supportedAggregations: [],
    requiresInterval: false,
    defaultOptions: {},
    variables: [],
  },
];

// ============================================
// Registry Lookup Functions
// ============================================

/**
 * Get all templates for a specific widget type.
 */
export function getTemplatesForWidget(widgetType: WidgetType): QueryTemplate[] {
  return QUERY_TEMPLATES.filter((t) => t.widgetType === widgetType);
}

/**
 * Get all templates for a specific signal source.
 */
export function getTemplatesForSource(source: SignalSource): QueryTemplate[] {
  return QUERY_TEMPLATES.filter((t) => t.source === source);
}

/**
 * Get a template by its unique ID.
 */
export function getTemplateById(id: string): QueryTemplate | undefined {
  return QUERY_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get the default template for a widget type.
 * Returns the first template registered for that type.
 */
export function getDefaultTemplate(
  widgetType: WidgetType,
): QueryTemplate | undefined {
  return QUERY_TEMPLATES.find((t) => t.widgetType === widgetType);
}

/**
 * Get the Vue component name for a widget type.
 */
export function getComponentForWidget(
  widgetType: WidgetType,
): ChartComponentName {
  const template = getDefaultTemplate(widgetType);
  return template?.component ?? "TimeSeriesChart";
}

// ============================================
// Query Builder from Template
// ============================================

export interface QueryBuildOptions {
  /** Template ID to use */
  templateId: string;
  /** Variable values to substitute */
  variables: Record<string, string>;
  /** Time range start (epoch ms) */
  start: number;
  /** Time range end (epoch ms) */
  end: number;
  /** Override aggregation function */
  aggregation?: AggregationFunction;
  /** Override interval */
  interval?: string;
  /** Preferred dialect */
  dialect?: "tfql" | "promql";
}

/**
 * Build a concrete query string from a template with variable substitution.
 */
export function buildQueryFromTemplate(options: QueryBuildOptions): string {
  const template = getTemplateById(options.templateId);
  if (!template) {
    throw new Error(`Query template not found: ${options.templateId}`);
  }

  const dialect = options.dialect ?? "tfql";
  let query = dialect === "tfql" ? template.tfql : template.promql;

  // Substitute variables
  for (const [key, value] of Object.entries(options.variables)) {
    query = query.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  // Substitute timerange
  const startIso = new Date(options.start).toISOString();
  const endIso = new Date(options.end).toISOString();
  query = query.replace("{{timerange}}", `${startIso} TO ${endIso}`);

  // Substitute interval
  const intervalRec = getIntervalForTimeRange(options.start, options.end);
  const interval = options.interval ?? intervalRec.interval;
  query = query.replace(/\{\{interval\}\}/g, interval);

  // Substitute aggregation if template uses the default
  if (
    options.aggregation &&
    options.aggregation !== template.defaultAggregation
  ) {
    query = query.replace(template.defaultAggregation, options.aggregation);
  }

  // Remove unfilled optional variables
  query = query.replace(/AND \w+ = '{{[^}]+}}'\s*/g, "");
  query = query.replace(/\{\{[^}]+\}\}/g, "");

  return query.replace(/\s+/g, " ").trim();
}

/**
 * Build a WidgetQuery from a template (for dashboard widget configuration).
 */
export function buildWidgetQuery(
  templateId: string,
  variables: Record<string, string>,
  legend?: string,
): WidgetQuery {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Query template not found: ${templateId}`);
  }

  let query = template.tfql;
  for (const [key, value] of Object.entries(variables)) {
    query = query.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  return {
    type: template.source,
    query,
    legend: legend ?? template.name,
  };
}

// ============================================
// Widget Type → Component Mapping
// ============================================

/**
 * Maps each WidgetType to its primary chart component import name.
 * Used by dashboard renderers to dynamically resolve components.
 */
export const WIDGET_COMPONENT_MAP: Record<WidgetType, ChartComponentName> = {
  timeseries: "TimeSeriesChart",
  stat: "StatPanel",
  gauge: "GaugeChart",
  bar: "BarChart",
  pie: "BarChart", // fallback: render pie as bar until PieChart is implemented
  heatmap: "HeatmapChart",
  table: "DataTable",
  logs: "LogViewer",
  traces: "ScatterChart",
  text: "TextWidget",
};

/**
 * Maps each WidgetType to whether it requires time-bucketed intervals.
 */
export const WIDGET_REQUIRES_INTERVAL: Record<WidgetType, boolean> = {
  timeseries: true,
  stat: false,
  gauge: false,
  bar: false,
  pie: false,
  heatmap: true,
  table: false,
  logs: false,
  traces: false,
  text: false,
};

/**
 * Maps each WidgetType to its recommended default grid size.
 */
export const WIDGET_DEFAULT_SIZES: Record<
  WidgetType,
  { w: number; h: number }
> = {
  timeseries: { w: 6, h: 4 },
  stat: { w: 2, h: 2 },
  gauge: { w: 2, h: 3 },
  bar: { w: 4, h: 4 },
  pie: { w: 3, h: 4 },
  heatmap: { w: 6, h: 4 },
  table: { w: 6, h: 4 },
  logs: { w: 12, h: 6 },
  traces: { w: 12, h: 6 },
  text: { w: 4, h: 2 },
};
