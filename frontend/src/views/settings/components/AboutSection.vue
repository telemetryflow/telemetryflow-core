<script setup lang="ts">
import { config, whiteLabelConfig } from '@/config';

const appVersion = import.meta.env.VITE_APP_VERSION || "1.4.0";
const appDescription = `${whiteLabelConfig.brandName} - ${whiteLabelConfig.brandTagline}`;
</script>

<template>
  <n-card title="About" size="small" class="card-centered">
    <div class="about-content">
      <div class="about-logo">
        <img src="@/assets/favicon-dark.svg" :alt="config.appTitle" class="logo-icon" />
        <div class="logo-text">
          <h3>{{ config.appTitle }}</h3>
          <p>
            Version: <strong>{{ appVersion }}</strong>
          </p>
          <p>{{ whiteLabelConfig.brandTagline }}</p>
        </div>
      </div>
    </div>
  </n-card>
</template>

<style scoped lang="scss">
.about-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.about-logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  width: 80px;
  height: 80px;
}

.logo-text {
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--n-text-color);
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--n-text-color-3);
  }
}

.about-info {
  text-align: center;

  p {
    margin: 0 0 8px 0;
    font-size: 0.875rem;
    color: var(--n-text-color-2);
  }
}
</style>