/**
 * Global Metric Query Inventory
 *
 * Single source-of-truth for ALL metric queries used in dashboard graphs.
 * Organized into 9 signal sources matching the backend TelemetryStats.service.ts
 * dynamic counting (OTLP, traces, logs, K8s, VM, uptime, service-map, network-map).
 *
 * Used by:
 * - Graph registry defaultQueries auto-fill
 * - Mock stats (computeMockMetricCount)
 * - Documentation of what "Total Metrics" actually counts
 *
 * NOT used for:
 * - Backend counting (TelemetryStats.service.ts queries CH dynamically)
 * - Query editor templates (query-templates.ts handles that)
 */

import { VM_METRICS, K8S_METRICS, APP_METRICS } from "@/utils/telemetry/constants";

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

/** A concrete metric query definition (fixed metric name in ClickHouse) */
export interface MetricQueryDef {
  /** Unique ID: "otlp.http_server_requests_total" */
  id: string;
  /** Human-readable name: "HTTP Request Rate" */
  name: string;
  /** ClickHouse metric_name column value */
  metricName: string;
  /** PromQL expression */
  promql: string;
  /** TFQL expression */
  tfql: string;
  /** Display unit: "req/s" | "ms" | "%" | "count" | "bytes" */
  unit: string;
  /** What this metric measures */
  description: string;
}

/** A template metric query (per-entity, uses {{placeholders}}) */
export interface MetricQueryTemplate {
  /** Unique ID: "trace-red.rate" */
  id: string;
  /** Human-readable name */
  name: string;
  /** PromQL with {{placeholders}} */
  promqlTemplate: string;
  /** TFQL with {{placeholders}} */
  tfqlTemplate: string;
  /** Display unit */
  unit: string;
  /** What this metric measures */
  description: string;
}

