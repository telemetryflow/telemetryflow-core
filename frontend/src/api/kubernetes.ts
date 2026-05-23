/**
 * Kubernetes API client
 *
 * All real (non-mock) API calls route to the NestJS backend via iamClient
 * (baseURL: config.iamApiUrl + '/api/v2', port 3000).
 * The Vite dev proxy forwards /api/v2/* → http://localhost:3000.
 *
 * NOTE: iamClient already has '/api/v2' as its baseURL, so paths passed to it
 * must NOT include the '/api/v2' prefix (strip it from COLLECTOR_ENDPOINTS constants).
 */

import { iamClient } from "./iam";
import { COLLECTOR_ENDPOINTS, K8S_CLUSTER_ENDPOINTS } from "@/config/collector";
import { config } from "@/config";
import { generateChartSeries } from "@/utils/telemetry";
import { mockKubernetesData } from "@/composables/useKubernetesData.mock";
import { kubernetesMock } from "@/mocks/kubernetes";
import { K8S_ALL_CLUSTERS, K8S_REGIONS } from "@/mocks/shared";
import type {
  K8sOverviewData,
  TimeSeriesData,
  K8sStatCard,
} from "@/composables/useKubernetesData";
import type {
  K8sNode,
  K8sPod,
  K8sDeployment,
  K8sPersistentVolume,
  K8sNamespace,
} from "@/mocks/kubernetes";

// ---- Cluster Registration Types ----

export interface K8sClusterDto {
  id: string;
  name: string;
  displayName?: string;
  provider?: string;
  region?: string;
  apiServerUrl?: string;
  version?: string;
  status: string;
  nodeCount: number;
  podCount: number;
  namespaceCount: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  labels?: Record<string, string>;
  /** UUID of the API Key bound to this cluster for TFO Agent auth */
  apiKeyId?: string;
}

export interface RegisterClusterRequest {
  name: string;
  displayName?: string;
  provider?: string;
  region?: string;
  apiServerUrl?: string;
  version?: string;
  labels?: Record<string, string>;
  /** Bind an existing API Key at registration time (DB UUID, not tfk_ key) */
  apiKeyId?: string;
}

export interface UpdateClusterRequest {
  name?: string;
  displayName?: string;
  apiServerUrl?: string;
  version?: string;
  region?: string;
  labels?: Record<string, string>;
  /** Rebind to a different API Key, or pass null to unbind */
  apiKeyId?: string | null;
}

export interface BindApiKeyRequest {
  /** DB UUID of the API Key to bind, or null to unbind */
  apiKeyId: string | null;
}

export interface BindApiKeyResponse {
  clusterId: string;
  apiKeyId: string | null;
}

// ---- Pod Logs Types ----

export interface PodLogsParams {
  namespace?: string;
  pod?: string;
  container?: string;
  node?: string;
  deployment?: string;
  search?: string;
  from?: string; // ISO8601
  to?: string; // ISO8601
  limit?: number;
}

export interface PodLogLine {
  timestamp: string;
  namespace: string;
  podName: string;
  containerName: string;
  nodeName: string;
  deploymentName: string;
  logLine: string;
}

export interface PodLogsResponse {
  logs: PodLogLine[];
  total: number;
  from: string;
  to: string;
}

// ---- Agent Pod Log Stream Types ----

export interface AgentPodLogStreamParams {
  container?: string;
  follow?: boolean;
  tailLines?: number;
  sinceSeconds?: number;
  previous?: boolean;
}

// ---- Cluster Queries ----

export interface ListClustersQuery {
  page?: number;
  limit?: number;
  provider?: string;
  status?: string;
}

export interface ClusterListResponse {
  data: K8sClusterDto[];
  total: number;
  page: number;
  limit: number;
}

// Filter option types
export interface FilterOption {
  label: string;
  value: string;
}

export interface K8sFilterOptions {
  providers: FilterOption[];
  regions: FilterOption[];
  clusters: FilterOption[];
  nodes: FilterOption[];
  namespaces: FilterOption[];
  deployments: FilterOption[];
  pods: FilterOption[];
  pvs: FilterOption[];
}

