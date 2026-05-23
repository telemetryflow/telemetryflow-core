/**
 * DataTable Registry Types
 *
 * Shared type definitions for datatable registry modules.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export type DataTableModuleCode =
  | "HOM"
  | "MET"
  | "TRC"
  | "LOG"
  | "COR"
  | "EXP"
  | "ALR"
  | "RPT"
  | "UPT"
  | "STP"
  | "SVM"
  | "NWM"
  | "K8S"
  | "INF"
  | "AGT"
  | "RET"
  | "SUB"
  | "IAM"
  | "TEN"
  | "AUD"
  | "APK"
  | "NOT"
  | "LLM"
  | "AID"
  | "CRM"
  | "PRM"
  | "CST"
  | "INV"
  | "DBM"
  | "QRY";

export interface DataTableColumn {
  key: string;
  title: string;
  width?: number;
  sortable: boolean;
  fixed?: "left" | "right";
  align?: "left" | "center" | "right";
  renderType?:
    | "text"
    | "tag"
    | "switch"
    | "progress"
    | "badge"
    | "icon"
    | "date"
    | "actions"
    | "sparkline"
    | "custom";
}

export interface DataTableFeatures {
  pagination: boolean;
  pageSize?: number;
  pageSizes?: number[];
  search: boolean;
  filter: boolean;
  export: boolean;
  rowClick: boolean;
  rowSelection: boolean;
  striped: boolean;
  expandable: boolean;
  scrollX?: number;
}

export interface DataTableDefinition {
  datatableId: string;
  module: DataTableModuleCode;
  title: string;
  component: "NDataTable" | "DataTableCard";
  columns: DataTableColumn[];
  dataSource: string;
  features: DataTableFeatures;
  description: string;
  view: string;
  position: string;
}

// ─── DataTable Registry ─────────────────────────────────────────────────────────
