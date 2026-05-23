import type { DataTableDefinition } from './types';

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 20, pageSizes: [10, 20, 50, 100],
  search: false, filter: false, export: false, rowClick: true,
  rowSelection: false, striped: false, expandable: false,
};

export const DBM_COCKROACHDB_DATATABLES: DataTableDefinition[] = [
  {
    datatableId: 'DBM30601', module: 'DBM', title: 'Top Statements', component: 'NDataTable',
    columns: [
      { key: 'fingerprint', title: 'Fingerprint', width: 400, sortable: false, renderType: 'text' },
      { key: 'app_name', title: 'Application', width: 150, sortable: true, renderType: 'text' },
      { key: 'query_type', title: 'Type', width: 100, sortable: true, renderType: 'tag' },
      { key: 'count', title: 'Count', width: 80, sortable: true, renderType: 'text' },
      { key: 'latency_p99', title: 'P99 (ms)', width: 100, sortable: true, renderType: 'text' },
      { key: 'rows_read', title: 'Rows Read', width: 100, sortable: true, renderType: 'text' },
      { key: 'contention', title: 'Contention', width: 100, sortable: true, renderType: 'text' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, search: true },
    view: 'db-monitoring/cockroachdb/CockroachDBStatementsView.vue',
    dataSource: 'dbCockroachdbStore.statements',
    description: 'Top SQL statements by aggregate stats', position: 'crdb-statements-table',
  },
  {
    datatableId: 'DBM30602', module: 'DBM', title: 'Jobs List', component: 'NDataTable',
    columns: [
      { key: 'job_id', title: 'Job ID', width: 200, sortable: true, renderType: 'text' },
      { key: 'job_type', title: 'Type', width: 120, sortable: true, renderType: 'tag' },
      { key: 'description', title: 'Description', width: 250, sortable: false, renderType: 'text' },
      { key: 'status', title: 'Status', width: 100, sortable: true, renderType: 'tag' },
      { key: 'started', title: 'Started', width: 150, sortable: true, renderType: 'date' },
      { key: 'fraction_completed', title: 'Progress', width: 100, sortable: true, renderType: 'text' },
      { key: 'error', title: 'Error', width: 200, sortable: false, renderType: 'text' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/cockroachdb/CockroachDBJobsView.vue',
    dataSource: 'dbCockroachdbStore.jobs',
    description: 'CockroachDB background jobs list', position: 'crdb-jobs-table',
  },
  {
    datatableId: 'DBM30603', module: 'DBM', title: 'Changefeeds', component: 'NDataTable',
    columns: [
      { key: 'job_id', title: 'Job ID', width: 200, sortable: true, renderType: 'text' },
      { key: 'description', title: 'Description', width: 300, sortable: false, renderType: 'text' },
      { key: 'status', title: 'Status', width: 100, sortable: true, renderType: 'tag' },
      { key: 'high_water_timestamp', title: 'High Water', width: 180, sortable: true, renderType: 'date' },
      { key: 'error', title: 'Error', width: 200, sortable: false, renderType: 'text' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, search: true },
    view: 'db-monitoring/cockroachdb/CockroachDBChangefeedsView.vue',
    dataSource: 'dbCockroachdbStore.changefeeds',
    description: 'CockroachDB changefeed jobs and status', position: 'crdb-changefeeds-table',
  },
  {
    datatableId: 'DBM30604', module: 'DBM', title: 'Schema Tables', component: 'NDataTable',
    columns: [
      { key: 'database', title: 'Database', width: 120, sortable: true, renderType: 'text' },
      { key: 'table', title: 'Table', width: 150, sortable: true, renderType: 'text' },
      { key: 'estimated_row_count', title: 'Est. Rows', width: 120, sortable: true, renderType: 'text' },
      { key: 'indexes', title: 'Indexes', width: 80, sortable: true, renderType: 'text' },
      { key: 'total_reads', title: 'Reads', width: 100, sortable: true, renderType: 'text' },
      { key: 'total_writes', title: 'Writes', width: 100, sortable: true, renderType: 'text' },
      { key: 'last_read', title: 'Last Read', width: 150, sortable: true, renderType: 'date' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/cockroachdb/CockroachDBSchemaView.vue',
    dataSource: 'dbCockroachdbStore.tables',
    description: 'CockroachDB schema table statistics', position: 'crdb-schema-table',
  },
];
