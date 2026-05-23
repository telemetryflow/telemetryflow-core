/**
 * Telemetry Helper Types
 * Shared types and interfaces for telemetry data operations
 */

// Re-export K8s types from mocks (to avoid conflicts)
export type {
  K8sNode,
  K8sNodeEvent,
  K8sPod,
  K8sPodCondition,
  K8sContainer,
  K8sVolume,
  K8sVolumeMount,
  K8sPodEvent,
  K8sDeployment,
  K8sNamespace,
  K8sPersistentVolume,
  K8sClusterOverview,
  PodPhase,
  ContainerState,
} from '@/mocks/kubernetes';

// Import for local use
import type { K8sClusterOverview } from '@/mocks/kubernetes';

// Re-export existing types for convenience
export type {
  Metric,
  MetricType,
  MetricLabel,
  MetricDataPoint,
  MetricSeries,
  MetricQuery,
  MetricQueryResult,
  MetricMetadata,
  HistogramBucket,
  HistogramMetric,
  SummaryQuantile,
  SummaryMetric,
} from '@/types/metric';

export type {
  LogLevel,
  LogSeverityNumber,
  LogAttribute,
  LogRecord,
  LogQuery,
  LogQueryResult,
  LogStream,
  LogAggregation,
  LogPattern,
  FieldMetadata,
  FieldType,
} from '@/types/log';

export type {
  SpanKind,
  SpanStatusCode,
  SpanAttribute,
  SpanEvent,
  SpanLink,
  SpanStatus,
  Span,
  Trace,
  TraceQuery,
  TraceQueryResult,
  TraceSummary,
  TraceLatencyStats,
  ServiceDependency,
  ServiceOperation,
  MonitorMetrics,
  OperationMetrics,
} from '@/types/trace';

export type {
  Exemplar,
  ExemplarQuery,
  ExemplarQueryResult,
  ExemplarCorrelation,
  MetricExemplarSeries,
} from '@/types/exemplar';

export type {
  InfraVirtualMachine,
  InfraMetrics,
  AgentInfo,
  AgentSystemInfo,
  AgentHostMetrics,
  AgentHostContext,
  K8sNodeContext,
} from '@/types/agent';

export type {
  AlertRule,
  AlertCondition,
  AlertSeverity,
  Alert,
  AlertStatus,
  TimeRange as ApiTimeRange,
} from '@/types/api';

// Import alert types for local use in this file
import type {
  AlertCondition as LocalAlertCondition,
  AlertSeverity as LocalAlertSeverity,
  Alert as LocalAlert,
} from '@/types/api';

// ============================================
// Data Source Configuration
// ============================================

export type DataSourceType = 'mock' | 'otel-v1' | 'tfo-v2';

export interface DataSourceConfig {
  type: DataSourceType;
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// ============================================
// Universal Response Wrapper
// ============================================

export interface TelemetryResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  source: DataSourceType;
  timestamp: number;
}

// ============================================
// Time Range
// ============================================

export interface TimeRange {
  start: number;
  end: number;
}

// ============================================
// OTEL Resource Attributes
// ============================================

export interface OTELResource {
  'service.name': string;
  'service.namespace'?: string;
  'service.version'?: string;
  'service.instance.id'?: string;
  'host.name'?: string;
  'host.id'?: string;
  'host.type'?: string;
  'host.arch'?: string;
  'os.type'?: string;
  'os.description'?: string;
  'os.name'?: string;
  'os.version'?: string;
  'cloud.provider'?: string;
  'cloud.region'?: string;
  'cloud.availability_zone'?: string;
  'cloud.account.id'?: string;
  'cloud.platform'?: string;
  'k8s.cluster.name'?: string;
  'k8s.cluster.uid'?: string;
  'k8s.namespace.name'?: string;
  'k8s.pod.name'?: string;
  'k8s.pod.uid'?: string;
  'k8s.container.name'?: string;
  'k8s.node.name'?: string;
  'k8s.deployment.name'?: string;
  'k8s.replicaset.name'?: string;
  'k8s.daemonset.name'?: string;
  'k8s.statefulset.name'?: string;
  'k8s.job.name'?: string;
  'k8s.cronjob.name'?: string;
  'telemetry.sdk.name'?: string;
  'telemetry.sdk.language'?: string;
  'telemetry.sdk.version'?: string;
  [key: string]: string | number | boolean | undefined;
}

// ============================================
// OTEL v1 Protocol Types (for transformation)
// ============================================

export interface OTELv1Metric {
  name: string;
  description?: string;
  unit?: string;
  data: OTELv1MetricData;
}

export interface OTELv1MetricData {
  dataPoints: OTELv1NumberDataPoint[];
}

