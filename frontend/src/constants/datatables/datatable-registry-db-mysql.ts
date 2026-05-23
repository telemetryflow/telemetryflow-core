import type { DataTableDefinition } from './types';

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 20, pageSizes: [10, 20, 50, 100],
  search: false, filter: false, export: false, rowClick: true,
  rowSelection: false, striped: false, expandable: false,
};

export const DBM_MYSQL_DATATABLES: DataTableDefinition[] = [
  {
    datatableId: 'DBM30001', module: 'DBM', title: 'MySQL Instance List', component: 'NDataTable',
    columns: [
      { key: 'name', title: 'Name', width: 200, sortable: true, renderType: 'text' },
      { key: 'type', title: 'Type', width: 100, sortable: true, renderType: 'tag' },
      { key: 'host_port', title: 'Host:Port', width: 200, sortable: true, renderType: 'text' },
      { key: 'version', title: 'Version', width: 120, sortable: true, renderType: 'text' },
      { key: 'status', title: 'Status', width: 100, sortable: true, renderType: 'tag' },
      { key: 'last_seen_at', title: 'Last Seen', width: 150, sortable: true, renderType: 'date' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'monitoring/db-mysql/instances.vue', dataSource: 'dbMysqlStore.instances',
    description: 'MySQL/MariaDB/Percona instance list', position: 'mysql-instance-table',
  },
  {
    datatableId: 'DBM30002', module: 'DBM', title: 'Query Digests', component: 'NDataTable',
    columns: [
      { key: 'digest_text', title: 'Query', width: 400, sortable: false, renderType: 'text' },
      { key: 'schema_name', title: 'Schema', width: 120, sortable: true, renderType: 'text' },
      { key: 'calls', title: 'Calls', width: 80, sortable: true, renderType: 'text' },
      { key: 'avg_time_us', title: 'Avg Time (μs)', width: 120, sortable: true, renderType: 'text' },
      { key: 'max_time_us', title: 'Max Time (μs)', width: 120, sortable: true, renderType: 'text' },
      { key: 'rows_examined', title: 'Rows Examined', width: 120, sortable: true, renderType: 'text' },
      { key: 'no_index_used', title: 'No Index', width: 80, sortable: true, renderType: 'tag' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, search: true }, view: 'monitoring/db-mysql/query-analytics.vue',
    dataSource: 'dbMysqlStore.queryDigests', description: 'Query digest analytics', position: 'mysql-query-table',
  },
  {
    datatableId: 'DBM30003', module: 'DBM', title: 'Slow Queries', component: 'NDataTable',
    columns: [
      { key: 'digest_text', title: 'Query', width: 400, sortable: false, renderType: 'text' },
      { key: 'schema_name', title: 'Schema', width: 120, sortable: true, renderType: 'text' },
      { key: 'avg_time_us', title: 'Avg Time (μs)', width: 120, sortable: true, renderType: 'text' },
      { key: 'calls', title: 'Calls', width: 80, sortable: true, renderType: 'text' },
      { key: 'last_seen', title: 'Last Seen', width: 150, sortable: true, renderType: 'date' },
    ],
    features: DEFAULT_FEATURES, view: 'monitoring/db-mysql/query-analytics.vue',
    dataSource: 'dbMysqlStore.slowQueries', description: 'Slow query log', position: 'mysql-slow-query-table',
  },
  {
    datatableId: 'DBM30004', module: 'DBM', title: 'Monitoring Rules', component: 'NDataTable',
    columns: [
      { key: 'metricName', title: 'Metric', width: 250, sortable: true, renderType: 'text' },
      { key: 'operator', title: 'Op', width: 60, sortable: false, renderType: 'text' },
      { key: 'threshold', title: 'Threshold', width: 100, sortable: true, renderType: 'text' },
      { key: 'severity', title: 'Severity', width: 100, sortable: true, renderType: 'tag' },
      { key: 'enabled', title: 'Enabled', width: 80, sortable: true, renderType: 'tag' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: DEFAULT_FEATURES, view: 'monitoring/db-mysql/instance-detail.vue',
    dataSource: 'dbMysqlStore.rules', description: 'Monitoring alert rules', position: 'mysql-rules-table',
  },
];
