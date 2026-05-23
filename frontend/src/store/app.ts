/**
 * App store - global application state
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { CollectorConfig, CollectorStatus } from "@/types";
import { defaultCollectorConfig } from "@/config/collector";
import { collectorClient } from "@/api/collector";
import { config } from "@/config";

export const INTERVAL_OPTIONS = [
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
  { label: "3h", value: "3h" },
  { label: "6h", value: "6h" },
  { label: "12h", value: "12h" },
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "14d", value: "14d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

export const useAppStore = defineStore("app", () => {
  // State
  const theme = ref<"light" | "dark">("light");
  const sidebarCollapsed = ref(false);
  const sidebarHidden = ref(false);
  const collectorConfig = ref<CollectorConfig>({ ...defaultCollectorConfig });
  const collectorStatus = ref<CollectorStatus | null>(null);
  const isConnected = ref(false);
  const refreshInterval = ref(300000);
  const globalInterval = ref("30m");
  const globalTimeRange = ref({
    start: Date.now() - 1800000, // 30 minutes ago
    end: Date.now(),
  });
  /** Selected timezone — "UTC", "browser", or IANA name (e.g., "Asia/Jakarta") */
  const selectedTimezone = ref<string>("UTC");

  // Getters
  const isDarkMode = computed(() => theme.value === "dark");

  /** Resolved IANA timezone for chart formatting (converts "browser" → actual tz) */
  const chartTimezone = computed(() => {
    if (selectedTimezone.value === "browser") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return selectedTimezone.value; // "UTC" or IANA like "Asia/Jakarta"
  });

  const timeRangeLabel = computed(() => {
    const diff = globalTimeRange.value.end - globalTimeRange.value.start;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    // Check in order: days -> hours -> minutes
    if (days >= 1) return `Last ${days} day${days > 1 ? "s" : ""}`;
    if (hours >= 1) return `Last ${hours} hour${hours > 1 ? "s" : ""}`;
    return `Last ${minutes} minute${minutes > 1 ? "s" : ""}`;
  });

  // Actions
  function toggleTheme() {
    theme.value = theme.value === "light" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme.value === "dark");
    localStorage.setItem("tfo-viz-theme", theme.value);
  }

  function setTheme(newTheme: "light" | "dark") {
    theme.value = newTheme;
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("tfo-viz-theme", newTheme);
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem(
      "tfo-viz-sidebar-collapsed",
      String(sidebarCollapsed.value),
    );
  }

  function toggleSidebarVisibility() {
    sidebarHidden.value = !sidebarHidden.value;
    localStorage.setItem("tfo-viz-sidebar-hidden", String(sidebarHidden.value));
  }

  function showSidebar() {
    sidebarHidden.value = false;
    localStorage.setItem("tfo-viz-sidebar-hidden", "false");
  }

  function hideSidebar() {
    sidebarHidden.value = true;
    localStorage.setItem("tfo-viz-sidebar-hidden", "true");
  }

  function setTimeRange(start: number, end: number) {
    globalTimeRange.value = { start, end };
  }

  function setTimeRangePreset(preset: string) {
    const now = Date.now();
    const presets: Record<string, number> = {
      "5m": 5 * 60 * 1000,
      "10m": 10 * 60 * 1000,
      "15m": 15 * 60 * 1000,
      "30m": 30 * 60 * 1000,
      "45m": 45 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "3h": 3 * 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "12h": 12 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "2d": 2 * 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "14d": 14 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    };

    if (presets[preset]) {
      globalInterval.value = preset;
      globalTimeRange.value = {
        start: now - presets[preset],
        end: now,
      };
    }
  }

  function setTimezone(tz: string) {
    selectedTimezone.value = tz;
  }

  function setRefreshInterval(interval: number) {
    refreshInterval.value = interval;
    localStorage.setItem("tfo-viz-refresh-interval", String(interval));
  }

  function updateCollectorConfig(config: Partial<CollectorConfig>) {
    collectorConfig.value = { ...collectorConfig.value, ...config };
    localStorage.setItem(
      "tfo-viz-collector",
      JSON.stringify(collectorConfig.value),
    );

    if (config.httpEndpoint && !import.meta.env.DEV) {
      collectorClient.setBaseURL(config.httpEndpoint);
    }
  }

  async function checkCollectorStatus() {
    // Skip real API call when mock mode is enabled
    if (config.useMock) {
      collectorStatus.value = {
        connected: true,
        collectorReachable: true,
        clickhouseAlive: true,
        dataFlowing: true,
        collectorVersion: "1.2.1",
        uptime: "1d 2h 35m 10s",
        snapshot: new Date(Date.now() - 2 * 60 * 60 * 1000 - 35 * 60 * 1000).toISOString(),
        metrics: { received: 1000, processed: 1000, errors: 0 },
        logs: { received: 5000, processed: 5000, errors: 0 },
        traces: { received: 500, processed: 500, errors: 0 },
      };
      isConnected.value = true;
      return;
    }

    try {
      const status = await collectorClient.getStatus();
      collectorStatus.value = status;
      isConnected.value = status.connected;
    } catch {
      isConnected.value = false;
      collectorStatus.value = null;
    }
  }

  function initializeFromStorage() {
    // Theme - default to dark
    const savedTheme = localStorage.getItem("tfo-viz-theme") as
      | "light"
      | "dark"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to dark theme
      setTheme("dark");
    }

    // Sidebar collapsed state
    const savedSidebarCollapsed = localStorage.getItem(
      "tfo-viz-sidebar-collapsed",
    );
    if (savedSidebarCollapsed) {
      sidebarCollapsed.value = savedSidebarCollapsed === "true";
    }

    // Sidebar hidden state
    const savedSidebarHidden = localStorage.getItem("tfo-viz-sidebar-hidden");
    if (savedSidebarHidden) {
      sidebarHidden.value = savedSidebarHidden === "true";
    }

    // Collector config
    const savedConfig = localStorage.getItem("tfo-viz-collector");
    if (savedConfig) {
      try {
        collectorConfig.value = {
          ...defaultCollectorConfig,
          ...JSON.parse(savedConfig),
        };
      } catch {
        // Ignore parse errors
      }
    }

    // Timezone - default to UTC
    const savedTimezone = localStorage.getItem("tfo-viz-timezone");
    if (savedTimezone) {
      try {
        const tz = JSON.parse(savedTimezone);
        selectedTimezone.value = tz.value || "UTC";
      } catch {
        // Ignore parse errors
      }
    }

    // Refresh interval - default to 5m
    const savedInterval = localStorage.getItem("tfo-viz-refresh-interval");
    if (savedInterval) {
      refreshInterval.value = parseInt(savedInterval, 10) || 300000;
    }
  }

  return {
    // State
    theme,
    sidebarCollapsed,
    sidebarHidden,
    collectorConfig,
    collectorStatus,
    isConnected,
    refreshInterval,
    globalInterval,
    globalTimeRange,
    selectedTimezone,
    // Getters
    isDarkMode,
    chartTimezone,
    timeRangeLabel,
    // Actions
    toggleTheme,
    setTheme,
    toggleSidebar,
    toggleSidebarVisibility,
    showSidebar,
    hideSidebar,
    setTimeRange,
    setTimeRangePreset,
    setTimezone,
    setRefreshInterval,
    updateCollectorConfig,
    checkCollectorStatus,
    initializeFromStorage,
  };
});
