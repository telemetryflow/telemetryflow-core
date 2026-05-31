<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { usersApi } from "@/api/users";
import { rolesApi } from "@/api/roles";
import { organizationsApi } from "@/api/organizations";
import { tenantsApi } from "@/api/tenants";
import { auditApi } from "@/api/audit";
import { useAuthStore } from "@/store";
import { formatDateTime } from "@/utils/format";
import type { User, Role, Permission, Organization, Tenant, AuditLog } from "@/types";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const user = ref<User | null>(null);
const userRoles = ref<Role[]>([]);
const allRoles = ref<Role[]>([]);
const userPermissions = ref<Permission[]>([]);
const organizations = ref<Organization[]>([]);
const tenantsList = ref<Tenant[]>([]);
const recentAuditLogs = ref<AuditLog[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);

const userId = computed(() => route.params.id as string);
const canEdit = computed(() => authStore.hasPermission("users:write"));
const isSelf = computed(() => authStore.currentUser?.id === userId.value);
const isSuperAdmin = computed(() => authStore.hasRole("super_administrator"));
const viewedUserIsSuperAdmin = computed(() =>
  userRoles.value.some((r) => r.name === "Super Administrator"),
);

// Cannot manage roles of a superadmin unless you are also superadmin; cannot manage own roles
const canManageRoles = computed(() => {
  if (!canEdit.value || isSelf.value) return false;
  if (viewedUserIsSuperAdmin.value && !isSuperAdmin.value) return false;
  return true;
});

const formData = ref({
  firstName: "",
  lastName: "",
  timezone: "UTC",
  locale: "en-US",
});

async function loadUser() {
  isLoading.value = true;
  try {
    const [userResult, rolesData, allRolesData, orgsData, tenantsData] =
      await Promise.allSettled([
        usersApi.get(userId.value),
        usersApi.getRoles(userId.value),
        rolesApi.list({ includeSystem: true } as any),
        organizationsApi.list({ limit: 200 }),
        tenantsApi.list({ limit: 200 }),
      ]);

    if (userResult.status === "fulfilled") {
      user.value = userResult.value;
    }
    userRoles.value = rolesData.status === "fulfilled" ? (rolesData.value.data || []) : [];
    allRoles.value = allRolesData.status === "fulfilled" ? (allRolesData.value.data || []) : [];
    organizations.value = orgsData.status === "fulfilled" ? (orgsData.value.data || []) : [];
    tenantsList.value = tenantsData.status === "fulfilled" ? (tenantsData.value.data || []) : [];

    // Fetch recent audit logs for this user
    try {
      const auditResult = await auditApi.listAuditLogs({
        userId: userId.value,
        limit: 20,
        sortBy: "timestamp",
        sortOrder: "desc",
      });
      recentAuditLogs.value = auditResult.data || [];
    } catch {
      recentAuditLogs.value = [];
    }

    // Fetch permissions from each assigned role and merge
    const mergedPerms: Permission[] = [];
    const seenIds = new Set<string>();
    for (const role of userRoles.value) {
      try {
        const rolePermsData = await rolesApi.getPermissions(role.id);
        const perms = rolePermsData.data || [];
        for (const p of perms) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            mergedPerms.push(p);
          }
        }
      } catch {
        // Fallback: try embedded permissions on role object
        const embedded = (role as any).permissions ?? [];
        for (const p of embedded) {
          if (p.id && !seenIds.has(p.id)) {
            seenIds.add(p.id);
            mergedPerms.push(p);
          }
        }
      }
    }
    userPermissions.value = mergedPerms;

    if (user.value) {
      formData.value = {
        firstName: user.value.firstName || "",
        lastName: user.value.lastName || "",
        timezone: user.value.timezone || "UTC",
        locale: user.value.locale || "en-US",
      };
    }
  } catch (error) {
    console.error("Failed to load user:", error);
  } finally {
    isLoading.value = false;
  }
}

async function saveUser() {
  if (!canEdit.value) return;

  isSaving.value = true;
  try {
    await usersApi.update(userId.value, formData.value);
    await loadUser();
  } catch (error) {
    console.error("Failed to save user:", error);
  } finally {
    isSaving.value = false;
  }
}

