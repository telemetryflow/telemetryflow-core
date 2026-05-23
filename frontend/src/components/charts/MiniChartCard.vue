<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import { NButtonGroup, NButton } from "naive-ui";
import TimeSeriesChart from "./TimeSeriesChart.vue";
import ChartZoomModal from "./ChartZoomModal.vue";
interface DataSeries {
  name: string;
  data: Array<[number, number]>;
}

const props = withDefaults(
  defineProps<{
    title: string;
    icon?: string;
    iconClass?: string;
    value?: string;
    series: DataSeries[];
    unit?: string;
    height?: string;
    showLegend?: boolean;
    defaultChartType?: "line" | "area" | "bar";
    tooltipSize?: "small" | "medium" | "standard";
  }>(),
  {
    height: "160px",
    showLegend: true,
    defaultChartType: "line",
    tooltipSize: "small",
  },
);

// Chart type state
type ChartType = "line" | "area" | "bar";
const chartType = ref<ChartType>(props.defaultChartType);

// Zoom modal state
const showZoomModal = ref(false);

function openZoomModal() {
  showZoomModal.value = true;
}

const BADGE_PALETTE = [
  { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  { color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
] as const;

const valueBadges = computed(() => {
  if (!props.value) return [];
  return props.value
    .split("/")
    .map((part, i) => ({
      text: part.trim(),
      ...BADGE_PALETTE[i % BADGE_PALETTE.length],
    }))
    .filter(b => b.text.length > 0);
});
</script>

<template>
  <div class="mini-chart-card">
    <div class="mini-chart-header">
      <!-- Row 1: Icon · Title · Controls -->
      <div class="mini-chart-title-row">
        <Icon
          v-if="icon"
          :icon="icon"
          class="mini-chart-icon"
          :class="iconClass"
        />
        <span class="mini-chart-title">{{ title }}</span>

        <!-- Chart Controls — aligned with title on the right -->
        <div class="mini-chart-controls">
          <n-button-group size="tiny">
            <n-button
              v-for="opt in [
                { type: 'line' as ChartType, icon: 'carbon:chart-line' },
                { type: 'area' as ChartType, icon: 'carbon:chart-area' },
                { type: 'bar' as ChartType, icon: 'carbon:chart-bar' },
              ]"
              :key="opt.type"
              :type="chartType === opt.type ? 'primary' : 'default'"
              :tertiary="chartType !== opt.type"
              @click="chartType = opt.type"
            >
              <template #icon>
                <Icon :icon="opt.icon" :width="12" :height="12" />
              </template>
            </n-button>
          </n-button-group>

          <n-button size="tiny" quaternary @click="openZoomModal">
            <template #icon>
              <Icon icon="carbon:zoom-in" :width="14" :height="14" />
            </template>
          </n-button>
        </div>
      </div>

      <!-- Row 2: Value — colorful badges with "of" separator -->
      <div v-if="valueBadges.length" class="mini-chart-subtitle-row">
        <template v-for="(badge, i) in valueBadges" :key="badge.text">
          <span
            class="mini-chart-value-badge"
            :style="{ color: badge.color, background: badge.bg }"
          >{{ badge.text }}</span>
          <span v-if="i < valueBadges.length - 1" class="mini-badge-sep">of</span>
        </template>
      </div>
    </div>

    <div class="mini-chart-body">
      <TimeSeriesChart
        :series="series"
        :height="height"
        :show-legend="showLegend"
        :show-zoom="false"
        tooltip-mode="compact"
        :unit="unit"
        :chart-type="chartType"
        :tooltip-size="tooltipSize"
        no-sync
        hide-time-badge
      />
    </div>

    <!-- Zoom Modal - Using existing ChartZoomModal component -->
    <ChartZoomModal
      v-model:show="showZoomModal"
      v-model:chart-type="chartType"
      :title="title"
      :series="series"
      :unit="unit"
      :tooltip-size="tooltipSize"
      embed-chart
      height="80vh"
    />
  </div>
</template>

<style scoped lang="scss">
.mini-chart-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: var(--n-card-color);

  :global(html.dark) & {
    border-color: #475569;
    background: #1e293b;
  }
}

.mini-chart-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  background: transparent;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

// Row 1: icon + title + controls
.mini-chart-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.mini-chart-icon {
  font-size: 18px;
  flex-shrink: 0;

  &.cpu {
    color: #3b82f6;
  }

  &.memory {
    color: #8b5cf6;
  }

  &.disk {
    color: #f59e0b;
  }

  &.network {
    color: #10b981;
  }

  &.ephemeral {
    color: #14b8a6;
  }

  &.capacity {
    color: #3b82f6;
  }

  &.iops {
    color: #f59e0b;
  }

  &.throughput {
    color: #8b5cf6;
  }
}

.mini-chart-title {
  flex-shrink: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--n-text-color);
  letter-spacing: 0.01em;
}

// Row 2: colorful value badges
.mini-chart-subtitle-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding-left: calc(18px + 8px); // icon width + gap → aligns with title
}

.mini-chart-value-badge {
  display: inline-block;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
  padding: 1px 7px;
  border-radius: 4px;
  line-height: 1.6;
  letter-spacing: 0.01em;
}

.mini-badge-sep {
  font-size: 0.6rem;
  font-weight: 500;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  user-select: none;
}

.mini-chart-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.mini-chart-body {
  padding: 8px 8px 12px 8px;
}

.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  color: var(--n-text-color-3);

  p {
    margin: 8px 0 0 0;
    font-size: 0.875rem;
  }
}

// ─── Responsive ───────────────────────────────────────────────────────────────
@media (max-width: 768px) {
  .mini-chart-header { padding: 8px 10px; gap: 2px; }
  .mini-chart-title-row { gap: 6px; }
  .mini-chart-title { font-size: 0.8125rem; }
  .mini-chart-value-badge { font-size: 0.625rem; padding: 1px 5px; }
  .mini-chart-subtitle-row { padding-left: calc(16px + 6px); }
  .mini-chart-icon { font-size: 16px; }
  .mini-chart-body { padding: 4px 4px 8px 4px; }
}

@media (max-width: 480px) {
  .mini-chart-header { padding: 6px 8px; }
  .mini-chart-title { font-size: 0.75rem; }
  .mini-chart-value-badge { font-size: 0.5625rem; }
  .mini-chart-controls {
    .n-button-group { display: none; }
  }
  .no-data-message { height: 120px; }
}
</style>
