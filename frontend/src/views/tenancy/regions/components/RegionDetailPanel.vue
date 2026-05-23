<script setup lang="ts">
/**
 * Region Detail Panel - Drawer View
 * Shows detailed region information in a right-side panel
 */

import { computed } from "vue";
import { Icon } from "@iconify/vue";
import {
  NDrawer,
  NDrawerContent,
  NButton,
  NTag,
  NPopconfirm,
} from "naive-ui";
import { StatPanel } from "@/components/charts";
import type { Region, Organization, Workspace, Tenant } from "@/types";
import { formatDateTime } from "@/utils/format";

const props = defineProps<{
  show: boolean;
  region: Region | null;
  organizations: Organization[];
  workspaces: Workspace[];
  tenants: Tenant[];
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  edit: [region: Region];
  delete: [region: Region];
}>();

// Computed: organizations in this region
const regionOrganizations = computed(() => {
  if (!props.region) return [];
  return props.organizations.filter(org => org.regionId === props.region?.id);
});

// Computed: workspaces in this region (via organizations)
const regionWorkspaces = computed(() => {
  const orgIds = regionOrganizations.value.map(o => o.id);
  return props.workspaces.filter(ws => orgIds.includes(ws.organizationId));
});

// Computed: tenants in this region (via workspaces)
const regionTenants = computed(() => {
  const wsIds = regionWorkspaces.value.map(ws => ws.id);
  return props.tenants.filter(t => wsIds.includes(t.workspaceId));
});

// Region type based on code
const regionType = computed(() => {
  if (!props.region) return { label: "Unknown", color: "default", icon: "carbon:location" };
  const code = props.region.code.toLowerCase();
  if (code.includes("ap-")) return { label: "Asia Pacific", color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" };
  if (code.includes("us-")) return { label: "Americas", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" };
  if (code.includes("eu-")) return { label: "Europe", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" };
  return { label: "Global", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" };
});
</script>

<template>
  <NDrawer
    :show="show"
    :width="500"
    placement="right"
    @update:show="(val) => emit('update:show', val)"
  >
    <NDrawerContent v-if="region">
      <template #header>
        <div class="drawer-header">
          <Icon icon="carbon:location" class="drawer-header-icon" />
          <span>Region Details</span>
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
          icon="carbon:enterprise"
          icon-color="#8b5cf6"
          color="purple"
          value-color="#8b5cf6"
          title="Organizations"
          :value="String(regionOrganizations.length)"
          :show-compact="false"
        />
        <StatPanel
          size="small"
          icon="carbon:workspace"
          icon-color="#3b82f6"
          color="primary"
          value-color="#3b82f6"
          title="Workspaces"
          :value="String(regionWorkspaces.length)"
          :show-compact="false"
        />
        <StatPanel
          size="small"
          icon="carbon:user-multiple"
          icon-color="#22c55e"
          color="success"
          value-color="#22c55e"
          title="Tenants"
          :value="String(regionTenants.length)"
          :show-compact="false"
        />
        <StatPanel
          size="small"
          icon="carbon:code"
          icon-color="#06b6d4"
          color="info"
          value-color="#06b6d4"
          title="Code"
          :value="region.code"
          :show-compact="false"
        />
      </div>

      <div class="detail-content">
        <!-- Region Type Banner -->
        <div
          class="status-banner"
          :style="{
            backgroundColor: regionType.bg,
            color: regionType.color,
            borderColor: regionType.color + '33',
          }"
        >
          <Icon icon="carbon:location" />
          <span><strong>{{ regionType.label.toUpperCase() }}</strong> - {{ region.name }}</span>
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
                <td class="info-value"><strong>{{ region.name }}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Code</td>
                <td class="info-value">
                  <NTag size="small" round :bordered="false" type="info">
                    {{ region.code }}
                  </NTag>
                </td>
              </tr>
              <tr v-if="region.description">
                <td class="info-label">Description</td>
                <td class="info-value">{{ region.description }}</td>
              </tr>
              <tr>
                <td class="info-label">Region Type</td>
                <td class="info-value">
                  <NTag
                    size="small"
                    :bordered="false"
                    :style="{
                      backgroundColor: regionType.bg,
                      color: regionType.color,
                    }"
                  >
                    {{ regionType.label }}
                  </NTag>
                </td>
              </tr>
              <tr>
                <td class="info-label">Created</td>
                <td class="info-value">
                  <code>{{ formatDateTime(region.createdAt) }}</code>
                </td>
              </tr>
              <tr v-if="region.updatedAt">
                <td class="info-label">Updated</td>
                <td class="info-value">
                  <code>{{ formatDateTime(region.updatedAt) }}</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Organizations in Region -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:enterprise" />
            <span>Organizations</span>
            <NTag size="small" round :bordered="false" type="info">{{ regionOrganizations.length }}</NTag>
          </div>
          <div class="list-container">
            <div v-if="regionOrganizations.length === 0" class="empty-state">
              <Icon icon="carbon:enterprise" class="empty-icon" />
              <span>No organizations in this region</span>
            </div>
            <div
              v-for="org in regionOrganizations.slice(0, 5)"
              :key="org.id"
              class="list-item"
            >
              <div class="list-item-icon">
                <Icon icon="carbon:enterprise" />
              </div>
              <div class="list-item-content">
                <div class="list-item-name">{{ org.name }}</div>
                <div class="list-item-meta">{{ org.slug }}</div>
              </div>
            </div>
            <div v-if="regionOrganizations.length > 5" class="list-more">
              +{{ regionOrganizations.length - 5 }} more organizations
            </div>
          </div>
        </div>

        <!-- Recent Workspaces -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:workspace" />
            <span>Workspaces</span>
            <NTag size="small" round :bordered="false" type="info">{{ regionWorkspaces.length }}</NTag>
          </div>
          <div class="list-container">
            <div v-if="regionWorkspaces.length === 0" class="empty-state">
              <Icon icon="carbon:workspace" class="empty-icon" />
              <span>No workspaces in this region</span>
            </div>
            <div
              v-for="ws in regionWorkspaces.slice(0, 5)"
              :key="ws.id"
              class="list-item"
            >
              <div class="list-item-icon workspace">
                <Icon icon="carbon:workspace" />
              </div>
              <div class="list-item-content">
                <div class="list-item-name">{{ ws.name }}</div>
                <div class="list-item-meta">{{ ws.slug }}</div>
              </div>
            </div>
            <div v-if="regionWorkspaces.length > 5" class="list-more">
              +{{ regionWorkspaces.length - 5 }} more workspaces
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
            <NButton type="info" size="small" @click="emit('edit', region)">
              <template #icon><Icon icon="carbon:edit" /></template>
              Edit Region
            </NButton>
            <NPopconfirm @positive-click="emit('delete', region)">
              <template #trigger>
                <NButton type="error" size="small">
                  <template #icon><Icon icon="carbon:trash-can" /></template>
                  Delete
                </NButton>
              </template>
              Are you sure you want to delete this region?
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
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  font-size: 16px;

  &.workspace {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
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
