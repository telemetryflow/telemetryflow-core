<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { Icon } from "@iconify/vue";
import { useMessage, useDialog } from "naive-ui";

import { permissionsApi } from "@/api/permissions";
import { rolesApi } from "@/api/roles";
import { useAuthStore } from "@/store";
import StatPanel from "@/components/charts/StatPanel.vue";
import type { Permission, CreatePermissionRequest, Role } from "@/types";

const authStore = useAuthStore();
const message = useMessage();
const dialog = useDialog();

const permissions = ref<Permission[]>([]);
const roles = ref<Role[]>([]);
const isLoading = ref(false);
const searchQuery = ref("");
const selectedResource = ref<string[]>([]);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const isCreating = ref(false);
const isUpdating = ref(false);
const selectedPermission = ref<Permission | null>(null);

// Resource options based on RBAC documentation
const resourceOptions = [
  { label: "Platform", value: "platform" },
  { label: "Users", value: "users" },
  { label: "Roles", value: "roles" },
  { label: "Permissions", value: "permissions" },
  { label: "Organizations", value: "organizations" },
  { label: "Workspaces", value: "workspaces" },
  { label: "Tenants", value: "tenants" },
  { label: "Groups", value: "groups" },
  { label: "Regions", value: "regions" },
  { label: "Data Masking", value: "data-masking" },
  { label: "Audit", value: "audit" },
  { label: "Telemetry", value: "telemetry" },
  { label: "Dashboard", value: "dashboard" },
  { label: "Monitoring: Agent", value: "monitoring:agent" },
  { label: "Monitoring: VM", value: "monitoring:vm" },
  { label: "Monitoring: Kubernetes", value: "monitoring:kubernetes" },
  { label: "Monitoring: Uptime", value: "monitoring:uptime" },
  { label: "Monitoring: Status Page", value: "monitoring:status-page" },
  { label: "Monitoring: Service Map", value: "monitoring:service-map" },
  { label: "Monitoring: Network Map", value: "monitoring:network-map" },
  { label: "Alert", value: "alert" },
  { label: "Reports", value: "reports" },
  { label: "Notifications", value: "notifications" },
  { label: "API Keys", value: "api-keys" },
  { label: "Retention", value: "retention" },
  { label: "Subscription", value: "subscription" },
  { label: "AI Assistant", value: "ai-assistant" },
  { label: "LLM", value: "llm" },
];

// Action options
const actionOptions = [
  { label: "Read", value: "read" },
  { label: "Write", value: "write" },
  { label: "Create", value: "create" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
  { label: "Manage", value: "manage" },
  { label: "Assign", value: "assign" },
];

// Forms
const createForm = reactive<CreatePermissionRequest>({
  name: "",
  description: "",
  resource: "",
  action: "",
});

const editForm = reactive({
  name: "",
  description: "",
  resource: "",
  action: "",
});

// Permissions check
const canCreate = computed(() => authStore.hasPermission("permissions:write"));
const canEdit = computed(() => authStore.hasPermission("permissions:write"));
const canDelete = computed(() => authStore.hasPermission("permissions:write"));

// Priority order mirrors resourceOptions array order exactly
const RESOURCE_PRIORITY: Record<string, number> = {
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
  // aliases — seed uses these variants
  alerts: 20,
  organization: 4,
  workspace: 5,
  tenant: 6,
  region: 8,
};

// Get unique resources
const resources = computed(() => {
  const resourceSet = new Set(
    permissions.value.map((p) => p.resource || "other"),
  );
  return Array.from(resourceSet).sort((a, b) => {
    const pa = RESOURCE_PRIORITY[a] ?? 99;
    const pb = RESOURCE_PRIORITY[b] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });
});

// Stats
const totalPermissions = computed(() => permissions.value.length);
const totalResources = computed(() => resources.value.length);
const readPermissions = computed(
  () =>
    permissions.value.filter((p) => p.action.toLowerCase() === "read").length,
);
const writePermissions = computed(
  () =>
    permissions.value.filter((p) =>
      ["write", "create", "update", "delete"].includes(p.action.toLowerCase()),
    ).length,
);

// Filter permissions
const filteredPermissions = computed(() => {
  let result = permissions.value;

  if (selectedResource.value.length > 0) {
    result = result.filter((p) =>
      selectedResource.value.includes(p.resource || "other"),
    );
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.resource?.toLowerCase().includes(query),
    );
  }

  return result;
});

