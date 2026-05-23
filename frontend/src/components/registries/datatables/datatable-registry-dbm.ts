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

export const dbmDatatables: DatatableDef[] = [
  {
    id: 'DBM30701',
    title: 'Top Queries',
    columns: [
      { name: 'Fingerprint', key: 'query_fingerprint', sortable: true },
      { name: 'Kind', key: 'query_kind', sortable: true },
      { name: 'Count', key: 'total_count', sortable: true, format: 'number' },
      { name: 'Avg Duration', key: 'avg_duration_ms', sortable: true, format: 'duration' },
      { name: 'P95 Duration', key: 'p95_duration_ms', sortable: true, format: 'duration' },
      { name: 'P99 Duration', key: 'p99_duration_ms', sortable: true, format: 'duration' },
      { name: 'Read Rows', key: 'total_read_rows', sortable: true, format: 'number' },
      { name: 'Memory', key: 'total_memory_usage', sortable: true, format: 'bytes' },
      { name: 'Errors', key: 'error_count', sortable: true, format: 'number' },
    ],
    defaultSort: { key: 'total_count', order: 'desc' },
    pagination: { pageSize: 20, pageSizes: [10, 20, 50] },
  },
  {
    id: 'DBM30702',
    title: 'Table Parts Health',
    columns: [
      { name: 'Database', key: 'database', sortable: true },
      { name: 'Table', key: 'table', sortable: true },
      { name: 'Parts', key: 'active_parts_count', sortable: true, format: 'number' },
      { name: 'Rows', key: 'total_rows', sortable: true, format: 'number' },
      { name: 'Compressed', key: 'compressed_bytes', sortable: true, format: 'bytes' },
      { name: 'Uncompressed', key: 'uncompressed_bytes', sortable: true, format: 'bytes' },
      { name: 'Ratio', key: 'compression_ratio', sortable: true, format: 'number' },
      { name: 'Partitions', key: 'partition_count', sortable: true, format: 'number' },
      { name: 'Health', key: 'health', sortable: true, format: 'badge' },
    ],
    defaultSort: { key: 'active_parts_count', order: 'desc' },
    pagination: { pageSize: 20, pageSizes: [10, 20, 50] },
  },
  {
    id: 'DBM30703',
    title: 'Replica Status',
    columns: [
      { name: 'Database', key: 'database', sortable: true },
      { name: 'Table', key: 'table', sortable: true },
      { name: 'Replica', key: 'replica_name', sortable: true },
      { name: 'Leader', key: 'is_leader', sortable: true, format: 'badge' },
      { name: 'Delay', key: 'absolute_delay', sortable: true, format: 'duration' },
      { name: 'Queue', key: 'queue_size', sortable: true, format: 'number' },
      { name: 'Inserts', key: 'inserts_in_queue', sortable: true, format: 'number' },
      { name: 'Merges', key: 'merges_in_queue', sortable: true, format: 'number' },
      { name: 'Health', key: 'health', sortable: true, format: 'badge' },
    ],
    defaultSort: { key: 'absolute_delay', order: 'desc' },
    pagination: { pageSize: 20, pageSizes: [10, 20, 50] },
  },
  {
    id: 'DBM30704',
    title: 'Dictionary Status',
    columns: [
      { name: 'Database', key: 'database', sortable: true },
      { name: 'Name', key: 'name', sortable: true },
      { name: 'Status', key: 'status', sortable: true, format: 'badge' },
      { name: 'Elements', key: 'element_count', sortable: true, format: 'number' },
      { name: 'Bytes', key: 'bytes_allocated', sortable: true, format: 'bytes' },
      { name: 'Load Factor', key: 'load_factor', sortable: true, format: 'percent' },
      { name: 'Last Update', key: 'last_successful_update_time', sortable: true },
      { name: 'Last Error', key: 'last_exception' },
    ],
    defaultSort: { key: 'name', order: 'asc' },
    pagination: { pageSize: 20, pageSizes: [10, 20, 50] },
  },
];
