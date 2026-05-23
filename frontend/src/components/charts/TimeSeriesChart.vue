<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart } from "echarts/charts";
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
  formatChartValue,
  formatAxisLabel,
  isByteUnit,
  formatSmallDecimal,
  type TooltipSize,
} from "@/config/theme";
import { formatTimeRangeSuffix } from "@/utils";
import { registerChart, unregisterChart } from "@/composables/useChartGroup";

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
]);

interface DataSeries {
  name: string;
  data: Array<[number, number]>;
  color?: string;
}

// Global tooltip configuration
const TOOLTIP_MAX_ITEMS = 6;

const props = withDefaults(
  defineProps<{
    series: DataSeries[];
    title?: string;
    unit?: string;
    height?: string;
    showLegend?: boolean;
    showZoom?: boolean;
    areaStyle?: boolean;
    groupId?: string;
    noSync?: boolean;
    chartType?: "line" | "bar" | "area";
    tooltipMode?: "full" | "compact" | "line-only";
    tooltipSize?: TooltipSize;
    maxTooltipItems?: number;
    hideTimeBadge?: boolean;
    legendSelected?: Record<string, boolean>;
    showGrid?: boolean;
    showAxis?: boolean;
    showTooltip?: boolean;
    timeRange?: { start: number; end: number };
  }>(),
  {
    height: "300px",
    showLegend: true,
    showZoom: true,
    areaStyle: false,
    groupId: "dashboard",
    noSync: false,
    chartType: "line",
    tooltipMode: "full",
    tooltipSize: "small",
    maxTooltipItems: TOOLTIP_MAX_ITEMS,
    hideTimeBadge: false,
    showGrid: true,
    showAxis: true,
    showTooltip: true,
  },
);

const appStore = useAppStore();
const chartRef = ref<InstanceType<typeof VChart>>();

const colors = computed(() =>
  appStore.isDarkMode ? chartColors.dark : chartColors.light,
);

// Check if there's any data in the series
// NOTE: Zero values ARE valid data (e.g., pending_requests=0 means "none pending").
// Only treat truly empty series (no data points at all) as "no data".
const hasNoData = computed(() => {
  if (!props.series || props.series.length === 0) {
    return true;
  }
  return props.series.every((s) => !s.data || s.data.length === 0);
});

// Get time range display from global store
const timeRangeDisplay = computed(() => {
  const { start, end } = appStore.globalTimeRange;
  return formatTimeRangeSuffix(start, end);
});

/** Convert epoch ms to a dayjs instance in the user-selected timezone */
function toDayjs(value: number) {
  const tz = appStore.chartTimezone;
  if (tz === "UTC") return dayjs.utc(value);
  // epoch ms → UTC → convert to target timezone
  return dayjs.utc(value).tz(tz);
}

// Create a stateless axis label formatter.
// Shows "MMM D" date badge when the tick is exactly at local midnight (00:00),
// otherwise shows "HH:mm" time. Stateless so it is safe for ECharts to call
// the same function instance multiple times (re-renders, hover, zoom).
const createAxisLabelFormatter = () => {
  return (value: number) => {
    const d = toDayjs(value);
    if (d.hour() === 0 && d.minute() === 0) {
      return `{date|${d.format("MMM D")}}`;
    }
    return d.format("HH:mm");
  };
};

// Build color palette: use per-series colors when provided, fall back to theme colors
const seriesColors = computed(() => {
  const hasExplicitColors = props.series.some((s) => s.color);
  if (!hasExplicitColors) return colors.value;
  return props.series.map(
    (s, i) => s.color || colors.value[i % colors.value.length],
  );
});