// Group by resource
const permissionsByResource = computed(() => {
  const groups: Record<string, Permission[]> = {};
  filteredPermissions.value.forEach((p) => {
    const resource = p.resource || "other";
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(p);
  });
  return groups;
});

// Sorted array of [resource, perms] pairs — follows RESOURCE_PRIORITY order
const sortedPermissionGroups = computed(() => {
  return Object.entries(permissionsByResource.value).sort(([a], [b]) => {
    const pa = RESOURCE_PRIORITY[a] ?? 99;
    const pb = RESOURCE_PRIORITY[b] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });
});

async function loadPermissions() {
  isLoading.value = true;
  try {
    const [permissionsResponse, rolesResponse] = await Promise.all([
      permissionsApi.list({ limit: 200 }),
      rolesApi.list({ includeSystem: true }),
    ]);
    permissions.value = permissionsResponse.data || [];
    roles.value = rolesResponse.data || [];
  } catch (error) {
    console.error("Failed to load permissions:", error);
    message.error("Failed to load permissions");
  } finally {
    isLoading.value = false;
  }
}

function openCreateModal() {
  createForm.name = "";
  createForm.description = "";
  createForm.resource = "";
  createForm.action = "";
  showCreateModal.value = true;
}

function openEditModal(permission: Permission) {
  selectedPermission.value = permission;
  editForm.name = permission.name;
  editForm.description = permission.description || "";
  editForm.resource = permission.resource;
  editForm.action = permission.action;
  showEditModal.value = true;
}

function generatePermissionName() {
  if (createForm.resource && createForm.action) {
    createForm.name = `${createForm.resource}:${createForm.action}`;
  }
}

async function handleCreatePermission() {
  if (!createForm.name || !createForm.resource || !createForm.action) {
    message.warning("Please fill in all required fields");
    return;
  }

  isCreating.value = true;
  try {
    await permissionsApi.create(createForm);
    message.success("Permission created successfully");
    showCreateModal.value = false;
    await loadPermissions();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    message.error(
      axiosError.response?.data?.message || "Failed to create permission",
    );
  } finally {
    isCreating.value = false;
  }
}

async function handleUpdatePermission() {
  if (!selectedPermission.value) return;

  isUpdating.value = true;
  try {
    await permissionsApi.update(selectedPermission.value.id, {
      name: editForm.name,
      description: editForm.description,
      resource: editForm.resource,
      action: editForm.action,
    });
    message.success("Permission updated successfully");
    showEditModal.value = false;
    await loadPermissions();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    message.error(
      axiosError.response?.data?.message || "Failed to update permission",
    );
  } finally {
    isUpdating.value = false;
  }
}

async function handleDeletePermission(permission: Permission) {
  dialog.warning({
    title: "Delete Permission",
    content: `Are you sure you want to delete "${permission.name}"? This may affect roles using this permission.`,
    positiveText: "Delete",
    negativeText: "Cancel",
    onPositiveClick: async () => {
      try {
        await permissionsApi.delete(permission.id);
        message.success("Permission deleted successfully");
        await loadPermissions();
      } catch (error) {
        console.error("Failed to delete permission:", error);
        message.error("Failed to delete permission");
      }
    },
  });
}

