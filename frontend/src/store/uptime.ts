/**
 * Uptime Monitoring Store
 * Task 4: Create Pinia store for uptime monitoring state
 *
 * This store manages:
 * - Monitor list with filters and pagination
 * - Selected monitor details
 * - Monitor statistics with latency percentiles
 * - Check history
 * - Loading and error states
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { uptimeApi } from "@/api/uptime";
import config from "@/config";
import type {
  Monitor,
  UptimeStats,
  UptimeCheck,
  MonitorStatus,
  MonitorType,
  ListMonitorsQuery,
  GetChecksQuery,
  PaginatedMonitors,
} from "@/types/uptime";

export const useUptimeStore = defineStore("uptime", () => {
  // ==================== STATE ====================

  // Monitor list state
  const monitors = ref<Monitor[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(20);
  const totalPages = ref(0);
  const hasNext = ref(false);
  const hasPrevious = ref(false);

  // Filters
  const filters = ref<{
    name?: string;
    status?: MonitorStatus;
    type?: MonitorType;
    groupId?: string;
  }>({});

  // Selected monitor state
  const selectedMonitor = ref<Monitor | null>(null);
  const selectedMonitorStats = ref<UptimeStats | null>(null);
  const selectedMonitorChecks = ref<UptimeCheck[]>([]);

  // Loading states
  const loading = ref(false);
  const loadingMonitor = ref(false);
  const loadingStats = ref(false);
  const loadingChecks = ref(false);

  // Error states
  const error = ref<string | null>(null);
  const monitorError = ref<string | null>(null);
  const statsError = ref<string | null>(null);
  const checksError = ref<string | null>(null);

  // ==================== GETTERS ====================

  const monitorsByStatus = computed(() => {
    const grouped: Record<MonitorStatus, Monitor[]> = {
      up: [],
      down: [],
      degraded: [],
      paused: [],
      pending: [],
      unknown: [],
    };

    monitors.value.forEach((monitor) => {
      grouped[monitor.status].push(monitor);
    });

    return grouped;
  });

  const monitorsByType = computed(() => {
    const grouped: Partial<Record<MonitorType, Monitor[]>> = {};

    monitors.value.forEach((monitor) => {
      if (!grouped[monitor.type]) {
        grouped[monitor.type] = [];
      }
      grouped[monitor.type]!.push(monitor);
    });

    return grouped;
  });

  const activeMonitors = computed(() =>
    monitors.value.filter((m) => m.isActive && !m.isPaused),
  );

  const pausedMonitors = computed(() =>
    monitors.value.filter((m) => m.isPaused),
  );

  const downMonitors = computed(() =>
    monitors.value.filter((m) => m.status === "down"),
  );

  const degradedMonitors = computed(() =>
    monitors.value.filter((m) => m.status === "degraded"),
  );

  const criticalMonitors = computed(() =>
    monitors.value.filter(
      (m) => (m.status === "down" || m.status === "degraded") && m.isActive,
    ),
  );

  const hasFilters = computed(() =>
    Object.values(filters.value).some((v) => v !== undefined && v !== ""),
  );

  // ==================== ACTIONS ====================

  /**
   * Fetch monitors with optional filters and pagination
   * Requirements: 1.1, 8.1, 8.5, 8.6, 8.7
   */
  async function fetchMonitors(query?: ListMonitorsQuery) {
    loading.value = true;
    error.value = null;

    try {
      // Merge query with current filters and pagination
      const finalQuery: ListMonitorsQuery = {
        ...filters.value,
        page: page.value,
        pageSize: pageSize.value,
        ...query,
      };

      const result: PaginatedMonitors =
        await uptimeApi.listMonitors(finalQuery);

      monitors.value = result.data;
      total.value = result.total;
      page.value = result.page;
      pageSize.value = result.pageSize;
      totalPages.value = result.totalPages;
      hasNext.value = result.hasNext;
      hasPrevious.value = result.hasPrevious;

      return result;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch monitors";
      console.error("[Uptime Store] Failed to fetch monitors:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch a single monitor by ID
   * Requirements: 2.1, 8.2
   */
  async function fetchMonitorDetails(id: string) {
    loadingMonitor.value = true;
    monitorError.value = null;

    try {
      const monitor = await uptimeApi.getMonitor(id);
      selectedMonitor.value = monitor;
      return monitor;
    } catch (err: any) {
      monitorError.value = err.message || "Failed to fetch monitor details";
      console.error("[Uptime Store] Failed to fetch monitor details:", err);
      throw err;
    } finally {
      loadingMonitor.value = false;
    }
  }

  /**
   * Fetch monitor statistics with latency percentiles
   * Requirements: 3.1, 3.2, 3.3, 8.3
   */
  async function fetchMonitorStats(id: string) {
    loadingStats.value = true;
    statsError.value = null;

    try {
      const stats = await uptimeApi.getMonitorStats(id);
      selectedMonitorStats.value = stats;
      return stats;
    } catch (err: any) {
      statsError.value = err.message || "Failed to fetch monitor statistics";
      console.error("[Uptime Store] Failed to fetch monitor stats:", err);
      throw err;
    } finally {
      loadingStats.value = false;
    }
  }

  /**
   * Fetch monitor check history with time range support
   * Requirements: 4.1, 4.4, 8.4
   */
  async function fetchMonitorChecks(id: string, query?: GetChecksQuery) {
    loadingChecks.value = true;
    checksError.value = null;

    try {
      const checks = await uptimeApi.getMonitorChecks(id, query);
      selectedMonitorChecks.value = checks;
      return checks;
    } catch (err: any) {
      checksError.value = err.message || "Failed to fetch monitor checks";
      console.error("[Uptime Store] Failed to fetch monitor checks:", err);
      throw err;
    } finally {
      loadingChecks.value = false;
    }
  }

  /**
   * Create a new monitor
   */
  async function createMonitor(data: any) {
    loading.value = true;
    error.value = null;

    try {
      const monitor = await uptimeApi.createMonitor(data);

      // Add to the beginning of the list
      monitors.value.unshift(monitor);
      total.value += 1;

      return monitor;
    } catch (err: any) {
      error.value = err.message || "Failed to create monitor";
      console.error("[Uptime Store] Failed to create monitor:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing monitor
   */
  async function updateMonitor(id: string, data: any) {
    loading.value = true;
    error.value = null;

    try {
      const monitor = await uptimeApi.updateMonitor(id, data);

      // Update in the list
      const index = monitors.value.findIndex((m) => m.id === id);
      if (index !== -1) {
        monitors.value[index] = monitor;
      }

      // Update selected monitor if it's the same
      if (selectedMonitor.value?.id === id) {
        selectedMonitor.value = monitor;
      }

      return monitor;
    } catch (err: any) {
      error.value = err.message || "Failed to update monitor";
      console.error("[Uptime Store] Failed to update monitor:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a monitor
   */
  async function deleteMonitor(id: string) {
    loading.value = true;
    error.value = null;

    try {
      await uptimeApi.deleteMonitor(id);

      // Remove from the list
      const index = monitors.value.findIndex((m) => m.id === id);
      if (index !== -1) {
        monitors.value.splice(index, 1);
        total.value -= 1;
      }

      // Clear selected monitor if it's the same
      if (selectedMonitor.value?.id === id) {
        selectedMonitor.value = null;
        selectedMonitorStats.value = null;
        selectedMonitorChecks.value = [];
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete monitor";
      console.error("[Uptime Store] Failed to delete monitor:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pause a monitor
   */
  async function pauseMonitor(id: string) {
    loading.value = true;
    error.value = null;

    try {
      const monitor = await uptimeApi.pauseMonitor(id);

      // Update in the list
      const index = monitors.value.findIndex((m) => m.id === id);
      if (index !== -1) {
        monitors.value[index] = monitor;
      }

      // Update selected monitor if it's the same
      if (selectedMonitor.value?.id === id) {
        selectedMonitor.value = monitor;
      }

      return monitor;
    } catch (err: any) {
      error.value = err.message || "Failed to pause monitor";
      console.error("[Uptime Store] Failed to pause monitor:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Resume a monitor
   */
  async function resumeMonitor(id: string) {
    loading.value = true;
    error.value = null;

    try {
      const monitor = await uptimeApi.resumeMonitor(id);

      // Update in the list
      const index = monitors.value.findIndex((m) => m.id === id);
      if (index !== -1) {
        monitors.value[index] = monitor;
      }

      // Update selected monitor if it's the same
      if (selectedMonitor.value?.id === id) {
        selectedMonitor.value = monitor;
      }

      return monitor;
    } catch (err: any) {
      error.value = err.message || "Failed to resume monitor";
      console.error("[Uptime Store] Failed to resume monitor:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Set filters and refetch monitors
   */
  async function setFilters(newFilters: Partial<typeof filters.value>) {
    filters.value = { ...filters.value, ...newFilters };
    page.value = 1; // Reset to first page when filters change
    return fetchMonitors();
  }

  /**
   * Clear all filters
   */
  async function clearFilters() {
    filters.value = {};
    page.value = 1;
    return fetchMonitors();
  }

  /**
   * Set page and refetch monitors
   */
  async function setPage(newPage: number) {
    page.value = newPage;
    return fetchMonitors();
  }

  /**
   * Set page size and refetch monitors
   */
  async function setPageSize(newPageSize: number) {
    pageSize.value = newPageSize;
    page.value = 1; // Reset to first page when page size changes
    return fetchMonitors();
  }

  /**
   * Go to next page
   */
  async function nextPage() {
    if (hasNext.value) {
      return setPage(page.value + 1);
    }
  }

  /**
   * Go to previous page
   */
  async function previousPage() {
    if (hasPrevious.value) {
      return setPage(page.value - 1);
    }
  }

  /**
   * Select a monitor and fetch its details, stats, and checks
   */
  async function selectMonitor(id: string) {
    try {
      await Promise.all([
        fetchMonitorDetails(id),
        fetchMonitorStats(id),
        fetchMonitorChecks(id, { limit: config.limitDataMax }),
      ]);
    } catch (err) {
      console.error("[Uptime Store] Failed to select monitor:", err);
      throw err;
    }
  }

  /**
   * Clear selected monitor
   */
  function clearSelectedMonitor() {
    selectedMonitor.value = null;
    selectedMonitorStats.value = null;
    selectedMonitorChecks.value = [];
    monitorError.value = null;
    statsError.value = null;
    checksError.value = null;
  }

  /**
   * Refresh monitors (refetch with current filters and pagination)
   */
  async function refreshMonitors() {
    return fetchMonitors();
  }

  /**
   * Refresh selected monitor data
   */
  async function refreshSelectedMonitor() {
    if (selectedMonitor.value) {
      return selectMonitor(selectedMonitor.value.id);
    }
  }

  /**
   * Clear all errors
   */
  function clearErrors() {
    error.value = null;
    monitorError.value = null;
    statsError.value = null;
    checksError.value = null;
  }

  // ==================== RETURN ====================

  return {
    // State
    monitors,
    total,
    page,
    pageSize,
    totalPages,
    hasNext,
    hasPrevious,
    filters,
    selectedMonitor,
    selectedMonitorStats,
    selectedMonitorChecks,
    loading,
    loadingMonitor,
    loadingStats,
    loadingChecks,
    error,
    monitorError,
    statsError,
    checksError,

    // Getters
    monitorsByStatus,
    monitorsByType,
    activeMonitors,
    pausedMonitors,
    downMonitors,
    degradedMonitors,
    criticalMonitors,
    hasFilters,

    // Actions
    fetchMonitors,
    fetchMonitorDetails,
    fetchMonitorStats,
    fetchMonitorChecks,
    createMonitor,
    updateMonitor,
    deleteMonitor,
    pauseMonitor,
    resumeMonitor,
    setFilters,
    clearFilters,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    selectMonitor,
    clearSelectedMonitor,
    refreshMonitors,
    refreshSelectedMonitor,
    clearErrors,
  };
});
