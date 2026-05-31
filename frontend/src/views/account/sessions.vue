<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useMessage, useDialog } from 'naive-ui';
import { getOSInfo } from '@/utils/osIcons';
import { sessionsApi, type Session } from '@/api/sessions';

const message = useMessage();
const dialog = useDialog();

// State
const sessions = ref<Session[]>([]);
const isLoading = ref(true);
const isRevoking = ref<string | null>(null);

onMounted(async () => {
  try {
    const result = await sessionsApi.listSessions();
    sessions.value = result.sessions;
  } catch (err) {
    message.error('Failed to load sessions');
  } finally {
    isLoading.value = false;
  }
});

const currentSession = computed(() => sessions.value.find(s => s.isCurrent));
const otherSessions = computed(() => sessions.value.filter(s => !s.isCurrent));

function getDeviceIcon(device: string | null): string {
  const lower = (device ?? '').toLowerCase();
  if (lower.includes('iphone') || lower.includes('android')) return 'carbon:phone';
  if (lower.includes('ipad') || lower.includes('tablet')) return 'carbon:tablet';
  if (lower.includes('macbook') || lower.includes('laptop')) return 'carbon:laptop';
  if (lower.includes('windows')) return 'logos:microsoft-windows-icon';
  return 'carbon:desktop';
}

function getOSIcon(os: string): string {
  return getOSInfo(os).icon;
}

function getBrowserIcon(browser: string): string {
  const lower = browser.toLowerCase();
  if (lower.includes('chrome')) return 'logos:chrome';
  if (lower.includes('firefox')) return 'logos:firefox';
  if (lower.includes('safari')) return 'logos:safari';
  if (lower.includes('edge')) return 'logos:microsoft-edge';
  return 'carbon:browser';
}

function formatIpAddress(ip: string): string {
  if (!ip) return 'Unknown';
  if (ip === '::1' || ip === '127.0.0.1') return 'Localhost (::1)';
  return ip;
}

function formatDate(ts: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(ts));
}

function getRelativeTime(ts: string | Date): string {
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

async function handleRevokeSession(session: Session) {
  dialog.warning({
    title: 'Revoke Session',
    content: `Are you sure you want to revoke the session from "${session.deviceName ?? 'this device'}"? This device will be logged out.`,
    positiveText: 'Revoke',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      isRevoking.value = session.id;
      try {
        await sessionsApi.revokeSession(session.id);
        sessions.value = sessions.value.filter(s => s.id !== session.id);
        message.success('Session revoked successfully');
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        message.error(axiosError.response?.data?.message || 'Failed to revoke session');
      } finally {
        isRevoking.value = null;
      }
    },
  });
}

async function handleRevokeAllOther() {
  dialog.warning({
    title: 'Revoke All Other Sessions',
    content: 'Are you sure you want to revoke all other sessions? All other devices will be logged out.',
    positiveText: 'Revoke All',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      isLoading.value = true;
      try {
        await sessionsApi.revokeAllSessions();
        sessions.value = sessions.value.filter(s => s.isCurrent);
        message.success('All other sessions revoked');
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        message.error(axiosError.response?.data?.message || 'Failed to revoke sessions');
      } finally {
        isLoading.value = false;
      }
    },
  });
}
</script>

