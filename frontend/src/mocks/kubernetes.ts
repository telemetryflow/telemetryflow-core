/**
 * Kubernetes Mock Data Generator
 * Generates realistic Kubernetes cluster data for development and demo purposes
 * Compatible with TelemetryFlow v2 API (/v2/kubernetes/*)
 *
 * Supports hierarchical filtering: Region → Cluster → Namespace
 */

import {
  SERVICES,
  K8S_CLUSTER,
  K8S_NODES,
  K8S_CLUSTERS,
  K8S_ALL_CLUSTERS,
  randomId,
  randomBetween,
  generatePrivateIP,
  getServiceMetadata,
  getClusterById,
  getNodesByCluster,
  type K8sRegionId,
  type K8sClusterConfig,
  type K8sNodeConfig,
} from "./shared";
import {
  getPodsByCluster,
  type CorrelatedPod,
} from "./data/correlated-registry";

// Pod status types
export type PodPhase =
  | "Running"
  | "Pending"
  | "Succeeded"
  | "Failed"
  | "Unknown";
export type ContainerState = "running" | "waiting" | "terminated";

// Kubernetes resource types
export interface K8sNode {
  name: string;
  status: "Ready" | "NotReady" | "Unknown";
  roles: string[];
  instanceType: string;
  kubeletVersion: string;
  containerRuntime: string;
  cpu: {
    capacity: string;
    allocatable: string;
    used: string;
    usagePercent: number;
  };
  memory: {
    capacity: string;
    allocatable: string;
    used: string;
    usagePercent: number;
  };
  disk: {
    capacity: string;
    used: string;
    usagePercent: number;
  };
  pods: {
    capacity: number;
    running: number;
  };
  conditions: {
    Ready: boolean;
    MemoryPressure: boolean;
    DiskPressure: boolean;
    PIDPressure: boolean;
    NetworkUnavailable: boolean;
  };
  labels: Record<string, string>;
  annotations: Record<string, string>;
  createdAt: number;
  internalIP: string;
  externalIP?: string;
  events: K8sNodeEvent[];
}

