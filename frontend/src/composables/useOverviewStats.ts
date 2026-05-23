/**
 * useOverviewStats — Reusable composable for fetching all overview stat panel
 * values from real ClickHouse-backed endpoints.
 *
 * Provides:
 *  - totalMetrics   (from /api/v2/telemetry/metrics/stats)
 *  - totalLogs      (from /api/v2/telemetry/logs/stats)
 *  - totalTraces    (from /api/v2/telemetry/traces/stats)
 *  - activeAlerts   (from /api/v2/alert-instances/stats)
 *
 * Each value includes previous-period comparison for real trend calculations.
 * Auto-syncs with globalTimeRange.
 *
 * Usage:
 *   const stats = useOverviewStats();
 *   // stats.totalMetrics.value  → 21
 *   // stats.totalLogs.value     → 19432
 *   // stats.logsTrend.value     → { direction: 'down', value: '-14%', suffix: 'vs 1h ago' }
 */

import { ref, computed, watch, onMounted, type ComputedRef, type Ref } from "vue";
import { metricsApi } from "@/api/metrics";
import { logsApi } from "@/api/logs";
import { tracesApi } from "@/api/traces";
import { alertingApi } from "@/api/alerting";
import type { MetricStatsResponse } from "@/api/metrics";
import type { LogStatsResponse } from "@/api/logs";
import type { TraceStatsResponse } from "@/api/traces";
import type { AlertStatsResponse } from "@/api/alerting";
import { useAppStore, useAlertsStore } from "@/store";
import {
  calculateTrend,
  buildTrendConfig,
  getTrendComparisonSuffix,
} from "@/utils";
import type { StatPanelTrendInfo } from "@/composables/useStatPanelsFromRegistry";

export interface UseOverviewStatsReturn {
  // Headline values (Row 1)
  totalMetrics: ComputedRef<number>;
  totalLogs: ComputedRef<number>;
  totalTraces: ComputedRef<number>;
  activeAlerts: ComputedRef<number>;

  // Detail values (Row 2)
  serviceCount: ComputedRef<number>;
  errorRate: ComputedRef<number>;
  avgLatency: ComputedRef<number>;
  logErrors: ComputedRef<number>;

  // Trend info for stat panels (undefined when no data → hides trend display)
  logsTrendInfo: ComputedRef<StatPanelTrendInfo | undefined>;
  tracesTrendInfo: ComputedRef<StatPanelTrendInfo | undefined>;

  // Loading & error
  loading: Ref<boolean>;
  error: Ref<string | null>;

  // Manual refresh
  refresh: () => Promise<void>;
}

