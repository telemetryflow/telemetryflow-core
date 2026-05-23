<script setup lang="ts">
import { ref, onMounted, computed, reactive, h } from "vue";
import { Icon } from "@iconify/vue";
import {
  useMessage,
  useDialog,
  NTag,
  NButton,
  NDropdown,
  NText,
} from "naive-ui";
import type { DropdownOption } from "naive-ui";
import StatPanel from "@/components/charts/StatPanel.vue";
import PermissionsModal from "./PermissionsModal.vue";
import { rolesApi } from "@/api/roles";
import { permissionsApi } from "@/api/permissions";
import { useAuthStore } from "@/store";
import type { Role, Permission, CreateRoleRequest } from "@/types";
import { withSortableColumns } from "@/utils";
import { formatDateTime } from "@/utils/format";
import { exportToCSV, exportToJSON, getExportFilename } from "@/utils/export";
import { TagBadge } from "@/components/common";

const authStore = useAuthStore();
const message = useMessage();
const dialog = useDialog();

const roles = ref<Role[]>([]);
const allPermissions = ref<Permission[]>([]);
const selectedRole = ref<Role | null>(null);
const rolePermissions = ref<Permission[]>([]);
const roleUsers = ref<number>(0);
const isLoading = ref(false);
const isLoadingPermissions = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showPermissionsModal = ref(false);
const isCreating = ref(false);
const isUpdating = ref(false);
const searchQuery = ref("");

// View mode
const viewMode = ref<"grid" | "table">("table");

// Pagination
const page = ref(1);
const pageSize = ref(10);

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

// Create form
const createForm = reactive<CreateRoleRequest>({
  name: "",
  description: "",
});

// Edit form
const editForm = reactive({
  name: "",
  description: "",
});

// Permissions
const canCreate = computed(() => authStore.hasPermission("roles:write"));
const canEdit = computed(() => authStore.hasPermission("roles:write"));
const canDelete = computed(() => authStore.hasPermission("roles:delete"));

// Stats
const totalRoles = computed(() => roles.value.length);
const systemRoles = computed(
  () => roles.value.filter((r) => r.isSystem).length,
);
const customRoles = computed(
  () => roles.value.filter((r) => !r.isSystem).length,
);

// Filtered roles
const filteredRoles = computed(() => {
  if (!searchQuery.value) return roles.value;
  const query = searchQuery.value.toLowerCase();
  return roles.value.filter(
    (r) =>
      r.name.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query),
  );
});

// Total count for pagination
const total = computed(() => filteredRoles.value.length);

// Group permissions by resource
const permissionsByResource = computed(() => {
  const groups: Record<string, Permission[]> = {};
  allPermissions.value.forEach((p) => {
    const resource = p.resource || "other";
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(p);
  });
  return groups;
});

function getRoleTier(roleName: string) {
  const name = roleName.toLowerCase().replace(/[^a-z]/g, "_");
  return (
    roleTierMap[name] || { tier: 0, color: "#64748b", icon: "carbon:user-role" }
  );
}

