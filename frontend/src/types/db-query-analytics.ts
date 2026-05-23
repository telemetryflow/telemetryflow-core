/**
 * Shared QAN (Query Analytics) Types
 * Unified across MySQL, MariaDB, Percona, PostgreSQL, and ClickHouse.
 */

export type QANEngine = "mysql" | "mariadb" | "percona" | "postgresql" | "clickhouse";

export type QANDimension = "query" | "schema" | "user" | "host" | "engine";

export interface QANQuery {
  queryId: string;
  fingerprint: string;
  queryText?: string;
  schema: string;
  engine: QANEngine;
  calls: number;
  totalDurationMs: number;
  avgDurationMs: number;
  maxDurationMs: number;
  p50DurationMs?: number;
  p95DurationMs?: number;
  p99DurationMs?: number;
  rowsExamined: number;
  rowsSent: number;
  rowsAffected: number;
  tmpTables: number;
  tmpDiskTables: number;
  noIndexUsed: boolean;
  cacheHitRatio?: number;
  queryKind?: string;
  firstSeen: string;
  lastSeen: string;
  // Sparkline data for the overview panel
  loadSparkline?: number[];
}

export interface QANFilterState {
  dimensions: QANDimension[];
  engines?: QANEngine[];
  schema?: string;
  user?: string;
  host?: string;
  minDurationMs?: number;
  queryKind?: string;
  instanceId?: string;
}

export interface QANFilterGroup {
  name: string;
  values: QANFilterValue[];
}

export interface QANFilterValue {
  value: string;
  count: number;
  percentage: number;
}

export interface QANQueryExample {
  timestamp: string;
  queryText: string;
  durationMs: number;
  rowsSent: number;
  rowsExamined: number;
  schema: string;
  user?: string;
  host?: string;
  error?: string;
}

export interface QANQueryTable {
  schema: string;
  table: string;
  accessType: string;
  rowsRead: number;
  indexUsed?: string;
}

export interface QANDetail {
  query: QANQuery;
  examples: QANQueryExample[];
  explain: unknown;
  tables: QANQueryTable[];
  plan?: string;
  // Time distribution buckets
  timeDistribution?: QANTimeBucket[];
}

export interface QANTimeBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface QANPagination {
  total: number;
  page: number;
  pageSize: number;
}

export interface QANListResponse {
  queries: QANQuery[];
  pagination: QANPagination;
  filters: QANFilterGroup[];
}

export interface QANListParams {
  engine?: QANEngine;
  instanceId?: string;
  schema?: string;
  user?: string;
  host?: string;
  queryKind?: string;
  minDurationMs?: number;
  sort?: string;
  order?: "ASC" | "DESC";
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}
