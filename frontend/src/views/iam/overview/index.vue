<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useMessage } from "naive-ui";
import { StatPanel, RegistryGraphPanel } from "@/components/charts";
import { useStatPanelsFromRegistry } from "@/composables/useStatPanelsFromRegistry";
import { useAppStore } from "@/store";
import { rolesApi } from "@/api/roles";
import { permissionsApi } from "@/api/permissions";
import { usersApi } from "@/api/users";
import { auditApi } from "@/api/audit";
import type { Role, Permission } from "@/types";
import type { ChartSeries } from "@/types/dashboard";
import PermissionsModal from "../users/components/PermissionsModal.vue";

const router = useRouter();
const message = useMessage();
const appStore = useAppStore();

const chartsCollapsed = ref(false);
const isLoading = ref(true);

// ── IAM chart series (fetched from /api/v2/audit/graph, org-scoped) ──────────
const chartLoading = ref(false);
const registrationsSeries = ref<ChartSeries[]>([]);
const activeUsersSeries = ref<ChartSeries[]>([]);
const loginActivitySeries = ref<ChartSeries[]>([]);
const regionsSeries = ref<ChartSeries[]>([]);

// IAM10003 always shows the last 30 days regardless of global time range
const REGIONS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

async function loadChartData() {
  chartLoading.value = true;
  const { start, end } = appStore.globalTimeRange;
  const regionsEnd = Date.now();
  const regionsStart = regionsEnd - REGIONS_WINDOW_MS;
  try {
    const [reg, active, login, regions] = await Promise.all([
      auditApi.getGraph("registrations", { from: start, to: end }),
      auditApi.getGraph("active_users", { from: start, to: end }),
      auditApi.getGraph("login_activity", { from: start, to: end }),
      auditApi.getGraph("registrations_by_region", { from: regionsStart, to: regionsEnd }),
    ]);
    registrationsSeries.value = reg.series as ChartSeries[];
    activeUsersSeries.value = active.series as ChartSeries[];
    loginActivitySeries.value = login.series as ChartSeries[];
    regionsSeries.value = regions.series as ChartSeries[];
  } catch (err) {
    console.error("[IAM] Failed to load chart data:", err);
  } finally {
    chartLoading.value = false;
  }
}
const roles = ref<Role[]>([]);
const permissions = ref<Permission[]>([]);
const totalUsers = ref(0);

// Permissions Modal
const showPermissionsModal = ref(false);
const selectedRole = ref<Role | null>(null);
const rolePermissions = ref<Permission[]>([]);
const isLoadingPermissions = ref(false);
const roleUsers = ref(0);

// Role hierarchy tiers based on RBAC documentation
const roleTiers = [
  {
    tier: 1,
    name: "Super Administrator",
    icon: "carbon:star-filled",
    color: "#f59e0b",
    scope: "Global (all organizations, regions, workspaces, tenants)",
    coverage: "100%",
    permissions: "94",
    description:
      "Platform-level operations, infrastructure, and system maintenance",
  },
  {
    tier: 2,
    name: "Administrator",
    icon: "carbon:user-admin",
    color: "#8b5cf6",
    scope: "Organization-scoped (single org, multiple regions)",
    coverage: "87%",
    permissions: "82",
    description:
      "Organization management, user administration, most operations",
  },
  {
    tier: 3,
    name: "Developer",
    icon: "carbon:code",
    color: "#3b82f6",
    scope: "Organization-scoped (single org)",
    coverage: "51%",
    permissions: "48",
    description:
      "Resource creation/updates, no deletions, no user role management",
  },
  {
    tier: 4,
    name: "Viewer",
    icon: "carbon:magnify",
    color: "#10b981",
    scope: "Organization-scoped",
    coverage: "33%",
    permissions: "31",
    description: "Read-only access across all resources",
  },
  {
    tier: 5,
    name: "Demo",
    icon: "carbon:demo",
    color: "#6b7280",
    scope: "Demo organization only (org-demo, ws-demo, tn-demo)",
    coverage: "20%",
    permissions: "19",
    description: "Auto-cleanup every 6 hours, isolated from production",
  },
];

