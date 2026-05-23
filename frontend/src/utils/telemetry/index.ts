/**
 * Telemetry Helpers - Main Export
 *
 * Global helpers for fetch, generator & ingestion data supporting:
 * - Mock Data generation for development & testing
 * - OTEL Community "/v1" ingestions
 * - TFO "/v2" ingestions
 */

// ============================================
// Types
// ============================================
export type {
  // Data source
  DataSourceType,
  DataSourceConfig,
  TelemetryResponse,
  TimeRange,

  // OTEL Resource
  OTELResource,

  // OTEL v1 Protocol types
  OTELv1Metric,
  OTELv1LogRecord,
  OTELv1Span,
  OTELv1KeyValue,
  OTELv1AnyValue,

  // Kubernetes types
  K8sNode,
  K8sNodeMetrics,
  K8sPod,
  K8sPodMetrics,
  K8sContainer,
  K8sDeployment,
  K8sDeploymentMetrics,
  K8sNamespace,
  K8sNamespaceMetrics,
  K8sClusterData,
  K8sClusterMetrics,
  K8sOverview,
  K8sPersistentVolume,
  K8sClusterOverview,

  // VM types
  VMInfo,
  VMMetricsBundle,
  VMCPUMetrics,
  VMMemoryMetrics,
  VMDiskMetrics,
  VMNetworkMetrics,

  // Other types
  TimeSeriesConfig,
  TimeSeriesPoint,
  Incident,
  AlertRuleTemplate,
} from './types';

// ============================================
// Constants
// ============================================
export {
  // OTEL standards
  OTEL_SEVERITY_LEVELS,
  OTEL_SEVERITY_TEXT,
  OTEL_METRIC_TYPES,
  OTEL_SPAN_KINDS,
  OTEL_SPAN_KIND_TEXT,
  OTEL_SPAN_STATUS_CODES,
  OTEL_SPAN_STATUS_TEXT,

  // API Endpoints
  OTEL_V1_ENDPOINTS,
  TFO_V2_ENDPOINTS,

  // Metric names
  VM_METRICS,
  K8S_METRICS,
  APP_METRICS,

  // Mock data
  MOCK_SERVICES,
  MOCK_OPERATIONS,
  MOCK_NAMESPACES,
  MOCK_CLOUD_PROVIDERS,
  MOCK_CLOUD_REGIONS,
  MOCK_CLUSTERS,
  MOCK_REGIONS,

  // Thresholds
  DEFAULT_THRESHOLDS,
} from './constants';

// ============================================
// Common Utilities
// ============================================
export {
  // Fetcher
  fetchTelemetryData,
  fetchMultiple,
  fetchWithRetry,
  createFetchOptions,
  createSuccessResponse,
  createErrorResponse,
  buildUrl,
  getEndpoint,
  createMockSource,
  createOTELv1Source,
  createTFOv2Source,
  isValidSource,

  // Generator
  SeededRandom,
  setGlobalSeed,
  getGlobalRandom,
  createSeededRandom,
  generateTimeSeries,
  generatePercentageTimeSeries,
  generateCounterTimeSeries,
  generateTraceId,
  generateSpanId,
  generateMetricId,
  generateLogId,
  generateAlertId,
  generateUUID,
  generateOTELResource,
  generateVMResource,
  generateK8sResource,
  generateHostname,
  generatePodName,
  generateNodeName,
  generateTimestamp,
  generateTimestamps,
  getDefaultTimeRange,
  getRecommendedInterval,

  // Chart-friendly series generators
  generateChartSeries,
  generateChartSeriesMultiple,
  toChartSeries,
  fromChartSeries,

  // Transformer - OTEL
  otelKeyValueToRecord,
  recordToOtelKeyValue,
  extractAnyValue,
  valueToAnyValue,
  metricLabelsToRecord,
  recordToMetricLabels,
  flattenResource,
  extractServiceFromResource,
  extractNamespaceFromResource,

  // Transformer - Timestamps
  nanosToMillis,
  millisToNanos,
  isoToMillis,
  millisToIso,

  // Transformer - Severity
  severityNumberToText,
  severityTextToNumber,
  severityToLogLevel,
  logLevelToSeverity,

  // Transformer - Spans
  spanKindToString,
  stringToSpanKind,
  spanStatusCodeToString,
  stringToSpanStatusCode,
  nanosToDuration,
  durationToNanos,

  // Transformer - Byte Units (Constants)
  BINARY_UNITS,
  DECIMAL_UNITS,

  // Transformer - Binary (IEC) Byte Conversions
  bytesToKiB,
  bytesToMiB,
  bytesToGiB,
  bytesToTiB,
  kibToBytes,
  mibToBytes,
  gibToBytes,
  tibToBytes,

  // Transformer - Decimal (SI) Byte Conversions
  bytesToKB,
  bytesToMB,
  bytesToGB,
  bytesToTB,
  kbToBytes,
  mbToBytes,
  gbToBytes,
  tbToBytes,

  // Transformer - Auto-Format Byte Functions
  formatBytes,
  formatBytesBinary,
  formatBytesDecimal,
  formatBytesShort,

  // Transformer - Parse Byte Functions
  parseBytes,
  parseK8sResourceValue,
  formatK8sResourceValue,
  renderResourceValue,

  // Transformer - Bandwidth/Rate Functions
  formatBandwidth,
  formatTransferRate,
  bytesToBits,
  bitsToBytes,

  // Transformer - Percentages
  ratioToPercent,
  percentToRatio,
  calculateUtilization,

  // Transformer - Query
  transformPromQLToTFQL,
  transformTFQLToPromQL,
} from './common';
export type { FetchOptions, FormatBytesOptions, BinaryUnit, DecimalUnit, ByteUnit, ChartSeries } from './common';

