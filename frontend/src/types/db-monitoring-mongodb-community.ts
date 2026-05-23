// ---------------------------------------------------------------------------
// MongoDB Community Monitoring Types
// ---------------------------------------------------------------------------

export interface MongoInstance {
  id: string;
  organizationId: string;
  instanceAddress: string;
  replicaSet: string | null;
  memberState: string;
  mongodbVersion: string | null;
  isMongos: boolean;
  lastSeenAt: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MongoReplicaSet {
  id: string;
  organizationId: string;
  name: string;
  memberCount: number;
  primaryInstanceId: string | null;
  status: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReplicaSetWithMembers extends MongoReplicaSet {
  members: MongoInstance[];
}

export interface MetricDataPoint {
  timestamp: string;
  metricName: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
  count: number;
}

export interface TimeSeriesResponse {
  instanceId: string;
  from: string;
  to: string;
  step: number;
  table: string;
  series: MetricDataPoint[];
}

export interface SlowQuery {
  timestamp: string;
  database: string;
  collection: string;
  operation: string;
  fingerprint: string;
  millis: number;
  docsExamined: number;
  keysExamined: number;
  docsReturned: number;
}

export interface QueryFingerprint {
  fingerprint: string;
  operation: string;
  database: string;
  collection: string;
  totalCount: number;
  avgMillis: number;
  maxMillis: number;
  sumDocsExamined: number;
  sumDocsReturned: number;
}

export interface MongoCollectionStats {
  database: string;
  collection: string;
  documentCount: number;
  dataSize: number;
  indexSize: number;
  avgDocSize: number;
  indexCount: number;
}

export interface MongoIndexStats {
  name: string;
  keys: Record<string, number>;
  size: number;
  accesses: number;
  hitRatio: number;
}

export interface WiredTigerMetrics {
  instanceId: string;
  metrics: MetricDataPoint[];
}

export interface MongoSummary {
  totalInstances: number;
  healthyInstances: number;
  warningInstances: number;
  criticalInstances: number;
  unknownInstances: number;
  totalReplicaSets: number;
  healthyReplicaSets: number;
  instances: MongoInstance[];
}

export interface PaginatedInstances {
  data: MongoInstance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InstanceStatus {
  id: string;
  instanceAddress: string;
  replicaSet: string | null;
  memberState: string;
  mongodbVersion: string | null;
  status: string;
  latestMetrics: MetricDataPoint[];
}

export interface OplogMetrics {
  instanceId: string;
  metrics: MetricDataPoint[];
}

export interface ShardingOverview {
  mongosInstances: MongoInstance[];
  totalShards: number;
  databases: unknown[];
}

export interface ShardingChunks {
  instanceId: string;
  metrics: MetricDataPoint[];
}
