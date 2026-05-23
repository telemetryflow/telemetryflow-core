/**
 * VM Metrics Generator
 * Generate mock VM/infrastructure metrics following OTEL standards
 * Enhanced with infrastructure monitoring from infra.ts
 */

import type {
  VMMetricsBundle,
  VMCPUMetrics,
  VMMemoryMetrics,
  VMDiskMetrics,
  VMNetworkMetrics,
  VMInfo,
  Metric,
  TimeRange,
} from '../types';
import type { InfraVirtualMachine } from '@/types/agent';
import {
  createSeededRandom,
  generateTimeSeries,
  generateUUID,
  generateHostname,
  getRecommendedInterval,
} from '../common/generator';
import { VM_METRICS, MOCK_CLOUD_PROVIDERS, MOCK_CLOUD_REGIONS } from '../constants';
import {
  K8S_ALL_CLUSTERS,
  K8S_NODES_BY_CLUSTER,
} from '../kubernetes/cluster';
// Temporary: use from shared until we migrate these to common/generator
import { randomBetween, roundTo, randomId } from '@/mocks/shared';

// ============================================
// VM Generator Config
// ============================================

export interface VMGeneratorConfig {
  hostname: string;
  os?: 'linux' | 'windows' | 'macos';
  cores?: number;
  memoryGB?: number;
  disks?: string[];
  interfaces?: string[];
  timeRange: TimeRange;
}

// ============================================
// VM Metrics Bundle Generator
// ============================================

export function generateVMMetrics(config: VMGeneratorConfig): VMMetricsBundle {
  const {
    hostname,
    cores = 4,
    memoryGB = 8,
    disks = ['/dev/sda1'],
    interfaces = ['eth0'],
  } = config;

  const timestamp = Date.now();

  return {
    hostname,
    timestamp,
    cpu: generateCPUMetricsData(hostname, cores),
    memory: generateMemoryMetricsData(hostname, memoryGB * 1024 * 1024 * 1024),
    disk: disks.map((disk, i) => generateDiskMetricsData(hostname, disk, i)),
    network: interfaces.map(iface => generateNetworkMetricsData(hostname, iface)),
  };
}

// ============================================
// CPU Metrics
// ============================================

function generateCPUMetricsData(hostname: string, cores: number): VMCPUMetrics {
  const random = createSeededRandom(hostname.length);

  const utilization = random.nextFloat(10, 80);
  const user = utilization * random.nextFloat(0.5, 0.8);
  const system = utilization - user;
  const idle = 100 - utilization;
  const iowait = random.nextFloat(0, 5);

  return {
    utilization,
    user,
    system,
    idle,
    iowait,
    loadAverage: {
      load1m: random.nextFloat(0.5, cores * 0.8),
      load5m: random.nextFloat(0.3, cores * 0.6),
      load15m: random.nextFloat(0.2, cores * 0.5),
    },
    cores,
  };
}

export function generateCPUMetrics(
  config: VMGeneratorConfig
): Metric[] {
  const { hostname, cores = 4, timeRange } = config;
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);
  const random = createSeededRandom(hostname.length);

  const metrics: Metric[] = [];

  // CPU Utilization
  metrics.push({
    name: VM_METRICS.CPU.UTILIZATION,
    type: 'gauge',
    unit: '1',
    description: 'CPU utilization percentage',
    labels: [{ key: 'host.name', value: hostname }],
    dataPoints: generateTimeSeries({
      start: timeRange.start,
      end: timeRange.end,
      interval,
      baseValue: random.nextFloat(20, 60),
      variance: 15,
      noise: 0.1,
    }),
  });

  // CPU Load Average
  ['1m', '5m', '15m'].forEach((period, i) => {
    const metricName = i === 0
      ? VM_METRICS.CPU.LOAD_1M
      : i === 1
      ? VM_METRICS.CPU.LOAD_5M
      : VM_METRICS.CPU.LOAD_15M;

    metrics.push({
      name: metricName,
      type: 'gauge',
      unit: '1',
      description: `CPU load average ${period}`,
      labels: [{ key: 'host.name', value: hostname }],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(0.5, cores * 0.6) / (i + 1),
        variance: 0.5,
        noise: 0.05,
      }),
    });
  });

  return metrics;
}

// ============================================
// Memory Metrics
// ============================================

