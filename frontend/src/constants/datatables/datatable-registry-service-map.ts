/**
 * DataTable Registry — SERVICE MAP (SVM)
 * 2 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const SVM_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ SERVICE MAP (SVM) — 2 datatables
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "SVM30001",
    module: "SVM",
    title: "Services List",
    component: "NDataTable",
    columns: [
      {
        key: "name",
        title: "Service",
        width: 200,
        sortable: true,
        renderType: "custom",
      },
      {
        key: "type",
        title: "Type",
        width: 110,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "status",
        title: "Status",
        width: 110,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "namespace",
        title: "Namespace",
        width: 130,
        sortable: true,
        renderType: "text",
      },
      {
        key: "requestRate",
        title: "Req/min",
        width: 110,
        sortable: true,
        renderType: "text",
      },
      {
        key: "errorRate",
        title: "Error Rate",
        width: 110,
        sortable: true,
        renderType: "progress",
      },
      {
        key: "avgLatency",
        title: "Avg Latency",
        width: 110,
        sortable: true,
        renderType: "text",
      },
      {
        key: "dependencies",
        title: "Deps",
        width: 80,
        sortable: true,
        renderType: "text",
      },
      {
        key: "lastSeenAt",
        title: "Last Seen",
        width: 150,
        sortable: true,
        renderType: "text",
      },
    ],
    dataSource: "filteredServices",
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
      scrollX: 1100,
    },
    description:
      "Services list view (table mode alternative to topology graph)",
    view: "monitoring/service-map/index.vue",
    position: "table-view",
  },
  {
    datatableId: "SVM30002",
    module: "SVM",
    title: "Infrastructure Health",
    component: "NDataTable",
    columns: [
      {
        key: "serviceName",
        title: "Service",
        width: 180,
        sortable: true,
        renderType: "custom",
      },
      {
        key: "serviceType",
        title: "Type",
        width: 100,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "status",
        title: "Status",
        width: 110,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "avgLatencyMs",
        title: "Probe Latency",
        width: 130,
        sortable: true,
        renderType: "text",
      },
      {
        key: "availability",
        title: "Availability",
        width: 120,
        sortable: true,
        renderType: "progress",
      },
      {
        key: "healthyProbes",
        title: "OK / Total",
        width: 110,
        sortable: false,
        renderType: "text",
      },
      {
        key: "checkedAt",
        title: "Last Probe",
        width: 160,
        sortable: true,
        renderType: "text",
      },
      {
        key: "errorMessage",
        title: "Error",
        width: 220,
        sortable: false,
        renderType: "text",
      },
    ],
    dataSource: "infraHealthRows",
    features: {
      pagination: false,
      pageSize: 10,
      search: false,
      filter: true,
      export: false,
      rowClick: false,
      rowSelection: false,
      striped: true,
      expandable: false,
      scrollX: 1200,
    },
    description:
      "Live infrastructure health probe results (PostgreSQL, ClickHouse, Redis, NATS) — updated every 30s",
    view: "monitoring/service-map/index.vue",
    position: "infra-health-table",
  },
];
