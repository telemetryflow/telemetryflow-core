import { BaseQueryBuilder } from "../base/BaseQueryBuilder";
import {
  ITimeSeriesQueryBuilder,
} from "../../../domain/interfaces";
import {
  AggregationInterval,
  AggregationType,
  FillStrategy,
} from "../../../domain/value-objects";
import {
  resolveRollupTable,
  type RollupResolution,
} from "@/shared/clickhouse/resolve-rollup-table";

/**
 * ClickHouse Query Result
 */
export interface ClickHouseQueryResult<T> {
  data: T[];
  total: number;
  statistics?: {
    rowsRead: number;
    bytesRead: number;
    elapsed: number;
  };
}

/**
 * Built ClickHouse Query
 */
export interface BuiltClickHouseQuery {
  sql: string;
  params: Record<string, unknown>;
}

/**
 * ClickHouse Query Builder
 * Time-series query builder for ClickHouse
 */
export abstract class ClickHouseQueryBuilder<T>
  extends BaseQueryBuilder<BuiltClickHouseQuery, ClickHouseQueryResult<T>>
  implements
    ITimeSeriesQueryBuilder<BuiltClickHouseQuery, ClickHouseQueryResult<T>>
{
  protected tableName: string;
  protected intervalValue: AggregationInterval | null = null;
  protected fillStrategyValue: FillStrategy = FillStrategy.NULL;
  protected rateFields: string[] = [];
  protected increaseFields: string[] = [];
  protected percentileValues: number[] = [];
  protected histogramConfig: { field: string; buckets: number[] } | null = null;
  protected useRollupValue = false;
  /** Resolved MV info — populated by build() when useRollupValue is true */
  protected resolvedRollup: RollupResolution | null = null;

  constructor(tableName: string) {
    super();
    this.tableName = tableName;
  }

  /**
   * Qualify a table name with the database prefix.
   * Override in subclasses that have access to ClickHouseService.
   * Default: returns table name as-is (for backward compatibility).
   */
  protected qualifyTableName(table: string): string {
    return table;
  }

  interval(interval: AggregationInterval): this {
    this.intervalValue = interval;
    return this;
  }

  fill(strategy: FillStrategy): this {
    this.fillStrategyValue = strategy;
    return this;
  }

  rate(field: string): this {
    this.rateFields.push(field);
    return this;
  }

  increase(field: string): this {
    this.increaseFields.push(field);
    return this;
  }

  histogram(field: string, buckets: number[]): this {
    this.histogramConfig = { field, buckets };
    return this;
  }

  percentile(field: string, percentiles: number[]): this {
    this.percentileValues = percentiles;
    return this;
  }

  rollup(aggregation: AggregationType): this {
    this.useRollupValue = true;
    this.aggregate(aggregation, "value", "value");
    return this;
  }

  /**
   * Build the SELECT clause.
   * When querying from a materialized view (resolvedRollup is set),
   * uses the MV timestamp column and *Merge() aggregation functions.
   */
  protected buildSelectClause(): string {
    const fields: string[] = [];
    const mv = this.resolvedRollup;
    const isMV = mv?.isMaterializedView ?? false;

    // Add time bucket if interval is set
    if (this.intervalValue) {
      const intervalSeconds = this.intervalValue.seconds;
      if (isMV && mv) {
        // MV: re-bucket the pre-computed column (or use directly if intervals match)
        if (intervalSeconds === mv.intervalSeconds) {
          fields.push(`${mv.timestampCol} as timestamp`);
        } else {
          fields.push(
            `toStartOfInterval(${mv.timestampCol}, INTERVAL ${intervalSeconds} SECOND) as timestamp`,
          );
        }
      } else {
        fields.push(
          `toStartOfInterval(timestamp, INTERVAL ${intervalSeconds} SECOND) as timestamp`,
        );
      }
    }

    // Add aggregations (MV-aware)
    for (const agg of this.aggregations) {
      const alias = agg.alias || `${agg.type}_${agg.field}`;
      if (isMV && mv) {
        fields.push(
          this.buildMVAggregationExpression(agg.type, agg.field, alias, mv),
        );
      } else {
        fields.push(
          this.buildAggregationExpression(agg.type, agg.field, alias),
        );
      }
    }

    // Add percentiles (always raw — MVs may not store all quantile states)
    for (const p of this.percentileValues) {
      fields.push(`quantile(${p / 100})(value) as p${p}`);
    }

    // Add rate calculations
    for (const field of this.rateFields) {
      const tsCol = isMV && mv ? mv.timestampCol : "timestamp";
      fields.push(
        `(max(${field}) - min(${field})) / (toUnixTimestamp(max(${tsCol})) - toUnixTimestamp(min(${tsCol}))) as ${field}_rate`,
      );
    }

    // Add increase calculations
    for (const field of this.increaseFields) {
      fields.push(`max(${field}) - min(${field}) as ${field}_increase`);
    }

    // If no aggregations, use select fields or *
    if (fields.length === 0) {
      if (this.selectFields.length > 0) {
        return `SELECT ${this.selectFields.join(", ")}`;
      }
      return "SELECT *";
    }

    return `SELECT ${fields.join(", ")}`;
  }

  /**
   * Build aggregation expression for ClickHouse
   */
  protected buildAggregationExpression(
    type: AggregationType,
    field: string,
    alias: string,
  ): string {
    switch (type) {
      case AggregationType.COUNT:
        return `count() as ${alias}`;
      case AggregationType.SUM:
        return `sum(${field}) as ${alias}`;
      case AggregationType.AVG:
        return `avg(${field}) as ${alias}`;
      case AggregationType.MIN:
        return `min(${field}) as ${alias}`;
      case AggregationType.MAX:
        return `max(${field}) as ${alias}`;
      case AggregationType.P50:
        return `quantile(0.5)(${field}) as ${alias}`;
      case AggregationType.P75:
        return `quantile(0.75)(${field}) as ${alias}`;
      case AggregationType.P90:
        return `quantile(0.9)(${field}) as ${alias}`;
      case AggregationType.P95:
        return `quantile(0.95)(${field}) as ${alias}`;
      case AggregationType.P99:
        return `quantile(0.99)(${field}) as ${alias}`;
      default:
        return `${field} as ${alias}`;
    }
  }

  /**
   * Build aggregation expression for materialized views.
   * Maps raw aggregation functions to *Merge() equivalents
   * based on the MV engine type and column naming convention.
   */
  protected buildMVAggregationExpression(
    type: AggregationType,
    field: string,
    alias: string,
    mv: RollupResolution,
  ): string {
    if (mv.engineType === "summing") {
      // SummingMergeTree: pre-summed count column
      if (type === AggregationType.COUNT) {
        return `sum(count) as ${alias}`;
      }
      return `sum(${field}) as ${alias}`;
    }

    // AggregatingMergeTree: use *Merge() on *State() columns
    switch (type) {
      case AggregationType.COUNT:
        return `countMerge(count) as ${alias}`;
      case AggregationType.AVG:
        return `avgMerge(avg_${field}) as ${alias}`;
      case AggregationType.SUM:
        return `sumMerge(sum_${field}) as ${alias}`;
      case AggregationType.MIN:
        return `minMerge(min_${field}) as ${alias}`;
      case AggregationType.MAX:
        return `maxMerge(max_${field}) as ${alias}`;
      case AggregationType.P50:
        return `quantileMerge(0.5)(p50_${field}) as ${alias}`;
      case AggregationType.P95:
        return `quantileMerge(0.95)(p95_${field}) as ${alias}`;
      case AggregationType.P99:
        return `quantileMerge(0.99)(p99_${field}) as ${alias}`;
      default:
        // P75, P90 not stored in MVs — fall through to raw expression
        return this.buildAggregationExpression(type, field, alias);
    }
  }

  /**
   * Build WHERE clause.
   * Uses the MV timestamp column when querying from a materialized view.
   */
  protected buildWhereClause(): {
    sql: string;
    params: Record<string, unknown>;
  } {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    // Add tenant context conditions
    if (this.tenantContextValue) {
      conditions.push("organization_id = {organizationId:String}");
      params.organizationId = this.tenantContextValue.organizationId;

      if (this.tenantContextValue.workspaceId) {
        conditions.push("workspace_id = {workspaceId:String}");
        params.workspaceId = this.tenantContextValue.workspaceId;
      }

      if (this.tenantContextValue.tenantId) {
        conditions.push("tenant_id = {tenantId:String}");
        params.tenantId = this.tenantContextValue.tenantId;
      }
    }

    // Add time range conditions (use MV timestamp column when available)
    if (this.timeRangeValue) {
      const tsCol = this.resolvedRollup?.isMaterializedView
        ? this.resolvedRollup.timestampCol
        : "timestamp";
      conditions.push(`${tsCol} >= {from:DateTime64(9)}`);
      conditions.push(`${tsCol} <= {to:DateTime64(9)}`);
      params.from = this.timeRangeValue.from.toISOString().replace("Z", "");
      params.to = this.timeRangeValue.to.toISOString().replace("Z", "");
    }

    // Add custom conditions
    for (let i = 0; i < this.whereConditions.length; i++) {
      const condition = this.whereConditions[i];
      const paramName = `param_${i}`;
      const operator = this.formatOperator(condition.operator);

      if (condition.operator === "IN" || condition.operator === "NOT IN") {
        conditions.push(
          `${condition.field} ${operator} {${paramName}:Array(String)}`,
        );
      } else {
        conditions.push(`${condition.field} ${operator} {${paramName}:String}`);
      }
      params[paramName] = condition.value;
    }

    if (conditions.length === 0) {
      return { sql: "", params };
    }

    return { sql: `WHERE ${conditions.join(" AND ")}`, params };
  }

  /**
   * Build GROUP BY clause.
   * Uses the MV timestamp column when querying from a materialized view.
   */
  protected buildGroupByClause(): string {
    const fields: string[] = [];
    const mv = this.resolvedRollup;
    const isMV = mv?.isMaterializedView ?? false;

    // Add time bucket to group by if interval is set
    if (this.intervalValue) {
      const intervalSeconds = this.intervalValue.seconds;
      if (isMV && mv) {
        if (intervalSeconds === mv.intervalSeconds) {
          fields.push(mv.timestampCol);
        } else {
          fields.push(
            `toStartOfInterval(${mv.timestampCol}, INTERVAL ${intervalSeconds} SECOND)`,
          );
        }
      } else {
        fields.push(
          `toStartOfInterval(timestamp, INTERVAL ${intervalSeconds} SECOND)`,
        );
      }
    }

    // Add custom group by fields
    fields.push(...this.groupByFields);

    if (fields.length === 0) {
      return "";
    }

    return `GROUP BY ${fields.join(", ")}`;
  }

  /**
   * Build ORDER BY clause.
   * Uses the MV timestamp column when querying from a materialized view.
   */
  protected buildOrderByClause(): string {
    if (this.orderByFields.length === 0) {
      const tsCol = this.resolvedRollup?.isMaterializedView
        ? this.resolvedRollup.timestampCol
        : "timestamp";
      return `ORDER BY ${tsCol} DESC`;
    }

    const orderParts = this.orderByFields.map((o) => `${o.field} ${o.order}`);
    return `ORDER BY ${orderParts.join(", ")}`;
  }

  /**
   * Build LIMIT clause with parameterized values
   */
  protected buildLimitClause(params: Record<string, unknown>): string {
    if (this.limitValue === null) {
      return "";
    }

    params.__limit = this.limitValue;
    let clause = "LIMIT {__limit:UInt32}";
    if (this.offsetValue !== null && this.offsetValue > 0) {
      params.__offset = this.offsetValue;
      clause += " OFFSET {__offset:UInt32}";
    }
    return clause;
  }

  /**
   * Build complete query.
   * When useRollupValue is true and an interval is set, resolves the
   * optimal materialized view and adapts all clauses accordingly.
   */
  build(): BuiltClickHouseQuery {
    // Resolve MV when rollup is requested and we have an interval
    if (this.useRollupValue && this.intervalValue) {
      this.resolvedRollup = resolveRollupTable(
        this.tableName,
        this.intervalValue.seconds,
      );
    } else {
      this.resolvedRollup = null;
    }

    const resolvedTable = this.qualifyTableName(
      this.resolvedRollup?.isMaterializedView
        ? this.resolvedRollup.table
        : this.tableName,
    );

    const selectClause = this.buildSelectClause();
    const fromClause = `FROM ${resolvedTable}`;
    const { sql: whereClause, params } = this.buildWhereClause();
    const groupByClause = this.buildGroupByClause();
    const orderByClause = this.buildOrderByClause();
    const limitClause = this.buildLimitClause(params);

    const sqlParts = [
      selectClause,
      fromClause,
      whereClause,
      groupByClause,
      orderByClause,
      limitClause,
    ].filter((part) => part.length > 0);

    return {
      sql: sqlParts.join(" "),
      params,
    };
  }

  /**
   * Execute must be implemented by subclasses with access to ClickHouse client
   */
  abstract execute(): Promise<ClickHouseQueryResult<T>>;
}
