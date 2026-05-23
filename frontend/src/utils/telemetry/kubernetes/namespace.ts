/**
 * Kubernetes Namespace Generation
 */

import type { K8sNamespace, K8sPersistentVolume } from './types';
import { randomBetween } from '@/mocks/shared';
import { getClusterById, K8S_CLUSTER } from './cluster';

/**
 * Generate namespaces for a specific cluster
 */
export function generateNamespaces(clusterId?: string): K8sNamespace[] {
  const cluster = clusterId ? getClusterById(clusterId) : K8S_CLUSTER;
  if (!cluster) return [];

  return cluster.namespaces.map(name => ({
    name,
    status: 'Active',
    labels: {
      'kubernetes.io/metadata.name': name,
      'telemetryflow.id/cluster': cluster.id,
      'telemetryflow.id/region': cluster.region,
      ...(name.includes('ecommerce') ? { 'istio-injection': 'enabled' } : {}),
    },
    annotations: {},
    resourceQuota: name === 'ecommerce' ? {
      cpu: { used: '24', hard: '64' },
      memory: { used: '48Gi', hard: '128Gi' },
      pods: { used: 35, hard: 100 },
    } : undefined,
    createdAt: Date.now() - Math.floor(randomBetween(90, 365)) * 86400000,
  }));
}

/**
 * Generate persistent volumes
 */
export function generatePersistentVolumes(): K8sPersistentVolume[] {
  const volumeConfigs = [
    { name: 'postgres-users-pv', capacity: '100Gi', storageClass: 'gp3', claim: { name: 'postgres-users-pvc', namespace: 'ecommerce' } },
    { name: 'postgres-orders-pv', capacity: '200Gi', storageClass: 'gp3', claim: { name: 'postgres-orders-pvc', namespace: 'ecommerce' } },
    { name: 'postgres-catalog-pv', capacity: '150Gi', storageClass: 'gp3', claim: { name: 'postgres-catalog-pvc', namespace: 'ecommerce' } },
    { name: 'elasticsearch-data-pv-0', capacity: '500Gi', storageClass: 'gp3', claim: { name: 'elasticsearch-data-pvc-0', namespace: 'ecommerce' } },
    { name: 'elasticsearch-data-pv-1', capacity: '500Gi', storageClass: 'gp3', claim: { name: 'elasticsearch-data-pvc-1', namespace: 'ecommerce' } },
    { name: 'prometheus-data-pv', capacity: '100Gi', storageClass: 'gp3', claim: { name: 'prometheus-data-pvc', namespace: 'monitoring' } },
    { name: 'loki-data-pv', capacity: '200Gi', storageClass: 'gp3', claim: { name: 'loki-data-pvc', namespace: 'monitoring' } },
  ];

  return volumeConfigs.map(v => ({
    name: v.name,
    capacity: v.capacity,
    accessModes: ['ReadWriteOnce'] as string[],
    reclaimPolicy: 'Retain' as const,
    storageClass: v.storageClass,
    status: 'Bound' as const,
    claim: v.claim,
    createdAt: Date.now() - Math.floor(randomBetween(30, 180)) * 86400000,
  }));
}
