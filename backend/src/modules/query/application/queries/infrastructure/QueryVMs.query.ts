import { TenantContext } from "../../../domain/value-objects";
import {
  VMQueryFilter,
  InfrastructureQueryOptions,
  PaginationOptions,
} from "../../../domain/types";

/**
 * Query VMs CQRS Query
 */
export class QueryVMsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter?: VMQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: InfrastructureQueryOptions,
  ) {}
}

/**
 * Get VM By ID Query
 */
export class GetVMByIdQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly vmId: string,
  ) {}
}

/**
 * Get VM Providers Query
 */
export class GetVMProvidersQuery {
  constructor(public readonly tenantContext: TenantContext) {}
}

/**
 * Get VM Statuses Query
 */
export class GetVMStatusesQuery {
  constructor(public readonly tenantContext: TenantContext) {}
}
