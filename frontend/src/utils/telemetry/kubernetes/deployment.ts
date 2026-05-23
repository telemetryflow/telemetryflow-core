/**
 * Kubernetes Deployment Generation
 */

import type { K8sDeployment } from './types';
import { randomBetween, randomId, getServiceMetadata } from '@/mocks/shared';
import { getClusterById, K8S_CLUSTER } from './cluster';
import { SERVICES } from '../constants';

/**
 * Generate a deployment for a service in a specific cluster
 */
export function generateDeployment(service: string, clusterId?: string): K8sDeployment {
  const cluster = clusterId ? getClusterById(clusterId) : K8S_CLUSTER;
  if (!cluster) throw new Error(`Invalid cluster: ${clusterId}`);

  const metadata = getServiceMetadata(service);

  // Scale replicas based on environment
  const replicaMultiplier = cluster.environment === 'production' ? 1 :
    cluster.environment === 'staging' ? 0.5 : 0.3;
  const replicas = Math.max(1, Math.round((metadata.replicas || 2) * replicaMultiplier));

  // Degraded clusters have more issues
  const isDegraded = cluster.status === 'degraded';
  const ready = isDegraded ? Math.max(0, replicas - Math.floor(Math.random() * 2)) :
    (Math.random() > 0.05 ? replicas : replicas - 1);

  // Determine namespace based on environment
  const namespace = cluster.environment === 'production' ? 'ecommerce' :
    cluster.environment === 'staging' ? 'ecommerce-staging' : 'ecommerce-dev';

  return {
    name: service,
    namespace,
    replicas: {
      desired: replicas,
      ready,
      available: ready,
      updated: replicas,
    },
    strategy: {
      type: 'RollingUpdate',
      maxUnavailable: '25%',
      maxSurge: '25%',
    },
    labels: {
      app: service,
      'app.kubernetes.io/name': service,
      'app.kubernetes.io/version': metadata.version,
      'telemetryflow.id/cluster': cluster.id,
      'telemetryflow.id/region': cluster.region,
      'telemetryflow.id/environment': cluster.environment,
    },
    annotations: {
      'deployment.kubernetes.io/revision': String(Math.floor(randomBetween(1, 20))),
      'kubectl.kubernetes.io/last-applied-configuration': '{}',
    },
    conditions: [
      { type: 'Available', status: ready === replicas ? 'True' : 'False', reason: 'MinimumReplicasAvailable', message: 'Deployment has minimum availability.' },
      { type: 'Progressing', status: 'True', reason: 'NewReplicaSetAvailable', message: `ReplicaSet "${service}-${randomId(10)}" has successfully progressed.` },
    ],
    createdAt: Date.now() - Math.floor(randomBetween(30, 180)) * 86400000,
    updatedAt: Date.now() - Math.floor(randomBetween(1, 7)) * 86400000,
  };
}

/**
 * Generate all deployments for a specific cluster
 */
export function generateDeployments(clusterId?: string): K8sDeployment[] {
  return SERVICES.map(service => generateDeployment(service, clusterId));
}