// Normalize permission — parse resource/action from name if missing (e.g. "users:read")
function normalizePermission(p: any): Permission {
  if (p.resource && p.action) return p;
  const parts = (p.name || "").split(":");
  return {
    ...p,
    resource: p.resource || parts[0] || "other",
    action: p.action || parts[1] || "manage",
  };
}

// Group merged permissions by resource
const permissionsByResource = computed(() => {
  const groups: Record<string, Permission[]> = {};
  userPermissions.value.forEach((raw) => {
    const p = normalizePermission(raw);
    const resource = p.resource || "other";
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(p);
  });
  return groups;
});

// Derive last activity from audit logs if user entity fields are stale
const lastActivity = computed(() => {
  if (user.value?.lastLoginAt) return formatDateTime(user.value.lastLoginAt);
  if (recentAuditLogs.value.length > 0) {
    const ts = recentAuditLogs.value[0].timestamp;
    return formatDateTime(typeof ts === "number" ? new Date(ts).toISOString() : ts);
  }
  return null;
});

const activityCount = computed(() => {
  if (user.value?.loginCount) return user.value.loginCount;
  return recentAuditLogs.value.length;
});

function getActionColor(action?: string): string {
  if (!action) return "#6b7280";
  switch (action.toLowerCase()) {
    case "create":
      return "#f59e0b";
    case "read":
      return "#10b981";
    case "update":
      return "#3b82f6";
    case "delete":
      return "#ef4444";
    case "manage":
      return "#8b5cf6";
    default:
      return "#6b7280";
  }
}

async function assignRole(roleId: string) {
  try {
    await usersApi.assignRole(userId.value, roleId);
    await loadUser();
  } catch (error) {
    console.error("Failed to assign role:", error);
  }
}

async function revokeRole(roleId: string) {
  try {
    await usersApi.revokeRole(userId.value, roleId);
    await loadUser();
  } catch (error) {
    console.error("Failed to revoke role:", error);
  }
}

function getOrgName(id?: string) {
  return id ? (organizations.value.find((o) => o.id === id)?.name ?? "—") : "—";
}

function getTenantName(id?: string) {
  return id ? (tenantsList.value.find((t) => t.id === id)?.name ?? "—") : "—";
}

