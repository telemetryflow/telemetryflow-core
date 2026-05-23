import { TenantContext } from "../../../domain/value-objects";
import {
  AgentQueryFilter,
  InfrastructureQueryOptions,
  PaginationOptions,
} from "../../../domain/types";

/**
 * Query Agents CQRS Query
 */
export class QueryAgentsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter?: AgentQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: InfrastructureQueryOptions,
  ) {}
}

/**
 * Get Agent By ID Query
 */
export class GetAgentByIdQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly agentId: string,
  ) {}
}

/**
 * Get Agent Types Query
 */
export class GetAgentTypesQuery {
  constructor(public readonly tenantContext: TenantContext) {}
}

/**
 * Get Agent Statuses Query
 */
export class GetAgentStatusesQuery {
  constructor(public readonly tenantContext: TenantContext) {}
}
