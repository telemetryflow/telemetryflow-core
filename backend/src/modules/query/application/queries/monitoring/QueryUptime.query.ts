import { TenantContext } from "../../../domain/value-objects";
import {
  PaginationOptions,
  InfrastructureQueryOptions,
} from "../../../domain/types";

/**
 * Uptime Monitor Query Filter
 */
export interface UptimeMonitorQueryFilter {
  name?: string;
  url?: string;
  type?: string;
  status?: string;
  statuses?: string[];
  isActive?: boolean;
  isPaused?: boolean;
  groupId?: string;
  tags?: string[];
}

/**
 * Query Uptime Monitors CQRS Query
 */
export class QueryUptimeMonitorsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter?: UptimeMonitorQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: InfrastructureQueryOptions,
  ) {}
}

/**
 * Get Uptime Monitor By ID Query
 */
export class GetUptimeMonitorByIdQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly monitorId: string,
  ) {}
}

/**
 * Get Uptime Monitor Stats Query
 */
export class GetUptimeMonitorStatsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly monitorId: string,
  ) {}
}

/**
 * Get Uptime Monitor Checks Query
 */
export class GetUptimeMonitorChecksQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly monitorId: string,
    public readonly from?: Date,
    public readonly to?: Date,
    public readonly limit?: number,
  ) {}
}

/**
 * Get Uptime Monitor Daily Stats Query
 * Returns per-day uptime data from ClickHouse uptime_checks_1d materialized view
 */
export class GetUptimeMonitorDailyStatsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly monitorId: string,
    public readonly days: number = 90,
  ) {}
}

/**
 * Get Uptime Monitor Hourly Stats Query
 * Returns per-hour uptime data from ClickHouse uptime_checks_1h materialized view
 */
export class GetUptimeMonitorHourlyStatsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly monitorId: string,
    public readonly hours: number = 24,
  ) {}
}

/**
 * Get Uptime Monitor SSL Trend Query
 * Returns per-hour min_ssl_days_remaining from ClickHouse uptime_checks_1h materialized view.
 * Only applicable to HTTPS / ssl_certificate monitors (non-SSL stored as -1, excluded here).
 */
export class GetUptimeMonitorSSLTrendQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly monitorId: string,
    public readonly hours: number = 168, // default 7 days
  ) {}
}

/**
 * Get Uptime SSL Summary Query
 * Returns org-wide SSL summary stats from ClickHouse:
 *   total registered, near-expiry count, min days, max days.
 */
export class GetUptimeSSLSummaryQuery {
  constructor(public readonly tenantContext: TenantContext) {}
}
