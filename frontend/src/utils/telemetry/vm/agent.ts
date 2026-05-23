/**
 * VM/Agent Telemetry Utilities
 * Agent monitoring for K8s nodes and regular VMs
 * Migrated from src/mocks/agent.ts
 */

import type {
  AgentInfo,
  AgentSystemInfo,
  AgentHostMetrics,
  AgentHostContext,
} from "@/types/agent";
import {
  K8S_ALL_CLUSTERS,
  K8S_NODES_BY_CLUSTER,
  type K8sClusterConfig,
  type K8sNodeConfig,
} from "../kubernetes/cluster";
// Temporary: use from shared until we migrate these to common/generator
import { randomBetween } from "@/mocks/shared";

// ============================================
// Constants
// ============================================

const AGENT_VERSIONS = [
  "1.1.2",
  "1.1.3",
  "1.1.4",
  "1.1.5",
  "1.1.6",
  "1.1.7",
  "1.1.8",
  "1.1.9",
  "1.1.10",
  "1.2.0",
];

const CPU_MODELS: Record<string, string> = {
  aws: "Intel(R) Xeon(R) Platinum 8375C CPU @ 2.90GHz",
  gcp: "Intel(R) Xeon(R) CPU @ 2.80GHz",
  azure: "Intel(R) Xeon(R) Platinum 8272CL CPU @ 2.60GHz",
};

const PLATFORM_BY_PROVIDER: Record<
  string,
  {
    os: string;
    platform: string;
    platformFamily: string;
    platformVersion: string;
  }
> = {
  aws: {
    os: "linux",
    platform: "Amazon Linux",
    platformFamily: "rhel",
    platformVersion: "2023",
  },
  gcp: {
    os: "linux",
    platform: "Container-Optimized OS",
    platformFamily: "cos",
    platformVersion: "109",
  },
  azure: {
    os: "linux",
    platform: "Ubuntu",
    platformFamily: "debian",
    platformVersion: "22.04",
  },
};

// ============================================
// Helper Functions
// ============================================

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function randomFloat(min: number, max: number): number {
  return randomBetween(min, max);
}

/**
 * Determine agent status based on cluster health
 */
function getAgentStatus(
  cluster: K8sClusterConfig,
): "online" | "offline" | "warning" {
  if (cluster.status === "degraded") {
    return Math.random() > 0.7 ? "warning" : "online";
  }
  if (cluster.status === "critical") {
    const rand = Math.random();
    if (rand > 0.8) return "offline";
    if (rand > 0.5) return "warning";
    return "online";
  }
  // Healthy cluster - mostly online
  return Math.random() > 0.95 ? "warning" : "online";
}

// ============================================
// K8s Node Agent Generation
// ============================================

/**
 * Generate system info for an agent running on a K8s node
 */
function generateK8sNodeSystemInfo(
  node: K8sNodeConfig,
  cluster: K8sClusterConfig,
): AgentSystemInfo {
  const provider =
    cluster.provider === "eks"
      ? "aws"
      : cluster.provider === "gke"
        ? "gcp"
        : "azure";
  const platformInfo = PLATFORM_BY_PROVIDER[provider];

  return {
    hostname: node.name,
    os: platformInfo.os,
    platform: platformInfo.platform,
    platformFamily: platformInfo.platformFamily,
    platformVersion: platformInfo.platformVersion,
    kernelVersion: "5.15.0-1052-aws",
    kernelArch: "x86_64",
    virtualizationSystem:
      cluster.provider === "eks"
        ? "nitro"
        : cluster.provider === "gke"
          ? "kvm"
          : "hyperv",
    virtualizationRole: "guest",
    hostId: `${cluster.id}-${node.name.slice(-8)}`,
    uptime: randomInt(86400, 2592000), // 1-30 days
    bootTime: Date.now() - randomInt(86400000, 2592000000),
    procs: randomInt(150, 400),
    timezone: "UTC",
    timezoneOffset: 0,
  };
}

/**
 * Generate host metrics for an agent running on a K8s node
 */
