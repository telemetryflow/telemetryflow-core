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
import StatPanel from "@/components/charts/StatPanel.vue";
import type { DropdownOption } from "naive-ui";
import { workspacesApi, type CreateWorkspaceRequest } from "@/api/workspaces";
import { organizationsApi } from "@/api/organizations";
import { tenantsApi } from "@/api/tenants";
import { useAuthStore } from "@/store";
import type { Workspace, Organization, Tenant } from "@/types";
import { withSortableColumns, getEntityColor } from "@/utils";
import { formatDateTime } from "@/utils/format";
import { exportToCSV, exportToJSON, getExportFilename } from "@/utils/export";
import { TagBadge } from "@/components/common";
import { WorkspaceNodeGraph, WorkspaceDetailPanel } from "./components";
import { regionsApi } from "@/api/regions";
import type { Region } from "@/types";

const authStore = useAuthStore();
const message = useMessage();
const dialog = useDialog();

const workspaces = ref<Workspace[]>([]);
const organizations = ref<Organization[]>([]);
const tenants = ref<Tenant[]>([]);
const regions = ref<Region[]>([]);
const isLoading = ref(false);
const searchQuery = ref("");
const selectedOrg = ref<string | null>(null);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDetailPanel = ref(false);
const isCreating = ref(false);
const isUpdating = ref(false);
const selectedWorkspace = ref<Workspace | null>(null);
const selectedDetailWorkspace = ref<Workspace | null>(null);

// View mode
const viewMode = ref<"grid" | "table" | "graph">("table");

// Pagination
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

function handlePageChange(newPage: number) {
  page.value = newPage;
}

function handlePageSizeChange(newPageSize: number) {
  pageSize.value = newPageSize;
  page.value = 1;
}

// Forms
const createForm = reactive<CreateWorkspaceRequest>({
  name: "",
  slug: "",
  description: "",
  organizationId: "",
});

const editForm = reactive({
  name: "",
  slug: "",
  description: "",
});

// Permissions
const canCreate = computed(() => authStore.hasPermission("workspace:write"));
const canEdit = computed(() => authStore.hasPermission("workspace:write"));
const canDelete = computed(() => authStore.hasPermission("workspace:delete"));

// Stats
const totalWorkspaces = computed(() => workspaces.value.length);
const totalOrganizations = computed(
  () => new Set(workspaces.value.map((w) => w.organizationId)).size,
);
const totalTenants = computed(() => tenants.value.length);

// Organization options
const orgOptions = computed(() =>
  organizations.value.map((o) => ({ label: o.name, value: o.id })),
);

// Filtered workspaces
const filteredWorkspaces = computed(() => {
  let result = workspaces.value;

  if (selectedOrg.value) {
    result = result.filter((w) => w.organizationId === selectedOrg.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.slug.toLowerCase().includes(query),
    );
  }

  return result;
});

// Get organization name
function getOrgName(orgId: string): string {
  const org = organizations.value.find((o) => o.id === orgId);
  return org ? org.name : "Unknown";
}

// Get workspace type badge
function getWorkspaceType(name: string): {
  label: string;
  color: string;
  bg: string;
} {
  const lower = name.toLowerCase();
  if (lower.includes("prod"))
    return {
      label: "Production",
      color: "#22c55e",
      bg: "rgba(34, 197, 94, 0.1)",
    };
  if (lower.includes("staging") || lower.includes("stg"))
    return {
      label: "Staging",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
    };
  if (lower.includes("dev"))
    return {
      label: "Development",
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.1)",
    };
  return { label: "Custom", color: "#6b7280", bg: "rgba(107, 114, 128, 0.1)" };
}