export interface OTELv1NumberDataPoint {
  attributes: OTELv1KeyValue[];
  startTimeUnixNano?: string;
  timeUnixNano: string;
  asDouble?: number;
  asInt?: string;
}

export interface OTELv1KeyValue {
  key: string;
  value: OTELv1AnyValue;
}

export interface OTELv1AnyValue {
  stringValue?: string;
  intValue?: string;
  doubleValue?: number;
  boolValue?: boolean;
  arrayValue?: { values: OTELv1AnyValue[] };
  kvlistValue?: { values: OTELv1KeyValue[] };
}

export interface OTELv1LogRecord {
  timeUnixNano: string;
  observedTimeUnixNano: string;
  severityNumber: number;
  severityText?: string;
  body: OTELv1AnyValue;
  attributes: OTELv1KeyValue[];
  droppedAttributesCount?: number;
  flags?: number;
  traceId?: string;
  spanId?: string;
}

export interface OTELv1Span {
  traceId: string;
  spanId: string;
  traceState?: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: OTELv1KeyValue[];
  droppedAttributesCount?: number;
  events: OTELv1SpanEvent[];
  droppedEventsCount?: number;
  links: OTELv1SpanLink[];
  droppedLinksCount?: number;
  status: OTELv1SpanStatus;
}

export interface OTELv1SpanEvent {
  timeUnixNano: string;
  name: string;
  attributes: OTELv1KeyValue[];
  droppedAttributesCount?: number;
}

export interface OTELv1SpanLink {
  traceId: string;
  spanId: string;
  traceState?: string;
  attributes: OTELv1KeyValue[];
  droppedAttributesCount?: number;
}

export interface OTELv1SpanStatus {
  code: number;
  message?: string;
}

// ============================================
// VM Metrics Types
// ============================================

export interface VMMetricsBundle {
  hostname: string;
  timestamp: number;
  cpu: VMCPUMetrics;
  memory: VMMemoryMetrics;
  disk: VMDiskMetrics[];
  network: VMNetworkMetrics[];
}

export interface VMCPUMetrics {
  utilization: number;
  user: number;
  system: number;
  idle: number;
  iowait: number;
  loadAverage: {
    load1m: number;
    load5m: number;
    load15m: number;
  };
  cores: number;
}

export interface VMMemoryMetrics {
  total: number;
  used: number;
  available: number;
  free: number;
  cached: number;
  buffered: number;
  utilization: number;
}

export interface VMDiskMetrics {
  device: string;
  mountpoint: string;
  fstype: string;
  total: number;
  used: number;
  available: number;
  utilization: number;
  iops: {
    read: number;
    write: number;
  };
  throughput: {
    read: number;
    write: number;
  };
}

export interface VMNetworkMetrics {
  interface: string;
  bytesReceived: number;
  bytesTransmitted: number;
  packetsReceived: number;
  packetsTransmitted: number;
  errorsReceive: number;
  errorsTransmit: number;
  dropsReceive: number;
  dropsTransmit: number;
}

export interface VMInfo {
  id: string;
  hostname: string;
  os: string;
  platform: string;
  status: 'running' | 'stopped' | 'pending' | 'terminated';
  provider?: string;
  region?: string;
  instanceType?: string;
  publicIp?: string;
  privateIp?: string;
  uptime: number;
  lastSeen: number;
}

// ============================================
// Kubernetes Types
// ============================================

// Import K8s types for use in this file
import type {
  K8sNode as ImportedK8sNode,
  K8sNamespace as ImportedK8sNamespace,
  K8sPod as ImportedK8sPod,
  K8sDeployment as ImportedK8sDeployment,
} from '@/mocks/kubernetes';

export interface K8sClusterData {
  cluster: string;
  region?: string;
  provider?: string;
  version?: string;
  nodes: ImportedK8sNode[];
  namespaces: ImportedK8sNamespace[];
  pods: ImportedK8sPod[];
  deployments: ImportedK8sDeployment[];
  metrics: K8sClusterMetrics;
}

export interface K8sClusterMetrics {
  nodeCount: number;
  nodeReady: number;
  podCount: number;
  podRunning: number;
  podPending: number;
  podFailed: number;
  namespaceCount: number;
  deploymentCount: number;
  cpuCapacity: number;
  cpuUsed: number;
  cpuUtilization: number;
  memoryCapacity: number;
  memoryUsed: number;
  memoryUtilization: number;
}

// NOTE: K8s types are now imported from @/mocks/kubernetes
// These definitions are kept for reference but commented out to avoid conflicts
/*
export interface K8sNode {
  name: string;
  uid: string;
  status: 'Ready' | 'NotReady' | 'Unknown';
  roles: string[];
  version: string;
  containerRuntime: string;
  internalIP: string;
  externalIP?: string;
  os: string;
  arch: string;
  capacity: {
    cpu: number;
    memory: number;
    pods: number;
  };
  allocatable: {
    cpu: number;
    memory: number;
    pods: number;
  };
  usage: {
    cpu: number;
    memory: number;
    pods: number;
  };
  conditions: {
    ready: boolean;
    diskPressure: boolean;
    memoryPressure: boolean;
    pidPressure: boolean;
    networkUnavailable: boolean;
  };
  createdAt: number;
}
*/

