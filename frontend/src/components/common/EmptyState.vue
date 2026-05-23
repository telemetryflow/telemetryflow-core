<script setup lang="ts">
import { Icon } from '@iconify/vue';

withDefaults(defineProps<{
  icon?: string;
  title?: string;
  description?: string;
}>(), {
  icon: 'carbon:data-base',
  title: 'No data',
  description: 'There is no data to display',
});
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">
      <Icon :icon="icon" :width="48" :height="48" />
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-description">{{ description }}</p>
    <div v-if="$slots.default" class="empty-action">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  color: var(--n-text-color-disabled);
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--n-text-color);
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
  margin: 0;
  max-width: 300px;
}

.empty-action {
  margin-top: 16px;
}
</style>
