/**
 * Graph Registry — RETENTION (RET)
 * 4 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const RET_GRAPHS: GraphDefinition[] = [
  // │ RETENTION (RET) - 4 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "RET10001",
    module: "RET",
    title: "Total Policies",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "count",
    description: "Total retention policies",
    dataSource: "stats.total",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH retention_policies AGGREGATE count(*)",
        legendFormat: "Total Policies",
        seriesKey: "__name__",
      },
    ],
    view: "settings/retention/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "RET10002",
    module: "RET",
    title: "Active",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "count",
    description: "Active retention policies",
    dataSource: "stats.active",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH retention_policies WHERE active = true AGGREGATE count(*)",
        legendFormat: "Active",
        seriesKey: "__name__",
      },
    ],
    view: "settings/retention/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "RET10003",
    module: "RET",
    title: "Custom Policies",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "count",
    description: "Custom retention policies",
    dataSource: "stats.custom",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH retention_policies WHERE custom = true AGGREGATE count(*)",
        legendFormat: "Custom Policies",
        seriesKey: "__name__",
      },
    ],
    view: "settings/retention/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "RET10004",
    module: "RET",
    title: "With Archive",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "count",
    description: "Policies with archive enabled",
    dataSource: "stats.withArchive",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH retention_policies WHERE archive_enabled = true AGGREGATE count(*)",
        legendFormat: "With Archive",
        seriesKey: "__name__",
      },
    ],
    view: "settings/retention/index.vue",
    position: "stats-row",
    toggleable: false,
  },

];
