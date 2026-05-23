/**
 * useStatPanelsFromRegistry - Composable to build StatPanel configs from registry
 *
 * Bridges the stat panel registry (statPanelId → definition metadata)
 * to StatPanel component props. Views provide dynamic values from stores;
 * the registry provides static config (title, icon, color, unit).
 *
 * Usage:
 *   const statPanels = useStatPanelsFromRegistry(
 *     ['HOM20001', 'HOM20002', 'HOM20003', 'HOM20004'],
 *     {
 *       HOM20001: computed(() => metricsStore.metricNames.length),
 *       HOM20002: computed(() => logsStore.totalLogs),
 *       HOM20003: computed(() => tracesStore.traces.length),
 *       HOM20004: computed(() => alertsStore.activeAlerts.length),
 *     }
 *   );
 *   // <StatPanel v-for="stat in statPanels" :key="stat.title" v-bind="stat" />
 */

import { computed, type ComputedRef } from "vue";
import {
  getStatPanelById,
  type StatPanelDefinition,
} from "@/constants/stat-panel-registry";
import type { StatPanelConfig } from "@/utils/stat-panel";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type StatPanelValueMap = Record<
  string,
  ComputedRef<number | string> | number | string
>;

export interface StatPanelTrendInfo {
  trend: "up" | "down" | "stable";
  trendValue: string;
  trendSuffix?: string;
}

export type StatPanelTrendMap = Record<
  string,
  ComputedRef<StatPanelTrendInfo | undefined> | StatPanelTrendInfo | undefined
>;

export interface StatPanelsFromRegistryOptions {
  /** Override title suffix (e.g., "(1H)") */
  titleSuffix?: string;
  /** Override size for all panels */
  sizeOverride?: "default" | "small";
}

// ─── Composable ─────────────────────────────────────────────────────────────────

/**
 * Build an array of StatPanelConfig from registry IDs + dynamic values
 *
 * @param ids - Array of statPanelId strings (e.g., ['HOM20001', 'HOM20002'])
 * @param valueMap - Map of statPanelId → reactive value (number | string)
 * @param trendMap - Optional map of statPanelId → trend info
 * @param options - Additional options
 * @returns Computed StatPanelConfig[] ready for v-bind
 */
export function useStatPanelsFromRegistry(
  ids: string[],
  valueMap: StatPanelValueMap,
  trendMap?: StatPanelTrendMap,
  options: StatPanelsFromRegistryOptions = {},
): ComputedRef<StatPanelConfig[]> {
  // Pre-validate all IDs exist at setup time
  const definitions: StatPanelDefinition[] = [];
  for (const id of ids) {
    const def = getStatPanelById(id);
    if (!def) {
      console.warn(
        `[useStatPanelsFromRegistry] Stat panel "${id}" not found in registry`,
      );
      continue;
    }
    definitions.push(def);
  }

  return computed(() =>
    definitions.map((def) => {
      // Resolve value (reactive or static)
      const rawValue = valueMap[def.statPanelId];
      const value =
        rawValue !== undefined
          ? typeof rawValue === "object" && "value" in rawValue
            ? rawValue.value
            : rawValue
          : 0;

      // Resolve trend (reactive or static)
      const rawTrend = trendMap?.[def.statPanelId];
      const trend =
        rawTrend !== undefined
          ? typeof rawTrend === "object" && "value" in rawTrend && !("trend" in rawTrend)
            ? (rawTrend as ComputedRef<StatPanelTrendInfo>).value
            : (rawTrend as StatPanelTrendInfo)
          : undefined;

      const config: StatPanelConfig = {
        title: def.title,
        icon: def.icon,
        color: def.color,
        unit: def.unit === "count" || def.unit === "-" ? undefined : def.unit,
        size: options.sizeOverride ?? def.size,
        valueColor: def.valueColor,
        value,
        ...(options.titleSuffix && { titleSuffix: options.titleSuffix }),
        ...(trend && {
          trend: trend.trend,
          trendValue: trend.trendValue,
          trendSuffix: trend.trendSuffix,
        }),
      };

      return config;
    }),
  );
}

/**
 * Get a single StatPanelConfig from registry with a dynamic value
 * Useful when you need just one panel, not an array
 */
export function useStatPanelFromRegistry(
  id: string,
  value: ComputedRef<number | string> | number | string,
  trend?: ComputedRef<StatPanelTrendInfo> | StatPanelTrendInfo,
): ComputedRef<StatPanelConfig | null> {
  const def = getStatPanelById(id);
  if (!def) {
    console.warn(
      `[useStatPanelFromRegistry] Stat panel "${id}" not found in registry`,
    );
    return computed(() => null);
  }

  return computed(() => {
    const resolvedValue =
      typeof value === "object" && "value" in value ? value.value : value;

    const resolvedTrend =
      trend !== undefined
        ? typeof trend === "object" && "value" in trend && !("trend" in trend)
          ? (trend as ComputedRef<StatPanelTrendInfo>).value
          : (trend as StatPanelTrendInfo)
        : undefined;

    return {
      title: def.title,
      icon: def.icon,
      color: def.color,
      unit: def.unit === "count" || def.unit === "-" ? undefined : def.unit,
      size: def.size,
      valueColor: def.valueColor,
      value: resolvedValue,
      ...(resolvedTrend && {
        trend: resolvedTrend.trend,
        trendValue: resolvedTrend.trendValue,
        trendSuffix: resolvedTrend.trendSuffix,
      }),
    };
  });
}
