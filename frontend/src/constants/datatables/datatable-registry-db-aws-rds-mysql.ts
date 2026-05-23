import type { DataTableDefinition } from './types';

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 20, pageSizes: [10, 20, 50, 100],
  search: false, filter: false, export: false, rowClick: true,
  rowSelection: false, striped: false, expandable: false,
};

// Allocated ID range: DBM30451-DBM30455
export const DBM_AWS_RDS_MYSQL_DATATABLES: DataTableDefinition[] = [
  {
    datatableId: 'DBM30451', module: 'DBM', title: 'RDS MySQL Instance List', component: 'NDataTable',
    columns: [
      { key: 'displayName', title: 'Display Name', width: 200, sortable: true, renderType: 'text' },
      { key: 'dbInstanceIdentifier', title: 'Identifier', width: 220, sortable: true, renderType: 'text' },
      { key: 'engine', title: 'Engine', width: 80, sortable: true, renderType: 'tag' },
      { key: 'engineVersion', title: 'Version', width: 100, sortable: true, renderType: 'text' },
      { key: 'dbInstanceClass', title: 'Class', width: 130, sortable: true, renderType: 'text' },
      { key: 'dbStatus', title: 'Status', width: 100, sortable: true, renderType: 'tag' },
      { key: 'allocatedStorage', title: 'Storage (GB)', width: 110, sortable: true, renderType: 'text' },
      { key: 'multiAz', title: 'Multi-AZ', width: 90, sortable: true, renderType: 'tag' },
      { key: 'availabilityZone', title: 'AZ', width: 110, sortable: true, renderType: 'text' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/aws-rds-mysql/InstanceListView.vue',
    dataSource: 'dbAwsRdsMysqlStore.instances',
    description: 'List of all registered RDS MySQL/MariaDB instances', position: 'rds-mysql-instance-list',
  },
  {
    datatableId: 'DBM30452', module: 'DBM', title: 'Top Queries', component: 'NDataTable',
    columns: [
      { key: 'query_text', title: 'Query', width: 350, sortable: false, renderType: 'text' },
      { key: 'exec_count', title: 'Executions', width: 110, sortable: true, renderType: 'text' },
      { key: 'total_latency_ms', title: 'Total Latency (ms)', width: 150, sortable: true, renderType: 'text' },
      { key: 'avg_latency_ms', title: 'Avg Latency (ms)', width: 130, sortable: true, renderType: 'text' },
      { key: 'rows_examined', title: 'Rows Examined', width: 120, sortable: true, renderType: 'text' },
      { key: 'rows_sent', title: 'Rows Sent', width: 100, sortable: true, renderType: 'text' },
      { key: 'full_scans', title: 'Full Scans', width: 100, sortable: true, renderType: 'text' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/aws-rds-mysql/InstanceDetailView.vue',
    dataSource: 'dbAwsRdsMysqlStore.queries',
    description: 'Top queries by total latency', position: 'rds-mysql-top-queries',
  },
  {
    datatableId: 'DBM30453', module: 'DBM', title: 'Slow Queries', component: 'NDataTable',
    columns: [
      { key: 'timestamp', title: 'Time', width: 180, sortable: true, renderType: 'date' },
      { key: 'query_text', title: 'Query', width: 350, sortable: false, renderType: 'text' },
      { key: 'avg_latency_ms', title: 'Query Time (ms)', width: 130, sortable: true, renderType: 'text' },
      { key: 'lock_time_ms', title: 'Lock Time (ms)', width: 120, sortable: true, renderType: 'text' },
      { key: 'rows_examined', title: 'Rows Examined', width: 120, sortable: true, renderType: 'text' },
      { key: 'rows_sent', title: 'Rows Sent', width: 100, sortable: true, renderType: 'text' },
      { key: 'user', title: 'User', width: 100, sortable: true, renderType: 'text' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/aws-rds-mysql/InstanceDetailView.vue',
    dataSource: 'dbAwsRdsMysqlStore.slowQueries',
    description: 'Slow query log entries', position: 'rds-mysql-slow-queries',
  },
  {
    datatableId: 'DBM30454', module: 'DBM', title: 'RDS Events', component: 'NDataTable',
    columns: [
      { key: 'timestamp', title: 'Time', width: 180, sortable: true, renderType: 'date' },
      { key: 'event_category', title: 'Category', width: 150, sortable: true, renderType: 'tag' },
      { key: 'source_type', title: 'Source', width: 120, sortable: true, renderType: 'text' },
      { key: 'message', title: 'Message', width: 500, sortable: false, renderType: 'text' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/aws-rds-mysql/InstanceDetailView.vue',
    dataSource: 'dbAwsRdsMysqlStore.events',
    description: 'RDS instance events', position: 'rds-mysql-events',
  },
  {
    datatableId: 'DBM30455', module: 'DBM', title: 'Process List', component: 'NDataTable',
    columns: [
      { key: 'pid', title: 'PID', width: 80, sortable: true, renderType: 'text' },
      { key: 'name', title: 'Process', width: 150, sortable: true, renderType: 'text' },
      { key: 'cpuUsedPc', title: 'CPU %', width: 90, sortable: true, renderType: 'text' },
      { key: 'memUsedPc', title: 'Memory %', width: 100, sortable: true, renderType: 'text' },
      { key: 'vss', title: 'VSS (KB)', width: 100, sortable: true, renderType: 'text' },
      { key: 'rss', title: 'RSS (KB)', width: 100, sortable: true, renderType: 'text' },
    ],
    features: { ...DEFAULT_FEATURES },
    view: 'db-monitoring/aws-rds-mysql/InstanceDetailView.vue',
    dataSource: 'enhancedMonitoring.processList',
    description: 'OS process list from Enhanced Monitoring', position: 'rds-mysql-process-list',
  },
];
