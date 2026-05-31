<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import { useMessage } from "naive-ui";
import StatPanel from "@/components/charts/StatPanel.vue";
import { rolesApi } from "@/api/roles";
import { permissionsApi } from "@/api/permissions";
import type { Role, Permission } from "@/types";

const message = useMessage();

const roles = ref<Role[]>([]);
const permissions = ref<Permission[]>([]);
const rolePermissionsMap = ref<Record<string, Set<string>>>({});
const isLoading = ref(true);
const selectedResource = ref<string[]>([]);
const searchQuery = ref("");

// Canonical resource options (label → value) shared with permissions page
const RESOURCE_OPTIONS = [
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

// Available resource options — only show resources that exist in loaded permissions
const availableResourceOptions = computed(() => {
  const existing = new Set(permissions.value.map((p) => p.resource || "other"));
  const canonical = RESOURCE_OPTIONS.filter((o) => existing.has(o.value));
  // Include any resources not in canonical list (fallback with formatted label)
  existing.forEach((r) => {
    if (!RESOURCE_OPTIONS.find((o) => o.value === r)) {
      canonical.push({
        label: r.replace(/-/g, " ").replace(/:/g, ": "),
        value: r,
      });
    }
  });
  return canonical;
});

// Filter permissions by resource
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
        p.action.toLowerCase().includes(query) ||
        (p.resource || "other").toLowerCase().includes(query),
    );
  }

  return result;
});

// Resource display order — mirrors resourceOptions in permissions/index.vue exactly
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
  // aliases — seed uses these variants
  alerts: 20,
  organization: 4,
  workspace: 5,
  tenant: 6,
  region: 8,
  other: 99,
};

// Group permissions by resource for display
const permissionsByResource = computed(() => {
  const groups: Record<string, Permission[]> = {};
  filteredPermissions.value.forEach((p) => {
    const resource = p.resource || "other";
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(p);
  });
  return groups;
});

