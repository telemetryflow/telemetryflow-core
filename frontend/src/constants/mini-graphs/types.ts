/**
 * Mini-Graph Registry — Types
 *
 * MiniGraph is a compact inline chart rendered inside detail panels / drawers.
 * Unlike full RegistryGraphPanel charts, mini-graphs are embedded directly
 * in context (e.g. selected pod/node/service drawer) and reflect a single
 * entity's time-series trend.
 *
 * ID scheme: XXX4#### (type digit = 4, e.g. K8S40001)
 *   Module code: K8S, NWM, SVM, UPT, INF, AGT
 *   Type digit:  4 = mini-graph
 *   Serial:      0001–9999
 */

import type { ModuleCode } from "../graphs/types";

export type MiniGraphChartType = "timeseries" | "area" | "bar";

export type MiniGraphSignalType =
  | "metrics"
  | "kubernetes"
  | "infrastructure"
  | "uptime"
  | "service-map"
  | "network-map"
  | "agent";

export interface MiniGraphDefinition {
  /** Unique identifier — XXX4#### (e.g. K8S40001) */
  miniGraphId: string;
  /** 3-letter module code */
  module: ModuleCode;
  /** Display title shown in MiniChartCard header */
  title: string;
  /** Iconify icon name for the chart header */
  icon: string;
  /** Icon CSS class for color theming */
  iconClass?: string;
  /** Value unit label (e.g. "m", "Mi", "Gi", "%", "ms", "req/min") */
  unit?: string;
  /** Chart visualization type */
  chartType: MiniGraphChartType;
  /** Signal/data type this mini-graph draws from */
  signalType: MiniGraphSignalType;
  /** Human-readable description of what metric is shown */
  description: string;
  /**
   * The store or composable data source key.
   * Matches the computed property name in the consuming view.
   */
  dataSource: string;
  /** TFQL metric expression (for documentation & future query wiring) */
  metricExpression?: string;
  /** The view file that renders this mini-graph */
  view: string;
  /** Context: which detail drawer/panel this appears in */
  context: "pod-detail" | "node-detail" | "namespace-detail" | "pv-detail" | "service-detail" | "network-node-detail" | "monitor-detail" | "vm-detail" | "agent-detail";
}
