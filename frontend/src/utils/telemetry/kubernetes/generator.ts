/**
 * Kubernetes Generator
 * Generate mock Kubernetes resources and metrics
 * 
 * This module wraps the mock kubernetes functions to provide a consistent interface
 * for the telemetry utilities while maintaining compatibility with existing mock data.
 */

import type {
  K8sClusterData,
  K8sClusterMetrics,
  K8sNode,
  K8sNodeMetrics,
  K8sNamespace,
  K8sNamespaceMetrics,
  K8sPod,
  K8sPodMetrics,
  K8sDeployment,
  K8sDeploymentMetrics,
} from '../types';
import {
  generateNodes as mockGenerateNodes,
  generatePods as mockGeneratePods,
  generateDeployments as mockGenerateDeployments,
  generateNamespaces as mockGenerateNamespaces,
  generateClusterOverview as mockGenerateClusterOverview,
  generatePersistentVolumes as mockGeneratePersistentVolumes,
  type K8sClusterOverview,
} from '@/mocks/kubernetes';
import {
  createSeededRandom,
} from '../common/generator';
import { gbToBytes } from '../common/transformer';

// ============================================
// K8s Generator Config
// ============================================

export interface K8sGeneratorConfig {
  cluster: string;
  region?: string;
  provider?: string;
  namespaces?: string[];
  nodeCount?: number;
  podsPerNamespace?: number;
}

// ============================================
// Cluster Generator
// ============================================

export function generateK8sCluster(config: K8sGeneratorConfig): K8sClusterData {
  const {
    cluster,
    region,
    provider,
  } = config;

  const random = createSeededRandom(cluster.length);
  
  // Use mock functions to generate data
  const nodes = mockGenerateNodes(cluster);
  const generatedNamespaces = mockGenerateNamespaces(cluster);
  const pods = mockGeneratePods(cluster);
  const deployments = mockGenerateDeployments(cluster);

  return {
    cluster,
    region: region ?? random.pick(['us-east-1', 'us-west-2', 'eu-west-1']),
    provider: provider ?? random.pick(['aws', 'gcp', 'azure']),
    version: `1.${random.nextInt(25, 29)}.${random.nextInt(0, 10)}`,
    nodes,
    namespaces: generatedNamespaces,
    pods,
    deployments,
    metrics: generateClusterMetrics(cluster, nodes, pods),
  };
}

function generateClusterMetrics(
  _cluster: string,
  nodes: K8sNode[],
  pods: K8sPod[]
): K8sClusterMetrics {
  const runningPods = pods.filter(p => p.phase === 'Running').length;
  const pendingPods = pods.filter(p => p.phase === 'Pending').length;
  const failedPods = pods.filter(p => p.phase === 'Failed').length;
  const readyNodes = nodes.filter(n => n.status === 'Ready').length;

  // Parse CPU capacity from string format "8" to number
  const totalCpu = nodes.reduce((sum, n) => sum + parseFloat(n.cpu.capacity), 0);
  const usedCpu = nodes.reduce((sum, n) => sum + parseFloat(n.cpu.used), 0);
  
  // Parse memory capacity from string format "16 Gi" to bytes
  const totalMemory = nodes.reduce((sum, n) => {
    const match = n.memory.capacity.match(/(\d+)\s*Gi/);
    return sum + (match ? gbToBytes(parseFloat(match[1])) : 0);
  }, 0);
  const usedMemory = nodes.reduce((sum, n) => {
    const match = n.memory.used.match(/(\d+\.?\d*)\s*Gi/);
    return sum + (match ? gbToBytes(parseFloat(match[1])) : 0);
  }, 0);

  return {
    nodeCount: nodes.length,
    nodeReady: readyNodes,
    podCount: pods.length,
    podRunning: runningPods,
    podPending: pendingPods,
    podFailed: failedPods,
    namespaceCount: new Set(pods.map(p => p.namespace)).size,
    deploymentCount: new Set(pods.filter(p => p.ownerReferences.some(ref => ref.kind === 'ReplicaSet')).map(p => p.ownerReferences[0].name)).size,
    cpuCapacity: totalCpu,
    cpuUsed: usedCpu,
    cpuUtilization: totalCpu > 0 ? (usedCpu / totalCpu) * 100 : 0,
    memoryCapacity: totalMemory,
    memoryUsed: usedMemory,
    memoryUtilization: totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0,
  };
}

// ============================================
// Node Generators
// ============================================

export function generateNodes(cluster: string, _count?: number): K8sNode[] {
  // Use mock function directly
  return mockGenerateNodes(cluster);
}