// Sorted resource keys: follows RESOURCE_ORDER, then alphabetical for unknowns
const sortedResources = computed(() => {
  return Object.keys(permissionsByResource.value).sort((a, b) => {
    const orderA = RESOURCE_ORDER[a] ?? 500;
    const orderB = RESOURCE_ORDER[b] ?? 500;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
});

// Stats — global (unfiltered)
const totalRoles = computed(() => roles.value.length);
const totalPermissions = computed(() => permissions.value.length);
const totalMappings = computed(() => {
  return Object.values(rolePermissionsMap.value).reduce(
    (sum, set) => sum + set.size,
    0,
  );
});
const avgPermissionsPerRole = computed(() => {
  if (roles.value.length === 0) return 0;
  return Math.round(totalMappings.value / roles.value.length);
});

// Stats — filter-reactive (Shown)
const shownPermissions = computed(() => filteredPermissions.value.length);
const shownResources = computed(() => sortedResources.value.length);
const shownMappings = computed(() => {
  return filteredPermissions.value.reduce((sum, p) => {
    return (
      sum +
      Object.values(rolePermissionsMap.value).filter((set) => set.has(p.id))
        .length
    );
  }, 0);
});
const shownCoverage = computed(() => {
  const total = filteredPermissions.value.length * roles.value.length;
  if (total === 0) return 0;
  return Math.round((shownMappings.value / total) * 100);
});

async function loadData() {
  isLoading.value = true;
  try {
    const [rolesData, permissionsData] = await Promise.all([
      rolesApi.list({ includeSystem: true }),
      permissionsApi.list({ limit: 200 }),
    ]);
    roles.value = rolesData.data || [];
    permissions.value = permissionsData.data || [];

    // Load permissions for each role
    const permissionPromises = roles.value.map(async (role) => {
      try {
        const response = await rolesApi.getPermissions(role.id);
        return { roleId: role.id, permissions: response.data || [] };
      } catch {
        return { roleId: role.id, permissions: [] };
      }
    });

    const results = await Promise.all(permissionPromises);
    results.forEach(({ roleId, permissions: perms }) => {
      const permIds = new Set<string>();
      perms.forEach((p: any) => {
        if (p && typeof p === "object" && p.id) {
          // Full Permission object — use id directly
          permIds.add(p.id);
        } else if (typeof p === "string" && p) {
          // Legacy: p is a permission name (e.g. "users:read") — match against loaded permissions
          const match = permissions.value.find((perm) => perm.name === p);
          if (match) permIds.add(match.id);
        }
      });
      rolePermissionsMap.value[roleId] = permIds;
    });
  } catch (error) {
    console.error("Failed to load matrix data:", error);
    message.error("Failed to load matrix data");
  } finally {
    isLoading.value = false;
  }
}

function hasPermission(roleId: string, permissionId: string): boolean {
  return rolePermissionsMap.value[roleId]?.has(permissionId) || false;
}

function getRolePermissionCount(roleId: string): number {
  return rolePermissionsMap.value[roleId]?.size || 0;
}

function getPermissionRoleCount(permissionId: string): number {
  return Object.values(rolePermissionsMap.value).filter((set) =>
    set.has(permissionId),
  ).length;
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

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="rbac-matrix-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">Role-Permission Matrix</h2>
        <p class="page-subtitle">
          View the complete mapping of roles to permissions
        </p>
      </div>
      <n-button :loading="isLoading" @click="loadData">
        <template #icon>
          <Icon icon="carbon:renew" />
        </template>
        Refresh
      </n-button>
    </div>

    <!-- Stats Cards — global -->
    <div class="stats-row">
      <StatPanel
        title="Total Roles"
        :value="totalRoles"
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
        title="Total Mappings"
        :value="totalMappings"
        icon="carbon:network-3"
        color="success"
        value-color="#22c55e"
        size="small"
      />
      <StatPanel
        title="Avg Per Role"
        :value="avgPermissionsPerRole"
        icon="carbon:chart-average"
        color="info"
        value-color="#06b6d4"
        size="small"
      />
    </div>

    <!-- Stats Cards — filter-reactive (Shown) -->
    <div class="stats-row-label">
      <Icon icon="carbon:filter" />
      <span>Shown (filtered)</span>
    </div>
    <div class="stats-row">
      <StatPanel
        title="Shown Permissions"
        :value="shownPermissions"
        icon="carbon:view"
        color="warning"
        value-color="#f59e0b"
        size="small"
      />
      <StatPanel
        title="Shown Resources"
        :value="shownResources"
        icon="carbon:folder"
        color="purple"
        value-color="#a855f7"
        size="small"
      />
      <StatPanel
        title="Shown Mappings"
        :value="shownMappings"
        icon="carbon:checkmark-outline"
        color="success"
        value-color="#10b981"
        size="small"
      />
      <StatPanel
        title="Coverage"
        :value="`${shownCoverage}%`"
        icon="carbon:chart-pie"
        color="info"
        value-color="#06b6d4"
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
        filterable
        class="resource-filter"
        :options="availableResourceOptions"
        :max-tag-count="4"
        tag-checkable
      />
    </div>

    <!-- Matrix Legend -->
    <n-card class="legend-card">
      <div class="legend-items">
        <div class="legend-item">
          <div class="legend-icon granted">
            <Icon icon="carbon:checkmark-filled" />
          </div>
          <span>Permission Granted</span>
        </div>
        <div class="legend-item">
          <div class="legend-icon denied">
            <Icon icon="carbon:close" />
          </div>
          <span>Permission Not Granted</span>
        </div>
        <div class="legend-item">
          <n-tag type="info" size="small">System</n-tag>
          <span>System Role (Read-only)</span>
        </div>
      </div>
    </n-card>

    <!-- Matrix Table -->
    <n-spin :show="isLoading">
      <div
        v-for="resource in sortedResources"
        :key="resource"
        class="resource-section"
      >
        <div class="resource-header">
          <Icon icon="carbon:folder" class="resource-icon" />
          <span class="resource-name">{{ resource }}</span>
          <n-tag size="small" round>
            {{ permissionsByResource[resource].length }} permissions
          </n-tag>
        </div>

        <div class="matrix-container">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="permission-header">Permission</th>
                <th
                  v-for="role in roles"
                  :key="role.id"
                  class="role-header"
                  :class="{ system: role.isSystem }"
                >
                  <div class="role-header-content">
                    <span class="role-name">{{ role.name }}</span>
                    <n-tag v-if="role.isSystem" size="small" type="info">
                      System
                    </n-tag>
                    <span class="role-count">{{
                      getRolePermissionCount(role.id)
                    }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="permission in permissionsByResource[resource]"
                :key="permission.id"
              >
                <td class="permission-cell">
                  <div class="permission-info">
                    <span class="permission-name">{{ permission.name }}</span>
                    <n-tag
                      :type="getActionType(permission.action)"
                      size="small"
                    >
                      {{ permission.action }}
                    </n-tag>
                  </div>
                  <span class="permission-count">{{ getPermissionRoleCount(permission.id) }} roles</span>
                </td>
                <td
                  v-for="role in roles"
                  :key="`${role.id}-${permission.id}`"
                  class="check-cell"
                  :class="{
                    granted: hasPermission(role.id, permission.id),
                    system: role.isSystem,
                  }"
                >
                  <Icon
                    v-if="hasPermission(role.id, permission.id)"
                    icon="carbon:checkmark-filled"
                    class="check-icon granted"
                  />
                  <Icon v-else icon="carbon:close" class="check-icon denied" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="sortedResources.length === 0 && !isLoading"
        class="empty-state"
      >
        <Icon icon="carbon:grid" class="empty-icon" />
        <p>No permissions to display</p>
      </div>
    </n-spin>
  </div>
</template>

<style scoped lang="scss">
.rbac-matrix-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stats-row-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--n-text-color-3);
  margin-bottom: -4px;

  :deep(svg) {
    font-size: 14px;
  }
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

.filters-bar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
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
    flex: 1;
    min-width: 320px;
  }
}

