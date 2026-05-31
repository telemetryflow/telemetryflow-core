<script setup lang="ts">
import { h, ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { NAvatar } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import { useAppStore, useAuthStore } from '@/store';
import { config, brandDefaults, whiteLabelConfig } from '@/config';
import userAvatar from '@/assets/user.svg';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

const pageTitle = computed(() => route.meta.title as string || config.appTitle);

const showTimeRangePicker = ref(false);
const showUserDropdown = ref(false);
const searchQuery = ref('');
const absoluteFrom = ref('now-1h');
const absoluteTo = ref('now');
const showTimeSettings = ref(false);
const timezoneSearchQuery = ref('');
const selectedTimezone = ref<string>('UTC');
const selectedTimezoneName = ref<string>('UTC');
const selectedTimezoneLocation = ref<string>('Coordinated Universal Time');
const customDateFrom = ref<number | null>(null);
const customDateTo = ref<number | null>(null);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const browserTimezone = computed(() => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
});

const browserTimezoneOffset = computed(() => {
  const offset = -new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

// Extended timezone list (computed to access browser timezone)
const allTimezones = computed(() => [
  { name: 'UTC', location: 'Coordinated Universal Time', offset: '+00:00', value: 'UTC' },
  { name: 'Browser Time', location: browserTimezone.value, offset: browserTimezoneOffset.value, value: 'browser' },
  { name: 'Default', location: 'Indonesia, WIB', offset: '+07:00', value: 'Asia/Jakarta' },
  { name: 'Africa/Abidjan', location: 'Burkina Faso, GMT', offset: '+00:00', value: 'Africa/Abidjan', region: 'Africa' },
  { name: 'Africa/Accra', location: 'Ghana, GMT', offset: '+00:00', value: 'Africa/Accra', region: 'Africa' },
  { name: 'Africa/Addis_Ababa', location: 'Ethiopia, EAT', offset: '+03:00', value: 'Africa/Addis_Ababa', region: 'Africa' },
  { name: 'Africa/Algiers', location: 'Algeria, CET', offset: '+01:00', value: 'Africa/Algiers', region: 'Africa' },
  { name: 'Africa/Asmara', location: 'Eritrea, EAT', offset: '+03:00', value: 'Africa/Asmara', region: 'Africa' },
  { name: 'America/New_York', location: 'USA, EST', offset: '-05:00', value: 'America/New_York', region: 'America' },
  { name: 'America/Chicago', location: 'USA, CST', offset: '-06:00', value: 'America/Chicago', region: 'America' },
  { name: 'America/Los_Angeles', location: 'USA, PST', offset: '-08:00', value: 'America/Los_Angeles', region: 'America' },
  { name: 'Europe/London', location: 'United Kingdom, GMT', offset: '+00:00', value: 'Europe/London', region: 'Europe' },
  { name: 'Europe/Paris', location: 'France, CET', offset: '+01:00', value: 'Europe/Paris', region: 'Europe' },
  { name: 'Asia/Tokyo', location: 'Japan, JST', offset: '+09:00', value: 'Asia/Tokyo', region: 'Asia' },
  { name: 'Asia/Shanghai', location: 'China, CST', offset: '+08:00', value: 'Asia/Shanghai', region: 'Asia' },
  { name: 'Asia/Singapore', location: 'Singapore, SGT', offset: '+08:00', value: 'Asia/Singapore', region: 'Asia' },
  { name: 'Australia/Sydney', location: 'Australia, AEDT', offset: '+11:00', value: 'Australia/Sydney', region: 'Australia' },
]);

const filteredTimezones = computed(() => {
  if (!timezoneSearchQuery.value) return allTimezones.value;
  const query = timezoneSearchQuery.value.toLowerCase();
  return allTimezones.value.filter(tz =>
    tz.name.toLowerCase().includes(query) ||
    tz.location.toLowerCase().includes(query)
  );
});

// Update absoluteFrom when the modal opens to match current time range
function handleTimePickerOpen() {
  const label = currentTimeRangeLabel.value;
  const option = timeRangeOptions.find(opt => opt.label === label);
  if (option) {
    absoluteFrom.value = option.from;
    absoluteTo.value = option.to;
  }
}

function toggleTimeSettings() {
  showTimeSettings.value = !showTimeSettings.value;
}

function selectTimezone(timezone: any) {
  selectedTimezone.value = timezone.value;
  selectedTimezoneName.value = timezone.name;
  selectedTimezoneLocation.value = timezone.location;
  // Sync to Pinia store so charts react
  appStore.setTimezone(timezone.value);
  // Save to localStorage
  localStorage.setItem('tfo-viz-timezone', JSON.stringify({
    value: timezone.value,
    name: timezone.name,
    location: timezone.location,
    offset: timezone.offset
  }));
  showTimeSettings.value = false;
}

interface TimeRangeOption {
  label: string;
  value: string;
  from: string;
  to: string;
  group?: string;
}

const timeRangeOptions: TimeRangeOption[] = [
  { label: 'Last 5 minutes', value: '5m', from: 'now-5m', to: 'now', group: 'minutes' },
  { label: 'Last 15 minutes', value: '15m', from: 'now-15m', to: 'now', group: 'minutes' },
  { label: 'Last 30 minutes', value: '30m', from: 'now-30m', to: 'now', group: 'minutes' },
  { label: 'Last 1 hour', value: '1h', from: 'now-1h', to: 'now', group: 'hours-short' },
  { label: 'Last 3 hours', value: '3h', from: 'now-3h', to: 'now', group: 'hours-short' },
  { label: 'Last 6 hours', value: '6h', from: 'now-6h', to: 'now', group: 'hours-short' },
  { label: 'Last 12 hours', value: '12h', from: 'now-12h', to: 'now', group: 'hours-short' },
  { label: 'Last 24 hours', value: '24h', from: 'now-24h', to: 'now', group: 'hours-long' },
  { label: 'Last 2 days', value: '2d', from: 'now-2d', to: 'now', group: 'days-short' },
  { label: 'Last 7 days', value: '7d', from: 'now-7d', to: 'now', group: 'days-short' },
  { label: 'Last 14 days', value: '14d', from: 'now-14d', to: 'now', group: 'days-long' },
  { label: 'Last 30 days', value: '30d', from: 'now-30d', to: 'now', group: 'days-long' },
  { label: 'Last 90 days', value: '90d', from: 'now-90d', to: 'now', group: 'days-long' },
];

const filteredTimeRangeOptions = computed(() => {
  if (!searchQuery.value) return timeRangeOptions;
  const query = searchQuery.value.toLowerCase();
  return timeRangeOptions.filter(opt => opt.label.toLowerCase().includes(query));
});

const refreshIntervalOptions: SelectOption[] = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
  { label: '15m', value: 900000 },
];

// User dropdown menu options
const userMenuOptions = computed(() => [
  {
    key: 'header',
    type: 'render',
    render: () => h('div', { class: 'user-menu-header' }, [
      h('div', { class: 'user-avatar-wrapper' }, [
        h(NAvatar, {
          src: userAvatar,
          round: true,
          size: 48,
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: '3px solid rgba(255, 255, 255, 0.2)'
          }
        })
      ]),
      h('div', { class: 'user-info' }, [
        h('span', { class: 'user-name' }, authStore.currentUser?.username || authStore.currentUser?.email || 'Admin'),
        h('span', { class: 'user-email' }, authStore.currentUser?.email || brandDefaults.exampleEmail('admin')),
        h('div', { class: 'user-badges' }, [
          h('span', { class: 'badge badge-verified' }, [
            h(Icon, { icon: 'carbon:checkmark-filled', width: 12, height: 12 }),
            ' Verified'
          ]),
          h('span', { class: 'badge badge-role' }, 'Administrator')
        ])
      ])
    ])
  },
  { type: 'divider', key: 'd1' },
  {
    key: 'account',
    label: 'My Profile',
    icon: 'carbon:user-avatar',
    description: 'View and edit your profile',
    iconGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    key: 'preferences',
    label: 'Preferences',
    icon: 'carbon:settings',
    description: 'Customize your experience',
    iconGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    key: 'security',
    label: 'Security',
    icon: 'carbon:security',
    description: 'Password and 2FA settings',
    iconGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    key: 'sessions',
    label: 'Sessions',
    icon: 'carbon:devices',
    description: 'Manage active sessions',
    iconGradient: 'linear-gradient(135deg, #fa8bff 0%, #2bd2ff 90%)'
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: 'carbon:notification',
    description: 'Manage notification settings',
    iconGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
  { type: 'divider', key: 'd2' },
  {
    key: 'help',
    label: 'Help & Support',
    icon: 'carbon:help',
    description: 'Documentation and support',
    iconGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  { type: 'divider', key: 'd3' },
  {
    key: 'logout',
    label: 'Logout',
    icon: 'carbon:logout',
    description: 'Sign out of your account',
    iconGradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
    isLogout: true
  }
]);

// Custom render function for dropdown options
function renderDropdownOption({ node, option }: any) {
  // If it's a render type (header), use the default render
  if (option.type === 'render') {
    return option.render();
  }

  // If it's a divider, return the node as is
  if (option.type === 'divider') {
    return node;
  }

  // For regular menu items with icon and description
  if (option.icon) {
    return h('div', {
      class: 'custom-dropdown-option',
      onClick: (e: Event) => {
        e.stopPropagation();
        handleUserMenuSelect(option.key);
      }
    }, [
      h('div', {
        class: 'menu-item-icon',
        style: `background: ${option.iconGradient}`
      }, [
        h(Icon, { icon: option.icon, width: 18, height: 18 })
      ]),
      h('div', { class: 'menu-item-text' }, [
        h('span', {
          class: 'menu-item-title',
          style: option.isLogout ? 'color: #ef4444' : ''
        }, option.label),
        h('span', { class: 'menu-item-desc' }, option.description)
      ])
    ]);
  }

  // Default fallback
  return node;
}

const currentTimeRangeLabel = computed(() => {
  const diff = appStore.globalTimeRange.end - appStore.globalTimeRange.start;
  const tolerance = 5 * 60 * 1000; // 5 minutes tolerance

  // Define exact preset durations in milliseconds
  const presets = [
    { duration: 5 * 60 * 1000, label: 'Last 5 minutes' },
    { duration: 15 * 60 * 1000, label: 'Last 15 minutes' },
    { duration: 30 * 60 * 1000, label: 'Last 30 minutes' },
    { duration: 60 * 60 * 1000, label: 'Last 1 hour' },
    { duration: 3 * 60 * 60 * 1000, label: 'Last 3 hours' },
    { duration: 6 * 60 * 60 * 1000, label: 'Last 6 hours' },
    { duration: 12 * 60 * 60 * 1000, label: 'Last 12 hours' },
    { duration: 24 * 60 * 60 * 1000, label: 'Last 24 hours' },
    { duration: 2 * 24 * 60 * 60 * 1000, label: 'Last 2 days' },
    { duration: 7 * 24 * 60 * 60 * 1000, label: 'Last 7 days' },
    { duration: 14 * 24 * 60 * 60 * 1000, label: 'Last 14 days' },
    { duration: 30 * 24 * 60 * 60 * 1000, label: 'Last 30 days' },
    { duration: 90 * 24 * 60 * 60 * 1000, label: 'Last 90 days' },
  ];

  // Check if current duration matches any preset (within tolerance)
  for (const preset of presets) {
    if (Math.abs(diff - preset.duration) < tolerance) {
      return preset.label;
    }
  }

  // For custom ranges, show the actual date range
  const startDate = new Date(appStore.globalTimeRange.start);
  const endDate = new Date(appStore.globalTimeRange.end);
  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
});

function handleQuickRangeSelect(option: TimeRangeOption) {
  absoluteFrom.value = option.from;
  absoluteTo.value = option.to;
  appStore.setTimeRangePreset(option.value);
  showTimeRangePicker.value = false;
  searchQuery.value = '';
}

function applyTimeRange() {
  // If custom dates are set, use them directly
  if (customDateFrom.value && customDateTo.value) {
    appStore.setTimeRange(customDateFrom.value, customDateTo.value);
    // Update the display values
    absoluteFrom.value = formatDate(customDateFrom.value);
    absoluteTo.value = formatDate(customDateTo.value);
  } else {
    // Extract preset from absoluteFrom (e.g., "now-15m" -> "15m")
    const fromValue = absoluteFrom.value.replace('now-', '');
    if (fromValue && absoluteTo.value === 'now') {
      appStore.setTimeRangePreset(fromValue);
    }
  }
  showTimeRangePicker.value = false;
  searchQuery.value = '';
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function handleRefreshIntervalChange(value: number) {
  appStore.setRefreshInterval(value);
  setupRefreshTimer();
}

function handleRefresh() {
  const now = Date.now();
  const duration = appStore.globalTimeRange.end - appStore.globalTimeRange.start;
  appStore.setTimeRange(now - duration, now);
}

function setupRefreshTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  if (appStore.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      handleRefresh();
    }, appStore.refreshInterval);
  }
}

