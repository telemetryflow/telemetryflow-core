<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { NModal, NSpin, NTag, NButton, useMessage, useDialog } from "naive-ui";
import { usersApi } from "@/api/users";
import { useAuthStore } from "@/store";
import type { User, Role } from "@/types";

interface Props {
  show: boolean;
  user: User | null;
  allRoles: Role[];
}

interface Emits {
  (e: "update:show", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const authStore = useAuthStore();
const message = useMessage();
const dialog = useDialog();

const userRoles = ref<Role[]>([]);
const isLoadingRoles = ref(false);

const canAssign = computed(() => authStore.hasPermission("users:write"));

const availableRoles = computed(() => {
  const assignedIds = new Set(userRoles.value.map((r) => r.id));
  return props.allRoles.filter((r) => !assignedIds.has(r.id));
});

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

function getRoleIcon(role: Role): string {
  if (role.isSystem) return "carbon:locked";
  return "carbon:user-role";
}

function getRoleGradient(roleName: string): string {
  const gradients: Record<string, string> = {
    Admin: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    Editor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    Viewer: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    Developer: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  };

  return (
    gradients[roleName] || "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
  );
}

async function loadUserRoles() {
  if (!props.user) return;

  isLoadingRoles.value = true;
  try {
    const response = await usersApi.getRoles(props.user.id);
    userRoles.value = response.data || [];
  } catch (error) {
    console.error("Failed to load user roles:", error);
    message.error("Failed to load user roles");
  } finally {
    isLoadingRoles.value = false;
  }
}

async function assignRole(roleId: string) {
  if (!props.user) return;

  try {
    await usersApi.assignRole(props.user.id, roleId);
    message.success("Role assigned successfully");
    await loadUserRoles();
  } catch (error) {
    console.error("Failed to assign role:", error);
    message.error("Failed to assign role");
  }
}

async function revokeRole(roleId: string) {
  if (!props.user) return;

  const role = userRoles.value.find((r) => r.id === roleId);

  dialog.warning({
    title: "Revoke Role",
    content: `Are you sure you want to revoke the "${role?.name}" role from this user?${role?.isSystem ? " This is a system role." : ""}`,
    positiveText: "Revoke",
    negativeText: "Cancel",
    onPositiveClick: async () => {
      try {
        await usersApi.revokeRole(props.user!.id, roleId);
        message.success("Role revoked successfully");
        await loadUserRoles();
      } catch (error) {
        console.error("Failed to revoke role:", error);
        message.error("Failed to revoke role");
      }
    },
  });
}

function handleClose() {
  emit("update:show", false);
}

// Watch for modal open to load roles
watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.user) {
      loadUserRoles();
    }
  },
);
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    :title="`Manage Roles - ${user?.email || ''}`"
    style="width: 700px; max-width: 90vw"
    :segmented="{ content: 'soft' }"
    @update:show="handleClose"
  >
    <n-spin :show="isLoadingRoles">
      <div v-if="user" class="role-modal-content">
        <!-- User Info Header -->
        <div class="modal-user-header">
          <div
            class="user-avatar-large"
            :style="{ background: getAvatarGradient(user.email) }"
          >
            {{ getUserInitials(user) }}
          </div>
          <div class="user-details">
            <div class="user-name">
              {{ user.firstName }} {{ user.lastName }}
            </div>
            <div class="user-email">{{ user.email }}</div>
            <n-tag
              :type="user.isActive ? 'success' : 'default'"
              size="small"
              :bordered="false"
              round
              style="margin-top: 4px"
            >
              {{ user.isActive ? "Active" : "Inactive" }}
            </n-tag>
          </div>
        </div>

        <!-- Assigned Roles Section -->
        <div class="roles-section">
          <div class="section-header-modal">
            <div
              class="section-icon-wrapper"
              style="
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              "
            >
              <Icon icon="carbon:checkmark-filled" :width="16" :height="16" />
            </div>
            <span class="section-title">Assigned Roles</span>
            <n-tag size="small" :bordered="false" type="success" round>
              {{ userRoles.length }}
            </n-tag>
          </div>

          <div v-if="userRoles.length > 0" class="roles-list">
            <div
              v-for="role in userRoles"
              :key="role.id"
              class="role-card assigned"
            >
              <div
                class="role-icon-box"
                :style="{ background: getRoleGradient(role.name) }"
              >
                <Icon :icon="getRoleIcon(role)" :width="20" :height="20" />
              </div>
              <div class="role-info">
                <div class="role-header">
                  <div class="role-name">{{ role.name }}</div>
                  <n-tag
                    v-if="role.isSystem"
                    size="tiny"
                    type="info"
                    :bordered="false"
                  >
                    System
                  </n-tag>
                </div>
                <div class="role-description">
                  {{ role.description || "No description" }}
                </div>
              </div>
              <div class="role-actions">
                <n-button
                  v-if="canAssign"
                  size="small"
                  type="error"
                  ghost
                  @click="revokeRole(role.id)"
                >
                  <template #icon>
                    <Icon icon="carbon:subtract" />
                  </template>
                  Revoke
                </n-button>
              </div>
            </div>
          </div>

          <div v-else class="empty-roles">
            <div
              class="empty-icon-wrapper"
              style="background: rgba(239, 68, 68, 0.1)"
            >
              <Icon
                icon="carbon:warning"
                class="empty-icon"
                style="color: #ef4444"
              />
            </div>
            <p class="empty-text">No roles assigned to this user</p>
            <p class="empty-hint">
              Assign roles from the available roles below
            </p>
          </div>
        </div>

        <!-- Available Roles Section -->
        <div v-if="canAssign" class="roles-section">
          <div class="section-header-modal">
            <div
              class="section-icon-wrapper"
              style="
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              "
            >
              <Icon icon="carbon:add-filled" :width="16" :height="16" />
            </div>
            <span class="section-title">Available Roles</span>
            <n-tag size="small" :bordered="false" type="info" round>
              {{ availableRoles.length }}
            </n-tag>
          </div>

          <div v-if="availableRoles.length > 0" class="roles-list">
            <div
              v-for="role in availableRoles"
              :key="role.id"
              class="role-card available"
            >
              <div
                class="role-icon-box"
                :style="{ background: getRoleGradient(role.name) }"
              >
                <Icon :icon="getRoleIcon(role)" :width="20" :height="20" />
              </div>
              <div class="role-info">
                <div class="role-header">
                  <div class="role-name">{{ role.name }}</div>
                  <n-tag
                    v-if="role.isSystem"
                    size="tiny"
                    type="info"
                    :bordered="false"
                  >
                    System
                  </n-tag>
                </div>
                <div class="role-description">
                  {{ role.description || "No description" }}
                </div>
              </div>
              <n-button
                size="small"
                type="primary"
                @click="assignRole(role.id)"
              >
                <template #icon>
                  <Icon icon="carbon:add" />
                </template>
                Assign
              </n-button>
            </div>
          </div>

          <div v-else class="empty-roles">
            <div
              class="empty-icon-wrapper"
              style="background: rgba(16, 185, 129, 0.1)"
            >
              <Icon
                icon="carbon:checkmark-filled"
                class="empty-icon"
                style="color: #10b981"
              />
            </div>
            <p class="empty-text">All roles are assigned</p>
            <p class="empty-hint">
              This user has access to all available roles
            </p>
          </div>
        </div>
      </div>
    </n-spin>

    <template #footer>
      <div class="tfo-modal-footer">
        <n-button @click="handleClose">Close</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
