/**
 * TFQL AST Node Types
 * Abstract Syntax Tree definitions for TelemetryFlow Query Language
 */

import { SortOrder } from '../value-objects/AggregationInterval';

// ============================================================================
// Base Types
// ============================================================================

export type TfqlAstNode =
  | FetchNode
  | CorrelateNode
  | SubqueryNode;

export type SignalTarget = 'metrics' | 'logs' | 'traces' | 'exemplars' | 'correlations';
export type InfrastructureTarget = 'agents' | 'vms' | 'clusters' | 'namespaces' | 'nodes' | 'pods' | 'deployments' | 'pvs' | 'pvcs';
export type MonitoringTarget = 'monitors' | 'status_pages' | 'incidents' | 'services' | 'service_dependencies' | 'network_nodes' | 'network_connections';
export type QueryAnalyticsTarget = 'queries';
export type QueryTarget = SignalTarget | InfrastructureTarget | MonitoringTarget | QueryAnalyticsTarget;

export type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'LIKE' | 'NOT LIKE' | 'REGEX' | 'NOT REGEX';
export type LogicalOperator = 'AND' | 'OR';

export type AggregationFunction =
  | 'count'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'rate'
  | 'increase'
  | 'irate'
  | 'delta'
  | 'p50'
  | 'p75'
  | 'p90'
  | 'p95'
  | 'p99'
  | 'histogram_quantile'
  | 'topk'
  | 'bottomk';

// ============================================================================
// Time Range Types
// ============================================================================

export interface RelativeTime {
  type: 'relative';
  value: number;
  unit: 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'y';
}

export interface AbsoluteTime {
  type: 'absolute';
  value: Date;
}

export type TimeValue = RelativeTime | AbsoluteTime;

export interface TimeRangeNode {
  type: 'TIMERANGE';
  from: TimeValue;
  to: TimeValue;
}

// ============================================================================
// Filter/Condition Types
// ============================================================================

export interface ConditionNode {
  type: 'CONDITION';
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  negated?: boolean;
}

export interface FilterNode {
  type: 'FILTER';
  conditions: (ConditionNode | FilterNode)[];
  logicalOperator: LogicalOperator;
}

// ============================================================================
// Aggregation Types
// ============================================================================

export interface AggregationNode {
  type: 'AGGREGATION';
  function: AggregationFunction;
  field: string;
  args?: unknown[];
  alias?: string;
}

export interface IntervalNode {
  type: 'INTERVAL';
  value: number;
  unit: 's' | 'm' | 'h' | 'd';
}

export interface GroupByNode {
  type: 'GROUP_BY';
  fields: string[];
}

// ============================================================================
// Order & Pagination Types
// ============================================================================

export interface OrderByClause {
  field: string;
  order: SortOrder;
}

export interface OrderByNode {
  type: 'ORDER_BY';
  clauses: OrderByClause[];
}

export interface LimitNode {
  type: 'LIMIT';
  value: number;
}

export interface OffsetNode {
  type: 'OFFSET';
  value: number;
}

// ============================================================================
// Main Query Nodes
// ============================================================================

export interface FetchNode {
  type: 'FETCH';
  target: QueryTarget;
  fields?: string[];
  filter?: FilterNode;
  timeRange?: TimeRangeNode;
  aggregation?: AggregationNode;
  interval?: IntervalNode;
  groupBy?: GroupByNode;
  orderBy?: OrderByNode;
  limit?: LimitNode;
  offset?: OffsetNode;
}

export interface CorrelateNode {
  type: 'CORRELATE';
  left: FetchNode;
  right: FetchNode;
  joinField: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT';
  timeRange?: TimeRangeNode;
}

export interface SubqueryNode {
  type: 'SUBQUERY';
  query: FetchNode | CorrelateNode;
  alias: string;
}

// ============================================================================
// PromQL Compatibility Types
// ============================================================================

export interface PromqlInstantVector {
  type: 'PROMQL_INSTANT_VECTOR';
  metricName: string;
  labelMatchers: PromqlLabelMatcher[];
}

export interface PromqlRangeVector {
  type: 'PROMQL_RANGE_VECTOR';
  metricName: string;
  labelMatchers: PromqlLabelMatcher[];
  range: string; // e.g., "5m", "1h"
}

export interface PromqlLabelMatcher {
  name: string;
  operator: '=' | '!=' | '=~' | '!~';
  value: string;
}

export interface PromqlAggregation {
  type: 'PROMQL_AGGREGATION';
  function: string;
  vector: PromqlInstantVector | PromqlRangeVector | PromqlAggregation;
  by?: string[];
  without?: string[];
  args?: unknown[];
}

export type PromqlNode = PromqlInstantVector | PromqlRangeVector | PromqlAggregation;

// ============================================================================
// Elasticsearch Compatibility Types
// ============================================================================

export interface ElasticBoolQuery {
  type: 'ELASTIC_BOOL';
  must?: ElasticQueryNode[];
  mustNot?: ElasticQueryNode[];
  should?: ElasticQueryNode[];
  filter?: ElasticQueryNode[];
  minimumShouldMatch?: number;
}

export interface ElasticTermQuery {
  type: 'ELASTIC_TERM';
  field: string;
  value: unknown;
}

export interface ElasticRangeQuery {
  type: 'ELASTIC_RANGE';
  field: string;
  gt?: unknown;
  gte?: unknown;
  lt?: unknown;
  lte?: unknown;
}

export interface ElasticMatchQuery {
  type: 'ELASTIC_MATCH';
  field: string;
  query: string;
  operator?: 'AND' | 'OR';
}

export interface ElasticWildcardQuery {
  type: 'ELASTIC_WILDCARD';
  field: string;
  value: string;
}

export interface ElasticRegexpQuery {
  type: 'ELASTIC_REGEXP';
  field: string;
  value: string;
}

export type ElasticQueryNode =
  | ElasticBoolQuery
  | ElasticTermQuery
  | ElasticRangeQuery
  | ElasticMatchQuery
  | ElasticWildcardQuery
  | ElasticRegexpQuery;

// ============================================================================
// Parsed Query Result
// ============================================================================

export interface ParsedQuery {
  dialect: 'tfql' | 'promql' | 'elasticsearch' | 'sql';
  ast: TfqlAstNode | PromqlNode | ElasticQueryNode;
  raw: string;
  metadata?: {
    parseTimeMs: number;
    warnings?: string[];
  };
}
