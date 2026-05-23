/**
 * Metric data types for TelemetryFlow-Viz
 */

export type MetricType = "gauge" | "counter" | "histogram" | "summary";

export interface MetricLabel {
  key: string;
  value: string;
}

export interface MetricDataPoint {
  timestamp: number;
  value: number;
}

export interface Metric {
  name: string;
  type: MetricType;
  description?: string;
  unit?: string;
  labels: MetricLabel[];
  dataPoints: MetricDataPoint[];
}

export interface MetricSeries {
  metric: string;
  labels: Record<string, string>;
  values: MetricDataPoint[];
}

export interface MetricQuery {
  query: string;
  start: number;
  end: number;
  step?: number;
  labels?: Record<string, string>;
}

export interface MetricQueryResult {
  status: "success" | "error";
  data: MetricSeries[];
  error?: string;
}

export interface MetricMetadata {
  name: string;
  type: MetricType;
  help: string;
  unit: string;
}

export interface HistogramBucket {
  le: number;
  count: number;
}

export interface HistogramMetric extends Metric {
  type: "histogram";
  buckets: HistogramBucket[];
  sum: number;
  count: number;
}

export interface SummaryQuantile {
  quantile: number;
  value: number;
}

export interface SummaryMetric extends Metric {
  type: "summary";
  quantiles: SummaryQuantile[];
  sum: number;
  count: number;
}
