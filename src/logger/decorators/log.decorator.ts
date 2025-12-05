/**
 * P25: Winston Logging Standardization
 * @Log() Decorator for Automatic Method Logging
 *
 * Automatically logs method entry, exit, and errors
 */

import { IChildLogger } from '../interfaces/child-logger.interface';

/**
 * Options for @Log() decorator
 */
export interface LogDecoratorOptions {
  /**
   * Log level for entry/exit logs
   * Default: 'debug'
   */
  level?: 'debug' | 'info' | 'verbose';

  /**
   * Whether to log method parameters
   * Default: false
   */
  logParams?: boolean;

  /**
   * Whether to log method return value
   * Default: false
   */
  logResult?: boolean;

  /**
   * Whether to log execution time
   * Default: true
   */
  logDuration?: boolean;

  /**
   * Custom message prefix
   * Default: method name
   */
  prefix?: string;

  /**
   * Whether to log errors
   * Default: true
   */
  logErrors?: boolean;
}

/**
 * @Log() decorator for automatic method logging
 *
 * Usage:
 * ```typescript
 * class UserService {
 *   private readonly logger: IChildLogger;
 *
 *   constructor(loggerService: LoggerService) {
 *     this.logger = loggerService.createChildLogger('UserService');
 *   }
 *
 *   @Log({ logParams: true, logResult: true })
 *   async getUser(userId: string): Promise<User> {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export function Log(options: LogDecoratorOptions = {}): MethodDecorator {
  const {
    level = 'debug',
    logParams = false,
    logResult = false,
    logDuration = true,
    prefix,
    logErrors = true,
  } = options;

  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get logger from instance
      const logger: IChildLogger | undefined = this.logger;

      if (!logger) {
        // If no logger available, execute original method
        return originalMethod.apply(this, args);
      }

      const methodName = prefix || (typeof propertyKey === 'symbol' ? propertyKey.toString() : propertyKey);
      const startTime = Date.now();

      // Log method entry
      const entryMeta: Record<string, unknown> = {
        method: methodName,
        phase: 'entry',
      };

      if (logParams) {
        entryMeta.params = args;
      }

      logger[level](`→ ${methodName}`, entryMeta);

      try {
        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Calculate duration
        const duration = Date.now() - startTime;

        // Log method exit
        const exitMeta: Record<string, unknown> = {
          method: methodName,
          phase: 'exit',
        };

        if (logDuration) {
          exitMeta.duration = duration;
          exitMeta.durationMs = duration;
        }

        if (logResult) {
          exitMeta.result = result;
        }

        logger[level](`← ${methodName}`, exitMeta);

        return result;
      } catch (error) {
        // Log error
        if (logErrors) {
          const duration = Date.now() - startTime;
          logger.error(`✗ ${methodName} failed`, error as Error, {
            method: methodName,
            phase: 'error',
            duration,
            durationMs: duration,
          });
        }

        // Re-throw error
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * @LogAsync() decorator for async method logging
 * Alias for @Log() for clarity
 */
export const LogAsync = Log;

/**
 * @LogPerformance() decorator for performance-focused logging
 * Always logs duration, doesn't log params/results by default
 */
export function LogPerformance(prefix?: string) {
  return Log({
    level: 'info',
    logDuration: true,
    logParams: false,
    logResult: false,
    prefix,
  });
}

/**
 * @LogDebug() decorator for debug logging with full details
 * Logs params, results, and duration
 */
export function LogDebug(prefix?: string) {
  return Log({
    level: 'debug',
    logParams: true,
    logResult: true,
    logDuration: true,
    prefix,
  });
}
