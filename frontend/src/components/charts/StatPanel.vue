<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { formatCompactNumber } from "@/utils/format";

const props = withDefaults(
  defineProps<{
    title: string;
    titleSuffix?: string; // Time range suffix like "(1H)" - rendered with accent color
    value: number | string;
    valueColor?: string; // Custom color for the value text (e.g., severity color)
    unit?: string;
    icon?: string;
    iconColor?: string; // Custom color for the icon (overrides default)
    trend?: "up" | "down" | "stable";
    trendValue?: string;
    trendSuffix?: string; // Suffix text after trend value (e.g., "vs 1H")
    statusIcon?: string; // Custom status icon instead of trend
    statusColor?: "success" | "warning" | "error" | "info"; // Color for status icon
    color?:
      | "primary"
      | "success"
      | "warning"
      | "error"
      | "info"
      | "purple"
      | "default";
    size?: "default" | "small";
    showCompact?: boolean; // Whether to format numbers with K, M, B suffixes
  }>(),
  {
    color: "primary",
    trend: "stable",
    size: "default",
    showCompact: true,
  },
);

const iconStyle = computed(() => {
  const color = props.iconColor ?? borderColor.value;
  return { color, background: `${color}18` };
});

const borderColor = computed(() => {
  const colors: Record<string, string> = {
    primary: "#3b82f6",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#06b6d4",
    purple: "#8b5cf6",
    default: "#6b7280",
  };
  return colors[props.color] || colors.primary;
});

const trendIcon = computed(() => {
  if (props.trend === "up") return "carbon:arrow-up";
  if (props.trend === "down") return "carbon:arrow-down";
  return "carbon:subtract";
});

const trendColor = computed(() => {
  if (props.trend === "up") return "text-green-500";
  if (props.trend === "down") return "text-red-500";
  return "text-gray-500";
});

const statusIconColor = computed(() => {
  const colors: Record<string, string> = {
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#06b6d4",
  };
  return colors[props.statusColor || "success"];
});

const formattedValue = computed(() => {
  // If showCompact is false or value is a string, return as-is
  if (!props.showCompact || typeof props.value === "string") {
    return props.value;
  }
  // Otherwise format as compact number
  return formatCompactNumber(props.value);
});

const iconSize = computed(() => {
  return props.size === "small" ? 14 : 18;
});
</script>

<template>
  <div
    class="stat-panel card"
    :class="{ small: size === 'small' }"
    :style="{ borderLeftColor: borderColor }"
  >
    <div class="stat-content">
      <div class="stat-header">
        <div v-if="icon" class="stat-icon" :style="iconStyle">
          <Icon :icon="icon" :width="iconSize" :height="iconSize" />
        </div>
        <span class="stat-title">{{ title
        }}<span
          v-if="titleSuffix"
          class="title-suffix"
          :style="{ color: borderColor }"
        >
          {{ titleSuffix }}</span></span>
      </div>
      <div
        class="stat-value"
        :style="valueColor ? { color: valueColor } : size === 'small' ? { color: borderColor } : undefined"
      >
        {{ formattedValue }}
        <span v-if="unit" class="stat-unit">{{ unit }}</span>
      </div>
      <div v-if="statusIcon" class="stat-status">
        <Icon
          :icon="statusIcon"
          :width="14"
          :height="14"
          :style="{ color: statusIconColor }"
        />
      </div>
      <div
        v-else-if="trendValue && trend !== 'stable'"
        class="stat-trend"
        :class="trendColor"
      >
        <Icon :icon="trendIcon" :width="12" :height="12" />
        <span>{{ trendValue }}</span>
        <span v-if="trendSuffix" class="trend-suffix">{{ trendSuffix }}</span>
      </div>
    </div>
    <div v-if="$slots.chart" class="stat-chart">
      <slot name="chart" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.stat-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid var(--n-border-color);
  border-left: 4px solid;
  border-radius: 12px;
  min-height: 110px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  flex-shrink: 0;
}

.stat-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.02em;

  .title-suffix {
    font-weight: 700;
    margin-left: 5px;
    text-transform: lowercase;
  }
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--n-text-color);
  line-height: 1;

  :root.dark & {
    color: #ffffff;
  }
}

.stat-unit {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--n-text-color-3);
  margin-left: 4px;
}

.stat-status {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 16px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6875rem;
  font-weight: 500;
  min-height: 16px;

  .trend-suffix {
    color: var(--n-text-color-3);
    font-weight: 400;
    margin-left: 2px;
  }
}

.stat-chart {
  flex-shrink: 0;
  width: 140px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  // Ensure chart fits properly
  :deep(.vue-echarts) {
    width: 100% !important;
    height: 100% !important;
  }
}

// Small size variant
.stat-panel.small {
  padding: 12px 16px;
  min-height: 75px;
  gap: 12px;
  border-radius: 10px;
  border-left-width: 3px;
  flex: 1 1 180px;

  .stat-content {
    gap: 6px;
  }

  .stat-header {
    gap: 6px;
  }

  .stat-icon {
    width: 24px;
    height: 24px;
    border-radius: 5px;
  }

  .stat-title {
    font-size: 0.65rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-unit {
    font-size: 0.65rem;
  }

  .stat-trend {
    font-size: 0.625rem;
    min-height: 14px;
  }

  .stat-status {
    min-height: 14px;
  }

  .stat-chart {
    width: 60px;
    height: 40px;
  }
}

// Mobile responsive styles
@media (max-width: 768px) {
  .stat-panel {
    padding: 14px 16px;
    min-height: 95px;
    flex: 1 1 calc(50% - 8px);
    min-width: calc(50% - 8px);

    &.small {
      padding: 10px 14px;
      min-height: 75px;
      flex: 1 1 calc(50% - 8px);
      min-width: calc(50% - 8px);

      .stat-icon {
        width: 22px;
        height: 22px;
      }

      .stat-title {
        font-size: 0.6rem;
      }

      .stat-value {
        font-size: 1.25rem;
      }

      .stat-trend {
        font-size: 0.55rem;
      }
    }
  }

  .stat-icon {
    width: 24px;
    height: 24px;
  }

  .stat-title {
    font-size: 0.65rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-trend {
    font-size: 0.6rem;
  }
}

@media (max-width: 480px) {
  .stat-panel {
    padding: 10px 12px;
    min-height: 80px;
    flex: 1 1 calc(50% - 6px);
    min-width: calc(50% - 6px);

    &.small {
      padding: 8px 10px;
      min-height: 65px;

      .stat-icon {
        width: 20px;
        height: 20px;
      }

      .stat-title {
        font-size: 0.55rem;
      }

      .stat-value {
        font-size: 1.1rem;
      }

      .stat-trend {
        font-size: 0.5rem;
      }
    }
  }

  .stat-header {
    gap: 5px;
  }

  .stat-icon {
    width: 22px;
    height: 22px;
  }

  .stat-title {
    font-size: 0.6rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-unit {
    font-size: 0.6rem;
  }

  .stat-trend {
    font-size: 0.55rem;
  }
}
</style>
