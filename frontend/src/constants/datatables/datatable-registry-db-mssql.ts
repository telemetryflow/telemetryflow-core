import type { DataTableDefinition } from './types';

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 20, pageSizes: [10, 20, 50, 100],
  search: false, filter: false, export: false, rowClick: true,
  rowSelection: false, striped: false, expandable: false,
};

export const DBM_MSSQL_DATATABLES: DataTableDefinition[] = [
  {
    datatableId: 'DBM30901', module: 'DBM', title: 'MSSQL Instances', component: 'NDataTable',
    columns: [
      { key: 'name', title: 'Name', sortable: true },
      { key: 'host', title: 'Host', sortable: true },
      { key: 'port', title: 'Port', sortable: true },
      { key: 'edition', title: 'Edition', sortable: true },
      { key: 'status', title: 'Status', sortable: true, renderType: 'tag' },
      { key: 'lastSeenAt', title: 'Last Seen', sortable: true, renderType: 'date' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/mssql/MssqlInstanceListView.vue',
    dataSource: 'dbMssqlStore.instances',
    description: 'List of all registered SQL Server instances', position: 'mssql-instances',
  },
  {
    datatableId: 'DBM30902', module: 'DBM', title: 'Top Queries', component: 'NDataTable',
    columns: [
      { key: 'query_hash', title: 'Query Hash', sortable: true },
      { key: 'sql_text', title: 'SQL Text', sortable: false },
      { key: 'database_name', title: 'Database', sortable: true },
      { key: 'execution_count', title: 'Executions', sortable: true },
      { key: 'total_worker_time_us', title: 'CPU Time (us)', sortable: true },
      { key: 'total_logical_reads', title: 'Logical Reads', sortable: true },
      { key: 'total_elapsed_time_us', title: 'Duration (us)', sortable: true },
    ],
    features: { ...DEFAULT_FEATURES, search: true, pageSize: 50 },
    view: 'db-monitoring/mssql/MssqlInstanceDetailView.vue',
    dataSource: 'dbMssqlStore.queryStats',
    description: 'Top queries by resource usage', position: 'mssql-top-queries',
  },
  {
    datatableId: 'DBM30903', module: 'DBM', title: 'Wait Statistics', component: 'NDataTable',
    columns: [
      { key: 'wait_type', title: 'Wait Type', sortable: true },
      { key: 'wait_category', title: 'Category', sortable: true, renderType: 'tag' },
      { key: 'waiting_tasks_count', title: 'Tasks', sortable: true },
      { key: 'wait_time_ms', title: 'Wait Time (ms)', sortable: true },
      { key: 'signal_wait_time_ms', title: 'Signal Wait (ms)', sortable: true },
      { key: 'resource_wait_time_ms', title: 'Resource Wait (ms)', sortable: true },
    ],
    features: { ...DEFAULT_FEATURES, search: true, pageSize: 50 },
    view: 'db-monitoring/mssql/MssqlInstanceDetailView.vue',
    dataSource: 'dbMssqlStore.waitStats',
    description: 'Wait types with total wait time', position: 'mssql-wait-stats',
  },
  {
    datatableId: 'DBM30904', module: 'DBM', title: 'Monitoring Rules', component: 'NDataTable',
    columns: [
      { key: 'metricName', title: 'Metric', sortable: true },
      { key: 'operator', title: 'Operator', sortable: true },
      { key: 'threshold', title: 'Threshold', sortable: true },
      { key: 'severity', title: 'Severity', sortable: true, renderType: 'badge' },
      { key: 'enabled', title: 'Enabled', sortable: true, renderType: 'switch' },
      { key: 'cooldownSeconds', title: 'Cooldown (s)', sortable: true },
    ],
    features: { ...DEFAULT_FEATURES, search: true },
    view: 'db-monitoring/mssql/MssqlInstanceDetailView.vue',
    dataSource: 'dbMssqlStore.rules',
    description: 'Alert monitoring rules for this instance', position: 'mssql-rules',
  },
];