// Permission resource categories (aligned with sidebar navigation groups)
const resourceCategories = [
  { name: "Telemetry", icon: "carbon:chart-line", resources: ["telemetry"] },
  { name: "Dashboard", icon: "carbon:dashboard", resources: ["dashboard"] },
  {
    name: "Monitoring",
    icon: "carbon:activity",
    resources: [
      "monitoring:agent",
      "monitoring:vm",
      "monitoring:kubernetes",
      "monitoring:uptime",
      "monitoring:status-page",
      "monitoring:service-map",
      "monitoring:network-map",
    ],
  },
  { name: "Alert", icon: "carbon:warning-alt", resources: ["alert"] },
  { name: "Reports", icon: "carbon:report", resources: ["reports"] },
  {
    name: "IAM",
    icon: "carbon:user-admin",
    resources: ["users", "roles", "permissions"],
  },
  {
    name: "Tenancy",
    icon: "carbon:cloud-services",
    resources: ["organizations", "workspaces", "tenants", "groups"],
  },
  { name: "Regions", icon: "carbon:location", resources: ["regions"] },
  {
    name: "System",
    icon: "carbon:settings-adjust",
    resources: [
      "notifications",
      "api-keys",
      "retention",
      "subscription",
      "ai-assistant",
      "llm",
    ],
  },
  { name: "Platform", icon: "carbon:cloud", resources: ["platform"] },
  { name: "Audit", icon: "carbon:document-tasks", resources: ["audit"] },
];

// Statistics
const stats = computed(() => ({
  totalRoles: roles.value.length,
  systemRoles: roles.value.filter((r) => r.isSystem).length,
  customRoles: roles.value.filter((r) => !r.isSystem).length,
  totalPermissions: permissions.value.length,
  totalUsers: totalUsers.value,
  resourceCount: new Set(permissions.value.map((p) => p.resource)).size,
}));

// Stat panels from registry (IAM20001-IAM20005)
const totalUsersCount = computed(() => totalUsers.value);
const activeUsersCount = computed(() => totalUsers.value); // Active ≈ total (no inactive tracking yet)
const rolesCount = computed(() => roles.value.length);
const assignmentsCount = computed(() => totalUsers.value); // Assignments ≈ users with roles
const registrationsTodayCount = computed(() => 0); // Populated from analytics endpoint

const statCards = useStatPanelsFromRegistry(
  ["IAM20001", "IAM20002", "IAM20003", "IAM20004", "IAM20005"],
  {
    IAM20001: totalUsersCount,
    IAM20002: activeUsersCount,
    IAM20003: rolesCount,
    IAM20004: assignmentsCount,
    IAM20005: registrationsTodayCount,
  },
);

// Permissions by resource
const permissionsByResource = computed(() => {
  const groups: Record<string, Permission[]> = {};
  permissions.value.forEach((p) => {
    const resource = p.resource || "other";
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(p);
  });
  return groups;
});

async function loadData() {
  isLoading.value = true;
  try {
    const [rolesData, permissionsData, usersData] = await Promise.all([
      rolesApi.list({ includeSystem: true }),
      permissionsApi.list({ limit: 200 }),
      usersApi.list({ limit: 1 }),
    ]);
    roles.value = rolesData.data || [];
    permissions.value = permissionsData.data || [];
    totalUsers.value = usersData.total || 0;
  } catch (error) {
    console.error("Failed to load RBAC data:", error);
    message.error("Failed to load RBAC data");
  } finally {
    isLoading.value = false;
  }
}

function navigateTo(route: string) {
  router.push(route);
}