<template>
  <div class="sessions-page">
    <!-- Hero Section -->
    <div class="sessions-hero">
      <div class="hero-background" />
      <div class="hero-content">
        <div class="hero-icon">
          <Icon icon="carbon:devices" :width="48" :height="48" />
        </div>
        <div class="hero-text">
          <h1 class="hero-title">Active Sessions</h1>
          <p class="hero-subtitle">View and manage your active sessions across different devices</p>
        </div>
        <n-button 
          v-if="otherSessions.length > 0" 
          type="error" 
          size="large"
          ghost 
          @click="handleRevokeAllOther"
        >
          <template #icon>
            <Icon icon="carbon:logout" />
          </template>
          Revoke All Other
        </n-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="sessions-content">
      <!-- Current Session Card -->
      <div v-if="currentSession" class="session-card current-session-card">
        <div class="card-header-custom">
          <div class="card-icon-wrapper green">
            <Icon icon="carbon:checkmark-filled" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Current Session</h3>
            <p class="card-subtitle">This device</p>
          </div>
          <n-tag type="success" size="medium" :bordered="false">
            <template #icon>
              <Icon icon="carbon:dot-mark" />
            </template>
            Active Now
          </n-tag>
        </div>

        <div class="card-content">
          <div class="session-details-box">
            <div class="session-main-info">
              <div class="device-icon-large">
                <Icon :icon="getDeviceIcon(currentSession.deviceName)" :width="48" :height="48" />
              </div>
              <div class="device-info">
                <h4 class="device-name">{{ currentSession.deviceName || 'This Device' }}</h4>
                <p class="device-meta">
                  <Icon :icon="getBrowserIcon(currentSession.browser)" :width="18" :height="18" />
                  {{ currentSession.browser }}
                  <Icon :icon="getOSIcon(currentSession.os)" :width="18" :height="18" style="margin-left: 8px;" />
                  {{ currentSession.os }}
                </p>
              </div>
            </div>
            <div class="session-meta-grid">
              <div class="meta-item">
                <Icon icon="carbon:location" :width="18" :height="18" />
                <div class="meta-content">
                  <span class="meta-label">Location</span>
                  <span class="meta-value" :class="{ 'meta-value--unknown': !currentSession.location }">
                    {{ currentSession.location || 'Location unavailable' }}
                  </span>
                </div>
              </div>
              <div class="meta-item">
                <Icon icon="carbon:network-3" :width="18" :height="18" />
                <div class="meta-content">
                  <span class="meta-label">IP Address</span>
                  <span class="meta-value">{{ formatIpAddress(currentSession.ipAddress) }}</span>
                </div>
              </div>
              <div class="meta-item">
                <Icon icon="carbon:calendar" :width="18" :height="18" />
                <div class="meta-content">
                  <span class="meta-label">Signed In</span>
                  <span class="meta-value">{{ formatDate(currentSession.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Other Sessions Card -->
      <div class="session-card other-sessions-card">
        <div class="card-header-custom">
          <div class="card-icon-wrapper blue">
            <Icon icon="carbon:devices" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Other Sessions</h3>
            <p class="card-subtitle">Active on other devices</p>
          </div>
          <n-badge :value="otherSessions.length" :max="99" type="info" />
        </div>

        <div class="card-content">
          <n-spin :show="isLoading">
            <div v-if="otherSessions.length === 0" class="empty-state">
              <Icon icon="carbon:checkmark-outline" class="empty-icon" />
              <p class="empty-text">No other active sessions</p>
              <p class="empty-hint">You're only logged in on this device</p>
            </div>

            <div v-else class="sessions-list">
              <div v-for="session in otherSessions" :key="session.id" class="session-item">
                <div class="session-item-main">
                  <div class="device-icon-medium">
                    <Icon :icon="getDeviceIcon(session.deviceName)" :width="32" :height="32" />
                  </div>
                  <div class="session-item-info">
                    <h5 class="session-device-name">{{ session.deviceName || 'Unknown Device' }}</h5>
                    <p class="session-device-meta">
                      <Icon :icon="getBrowserIcon(session.browser)" :width="16" :height="16" />
                      {{ session.browser }}
                      <Icon :icon="getOSIcon(session.os)" :width="16" :height="16" style="margin-left: 8px;" />
                      {{ session.os }}
                    </p>
                    <div class="session-item-details">
                      <span class="detail-item">
                        <Icon icon="carbon:location" :width="14" :height="14" />
                        {{ session.location || 'Location unavailable' }}
                      </span>
                      <span class="detail-item">
                        <Icon icon="carbon:time" :width="14" :height="14" />
                        {{ getRelativeTime(session.lastActivityAt) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="session-item-actions">
                  <n-button 
                    size="medium" 
                    type="error" 
                    ghost 
                    :loading="isRevoking === session.id"
                    @click="handleRevokeSession(session)"
                  >
                    <template #icon>
                      <Icon icon="carbon:close" />
                    </template>
                    Revoke
                  </n-button>
                </div>
              </div>
            </div>
          </n-spin>
        </div>
      </div>

      <!-- Security Tips Card -->
      <div class="session-card tips-card">
        <div class="card-header-custom">
          <div class="card-icon-wrapper orange">
            <Icon icon="carbon:security" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Security Tips</h3>
            <p class="card-subtitle">Keep your account safe</p>
          </div>
        </div>

        <div class="card-content">
          <div class="tips-list">
            <div class="tip-item">
              <Icon icon="carbon:checkmark-filled" class="tip-icon" />
              <span>Revoke sessions from devices you no longer use or don't recognize</span>
            </div>
            <div class="tip-item">
              <Icon icon="carbon:checkmark-filled" class="tip-icon" />
              <span>Enable two-factor authentication for additional security</span>
            </div>
            <div class="tip-item">
              <Icon icon="carbon:checkmark-filled" class="tip-icon" />
              <span>Always sign out when using shared or public computers</span>
            </div>
            <div class="tip-item">
              <Icon icon="carbon:checkmark-filled" class="tip-icon" />
              <span>If you see suspicious activity, change your password immediately</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sessions-page {
  min-height: 100vh;
  background: var(--n-color);
}

// Hero Section
.sessions-hero {
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
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  
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
    background: linear-gradient(135deg, #2e7fc9 0%, #00b8c4 100%);
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
.sessions-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (max-width: 768px) {
    padding: 0 16px 24px;
    gap: 16px;
  }
}

// Session Cards
.session-card {
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

  &.green {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }

  &.blue {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

// Session Details Box
.session-details-box {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.session-main-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.device-icon-large {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.device-info {
  flex: 1;
}

.device-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--n-text-color);
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-3);
  font-size: 0.875rem;
  margin: 0;
}

.session-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: transparent;
  border-radius: 12px;
  border: 2.5px solid rgba(0, 0, 0, 0.15);

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.meta-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  font-weight: 500;
}

.meta-value {
  font-size: 0.875rem;
  color: var(--n-text-color);
  font-weight: 500;

  &--unknown {
    color: var(--n-text-color-3);
    font-style: italic;
    font-weight: 400;
  }
}

// Sessions List
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  background: transparent;
  border-radius: 16px;
  border: 2.5px solid rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;

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
    align-items: stretch;
  }
}

.session-item-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.device-icon-medium {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.session-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.session-device-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--n-text-color);
}

.session-device-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--n-text-color-3);
  font-size: 0.8125rem;
  margin: 0;
}

.session-item-details {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--n-text-color-3);
}

.session-item-actions {
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    
    button {
      width: 100%;
    }
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: var(--n-success-color);
  margin-bottom: 16px;
}

.empty-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--n-text-color);
  margin: 0 0 8px 0;
}

.empty-hint {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
  margin: 0;
}

// Tips List
.tips-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: transparent;
  border-radius: 12px;
  border: 2.5px solid rgba(0, 0, 0, 0.15);
  font-size: 0.875rem;
  color: var(--n-text-color-2);

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.tip-icon {
  color: var(--n-success-color);
  font-size: 20px;
  flex-shrink: 0;
}
</style>
