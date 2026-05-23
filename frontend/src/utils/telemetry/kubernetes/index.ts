/**
 * Kubernetes Helpers Export
 */

// Multi-Cluster Configuration
export {
  K8S_REGIONS,
  K8S_CLUSTERS,
  K8S_ALL_CLUSTERS,
  K8S_NODES_BY_CLUSTER,
  K8S_CLUSTER,
  K8S_NODES,
  getClustersByRegion,
  getClusterById,
  getNodesByCluster,
  getNamespacesByCluster,
  getRegions,
  getRegionById,
  getClustersByProvider,
  getClustersByEnvironment,
  getHealthyClusters,
  getDegradedClusters,
} from './cluster';
export type { K8sRegionId, K8sClusterConfig, K8sNodeConfig } from './cluster';

// Generator
export {
  generateK8sCluster,
  generateNodeMetrics,
  generateNamespaceMetrics,
  generatePodMetrics,
  generateDeploymentMetrics,
  generateK8sOverview,
} from './generator';
export type { K8sGeneratorConfig } from './generator';

// Node Generation (from node.ts)
export {
  generateNode,
  generateNodes,
  generateNodesByRegion,
  generateAllNodes,
} from './node';

// Pod Generation (from pods.ts)
export {
  generatePods,
  correlatedPodToK8sPod,
} from './pods';

// Deployment Generation (from deployment.ts)
export {
  generateDeployment,
  generateDeployments,
} from './deployment';

// Namespace Generation (from namespace.ts)
export {
  generateNamespaces,
  generatePersistentVolumes,
} from './namespace';

// Types
export type {
  K8sNode,
  K8sNodeEvent,
  K8sPod,
  K8sPodCondition,
  K8sContainer,
  K8sVolume,
  K8sVolumeMount,
  K8sPodEvent,
  K8sDeployment,
  K8sNamespace,
  K8sPersistentVolume,
  K8sClusterOverview,
  PodPhase,
  ContainerState,
} from './types';

// Fetcher
export {
  fetchK8sOverview,
  fetchK8sClusterData,
  fetchK8sClusters,
  fetchK8sNodes,
  fetchK8sNode,
  fetchK8sPods,
  fetchK8sPod,
  fetchK8sDeployments,
  fetchK8sDeployment,
  fetchK8sNamespaces,
  fetchK8sNamespace,
  fetchK8sResourceMetrics,
} from './fetcher';

// Additional Kubernetes helpers can be implemented in separate files:
// - cluster.ts: Cluster-level health, capacity, and scoring helpers
// - node.ts: Node condition, utilization, and filtering helpers
// - namespace.ts: Namespace quota, status, and filtering helpers
// - pods.ts: Pod phase, health, resource, and filtering helpers
// - deployment.ts: Deployment status, replica progress, and update helpers
//
// Note: Basic K8s functionality is available via the fetcher functions exported above.
// export {
//   getDeploymentStatus,
//   isDeploymentHealthy,
//   isDeploymentProgressing,
//   getDeploymentHealth,
//   getDeploymentStatusColor,
//   getReplicaProgress,
//   getUpdateProgress,
//   formatReplicaStatus,
//   formatDeploymentAge,
//   formatLastUpdate,
//   summarizeDeployment,
//   analyzeDeploymentMetrics,
//   filterDeploymentsByNamespace,
//   filterHealthyDeployments,
//   filterUnhealthyDeployments,
//   filterProgressingDeployments,
//   filterDeploymentsByLabel,
//   sortDeploymentsByHealth,
//   sortDeploymentsByReplicas,
//   sortDeploymentsByAge,
//   sortDeploymentsByLastUpdate,
//   getDeploymentPods,
//   getDeploymentPodCount,
// } from './deployment';