// Normalize role name to snake_case key for lookups
// Backend seed uses display names ("Super Administrator") so we map both formats
function normalizeRoleName(roleName: string): string {
  const displayMap: Record<string, string> = {
    "Super Administrator": "super_admin",
    Administrator: "admin",
    Developer: "developer",
    Viewer: "viewer",
    Demo: "demo",
  };
  return displayMap[roleName] || roleName;
}

// Get role tier info
function getRoleTier(roleName: string) {
  const tierMap: Record<string, { icon: string; color: string }> = {
    super_admin: { icon: "carbon:star-filled", color: "#f59e0b" },
    admin: { icon: "carbon:user-admin", color: "#8b5cf6" },
    developer: { icon: "carbon:code", color: "#3b82f6" },
    viewer: { icon: "carbon:magnify", color: "#10b981" },
    demo: { icon: "carbon:demo", color: "#6b7280" },
  };
  return (
    tierMap[normalizeRoleName(roleName)] || {
      icon: "carbon:user-role",
      color: "#3b82f6",
    }
  );
}

// Get role background gradient
function getRoleBackground(roleName: string) {
  const bgMap: Record<string, string> = {
    super_admin: "linear-gradient(135deg, #f59e0b, #f97316)",
    admin: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
    developer: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    viewer: "linear-gradient(135deg, #10b981, #34d399)",
    demo: "linear-gradient(135deg, #6b7280, #9ca3af)",
  };
  return bgMap[normalizeRoleName(roleName)] || "";
}

// Check if role is super admin (handles both naming formats)
function isSuperAdmin(roleName: string): boolean {
  return normalizeRoleName(roleName) === "super_admin";
}

// Open permissions modal
async function showRolePermissions(role: Role) {
  selectedRole.value = role;
  showPermissionsModal.value = true;
  isLoadingPermissions.value = true;

  try {
    const [permsData, usersData] = await Promise.all([
      permissionsApi.list({ limit: 200 }),
      usersApi.list({ limit: 1 }),
    ]);

    rolePermissions.value = role.permissions || [];
    roleUsers.value = usersData.total || 0;
  } catch (error) {
    console.error("Failed to load role permissions:", error);
    message.error("Failed to load role permissions");
  } finally {
    isLoadingPermissions.value = false;
  }
}

onMounted(() => {
  loadData();
  loadChartData();
});

// Refresh charts when global time range changes
watch(() => appStore.globalTimeRange, () => {
  loadChartData();
}, { deep: true });
</script>