// Color palette — each resource gets a unique color by hash index
const BADGE_PALETTE: [string, string, string][] = [
  ["#eef2ff", "#4f46e5", "#a5b4fc"], // indigo
  ["#eff6ff", "#2563eb", "#93c5fd"], // blue
  ["#f5f3ff", "#7c3aed", "#c4b5fd"], // violet
  ["#fdf2f8", "#db2777", "#f9a8d4"], // pink
  ["#f0fdfa", "#0d9488", "#5eead4"], // teal
  ["#ecfeff", "#0891b2", "#67e8f9"], // cyan
  ["#fffbeb", "#d97706", "#fcd34d"], // amber
  ["#ecfdf5", "#059669", "#6ee7b7"], // emerald
  ["#fff1f2", "#e11d48", "#fda4af"], // rose
  ["#f0fdf4", "#16a34a", "#86efac"], // green
  ["#faf5ff", "#9333ea", "#d8b4fe"], // purple
  ["#fff7ed", "#ea580c", "#fdba74"], // orange
  ["#fefce8", "#ca8a04", "#fde047"], // yellow
  ["#e0f2fe", "#0284c7", "#7dd3fc"], // sky
  ["#fef2f2", "#dc2626", "#fca5a5"], // red
  ["#fdf4ff", "#a21caf", "#e879f9"], // fuchsia
  ["#e0e7ff", "#4338ca", "#a5b4fc"], // indigo-dark
  ["#ccfbf1", "#0f766e", "#5eead4"], // teal-dark
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function badgeStyle(resource: string | number): Record<string, string> {
  const key = String(resource).toLowerCase();
  const c = BADGE_PALETTE[hashString(key) % BADGE_PALETTE.length];
  return {
    display: "inline-flex",
    "align-items": "center",
    "justify-content": "center",
    "min-width": "24px",
    height: "24px",
    padding: "0 8px",
    "border-radius": "12px",
    "font-size": "12px",
    "font-weight": "700",
    "line-height": "1",
    "background-color": c[0],
    color: c[1],
    border: `1px solid ${c[2]}`,
  };
}

function getActionColor(
  action: string,
): "success" | "error" | "info" | "warning" | "default" {
  switch (action.toLowerCase()) {
    case "read":
      return "success";
    case "write":
    case "create":
    case "update":
      return "warning";
    case "delete":
      return "error";
    case "admin":
      return "info";
    default:
      return "default";
  }
}

onMounted(() => {
  loadPermissions();
});
</script>

<template>
  <div class="rbac-permissions-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">Permissions Management</h2>
        <p class="page-subtitle">
          Create and manage system permissions for access control
        </p>
      </div>
      <n-button v-if="canCreate" type="primary" @click="openCreateModal">
        <template #icon>
          <Icon icon="carbon:add" />
        </template>
        Create Permission
      </n-button>
    </div>

    <!-- Stat Panels -->
    <div class="stats-grid">
      <StatPanel
        title="Total Roles"
        :value="roles.length"
        icon="carbon:user-role"
        color="purple"
        value-color="#8b5cf6"
        size="small"
      />
      <StatPanel
        title="Total Permissions"
        :value="totalPermissions"
        icon="carbon:password"
        color="primary"
        value-color="#3b82f6"
        size="small"
      />
      <StatPanel
        title="Total Resources"
        :value="totalResources"
        icon="carbon:folder"
        color="info"
        value-color="#06b6d4"
        size="small"
      />
      <StatPanel
        title="Shown"
        :value="filteredPermissions.length"
        icon="carbon:view"
        color="success"
        value-color="#22c55e"
        size="small"
      />
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <n-input
        v-model:value="searchQuery"
        placeholder="Search permissions..."
        clearable
        class="search-input"
      >
        <template #prefix>
          <Icon icon="carbon:search" />
        </template>
      </n-input>
      <n-select
        v-model:value="selectedResource"
        placeholder="All Resources"
        clearable
        multiple
        class="resource-filter"
        :options="resources.map((r) => ({ label: r, value: r }))"
      />
    </div>

    <!-- Create Modal -->
    <n-modal
      v-model:show="showCreateModal"
      preset="card"
      title="Create New Permission"
      style="width: 500px"
      :mask-closable="false"
    >
      <n-form :model="createForm" label-placement="top">
        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="Resource" required>
              <n-select
                v-model:value="createForm.resource"
                placeholder="Select resource"
                :options="resourceOptions"
                filterable
                tag
                @update:value="generatePermissionName"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Action" required>
              <n-select
                v-model:value="createForm.action"
                placeholder="Select action"
                :options="actionOptions"
                filterable
                tag
                @update:value="generatePermissionName"
              />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-form-item label="Permission Name" required>
          <n-input
            v-model:value="createForm.name"
            placeholder="e.g., users:read"
          />
        </n-form-item>
        <n-form-item label="Description">
          <n-input
            v-model:value="createForm.description"
            type="textarea"
            placeholder="Describe what this permission allows"
            :rows="2"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer tfo-modal-footer">
          <n-button @click="showCreateModal = false">Cancel</n-button>
          <n-button
            type="primary"
            :loading="isCreating"
            @click="handleCreatePermission"
          >
            Create Permission
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- Edit Modal -->
    <n-modal
      v-model:show="showEditModal"
      preset="card"
      title="Edit Permission"
      style="width: 500px"
      :mask-closable="false"
    >
      <n-form :model="editForm" label-placement="top">
        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="Resource" required>
              <n-select
                v-model:value="editForm.resource"
                placeholder="Select resource"
                :options="resourceOptions"
                filterable
                tag
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Action" required>
              <n-select
                v-model:value="editForm.action"
                placeholder="Select action"
                :options="actionOptions"
                filterable
                tag
              />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-form-item label="Permission Name" required>
          <n-input
            v-model:value="editForm.name"
            placeholder="e.g., users:read"
          />
        </n-form-item>
        <n-form-item label="Description">
          <n-input
            v-model:value="editForm.description"
            type="textarea"
            placeholder="Describe what this permission allows"
            :rows="2"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer tfo-modal-footer">
          <n-button @click="showEditModal = false">Cancel</n-button>
          <n-button
            type="primary"
            :loading="isUpdating"
            @click="handleUpdatePermission"
          >
            Save Changes
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- Permissions Grid -->
    <n-spin :show="isLoading">
      <div class="permissions-grid">
        <n-card
          v-for="[resource, perms] in sortedPermissionGroups"
          :key="resource"
          class="resource-card"
        >
          <template #header>
            <div class="resource-header">
              <Icon icon="carbon:folder" class="resource-icon" />
              <span class="resource-name">{{ resource }}</span>
              <span :style="badgeStyle(resource)">
                {{ perms.length }}
              </span>
            </div>
          </template>

          <div class="permissions-list">
            <div
              v-for="permission in perms"
              :key="permission.id"
              class="permission-item"
              :data-action="permission.action.toLowerCase()"
            >
              <div class="permission-main">
                <div class="permission-info">
                  <div class="permission-name">
                    <Icon icon="carbon:password" class="permission-icon" />
                    {{ permission.name }}
                  </div>
                  <div class="permission-description">
                    {{ permission.description || "No description" }}
                  </div>
                </div>
                <n-tag :type="getActionColor(permission.action)" size="small">
                  {{ permission.action }}
                </n-tag>
              </div>
              <div class="permission-actions">
                <n-button
                  v-if="canEdit"
                  size="tiny"
                  quaternary
                  @click="openEditModal(permission)"
                >
                  <template #icon>
                    <Icon icon="carbon:edit" />
                  </template>
                </n-button>
                <n-button
                  v-if="canDelete"
                  size="tiny"
                  quaternary
                  type="error"
                  @click="handleDeletePermission(permission)"
                >
                  <template #icon>
                    <Icon icon="carbon:trash-can" />
                  </template>
                </n-button>
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <div
        v-if="sortedPermissionGroups.length === 0 && !isLoading"
        class="empty-state"
      >
        <Icon icon="carbon:search" class="empty-icon" />
        <p>No permissions found</p>
      </div>
    </n-spin>
  </div>
</template>

<style scoped lang="scss">
.rbac-permissions-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .page-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: var(--n-text-color);
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: var(--n-text-color-3);
    margin: 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.filters-bar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px;
  background: var(--card-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);

  :root:not(.dark) & {
    background: #ffffff;
    border-color: #e2e8f0;
  }

  :root.dark & {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .search-input {
    width: 250px;
  }

  .resource-filter {
    width: 250px;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 24px;
}

.resource-card {
  .resource-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .resource-icon {
      font-size: 20px;
      color: var(--primary-color);
    }

    .resource-name {
      font-weight: 600;
      text-transform: capitalize;
      flex: 1;
    }
  }
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--card-color);
  border-radius: 8px;
  border: 2px solid;
  transition: all 0.2s;

  // Border colors based on action type
  &[data-action="create"] {
    border-color: #10b981;
  }

  &[data-action="read"] {
    border-color: #3b82f6;
  }

  &[data-action="update"],
  &[data-action="write"] {
    border-color: #f59e0b;
  }

  &[data-action="delete"] {
    border-color: #ef4444;
  }

  &[data-action="admin"],
  &[data-action="manage"] {
    border-color: #8b5cf6;
  }

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .permission-actions {
      opacity: 1;
    }
  }
}

.permission-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex: 1;
  gap: 12px;
}

.permission-info {
  flex: 1;

  .permission-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    margin-bottom: 4px;

    .permission-icon {
      color: var(--text-color-3);
    }
  }

  .permission-description {
    font-size: 12px;
    color: var(--text-color-3);
    padding-left: 24px;
  }
}

.permission-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: var(--text-color-3);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
}

@media (max-width: 600px) {
  .permissions-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;

    .search-input,
    .resource-filter {
      width: 100%;
    }
  }
}
</style>
