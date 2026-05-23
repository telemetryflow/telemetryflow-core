/**
 * Kubernetes-specific statistics composable
 * Provides K8s stats with automatic StatPanel configuration
 */

import { useModuleStats, type UseModuleStatsOptions } from "./useModuleStats";
import type { KubernetesStatistics, TimeRangeParams } from "@/types/statistics";
import type { StatPanelConfig } from "@/utils/stat-panel";
import {
  createStatPanelWithTrendAndTimeRange,
  STAT_PANEL_ICONS,
} from "@/utils/stat-panel";
import { statsApi } from "@/api/stats";

/**
 * Transform Kubernetes stats to StatPanel configs
 */
function kubernetesStatsToStatPanels(
  stats: KubernetesStatistics,
  timeRange: TimeRangeParams,
): StatPanelConfig[] {
  // Row 1: Cluster and Node stats
  const row1: StatPanelConfig[] = [
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Clusters",
        value: stats.clusters?.total || 0,
        icon: STAT_PANEL_ICONS.cluster,
        color: "primary",
        size: "small",
      },
      stats.trends?.clusters?.changePercent || 0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Nodes",
        value: stats.nodes?.total || 0,
        icon: STAT_PANEL_ICONS.node,
        color: "info",
        size: "small",
      },
      stats.trends?.nodes?.changePercent || 0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Nodes Ready",
        value: stats.nodes?.ready || 0,
        icon: STAT_PANEL_ICONS.healthy,
        color: "success",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Nodes NotReady",
        value: stats.nodes?.notReady || 0,
        icon: STAT_PANEL_ICONS.warning,
        color: stats.nodes?.notReady ? "error" : "success",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
  ];

  // Row 2: Pod stats
  const row2: StatPanelConfig[] = [
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Total Pods",
        value: stats.pods?.total || 0,
        icon: STAT_PANEL_ICONS.pod,
        color: "primary",
        size: "small",
      },
      stats.trends?.pods?.changePercent || 0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Pods Running",
        value: stats.pods?.running || 0,
        icon: STAT_PANEL_ICONS.healthy,
        color: "success",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Pods Pending",
        value: stats.pods?.pending || 0,
        icon: STAT_PANEL_ICONS.pending,
        color: stats.pods?.pending ? "warning" : "success",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Pods Failed",
        value: stats.pods?.failed || 0,
        icon: STAT_PANEL_ICONS.critical,
        color: stats.pods?.failed ? "error" : "success",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
  ];

  // Row 3: Deployment stats
  const row3: StatPanelConfig[] = [
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Deployments",
        value: stats.deployments?.total || 0,
        icon: STAT_PANEL_ICONS.deployment,
        color: "primary",
        size: "small",
      },
      stats.trends?.deployments?.changePercent || 0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Available",
        value: stats.deployments?.available || 0,
        icon: STAT_PANEL_ICONS.healthy,
        color: "success",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Progressing",
        value: stats.deployments?.progressing || 0,
        icon: STAT_PANEL_ICONS.pending,
        color: stats.deployments?.progressing ? "warning" : "success",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Degraded",
        value: stats.deployments?.degraded || 0,
        icon: STAT_PANEL_ICONS.warning,
        color: stats.deployments?.degraded ? "error" : "success",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
  ];

  return [...row1, ...row2, ...row3];
}

/**
 * Kubernetes statistics composable
 * Provides K8s stats with automatic refresh and StatPanel mapping
 */
export function useKubernetesStats(
  options?: Partial<UseModuleStatsOptions<KubernetesStatistics>>,
) {
  return useModuleStats<KubernetesStatistics>({
    fetchFn: statsApi.getKubernetesStats,
    toStatPanels: kubernetesStatsToStatPanels,
    autoRefreshInterval: 60000, // 1 minute
    syncGlobalTimeRange: true,
    ...options,
  });
}
