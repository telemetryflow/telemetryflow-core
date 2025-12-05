/**
 * P25: Winston Logging Standardization
 * Child Logger Interface
 *
 * Defines the interface for child loggers with context binding
 */

import { LogMetadata } from './logger-config.interface';

/**
 * Child logger interface with pre-bound context
 * Used for module-specific logging
 */
export interface IChildLogger {
  /**
   * Log at info level with context
   */
  info(message: string, meta?: LogMetadata): void;

  /**
   * Log at warn level with context
   */
  warn(message: string, meta?: LogMetadata): void;

  /**
   * Log at error level with context
   */
  error(message: string, error?: Error, meta?: LogMetadata): void;

  /**
   * Log at debug level with context
   */
  debug(message: string, meta?: LogMetadata): void;

  /**
   * Log at verbose level with context
   */
  verbose(message: string, meta?: LogMetadata): void;

  /**
   * Start a performance timer for an operation
   * Returns a function that when called, logs the duration
   */
  startTimer(operation: string): () => void;

  /**
   * Log a business audit event
   */
  audit(action: string, meta: AuditMetadata): void;

  /**
   * Log a metric value
   */
  metric(name: string, value: number, meta?: MetricMetadata): void;

  /**
   * Get the context name for this logger
   */
  getContext(): string;
}

/**
 * Audit metadata for audit logs
 */
export interface AuditMetadata extends LogMetadata {
  /** User ID performing the action */
  userId?: string;
  /** Tenant ID where action occurred */
  tenantId?: string;
  /** Workspace ID where action occurred */
  workspaceId?: string;
  /** Resource ID being acted upon */
  resourceId?: string;
  /** Resource type */
  resourceType?: string;
  /** IP address of the actor */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Previous state (for updates) */
  previousState?: Record<string, unknown>;
  /** New state (for updates) */
  newState?: Record<string, unknown>;
}

/**
 * Metric metadata for metric logs
 */
export interface MetricMetadata extends LogMetadata {
  /** Metric unit (e.g., 'ms', 'bytes', 'count') */
  unit?: string;
  /** Metric tags */
  tags?: Record<string, string>;
}
