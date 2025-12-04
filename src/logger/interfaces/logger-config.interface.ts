/**
 * P25: Winston Logging Standardization
 * Logger Configuration Interfaces
 */

/**
 * Logger type selection
 * - 'nestjs': Use native NestJS Logger (simple, console only)
 * - 'winston': Use Winston Logger with multiple transports
 */
export type LoggerType = 'nestjs' | 'winston';

/**
 * Log levels supported by the logger
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

/**
 * Loki transport configuration
 */
export interface LokiConfig {
  enabled: boolean;
  host: string;
  labels?: {
    app?: string;
    env?: string;
    [key: string]: string | undefined;
  };
  json?: boolean;
  batching?: boolean;
  interval?: number;
  timeout?: number;
  basicAuth?: {
    username: string;
    password: string;
  };
}

/**
 * FluentBit transport configuration
 */
export interface FluentBitConfig {
  enabled: boolean;
  host: string;
  port: number;
  tag: string;
  timeout?: number;
  requireAckResponse?: boolean;
  reconnectInterval?: number;
}

/**
 * OpenSearch transport configuration
 */
export interface OpenSearchConfig {
  enabled: boolean;
  node: string;
  username?: string;
  password?: string;
  index: string;
  indexSuffixPattern?: string;
  flushInterval?: number;
  bufferLimit?: number;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

/**
 * File transport configuration with daily rotation
 * Uses winston-daily-rotate-file for production log files
 */
export interface FileConfig {
  enabled: boolean;
  /** Directory for log files (default: 'logs') */
  dirname: string;
  /** Filename pattern (default: 'app-%DATE%.log') */
  filename: string;
  /** Date pattern for rotation (default: 'YYYY-MM-DD') */
  datePattern?: string;
  /** Compress rotated files with gzip (default: true) */
  zippedArchive?: boolean;
  /** Maximum file size before rotation (e.g., '20m', '100k') */
  maxSize?: string;
  /** Maximum number of days to keep logs (e.g., '14d') */
  maxFiles?: string;
  /** Use JSON format (default: true for production) */
  json?: boolean;
}

/**
 * Console transport configuration
 */
export interface ConsoleConfig {
  enabled: boolean;
  prettyPrint: boolean;
  colorize: boolean;
}

/**
 * OpenTelemetry transport configuration
 */
export interface OtelConfig {
  enabled: boolean;
}

/**
 * Main logger configuration
 */
export interface LoggerConfig {
  /** Logger type: 'nestjs' or 'winston' */
  type: LoggerType;

  /** Minimum log level */
  level: LogLevel;

  /** Application context for log messages */
  defaultContext?: string;

  /** Console transport settings */
  console: ConsoleConfig;

  /** OpenTelemetry transport settings */
  otel: OtelConfig;

  /** File transport settings (daily rotation) */
  file: FileConfig;

  /** Loki transport settings */
  loki: LokiConfig;

  /** FluentBit transport settings */
  fluentBit: FluentBitConfig;

  /** OpenSearch transport settings */
  openSearch: OpenSearchConfig;
}

/**
 * Log metadata for structured logging
 */
export interface LogMetadata {
  /** Trace ID from OpenTelemetry */
  traceId?: string;
  /** Span ID from OpenTelemetry */
  spanId?: string;
  /** Trace flags from OpenTelemetry */
  traceFlags?: number;
  /** Request ID for correlation */
  requestId?: string;
  /** Tenant ID for multi-tenancy */
  tenantId?: string;
  /** User ID for audit */
  userId?: string;
  /** Module/context name */
  context?: string;
  /** Additional custom metadata */
  [key: string]: unknown;
}

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: LogMetadata;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}
