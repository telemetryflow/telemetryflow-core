<script setup lang="ts">
/**
 * API Key Detail Panel - Drawer View
 * Shows detailed API key information in a right-side panel
 */

import { computed } from "vue";
import { Icon } from "@iconify/vue";
import {
  NDrawer,
  NDrawerContent,
  NButton,
  NTag,
  NPopconfirm,
  NProgress,
} from "naive-ui";
import { StatPanel } from "@/components/charts";
import type { ApiKey } from "@/types/apikey";
import type { Organization, Workspace, Tenant, Region } from "@/types";
import {
  API_KEY_TYPES,
  API_KEY_STATUS,
  API_KEY_PERMISSIONS,
  API_KEY_SCOPES,
  getApiKeyStatus,
  formatApiKeyDisplay,
} from "@/types/apikey";
import { formatDateTime } from "@/utils/format";
import { getEntityColor, getEntityColorByIndex } from "@/utils/tag-colors";

const props = defineProps<{
  show: boolean;
  apiKey: ApiKey | null;
  organizations: Organization[];
  workspaces: Workspace[];
  tenants: Tenant[];
  regions: Region[];
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  edit: [apiKey: ApiKey];
  rotate: [apiKey: ApiKey];
  activate: [apiKey: ApiKey];
  deactivate: [apiKey: ApiKey];
  revoke: [apiKey: ApiKey];
}>();

// Get organization for this API key
const apiKeyOrganization = computed(() => {
  if (!props.apiKey) return null;
  return (
    props.organizations.find((o) => o.id === props.apiKey?.organizationId) ||
    null
  );
});

// Get workspace for this API key (optional)
const apiKeyWorkspace = computed(() => {
  if (!props.apiKey?.workspaceId) return null;
  return (
    props.workspaces.find((w) => w.id === props.apiKey?.workspaceId) || null
  );
});

// Get tenant for this API key (via workspace)
const apiKeyTenant = computed(() => {
  if (!props.apiKey?.workspaceId) return null;
  return (
    props.tenants.find((t) => t.workspaceId === props.apiKey?.workspaceId) ||
    null
  );
});

// Get region for this API key (via organization)
const apiKeyRegion = computed(() => {
  if (!apiKeyOrganization.value?.regionId) return null;
  return (
    props.regions.find((r) => r.id === apiKeyOrganization.value?.regionId) ||
    null
  );
});

// Mock usage data per level (in real app, this would come from API)
const usageByLevel = computed(() => {
  if (!props.apiKey) return null;

  // Generate mock usage data based on API key usage count
  const totalUsage = props.apiKey.usageCount;
  const regionUsage = Math.floor(totalUsage * 1.0); // 100% at region level
  const orgUsage = Math.floor(totalUsage * 1.0); // 100% at org level
  const workspaceUsage = Math.floor(totalUsage * 0.85); // 85% at workspace level
  const tenantUsage = Math.floor(totalUsage * 0.7); // 70% at tenant level

  return {
    region: {
      name: apiKeyRegion.value?.name || "Unknown Region",
      usage: regionUsage,
      percentage: 100,
    },
    organization: {
      name: apiKeyOrganization.value?.name || "Unknown Organization",
      usage: orgUsage,
      percentage: 100,
    },
    workspace: {
      name: apiKeyWorkspace.value?.name || "Unknown Workspace",
      usage: workspaceUsage,
      percentage:
        totalUsage > 0 ? Math.round((workspaceUsage / totalUsage) * 100) : 85,
    },
    tenant: {
      name: apiKeyTenant.value?.name || "Unknown Tenant",
      usage: tenantUsage,
      percentage:
        totalUsage > 0 ? Math.round((tenantUsage / totalUsage) * 100) : 70,
    },
  };
});

// Get status info
const statusInfo = computed(() => {
  if (!props.apiKey) return null;
  const status = getApiKeyStatus(props.apiKey);
  return API_KEY_STATUS[status];
});

// Get status type for tag
const statusTagType = computed(() => {
  if (!statusInfo.value) return "default";
  const colorMap: Record<string, "success" | "error" | "warning" | "default"> =
    {
      success: "success",
      error: "error",
      warning: "warning",
      default: "default",
    };
  return colorMap[statusInfo.value.color] || "default";
});

