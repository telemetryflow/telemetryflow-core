<script setup lang="ts">
import { ref, onMounted, computed, reactive, h } from 'vue';
import { Icon } from '@iconify/vue';
import { useMessage, useDialog, NTag, NButton, NDropdown, NSwitch } from 'naive-ui';
import StatPanel from '@/components/charts/StatPanel.vue';
import { regionsApi, type CreateRegionRequest } from '@/api/regions';
import { organizationsApi } from '@/api/organizations';
import { workspacesApi } from '@/api/workspaces';
import { tenantsApi } from '@/api/tenants';
import { useAuthStore } from '@/store';
import type { Region, Organization, Workspace, Tenant } from '@/types';
import { withSortableColumns, getEntityColor } from '@/utils';
import { formatDateTime } from '@/utils/format';
import { exportToCSV, exportToJSON, getExportFilename } from '@/utils/export';
import { TagBadge } from '@/components/common';
import { RegionNodeGraph, RegionDetailPanel } from './components';

const authStore = useAuthStore();
const message = useMessage();
const dialog = useDialog();

const regions = ref<Region[]>([]);
const organizations = ref<Organization[]>([]);
const workspaces = ref<Workspace[]>([]);
const tenants = ref<Tenant[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDetailPanel = ref(false);
const isCreating = ref(false);
const isUpdating = ref(false);
const selectedRegion = ref<Region | null>(null);
const selectedDetailRegion = ref<Region | null>(null);

// View mode: 'grid', 'table', or 'graph'
const viewMode = ref<'grid' | 'table' | 'graph'>('table');

// Pagination
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

// Forms
const createForm = reactive<CreateRegionRequest>({
  name: '',
  code: '',
  description: '',
});

const editForm = reactive({
  name: '',
  code: '',
  description: '',
});

// Permissions
const canCreate = computed(() => authStore.hasPermission('region:write'));
const canEdit = computed(() => authStore.hasPermission('region:write'));
const canDelete = computed(() => authStore.hasPermission('region:delete'));

// Stats
const totalRegions = computed(() => regions.value.length);
const totalOrganizations = computed(() => organizations.value.length);
const totalWorkspaces = computed(() => workspaces.value.length);

// Filtered regions
const filteredRegions = computed(() => {
  if (!searchQuery.value) return regions.value;
  const query = searchQuery.value.toLowerCase();
  return regions.value.filter(
    (r) =>
      r.name.toLowerCase().includes(query) ||
      r.code.toLowerCase().includes(query)
  );
});

// Action dropdown options
function getActionOptions(row: Region) {
  return [
    { label: 'Detail', key: 'detail', icon: 'carbon:magnify' },
    { label: 'Edit', key: 'edit', icon: 'carbon:edit', disabled: !canEdit.value },
    { type: 'divider', key: 'd1' },
    { label: 'Delete', key: 'delete', icon: 'carbon:trash-can', props: { class: 'delete-action' }, disabled: !canDelete.value },
  ];
}

function handleActionSelect(key: string, row: Region) {
  if (key === 'detail') {
    openDetailPanel(row);
  } else if (key === 'edit' && canEdit.value) {
    openEditModal(row);
  } else if (key === 'delete' && canDelete.value) {
    handleDeleteRegion(row);
  }
}

function openDetailPanel(region: Region) {
  selectedDetailRegion.value = region;
  showDetailPanel.value = true;
}

function handleDetailEdit(region: Region) {
  showDetailPanel.value = false;
  openEditModal(region);
}

function handleDetailDelete(region: Region) {
  showDetailPanel.value = false;
  handleDeleteRegion(region);
}

// Table columns (withSortableColumns auto-adds sorters except for actions)
const columns = computed(() => withSortableColumns([
  {
    title: 'NAME',
    key: 'name',
    minWidth: 250,
    defaultSortOrder: 'ascend',
    render: (row: Region) => h('div', { class: 'name-cell' }, [
      h('div', { class: 'name-primary' }, row.name),
      h('div', { class: 'name-secondary' }, row.description || 'No description')
    ])
  },
  {
    title: 'CODE',
    key: 'code',
    width: 180,
    render: (row: Region) => {
      const color = getEntityColor(row.id, regions.value);
      return h(NTag, {
        size: 'small',
        round: true,
        bordered: false,
        style: `background: ${color.bg}; color: ${color.color}; border: 1px solid ${color.border}; font-weight: 600;`
      }, () => row.code);
    }
  },
  {
    title: 'CREATED',
    key: 'createdAt',
    width: 150,
    render: (row: Region) => h('span', { class: 'date-cell' }, formatDateTime(row.createdAt))
  },
  {
    title: 'TAGS',
    key: 'tags',
    width: 100,
    align: 'center' as const,
    render: (row: Region) => h('div', { class: 'tags-cell' }, [
      h(NTag, { size: 'small', round: true, bordered: false, type: 'info' }, () => 'Region'),
      row.code.includes('ap-') && h(NTag, { size: 'small', round: true, bordered: false, type: 'success' }, () => 'Asia Pacific'),
      row.code.includes('us-') && h(NTag, { size: 'small', round: true, bordered: false, type: 'warning' }, () => 'Americas'),
      row.code.includes('eu-') && h(NTag, { size: 'small', round: true, bordered: false, type: 'error' }, () => 'Europe'),
    ].filter(Boolean))
  },
  {
    title: 'ACTION',
    key: 'actions',
    width: 80,
    align: 'center' as const,
    fixed: 'right' as const,
    render: (row: Region) => h(NDropdown, {
      trigger: 'click',
      options: getActionOptions(row).map(opt =>
        opt.type === 'divider'
          ? { type: 'divider', key: opt.key }
          : {
              label: opt.label,
              key: opt.key,
              icon: () => h(Icon, { icon: opt.icon as string }),
              disabled: opt.disabled
            }
      ),
      onSelect: (key: string) => handleActionSelect(key, row)
    }, () => h(NButton, {
      quaternary: true,
      size: 'small',
      class: 'action-menu-btn'
    }, () => h(Icon, { icon: 'carbon:overflow-menu-vertical' })))
  }
]));

function handlePageChange(newPage: number) {
  page.value = newPage;
}

function handlePageSizeChange(newPageSize: number) {
  pageSize.value = newPageSize;
  page.value = 1;
}

async function loadRegions() {
  isLoading.value = true;
  try {
    const [regionsResponse, orgsResponse, wsResponse, tenantsResponse] = await Promise.all([
      regionsApi.list({ limit: 100 }),
      organizationsApi.list({ limit: 100 }),
      workspacesApi.list({ limit: 500 }),
      tenantsApi.list({ limit: 500 }),
    ]);
    regions.value = regionsResponse.data || [];
    organizations.value = orgsResponse.data || [];
    workspaces.value = wsResponse.data || [];
    tenants.value = tenantsResponse.data || [];
    total.value = regionsResponse.total || regions.value.length;
  } catch (error) {
    console.error('Failed to load regions:', error);
    message.error('Failed to load regions');
  } finally {
    isLoading.value = false;
  }
}

function openCreateModal() {
  createForm.name = '';
  createForm.code = '';
  createForm.description = '';
  showCreateModal.value = true;
}

function openEditModal(region: Region) {
  selectedRegion.value = region;
  editForm.name = region.name;
  editForm.code = region.code;
  editForm.description = region.description || '';
  showEditModal.value = true;
}

async function handleCreateRegion() {
  if (!createForm.name || !createForm.code) {
    message.warning('Name and code are required');
    return;
  }

  isCreating.value = true;
  try {
    await regionsApi.create(createForm);
    message.success('Region created successfully');
    showCreateModal.value = false;
    await loadRegions();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    message.error(axiosError.response?.data?.message || 'Failed to create region');
  } finally {
    isCreating.value = false;
  }
}

async function handleUpdateRegion() {
  if (!selectedRegion.value) return;

  isUpdating.value = true;
  try {
    await regionsApi.update(selectedRegion.value.id, editForm);
    message.success('Region updated successfully');
    showEditModal.value = false;
    await loadRegions();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    message.error(axiosError.response?.data?.message || 'Failed to update region');
  } finally {
    isUpdating.value = false;
  }
}

async function handleDeleteRegion(region: Region) {
  dialog.warning({
    title: 'Delete Region',
    content: `Are you sure you want to delete "${region.name}"? This will affect all organizations in this region.`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await regionsApi.delete(region.id);
        message.success('Region deleted successfully');
        await loadRegions();
      } catch (error) {
        console.error('Failed to delete region:', error);
        message.error('Failed to delete region');
      }
    },
  });
}

