import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QueryBuilderService } from './QueryBuilderService';
import { TenantContext } from '../../domain/value-objects/TenantContext';
import { TimeRange } from '../../domain/value-objects/TimeRange';
import { AggregationType } from '../../domain/value-objects/AggregationInterval';
import { TrendDataDto, ModuleStatisticsDto, ResourceUsageDto } from '@/shared/dto/statistics.dto';

/**
 * Stats Aggregation Options
 */
export interface StatsAggregationOptions {
  tenantContext: TenantContext;
  timeRange: TimeRange;
  compareWithPrevious?: boolean;
  includeResourceUsage?: boolean;
  groupBy?: string[];
}

/**
 * Module-specific Stats Options
 */
export interface ModuleStatsOptions extends StatsAggregationOptions {
  moduleType: 'agents' | 'uptime' | 'status-page' | 'service-map' | 'network-map' | 'kubernetes' | 'vm';
  filters?: Record<string, unknown>;
}

/**
 * Signal Stats Options (metrics, logs, traces)
 */
export interface SignalStatsOptions extends StatsAggregationOptions {
  signalType: 'metrics' | 'logs' | 'traces';
  metricName?: string;
  serviceName?: string;
  filters?: Record<string, unknown>;
}

/**
 * Stats Aggregation Service
 * 
 * Provides unified statistics aggregation for dashboard stat panels across all modules.
 * Supports TFQL-based queries for infrastructure monitoring (agents, uptime, service-map, network-map)
 * and signal-based queries (metrics, logs, traces).
 * 
 * @example
 * ```typescript
 * // Get agent statistics with trend comparison
 * const agentStats = await statsAggregationService.getModuleStats({
 *   moduleType: 'agents',
 *   tenantContext: TenantContext.create({ organizationId: 'org-123' }),
 *   timeRange: TimeRange.lastHours(24),
 *   compareWithPrevious: true,
 *   includeResourceUsage: true,
 * });
 * 
 * // Get metric statistics
 * const metricStats = await statsAggregationService.getSignalStats({
 *   signalType: 'metrics',
 *   metricName: 'http_requests_total',
 *   tenantContext: ctx,
 *   timeRange: TimeRange.lastHours(1),
 *   compareWithPrevious: true,
 * });
 * ```
 */
/**
 * Entity-to-table mapping for PostgreSQL infrastructure queries
 */
const ENTITY_TABLE_MAP: Record<string, { table: string; timestampCol: string | null }> = {
  agents: { table: 'agents', timestampCol: 'last_heartbeat_at' },
  monitors: { table: 'uptime_monitors', timestampCol: 'last_check_at' },
  status_pages: { table: 'status_pages', timestampCol: 'updated_at' },
  incidents: { table: 'status_page_incidents', timestampCol: 'created_at' },
  services: { table: 'service_map_services', timestampCol: 'updated_at' },
  service_dependencies: { table: 'service_map_dependencies', timestampCol: 'updated_at' },
  network_nodes: { table: 'network_map_nodes', timestampCol: 'updated_at' },
  network_connections: { table: 'network_map_connections', timestampCol: 'updated_at' },
  k8s_clusters: { table: 'kubernetes_clusters', timestampCol: 'updated_at' },
  k8s_nodes: { table: 'kubernetes_nodes', timestampCol: 'updated_at' },
  k8s_pods: { table: 'kubernetes_pods', timestampCol: 'updated_at' },
  k8s_deployments: { table: 'kubernetes_deployments', timestampCol: 'updated_at' },
  vms: { table: 'virtual_machines', timestampCol: 'updated_at' },
};

/**
 * Filter key to column name mapping for common snake_case conversions
 */
const FILTER_COLUMN_MAP: Record<string, string> = {
  isPublic: 'is_public',
  isPaused: 'is_paused',
  isActive: 'is_active',
  instanceType: 'instance_type',
  agentId: 'agent_id',
  clusterId: 'cluster_id',
  namespaceId: 'namespace_id',
  nodeId: 'node_id',
  statusPageId: 'status_page_id',
  sourceServiceId: 'source_service_id',
  targetServiceId: 'target_service_id',
  sourceNodeId: 'source_node_id',
  targetNodeId: 'target_node_id',
};