// Watch for time picker opening to sync input values with current selection
watch(showTimeRangePicker, (isOpen) => {
  if (isOpen) {
    handleTimePickerOpen();
  }
});

// Watch for custom date changes and update the input display
watch(customDateFrom, (newValue) => {
  if (newValue) {
    absoluteFrom.value = formatDate(newValue);
  }
});

watch(customDateTo, (newValue) => {
  if (newValue) {
    absoluteTo.value = formatDate(newValue);
  }
});

onMounted(() => {
  setupRefreshTimer();
  // Load saved timezone
  const savedTimezone = localStorage.getItem('tfo-viz-timezone');
  if (savedTimezone) {
    try {
      const tz = JSON.parse(savedTimezone);
      selectedTimezone.value = tz.value;
      selectedTimezoneName.value = tz.name;
      selectedTimezoneLocation.value = tz.location;
      appStore.setTimezone(tz.value);
    } catch (e) {
      // Use defaults
    }
  }
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

async function handleLogout() {
  // Close dropdown immediately
  showUserDropdown.value = false;

  try {
    await authStore.logout();
    // Force redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even if logout fails
    window.location.href = '/login';
  }
}

function handleUserMenuSelect(key: string) {
  // Close dropdown immediately for all actions
  showUserDropdown.value = false;

  switch (key) {
    case 'account':
      router.push('/account/profile');
      break;
    case 'preferences':
      router.push('/account/preferences');
      break;
    case 'security':
      router.push('/account/security');
      break;
    case 'sessions':
      router.push('/account/sessions');
      break;
    case 'notifications':
      router.push('/account/notifications');
      break;
    case 'help':
      window.open(whiteLabelConfig.githubUrl, '_blank');
      break;
    case 'logout':
      handleLogout();
      break;
  }
}
</script>

<template>
  <div class="topbar-content">
    <!-- Hamburger Menu / Sidebar Toggle -->
    <div class="left-section">
      <n-tooltip trigger="hover" placement="bottom">
        <template #trigger>
          <n-button quaternary size="small" class="menu-toggle" @click="appStore.toggleSidebar">
            <template #icon>
              <Icon icon="carbon:menu" :width="20" :height="20" />
            </template>
          </n-button>
        </template>
        {{ appStore.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar' }}
      </n-tooltip>

      <!-- Page Title / Breadcrumb -->
      <div class="page-info">
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <!-- Time Range Picker -->
      <n-popover
        v-model:show="showTimeRangePicker"
        trigger="click"
        placement="bottom-end"
        :show-arrow="false"
        :content-style="{ padding: 0 }"
      >
        <template #trigger>
          <n-button size="small" class="time-range-button">
            <template #icon>
              <Icon icon="carbon:time" :width="16" :height="16" />
            </template>
            <span class="time-range-label">{{ currentTimeRangeLabel }}</span>
            <Icon icon="carbon:chevron-down" :width="14" :height="14" class="chevron-icon" />
          </n-button>
        </template>
        <div class="time-range-picker">
          <!-- Absolute time range section -->
          <div class="time-range-section">
            <div class="section-title">Absolute time range</div>
            <div class="input-group">
              <label class="input-label">From</label>
              <n-input
                v-model:value="absoluteFrom"
                size="small"
                placeholder="now-15m"
              >
                <template #suffix>
                  <n-popover trigger="click" placement="bottom-start">
                    <template #trigger>
                      <Icon icon="carbon:calendar" :width="14" :height="14" class="calendar-icon-trigger" />
                    </template>
                    <n-date-picker
                      v-model:value="customDateFrom"
                      type="datetime"
                      panel
                      @update:value="absoluteFrom = formatDate($event)"
                    />
                  </n-popover>
                </template>
              </n-input>
            </div>
            <div class="input-group">
              <label class="input-label">To</label>
              <n-input
                v-model:value="absoluteTo"
                size="small"
                placeholder="now"
              >
                <template #suffix>
                  <n-popover trigger="click" placement="bottom-start">
                    <template #trigger>
                      <Icon icon="carbon:calendar" :width="14" :height="14" class="calendar-icon-trigger" />
                    </template>
                    <n-date-picker
                      v-model:value="customDateTo"
                      type="datetime"
                      panel
                      @update:value="absoluteTo = formatDate($event)"
                    />
                  </n-popover>
                </template>
              </n-input>
            </div>
            <div class="action-buttons">
              <n-button size="tiny" quaternary>
                <template #icon>
                  <Icon icon="carbon:copy" :width="14" :height="14" />
                </template>
              </n-button>
              <n-button size="tiny" quaternary>
                <template #icon>
                  <Icon icon="carbon:paste" :width="14" :height="14" />
                </template>
              </n-button>
              <n-button type="primary" size="small" @click="applyTimeRange">
                Apply time range
              </n-button>
            </div>
          </div>

          <!-- Quick ranges section -->
          <div class="quick-ranges-section">
            <n-input
              v-model:value="searchQuery"
              size="small"
              placeholder="Search quick ranges"
              class="search-input"
            >
              <template #prefix>
                <Icon icon="carbon:search" :width="14" :height="14" />
              </template>
            </n-input>

            <div class="ranges-list">
              <div
                v-for="(option, index) in filteredTimeRangeOptions"
                :key="option.value"
                class="range-item"
                :class="{
                  active: currentTimeRangeLabel === option.label,
                  'group-separator': index > 0 && option.group !== filteredTimeRangeOptions[index - 1].group
                }"
                @click="handleQuickRangeSelect(option)"
              >
                {{ option.label }}
              </div>
              <div v-if="filteredTimeRangeOptions.length === 0" class="no-results">
                No matching ranges found
              </div>
            </div>

            <!-- Browser time info -->
            <div class="browser-time-info">
              <span class="browser-time-label">{{ selectedTimezoneName }}</span>
              <span class="browser-time-zone">{{ selectedTimezoneLocation }}</span>
              <n-button text size="tiny" class="change-settings-btn" @click="toggleTimeSettings">
                <template #icon>
                  <Icon :icon="showTimeSettings ? 'carbon:chevron-up' : 'carbon:chevron-down'" :width="12" :height="12" />
                </template>
                Change time settings
              </n-button>
            </div>
            <div class="timezone-offset-display">
              UTC{{ allTimezones.find(tz => tz.value === selectedTimezone)?.offset || '+00:00' }}
            </div>

            <!-- Time Settings Panel -->
            <div v-if="showTimeSettings" class="time-settings-panel">
              <div class="timezone-settings">
                <n-input
                  v-model:value="timezoneSearchQuery"
                  size="small"
                  placeholder="Type to search (country, city, abbreviation)"
                  class="timezone-search"
                >
                  <template #prefix>
                    <Icon icon="carbon:search" :width="14" :height="14" />
                  </template>
                </n-input>

                <div class="timezone-list">
                  <div
                    v-for="tz in filteredTimezones"
                    :key="tz.value"
                    class="timezone-item"
                    :class="{ 'is-selected': selectedTimezone === tz.value }"
                    @click="selectTimezone(tz)"
                  >
                    <div class="timezone-info">
                      <span class="timezone-name">{{ tz.name }}</span>
                      <span class="timezone-location">{{ tz.location }}</span>
                    </div>
                    <span class="timezone-offset">UTC{{ tz.offset }}</span>
                  </div>
                  <div v-if="filteredTimezones.length === 0" class="no-results">
                    No matching timezones found
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-popover>

      <!-- Refresh Interval -->
      <n-tooltip trigger="hover" placement="bottom">
        <template #trigger>
          <n-select
            :value="appStore.refreshInterval"
            :options="refreshIntervalOptions"
            size="small"
            style="width: 80px"
            @update:value="handleRefreshIntervalChange"
          />
        </template>
        Auto-refresh interval
      </n-tooltip>

      <!-- Refresh Button -->
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button quaternary circle size="small" @click="handleRefresh">
            <template #icon>
              <Icon icon="carbon:renew" :width="18" :height="18" />
            </template>
          </n-button>
        </template>
        Refresh data
      </n-tooltip>

      <!-- Connection Status -->
      <n-tooltip trigger="hover">
        <template #trigger>
          <div class="connection-status" :class="{ connected: appStore.isConnected }">
            <Icon
              :icon="appStore.isConnected ? 'carbon:checkmark-filled' : 'carbon:warning-alt'"
              :width="16"
              :height="16"
            />
          </div>
        </template>
        {{ appStore.isConnected ? 'Connected to TFO-Collector' : 'Disconnected' }}
      </n-tooltip>

      <!-- Theme Toggle -->
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button quaternary circle size="small" @click="appStore.toggleTheme">
            <template #icon>
              <Icon
                :icon="appStore.isDarkMode ? 'carbon:sun' : 'carbon:moon'"
                :width="18"
                :height="18"
              />
            </template>
          </n-button>
        </template>
        {{ appStore.isDarkMode ? 'Light mode' : 'Dark mode' }}
      </n-tooltip>

      <!-- User Menu -->
      <n-popover
        v-model:show="showUserDropdown"
        trigger="click"
        placement="bottom-end"
        :show-arrow="false"
        raw
      >
        <template #trigger>
          <div class="user-avatar-button">
            <n-avatar
              :src="userAvatar"
              round
              :size="28"
              :style="{ backgroundColor: '#e0e7ff', cursor: 'pointer' }"
            />
          </div>
        </template>

        <div class="user-menu-popup">
          <!-- Header -->
          <div class="user-menu-header">
            <div class="user-avatar-wrapper">
              <n-avatar
                :src="userAvatar" round :size="48"
                :style="{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '3px solid rgba(255,255,255,0.2)' }"
              />
            </div>
            <div class="user-info">
              <span class="user-name">{{ authStore.currentUser?.username || authStore.currentUser?.email || 'Admin' }}</span>
              <span class="user-email">{{ authStore.currentUser?.email || brandDefaults.exampleEmail('admin') }}</span>
              <div class="user-badges">
                <span class="badge badge-verified">
                  <Icon icon="carbon:checkmark-filled" :width="12" :height="12" /> Verified
                </span>
                <span class="badge badge-role">Administrator</span>
              </div>
            </div>
          </div>

          <div class="user-menu-divider" />

          <div class="custom-dropdown-option" @click="handleUserMenuSelect('account')">
            <div class="menu-item-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <Icon icon="carbon:user-avatar" :width="18" :height="18" />
            </div>
            <div class="menu-item-text">
              <span class="menu-item-title">My Profile</span>
              <span class="menu-item-desc">View and edit your profile</span>
            </div>
          </div>

          <div class="custom-dropdown-option" @click="handleUserMenuSelect('preferences')">
            <div class="menu-item-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <Icon icon="carbon:settings" :width="18" :height="18" />
            </div>
            <div class="menu-item-text">
              <span class="menu-item-title">Preferences</span>
              <span class="menu-item-desc">Customize your experience</span>
            </div>
          </div>

          <div class="custom-dropdown-option" @click="handleUserMenuSelect('security')">
            <div class="menu-item-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <Icon icon="carbon:security" :width="18" :height="18" />
            </div>
            <div class="menu-item-text">
              <span class="menu-item-title">Security</span>
              <span class="menu-item-desc">Password and 2FA settings</span>
            </div>
          </div>

          <div class="custom-dropdown-option" @click="handleUserMenuSelect('sessions')">
            <div class="menu-item-icon" style="background: linear-gradient(135deg, #fa8bff 0%, #2bd2ff 90%)">
              <Icon icon="carbon:devices" :width="18" :height="18" />
            </div>
            <div class="menu-item-text">
              <span class="menu-item-title">Sessions</span>
              <span class="menu-item-desc">Manage active sessions</span>
            </div>
          </div>

          <div class="custom-dropdown-option" @click="handleUserMenuSelect('notifications')">
            <div class="menu-item-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              <Icon icon="carbon:notification" :width="18" :height="18" />
            </div>
            <div class="menu-item-text">
              <span class="menu-item-title">Notifications</span>
              <span class="menu-item-desc">Manage notification settings</span>
            </div>
          </div>

          <div class="user-menu-divider" />

          <div class="custom-dropdown-option" @click="handleUserMenuSelect('help')">
            <div class="menu-item-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
              <Icon icon="carbon:help" :width="18" :height="18" />
            </div>
            <div class="menu-item-text">
              <span class="menu-item-title">Help &amp; Support</span>
              <span class="menu-item-desc">Documentation and support</span>
            </div>
          </div>

          <div class="user-menu-divider" />

          <div class="custom-dropdown-option" @click="handleUserMenuSelect('logout')">
            <div class="menu-item-icon" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)">
              <Icon icon="carbon:logout" :width="18" :height="18" />
            </div>
            <div class="menu-item-text">
              <span class="menu-item-title" style="color: #ef4444">Logout</span>
              <span class="menu-item-desc">Sign out of your account</span>
            </div>
          </div>
        </div>
      </n-popover>
    </div>
  </div>
</template>

<style scoped lang="scss">
.topbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-toggle {
  flex-shrink: 0;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--n-text-color);
  margin: 0;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  transition: all 0.2s ease;

  &.connected {
    background-color: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }
}

.user-avatar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  cursor: pointer;
  border-radius: 50%;
  transition: box-shadow 0.2s, transform 0.15s;

  &:hover {
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
    transform: scale(1.05);
  }
}

