<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';

interface Props {
  searchPlaceholder?: string;
  showGridView?: boolean;
  showExport?: boolean;
  exportFilename?: string;
  exportData?: any[];
  exportColumns?: { key: string; title: string }[];
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Search...',
  showGridView: true,
  showExport: true,
  exportFilename: 'export',
  exportData: () => [],
  exportColumns: () => [],
});

const emit = defineEmits<{
  'update:search': [value: string];
  'update:viewMode': [mode: 'table' | 'grid'];
}>();

const searchQuery = ref('');
const viewMode = ref<'table' | 'grid'>('table');

function handleSearchInput(value: string) {
  searchQuery.value = value;
  emit('update:search', value);
}

function handleViewModeChange(mode: 'table' | 'grid') {
  viewMode.value = mode;
  emit('update:viewMode', mode);
}

function exportToCSV() {
  if (!props.exportData.length || !props.exportColumns.length) return;

  const headers = props.exportColumns.map(col => col.title);
  const rows = props.exportData.map(item => 
    props.exportColumns.map(col => {
      const value = item[col.key];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    })
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadFile(csvContent, `${props.exportFilename}.csv`, 'text/csv');
}

function exportToJSON() {
  if (!props.exportData.length) return;

  const jsonContent = JSON.stringify(props.exportData, null, 2);
  downloadFile(jsonContent, `${props.exportFilename}.json`, 'application/json');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="datatable-toolbar">
    <!-- Search -->
    <n-input
      :value="searchQuery"
      :placeholder="searchPlaceholder"
      clearable
      size="small"
      class="search-input"
      @update:value="handleSearchInput"
    >
      <template #prefix>
        <Icon icon="carbon:search" />
      </template>
    </n-input>

    <!-- Filters Slot -->
    <slot name="filters" />

    <!-- View Mode & Export -->
    <n-button-group size="small">
      <n-button
        v-if="showGridView"
        :type="viewMode === 'grid' ? 'primary' : 'default'"
        @click="handleViewModeChange('grid')"
      >
        <template #icon>
          <Icon icon="carbon:grid" />
        </template>
        Grid
      </n-button>
      <n-button
        :type="viewMode === 'table' ? 'primary' : 'default'"
        @click="handleViewModeChange('table')"
      >
        <template #icon>
          <Icon icon="carbon:list" />
        </template>
        Table
      </n-button>
      <n-button v-if="showExport" secondary @click="exportToCSV">
        <template #icon>
          <Icon icon="carbon:download" />
        </template>
        CSV
      </n-button>
      <n-button v-if="showExport" secondary @click="exportToJSON">
        <template #icon>
          <Icon icon="carbon:code" />
        </template>
        JSON
      </n-button>
    </n-button-group>
  </div>
</template>

<style scoped lang="scss">
.datatable-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;

  .search-input {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .datatable-toolbar {
    .search-input {
      width: 100%;
    }
  }
}
</style>
