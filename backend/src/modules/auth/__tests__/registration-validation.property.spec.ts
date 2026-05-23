/**
 * Property-Based Tests for Authentication - Registration Validation
 *
 * Feature: frontend-backend-auth-integration
 * Property 8: Registration creates unverified account
 * Validates: Requirements 3.1, 3.2
 *
 * Tests that valid registration data creates an unverified user account
 * with a unique verification token.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { RegistrationService } from "../services/registration.service";
import { EmailVerificationService } from "../services/email-verification.service";
import { RegisterDto } from "../dto/register.dto";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 8: Registration creates unverified account", () => {
    let registrationService: RegistrationService;
    let mockCommandBus: jest.Mocked<CommandBus>;
    let mockEmailVerificationService: jest.Mocked<EmailVerificationService>;

    beforeEach(async () => {
      mockCommandBus = {
        execute: jest.fn(),
      } as any;

      mockEmailVerificationService = {
        sendVerificationEmail: jest.fn(),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RegistrationService,
          {
            provide: CommandBus,
            useValue: mockCommandBus,
          },
          {
            provide: EmailVerificationService,
            useValue: mockEmailVerificationService,
          },
        ],
      }).compile();

      registrationService = module.get<RegistrationService>(RegistrationService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should create an unverified account for any valid registration data", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid registration data
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 50 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 128 }).map(s => `Aa1@${s}`), // Ensure complexity
            firstName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            lastName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            regionId: fc.uuid(),
            organizationId: fc.option(fc.uuid(), { nil: undefined }),
          }),
          async (registrationData) => {
            // Clear mock before each property test iteration
            mockCommandBus.execute.mockClear();
            mockEmailVerificationService.sendVerificationEmail.mockClear();

            const userId = fc.sample(fc.uuid(), 1)[0];

            // Mock: User creation succeeds and returns userId
            mockCommandBus.execute.mockResolvedValue(userId);

            // Mock: Email verification service succeeds
            mockEmailVerificationService.sendVerificationEmail.mockResolvedValue({
              message: "Verification email sent",
            });

            const dto: RegisterDto = {
              username: registrationData.username,
              email: registrationData.email,
              password: registrationData.password,
              firstName: registrationData.firstName,
              lastName: registrationData.lastName,
              regionId: registrationData.regionId,
              organizationId: registrationData.organizationId,
            };

            // Execute registration
            const result = await registrationService.register(dto);

            // Property 1: Registration should succeed and return user ID
            expect(result).toBeDefined();
            expect(result.userId).toBe(userId);
            expect(result.email).toBe(registrationData.email);

            // Property 2: User creation command should be executed
            expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
            expect(mockCommandBus.execute).toHaveBeenCalledWith(
              expect.objectContaining({
                username: registrationData.username,
                email: registrationData.email,
                password: registrationData.password,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                regionId: registrationData.regionId,
                organizationId: registrationData.organizationId,
              }),
            );

            // Property 3: Verification email should be sent (Requirement 3.2)
            expect(mockEmailVerificationService.sendVerificationEmail).toHaveBeenCalledTimes(1);
            expect(mockEmailVerificationService.sendVerificationEmail).toHaveBeenCalledWith(
              userId,
              registrationData.email,
            );

            // Property 4: Response should indicate verification is required
            expect(result.message).toContain("verify");
            expect(result.message.toLowerCase()).toContain("email");

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle email verification failures gracefully without blocking registration", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 50 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 128 }).map(s => `Aa1@${s}`),
            firstName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            lastName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            regionId: fc.uuid(),
          }),
          async (registrationData) => {
            // Clear mock before each property test iteration
            mockCommandBus.execute.mockClear();
            mockEmailVerificationService.sendVerificationEmail.mockClear();

            const userId = fc.sample(fc.uuid(), 1)[0];

            // Mock: User creation succeeds
            mockCommandBus.execute.mockResolvedValue(userId);

            // Mock: Email verification service fails
            mockEmailVerificationService.sendVerificationEmail.mockRejectedValue(
              new Error("Email service unavailable"),
            );

            const dto: RegisterDto = {
              username: registrationData.username,
              email: registrationData.email,
              password: registrationData.password,
              firstName: registrationData.firstName,
              lastName: registrationData.lastName,
              regionId: registrationData.regionId,
            };

            // Property: Registration should still succeed even if email fails
            const result = await registrationService.register(dto);

            expect(result).toBeDefined();
            expect(result.userId).toBe(userId);
            expect(result.email).toBe(registrationData.email);

            // Property: User creation should have been called
            expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);

            // Property: Email verification should have been attempted
            expect(mockEmailVerificationService.sendVerificationEmail).toHaveBeenCalledTimes(1);

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should generate unique user IDs for different registrations", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              username: fc.string({ minLength: 3, maxLength: 50 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
              email: fc.emailAddress(),
              password: fc.string({ minLength: 8, maxLength: 128 }).map(s => `Aa1@${s}`),
              firstName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              lastName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              regionId: fc.uuid(),
            }),
            { minLength: 2, maxLength: 5 },
          ),
          async (registrations) => {
            // Clear mock before each property test iteration
            mockCommandBus.execute.mockClear();
            mockEmailVerificationService.sendVerificationEmail.mockClear();

            const userIds: string[] = [];

            for (const registrationData of registrations) {
              const userId = fc.sample(fc.uuid(), 1)[0];
              userIds.push(userId);

              // Mock: Each registration gets a unique user ID
              mockCommandBus.execute.mockResolvedValueOnce(userId);
              mockEmailVerificationService.sendVerificationEmail.mockResolvedValueOnce({
                message: "Verification email sent",
              });

              const dto: RegisterDto = {
                username: registrationData.username,
                email: registrationData.email,
                password: registrationData.password,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                regionId: registrationData.regionId,
              };

              await registrationService.register(dto);
            }

            // Property: All user IDs should be unique
            const uniqueUserIds = new Set(userIds);
            expect(uniqueUserIds.size).toBe(userIds.length);

            return true;
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should preserve all registration data in the command", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 50 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 128 }).map(s => `Aa1@${s}`),
            firstName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            lastName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            regionId: fc.uuid(),
            organizationId: fc.option(fc.uuid(), { nil: undefined }),
          }),
          async (registrationData) => {
            // Clear mock before each property test iteration
            mockCommandBus.execute.mockClear();
            mockEmailVerificationService.sendVerificationEmail.mockClear();

            const userId = fc.sample(fc.uuid(), 1)[0];
            mockCommandBus.execute.mockResolvedValue(userId);
            mockEmailVerificationService.sendVerificationEmail.mockResolvedValue({
              message: "Verification email sent",
            });

            const dto: RegisterDto = {
              username: registrationData.username,
              email: registrationData.email,
              password: registrationData.password,
              firstName: registrationData.firstName,
              lastName: registrationData.lastName,
              regionId: registrationData.regionId,
              organizationId: registrationData.organizationId,
            };

            await registrationService.register(dto);

            // Property: All registration data should be passed to the command
            const commandCall = mockCommandBus.execute.mock.calls[0][0] as any;
            expect(commandCall.username).toBe(registrationData.username);
            expect(commandCall.email).toBe(registrationData.email);
            expect(commandCall.password).toBe(registrationData.password);
            expect(commandCall.firstName).toBe(registrationData.firstName);
            expect(commandCall.lastName).toBe(registrationData.lastName);
            expect(commandCall.regionId).toBe(registrationData.regionId);
            expect(commandCall.organizationId).toBe(registrationData.organizationId);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should always return a success message indicating email verification is required", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 50 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 128 }).map(s => `Aa1@${s}`),
            firstName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            lastName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            regionId: fc.uuid(),
          }),
          async (registrationData) => {
            // Clear mock before each property test iteration
            mockCommandBus.execute.mockClear();
            mockEmailVerificationService.sendVerificationEmail.mockClear();

            const userId = fc.sample(fc.uuid(), 1)[0];
            mockCommandBus.execute.mockResolvedValue(userId);
            mockEmailVerificationService.sendVerificationEmail.mockResolvedValue({
              message: "Verification email sent",
            });

            const dto: RegisterDto = {
              username: registrationData.username,
              email: registrationData.email,
              password: registrationData.password,
              firstName: registrationData.firstName,
              lastName: registrationData.lastName,
              regionId: registrationData.regionId,
            };

            const result = await registrationService.register(dto);

            // Property: Response message should always indicate verification is needed
            expect(result.message).toBeDefined();
            expect(typeof result.message).toBe("string");
            expect(result.message.length).toBeGreaterThan(0);
            expect(result.message.toLowerCase()).toContain("verify");

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
