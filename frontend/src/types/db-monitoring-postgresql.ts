export type PostgreSQLInstanceStatus =
  | "healthy"
  | "degraded"
  | "unreachable"
  | "unknown";

export interface DatabaseInstance {
  id: string;
  name: string;
  displayName: string;
  type: string;
  host: string;
  port: number;
  version: string;
  provider: string;
  region: string;
  status: PostgreSQLInstanceStatus;
  connectionConfig: {
    host: string;
    port: number;
    user: string;
    dbname: string;
    sslmode: string;
  };
  collectionConfig: {
    instanceInterval: number;
    queryInterval: number;
    tableInterval: number;
  };
  lastSeenAt: string;
  metadata: Record<string, unknown>;
  tags: Record<string, string>;
  organizationId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostgreSQLOverview {
  totalInstances: number;
  healthyCount: number;
  degradedCount: number;
  unreachableCount: number;
  aggregateTPS: number;
  topSlowQueries: QueryPerformance[];
  recentAlerts: Array<{
    id: string;
    instanceId: string;
    instanceName: string;
    severity: "info" | "warning" | "critical";
    message: string;
    triggeredAt: string;
  }>;
}

export interface MetricDatapoint {
  timestamp: string;
  value: number;
}

export interface MetricTimeSeries {
  metricName: string;
  labels: Record<string, string>;
  datapoints: MetricDatapoint[];
}

export interface QueryPerformance {
  queryid: string;
  fingerprint: string;
  queryText: string;
  calls: number;
  totalExecTimeMs: number;
  meanExecTimeMs: number;
  maxExecTimeMs: number;
  rows: number;
  sharedBlksHitPct: number;
  tempBlksWritten: number;
}

export interface QueryExplain {
  plan: string[];
  formattedPlan: string;
  totalCost: number;
  executionTimeMs: number;
  planningTimeMs: number;
}

export interface TableStat {
  schemaname: string;
  tablename: string;
  liveTup: number;
  deadTup: number;
  deadTupleRatio: number;
  seqScan: number;
  idxScan: number;
  tableSize: number;
  indexSize: number;
  totalSize: number;
  lastVacuum: string | null;
  lastAutovacuum: string | null;
  lastAnalyze: string | null;
}

export interface IndexStat {
  schemaname: string;
  tablename: string;
  indexname: string;
  idxScan: number;
  idxTupRead: number;
  idxTupFetch: number;
  idxBlksRead: number;
  idxBlksHit: number;
  indexSize: number;
  isUnused: boolean;
  bloatPct: number;
}

export interface VacuumProgressEntry {
  tableName: string;
  phase: string;
  progressPct: number;
}

export interface VacuumStatus {
  workersActive: number;
  tablesNeedingVacuum: number;
  xidAgePct: number;
  deadTuplesTotal: number;
  vacuumProgress: VacuumProgressEntry[];
}

export interface ReplicationStandby {
  applicationName: string;
  clientAddr: string;
  state: string;
  writeLagSec: number;
  flushLagSec: number;
  replayLagSec: number;
  lagBytes: number;
}

export interface ReplicationSlot {
  slotName: string;
  slotType: string;
  active: boolean;
  retainedBytes: number;
}

export interface ReplicationStatus {
  isPrimary: boolean;
  standbys: ReplicationStandby[];
  slots: ReplicationSlot[];
}

export interface LockEntry {
  pid: number;
  query: string;
  lockType: string;
  waitDuration: number;
  blockingPid: number | null;
}

export interface LockInfo {
  lockCount: number;
  blockedCount: number;
  longestWaitSec: number;
  locksByType: Record<string, number>;
  blockingTree: LockEntry[];
}

export interface CreateInstancePayload {
  name: string;
  displayName?: string;
  host: string;
  port: number;
  user: string;
  password: string;
  dbname: string;
  sslmode?: string;
  provider?: string;
  region?: string;
  tags?: Record<string, string>;
  collectionConfig?: {
    instanceInterval?: number;
    queryInterval?: number;
    tableInterval?: number;
  };
}

export interface UpdateInstancePayload extends Partial<CreateInstancePayload> {}

export interface MetricsQueryParams {
  metricNames?: string[];
  from?: string;
  to?: string;
  step?: string;
  timezone?: string;
}

export interface QueriesQueryParams {
  sortBy?: string;
  order?: "ASC" | "DESC";
  limit?: number;
  from?: string;
  to?: string;
}

export interface TablesQueryParams {
  sortBy?: string;
  order?: "ASC" | "DESC";
  limit?: number;
  schema?: string;
}

export interface IndexesQueryParams {
  unusedOnly?: boolean;
  bloatMin?: number;
}
