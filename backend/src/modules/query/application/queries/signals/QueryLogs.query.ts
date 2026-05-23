import { TimeRange, TenantContext } from "../../../domain/value-objects";
import {
  LogsQueryFilter,
  LogsQueryOptions,
  PaginationOptions,
} from "../../../domain/types";

/**
 * Query Logs CQRS Query
 */
export class QueryLogsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly timeRange: TimeRange,
    public readonly filter?: LogsQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: LogsQueryOptions,
  ) {}
}

/**
 * Get Log Severity Levels Query
 */
export class GetLogSeverityLevelsQuery {
  constructor(public readonly tenantContext: TenantContext) {}
}

/**
 * Get Log Count By Severity Query
 */
export class GetLogCountBySeverityQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly timeRange: TimeRange,
  ) {}
}
