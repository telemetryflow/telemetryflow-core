/**
 * Agent monitoring types based on TelemetryFlow Agent
 * Reference: telemetryflow-agent/internal/collector/system/host.go
 */

// System Info from host.go
export interface AgentSystemInfo {
  hostname: string;
  os: string;
  platform: string;
  platformFamily: string;
  platformVersion: string;
  kernelVersion: string;
  kernelArch: string;
  virtualizationSystem: string;
  virtualizationRole: string;
  hostId: string;
  uptime: number;
  bootTime: number;
  procs: number;
  timezone?: string;
  timezoneOffset?: number;
}

export interface AgentHostMetrics {
  cpu: {
    usage: number;
    cores: number;
    threads: number;
    model: string;
    frequency: number;
    // Per-core usage (optional)
    perCore?: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    available: number;
    usedPercent: number;
    // Extended memory metrics
    buffers?: number;
    cached?: number;
    swapTotal?: number;
    swapUsed?: number;
    swapFree?: number;
    swapUsedPercent?: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
    path: string;
    // Extended disk metrics
    iops?: number;
    latencyRead?: number;
    latencyWrite?: number;
    readBytes?: number;
    writeBytes?: number;
  }[];
  network: {
    interface: string;
    bytesRecv: number;
    bytesSent: number;
    packetsRecv: number;
    packetsSent: number;
    errIn: number;
    errOut: number;
    dropIn: number;
    dropOut: number;
    // Rate metrics (bytes per second)
    bytesSentRate?: number;
    bytesRecvRate?: number;
  }[];
  // System-level metrics
  loadAvg?: {
    load1: number;
    load5: number;
    load15: number;
  };
  // Page faults from /proc/vmstat
  pageFaults?: {
    major: number;
    minor: number;
  };
  // TCP connection metrics
  tcp?: {
    established: number;
    timeWait: number;
    closeWait: number;
    listen: number;
    retransmits: number;
  };
  // System calls aggregated from all processes
  systemCalls?: number;
  // Container context (if running in container)
  container?: {
    name?: string;
    image?: string;
  };
}

export interface AgentHostContext {
  type: "k8s-node" | "vm";
  vmId?: string;
  vmName?: string;
  provider?: string;
  region?: string;
  instanceType?: string;
  // K8s specific
  clusterId?: string;
  clusterName?: string;
  zone?: string;
  kubeletVersion?: string;
  podsRunning?: number;
  podsCapacity?: number;
}

export interface AgentInfo {
  id: string;
  name: string;
  version: string;
  status:
  | "online"
  | "offline"
  | "warning"
  | "healthy"
  | "unhealthy"
  | "unknown";
  lastSeen: number;
  systemInfo: AgentSystemInfo;
  metrics: AgentHostMetrics;
  host?: AgentHostContext;
  // Agent metadata
  labels?: Record<string, string>;
  config?: Record<string, unknown>;
}

export interface K8sNodeContext {
  isK8sNode: boolean;
  clusterId?: string;
  clusterName?: string;
  clusterRegion?: string;
  nodeRole?: string[];
  kubeletVersion?: string;
  containerRuntime?: string;
  podsRunning?: number;
  podsCapacity?: number;
  zone?: string;
}

export interface InfraVirtualMachine {
  id: string;
  name: string;
  hostname?: string;
  provider: string;
  region: string;
  zone?: string;
  instanceType: string;
  status: "running" | "stopped" | "pending" | "terminated" | "degraded";
  os?: string;
  publicIp?: string;
  privateIp?: string;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    usedPercent: number;
  };
  disk: {
    total: number;
    used: number;
    usedPercent: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  uptime: number;
  createdAt: number;
  labels?: Record<string, string>;
  k8s?: K8sNodeContext;
}

export interface InfraMetrics {
  totalVMs: number;
  runningVMs: number;
  stoppedVMs: number;
  totalCPU: number;
  usedCPU: number;
  totalMemory: number;
  usedMemory: number;
  totalDisk: number;
  usedDisk: number;
  networkIn: number;
  networkOut: number;
  k8sNodes: number;
  k8sPods: number;
}
