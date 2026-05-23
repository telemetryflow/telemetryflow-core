import { Injectable } from "@nestjs/common";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";
import {
  ClickHouseQueryBuilder,
  ClickHouseQueryResult,
  BuiltClickHouseQuery,
} from "./ClickHouseQueryBuilder";
import { LogEntry } from "../../../domain/interfaces";
import { LogsQueryFilter } from "../../../domain/types";

/**
 * Logs Query Builder
 * Specialized builder for logs table in ClickHouse
 */
@Injectable()
export class LogsQueryBuilder extends ClickHouseQueryBuilder<LogEntry> {
  private queryFilter: string | null = null;
  private severityTextFilter: string | null = null;
  private severityTextsFilter: string[] = [];
  private minSeverityFilter: number | null = null;
  private maxSeverityFilter: number | null = null;
  private serviceNameFilter: string | null = null;
  private traceIdFilter: string | null = null;
  private spanIdFilter: string | null = null;
  private resourceAttributesFilter: Record<string, string> = {};
  private logAttributesFilter: Record<string, string> = {};

  constructor(private readonly clickhouseService: ClickHouseService) {
    super("logs");
  }

  /** Qualify a table name with the configured database prefix */
  private q(table: string): string {
    return this.clickhouseService.qualifyTable(table);
  }

  protected qualifyTableName(table: string): string {
    return this.clickhouseService.qualifyTable(table);
  }

  /**
   * Apply logs-specific filter
   */
  applyFilter(filter: LogsQueryFilter): this {
    if (filter.query) {
      this.queryFilter = filter.query;
    }
    if (filter.severityText) {
      this.severityTextFilter = filter.severityText;
    }
    if (filter.severityTexts && filter.severityTexts.length > 0) {
      this.severityTextsFilter = filter.severityTexts;
    }
    if (filter.minSeverity !== undefined) {
      this.minSeverityFilter = filter.minSeverity;
    }
    if (filter.maxSeverity !== undefined) {
      this.maxSeverityFilter = filter.maxSeverity;
    }
    if (filter.serviceName) {
      this.serviceNameFilter = filter.serviceName;
    }
    if (filter.traceId) {
      this.traceIdFilter = filter.traceId;
    }
    if (filter.spanId) {
      this.spanIdFilter = filter.spanId;
    }
    if (filter.resourceAttributes) {
      this.resourceAttributesFilter = filter.resourceAttributes;
    }
    if (filter.logAttributes) {
      this.logAttributesFilter = filter.logAttributes;
    }
    return this;
  }

  /**
   * Full-text search on body
   */
  search(query: string): this {
    this.queryFilter = query;
    return this;
  }

  /**
   * Filter by severity text
   */
  severityText(severity: string): this {
    this.severityTextFilter = severity;
    return this;
  }

  /**
   * Filter by severity range
   */
  severityRange(min: number, max: number): this {
    this.minSeverityFilter = min;
    this.maxSeverityFilter = max;
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
   * Filter by trace ID
   */
  traceId(id: string): this {
    this.traceIdFilter = id;
    return this;
  }

  /**
   * Filter by span ID
   */
  spanId(id: string): this {
    this.spanIdFilter = id;
    return this;
  }

  /**
   * Override build to add log-specific conditions
   */
  build(): BuiltClickHouseQuery {
    if (this.severityTextFilter) {
      this.andWhere({
        field: "severity_text",
        operator: "=",
        value: this.severityTextFilter,
      });
    }

    if (this.severityTextsFilter.length > 0) {
      this.andWhere({
        field: "severity_text",
        operator: "IN",
        value: this.severityTextsFilter,
      });
    }

    if (this.serviceNameFilter) {
      this.andWhere({
        field: "service_name",
        operator: "=",
        value: this.serviceNameFilter,
      });
    }

    if (this.traceIdFilter) {
      this.andWhere({
        field: "trace_id",
        operator: "=",
        value: this.traceIdFilter,
      });
    }

    if (this.spanIdFilter) {
      this.andWhere({
        field: "span_id",
        operator: "=",
        value: this.spanIdFilter,
      });
    }

    return super.build();
  }

  /**
   * Build WHERE clause with log-specific filters
   */
  protected buildWhereClause(): {
    sql: string;
    params: Record<string, unknown>;
  } {
    const result = super.buildWhereClause();
    const { sql, params } = result;
    const additionalConditions: string[] = [];

    // Full-text search on body
    if (this.queryFilter) {
      additionalConditions.push("body ILIKE {queryFilter:String}");
      params.queryFilter = `%${this.queryFilter}%`;
    }

    // Severity range
    if (this.minSeverityFilter !== null) {
      additionalConditions.push("severity_number >= {minSeverity:Int32}");
      params.minSeverity = this.minSeverityFilter;
    }
    if (this.maxSeverityFilter !== null) {
      additionalConditions.push("severity_number <= {maxSeverity:Int32}");
      params.maxSeverity = this.maxSeverityFilter;
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

    // Log attributes
    attrIndex = 0;
    for (const [key, value] of Object.entries(this.logAttributesFilter)) {
      const keyParam = `log_attr_key_${attrIndex}`;
      const valueParam = `log_attr_value_${attrIndex}`;
      additionalConditions.push(
        `log_attributes[{${keyParam}:String}] = {${valueParam}:String}`,
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
  async execute(): Promise<ClickHouseQueryResult<LogEntry>> {
    const { sql, params } = this.build();

    const client = this.clickhouseService.getClient();
    const result = await client.query({
      query: sql,
      query_params: params,
      format: "JSONEachRow",
    });

    const rawData = await result.json();
    const data = (Array.isArray(rawData) ? rawData : []) as LogEntry[];

    return {
      data,
      total: data.length,
    };
  }

  /**
   * Get distinct severity levels
   */
  async getSeverityLevels(): Promise<string[]> {
    const params: Record<string, unknown> = {};

    let whereClause = "";
    if (this.tenantContextValue) {
      whereClause = "WHERE organization_id = {organizationId:String}";
      params.organizationId = this.tenantContextValue.organizationId;
    }

    const sql = `
      SELECT DISTINCT severity_text
      FROM ${this.q("logs")}
      ${whereClause}
      ORDER BY severity_number
    `;

    const client = this.clickhouseService.getClient();
    const result = await client.query({
      query: sql,
      query_params: params,
      format: "JSONEachRow",
    });

    const rawData = await result.json();
    const rows = (Array.isArray(rawData) ? rawData : []) as {
      severity_text: string;
    }[];
    return rows.map((r) => r.severity_text);
  }

  /**
   * Get log count by severity
   */
  async getCountBySeverity(): Promise<Record<string, number>> {
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

    const sql = `
      SELECT severity_text, count() as count
      FROM ${this.q("logs")}
      ${whereClause}
      GROUP BY severity_text
      ORDER BY count DESC
    `;

    const client = this.clickhouseService.getClient();
    const result = await client.query({
      query: sql,
      query_params: params,
      format: "JSONEachRow",
    });

    const rawData = await result.json();
    const rows = (Array.isArray(rawData) ? rawData : []) as {
      severity_text: string;
      count: string;
    }[];
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.severity_text] = parseInt(row.count, 10);
    }
    return counts;
  }
}
