/**
 * useKubernetesData.ts - Shared types for Kubernetes observability data
 *
 * Types are used by both real API responses and mock data generators.
 * Re-exports cluster/region types from @/mocks/kubernetes for convenience.
 */

import type { K8sRegionId, K8sClusterConfig } from "@/mocks/kubernetes";

// Re-export types for external use
export type { K8sRegionId, K8sClusterConfig };

// ── Data Shape Types ──

export interface UsageStats {
  real: number;
  requests: number;
  limits: number;
  total: number;
}

export interface ResourceCount {
  name: string;
  value: number;
  color: string;
}

export interface TimeSeriesData {
  name: string;
  data: Array<[number, number]>;
  color?: string;
}

export interface K8sStatCard {
  title: string;
  titleSuffix?: string;
  value: number | string;
  unit?: string;
  icon: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  statusIcon?: string;
  statusColor?: "success" | "warning" | "error" | "info";
  color: "primary" | "success" | "warning" | "error" | "info";
}

export interface K8sClusterInfo {
  name: string;
  version: string;
  platform: string;
  region: string;
  provider: string;
  apiServerUrl: string;
  createdAt: string;
  environment?: string;
  clusterId?: string;
}

export interface K8sOverviewData {
  clusterInfo: K8sClusterInfo;
  cpuUsage: UsageStats;
  ramUsage: UsageStats;
  nodes: number;
  namespaces: number;
  runningPods: number;
  services: number;
  deployments: number;
  resourceCounts: ResourceCount[];
}
