/**
 * Unit tests for IngestionRateLimiterService
 * Feature: ingestion-auth-api-key
 * Task 3.4 — Validates: Requirements 5.1, 5.2, 5.3, 5.8, 5.9
 *
 * Tests cover:
 *  - Fixed-window INCR/EXPIRE logic
 *  - Allowed / not-allowed boundary at the limit
 *  - Fail-open on Redis error (WARN logged)
 *  - Environment-aware limit resolution (prod/dev/staging/unset)
 *  - Per-key override in production only
 *  - Redis key naming schema
 */

import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { IngestionRateLimiterService } from "../IngestionRateLimiter.service";

// ── Mock ioredis ─────────────────────────────────────────────────────────────

const mockRedisInstance = {
  incr: jest.fn(),
  expire: jest.fn(),
  quit: jest.fn().mockResolvedValue("OK"),
};

jest.mock("ioredis", () => jest.fn(() => mockRedisInstance));

// ─────────────────────────────────────────────────────────────────────────────

describe("IngestionRateLimiterService", () => {
  let service: IngestionRateLimiterService;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedisInstance.expire.mockResolvedValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionRateLimiterService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<IngestionRateLimiterService>(
      IngestionRateLimiterService,
    );
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  // ── check() ───────────────────────────────────────────────────────────────

  describe("check()", () => {
    it("first request in window → allowed, remaining = limit - 1, EXPIRE called with 2× window", async () => {
      process.env.NODE_ENV = "production";
      mockRedisInstance.incr.mockResolvedValue(1);

      const result = await service.check("key-abc");

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(99);
      expect(mockRedisInstance.expire).toHaveBeenCalledWith(
        expect.stringMatching(/^rate_limit:key-abc:/),
        120,
      );
    });

    it("Nth request exactly at limit → allowed, remaining = 0", async () => {
      process.env.NODE_ENV = "production";
      mockRedisInstance.incr.mockResolvedValue(100);

      const result = await service.check("key-abc");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it("(N+1)th request over limit → not allowed, remaining = 0", async () => {
      process.env.NODE_ENV = "production";
      mockRedisInstance.incr.mockResolvedValue(101);

      const result = await service.check("key-abc");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("EXPIRE is NOT called when count > 1 (TTL already set)", async () => {
      process.env.NODE_ENV = "production";
      mockRedisInstance.incr.mockResolvedValue(5);

      await service.check("key-abc");

      expect(mockRedisInstance.expire).not.toHaveBeenCalled();
    });

    it("Redis error → fail-open: allowed = true, WARN logged", async () => {
      process.env.NODE_ENV = "production";
      mockRedisInstance.incr.mockRejectedValue(new Error("ECONNREFUSED"));
      const warnSpy = jest
        .spyOn((service as any).logger, "warn")
        .mockImplementation(() => {});

      const result = await service.check("key-xyz");

      expect(result.allowed).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("key-xyz"));
    });

    it("Redis error → fail-open result has expected shape", async () => {
      process.env.NODE_ENV = "production";
      mockRedisInstance.incr.mockRejectedValue(new Error("timeout"));
      jest.spyOn((service as any).logger, "warn").mockImplementation(() => {});

      const result = await service.check("key-fail", 50);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(50);
      expect(result.remaining).toBe(50);
      expect(typeof result.resetAt).toBe("number");
    });

    it("resetAt is set to windowStart + 60", async () => {
      process.env.NODE_ENV = "production";
      mockRedisInstance.incr.mockResolvedValue(1);

      const before = Math.floor(Date.now() / 1000 / 60) * 60;
      const result = await service.check("key-abc");
      const after = Math.floor(Date.now() / 1000 / 60) * 60;

      expect(result.resetAt).toBeGreaterThanOrEqual(before + 60);
      expect(result.resetAt).toBeLessThanOrEqual(after + 60);
    });
  });

  // ── resolveLimit() ────────────────────────────────────────────────────────

  describe("resolveLimit()", () => {
    it("NODE_ENV=production, no per-key limit → 100 req/min", () => {
      process.env.NODE_ENV = "production";
      expect(service.resolveLimit(undefined)).toBe(100);
    });

    it("NODE_ENV=production, per-key limit set → uses per-key limit", () => {
      process.env.NODE_ENV = "production";
      expect(service.resolveLimit(250)).toBe(250);
    });

    it("NODE_ENV=development, per-key limit set → 1000 req/min (ignores per-key)", () => {
      process.env.NODE_ENV = "development";
      expect(service.resolveLimit(50)).toBe(1000);
    });

    it("NODE_ENV=development, per-key limit set → 1000 req/min (ignores per-key)", () => {
      process.env.NODE_ENV = "staging";
      expect(service.resolveLimit(200)).toBe(1000);
    });

    it("NODE_ENV unset → defaults to production limits (100 req/min)", () => {
      delete process.env.NODE_ENV;
      expect(service.resolveLimit(undefined)).toBe(100);
    });

    it("NODE_ENV unset with per-key limit → uses per-key (production behaviour)", () => {
      delete process.env.NODE_ENV;
      expect(service.resolveLimit(75)).toBe(75);
    });
  });

  // ── Redis key schema ──────────────────────────────────────────────────────

  describe("Redis key schema", () => {
    it("uses rate_limit:{apiKeyId}:{windowStart} as Redis key", async () => {
      process.env.NODE_ENV = "production";
      mockRedisInstance.incr.mockResolvedValue(1);

      const now = Date.now();
      const windowStart = Math.floor(now / 1000 / 60) * 60;

      await service.check("tfk_abc123def456");

      expect(mockRedisInstance.incr).toHaveBeenCalledWith(
        `rate_limit:tfk_abc123def456:${windowStart}`,
      );
    });

    it("different API keys use different Redis keys", async () => {
      process.env.NODE_ENV = "production";
      mockRedisInstance.incr.mockResolvedValue(1);

      await service.check("key-alpha");
      await service.check("key-beta");

      const calls = mockRedisInstance.incr.mock.calls.map(
        (c: any[]) => c[0] as string,
      );
      expect(calls[0]).toContain("key-alpha");
      expect(calls[1]).toContain("key-beta");
      expect(calls[0]).not.toBe(calls[1]);
    });
  });
});
