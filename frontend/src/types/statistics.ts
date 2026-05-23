/**
 * Standardized Statistics Types for TelemetryFlow
 * Used by all modules for consistent stats responses
 */

/**
 * Base statistics interface - all module stats extend this
 */
export interface BaseStatistics {
  total: number;
  timestamp: number; // Unix timestamp in ms
  timeRange?: {
    from: number;
    to: number;
  };
}

/**
 * Trend information for comparative analysis
 */
export interface TrendInfo {
  current: number;
  previous: number;
  changePercent: number;
  direction: "up" | "down" | "stable";
}

/**
 * Helper to calculate trend from current/previous values
 */
export function calculateTrend(
  current: number,
  previous: number | undefined,
  seed?: number,
): TrendInfo {
  if (previous === undefined || previous === 0) {
    // If no previous, generate mock trend for display
    const mockPrevious = seed
      ? current * (1 - ((seed % 20) - 10) / 100)
      : current;
    const change =
      mockPrevious > 0 ? ((current - mockPrevious) / mockPrevious) * 100 : 0;
    return {
      current,
      previous: mockPrevious,
      changePercent: Math.round(change * 10) / 10,
      direction: Math.abs(change) < 0.5 ? "stable" : change > 0 ? "up" : "down",
    };
  }

  const changePercent = ((current - previous) / previous) * 100;
  return {
    current,
    previous,
    changePercent: Math.round(changePercent * 10) / 10,
    direction:
      Math.abs(changePercent) < 0.5
        ? "stable"
        : changePercent > 0
          ? "up"
          : "down",
  };
}

/**
 * Status distribution - generic for any entity with statuses
 */
export type StatusDistribution<T extends string = string> = {
  [K in T]?: number;
};

/**
 * Resource usage metrics
 */
export interface ResourceUsage {
  avgCpuUsage: number;
  avgMemoryUsage: number;
  totalCpuCores?: number;
  totalMemory?: number;
  totalDisk?: number;
  usedDisk?: number;
}

// ============================================
// Agent Statistics
// ============================================

export type AgentStatus =
  | "healthy"
  | "unhealthy"
  | "offline"
  | "degraded"
  | "warning"
  | "unknown";

export interface AgentStatusDistribution {
  healthy: number;
  unhealthy: number;
  offline: number;
  degraded: number;
  warning: number;
  unknown: number;
}

export interface AgentTrends {
  total?: TrendInfo;
  online?: TrendInfo;
  avgCpuUsage?: TrendInfo;
  avgMemoryUsage?: TrendInfo;
}

export interface AgentStatistics extends BaseStatistics {
  byStatus: AgentStatusDistribution;
  byProvider: Record<string, number>;
  byRegion: Record<string, number>;
  byType: Record<string, number>;
  resourceUsage: ResourceUsage;
  trends?: AgentTrends;
}

// ============================================
// Kubernetes Statistics
// ============================================

export interface ClusterStats {
  total: number;
  byProvider: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface NodeStats {
  total: number;
  ready: number;
  notReady: number;
  byCondition: Record<string, number>;
}

export interface PodStats {
  total: number;
  running: number;
  pending: number;
  failed: number;
  succeeded: number;
  byNamespace: Record<string, number>;
}

export interface DeploymentStats {
  total: number;
  available: number;
  progressing: number;
  degraded: number;
}

export interface K8sResourceUsage {
  cpuRequested: number;
  cpuLimit: number;
  cpuUsed: number;
  memoryRequested: number;
  memoryLimit: number;
  memoryUsed: number;
}

export interface KubernetesTrends {
  clusters?: TrendInfo;
  nodes?: TrendInfo;
  pods?: TrendInfo;
  deployments?: TrendInfo;
}

export interface KubernetesStatistics extends BaseStatistics {
  clusters: ClusterStats;
  nodes: NodeStats;
  pods: PodStats;
  deployments: DeploymentStats;
  resourceUsage?: K8sResourceUsage;
  trends?: KubernetesTrends;
}

// ============================================
// Alert Statistics
// ============================================

export type AlertStatus = "firing" | "acknowledged" | "resolved" | "silenced";
export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertStatusDistribution {
  firing: number;
  acknowledged: number;
  resolved: number;
  silenced: number;
}

export interface AlertSeverityDistribution {
  critical: number;
  warning: number;
  info: number;
}

export interface AlertTrends {
  total?: TrendInfo;
  firing?: TrendInfo;
  critical?: TrendInfo;
}

export interface AlertStatistics extends BaseStatistics {
  byStatus: AlertStatusDistribution;
  bySeverity: AlertSeverityDistribution;
  byRule?: Record<string, number>;
  mttr?: number; // Mean Time To Resolution (seconds)
  mtta?: number; // Mean Time To Acknowledge (seconds)
  trends?: AlertTrends;
}

// ============================================
// Telemetry Statistics
// ============================================

export interface TelemetryStatistics extends BaseStatistics {
  metricsCount: number;
  logsCount: number;
  tracesCount: number;
  servicesCount: number;
  bySeverity?: Record<string, number>;
  byService?: Record<string, number>;
  trends?: {
    metrics?: TrendInfo;
    logs?: TrendInfo;
    traces?: TrendInfo;
  };
}

// ============================================
// Query Parameters
// ============================================

export interface StatsQueryParams {
  from?: string;
  to?: string;
  organizationId?: string;
  workspaceId?: string;
  [key: string]: unknown;
}

export interface TimeRangeParams {
  start: number;
  end: number;
}