.legend-card {
  background: #ffffff !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;

  :root.dark & {
    background: rgba(30, 41, 59, 0.6) !important;
    border-color: rgba(71, 85, 105, 0.5) !important;
  }

  .legend-items {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #475569;

    :root.dark & {
      color: #94a3b8;
    }
  }

  .legend-icon {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.granted {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;

      :root.dark & {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
      }
    }

    &.denied {
      background: rgba(100, 116, 139, 0.12);
      color: #94a3b8;

      :root.dark & {
        background: rgba(100, 116, 139, 0.2);
        color: #64748b;
      }
    }
  }
}

.resource-section {
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  width: 100%;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  :root.dark & {
    border-color: rgba(71, 85, 105, 0.5);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}

.resource-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);

  :root.dark & {
    background: linear-gradient(
      135deg,
      rgba(51, 65, 85, 0.6) 0%,
      rgba(30, 41, 59, 0.8) 100%
    );
    border-color: rgba(71, 85, 105, 0.5);
  }

  .resource-icon {
    font-size: 22px;
    color: #6366f1;

    :root.dark & {
      color: #818cf8;
    }
  }

  .resource-name {
    font-size: 1.0625rem;
    font-weight: 600;
    text-transform: capitalize;
    color: #1e293b;

    :root.dark & {
      color: #f1f5f9;
    }
  }
}

