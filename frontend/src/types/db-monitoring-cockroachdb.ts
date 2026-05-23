export interface CockroachdbInstance {
  id: string;
  name: string;
  host: string;
  sqlPort: number;
  adminPort: number;
  clusterId: string;
  description?: string;
  nodes?: Record<string, CockroachdbNode>;
  zoneConfigs?: Record<string, unknown>;
  version?: string;
  status: "healthy" | "degraded" | "unreachable" | "unknown";
  agentId?: string;
  lastSeenAt?: string;
  metadata?: Record<string, unknown>;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CockroachdbNode {
  id: string;
  address: string;
  locality: string;
  isLive: boolean;
  ranges?: number;
  leases?: number;
  version?: string;
  startedAt?: string;
}

export interface CockroachdbOverviewStats {
  totalInstances: number;
  healthyInstances: number;
  warningInstances: number;
  criticalInstances: number;
}

export interface CockroachdbInstanceListResult {
  instances: CockroachdbInstance[];
  total: number;
}

export interface CockroachdbMetricSeries {
  metricName: string;
  labels: Record<string, string>;
  points: Array<{ timestamp: string; value: number }>;
}

export interface CockroachdbQueryFingerprint {
  fingerprintId: string;
  queryFingerprint: string;
  appName: string;
  executionCount: number;
  rowsReadAvg: number;
  rowsWrittenAvg: number;
  latencyMeanMs: number;
  latencyP50Ms: number;
  latencyP90Ms: number;
  latencyP99Ms: number;
  maxMemUsageAvg: number;
  contentionTimeAvgMs: number;
  cpuNanosAvg: number;
  queryType: string;
}

export interface CockroachdbContentionEvent {
  tableId: string;
  indexId: string;
  numContentionEvents: number;
  cumulativeContentionTime: string;
  key: string;
  txnId: string;
  count: number;
}

export interface CockroachdbRangeHeatmap {
  [database: string]: {
    [nodeId: string]: number;
  };
}
