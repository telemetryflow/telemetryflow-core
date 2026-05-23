import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import {
  QueryMetricsQuery,
  GetMetricNamesQuery,
  GetLabelValuesQuery,
} from "../../queries/signals";
import { MetricsQueryBuilder } from "../../../infrastructure/query-builders/clickhouse";
import {
  UnifiedQueryResult,
  MetricDataPoint,
  QueryMetadata,
} from "../../../domain/interfaces";
import {
  DataSourceType,
  AggregationInterval,
} from "../../../domain/value-objects";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";

/**
 * Query Metrics Handler
 */
@QueryHandler(QueryMetricsQuery)
export class QueryMetricsHandler implements IQueryHandler<QueryMetricsQuery> {
  private readonly logger = new Logger(QueryMetricsHandler.name);

  constructor(private readonly clickhouseService: ClickHouseService) {}

  async execute(
    query: QueryMetricsQuery,
  ): Promise<UnifiedQueryResult<MetricDataPoint>> {
    const startTime = Date.now();

    const builder = new MetricsQueryBuilder(this.clickhouseService);

    // Apply tenant context
    builder.tenantContext(query.tenantContext);

    // Apply time range
    builder.timeRange(query.timeRange);

    // Apply filter
    if (query.filter) {
      builder.applyFilter(query.filter);
    }

    // Apply options
    if (query.options?.aggregation) {
      builder.aggregate(query.options.aggregation, "value", "value");
    }

    if (query.options?.interval) {
      builder.interval(query.options.interval);
    } else {
      // Auto-select interval based on time range
      const suggestedInterval = query.timeRange.suggestInterval();
      builder.interval(AggregationInterval.fromString(suggestedInterval));
    }

    if (query.options?.percentiles) {
      builder.percentile("value", query.options.percentiles);
    }

    // Apply pagination
    if (query.pagination?.limit) {
      builder.limit(query.pagination.limit);
    }
    if (query.pagination?.offset) {
      builder.offset(query.pagination.offset);
    }

    // Execute query
    const result = await builder.execute();

    const metadata: QueryMetadata = {
      queryId: crypto.randomUUID(),
      executionTimeMs: Date.now() - startTime,
      dataSource: DataSourceType.CLICKHOUSE,
      cached: false,
    };

    return {
      data: result.data,
      total: result.total,
      metadata,
      pagination: query.pagination
        ? {
            page: query.pagination.page || 1,
            limit: query.pagination.limit || 1000,
            totalPages: Math.ceil(
              result.total / (query.pagination.limit || 1000),
            ),
            hasNext:
              (query.pagination.page || 1) * (query.pagination.limit || 1000) <
              result.total,
            hasPrev: (query.pagination.page || 1) > 1,
          }
        : undefined,
    };
  }
}

/**
 * Get Metric Names Handler
 */
@QueryHandler(GetMetricNamesQuery)
export class GetMetricNamesHandler implements IQueryHandler<GetMetricNamesQuery> {
  constructor(private readonly clickhouseService: ClickHouseService) {}

  async execute(query: GetMetricNamesQuery): Promise<string[]> {
    const builder = new MetricsQueryBuilder(this.clickhouseService);
    builder.tenantContext(query.tenantContext);

    if (query.limit) {
      builder.limit(query.limit);
    }

    return builder.getMetricNames();
  }
}

/**
 * Get Label Values Handler
 */
@QueryHandler(GetLabelValuesQuery)
export class GetLabelValuesHandler implements IQueryHandler<GetLabelValuesQuery> {
  constructor(private readonly clickhouseService: ClickHouseService) {}

  async execute(query: GetLabelValuesQuery): Promise<string[]> {
    const builder = new MetricsQueryBuilder(this.clickhouseService);
    builder.tenantContext(query.tenantContext);

    if (query.metricName) {
      builder.metricName(query.metricName);
    }

    if (query.limit) {
      builder.limit(query.limit);
    }

    return builder.getLabelValues(query.labelName);
  }
}
