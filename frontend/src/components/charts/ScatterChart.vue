<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { ScatterChart as EScatterChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from "echarts/components";
import type { EChartsOption } from "echarts";
import { Icon } from "@iconify/vue";
import { useAppStore } from "@/store";
import {
  chartLayout,
  createTooltipConfig,
  getTooltipColors,
  getTooltipSize,
  type TooltipSize,
} from "@/config/theme";
import { registerChart, unregisterChart } from "@/composables/useChartGroup";
import { formatTimeRangeSuffix } from "@/utils";
import type { TraceScatterPoint } from "@/types";
import dayjs from "dayjs";

use([
  CanvasRenderer,
  EScatterChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
]);

const props = withDefaults(
  defineProps<{
    data: TraceScatterPoint[];
    title?: string;
    height?: string;
    groupId?: string;
    noSync?: boolean;
    hideTimeBadge?: boolean;
    tooltipSize?: TooltipSize;
    timeRange?: { start: number; end: number };
  }>(),
  {
    height: "300px",
    groupId: "traces-dashboard",
    noSync: false,
    hideTimeBadge: false,
    tooltipSize: "medium",
  },
);

const emit = defineEmits<{
  (e: "click", traceId: string): void;
}>();

const appStore = useAppStore();
const chartRef = ref<InstanceType<typeof VChart>>();

// Get time range display from global store
const timeRangeDisplay = computed(() => {
  const { start, end } = appStore.globalTimeRange;
  return formatTimeRangeSuffix(start, end);
});

// Colors for success/error traces
const successColor = "#22c55e";
const errorColor = "#ef4444";

// Format duration for display
function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Separate data into success and error series
const successData = computed(() =>
  props.data
    .filter((p) => !p.hasError)
    .map((p) => ({
      value: [p.timestamp, p.duration],
      traceId: p.traceId,
      spanCount: p.spanCount,
      serviceName: p.serviceName,
      operationName: p.operationName,
    })),
);

const errorData = computed(() =>
  props.data
    .filter((p) => p.hasError)
    .map((p) => ({
      value: [p.timestamp, p.duration],
      traceId: p.traceId,
      spanCount: p.spanCount,
      serviceName: p.serviceName,
      operationName: p.operationName,
    })),
);

const option = computed<EChartsOption>(() => ({
  backgroundColor: "transparent",
  title: props.title
    ? {
        text: props.title,
        left: "center",
        textStyle: {
          fontSize: 14,
          fontWeight: 500,
          color: appStore.isDarkMode ? "#e5e7eb" : "#374151",
        },
      }
    : undefined,
  tooltip: {
    trigger: "item",
    ...createTooltipConfig(appStore.isDarkMode, props.tooltipSize),
    formatter: (params: any) => {
      const data = params.data;
      const zone = appStore.chartTimezone;
      const time =
        zone === "UTC"
          ? dayjs.utc(data.value[0]).format("YYYY-MM-DD HH:mm:ss")
          : dayjs(data.value[0]).tz(zone).format("YYYY-MM-DD HH:mm:ss");
      const duration = formatDuration(data.value[1]);
      const { labelColor, valueColor, borderColor } = getTooltipColors(
        appStore.isDarkMode,
      );
      const sizeConfig = getTooltipSize(props.tooltipSize);
      return `
        <table style="border-collapse: collapse; min-width: ${sizeConfig.minWidth}px;">
          <tr style="border-bottom: 1px solid ${borderColor};">
            <td style="padding: ${sizeConfig.cellPadding}px 0; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px;">Service:</td>
            <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 10px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${data.serviceName}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderColor};">
            <td style="padding: ${sizeConfig.cellPadding}px 0; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px;">Operation:</td>
            <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 10px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${data.operationName}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderColor};">
            <td style="padding: ${sizeConfig.cellPadding}px 0; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px;">Duration:</td>
            <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 10px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${duration}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderColor};">
            <td style="padding: ${sizeConfig.cellPadding}px 0; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px;">Spans:</td>
            <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 10px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${data.spanCount}</td>
          </tr>
          <tr>
            <td style="padding: ${sizeConfig.cellPadding}px 0; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px;">Time:</td>
            <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 10px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${time}</td>
          </tr>
        </table>
      `;
    },
  },
  legend: {
    show: true,
    bottom: chartLayout.legend.bottom,
    // ScatterChart only has 2 items (Success/Error) - always centered
    left: "center",
    padding: chartLayout.legend.padding,
    type: "scroll",
    pageButtonItemGap: 5,
    pageButtonGap: 10,
    pageIconColor: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
    pageIconInactiveColor: appStore.isDarkMode ? "#475569" : "#d1d5db",
    pageTextStyle: {
      color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
    },
    textStyle: {
      color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
      fontWeight: "bold",
    },
    // No truncation - show full names
    tooltip: {
      show: true,
    },
    data: ["Success", "Error"],
  },
  grid: {
    left: chartLayout.grid.scatter.left,
    right: chartLayout.grid.scatter.right,
    top: 20,
    bottom: chartLayout.getGridBottom({
      hasLegend: true,
      hasZoom: true,
      chartType: "bar",
      containLabel: true, // ScatterChart uses containLabel, so no extra x-axis space needed
    }),
    containLabel: true,
  },
  xAxis: {
    type: "time",
    min: props.timeRange?.start ?? undefined,
    max: props.timeRange?.end ?? undefined,
    axisLine: {
      show: true,
      lineStyle: { color: appStore.isDarkMode ? "#334155" : "#e5e7eb" },
    },
    axisTick: {
      show: true,
      lineStyle: { color: appStore.isDarkMode ? "#475569" : "#d1d5db" },
    },
    axisLabel: {
      show: true,
      color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
      fontSize: 11,
      margin: 8,
      formatter: (value: number) => {
        const zone = appStore.chartTimezone;
        return zone === "UTC"
          ? dayjs.utc(value).format("HH:mm")
          : dayjs.utc(value).tz(zone).format("HH:mm");
      },
    },
    splitLine: {
      lineStyle: { color: appStore.isDarkMode ? "#1e293b" : "#f3f4f6" },
    },
  },
  yAxis: {
    type: "value",
    name: "Duration (ms)",
    nameLocation: "end",
    nameGap: 6,
    nameRotate: 0,
    nameTextStyle: {
      color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
      fontSize: 11,
      fontWeight: "bold",
      align: "left",
    },
    axisLine: { show: false },
    axisLabel: {
      show: true,
      color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
      fontSize: 11,
      margin: 8,
      formatter: (value: number) => formatDuration(value),
    },
    splitLine: {
      lineStyle: { color: appStore.isDarkMode ? "#1e293b" : "#f3f4f6" },
    },
  },
  dataZoom: [
    {
      type: "inside",
      xAxisIndex: 0,
      yAxisIndex: 0,
    },
    {
      type: "slider",
      xAxisIndex: 0,
      start: 0,
      end: 100,
      height: chartLayout.zoom.height.timeSeries,
      bottom: chartLayout.getZoomBottom(true),
      left: chartLayout.grid.scatter.left,
      right: chartLayout.grid.scatter.right,
      borderColor: appStore.isDarkMode ? "#334155" : "#e5e7eb",
      backgroundColor: appStore.isDarkMode ? "#1e293b" : "#f8fafc",
      fillerColor: appStore.isDarkMode
        ? "rgba(59, 130, 246, 0.3)"
        : "rgba(59, 130, 246, 0.2)",
      handleStyle: {
        color: appStore.isDarkMode ? "#3b82f6" : "#3b82f6",
        borderColor: appStore.isDarkMode ? "#60a5fa" : "#2563eb",
      },
      textStyle: {
        color: appStore.isDarkMode ? "#e5e7eb" : "#374151",
      },
      dataBackground: {
        lineStyle: {
          color: appStore.isDarkMode ? "#475569" : "#cbd5e1",
        },
        areaStyle: {
          color: appStore.isDarkMode ? "#334155" : "#e2e8f0",
        },
      },
    },
  ],
  series: [
    {
      name: "Success",
      type: "scatter",
      data: successData.value,
      symbolSize: (data: any) => {
        // Scale symbol size based on span count (min 6, max 20)
        const spanCount = data.spanCount || 5;
        return Math.min(20, Math.max(6, Math.log(spanCount) * 4 + 6));
      },
      itemStyle: {
        color: successColor,
        opacity: 0.7,
      },
      emphasis: {
        itemStyle: {
          opacity: 1,
          shadowBlur: 10,
          shadowColor: successColor,
        },
      },
    },
    {
      name: "Error",
      type: "scatter",
      data: errorData.value,
      symbolSize: (data: any) => {
        const spanCount = data.spanCount || 5;
        return Math.min(20, Math.max(6, Math.log(spanCount) * 4 + 6));
      },
      itemStyle: {
        color: errorColor,
        opacity: 0.7,
      },
      emphasis: {
        itemStyle: {
          opacity: 1,
          shadowBlur: 10,
          shadowColor: errorColor,
        },
      },
    },
  ],
}));

// Handle click on scatter point
function handleClick(params: any) {
  if (params.data?.traceId) {
    emit("click", params.data.traceId);
  }
}

watch(
  () => appStore.isDarkMode,
  () => {
    chartRef.value?.resize();
  },
);

// Register chart for synchronized crosshairs (unless noSync is set)
onMounted(() => {
  if (props.noSync) return;
  setTimeout(() => {
    const chart = chartRef.value?.chart;
    if (chart) {
      registerChart(chart, props.groupId);
    }
  }, 100);
});

onUnmounted(() => {
  if (props.noSync) return;
  const chart = chartRef.value?.chart;
  if (chart) {
    unregisterChart(chart, props.groupId);
  }
});
</script>

<template>
  <div class="scatter-chart-wrapper">
    <v-chart
      ref="chartRef"
      :option="option"
      :style="{ height, width: '100%' }"
      autoresize
      @click="handleClick"
    />
    <!-- Time range badge -->
    <div v-if="timeRangeDisplay && !hideTimeBadge" class="time-range-badge">
      <Icon icon="carbon:time" :width="12" :height="12" />
      <span>{{ timeRangeDisplay }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.scatter-chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.time-range-badge {
  position: absolute;
  bottom: 8px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  z-index: 100;
}
</style>
