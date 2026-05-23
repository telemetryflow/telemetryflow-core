/**
 * TFO-Collector configuration
 */

import type { CollectorConfig } from "@/types";
import { config } from "./index";

export const defaultCollectorConfig: CollectorConfig = {
  httpEndpoint: config.apiUrl,
  grpcEndpoint: config.grpcUrl,
  wsEndpoint: config.wsUrl,
  streaming: true,
  refreshInterval: config.refreshInterval,
};

export const COLLECTOR_ENDPOINTS = {
  // Metrics — backend: @Controller("telemetry/metrics")
  METRICS: "/api/v2/telemetry/metrics",
  METRICS_QUERY: "/api/v2/telemetry/metrics/query",
  METRICS_STATS: "/api/v2/telemetry/metrics/stats",
  METRICS_LABELS: "/api/v2/telemetry/metrics/labels",
  METRICS_METADATA: "/api/v2/telemetry/metrics/metadata",
  METRICS_TABLE: "/api/v2/telemetry/metrics/table",
  METRICS_GRAPH: "/api/v2/telemetry/metrics/graph",
  METRICS_GRAPH_PERCENTILES: "/api/v2/telemetry/metrics/graph/percentiles",

  // Logs — backend: @Controller("telemetry/logs")
  LOGS: "/api/v2/telemetry/logs",
  LOGS_QUERY: "/api/v2/telemetry/logs/query",
  LOGS_STATS: "/api/v2/telemetry/logs/stats",
  LOGS_TAIL: "/api/v2/telemetry/logs/tail",
  LOGS_SERVICES: "/api/v2/telemetry/logs/services",
  LOGS_VOLUME: "/api/v2/telemetry/logs/volume",
  LOGS_TABLE: "/api/v2/telemetry/logs/table",
  LOGS_GRAPH: "/api/v2/telemetry/logs/graph",
  LOGS_PATTERNS: "/api/v2/telemetry/logs/patterns",
  LOGS_TOP_ERRORS: "/api/v2/telemetry/logs/top-errors",
  LOGS_SERVICE_BREAKDOWN: "/api/v2/telemetry/logs/service-breakdown",
  LOGS_SOURCES: "/api/v2/telemetry/logs/sources",

  // Traces — backend: @Controller("telemetry/traces")
  TRACES: "/api/v2/telemetry/traces",
  TRACES_QUERY: "/api/v2/telemetry/traces/query",
  TRACES_SUMMARIES: "/api/v2/telemetry/traces/summaries",
  TRACES_SERVICES: "/api/v2/telemetry/traces/services",
  TRACES_OPERATIONS: "/api/v2/telemetry/traces/operations",
  TRACES_DEPENDENCIES: "/api/v2/telemetry/traces/dependencies",
  TRACES_TABLE: "/api/v2/telemetry/traces/table",
  TRACES_STATS: "/api/v2/telemetry/traces/stats",
  TRACES_GRAPH: "/api/v2/telemetry/traces/graph",
  TRACES_GRAPH_LATENCY: "/api/v2/telemetry/traces/graph/latency",

  // Exemplars — backend: @Controller("telemetry/exemplars")
  EXEMPLARS: "/api/v2/telemetry/exemplars",
  EXEMPLARS_QUERY: "/api/v2/telemetry/exemplars/query",
  EXEMPLARS_GRAPH: "/api/v2/telemetry/exemplars/graph",
  EXEMPLARS_STATS: "/api/v2/telemetry/exemplars/stats",

  // Correlations — backend: @Controller("telemetry/correlations")
  CORRELATIONS: "/api/v2/telemetry/correlations",
  CORRELATIONS_TIMELINE: "/api/v2/telemetry/correlations/timeline",

  // Alerting — backend: @Controller("alert-instances")
  ALERT_INSTANCES: "/api/v2/alert-instances",
  ALERT_INSTANCES_STATS: "/api/v2/alert-instances/stats",

  // Status
  STATUS: "/api/v2/telemetry/status",
  HEALTH: "/health",

  // Kubernetes — backend: @Controller("monitoring/kubernetes")
  KUBERNETES_STATS: "/api/v2/monitoring/kubernetes/stats",
  KUBERNETES_CLUSTERS: "/api/v2/monitoring/kubernetes/clusters",
  KUBERNETES_OVERVIEW: "/api/v2/monitoring/kubernetes/overview",
  KUBERNETES_NAMESPACES: "/api/v2/monitoring/kubernetes/namespaces",
  KUBERNETES_NODES: "/api/v2/monitoring/kubernetes/nodes",
  KUBERNETES_PODS: "/api/v2/monitoring/kubernetes/pods",
  KUBERNETES_DEPLOYMENTS: "/api/v2/monitoring/kubernetes/deployments",
  KUBERNETES_PV: "/api/v2/monitoring/kubernetes/pv",
  KUBERNETES_API_SERVER: "/api/v2/monitoring/kubernetes/api-server",
  KUBERNETES_COREDNS: "/api/v2/monitoring/kubernetes/coredns",
} as const;

// Kubernetes cluster-scoped endpoint helpers (functions, so outside the const object)
export const K8S_CLUSTER_ENDPOINTS = {
  nodes: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/nodes`,
  pods: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/pods`,
  namespaces: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/namespaces`,
  deployments: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/deployments`,
  metrics: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/metrics`,
  nodeMetrics: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/metrics/nodes`,
  persistentVolumes: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/persistent-volumes`,
  persistentVolumeClaims: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/persistent-volume-claims`,
  pvMetrics: (clusterId: string, pvName: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/persistent-volumes/${encodeURIComponent(pvName)}/metrics`,
  logs: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/logs`,
  services: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/services`,
  endpoints: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/endpoints`,
  ingresses: (clusterId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/ingresses`,
  // Agent proxy endpoints
  podLogStream: (clusterId: string, namespace: string, pod: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/pods/${encodeURIComponent(namespace)}/${encodeURIComponent(pod)}/logs/stream`,
  // Detail/Describe endpoints
  podDetail: (clusterId: string, podId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/pods/${podId}`,
  nodeDetail: (clusterId: string, nodeId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/nodes/${nodeId}`,
  serviceDetail: (clusterId: string, serviceId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/services/${serviceId}`,
  ingressDetail: (clusterId: string, ingressId: string) =>
    `/api/v2/monitoring/kubernetes/clusters/${clusterId}/ingresses/${ingressId}`,
};

export const WS_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
  METRIC: "metric",
  LOG: "log",
  TRACE: "trace",
  EXEMPLAR: "exemplar",
  STATUS: "status",
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
} as const;
