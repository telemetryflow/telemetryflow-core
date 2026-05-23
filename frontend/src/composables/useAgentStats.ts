/**
 * Agent-specific statistics composable
 * Provides agent stats with automatic StatPanel configuration
 */

import { useModuleStats, type UseModuleStatsOptions } from "./useModuleStats";
import type { AgentStatistics, TimeRangeParams } from "@/types/statistics";
import type { StatPanelConfig } from "@/utils/stat-panel";
import {
  createStatPanelWithTrendAndTimeRange,
  STAT_PANEL_ICONS,
} from "@/utils/stat-panel";
import { statsApi } from "@/api/stats";
import { formatBytes } from "@/utils/format";

/**
 * Transform agent stats to StatPanel configs
 */
function agentStatsToStatPanels(
  stats: AgentStatistics,
  timeRange: TimeRangeParams,
): StatPanelConfig[] {
  const onlineCount =
    (stats.byStatus.healthy || 0) +
    (stats.byStatus.degraded || 0) +
    (stats.byStatus.warning || 0);

  // Row 1: Agent counts
  const row1: StatPanelConfig[] = [
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Total Agents",
        value: stats.total,
        icon: STAT_PANEL_ICONS.bot,
        color: "primary",
        size: "small",
      },
      stats.trends?.total?.changePercent || 0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Online",
        value: onlineCount,
        icon: STAT_PANEL_ICONS.online,
        color: "success",
        size: "small",
      },
      stats.trends?.online?.changePercent || 0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Warning",
        value: (stats.byStatus.warning || 0) + (stats.byStatus.degraded || 0),
        icon: STAT_PANEL_ICONS.warning,
        color: "warning",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Offline",
        value: stats.byStatus.offline || 0,
        icon: STAT_PANEL_ICONS.offline,
        color: "error",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
  ];

  // Row 2: Resource usage
  const row2: StatPanelConfig[] = [
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Avg CPU Usage",
        value: `${(stats.resourceUsage?.avgCpuUsage || 0).toFixed(1)}%`,
        icon: STAT_PANEL_ICONS.cpu,
        color: "purple",
        size: "small",
      },
      stats.trends?.avgCpuUsage?.changePercent || 0,
      timeRange,
      true,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Avg Memory Usage",
        value: `${(stats.resourceUsage?.avgMemoryUsage || 0).toFixed(1)}%`,
        icon: STAT_PANEL_ICONS.memory,
        color: "info",
        size: "small",
      },
      stats.trends?.avgMemoryUsage?.changePercent || 0,
      timeRange,
      true,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Total CPU Cores",
        value: stats.resourceUsage?.totalCpuCores || 0,
        icon: STAT_PANEL_ICONS.cpu,
        color: "primary",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Total Memory",
        value: formatBytes(stats.resourceUsage?.totalMemory || 0),
        icon: STAT_PANEL_ICONS.memory,
        color: "success",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
  ];

  return [...row1, ...row2];
}

/**
 * Agent statistics composable
 * Provides agent stats with automatic refresh and StatPanel mapping
 */
export function useAgentStats(
  options?: Partial<UseModuleStatsOptions<AgentStatistics>>,
) {
  return useModuleStats<AgentStatistics>({
    fetchFn: statsApi.getAgentStats,
    toStatPanels: agentStatsToStatPanels,
    autoRefreshInterval: 60000, // 1 minute
    syncGlobalTimeRange: true,
    ...options,
  });
}