function getActionType(
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

// Table columns (withSortableColumns auto-adds sorters except for actions)
const columns = computed(() =>
  withSortableColumns([
    {
      title: "Role",
      key: "name",
      minWidth: 250,
      render: (row: Role) => {
        const tier = getRoleTier(row.name);
        return h("div", { class: "name-cell" }, [
          h(
            "div",
            {
              class: "role-tier-indicator",
              style: { backgroundColor: tier.color },
            },
            h(Icon, { icon: tier.icon }),
          ),
          h("div", { class: "cell-info" }, [
            h(
              NText,
              {
                strong: true,
                style: "font-size: 14px; font-weight: 600; display: block",
              },
              () => row.name,
            ),
            h(
              NText,
              {
                depth: 3,
                style: "font-size: 12px; display: block; margin-top: 2px",
              },
              () => row.description || "No description",
            ),
          ]),
        ]);
      },
    },
    {
      title: "Type",
      key: "isSystem",
      width: 100,
      render: (row: Role) =>
        h(
          NTag,
          {
            type: row.isSystem ? "info" : "default",
            size: "small",
          },
          () => (row.isSystem ? "System" : "Custom"),
        ),
    },
    {
      title: "Permissions",
      key: "permissions",
      width: 180,
      align: "center" as const,
      render: (row: Role) => {
        const count = row.permissions?.length || 0;

        // Determine color based on count ranges
        let bgColor = "";
        let textColor = "";

        if (count >= 60) {
          // High count - Purple/Blue
          bgColor = "rgba(99, 102, 241, 0.15)";
          textColor = "#6366f1";
        } else if (count >= 40) {
          // Medium-high - Cyan
          bgColor = "rgba(6, 182, 212, 0.15)";
          textColor = "#06b6d4";
        } else if (count >= 25) {
          // Medium - Green
          bgColor = "rgba(34, 197, 94, 0.15)";
          textColor = "#22c55e";
        } else if (count >= 15) {
          // Medium-low - Orange
          bgColor = "rgba(245, 158, 11, 0.15)";
          textColor = "#f59e0b";
        } else {
          // Low - Pink/Red
          bgColor = "rgba(236, 72, 153, 0.15)";
          textColor = "#ec4899";
        }

        return h(
          "span",
          {
            style: {
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "0.875rem",
              fontWeight: "600",
              backgroundColor: bgColor,
              color: textColor,
              border: `1px solid ${textColor}33`,
            },
          },
          [
            h(
              "strong",
              { style: { fontWeight: "700", marginRight: "4px" } },
              count.toString(),
            ),
            " permissions",
          ],
        );
      },
    },
    {
      title: "Created",
      key: "createdAt",
      width: 180,
      render: (row: Role) =>
        h(NText, { depth: 2, style: "font-size: 13px" }, () =>
          formatDateTime(row.createdAt),
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center" as const,
      fixed: "right" as const,
      render: (row: Role) => {
        const options: DropdownOption[] = [
          {
            label: "Permissions",
            key: "permissions",
            icon: () =>
              h(Icon, { icon: "carbon:password", width: 16, height: 16 }),
          },
          {
            label: "Edit",
            key: "edit",
            icon: () => h(Icon, { icon: "carbon:edit", width: 16, height: 16 }),
            disabled: !canEdit.value,
          },
          { type: "divider", key: "d1" },
          {
            label: "Delete",
            key: "delete",
            icon: () =>
              h(Icon, {
                icon: "carbon:trash-can",
                width: 16,
                height: 16,
                style: "color: #ef4444",
              }),
            props: { style: "color: #ef4444" },
            disabled: !canDelete.value || row.isSystem,
          },
        ];

        const filteredOptions = options;

        function handleActionSelect(key: string) {
          switch (key) {
            case "permissions":
              openPermissionsModal(row);
              break;
            case "edit":
              openEditModal(row);
              break;
            case "delete":
              handleDeleteRole(row);
              break;
          }
        }

        return h(
          NDropdown,
          {
            options: filteredOptions,
            trigger: "click",
            onSelect: handleActionSelect,
          },
          {
            default: () =>
              h(
                NButton,
                { size: "small", quaternary: true, class: "action-menu-btn" },
                {
                  icon: () =>
                    h(Icon, {
                      icon: "carbon:overflow-menu-vertical",
                      width: 16,
                      height: 16,
                    }),
                },
              ),
          },
        );
      },
    },
  ]),
);

async function loadRoles() {
  isLoading.value = true;
  try {
    const [rolesData, permissionsData] = await Promise.all([
      rolesApi.list({ includeSystem: true }),
      permissionsApi.list({ limit: 200 }),
    ]);
    roles.value = rolesData.data || [];
    allPermissions.value = permissionsData.data || [];
  } catch (error) {
    console.error("Failed to load roles:", error);
    message.error("Failed to load roles");
  } finally {
    isLoading.value = false;
  }
}

async function openPermissionsModal(role: Role) {
  selectedRole.value = role;
  showPermissionsModal.value = true;
  isLoadingPermissions.value = true;
  try {
    const [permResponse, usersResponse] = await Promise.all([
      rolesApi.getPermissions(role.id),
      rolesApi.getUsers(role.id).catch(() => ({ data: [] })),
    ]);
    rolePermissions.value = permResponse.data || [];
    roleUsers.value = usersResponse.data?.length || 0;
  } catch (error) {
    console.error("Failed to load role details:", error);
    message.error("Failed to load role details");
  } finally {
    isLoadingPermissions.value = false;
  }
}

function openCreateModal() {
  createForm.name = "";
  createForm.description = "";
  showCreateModal.value = true;
}

function openEditModal(role: Role) {
  selectedRole.value = role;
  editForm.name = role.name;
  editForm.description = role.description || "";
  showEditModal.value = true;
}

async function handleCreateRole() {
  if (!createForm.name) {
    message.warning("Role name is required");
    return;
  }

  isCreating.value = true;
  try {
    await rolesApi.create(createForm);
    message.success("Role created successfully");
    showCreateModal.value = false;
    await loadRoles();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    message.error(
      axiosError.response?.data?.message || "Failed to create role",
    );
  } finally {
    isCreating.value = false;
  }
}

async function handleUpdateRole() {
  if (!selectedRole.value) return;

  isUpdating.value = true;
  try {
    await rolesApi.update(selectedRole.value.id, {
      name: editForm.name,
      description: editForm.description,
    });
    message.success("Role updated successfully");
    showEditModal.value = false;
    await loadRoles();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    message.error(
      axiosError.response?.data?.message || "Failed to update role",
    );
  } finally {
    isUpdating.value = false;
  }
}

async function handleDeleteRole(role: Role) {
  if (role.isSystem) {
    message.warning("System roles cannot be deleted");
    return;
  }

  dialog.warning({
    title: "Delete Role",
    content: `Are you sure you want to delete "${role.name}"? This action cannot be undone.`,
    positiveText: "Delete",
    negativeText: "Cancel",
    onPositiveClick: async () => {
      try {
        await rolesApi.delete(role.id);
        message.success("Role deleted successfully");
        await loadRoles();
      } catch (error) {
        console.error("Failed to delete role:", error);
        message.error("Failed to delete role");
      }
    },
  });
}

async function assignPermission(permissionId: string) {
  if (!selectedRole.value) return;
  try {
    await rolesApi.assignPermission(selectedRole.value.id, permissionId);
    const permResponse = await rolesApi.getPermissions(selectedRole.value.id);
    rolePermissions.value = permResponse.data || [];
    message.success("Permission assigned");
  } catch (error) {
    console.error("Failed to assign permission:", error);
    message.error("Failed to assign permission");
  }
}

async function removePermission(permissionId: string) {
  if (!selectedRole.value) return;
  try {
    await rolesApi.removePermission(selectedRole.value.id, permissionId);
    const permResponse = await rolesApi.getPermissions(selectedRole.value.id);
    rolePermissions.value = permResponse.data || [];
    message.success("Permission removed");
  } catch (error) {
    console.error("Failed to remove permission:", error);
    message.error("Failed to remove permission");
  }
}

function isPermissionAssigned(permissionId: string): boolean {
  return rolePermissions.value.some((p) => p.id === permissionId);
}

function handlePageChange(newPage: number) {
  page.value = newPage;
}

function handlePageSizeChange(newPageSize: number) {
  pageSize.value = newPageSize;
  page.value = 1;
}

function exportCSV() {
  const data = filteredRoles.value.map((r) => ({
    name: r.name,
    description: r.description || "",
    type: r.isSystem ? "System" : "Custom",
    permissions: r.permissions?.length || 0,
    created: formatDateTime(r.createdAt),
  }));

  const columns = [
    { key: "name", title: "Name" },
    { key: "description", title: "Description" },
    { key: "type", title: "Type" },
    { key: "permissions", title: "Permissions" },
    { key: "created", title: "Created" },
  ];

  exportToCSV(data, getExportFilename("roles"), columns);
  message.success("Exported to CSV successfully");
}

function exportJSON() {
  const data = filteredRoles.value.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    permissions: r.permissions,
    createdAt: r.createdAt,
  }));

  exportToJSON(data, getExportFilename("roles"));
  message.success("Exported to JSON successfully");
}

