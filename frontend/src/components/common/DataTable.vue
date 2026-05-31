<script setup lang="ts">
/**
 * Reusable DataTable component
 * Wraps Naive UI's n-data-table with consistent styling and common features
 */
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { DataTableColumn, DataTableRowKey, DataTableCreateRowKey, PaginationProps } from 'naive-ui';
import EmptyState from './EmptyState.vue';
import { exportToCSV, exportToJSON, getExportFilename } from '@/utils';

type RowData = any;

interface Props {
  columns: DataTableColumn<RowData>[];
  data: RowData[];
  rowKey?: DataTableRowKey;
  loading?: boolean;
  striped?: boolean;
  bordered?: boolean;
  bottomBordered?: boolean;
  singleLine?: boolean;
  singleColumn?: boolean;
  size?: 'small' | 'medium' | 'large';
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
  exportable?: boolean;
  exportFilename?: string;
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  loading: false,
  striped: true,
  bordered: false,
  bottomBordered: true,
  singleLine: true,
  singleColumn: false,
  size: 'medium',
  maxHeight: '600px',
  pagination: false,
  emptyIcon: 'carbon:data-table',
  emptyTitle: 'No data',
  emptyDescription: 'No records to display',
  virtualScroll: false,
  clickable: false,
  exportable: false,
  exportFilename: 'data-export',
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

const showEmpty = computed(() => !props.loading && props.data.length === 0);

// Inject ellipsis on all columns that don't already define it,
// so cell text never overflows its column boundary.
const processedColumns = computed<DataTableColumn<RowData>[]>(() =>
  props.columns.map(col => {
    if ('ellipsis' in col || col.type === 'selection' || col.type === 'expand') return col;
    return { ...col, ellipsis: { tooltip: true } };
  }),
);

// Convert rowKey to function if it's a string
const computedRowKey = computed<DataTableCreateRowKey<RowData> | undefined>(() => {
  if (typeof props.rowKey === 'string') {
    const key = props.rowKey;
    return (row: RowData) => row[key] as string | number;
  }
  return props.rowKey as unknown as DataTableCreateRowKey<RowData>;
});

// Create row props with optional click handler
function computedRowProps(row: RowData, index: number) {
  const customProps = props.rowProps?.(row, index) || {};
  if (props.clickable) {
    return {
      ...customProps,
      style: 'cursor: pointer;',
      onClick: () => emit('row-click', row, index),
    };
  }
  return customProps;
}

function handleCheckedRowKeysChange(keys: (string | number)[]) {
  emit('update:checked-row-keys', keys);
}

function handleExpandedRowKeysChange(keys: (string | number)[]) {
  emit('update:expanded-row-keys', keys);
}

function handleSorterChange(sorter: { columnKey: string; order: 'ascend' | 'descend' | false }) {
  emit('update:sorter', sorter);
}

function handleFiltersChange(filters: Record<string, unknown>) {
  emit('update:filters', filters);
}

function handlePageChange(page: number) {
  emit('update:page', page);
}

function handlePageSizeChange(pageSize: number) {
  emit('update:page-size', pageSize);
}

// Export functions
const exportColumns = computed(() => {
  return props.columns
    .filter(col => 'key' in col && col.key !== 'actions' && col.key !== 'action')
    .map(col => ({
      key: String((col as { key: string }).key),
      title: String((col as { title?: string }).title || (col as { key: string }).key),
    }));
});

function handleExportCSV() {
  if (props.data.length === 0) return;
  const filename = getExportFilename(props.exportFilename);
  exportToCSV(props.data, filename, exportColumns.value);
}

function handleExportJSON() {
  if (props.data.length === 0) return;
  const filename = getExportFilename(props.exportFilename);
  exportToJSON(props.data, filename);
}
</script>

<template>
  <div class="data-table-wrapper">
    <!-- Export Toolbar -->
    <div v-if="exportable && data.length > 0" class="data-table-toolbar">
      <slot name="toolbar-left" />
      <div class="toolbar-spacer" />
      <slot name="toolbar-right" />
      <n-button-group size="small">
        <n-button :disabled="loading" @click="handleExportCSV">
          <template #icon>
            <Icon icon="carbon:download" />
          </template>
          CSV
        </n-button>
        <n-button :disabled="loading" @click="handleExportJSON">
          <template #icon>
            <Icon icon="carbon:json-reference" />
          </template>
          JSON
        </n-button>
      </n-button-group>
    </div>

