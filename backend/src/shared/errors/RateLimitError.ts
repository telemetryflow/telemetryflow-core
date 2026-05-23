/**
 * Rate Limit Error
 *
 * Thrown when rate limit is exceeded
 */

import { BaseError } from "./BaseError";

export class RateLimitError extends BaseError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", true, { retryAfter });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }

  static tooManyRequests(retryAfter?: number): RateLimitError {
    return new RateLimitError(
      "Too many requests. Please try again later.",
      retryAfter,
    );
  }
}
