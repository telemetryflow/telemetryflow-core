import { Injectable } from "@nestjs/common";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";
import {
  ClickHouseQueryBuilder,
  ClickHouseQueryResult,
  BuiltClickHouseQuery,
} from "./ClickHouseQueryBuilder";
import { MetricDataPoint } from "../../../domain/interfaces";
import { MetricsQueryFilter } from "../../../domain/types";
import { LabelMatcher } from "../../../domain/interfaces";

/**
 * Metrics Query Builder
 * Specialized builder for metrics table in ClickHouse
 */
@Injectable()
export class MetricsQueryBuilder extends ClickHouseQueryBuilder<MetricDataPoint> {
  private metricNameFilter: string | null = null;
  private metricNamesFilter: string[] = [];
  private serviceNameFilter: string | null = null;
  private labelsFilter: Record<string, string> = {};
  private labelMatchersFilter: LabelMatcher[] = [];

  constructor(private readonly clickhouseService: ClickHouseService) {
    super("metrics");
  }

  /** Qualify a table name with the configured database prefix */
  private q(table: string): string {
    return this.clickhouseService.qualifyTable(table);
  }

  protected qualifyTableName(table: string): string {
    return this.clickhouseService.qualifyTable(table);
  }

  /**
   * Apply metrics-specific filter
   */
  applyFilter(filter: MetricsQueryFilter): this {
    if (filter.metricName) {
      this.metricNameFilter = filter.metricName;
    }
    if (filter.metricNames && filter.metricNames.length > 0) {
      this.metricNamesFilter = filter.metricNames;
    }
    if (filter.serviceName) {
      this.serviceNameFilter = filter.serviceName;
    }
    if (filter.labels) {
      this.labelsFilter = filter.labels;
    }
    if (filter.labelMatchers) {
      this.labelMatchersFilter = filter.labelMatchers;
    }
    return this;
  }

  /**
   * Filter by metric name
   */
  metricName(name: string): this {
    this.metricNameFilter = name;
    return this;
  }

  /**
   * Filter by multiple metric names
   */
  metricNames(names: string[]): this {
    this.metricNamesFilter = names;
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
   * Filter by labels
   */
  labels(labels: Record<string, string>): this {
    this.labelsFilter = labels;
    return this;
  }

  /**
   * Add label matcher
   */
  labelMatcher(matcher: LabelMatcher): this {
    this.labelMatchersFilter.push(matcher);
    return this;
  }

  /**
   * Override build to add metric-specific conditions
   */
  build(): BuiltClickHouseQuery {
    // Add metric-specific WHERE conditions
    if (this.metricNameFilter) {
      this.andWhere({
        field: "metric_name",
        operator: "=",
        value: this.metricNameFilter,
      });
    }

    if (this.metricNamesFilter.length > 0) {
      this.andWhere({
        field: "metric_name",
        operator: "IN",
        value: this.metricNamesFilter,
      });
    }

    if (this.serviceNameFilter) {
      this.andWhere({
        field: "service_name",
        operator: "=",
        value: this.serviceNameFilter,
      });
    }

    return super.build();
  }

  /**
   * Build WHERE clause with label matchers
   */
  protected buildWhereClause(): {
    sql: string;
    params: Record<string, unknown>;
  } {
    const result = super.buildWhereClause();
    const { sql, params } = result;
    const additionalConditions: string[] = [];

    // Add label filters using Map access
    let labelIndex = 0;
    for (const [key, value] of Object.entries(this.labelsFilter)) {
      const keyParam = `label_key_${labelIndex}`;
      const valueParam = `label_value_${labelIndex}`;
      additionalConditions.push(
        `metric_attributes[{${keyParam}:String}] = {${valueParam}:String}`,
      );
      params[keyParam] = key;
      params[valueParam] = value;
      labelIndex++;
    }

    // Add label matchers
    for (let i = 0; i < this.labelMatchersFilter.length; i++) {
      const matcher = this.labelMatchersFilter[i];
      const nameParam = `matcher_name_${i}`;
      const valueParam = `matcher_value_${i}`;
      params[nameParam] = matcher.name;
      params[valueParam] = matcher.value;

      switch (matcher.type) {
        case "eq":
          additionalConditions.push(
            `metric_attributes[{${nameParam}:String}] = {${valueParam}:String}`,
          );
          break;
        case "neq":
          additionalConditions.push(
            `metric_attributes[{${nameParam}:String}] != {${valueParam}:String}`,
          );
          break;
        case "regex":
          additionalConditions.push(
            `match(metric_attributes[{${nameParam}:String}], {${valueParam}:String})`,
          );
          break;
        case "nregex":
          additionalConditions.push(
            `NOT match(metric_attributes[{${nameParam}:String}], {${valueParam}:String})`,
          );
          break;
      }
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
  async execute(): Promise<ClickHouseQueryResult<MetricDataPoint>> {
    const { sql, params } = this.build();

    const client = this.clickhouseService.getClient();
    const result = await client.query({
      query: sql,
      query_params: params,
      format: "JSONEachRow",
    });

    const rawData = await result.json();
    const data = (Array.isArray(rawData) ? rawData : []) as MetricDataPoint[];

    return {
      data,
      total: data.length,
    };
  }

  /**
   * Get distinct metric names
   */
  async getMetricNames(): Promise<string[]> {
    const { params } = this.buildWhereClause();

    let whereClause = "";
    if (this.tenantContextValue) {
      whereClause = "WHERE organization_id = {organizationId:String}";
      params.organizationId = this.tenantContextValue.organizationId;
    }

    const sql = `
      SELECT DISTINCT metric_name
      FROM ${this.q("metrics")}
      ${whereClause}
      ORDER BY metric_name
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
      metric_name: string;
    }[];
    return rows.map((r) => r.metric_name);
  }

  /**
   * Get label values for a metric
   */
  async getLabelValues(labelName: string): Promise<string[]> {
    const { params } = this.buildWhereClause();
    params.labelName = labelName;

    let whereClause = "WHERE 1=1";
    if (this.tenantContextValue) {
      whereClause += " AND organization_id = {organizationId:String}";
      params.organizationId = this.tenantContextValue.organizationId;
    }
    if (this.metricNameFilter) {
      whereClause += " AND metric_name = {metricName:String}";
      params.metricName = this.metricNameFilter;
    }

    const sql = `
      SELECT DISTINCT metric_attributes[{labelName:String}] as label_value
      FROM ${this.q("metrics")}
      ${whereClause}
      AND metric_attributes[{labelName:String}] != ''
      ORDER BY label_value
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
      label_value: string;
    }[];
    return rows.map((r) => r.label_value);
  }
}
