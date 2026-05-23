<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useMessage } from 'naive-ui';
import { StatPanel } from '@/components/charts';
import { useStatPanelsFromRegistry } from '@/composables/useStatPanelsFromRegistry';
import { useAlertsStore } from '@/store';

const message = useMessage();
const alertsStore = useAlertsStore();

// Notification preferences
const emailNotifications = ref(true);
const pushNotifications = ref(true);
const smsNotifications = ref(false);

// Notification types
const alertNotifications = ref(true);
const systemNotifications = ref(true);
const securityNotifications = ref(true);
const uptimeNotifications = ref(true);
const reportNotifications = ref(false);

// Frequency settings
const notificationFrequency = ref<'realtime' | 'digest' | 'weekly'>('realtime');
const digestTime = ref('09:00');

const frequencyOptions = [
  { label: 'Real-time', value: 'realtime' },
  { label: 'Daily Digest', value: 'digest' },
  { label: 'Weekly Summary', value: 'weekly' },
];

// Channel configurations with colors
const channels = [
  {
    key: 'email',
    label: 'Email Notifications',
    description: 'Receive notifications via email',
    icon: 'carbon:email',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#667eea',
    model: emailNotifications,
  },
  {
    key: 'push',
    label: 'Push Notifications',
    description: 'Receive browser push notifications',
    icon: 'carbon:notification',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f093fb',
    model: pushNotifications,
  },
  {
    key: 'sms',
    label: 'SMS Notifications',
    description: 'Receive notifications via SMS',
    icon: 'carbon:phone',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#4facfe',
    model: smsNotifications,
  },
];

// Notification type configurations with colors
const notificationTypes = [
  {
    key: 'alerts',
    label: 'Alert Notifications',
    description: 'Alerts and monitoring notifications',
    icon: 'carbon:warning-alt',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#fa709a',
    model: alertNotifications,
  },
  {
    key: 'system',
    label: 'System Notifications',
    description: 'System updates and maintenance',
    icon: 'carbon:settings',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    color: '#30cfd0',
    model: systemNotifications,
  },
  {
    key: 'security',
    label: 'Security Notifications',
    description: 'Security alerts and login attempts',
    icon: 'carbon:security',
    gradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)',
    color: '#ff6a00',
    model: securityNotifications,
  },
  {
    key: 'uptime',
    label: 'Uptime Notifications',
    description: 'Uptime monitoring alerts',
    icon: 'carbon:chart-average',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    color: '#5dd39e',
    model: uptimeNotifications,
  },
  {
    key: 'reports',
    label: 'Report Notifications',
    description: 'Weekly and monthly reports',
    icon: 'carbon:document',
    gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    color: '#fbc2eb',
    model: reportNotifications,
  },
];

// Stat panels from registry (NOT20001-NOT20004) — sourced from DB via store
const totalChannelsCount = computed(() => alertsStore.notificationChannels.length);
const enabledChannelsCount = computed(() => (alertsStore.notificationChannels as any[]).filter((c) => c.enabled).length);
const disabledChannelsCount = computed(() => (alertsStore.notificationChannels as any[]).filter((c) => !c.enabled).length);
const defaultChannelsCount = computed(() => alertsStore.defaultChannelIds.length);

const statCards = useStatPanelsFromRegistry(
  ['NOT20001', 'NOT20002', 'NOT20003', 'NOT20004'],
  {
    NOT20001: totalChannelsCount,
    NOT20002: enabledChannelsCount,
    NOT20003: defaultChannelsCount,
    NOT20004: disabledChannelsCount,
  },
);

onMounted(() => {
  alertsStore.fetchChannels(); // fetches channels + defaults in parallel
});

function saveSettings() {
  message.success('Notification settings saved successfully');
}
</script>

