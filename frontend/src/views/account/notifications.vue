<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useMessage } from 'naive-ui';

const message = useMessage();

// Email Notifications
const emailAlerts = ref(true);
const emailReports = ref(true);
const emailUpdates = ref(false);
const emailMarketing = ref(false);

// In-App Notifications
const inAppAlerts = ref(true);
const inAppMentions = ref(true);
const inAppUpdates = ref(true);

// Push Notifications
const pushEnabled = ref(false);
const pushAlerts = ref(false);
const pushMentions = ref(false);

// Notification Frequency
const digestFrequency = ref('daily');

const digestOptions = [
  { label: 'Real-time', value: 'realtime' },
  { label: 'Hourly', value: 'hourly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
];

function handleSaveNotifications() {
  message.success('Notification settings saved successfully!');
}

function handleEnablePush() {
  if ('Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        pushEnabled.value = true;
        message.success('Push notifications enabled!');
      } else {
        message.warning('Push notification permission denied');
      }
    });
  } else {
    message.error('Push notifications are not supported in your browser');
  }
}
</script>

<template>
  <div class="notifications-page">
    <!-- Hero Section -->
    <div class="notifications-hero">
      <div class="hero-background" />
      <div class="hero-content">
        <div class="hero-icon">
          <Icon icon="carbon:notification" :width="48" :height="48" />
        </div>
        <div class="hero-text">
          <h1 class="hero-title">Notifications</h1>
          <p class="hero-subtitle">Manage how you receive notifications and alerts</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="notifications-content">
      <!-- Email Notifications Card -->
      <div class="notification-card email-card">
        <div class="card-header-custom">
          <div class="card-icon-wrapper blue">
            <Icon icon="carbon:email" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Email Notifications</h3>
            <p class="card-subtitle">Receive updates via email</p>
          </div>
        </div>

        <div class="card-content">
          <div class="notification-items">
            <div class="notification-item">
              <div class="notification-info">
                <Icon icon="carbon:warning-alt" :width="20" :height="20" />
                <div class="notification-text">
                  <span class="notification-label">Alert Notifications</span>
                  <span class="notification-desc">Receive emails when alerts are triggered</span>
                </div>
              </div>
              <n-switch v-model:value="emailAlerts" size="large" />
            </div>

            <div class="notification-item">
              <div class="notification-info">
                <Icon icon="carbon:report" :width="20" :height="20" />
                <div class="notification-text">
                  <span class="notification-label">Weekly Reports</span>
                  <span class="notification-desc">Get weekly summary reports of your metrics</span>
                </div>
              </div>
              <n-switch v-model:value="emailReports" size="large" />
            </div>

            <div class="notification-item">
              <div class="notification-info">
                <Icon icon="carbon:upgrade" :width="20" :height="20" />
                <div class="notification-text">
                  <span class="notification-label">Product Updates</span>
                  <span class="notification-desc">Stay informed about new features and improvements</span>
                </div>
              </div>
              <n-switch v-model:value="emailUpdates" size="large" />
            </div>

            <div class="notification-item">
              <div class="notification-info">
                <Icon icon="carbon:shopping-catalog" :width="20" :height="20" />
                <div class="notification-text">
                  <span class="notification-label">Marketing Emails</span>
                  <span class="notification-desc">Receive tips, best practices, and promotional content</span>
                </div>
              </div>
              <n-switch v-model:value="emailMarketing" size="large" />
            </div>
          </div>
        </div>
      </div>

      <!-- In-App Notifications Card -->
      <div class="notification-card inapp-card">
        <div class="card-header-custom">
          <div class="card-icon-wrapper purple">
            <Icon icon="carbon:notification-new" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">In-App Notifications</h3>
            <p class="card-subtitle">Notifications within the application</p>
          </div>
        </div>

        <div class="card-content">
          <div class="notification-items">
            <div class="notification-item">
              <div class="notification-info">
                <Icon icon="carbon:warning-alt" :width="20" :height="20" />
                <div class="notification-text">
                  <span class="notification-label">Alert Notifications</span>
                  <span class="notification-desc">Show notifications when alerts are triggered</span>
                </div>
              </div>
              <n-switch v-model:value="inAppAlerts" size="large" />
            </div>

            <div class="notification-item">
              <div class="notification-info">
                <Icon icon="carbon:user-speaker" :width="20" :height="20" />
                <div class="notification-text">
                  <span class="notification-label">Mentions</span>
                  <span class="notification-desc">Notify when someone mentions you</span>
                </div>
              </div>
              <n-switch v-model:value="inAppMentions" size="large" />
            </div>

            <div class="notification-item">
              <div class="notification-info">
                <Icon icon="carbon:update-now" :width="20" :height="20" />
                <div class="notification-text">
                  <span class="notification-label">System Updates</span>
                  <span class="notification-desc">Show notifications for system updates and maintenance</span>
                </div>
              </div>
              <n-switch v-model:value="inAppUpdates" size="large" />
            </div>
          </div>
        </div>
      </div>

      <!-- Push Notifications Card -->
      <div class="notification-card push-card">
        <div class="card-header-custom">
          <div class="card-icon-wrapper green">
            <Icon icon="carbon:phone" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Push Notifications</h3>
            <p class="card-subtitle">Browser push notifications</p>
          </div>
          <n-tag :type="pushEnabled ? 'success' : 'default'" size="medium" :bordered="false">
            {{ pushEnabled ? 'Enabled' : 'Disabled' }}
          </n-tag>
        </div>

        <div class="card-content">
          <div v-if="!pushEnabled" class="push-disabled">
            <p class="info-text">
              <Icon icon="carbon:information" :width="16" :height="16" />
              Enable push notifications to receive real-time alerts even when you're not using the app
            </p>
            <n-button type="primary" size="large" @click="handleEnablePush">
              <template #icon>
                <Icon icon="carbon:notification-new" />
              </template>
              Enable Push Notifications
            </n-button>
          </div>

          <div v-else class="notification-items">
            <div class="notification-item">
              <div class="notification-info">
                <Icon icon="carbon:warning-alt" :width="20" :height="20" />
                <div class="notification-text">
                  <span class="notification-label">Alert Notifications</span>
                  <span class="notification-desc">Push notifications for critical alerts</span>
                </div>
              </div>
              <n-switch v-model:value="pushAlerts" size="large" />
            </div>

            <div class="notification-item">
              <div class="notification-info">
                <Icon icon="carbon:user-speaker" :width="20" :height="20" />
                <div class="notification-text">
                  <span class="notification-label">Mentions</span>
                  <span class="notification-desc">Push notifications when someone mentions you</span>
                </div>
              </div>
              <n-switch v-model:value="pushMentions" size="large" />
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Frequency Card -->
      <div class="notification-card frequency-card">
        <div class="card-header-custom">
          <div class="card-icon-wrapper orange">
            <Icon icon="carbon:time" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Notification Frequency</h3>
            <p class="card-subtitle">Control how often you receive notifications</p>
          </div>
        </div>

        <div class="card-content">
          <div class="form-field-notification">
            <label class="field-label">
              <Icon icon="carbon:email" :width="16" :height="16" />
              <span>Email Digest Frequency</span>
            </label>
            <n-select v-model:value="digestFrequency" :options="digestOptions" size="large" />
            <p class="field-hint">
              <Icon icon="carbon:information" :width="14" :height="14" />
              Choose how often you want to receive email digests of your notifications
            </p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-bar">
        <n-button type="primary" size="large" @click="handleSaveNotifications">
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
.notifications-page {
  min-height: 100vh;
  background: var(--n-color);
}

