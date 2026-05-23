/**
 * DataTable Registry — NETWORK MAP (NWM)
 * 1 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const NWM_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ NETWORK MAP (NWM) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "NWM30001",
    module: "NWM",
    title: "Network Nodes",
    component: "NDataTable",
    columns: [
      {
        key: "name",
        title: "Node",
        width: 200,
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
        key: "status",
        title: "Status",
        width: 120,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "ip",
        title: "IP Address",
        width: 140,
        sortable: true,
        renderType: "text",
      },
      {
        key: "latency",
        title: "Latency",
        width: 100,
        sortable: true,
        renderType: "text",
      },
      {
        key: "connections",
        title: "Connections",
        width: 120,
        sortable: true,
        renderType: "text",
      },
    ],
    dataSource: "filteredNodes",
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
      scrollX: 900,
    },
    description:
      "Network nodes list view (table mode alternative to topology graph)",
    view: "monitoring/network-map/index.vue",
    position: "table-view",
  },
];
