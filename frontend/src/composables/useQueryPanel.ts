/**
 * useQueryPanel - Composable for managing multi-query panel state (Grafana-like)
 *
 * Orchestrates N query rows per panel, executes them independently,
 * and merges results into a single ChartSeries[] for rendering.
 *
 * Usage:
 *   const panel = useQueryPanel({
 *     widgetType: 'timeseries',
 *     initialQueries: widget.queries,
 *   });
 *   // panel.mergedSeries → chart data
 *   // panel.rows → per-row state (query text, loading, error, series)
 */

import { ref, computed, type Ref } from "vue";
import { config } from "@/config";
import {
  getTemplateById,
  getTemplatesForWidget,
  type QueryTemplate,
  type SignalSource,
} from "@/utils/query-templates";
import type { ChartSeries } from "@/utils/telemetry";
import type { WidgetType, WidgetQuery } from "@/types/dashboard";
import { collectorClient } from "@/api/collector";
import { COLLECTOR_ENDPOINTS } from "@/config/collector";
import { mockRowData } from "./useQueryPanel.mock";
import { useAppStore } from "@/store";

// ============================================
// Types
// ============================================

const QUERY_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const LABEL_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export interface QueryRowState {
  /** Letter label (A, B, C...) */
  label: string;
  /** Label badge color */
  color: string;
  /** Query text */
  query: string;
  /** Signal source type */
  queryType: SignalSource;
  /** Query dialect */
  dialect: "tfql" | "promql";
  /** Legend override */
  legend: string;
  /** Grafana-style legend format template (e.g. "{{namespace}}") */
  legendFormat: string;
  /** Label key(s) that split this query into N series */
  seriesKey: string;
  /** Whether this row is enabled */
  enabled: boolean;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Result series from this query */
  series: ChartSeries[];
  /** Single value result (for stat/gauge) */
  value: number | null;
  /** Linked template ID */
  templateId: string | null;
}

export interface QueryPanelOptions {
  /** Widget type determines template suggestions */
  widgetType: WidgetType;
  /** Initial queries from widget config */
  initialQueries?: WidgetQuery[];
  /** Time range start (epoch ms) */
  start?: number;
  /** Time range end (epoch ms) */
  end?: number;
  /** Widget title for series naming */
  widgetTitle?: string;
}

export interface QueryPanelResult {
  /** Per-row state */
  rows: Ref<QueryRowState[]>;
  /** Merged series from all enabled rows */
  mergedSeries: Ref<ChartSeries[]>;
  /** Single value for stat/gauge (from first enabled row) */
  mergedValue: Ref<number | null>;
  /** Whether any row is loading */
  loading: Ref<boolean>;
  /** Template suggestions for current widget type */
  templateSuggestions: Ref<QueryTemplate[]>;
  /** Add a new empty query row */
  addQuery: () => void;
  /** Remove a query row by index */
  removeQuery: (index: number) => void;
  /** Duplicate a query row */
  duplicateQuery: (index: number) => void;
  /** Toggle enabled/disabled */
  toggleQuery: (index: number) => void;
  /** Update query text */
  updateQueryText: (index: number, text: string) => void;
  /** Update query type (metric/log/trace) */
  updateQueryType: (index: number, type: SignalSource) => void;
  /** Update dialect */
  updateDialect: (index: number, dialect: "tfql" | "promql") => void;
  /** Update legend */
  updateLegend: (index: number, legend: string) => void;
  /** Apply a template to a row */
  applyTemplate: (index: number, templateId: string) => void;
  /** Run a single query by index */
  runQuery: (index: number) => Promise<void>;
  /** Run all enabled queries */
  runAllQueries: () => Promise<void>;
  /** Export current state as WidgetQuery[] for persistence */
  exportQueries: () => WidgetQuery[];
  /** Set time range */
  setTimeRange: (start: number, end: number) => void;
}

// ============================================
// API Response → ChartSeries Transformers
// ============================================

/**
 * Unwrap collectorClient response payload.
 * Handles both `{ status, data: T }` and double-wrapped `{ status, data: { data: T } }`.
 */
function extractResponseData(response: { status: string; data: any }): any {
  const payload = response.data;
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "data" in payload
  ) {
    return payload.data;
  }
  return payload;
}

/**
 * Convert GraphSeriesResult → ChartSeries[]
 * All /graph endpoints return { series: [{name, data: [[ts, val]]}], value }
 */