@Injectable()
export class StatsAggregationService {
  constructor(
    private readonly queryBuilderService: QueryBuilderService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Get statistics for infrastructure modules (agents, uptime, service-map, network-map, k8s, vm)
   */
  async getModuleStats(options: ModuleStatsOptions): Promise<ModuleStatisticsDto> {
    const { moduleType } = options;

    switch (moduleType) {
      case 'agents':
        return this.getAgentStats(options);
      case 'uptime':
        return this.getUptimeStats(options);
      case 'status-page':
        return this.getStatusPageStats(options);
      case 'service-map':
        return this.getServiceMapStats(options);
      case 'network-map':
        return this.getNetworkMapStats(options);
      case 'kubernetes':
        return this.getKubernetesStats(options);
      case 'vm':
        return this.getVMStats(options);
      default:
        throw new Error(`Unsupported module type: ${moduleType}`);
    }
  }

  /**
   * Get statistics for telemetry signals (metrics, logs, traces)
   */
  async getSignalStats(options: SignalStatsOptions): Promise<ModuleStatisticsDto> {
    const { signalType } = options;

    switch (signalType) {
      case 'metrics':
        return this.getMetricsStats(options);
      case 'logs':
        return this.getLogsStats(options);
      case 'traces':
        return this.getTracesStats(options);
      default:
        throw new Error(`Unsupported signal type: ${signalType}`);
    }
  }

  /**
   * Get agent statistics
   * Queries PostgreSQL for agent metadata and ClickHouse for agent metrics
   */
  private async getAgentStats(options: ModuleStatsOptions): Promise<ModuleStatisticsDto> {
    const { tenantContext, timeRange, compareWithPrevious, includeResourceUsage } = options;

    // Query agent count (current period)
    const currentTotal = await this.queryCount('agents', tenantContext, timeRange, options.filters);

    // Query by status
    const healthyCount = await this.queryCount('agents', tenantContext, timeRange, {
      ...options.filters,
      status: 'healthy',
    });
    const degradedCount = await this.queryCount('agents', tenantContext, timeRange, {
      ...options.filters,
      status: 'degraded',
    });
    const criticalCount = await this.queryCount('agents', tenantContext, timeRange, {
      ...options.filters,
      status: 'critical',
    });

    // Calculate trends if requested
    let totalTrend: TrendDataDto | undefined;
    let healthyTrend: TrendDataDto | undefined;

    if (compareWithPrevious) {
      const previousTimeRange = timeRange.shiftBackward();
      const previousTotal = await this.queryCount('agents', tenantContext, previousTimeRange, options.filters);
      const previousHealthy = await this.queryCount('agents', tenantContext, previousTimeRange, {
        ...options.filters,
        status: 'healthy',
      });

      totalTrend = TrendDataDto.calculate(currentTotal, previousTotal);
      healthyTrend = TrendDataDto.calculate(healthyCount, previousHealthy);
    }

    // Query resource usage if requested
    let resourceUsage: ResourceUsageDto | undefined;
    if (includeResourceUsage) {
      resourceUsage = await this.queryResourceUsage('agents', tenantContext, timeRange);
    }

    return {
      total: currentTotal,
      timestamp: new Date(),
      totalTrend,
      byStatus: {
        healthy: healthyCount,
        degraded: degradedCount,
        critical: criticalCount,
        offline: currentTotal - healthyCount - degradedCount - criticalCount,
      },
      byStatusTrends: {
        healthy: healthyTrend,
      },
      resourceUsage,
      timeRange: {
        from: timeRange.getFrom(),
        to: timeRange.getTo(),
      },
    };
  }

  /**
   * Get uptime monitor statistics
   */
  private async getUptimeStats(options: ModuleStatsOptions): Promise<ModuleStatisticsDto> {
    const { tenantContext, timeRange, compareWithPrevious } = options;

    const currentTotal = await this.queryCount('monitors', tenantContext, timeRange, options.filters);
    const upCount = await this.queryCount('monitors', tenantContext, timeRange, {
      ...options.filters,
      status: 'up',
    });
    const downCount = await this.queryCount('monitors', tenantContext, timeRange, {
      ...options.filters,
      status: 'down',
    });
    const pausedCount = await this.queryCount('monitors', tenantContext, timeRange, {
      ...options.filters,
      isPaused: true,
    });

    // Calculate average uptime percentage
    const avgUptime = currentTotal > 0 ? (upCount / currentTotal) * 100 : 0;

    let totalTrend: TrendDataDto | undefined;
    let uptimeTrend: TrendDataDto | undefined;

    if (compareWithPrevious) {
      const previousTimeRange = timeRange.shiftBackward();
      const previousTotal = await this.queryCount('monitors', tenantContext, previousTimeRange, options.filters);
      const previousUp = await this.queryCount('monitors', tenantContext, previousTimeRange, {
        ...options.filters,
        status: 'up',
      });
      const previousAvgUptime = previousTotal > 0 ? (previousUp / previousTotal) * 100 : 0;

      totalTrend = TrendDataDto.calculate(currentTotal, previousTotal);
      uptimeTrend = TrendDataDto.calculate(avgUptime, previousAvgUptime);
    }

    return {
      total: currentTotal,
      timestamp: new Date(),
      totalTrend,
      byStatus: {
        up: upCount,
        down: downCount,
        paused: pausedCount,
        degraded: 0,
      },
      customMetrics: {
        avgUptimePercent: avgUptime,
        avgUptimeTrend: uptimeTrend,
      },
      timeRange: {
        from: timeRange.getFrom(),
        to: timeRange.getTo(),
      },
    };
  }

  /**
   * Get status page statistics
   */
  private async getStatusPageStats(options: ModuleStatsOptions): Promise<ModuleStatisticsDto> {
    const { tenantContext, timeRange, compareWithPrevious } = options;

    const currentTotal = await this.queryCount('status_pages', tenantContext, timeRange, options.filters);
    const publicCount = await this.queryCount('status_pages', tenantContext, timeRange, {
      ...options.filters,
      isPublic: true,
    });
    const activeIncidents = await this.queryCount('incidents', tenantContext, timeRange, {
      ...options.filters,
      status: 'investigating',
    });

    let totalTrend: TrendDataDto | undefined;
    if (compareWithPrevious) {
      const previousTimeRange = timeRange.shiftBackward();
      const previousTotal = await this.queryCount('status_pages', tenantContext, previousTimeRange, options.filters);
      totalTrend = TrendDataDto.calculate(currentTotal, previousTotal);
    }

    return {
      total: currentTotal,
      timestamp: new Date(),
      totalTrend,
      customMetrics: {
        publicPages: publicCount,
        activeIncidents,
      },
      timeRange: {
        from: timeRange.getFrom(),
        to: timeRange.getTo(),
      },
    };
  }

  /**
   * Get service map statistics
   */
  private async getServiceMapStats(options: ModuleStatsOptions): Promise<ModuleStatisticsDto> {
    const { tenantContext, timeRange, compareWithPrevious } = options;

    const totalServices = await this.queryCount('services', tenantContext, timeRange, options.filters);
    const healthyServices = await this.queryCount('services', tenantContext, timeRange, {
      ...options.filters,
      status: 'healthy',
    });
    const degradedServices = await this.queryCount('services', tenantContext, timeRange, {
      ...options.filters,
      status: 'degraded',
    });
    const totalDependencies = await this.queryCount('service_dependencies', tenantContext, timeRange, options.filters);

    let totalTrend: TrendDataDto | undefined;
    if (compareWithPrevious) {
      const previousTimeRange = timeRange.shiftBackward();
      const previousTotal = await this.queryCount('services', tenantContext, previousTimeRange, options.filters);
      totalTrend = TrendDataDto.calculate(totalServices, previousTotal);
    }

    return {
      total: totalServices,
      timestamp: new Date(),
      totalTrend,
      byStatus: {
        healthy: healthyServices,
        degraded: degradedServices,
        critical: totalServices - healthyServices - degradedServices,
      },
      customMetrics: {
        totalDependencies,
        avgDependenciesPerService: totalServices > 0 ? totalDependencies / totalServices : 0,
      },
      timeRange: {
        from: timeRange.getFrom(),
        to: timeRange.getTo(),
      },
    };
  }

  /**
   * Get network map statistics
   */
  private async getNetworkMapStats(options: ModuleStatsOptions): Promise<ModuleStatisticsDto> {
    const { tenantContext, timeRange, compareWithPrevious, includeResourceUsage } = options;

    const totalNodes = await this.queryCount('network_nodes', tenantContext, timeRange, options.filters);
    const activeNodes = await this.queryCount('network_nodes', tenantContext, timeRange, {
      ...options.filters,
      status: 'active',
    });
    const totalConnections = await this.queryCount('network_connections', tenantContext, timeRange, options.filters);

    let totalTrend: TrendDataDto | undefined;
    if (compareWithPrevious) {
      const previousTimeRange = timeRange.shiftBackward();
      const previousTotal = await this.queryCount('network_nodes', tenantContext, previousTimeRange, options.filters);
      totalTrend = TrendDataDto.calculate(totalNodes, previousTotal);
    }

    let resourceUsage: ResourceUsageDto | undefined;
    if (includeResourceUsage) {
      resourceUsage = await this.queryResourceUsage('network_nodes', tenantContext, timeRange);
    }

    return {
      total: totalNodes,
      timestamp: new Date(),
      totalTrend,
      byStatus: {
        active: activeNodes,
        inactive: totalNodes - activeNodes,
      },
      customMetrics: {
        totalConnections,
        avgConnectionsPerNode: totalNodes > 0 ? totalConnections / totalNodes : 0,
      },
      resourceUsage,
      timeRange: {
        from: timeRange.getFrom(),
        to: timeRange.getTo(),
      },
    };
  }

  /**
   * Get Kubernetes statistics
   */
  private async getKubernetesStats(options: ModuleStatsOptions): Promise<ModuleStatisticsDto> {
    const { tenantContext, timeRange, compareWithPrevious, includeResourceUsage } = options;

    const totalClusters = await this.queryCount('k8s_clusters', tenantContext, timeRange, options.filters);
    const totalNodes = await this.queryCount('k8s_nodes', tenantContext, timeRange, options.filters);
    const totalPods = await this.queryCount('k8s_pods', tenantContext, timeRange, options.filters);
    const runningPods = await this.queryCount('k8s_pods', tenantContext, timeRange, {
      ...options.filters,
      phase: 'Running',
    });

    let totalTrend: TrendDataDto | undefined;
    if (compareWithPrevious) {
      const previousTimeRange = timeRange.shiftBackward();
      const previousTotal = await this.queryCount('k8s_pods', tenantContext, previousTimeRange, options.filters);
      totalTrend = TrendDataDto.calculate(totalPods, previousTotal);
    }

    let resourceUsage: ResourceUsageDto | undefined;
    if (includeResourceUsage) {
      resourceUsage = await this.queryResourceUsage('k8s_pods', tenantContext, timeRange);
    }

    return {
      total: totalPods,
      timestamp: new Date(),
      totalTrend,
      byStatus: {
        running: runningPods,
        pending: totalPods - runningPods,
      },
      customMetrics: {
        totalClusters,
        totalNodes,
        avgPodsPerNode: totalNodes > 0 ? totalPods / totalNodes : 0,
      },
      resourceUsage,
      timeRange: {
        from: timeRange.getFrom(),
        to: timeRange.getTo(),
      },
    };
  }

  /**
   * Get VM statistics
   */
  private async getVMStats(options: ModuleStatsOptions): Promise<ModuleStatisticsDto> {
    const { tenantContext, timeRange, compareWithPrevious, includeResourceUsage } = options;

    const totalVMs = await this.queryCount('vms', tenantContext, timeRange, options.filters);
    const runningVMs = await this.queryCount('vms', tenantContext, timeRange, {
      ...options.filters,
      status: 'running',
    });
    const stoppedVMs = await this.queryCount('vms', tenantContext, timeRange, {
      ...options.filters,
      status: 'stopped',
    });

    let totalTrend: TrendDataDto | undefined;
    if (compareWithPrevious) {
      const previousTimeRange = timeRange.shiftBackward();
      const previousTotal = await this.queryCount('vms', tenantContext, previousTimeRange, options.filters);
      totalTrend = TrendDataDto.calculate(totalVMs, previousTotal);
    }

    let resourceUsage: ResourceUsageDto | undefined;
    if (includeResourceUsage) {
      resourceUsage = await this.queryResourceUsage('vms', tenantContext, timeRange);
    }

    return {
      total: totalVMs,
      timestamp: new Date(),
      totalTrend,
      byStatus: {
        running: runningVMs,
        stopped: stoppedVMs,
        degraded: totalVMs - runningVMs - stoppedVMs,
      },
      resourceUsage,
      timeRange: {
        from: timeRange.getFrom(),
        to: timeRange.getTo(),
      },
    };
  }

  /**
   * Get metrics statistics
   */
  private async getMetricsStats(options: SignalStatsOptions): Promise<ModuleStatisticsDto> {
    const { tenantContext, timeRange, compareWithPrevious, metricName, serviceName } = options;

    // Query current period metrics
    const currentResult = await this.queryBuilderService
      .metrics()
      .tenantContext(tenantContext)
      .timeRange(timeRange)
      .metricName(metricName || '')
      .serviceName(serviceName || '')
      .aggregate(AggregationType.COUNT, '*', 'total')
      .execute();

    const currentTotal = (currentResult.data[0] as unknown as Record<string, unknown>)?.total as number || 0;

    // Query average value
    const avgResult = await this.queryBuilderService
      .metrics()
      .tenantContext(tenantContext)
      .timeRange(timeRange)
      .metricName(metricName || '')
      .serviceName(serviceName || '')
      .aggregate(AggregationType.AVG, 'value', 'avg_value')
      .execute();

    const avgValue = (avgResult.data[0] as unknown as Record<string, unknown>)?.avg_value as number || 0;

    let totalTrend: TrendDataDto | undefined;
    if (compareWithPrevious) {
      const previousTimeRange = timeRange.shiftBackward();
      const previousResult = await this.queryBuilderService
        .metrics()
        .tenantContext(tenantContext)
        .timeRange(previousTimeRange)
        .metricName(metricName || '')
        .serviceName(serviceName || '')
        .aggregate(AggregationType.COUNT, '*', 'total')
        .execute();

      const previousTotal = (previousResult.data[0] as unknown as Record<string, unknown>)?.total as number || 0;
      totalTrend = TrendDataDto.calculate(currentTotal, previousTotal);
    }

    return {
      total: currentTotal,
      timestamp: new Date(),
      totalTrend,
      customMetrics: {
        avgValue,
        metricName,
        serviceName,
      },
      timeRange: {
        from: timeRange.getFrom(),
        to: timeRange.getTo(),
      },
    };
  }

  /**
   * Get logs statistics
   */
  private async getLogsStats(options: SignalStatsOptions): Promise<ModuleStatisticsDto> {
    const { tenantContext, timeRange, compareWithPrevious, serviceName } = options;

    // Query current period logs
    const currentResult = await this.queryBuilderService
      .logs()
      .tenantContext(tenantContext)
      .timeRange(timeRange)
      .serviceName(serviceName || '')
      .aggregate(AggregationType.COUNT, '*', 'total')
      .execute();

    const currentTotal = (currentResult.data[0] as unknown as Record<string, unknown>)?.total as number || 0;

    // Query by severity
    const errorResult = await this.queryBuilderService
      .logs()
      .tenantContext(tenantContext)
      .timeRange(timeRange)
      .serviceName(serviceName || '')
      .severityText('ERROR')
      .aggregate(AggregationType.COUNT, '*', 'error_count')
      .execute();

    const errorCount = (errorResult.data[0] as unknown as Record<string, unknown>)?.error_count as number || 0;

    let totalTrend: TrendDataDto | undefined;
    if (compareWithPrevious) {
      const previousTimeRange = timeRange.shiftBackward();
      const previousResult = await this.queryBuilderService
        .logs()
        .tenantContext(tenantContext)
        .timeRange(previousTimeRange)
        .serviceName(serviceName || '')
        .aggregate(AggregationType.COUNT, '*', 'total')
        .execute();

      const previousTotal = (previousResult.data[0] as unknown as Record<string, unknown>)?.total as number || 0;
      totalTrend = TrendDataDto.calculate(currentTotal, previousTotal);
    }

    return {
      total: currentTotal,
      timestamp: new Date(),
      totalTrend,
      customMetrics: {
        errorCount,
        errorRate: currentTotal > 0 ? (errorCount / currentTotal) * 100 : 0,
        serviceName,
      },
      timeRange: {
        from: timeRange.getFrom(),
        to: timeRange.getTo(),
      },
    };
  }

  /**
   * Get traces statistics
   */
  private async getTracesStats(options: SignalStatsOptions): Promise<ModuleStatisticsDto> {
    const { tenantContext, timeRange, compareWithPrevious, serviceName } = options;

    // Query current period traces
    const currentResult = await this.queryBuilderService
      .traces()
      .tenantContext(tenantContext)
      .timeRange(timeRange)
      .serviceName(serviceName || '')
      .aggregate(AggregationType.COUNT, '*', 'total')
      .execute();

    const currentTotal = (currentResult.data[0] as unknown as Record<string, unknown>)?.total as number || 0;

    // Query error traces
    const errorResult = await this.queryBuilderService
      .traces()
      .tenantContext(tenantContext)
      .timeRange(timeRange)
      .serviceName(serviceName || '')
      .hasError(true)
      .aggregate(AggregationType.COUNT, '*', 'error_count')
      .execute();

    const errorCount = (errorResult.data[0] as unknown as Record<string, unknown>)?.error_count as number || 0;

    // Query average duration
    const avgDurationResult = await this.queryBuilderService
      .traces()
      .tenantContext(tenantContext)
      .timeRange(timeRange)
      .serviceName(serviceName || '')
      .aggregate(AggregationType.AVG, 'duration_ms', 'avg_duration')
      .execute();

    const avgDuration = (avgDurationResult.data[0] as unknown as Record<string, unknown>)?.avg_duration as number || 0;

    let totalTrend: TrendDataDto | undefined;
    if (compareWithPrevious) {
      const previousTimeRange = timeRange.shiftBackward();
      const previousResult = await this.queryBuilderService
        .traces()
        .tenantContext(tenantContext)
        .timeRange(previousTimeRange)
        .serviceName(serviceName || '')
        .aggregate(AggregationType.COUNT, '*', 'total')
        .execute();

      const previousTotal = (previousResult.data[0] as unknown as Record<string, unknown>)?.total as number || 0;
      totalTrend = TrendDataDto.calculate(currentTotal, previousTotal);
    }

    return {
      total: currentTotal,
      timestamp: new Date(),
      totalTrend,
      customMetrics: {
        errorCount,
        errorRate: currentTotal > 0 ? (errorCount / currentTotal) * 100 : 0,
        avgDurationMs: avgDuration,
        serviceName,
      },
      timeRange: {
        from: timeRange.getFrom(),
        to: timeRange.getTo(),
      },
    };
  }

  /**
   * Helper: Query count for a given table/entity from PostgreSQL
   * Builds parameterized SQL with tenant context, time range, and filters
   */
  private async queryCount(
    entity: string,
    tenantContext: TenantContext,
    timeRange: TimeRange,
    filters?: Record<string, unknown>,
  ): Promise<number> {
    const entityConfig = ENTITY_TABLE_MAP[entity];
    if (!entityConfig) {
      throw new Error(`Unknown entity for stats: ${entity}. Known entities: ${Object.keys(ENTITY_TABLE_MAP).join(', ')}`);
    }

    const { table, timestampCol } = entityConfig;
    const conditions: string[] = ['organization_id = $1'];
    const params: unknown[] = [tenantContext.organizationId];
    let paramIdx = 2;

    // Workspace filter
    if (tenantContext.workspaceId) {
      conditions.push(`workspace_id = $${paramIdx}`);
      params.push(tenantContext.workspaceId);
      paramIdx++;
    }

    // Time range filter (only if table has a timestamp column)
    if (timestampCol) {
      conditions.push(`${timestampCol} >= $${paramIdx}`);
      params.push(timeRange.getFrom());
      paramIdx++;
      conditions.push(`${timestampCol} <= $${paramIdx}`);
      params.push(timeRange.getTo());
      paramIdx++;
    }

    // Soft delete exclusion
    conditions.push('deleted_at IS NULL');

    // Apply filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) continue;

        const column = FILTER_COLUMN_MAP[key] || key;

        if (typeof value === 'boolean') {
          conditions.push(`${column} = $${paramIdx}`);
          params.push(value);
          paramIdx++;
        } else if (typeof value === 'string') {
          conditions.push(`${column} = $${paramIdx}`);
          params.push(value);
          paramIdx++;
        } else if (typeof value === 'number') {
          conditions.push(`${column} = $${paramIdx}`);
          params.push(value);
          paramIdx++;
        } else if (Array.isArray(value)) {
          conditions.push(`${column} = ANY($${paramIdx})`);
          params.push(value);
          paramIdx++;
        }
      }
    }

