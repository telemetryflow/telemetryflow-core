import { Injectable, Logger } from "@nestjs/common";
import { CacheService } from "../../../shared/cache/cache.service";
import { RateLimitError } from "../../../shared/errors/RateLimitError";

/**
 * RateLimiterService - Redis-based distributed rate limiter
 *
 * Responsibilities:
 * - Track request counts per key using Redis
 * - Enforce rate limits with sliding window algorithm
 * - Return retry-after information
 * - Support distributed rate limiting across multiple instances
 *
 * Requirements: 5.7, 6.4, 10.8, 10.9
 */
@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly RATE_LIMIT_PREFIX = "rate_limit:";

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Check if request is allowed under rate limit using Redis
   *
   * @param key - Rate limit key (e.g., "password-reset:email@telemetryflow.id")
   * @param limit - Maximum number of requests
   * @param windowMs - Time window in milliseconds
   * @returns True if request is allowed
   * @throws RateLimitError with 429 status if rate limit exceeded
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `${this.RATE_LIMIT_PREFIX}${key}`;

    try {
      // Get existing timestamps from Redis
      let timestamps: number[] =
        (await this.cacheService.get<number[]>(redisKey)) || [];

      // Remove timestamps outside the window
      timestamps = timestamps.filter((ts) => ts > windowStart);

      // Check if limit exceeded
      if (timestamps.length >= limit) {
        // Calculate retry-after (time until oldest request expires)
        const oldestTimestamp = timestamps[0];
        const retryAfterMs = oldestTimestamp + windowMs - now;
        const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

        this.logger.warn(
          `Rate limit exceeded for key: ${key}. Retry after ${retryAfterSeconds}s`,
        );

        throw RateLimitError.tooManyRequests(retryAfterSeconds);
      }

      // Add current timestamp
      timestamps.push(now);

      // Store updated timestamps in Redis with TTL
      const ttlSeconds = Math.ceil(windowMs / 1000);
      await this.cacheService.set(redisKey, timestamps, {
        ttl: ttlSeconds,
        useL2: true, // Only use Redis (L2), not in-memory cache
      });

      return true;
    } catch (error) {
      // If it's already a RateLimitError, re-throw it
      if (error instanceof RateLimitError) {
        throw error;
      }

      // Log other errors but allow the request (fail open)
      this.logger.error(
        `Rate limiter error for key ${key}: ${error.message}`,
        error.stack,
      );
      return true;
    }
  }

  /**
   * Reset rate limit for a key
   *
   * @param key - Rate limit key
   */
  async reset(key: string): Promise<void> {
    const redisKey = `${this.RATE_LIMIT_PREFIX}${key}`;
    await this.cacheService.delete(redisKey);
  }

  /**
   * Get remaining requests for a key
   *
   * @param key - Rate limit key
   * @param limit - Maximum number of requests
   * @param windowMs - Time window in milliseconds
   * @returns Number of remaining requests
   */
  async getRemaining(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<number> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `${this.RATE_LIMIT_PREFIX}${key}`;

    try {
      let timestamps: number[] =
        (await this.cacheService.get<number[]>(redisKey)) || [];
      timestamps = timestamps.filter((ts) => ts > windowStart);

      return Math.max(0, limit - timestamps.length);
    } catch (error) {
      this.logger.error(
        `Error getting remaining requests for key ${key}: ${error.message}`,
      );
      return limit; // Return full limit on error (fail open)
    }
  }
}