// ============================================
// Metrics Helpers
// ============================================
export {
  // Generator
  generateMetric,
  generateGaugeMetric,
  generateCounterMetric,
  generateHistogramMetric,
  generateSummaryMetric,
  generateMetricSeries,
  generateMetricSeriesForService,
  generateMetricMetadata,
  generateMetricNames,
  generateMockMetrics,
  generateMetricsForDashboard,

  // Fetcher
  fetchMetrics,
  fetchMetricNames,
  fetchMetricLabels,
  fetchMetricMetadata,
  fetchMetricSeries,
  buildMetricQuery,
  buildRangeQuery,

  // Transformer
  transformOTELv1ToTFO,
  transformOTELv1MetricsToTFO,
  transformTFOToOTELv1,
  transformTFOMetricsToOTELv1,
  metricToSeries,
  seriesToMetric,
  aggregateSeriesByLabel,
  sumSeries,
  avgSeries,
} from './metrics';
export type { MetricGeneratorConfig } from './metrics';

// ============================================
// Logs Helpers
// ============================================
export {
  // Generator
  generateLogRecord,
  generateLogRecords,
  generateErrorLog,
  generateAccessLog,
  generateK8sLog,
  generateMockLogs,
  generateLogsForService,
  generateLogPatterns,
  buildLogQuery,
  
  // Stream generators
  generateStreamLog,
  generateStreamLogBatch,
  generateLogBurst,
  streamLogs,
  generateLogsForTimeWindow,
  generateLogsChunk,
  generateBufferedLogs,

  // Fetcher
  fetchLogs,
  fetchLogPatterns,
  fetchLogFields,
  fetchLogAggregations,
  fetchLogServices,
  fetchLogStream,

  // Transformer
  transformOTELv1LogToTFO,
  transformOTELv1LogsToTFO,
  transformTFOLogToOTELv1,
  transformTFOLogsToOTELv1,
  normalizeLogLevel,
  logLevelToSeverityRange,
  formatLogMessage,
  formatLogAsJson,
  filterLogsByLevel,
  filterLogsByService,
  filterLogsByTimeRange,
  filterLogsByQuery,
  groupLogsByLevel,
  groupLogsByService,
  countLogsByLevel,
} from './logs';
export type { LogGeneratorConfig, LogStreamConfig } from './logs';

