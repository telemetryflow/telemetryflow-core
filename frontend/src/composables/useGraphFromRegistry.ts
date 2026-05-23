/**
 * useGraphFromRegistry - Composable to render a graph from the registry
 *
 * Bridges the graph registry (graphId → definition with default queries)
 * to the useQueryPanel composable (mock/live query execution).
 *
 * Usage:
 *   const { definition, series, value, loading, refresh } = useGraphFromRegistry('HOM10005');
 */

import { computed, onMounted, readonly, ref, watch, type Ref } from "vue";
import { useQueryPanel, type QueryPanelResult } from "./useQueryPanel";
import {
  getGraphById,
  type GraphDefinition,
  type SignalType,
} from "@/constants/graph-registry";
import type { WidgetType, WidgetQuery } from "@/types/dashboard";
import type { SignalSource } from "@/utils/query-templates";
import type { ChartSeries } from "@/utils/telemetry";
import { useAppStore } from "@/store";

// ─── Signal Type Mapping ────────────────────────────────────────────────────────

const SIGNAL_TO_SOURCE: Record<SignalType, SignalSource> = {
  metrics: "metric",
  logs: "log",
  traces: "trace",
  exemplars: "trace",
  correlations: "metric",
  alerts: "metric",
  infrastructure: "metric",
  kubernetes: "metric",
  uptime: "metric",
  mixed: "metric",
};

// ─── Chart Type Mapping ─────────────────────────────────────────────────────────

type GraphChartType = GraphDefinition["chartType"];

const CHART_TO_WIDGET: Partial<Record<GraphChartType, WidgetType>> = {
  timeseries: "timeseries",
  bar: "bar",
  gauge: "gauge",
  stat: "stat",
  heatmap: "heatmap",
  scatter: "traces",
  text: "text",
};

function toWidgetType(chartType: GraphChartType): WidgetType {
  return CHART_TO_WIDGET[chartType] ?? "timeseries";
}

// ─── Options ────────────────────────────────────────────────────────────────────

export interface GraphFromRegistryOptions {
  /** Override time range start (epoch ms) */
  start?: Ref<number> | number;
  /** Override time range end (epoch ms) */
  end?: Ref<number> | number;
  /** Whether to auto-run queries on mount (default: true) */
  autoRun?: boolean;
}

// ─── Return Type ────────────────────────────────────────────────────────────────

export interface GraphFromRegistryResult {
  /** The full graph definition from the registry */
  definition: Readonly<GraphDefinition>;
  /** Merged chart series from all queries */
  series: Ref<ChartSeries[]>;
  /** Single value for stat/gauge widgets */
  value: Ref<number | null>;
  /** Whether any query is loading */
  loading: Ref<boolean>;
  /** First error from any query row (null if no errors) */
  error: Ref<string | null>;
  /** Re-run all queries */
  refresh: () => Promise<void>;
  /** Access to the underlying query panel for advanced use */
  panel: QueryPanelResult;
}

// ─── Composable ─────────────────────────────────────────────────────────────────

export function useGraphFromRegistry(
  graphId: string,
  options: GraphFromRegistryOptions = {},
): GraphFromRegistryResult {
  const definition = getGraphById(graphId);
  if (!definition) {
    throw new Error(
      `[useGraphFromRegistry] Graph "${graphId}" not found in registry`,
    );
  }

  const { autoRun = true } = options;

  // Convert defaultQueries → WidgetQuery[]
  const signalSource = SIGNAL_TO_SOURCE[definition.signalType];
  const hasMultipleQueries = definition.defaultQueries.filter(
    (q) => q.dialect !== "none" && q.expression.trim() !== "",
  ).length > 1;
  const initialQueries: WidgetQuery[] = definition.defaultQueries
    .filter((q) => q.dialect !== "none" && q.expression.trim() !== "")
    .map((q) => ({
      type: signalSource,
      query: q.expression,
      dialect:
        q.dialect === "clickhouse" ? "tfql" : (q.dialect as "tfql" | "promql"),
      legend: q.legend ?? (hasMultipleQueries ? "" : definition.title),
      legendFormat: q.legendFormat,
      seriesKey: q.seriesKey,
      enabled: true,
    }));

  // If no valid queries, add a default empty query so mock mode still works
  if (initialQueries.length === 0) {
    initialQueries.push({
      type: signalSource,
      query: definition.title,
      dialect: "promql",
      legend: definition.title,
      enabled: true,
    });
  }

  // ── Time Range: default to appStore.globalTimeRange ──────────────────────
  const appStore = useAppStore();

  const effectiveStart: Ref<number> | number =
    options.start !== undefined
      ? options.start
      : computed(() => appStore.globalTimeRange.start);

  const effectiveEnd: Ref<number> | number =
    options.end !== undefined
      ? options.end
      : computed(() => appStore.globalTimeRange.end);

  // Helper to read current time range value (reactive or static)
  const getStart = () => typeof effectiveStart === "number" ? effectiveStart : effectiveStart.value;
  const getEnd = () => typeof effectiveEnd === "number" ? effectiveEnd : effectiveEnd.value;

  // Initialize query panel with current time range
  const panel = useQueryPanel({
    widgetType: toWidgetType(definition.chartType),
    initialQueries,
    widgetTitle: definition.title,
    start: getStart(),
    end: getEnd(),
  });

  if (autoRun) {
    // Auto-run on mount (reads fresh time range values)
    onMounted(() => {
      panel.setTimeRange(getStart(), getEnd());
      panel.runAllQueries();
    });

    // Re-run when reactive time range changes
    if (typeof effectiveStart !== "number" || typeof effectiveEnd !== "number") {
      watch(
        () => appStore.globalTimeRange,
        ({ start, end }) => {
          const s = options.start !== undefined ? getStart() : start;
          const e = options.end !== undefined ? getEnd() : end;
          panel.setTimeRange(s, e);
          panel.runAllQueries();
        },
      );
    }
  }

  // Expose first error from any query row
  const error = computed(() => {
    const row = panel.rows.value.find((r) => r.error !== null);
    return row?.error ?? null;
  });

  return {
    definition: readonly(definition) as Readonly<GraphDefinition>,
    series: panel.mergedSeries,
    value: panel.mergedValue,
    loading: panel.loading,
    error,
    refresh: () => panel.runAllQueries(),
    panel,
  };
}
