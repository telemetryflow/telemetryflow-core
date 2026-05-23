/**
 * useKubernetesData.mock.ts - Mock data generator for Kubernetes observability
 *
 * ONLY used when TELEMETRYFLOW_USE_MOCK=true in .env
 * Generates realistic fake K8s cluster/node/pod data for development/demo.
 *
 * Separated from useKubernetesData.ts to ensure zero mock contamination
 * in real data mode (TELEMETRYFLOW_USE_MOCK=false).
 */

import { computed, ref, watch } from "vue";
import {
  K8S_REGIONS,
  K8S_CLUSTERS,
  K8S_ALL_CLUSTERS,
  kubernetesMock,
} from "@/mocks/kubernetes";
import type {
  K8sOverviewData,
  K8sStatCard,
  K8sClusterConfig,
  TimeSeriesData,
  K8sRegionId,
} from "./useKubernetesData";

// Default fallback namespaces (used when cluster doesn't have specific namespaces)
const DEFAULT_NAMESPACES = ["kube-system", "monitoring", "default"];

// Base multipliers for different environments
const ENV_MULTIPLIERS: Record<string, number> = {
  production: 1.0,
  staging: 0.6,
  development: 0.3,
};

// Colors for charts
const CHART_COLORS = [
  "#ef4444", // red
  "#22c55e", // green
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#f97316", // orange
  "#3b82f6", // blue
  "#ec4899", // pink
  "#eab308", // yellow
  "#14b8a6", // teal
];

/**
 * Round a number to specified decimal places (default 2)
 * Handles floating point precision issues
 */
function round(value: number, decimals: number = 2): number {
  return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
}

/**
 * Generate time series data points
 */
function generateTimeSeriesData(
  baseValue: number,
  variance: number,
  points: number = 60,
  intervalMinutes: number = 1,
  addSpikes: boolean = true,
): Array<[number, number]> {
  const now = Date.now();
  const data: Array<[number, number]> = [];

  for (let i = points; i >= 0; i--) {
    const timestamp = now - i * intervalMinutes * 60000;
    let value = baseValue + (Math.random() - 0.5) * variance * 2;

    // Add occasional spikes
    if (addSpikes && Math.random() > 0.92) {
      value += Math.random() * variance * 3;
    }

    data.push([timestamp, Math.max(0, value)]);
  }

  return data;
}

/**
 * Generate stacked area data for pods
 */
function generateStackedPodsData(points: number = 60): {
  total: Array<[number, number]>;
  burstable: Array<[number, number]>;
  bestEffort: Array<[number, number]>;
  guaranteed: Array<[number, number]>;
} {
  const now = Date.now();
  const total: Array<[number, number]> = [];
  const burstable: Array<[number, number]> = [];
  const bestEffort: Array<[number, number]> = [];
  const guaranteed: Array<[number, number]> = [];

  for (let i = points; i >= 0; i--) {
    const timestamp = now - i * 60000;
    const guaranteedVal = 11;
    const bestEffortVal = 45;
    const burstableVal = 59;
    const totalVal = 115;

    total.push([timestamp, totalVal]);
    burstable.push([timestamp, burstableVal]);
    bestEffort.push([timestamp, bestEffortVal]);
    guaranteed.push([timestamp, guaranteedVal]);
  }

  return { total, burstable, bestEffort, guaranteed };
}

/**
 * Composable for Kubernetes mock data
 * Supports hierarchical filtering by region and cluster
 */
