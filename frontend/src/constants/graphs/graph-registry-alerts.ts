/**
 * Graph Registry — ALERTS (ALR)
 * 4 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const ALR_GRAPHS: GraphDefinition[] = [
  // │ ALERTS (ALR) - 4 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "ALR10001",
    module: "ALR",
    title: "Critical",
    component: "StatPanel",
    chartType: "stat",
    signalType: "alerts",
    unit: "count",
    description: "Critical severity firing alerts",
    dataSource: "alertsStore critical count",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'count(ALERTS{severity="critical",alertstate="firing"})',
        legendFormat: "Critical",
        seriesKey: "__name__",
      },
    ],
    view: "alerts/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "ALR10002",
    module: "ALR",
    title: "Warning",
    component: "StatPanel",
    chartType: "stat",
    signalType: "alerts",
    unit: "count",
    description: "Warning severity firing alerts",
    dataSource: "alertsStore warning count",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'count(ALERTS{severity="warning",alertstate="firing"})',
        legendFormat: "Warning",
        seriesKey: "__name__",
      },
    ],
    view: "alerts/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "ALR10003",
    module: "ALR",
    title: "Info",
    component: "StatPanel",
    chartType: "stat",
    signalType: "alerts",
    unit: "count",
    description: "Info severity firing alerts",
    dataSource: "alertsStore info count",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'count(ALERTS{severity="info",alertstate="firing"})',
        legendFormat: "Info",
        seriesKey: "__name__",
      },
    ],
    view: "alerts/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "ALR10004",
    module: "ALR",
    title: "Resolved",
    component: "StatPanel",
    chartType: "stat",
    signalType: "alerts",
    unit: "count",
    description: "Resolved alerts",
    dataSource: "alertsStore resolved count",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'count(ALERTS{alertstate="resolved"})',
        legendFormat: "Resolved",
        seriesKey: "__name__",
      },
    ],
    view: "alerts/index.vue",
    position: "stats-row",
    toggleable: false,
  },

];