function formatAuditTime(ts: number | string): string {
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function getResultColor(result: string): string {
  return result === "SUCCESS" ? "#10b981" : "#ef4444";
}

function goBack() {
  router.push({ name: "IAMUsers" });
}

onMounted(() => {
  loadUser();
});
</script>

<template>
  <div class="user-detail-page">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <n-button quaternary size="small" @click="goBack">
            <template #icon>
              <Icon icon="carbon:arrow-left" />
            </template>
          </n-button>
          <Icon icon="carbon:user-profile" class="page-title-icon" />
          <h1 class="page-title">User Details</h1>
        </div>
        <p class="page-subtitle">View and manage user information</p>
      </div>
      <n-button
        v-if="user && canEdit"
        type="primary"
        :loading="isSaving"
        @click="saveUser"
      >
        <template #icon>
          <Icon icon="carbon:save" />
        </template>
        Save Changes
      </n-button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" style="display: flex; justify-content: center; padding: 80px 0;">
      <n-spin size="large" />
    </div>

    <!-- Content -->
    <div v-if="user" class="content-layout">
      <!-- User Profile Card -->
      <div class="profile-section">
        <div class="profile-card">
          <div class="profile-header">
            <div class="user-avatar-large">
              {{
                user.firstName?.charAt(0) ||
                  user.email?.charAt(0)?.toUpperCase() || "?"
              }}
            </div>
            <div class="profile-info">
              <div class="profile-name">
                <h2>{{ user.firstName }} {{ user.lastName }}</h2>
                <n-tag
                  v-if="
                    user.email === 'superadmin.telemetryflow@telemetryflow.id'
                  "
                  type="warning"
                  size="small"
                  :bordered="false"
                  class="superadmin-badge"
                >
                  <Icon icon="carbon:star-filled" :width="11" :height="11" />
                  SUPERADMIN
                </n-tag>
              </div>
              <n-tag
                size="medium"
                :bordered="false"
                style="
                    font-size: 12px;
                    padding: 4px 10px;
                    background: rgba(99, 102, 241, 0.1);
                    color: var(--n-text-color-2);
                    font-family: monospace;
                    margin-bottom: 8px;
                  "
              >
                {{ user.email }}
              </n-tag>
              <div class="profile-badges">
                <n-tag
                  :type="user.isActive ? 'success' : 'error'"
                  size="small"
                >
                  {{ user.isActive ? "Active" : "Inactive" }}
                </n-tag>
                <n-tag v-if="user.emailVerified" type="success" size="small">
                  <template #icon>
                    <Icon icon="carbon:checkmark-filled" />
                  </template>
                  Verified
                </n-tag>
                <n-tag v-if="user.mfaEnabled" type="info" size="small">
                  <template #icon>
                    <Icon icon="carbon:security" />
                  </template>
                  MFA Enabled
                </n-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content - Row 1 -->
      <div class="content-row-1">
        <!-- User Information -->
        <div class="section">
          <div class="section-header">
            <div class="section-title">
              <Icon icon="carbon:user" class="section-icon" />
              <span>User Information</span>
            </div>
          </div>
          <div class="section-content">
            <n-form
              :disabled="!canEdit || isSaving"
              label-placement="left"
              label-width="120"
            >
              <n-form-item label="First Name">
                <n-input
                  v-model:value="formData.firstName"
                  placeholder="First name"
                />
              </n-form-item>
              <n-form-item label="Last Name">
                <n-input
                  v-model:value="formData.lastName"
                  placeholder="Last name"
                />
              </n-form-item>
              <n-form-item label="Username">
                <n-input :value="user.username" disabled />
              </n-form-item>
              <n-form-item label="Email">
                <n-input :value="user.email" disabled />
              </n-form-item>
              <n-form-item label="Timezone">
                <n-select
                  v-model:value="formData.timezone"
                  :options="[
                    { label: 'UTC', value: 'UTC' },
                    { label: 'America/New_York', value: 'America/New_York' },
                    { label: 'Europe/London', value: 'Europe/London' },
                    { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
                    { label: 'Asia/Jakarta', value: 'Asia/Jakarta' },
                  ]"
                />
              </n-form-item>
              <n-form-item label="Locale">
                <n-select
                  v-model:value="formData.locale"
                  :options="[
                    { label: 'English (US)', value: 'en-US' },
                    { label: 'English (UK)', value: 'en-GB' },
                    { label: 'Indonesian', value: 'id-ID' },
                    { label: 'Japanese', value: 'ja-JP' },
                  ]"
                />
              </n-form-item>
            </n-form>
          </div>
        </div>

        <!-- Activity & Security -->
        <div class="section">
          <div class="section-header">
            <div class="section-title">
              <Icon icon="carbon:activity" class="section-icon" />
              <span>Activity & Security</span>
            </div>
          </div>
          <div class="section-content table-content activity-scroll">
            <table class="info-table">
              <tbody>
                <!-- Account Info -->
                <tr>
                  <td class="info-label"><Icon icon="carbon:login" class="label-icon" /> Last Activity</td>
                  <td class="info-value">
                    <code v-if="lastActivity">{{ lastActivity }}</code>
                    <span v-else class="text-muted">Never</span>
                  </td>
                </tr>
                <tr>
                  <td class="info-label"><Icon icon="carbon:chart-line" class="label-icon" /> Activity Count</td>
                  <td class="info-value"><code>{{ activityCount }}</code></td>
                </tr>
                <tr>
                  <td class="info-label"><Icon icon="carbon:security" class="label-icon" /> MFA</td>
                  <td class="info-value">
                    <n-tag :bordered="false" size="small" :type="user.mfaEnabled ? 'success' : 'warning'">
                      {{ user.mfaEnabled ? 'Enabled' : 'Disabled' }}
                    </n-tag>
                  </td>
                </tr>
                <tr>
                  <td class="info-label"><Icon icon="carbon:email" class="label-icon" /> Email Status</td>
                  <td class="info-value">
                    <n-tag :bordered="false" size="small" :type="user.emailVerified ? 'success' : 'warning'">
                      {{ user.emailVerified ? 'Verified' : 'Not Verified' }}
                    </n-tag>
                  </td>
                </tr>
                <tr>
                  <td class="info-label"><Icon icon="carbon:calendar" class="label-icon" /> Created</td>
                  <td class="info-value"><code>{{ formatDateTime(user.createdAt) }}</code></td>
                </tr>
                <tr>
                  <td class="info-label"><Icon icon="carbon:update-now" class="label-icon" /> Updated</td>
                  <td class="info-value"><code>{{ formatDateTime(user.updatedAt) }}</code></td>
                </tr>
                <!-- Recent Audit Activity -->
                <tr class="permission-group-row">
                  <td colspan="2" class="group-header-cell">
                    <Icon icon="carbon:recently-viewed" class="label-icon" />
                    <span>Recent Activity</span>
                    <n-tag size="tiny" :bordered="false" round type="info">{{ recentAuditLogs.length }}</n-tag>
                  </td>
                </tr>
                <template v-if="recentAuditLogs.length > 0">
                  <template v-for="log in recentAuditLogs" :key="log.id">
                    <tr class="audit-action-row">
                      <td class="info-label">
                        <n-tag size="tiny" :bordered="false" :style="{ background: getResultColor(log.result) + '18', color: getResultColor(log.result), fontWeight: 600 }">
                          {{ log.result }}
                        </n-tag>
                      </td>
                      <td class="info-value">
                        <div class="audit-action-cell">
                          <span class="audit-action-text">{{ log.action }}</span>
                          <code class="audit-time-text">{{ formatAuditTime(log.timestamp) }}</code>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="log.ipAddress">
                      <td class="info-label"><Icon icon="carbon:network-3" class="label-icon" /> IP Address</td>
                      <td class="info-value"><code>{{ log.ipAddress }}</code></td>
                    </tr>
                    <tr v-if="log.requestPath">
                      <td class="info-label"><Icon icon="carbon:api" class="label-icon" /> Request</td>
                      <td class="info-value">
                        <n-tag v-if="log.requestMethod" size="tiny" :bordered="false" type="info" style="margin-right: 6px;">{{ log.requestMethod }}</n-tag>
                        <code class="text-xs">{{ log.requestPath }}</code>
                      </td>
                    </tr>
                    <tr v-if="log.userAgent">
                      <td class="info-label"><Icon icon="carbon:application-web" class="label-icon" /> User Agent</td>
                      <td class="info-value"><code class="text-xs">{{ log.userAgent }}</code></td>
                    </tr>
                    <tr v-if="log.durationMs">
                      <td class="info-label"><Icon icon="carbon:timer" class="label-icon" /> Duration</td>
                      <td class="info-value"><code>{{ log.durationMs }}ms</code></td>
                    </tr>
                    <tr v-if="log.metadata && (log.metadata as any).statusCode">
                      <td class="info-label"><Icon icon="carbon:status-change" class="label-icon" /> Status</td>
                      <td class="info-value">
                        <n-tag size="tiny" :bordered="false" :type="(log.metadata as any).statusCode < 400 ? 'success' : 'error'">
                          {{ (log.metadata as any).statusCode }}
                        </n-tag>
                      </td>
                    </tr>
                  </template>
                </template>
                <tr v-else>
                  <td colspan="2" class="empty-audit-cell">
                    No recent audit activity for this user
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Organization & Tenant -->
      <div class="content-row-org">
        <div class="section">
          <div class="section-header">
            <div class="section-title">
              <Icon icon="carbon:enterprise" class="section-icon" />
              <span>Organization & Tenant</span>
            </div>
          </div>
          <div class="section-content table-content">
            <table class="info-table">
              <tbody>
                <tr>
                  <td class="info-label"><Icon icon="carbon:enterprise" class="label-icon" /> Organization</td>
                  <td class="info-value">
                    <n-tag v-if="getOrgName(user.organizationId) !== '—'" :bordered="false" size="small" type="info">
                      {{ getOrgName(user.organizationId) }}
                    </n-tag>
                    <span v-else class="text-muted">Not assigned</span>
                  </td>
                </tr>
                <tr>
                  <td class="info-label"><Icon icon="carbon:group" class="label-icon" /> Tenant</td>
                  <td class="info-value">
                    <n-tag v-if="getTenantName(user.tenantId) !== '—'" :bordered="false" size="small" type="success">
                      {{ getTenantName(user.tenantId) }}
                    </n-tag>
                    <span v-else class="text-muted">Not assigned</span>
                  </td>
                </tr>
                <tr>
                  <td class="info-label"><Icon icon="carbon:fingerprint-recognition" class="label-icon" /> User ID</td>
                  <td class="info-value"><code class="text-xs">{{ user.id }}</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Roles & Permissions Row -->
      <div class="content-row-2">
        <!-- Roles -->
        <div class="section">
          <div class="section-header">
            <div class="section-title">
              <Icon icon="carbon:user-role" class="section-icon" />
              <span>Roles</span>
              <n-tag :bordered="false" size="small" type="info">
                {{ userRoles.length }} assigned
              </n-tag>
            </div>
          </div>
          <div class="section-content scrollable-table roles-grid-content">
            <div v-if="userRoles.length > 0" class="roles-grid">
              <div v-for="role in userRoles" :key="role.id" class="role-card">
                <div class="role-card-icon">
                  <Icon icon="carbon:user-role" :width="20" :height="20" />
                </div>
                <div class="role-card-body">
                  <div class="role-card-header">
                    <span class="role-card-name">{{ role.name }}</span>
                    <n-tag v-if="role.isSystem" size="tiny" type="info" :bordered="false">System</n-tag>
                  </div>
                  <p v-if="role.description" class="role-card-desc">{{ role.description }}</p>
                </div>
                <n-button v-if="canManageRoles" size="tiny" type="error" ghost @click="revokeRole(role.id)">
                  <template #icon><Icon icon="carbon:subtract" /></template>
                  Revoke
                </n-button>
              </div>
            </div>
            <div v-else class="empty-state-sm">
              <Icon icon="carbon:user-role" />
              <span>No roles assigned</span>
            </div>
          </div>
          <div v-if="canManageRoles" class="role-assign-footer">
            <n-select
              placeholder="Assign role..."
              :options="allRoles.filter((r) => !userRoles.some((ur) => ur.id === r.id)).map((r) => ({ label: r.name, value: r.id }))"
              clearable
              size="small"
              @update:value="assignRole"
            />
          </div>
        </div>

        <!-- Permissions -->
        <div class="section">
          <div class="section-header">
            <div class="section-title">
              <Icon icon="carbon:password" class="section-icon" />
              <span>Permissions</span>
              <n-tag :bordered="false" size="small" type="info">
                {{ userPermissions.length }} from {{ userRoles.length }} role{{ userRoles.length !== 1 ? 's' : '' }}
              </n-tag>
            </div>
          </div>
          <div class="section-content table-content scrollable-table">
            <table v-if="Object.keys(permissionsByResource).length > 0" class="info-table">
              <tbody>
                <template v-for="(permissions, resource) in permissionsByResource" :key="resource">
                  <tr class="permission-group-row">
                    <td colspan="2" class="group-header-cell">
                      <Icon icon="carbon:folder" class="label-icon" />
                      <span>{{ resource }}</span>
                      <n-tag size="tiny" :bordered="false" round type="info">{{ permissions.length }}</n-tag>
                    </td>
                  </tr>
                  <tr v-for="permission in permissions" :key="permission.id">
                    <td class="info-label">
                      <Icon icon="carbon:checkmark-filled" class="label-icon" style="color: #10b981" />
                      {{ permission.name }}
                    </td>
                    <td class="info-value">
                      <n-tag size="small" :bordered="false" :style="{ background: getActionColor(permission.action) + '20', color: getActionColor(permission.action), fontWeight: 600 }">
                        {{ permission.action }}
                      </n-tag>
                      <span v-if="permission.description" class="perm-desc">{{ permission.description }}</span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
            <div v-else class="empty-state-sm">
              <Icon icon="carbon:password" />
              <span>No permissions — assign a role to grant permissions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";
