/**
 * P25: Winston Logging Standardization
 * Logger Module
 *
 * Makes the custom logger service available globally across the application.
 * Supports feature flag for switching between NestJS Logger and Winston.
 *
 * Configuration via environment variables:
 * - LOGGER_TYPE: 'nestjs' | 'winston' (default: 'nestjs')
 *
 * Usage in modules:
 * ```typescript
 * import { LoggerService } from '@/logger';
 *
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly logger: LoggerService) {}
 *
 *   doSomething() {
 *     this.logger.log('Something happened', 'MyService');
 *   }
 * }
 * ```
 */

import { Module, Global, DynamicModule } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';

/**
 * Logger Module Configuration Options
 */
export interface LoggerModuleOptions {
  /** Override default logger type */
  loggerType?: 'nestjs' | 'winston';
  /** Override default log level */
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
}

/**
 * Global Logger Module
 * Provides LoggerService throughout the application
 */
@Global()
@Module({
  providers: [LoggerService, RequestContextMiddleware],
  exports: [LoggerService, RequestContextMiddleware],
})
export class LoggerModule {
  /**
   * Register the logger module with default configuration
   * Configuration is loaded from environment variables
   */
  static forRoot(): DynamicModule {
    return {
      module: LoggerModule,
      providers: [LoggerService, RequestContextMiddleware],
      exports: [LoggerService, RequestContextMiddleware],
    };
  }

  /**
   * Register the logger module with custom configuration
   * Useful for testing or overriding default configuration
   */
  static forRootAsync(options: LoggerModuleOptions): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: 'LOGGER_OPTIONS',
          useValue: options,
        },
        LoggerService,
        RequestContextMiddleware,
      ],
      exports: [LoggerService, RequestContextMiddleware],
    };
  }
}
