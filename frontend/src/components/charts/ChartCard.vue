<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import ChartZoomModal from "./ChartZoomModal.vue";
import type { ChartDisplayType } from "./ChartTypeToggle.vue";

interface SeriesData {
  name: string;
  data: Array<[number, number]>;
  color?: string;
}

withDefaults(
  defineProps<{
    title: string;
    chartId: string;
    zoomHeight?: string;
    chartType?: ChartDisplayType;
    showChartTypeToggle?: boolean;
    series?: SeriesData[];
    unit?: string;
    tooltipSize?: "small" | "medium" | "standard";
  }>(),
  {
    zoomHeight: "80vh",
    showChartTypeToggle: true,
    unit: "",
    tooltipSize: "small",
  },
);

const emit = defineEmits<{
  (e: "update:chartType", value: ChartDisplayType): void;
}>();

const showZoom = ref(false);

function openZoom() {
  showZoom.value = true;
}

function handleChartTypeChange(type: ChartDisplayType) {
  emit("update:chartType", type);
}
</script>

<template>
  <n-card size="small" class="chart-card">
    <template #header>
      <div class="chart-header">
        <span class="chart-title">{{ title }}</span>
        <div class="chart-actions">
          <!-- Feature + tool buttons injected by parent (alert, share, chart-type toggle) -->
          <slot name="header-actions" />

          <!-- Zoom — always last, in its own pill -->
          <div class="cc-action-group">
            <n-tooltip>
              <template #trigger>
                <button class="cc-icon-btn" @click="openZoom">
                  <Icon icon="carbon:zoom-in" :width="15" :height="15" />
                </button>
              </template>
              Zoom in
            </n-tooltip>
          </div>
        </div>
      </div>
    </template>

    <slot />
    <slot name="footer" />

    <ChartZoomModal
      v-model:show="showZoom"
      :title="title"
      :height="zoomHeight"
      :chart-type="chartType"
      :show-chart-type-toggle="showChartTypeToggle"
      :series="series"
      :unit="unit"
      :tooltip-size="tooltipSize"
      @update:chart-type="handleChartTypeChange"
    >
      <slot name="zoom-content">
        <slot />
      </slot>
    </ChartZoomModal>
  </n-card>
</template>

<style scoped lang="scss">
.chart-card {
  height: 100%;
  overflow: visible !important;

  :deep(.n-card) {
    overflow: visible !important;
  }

  :deep(.n-card-header) {
    padding: 10px 14px !important;
  }

  :deep(.n-card-header__main) {
    font-weight: 600 !important;
    font-size: 13px !important;
    line-height: 1.4;
  }

  :deep(.n-card__content) {
    padding: 8px !important;
    min-height: 250px;
    flex: 1;
    overflow: visible !important;
    position: relative;
  }

  :deep(.n-card__content > *) {
    width: 100% !important;
    height: 100% !important;
  }
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.chart-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

// Pill group (same language as panel-header .action-group)
.cc-action-group {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  background: var(--n-color-modal, rgba(0, 0, 0, 0.04));
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 2px;
}

.cc-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--n-text-color-3);
  transition:
    background 0.15s,
    color 0.15s;
  padding: 0;
  outline: none;

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--n-text-color);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.is-active-alert {
    color: #f97316;
    background: rgba(249, 115, 22, 0.1);
  }

  &.is-active-share {
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
  }
}

.cc-action-sep {
  width: 1px;
  height: 14px;
  background: var(--n-border-color);
  margin: 0 2px;
  flex-shrink: 0;
}

.btn-dot {
  position: absolute;
  bottom: 3px;
  right: 3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  pointer-events: none;

  &--alert {
    background: #f97316;
  }
  &--share {
    background: #6366f1;
  }
}
</style>
