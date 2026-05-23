import type { DataTableDefinition } from './types';

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 20, pageSizes: [10, 20, 50, 100],
  search: false, filter: false, export: false, rowClick: true,
  rowSelection: false, striped: false, expandable: false,
};

export const DBM_CLICKHOUSE_DATATABLES: DataTableDefinition[] = [
  {
    datatableId: 'DBM30201', module: 'DBM', title: 'ClickHouse Instance List', component: 'NDataTable',
    columns: [
      { key: 'name', title: 'Name', width: 200, sortable: true, renderType: 'text' },
      { key: 'host', title: 'Host', width: 200, sortable: true, renderType: 'text' },
      { key: 'clusterName', title: 'Cluster', width: 150, sortable: true, renderType: 'text' },
      { key: 'version', title: 'Version', width: 120, sortable: true, renderType: 'text' },
      { key: 'status', title: 'Status', width: 100, sortable: true, renderType: 'tag' },
      { key: 'lastSeenAt', title: 'Last Seen', width: 150, sortable: true, renderType: 'date' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/clickhouse/ClickHouseInstanceListView.vue',
    dataSource: 'dbClickhouseStore.instances',
    description: 'ClickHouse instance list', position: 'ch-instance-table',
  },
  {
    datatableId: 'DBM30202', module: 'DBM', title: 'Top Queries', component: 'NDataTable',
    columns: [
      { key: 'query_fingerprint', title: 'Query Fingerprint', width: 400, sortable: false, renderType: 'text' },
      { key: 'query_kind', title: 'Kind', width: 80, sortable: true, renderType: 'tag' },
      { key: 'total_count', title: 'Count', width: 80, sortable: true, renderType: 'text' },
      { key: 'avg_duration_ms', title: 'Avg (ms)', width: 100, sortable: true, renderType: 'text' },
      { key: 'p95_duration_ms', title: 'P95 (ms)', width: 100, sortable: true, renderType: 'text' },
      { key: 'total_read_rows', title: 'Read Rows', width: 120, sortable: true, renderType: 'text' },
      { key: 'total_memory_usage', title: 'Memory', width: 100, sortable: true, renderType: 'text' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, search: true },
    view: 'db-monitoring/clickhouse/ClickHouseQueryAnalyticsView.vue',
    dataSource: 'dbClickhouseStore.queries',
    description: 'Top query fingerprints by aggregate stats', position: 'ch-top-queries-table',
  },
  {
    datatableId: 'DBM30203', module: 'DBM', title: 'Table Parts Health', component: 'NDataTable',
    columns: [
      { key: 'database', title: 'Database', width: 120, sortable: true, renderType: 'text' },
      { key: 'table', title: 'Table', width: 150, sortable: true, renderType: 'text' },
      { key: 'engine', title: 'Engine', width: 100, sortable: true, renderType: 'text' },
      { key: 'active_parts_count', title: 'Parts', width: 80, sortable: true, renderType: 'text' },
      { key: 'total_rows', title: 'Rows', width: 120, sortable: true, renderType: 'text' },
      { key: 'compressed_bytes', title: 'Compressed', width: 120, sortable: true, renderType: 'text' },
      { key: 'compression_ratio', title: 'Ratio', width: 80, sortable: true, renderType: 'text' },
      { key: 'health', title: 'Health', width: 100, sortable: true, renderType: 'tag' },
    ],
    features: { ...DEFAULT_FEATURES, filter: true },
    view: 'db-monitoring/clickhouse/ClickHouseTablesView.vue',
    dataSource: 'dbClickhouseStore.tables',
    description: 'ClickHouse table parts health overview', position: 'ch-tables-table',
  },
  {
    datatableId: 'DBM30204', module: 'DBM', title: 'Replica Status', component: 'NDataTable',
    columns: [
      { key: 'database', title: 'Database', width: 120, sortable: true, renderType: 'text' },
      { key: 'table', title: 'Table', width: 150, sortable: true, renderType: 'text' },
      { key: 'replica_name', title: 'Replica', width: 120, sortable: true, renderType: 'text' },
      { key: 'is_leader', title: 'Leader', width: 80, sortable: true, renderType: 'tag' },
      { key: 'absolute_delay', title: 'Lag (s)', width: 100, sortable: true, renderType: 'text' },
      { key: 'queue_size', title: 'Queue', width: 80, sortable: true, renderType: 'text' },
      { key: 'active_replicas', title: 'Active', width: 80, sortable: true, renderType: 'text' },
      { key: 'health', title: 'Health', width: 100, sortable: true, renderType: 'tag' },
    ],
    features: DEFAULT_FEATURES,
    view: 'db-monitoring/clickhouse/ClickHouseReplicationView.vue',
    dataSource: 'dbClickhouseStore.replication',
    description: 'ClickHouse replica replication status', position: 'ch-replica-table',
  },
];
