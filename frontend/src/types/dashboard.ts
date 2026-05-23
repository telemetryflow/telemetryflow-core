/**
 * Dashboard data types for TelemetryFlow-Viz
 */

export type WidgetType =
  | "timeseries"
  | "stat"
  | "gauge"
  | "bar"
  | "pie"
  | "heatmap"
  | "table"
  | "logs"
  | "traces"
  | "text";

export type WidgetSize = "small" | "medium" | "large" | "full";

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetQuery {
  type: "metric" | "log" | "trace";
  query: string;
  legend?: string;
  /** Query label identifier (A, B, C...) */
  label?: string;
  /** Query dialect */
  dialect?: "tfql" | "promql";
  /** Linked template ID for suggestions */
  templateId?: string;
  /** Whether this query is enabled (default true) */
  enabled?: boolean;
  /** Grafana-style legend format template: {{label}} placeholders */
  legendFormat?: string;
  /** Label key(s) that split this query into N series (e.g. "namespace") */
  seriesKey?: string;
}

export interface WidgetThreshold {
  value: number;
  color: string;
  label?: string;
}

export interface WidgetOptions {
  title: string;
  description?: string;
  unit?: string;
  decimals?: number;
  thresholds?: WidgetThreshold[];
  legend?: boolean;
  stacked?: boolean;
  fillOpacity?: number;
  lineWidth?: number;
  colorScheme?: string;
  valueColor?: string;
}

export interface ChartSeries {
  name: string;
  data: Array<[number, number]>;
  color?: string;
}

export interface Widget {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  queries: WidgetQuery[];
  options: WidgetOptions;
}

export interface DashboardVariable {
  name: string;
  type: "query" | "custom" | "constant";
  query?: string;
  options?: string[];
  current: string;
  multi?: boolean;
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  widgets: Widget[];
  variables: DashboardVariable[];
  timeRange: {
    from: string;
    to: string;
  };
  refreshInterval?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  dashboard: Omit<Dashboard, "id" | "createdAt" | "updatedAt">;
}

export const DEFAULT_WIDGET_SIZES: Record<WidgetType, WidgetPosition> = {
  timeseries: { x: 0, y: 0, w: 6, h: 4 },
  stat: { x: 0, y: 0, w: 2, h: 2 },
  gauge: { x: 0, y: 0, w: 2, h: 3 },
  bar: { x: 0, y: 0, w: 4, h: 4 },
  pie: { x: 0, y: 0, w: 3, h: 4 },
  heatmap: { x: 0, y: 0, w: 6, h: 4 },
  table: { x: 0, y: 0, w: 6, h: 4 },
  logs: { x: 0, y: 0, w: 12, h: 6 },
  traces: { x: 0, y: 0, w: 12, h: 6 },
  text: { x: 0, y: 0, w: 4, h: 2 },
};
