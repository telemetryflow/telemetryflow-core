/**
 * useTelemetryGraph — Reusable composable for time-series graph data from ClickHouse.
 *
 * Fetches pre-bucketed time-series data from the backend /graph endpoints
 * and returns ChartSeries[] ready for any chart component (TimeSeriesChart,
 * BarChart, GaugeChart, StatPanel, etc.).
 *
 * Supports all 3 signal types (metrics, logs, traces) and auto-syncs
 * with the global time range.
 *
 * Usage (simple):
 *   const { series, loading, refresh } = useTelemetryGraph({ signal: "metrics" });
 *   <TimeSeriesChart :series="chartData" />
 *
 * Usage (with filters):
 *   const { series, value, loading } = useTelemetryGraph({
 *     signal: "logs",
 *     groupBy: "severity_text",
 *     filters: { serviceName: "api-gateway" },
 *   });
 *
 * Usage (traces latency percentiles):
 *   const { series, loading } = useTelemetryGraph({
 *     signal: "traces",
 *     queryType: "latency",
 *     filters: { serviceName: "order-service" },
 *   });
 */

import { ref, computed, watch, onMounted, onUnmounted, type Ref, type ComputedRef } from "vue";
import { collectorClient } from "@/api/collector";
import { COLLECTOR_ENDPOINTS } from "@/config/collector";
import { config } from "@/config";
import { useAppStore } from "@/store";
import { type ChartSeries } from "@/utils/telemetry";
import { mockGraphData } from "./useTelemetryGraph.mock";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type GraphSignalType = "metrics" | "logs" | "traces" | "exemplars";

export type GraphAggregation =
  | "avg"
  | "sum"
  | "min"
  | "max"
  | "count"
  | "rate"
  | "p50"
  | "p75"
  | "p90"
  | "p95"
  | "p99";

export type GraphQueryType = "series" | "latency" | "percentiles" | "stat";

export interface TelemetryGraphFilters {
  metricName?: string;
  metricNames?: string[];
  serviceName?: string;
  severity?: string;
  query?: string;
  spanName?: string;
  statusCode?: string;
  minDurationMs?: number;
  maxDurationMs?: number;
}

export interface UseTelemetryGraphOptions {
  /** Signal type */
  signal: GraphSignalType;
  /** Query type: "series" (default), "latency" (traces p50/p95/p99), "stat" (single value) */
  queryType?: GraphQueryType;
  /** Group by field (e.g., "service_name", "severity_text", "metric_name") */
  groupBy?: string;
  /** Aggregation function (default: "avg" for metrics, "count" for logs/traces) */
  aggregation?: GraphAggregation;
  /** Bucket interval in seconds (auto-calculated if omitted) */
  stepSeconds?: number;
  /** Signal-specific filters */
  filters?: TelemetryGraphFilters;
  /** Fetch on mount (default: true) */
  fetchOnMount?: boolean;
  /** Sync with global time range (default: true) */
  syncTimeRange?: boolean;
  /** Auto-refresh interval in ms (default: 0 = disabled) */
  autoRefreshMs?: number;
}

export interface UseTelemetryGraphReturn {
  /** Chart series data — ready for TimeSeriesChart/BarChart */
  series: Ref<ChartSeries[]>;
  /** Single aggregate value — for StatPanel/GaugeChart */
  value: Ref<number | null>;
  /** Loading state */
  loading: Ref<boolean>;
  /** Error message */
  error: Ref<string | null>;
  /** Whether data exists */
  hasSeries: ComputedRef<boolean>;
  /** Fetch graph data */
  fetch: (startMs?: number, endMs?: number) => Promise<void>;
  /** Alias for fetch */
  refresh: () => Promise<void>;
}

// ─── Signal → Endpoint Map ──────────────────────────────────────────────────────

const SIGNAL_GRAPH_ENDPOINTS: Record<GraphSignalType, string> = {
  metrics: COLLECTOR_ENDPOINTS.METRICS_GRAPH,
  logs: COLLECTOR_ENDPOINTS.LOGS_GRAPH,
  traces: COLLECTOR_ENDPOINTS.TRACES_GRAPH,
  exemplars: COLLECTOR_ENDPOINTS.EXEMPLARS_GRAPH,
};

