<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
  inject,
} from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart as EBarChart, LineChart as ELineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from "echarts/components";
import type { EChartsOption } from "echarts";
import dayjs from "dayjs";
import { Icon } from "@iconify/vue";
import { useAppStore } from "@/store";
import {
  chartColors,
  chartLayout,
  createTooltipConfig,
  getTooltipColors,
  getTooltipSize,
  formatTooltipValue,
  formatChartValue,
  isByteUnit,
  type TooltipSize,
} from "@/config/theme";
import { registerChart, unregisterChart } from "@/composables/useChartGroup";
import { formatTimeRangeSuffix } from "@/utils";

// Inject zoom mode flag from ChartZoomModal
const isInZoomModal = inject("isInZoomModal", false);

use([
  CanvasRenderer,
  EBarChart,
  ELineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
]);

interface DataSeries {
  name: string;
  data: number[];
  color?: string;
}

const props = withDefaults(
  defineProps<{
    categories: string[];
    series: DataSeries[];
    title?: string;
    height?: string;
    unit?: string;
    horizontal?: boolean;
    stacked?: boolean;
    groupId?: string;
    chartType?: "bar" | "line" | "area";
    noSync?: boolean;
    timestamps?: number[];
    timeRange?: { start: number; end: number };
    categoryLabel?: string;
    showZoom?: boolean;
    hideTimeBadge?: boolean;
    showLegend?: boolean;
    compactLegend?: boolean;
    fullHeight?: boolean;
    itemColors?: string[]; // Colors for each category (when single series with multiple categories)
    tooltipSize?: TooltipSize;
  }>(),
  {
    height: "300px",
    horizontal: false,
    stacked: false,
    groupId: "dashboard",
    chartType: "bar",
    noSync: false,
    categoryLabel: "Time",
    showZoom: false,
    hideTimeBadge: false,
    showLegend: true,
    compactLegend: false,
    fullHeight: false,
    tooltipSize: "medium",
  },
);

// Computed height - use 100% when fullHeight is true or inside zoom modal
const chartHeight = computed(() =>
  props.fullHeight || isInZoomModal ? "100%" : props.height,
);

const appStore = useAppStore();
const chartRef = ref<InstanceType<typeof VChart>>();

const colors = computed(() => {
  // If itemColors provided (for single series with multiple categories), use them
  if (props.itemColors && props.itemColors.length > 0) {
    return props.itemColors;
  }
  // Otherwise use series colors
  const seriesColors = props.series
    .map((s) => s.color)
    .filter((c): c is string => Boolean(c));
  if (seriesColors.length === props.series.length) {
    return seriesColors;
  }
  return appStore.isDarkMode ? chartColors.dark : chartColors.light;
});

// Use time-based x-axis when timestamps are provided (Kibana-style positioning)
const useTimeAxis = computed(
  () => !!props.timestamps && props.timestamps.length > 0 && !props.horizontal,
);

// Legend layout: constrain to x-axis width only when items exceed x-axis width
const legendNeedsConstrain = computed(() => props.series.length > 6);

// Check if there's any data in the series
const hasNoData = computed(() => {
  if (!props.series || props.series.length === 0) return true;
  const hasAxis = useTimeAxis.value
    ? props.timestamps && props.timestamps.length > 0
    : props.categories && props.categories.length > 0;
  if (!hasAxis) return true;
  return props.series.every((s) => !s.data || s.data.length === 0);
});

// Get time range display from global store
const timeRangeDisplay = computed(() => {
  const { start, end } = appStore.globalTimeRange;
  return formatTimeRangeSuffix(start, end);
});

// DataZoom range — use timeRange bounds to always show full requested range
const dataZoomRange = computed(() => {
  if (useTimeAxis.value && props.timeRange) {
    return { startValue: props.timeRange.start, endValue: props.timeRange.end };
  }
  return { start: 0, end: 100 };
});

