/**
 * Kubernetes Types Re-export
 * Re-export types from main telemetry types and mocks
 */

// Re-export from mocks for now (will be migrated later)
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
} from '@/mocks/kubernetes';
