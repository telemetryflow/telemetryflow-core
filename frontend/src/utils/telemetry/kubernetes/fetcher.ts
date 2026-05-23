/**
 * Kubernetes Fetcher
 * Fetch Kubernetes resources and metrics from TFO v2 endpoints
 */

import type {
  DataSourceConfig,
  TelemetryResponse,
  K8sOverview,
  K8sNode,
  K8sPod,
  K8sDeployment,
  K8sNamespace,
  K8sClusterData,
  TimeRange,
} from '../types';
import {
  fetchTelemetryData,
  createSuccessResponse,
} from '../common/fetcher';
import { TFO_V2_ENDPOINTS } from '../constants';
import {
  generateK8sOverview,
  generateK8sCluster,
  generateNodes,
  generatePods,
  generateDeployments,
  generateNamespaces,
} from './generator';

// ============================================
// Fetch Kubernetes Overview
// ============================================

export async function fetchK8sOverview(
  source: DataSourceConfig,
  cluster: string
): Promise<TelemetryResponse<K8sOverview>> {
  if (source.type === 'mock') {
    const overview = generateK8sOverview(cluster);
    return createSuccessResponse<K8sOverview>(overview, 'mock');
  }

  return fetchTelemetryData<K8sOverview>({
    source,
    endpoint: TFO_V2_ENDPOINTS.KUBERNETES_OVERVIEW,
    method: 'GET',
    params: { cluster },
  });
}

// ============================================
// Fetch Cluster Data
// ============================================

export async function fetchK8sClusterData(
  source: DataSourceConfig,
  cluster: string
): Promise<TelemetryResponse<K8sClusterData>> {
  if (source.type === 'mock') {
    const data = generateK8sCluster({ cluster });
    return createSuccessResponse<K8sClusterData>(data, 'mock');
  }

  return fetchTelemetryData<K8sClusterData>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.KUBERNETES_CLUSTERS}/${cluster}`,
    method: 'GET',
  });
}

// ============================================
// Fetch Clusters List
// ============================================

export async function fetchK8sClusters(
  source: DataSourceConfig
): Promise<TelemetryResponse<string[]>> {
  if (source.type === 'mock') {
    const clusters = [
      'production-us-east-1',
      'production-eu-west-1',
      'staging-us-east-1',
      'development',
    ];
    return createSuccessResponse<string[]>(clusters, 'mock');
  }

  return fetchTelemetryData<string[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.KUBERNETES_CLUSTERS,
    method: 'GET',
  });
}

// ============================================
// Fetch Nodes
// ============================================

export async function fetchK8sNodes(
  source: DataSourceConfig,
  cluster: string
): Promise<TelemetryResponse<K8sNode[]>> {
  if (source.type === 'mock') {
    const nodes = generateNodes(cluster, 5);
    return createSuccessResponse<K8sNode[]>(nodes, 'mock');
  }

  return fetchTelemetryData<K8sNode[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.KUBERNETES_NODES,
    method: 'GET',
    params: { cluster },
  });
}

export async function fetchK8sNode(
  source: DataSourceConfig,
  cluster: string,
  nodeName: string
): Promise<TelemetryResponse<K8sNode>> {
  if (source.type === 'mock') {
    const nodes = generateNodes(cluster, 1);
    nodes[0].name = nodeName;
    return createSuccessResponse<K8sNode>(nodes[0], 'mock');
  }

  return fetchTelemetryData<K8sNode>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.KUBERNETES_NODES}/${nodeName}`,
    method: 'GET',
    params: { cluster },
  });
}

// ============================================
// Fetch Pods
// ============================================

export async function fetchK8sPods(
  source: DataSourceConfig,
  cluster: string,
  namespace?: string
): Promise<TelemetryResponse<K8sPod[]>> {
  if (source.type === 'mock') {
    const pods = generatePods(cluster, namespace ?? 'default', 20);
    return createSuccessResponse<K8sPod[]>(pods, 'mock');
  }

  return fetchTelemetryData<K8sPod[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.KUBERNETES_PODS,
    method: 'GET',
    params: { cluster, namespace },
  });
}

