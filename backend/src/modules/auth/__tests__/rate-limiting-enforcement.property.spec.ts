/**
 * Property-Based Tests for Rate Limiting Enforcement
 *
 * Feature: frontend-backend-auth-integration
 * Property 17: Rate limiting enforcement
 * Validates: Requirements 5.7, 6.4, 10.8, 10.9
 *
 * Tests that for any rate-limited endpoint (password reset, password reminder,
 * authentication), requests exceeding the limit should be rejected with a 429
 * status code and retry-after header.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { RateLimiterService } from "../services/rate-limiter.service";
import { CacheService } from "../../../shared/cache/cache.service";
import { RateLimitError } from "../../../shared/errors/RateLimitError";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 17: Rate limiting enforcement", () => {
    let rateLimiterService: RateLimiterService;
    let cacheService: jest.Mocked<CacheService>;

    beforeEach(async () => {
      // Create mock cache service
      const mockCacheService = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RateLimiterService,
          {
            provide: CacheService,
            useValue: mockCacheService,
          },
        ],
      }).compile();

      rateLimiterService = module.get<RateLimiterService>(RateLimiterService);
      cacheService = module.get(CacheService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    /**
     * **Validates: Requirements 10.8, 10.9**
     * Test that requests exceeding rate limit are rejected with 429 status
     */
    it("should reject requests exceeding rate limit with RateLimitError (429 status)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(), // user identifier
          fc.integer({ min: 2, max: 10 }), // rate limit (min 2 to ensure we can exceed it)
          fc.integer({ min: 10000, max: 60000 }), // window in ms
          async (email, limit, windowMs) => {
            // Clear mocks
            jest.clearAllMocks();

            const key = `test:${email}`;
            const now = Date.now();

            const gap = Math.max(1, Math.floor((windowMs / limit) - 1));
            const existingTimestamps = Array.from(
              { length: limit },
              (_, i) => now - i * gap - gap,
            );

            // Mock get to always return timestamps at limit
            cacheService.get.mockResolvedValue([...existingTimestamps]);
            cacheService.set.mockResolvedValue(undefined);

            // Property: Request exceeding limit should throw RateLimitError
            try {
              await rateLimiterService.checkRateLimit(key, limit, windowMs);
              fail("Should have thrown RateLimitError");
            } catch (error) {
              // Property: Error should be RateLimitError with 429 status code
              expect(error).toBeInstanceOf(RateLimitError);
              expect((error as RateLimitError).statusCode).toBe(429);
              expect((error as RateLimitError).errorCode).toBe(
                "RATE_LIMIT_EXCEEDED",
              );

              // Property: Error should include retry-after information
              expect((error as RateLimitError).retryAfter).toBeGreaterThan(0);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 10.9**
     * Test that rate limit errors include retry-after header value
     */
    it("should include retry-after value in rate limit errors", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }), // key
          fc.integer({ min: 1, max: 10 }), // limit
          fc.integer({ min: 10000, max: 120000 }), // window in ms (10s to 2min)
          async (key, limit, windowMs) => {
            // Clear mocks
            jest.clearAllMocks();

            const now = Date.now();

            // Create timestamps at the limit, with oldest at the start of window
            const oldestTimestamp = now - windowMs + 5000; // 5 seconds before window expires
            const existingTimestamps = [
              oldestTimestamp,
              ...Array.from({ length: limit - 1 }, (_, i) => now - i * 1000),
            ];

            cacheService.get.mockResolvedValue(existingTimestamps);

            // Property: Error should include retry-after value
            try {
              await rateLimiterService.checkRateLimit(key, limit, windowMs);
              fail("Should have thrown RateLimitError");
            } catch (error) {
              expect(error).toBeInstanceOf(RateLimitError);

              const rateLimitError = error as RateLimitError;

              // Property: retryAfter should be defined and positive
              expect(rateLimitError.retryAfter).toBeDefined();
              expect(rateLimitError.retryAfter).toBeGreaterThan(0);

              // Property: retryAfter should be reasonable (not more than window duration)
              const maxRetryAfter = Math.ceil(windowMs / 1000);
              expect(rateLimitError.retryAfter).toBeLessThanOrEqual(
                maxRetryAfter,
              );

              // Property: retryAfter should be approximately correct
              const expectedRetryAfter = Math.ceil(
                (oldestTimestamp + windowMs - now) / 1000,
              );
              expect(rateLimitError.retryAfter).toBeGreaterThanOrEqual(
                expectedRetryAfter - 1,
              ); // Allow 1 second tolerance
              expect(rateLimitError.retryAfter).toBeLessThanOrEqual(
                expectedRetryAfter + 1,
              );
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 5.7**
     * Test password reset rate limiting (3 requests per hour)
     */
    it("should enforce password reset rate limit (3 requests per hour per email)", async () => {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          // Clear mocks
          jest.clearAllMocks();

          const key = `password-reset:${email}`;
          const limit = 3;
          const windowMs = 60 * 60 * 1000; // 1 hour
          const now = Date.now();

          // Simulate 3 existing password reset requests
          const existingTimestamps = [now - 3000, now - 2000, now - 1000];

          cacheService.get.mockResolvedValue(existingTimestamps);

          // Property: 4th request should be rejected
          await expect(
            rateLimiterService.checkRateLimit(key, limit, windowMs),
          ).rejects.toThrow(RateLimitError);

          // Property: Error should indicate rate limit exceeded
          try {
            await rateLimiterService.checkRateLimit(key, limit, windowMs);
          } catch (error) {
            expect((error as RateLimitError).message).toContain(
              "Too many requests",
            );
          }

          return true;
        }),
        { numRuns: 50 },
      );
    });

    /**
     * **Validates: Requirements 6.4**
     * Test password reminder rate limiting (3 requests per day)
     */
    it("should enforce password reminder rate limit (3 requests per day per account)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }), // user ID
          async (userId) => {
            // Clear mocks
            jest.clearAllMocks();

            const key = `password-reminder:${userId}`;
            const limit = 3;
            const windowMs = 24 * 60 * 60 * 1000; // 24 hours
            const now = Date.now();

            // Simulate 3 existing password reminder requests
            const existingTimestamps = [now - 10000, now - 5000, now - 1000];

            cacheService.get.mockResolvedValue(existingTimestamps);

            // Property: 4th request should be rejected
            await expect(
              rateLimiterService.checkRateLimit(key, limit, windowMs),
            ).rejects.toThrow(RateLimitError);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    /**
     * **Validates: Requirements 10.8**
     * Test authentication endpoint rate limiting
     */
    it("should enforce authentication rate limiting on login attempts", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(), // IP address
          fc.integer({ min: 3, max: 10 }), // rate limit
          fc.integer({ min: 60000, max: 900000 }), // window (1-15 minutes)
          async (ipAddress, limit, windowMs) => {
            // Clear mocks
            jest.clearAllMocks();

            const key = `login:${ipAddress}`;
            const now = Date.now();

            // Simulate requests at the limit
            const existingTimestamps = Array.from(
              { length: limit },
              (_, i) => now - i * 1000,
            );

            cacheService.get.mockResolvedValue(existingTimestamps);

            // Property: Request exceeding limit should be rejected
            await expect(
              rateLimiterService.checkRateLimit(key, limit, windowMs),
            ).rejects.toThrow(RateLimitError);

            // Property: Cache should not be updated when limit exceeded
            expect(cacheService.set).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 10.8, 10.9**
     * Test that requests within limit are allowed
     */
    it("should allow requests within rate limit", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }), // key
          fc.integer({ min: 5, max: 20 }), // limit
          fc.integer({ min: 10000, max: 60000 }), // window in ms
          fc.integer({ min: 0, max: 4 }), // existing requests (less than limit)
          async (key, limit, windowMs, existingCount) => {
            // Ensure existing count is less than limit
            fc.pre(existingCount < limit);

            // Clear mocks
            jest.clearAllMocks();

            const now = Date.now();

            // Simulate existing requests below the limit
            const existingTimestamps = Array.from(
              { length: existingCount },
              (_, i) => now - i * 1000,
            );

            cacheService.get.mockResolvedValue(existingTimestamps);
            cacheService.set.mockResolvedValue(undefined);

            // Property: Request should be allowed
            const result = await rateLimiterService.checkRateLimit(
              key,
              limit,
              windowMs,
            );

            expect(result).toBe(true);

            // Property: Cache should be updated with new timestamp
            expect(cacheService.set).toHaveBeenCalledTimes(1);
            expect(cacheService.set).toHaveBeenCalledWith(
              `rate_limit:${key}`,
              expect.arrayContaining([expect.any(Number)]),
              expect.objectContaining({
                ttl: Math.ceil(windowMs / 1000),
                useL2: true,
              }),
            );

            // Property: New timestamp should be added
            const setCall = cacheService.set.mock.calls[0];
            const updatedTimestamps = setCall[1] as number[];
            expect(updatedTimestamps.length).toBe(existingCount + 1);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 10.8**
     * Test sliding window algorithm - old timestamps are filtered out
     */
    it("should filter out expired timestamps using sliding window", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }), // key
          fc.integer({ min: 3, max: 10 }), // limit
          fc.integer({ min: 30000, max: 120000 }), // window in ms
          async (key, limit, windowMs) => {
            // Clear mocks
            jest.clearAllMocks();

            const now = Date.now();

            // Create mix of expired and valid timestamps
            const expiredTimestamps = [
              now - windowMs - 10000, // Expired
              now - windowMs - 5000, // Expired
            ];

            const validTimestamps = [
              now - windowMs + 5000, // Valid
              now - 1000, // Valid
            ];

            const allTimestamps = [...expiredTimestamps, ...validTimestamps];

            cacheService.get.mockResolvedValue(allTimestamps);
            cacheService.set.mockResolvedValue(undefined);

            // Property: Request should be allowed (only 2 valid timestamps)
            const result = await rateLimiterService.checkRateLimit(
              key,
              limit,
              windowMs,
            );

            expect(result).toBe(true);

            // Property: Only valid timestamps should be kept
            const setCall = cacheService.set.mock.calls[0];
            const savedTimestamps = setCall[1] as number[];

            // Should have 2 valid + 1 new = 3 timestamps
            expect(savedTimestamps.length).toBe(3);

            // Property: All saved timestamps should be within window
            savedTimestamps.forEach((ts) => {
              expect(ts).toBeGreaterThan(now - windowMs);
            });

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 10.8**
     * Test that rate limiting is per-key (isolated between different keys)
     */
    it("should enforce rate limits independently per key", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.emailAddress(),
          fc.integer({ min: 2, max: 5 }), // limit
          fc.integer({ min: 30000, max: 60000 }), // window
          async (email1, email2, limit, windowMs) => {
            // Ensure emails are different
            fc.pre(email1 !== email2);

            // Clear mocks
            jest.clearAllMocks();

            const key1 = `test:${email1}`;
            const key2 = `test:${email2}`;
            const now = Date.now();

            // Key1 is at the limit
            const timestamps1 = Array.from(
              { length: limit },
              (_, i) => now - i * 1000,
            );

            // Key2 has no requests
            const timestamps2: number[] = [];

            cacheService.get.mockImplementation(async (key: string) => {
              if (key === `rate_limit:${key1}`) return timestamps1;
              if (key === `rate_limit:${key2}`) return timestamps2;
              return [];
            });

            cacheService.set.mockResolvedValue(undefined);

            // Property: Key1 should be rate limited
            await expect(
              rateLimiterService.checkRateLimit(key1, limit, windowMs),
            ).rejects.toThrow(RateLimitError);

            // Property: Key2 should be allowed (independent rate limit)
            const result = await rateLimiterService.checkRateLimit(
              key2,
              limit,
              windowMs,
            );

            expect(result).toBe(true);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    /**
     * **Validates: Requirements 10.9**
     * Test retry-after calculation accuracy
     */
    it("should calculate retry-after based on oldest timestamp expiry", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }), // key
          fc.integer({ min: 3, max: 5 }), // limit
          fc.integer({ min: 30000, max: 60000 }), // window in ms
          fc.integer({ min: 5000, max: 25000 }), // age of oldest timestamp
          async (key, limit, windowMs, oldestAge) => {
            // Ensure oldest timestamp is within window
            fc.pre(oldestAge < windowMs);

            // Clear mocks
            jest.clearAllMocks();

            const now = Date.now();
            const oldestTimestamp = now - oldestAge;

            // Create timestamps at the limit
            const existingTimestamps = [
              oldestTimestamp,
              ...Array.from({ length: limit - 1 }, (_, i) => now - i * 1000),
            ];

            cacheService.get.mockResolvedValue(existingTimestamps);

            // Property: Should throw with correct retry-after
            try {
              await rateLimiterService.checkRateLimit(key, limit, windowMs);
              fail("Should have thrown RateLimitError");
            } catch (error) {
              const rateLimitError = error as RateLimitError;

              // Calculate expected retry-after
              const expectedRetryAfterMs = oldestTimestamp + windowMs - now;
              const expectedRetryAfterSeconds = Math.ceil(
                expectedRetryAfterMs / 1000,
              );

              // Property: retry-after should match expected value
              expect(rateLimitError.retryAfter).toBe(expectedRetryAfterSeconds);

              // Property: retry-after should be positive
              expect(rateLimitError.retryAfter).toBeGreaterThan(0);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 10.8**
     * Test that rate limiter fails open on cache errors
     */
    it("should fail open (allow requests) when cache service fails", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }), // key
          fc.integer({ min: 1, max: 10 }), // limit
          fc.integer({ min: 10000, max: 60000 }), // window
          async (key, limit, windowMs) => {
            // Clear mocks
            jest.clearAllMocks();

            // Simulate cache failure
            cacheService.get.mockRejectedValue(
              new Error("Redis connection failed"),
            );

            // Property: Should allow request despite cache error (fail open)
            const result = await rateLimiterService.checkRateLimit(
              key,
              limit,
              windowMs,
            );

            expect(result).toBe(true);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    /**
     * **Validates: Requirements 10.8**
     * Test rate limit reset functionality
     */
    it("should reset rate limit when reset is called", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }), // key
          async (key) => {
            // Clear mocks
            jest.clearAllMocks();

            cacheService.delete.mockResolvedValue(undefined);

            // Property: Reset should delete the rate limit key
            await rateLimiterService.reset(key);

            expect(cacheService.delete).toHaveBeenCalledTimes(1);
            expect(cacheService.delete).toHaveBeenCalledWith(
              `rate_limit:${key}`,
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    /**
     * **Validates: Requirements 10.8**
     * Test getRemaining returns correct count
     */
    it("should return correct remaining request count", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }), // key
          fc.integer({ min: 5, max: 20 }), // limit
          fc.integer({ min: 30000, max: 60000 }), // window
          fc.integer({ min: 0, max: 10 }), // existing count
          async (key, limit, windowMs, existingCount) => {
            // Ensure existing count doesn't exceed limit
            fc.pre(existingCount <= limit);

            // Clear mocks
            jest.clearAllMocks();

            const now = Date.now();

            // Create existing timestamps within window
            const existingTimestamps = Array.from(
              { length: existingCount },
              (_, i) => now - i * 1000,
            );

            cacheService.get.mockResolvedValue(existingTimestamps);

            // Property: Should return correct remaining count
            const remaining = await rateLimiterService.getRemaining(
              key,
              limit,
              windowMs,
            );

            const expectedRemaining = limit - existingCount;
            expect(remaining).toBe(expectedRemaining);

            // Property: Remaining should never be negative
            expect(remaining).toBeGreaterThanOrEqual(0);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 10.8**
     * Test concurrent requests handling
     */
    it("should handle concurrent requests correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }), // key
          fc.integer({ min: 5, max: 10 }), // limit
          fc.integer({ min: 30000, max: 60000 }), // window
          fc.integer({ min: 2, max: 5 }), // concurrent requests
          async (key, limit, windowMs, concurrentCount) => {
            // Ensure concurrent requests don't exceed limit
            fc.pre(concurrentCount < limit);

            // Clear mocks
            jest.clearAllMocks();

            // Start with empty cache
            cacheService.get.mockResolvedValue([]);
            cacheService.set.mockResolvedValue(undefined);

            // Property: All concurrent requests should be allowed
            const promises = Array.from({ length: concurrentCount }, () =>
              rateLimiterService.checkRateLimit(key, limit, windowMs),
            );

            const results = await Promise.all(promises);

            // Property: All requests should succeed
            results.forEach((result) => {
              expect(result).toBe(true);
            });

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
