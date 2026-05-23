/**
 * DataTable Registry — NOTIFICATION (NOT)
 * 1 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const NOT_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ NOTIFICATION (NOT) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "NOT30001",
    module: "NOT",
    title: "Notification Channels",
    component: "NDataTable",
    columns: [
      {
        key: "name",
        title: "Channel",
        width: 250,
        sortable: true,
        renderType: "custom",
      },
      {
        key: "type",
        title: "Type",
        width: 120,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "enabled",
        title: "Status",
        width: 160,
        sortable: true,
        renderType: "switch",
      },
      {
        key: "default",
        title: "Default",
        width: 80,
        sortable: true,
        renderType: "badge",
      },
      {
        key: "usedBy",
        title: "Used By",
        width: 220,
        sortable: false,
        renderType: "custom",
      },
      {
        key: "lastUsedAt",
        title: "Last Used",
        width: 170,
        sortable: true,
        renderType: "date",
      },
      {
        key: "createdAt",
        title: "Created",
        width: 170,
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
    dataSource: "filteredChannels",
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
      scrollX: 1350,
    },
    description:
      "Notification channels with type, status toggle, usage info, and activity",
    view: "settings/notification-channels/index.vue",
    position: "main-table",
  },
];
