/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Base query input with common fields
 */
export interface BaseQueryInput {
  pagination?: PaginationOptions;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Time-bounded query input
 */
export interface TimeRangeQueryInput extends BaseQueryInput {
  from: string | Date;
  to: string | Date;
}

/**
 * Tenant-scoped query input
 */
export interface TenantQueryInput {
  organizationId?: string; // Usually from auth context
  workspaceId?: string;
  tenantId?: string;
}

/**
 * Full query input combining all aspects
 */
export interface FullQueryInput extends TimeRangeQueryInput, TenantQueryInput {}

/**
 * Query statistics for performance monitoring
 */
export interface QueryStatistics {
  rowsRead: number;
  bytesRead: number;
  executionTimeMs: number;
  memoryUsed?: number;
}

/**
 * Available metric names response
 */
export interface MetricNamesResult {
  names: string[];
  total: number;
}

/**
 * Available label values response
 */
export interface LabelValuesResult {
  label: string;
  values: string[];
  total: number;
}

/**
 * Service names response
 */
export interface ServiceNamesResult {
  names: string[];
  total: number;
}

/**
 * Service dependency for service map
 */
export interface ServiceDependency {
  source: string;
  target: string;
  callCount: number;
  errorCount: number;
  avgDurationMs: number;
  p99DurationMs: number;
}

/**
 * Service health summary
 */
export interface ServiceHealth {
  serviceName: string;
  requestRate: number;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

/**
 * Infrastructure health summary
 */
export interface InfraHealth {
  totalResources: number;
  healthyResources: number;
  unhealthyResources: number;
  unknownResources: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

/**
 * K8s resource counts
 */
export interface K8sResourceCounts {
  clusters: number;
  nodes: number;
  namespaces: number;
  pods: number;
  deployments: number;
  services: number;
  pvs: number;
}
