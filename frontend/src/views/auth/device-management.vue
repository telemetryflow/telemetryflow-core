<script setup lang="ts">
/**
 * Device Management View
 * Requirements: 8.3, 8.4, 8.5, 8.9
 */
import { ref, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { iamClient } from "@/api/iam";

interface Device {
  id: string;
  name: string | null;
  browser: string;
  os: string;
  lastIpAddress: string;
  lastLocation: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  isVerified: boolean;
  isTrusted: boolean;
  isCurrent?: boolean;
}

const devices = ref<Device[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const revokingId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const editName = ref("");

async function loadDevices() {
  isLoading.value = true;
  error.value = null;
  try {
    const data = await iamClient.get<Device[]>("/auth/devices");
    devices.value = data;
  } catch (err: unknown) {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    error.value =
      e.response?.data?.message || e.message || "Failed to load devices";
  } finally {
    isLoading.value = false;
  }
}

async function revokeDevice(deviceId: string) {
  revokingId.value = deviceId;
  try {
    await iamClient.delete(`/auth/devices/${deviceId}`);
    devices.value = devices.value.filter((d) => d.id !== deviceId);
  } catch (err: unknown) {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    error.value =
      e.response?.data?.message || e.message || "Failed to revoke device";
  } finally {
    revokingId.value = null;
  }
}

async function saveDeviceName(deviceId: string) {
  try {
    await iamClient.patch(`/auth/devices/${deviceId}`, {
      name: editName.value.trim() || null,
    });
    const device = devices.value.find((d) => d.id === deviceId);
    if (device) device.name = editName.value.trim() || null;
  } catch {
    // ignore
  } finally {
    editingId.value = null;
  }
}

function startEdit(device: Device) {
  editingId.value = device.id;
  editName.value = device.name || "";
}

function getBrowserIcon(browser: string): string {
  const b = browser.toLowerCase();
  if (b.includes("chrome")) return "logos:chrome";
  if (b.includes("firefox")) return "logos:firefox";
  if (b.includes("safari")) return "logos:safari";
  if (b.includes("edge")) return "logos:microsoft-edge";
  return "mdi:web";
}

function getOsIcon(os: string): string {
  const o = os.toLowerCase();
  if (o.includes("windows")) return "logos:microsoft-windows";
  if (o.includes("mac") || o.includes("ios")) return "logos:apple";
  if (o.includes("android")) return "logos:android-icon";
  if (o.includes("linux")) return "logos:linux-tux";
  return "mdi:devices";
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

onMounted(loadDevices);
</script>

<template>
  <div class="device-management">
    <div class="page-header">
      <div class="header-left">
        <Icon icon="mdi:devices" :width="28" :height="28" class="header-icon" aria-hidden="true" />
        <div>
          <h1 class="page-title">Device Management</h1>
          <p class="page-subtitle">
            Manage devices that have accessed your account
          </p>
        </div>
      </div>
      <n-button :loading="isLoading" @click="loadDevices">
        <template #icon>
          <Icon icon="mdi:refresh" />
        </template>
        Refresh
      </n-button>
    </div>

    <n-alert v-if="error" type="error" :show-icon="true" closable aria-live="assertive" @close="error = null">
      {{ error }}
    </n-alert>

    <!-- Loading skeleton -->
    <div v-if="isLoading && !devices.length" class="skeleton-list">
      <div v-for="i in 3" :key="i" class="skeleton-card" aria-hidden="true" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading && !devices.length" class="empty-state">
      <Icon icon="mdi:devices-off" :width="48" :height="48" class="empty-icon" aria-hidden="true" />
      <p>No devices found</p>
    </div>

    <!-- Device list (Requirement 8.3) -->
    <div v-else class="device-list" role="list" aria-label="Known devices">
      <div
        v-for="device in devices" :key="device.id" class="device-card" :class="{ current: device.isCurrent }"
        role="listitem"
      >
        <div class="device-icons">
          <Icon :icon="getOsIcon(device.os)" :width="32" :height="32" :aria-label="device.os" />
          <Icon
            :icon="getBrowserIcon(device.browser)" :width="20" :height="20" class="browser-icon"
            :aria-label="device.browser"
          />
        </div>

        <div class="device-info">
          <!-- Device name / edit (Requirement 8.9) -->
          <div class="device-name-row">
            <template v-if="editingId === device.id">
              <n-input
                v-model:value="editName" size="small" placeholder="Device name" class="name-input"
                aria-label="Edit device name" @keypress.enter="saveDeviceName(device.id)"
                @keypress.escape="editingId = null"
              />
              <n-button size="tiny" type="primary" @click="saveDeviceName(device.id)">Save</n-button>
              <n-button size="tiny" @click="editingId = null">Cancel</n-button>
            </template>
            <template v-else>
              <span class="device-name">{{
                device.name || `${device.browser} on ${device.os}`
              }}</span>
              <span v-if="device.isCurrent" class="current-badge">Current</span>
              <button
                class="edit-btn" type="button" :aria-label="`Rename ${device.name || device.browser}`"
                @click="startEdit(device)"
              >
                <Icon icon="mdi:pencil-outline" :width="14" :height="14" />
              </button>
            </template>
          </div>

          <div class="device-meta">
            <span class="meta-item">
              <Icon icon="mdi:map-marker-outline" :width="14" :height="14" aria-hidden="true" />
              {{ device.lastLocation || device.lastIpAddress }}
            </span>
            <span class="meta-item">
              <Icon icon="mdi:clock-outline" :width="14" :height="14" aria-hidden="true" />
              Last seen {{ formatDate(device.lastSeenAt) }}
            </span>
            <span class="meta-item">
              <Icon icon="mdi:calendar-outline" :width="14" :height="14" aria-hidden="true" />
              First seen {{ formatDate(device.firstSeenAt) }}
            </span>
          </div>

          <div class="device-badges">
            <span v-if="device.isVerified" class="badge verified">
              <Icon icon="mdi:check-circle" :width="12" :height="12" aria-hidden="true" />
              Verified
            </span>
            <span v-if="device.isTrusted" class="badge trusted">
              <Icon icon="mdi:shield-check" :width="12" :height="12" aria-hidden="true" />
              Trusted
            </span>
          </div>
        </div>

        <!-- Revoke (Requirement 8.5) -->
        <n-button
          v-if="!device.isCurrent" type="error" size="small" ghost :loading="revokingId === device.id"
          :aria-label="`Revoke ${device.name || device.browser}`" @click="revokeDevice(device.id)"
        >
          Revoke
        </n-button>
      </div>
    </div>
  </div>
</template>
