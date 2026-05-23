/**
 * Property-Based Tests for Authentication - MFA Setup
 *
 * Feature: frontend-backend-auth-integration
 * Property 19: MFA setup generates secrets
 * Validates: Requirements 7.1, 7.8
 *
 * Tests that for any MFA setup request, the system generates a secret key,
 * QR code, and backup codes.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { BadRequestException } from "@nestjs/common";
import { MfaService } from "../services/mfa.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 19: MFA setup generates secrets", () => {
    let mfaService: MfaService;
    let userRepository: Repository<UserEntity>;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
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
              update: jest.fn(),
            },
          },
        ],
      }).compile();

      mfaService = module.get<MfaService>(MfaService);
      userRepository = module.get<Repository<UserEntity>>(
        getRepositoryToken(UserEntity),
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should generate secret, QR code, and backup codes for any valid user", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid user IDs (UUIDs)
          fc.uuid(),
          // Generate valid email addresses
          fc.emailAddress(),
          async (userId, email) => {
            // Mock user without MFA enabled
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
              mfa_secret: null,
              mfa_backup_codes: null,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Property: MFA setup should generate all required components
            const result = await mfaService.setupMfa(userId);

            // Property: Secret should be generated (base32 encoded string)
            expect(result.secret).toBeDefined();
            expect(typeof result.secret).toBe("string");
            expect(result.secret.length).toBeGreaterThan(0);
            // Base32 alphabet check
            expect(result.secret).toMatch(/^[A-Z2-7]+$/);

            // Property: QR code URL should be generated
            expect(result.qrCodeUrl).toBeDefined();
            expect(typeof result.qrCodeUrl).toBe("string");
            expect(result.qrCodeUrl).toContain("otpauth://totp/");
            expect(result.qrCodeUrl).toContain(encodeURIComponent(email));
            expect(result.qrCodeUrl).toContain("secret=" + result.secret);
            expect(result.qrCodeUrl).toContain("issuer=TelemetryFlow");

            // Property: Backup codes should be generated (Requirement 7.8)
            expect(result.recoveryCodes).toBeDefined();
            expect(Array.isArray(result.recoveryCodes)).toBe(true);
            expect(result.recoveryCodes.length).toBe(10);

            // Property: Each backup code should be properly formatted
            result.recoveryCodes.forEach((code) => {
              expect(typeof code).toBe("string");
              expect(code).toMatch(/^[A-F0-9]{5}-[A-F0-9]{5}$/);
            });

            // Property: All backup codes should be unique
            const uniqueCodes = new Set(result.recoveryCodes);
            expect(uniqueCodes.size).toBe(result.recoveryCodes.length);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate different secrets for different setup requests", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.emailAddress(),
          fc.emailAddress(),
          async (userId1, userId2, email1, email2) => {
            // Skip if user IDs are the same
            fc.pre(userId1 !== userId2);

            // Mock first user
            const mockUser1: Partial<UserEntity> = {
              id: userId1,
              email: email1,
              mfa_enabled: false,
            };

            // Mock second user
            const mockUser2: Partial<UserEntity> = {
              id: userId2,
              email: email2,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValueOnce(mockUser1 as UserEntity)
              .mockResolvedValueOnce(mockUser2 as UserEntity);

            // Generate MFA setup for both users
            const result1 = await mfaService.setupMfa(userId1);
            const result2 = await mfaService.setupMfa(userId2);

            // Property: Secrets should be different for different users
            expect(result1.secret).not.toBe(result2.secret);

            // Property: QR codes should be different
            expect(result1.qrCodeUrl).not.toBe(result2.qrCodeUrl);

            // Property: Backup codes should be different
            expect(result1.recoveryCodes).not.toEqual(result2.recoveryCodes);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should reject MFA setup if already enabled", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (userId, email) => {
            // Mock user with MFA already enabled
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
              mfa_secret: "EXISTINGSECRET",
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Property: Should throw BadRequestException if MFA already enabled
            await expect(mfaService.setupMfa(userId)).rejects.toThrow(
              BadRequestException,
            );
            await expect(mfaService.setupMfa(userId)).rejects.toThrow(
              "MFA is already enabled",
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should generate secrets with consistent length", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (userId, email) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            const result = await mfaService.setupMfa(userId);

            // Property: Secret should have consistent length (base32 encoded 20 bytes)
            // 20 bytes = 160 bits, base32 encodes 5 bits per character = 32 characters
            expect(result.secret.length).toBe(32);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate QR code URL with correct TOTP parameters", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (userId, email) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            const result = await mfaService.setupMfa(userId);

            // Property: QR code URL should contain correct TOTP parameters
            expect(result.qrCodeUrl).toContain("digits=6");
            expect(result.qrCodeUrl).toContain("period=30");

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should generate exactly 10 backup codes", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (userId, email) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            const result = await mfaService.setupMfa(userId);

            // Property: Should always generate exactly 10 backup codes
            expect(result.recoveryCodes.length).toBe(10);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate backup codes with correct format", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (userId, email) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            const result = await mfaService.setupMfa(userId);

            // Property: Each backup code should be 11 characters (5-hyphen-5)
            result.recoveryCodes.forEach((code) => {
              expect(code.length).toBe(11);
              expect(code[5]).toBe("-");
            });

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle edge case emails correctly", async () => {
      const edgeCaseEmails = [
        "a@b.c",
        "test+tag@example.com",
        "user.name@sub.domain.com",
        "123@456.789",
        "very.long.email.address.with.many.dots@example.com",
      ];

      for (const email of edgeCaseEmails) {
        const userId = "test-user-id";
        const mockUser: Partial<UserEntity> = {
          id: userId,
          email: email,
          mfa_enabled: false,
        };

        jest
          .spyOn(userRepository, "findOne")
          .mockResolvedValue(mockUser as UserEntity);

        const result = await mfaService.setupMfa(userId);

        // Property: Should handle edge case emails correctly
        expect(result.qrCodeUrl).toContain(encodeURIComponent(email));
        expect(result.secret).toBeDefined();
        expect(result.recoveryCodes.length).toBe(10);
      }
    });

    it("should generate cryptographically random secrets", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (userId, email) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Generate multiple secrets
            const secrets: string[] = [];
            for (let i = 0; i < 10; i++) {
              const result = await mfaService.setupMfa(userId);
              secrets.push(result.secret);
            }

            // Property: All secrets should be unique (high probability with crypto random)
            const uniqueSecrets = new Set(secrets);
            expect(uniqueSecrets.size).toBe(secrets.length);

            return true;
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should reject setup for non-existent users", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          // Mock user not found
          jest.spyOn(userRepository, "findOne").mockResolvedValue(null);

          // Property: Should throw BadRequestException for non-existent users
          await expect(mfaService.setupMfa(userId)).rejects.toThrow(
            BadRequestException,
          );
          await expect(mfaService.setupMfa(userId)).rejects.toThrow(
            "User not found",
          );

          return true;
        }),
        { numRuns: 50 },
      );
    });
  });
});
