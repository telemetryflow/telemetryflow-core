<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useMessage } from 'naive-ui';
import { useAppStore } from '@/store';

const message = useMessage();
const appStore = useAppStore();

// State
const language = ref('en');
const dateFormat = ref('MM/DD/YYYY');
const timeFormat = ref('12h');
const timezone = ref('UTC');
const itemsPerPage = ref(20);
const enableAnimations = ref(true);
const compactMode = ref(false);
const enableNotifications = ref(true);
const enableSounds = ref(false);

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Bahasa Indonesia', value: 'id' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Chinese (Simplified)', value: 'zh-CN' },
];

const dateFormatOptions = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
];

const timeFormatOptions = [
  { label: '12-hour (AM/PM)', value: '12h' },
  { label: '24-hour', value: '24h' },
];

const itemsPerPageOptions = [
  { label: '10 items', value: 10 },
  { label: '20 items', value: 20 },
  { label: '50 items', value: 50 },
  { label: '100 items', value: 100 },
];

function handleSavePreferences() {
  message.success('Preferences saved successfully!');
}

function handleResetPreferences() {
  language.value = 'en';
  dateFormat.value = 'MM/DD/YYYY';
  timeFormat.value = '12h';
  timezone.value = 'UTC';
  itemsPerPage.value = 20;
  enableAnimations.value = true;
  compactMode.value = false;
  enableNotifications.value = true;
  enableSounds.value = false;
  message.info('Preferences reset to defaults');
}
</script>

<template>
  <div class="preferences-page">
    <!-- Hero Section -->
    <div class="preferences-hero">
      <div class="hero-background" />
      <div class="hero-content">
        <div class="hero-icon">
          <Icon icon="carbon:settings-adjust" :width="48" :height="48" />
        </div>
        <div class="hero-text">
          <h1 class="hero-title">Preferences</h1>
          <p class="hero-subtitle">Customize your experience and interface settings</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="preferences-content">
      <!-- Appearance Card -->
      <div class="pref-card appearance">
        <div class="card-header-custom">
          <div class="card-icon-wrapper purple">
            <Icon icon="carbon:paint-brush" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Appearance</h3>
            <p class="card-subtitle">Customize the look and feel</p>
          </div>
        </div>

        <div class="card-content">
          <div class="pref-section">
            <div class="pref-item">
              <div class="pref-label">
                <Icon icon="carbon:asleep" :width="20" :height="20" />
                <div class="pref-label-text">
                  <span class="pref-label-title">Theme</span>
                  <span class="pref-label-desc">Choose your preferred color scheme</span>
                </div>
              </div>
              <div class="pref-control">
                <div class="theme-buttons">
                  <button
                    class="theme-btn"
                    :class="{ active: !appStore.isDarkMode }"
                    @click="appStore.setTheme('light')"
                  >
                    <Icon icon="carbon:sun" :width="20" :height="20" />
                    <span>Light</span>
                  </button>
                  <button
                    class="theme-btn"
                    :class="{ active: appStore.isDarkMode }"
                    @click="appStore.setTheme('dark')"
                  >
                    <Icon icon="carbon:moon" :width="20" :height="20" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="pref-item">
              <div class="pref-label">
                <Icon icon="carbon:magnify" :width="20" :height="20" />
                <div class="pref-label-text">
                  <span class="pref-label-title">Display Mode</span>
                  <span class="pref-label-desc">Adjust content density</span>
                </div>
              </div>
              <div class="pref-control">
                <n-switch v-model:value="compactMode" size="large">
                  <template #checked>Compact</template>
                  <template #unchecked>Comfortable</template>
                </n-switch>
              </div>
            </div>

            <div class="pref-item">
              <div class="pref-label">
                <Icon icon="carbon:play-filled-alt" :width="20" :height="20" />
                <div class="pref-label-text">
                  <span class="pref-label-title">Animations</span>
                  <span class="pref-label-desc">Enable smooth transitions</span>
                </div>
              </div>
              <div class="pref-control">
                <n-switch v-model:value="enableAnimations" size="large" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Localization Card -->
      <div class="pref-card localization">
        <div class="card-header-custom">
          <div class="card-icon-wrapper blue">
            <Icon icon="carbon:earth" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Localization</h3>
            <p class="card-subtitle">Language and regional settings</p>
          </div>
        </div>

        <div class="card-content">
          <div class="pref-section">
            <div class="pref-item-vertical">
              <div class="pref-label">
                <Icon icon="carbon:language" :width="20" :height="20" />
                <div class="pref-label-text">
                  <span class="pref-label-title">Language</span>
                  <span class="pref-label-desc">Select your preferred language</span>
                </div>
              </div>
              <n-select v-model:value="language" :options="languageOptions" size="large" />
            </div>

            <div class="pref-item-vertical">
              <div class="pref-label">
                <Icon icon="carbon:calendar" :width="20" :height="20" />
                <div class="pref-label-text">
                  <span class="pref-label-title">Date Format</span>
                  <span class="pref-label-desc">How dates are displayed</span>
                </div>
              </div>
              <n-select v-model:value="dateFormat" :options="dateFormatOptions" size="large" />
            </div>

            <div class="pref-item-vertical">
              <div class="pref-label">
                <Icon icon="carbon:time" :width="20" :height="20" />
                <div class="pref-label-text">
                  <span class="pref-label-title">Time Format</span>
                  <span class="pref-label-desc">12-hour or 24-hour clock</span>
                </div>
              </div>
              <n-select v-model:value="timeFormat" :options="timeFormatOptions" size="large" />
            </div>

            <div class="pref-item-vertical">
              <div class="pref-label">
                <Icon icon="carbon:location" :width="20" :height="20" />
                <div class="pref-label-text">
                  <span class="pref-label-title">Timezone</span>
                  <span class="pref-label-desc">Auto-detected from browser</span>
                </div>
              </div>
              <n-input v-model:value="timezone" placeholder="UTC" size="large" disabled />
            </div>
          </div>
        </div>
      </div>

      <!-- Data Display Card -->
      <div class="pref-card data-display">
        <div class="card-header-custom">
          <div class="card-icon-wrapper green">
            <Icon icon="carbon:data-table" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Data Display</h3>
            <p class="card-subtitle">Table and list preferences</p>
          </div>
        </div>

        <div class="card-content">
          <div class="pref-section">
            <div class="pref-item-vertical">
              <div class="pref-label">
                <Icon icon="carbon:list-numbered" :width="20" :height="20" />
                <div class="pref-label-text">
                  <span class="pref-label-title">Items Per Page</span>
                  <span class="pref-label-desc">Default pagination size</span>
                </div>
              </div>
              <n-select v-model:value="itemsPerPage" :options="itemsPerPageOptions" size="large" />
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications Card -->
      <div class="pref-card notifications">
        <div class="card-header-custom">
          <div class="card-icon-wrapper orange">
            <Icon icon="carbon:notification" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Notifications</h3>
            <p class="card-subtitle">Alert and sound preferences</p>
          </div>
        </div>

        <div class="card-content">
          <div class="pref-section">
            <div class="pref-item">
              <div class="pref-label">
                <Icon icon="carbon:notification-new" :width="20" :height="20" />
                <div class="pref-label-text">
                  <span class="pref-label-title">Desktop Notifications</span>
                  <span class="pref-label-desc">Show browser notifications</span>
                </div>
              </div>
              <div class="pref-control">
                <n-switch v-model:value="enableNotifications" size="large" />
              </div>
            </div>

            <div class="pref-item">
              <div class="pref-label">
                <Icon icon="carbon:volume-up" :width="20" :height="20" />
                <div class="pref-label-text">
                  <span class="pref-label-title">Sound Effects</span>
                  <span class="pref-label-desc">Play sounds for alerts</span>
                </div>
              </div>
              <div class="pref-control">
                <n-switch v-model:value="enableSounds" size="large" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-bar">
        <n-button size="large" @click="handleResetPreferences">
          <template #icon>
            <Icon icon="carbon:reset" />
          </template>
          Reset to Defaults
        </n-button>
        <n-button type="primary" size="large" @click="handleSavePreferences">
          <template #icon>
            <Icon icon="carbon:save" />
          </template>
          Save Preferences
        </n-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preferences-page {
  min-height: 100vh;
  background: var(--n-color);
}

