/**
 * Alert-specific statistics composable
 * Provides alert stats with automatic StatPanel configuration
 */

import { useModuleStats, type UseModuleStatsOptions } from "./useModuleStats";
import type { AlertStatistics, TimeRangeParams } from "@/types/statistics";
import type { StatPanelConfig } from "@/utils/stat-panel";
import {
  createStatPanelWithTrendAndTimeRange,
  STAT_PANEL_ICONS,
} from "@/utils/stat-panel";
import { statsApi } from "@/api/stats";

/**
 * Transform alert stats to StatPanel configs
 */
function alertStatsToStatPanels(
  stats: AlertStatistics,
  timeRange: TimeRangeParams,
): StatPanelConfig[] {
  // Row 1: Alert status breakdown
  const row1: StatPanelConfig[] = [
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Total Alerts",
        value: stats.total,
        icon: STAT_PANEL_ICONS.alert,
        color: "primary",
        size: "small",
      },
      stats.trends?.total?.changePercent || 0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Firing",
        value: stats.byStatus?.firing || 0,
        icon: STAT_PANEL_ICONS.critical,
        color: stats.byStatus?.firing ? "error" : "success",
        size: "small",
      },
      stats.trends?.firing?.changePercent || 0,
      timeRange,
      true,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Acknowledged",
        value: stats.byStatus?.acknowledged || 0,
        icon: STAT_PANEL_ICONS.info,
        color: "warning",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Resolved",
        value: stats.byStatus?.resolved || 0,
        icon: STAT_PANEL_ICONS.healthy,
        color: "success",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
  ];

  // Row 2: Severity breakdown
  const row2: StatPanelConfig[] = [
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Critical",
        value: stats.bySeverity?.critical || 0,
        icon: STAT_PANEL_ICONS.critical,
        color: stats.bySeverity?.critical ? "error" : "success",
        size: "small",
      },
      stats.trends?.critical?.changePercent || 0,
      timeRange,
      true,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Warning",
        value: stats.bySeverity?.warning || 0,
        icon: STAT_PANEL_ICONS.warning,
        color: stats.bySeverity?.warning ? "warning" : "success",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Info",
        value: stats.bySeverity?.info || 0,
        icon: STAT_PANEL_ICONS.info,
        color: "info",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Silenced",
        value: stats.byStatus?.silenced || 0,
        icon: STAT_PANEL_ICONS.pending,
        color: "info",
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
 * Alert statistics composable
 * Provides alert stats with automatic refresh and StatPanel mapping
 */
export function useAlertStats(
  options?: Partial<UseModuleStatsOptions<AlertStatistics>>,
) {
  return useModuleStats<AlertStatistics>({
    fetchFn: statsApi.getAlertStats,
    toStatPanels: alertStatsToStatPanels,
    autoRefreshInterval: 30000, // 30 seconds for alerts
    syncGlobalTimeRange: true,
    ...options,
  });
}
