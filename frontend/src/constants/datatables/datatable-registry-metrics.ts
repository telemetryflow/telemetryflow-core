/**
 * DataTable Registry — METRICS (MET)
 * 1 datatable registry definition
 */

import type { DataTableDefinition } from "./types";

export const MET_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ METRICS (MET) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "MET30001",
    module: "MET",
    title: "Available Metrics",
    component: "DataTableCard",
    columns: [
      {
        key: "name",
        title: "Metric Name",
        sortable: true,
        renderType: "text",
      },
      {
        key: "type",
        title: "Type",
        width: 140,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "unit",
        title: "Unit",
        width: 120,
        sortable: true,
        renderType: "text",
      },
      {
        key: "description",
        title: "Description",
        width: 300,
        sortable: false,
        renderType: "text",
      },
    ],
    dataSource: "filteredMetrics",
    features: {
      pagination: true,
      pageSize: 10,
      pageSizes: [10, 20, 50, 100, 200, 500],
      search: true,
      filter: false,
      export: true,
      rowClick: true,
      rowSelection: false,
      striped: true,
      expandable: false,
      scrollX: 800,
    },
    description:
      "Available metrics list with name, type, unit and description — supports export CSV/JSON",
    view: "telemetry/metrics/index.vue",
    position: "bottom-section",
  },
];