    const sql = `SELECT COUNT(*) as total FROM ${table} WHERE ${conditions.join(' AND ')}`;

    try {
      const result = await this.dataSource.query(sql, params);
      return parseInt(result[0]?.total || '0', 10);
    } catch (_error) {
      // Table may not exist yet - return 0 gracefully
      return 0;
    }
  }

  /**
   * Helper: Query resource usage for a given entity from ClickHouse metrics
   * Queries CPU and memory metrics associated with the entity type
   */
  private async queryResourceUsage(
    entity: string,
    tenantContext: TenantContext,
    timeRange: TimeRange,
  ): Promise<ResourceUsageDto> {
    // Map entity types to their metric name prefixes in ClickHouse
    const metricPrefixMap: Record<string, string> = {
      agents: 'agent',
      k8s_pods: 'k8s.pod',
      k8s_nodes: 'k8s.node',
      vms: 'vm',
      network_nodes: 'network.node',
    };

    const prefix = metricPrefixMap[entity];
    if (!prefix) {
      return { avgCpuUsage: 0, avgMemoryUsage: 0 };
    }

    try {
      // Query CPU usage from ClickHouse
      const cpuResult = await this.queryBuilderService
        .metrics()
        .tenantContext(tenantContext)
        .timeRange(timeRange)
        .metricName(`${prefix}.cpu.usage`)
        .aggregate(AggregationType.AVG, 'value', 'avg_cpu')
        .execute();

      // Query memory usage from ClickHouse
      const memResult = await this.queryBuilderService
        .metrics()
        .tenantContext(tenantContext)
        .timeRange(timeRange)
        .metricName(`${prefix}.memory.usage`)
        .aggregate(AggregationType.AVG, 'value', 'avg_memory')
        .execute();

      return {
        avgCpuUsage: (cpuResult.data[0] as unknown as Record<string, unknown>)?.avg_cpu as number || 0,
        avgMemoryUsage: (memResult.data[0] as unknown as Record<string, unknown>)?.avg_memory as number || 0,
      };
    } catch {
      return { avgCpuUsage: 0, avgMemoryUsage: 0 };
    }
  }
}