function generateK8sNodeHostMetrics(
  node: K8sNodeConfig,
  cluster: K8sClusterConfig,
): AgentHostMetrics {
  const provider =
    cluster.provider === "eks"
      ? "aws"
      : cluster.provider === "gke"
        ? "gcp"
        : "azure";
  const cpuModel = CPU_MODELS[provider];

  const memoryTotal = node.memory * 1024 * 1024 * 1024; // GB to bytes
  const memoryUsed = memoryTotal * randomFloat(0.4, 0.85);
  const diskTotal = 100 * 1024 * 1024 * 1024; // 100 GB
  const diskUsed = diskTotal * randomFloat(0.3, 0.7);

  return {
    cpu: {
      usage: randomFloat(20, 80),
      cores: node.cpu,
      threads: node.cpu * 2,
      model: cpuModel,
      frequency: 2800,
    },
    memory: {
      total: memoryTotal,
      used: memoryUsed,
      free: memoryTotal - memoryUsed,
      available: memoryTotal - memoryUsed + randomInt(0, 1024 * 1024 * 1024),
      usedPercent: (memoryUsed / memoryTotal) * 100,
    },
    disk: [
      {
        path: "/",
        total: diskTotal,
        used: diskUsed,
        free: diskTotal - diskUsed,
        usedPercent: (diskUsed / diskTotal) * 100,
      },
      {
        path: "/var/lib/kubelet",
        total: 200 * 1024 * 1024 * 1024,
        used: randomFloat(50, 150) * 1024 * 1024 * 1024,
        free: randomFloat(50, 150) * 1024 * 1024 * 1024,
        usedPercent: randomFloat(25, 75),
      },
    ],
    network: [
      {
        interface: "eth0",
        bytesRecv: randomInt(5000000000, 50000000000),
        bytesSent: randomInt(5000000000, 50000000000),
        packetsRecv: randomInt(5000000, 50000000),
        packetsSent: randomInt(5000000, 50000000),
        errIn: randomInt(0, 10),
        errOut: randomInt(0, 10),
        dropIn: randomInt(0, 5),
        dropOut: randomInt(0, 5),
      },
      {
        interface: "lo",
        bytesRecv: randomInt(100000000, 1000000000),
        bytesSent: randomInt(100000000, 1000000000),
        packetsRecv: randomInt(100000, 1000000),
        packetsSent: randomInt(100000, 1000000),
        errIn: 0,
        errOut: 0,
        dropIn: 0,
        dropOut: 0,
      },
    ],
  };
}

/**
 * Generate agent for a K8s node
 */
export function generateK8sNodeAgent(
  node: K8sNodeConfig,
  cluster: K8sClusterConfig,
  agentIndex: number,
): AgentInfo {
  const provider =
    cluster.provider === "eks"
      ? "aws"
      : cluster.provider === "gke"
        ? "gcp"
        : "azure";

  const hostContext: AgentHostContext = {
    type: "k8s-node",
    vmId: `k8s-${cluster.id}-${agentIndex}`,
    vmName: node.name,
    provider,
    region: cluster.region,
    instanceType: node.instanceType,
    clusterId: cluster.id,
    clusterName: cluster.displayName,
    zone: node.zone,
    kubeletVersion: cluster.version,
    podsRunning: randomInt(10, 35),
    podsCapacity: 110,
  };

  return {
    id: `agent-k8s-${cluster.id}-${agentIndex}`,
    name: `K8s Node Agent (${node.name.slice(0, 20)}...)`,
    version: AGENT_VERSIONS[randomInt(0, AGENT_VERSIONS.length - 1)],
    status: getAgentStatus(cluster),
    lastSeen: Date.now() - randomInt(0, 180000), // Last 3 minutes
    systemInfo: generateK8sNodeSystemInfo(node, cluster),
    metrics: generateK8sNodeHostMetrics(node, cluster),
    host: hostContext,
  };
}

// ============================================
// Regular VM Agent Generation
// ============================================

/**
 * Generate system info for an agent running on a regular VM
 */
function generateVMSystemInfo(
  vmIndex: number,
  provider: string,
  region: string,
): AgentSystemInfo {
  const platformInfo =
    PLATFORM_BY_PROVIDER[provider] || PLATFORM_BY_PROVIDER.aws;

  return {
    hostname: `${provider}-vm-${vmIndex + 1}.${region}.compute.internal`,
    os: platformInfo.os,
    platform: platformInfo.platform,
    platformFamily: platformInfo.platformFamily,
    platformVersion: platformInfo.platformVersion,
    kernelVersion: "5.15.0-1052",
    kernelArch: "x86_64",
    virtualizationSystem:
      provider === "aws" ? "nitro" : provider === "gcp" ? "kvm" : "hyperv",
    virtualizationRole: "guest",
    hostId: `vm-${region}-${vmIndex}-${randomInt(1000, 9999)}`,
    uptime: randomInt(3600, 2592000),
    bootTime: Date.now() - randomInt(3600000, 2592000000),
    procs: randomInt(100, 300),
    timezone: "UTC",
    timezoneOffset: 0,
  };
}

/**
 * Generate host metrics for a regular VM agent
 */
function generateVMHostMetrics(
  cpuCores: number,
  memoryGB: number,
  provider: string,
): AgentHostMetrics {
  const cpuModel = CPU_MODELS[provider] || CPU_MODELS.aws;
  const memoryTotal = memoryGB * 1024 * 1024 * 1024;
  const memoryUsed = memoryTotal * randomFloat(0.3, 0.85);
  const diskTotal = [50, 100, 200][randomInt(0, 2)] * 1024 * 1024 * 1024;
  const diskUsed = diskTotal * randomFloat(0.2, 0.7);

  return {
    cpu: {
      usage: randomFloat(10, 90),
      cores: cpuCores,
      threads: cpuCores * 2,
      model: cpuModel,
      frequency: 2600,
    },
    memory: {
      total: memoryTotal,
      used: memoryUsed,
      free: memoryTotal - memoryUsed,
      available: memoryTotal - memoryUsed + randomInt(0, 1024 * 1024 * 1024),
      usedPercent: (memoryUsed / memoryTotal) * 100,
    },
    disk: [
      {
        path: "/",
        total: diskTotal,
        used: diskUsed,
        free: diskTotal - diskUsed,
        usedPercent: (diskUsed / diskTotal) * 100,
      },
    ],
    network: [
      {
        interface: "eth0",
        bytesRecv: randomInt(1000000000, 20000000000),
        bytesSent: randomInt(1000000000, 20000000000),
        packetsRecv: randomInt(1000000, 10000000),
        packetsSent: randomInt(1000000, 10000000),
        errIn: randomInt(0, 50),
        errOut: randomInt(0, 50),
        dropIn: randomInt(0, 20),
        dropOut: randomInt(0, 20),
      },
      {
        interface: "lo",
        bytesRecv: randomInt(100000000, 500000000),
        bytesSent: randomInt(100000000, 500000000),
        packetsRecv: randomInt(100000, 500000),
        packetsSent: randomInt(100000, 500000),
        errIn: 0,
        errOut: 0,
        dropIn: 0,
        dropOut: 0,
      },
    ],
  };
}

