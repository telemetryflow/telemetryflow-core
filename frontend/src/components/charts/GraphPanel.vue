<script setup lang="ts">
/**
 * GraphPanel - Grafana-like graph panel with integrated query editor
 *
 * Combines a dynamic chart visualization on top with a collapsible
 * query editor panel below. Each query row maps to a data series
 * rendered in the chart.
 *
 * Usage:
 *   <GraphPanel :widget="widget" :editable="true" />
 */
import { ref, computed, watch, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import TimeSeriesChart from "./TimeSeriesChart.vue";
import BarChart from "./BarChart.vue";
import GaugeChart from "./GaugeChart.vue";
import HeatmapChart from "./HeatmapChart.vue";
import ScatterChart from "./ScatterChart.vue";
import StatPanel from "./StatPanel.vue";
import ChartZoomModal from "./ChartZoomModal.vue";
import ChartTypeToggle from "./ChartTypeToggle.vue";
import type { ChartDisplayType } from "./ChartTypeToggle.vue";
import { QueryEditorPanel } from "./query-editor";
import { useQueryPanel } from "@/composables/useQueryPanel";
import { useAppStore } from "@/store";
import type { Widget } from "@/types/dashboard";

interface Props {
  widget: Widget;
  /** Whether the query editor is available */
  editable?: boolean;
  /** Initial collapsed state of query editor */
  queryCollapsed?: boolean;
  /** Chart area height */
  chartHeight?: string;
  /** Show zoom button */
  showZoom?: boolean;
  /** Override chart display type */
  chartType?: string;
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
  queryCollapsed: true,
  chartHeight: "250px",
  showZoom: true,
});

const emit = defineEmits<{
  (e: "update:widget", widget: Widget): void;
  (e: "update:queryCollapsed", value: boolean): void;
  (e: "update:chartType", value: string): void;
}>();

const appStore = useAppStore();
const collapsed = ref(props.queryCollapsed);
const showZoomModal = ref(false);
const chartDisplayType = ref<ChartDisplayType>("area");

// Initialize query panel composable with current global time range
const panel = useQueryPanel({
  widgetType: props.widget.type,
  initialQueries: props.widget.queries,
  widgetTitle: props.widget.options.title,
  start: appStore.globalTimeRange.start,
  end: appStore.globalTimeRange.end,
});

// Sync collapsed state
watch(collapsed, (val) => emit("update:queryCollapsed", val));

// Run initial queries on mount
onMounted(() => {
  panel.setTimeRange(appStore.globalTimeRange.start, appStore.globalTimeRange.end);
  panel.runAllQueries();
});

// Re-run when global time range changes
watch(
  () => appStore.globalTimeRange,
  ({ start, end }) => {
    panel.setTimeRange(start, end);
    panel.runAllQueries();
  },
);

// Re-run when widget changes
watch(
  () => props.widget.id,
  () => {
    panel.runAllQueries();
  },
);

// Stat computed props
const statValue = computed(() => {
  return panel.mergedValue.value ?? 0;
});

function toggleQueryEditor() {
  collapsed.value = !collapsed.value;
}

function handleWidgetUpdate() {
  const updated: Widget = {
    ...props.widget,
    queries: panel.exportQueries(),
  };
  emit("update:widget", updated);
}
</script>

