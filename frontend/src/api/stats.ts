/**
 * Centralized Statistics API Client
 * TASK-05: Standardized data fetching for card panel statistics
 * TASK-06: Enhanced with caching support and TFO-API-KEY security
 */

import { collectorClient } from "./collector";
import { config } from "@/config";
import type {
  AgentStatistics,
  KubernetesStatistics,
  AlertStatistics,
  StatsQueryParams,
} from "@/types/statistics";
import type { CacheOptions } from "@/utils/api-cache";

// ==================== TYPES ====================

export interface StatsResponse<T> {
  data: T;
  fromCache: boolean;
  timestamp: number;
}

export interface StatsRequestOptions extends StatsQueryParams {
  /** Cache options for localStorage caching */
  cache?: CacheOptions;
}

// ==================== ENDPOINTS ====================

export const STATS_ENDPOINTS = {
  AGENTS: "/api/v2/monitoring/agents/stats",
  KUBERNETES: "/api/v2/monitoring/kubernetes/stats",
  ALERTS: "/api/v2/alert-instances/stats",
  LOGS: "/api/v2/telemetry/logs/stats",
  METRICS: "/api/v2/telemetry/metrics/stats",
  TRACES: "/api/v2/telemetry/traces/stats",
} as const;

// ==================== MOCK DATA GENERATORS ====================

function generateMockAgentStats(): AgentStatistics {
  const total = 25;
  const healthy = 18;
  const warning = 3;
  const degraded = 2;
  const offline = 2;

  return {
    total,
    timestamp: Date.now(),
    byStatus: {
      healthy,
      warning,
      degraded,
      offline,
      unhealthy: offline,
      unknown: 0,
    },
    byProvider: {
      aws: 10,
      gcp: 8,
      azure: 5,
      "on-premise": 2,
    },
    byRegion: {
      "us-east-1": 8,
      "us-west-2": 6,
      "eu-west-1": 5,
      "ap-southeast-1": 4,
      "ap-northeast-1": 2,
    },
    byType: {
      collector: 12,
      gateway: 8,
      processor: 5,
    },
    resourceUsage: {
      avgCpuUsage: 42.5,
      avgMemoryUsage: 65.3,
      totalCpuCores: 200,
      totalMemory: 512 * 1024 * 1024 * 1024, // 512 GB
    },
    trends: {
      total: {
        current: total,
        previous: 23,
        changePercent: 8.7,
        direction: "up",
      },
      online: {
        current: healthy + warning + degraded,
        previous: 20,
        changePercent: 15.0,
        direction: "up",
      },
      avgCpuUsage: {
        current: 42.5,
        previous: 45.2,
        changePercent: -6.0,
        direction: "down",
      },
      avgMemoryUsage: {
        current: 65.3,
        previous: 62.1,
        changePercent: 5.2,
        direction: "up",
      },
    },
  };
}

function generateMockKubernetesStats(): KubernetesStatistics {
  return {
    total: 156, // Total resources tracked
    timestamp: Date.now(),
    clusters: {
      total: 5,
      byProvider: {
        eks: 2,
        gke: 2,
        aks: 1,
      },
      byStatus: {
        healthy: 4,
        unhealthy: 1,
      },
    },
    nodes: {
      total: 45,
      ready: 42,
      notReady: 3,
      byCondition: {
        Ready: 42,
        NotReady: 3,
      },
    },
    pods: {
      total: 320,
      running: 285,
      pending: 15,
      failed: 10,
      succeeded: 10,
      byNamespace: {
        default: 50,
        "kube-system": 80,
        monitoring: 60,
        production: 130,
      },
    },
    deployments: {
      total: 48,
      available: 42,
      progressing: 4,
      degraded: 2,
    },
    resourceUsage: {
      cpuRequested: 120,
      cpuLimit: 200,
      cpuUsed: 85,
      memoryRequested: 256 * 1024 * 1024 * 1024, // 256 GB
      memoryLimit: 512 * 1024 * 1024 * 1024, // 512 GB
      memoryUsed: 180 * 1024 * 1024 * 1024, // 180 GB
    },
    trends: {
      clusters: {
        current: 5,
        previous: 4,
        changePercent: 25.0,
        direction: "up",
      },
      nodes: {
        current: 45,
        previous: 40,
        changePercent: 12.5,
        direction: "up",
      },
      pods: {
        current: 320,
        previous: 280,
        changePercent: 14.3,
        direction: "up",
      },
      deployments: {
        current: 48,
        previous: 45,
        changePercent: 6.7,
        direction: "up",
      },
    },
  };
}