export async function fetchK8sPod(
  source: DataSourceConfig,
  cluster: string,
  namespace: string,
  podName: string
): Promise<TelemetryResponse<K8sPod>> {
  if (source.type === 'mock') {
    const pods = generatePods(cluster, namespace, 1);
    pods[0].name = podName;
    return createSuccessResponse<K8sPod>(pods[0], 'mock');
  }

  return fetchTelemetryData<K8sPod>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.KUBERNETES_PODS}/${podName}`,
    method: 'GET',
    params: { cluster, namespace },
  });
}

// ============================================
// Fetch Deployments
// ============================================

export async function fetchK8sDeployments(
  source: DataSourceConfig,
  cluster: string,
  namespace?: string
): Promise<TelemetryResponse<K8sDeployment[]>> {
  if (source.type === 'mock') {
    const deployments = generateDeployments(cluster, namespace ?? 'default', 10);
    return createSuccessResponse<K8sDeployment[]>(deployments, 'mock');
  }

  return fetchTelemetryData<K8sDeployment[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.KUBERNETES_DEPLOYMENTS,
    method: 'GET',
    params: { cluster, namespace },
  });
}

export async function fetchK8sDeployment(
  source: DataSourceConfig,
  cluster: string,
  namespace: string,
  deploymentName: string
): Promise<TelemetryResponse<K8sDeployment>> {
  if (source.type === 'mock') {
    const deployments = generateDeployments(cluster, namespace, 1);
    deployments[0].name = deploymentName;
    return createSuccessResponse<K8sDeployment>(deployments[0], 'mock');
  }

  return fetchTelemetryData<K8sDeployment>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.KUBERNETES_DEPLOYMENTS}/${deploymentName}`,
    method: 'GET',
    params: { cluster, namespace },
  });
}

// ============================================
// Fetch Namespaces
// ============================================

export async function fetchK8sNamespaces(
  source: DataSourceConfig,
  cluster: string
): Promise<TelemetryResponse<K8sNamespace[]>> {
  if (source.type === 'mock') {
    const namespaces = generateNamespaces(cluster, [
      'default',
      'kube-system',
      'kube-public',
      'monitoring',
      'logging',
      'ingress-nginx',
    ]);
    return createSuccessResponse<K8sNamespace[]>(namespaces, 'mock');
  }

  return fetchTelemetryData<K8sNamespace[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.KUBERNETES_NAMESPACES,
    method: 'GET',
    params: { cluster },
  });
}

export async function fetchK8sNamespace(
  source: DataSourceConfig,
  cluster: string,
  namespaceName: string
): Promise<TelemetryResponse<K8sNamespace>> {
  if (source.type === 'mock') {
    const namespaces = generateNamespaces(cluster, [namespaceName]);
    return createSuccessResponse<K8sNamespace>(namespaces[0], 'mock');
  }

  return fetchTelemetryData<K8sNamespace>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.KUBERNETES_NAMESPACES}/${namespaceName}`,
    method: 'GET',
    params: { cluster },
  });
}

// ============================================
// Fetch Resource Metrics
// ============================================

export async function fetchK8sResourceMetrics(
  source: DataSourceConfig,
  cluster: string,
  timeRange: TimeRange
): Promise<TelemetryResponse<{
  cpuUsage: number[];
  memoryUsage: number[];
  timestamps: number[];
}>> {
  if (source.type === 'mock') {
    const points = 60;
    const interval = (timeRange.end - timeRange.start) / points;
    const timestamps = Array.from({ length: points }, (_, i) => timeRange.start + i * interval);
    const cpuUsage = timestamps.map(() => Math.random() * 50 + 20);
    const memoryUsage = timestamps.map(() => Math.random() * 40 + 40);

    return createSuccessResponse({ cpuUsage, memoryUsage, timestamps }, 'mock');
  }

  return fetchTelemetryData({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.KUBERNETES}/metrics`,
    method: 'GET',
    params: { cluster },
    timeRange,
  });
}
