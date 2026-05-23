import { TimeRange, TenantContext, AggregationInterval, AggregationType, FillStrategy, SortOrder } from '../value-objects';

/**
 * Query condition for WHERE clauses
 */
export interface QueryCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'NOT LIKE' | 'ILIKE' | 'IN' | 'NOT IN' | 'REGEX' | 'NOT REGEX';
  value: unknown;
  logicalOperator?: 'AND' | 'OR';
}

/**
 * Aggregation definition
 */
export interface Aggregation {
  type: AggregationType;
  field: string;
  alias?: string;
}

/**
 * Base Query Builder Interface
 * Provides fluent API for building queries
 */
export interface IQueryBuilder<TQuery, TResult> {
  /**
   * Select specific fields
   */
  select(...fields: string[]): this;

  /**
   * Add WHERE condition
   */
  where(condition: QueryCondition): this;

  /**
   * Add AND condition
   */
  andWhere(condition: QueryCondition): this;

  /**
   * Add OR condition
   */
  orWhere(condition: QueryCondition): this;

  /**
   * Add ORDER BY clause
   */
  orderBy(field: string, order: SortOrder): this;

  /**
   * Limit results
   */
  limit(count: number): this;

  /**
   * Offset for pagination
   */
  offset(count: number): this;

  /**
   * Group by fields
   */
  groupBy(...fields: string[]): this;

  /**
   * Add aggregation
   */
  aggregate(aggregation: AggregationType, field: string, alias?: string): this;

  /**
   * Set time range filter
   */
  timeRange(range: TimeRange): this;

  /**
   * Set tenant context for multi-tenancy
   */
  tenantContext(ctx: TenantContext): this;

  /**
   * Build the query object
   */
  build(): TQuery;

  /**
   * Execute the query
   */
  execute(): Promise<TResult>;
}

/**
 * Time Series Query Builder Interface
 * Extends base builder with time-series specific operations
 */
export interface ITimeSeriesQueryBuilder<TQuery, TResult>
  extends IQueryBuilder<TQuery, TResult> {
  /**
   * Set aggregation interval for time bucketing
   */
  interval(interval: AggregationInterval): this;

  /**
   * Set fill strategy for missing data points
   */
  fill(strategy: FillStrategy): this;

  /**
   * Calculate rate (per second)
   */
  rate(field: string): this;

  /**
   * Calculate increase over time
   */
  increase(field: string): this;

  /**
   * Create histogram
   */
  histogram(field: string, buckets: number[]): this;

  /**
   * Calculate percentiles
   */
  percentile(field: string, percentiles: number[]): this;

  /**
   * Use rollup aggregation (materialized views)
   */
  rollup(aggregation: AggregationType): this;
}

/**
 * Label matcher for metric queries
 */
export interface LabelMatcher {
  name: string;
  value: string;
  type: 'eq' | 'neq' | 'regex' | 'nregex';
}
