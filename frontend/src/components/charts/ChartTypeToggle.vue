<script setup lang="ts">
export type ChartDisplayType = "line" | "area" | "bar";

withDefaults(
  defineProps<{
    modelValue: ChartDisplayType;
    showBar?: boolean;
    showExpand?: boolean;
  }>(),
  {
    showBar: true,
    showExpand: true,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: ChartDisplayType): void;
  (e: "expand"): void;
}>();

function setType(type: ChartDisplayType) {
  emit("update:modelValue", type);
}

// Mini graph SVG paths
const linePath = "M2,14 L6,10 L10,12 L14,6 L18,8 L22,4";
const areaPath = "M2,14 L6,10 L10,12 L14,6 L18,8 L22,4 L22,16 L2,16 Z";
const barRects = [
  { x: 2, width: 4, height: 8, y: 8 },
  { x: 8, width: 4, height: 12, y: 4 },
  { x: 14, width: 4, height: 6, y: 10 },
  { x: 20, width: 4, height: 10, y: 6 },
];
</script>

<template>
  <div class="chart-type-toggle">
    <button
      class="toggle-btn"
      :class="{ active: modelValue === 'line' }"
      title="Line"
      @click="setType('line')"
    >
      <svg viewBox="0 0 24 18" class="mini-graph">
        <path
          :d="linePath"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <button
      class="toggle-btn"
      :class="{ active: modelValue === 'area' }"
      title="Area"
      @click="setType('area')"
    >
      <svg viewBox="0 0 24 18" class="mini-graph">
        <path :d="areaPath" fill="currentColor" opacity="0.3" />
        <path
          :d="linePath"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <button
      v-if="showBar"
      class="toggle-btn"
      :class="{ active: modelValue === 'bar' }"
      title="Bar"
      @click="setType('bar')"
    >
      <svg viewBox="0 0 26 18" class="mini-graph">
        <rect
          v-for="(r, i) in barRects"
          :key="i"
          :x="r.x"
          :y="r.y"
          :width="r.width"
          :height="r.height"
          rx="1"
          fill="currentColor"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped lang="scss">
.chart-type-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--n-action-color);
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  padding: 2px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--n-text-color-3);
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 2px;

  &:hover {
    color: var(--n-text-color);
    background: var(--n-border-color);
  }

  &.active {
    color: var(--n-primary-color);
    background: rgba(59, 130, 246, 0.12);
  }
}

.mini-graph {
  width: 20px;
  height: 14px;
}
</style>
