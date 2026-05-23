<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import { useMessage } from "naive-ui";
import type { Role, Permission } from "@/types";

interface Props {
  show: boolean;
  role: Role | null;
  permissions: Permission[];
  allPermissions: Permission[];
  isLoading: boolean;
  roleUsers: number;
  canEdit: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:show": [value: boolean];
  "assign-permission": [permissionId: string];
  "remove-permission": [permissionId: string];
}>();

const message = useMessage();

// Role tier mapping
const roleTierMap: Record<
  string,
  { tier: number; color: string; icon: string }
> = {
  super_admin: { tier: 1, color: "#f59e0b", icon: "carbon:star-filled" },
  admin: { tier: 2, color: "#8b5cf6", icon: "carbon:user-admin" },
  administrator: { tier: 2, color: "#8b5cf6", icon: "carbon:user-admin" },
  developer: { tier: 3, color: "#3b82f6", icon: "carbon:code" },
  viewer: { tier: 4, color: "#10b981", icon: "carbon:magnify" },
  demo: { tier: 5, color: "#6b7280", icon: "carbon:demo" },
};

function getRoleTier(roleName: string) {
  const name = roleName.toLowerCase().replace(/[^a-z]/g, "_");
  return (
    roleTierMap[name] || { tier: 0, color: "#64748b", icon: "carbon:user-role" }
  );
}

function getActionType(
  action: string,
): "success" | "warning" | "error" | "info" | "default" {
  if (action === "create") return "success";
  if (action === "read") return "info";
  if (action === "update") return "warning";
  if (action === "delete") return "error";
  return "default";
}

function isPermissionAssigned(permissionId: string) {
  // Match by ID first, fallback to name match
  const target = props.allPermissions.find((p) => p.id === permissionId);
  return props.permissions.some(
    (p) => p.id === permissionId || (target && p.name === target.name),
  );
}

function handlePermissionChange(checked: boolean, permissionId: string) {
  if (checked) {
    emit("assign-permission", permissionId);
  } else {
    emit("remove-permission", permissionId);
  }
}

const RESOURCE_ORDER: Record<string, number> = {
  platform: 0,
  users: 1,
  roles: 2,
  permissions: 3,
  organizations: 4,
  workspaces: 5,
  tenants: 6,
  groups: 7,
  regions: 8,
  "data-masking": 9,
  audit: 10,
  telemetry: 11,
  dashboard: 12,
  "monitoring:agent": 13,
  "monitoring:vm": 14,
  "monitoring:kubernetes": 15,
  "monitoring:uptime": 16,
  "monitoring:status-page": 17,
  "monitoring:service-map": 18,
  "monitoring:network-map": 19,
  alert: 20,
  reports: 21,
  notifications: 22,
  "api-keys": 23,
  retention: 24,
  subscription: 25,
  "ai-assistant": 26,
  llm: 27,
  // aliases
  alerts: 20,
  organization: 4,
  workspace: 5,
  tenant: 6,
  region: 8,
  other: 99,
};

const permissionsByResource = computed(() => {
  const groups: Record<string, Permission[]> = {};
  props.allPermissions.forEach((p) => {
    const resource = p.resource || "other";
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(p);
  });
  return groups;
});

const sortedResources = computed(() => {
  return Object.keys(permissionsByResource.value).sort((a, b) => {
    const orderA = RESOURCE_ORDER[a] ?? 500;
    const orderB = RESOURCE_ORDER[b] ?? 500;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
});

const showModal = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value),
});
</script>