<template>
  <div class="rbac-overview-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">RBAC Management</h2>
        <p class="page-subtitle">
          Role-Based Access Control System - Manage roles, permissions, and user
          access
        </p>
      </div>
    </div>

    <n-spin :show="isLoading">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <StatPanel
          v-for="stat in statCards"
          :key="stat.title"
          v-bind="stat"
          size="small"
        />
      </div>

      <!-- Role Hierarchy -->
      <n-card title="Role Hierarchy (5-Tier System)" class="hierarchy-card">
        <template #header-extra>
          <n-button
            type="primary"
            ghost
            size="small"
            @click="navigateTo('/iam/roles')"
          >
            <template #icon>
              <Icon icon="carbon:arrow-right" />
            </template>
            Manage Roles
          </n-button>
        </template>

        <div class="hierarchy-timeline">
          <div v-for="tier in roleTiers" :key="tier.tier" class="tier-item">
            <div class="tier-marker" :style="{ backgroundColor: tier.color }">
              <Icon :icon="tier.icon" />
            </div>
            <div class="tier-content">
              <div class="tier-header">
                <span
                  class="tier-badge"
                  :style="{ backgroundColor: tier.color }"
                >Tier {{ tier.tier }}</span>
                <span class="tier-name">{{ tier.name }}</span>
                <n-tag size="small" type="info" :bordered="false">
                  {{ tier.permissions }} permissions
                </n-tag>
                <n-tag size="small" type="success" :bordered="false">
                  {{ tier.coverage }} coverage
                </n-tag>
              </div>
              <div class="tier-scope">
                <Icon icon="carbon:location" />
                {{ tier.scope }}
              </div>
              <div class="tier-description">{{ tier.description }}</div>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Quick Actions & Resources -->
      <div class="content-grid">
        <!-- Quick Actions -->
        <n-card title="Quick Actions" class="actions-card">
          <div class="quick-actions">
            <n-button block @click="navigateTo('/iam/roles')">
              <template #icon>
                <Icon icon="carbon:add" />
              </template>
              Create New Role
            </n-button>
            <n-button block @click="navigateTo('/iam/permissions')">
              <template #icon>
                <Icon icon="carbon:add" />
              </template>
              Create New Permission
            </n-button>
            <n-button block @click="navigateTo('/iam/assignments')">
              <template #icon>
                <Icon icon="carbon:user-role" />
              </template>
              Assign Roles to Users
            </n-button>
            <n-button block @click="navigateTo('/iam/matrix')">
              <template #icon>
                <Icon icon="carbon:magnify" />
              </template>
              View Permission Matrix
            </n-button>
          </div>
        </n-card>

        <!-- Resource Categories -->
        <n-card title="Permission Resources" class="resources-card">
          <template #header-extra>
            <n-button
              type="primary"
              ghost
              size="small"
              @click="navigateTo('/iam/permissions')"
            >
              <template #icon>
                <Icon icon="carbon:arrow-right" />
              </template>
              View All
            </n-button>
          </template>

          <div class="resources-grid">
            <div
              v-for="category in resourceCategories"
              :key="category.name"
              class="resource-item"
            >
              <div class="resource-icon">
                <Icon :icon="category.icon" />
              </div>
              <div class="resource-info">
                <div class="resource-name">{{ category.name }}</div>
                <div class="resource-count">
                  {{
                    category.resources.reduce(
                      (acc, r) => acc + (permissionsByResource[r]?.length || 0),
                      0,
                    )
                  }}
                  permissions
                </div>
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Current Roles Overview -->
      <n-card title="Active Roles" class="roles-overview-card">
        <template #header-extra>
          <n-button
            type="primary"
            ghost
            size="small"
            @click="navigateTo('/iam/roles')"
          >
            <template #icon>
              <Icon icon="carbon:arrow-right" />
            </template>
            Manage
          </n-button>
        </template>

        <div class="roles-grid">
          <div
            v-for="role in roles.slice(0, 8)"
            :key="role.id"
            class="role-card"
            :class="{ 'is-superadmin': isSuperAdmin(role.name) }"
            :style="{ background: getRoleBackground(role.name) || undefined }"
            @click="showRolePermissions(role)"
          >
            <!-- Superadmin Badge -->
            <div v-if="isSuperAdmin(role.name)" class="superadmin-badge">
              <Icon icon="carbon:star-filled" />
              <span>SUPERADMIN</span>
            </div>

            <div v-if="!isSuperAdmin(role.name)" class="role-header">
              <Icon
                :icon="getRoleTier(role.name).icon"
                class="role-icon"
                :style="{
                  color: getRoleBackground(role.name) ? 'white' : undefined,
                }"
              />
              <n-tag v-if="role.isSystem" size="small" type="info">
                System
              </n-tag>
            </div>

            <div
              class="role-name"
              :style="{
                color: getRoleBackground(role.name) ? 'white' : undefined,
              }"
            >
              {{ role.name }}
            </div>
            <div
              class="role-description"
              :style="{
                color: getRoleBackground(role.name)
                  ? 'rgba(255, 255, 255, 0.9)'
                  : undefined,
              }"
            >
              {{ role.description || "No description" }}
            </div>
          </div>
        </div>
      </n-card>
    </n-spin>

    <!-- Registration Analytics Charts (outside n-spin — loads its own data) -->
    <div class="section">
      <div class="section-header" @click="chartsCollapsed = !chartsCollapsed">
        <div class="section-title">
          <Icon icon="carbon:chart-line" class="section-icon" />
          <Icon
            :icon="
              chartsCollapsed ? 'carbon:chevron-right' : 'carbon:chevron-down'
            "
            class="chevron-icon"
          />
          <span>Registration & Activity Analytics</span>
        </div>
        <span class="section-badge badge-primary">4 graphs</span>
      </div>

      <div v-show="!chartsCollapsed" class="section-content">
        <div class="charts-grid-2">
          <RegistryGraphPanel
            graph-id="IAM10001"
            variant="panel"
            editable
            show-toggle
            show-zoom
            height="280px"
            default-chart-type="area"
            :query-collapsed="true"
            :override-series="registrationsSeries"
            :override-loading="chartLoading"
          />
          <RegistryGraphPanel
            graph-id="IAM10004"
            variant="panel"
            editable
            show-toggle
            show-zoom
            height="280px"
            :query-collapsed="true"
            :override-series="loginActivitySeries"
            :override-loading="chartLoading"
          />
          <RegistryGraphPanel
            graph-id="IAM10002"
            variant="panel"
            editable
            show-toggle
            show-zoom
            height="280px"
            :query-collapsed="true"
            :override-series="activeUsersSeries"
            :override-loading="chartLoading"
          />
          <RegistryGraphPanel
            graph-id="IAM10003"
            variant="panel"
            editable
            show-toggle
            show-zoom
            height="280px"
            :query-collapsed="true"
            :override-series="regionsSeries"
            :override-loading="chartLoading"
            override-time-badge="30d"
          />
        </div>
      </div>
    </div>

    <!-- Permissions Modal Component -->
    <PermissionsModal
      v-model:show="showPermissionsModal"
      :role="selectedRole"
      :permissions="rolePermissions"
      :all-permissions="permissions"
      :is-loading="isLoadingPermissions"
      :role-users="roleUsers"
    />
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/section-styles.scss" as *;

