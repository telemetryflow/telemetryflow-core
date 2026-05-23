import { Injectable } from "@nestjs/common";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";
import {
  ClickHouseQueryBuilder,
  ClickHouseQueryResult,
  BuiltClickHouseQuery,
} from "./ClickHouseQueryBuilder";
import { TraceSpan, TraceSummary } from "../../../domain/interfaces";
import { TracesQueryFilter } from "../../../domain/types";

/**
 * Traces Query Builder
 * Specialized builder for traces table in ClickHouse
 */
@Injectable()
export class TracesQueryBuilder extends ClickHouseQueryBuilder<TraceSpan> {
  private traceIdFilter: string | null = null;
  private traceIdsFilter: string[] = [];
  private spanIdFilter: string | null = null;
  private parentSpanIdFilter: string | null = null;
  private spanNameFilter: string | null = null;
  private spanKindFilter: string | null = null;
  private serviceNameFilter: string | null = null;
  private statusCodeFilter: string | null = null;
  private minDurationMsFilter: number | null = null;
  private maxDurationMsFilter: number | null = null;
  private hasErrorFilter: boolean | null = null;
  private resourceAttributesFilter: Record<string, string> = {};
  private spanAttributesFilter: Record<string, string> = {};

  constructor(private readonly clickhouseService: ClickHouseService) {
    super("traces");
  }

  /** Qualify a table name with the configured database prefix */
  private q(table: string): string {
    return this.clickhouseService.qualifyTable(table);
  }

  protected qualifyTableName(table: string): string {
    return this.clickhouseService.qualifyTable(table);
  }

  /**
   * Apply traces-specific filter
   */
  applyFilter(filter: TracesQueryFilter): this {
    if (filter.traceId) {
      this.traceIdFilter = filter.traceId;
    }
    if (filter.traceIds && filter.traceIds.length > 0) {
      this.traceIdsFilter = filter.traceIds;
    }
    if (filter.spanId) {
      this.spanIdFilter = filter.spanId;
    }
    if (filter.parentSpanId) {
      this.parentSpanIdFilter = filter.parentSpanId;
    }
    if (filter.spanName) {
      this.spanNameFilter = filter.spanName;
    }
    if (filter.spanKind) {
      this.spanKindFilter = filter.spanKind;
    }
    if (filter.serviceName) {
      this.serviceNameFilter = filter.serviceName;
    }
    if (filter.statusCode) {
      this.statusCodeFilter = filter.statusCode;
    }
    if (filter.minDurationMs !== undefined) {
      this.minDurationMsFilter = filter.minDurationMs;
    }
    if (filter.maxDurationMs !== undefined) {
      this.maxDurationMsFilter = filter.maxDurationMs;
    }
    if (filter.hasError !== undefined) {
      this.hasErrorFilter = filter.hasError;
    }
    if (filter.resourceAttributes) {
      this.resourceAttributesFilter = filter.resourceAttributes;
    }
    if (filter.spanAttributes) {
      this.spanAttributesFilter = filter.spanAttributes;
    }
    return this;
  }

  /**
   * Filter by trace ID
   */
  traceId(id: string): this {
    this.traceIdFilter = id;
    return this;
  }

  /**
   * Filter by multiple trace IDs
   */
  traceIds(ids: string[]): this {
    this.traceIdsFilter = ids;
    return this;
  }

  /**
   * Filter by span name
   */
  spanName(name: string): this {
    this.spanNameFilter = name;
    return this;
  }

  /**
   * Filter by service name
   */
  serviceName(name: string): this {
    this.serviceNameFilter = name;
    return this;
  }

  /**
   * Filter by status code
   */
  statusCode(code: "UNSET" | "OK" | "ERROR"): this {
    this.statusCodeFilter = code;
    return this;
  }

  /**
   * Filter by duration range
   */
  durationRange(minMs: number, maxMs: number): this {
    this.minDurationMsFilter = minMs;
    this.maxDurationMsFilter = maxMs;
    return this;
  }

  /**
   * Filter by error status
   */
  hasError(value: boolean): this {
    this.hasErrorFilter = value;
    return this;
  }

