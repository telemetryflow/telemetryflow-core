/**
 * Property-Based Tests for Authentication - Backup Code Invalidation
 *
 * Feature: frontend-backend-auth-integration
 * Property 23: Backup code invalidation
 * Validates: Requirements 7.9
 *
 * Tests that for any backup code used for authentication, that specific code
 * is invalidated and cannot be used again.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { MfaService } from "../services/mfa.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import * as argon2 from "argon2";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 23: Backup code invalidation", () => {
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
              save: jest.fn(),
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

    it("should invalidate backup code after successful use", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 20, maxLength: 32 }),
          fc.array(
            fc
              .string({ minLength: 10, maxLength: 10 })
              .filter((s) => /[A-Za-z0-9]/.test(s)),
            {
              minLength: 2,
              maxLength: 3,
            },
          ),
          async (userId, email, mfaSecret, backupCodes) => {
            jest.clearAllMocks();

            const uniqueCodes = [...new Set(backupCodes)];
            if (uniqueCodes.length < 2) {
              return;
            }

            const uniqueNormalized = [...new Set(uniqueCodes.map(c => c.replace(/-/g, "").toUpperCase()))];
            if (uniqueNormalized.length < uniqueCodes.length) {
              return;
            }

            // Hash backup codes
            const hashedCodes = await Promise.all(
              uniqueCodes.map((code) =>
                argon2.hash(code.replace(/-/g, "").toUpperCase()),
              ),
            );

            // Mock user with MFA enabled and backup codes
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
              mfa_secret: mfaSecret,
              mfa_backup_codes: hashedCodes,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            const updateSpy = jest
              .spyOn(userRepository, "update")
              .mockResolvedValue({ affected: 1 } as any);

            // Use the first backup code
            const codeToUse = uniqueCodes[0];
            const initialCodeCount = hashedCodes.length;

            // Property: Backup code should be valid before use
            const isValidBefore = await mfaService.verifyMfaCode(
              userId,
              codeToUse,
              true,
            );
            expect(isValidBefore).toBe(true);

            // Property: Backup code should be removed from the list
            expect(updateSpy).toHaveBeenCalled();
            const updateCall = updateSpy.mock.calls[0];
            const updatedCodes = updateCall[1].mfa_backup_codes as string[];

            // Property: Code count should decrease by 1
            expect(updatedCodes.length).toBe(initialCodeCount - 1);

            // Property: Used code should not be in the updated list
            for (const hashedCode of updatedCodes) {
              const matches = await argon2.verify(
                hashedCode,
                codeToUse.replace(/-/g, "").toUpperCase(),
              );
              expect(matches).toBe(false);
            }
          },
        ),
        { numRuns: 3 },
      );
    }, 60000);

    it("should not accept the same backup code twice", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 20, maxLength: 32 }),
          fc.array(
            fc
              .string({ minLength: 10, maxLength: 10 })
              .filter((s) => /[A-Za-z0-9]/.test(s)),
            {
              minLength: 3,
              maxLength: 5,
            },
          ),
          async (userId, email, mfaSecret, backupCodes) => {
            jest.clearAllMocks();
            const hashedCodes = await Promise.all(
              backupCodes.map((code) =>
                argon2.hash(code.replace(/-/g, "").toUpperCase()),
              ),
            );

            // Mock user with MFA enabled and backup codes
            let currentCodes = [...hashedCodes];
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
              mfa_secret: mfaSecret,
              mfa_backup_codes: currentCodes,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockImplementation(async () => {
                return {
                  ...mockUser,
                  mfa_backup_codes: currentCodes,
                } as UserEntity;
              });

            jest
              .spyOn(userRepository, "update")
              .mockImplementation(async (id, updates: any) => {
                if (updates.mfa_backup_codes) {
                  currentCodes = updates.mfa_backup_codes;
                }
                return { affected: 1 } as any;
              });

            // Use the first backup code
            const codeToUse = backupCodes[0];

            // Property: First use should succeed
            const firstUse = await mfaService.verifyMfaCode(
              userId,
              codeToUse,
              true,
            );
            expect(firstUse).toBe(true);

            // Property: Second use of same code should fail
            const secondUse = await mfaService.verifyMfaCode(
              userId,
              codeToUse,
              true,
            );
            expect(secondUse).toBe(false);
          },
        ),
        { numRuns: 3 },
      );
    }, 15000);

    it("should preserve other backup codes when one is used", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 20, maxLength: 32 }),
          fc.array(
            fc
              .string({ minLength: 10, maxLength: 10 })
              .filter((s) => /[A-Za-z0-9]/.test(s)),
            {
              minLength: 2,
              maxLength: 3,
            },
          ),
          async (userId, email, mfaSecret, backupCodes) => {
            jest.clearAllMocks();
            const uniqueCodes = [...new Set(backupCodes)];
            if (uniqueCodes.length < 2) {
              return;
            }

            const uniqueNormalized = [...new Set(uniqueCodes.map(c => c.replace(/-/g, "").toUpperCase()))];
            if (uniqueNormalized.length < uniqueCodes.length) {
              return;
            }

            // Hash backup codes
            const hashedCodes = await Promise.all(
              uniqueCodes.map((code) =>
                argon2.hash(code.replace(/-/g, "").toUpperCase()),
              ),
            );

            // Mock user with MFA enabled and backup codes
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
              mfa_secret: mfaSecret,
              mfa_backup_codes: hashedCodes,
            };

            let updatedCodes = hashedCodes;

            jest
              .spyOn(userRepository, "findOne")
              .mockImplementation(async () => {
                return {
                  ...mockUser,
                  mfa_backup_codes: updatedCodes,
                } as UserEntity;
              });

            jest
              .spyOn(userRepository, "update")
              .mockImplementation(async (id, updates: any) => {
                if (updates.mfa_backup_codes) {
                  updatedCodes = updates.mfa_backup_codes;
                }
                return { affected: 1 } as any;
              });

            // Use the first backup code
            const usedCode = uniqueCodes[0];
            const otherCode = uniqueCodes[1];

            // Use first code
            await mfaService.verifyMfaCode(userId, usedCode, true);

            // Property: Other codes should still be valid
            const otherCodeValid = await mfaService.verifyMfaCode(
              userId,
              otherCode,
              true,
            );
            expect(otherCodeValid).toBe(true);

            // Property: Used code should be invalid
            const usedCodeValid = await mfaService.verifyMfaCode(
              userId,
              usedCode,
              true,
            );
            expect(usedCodeValid).toBe(false);
          },
        ),
        { numRuns: 3 },
      );
    }, 60000);

    it("should handle backup codes with different formats", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 20, maxLength: 32 }),
          async (userId, email, mfaSecret) => {
            jest.clearAllMocks();
            const plainCode = "ABCDE12345";
            const dashedCode = "ABCDE-12345";
            const lowercaseCode = "abcde12345";

            // Hash the normalized version (uppercase, no dashes)
            const hashedCode = await argon2.hash("ABCDE12345");

            // Mock user with MFA enabled and backup code
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
              mfa_secret: mfaSecret,
              mfa_backup_codes: [hashedCode],
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            jest
              .spyOn(userRepository, "update")
              .mockResolvedValue({ affected: 1 } as any);

            // Property: All formats should be accepted (normalized internally)
            const plainValid = await mfaService.verifyMfaCode(
              userId,
              plainCode,
              true,
            );
            expect(plainValid).toBe(true);

            // Reset for next test
            jest.spyOn(userRepository, "findOne").mockResolvedValue({
              ...mockUser,
              mfa_backup_codes: [hashedCode],
            } as UserEntity);

            const dashedValid = await mfaService.verifyMfaCode(
              userId,
              dashedCode,
              true,
            );
            expect(dashedValid).toBe(true);

            // Reset for next test
            jest.spyOn(userRepository, "findOne").mockResolvedValue({
              ...mockUser,
              mfa_backup_codes: [hashedCode],
            } as UserEntity);

            const lowercaseValid = await mfaService.verifyMfaCode(
              userId,
              lowercaseCode,
              true,
            );
            expect(lowercaseValid).toBe(true);
          },
        ),
        { numRuns: 3 },
      );
    }, 15000);
  });
});