function graphSeriesToChart(data: any, legend: string): ChartSeries[] {
  if (!data) return [];

  const round4 = (pts: any[]) =>
    pts.map((pt: any) =>
      Array.isArray(pt) ? [pt[0], Math.round(pt[1] * 10000) / 10000] : pt,
    );

  // Standard GraphSeriesResult: { series: [...], value }
  if (data.series && Array.isArray(data.series)) {
    return data.series.map((s: any) => ({
      name: s.name || legend,
      data: Array.isArray(s.data) ? round4(s.data) : [],
    }));
  }

  // Fallback: data is already an array of series
  if (Array.isArray(data)) {
    return data.map((s: any, i: number) => {
      // Prometheus-like format: { metric, labels, values: [{timestamp, value}] }
      const name = s.name || s.metric || `${legend} ${i + 1}`;
      let points: [number, number][] = [];
      if (Array.isArray(s.data)) {
        points = round4(s.data);
      } else if (Array.isArray(s.values)) {
        points = round4(s.values.map((v: any) => [v.timestamp, v.value]));
      }
      return { name, data: points };
    });
  }

  return [];
}

// ============================================
// Log Severity Normalization (real data)
// ============================================

const SEVERITY_ORDER = ["trace", "debug", "info", "warn", "error", "fatal"];
const SEVERITY_COLORS: Record<string, string> = {
  trace: "#9ca3af",
  debug: "#3b82f6",
  info: "#22c55e",
  warn: "#f59e0b",
  error: "#ef4444",
  fatal: "#a855f7",
};

/**
 * Normalize log severity series: ensure all 6 levels present, correct order + colors.
 * Only transforms when series names match known severity levels.
 */
function normalizeSeveritySeries(series: ChartSeries[]): ChartSeries[] {
  const names = series.map((s) => s.name.toLowerCase());
  if (!names.some((n) => SEVERITY_ORDER.includes(n))) return series;

  const dataMap = new Map(series.map((s) => [s.name.toLowerCase(), s]));
  const now = Date.now();

  return SEVERITY_ORDER.map((level) => {
    const existing = dataMap.get(level);
    return {
      name: level.charAt(0).toUpperCase() + level.slice(1),
      data: existing?.data.length
        ? existing.data
        : ([[now, 0]] as [number, number][]),
      color: SEVERITY_COLORS[level],
    };
  });
}

// ============================================
// Query-to-DTO Parsing Helpers
// ============================================

/** Extract metric name from PromQL or TFQL expression */
function extractMetricName(query: string): string | undefined {
  // TFQL: metric_name = 'xxx'
  const tfqlMatch = query.match(/metric_name\s*=\s*'([^']+)'/);
  if (tfqlMatch) return tfqlMatch[1];

  // Metric name pattern: starts with letter, contains dots/underscores/alphanumeric, min 3 chars
  // Must contain a dot or underscore to distinguish from function names like "sum", "rate"
  const METRIC_RE = /([a-zA-Z][a-zA-Z0-9]*(?:[._][a-zA-Z0-9]+)+)/g;
  const FUNC_NAMES = new Set([
    "rate", "sum", "avg", "count", "min", "max", "increase", "delta",
    "histogram_quantile", "count_over_time", "by", "without",
  ]);

  // Find all metric-like tokens in the query (contain dot or underscore segments)
  const candidates: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = METRIC_RE.exec(query)) !== null) {
    const name = match[1];
    // Skip function names and PromQL keywords
    if (!FUNC_NAMES.has(name) && !FUNC_NAMES.has(name.toLowerCase())) {
      candidates.push(name);
    }
  }

  // Return the first valid metric name (innermost in nested expressions)
  if (candidates.length > 0) return candidates[0];

  // Fallback: simple name without dots (e.g., "up")
  const simpleMatch = query.match(/^([a-zA-Z_][a-zA-Z0-9_]+)/);
  if (simpleMatch && !FUNC_NAMES.has(simpleMatch[1])) {
    return simpleMatch[1];
  }

  // Last resort: first word-like token that isn't a function
  const wordMatch = query.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\{/);
  return wordMatch?.[1];
}

/**
 * Compute the optimal step (bucket size) in seconds from a time range.
 * Mirrors the backend's recommendedStep() logic so frontend and backend
 * use the same bucketing — aligned with the global interval setting.
 */
