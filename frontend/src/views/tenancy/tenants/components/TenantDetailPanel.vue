<script setup lang="ts">
/**
 * Tenant Detail Panel - Drawer View
 * Shows detailed tenant information in a right-side panel
 */

import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { NDrawer, NDrawerContent, NButton, NTag, NPopconfirm } from "naive-ui";
import { StatPanel } from "@/components/charts";
import type { Tenant, Workspace, Organization, Region } from "@/types";
import { formatDateTime } from "@/utils/format";

const props = defineProps<{
  show: boolean;
  tenant: Tenant | null;
  workspaces: Workspace[];
  organizations: Organization[];
  regions: Region[];
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  edit: [tenant: Tenant];
  delete: [tenant: Tenant];
}>();

// Get the workspace for this tenant
const tenantWorkspace = computed(() => {
  if (!props.tenant) return null;
  return (
    props.workspaces.find((ws) => ws.id === props.tenant?.workspaceId) || null
  );
});

// Get the organization for this tenant (via workspace)
const tenantOrganization = computed(() => {
  if (!tenantWorkspace.value) return null;
  return (
    props.organizations.find(
      (org) => org.id === tenantWorkspace.value?.organizationId,
    ) || null
  );
});

// Get the region for this tenant (via organization)
const tenantRegion = computed(() => {
  if (!tenantOrganization.value) return null;
  return (
    props.regions.find((r) => r.id === tenantOrganization.value?.regionId) ||
    null
  );
});
</script>

<template>
  <NDrawer
    :show="show"
    :width="500"
    placement="right"
    @update:show="(val) => emit('update:show', val)"
  >
    <NDrawerContent v-if="tenant">
      <template #header>
        <div class="drawer-header">
          <Icon icon="carbon:user-multiple" class="drawer-header-icon" />
          <span>Tenant Details</span>
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
          icon="carbon:workspace"
          icon-color="#3b82f6"
          color="primary"
          value-color="#3b82f6"
          title="Workspace"
          :value="tenantWorkspace?.name || 'N/A'"
          :show-compact="false"
        />
        <StatPanel
          size="small"
          icon="carbon:enterprise"
          icon-color="#8b5cf6"
          color="purple"
          value-color="#8b5cf6"
          title="Organization"
          :value="tenantOrganization?.name || 'N/A'"
          :show-compact="false"
        />
        <StatPanel
          size="small"
          icon="carbon:location"
          icon-color="#f59e0b"
          color="warning"
          value-color="#f59e0b"
          title="Region"
          :value="tenantRegion?.name || 'N/A'"
          :show-compact="false"
        />
        <StatPanel
          size="small"
          icon="carbon:tag"
          icon-color="#06b6d4"
          color="info"
          value-color="#06b6d4"
          title="Slug"
          :value="tenant.slug"
          :show-compact="false"
        />
      </div>

      <div class="detail-content">
        <!-- Tenant Banner -->
        <div class="status-banner tenant-banner">
          <Icon icon="carbon:user-multiple" />
          <span><strong>TENANT</strong> - {{ tenant.name }}</span>
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
                  <strong>{{ tenant.name }}</strong>
                </td>
              </tr>
              <tr>
                <td class="info-label">Slug</td>
                <td class="info-value">
                  <NTag size="small" round :bordered="false" type="info">
                    {{ tenant.slug }}
                  </NTag>
                </td>
              </tr>
              <tr v-if="tenant.description">
                <td class="info-label">Description</td>
                <td class="info-value">{{ tenant.description }}</td>
              </tr>
              <tr>
                <td class="info-label">Created</td>
                <td class="info-value">
                  <code>{{ formatDateTime(tenant.createdAt) }}</code>
                </td>
              </tr>
              <tr v-if="tenant.updatedAt">
                <td class="info-label">Updated</td>
                <td class="info-value">
                  <code>{{ formatDateTime(tenant.updatedAt) }}</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Workspace Information -->
        <div v-if="tenantWorkspace" class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:workspace" />
            <span>Workspace</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr>
                <td class="info-label">Name</td>
                <td class="info-value">
                  <strong>{{ tenantWorkspace.name }}</strong>
                </td>
              </tr>
              <tr>
                <td class="info-label">Slug</td>
                <td class="info-value">
                  <NTag size="small" round :bordered="false" type="primary">
                    {{ tenantWorkspace.slug }}
                  </NTag>
                </td>
              </tr>
              <tr v-if="tenantWorkspace.description">
                <td class="info-label">Description</td>
                <td class="info-value">{{ tenantWorkspace.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Organization Information -->
        <div v-if="tenantOrganization" class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:enterprise" />
            <span>Organization</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr>
                <td class="info-label">Name</td>
                <td class="info-value">
                  <strong>{{ tenantOrganization.name }}</strong>
                </td>
              </tr>
              <tr>
                <td class="info-label">Slug</td>
                <td class="info-value">
                  <NTag size="small" round :bordered="false" type="warning">
                    {{ tenantOrganization.slug }}
                  </NTag>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Region Information -->
        <div v-if="tenantRegion" class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:location" />
            <span>Region</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr>
                <td class="info-label">Name</td>
                <td class="info-value">
                  <strong>{{ tenantRegion.name }}</strong>
                </td>
              </tr>
              <tr>
                <td class="info-label">Code</td>
                <td class="info-value">
                  <NTag size="small" round :bordered="false" type="error">
                    {{ tenantRegion.code }}
                  </NTag>
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
            <NButton type="info" size="small" @click="emit('edit', tenant)">
              <template #icon><Icon icon="carbon:edit" /></template>
              Edit Tenant
            </NButton>
            <NPopconfirm @positive-click="emit('delete', tenant)">
              <template #trigger>
                <NButton type="error" size="small">
                  <template #icon><Icon icon="carbon:trash-can" /></template>
                  Delete
                </NButton>
              </template>
              Are you sure you want to delete this tenant?
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

.tenant-banner {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.3);
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
    width: 120px;
    min-width: 100px;
    background: rgba(100, 116, 139, 0.1);

    :root.dark & {
      background: rgba(51, 65, 85, 0.4);
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
}
</style>
