/**
 * Property-Based Tests for Authentication - MFA Failure Tracking
 *
 * Feature: frontend-backend-auth-integration
 * Property 22: MFA failure tracking
 * Validates: Requirements 7.5
 *
 * Tests that for any invalid TOTP code, the system increments the failure
 * counter and rejects the login attempt.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { VerifyMFAHandler } from "../application/handlers/VerifyMFA.handler";
import { VerifyMFACommand } from "../application/commands/VerifyMFA.command";
import { MfaService } from "../services/mfa.service";
import { SessionService } from "../services/session.service";
import { TokenService } from "../services/token.service";
import { SecurityLogService } from "../services/security-log.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 22: MFA failure tracking", () => {
    let handler: VerifyMFAHandler;
    let mfaService: MfaService;
    let userRepository: Repository<UserEntity>;
    let securityLogService: SecurityLogService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VerifyMFAHandler,
          MfaService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, any> = {
                  APP_NAME: "TelemetryFlow",
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
              update: jest.fn(),
            },
          },
          {
            provide: SessionService,
            useValue: {
              createSession: jest.fn(() => ({ id: "session-id" })),
            },
          },
          {
            provide: TokenService,
            useValue: {
              generateSessionTokens: jest.fn(() => ({
                accessToken: "access-token",
                refreshToken: "refresh-token",
                expiresIn: 900,
              })),
            },
          },
          {
            provide: SecurityLogService,
            useValue: {
              logMFASuccess: jest.fn(),
              logMFAFailure: jest.fn(),
            },
          },
        ],
      }).compile();

      handler = module.get<VerifyMFAHandler>(VerifyMFAHandler);
      mfaService = module.get<MfaService>(MfaService);
      userRepository = module.get<Repository<UserEntity>>(
        getRepositoryToken(UserEntity),
      );
      securityLogService = module.get<SecurityLogService>(SecurityLogService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should increment failure count for invalid TOTP codes", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 20, maxLength: 32 }),
          fc
            .string({ minLength: 6, maxLength: 6 })
            .filter((code) => !/^\d{6}$/.test(code)), // Invalid code
          async (userId, email, mfaSecret, invalidCode) => {
            // Create MFA session
            const mfaToken = mfaService.createMfaSession(userId, {
              deviceId: "device-id",
              deviceName: "Test Device",
              ipAddress: "127.0.0.1",
            });

            // Mock user with MFA enabled
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
              mfa_secret: mfaSecret,
              mfa_failure_count: 0,
              mfa_locked_until: null,
              isActive: true,
              firstName: "Test",
              lastName: "User",
              tenant_id: "tenant-id",
              organization_id: "org-id",
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            const saveSpy = jest
              .spyOn(userRepository, "save")
              .mockImplementation(async (entity: any) => {
                return entity as UserEntity;
              });

            // Create command
            const command = new VerifyMFACommand(
              mfaToken,
              invalidCode,
              false,
              "127.0.0.1",
              "test-agent",
            );

            // Property: Invalid code should be rejected
            await expect(handler.execute(command)).rejects.toThrow(
              UnauthorizedException,
            );

            // Property: Failure count should be incremented
            expect(saveSpy).toHaveBeenCalled();
            const savedUser = saveSpy.mock.calls[0][0];
            expect(savedUser.mfa_failure_count).toBeGreaterThan(0);

            // Property: Security log should record failure
            expect(securityLogService.logMFAFailure).toHaveBeenCalledWith(
              userId,
              "127.0.0.1",
              "test-agent",
              expect.any(String),
              expect.objectContaining({
                failureCount: expect.any(Number),
              }),
            );
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should lock account after 5 failed MFA attempts", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 20, maxLength: 32 }),
          async (userId, email, mfaSecret) => {
            // Create MFA session
            const mfaToken = mfaService.createMfaSession(userId, {
              deviceId: "device-id",
              deviceName: "Test Device",
              ipAddress: "127.0.0.1",
            });

            // Mock user with 4 previous failures
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
              mfa_secret: mfaSecret,
              mfa_failure_count: 4,
              mfa_locked_until: null,
              isActive: true,
              firstName: "Test",
              lastName: "User",
              tenant_id: "tenant-id",
              organization_id: "org-id",
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            const saveSpy = jest
              .spyOn(userRepository, "save")
              .mockImplementation(async (entity: any) => {
                return entity as UserEntity;
              });

            // Create command with invalid code
            const command = new VerifyMFACommand(
              mfaToken,
              "000000", // Invalid code
              false,
              "127.0.0.1",
              "test-agent",
            );

            // Property: 5th failure should lock the account
            await expect(handler.execute(command)).rejects.toThrow(
              UnauthorizedException,
            );

            // Property: Account should be locked
            expect(saveSpy).toHaveBeenCalled();
            const savedUser = saveSpy.mock.calls[0][0];
            expect(savedUser.mfa_failure_count).toBe(5);
            expect(savedUser.mfa_locked_until).toBeDefined();
            expect(savedUser.mfa_locked_until).toBeInstanceOf(Date);

            // Property: Lock duration should be 15 minutes (Requirement 7.6)
            const lockDuration =
              (savedUser.mfa_locked_until as Date).getTime() - Date.now();
            expect(lockDuration).toBeGreaterThan(14 * 60 * 1000); // At least 14 minutes
            expect(lockDuration).toBeLessThan(16 * 60 * 1000); // At most 16 minutes
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should reset failure count on successful verification", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (userId, email) => {
            // Generate a valid TOTP secret
            const secret = "JBSWY3DPEHPK3PXP"; // Base32 encoded secret

            // Create MFA session
            const mfaToken = mfaService.createMfaSession(userId, {
              deviceId: "device-id",
              deviceName: "Test Device",
              ipAddress: "127.0.0.1",
            });

            // Mock user with previous failures
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
              mfa_secret: secret,
              mfa_failure_count: 3,
              mfa_locked_until: null,
              isActive: true,
              firstName: "Test",
              lastName: "User",
              tenant_id: "tenant-id",
              organization_id: "org-id",
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            const updateSpy = jest
              .spyOn(userRepository, "update")
              .mockResolvedValue({ affected: 1 } as any);

            // Generate valid TOTP code
            const validCode = generateTOTP(secret);

            // Create command
            const command = new VerifyMFACommand(
              mfaToken,
              validCode,
              false,
              "127.0.0.1",
              "test-agent",
            );

            // Property: Valid code should succeed
            const result = await handler.execute(command);
            expect(result).toHaveProperty("accessToken");

            // Property: Failure count should be reset to 0
            expect(updateSpy).toHaveBeenCalledWith(
              userId,
              expect.objectContaining({
                mfa_failure_count: 0,
                mfa_locked_until: null,
              }),
            );

            // Property: Security log should record success
            expect(securityLogService.logMFASuccess).toHaveBeenCalledWith(
              userId,
              "127.0.0.1",
              "test-agent",
              expect.any(Object),
            );
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});

// Helper function to generate TOTP code
function generateTOTP(secret: string): string {
  const crypto = require("crypto");

  // Decode base32 secret
  const buffer = base32Decode(secret);

  // Get current time step
  const timeStep = Math.floor(Date.now() / 1000 / 30);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));

  // Generate HMAC
  const hmac = crypto.createHmac("sha1", buffer);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Extract OTP
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, 6);
  return otp.toString().padStart(6, "0");
}

function base32Decode(encoded: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanedInput = encoded.replace(/=+$/, "").toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleanedInput) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}