@import "@/styles/tfo-variables.scss";

.user-detail-page {
  @include k8s-theme-vars;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Superadmin Badge
:deep(.superadmin-badge) {
  @include superadmin-badge;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.page-title-icon {
  font-size: 22px;
  color: var(--n-text-color-3);
  flex-shrink: 0;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--n-text-color);
}

.page-subtitle {
  font-size: 0.875rem;
  margin: 0;
  color: var(--n-text-color-3);
}

.content-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-section {
  width: 100%;
}

.profile-card {
  @include k8s-theme-vars;
  background: var(--card-color);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--k8s-border-color);
}

.profile-header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.user-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 32px;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-name {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: var(--n-text-color);
  }
}

.profile-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.content-row-1 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.content-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
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

.section-content {
  padding: 20px;

  &.stats-content {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 16px;

    // Ensure StatPanel cards stretch to fill grid cells and remove extra height
    :deep(.stat-panel) {
      width: 100%;
      min-height: auto;
      height: auto;
    }

    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  &.scrollable-content {
    max-height: 400px;
    overflow-y: auto;
    padding: 16px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--n-scrollbar-color);
      border-radius: 3px;

      &:hover {
        background: var(--n-scrollbar-color-hover);
      }
    }
  }

  // Add border to all input fields
  :deep(.n-input),
  :deep(.n-select) {
    .n-input__border,
    .n-input__state-border {
      border: none !important;
    }

    .n-input-wrapper {
      border: 1px solid var(--k8s-border-color) !important;
      border-radius: 6px !important;
      background: var(--n-input-color) !important;
    }

    .n-base-selection {
      border: 1px solid var(--k8s-border-color) !important;
      border-radius: 6px !important;
      background: var(--n-input-color) !important;
    }

    .n-input__input-el {
      color: var(--n-text-color) !important;
      font-weight: 500 !important;
    }

    .n-base-selection-label {
      color: var(--n-text-color) !important;
      font-weight: 500 !important;
    }

    // Focus state
    .n-input-wrapper:focus-within {
      border-color: var(--primary-color) !important;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
    }

    .n-base-selection:focus-within,
    .n-base-selection.n-base-selection--active {
      border-color: var(--primary-color) !important;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
    }

    // Disabled state
    .n-input-wrapper.n-input-wrapper--disabled {
      border-color: var(--k8s-border-color) !important;
      opacity: 0.6;
      background: var(--n-input-color-disabled) !important;
    }

    .n-base-selection.n-base-selection--disabled {
      border-color: var(--k8s-border-color) !important;
      opacity: 0.6;
      background: var(--n-input-color-disabled) !important;
    }
  }
}