onMounted(() => {
  loadRoles();
});
</script>

<template>
  <div class="rbac-roles-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">Roles</h2>
        <p class="page-subtitle">Manage roles and their permissions</p>
      </div>
      <n-button v-if="canCreate" type="primary" @click="openCreateModal">
        <template #icon>
          <Icon icon="carbon:add" />
        </template>
        Create Role
      </n-button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <StatPanel
        title="Total Roles"
        :value="totalRoles"
        icon="carbon:user-role"
        color="purple"
        size="small"
      />
      <StatPanel
        title="System Roles"
        :value="systemRoles"
        icon="carbon:security"
        color="info"
        size="small"
      />
      <StatPanel
        title="Custom Roles"
        :value="customRoles"
        icon="carbon:user-admin"
        color="primary"
        size="small"
      />
    </div>

    <!-- Section -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:user-role" class="section-icon" />
          <span>Roles</span>
          <n-tag :bordered="false" size="small" type="info">
            <strong>{{ filteredRoles.length }}</strong> roles
          </n-tag>
        </div>
        <div class="table-actions">
          <n-input
            v-model:value="searchQuery"
            placeholder="Search roles..."
            size="small"
            clearable
            class="search-input"
          >
            <template #prefix>
              <Icon icon="carbon:search" />
            </template>
          </n-input>
          <n-button-group size="small">
            <n-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
            >
              <template #icon><Icon icon="carbon:grid" /></template>
              Grid
            </n-button>
            <n-button
              :type="viewMode === 'table' ? 'primary' : 'default'"
              @click="viewMode = 'table'"
            >
              <template #icon><Icon icon="carbon:list" /></template>
              Table
            </n-button>
            <n-button secondary @click="exportCSV">
              <template #icon><Icon icon="carbon:download" /></template>
              CSV
            </n-button>
            <n-button secondary @click="exportJSON">
              <template #icon><Icon icon="carbon:code" /></template>
              JSON
            </n-button>
          </n-button-group>
        </div>
      </div>

      <!-- Create Modal -->
      <n-modal
        v-model:show="showCreateModal"
        preset="card"
        title="Create New Role"
        style="width: 500px"
        :mask-closable="false"
      >
        <n-form :model="createForm" label-placement="top">
          <n-form-item label="Role Name" required>
            <n-input
              v-model:value="createForm.name"
              placeholder="e.g., analyst, operator"
            />
          </n-form-item>
          <n-form-item label="Description">
            <n-input
              v-model:value="createForm.description"
              type="textarea"
              placeholder="Describe the role's responsibilities"
              :rows="3"
            />
          </n-form-item>
        </n-form>
        <template #footer>
          <div class="modal-footer tfo-modal-footer">
            <n-button @click="showCreateModal = false">Cancel</n-button>
            <n-button
              type="primary"
              :loading="isCreating"
              @click="handleCreateRole"
            >
              Create Role
            </n-button>
          </div>
        </template>
      </n-modal>

      <!-- Edit Modal -->
      <n-modal
        v-model:show="showEditModal"
        preset="card"
        title="Edit Role"
        style="width: 500px"
        :mask-closable="false"
      >
        <n-form :model="editForm" label-placement="top">
          <n-form-item label="Role Name" required>
            <n-input
              v-model:value="editForm.name"
              placeholder="Role name"
              :disabled="selectedRole?.isSystem"
            />
          </n-form-item>
          <n-form-item label="Description">
            <n-input
              v-model:value="editForm.description"
              type="textarea"
              placeholder="Describe the role's responsibilities"
              :rows="3"
            />
          </n-form-item>
        </n-form>
        <template #footer>
          <div class="modal-footer tfo-modal-footer">
            <n-button @click="showEditModal = false">Cancel</n-button>
            <n-button
              type="primary"
              :loading="isUpdating"
              @click="handleUpdateRole"
            >
              Save Changes
            </n-button>
          </div>
        </template>
      </n-modal>

      <!-- Permissions Modal Component -->
      <PermissionsModal
        v-model:show="showPermissionsModal"
        :role="selectedRole"
        :permissions="rolePermissions"
        :all-permissions="allPermissions"
        :is-loading="isLoadingPermissions"
        :role-users="roleUsers"
        :can-edit="canEdit"
        @assign-permission="assignPermission"
        @remove-permission="removePermission"
      />

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="grid-content">
        <n-spin :show="isLoading">
          <div class="cards-grid">
            <div
              v-for="role in filteredRoles"
              :key="role.id"
              class="dashboard-card"
              @click="openPermissionsModal(role)"
            >
              <div class="card-header">
                <div
                  class="card-icon"
                  :style="{ background: getRoleTier(role.name).color }"
                >
                  <Icon :icon="getRoleTier(role.name).icon" />
                </div>
                <n-dropdown
                  trigger="click"
                  :options="[
                    {
                      label: 'Permissions',
                      key: 'permissions',
                      icon: () => h(Icon, { icon: 'carbon:password' }),
                    },
                    {
                      label: 'Edit',
                      key: 'edit',
                      icon: () => h(Icon, { icon: 'carbon:edit' }),
                      disabled: !canEdit,
                    },
                    { type: 'divider', key: 'd1' },
                    {
                      label: 'Delete',
                      key: 'delete',
                      icon: () => h(Icon, { icon: 'carbon:trash-can' }),
                      props: { class: 'delete-action' },
                      disabled: !canDelete || role.isSystem,
                    },
                  ]"
                  @select="
                    (key: string) => {
                      if (key === 'permissions') openPermissionsModal(role);
                      else if (key === 'edit') openEditModal(role);
                      else if (key === 'delete') handleDeleteRole(role);
                    }
                  "
                >
                  <n-button quaternary circle size="small" @click.stop>
                    <template #icon>
                      <Icon icon="carbon:overflow-menu-vertical" />
                    </template>
                  </n-button>
                </n-dropdown>
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ role.name }}</h3>
                <p class="card-description">
                  {{ role.description || "No description" }}
                </p>
              </div>
              <div class="card-meta">
                <span class="updated-at">{{
                  formatDateTime(role.createdAt)
                }}</span>
              </div>
              <div class="card-tags">
                <TagBadge :label="role.isSystem ? 'System' : 'Custom'" />
                <TagBadge
                  :label="`${role.permissions?.length || 0} permissions`"
                  :index="1"
                />
              </div>
            </div>

            <!-- Add New Card -->
            <div
              v-if="canCreate"
              class="dashboard-card new-card"
              @click="openCreateModal"
            >
              <div class="new-card-content">
                <Icon icon="carbon:add-large" class="add-icon" />
                <span>Create Role</span>
              </div>
            </div>
          </div>
          <div
            v-if="filteredRoles.length === 0 && !isLoading && !canCreate"
            class="empty-state"
          >
            <Icon icon="carbon:user-role" class="empty-icon" />
            <p>No roles found</p>
          </div>
        </n-spin>
      </div>

      <!-- Data Table -->
      <div v-else class="table-content">
        <n-data-table
          :columns="columns"
          :data="filteredRoles"
          :loading="isLoading"
          :row-key="(row: Role) => row.id"
          :scroll-x="800"
          :pagination="{
            page: page,
            pageSize: pageSize,
            itemCount: total,
            showSizePicker: true,
            pageSizes: [10, 20, 50, 100, 200, 500],
            onChange: handlePageChange,
            onUpdatePageSize: handlePageSizeChange,
            prefix: (info: any) => `${info.itemCount} items`,
          }"
          :bordered="false"
          :single-line="false"
          striped
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";

