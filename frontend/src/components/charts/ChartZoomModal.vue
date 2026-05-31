<script setup lang="ts">
import { computed, ref, watch, useSlots, nextTick, provide } from "vue";
import { Icon } from "@iconify/vue";
import * as echarts from "echarts/core";
import TimeSeriesChart from "./TimeSeriesChart.vue";
import HeatmapChart from "./HeatmapChart.vue";
import ScatterChart from "./ScatterChart.vue";
import type { HeatmapDataPoint } from "./HeatmapChart.vue";
import type { TraceScatterPoint } from "@/types";
import type { ChartDisplayType } from "./ChartTypeToggle.vue";
import { useAppStore } from "@/store";
import { chartColors, formatChartValue } from "@/config/theme";
import { formatTimeRangeSuffix } from "@/utils";
import dayjs from "dayjs";

const slots = useSlots();

// Provide zoom mode flag so child charts can use full height
provide("isInZoomModal", true);

interface SeriesData {
  name: string;
  data: Array<[number, number]>;
  color?: string;
}

const props = withDefaults(
  defineProps<{
    show: boolean;
    title?: string;
    height?: string;
    chartType?: ChartDisplayType;
    showChartTypeToggle?: boolean;
    series?: SeriesData[];
    unit?: string;
    areaStyle?: boolean;
    embedChart?: boolean; // When true, renders TimeSeriesChart directly instead of using slot
    tooltipSize?: "small" | "medium" | "standard";
    /** Override heatmap data — renders HeatmapChart directly in modal (avoids slot height issues) */
    overrideHeatmapData?: {
      xCategories: string[];
      yCategories: string[];
      data: HeatmapDataPoint[];
      maxValue?: number;
    };
    /** Override scatter data — renders ScatterChart directly in modal (avoids slot height issues) */
    overrideScatterData?: TraceScatterPoint[];
    /** Fixed time badge label (e.g. "30d") — overrides the computed global time range label */
    overrideTimeBadge?: string;
  }>(),
  {
    title: "Chart View",
    height: "80vh",
    showChartTypeToggle: true,
    unit: "",
    areaStyle: false,
    embedChart: false,
    tooltipSize: "small",
  },
);

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "update:chartType", value: ChartDisplayType): void;
  (e: "close"): void;
}>();

const appStore = useAppStore();
const chartContainerRef = ref<HTMLElement>();
const embeddedChartRef = ref<InstanceType<typeof TimeSeriesChart>>();

// Controls whether heatmap/scatter render — delayed so they mount AFTER modal animation
const showHeatmap = ref(false);
const showScatter = ref(false);

// Pixel height for embedded heatmap/scatter.
// Computed from the container's actual offsetHeight after the modal animation settles.
// Using px (not % or vh) guarantees ECharts reads the right value at init time.
const embeddedChartHeight = ref("600px");

// Determine if we should use embedded chart (when embedChart is true or no slot content)
const useEmbeddedChart = computed(() => {
  return (
    props.embedChart ||
    (!slots.default && props.series && props.series.length > 0)
  );
});

// Track hovered data point
const hoveredDataIndex = ref<number | null>(null);
const hoveredTime = ref<string | null>(null);

// Track visible data range (for zoom)
const visibleRange = ref<{ start: number; end: number }>({
  start: 0,
  end: 100,
});

// Track hidden series (by name) for toggle functionality
const hiddenSeries = ref<Set<string>>(new Set());

// Guard flag to prevent legendselectchanged handler from re-syncing
// when the change originated from our own dispatchAction call.
let skipLegendSync = false;

// Toggle series visibility via right-panel legend click.
// Updates hiddenSeries ref for the right-panel UI, then dispatches
// legendToggleSelect directly to ECharts (setOption with legend.selected
// does not reliably toggle series after initialization).
function toggleSeries(seriesName: string) {
  const newHidden = new Set(hiddenSeries.value);
  if (newHidden.has(seriesName)) {
    newHidden.delete(seriesName);
  } else {
    newHidden.add(seriesName);
  }
  hiddenSeries.value = newHidden;

  // Dispatch legend toggle directly to the chart instance
  const chart = useEmbeddedChart.value
    ? embeddedChartRef.value?.getChartInstance?.()
    : connectedChart.value;
  if (chart) {
    skipLegendSync = true;
    chart.dispatchAction({
      type: "legendToggleSelect",
      name: seriesName,
    });
    skipLegendSync = false;
  }
}

