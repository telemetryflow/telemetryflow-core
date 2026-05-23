/**
 * TFQL (TelemetryFlow Query Language) Types
 * Core type definitions for the query language
 */

import { TfqlAstNode, ParsedQuery, QueryTarget } from './ast-nodes.types';

// ============================================================================
// Query Dialect
// ============================================================================

export enum QueryDialect {
  TFQL = 'tfql',
  PROMQL = 'promql',
  ELASTICSEARCH = 'elasticsearch',
  SQL = 'sql',
}

// ============================================================================
// Parser Configuration
// ============================================================================

export interface TfqlParserConfig {
  /** Enable strict mode - reject unknown keywords */
  strict?: boolean;
  /** Default time range if not specified */
  defaultTimeRange?: {
    value: number;
    unit: 's' | 'm' | 'h' | 'd';
  };
  /** Maximum query depth for nested subqueries */
  maxDepth?: number;
  /** Allowed targets (for access control) */
  allowedTargets?: QueryTarget[];
  /** Enable PromQL compatibility mode */
  promqlCompatibility?: boolean;
  /** Enable Elasticsearch compatibility mode */
  elasticsearchCompatibility?: boolean;
}

// ============================================================================
// Lexer Types
// ============================================================================

export enum TokenType {
  // Keywords
  FETCH = 'FETCH',
  WHERE = 'WHERE',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  IN = 'IN',
  LIKE = 'LIKE',
  REGEX = 'REGEX',
  TIMERANGE = 'TIMERANGE',
  LAST = 'LAST',
  AGGREGATE = 'AGGREGATE',
  BY = 'BY',
  INTERVAL = 'INTERVAL',
  GROUP = 'GROUP',
  ORDER = 'ORDER',
  ASC = 'ASC',
  DESC = 'DESC',
  LIMIT = 'LIMIT',
  OFFSET = 'OFFSET',
  CORRELATE = 'CORRELATE',
  WITH = 'WITH',
  ON = 'ON',
  AS = 'AS',

  // Signal Targets
  METRICS = 'METRICS',
  LOGS = 'LOGS',
  TRACES = 'TRACES',
  EXEMPLARS = 'EXEMPLARS',
  CORRELATIONS = 'CORRELATIONS',

  // Infrastructure Targets
  AGENTS = 'AGENTS',
  VMS = 'VMS',
  CLUSTERS = 'CLUSTERS',
  NAMESPACES = 'NAMESPACES',
  NODES = 'NODES',
  PODS = 'PODS',
  DEPLOYMENTS = 'DEPLOYMENTS',
  PVS = 'PVS',
  PVCS = 'PVCS',

  // Monitoring Targets
  MONITORS = 'MONITORS',
  STATUS_PAGES = 'STATUS_PAGES',
  INCIDENTS = 'INCIDENTS',
  SERVICES = 'SERVICES',
  SERVICE_DEPENDENCIES = 'SERVICE_DEPENDENCIES',
  NETWORK_NODES = 'NETWORK_NODES',
  NETWORK_CONNECTIONS = 'NETWORK_CONNECTIONS',

  // Query Analytics Target
  QUERIES = 'QUERIES',

  // Aggregation Functions
  COUNT = 'COUNT',
  SUM = 'SUM',
  AVG = 'AVG',
  MIN = 'MIN',
  MAX = 'MAX',
  RATE = 'RATE',
  INCREASE = 'INCREASE',
  IRATE = 'IRATE',
  DELTA = 'DELTA',
  P50 = 'P50',
  P75 = 'P75',
  P90 = 'P90',
  P95 = 'P95',
  P99 = 'P99',
  HISTOGRAM_QUANTILE = 'HISTOGRAM_QUANTILE',
  TOPK = 'TOPK',
  BOTTOMK = 'BOTTOMK',

  // Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DURATION = 'DURATION',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',

  // Operators
  EQUALS = 'EQUALS',           // =
  NOT_EQUALS = 'NOT_EQUALS',   // !=
  GREATER = 'GREATER',         // >
  LESS = 'LESS',               // <
  GREATER_EQ = 'GREATER_EQ',   // >=
  LESS_EQ = 'LESS_EQ',         // <=
  TILDE = 'TILDE',             // ~ (regex match)
  NOT_TILDE = 'NOT_TILDE',     // !~

  // Punctuation
  LPAREN = 'LPAREN',           // (
  RPAREN = 'RPAREN',           // )
  LBRACE = 'LBRACE',           // {
  RBRACE = 'RBRACE',           // }
  LBRACKET = 'LBRACKET',       // [
  RBRACKET = 'RBRACKET',       // ]
  COMMA = 'COMMA',             // ,
  DOT = 'DOT',                 // .
  COLON = 'COLON',             // :
  SEMICOLON = 'SEMICOLON',     // ;