export interface K8sOverviewResponse {
  overview: K8sOverviewData;
  statCards: K8sStatCard[];
  cpuUsagePercentages: { real: number; requests: number; limits: number };
  ramUsagePercentages: { real: number; requests: number; limits: number };
  resourceCountTimeSeries: TimeSeriesData[];
  clusterCpuUtilization: TimeSeriesData[];
  clusterMemoryUtilization: TimeSeriesData[];
  cpuByNamespace: TimeSeriesData[];
  memoryByNamespace: TimeSeriesData[];
  cpuByInstance: TimeSeriesData[];
  memoryByInstance: TimeSeriesData[];
  diskByNode?: TimeSeriesData[];
  networkByNode?: TimeSeriesData[];
  cpuThrottledByNamespace?: TimeSeriesData[];
  cpuThrottledByInstance?: TimeSeriesData[];
  podsQoSData: TimeSeriesData[];
  podsStatusReason: TimeSeriesData[];
  oomEventsByNamespace?: TimeSeriesData[];
  containerRestarts: TimeSeriesData[];
  networkByDevice: TimeSeriesData[];
  networkPacketsDropped: TimeSeriesData[];
  networkByNamespace: TimeSeriesData[];
  networkRxByNamespace?: TimeSeriesData[];
  networkTxByNamespace?: TimeSeriesData[];
  networkByInstance: TimeSeriesData[];
  networkByInstanceK8sProd: TimeSeriesData[];
  // HPA
  hpaTimeSeries?: TimeSeriesData[];
  hpaMinMaxTimeSeries?: TimeSeriesData[];
  hpaConditionTimeSeries?: TimeSeriesData[];
  hpaTotalCount?: number;
  // PDB
  pdbTimeSeries?: TimeSeriesData[];
  pdbTotalDisruptionsAllowed?: number;
  // Memory working set
  memoryWorkingSetByPod?: TimeSeriesData[];
  // Per-pod granularity
  cpuByPod?: TimeSeriesData[];
  memoryByPod?: TimeSeriesData[];
  cpuThrottledByPod?: TimeSeriesData[];
  oomKilledByPod?: TimeSeriesData[];
  // Node conditions from ClickHouse
  nodeConditionDiskPressure?: TimeSeriesData[];
  nodeConditionMemoryPressure?: TimeSeriesData[];
  nodeConditionPidPressure?: TimeSeriesData[];
  nodeConditionNetworkUnavailable?: TimeSeriesData[];
  // Namespace workload gauges
  podsByNamespace?: TimeSeriesData[];
  deploymentsByNamespace?: TimeSeriesData[];
  servicesByNamespace?: TimeSeriesData[];
  ingressByNamespace?: TimeSeriesData[];
  // Deployment replica gauges
  deploymentDesiredReplicas?: TimeSeriesData[];
  deploymentAvailableReplicas?: TimeSeriesData[];
  deploymentUnavailableReplicas?: TimeSeriesData[];
  deploymentUpdatedReplicas?: TimeSeriesData[];
  // PV gauges
  pvPhaseTimeSeries?: TimeSeriesData[];
  pvStorageClassTimeSeries?: TimeSeriesData[];
  pvCapacityByClassTimeSeries?: TimeSeriesData[];
  pvUsageByNamespaceTimeSeries?: TimeSeriesData[];
  pvInodesUsedByNsTimeSeries?: TimeSeriesData[];
}

/** Per-node metrics time-series from GET /clusters/:id/metrics/nodes */
export interface NodeMetricsResponse {
  cpuByNode: TimeSeriesData[];
  memoryByNode: TimeSeriesData[];
  diskByNode: TimeSeriesData[];
  networkByNode: TimeSeriesData[];
}

export interface TimeSeriesPoint {
  name: string;
  data: Array<[number, number]>;
  color?: string;
}

export interface ApiServerMetricsResponse {
  healthStatus: number;
  requestsByCode: TimeSeriesPoint[];
  requestsByVerb: TimeSeriesPoint[];
  latencyByVerb: TimeSeriesPoint[];
  latencyByInstance: TimeSeriesPoint[];
  errorsByInstance: TimeSeriesPoint[];
  errorsByVerb: TimeSeriesPoint[];
  workQueue: TimeSeriesPoint[];
  cpuUsage: TimeSeriesPoint[];
  memoryUsage: TimeSeriesPoint[];
  requestsStacked: TimeSeriesPoint[];
  totalRequestsPerSec: number;
  avgLatencyMs: number;
  errorRatePercent: number;
  instanceCount: number;
}

export interface CoreDnsMetricsResponse {
  healthStatus: number;
  requestsPerSec: TimeSeriesPoint[];
  responsesByRcode: TimeSeriesPoint[];
  durationP99: TimeSeriesPoint[];
  cacheHitsMisses: TimeSeriesPoint[];
  errorRate: TimeSeriesPoint[];
  upstreamRequests: TimeSeriesPoint[];
  cpuUsage: TimeSeriesPoint[];
  memoryUsage: TimeSeriesPoint[];
  totalRequestsPerSec: number;
  cacheHitRatePercent: number;
  avgDurationMs: number;
  podCount: number;
}

// iamClient baseURL already includes '/api/v2', so strip that prefix from endpoint constants.
function k8sPath(fullPath: string): string {
  return fullPath.replace(/^\/api\/v2/, "");
}

// Create singleton mock data instance
let mockDataInstance: ReturnType<typeof mockKubernetesData> | null = null;

function getMockDataInstance() {
  if (!mockDataInstance) {
    mockDataInstance = mockKubernetesData();
  }
  return mockDataInstance;
}

/**
 * Session-level in-memory overrides for mock cluster data.
 * Persists mutations (updateCluster, bindApiKey) within the same browser session
 * so that refreshing the page does not reset changes.
 * Key: cluster ID, Value: partial override merged over the base K8S_ALL_CLUSTERS entry.
 */
const mockClusterOverrides = new Map<string, Partial<K8sClusterDto>>();

function applyMockOverrides(base: K8sClusterDto): K8sClusterDto {
  const patch = mockClusterOverrides.get(base.id);
  return patch ? { ...base, ...patch } : base;
}