export interface K8sNodeEvent {
  type: "Normal" | "Warning";
  reason: string;
  message: string;
  source: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

// Pod condition types
export interface K8sPodCondition {
  type:
    | "Ready"
    | "ContainersReady"
    | "PodReadyToStartContainers"
    | "Initialized"
    | "PodScheduled";
  status: "True" | "False" | "Unknown";
  lastTransitionTime: number;
  reason?: string;
  message?: string;
}

// Volume mount
export interface K8sVolumeMount {
  name: string;
  mountPath: string;
  readOnly?: boolean;
  subPath?: string;
}

// Volume definitions
export interface K8sVolume {
  name: string;
  kind:
    | "hostPath"
    | "emptyDir"
    | "configMap"
    | "secret"
    | "projected"
    | "persistentVolumeClaim";
  hostPath?: string;
  configMapName?: string;
  secretName?: string;
  claimName?: string;
  defaultMode?: string;
  sources?: {
    type: string;
    name?: string;
    path?: string;
    expiration?: string;
  }[];
}

// Pod event (K8s event format)
export interface K8sPodEvent {
  type: "Normal" | "Warning";
  reason: string;
  message: string;
  source: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

export interface K8sPod {
  name: string;
  namespace: string;
  phase: PodPhase;
  nodeName: string;
  hostIP: string;
  podIP: string;
  startTime: number;
  containers: K8sContainer[];
  restartCount: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  ownerReferences: { kind: string; name: string }[];
  qosClass: "Guaranteed" | "Burstable" | "BestEffort";
  serviceAccount: string;
  // Enhanced fields
  conditions: K8sPodCondition[];
  tolerations: {
    key: string;
    operator: string;
    effect: string;
    tolerationSeconds?: number;
  }[];
  terminationGracePeriodSeconds: number;
  volumes: K8sVolume[];
  events: K8sPodEvent[];
}

export interface K8sContainer {
  name: string;
  image: string;
  state: ContainerState;
  ready: boolean;
  restartCount: number;
  resources: {
    requests: { cpu: string; memory: string; ephemeralStorage?: string };
    limits: { cpu: string; memory: string; ephemeralStorage?: string };
  };
  ports: { containerPort: number; protocol: string }[];
  startedAt?: number;
  lastState?: { reason: string; exitCode: number; finishedAt: number };
  // Enhanced fields
  command?: string[];
  args?: string[];
  env?: { name: string; value?: string; valueFrom?: string }[];
  volumeMounts: K8sVolumeMount[];
  livenessProbe?: {
    httpGet?: { path: string; port: number };
    periodSeconds: number;
  };
  readinessProbe?: {
    httpGet?: { path: string; port: number };
    periodSeconds: number;
  };
}

export interface K8sDeployment {
  name: string;
  namespace: string;
  replicas: {
    desired: number;
    ready: number;
    available: number;
    updated: number;
  };
  strategy: {
    type: "RollingUpdate" | "Recreate";
    maxUnavailable?: string;
    maxSurge?: string;
  };
  labels: Record<string, string>;
  annotations: Record<string, string>;
  conditions: {
    type: string;
    status: string;
    reason: string;
    message: string;
  }[];
  createdAt: number;
  updatedAt: number;
}

export interface K8sService {
  name: string;
  namespace: string;
  type: "ClusterIP" | "NodePort" | "LoadBalancer" | "ExternalName";
  clusterIP: string;
  externalIP?: string;
  ports: {
    name: string;
    port: number;
    targetPort: number;
    protocol: string;
    nodePort?: number;
  }[];
  selector: Record<string, string>;
  createdAt: number;
}

export interface K8sNamespace {
  name: string;
  status: "Active" | "Terminating";
  labels: Record<string, string>;
  annotations: Record<string, string>;
  resourceQuota?: {
    cpu: { used: string; hard: string };
    memory: { used: string; hard: string };
    pods: { used: number; hard: number };
  };
  createdAt: number;
}

export interface K8sPersistentVolume {
  name: string;
  capacity: string;
  accessModes: string[];
  reclaimPolicy: "Retain" | "Delete" | "Recycle";
  storageClass: string;
  status: "Available" | "Bound" | "Released" | "Failed";
  claim?: { name: string; namespace: string };
  createdAt: number;
}

export interface K8sClusterOverview {
  cluster: {
    name: string;
    version: string;
    provider: string;
    region: string;
  };
  health: {
    status: "healthy" | "degraded" | "critical";
    score: number;
    issues: string[];
  };
  resources: {
    nodes: { total: number; ready: number };
    pods: { total: number; running: number; pending: number; failed: number };
    deployments: { total: number; available: number };
    services: { total: number };
    namespaces: { total: number };
  };
  metrics: {
    cpuUsagePercent: number;
    memoryUsagePercent: number;
    podDensity: number;
  };
}

// Container images by service
const SERVICE_IMAGES: Record<string, string> = {
  frontend: "telemetryflow/frontend:2.4.1",
  "api-gateway": "telemetryflow/api-gateway:1.8.0",
  "user-service": "telemetryflow/user-service:3.1.2",
  "product-catalog": "telemetryflow/product-catalog:1.5.0",
  "cart-service": "telemetryflow/cart-service:2.0.3",
  "order-service": "telemetryflow/order-service:4.2.1",
  "payment-service": "telemetryflow/payment-service:2.8.0",
  "inventory-service": "telemetryflow/inventory-service:1.9.4",
  "notification-service": "telemetryflow/notification-service:1.3.0",
  "recommendation-engine": "telemetryflow/recommendation-engine:0.9.2",
  "search-service": "telemetryflow/search-service:2.1.0",
  "shipping-service": "telemetryflow/shipping-service:1.4.5",
};

// =============================================================================
// Backend-synced seed data for cluster-prod-us-east-1
// Pods, Deployments, and Node overrides matching backend seeds exactly
// =============================================================================

/**
 * Generate seed nodes for cluster-prod-us-east-1 with exact backend seed data.
 * Node 4 (ip-10-0-1-30) is NotReady with MemoryPressure per backend seed.
 */
function generateSeedNodesForProdUsEast1(): K8sNode[] {
  const now = Date.now();
  const baseCreatedAt = now - 30 * 86400000; // 30 days ago

  return [
    {
      name: "ip-10-0-1-10.ec2.internal",
      status: "Ready",
      roles: ["control-plane"],
      instanceType: "m5.xlarge",
      kubeletVersion: "v1.28.4",
      containerRuntime: "containerd://1.7.11",
      cpu: { capacity: "4", allocatable: "3.5", used: "1.8", usagePercent: 45 },
      memory: {
        capacity: "16Gi",
        allocatable: "14Gi",
        used: "8.2Gi",
        usagePercent: 51,
      },
      disk: { capacity: "100Gi", used: "35Gi", usagePercent: 35 },
      pods: { capacity: 110, running: 18 },
      conditions: {
        Ready: true,
        MemoryPressure: false,
        DiskPressure: false,
        PIDPressure: false,
        NetworkUnavailable: false,
      },
      labels: {
        "kubernetes.io/arch": "amd64",
        "kubernetes.io/os": "linux",
        "node.kubernetes.io/instance-type": "m5.xlarge",
        "node-role.kubernetes.io/control-plane": "",
        "topology.kubernetes.io/region": "us-east-1",
        "topology.kubernetes.io/zone": "us-east-1a",
        "telemetryflow.id/cluster": "cluster-prod-us-east-1",
      },
      annotations: { "node.alpha.kubernetes.io/ttl": "0" },
      createdAt: baseCreatedAt,
      internalIP: "10.0.1.10",
      events: [],
    },
    {
      name: "ip-10-0-1-20.ec2.internal",
      status: "Ready",
      roles: ["worker"],
      instanceType: "m5.2xlarge",
      kubeletVersion: "v1.28.4",
      containerRuntime: "containerd://1.7.11",
      cpu: { capacity: "8", allocatable: "7.5", used: "4.2", usagePercent: 53 },
      memory: {
        capacity: "32Gi",
        allocatable: "30Gi",
        used: "18.5Gi",
        usagePercent: 58,
      },
      disk: { capacity: "200Gi", used: "80Gi", usagePercent: 40 },
      pods: { capacity: 110, running: 28 },
      conditions: {
        Ready: true,
        MemoryPressure: false,
        DiskPressure: false,
        PIDPressure: false,
        NetworkUnavailable: false,
      },
      labels: {
        "kubernetes.io/arch": "amd64",
        "kubernetes.io/os": "linux",
        "node.kubernetes.io/instance-type": "m5.2xlarge",
        "topology.kubernetes.io/region": "us-east-1",
        "topology.kubernetes.io/zone": "us-east-1a",
        "telemetryflow.id/cluster": "cluster-prod-us-east-1",
      },
      annotations: { "node.alpha.kubernetes.io/ttl": "0" },
      createdAt: baseCreatedAt,
      internalIP: "10.0.1.20",
      events: [],
    },
    {
      name: "ip-10-0-1-21.ec2.internal",
      status: "Ready",
      roles: ["worker"],
      instanceType: "m5.2xlarge",
      kubeletVersion: "v1.28.4",
      containerRuntime: "containerd://1.7.11",
      cpu: { capacity: "8", allocatable: "7.5", used: "5.1", usagePercent: 64 },
      memory: {
        capacity: "32Gi",
        allocatable: "30Gi",
        used: "20.3Gi",
        usagePercent: 63,
      },
      disk: { capacity: "200Gi", used: "90Gi", usagePercent: 45 },
      pods: { capacity: 110, running: 25 },
      conditions: {
        Ready: true,
        MemoryPressure: false,
        DiskPressure: false,
        PIDPressure: false,
        NetworkUnavailable: false,
      },
      labels: {
        "kubernetes.io/arch": "amd64",
        "kubernetes.io/os": "linux",
        "node.kubernetes.io/instance-type": "m5.2xlarge",
        "topology.kubernetes.io/region": "us-east-1",
        "topology.kubernetes.io/zone": "us-east-1b",
        "telemetryflow.id/cluster": "cluster-prod-us-east-1",
      },
      annotations: { "node.alpha.kubernetes.io/ttl": "0" },
      createdAt: baseCreatedAt,
      internalIP: "10.0.1.21",
      events: [],
    },
    {
      name: "ip-10-0-1-30.ec2.internal",
      status: "NotReady",
      roles: ["worker"],
      instanceType: "m5.2xlarge",
      kubeletVersion: "v1.28.4",
      containerRuntime: "containerd://1.7.11",
      cpu: { capacity: "8", allocatable: "7.5", used: "7.0", usagePercent: 88 },
      memory: {
        capacity: "32Gi",
        allocatable: "30Gi",
        used: "29.5Gi",
        usagePercent: 92,
      },
      disk: { capacity: "200Gi", used: "160Gi", usagePercent: 80 },
      pods: { capacity: 110, running: 5 },
      conditions: {
        Ready: false,
        MemoryPressure: true,
        DiskPressure: false,
        PIDPressure: false,
        NetworkUnavailable: false,
      },
      labels: {
        "kubernetes.io/arch": "amd64",
        "kubernetes.io/os": "linux",
        "node.kubernetes.io/instance-type": "m5.2xlarge",
        "topology.kubernetes.io/region": "us-east-1",
        "topology.kubernetes.io/zone": "us-east-1b",
        "telemetryflow.id/cluster": "cluster-prod-us-east-1",
      },
      annotations: { "node.alpha.kubernetes.io/ttl": "0" },
      createdAt: baseCreatedAt,
      internalIP: "10.0.1.30",
      events: [
        {
          type: "Warning",
          reason: "EvictionThresholdMet",
          message: "Attempting to reclaim memory",
          source: "kubelet",
          count: 12,
          firstSeen: Date.now() - 7200000,
          lastSeen: Date.now() - 300000,
        },
      ],
    },
  ];
}

/**
 * Generate seed pods for cluster-prod-us-east-1 matching backend seeds.
 */
function generateSeedPodsForProdUsEast1(): K8sPod[] {
  const now = Date.now();
  const startTime = now - 24 * 3600000; // 24 hours ago

  const basePod = (
    overrides: Partial<K8sPod> & {
      name: string;
      namespace: string;
      phase: PodPhase;
    },
  ): K8sPod => ({
    nodeName: "ip-10-0-1-20.ec2.internal",
    hostIP: "10.0.1.20",
    podIP: generatePrivateIP(),
    startTime,
    containers: [],
    restartCount: 0,
    labels: {},
    annotations: {},
    ownerReferences: [],
    qosClass: "Burstable",
    serviceAccount: "default",
    conditions: generateSeedPodConditions(
      overrides.phase === "Running",
      startTime,
    ),
    tolerations: [
      {
        key: "node.kubernetes.io/not-ready",
        operator: "Exists",
        effect: "NoExecute",
        tolerationSeconds: 300,
      },
      {
        key: "node.kubernetes.io/unreachable",
        operator: "Exists",
        effect: "NoExecute",
        tolerationSeconds: 300,
      },
    ],
    terminationGracePeriodSeconds: 30,
    volumes: [],
    events: [],
    ...overrides,
  });

  return [
    basePod({
      name: "telemetryflow-api-7d9f5c4b8-x2k9l",
      namespace: "telemetryflow",
      phase: "Running",
      nodeName: "ip-10-0-1-20.ec2.internal",
      hostIP: "10.0.1.20",
      containers: [
        {
          name: "telemetryflow-api",
          image: "telemetryflow/api:1.5.0",
          state: "running",
          ready: true,
          restartCount: 0,
          resources: {
            requests: { cpu: "500m", memory: "512Mi" },
            limits: { cpu: "1000m", memory: "1Gi" },
          },
          ports: [{ containerPort: 8080, protocol: "TCP" }],
          startedAt: startTime,
          volumeMounts: [],
        },
      ],
      labels: {
        app: "telemetryflow-api",
        "app.kubernetes.io/name": "telemetryflow-api",
        "pod-template-hash": "7d9f5c4b8",
      },
      ownerReferences: [
        { kind: "ReplicaSet", name: "telemetryflow-api-7d9f5c4b8" },
      ],
    }),
    basePod({
      name: "telemetryflow-api-7d9f5c4b8-m3j8p",
      namespace: "telemetryflow",
      phase: "Running",
      nodeName: "ip-10-0-1-21.ec2.internal",
      hostIP: "10.0.1.21",
      containers: [
        {
          name: "telemetryflow-api",
          image: "telemetryflow/api:1.5.0",
          state: "running",
          ready: true,
          restartCount: 0,
          resources: {
            requests: { cpu: "500m", memory: "512Mi" },
            limits: { cpu: "1000m", memory: "1Gi" },
          },
          ports: [{ containerPort: 8080, protocol: "TCP" }],
          startedAt: startTime,
          volumeMounts: [],
        },
      ],
      labels: {
        app: "telemetryflow-api",
        "app.kubernetes.io/name": "telemetryflow-api",
        "pod-template-hash": "7d9f5c4b8",
      },
      ownerReferences: [
        { kind: "ReplicaSet", name: "telemetryflow-api-7d9f5c4b8" },
      ],
    }),
    basePod({
      name: "telemetryflow-collector-6c8b7a5d-j4k2n",
      namespace: "telemetryflow",
      phase: "Running",
      restartCount: 1,
      containers: [
        {
          name: "telemetryflow-collector",
          image: "telemetryflow/collector:1.5.0",
          state: "running",
          ready: true,
          restartCount: 1,
          resources: {
            requests: { cpu: "500m", memory: "512Mi" },
            limits: { cpu: "1000m", memory: "1Gi" },
          },
          ports: [
            { containerPort: 4317, protocol: "TCP" },
            { containerPort: 4318, protocol: "TCP" },
          ],
          startedAt: startTime,
          volumeMounts: [],
        },
      ],
      labels: {
        app: "telemetryflow-collector",
        "app.kubernetes.io/name": "telemetryflow-collector",
        "pod-template-hash": "6c8b7a5d",
      },
      ownerReferences: [
        { kind: "ReplicaSet", name: "telemetryflow-collector-6c8b7a5d" },
      ],
    }),
    basePod({
      name: "prometheus-server-0",
      namespace: "monitoring",
      phase: "Running",
      containers: [
        {
          name: "prometheus",
          image: "prom/prometheus:v2.48.0",
          state: "running",
          ready: true,
          restartCount: 0,
          resources: {
            requests: { cpu: "500m", memory: "512Mi" },
            limits: { cpu: "1000m", memory: "2Gi" },
          },
          ports: [{ containerPort: 9090, protocol: "TCP" }],
          startedAt: startTime,
          volumeMounts: [],
        },
      ],
      labels: { app: "prometheus", "app.kubernetes.io/name": "prometheus" },
      ownerReferences: [{ kind: "StatefulSet", name: "prometheus-server" }],
    }),
    basePod({
      name: "grafana-5c8b9d7f-h2k4m",
      namespace: "monitoring",
      phase: "Running",
      containers: [
        {
          name: "grafana",
          image: "grafana/grafana:10.2.3",
          state: "running",
          ready: true,
          restartCount: 0,
          resources: {
            requests: { cpu: "250m", memory: "256Mi" },
            limits: { cpu: "500m", memory: "512Mi" },
          },
          ports: [{ containerPort: 3000, protocol: "TCP" }],
          startedAt: startTime,
          volumeMounts: [],
        },
      ],
      labels: {
        app: "grafana",
        "app.kubernetes.io/name": "grafana",
        "pod-template-hash": "5c8b9d7f",
      },
      ownerReferences: [{ kind: "ReplicaSet", name: "grafana-5c8b9d7f" }],
    }),
    basePod({
      name: "telemetryflow-worker-pending-abc123",
      namespace: "telemetryflow",
      phase: "Pending",
      nodeName: "",
      hostIP: "",
      containers: [
        {
          name: "telemetryflow-worker",
          image: "telemetryflow/worker:1.5.0",
          state: "waiting",
          ready: false,
          restartCount: 0,
          resources: {
            requests: { cpu: "500m", memory: "512Mi" },
            limits: { cpu: "1000m", memory: "1Gi" },
          },
          ports: [{ containerPort: 8080, protocol: "TCP" }],
          volumeMounts: [],
        },
      ],
      labels: {
        app: "telemetryflow-worker",
        "app.kubernetes.io/name": "telemetryflow-worker",
      },
      ownerReferences: [
        { kind: "ReplicaSet", name: "telemetryflow-worker-pending" },
      ],
      events: [
        {
          type: "Warning",
          reason: "FailedScheduling",
          message:
            "0/4 nodes are available: 1 node(s) had MemoryPressure, 3 Insufficient memory.",
          source: "default-scheduler",
          count: 15,
          firstSeen: now - 1800000,
          lastSeen: now - 60000,
        },
      ],
    }),
  ];
}

function generateSeedPodConditions(
  isRunning: boolean,
  startTime: number,
): K8sPodCondition[] {
  const status = isRunning ? "True" : "False";
  return [
    { type: "Ready", status, lastTransitionTime: startTime },
    { type: "ContainersReady", status, lastTransitionTime: startTime },
    {
      type: "PodReadyToStartContainers",
      status: "True",
      lastTransitionTime: startTime,
    },
    { type: "Initialized", status: "True", lastTransitionTime: startTime },
    {
      type: "PodScheduled",
      status: isRunning ? "True" : "False",
      lastTransitionTime: startTime,
      ...(!isRunning
        ? {
            reason: "Unschedulable",
            message: "pod has unbound immediate PersistentVolumeClaims",
          }
        : {}),
    },
  ];
}

/**
 * Generate seed deployments for cluster-prod-us-east-1 matching backend seeds.
 */
function generateSeedDeploymentsForProdUsEast1(): K8sDeployment[] {
  const now = Date.now();
  const createdAt = now - 30 * 86400000;
  const updatedAt = now - 2 * 86400000;

  return [
    {
      name: "telemetryflow-api",
      namespace: "telemetryflow",
      replicas: { desired: 3, ready: 3, available: 3, updated: 3 },
      strategy: { type: "RollingUpdate", maxSurge: "1", maxUnavailable: "0" },
      labels: {
        app: "telemetryflow-api",
        "app.kubernetes.io/name": "telemetryflow-api",
        "app.kubernetes.io/version": "1.5.0",
      },
      annotations: { "deployment.kubernetes.io/revision": "5" },
      conditions: [
        {
          type: "Available",
          status: "True",
          reason: "MinimumReplicasAvailable",
          message: "Deployment has minimum availability.",
        },
        {
          type: "Progressing",
          status: "True",
          reason: "NewReplicaSetAvailable",
          message:
            'ReplicaSet "telemetryflow-api-7d9f5c4b8" has successfully progressed.',
        },
      ],
      createdAt,
      updatedAt,
    },
    {
      name: "telemetryflow-collector",
      namespace: "telemetryflow",
      replicas: { desired: 2, ready: 2, available: 2, updated: 2 },
      strategy: { type: "RollingUpdate", maxSurge: "1", maxUnavailable: "1" },
      labels: {
        app: "telemetryflow-collector",
        "app.kubernetes.io/name": "telemetryflow-collector",
        "app.kubernetes.io/version": "1.5.0",
      },
      annotations: { "deployment.kubernetes.io/revision": "3" },
      conditions: [
        {
          type: "Available",
          status: "True",
          reason: "MinimumReplicasAvailable",
          message: "Deployment has minimum availability.",
        },
        {
          type: "Progressing",
          status: "True",
          reason: "NewReplicaSetAvailable",
          message:
            'ReplicaSet "telemetryflow-collector-6c8b7a5d" has successfully progressed.',
        },
      ],
      createdAt,
      updatedAt,
    },
    {
      name: "grafana",
      namespace: "monitoring",
      replicas: { desired: 1, ready: 1, available: 1, updated: 1 },
      strategy: { type: "Recreate" },
      labels: {
        app: "grafana",
        "app.kubernetes.io/name": "grafana",
        "app.kubernetes.io/version": "10.2.3",
      },
      annotations: { "deployment.kubernetes.io/revision": "2" },
      conditions: [
        {
          type: "Available",
          status: "True",
          reason: "MinimumReplicasAvailable",
          message: "Deployment has minimum availability.",
        },
        {
          type: "Progressing",
          status: "True",
          reason: "NewReplicaSetAvailable",
          message: 'ReplicaSet "grafana-5c8b9d7f" has successfully progressed.',
        },
      ],
      createdAt,
      updatedAt,
    },
    {
      name: "ingress-nginx-controller",
      namespace: "ingress-nginx",
      replicas: { desired: 2, ready: 2, available: 2, updated: 2 },
      strategy: { type: "RollingUpdate", maxSurge: "1", maxUnavailable: "1" },
      labels: {
        app: "ingress-nginx",
        "app.kubernetes.io/name": "ingress-nginx-controller",
        "app.kubernetes.io/version": "v1.9.5",
      },
      annotations: { "deployment.kubernetes.io/revision": "4" },
      conditions: [
        {
          type: "Available",
          status: "True",
          reason: "MinimumReplicasAvailable",
          message: "Deployment has minimum availability.",
        },
        {
          type: "Progressing",
          status: "True",
          reason: "NewReplicaSetAvailable",
          message:
            'ReplicaSet "ingress-nginx-controller" has successfully progressed.',
        },
      ],
      createdAt,
      updatedAt,
    },
  ];
}

// Set of seed cluster IDs for quick lookup
const SEED_CLUSTER_IDS = new Set([
  "cluster-prod-us-east-1",
  "cluster-prod-eu-west-1",
  "cluster-staging-us-east-1",
  "cluster-dev-local",
]);

/**
 * Generate a Kubernetes node for a specific cluster
 */
export function generateNode(
  nodeConfig: K8sNodeConfig,
  cluster: K8sClusterConfig,
): K8sNode {
  const cpuUsed = randomBetween(2, nodeConfig.cpu - 1);
  const memoryUsed = randomBetween(
    Math.min(4, nodeConfig.memory - 2),
    nodeConfig.memory - 2,
  );
  const podsRunning = Math.floor(
    randomBetween(10, Math.min(35, nodeConfig.cpu * 4)),
  );

  // Disk capacity based on instance type (larger instances have more storage)
  const diskCapacity =
    nodeConfig.cpu >= 16 ? 500 : nodeConfig.cpu >= 8 ? 200 : 100;
  const diskUsed = randomBetween(diskCapacity * 0.2, diskCapacity * 0.7);

  // Degraded clusters have more issues
  const isDegraded = cluster.status === "degraded";
  const readyChance = isDegraded ? 0.85 : 0.98;

  return {
    name: nodeConfig.name,
    status: Math.random() > 1 - readyChance ? "Ready" : "NotReady",
    roles: ["worker"],
    instanceType: nodeConfig.instanceType,
    kubeletVersion: `v${cluster.version}`,
    containerRuntime: "containerd://1.7.11",
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
      "kubernetes.io/arch": "amd64",
      "kubernetes.io/os": "linux",
      "node.kubernetes.io/instance-type": nodeConfig.instanceType,
      "topology.kubernetes.io/region": cluster.region,
      "topology.kubernetes.io/zone": nodeConfig.zone,
      "telemetryflow.id/cluster": cluster.id,
      "telemetryflow.id/environment": cluster.environment,
    },
    annotations: {
      "node.alpha.kubernetes.io/ttl": "0",
    },
    createdAt: Date.now() - Math.floor(randomBetween(7, 90)) * 86400000,
    internalIP:
      nodeConfig.name.match(/ip-(\d+-\d+-\d+-\d+)/)?.[1]?.replace(/-/g, ".") ||
      generatePrivateIP(),
    events: generateNodeEvents(nodeConfig.name, isDegraded),
  };
}

/**
 * Generate node events
 */
function generateNodeEvents(
  nodeName: string,
  isDegraded: boolean,
): K8sNodeEvent[] {
  const now = Date.now();
  const events: K8sNodeEvent[] = [
    {
      type: "Normal",
      reason: "Starting",
      message: "Starting kubelet",
      source: "kubelet",
      count: 1,
      firstSeen: now - 604800000, // 7 days ago
      lastSeen: now - 604800000,
    },
    {
      type: "Normal",
      reason: "NodeReady",
      message: `Node ${nodeName} status is now: NodeReady`,
      source: "kubelet",
      count: 1,
      firstSeen: now - 604700000,
      lastSeen: now - 604700000,
    },
    {
      type: "Normal",
      reason: "RegisteredNode",
      message: `Node ${nodeName} event: Registered Node ${nodeName} in Controller`,
      source: "node-controller",
      count: 1,
      firstSeen: now - 604600000,
      lastSeen: now - 604600000,
    },
  ];

  // Add warning events for degraded nodes
  if (isDegraded && Math.random() > 0.5) {
    events.push({
      type: "Warning",
      reason: "EvictionThresholdMet",
      message: "Attempting to reclaim memory",
      source: "kubelet",
      count: Math.floor(randomBetween(1, 5)),
      firstSeen: now - 3600000,
      lastSeen: now - 1800000,
    });
  }

  // Add recent heartbeat
  events.push({
    type: "Normal",
    reason: "NodeAllocatableEnforced",
    message: "Updated Node Allocatable limit across pods",
    source: "kubelet",
    count: Math.floor(randomBetween(100, 500)),
    firstSeen: now - 604800000,
    lastSeen: now - 60000,
  });

  return events;
}

/**
 * Generate all nodes for a specific cluster
 * @param clusterId - Optional cluster ID. If not provided, uses default cluster.
 * For seed cluster 'cluster-prod-us-east-1', returns exact backend seed node data.
 */
export function generateNodes(clusterId?: string): K8sNode[] {
  // Return exact seed data for prod-us-east-1
  if (clusterId === "cluster-prod-us-east-1") {
    return generateSeedNodesForProdUsEast1();
  }

  const cluster = clusterId ? getClusterById(clusterId) : K8S_CLUSTER;
  if (!cluster) return [];

  const nodes = clusterId ? getNodesByCluster(clusterId) : K8S_NODES;
  return nodes.map((nodeConfig) => generateNode(nodeConfig, cluster));
}

/**
 * Generate nodes for all clusters in a region
 */
export function generateNodesByRegion(
  regionId: K8sRegionId,
): Record<string, K8sNode[]> {
  const clusters = K8S_CLUSTERS[regionId] || [];
  const result: Record<string, K8sNode[]> = {};

  for (const cluster of clusters) {
    result[cluster.id] = generateNodes(cluster.id);
  }

  return result;
}

/**
 * Generate nodes for all clusters
 */
export function generateAllNodes(): Record<string, K8sNode[]> {
  const result: Record<string, K8sNode[]> = {};

  for (const cluster of K8S_ALL_CLUSTERS) {
    result[cluster.id] = generateNodes(cluster.id);
  }

  return result;
}

/**
 * Generate a pod for a service in a specific cluster
 * Note: This function is kept for backwards compatibility but correlatedPodToK8sPod is preferred
 */
export function generatePod(
  service: string,
  _index: number,
  clusterId?: string,
  namespace?: string,
): K8sPod {
  const cluster = clusterId ? getClusterById(clusterId) : K8S_CLUSTER;
  const nodes = clusterId ? getNodesByCluster(clusterId) : K8S_NODES;

  if (!cluster || nodes.length === 0) {
    throw new Error(`Invalid cluster: ${clusterId}`);
  }

  const metadata = getServiceMetadata(service);
  const nodeIdx = Math.floor(Math.random() * nodes.length);
  const node = nodes[nodeIdx];
  const replicaSetId = randomId(10);
  const podId = randomId(5);

  // Degraded clusters have more pod issues
  const isDegraded = cluster.status === "degraded";
  const runningChance = isDegraded ? 0.9 : 0.98;

  const isRunning = Math.random() < runningChance;
  const phase: PodPhase = isRunning
    ? "Running"
    : Math.random() > 0.5
      ? "Pending"
      : "Failed";

  // Resource allocation based on service type (scaled for environment)
  const envMultiplier =
    cluster.environment === "production"
      ? 1
      : cluster.environment === "staging"
        ? 0.5
        : 0.25;

  const resourceProfiles: Record<string, { cpu: string; memory: string }> = {
    frontend: { cpu: "500m", memory: "512Mi" },
    "api-gateway": { cpu: "1000m", memory: "1Gi" },
    "user-service": { cpu: "500m", memory: "1Gi" },
    "product-catalog": { cpu: "500m", memory: "1Gi" },
    "cart-service": { cpu: "250m", memory: "256Mi" },
    "order-service": { cpu: "1000m", memory: "2Gi" },
    "payment-service": { cpu: "500m", memory: "1Gi" },
    "inventory-service": { cpu: "250m", memory: "512Mi" },
    "notification-service": { cpu: "250m", memory: "256Mi" },
    "recommendation-engine": { cpu: "2000m", memory: "4Gi" },
    "search-service": { cpu: "1000m", memory: "2Gi" },
    "shipping-service": { cpu: "250m", memory: "256Mi" },
  };

  const baseResources = resourceProfiles[service] || {
    cpu: "500m",
    memory: "512Mi",
  };
  const resources = {
    cpu: `${Math.round(parseInt(baseResources.cpu) * envMultiplier)}m`,
    memory: baseResources.memory,
  };

  // Determine namespace based on cluster environment
  const podNamespace =
    namespace ||
    (cluster.environment === "production"
      ? "ecommerce"
      : cluster.environment === "staging"
        ? "ecommerce-staging"
        : "ecommerce-dev");

  const podName = `${service}-${replicaSetId}-${podId}`;
  const hostIP =
    node.name.match(/ip-(\d+-\d+-\d+-\d+)/)?.[1]?.replace(/-/g, ".") ||
    generatePrivateIP();
  const startTime = Date.now() - Math.floor(randomBetween(1, 72)) * 3600000;
  const restartCount = Math.floor(randomBetween(0, isDegraded ? 10 : 5));
  const saToken = `${service}-token-${randomId(5)}`;

  return {
    name: podName,
    namespace: podNamespace,
    phase,
    nodeName: node.name,
    hostIP,
    podIP: generatePrivateIP(),
    startTime,
    containers: [
      {
        name: service,
        image: SERVICE_IMAGES[service] || `telemetryflow/${service}:latest`,
        state: isRunning ? "running" : "waiting",
        ready: isRunning,
        restartCount,
        resources: {
          requests: { ...resources, ephemeralStorage: "2Gi" },
          limits: {
            cpu: `${parseInt(resources.cpu) * 2}m`,
            memory: resources.memory.replace(/(\d+)/, (m) =>
              String(parseInt(m) * 2),
            ),
            ephemeralStorage: "10Gi",
          },
        },
        ports: [{ containerPort: 8080, protocol: "TCP" }],
        startedAt: isRunning ? startTime : undefined,
        args: ["--port=8080", "--metrics-port=9090"],
        env: [
          { name: "POD_NAME", valueFrom: "fieldRef: metadata.name" },
          { name: "POD_NAMESPACE", valueFrom: "fieldRef: metadata.namespace" },
          { name: "SERVICE_PORT", value: "8080" },
        ],
        volumeMounts: [
          { name: "host-time", mountPath: "/etc/localtime", readOnly: true },
          {
            name: saToken,
            mountPath: "/var/run/secrets/kubernetes.io/serviceaccount",
            readOnly: true,
          },
          { name: "config", mountPath: "/etc/config", readOnly: true },
        ],
        livenessProbe: {
          httpGet: { path: "/healthz", port: 8080 },
          periodSeconds: 10,
        },
        readinessProbe: {
          httpGet: { path: "/ready", port: 8080 },
          periodSeconds: 5,
        },
      },
      {
        name: "telemetryflow-agent",
        image: "telemetryflow/telemetryflow-agent:1.2.0",
        state: isRunning ? "running" : "waiting",
        ready: isRunning,
        restartCount: 0,
        resources: {
          requests: { cpu: "50m", memory: "64Mi", ephemeralStorage: "100Mi" },
          limits: { cpu: "100m", memory: "128Mi", ephemeralStorage: "500Mi" },
        },
        ports: [],
        startedAt: isRunning ? startTime : undefined,
        command: ["/bin/sh", "-c"],
        args: ["agent", "--config=/etc/telemetryflow/config.yaml"],
        env: [
          {
            name: "OTEL_ENDPOINT",
            value: "http://telemetryflow-collector:4317",
          },
        ],
        volumeMounts: [
          { name: "host-time", mountPath: "/etc/localtime", readOnly: true },
          {
            name: saToken,
            mountPath: "/var/run/secrets/kubernetes.io/serviceaccount",
            readOnly: true,
          },
        ],
      },
    ],
    restartCount,
    labels: {
      app: service,
      "app.kubernetes.io/name": service,
      "app.kubernetes.io/version": metadata.version,
      "app.kubernetes.io/component": "backend",
      "app.kubernetes.io/part-of": "ecommerce",
      "pod-template-hash": replicaSetId,
      "telemetryflow.id/cluster": cluster.id,
      "telemetryflow.id/region": cluster.region,
      "telemetryflow.id/environment": cluster.environment,
    },
    annotations: {
      "prometheus.io/scrape": "true",
      "prometheus.io/port": "8080",
      "prometheus.io/path": "/metrics",
      "sidecar.istio.io/inject": "true",
    },
    ownerReferences: [
      { kind: "ReplicaSet", name: `${service}-${replicaSetId}` },
    ],
    qosClass: "Burstable",
    serviceAccount: `${service}-sa`,
    conditions: [
      {
        type: "Ready",
        status: isRunning ? "True" : "False",
        lastTransitionTime: startTime,
      },
      {
        type: "ContainersReady",
        status: isRunning ? "True" : "False",
        lastTransitionTime: startTime,
      },
      {
        type: "PodReadyToStartContainers",
        status: "True",
        lastTransitionTime: startTime,
      },
      { type: "Initialized", status: "True", lastTransitionTime: startTime },
      { type: "PodScheduled", status: "True", lastTransitionTime: startTime },
    ],
    tolerations: [
      {
        key: "node.kubernetes.io/not-ready",
        operator: "Exists",
        effect: "NoExecute",
        tolerationSeconds: 300,
      },
      {
        key: "node.kubernetes.io/unreachable",
        operator: "Exists",
        effect: "NoExecute",
        tolerationSeconds: 300,
      },
    ],
    terminationGracePeriodSeconds: 30,
    volumes: [
      { name: "host-time", kind: "hostPath", hostPath: "/etc/localtime" },
      {
        name: saToken,
        kind: "projected",
        defaultMode: "0o644",
        sources: [
          { type: "Service Account Token", expiration: "3607s", path: "token" },
          { type: "Config Map", name: "kube-root-ca.crt", path: "ca.crt" },
          { type: "Downward API", path: "namespace" },
        ],
      },
      {
        name: "config",
        kind: "configMap",
        configMapName: `${service}-config`,
        defaultMode: "0o644",
      },
    ],
    events: [
      {
        type: "Normal",
        reason: "Scheduled",
        message: `Successfully assigned ${podNamespace}/${podName} to ${node.name}`,
        source: "default-scheduler",
        count: 1,
        firstSeen: startTime,
        lastSeen: startTime,
      },
      {
        type: "Normal",
        reason: "Pulled",
        message: "Container image already present on machine",
        source: "kubelet",
        count: 1,
        firstSeen: startTime + 10000,
        lastSeen: startTime + 10000,
      },
      {
        type: "Normal",
        reason: "Created",
        message: "Created container main",
        source: "kubelet",
        count: 1,
        firstSeen: startTime + 15000,
        lastSeen: startTime + 15000,
      },
      {
        type: "Normal",
        reason: "Started",
        message: "Started container main",
        source: "kubelet",
        count: 1,
        firstSeen: startTime + 20000,
        lastSeen: startTime + 20000,
      },
    ],
  };
}

/**
 * Generate pod conditions based on running state
 */
function generatePodConditions(
  isRunning: boolean,
  startTime: number,
): K8sPodCondition[] {
  const status = isRunning ? "True" : "False";
  return [
    { type: "Ready", status, lastTransitionTime: startTime },
    { type: "ContainersReady", status, lastTransitionTime: startTime },
    {
      type: "PodReadyToStartContainers",
      status: "True",
      lastTransitionTime: startTime,
    },
    { type: "Initialized", status: "True", lastTransitionTime: startTime },
    { type: "PodScheduled", status: "True", lastTransitionTime: startTime },
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
  restartCount: number,
): K8sPodEvent[] {
  const now = Date.now();
  const events: K8sPodEvent[] = [
    {
      type: "Normal",
      reason: "Scheduled",
      message: `Successfully assigned ${namespace}/${podName} to ${nodeName}`,
      source: "default-scheduler",
      count: 1,
      firstSeen: now - 300000,
      lastSeen: now - 300000,
    },
    {
      type: "Normal",
      reason: "Pulled",
      message: "Container image already present on machine",
      source: "kubelet",
      count: 1,
      firstSeen: now - 290000,
      lastSeen: now - 290000,
    },
    {
      type: "Normal",
      reason: "Created",
      message: "Created container main",
      source: "kubelet",
      count: 1,
      firstSeen: now - 285000,
      lastSeen: now - 285000,
    },
    {
      type: "Normal",
      reason: "Started",
      message: "Started container main",
      source: "kubelet",
      count: 1,
      firstSeen: now - 280000,
      lastSeen: now - 280000,
    },
  ];

  // Add warning events for pods with restarts
  if (restartCount > 0) {
    events.push({
      type: "Warning",
      reason: "BackOff",
      message: `Back-off restarting failed container`,
      source: "kubelet",
      count: restartCount,
      firstSeen: now - 600000,
      lastSeen: now - 60000,
    });
  }

  // Add scheduling warning for non-running pods
  if (!isRunning) {
    events.push({
      type: "Warning",
      reason: "FailedScheduling",
      message:
        "0/8 nodes are available: 3 node(s) had untolerated taint(s), 5 node(s) didn't match Pod's node affinity/selector.",
      source: "default-scheduler",
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
      name: "host-time",
      kind: "hostPath",
      hostPath: "/etc/localtime",
    },
    {
      name: saToken,
      kind: "projected",
      defaultMode: "0o644",
      sources: [
        { type: "Service Account Token", expiration: "3607s", path: "token" },
        { type: "Config Map", name: "kube-root-ca.crt", path: "ca.crt" },
        { type: "Downward API", path: "namespace" },
      ],
    },
    {
      name: "config",
      kind: "configMap",
      configMapName: `${serviceName}-config`,
      defaultMode: "0o644",
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
  serviceName: string,
): K8sContainer {
  const saToken = `${serviceName}-token-${randomId(5)}`;
  return {
    name,
    image,
    state: isRunning ? "running" : "waiting",
    ready: isRunning,
    restartCount,
    resources: {
      requests: { ...resources, ephemeralStorage: isMain ? "2Gi" : "100Mi" },
      limits: {
        cpu: `${parseInt(resources.cpu) * 2}m`,
        memory: resources.memory.replace(/(\d+)/, (m) =>
          String(parseInt(m) * 2),
        ),
        ephemeralStorage: isMain ? "10Gi" : "500Mi",
      },
    },
    ports: isMain ? [{ containerPort: 8080, protocol: "TCP" }] : [],
    startedAt: isRunning
      ? Date.now() - Math.floor(randomBetween(1, 72)) * 3600000
      : undefined,
    command: isMain ? undefined : ["/bin/sh", "-c"],
    args: isMain
      ? [`--port=8080`, `--metrics-port=9090`]
      : ["agent", "--config=/etc/telemetryflow/config.yaml"],
    env: [
      { name: "POD_NAME", valueFrom: "fieldRef: metadata.name" },
      { name: "POD_NAMESPACE", valueFrom: "fieldRef: metadata.namespace" },
      { name: "NODE_NAME", valueFrom: "fieldRef: spec.nodeName" },
      ...(isMain
        ? [
            { name: "SERVICE_PORT", value: "8080" },
            { name: "LOG_LEVEL", value: "info" },
          ]
        : [
            {
              name: "OTEL_ENDPOINT",
              value: "http://telemetryflow-collector:4317",
            },
          ]),
    ],
    volumeMounts: [
      { name: "host-time", mountPath: "/etc/localtime", readOnly: true },
      {
        name: saToken,
        mountPath: "/var/run/secrets/kubernetes.io/serviceaccount",
        readOnly: true,
      },
      ...(isMain
        ? [{ name: "config", mountPath: "/etc/config", readOnly: true }]
        : []),
    ],
    livenessProbe: isMain
      ? { httpGet: { path: "/healthz", port: 8080 }, periodSeconds: 10 }
      : undefined,
    readinessProbe: isMain
      ? { httpGet: { path: "/ready", port: 8080 }, periodSeconds: 5 }
      : undefined,
  };
}

/**
 * Convert a correlated pod to a K8sPod object
 */
function correlatedPodToK8sPod(
  correlatedPod: CorrelatedPod,
  cluster: K8sClusterConfig,
): K8sPod {
  const metadata = getServiceMetadata(correlatedPod.service);
  const isDegraded = cluster.status === "degraded";
  const runningChance = isDegraded ? 0.9 : 0.98;
  const isRunning = Math.random() < runningChance;
  const phase: PodPhase = isRunning
    ? "Running"
    : Math.random() > 0.5
      ? "Pending"
      : "Failed";

  const envMultiplier =
    cluster.environment === "production"
      ? 1
      : cluster.environment === "staging"
        ? 0.5
        : 0.25;

  const resourceProfiles: Record<string, { cpu: string; memory: string }> = {
    frontend: { cpu: "500m", memory: "512Mi" },
    "api-gateway": { cpu: "1000m", memory: "1Gi" },
    "user-service": { cpu: "500m", memory: "1Gi" },
    "product-catalog": { cpu: "500m", memory: "1Gi" },
    "cart-service": { cpu: "250m", memory: "256Mi" },
    "order-service": { cpu: "1000m", memory: "2Gi" },
    "payment-service": { cpu: "500m", memory: "1Gi" },
    "inventory-service": { cpu: "250m", memory: "512Mi" },
    "notification-service": { cpu: "250m", memory: "256Mi" },
    "recommendation-engine": { cpu: "2000m", memory: "4Gi" },
    "search-service": { cpu: "1000m", memory: "2Gi" },
    "shipping-service": { cpu: "250m", memory: "256Mi" },
    "telemetryflow-collector": { cpu: "500m", memory: "512Mi" },
    prometheus: { cpu: "500m", memory: "512Mi" },
    grafana: { cpu: "250m", memory: "256Mi" },
    "jaeger-query": { cpu: "250m", memory: "256Mi" },
    loki: { cpu: "500m", memory: "512Mi" },
  };

  const baseResources = resourceProfiles[correlatedPod.service] || {
    cpu: "500m",
    memory: "512Mi",
  };
  const resources = {
    cpu: `${Math.round(parseInt(baseResources.cpu) * envMultiplier)}m`,
    memory: baseResources.memory,
  };

  const isInfra = [
    "telemetryflow-collector",
    "prometheus",
    "grafana",
    "jaeger-query",
    "loki",
  ].includes(correlatedPod.service);
  const image = isInfra
    ? `${correlatedPod.service.includes("telemetryflow") ? "telemetryflow" : correlatedPod.service}/${correlatedPod.service}:latest`
    : SERVICE_IMAGES[correlatedPod.service] ||
      `telemetryflow/${correlatedPod.service}:latest`;

  const restartCount = Math.floor(randomBetween(0, isDegraded ? 10 : 5));
  const containers: K8sContainer[] = isInfra
    ? [
        generateContainer(
          correlatedPod.service,
          image,
          isRunning,
          0,
          resources,
          true,
          correlatedPod.service,
        ),
      ]
    : [
        generateContainer(
          correlatedPod.service,
          image,
          isRunning,
          restartCount,
          resources,
          true,
          correlatedPod.service,
        ),
        generateContainer(
          "telemetryflow-agent",
          "telemetryflow/telemetryflow-agent:1.2.0",
          isRunning,
          0,
          { cpu: "50m", memory: "64Mi" },
          false,
          correlatedPod.service,
        ),
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
      "app.kubernetes.io/name": correlatedPod.service,
      "app.kubernetes.io/version": metadata.version,
      "app.kubernetes.io/component": isInfra ? "infrastructure" : "backend",
      "app.kubernetes.io/part-of": isInfra ? "monitoring" : "ecommerce",
      "pod-template-hash": correlatedPod.replicaSetId,
      "telemetryflow.id/cluster": cluster.id,
      "telemetryflow.id/region": cluster.region,
      "telemetryflow.id/environment": cluster.environment,
    },
    annotations: isInfra
      ? {}
      : {
          "prometheus.io/scrape": "true",
          "prometheus.io/port": "8080",
          "prometheus.io/path": "/metrics",
          "sidecar.istio.io/inject": "true",
        },
    ownerReferences: [
      {
        kind: isInfra ? "Deployment" : "ReplicaSet",
        name: isInfra
          ? correlatedPod.service
          : `${correlatedPod.service}-${correlatedPod.replicaSetId}`,
      },
    ],
    qosClass: "Burstable",
    serviceAccount: isInfra ? "default" : `${correlatedPod.service}-sa`,
    // Enhanced fields
    conditions: generatePodConditions(isRunning, correlatedPod.createdAt),
    tolerations: [
      {
        key: "node.kubernetes.io/not-ready",
        operator: "Exists",
        effect: "NoExecute",
        tolerationSeconds: 300,
      },
      {
        key: "node.kubernetes.io/unreachable",
        operator: "Exists",
        effect: "NoExecute",
        tolerationSeconds: 300,
      },
    ],
    terminationGracePeriodSeconds: 30,
    volumes: generatePodVolumes(correlatedPod.service),
    events: generatePodEvents(
      correlatedPod.name,
      correlatedPod.namespace,
      correlatedPod.nodeName,
      isRunning,
      restartCount,
    ),
  };
}

/**
 * Generate all pods for a specific cluster
 * Uses the correlated registry to ensure pod names are consistent with logs/traces
 * @param clusterId - Optional cluster ID. If not provided, uses default cluster.
 * For seed cluster 'cluster-prod-us-east-1', returns exact backend seed pod data.
 */
export function generatePods(clusterId?: string): K8sPod[] {
  // Return exact seed data for prod-us-east-1
  if (clusterId === "cluster-prod-us-east-1") {
    return generateSeedPodsForProdUsEast1();
  }

  const cluster = clusterId ? getClusterById(clusterId) : K8S_CLUSTER;
  if (!cluster) return [];

  // Get pods from the correlated registry
  const correlatedPods = getPodsByCluster(clusterId);

  // Convert to K8sPod objects
  return correlatedPods.map((cp) => correlatedPodToK8sPod(cp, cluster));
}

/**
 * Generate a deployment for a service in a specific cluster
 */
export function generateDeployment(
  service: string,
  clusterId?: string,
): K8sDeployment {
  const cluster = clusterId ? getClusterById(clusterId) : K8S_CLUSTER;
  if (!cluster) throw new Error(`Invalid cluster: ${clusterId}`);

  const metadata = getServiceMetadata(service);

  // Scale replicas based on environment
  const replicaMultiplier =
    cluster.environment === "production"
      ? 1
      : cluster.environment === "staging"
        ? 0.5
        : 0.3;
  const replicas = Math.max(
    1,
    Math.round((metadata.replicas || 2) * replicaMultiplier),
  );

  // Degraded clusters have more issues
  const isDegraded = cluster.status === "degraded";
  const ready = isDegraded
    ? Math.max(0, replicas - Math.floor(Math.random() * 2))
    : Math.random() > 0.05
      ? replicas
      : replicas - 1;

  // Determine namespace based on environment
  const namespace =
    cluster.environment === "production"
      ? "ecommerce"
      : cluster.environment === "staging"
        ? "ecommerce-staging"
        : "ecommerce-dev";

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
      type: "RollingUpdate",
      maxUnavailable: "25%",
      maxSurge: "25%",
    },
    labels: {
      app: service,
      "app.kubernetes.io/name": service,
      "app.kubernetes.io/version": metadata.version,
      "telemetryflow.id/cluster": cluster.id,
      "telemetryflow.id/region": cluster.region,
      "telemetryflow.id/environment": cluster.environment,
    },
    annotations: {
      "deployment.kubernetes.io/revision": String(
        Math.floor(randomBetween(1, 20)),
      ),
      "kubectl.kubernetes.io/last-applied-configuration": "{}",
    },
    conditions: [
      {
        type: "Available",
        status: ready === replicas ? "True" : "False",
        reason: "MinimumReplicasAvailable",
        message: "Deployment has minimum availability.",
      },
      {
        type: "Progressing",
        status: "True",
        reason: "NewReplicaSetAvailable",
        message: `ReplicaSet "${service}-${randomId(10)}" has successfully progressed.`,
      },
    ],
    createdAt: Date.now() - Math.floor(randomBetween(30, 180)) * 86400000,
    updatedAt: Date.now() - Math.floor(randomBetween(1, 7)) * 86400000,
  };
}

/**
 * Generate all deployments for a specific cluster
 * For seed cluster 'cluster-prod-us-east-1', returns exact backend seed deployment data.
 */
export function generateDeployments(clusterId?: string): K8sDeployment[] {
  // Return exact seed data for prod-us-east-1
  if (clusterId === "cluster-prod-us-east-1") {
    return generateSeedDeploymentsForProdUsEast1();
  }

  return SERVICES.map((service) => generateDeployment(service, clusterId));
}

/**
 * Generate namespaces for a specific cluster
 */
export function generateNamespaces(clusterId?: string): K8sNamespace[] {
  const cluster = clusterId ? getClusterById(clusterId) : K8S_CLUSTER;
  if (!cluster) return [];

  return cluster.namespaces.map((name) => ({
    name,
    status: "Active",
    labels: {
      "kubernetes.io/metadata.name": name,
      "telemetryflow.id/cluster": cluster.id,
      "telemetryflow.id/region": cluster.region,
      ...(name.includes("ecommerce") ? { "istio-injection": "enabled" } : {}),
    },
    annotations: {},
    resourceQuota:
      name === "ecommerce"
        ? {
            cpu: { used: "24", hard: "64" },
            memory: { used: "48Gi", hard: "128Gi" },
            pods: { used: 35, hard: 100 },
          }
        : undefined,
    createdAt: Date.now() - Math.floor(randomBetween(90, 365)) * 86400000,
  }));
}

/**
 * Generate persistent volumes
 */
export function generatePersistentVolumes(): K8sPersistentVolume[] {
  const volumeConfigs = [
    {
      name: "postgres-users-pv",
      capacity: "100Gi",
      storageClass: "gp3",
      claim: { name: "postgres-users-pvc", namespace: "ecommerce" },
    },
    {
      name: "postgres-orders-pv",
      capacity: "200Gi",
      storageClass: "gp3",
      claim: { name: "postgres-orders-pvc", namespace: "ecommerce" },
    },
    {
      name: "postgres-catalog-pv",
      capacity: "150Gi",
      storageClass: "gp3",
      claim: { name: "postgres-catalog-pvc", namespace: "ecommerce" },
    },
    {
      name: "elasticsearch-data-pv-0",
      capacity: "500Gi",
      storageClass: "gp3",
      claim: { name: "elasticsearch-data-pvc-0", namespace: "ecommerce" },
    },
    {
      name: "elasticsearch-data-pv-1",
      capacity: "500Gi",
      storageClass: "gp3",
      claim: { name: "elasticsearch-data-pvc-1", namespace: "ecommerce" },
    },
    {
      name: "prometheus-data-pv",
      capacity: "100Gi",
      storageClass: "gp3",
      claim: { name: "prometheus-data-pvc", namespace: "monitoring" },
    },
    {
      name: "loki-data-pv",
      capacity: "200Gi",
      storageClass: "gp3",
      claim: { name: "loki-data-pvc", namespace: "monitoring" },
    },
  ];

  return volumeConfigs.map((v) => ({
    name: v.name,
    capacity: v.capacity,
    accessModes: ["ReadWriteOnce"] as string[],
    reclaimPolicy: "Retain" as const,
    storageClass: v.storageClass,
    status: "Bound" as const,
    claim: v.claim,
    createdAt: Date.now() - Math.floor(randomBetween(30, 180)) * 86400000,
  }));
}

/**
 * Generate cluster overview for a specific cluster
 */
export function generateClusterOverview(
  clusterId?: string,
): K8sClusterOverview {
  const cluster = clusterId ? getClusterById(clusterId) : K8S_CLUSTER;
  if (!cluster) throw new Error(`Invalid cluster: ${clusterId}`);

  const nodes = generateNodes(clusterId);
  const pods = generatePods(clusterId);
  const deployments = generateDeployments(clusterId);

  const readyNodes = nodes.filter((n) => n.status === "Ready").length;
  const runningPods = pods.filter((p) => p.phase === "Running").length;
  const pendingPods = pods.filter((p) => p.phase === "Pending").length;
  const failedPods = pods.filter((p) => p.phase === "Failed").length;
  const availableDeployments = deployments.filter(
    (d) => d.replicas.ready === d.replicas.desired,
  ).length;

  const avgCpuUsage =
    nodes.length > 0
      ? nodes.reduce((acc, n) => acc + n.cpu.usagePercent, 0) / nodes.length
      : 0;
  const avgMemoryUsage =
    nodes.length > 0
      ? nodes.reduce((acc, n) => acc + n.memory.usagePercent, 0) / nodes.length
      : 0;

  const issues: string[] = [];
  if (readyNodes < nodes.length)
    issues.push(`${nodes.length - readyNodes} node(s) not ready`);
  if (pendingPods > 0) issues.push(`${pendingPods} pod(s) pending`);
  if (failedPods > 0) issues.push(`${failedPods} pod(s) failed`);
  if (avgCpuUsage > 80) issues.push("High CPU usage across cluster");
  if (avgMemoryUsage > 80) issues.push("High memory usage across cluster");

  const healthScore = Math.max(0, 100 - issues.length * 15);
  const healthStatus: "healthy" | "degraded" | "critical" =
    healthScore > 80 ? "healthy" : healthScore > 50 ? "degraded" : "critical";

  return {
    cluster: {
      name: cluster.name,
      version: cluster.version,
      provider: cluster.provider,
      region: cluster.region,
    },
    health: {
      status: healthStatus,
      score: healthScore,
      issues,
    },
    resources: {
      nodes: { total: nodes.length, ready: readyNodes },
      pods: {
        total: pods.length,
        running: runningPods,
        pending: pendingPods,
        failed: failedPods,
      },
      deployments: {
        total: deployments.length,
        available: availableDeployments,
      },
      services: {
        total:
          SERVICES.length + (cluster.namespaces.includes("monitoring") ? 5 : 0),
      },
      namespaces: { total: cluster.namespaces.length },
    },
    metrics: {
      cpuUsagePercent: Math.round(avgCpuUsage),
      memoryUsagePercent: Math.round(avgMemoryUsage),
      podDensity: nodes.length > 0 ? Math.round(pods.length / nodes.length) : 0,
    },
  };
}

/**
 * Generate overview for all clusters in a region
 */
export function generateClusterOverviewsByRegion(
  regionId: K8sRegionId,
): Record<string, K8sClusterOverview> {
  const clusters = K8S_CLUSTERS[regionId] || [];
  const result: Record<string, K8sClusterOverview> = {};

  for (const cluster of clusters) {
    result[cluster.id] = generateClusterOverview(cluster.id);
  }

  return result;
}

/**
 * Generate overview for all clusters
 */
export function generateAllClusterOverviews(): Record<
  string,
  K8sClusterOverview
> {
  const result: Record<string, K8sClusterOverview> = {};

  for (const cluster of K8S_ALL_CLUSTERS) {
    result[cluster.id] = generateClusterOverview(cluster.id);
  }

  return result;
}

// Re-export region and cluster configuration for use in UI
export {
  K8S_REGIONS,
  K8S_SEED_CLUSTERS,
  K8S_CLUSTERS,
  K8S_ALL_CLUSTERS,
  K8S_NODES_BY_CLUSTER,
  getClustersByRegion,
  getNamespacesByCluster,
} from "./shared";

export type { K8sRegionId, K8sClusterConfig, K8sNodeConfig } from "./shared";

// ── Services mock ─────────────────────────────────────────────────────────────

function generateServices(_clusterId?: string) {
  const ns = "telemetryflow";
  return [
    { name: "cache-redis", namespace: ns, type: "ClusterIP", clusterIP: "10.233.6.91", externalIP: "-", ports: "6379:redis/TCP", age: "61m", status: "Active" },
    { name: "clickhouse", namespace: ns, type: "ClusterIP", clusterIP: "10.233.25.193", externalIP: "-", ports: "8123:http/TCP, 9000:native/TCP", age: "61m", status: "Active" },
    { name: "clickhouse-exporter", namespace: ns, type: "ClusterIP", clusterIP: "10.233.39.21", externalIP: "-", ports: "9363/TCP", age: "61m", status: "Active" },
    { name: "clickhouse-headless", namespace: ns, type: "ClusterIP", clusterIP: "None", externalIP: "-", ports: "8123/TCP, 9000/TCP, 9009/TCP", age: "61m", status: "Active" },
    { name: "nats", namespace: ns, type: "ClusterIP", clusterIP: "10.233.55.151", externalIP: "-", ports: "4222:client/TCP, 6222:cluster/...", age: "61m", status: "Active" },
    { name: "nats-exporter", namespace: ns, type: "ClusterIP", clusterIP: "10.233.3.48", externalIP: "-", ports: "7777/TCP", age: "61m", status: "Active" },
    { name: "nats-headless", namespace: ns, type: "ClusterIP", clusterIP: "None", externalIP: "-", ports: "4222/TCP, 6222/TCP, 8222/TCP", age: "61m", status: "Active" },
    { name: "postgres-exporter", namespace: ns, type: "ClusterIP", clusterIP: "10.233.52.139", externalIP: "-", ports: "9187/TCP", age: "61m", status: "Active" },
    { name: "postgresql", namespace: ns, type: "ClusterIP", clusterIP: "10.233.5.242", externalIP: "-", ports: "5432:postgresql/TCP", age: "61m", status: "Active" },
    { name: "postgresql-headless", namespace: ns, type: "ClusterIP", clusterIP: "None", externalIP: "-", ports: "5432/TCP", age: "61m", status: "Active" },
    { name: "redis-exporter", namespace: ns, type: "ClusterIP", clusterIP: "10.233.37.170", externalIP: "-", ports: "9121/TCP", age: "61m", status: "Active" },
    { name: "redis-master", namespace: ns, type: "ClusterIP", clusterIP: "10.233.27.191", externalIP: "-", ports: "6379:redis/TCP", age: "61m", status: "Active" },
    { name: "tfo-backend", namespace: ns, type: "ClusterIP", clusterIP: "10.233.45.210", externalIP: "-", ports: "3100/TCP, 4317/TCP, 4318/TCP", age: "61m", status: "Active" },
    { name: "tfo-bullboard", namespace: ns, type: "ClusterIP", clusterIP: "10.233.31.21", externalIP: "-", ports: "3200:http/TCP", age: "61m", status: "Active" },
    { name: "tfo-collector", namespace: ns, type: "ClusterIP", clusterIP: "10.233.27.34", externalIP: "-", ports: "4317/TCP, 4318/TCP, 8888/TC...", age: "61m", status: "Active" },
    { name: "tfo-viz", namespace: ns, type: "ClusterIP", clusterIP: "10.233.30.138", externalIP: "-", ports: "80/TCP", age: "61m", status: "Active" },
  ];
}

// ── Endpoints mock ────────────────────────────────────────────────────────────

function generateEndpoints(_clusterId?: string) {
  const ns = "telemetryflow";
  return [
    { name: "cache-redis", namespace: ns, endpoints: "10.233.122.200:6379", age: "61m" },
    { name: "clickhouse", namespace: ns, endpoints: "10.233.85.238:8123, 10.233.85.238:9000", age: "61m" },
    { name: "clickhouse-exporter", namespace: ns, endpoints: "10.233.85.238:9363", age: "61m" },
    { name: "clickhouse-headless", namespace: ns, endpoints: "10.233.85.238:9009, 10.233.85.238:8123, 10.233.85.238:9000", age: "61m" },
    { name: "nats", namespace: ns, endpoints: "10.233.87.229:4222, 10.233.87.229:8222, 10.233.87.229:7422, 10.233.87.229:6222", age: "61m" },
    { name: "nats-exporter", namespace: ns, endpoints: "10.233.87.229:7777", age: "61m" },
    { name: "nats-headless", namespace: ns, endpoints: "10.233.87.229:4222, 10.233.87.229:8222, 10.233.87.229:6222", age: "61m" },
    { name: "postgres-exporter", namespace: ns, endpoints: "10.233.122.228:9187", age: "61m" },
    { name: "postgresql", namespace: ns, endpoints: "10.233.122.228:5432", age: "61m" },
    { name: "postgresql-headless", namespace: ns, endpoints: "10.233.122.228:5432", age: "61m" },
    { name: "postgresql-read", namespace: ns, endpoints: "<none>", age: "61m" },
    { name: "redis-exporter", namespace: ns, endpoints: "10.233.122.241:9121", age: "61m" },
    { name: "redis-headless", namespace: ns, endpoints: "10.233.122.241:6379", age: "61m" },
    { name: "redis-master", namespace: ns, endpoints: "10.233.122.241:6379", age: "61m" },
    { name: "tfo-backend", namespace: ns, endpoints: "10.233.122.219:3100, 10.233.122.219:4318, 10.233.122.219:4317", age: "61m" },
    { name: "tfo-bullboard", namespace: ns, endpoints: "10.233.122.255:3200", age: "61m" },
    { name: "tfo-collector", namespace: ns, endpoints: "10.233.122.215:8889, 10.233.122.215:13133, 10.233.122.215:8888, ...", age: "61m" },
    { name: "tfo-viz", namespace: ns, endpoints: "10.233.122.227:80", age: "61m" },
  ];
}

// ── Ingresses mock ────────────────────────────────────────────────────────────

function generateIngresses(_clusterId?: string) {
  const ns = "telemetryflow";
  return [
    { name: "tfo-backend", namespace: ns, loadBalancers: "157.20.255.42 +2", rules: "http://api.demo.telemetryflow.co.id/ \u2192 tfo-backend:3100", age: "61m" },
    { name: "tfo-bullboard", namespace: ns, loadBalancers: "157.20.255.42 +2", rules: "http://bullboard.demo.telemetryflow.co.id/ \u2192 tfo-bullboard:3200", age: "61m" },
    { name: "tfo-viz", namespace: ns, loadBalancers: "157.20.255.42 +2", rules: "http://demo.telemetryflow.co.id/ \u2192 tfo-viz:80", age: "61m" },
  ];
}

// Export kubernetes mock data service
export const kubernetesMock = {
  // Single cluster operations (accepts optional clusterId)
  getClusterOverview: generateClusterOverview,
  getNodes: generateNodes,
  getNamespaces: generateNamespaces,
  getPods: generatePods,
  getDeployments: generateDeployments,
  getPersistentVolumes: generatePersistentVolumes,
  getServices: generateServices,
  getEndpoints: generateEndpoints,
  getIngresses: generateIngresses,

  // Multi-cluster operations
  getNodesByRegion: generateNodesByRegion,
  getAllNodes: generateAllNodes,
  getClusterOverviewsByRegion: generateClusterOverviewsByRegion,
  getAllClusterOverviews: generateAllClusterOverviews,
};
