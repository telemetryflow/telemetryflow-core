/**
 * Kubernetes Pod Generation
 * Enhanced pod generation with full details (conditions, volumes, events)
 */

import type {
  K8sPod,
  K8sPodCondition,
  K8sContainer,
  K8sVolume,
  K8sPodEvent,
  PodPhase,
} from './types';
import type { K8sClusterConfig } from './cluster';
import { randomBetween, randomId, getServiceMetadata } from '@/mocks/shared';
import { getPodsByCluster, type CorrelatedPod } from '@/mocks/data/correlated-registry';
import { getClusterById, K8S_CLUSTER } from './cluster';

// ============================================
// Constants
// ============================================

// Container images by service
const SERVICE_IMAGES: Record<string, string> = {
  'frontend': 'telemetryflow/frontend:2.4.1',
  'api-gateway': 'telemetryflow/api-gateway:1.8.0',
  'user-service': 'telemetryflow/user-service:3.1.2',
  'product-catalog': 'telemetryflow/product-catalog:1.5.0',
  'cart-service': 'telemetryflow/cart-service:2.0.3',
  'order-service': 'telemetryflow/order-service:4.2.1',
  'payment-service': 'telemetryflow/payment-service:2.8.0',
  'inventory-service': 'telemetryflow/inventory-service:1.9.4',
  'notification-service': 'telemetryflow/notification-service:1.3.0',
  'recommendation-engine': 'telemetryflow/recommendation-engine:0.9.2',
  'search-service': 'telemetryflow/search-service:2.1.0',
  'shipping-service': 'telemetryflow/shipping-service:1.4.5',
};