export const kubernetesApi = {
  /**
   * Get available regions
   */
  getRegions(): Array<{ id: string; name: string; displayName: string }> {
    if (config.useMock) {
      const mock = getMockDataInstance();
      return mock.regions.map((r) => ({
        id: r.id,
        name: r.name,
        displayName: r.name, // Region uses 'name' as display name
      }));
    }
    return [];
  },

  /**
   * Get available clusters for current region (read-only, no side effects)
   */
  getClusters(): Array<{ id: string; name: string; displayName: string }> {
    if (config.useMock) {
      const mock = getMockDataInstance();
      // Return clusters for specified region, or current region's clusters
      return mock.availableClusters.value.map((c) => ({
        id: c.id,
        name: c.name,
        displayName: c.displayName,
      }));
    }
    return [];
  },

  /**
   * Set selected region
   */
  setRegion(regionId: string): void {
    if (config.useMock) {
      const mock = getMockDataInstance();
      mock.setRegion(regionId as any);
    }
  },

  /**
   * Set selected cluster
   */
  setCluster(clusterId: string): void {
    if (config.useMock) {
      const mock = getMockDataInstance();
      mock.setCluster(clusterId);
    }
  },

  /**
   * Get selected region ID
   */
  getSelectedRegionId(): string {
    if (config.useMock) {
      const mock = getMockDataInstance();
      return mock.selectedRegionId.value;
    }
    return "";
  },

  /**
   * Get selected cluster ID
   */
  getSelectedClusterId(): string {
    if (config.useMock) {
      const mock = getMockDataInstance();
      return mock.selectedClusterId.value;
    }
    return "";
  },

  /**
   * Get Kubernetes overview data
   * @param id        Cluster ID filter (optional)
   * @param interval  Time window: '1h' | '3h' | '6h' | '24h' | '7d' (default '1h')
   * @param filters   Additional filters: namespace, node
   */
  async getOverview(
    id?: string,
    interval = "1h",
    filters?: { namespace?: string; node?: string },
  ): Promise<K8sOverviewResponse> {
    if (config.useMock) {
      const mock = getMockDataInstance();
      return {
        overview: mock.overviewData.value,
        statCards: mock.k8sStatCards.value,
        cpuUsagePercentages: mock.cpuUsagePercentages.value,
        ramUsagePercentages: mock.ramUsagePercentages.value,
        resourceCountTimeSeries: mock.resourceCountTimeSeries.value,
        clusterCpuUtilization: mock.clusterCpuUtilization.value,
        clusterMemoryUtilization: mock.clusterMemoryUtilization.value,
        cpuByNamespace: mock.cpuByNamespace.value,
        memoryByNamespace: mock.memoryByNamespace.value,
        cpuByInstance: mock.cpuByInstance.value,
        memoryByInstance: mock.memoryByInstance.value,
        diskByNode: [],
        networkByNode: [],
        cpuThrottledByNamespace: mock.cpuThrottledByNamespace.value,
        cpuThrottledByInstance: mock.cpuThrottledByInstance.value,
        podsQoSData: mock.podsQoSData.value,
        podsStatusReason: mock.podsStatusReason.value,
        oomEventsByNamespace: mock.oomEventsByNamespace.value,
        containerRestarts: mock.containerRestarts.value,
        networkByDevice: mock.networkByDevice.value,
        networkPacketsDropped: mock.networkPacketsDropped.value,
        networkByNamespace: mock.networkByNamespace.value,
        networkByInstance: mock.networkByInstance.value,
        networkByInstanceK8sProd: mock.networkByInstanceK8sProd.value,
        hpaTimeSeries: mock.hpaTimeSeries.value,
        hpaTotalCount: mock.hpaTotalCount.value,
        pdbTimeSeries: mock.pdbTimeSeries.value,
        pdbTotalDisruptionsAllowed: mock.pdbTotalDisruptionsAllowed.value,
        memoryWorkingSetByPod: mock.memoryWorkingSetByPod.value,
        // Node conditions — mock returns empty (conditions computed locally in nodes.vue)
        nodeConditionDiskPressure: [],
        nodeConditionMemoryPressure: [],
        nodeConditionPidPressure: [],
        nodeConditionNetworkUnavailable: [],
      };
    }

    const params: Record<string, string> = { interval };
    if (id) params.clusterId = id;
    if (filters?.namespace) params.namespace = filters.namespace;
    if (filters?.node) params.node = filters.node;
    return await iamClient.get<K8sOverviewResponse>(
      k8sPath(COLLECTOR_ENDPOINTS.KUBERNETES_OVERVIEW),
      { params },
    );
  },

  /**
   * Fetch per-node CPU%, Memory%, Disk (GiB), Network (Mbps) time-series
   * from the dedicated ClickHouse MV endpoint.
   * @param clusterId Cluster ID
   * @param interval  Time window: '1h' | '3h' | '6h' | '24h' | '7d'
   */
  async fetchNodeMetrics(
    clusterId: string,
    interval = "1h",
  ): Promise<NodeMetricsResponse> {
    if (config.useMock) {
      return {
        cpuByNode: [
          generateChartSeries("node-1", 45, 10),
          generateChartSeries("node-2", 38, 8),
          generateChartSeries("node-3", 52, 12),
        ],
        memoryByNode: [
          generateChartSeries("node-1", 68, 8),
          generateChartSeries("node-2", 55, 6),
          generateChartSeries("node-3", 72, 10),
        ],
        diskByNode: [
          generateChartSeries("node-1", 42, 5),
          generateChartSeries("node-2", 35, 4),
          generateChartSeries("node-3", 58, 6),
        ],
        networkByNode: [
          generateChartSeries("node-1 RX", 120, 30),
          generateChartSeries("node-1 TX", 80, 20),
          generateChartSeries("node-2 RX", 95, 25),
          generateChartSeries("node-2 TX", 65, 15),
        ],
      };
    }
    return (
      (await iamClient.get<NodeMetricsResponse>(
        k8sPath(K8S_CLUSTER_ENDPOINTS.nodeMetrics(clusterId)),
        { params: { interval } },
      )) ?? {
        cpuByNode: [],
        memoryByNode: [],
        diskByNode: [],
        networkByNode: [],
      }
    );
  },

  /**
   * Refresh mock data (for mock mode only)
   */
  refreshMockData(): void {
    if (config.useMock) {
      const mock = getMockDataInstance();
      mock.refreshData();
    }
  },

  /**
   * Get Kubernetes namespaces for a specific cluster.
   * Requires a clusterId — the flat /namespaces endpoint does not exist in the backend.
   */
  async getNamespaces(clusterId?: string): Promise<string[]> {
    if (config.useMock) {
      return [
        "production",
        "staging",
        "kube-system",
        "monitoring",
        "logging",
        "ingress-nginx",
        "cert-manager",
        "argocd",
        "istio-system",
        "default",
        "database",
        "redis",
      ];
    }

    if (!clusterId) return [];

    const body = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.namespaces(clusterId)),
    );
    const items: any[] = Array.isArray(body)
      ? body
      : (body?.items ?? body?.data ?? []);
    return items.map((ns: any) =>
      typeof ns === "string" ? ns : (ns.name ?? ns.namespaceName ?? String(ns)),
    );
  },

  /**
   * Get Kubernetes nodes
   */
  async getNodes(): Promise<string[]> {
    if (config.useMock) {
      const mock = getMockDataInstance();
      const clusterId = mock.selectedClusterId.value;
      const nodes = kubernetesMock.getNodes(clusterId);
      return nodes.map((n) => n.name);
    }

    // The flat /nodes endpoint does not exist on the backend.
    // Use fetchNodes(clusterId) for real node data.
    return [];
  },

  /**
   * Get all filter options for the current selection
   */
  getFilterOptions(clusterId?: string): K8sFilterOptions {
    if (!config.useMock) {
      return {
        providers: [],
        regions: [],
        clusters: [],
        nodes: [],
        namespaces: [],
        deployments: [],
        pods: [],
        pvs: [],
      };
    }

    const mock = getMockDataInstance();
    const currentClusterId = clusterId || mock.selectedClusterId.value;

    // Get unique providers
    const providerMap: Record<string, string> = {
      eks: "AWS",
      gke: "GCP",
      aks: "Azure",
    };
    const providers = [...new Set(K8S_ALL_CLUSTERS.map((c) => c.provider))].map(
      (p) => ({
        label: providerMap[p] || p.toUpperCase(),
        value: p,
      }),
    );

    // Get regions
    const regions = K8S_REGIONS.map((r) => ({
      label: r.name,
      value: r.id,
    }));

    // Get clusters for current region
    const clusters = mock.availableClusters.value.map((c) => ({
      label: c.displayName,
      value: c.id,
    }));

    // Get nodes for current cluster
    const nodes = kubernetesMock.getNodes(currentClusterId).map((n) => ({
      label: n.name.length > 40 ? `${n.name.substring(0, 40)}...` : n.name,
      value: n.name,
    }));

    // Get namespaces for current cluster
    const namespaceList = kubernetesMock.getNamespaces(currentClusterId);
    const namespaces = namespaceList.map((ns) => ({
      label: ns.name,
      value: ns.name,
    }));

    // Get deployments for current cluster
    const deployments = kubernetesMock
      .getDeployments(currentClusterId)
      .map((d) => ({
        label: d.name,
        value: d.name,
      }));

    // Get pods for current cluster
    const pods = kubernetesMock.getPods(currentClusterId).map((p) => ({
      label: p.name.length > 40 ? `${p.name.substring(0, 40)}...` : p.name,
      value: p.name,
    }));

    // Get PVs
    const pvs = kubernetesMock.getPersistentVolumes().map((pv) => ({
      label: pv.name,
      value: pv.name,
    }));

    return {
      providers,
      regions,
      clusters,
      nodes,
      namespaces,
      deployments,
      pods,
      pvs,
    };
  },

  /**
   * Get clusters by provider
   */
  getClustersByProvider(provider: string): FilterOption[] {
    if (!config.useMock) return [];
    return K8S_ALL_CLUSTERS.filter((c) => c.provider === provider).map((c) => ({
      label: c.displayName,
      value: c.id,
    }));
  },

  /**
   * Get node details — mock: from generator, real: GET /clusters/:id/nodes
   */
  getNodeDetails(clusterId?: string): K8sNode[] {
    if (!config.useMock) return [];
    const mock = getMockDataInstance();
    const id = clusterId || mock.selectedClusterId.value;
    return kubernetesMock.getNodes(id);
  },

  /**
   * Async: fetch real node list from backend for a given cluster
   */
  async fetchNodes(clusterId: string): Promise<any[]> {
    const payload = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.nodes(clusterId)),
      { params: { limit: 1000 } },
    );
    return Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
  },

  /**
   * Get pod details — mock: from generator, real: GET /clusters/:id/pods
   */
  getPodDetails(clusterId?: string): K8sPod[] {
    if (!config.useMock) return [];
    const mock = getMockDataInstance();
    const id = clusterId || mock.selectedClusterId.value;
    return kubernetesMock.getPods(id);
  },

  /**
   * Async: fetch real pod list from backend for a given cluster
   */
  async fetchPods(clusterId: string, namespace?: string): Promise<any[]> {
    const params: Record<string, string | number> = { limit: 1000 };
    if (namespace) params.namespace = namespace;
    const payload = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.pods(clusterId)),
      { params },
    );
    return Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
  },

  /**
   * Get deployment details — mock only; real deployment data comes from the k8s store
   */
  getDeploymentDetails(clusterId?: string): K8sDeployment[] {
    if (!config.useMock) return [];
    const mock = getMockDataInstance();
    const id = clusterId || mock.selectedClusterId.value;
    return kubernetesMock.getDeployments(id);
  },

  /**
   * Async: fetch real deployment list from backend for a given cluster.
   * Maps backend DeploymentResponseDto fields to the shape expected by transformDeploymentToTableData.
   */
  async fetchDeployments(clusterId: string): Promise<any[]> {
    const data = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.deployments(clusterId)),
      { params: { limit: 1000 } },
    );
    const items: any[] = data?.deployments ?? data?.data ?? [];
    return items.map((d) => ({
      name: d.name,
      namespace: d.namespaceName ?? d.namespaceId ?? "",
      replicas: {
        desired: d.replicas ?? 0,
        ready: d.readyReplicas ?? 0,
        updated: d.updatedReplicas ?? 0,
        available: d.availableReplicas ?? 0,
      },
      strategy: { type: d.strategy?.type ?? "RollingUpdate" },
      containers: d.containers ?? [],
      conditions: d.conditions ?? [],
      labels: d.labels ?? {},
      healthStatus: d.healthStatus ?? "healthy",
      createdAt: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
    }));
  },

  /**
   * Fetch K8s Services for a cluster.
   */
  async fetchServices(clusterId: string): Promise<any[]> {
    if (config.useMock) return kubernetesMock.getServices(clusterId);
    const data = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.services(clusterId)),
      { params: { limit: 1000 } },
    );
    return data?.services ?? data?.data ?? (Array.isArray(data) ? data : []);
  },

  /**
   * Fetch K8s Endpoints for a cluster.
   */
  async fetchEndpoints(clusterId: string): Promise<any[]> {
    if (config.useMock) return kubernetesMock.getEndpoints(clusterId);
    const data = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.endpoints(clusterId)),
      { params: { limit: 1000 } },
    );
    return data?.endpoints ?? data?.data ?? (Array.isArray(data) ? data : []);
  },

  /**
   * Fetch K8s Ingresses for a cluster.
   */
  async fetchIngresses(clusterId: string): Promise<any[]> {
    if (config.useMock) return kubernetesMock.getIngresses(clusterId);
    const data = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.ingresses(clusterId)),
      { params: { limit: 1000 } },
    );
    return data?.ingresses ?? data?.data ?? (Array.isArray(data) ? data : []);
  },

  /**
   * Async: fetch real namespace list from backend for a given cluster.
   * Maps backend fields to the shape expected by transformNamespaceToTableData.
   */
  async fetchNamespaceDetails(clusterId: string): Promise<any[]> {
    const data = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.namespaces(clusterId)),
    );
    const items: any[] =
      data?.namespaces ?? data?.data ?? (Array.isArray(data) ? data : []);
    return items.map((ns) => ({
      name: ns.name ?? ns.namespaceName ?? "",
      status: ns.phase ?? ns.status ?? "Active",
      resourceQuota: ns.resourceQuota ?? ns.resource_quota ?? null,
      podCount: ns.podCount ?? ns.pod_count ?? 0,
      deploymentCount: ns.deploymentCount ?? ns.deployment_count ?? 0,
      serviceCount: ns.serviceCount ?? ns.service_count ?? 0,
      cpuUsage: ns.cpuUsage ?? ns.cpu_usage ?? undefined,
      memoryUsage: ns.memoryUsage ?? ns.memory_usage ?? undefined,
      createdAt:
        (ns.createdAt ?? ns.created_at)
          ? new Date(ns.createdAt ?? ns.created_at).getTime()
          : Date.now(),
    }));
  },

  /**
   * Get namespace details — mock: from generator, real: GET /clusters/:id/namespaces
   */
  getNamespaceDetails(clusterId?: string): K8sNamespace[] {
    if (!config.useMock) return [];
    const mock = getMockDataInstance();
    const id = clusterId || mock.selectedClusterId.value;
    return kubernetesMock.getNamespaces(id);
  },

  /**
   * Async: fetch real namespace list from backend for a given cluster
   */
  async fetchNamespaces(clusterId: string): Promise<any[]> {
    const payload = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.namespaces(clusterId)),
    );
    return Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
  },

  /**
   * Get persistent volume details — mock only (legacy sync path)
   */
  getPersistentVolumeDetails(): K8sPersistentVolume[] {
    if (!config.useMock) return [];
    return kubernetesMock.getPersistentVolumes();
  },

  /**
   * Async: fetch real PV list from backend for a given cluster
   */
  async listPersistentVolumes(
    clusterId: string,
  ): Promise<K8sPersistentVolume[]> {
    if (config.useMock) return kubernetesMock.getPersistentVolumes();
    const body = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.persistentVolumes(clusterId)),
      { params: { limit: 1000 } },
    );
    const pvs: any[] =
      body?.persistentVolumes ??
      body?.data ??
      (Array.isArray(body) ? body : []);
    return pvs.map((pv) => ({
      name: pv.name,
      capacity:
        pv.capacity?.storage ??
        (pv.capacityBytes
          ? `${Math.round((pv.capacityBytes ?? 0) / 1024 ** 3)}Gi`
          : "0Gi"),
      accessModes: pv.accessModes ?? [],
      reclaimPolicy: pv.reclaimPolicy ?? "Retain",
      storageClass: pv.storageClassName ?? "",
      status: pv.phase ?? "Available",
      claim: pv.claimRef
        ? { name: pv.claimRef.name, namespace: pv.claimRef.namespace }
        : undefined,
      createdAt: pv.createdAt ? new Date(pv.createdAt).getTime() : Date.now(),
    }));
  },

  /**
   * Async: fetch PVC summary stats (total, bound, pending) from backend for a given cluster
   */
  async fetchPVCStats(clusterId: string): Promise<{ total: number; bound: number; pending: number }> {
    if (config.useMock) return { total: 0, bound: 0, pending: 0 };
    const body = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.persistentVolumeClaims(clusterId)),
      { params: { limit: 1000 } },
    );
    const pvcs: any[] =
      body?.persistentVolumeClaims ?? body?.data ?? (Array.isArray(body) ? body : []);
    return {
      total: body?.total ?? pvcs.length,
      bound: pvcs.filter((p) => p.phase === "Bound" || p.isBound).length,
      pending: pvcs.filter((p) => p.phase === "Pending").length,
    };
  },

  /**
   * Fetch PV I/O metrics time-series from ClickHouse
   */
  async fetchPVMetrics(
    clusterId: string,
    pvName: string,
    interval: string = "1h",
  ): Promise<{
    capacityUsage: any[];
    inodesUsed: any[];
    availableBytes: any[];
    latestUsedBytes: number;
    latestCapacityBytes: number;
    usagePercent: number;
    latestInodesUsed: number;
    latestInodes: number;
  }> {
    const empty = {
      capacityUsage: [],
      inodesUsed: [],
      availableBytes: [],
      latestUsedBytes: 0,
      latestCapacityBytes: 0,
      usagePercent: 0,
      latestInodesUsed: 0,
      latestInodes: 0,
    };
    if (config.useMock) return empty;
    const body = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.pvMetrics(clusterId, pvName)),
      { params: { interval } },
    );
    return body ?? empty;
  },

  // ---- Cluster Registration CRUD ----

  /**
   * List registered Kubernetes clusters
   */
  async listClusters(
    query: ListClustersQuery = {},
  ): Promise<ClusterListResponse> {
    if (config.useMock) {
      const all = K8S_ALL_CLUSTERS.map((c) => {
        const base: K8sClusterDto = {
          id: c.id,
          name: c.name,
          displayName: c.displayName,
          provider: c.provider,
          region: c.region,
          apiServerUrl: (c as any).apiServer,
          version: c.version,
          status: c.status,
          nodeCount: c.nodeCount,
          podCount: (c as any).totalPods ?? 0,
          namespaceCount: c.namespaces.length,
          organizationId: "mock-org-id",
          createdAt: new Date(
            Date.now() - Math.random() * 7776000000,
          ).toISOString(),
          updatedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        };
        return applyMockOverrides(base);
      });
      return { data: all, total: all.length, page: 1, limit: 100 };
    }
    const response = await iamClient.get<any>(
      k8sPath(COLLECTOR_ENDPOINTS.KUBERNETES_CLUSTERS),
      { params: query },
    );
    // Backend returns { clusters, total, page, limit, totalPages }
    // Normalise to the ClusterListResponse shape { data, total, page, limit }
    return {
      data: response?.clusters ?? response?.data ?? [],
      total: response?.total ?? 0,
      page: response?.page ?? 1,
      limit: response?.limit ?? 20,
    };
  },

  /**
   * Register a new Kubernetes cluster — returns the created cluster with its UUID
   */
  async registerCluster(dto: RegisterClusterRequest): Promise<K8sClusterDto> {
    if (config.useMock) {
      const mock: K8sClusterDto = {
        id: crypto.randomUUID(),
        name: dto.name,
        displayName: dto.displayName ?? dto.name,
        provider: dto.provider,
        region: dto.region,
        apiServerUrl: dto.apiServerUrl,
        version: dto.version,
        status: "pending",
        nodeCount: 0,
        podCount: 0,
        namespaceCount: 0,
        organizationId: "mock-org-id",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        labels: dto.labels,
      };
      return mock;
    }
    const created = await iamClient.post<K8sClusterDto>(
      k8sPath(COLLECTOR_ENDPOINTS.KUBERNETES_CLUSTERS),
      dto,
    );
    return created;
  },

  /**
   * Get a single cluster by ID
   */
  async getCluster(id: string): Promise<K8sClusterDto> {
    if (config.useMock) {
      const found = K8S_ALL_CLUSTERS.find((c) => c.id === id);
      if (!found) throw new Error("Cluster not found");
      const base: K8sClusterDto = {
        id: found.id,
        name: found.name,
        displayName: found.displayName,
        provider: found.provider,
        region: found.region,
        version: found.version,
        status: found.status,
        nodeCount: found.nodeCount,
        podCount: (found as any).totalPods ?? 0,
        namespaceCount: found.namespaces.length,
        organizationId: "mock-org-id",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return applyMockOverrides(base);
    }
    const cluster = await iamClient.get<K8sClusterDto>(
      k8sPath(`${COLLECTOR_ENDPOINTS.KUBERNETES_CLUSTERS}/${id}`),
    );
    return cluster;
  },

  /**
   * Update cluster metadata
   */
  async updateCluster(
    id: string,
    dto: UpdateClusterRequest,
  ): Promise<K8sClusterDto> {
    if (config.useMock) {
      const existing = await kubernetesApi.getCluster(id);
      const { apiKeyId: dtoApiKeyId, ...dtoRest } = dto;
      // Use `in` check so explicit null (unbind) is respected, not skipped by ??
      const resolvedApiKeyId = "apiKeyId" in dto ? dtoApiKeyId : existing.apiKeyId;
      const updated: K8sClusterDto = {
        ...existing,
        ...dtoRest,
        apiKeyId: resolvedApiKeyId ?? undefined,
        updatedAt: new Date().toISOString(),
      };
      // Persist to session override map so fetchClusters/getCluster always returns updated data
      mockClusterOverrides.set(id, {
        ...(mockClusterOverrides.get(id) ?? {}),
        ...dtoRest,
        apiKeyId: updated.apiKeyId,
        updatedAt: updated.updatedAt,
      });
      return updated;
    }
    const updated = await iamClient.put<K8sClusterDto>(
      k8sPath(`${COLLECTOR_ENDPOINTS.KUBERNETES_CLUSTERS}/${id}`),
      dto,
    );
    return updated;
  },

  /**
   * Deregister (delete) a cluster — stops all data collection
   */
  async deregisterCluster(id: string): Promise<void> {
    if (config.useMock) return;
    await iamClient.delete(
      k8sPath(`${COLLECTOR_ENDPOINTS.KUBERNETES_CLUSTERS}/${id}`),
    );
  },

  /**
   * Bind / Rebind / Unbind an API Key to a cluster.
   *
   * The TFO Agent authenticates ingestion calls using:
   *   Authorization: Basic base64(<tfk_KEY_ID>:<tfs_KEY_SECRET>)
   * or via TFO-specific headers:
   *   x-telemetryflow-key-id: tfk_...
   *   x-telemetryflow-key-secret: tfs_...
   *   x-telemetryflow-encryption-key: <encryptKey>
   *
   * @param id - Cluster UUID
   * @param apiKeyId - DB UUID of the API key to bind, or null to unbind
   */
  async bindApiKey(id: string, apiKeyId: string | null): Promise<BindApiKeyResponse> {
    if (config.useMock) {
      // Persist to session override map so refresh doesn't reset the binding
      const existing = mockClusterOverrides.get(id) ?? {};
      mockClusterOverrides.set(id, {
        ...existing,
        apiKeyId: apiKeyId ?? undefined,
        updatedAt: new Date().toISOString(),
      });
      return { clusterId: id, apiKeyId };
    }
    const result = await iamClient.patch<BindApiKeyResponse>(
      k8sPath(`${COLLECTOR_ENDPOINTS.KUBERNETES_CLUSTERS}/${id}/bind-api-key`),
      { apiKeyId },
    );
    return result;
  },

  /**
   * Fetch pod log lines from ClickHouse for a cluster.
   * Supports filtering by namespace, pod, container, node, deployment, or full-text search.
   * Covers: cluster logs, namespace logs, node logs, deployment logs, pod logs, PV-mounted pod logs.
   */
  async getApiServerMetrics(
    interval = "1h",
  ): Promise<ApiServerMetricsResponse> {
    if (config.useMock) {
      return {
        healthStatus: 1,
        requestsByCode: [
          generateChartSeries("200", 120, 15),
          generateChartSeries("201", 8, 2),
          generateChartSeries("401", 3, 1),
          generateChartSeries("404", 5, 2),
          generateChartSeries("500", 1.5, 0.8),
        ],
        requestsByVerb: [
          generateChartSeries("GET", 80, 10),
          generateChartSeries("LIST", 30, 5),
          generateChartSeries("WATCH", 15, 3),
          generateChartSeries("POST", 8, 2),
          generateChartSeries("PUT", 5, 1),
          generateChartSeries("DELETE", 2, 0.5),
        ],
        latencyByVerb: [
          generateChartSeries("GET", 12, 3),
          generateChartSeries("LIST", 25, 8),
          generateChartSeries("WATCH", 5, 2),
          generateChartSeries("POST", 18, 5),
        ],
        latencyByInstance: [
          generateChartSeries("apiserver-1", 15, 4),
          generateChartSeries("apiserver-2", 18, 5),
          generateChartSeries("apiserver-3", 22, 6),
        ],
        errorsByInstance: [
          generateChartSeries("apiserver-1", 0.2, 0.1),
          generateChartSeries("apiserver-2", 0.3, 0.15),
          generateChartSeries("apiserver-3", 0.1, 0.05),
        ],
        errorsByVerb: [
          generateChartSeries("GET", 0.1, 0.05),
          generateChartSeries("POST", 0.2, 0.1),
          generateChartSeries("DELETE", 0.05, 0.02),
        ],
        workQueue: [
          generateChartSeries("apiserver-1", 2, 1),
          generateChartSeries("apiserver-2", 3, 1.5),
          generateChartSeries("apiserver-3", 1.5, 0.8),
        ],
        cpuUsage: [
          generateChartSeries("apiserver-1", 0.35, 0.08),
          generateChartSeries("apiserver-2", 0.42, 0.1),
          generateChartSeries("apiserver-3", 0.28, 0.06),
        ],
        memoryUsage: [
          generateChartSeries("apiserver-1", 1.2, 0.15),
          generateChartSeries("apiserver-2", 1.5, 0.2),
          generateChartSeries("apiserver-3", 1.1, 0.12),
        ],
        requestsStacked: [
          generateChartSeries("apiserver-1", 50, 8),
          generateChartSeries("apiserver-2", 45, 7),
          generateChartSeries("apiserver-3", 40, 6),
        ],
        totalRequestsPerSec: 142.3,
        avgLatencyMs: 18.7,
        errorRatePercent: 0.3,
        instanceCount: 3,
      };
    }
    return await iamClient.get<ApiServerMetricsResponse>(
      k8sPath(COLLECTOR_ENDPOINTS.KUBERNETES_API_SERVER),
      { params: { interval } },
    );
  },

  async getCoreDnsMetrics(interval = "1h"): Promise<CoreDnsMetricsResponse> {
    if (config.useMock) {
      return {
        healthStatus: 1,
        requestsPerSec: [
          generateChartSeries("udp://.:53", 800, 100),
          generateChartSeries("tcp://.:53", 200, 30),
        ],
        responsesByRcode: [
          generateChartSeries("NOERROR", 950, 80),
          generateChartSeries("NXDOMAIN", 40, 10),
          generateChartSeries("SERVFAIL", 5, 2),
        ],
        durationP99: [
          generateChartSeries("p99", 2.5, 0.8),
          generateChartSeries("p95", 1.2, 0.4),
          generateChartSeries("p50", 0.3, 0.1),
        ],
        cacheHitsMisses: [
          generateChartSeries("Hits", 780, 50),
          generateChartSeries("Misses", 220, 30),
        ],
        errorRate: [
          generateChartSeries("SERVFAIL", 3, 1.5),
          generateChartSeries("REFUSED", 1, 0.5),
        ],
        upstreamRequests: [
          generateChartSeries("upstream-1", 150, 20),
          generateChartSeries("upstream-2", 80, 15),
        ],
        cpuUsage: [
          generateChartSeries("coredns-1", 0.08, 0.02),
          generateChartSeries("coredns-2", 0.06, 0.015),
        ],
        memoryUsage: [
          generateChartSeries("coredns-1", 0.12, 0.02),
          generateChartSeries("coredns-2", 0.1, 0.015),
        ],
        totalRequestsPerSec: 1240,
        cacheHitRatePercent: 78.4,
        avgDurationMs: 1.2,
        podCount: 2,
      };
    }
    return await iamClient.get<CoreDnsMetricsResponse>(
      k8sPath(COLLECTOR_ENDPOINTS.KUBERNETES_COREDNS),
      { params: { interval } },
    );
  },

  async getClusterLogs(
    clusterId: string,
    params: PodLogsParams = {},
  ): Promise<PodLogsResponse> {
    if (config.useMock) {
      const mockLines: PodLogLine[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 5000).toISOString(),
        namespace: params.namespace ?? "default",
        podName: params.pod ?? "mock-pod-abc123",
        containerName: params.container ?? "app",
        nodeName: "node-1",
        deploymentName: params.deployment ?? "mock-deployment",
        logLine: `[INFO] ${new Date(Date.now() - i * 5000).toISOString()} mock log line ${i + 1} from container`,
      }));
      return {
        logs: mockLines,
        total: mockLines.length,
        from: params.from ?? "",
        to: params.to ?? "",
      };
    }
    return await iamClient.get<PodLogsResponse>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.logs(clusterId)),
      { params },
    );
  },

  // ── Detail/Describe endpoints ─────────────────────────────────────────────

  /**
   * Get Pod describe-level detail with related events.
   */
  async getPodDetail(clusterId: string, podId: string): Promise<any> {
    return iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.podDetail(clusterId, podId)),
    );
  },

  /**
   * Get Node describe-level detail with related events.
   */
  async getNodeDetail(clusterId: string, nodeId: string): Promise<any> {
    return iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.nodeDetail(clusterId, nodeId)),
    );
  },

  /**
   * Get Service describe-level detail with related events.
   */
  async getServiceDetail(clusterId: string, serviceId: string): Promise<any> {
    return iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.serviceDetail(clusterId, serviceId)),
    );
  },

  /**
   * Get Ingress describe-level detail with related events.
   */
  async getIngressDetail(clusterId: string, ingressId: string): Promise<any> {
    return iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.ingressDetail(clusterId, ingressId)),
    );
  },

  // ── Agent Proxy: Live Pod Logs ───────────────────────────────────────────

  /**
   * Fetch pod logs via agent proxy (one-shot, non-streaming).
   * Returns raw log lines from the Kubernetes API (like kubectl logs).
   */
  async getPodLogsViaAgent(
    clusterId: string,
    namespace: string,
    podName: string,
    params: AgentPodLogStreamParams = {},
  ): Promise<PodLogLine[]> {
    if (config.useMock) {
      return Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3000).toISOString(),
        namespace,
        podName,
        containerName: params.container ?? "app",
        nodeName: "",
        deploymentName: "",
        logLine: `[INFO] mock agent log line ${i + 1}`,
      }));
    }
    const qp: Record<string, string> = {};
    if (params.container) qp.container = params.container;
    if (params.tailLines) qp.tailLines = String(params.tailLines);
    if (params.sinceSeconds) qp.sinceSeconds = String(params.sinceSeconds);
    if (params.previous) qp.previous = "true";
    // Non-streaming: follow=false (default)
    const data = await iamClient.get<any>(
      k8sPath(K8S_CLUSTER_ENDPOINTS.podLogStream(clusterId, namespace, podName)),
      { params: qp },
    );
    // Agent returns { lines: string[] } or string[] or plain text
    const lines: string[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.lines)
        ? data.lines
        : typeof data === "string"
          ? data.split("\n").filter(Boolean)
          : [];
    return lines.map((line) => {
      // Try to extract timestamp from line (format: 2026-03-23T14:47:29.123Z ...)
      const tsMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s+(.*)/);
      return {
        timestamp: tsMatch?.[1] ?? new Date().toISOString(),
        namespace,
        podName,
        containerName: params.container ?? "",
        nodeName: "",
        deploymentName: "",
        logLine: tsMatch?.[2] ?? line,
      };
    });
  },

  /**
   * Build the SSE URL for streaming pod logs via agent proxy.
   * Returns a full URL suitable for EventSource.
   */
  getPodLogStreamUrl(
    clusterId: string,
    namespace: string,
    podName: string,
    params: AgentPodLogStreamParams = {},
  ): string {
    const base = (config.iamApiUrl || "") +
      K8S_CLUSTER_ENDPOINTS.podLogStream(clusterId, namespace, podName);
    const qp = new URLSearchParams();
    qp.set("follow", "true");
    qp.set("timestamps", "true");
    if (params.container) qp.set("container", params.container);
    if (params.tailLines) qp.set("tailLines", String(params.tailLines));
    if (params.sinceSeconds) qp.set("sinceSeconds", String(params.sinceSeconds));
    return `${base}?${qp.toString()}`;
  },
};

export default kubernetesApi;