.time-range-button {
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 8px;

  .time-range-label {
    flex: 1;
    text-align: left;
  }

  .chevron-icon {
    margin-left: 5px;
    color: var(--n-text-color-3);
    flex-shrink: 0;
  }
}

.time-range-picker {
  display: flex;
  width: 650px;
  max-height: 500px;
  background: var(--n-color);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--n-border-color);

  :root.dark & {
    background: #242428;
    border-color: #52525b;
  }
}

.time-range-section {
  flex: 0 0 260px;
  padding: 20px;
  border-right: 1px solid var(--n-border-color);
  background: rgba(0, 0, 0, 0.02);

  :root.dark & {
    background: #1a1a1e;
    border-right-color: #3f3f46;
  }
}

.section-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--n-text-color);
  margin-bottom: 16px;
}

.input-group {
  margin-bottom: 12px;
}

.input-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--n-text-color-2);
  margin-bottom: 6px;
}

.calendar-icon-trigger {
  cursor: pointer;
  color: var(--n-text-color-3);
  transition: color 0.15s ease;

  &:hover {
    color: var(--n-primary-color);
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
}

.quick-ranges-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  :root.dark & {
    background: #242428;
  }
}

.search-input {
  margin: 12px 12px 8px 12px;
  max-width: calc(100% - 24px);
}

