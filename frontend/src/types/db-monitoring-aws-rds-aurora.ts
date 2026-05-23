export interface AuroraCluster {
  id: string;
  organizationId: string;
  clusterIdentifier: string;
  clusterArn: string;
  engineType: 'aurora-mysql' | 'aurora-postgresql';
  engineVersion: string;
  clusterStatus: string;
  writerInstanceId?: string;
  readerInstanceIds: string[];
  clusterEndpoint?: string;
  readerEndpoint?: string;
  customEndpoints: Array<{ endpoint: string; targetInstances: string[] }>;
  availabilityZones: string[];
  isServerlessV2: boolean;
  minAcu?: number;
  maxAcu?: number;
  isGlobalDatabase: boolean;
  backtrackWindow?: number;
  parallelQueryEnabled: boolean;
  instanceCount: number;
  lastTopologySyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuroraInstance {
  id: string;
  instanceIdentifier: string;
  instanceArn?: string;
  instanceClass?: string;
  role: 'writer' | 'reader';
  availabilityZone?: string;
  status: string;
  isServerlessV2: boolean;
  currentAcu?: number;
  promotionTier: number;
  engineVersion?: string;
  lastStatusSyncAt?: string;
}

export interface AuroraTopology {
  clusterIdentifier: string;
  engineType: string;
  clusterStatus: string;
  writer: AuroraInstance;
  readers: AuroraInstance[];
  endpoints: Array<{ endpoint: string; type: string; targetInstances?: string[] }>;
  availabilityZones: string[];
}

export interface AuroraMetricPoint {
  timestamp: string;
  clusterIdentifier: string;
  instanceIdentifier: string;
  metricName: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
  count: number;
}

export interface AuroraTopSQL {
  sqlDigest: string;
  sqlText: string;
  waitEvent: string;
  loadAas: number;
  callsPerSecond: number;
  avgLatencyMs: number;
  rowsExamined: number;
  rowsSent: number;
}

export interface AuroraWaitEvent {
  waitEvent: string;
  waitEventType: string;
  totalLoad: number;
  pct: number;
  isAuroraStorage: boolean;
}

export interface AuroraPerformanceInsights {
  topSQL: AuroraTopSQL[];
  waitEvents: AuroraWaitEvent[];
  totalLoad: number;
}

export interface ACUCapacity {
  instanceIdentifier: string;
  currentAcu: number;
  minAcu: number;
  maxAcu: number;
  utilizationPct: number;
}

export interface AuroraScalingEvent {
  timestamp: string;
  instanceIdentifier: string;
  previousAcu: number;
  newAcu: number;
  direction: 'up' | 'down';
}

export interface AuroraServerlessStatus {
  instances: ACUCapacity[];
  scalingEvents: AuroraScalingEvent[];
  estimatedAcuHours: number;
}

export interface GlobalSecondaryCluster {
  clusterId: string;
  region: string;
  status: string;
  replicationLagMs?: number;
}

export interface AuroraGlobalDatabase {
  globalClusterArn: string;
  globalClusterIdentifier: string;
  primaryRegion: string;
  secondaryClusters: GlobalSecondaryCluster[];
  replicationStatus?: string;
  rpoLagSeconds?: number;
  failoverHistory: Array<{ timestamp: string; previousPrimary: string; newPrimary: string; type: string }>;
}

export interface AuroraEvent {
  timestamp: string;
  clusterIdentifier: string;
  eventType: 'failover' | 'scaling' | 'topology_change' | 'backtrack_alert';
  eventData: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AuroraFeatures {
  parallelQuery: { enabled: boolean; attempted: number; executed: number; hitRatio?: number } | null;
  backtrack: { enabled: boolean; windowSeconds: number; changeRecordsStored: number; windowAlert: boolean } | null;
  queryPlanManagement: { captureMode: string; enforcementMode: string; approvedPlans: number; rejectedPlans: number } | null;
  clone: { isClone: boolean; sourceClusterArn?: string; cloneType?: string } | null;
}

export interface AuroraClusterListResult {
  clusters: AuroraCluster[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuroraEventListResult {
  events: AuroraEvent[];
  total: number;
}

export interface AwsRdsAuroraOverviewStats {
  totalInstances: number;
  healthyInstances: number;
  warningInstances: number;
  criticalInstances: number;
}