function generateMemoryMetricsData(hostname: string, totalBytes: number): VMMemoryMetrics {
  const random = createSeededRandom(hostname.length);

  const utilization = random.nextFloat(40, 85);
  const used = totalBytes * (utilization / 100);
  const available = totalBytes - used;
  const cached = totalBytes * random.nextFloat(0.1, 0.3);
  const buffered = totalBytes * random.nextFloat(0.05, 0.15);

  return {
    total: totalBytes,
    used,
    available,
    free: available - cached - buffered,
    cached,
    buffered,
    utilization,
  };
}

export function generateMemoryMetrics(
  config: VMGeneratorConfig
): Metric[] {
  const { hostname, memoryGB = 8, timeRange } = config;
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);
  const random = createSeededRandom(hostname.length);
  const totalBytes = memoryGB * 1024 * 1024 * 1024;

  const metrics: Metric[] = [];

  // Memory Utilization
  metrics.push({
    name: VM_METRICS.MEMORY.UTILIZATION,
    type: 'gauge',
    unit: '1',
    description: 'Memory utilization percentage',
    labels: [{ key: 'host.name', value: hostname }],
    dataPoints: generateTimeSeries({
      start: timeRange.start,
      end: timeRange.end,
      interval,
      baseValue: random.nextFloat(50, 75),
      variance: 10,
      noise: 0.05,
    }),
  });

  // Memory Usage
  metrics.push({
    name: VM_METRICS.MEMORY.USAGE,
    type: 'gauge',
    unit: 'By',
    description: 'Memory usage in bytes',
    labels: [{ key: 'host.name', value: hostname }],
    dataPoints: generateTimeSeries({
      start: timeRange.start,
      end: timeRange.end,
      interval,
      baseValue: totalBytes * random.nextFloat(0.5, 0.75),
      variance: totalBytes * 0.1,
      noise: 0.05,
    }),
  });

  // Memory Available
  metrics.push({
    name: VM_METRICS.MEMORY.AVAILABLE,
    type: 'gauge',
    unit: 'By',
    description: 'Available memory in bytes',
    labels: [{ key: 'host.name', value: hostname }],
    dataPoints: generateTimeSeries({
      start: timeRange.start,
      end: timeRange.end,
      interval,
      baseValue: totalBytes * random.nextFloat(0.25, 0.5),
      variance: totalBytes * 0.1,
      noise: 0.05,
    }),
  });

  return metrics;
}

// ============================================
// Disk Metrics
// ============================================

function generateDiskMetricsData(
  hostname: string,
  device: string,
  index: number
): VMDiskMetrics {
  const random = createSeededRandom(hostname.length + index);

  const total = (index + 1) * 100 * 1024 * 1024 * 1024; // 100GB * (index+1)
  const utilization = random.nextFloat(30, 80);
  const used = total * (utilization / 100);

  return {
    device,
    mountpoint: index === 0 ? '/' : `/mnt/data${index}`,
    fstype: 'ext4',
    total,
    used,
    available: total - used,
    utilization,
    iops: {
      read: random.nextInt(100, 5000),
      write: random.nextInt(50, 3000),
    },
    throughput: {
      read: random.nextInt(10, 500) * 1024 * 1024, // MB/s
      write: random.nextInt(5, 300) * 1024 * 1024,
    },
  };
}

export function generateDiskMetrics(
  config: VMGeneratorConfig
): Metric[] {
  const { hostname, disks = ['/dev/sda1'], timeRange } = config;
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);
  const random = createSeededRandom(hostname.length);

  const metrics: Metric[] = [];

  for (const disk of disks) {
    // Disk IO Read
    metrics.push({
      name: VM_METRICS.DISK.IO_READ,
      type: 'counter',
      unit: 'By',
      description: 'Disk IO bytes read',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'device', value: disk },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(1000000, 10000000),
        variance: 2000000,
        trend: 'up',
      }),
    });

    // Disk IO Write
    metrics.push({
      name: VM_METRICS.DISK.IO_WRITE,
      type: 'counter',
      unit: 'By',
      description: 'Disk IO bytes written',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'device', value: disk },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(500000, 5000000),
        variance: 1000000,
        trend: 'up',
      }),
    });

    // Filesystem Usage
    metrics.push({
      name: VM_METRICS.FILESYSTEM.UTILIZATION,
      type: 'gauge',
      unit: '1',
      description: 'Filesystem utilization percentage',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'device', value: disk },
        { key: 'mountpoint', value: '/' },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(40, 70),
        variance: 5,
        trend: 'stable',
      }),
    });
  }

  return metrics;
}

// ============================================
// Network Metrics
// ============================================

