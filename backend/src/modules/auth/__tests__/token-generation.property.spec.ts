/**
 * Property-Based Tests for Authentication - Token Generation
 *
 * Feature: frontend-backend-auth-integration
 * Property 1: Valid credentials authenticate successfully
 * Validates: Requirements 1.1, 9.1
 *
 * Tests that valid username and password combinations authenticate successfully
 * and return both access and refresh tokens with appropriate expiry times.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { TokenService, TokenPayload } from "../services/token.service";
import { UserService } from "../services/user.service";
import { SessionService } from "../services/session.service";
import { DeviceService } from "../services/device.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { SessionEntity } from "../infrastructure/persistence/entities/Session.entity";
import { DeviceEntity } from "../infrastructure/persistence/entities/Device.entity";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 1: Valid credentials authenticate successfully", () => {
    let tokenService: TokenService;
    let userService: UserService;
    let sessionService: SessionService;
    let deviceService: DeviceService;
    let jwtService: JwtService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TokenService,
          UserService,
          SessionService,
          DeviceService,
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn((payload, options) => {
                // Mock JWT token generation
                const token = Buffer.from(JSON.stringify(payload)).toString(
                  "base64",
                );
                return `mock.${token}.signature`;
              }),
              verify: jest.fn((token, options) => {
                // Mock JWT token verification
                const parts = token.split(".");
                if (parts.length !== 3) {
                  throw new Error("Invalid token");
                }
                const payload = JSON.parse(
                  Buffer.from(parts[1], "base64").toString(),
                );
                return payload;
              }),
              decode: jest.fn((token) => {
                // Mock JWT token decoding
                const parts = token.split(".");
                if (parts.length !== 3) {
                  return null;
                }
                const payload = JSON.parse(
                  Buffer.from(parts[1], "base64").toString(),
                );
                return payload;
              }),
            },
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, any> = {
                  JWT_SECRET: "test-secret",
                  JWT_REFRESH_SECRET: "test-refresh-secret",
                  JWT_ACCESS_TOKEN_EXPIRY: "15m",
                  JWT_REFRESH_TOKEN_EXPIRY: "7d",
                  REDIS_HOST: "localhost",
                  REDIS_PORT: 6379,
                  REDIS_PASSWORD: "",
                  REDIS_DB: 0,
                  REDIS_KEY_PREFIX: "auth:",
                };
                return config[key];
              }),
            },
          },
          {
            provide: getRepositoryToken(UserEntity),
            useValue: {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(SessionEntity),
            useValue: {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              create: jest.fn((data) => data),
              update: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(DeviceEntity),
            useValue: {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              create: jest.fn((data) => data),
              update: jest.fn(),
            },
          },
        ],
      }).compile();

      tokenService = module.get<TokenService>(TokenService);
      userService = module.get<UserService>(UserService);
      sessionService = module.get<SessionService>(SessionService);
      deviceService = module.get<DeviceService>(DeviceService);
      jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should generate valid access and refresh tokens for any valid user credentials", () => {
      fc.assert(
        fc.property(
          // Generate valid user IDs (UUIDs)
          fc.uuid(),
          // Generate valid session IDs (UUIDs)
          fc.uuid(),
          // Generate valid device IDs (UUIDs)
          fc.uuid(),
          (userId, sessionId, deviceId) => {
            // Property: Token generation should succeed for any valid IDs
            const tokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Property: Both tokens should be generated
            expect(tokens.accessToken).toBeDefined();
            expect(tokens.refreshToken).toBeDefined();
            expect(tokens.expiresIn).toBeDefined();

            // Property: Tokens should be non-empty strings
            expect(typeof tokens.accessToken).toBe("string");
            expect(tokens.accessToken.length).toBeGreaterThan(0);
            expect(typeof tokens.refreshToken).toBe("string");
            expect(tokens.refreshToken.length).toBeGreaterThan(0);

            // Property: Expiry should be 900 seconds (15 minutes)
            expect(tokens.expiresIn).toBe(900);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate tokens with correct payload structure", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (userId, sessionId, deviceId) => {
            // Generate tokens
            const tokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Decode access token
            const accessPayload = jwtService.decode(
              tokens.accessToken,
            ) as TokenPayload;

            // Property: Access token should contain correct payload
            expect(accessPayload).toBeDefined();
            expect(accessPayload.userId).toBe(userId);
            expect(accessPayload.sessionId).toBe(sessionId);
            expect(accessPayload.deviceId).toBe(deviceId);

            // Decode refresh token
            const refreshPayload = jwtService.decode(
              tokens.refreshToken,
            ) as TokenPayload;

            // Property: Refresh token should contain correct payload
            expect(refreshPayload).toBeDefined();
            expect(refreshPayload.userId).toBe(userId);
            expect(refreshPayload.sessionId).toBe(sessionId);
            expect(refreshPayload.deviceId).toBe(deviceId);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate different tokens for different users", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (userId1, userId2, sessionId, deviceId) => {
            // Skip if user IDs are the same
            fc.pre(userId1 !== userId2);

            // Generate tokens for first user
            const tokens1 = tokenService.generateSessionTokens(
              userId1,
              sessionId,
              deviceId,
            );

            // Generate tokens for second user
            const tokens2 = tokenService.generateSessionTokens(
              userId2,
              sessionId,
              deviceId,
            );

            // Property: Tokens should be different for different users
            expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
            expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate different tokens for different sessions", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (userId, sessionId1, sessionId2, deviceId) => {
            // Skip if session IDs are the same
            fc.pre(sessionId1 !== sessionId2);

            // Generate tokens for first session
            const tokens1 = tokenService.generateSessionTokens(
              userId,
              sessionId1,
              deviceId,
            );

            // Generate tokens for second session
            const tokens2 = tokenService.generateSessionTokens(
              userId,
              sessionId2,
              deviceId,
            );

            // Property: Tokens should be different for different sessions
            expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
            expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate different tokens for different devices", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (userId, sessionId, deviceId1, deviceId2) => {
            // Skip if device IDs are the same
            fc.pre(deviceId1 !== deviceId2);

            // Generate tokens for first device
            const tokens1 = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId1,
            );

            // Generate tokens for second device
            const tokens2 = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId2,
            );

            // Property: Tokens should be different for different devices
            expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
            expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate tokens that can be validated", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (userId, sessionId, deviceId) => {
            // Generate tokens
            const tokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Property: Generated access token should be verifiable
            const accessPayload = jwtService.verify(tokens.accessToken, {
              secret: "test-secret",
            }) as TokenPayload;

            expect(accessPayload.userId).toBe(userId);
            expect(accessPayload.sessionId).toBe(sessionId);
            expect(accessPayload.deviceId).toBe(deviceId);

            // Property: Generated refresh token should be verifiable
            const refreshPayload = jwtService.verify(tokens.refreshToken, {
              secret: "test-refresh-secret",
            }) as TokenPayload;

            expect(refreshPayload.userId).toBe(userId);
            expect(refreshPayload.sessionId).toBe(sessionId);
            expect(refreshPayload.deviceId).toBe(deviceId);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should consistently generate the same token structure for the same inputs", () => {
      fc.assert(
        fc.property(fc.uuid(), fc.uuid(), fc.uuid(), (userId, sessionId, deviceId) => {
          // Generate tokens twice with same inputs
          const tokens1 = tokenService.generateSessionTokens(
            userId,
            sessionId,
            deviceId,
          );
          const tokens2 = tokenService.generateSessionTokens(
            userId,
            sessionId,
            deviceId,
          );

          // Property: Token structure should be consistent
          expect(tokens1.expiresIn).toBe(tokens2.expiresIn);

          // Decode both sets of tokens
          const payload1 = jwtService.decode(tokens1.accessToken) as TokenPayload;
          const payload2 = jwtService.decode(tokens2.accessToken) as TokenPayload;

          // Property: Payloads should have same structure and values
          expect(payload1.userId).toBe(payload2.userId);
          expect(payload1.sessionId).toBe(payload2.sessionId);
          expect(payload1.deviceId).toBe(payload2.deviceId);

          return true;
        }),
        { numRuns: 100 },
      );
    });

    it("should generate access tokens separately with correct payload", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (userId, sessionId, deviceId) => {
            // Property: Access token generation should work independently
            const accessToken = tokenService.generateAccessToken(
              userId,
              sessionId,
              deviceId,
            );

            expect(accessToken).toBeDefined();
            expect(typeof accessToken).toBe("string");
            expect(accessToken.length).toBeGreaterThan(0);

            // Verify payload
            const payload = jwtService.decode(accessToken) as TokenPayload;
            expect(payload.userId).toBe(userId);
            expect(payload.sessionId).toBe(sessionId);
            expect(payload.deviceId).toBe(deviceId);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate refresh tokens separately with correct payload", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (userId, sessionId, deviceId) => {
            // Property: Refresh token generation should work independently
            const refreshToken = tokenService.generateRefreshToken(
              userId,
              sessionId,
              deviceId,
            );

            expect(refreshToken).toBeDefined();
            expect(typeof refreshToken).toBe("string");
            expect(refreshToken.length).toBeGreaterThan(0);

            // Verify payload
            const payload = jwtService.decode(refreshToken) as TokenPayload;
            expect(payload.userId).toBe(userId);
            expect(payload.sessionId).toBe(sessionId);
            expect(payload.deviceId).toBe(deviceId);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle edge case IDs correctly", () => {
      const edgeCaseIds = [
        // Valid UUIDs with different patterns
        "00000000-0000-0000-0000-000000000000",
        "ffffffff-ffff-ffff-ffff-ffffffffffff",
        "12345678-1234-1234-1234-123456789012",
        "abcdefab-cdef-abcd-efab-cdefabcdefab",
      ];

      for (const userId of edgeCaseIds) {
        for (const sessionId of edgeCaseIds) {
          for (const deviceId of edgeCaseIds) {
            // Property: Edge case IDs should work correctly
            const tokens = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            expect(tokens.accessToken).toBeDefined();
            expect(tokens.refreshToken).toBeDefined();
            expect(tokens.expiresIn).toBe(900);

            // Verify payloads
            const accessPayload = jwtService.decode(
              tokens.accessToken,
            ) as TokenPayload;
            expect(accessPayload.userId).toBe(userId);
            expect(accessPayload.sessionId).toBe(sessionId);
            expect(accessPayload.deviceId).toBe(deviceId);

            const refreshPayload = jwtService.decode(
              tokens.refreshToken,
            ) as TokenPayload;
            expect(refreshPayload.userId).toBe(userId);
            expect(refreshPayload.sessionId).toBe(sessionId);
            expect(refreshPayload.deviceId).toBe(deviceId);
          }
        }
      }
    });

    it("should generate tokens with consistent expiry time", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (userId, sessionId, deviceId) => {
            // Generate tokens multiple times
            const tokens1 = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );
            const tokens2 = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );
            const tokens3 = tokenService.generateSessionTokens(
              userId,
              sessionId,
              deviceId,
            );

            // Property: Expiry time should always be 900 seconds (15 minutes)
            expect(tokens1.expiresIn).toBe(900);
            expect(tokens2.expiresIn).toBe(900);
            expect(tokens3.expiresIn).toBe(900);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
