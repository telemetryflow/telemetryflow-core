<script setup lang="ts">
import { ref, onMounted, computed, reactive, h } from 'vue';
import { Icon } from '@iconify/vue';
import { useMessage, useDialog, NTag, NButton, NDropdown, NText } from 'naive-ui';
import { StatPanel } from '@/components/charts';
import { useStatPanelsFromRegistry } from '@/composables/useStatPanelsFromRegistry';
import type { DropdownOption } from 'naive-ui';
import { organizationsApi, type CreateOrganizationRequest } from '@/api/organizations';
import { workspacesApi } from '@/api/workspaces';
import { regionsApi } from '@/api/regions';
import { useAuthStore } from '@/store';
import type { Organization, Region, Workspace } from '@/types';
import { withSortableColumns, getEntityColor } from '@/utils';
import { formatDateTime } from '@/utils/format';
import { exportToCSV, exportToJSON, getExportFilename } from '@/utils/export';
import { TagBadge } from '@/components/common';
import { OrganizationNodeGraph, OrganizationDetailPanel } from './components';
import { tenantsApi } from '@/api/tenants';
import type { Tenant } from '@/types';

const authStore = useAuthStore();
const message = useMessage();
const dialog = useDialog();

const organizations = ref<Organization[]>([]);
const workspaces = ref<Workspace[]>([]);
const regions = ref<Region[]>([]);
const tenants = ref<Tenant[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const selectedRegion = ref<string | null>(null);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDetailPanel = ref(false);
const isCreating = ref(false);
const isUpdating = ref(false);
const selectedOrg = ref<Organization | null>(null);
const selectedDetailOrg = ref<Organization | null>(null);

// View mode
const viewMode = ref<'grid' | 'table' | 'graph'>('table');

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
const createForm = reactive<CreateOrganizationRequest>({
  name: '',
  slug: '',
  description: '',
  regionId: '',
});

const editForm = reactive({
  name: '',
  slug: '',
  description: '',
});

// Permissions
const canCreate = computed(() => authStore.hasPermission('organization:write'));
const canEdit = computed(() => authStore.hasPermission('organization:write'));
const canDelete = computed(() => authStore.hasPermission('organization:delete'));

// Stats
const totalOrganizations = computed(() => organizations.value.length);
const totalWorkspaces = computed(() => workspaces.value.length);
const totalTenants = computed(() => tenants.value.length);
const totalRegions = computed(() => new Set(organizations.value.map(o => o.regionId)).size);

// Stat panels from registry (TEN20001-TEN20004)
const statCards = useStatPanelsFromRegistry(
  ['TEN20001', 'TEN20002', 'TEN20003', 'TEN20004'],
  {
    TEN20001: totalOrganizations,
    TEN20002: totalWorkspaces,
    TEN20003: totalTenants,
    TEN20004: totalRegions,
  },
);

// Region options
const regionOptions = computed(() =>
  regions.value.map(r => ({ label: `${r.name} (${r.code})`, value: r.id }))
);

// Filtered organizations
const filteredOrganizations = computed(() => {
  let result = organizations.value;

  if (selectedRegion.value) {
    result = result.filter(o => o.regionId === selectedRegion.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (o) =>
        o.name.toLowerCase().includes(query) ||
        o.slug.toLowerCase().includes(query)
    );
  }

  return result;
});

// Get region name
function getRegionName(regionId: string | undefined): string {
  if (!regionId) return 'No Region';
  const region = regions.value.find(r => r.id === regionId);
  return region ? region.name : 'Unknown';
}

// Table columns (withSortableColumns auto-adds sorters except for actions)
const columns = computed(() => withSortableColumns([
  {
    title: 'Organization',
    key: 'name',
    minWidth: 250,
    render: (row: Organization) => h('div', { class: 'name-cell' }, [
      h(Icon, { icon: 'carbon:enterprise', width: 20, height: 20, class: 'cell-icon' }),
      h('div', { class: 'cell-info' }, [
        h(NText, { strong: true, style: 'font-size: 14px; font-weight: 600; display: block' }, () => row.name),
        h(NText, { depth: 3, style: 'font-size: 12px; display: block; margin-top: 2px' }, () => row.description || row.slug),
      ])
    ])
  },
  {
    title: 'Region',
    key: 'regionId',
    width: 150,
    render: (row: Organization) => {
      const color = getEntityColor(row.regionId || '', regions.value);
      return h(NTag, {
        size: 'small',
        bordered: false,
        style: `background: ${color.bg}; color: ${color.color}; border: 1px solid ${color.border}; font-weight: 600;`
      }, () => getRegionName(row.regionId));
    }
  },
  {
    title: 'Slug',
    key: 'slug',
    width: 180,
    render: (row: Organization) => h('code', { class: 'slug-cell' }, row.slug)
  },
  {
    title: 'Created',
    key: 'createdAt',
    width: 150,
    render: (row: Organization) => h(NText, { depth: 2, style: 'font-size: 13px' }, () => formatDateTime(row.createdAt))
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 80,
    align: 'center' as const,
    fixed: 'right' as const,
    render: (row: Organization) => {
      const options: DropdownOption[] = [
        {
          label: 'Detail',
          key: 'detail',
          icon: () => h(Icon, { icon: 'carbon:magnify', width: 16, height: 16 }),
        },
        {
          label: 'Edit',
          key: 'edit',
          icon: () => h(Icon, { icon: 'carbon:edit', width: 16, height: 16 }),
          disabled: !canEdit.value,
        },
        { type: 'divider', key: 'd1' },
        {
          label: 'Delete',
          key: 'delete',
          icon: () => h(Icon, { icon: 'carbon:trash-can', width: 16, height: 16 }),
          props: { class: 'delete-action' },
          disabled: !canDelete.value,
        },
      ];

      function handleActionSelect(key: string) {
        switch (key) {
          case 'detail':
            openDetailPanel(row);
            break;
          case 'edit':
            if (canEdit.value) openEditModal(row);
            break;
          case 'delete':
            if (canDelete.value) handleDeleteOrg(row);
            break;
        }
      }

      return h(
        NDropdown,
        {
          options: options,
          trigger: 'click',
          onSelect: handleActionSelect,
        },
        {
          default: () =>
            h(
              NButton,
              { size: 'small', quaternary: true, class: 'action-menu-btn' },
              { icon: () => h(Icon, { icon: 'carbon:overflow-menu-vertical', width: 16, height: 16 }) }
            ),
        }
      );
    }
  }
]));

async function loadData() {
  isLoading.value = true;
  try {
    const [orgsResponse, wsResponse, regionsResponse, tenantsResponse] = await Promise.all([
      organizationsApi.list({ limit: 100 }),
      workspacesApi.list({ limit: 100 }),
      regionsApi.list({ limit: 100 }),
      tenantsApi.list({ limit: 100 }),
    ]);
    organizations.value = orgsResponse.data || [];
    workspaces.value = wsResponse.data || [];
    regions.value = regionsResponse.data || [];
    tenants.value = tenantsResponse.data || [];
    total.value = orgsResponse.total || organizations.value.length;
  } catch (error) {
    console.error('Failed to load data:', error);
    message.error('Failed to load data');
  } finally {
    isLoading.value = false;
  }
}

function openDetailPanel(org: Organization) {
  selectedDetailOrg.value = org;
  showDetailPanel.value = true;
}

function handleDetailEdit(org: Organization) {
  showDetailPanel.value = false;
  openEditModal(org);
}

function handleDetailDelete(org: Organization) {
  showDetailPanel.value = false;
  handleDeleteOrg(org);
}

function openCreateModal() {
  createForm.name = '';
  createForm.slug = '';
  createForm.description = '';
  createForm.regionId = selectedRegion.value || '';
  showCreateModal.value = true;
}

function openEditModal(org: Organization) {
  selectedOrg.value = org;
  editForm.name = org.name;
  editForm.slug = org.slug;
  editForm.description = org.description || '';
  showEditModal.value = true;
}

function generateSlug() {
  if (createForm.name) {
    createForm.slug = createForm.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

async function handleCreateOrg() {
  if (!createForm.name || !createForm.regionId) {
    message.warning('Name and region are required');
    return;
  }

  isCreating.value = true;
  try {
    await organizationsApi.create(createForm);
    message.success('Organization created successfully');
    showCreateModal.value = false;
    await loadData();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    message.error(axiosError.response?.data?.message || 'Failed to create organization');
  } finally {
    isCreating.value = false;
  }
}

async function handleUpdateOrg() {
  if (!selectedOrg.value) return;

  isUpdating.value = true;
  try {
    await organizationsApi.update(selectedOrg.value.id, editForm);
    message.success('Organization updated successfully');
    showEditModal.value = false;
    await loadData();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    message.error(axiosError.response?.data?.message || 'Failed to update organization');
  } finally {
    isUpdating.value = false;
  }
}

async function handleDeleteOrg(org: Organization) {
  dialog.warning({
    title: 'Delete Organization',
    content: `Are you sure you want to delete "${org.name}"? This will affect all workspaces and tenants in this organization.`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await organizationsApi.delete(org.id);
        message.success('Organization deleted successfully');
        await loadData();
      } catch (error) {
        console.error('Failed to delete organization:', error);
        message.error('Failed to delete organization');
      }
    },
  });
}

function exportCSV() {
  const data = filteredOrganizations.value.map(o => ({
    name: o.name,
    slug: o.slug,
    description: o.description || '',
    region: getRegionName(o.regionId),
    createdAt: formatDateTime(o.createdAt),
    updatedAt: o.updatedAt ? formatDateTime(o.updatedAt) : '',
  }));

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'slug', title: 'Slug' },
    { key: 'description', title: 'Description' },
    { key: 'region', title: 'Region' },
    { key: 'createdAt', title: 'Created At' },
    { key: 'updatedAt', title: 'Updated At' },
  ];

  exportToCSV(data, getExportFilename('organizations'), columns);
  message.success('Exported to CSV successfully');
}