function computeStepSeconds(startMs: number, endMs: number): number {
  const durationMs = endMs - startMs;
  const durationMin = durationMs / 60_000;

  if (durationMin <= 5) return 10;        // 5m  → 10s buckets  (~30 points)
  if (durationMin <= 15) return 30;       // 15m → 30s buckets  (~30 points)
  if (durationMin <= 30) return 60;       // 30m → 1m  buckets  (~30 points)
  if (durationMin <= 60) return 60;       // 1h  → 1m  buckets  (~60 points)
  if (durationMin <= 180) return 300;     // 3h  → 5m  buckets  (~36 points)
  if (durationMin <= 360) return 300;     // 6h  → 5m  buckets  (~72 points)
  if (durationMin <= 720) return 900;     // 12h → 15m buckets  (~48 points)
  if (durationMin <= 1440) return 900;    // 24h → 15m buckets  (~96 points)
  if (durationMin <= 4320) return 3600;   // 3d  → 1h  buckets  (~72 points)
  if (durationMin <= 10080) return 3600;  // 7d  → 1h  buckets  (~168 points)
  if (durationMin <= 43200) return 21600; // 30d → 6h  buckets  (~120 points)
  return 86400;                           // 90d → 1d  buckets
}

/** Determine aggregation from query expression */
function extractAggregation(query: string): string {
  if (/quantile\(0\.99\)|p99/i.test(query)) return "p99";
  if (/quantile\(0\.95\)|p95/i.test(query)) return "p95";
  if (/quantile\(0\.9\b|p90/i.test(query)) return "p90";
  if (/quantile\(0\.75\)|p75/i.test(query)) return "p75";
  if (/quantile\(0\.5\b|p50/i.test(query)) return "p50";
  // Only match rate/sum/count/min/max as FUNCTION calls (with parenthesis),
  // not as part of metric names like k8s.pod.count or k8s.pod.restart_count
  if (/\brate\s*\(/i.test(query)) return "rate";
  if (/\bcount\s*\(|count_over_time/i.test(query)) return "count";
  if (/\bsum\s*\(/i.test(query)) return "sum";
  if (/\bmin\s*\(/i.test(query)) return "min";
  if (/\bmax\s*\(/i.test(query)) return "max";
  return "avg";
}

// ============================================
// Composable
// ============================================

export function useQueryPanel(options: QueryPanelOptions): QueryPanelResult {
  const timeStart = ref(options.start ?? Date.now() - 3600000);
  const timeEnd = ref(options.end ?? Date.now());

  // Initialize rows from existing queries or create a default one
  const initialRows: QueryRowState[] = (options.initialQueries ?? []).map(
    (q, i) => ({
      label: q.label ?? QUERY_LABELS[i] ?? String.fromCharCode(65 + i),
      color: LABEL_COLORS[i % LABEL_COLORS.length],
      query: q.query,
      queryType: q.type as SignalSource,
      dialect: q.dialect ?? "tfql",
      legend: q.legend ?? "",
      legendFormat: q.legendFormat ?? "",
      seriesKey: q.seriesKey ?? "",
      enabled: q.enabled !== false,
      loading: false,
      error: null,
      series: [],
      value: null,
      templateId: q.templateId ?? null,
    }),
  );

  if (initialRows.length === 0) {
    initialRows.push(createEmptyRow(0));
  }

  const rows = ref<QueryRowState[]>(initialRows);

  // Computed: merged series from all enabled rows, tagged with query origin
  const mergedSeries = computed<ChartSeries[]>(() => {
    return rows.value
      .filter((r) => r.enabled)
      .flatMap((r) =>
        r.series.map((s) => ({
          ...s,
          queryRef: s.queryRef || r.label,
          queryColor: s.queryColor || r.color,
        })),
      );
  });

  // Computed: merged value from first enabled row
  const mergedValue = computed<number | null>(() => {
    const first = rows.value.find((r) => r.enabled && r.value !== null);
    return first?.value ?? null;
  });

  // Computed: any loading
  const loading = computed(() => rows.value.some((r) => r.loading));

  // Computed: template suggestions
  const templateSuggestions = computed(() => {
    return getTemplatesForWidget(options.widgetType);
  });

  function createEmptyRow(index: number): QueryRowState {
    const defaultTemplate = getTemplatesForWidget(options.widgetType)[0];
    return {
      label: QUERY_LABELS[index] ?? String.fromCharCode(65 + index),
      color: LABEL_COLORS[index % LABEL_COLORS.length],
      query: defaultTemplate?.tfql ?? "",
      queryType: defaultTemplate?.source ?? "metric",
      dialect: "tfql",
      legend: "",
      legendFormat: "",
      seriesKey: "",
      enabled: true,
      loading: false,
      error: null,
      series: [],
      value: null,
      templateId: defaultTemplate?.id ?? null,
    };
  }

  function addQuery() {
    const index = rows.value.length;
    rows.value.push(createEmptyRow(index));
  }

  function removeQuery(index: number) {
    if (rows.value.length <= 1) return; // Keep at least one
    rows.value.splice(index, 1);
    // Re-assign labels
    rows.value.forEach((r, i) => {
      r.label = QUERY_LABELS[i] ?? String.fromCharCode(65 + i);
      r.color = LABEL_COLORS[i % LABEL_COLORS.length];
    });
  }

  function duplicateQuery(index: number) {
    const source = rows.value[index];
    if (!source) return;
    const newIndex = rows.value.length;
    rows.value.push({
      ...JSON.parse(JSON.stringify(source)),
      label: QUERY_LABELS[newIndex] ?? String.fromCharCode(65 + newIndex),
      color: LABEL_COLORS[newIndex % LABEL_COLORS.length],
      loading: false,
      error: null,
      series: [],
      value: null,
    });
  }

  function toggleQuery(index: number) {
    const row = rows.value[index];
    if (row) {
      row.enabled = !row.enabled;
    }
  }

  function updateQueryText(index: number, text: string) {
    const row = rows.value[index];
    if (row) {
      row.query = text;
      row.templateId = null; // Unlink template on manual edit
    }
  }

  function updateQueryType(index: number, type: SignalSource) {
    const row = rows.value[index];
    if (row) {
      row.queryType = type;
    }
  }

  function updateDialect(index: number, dialect: "tfql" | "promql") {
    const row = rows.value[index];
    if (!row) return;

    // If linked to a template, switch the query text to the other dialect
    if (row.templateId) {
      const tmpl = getTemplateById(row.templateId);
      if (tmpl) {
        row.query = dialect === "tfql" ? tmpl.tfql : tmpl.promql;
      }
    }
    row.dialect = dialect;
  }

  function updateLegend(index: number, legend: string) {
    const row = rows.value[index];
    if (row) {
      row.legend = legend;
    }
  }

  function applyTemplate(index: number, templateId: string) {
    const row = rows.value[index];
    const tmpl = getTemplateById(templateId);
    if (!row || !tmpl) return;

    row.templateId = templateId;
    row.query = row.dialect === "tfql" ? tmpl.tfql : tmpl.promql;
    row.queryType = tmpl.source;
    row.legend = tmpl.name;
  }

  async function runQuery(index: number) {
    const row = rows.value[index];
    if (!row || !row.enabled) return;

    row.loading = true;
    row.error = null;

    try {
      if (config.useMock) {
        // Mock mode
        await new Promise((resolve) =>
          setTimeout(resolve, 150 + Math.random() * 250),
        );
        const mock = mockRowData(
          row,
          options.widgetType,
          timeStart.value,
          timeEnd.value,
          options.widgetTitle,
          rows.value.filter((r) => r.enabled).length, // Pass enabled query count
        );
        row.series = mock.series;
        row.value = mock.value;
      } else {
        // ── Real API mode ──
        // All /graph endpoints are GET with from/to query params.
        // Response: { series: [{name, data: [[ts,val]]}], value }
        const start = timeStart.value;
        const end = timeEnd.value;
        const q = row.query;

        // Calculate step from time range for consistent bucketing with backend
        const appStore = useAppStore();
        const stepSeconds = computeStepSeconds(start, end);

        const params: Record<string, string> = {
          from: String(start),
          to: String(end),
          step: String(stepSeconds),
        };

        // Pass timezone for correct time bucket boundaries
        const tz = appStore.chartTimezone;
        if (tz && tz !== "UTC") {
          params.timezone = tz;
        }

        let endpoint: string;

        if (row.queryType === "metric") {
          const metricName = extractMetricName(q);
          const aggregation = extractAggregation(q);
          if (metricName) params.metricName = metricName;

          // Extract groupBy from TFQL "by (...)" clause
          const groupByMatch = q.match(/\bby\s*\(([^)]+)\)/i);
          if (groupByMatch) {
            params.groupBy = groupByMatch[1].trim().split(/\s*,\s*/)[0];
          }

          const isPercentile = /^p\d\d$/.test(aggregation);
          if (isPercentile) {
            // Percentile queries → use /graph/percentiles endpoint
            endpoint = COLLECTOR_ENDPOINTS.METRICS_GRAPH_PERCENTILES;
          } else {
            params.aggregation = aggregation;
            endpoint = COLLECTOR_ENDPOINTS.METRICS_GRAPH;
          }
        } else if (row.queryType === "log") {
          const groupByMatch = q.match(/\bBY\s+(\w+)/i);
          params.groupBy = groupByMatch?.[1] || "severity_text";
          endpoint = COLLECTOR_ENDPOINTS.LOGS_GRAPH;
        } else {
          // Traces
          const isErrorRate = /\berror_rate\b/i.test(q);
          if (isErrorRate) {
            params.aggregation = "error_rate";
          }
          // Don't pass statusCode filter for error_rate (backend needs all statuses)
          if (!isErrorRate) {
            const statusMatch = q.match(
              /status_code\s*=\s*'(ERROR|OK|UNSET)'/i,
            );
            if (statusMatch) params.statusCode = statusMatch[1].toUpperCase();
          }
          const serviceMatch = q.match(/service_name\s*=\s*'([^']+)'/);
          if (serviceMatch) params.serviceName = serviceMatch[1];
          const isLatency = /duration|latency/i.test(q);
          endpoint = isLatency
            ? COLLECTOR_ENDPOINTS.TRACES_GRAPH_LATENCY
            : COLLECTOR_ENDPOINTS.TRACES_GRAPH;
        }

        const response = await collectorClient.get<any>(endpoint, { params });
        const payload = extractResponseData(response);
        let chartSeries = graphSeriesToChart(payload, row.legend || row.label);

        // Log queries: normalize to all 6 severity levels with colors
        if (row.queryType === "log") {
          chartSeries = normalizeSeveritySeries(chartSeries);
        }

        // Latency endpoint returns multi-series (p50/p75/p90/p95/p99/avg) — uppercase names
        if (endpoint === COLLECTOR_ENDPOINTS.TRACES_GRAPH_LATENCY) {
          chartSeries = chartSeries.map((s) => ({
            ...s,
            name: s.name.toUpperCase(),
          }));
        }

        // Percentile endpoint returns all 6 series (p50-p99+avg) — filter to requested one
        if (
          endpoint === COLLECTOR_ENDPOINTS.METRICS_GRAPH_PERCENTILES &&
          chartSeries.length > 1
        ) {
          const agg = extractAggregation(q);
          const match = chartSeries.find(
            (s) => s.name.toLowerCase() === agg.toLowerCase(),
          );
          if (match) {
            chartSeries = [{ ...match, name: row.legend || match.name }];
          }
        }

        row.series = chartSeries;

        // Extract single value for stat/gauge widgets
        if (
          row.series.length > 0 &&
          (options.widgetType === "stat" || options.widgetType === "gauge")
        ) {
          const lastPoints = row.series[0].data;
          const raw =
            lastPoints.length > 0 ? lastPoints[lastPoints.length - 1][1] : null;
          row.value = raw !== null ? Math.round(raw * 10000) / 10000 : null;
        }

        if (
          row.series.length === 0 ||
          row.series.every((s) => s.data.length === 0)
        ) {
          row.error = "No data returned";
        }
      }
    } catch (err) {
      // API failed — show error, NO mock fallback
      console.error(
        `[useQueryPanel] API failed for "${row.query}":`,
        err instanceof Error ? err.message : err,
      );
      row.error = err instanceof Error ? err.message : "Query failed";
      row.series = [];
      row.value = null;
    } finally {
      row.loading = false;
    }
  }

  async function runAllQueries() {
    const enabledIndexes = rows.value
      .map((r, i) => (r.enabled ? i : -1))
      .filter((i) => i >= 0);

    await Promise.all(enabledIndexes.map((i) => runQuery(i)));
  }

  function exportQueries(): WidgetQuery[] {
    return rows.value.map((r) => ({
      type: r.queryType,
      query: r.query,
      legend: r.legend || undefined,
      legendFormat: r.legendFormat || undefined,
      seriesKey: r.seriesKey || undefined,
      label: r.label,
      dialect: r.dialect,
      templateId: r.templateId ?? undefined,
      enabled: r.enabled,
    }));
  }

  function setTimeRange(start: number, end: number) {
    timeStart.value = start;
    timeEnd.value = end;
  }

  return {
    rows: rows as Ref<QueryRowState[]>,
    mergedSeries,
    mergedValue,
    loading,
    templateSuggestions,
    addQuery,
    removeQuery,
    duplicateQuery,
    toggleQuery,
    updateQueryText,
    updateQueryType,
    updateDialect,
    updateLegend,
    applyTemplate,
    runQuery,
    runAllQueries,
    exportQueries,
    setTimeRange,
  };
}

export { QUERY_LABELS, LABEL_COLORS };
export default useQueryPanel;
