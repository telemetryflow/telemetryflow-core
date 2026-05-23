/**
 * DataTable Registry — STATUS PAGE (STP)
 * 1 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const STP_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ STATUS PAGE (STP) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "STP30001",
    module: "STP",
    title: "Status Pages",
    component: "NDataTable",
    columns: [
      {
        key: "name",
        title: "Page Name",
        width: 250,
        sortable: true,
        renderType: "text",
      },
      {
        key: "status",
        title: "Status",
        width: 120,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "visibility",
        title: "Visibility",
        width: 100,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "monitors",
        title: "Monitors",
        width: 100,
        sortable: true,
        renderType: "text",
      },
      {
        key: "incidents",
        title: "Incidents",
        width: 100,
        sortable: true,
        renderType: "text",
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
    dataSource: "filteredPages",
    features: {
      pagination: true,
      pageSize: 10,
      search: true,
      filter: true,
      export: false,
      rowClick: true,
      rowSelection: false,
      striped: true,
      expandable: false,
      scrollX: 800,
    },
    description:
      "Status pages list with status, visibility, and monitor counts",
    view: "monitoring/status-page/index.vue",
    position: "main-table",
  },
];