function generateNetworkMetricsData(
  hostname: string,
  iface: string
): VMNetworkMetrics {
  const random = createSeededRandom((hostname + iface).length);

  return {
    interface: iface,
    bytesReceived: random.nextInt(1000000000, 10000000000),
    bytesTransmitted: random.nextInt(500000000, 5000000000),
    packetsReceived: random.nextInt(10000000, 100000000),
    packetsTransmitted: random.nextInt(5000000, 50000000),
    errorsReceive: random.nextInt(0, 100),
    errorsTransmit: random.nextInt(0, 50),
    dropsReceive: random.nextInt(0, 50),
    dropsTransmit: random.nextInt(0, 25),
  };
}

export function generateNetworkMetrics(
  config: VMGeneratorConfig
): Metric[] {
  const { hostname, interfaces = ['eth0'], timeRange } = config;
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);
  const random = createSeededRandom(hostname.length);

  const metrics: Metric[] = [];

  for (const iface of interfaces) {
    // Network IO Receive
    metrics.push({
      name: VM_METRICS.NETWORK.IO_RECEIVE,
      type: 'counter',
      unit: 'By',
      description: 'Network bytes received',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'interface', value: iface },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(10000000, 100000000),
        variance: 20000000,
        trend: 'up',
      }),
    });

    // Network IO Transmit
    metrics.push({
      name: VM_METRICS.NETWORK.IO_TRANSMIT,
      type: 'counter',
      unit: 'By',
      description: 'Network bytes transmitted',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'interface', value: iface },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(5000000, 50000000),
        variance: 10000000,
        trend: 'up',
      }),
    });

    // Network Errors
    metrics.push({
      name: VM_METRICS.NETWORK.ERRORS_RECEIVE,
      type: 'counter',
      unit: '1',
      description: 'Network receive errors',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'interface', value: iface },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(0, 10),
        variance: 5,
        trend: 'stable',
      }),
    });
  }

  return metrics;
}

// ============================================
// VM Info Generator
// ============================================

export function generateVMInfo(options?: {
  hostname?: string;
  provider?: string;
  region?: string;
  status?: VMInfo['status'];
}): VMInfo {
  const random = createSeededRandom(options?.hostname?.length ?? Date.now());
  const provider = options?.provider ?? random.pick([...MOCK_CLOUD_PROVIDERS]);
  const regions = MOCK_CLOUD_REGIONS[provider as keyof typeof MOCK_CLOUD_REGIONS] ?? ['us-east-1'];

  return {
    id: generateUUID(),
    hostname: options?.hostname ?? generateHostname(),
    os: random.pick(['Ubuntu 22.04', 'Amazon Linux 2', 'CentOS 8', 'Debian 11']),
    platform: 'linux',
    status: options?.status ?? 'running',
    provider,
    region: options?.region ?? random.pick(regions),
    instanceType: random.pick(['t3.medium', 't3.large', 'm5.xlarge', 'c5.2xlarge']),
    publicIp: `${random.nextInt(1, 255)}.${random.nextInt(1, 255)}.${random.nextInt(1, 255)}.${random.nextInt(1, 255)}`,
    privateIp: `10.${random.nextInt(0, 255)}.${random.nextInt(0, 255)}.${random.nextInt(1, 255)}`,
    uptime: random.nextInt(3600, 86400 * 30),
    lastSeen: Date.now() - random.nextInt(0, 60000),
  };
}

export function generateVMList(count: number): VMInfo[] {
  const random = createSeededRandom(count);
  return Array.from({ length: count }, () =>
    generateVMInfo({
      status: random.pick(['running', 'running', 'running', 'stopped']),
    })
  );
}

// ============================================
// All VM Metrics Generator
// ============================================

export function generateAllVMMetrics(config: VMGeneratorConfig): Metric[] {
  return [
    ...generateCPUMetrics(config),
    ...generateMemoryMetrics(config),
    ...generateDiskMetrics(config),
    ...generateNetworkMetrics(config),
  ];
}

// ============================================
// Infrastructure VM Generation (from infra.ts)
// ============================================

const PROVIDERS = ['aws', 'gcp', 'azure'] as const;
const AWS_REGIONS = ['ap-southeast-3', 'ap-southeast-1'];
const GCP_REGIONS = ['asia-southeast1', 'asia-southeast2'];
const AZURE_REGIONS = ['southeastasia', 'eastasia'];
const INSTANCE_TYPES = {
  aws: ['t3.micro', 't3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge', 'c5.large'],
  gcp: ['n1-standard-1', 'n1-standard-2', 'n1-standard-4', 'e2-medium', 'e2-standard-2'],
  azure: ['Standard_B1s', 'Standard_B2s', 'Standard_D2s_v3', 'Standard_D4s_v3'],
};
const VM_STATUSES: Array<'running' | 'stopped' | 'pending' | 'terminated'> = [
  'running', 'running', 'running', 'running', 'running', 'stopped', 'pending',
];