.rbac-overview-page {
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

// Stats Grid
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

// Charts section uses shared section-styles.scss (same as Infra)
// .section, .section-header, .section-title, .section-icon, .chevron-icon,
// .section-badge, .section-content are provided by the @use import above

.stat-card {
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;

  &.roles {
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
  }

  &.permissions {
    background: linear-gradient(135deg, #f59e0b, #f97316);
  }

  &.users {
    background: linear-gradient(135deg, #10b981, #14b8a6);
  }

  &.matrix {
    background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  }
}

.stat-info {
  flex: 1;

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
  }

  .stat-label {
    font-weight: 500;
    margin-top: 4px;
  }

  .stat-sub {
    font-size: 12px;
    color: var(--text-color-3);
    margin-top: 2px;
  }
}

// Hierarchy
.hierarchy-card {
  margin-bottom: 24px;

  :deep(.n-card__content) {
    padding-left: 0;
    padding-right: 0;
  }
}

.hierarchy-timeline {
  position: relative;
  padding-left: 60px;
  margin-left: 24px;
  margin-right: 24px;

  &::before {
    content: "";
    position: absolute;
    left: 20px;
    top: 20px;
    bottom: 20px;
    width: 2px;
    background: var(--border-color);
  }
}

.tier-item {
  position: relative;
  padding: 20px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 4px;

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    padding-bottom: 0;
    margin-bottom: 0;
  }

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;
    height: 0;
    border-bottom: 2px dashed rgba(100, 116, 139, 0.25);
    pointer-events: none;

    :root.dark & {
      border-bottom-color: rgba(148, 163, 184, 0.15);
    }
  }

  &:last-child::after {
    display: none;
  }
}

.tier-marker {
  position: absolute;
  left: -60px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  z-index: 1;
  flex-shrink: 0;
}

