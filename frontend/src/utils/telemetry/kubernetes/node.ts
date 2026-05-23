/**
 * Kubernetes Node Generation
 * Enhanced node generation with events and full details
 */

import type { K8sNode, K8sNodeEvent } from './types';
import type { K8sClusterConfig, K8sNodeConfig } from './cluster';
import { randomBetween, generatePrivateIP } from '@/mocks/shared';
import { getClusterById, getNodesByCluster, K8S_CLUSTER, K8S_NODES } from './cluster';

/**
 * Generate node events
 */
function generateNodeEvents(nodeName: string, isDegraded: boolean): K8sNodeEvent[] {
  const now = Date.now();
  const events: K8sNodeEvent[] = [
    {
      type: 'Normal',
      reason: 'Starting',
      message: 'Starting kubelet',
      source: 'kubelet',
      count: 1,
      firstSeen: now - 604800000, // 7 days ago
      lastSeen: now - 604800000,
    },
    {
      type: 'Normal',
      reason: 'NodeReady',
      message: `Node ${nodeName} status is now: NodeReady`,
      source: 'kubelet',
      count: 1,
      firstSeen: now - 604700000,
      lastSeen: now - 604700000,
    },
    {
      type: 'Normal',
      reason: 'RegisteredNode',
      message: `Node ${nodeName} event: Registered Node ${nodeName} in Controller`,
      source: 'node-controller',
      count: 1,
      firstSeen: now - 604600000,
      lastSeen: now - 604600000,
    },
  ];

  // Add warning events for degraded nodes
  if (isDegraded && Math.random() > 0.5) {
    events.push({
      type: 'Warning',
      reason: 'EvictionThresholdMet',
      message: 'Attempting to reclaim memory',
      source: 'kubelet',
      count: Math.floor(randomBetween(1, 5)),
      firstSeen: now - 3600000,
      lastSeen: now - 1800000,
    });
  }

  // Add recent heartbeat
  events.push({
    type: 'Normal',
    reason: 'NodeAllocatableEnforced',
    message: 'Updated Node Allocatable limit across pods',
    source: 'kubelet',
    count: Math.floor(randomBetween(100, 500)),
    firstSeen: now - 604800000,
    lastSeen: now - 60000,
  });

  return events;
}

/**
 * Generate a Kubernetes node for a specific cluster
 */
export function generateNode(nodeConfig: K8sNodeConfig, cluster: K8sClusterConfig): K8sNode {
  const cpuUsed = randomBetween(2, nodeConfig.cpu - 1);
  const memoryUsed = randomBetween(Math.min(4, nodeConfig.memory - 2), nodeConfig.memory - 2);
  const podsRunning = Math.floor(randomBetween(10, Math.min(35, nodeConfig.cpu * 4)));

  // Disk capacity based on instance type (larger instances have more storage)
  const diskCapacity = nodeConfig.cpu >= 16 ? 500 : nodeConfig.cpu >= 8 ? 200 : 100;
  const diskUsed = randomBetween(diskCapacity * 0.2, diskCapacity * 0.7);

  // Degraded clusters have more issues
  const isDegraded = cluster.status === 'degraded';
  const readyChance = isDegraded ? 0.85 : 0.98;

  return {
    name: nodeConfig.name,
    status: Math.random() > (1 - readyChance) ? 'Ready' : 'NotReady',
    roles: ['worker'],
    instanceType: nodeConfig.instanceType,
    kubeletVersion: `v${cluster.version}`,
    containerRuntime: 'containerd://1.7.11',
    cpu: {
      capacity: `${nodeConfig.cpu}`,
      allocatable: `${nodeConfig.cpu - 0.5}`,
      used: `${cpuUsed.toFixed(1)}`,
      usagePercent: Math.round((cpuUsed / nodeConfig.cpu) * 100),
    },
    memory: {
      capacity: `${nodeConfig.memory} Gi`,
      allocatable: `${nodeConfig.memory - 2} Gi`,
      used: `${memoryUsed.toFixed(1)} Gi`,
      usagePercent: Math.round((memoryUsed / nodeConfig.memory) * 100),
    },
    disk: {
      capacity: `${diskCapacity} Gi`,
      used: `${Math.round(diskUsed)} Gi`,
      usagePercent: Math.round((diskUsed / diskCapacity) * 100),
    },
    pods: {
      capacity: 110,
      running: podsRunning,
    },
    conditions: {
      Ready: Math.random() > (isDegraded ? 0.15 : 0.02),
      MemoryPressure: Math.random() < (isDegraded ? 0.05 : 0.01),
      DiskPressure: Math.random() < (isDegraded ? 0.03 : 0.01),
      PIDPressure: Math.random() < 0.005,
      NetworkUnavailable: false,
    },
    labels: {
      'kubernetes.io/arch': 'amd64',
      'kubernetes.io/os': 'linux',
      'node.kubernetes.io/instance-type': nodeConfig.instanceType,
      'topology.kubernetes.io/region': cluster.region,
      'topology.kubernetes.io/zone': nodeConfig.zone,
      'telemetryflow.id/cluster': cluster.id,
      'telemetryflow.id/environment': cluster.environment,
    },
    annotations: {
      'node.alpha.kubernetes.io/ttl': '0',
    },
    createdAt: Date.now() - Math.floor(randomBetween(7, 90)) * 86400000,
    internalIP: nodeConfig.name.match(/ip-(\d+-\d+-\d+-\d+)/)?.[1]?.replace(/-/g, '.') || generatePrivateIP(),
    events: generateNodeEvents(nodeConfig.name, isDegraded),
  };
}

/**
 * Generate all nodes for a specific cluster
 */
export function generateNodes(clusterId?: string): K8sNode[] {
  const cluster = clusterId ? getClusterById(clusterId) : K8S_CLUSTER;
  if (!cluster) return [];

  const nodes = clusterId ? getNodesByCluster(clusterId) : K8S_NODES;
  return nodes.map(nodeConfig => generateNode(nodeConfig, cluster));
}

/**
 * Generate nodes for all clusters in a region
 */
export function generateNodesByRegion(_regionId: string): Record<string, K8sNode[]> {
  // This will be implemented when we have region support
  // For now, return empty object
  return {};
}

/**
 * Generate nodes for all clusters
 */
export function generateAllNodes(): Record<string, K8sNode[]> {
  // This will be implemented when we have all clusters support
  // For now, return empty object
  return {};
}