.role-modal-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-user-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(128, 128, 128, 0.05);
  border-radius: 12px;

  .user-avatar-large {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 20px;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .user-details {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .user-name {
      font-weight: 600;
      font-size: 16px;
    }

    .user-email {
      font-size: 13px;
      color: var(--n-text-color-3);
    }
  }
}

.roles-section {
  .section-header-modal {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--n-border-color);

    .section-icon-wrapper {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      flex: 1;
      font-size: 15px;
    }
  }
}

.roles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid var(--n-border-color);
  transition: all 0.2s ease;
  background: var(--n-card-color);

  &.assigned {
    background: rgba(16, 185, 129, 0.04);
    border-color: rgba(16, 185, 129, 0.2);

    &:hover {
      border-color: rgba(16, 185, 129, 0.4);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
    }
  }

  &.available {
    &:hover {
      border-color: var(--primary-color);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }
  }

  .role-icon-box {
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

  .role-info {
    flex: 1;
    min-width: 0;

    .role-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .role-name {
      font-weight: 600;
      font-size: 14px;
    }

    .role-description {
      font-size: 12px;
      color: var(--n-text-color-3);
      line-height: 1.4;
    }
  }

  .role-actions {
    flex-shrink: 0;
  }
}

.empty-roles {
  text-align: center;
  padding: 32px 16px;
  color: var(--n-text-color-3);

  .empty-icon-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  .empty-icon {
    font-size: 32px;
  }

  .empty-text {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--n-text-color);
  }

  .empty-hint {
    margin: 0;
    font-size: 13px;
    color: var(--n-text-color-3);
  }
}

@media (max-width: 600px) {
  .role-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .role-actions {
      width: 100%;

      button {
        width: 100%;
      }
    }
  }

  .modal-user-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>
