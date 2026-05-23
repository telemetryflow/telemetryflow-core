/**
 * DataTable Registry — LLM (LLM)
 * 1 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const LLM_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ LLM (LLM) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "LLM30001",
    module: "LLM",
    title: "LLM Providers",
    component: "NDataTable",
    columns: [
      {
        key: "displayName",
        title: "Provider",
        width: 280,
        sortable: true,
        renderType: "custom",
      },
      {
        key: "provider",
        title: "Type",
        width: 140,
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
        key: "isDefault",
        title: "Default",
        width: 100,
        sortable: true,
        align: "center",
        renderType: "badge",
      },
      {
        key: "maxTokens",
        title: "Max Tokens",
        width: 120,
        sortable: true,
        align: "center",
        renderType: "text",
      },
      {
        key: "temperature",
        title: "Temperature",
        width: 120,
        sortable: true,
        align: "center",
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
    dataSource: "paginatedData",
    features: {
      pagination: true,
      pageSize: 10,
      search: true,
      filter: true,
      export: true,
      rowClick: false,
      rowSelection: false,
      striped: true,
      expandable: false,
      scrollX: 1200,
    },
    description:
      "LLM provider configurations with status toggle, default selection, and parameters",
    view: "settings/ai-assistant/index.vue",
    position: "main-table",
  },
];