const option = computed<EChartsOption>(() => ({
  backgroundColor: "transparent",
  color: colors.value,
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
    trigger: "axis",
    ...createTooltipConfig(appStore.isDarkMode, props.tooltipSize),
    axisPointer: {
      type: "shadow",
      shadowStyle: {
        color: appStore.isDarkMode
          ? "rgba(255, 255, 255, 0.05)"
          : "rgba(0, 0, 0, 0.05)",
      },
      label: {
        show: false,
      },
    },
    formatter: (params: any) => {
      if (!Array.isArray(params) || params.length === 0) return "";

      const dataIndex = params[0].dataIndex;
      // For time axis, axisValue is a timestamp; otherwise use raw timestamps or category label
      const tzFormat = (v: number) => {
        const zone = appStore.chartTimezone;
        return zone === "UTC"
          ? dayjs.utc(v).format("YYYY-MM-DD HH:mm:ss")
          : dayjs.utc(v).tz(zone).format("YYYY-MM-DD HH:mm:ss");
      };
      const timeDisplay =
        useTimeAxis.value && params[0].axisValue
          ? tzFormat(params[0].axisValue)
          : props.timestamps && props.timestamps[dataIndex]
            ? tzFormat(props.timestamps[dataIndex])
            : params[0].axisValue;

      const { labelColor, valueColor, borderColor } = getTooltipColors(
        appStore.isDarkMode,
      );
      const sizeConfig = getTooltipSize(props.tooltipSize);

      // Get chart instance to check legend selected state
      const chart = chartRef.value?.chart;
      let legendSelected: Record<string, boolean> = {};
      if (chart) {
        const chartOption = chart.getOption();
        const legendData = (chartOption.legend as any)?.[0];
        legendSelected = legendData?.selected || {};
      }

      // Extract numeric value (time axis data is [timestamp, value], category axis is just value)
      const getVal = (item: any): number => {
        if (Array.isArray(item.value)) return item.value[1] as number;
        return Number(item.value);
      };

      // Filter out zero values, hidden series, and sort by value descending
      const validParams = params.filter((item: any) => {
        const v = getVal(item);
        if (v == null || v === 0) return false;
        if (legendSelected[item.seriesName] === false) return false;
        return true;
      });
      const sortedParams = [...validParams].sort(
        (a: any, b: any) => getVal(b) - getVal(a),
      );

      let html = `<table style="border-collapse: collapse; min-width: ${sizeConfig.minWidth}px;">`;

      // Time/Category header
      const isTimeAxis =
        useTimeAxis.value || (props.timestamps && props.timestamps.length > 0);
      if (timeDisplay && timeDisplay.trim() !== "") {
        if (isTimeAxis) {
          // Time axis: show "Time: <timestamp>"
          html += `<tr style="border-bottom: 1px solid ${borderColor};">
            <td colspan="2" style="padding: ${sizeConfig.cellPadding}px 0; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px; font-weight: 600;">${props.categoryLabel}:</td>
            <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 5px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${timeDisplay}</td>
          </tr>`;
        } else {
          // Category axis: show just the category name, no "Time:" prefix
          html += `<tr style="border-bottom: 1px solid ${borderColor};">
            <td colspan="3" style="padding: ${sizeConfig.cellPadding}px 0; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: 600;">${timeDisplay}</td>
          </tr>`;
        }
      }

      // Series items
      sortedParams.forEach((item: any) => {
        const v = getVal(item);
        html += `<tr style="border-bottom: 1px solid ${borderColor};">
          <td style="padding: ${sizeConfig.cellPadding}px 0; width: 12px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${item.color};"></span>
          </td>
          <td style="padding: ${sizeConfig.cellPadding}px 5px; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px;">${item.seriesName}:</td>
          <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 5px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${formatTooltipValue(v)}</td>
        </tr>`;
      });

      html += `</table>`;
      return html;
    },
  },
  legend:
    props.series.length >= 1
      ? {
          show: props.showLegend,
          bottom: chartLayout.legend.bottom,
          ...(legendNeedsConstrain.value
            ? {
                left: chartLayout.grid.bar.left,
                right: chartLayout.grid.bar.right,
              }
            : { left: "center" }),
          padding: chartLayout.legend.padding,
          type: props.compactLegend ? "plain" : "scroll",
          itemWidth: props.compactLegend ? 14 : 25,
          itemHeight: props.compactLegend ? 8 : 14,
          itemGap: props.compactLegend ? 8 : 10,
          selectedMode: true,
          ...(props.compactLegend
            ? {}
            : {
                pageButtonItemGap: 5,
                pageButtonGap: 10,
                pageIconColor: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
                pageIconInactiveColor: appStore.isDarkMode
                  ? "#475569"
                  : "#d1d5db",
                pageTextStyle: {
                  color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
                },
              }),
          textStyle: {
            color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
            fontWeight: "bold",
            fontSize: props.compactLegend ? 10 : 12,
          },
          tooltip: {
            show: true,
          },
        }
      : undefined,
  grid: {
    left: chartLayout.grid.bar.left,
    right: chartLayout.grid.bar.right,
    top: props.unit && !isByteUnit(props.unit) && !["", "varies", "dynamic"].includes(props.unit) ? 20 : 10,
    bottom: chartLayout.getGridBottom({
      hasLegend: props.showLegend && props.series.length >= 1,
      hasZoom: props.showZoom,
      chartType: "bar",
      containLabel: true,
    }),
    containLabel: true,
  },
  dataZoom: props.showZoom
    ? [
        {
          type: "inside",
          ...dataZoomRange.value,
        },
        {
          type: "slider",
          ...dataZoomRange.value,
          height: chartLayout.zoom.height.bar,
          bottom: chartLayout.getZoomBottom(
            props.showLegend && props.series.length >= 1,
          ),
          left: chartLayout.grid.bar.left,
          right: chartLayout.grid.bar.right,
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
    : undefined,
  xAxis: props.horizontal
    ? {
        type: "value",
        axisLine: {
          lineStyle: { color: appStore.isDarkMode ? "#334155" : "#e5e7eb" },
        },
        axisLabel: {
          color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
          fontSize: 11,
          margin: 8,
        },
        splitLine: {
          lineStyle: { color: appStore.isDarkMode ? "#334155" : "#e5e7eb" },
        },
      }
    : useTimeAxis.value
      ? {
          type: "time",
          min: props.timeRange?.start,
          max: props.timeRange?.end,
          axisLine: {
            lineStyle: { color: appStore.isDarkMode ? "#334155" : "#e5e7eb" },
          },
          axisTick: {},
          axisLabel: {
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
            show: true,
            lineStyle: { color: appStore.isDarkMode ? "#334155" : "#e5e7eb" },
          },
        }
      : {
          type: "category",
          data: props.categories,
          axisLine: {
            lineStyle: { color: appStore.isDarkMode ? "#334155" : "#e5e7eb" },
          },
          axisTick: {},
          axisLabel: {
            color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
            fontSize: 11,
            margin: 8,
            formatter: (value: string) => {
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
          splitLine: {
            show: true,
            lineStyle: { color: appStore.isDarkMode ? "#334155" : "#e5e7eb" },
          },
        },
  yAxis: props.horizontal
    ? {
        type: "category",
        data: props.categories,
        axisLine: { show: false },
        axisLabel: {
          color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
          fontSize: 11,
          margin: 8,
        },
      }
    : {
        type: "value",
        name: (() => {
          if (!props.unit) return undefined;
          if (isByteUnit(props.unit)) return undefined;
          if (["", "varies", "dynamic"].includes(props.unit)) return undefined;
          return props.unit === "percent" ? "%" : props.unit;
        })(),
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
          formatter: (value: number) => formatChartValue(value, props.unit, 1),
        },
        splitLine: {
          lineStyle: { color: appStore.isDarkMode ? "#334155" : "#e5e7eb" },
        },
      },
  series: props.series.map((s) => ({
    name: s.name,
    type: props.chartType === "area" ? "line" : props.chartType,
    data:
      useTimeAxis.value && props.timestamps
        ? s.data.map((val, i) => [props.timestamps![i], val])
        : s.data,
    stack: props.stacked ? "total" : undefined,
    color: s.color,
    itemStyle: {
      color: s.color,
      borderRadius:
        props.chartType === "bar"
          ? props.stacked || props.categories.length > 40
            ? 0
            : [4, 4, 0, 0]
          : undefined,
    },
    ...(props.chartType === "bar"
      ? {
          barMaxWidth: isInZoomModal
            ? props.categories.length <= 10
              ? 120
              : 50
            : props.categories.length <= 10
              ? 60
              : 30,
          barMinWidth: 4,
        }
      : {
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: s.color,
          },
          areaStyle:
            props.chartType === "area"
              ? {
                  opacity: 0.3,
                }
              : undefined,
        }),
  })),
}));

watch(
  () => appStore.isDarkMode,
  () => {
    chartRef.value?.resize();
  },
);

// Reset DataZoom when time range or data changes to always show full requested range
watch(
  () => [props.timeRange?.start, props.timeRange?.end, props.categories.length],
  () => {
    nextTick(() => {
      const chart = chartRef.value?.chart;
      if (!chart) return;
      if (useTimeAxis.value && props.timeRange) {
        chart.dispatchAction({
          type: "dataZoom",
          startValue: props.timeRange.start,
          endValue: props.timeRange.end,
        });
      } else {
        chart.dispatchAction({ type: "dataZoom", start: 0, end: 100 });
      }
    });
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

defineExpose({
  resize: () => chartRef.value?.resize(),
  getChartInstance: () => chartRef.value?.chart,
});
</script>

<template>
  <div class="bar-chart-wrapper">
    <v-chart
      ref="chartRef"
      :option="option"
      :style="{ height: chartHeight, width: '100%' }"
      autoresize
    />
    <!-- No data overlay -->
    <div v-if="hasNoData" class="no-data-overlay">
      <Icon
        icon="carbon:chart-bar"
        :width="32"
        :height="32"
        class="no-data-icon"
      />
      <span class="no-data-text">No data</span>
    </div>
    <!-- Time range badge near the time bar -->
    <div
      v-if="showZoom && timeRangeDisplay && !hideTimeBadge"
      class="time-range-badge"
    >
      <Icon icon="carbon:time" :width="12" :height="12" />
      <span>{{ timeRangeDisplay }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bar-chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.no-data-overlay {
  position: absolute;
  // Center within chart canvas area (accounting for ~50px bottom space: zoom + legend)
  top: calc(50% - 25px);
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-3, #9ca3af);
  pointer-events: none;
  z-index: 10;
}

.no-data-icon {
  opacity: 0.5;
}

.no-data-text {
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.7;
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
