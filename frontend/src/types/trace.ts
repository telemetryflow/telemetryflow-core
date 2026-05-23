/**
 * Trace data types for TelemetryFlow-Viz
 */

export type SpanKind =
  | "unspecified"
  | "internal"
  | "server"
  | "client"
  | "producer"
  | "consumer";

export type SpanStatusCode = "unset" | "ok" | "error";

export interface SpanAttribute {
  key: string;
  value: string | number | boolean | string[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, string | number | boolean>;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  traceState?: string;
  attributes: Record<string, string | number | boolean>;
}

export interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  startTime: number;
  endTime: number;
  duration: number;
  status: SpanStatus;
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
  links: SpanLink[];
  resource: Record<string, string>;
  serviceName: string;
}

export interface Trace {
  traceId: string;
  rootSpan: Span;
  spans: Span[];
  services: string[];
  duration: number;
  spanCount: number;
  errorCount: number;
  startTime: number;
}

export interface TraceQuery {
  traceId?: string;
  service?: string;
  operation?: string;
  tags?: Record<string, string>;
  start: number;
  end: number;
  minDuration?: number;
  maxDuration?: number;
  limit?: number;
}

export interface TraceQueryResult {
  status: "success" | "error";
  data: Trace[];
  total: number;
  error?: string;
}

export interface TraceSummary {
  traceId: string;
  rootService: string;
  rootOperation: string;
  startTime: number;
  duration: number;
  spanCount: number;
  errorCount: number;
  services: string[];
  hasLogs?: boolean;
  // Latency percentiles (in ms)
  p50?: number;
  p95?: number;
  p99?: number;
}

export interface TraceHeatmapData {
  timestamp: number;
  latencyBucket: string;
  count: number;
  isError?: boolean;
}

export interface TraceLatencyStats {
  service: string;
  operation: string;
  requests: number;
  errors: number;
  errorRate: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface ServiceOperation {
  service: string;
  operation: string;
  spanCount: number;
  avgDuration: number;
  errorRate: number;
}

export interface ServiceDependency {
  source: string;
  target: string;
  callCount: number;
  avgDuration: number;
  errorRate: number;
}

export const SPAN_KIND_LABELS: Record<SpanKind, string> = {
  unspecified: "Unspecified",
  internal: "Internal",
  server: "Server",
  client: "Client",
  producer: "Producer",
  consumer: "Consumer",
};

export interface TraceErrorCause {
  service: string;
  span: string;
  spanAttribute?: string;
  error: string;
  sampleTraceId: string;
  percentage: number;
  count: number;
}

export interface TraceAttributeComparison {
  attribute: string;
  values: {
    value: string;
    count: number;
    percentage: number;
  }[];
}

export interface FlameGraphNode {
  name: string;
  value: number;
  percentage: number;
  children?: FlameGraphNode[];
  service?: string;
  attributes?: Record<string, string>;
}

// Scatter plot data for Duration vs Time visualization
export interface TraceScatterPoint {
  timestamp: number;
  duration: number;
  traceId: string;
  hasError: boolean;
  spanCount: number;
  serviceName: string;
  operationName: string;
}

// Monitor tab - RED metrics (Rate, Error, Duration)
export interface MonitorMetrics {
  timestamp: number;
  latency: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
    avg: number;
  };
  errorRate: number;
  errorRateAvg: number;
  requestRate: number;
  requestRateAvg: number;
}

// Operation-level metrics for monitor table
export interface OperationMetrics {
  service: string;
  operation: string;
  spanKind: SpanKind;
  latencyP50: number;
  latencyP75: number;
  latencyP90: number;
  latencyP95: number;
  latencyP99: number;
  latencyAvg: number;
  errorRate: number;
  requestRate: number;
  impactScore: number;
}

// Filter sidebar state
export interface TraceFilterState {
  service: string | null;
  operation: string | null;
  tags: Record<string, string>;
  lookback: string;
  minDuration: number | null;
  maxDuration: number | null;
  limit: number;
}

// Service with trace count for filter sidebar
export interface ServiceWithCount {
  name: string;
  traceCount: number;
}

// Node Graph types for trace visualization
export interface TraceGraphNode {
  id: string;
  serviceName: string;
  operationName: string;
  totalTime: number; // Total time (ms) - sum of self time for all spans in this node
  selfTime: number; // Self time (ms) - excluding child spans
  tracePercentage: number; // Percentage of total trace time
  selfPercentage: number; // Self time as percentage of total time
  spanCount: number; // Number of spans in this node
  hasError: boolean;
}

export interface TraceGraphEdge {
  id: string;
  source: string;
  target: string;
  callCount: number;
  avgDuration: number;
}

export type NodeGraphLayout = "layered" | "force" | "grid";
