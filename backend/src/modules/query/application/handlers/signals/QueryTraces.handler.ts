import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Logger, NotFoundException } from "@nestjs/common";
import {
  QueryTracesQuery,
  GetTraceByIdQuery,
  GetTraceSummariesQuery,
  GetTraceServiceNamesQuery,
  GetSpanNamesQuery,
} from "../../queries/signals";
import { TracesQueryBuilder } from "../../../infrastructure/query-builders/clickhouse";
import {
  UnifiedQueryResult,
  TraceSpan,
  TraceSummary,
  QueryMetadata,
} from "../../../domain/interfaces";
import { DataSourceType } from "../../../domain/value-objects";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";

/**
 * Query Traces Handler
 */
@QueryHandler(QueryTracesQuery)
export class QueryTracesHandler implements IQueryHandler<QueryTracesQuery> {
  private readonly logger = new Logger(QueryTracesHandler.name);

  constructor(private readonly clickhouseService: ClickHouseService) {}

  async execute(
    query: QueryTracesQuery,
  ): Promise<UnifiedQueryResult<TraceSpan>> {
    const startTime = Date.now();

    const builder = new TracesQueryBuilder(this.clickhouseService);

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
      builder.limit(100); // Default limit for traces
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
            limit: query.pagination.limit || 100,
            totalPages: Math.ceil(
              result.total / (query.pagination.limit || 100),
            ),
            hasNext:
              (query.pagination.page || 1) * (query.pagination.limit || 100) <
              result.total,
            hasPrev: (query.pagination.page || 1) > 1,
          }
        : undefined,
    };
  }
}

/**
 * Get Trace By ID Handler
 */
@QueryHandler(GetTraceByIdQuery)
export class GetTraceByIdHandler implements IQueryHandler<GetTraceByIdQuery> {
  constructor(private readonly clickhouseService: ClickHouseService) {}

  async execute(query: GetTraceByIdQuery): Promise<TraceSpan[]> {
    const builder = new TracesQueryBuilder(this.clickhouseService);
    builder.tenantContext(query.tenantContext);

    const spans = await builder.getTrace(query.traceId);

    if (spans.length === 0) {
      throw new NotFoundException(`Trace with ID ${query.traceId} not found`);
    }

    return spans;
  }
}

/**
 * Get Trace Summaries Handler
 */
@QueryHandler(GetTraceSummariesQuery)
export class GetTraceSummariesHandler implements IQueryHandler<GetTraceSummariesQuery> {
  constructor(private readonly clickhouseService: ClickHouseService) {}

  async execute(
    query: GetTraceSummariesQuery,
  ): Promise<UnifiedQueryResult<TraceSummary>> {
    const startTime = Date.now();

    const builder = new TracesQueryBuilder(this.clickhouseService);
    builder.tenantContext(query.tenantContext);
    builder.timeRange(query.timeRange);

    if (query.filter) {
      builder.applyFilter(query.filter);
    }

    if (query.pagination?.limit) {
      builder.limit(query.pagination.limit);
    }

    const summaries = await builder.getTraceSummaries();

    const metadata: QueryMetadata = {
      queryId: crypto.randomUUID(),
      executionTimeMs: Date.now() - startTime,
      dataSource: DataSourceType.CLICKHOUSE,
      cached: false,
    };

    return {
      data: summaries,
      total: summaries.length,
      metadata,
    };
  }
}

/**
 * Get Trace Service Names Handler
 */
@QueryHandler(GetTraceServiceNamesQuery)
export class GetTraceServiceNamesHandler implements IQueryHandler<GetTraceServiceNamesQuery> {
  constructor(private readonly clickhouseService: ClickHouseService) {}

  async execute(query: GetTraceServiceNamesQuery): Promise<string[]> {
    const builder = new TracesQueryBuilder(this.clickhouseService);
    builder.tenantContext(query.tenantContext);

    if (query.limit) {
      builder.limit(query.limit);
    }

    return builder.getServiceNames();
  }
}

/**
 * Get Span Names Handler
 */
@QueryHandler(GetSpanNamesQuery)
export class GetSpanNamesHandler implements IQueryHandler<GetSpanNamesQuery> {
  constructor(private readonly clickhouseService: ClickHouseService) {}

  async execute(query: GetSpanNamesQuery): Promise<string[]> {
    const builder = new TracesQueryBuilder(this.clickhouseService);
    builder.tenantContext(query.tenantContext);

    if (query.limit) {
      builder.limit(query.limit);
    }

    return builder.getSpanNames(query.serviceName);
  }
}
