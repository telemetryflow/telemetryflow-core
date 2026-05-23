import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import {
  QueryLogsQuery,
  GetLogSeverityLevelsQuery,
  GetLogCountBySeverityQuery,
} from "../../queries/signals";
import { LogsQueryBuilder } from "../../../infrastructure/query-builders/clickhouse";
import {
  UnifiedQueryResult,
  LogEntry,
  QueryMetadata,
} from "../../../domain/interfaces";
import { DataSourceType } from "../../../domain/value-objects";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";

/**
 * Query Logs Handler
 */
@QueryHandler(QueryLogsQuery)
export class QueryLogsHandler implements IQueryHandler<QueryLogsQuery> {
  private readonly logger = new Logger(QueryLogsHandler.name);

  constructor(private readonly clickhouseService: ClickHouseService) {}

  async execute(query: QueryLogsQuery): Promise<UnifiedQueryResult<LogEntry>> {
    const startTime = Date.now();

    const builder = new LogsQueryBuilder(this.clickhouseService);

    // Apply tenant context
    builder.tenantContext(query.tenantContext);

    // Apply time range
    builder.timeRange(query.timeRange);

    // Apply filter
    if (query.filter) {
      builder.applyFilter(query.filter);
    }

    // Apply pagination
    if (query.pagination?.limit) {
      builder.limit(query.pagination.limit);
    } else {
      builder.limit(1000); // Default limit
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
 * Get Log Severity Levels Handler
 */
@QueryHandler(GetLogSeverityLevelsQuery)
export class GetLogSeverityLevelsHandler implements IQueryHandler<GetLogSeverityLevelsQuery> {
  constructor(private readonly clickhouseService: ClickHouseService) {}

  async execute(query: GetLogSeverityLevelsQuery): Promise<string[]> {
    const builder = new LogsQueryBuilder(this.clickhouseService);
    builder.tenantContext(query.tenantContext);
    return builder.getSeverityLevels();
  }
}

/**
 * Get Log Count By Severity Handler
 */
@QueryHandler(GetLogCountBySeverityQuery)
export class GetLogCountBySeverityHandler implements IQueryHandler<GetLogCountBySeverityQuery> {
  constructor(private readonly clickhouseService: ClickHouseService) {}

  async execute(
    query: GetLogCountBySeverityQuery,
  ): Promise<Record<string, number>> {
    const builder = new LogsQueryBuilder(this.clickhouseService);
    builder.tenantContext(query.tenantContext);
    builder.timeRange(query.timeRange);
    return builder.getCountBySeverity();
  }
}