export interface K8sNodeMetrics {
  name: string;
  cpuUtilization: number;
  cpuUsage: number;
  cpuCapacity: number;
  memoryUtilization: number;
  memoryUsage: number;
  memoryCapacity: number;
  podCount: number;
  podCapacity: number;
  networkReceive: number;
  networkTransmit: number;
  diskUsage: number;
  diskCapacity: number;
}

// NOTE: K8s types are imported from @/mocks/kubernetes
// These definitions are commented out to avoid conflicts
/*
export interface K8sNamespace {
  name: string;
  uid: string;
  status: 'Active' | 'Terminating';
  labels: Record<string, string>;
  annotations: Record<string, string>;
  resourceQuota?: K8sResourceQuota;
  limitRange?: K8sLimitRange;
  podCount: number;
  createdAt: number;
}

export interface K8sResourceQuota {
  cpuLimit: number;
  cpuUsed: number;
  memoryLimit: number;
  memoryUsed: number;
  podLimit: number;
  podUsed: number;
}

export interface K8sLimitRange {
  defaultCpu: number;
  defaultMemory: number;
  maxCpu: number;
  maxMemory: number;
}
*/

export interface K8sNamespaceMetrics {
  name: string;
  podCount: number;
  podRunning: number;
  podPending: number;
  podFailed: number;
  cpuUsage: number;
  cpuLimit: number;
  cpuUtilization: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryUtilization: number;
}

/*
export interface K8sPod {
  name: string;
  uid: string;
  namespace: string;
  nodeName: string;
  status: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
  phase: string;
  ip: string;
  hostIP: string;
  containers: K8sContainer[];
  restartCount: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  ownerKind?: string;
  ownerName?: string;
  createdAt: number;
  startedAt?: number;
}

export interface K8sContainer {
  name: string;
  image: string;
  imageId: string;
  ready: boolean;
  restartCount: number;
  state: 'running' | 'waiting' | 'terminated';
  stateReason?: string;
  ports: { containerPort: number; protocol: string }[];
  resources: {
    requests: { cpu: number; memory: number };
    limits: { cpu: number; memory: number };
  };
}
*/

export interface K8sPodMetrics {
  name: string;
  namespace: string;
  cpuUsage: number;
  cpuRequest: number;
  cpuLimit: number;
  cpuUtilization: number;
  memoryUsage: number;
  memoryRequest: number;
  memoryLimit: number;
  memoryUtilization: number;
  networkReceive: number;
  networkTransmit: number;
  restartCount: number;
}

/*
export interface K8sDeployment {
  name: string;
  uid: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  unavailableReplicas: number;
  strategy: string;
  labels: Record<string, string>;
  selector: Record<string, string>;
  containers: { name: string; image: string }[];
  createdAt: number;
  updatedAt: number;
}
*/

export interface K8sDeploymentMetrics {
  name: string;
  namespace: string;
  desired: number;
  ready: number;
  available: number;
  updated: number;
  unavailable: number;
  cpuUsage: number;
  memoryUsage: number;
}

// NOTE: K8sOverview is now imported from @/mocks/kubernetes as K8sClusterOverview
// This definition is kept for reference but commented out to avoid conflicts
/*
export interface K8sOverview {
  cluster: string;
  region?: string;
  provider?: string;
  version?: string;
  metrics: K8sClusterMetrics;
  nodeStatus: { ready: number; notReady: number; total: number };
  podStatus: { running: number; pending: number; failed: number; succeeded: number; total: number };
  namespaceCount: number;
  deploymentStatus: { ready: number; updating: number; failed: number; total: number };
}
*/

// Use K8sClusterOverview from mocks instead
export type K8sOverview = K8sClusterOverview;

// ============================================
// Alert Types Extension
// ============================================

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: LocalAlertSeverity;
  status: 'open' | 'acknowledged' | 'resolved';
  alerts: LocalAlert[];
  assignee?: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
}

export interface AlertRuleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'infrastructure' | 'kubernetes' | 'application' | 'custom';
  query: string;
  condition: LocalAlertCondition;
  severity: LocalAlertSeverity;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

// ============================================
// Generator Config Types
// ============================================

export interface TimeSeriesConfig {
  start: number;
  end: number;
  interval: number;
  baseValue: number;
  variance: number;
  trend?: 'up' | 'down' | 'stable';
  noise?: number;
  spikes?: { probability: number; magnitude: number };
}

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}
