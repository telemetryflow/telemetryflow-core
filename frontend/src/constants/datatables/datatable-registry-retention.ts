/**
 * DataTable Registry — RETENTION (RET)
 * 1 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const RET_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ RETENTION (RET) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "RET30001",
    module: "RET",
    title: "Retention Policies",
    component: "NDataTable",
    columns: [
      {
        key: "name",
        title: "Name",
        width: 220,
        sortable: true,
        renderType: "custom",
      },
      {
        key: "dataType",
        title: "Data Type",
        width: 120,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "retentionDays",
        title: "Retention",
        width: 140,
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
        key: "archiveEnabled",
        title: "Archive",
        width: 100,
        sortable: true,
        renderType: "badge",
      },
      {
        key: "lastEnforcedAt",
        title: "Last Enforced",
        width: 140,
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
    dataSource: "policies",
    features: {
      pagination: true,
      pageSize: 10,
      pageSizes: [10, 20, 50, 100, 200, 500],
      search: true,
      filter: true,
      export: false,
      rowClick: false,
      rowSelection: false,
      striped: true,
      expandable: false,
      scrollX: 1100,
    },
    description:
      "Retention policies with data type, duration, archive status, and enforcement history",
    view: "settings/retention/index.vue",
    position: "main-table",
  },
];
