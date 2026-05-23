export type DatabaseType =
  | "mysql"
  | "mariadb"
  | "percona"
  | "postgresql"
  | "mongodb"
  | "mongodb-atlas"
  | "rds-mysql"
  | "rds-mariadb"
  | "aurora-mysql"
  | "aurora-postgresql"
  | "dynamodb"
  | "clickhouse"
  | "cockroachdb"
  | "timescaledb"
  | "sqlite3"
  | "mssql";

export type Provider =
  | "self-hosted"
  | "aws-rds"
  | "aws-aurora"
  | "aws-dynamodb"
  | "azure-sql"
  | "azure-managed-instance"
  | "azure-cosmosdb"
  | "mongodb-atlas"
  | "gcp-cloudsql"
  | "gcp-alloydb"
  | "docker"
  | "kubernetes"
  | "other";

export type InstanceStatus =
  | "online"
  | "offline"
  | "degraded"
  | "unknown"
  | "maintenance";
export type EnvironmentType = "production" | "staging" | "development" | "test";
export type RuleOperator = "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
export type RuleSeverity = "info" | "warning" | "critical";

export interface InstanceTag {
  id?: string;
  key: string;
  value: string;
}

export interface CollectionConfig {
  collectionIntervalSeconds: number;
  queryAnalyticsEnabled: boolean;
  schemaMonitoringEnabled: boolean;
  includeDatabases: string[];
  excludeDatabases: string[];
  typeSpecificToggles: Record<string, boolean>;
}

export interface ConnectionConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  ssl?: boolean;
  sslMode?: string;
  authMechanism?: string;
  authSource?: string;
  connectionString?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  roleArn?: string;
  apiKey?: string;
  apiSecret?: string;
  filePath?: string;
  databaseName?: string;
  [key: string]: unknown;
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
  cooldownSeconds: number;
  description?: string;
  lastTriggeredAt?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseInstance {
  id: string;
  name: string;
  displayName?: string;
  type: DatabaseType;
  host: string;
  port: number;
  databaseName?: string;
  version?: string;
  provider: Provider;
  region?: string;
  environment?: EnvironmentType;
  status: InstanceStatus;
  lastSeenAt?: string;
  errorCount: number;
  agentId?: string;
  tags: InstanceTag[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseInstanceDetail extends DatabaseInstance {
  connectionConfig: ConnectionConfig;
  collectionConfig: CollectionConfig;
  metadata: Record<string, unknown>;
  lastError?: string;
  maintenanceUntil?: string;
  rules: MonitoringRule[];
}

export interface FleetStats {
  total: number;
  online: number;
  offline: number;
  degraded: number;
  maintenance: number;
  unknown: number;
  typeCount: number;
  providerCount: number;
  activeRules: number;
}

export interface FleetStatsByType {
  [type: string]: number;
}

export interface FleetStatsByProvider {
  [provider: string]: number;
}

export interface FleetStatsByStatus {
  [status: string]: number;
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs: number;
  version?: string;
  serverInfo?: Record<string, unknown>;
  error?: string;
}

export interface BulkOperationResult {
  results: Array<{ id: string; success: boolean; error?: string }>;
  total: number;
  succeeded: number;
}

export interface DatabaseTypeMetadata {
  type: DatabaseType;
  label: string;
  category:
    | "relational"
    | "document"
    | "columnar"
    | "key-value"
    | "time-series";
  providers: Provider[];
  defaultPort: number;
  agentRequired: boolean;
  metricPrefix: string;
  connectionSchema: Record<string, unknown>;
  collectionSchema: Record<string, unknown>;
}

export interface RegisterInstancePayload {
  type: DatabaseType;
  name: string;
  host: string;
  port: number;
  database_name?: string;
  provider?: Provider;
  environment?: EnvironmentType;
  region?: string;
  display_name?: string;
  connection_config: ConnectionConfig;
  collection_config?: Partial<CollectionConfig>;
  tags?: InstanceTag[];
}

export interface UpdateInstancePayload extends Partial<RegisterInstancePayload> {}

export interface ListInstancesQuery {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
  type?: string;
  provider?: string;
  status?: string;
  environment?: string;
  search?: string;
  org_id?: string;
}

export interface BulkOperationPayload {
  operation:
    | "update_tags"
    | "update_status"
    | "delete"
    | "update_collection_config";
  instance_ids: string[];
  payload: Record<string, unknown>;
}

export interface InstanceListResult {
  instances: DatabaseInstance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