// Get key type info
const keyTypeInfo = computed(() => {
  if (!props.apiKey) return null;
  return API_KEY_TYPES[props.apiKey.keyType];
});

// Check if revoked
const isRevoked = computed(() => {
  if (!props.apiKey) return false;
  return getApiKeyStatus(props.apiKey) === "revoked";
});

// Usage percentage (assuming rate limit is per minute)
const usagePercentage = computed(() => {
  if (!props.apiKey) return 0;
  // This is a simple representation - actual calculation depends on your metrics
  return Math.min(
    (props.apiKey.usageCount / (props.apiKey.rateLimit * 60 * 24)) * 100,
    100,
  );
});

// Get permission items with code and label
const permissionItems = computed(() => {
  if (!props.apiKey) return [];
  return props.apiKey.permissions.map((perm) => {
    const found = API_KEY_PERMISSIONS.find((p) => p.value === perm);
    return {
      code: perm,
      label: found ? found.label : perm,
    };
  });
});

// Get scope items with code and label
const scopeItems = computed(() => {
  if (!props.apiKey) return [];
  return props.apiKey.scopes.map((scope) => {
    const found = API_KEY_SCOPES.find((s) => s.value === scope);
    return {
      code: scope,
      label: found ? found.label : scope,
    };
  });
});

// Organization tag color using shared entity colors
const orgTagColor = computed(() => {
  if (!props.apiKey) return getEntityColorByIndex(0);
  return getEntityColor(props.apiKey.organizationId, props.organizations);
});

// Workspace tag color using shared entity colors
const wsTagColor = computed(() => {
  if (!props.apiKey?.workspaceId) return getEntityColorByIndex(1);
  return getEntityColor(props.apiKey.workspaceId, props.workspaces);
});
</script>

