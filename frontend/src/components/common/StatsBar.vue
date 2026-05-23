<script setup lang="ts">
import { Icon } from '@iconify/vue';

export interface StatItem {
  icon: string;
  value: number | string;
  label: string;
  color?: string;
}

defineProps<{
  stats: StatItem[];
}>();
</script>

<template>
  <div class="stats-bar">
    <div v-for="(stat, index) in stats" :key="index" class="stat-item">
      <Icon :icon="stat.icon" class="stat-icon" :style="{ color: stat.color || 'var(--n-text-color-3)' }" />
      <span class="stat-value" :style="{ color: stat.color || 'var(--n-text-color)' }">{{ stat.value }}</span>
      <span class="stat-label">{{ stat.label }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stats-bar {
  display: flex;
  align-items: center;
  gap: 48px;
  padding: 16px 24px;
  background: var(--n-card-color);
  border-bottom: 1px solid var(--n-border-color);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 20px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
}
</style>