// ============================================
// Traces Helpers
// ============================================
export {
  // Generator
  generateSpan,
  generateTrace,
  generateMockTraces,
  generateTracesForService,
  generateServiceMap,
  generateServiceDependency,
  generateLatencyDistribution,
  generateLatencyStatsForServices,
  generateTraceSummary,
  generateTraceSummaries,
  buildTraceQuery,

  // Fetcher
  fetchTraces,
  fetchTraceById,
  fetchServices,
  fetchOperations,
  fetchDependencies,
  fetchLatencyStats,
  fetchServiceMetrics,

  // Transformer
  transformOTELv1SpanToTFO,
  transformOTELv1SpansToTFO,
  transformTFOSpanToOTELv1,
  transformTFOSpansToOTELv1,
  getSpanKindLabel,
  isClientSpan,
  isServerSpan,
  isErrorSpan,
  isSuccessSpan,
  buildTraceFromSpans,
  buildSpanTree,
  flattenSpanTree,
  filterSpansByService,
  filterSpansByKind,
  filterErrorSpans,
  calculateSelfTime,
  calculateCriticalPath,
  extractHttpAttributes,
  extractDbAttributes,
} from './traces';
export type { TraceGeneratorConfig, SpanTreeNode } from './traces';

// ============================================
// Exemplars Helpers
// ============================================
export {
  // Generator
  generateExemplar,
  generateExemplars,
  generateMockExemplars,
  generateExemplarsForMetric,
  generateExemplarCorrelation,
  generateExemplarCorrelations,
  generateMetricExemplarSeries,
  generateMetricExemplarSeriesForServices,
  generateHighValueExemplars,
  generateErrorExemplars,

  // Fetcher
  fetchExemplars,
  fetchExemplarsByMetric,
  fetchExemplarsByTrace,
  fetchExemplarCorrelations,
  fetchHighValueExemplars,
  buildExemplarQuery,

  // Transformer
  groupExemplarsByMetric,
  groupExemplarsByService,
  groupExemplarsByTraceId,
  filterExemplarsByTimeRange,
  filterExemplarsByValue,
  filterExemplarsByLabel,
  filterHighLatencyExemplars,
  filterErrorExemplars,
  sortExemplarsByTimestamp,
  sortExemplarsByValue,
  calculateExemplarStats,
  calculateExemplarPercentiles,
  exemplarsToSeries,
  seriesToExemplars,
  getUniqueTraceIds,
  getUniqueSpanIds,
  correlationToExemplar,
  correlationsToExemplars,
  bucketExemplarsByValue,
  bucketExemplarsByTime,
} from './exemplars';
export type { ExemplarGeneratorConfig } from './exemplars';

// ============================================
// VM Metrics Helpers
// ============================================
export {
  // Generator
  generateVMMetrics,
  generateCPUMetrics,
  generateMemoryMetrics,
  generateDiskMetrics,
  generateNetworkMetrics,
  generateVMInfo,
  generateVMList,
  generateAllVMMetrics,
  // Infrastructure VM generation
  generateVirtualMachine,
  generateVirtualMachines,
  generateVMTimeSeries,
  // Agent monitoring
  generateAgents,
  generateK8sNodeAgent,
  generateVMAgent,
  generateAgentTimeSeries,
  getAgentSummary,

  // Fetcher
  fetchVMMetrics,
  fetchVMList,
  fetchVMInfo,
  fetchVMMetricsSeries,
  fetchCPUMetrics,
  fetchMemoryMetrics,
  fetchDiskMetrics,
  fetchNetworkMetrics,
  fetchInfrastructureOverview,

  // CPU helpers
  getCPUUtilization,
  getCPULoadAverage,
  getCPUStatus,
  isCPUOverloaded,
  getCPUStatusColor,
  calculateCPUUsageFromTime,
  calculateLoadAverageStatus,
  formatLoadAverage,
  summarizeCPUMetrics,
  generatePerCoreUtilization,

  // Memory helpers
  getMemoryUtilization,
  getMemoryUsage,
  getMemoryStatus,
  isMemoryPressure,
  getMemoryStatusColor,
  calculateMemoryUtilization,
  calculateAvailableMemory,
  calculateEffectiveMemoryUsage,
  formatMemoryBytes,
  formatMemoryUsage,
  formatMemoryPercent,
  summarizeMemoryMetrics,
  detectOOMRisk,
  getSwapUsageWarning,

  // Disk helpers
  getDiskIOPS,
  getDiskUsage,
  getDiskStatus,
  isDiskFull,
  getDiskStatusColor,
  calculateDiskUtilization,
  calculateIOPS,
  calculateThroughput,
  calculateIOWait,
  formatDiskBytes,
  formatDiskUsage,
  formatIOPS,
  formatThroughput,
  summarizeDiskMetrics,
  predictDiskFull,
  getFilesystemHealthCheck,

  // Network helpers
  getNetworkThroughput,
  getNetworkErrors,
  getNetworkStatus,
  hasNetworkIssues,
  getNetworkStatusColor,
  calculateBandwidth,
  calculateErrorRate,
  calculatePacketLoss,
  calculateNetworkUtilization,
  formatNetworkBandwidth,
  formatNetworkBytes,
  formatPackets,
  summarizeNetworkMetrics,
  detectNetworkAnomalies,
} from './vm';
export type { VMGeneratorConfig } from './vm';

