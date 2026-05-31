<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import { RegistryGraphPanel } from "@/components/charts";
import { useAppStore } from "@/store";
import { auditApi } from "@/api/audit";
import type { ChartSeries } from "@/types/dashboard";

const appStore = useAppStore();
const chartsCollapsed = ref(false);
const chartLoading = ref(false);
const auditEventsByTypeSeries = ref<ChartSeries[]>([]);
const auditResultSeries = ref<ChartSeries[]>([]);
const auditDurationSeries = ref<ChartSeries[]>([]);
const totalEventsSeries = ref<ChartSeries[]>([]);

async function loadChartData() {
  chartLoading.value = true;
  const { start, end } = appStore.globalTimeRange;
  try {
    const [byType, byResult, duration, total] = await Promise.all([
      auditApi.getGraph("audit_events_by_type", { from: start, to: end }),
      auditApi.getGraph("audit_result_distribution", { from: start, to: end }),
      auditApi.getGraph("audit_duration_trend", { from: start, to: end }),
      auditApi.getGraph("total_events", { from: start, to: end }),
    ]);
    auditEventsByTypeSeries.value = byType.series as ChartSeries[];
    auditResultSeries.value = byResult.series as ChartSeries[];
    auditDurationSeries.value = duration.series as ChartSeries[];
    totalEventsSeries.value = total.series as ChartSeries[];
  } catch (err) {
    console.error("[AuditCharts] Failed to load chart data:", err);
  } finally {
    chartLoading.value = false;
  }
}

onMounted(() => {
  loadChartData();
});

watch(() => appStore.globalTimeRange, () => { loadChartData(); }, { deep: true });
</script>

<template>
  <div class="section">
    <div class="section-header section-header--clickable" @click="chartsCollapsed = !chartsCollapsed">
      <div class="section-title">
        <Icon icon="carbon:chart-line" class="section-icon" />
        <Icon :icon="chartsCollapsed ? 'carbon:chevron-right' : 'carbon:chevron-down'" class="chevron-icon" />
        <span>Audit Analytics</span>
      </div>
      <span class="section-badge badge-primary">4 graphs</span>
    </div>
    <div v-show="!chartsCollapsed" class="section-content">
      <div class="charts-grid-2">
        <RegistryGraphPanel
          graph-id="AUD10001" variant="panel" editable show-toggle show-zoom height="280px"
          :query-collapsed="true" :override-series="auditEventsByTypeSeries" :override-loading="chartLoading"
        />
        <RegistryGraphPanel
          graph-id="AUD10002" variant="panel" editable show-toggle show-zoom height="280px"
          :query-collapsed="true" :override-series="auditResultSeries" :override-loading="chartLoading"
        />
        <RegistryGraphPanel
          graph-id="AUD10003" variant="panel" editable show-toggle show-zoom height="280px"
          :query-collapsed="true" :override-series="auditDurationSeries" :override-loading="chartLoading"
        />
        <RegistryGraphPanel
          graph-id="AUD10004" variant="panel" editable show-toggle show-zoom height="280px"
          :query-collapsed="true" :override-series="totalEventsSeries" :override-loading="chartLoading"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tfo-table-styles.scss';

.section {
  border-radius: 12px;
}

.section-header {
  padding: 16px 20px;

  &--clickable {
    cursor: pointer;
    user-select: none;

    &:hover {
      background: var(--n-color-hover);
    }
  }
}

.chevron-icon {
  font-size: 16px;
  color: var(--n-text-color-3);
}

.section-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 5px 14px;
  border-radius: 4px;

  &.badge-primary {
    color: #fff;
    background: var(--n-primary-color, #3b82f6);
  }
}

.section-content {
  padding: 16px;
  border-top: 1px solid var(--k8s-border-color);
}

.charts-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}
</style>