.ranges-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 12px 8px;
}

.range-item {
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 14px;
  font-size: 0.8125rem;
  color: var(--n-text-color);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;

  &:hover:not(.active) {
    background: rgba(59, 130, 246, 0.12);
    color: var(--n-text-color);

    :root.dark & {
      background: rgba(59, 130, 246, 0.18);
    }
  }

  &.active {
    background: #3b82f6 !important;
    color: #ffffff !important;
    font-weight: 600;
  }

  &.group-separator {
    border-top: 1px solid rgba(128, 128, 128, 0.15);
    margin-top: 4px;
    padding-top: 4px;

    :root.dark & {
      border-top-color: rgba(255, 255, 255, 0.08);
    }
  }

  &.active.group-separator {
    border-top: none;
    margin-top: 4px;
    padding-top: 4px;
  }
}

.no-results {
  padding: 16px 12px;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--n-text-color-3);
}

.browser-time-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--n-border-color);
  font-size: 0.75rem;

  :root.dark & {
    border-top-color: #3f3f46;
  }
}

.browser-time-label {
  font-weight: 600;
  color: var(--n-text-color-2);
}

.browser-time-zone {
  color: var(--n-text-color);
  flex: 1;
}

.change-settings-btn {
  color: var(--n-text-color-3);
  font-size: 0.75rem;
}