  /**
   * Override build to add trace-specific conditions
   */
  build(): BuiltClickHouseQuery {
    if (this.traceIdFilter) {
      this.andWhere({
        field: "trace_id",
        operator: "=",
        value: this.traceIdFilter,
      });
    }

    if (this.traceIdsFilter.length > 0) {
      this.andWhere({
        field: "trace_id",
        operator: "IN",
        value: this.traceIdsFilter,
      });
    }

    if (this.spanIdFilter) {
      this.andWhere({
        field: "span_id",
        operator: "=",
        value: this.spanIdFilter,
      });
    }

    if (this.spanNameFilter) {
      this.andWhere({
        field: "span_name",
        operator: "ILIKE",
        value: `%${this.spanNameFilter}%`,
      });
    }

    if (this.spanKindFilter) {
      this.andWhere({
        field: "span_kind",
        operator: "=",
        value: this.spanKindFilter,
      });
    }

    if (this.serviceNameFilter) {
      this.andWhere({
        field: "service_name",
        operator: "=",
        value: this.serviceNameFilter,
      });
    }

    if (this.statusCodeFilter) {
      this.andWhere({
        field: "status_code",
        operator: "=",
        value: this.statusCodeFilter,
      });
    }

    return super.build();
  }

  /**
   * Build WHERE clause with trace-specific filters
   */
  protected buildWhereClause(): {
    sql: string;
    params: Record<string, unknown>;
  } {
    const result = super.buildWhereClause();
    const { sql, params } = result;
    const additionalConditions: string[] = [];

    // Duration filters (convert ms to ns)
    if (this.minDurationMsFilter !== null) {
      additionalConditions.push("duration_ns >= {minDurationNs:UInt64}");
      params.minDurationNs = this.minDurationMsFilter * 1_000_000;
    }
    if (this.maxDurationMsFilter !== null) {
      additionalConditions.push("duration_ns <= {maxDurationNs:UInt64}");
      params.maxDurationNs = this.maxDurationMsFilter * 1_000_000;
    }

    // Error filter
    if (this.hasErrorFilter !== null) {
      if (this.hasErrorFilter) {
        additionalConditions.push("status_code = 'ERROR'");
      } else {
        additionalConditions.push("status_code != 'ERROR'");
      }
    }

    // Parent span filter
    if (this.parentSpanIdFilter) {
      additionalConditions.push("parent_span_id = {parentSpanId:String}");
      params.parentSpanId = this.parentSpanIdFilter;
    }

    // Resource attributes
    let attrIndex = 0;
    for (const [key, value] of Object.entries(this.resourceAttributesFilter)) {
      const keyParam = `res_attr_key_${attrIndex}`;
      const valueParam = `res_attr_value_${attrIndex}`;
      additionalConditions.push(
        `resource_attributes[{${keyParam}:String}] = {${valueParam}:String}`,
      );
      params[keyParam] = key;
      params[valueParam] = value;
      attrIndex++;
    }

    // Span attributes
    attrIndex = 0;
    for (const [key, value] of Object.entries(this.spanAttributesFilter)) {
      const keyParam = `span_attr_key_${attrIndex}`;
      const valueParam = `span_attr_value_${attrIndex}`;
      additionalConditions.push(
        `span_attributes[{${keyParam}:String}] = {${valueParam}:String}`,
      );
      params[keyParam] = key;
      params[valueParam] = value;
      attrIndex++;
    }

    if (additionalConditions.length === 0) {
      return result;
    }

    const combinedSql = sql
      ? `${sql} AND ${additionalConditions.join(" AND ")}`
      : `WHERE ${additionalConditions.join(" AND ")}`;

    return { sql: combinedSql, params };
  }

  /**
   * Execute the query
   */
  async execute(): Promise<ClickHouseQueryResult<TraceSpan>> {
    const { sql, params } = this.build();

    const client = this.clickhouseService.getClient();
    const result = await client.query({
      query: sql,
      query_params: params,
      format: "JSONEachRow",
    });

    const rawData = await result.json();
    const rows = (Array.isArray(rawData) ? rawData : []) as any[];

    // Transform to TraceSpan with durationMs
    const data: TraceSpan[] = rows.map((row) => ({
      ...row,
      durationMs: row.duration_ns / 1_000_000,
    }));

    return {
      data,
      total: data.length,
    };
  }

  /**
   * Get full trace by trace ID
   */
  async getTrace(traceId: string): Promise<TraceSpan[]> {
    this.traceId(traceId);
    this.orderBy("timestamp", "ASC" as any);
    this.limit(1000);

    const result = await this.execute();
    return result.data;
  }