  // Special
  EOF = 'EOF',
  NEWLINE = 'NEWLINE',
  COMMENT = 'COMMENT',
  WHITESPACE = 'WHITESPACE',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  position: number;
}

// ============================================================================
// Parser Error Types
// ============================================================================

export class TfqlParseError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number,
    public readonly position: number,
    public readonly token?: Token,
  ) {
    super(`Parse error at line ${line}, column ${column}: ${message}`);
    this.name = 'TfqlParseError';
  }
}

export class TfqlLexerError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number,
    public readonly position: number,
  ) {
    super(`Lexer error at line ${line}, column ${column}: ${message}`);
    this.name = 'TfqlLexerError';
  }
}

export class TfqlTranslationError extends Error {
  constructor(
    message: string,
    public readonly astNode?: TfqlAstNode,
  ) {
    super(`Translation error: ${message}`);
    this.name = 'TfqlTranslationError';
  }
}

// ============================================================================
// Translator Types
// ============================================================================

export interface TranslatedQuery {
  sql: string;
  params: Record<string, unknown>;
  dataSource: 'clickhouse' | 'postgres';
  target: QueryTarget;
}

export interface TranslatorContext {
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
  timeZone?: string;
  defaultLimit?: number;
}

// ============================================================================
// Query Execution Types
// ============================================================================

export interface TfqlQueryRequest {
  query: string;
  variables?: Record<string, unknown>;
  timeout?: number;
  maxRows?: number;
}

export interface TfqlQueryResult<T = unknown> {
  data: T[];
  total: number;
  metadata: {
    queryId: string;
    dialect: QueryDialect;
    parsedQuery: ParsedQuery;
    translatedQuery: TranslatedQuery;
    executionTimeMs: number;
    cached: boolean;
  };
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// Duration Parsing
// ============================================================================

export interface ParsedDuration {
  value: number;
  unit: 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'y';
  totalSeconds: number;
}

export function parseDuration(duration: string): ParsedDuration {
  const match = duration.match(/^(\d+)(s|m|h|d|w|M|y)$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] as ParsedDuration['unit'];

  const multipliers: Record<string, number> = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400,
    'w': 604800,
    'M': 2592000, // 30 days
    'y': 31536000, // 365 days
  };

  return {
    value,
    unit,
    totalSeconds: value * multipliers[unit],
  };
}

// ============================================================================
// Keyword Mappings
// ============================================================================