/**
 * Generate agent for a regular VM (non-K8s)
 */
export function generateVMAgent(vmIndex: number): AgentInfo {
  const providers = ["aws", "gcp", "azure"];
  const provider = providers[randomInt(0, 2)];

  const regions: Record<string, string[]> = {
    aws: ["ap-southeast-3", "ap-southeast-1"],
    gcp: ["asia-southeast1", "asia-southeast2"],
    azure: ["southeastasia", "eastasia"],
  };
  const region = regions[provider][randomInt(0, regions[provider].length - 1)];

  const instanceTypes: Record<string, string[]> = {
    aws: ["t3.medium", "t3.large", "m5.large", "m5.xlarge"],
    gcp: ["n1-standard-2", "n1-standard-4", "e2-medium"],
    azure: ["Standard_B2s", "Standard_D2s_v3", "Standard_D4s_v3"],
  };
  const instanceType =
    instanceTypes[provider][randomInt(0, instanceTypes[provider].length - 1)];

  const cpuCores = [2, 4, 8][randomInt(0, 2)];
  const memoryGB = [4, 8, 16, 32][randomInt(0, 3)];

  // VM agents have slightly higher offline rate
  const statuses: Array<"online" | "offline" | "warning"> = [
    "online",
    "online",
    "online",
    "online",
    "warning",
    "offline",
  ];
  const status = statuses[randomInt(0, statuses.length - 1)];

  const hostContext: AgentHostContext = {
    type: "vm",
    vmId: `vm-${provider}-${vmIndex}`,
    vmName: `${provider}-vm-${vmIndex + 1}`,
    provider,
    region,
    instanceType,
  };

  return {
    id: `agent-vm-${vmIndex}`,
    name: `VM Agent (${provider}-vm-${vmIndex + 1})`,
    version: AGENT_VERSIONS[randomInt(0, AGENT_VERSIONS.length - 1)],
    status,
    lastSeen:
      status === "offline"
        ? Date.now() - randomInt(300000, 3600000) // 5 min - 1 hour ago
        : Date.now() - randomInt(0, 180000), // Last 3 minutes
    systemInfo: generateVMSystemInfo(vmIndex, provider, region),
    metrics: generateVMHostMetrics(cpuCores, memoryGB, provider),
    host: hostContext,
  };
}

// ============================================
// Public API
// ============================================

/**
 * Generate all agents - correlated with K8s nodes and regular VMs
 * @param additionalVMs Number of additional non-K8s VM agents to generate
 */
export function generateAgents(additionalVMs: number = 10): AgentInfo[] {
  const agents: AgentInfo[] = [];
  let agentIndex = 0;

  // Generate agents for all K8s nodes across all clusters
  for (const cluster of K8S_ALL_CLUSTERS) {
    const clusterNodes = K8S_NODES_BY_CLUSTER[cluster.id] || [];

    for (const node of clusterNodes) {
      agents.push(generateK8sNodeAgent(node, cluster, agentIndex));
      agentIndex++;
    }
  }

  // Generate agents for regular VMs (non-K8s)
  for (let i = 0; i < additionalVMs; i++) {
    agents.push(generateVMAgent(i));
  }

  return agents;
}

/**
 * Generate time series data for agent metrics
 */
export function generateAgentTimeSeries(
  duration: number = 3600000,
): Array<[number, number]> {
  const now = Date.now();
  const points: Array<[number, number]> = [];
  const step = 60000; // 1 minute

  for (let t = now - duration; t <= now; t += step) {
    points.push([t, randomFloat(0, 100)]);
  }

  return points;
}

/**
 * Get agent count summary
 */
export function getAgentSummary() {
  const agents = generateAgents(10);

  const k8sAgents = agents.filter((a) => a.host?.type === "k8s-node");
  const vmAgents = agents.filter((a) => a.host?.type === "vm");

  return {
    total: agents.length,
    k8sNodes: k8sAgents.length,
    regularVMs: vmAgents.length,
    online: agents.filter((a) => a.status === "online").length,
    offline: agents.filter((a) => a.status === "offline").length,
    warning: agents.filter((a) => a.status === "warning").length,
  };
}
