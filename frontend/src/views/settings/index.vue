<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import DataSourceSettings from './components/DataSourceSettings.vue';
import AppearanceSettings from './components/AppearanceSettings.vue';
import CollectorStatus from './components/CollectorStatus.vue';
import AboutSection from './components/AboutSection.vue';
import { useAlertsStore } from '@/store';
import { config } from '@/config';

const router = useRouter();
const alertsStore = useAlertsStore();

const channelCount = computed(() => alertsStore.notificationChannels.length);
const enabledCount = computed(() => alertsStore.notificationChannels.filter(c => c.enabled).length);

function goToChannels() {
  router.push({ name: 'NotificationChannels' });
}
</script>

<template>
  <div class="settings-page">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Setup</h2>
        <p class="page-subtitle">Configure {{ config.appTitle }} dashboard</p>
      </div>
    </div>

    <!-- Row 1: Data Source | Appearance + Collector Status -->
    <div class="settings-row">
      <DataSourceSettings />

      <!-- Right side: Appearance + Collector Status stacked -->
      <div class="settings-column">
        <AppearanceSettings />
        <CollectorStatus />
      </div>
    </div>

    <!-- Row 2: Notification Channels Summary | About (equal height) -->
    <div class="settings-row-equal">
      <n-card title="Notification Channels" size="small" class="card-centered">
        <template #header-extra>
          <n-button type="primary" ghost @click="goToChannels">
            <template #icon>
              <Icon icon="carbon:launch" />
            </template>
            Manage
          </n-button>
        </template>

        <div class="channels-summary">
          <div class="summary-icon-box">
            <Icon icon="carbon:notification" class="summary-icon" />
          </div>
          <div class="summary-info">
            <p class="summary-stat">
              <n-tag round size="small" type="info">
                {{ channelCount }} channel{{ channelCount !== 1 ? 's' : '' }}
              </n-tag>
              configured
              <n-tag v-if="channelCount > 0" round size="small" type="success">
                {{ enabledCount }} enabled
              </n-tag>
            </p>
            <p class="summary-hint">
              Configure Email, Slack, Discord, and other notification channels for alerts and monitoring.
            </p>
          </div>
        </div>
      </n-card>
      <AboutSection />
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  align-items: stretch;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.settings-row-equal {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  align-items: stretch;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.settings-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.channels-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 16px;
}

.summary-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(128, 128, 128, 0.08);
  border: 1px solid rgba(128, 128, 128, 0.15);
  flex-shrink: 0;

  :root.dark & {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.summary-icon {
  font-size: 36px;
  color: var(--n-text-color-3);
  opacity: 0.6;
}

.summary-info {
  flex: 1;
}

.summary-stat {
  margin: 0 0 4px 0;
  font-size: 0.9375rem;
  color: var(--n-text-color-2);
}

.summary-enabled {
  color: var(--n-text-color-3);
  font-size: 0.8125rem;
}

.summary-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--n-text-color-3);
  line-height: 1.5;
}
</style>