<script setup lang="ts">
import { computed, ref, watch } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { GaugeChart as EGaugeChart } from "echarts/charts";
import { TitleComponent, TooltipComponent } from "echarts/components";
import type { EChartsOption } from "echarts";
import { useAppStore } from "@/store";

use([CanvasRenderer, EGaugeChart, TitleComponent, TooltipComponent]);

const props = withDefaults(
  defineProps<{
    value: number;
    title?: string;
    min?: number;
    max?: number;
    unit?: string;
    height?: string;
    thresholds?: Array<{ value: number; color: string }>;
    showBorder?: boolean;
  }>(),
  {
    min: 0,
    max: 100,
    height: "200px",
    showBorder: false,
  },
);

const appStore = useAppStore();
const chartRef = ref<InstanceType<typeof VChart>>();

const defaultThresholds = [
  { value: 0.3, color: "#22c55e" },
  { value: 0.7, color: "#f59e0b" },
  { value: 1, color: "#ef4444" },
];

const axisLineColors = computed(() => {
  const thresholds = props.thresholds || defaultThresholds;
  return thresholds.map((t) => [t.value, t.color]);
});

const option = computed<EChartsOption>(() => ({
  backgroundColor: "transparent",
  series: [
    {
      type: "gauge",
      center: ["50%", "60%"],
      radius: "80%",
      min: props.min,
      max: props.max,
      startAngle: 200,
      endAngle: -20,
      progress: {
        show: true,
        width: 12,
      },
      pointer: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          width: 12,
          color: axisLineColors.value as any,
        },
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      title: {
        show: true,
        offsetCenter: [0, "80%"],
        fontSize: 12,
        color: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
      },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, "20%"],
        fontSize: 24,
        fontWeight: 600,
        formatter: `{value}${props.unit || ""}`,
        color: appStore.isDarkMode ? "#e5e7eb" : "#374151",
      },
      data: [
        {
          value: props.value,
          name: props.title || "",
        },
      ],
    },
  ],
}));

watch(
  () => appStore.isDarkMode,
  () => {
    chartRef.value?.resize();
  },
);
</script>

<template>
  <div class="gauge-chart-wrapper" :class="{ 'with-border': showBorder }">
    <v-chart
      ref="chartRef"
      :option="option"
      :style="{ height }"
      autoresize
    />
  </div>
</template>

<style scoped lang="scss">
.gauge-chart-wrapper {
  width: 100%;
  height: 100%;

  &.with-border {
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    background: #ffffff;

    @media (max-width: 768px) {
      border-width: 1.5px;
      border-radius: 6px;
      padding: 12px;
    }
  }
}
</style>
