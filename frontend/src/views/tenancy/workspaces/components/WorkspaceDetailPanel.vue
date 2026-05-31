<script setup lang="ts">
/**
 * Workspace Detail Panel - Drawer View
 * Shows detailed workspace information in a right-side panel
 */

import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { NDrawer, NDrawerContent, NButton, NTag, NPopconfirm } from "naive-ui";
import { StatPanel } from "@/components/charts";
import type { Workspace, Organization, Region, Tenant } from "@/types";
import { formatDateTime } from "@/utils/format";

const props = defineProps<{
  show: boolean;
  workspace: Workspace | null;
  organizations: Organization[];
  regions: Region[];
  tenants: Tenant[];
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  edit: [workspace: Workspace];
  delete: [workspace: Workspace];
}>();

// Get the organization for this workspace
const workspaceOrganization = computed(() => {
  if (!props.workspace) return null;
  return (
    props.organizations.find(
      (org) => org.id === props.workspace?.organizationId,
    ) || null
  );
});

// Get the region for this workspace (via organization)
const workspaceRegion = computed(() => {
  if (!workspaceOrganization.value) return null;
  return (
    props.regions.find((r) => r.id === workspaceOrganization.value?.regionId) ||
    null
  );
});

// Get tenants in this workspace
const workspaceTenants = computed(() => {
  if (!props.workspace) return [];
  return props.tenants.filter((t) => t.workspaceId === props.workspace?.id);
});
</script>

<template>
  <NDrawer
    :show="show"
    :width="500"
    placement="right"
    @update:show="(val) => emit('update:show', val)"
  >
    <NDrawerContent v-if="workspace">
      <template #header>
        <div class="drawer-header">
          <Icon icon="carbon:workspace" class="drawer-header-icon" />
          <span>Workspace Details</span>
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
          icon="carbon:user-multiple"
          icon-color="#22c55e"
          color="success"
          value-color="#22c55e"
          title="Tenants"
          :value="String(workspaceTenants.length)"
          :show-compact="false"
        />
        <StatPanel
          size="small"
          icon="carbon:enterprise"
          icon-color="#8b5cf6"
          color="purple"
          value-color="#8b5cf6"
          title="Organization"
          :value="workspaceOrganization?.name || 'N/A'"
          :show-compact="false"
        />
        <StatPanel
          size="small"
          icon="carbon:location"
          icon-color="#f59e0b"
          color="warning"
          value-color="#f59e0b"
          title="Region"
          :value="workspaceRegion?.name || 'N/A'"
          :show-compact="false"
        />
        <StatPanel
          size="small"
          icon="carbon:tag"
          icon-color="#06b6d4"
          color="info"
          value-color="#06b6d4"
          title="Slug"
          :value="workspace.slug"
          :show-compact="false"
        />
      </div>

      <div class="detail-content">
        <!-- Workspace Banner -->
        <div class="status-banner workspace-banner">
          <Icon icon="carbon:workspace" />
          <span><strong>WORKSPACE</strong> - {{ workspace.name }}</span>
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
                  <strong>{{ workspace.name }}</strong>
                </td>
              </tr>
              <tr>
                <td class="info-label">Slug</td>
                <td class="info-value">
                  <NTag size="small" round :bordered="false" type="primary">
                    {{ workspace.slug }}
                  </NTag>
                </td>
              </tr>
              <tr v-if="workspace.description">
                <td class="info-label">Description</td>
                <td class="info-value">{{ workspace.description }}</td>
              </tr>
              <tr>
                <td class="info-label">Created</td>
                <td class="info-value">
                  <code>{{ formatDateTime(workspace.createdAt) }}</code>
                </td>
              </tr>
              <tr v-if="workspace.updatedAt">
                <td class="info-label">Updated</td>
                <td class="info-value">
                  <code>{{ formatDateTime(workspace.updatedAt) }}</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Organization Information -->
        <div v-if="workspaceOrganization" class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:enterprise" />
            <span>Organization</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr>
                <td class="info-label">Name</td>
                <td class="info-value">
                  <strong>{{ workspaceOrganization.name }}</strong>
                </td>
              </tr>
              <tr>
                <td class="info-label">Slug</td>
                <td class="info-value">
                  <NTag size="small" round :bordered="false" type="warning">
                    {{ workspaceOrganization.slug }}
                  </NTag>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Region Information -->
        <div v-if="workspaceRegion" class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:location" />
            <span>Region</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr>
                <td class="info-label">Name</td>
                <td class="info-value">
                  <strong>{{ workspaceRegion.name }}</strong>
                </td>
              </tr>
              <tr>
                <td class="info-label">Code</td>
                <td class="info-value">
                  <NTag size="small" round :bordered="false" type="error">
                    {{ workspaceRegion.code }}
                  </NTag>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tenants in Workspace -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:user-multiple" />
            <span>Tenants</span>
            <NTag size="small" round :bordered="false" type="info">
              {{
                workspaceTenants.length
              }}
            </NTag>
          </div>
          <div class="list-container">
            <div v-if="workspaceTenants.length === 0" class="empty-state">
              <Icon icon="carbon:user-multiple" class="empty-icon" />
              <span>No tenants in this workspace</span>
            </div>
            <div
              v-for="tenant in workspaceTenants.slice(0, 5)"
              :key="tenant.id"
              class="list-item"
            >
              <div class="list-item-icon">
                <Icon icon="carbon:user-multiple" />
              </div>
              <div class="list-item-content">
                <div class="list-item-name">{{ tenant.name }}</div>
                <div class="list-item-meta">{{ tenant.slug }}</div>
              </div>
            </div>
            <div v-if="workspaceTenants.length > 5" class="list-more">
              +{{ workspaceTenants.length - 5 }} more tenants
            </div>
          </div>
        </div>

        <!-- Actions Card -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:settings-adjust" />
            <span>Actions</span>
          </div>
          <div class="actions-card">
            <NButton type="info" size="small" @click="emit('edit', workspace)">
              <template #icon><Icon icon="carbon:edit" /></template>
              Edit Workspace
            </NButton>
            <NPopconfirm @positive-click="emit('delete', workspace)">
              <template #trigger>
                <NButton type="error" size="small">
                  <template #icon><Icon icon="carbon:trash-can" /></template>
                  Delete
                </NButton>
              </template>
              Are you sure you want to delete this workspace?
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

.workspace-banner {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.3);
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

// List Container
.list-container {
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--k8s-border-color);

  &:last-child {
    border-bottom: none;
  }
}

.list-item-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  font-size: 16px;
}

.list-item-content {
  flex: 1;
  min-width: 0;
}

.list-item-name {
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item-meta {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
}

.list-more {
  padding: 10px 12px;
  font-size: 0.8125rem;
  color: var(--n-text-color-3);
  text-align: center;
  background: rgba(100, 116, 139, 0.05);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--n-text-color-3);
}

.empty-icon {
  font-size: 32px;
  opacity: 0.5;
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
