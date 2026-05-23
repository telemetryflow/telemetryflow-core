import type { DataTableDefinition } from './types';

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 20, pageSizes: [10, 20, 50, 100],
  search: false, filter: false, export: false, rowClick: true,
  rowSelection: false, striped: false, expandable: false,
};

// Allocated ID range: DBM30501-DBM30505
export const DBM_AWS_RDS_AURORA_DATATABLES: DataTableDefinition[] = [
  {
    datatableId: 'DBM30501', module: 'DBM', title: 'Aurora Cluster List', component: 'NDataTable',
    columns: [
      { key: 'clusterIdentifier', title: 'Cluster', width: 220, sortable: true, renderType: 'text' },
      { key: 'engineType', title: 'Engine', width: 140, sortable: true, renderType: 'tag' },
      { key: 'engineVersion', title: 'Version', width: 160, sortable: true, renderType: 'text' },
      { key: 'clusterStatus', title: 'Status', width: 110, sortable: true, renderType: 'tag' },
      { key: 'instanceCount', title: 'Instances', width: 100, sortable: true, renderType: 'text' },
      { key: 'isServerlessV2', title: 'Serverless', width: 110, sortable: true, renderType: 'tag' },
      { key: 'isGlobalDatabase', title: 'Global', width: 90, sortable: true, renderType: 'tag' },
      { key: 'clusterEndpoint', title: 'Endpoint', width: 320, sortable: false, renderType: 'text' },
      { key: 'lastTopologySyncAt', title: 'Last Sync', width: 180, sortable: true, renderType: 'date' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/aws-rds-aurora/InstanceListView.vue',
    dataSource: 'dbAwsRdsAuroraStore.clusters',
    description: 'List of all registered Aurora clusters', position: 'aurora-cluster-list',
  },
  {
    datatableId: 'DBM30502', module: 'DBM', title: 'Top SQL Statements', component: 'NDataTable',
    columns: [
      { key: 'sqlDigest', title: 'Digest', width: 110, sortable: true, renderType: 'text' },
      { key: 'sqlText', title: 'Query', width: 400, sortable: false, renderType: 'text' },
      { key: 'waitEvent', title: 'Wait Event', width: 130, sortable: true, renderType: 'tag' },
      { key: 'loadAas', title: 'Load (AAS)', width: 110, sortable: true, renderType: 'text' },
      { key: 'callsPerSecond', title: 'Calls/s', width: 100, sortable: true, renderType: 'text' },
      { key: 'avgLatencyMs', title: 'Avg Latency (ms)', width: 130, sortable: true, renderType: 'text' },
      { key: 'rowsExamined', title: 'Rows Examined', width: 120, sortable: true, renderType: 'text' },
      { key: 'rowsSent', title: 'Rows Sent', width: 100, sortable: true, renderType: 'text' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/aws-rds-aurora/InstanceDetailView.vue',
    dataSource: 'dbAwsRdsAuroraStore.performanceInsights.topSQL',
    description: 'Top SQL statements by load from Performance Insights', position: 'aurora-top-sql',
  },
  {
    datatableId: 'DBM30503', module: 'DBM', title: 'Wait Events', component: 'NDataTable',
    columns: [
      { key: 'waitEvent', title: 'Wait Event', width: 300, sortable: true, renderType: 'text' },
      { key: 'waitEventType', title: 'Type', width: 120, sortable: true, renderType: 'tag' },
      { key: 'totalLoad', title: 'Total Load', width: 120, sortable: true, renderType: 'text' },
      { key: 'pct', title: '%', width: 80, sortable: true, renderType: 'progress' },
      { key: 'isAuroraStorage', title: 'Aurora Storage', width: 130, sortable: true, renderType: 'tag' },
    ],
    features: { ...DEFAULT_FEATURES, search: false },
    view: 'db-monitoring/aws-rds-aurora/InstanceDetailView.vue',
    dataSource: 'dbAwsRdsAuroraStore.performanceInsights.waitEvents',
    description: 'Wait event breakdown from Performance Insights', position: 'aurora-wait-events-table',
  },
  {
    datatableId: 'DBM30504', module: 'DBM', title: 'Cluster Events', component: 'NDataTable',
    columns: [
      { key: 'timestamp', title: 'Timestamp', width: 180, sortable: true, renderType: 'date' },
      { key: 'clusterIdentifier', title: 'Cluster', width: 200, sortable: true, renderType: 'text' },
      { key: 'eventType', title: 'Event Type', width: 140, sortable: true, renderType: 'tag' },
      { key: 'eventData', title: 'Details', width: 400, sortable: false, renderType: 'text' },
      { key: 'severity', title: 'Severity', width: 100, sortable: true, renderType: 'badge' },
    ],
    features: { ...DEFAULT_FEATURES, filter: true },
    view: 'db-monitoring/aws-rds-aurora/InstanceDetailView.vue',
    dataSource: 'dbAwsRdsAuroraStore.events.events',
    description: 'Recent Aurora cluster events (failover, scaling, topology changes)', position: 'aurora-events-table',
  },
  {
    datatableId: 'DBM30505', module: 'DBM', title: 'Scaling Events', component: 'NDataTable',
    columns: [
      { key: 'timestamp', title: 'Timestamp', width: 180, sortable: true, renderType: 'date' },
      { key: 'instanceIdentifier', title: 'Instance', width: 250, sortable: true, renderType: 'text' },
      { key: 'previousAcu', title: 'Previous ACU', width: 120, sortable: true, renderType: 'text' },
      { key: 'newAcu', title: 'New ACU', width: 120, sortable: true, renderType: 'text' },
      { key: 'direction', title: 'Direction', width: 110, sortable: true, renderType: 'tag' },
    ],
    features: DEFAULT_FEATURES,
    view: 'db-monitoring/aws-rds-aurora/InstanceDetailView.vue',
    dataSource: 'dbAwsRdsAuroraStore.serverlessStatus.scalingEvents',
    description: 'Serverless v2 ACU scaling events', position: 'aurora-scaling-events',
  },
];