<template>
  <div class="graph-panel" :class="{ editable }">
    <!-- Panel Header -->
    <div class="panel-header">
      <span class="panel-title">{{ widget.options.title }}</span>
      <div class="panel-actions">
        <ChartTypeToggle
          v-if="widget.type === 'timeseries'"
          v-model="chartDisplayType"
          :show-bar="true"
          :show-expand="false"
        />

        <n-tooltip v-if="editable">
          <template #trigger>
            <n-button
              quaternary
              size="tiny"
              class="action-btn"
              :type="!collapsed ? 'primary' : 'default'"
              @click="toggleQueryEditor"
            >
              <template #icon>
                <Icon icon="carbon:query-queue" :width="16" :height="16" />
              </template>
            </n-button>
          </template>
          {{ collapsed ? "Show query editor" : "Hide query editor" }}
        </n-tooltip>

        <n-tooltip v-if="showZoom">
          <template #trigger>
            <n-button
              quaternary
              size="tiny"
              class="action-btn"
              @click="showZoomModal = true"
            >
              <template #icon>
                <Icon icon="carbon:zoom-in" :width="16" :height="16" />
              </template>
            </n-button>
          </template>
          Zoom in
        </n-tooltip>
      </div>
    </div>

    <!-- Chart Area -->
    <div class="chart-area" :style="{ height: chartHeight }">
      <!-- Loading overlay -->
      <div v-if="panel.loading.value" class="chart-loading">
        <n-spin size="small" />
      </div>

      <!-- Time Series (line / area / bar toggle) -->
      <TimeSeriesChart
        v-if="widget.type === 'timeseries'"
        :series="panel.mergedSeries.value"
        :unit="widget.options.unit"
        :height="chartHeight"
        :show-legend="widget.options.legend !== false"
        :chart-type="chartDisplayType"
        :area-style="chartDisplayType === 'area'"
        tooltip-size="small"
        no-sync
      />

      <!-- Bar Chart (widget type) - convert to multi-series stacked for proper coloring -->
      <BarChart
        v-else-if="widget.type === 'bar'"
        :categories="['']"
        :series="
          panel.mergedSeries.value.map((s) => ({
            name: s.name,
            data: [s.data[s.data.length - 1]?.[1] || 0],
            color: s.color,
          }))
        "
        :stacked="true"
        :height="chartHeight"
        tooltip-size="small"
        no-sync
      />

      <!-- Gauge -->
      <GaugeChart
        v-else-if="widget.type === 'gauge'"
        :value="statValue"
        :unit="widget.options.unit || '%'"
        :height="chartHeight"
        :show-border="true"
      />

      <!-- Stat -->
      <div v-else-if="widget.type === 'stat'" class="stat-card-widget">
        <div class="stat-header">
          <Icon icon="carbon:analytics" class="stat-icon-small" />
          <span class="stat-title">{{ widget.options.title }}</span>
        </div>
        <div
          class="stat-value-large stat-value-colorful"
          :style="{ color: widget.options.valueColor || '#3b82f6' }"
        >
          {{ statValue }}
        </div>
        <div v-if="widget.options.unit" class="stat-trend">
          {{ widget.options.unit }}
        </div>
      </div>

      <!-- Heatmap -->
      <HeatmapChart
        v-else-if="widget.type === 'heatmap'"
        :x-categories="[]"
        :y-categories="[]"
        :data="[]"
        :height="chartHeight"
        tooltip-size="small"
      />

      <!-- Scatter (Traces) -->
      <ScatterChart
        v-else-if="widget.type === 'traces'"
        :data="[]"
        :height="chartHeight"
        tooltip-size="small"
      />

      <!-- Text Widget -->
      <div v-else-if="widget.type === 'text'" class="text-content">
        <p>{{ widget.options.description || "No content" }}</p>
      </div>

      <!-- Table / Logs fallback -->
      <div v-else class="fallback-content">
        <Icon icon="carbon:chart-line" style="font-size: 32px; opacity: 0.3" />
        <span class="fallback-label">{{ widget.type }}</span>
      </div>
    </div>

    <!-- Query Editor Panel (collapsible) -->
    <QueryEditorPanel
      v-if="editable"
      :rows="panel.rows.value"
      :loading="panel.loading.value"
      :collapsed="collapsed"
      :template-suggestions="panel.templateSuggestions.value"
      @update:collapsed="collapsed = $event"
      @update-query="
        (i, v) => {
          panel.updateQueryText(i, v);
          handleWidgetUpdate();
        }
      "
      @update-type="
        (i, v) => {
          panel.updateQueryType(i, v);
          handleWidgetUpdate();
        }
      "
      @update-dialect="
        (i, v) => {
          panel.updateDialect(i, v);
          handleWidgetUpdate();
        }
      "
      @update-legend="
        (i, v) => {
          panel.updateLegend(i, v);
          handleWidgetUpdate();
        }
      "
      @toggle-query="
        (i) => {
          panel.toggleQuery(i);
          handleWidgetUpdate();
        }
      "
      @run-query="(i) => panel.runQuery(i)"
      @run-all="panel.runAllQueries()"
      @add-query="
        () => {
          panel.addQuery();
          handleWidgetUpdate();
        }
      "
      @remove-query="
        (i) => {
          panel.removeQuery(i);
          handleWidgetUpdate();
        }
      "
      @duplicate-query="
        (i) => {
          panel.duplicateQuery(i);
          handleWidgetUpdate();
        }
      "
      @select-template="
        (i, tid) => {
          panel.applyTemplate(i, tid);
          handleWidgetUpdate();
        }
      "
    />

    <!-- Zoom Modal -->
    <ChartZoomModal
      v-model:show="showZoomModal"
      :title="widget.options.title"
      :series="panel.mergedSeries.value"
      :unit="widget.options.unit"
      :chart-type="chartDisplayType"
      :tooltip-size="'small'"
      :show-chart-type-toggle="
        widget.type === 'timeseries' ||
          widget.type === 'stat' ||
          widget.type === 'gauge'
      "
      @update:chart-type="chartDisplayType = $event"
    >
      <TimeSeriesChart
        v-if="widget.type === 'timeseries'"
        :series="panel.mergedSeries.value"
        :unit="widget.options.unit"
        height="70vh"
        :show-legend="true"
        :area-style="chartDisplayType === 'area'"
        :chart-type="chartDisplayType"
        tooltip-size="small"
      />
      <BarChart
        v-else-if="widget.type === 'bar'"
        :categories="['']"
        :series="
          panel.mergedSeries.value.map((s) => ({
            name: s.name,
            data: [s.data[s.data.length - 1]?.[1] || 0],
            color: s.color,
          }))
        "
        :stacked="true"
        height="70vh"
        tooltip-size="small"
        no-sync
      />
      <TimeSeriesChart
        v-else-if="widget.type === 'stat'"
        :series="panel.mergedSeries.value"
        :unit="widget.options.unit"
        height="70vh"
        :show-legend="true"
        :area-style="chartDisplayType === 'area'"
        :chart-type="chartDisplayType"
        tooltip-size="small"
      />
      <TimeSeriesChart
        v-else-if="widget.type === 'gauge'"
        :series="panel.mergedSeries.value"
        :unit="widget.options.unit"
        height="70vh"
        :show-legend="true"
        :area-style="chartDisplayType === 'area'"
        :chart-type="chartDisplayType"
        tooltip-size="small"
      />
    </ChartZoomModal>
  </div>
