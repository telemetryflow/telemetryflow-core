// ── Credential ────────────────────────────────────────────────────────────

export interface AwsCredential {
  id: string;
  organizationId: string;
  name: string;
  credentialType: "access_key" | "role_assumption";
  accessKeyId?: string;
  roleArn?: string;
  externalId?: string;
  region: string;
  isValid: boolean;
  lastValidatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AwsCredentialListResult {
  items: AwsCredential[];
  total: number;
}

// ── Instance ─────────────────────────────────────────────────────────────

export interface AwsRdsMysqlInstance {
  id: string;
  organizationId: string;
  workspaceId?: string;
  credentialId: string;
  dbInstanceIdentifier: string;
  displayName?: string;
  engine: string;
  engineVersion?: string;
  dbInstanceClass?: string;
  storageType?: string;
  allocatedStorage?: number;
  maxAllocatedStorage?: number;
  storageEncrypted: boolean;
  multiAz: boolean;
  availabilityZone?: string;
  endpointAddress?: string;
  endpointPort?: number;
  vpcId?: string;
  subnetGroup?: string;
  parameterGroup?: string;
  dbStatus: string;
  performanceInsightsEnabled: boolean;
  enhancedMonitoringEnabled: boolean;
  enhancedMonitoringInterval?: number;
  isReadReplica: boolean;
  sourceDbIdentifier?: string;
  readReplicaIdentifiers: string[];
  backupRetentionPeriod?: number;
  preferredBackupWindow?: string;
  preferredMaintenanceWindow?: string;
  pendingModifiedValues?: any;
  agentConnectionId?: string;
  collectionEnabled: boolean;
  lastMetadataRefreshAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AwsRdsMysqlInstanceListResult {
  items: AwsRdsMysqlInstance[];
  total: number;
}

export interface DiscoveredInstance {
  dbInstanceIdentifier: string;
  engine: string;
  engineVersion: string;
  dbInstanceClass: string;
  dbStatus: string;
  endpoint?: string;
  multiAz: boolean;
  storageEncrypted: boolean;
  allocatedStorage: number;
}

export interface DiscoverInstancesResult {
  candidates: DiscoveredInstance[];
  total: number;
}

// ── Metrics ──────────────────────────────────────────────────────────────

export interface RdsMysqlMetricPoint {
  timestamp: string;
  metric_name: string;
  value: number;
}

// ── Queries ──────────────────────────────────────────────────────────────

export interface RdsMysqlQueryEntry {
  query_digest: string;
  query_text: string;
  exec_count: number;
  total_latency_ms: number;
  avg_latency_ms: number;
  rows_examined: number;
  rows_sent: number;
  full_scans?: number;
  tmp_disk_tables?: number;
}

export interface RdsMysqlQueryListResult {
  items: RdsMysqlQueryEntry[];
  total: number;
}

// ── Events ───────────────────────────────────────────────────────────────

export interface RdsMysqlEvent {
  instance_id: string;
  source_type: string;
  event_category: string;
  message: string;
  timestamp: string;
}

export interface RdsMysqlEventListResult {
  items: RdsMysqlEvent[];
  total: number;
}

// ── Performance Insights ─────────────────────────────────────────────────

export interface RdsMysqlPiMetric {
  metric: string;
  dimension_group: string;
  dimension_value: string;
  value: number;
  timestamp: string;
}

// ── Overview ─────────────────────────────────────────────────────────────

export interface AwsRdsMysqlOverviewStats {
  totalInstances: number;
  healthyInstances: number;
  warningInstances: number;
  criticalInstances: number;
  mysqlInstances: number;
  mariadbInstances: number;
  replicaInstances: number;
  totalStorage: number;
}
