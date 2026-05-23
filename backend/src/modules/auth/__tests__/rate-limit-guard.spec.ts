/**
 * Rate Limit Guard Integration Tests
 *
 * Tests the rate limiting guard applied to authentication endpoints
 *
 * Requirements: 10.8, 10.9
 */

import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RateLimitGuard, RateLimit } from "../guards/rate-limit.guard";
import { RateLimiterService } from "../services/rate-limiter.service";
import { RateLimitError } from "../../../shared/errors/RateLimitError";

describe("RateLimitGuard", () => {
  let guard: RateLimitGuard;
  let rateLimiterService: jest.Mocked<RateLimiterService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockRateLimiterService = {
      checkRateLimit: jest.fn(),
    };

    const mockReflector = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        {
          provide: RateLimiterService,
          useValue: mockRateLimiterService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    rateLimiterService = module.get(RateLimiterService);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (
    request: any = {},
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ip: "127.0.0.1",
          headers: {},
          route: { path: "/auth/login" },
          path: "/auth/login",
          ...request,
        }),
      }),
      getHandler: jest.fn(),
    } as any;
  };

  describe("canActivate", () => {
    it("should allow request when no rate limit config is set", async () => {
      // Arrange
      reflector.get.mockReturnValue(undefined);
      const context = createMockExecutionContext();

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(rateLimiterService.checkRateLimit).not.toHaveBeenCalled();
    });

    it("should check rate limit when config is set", async () => {
      // Arrange
      const config = {
        limit: 5,
        windowMs: 60000,
      };
      reflector.get.mockReturnValue(config);
      rateLimiterService.checkRateLimit.mockResolvedValue(true);

      const context = createMockExecutionContext();

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(rateLimiterService.checkRateLimit).toHaveBeenCalledWith(
        "/auth/login:127.0.0.1",
        5,
        60000,
      );
    });

    it("should use custom key generator when provided", async () => {
      // Arrange
      const config = {
        limit: 3,
        windowMs: 60000,
        keyGenerator: (req: any) => `custom:${req.body?.email}`,
      };
      reflector.get.mockReturnValue(config);
      rateLimiterService.checkRateLimit.mockResolvedValue(true);

      const context = createMockExecutionContext({
        body: { email: "test@example.com" },
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(rateLimiterService.checkRateLimit).toHaveBeenCalledWith(
        "custom:test@example.com",
        3,
        60000,
      );
    });

    it("should throw RateLimitError when limit exceeded", async () => {
      // Arrange
      const config = {
        limit: 5,
        windowMs: 60000,
      };
      reflector.get.mockReturnValue(config);
      rateLimiterService.checkRateLimit.mockRejectedValue(
        RateLimitError.tooManyRequests(30),
      );

      const context = createMockExecutionContext();

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(RateLimitError);
    });

    it("should skip rate limiting when skipIf returns true", async () => {
      // Arrange
      const config = {
        limit: 5,
        windowMs: 60000,
        skipIf: (req: any) => req.headers["x-skip-rate-limit"] === "true",
      };
      reflector.get.mockReturnValue(config);

      const context = createMockExecutionContext({
        headers: { "x-skip-rate-limit": "true" },
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(rateLimiterService.checkRateLimit).not.toHaveBeenCalled();
    });

    it("should extract IP from x-forwarded-for header", async () => {
      // Arrange
      const config = {
        limit: 5,
        windowMs: 60000,
      };
      reflector.get.mockReturnValue(config);
      rateLimiterService.checkRateLimit.mockResolvedValue(true);

      const context = createMockExecutionContext({
        headers: { "x-forwarded-for": "203.0.113.1, 198.51.100.1" },
      });

      // Act
      await guard.canActivate(context);

      // Assert
      expect(rateLimiterService.checkRateLimit).toHaveBeenCalledWith(
        "/auth/login:203.0.113.1",
        5,
        60000,
      );
    });

    it("should extract IP from x-real-ip header when x-forwarded-for is not present", async () => {
      // Arrange
      const config = {
        limit: 5,
        windowMs: 60000,
      };
      reflector.get.mockReturnValue(config);
      rateLimiterService.checkRateLimit.mockResolvedValue(true);

      const context = createMockExecutionContext({
        headers: { "x-real-ip": "203.0.113.1" },
        ip: undefined,
      });

      // Act
      await guard.canActivate(context);

      // Assert
      expect(rateLimiterService.checkRateLimit).toHaveBeenCalledWith(
        "/auth/login:203.0.113.1",
        5,
        60000,
      );
    });
  });

  describe("RateLimit decorator", () => {
    it("should create metadata with correct config", () => {
      // Arrange
      const config = {
        limit: 5,
        windowMs: 60000,
      };

      // Act
      const decorator = RateLimit(config);

      // Assert
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe("function");
    });
  });
});
