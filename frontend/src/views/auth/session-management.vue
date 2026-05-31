<script setup lang="ts">
/**
 * Session Management View
 * Requirements: 9.9, 9.10
 */
import { ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { iamClient } from "@/api/iam";

interface Session {
  id: string;
  deviceId: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string | null;
  lastActivityAt: string;
  createdAt: string;
  isCurrent: boolean;
}

const sessions = ref<Session[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const revokingId = ref<string | null>(null);
const revokingAll = ref(false);

const otherSessions = computed(() =>
  sessions.value.filter((s) => !s.isCurrent),
);
const currentSession = computed(() => sessions.value.find((s) => s.isCurrent));

async function loadSessions() {
  isLoading.value = true;
  error.value = null;
  try {
    const data = await iamClient.get<Session[]>("/auth/sessions");
    sessions.value = data;
  } catch (err: unknown) {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    error.value =
      e.response?.data?.message || e.message || "Failed to load sessions";
  } finally {
    isLoading.value = false;
  }
}

// Revoke single session (Requirement 9.9)
async function revokeSession(sessionId: string) {
  revokingId.value = sessionId;
  try {
    await iamClient.delete(`/auth/sessions/${sessionId}`);
    sessions.value = sessions.value.filter((s) => s.id !== sessionId);
  } catch (err: unknown) {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    error.value =
      e.response?.data?.message || e.message || "Failed to revoke session";
  } finally {
    revokingId.value = null;
  }
}

// Revoke all except current (Requirement 9.10)
async function revokeAllOther() {
  revokingAll.value = true;
  try {
    await iamClient.delete("/auth/sessions");
    sessions.value = sessions.value.filter((s) => s.isCurrent);
  } catch (err: unknown) {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    error.value =
      e.response?.data?.message || e.message || "Failed to revoke sessions";
  } finally {
    revokingAll.value = false;
  }
}

function getBrowserIcon(browser: string): string {
  const b = browser.toLowerCase();
  if (b.includes("chrome")) return "logos:chrome";
  if (b.includes("firefox")) return "logos:firefox";
  if (b.includes("safari")) return "logos:safari";
  if (b.includes("edge")) return "logos:microsoft-edge";
  return "mdi:web";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

onMounted(loadSessions);
</script>

<template>
  <div class="session-management">
    <div class="page-header">
      <div class="header-left">
        <Icon icon="mdi:monitor-multiple" :width="28" :height="28" class="header-icon" aria-hidden="true" />
        <div>
          <h1 class="page-title">Active Sessions</h1>
          <p class="page-subtitle">Manage where you're currently logged in</p>
        </div>
      </div>
      <div class="header-actions">
        <n-button :loading="isLoading" @click="loadSessions">
          <template #icon>
            <Icon icon="mdi:refresh" />
          </template>
          Refresh
        </n-button>
        <n-button
          v-if="otherSessions.length > 0" type="error" ghost :loading="revokingAll" :disabled="revokingAll"
          @click="revokeAllOther"
        >
          <template #icon>
            <Icon icon="mdi:logout-variant" />
          </template>
          Revoke All Other Sessions
        </n-button>
      </div>
    </div>

    <n-alert v-if="error" type="error" :show-icon="true" closable aria-live="assertive" @close="error = null">
      {{ error }}
    </n-alert>

    <!-- Loading -->
    <div v-if="isLoading && !sessions.length" class="skeleton-list">
      <div v-for="i in 3" :key="i" class="skeleton-card" aria-hidden="true" />
    </div>

    <!-- Empty -->
    <div v-else-if="!isLoading && !sessions.length" class="empty-state">
      <Icon icon="mdi:monitor-off" :width="48" :height="48" class="empty-icon" aria-hidden="true" />
      <p>No active sessions found</p>
    </div>

    <template v-else>
      <!-- Current session -->
      <div v-if="currentSession" class="section">
        <h2 class="section-title">Current Session</h2>
        <div class="session-card current" role="article" aria-label="Current session">
          <div class="session-icon">
            <Icon
              :icon="getBrowserIcon(currentSession.browser)" :width="32" :height="32"
              :aria-label="currentSession.browser"
            />
          </div>
          <div class="session-info">
            <div class="session-name-row">
              <span class="session-name">{{ currentSession.browser }} on {{ currentSession.os }}</span>
              <span class="current-badge">This device</span>
            </div>
            <div class="session-meta">
              <span class="meta-item">
                <Icon icon="mdi:map-marker-outline" :width="14" :height="14" aria-hidden="true" />
                {{ currentSession.location || currentSession.ipAddress }}
              </span>
              <span class="meta-item">
                <Icon icon="mdi:clock-outline" :width="14" :height="14" aria-hidden="true" />
                Active {{ timeAgo(currentSession.lastActivityAt) }}
              </span>
              <span class="meta-item">
                <Icon icon="mdi:calendar-outline" :width="14" :height="14" aria-hidden="true" />
                Started {{ formatDate(currentSession.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Other sessions (Requirement 9.9) -->
      <div v-if="otherSessions.length > 0" class="section">
        <h2 class="section-title">
          Other Sessions ({{ otherSessions.length }})
        </h2>
        <div class="session-list" role="list" aria-label="Other active sessions">
          <div v-for="session in otherSessions" :key="session.id" class="session-card" role="listitem">
            <div class="session-icon">
              <Icon :icon="getBrowserIcon(session.browser)" :width="32" :height="32" :aria-label="session.browser" />
            </div>
            <div class="session-info">
              <div class="session-name-row">
                <span class="session-name">{{ session.browser }} on {{ session.os }}</span>
              </div>
              <div class="session-meta">
                <span class="meta-item">
                  <Icon icon="mdi:map-marker-outline" :width="14" :height="14" aria-hidden="true" />
                  {{ session.location || session.ipAddress }}
                </span>
                <span class="meta-item">
                  <Icon icon="mdi:clock-outline" :width="14" :height="14" aria-hidden="true" />
                  Active {{ timeAgo(session.lastActivityAt) }}
                </span>
                <span class="meta-item">
                  <Icon icon="mdi:calendar-outline" :width="14" :height="14" aria-hidden="true" />
                  Started {{ formatDate(session.createdAt) }}
                </span>
              </div>
            </div>
            <n-button
              type="error" size="small" ghost :loading="revokingId === session.id"
              :aria-label="`Revoke session on ${session.browser}`" @click="revokeSession(session.id)"
            >
              Revoke
            </n-button>
          </div>
        </div>
      </div>

      <div v-else-if="!isLoading" class="no-other-sessions">
        <Icon icon="mdi:check-circle-outline" :width="20" :height="20" aria-hidden="true" />
        <span>No other active sessions</span>
      </div>
    </template>
  </div>
</template>
