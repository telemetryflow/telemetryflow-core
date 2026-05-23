/**
 * Graph Registry — STATUS PAGE (STP)
 * 8 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const STP_GRAPHS: GraphDefinition[] = [
  // │ STATUS PAGE (STP) - 8 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "STP10001",
    module: "STP",
    title: "Total Pages",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Total status pages",
    dataSource: "stats.total",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH status_pages AGGREGATE count(*)",
        legendFormat: "Total Pages",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/status-page/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "STP10002",
    module: "STP",
    title: "Operational",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Fully operational pages",
    dataSource: "stats.operational",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH status_pages WHERE status = 'operational' AGGREGATE count(*)",
        legendFormat: "Operational",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/status-page/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "STP10003",
    module: "STP",
    title: "Degraded",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Degraded status pages",
    dataSource: "stats.degraded",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH status_pages WHERE status = 'degraded' AGGREGATE count(*)",
        legendFormat: "Degraded",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/status-page/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "STP10004",
    module: "STP",
    title: "Outage",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Pages in outage state",
    dataSource: "stats.outage",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH status_pages WHERE status = 'outage' AGGREGATE count(*)",
        legendFormat: "Outage",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/status-page/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "STP10005",
    module: "STP",
    title: "Public Pages",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Publicly accessible status pages",
    dataSource: "stats.publicPages",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH status_pages WHERE visibility = 'public' AGGREGATE count(*)",
        legendFormat: "Public Pages",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/status-page/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },
  {
    graphId: "STP10006",
    module: "STP",
    title: "Private Pages",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Private/internal status pages",
    dataSource: "stats.privatePages",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH status_pages WHERE visibility = 'private' AGGREGATE count(*)",
        legendFormat: "Private Pages",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/status-page/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },
  {
    graphId: "STP10007",
    module: "STP",
    title: "Active Incidents",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Currently active incidents",
    dataSource: "stats.activeIncidents",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH incidents WHERE status = 'active' AGGREGATE count(*)",
        legendFormat: "Active Incidents",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/status-page/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },
  {
    graphId: "STP10008",
    module: "STP",
    title: "Total Monitors",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Total monitors across status pages",
    dataSource: "stats.totalMonitors",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH monitors AGGREGATE count_distinct(monitor_id)",
        legendFormat: "Total Monitors",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/status-page/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },

];
