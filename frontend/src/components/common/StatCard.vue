<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useAppStore } from '@/store';

const appStore = useAppStore();

const props = defineProps<{
  icon: string;
  iconColor?: string;
  iconBg?: string;
  title: string;
  titleSuffix?: string; // Time range suffix like "(1H)" - rendered with accent color
  value: string | number;
  suffix?: string; // Value suffix like "ms"
  valueColor?: string;
  trend?: number;
  trendLabel?: string;
  trendDesc?: string;
  size?: 'small' | 'default';
}>();

function formatTrend(trend: number): string {
  if (trend > 0) return `+${trend}%`;
  if (trend < 0) return `${trend}%`;
  return '0%';
}

// Computed styles for proper dark/light mode support
const borderColor = computed(() => appStore.isDarkMode ? '#334155' : '#e5e7eb');
const leftBorderWidth = computed(() => props.size === 'small' ? '3px' : '4px');

const cardStyle = computed(() => ({
  borderTop: `1px solid ${borderColor.value}`,
  borderRight: `1px solid ${borderColor.value}`,
  borderBottom: `1px solid ${borderColor.value}`,
  borderLeft: `${leftBorderWidth.value} solid ${props.iconColor || '#3b82f6'}`,
  background: appStore.isDarkMode ? '#1e293b' : '#ffffff',
  boxShadow: appStore.isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
}));

const titleStyle = computed(() => ({
  color: appStore.isDarkMode ? '#9ca3af' : '#6b7280',
}));

const valueStyle = computed(() => ({
  color: '#1f2937',
  fontWeight: '700',
}));

// Title suffix (time range) uses accent color for visibility
const titleSuffixStyle = computed(() => ({
  color: props.iconColor || '#3b82f6',
}));
</script>

<template>
  <div class="stat-card" :class="{ small: size === 'small' }" :style="cardStyle">
    <div class="stat-content">
      <div class="stat-left">
        <div class="stat-header">
          <div class="stat-icon" :style="{ backgroundColor: iconBg || 'rgba(59, 130, 246, 0.1)' }">
            <Icon :icon="icon" :style="{ color: iconColor || '#3b82f6' }" />
          </div>
          <span class="stat-title" :style="titleStyle">{{ title }}<span v-if="titleSuffix" class="title-suffix" :style="titleSuffixStyle"> {{ titleSuffix }}</span></span>
        </div>
        <div v-if="trend !== undefined" class="stat-trend" :class="{ up: trend > 0, down: trend < 0, neutral: trend === 0 }">
          <Icon v-if="trend > 0" icon="carbon:arrow-up" class="trend-icon" />
          <Icon v-else-if="trend < 0" icon="carbon:arrow-down" class="trend-icon" />
          <span v-else class="trend-icon">-</span>
          <span class="trend-value">{{ trendLabel || formatTrend(trend) }}</span>
        </div>
      </div>
      <div class="stat-right">
        <div class="stat-value" :style="valueStyle">{{ typeof value === 'number' ? value.toLocaleString() : value }}<span v-if="suffix" class="value-suffix">{{ suffix }}</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
  border-radius: 12px;
  min-width: 0;
  min-height: 90px;
  flex: 1 1 180px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    filter: brightness(1.02);
  }

  // Small size variant
  &.small {
    padding: 16px 20px;
    min-width: 0;
    min-height: 90px;
    flex: 1 1 140px;
    border-radius: 8px;

    .stat-header {
      gap: 8px;
    }

    .stat-icon {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      font-size: 14px;
    }

    .stat-title {
      font-size: 0.75rem;
    }

    .stat-value {
      font-size: 1.75rem;
      word-break: break-word;
    }

    .stat-trend {
      font-size: 0.7rem;
    }

    .trend-icon {
      font-size: 12px;
    }
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}

.stat-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
  order: 2;
}

.stat-right {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  order: 1;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 18px;
  flex-shrink: 0;
}

.stat-title {
  font-size: 0.875rem;
  font-weight: 700;
}

.title-suffix {
  font-weight: 600;
  opacity: 0.9;
  margin-left: 5px;
}

.stat-value {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
  word-break: break-word;
  text-align: right;
  color: #1f2937;
}

.value-suffix {
  font-size: 0.5em;
  font-weight: 500;
  opacity: 0.7;
  margin-left: 2px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;

  &.up {
    color: #22c55e;
  }

  &.down {
    color: #ef4444;
  }

  &.neutral {
    color: #9ca3af;
  }
}

.trend-icon {
  font-size: 14px;
}

.trend-value {
  font-weight: 500;
}

// Mobile responsive styles
@media (max-width: 768px) {
  .stat-card {
    padding: 14px 16px;
    min-height: 70px;
    flex: 1 1 calc(50% - 8px);
    min-width: calc(50% - 8px);

    &.small {
      padding: 12px 14px;
      min-height: 65px;
      flex: 1 1 calc(50% - 8px);
      min-width: calc(50% - 8px);

      .stat-icon {
        width: 22px;
        height: 22px;
        font-size: 12px;
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
  }

  .stat-icon {
    width: 26px;
    height: 26px;
    font-size: 14px;
  }

  .stat-title {
    font-size: 0.7rem;
  }

  .stat-value {
    font-size: 2rem;
  }

  .value-suffix {
    font-size: 0.55em;
  }

  .stat-trend {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .stat-card {
    padding: 12px 14px;
    min-height: 60px;
    flex: 1 1 calc(50% - 6px);
    min-width: calc(50% - 6px);

    &.small {
      padding: 10px 12px;
      min-height: 55px;

      .stat-icon {
        width: 20px;
        height: 20px;
        font-size: 11px;
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

  .stat-header {
    gap: 6px;
  }

  .stat-icon {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }

  .stat-title {
    font-size: 0.625rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .value-suffix {
    font-size: 0.5em;
  }

  .stat-trend {
    font-size: 0.625rem;
  }

  .trend-icon {
    font-size: 10px;
  }
}
</style>