// Resource profiles by service
const RESOURCE_PROFILES: Record<string, { cpu: string; memory: string }> = {
  'frontend': { cpu: '500m', memory: '512Mi' },
  'api-gateway': { cpu: '1000m', memory: '1Gi' },
  'user-service': { cpu: '500m', memory: '1Gi' },
  'product-catalog': { cpu: '500m', memory: '1Gi' },
  'cart-service': { cpu: '250m', memory: '256Mi' },
  'order-service': { cpu: '1000m', memory: '2Gi' },
  'payment-service': { cpu: '500m', memory: '1Gi' },
  'inventory-service': { cpu: '250m', memory: '512Mi' },
  'notification-service': { cpu: '250m', memory: '256Mi' },
  'recommendation-engine': { cpu: '2000m', memory: '4Gi' },
  'search-service': { cpu: '1000m', memory: '2Gi' },
  'shipping-service': { cpu: '250m', memory: '256Mi' },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Generate pod conditions based on running state
 */
function generatePodConditions(isRunning: boolean, startTime: number): K8sPodCondition[] {
  const status = isRunning ? 'True' : 'False';
  return [
    { type: 'Ready', status, lastTransitionTime: startTime },
    { type: 'ContainersReady', status, lastTransitionTime: startTime },
    { type: 'PodReadyToStartContainers', status: 'True', lastTransitionTime: startTime },
    { type: 'Initialized', status: 'True', lastTransitionTime: startTime },
    { type: 'PodScheduled', status: 'True', lastTransitionTime: startTime },
  ];
}

/**
 * Generate pod events based on pod state and service
 */
function generatePodEvents(
  podName: string,
  namespace: string,
  nodeName: string,
  isRunning: boolean,
  restartCount: number
): K8sPodEvent[] {
  const now = Date.now();
  const events: K8sPodEvent[] = [
    {
      type: 'Normal',
      reason: 'Scheduled',
      message: `Successfully assigned ${namespace}/${podName} to ${nodeName}`,
      source: 'default-scheduler',
      count: 1,
      firstSeen: now - 300000,
      lastSeen: now - 300000,
    },
    {
      type: 'Normal',
      reason: 'Pulled',
      message: 'Container image already present on machine',
      source: 'kubelet',
      count: 1,
      firstSeen: now - 290000,
      lastSeen: now - 290000,
    },
    {
      type: 'Normal',
      reason: 'Created',
      message: 'Created container main',
      source: 'kubelet',
      count: 1,
      firstSeen: now - 285000,
      lastSeen: now - 285000,
    },
    {
      type: 'Normal',
      reason: 'Started',
      message: 'Started container main',
      source: 'kubelet',
      count: 1,
      firstSeen: now - 280000,
      lastSeen: now - 280000,
    },
  ];

  // Add warning events for pods with restarts
  if (restartCount > 0) {
    events.push({
      type: 'Warning',
      reason: 'BackOff',
      message: 'Back-off restarting failed container',
      source: 'kubelet',
      count: restartCount,
      firstSeen: now - 600000,
      lastSeen: now - 60000,
    });
  }

  // Add scheduling warning for non-running pods
  if (!isRunning) {
    events.push({
      type: 'Warning',
      reason: 'FailedScheduling',
      message: "0/8 nodes are available: 3 node(s) had untolerated taint(s), 5 node(s) didn't match Pod's node affinity/selector.",
      source: 'default-scheduler',
      count: Math.floor(randomBetween(10, 100)),
      firstSeen: now - 900000,
      lastSeen: now - 30000,
    });
  }

  return events.sort((a, b) => b.lastSeen - a.lastSeen);
}

/**
 * Generate standard volumes for a pod
 */
function generatePodVolumes(serviceName: string): K8sVolume[] {
  const saToken = `${serviceName}-token-${randomId(5)}`;
  return [
    {
      name: 'host-time',
      kind: 'hostPath',
      hostPath: '/etc/localtime',
    },
    {
      name: saToken,
      kind: 'projected',
      defaultMode: '0o644',
      sources: [
        { type: 'Service Account Token', expiration: '3607s', path: 'token' },
        { type: 'Config Map', name: 'kube-root-ca.crt', path: 'ca.crt' },
        { type: 'Downward API', path: 'namespace' },
      ],
    },
    {
      name: 'config',
      kind: 'configMap',
      configMapName: `${serviceName}-config`,
      defaultMode: '0o644',
    },
  ];
}

/**
 * Generate container with full details
 */
function generateContainer(
  name: string,
  image: string,
  isRunning: boolean,
  restartCount: number,
  resources: { cpu: string; memory: string },
  isMain: boolean,
  serviceName: string
): K8sContainer {
  const saToken = `${serviceName}-token-${randomId(5)}`;
  return {
    name,
    image,
    state: isRunning ? 'running' : 'waiting',
    ready: isRunning,
    restartCount,
    resources: {
      requests: { ...resources, ephemeralStorage: isMain ? '2Gi' : '100Mi' },
      limits: {
        cpu: `${parseInt(resources.cpu) * 2}m`,
        memory: resources.memory.replace(/(\d+)/, (m) => String(parseInt(m) * 2)),
        ephemeralStorage: isMain ? '10Gi' : '500Mi',
      },
    },
    ports: isMain ? [{ containerPort: 8080, protocol: 'TCP' }] : [],
    startedAt: isRunning ? Date.now() - Math.floor(randomBetween(1, 72)) * 3600000 : undefined,
    command: isMain ? undefined : ['/bin/sh', '-c'],
    args: isMain ? ['--port=8080', '--metrics-port=9090'] : ['agent', '--config=/etc/telemetryflow/config.yaml'],
    env: [
      { name: 'POD_NAME', valueFrom: 'fieldRef: metadata.name' },
      { name: 'POD_NAMESPACE', valueFrom: 'fieldRef: metadata.namespace' },
      { name: 'NODE_NAME', valueFrom: 'fieldRef: spec.nodeName' },
      ...(isMain ? [
        { name: 'SERVICE_PORT', value: '8080' },
        { name: 'LOG_LEVEL', value: 'info' },
      ] : [
        { name: 'OTEL_ENDPOINT', value: 'http://telemetryflow-collector:4317' },
      ]),
    ],
    volumeMounts: [
      { name: 'host-time', mountPath: '/etc/localtime', readOnly: true },
      { name: saToken, mountPath: '/var/run/secrets/kubernetes.io/serviceaccount', readOnly: true },
      ...(isMain ? [{ name: 'config', mountPath: '/etc/config', readOnly: true }] : []),
    ],
    livenessProbe: isMain ? { httpGet: { path: '/healthz', port: 8080 }, periodSeconds: 10 } : undefined,
    readinessProbe: isMain ? { httpGet: { path: '/ready', port: 8080 }, periodSeconds: 5 } : undefined,
  };
}

// ============================================
// Pod Generation
// ============================================

/**
 * Convert a correlated pod to a K8sPod object
 */
export function correlatedPodToK8sPod(correlatedPod: CorrelatedPod, cluster: K8sClusterConfig): K8sPod {
  const metadata = getServiceMetadata(correlatedPod.service);
  const isDegraded = cluster.status === 'degraded';
  const runningChance = isDegraded ? 0.90 : 0.98;
  const isRunning = Math.random() < runningChance;
  const phase: PodPhase = isRunning ? 'Running' : (Math.random() > 0.5 ? 'Pending' : 'Failed');

  const envMultiplier = cluster.environment === 'production' ? 1 : cluster.environment === 'staging' ? 0.5 : 0.25;

  const baseResources = RESOURCE_PROFILES[correlatedPod.service] || { cpu: '500m', memory: '512Mi' };
  const resources = {
    cpu: `${Math.round(parseInt(baseResources.cpu) * envMultiplier)}m`,
    memory: baseResources.memory,
  };

  const isInfra = ['telemetryflow-collector', 'prometheus', 'grafana', 'jaeger-query', 'loki'].includes(correlatedPod.service);
  const image = isInfra
    ? `${correlatedPod.service.includes('telemetryflow') ? 'telemetryflow' : correlatedPod.service}/${correlatedPod.service}:latest`
    : SERVICE_IMAGES[correlatedPod.service] || `telemetryflow/${correlatedPod.service}:latest`;

  const restartCount = Math.floor(randomBetween(0, isDegraded ? 10 : 5));
  const containers: K8sContainer[] = isInfra
    ? [generateContainer(correlatedPod.service, image, isRunning, 0, resources, true, correlatedPod.service)]
    : [
        generateContainer(correlatedPod.service, image, isRunning, restartCount, resources, true, correlatedPod.service),
        generateContainer('telemetryflow-agent', 'telemetryflow/telemetryflow-agent:1.2.0', isRunning, 0, { cpu: '50m', memory: '64Mi' }, false, correlatedPod.service),
      ];

  return {
    name: correlatedPod.name,
    namespace: correlatedPod.namespace,
    phase,
    nodeName: correlatedPod.nodeName,
    hostIP: correlatedPod.nodeIP,
    podIP: correlatedPod.podIP,
    startTime: correlatedPod.createdAt,
    containers,
    restartCount,
    labels: {
      app: correlatedPod.service,
      'app.kubernetes.io/name': correlatedPod.service,
      'app.kubernetes.io/version': metadata.version,
      'app.kubernetes.io/component': isInfra ? 'infrastructure' : 'backend',
      'app.kubernetes.io/part-of': isInfra ? 'monitoring' : 'ecommerce',
      'pod-template-hash': correlatedPod.replicaSetId,
      'telemetryflow.id/cluster': cluster.id,
      'telemetryflow.id/region': cluster.region,
      'telemetryflow.id/environment': cluster.environment,
    },
    annotations: isInfra ? {} : {
      'prometheus.io/scrape': 'true',
      'prometheus.io/port': '8080',
      'prometheus.io/path': '/metrics',
      'sidecar.istio.io/inject': 'true',
    },
    ownerReferences: [{ kind: isInfra ? 'Deployment' : 'ReplicaSet', name: isInfra ? correlatedPod.service : `${correlatedPod.service}-${correlatedPod.replicaSetId}` }],
    qosClass: 'Burstable',
    serviceAccount: isInfra ? 'default' : `${correlatedPod.service}-sa`,
    conditions: generatePodConditions(isRunning, correlatedPod.createdAt),
    tolerations: [
      { key: 'node.kubernetes.io/not-ready', operator: 'Exists', effect: 'NoExecute', tolerationSeconds: 300 },
      { key: 'node.kubernetes.io/unreachable', operator: 'Exists', effect: 'NoExecute', tolerationSeconds: 300 },
    ],
    terminationGracePeriodSeconds: 30,
    volumes: generatePodVolumes(correlatedPod.service),
    events: generatePodEvents(correlatedPod.name, correlatedPod.namespace, correlatedPod.nodeName, isRunning, restartCount),
  };
}

/**
 * Generate all pods for a specific cluster
 * Uses the correlated registry to ensure pod names are consistent with logs/traces
 */
export function generatePods(clusterId?: string): K8sPod[] {
  const cluster = clusterId ? getClusterById(clusterId) : K8S_CLUSTER;
  if (!cluster) return [];

  // Get pods from the correlated registry
  const correlatedPods = getPodsByCluster(clusterId);

  // Convert to K8sPod objects
  return correlatedPods.map(cp => correlatedPodToK8sPod(cp, cluster));
}
