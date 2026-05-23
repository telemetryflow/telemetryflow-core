/**
 * Mock Data Module Index
 * Centralized exports for all mock data generators
 */

// Shared utilities and constants
export * from "./shared";

// Feature-specific mock data - explicit exports to avoid naming conflicts
export {
  METRIC_DEFINITIONS,
  generateMetricNames,
  generateMetricMetadata,
  generateMetricSeries,
  generateMetricLabels,
  generateMetricInstant,
  generateMetricRange,
  metricsMock,
} from "./metrics";

export {
  LOG_MESSAGES,
  generateLogRecord,
  generateLogs,
  generateLogVolume,
  getLogTotalCount,
  generateLogServices,
  generateLogsByTraceId,
  clearLogCache,
  logsMock,
} from "./logs";

export {
  generateTrace,
  generateTraceSummaries,
  generateTraceHeatmap,
  generateTraceLatencyStats,
  getLatencyBuckets,
  generateServices,
  generateServiceOperations,
  generateServiceDependencies,
  generateTraceErrorCauses,
  generateFlameGraphData,
  generateTraceAttributeComparisons,
  generateTraceScatterData,
  generateServicesWithTraceCount,
  generateMonitorMetrics,
  generateOperationMetrics,
  tracesMock,
} from "./traces";

export {
  EXEMPLAR_METRICS,
  generateExemplar,
  generateExemplars,
  generateExemplarsGroupedByMetric,
  generateExemplarsWithCorrelation,
  getExemplarMetrics,
  exemplarsMock,
} from "./exemplars";

// Correlations - prefix exports to avoid conflicts
export {
  generateRequestRateData as generateCorrelationRequestRateData,
  generateErrorRateData as generateCorrelationErrorRateData,
  generateP99LatencyData as generateCorrelationP99LatencyData,
  generateCorrelatedEvents,
  generateCorrelatedTraces,
  getLatencyDistributionBuckets,
  generateLatencyDistribution,
  generateCorrelationStats,
  correlationsMock,
} from "./correlations";
export type {
  CorrelatedEvent,
  CorrelatedTrace,
  TimeSeriesPoint,
} from "./correlations";

// Home - prefix exports to avoid conflicts
export {
  generateSystemStats,
  generateRequestRateData as generateHomeRequestRateData,
  generateErrorRateData as generateHomeErrorRateData,
  generateLatencyData as generateHomeLatencyData,
  generateLogLevelDistribution,
  getQuickLinks,
  generateDashboardData,
  getDashboardDefinitions,
  getDashboardOverviewCards,
  getSubscriptionPlans,
  homeMock,
} from "./home";
export type { SystemStat, QuickLink, LogLevelDistribution } from "./home";
export type { TimeSeriesData as HomeTimeSeriesData } from "./home";
export type {
  DashboardDefinition,
  DashboardWidget,
  DashboardWidgetQuery,
  DashboardVariable,
  DashboardOverviewCard,
  SubscriptionPlan,
  SubscriptionPricing,
} from "./home";

// Alerts
export {
  generateDemoAlerts,
  generateDemoAlertRules,
  generateRandomAlert,
  generateRandomAlerts,
  getAlertRuleTemplates,
  alertsMock,
} from "./alerts";
export type { MockAlert, MockAlertRule } from "./alerts";

// API Stats (mock data for /stats endpoints — centralized, unit-aligned)
export {
  mockMetricStats,
  mockLogStats,
  mockTraceStats,
  mockAlertStats,
  mockHomeAlerts,
  apiStatsMock,
} from "./api-stats";
export type { HomePageMockAlert } from "./api-stats";

// Kubernetes
export {
  generateNodes,
  generateNamespaces,
  generatePods,
  generateDeployments,
  generatePersistentVolumes,
  generateClusterOverview,
  kubernetesMock,
} from "./kubernetes";
export type {
  K8sNode,
  K8sPod,
  K8sContainer,
  K8sDeployment,
  K8sService,
  K8sNamespace,
  K8sPersistentVolume,
  K8sClusterOverview,
  PodPhase,
  ContainerState,
} from "./kubernetes";

