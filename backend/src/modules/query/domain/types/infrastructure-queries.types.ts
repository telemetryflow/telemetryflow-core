/**
 * Agent Query Filter
 */
export interface AgentQueryFilter {
  name?: string;
  type?: string;
  types?: string[];
  status?: string;
  statuses?: string[];
  host?: string;
  version?: string;
  labels?: Record<string, string>;
}

/**
 * VM Query Filter
 */
export interface VMQueryFilter {
  name?: string;
  hostname?: string;
  provider?: string;
  providers?: string[];
  status?: string;
  statuses?: string[];
  osType?: string;
  osTypes?: string[];
  region?: string;
  zone?: string;
  instanceType?: string;
  agentId?: string;
  labels?: Record<string, string>;
  tags?: Record<string, string>;
}

/**
 * K8s Cluster Query Filter
 */
export interface K8sClusterQueryFilter {
  name?: string;
  displayName?: string;
  provider?: string;
  providers?: string[];
  status?: string;
  statuses?: string[];
  region?: string;
  version?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

/**
 * K8s Namespace Query Filter
 */
export interface K8sNamespaceQueryFilter {
  clusterId: string;
  name?: string;
  uid?: string;
  status?: string;
  statuses?: string[];
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  isSystem?: boolean;
}

/**
 * K8s Node Query Filter
 */
export interface K8sNodeQueryFilter {
  clusterId: string;
  name?: string;
  uid?: string;
  status?: string;
  statuses?: string[];
  roles?: string[];
  kubernetesVersion?: string;
  containerRuntime?: string;
  osImage?: string;
  isReady?: boolean;
  isControlPlane?: boolean;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

/**
 * K8s Pod Query Filter
 */
export interface K8sPodQueryFilter {
  clusterId: string;
  namespaceId?: string;
  namespace?: string;
  nodeId?: string;
  nodeName?: string;
  name?: string;
  uid?: string;
  phase?: string;
  phases?: string[];
  qosClass?: string;
  ip?: string;
  hasRestarts?: boolean;
  minRestarts?: number;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

/**
 * K8s Deployment Query Filter
 */
export interface K8sDeploymentQueryFilter {
  clusterId: string;
  namespaceId?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  replicas?: number;
  minReplicas?: number;
  maxReplicas?: number;
  availableReplicas?: number;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

/**
 * K8s StatefulSet Query Filter
 */
export interface K8sStatefulSetQueryFilter {
  clusterId: string;
  namespaceId?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  replicas?: number;
  labels?: Record<string, string>;
}

/**
 * K8s DaemonSet Query Filter
 */
export interface K8sDaemonSetQueryFilter {
  clusterId: string;
  namespaceId?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  labels?: Record<string, string>;
}

/**
 * K8s Service Query Filter
 */
export interface K8sServiceQueryFilter {
  clusterId: string;
  namespaceId?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  type?: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
  clusterIP?: string;
  labels?: Record<string, string>;
}

/**
 * K8s PersistentVolume Query Filter
 */
export interface K8sPVQueryFilter {
  clusterId: string;
  name?: string;
  uid?: string;
  status?: 'Available' | 'Bound' | 'Released' | 'Failed';
  storageClass?: string;
  accessModes?: string[];
  minCapacity?: string;
  maxCapacity?: string;
  reclaimPolicy?: 'Retain' | 'Delete' | 'Recycle';
  labels?: Record<string, string>;
}

/**
 * K8s PersistentVolumeClaim Query Filter
 */
export interface K8sPVCQueryFilter {
  clusterId: string;
  namespaceId?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  status?: 'Pending' | 'Bound' | 'Lost';
  storageClass?: string;
  volumeName?: string;
  labels?: Record<string, string>;
}

/**
 * Infrastructure Query Options
 */
export interface InfrastructureQueryOptions {
  includeDeleted?: boolean;
  includeMetrics?: boolean;
  expandRelations?: boolean;
}
