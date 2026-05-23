/**
 * IngestionRateLimiterService
 *
 * Fixed-window rate limiter for API key ingestion endpoints.
 * Uses Redis INCR + EXPIRE for atomic, low-latency counting.
 *
 * Window: 60 seconds
 * Default limits:
 *   - PRODUCTION (NODE_ENV=production or unset): perKeyLimit ?? 100 req/min
 *   - DEVELOPMENT / STAGING: 1000 req/min (ignores per-key override)
 *
 * Fail-open: Redis errors are caught, logged at WARN, and treated as allowed.
 */

import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Unix timestamp (seconds) when the current window resets */
  resetAt: number;
}

export const INGESTION_RATE_LIMITER_SERVICE = Symbol(
  "INGESTION_RATE_LIMITER_SERVICE",
);

const WINDOW_SECONDS = 60;
const PROD_DEFAULT_LIMIT = 100;
const NON_PROD_LIMIT = 1000;

@Injectable()
export class IngestionRateLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(IngestionRateLimiterService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>("REDIS_HOST") || "localhost",
      port: parseInt(
        this.configService.get<string>("REDIS_PORT") || "6379",
        10,
      ),
      password: this.configService.get<string>("REDIS_PASSWORD") || undefined,
      db: parseInt(
        this.configService.get<string>("REDIS_RATE_LIMIT_DB") || "1",
        10,
      ),
      lazyConnect: true,
      enableOfflineQueue: false,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit().catch(() => {});
  }

  /**
   * Check and increment the rate limit counter for the given API key.
   * Returns a RateLimitResult indicating whether the request is allowed.
   */
  async check(
    apiKeyId: string,
    perKeyLimit?: number,
  ): Promise<RateLimitResult> {
    const limit = this.resolveLimit(perKeyLimit);
    const windowStart =
      Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS;
    const resetAt = windowStart + WINDOW_SECONDS;
    const redisKey = `rate_limit:${apiKeyId}:${windowStart}`;

    try {
      const count = await this.redis.incr(redisKey);

      // Set TTL on first increment (2× window for safety)
      if (count === 1) {
        await this.redis.expire(redisKey, WINDOW_SECONDS * 2);
      }

      const remaining = Math.max(0, limit - count);
      const allowed = count <= limit;

      return { allowed, limit, remaining, resetAt };
    } catch (err) {
      this.logger.warn(
        `Rate limiter Redis error for key ${apiKeyId}: ${(err as Error).message} — failing open`,
      );
      return { allowed: true, limit, remaining: limit, resetAt };
    }
  }

  /**
   * Resolve the effective rate limit based on environment.
   * Non-production environments always use NON_PROD_LIMIT regardless of per-key setting.
   */
  resolveLimit(perKeyLimit?: number): number {
    const env = process.env.NODE_ENV;
    const isProduction = !env || env === "production";
    if (!isProduction) {
      return NON_PROD_LIMIT;
    }
    return perKeyLimit ?? PROD_DEFAULT_LIMIT;
  }
}
