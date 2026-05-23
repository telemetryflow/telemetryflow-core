/**
 * Mock data for Infrastructure monitoring
 */

import type { InfraVirtualMachine } from "@/types/agent";
import {
  randomId,
  randomBetween,
  roundTo,
  K8S_ALL_CLUSTERS,
  K8S_NODES_BY_CLUSTER,
} from "./shared";

const PROVIDERS = ["aws", "gcp", "azure"];
const AWS_REGIONS = [
  "ap-southeast-3",
  "ap-southeast-1",
];
const GCP_REGIONS = ["asia-southeast1", "asia-southeast2"];
const AZURE_REGIONS = ["southeastasia", "eastasia"];
const INSTANCE_TYPES = {
  aws: [
    "t3.micro",
    "t3.small",
    "t3.medium",
    "t3.large",
    "m5.large",
    "m5.xlarge",
    "c5.large",
  ],
  gcp: [
    "n1-standard-1",
    "n1-standard-2",
    "n1-standard-4",
    "e2-medium",
    "e2-standard-2",
  ],
  azure: ["Standard_B1s", "Standard_B2s", "Standard_D2s_v3", "Standard_D4s_v3"],
};
const VM_STATUSES: Array<"running" | "stopped" | "pending" | "terminated"> = [
  "running",
  "running",
  "running",
  "running",
  "running",
  "stopped",
  "pending",
];

export function generateVirtualMachine(index: number): InfraVirtualMachine {
  const provider = PROVIDERS[Math.floor(randomBetween(0, PROVIDERS.length))] as
    | "aws"
    | "gcp"
    | "azure";
  let region: string;

  switch (provider) {
    case "aws":
      region = AWS_REGIONS[Math.floor(randomBetween(0, AWS_REGIONS.length))];
      break;
    case "gcp":
      region = GCP_REGIONS[Math.floor(randomBetween(0, GCP_REGIONS.length))];
      break;
    case "azure":
      region =
        AZURE_REGIONS[Math.floor(randomBetween(0, AZURE_REGIONS.length))];
      break;
  }

  const instanceType =
    INSTANCE_TYPES[provider][
      Math.floor(randomBetween(0, INSTANCE_TYPES[provider].length))
    ];
  const status = VM_STATUSES[Math.floor(randomBetween(0, VM_STATUSES.length))];

  const cpuCores = [1, 2, 4, 8, 16][Math.floor(randomBetween(0, 5))];
  const memoryTotal =
    [1, 2, 4, 8, 16, 32, 64][Math.floor(randomBetween(0, 7))] *
    1024 *
    1024 *
    1024; // GB to bytes
  const diskTotal =
    [20, 50, 100, 200, 500, 1000][Math.floor(randomBetween(0, 6))] *
    1024 *
    1024 *
    1024; // GB to bytes

  const cpuUsage = status === "running" ? roundTo(randomBetween(10, 90), 2) : 0;
  const memoryUsed =
    status === "running" ? memoryTotal * randomBetween(0.3, 0.85) : 0;
  const diskUsed = diskTotal * randomBetween(0.2, 0.75);

  const publicIp =
    status === "running"
      ? `${Math.floor(randomBetween(1, 254))}.${Math.floor(randomBetween(1, 254))}.${Math.floor(randomBetween(1, 254))}.${Math.floor(randomBetween(1, 254))}`
      : undefined;
  const privateIp = `10.${Math.floor(randomBetween(0, 255))}.${Math.floor(randomBetween(0, 255))}.${Math.floor(randomBetween(1, 254))}`;

  return {
    id: `vm-${randomId(8)}`,
    name: `${provider}-vm-${index + 1}`,
    provider,
    region,
    instanceType,
    status,
    publicIp,
    privateIp,
    cpu: {
      usage: cpuUsage,
      cores: cpuCores,
    },
    memory: {
      total: memoryTotal,
      used: memoryUsed,
      usedPercent: (memoryUsed / memoryTotal) * 100,
    },
    disk: {
      total: diskTotal,
      used: diskUsed,
      usedPercent: (diskUsed / diskTotal) * 100,
    },
    network: {
      bytesIn:
        status === "running"
          ? Math.floor(randomBetween(1000000000, 50000000000))
          : 0,
      bytesOut:
        status === "running"
          ? Math.floor(randomBetween(1000000000, 50000000000))
          : 0,
    },
    uptime: status === "running" ? Math.floor(randomBetween(3600, 2592000)) : 0,
    createdAt: Date.now() - Math.floor(randomBetween(86400000, 7776000000)), // 1-90 days ago
  };
}

