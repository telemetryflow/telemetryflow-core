/**
 * Property-Based Tests for Authentication - MFA Disablement
 *
 * Feature: frontend-backend-auth-integration
 * Property 24: MFA disablement requires re-authentication
 * Validates: Requirements 7.7
 *
 * Tests that for any MFA disablement attempt, the system requires password
 * re-authentication before disabling MFA.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { DisableMFAHandler } from "../application/handlers/DisableMFA.handler";
import { DisableMFACommand } from "../application/commands/DisableMFA.command";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { MfaService } from "../services/mfa.service";
import { EmailService } from "../services/email.service";
import { AuditService, AuditEventResult } from "../../audit/audit.service";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 24: MFA disablement requires re-authentication", () => {
    let handler: DisableMFAHandler;
    let userRepository: Repository<UserEntity>;
    let mfaService: MfaService;
    let emailService: EmailService;
    let auditService: AuditService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DisableMFAHandler,
          {
            provide: getRepositoryToken(UserEntity),
            useValue: {
              findOne: jest.fn(),
              update: jest.fn(),
            },
          },
          {
            provide: MfaService,
            useValue: {
              disableMfa: jest.fn(),
            },
          },
          {
            provide: EmailService,
            useValue: {
              sendMFAConfirmation: jest.fn(),
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

      handler = module.get<DisableMFAHandler>(DisableMFAHandler);
      userRepository = module.get<Repository<UserEntity>>(
        getRepositoryToken(UserEntity),
      );
      mfaService = module.get<MfaService>(MfaService);
      emailService = module.get<EmailService>(EmailService);
      auditService = module.get<AuditService>(AuditService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should disable MFA only after verifying password and TOTP code", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid user IDs (UUIDs)
          fc.uuid(),
          // Generate valid email addresses
          fc.emailAddress(),
          // Generate valid passwords
          fc.string({ minLength: 8, maxLength: 100 }),
          // Generate valid 6-digit TOTP codes
          fc
            .integer({ min: 0, max: 999999 })
            .map((n) => n.toString().padStart(6, "0")),
          // Generate IP addresses
          fc.ipV4(),
          // Generate user agents
          fc.constantFrom(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "Mozilla/5.0 (X11; Linux x86_64)",
          ),
          async (userId, email, password, code, ipAddress, userAgent) => {
            // Mock user with MFA enabled
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
              mfa_secret: "test-secret",
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock successful password verification and MFA disablement
            jest.spyOn(mfaService, "disableMfa").mockResolvedValue(undefined);

            // Mock email service
            jest
              .spyOn(emailService, "sendMFAConfirmation")
              .mockResolvedValue(undefined);

            // Mock audit service
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: MFA disablement should verify password and TOTP code before disabling
            const command = new DisableMFACommand(
              userId,
              password,
              code,
              ipAddress,
              userAgent,
            );
            const result = await handler.execute(command);

            // Property: Should call disableMfa with correct parameters (Requirement 7.7)
            expect(mfaService.disableMfa).toHaveBeenCalledWith(
              userId,
              password,
              code,
            );

            // Property: Should send confirmation email (Requirement 7.7)
            expect(emailService.sendMFAConfirmation).toHaveBeenCalledWith(
              email,
              false,
            );

            // Property: Should log successful disablement
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_disable",
              AuditEventResult.SUCCESS,
              expect.objectContaining({
                userId,
                userEmail: email,
                ipAddress,
                userAgent,
              }),
            );

            // Property: Should return success message
            expect(result.message).toBe("MFA disabled successfully");

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject MFA disablement with invalid password", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 100 }),
          fc
            .integer({ min: 0, max: 999999 })
            .map((n) => n.toString().padStart(6, "0")),
          async (userId, email, invalidPassword, code) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock failed password verification
            jest
              .spyOn(mfaService, "disableMfa")
              .mockRejectedValue(new UnauthorizedException("Invalid password"));

            // Mock audit service
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: Should reject disablement with invalid password
            const command = new DisableMFACommand(
              userId,
              invalidPassword,
              code,
            );
            await expect(handler.execute(command)).rejects.toThrow(
              UnauthorizedException,
            );

            // Property: Should log failed attempt
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_disable",
              AuditEventResult.FAILURE,
              expect.objectContaining({
                userId,
                userEmail: email,
                errorMessage: "Invalid password",
              }),
            );

            // Property: Should not send confirmation email on failure
            expect(emailService.sendMFAConfirmation).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should reject MFA disablement with invalid TOTP code", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 100 }),
          // Generate invalid TOTP codes
          fc.constantFrom(
            "000000",
            "123456",
            "999999",
            "invalid",
            "12345",
            "1234567",
          ),
          async (userId, email, password, invalidCode) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock failed TOTP verification
            jest
              .spyOn(mfaService, "disableMfa")
              .mockRejectedValue(
                new BadRequestException("Invalid verification code"),
              );

            // Mock audit service
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: Should reject disablement with invalid code
            const command = new DisableMFACommand(
              userId,
              password,
              invalidCode,
            );
            await expect(handler.execute(command)).rejects.toThrow(
              BadRequestException,
            );

            // Property: Should log failed attempt
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_disable",
              AuditEventResult.FAILURE,
              expect.objectContaining({
                userId,
                userEmail: email,
                errorMessage: "Invalid verification code",
              }),
            );

            // Property: Should not send confirmation email on failure
            expect(emailService.sendMFAConfirmation).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should reject MFA disablement for non-existent users", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 8, maxLength: 100 }),
          fc.string({ minLength: 6, maxLength: 6 }),
          async (userId, password, code) => {
            // Mock user not found
            jest.spyOn(userRepository, "findOne").mockResolvedValue(null);

            // Property: Should throw BadRequestException for non-existent users
            const command = new DisableMFACommand(userId, password, code);
            await expect(handler.execute(command)).rejects.toThrow(
              BadRequestException,
            );
            await expect(handler.execute(command)).rejects.toThrow(
              "User not found",
            );

            // Property: Should not attempt to disable MFA
            expect(mfaService.disableMfa).not.toHaveBeenCalled();

            // Property: Should not send confirmation email
            expect(emailService.sendMFAConfirmation).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should reject MFA disablement if MFA is not enabled", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 100 }),
          fc.string({ minLength: 6, maxLength: 6 }),
          async (userId, email, password, code) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock MFA not enabled error
            jest
              .spyOn(mfaService, "disableMfa")
              .mockRejectedValue(new BadRequestException("MFA is not enabled"));

            // Mock audit service
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: Should reject disablement if MFA is not enabled
            const command = new DisableMFACommand(userId, password, code);
            await expect(handler.execute(command)).rejects.toThrow(
              BadRequestException,
            );
            await expect(handler.execute(command)).rejects.toThrow(
              "MFA is not enabled",
            );

            // Property: Should log failed attempt
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_disable",
              AuditEventResult.FAILURE,
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

    it("should handle email service failures gracefully", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 100 }),
          fc
            .integer({ min: 0, max: 999999 })
            .map((n) => n.toString().padStart(6, "0")),
          async (userId, email, password, code) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock successful MFA disablement
            jest.spyOn(mfaService, "disableMfa").mockResolvedValue(undefined);

            // Mock email service failure
            jest
              .spyOn(emailService, "sendMFAConfirmation")
              .mockRejectedValue(new Error("Email service unavailable"));

            // Mock audit service
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: Should still disable MFA even if email fails
            const command = new DisableMFACommand(userId, password, code);
            const result = await handler.execute(command);

            // Property: Should return success despite email failure
            expect(result.message).toBe("MFA disabled successfully");

            // Property: Should still log successful disablement
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_disable",
              AuditEventResult.SUCCESS,
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

    it("should include IP address and user agent in audit logs when provided", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 100 }),
          fc
            .integer({ min: 0, max: 999999 })
            .map((n) => n.toString().padStart(6, "0")),
          fc.ipV4(),
          fc.string({ minLength: 10, maxLength: 100 }),
          async (userId, email, password, code, ipAddress, userAgent) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: true,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            jest.spyOn(mfaService, "disableMfa").mockResolvedValue(undefined);
            jest
              .spyOn(emailService, "sendMFAConfirmation")
              .mockResolvedValue(undefined);
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: Should include IP and user agent in audit logs
            const command = new DisableMFACommand(
              userId,
              password,
              code,
              ipAddress,
              userAgent,
            );
            await handler.execute(command);

            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_disable",
              AuditEventResult.SUCCESS,
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
        { numRuns: 50 },
      );
    });

    it("should handle various password formats", async () => {
      const validPasswords = [
        "Password123!",
        "MySecureP@ssw0rd",
        "Test1234!@#$",
        "LongPasswordWith123Numbers",
      ];

      for (const password of validPasswords) {
        const userId = "test-user-id";
        const email = "test@example.com";
        const code = "123456";

        const mockUser: Partial<UserEntity> = {
          id: userId,
          email: email,
          mfa_enabled: true,
        };

        jest
          .spyOn(userRepository, "findOne")
          .mockResolvedValue(mockUser as UserEntity);

        jest.spyOn(mfaService, "disableMfa").mockResolvedValue(undefined);
        jest
          .spyOn(emailService, "sendMFAConfirmation")
          .mockResolvedValue(undefined);
        jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

        // Property: Should handle various valid password formats
        const command = new DisableMFACommand(userId, password, code);
        const result = await handler.execute(command);

        expect(result.message).toBe("MFA disabled successfully");
        expect(mfaService.disableMfa).toHaveBeenCalledWith(
          userId,
          password,
          code,
        );
      }
    });
  });
});