.matrix-container {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 800px;

  th,
  td {
    padding: 16px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    text-align: center;

    :root.dark & {
      border-color: rgba(71, 85, 105, 0.4);
    }
  }

  th {
    background: #f8fafc;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 1;
    border-bottom: 2px solid rgba(203, 213, 225, 0.8);

    :root.dark & {
      background: rgba(51, 65, 85, 0.6);
      border-color: rgba(71, 85, 105, 0.6);
    }
  }

  tbody tr {
    &:hover {
      background: rgba(59, 130, 246, 0.03);

      :root.dark & {
        background: rgba(59, 130, 246, 0.08);
      }
    }

    td {
      padding-top: 20px;
      padding-bottom: 20px;
    }
  }
}

.permission-header {
  text-align: left !important;
  width: 280px;
  min-width: 280px;
  position: sticky;
  left: 0;
  background: #f8fafc !important;
  z-index: 2;
  font-size: 0.8125rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  :root.dark & {
    background: rgba(51, 65, 85, 0.6) !important;
    color: #94a3b8;
  }
}

.role-header {
  width: 140px;
  min-width: 140px;
  max-width: 140px;
  border-left: 1px solid rgba(226, 232, 240, 0.8);

  :root.dark & {
    border-color: rgba(71, 85, 105, 0.4);
  }

  &.system {
    background: rgba(59, 130, 246, 0.06) !important;

    :root.dark & {
      background: rgba(59, 130, 246, 0.12) !important;
    }
  }
}

.role-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  .role-name {
    font-size: 12px;
    word-break: break-word;
    white-space: normal;
    line-height: 1.3;
  }

  .role-count {
    font-size: 10px;
    color: var(--text-color-3);
  }
}

.permission-cell {
  text-align: left !important;
  position: sticky;
  left: 0;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.08) 0%,
    rgba(99, 102, 241, 0.04) 100%
  ) !important;
  z-index: 1;
  border-right: 2px solid rgba(59, 130, 246, 0.2) !important;
  padding: 16px !important;
  vertical-align: top !important;

  :root.dark & {
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.15) 0%,
      rgba(99, 102, 241, 0.08) 100%
    ) !important;
    border-color: rgba(59, 130, 246, 0.3) !important;
  }

  .permission-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .permission-name {
    font-weight: 500;
    font-size: 14px;
    color: #1e293b;
    line-height: 1.4;

    :root.dark & {
      color: #f1f5f9;
    }
  }

  .permission-count {
    font-size: 12px;
    color: #64748b;
    display: block;

    :root.dark & {
      color: #94a3b8;
    }
  }
}

.check-cell {
  // Center icons vertically and horizontally in the cell
  vertical-align: middle;
  text-align: center;
  width: 140px;
  min-width: 140px;
  max-width: 140px;
  height: 56px; // Fixed height for consistent centering
  border-left: 1px solid rgba(226, 232, 240, 0.8);
  background: #ffffff;
  transition: background 0.15s ease;

  :root.dark & {
    border-color: rgba(71, 85, 105, 0.3);
    background: rgba(30, 41, 59, 0.4);
  }

  &.system {
    background: rgba(59, 130, 246, 0.04);

    :root.dark & {
      background: rgba(59, 130, 246, 0.08);
    }
  }

  &.granted {
    background: rgba(16, 185, 129, 0.1);

    :root.dark & {
      background: rgba(16, 185, 129, 0.15);
    }

    &.system {
      background: linear-gradient(
        135deg,
        rgba(16, 185, 129, 0.1) 0%,
        rgba(59, 130, 246, 0.05) 100%
      );

      :root.dark & {
        background: linear-gradient(
          135deg,
          rgba(16, 185, 129, 0.15) 0%,
          rgba(59, 130, 246, 0.08) 100%
        );
      }
    }
  }
}

.check-icon {
  font-size: 20px;
  display: inline-block;
  vertical-align: middle;
  line-height: 1;

  &.granted {
    color: #10b981;

    :root.dark & {
      color: #34d399;
    }
  }

  &.denied {
    color: #cbd5e1;

    :root.dark & {
      color: #475569;
    }
  }
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
</style>
