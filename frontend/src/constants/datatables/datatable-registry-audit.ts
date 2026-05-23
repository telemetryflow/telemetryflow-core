/**
 * DataTable Registry — AUDIT (AUD)
 * 1 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const AUD_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ AUDIT (AUD) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "AUD30001",
    module: "AUD",
    title: "Audit Events",
    component: "NDataTable",
    columns: [
      {
        key: "timestamp",
        title: "Timestamp",
        width: 180,
        sortable: true,
        renderType: "date",
      },
      {
        key: "action",
        title: "Action",
        width: 160,
        sortable: true,
        renderType: "text",
      },
      {
        key: "actor",
        title: "Actor",
        width: 180,
        sortable: true,
        renderType: "custom",
      },
      {
        key: "resource",
        title: "Resource",
        width: 180,
        sortable: true,
        renderType: "text",
      },
      {
        key: "result",
        title: "Result",
        width: 120,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "riskLevel",
        title: "Risk",
        width: 100,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "actions",
        title: "",
        width: 60,
        sortable: false,
        fixed: "right",
        renderType: "actions",
      },
    ],
    dataSource: "filteredEvents",
    features: {
      pagination: true,
      pageSize: 20,
      pageSizes: [10, 20, 50, 100, 200, 500],
      search: true,
      filter: true,
      export: true,
      rowClick: true,
      rowSelection: false,
      striped: true,
      expandable: false,
      scrollX: 1000,
    },
    description:
      "Audit event log with action, actor, resource, result, and risk level",
    view: "audit/index.vue",
    position: "main-table",
  },
];