const option = computed<EChartsOption>(() => {
  // Read chartTimezone so Vue tracks it — rebuilds formatter on tz change
  const _tz = appStore.chartTimezone;
  return {
    backgroundColor: "transparent",
    color: seriesColors.value,
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
    tooltip: !props.showTooltip
      ? {
          show: false,
        }
      : props.tooltipMode === "line-only"
        ? {
            show: false,
          }
        : {
            trigger: "axis",
            ...createTooltipConfig(appStore.isDarkMode, props.tooltipSize),
            axisPointer: {
              type: "line",
              lineStyle: {
                color: appStore.isDarkMode ? "#475569" : "#cbd5e1",
                width: 1,
                type: "solid",
              },
              label: {
                show: false,
              },
              snap: true, // Snap to nearest data point
            },
            formatter: (params: any) => {
              if (!Array.isArray(params) || params.length === 0) return "";

              // Get the hovered timestamp from the first param
              const hoveredTimestamp = params[0].value[0];

              // Collect all series data from the chart instance
              // ECharts may only send 1 series in params if timestamps don't align perfectly
              // So we need to manually collect all series data at the nearest timestamp
              const allSeriesData: any[] = [];
              const timeWindow = 1000; // 1 second tolerance

              // Get chart instance to access all series
              const chart = chartRef.value?.chart;
              if (!chart) return "";

              const chartOption = chart.getOption();
              const seriesData = chartOption.series as any[];
              const legendData = (chartOption.legend as any)?.[0];

              if (!seriesData || seriesData.length === 0) return "";

              // Get legend selected state to filter out hidden series
              const legendSelected = legendData?.selected || {};

              // For each series in the chart, find the closest data point
              seriesData.forEach((series: any, seriesIndex: number) => {
                if (!series.data || series.data.length === 0) return;

                // Skip if series is hidden via legend
                if (legendSelected[series.name] === false) return;

                // Find data point closest to hovered timestamp
                let closestPoint = series.data[0];
                let minDiff = Math.abs(closestPoint[0] - hoveredTimestamp);

                for (const point of series.data) {
                  const timeDiff = Math.abs(point[0] - hoveredTimestamp);
                  if (timeDiff < minDiff) {
                    minDiff = timeDiff;
                    closestPoint = point;
                  }
                }

                // Only include if within time window
                if (minDiff <= timeWindow) {
                  allSeriesData.push({
                    seriesName: series.name,
                    value: closestPoint,
                    color:
                      seriesColors.value[
                        seriesIndex % seriesColors.value.length
                      ],
                  });
                }
              });

              if (allSeriesData.length === 0) return "";

              const time = toDayjs(hoveredTimestamp).format(
                "YYYY-MM-DD HH:mm:ss",
              );
              const { labelColor, valueColor, borderColor } = getTooltipColors(
                appStore.isDarkMode,
              );
              const sizeConfig = getTooltipSize(props.tooltipSize);

              // Keep original series order (as defined in queries/chart config)
              const sortedData = allSeriesData;
              const maxItems = props.maxTooltipItems;
              const displayData = sortedData.slice(0, maxItems);
              const hiddenCount = allSeriesData.length - maxItems;

              let html = `<table style="border-collapse: collapse; min-width: ${sizeConfig.minWidth}px;">`;

              // Time header
              html += `<tr style="border-bottom: 1px solid ${borderColor};">
        <td colspan="2" style="padding: ${sizeConfig.cellPadding}px 0; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px; font-weight: 600;">Time:</td>
        <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 5px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${time}</td>
      </tr>`;

              // Series items
              displayData.forEach((item: any) => {
                html += `<tr style="border-bottom: 1px solid ${borderColor};">
          <td style="padding: ${sizeConfig.cellPadding}px 0; width: 12px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${item.color};"></span>
          </td>
          <td style="padding: ${sizeConfig.cellPadding}px 5px; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize}px;">${item.seriesName}:</td>
          <td style="padding: ${sizeConfig.cellPadding}px 0 ${sizeConfig.cellPadding}px 5px; color: ${valueColor}; font-size: ${sizeConfig.valueFontSize}px; font-weight: ${sizeConfig.valueFontWeight || 500}; text-align: right;">${formatChartValue(item.value[1], props.unit, 2)}${props.unit && !isByteUnit(props.unit) ? " " + props.unit : ""}</td>
        </tr>`;
              });

              // Show hidden count if any
              if (hiddenCount > 0) {
                html += `<tr>
          <td colspan="3" style="padding: ${sizeConfig.cellPadding}px 0; color: ${labelColor}; font-size: ${sizeConfig.labelFontSize - 1}px; text-align: center; font-style: italic;">
            +${hiddenCount} more series
          </td>
        </tr>`;
              }

              html += `</table>`;
              return html;
            },
          },
    // Always include legend component when there's series data to enable programmatic toggle
    // Position legend below zoom slider when both are shown
    // Show legend for all series counts when showLegend is true
    legend: props.showLegend
      ? {
          show: true,
          bottom: chartLayout.legend.bottom,
          left: "center", // Always center legend
          padding: chartLayout.legend.padding,
          type: "scroll",
          selected: props.legendSelected, // Programmatic legend selection from parent
          selectedMode: true, // Enable click to show/hide series
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
          // No truncation - show full names, scroll handles overflow
          tooltip: {
            show: true,
          },
        }
      : undefined,
    grid: {
      left: props.showAxis ? chartLayout.grid.timeSeries.left : 0,
      right: props.showAxis ? chartLayout.grid.timeSeries.right : 0,
      top: props.title ? 50 : props.showAxis ? (props.unit && !isByteUnit(props.unit) && !["", "varies", "dynamic"].includes(props.unit) ? 20 : 5) : 0,
      bottom: props.showAxis
        ? chartLayout.getGridBottom({
            hasLegend: props.showLegend,
            hasZoom: props.showZoom,
            chartType: "timeSeries",
            containLabel: true,
          })
        : 0,
      // containLabel: true → ECharts auto-fits tick labels AND rotated axis name
      // within the grid margins, preventing clipping on left/bottom
      containLabel: props.showAxis,
    },
    xAxis: {
      type: "time",
      min: props.timeRange?.start ?? undefined,
      max: props.timeRange?.end ?? undefined,
      show: props.showAxis,
      axisLine: {
        show: props.showAxis,
        lineStyle: {
          color: appStore.isDarkMode ? "#334155" : "#e5e7eb",
        },
      },
      axisTick: {
        show: props.showAxis,
        lineStyle: {
          color: appStore.isDarkMode ? "#475569" : "#d1d5db",
        },
      },
      axisLabel: {
        show: props.showAxis,
        color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
        fontSize: 11,
        margin: 8,
        formatter: createAxisLabelFormatter(),
        rich: {
          date: {
            fontWeight: "bold",
            fontSize: 12,
            color: appStore.isDarkMode ? "#e5e7eb" : "#374151",
          },
        },
      },
      splitLine: {
        show: props.showGrid && props.showAxis,
        lineStyle: {
          color: appStore.isDarkMode ? "#334155" : "#e5e7eb",
        },
      },
    },
    yAxis: {
      type: "value",
      show: props.showAxis,
      // Unit as vertical rotated label centered on y-axis (same pattern as ScatterChart)
      // Excluded for: byte units (already in tick as KiB/MiB/GiB), count/empty/meta units
      name: (() => {
        if (!props.showAxis || !props.unit) return undefined;
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
      axisLine: {
        show: false,
      },
      axisLabel: {
        show: props.showAxis,
        color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
        fontSize: 11,
        margin: 8,
        // Compact scaled numbers only — unit shown once via yAxis.name
        formatter: (value: number) => formatChartValue(value, props.unit, 1),
      },
      splitLine: {
        show: props.showGrid && props.showAxis,
        lineStyle: {
          color: appStore.isDarkMode ? "#334155" : "#e5e7eb",
        },
      },
    },
    dataZoom: props.showZoom
      ? [
          {
            type: "inside",
            start: 0,
            end: 100,
          },
          {
            type: "slider",
            start: 0,
            end: 100,
            height: chartLayout.zoom.height.timeSeries,
            bottom: chartLayout.getZoomBottom(props.showLegend),
            left: chartLayout.grid.timeSeries.left,
            right: chartLayout.grid.timeSeries.right,
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
    series: props.series.map((s, i) => ({
      name: s.name,
      type: props.chartType === "area" ? "line" : props.chartType,
      data: s.data,
      ...(s.color ? { color: s.color } : {}),
      ...(props.chartType === "bar"
        ? {
            barWidth: "60%",
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              ...(s.color ? { color: s.color } : {}),
            },
          }
        : {
            smooth: true,
            showSymbol: true,
            showAllSymbol: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              width: 2,
              ...(s.color ? { color: s.color } : {}),
            },
            itemStyle: {
              borderWidth: 1.5,
              borderColor: appStore.isDarkMode ? "#1e293b" : "#ffffff",
              ...(s.color ? { color: s.color } : {}),
            },
            areaStyle:
              props.chartType === "area" || props.areaStyle
                ? {
                    opacity: props.series.length > 1 ? 0.15 : 0.3,
                    ...(s.color ? { color: s.color } : {}),
                  }
                : undefined,
          }),
    })),
  };
});

watch(
  () => appStore.isDarkMode,
  () => {
    chartRef.value?.resize();
  },
);

// Register chart for synchronized crosshairs (unless noSync is set)
onMounted(() => {
  if (props.noSync) return;
  // Wait for chart to be initialized
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
  <div class="time-series-chart-wrapper">
    <v-chart
      ref="chartRef"
      :option="option"
      :style="{ height }"
      autoresize
    />
    <!-- No data overlay -->
    <div v-if="hasNoData" class="no-data-overlay">
      <Icon
        icon="carbon:chart-line"
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
.time-series-chart-wrapper {
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
