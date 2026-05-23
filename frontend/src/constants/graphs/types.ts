/**
 * Graph Registry Types
 *
 * Shared type definitions for graph registry modules.
 * Extracted to avoid circular imports between graph-registry.ts and per-module files.
 */

export type ModuleCode =
  | "HOM"
  | "DSH"
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

export type ChartType =
  | "timeseries"
  | "bar"
  | "gauge"
  | "heatmap"
  | "scatter"
  | "stat"
  | "topology"
  | "waterfall"
  | "flamegraph"
  | "sparkline"
  | "progress"
  | "mini-bars"
  | "text"
  | "dynamic"
  | "stacked-area"
  | "donut";

export type SignalType =
  | "metrics"
  | "logs"
  | "traces"
  | "exemplars"
  | "correlations"
  | "alerts"
  | "infrastructure"
  | "kubernetes"
  | "uptime"
  | "mixed";

export type QueryDialect = "tfql" | "promql" | "clickhouse" | "none";

export interface GraphDefaultQuery {
  dialect: QueryDialect;
  expression: string;
  /** Per-query legend label (overrides graph title when multiple queries) */
  legend?: string;
  /**
   * Grafana-style legend format template.
   * Uses `{{label}}` placeholders resolved from series labels/metadata.
   * Examples: `{{namespace}}`, `{{node}}`, `{{instance}} - {{mode}}`
   * When set, each series name is formatted using this template.
   * When empty/unset, the raw series name from the backend is used.
   */
  legendFormat?: string;
  /**
   * Unique series identity key — the label(s) that distinguish series
   * produced by this query (like PromQL `by (namespace)` clause).
   * Examples: "namespace", "node", "instance,mode"
   * Used by the UI to show which labels split a single query into N series.
   */
  seriesKey?: string;
}

export interface GraphDefinition {
  graphId: string;
  module: ModuleCode;
  title: string;
  component: string;
  chartType: ChartType;
  signalType: SignalType;
  unit: string;
  description: string;
  dataSource: string;
  defaultQueries: GraphDefaultQuery[];
  view: string;
  position: string;
  toggleable: boolean;
}
