/**
 * Logger Module Exports
 * P25: Winston Logging Standardization
 */

// Main service
export { LoggerService } from './logger.service';
export { LoggerModule } from './logger.module';

// Child logger
export { ChildLogger } from './child-logger';
export type { IChildLogger } from './interfaces/child-logger.interface';

// Context management
export { RequestContextManager } from './context/request-context';
export type { RequestContext } from './context/request-context';
export { RequestContextMiddleware } from './middleware/request-context.middleware';

// Enrichment
export { LogEnrichment } from './enrichment/context-enrichment';
export type {
  TenantContext,
  UserContext,
} from './enrichment/context-enrichment';

// Decorators
export { Log } from './decorators/log.decorator';

// Utilities
export type { ILogSampler } from './utils/sampling.util';
export {
  ProbabilitySampler,
  RateLimitSampler,
  AdaptiveSampler,
  ErrorOnlySampler,
  createSampler,
} from './utils/sampling.util';
export type {
  SamplingStrategy,
  SamplingConfig,
  SamplingStats,
} from './utils/sampling.util';

// Interfaces
export type {
  LoggerConfig,
  LogMetadata,
  LogLevel,
  LoggerType,
  ConsoleConfig,
  OtelConfig,
  FileConfig,
  LokiConfig,
  FluentBitConfig,
  OpenSearchConfig,
  LogEntry,
} from './interfaces/logger-config.interface';

// HTTP Interceptor
export { HttpLoggingInterceptor } from './http-logging.interceptor';
