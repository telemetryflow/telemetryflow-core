<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";
import { StatPanel, RegistryGraphPanel } from "@/components/charts";
import { useAppStore, useAlertsStore } from "@/store";
import { config, whiteLabelConfig } from "@/config";
import { useStatPanelsFromRegistry } from "@/composables/useStatPanelsFromRegistry";
import { useOverviewStats } from "@/composables/useOverviewStats";
import { mockHomeAlerts } from "@/mocks/api-stats";

const router = useRouter();
const appStore = useAppStore();
const alertsStore = useAlertsStore();

const loading = ref(true);

// ─── Overview Stats (real data from ClickHouse MVs + PostgreSQL) ─────────────
// Fetches metrics/logs/traces stats + alert stats in parallel.
// Auto-syncs with global time range. Includes previous-period trend comparison.
const overviewStats = useOverviewStats();

// Stats from registry — static config (title, icon, color) from registry,
// dynamic values from useOverviewStats composable (real ClickHouse data).
// Row 1: Headline counts (metrics, logs, traces, alerts)
const statsRow1 = useStatPanelsFromRegistry(
  ["HOM20001", "HOM20002", "HOM20003", "HOM20004"],
  {
    HOM20001: overviewStats.totalMetrics,
    HOM20002: overviewStats.totalLogs,
    HOM20003: overviewStats.totalTraces,
    HOM20004: overviewStats.activeAlerts,
  },
  {
    HOM20002: overviewStats.logsTrendInfo,
    HOM20003: overviewStats.tracesTrendInfo,
  },
);

// Row 2: Detail metrics (services, error rate, avg latency, log errors)
const statsRow2 = useStatPanelsFromRegistry(
  ["HOM20005", "HOM20006", "HOM20007", "HOM20008"],
  {
    HOM20005: overviewStats.serviceCount,
    HOM20006: overviewStats.errorRate,
    HOM20007: overviewStats.avgLatency,
    HOM20008: overviewStats.logErrors,
  },
);

const quickLinks = [
  {
    title: "Explore Metrics",
    icon: "carbon:chart-line",
    route: "/metrics",
    color: "#3b82f6",
  },
  {
    title: "View Logs",
    icon: "carbon:document",
    route: "/logs",
    color: "#22c55e",
  },
  {
    title: "Trace Analysis",
    icon: "carbon:flow",
    route: "/traces",
    color: "#8b5cf6",
  },
  {
    title: "Dashboards",
    icon: "carbon:dashboard",
    route: "/dashboards",
    color: "#f59e0b",
  },
];

// ─── Data Fetching (services list for services overview section) ─────────────
onMounted(async () => {
  loading.value = true;
  try {
    await tracesStore.fetchServices();

    // Seed mock alerts when store is empty (MOCK=true only)
    if (config.useMock && alertsStore.alerts.length === 0) {
      initializeMockAlerts();
    }
  } catch (e) {
    console.error("Failed to load dashboard data:", e);
  } finally {
    loading.value = false;
  }
});

// Re-fetch services when time range changes
watch(
  () => appStore.globalTimeRange,
  async () => {
    await tracesStore.fetchServices();
  },
);

// Seed mock alerts from dedicated mock file (MOCK=true only)
function initializeMockAlerts() {
  for (const alert of mockHomeAlerts()) {
    alertsStore.addAlert(alert);
  }
}

function navigateTo(route: string) {
  router.push(route);
}

function navigateToServiceTraces(service: string) {
  router.push({ path: "/traces", query: { service } });
}
</script>

