import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { RateLimiterService } from "../services/rate-limiter.service";

/**
 * Rate limit configuration metadata
 */
export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  limit: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Key generator function to create unique rate limit keys
   * Default: uses IP address
   */
  keyGenerator?: (req: Request) => string;

  /**
   * Skip rate limiting if this function returns true
   */
  skipIf?: (req: Request) => boolean;
}

/**
 * Metadata key for rate limit configuration
 */
export const RATE_LIMIT_KEY = "rate_limit";

/**
 * Decorator to apply rate limiting to a route
 *
 * @param config - Rate limit configuration
 *
 * @example
 * ```typescript
 * @RateLimit({ limit: 5, windowMs: 15 * 60 * 1000 }) // 5 requests per 15 minutes
 * @Post('login')
 * async login() { ... }
 * ```
 *
 * @example
 * ```typescript
 * @RateLimit({
 *   limit: 3,
 *   windowMs: 60 * 60 * 1000, // 3 requests per hour
 *   keyGenerator: (req) => `password-reset:${req.body.email}`
 * })
 * @Post('password/forgot')
 * async forgotPassword() { ... }
 * ```
 */
export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Rate Limiting Guard
 *
 * Enforces rate limits on authentication endpoints using Redis-based
 * distributed rate limiting with sliding window algorithm.
 *
 * Features:
 * - Redis-based distributed rate limiting
 * - Sliding window algorithm for accurate rate limiting
 * - Configurable per-endpoint limits
 * - Custom key generation (IP, email, user ID, etc.)
 * - Returns 429 status with Retry-After header
 *
 * Requirements: 10.8, 10.9
 *
 * @example
 * ```typescript
 * @UseGuards(RateLimitGuard)
 * @RateLimit({ limit: 5, windowMs: 15 * 60 * 1000 })
 * @Post('login')
 * async login() { ... }
 * ```
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimiterService: RateLimiterService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get rate limit configuration from metadata
    const config = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // If no rate limit config, allow the request
    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Check if rate limiting should be skipped
    if (config.skipIf && config.skipIf(request)) {
      return true;
    }

    // Generate rate limit key
    const key = config.keyGenerator
      ? config.keyGenerator(request)
      : this.getDefaultKey(request);

    // Check rate limit
    await this.rateLimiterService.checkRateLimit(
      key,
      config.limit,
      config.windowMs,
    );

    return true;
  }

  /**
   * Default key generator using IP address and route path
   */
  private getDefaultKey(request: Request): string {
    const ip = this.getClientIp(request);
    const path = request.route?.path || request.path;
    return `${path}:${ip}`;
  }

  /**
   * Extract client IP address from request
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (request.headers["x-real-ip"] as string) ||
      request.ip ||
      request.socket?.remoteAddress ||
      "unknown"
    );
  }
}
