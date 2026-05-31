/**
 * Monitor Polling Composable
 * Provides real-time monitor status updates via polling
 * Requirements: 5.1, 5.3, 5.4, 5.5, 5.6
 */

import { ref, onMounted, onUnmounted, type Ref } from "vue";
import type { Monitor, MonitorStatus } from "@/types/uptime";

export interface MonitorStatusChange {
  monitorId: string;
  previousStatus: MonitorStatus;
  currentStatus: MonitorStatus;
  timestamp: number;
}

export interface UseMonitorPollingOptions {
  /** Function to fetch updated monitor data */
  fetchFn: () => Promise<Monitor[]>;
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  pollingInterval?: number;
  /** Whether to start polling automatically on mount */
  autoStart?: boolean;
  /** Callback when status changes are detected */
  onStatusChange?: (changes: MonitorStatusChange[]) => void;
  /** Callback when new checks are available */
  onNewChecks?: (monitorIds: string[]) => void;
}

export interface UseMonitorPollingReturn {
  /** Whether polling is currently active */
  isPolling: Ref<boolean>;
  /** Last poll timestamp */
  lastPollTime: Ref<number | null>;
  /** Start polling */
  startPolling: () => void;
  /** Stop polling */
  stopPolling: () => void;
}

/**
 * Composable for real-time monitor polling
 * Requirement 5.1: Real-time status updates without manual refresh
 * Requirement 5.3: Polling interval not exceeding 30 seconds
 * Requirement 5.4, 5.5: Visual indication of status changes
 * Requirement 5.6: Auto-refresh check history when new checks available
 */
export function useMonitorPolling(
  options: UseMonitorPollingOptions,
): UseMonitorPollingReturn {
  const {
    fetchFn,
    pollingInterval = 30000, // Requirement 5.3: 30-second interval
    autoStart = false,
    onStatusChange,
    onNewChecks,
  } = options;

  // State
  const isPolling = ref(false);
  const lastPollTime = ref<number | null>(null);

  // Internal state for tracking changes
  let pollingTimer: ReturnType<typeof setInterval> | null = null;
  const previousMonitors: Map<string, Monitor> = new Map();
  let isPageVisible = true;

  /**
   * Poll for monitor updates
   */
  async function poll(): Promise<void> {
    // Requirement 5.3: Pause polling when page is hidden (Page Visibility API)
    if (!isPageVisible) {
      return;
    }

    try {
      const monitors = await fetchFn();
      const now = Date.now();
      lastPollTime.value = now;

      // Detect status changes
      const statusChanges: MonitorStatusChange[] = [];
      const monitorsWithNewChecks: string[] = [];

      monitors.forEach((monitor) => {
        const previous = previousMonitors.get(monitor.id);

        if (previous) {
          // Requirement 5.4, 5.5: Detect status changes
          if (previous.status !== monitor.status) {
            statusChanges.push({
              monitorId: monitor.id,
              previousStatus: previous.status,
              currentStatus: monitor.status,
              timestamp: now,
            });
          }

          // Requirement 5.6: Detect new checks
          if (
            monitor.lastCheckAt &&
            previous.lastCheckAt &&
            monitor.lastCheckAt > previous.lastCheckAt
          ) {
            monitorsWithNewChecks.push(monitor.id);
          }
        }

        // Update previous state
        previousMonitors.set(monitor.id, monitor);
      });

      // Emit status change events
      if (statusChanges.length > 0 && onStatusChange) {
        onStatusChange(statusChanges);
      }

      // Emit new checks events
      if (monitorsWithNewChecks.length > 0 && onNewChecks) {
        onNewChecks(monitorsWithNewChecks);
      }
    } catch (error) {
      console.error("[Monitor Polling] Poll error:", error);
    }
  }

  /**
   * Start polling
   * Requirement 5.1: Enable real-time updates
   */
  function startPolling(): void {
    if (isPolling.value) {
      return;
    }

    isPolling.value = true;

    // Initial poll to establish baseline
    poll();

    // Requirement 5.3: Set up polling interval (30 seconds)
    pollingTimer = setInterval(poll, pollingInterval);
  }

  /**
   * Stop polling
   */
  function stopPolling(): void {
    if (!isPolling.value) {
      return;
    }

    isPolling.value = false;

    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  }

  /**
   * Handle page visibility changes
   * Requirement 5.3: Pause polling when page is hidden
   */
  function handleVisibilityChange(): void {
    isPageVisible = !document.hidden;

    if (isPageVisible && isPolling.value) {
      // Resume polling immediately when page becomes visible
      poll();
    }
  }

  // Lifecycle
  onMounted(() => {
    // Set up Page Visibility API listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Auto-start if configured
    if (autoStart) {
      startPolling();
    }
  });

  onUnmounted(() => {
    // Clean up
    stopPolling();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    previousMonitors.clear();
  });

  return {
    isPolling,
    lastPollTime,
    startPolling,
    stopPolling,
  };
}