</template>

<style scoped lang="scss">
.graph-panel {
  display: flex;
  flex-direction: column;
  background: var(--n-card-color);
  border: 1px solid var(--k8s-border-color, var(--n-border-color));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
  height: 100%;

  :global(html.dark) & {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  // Mobile optimization
  @media (max-width: 768px) {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--k8s-border-color, var(--n-border-color));
  min-height: 56px;
  background: var(--n-color);

  // Mobile optimization
  @media (max-width: 768px) {
    padding: 12px 16px;
    min-height: 48px;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--n-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  // Mobile optimization
  @media (max-width: 768px) {
    font-size: 14px;
    flex: 1;
    min-width: 0;
  }
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;

  // Mobile optimization
  @media (max-width: 768px) {
    gap: 2px;
  }
}

.action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  transition: all 0.2s ease;
  border-radius: 6px;

  &:hover {
    opacity: 1;
    background: var(--n-color-hover);
  }

  // Mobile optimization
  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
}

.chart-area {
  position: relative;
  flex: 1;
  min-height: 200px;
  padding: 20px;
  overflow: hidden;
  background: var(--n-card-color);

  & > * {
    width: 100%;
    height: 100%;
  }

  // Mobile optimization
  @media (max-width: 768px) {
    padding: 16px;
    min-height: 180px;
  }

  // Stat Card Widget (Overview style - vertical layout with left border)
  .stat-card-widget {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    padding: 16px 20px;
    border: 1px solid var(--k8s-border-color, var(--n-border-color));
    border-left-width: 4px;
    border-left-color: var(--n-primary-color);
    border-radius: 8px;
    background: var(--n-card-color);

    // Dark mode: darker background for better contrast
    :global(html.dark) & {
      background: #1e293b;
    }

    .stat-value-large {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 8px;
      // Color is set via inline style to use widget.options.valueColor or fallback to primary
    }

    .stat-value-colorful {
      color: #3b82f6 !important;
    }
  }

  .stat-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;

    .stat-icon-small {
      font-size: 14px;
      color: var(--n-text-color-3);
    }

    .stat-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--n-text-color-3);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
  }

  .stat-trend {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--n-text-color-2);
  }

  // Adjust StatPanel styling when inside GraphPanel
  :deep(.stat-panel) {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    min-height: auto !important;
    background: transparent !important;
    border-radius: 0 !important;
    border-left: none !important;

    // Mobile optimization for StatPanel
    @media (max-width: 768px) {
      padding: 0 !important;
    }
  }

  // Adjust GaugeChart wrapper when inside GraphPanel
  :deep(.gauge-chart-wrapper.with-border) {
    border: 2px solid var(--k8s-border-color, var(--n-border-color));
    border-radius: 8px;
    padding: 16px;
    background: var(--n-color);

    @media (max-width: 768px) {
      border-width: 1.5px;
      border-radius: 6px;
      padding: 12px;
    }
  }
}

.chart-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--n-modal-color);
  z-index: 10;
  pointer-events: none;
}

.text-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: var(--n-text-color-2);

  // Mobile optimization
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 13px;
  }
}

.fallback-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--n-text-color-3);

  // Mobile optimization
  @media (max-width: 768px) {
    gap: 6px;

    :deep(svg) {
      font-size: 24px !important;
    }
  }
}

.fallback-label {
  font-size: 12px;
  text-transform: capitalize;

  // Mobile optimization
  @media (max-width: 768px) {
    font-size: 11px;
  }
}
</style>