// ─── Composable ─────────────────────────────────────────────────────────────────

export function useTelemetryGraph(
  options: UseTelemetryGraphOptions,
): UseTelemetryGraphReturn {
  const {
    signal,
    queryType = "series",
    groupBy,
    aggregation,
    stepSeconds,
    filters = {},
    fetchOnMount = true,
    syncTimeRange = true,
    autoRefreshMs = 0,
  } = options;

  const appStore = useAppStore();

  // State
  const series = ref<ChartSeries[]>([]);
  const value = ref<number | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const hasSeries = computed(() => series.value.length > 0);

  // Timer
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Fetch graph data from backend.
   */
  async function fetchGraph(startMs?: number, endMs?: number): Promise<void> {
    const s = startMs ?? appStore.globalTimeRange.start;
    const e = endMs ?? appStore.globalTimeRange.end;

    loading.value = true;
    error.value = null;

    try {
      if (config.useMock) {
        const mock = await mockGraphData(
          { signal, queryType, groupBy, filters },
          s,
          e,
        );
        series.value = mock.series;
        value.value = mock.value;
        return;
      }

      // Determine endpoint
      let endpoint: string;
      if (queryType === "latency" && signal === "traces") {
        endpoint = COLLECTOR_ENDPOINTS.TRACES_GRAPH_LATENCY;
      } else if (queryType === "percentiles" && signal === "metrics") {
        endpoint = COLLECTOR_ENDPOINTS.METRICS_GRAPH_PERCENTILES;
      } else {
        endpoint = SIGNAL_GRAPH_ENDPOINTS[signal];
      }

      // Build query string
      const qs = new URLSearchParams();
      qs.append("from", String(s));
      qs.append("to", String(e));
      if (stepSeconds) qs.append("step", String(stepSeconds));
      if (groupBy) qs.append("groupBy", groupBy);
      if (aggregation) qs.append("aggregation", aggregation);

      // Signal-specific filters
      if (filters.metricName) qs.append("metricName", filters.metricName);
      if (filters.serviceName) qs.append("serviceName", filters.serviceName);
      if (filters.severity) qs.append("severity", filters.severity);
      if (filters.query) qs.append("query", filters.query);
      if (filters.spanName) qs.append("spanName", filters.spanName);
      if (filters.statusCode) qs.append("statusCode", filters.statusCode);
      if (filters.minDurationMs) qs.append("minDurationMs", String(filters.minDurationMs));
      if (filters.maxDurationMs) qs.append("maxDurationMs", String(filters.maxDurationMs));

      const response = await collectorClient.get<any>(`${endpoint}?${qs.toString()}`);
      const payload = response.data;
      const graphData = payload?.data || payload;

      // Parse backend GraphSeriesResult → ChartSeries[]
      if (graphData?.series && Array.isArray(graphData.series)) {
        series.value = graphData.series.map((s: any) => ({
          name: s.name || "unknown",
          data: Array.isArray(s.data) ? s.data : [],
        }));
      } else {
        series.value = [];
      }

      value.value = graphData?.value ?? null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      series.value = [];
      value.value = null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Refresh alias.
   */
  async function refresh(): Promise<void> {
    await fetchGraph();
  }

  // Auto-refresh
  function startAutoRefresh() {
    if (autoRefreshMs > 0 && !refreshTimer) {
      refreshTimer = setInterval(() => fetchGraph(), autoRefreshMs);
    }
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // Sync with global time range
  if (syncTimeRange) {
    watch(
      () => appStore.globalTimeRange,
      () => {
        fetchGraph();
      },
    );
  }

  // Lifecycle
  onMounted(() => {
    if (fetchOnMount) {
      fetchGraph();
    }
    startAutoRefresh();
  });

  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    series,
    value,
    loading,
    error,
    hasSeries,
    fetch: fetchGraph,
    refresh,
  };
}
