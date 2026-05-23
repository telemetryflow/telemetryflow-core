/**
 * Stat Panel Registry — TENANCY (TEN)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const TEN_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ TENANCY (TEN) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "TEN20001",
    module: "TEN",
    title: "Organizations",
    icon: "carbon:enterprise",
    color: "primary",
    unit: "count",
    size: "small",
    dataSource: "tenancyStore.totalOrganizations",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total organizations",
    view: "tenancy/organizations/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "TEN20002",
    module: "TEN",
    title: "Workspaces",
    icon: "carbon:workspace",
    color: "info",
    unit: "count",
    size: "small",
    dataSource: "tenancyStore.totalWorkspaces",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total workspaces",
    view: "tenancy/workspaces/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "TEN20003",
    module: "TEN",
    title: "Tenants",
    icon: "carbon:group",
    color: "success",
    unit: "count",
    size: "small",
    dataSource: "tenancyStore.totalTenants",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total tenants",
    view: "tenancy/tenants/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "TEN20004",
    module: "TEN",
    title: "Regions",
    icon: "carbon:location",
    color: "warning",
    unit: "count",
    size: "small",
    dataSource: "tenancyStore.totalRegions",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total regions",
    view: "tenancy/regions/index.vue",
    position: "stats-row",
  },
];
