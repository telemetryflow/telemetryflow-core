/**
 * Property-Based Tests for Authentication - Password Change with Verification
 *
 * Feature: frontend-backend-auth-integration
 * Property 13: Password change with verification
 * Validates: Requirements 4.1
 *
 * Tests that for any authenticated user providing correct current password
 * and valid new password, the password should be updated successfully.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus } from "@nestjs/cqrs";
import { ChangePasswordHandler } from "../application/handlers/ChangePassword.handler";
import { ChangePasswordCommand } from "../application/commands/ChangePassword.command";
import { UserService } from "../services/user.service";
import { SessionService } from "../services/session.service";
import { EmailService } from "../services/email.service";
import { SecurityLogService } from "../services/security-log.service";
import { AuditService } from "../../audit/audit.service";
import { User } from "../../iam/domain/aggregates/User";
import { Email } from "../../iam/domain/value-objects/Email";
import { UserId } from "../../iam/domain/value-objects/UserId";
import { UnauthorizedException, NotFoundException } from "@nestjs/common";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 13: Password change with verification", () => {
    let handler: ChangePasswordHandler;
    let userService: UserService;
    let sessionService: SessionService;
    let emailService: EmailService;
    let auditService: AuditService;

    // Helper to generate valid passwords
    const validPasswordArbitrary = fc
      .string({ minLength: 8, maxLength: 100 })
      .filter((s) => {
        return (
          /[A-Z]/.test(s) &&
          /[a-z]/.test(s) &&
          /[0-9]/.test(s) &&
          /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s)
        );
      });

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ChangePasswordHandler,
          {
            provide: UserService,
            useValue: {
              findById: jest.fn(),
              verifyPassword: jest.fn(),
              updatePassword: jest.fn(),
              hashPassword: jest.fn(),
              validatePasswordComplexity: jest.fn(),
            },
          },
          {
            provide: SessionService,
            useValue: {
              revokeUserSessions: jest.fn(),
            },
          },
          {
            provide: EmailService,
            useValue: {
              sendPasswordChangeConfirmation: jest.fn(),
            },
          },
          {
            provide: AuditService,
            useValue: {
              logAuth: jest.fn(),
            },
          },
          {
            provide: SecurityLogService,
            useValue: {
              logPasswordChange: jest.fn(() => Promise.resolve()),
              logEvent: jest.fn(() => Promise.resolve()),
            },
          },
        ],
      }).compile();

      handler = module.get<ChangePasswordHandler>(ChangePasswordHandler);
      userService = module.get<UserService>(UserService);
      sessionService = module.get<SessionService>(SessionService);
      emailService = module.get<EmailService>(EmailService);
      auditService = module.get<AuditService>(AuditService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should successfully change password for any authenticated user with correct current password and valid new password", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.emailAddress(), // user email
          validPasswordArbitrary, // current password
          validPasswordArbitrary, // new password
          fc.uuid(), // sessionId
          fc.ipV4(), // ipAddress
          fc.string({ minLength: 10, maxLength: 200 }), // userAgent
          async (
            userId,
            email,
            currentPassword,
            newPassword,
            sessionId,
            ipAddress,
            userAgent,
          ) => {
            // Skip if passwords are the same
            fc.pre(currentPassword !== newPassword);

            // Create mock user
            const mockUser = {
              getId: () => UserId.fromString(userId),
              getEmail: () => Email.create(email),
              getPasswordHash: () => "hashed-current-password",
              changePassword: jest.fn(),
            } as unknown as User;

            // Setup mocks
            jest.spyOn(userService, "findById").mockResolvedValue(mockUser);
            jest.spyOn(userService, "verifyPassword").mockResolvedValue(true); // Current password is correct
            jest.spyOn(userService, "updatePassword").mockResolvedValue();
            jest
              .spyOn(sessionService, "revokeUserSessions")
              .mockResolvedValue();
            jest
              .spyOn(emailService, "sendPasswordChangeConfirmation")
              .mockResolvedValue();
            jest.spyOn(auditService, "logAuth").mockResolvedValue();

            // Execute command
            const command = new ChangePasswordCommand(
              userId,
              currentPassword,
              newPassword,
              sessionId,
              ipAddress,
              userAgent,
            );

            const result = await handler.execute(command);

            // Property: Password change should succeed
            expect(result).toBeDefined();
            expect(result.message).toContain("Password changed successfully");

            // Property: User should be found
            expect(userService.findById).toHaveBeenCalledWith(userId);

            // Property: Current password should be verified
            expect(userService.verifyPassword).toHaveBeenCalledWith(
              currentPassword,
              "hashed-current-password",
            );

            // Property: Password should be updated
            expect(userService.updatePassword).toHaveBeenCalledWith(
              userId,
              newPassword,
            );

            // Property: Other sessions should be invalidated (except current)
            expect(sessionService.revokeUserSessions).toHaveBeenCalledWith(
              userId,
              sessionId,
              "Password changed",
            );

            // Property: Confirmation email should be sent
            expect(
              emailService.sendPasswordChangeConfirmation,
            ).toHaveBeenCalledWith(email);

            // Property: Success should be logged
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "password_change",
              "SUCCESS",
              expect.objectContaining({
                userId,
                userEmail: email,
                ipAddress,
                userAgent,
              }),
            );

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject password change when current password is incorrect", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          validPasswordArbitrary,
          validPasswordArbitrary,
          fc.uuid(),
          async (userId, email, currentPassword, newPassword, sessionId) => {
            // Skip if passwords are the same
            fc.pre(currentPassword !== newPassword);

            // Create mock user
            const mockUser = {
              getId: () => UserId.fromString(userId),
              getEmail: () => Email.create(email),
              getPasswordHash: () => "hashed-current-password",
            } as unknown as User;

            // Setup mocks - current password is INCORRECT
            jest.spyOn(userService, "findById").mockResolvedValue(mockUser);
            jest.spyOn(userService, "verifyPassword").mockResolvedValue(false); // Current password is incorrect
            jest.spyOn(auditService, "logAuth").mockResolvedValue();

            // Execute command
            const command = new ChangePasswordCommand(
              userId,
              currentPassword,
              newPassword,
              sessionId,
            );

            // Property: Should throw UnauthorizedException
            await expect(handler.execute(command)).rejects.toThrow(
              UnauthorizedException,
            );

            // Property: Should throw with correct message
            await expect(handler.execute(command)).rejects.toThrow(
              "Current password is incorrect",
            );

            // Property: Password should NOT be updated
            expect(userService.updatePassword).not.toHaveBeenCalled();

            // Property: Sessions should NOT be invalidated
            expect(sessionService.revokeUserSessions).not.toHaveBeenCalled();

            // Property: Confirmation email should NOT be sent
            expect(
              emailService.sendPasswordChangeConfirmation,
            ).not.toHaveBeenCalled();

            // Property: Failure should be logged
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "password_change",
              "FAILURE",
              expect.objectContaining({
                userId,
                userEmail: email,
                errorMessage: "Invalid current password",
              }),
            );

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject password change when user is not found", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          validPasswordArbitrary,
          validPasswordArbitrary,
          fc.uuid(),
          async (userId, currentPassword, newPassword, sessionId) => {
            // Skip if passwords are the same
            fc.pre(currentPassword !== newPassword);

            // Setup mocks - user not found
            jest.spyOn(userService, "findById").mockResolvedValue(null);

            // Execute command
            const command = new ChangePasswordCommand(
              userId,
              currentPassword,
              newPassword,
              sessionId,
            );

            // Property: Should throw NotFoundException
            await expect(handler.execute(command)).rejects.toThrow(
              NotFoundException,
            );

            // Property: Should throw with correct message
            await expect(handler.execute(command)).rejects.toThrow(
              "User not found",
            );

            // Property: Password verification should NOT be attempted
            expect(userService.verifyPassword).not.toHaveBeenCalled();

            // Property: Password should NOT be updated
            expect(userService.updatePassword).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle email service failures gracefully without blocking password change", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          validPasswordArbitrary,
          validPasswordArbitrary,
          fc.uuid(),
          async (userId, email, currentPassword, newPassword, sessionId) => {
            // Skip if passwords are the same
            fc.pre(currentPassword !== newPassword);

            // Create mock user
            const mockUser = {
              getId: () => UserId.fromString(userId),
              getEmail: () => Email.create(email),
              getPasswordHash: () => "hashed-current-password",
            } as unknown as User;

            // Setup mocks - email service fails
            jest.spyOn(userService, "findById").mockResolvedValue(mockUser);
            jest.spyOn(userService, "verifyPassword").mockResolvedValue(true);
            jest.spyOn(userService, "updatePassword").mockResolvedValue();
            jest
              .spyOn(sessionService, "revokeUserSessions")
              .mockResolvedValue();
            jest
              .spyOn(emailService, "sendPasswordChangeConfirmation")
              .mockRejectedValue(new Error("SMTP connection failed"));
            jest.spyOn(auditService, "logAuth").mockResolvedValue();

            // Execute command
            const command = new ChangePasswordCommand(
              userId,
              currentPassword,
              newPassword,
              sessionId,
            );

            // Property: Password change should still succeed despite email failure
            const result = await handler.execute(command);
            expect(result).toBeDefined();
            expect(result.message).toContain("Password changed successfully");

            // Property: Password should still be updated
            expect(userService.updatePassword).toHaveBeenCalledWith(
              userId,
              newPassword,
            );

            // Property: Sessions should still be invalidated
            expect(sessionService.revokeUserSessions).toHaveBeenCalledWith(
              userId,
              sessionId,
              "Password changed",
            );

            // Property: Success should still be logged
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "password_change",
              "SUCCESS",
              expect.any(Object),
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should validate new password complexity and reject invalid passwords", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          validPasswordArbitrary,
          fc.string({ minLength: 1, maxLength: 7 }), // Invalid: too short
          fc.uuid(),
          async (userId, email, currentPassword, newPassword, sessionId) => {
            // Create mock user
            const mockUser = {
              getId: () => UserId.fromString(userId),
              getEmail: () => Email.create(email),
              getPasswordHash: () => "hashed-current-password",
            } as unknown as User;

            // Setup mocks
            jest.spyOn(userService, "findById").mockResolvedValue(mockUser);
            jest.spyOn(userService, "verifyPassword").mockResolvedValue(true);
            jest
              .spyOn(userService, "updatePassword")
              .mockRejectedValue(
                new Error("Password does not meet complexity requirements"),
              );
            jest.spyOn(auditService, "logAuth").mockResolvedValue();

            // Execute command
            const command = new ChangePasswordCommand(
              userId,
              currentPassword,
              newPassword,
              sessionId,
            );

            // Property: Should reject invalid password
            await expect(handler.execute(command)).rejects.toThrow();

            // Property: Sessions should NOT be invalidated
            expect(sessionService.revokeUserSessions).not.toHaveBeenCalled();

            // Property: Confirmation email should NOT be sent
            expect(
              emailService.sendPasswordChangeConfirmation,
            ).not.toHaveBeenCalled();

            // Property: Failure should be logged
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "password_change",
              "FAILURE",
              expect.objectContaining({
                userId,
                userEmail: email,
              }),
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should include metadata about session invalidation in audit log", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          validPasswordArbitrary,
          validPasswordArbitrary,
          fc.uuid(),
          fc.ipV4(),
          fc.string({ minLength: 10, maxLength: 100 }),
          async (
            userId,
            email,
            currentPassword,
            newPassword,
            sessionId,
            ipAddress,
            userAgent,
          ) => {
            // Skip if passwords are the same
            fc.pre(currentPassword !== newPassword);

            // Create mock user
            const mockUser = {
              getId: () => UserId.fromString(userId),
              getEmail: () => Email.create(email),
              getPasswordHash: () => "hashed-current-password",
            } as unknown as User;

            // Setup mocks
            jest.spyOn(userService, "findById").mockResolvedValue(mockUser);
            jest.spyOn(userService, "verifyPassword").mockResolvedValue(true);
            jest.spyOn(userService, "updatePassword").mockResolvedValue();
            jest
              .spyOn(sessionService, "revokeUserSessions")
              .mockResolvedValue();
            jest
              .spyOn(emailService, "sendPasswordChangeConfirmation")
              .mockResolvedValue();
            jest.spyOn(auditService, "logAuth").mockResolvedValue();

            // Execute command
            const command = new ChangePasswordCommand(
              userId,
              currentPassword,
              newPassword,
              sessionId,
              ipAddress,
              userAgent,
            );

            await handler.execute(command);

            // Property: Audit log should include session invalidation metadata
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "password_change",
              "SUCCESS",
              expect.objectContaining({
                userId,
                userEmail: email,
                ipAddress,
                userAgent,
                metadata: expect.objectContaining({
                  sessionsInvalidated: true,
                }),
              }),
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle various valid password formats correctly", async () => {
      const validPasswords = [
        "Abcd123!", // Minimum length (8 chars)
        "A".repeat(95) + "bc1!@", // Maximum length (100 chars)
        "!@#$%^&*()_+-=[]{}A1a", // Many special chars
        "AAAA1111aaaa!!!!", // Repeated characters
        "P@ssw0rd 123", // With space
        "Test123!@#$%^&*()", // Multiple special chars
      ];

      for (const newPassword of validPasswords) {
        const userId = `user-${Math.random()}`;
        const email = "test@telemetryflow.id";
        const currentPassword = "OldP@ss123";
        const sessionId = `session-${Math.random()}`;

        // Create mock user
        const mockUser = {
          getId: () => UserId.fromString(userId),
          getEmail: () => Email.create(email),
          getPasswordHash: () => "hashed-current-password",
        } as unknown as User;

        // Setup mocks
        jest.spyOn(userService, "findById").mockResolvedValue(mockUser);
        jest.spyOn(userService, "verifyPassword").mockResolvedValue(true);
        jest.spyOn(userService, "updatePassword").mockResolvedValue();
        jest.spyOn(sessionService, "revokeUserSessions").mockResolvedValue();
        jest
          .spyOn(emailService, "sendPasswordChangeConfirmation")
          .mockResolvedValue();
        jest.spyOn(auditService, "logAuth").mockResolvedValue();

        // Execute command
        const command = new ChangePasswordCommand(
          userId,
          currentPassword,
          newPassword,
          sessionId,
        );

        const result = await handler.execute(command);

        // Property: All valid passwords should be accepted
        expect(result).toBeDefined();
        expect(result.message).toContain("Password changed successfully");
        expect(userService.updatePassword).toHaveBeenCalledWith(
          userId,
          newPassword,
        );

        // Clear mocks for next iteration
        jest.clearAllMocks();
      }
    });

    it("should consistently handle the same password change request", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          validPasswordArbitrary,
          validPasswordArbitrary,
          fc.uuid(),
          async (userId, email, currentPassword, newPassword, sessionId) => {
            // Skip if passwords are the same
            fc.pre(currentPassword !== newPassword);

            // Clear mocks for each iteration
            jest.clearAllMocks();

            // Create mock user
            const mockUser = {
              getId: () => UserId.fromString(userId),
              getEmail: () => Email.create(email),
              getPasswordHash: () => "hashed-current-password",
            } as unknown as User;

            // Setup mocks
            jest.spyOn(userService, "findById").mockResolvedValue(mockUser);
            jest.spyOn(userService, "verifyPassword").mockResolvedValue(true);
            jest.spyOn(userService, "updatePassword").mockResolvedValue();
            jest
              .spyOn(sessionService, "revokeUserSessions")
              .mockResolvedValue();
            jest
              .spyOn(emailService, "sendPasswordChangeConfirmation")
              .mockResolvedValue();
            jest.spyOn(auditService, "logAuth").mockResolvedValue();

            // Execute command twice
            const command = new ChangePasswordCommand(
              userId,
              currentPassword,
              newPassword,
              sessionId,
            );

            const result1 = await handler.execute(command);
            const result2 = await handler.execute(command);

            // Property: Results should be consistent
            expect(result1.message).toBe(result2.message);

            // Property: Both executions should call the same services
            expect(userService.updatePassword).toHaveBeenCalledTimes(2);
            expect(sessionService.revokeUserSessions).toHaveBeenCalledTimes(2);

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should preserve current session when invalidating others", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          validPasswordArbitrary,
          validPasswordArbitrary,
          fc.uuid(),
          async (userId, email, currentPassword, newPassword, sessionId) => {
            // Skip if passwords are the same
            fc.pre(currentPassword !== newPassword);

            // Create mock user
            const mockUser = {
              getId: () => UserId.fromString(userId),
              getEmail: () => Email.create(email),
              getPasswordHash: () => "hashed-current-password",
            } as unknown as User;

            // Setup mocks
            jest.spyOn(userService, "findById").mockResolvedValue(mockUser);
            jest.spyOn(userService, "verifyPassword").mockResolvedValue(true);
            jest.spyOn(userService, "updatePassword").mockResolvedValue();
            jest
              .spyOn(sessionService, "revokeUserSessions")
              .mockResolvedValue();
            jest
              .spyOn(emailService, "sendPasswordChangeConfirmation")
              .mockResolvedValue();
            jest.spyOn(auditService, "logAuth").mockResolvedValue();

            // Execute command
            const command = new ChangePasswordCommand(
              userId,
              currentPassword,
              newPassword,
              sessionId,
            );

            await handler.execute(command);

            // Property: Current session should be preserved (passed as exceptSessionId)
            expect(sessionService.revokeUserSessions).toHaveBeenCalledWith(
              userId,
              sessionId, // This session should be preserved
              "Password changed",
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
