// ---------------------------------------------------------------------------
// MongoDB Atlas Database Monitoring - Type Definitions
// ---------------------------------------------------------------------------

// Connection types
export interface AtlasConnection {
  id: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  atlasGroupId: string;
  atlasOrgId?: string;
  publicKey: string;
  status: 'active' | 'error' | 'disabled';
  lastSyncAt?: string;
  lastError?: string;
  collectionInterval: number;
  clusterCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AtlasCluster {
  id: string;
  connectionId: string;
  organizationId: string;
  workspaceId: string;
  clusterName: string;
  clusterType: 'REPLICASET' | 'SHARDED' | 'GEOSHARDED';
  mongodbVersion?: string;
  stateName: string;
  providerName: string;
  instanceSizeName: string;
  regionName?: string;
  diskSizeGb?: number;
  backupEnabled: boolean;
  pitEnabled: boolean;
  autoScalingCompute?: Record<string, unknown>;
  autoScalingDisk?: Record<string, unknown>;
  connectionStringSrv?: string;
  metadata?: Record<string, unknown>;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AtlasMetricDataPoint {
  timestamp: string;
  measurementName: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
  count: number;
  units?: string;
}

export interface AtlasMetricsResponse {
  measurements: Array<{
    name: string;
    units: string;
    dataPoints: AtlasMetricDataPoint[];
  }>;
}

export interface AtlasSlowQuery {
  id?: string;
  timestamp: string;
  namespace: string;
  operation: string;
  fingerprint: string;
  executionTimeMs: number;
  docsExamined: number;
  docsReturned: number;
  keysExamined: number;
  planSummary?: string;
  clientHost?: string;
  targetingRatio?: number;
}

export interface AtlasSuggestedIndex {
  id: string;
  namespace: string;
  keyPattern: Record<string, number>;
  impactScore: number;
  affectedQueryCount: number;
  estimatedDiskUsageBytes?: number;
}

export interface AtlasAlert {
  id: string;
  alertConfigId: string;
  eventTypeName: string;
  status: 'OPEN' | 'CLOSED' | 'TRACKING';
  severity: 'critical' | 'warning' | 'info';
  metricName?: string;
  currentValue?: number;
  threshold?: number;
  created: string;
  resolved?: string;
  hostnameAndPort?: string;
  clusterName?: string;
}

export interface AtlasBackupSnapshot {
  id: string;
  clusterName: string;
  snapshotType: string;
  status: string;
  created: string;
  expires?: string;
  sizeBytes: number;
  mongodVersion?: string;
  snapshotIds?: string[];
}

export interface AtlasOverviewStats {
  totalConnections: number;
  activeConnections: number;
  totalClusters: number;
  healthyClusters: number;
  warningClusters: number;
  criticalClusters: number;
  openAlerts: number;
}

export interface AtlasConnectionListResult {
  connections: AtlasConnection[];
  total: number;
}

export interface AtlasClusterListResult {
  clusters: AtlasCluster[];
  total: number;
}

// Request DTOs
export interface CreateAtlasConnectionRequest {
  name: string;
  atlasGroupId: string;
  atlasOrgId?: string;
  publicKey: string;
  privateKey: string;
  collectionInterval?: number;
}

export interface UpdateAtlasConnectionRequest {
  name?: string;
  publicKey?: string;
  privateKey?: string;
  collectionInterval?: number;
  status?: 'active' | 'error' | 'disabled';
}

export interface AtlasMetricsRequest {
  metricNames?: string;
  from?: string;
  to?: string;
  step?: string;
  period?: string;
}

export interface AtlasSlowQueryParams {
  from?: string;
  to?: string;
  threshold?: number;
  limit?: number;
  namespace?: string;
}