/** A group of template metrics for a specific signal source */
export interface MetricGroupTemplate {
  /** Signal source identifier */
  signal: string;
  /** Entity type: "service" | "monitor" | "node" | "connection" */
  entityType: string;
  /** How many metric series each entity produces */
  metricsPerEntity: number;
  /** The template definitions */
  metrics: MetricQueryTemplate[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: flatten nested OTEL constant objects to MetricQueryDef[]
// ═══════════════════════════════════════════════════════════════════════════════

function flattenOtelMetrics(
  prefix: string,
  obj: Record<string, Record<string, string>>,
  unitMap: Record<string, string> = {},
  defaultUnit = "count",
): MetricQueryDef[] {
  const result: MetricQueryDef[] = [];
  for (const [category, metrics] of Object.entries(obj)) {
    for (const [key, metricName] of Object.entries(metrics)) {
      const id = `${prefix}.${category.toLowerCase()}.${key.toLowerCase()}`;
      const promqlName = metricName.replace(/\./g, "_");
      const unit = unitMap[metricName] || defaultUnit;
      result.push({
        id,
        name: `${category} ${key.replace(/_/g, " ")}`,
        metricName,
        promql: promqlName,
        tfql: `FETCH metrics WHERE metric_name = '${metricName}' AGGREGATE avg(value) INTERVAL {{interval}}`,
        unit,
        description: `${prefix.toUpperCase()} metric: ${metricName}`,
      });
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section A: OTLP Application Metrics (19 concrete entries from APP_METRICS)
// ═══════════════════════════════════════════════════════════════════════════════

const APP_UNIT_MAP: Record<string, string> = {
  [APP_METRICS.HTTP.REQUEST_TOTAL]: "req/s",
  [APP_METRICS.HTTP.REQUEST_DURATION]: "ms",
  [APP_METRICS.HTTP.REQUEST_SIZE]: "bytes",
  [APP_METRICS.HTTP.RESPONSE_SIZE]: "bytes",
  [APP_METRICS.HTTP.ACTIVE_REQUESTS]: "count",
  [APP_METRICS.RPC.REQUEST_TOTAL]: "req/s",
  [APP_METRICS.RPC.REQUEST_DURATION]: "ms",
  [APP_METRICS.DB.CLIENT_OPERATION_DURATION]: "ms",
  [APP_METRICS.DB.CLIENT_CONNECTIONS_USAGE]: "count",
  [APP_METRICS.DB.CLIENT_CONNECTIONS_MAX]: "count",
  [APP_METRICS.MESSAGING.PUBLISH_DURATION]: "ms",
  [APP_METRICS.MESSAGING.RECEIVE_DURATION]: "ms",
  [APP_METRICS.MESSAGING.PROCESS_DURATION]: "ms",
  [APP_METRICS.MESSAGING.MESSAGE_COUNT]: "count",
  [APP_METRICS.RUNTIME.GC_PAUSE_TIME]: "ms",
  [APP_METRICS.RUNTIME.GC_COUNT]: "count",
  [APP_METRICS.RUNTIME.MEMORY_USAGE]: "bytes",
  [APP_METRICS.RUNTIME.CPU_TIME]: "s",
  [APP_METRICS.RUNTIME.THREAD_COUNT]: "count",
};

export const OTLP_METRIC_QUERIES: MetricQueryDef[] = flattenOtelMetrics(
  "otlp",
  APP_METRICS as unknown as Record<string, Record<string, string>>,
  APP_UNIT_MAP,
  "count",
);

// ═══════════════════════════════════════════════════════════════════════════════
// Section B: Trace-Derived RED Metrics (8 templates per service)
// ═══════════════════════════════════════════════════════════════════════════════

export const TRACE_RED_INVENTORY: MetricGroupTemplate = {
  signal: "trace-red",
  entityType: "service",
  metricsPerEntity: 8,
  metrics: [
    {
      id: "trace-red.rate",
      name: "Request Rate",
      promqlTemplate:
        'sum(rate(traces_total{service_name="{{service_name}}"}[5m]))',
      tfqlTemplate:
        "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE rate(*) INTERVAL {{interval}}",
      unit: "req/s",
      description: "Trace-derived request rate per service",
    },
    {
      id: "trace-red.error_rate",
      name: "Error Rate",
      promqlTemplate:
        'sum(rate(traces_total{service_name="{{service_name}}", status_code="ERROR"}[5m])) / sum(rate(traces_total{service_name="{{service_name}}"}[5m])) * 100',
      tfqlTemplate:
        "FETCH traces WHERE service_name = '{{service_name}}' AND status_code = 'ERROR' AGGREGATE rate(*) INTERVAL {{interval}}",
      unit: "%",
      description: "Trace-derived error rate per service",
    },
    {
      id: "trace-red.avg",
      name: "Avg Duration",
      promqlTemplate:
        'avg(trace_duration_ms{service_name="{{service_name}}"})',
      tfqlTemplate:
        "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE avg(duration_ns) / 1000000 INTERVAL {{interval}}",
      unit: "ms",
      description: "Trace-derived average duration per service",
    },
    {
      id: "trace-red.p50",
      name: "P50 Latency",
      promqlTemplate:
        'histogram_quantile(0.5, sum(rate(trace_duration_ms_bucket{service_name="{{service_name}}"}[5m])) by (le))',
      tfqlTemplate:
        "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE p50(duration_ns) / 1000000 INTERVAL {{interval}}",
      unit: "ms",
      description: "Trace-derived P50 latency per service",
    },
    {
      id: "trace-red.p75",
      name: "P75 Latency",
      promqlTemplate:
        'histogram_quantile(0.75, sum(rate(trace_duration_ms_bucket{service_name="{{service_name}}"}[5m])) by (le))',
      tfqlTemplate:
        "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE p75(duration_ns) / 1000000 INTERVAL {{interval}}",
      unit: "ms",
      description: "Trace-derived P75 latency per service",
    },
    {
      id: "trace-red.p90",
      name: "P90 Latency",
      promqlTemplate:
        'histogram_quantile(0.9, sum(rate(trace_duration_ms_bucket{service_name="{{service_name}}"}[5m])) by (le))',
      tfqlTemplate:
        "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE p90(duration_ns) / 1000000 INTERVAL {{interval}}",
      unit: "ms",
      description: "Trace-derived P90 latency per service",
    },
    {
      id: "trace-red.p95",
      name: "P95 Latency",
      promqlTemplate:
        'histogram_quantile(0.95, sum(rate(trace_duration_ms_bucket{service_name="{{service_name}}"}[5m])) by (le))',
      tfqlTemplate:
        "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE p95(duration_ns) / 1000000 INTERVAL {{interval}}",
      unit: "ms",
      description: "Trace-derived P95 latency per service",
    },
    {
      id: "trace-red.p99",
      name: "P99 Latency",
      promqlTemplate:
        'histogram_quantile(0.99, sum(rate(trace_duration_ms_bucket{service_name="{{service_name}}"}[5m])) by (le))',
      tfqlTemplate:
        "FETCH traces WHERE service_name = '{{service_name}}' AGGREGATE p99(duration_ns) / 1000000 INTERVAL {{interval}}",
      unit: "ms",
      description: "Trace-derived P99 latency per service",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Section C: Log-Derived Volume Metrics (1 template per service×severity)
// ═══════════════════════════════════════════════════════════════════════════════

export const LOG_VOLUME_INVENTORY: MetricGroupTemplate = {
  signal: "log-volume",
  entityType: "service-severity",
  metricsPerEntity: 1,
  metrics: [
    {
      id: "log-volume.count",
      name: "Log Volume",
      promqlTemplate:
        'count_over_time({service_name="{{service_name}}", severity_text="{{severity}}"}[5m])',
      tfqlTemplate:
        "FETCH logs WHERE service_name = '{{service_name}}' AND severity_text = '{{severity}}' AGGREGATE count(*) INTERVAL {{interval}}",
      unit: "logs/s",
      description: "Log volume per service and severity",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Section D: Kubernetes Metrics (76 concrete entries)
// ═══════════════════════════════════════════════════════════════════════════════

const K8S_UNIT_MAP: Record<string, string> = {
  // Cluster
  [K8S_METRICS.CLUSTER.NODE_COUNT]: "count",
  [K8S_METRICS.CLUSTER.POD_COUNT]: "count",
  [K8S_METRICS.CLUSTER.NAMESPACE_COUNT]: "count",
  [K8S_METRICS.CLUSTER.DEPLOYMENT_COUNT]: "count",
  // Node CPU/Memory
  [K8S_METRICS.NODE.CPU_UTILIZATION]: "%",
  [K8S_METRICS.NODE.CPU_TIME]: "s",
  [K8S_METRICS.NODE.CPU_USAGE]: "cores",
  [K8S_METRICS.NODE.MEMORY_AVAILABLE]: "bytes",
  [K8S_METRICS.NODE.MEMORY_USAGE]: "bytes",
  [K8S_METRICS.NODE.MEMORY_RSS]: "bytes",
  [K8S_METRICS.NODE.MEMORY_WORKING_SET]: "bytes",
  [K8S_METRICS.NODE.FILESYSTEM_AVAILABLE]: "bytes",
  [K8S_METRICS.NODE.FILESYSTEM_CAPACITY]: "bytes",
  [K8S_METRICS.NODE.FILESYSTEM_USAGE]: "bytes",
  [K8S_METRICS.NODE.NETWORK_IO]: "bytes/s",
  [K8S_METRICS.NODE.NETWORK_ERRORS]: "count",
  [K8S_METRICS.NODE.ALLOCATABLE_CPU]: "cores",
  [K8S_METRICS.NODE.ALLOCATABLE_MEMORY]: "bytes",
  // Pod
  [K8S_METRICS.POD.CPU_UTILIZATION]: "%",
  [K8S_METRICS.POD.CPU_TIME]: "s",
  [K8S_METRICS.POD.CPU_USAGE]: "cores",
  [K8S_METRICS.POD.MEMORY_USAGE]: "bytes",
  [K8S_METRICS.POD.MEMORY_RSS]: "bytes",
  [K8S_METRICS.POD.MEMORY_WORKING_SET]: "bytes",
  [K8S_METRICS.POD.MEMORY_LIMIT_UTILIZATION]: "%",
  [K8S_METRICS.POD.NETWORK_IO]: "bytes/s",
  [K8S_METRICS.POD.NETWORK_ERRORS]: "count",
  [K8S_METRICS.POD.UPTIME]: "s",
  // Container
  [K8S_METRICS.CONTAINER.CPU_UTILIZATION]: "%",
  [K8S_METRICS.CONTAINER.CPU_TIME]: "s",
  [K8S_METRICS.CONTAINER.CPU_USAGE]: "cores",
  [K8S_METRICS.CONTAINER.MEMORY_USAGE]: "bytes",
  [K8S_METRICS.CONTAINER.MEMORY_RSS]: "bytes",
  [K8S_METRICS.CONTAINER.MEMORY_WORKING_SET]: "bytes",
  [K8S_METRICS.CONTAINER.MEMORY_LIMIT_UTILIZATION]: "%",
  [K8S_METRICS.CONTAINER.FILESYSTEM_AVAILABLE]: "bytes",
  [K8S_METRICS.CONTAINER.FILESYSTEM_CAPACITY]: "bytes",
  [K8S_METRICS.CONTAINER.FILESYSTEM_USAGE]: "bytes",
  [K8S_METRICS.CONTAINER.RESTARTS]: "count",
  [K8S_METRICS.CONTAINER.UPTIME]: "s",
  // Deployment
  [K8S_METRICS.DEPLOYMENT.DESIRED]: "count",
  [K8S_METRICS.DEPLOYMENT.AVAILABLE]: "count",
  [K8S_METRICS.DEPLOYMENT.READY]: "count",
  [K8S_METRICS.DEPLOYMENT.UPDATED]: "count",
  [K8S_METRICS.DEPLOYMENT.UNAVAILABLE]: "count",
  // Namespace
  [K8S_METRICS.NAMESPACE.POD_COUNT]: "count",
  [K8S_METRICS.NAMESPACE.CPU_USAGE]: "cores",
  [K8S_METRICS.NAMESPACE.CPU_LIMIT]: "cores",
  [K8S_METRICS.NAMESPACE.CPU_REQUEST]: "cores",
  [K8S_METRICS.NAMESPACE.MEMORY_USAGE]: "bytes",
  [K8S_METRICS.NAMESPACE.MEMORY_LIMIT]: "bytes",
  [K8S_METRICS.NAMESPACE.MEMORY_REQUEST]: "bytes",
};

export const K8S_METRIC_QUERIES: MetricQueryDef[] = flattenOtelMetrics(
  "k8s",
  K8S_METRICS as unknown as Record<string, Record<string, string>>,
  K8S_UNIT_MAP,
  "count",
);

// ═══════════════════════════════════════════════════════════════════════════════
// Section E: VM/Infrastructure Metrics (45 concrete entries)
// ═══════════════════════════════════════════════════════════════════════════════

const VM_UNIT_MAP: Record<string, string> = {
  [VM_METRICS.CPU.UTILIZATION]: "%",
  [VM_METRICS.CPU.TIME]: "s",
  [VM_METRICS.CPU.LOAD_1M]: "load",
  [VM_METRICS.CPU.LOAD_5M]: "load",
  [VM_METRICS.CPU.LOAD_15M]: "load",
  [VM_METRICS.MEMORY.UTILIZATION]: "%",
  [VM_METRICS.MEMORY.USAGE]: "bytes",
  [VM_METRICS.MEMORY.LIMIT]: "bytes",
  [VM_METRICS.MEMORY.AVAILABLE]: "bytes",
  [VM_METRICS.MEMORY.CACHED]: "bytes",
  [VM_METRICS.MEMORY.BUFFERED]: "bytes",
  [VM_METRICS.DISK.IO]: "bytes/s",
  [VM_METRICS.DISK.IO_READ]: "bytes/s",
  [VM_METRICS.DISK.IO_WRITE]: "bytes/s",
  [VM_METRICS.DISK.OPERATIONS]: "ops/s",
  [VM_METRICS.DISK.OPERATIONS_READ]: "ops/s",
  [VM_METRICS.DISK.OPERATIONS_WRITE]: "ops/s",
  [VM_METRICS.DISK.IO_TIME]: "ms",
  [VM_METRICS.DISK.OPERATION_TIME]: "ms",
  [VM_METRICS.FILESYSTEM.USAGE]: "bytes",
  [VM_METRICS.FILESYSTEM.UTILIZATION]: "%",
  [VM_METRICS.NETWORK.IO]: "bytes/s",
  [VM_METRICS.NETWORK.IO_RECEIVE]: "bytes/s",
  [VM_METRICS.NETWORK.IO_TRANSMIT]: "bytes/s",
  [VM_METRICS.NETWORK.PACKETS]: "pkt/s",
  [VM_METRICS.NETWORK.PACKETS_RECEIVE]: "pkt/s",
  [VM_METRICS.NETWORK.PACKETS_TRANSMIT]: "pkt/s",
  [VM_METRICS.NETWORK.ERRORS]: "count",
  [VM_METRICS.NETWORK.DROPPED]: "count",
  [VM_METRICS.NETWORK.CONNECTIONS]: "count",
  [VM_METRICS.PROCESS.COUNT]: "count",
  [VM_METRICS.PROCESS.CREATED]: "count",
  [VM_METRICS.PAGING.USAGE]: "bytes",
  [VM_METRICS.PAGING.UTILIZATION]: "%",
  [VM_METRICS.PAGING.FAULTS]: "count",
  [VM_METRICS.PAGING.OPERATIONS]: "ops/s",
};

export const VM_METRIC_QUERIES: MetricQueryDef[] = flattenOtelMetrics(
  "vm",
  VM_METRICS as unknown as Record<string, Record<string, string>>,
  VM_UNIT_MAP,
  "count",
);

// ═══════════════════════════════════════════════════════════════════════════════
// Section F: Uptime Metrics (3 templates per monitor)
// ═══════════════════════════════════════════════════════════════════════════════

export const UPTIME_INVENTORY: MetricGroupTemplate = {
  signal: "uptime",
  entityType: "monitor",
  metricsPerEntity: 3,
  metrics: [
    {
      id: "uptime.status",
      name: "Monitor Status",
      promqlTemplate:
        'uptime_check_status{monitor_id="{{monitor_id}}"}',
      tfqlTemplate:
        "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE last(status) INTERVAL {{interval}}",
      unit: "",
      description: "Uptime monitor status (success/failure/timeout)",
    },
    {
      id: "uptime.response_time",
      name: "Response Time",
      promqlTemplate:
        'uptime_check_response_time{monitor_id="{{monitor_id}}"}',
      tfqlTemplate:
        "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE avg(response_time) INTERVAL {{interval}}",
      unit: "ms",
      description: "Uptime monitor average response time",
    },
    {
      id: "uptime.availability",
      name: "Availability",
      promqlTemplate:
        'avg_over_time(uptime_check_status{monitor_id="{{monitor_id}}"}[24h]) * 100',
      tfqlTemplate:
        "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE avg(status) * 100 INTERVAL {{interval}}",
      unit: "%",
      description: "Uptime monitor availability percentage",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Section G: Service Map Metrics (5 templates per service)
// ═══════════════════════════════════════════════════════════════════════════════

export const SVCMAP_INVENTORY: MetricGroupTemplate = {
  signal: "service-map",
  entityType: "service",
  metricsPerEntity: 5,
  metrics: [
    {
      id: "svcmap.health_score",
      name: "Health Score",
      promqlTemplate:
        'service_map_health_score{service_id="{{service_id}}"}',
      tfqlTemplate:
        "FETCH service_map_metrics WHERE service_id = '{{service_id}}' AGGREGATE avg(health_score) INTERVAL {{interval}}",
      unit: "%",
      description: "Service health score (0-100)",
    },
    {
      id: "svcmap.uptime",
      name: "Service Uptime",
      promqlTemplate:
        'service_map_uptime{service_id="{{service_id}}"}',
      tfqlTemplate:
        "FETCH service_map_metrics WHERE service_id = '{{service_id}}' AGGREGATE avg(uptime) INTERVAL {{interval}}",
      unit: "%",
      description: "Service uptime percentage",
    },
    {
      id: "svcmap.avg_latency",
      name: "Average Latency",
      promqlTemplate:
        'service_map_avg_latency{service_id="{{service_id}}"}',
      tfqlTemplate:
        "FETCH service_map_metrics WHERE service_id = '{{service_id}}' AGGREGATE avg(avg_latency) INTERVAL {{interval}}",
      unit: "ms",
      description: "Service average latency",
    },
    {
      id: "svcmap.error_rate",
      name: "Error Rate",
      promqlTemplate:
        'service_map_error_rate{service_id="{{service_id}}"}',
      tfqlTemplate:
        "FETCH service_map_metrics WHERE service_id = '{{service_id}}' AGGREGATE avg(error_rate) INTERVAL {{interval}}",
      unit: "%",
      description: "Service error rate",
    },
    {
      id: "svcmap.request_rate",
      name: "Request Rate",
      promqlTemplate:
        'service_map_request_rate{service_id="{{service_id}}"}',
      tfqlTemplate:
        "FETCH service_map_metrics WHERE service_id = '{{service_id}}' AGGREGATE avg(request_rate) INTERVAL {{interval}}",
      unit: "req/s",
      description: "Service request rate",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Section H: Network Map Node Metrics (8 templates per node)
// ═══════════════════════════════════════════════════════════════════════════════

export const NETNODE_INVENTORY: MetricGroupTemplate = {
  signal: "network-node",
  entityType: "node",
  metricsPerEntity: 8,
  metrics: [
    {
      id: "netnode.cpu_usage",
      name: "CPU Usage",
      promqlTemplate:
        'network_node_cpu_usage{node_id="{{node_id}}"}',
      tfqlTemplate:
        "FETCH network_map_traffic WHERE node_id = '{{node_id}}' AGGREGATE avg(cpu_usage) INTERVAL {{interval}}",
      unit: "%",
      description: "Network node CPU usage",
    },
    {
      id: "netnode.memory_usage",
      name: "Memory Usage",
      promqlTemplate:
        'network_node_memory_usage{node_id="{{node_id}}"}',
      tfqlTemplate:
        "FETCH network_map_traffic WHERE node_id = '{{node_id}}' AGGREGATE avg(memory_usage) INTERVAL {{interval}}",
      unit: "%",
      description: "Network node memory usage",
    },
    {
      id: "netnode.disk_usage",
      name: "Disk Usage",
      promqlTemplate:
        'network_node_disk_usage{node_id="{{node_id}}"}',
      tfqlTemplate:
        "FETCH network_map_traffic WHERE node_id = '{{node_id}}' AGGREGATE avg(disk_usage) INTERVAL {{interval}}",
      unit: "%",
      description: "Network node disk usage",
    },
    {
      id: "netnode.network_in",
      name: "Network In",
      promqlTemplate:
        'network_node_network_in{node_id="{{node_id}}"}',
      tfqlTemplate:
        "FETCH network_map_traffic WHERE node_id = '{{node_id}}' AGGREGATE avg(network_in) INTERVAL {{interval}}",
      unit: "bytes/s",
      description: "Network node inbound traffic",
    },
    {
      id: "netnode.network_out",
      name: "Network Out",
      promqlTemplate:
        'network_node_network_out{node_id="{{node_id}}"}',
      tfqlTemplate:
        "FETCH network_map_traffic WHERE node_id = '{{node_id}}' AGGREGATE avg(network_out) INTERVAL {{interval}}",
      unit: "bytes/s",
      description: "Network node outbound traffic",
    },
    {
      id: "netnode.active_connections",
      name: "Active Connections",
      promqlTemplate:
        'network_node_active_connections{node_id="{{node_id}}"}',
      tfqlTemplate:
        "FETCH network_map_traffic WHERE node_id = '{{node_id}}' AGGREGATE avg(active_connections) INTERVAL {{interval}}",
      unit: "count",
      description: "Network node active connections",
    },
    {
      id: "netnode.request_rate",
      name: "Request Rate",
      promqlTemplate:
        'network_node_request_rate{node_id="{{node_id}}"}',
      tfqlTemplate:
        "FETCH network_map_traffic WHERE node_id = '{{node_id}}' AGGREGATE avg(request_rate) INTERVAL {{interval}}",
      unit: "req/s",
      description: "Network node request rate",
    },
    {
      id: "netnode.error_rate",
      name: "Error Rate",
      promqlTemplate:
        'network_node_error_rate{node_id="{{node_id}}"}',
      tfqlTemplate:
        "FETCH network_map_traffic WHERE node_id = '{{node_id}}' AGGREGATE avg(error_rate) INTERVAL {{interval}}",
      unit: "%",
      description: "Network node error rate",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Section I: Network Map Connection Metrics (7 templates per connection)
// ═══════════════════════════════════════════════════════════════════════════════

export const NETCONN_INVENTORY: MetricGroupTemplate = {
  signal: "network-connection",
  entityType: "connection",
  metricsPerEntity: 7,
  metrics: [
    {
      id: "netconn.bandwidth",
      name: "Bandwidth",
      promqlTemplate:
        'network_connection_bandwidth{connection_id="{{connection_id}}"}',
      tfqlTemplate:
        "FETCH network_map_connection_metrics WHERE connection_id = '{{connection_id}}' AGGREGATE avg(bandwidth) INTERVAL {{interval}}",
      unit: "bits/s",
      description: "Network connection bandwidth",
    },
    {
      id: "netconn.latency",
      name: "Latency",
      promqlTemplate:
        'network_connection_latency{connection_id="{{connection_id}}"}',
      tfqlTemplate:
        "FETCH network_map_connection_metrics WHERE connection_id = '{{connection_id}}' AGGREGATE avg(latency) INTERVAL {{interval}}",
      unit: "ms",
      description: "Network connection latency",
    },
    {
      id: "netconn.packet_loss",
      name: "Packet Loss",
      promqlTemplate:
        'network_connection_packet_loss{connection_id="{{connection_id}}"}',
      tfqlTemplate:
        "FETCH network_map_connection_metrics WHERE connection_id = '{{connection_id}}' AGGREGATE avg(packet_loss) INTERVAL {{interval}}",
      unit: "%",
      description: "Network connection packet loss",
    },
    {
      id: "netconn.bytes_sent",
      name: "Bytes Sent",
      promqlTemplate:
        'network_connection_bytes_sent{connection_id="{{connection_id}}"}',
      tfqlTemplate:
        "FETCH network_map_connection_metrics WHERE connection_id = '{{connection_id}}' AGGREGATE sum(bytes_sent) INTERVAL {{interval}}",
      unit: "bytes",
      description: "Network connection bytes sent",
    },
    {
      id: "netconn.bytes_received",
      name: "Bytes Received",
      promqlTemplate:
        'network_connection_bytes_received{connection_id="{{connection_id}}"}',
      tfqlTemplate:
        "FETCH network_map_connection_metrics WHERE connection_id = '{{connection_id}}' AGGREGATE sum(bytes_received) INTERVAL {{interval}}",
      unit: "bytes",
      description: "Network connection bytes received",
    },
    {
      id: "netconn.packets_sent",
      name: "Packets Sent",
      promqlTemplate:
        'network_connection_packets_sent{connection_id="{{connection_id}}"}',
      tfqlTemplate:
        "FETCH network_map_connection_metrics WHERE connection_id = '{{connection_id}}' AGGREGATE sum(packets_sent) INTERVAL {{interval}}",
      unit: "pkt/s",
      description: "Network connection packets sent",
    },
    {
      id: "netconn.packets_received",
      name: "Packets Received",
      promqlTemplate:
        'network_connection_packets_received{connection_id="{{connection_id}}"}',
      tfqlTemplate:
        "FETCH network_map_connection_metrics WHERE connection_id = '{{connection_id}}' AGGREGATE sum(packets_received) INTERVAL {{interval}}",
      unit: "pkt/s",
      description: "Network connection packets received",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Aggregates & Helpers
// ═══════════════════════════════════════════════════════════════════════════════

/** All concrete (non-template) metric queries */
export const ALL_CONCRETE_METRICS: MetricQueryDef[] = [
  ...OTLP_METRIC_QUERIES,
  ...K8S_METRIC_QUERIES,
  ...VM_METRIC_QUERIES,
];

/** All template-based metric groups */
export const ALL_METRIC_TEMPLATES: MetricGroupTemplate[] = [
  TRACE_RED_INVENTORY,
  LOG_VOLUME_INVENTORY,
  UPTIME_INVENTORY,
  SVCMAP_INVENTORY,
  NETNODE_INVENTORY,
  NETCONN_INVENTORY,
];

/** Count of fixed concrete metrics (not entity-dependent) */
export const CONCRETE_METRIC_COUNT = ALL_CONCRETE_METRICS.length;

/** Mock entity counts (from seed data) */
export const MOCK_ENTITY_COUNTS = {
  traceServices: 6,
  logServiceSeverityPairs: 24, // 6 services × 4 common severities
  uptimeMonitors: 5,
  svcmapServices: 12,
  networkNodes: 12,
  networkConnections: 13,
};

/** Compute total metric count from inventory + entity counts */
export function computeMockMetricCount(
  entities: typeof MOCK_ENTITY_COUNTS = MOCK_ENTITY_COUNTS,
): number {
  return (
    CONCRETE_METRIC_COUNT +
    entities.traceServices * TRACE_RED_INVENTORY.metricsPerEntity +
    entities.logServiceSeverityPairs * LOG_VOLUME_INVENTORY.metricsPerEntity +
    entities.uptimeMonitors * UPTIME_INVENTORY.metricsPerEntity +
    entities.svcmapServices * SVCMAP_INVENTORY.metricsPerEntity +
    entities.networkNodes * NETNODE_INVENTORY.metricsPerEntity +
    entities.networkConnections * NETCONN_INVENTORY.metricsPerEntity
  );
}

// Build lookup index for fast access
const _concreteIndex = new Map<string, MetricQueryDef>();
for (const m of ALL_CONCRETE_METRICS) _concreteIndex.set(m.id, m);

const _templateIndex = new Map<string, MetricQueryTemplate>();
for (const group of ALL_METRIC_TEMPLATES) {
  for (const t of group.metrics) _templateIndex.set(t.id, t);
}

/** Lookup a metric query by ID (concrete or template) */
export function getMetricQuery(
  id: string,
): MetricQueryDef | MetricQueryTemplate | undefined {
  return _concreteIndex.get(id) ?? _templateIndex.get(id);
}

/** Get all concrete metrics for a given prefix (e.g., "k8s", "vm", "otlp") */
export function getMetricsByPrefix(prefix: string): MetricQueryDef[] {
  return ALL_CONCRETE_METRICS.filter((m) => m.id.startsWith(prefix + "."));
}

/** Get a template group by signal name */
export function getTemplateGroup(
  signal: string,
): MetricGroupTemplate | undefined {
  return ALL_METRIC_TEMPLATES.find((g) => g.signal === signal);
}
