import { TenantContext } from "../../../domain/value-objects";
import { PaginationOptions } from "../../../domain/types";

/**
 * Network Node Query Filter
 */
export interface NetworkNodeQueryFilter {
  name?: string;
  type?: string;
  status?: string;
  cluster?: string;
  namespace?: string;
  region?: string;
  ipAddress?: string;
}

/**
 * Network Connection Query Filter
 */
export interface NetworkConnectionQueryFilter {
  sourceNodeId?: string;
  targetNodeId?: string;
  type?: string;
  protocol?: string;
}

/**
 * Query Network Nodes CQRS Query
 */
export class QueryNetworkNodesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter?: NetworkNodeQueryFilter,
    public readonly pagination?: PaginationOptions,
  ) {}
}

/**
 * Get Network Node By ID Query
 */
export class GetNetworkNodeByIdQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly nodeId: string,
  ) {}
}

/**
 * Query Network Connections CQRS Query
 */
export class QueryNetworkConnectionsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter?: NetworkConnectionQueryFilter,
    public readonly pagination?: PaginationOptions,
  ) {}
}

/**
 * Get Network Map Query
 */
export class GetNetworkMapQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly cluster?: string,
    public readonly namespace?: string,
  ) {}
}

/**
 * Get Network Topology Query
 */
export class GetNetworkTopologyQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly depth?: number,
  ) {}
}

/**
 * Get Network Flow Query
 */
export class GetNetworkFlowQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly from?: Date,
    public readonly to?: Date,
  ) {}
}
