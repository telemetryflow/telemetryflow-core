import { TenantContext } from "../../../domain/value-objects";
import { PaginationOptions } from "../../../domain/types";

/**
 * Service Query Filter
 */
export interface ServiceQueryFilter {
  name?: string;
  type?: string;
  status?: string;
  namespace?: string;
  environment?: string;
  tags?: string[];
}

/**
 * Service Dependency Query Filter
 */
export interface ServiceDependencyQueryFilter {
  sourceServiceId?: string;
  targetServiceId?: string;
  type?: string;
}

/**
 * Query Services CQRS Query
 */
export class QueryServicesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter?: ServiceQueryFilter,
    public readonly pagination?: PaginationOptions,
  ) {}
}

/**
 * Get Service By ID Query
 */
export class GetServiceByIdQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly serviceId: string,
  ) {}
}

/**
 * Query Service Dependencies CQRS Query
 */
export class QueryServiceDependenciesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter?: ServiceDependencyQueryFilter,
    public readonly pagination?: PaginationOptions,
  ) {}
}

/**
 * Get Service Map Query
 */
export class GetServiceMapQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly namespace?: string,
    public readonly environment?: string,
  ) {}
}

/**
 * Get Service Topology Query
 */
export class GetServiceTopologyQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly depth?: number,
  ) {}
}

/**
 * Get Trace-Based Dependencies Query
 * Discovers service-to-service edges from ClickHouse traces (parent-child span join).
 */
export class GetTraceDependenciesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
  ) {}
}

/**
 * Get Service Trace Metrics Query
 * Returns detailed per-service metrics from ClickHouse traces:
 * RED metrics, top endpoints (span_name), and latency percentiles.
 */
export class GetServiceTraceMetricsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly serviceName: string,
  ) {}
}
