/**
 * Exemplar data types for TelemetryFlow-Viz
 */

export interface Exemplar {
  id: string;
  timestamp: number;
  value: number;
  traceId: string;
  spanId: string;
  labels: Record<string, string>;
  metricName: string;
  serviceName?: string;
}

export interface ExemplarQuery {
  metricName?: string;
  start: number;
  end: number;
  traceId?: string;
  limit?: number;
}

export interface ExemplarQueryResult {
  status: "success" | "error";
  data: Exemplar[];
  error?: string;
}

export interface ExemplarCorrelation {
  exemplar: Exemplar;
  trace?: {
    traceId: string;
    rootService: string;
    duration: number;
  };
  logs?: {
    count: number;
    errorCount: number;
  };
}

export interface MetricExemplarSeries {
  metricName: string;
  labels: Record<string, string>;
  exemplars: Exemplar[];
}
