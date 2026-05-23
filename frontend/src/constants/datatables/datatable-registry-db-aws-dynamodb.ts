/**
 * DataTable Registry — AWS DynamoDB (DBM)
 * 4 datatable registry definitions (DBM30301–DBM30304)
 */

import type { DataTableDefinition } from './types';

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 20, pageSizes: [10, 20, 50, 100],
  search: false, filter: false, export: false, rowClick: true,
  rowSelection: false, striped: false, expandable: false,
};

export const DBM_AWS_DYNAMODB_DATATABLES: DataTableDefinition[] = [
  {
    datatableId: 'DBM30301',
    module: 'DBM',
    title: 'DynamoDB Tables',
    component: 'NDataTable',
    columns: [
      { key: 'type_icon', title: '', width: 40, sortable: false, renderType: 'custom' },
      { key: 'name', title: 'Table Name', width: 220, sortable: true, renderType: 'text' },
      { key: 'region', title: 'Region', width: 140, sortable: true, renderType: 'tag' },
      { key: 'billingMode', title: 'Billing Mode', width: 130, sortable: true, renderType: 'tag' },
      { key: 'status', title: 'Status', width: 110, sortable: true, renderType: 'tag' },
      { key: 'itemCount', title: 'Items', width: 110, sortable: true, renderType: 'text' },
      { key: 'sizeBytes', title: 'Size', width: 120, sortable: true, renderType: 'text' },
      { key: 'throttleCount24h', title: 'Throttles (24h)', width: 140, sortable: true, renderType: 'text' },
      { key: 'lastSeenAt', title: 'Last Seen', width: 140, sortable: true, renderType: 'date' },
      { key: 'actions', title: '', width: 80, sortable: false, renderType: 'actions' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'monitoring/db-dynamodb/tables.vue',
    dataSource: 'dbDynamoDBStore.tables',
    description: 'DynamoDB table inventory with billing mode, item count, size, and throttle status',
    position: 'dynamodb-tables-table',
  },
  {
    datatableId: 'DBM30302',
    module: 'DBM',
    title: 'GSI/LSI Indexes',
    component: 'NDataTable',
    columns: [
      { key: 'indexName', title: 'Index Name', width: 220, sortable: true, renderType: 'text' },
      { key: 'type', title: 'Type', width: 100, sortable: true, renderType: 'tag' },
      { key: 'status', title: 'Status', width: 110, sortable: true, renderType: 'tag' },
      { key: 'itemCount', title: 'Items', width: 110, sortable: true, renderType: 'text' },
      { key: 'sizeBytes', title: 'Size', width: 120, sortable: true, renderType: 'text' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'monitoring/db-dynamodb/indexes.vue',
    dataSource: 'dbDynamoDBStore.indexes',
    description: 'Global Secondary Index (GSI) and Local Secondary Index (LSI) details per table',
    position: 'dynamodb-indexes-table',
  },
  {
    datatableId: 'DBM30303',
    module: 'DBM',
    title: 'Top Accessed Keys',
    component: 'NDataTable',
    columns: [
      { key: 'partitionKey', title: 'Partition Key', width: 300, sortable: true, renderType: 'text' },
      { key: 'requestCount', title: 'Requests', width: 140, sortable: true, renderType: 'text' },
      { key: 'percentage', title: '% of Total', width: 120, sortable: true, renderType: 'progress' },
    ],
    features: { ...DEFAULT_FEATURES, search: true },
    view: 'monitoring/db-dynamodb/hot-keys.vue',
    dataSource: 'dbDynamoDBStore.topAccessedKeys',
    description: 'Top accessed partition keys by request count and percentage of total traffic',
    position: 'dynamodb-top-accessed-keys-table',
  },
  {
    datatableId: 'DBM30304',
    module: 'DBM',
    title: 'Top Throttled Keys',
    component: 'NDataTable',
    columns: [
      { key: 'partitionKey', title: 'Partition Key', width: 300, sortable: true, renderType: 'text' },
      { key: 'requestCount', title: 'Throttled Requests', width: 160, sortable: true, renderType: 'text' },
      { key: 'percentage', title: '% of Total', width: 120, sortable: true, renderType: 'progress' },
    ],
    features: { ...DEFAULT_FEATURES, search: true },
    view: 'monitoring/db-dynamodb/hot-keys.vue',
    dataSource: 'dbDynamoDBStore.topThrottledKeys',
    description: 'Top throttled partition keys indicating hot key or uneven traffic distribution',
    position: 'dynamodb-top-throttled-keys-table',
  },
];
