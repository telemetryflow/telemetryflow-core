/**
 * DataTable Registry — DB MONITORING INVENTORY (INV)
 * 3 datatable definitions
 */

import type { DataTableDefinition } from './types';

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 20, pageSizes: [10, 20, 50, 100],
  search: false, filter: false, export: false, rowClick: true,
  rowSelection: true, striped: false, expandable: false,
};

export const INV_DATATABLE_REGISTRY: DataTableDefinition[] = [
  {
    datatableId: 'INV30001',
    module: 'INV',
    title: 'Instance List',
    component: 'NDataTable',
    columns: [
      { key: 'type_icon', title: '', width: 40, sortable: false, renderType: 'custom' },
      { key: 'name', title: 'Name', width: 200, sortable: true, renderType: 'text' },
      { key: 'host_port', title: 'Host:Port', width: 220, sortable: true, renderType: 'text' },
      { key: 'database_name', title: 'Database', width: 140, sortable: true, renderType: 'text' },
      { key: 'version', title: 'Version', width: 100, sortable: true, renderType: 'text' },
      { key: 'status', title: 'Status', width: 110, sortable: true, renderType: 'tag' },
      { key: 'provider', title: 'Provider', width: 130, sortable: true, renderType: 'tag' },
      { key: 'environment', title: 'Env', width: 100, sortable: true, renderType: 'tag' },
      { key: 'last_seen_at', title: 'Last Seen', width: 140, sortable: true, renderType: 'date' },
      { key: 'tags', title: 'Tags', width: 160, sortable: false, renderType: 'custom' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/inventory/index.vue',
    dataSource: 'dbInventoryStore.instances',
    description: 'Database instance list with filtering and sorting',
    position: 'main-table',
  },
  {
    datatableId: 'INV30002',
    module: 'INV',
    title: 'Monitoring Rules',
    component: 'NDataTable',
    columns: [
      { key: 'instance_name', title: 'Instance', width: 180, sortable: true, renderType: 'text' },
      { key: 'metric_name', title: 'Metric', width: 220, sortable: true, renderType: 'text' },
      { key: 'operator', title: 'Op', width: 60, sortable: false, renderType: 'text' },
      { key: 'threshold', title: 'Threshold', width: 100, sortable: true, renderType: 'text' },
      { key: 'duration_seconds', title: 'Duration', width: 90, sortable: true, renderType: 'text' },
      { key: 'severity', title: 'Severity', width: 100, sortable: true, renderType: 'tag' },
      { key: 'enabled', title: 'Enabled', width: 80, sortable: true, renderType: 'switch' },
      { key: 'cooldown_seconds', title: 'Cooldown', width: 90, sortable: false, renderType: 'text' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, pageSize: 20, pageSizes: [10, 20, 50] },
    view: 'db-monitoring/inventory/detail.vue',
    dataSource: 'rules',
    description: 'Database monitoring alert rules',
    position: 'rules-table',
  },
  {
    datatableId: 'INV30003',
    module: 'INV',
    title: 'Fleet Summary by Type',
    component: 'NDataTable',
    columns: [
      { key: 'type', title: 'Database Type', width: 180, sortable: true, renderType: 'text' },
      { key: 'total', title: 'Total', width: 80, sortable: true, renderType: 'text' },
      { key: 'online', title: 'Online', width: 80, sortable: true, renderType: 'text' },
      { key: 'offline', title: 'Offline', width: 80, sortable: true, renderType: 'text' },
      { key: 'degraded', title: 'Degraded', width: 90, sortable: true, renderType: 'text' },
      { key: 'maintenance', title: 'Maint.', width: 80, sortable: false, renderType: 'text' },
    ],
    features: { ...DEFAULT_FEATURES, pageSize: 20, pageSizes: [10, 20] },
    view: 'db-monitoring/inventory/index.vue',
    dataSource: 'statsByType',
    description: 'Fleet instance counts grouped by database type',
    position: 'summary-table',
  },
];
