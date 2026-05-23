import type { DataTableDefinition } from "./types";

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 50, pageSizes: [25, 50, 100, 200],
  search: false, filter: true, export: false, rowClick: true,
  rowSelection: false, striped: true, expandable: false,
};

export const QRY_DATATABLES: DataTableDefinition[] = [
  {
    datatableId: "QRY30001",
    module: "QRY",
    title: "Query Analytics Overview",
    component: "NDataTable",
    description: "Unified query analytics across MySQL, MariaDB, Percona, PostgreSQL, and ClickHouse",
    columns: [
      { key: "fingerprint", title: "Query", width: 400, sortable: false, renderType: "text" },
      { key: "schema", title: "Schema", width: 100, sortable: true, renderType: "tag" },
      { key: "engine", title: "Engine", width: 100, sortable: true, renderType: "tag" },
      { key: "totalDurationMs", title: "Total Load", width: 120, sortable: true },
      { key: "avgDurationMs", title: "Avg Latency", width: 110, sortable: true },
      { key: "maxDurationMs", title: "Max Latency", width: 110, sortable: true },
      { key: "calls", title: "Calls", width: 80, sortable: true },
      { key: "rowsExamined", title: "Rows Examined", width: 110, sortable: true },
      { key: "noIndexUsed", title: "No Index", width: 80, sortable: true, renderType: "badge" },
    ],
    features: DEFAULT_FEATURES,
    dataSource: "api",
    view: "db-monitoring/query-analytics/QANView.vue",
    position: "qan-datatable-overview",
  },
];
