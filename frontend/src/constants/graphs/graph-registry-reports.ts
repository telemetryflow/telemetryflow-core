/**
 * Graph Registry — REPORTS (RPT)
 * 5 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const RPT_GRAPHS: GraphDefinition[] = [
  // │ REPORTS (RPT) - 5 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "RPT10001",
    module: "RPT",
    title: "Total Reports",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "count",
    description: "Total report definitions",
    dataSource: "reportsStore.stats.total",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH reports AGGREGATE count(*)",
        legendFormat: "Total Reports",
        seriesKey: "__name__",
      },
    ],
    view: "reports/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "RPT10002",
    module: "RPT",
    title: "Active Schedules",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "count",
    description: "Active report schedules",
    dataSource: "reportsStore.stats.activeSchedules",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH report_schedules WHERE active = true AGGREGATE count(*)",
        legendFormat: "Active Schedules",
        seriesKey: "__name__",
      },
    ],
    view: "reports/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "RPT10003",
    module: "RPT",
    title: "Last 24h Executions",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "count",
    description: "Report executions in last 24 hours",
    dataSource: "reportsStore.stats.last24hExecutions",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH report_executions WHERE created_at >= now() - '24h' AGGREGATE count(*)",
        legendFormat: "Last 24h Executions",
        seriesKey: "__name__",
      },
    ],
    view: "reports/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "RPT10004",
    module: "RPT",
    title: "Failed Rate",
    component: "StatPanel",
    chartType: "stat",
    signalType: "mixed",
    unit: "%",
    description: "Report execution failure rate",
    dataSource: "reportsStore.stats.failedRate",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH report_executions AGGREGATE error_rate(*)",
        legendFormat: "Failed Rate",
        seriesKey: "__name__",
      },
    ],
    view: "reports/index.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "RPT10005",
    module: "RPT",
    title: "Report Charts",
    component: "ReportChartsSection",
    chartType: "dynamic",
    signalType: "mixed",
    unit: "varies",
    description: "Dynamic charts per report section (bar/area toggle)",
    dataSource: "section.charts[].series",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH metrics AGGREGATE avg(value) INTERVAL 1h",
        legend: "Report Chart",
        legendFormat: "Report Charts",
        seriesKey: "__name__",
      },
    ],
    view: "reports/detail.vue",
    position: "report-sections",
    toggleable: true,
  },

];