<template>
  <div class="notifications-settings">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="carbon:notification-new" class="title-icon" />
          Notifications
        </h1>
        <span class="page-subtitle">Manage your notification preferences</span>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <StatPanel v-for="stat in statCards" :key="stat.title" v-bind="stat" />
    </div>

    <!-- Settings Sections -->
    <div class="settings-container">
      <!-- Notification Channels -->
      <n-card class="settings-card colorful-card">
        <template #header>
          <div class="card-header-content">
            <div class="header-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <Icon icon="carbon:send-alt" :width="20" :height="20" />
            </div>
            <div class="header-text">
              <div class="header-title">Notification Channels</div>
              <div class="header-subtitle">Choose how you want to receive notifications</div>
            </div>
          </div>
        </template>
        <div class="settings-section">
          <div v-for="channel in channels" :key="channel.key" class="setting-item colorful-item">
            <div class="setting-icon-box" :style="{ background: channel.gradient }">
              <Icon :icon="channel.icon" :width="24" :height="24" />
            </div>
            <div class="setting-info">
              <div class="setting-label">{{ channel.label }}</div>
              <div class="setting-description">{{ channel.description }}</div>
            </div>
            <n-switch v-model:value="channel.model.value" size="large" />
          </div>
        </div>
      </n-card>

      <!-- Notification Types -->
      <n-card class="settings-card colorful-card">
        <template #header>
          <div class="card-header-content">
            <div class="header-icon-wrapper" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
              <Icon icon="carbon:categories" :width="20" :height="20" />
            </div>
            <div class="header-text">
              <div class="header-title">Notification Types</div>
              <div class="header-subtitle">Select which types of notifications you want to receive</div>
            </div>
          </div>
        </template>
        <div class="settings-section">
          <div v-for="type in notificationTypes" :key="type.key" class="setting-item colorful-item">
            <div class="setting-icon-box" :style="{ background: type.gradient }">
              <Icon :icon="type.icon" :width="24" :height="24" />
            </div>
            <div class="setting-info">
              <div class="setting-label">{{ type.label }}</div>
              <div class="setting-description">{{ type.description }}</div>
            </div>
            <n-switch v-model:value="type.model.value" size="large" />
          </div>
        </div>
      </n-card>

      <!-- Frequency Settings -->
      <n-card class="settings-card colorful-card">
        <template #header>
          <div class="card-header-content">
            <div class="header-icon-wrapper" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <Icon icon="carbon:time" :width="20" :height="20" />
            </div>
            <div class="header-text">
              <div class="header-title">Notification Frequency</div>
              <div class="header-subtitle">Control when and how often you receive notifications</div>
            </div>
          </div>
        </template>
        <div class="settings-section">
          <div class="setting-item colorful-item">
            <div class="setting-icon-box" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)">
              <Icon icon="carbon:timer" :width="24" :height="24" />
            </div>
            <div class="setting-info">
              <div class="setting-label">Delivery Frequency</div>
              <div class="setting-description">How often you want to receive notifications</div>
            </div>
            <n-select v-model:value="notificationFrequency" :options="frequencyOptions" style="width: 200px" />
          </div>

          <div v-if="notificationFrequency === 'digest'" class="setting-item colorful-item">
            <div class="setting-icon-box" style="background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)">
              <Icon icon="carbon:alarm" :width="24" :height="24" />
            </div>
            <div class="setting-info">
              <div class="setting-label">Digest Time</div>
              <div class="setting-description">Time to receive daily digest</div>
            </div>
            <n-time-picker v-model:formatted-value="digestTime" format="HH:mm" style="width: 200px" />
          </div>
        </div>
      </n-card>

      <!-- Save Button -->
      <div class="actions-footer">
        <n-button type="primary" size="large" @click="saveSettings">
          <template #icon>
            <Icon icon="carbon:save" />
          </template>
          Save Settings
        </n-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notifications-settings {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.title-icon {
  font-size: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  color: var(--text-color-3);
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  &.colorful-card {
    :deep(.n-card-header) {
      padding: 20px 24px;
      border-bottom: 1px solid var(--n-border-color);
      background: rgba(128, 128, 128, 0.02);
    }

    :deep(.n-card__content) {
      padding: 0;
    }
  }
}

.card-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color);
}

.header-subtitle {
  font-size: 13px;
  color: var(--n-text-color-3);
}

.settings-section {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--n-border-color);
  gap: 16px;
  transition: background 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &.colorful-item {
    &:hover {
      background: rgba(128, 128, 128, 0.03);
    }
  }
}

.setting-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setting-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--n-text-color);
}

.setting-description {
  font-size: 13px;
  color: var(--n-text-color-3);
}

.actions-footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .card-header-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>