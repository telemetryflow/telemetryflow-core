/**
 * Service Map Polling Composable
 * Handles real-time topology updates with 30-second intervals
 * Pauses when page is not visible, defers during user interaction
 */

import { ref, onUnmounted } from "vue";

const POLL_INTERVAL = 30_000; // 30 seconds

export function useServiceMapPolling(fetchFn: () => Promise<void>) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  const isPolling = ref(false);
  const isInteracting = ref(false);
  let pendingUpdate = false;

  function onVisibilityChange() {
    if (document.hidden) {
      pause();
    } else {
      resume();
    }
  }

  async function poll() {
    if (isInteracting.value) {
      pendingUpdate = true;
      return;
    }
    try {
      await fetchFn();
    } catch (err) {
      console.warn("[ServiceMapPolling] Poll error:", err);
    }
  }

  function startPolling() {
    if (isPolling.value) return;
    isPolling.value = true;
    intervalId = setInterval(poll, POLL_INTERVAL);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  function stopPolling() {
    isPolling.value = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  function pause() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function resume() {
    if (isPolling.value && !intervalId) {
      intervalId = setInterval(poll, POLL_INTERVAL);
      // Fetch immediately on resume
      poll();
    }
  }

  /** Call when user starts interacting (drag, pan, zoom) */
  function setInteracting(value: boolean) {
    isInteracting.value = value;
    if (!value && pendingUpdate) {
      pendingUpdate = false;
      poll();
    }
  }

  onUnmounted(() => {
    stopPolling();
  });

  return {
    isPolling,
    isInteracting,
    startPolling,
    stopPolling,
    setInteracting,
  };
}
