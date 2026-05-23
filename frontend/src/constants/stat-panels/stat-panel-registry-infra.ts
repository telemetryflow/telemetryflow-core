/**
 * Stat Panel Registry — INFRASTRUCTURE (INF)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const INF_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ INFRASTRUCTURE (INF) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "INF20001",
    module: "INF",
    title: "Total VMs",
    icon: "carbon:virtual-machine",
    color: "primary",
    unit: "count",
    size: "small",
    dataSource: "VM count",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total virtual machines",
    view: "monitoring/infra/overview.vue",
    position: "stats-row",
  },
  {
    statPanelId: "INF20002",
    module: "INF",
    title: "Online Agents",
    icon: "carbon:checkmark-filled",
    color: "success",
    unit: "count",
    size: "small",
    dataSource: "online agents count",
    hasTrend: false,
    hasTimeRange: false,
    description: "Online monitoring agents",
    view: "monitoring/infra/overview.vue",
    position: "stats-row",
  },
  {
    statPanelId: "INF20003",
    module: "INF",
    title: "CPU Usage",
    icon: "carbon:chip",
    color: "info",
    unit: "%",
    size: "small",
    dataSource: "avg CPU utilization",
    hasTrend: true,
    hasTimeRange: true,
    description: "Average CPU utilization across VMs (threshold-based color)",
    view: "monitoring/infra/overview.vue",
    position: "stats-row",
  },
  {
    statPanelId: "INF20004",
    module: "INF",
    title: "Memory Usage",
    icon: "ph:memory-fill",
    color: "info",
    unit: "%",
    size: "small",
    dataSource: "avg memory utilization",
    hasTrend: true,
    hasTimeRange: true,
    description:
      "Average memory utilization across VMs (threshold-based color)",
    view: "monitoring/infra/overview.vue",
    position: "stats-row",
  },
];
