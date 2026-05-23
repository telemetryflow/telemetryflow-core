import { DataSourceType } from '../value-objects';

/**
 * Query metadata included with every result
 */
export interface QueryMetadata {
  queryId: string;
  executionTimeMs: number;
  dataSource: DataSourceType;
  cached: boolean;
  cacheKey?: string;
  query?: string; // The executed query (for debugging)
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Unified Query Result
 * Standard response format for all query types
 */
export interface UnifiedQueryResult<T> {
  data: T[];
  total: number;
  metadata: QueryMetadata;
  pagination?: PaginationInfo;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

/**
 * Time series result
 */
export interface TimeSeriesResult {
  metricName: string;
  labels: Record<string, string>;
  dataPoints: TimeSeriesDataPoint[];
}

/**
 * Metric data point (from ClickHouse)
 */
export interface MetricDataPoint {
  timestamp: Date;
  metricName: string;
  metricType: 'gauge' | 'counter' | 'histogram' | 'summary';
  value: number;
  serviceName: string;
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
  resourceAttributes: Record<string, string>;
  metricAttributes: Record<string, string>;
  unit?: string;
}

/**
 * Log entry (from ClickHouse)
 */
export interface LogEntry {
  timestamp: Date;
  observedTimestamp?: Date;
  traceId?: string;
  spanId?: string;
  traceFlags?: number;
  severityText: string;
  severityNumber: number;
  serviceName: string;
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
  body: string;
  resourceAttributes: Record<string, string>;
  scopeName?: string;
  scopeVersion?: string;
  logAttributes: Record<string, string>;
}

/**
 * Trace span (from ClickHouse)
 */
export interface TraceSpan {
  timestamp: Date;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  spanName: string;
  spanKind: 'UNSPECIFIED' | 'INTERNAL' | 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER';
  serviceName: string;
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
  statusCode: 'UNSET' | 'OK' | 'ERROR';
  statusMessage?: string;
  durationNs: number;
  durationMs: number;
  resourceAttributes: Record<string, string>;
  spanAttributes: Record<string, string>;
  events: string[];
}

/**
 * Exemplar linking metric to trace
 */
export interface Exemplar {
  timestamp: Date;
  metricName: string;
  traceId: string;
  spanId: string;
  value: number;
  labels: Record<string, string>;
  serviceName: string;
}

/**
 * Correlation between signals
 */
export interface SignalCorrelation {
  id: string;
  traceId?: string;
  spanId?: string;
  logId?: string;
  metricName?: string;
  timestamp: Date;
  serviceName: string;
  correlationType: 'trace_log' | 'trace_metric' | 'log_metric';
}

/**
 * Cross-signal correlation result
 */
export interface CorrelationResult {
  anchor: {
    type: string;
    id: string;
    data: unknown;
  };
  correlations: CorrelatedSignal[];
  timeline?: TimelineEntry[];
  metadata: QueryMetadata;
}

/**
 * Correlated signal
 */
export interface CorrelatedSignal {
  type: string;
  correlationKey: string;
  signal: unknown;
  relevance: number;
}

/**
 * Timeline entry for correlation visualization
 */
export interface TimelineEntry {
  timestamp: Date;
  type: string;
  id: string;
  serviceName: string;
  summary: string;
  data: unknown;
}

/**
 * Trace summary (for trace list views)
 */
export interface TraceSummary {
  traceId: string;
  rootServiceName: string;
  rootSpanName: string;
  durationMs: number;
  spanCount: number;
  errorCount: number;
  startTime: Date;
  endTime: Date;
  services: string[];
  hasLogs: boolean;
}
