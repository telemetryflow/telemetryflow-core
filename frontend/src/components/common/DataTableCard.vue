<script setup lang="ts">
/**
 * DataTableCard - Combines n-card with DataTable and export functionality
 * Provides consistent design with export buttons in card header
 */
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';
import type { DataTableColumn, DataTableRowKey, PaginationProps } from 'naive-ui';
import DataTable from './DataTable.vue';
import LoadingSpinner from './LoadingSpinner.vue';
import { exportToCSV, exportToJSON, getExportFilename } from '@/utils';

type RowData = any;

interface Props {
  // Card props
  title: string;
  icon?: string; // Optional icon before the title (e.g., 'carbon:application')
  size?: 'small' | 'medium' | 'large';

  // DataTable props
  columns: DataTableColumn<RowData>[];
  data: RowData[];
  rowKey?: DataTableRowKey;
  loading?: boolean;
  striped?: boolean;
  bordered?: boolean;
  bottomBordered?: boolean;
  singleLine?: boolean;
  singleColumn?: boolean;
  tableSize?: 'small' | 'medium' | 'large';
  maxHeight?: string | number;
  minHeight?: string | number;
  scrollX?: string | number;
  pagination?: PaginationProps | false;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  virtualScroll?: boolean;
  rowClassName?: string | ((row: RowData, index: number) => string);
  rowProps?: (row: RowData, index: number) => Record<string, unknown>;
  clickable?: boolean;

  // Export props
  exportable?: boolean;
  exportFilename?: string;
  exportColumns?: { key: string; title: string }[];

  // Badge props
  showCount?: boolean;
  countLabel?: string; // e.g., "logs", "traces"

  // Search props
  searchable?: boolean;
  searchPlaceholder?: string;
  searchColumns?: string[]; // Column keys to search in. If not provided, searches all string columns
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small',
  rowKey: 'id',
  loading: false,
  striped: true,
  bordered: false,
  bottomBordered: true,
  singleLine: true,
  singleColumn: false,
  tableSize: 'medium',
  maxHeight: '500px',
  pagination: false,
  emptyIcon: 'carbon:data-table',
  emptyTitle: 'No data',
  emptyDescription: 'No records to display',
  virtualScroll: false,
  clickable: false,
  exportable: true,
  exportFilename: 'data-export',
  showCount: false,
  countLabel: 'records',
  searchable: false,
  searchPlaceholder: 'Search...',
});

const emit = defineEmits<{
  'update:checked-row-keys': [keys: (string | number)[]];
  'update:expanded-row-keys': [keys: (string | number)[]];
  'update:sorter': [sorter: { columnKey: string; order: 'ascend' | 'descend' | false }];
  'update:filters': [filters: Record<string, unknown>];
  'update:page': [page: number];
  'update:page-size': [pageSize: number];
  'row-click': [row: RowData, index: number];
}>();

// Search query
const searchQuery = ref('');

// Compute search columns from table columns if not provided
const computedSearchColumns = computed(() => {
  if (props.searchColumns) return props.searchColumns;
  return props.columns
    .filter(col => 'key' in col && col.key !== 'actions' && col.key !== 'action')
    .map(col => String((col as { key: string }).key));
});

// Filtered data based on search query
const filteredData = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return props.data;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return props.data.filter(row => {
    return computedSearchColumns.value.some(key => {
      const value = row[key];
      if (value === null || value === undefined) return false;
      if (typeof value === 'object') {
        // Handle objects like labels
        return JSON.stringify(value).toLowerCase().includes(query);
      }
      return String(value).toLowerCase().includes(query);
    });
  });
});

// Compute export columns from table columns if not provided
const computedExportColumns = computed(() => {
  if (props.exportColumns) return props.exportColumns;
  return props.columns
    .filter(col => 'key' in col && col.key !== 'actions' && col.key !== 'action')
    .map(col => ({
      key: String((col as { key: string }).key),
      title: String((col as { title?: string }).title || (col as { key: string }).key),
    }));
});

// Export functions - exports filtered data if search is active
function handleExportCSV() {
  if (filteredData.value.length === 0) return;
  const filename = getExportFilename(props.exportFilename);
  exportToCSV(filteredData.value, filename, computedExportColumns.value);
}

