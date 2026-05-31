/**
 * Property-based tests for IngestionRateLimiterService
 * Feature: ingestion-auth-api-key
 * Task 3.5 — Validates: Requirements 5.1, 5.2, 5.3, 5.5, 5.6, 5.7
 *
 * Properties tested:
 *  - Property 7: Environment-aware rate limit enforcement
 *    For any env/perKeyLimit/requestCount combination, the (limit+1)th request
 *    returns allowed=false.
 *  - Property 8: Rate limit result shape on all authenticated responses
 *    For any count below the limit, result always has limit/remaining/resetAt headers.
 */

import * as fc from "fast-check";
import { IngestionRateLimiterService } from "../IngestionRateLimiter.service";

// ── Mock ioredis ──────────────────────────────────────────────────────────────

let mockCount = 0;

const mockRedisInstance = {
  incr: jest.fn().mockImplementation(() => Promise.resolve(++mockCount)),
  expire: jest.fn().mockResolvedValue(1),
  quit: jest.fn().mockResolvedValue("OK"),
};

jest.mock("ioredis", () => jest.fn(() => mockRedisInstance));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeService(nodeEnv?: string): IngestionRateLimiterService {
  const configService = { get: jest.fn().mockReturnValue(undefined) } as any;
  const svc = new (IngestionRateLimiterService as any)(configService);
  // Override NODE_ENV per-test via resolveLimit
  if (nodeEnv !== undefined) {
    process.env.NODE_ENV = nodeEnv;
  }
  return svc;
}

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  mockCount = 0;
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Property 7: Environment-aware rate limit enforcement", () => {
  /**
   * For any env/perKeyLimit combination, resolveLimit() returns the expected value.
   * Production: perKeyLimit ?? 100
   * Non-production: always 1000 regardless of perKeyLimit
   */
  it("resolveLimit is deterministic: production uses perKeyLimit ?? 100", () => {
    fc.assert(
      fc.property(
        fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
        (perKeyLimit) => {
          process.env.NODE_ENV = "production";
          const svc = makeService("production");
          const limit = svc.resolveLimit(perKeyLimit ?? undefined);
          const expected = perKeyLimit ?? 100;
          return limit === expected;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("resolveLimit is deterministic: non-production always returns 1000", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("development", "staging", "test"),
        fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
        (env, perKeyLimit) => {
          process.env.NODE_ENV = env;
          const svc = makeService(env);
          const limit = svc.resolveLimit(perKeyLimit ?? undefined);
          return limit === 1000;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("the (limit+1)th request is denied", () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom("production", "development", "staging"),
        fc.option(fc.integer({ min: 1, max: 500 }), { nil: undefined }),
        async (env, perKeyLimit) => {
          process.env.NODE_ENV = env;
          const svc = makeService(env);
          const limit = svc.resolveLimit(perKeyLimit ?? undefined);

          // Simulate a count = limit + 1 (one over)
          mockRedisInstance.incr.mockResolvedValueOnce(limit + 1);
          const result = await svc.check("any-key", perKeyLimit ?? undefined);

          return result.allowed === false;
        },
      ),
      { numRuns: 50 },
    );
  });

  it("any request at or below the limit is allowed", () => {
    fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 100 }), async (count) => {
        process.env.NODE_ENV = "production";
        const svc = makeService("production");

        mockRedisInstance.incr.mockResolvedValueOnce(count);
        const result = await svc.check("any-key", 100);

        return result.allowed === true;
      }),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Property 8: Rate limit result shape on all responses", () => {
  /**
   * For any result from check(), the shape must include:
   *   - allowed: boolean
   *   - limit: positive integer
   *   - remaining: non-negative integer
   *   - resetAt: unix seconds > 0
   * And when allowed, remaining = max(0, limit - count).
   */
  it("result always has correct shape for allowed requests", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 99 }),
        async (count) => {
          process.env.NODE_ENV = "production";
          const svc = makeService("production");

          mockRedisInstance.incr.mockResolvedValueOnce(count);
          const result = await svc.check("key-test", 100);

          return (
            typeof result.allowed === "boolean" &&
            typeof result.limit === "number" &&
            result.limit > 0 &&
            typeof result.remaining === "number" &&
            result.remaining >= 0 &&
            typeof result.resetAt === "number" &&
            result.resetAt > 0
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("remaining is always max(0, limit - count)", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 200 }),
        async (count) => {
          process.env.NODE_ENV = "production";
          const svc = makeService("production");
          const perKeyLimit = 100;

          mockRedisInstance.incr.mockResolvedValueOnce(count);
          const result = await svc.check("key-test", perKeyLimit);

          const expectedRemaining = Math.max(0, perKeyLimit - count);
          return result.remaining === expectedRemaining;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("fail-open result always has correct shape on Redis error", () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 64 }),
        fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
        async (apiKeyId, perKeyLimit) => {
          process.env.NODE_ENV = "production";
          const svc = makeService("production");
          jest.spyOn((svc as any).logger, "warn").mockImplementation(() => {});
          mockRedisInstance.incr.mockRejectedValueOnce(new Error("Redis down"));

          const result = await svc.check(apiKeyId, perKeyLimit ?? undefined);

          return (
            result.allowed === true &&
            typeof result.limit === "number" &&
            result.limit > 0 &&
            typeof result.remaining === "number" &&
            typeof result.resetAt === "number"
          );
        },
      ),
      { numRuns: 50 },
    );
  });
});
