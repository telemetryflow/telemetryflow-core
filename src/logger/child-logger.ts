/**
 * P25: Winston Logging Standardization
 * Child Logger Implementation
 *
 * Implements a child logger with pre-bound context
 */

import * as winston from 'winston';
import { trace, context as otelContext } from '@opentelemetry/api';
import {
  IChildLogger,
  AuditMetadata,
  MetricMetadata,
} from './interfaces/child-logger.interface';
import { LogMetadata } from './interfaces/logger-config.interface';

/**
 * Child Logger Implementation
 * Wraps Winston logger with context binding and enhanced features
 */
export class ChildLogger implements IChildLogger {
  constructor(
    private readonly logger: winston.Logger,
    private readonly context: string,
    private readonly defaultMetadata?: Record<string, unknown>,
  ) {}

  /**
   * Get current trace context from OpenTelemetry
   */
  private getTraceContext(): Partial<LogMetadata> {
    const span = trace.getSpan(otelContext.active());
    if (span) {
      const spanContext = span.spanContext();
      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
        traceFlags: spanContext.traceFlags,
      };
    }
    return {};
  }

  /**
   * Merge metadata with context and trace information
   */
  private mergeMetadata(meta?: LogMetadata): LogMetadata {
    return {
      context: this.context,
      ...this.defaultMetadata,
      ...this.getTraceContext(),
      ...meta,
    };
  }

  /**
   * Log at info level
   */
  info(message: string, meta?: LogMetadata): void {
    this.logger.info(message, this.mergeMetadata(meta));
  }

  /**
   * Log at warn level
   */
  warn(message: string, meta?: LogMetadata): void {
    this.logger.warn(message, this.mergeMetadata(meta));
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error, meta?: LogMetadata): void {
    const errorMeta: LogMetadata = {
      ...meta,
    };

    if (error) {
      errorMeta.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    this.logger.error(message, this.mergeMetadata(errorMeta));
  }

  /**
   * Log at debug level
   */
  debug(message: string, meta?: LogMetadata): void {
    this.logger.debug(message, this.mergeMetadata(meta));
  }

  /**
   * Log at verbose level
   */
  verbose(message: string, meta?: LogMetadata): void {
    this.logger.verbose(message, this.mergeMetadata(meta));
  }

  /**
   * Start a performance timer
   * Returns a function that logs the duration when called
   */
  startTimer(operation: string): () => void {
    const startTime = Date.now();
    const startMeta = this.mergeMetadata({
      operation,
      phase: 'start',
    });

    this.logger.debug(`Operation started: ${operation}`, startMeta);

    return () => {
      const duration = Date.now() - startTime;
      const endMeta = this.mergeMetadata({
        operation,
        phase: 'end',
        duration,
        durationMs: duration,
      });

      this.logger.info(`Operation completed: ${operation}`, endMeta);
    };
  }

  /**
   * Log a business audit event
   */
  audit(action: string, meta: AuditMetadata): void {
    const auditMeta = this.mergeMetadata({
      ...meta,
      action,
      eventType: 'audit',
      timestamp: new Date().toISOString(),
    });

    this.logger.info(`Audit: ${action}`, auditMeta);
  }

  /**
   * Log a metric value
   */
  metric(name: string, value: number, meta?: MetricMetadata): void {
    const metricMeta = this.mergeMetadata({
      ...meta,
      metricName: name,
      metricValue: value,
      eventType: 'metric',
    });

    this.logger.info(`Metric: ${name} = ${value}`, metricMeta);
  }

  /**
   * Get the context name for this logger
   */
  getContext(): string {
    return this.context;
  }
}