export const TFQL_KEYWORDS: Record<string, TokenType> = {
  'FETCH': TokenType.FETCH,
  'WHERE': TokenType.WHERE,
  'AND': TokenType.AND,
  'OR': TokenType.OR,
  'NOT': TokenType.NOT,
  'IN': TokenType.IN,
  'LIKE': TokenType.LIKE,
  'REGEX': TokenType.REGEX,
  'TIMERANGE': TokenType.TIMERANGE,
  'LAST': TokenType.LAST,
  'AGGREGATE': TokenType.AGGREGATE,
  'BY': TokenType.BY,
  'INTERVAL': TokenType.INTERVAL,
  'GROUP': TokenType.GROUP,
  'ORDER': TokenType.ORDER,
  'ASC': TokenType.ASC,
  'DESC': TokenType.DESC,
  'LIMIT': TokenType.LIMIT,
  'OFFSET': TokenType.OFFSET,
  'CORRELATE': TokenType.CORRELATE,
  'WITH': TokenType.WITH,
  'ON': TokenType.ON,
  'AS': TokenType.AS,

  // Targets (lowercase accepted)
  'METRICS': TokenType.METRICS,
  'metrics': TokenType.METRICS,
  'LOGS': TokenType.LOGS,
  'logs': TokenType.LOGS,
  'TRACES': TokenType.TRACES,
  'traces': TokenType.TRACES,
  'EXEMPLARS': TokenType.EXEMPLARS,
  'exemplars': TokenType.EXEMPLARS,
  'CORRELATIONS': TokenType.CORRELATIONS,
  'correlations': TokenType.CORRELATIONS,
  'AGENTS': TokenType.AGENTS,
  'agents': TokenType.AGENTS,
  'VMS': TokenType.VMS,
  'vms': TokenType.VMS,
  'CLUSTERS': TokenType.CLUSTERS,
  'clusters': TokenType.CLUSTERS,
  'NAMESPACES': TokenType.NAMESPACES,
  'namespaces': TokenType.NAMESPACES,
  'NODES': TokenType.NODES,
  'nodes': TokenType.NODES,
  'PODS': TokenType.PODS,
  'pods': TokenType.PODS,
  'DEPLOYMENTS': TokenType.DEPLOYMENTS,
  'deployments': TokenType.DEPLOYMENTS,
  'PVS': TokenType.PVS,
  'pvs': TokenType.PVS,
  'PVCS': TokenType.PVCS,
  'pvcs': TokenType.PVCS,
  'MONITORS': TokenType.MONITORS,
  'monitors': TokenType.MONITORS,
  'STATUS_PAGES': TokenType.STATUS_PAGES,
  'status_pages': TokenType.STATUS_PAGES,
  'INCIDENTS': TokenType.INCIDENTS,
  'incidents': TokenType.INCIDENTS,
  'SERVICES': TokenType.SERVICES,
  'services': TokenType.SERVICES,
  'SERVICE_DEPENDENCIES': TokenType.SERVICE_DEPENDENCIES,
  'service_dependencies': TokenType.SERVICE_DEPENDENCIES,
  'NETWORK_NODES': TokenType.NETWORK_NODES,
  'network_nodes': TokenType.NETWORK_NODES,
  'NETWORK_CONNECTIONS': TokenType.NETWORK_CONNECTIONS,
  'network_connections': TokenType.NETWORK_CONNECTIONS,

  // Query Analytics
  'queries': TokenType.QUERIES,
  'QUERIES': TokenType.QUERIES,

  // Aggregations
  'count': TokenType.COUNT,
  'COUNT': TokenType.COUNT,
  'sum': TokenType.SUM,
  'SUM': TokenType.SUM,
  'avg': TokenType.AVG,
  'AVG': TokenType.AVG,
  'min': TokenType.MIN,
  'MIN': TokenType.MIN,
  'max': TokenType.MAX,
  'MAX': TokenType.MAX,
  'rate': TokenType.RATE,
  'RATE': TokenType.RATE,
  'increase': TokenType.INCREASE,
  'INCREASE': TokenType.INCREASE,
  'irate': TokenType.IRATE,
  'IRATE': TokenType.IRATE,
  'delta': TokenType.DELTA,
  'DELTA': TokenType.DELTA,
  'p50': TokenType.P50,
  'P50': TokenType.P50,
  'p75': TokenType.P75,
  'P75': TokenType.P75,
  'p90': TokenType.P90,
  'P90': TokenType.P90,
  'p95': TokenType.P95,
  'P95': TokenType.P95,
  'p99': TokenType.P99,
  'P99': TokenType.P99,
  'histogram_quantile': TokenType.HISTOGRAM_QUANTILE,
  'HISTOGRAM_QUANTILE': TokenType.HISTOGRAM_QUANTILE,
  'topk': TokenType.TOPK,
  'TOPK': TokenType.TOPK,
  'bottomk': TokenType.BOTTOMK,
  'BOTTOMK': TokenType.BOTTOMK,

  // Boolean literals
  'true': TokenType.BOOLEAN,
  'TRUE': TokenType.BOOLEAN,
  'false': TokenType.BOOLEAN,
  'FALSE': TokenType.BOOLEAN,
  'null': TokenType.NULL,
  'NULL': TokenType.NULL,
};

export const TARGET_TOKEN_MAP: Record<TokenType, QueryTarget | null> = {
  [TokenType.METRICS]: 'metrics',
  [TokenType.LOGS]: 'logs',
  [TokenType.TRACES]: 'traces',
  [TokenType.EXEMPLARS]: 'exemplars',
  [TokenType.CORRELATIONS]: 'correlations',
  [TokenType.AGENTS]: 'agents',
  [TokenType.VMS]: 'vms',
  [TokenType.CLUSTERS]: 'clusters',
  [TokenType.NAMESPACES]: 'namespaces',
  [TokenType.NODES]: 'nodes',
  [TokenType.PODS]: 'pods',
  [TokenType.DEPLOYMENTS]: 'deployments',
  [TokenType.PVS]: 'pvs',
  [TokenType.PVCS]: 'pvcs',
  [TokenType.MONITORS]: 'monitors',
  [TokenType.STATUS_PAGES]: 'status_pages',
  [TokenType.INCIDENTS]: 'incidents',
  [TokenType.SERVICES]: 'services',
  [TokenType.SERVICE_DEPENDENCIES]: 'service_dependencies',
  [TokenType.NETWORK_NODES]: 'network_nodes',
  [TokenType.NETWORK_CONNECTIONS]: 'network_connections',
  [TokenType.QUERIES]: 'queries',
} as Record<TokenType, QueryTarget | null>;
