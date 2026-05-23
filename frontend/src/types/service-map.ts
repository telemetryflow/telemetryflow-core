/**
 * Service Map Types
 * Type definitions for service topology and dependencies
 */

export type ServiceStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export type ServiceType =
  | "api"
  | "worker"
  | "database"
  | "cache"
  | "queue"
  | "gateway"
  | "external"
  | "frontend"
  | "storage";

export type DependencyType =
  | "sync"
  | "async"
  | "database"
  | "cache"
  | "queue"
  | "external";

export interface ServiceNode {
  id: string;
  name: string;
  displayName: string;
  type: ServiceType;
  status: ServiceStatus;
  version: string;
  namespace: string;
  environment: string;
  language: string;
  framework: string;
  owner: string;
  repository: string;
  description: string;
  instances: number;
  tags: string[];
  metrics: ServiceMetricsSummary;
  createdAt: number;
  updatedAt: number;
  lastSeenAt: number;
}

export interface ServiceMetricsSummary {
  requestRate: number;
  errorRate: number;
  p50Latency: number;
  p75Latency: number;
  p90Latency: number;
  p95Latency: number;
  p99Latency: number;
  avgLatency: number;
  successRate: number;
  throughput: number;
  saturation: number;
  availability: number;
}

export interface ServiceDependency {
  id: string;
  sourceServiceId: string;
  targetServiceId: string;
  type: DependencyType;
  protocol: string;
  requestRate: number;
  errorRate: number;
  avgLatency: number;
  p99Latency: number;
  isHealthy: boolean;
  isCriticalPath: boolean;
  metadata: Record<string, unknown>;
  discoveredAt: number;
  lastSeenAt: number;
}

export interface ServiceTopology {
  services: ServiceNode[];
  dependencies: ServiceDependency[];
  summary: ServiceTopologySummary;
  generatedAt: number;
}

export interface ServiceTopologySummary {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  totalDependencies: number;
  criticalPathDependencies: number;
  avgRequestRate: number;
  avgErrorRate: number;
  avgLatency: number;
}

export interface ServiceDetailedMetrics {
  serviceName: string;
  topEndpoints: EndpointMetrics[];
  timeSeries: {
    latency: [number, number][];
    requestRate: [number, number][];
    errorRate: [number, number][];
  };
  resourceUtilization: ResourceUtilization | null;
}

export interface MetricDataPoint {
  timestamp: number;
  requestRate: number;
  errorRate: number;
  avgLatency: number;
  p50Latency: number;
  p75Latency: number;
  p90Latency: number;
  p95Latency: number;
  p99Latency: number;
}

export interface LatencyBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface ErrorBreakdown {
  errorType: string;
  count: number;
  percentage: number;
  lastOccurred: number;
}

export interface EndpointMetrics {
  path: string;
  method: string;
  requestRate: number;
  errorRate: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
}

export interface ResourceUtilization {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkBandwidth: number;
}

export interface CreateServiceRequest {
  name: string;
  displayName?: string;
  type: ServiceType;
  version?: string;
  namespace?: string;
  environment?: string;
  language?: string;
  framework?: string;
  owner?: string;
  repository?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateServiceRequest {
  displayName?: string;
  version?: string;
  owner?: string;
  repository?: string;
  description?: string;
  tags?: string[];
}