// Check if a series is hidden
function isSeriesHidden(seriesName: string): boolean {
  return hiddenSeries.value.has(seriesName);
}

const visible = computed({
  get: () => props.show,
  set: (value: boolean) => {
    emit("update:show", value);
    if (!value) emit("close");
  },
});

// Get colors for legend
const colors = computed(() =>
  appStore.isDarkMode ? chartColors.dark : chartColors.light,
);

// Get time range display from global store
const timeRangeDisplay = computed(() => {
  const { start, end } = appStore.globalTimeRange;
  return formatTimeRangeSuffix(start, end);
});

// Check if we have series data to show legend
const hasLegend = computed(() => props.series && props.series.length > 0);

// Heatmap legend panel: shown when overrideHeatmapData has data
const hasHeatmapLegend = computed(
  () => !!(props.overrideHeatmapData && props.overrideHeatmapData.data.length > 0),
);

const heatmapBucketCount = computed(() => {
  if (!props.overrideHeatmapData) return 0;
  return new Set(props.overrideHeatmapData.data.map((d) => d.x)).size;
});

function calcHeatmapSeriesStats(points: Array<{ x: number; value: number }>) {
  if (points.length === 0) return { min: 0, max: 0, avg: 0, last: 0 };
  const values = points.map((p) => p.value);
  const maxX = Math.max(...points.map((p) => p.x));
  const lastSlotTotal = points
    .filter((p) => p.x === maxX)
    .reduce((s, p) => s + p.value, 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
    last: lastSlotTotal,
  };
}

const heatmapLatencyStats = computed(() => {
  const pts = (props.overrideHeatmapData?.data ?? [])
    .filter((d) => !d.isError)
    .map((d) => ({ x: d.x, value: d.value }));
  return calcHeatmapSeriesStats(pts);
});

const heatmapErrorStats = computed(() => {
  const pts = (props.overrideHeatmapData?.data ?? [])
    .filter((d) => d.isError)
    .map((d) => ({ x: d.x, value: d.value }));
  return calcHeatmapSeriesStats(pts);
});

const heatmapTotalCount = computed(() =>
  (props.overrideHeatmapData?.data ?? []).reduce((s, d) => s + d.value, 0),
);

// Check if single series for special stats display
const isSingleSeries = computed(
  () => props.series && props.series.length === 1,
);

// Check if exactly 2 series for 2x2 grid layout (Design 3)
const isTwoSeries = computed(() => props.series && props.series.length === 2);

// Computed legend selected state for TimeSeriesChart prop binding.
// Always returns an explicit object so chart option merges preserve state
// (e.g. after chart type changes that cause option recompute).
const legendSelected = computed(() => {
  if (!props.series) return undefined;
  const selected: Record<string, boolean> = {};
  props.series.forEach((s) => {
    selected[s.name] = !hiddenSeries.value.has(s.name);
  });
  return selected;
});

// Filter data based on visible range (percentage 0-100)
function getVisibleData(
  data: Array<[number, number]>,
): Array<[number, number]> {
  if (data.length === 0) return data;

  const startIdx = Math.floor((visibleRange.value.start / 100) * data.length);
  const endIdx = Math.ceil((visibleRange.value.end / 100) * data.length);

  return data.slice(startIdx, endIdx);
}

