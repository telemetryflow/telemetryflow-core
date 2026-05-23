/**
 * DataTable Registry — UPTIME (UPT)
 * 1 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const UPT_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ UPTIME (UPT) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "UPT30001",
    module: "UPT",
    title: "Uptime Monitors",
    component: "NDataTable",
    columns: [
      {
        key: "name",
        title: "Monitor",
        width: 250,
        sortable: true,
        renderType: "custom",
      },
      {
        key: "status",
        title: "Status",
        width: 120,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "uptime",
        title: "Uptime",
        width: 80,
        sortable: true,
        renderType: "text",
      },
      {
        key: "responseTime",
        title: "Avg Response",
        width: 120,
        sortable: true,
        renderType: "text",
      },
      {
        key: "uptimeBars",
        title: "24h History",
        width: 200,
        sortable: false,
        renderType: "custom",
      },
      {
        key: "actions",
        title: "",
        width: 80,
        sortable: false,
        fixed: "right",
        renderType: "actions",
      },
    ],
    dataSource: "filteredMonitors",
    features: {
      pagination: true,
      pageSize: 10,
      pageSizes: [10, 20, 50, 100, 200, 500],
      search: true,
      filter: true,
      export: false,
      rowClick: true,
      rowSelection: false,
      striped: true,
      expandable: false,
      scrollX: 900,
    },
    description:
      "Uptime monitors list with status, response time, and 24h uptime bars",
    view: "monitoring/uptime/index.vue",
    position: "main-table",
  },
];
