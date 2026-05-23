/**
 * Audit-specific statistics composable
 * TASK-08: Synchronize audit module with frontend
 *
 * Provides audit stats with automatic StatPanel configuration
 */

import { isRef, type Ref, type ComputedRef } from "vue";
import { useModuleStats, type UseModuleStatsOptions } from "./useModuleStats";
import type { AuditStatistics, AuditEventType, AuditResult } from "@/types/audit";
import type { TimeRangeParams } from "@/types/statistics";
import type { StatPanelConfig } from "@/utils/stat-panel";
import {
  createStatPanelWithTrendAndTimeRange,
  STAT_PANEL_ICONS,
} from "@/utils/stat-panel";
import { auditApi } from "@/api/audit";

/**
 * Transform audit stats to StatPanel configs
 */
function auditStatsToStatPanels(
  stats: AuditStatistics,
  timeRange: TimeRangeParams,
): StatPanelConfig[] {
  // Row 1: Event counts by type
  const row1: StatPanelConfig[] = [
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Total Events",
        value: stats.total,
        icon: STAT_PANEL_ICONS.chart,
        color: "primary",
        valueColor: "#3b82f6",
        size: "small",
      },
      stats.trends?.total?.changePercent || 0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Auth Events",
        value: stats.byEventType.AUTH || 0,
        icon: STAT_PANEL_ICONS.agent,
        color: "info",
        valueColor: "#06b6d4",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Data Events",
        value: stats.byEventType.DATA || 0,
        icon: STAT_PANEL_ICONS.storage,
        color: "success",
        valueColor: "#22c55e",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "System Events",
        value: stats.byEventType.SYSTEM || 0,
        icon: STAT_PANEL_ICONS.server,
        color: "purple",
        valueColor: "#8b5cf6",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
  ];

  // Row 2: Result distribution
  const row2: StatPanelConfig[] = [
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Successful",
        value: stats.byResult.SUCCESS || 0,
        icon: STAT_PANEL_ICONS.healthy,
        color: "success",
        valueColor: "#22c55e",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Failed",
        value: stats.byResult.FAILURE || 0,
        icon: STAT_PANEL_ICONS.error,
        color: "error",
        valueColor: "#ef4444",
        size: "small",
      },
      stats.trends?.failures?.changePercent || 0,
      timeRange,
      true, // Higher failures is bad
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Denied",
        value: stats.byResult.DENIED || 0,
        icon: STAT_PANEL_ICONS.warning,
        color: "warning",
        valueColor: "#f59e0b",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
    createStatPanelWithTrendAndTimeRange(
      {
        title: "Success Rate",
        value: `${((stats.byResult.SUCCESS / stats.total) * 100).toFixed(1)}%`,
        icon: STAT_PANEL_ICONS.percentage,
        color: "primary",
        valueColor: "#3b82f6",
        size: "small",
      },
      0,
      timeRange,
      false,
    ),
  ];

  return [...row1, ...row2];
}

export interface AuditStatsActiveFilters {
  eventType?: AuditEventType | null;
  result?: AuditResult | null;
  userEmail?: string;
  from?: string;
  to?: string;
}

/**
 * Audit statistics composable
 * Provides audit stats with automatic refresh and StatPanel mapping.
 * Pass `activeFilters` (reactive ref) to keep stat panels in sync with datatable filters.
 */
export function useAuditStats(
  options?: Partial<UseModuleStatsOptions<AuditStatistics>>,
  activeFilters?: Ref<AuditStatsActiveFilters> | ComputedRef<AuditStatsActiveFilters>,
) {
  return useModuleStats<AuditStatistics>({
    fetchFn: async (params) => {
      const f = activeFilters && isRef(activeFilters) ? activeFilters.value : {};
      return auditApi.getAuditStats({
        from: f.from ?? params?.from,
        to: f.to ?? params?.to,
        organizationId: params?.organizationId,
        workspaceId: params?.workspaceId,
        eventType: f.eventType || undefined,
        result: f.result || undefined,
        userEmail: f.userEmail || undefined,
      });
    },
    toStatPanels: auditStatsToStatPanels,
    autoRefreshInterval: 60000, // 1 minute
    syncGlobalTimeRange: true,
    ...options,
  });
}

/**
 * Audit summary statistics (simplified version)
 */
export function useAuditSummary() {
  const auditStats = useAuditStats({
    autoRefreshInterval: 0, // No auto-refresh for summary
    fetchOnMount: true,
  });

  return {
    stats: auditStats.stats,
    loading: auditStats.loading,
    error: auditStats.error,
    refresh: auditStats.refresh,
    statPanels: auditStats.statPanels,
    // Computed helpers
    get totalEvents() {
      return auditStats.stats.value?.total || 0;
    },
    get successRate() {
      if (!auditStats.stats.value) return 0;
      return (
        (auditStats.stats.value.byResult.SUCCESS /
          auditStats.stats.value.total) *
        100
      );
    },
    get failureCount() {
      return auditStats.stats.value?.byResult.FAILURE || 0;
    },
    get deniedCount() {
      return auditStats.stats.value?.byResult.DENIED || 0;
    },
  };
}
