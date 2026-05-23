/**
 * Correlated Data Registry
 * Pre-generates shared resource data (pods, nodes, etc.) that all mock generators use
 * Ensures consistency between K8s, logs, traces, and metrics data
 */

import {
  SERVICES,
  SERVICE_METADATA,
  K8S_CLUSTER,
  K8S_ALL_CLUSTERS,
  K8S_NODES_BY_CLUSTER,
  randomId,
  randomBetween,
  generatePrivateIP,
  type ServiceName,
} from "../shared";

// ============================================================================
// Types
// ============================================================================

export interface CorrelatedPod {
  name: string;
  service: string;
  namespace: string;
  clusterId: string;
  nodeName: string;
  nodeIP: string;
  podIP: string;
  replicaSetId: string;
  podId: string;
  createdAt: number;
}

export interface CorrelatedNode {
  name: string;
  clusterId: string;
  internalIP: string;
  instanceType: string;
  zone: string;
}

export interface CorrelatedRegistry {
  pods: CorrelatedPod[];
  nodes: CorrelatedNode[];
  generatedAt: number;
  version: string;
}

// ============================================================================
// Registry Storage
// ============================================================================

let registry: CorrelatedRegistry | null = null;

// ============================================================================
// Registry Generation
// ============================================================================

/**
 * Generate all correlated nodes from cluster configuration
 */
function generateCorrelatedNodes(): CorrelatedNode[] {
  const nodes: CorrelatedNode[] = [];

  for (const cluster of K8S_ALL_CLUSTERS) {
    const clusterNodes = K8S_NODES_BY_CLUSTER[cluster.id] || [];
    for (const nodeConfig of clusterNodes) {
      nodes.push({
        name: nodeConfig.name,
        clusterId: cluster.id,
        internalIP:
          nodeConfig.name
            .match(/ip-(\d+-\d+-\d+-\d+)/)?.[1]
            ?.replace(/-/g, ".") || generatePrivateIP(),
        instanceType: nodeConfig.instanceType,
        zone: nodeConfig.zone,
      });
    }
  }

  return nodes;
}

/**
 * Generate all correlated pods across all clusters
 * These pods will be consistent between K8s views and logs
 */
function generateCorrelatedPods(): CorrelatedPod[] {
  const pods: CorrelatedPod[] = [];

  for (const cluster of K8S_ALL_CLUSTERS) {
    const clusterNodes = K8S_NODES_BY_CLUSTER[cluster.id] || [];
    if (clusterNodes.length === 0) continue;

    // Scale replicas based on environment
    const replicaMultiplier =
      cluster.environment === "production"
        ? 1
        : cluster.environment === "staging"
          ? 0.5
          : 0.3;

    // Determine namespace based on environment
    const namespace =
      cluster.environment === "production"
        ? "ecommerce"
        : cluster.environment === "staging"
          ? "ecommerce-staging"
          : "ecommerce-dev";

    // Generate pods for each service
    for (const service of SERVICES) {
      const metadata = SERVICE_METADATA[service as ServiceName];
      const baseReplicas = metadata?.replicas || 2;
      const replicas = Math.max(
        1,
        Math.round(baseReplicas * replicaMultiplier),
      );

      for (let i = 0; i < replicas; i++) {
        const replicaSetId = randomId(10);
        const podId = randomId(5);
        const node =
          clusterNodes[Math.floor(Math.random() * clusterNodes.length)];

        pods.push({
          name: `${service}-${replicaSetId}-${podId}`,
          service,
          namespace,
          clusterId: cluster.id,
          nodeName: node.name,
          nodeIP:
            node.name.match(/ip-(\d+-\d+-\d+-\d+)/)?.[1]?.replace(/-/g, ".") ||
            generatePrivateIP(),
          podIP: generatePrivateIP(),
          replicaSetId,
          podId,
          createdAt: Date.now() - Math.floor(randomBetween(1, 72)) * 3600000,
        });
      }
    }

    // Add infrastructure pods for clusters with monitoring namespace
    if (cluster.namespaces.includes("monitoring")) {
      const infraPods = [
        {
          name: "telemetryflow-collector",
          replicas: cluster.environment === "production" ? 3 : 1,
        },
        {
          name: "prometheus",
          replicas: cluster.environment === "production" ? 2 : 1,
        },
        { name: "grafana", replicas: 1 },
        { name: "jaeger-query", replicas: 1 },
        {
          name: "loki",
          replicas: cluster.environment === "production" ? 2 : 1,
        },
      ];

      for (const infra of infraPods) {
        for (let i = 0; i < infra.replicas; i++) {
          const replicaSetId = randomId(10);
          const podId = randomId(5);
          const node =
            clusterNodes[Math.floor(Math.random() * clusterNodes.length)];

          pods.push({
            name: `${infra.name}-${replicaSetId}-${podId}`,
            service: infra.name,
            namespace: "monitoring",
            clusterId: cluster.id,
            nodeName: node.name,
            nodeIP:
              node.name
                .match(/ip-(\d+-\d+-\d+-\d+)/)?.[1]
                ?.replace(/-/g, ".") || generatePrivateIP(),
            podIP: generatePrivateIP(),
            replicaSetId,
            podId,
            createdAt:
              Date.now() - Math.floor(randomBetween(24, 720)) * 3600000,
          });
        }
      }
    }
  }

  return pods;
}

