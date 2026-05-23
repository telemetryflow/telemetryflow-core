/**
 * DataTable Registry — PostgreSQL (DBM)
 * 4 datatable registry definitions
 */

import type { DataTableDefinition } from './types';

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 20, pageSizes: [10, 20, 50, 100],
  search: false, filter: false, export: false, rowClick: true,
  rowSelection: false, striped: false, expandable: false,
};

export const DBM_POSTGRESQL_DATATABLES: DataTableDefinition[] = [
  {
    datatableId: 'DBM30101',
    module: 'DBM',
    title: 'PostgreSQL Instances',
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
    view: 'monitoring/db-postgresql/instances.vue',
    dataSource: 'dbPostgresqlStore.instances',
    description: 'PostgreSQL instance list with filtering and sorting',
    position: 'postgresql-instance-table',
  },
  {
    datatableId: 'DBM30102',
    module: 'DBM',
    title: 'Top Queries',
    component: 'NDataTable',
    columns: [
      { key: 'fingerprint', title: 'Query Fingerprint', width: 400, sortable: false, renderType: 'text' },
      { key: 'queryid', title: 'Query ID', width: 120, sortable: true, renderType: 'text' },
      { key: 'calls', title: 'Calls', width: 100, sortable: true, renderType: 'text' },
      { key: 'total_exec_time_ms', title: 'Total Time (ms)', width: 140, sortable: true, renderType: 'text' },
      { key: 'mean_exec_time_ms', title: 'Mean Time (ms)', width: 140, sortable: true, renderType: 'text' },
      { key: 'rows', title: 'Rows', width: 100, sortable: true, renderType: 'text' },
      { key: 'shared_blks_hit_pct', title: 'Cache Hit %', width: 120, sortable: true, renderType: 'progress' },
      { key: 'temp_blks_written', title: 'Temp Blocks', width: 120, sortable: true, renderType: 'text' },
    ],
    features: { ...DEFAULT_FEATURES, search: true },
    view: 'monitoring/db-postgresql/query-analytics.vue',
    dataSource: 'dbPostgresqlStore.topQueries',
    description: 'Top PostgreSQL queries by execution time and frequency',
    position: 'postgresql-top-queries-table',
  },
  {
    datatableId: 'DBM30103',
    module: 'DBM',
    title: 'Table Stats',
    component: 'NDataTable',
    columns: [
      { key: 'schemaname', title: 'Schema', width: 130, sortable: true, renderType: 'text' },
      { key: 'tablename', title: 'Table', width: 200, sortable: true, renderType: 'text' },
      { key: 'n_live_tup', title: 'Live Tuples', width: 120, sortable: true, renderType: 'text' },
      { key: 'n_dead_tup', title: 'Dead Tuples', width: 120, sortable: true, renderType: 'text' },
      { key: 'dead_ratio', title: 'Dead Ratio %', width: 120, sortable: true, renderType: 'progress' },
      { key: 'seq_scan', title: 'Seq Scans', width: 100, sortable: true, renderType: 'text' },
      { key: 'idx_scan', title: 'Idx Scans', width: 100, sortable: true, renderType: 'text' },
      { key: 'bloat_pct', title: 'Bloat %', width: 100, sortable: true, renderType: 'progress' },
      { key: 'total_size_bytes', title: 'Total Size', width: 120, sortable: true, renderType: 'text' },
      { key: 'last_vacuum', title: 'Last Vacuum', width: 140, sortable: true, renderType: 'date' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'monitoring/db-postgresql/schema-browser.vue',
    dataSource: 'dbPostgresqlStore.tableStats',
    description: 'PostgreSQL table statistics with tuple counts, scan counts, and bloat',
    position: 'postgresql-table-stats-table',
  },
  {
    datatableId: 'DBM30104',
    module: 'DBM',
    title: 'Index Stats',
    component: 'NDataTable',
    columns: [
      { key: 'schemaname', title: 'Schema', width: 130, sortable: true, renderType: 'text' },
      { key: 'indexname', title: 'Index', width: 200, sortable: true, renderType: 'text' },
      { key: 'tablename', title: 'Table', width: 200, sortable: true, renderType: 'text' },
      { key: 'idx_scan', title: 'Idx Scans', width: 100, sortable: true, renderType: 'text' },
      { key: 'idx_tup_read', title: 'Tuples Read', width: 120, sortable: true, renderType: 'text' },
      { key: 'idx_tup_fetch', title: 'Tuples Fetched', width: 120, sortable: true, renderType: 'text' },
      { key: 'bloat_pct', title: 'Bloat %', width: 100, sortable: true, renderType: 'progress' },
      { key: 'index_size', title: 'Index Size', width: 120, sortable: true, renderType: 'text' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'monitoring/db-postgresql/schema-browser.vue',
    dataSource: 'dbPostgresqlStore.indexStats',
    description: 'PostgreSQL index statistics with scan counts, tuple reads, and bloat',
    position: 'postgresql-index-stats-table',
  },
];
