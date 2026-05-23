<script setup lang="ts">
import { onMounted, computed } from 'vue';
import {
  NConfigProvider,
  NMessageProvider,
  NNotificationProvider,
  NDialogProvider,
  NLoadingBarProvider,
  darkTheme,
  type GlobalThemeOverrides,
} from 'naive-ui';
import { useAppStore } from '@/store';

const appStore = useAppStore();

// Initialize EARLY (before children render) so timezone/theme are correct on first paint
appStore.initializeFromStorage();

// Light theme overrides
const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#3b82f6',
    primaryColorHover: '#60a5fa',
    primaryColorPressed: '#2563eb',
    primaryColorSuppl: '#3b82f6',
    infoColor: '#06b6d4',
    successColor: '#22c55e',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
    borderRadius: '8px',
    borderRadiusSmall: '4px',
    fontFamily: '"Roboto", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontFamilyMono: '"JetBrains Mono", "Menlo", "SF Mono", "Monaco", "Inconsolata", monospace',
  },
  Button: {
    borderRadiusMedium: '8px',
    borderRadiusSmall: '6px',
  },
  Card: {
    borderRadius: '12px',
  },
  Input: {
    borderRadius: '8px',
  },
  Select: {
    borderRadius: '8px',
  },
  Tag: {
    fontWeightStrong: '700',
  },
};

// Dark theme overrides - softer colors for eye comfort
const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#60a5fa',
    primaryColorHover: '#93c5fd',
    primaryColorPressed: '#3b82f6',
    primaryColorSuppl: '#60a5fa',
    infoColor: '#22d3ee',
    successColor: '#4ade80',
    warningColor: '#fbbf24',
    errorColor: '#f87171',
    borderRadius: '8px',
    borderRadiusSmall: '4px',
    fontFamily: '"Roboto", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontFamilyMono: '"JetBrains Mono", "Menlo", "SF Mono", "Monaco", "Inconsolata", monospace',
    // Softer dark backgrounds
    bodyColor: '#1a1a1e',
    cardColor: '#242428',
    modalColor: '#242428',
    popoverColor: '#2a2a2e',
    tableColor: '#242428',
    // Text colors - brighter for better readability
    textColorBase: '#f4f4f5',
    textColor1: '#f4f4f5',
    textColor2: '#d4d4d8',
    textColor3: '#a1a1aa',
    // Softer borders
    borderColor: '#3f3f46',
    dividerColor: '#3f3f46',
    // Input backgrounds
    inputColor: '#27272a',
    inputColorDisabled: '#1f1f23',
    // Hover states
    hoverColor: 'rgba(255, 255, 255, 0.06)',
    pressedColor: 'rgba(255, 255, 255, 0.08)',
  },
  Button: {
    borderRadiusMedium: '8px',
    borderRadiusSmall: '6px',
  },
  Card: {
    borderRadius: '12px',
    color: '#242428',
    borderColor: '#3f3f46',
  },
  Input: {
    borderRadius: '8px',
    color: '#27272a',
    colorFocus: '#2a2a2e',
    border: '1px solid #3f3f46',
    borderHover: '1px solid #52525b',
    borderFocus: '1px solid #60a5fa',
  },
  Select: {
    borderRadius: '8px',
    peers: {
      InternalSelection: {
        color: '#27272a',
        colorActive: '#2a2a2e',
        border: '1px solid #52525b',
        borderHover: '1px solid #71717a',
        borderActive: '1px solid #60a5fa',
        borderFocus: '1px solid #60a5fa',
        boxShadowFocus: '0 0 0 2px rgba(96, 165, 250, 0.2)',
        textColor: '#f4f4f5',
        placeholderColor: '#a1a1aa',
      },
    },
  },
  Tag: {
    fontWeightStrong: '700',
  },
  DataTable: {
    thColor: '#27272a',
    tdColor: '#242428',
    tdColorHover: '#2a2a2e',
    borderColor: '#3f3f46',
  },
  Menu: {
    color: '#242428',
    itemColorHover: 'rgba(255, 255, 255, 0.06)',
    itemColorActive: 'rgba(96, 165, 250, 0.15)',
  },
  Dropdown: {
    color: '#2a2a2e',
    optionColorHover: 'rgba(255, 255, 255, 0.06)',
    optionColorActive: 'rgba(96, 165, 250, 0.15)',
  },
  Tabs: {
    // Tab text colors - brighter for readability
    tabTextColorLine: '#a1a1aa',
    tabTextColorActiveLine: '#f4f4f5',
    tabTextColorHoverLine: '#d4d4d8',
    tabTextColorBar: '#a1a1aa',
    tabTextColorActiveBar: '#f4f4f5',
    tabTextColorHoverBar: '#d4d4d8',
    tabTextColorCard: '#a1a1aa',
    tabTextColorActiveCard: '#f4f4f5',
    tabTextColorHoverCard: '#d4d4d8',
    tabTextColorSegment: '#a1a1aa',
    tabTextColorActiveSegment: '#f4f4f5',
    tabTextColorHoverSegment: '#d4d4d8',
    // Active bar/indicator color
    barColor: '#60a5fa',
    // Tab backgrounds for card/segment type
    tabColor: '#27272a',
    tabColorSegment: '#3f3f46',
    colorSegment: '#27272a',
    // Border
    tabBorderColor: '#3f3f46',
    // Font weight for active
    tabFontWeightActive: '600',
  },
};

const currentTheme = computed(() => (appStore.isDarkMode ? darkTheme : null));
const themeOverrides = computed(() => (appStore.isDarkMode ? darkThemeOverrides : lightThemeOverrides));

onMounted(() => {
  // Check collector status
  appStore.checkCollectorStatus();

  // Periodically check collector status
  setInterval(() => {
    appStore.checkCollectorStatus();
  }, 30000);
});
</script>

<template>
  <n-config-provider :theme="currentTheme" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <router-view />
          </n-dialog-provider>
        </n-notification-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<style>
@import '@/styles/reset.css';
@import '@/styles/transitions.css';

/* Global font settings */
body {
  font-family: 'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  /* Inter OpenType features */
}

/* Monospace font for code elements */
code,
pre,
.mono,
kbd,
samp {
  font-family: 'JetBrains Mono', 'Menlo', 'SF Mono', 'Monaco', 'Inconsolata', monospace;
}

/* ECharts tooltip - ensure it appears on top of all elements */
div[class*="echarts"]>div[style*="position"][style*="absolute"],
div[style*="position: absolute"][style*="pointer-events: none"],
div[style*="position: absolute"][style*="z-index"],
body>div[style*="position: absolute"] {
  z-index: 99999 !important;
}

/* More specific selector for ECharts tooltip container */
div[style*="position: absolute"][style*="display: block"],
div[style*="position: absolute"][style*="white-space"],
div[style*="position: absolute"][style*="border"] {
  z-index: 99999 !important;
  pointer-events: auto !important;
}
</style>

<style lang="scss">
@use '@/styles/global.scss';
</style>