// IAM & Tenancy Mock Data (5-Tier RBAC)
export {
  // Users
  MOCK_USERS,
  MOCK_USER_CREDENTIALS,
  MOCK_USER_ROLES,
  MOCK_USER_ORGANIZATIONS,
  MOCK_USER_TENANTS,
  // Roles & Permissions
  MOCK_ROLES,
  MOCK_PERMISSIONS,
  // Multi-Tenancy
  MOCK_REGIONS,
  MOCK_ORGANIZATIONS,
  MOCK_WORKSPACES,
  MOCK_TENANTS,
  // Audit
  MOCK_AUDIT_LOGS,
  generateAuditLogs,
  // Helper functions
  getUserProfile,
  authenticateUser,
  generateMockTokens,
  getRoleById,
  getRoleByName,
  getPermissionsForRole,
  getOrganizationsByRegion,
  getWorkspacesByOrganization,
  getTenantsByWorkspace,
  // Unified service
  iamMock,
} from "./iam";
export type { AuditLogEntry } from "./iam";

// Reports Mock Data
export { generateMockReportExecution, reportsMock } from "./reports";

// PII Data Masking Mock Data
export { MOCK_MASKING_POLICIES, dataMaskingMock } from "./data-masking";

// Static Data Generator (1000 pre-generated entries with console logging)
export {
  initializeStaticData,
  getStaticData,
  fetchStaticMetrics,
  fetchStaticLogs,
  fetchStaticTraces,
  fetchStaticTraceById,
  fetchStaticExemplars,
  logFetch,
  staticDataGenerator,
} from "./data/static-generator";

// Correlated Data Registry (ensures K8s, logs, traces share same pod names)
export {
  initializeRegistry,
  getRegistry,
  getPodsByCluster,
  getPodsByService,
  getPodsByNamespace,
  getRandomPod,
  getPodByName,
  searchPods,
  correlatedRegistry,
} from "./data/correlated-registry";
export type {
  CorrelatedPod,
  CorrelatedNode,
  CorrelatedRegistry,
} from "./data/correlated-registry";

// Import for the unified mock data service
import {
  generateMetricNames,
  generateMetricMetadata,
  generateMetricSeries,
  generateMetricLabels,
} from "./metrics";
import {
  generateLogRecord,
  generateLogs,
  generateLogVolume,
  getLogTotalCount,
  generateLogServices,
  generateLogsByTraceId,
} from "./logs";
import {
  generateTrace,
  generateTraceSummaries,
  generateTraceHeatmap,
  generateTraceLatencyStats,
  generateTraceErrorCauses,
  generateFlameGraphData,
  generateTraceAttributeComparisons,
  getLatencyBuckets,
  generateServices,
  generateServiceOperations,
  generateServiceDependencies,
  generateTraceScatterData,
  generateServicesWithTraceCount,
  generateMonitorMetrics,
  generateOperationMetrics,
} from "./traces";
import { generateExemplar, generateExemplars } from "./exemplars";
import {
  generateNodes,
  generateNamespaces,
  generatePods,
  generateDeployments,
  generatePersistentVolumes,
  generateClusterOverview,
} from "./kubernetes";

// Unified mock data service (for backward compatibility with existing API code)
export const mockDataGenerator = {
  // Metrics
  getMetricNames: generateMetricNames,
  getMetricMetadata: generateMetricMetadata,
  getMetricSeries: generateMetricSeries,
  getMetricLabels: generateMetricLabels,

  // Logs
  generateLog: generateLogRecord,
  getLogs: generateLogs,
  getLogVolume: generateLogVolume,
  getLogTotalCount: getLogTotalCount,
  getLogServices: generateLogServices,
  getLogsByTraceId: generateLogsByTraceId,

  // Traces
  generateTrace,
  getTraceSummaries: generateTraceSummaries,
  getTraceHeatmap: generateTraceHeatmap,
  getTraceLatencyStats: generateTraceLatencyStats,
  getTraceErrorCauses: generateTraceErrorCauses,
  getFlameGraphData: generateFlameGraphData,
  getTraceAttributeComparisons: generateTraceAttributeComparisons,
  getLatencyBuckets,
  getServices: generateServices,
  getServiceOperations: generateServiceOperations,
  getServiceDependencies: generateServiceDependencies,
  getTraceScatterData: generateTraceScatterData,
  getServicesWithTraceCount: generateServicesWithTraceCount,
  getMonitorMetrics: generateMonitorMetrics,
  getOperationMetrics: generateOperationMetrics,

  // Exemplars
  generateExemplar,
  getExemplars: generateExemplars,

  // Kubernetes (TelemetryFlow v2 API)
  getClusterOverview: generateClusterOverview,
  getNodes: generateNodes,
  getNamespaces: generateNamespaces,
  getPods: generatePods,
  getDeployments: generateDeployments,
  getPersistentVolumes: generatePersistentVolumes,
};

export default mockDataGenerator;
