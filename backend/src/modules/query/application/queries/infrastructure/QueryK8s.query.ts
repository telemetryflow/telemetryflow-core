import { TenantContext } from "../../../domain/value-objects";
import {
  K8sClusterQueryFilter,
  K8sNamespaceQueryFilter,
  K8sNodeQueryFilter,
  K8sPodQueryFilter,
  K8sDeploymentQueryFilter,
  K8sPVQueryFilter,
  K8sPVCQueryFilter,
  InfrastructureQueryOptions,
  PaginationOptions,
} from "../../../domain/types";

/**
 * Query K8s Clusters CQRS Query
 */
export class QueryK8sClustersQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter?: K8sClusterQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: InfrastructureQueryOptions,
  ) {}
}

/**
 * Get K8s Cluster By ID Query
 */
export class GetK8sClusterByIdQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly clusterId: string,
  ) {}
}

/**
 * Query K8s Namespaces CQRS Query
 */
export class QueryK8sNamespacesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter: K8sNamespaceQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: InfrastructureQueryOptions,
  ) {}
}

/**
 * Query K8s Nodes CQRS Query
 */
export class QueryK8sNodesQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter: K8sNodeQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: InfrastructureQueryOptions,
  ) {}
}

/**
 * Query K8s Pods CQRS Query
 */
export class QueryK8sPodsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter: K8sPodQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: InfrastructureQueryOptions,
  ) {}
}

/**
 * Query K8s Deployments CQRS Query
 */
export class QueryK8sDeploymentsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter: K8sDeploymentQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: InfrastructureQueryOptions,
  ) {}
}

/**
 * Query K8s Persistent Volumes CQRS Query
 */
export class QueryK8sPVsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter: K8sPVQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: InfrastructureQueryOptions,
  ) {}
}

/**
 * Query K8s Persistent Volume Claims CQRS Query
 */
export class QueryK8sPVCsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly filter: K8sPVCQueryFilter,
    public readonly pagination?: PaginationOptions,
    public readonly options?: InfrastructureQueryOptions,
  ) {}
}

/**
 * Get K8s Resource Counts Query
 */
export class GetK8sResourceCountsQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly clusterId?: string,
  ) {}
}
