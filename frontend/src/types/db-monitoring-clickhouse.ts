export type ClickHouseInstanceStatus =
  | "healthy"
  | "degraded"
  | "unreachable"
  | "unknown";

export interface ClickHouseInstance {
  id: string;
  name: string;
  host: string;
  httpPort: number;
  nativePort: number;
  clusterName?: string;
  version?: string;
  status: ClickHouseInstanceStatus;
  lastSeenAt?: string;
  metadata?: Record<string, unknown>;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  avg: number;
  min: number;
  max: number;
}

export interface TimeSeriesSeries {
  metric_name: string;
  data: TimeSeriesDataPoint[];
}

export interface TimeSeriesResponse {
  instance_id: string;
  from: string;
  to: string;
  step: string;
  series: TimeSeriesSeries[];
}

export interface QueryFingerprintAggregate {
  query_fingerprint: string;
  query_kind: string;
  total_count: number;
  error_count: number;
  avg_duration_ms: number;
  p50_duration_ms: number;
  p95_duration_ms: number;
  p99_duration_ms: number;
  max_duration_ms: number;
  total_read_rows: number;
  total_read_bytes: number;
  total_memory_usage: number;
  sample_query: string;
}

export interface QueryFingerprintResponse {
  data: QueryFingerprintAggregate[];
  total: number;
  page: number;
  limit: number;
}

export interface FingerprintDetail {
  fingerprint: string;
  sample_queries: Array<{
    query_id: string;
    query: string;
    event_time: string;
    duration_ms: number;
    read_rows: number;
    memory_usage: number;
    exception?: string;
  }>;
  stats: QueryFingerprintAggregate;
}

export interface TableHealthInfo {
  database: string;
  table: string;
  engine: string;
  active_parts_count: number;
  total_rows: number;
  compressed_bytes: number;
  uncompressed_bytes: number;
  compression_ratio: number;
  partition_count: number;
  active_merges: number;
  pending_mutations: number;
  health: "healthy" | "warning" | "critical";
}

export interface TableHealthResponse {
  tables: TableHealthInfo[];
}

export interface ReplicaStatusInfo {
  database: string;
  table: string;
  replica_name: string;
  is_leader: boolean;
  is_readonly: boolean;
  is_session_expired: boolean;
  absolute_delay: number;
  queue_size: number;
  inserts_in_queue: number;
  merges_in_queue: number;
  future_parts: number;
  parts_to_check: number;
  total_replicas: number;
  active_replicas: number;
  health: "healthy" | "lagging" | "readonly" | "expired";
}

export interface ReplicationStatusResponse {
  replicas: ReplicaStatusInfo[];
}

export interface ClusterReplicaInfo {
  replica_num: number;
  host_name: string;
  host_address: string;
  port: number;
  is_local: boolean;
  errors_count: number;
  slowdowns_count: number;
  estimated_recovery_time: number;
}

export interface ClusterShardInfo {
  shard_num: number;
  shard_weight: number;
  replicas: ClusterReplicaInfo[];
}

export interface ClusterTopologyResponse {
  cluster_name: string;
  shards: ClusterShardInfo[];
}

export interface DiskInfo {
  name: string;
  path: string;
  free_space: number;
  total_space: number;
  unreserved_space: number;
  keep_free_space: number;
  type: string;
  used_percent: number;
}

export interface StoragePolicyVolume {
  volume_name: string;
  volume_priority: number;
  disks: string[];
  max_data_part_size: number;
  move_factor: number;
}

export interface StoragePolicy {
  policy_name: string;
  volumes: StoragePolicyVolume[];
}

export interface TableCompressionInfo {
  database: string;
  table: string;
  compressed_bytes: number;
  uncompressed_bytes: number;
  compression_ratio: number;
  marks_bytes: number;
}

export interface StorageResponse {
  disks: DiskInfo[];
  policies: StoragePolicy[];
  table_compression: TableCompressionInfo[];
}

export interface DictionaryInfo {
  database: string;
  name: string;
  status: string;
  origin: string;
  type: string;
  element_count: number;
  bytes_allocated: number;
  load_factor: number;
  loading_duration: number;
  last_successful_update_time: string;
  last_exception: string;
}

export interface DictionaryResponse {
  dictionaries: DictionaryInfo[];
}

export interface ClickHouseInstanceListResult {
  instances: ClickHouseInstance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClickHouseInstanceQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  clusterName?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface MetricsQueryParams {
  metric_names?: string;
  from?: string;
  to?: string;
  step?: "1m" | "1h" | "1d";
}

export interface QueriesQueryParams {
  from?: string;
  to?: string;
  query_kind?: string;
  limit?: number;
}
