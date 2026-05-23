/**
 * Stat Panel Registry — AUDIT (AUD)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const AUD_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ AUDIT (AUD) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "AUD20001",
    module: "AUD",
    title: "Total Events",
    icon: "carbon:document",
    color: "primary",
    valueColor: "#3b82f6",
    unit: "count",
    size: "small",
    dataSource: "auditStore.totalEvents",
    hasTrend: true,
    hasTimeRange: true,
    description: "Total audit events in time range",
    view: "audit/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "AUD20002",
    module: "AUD",
    title: "Success",
    icon: "carbon:checkmark-filled",
    color: "success",
    valueColor: "#22c55e",
    unit: "count",
    size: "small",
    dataSource: "auditStore.successEvents",
    hasTrend: true,
    hasTimeRange: true,
    description: "Successful audit events",
    view: "audit/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "AUD20003",
    module: "AUD",
    title: "Failures",
    icon: "carbon:close-filled",
    color: "error",
    valueColor: "#ef4444",
    unit: "count",
    size: "small",
    dataSource: "auditStore.failedEvents",
    hasTrend: true,
    hasTimeRange: true,
    description: "Failed audit events",
    view: "audit/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "AUD20004",
    module: "AUD",
    title: "High Risk",
    icon: "carbon:warning-alt",
    color: "warning",
    valueColor: "#f59e0b",
    unit: "count",
    size: "small",
    dataSource: "auditStore.highRiskEvents",
    hasTrend: true,
    hasTimeRange: true,
    description: "High-risk (DENIED) audit events",
    view: "audit/index.vue",
    position: "stats-row",
  },
];