function generateMockAlertStats(): AlertStatistics {
  return {
    total: 127,
    timestamp: Date.now(),
    byStatus: {
      firing: 23,
      acknowledged: 15,
      resolved: 84,
      silenced: 5,
    },
    bySeverity: {
      critical: 8,
      warning: 35,
      info: 84,
    },
    mttr: 1800000, // 30 minutes in ms
    mtta: 300000, // 5 minutes in ms
    trends: {
      total: {
        current: 127,
        previous: 115,
        changePercent: 10.4,
        direction: "up",
      },
      firing: {
        current: 23,
        previous: 28,
        changePercent: -17.9,
        direction: "down",
      },
      critical: {
        current: 8,
        previous: 12,
        changePercent: -33.3,
        direction: "down",
      },
    },
  };
}

// ==================== API CLIENT ====================

export const statsApi = {
  /**
   * Get agent statistics
   * @param params - Query parameters including time range
   * @returns Agent statistics data
   */
  async getAgentStats(params?: StatsQueryParams): Promise<AgentStatistics> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockAgentStats();
    }

    const response = await collectorClient.get<AgentStatistics>(
      STATS_ENDPOINTS.AGENTS,
      { params },
    );
    return response.data;
  },

  /**
   * Get agent statistics with caching support
   * @param options - Request options including cache configuration
   * @returns Agent statistics with cache metadata
   */
  async getAgentStatsCached(
    options?: StatsRequestOptions,
  ): Promise<StatsResponse<AgentStatistics>> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        data: generateMockAgentStats(),
        fromCache: false,
        timestamp: Date.now(),
      };
    }

    const { cache, ...params } = options || {};
    const result = await collectorClient.getCached<AgentStatistics>(
      STATS_ENDPOINTS.AGENTS,
      { params },
      cache,
    );

    return {
      data: result.data.data,
      fromCache: result.fromCache,
      timestamp: Date.now(),
    };
  },

  /**
   * Get Kubernetes statistics
   * @param params - Query parameters including time range
   * @returns Kubernetes statistics data
   */
  async getKubernetesStats(
    params?: StatsQueryParams,
  ): Promise<KubernetesStatistics> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockKubernetesStats();
    }

    const response = await collectorClient.get<KubernetesStatistics>(
      STATS_ENDPOINTS.KUBERNETES,
      { params },
    );
    return response.data;
  },

  /**
   * Get Kubernetes statistics with caching support
   * @param options - Request options including cache configuration
   * @returns Kubernetes statistics with cache metadata
   */
  async getKubernetesStatsCached(
    options?: StatsRequestOptions,
  ): Promise<StatsResponse<KubernetesStatistics>> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        data: generateMockKubernetesStats(),
        fromCache: false,
        timestamp: Date.now(),
      };
    }

    const { cache, ...params } = options || {};
    const result = await collectorClient.getCached<KubernetesStatistics>(
      STATS_ENDPOINTS.KUBERNETES,
      { params },
      cache,
    );

    return {
      data: result.data.data,
      fromCache: result.fromCache,
      timestamp: Date.now(),
    };
  },

  /**
   * Get alert statistics
   * @param params - Query parameters including time range
   * @returns Alert statistics data
   */
  async getAlertStats(params?: StatsQueryParams): Promise<AlertStatistics> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return generateMockAlertStats();
    }

    const response = await collectorClient.get<AlertStatistics>(
      STATS_ENDPOINTS.ALERTS,
      { params },
    );
    return response.data;
  },

  /**
   * Get alert statistics with caching support
   * @param options - Request options including cache configuration
   * @returns Alert statistics with cache metadata
   */
  async getAlertStatsCached(
    options?: StatsRequestOptions,
  ): Promise<StatsResponse<AlertStatistics>> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        data: generateMockAlertStats(),
        fromCache: false,
        timestamp: Date.now(),
      };
    }

    const { cache, ...params } = options || {};
    const result = await collectorClient.getCached<AlertStatistics>(
      STATS_ENDPOINTS.ALERTS,
      { params },
      cache,
    );

    return {
      data: result.data.data,
      fromCache: result.fromCache,
      timestamp: Date.now(),
    };
  },
};

export type { CacheOptions };
export default statsApi;
