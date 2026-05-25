import { TenantContext } from "../../../domain/value-objects";
import { PaginationOptions } from "../../../domain/types";

/**
 * Status Page Query Filter
 */
export interface StatusPageQueryFilter {
  title?: string;
  slug?: string;
  isPublic?: boolean;
  overallStatus?: string;
}

/**
 * Incident Query Filter
 */
export interface IncidentQueryFilter {
  statusPageId: string;
  status?: string;
  impact?: string;
}

/**
 * Query Status Pages CQRS Query
 */
export class QueryStatusPagesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter?: StatusPageQueryFilter,
    public readonly pagination?: PaginationOptions,
  ) {}
}

/**
 * Get Status Page By ID Query
 */
export class GetStatusPageByIdQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly statusPageId: string,
  ) {}
}

/**
 * Query Incidents CQRS Query
 */
export class QueryIncidentsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter: IncidentQueryFilter,
    public readonly pagination?: PaginationOptions,
  ) {}
}

/**
 * Get Incident By ID Query
 */
export class GetIncidentByIdQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly incidentId: string,
  ) {}
}