.roles-grid-content {
  padding: 12px !important;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.roles-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1.5px solid var(--k8s-border-color);
  background: var(--n-card-color);
  transition: all 0.2s;

  &:hover {
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.03);
  }
}

.role-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.role-card-body {
  flex: 1;
  min-width: 0;
}

.role-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.role-card-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--n-text-color);
}

.role-card-desc {
  margin: 0;
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.role-assign-footer {
  padding: 12px;
  border-top: 1px solid var(--k8s-border-color);
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.permission-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: capitalize;
  color: var(--n-text-color);
  padding: 8px 0;
  border-bottom: 2px solid var(--k8s-border-color);
  margin-bottom: 8px;

  :deep(svg) {
    width: 16px;
    height: 16px;
    color: var(--primary-color);
  }
}

.permission-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.permission-item {
  padding: 10px 12px;
  background: var(--n-card-color);
  border-radius: 6px;
  border: 1.5px solid var(--k8s-border-color);
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color);
    background: rgba(99, 102, 241, 0.03);
  }
}

.permission-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;

  .permission-check {
    color: #10b981;
    font-size: 14px;
    flex-shrink: 0;
  }

  .permission-name {
    font-weight: 500;
    font-size: 0.8125rem;
    flex: 1;
  }
}

.permission-description {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  margin: 4px 0 0 22px;
  line-height: 1.4;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--n-text-color-3);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-name {
    flex-direction: column;
    align-items: center;
  }

  .profile-badges {
    justify-content: center;
  }

  .section-content.stats-content {
    grid-template-columns: 1fr;
  }

  .permission-items {
    grid-template-columns: 1fr;
  }
}

