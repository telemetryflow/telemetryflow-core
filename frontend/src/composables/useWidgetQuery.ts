/**
 * useWidgetQuery - Composable for executing query templates and piping results to chart components
 *
 * Bridges the query template registry with chart components:
 * 1. Resolves a QueryTemplate by ID
 * 2. Builds TFQL/PromQL query with variable substitution
 * 3. Fetches data from API (or generates mock data when config.useMock)
 * 4. Returns reactive, chart-ready series data
 *
 * Usage:
 *   const { series, loading, error, refresh } = useWidgetQuery({
 *     templateId: 'timeseries-metric-rate',
 *     variables: { metric_name: 'http_requests_total', service_name: 'api-gateway' },
 *     start: Date.now() - 3600000,
 *     end: Date.now(),
 *   });
 */

import { ref, computed, watch, onUnmounted, type Ref } from "vue";
import { config } from "@/config";
import {
  getTemplateById,
  buildQueryFromTemplate,
  getIntervalForTimeRange,
  type QueryTemplate,
  type AggregationFunction,
} from "@/utils/query-templates";
import { type ChartSeries } from "@/utils/telemetry";
import { mockWidgetSeries, mockWidgetValue } from "./useWidgetQuery.mock";

// ============================================
// Types
// ============================================

export interface WidgetQueryOptions {
  /** Query template ID from the registry */
  templateId: string;
  /** Variable substitution values */
  variables?: Record<string, string>;
  /** Time range start (epoch ms) */
  start: number;
  /** Time range end (epoch ms) */
  end: number;
  /** Override aggregation function */
  aggregation?: AggregationFunction;
  /** Override interval string (e.g., '5m', '1h') */
  interval?: string;
  /** Preferred dialect */
  dialect?: "tfql" | "promql";
  /** Auto-refresh interval in ms (0 = disabled) */
  refreshInterval?: number;
  /** Whether to fetch immediately on mount */
  immediate?: boolean;
}

export interface WidgetQueryResult {
  /** Chart-ready series data */
  series: Ref<ChartSeries[]>;
  /** Single value for stat/gauge widgets */
  value: Ref<number | null>;
  /** Loading state */
  loading: Ref<boolean>;
  /** Error message */
  error: Ref<string | null>;
  /** The resolved query template */
  template: Ref<QueryTemplate | null>;
  /** The built query string */
  query: Ref<string>;
  /** Recommended interval for the time range */
  recommendedInterval: Ref<string>;
  /** Refresh data manually */
  refresh: () => Promise<void>;
  /** Stop auto-refresh */
  stop: () => void;
}

// ============================================
// Composable
// ============================================

export function useWidgetQuery(options: WidgetQueryOptions): WidgetQueryResult {
  const series = ref<ChartSeries[]>([]);
  const value = ref<number | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const template = ref<QueryTemplate | null>(null);
  const query = ref("");
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  const recommendedInterval = computed(() => {
    return getIntervalForTimeRange(options.start, options.end).interval;
  });

  async function fetchData() {
    loading.value = true;
    error.value = null;

    try {
      const tmpl = getTemplateById(options.templateId);
      if (!tmpl) {
        throw new Error(`Query template not found: ${options.templateId}`);
      }
      template.value = tmpl;

      // Build the query string
      query.value = buildQueryFromTemplate({
        templateId: options.templateId,
        variables: options.variables ?? {},
        start: options.start,
        end: options.end,
        aggregation: options.aggregation,
        interval: options.interval,
        dialect: options.dialect,
      });

      if (config.useMock) {
        // Mock mode: generate synthetic data
        await new Promise((resolve) =>
          setTimeout(resolve, 200 + Math.random() * 300),
        );
        series.value = mockWidgetSeries(
          tmpl,
          options.variables ?? {},
          options.start,
          options.end,
        );
        if (tmpl.widgetType === "stat" || tmpl.widgetType === "gauge") {
          value.value = mockWidgetValue(tmpl);
        }
      } else {
        // Real API mode: POST to query endpoint
        const response = await fetch(
          `${config.apiUrl}/api/v2/query/signals/${tmpl.source === "metric" ? "metrics" : tmpl.source === "log" ? "logs" : "traces"}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(config.apiKey
                ? { [config.apiKeyHeader]: config.apiKey }
                : {}),
            },
            body: JSON.stringify({
              query: query.value,
              from: new Date(options.start).toISOString(),
              to: new Date(options.end).toISOString(),
              pagination: { page: 1, limit: config.limitData },
            }),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Query failed: ${response.status} ${response.statusText}`,
          );
        }

        const result = await response.json();

        // Transform API response to ChartSeries format
        if (Array.isArray(result.data)) {
          series.value = transformApiResponseToSeries(result.data, tmpl);
          if (tmpl.widgetType === "stat" || tmpl.widgetType === "gauge") {
            value.value = result.data[0]?.value ?? null;
          }
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
  }

  function stop() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // Start auto-refresh if configured
  if (options.refreshInterval && options.refreshInterval > 0) {
    refreshTimer = setInterval(fetchData, options.refreshInterval);
  }

  // Fetch immediately if requested (default: true)
  if (options.immediate !== false) {
    fetchData();
  }

  onUnmounted(stop);

  return {
    series: series as Ref<ChartSeries[]>,
    value,
    loading,
    error,
    template: template as Ref<QueryTemplate | null>,
    query,
    recommendedInterval,
    refresh: fetchData,
    stop,
  };
}

// ============================================
// API Response Transformer
// ============================================

interface ApiDataPoint {
  timestamp?: string | number;
  time_bucket?: string | number;
  value?: number;
  count?: number;
  [key: string]: unknown;
}

function transformApiResponseToSeries(
  data: ApiDataPoint[],
  template: QueryTemplate,
): ChartSeries[] {
  if (!data.length) return [];

  // Group data by series key (e.g., service_name, severity_text)
  const seriesMap = new Map<string, Array<[number, number]>>();

  for (const point of data) {
    const timestamp =
      typeof point.timestamp === "string"
        ? new Date(point.timestamp + "Z").getTime()
        : typeof point.time_bucket === "string"
          ? new Date(point.time_bucket + "Z").getTime()
          : ((point.timestamp as number) ?? Date.now());

    const value = point.value ?? point.count ?? 0;

    // Determine series key from group-by fields
    const seriesKey =
      (point.service_name as string) ??
      (point.severity_text as string) ??
      (point.host_name as string) ??
      template.name;

    if (!seriesMap.has(seriesKey)) {
      seriesMap.set(seriesKey, []);
    }
    seriesMap.get(seriesKey)!.push([timestamp, value as number]);
  }

  return Array.from(seriesMap.entries()).map(([name, points]) => ({
    name,
    data: points.sort((a, b) => a[0] - b[0]),
  }));
}

export default useWidgetQuery;