export function useOverviewStats(): UseOverviewStatsReturn {
  const appStore = useAppStore();
  const alertsStore = useAlertsStore();

  // Raw stats from each endpoint
  const metricsStats = ref<MetricStatsResponse>({
    totalMetrics: 0,
    totalDataPoints: 0,
    activeSeries: 0,
    avgRatePerMin: 0,
  });
  const logsStats = ref<LogStatsResponse>({
    totalLogs: 0,
    errorCount: 0,
    warnCount: 0,
    serviceCount: 0,
    avgRatePerMin: 0,
    byService: {},
    bySeverity: {},
  });
  const prevLogsStats = ref<LogStatsResponse>({
    totalLogs: 0,
    errorCount: 0,
    warnCount: 0,
    serviceCount: 0,
    avgRatePerMin: 0,
    byService: {},
    bySeverity: {},
  });
  const tracesStats = ref<TraceStatsResponse>({
    totalTraces: 0,
    errorCount: 0,
    avgDurationMs: 0,
    serviceCount: 0,
  });
  const prevTracesStats = ref<TraceStatsResponse>({
    totalTraces: 0,
    errorCount: 0,
    avgDurationMs: 0,
    serviceCount: 0,
  });
  const alertStats = ref<AlertStatsResponse>({
    total: 0,
    firing: 0,
    acknowledged: 0,
    resolved: 0,
    silenced: 0,
    bySeverity: { critical: 0, warning: 0, info: 0 },
  });

  const loading = ref(false);
  const error = ref<string | null>(null);

  // Headline computed values (Row 1)
  const totalMetrics = computed(() => metricsStats.value.totalMetrics);
  const totalLogs = computed(() => logsStats.value.totalLogs);
  const totalTraces = computed(() => tracesStats.value.totalTraces);

  // Active alerts: store-first (same source as Alerts datatable), API as fallback.
  // The Alerts view populates alertsStore with addAlert() — that's what the user sees.
  const activeAlerts = computed(() => {
    const storeCount = alertsStore.activeAlerts.length;
    if (storeCount > 0) return storeCount;
    // Fallback: use /alert-instances/stats endpoint (backend PostgreSQL count)
    return alertStats.value.firing;
  });

  // Detail computed values (Row 2)
  const serviceCount = computed(() => tracesStats.value.serviceCount);
  const errorRate = computed(() => {
    const total = Number(tracesStats.value.totalTraces) || 0;
    const errors = Number(tracesStats.value.errorCount) || 0;
    if (total === 0) return 0;
    const rate = Math.round((errors / total) * 1000) / 10; // 1 decimal %
    if (!isFinite(rate)) return 0;
    return Math.min(rate, 100); // Clamp to 100% max
  });
  const avgLatency = computed(() => tracesStats.value.avgDurationMs);
  const logErrors = computed(() => logsStats.value.errorCount);

  // Trend info from real previous-period comparison
  // Returns undefined when both current & previous are 0 (no data → hide trend)
  const logsTrendInfo = computed<StatPanelTrendInfo | undefined>(() => {
    const current = logsStats.value.totalLogs;
    const previous = prevLogsStats.value.totalLogs;
    if (current === 0 && previous === 0) return undefined;
    const { start, end } = appStore.globalTimeRange;
    const trend = calculateTrend(current, previous);
    const cfg = buildTrendConfig(trend, getTrendComparisonSuffix(start, end));
    return { trend: cfg.direction, trendValue: cfg.value, trendSuffix: cfg.suffix };
  });

  const tracesTrendInfo = computed<StatPanelTrendInfo | undefined>(() => {
    const current = tracesStats.value.totalTraces;
    const previous = prevTracesStats.value.totalTraces;
    if (current === 0 && previous === 0) return undefined;
    const { start, end } = appStore.globalTimeRange;
    const trend = calculateTrend(current, previous);
    const cfg = buildTrendConfig(trend, getTrendComparisonSuffix(start, end));
    return { trend: cfg.direction, trendValue: cfg.value, trendSuffix: cfg.suffix };
  });

  /**
   * Fetch all stats for current and previous period in parallel.
   */
  async function fetchAll(start?: number, end?: number) {
    const s = start ?? appStore.globalTimeRange.start;
    const e = end ?? appStore.globalTimeRange.end;
    const duration = e - s;

    loading.value = true;
    error.value = null;

    try {
      const [metrics, logs, prevLogs, traces, prevTraces, alerts] = await Promise.allSettled([
        metricsApi.getStats(s, e),
        logsApi.getStats(s, e),
        logsApi.getStats(s - duration, s),
        tracesApi.getStats(s, e),
        tracesApi.getStats(s - duration, s),
        alertingApi.getStats(),
      ]);

      if (metrics.status === "fulfilled") metricsStats.value = metrics.value;
      if (logs.status === "fulfilled") logsStats.value = logs.value;
      if (prevLogs.status === "fulfilled") prevLogsStats.value = prevLogs.value;
      if (traces.status === "fulfilled") tracesStats.value = traces.value;
      if (prevTraces.status === "fulfilled") prevTracesStats.value = prevTraces.value;
      if (alerts.status === "fulfilled") alertStats.value = alerts.value;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch overview stats";
      console.error("[useOverviewStats]", error.value);
    } finally {
      loading.value = false;
    }
  }

  // Auto-sync with global time range
  watch(
    () => appStore.globalTimeRange,
    ({ start, end }) => {
      fetchAll(start, end);
    },
  );

  // Fetch on mount
  onMounted(() => {
    fetchAll();
  });

  return {
    totalMetrics,
    totalLogs,
    totalTraces,
    activeAlerts,
    serviceCount,
    errorRate,
    avgLatency,
    logErrors,
    logsTrendInfo,
    tracesTrendInfo,
    loading,
    error,
    refresh: fetchAll,
  };
}
