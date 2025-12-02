/**
 * P25: Winston Logging Standardization
 * Logger Service with Feature Flag Support
 *
 * Provides two logging modes:
 * - 'nestjs': Native NestJS Logger (simple, console only)
 * - 'winston': Winston Logger with multiple transports
 *
 * Configuration via environment variables:
 * - LOGGER_TYPE: 'nestjs' | 'winston' (default: 'nestjs')
 * - LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug' | 'verbose'
 * - LOKI_ENABLED, FLUENTBIT_ENABLED, OPENSEARCH_ENABLED: Enable transports
 */

import {
  Injectable,
  Logger,
  LoggerService as NestLoggerService,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as winston from 'winston';
import { trace, context as otelContext } from '@opentelemetry/api';
import {
  LoggerConfig,
  LogMetadata,
} from './interfaces/logger-config.interface';
import {
  loadLoggerConfig,
  getEnabledTransportsSummary,
} from './config/logger.config';
import { createTransports } from './transports/transport.factory';

/**
 * Custom Winston format to add OpenTelemetry trace context
 */
const otelContextFormat = winston.format((info) => {
  const span = trace.getSpan(otelContext.active());
  if (span) {
    const spanContext = span.spanContext();
    info.traceId = spanContext.traceId;
    info.spanId = spanContext.spanId;
    info.traceFlags = spanContext.traceFlags;
  }
  return info;
});

/**
 * Logger Service with Feature Flag Support
 * Implements NestJS LoggerService interface for compatibility
 */
@Injectable()
export class LoggerService implements NestLoggerService, OnModuleInit, OnModuleDestroy {
  private config: LoggerConfig;
  private winstonLogger: winston.Logger | null = null;
  private nestLogger: Logger;
  private initialized = false;

  constructor() {
    this.config = loadLoggerConfig();
    this.nestLogger = new Logger('TelemetryFlow');
  }

  /**
   * Initialize logger on module init
   * This allows async transport creation
   */
  async onModuleInit() {
    if (this.initialized) return;

    if (this.config.type === 'winston') {
      await this.initializeWinstonLogger();
    }

    this.initialized = true;

    const enabledTransports = getEnabledTransportsSummary(this.config);
    this.nestLogger.log(
      `[LoggerService] Logger initialized. Transports: ${enabledTransports.join(', ')}`,
    );
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    if (this.winstonLogger) {
      this.winstonLogger.close();
    }
  }

  /**
   * Initialize Winston logger with configured transports
   */
  private async initializeWinstonLogger() {
    const transports = await createTransports(this.config);

    if (transports.length === 0) {
      console.warn(
        '[LoggerService] No transports configured. Falling back to console.',
      );
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      );
    }

    this.winstonLogger = winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        otelContextFormat(),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'telemetryflow',
        env: process.env.NODE_ENV || 'development',
      },
      transports,
      exitOnError: false,
    });
  }

  /**
   * Check if Winston logger is active
   */
  private isWinstonActive(): boolean {
    return this.config.type === 'winston' && this.winstonLogger !== null;
  }

  /**
   * Format message with context
   */
  private formatMessage(message: unknown): string {
    if (typeof message === 'object') {
      return JSON.stringify(message);
    }
    return String(message);
  }

  /**
   * Log at info level
   */
  log(message: unknown, context?: string): void;
  log(message: unknown, ...optionalParams: unknown[]): void;
  log(message: unknown, contextOrParams?: string | unknown, ...rest: unknown[]): void {
    const ctx = typeof contextOrParams === 'string' ? contextOrParams : undefined;
    const meta = typeof contextOrParams === 'object' ? contextOrParams : undefined;

    if (this.isWinstonActive()) {
      if (typeof message === 'object') {
        this.winstonLogger!.info(message as Record<string, unknown>);
      } else {
        this.winstonLogger!.info(this.formatMessage(message), {
          context: ctx,
          ...(meta as Record<string, unknown>),
        });
      }
    } else {
      this.nestLogger.log(message, ctx);
    }
  }

  /**
   * Log at error level
   */
  error(message: unknown, trace?: string, context?: string): void;
  error(message: unknown, ...optionalParams: unknown[]): void;
  error(
    message: unknown,
    traceOrParams?: string | unknown,
    contextOrRest?: string | unknown,
  ): void {
    const trace = typeof traceOrParams === 'string' ? traceOrParams : undefined;
    const ctx = typeof contextOrRest === 'string' ? contextOrRest : undefined;

    if (this.isWinstonActive()) {
      if (typeof message === 'object') {
        this.winstonLogger!.error(message as Record<string, unknown>);
      } else {
        this.winstonLogger!.error(this.formatMessage(message), {
          trace,
          context: ctx,
        });
      }
    } else {
      this.nestLogger.error(message, trace, ctx);
    }
  }

  /**
   * Log at warn level
   */
  warn(message: unknown, context?: string): void;
  warn(message: unknown, ...optionalParams: unknown[]): void;
  warn(message: unknown, contextOrParams?: string | unknown): void {
    const ctx = typeof contextOrParams === 'string' ? contextOrParams : undefined;

    if (this.isWinstonActive()) {
      if (typeof message === 'object') {
        this.winstonLogger!.warn(message as Record<string, unknown>);
      } else {
        this.winstonLogger!.warn(this.formatMessage(message), { context: ctx });
      }
    } else {
      this.nestLogger.warn(message, ctx);
    }
  }

  /**
   * Log at debug level
   */
  debug(message: unknown, context?: string): void;
  debug(message: unknown, ...optionalParams: unknown[]): void;
  debug(message: unknown, contextOrParams?: string | unknown): void {
    const ctx = typeof contextOrParams === 'string' ? contextOrParams : undefined;

    if (this.isWinstonActive()) {
      if (typeof message === 'object') {
        this.winstonLogger!.debug(message as Record<string, unknown>);
      } else {
        this.winstonLogger!.debug(this.formatMessage(message), { context: ctx });
      }
    } else {
      this.nestLogger.debug?.(message, ctx);
    }
  }

  /**
   * Log at verbose level
   */
  verbose(message: unknown, context?: string): void;
  verbose(message: unknown, ...optionalParams: unknown[]): void;
  verbose(message: unknown, contextOrParams?: string | unknown): void {
    const ctx = typeof contextOrParams === 'string' ? contextOrParams : undefined;

    if (this.isWinstonActive()) {
      if (typeof message === 'object') {
        this.winstonLogger!.verbose(message as Record<string, unknown>);
      } else {
        this.winstonLogger!.verbose(this.formatMessage(message), { context: ctx });
      }
    } else {
      this.nestLogger.verbose?.(message, ctx);
    }
  }

  /**
   * Log with additional metadata (Winston only)
   * Falls back to regular log for NestJS logger
   */
  logWithMetadata(
    level: 'info' | 'error' | 'warn' | 'debug' | 'verbose',
    message: string,
    metadata: LogMetadata,
  ): void {
    if (this.isWinstonActive()) {
      this.winstonLogger!.log(level, message, metadata);
    } else {
      // Format metadata for NestJS logger
      const { context, ...rest } = metadata;
      const formattedMessage =
        Object.keys(rest).length > 0 ? `${message} ${JSON.stringify(rest)}` : message;

      switch (level) {
        case 'error':
          this.nestLogger.error(formattedMessage, undefined, context);
          break;
        case 'warn':
          this.nestLogger.warn(formattedMessage, context);
          break;
        case 'debug':
          this.nestLogger.debug?.(formattedMessage, context);
          break;
        case 'verbose':
          this.nestLogger.verbose?.(formattedMessage, context);
          break;
        default:
          this.nestLogger.log(formattedMessage, context);
      }
    }
  }

  /**
   * Log structured data with automatic trace context
   * Recommended for service-level logging
   */
  logStructured(
    level: 'info' | 'error' | 'warn' | 'debug' | 'verbose',
    message: string,
    data?: Record<string, unknown>,
    logContext?: string,
  ): void {
    const span = trace.getSpan(otelContext.active());
    const metadata: LogMetadata = {
      context: logContext,
      ...data,
    };

    if (span) {
      const spanContext = span.spanContext();
      metadata.traceId = spanContext.traceId;
      metadata.spanId = spanContext.spanId;
      metadata.traceFlags = spanContext.traceFlags;
    }

    this.logWithMetadata(level, message, metadata);
  }

  /**
   * Get the underlying Winston logger instance
   * Returns null if using NestJS logger
   */
  getWinstonLogger(): winston.Logger | null {
    return this.winstonLogger;
  }

  /**
   * Get the current logger configuration
   */
  getConfig(): LoggerConfig {
    return this.config;
  }

  /**
   * Check if a specific transport is enabled
   */
  isTransportEnabled(
    transport: 'console' | 'otel' | 'loki' | 'fluentBit' | 'openSearch',
  ): boolean {
    if (this.config.type !== 'winston') return false;

    switch (transport) {
      case 'console':
        return this.config.console.enabled;
      case 'otel':
        return this.config.otel.enabled;
      case 'loki':
        return this.config.loki.enabled;
      case 'fluentBit':
        return this.config.fluentBit.enabled;
      case 'openSearch':
        return this.config.openSearch.enabled;
      default:
        return false;
    }
  }

  /**
   * Create a child logger with a specific context
   * Useful for module-specific logging
   */
  createChildLogger(context: string): LoggerService {
    // For now, return this instance with context binding
    // In future, could return a new instance with modified config
    const childLogger = Object.create(this) as LoggerService;

    // Override methods to include context
    const originalLog = this.log.bind(this);
    childLogger.log = (message: unknown) => originalLog(message, context);

    const originalError = this.error.bind(this);
    childLogger.error = (message: unknown, trace?: string) =>
      originalError(message, trace, context);

    const originalWarn = this.warn.bind(this);
    childLogger.warn = (message: unknown) => originalWarn(message, context);

    const originalDebug = this.debug.bind(this);
    childLogger.debug = (message: unknown) => originalDebug(message, context);

    const originalVerbose = this.verbose.bind(this);
    childLogger.verbose = (message: unknown) => originalVerbose(message, context);

    return childLogger;
  }
}
