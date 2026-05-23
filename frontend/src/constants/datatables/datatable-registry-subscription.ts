/**
 * DataTable Registry — SUBSCRIPTION (SUB)
 * 1 datatable registry definitions
 */

import type { DataTableDefinition } from "./types";

export const SUB_DATATABLE_REGISTRY: DataTableDefinition[] = [
  // │ SUBSCRIPTION (SUB) — 1 datatable
  // └──────────────────────────────────────────────────────────────────────────────
  {
    datatableId: "SUB30001",
    module: "SUB",
    title: "Invoices",
    component: "NDataTable",
    columns: [
      {
        key: "invoiceNumber",
        title: "Invoice",
        width: 180,
        sortable: true,
        renderType: "text",
      },
      {
        key: "status",
        title: "Status",
        width: 110,
        sortable: true,
        renderType: "tag",
      },
      {
        key: "total",
        title: "Amount",
        width: 150,
        sortable: true,
        renderType: "text",
      },
      {
        key: "periodStart",
        title: "Period",
        width: 220,
        sortable: true,
        renderType: "date",
      },
      {
        key: "dueDate",
        title: "Due Date",
        width: 140,
        sortable: true,
        renderType: "date",
      },
      {
        key: "actions",
        title: "",
        width: 120,
        sortable: false,
        renderType: "actions",
      },
    ],
    dataSource: "filteredInvoices",
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
      scrollX: 900,
    },
    description:
      "Subscription invoices with status, amount, period, and due date",
    view: "settings/subscription/index.vue",
    position: "invoices-tab",
  },
];
