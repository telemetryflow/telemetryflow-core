/**
 * Property-Based Tests for Authentication - MFA Enablement
 *
 * Feature: frontend-backend-auth-integration
 * Property 20: MFA enablement requires verification
 * Validates: Requirements 7.2
 *
 * Tests that for any MFA enablement attempt, the system verifies a valid TOTP
 * code before enabling MFA.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException } from "@nestjs/common";
import { EnableMFAHandler } from "../application/handlers/EnableMFA.handler";
import { EnableMFACommand } from "../application/commands/EnableMFA.command";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { MfaService } from "../services/mfa.service";
import { EmailService } from "../services/email.service";
import { AuditService, AuditEventResult } from "../../audit/audit.service";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 20: MFA enablement requires verification", () => {
    let handler: EnableMFAHandler;
    let userRepository: Repository<UserEntity>;
    let mfaService: MfaService;
    let emailService: EmailService;
    let auditService: AuditService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EnableMFAHandler,
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
              verifyMfaSetup: jest.fn(),
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

      handler = module.get<EnableMFAHandler>(EnableMFAHandler);
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

    it("should enable MFA only after verifying valid TOTP code", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid user IDs (UUIDs)
          fc.uuid(),
          // Generate valid email addresses
          fc.emailAddress(),
          // Generate valid 6-digit TOTP codes
          fc.integer({ min: 0, max: 999999 }).map((n) => n.toString().padStart(6, "0")),
          // Generate IP addresses
          fc.ipV4(),
          // Generate user agents
          fc.constantFrom(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "Mozilla/5.0 (X11; Linux x86_64)",
          ),
          async (userId, email, code, ipAddress, userAgent) => {
            // Mock user without MFA enabled
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
              mfa_secret: null,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock successful TOTP verification
            jest.spyOn(mfaService, "verifyMfaSetup").mockResolvedValue(undefined);

            // Mock email service
            jest.spyOn(emailService, "sendMFAConfirmation").mockResolvedValue(undefined);

            // Mock audit service
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: MFA enablement should verify TOTP code before enabling
            const command = new EnableMFACommand(userId, code, ipAddress, userAgent);
            const result = await handler.execute(command);

            // Property: Should call verifyMfaSetup with correct parameters
            expect(mfaService.verifyMfaSetup).toHaveBeenCalledWith(userId, code);

            // Property: Should send confirmation email (Requirement 7.3)
            expect(emailService.sendMFAConfirmation).toHaveBeenCalledWith(email, true);

            // Property: Should log successful enablement
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_enable",
              AuditEventResult.SUCCESS,
              expect.objectContaining({
                userId,
                userEmail: email,
                ipAddress,
                userAgent,
              }),
            );

            // Property: Should return success message
            expect(result.message).toBe("MFA enabled successfully");

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject MFA enablement with invalid TOTP code", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          // Generate invalid TOTP codes (wrong format or invalid)
          fc.constantFrom("000000", "123456", "999999", "invalid", "12345", "1234567"),
          async (userId, email, invalidCode) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock failed TOTP verification
            jest
              .spyOn(mfaService, "verifyMfaSetup")
              .mockRejectedValue(new BadRequestException("Invalid verification code"));

            // Mock audit service
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: Should reject enablement with invalid code
            const command = new EnableMFACommand(userId, invalidCode);
            await expect(handler.execute(command)).rejects.toThrow(BadRequestException);

            // Property: Should log failed attempt
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_enable",
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

    it("should reject MFA enablement for non-existent users", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 6, maxLength: 6 }),
          async (userId, code) => {
            // Mock user not found
            jest.spyOn(userRepository, "findOne").mockResolvedValue(null);

            // Property: Should throw BadRequestException for non-existent users
            const command = new EnableMFACommand(userId, code);
            await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
            await expect(handler.execute(command)).rejects.toThrow("User not found");

            // Property: Should not attempt to verify TOTP
            expect(mfaService.verifyMfaSetup).not.toHaveBeenCalled();

            // Property: Should not send confirmation email
            expect(emailService.sendMFAConfirmation).not.toHaveBeenCalled();

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
          fc.integer({ min: 0, max: 999999 }).map((n) => n.toString().padStart(6, "0")),
          async (userId, email, code) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock successful TOTP verification
            jest.spyOn(mfaService, "verifyMfaSetup").mockResolvedValue(undefined);

            // Mock email service failure
            jest
              .spyOn(emailService, "sendMFAConfirmation")
              .mockRejectedValue(new Error("Email service unavailable"));

            // Mock audit service
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: Should still enable MFA even if email fails
            const command = new EnableMFACommand(userId, code);
            const result = await handler.execute(command);

            // Property: Should return success despite email failure
            expect(result.message).toBe("MFA enabled successfully");

            // Property: Should still log successful enablement
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_enable",
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

    it("should reject MFA enablement if setup expired", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 6 }),
          async (userId, email, code) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock expired setup
            jest
              .spyOn(mfaService, "verifyMfaSetup")
              .mockRejectedValue(
                new BadRequestException("MFA setup expired. Please initiate setup again."),
              );

            // Mock audit service
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: Should reject enablement if setup expired
            const command = new EnableMFACommand(userId, code);
            await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
            await expect(handler.execute(command)).rejects.toThrow("MFA setup expired");

            // Property: Should log failed attempt
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_enable",
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

    it("should reject MFA enablement if no setup in progress", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 6 }),
          async (userId, email, code) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock no setup in progress
            jest
              .spyOn(mfaService, "verifyMfaSetup")
              .mockRejectedValue(
                new BadRequestException(
                  "No MFA setup in progress. Please initiate setup first.",
                ),
              );

            // Mock audit service
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: Should reject enablement if no setup in progress
            const command = new EnableMFACommand(userId, code);
            await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
            await expect(handler.execute(command)).rejects.toThrow("No MFA setup in progress");

            // Property: Should log failed attempt
            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_enable",
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

    it("should include IP address and user agent in audit logs when provided", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.integer({ min: 0, max: 999999 }).map((n) => n.toString().padStart(6, "0")),
          fc.ipV4(),
          fc.string({ minLength: 10, maxLength: 100 }),
          async (userId, email, code, ipAddress, userAgent) => {
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              mfa_enabled: false,
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);

            jest.spyOn(mfaService, "verifyMfaSetup").mockResolvedValue(undefined);
            jest.spyOn(emailService, "sendMFAConfirmation").mockResolvedValue(undefined);
            jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

            // Property: Should include IP and user agent in audit logs
            const command = new EnableMFACommand(userId, code, ipAddress, userAgent);
            await handler.execute(command);

            expect(auditService.logAuth).toHaveBeenCalledWith(
              "mfa_enable",
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

    it("should handle various TOTP code formats", async () => {
      const validCodes = ["000000", "123456", "999999", "000001", "100000"];

      for (const code of validCodes) {
        const userId = "test-user-id";
        const email = "test@example.com";

        const mockUser: Partial<UserEntity> = {
          id: userId,
          email: email,
          mfa_enabled: false,
        };

        jest
          .spyOn(userRepository, "findOne")
          .mockResolvedValue(mockUser as UserEntity);

        jest.spyOn(mfaService, "verifyMfaSetup").mockResolvedValue(undefined);
        jest.spyOn(emailService, "sendMFAConfirmation").mockResolvedValue(undefined);
        jest.spyOn(auditService, "logAuth").mockResolvedValue(undefined);

        // Property: Should handle various valid TOTP code formats
        const command = new EnableMFACommand(userId, code);
        const result = await handler.execute(command);

        expect(result.message).toBe("MFA enabled successfully");
        expect(mfaService.verifyMfaSetup).toHaveBeenCalledWith(userId, code);
      }
    });
  });
});
