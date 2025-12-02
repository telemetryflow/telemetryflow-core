/**
 * P25: Winston Logging Standardization
 * Logger Module Exports
 */

// Main service and module
export { LoggerService } from './logger.service';
export { LoggerModule } from './logger.module';
export { HttpLoggingInterceptor } from './http-logging.interceptor';

// Interfaces
export {
  LoggerType,
  LogLevel,
  LoggerConfig,
  LogMetadata,
  LogEntry,
  LokiConfig,
  FluentBitConfig,
  OpenSearchConfig,
  ConsoleConfig,
  OtelConfig,
} from './interfaces/logger-config.interface';

// Configuration
export {
  loadLoggerConfig,
  getEnabledTransportsSummary,
} from './config/logger.config';

// Transport factory (for advanced usage)
export {
  createConsoleTransport,
  createOtelTransport,
  createLokiTransport,
  createFluentBitTransport,
  createOpenSearchTransport,
  createTransports,
} from './transports/transport.factory';
