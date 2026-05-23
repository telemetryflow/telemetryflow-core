<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { HeatmapChart as EHeatmapChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  DataZoomComponent,
  LegendComponent,
} from "echarts/components";
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

use([
  CanvasRenderer,
  EHeatmapChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  DataZoomComponent,
  LegendComponent,
]);

export interface HeatmapDataPoint {
  x: number; // x index (time)
  y: number; // y index (latency bucket)
  value: number; // count/intensity
  isError?: boolean;
}

const props = withDefaults(
  defineProps<{
    xCategories: string[];
    yCategories: string[];
    data: HeatmapDataPoint[];
    title?: string;
    height?: string;
    groupId?: string;
    maxValue?: number;
    noSync?: boolean;
    hideTimeBadge?: boolean;
    tooltipSize?: TooltipSize;
    showZoom?: boolean;
  }>(),
  {
    height: "300px",
    groupId: "dashboard",
    maxValue: 100,
    noSync: false,
    hideTimeBadge: false,
    tooltipSize: "medium",
    showZoom: false,
  },
);

const appStore = useAppStore();
const chartRef = ref<InstanceType<typeof VChart>>();

// Get time range display from global store
const timeRangeDisplay = computed(() => {
  const { start, end } = appStore.globalTimeRange;
  return formatTimeRangeSuffix(start, end);
});

const option = computed(() => {
  // Separate error data from regular data
  const regularData = props.data
    .filter((d) => !d.isError)
    .map((d) => [d.x, d.y, d.value]);
  const errorData = props.data
    .filter((d) => d.isError)
    .map((d) => [d.x, d.y, d.value]);

  return {
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
      position: "top",
      ...createTooltipConfig(appStore.isDarkMode, props.tooltipSize),
      formatter: (params: any) => {
        const { data } = params;
        if (!data) return "";
        const [xIdx, yIdx, value] = data;
        const time = props.xCategories[xIdx] || "";
        const latency = props.yCategories[yIdx] || "";
        const { labelColor, valueColor, borderColor } = getTooltipColors(
          appStore.isDarkMode,
        );
        const sizeConfig = getTooltipSize(props.tooltipSize);
        return `
          <table style="border-collapse: collapse; min-width: ${sizeConfig.minWidth}px;">
            <tr style="border-bottom: 1px solid ${borderColor};">
              <td style="padding: ${sizeConfig.cellPadding}px 0; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px;">Time:</td>
              <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 5px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${time}</td>
            </tr>
            <tr style="border-bottom: 1px solid ${borderColor};">
              <td style="padding: ${sizeConfig.cellPadding}px 0; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px;">Latency:</td>
              <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 5px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${latency}</td>
            </tr>
            <tr>
              <td style="padding: ${sizeConfig.cellPadding}px 0; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px;">Requests:</td>
              <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 5px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${value}/s</td>
            </tr>
          </table>
        `;
      },
    },
    legend: {
      show: true,
      bottom: 0,
      left: "center",
      orient: "horizontal",
      itemWidth: 12,
      itemHeight: 12,
      borderRadius: 2,
      textStyle: {
        color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
        fontSize: 11,
      },
      data: [
        {
          name: "Latency",
          icon: "rect",
          itemStyle: {
            color: appStore.isDarkMode ? "#2563eb" : "#3b82f6",
          },
        },
        {
          name: "Errors",
          icon: "rect",
          itemStyle: { color: "#ef4444" },
        },
      ],
    },
    grid: {
      left: chartLayout.grid.heatmap.left,
      right: chartLayout.grid.heatmap.right,
      top: 5,
      bottom: props.showZoom
        ? chartLayout.getGridBottom({ hasLegend: true, hasZoom: true, containLabel: true })
        : 36,
      containLabel: true,
    },
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: 0,
        start: 0,
        end: 100,
      },
      ...(props.showZoom
        ? [
            {
              type: "slider",
              xAxisIndex: 0,
              start: 0,
              end: 100,
              height: chartLayout.zoom.height.timeSeries,
              bottom: chartLayout.getZoomBottom(true),
              left: chartLayout.grid.heatmap.left,
              right: chartLayout.grid.heatmap.right,
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
          ]
        : []),
    ],
    xAxis: {
      type: "category",
      data: props.xCategories,
      axisLine: {
        lineStyle: { color: appStore.isDarkMode ? "#334155" : "#e5e7eb" },
      },
      axisLabel: {
        color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
        fontSize: 11,
        margin: 8,
        interval: "auto",
        formatter: (value: string) => {
          // Check if value is a date format (e.g., "Jan 14") vs time format (e.g., "22:30")
          if (value && !value.includes(":")) {
            return `{date|${value}}`;
          }
          return value;
        },
        rich: {
          date: {
            fontWeight: "bold",
            fontSize: 12,
            color: appStore.isDarkMode ? "#e5e7eb" : "#374151",
          },
        },
      },
      splitArea: { show: false },
    },
    yAxis: {
      type: "category",
      data: props.yCategories,
      name: "Latency",
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
        color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
        fontSize: 11,
        margin: 8,
      },
      splitArea: { show: false },
    },
    visualMap: {
      min: 0,
      max: props.maxValue,
      calculable: true,
      orient: "vertical",
      right: 8,
      top: "center",
      bottom: 40,
      itemWidth: 14,
      itemHeight: 120,
      text: ["High", "Low"],
      inRange: {
        color: appStore.isDarkMode
          ? ["#1e3a5f", "#2563eb", "#60a5fa"]
          : ["#dbeafe", "#3b82f6", "#1d4ed8"],
      },
      textStyle: {
        color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
        fontSize: 10,
      },
      formatter: (value: number) => `${value}/s`,
    },
    series: [
      {
        name: "Latency",
        type: "heatmap",
        data: regularData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
      {
        name: "Errors",
        type: "heatmap",
        data: errorData,
        itemStyle: {
          color: "#ef4444",
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };
});

watch(
  () => appStore.isDarkMode,
  () => {
    chartRef.value?.resize();
  },
);

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
  <div class="heatmap-chart-wrapper">
    <v-chart
      ref="chartRef"
      :option="option"
      :style="{ height, width: '100%' }"
      autoresize
    />
    <!-- Time range badge -->
    <div v-if="timeRangeDisplay && !hideTimeBadge" class="time-range-badge">
      <Icon icon="carbon:time" :width="12" :height="12" />
      <span>{{ timeRangeDisplay }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.heatmap-chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.time-range-badge {
  position: absolute;
  bottom: 8px;
  right: 80px; // Account for heatmap visual map on right side
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
