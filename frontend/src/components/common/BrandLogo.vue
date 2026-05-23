<script setup lang="ts">
/**
 * Brand Logo Component
 * Displays white-labeled logo based on theme
 */

import { computed } from "vue";
import { useAppStore } from "@/store";
import { whiteLabelConfig, getLogo } from "@/config/whitelabel";

interface Props {
  size?: "small" | "medium" | "large" | "custom";
  width?: string;
  height?: string;
  showText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: "medium",
  showText: false,
});

const appStore = useAppStore();

const isDark = computed(() => appStore.theme === "dark");

const logoSrc = computed(() => getLogo(isDark.value));

const logoStyle = computed(() => {
  if (props.size === "custom") {
    return {
      width: props.width || whiteLabelConfig.logo.width,
      height: props.height || whiteLabelConfig.logo.height,
    };
  }
  
  const sizes = {
    small: { width: "120px", height: "auto" },
    medium: { width: "180px", height: "auto" },
    large: { width: "240px", height: "auto" },
  };
  
  return sizes[props.size];
});
</script>

<template>
  <div class="brand-logo" :class="`brand-logo--${size}`">
    <img
      :src="logoSrc"
      :alt="whiteLabelConfig.brandName"
      :style="logoStyle"
      class="brand-logo__image"
    />
    <span v-if="showText" class="brand-logo__text">
      {{ whiteLabelConfig.brandName }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  
  &__image {
    display: block;
    object-fit: contain;
  }
  
  &__text {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--n-text-color);
    white-space: nowrap;
  }
  
  &--small {
    .brand-logo__text {
      font-size: 0.875rem;
    }
  }
  
  &--large {
    .brand-logo__text {
      font-size: 1.5rem;
    }
  }
}
</style>