<template>
  <NDrawer
    :show="show"
    :width="500"
    placement="right"
    @update:show="(val) => emit('update:show', val)"
  >
    <NDrawerContent v-if="apiKey">
      <template #header>
        <div class="drawer-header">
          <Icon icon="carbon:password" class="drawer-header-icon" />
          <span>API Key Details</span>
        </div>
      </template>

      <template #footer>
        <div class="drawer-footer">
          <NButton type="primary" ghost @click="emit('update:show', false)">
            <template #icon>
              <Icon icon="carbon:close" />
            </template>
            Close
          </NButton>
        </div>
      </template>

      <!-- Stats Row -->
      <div class="drawer-stats-row">
        <StatPanel
          size="small"
          icon="carbon:activity"
          color="primary"
          title="Usage Count"
          :value="apiKey.usageCount.toLocaleString()"
        />
        <StatPanel
          size="small"
          icon="carbon:meter"
          color="warning"
          title="Rate Limit"
          :value="`${apiKey.rateLimit}/min`"
        />
        <StatPanel
          size="small"
          :icon="
            apiKey.isActive ? 'carbon:checkmark-filled' : 'carbon:close-filled'
          "
          :color="apiKey.isActive ? 'success' : 'error'"
          title="Status"
          :value="statusInfo?.label || 'Unknown'"
        />
        <StatPanel
          size="small"
          icon="carbon:catalog"
          color="info"
          title="Type"
          :value="keyTypeInfo?.label || apiKey.keyType"
        />
      </div>

      <div class="detail-content">
        <!-- API Key Banner -->
        <div
          class="status-banner"
          :class="[
            statusTagType === 'success'
              ? 'banner-success'
              : statusTagType === 'error'
                ? 'banner-error'
                : 'banner-warning',
          ]"
        >
          <Icon icon="carbon:password" />
          <span><strong>API KEY</strong> - {{ apiKey.name }}</span>
        </div>

        <!-- Basic Information -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:information" />
            <span>Basic Information</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr>
                <td class="info-label">Name</td>
                <td class="info-value">
                  <strong>{{ apiKey.name }}</strong>
                </td>
              </tr>
              <tr>
                <td class="info-label">Key Hint</td>
                <td class="info-value">
                  <code>{{ formatApiKeyDisplay(apiKey) }}</code>
                </td>
              </tr>
              <tr v-if="apiKey.description">
                <td class="info-label">Description</td>
                <td class="info-value">{{ apiKey.description }}</td>
              </tr>
              <tr>
                <td class="info-label">Type</td>
                <td class="info-value">
                  <NTag
                    size="small"
                    :type="apiKey.keyType === 'service' ? 'warning' : 'info'"
                    :bordered="false"
                  >
                    {{ keyTypeInfo?.label }}
                  </NTag>
                </td>
              </tr>
              <tr>
                <td class="info-label">Status</td>
                <td class="info-value">
                  <NTag size="small" :type="statusTagType" :bordered="false">
                    {{ statusInfo?.label }}
                  </NTag>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Organization & Workspace -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:enterprise" />
            <span>Organization</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr>
                <td class="info-label">Organization</td>
                <td class="info-value">
                  <NTag
                    size="small"
                    :bordered="false"
                    :style="`background: ${orgTagColor.bg}; color: ${orgTagColor.color}; border: 1px solid ${orgTagColor.border}; font-weight: 600;`"
                  >
                    {{ apiKeyOrganization?.name || "Unknown" }}
                  </NTag>
                </td>
              </tr>
              <tr v-if="apiKeyWorkspace">
                <td class="info-label">Workspace</td>
                <td class="info-value">
                  <NTag
                    size="small"
                    :bordered="false"
                    :style="`background: ${wsTagColor.bg}; color: ${wsTagColor.color}; border: 1px solid ${wsTagColor.border}; font-weight: 600;`"
                  >
                    {{ apiKeyWorkspace.name }}
                  </NTag>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Usage Statistics -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:analytics" />
            <span>Usage Statistics</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr>
                <td class="info-label">Total Calls</td>
                <td class="info-value">
                  <strong>{{ apiKey.usageCount.toLocaleString() }}</strong>
                </td>
              </tr>
              <tr>
                <td class="info-label">Rate Limit</td>
                <td class="info-value">
                  {{ apiKey.rateLimit.toLocaleString() }} requests/minute
                </td>
              </tr>
              <tr>
                <td class="info-label">Last Used</td>
                <td class="info-value">
                  <code v-if="apiKey.lastUsedAt">{{
                    formatDateTime(apiKey.lastUsedAt)
                  }}</code>
                  <span v-else class="text-muted">Never used</span>
                </td>
              </tr>
              <tr>
                <td class="info-label">Usage</td>
                <td class="info-value">
                  <NProgress
                    type="line"
                    :percentage="usagePercentage"
                    :show-indicator="false"
                    :height="8"
                    :border-radius="4"
                    :color="
                      usagePercentage > 80
                        ? '#ef4444'
                        : usagePercentage > 50
                          ? '#f59e0b'
                          : '#22c55e'
                    "
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Usage Breakdown by Level -->
        <div v-if="usageByLevel" class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:tree-view" />
            <span>Usage Breakdown by Level</span>
          </div>
          <div class="usage-breakdown">
            <!-- Region Level -->
            <div class="usage-level">
              <div class="usage-level-header">
                <div class="usage-level-icon region-icon">
                  <Icon icon="carbon:location" />
                </div>
                <div class="usage-level-info">
                  <div class="usage-level-name">
                    {{ usageByLevel.region.name }}
                  </div>
                  <div class="usage-level-type">Region Level</div>
                </div>
                <div class="usage-level-stats">
                  <div class="usage-count">
                    {{ usageByLevel.region.usage.toLocaleString() }}
                  </div>
                  <div class="usage-percentage">
                    {{ usageByLevel.region.percentage }}%
                  </div>
                </div>
              </div>
              <NProgress
                type="line"
                :percentage="usageByLevel.region.percentage"
                :show-indicator="false"
                :height="6"
                :border-radius="3"
                color="#ef4444"
              />
            </div>

            <!-- Organization Level -->
            <div class="usage-level">
              <div class="usage-level-header">
                <div class="usage-level-icon org-icon">
                  <Icon icon="carbon:enterprise" />
                </div>
                <div class="usage-level-info">
                  <div class="usage-level-name">
                    {{ usageByLevel.organization.name }}
                  </div>
                  <div class="usage-level-type">Organization Level</div>
                </div>
                <div class="usage-level-stats">
                  <div class="usage-count">
                    {{ usageByLevel.organization.usage.toLocaleString() }}
                  </div>
                  <div class="usage-percentage">
                    {{ usageByLevel.organization.percentage }}%
                  </div>
                </div>
              </div>
              <NProgress
                type="line"
                :percentage="usageByLevel.organization.percentage"
                :show-indicator="false"
                :height="6"
                :border-radius="3"
                color="#f59e0b"
              />
            </div>

            <!-- Workspace Level -->
            <div class="usage-level">
              <div class="usage-level-header">
                <div class="usage-level-icon workspace-icon">
                  <Icon icon="carbon:workspace" />
                </div>
                <div class="usage-level-info">
                  <div class="usage-level-name">
                    {{ usageByLevel.workspace.name }}
                  </div>
                  <div class="usage-level-type">Workspace Level</div>
                </div>
                <div class="usage-level-stats">
                  <div class="usage-count">
                    {{ usageByLevel.workspace.usage.toLocaleString() }}
                  </div>
                  <div class="usage-percentage">
                    {{ usageByLevel.workspace.percentage }}%
                  </div>
                </div>
              </div>
              <NProgress
                type="line"
                :percentage="usageByLevel.workspace.percentage"
                :show-indicator="false"
                :height="6"
                :border-radius="3"
                color="#3b82f6"
              />
            </div>

            <!-- Tenant Level -->
            <div class="usage-level">
              <div class="usage-level-header">
                <div class="usage-level-icon tenant-icon">
                  <Icon icon="carbon:user-multiple" />
                </div>
                <div class="usage-level-info">
                  <div class="usage-level-name">
                    {{ usageByLevel.tenant.name }}
                  </div>
                  <div class="usage-level-type">Tenant Level</div>
                </div>
                <div class="usage-level-stats">
                  <div class="usage-count">
                    {{ usageByLevel.tenant.usage.toLocaleString() }}
                  </div>
                  <div class="usage-percentage">
                    {{ usageByLevel.tenant.percentage }}%
                  </div>
                </div>
              </div>
              <NProgress
                type="line"
                :percentage="usageByLevel.tenant.percentage"
                :show-indicator="false"
                :height="6"
                :border-radius="3"
                color="#22c55e"
              />
            </div>
          </div>
        </div>

        <!-- Permissions -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:locked" />
            <span>Permissions</span>
            <NTag size="small" round :bordered="false" type="info">
              {{
                apiKey.permissions.length
              }}
            </NTag>
          </div>
          <table v-if="permissionItems.length > 0" class="info-table">
            <tbody>
              <tr v-for="perm in permissionItems" :key="perm.code">
                <td class="info-label">
                  <code>{{ perm.code }}</code>
                </td>
                <td class="info-value">
                  <NTag size="small" :bordered="false" type="info">
                    {{ perm.label }}
                  </NTag>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <span class="text-muted">No permissions</span>
          </div>
        </div>

        <!-- Scopes -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:catalog" />
            <span>Scopes</span>
            <NTag size="small" round :bordered="false" type="info">
              {{
                apiKey.scopes.length
              }}
            </NTag>
          </div>
          <table v-if="scopeItems.length > 0" class="info-table">
            <tbody>
              <tr v-for="scope in scopeItems" :key="scope.code">
                <td class="info-label">
                  <code>{{ scope.code }}</code>
                </td>
                <td class="info-value">
                  <NTag size="small" :bordered="false" type="success">
                    {{ scope.label }}
                  </NTag>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <span class="text-muted">No scopes</span>
          </div>
        </div>

        <!-- Timestamps -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:time" />
            <span>Timestamps</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr>
                <td class="info-label">Created</td>
                <td class="info-value">
                  <code>{{ formatDateTime(apiKey.createdAt) }}</code>
                </td>
              </tr>
              <tr v-if="apiKey.updatedAt">
                <td class="info-label">Updated</td>
                <td class="info-value">
                  <code>{{ formatDateTime(apiKey.updatedAt) }}</code>
                </td>
              </tr>
              <tr v-if="apiKey.expiresAt">
                <td class="info-label">Expires</td>
                <td class="info-value">
                  <code>{{ formatDateTime(apiKey.expiresAt) }}</code>
                </td>
              </tr>
              <tr v-if="apiKey.revokedAt">
                <td class="info-label">Revoked</td>
                <td class="info-value">
                  <code class="text-error">{{
                    formatDateTime(apiKey.revokedAt)
                  }}</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Actions Card -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:settings-adjust" />
            <span>Actions</span>
          </div>
          <div class="actions-card">
            <NButton
              type="info"
              size="small"
              :disabled="isRevoked"
              @click="emit('edit', apiKey)"
            >
              <template #icon><Icon icon="carbon:edit" /></template>
              Edit
            </NButton>
            <NButton
              type="warning"
              size="small"
              :disabled="isRevoked"
              @click="emit('rotate', apiKey)"
            >
              <template #icon><Icon icon="carbon:renew" /></template>
              Rotate Key
            </NButton>
            <NButton
              v-if="apiKey.isActive"
              type="default"
              size="small"
              :disabled="isRevoked"
              @click="emit('deactivate', apiKey)"
            >
              <template #icon><Icon icon="carbon:pause" /></template>
              Deactivate
            </NButton>
            <NButton
              v-else
              type="success"
              size="small"
              :disabled="isRevoked"
              @click="emit('activate', apiKey)"
            >
              <template #icon><Icon icon="carbon:play" /></template>
              Activate
            </NButton>
            <NPopconfirm @positive-click="emit('revoke', apiKey)">
              <template #trigger>
                <NButton type="error" size="small" :disabled="isRevoked">
                  <template #icon><Icon icon="carbon:trash-can" /></template>
                  Revoke
                </NButton>
              </template>
              Are you sure you want to permanently revoke this API key?
            </NPopconfirm>
          </div>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";