// Calculate stats for data
function calculateStats(data: Array<[number, number]>) {
  if (data.length === 0) return { min: 0, max: 0, avg: 0, last: 0 };

  const values = data.map((d) => d[1]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
  const last = values[values.length - 1];

  return { min, max, avg, last };
}

// Single series stats (based on visible range)
const singleSeriesStats = computed(() => {
  if (!props.series || props.series.length !== 1) return null;
  const data = getVisibleData(props.series[0].data);
  return calculateStats(data);
});

// Visible points count (works for both single and multi-series - sums all series)
const visiblePointsCount = computed(() => {
  if (!props.series || props.series.length === 0) return 0;
  return props.series.reduce(
    (sum, s) => sum + getVisibleData(s.data).length,
    0,
  );
});

// Total points count (works for both single and multi-series - sums all series)
const totalPointsCount = computed(() => {
  if (!props.series || props.series.length === 0) return 0;
  return props.series.reduce((sum, s) => sum + s.data.length, 0);
});

// Single series color
const singleSeriesColor = computed(() => {
  if (!props.series || props.series.length !== 1) return colors.value[0];
  return props.series[0].color || colors.value[0];
});

// Get current value when hovering (for single series)
const currentHoverValue = computed(() => {
  if (
    !props.series ||
    props.series.length !== 1 ||
    hoveredDataIndex.value === null
  )
    return null;
  const data = props.series[0].data;
  if (hoveredDataIndex.value >= 0 && hoveredDataIndex.value < data.length) {
    return data[hoveredDataIndex.value][1];
  }
  return null;
});

// Get value at specific data index
function getValueAtIndex(data: Array<[number, number]>, index: number): number {
  if (index >= 0 && index < data.length) {
    return data[index][1];
  }
  return 0;
}

// Compute legend items with colors and stats for each series (for multi-series)
// Stats are based on the visible range
// Colors: use series.color if provided, otherwise use theme colors (reliable fallback)
const legendItems = computed(() => {
  if (!props.series) return [];

  return props.series.map((s, index) => {
    // Simple, reliable color logic: series.color > theme colors
    const color = s.color || colors.value[index % colors.value.length];
    const visibleData = getVisibleData(s.data);
    const stats = calculateStats(visibleData);
    const currentValue =
      hoveredDataIndex.value !== null
        ? getValueAtIndex(s.data, hoveredDataIndex.value)
        : null;

    return {
      name: s.name,
      color,
      min: stats.min,
      max: stats.max,
      avg: stats.avg,
      last: stats.last,
      current: currentValue,
      visiblePoints: visibleData.length,
      totalPoints: s.data.length,
    };
  });
});

function formatValue(val: number): string {
  return formatChartValue(val, props.unit, 1);
}

// When unit is byte-based, formatChartValue already includes the unit suffix (e.g. "33.3 GiB"),
// so we suppress the extra {{ unit }} in the template to avoid double display.
const BYTE_UNITS = new Set(["bytes", "byte", "b", "B", "Bi", "bi", "bytespersec", "bytes/s", "B/s"]);
const displayUnit = computed(() => {
  if (props.unit && BYTE_UNITS.has(props.unit)) return "";
  return props.unit ?? "";
});

function setChartType(type: ChartDisplayType) {
  emit("update:chartType", type);
}

function closeModal() {
  visible.value = false;
}

// Track connected chart instance to avoid duplicate listeners
const connectedChart = ref<any>(null);

// Setup chart event listeners by finding chart in container
function setupChartListeners() {
  if (!props.series) return;

  // For embedded chart, use the ref directly
  if (useEmbeddedChart.value && embeddedChartRef.value) {
    const chartInstance = embeddedChartRef.value.getChartInstance?.();
    if (chartInstance && chartInstance !== connectedChart.value) {
      connectedChart.value = chartInstance;
      setupChartEvents(chartInstance);
      return;
    }
  }

  // For slot content, try to find chart in container
  if (!chartContainerRef.value) return;

  // Method 1: Find canvas and traverse up to find ECharts container
  const canvasElements = chartContainerRef.value.querySelectorAll("canvas");
  for (const canvas of canvasElements) {
    let element: HTMLElement | null = canvas.parentElement;
    while (element && element !== chartContainerRef.value) {
      const chart = echarts.getInstanceByDom(element);
      if (chart && chart !== connectedChart.value) {
        connectedChart.value = chart;
        setupChartEvents(chart);
        return;
      }
      element = element.parentElement;
    }
  }

  // Method 2: Find via _echarts_instance_ attribute
  const vChartEl = chartContainerRef.value.querySelector(
    "[_echarts_instance_]",
  );
  if (vChartEl) {
    const chart = echarts.getInstanceByDom(vChartEl as HTMLElement);
    if (chart && chart !== connectedChart.value) {
      connectedChart.value = chart;
      setupChartEvents(chart);
      return;
    }
  }

  // Method 3: Try all div elements
  const divElements = chartContainerRef.value.querySelectorAll("div");
  for (const div of divElements) {
    const chart = echarts.getInstanceByDom(div as HTMLElement);
    if (chart && chart !== connectedChart.value) {
      connectedChart.value = chart;
      setupChartEvents(chart);
      return;
    }
  }
}

// Helper to update visible range from chart
function updateVisibleRangeFromChart(chartInstance: any) {
  const option = chartInstance.getOption();
  if (option.dataZoom && option.dataZoom.length > 0) {
    const zoom = option.dataZoom[0];
    const newStart = zoom.start ?? 0;
    const newEnd = zoom.end ?? 100;
    // Only update if changed to avoid unnecessary reactivity
    if (
      visibleRange.value.start !== newStart ||
      visibleRange.value.end !== newEnd
    ) {
      visibleRange.value = { start: newStart, end: newEnd };
    }
  }
}

function setupChartEvents(chartInstance: any) {
  // Listen for updateAxisPointer event (triggered when hovering)
  chartInstance.on("updateAxisPointer", (params: any) => {
    if (params.axesInfo && params.axesInfo.length > 0) {
      const axisInfo = params.axesInfo[0];
      if (axisInfo.seriesDataIndices && axisInfo.seriesDataIndices.length > 0) {
        const dataIndex = axisInfo.seriesDataIndices[0].dataIndex;
        hoveredDataIndex.value = dataIndex;
        if (props.series && props.series[0]?.data[dataIndex]) {
          const timestamp = props.series[0].data[dataIndex][0];
          const zone = appStore.chartTimezone;
          hoveredTime.value =
            zone === "UTC"
              ? dayjs.utc(timestamp).format("HH:mm:ss")
              : dayjs.utc(timestamp).tz(zone).format("HH:mm:ss");
        }
      }
    }
  });

  // Listen for legend selection changes (from bottom ECharts legend clicks).
  // Syncs our hiddenSeries ref to keep the right-panel legend UI in sync.
  // Skip when the change originated from our own dispatchAction in toggleSeries.
  chartInstance.on("legendselectchanged", (params: any) => {
    if (skipLegendSync) return;
    if (params.selected && props.series) {
      const newHidden = new Set<string>();
      props.series.forEach((s) => {
        if (params.selected[s.name] === false) {
          newHidden.add(s.name);
        }
      });
      hiddenSeries.value = newHidden;
    }
  });

  // Listen for dataZoom event (triggered when zooming via slider or inside)
  // Use both event name formats for compatibility
  const handleDataZoom = () => {
    updateVisibleRangeFromChart(chartInstance);
  };

  chartInstance.on("dataZoom", handleDataZoom);
  chartInstance.on("datazoom", handleDataZoom);

  // Also listen for finished event which fires after any chart update
  chartInstance.on("finished", () => {
    updateVisibleRangeFromChart(chartInstance);
  });

  // Handle mouse leave on chart
  chartInstance.getZr().on("globalout", () => {
    hoveredDataIndex.value = null;
    hoveredTime.value = null;
  });

  // Get initial zoom state
  updateVisibleRangeFromChart(chartInstance);
}

// Force resize on all ECharts instances inside the chart container.
// Called after modal open animation completes so canvas dimensions are correct.
function resizeChartsInContainer() {
  if (!chartContainerRef.value) return;
  const divElements = chartContainerRef.value.querySelectorAll("div");
  for (const div of divElements) {
    const chart = echarts.getInstanceByDom(div as HTMLElement);
    if (chart) {
      chart.resize();
    }
  }
}

// Helper to reconnect to chart after DOM changes
async function reconnectChart() {
  // Clear old connection but preserve hidden series state
  connectedChart.value = null;

  // Wait for DOM to render, then try to find chart with retries
  await nextTick();
  let retries = 0;
  const maxRetries = 5;
  const tryConnect = () => {
    setupChartListeners();
    if (!connectedChart.value && retries < maxRetries) {
      retries++;
      setTimeout(tryConnect, 200);
    } else if (connectedChart.value) {
      // Hidden state is automatically applied via legendSelected prop binding
    }
  };
  setTimeout(tryConnect, 300);
}

// Watch for modal open to setup listeners
watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      // Reset state when modal opens
      visibleRange.value = { start: 0, end: 100 };
      connectedChart.value = null;
      hoveredDataIndex.value = null;
      hoveredTime.value = null;
      hiddenSeries.value = new Set();
      showHeatmap.value = false;
      showScatter.value = false;

      if (props.series) {
        await reconnectChart();
      }

      // Delay mounting heatmap/scatter until modal animation has settled.
      // 1. Measure actual container height (avoids % / vh propagation issues in nested flex).
      // 2. Set px height then mount — ECharts reads offsetHeight and gets the right value.
      setTimeout(async () => {
        // Use viewport-based px — equivalent to "72vh" but as an absolute pixel value.
        // Avoids relying on flex-determined offsetHeight which may be near-zero before content mounts.
        embeddedChartHeight.value = `${Math.round(window.innerHeight * 0.72)}px`;

        if (props.overrideHeatmapData?.data.length) showHeatmap.value = true;
        if (props.overrideScatterData?.length) showScatter.value = true;

        // After Vue mounts the chart, trigger resize to handle any remaining layout shift
        await nextTick();
        resizeChartsInContainer();
      }, 350);
    } else {
      // Reset state when modal closes
      hoveredDataIndex.value = null;
      hoveredTime.value = null;
      visibleRange.value = { start: 0, end: 100 };
      connectedChart.value = null;
      hiddenSeries.value = new Set();
      showHeatmap.value = false;
      showScatter.value = false;
      embeddedChartHeight.value = "600px";
    }
  },
);