// =============================================================================
// Backend-synced seed VMs (11 VMs matching backend InfraVirtualMachinesSeed)
// These must appear first and use stable IDs for correlation with backend.
// =============================================================================
function generateSeedVMs(): InfraVirtualMachine[] {
  const GB = 1024 * 1024 * 1024;
  const now = Date.now();
  const baseCreatedAt = now - 60 * 86400000; // 60 days ago

  // Helper to build a running VM quickly
  const makeVM = (
    id: string,
    name: string,
    provider: string,
    region: string,
    zone: string,
    instanceType: string,
    cpuCores: number,
    memoryGB: number,
    diskGB: number,
    privateIp: string,
    publicIp?: string,
    os?: string,
    status: InfraVirtualMachine["status"] = "running",
    labels?: Record<string, string>,
  ): InfraVirtualMachine => {
    const memoryTotal = memoryGB * GB;
    const memoryUsed = memoryTotal * randomBetween(0.4, 0.8);
    const diskTotal = diskGB * GB;
    const diskUsed = diskTotal * randomBetween(0.25, 0.65);

    return {
      id,
      name,
      hostname: `${name}.telemetryflow.id`,
      provider,
      region,
      zone,
      instanceType,
      status,
      os,
      publicIp,
      privateIp,
      cpu: {
        usage: status === "running" ? roundTo(randomBetween(15, 75), 2) : 0,
        cores: cpuCores,
      },
      memory: {
        total: memoryTotal,
        used: memoryUsed,
        usedPercent: (memoryUsed / memoryTotal) * 100,
      },
      disk: {
        total: diskTotal,
        used: diskUsed,
        usedPercent: (diskUsed / diskTotal) * 100,
      },
      network: {
        bytesIn:
          status === "running" ? Math.floor(randomBetween(2e9, 30e9)) : 0,
        bytesOut:
          status === "running" ? Math.floor(randomBetween(2e9, 30e9)) : 0,
      },
      uptime:
        status === "running" ? Math.floor(randomBetween(86400, 2592000)) : 0,
      createdAt: baseCreatedAt + Math.floor(randomBetween(0, 30 * 86400000)),
      labels,
    };
  };

  return [
    // AWS EC2 (5)
    makeVM(
      "vm-web-server-prod-01",
      "web-server-prod-01",
      "aws",
      "us-east-1",
      "us-east-1a",
      "t3.large",
      2,
      8,
      100,
      "10.0.1.50",
      "54.123.45.67",
      "Amazon Linux 2023",
      "running",
      { env: "production", app: "web-frontend", team: "platform" },
    ),
    makeVM(
      "vm-web-server-prod-02",
      "web-server-prod-02",
      "aws",
      "us-east-1",
      "us-east-1b",
      "t3.large",
      2,
      8,
      100,
      "10.0.1.51",
      "54.123.45.68",
      "Amazon Linux 2023",
      "running",
      { env: "production", app: "web-frontend", team: "platform" },
    ),
    makeVM(
      "vm-api-server-prod-01",
      "api-server-prod-01",
      "aws",
      "us-east-1",
      "us-east-1a",
      "m5.xlarge",
      4,
      16,
      200,
      "10.0.2.50",
      undefined,
      "Ubuntu 22.04",
      "running",
      { env: "production", app: "api-backend", team: "platform" },
    ),
    makeVM(
      "vm-db-primary-prod",
      "db-primary-prod",
      "aws",
      "us-east-1",
      "us-east-1a",
      "r5.2xlarge",
      8,
      64,
      500,
      "10.0.3.10",
      undefined,
      "Amazon Linux 2023",
      "running",
      { env: "production", app: "postgresql", role: "primary" },
    ),
    makeVM(
      "vm-db-replica-prod",
      "db-replica-prod",
      "aws",
      "us-east-1",
      "us-east-1b",
      "r5.2xlarge",
      8,
      64,
      500,
      "10.0.3.11",
      undefined,
      "Amazon Linux 2023",
      "running",
      { env: "production", app: "postgresql", role: "replica" },
    ),

    // GCP (2)
    makeVM(
      "vm-worker-prod-gcp-01",
      "worker-prod-gcp-01",
      "gcp",
      "us-central1",
      "us-central1-a",
      "n2-standard-4",
      4,
      16,
      250,
      "10.128.0.50",
      "35.192.100.50",
      "Debian 12",
      "running",
      { env: "production", app: "worker", team: "platform" },
    ),
    makeVM(
      "vm-cache-prod-01",
      "cache-prod-01",
      "gcp",
      "us-central1",
      "us-central1-b",
      "n2-highmem-4",
      4,
      32,
      100,
      "10.128.1.20",
      undefined,
      "Ubuntu 22.04",
      "running",
      { env: "production", app: "redis" },
    ),

    // Azure (1)
    makeVM(
      "vm-monitoring-azure-01",
      "monitoring-azure-01",
      "azure",
      "westeurope",
      "westeurope-1",
      "Standard_D4s_v3",
      4,
      16,
      200,
      "10.200.0.10",
      "20.123.45.67",
      "Ubuntu 22.04",
      "running",
      { env: "production", app: "monitoring", team: "sre" },
    ),

    // Staging/Dev (3)
    makeVM(
      "vm-staging-all-in-one",
      "staging-all-in-one",
      "aws",
      "us-east-1",
      "us-east-1a",
      "t3.xlarge",
      4,
      16,
      500,
      "10.10.0.100",
      "203.0.113.100",
      "Ubuntu 22.04",
      "running",
      { env: "staging", team: "platform" },
    ),
    makeVM(
      "vm-windows-build-01",
      "windows-build-01",
      "aws",
      "us-east-1",
      "us-east-1a",
      "t3.2xlarge",
      8,
      32,
      500,
      "10.50.0.100",
      undefined,
      "Windows Server 2022",
      "running",
      { env: "build", app: "ci-runner" },
    ),
    makeVM(
      "vm-legacy-app-01",
      "legacy-app-01",
      "aws",
      "us-east-1",
      "datacenter-1",
      "custom",
      4,
      8,
      200,
      "10.99.0.50",
      undefined,
      "CentOS 7.9",
      "degraded",
      { deprecated: "true", env: "production", app: "legacy-monolith" },
    ),
  ];
}

