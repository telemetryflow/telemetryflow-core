export type Sqlite3DatabaseStatus = "healthy" | "warning" | "critical" | "unknown";

export interface Sqlite3Database {
  id: string;
  name: string;
  filePath: string;
  fileSize: number;
  journalMode: string;
  pageCount: number;
  pageSize: number;
  utilizationPct: number;
  status: Sqlite3DatabaseStatus;
  lastSeenAt?: string;
  metadata?: Record<string, unknown>;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sqlite3DatabaseListResult {
  databases: Sqlite3Database[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Sqlite3OverviewStats {
  totalInstances: number;
  healthyInstances: number;
  warningInstances: number;
  criticalInstances: number;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  avg: number;
  min: number;
  max: number;
}

export interface TimeSeriesSeries {
  metric_name: string;
  data: TimeSeriesDataPoint[];
}

export interface Sqlite3MetricsResponse {
  instance_id: string;
  from: string;
  to: string;
  step: string;
  series: TimeSeriesSeries[];
}

export interface Sqlite3Table {
  id: string;
  tableName: string;
  tableType: string;
  rowCount: number;
  columnCount: number;
  indexCount: number;
  withoutRowid: boolean;
  strictMode: boolean;
  sqlDefinition?: string;
}

export interface Sqlite3Index {
  id: string;
  indexName: string;
  tableName: string;
  isUnique: boolean;
  isPrimary: boolean;
  columns: string[];
  sqlDefinition?: string;
}

export interface Sqlite3TablesResponse {
  tables: Sqlite3Table[];
  indexes: Sqlite3Index[];
}

export interface Sqlite3PragmaEntry {
  name: string;
  value: string;
  description: string;
}

export interface Sqlite3PragmaResponse {
  databaseId: string;
  databaseName: string;
  pragmas: Sqlite3PragmaEntry[];
}

export interface Sqlite3IntegrityCheck {
  timestamp: string;
  checkType: string;
  status: string;
  message: string;
  errorCount: number;
  details: Record<string, string>;
}

export interface Sqlite3IntegrityResponse {
  checks: Sqlite3IntegrityCheck[];
}

export interface Sqlite3LockInfo {
  lockType: string;
  waitCount: number;
  waitTimeMs: number;
  contentionCount: number;
}

export interface Sqlite3LocksResponse {
  locks: Sqlite3LockInfo[];
}

export interface Sqlite3ProcessInfo {
  pid: number;
  command: string;
  database: string;
  startTime: string;
  durationMs: number;
  state: string;
}

export interface MetricsQueryParams {
  metric_names?: string;
  from?: string;
  to?: string;
  step?: "1m" | "1h" | "1d";
}
