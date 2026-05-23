<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "@/store";

const appStore = useAppStore();

// Collector version from backend response
const collectorVersion = computed(() =>
  appStore.collectorStatus?.collectorVersion ||
  appStore.collectorStatus?.version ||
  "N/A",
);

/**
 * Parse a duration string like "2h35m10s" or "72h5m" into milliseconds.
 */
function parseDurationString(s: string): number | null {
  const re = /(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
  const m = re.exec(s);
  if (!m || !m[0]) return null;
  const days = parseInt(m[1] || "0", 10);
  const hours = parseInt(m[2] || "0", 10);
  const minutes = parseInt(m[3] || "0", 10);
  const seconds = parseInt(m[4] || "0", 10);
  return ((days * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000) || null;
}

function formatMs(uptimeMs: number): string {
  if (uptimeMs < 0) return "N/A";
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Uptime: prefer collector uptime field, fallback to snapshot (earliest data)
const formattedUptime = computed(() => {
  if (!appStore.collectorStatus) return "N/A";

  // 1. Collector uptime from health check (string like "2h35m10s" or number in seconds)
  const raw = appStore.collectorStatus.uptime;
  if (raw != null) {
    if (typeof raw === "number" && raw > 0) return formatMs(raw * 1000);
    if (typeof raw === "string") {
      const ms = parseDurationString(raw);
      if (ms) return formatMs(ms);
    }
  }

  // 2. Fallback: calculate from snapshot (earliest data timestamp)
  if (appStore.collectorStatus.snapshot) {
    const snapshotTime = new Date(appStore.collectorStatus.snapshot).getTime();
    const uptimeMs = Date.now() - snapshotTime;
    // Sanity check: if > 5 years, the timestamp is likely bad (epoch/zero)
    if (uptimeMs > 0 && uptimeMs < 5 * 365.25 * 86400 * 1000) {
      return formatMs(uptimeMs);
    }
  }

  return "N/A";
});
</script>

<template>
  <n-card v-if="appStore.collectorStatus" title="Platform Status" size="small" class="card-centered">
    <div class="status-grid">
      <table class="status-table-vertical">
        <tbody>
          <tr>
            <td class="status-label">Version</td>
            <td class="status-label">Uptime</td>
          </tr>
          <tr>
            <td class="status-value">{{ collectorVersion }}</td>
            <td class="status-value">{{ formattedUptime }}</td>
          </tr>
          <tr>
            <td class="status-label">Metrics Received</td>
            <td class="status-label">Logs Received</td>
          </tr>
          <tr>
            <td class="status-value">
              {{ appStore.collectorStatus.metrics.received.toLocaleString() }}
            </td>
            <td class="status-value">
              {{ appStore.collectorStatus.logs.received.toLocaleString() }}
            </td>
          </tr>
          <tr>
            <td class="status-label">Traces Received</td>
            <td class="status-label">Errors</td>
          </tr>
          <tr>
            <td class="status-value">
              {{ appStore.collectorStatus.traces.received.toLocaleString() }}
            </td>
            <td class="status-value error">
              {{
                (
                  appStore.collectorStatus.metrics.errors +
                  appStore.collectorStatus.logs.errors +
                  appStore.collectorStatus.traces.errors
                ).toLocaleString()
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </n-card>
</template>

<style scoped lang="scss">
.status-grid {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.status-table-vertical {
  border-collapse: collapse;
  width: 100%;
  max-width: 400px;

  td {
    padding: 6px 16px;
    text-align: center;
    width: 50%;
  }

  .status-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--n-text-color-3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-top: 12px;
    padding-bottom: 4px;
  }

  .status-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--n-text-color);
    padding-top: 0;
    padding-bottom: 8px;

    &.error {
      color: #ef4444;
    }
  }
}
</style>