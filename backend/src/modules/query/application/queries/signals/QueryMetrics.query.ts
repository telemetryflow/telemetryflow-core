import {
  TimeRange,
  TenantContext,
} from "../../../domain/value-objects";
import {
  MetricsQueryFilter,
  MetricsQueryOptions,
  PaginationOptions,
} from "../../../domain/types";

/**
 * Query Metrics CQRS Query
 */
export class QueryMetricsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly timeRange: TimeRange,
    public readonly filter?: MetricsQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: MetricsQueryOptions,
  ) {}
}

/**
 * Get Metric Names Query
 */
export class GetMetricNamesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly prefix?: string,
    public readonly limit?: number,
  ) {}
}

/**
 * Get Label Values Query
 */
export class GetLabelValuesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly labelName: string,
    public readonly metricName?: string,
    public readonly limit?: number,
  ) {}
}

/**
 * Get Service Names Query
 */
export class GetServiceNamesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly limit?: number,
  ) {}
}