.drawer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.drawer-header-icon {
  font-size: 20px;
  color: var(--n-primary-color);
}

.drawer-stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.detail-content {
  margin-top: 4px;
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 20px;
  border: 1px solid;

  :deep(svg) {
    font-size: 18px;
  }
}

.banner-success {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.3);
}

.banner-warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.3);
}

.banner-error {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.detail-section {
  margin-top: 24px;

  &:first-child {
    margin-top: 0;
  }
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--n-text-color-3);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  :deep(svg) {
    font-size: 16px;
  }
}

// Info Table
.info-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  overflow: hidden;

  tr:not(:last-child) td {
    border-bottom: 1px solid var(--k8s-border-color);
  }

  td {
    padding: 10px 12px;
  }

  .info-label {
    font-weight: 500;
    color: var(--n-text-color-3);
    font-size: 0.8125rem;
    width: 200px;
    min-width: 120px;
    background: rgba(100, 116, 139, 0.1);

    :root.dark & {
      background: rgba(51, 65, 85, 0.4);
    }

    code {
      font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
      font-size: 0.75rem;
      color: var(--n-text-color-2);
    }
  }

  .info-value {
    color: var(--n-text-color);
    font-size: 0.8125rem;

    code {
      font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
      font-size: 0.8125rem;
      background: transparent;
      padding: 0;
      border: none;
    }
  }
}