/**
 * Generate a single virtual machine
 */
export function generateVirtualMachine(index: number): InfraVirtualMachine {
  const provider = PROVIDERS[Math.floor(randomBetween(0, PROVIDERS.length))] as 'aws' | 'gcp' | 'azure';
  let region: string;

  switch (provider) {
    case 'aws':
      region = AWS_REGIONS[Math.floor(randomBetween(0, AWS_REGIONS.length))];
      break;
    case 'gcp':
      region = GCP_REGIONS[Math.floor(randomBetween(0, GCP_REGIONS.length))];
      break;
    case 'azure':
      region = AZURE_REGIONS[Math.floor(randomBetween(0, AZURE_REGIONS.length))];
      break;
  }

  const instanceType = INSTANCE_TYPES[provider][Math.floor(randomBetween(0, INSTANCE_TYPES[provider].length))];
  const status = VM_STATUSES[Math.floor(randomBetween(0, VM_STATUSES.length))];

  const cpuCores = [1, 2, 4, 8, 16][Math.floor(randomBetween(0, 5))];
  const memoryTotal = [1, 2, 4, 8, 16, 32, 64][Math.floor(randomBetween(0, 7))] * 1024 * 1024 * 1024; // GB to bytes
  const diskTotal = [20, 50, 100, 200, 500, 1000][Math.floor(randomBetween(0, 6))] * 1024 * 1024 * 1024; // GB to bytes

  const cpuUsage = status === 'running' ? roundTo(randomBetween(10, 90), 2) : 0;
  const memoryUsed = status === 'running' ? memoryTotal * randomBetween(0.3, 0.85) : 0;
  const diskUsed = diskTotal * randomBetween(0.2, 0.75);

  const publicIp = status === 'running' ? `${Math.floor(randomBetween(1, 254))}.${Math.floor(randomBetween(1, 254))}.${Math.floor(randomBetween(1, 254))}.${Math.floor(randomBetween(1, 254))}` : undefined;
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
      bytesIn: status === 'running' ? Math.floor(randomBetween(1000000000, 50000000000)) : 0,
      bytesOut: status === 'running' ? Math.floor(randomBetween(1000000000, 50000000000)) : 0,
    },
    uptime: status === 'running' ? Math.floor(randomBetween(3600, 2592000)) : 0,
    createdAt: Date.now() - Math.floor(randomBetween(86400000, 7776000000)), // 1-90 days ago
  };
}

/**
 * Generate multiple virtual machines including K8s nodes
 * @param count Number of additional non-K8s VMs to generate
 */
export function generateVirtualMachines(count: number = 20): InfraVirtualMachine[] {
  const vms: InfraVirtualMachine[] = [];

  // First, add all K8s nodes as VMs
  K8S_ALL_CLUSTERS.forEach(cluster => {
    const clusterNodes = K8S_NODES_BY_CLUSTER[cluster.id] || [];
    clusterNodes.forEach((node, nodeIdx) => {
      const memoryTotal = node.memory * 1024 * 1024 * 1024; // GB to bytes
      const diskTotal = [100, 200, 500][Math.floor(randomBetween(0, 3))] * 1024 * 1024 * 1024; // GB

      const cpuUsage = roundTo(randomBetween(20, 80), 2);
      const memoryUsed = memoryTotal * randomBetween(0.4, 0.85);
      const diskUsed = diskTotal * randomBetween(0.3, 0.75);

      // Map provider from cluster type
      const provider = cluster.provider === 'eks' ? 'aws' : cluster.provider === 'gke' ? 'gcp' : 'azure';

      vms.push({
        id: `k8s-${cluster.id}-${nodeIdx}`,
        name: node.name,
        provider,
        region: cluster.region,
        instanceType: node.instanceType,
        status: 'running',
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
          nodeRole: ['worker'],
          kubeletVersion: cluster.version,
          containerRuntime: 'containerd://1.7.13',
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

/**
 * Generate VM time series data
 */
export function generateVMTimeSeries(duration: number = 3600000): Array<[number, number]> {
  const now = Date.now();
  const points: Array<[number, number]> = [];
  const step = 60000; // 1 minute

  for (let t = now - duration; t <= now; t += step) {
    points.push([t, roundTo(randomBetween(0, 100), 1)]);
  }

  return points;
}