// Hero Section
.preferences-hero {
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
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

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
    background: linear-gradient(135deg, #c471ed 0%, #f64f59 100%);
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
.preferences-content {
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

// Preference Cards
.pref-card {
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

  &.appearance {
    grid-column: 1 / -1;
  }

  &.localization {
    grid-column: 1 / -1;
  }

  &.data-display {
    grid-column: 1 / 2;
  }

  &.notifications {
    grid-column: 2 / 3;
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

  &.purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.blue {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

// Preference Sections
.pref-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pref-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  min-height: 80px;
  background: transparent;
  border-radius: 16px;
  border: 2.5px solid rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.2);
    background: transparent;
  }

  &:hover {
    border-color: var(--n-primary-color);
    background: rgba(0, 0, 0, 0.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    :root.dark & {
      background: rgba(255, 255, 255, 0.03);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    min-height: auto;
  }
}

.pref-item-vertical {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: transparent;
  border-radius: 16px;
  border: 2.5px solid rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.2);
    background: transparent;
  }

  &:hover {
    border-color: var(--n-primary-color);
    background: rgba(0, 0, 0, 0.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    :root.dark & {
      background: rgba(255, 255, 255, 0.03);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }
}

.pref-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.pref-label-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pref-label-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--n-text-color);
}

.pref-label-desc {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
}

.pref-control {
  flex-shrink: 0;
}

// Theme Buttons
.theme-buttons {
  display: flex;
  gap: 8px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  border: 2px solid var(--n-border-color);
  background: var(--n-color);
  color: var(--n-text-color);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--n-primary-color);
    background: var(--n-primary-color-hover);
  }

  &.active {
    border-color: var(--n-primary-color);
    background: var(--n-primary-color);
    color: white;
  }
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
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
}
</style>