.timezone-offset-display {
  padding: 0 12px 12px 12px;
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  font-family: monospace;
}

.time-settings-panel {
  border-top: 1px solid var(--n-border-color);
  background: var(--n-color);

  :root.dark & {
    border-top-color: #3f3f46;
    background: #1a1a1e;
  }
}

.timezone-settings {
  display: flex;
  flex-direction: column;
}

.timezone-search {
  margin: 12px;
  width: calc(100% - 24px);
}

.timezone-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  margin: 0 12px 12px 12px;
  width: calc(100% - 24px);
  box-sizing: border-box;

  :root.dark & {
    border-color: #3f3f46;
  }
}

.timezone-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 1px solid var(--n-border-color);

  :root.dark & {
    border-bottom-color: #3f3f46;
  }

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--n-action-color);
  }

  &.is-selected {
    background: rgba(59, 130, 246, 0.1);
    border-left: 3px solid var(--n-primary-color);
    padding-left: 9px;

    :root.dark & {
      background: rgba(59, 130, 246, 0.15);
    }
  }
}

.timezone-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.timezone-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--n-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timezone-location {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
}

.timezone-offset {
  font-size: 0.75rem;
  color: var(--n-text-color-2);
  font-family: monospace;
  font-weight: 500;
  margin-left: 8px;
  flex-shrink: 0;
}
</style>

