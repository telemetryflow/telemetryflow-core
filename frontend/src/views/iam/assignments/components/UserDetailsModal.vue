<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import {
  NModal,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NButton,
} from "naive-ui";
import type { User } from "@/types";
import { formatDateTime } from "@/utils/format";

interface Props {
  show: boolean;
  user: User | null;
}

interface Emits {
  (e: "update:show", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function getAvatarGradient(email: string): string {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  ];

  const hash = email
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

function getUserInitials(user: User): string {
  const f = user.firstName?.charAt(0) || "";
  const l = user.lastName?.charAt(0) || "";
  return (f + l).toUpperCase() || user.email.charAt(0).toUpperCase();
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "—";
  return formatDateTime(dateString);
}

function handleClose() {
  emit("update:show", false);
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    title="User Details"
    style="width: 600px; max-width: 90vw"
    :segmented="{ content: 'soft' }"
    @update:show="handleClose"
  >
    <div v-if="user" class="user-details-content">
      <!-- User Header -->
      <div class="user-header">
        <div
          class="user-avatar-large"
          :style="{ background: getAvatarGradient(user.email) }"
        >
          {{ getUserInitials(user) }}
        </div>
        <div class="user-info">
          <h3 class="user-name">{{ user.firstName }} {{ user.lastName }}</h3>
          <p class="user-email">{{ user.email }}</p>
          <n-tag
            :type="user.isActive ? 'success' : 'default'"
            size="small"
            :bordered="false"
            round
          >
            {{ user.isActive ? "Active" : "Inactive" }}
          </n-tag>
        </div>
      </div>

      <!-- User Details -->
      <n-descriptions
        bordered
        :column="1"
        label-placement="left"
        label-style="width: 150px; font-weight: 600"
      >
        <n-descriptions-item label="User ID">
          <code
            style="
              font-size: 12px;
              background: rgba(128, 128, 128, 0.1);
              padding: 2px 6px;
              border-radius: 4px;
            "
          >
            {{ user.id }}
          </code>
        </n-descriptions-item>
        <n-descriptions-item label="First Name">
          {{ user.firstName || "—" }}
        </n-descriptions-item>
        <n-descriptions-item label="Last Name">
          {{ user.lastName || "—" }}
        </n-descriptions-item>
        <n-descriptions-item label="Email">
          {{ user.email }}
        </n-descriptions-item>
        <n-descriptions-item label="Status">
          <n-tag
            :type="user.isActive ? 'success' : 'default'"
            size="small"
            :bordered="false"
          >
            {{ user.isActive ? "Active" : "Inactive" }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="Created At">
          {{ formatDate(user.createdAt) }}
        </n-descriptions-item>
        <n-descriptions-item label="Updated At">
          {{ formatDate(user.updatedAt) }}
        </n-descriptions-item>
      </n-descriptions>
    </div>

    <template #footer>
      <div class="tfo-modal-footer">
        <n-button @click="handleClose">Close</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
.user-details-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: rgba(128, 128, 128, 0.05);
  border-radius: 12px;

  .user-avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 28px;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .user-info {
    flex: 1;

    .user-name {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 600;
    }

    .user-email {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: var(--n-text-color-3);
    }
  }
}
</style>