// Fix: sections in content-row-1 stretch to equal height
.content-row-1 {
  .section {
    align-self: stretch;
    display: flex;
    flex-direction: column;
  }
  .section-content {
    flex: 1;
  }
}

// Roles & Permissions: same max-height, independent scroll
.content-row-2 {
  .section {
    display: flex;
    flex-direction: column;
  }
}

.content-row-org { width: 100%; }

.table-content { padding: 0 !important; }

.activity-scroll {
  max-height: 420px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--n-scrollbar-color);
    border-radius: 3px;
    &:hover {
      background: var(--n-scrollbar-color-hover);
    }
  }
}

.audit-action-row {
  td {
    border-top: 2px solid var(--k8s-border-color) !important;
    background: rgba(99, 102, 241, 0.03);

    :root.dark & { background: rgba(99, 102, 241, 0.06); }
  }

  td.info-label {
    vertical-align: middle;
  }
}

.audit-action-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.audit-action-text {
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--n-text-color);
}

.audit-time-text {
  font-size: 0.75rem !important;
  color: var(--n-text-color-3) !important;
  white-space: nowrap;
}


.empty-audit-cell {
  text-align: center;
  padding: 20px 16px !important;
  color: var(--n-text-color-3);
  font-size: 0.8125rem;
  font-style: italic;
  border-right: none !important;
  background: none !important;
}

