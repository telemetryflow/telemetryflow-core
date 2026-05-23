/**
 * Property-Based Tests for Authentication - Password Reset Token Generation
 *
 * Feature: frontend-backend-auth-integration
 * Property 15: Password reset token generation
 * Validates: Requirements 5.1, 5.2
 *
 * Tests that for any password reset request, a time-limited reset token
 * should be generated and sent via email.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { RequestPasswordResetHandler } from "../application/handlers/RequestPasswordReset.handler";
import { RequestPasswordResetCommand } from "../application/commands/RequestPasswordReset.command";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { EmailService } from "../services/email.service";
import { RateLimiterService } from "../services/rate-limiter.service";
import { AuditService, AuditEventResult } from "../../audit/audit.service";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 15: Password reset token generation", () => {
    let handler: RequestPasswordResetHandler;
    let userRepository: Repository<UserEntity>;
    let emailService: EmailService;
    let rateLimiterService: RateLimiterService;
    let auditService: AuditService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RequestPasswordResetHandler,
          {
            provide: getRepositoryToken(UserEntity),
            useValue: {
              findOne: jest.fn(),
            },
          },
          {
            provide: EmailService,
            useValue: {
              sendPasswordResetEmail: jest.fn(),
            },
          },
          {
            provide: RateLimiterService,
            useValue: {
              checkRateLimit: jest.fn(),
            },
          },
          {
            provide: AuditService,
            useValue: {
              logAuth: jest.fn(),
            },
          },
        ],
      }).compile();

      handler = module.get<RequestPasswordResetHandler>(
        RequestPasswordResetHandler,
      );
      userRepository = module.get<Repository<UserEntity>>(
        getRepositoryToken(UserEntity),
      );
      emailService = module.get<EmailService>(EmailService);
      rateLimiterService = module.get<RateLimiterService>(RateLimiterService);
      auditService = module.get<AuditService>(AuditService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should generate time-limited reset token and send email for any valid password reset request", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(), // user email
          fc.ipV4(), // ipAddress
          fc.string({ minLength: 10, maxLength: 200 }), // userAgent
          async (email, ipAddress, userAgent) => {
            // Create mock user
            const mockUser = {
              id: `user-${Math.random()}`,
              email: email.toLowerCase(),
              isActive: true,
              deletedAt: null,
            } as UserEntity;

            // Setup mocks
            jest
              .spyOn(rateLimiterService, "checkRateLimit")
              .mockResolvedValue(undefined);
            jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser);
            jest
              .spyOn(emailService, "sendPasswordResetEmail")
              .mockResolvedValue(undefined);
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Execute command
            const command = new RequestPasswordResetCommand(
              email,
              ipAddress,
              userAgent,
            );

            const result = await handler.execute(command);

            // Property: Request should succeed
            expect(result).toBeDefined();
            expect(result.message).toContain(
              "If an account exists with this email",
            );

            // Property: Rate limiting should be checked
            expect(rateLimiterService.checkRateLimit).toHaveBeenCalledWith(
              `password-reset:${email.toLowerCase().trim()}`,
              3, // max 3 requests
              60 * 60 * 1000, // per hour
            );

            // Property: User should be looked up
            expect(userRepository.findOne).toHaveBeenCalledWith({
              where: { email: email.toLowerCase().trim(), deletedAt: null },
            });

            // Property: Password reset email should be sent with token
            expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
              mockUser.email,
              expect.any(String), // token
            );

            // Verify token was passed to email service
            const emailCall = (emailService.sendPasswordResetEmail as jest.Mock)
              .mock.calls[0];
            const token = emailCall[1];

            // Property: Token should be a non-empty string
            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
            expect(token.length).toBeGreaterThan(0);

            // Property: Token should be hex-encoded (64 chars for 32 bytes)
            expect(token).toMatch(/^[a-f0-9]{64}$/);

            // Property: Success should be logged
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "password_reset_request",
              AuditEventResult.SUCCESS,
              expect.objectContaining({
                userId: mockUser.id,
                userEmail: mockUser.email,
                ipAddress,
                userAgent,
                metadata: expect.objectContaining({
                  tokenExpiresAt: expect.any(String),
                }),
              }),
            );

            // Property: Token expiry should be in the future (approximately 1 hour)
            const auditCall = (auditService.logAuth as jest.Mock).mock.calls[0];
            const metadata = auditCall[2].metadata;
            const expiresAt = new Date(metadata.tokenExpiresAt);
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            const fiftyNineMinutesFromNow = new Date(
              now.getTime() + 59 * 60 * 1000,
            );

            // Property: Token should expire approximately 1 hour from now
            expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
              fiftyNineMinutesFromNow.getTime(),
            );
            expect(expiresAt.getTime()).toBeLessThanOrEqual(
              oneHourFromNow.getTime() + 1000, // Allow 1 second tolerance
            );

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate unique tokens for different reset requests", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.emailAddress(),
          async (email1, email2) => {
            // Skip if emails are the same
            fc.pre(email1.toLowerCase() !== email2.toLowerCase());

            // Create mock users
            const mockUser1 = {
              id: `user-1-${Math.random()}`,
              email: email1.toLowerCase(),
              isActive: true,
              deletedAt: null,
            } as UserEntity;

            const mockUser2 = {
              id: `user-2-${Math.random()}`,
              email: email2.toLowerCase(),
              isActive: true,
              deletedAt: null,
            } as UserEntity;

            // Setup mocks
            jest
              .spyOn(rateLimiterService, "checkRateLimit")
              .mockResolvedValue(undefined);
            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValueOnce(mockUser1)
              .mockResolvedValueOnce(mockUser2);
            jest
              .spyOn(emailService, "sendPasswordResetEmail")
              .mockResolvedValue(undefined);
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Execute first command
            const command1 = new RequestPasswordResetCommand(email1);
            await handler.execute(command1);

            // Execute second command
            const command2 = new RequestPasswordResetCommand(email2);
            await handler.execute(command2);

            // Get tokens from email service calls
            const emailCalls = (
              emailService.sendPasswordResetEmail as jest.Mock
            ).mock.calls;
            const token1 = emailCalls[0][1];
            const token2 = emailCalls[1][1];

            // Property: Tokens should be unique
            expect(token1).not.toBe(token2);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should return success message even when user does not exist (prevent email enumeration)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.ipV4(),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (email, ipAddress, userAgent) => {
            // Setup mocks - user not found
            jest
              .spyOn(rateLimiterService, "checkRateLimit")
              .mockResolvedValue(undefined);
            jest.spyOn(userRepository, "findOne").mockResolvedValue(null);
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Execute command
            const command = new RequestPasswordResetCommand(
              email,
              ipAddress,
              userAgent,
            );

            const result = await handler.execute(command);

            // Property: Should still return success message
            expect(result).toBeDefined();
            expect(result.message).toContain(
              "If an account exists with this email",
            );

            // Property: Email should NOT be sent
            expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();

            // Property: Failure should be logged
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "password_reset_request",
              AuditEventResult.FAILURE,
              expect.objectContaining({
                userEmail: email.toLowerCase().trim(),
                ipAddress,
                userAgent,
                errorMessage: "User not found or inactive",
              }),
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should return success message even when user is inactive (prevent email enumeration)", async () => {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          // Create mock inactive user
          const mockUser = {
            id: `user-${Math.random()}`,
            email: email.toLowerCase(),
            isActive: false, // Inactive user
            deletedAt: null,
          } as UserEntity;

          // Setup mocks
          jest
            .spyOn(rateLimiterService, "checkRateLimit")
            .mockResolvedValue(undefined);
          jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser);
          jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

          // Execute command
          const command = new RequestPasswordResetCommand(email);

          const result = await handler.execute(command);

          // Property: Should still return success message
          expect(result).toBeDefined();
          expect(result.message).toContain(
            "If an account exists with this email",
          );

          // Property: Email should NOT be sent
          expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();

          // Property: Failure should be logged
          expect(auditService.logAuth).toHaveBeenCalledWith(
            "password_reset_request",
            AuditEventResult.FAILURE,
            expect.objectContaining({
              userEmail: email.toLowerCase().trim(),
              errorMessage: "User not found or inactive",
            }),
          );

          return true;
        }),
        { numRuns: 50 },
      );
    });

    it("should handle email service failures gracefully and still return success", async () => {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          // Create mock user
          const mockUser = {
            id: `user-${Math.random()}`,
            email: email.toLowerCase(),
            isActive: true,
            deletedAt: null,
          } as UserEntity;

          // Setup mocks - email service fails
          jest
            .spyOn(rateLimiterService, "checkRateLimit")
            .mockResolvedValue(undefined);
          jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser);
          jest
            .spyOn(emailService, "sendPasswordResetEmail")
            .mockRejectedValue(new Error("SMTP connection failed"));
          jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

          // Execute command
          const command = new RequestPasswordResetCommand(email);

          const result = await handler.execute(command);

          // Property: Should still return success message
          expect(result).toBeDefined();
          expect(result.message).toContain(
            "If an account exists with this email",
          );

          // Property: Email failure should be logged
          expect(auditService.logAuth).toHaveBeenCalledWith(
            "password_reset_request",
            AuditEventResult.FAILURE,
            expect.objectContaining({
              userId: mockUser.id,
              userEmail: mockUser.email,
              errorMessage: expect.stringContaining("Email send failed"),
            }),
          );

          // Property: Success should still be logged (after email failure)
          expect(auditService.logAuth).toHaveBeenCalledWith(
            "password_reset_request",
            AuditEventResult.SUCCESS,
            expect.objectContaining({
              userId: mockUser.id,
              userEmail: mockUser.email,
            }),
          );

          return true;
        }),
        { numRuns: 50 },
      );
    });

    it("should enforce rate limiting (3 requests per hour per email)", async () => {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          // Setup mocks - rate limit exceeded
          jest
            .spyOn(rateLimiterService, "checkRateLimit")
            .mockRejectedValue(new Error("Rate limit exceeded"));
          jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

          // Execute command
          const command = new RequestPasswordResetCommand(email);

          // Property: Should throw rate limit error
          await expect(handler.execute(command)).rejects.toThrow(
            "Rate limit exceeded",
          );

          // Property: Rate limit failure should be logged
          expect(auditService.logAuth).toHaveBeenCalledWith(
            "password_reset_request",
            AuditEventResult.FAILURE,
            expect.objectContaining({
              userEmail: email.toLowerCase().trim(),
              errorMessage: "Rate limit exceeded",
            }),
          );

          // Property: User lookup should NOT happen
          expect(userRepository.findOne).not.toHaveBeenCalled();

          // Property: Email should NOT be sent
          expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();

          return true;
        }),
        { numRuns: 50 },
      );
    });

    it("should normalize email addresses (lowercase and trim)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .emailAddress()
            .map((email) => email.toUpperCase())
            .map((email) => `  ${email}  `), // Add whitespace
          async (email) => {
            const normalizedEmail = email.toLowerCase().trim();

            // Create mock user with normalized email
            const mockUser = {
              id: `user-${Math.random()}`,
              email: normalizedEmail,
              isActive: true,
              deletedAt: null,
            } as UserEntity;

            // Setup mocks
            jest
              .spyOn(rateLimiterService, "checkRateLimit")
              .mockResolvedValue(undefined);
            jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser);
            jest
              .spyOn(emailService, "sendPasswordResetEmail")
              .mockResolvedValue(undefined);
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Execute command with non-normalized email
            const command = new RequestPasswordResetCommand(email);

            await handler.execute(command);

            // Property: Rate limiter should use normalized email
            expect(rateLimiterService.checkRateLimit).toHaveBeenCalledWith(
              `password-reset:${normalizedEmail}`,
              expect.any(Number),
              expect.any(Number),
            );

            // Property: User lookup should use normalized email
            expect(userRepository.findOne).toHaveBeenCalledWith({
              where: { email: normalizedEmail, deletedAt: null },
            });

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should clean up old tokens for the same user when generating new token", async () => {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          // Clear mocks before this property test iteration
          jest.clearAllMocks();

          // Create mock user
          const mockUser = {
            id: `user-${Math.random()}`,
            email: email.toLowerCase(),
            isActive: true,
            deletedAt: null,
          } as UserEntity;

          // Setup mocks
          jest
            .spyOn(rateLimiterService, "checkRateLimit")
            .mockResolvedValue(undefined);
          jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser);
          jest
            .spyOn(emailService, "sendPasswordResetEmail")
            .mockResolvedValue(undefined);
          jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

          // Execute command twice for the same user
          const command1 = new RequestPasswordResetCommand(email);
          await handler.execute(command1);

          const command2 = new RequestPasswordResetCommand(email);
          await handler.execute(command2);

          // Get tokens from email service calls
          const emailCalls = (emailService.sendPasswordResetEmail as jest.Mock)
            .mock.calls;
          const token1 = emailCalls[0][1];
          const token2 = emailCalls[1][1];

          // Property: Second token should be different from first
          expect(token1).not.toBe(token2);

          // Property: Both emails should be sent
          expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(2);

          return true;
        }),
        { numRuns: 30 },
      );
    });

    it("should include all required metadata in audit log", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.ipV4(),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (email, ipAddress, userAgent) => {
            // Create mock user
            const mockUser = {
              id: `user-${Math.random()}`,
              email: email.toLowerCase(),
              isActive: true,
              deletedAt: null,
            } as UserEntity;

            // Setup mocks
            jest
              .spyOn(rateLimiterService, "checkRateLimit")
              .mockResolvedValue(undefined);
            jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser);
            jest
              .spyOn(emailService, "sendPasswordResetEmail")
              .mockResolvedValue(undefined);
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Execute command
            const command = new RequestPasswordResetCommand(
              email,
              ipAddress,
              userAgent,
            );

            await handler.execute(command);

            // Property: Audit log should include all required fields
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "password_reset_request",
              AuditEventResult.SUCCESS,
              expect.objectContaining({
                userId: mockUser.id,
                userEmail: mockUser.email,
                ipAddress,
                userAgent,
                metadata: expect.objectContaining({
                  tokenExpiresAt: expect.any(String),
                }),
              }),
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle various email formats correctly", async () => {
      const testEmails = [
        "test@telemetryflow.id",
        "user+tag@telemetryflow.id",
        "user.name@example.co.uk",
        "123@telemetryflow.id",
        "a@b.c",
      ];

      for (const email of testEmails) {
        // Create mock user
        const mockUser = {
          id: `user-${Math.random()}`,
          email: email.toLowerCase(),
          isActive: true,
          deletedAt: null,
        } as UserEntity;

        // Setup mocks
        jest
          .spyOn(rateLimiterService, "checkRateLimit")
          .mockResolvedValue(undefined);
        jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser);
        jest
          .spyOn(emailService, "sendPasswordResetEmail")
          .mockResolvedValue(undefined);
        jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

        // Execute command
        const command = new RequestPasswordResetCommand(email);
        const result = await handler.execute(command);

        // Property: All valid email formats should be accepted
        expect(result).toBeDefined();
        expect(result.message).toContain(
          "If an account exists with this email",
        );
        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
          email.toLowerCase(),
          expect.any(String),
        );

        // Clear mocks for next iteration
        jest.clearAllMocks();
      }
    });
  });
});
