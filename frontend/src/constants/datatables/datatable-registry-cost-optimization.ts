/**
 * DataTable Registry — COST OPTIMIZATION (CST)
 * 4 datatable definitions — cloud accounts, budgets, recommendations, top services
 */

import type { DataTableDefinition } from "./types";

export const CST_DATATABLE_REGISTRY: DataTableDefinition[] = [
  {
    datatableId: "CST30001",
    module: "CST",
    title: "Cloud Accounts",
    component: "NDataTable",
    dataSource: "costOptimizationApi.listAccounts",
    description: "Registered cloud provider accounts with sync status",
    columns: [
      { key: "name", title: "Account Name", width: 200, sortable: true, fixed: "left", renderType: "text" },
      { key: "provider", title: "Provider", width: 120, sortable: true, renderType: "tag" },
      { key: "accountIdentifier", title: "Account ID", width: 180, sortable: true, renderType: "text" },
      { key: "status", title: "Status", width: 100, sortable: true, renderType: "badge" },
      { key: "isEnabled", title: "Enabled", width: 80, sortable: true, renderType: "switch" },
      { key: "lastSyncAt", title: "Last Sync", width: 160, sortable: true, renderType: "text" },
    ],
    features: { search: true, pagination: true, rowSelection: false, export: true, filter: false, rowClick: false, striped: false, expandable: false },
    view: "ai-intelligence/cost-optimization/accounts.vue",
    position: "main",
  },
  {
    datatableId: "CST30002",
    module: "CST",
    title: "Cost Budgets",
    component: "NDataTable",
    dataSource: "costOptimizationApi.listBudgets",
    description: "Cost budgets with spend tracking and threshold status",
    columns: [
      { key: "name", title: "Budget Name", width: 200, sortable: true, fixed: "left", renderType: "text" },
      { key: "amount", title: "Budget Amount", width: 130, sortable: true, renderType: "text" },
      { key: "currentSpend", title: "Current Spend", width: 130, sortable: true, renderType: "text" },
      { key: "period", title: "Period", width: 100, sortable: true, renderType: "tag" },
      { key: "status", title: "Status", width: 100, sortable: true, renderType: "badge" },
      { key: "isEnabled", title: "Enabled", width: 80, sortable: true, renderType: "switch" },
    ],
    features: { search: true, pagination: true, rowSelection: false, export: true, filter: false, rowClick: false, striped: false, expandable: false },
    view: "ai-intelligence/cost-optimization/budgets.vue",
    position: "main",
  },
  {
    datatableId: "CST30003",
    module: "CST",
    title: "Cost Recommendations",
    component: "NDataTable",
    dataSource: "costOptimizationApi.listRecommendations",
    description: "AI-generated cost optimization recommendations with estimated savings",
    columns: [
      { key: "title", title: "Recommendation", width: 250, sortable: true, fixed: "left", renderType: "text" },
      { key: "category", title: "Category", width: 120, sortable: true, renderType: "tag" },
      { key: "provider", title: "Provider", width: 100, sortable: true, renderType: "tag" },
      { key: "estimatedMonthlySavings", title: "Est. Savings/mo", width: 140, sortable: true, renderType: "text" },
      { key: "confidenceScore", title: "Confidence", width: 100, sortable: true, renderType: "progress" },
      { key: "status", title: "Status", width: 100, sortable: true, renderType: "badge" },
    ],
    features: { search: true, pagination: true, rowSelection: false, export: true, filter: false, rowClick: false, striped: false, expandable: false },
    view: "ai-intelligence/cost-optimization/recommendations.vue",
    position: "main",
  },
  {
    datatableId: "CST30004",
    module: "CST",
    title: "Top Services by Cost",
    component: "NDataTable",
    dataSource: "costOptimizationApi.getTopServices",
    description: "Top costliest cloud services ranked by total spend",
    columns: [
      { key: "serviceName", title: "Service", width: 200, sortable: true, fixed: "left", renderType: "text" },
      { key: "provider", title: "Provider", width: 120, sortable: true, renderType: "tag" },
      { key: "totalCostUsd", title: "Total Cost (USD)", width: 150, sortable: true, renderType: "text" },
    ],
    features: { search: false, pagination: false, rowSelection: false, export: true, filter: false, rowClick: false, striped: false, expandable: false },
    view: "ai-intelligence/cost-optimization/index.vue",
    position: "sidebar",
  },
];