.scrollable-table {
  max-height: 280px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--n-scrollbar-color);
    border-radius: 3px;

    &:hover {
      background: var(--n-scrollbar-color-hover);
    }
  }
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  tr:not(:last-child) td {
    border-bottom: 1px solid var(--k8s-border-color);
  }

  td {
    padding: 10px 16px;
    font-size: 0.8125rem;
    vertical-align: middle;
  }

  .info-label {
    font-weight: 500;
    color: var(--n-text-color-3);
    width: 200px;
    white-space: nowrap;
    background: rgba(100, 116, 139, 0.06);
    border-right: 1px solid var(--k8s-border-color);

    :root.dark & { background: rgba(51, 65, 85, 0.3); }

    .label-icon {
      display: inline-block;
      vertical-align: -2px;
      font-size: 14px;
      margin-right: 6px;
      color: var(--primary-color, #3b82f6);
    }
  }

  .info-value {
    color: var(--n-text-color);

    code {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 0.8125rem;
      background: transparent;
      padding: 0;
      border: none;
    }
  }
}

.text-muted { color: var(--n-text-color-3); font-style: italic; font-size: 0.8125rem; }
.text-xs { font-size: 0.7rem !important; }

.group-header-cell {
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: capitalize;
  background: rgba(99, 102, 241, 0.06) !important;
  color: var(--n-text-color);
  padding: 10px 16px !important;
  border-right: none !important;

  :root.dark & { background: rgba(99, 102, 241, 0.1) !important; }

  .label-icon {
    display: inline-block;
    vertical-align: -2px;
    margin-right: 6px;
    color: var(--primary-color, #6366f1);
  }

  :deep(.n-tag) {
    margin-left: 6px;
    vertical-align: middle;
  }
}

.perm-desc {
  display: block;
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  margin-top: 4px;
}

.empty-state-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--n-text-color-3);
  font-size: 0.8125rem;

  :deep(svg) { font-size: 18px; opacity: 0.5; }
}
</style>
