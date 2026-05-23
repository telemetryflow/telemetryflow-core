<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'small' | 'medium' | 'large';
  text?: string;
}>(), {
  size: 'medium',
});
</script>

<template>
  <div class="loading-spinner" :class="size">
    <n-spin :size="size" />
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<style scoped lang="scss">
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
}

.loading-text {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
}
</style>
