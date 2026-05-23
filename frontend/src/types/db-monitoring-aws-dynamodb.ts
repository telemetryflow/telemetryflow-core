export interface AwsDynamodbInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AwsDynamodbOverviewStats {
  totalInstances: number;
  healthyInstances: number;
  warningInstances: number;
  criticalInstances: number;
}

export interface AwsDynamodbInstanceListResult {
  instances: AwsDynamodbInstance[];
  total: number;
}

export interface DynamoDBTable {
  id: string;
  name: string;
  displayName?: string;
  instanceId: string;
  region: string;
  tableArn?: string;
  tableStatus: string;
  billingMode: string;
  tableClass: string;
  itemCount: number;
  sizeBytes: number;
  keySchema: Record<string, unknown>[];
  attributeDefinitions: Record<string, unknown>[];
  gsiConfig: Record<string, unknown>[];
  lsiConfig: Record<string, unknown>[];
  replicaRegions: Record<string, unknown>[];
  autoScalingConfig: Record<string, unknown>;
  streamEnabled: boolean;
  streamArn?: string;
  streamViewType?: string;
  sseEnabled: boolean;
  pointInTimeRecovery: boolean;
  ttlEnabled: boolean;
  ttlAttribute?: string;
  tags: Record<string, string>;
  provider: string;
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
  lastSeenAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  throttleCount24h?: number;
}

export interface DynamoDBTableListResult {
  items: DynamoDBTable[];
  total: number;
}

export interface DynamoDBMetricPoint {
  timestamp: string;
  metricName: string;
  value: number;
  labels: Record<string, string>;
}

export interface DynamoDBAlertRule {
  id: string;
  name: string;
  description?: string;
  ruleType: string;
  metricName: string;
  operator: string;
  threshold: number;
  durationSeconds: number;
  state: 'OK' | 'FIRING' | 'RESOLVED';
  severity: string;
  enabled: boolean;
  lastTriggeredAt?: string;
  evaluationCount: number;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBCapacityData {
  tableName: string;
  billingMode: string;
  consumed: DynamoDBMetricPoint[];
  provisioned: DynamoDBMetricPoint[];
  autoScalingConfig: Record<string, unknown>;
}

export interface DynamoDBIndexMetrics {
  table: string;
  indexes: Array<{
    indexName: string;
    status: string;
    metrics: DynamoDBMetricPoint[];
  }>;
}
