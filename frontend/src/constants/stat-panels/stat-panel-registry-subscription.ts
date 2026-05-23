/**
 * Stat Panel Registry — SUBSCRIPTION (SUB)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const SUB_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ SUBSCRIPTION (SUB) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "SUB20001",
    module: "SUB",
    title: "Current Plan",
    icon: "carbon:plan",
    color: "info",
    unit: "",
    size: "small",
    dataSource: "subscription.plan",
    hasTrend: false,
    hasTimeRange: true,
    description: "Current subscription plan name",
    view: "settings/subscription/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "SUB20002",
    module: "SUB",
    title: "Status",
    icon: "carbon:checkmark-filled",
    color: "success",
    unit: "",
    size: "small",
    dataSource: "subscription.status",
    hasTrend: false,
    hasTimeRange: true,
    description: "Subscription status",
    view: "settings/subscription/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "SUB20003",
    module: "SUB",
    title: "Billing Cycle",
    icon: "carbon:time",
    color: "info",
    unit: "",
    size: "small",
    dataSource: "subscription.billingCycle",
    hasTrend: false,
    hasTimeRange: true,
    description: "Current billing cycle",
    view: "settings/subscription/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "SUB20004",
    module: "SUB",
    title: "Days Remaining",
    icon: "carbon:time",
    color: "primary",
    unit: "days",
    size: "small",
    dataSource: "subscription.daysRemaining",
    hasTrend: false,
    hasTimeRange: true,
    description: "Days remaining in current cycle",
    view: "settings/subscription/index.vue",
    position: "stats-row",
  },
];
