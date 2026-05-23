/**
 * DataTable Registry — LOGS (LOG)
 * 2 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const LOG_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ LOGS (LOG) — 2 datatables
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "LOG30001",
    module: "LOG",
    title: "Service Breakdown",
    component: "DataTableCard",
    columns: [
      { key: "service", title: "Service", sortable: true, renderType: "text" },
      {
        key: "logs",
        title: "Logs",
        width: 100,
        sortable: true,
        renderType: "text",
      },
      {
        key: "errors",
        title: "Errors",
        width: 100,
        sortable: true,
        renderType: "text",
      },
      {
        key: "errorRate",
        title: "Error Rate",
        width: 160,
        sortable: true,
        renderType: "progress",
      },
    ],
    dataSource: "serviceBreakdown",
    features: {
      pagination: false,
      search: false,
      filter: false,
      export: false,
      rowClick: false,
      rowSelection: false,
      striped: true,
      expandable: false,
    },
    description:
      "Service breakdown with error rate progress bars (Analytics tab)",
    view: "telemetry/logs/LogsAnalyticsTab.vue",
    position: "analytics-tab-breakdown",
  },
  {
    datatableId: "LOG30002",
    module: "LOG",
    title: "Detected Patterns",
    component: "DataTableCard",
    columns: [
      { key: "pattern", title: "Pattern", sortable: true, renderType: "text" },
      {
        key: "count",
        title: "Count",
        width: 100,
        sortable: true,
        renderType: "text",
      },
      {
        key: "level",
        title: "Level",
        width: 80,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "volume",
        title: "Trend",
        width: 100,
        sortable: false,
        renderType: "sparkline",
      },
      {
        key: "service",
        title: "Service",
        width: 140,
        sortable: true,
        renderType: "tag",
      },
    ],
    dataSource: "filteredPatterns",
    features: {
      pagination: false,
      search: true,
      filter: true,
      export: false,
      rowClick: true,
      rowSelection: false,
      striped: true,
      expandable: false,
    },
    description:
      "Log pattern detection table with SVG sparkline volume column (Patterns tab)",
    view: "telemetry/logs/LogsPatternsTab.vue",
    position: "patterns-tab-main",
  },
];
