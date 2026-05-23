import { ref, onMounted, onUnmounted } from 'vue';
import { useDbCockroachdbStore } from '@/store/db-monitoring-cockroachdb';

export function useCockroachDBMonitoring() {
  const store = useDbCockroachdbStore();
  const autoRefreshInterval = ref<ReturnType<typeof setInterval> | null>(null);
  const refreshRate = ref(15000);
  const timeRange = ref<[number, number]>([
    Date.now() - 3600 * 1000,
    Date.now(),
  ]);

  function startAutoRefresh(instanceId?: string) {
    stopAutoRefresh();
    autoRefreshInterval.value = setInterval(() => {
      if (instanceId) {
        store.fetchInstance(instanceId);
      } else {
        store.fetchInstances();
      }
      store.fetchOverviewStats();
    }, refreshRate.value);
  }

  function stopAutoRefresh() {
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value);
      autoRefreshInterval.value = null;
    }
  }

  function setRefreshRate(ms: number) {
    refreshRate.value = ms;
  }

  function setTimeRange(range: [number, number]) {
    timeRange.value = range;
  }

  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    store,
    timeRange,
    refreshRate,
    startAutoRefresh,
    stopAutoRefresh,
    setRefreshRate,
    setTimeRange,
  };
}