// ============================================
// Kubernetes Helpers
// ============================================
export {
  // Multi-cluster configuration
  K8S_REGIONS,
  K8S_CLUSTERS,
  K8S_ALL_CLUSTERS,
  K8S_NODES_BY_CLUSTER,
  K8S_CLUSTER,
  K8S_NODES,
  getClustersByRegion,
  getClusterById,
  getNodesByCluster,
  getNamespacesByCluster,
  getRegions,
  getRegionById,
  getClustersByProvider,
  getClustersByEnvironment,
  getHealthyClusters,
  getDegradedClusters,
  
  // Generator
  generateK8sCluster,
  generateNodes,
  generateNodeMetrics,
  generateNamespaces,
  generateNamespaceMetrics,
  generatePods,
  generatePodMetrics,
  generateDeployments,
  generateDeploymentMetrics,
  generatePersistentVolumes,
  generateK8sOverview,

  // Fetcher
  fetchK8sOverview,
  fetchK8sClusterData,
  fetchK8sClusters,
  fetchK8sNodes,
  fetchK8sNode,
  fetchK8sPods,
  fetchK8sPod,
  fetchK8sDeployments,
  fetchK8sDeployment,
  fetchK8sNamespaces,
  fetchK8sNamespace,
  fetchK8sResourceMetrics,

  // Additional Kubernetes helper functions can be implemented as needed:
  // - Cluster: health scoring, capacity analysis, issue detection
  // - Node: condition checking, utilization calculations, scheduling logic
  // - Namespace: quota management, status tracking, filtering
  // - Pod: phase detection, health checks, resource monitoring
  // - Deployment: status tracking, replica progress, update management
  //
  // Basic K8s functionality is available via @/utils/telemetry/kubernetes
  // getDeploymentStatus,
  // isDeploymentHealthy,
  // isDeploymentProgressing,
  // getDeploymentHealth,
  // getDeploymentStatusColor,
  // getReplicaProgress,
  // getUpdateProgress,
  // formatReplicaStatus,
  // formatDeploymentAge,
  // formatLastUpdate,
  // summarizeDeployment,
  // analyzeDeploymentMetrics,
  // filterDeploymentsByNamespace,
  // filterHealthyDeployments,
  // filterUnhealthyDeployments,
  // filterProgressingDeployments,
  // filterDeploymentsByLabel,
  // sortDeploymentsByHealth,
  // sortDeploymentsByReplicas,
  // sortDeploymentsByAge,
  // sortDeploymentsByLastUpdate,
  // getDeploymentPods,
  // getDeploymentPodCount,
} from './kubernetes';
export type { K8sGeneratorConfig } from './kubernetes';

// ============================================
// Alerts Helpers
// ============================================
export {
  // Generator
  generateAlertRule,
  generateAlert,
  generateActiveAlert,
  generateIncident,
  generateMockAlertRules,
  generateMockAlerts,
  generateMockActiveAlerts,
  generateMockIncidents,

  // Fetcher
  fetchAlertRules,
  fetchAlertRule,
  fetchActiveAlerts,
  fetchAlertHistory,
  fetchIncidents,
  fetchIncident,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
  acknowledgeAlert,
  resolveAlert,
  fetchAlertStats,

  // Rules utilities
  PRESET_ALERT_RULES,
  createMetricAlertRule,
  createLogAlertRule,
  createTraceAlertRule,
  symbolToOperator,
  evaluateCondition,
  getPresetRulesByCategory,
  templateToRule,
  validateAlertRule,
} from './alerts';
export type { AlertGeneratorConfig } from './alerts';
