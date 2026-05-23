import { Inject } from '@nestjs/common';
import { CacheService } from '../cache.service';
import { CacheOptions } from '../interfaces/cache.interface';

/**
 * Options for the Cacheable decorator
 */
export interface CacheableOptions extends CacheOptions {
  /**
   * Key generator function
   * @param args Method arguments
   * @returns Cache key
   */
  keyGenerator?: (...args: unknown[]) => string;
  /**
   * Condition function to determine if result should be cached
   * @param result Method result
   * @returns true to cache, false to skip
   */
  condition?: (result: unknown) => boolean;
}

/**
 * Symbol for injecting CacheService
 */
export const CACHE_SERVICE_INJECT = Symbol('CACHE_SERVICE_INJECT');

/**
 * Decorator to cache method results
 *
 * @example
 * ```typescript
 * @Cacheable({ ttl: 60, prefix: 'user' })
 * async getUser(id: string): Promise<User> {
 *   return this.userRepository.findById(id);
 * }
 * ```
 *
 * @example with custom key generator
 * ```typescript
 * @Cacheable({
 *   ttl: 300,
 *   keyGenerator: (userId, options) => `user:${userId}:${options?.includeRoles}`
 * })
 * async getUserWithOptions(userId: string, options?: { includeRoles: boolean }): Promise<User> {
 *   // ...
 * }
 * ```
 */
export function Cacheable(options: CacheableOptions = {}): MethodDecorator {
  const injectCacheService = Inject(CacheService);

  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    // Inject CacheService
    injectCacheService(target, 'cacheService');

    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);

    descriptor.value = async function (...args: unknown[]) {
      const cacheService: CacheService = (this as Record<string, CacheService>).cacheService;

      if (!cacheService) {
        // CacheService not available, execute original method
        return originalMethod.apply(this, args);
      }

      // Generate cache key
      const prefix = options.prefix || `${className}:${methodName}`;
      let key: string;

      if (options.keyGenerator) {
        key = `${prefix}:${options.keyGenerator(...args)}`;
      } else {
        // Default: serialize arguments
        const argsKey = args.length > 0 ? JSON.stringify(args) : 'noargs';
        key = `${prefix}:${argsKey}`;
      }

      // Try to get from cache
      const cached = await cacheService.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Check condition
      if (options.condition && !options.condition(result)) {
        return result;
      }

      // Cache result
      await cacheService.set(key, result, {
        ttl: options.ttl,
        useL2: options.useL2,
      });

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator to invalidate cache entries
 *
 * @example
 * ```typescript
 * @CacheEvict({ prefix: 'user', allEntries: true })
 * async updateUser(id: string, data: UpdateUserDto): Promise<User> {
 *   return this.userRepository.update(id, data);
 * }
 * ```
 */
export function CacheEvict(options: {
  prefix?: string;
  key?: string;
  keyGenerator?: (...args: unknown[]) => string;
  allEntries?: boolean;
}): MethodDecorator {
  const injectCacheService = Inject(CacheService);

  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    injectCacheService(target, 'cacheService');

    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);

    descriptor.value = async function (...args: unknown[]) {
      const cacheService: CacheService = (this as Record<string, CacheService>).cacheService;

      // Execute original method first
      const result = await originalMethod.apply(this, args);

      if (!cacheService) {
        return result;
      }

      // Evict cache
      const prefix = options.prefix || `${className}:${methodName}`;

      if (options.allEntries) {
        await cacheService.deletePattern(`${prefix}:*`);
      } else if (options.key) {
        await cacheService.delete(`${prefix}:${options.key}`);
      } else if (options.keyGenerator) {
        const key = options.keyGenerator(...args);
        await cacheService.delete(`${prefix}:${key}`);
      }

      return result;
    };

    return descriptor;
  };
}