<style lang="scss">
// Global styles for user menu dropdown (not scoped)
.user-menu-popup {
  min-width: 260px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--n-color, #fff);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);

  :root.dark & {
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }
}

.user-menu-divider {
  height: 1px;
  background: var(--n-divider-color, rgb(239, 239, 245));
  margin: 1px 0;
}

.user-menu-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-bottom: 1px solid var(--n-border-color);

  :root.dark & {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  }
}

.user-avatar-wrapper {
  flex-shrink: 0;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: #22c55e;
    border: 2px solid var(--n-color);
    border-radius: 50%;
  }
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--n-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-badges {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;

  &.badge-verified {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  &.badge-role {
    background: rgba(99, 102, 241, 0.15);
    color: #6366f1;
  }
}

.custom-dropdown-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  min-width: 280px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.08);

    :root.dark & {
      background: rgba(99, 102, 241, 0.15);
    }

    .menu-item-icon {
      transform: scale(1.05);
    }
  }
}

.menu-item-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  min-width: 280px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.08);

    :root.dark & {
      background: rgba(99, 102, 241, 0.15);
    }

    .menu-item-icon {
      transform: scale(1.05);
    }
  }
}

.menu-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  margin-left: 8px;

  :root.dark & {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}

.menu-item-text {
  display: flex;
  flex-direction: column;
  gap: 0px;
  flex: 1;
  min-width: 0;
}

.menu-item-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--n-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-item-desc {
  font-size: 0.6875rem;
  color: var(--n-text-color-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Hover effect for menu items
.n-dropdown-option:hover {
  .menu-item-icon {
    transform: scale(1.05);
  }
}

// Dropdown menu styling
.n-dropdown-menu {
  padding: 0px !important;
  border-radius: 12px !important;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;

  :root.dark & {
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
  }
}

.n-dropdown-option {
  padding: 0 !important;

  &:hover {
    background: transparent !important;
  }
}

.n-dropdown-option-body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.n-dropdown-option-body__prefix {
  margin-left: 8px;
}

.n-dropdown-divider {
  margin: 1px 0 !important;
}
</style>