<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="`Permissions: ${role?.name || ''}`"
    style="width: 800px; max-height: 80vh"
    :mask-closable="true"
    class="permissions-modal"
  >
    <n-spin :show="isLoading">
      <div v-if="role" class="permissions-modal-content">
        <!-- Role Info -->
        <div class="permissions-role-info-header">
          <div class="permissions-selected-role-info">
            <div
              class="permissions-selected-role-icon"
              :style="{ backgroundColor: getRoleTier(role.name).color }"
            >
              <Icon :icon="getRoleTier(role.name).icon" />
            </div>
            <div>
              <div class="permissions-selected-role-name">{{ role.name }}</div>
              <div class="permissions-selected-role-meta">
                {{ permissions.length }} permissions · {{ roleUsers }} users
              </div>
            </div>
          </div>
        </div>

        <!-- Role Info Alert for System Roles -->
        <n-alert
          v-if="role.isSystem"
          type="info"
          :show-icon="true"
          class="permissions-system-role-alert"
        >
          This is a system role. Its permissions cannot be modified.
        </n-alert>

        <!-- Permissions Groups -->
        <div class="permissions-modal-scroll">
          <div
            v-for="resource in sortedResources"
            :key="resource"
            class="permissions-modal-group"
          >
            <div class="permissions-modal-group-header">
              <Icon icon="carbon:folder" />
              <span class="permissions-modal-group-name">{{ resource }}</span>
              <n-tag
                size="small"
                :bordered="false"
                :type="
                  permissionsByResource[resource].filter((p) =>
                    isPermissionAssigned(p.id),
                  ).length === permissionsByResource[resource].length
                    ? 'success'
                    : 'info'
                "
                style="font-weight: 600"
              >
                {{
                  permissionsByResource[resource].filter((p) =>
                    isPermissionAssigned(p.id),
                  ).length
                }}/{{ permissionsByResource[resource].length }}
              </n-tag>
            </div>
            <div class="permissions-modal-group-permissions">
              <div
                v-for="permission in permissionsByResource[resource]"
                :key="permission.id"
                class="permissions-modal-permission-item"
                :class="{ assigned: isPermissionAssigned(permission.id) }"
              >
                <n-checkbox
                  :checked="isPermissionAssigned(permission.id)"
                  :disabled="!canEdit || role.isSystem"
                  @update:checked="
                    (checked: boolean) =>
                      handlePermissionChange(checked, permission.id)
                  "
                >
                  <div class="permissions-modal-permission-label">
                    <span class="permissions-modal-permission-name">{{
                      permission.name
                    }}</span>
                    <n-tag
                      :type="getActionType(permission.action)"
                      size="small"
                    >
                      {{ permission.action }}
                    </n-tag>
                  </div>
                </n-checkbox>
                <div
                  v-if="permission.description"
                  class="permissions-modal-permission-description"
                >
                  {{ permission.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-spin>
  </n-modal>
</template>

<style scoped lang="scss">
// Permissions Modal Styles
.permissions-modal-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.permissions-role-info-header {
  padding-bottom: 12px;
  border-bottom: 2px solid;
  margin-bottom: 8px;

  :root:not(.dark) & {
    border-bottom-color: #cbd5e1 !important;
  }

  :root.dark & {
    border-bottom-color: rgba(255, 255, 255, 0.2) !important;
  }
}

.permissions-selected-role-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.permissions-selected-role-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.permissions-selected-role-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--n-text-color);
}

.permissions-selected-role-meta {
  font-size: 0.875rem;
  color: var(--text-color-3);
  margin-top: 2px;
}

.permissions-system-role-alert {
  margin-bottom: 8px;
}

.permissions-modal-scroll {
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 8px;
}

.permissions-modal-group {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.permissions-modal-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--n-color);
  border-radius: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 2px solid var(--border-color);

  :root:not(.dark) & {
    background: #f1f5f9;
    border-bottom-color: #e2e8f0;
  }

  :root.dark & {
    background: rgba(255, 255, 255, 0.05);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  :deep(svg) {
    font-size: 16px;
    color: var(--primary-color);
  }
}

.permissions-modal-group-name {
  flex: 1;
  text-transform: capitalize;
}

.permissions-modal-group-permissions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding-left: 8px;
}

.permissions-modal-permission-item {
  padding: 12px 14px;
  border: 1px solid;
  border-radius: 10px;
  transition: all 0.2s;
  background: var(--card-color);

  :root:not(.dark) & {
    background: rgba(255, 255, 255, 0.05) !important;
    border-color: rgba(148, 163, 184, 0.4) !important;
  }

  :root.dark & {
    background: rgba(255, 255, 255, 0.03) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
  }

  &.assigned {
    :root:not(.dark) & {
      background: rgba(34, 197, 94, 0.15) !important;
      border-color: rgba(34, 197, 94, 0.6) !important;
    }

    :root.dark & {
      background: rgba(34, 197, 94, 0.2) !important;
      border-color: rgba(34, 197, 94, 0.7) !important;
    }
  }

  &:hover {
    border-color: var(--primary-color) !important;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;
    transform: translateY(-1px);
  }
}

.permissions-modal-permission-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.permissions-modal-permission-name {
  font-size: 0.8125rem;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}

.permissions-modal-permission-description {
  font-size: 0.75rem;
  color: var(--text-color-3);
  margin-top: 4px;
  margin-left: 24px;
  line-height: 1.4;
}
</style>
