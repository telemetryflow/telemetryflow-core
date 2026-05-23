// ── Credential ─────────────────────────────────────────────────────────────────

export interface AwsRdsPostgresqlCredential {
  id: string;
  organizationId: string;
  name: string;
  credentialType: 'access_key' | 'role_assumption';
  accessKeyId?: string;
  roleArn?: string;
  region: string;
  isValid: boolean;
  lastValidatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Instance ──────────────────────────────────────────────────────────────────

export interface AwsRdsPostgresqlInstance {
  id: string;
  organizationId: string;
  credentialId: string;
  dbInstanceIdentifier: string;
  displayName?: string;
  engine: 'postgres';
  engineVersion: string;
  dbInstanceClass: string;
  storageType: string;
  allocatedStorage: number;
  maxAllocatedStorage?: number;
  multiAz: boolean;
  availabilityZone: string;
  endpointAddress: string;
  endpointPort: number;
  vpcId?: string;
  enhancedMonitoringEnabled: boolean;
  performanceInsightsEnabled: boolean;
  status: 'available' | 'modifying' | 'backing-up' | 'creating' | 'deleting' | 'failed' | 'upgrading' | 'restoring';
  readReplicaSourceIdentifier?: string;
  readReplicaIdentifiers: string[];
  deletionProtection: boolean;
  collectionEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export interface AwsRdsPostgresqlMetricPoint {
  timestamp: string;
  value: number;
}

export interface AwsRdsPostgresqlMetricSeries {
  metricName: string;
  source: 'cloudwatch' | 'enhanced_monitoring' | 'performance_insights';
  points: AwsRdsPostgresqlMetricPoint[];
}

// ── Queries (pg_stat_statements) ──────────────────────────────────────────────

export interface AwsRdsPostgresqlQueryEntry {
  queryId: string;
  queryText: string;
  databaseName: string;
  user: string;
  source: 'pg_stat_statements';
  execCount: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  rowsProcessed: number;
  sharedBlksHit: number;
  sharedBlksRead: number;
  tempBlksWritten: number;
  walRecords: number;
  walBytes: number;
}

// ── Events ────────────────────────────────────────────────────────────────────

export interface AwsRdsPostgresqlEvent {
  timestamp: string;
  sourceType: 'db-instance' | 'db-parameter-group' | 'db-security-group' | 'db-snapshot';
  eventCategory: 'creation' | 'deletion' | 'configuration' | 'maintenance' | 'failover' | 'notification';
  message: string;
}

// ── Performance Insights ──────────────────────────────────────────────────────

export interface AwsRdsPostgresqlPIResult {
  timestamp: string;
  metric: string;
  dimensionGroup: string;
  dimensionValue: string;
  value: number;
}

// ── Overview ──────────────────────────────────────────────────────────────────

export interface AwsRdsPostgresqlOverviewStats {
  totalInstances: number;
  healthyInstances: number;
  warningInstances: number;
  criticalInstances: number;
  avgCpu: number;
  totalConnections: number;
  totalStorage: number;
  highLagCount: number;
  maxTransactionIdUsage: number;
}

// ── Replication ───────────────────────────────────────────────────────────────

export interface AwsRdsPostgresqlReplicaInfo {
  instanceId: string;
  replicaLag: number;
  replicationState: string;
  applicationName: string;
  clientAddr: string;
}

// ── List Results ──────────────────────────────────────────────────────────────

export interface AwsRdsPostgresqlInstanceListResult {
  instances: AwsRdsPostgresqlInstance[];
  total: number;
}

export interface AwsRdsPostgresqlCredentialListResult {
  credentials: AwsRdsPostgresqlCredential[];
  total: number;
}
