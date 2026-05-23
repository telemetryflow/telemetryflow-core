/**
 * DataTable Registry — AGENT (AGT)
 * 1 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const AGT_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ AGENT (AGT) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "AGT30001",
    module: "AGT",
    title: "Agent Fleet",
    component: "NDataTable",
    columns: [
      {
        key: "hostname",
        title: "Host",
        width: 200,
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
        key: "version",
        title: "Version",
        width: 100,
        sortable: true,
        renderType: "text",
      },
      {
        key: "cpu",
        title: "CPU",
        width: 100,
        sortable: true,
        renderType: "progress",
      },
      {
        key: "memory",
        title: "Memory",
        width: 100,
        sortable: true,
        renderType: "progress",
      },
      {
        key: "lastSeen",
        title: "Last Seen",
        width: 160,
        sortable: true,
        renderType: "date",
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
    dataSource: "filteredAgents",
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
    description: "Agent fleet list with status, resource usage, and version",
    view: "monitoring/agent/index.vue",
    position: "main-table",
  },
];
