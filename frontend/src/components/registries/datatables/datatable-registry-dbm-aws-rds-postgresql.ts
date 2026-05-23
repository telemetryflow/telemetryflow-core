export interface DatatableColumnDef {
  name: string;
  key: string;
  sortable?: boolean;
  format?: 'number' | 'bytes' | 'percent' | 'duration' | 'badge';
}

export interface DatatableDef {
  id: string;
  title: string;
  columns: DatatableColumnDef[];
  defaultSort: { key: string; order: 'asc' | 'desc' };
  pagination: { pageSize: number; pageSizes: number[] };
}

export const dbmAwsRdsPostgresqlDatatables: DatatableDef[] = [
  {
    id: 'DBM30406',
    title: 'Instance List',
    columns: [
      { name: 'Instance', key: 'dbInstanceIdentifier', sortable: true },
      { name: 'Status', key: 'status', sortable: true, format: 'badge' },
      { name: 'Engine Version', key: 'engineVersion', sortable: true },
      { name: 'Class', key: 'dbInstanceClass', sortable: true },
      { name: 'Storage (GB)', key: 'allocatedStorage', sortable: true, format: 'number' },
      { name: 'Multi-AZ', key: 'multiAz', sortable: true, format: 'badge' },
      { name: 'AZ', key: 'availabilityZone', sortable: true },
      { name: 'Replicas', key: 'readReplicaCount', sortable: true, format: 'number' },
      { name: 'PI Enabled', key: 'performanceInsightsEnabled', sortable: true, format: 'badge' },
    ],
    defaultSort: { key: 'dbInstanceIdentifier', order: 'asc' },
    pagination: { pageSize: 20, pageSizes: [10, 20, 50] },
  },
  {
    id: 'DBM30407',
    title: 'Top Queries',
    columns: [
      { name: 'Query', key: 'queryText', sortable: false },
      { name: 'Database', key: 'databaseName', sortable: true },
      { name: 'User', key: 'user', sortable: true },
      { name: 'Executions', key: 'execCount', sortable: true, format: 'number' },
      { name: 'Avg Latency', key: 'avgLatencyMs', sortable: true, format: 'duration' },
      { name: 'Total Latency', key: 'totalLatencyMs', sortable: true, format: 'duration' },
      { name: 'Rows', key: 'rowsProcessed', sortable: true, format: 'number' },
      { name: 'Shared Blks Hit', key: 'sharedBlksHit', sortable: true, format: 'number' },
      { name: 'Shared Blks Read', key: 'sharedBlksRead', sortable: true, format: 'number' },
      { name: 'WAL Records', key: 'walRecords', sortable: true, format: 'number' },
    ],
    defaultSort: { key: 'totalLatencyMs', order: 'desc' },
    pagination: { pageSize: 20, pageSizes: [10, 20, 50] },
  },
  {
    id: 'DBM30408',
    title: 'Slow Queries',
    columns: [
      { name: 'Query', key: 'queryText', sortable: false },
      { name: 'Database', key: 'databaseName', sortable: true },
      { name: 'User', key: 'user', sortable: true },
      { name: 'Executions', key: 'execCount', sortable: true, format: 'number' },
      { name: 'Avg Latency', key: 'avgLatencyMs', sortable: true, format: 'duration' },
      { name: 'Rows Processed', key: 'rowsProcessed', sortable: true, format: 'number' },
      { name: 'Temp Blks Written', key: 'tempBlksWritten', sortable: true, format: 'number' },
      { name: 'Blks Read', key: 'sharedBlksRead', sortable: true, format: 'number' },
    ],
    defaultSort: { key: 'avgLatencyMs', order: 'desc' },
    pagination: { pageSize: 20, pageSizes: [10, 20, 50] },
  },
  {
    id: 'DBM30409',
    title: 'Events',
    columns: [
      { name: 'Time', key: 'timestamp', sortable: true },
      { name: 'Category', key: 'eventCategory', sortable: true, format: 'badge' },
      { name: 'Source', key: 'sourceType', sortable: true },
      { name: 'Message', key: 'message', sortable: false },
    ],
    defaultSort: { key: 'timestamp', order: 'desc' },
    pagination: { pageSize: 20, pageSizes: [10, 20, 50] },
  },
  {
    id: 'DBM30410',
    title: 'Process List',
    columns: [
      { name: 'PID', key: 'pid', sortable: true, format: 'number' },
      { name: 'Database', key: 'datname', sortable: true },
      { name: 'User', key: 'usename', sortable: true },
      { name: 'State', key: 'state', sortable: true, format: 'badge' },
      { name: 'Query', key: 'query', sortable: false },
      { name: 'Duration', key: 'query_start', sortable: true, format: 'duration' },
      { name: 'Wait Event', key: 'wait_event_type', sortable: true },
      { name: 'Client', key: 'client_addr', sortable: true },
    ],
    defaultSort: { key: 'query_start', order: 'asc' },
    pagination: { pageSize: 20, pageSizes: [10, 20, 50] },
  },
];
