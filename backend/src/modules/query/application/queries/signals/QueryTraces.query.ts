import { TimeRange, TenantContext } from "../../../domain/value-objects";
import {
  TracesQueryFilter,
  TracesQueryOptions,
  PaginationOptions,
} from "../../../domain/types";

/**
 * Query Traces CQRS Query
 */
export class QueryTracesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly timeRange: TimeRange,
    public readonly filter?: TracesQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: TracesQueryOptions,
  ) {}
}

/**
 * Get Trace By ID Query
 */
export class GetTraceByIdQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly traceId: string,
  ) {}
}

/**
 * Get Trace Summaries Query
 */
export class GetTraceSummariesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly timeRange: TimeRange,
    public readonly filter?: TracesQueryFilter,
    public readonly pagination?: PaginationOptions,
  ) {}
}

/**
 * Get Trace Service Names Query
 */
export class GetTraceServiceNamesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly limit?: number,
  ) {}
}

/**
 * Get Span Names Query
 */
export class GetSpanNamesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly serviceName?: string,
    public readonly limit?: number,
  ) {}
}