function exportJSON() {
  const data = filteredOrganizations.value.map(o => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    description: o.description,
    regionId: o.regionId,
    region: getRegionName(o.regionId),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }));

  exportToJSON(data, getExportFilename('organizations'));
  message.success('Exported to JSON successfully');
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
        <h2 class="page-title">Organizations</h2>
        <p class="page-subtitle">Manage organizations and their configurations</p>
      </div>
      <n-button v-if="canCreate" type="primary" @click="openCreateModal">
        <template #icon>
          <Icon icon="carbon:add" />
        </template>
        Add Organization
      </n-button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <StatPanel v-for="stat in statCards" :key="stat.title" v-bind="stat" />
    </div>

    <!-- Section Header -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:enterprise" class="section-icon" />
          <span>Organizations</span>
          <n-tag :bordered="false" size="small" type="info">
            {{ filteredOrganizations.length }} organizations
          </n-tag>
        </div>
        <div class="table-actions">
          <n-input
            v-model:value="searchQuery" placeholder="Search organizations..." size="small" clearable
            class="search-input"
          >
            <template #prefix>
              <Icon icon="carbon:search" />
            </template>
          </n-input>
          <n-select
            v-model:value="selectedRegion" placeholder="All Regions" clearable size="small"
            :options="regionOptions" style="width: 160px"
          />
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

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="grid-content">
        <n-spin :show="isLoading">
          <div class="cards-grid">
            <div v-for="org in filteredOrganizations" :key="org.id" class="dashboard-card" @click="openDetailPanel(org)">
              <div class="card-header">
                <div class="card-icon">
                  <Icon icon="carbon:enterprise" />
                </div>
                <n-dropdown
                  trigger="click" :options="[
                    { label: 'Detail', key: 'detail', icon: () => h(Icon, { icon: 'carbon:magnify' }) },
                    { label: 'Edit', key: 'edit', icon: () => h(Icon, { icon: 'carbon:edit' }), disabled: !canEdit },
                    { type: 'divider', key: 'd1' },
                    { label: 'Delete', key: 'delete', icon: () => h(Icon, { icon: 'carbon:trash-can' }), props: { class: 'delete-action' }, disabled: !canDelete },
                  ]" @select="(key: string) => {
                    if (key === 'detail') openDetailPanel(org);
                    else if (key === 'edit' && canEdit) openEditModal(org);
                    else if (key === 'delete' && canDelete) handleDeleteOrg(org);
                  }"
                >
                  <n-button quaternary circle size="small" @click.stop>
                    <template #icon>
                      <Icon icon="carbon:overflow-menu-vertical" />
                    </template>
                  </n-button>
                </n-dropdown>
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ org.name }}</h3>
                <p class="card-description">{{ org.description || org.slug }}</p>
              </div>
              <div class="card-meta">
                <span class="updated-at">{{ formatDateTime(org.createdAt) }}</span>
              </div>
              <div class="card-tags">
                <TagBadge :label="getRegionName(org.regionId)" />
                <TagBadge :label="org.slug" :index="1" />
              </div>
            </div>

            <!-- Add New Card -->
            <div v-if="canCreate" class="dashboard-card new-card" @click="openCreateModal">
              <div class="new-card-content">
                <Icon icon="carbon:add-large" class="add-icon" />
                <span>Add Organization</span>
              </div>
            </div>
          </div>
          <div v-if="filteredOrganizations.length === 0 && !isLoading && !canCreate" class="empty-state">
            <Icon icon="carbon:enterprise" class="empty-icon" />
            <p>No organizations found</p>
          </div>
        </n-spin>
      </div>

      <!-- Graph View -->
      <div v-else-if="viewMode === 'graph'" class="graph-content">
        <n-spin :show="isLoading">
          <OrganizationNodeGraph :organizations="filteredOrganizations" :workspaces="workspaces" />
        </n-spin>
      </div>

      <!-- Data Table -->
      <!-- datatableId: TEN30001 -->
      <div v-else class="table-content">
        <n-data-table
          :columns="columns" :data="filteredOrganizations" :loading="isLoading"
          :row-key="(row: Organization) => row.id" :scroll-x="800" :pagination="{
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

    <!-- Create Modal -->
    <n-modal
      v-model:show="showCreateModal" preset="card" title="Create New Organization" style="width: 500px;"
      :mask-closable="false"
    >
      <n-form :model="createForm" label-placement="top">
        <n-form-item label="Region" required>
          <n-select v-model:value="createForm.regionId" placeholder="Select region" :options="regionOptions" />
        </n-form-item>
        <n-form-item label="Organization Name" required>
          <n-input v-model:value="createForm.name" placeholder="e.g., Acme Corporation" @input="generateSlug" />
        </n-form-item>
        <n-form-item label="Slug">
          <n-input v-model:value="createForm.slug" placeholder="e.g., acme-corporation" />
        </n-form-item>
        <n-form-item label="Description">
          <n-input
            v-model:value="createForm.description" type="textarea" placeholder="Describe this organization"
            :rows="3"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer tfo-modal-footer">
          <n-button @click="showCreateModal = false">Cancel</n-button>
          <n-button type="primary" :loading="isCreating" @click="handleCreateOrg">
            Create Organization
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- Edit Modal -->
    <n-modal
      v-model:show="showEditModal" preset="card" title="Edit Organization" style="width: 500px;"
      :mask-closable="false"
    >
      <n-form :model="editForm" label-placement="top">
        <n-form-item label="Organization Name" required>
          <n-input v-model:value="editForm.name" placeholder="Organization name" />
        </n-form-item>
        <n-form-item label="Slug">
          <n-input v-model:value="editForm.slug" placeholder="Slug" />
        </n-form-item>
        <n-form-item label="Description">
          <n-input
            v-model:value="editForm.description" type="textarea" placeholder="Describe this organization"
            :rows="3"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer tfo-modal-footer">
          <n-button @click="showEditModal = false">Cancel</n-button>
          <n-button type="primary" :loading="isUpdating" @click="handleUpdateOrg">
            Save Changes
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- Detail Panel -->
    <OrganizationDetailPanel
      v-model:show="showDetailPanel"
      :organization="selectedDetailOrg"
      :regions="regions"
      :workspaces="workspaces"
      :tenants="tenants"
      @edit="handleDetailEdit"
      @delete="handleDetailDelete"
    />
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
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
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

// Graph View Styles
.graph-content {
  padding: 16px 20px;
  height: calc(100vh - 200px);
  min-height: 500px;
}

// Grid View Styles
.grid-content {
  padding: 16px 20px;
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
  background: linear-gradient(135deg, #f59e0b, #d97706);
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
    background: rgba(139, 92, 246, 0.05);
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
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
  text-align: center;
  padding: 48px;
  color: var(--text-color-3);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  p {
    margin-bottom: 16px;
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