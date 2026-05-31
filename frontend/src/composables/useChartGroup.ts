/**
 * Composable for synchronized chart crosshairs across multiple charts
 * Uses ECharts connect feature for parallel mouse tracking
 */

import { ref, onUnmounted } from "vue";
import * as echarts from "echarts/core";

 type ChartInstance = any;

// Global chart group registry
const chartGroups = new Map<string, Set<ChartInstance>>();

// Default group for dashboard charts
const DEFAULT_GROUP = "dashboard";

/**
 * Register a chart instance to a group for synchronized tooltips/crosshairs
 */
export function registerChart(
  chart: ChartInstance,
  groupId: string = DEFAULT_GROUP,
) {
  if (!chart) return;

  if (!chartGroups.has(groupId)) {
    chartGroups.set(groupId, new Set());
  }

  const group = chartGroups.get(groupId)!;
  group.add(chart);

  // Connect all charts in the group using ECharts connect
  echarts.connect(Array.from(group));
}

/**
 * Unregister a chart instance from a group
 */
export function unregisterChart(
  chart: ChartInstance,
  groupId: string = DEFAULT_GROUP,
) {
  if (!chart) return;

  const group = chartGroups.get(groupId);
  if (group) {
    group.delete(chart);

    // Reconnect remaining charts
    if (group.size > 0) {
      echarts.connect(Array.from(group));
    } else {
      chartGroups.delete(groupId);
    }
  }
}

/**
 * Composable hook for chart group synchronization
 */
export function useChartGroup(groupId: string = DEFAULT_GROUP) {
  const chartInstance = ref<ChartInstance>(null);

  function setChartInstance(chart: ChartInstance) {
    chartInstance.value = chart;
    registerChart(chart, groupId);
  }

  onUnmounted(() => {
    if (chartInstance.value) {
      unregisterChart(chartInstance.value, groupId);
    }
  });

  return {
    chartInstance,
    setChartInstance,
    groupId,
  };
}

export default useChartGroup;
