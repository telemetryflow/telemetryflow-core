/**
 * Rate Limiter Service Unit Tests
 *
 * Tests the Redis-based rate limiting functionality
 *
 * Requirements: 10.8, 10.9
 */

import { Test, TestingModule } from "@nestjs/testing";
import { RateLimiterService } from "../services/rate-limiter.service";
import { CacheService } from "../../../shared/cache/cache.service";
import { RateLimitError } from "../../../shared/errors/RateLimitError";

describe("RateLimiterService", () => {
  let service: RateLimiterService;
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

    service = module.get<RateLimiterService>(RateLimiterService);
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("checkRateLimit", () => {
    it("should allow request when under limit", async () => {
      // Arrange
      const key = "test:user@example.com";
      const limit = 5;
      const windowMs = 60000; // 1 minute

      cacheService.get.mockResolvedValue([]);

      // Act
      const result = await service.checkRateLimit(key, limit, windowMs);

      // Assert
      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith("rate_limit:test:user@example.com");
      expect(cacheService.set).toHaveBeenCalled();
    });

    it("should throw RateLimitError when limit exceeded", async () => {
      // Arrange
      const key = "test:user@example.com";
      const limit = 3;
      const windowMs = 60000; // 1 minute
      const now = Date.now();

      // Simulate 3 existing requests within the window
      const existingTimestamps = [
        now - 50000, // 50 seconds ago
        now - 30000, // 30 seconds ago
        now - 10000, // 10 seconds ago
      ];

      cacheService.get.mockResolvedValue(existingTimestamps);

      // Act & Assert
      await expect(
        service.checkRateLimit(key, limit, windowMs),
      ).rejects.toThrow(RateLimitError);

      expect(cacheService.get).toHaveBeenCalledWith("rate_limit:test:user@example.com");
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it("should include retry-after in error when limit exceeded", async () => {
      // Arrange
      const key = "test:user@example.com";
      const limit = 3;
      const windowMs = 60000; // 1 minute
      const now = Date.now();

      const existingTimestamps = [
        now - 50000, // 50 seconds ago
        now - 30000,
        now - 10000,
      ];

      cacheService.get.mockResolvedValue(existingTimestamps);

      // Act & Assert
      try {
        await service.checkRateLimit(key, limit, windowMs);
        fail("Should have thrown RateLimitError");
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBeGreaterThan(0);
        expect((error as RateLimitError).retryAfter).toBeLessThanOrEqual(60);
      }
    });

    it("should filter out expired timestamps", async () => {
      // Arrange
      const key = "test:user@example.com";
      const limit = 3;
      const windowMs = 60000; // 1 minute
      const now = Date.now();

      // Mix of expired and valid timestamps
      const existingTimestamps = [
        now - 120000, // 2 minutes ago (expired)
        now - 90000, // 1.5 minutes ago (expired)
        now - 30000, // 30 seconds ago (valid)
        now - 10000, // 10 seconds ago (valid)
      ];

      cacheService.get.mockResolvedValue(existingTimestamps);

      // Act
      const result = await service.checkRateLimit(key, limit, windowMs);

      // Assert
      expect(result).toBe(true);
      expect(cacheService.set).toHaveBeenCalled();

      // Verify only valid timestamps are kept
      const setCall = cacheService.set.mock.calls[0];
      const savedTimestamps = setCall[1] as number[];
      expect(savedTimestamps.length).toBe(3); // 2 valid + 1 new
    });

    it("should fail open on cache errors", async () => {
      // Arrange
      const key = "test:user@example.com";
      const limit = 3;
      const windowMs = 60000;

      cacheService.get.mockRejectedValue(new Error("Redis connection failed"));

      // Act
      const result = await service.checkRateLimit(key, limit, windowMs);

      // Assert
      expect(result).toBe(true); // Should allow request on error
    });

    it("should use correct TTL for Redis storage", async () => {
      // Arrange
      const key = "test:user@example.com";
      const limit = 5;
      const windowMs = 60000; // 1 minute

      cacheService.get.mockResolvedValue([]);

      // Act
      await service.checkRateLimit(key, limit, windowMs);

      // Assert
      expect(cacheService.set).toHaveBeenCalledWith(
        "rate_limit:test:user@example.com",
        expect.any(Array),
        {
          ttl: 60, // windowMs / 1000
          useL2: true,
        },
      );
    });
  });

  describe("reset", () => {
    it("should delete rate limit key from cache", async () => {
      // Arrange
      const key = "test:user@example.com";

      // Act
      await service.reset(key);

      // Assert
      expect(cacheService.delete).toHaveBeenCalledWith(
        "rate_limit:test:user@example.com",
      );
    });
  });

  describe("getRemaining", () => {
    it("should return remaining requests", async () => {
      // Arrange
      const key = "test:user@example.com";
      const limit = 5;
      const windowMs = 60000;
      const now = Date.now();

      const existingTimestamps = [
        now - 30000, // 30 seconds ago
        now - 10000, // 10 seconds ago
      ];

      cacheService.get.mockResolvedValue(existingTimestamps);

      // Act
      const remaining = await service.getRemaining(key, limit, windowMs);

      // Assert
      expect(remaining).toBe(3); // 5 - 2 = 3
    });

    it("should return 0 when limit reached", async () => {
      // Arrange
      const key = "test:user@example.com";
      const limit = 3;
      const windowMs = 60000;
      const now = Date.now();

      const existingTimestamps = [now - 30000, now - 20000, now - 10000];

      cacheService.get.mockResolvedValue(existingTimestamps);

      // Act
      const remaining = await service.getRemaining(key, limit, windowMs);

      // Assert
      expect(remaining).toBe(0);
    });

    it("should return full limit on cache error", async () => {
      // Arrange
      const key = "test:user@example.com";
      const limit = 5;
      const windowMs = 60000;

      cacheService.get.mockRejectedValue(new Error("Redis error"));

      // Act
      const remaining = await service.getRemaining(key, limit, windowMs);

      // Assert
      expect(remaining).toBe(5); // Return full limit on error
    });
  });
});
