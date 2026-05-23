<script setup lang="ts">
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

interface Props {
  code: string | number;
  title: string;
  description: string;
  icon?: string;
  gradient?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: "carbon:warning-alt",
  gradient: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
});

const router = useRouter();

function goHome() {
  router.push("/");
}

function goBack() {
  router.back();
}
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-icon">
        <Icon :icon="props.icon" />
      </div>
      <h1 class="error-code" :style="{ background: props.gradient }">
        {{ props.code }}
      </h1>
      <h2 class="error-title">{{ props.title }}</h2>
      <p class="error-description">{{ props.description }}</p>
      <div class="error-actions">
        <n-button @click="goBack">
          <template #icon>
            <Icon icon="carbon:arrow-left" />
          </template>
          Go Back
        </n-button>
        <n-button type="primary" @click="goHome">
          <template #icon>
            <Icon icon="carbon:home" />
          </template>
          Go to Home
        </n-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--n-body-color);
}

.error-content {
  text-align: center;
  padding: 48px;
}

.error-icon {
  font-size: 64px;
  color: var(--n-text-color-disabled);
  margin-bottom: 24px;
}

.error-code {
  font-size: 6rem;
  font-weight: 700;
  margin: 0;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 16px 0;
  color: var(--n-text-color);
}

.error-description {
  font-size: 1rem;
  color: var(--n-text-color-3);
  margin: 0 0 24px 0;
  max-width: 400px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
