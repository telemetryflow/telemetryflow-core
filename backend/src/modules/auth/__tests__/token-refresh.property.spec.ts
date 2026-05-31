/**
 * Property-Based Tests for Authentication - Token Refresh Flow
 *
 * Feature: frontend-backend-auth-integration
 * Property 29: Token refresh flow
 * Validates: Requirements 9.2, 9.3
 *
 * Tests that for any expired access token with valid refresh token, the system
 * should issue a new access token without requiring re-authentication, and
 * optionally rotate the refresh token.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import {
  TokenService,
  TokenPayload,
  SessionTokens,
} from "../services/token.service";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 29: Token refresh flow", () => {
    let tokenService: TokenService;
    let jwtService: JwtService;
    let mockRedisClient: any;

    beforeEach(async () => {
      // Mock Redis client
      mockRedisClient = {
        setex: jest.fn().mockResolvedValue("OK"),
        exists: jest.fn().mockResolvedValue(0),
        quit: jest.fn().mockResolvedValue("OK"),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TokenService,
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn((payload, options) => {
                // Generate a mock JWT token with unique timestamp
                // Add a small random offset to ensure uniqueness
                const now = Math.floor(Date.now() / 1000) + Math.random() * 0.001;
                const header = Buffer.from(
                  JSON.stringify({ alg: "HS256", typ: "JWT" }),
                ).toString("base64");
                const payloadStr = Buffer.from(
                  JSON.stringify({
                    ...payload,
                    iat: now,
                    exp:
                      now +
                      (options.expiresIn === "15m" ? 900 : 604800),
                  }),
                ).toString("base64");
                return `${header}.${payloadStr}.signature`;
              }),
              verify: jest.fn((token, options) => {
                // Decode the mock token
                const parts = token.split(".");
                if (parts.length !== 3) {
                  throw new Error("Invalid token");
                }
                const payload = JSON.parse(
                  Buffer.from(parts[1], "base64").toString(),
                );

                // Check expiry
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp && payload.exp < now) {
                  throw new Error("Token expired");
                }

                return payload;
              }),
              decode: jest.fn((token) => {
                try {
                  const parts = token.split(".");
                  if (parts.length !== 3) {
                    return null;
                  }
                  return JSON.parse(Buffer.from(parts[1], "base64").toString());
                } catch {
                  return null;
                }
              }),
            },
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, any> = {
                  "auth.jwt.secret": "test-secret",
                  "auth.jwt.refreshSecret": "test-refresh-secret",
                  "auth.jwt.accessTokenExpiry": "15m",
                  "auth.jwt.refreshTokenExpiry": "7d",
                  "auth.redis.host": "localhost",
                  "auth.redis.port": 6379,
                  "auth.redis.password": undefined,
                  "auth.redis.db": 0,
                  "auth.redis.keyPrefix": "auth:",
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      tokenService = module.get<TokenService>(TokenService);
      jwtService = module.get<JwtService>(JwtService);

      // Replace Redis client with mock
      (tokenService as any).redisClient = mockRedisClient;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should issue new access token for any valid refresh token", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid user IDs (UUIDs)
          fc.uuid(),
          // Generate valid session IDs (UUIDs)
          fc.uuid(),
          // Generate valid device IDs (UUIDs)
          fc.uuid(),
          async (userId, sessionId, deviceId) => {
            // Generate initial tokens
            const initialTokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Property: Refresh token should be valid
            expect(initialTokens.refreshToken).toBeDefined();
            expect(typeof initialTokens.refreshToken).toBe("string");

            // Use refresh token to get new access token
            const refreshedTokens = await tokenService.refreshAccessToken(
              initialTokens.refreshToken,
              false,
            );

            // Property: New access token should be issued
            expect(refreshedTokens.accessToken).toBeDefined();
            expect(typeof refreshedTokens.accessToken).toBe("string");

            // Property: New access token should be different from initial
            expect(refreshedTokens.accessToken).not.toBe(
              initialTokens.accessToken,
            );

            // Property: Refresh token should remain the same when not rotating
            expect(refreshedTokens.refreshToken).toBe(
              initialTokens.refreshToken,
            );

            // Property: Expiry time should be set correctly (15 minutes = 900 seconds)
            expect(refreshedTokens.expiresIn).toBe(900);

            // Property: New access token should contain correct payload
            const payload = jwtService.decode(
              refreshedTokens.accessToken,
            ) as TokenPayload;
            expect(payload.userId).toBe(userId);
            expect(payload.sessionId).toBe(sessionId);
            expect(payload.deviceId).toBe(deviceId);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should optionally rotate refresh token when requested", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.boolean(),
          async (userId, sessionId, deviceId, rotateRefreshToken) => {
            // Generate initial tokens
            const initialTokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Use refresh token with rotation flag
            const refreshedTokens = await tokenService.refreshAccessToken(
              initialTokens.refreshToken,
              rotateRefreshToken,
            );

            // Property: New access token should always be issued
            expect(refreshedTokens.accessToken).toBeDefined();

            if (rotateRefreshToken) {
              // Property: Refresh token should be different when rotating
              expect(refreshedTokens.refreshToken).not.toBe(
                initialTokens.refreshToken,
              );

              // Property: Old refresh token should be revoked
              expect(mockRedisClient.setex).toHaveBeenCalled();

              // Property: New refresh token should contain same user/session/device
              const newPayload = jwtService.decode(
                refreshedTokens.refreshToken,
              ) as TokenPayload;
              expect(newPayload.userId).toBe(userId);
              expect(newPayload.sessionId).toBe(sessionId);
              expect(newPayload.deviceId).toBe(deviceId);
            } else {
              // Property: Refresh token should remain the same when not rotating
              expect(refreshedTokens.refreshToken).toBe(
                initialTokens.refreshToken,
              );
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject revoked refresh tokens", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (userId, sessionId, deviceId) => {
            // Generate tokens
            const tokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Revoke the refresh token
            await tokenService.revokeToken(tokens.refreshToken);

            // Mock Redis to return that token is revoked
            mockRedisClient.exists.mockResolvedValueOnce(1);

            // Property: Attempting to use revoked refresh token should fail
            await expect(
              tokenService.refreshAccessToken(tokens.refreshToken, false),
            ).rejects.toThrow(UnauthorizedException);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should preserve user identity across token refresh", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 1, max: 10 }),
          async (userId, sessionId, deviceId, numRefreshes) => {
            // Generate initial tokens
            let currentTokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Property: Perform multiple refreshes
            for (let i = 0; i < numRefreshes; i++) {
              currentTokens = await tokenService.refreshAccessToken(
                currentTokens.refreshToken,
                false,
              );

              // Property: User identity should be preserved
              const payload = jwtService.decode(
                currentTokens.accessToken,
              ) as TokenPayload;
              expect(payload.userId).toBe(userId);
              expect(payload.sessionId).toBe(sessionId);
              expect(payload.deviceId).toBe(deviceId);
            }

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should maintain session and device binding across refresh", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (userId, sessionId, deviceId) => {
            // Generate initial tokens
            const initialTokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Refresh tokens
            const refreshedTokens = await tokenService.refreshAccessToken(
              initialTokens.refreshToken,
              false,
            );

            // Property: Session ID should remain the same
            const initialPayload = jwtService.decode(
              initialTokens.accessToken,
            ) as TokenPayload;
            const refreshedPayload = jwtService.decode(
              refreshedTokens.accessToken,
            ) as TokenPayload;

            expect(refreshedPayload.sessionId).toBe(initialPayload.sessionId);
            expect(refreshedPayload.sessionId).toBe(sessionId);

            // Property: Device ID should remain the same
            expect(refreshedPayload.deviceId).toBe(initialPayload.deviceId);
            expect(refreshedPayload.deviceId).toBe(deviceId);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate tokens with correct expiry times", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (userId, sessionId, deviceId) => {
            // Generate initial tokens
            const initialTokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Refresh tokens
            const refreshedTokens = await tokenService.refreshAccessToken(
              initialTokens.refreshToken,
              false,
            );

            // Property: Access token should have 15-minute expiry
            const accessPayload = jwtService.decode(
              refreshedTokens.accessToken,
            ) as TokenPayload;
            const accessExpiry = accessPayload.exp! - accessPayload.iat!;
            expect(accessExpiry).toBe(900); // 15 minutes = 900 seconds

            // Property: expiresIn should match access token expiry
            expect(refreshedTokens.expiresIn).toBe(900);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle concurrent refresh requests for same token", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 2, max: 5 }),
          async (userId, sessionId, deviceId, concurrentRequests) => {
            // Generate initial tokens
            const initialTokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Property: Multiple concurrent refresh requests should all succeed
            const refreshPromises = Array(concurrentRequests)
              .fill(null)
              .map(() =>
                tokenService.refreshAccessToken(
                  initialTokens.refreshToken,
                  false,
                ),
              );

            const results = await Promise.all(refreshPromises);

            // Property: All requests should return valid tokens
            results.forEach((tokens) => {
              expect(tokens.accessToken).toBeDefined();
              expect(tokens.refreshToken).toBe(initialTokens.refreshToken);
              expect(tokens.expiresIn).toBe(900);
            });

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should handle refresh with rotation for different users independently", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (userId1, userId2, sessionId1, sessionId2) => {
            // Skip if user IDs are the same
            fc.pre(userId1 !== userId2);

            const deviceId = "shared-device";

            // Generate tokens for both users
            const tokens1 = tokenService.generateSessionTokens(
              userId1,
              sessionId1,
              deviceId,
            );
            const tokens2 = tokenService.generateSessionTokens(
              userId2,
              sessionId2,
              deviceId,
            );

            // Refresh both with rotation
            const refreshed1 = await tokenService.refreshAccessToken(
              tokens1.refreshToken,
              true,
            );
            const refreshed2 = await tokenService.refreshAccessToken(
              tokens2.refreshToken,
              true,
            );

            // Property: Each user should get their own new tokens
            const payload1 = jwtService.decode(
              refreshed1.accessToken,
            ) as TokenPayload;
            const payload2 = jwtService.decode(
              refreshed2.accessToken,
            ) as TokenPayload;

            expect(payload1.userId).toBe(userId1);
            expect(payload2.userId).toBe(userId2);
            expect(payload1.userId).not.toBe(payload2.userId);

            // Property: Refresh tokens should be different
            expect(refreshed1.refreshToken).not.toBe(refreshed2.refreshToken);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should validate refresh token structure before processing", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid token strings
          fc.oneof(
            fc.constant(""),
            fc.constant("invalid"),
            fc.constant("not.a.jwt"),
            fc.string({ minLength: 1, maxLength: 50 }),
          ),
          async (invalidToken) => {
            // Property: Invalid tokens should be rejected
            await expect(
              tokenService.refreshAccessToken(invalidToken, false),
            ).rejects.toThrow(UnauthorizedException);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should return consistent token structure across refreshes", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.boolean(),
          async (userId, sessionId, deviceId, rotate) => {
            // Generate initial tokens
            const initialTokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Refresh tokens
            const refreshedTokens = await tokenService.refreshAccessToken(
              initialTokens.refreshToken,
              rotate,
            );

            // Property: Response should have consistent structure
            expect(refreshedTokens).toHaveProperty("accessToken");
            expect(refreshedTokens).toHaveProperty("refreshToken");
            expect(refreshedTokens).toHaveProperty("expiresIn");

            // Property: All fields should be of correct type
            expect(typeof refreshedTokens.accessToken).toBe("string");
            expect(typeof refreshedTokens.refreshToken).toBe("string");
            expect(typeof refreshedTokens.expiresIn).toBe("number");

            // Property: Tokens should not be empty
            expect(refreshedTokens.accessToken.length).toBeGreaterThan(0);
            expect(refreshedTokens.refreshToken.length).toBeGreaterThan(0);
            expect(refreshedTokens.expiresIn).toBeGreaterThan(0);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle edge case with minimum valid token data", async () => {
      const userId = "00000000-0000-0000-0000-000000000000";
      const sessionId = "00000000-0000-0000-0000-000000000001";
      const deviceId = "00000000-0000-0000-0000-000000000002";

      // Generate tokens with minimal valid data
      const tokens = tokenService.generateSessionTokens(
        userId,
        sessionId,
        deviceId,
      );

      // Refresh tokens
      const refreshedTokens = await tokenService.refreshAccessToken(
        tokens.refreshToken,
        false,
      );

      // Property: Should work with minimal valid data
      expect(refreshedTokens.accessToken).toBeDefined();
      expect(refreshedTokens.refreshToken).toBe(tokens.refreshToken);

      const payload = jwtService.decode(
        refreshedTokens.accessToken,
      ) as TokenPayload;
      expect(payload.userId).toBe(userId);
      expect(payload.sessionId).toBe(sessionId);
      expect(payload.deviceId).toBe(deviceId);
    });

    it("should handle refresh token rotation chain correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 2, max: 5 }),
          async (userId, sessionId, deviceId, chainLength) => {
            // Generate initial tokens
            let currentTokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            const refreshTokenHistory: string[] = [currentTokens.refreshToken];

            // Property: Perform chain of rotations
            for (let i = 0; i < chainLength; i++) {
              currentTokens = await tokenService.refreshAccessToken(
                currentTokens.refreshToken,
                true,
              );

              const payload = jwtService.decode(
                currentTokens.accessToken,
              ) as TokenPayload;
              expect(payload.userId).toBe(userId);
              expect(payload.sessionId).toBe(sessionId);
              expect(payload.deviceId).toBe(deviceId);
            }

            // Property: First and last refresh tokens should differ
            expect(currentTokens.refreshToken).not.toBe(
              refreshTokenHistory[0],
            );

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should not allow refresh after user tokens are revoked", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (userId, sessionId, deviceId) => {
            // Generate tokens
            const tokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Revoke all user tokens
            await tokenService.revokeAllUserTokens(userId);

            // Mock Redis to return that user tokens are revoked
            mockRedisClient.exists.mockImplementation((key: string) => {
              if (key.includes(`revoked_user:${userId}`)) {
                return Promise.resolve(1);
              }
              return Promise.resolve(0);
            });

            // Property: Refresh should fail for revoked user
            await expect(
              tokenService.refreshAccessToken(tokens.refreshToken, false),
            ).rejects.toThrow(UnauthorizedException);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