export function generateNodeMetrics(cluster: string, nodeName: string): K8sNodeMetrics {
  const random = createSeededRandom((cluster + nodeName).length);
  
  // Parse CPU and memory from node data
  const cpuCapacity = random.pick([4, 8, 16]);
  const memoryCapacity = gbToBytes(random.pick([16, 32, 64]));
  const cpuUsage = random.nextFloat(1, cpuCapacity * 0.8);
  const memoryUsage = random.nextFloat(memoryCapacity * 0.3, memoryCapacity * 0.8);

  return {
    name: nodeName,
    cpuUtilization: (cpuUsage / cpuCapacity) * 100,
    cpuUsage,
    cpuCapacity,
    memoryUtilization: (memoryUsage / memoryCapacity) * 100,
    memoryUsage,
    memoryCapacity,
    podCount: random.nextInt(10, 80),
    podCapacity: cpuCapacity * 10,
    networkReceive: random.nextInt(1000000, 100000000),
    networkTransmit: random.nextInt(500000, 50000000),
    diskUsage: random.nextFloat(20, 80) * gbToBytes(1),
    diskCapacity: gbToBytes(100),
  };
}

// ============================================
// Namespace Generators
// ============================================

export function generateNamespaces(cluster: string, _names?: string[]): K8sNamespace[] {
  // Use mock function directly
  return mockGenerateNamespaces(cluster);
}

export function generateNamespaceMetrics(
  cluster: string,
  namespace: string
): K8sNamespaceMetrics {
  const random = createSeededRandom((cluster + namespace).length);
  const podCount = random.nextInt(5, 50);
  const cpuLimit = random.pick([4, 8, 16]);
  const memoryLimit = gbToBytes(random.pick([8, 16, 32]));
  const cpuUsage = random.nextFloat(0.5, cpuLimit * 0.8);
  const memoryUsage = random.nextFloat(gbToBytes(1), memoryLimit * 0.8);

  return {
    name: namespace,
    podCount,
    podRunning: Math.floor(podCount * random.nextFloat(0.8, 0.95)),
    podPending: Math.floor(podCount * random.nextFloat(0, 0.1)),
    podFailed: Math.floor(podCount * random.nextFloat(0, 0.05)),
    cpuUsage,
    cpuLimit,
    cpuUtilization: (cpuUsage / cpuLimit) * 100,
    memoryUsage,
    memoryLimit,
    memoryUtilization: (memoryUsage / memoryLimit) * 100,
  };
}

// ============================================
// Pod Generators
// ============================================

export function generatePods(
  cluster: string,
  _namespace?: string,
  _count?: number,
  _nodes?: K8sNode[]
): K8sPod[] {
  // Use mock function directly
  return mockGeneratePods(cluster);
}

export function generatePodMetrics(
  cluster: string,
  namespace: string,
  podName: string
): K8sPodMetrics {
  const random = createSeededRandom((cluster + namespace + podName).length);
  const cpuRequest = random.nextFloat(0.1, 0.5);
  const cpuLimit = random.nextFloat(0.5, 2);
  const memoryRequest = gbToBytes(random.nextFloat(0.128, 0.512));
  const memoryLimit = gbToBytes(random.nextFloat(0.512, 2.048));
  const cpuUsage = random.nextFloat(cpuRequest * 0.5, cpuLimit * 0.9);
  const memoryUsage = random.nextFloat(memoryRequest * 0.5, memoryLimit * 0.9);

  return {
    name: podName,
    namespace,
    cpuUsage,
    cpuRequest,
    cpuLimit,
    cpuUtilization: (cpuUsage / cpuLimit) * 100,
    memoryUsage,
    memoryRequest,
    memoryLimit,
    memoryUtilization: (memoryUsage / memoryLimit) * 100,
    networkReceive: random.nextInt(10000, 10000000),
    networkTransmit: random.nextInt(5000, 5000000),
    restartCount: random.nextInt(0, 5),
  };
}

// ============================================
// Deployment Generators
// ============================================

export function generateDeployments(
  cluster: string,
  _namespace?: string,
  _count?: number
): K8sDeployment[] {
  // Use mock function directly
  return mockGenerateDeployments(cluster);
}

export function generateDeploymentMetrics(
  cluster: string,
  namespace: string,
  deploymentName: string
): K8sDeploymentMetrics {
  const random = createSeededRandom((cluster + namespace + deploymentName).length);
  const desired = random.pick([1, 2, 3, 5]);
  const ready = random.nextInt(Math.max(0, desired - 1), desired);

  return {
    name: deploymentName,
    namespace,
    desired,
    ready,
    available: ready,
    updated: ready,
    unavailable: desired - ready,
    cpuUsage: random.nextFloat(0.5, 5),
    memoryUsage: gbToBytes(random.nextFloat(0.5, 4)),
  };
}

// ============================================
// Overview Generator
// ============================================

export function generateK8sOverview(cluster: string): K8sClusterOverview {
  // Use mock function directly
  return mockGenerateClusterOverview(cluster);
}

// ============================================
// Persistent Volume Generator
// ============================================

export function generatePersistentVolumes() {
  // Use mock function directly
  return mockGeneratePersistentVolumes();
}
