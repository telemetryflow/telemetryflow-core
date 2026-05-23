/**
 * Property-Based Tests for Authentication - Email Verification
 *
 * Feature: frontend-backend-auth-integration
 * Property 9: Email verification activates account
 * Validates: Requirements 3.3
 *
 * Tests that valid verification tokens activate user accounts and
 * invalidate the tokens after use.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { BadRequestException } from "@nestjs/common";
import { EmailVerificationService } from "../services/email-verification.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { EmailService } from "../../notification/domain/services/EmailService";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 9: Email verification activates account", () => {
    let emailVerificationService: EmailVerificationService;
    let mockUserRepository: jest.Mocked<Repository<UserEntity>>;
    let mockConfigService: jest.Mocked<ConfigService>;
    let mockEmailService: jest.Mocked<EmailService>;

    beforeEach(async () => {
      mockUserRepository = {
        findOne: jest.fn(),
        update: jest.fn(),
      } as any;

      mockConfigService = {
        get: jest.fn().mockReturnValue("http://localhost:3000"),
      } as any;

      mockEmailService = {
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailVerificationService,
          {
            provide: getRepositoryToken(UserEntity),
            useValue: mockUserRepository,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: EmailService,
            useValue: mockEmailService,
          },
        ],
      }).compile();

      emailVerificationService = module.get<EmailVerificationService>(
        EmailVerificationService,
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should activate account for any valid verification token", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            firstName: fc.string({ minLength: 1, maxLength: 100 }),
            lastName: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          async (userData) => {
            // Clear mocks for each iteration
            mockUserRepository.findOne.mockClear();
            mockUserRepository.update.mockClear();

            // Create unverified user
            const unverifiedUser: Partial<UserEntity> = {
              id: userData.userId,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              emailVerified: false,
              email_verified_at: null,
              deletedAt: null,
            };

            // Mock: User exists and is unverified
            mockUserRepository.findOne.mockResolvedValue(
              unverifiedUser as UserEntity,
            );

            // Mock: Update succeeds
            mockUserRepository.update.mockResolvedValue({ affected: 1 } as any);

            // Step 1: Send verification email to generate token
            const { message: sendMessage } =
              await emailVerificationService.sendVerificationEmail(
                userData.userId,
                userData.email,
              );

            // Property 1: Verification email should be sent successfully
            expect(sendMessage).toBe("Verification email sent");

            // Extract token from service's internal storage (via reflection for testing)
            const tokens = (emailVerificationService as any).verificationTokens;
            let verificationToken: string | null = null;

            for (const [key, value] of tokens.entries()) {
              if (
                !key.startsWith("code:") &&
                (value as any).userId === userData.userId
              ) {
                verificationToken = key;
                break;
              }
            }

            expect(verificationToken).not.toBeNull();

            // Step 2: Verify email using the token
            const { message: verifyMessage } =
              await emailVerificationService.verifyByToken(verificationToken!);

            // Property 2: Verification should succeed
            expect(verifyMessage).toBe("Email verified successfully");

            // Property 3: User should be marked as verified (Requirement 3.3)
            expect(mockUserRepository.update).toHaveBeenCalledWith(
              userData.userId,
              expect.objectContaining({
                emailVerified: true,
                email_verified_at: expect.any(Date),
              }),
            );

            // Property 4: Token should be invalidated after use
            await expect(
              emailVerificationService.verifyByToken(verificationToken!),
            ).rejects.toThrow(BadRequestException);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should reject expired verification tokens", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            firstName: fc.string({ minLength: 1, maxLength: 100 }),
            lastName: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          async (userData) => {
            // Clear mocks for each iteration
            mockUserRepository.findOne.mockClear();
            mockUserRepository.update.mockClear();

            // Create unverified user
            const unverifiedUser: Partial<UserEntity> = {
              id: userData.userId,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              emailVerified: false,
              email_verified_at: null,
              deletedAt: null,
            };

            mockUserRepository.findOne.mockResolvedValue(
              unverifiedUser as UserEntity,
            );

            // Send verification email
            await emailVerificationService.sendVerificationEmail(
              userData.userId,
              userData.email,
            );

            // Extract token
            const tokens = (emailVerificationService as any).verificationTokens;
            let verificationToken: string | null = null;

            for (const [key, value] of tokens.entries()) {
              if (
                !key.startsWith("code:") &&
                (value as any).userId === userData.userId
              ) {
                verificationToken = key;
                // Manually expire the token
                (value as any).expiresAt = new Date(Date.now() - 1000);
                break;
              }
            }

            // Property: Expired tokens should be rejected
            await expect(
              emailVerificationService.verifyByToken(verificationToken!),
            ).rejects.toThrow(BadRequestException);

            // Property: User should NOT be verified
            expect(mockUserRepository.update).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should reject invalid verification tokens", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 64, maxLength: 64 }),
          async (invalidToken: string) => {
            // Clear mocks for each iteration
            mockUserRepository.update.mockClear();

            // Property: Invalid tokens should be rejected
            await expect(
              emailVerificationService.verifyByToken(invalidToken),
            ).rejects.toThrow(BadRequestException);

            // Property: No user should be updated
            expect(mockUserRepository.update).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should verify email using verification code", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            firstName: fc.string({ minLength: 1, maxLength: 100 }),
            lastName: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          async (userData) => {
            // Clear mocks for each iteration
            mockUserRepository.findOne.mockClear();
            mockUserRepository.update.mockClear();

            // Create unverified user
            const unverifiedUser: Partial<UserEntity> = {
              id: userData.userId,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              emailVerified: false,
              email_verified_at: null,
              deletedAt: null,
            };

            mockUserRepository.findOne.mockResolvedValue(
              unverifiedUser as UserEntity,
            );
            mockUserRepository.update.mockResolvedValue({ affected: 1 } as any);

            // Send verification email
            await emailVerificationService.sendVerificationEmail(
              userData.userId,
              userData.email,
            );

            // Extract verification code
            const tokens = (emailVerificationService as any).verificationTokens;
            const codeKey = `code:${userData.email}`;
            const tokenData = tokens.get(codeKey);
            expect(tokenData).toBeDefined();

            const verificationCode = tokenData.code;

            // Verify using code
            const { message } = await emailVerificationService.verifyByCode(
              userData.email,
              verificationCode,
            );

            // Property 1: Verification should succeed
            expect(message).toBe("Email verified successfully");

            // Property 2: User should be marked as verified
            expect(mockUserRepository.update).toHaveBeenCalledWith(
              userData.userId,
              expect.objectContaining({
                emailVerified: true,
                email_verified_at: expect.any(Date),
              }),
            );

            // Property 3: Code should be invalidated after use
            await expect(
              emailVerificationService.verifyByCode(
                userData.email,
                verificationCode,
              ),
            ).rejects.toThrow(BadRequestException);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should reject incorrect verification codes", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            firstName: fc.string({ minLength: 1, maxLength: 100 }),
            lastName: fc.string({ minLength: 1, maxLength: 100 }),
            wrongCode: fc
              .integer({ min: 100000, max: 999999 })
              .map((n) => n.toString()),
          }),
          async (userData) => {
            // Clear mocks for each iteration
            mockUserRepository.findOne.mockClear();
            mockUserRepository.update.mockClear();

            // Create unverified user
            const unverifiedUser: Partial<UserEntity> = {
              id: userData.userId,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              emailVerified: false,
              email_verified_at: null,
              deletedAt: null,
            };

            mockUserRepository.findOne.mockResolvedValue(
              unverifiedUser as UserEntity,
            );

            // Send verification email
            await emailVerificationService.sendVerificationEmail(
              userData.userId,
              userData.email,
            );

            // Extract the correct code
            const tokens = (emailVerificationService as any).verificationTokens;
            const codeKey = `code:${userData.email}`;
            const tokenData = tokens.get(codeKey);
            const correctCode = tokenData.code;

            // Ensure wrong code is different from correct code
            let wrongCode = userData.wrongCode;
            if (wrongCode === correctCode) {
              wrongCode = (parseInt(wrongCode) + 1).toString().padStart(6, "0");
            }

            // Property: Wrong code should be rejected
            await expect(
              emailVerificationService.verifyByCode(userData.email, wrongCode),
            ).rejects.toThrow(BadRequestException);

            // Property: User should NOT be verified
            expect(mockUserRepository.update).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should prevent verification of already verified accounts", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            firstName: fc.string({ minLength: 1, maxLength: 100 }),
            lastName: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          async (userData) => {
            // Clear mocks for each iteration
            mockUserRepository.findOne.mockClear();

            // Create already verified user
            const verifiedUser: Partial<UserEntity> = {
              id: userData.userId,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              emailVerified: true,
              email_verified_at: new Date(),
              deletedAt: null,
            };

            mockUserRepository.findOne.mockResolvedValue(
              verifiedUser as UserEntity,
            );

            // Property: Should reject sending verification email to verified account
            await expect(
              emailVerificationService.sendVerificationEmail(
                userData.userId,
                userData.email,
              ),
            ).rejects.toThrow(BadRequestException);

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should clean up both token and code entries after verification", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            firstName: fc.string({ minLength: 1, maxLength: 100 }),
            lastName: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          async (userData) => {
            // Clear mocks for each iteration
            mockUserRepository.findOne.mockClear();
            mockUserRepository.update.mockClear();

            // Create unverified user
            const unverifiedUser: Partial<UserEntity> = {
              id: userData.userId,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              emailVerified: false,
              email_verified_at: null,
              deletedAt: null,
            };

            mockUserRepository.findOne.mockResolvedValue(
              unverifiedUser as UserEntity,
            );
            mockUserRepository.update.mockResolvedValue({ affected: 1 } as any);

            // Send verification email
            await emailVerificationService.sendVerificationEmail(
              userData.userId,
              userData.email,
            );

            // Extract token and code
            const tokens = (emailVerificationService as any).verificationTokens;
            let verificationToken: string | null = null;

            for (const [key, value] of tokens.entries()) {
              if (
                !key.startsWith("code:") &&
                (value as any).userId === userData.userId
              ) {
                verificationToken = key;
                break;
              }
            }

            const codeKey = `code:${userData.email}`;

            // Verify both entries exist before verification
            expect(tokens.has(verificationToken!)).toBe(true);
            expect(tokens.has(codeKey)).toBe(true);

            // Verify email
            await emailVerificationService.verifyByToken(verificationToken!);

            // Property: Both token and code entries should be cleaned up
            expect(tokens.has(verificationToken!)).toBe(false);
            expect(tokens.has(codeKey)).toBe(false);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