/**
 * Initialize or get the correlated registry
 */
export function initializeRegistry(force: boolean = false): CorrelatedRegistry {
  if (registry && !force) {
    return registry;
  }

  console.log("[CorrelatedRegistry] Initializing correlated data registry...");
  const startTime = Date.now();

  const nodes = generateCorrelatedNodes();
  const pods = generateCorrelatedPods();

  registry = {
    nodes,
    pods,
    generatedAt: Date.now(),
    version: "1.0.0",
  };

  console.log(
    `[CorrelatedRegistry] Generated ${nodes.length} nodes, ${pods.length} pods in ${Date.now() - startTime}ms`,
  );
  return registry;
}

/**
 * Get the registry (initializes if needed)
 */
export function getRegistry(): CorrelatedRegistry {
  if (!registry) {
    return initializeRegistry();
  }
  return registry;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get all pods for a specific cluster
 */
export function getPodsByCluster(clusterId?: string): CorrelatedPod[] {
  const reg = getRegistry();
  const targetClusterId = clusterId || K8S_CLUSTER.id;
  return reg.pods.filter((p) => p.clusterId === targetClusterId);
}

/**
 * Get all pods for a specific service across all clusters
 */
export function getPodsByService(service: string): CorrelatedPod[] {
  const reg = getRegistry();
  return reg.pods.filter((p) => p.service === service);
}

/**
 * Get all pods for a specific namespace in a cluster
 */
export function getPodsByNamespace(
  namespace: string,
  clusterId?: string,
): CorrelatedPod[] {
  const reg = getRegistry();
  const targetClusterId = clusterId || K8S_CLUSTER.id;
  return reg.pods.filter(
    (p) => p.clusterId === targetClusterId && p.namespace === namespace,
  );
}

/**
 * Get a random pod from the registry (for generating logs/traces)
 */
export function getRandomPod(
  service?: string,
  clusterId?: string,
): CorrelatedPod | undefined {
  const reg = getRegistry();
  let candidates = reg.pods;

  if (clusterId) {
    candidates = candidates.filter((p) => p.clusterId === clusterId);
  }
  if (service) {
    candidates = candidates.filter((p) => p.service === service);
  }

  if (candidates.length === 0) return undefined;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Get a pod by exact name
 */
export function getPodByName(
  podName: string,
  clusterId?: string,
): CorrelatedPod | undefined {
  const reg = getRegistry();
  const targetClusterId = clusterId || K8S_CLUSTER.id;
  return reg.pods.find(
    (p) => p.name === podName && p.clusterId === targetClusterId,
  );
}

/**
 * Get all pods that match a search query (searches in name, service, namespace)
 */
export function searchPods(query: string, clusterId?: string): CorrelatedPod[] {
  const reg = getRegistry();
  const lowerQuery = query.toLowerCase();
  let candidates = reg.pods;

  if (clusterId) {
    candidates = candidates.filter((p) => p.clusterId === clusterId);
  }

  return candidates.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.service.toLowerCase().includes(lowerQuery) ||
      p.namespace.toLowerCase().includes(lowerQuery),
  );
}

/**
 * Get nodes for a cluster
 */
export function getNodesByCluster(clusterId?: string): CorrelatedNode[] {
  const reg = getRegistry();
  const targetClusterId = clusterId || K8S_CLUSTER.id;
  return reg.nodes.filter((n) => n.clusterId === targetClusterId);
}

/**
 * Get all service names that have pods in the registry
 */
export function getAvailableServices(clusterId?: string): string[] {
  const reg = getRegistry();
  let pods = reg.pods;

  if (clusterId) {
    pods = pods.filter((p) => p.clusterId === clusterId);
  }

  return [...new Set(pods.map((p) => p.service))];
}

// ============================================================================
// Export
// ============================================================================

export const correlatedRegistry = {
  initialize: initializeRegistry,
  getRegistry,
  getPodsByCluster,
  getPodsByService,
  getPodsByNamespace,
  getRandomPod,
  getPodByName,
  searchPods,
  getNodesByCluster,
  getAvailableServices,
};

export default correlatedRegistry;