function exportCSV() {
  const data = filteredRegions.value.map(r => ({
    name: r.name,
    code: r.code,
    description: r.description || '',
    createdAt: formatDateTime(r.createdAt),
    updatedAt: r.updatedAt ? formatDateTime(r.updatedAt) : '',
  }));

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'code', title: 'Code' },
    { key: 'description', title: 'Description' },
    { key: 'createdAt', title: 'Created At' },
    { key: 'updatedAt', title: 'Updated At' },
  ];

  exportToCSV(data, getExportFilename('regions'), columns);
  message.success('Exported to CSV successfully');
}

function exportJSON() {
  const data = filteredRegions.value.map(r => ({
    id: r.id,
    name: r.name,
    code: r.code,
    description: r.description,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  exportToJSON(data, getExportFilename('regions'));
  message.success('Exported to JSON successfully');
}

onMounted(() => {
  loadRegions();
});
</script>

<template>
  <div class="data-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">Regions</h2>
        <p class="page-subtitle">Manage geographical regions and their resources</p>
      </div>
      <n-button v-if="canCreate" type="primary" @click="openCreateModal">
        <template #icon>
          <Icon icon="carbon:add" />
        </template>
        Add Region
      </n-button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <StatPanel
        title="Total Regions"
        :value="totalRegions"
        icon="carbon:location"
        color="warning"
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
        title="Workspaces"
        :value="totalWorkspaces"
        icon="carbon:workspace"
        color="primary"
        size="small"
      />
    </div>

    <!-- Section -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:location" class="section-icon" />
          <span>Regions</span>
          <n-tag :bordered="false" size="small" type="info">
            {{ filteredRegions.length }} regions
          </n-tag>
        </div>
        <div class="table-actions">
          <n-input
            v-model:value="searchQuery" placeholder="Search regions..." size="small" clearable
            class="search-input"
          >
            <template #prefix>
              <Icon icon="carbon:search" />
            </template>
          </n-input>
          <n-button-group size="small">
            <n-button :type="viewMode === 'grid' ? 'primary' : 'default'" @click="viewMode = 'grid'">
              <template #icon>
                <Icon icon="carbon:grid" />
              </template>
              Grid
            </n-button>
            <n-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'">
              <template #icon>
                <Icon icon="carbon:list" />
              </template>
              Table
            </n-button>
            <n-button :type="viewMode === 'graph' ? 'primary' : 'default'" @click="viewMode = 'graph'">
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

      <!-- Create Modal -->
      <n-modal
        v-model:show="showCreateModal" preset="card" title="Create New Region" style="width: 500px;"
        :mask-closable="false"
      >
        <n-form :model="createForm" label-placement="top">
          <n-form-item label="Region Name" required>
            <n-input v-model:value="createForm.name" placeholder="e.g., Asia Pacific" />
          </n-form-item>
          <n-form-item label="Region Code" required>
            <n-input v-model:value="createForm.code" placeholder="e.g., ap-southeast-1" />
          </n-form-item>
          <n-form-item label="Description">
            <n-input
              v-model:value="createForm.description" type="textarea" placeholder="Describe this region"
              :rows="3"
            />
          </n-form-item>
        </n-form>
        <template #footer>
          <div class="modal-footer tfo-modal-footer">
            <n-button @click="showCreateModal = false">Cancel</n-button>
            <n-button type="primary" :loading="isCreating" @click="handleCreateRegion">
              Create Region
            </n-button>
          </div>
        </template>
      </n-modal>

      <!-- Edit Modal -->
      <n-modal
        v-model:show="showEditModal" preset="card" title="Edit Region" style="width: 500px;"
        :mask-closable="false"
      >
        <n-form :model="editForm" label-placement="top">
          <n-form-item label="Region Name" required>
            <n-input v-model:value="editForm.name" placeholder="Region name" />
          </n-form-item>
          <n-form-item label="Region Code" required>
            <n-input v-model:value="editForm.code" placeholder="Region code" />
          </n-form-item>
          <n-form-item label="Description">
            <n-input
              v-model:value="editForm.description" type="textarea" placeholder="Describe this region"
              :rows="3"
            />
          </n-form-item>
        </n-form>
        <template #footer>
          <div class="modal-footer tfo-modal-footer">
            <n-button @click="showEditModal = false">Cancel</n-button>
            <n-button type="primary" :loading="isUpdating" @click="handleUpdateRegion">
              Save Changes
            </n-button>
          </div>
        </template>
      </n-modal>

      <!-- Detail Panel -->
      <RegionDetailPanel
        v-model:show="showDetailPanel"
        :region="selectedDetailRegion"
        :organizations="organizations"
        :workspaces="workspaces"
        :tenants="tenants"
        @edit="handleDetailEdit"
        @delete="handleDetailDelete"
      />

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="grid-content">
        <n-spin :show="isLoading">
          <div class="cards-grid">
            <div
              v-for="region in filteredRegions" :key="region.id" class="dashboard-card"
              @click="openDetailPanel(region)"
            >
              <div class="card-header">
                <div class="card-icon region-icon">
                  <Icon icon="carbon:location" />
                </div>
                <n-dropdown
                  trigger="click" :options="getActionOptions(region).map(opt =>
                    opt.type === 'divider'
                      ? { type: 'divider', key: opt.key }
                      : { label: opt.label, key: opt.key, icon: opt.icon ? () => h(Icon, { icon: opt.icon }) : undefined, disabled: opt.disabled }
                  )" @select="(key: string) => handleActionSelect(key, region)"
                >
                  <n-button quaternary circle size="small" @click.stop>
                    <template #icon>
                      <Icon icon="carbon:overflow-menu-vertical" />
                    </template>
                  </n-button>
                </n-dropdown>
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ region.name }}</h3>
                <p class="card-description">{{ region.description || region.code }}</p>
              </div>
              <div class="card-meta">
                <span class="updated-at">{{ formatDateTime(region.createdAt) }}</span>
              </div>
              <div class="card-tags">
                <TagBadge label="Region" />
                <TagBadge v-if="region.code.includes('ap-')" label="Asia Pacific" :index="1" />
                <TagBadge v-if="region.code.includes('us-')" label="Americas" :index="2" />
                <TagBadge v-if="region.code.includes('eu-')" label="Europe" :index="3" />
                <TagBadge :label="region.code" :index="4" />
              </div>
            </div>

            <!-- Add New Card -->
            <div v-if="canCreate" class="dashboard-card new-card" @click="openCreateModal">
              <div class="new-card-content">
                <Icon icon="carbon:add-large" class="add-icon" />
                <span>Add Region</span>
              </div>
            </div>
          </div>
          <div v-if="filteredRegions.length === 0 && !isLoading && !canCreate" class="empty-state">
            <Icon icon="carbon:location" class="empty-icon" />
            <p>No regions found</p>
          </div>
        </n-spin>
      </div>

      <!-- Graph View -->
      <div v-else-if="viewMode === 'graph'" class="graph-content">
        <n-spin :show="isLoading">
          <RegionNodeGraph
            :regions="filteredRegions" :organizations="organizations" :workspaces="workspaces"
            :tenants="tenants"
          />
        </n-spin>
      </div>

      <!-- Table View -->
      <div v-else class="table-content">
        <n-data-table
          :columns="columns" :data="filteredRegions" :loading="isLoading" :row-key="(row: Region) => row.id"
          :scroll-x="800" :pagination="{
            page: page,
            pageSize: pageSize,
            itemCount: total,
            showSizePicker: true,
            pageSizes: [10, 20, 50, 100, 200, 500],
            onChange: handlePageChange,
            onUpdatePageSize: handlePageSizeChange,
            prefix: (info: any) => `${info.itemCount} items`
          }" :bordered="false" :single-line="false" striped size="small"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tfo-table-styles.scss';

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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--k8s-border-color);
}

// Table Styles
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
    min-width: 0;
    overflow: hidden;

    .name-primary {
      font-weight: 600;
      color: var(--text-color-1);
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .name-secondary {
      font-size: 12px;
      color: var(--text-color-3);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  :deep(.date-cell) {
    color: var(--text-color-2);
    font-size: 13px;
  }

  :deep(.tags-cell) {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;

  :deep(svg) {
    width: 20px;
    height: 20px;
  }

  &.region-icon {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;

    :deep(svg) {
      color: white;
      fill: currentColor;
    }
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

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    flex-wrap: wrap;

    .search-input {
      width: 100%;
    }
  }

  .data-grid {
    grid-template-columns: 1fr;
  }
}
</style>