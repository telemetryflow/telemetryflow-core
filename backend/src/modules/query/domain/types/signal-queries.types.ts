import { LabelMatcher } from '../interfaces';
import { AggregationType, AggregationInterval } from '../value-objects';

/**
 * Metrics Query Filter
 */
export interface MetricsQueryFilter {
  metricName?: string;
  metricNames?: string[];
  serviceName?: string;
  serviceNames?: string[];
  labels?: Record<string, string>;
  labelMatchers?: LabelMatcher[];
  unit?: string;
}

/**
 * Metrics Query Options
 */
export interface MetricsQueryOptions {
  aggregation?: AggregationType;
  interval?: AggregationInterval;
  includePercentiles?: boolean;
  percentiles?: number[];
  useRollup?: boolean;
  fill?: 'null' | 'zero' | 'previous';
}

/**
 * Logs Query Filter
 */
export interface LogsQueryFilter {
  query?: string; // Full-text search
  severityText?: string;
  severityTexts?: string[];
  severityNumber?: number;
  minSeverity?: number;
  maxSeverity?: number;
  serviceName?: string;
  serviceNames?: string[];
  traceId?: string;
  spanId?: string;
  scopeName?: string;
  resourceAttributes?: Record<string, string>;
  logAttributes?: Record<string, string>;
}

/**
 * Logs Query Options
 */
export interface LogsQueryOptions {
  highlight?: boolean;
  highlightFields?: string[];
  includeContext?: boolean;
  contextLines?: number;
}

/**
 * Traces Query Filter
 */
export interface TracesQueryFilter {
  traceId?: string;
  traceIds?: string[];
  spanId?: string;
  parentSpanId?: string;
  spanName?: string;
  spanNames?: string[];
  spanKind?: 'UNSPECIFIED' | 'INTERNAL' | 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER';
  spanKinds?: string[];
  serviceName?: string;
  serviceNames?: string[];
  statusCode?: 'UNSET' | 'OK' | 'ERROR';
  statusCodes?: string[];
  minDurationMs?: number;
  maxDurationMs?: number;
  resourceAttributes?: Record<string, string>;
  spanAttributes?: Record<string, string>;
  hasError?: boolean;
}

/**
 * Traces Query Options
 */
export interface TracesQueryOptions {
  includeEvents?: boolean;
  includeLinks?: boolean;
  expandTrace?: boolean; // Get full trace for each span
}

/**
 * Exemplars Query Filter
 */
export interface ExemplarsQueryFilter {
  metricName: string;
  traceId?: string;
  spanId?: string;
  serviceName?: string;
  labels?: Record<string, string>;
  minValue?: number;
  maxValue?: number;
}

/**
 * Exemplars Query Options
 */
export interface ExemplarsQueryOptions {
  includeTrace?: boolean;
  maxPerSeries?: number;
}

/**
 * Correlations Query Filter
 */
export interface CorrelationsQueryFilter {
  traceId?: string;
  spanId?: string;
  logId?: string;
  metricName?: string;
  serviceName?: string;
  correlationType?: 'trace_log' | 'trace_metric' | 'log_metric' | 'all';
}

/**
 * Correlations Query Options
 */
export interface CorrelationsQueryOptions {
  includeSignals?: boolean;
  maxDepth?: number;
}

/**
 * Unified Search Filter
 */
export interface UnifiedSearchFilter {
  query: string;
  signalTypes?: ('metrics' | 'logs' | 'traces')[];
  serviceName?: string;
}

/**
 * Unified Search Options
 */
export interface UnifiedSearchOptions {
  highlight?: boolean;
  maxPerType?: number;
}
