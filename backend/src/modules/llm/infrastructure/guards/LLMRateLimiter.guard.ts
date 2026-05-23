/**
 * LLM Rate Limiter Guard
 * Enforces rate limiting per organization for LLM requests
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import type { AuthenticatedUser } from "../../../auth/interfaces/jwt-payload.interface";

// Rate limit configuration decorator key
export const LLM_RATE_LIMIT_KEY = "llm:rate_limit";

// Decorator to set custom rate limit
export function LLMRateLimit(requestsPerMinute: number) {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(LLM_RATE_LIMIT_KEY, requestsPerMinute, descriptor.value);
    } else {
      Reflect.defineMetadata(LLM_RATE_LIMIT_KEY, requestsPerMinute, target);
    }
    return descriptor || target;
  };
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class LLMRateLimiterGuard implements CanActivate {
  private readonly logger = new Logger(LLMRateLimiterGuard.name);
  private readonly rateLimitCache = new Map<string, RateLimitEntry>();
  private readonly defaultLimit: number;
  private readonly windowMs: number = 60 * 1000; // 1 minute window

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = this.configService.get<number>("LLM_DEFAULT_RATE_LIMIT", 100);

    // Clean up expired entries every minute
    setInterval(() => this.cleanupExpiredEntries(), 60 * 1000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user?.organizationId) {
      // No organization context, skip rate limiting
      return true;
    }

    // Get custom rate limit from decorator or use default
    const customLimit = this.reflector.getAllAndOverride<number>(LLM_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const limit = customLimit || this.defaultLimit;

    const key = `llm:${user.organizationId}`;
    const now = Date.now();

    // Get or create rate limit entry
    let entry = this.rateLimitCache.get(key);

    if (!entry || entry.resetAt <= now) {
      // Create new entry
      entry = {
        count: 0,
        resetAt: now + this.windowMs,
      };
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

      this.logger.warn(
        `Rate limit exceeded for organization ${user.organizationId}: ${entry.count}/${limit} requests`,
      );

      // Set rate limit headers
      const response = context.switchToHttp().getResponse();
      response.setHeader("X-RateLimit-Limit", limit);
      response.setHeader("X-RateLimit-Remaining", 0);
      response.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
      response.setHeader("Retry-After", retryAfter);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `LLM rate limit exceeded. Try again in ${retryAfter} seconds.`,
          error: "Too Many Requests",
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    entry.count++;
    this.rateLimitCache.set(key, entry);

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader("X-RateLimit-Limit", limit);
    response.setHeader("X-RateLimit-Remaining", Math.max(0, limit - entry.count));
    response.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    return true;
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.rateLimitCache.entries()) {
      if (entry.resetAt <= now) {
        this.rateLimitCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  /**
   * Get current rate limit status for an organization
   */
  getRateLimitStatus(organizationId: string): {
    limit: number;
    remaining: number;
    resetAt: Date;
  } {
    const key = `llm:${organizationId}`;
    const entry = this.rateLimitCache.get(key);
    const now = Date.now();

    if (!entry || entry.resetAt <= now) {
      return {
        limit: this.defaultLimit,
        remaining: this.defaultLimit,
        resetAt: new Date(now + this.windowMs),
      };
    }

    return {
      limit: this.defaultLimit,
      remaining: Math.max(0, this.defaultLimit - entry.count),
      resetAt: new Date(entry.resetAt),
    };
  }

  /**
   * Reset rate limit for an organization (admin use)
   */
  resetRateLimit(organizationId: string): void {
    const key = `llm:${organizationId}`;
    this.rateLimitCache.delete(key);
    this.logger.log(`Rate limit reset for organization ${organizationId}`);
  }
}
