/**
 * Reusable composable for fetching telemetry stats from ClickHouse.
 * Provides metric names, stats, metadata, and labels — auto-refreshing
 * when the global time range changes.
 *
 * Usage:
 *   const { metricNames, stats, loading, refresh } = useTelemetryStats();
 *   // or with options:
 *   const { metricNames, stats } = useTelemetryStats({ autoRefresh: true });
 */

import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { metricsApi } from "@/api";
import type { MetricStatsResponse } from "@/api/metrics";
import type { MetricMetadata } from "@/types";
import { useAppStore } from "@/store";

export interface TelemetryStatsOptions {
  /** Fetch on mount (default: true) */
  fetchOnMount?: boolean;
  /** Auto-refresh interval in ms (default: 0 = disabled) */
  autoRefreshMs?: number;
  /** Sync with global time range (default: true) */
  syncTimeRange?: boolean;
  /** Also fetch metadata (default: false) */
  fetchMetadata?: boolean;
  /** Also fetch labels (default: false) */
  fetchLabels?: boolean;
}

export function useTelemetryStats(options: TelemetryStatsOptions = {}) {
  const {
    fetchOnMount = true,
    autoRefreshMs = 0,
    syncTimeRange = true,
    fetchMetadata = false,
    fetchLabels = false,
  } = options;

  const appStore = useAppStore();

  // State
  const metricNames = ref<string[]>([]);
  const stats = ref<MetricStatsResponse>({
    totalMetrics: 0,
    totalDataPoints: 0,
    activeSeries: 0,
    avgRatePerMin: 0,
    prevDataPoints: undefined,
    prevActiveSeries: undefined,
    prevAvgRatePerMin: undefined,
  });
  const metadata = ref<MetricMetadata[]>([]);
  const labels = ref<{ labels: string[]; values: Record<string, string[]> }>({
    labels: [],
    values: {},
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const hasMetrics = computed(() => metricNames.value.length > 0);
  const totalMetrics = computed(() => metricNames.value.length);
  const dataPoints = computed(() => stats.value.totalDataPoints);
  const activeSeries = computed(() => stats.value.activeSeries);
  const avgRate = computed(() => stats.value.avgRatePerMin);

  // Previous period values for trend comparison
  const prevDataPoints = computed(() => stats.value.prevDataPoints ?? undefined);
  const prevActiveSeries = computed(() => stats.value.prevActiveSeries ?? undefined);
  const prevAvgRate = computed(() => stats.value.prevAvgRatePerMin ?? undefined);

  const filteredNames = computed(() => metricNames.value);

  // Timer
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Fetch all telemetry data (names + stats + optionally metadata/labels).
   */
  async function fetchAll(start?: number, end?: number) {
    loading.value = true;
    error.value = null;

    const s = start ?? appStore.globalTimeRange.start;
    const e = end ?? appStore.globalTimeRange.end;

    try {
      const promises: Promise<void>[] = [
        metricsApi.getMetricNames().then((names) => {
          metricNames.value = names;
        }),
        metricsApi.getStats(s, e).then((result) => {
          stats.value = result;
        }),
      ];

      if (fetchMetadata) {
        promises.push(
          metricsApi.getMetadata().then((result) => {
            metadata.value = result;
          }),
        );
      }

      if (fetchLabels) {
        promises.push(
          metricsApi.getLabels().then((result) => {
            labels.value = result;
          }),
        );
      }

      await Promise.all(promises);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch telemetry data";
      console.error("[useTelemetryStats]", error.value);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch only stats (lighter refresh).
   */
  async function fetchStats(start?: number, end?: number) {
    const s = start ?? appStore.globalTimeRange.start;
    const e = end ?? appStore.globalTimeRange.end;
    try {
      stats.value = await metricsApi.getStats(s, e);
    } catch (e) {
      console.error("[useTelemetryStats] fetchStats:", e);
    }
  }

  /**
   * Fetch only metric names.
   */
  async function fetchNames() {
    try {
      metricNames.value = await metricsApi.getMetricNames();
    } catch (e) {
      console.error("[useTelemetryStats] fetchNames:", e);
    }
  }

  /**
   * Full refresh — re-fetches everything.
   */
  async function refresh() {
    await fetchAll();
  }

  // Auto-refresh
  function startAutoRefresh() {
    if (autoRefreshMs > 0 && !refreshTimer) {
      refreshTimer = setInterval(() => fetchStats(), autoRefreshMs);
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
        const { start, end } = appStore.globalTimeRange;
        fetchStats(start, end);
      },
    );
  }

  // Lifecycle
  onMounted(() => {
    if (fetchOnMount) {
      fetchAll();
    }
    startAutoRefresh();
  });

  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    // State
    metricNames,
    stats,
    metadata,
    labels,
    loading,
    error,

    // Computed
    hasMetrics,
    totalMetrics,
    dataPoints,
    activeSeries,
    avgRate,
    prevDataPoints,
    prevActiveSeries,
    prevAvgRate,
    filteredNames,

    // Actions
    fetchAll,
    fetchStats,
    fetchNames,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
