import {
  IQueryBuilder,
  QueryCondition,
  Aggregation,
} from "../../../domain/interfaces";
import {
  TimeRange,
  TenantContext,
  AggregationType,
  SortOrder,
} from "../../../domain/value-objects";

/**
 * Abstract Base Query Builder
 * Provides common functionality for all query builders
 */
export abstract class BaseQueryBuilder<
  TQuery,
  TResult,
> implements IQueryBuilder<TQuery, TResult> {
  protected selectFields: string[] = [];
  protected whereConditions: QueryCondition[] = [];
  protected orderByFields: { field: string; order: SortOrder }[] = [];
  protected limitValue: number | null = null;
  protected offsetValue: number | null = null;
  protected groupByFields: string[] = [];
  protected aggregations: Aggregation[] = [];
  protected timeRangeValue: TimeRange | null = null;
  protected tenantContextValue: TenantContext | null = null;

  select(...fields: string[]): this {
    this.selectFields = fields;
    return this;
  }

  where(condition: QueryCondition): this {
    this.whereConditions = [condition];
    return this;
  }

  andWhere(condition: QueryCondition): this {
    this.whereConditions.push({ ...condition, logicalOperator: "AND" });
    return this;
  }

  orWhere(condition: QueryCondition): this {
    this.whereConditions.push({ ...condition, logicalOperator: "OR" });
    return this;
  }

  orderBy(field: string, order: SortOrder = SortOrder.DESC): this {
    this.orderByFields.push({ field, order });
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  groupBy(...fields: string[]): this {
    this.groupByFields = fields;
    return this;
  }

  aggregate(aggregation: AggregationType, field: string, alias?: string): this {
    this.aggregations.push({ type: aggregation, field, alias });
    return this;
  }

  timeRange(range: TimeRange): this {
    this.timeRangeValue = range;
    return this;
  }

  tenantContext(ctx: TenantContext): this {
    this.tenantContextValue = ctx;
    return this;
  }

  /**
   * Reset builder state
   */
  reset(): this {
    this.selectFields = [];
    this.whereConditions = [];
    this.orderByFields = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.groupByFields = [];
    this.aggregations = [];
    this.timeRangeValue = null;
    this.tenantContextValue = null;
    return this;
  }

  /**
   * Clone the builder
   */
  clone(): this {
    const cloned = Object.create(Object.getPrototypeOf(this));
    Object.assign(cloned, this);
    cloned.selectFields = [...this.selectFields];
    cloned.whereConditions = [...this.whereConditions];
    cloned.orderByFields = [...this.orderByFields];
    cloned.groupByFields = [...this.groupByFields];
    cloned.aggregations = [...this.aggregations];
    return cloned;
  }

  abstract build(): TQuery;
  abstract execute(): Promise<TResult>;

  /**
   * Format operator for SQL
   */
  protected formatOperator(operator: QueryCondition["operator"]): string {
    const operatorMap: Record<QueryCondition["operator"], string> = {
      "=": "=",
      "!=": "!=",
      ">": ">",
      "<": "<",
      ">=": ">=",
      "<=": "<=",
      LIKE: "LIKE",
      "NOT LIKE": "NOT LIKE",
      ILIKE: "ILIKE",
      IN: "IN",
      "NOT IN": "NOT IN",
      REGEX: "REGEXP",
      "NOT REGEX": "NOT REGEXP",
    };
    return operatorMap[operator] || "=";
  }

  /**
   * Format value for SQL
   */
  protected formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return "NULL";
    }
    if (typeof value === "string") {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return `(${value.map((v) => this.formatValue(v)).join(", ")})`;
    }
    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }
    return String(value);
  }
}