// Watch for chart type changes - reconnect to new chart instance
watch(
  () => props.chartType,
  async (newVal, oldVal) => {
    if (props.show && newVal !== oldVal) {
      // Chart type changed while modal is open, need to reconnect
      await reconnectChart();
    }
  },
);
</script>

<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    class="chart-zoom-modal"
    :style="{ width: '95vw', height: '90vh', maxWidth: '1800px' }"
    :bordered="false"
    :closable="false"
    size="huge"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-title-section">
          <Icon icon="carbon:chart-line-data" class="modal-title-icon" />
          <span class="modal-title">{{ title }}</span>
          <n-tag
            v-if="overrideTimeBadge || timeRangeDisplay"
            size="small"
            :bordered="false"
            type="info"
            class="time-range-tag"
          >
            <template #icon>
              <Icon icon="carbon:time" :width="12" :height="12" />
            </template>
            {{ overrideTimeBadge || timeRangeDisplay }}
          </n-tag>
        </div>
        <div class="modal-actions">
          <n-button-group
            v-if="chartType !== undefined && showChartTypeToggle"
            size="small"
          >
            <n-button
              :type="chartType === 'line' ? 'primary' : 'default'"
              @click="setChartType('line')"
            >
              <template #icon>
                <Icon icon="carbon:chart-line" />
              </template>
            </n-button>
            <n-button
              :type="chartType === 'area' ? 'primary' : 'default'"
              @click="setChartType('area')"
            >
              <template #icon>
                <Icon icon="carbon:chart-area" />
              </template>
            </n-button>
            <n-button
              :type="chartType === 'bar' ? 'primary' : 'default'"
              @click="setChartType('bar')"
            >
              <template #icon>
                <Icon icon="carbon:table" />
              </template>
            </n-button>
          </n-button-group>
          <n-button text class="close-btn" @click="closeModal">
            <template #icon>
              <Icon icon="carbon:close" :width="20" :height="20" />
            </template>
          </n-button>
        </div>
      </div>
    </template>

    <div class="zoom-content" :class="{ 'with-legend': hasLegend || hasHeatmapLegend }">
      <div
        ref="chartContainerRef"
        class="zoom-chart-container"
        :style="{ height }"
      >
        <!-- Embedded TimeSeriesChart when no slot content provided -->
        <TimeSeriesChart
          v-if="useEmbeddedChart && series"
          ref="embeddedChartRef"
          :series="series"
          :unit="unit"
          :height="height"
          show-legend
          :chart-type="chartType"
          :area-style="areaStyle"
          :legend-selected="legendSelected"
          :tooltip-size="tooltipSize"
          show-zoom
          no-sync
          hide-time-badge
        />
        <!-- Heatmap — rendered directly to avoid slot height issues -->
        <!-- Mount is delayed (showHeatmap) so ECharts initializes after modal animation completes -->
        <HeatmapChart
          v-else-if="showHeatmap && overrideHeatmapData && overrideHeatmapData.data.length > 0"
          :key="'heatmap-modal'"
          :x-categories="overrideHeatmapData.xCategories"
          :y-categories="overrideHeatmapData.yCategories"
          :data="overrideHeatmapData.data"
          :max-value="overrideHeatmapData.maxValue"
          :height="embeddedChartHeight"
          tooltip-size="small"
          show-zoom
          no-sync
          hide-time-badge
        />
        <!-- Scatter — rendered directly to avoid slot height issues -->
        <!-- Mount is delayed (showScatter) so ECharts initializes after modal animation completes -->
        <ScatterChart
          v-else-if="showScatter && overrideScatterData && overrideScatterData.length > 0"
          :key="'scatter-modal'"
          :data="overrideScatterData"
          :height="embeddedChartHeight"
          tooltip-size="small"
          no-sync
          hide-time-badge
        />
        <!-- Slot content for other custom charts -->
        <slot v-else />
      </div>

      <!-- Heatmap Legend Panel -->
      <div v-if="hasHeatmapLegend" class="legend-panel heatmap-legend-panel">
        <div class="legend-header">
          <span class="legend-title">Legend</span>
          <n-tag size="small" :bordered="false" type="info">2 series</n-tag>
        </div>
        <div class="visible-points-row">
          <Icon icon="carbon:data-vis-1" :width="14" :height="14" />
          <span class="visible-points-text">{{ heatmapBucketCount }} time buckets</span>
        </div>

        <!-- Latency series stats -->
        <div class="single-series-content">
          <div class="series-name-row">
            <span class="legend-color" style="background: #3b82f6" />
            <span class="series-name">Latency</span>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">MIN</span>
              <span class="stat-value min">{{ heatmapLatencyStats.min.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">MAX</span>
              <span class="stat-value max">{{ heatmapLatencyStats.max.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">AVG</span>
              <span class="stat-value avg">{{ heatmapLatencyStats.avg.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">LAST</span>
              <span class="stat-value last">{{ heatmapLatencyStats.last.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Errors series stats -->
        <div class="single-series-content" style="border-top: 1px solid var(--n-border-color); margin-top: 0;">
          <div class="series-name-row">
            <span class="legend-color" style="background: #ef4444" />
            <span class="series-name">Errors</span>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">MIN</span>
              <span class="stat-value min">{{ heatmapErrorStats.min.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">MAX</span>
              <span class="stat-value max">{{ heatmapErrorStats.max.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">AVG</span>
              <span class="stat-value avg">{{ heatmapErrorStats.avg.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">LAST</span>
              <span class="stat-value last">{{ heatmapErrorStats.last.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <div class="heatmap-total-row">
          <span class="heatmap-total-label">Total requests</span>
          <span class="heatmap-total-value">{{ heatmapTotalCount.toLocaleString() }}</span>
        </div>
      </div>

      <!-- Legend Panel (only shown when series data is provided) -->
      <div
        v-if="hasLegend"
        class="legend-panel"
        :class="{ 'single-series': isSingleSeries, 'two-series': isTwoSeries }"
      >
        <div class="legend-header">
          <span class="legend-title">Legend</span>
          <n-tag size="small" :bordered="false" type="info">
            {{ series?.length }} series
          </n-tag>
        </div>

        <!-- Global visible points indicator (same position for both designs) -->
        <div class="visible-points-row">
          <Icon icon="carbon:data-vis-1" :width="14" :height="14" />
          <span class="visible-points-text">
            {{ visiblePointsCount }} / {{ totalPointsCount }} points
          </span>
        </div>

        <!-- Single Series: Show MIN, MAX, AVG, LAST stats -->
        <div
          v-if="isSingleSeries && singleSeriesStats"
          class="single-series-content"
          :class="{
            'is-hidden': series?.[0] && isSeriesHidden(series[0].name),
          }"
        >
          <div
            class="series-name-row clickable"
            @click="series?.[0] && toggleSeries(series[0].name)"
          >
            <span
              class="legend-color"
              :style="{
                backgroundColor:
                  series?.[0] && isSeriesHidden(series[0].name)
                    ? 'var(--n-text-color-3)'
                    : singleSeriesColor,
              }"
            />
            <span class="series-name">{{ series?.[0]?.name }}</span>
            <span
              v-if="series?.[0] && isSeriesHidden(series[0].name)"
              class="hidden-badge"
            >Hidden</span>
          </div>

          <!-- Current value when hovering -->
          <div
            v-if="
              currentHoverValue !== null &&
                !(series?.[0] && isSeriesHidden(series[0].name))
            "
            class="current-value-section"
          >
            <div class="current-value-label">
              <Icon icon="carbon:location" :width="14" :height="14" />
              {{ hoveredTime }}
            </div>
            <div class="current-value">
              {{ formatValue(currentHoverValue) }} {{ displayUnit }}
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">MIN</span>
              <span class="stat-value min">{{ formatValue(singleSeriesStats.min) }} {{ displayUnit }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">MAX</span>
              <span class="stat-value max">{{ formatValue(singleSeriesStats.max) }} {{ displayUnit }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">AVG</span>
              <span class="stat-value avg">{{ formatValue(singleSeriesStats.avg) }} {{ displayUnit }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">LAST</span>
              <span class="stat-value last">{{ formatValue(singleSeriesStats.last) }} {{ displayUnit }}</span>
            </div>
          </div>
        </div>

        <!-- Multi Series: Show compact stats for each -->
        <div v-else class="multi-series-content">
          <!-- Current time indicator when hovering -->
          <div v-if="hoveredTime" class="hover-time-indicator">
            <Icon icon="carbon:location" :width="12" :height="12" />
            <span>{{ hoveredTime }}</span>
          </div>

          <div class="series-list">
            <div
              v-for="item in legendItems"
              :key="item.name"
              class="series-item"
              :class="{ 'is-hidden': isSeriesHidden(item.name) }"
              @click="toggleSeries(item.name)"
            >
              <div class="series-header">
                <span
                  class="legend-color"
                  :style="{ backgroundColor: item.color }"
                />
                <span class="series-name-compact">{{ item.name }}</span>
                <span
                  v-if="item.current !== null && !isSeriesHidden(item.name)"
                  class="current-badge"
                >
                  {{ formatValue(item.current) }} {{ displayUnit }}
                </span>
                <span v-if="isSeriesHidden(item.name)" class="hidden-badge">Hidden</span>
              </div>
              <div class="compact-stats" :class="{ 'two-column': isTwoSeries }">
                <div class="compact-stat">
                  <span class="compact-label">MIN</span>
                  <span class="compact-value min">{{ formatValue(item.min) }} {{ displayUnit }}</span>
                </div>
                <div class="compact-stat">
                  <span class="compact-label">MAX</span>
                  <span class="compact-value max">{{ formatValue(item.max) }} {{ displayUnit }}</span>
                </div>
                <div class="compact-stat">
                  <span class="compact-label">AVG</span>
                  <span class="compact-value avg">{{ formatValue(item.avg) }} {{ displayUnit }}</span>
                </div>
                <div class="compact-stat">
                  <span class="compact-label">LAST</span>
                  <span class="compact-value last">{{ formatValue(item.last) }} {{ displayUnit }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<style scoped lang="scss">
.chart-zoom-modal {
  :deep(.n-card-header__main) {
    font-weight: 700 !important;
  }

  :deep(.n-card__content) {
    height: calc(90vh - 80px);
    padding: 0 !important;
    display: flex;
    flex-direction: column;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title-icon {
  font-size: 20px;
  color: var(--n-primary-color);
}

.modal-title {
  font-weight: 600;
  font-size: 1rem;
}

.time-range-tag {
  font-size: 0.75rem;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.close-btn {
  font-size: 20px;
  color: var(--n-text-color-3);

  &:hover {
    color: var(--n-text-color);
  }
}

.zoom-content {
  padding: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  &.with-legend {
    flex-direction: row;
    gap: 16px;
  }

  @media (max-width: 768px) {
    &.with-legend {
      flex-direction: column;
      gap: 12px;
    }
  }
}

.zoom-chart-container {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;

  // Force timeseries/bar chart wrappers (slot-based) to fill container height.
  // Do NOT include heatmap/scatter here — those use explicit px heights
  // set via embeddedChartHeight and must not be overridden to 100%.
  :deep(.bar-chart-wrapper),
  :deep(.time-series-chart-wrapper) {
    flex: 1;
    height: 100% !important;
    min-height: 0 !important;
  }

  :deep(.bar-chart-wrapper > div[style]),
  :deep(.time-series-chart-wrapper > div[style]),
  :deep(.echarts),
  :deep(div[_echarts_instance_]) {
    height: 100% !important;
    min-height: 0 !important;
  }

  @media (max-width: 768px) {
    height: 50vh !important;
    min-height: 280px;
  }
}

.legend-panel {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: var(--n-color);
  height: fit-content;
  max-height: calc(90vh - 80px);
  overflow-y: auto;

  @media (max-width: 768px) {
    width: 100%;
    max-height: 200px;
  }
}

.legend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color);
}

.legend-title {
  font-weight: 600;
  font-size: 14px;
}

.legend-table-wrapper {
  overflow-y: auto;
  max-height: calc(70vh - 50px);
}

.legend-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    position: sticky;
    top: 0;
    background: var(--n-color);
    z-index: 1;

    th {
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      color: var(--n-text-color-3);
      border-bottom: 1px solid var(--n-border-color);
      font-size: 11px;
      text-transform: uppercase;
    }

    th:last-child {
      text-align: right;
    }

    .value-header {
      transition: color 0.15s ease;

      &.is-live {
        color: var(--n-text-color);
        font-weight: 600;
      }
    }
  }

  tbody tr {
    &:hover {
      background: var(--n-color-hover);
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--n-border-color);
    }
  }
}

.legend-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.legend-value-cell {
  text-align: right;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

// Multi series compact view
.multi-series-content {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1; // Fill available space in legend panel
  min-height: 0; // Allow shrinking for overflow
}

.hover-time-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--n-primary-color);
  color: white;
  font-size: 11px;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 2;
}

.series-list {
  display: flex;
  flex-direction: column;
}

.series-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color);
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    background-color 0.15s ease;

  &:hover {
    background: var(--n-action-color);
  }

  &:last-child {
    border-bottom: none;
  }

  &.is-hidden {
    opacity: 0.4;

    .legend-color {
      background-color: var(--n-text-color-3) !important;
    }

    .compact-stats {
      opacity: 0.5;
    }
  }
}

.series-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.series-name-compact {
  flex: 1;
  font-weight: 600;
  font-size: 12px;
  color: var(--n-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.current-badge {
  background: var(--n-primary-color);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  font-variant-numeric: tabular-nums;
}

.hidden-badge {
  background: var(--n-text-color-3);
  color: var(--n-color);
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
}

.series-points {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--n-text-color-3);
  margin-bottom: 6px;
  font-variant-numeric: tabular-nums;
}

.compact-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;

  // 2x2 grid layout for 2-series charts (Design 3) - same as Design 1
  &.two-column {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

.compact-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  background: var(--n-action-color);
  border-radius: 4px;

  // Compact styling for 2-column layout
  .two-column & {
    gap: 2px;
    padding: 6px 10px;
    border-radius: 6px;
  }
}

.compact-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.3px;

  // Match Design 1 (.stat-label) styling for 2-column layout
  .two-column & {
    font-size: 10px;
    letter-spacing: 0.5px;
  }
}

.compact-value {
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--n-text-color);

  // Match Design 1 (.stat-value) styling for 2-column layout
  .two-column & {
    font-size: 16px;
  }

  &.min {
    color: #22c55e;
  }

  &.max {
    color: #ef4444;
  }

  &.avg {
    color: #3b82f6;
  }

  &.last {
    color: #8b5cf6;
  }
}

// Single series stats display
.single-series-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: opacity 0.2s ease;

  &.is-hidden {
    opacity: 0.4;

    .stats-grid {
      opacity: 0.5;
    }
  }
}

.series-name-row {
  display: flex;
  align-items: center;
  gap: 10px;

  &.clickable {
    cursor: pointer;
    padding: 8px 12px;
    margin: -8px -12px;
    border-radius: 8px;
    transition: background-color 0.15s ease;

    &:hover {
      background: var(--n-action-color);
    }
  }
}

.series-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--n-text-color);
}

.visible-points-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--n-action-color);
  color: var(--n-text-color-2);
  border-bottom: 1px solid var(--n-border-color);
}

.visible-points-text {
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.current-value-section {
  background: var(--n-action-color);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.current-value-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--n-text-color-3);
  text-transform: uppercase;
}

.current-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--n-primary-color);
  font-variant-numeric: tabular-nums;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: var(--n-action-color);
  border-radius: 8px;
}

.stat-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--n-text-color);

  &.min {
    color: #22c55e;
  }

  &.max {
    color: #ef4444;
  }

  &.avg {
    color: #3b82f6;
  }

  &.last {
    color: #8b5cf6;
  }
}

.heatmap-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--n-border-color);
}

.heatmap-total-label {
  font-size: 11px;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.heatmap-total-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color);
  font-variant-numeric: tabular-nums;
}

</style>
