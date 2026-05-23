import { UnifiedQueryResult } from './IQueryResult';

/**
 * Query execution options
 */
export interface QueryExecutionOptions {
  timeout?: number;
  useCache?: boolean;
  cacheTtl?: number;
  debug?: boolean;
}

/**
 * Federated query for multi-source execution
 */
export interface FederatedQuery {
  id: string;
  dataSource: 'clickhouse' | 'postgres';
  query: string;
  params: Record<string, unknown>;
}

/**
 * Federated query options
 */
export interface FederatedQueryOptions {
  mergeStrategy?: 'union' | 'join' | 'interleave';
  format?: ResponseFormat;
  timeout?: number;
}

/**
 * Response format options
 */
export interface ResponseFormat {
  timestamps?: 'iso' | 'unix' | 'unixMs';
  camelCase?: boolean;
}

/**
 * Query Executor Interface
 * Executes queries against data sources
 */
export interface IQueryExecutor<TQuery, TResult> {
  /**
   * Execute a single query
   */
  execute(query: TQuery, options?: QueryExecutionOptions): Promise<TResult>;

  /**
   * Execute multiple queries in parallel
   */
  executeMany(
    queries: TQuery[],
    options?: QueryExecutionOptions,
  ): Promise<TResult[]>;

  /**
   * Get query execution plan (for optimization)
   */
  explain?(query: TQuery): Promise<string>;
}

/**
 * Federated Query Executor Interface
 * Executes queries across multiple data sources
 */
export interface IFederatedQueryExecutor {
  /**
   * Execute federated queries and merge results
   */
  execute<T>(
    queries: FederatedQuery[],
    options?: FederatedQueryOptions,
  ): Promise<UnifiedQueryResult<T>>;
}

/**
 * Query Cache Interface
 */
export interface IQueryCache {
  /**
   * Get cached result
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set cached result
   */
  set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void>;

  /**
   * Invalidate cache by pattern
   */
  invalidate(pattern: string): Promise<void>;

  /**
   * Build cache key from query
   */
  buildKey(query: unknown): string;
}
