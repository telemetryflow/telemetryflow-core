/**
 * DataTable Registry — API KEYS (APK)
 * 1 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const APK_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ API KEYS (APK) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "APK30001",
    module: "APK",
    title: "API Keys",
    component: "NDataTable",
    columns: [
      {
        key: "name",
        title: "Name",
        width: 200,
        sortable: true,
        renderType: "text",
      },
      {
        key: "prefix",
        title: "Key Prefix",
        width: 140,
        sortable: false,
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
        key: "scopes",
        title: "Scopes",
        width: 200,
        sortable: false,
        renderType: "custom",
      },
      {
        key: "lastUsed",
        title: "Last Used",
        width: 160,
        sortable: true,
        renderType: "date",
      },
      {
        key: "expiresAt",
        title: "Expires",
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
    dataSource: "filteredKeys",
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
      scrollX: 1100,
    },
    description:
      "API key management with status, scopes, usage, and expiration",
    view: "settings/api-keys/index.vue",
    position: "main-table",
  },
];