  /**
   * Get trace summaries for list view
   */
  async getTraceSummaries(): Promise<TraceSummary[]> {
    const params: Record<string, unknown> = {};

    let whereClause = "WHERE 1=1";
    if (this.tenantContextValue) {
      whereClause += " AND organization_id = {organizationId:String}";
      params.organizationId = this.tenantContextValue.organizationId;
    }
    if (this.timeRangeValue) {
      whereClause +=
        " AND timestamp >= {from:DateTime64(9)} AND timestamp <= {to:DateTime64(9)}";
      params.from = this.timeRangeValue.from.toISOString().replace("Z", "");
      params.to = this.timeRangeValue.to.toISOString().replace("Z", "");
    }
    if (this.serviceNameFilter) {
      whereClause += " AND service_name = {serviceName:String}";
      params.serviceName = this.serviceNameFilter;
    }
    if (this.hasErrorFilter) {
      whereClause += " AND status_code = 'ERROR'";
    }

    params.__limit = this.limitValue || 100;

    // Build logs subquery filter for hasLogs indicator
    let logsSubqueryFilter = `WHERE trace_id != '' AND trace_id != '00000000000000000000000000000000'`;
    if (this.tenantContextValue) {
      logsSubqueryFilter += ` AND organization_id = {organizationId:String}`;
    }
    if (this.timeRangeValue) {
      logsSubqueryFilter += ` AND timestamp >= {from:DateTime64(9)} AND timestamp <= {to:DateTime64(9)}`;
    }

    const sql = `
      SELECT
        trace_id as traceId,
        min(timestamp) as startTime,
        max(timestamp) as endTime,
        max(duration_ns) / 1000000 as durationMs,
        count() as spanCount,
        countIf(status_code = 'ERROR') as errorCount,
        groupUniqArray(service_name) as services,
        argMin(service_name, timestamp) as rootServiceName,
        argMin(span_name, timestamp) as rootSpanName,
        trace_id IN (
          SELECT DISTINCT trace_id FROM ${this.q("logs")}
          ${logsSubqueryFilter}
        ) as hasLogs
      FROM ${this.q("traces")}
      ${whereClause}
      GROUP BY trace_id
      ORDER BY startTime DESC
      LIMIT {__limit:UInt32}
    `;

    const client = this.clickhouseService.getClient();
    const result = await client.query({
      query: sql,
      query_params: params,
      format: "JSONEachRow",
    });

    const rawData = await result.json();
    return (Array.isArray(rawData) ? rawData : []) as TraceSummary[];
  }

  /**
   * Get service names
   */
  async getServiceNames(): Promise<string[]> {
    const params: Record<string, unknown> = {};

    let whereClause = "";
    if (this.tenantContextValue) {
      whereClause = "WHERE organization_id = {organizationId:String}";
      params.organizationId = this.tenantContextValue.organizationId;
    }

    const sql = `
      SELECT DISTINCT service_name
      FROM ${this.q("traces")}
      ${whereClause}
      ORDER BY service_name
      LIMIT 1000
    `;

    const client = this.clickhouseService.getClient();
    const result = await client.query({
      query: sql,
      query_params: params,
      format: "JSONEachRow",
    });

    const rawData = await result.json();
    const rows = (Array.isArray(rawData) ? rawData : []) as {
      service_name: string;
    }[];
    return rows.map((r) => r.service_name);
  }

  /**
   * Get span names for a service
   */
  async getSpanNames(serviceName?: string): Promise<string[]> {
    const params: Record<string, unknown> = {};

    let whereClause = "WHERE 1=1";
    if (this.tenantContextValue) {
      whereClause += " AND organization_id = {organizationId:String}";
      params.organizationId = this.tenantContextValue.organizationId;
    }
    if (serviceName || this.serviceNameFilter) {
      whereClause += " AND service_name = {serviceName:String}";
      params.serviceName = serviceName || this.serviceNameFilter;
    }

    const sql = `
      SELECT DISTINCT span_name
      FROM ${this.q("traces")}
      ${whereClause}
      ORDER BY span_name
      LIMIT 1000
    `;

    const client = this.clickhouseService.getClient();
    const result = await client.query({
      query: sql,
      query_params: params,
      format: "JSONEachRow",
    });

    const rawData = await result.json();
    const rows = (Array.isArray(rawData) ? rawData : []) as {
      span_name: string;
    }[];
    return rows.map((r) => r.span_name);
  }
}
