/**
 * Graph Registry — SUBSCRIPTION (SUB)
 * 4 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const SUB_GRAPHS: GraphDefinition[] = [
  // │ SUBSCRIPTION (SUB) - 4 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "SUB10001",
    module: "SUB",
    title: "Current Plan",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "",
    description: "Current subscription plan name",
    dataSource: "subscription.plan",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH subscriptions WHERE id = '{{subscription_id}}' LIMIT 1",
        legend: "Plan",
        legendFormat: "Current Plan",
        seriesKey: "__name__",
      },
    ],
    view: "settings/subscription/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "SUB10002",
    module: "SUB",
    title: "Status",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "",
    description: "Subscription status",
    dataSource: "subscription.status",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH subscriptions WHERE id = '{{subscription_id}}' LIMIT 1",
        legend: "Status",
        legendFormat: "Status",
        seriesKey: "__name__",
      },
    ],
    view: "settings/subscription/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "SUB10003",
    module: "SUB",
    title: "Billing Cycle",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "",
    description: "Current billing cycle",
    dataSource: "subscription.billingCycle",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH subscriptions WHERE id = '{{subscription_id}}' LIMIT 1",
        legend: "Billing Cycle",
        legendFormat: "Billing Cycle",
        seriesKey: "__name__",
      },
    ],
    view: "settings/subscription/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "SUB10004",
    module: "SUB",
    title: "Days Remaining",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "days",
    description: "Days remaining in current cycle",
    dataSource: "subscription.daysRemaining",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH subscriptions WHERE id = '{{subscription_id}}' AGGREGATE max(end_date) - now()",
        legend: "Days Remaining",
        legendFormat: "Days Remaining",
        seriesKey: "__name__",
      },
    ],
    view: "settings/subscription/index.vue",
    position: "stats-row",
    toggleable: false,
  },

];