.rbac-roles-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Stats Row
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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

.section {
  @include k8s-theme-vars;
  background: var(--card-color);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--k8s-border-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--k8s-border-color);
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 1rem;

  .section-icon {
    font-size: 20px;
    color: var(--primary-color);
  }
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .search-input {
    width: 200px;
  }
}

// Grid view styles
.grid-content {
  padding: 20px;
  background: var(--card-color);
  border-radius: 12px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  @media (min-width: 641px) and (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1025px) and (max-width: 1440px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1441px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.dashboard-card {
  padding: 20px;
  background: var(--n-card-color);
  border: 2px solid rgba(128, 128, 128, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: var(--n-primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 640px) {
    padding: 16px;
    border-radius: 10px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
}

.card-content {
  min-height: 72px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--n-text-color);
  line-height: 1.4;
}

.card-description {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.625rem;
  line-height: 1.5;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--n-text-color-3);
}

.updated-at {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  min-height: 28px;
}

.new-card {
  border-style: dashed;
  border-width: 2px;
  border-color: rgba(128, 128, 128, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  box-shadow: none;

  &:hover {
    border-color: var(--n-primary-color);
    background: rgba(59, 130, 246, 0.05);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  }
}

.new-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-3);
}

.add-icon {
  font-size: 32px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--n-text-color-3);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.table-content {
  padding: 0;

  :deep(.n-data-table) {
    --n-th-color: var(--card-color);
    --n-td-color: var(--card-color);
    --n-th-text-color: var(--text-color-3);
    --n-border-color: var(--border-color);

    :root:not(.dark) & {
      --n-th-color: #ffffff;
      --n-td-color: #ffffff;
    }

    :root.dark & {
      --n-th-color: rgba(255, 255, 255, 0.08);
      --n-td-color: rgba(255, 255, 255, 0.08);
    }
  }

  :deep(.n-data-table-th) {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 12px 16px;
  }

  :deep(.n-data-table-td) {
    padding: 12px 16px;
  }

  :deep(.name-cell) {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    overflow: hidden;
  }

  :deep(.cell-icon) {
    color: var(--text-color-2);
    flex-shrink: 0;
  }

  :deep(.role-tier-indicator) {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 18px;
    flex-shrink: 0;
  }

  :deep(.cell-info) {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    > * {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  :deep(.action-buttons) {
    display: flex;
    gap: 4px;
  }
}

@media (max-width: 600px) {
  .header-actions {
    width: 100%;
    flex-direction: column;

    .search-input {
      width: 100%;
    }
  }
}
</style>
