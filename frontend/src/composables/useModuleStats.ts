/**
 * Base composable for module statistics
 * Provides standardized stats fetching, loading states, and auto-refresh
 */

import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  type Ref,
  type ComputedRef,
} from "vue";
import type {
  BaseStatistics,
  StatsQueryParams,
  TimeRangeParams,
} from "@/types/statistics";
import type { StatPanelConfig } from "@/utils/stat-panel";
import { useAppStore } from "@/store";

export interface UseModuleStatsOptions<T extends BaseStatistics> {
  /** API function to fetch stats */
  fetchFn: (params?: StatsQueryParams) => Promise<T>;
  /** Transform stats to StatPanel configs */
  toStatPanels?: (stats: T, timeRange: TimeRangeParams) => StatPanelConfig[];
  /** Auto-refresh interval in ms (0 = disabled) */
  autoRefreshInterval?: number;
  /** Whether to sync with global time range */
  syncGlobalTimeRange?: boolean;
  /** Whether to fetch on mount */
  fetchOnMount?: boolean;
}

export interface UseModuleStatsReturn<T extends BaseStatistics> {
  // State
  stats: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  lastFetchTime: Ref<number | null>;

  // Computed
  hasData: ComputedRef<boolean>;
  statPanels: ComputedRef<StatPanelConfig[]>;
  timeRange: ComputedRef<TimeRangeParams>;

  // Actions
  fetch: (params?: StatsQueryParams) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
}

export function useModuleStats<T extends BaseStatistics>(
  options: UseModuleStatsOptions<T>,
): UseModuleStatsReturn<T> {
  const {
    fetchFn,
    toStatPanels,
    autoRefreshInterval = 0,
    syncGlobalTimeRange = true,
    fetchOnMount = true,
  } = options;

  const appStore = useAppStore();

  // State
  const stats = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchTime = ref<number | null>(null);

  // Auto-refresh timer
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  // Computed
  const hasData = computed(() => stats.value !== null);

  const timeRange = computed<TimeRangeParams>(() => ({
    start: appStore.globalTimeRange.start,
    end: appStore.globalTimeRange.end,
  }));

  const statPanels = computed<StatPanelConfig[]>(() => {
    if (!stats.value || !toStatPanels) return [];
    return toStatPanels(stats.value, timeRange.value);
  });

  // Actions
  async function fetch(params?: StatsQueryParams): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const queryParams: StatsQueryParams = { ...params };

      if (syncGlobalTimeRange) {
        queryParams.from = new Date(timeRange.value.start).toISOString();
        queryParams.to = new Date(timeRange.value.end).toISOString();
      }

      stats.value = await fetchFn(queryParams);
      lastFetchTime.value = Date.now();
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch statistics";
      console.error("Stats fetch error:", e);
    } finally {
      loading.value = false;
    }
  }

  async function refresh(): Promise<void> {
    await fetch();
  }

  function clear(): void {
    stats.value = null;
    error.value = null;
    lastFetchTime.value = null;
  }

  // Auto-refresh management
  function startAutoRefresh(): void {
    if (autoRefreshInterval > 0 && !refreshTimer) {
      refreshTimer = setInterval(refresh, autoRefreshInterval);
    }
  }

  function stopAutoRefresh(): void {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // Watch for global time range changes
  if (syncGlobalTimeRange) {
    watch(
      () => appStore.globalTimeRange,
      () => {
        fetch();
      },
      { deep: true },
    );
  }

  // Lifecycle
  onMounted(() => {
    if (fetchOnMount) {
      fetch();
    }
    if (autoRefreshInterval > 0) {
      startAutoRefresh();
    }
  });

  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    stats,
    loading,
    error,
    lastFetchTime,
    hasData,
    statPanels,
    timeRange,
    fetch,
    refresh,
    clear,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