function handleExportJSON() {
  if (filteredData.value.length === 0) return;
  const filename = getExportFilename(props.exportFilename);
  exportToJSON(filteredData.value, filename);
}

</script>

<template>
  <n-card :title="icon ? undefined : title" :size="size">
    <!-- Custom header with icon -->
    <template v-if="icon" #header>
      <div class="card-header-with-icon">
        <Icon :icon="icon" class="header-icon" />
        <span class="header-title">{{ title }}</span>
        <n-tag v-if="showCount" type="info" size="small" :bordered="true">
          <span class="badge-count">{{ filteredData.length }}</span> {{ countLabel }}
        </n-tag>
      </div>
    </template>
    <template #header-extra>
      <div class="header-actions">
        <slot name="header-extra-left" />
        <!-- Search input -->
        <n-input
          v-if="searchable"
          v-model:value="searchQuery"
          :placeholder="searchPlaceholder"
          clearable
          size="small"
          class="search-input"
        >
          <template #prefix>
            <Icon icon="carbon:search" />
          </template>
        </n-input>
        <!-- Count badge only shown here if no icon (otherwise it's in header) -->
        <n-tag v-if="showCount && !icon" type="info" size="small" :bordered="true" style="margin-right: 10px;">
          <span class="badge-count">{{ filteredData.length }}</span> {{ countLabel }}
        </n-tag>
        <n-button-group v-if="exportable" size="small">
          <n-button :disabled="loading || filteredData.length === 0" @click="handleExportCSV">
            <template #icon>
              <Icon icon="carbon:download" />
            </template>
            CSV
          </n-button>
          <n-button :disabled="loading || filteredData.length === 0" @click="handleExportJSON">
            <template #icon>
              <Icon icon="carbon:json-reference" />
            </template>
            JSON
          </n-button>
        </n-button-group>
        <slot name="header-extra-right" />
      </div>
    </template>

    <LoadingSpinner v-if="loading && filteredData.length === 0" :text="`Loading ${title.toLowerCase()}...`" />

    <DataTable
      v-else
      :columns="columns"
      :data="filteredData"
      :row-key="rowKey"
      :loading="loading"
      :striped="striped"
      :bordered="bordered"
      :bottom-bordered="bottomBordered"
      :single-line="singleLine"
      :single-column="singleColumn"
      :size="tableSize"
      :max-height="maxHeight"
      :min-height="minHeight"
      :scroll-x="scrollX"
      :pagination="pagination"
      :empty-icon="emptyIcon"
      :empty-title="emptyTitle"
      :empty-description="emptyDescription"
      :virtual-scroll="virtualScroll"
      :row-class-name="rowClassName"
      :row-props="rowProps"
      :clickable="clickable"
      @update:checked-row-keys="(keys) => emit('update:checked-row-keys', keys)"
      @update:expanded-row-keys="(keys) => emit('update:expanded-row-keys', keys)"
      @update:sorter="(sorter) => emit('update:sorter', sorter)"
      @update:filters="(filters) => emit('update:filters', filters)"
      @update:page="(page) => emit('update:page', page)"
      @update:page-size="(pageSize) => emit('update:page-size', pageSize)"
      @row-click="(row, index) => emit('row-click', row, index)"
    >
      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>
      <template v-if="$slots['empty-action']" #empty-action>
        <slot name="empty-action" />
      </template>
    </DataTable>

    <slot name="footer" />
  </n-card>
</template>

<style scoped lang="scss">
.card-header-with-icon {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 18px;
  color: var(--n-text-color-3);
}

.header-title {
  font-weight: 700;
  font-size: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 220px;
}

// Bold card headers
:deep(.n-card-header__main) {
  font-weight: 700 !important;
}

// Table styling - matching k8s-table-styles pattern
:deep(.n-data-table) {
  border: 1px solid var(--k8s-border-color, #e5e7eb);
  border-radius: 6px;
  overflow: hidden;

  // Table header
  .n-data-table-thead {
    background: var(--k8s-table-header-bg, #f8fafc) !important;
  }

  .n-data-table-th {
    font-weight: 700 !important;
    background: var(--k8s-table-header-bg, #f8fafc) !important;
    color: var(--k8s-table-header-text, #374151) !important;
    border-bottom: 1px solid var(--k8s-border-color, #e5e7eb) !important;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
    padding: 10px 12px;
  }

  // Table cells
  .n-data-table-td {
    overflow: hidden;
    white-space: nowrap;
    padding: 10px 12px;
    font-size: 0.8125rem;

    // Inner flex containers must be able to shrink
    > div, > span {
      min-width: 0;
      max-width: 100%;
    }
  }

  .n-data-table-tr td {
    border-bottom: 1px solid var(--k8s-border-color, #e5e7eb) !important;
  }

  .n-data-table-tr:last-child td {
    border-bottom: none !important;
  }

  // Add padding after the table body before pagination
  .n-data-table-base-table-body {
    padding-bottom: 5px;
  }

  // Fixed columns — solid background so they don't show through scrolled content
  .n-data-table-th--fixed-right,
  .n-data-table-th--fixed-left {
    background: var(--k8s-table-header-bg, #f8fafc) !important;
    &::after {
      box-shadow: inset 10px 0 8px -8px rgba(0, 0, 0, 0.12);
    }
  }

  .n-data-table-td--fixed-right,
  .n-data-table-td--fixed-left {
    background: var(--n-td-color, #fff) !important;
  }

  .n-data-table-tr:nth-child(even) {
    .n-data-table-td--fixed-right,
    .n-data-table-td--fixed-left {
      background: var(--n-td-color-striped, #fafafa) !important;
    }
  }

  .n-data-table-tr:hover {
    .n-data-table-td--fixed-right,
    .n-data-table-td--fixed-left {
      background: var(--n-td-color-hover, #f5f5f5) !important;
    }
  }
}

// Scrollbar styling
:deep(.n-data-table-wrapper) {
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--k8s-scrollbar-thumb, rgba(100, 116, 139, 0.3));
    border-radius: 4px;
    &:hover {
      background: var(--k8s-scrollbar-thumb-hover, rgba(100, 116, 139, 0.5));
    }
  }
}

// Pagination styling - target both class naming conventions
// Naive UI uses .n-data-table__pagination (BEM with double underscore)
:deep(.n-data-table__pagination),
:deep(.n-data-table-pagination) {
  padding: 12px 16px !important;
  border-top: 1px solid var(--k8s-border-color, #e5e7eb) !important;
  margin-top: 0 !important;
  background: inherit !important;
}

:deep(.n-data-table__pagination .n-pagination),
:deep(.n-data-table-pagination .n-pagination) {
  justify-content: flex-end !important;
  padding-right: 5px !important;
}

// Also target via n-data-table parent for better specificity
:deep(.n-data-table .n-data-table__pagination) {
  padding: 12px 16px !important;
  border-top: 1px solid var(--k8s-border-color, #e5e7eb) !important;
  margin-top: 0 !important;
  background: inherit !important;
}

// Dark mode table styling
:root.dark {
  :deep(.n-data-table) {
    border-color: rgba(255, 255, 255, 0.1);

    .n-data-table-thead {
      background: rgba(30, 41, 59, 0.4) !important;
    }

    .n-data-table-th {
      background: rgba(30, 41, 59, 0.4) !important;
      color: rgba(255, 255, 255, 0.82) !important;
      border-bottom-color: rgba(255, 255, 255, 0.1) !important;
    }

    .n-data-table-tr td {
      border-bottom-color: rgba(255, 255, 255, 0.1) !important;
    }

    .n-data-table-th--fixed-right,
    .n-data-table-th--fixed-left {
      background: rgba(30, 41, 59, 0.4) !important;
    }

    .n-data-table-td--fixed-right,
    .n-data-table-td--fixed-left {
      background: var(--card-color, #1e293b) !important;
    }

    .n-data-table-tr:nth-child(even) {
      .n-data-table-td--fixed-right,
      .n-data-table-td--fixed-left {
        background: rgba(255, 255, 255, 0.02) !important;
      }
    }

    .n-data-table-tr:hover {
      .n-data-table-td--fixed-right,
      .n-data-table-td--fixed-left {
        background: rgba(255, 255, 255, 0.05) !important;
      }
    }
  }

  :deep(.n-data-table__pagination),
  :deep(.n-data-table-pagination),
  :deep(.n-data-table .n-data-table__pagination) {
    background: inherit !important;
    border-top-color: rgba(255, 255, 255, 0.1) !important;
  }
}

// ============================================
// Responsive Styles - Tablet
// ============================================
@media (max-width: 1024px) {
  .header-actions {
    gap: 6px;
  }

  .search-input {
    width: 180px;
  }

  :deep(.n-card-header) {
    padding: 12px 14px;
  }

  :deep(.n-card__content) {
    padding: 12px;
  }

  :deep(.n-data-table-th) {
    font-size: 0.6875rem;
    padding: 8px 10px;
  }

  :deep(.n-data-table-td) {
    font-size: 0.75rem;
    padding: 8px 10px;
  }
}

// ============================================
// Responsive Styles - Mobile
// ============================================
@media (max-width: 768px) {
  .card-header-with-icon {
    gap: 6px;
    flex-wrap: wrap;
  }

  .header-icon {
    font-size: 16px;
  }

  .header-title {
    font-size: 0.875rem;
  }

  .header-actions {
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
  }

  .search-input {
    width: 140px;
    order: -1;
  }

  :deep(.n-card-header) {
    padding: 10px 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  :deep(.n-card-header__main) {
    font-size: 0.875rem !important;
  }

  :deep(.n-card-header__extra) {
    width: 100%;
  }

  :deep(.n-card__content) {
    padding: 10px;
  }

  :deep(.n-data-table-th) {
    font-size: 0.625rem;
    padding: 6px 8px;
    letter-spacing: 0.3px;
  }

  :deep(.n-data-table-td) {
    font-size: 0.6875rem;
    padding: 6px 8px;
  }

  :deep(.n-data-table__pagination),
  :deep(.n-data-table-pagination) {
    padding: 8px 10px !important;
  }

  :deep(.n-pagination) {
    flex-wrap: wrap;
    gap: 4px;
  }

  :deep(.n-pagination-item) {
    font-size: 0.75rem;
    min-width: 28px;
    height: 28px;
  }

  // Export buttons - smaller on mobile
  :deep(.n-button-group .n-button) {
    padding: 0 8px;
    font-size: 0.75rem;
  }
}

// ============================================
// Responsive Styles - Small Mobile
// ============================================
@media (max-width: 480px) {
  .card-header-with-icon {
    gap: 4px;
  }

  .header-icon {
    font-size: 14px;
  }

  .header-title {
    font-size: 0.8125rem;
  }

  .header-actions {
    gap: 4px;
  }

  .search-input {
    width: 100%;
    flex: 1;
    min-width: 100px;
  }

  :deep(.n-card-header) {
    padding: 8px 10px;
    gap: 6px;
  }

  :deep(.n-card-header__main) {
    font-size: 0.8125rem !important;
  }

  :deep(.n-card__content) {
    padding: 8px;
  }

  :deep(.n-data-table-th) {
    font-size: 0.5625rem;
    padding: 5px 6px;
    letter-spacing: 0.2px;
  }

  :deep(.n-data-table-td) {
    font-size: 0.625rem;
    padding: 5px 6px;
  }

  :deep(.n-data-table__pagination),
  :deep(.n-data-table-pagination) {
    padding: 6px 8px !important;
  }

  :deep(.n-pagination-item) {
    font-size: 0.6875rem;
    min-width: 24px;
    height: 24px;
  }

  // Export buttons - even smaller on small mobile
  :deep(.n-button-group .n-button) {
    padding: 0 6px;
    font-size: 0.6875rem;
  }

  // Hide export text, show only icons on very small screens
  :deep(.n-button-group .n-button .n-button__content) {
    gap: 2px;
  }

  // Count badge smaller
  .badge-count {
    font-size: 0.6875rem;
  }

  :deep(.n-tag) {
    font-size: 0.6875rem;
    padding: 0 6px;
    height: 20px;
  }
}
</style>
