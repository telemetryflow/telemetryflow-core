<template>
  <span class="tag-badge" :style="tagStyle">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTagColors } from '@/composables/useTagColors';
import { useOsTheme } from 'naive-ui';

interface Props {
  label: string;
  index?: number;
  bold?: boolean;
  uppercase?: boolean;
}

const props = defineProps<Props>();

const osTheme = useOsTheme();
const { getColorByName, getColorByIndex } = useTagColors();

const isDark = computed(() => {
  return osTheme.value === 'dark' || document.documentElement.classList.contains('dark');
});

const tagStyle = computed(() => {
  let colors;

  if (props.index !== undefined) {
    colors = getColorByIndex(props.index, isDark.value);
  } else {
    colors = getColorByName(props.label, isDark.value);
  }

  return {
    backgroundColor: colors.bg,
    color: colors.text,
    borderColor: colors.border,
    fontWeight: props.bold ? '700' : '500',
    textTransform: props.uppercase ? 'uppercase' : 'none',
  };
});
</script>

<style scoped lang="scss">
.tag-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
}
</style>