    <EmptyState
      v-if="showEmpty"
      :icon="emptyIcon"
      :title="emptyTitle"
      :description="emptyDescription"
    >
      <slot name="empty-action" />
    </EmptyState>
    <n-data-table
      v-else
      :columns="processedColumns"
      :data="data"
      :row-key="computedRowKey"
      :loading="loading"
      :striped="striped"
      :bordered="bordered"
      :bottom-bordered="bottomBordered"
      :single-line="singleLine"
      :single-column="singleColumn"
      :size="size"
      :max-height="maxHeight"
      :min-height="minHeight"
      :scroll-x="scrollX"
      :pagination="pagination"
      :virtual-scroll="virtualScroll"
      :row-class-name="rowClassName"
      :row-props="computedRowProps"
      @update:checked-row-keys="handleCheckedRowKeysChange"
      @update:expanded-row-keys="handleExpandedRowKeysChange"
      @update:sorter="handleSorterChange"
      @update:filters="handleFiltersChange"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    >
      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>
    </n-data-table>
  </div>
</template>

<style scoped lang="scss">
.data-table-wrapper {
  width: 100%;

  .data-table-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding: 8px 0;

    .toolbar-spacer {
      flex: 1;
    }
  }

  :deep(.n-data-table) {
    // Header styles
    .n-data-table-thead {
      .n-data-table-th {
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        color: var(--n-text-color-3);
        background: var(--n-th-color);
        padding: 12px 16px;
        border-bottom: 2px solid var(--n-border-color);
        border-right: 1px solid var(--n-border-color);

        &:last-child {
          border-right: none;
        }
      }
    }

    // Row styles
    .n-data-table-tr {
      transition: background-color 0.15s ease;

      &:hover {
        .n-data-table-td {
          background: var(--n-td-color-hover);
        }
      }
    }

    // Cell styles
    .n-data-table-td {
      font-size: 0.875rem;
      padding: 12px 16px;
      border-bottom: 1px solid var(--n-border-color);
      border-right: 1px solid var(--n-border-color);

      &:last-child {
        border-right: none;
      }

      // Expand row cell — must have zero padding so renderExpand
      // content fills the full-width cell without extra insets.
      &.n-data-table-expand-tr-td {
        padding: 0 !important;
        border-bottom: none !important;
        border-right: none !important;
      }
    }

    // Striped rows
    &.n-data-table--striped {
      .n-data-table-tr:nth-child(even) {
        .n-data-table-td {
          background: var(--n-td-color-striped);
        }
      }
    }

    // Empty state
    .n-data-table-empty {
      padding: 48px 24px;
    }

    // Loading overlay
    .n-data-table-loading-wrapper {
      min-height: 200px;
    }

    // Scrollbar styles
    .n-scrollbar-rail--vertical {
      right: 2px;
    }

    .n-scrollbar-rail--horizontal {
      bottom: 2px;
    }
  }
}

// ============================================
// Responsive Styles - Tablet
// ============================================
@media (max-width: 1024px) {
  .data-table-wrapper {
    .data-table-toolbar {
      gap: 8px;
      margin-bottom: 10px;
    }

    :deep(.n-data-table) {
      .n-data-table-th {
        font-size: 0.6875rem;
        padding: 10px 12px;
      }

      .n-data-table-td {
        font-size: 0.8125rem;
        padding: 10px 12px;
      }
    }
  }
}

// ============================================
// Responsive Styles - Mobile
// ============================================
@media (max-width: 768px) {
  .data-table-wrapper {
    .data-table-toolbar {
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
      padding: 6px 0;
    }

    :deep(.n-data-table) {
      .n-data-table-th {
        font-size: 0.625rem;
        padding: 6px 8px;
        letter-spacing: 0.3px;
      }

      .n-data-table-td {
        font-size: 0.6875rem;
        padding: 6px 8px;
      }

      // Pagination
      .n-data-table__pagination {
        padding: 8px 10px;
      }

      .n-pagination-item {
        font-size: 0.75rem;
        min-width: 28px;
        height: 28px;
      }
    }
  }
}

// ============================================
// Responsive Styles - Small Mobile
// ============================================
@media (max-width: 480px) {
  .data-table-wrapper {
    .data-table-toolbar {
      gap: 4px;
      margin-bottom: 6px;
      padding: 4px 0;

      // Export buttons smaller
      :deep(.n-button-group .n-button) {
        padding: 0 6px;
        font-size: 0.6875rem;
      }
    }

    :deep(.n-data-table) {
      .n-data-table-th {
        font-size: 0.5625rem;
        padding: 5px 6px;
        letter-spacing: 0.2px;
      }

      .n-data-table-td {
        font-size: 0.625rem;
        padding: 5px 6px;
      }

      // Pagination
      .n-data-table__pagination {
        padding: 6px 8px;
      }

      .n-pagination-item {
        font-size: 0.6875rem;
        min-width: 24px;
        height: 24px;
      }

      // Empty state smaller
      .n-data-table-empty {
        padding: 32px 16px;
      }
    }
  }
}
</style>
