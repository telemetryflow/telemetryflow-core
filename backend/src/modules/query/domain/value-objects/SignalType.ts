/**
 * SignalType Enum
 * Types of telemetry signals
 */
export enum SignalType {
  METRICS = 'metrics',
  LOGS = 'logs',
  TRACES = 'traces',
  EXEMPLARS = 'exemplars',
  CORRELATIONS = 'correlations',
}

/**
 * InfrastructureType Enum
 * Types of infrastructure resources
 */
export enum InfrastructureType {
  AGENT = 'agent',
  VM = 'vm',
  K8S_CLUSTER = 'k8s_cluster',
  K8S_NAMESPACE = 'k8s_namespace',
  K8S_NODE = 'k8s_node',
  K8S_POD = 'k8s_pod',
  K8S_DEPLOYMENT = 'k8s_deployment',
  K8S_STATEFULSET = 'k8s_statefulset',
  K8S_DAEMONSET = 'k8s_daemonset',
  K8S_SERVICE = 'k8s_service',
  K8S_PV = 'k8s_pv',
  K8S_PVC = 'k8s_pvc',

  // Monitoring types
  UPTIME_MONITOR = 'uptime_monitor',
  STATUS_PAGE = 'status_page',
  STATUS_PAGE_INCIDENT = 'status_page_incident',
  SERVICE_MAP_SERVICE = 'service_map_service',
  SERVICE_MAP_DEPENDENCY = 'service_map_dependency',
  NETWORK_MAP_NODE = 'network_map_node',
  NETWORK_MAP_CONNECTION = 'network_map_connection',
}

/**
 * QueryType - Union of all query types
 */
export type QueryType = SignalType | InfrastructureType;

/**
 * Data source types for routing queries
 */
export enum DataSourceType {
  CLICKHOUSE = 'clickhouse',
  POSTGRES = 'postgres',
  FEDERATED = 'federated',
}

/**
 * Map signal/infrastructure types to their data sources
 */
export function getDataSource(type: QueryType): DataSourceType {
  switch (type) {
    // Time-series signals go to ClickHouse
    case SignalType.METRICS:
    case SignalType.LOGS:
    case SignalType.TRACES:
    case SignalType.EXEMPLARS:
    case SignalType.CORRELATIONS:
      return DataSourceType.CLICKHOUSE;

    // Infrastructure metadata goes to PostgreSQL
    case InfrastructureType.AGENT:
    case InfrastructureType.VM:
    case InfrastructureType.K8S_CLUSTER:
    case InfrastructureType.K8S_NAMESPACE:
    case InfrastructureType.K8S_NODE:
    case InfrastructureType.K8S_POD:
    case InfrastructureType.K8S_DEPLOYMENT:
    case InfrastructureType.K8S_STATEFULSET:
    case InfrastructureType.K8S_DAEMONSET:
    case InfrastructureType.K8S_SERVICE:
    case InfrastructureType.K8S_PV:
    case InfrastructureType.K8S_PVC:
    case InfrastructureType.UPTIME_MONITOR:
    case InfrastructureType.STATUS_PAGE:
    case InfrastructureType.STATUS_PAGE_INCIDENT:
    case InfrastructureType.SERVICE_MAP_SERVICE:
    case InfrastructureType.SERVICE_MAP_DEPENDENCY:
    case InfrastructureType.NETWORK_MAP_NODE:
    case InfrastructureType.NETWORK_MAP_CONNECTION:
      return DataSourceType.POSTGRES;

    default:
      return DataSourceType.FEDERATED;
  }
}