<template>
  <div class="home-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Welcome to {{ config.appTitle }}</h1>
        <p class="page-subtitle">{{ whiteLabelConfig.brandTagline }}</p>
      </div>
      <div class="header-status">
        <n-tag :type="appStore.isConnected ? 'success' : 'error'" round>
          <template #icon>
            <Icon
              :icon="
                appStore.isConnected ? 'carbon:checkmark' : 'carbon:warning'
              "
            />
          </template>
          {{ appStore.isConnected ? "Connected" : "Disconnected" }}
        </n-tag>
      </div>
    </div>

    <!-- Stats Grid — Row 1: Headline counts -->
    <div class="stats-grid">
      <StatPanel v-for="stat in statsRow1" :key="stat.title" v-bind="stat" />
    </div>
    <!-- Stats Grid — Row 2: Detail metrics -->
    <div class="stats-grid">
      <StatPanel v-for="stat in statsRow2" :key="stat.title" v-bind="stat" />
    </div>

    <!-- Quick Links -->
    <div class="quick-links">
      <div
        v-for="link in quickLinks"
        :key="link.title"
        class="quick-link-card"
        @click="navigateTo(link.route)"
      >
        <div
          class="link-icon-box"
          :style="{ backgroundColor: `${link.color}20`, color: link.color }"
        >
          <Icon :icon="link.icon" :width="26" :height="26" />
        </div>
        <span class="link-title">{{ link.title }}</span>
        <Icon icon="carbon:arrow-right" class="link-arrow" />
      </div>
    </div>

    <!-- Charts Grid — Dynamic Overview Dashboard (query panel per graph) -->
    <div class="charts-grid">
      <RegistryGraphPanel
        graph-id="HOM10005"
        variant="panel"
        editable
        show-toggle
        show-zoom
        height="300px"
        :query-collapsed="true"
      />
      <RegistryGraphPanel
        graph-id="HOM10006"
        variant="panel"
        editable
        show-toggle
        show-zoom
        height="300px"
        :query-collapsed="true"
      />
      <RegistryGraphPanel
        graph-id="HOM10007"
        variant="panel"
        editable
        show-toggle
        show-zoom
        height="300px"
        :query-collapsed="true"
      />
      <RegistryGraphPanel
        graph-id="HOM10008"
        variant="panel"
        editable
        show-toggle
        show-zoom
        height="300px"
        :query-collapsed="true"
      />
    </div>

    <!-- Services Overview -->
    <n-card title="Services Overview" size="small" class="services-card">
      <n-empty
        v-if="tracesStore.services.length === 0"
        description="No services detected"
      >
        <template #extra>
          <n-button size="small" @click="navigateTo('/traces')">
            View Traces
          </n-button>
        </template>
      </n-empty>
      <div v-else class="services-grid">
        <div
          v-for="service in tracesStore.services.slice(0, 8)"
          :key="service"
          class="service-item clickable"
          @click="navigateToServiceTraces(service)"
        >
          <div class="service-icon">
            <Icon icon="carbon:application" />
          </div>
          <span class="service-name">{{ service }}</span>
          <Icon icon="carbon:arrow-right" class="service-arrow" />
        </div>
      </div>
    </n-card>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--n-text-color);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.quick-link-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #27303d; // dark gray, visible against page bg
  border: 1px solid #3f4a5a;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  // Light mode
  :root:not(.dark) & {
    background: #e8ecf1;
    border: 1px solid #d1d9e3;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    border-color: var(--n-primary-color);

    :root:not(.dark) & {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }

    .link-arrow {
      opacity: 1;
      transform: translateX(0);
      color: var(--n-primary-color);
    }
  }
}

.link-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;
}

.link-title {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #e2e8f0;

  :root:not(.dark) & {
    color: #1e293b;
  }
}

.link-arrow {
  font-size: 18px;
  color: #64748b;
  opacity: 0.5;
  transform: translateX(-4px);
  transition: all 0.2s ease;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  align-items: start; // Prevent query dropdown from stretching neighbor height

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.service-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--n-action-color);
  border-radius: 8px;
  transition: all 0.2s ease;

  &.clickable {
    cursor: pointer;

    &:hover {
      background: var(--n-primary-color-hover);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      .service-arrow {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }
}

.service-icon {
  color: var(--n-primary-color);
  flex-shrink: 0;
}

.service-name {
  flex: 1;
  font-size: 0.875rem;
  color: var(--n-text-color);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.service-arrow {
  color: var(--n-text-color-3);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
  flex-shrink: 0;
}
</style>