.tier-content {
  flex: 1;
  padding: 12px 16px;
  background: var(--card-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.tier-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.tier-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.tier-name {
  font-weight: 700;
  font-size: 1.125rem;
}

.tier-scope {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color-2);
  margin-bottom: 6px;
}

.tier-description {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--text-color-3);
  line-height: 1.5;
}

// Content Grid
.content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  margin-bottom: 24px;
}

// Quick Actions
.actions-card {
  :deep(.n-card) {
    background: var(--card-color) !important;
  }
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;

  :deep(.n-button) {
    border: 2px solid var(--border-color) !important;
    border-radius: 8px !important;
    padding: 12px 16px !important;
    height: auto !important;
    transition: all 0.2s ease !important;
    background: var(--n-color) !important;

    :root:not(.dark) & {
      background: #ffffff !important;
      border-color: #e2e8f0 !important;
      color: #1e293b !important;
    }

    :root.dark & {
      background: rgba(255, 255, 255, 0.1) !important;
      border-color: rgba(255, 255, 255, 0.15) !important;
      color: #e2e8f0 !important;
    }

    &:hover {
      border-color: var(--primary-color) !important;
      transform: translateX(4px) !important;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;

      :root:not(.dark) & {
        background: #f8fafc !important;
      }

      :root.dark & {
        background: rgba(255, 255, 255, 0.15) !important;
      }
    }
  }
}

// Resources Grid
.resources-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--n-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 72px;

  :root:not(.dark) & {
    background: #f8fafc !important;
    border-color: #e2e8f0 !important;
  }

  :root.dark & {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }

  &:hover {
    border-color: var(--primary-color) !important;
    transform: translateY(-4px) !important;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;

    :root:not(.dark) & {
      background: #f1f5f9 !important;
    }

    :root.dark & {
      background: rgba(255, 255, 255, 0.12) !important;
    }
  }
}

.resource-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.1),
    rgba(59, 130, 246, 0.05)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  font-size: 22px;
  flex-shrink: 0;

  :root:not(.dark) & {
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.15),
      rgba(59, 130, 246, 0.08)
    ) !important;
    color: #3b82f6 !important;
  }

  :root.dark & {
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.25),
      rgba(59, 130, 246, 0.15)
    ) !important;
    color: #60a5fa !important;
  }
}

.resource-info {
  flex: 1;
  min-width: 0;

  .resource-name {
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 2px;

    :root:not(.dark) & {
      color: #1e293b !important;
    }

    :root.dark & {
      color: #e2e8f0 !important;
    }
  }

  .resource-count {
    font-size: 0.75rem;

    :root:not(.dark) & {
      color: #64748b !important;
    }

    :root.dark & {
      color: #94a3b8 !important;
    }
  }
}

// Roles Overview
.roles-overview-card {
  margin-bottom: 24px;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.role-card {
  padding: 18px;
  background: var(--n-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  position: relative;

  &:hover {
    transform: translateY(-4px) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
    filter: brightness(1.1) !important;
  }
}

.superadmin-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);

  :deep(svg) {
    font-size: 14px;
  }
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .role-icon {
    font-size: 22px;
    color: var(--primary-color);
    transition: color 0.2s ease;
  }

  // Override System tag on gradient cards to frosted-glass style
  :deep(.n-tag) {
    background: rgba(255, 255, 255, 0.2) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    color: white !important;
    backdrop-filter: blur(10px);

    .n-tag__content {
      color: white !important;
    }
  }
}

.role-name {
  font-weight: 700;
  font-size: 0.9375rem;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--n-text-color);
  transition: color 0.2s ease;
}

.role-description {
  font-size: 0.8125rem;
  color: var(--text-color-3);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  flex: 1;
  transition: color 0.2s ease;
}

// Responsive
@media (max-width: 1400px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .hierarchy-timeline {
    padding-left: 50px;

    &::before {
      left: 24px;
    }
  }

  .tier-marker {
    left: -50px;
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}
</style>