// Tags Container
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  background: var(--n-card-color);

  :root.dark & {
    background: rgba(30, 41, 59, 0.5);
  }
}

// Empty State
.empty-state {
  padding: 12px;
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  text-align: center;
}

// Actions Card
.actions-card {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  background: var(--n-card-color);

  :root.dark & {
    background: rgba(30, 41, 59, 0.5);
  }
}

// Drawer Footer
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 5px;
  border-top: 1px solid var(--n-border-color);

  :deep(.n-button) {
    width: 120px;
    min-width: 100px;
    height: 36px !important;
    line-height: 34px;
    padding: 0 !important;
    box-sizing: border-box;
  }
}

.text-muted {
  color: var(--n-text-color-3);
  font-style: italic;
}

.text-error {
  color: #ef4444;
}

// Usage Breakdown
.usage-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  background: var(--n-card-color);

  :root.dark & {
    background: rgba(30, 41, 59, 0.5);
  }
}

.usage-level {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.usage-level-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.usage-level-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;

  &.region-icon {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  &.org-icon {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  &.workspace-icon {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  &.tenant-icon {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }
}

.usage-level-info {
  flex: 1;
  min-width: 0;
}

.usage-level-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--n-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.usage-level-type {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
}

.usage-level-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.usage-count {
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--n-text-color);
}

.usage-percentage {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--n-text-color-2);
}

// Responsive
@media (max-width: 768px) {
  .drawer-stats-row {
    grid-template-columns: 1fr;
  }

  .actions-card {
    flex-direction: column;

    :deep(.n-button) {
      width: 100%;
    }
  }

  .usage-level-header {
    gap: 8px;
  }

  .usage-level-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .usage-level-name {
    font-size: 0.8125rem;
  }

  .usage-count {
    font-size: 0.8125rem;
  }
}
</style>
