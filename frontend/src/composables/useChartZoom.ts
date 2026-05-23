/**
 * Composable for managing chart zoom state
 */

import { ref, readonly } from "vue";

export interface ChartZoomState {
  isOpen: boolean;
  chartId: string | null;
  title: string;
}

const state = ref<ChartZoomState>({
  isOpen: false,
  chartId: null,
  title: "",
});

export function useChartZoom() {
  function openZoom(chartId: string, title: string = "Chart View") {
    state.value = {
      isOpen: true,
      chartId,
      title,
    };
  }

  function closeZoom() {
    state.value = {
      isOpen: false,
      chartId: null,
      title: "",
    };
  }

  function isZoomed(chartId: string): boolean {
    return state.value.isOpen && state.value.chartId === chartId;
  }

  return {
    state: readonly(state),
    openZoom,
    closeZoom,
    isZoomed,
  };
}
