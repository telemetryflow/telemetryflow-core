/**
 * DataTable Registry — ALERTS (ALR)
 * 1 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const ALR_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ ALERTS (ALR) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "ALR30001",
    module: "ALR",
    title: "Alert Rules",
    component: "NDataTable",
    columns: [
      {
        key: "name",
        title: "Name",
        width: 250,
        sortable: true,
        renderType: "text",
      },
      {
        key: "severity",
        title: "Severity",
        width: 120,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "status",
        title: "Status",
        width: 120,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "type",
        title: "Type",
        width: 140,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "lastFired",
        title: "Last Fired",
        width: 180,
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
    dataSource: "filteredRules",
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
    description: "Alert rules list with severity, status, and type filters",
    view: "alerts/rules.vue",
    position: "main-table",
  },
];
