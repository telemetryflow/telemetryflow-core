/**
 * Property-Based Tests for Authentication - Deactivated Account Login Prevention
 *
 * Feature: frontend-backend-auth-integration
 * Property 56: Deactivated account login prevention
 * Validates: Requirements 14.5, 14.8
 *
 * Tests that for any login attempt by a deactivated administrator, the system
 * should reject the attempt with an "account_deactivated" error.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { RoleEntity } from "../../iam/infrastructure/persistence/entities/RoleEntity";
import { UserRoleEntity } from "../../iam/infrastructure/persistence/entities/UserRole.entity";
import { UserPermissionEntity } from "../../iam/infrastructure/persistence/entities/UserPermission.entity";
import { PermissionEntity } from "../../iam/infrastructure/persistence/entities/PermissionEntity";
import { DeviceService } from "../services/device.service";
import { SessionService } from "../services/session.service";
import { EmailService } from "../services/email.service";
import { TokenService } from "../services/token.service";
import { SuspiciousActivityService } from "../services/suspicious-activity.service";
import { SecurityLogService } from "../services/security-log.service";
import { MfaService } from "../services/mfa.service";
import { LoginDto } from "../dto/login.dto";
import * as argon2 from "argon2";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 56: Deactivated account login prevention", () => {
    let authService: AuthService;
    let userRepository: Repository<UserEntity>;
    let securityLogService: SecurityLogService;

    beforeEach(async () => {
      const mockUserRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
      };

      const mockRoleRepository = {
        createQueryBuilder: jest.fn(),
      };

      const mockUserRoleRepository = {
        find: jest.fn().mockResolvedValue([]),
      };

      const mockUserPermissionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };

      const mockPermissionRepository = {
        createQueryBuilder: jest.fn(),
      };

      const mockJwtService = {
        sign: jest.fn().mockReturnValue("mock-jwt-token"),
      };

      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === "JWT_EXPIRES_IN") return "24h";
          return null;
        }),
      };

      const mockDeviceService = {
        extractDeviceInfo: jest.fn(),
        isKnownDevice: jest.fn(),
        getOrCreateDevice: jest.fn(),
      };

      const mockSessionService = {
        createSession: jest.fn(),
      };

      const mockEmailService = {
        sendLoginNotification: jest.fn(),
      };

      const mockTokenService = {
        generateAccessToken: jest.fn(),
        generateRefreshToken: jest.fn(),
      };

      const mockSuspiciousActivityService = {
        detectSuspiciousActivity: jest.fn().mockResolvedValue({
          isSuspicious: false,
          reasons: [],
          riskScore: 0,
          requiresVerification: false,
        }),
      };

      const mockSecurityLogService = {
        logLoginFailure: jest.fn().mockResolvedValue(undefined),
        logLoginSuccess: jest.fn().mockResolvedValue(undefined),
        isBlacklisted: jest.fn().mockReturnValue(false),
      };

      const mockMfaService = {
        isMfaLocked: jest.fn().mockResolvedValue(false),
        createMfaSession: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: getRepositoryToken(UserEntity),
            useValue: mockUserRepository,
          },
          {
            provide: getRepositoryToken(RoleEntity),
            useValue: mockRoleRepository,
          },
          {
            provide: getRepositoryToken(UserRoleEntity),
            useValue: mockUserRoleRepository,
          },
          {
            provide: getRepositoryToken(UserPermissionEntity),
            useValue: mockUserPermissionRepository,
          },
          {
            provide: getRepositoryToken(PermissionEntity),
            useValue: mockPermissionRepository,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: DeviceService,
            useValue: mockDeviceService,
          },
          {
            provide: SessionService,
            useValue: mockSessionService,
          },
          {
            provide: EmailService,
            useValue: mockEmailService,
          },
          {
            provide: TokenService,
            useValue: mockTokenService,
          },
          {
            provide: SuspiciousActivityService,
            useValue: mockSuspiciousActivityService,
          },
          {
            provide: SecurityLogService,
            useValue: mockSecurityLogService,
          },
          {
            provide: MfaService,
            useValue: mockMfaService,
          },
        ],
      }).compile();

      authService = module.get<AuthService>(AuthService);
      userRepository = module.get<Repository<UserEntity>>(
        getRepositoryToken(UserEntity),
      );
      securityLogService = module.get<SecurityLogService>(SecurityLogService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    // Generator for valid email addresses
    const emailArb = fc
      .tuple(
        fc.stringMatching(/^[a-z0-9]{3,10}$/),
        fc.constantFrom("example.com", "test.com", "admin.org"),
      )
      .map(([local, domain]) => `${local}@${domain}`);

    // Generator for valid passwords
    const passwordArb = fc.string({ minLength: 8, maxLength: 20 });

    // Generator for ticket references
    const ticketRefArb = fc.oneof(
      fc.string({ minLength: 5, maxLength: 20 }).map((s) => `TICKET-${s}`),
      fc.integer({ min: 1000, max: 9999 }).map((n) => `ADMIN-DEACT-${n}`),
      fc.uuid().map((id) => `REQ-${id.substring(0, 8)}`),
    );

    // Generator for mock request objects
    const requestArb = fc.record({
      ip: fc.ipV4(),
      socket: fc.record({
        remoteAddress: fc.ipV4(),
      }),
      headers: fc.record({
        "user-agent": fc.constantFrom(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          "Mozilla/5.0 (X11; Linux x86_64)",
        ),
      }),
    });

    it("should reject login attempts from deactivated administrators with account_deactivated error", async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArb,
          passwordArb,
          fc.uuid(), // superAdminId
          ticketRefArb,
          requestArb,
          async (email, password, superAdminId, ticketRef, request) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Create a deactivated administrator user
            const hashedPassword = await argon2.hash(password);
            const deactivatedUser: Partial<UserEntity> = {
              id: fc.sample(fc.uuid(), 1)[0],
              email,
              password: hashedPassword,
              isActive: false, // Deactivated
              failedLoginAttempts: 0,
              lockedUntil: null,
              mfa_enabled: false,
              deletedAt: null,
            };

            // Mock: User exists but is deactivated
            (userRepository.findOne as jest.Mock).mockResolvedValue(
              deactivatedUser,
            );

            // Prepare login DTO
            const loginDto: LoginDto = {
              email,
              password,
            };

            // Property: Login attempt should be rejected with correct error
            let thrownError: any;
            try {
              await authService.login(loginDto, request as any);
            } catch (error) {
              thrownError = error;
            }

            // Property: Error should be UnauthorizedException
            expect(thrownError).toBeInstanceOf(UnauthorizedException);
            expect(thrownError.message).toBe("Account is deactivated");

            // Property: Failed login should be logged with deactivation reason
            expect(securityLogService.logLoginFailure).toHaveBeenCalledTimes(1);
            expect(securityLogService.logLoginFailure).toHaveBeenCalledWith(
              deactivatedUser.id,
              expect.any(String), // IP address
              expect.any(String), // User agent
              "Account is deactivated",
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should reject login before password verification for deactivated accounts", async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArb,
          passwordArb,
          fc.uuid(), // superAdminId
          ticketRefArb,
          requestArb,
          async (email, password, superAdminId, ticketRef, request) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Create a deactivated administrator user with CORRECT password
            const hashedPassword = await argon2.hash(password);
            const deactivatedUser: Partial<UserEntity> = {
              id: fc.sample(fc.uuid(), 1)[0],
              email,
              password: hashedPassword,
              isActive: false, // Deactivated
              failedLoginAttempts: 0,
              lockedUntil: null,
              mfa_enabled: false,
              deletedAt: null,
            };

            // Mock: User exists but is deactivated
            (userRepository.findOne as jest.Mock).mockResolvedValue(
              deactivatedUser,
            );

            // Prepare login DTO with CORRECT password
            const loginDto: LoginDto = {
              email,
              password,
            };

            // Property: Login should fail even with correct password
            await expect(
              authService.login(loginDto, request as any),
            ).rejects.toThrow(UnauthorizedException);

            // Property: User repository save should NOT be called
            // (no failed login attempt tracking for deactivated accounts)
            expect(userRepository.save).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should check account active status after lockout check but before password verification", async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArb,
          passwordArb,
          fc.uuid(), // superAdminId
          ticketRefArb,
          requestArb,
          async (email, password, superAdminId, ticketRef, request) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Track the order of checks
            const checkOrder: string[] = [];

            // Create a deactivated administrator user
            const hashedPassword = await argon2.hash(password);
            const deactivatedUser: Partial<UserEntity> = {
              id: fc.sample(fc.uuid(), 1)[0],
              email,
              password: hashedPassword,
              isActive: false, // Deactivated
              failedLoginAttempts: 0,
              lockedUntil: null, // Not locked
              mfa_enabled: false,
              deletedAt: null,
            };

            // Mock: User exists but is deactivated
            (userRepository.findOne as jest.Mock).mockImplementation(() => {
              checkOrder.push("findUser");
              return Promise.resolve(deactivatedUser);
            });

            // Mock: Security log to track when it's called
            (securityLogService.logLoginFailure as jest.Mock).mockImplementation(
              (userId, ip, ua, reason) => {
                if (reason === "Account is deactivated") {
                  checkOrder.push("logDeactivated");
                }
                return Promise.resolve();
              },
            );

            // Prepare login DTO
            const loginDto: LoginDto = {
              email,
              password,
            };

            // Property: Login should fail
            await expect(
              authService.login(loginDto, request as any),
            ).rejects.toThrow(UnauthorizedException);

            // Property: Check order should be: findUser -> logDeactivated
            expect(checkOrder).toEqual(["findUser", "logDeactivated"]);

            // Property: Password verification should not occur
            // (save should not be called for failed attempts)
            expect(userRepository.save).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should reject deactivated accounts regardless of other account states", async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArb,
          passwordArb,
          fc.uuid(), // superAdminId
          ticketRefArb,
          requestArb,
          fc.boolean(), // mfaEnabled
          fc.boolean(), // emailVerified
          fc.nat({ max: 10 }), // failedLoginAttempts
          async (
            email,
            password,
            superAdminId,
            ticketRef,
            request,
            mfaEnabled,
            emailVerified,
            failedAttempts,
          ) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Create a deactivated administrator user with various states
            const hashedPassword = await argon2.hash(password);
            const deactivatedUser: Partial<UserEntity> = {
              id: fc.sample(fc.uuid(), 1)[0],
              email,
              password: hashedPassword,
              isActive: false, // Deactivated - this should be the deciding factor
              failedLoginAttempts: failedAttempts,
              lockedUntil: null,
              mfa_enabled: mfaEnabled,
              emailVerified: emailVerified,
              deletedAt: null,
            };

            // Mock: User exists but is deactivated
            (userRepository.findOne as jest.Mock).mockResolvedValue(
              deactivatedUser,
            );

            // Prepare login DTO
            const loginDto: LoginDto = {
              email,
              password,
            };

            // Property: Login should always fail for deactivated accounts
            // regardless of MFA status, email verification, or failed attempts
            await expect(
              authService.login(loginDto, request as any),
            ).rejects.toThrow(UnauthorizedException);

            // Property: Error should specifically mention deactivation
            try {
              await authService.login(loginDto, request as any);
            } catch (error) {
              expect(error.message).toBe("Account is deactivated");
            }

            return true;
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should log deactivation details when rejecting login attempts", async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArb,
          passwordArb,
          fc.uuid(), // superAdminId
          ticketRefArb,
          requestArb,
          async (email, password, superAdminId, ticketRef, request) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Create a deactivated administrator user
            const hashedPassword = await argon2.hash(password);
            const userId = fc.sample(fc.uuid(), 1)[0];
            const deactivatedUser: Partial<UserEntity> = {
              id: userId,
              email,
              password: hashedPassword,
              isActive: false,
              failedLoginAttempts: 0,
              lockedUntil: null,
              mfa_enabled: false,
              deletedAt: null,
            };

            // Mock: User exists but is deactivated
            (userRepository.findOne as jest.Mock).mockResolvedValue(
              deactivatedUser,
            );

            // Prepare login DTO
            const loginDto: LoginDto = {
              email,
              password,
            };

            // Property: Login should fail
            await expect(
              authService.login(loginDto, request as any),
            ).rejects.toThrow(UnauthorizedException);

            // Property: Security log should be called with correct parameters
            expect(securityLogService.logLoginFailure).toHaveBeenCalledWith(
              userId,
              expect.any(String), // IP address
              expect.any(String), // User agent
              "Account is deactivated",
            );

            // Property: Log should be called exactly once
            expect(securityLogService.logLoginFailure).toHaveBeenCalledTimes(1);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should not increment failed login attempts for deactivated accounts", async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArb,
          passwordArb,
          fc.uuid(), // superAdminId
          ticketRefArb,
          requestArb,
          fc.nat({ max: 5 }), // initial failed attempts
          async (
            email,
            password,
            superAdminId,
            ticketRef,
            request,
            initialFailedAttempts,
          ) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Create a deactivated administrator user
            const hashedPassword = await argon2.hash(password);
            const deactivatedUser: Partial<UserEntity> = {
              id: fc.sample(fc.uuid(), 1)[0],
              email,
              password: hashedPassword,
              isActive: false,
              failedLoginAttempts: initialFailedAttempts,
              lockedUntil: null,
              mfa_enabled: false,
              deletedAt: null,
            };

            // Mock: User exists but is deactivated
            (userRepository.findOne as jest.Mock).mockResolvedValue(
              deactivatedUser,
            );

            // Prepare login DTO
            const loginDto: LoginDto = {
              email,
              password,
            };

            // Property: Login should fail
            await expect(
              authService.login(loginDto, request as any),
            ).rejects.toThrow(UnauthorizedException);

            // Property: User should not be saved (no failed attempt tracking)
            expect(userRepository.save).not.toHaveBeenCalled();

            // Property: Failed login attempts should not be incremented
            // (verified by save not being called)

            return true;
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);
  });
});