export function generateVirtualMachines(
  count: number = 20,
): InfraVirtualMachine[] {
  // Start with backend-synced seed VMs
  const vms: InfraVirtualMachine[] = [...generateSeedVMs()];

  // Then add K8s nodes as VMs (existing behavior)
  K8S_ALL_CLUSTERS.forEach((cluster) => {
    const clusterNodes = K8S_NODES_BY_CLUSTER[cluster.id] || [];
    clusterNodes.forEach((node, nodeIdx) => {
      const memoryTotal = node.memory * 1024 * 1024 * 1024; // GB to bytes
      const diskTotal =
        [100, 200, 500][Math.floor(randomBetween(0, 3))] * 1024 * 1024 * 1024; // GB

      const cpuUsage = roundTo(randomBetween(20, 80), 2);
      const memoryUsed = memoryTotal * randomBetween(0.4, 0.85);
      const diskUsed = diskTotal * randomBetween(0.3, 0.75);

      // Map provider from cluster type
      const provider =
        cluster.provider === "eks"
          ? "aws"
          : cluster.provider === "gke"
            ? "gcp"
            : cluster.provider === "kind"
              ? "aws"
              : "azure";

      vms.push({
        id: `k8s-${cluster.id}-${nodeIdx}`,
        name: node.name,
        provider,
        region: cluster.region,
        instanceType: node.instanceType,
        status: "running",
        publicIp: `${Math.floor(randomBetween(1, 254))}.${Math.floor(randomBetween(1, 254))}.${Math.floor(randomBetween(1, 254))}.${Math.floor(randomBetween(1, 254))}`,
        privateIp: `10.${Math.floor(randomBetween(0, 255))}.${Math.floor(randomBetween(0, 255))}.${Math.floor(randomBetween(1, 254))}`,
        cpu: {
          usage: cpuUsage,
          cores: node.cpu,
        },
        memory: {
          total: memoryTotal,
          used: memoryUsed,
          usedPercent: (memoryUsed / memoryTotal) * 100,
        },
        disk: {
          total: diskTotal,
          used: diskUsed,
          usedPercent: (diskUsed / diskTotal) * 100,
        },
        network: {
          bytesIn: Math.floor(randomBetween(5000000000, 50000000000)),
          bytesOut: Math.floor(randomBetween(5000000000, 50000000000)),
        },
        uptime: Math.floor(randomBetween(86400, 2592000)),
        createdAt: Date.now() - Math.floor(randomBetween(86400000, 7776000000)),
        k8s: {
          isK8sNode: true,
          clusterId: cluster.id,
          clusterName: cluster.displayName,
          clusterRegion: cluster.region,
          nodeRole: ["worker"],
          kubeletVersion: cluster.version,
          containerRuntime: "containerd://1.7.13",
          podsRunning: Math.floor(randomBetween(5, 30)),
          podsCapacity: 110,
          zone: node.zone,
        },
      });
    });
  });

  // Then add regular VMs (non-K8s)
  for (let i = 0; i < count; i++) {
    vms.push(generateVirtualMachine(i));
  }

  return vms;
}

export function generateVMTimeSeries(duration: number = 3600000) {
  const now = Date.now();
  const points: Array<[number, number]> = [];
  const step = 60000; // 1 minute

  for (let t = now - duration; t <= now; t += step) {
    points.push([t, roundTo(randomBetween(0, 100), 1)]);
  }

  return points;
}

export const infraMock = {
  generateVirtualMachines,
  generateVirtualMachine,
  generateVMTimeSeries,
};
