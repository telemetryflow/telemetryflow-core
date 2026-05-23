/**
 * DataTable Registry — TRACES (TRC)
 * 2 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const TRC_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ TRACES (TRC) — 2 datatables
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "TRC30001",
    module: "TRC",
    title: "Related Logs",
    component: "DataTableCard",
    columns: [
      {
        key: "timestamp",
        title: "Timestamp",
        width: 180,
        sortable: true,
        renderType: "date",
      },
      {
        key: "severityText",
        title: "Level",
        width: 100,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "service",
        title: "Service",
        width: 140,
        sortable: true,
        renderType: "tag",
      },
      { key: "body", title: "Message", sortable: true, renderType: "text" },
      {
        key: "actions",
        title: "",
        width: 60,
        sortable: false,
        fixed: "right",
        renderType: "actions",
      },
    ],
    dataSource: "logsStore.logs",
    features: {
      pagination: true,
      pageSize: 10,
      search: false,
      filter: false,
      export: true,
      rowClick: true,
      rowSelection: false,
      striped: true,
      expandable: false,
      scrollX: 800,
    },
    description:
      "Logs correlated to the current trace (detail view Related Logs tab)",
    view: "telemetry/traces/detail.vue",
    position: "related-logs-tab",
  },
  {
    datatableId: "TRC30002",
    module: "TRC",
    title: "Trace Monitor Operations",
    component: "NDataTable",
    columns: [
      {
        key: "operation",
        title: "Service & Operation",
        width: 280,
        sortable: true,
        renderType: "custom",
      },
      {
        key: "p50",
        title: "P50",
        width: 120,
        sortable: true,
        renderType: "text",
      },
      {
        key: "p90",
        title: "P90",
        width: 120,
        sortable: true,
        renderType: "text",
      },
      {
        key: "p95",
        title: "P95",
        width: 120,
        sortable: true,
        renderType: "text",
      },
      {
        key: "p99",
        title: "P99",
        width: 120,
        sortable: true,
        renderType: "text",
      },
      {
        key: "errorRate",
        title: "Error Rate",
        width: 140,
        sortable: true,
        renderType: "progress",
      },
      {
        key: "requestRate",
        title: "Req/s",
        width: 100,
        sortable: true,
        renderType: "text",
      },
      {
        key: "impactScore",
        title: "Impact",
        width: 120,
        sortable: true,
        renderType: "progress",
      },
    ],
    dataSource: "operationMetrics",
    features: {
      pagination: false,
      search: false,
      filter: false,
      export: false,
      rowClick: false,
      rowSelection: false,
      striped: true,
      expandable: false,
      scrollX: 1200,
    },
    description:
      "Per-operation latency percentiles, error rate, and impact score (Monitor tab)",
    view: "telemetry/traces/components/TraceMonitorTab.vue",
    position: "monitor-tab-main",
  },
];
