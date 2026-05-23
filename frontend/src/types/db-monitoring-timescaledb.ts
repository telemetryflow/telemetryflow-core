// ─── Instance ─────────────────────────────────────────────────────────────────

export interface TimescaledbInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  databaseName: string;
  pgVersion: string | null;
  tsdbVersion: string | null;
  status: "healthy" | "warning" | "critical" | "unknown" | "offline";
  isDistributed: boolean;
  lastSeenAt: string | null;
  tags: Record<string, string>;
  organizationId: string;
  workspaceId: string | null;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TimescaledbInstanceListResult {
  instances: TimescaledbInstance[];
  total: number;
  page: number;
  limit: number;
}

export interface TimescaledbOverviewStats {
  totalInstances: number;
  healthyInstances: number;
  warningInstances: number;
  criticalInstances: number;
  offlineInstances: number;
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface MetricsQueryParams {
  metric_names?: string;
  from?: string;
  to?: string;
  step?: string;
}

export interface TimeSeriesResponse {
  instance_id: string;
  from: string;
  to: string;
  step: string;
  series: TimeSeriesSeries[];
}

export interface TimeSeriesSeries {
  metric_name: string;
  data: TimeSeriesDataPoint[];
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  avg: number;
  min: number;
  max: number;
}

// ─── Hypertables ──────────────────────────────────────────────────────────────

export interface HypertableInfo {
  hypertableSchema: string;
  hypertableName: string;
  numChunks?: number;
  uncompressedChunkCount?: number;
  compressedChunkCount?: number;
  totalSizeBytes?: number;
  uncompressedTotalBytes?: number;
  compressedTotalBytes?: number;
  compressionRatio?: number;
  isCompressionEnabled?: boolean;
  chunkInterval?: string;
}

export interface HypertableListResponse {
  hypertables: HypertableInfo[];
}

// ─── Chunks ───────────────────────────────────────────────────────────────────

export interface ChunkInfo {
  metricName: string;
  metricValue: number;
}

export interface ChunkListResponse {
  chunks: ChunkInfo[];
}

// ─── Continuous Aggregates ────────────────────────────────────────────────────

export interface ContinuousAggregateInfo {
  caggSchema: string;
  caggName: string;
  [key: string]: unknown;
}

export interface ContinuousAggregateListResponse {
  continuousAggregates: ContinuousAggregateInfo[];
}

// ─── Compression ──────────────────────────────────────────────────────────────

export interface CompressionStat {
  metricName: string;
  metricValue: number;
}

export interface CompressionStatsResponse {
  compressionStats: CompressionStat[];
}

// ─── Retention ────────────────────────────────────────────────────────────────

export interface RetentionPolicy {
  metricName: string;
  metricValue: number;
}

export interface RetentionPolicyListResponse {
  retentionPolicies: RetentionPolicy[];
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export interface JobInfo {
  applicationName: string;
  lastRunStatus?: string;
  scheduleInterval?: string;
  totalRuns?: number;
  totalFailures?: number;
  [key: string]: unknown;
}

export interface JobListResponse {
  jobs: JobInfo[];
}

export interface JobHistoryEntry {
  metricName: string;
  metricValue: number;
  timestamp: string;
}

export interface JobHistoryResponse {
  history: JobHistoryEntry[];
}

// ─── Data Nodes ───────────────────────────────────────────────────────────────

export interface DataNodeInfo {
  nodeName: string;
  [key: string]: unknown;
}

export interface DataNodeListResponse {
  dataNodes: DataNodeInfo[];
}