// Table columns (withSortableColumns auto-adds sorters except for actions)
const columns = computed(() =>
  withSortableColumns([
    {
      title: "Workspace",
      key: "name",
      minWidth: 250,
      render: (row: Workspace) =>
        h("div", { class: "name-cell" }, [
          h(Icon, {
            icon: "carbon:workspace",
            width: 20,
            height: 20,
            class: "cell-icon",
          }),
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
              () => row.description || row.slug,
            ),
          ]),
        ]),
    },
    {
      title: "Type",
      key: "type",
      width: 130,
      render: (row: Workspace) => {
        const wsType = getWorkspaceType(row.name);
        return h(
          NTag,
          {
            size: "small",
            bordered: false,
            style: `background: ${wsType.bg}; color: ${wsType.color}; font-weight: 600;`,
          },
          () => wsType.label,
        );
      },
    },
    {
      title: "Organization",
      key: "organizationId",
      width: 180,
      render: (row: Workspace) => {
        const color = getEntityColor(row.organizationId, organizations.value);
        return h(
          NTag,
          {
            size: "small",
            bordered: false,
            style: `background: ${color.bg}; color: ${color.color}; border: 1px solid ${color.border}; font-weight: 600;`,
          },
          () => getOrgName(row.organizationId),
        );
      },
    },
    {
      title: "Slug",
      key: "slug",
      width: 150,
      render: (row: Workspace) => h("code", { class: "slug-cell" }, row.slug),
    },
    {
      title: "Created",
      key: "createdAt",
      width: 150,
      render: (row: Workspace) =>
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
      render: (row: Workspace) => {
        const options: DropdownOption[] = [
          {
            label: "Detail",
            key: "detail",
            icon: () =>
              h(Icon, { icon: "carbon:magnify", width: 16, height: 16 }),
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
              h(Icon, { icon: "carbon:trash-can", width: 16, height: 16 }),
            props: { class: "delete-action" },
            disabled: !canDelete.value,
          },
        ];

        function handleActionSelect(key: string) {
          switch (key) {
            case "detail":
              openDetailPanel(row);
              break;
            case "edit":
              if (canEdit.value) openEditModal(row);
              break;
            case "delete":
              if (canDelete.value) handleDeleteWorkspace(row);
              break;
          }
        }

        return h(
          NDropdown,
          {
            options: options,
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

async function loadData() {
  isLoading.value = true;
  try {
    const [wsResponse, orgsResponse, tenantsResponse, regionsResponse] =
      await Promise.all([
        workspacesApi.list({ limit: 100 }),
        organizationsApi.list({ limit: 100 }),
        tenantsApi.list({ limit: 100 }),
        regionsApi.list({ limit: 100 }),
      ]);
    workspaces.value = wsResponse.data || [];
    organizations.value = orgsResponse.data || [];
    tenants.value = tenantsResponse.data || [];
    regions.value = regionsResponse.data || [];
    total.value = wsResponse.total || workspaces.value.length;
  } catch (error) {
    console.error("Failed to load data:", error);
    message.error("Failed to load data");
  } finally {
    isLoading.value = false;
  }
}

function openDetailPanel(ws: Workspace) {
  selectedDetailWorkspace.value = ws;
  showDetailPanel.value = true;
}

function handleDetailEdit(ws: Workspace) {
  showDetailPanel.value = false;
  openEditModal(ws);
}

function handleDetailDelete(ws: Workspace) {
  showDetailPanel.value = false;
  handleDeleteWorkspace(ws);
}

function openCreateModal() {
  createForm.name = "";
  createForm.slug = "";
  createForm.description = "";
  createForm.organizationId = selectedOrg.value || "";
  showCreateModal.value = true;
}

function openEditModal(ws: Workspace) {
  selectedWorkspace.value = ws;
  editForm.name = ws.name;
  editForm.slug = ws.slug;
  editForm.description = ws.description || "";
  showEditModal.value = true;
}

function generateSlug() {
  if (createForm.name) {
    createForm.slug = createForm.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}

async function handleCreateWorkspace() {
  if (!createForm.name || !createForm.organizationId) {
    message.warning("Name and organization are required");
    return;
  }

  isCreating.value = true;
  try {
    await workspacesApi.create(createForm);
    message.success("Workspace created successfully");
    showCreateModal.value = false;
    await loadData();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    message.error(
      axiosError.response?.data?.message || "Failed to create workspace",
    );
  } finally {
    isCreating.value = false;
  }
}

async function handleUpdateWorkspace() {
  if (!selectedWorkspace.value) return;

  isUpdating.value = true;
  try {
    await workspacesApi.update(selectedWorkspace.value.id, editForm);
    message.success("Workspace updated successfully");
    showEditModal.value = false;
    await loadData();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    message.error(
      axiosError.response?.data?.message || "Failed to update workspace",
    );
  } finally {
    isUpdating.value = false;
  }
}

async function handleDeleteWorkspace(ws: Workspace) {
  dialog.warning({
    title: "Delete Workspace",
    content: `Are you sure you want to delete "${ws.name}"? This will affect all tenants in this workspace.`,
    positiveText: "Delete",
    negativeText: "Cancel",
    onPositiveClick: async () => {
      try {
        await workspacesApi.delete(ws.id);
        message.success("Workspace deleted successfully");
        await loadData();
      } catch (error) {
        console.error("Failed to delete workspace:", error);
        message.error("Failed to delete workspace");
      }
    },
  });
}

function exportCSV() {
  const data = filteredWorkspaces.value.map((w) => ({
    name: w.name,
    slug: w.slug,
    description: w.description || "",
    type: getWorkspaceType(w.name).label,
    organization: getOrgName(w.organizationId),
    createdAt: formatDateTime(w.createdAt),
    updatedAt: w.updatedAt ? formatDateTime(w.updatedAt) : "",
  }));

  const columns = [
    { key: "name", title: "Name" },
    { key: "slug", title: "Slug" },
    { key: "description", title: "Description" },
    { key: "type", title: "Type" },
    { key: "organization", title: "Organization" },
    { key: "createdAt", title: "Created At" },
    { key: "updatedAt", title: "Updated At" },
  ];

  exportToCSV(data, getExportFilename("workspaces"), columns);
  message.success("Exported to CSV successfully");
}

function exportJSON() {
  const data = filteredWorkspaces.value.map((w) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    description: w.description,
    type: getWorkspaceType(w.name).label,
    organizationId: w.organizationId,
    organization: getOrgName(w.organizationId),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }));

  exportToJSON(data, getExportFilename("workspaces"));
  message.success("Exported to JSON successfully");
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="data-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">Workspaces</h2>
        <p class="page-subtitle">
          Manage workspaces and their organization assignments
        </p>
      </div>
      <n-button v-if="canCreate" type="primary" @click="openCreateModal">
        <template #icon>
          <Icon icon="carbon:add" />
        </template>
        Add Workspace
      </n-button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <StatPanel
        title="Total Workspaces"
        :value="totalWorkspaces"
        icon="carbon:workspace"
        color="primary"
        size="small"
      />
      <StatPanel
        title="Organizations"
        :value="totalOrganizations"
        icon="carbon:enterprise"
        color="purple"
        size="small"
      />
      <StatPanel
        title="Total Tenants"
        :value="totalTenants"
        icon="carbon:user-multiple"
        color="success"
        size="small"
      />
      <StatPanel
        title="Filtered Results"
        :value="filteredWorkspaces.length"
        icon="carbon:filter"
        color="info"
        size="small"
      />
    </div>

    <!-- Section Header -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:workspace" class="section-icon" />
          <span>Workspaces</span>
          <n-tag :bordered="false" size="small" type="info">
            {{ filteredWorkspaces.length }} workspaces
          </n-tag>
        </div>
        <div class="table-actions">
          <n-input
            v-model:value="searchQuery"
            placeholder="Search workspaces..."
            size="small"
            clearable
            class="search-input"
          >
            <template #prefix>
              <Icon icon="carbon:search" />
            </template>
          </n-input>
          <n-select
            v-model:value="selectedOrg"
            placeholder="All Organizations"
            clearable
            size="small"
            :options="orgOptions"
            style="width: 180px"
          />
          <n-button-group size="small">
            <n-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
            >
              <template #icon>
                <Icon icon="carbon:grid" />
              </template>
              Grid
            </n-button>
            <n-button
              :type="viewMode === 'table' ? 'primary' : 'default'"
              @click="viewMode = 'table'"
            >
              <template #icon>
                <Icon icon="carbon:list" />
              </template>
              Table
            </n-button>
            <n-button
              :type="viewMode === 'graph' ? 'primary' : 'default'"
              @click="viewMode = 'graph'"
            >
              <template #icon>
                <Icon icon="carbon:network-4" />
              </template>
              Graph
            </n-button>
            <n-button secondary @click="exportCSV">
              <template #icon>
                <Icon icon="carbon:download" />
              </template>
              CSV
            </n-button>
            <n-button secondary @click="exportJSON">
              <template #icon>
                <Icon icon="carbon:code" />
              </template>
              JSON
            </n-button>
          </n-button-group>
        </div>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="grid-content">
        <n-spin :show="isLoading">
          <div class="cards-grid">
            <div
              v-for="ws in filteredWorkspaces"
              :key="ws.id"
              class="dashboard-card"
              @click="openDetailPanel(ws)"
            >
              <div class="card-header">
                <div class="card-icon workspace-icon">
                  <Icon icon="carbon:workspace" />
                </div>
                <n-dropdown
                  trigger="click"
                  :options="[
                    {
                      label: 'Detail',
                      key: 'detail',
                      icon: () => h(Icon, { icon: 'carbon:magnify' }),
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
                      disabled: !canDelete,
                    },
                  ]"
                  @select="
                    (key: string) => {
                      if (key === 'detail') openDetailPanel(ws);
                      else if (key === 'edit' && canEdit) openEditModal(ws);
                      else if (key === 'delete' && canDelete)
                        handleDeleteWorkspace(ws);
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
                <h3 class="card-title">{{ ws.name }}</h3>
                <p class="card-description">{{ ws.description || ws.slug }}</p>
              </div>
              <div class="card-meta">
                <span class="updated-at">{{
                  formatDateTime(ws.createdAt)
                }}</span>
              </div>
              <div class="card-tags">
                <TagBadge :label="getWorkspaceType(ws.name).label" />
                <TagBadge :label="getOrgName(ws.organizationId)" :index="1" />
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
                <span>Add Workspace</span>
              </div>
            </div>
          </div>
          <div
            v-if="filteredWorkspaces.length === 0 && !isLoading && !canCreate"
            class="empty-state"
          >
            <Icon icon="carbon:workspace" class="empty-icon" />
            <p>No workspaces found</p>
          </div>
        </n-spin>
      </div>

      <!-- Graph View -->
      <div v-else-if="viewMode === 'graph'" class="graph-content">
        <n-spin :show="isLoading">
          <WorkspaceNodeGraph
            :organizations="organizations"
            :workspaces="filteredWorkspaces"
            :tenants="tenants"
          />
        </n-spin>
      </div>

      <!-- Data Table -->
      <div v-else class="table-content">
        <n-data-table
          :columns="columns"
          :data="filteredWorkspaces"
          :loading="isLoading"
          :row-key="(row: Workspace) => row.id"
          :scroll-x="900"
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

    <!-- Create Modal -->
    <n-modal
      v-model:show="showCreateModal"
      preset="card"
      title="Create New Workspace"
      style="width: 500px"
      :mask-closable="false"
    >
      <n-form :model="createForm" label-placement="top">
        <n-form-item label="Organization" required>
          <n-select
            v-model:value="createForm.organizationId"
            placeholder="Select organization"
            :options="orgOptions"
          />
        </n-form-item>
        <n-form-item label="Workspace Name" required>
          <n-input
            v-model:value="createForm.name"
            placeholder="e.g., Production, Staging, Development"
            @input="generateSlug"
          />
        </n-form-item>
        <n-form-item label="Slug">
          <n-input
            v-model:value="createForm.slug"
            placeholder="e.g., production"
          />
        </n-form-item>
        <n-form-item label="Description">
          <n-input
            v-model:value="createForm.description"
            type="textarea"
            placeholder="Describe this workspace"
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
            @click="handleCreateWorkspace"
          >
            Create Workspace
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- Edit Modal -->
    <n-modal
      v-model:show="showEditModal"
      preset="card"
      title="Edit Workspace"
      style="width: 500px"
      :mask-closable="false"
    >
      <n-form :model="editForm" label-placement="top">
        <n-form-item label="Workspace Name" required>
          <n-input v-model:value="editForm.name" placeholder="Workspace name" />
        </n-form-item>
        <n-form-item label="Slug">
          <n-input v-model:value="editForm.slug" placeholder="Slug" />
        </n-form-item>
        <n-form-item label="Description">
          <n-input
            v-model:value="editForm.description"
            type="textarea"
            placeholder="Describe this workspace"
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
            @click="handleUpdateWorkspace"
          >
            Save Changes
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- Detail Panel -->
    <WorkspaceDetailPanel
      v-model:show="showDetailPanel"
      :workspace="selectedDetailWorkspace"
      :organizations="organizations"
      :regions="regions"
      :tenants="tenants"
      @edit="handleDetailEdit"
      @delete="handleDetailDelete"
    />
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";

.data-page {
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

// Stats Row
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
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

.table-content {
  padding: 0;

  :deep(.n-data-table) {
    --n-th-color: transparent;
    --n-td-color: transparent;
    --n-th-text-color: var(--text-color-3);
    --n-border-color: var(--border-color);
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

  :deep(.slug-cell) {
    font-family:
      "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;
    font-size: 12px;
    color: var(--text-color-2);
    background: rgba(99, 102, 241, 0.08);
    padding: 2px 8px;
    border-radius: 4px;
  }

  :deep(.action-menu-btn) {
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }
  }
}

// Graph view styles
.graph-content {
  padding: 16px 20px;
  height: calc(100vh - 200px);
  min-height: 500px;
}

// Grid view styles
.grid-content {
  padding: 20px;
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
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;

  :deep(svg) {
    width: 20px;
    height: 20px;
    color: white;
    fill: currentColor;
  }

  &.workspace-icon {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }
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
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--k8s-border-color);
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .table-actions {
    flex-direction: column;
    align-items: stretch;

    .search-input {
      width: 100%;
    }

    :deep(.n-select) {
      width: 100% !important;
    }
  }
}
</style>
