import type { DataTableDefinition } from './types';

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 20, pageSizes: [10, 20, 50, 100],
  search: false, filter: false, export: false, rowClick: true,
  rowSelection: false, striped: false, expandable: false,
};

// Allocated ID range: DBM31401-DBM31404
export const DBM_TIMESCALEDB_DATATABLES: DataTableDefinition[] = [
  {
    datatableId: 'DBM31401', module: 'DBM', title: 'TimescaleDB Instance List', component: 'NDataTable',
    columns: [
      { key: 'name', title: 'Name', width: 200, sortable: true, renderType: 'text' },
      { key: 'host', title: 'Host', width: 200, sortable: true, renderType: 'text' },
      { key: 'databaseName', title: 'Database', width: 150, sortable: true, renderType: 'text' },
      { key: 'pgVersion', title: 'PG Version', width: 100, sortable: true, renderType: 'text' },
      { key: 'tsdbVersion', title: 'TSDB Version', width: 120, sortable: true, renderType: 'text' },
      { key: 'status', title: 'Status', width: 100, sortable: true, renderType: 'tag' },
      { key: 'isDistributed', title: 'Distributed', width: 100, sortable: true, renderType: 'tag' },
      { key: 'lastSeenAt', title: 'Last Seen', width: 170, sortable: true, renderType: 'date' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/timescaledb/TimescaledbInstanceListView.vue',
    dataSource: 'dbTimescaledbStore.instances',
    description: 'TimescaleDB instance list', position: 'tsdb-instance-table',
  },
  {
    datatableId: 'DBM31402', module: 'DBM', title: 'Hypertables', component: 'NDataTable',
    columns: [
      { key: 'hypertableSchema', title: 'Schema', width: 100, sortable: true, renderType: 'text' },
      { key: 'hypertableName', title: 'Hypertable', width: 200, sortable: true, renderType: 'text' },
      { key: 'numChunks', title: 'Chunks', width: 80, sortable: true, renderType: 'text' },
      { key: 'uncompressedChunkCount', title: 'Uncompressed', width: 120, sortable: true, renderType: 'text' },
      { key: 'compressedChunkCount', title: 'Compressed', width: 100, sortable: true, renderType: 'text' },
      { key: 'totalSizeBytes', title: 'Total Size', width: 120, sortable: true, renderType: 'text' },
      { key: 'compressionRatio', title: 'Ratio', width: 80, sortable: true, renderType: 'text' },
      { key: 'isCompressionEnabled', title: 'Compression', width: 100, sortable: true, renderType: 'tag' },
    ],
    features: { ...DEFAULT_FEATURES, filter: true },
    view: 'db-monitoring/timescaledb/TimescaledbInstanceDetailView.vue',
    dataSource: 'dbTimescaledbStore.hypertables',
    description: 'TimescaleDB hypertable overview', position: 'tsdb-hypertable-table',
  },
  {
    datatableId: 'DBM31403', module: 'DBM', title: 'Background Jobs', component: 'NDataTable',
    columns: [
      { key: 'applicationName', title: 'Job Name', width: 250, sortable: true, renderType: 'text' },
      { key: 'lastRunStatus', title: 'Last Status', width: 120, sortable: true, renderType: 'tag' },
      { key: 'scheduleInterval', title: 'Schedule', width: 130, sortable: true, renderType: 'text' },
      { key: 'totalRuns', title: 'Total Runs', width: 100, sortable: true, renderType: 'text' },
      { key: 'totalFailures', title: 'Failures', width: 100, sortable: true, renderType: 'text' },
    ],
    features: DEFAULT_FEATURES,
    view: 'db-monitoring/timescaledb/TimescaledbInstanceDetailView.vue',
    dataSource: 'dbTimescaledbStore.jobs',
    description: 'TimescaleDB background job status', position: 'tsdb-job-table',
  },
  {
    datatableId: 'DBM31404', module: 'DBM', title: 'Continuous Aggregates', component: 'NDataTable',
    columns: [
      { key: 'caggSchema', title: 'Schema', width: 100, sortable: true, renderType: 'text' },
      { key: 'caggName', title: 'Aggregate Name', width: 250, sortable: true, renderType: 'text' },
      { key: 'materialized', title: 'Materialized', width: 120, sortable: true, renderType: 'tag' },
      { key: 'lastRefresh', title: 'Last Refresh', width: 170, sortable: true, renderType: 'date' },
    ],
    features: DEFAULT_FEATURES,
    view: 'db-monitoring/timescaledb/TimescaledbInstanceDetailView.vue',
    dataSource: 'dbTimescaledbStore.continuousAggregates',
    description: 'TimescaleDB continuous aggregate status', position: 'tsdb-cagg-table',
  },
];
