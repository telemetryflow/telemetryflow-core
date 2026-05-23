export type DatabaseType = 'mysql' | 'mariadb' | 'percona';
export type InstanceStatus = 'online' | 'offline' | 'degraded' | 'unknown';
export type RuleOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
export type RuleSeverity = 'info' | 'warning' | 'critical';

export interface DatabaseInstance {
  id: string;
  name: string;
  displayName: string;
  type: DatabaseType;
  host: string;
  port: number;
  username?: string;
  databaseName: string | null;
  version: string | null;
  flavor: string | null;
  status: InstanceStatus;
  lastSeenAt: string | null;
  tags: Record<string, string>;
  tlsEnabled?: boolean;
  collectionIntervalSeconds: number;
  queryAnalyticsEnabled: boolean;
  schemaMonitoringEnabled: boolean;
  includeDatabases: string[];
  excludeDatabases: string[];
  organizationId: string;
  workspaceId: string | null;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface MetricTimeSeries {
  metricName: string;
  instanceId: string;
  data: MetricDataPoint[];
}

export interface MetricSummary {
  metricName: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface InstanceMetricsSummary {
  instanceId: string;
  metrics: MetricSummary[];
}

export interface QueryDigest {
  digest: string;
  digestText: string;
  schemaName: string;
  calls: number;
  totalTimeUs: number;
  avgTimeUs: number;
  maxTimeUs: number;
  rowsSent: number;
  rowsExamined: number;
  rowsAffected: number;
  tmpDiskTables: number;
  noIndexUsed: boolean;
  firstSeen: string;
  lastSeen: string;
  // Percona extended fields
  bytesSent?: number;
  bytesReceived?: number;
  tmpTables?: number;
  filesort?: boolean;
  fullScan?: boolean;
  fullJoin?: boolean;
  qcHit?: boolean;
}

export interface SlowQuery {
  digest: string;
  digest_text: string;
  schema_name: string;
  avg_time_us: number;
  max_time_us: number;
  calls: number;
  last_seen: string;
}

export interface SchemaDatabase {
  database_name: string;
  table_count: number;
  total_size_bytes: number;
}

export interface SchemaTable {
  table_name: string;
  engine: string;
  row_count: number;
  data_size_bytes: number;
  index_size_bytes: number;
  auto_increment_usage_pct: number;
  fragmentation_ratio: number;
}

export interface SchemaOverview {
  databases: SchemaDatabase[];
  tables: SchemaTable[];
}

export interface ReplicationStatus {
  instanceId: string;
  metrics: MetricSummary[];
}

export interface MonitoringRule {
  id: string;
  instanceId: string;
  metricName: string;
  operator: RuleOperator;
  threshold: number;
  durationSeconds: number;
  severity: RuleSeverity;
  enabled: boolean;
  notificationChannelIds: string[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstanceStats {
  instanceCount: number;
  onlineCount: number;
  degradedCount: number;
  offlineCount: number;
}

export interface RegisterInstancePayload {
  name: string;
  displayName?: string;
  type: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  databaseName?: string;
  tlsEnabled?: boolean;
  tags?: Record<string, string>;
  collectionIntervalSeconds?: number;
  queryAnalyticsEnabled?: boolean;
  schemaMonitoringEnabled?: boolean;
  includeDatabases?: string[];
  excludeDatabases?: string[];
}

export interface UpdateInstancePayload extends Partial<RegisterInstancePayload> {}

export interface CreateRulePayload {
  instanceId: string;
  metricName: string;
  operator: RuleOperator;
  threshold: number;
  durationSeconds?: number;
  severity: RuleSeverity;
  enabled?: boolean;
  notificationChannelIds?: string[];
}

export interface UpdateRulePayload extends Partial<CreateRulePayload> {}