export function mockKubernetesData() {
  const refreshKey = ref(0);

  // =============================================
  // Region and Cluster Selection State
  // =============================================

  // Available regions (static)
  const regions = K8S_REGIONS;

  // Selected region (default to first region)
  const selectedRegionId = ref<K8sRegionId>("us-west-2");

  // Available clusters for selected region
  const availableClusters = computed<K8sClusterConfig[]>(() => {
    return K8S_CLUSTERS[selectedRegionId.value] || [];
  });

  // Selected cluster (default to first cluster in region)
  const selectedClusterId = ref<string>("usw2-prod-01");

  // Selected cluster config
  const selectedCluster = computed<K8sClusterConfig | undefined>(() => {
    return K8S_ALL_CLUSTERS.find((c) => c.id === selectedClusterId.value);
  });

  // Available namespaces for selected cluster
  const availableNamespaces = computed<string[]>(() => {
    return selectedCluster.value?.namespaces || [];
  });

  // Auto-select first cluster when region changes
  watch(selectedRegionId, (newRegion) => {
    const clusters = K8S_CLUSTERS[newRegion];
    if (clusters && clusters.length > 0) {
      selectedClusterId.value = clusters[0].id;
    }
  });

  // =============================================
  // Dynamic Namespaces and Node Names (from cluster)
  // =============================================

  // Get actual namespaces from selected cluster
  const clusterNamespaces = computed<string[]>(() => {
    return selectedCluster.value?.namespaces || DEFAULT_NAMESPACES;
  });

  // Get actual node names from selected cluster
  const clusterNodeNames = computed<string[]>(() => {
    const nodes = kubernetesMock.getNodes(selectedClusterId.value);
    return nodes.map((n) => n.name);
  });

  // Get environment multiplier for scaling values
  const envMultiplier = computed<number>(() => {
    const env = selectedCluster.value?.environment || "production";
    return ENV_MULTIPLIERS[env] || 1.0;
  });

  // Get cluster status for varying data patterns
  const clusterStatus = computed<string>(() => {
    return selectedCluster.value?.status || "healthy";
  });

  // =============================================
  // Cluster Data Generation (from kubernetesMock)
  // =============================================

  // Get cluster overview from mock generator
  const clusterOverview = computed(() => {
    void refreshKey.value;
    return kubernetesMock.getClusterOverview(selectedClusterId.value);
  });

  // Overview Stats (transformed from clusterOverview)
  const overviewData = computed<K8sOverviewData>(() => {
    void refreshKey.value;
    const overview = clusterOverview.value;
    const cluster = selectedCluster.value;

    // Calculate total CPU/Memory from nodes
    const nodes = kubernetesMock.getNodes(selectedClusterId.value);
    const totalCpu = nodes.reduce(
      (acc, n) => acc + parseFloat(n.cpu.capacity),
      0,
    );
    const totalMemory = nodes.reduce(
      (acc, n) => acc + parseFloat(n.memory.capacity),
      0,
    );
    const usedCpu = nodes.reduce((acc, n) => acc + parseFloat(n.cpu.used), 0);
    const usedMemory = nodes.reduce(
      (acc, n) => acc + parseFloat(n.memory.used),
      0,
    );

    // Resource counts scaled by cluster size
    const scaleFactor = nodes.length / 6; // Normalize to 6 nodes

    return {
      clusterInfo: {
        name: cluster?.displayName || overview.cluster.name,
        version: `v${overview.cluster.version}`,
        platform: "linux/amd64",
        region: overview.cluster.region,
        provider: `AWS ${overview.cluster.provider.toUpperCase()}`,
        apiServerUrl: `https://${overview.cluster.name}.${overview.cluster.region}.eks.amazonaws.com:6443`,
        createdAt: "2024-06-15T10:30:00Z",
        environment: cluster?.environment,
        clusterId: cluster?.id,
      },
      cpuUsage: {
        real: round(usedCpu),
        requests: round(usedCpu * 1.5),
        limits: round(usedCpu * 2),
        total: round(totalCpu),
      },
      ramUsage: {
        real: round(usedMemory),
        requests: round(usedMemory * 1.2),
        limits: round(usedMemory * 1.5),
        total: round(totalMemory),
      },
      nodes: overview.resources.nodes.total,
      namespaces: overview.resources.namespaces.total,
      runningPods: overview.resources.pods.running,
      services: overview.resources.services.total,
      deployments: overview.resources.deployments.total,
      resourceCounts: [
        {
          name: "Secrets",
          value: Math.round(175 * scaleFactor),
          color: "#a855f7",
        },
        {
          name: "Configmaps",
          value: Math.round(44 * scaleFactor),
          color: "#22c55e",
        },
        {
          name: "Endpoints",
          value: Math.round(25 * scaleFactor),
          color: "#f97316",
        },
        {
          name: "Services",
          value: overview.resources.services.total,
          color: "#3b82f6",
        },
        {
          name: "Running Containers",
          value: Math.round(overview.resources.pods.running * 1.1),
          color: "#22c55e",
        },
        {
          name: "Running Pods",
          value: overview.resources.pods.running,
          color: "#84cc16",
        },
        {
          name: "Ingresses",
          value: Math.round(8 * scaleFactor),
          color: "#ef4444",
        },
        {
          name: "Persistent Volume Claims",
          value: Math.round(3 * scaleFactor),
          color: "#06b6d4",
        },
        {
          name: "Nodes",
          value: overview.resources.nodes.total,
          color: "#22c55e",
        },
      ],
    };
  });

  // CPU Usage percentages (rounded to 2 decimal places)
  const cpuUsagePercentages = computed(() => {
    const data = overviewData.value.cpuUsage;
    return {
      real: round((data.real / data.total) * 100),
      requests: round((data.requests / data.total) * 100),
      limits: round((data.limits / data.total) * 100),
    };
  });

  // Memory Usage percentages (rounded to 2 decimal places)
  const ramUsagePercentages = computed(() => {
    const data = overviewData.value.ramUsage;
    return {
      real: round((data.real / data.total) * 100),
      requests: round((data.requests / data.total) * 100),
      limits: round((data.limits / data.total) * 100),
    };
  });

  // Resource count time series for the legend chart
  const resourceCountTimeSeries = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const resources = overviewData.value.resourceCounts;

    return resources.map((resource) => ({
      name: resource.name,
      color: resource.color,
      data: generateTimeSeriesData(
        resource.value,
        resource.value * 0.02,
        60,
        1,
        false,
      ),
    }));
  });

  // Cluster CPU Utilization
  const clusterCpuUtilization = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    return [
      {
        name: "CPU %",
        data: generateTimeSeriesData(5.5, 1.5, 60, 1),
        color: "#22c55e",
      },
    ];
  });

  // Cluster Memory Utilization
  const clusterMemoryUtilization = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    return [
      {
        name: "Memory %",
        data: generateTimeSeriesData(34.8, 0.5, 60, 1),
        color: "#eab308",
      },
    ];
  });

  // CPU Utilization by Namespace (uses actual cluster namespaces)
  const cpuByNamespace = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const namespaces = clusterNamespaces.value;
    const multiplier = envMultiplier.value;
    const isDegraded = clusterStatus.value === "degraded";

    // Generate base values dynamically based on namespace type
    return namespaces.map((ns: string, index: number) => {
      let baseValue = 0.05;
      if (ns.includes("ecommerce") || ns === "production")
        baseValue = 0.18 * multiplier;
      else if (ns === "monitoring") baseValue = 0.12 * multiplier;
      else if (ns === "istio-system") baseValue = 0.08 * multiplier;
      else if (ns === "kube-system") baseValue = 0.15 * multiplier;
      else if (ns === "logging") baseValue = 0.06 * multiplier;

      // Degraded clusters have more variance
      const variance = isDegraded ? 0.15 : 0.08;

      return {
        name: ns,
        color: CHART_COLORS[index % CHART_COLORS.length],
        data: generateTimeSeriesData(baseValue, variance, 60, 1, isDegraded),
      };
    });
  });

  // Memory Utilization by Namespace (uses actual cluster namespaces)
  const memoryByNamespace = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const namespaces = clusterNamespaces.value;
    const multiplier = envMultiplier.value;
    const isDegraded = clusterStatus.value === "degraded";

    return namespaces.map((ns: string, index: number) => {
      let baseValue = 0.2;
      if (ns.includes("ecommerce") || ns === "production")
        baseValue = 1.8 * multiplier;
      else if (ns === "monitoring") baseValue = 1.2 * multiplier;
      else if (ns === "istio-system") baseValue = 0.8 * multiplier;
      else if (ns === "kube-system") baseValue = 1.0 * multiplier;
      else if (ns === "logging") baseValue = 0.5 * multiplier;

      const variance = isDegraded ? 0.5 : 0.3;

      return {
        name: ns,
        color: CHART_COLORS[index % CHART_COLORS.length],
        data: generateTimeSeriesData(baseValue, variance, 60, 1, isDegraded),
      };
    });
  });

  // CPU Utilization by Instance (uses actual cluster nodes)
  const cpuByInstance = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const nodeNames = clusterNodeNames.value;
    const isDegraded = clusterStatus.value === "degraded";

    return nodeNames.map((instance: string, index: number) => {
      // Vary base value by node position (simulate different workloads)
      const baseValue = 8 + Math.sin(index * 1.5) * 5 + Math.random() * 3;
      const variance = isDegraded ? 5 : 3;

      return {
        name: instance,
        color: CHART_COLORS[index % CHART_COLORS.length],
        data: generateTimeSeriesData(baseValue, variance, 60, 1, isDegraded),
      };
    });
  });

  // Memory Utilization by Instance (uses actual cluster nodes)
  const memoryByInstance = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const nodeNames = clusterNodeNames.value;
    const isDegraded = clusterStatus.value === "degraded";

    return nodeNames.map((instance: string, index: number) => {
      // Vary base value by node position
      const baseValue = 1.5 + Math.cos(index * 1.2) * 0.8 + Math.random() * 0.5;
      const variance = isDegraded ? 0.4 : 0.2;

      return {
        name: instance,
        color: CHART_COLORS[index % CHART_COLORS.length],
        data: generateTimeSeriesData(baseValue, variance, 60, 1, isDegraded),
      };
    });
  });

  // CPU Throttled by Namespace (throttling %)
  const cpuThrottledByNamespace = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const namespaces = clusterNamespaces.value;

    return namespaces.map((ns: string, index: number) => {
      // High-traffic namespaces have more throttling
      let baseValue = 5;
      if (ns === "production" || ns.includes("ecommerce")) baseValue = 35;
      else if (ns === "staging") baseValue = 20;
      else if (ns === "monitoring") baseValue = 15;
      else if (ns === "kube-system") baseValue = 8;

      return {
        name: ns,
        color: CHART_COLORS[index % CHART_COLORS.length],
        data: generateTimeSeriesData(baseValue, baseValue * 0.25, 60, 1),
      };
    });
  });

  // CPU Throttled by Instance (throttling % per node)
  const cpuThrottledByInstance = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const nodeNames = clusterNodeNames.value;
    const isDegraded = clusterStatus.value === "degraded";

    return nodeNames.map((instance: string, index: number) => {
      const baseValue = isDegraded
        ? 40 + Math.sin(index * 1.1) * 15
        : 15 + Math.cos(index * 1.3) * 8;

      return {
        name: instance,
        color: CHART_COLORS[index % CHART_COLORS.length],
        data: generateTimeSeriesData(
          baseValue,
          baseValue * 0.2,
          60,
          1,
          isDegraded,
        ),
      };
    });
  });

  // OOM Events by Namespace (event count over time)
  const oomEventsByNamespace = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const oomNamespaces = ["production", "staging", "monitoring"];

    return oomNamespaces.map((ns, index) => {
      const baseValue = index === 0 ? 3 : index === 1 ? 1 : 0.5;
      return {
        name: ns,
        color: index === 0 ? "#ef4444" : index === 1 ? "#f97316" : "#eab308",
        data: generateTimeSeriesData(baseValue, baseValue * 0.6, 60, 1, false),
      };
    });
  });

  // Kubernetes Pods QoS Classes
  const podsQoSData = computed(() => {
    void refreshKey.value;
    const data = generateStackedPodsData();

    return [
      { name: "Total pods", data: data.total, color: "#ef4444" },
      { name: "Burstable pods", data: data.burstable, color: "#f97316" },
      { name: "BestEffort pods", data: data.bestEffort, color: "#84cc16" },
      { name: "Guaranteed pods", data: data.guaranteed, color: "#3b82f6" },
    ];
  });

  // Kubernetes Pods Status Reason
  const podsStatusReason = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const statuses = [
      "Evicted",
      "NodeAffinity",
      "NodeLost",
      "Shutdown",
      "UnexpectedAdmissionError",
    ];
    const colors = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#a855f7"];

    return statuses.map((status, index) => ({
      name: status,
      color: colors[index],
      data: generateTimeSeriesData(0, 0.1, 60, 1, false), // All zeros for healthy cluster
    }));
  });

  // Container Restarts by Namespace
  const containerRestarts = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    return [
      {
        name: "staging",
        color: "#22c55e",
        data: generateTimeSeriesData(2, 0.3, 60, 1, false),
      },
      {
        name: "monitoring",
        color: "#f97316",
        data: generateTimeSeriesData(2, 0.3, 60, 1, false),
      },
    ];
  });

  // Network Utilization by Device
  const networkByDevice = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const devices = ["eth0", "cni0", "veth0", "docker0", "flannel.1"];
    const baseValues = [256, 128, 64, 32, 16];

    return devices.map((device, index) => ({
      name: device,
      color: CHART_COLORS[index % CHART_COLORS.length],
      data: generateTimeSeriesData(
        baseValues[index],
        baseValues[index] * 0.5,
        60,
        1,
      ),
    }));
  });

  // Network Packets Dropped
  const networkPacketsDropped = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    return [
      {
        name: "Dropped",
        color: "#eab308",
        data: generateTimeSeriesData(0, 1, 60, 1, false),
      },
    ];
  });

  // Network Received by Namespace (uses actual cluster namespaces)
  const networkByNamespace = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const namespaces = clusterNamespaces.value;
    const multiplier = envMultiplier.value;

    return namespaces.map((ns: string, index: number) => {
      // Vary base value by namespace type
      let baseValue = 32;
      if (ns.includes("ecommerce") || ns === "production")
        baseValue = 1024 * multiplier;
      else if (ns === "monitoring") baseValue = 512 * multiplier;
      else if (ns === "istio-system") baseValue = 256 * multiplier;
      else if (ns === "kube-system") baseValue = 128 * multiplier;

      return {
        name: ns,
        color: CHART_COLORS[index % CHART_COLORS.length],
        data: generateTimeSeriesData(baseValue, baseValue * 0.3, 60, 1),
      };
    });
  });

  // Network Received by Instance (uses actual cluster nodes)
  const networkByInstance = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const nodeNames = clusterNodeNames.value;

    return nodeNames.map((instance: string, index: number) => {
      const baseValue = 256 + Math.sin(index * 0.8) * 150 + Math.random() * 100;

      return {
        name: instance,
        color: CHART_COLORS[index % CHART_COLORS.length],
        data: generateTimeSeriesData(baseValue, baseValue * 0.3, 60, 1),
      };
    });
  });

  // Network Received by Instance - Production Nodes Only
  const networkByInstanceK8sProd = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const nodeNames = clusterNodeNames.value;
    // Filter to get a subset (first half) as "prod" nodes
    const prodNodes = nodeNames.slice(
      0,
      Math.max(1, Math.ceil(nodeNames.length / 2)),
    );

    return prodNodes.map((instance: string, index: number) => {
      const baseValue = 300 + Math.cos(index * 0.9) * 180 + Math.random() * 80;

      return {
        name: instance,
        color: CHART_COLORS[index % CHART_COLORS.length],
        data: generateTimeSeriesData(baseValue, baseValue * 0.3, 60, 1),
      };
    });
  });

  // HPA replicas time series (current vs desired per HPA)
  const hpaTimeSeries = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const hpaNames = ["app-hpa", "api-hpa", "worker-hpa"];
    return hpaNames.flatMap((name, i) => [
      {
        name: `${name} (current)`,
        color: CHART_COLORS[(i * 2) % CHART_COLORS.length],
        data: generateTimeSeriesData(3 + i, 1, 60, 1),
      },
      {
        name: `${name} (desired)`,
        color: CHART_COLORS[(i * 2 + 1) % CHART_COLORS.length],
        data: generateTimeSeriesData(3 + i, 0.5, 60, 1),
      },
    ]);
  });

  const hpaTotalCount = computed<number>(() => 3);

  // PDB disruptions allowed time series
  const pdbTimeSeries = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const pdbNames = ["app-pdb", "api-pdb"];
    return pdbNames.map((name, i) => ({
      name,
      color: CHART_COLORS[i % CHART_COLORS.length],
      data: generateTimeSeriesData(1 + i, 0.2, 60, 1),
    }));
  });

  const pdbTotalDisruptionsAllowed = computed<number>(() => 3);

  // Memory working set by pod (MiB)
  const memoryWorkingSetByPod = computed<TimeSeriesData[]>(() => {
    void refreshKey.value;
    const pods = ["nginx-abc123", "api-def456", "worker-ghi789", "db-jkl012"];
    return pods.map((pod, i) => ({
      name: pod,
      color: CHART_COLORS[i % CHART_COLORS.length],
      data: generateTimeSeriesData(200 + i * 80, 30, 60, 1),
    }));
  });

  // Kubernetes Overview Stat Cards
  const k8sStatCards = computed<K8sStatCard[]>(() => {
    void refreshKey.value;
    const data = overviewData.value;
    const clusters = availableClusters.value;
    const cluster = clusterOverview.value;
    const readyNodes = cluster.resources.nodes.ready;
    const totalPods = cluster.resources.pods.total;
    return [
      {
        title: "Clusters",
        value: clusters.length,
        icon: "carbon:kubernetes",
        color: "primary" as const,
        trend: "stable" as const,
      },
      {
        title: "Nodes",
        value: data.nodes,
        unit: `${readyNodes} ready`,
        icon: "carbon:bare-metal-server",
        color: data.nodes === readyNodes ? ("success" as const) : ("warning" as const),
        trend: "stable" as const,
      },
      {
        title: "Running Pods",
        value: data.runningPods,
        unit: `of ${totalPods}`,
        icon: "carbon:cube",
        color: data.runningPods > 0 ? ("success" as const) : ("warning" as const),
        trend: "stable" as const,
      },
      {
        title: "Deployments",
        value: data.deployments,
        icon: "carbon:deploy",
        color: "info" as const,
        trend: "stable" as const,
      },
      {
        title: "Autoscalers",
        value: 3,
        icon: "carbon:scale",
        color: "success" as const,
        trend: "stable" as const,
      },
      {
        title: "PDB Disruptions",
        value: 2,
        icon: "carbon:warning-alt",
        color: "success" as const,
        trend: "stable" as const,
      },
      {
        title: "Namespaces",
        value: data.namespaces,
        icon: "carbon:folder",
        color: "info" as const,
        trend: "stable" as const,
      },
      {
        title: "Services",
        value: data.services,
        icon: "carbon:connection-signal",
        color: "primary" as const,
        trend: "stable" as const,
      },
    ];
  });

  // Refresh data
  const refreshData = () => {
    refreshKey.value++;
  };

  // Set region
  const setRegion = (regionId: K8sRegionId) => {
    selectedRegionId.value = regionId;
    refreshKey.value++;
  };

  // Set cluster
  const setCluster = (clusterId: string) => {
    selectedClusterId.value = clusterId;
    refreshKey.value++;
  };

  return {
    // Region & Cluster Selection (cascading filters)
    regions,
    selectedRegionId,
    availableClusters,
    selectedClusterId,
    selectedCluster,
    availableNamespaces,

    // Overview
    overviewData,
    clusterOverview,
    k8sStatCards,
    cpuUsagePercentages,
    ramUsagePercentages,
    resourceCountTimeSeries,

    // Cluster utilization
    clusterCpuUtilization,
    clusterMemoryUtilization,

    // By namespace
    cpuByNamespace,
    memoryByNamespace,

    // By instance
    cpuByInstance,
    memoryByInstance,

    // CPU throttling & OOM
    cpuThrottledByNamespace,
    cpuThrottledByInstance,
    oomEventsByNamespace,

    // Kubernetes pods
    podsQoSData,
    podsStatusReason,
    containerRestarts,

    // Network
    networkByDevice,
    networkPacketsDropped,
    networkByNamespace,
    networkByInstance,
    networkByInstanceK8sProd,

    // HPA / PDB
    hpaTimeSeries,
    hpaTotalCount,
    pdbTimeSeries,
    pdbTotalDisruptionsAllowed,
    memoryWorkingSetByPod,

    // Actions
    refreshData,
    setRegion,
    setCluster,
  };
}

export default mockKubernetesData;