// Hero Section
.notifications-hero {
  position: relative;
  padding: 40px 24px 60px;
  margin-bottom: 24px;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 24px 16px 40px;
    margin-bottom: 16px;
  }
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to bottom, transparent, var(--n-color));
  }

  :root.dark & {
    background: linear-gradient(135deg, #5fb3b1 0%, #d89bb5 100%);
  }
}

.hero-content {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
}

.hero-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 64px;
    height: 64px;
  }
}

.hero-text {
  flex: 1;
  color: white;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
}

.hero-subtitle {
  font-size: 1rem;
  margin: 0;
  opacity: 0.95;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

// Main Content
.notifications-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 40px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  @media (max-width: 768px) {
    padding: 0 16px 24px;
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

// Notification Cards
.notification-card {
  background: var(--n-card-color);
  border-radius: 16px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.15);
  }

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
    border-color: rgba(0, 0, 0, 0.12);

    :root.dark & {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }

  &.email-card {
    grid-column: 1 / 2;
  }

  &.inapp-card {
    grid-column: 2 / 3;
  }

  &.push-card {
    grid-column: 1 / 2;
  }

  &.frequency-card {
    grid-column: 2 / 3;
  }

  &.actions-bar {
    grid-column: 1 / -1;
  }

  @media (max-width: 768px) {
    &.email-card,
    &.inapp-card,
    &.push-card,
    &.frequency-card {
      grid-column: 1 / -1;
    }
  }
}

.card-header-custom {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid var(--n-border-color);

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
}

.card-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &.blue {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.green {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }

  &.orange {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  }
}

.card-header-text {
  flex: 1;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--n-text-color);
}

.card-subtitle {
  font-size: 0.8125rem;
  color: var(--n-text-color-3);
  margin: 0;
}

.card-content {
  padding: 24px;

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
}

// Notification Items
.notification-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  background: transparent;
  border-radius: 16px;
  border: 2.5px solid rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  min-height: 80px;

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:hover {
    border-color: var(--n-primary-color);
    background: rgba(0, 0, 0, 0.02);

    :root.dark & {
      background: rgba(255, 255, 255, 0.03);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    min-height: auto;
  }
}

.notification-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.notification-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--n-text-color);
}

.notification-desc {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
}

// Push Disabled
.push-disabled {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-2);
  font-size: 0.875rem;
  margin: 0;
  padding: 12px 16px;
  background: var(--n-color-embedded);
  border-radius: 8px;
  min-height: 48px;
}

// Form Field
.form-field-notification {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--n-text-color-2);
}

.field-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  margin: 0;
}

// Actions Bar
.actions-bar {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  background: var(--n-card-color);
  border-radius: 16px;
  border: 1px solid var(--n-border-color);

  @media (max-width: 768px) {
    button {
      width: 100%;
    }
  }
}
</style>
