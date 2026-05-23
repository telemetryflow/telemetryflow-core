/**
 * Property-Based Tests for Account Lockout Mechanism
 *
 * Feature: frontend-backend-auth-integration
 * Property 32: Account lockout on failed attempts
 * Property 34: Failed attempt counter reset
 * Validates: Requirements 10.1, 10.2, 10.5
 *
 * Tests that:
 * - Account is locked after 5 failed login attempts within 15 minutes
 * - Lockout duration is 30 minutes
 * - Lockout notification email is sent
 * - Failed attempt counter is reset on successful login
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";
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
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { SecurityLogService } from "../services/security-log.service";
import { SuspiciousActivityService } from "../services/suspicious-activity.service";
import { MfaService } from "../services/mfa.service";
import { DeviceEntity } from "../infrastructure/persistence/entities/Device.entity";
import { SessionEntity } from "../infrastructure/persistence/entities/Session.entity";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 32: Account lockout on failed attempts", () => {
    let authService: AuthService;
    let userRepository: Repository<UserEntity>;
    let emailService: EmailService;
    let mockSendAccountLockoutNotification: jest.Mock;

    beforeEach(async () => {
      mockSendAccountLockoutNotification = jest.fn(() => Promise.resolve());

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn((payload) => `mock.token.${payload.sub}`),
              verify: jest.fn(),
              decode: jest.fn(),
            },
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, any> = {
                  JWT_SECRET: "test-secret",
                  JWT_REFRESH_SECRET: "test-refresh-secret",
                  JWT_ACCESS_TOKEN_EXPIRY: "15m",
                  JWT_REFRESH_TOKEN_EXPIRY: "7d",
                  JWT_EXPIRES_IN: "15m",
                };
                return config[key];
              }),
            },
          },
          {
            provide: DeviceService,
            useValue: {
              extractDeviceInfo: jest.fn(() => ({
                fingerprint: "test-fingerprint",
                browser: "test-browser",
                os: "test-os",
                ipAddress: "127.0.0.1",
              })),
              isKnownDevice: jest.fn(() => Promise.resolve(true)),
              getOrCreateDevice: jest.fn(() =>
                Promise.resolve({
                  id: "device-id",
                  name: "Test Device",
                  browser: "test-browser",
                  os: "test-os",
                }),
              ),
            },
          },
          {
            provide: SessionService,
            useValue: {
              createSession: jest.fn(() =>
                Promise.resolve({
                  id: "session-id",
                }),
              ),
            },
          },
          {
            provide: EmailService,
            useValue: {
              sendLoginNotification: jest.fn(() => Promise.resolve()),
              sendAccountLockoutNotification:
                mockSendAccountLockoutNotification,
            },
          },
          {
            provide: TokenService,
            useValue: {
              generateAccessToken: jest.fn(() => "mock-access-token"),
              generateRefreshToken: jest.fn(() => "mock-refresh-token"),
            },
          },
          {
            provide: getRepositoryToken(UserEntity),
            useValue: {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(RoleEntity),
            useValue: {
              findOne: jest.fn(),
              createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn(() => Promise.resolve([])),
              })),
            },
          },
          {
            provide: getRepositoryToken(UserRoleEntity),
            useValue: {
              find: jest.fn(() => Promise.resolve([])),
            },
          },
          {
            provide: getRepositoryToken(UserPermissionEntity),
            useValue: {
              find: jest.fn(() => Promise.resolve([])),
            },
          },
          {
            provide: getRepositoryToken(PermissionEntity),
            useValue: {
              createQueryBuilder: jest.fn(() => ({
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn(() => Promise.resolve([])),
              })),
            },
          },
          {
            provide: SecurityLogService,
            useValue: {
              logEvent: jest.fn(() => Promise.resolve()),
              logLoginSuccess: jest.fn(() => Promise.resolve()),
              logLoginFailure: jest.fn(() => Promise.resolve()),
              logAccountLockout: jest.fn(() => Promise.resolve()),
              isBlacklisted: jest.fn(() => false),
              getBlacklistEntry: jest.fn(() => null),
              addToBlacklist: jest.fn(() => Promise.resolve()),
              removeFromBlacklist: jest.fn(() => false),
            },
          },
          {
            provide: SuspiciousActivityService,
            useValue: {
              detectSuspiciousActivity: jest.fn(() =>
                Promise.resolve({
                  isSuspicious: false,
                  reasons: [],
                  riskScore: 0,
                }),
              ),
              flagAccount: jest.fn(() => Promise.resolve()),
            },
          },
          {
            provide: MfaService,
            useValue: {
              verifyMfaCode: jest.fn(() => Promise.resolve(true)),
              isMfaEnabled: jest.fn(() => Promise.resolve(false)),
              getMfaStatus: jest.fn(() => Promise.resolve({ enabled: false })),
            },
          },
          {
            provide: getRepositoryToken(DeviceEntity),
            useValue: {
              findOne: jest.fn(),
              save: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(SessionEntity),
            useValue: {
              findOne: jest.fn(),
              save: jest.fn(),
            },
          },
        ],
      }).compile();

      authService = module.get<AuthService>(AuthService);
      userRepository = module.get<Repository<UserEntity>>(
        getRepositoryToken(UserEntity),
      );
      emailService = module.get<EmailService>(EmailService);
    });

    /**
     * **Validates: Requirements 10.1**
     * Test that account is locked after 5 failed login attempts
     */
    it("should lock account after 5 failed login attempts within 15 minutes", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 50 }),
          fc.string({ minLength: 8, maxLength: 50 }),
          async (email, correctPassword, wrongPassword) => {
            // Ensure passwords are different
            fc.pre(correctPassword !== wrongPassword);

            // Clear mocks
            jest.clearAllMocks();

            // Hash the correct password
            const hashedPassword = await argon2.hash(correctPassword);

            // Create a mock user
            const mockUser: Partial<UserEntity> = {
              id: "user-id",
              email,
              password: hashedPassword,
              isActive: true,
              lockedUntil: undefined,
              failedLoginAttempts: 0,
              lastFailedLoginAt: undefined,
              deletedAt: undefined,
            };

            // Mock repository to return the user
            (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Mock save to update the user object
            (userRepository.save as jest.Mock).mockImplementation(
              async (user: UserEntity) => {
                Object.assign(mockUser, user);
                return mockUser;
              },
            );

            const mockRequest = {
              headers: {},
              ip: "127.0.0.1",
            } as any;

            // Attempt 5 failed logins
            for (let i = 0; i < 5; i++) {
              try {
                await authService.login(
                  { email, password: wrongPassword },
                  mockRequest,
                );
              } catch (error) {
                // Expected to fail
              }
            }

            // Property: After 5 failed attempts, account should be locked
            expect(mockUser.failedLoginAttempts).toBe(5);
            expect(mockUser.lockedUntil).toBeDefined();
            expect(mockUser.lockedUntil).not.toBeNull();

            // Property: Lockout duration should be 30 minutes (Requirement 10.1)
            const lockoutDuration =
              mockUser.lockedUntil!.getTime() -
              mockUser.lastFailedLoginAt!.getTime();
            const expectedDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
            const tolerance = 1000; // 1 second tolerance

            expect(Math.abs(lockoutDuration - expectedDuration)).toBeLessThan(
              tolerance,
            );

            // Property: Lockout notification email should be sent (Requirement 10.2)
            expect(mockSendAccountLockoutNotification).toHaveBeenCalledTimes(1);
            expect(mockSendAccountLockoutNotification).toHaveBeenCalledWith(
              email,
              mockUser.lockedUntil,
            );

            return true;
          },
        ),
        { numRuns: 10 }, // Reduced runs due to argon2 hashing overhead
      );
    }, 30000); // 30 second timeout

    /**
     * **Validates: Requirements 10.1**
     * Test that locked account rejects login attempts
     */
    it("should reject login attempts for locked accounts", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 50 }),
          async (email, password) => {
            // Clear mocks
            jest.clearAllMocks();

            // Hash the password
            const hashedPassword = await argon2.hash(password);

            // Create a locked user (locked for 30 minutes from now)
            const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
            const mockUser: Partial<UserEntity> = {
              id: "user-id",
              email,
              password: hashedPassword,
              isActive: true,
              lockedUntil,
              failedLoginAttempts: 5,
              deletedAt: undefined,
            };

            // Mock repository to return the locked user
            (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

            const mockRequest = {
              headers: {},
              ip: "127.0.0.1",
            } as any;

            // Property: Login attempt should be rejected with UnauthorizedException
            await expect(
              authService.login({ email, password }, mockRequest),
            ).rejects.toThrow(UnauthorizedException);

            // Property: Error message should indicate account is locked
            await expect(
              authService.login({ email, password }, mockRequest),
            ).rejects.toThrow(/Account is locked/);

            return true;
          },
        ),
        { numRuns: 10 },
      );
    }, 15000);

    /**
     * **Validates: Requirements 10.1**
     * Test that lockout expires after 30 minutes
     */
    it("should allow login after lockout period expires", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 50 }),
          async (email, password) => {
            // Clear mocks
            jest.clearAllMocks();

            // Hash the password
            const hashedPassword = await argon2.hash(password);

            // Create a user with expired lockout (locked until 1 minute ago)
            const lockedUntil = new Date(Date.now() - 60 * 1000);
            const mockUser: Partial<UserEntity> = {
              id: "user-id",
              email,
              password: hashedPassword,
              isActive: true,
              lockedUntil,
              failedLoginAttempts: 5,
              lastLoginAt: undefined,
              loginCount: 0,
              deletedAt: undefined,
            };

            // Mock repository to return the user
            (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Mock save to update the user object
            (userRepository.save as jest.Mock).mockImplementation(
              async (user: UserEntity) => {
                Object.assign(mockUser, user);
                return mockUser;
              },
            );

            const mockRequest = {
              headers: {},
              ip: "127.0.0.1",
            } as any;

            // Property: Login should succeed after lockout expires
            const result = await authService.login(
              { email, password },
              mockRequest,
            );

            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();

            // Property: Failed attempts should be reset
            expect(mockUser.failedLoginAttempts).toBe(0);
            expect(mockUser.lockedUntil).toBeNull();

            return true;
          },
        ),
        { numRuns: 10 },
      );
    }, 20000);
  });

  describe("Property 34: Failed attempt counter reset", () => {
    let authService: AuthService;
    let userRepository: Repository<UserEntity>;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn((payload) => `mock.token.${payload.sub}`),
              verify: jest.fn(),
              decode: jest.fn(),
            },
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, any> = {
                  JWT_SECRET: "test-secret",
                  JWT_REFRESH_SECRET: "test-refresh-secret",
                  JWT_ACCESS_TOKEN_EXPIRY: "15m",
                  JWT_REFRESH_TOKEN_EXPIRY: "7d",
                  JWT_EXPIRES_IN: "15m",
                };
                return config[key];
              }),
            },
          },
          {
            provide: DeviceService,
            useValue: {
              extractDeviceInfo: jest.fn(() => ({
                fingerprint: "test-fingerprint",
                browser: "test-browser",
                os: "test-os",
                ipAddress: "127.0.0.1",
              })),
              isKnownDevice: jest.fn(() => Promise.resolve(true)),
              getOrCreateDevice: jest.fn(() =>
                Promise.resolve({
                  id: "device-id",
                  name: "Test Device",
                  browser: "test-browser",
                  os: "test-os",
                }),
              ),
            },
          },
          {
            provide: SessionService,
            useValue: {
              createSession: jest.fn(() =>
                Promise.resolve({
                  id: "session-id",
                }),
              ),
            },
          },
          {
            provide: EmailService,
            useValue: {
              sendLoginNotification: jest.fn(() => Promise.resolve()),
              sendAccountLockoutNotification: jest.fn(() => Promise.resolve()),
            },
          },
          {
            provide: TokenService,
            useValue: {
              generateAccessToken: jest.fn(() => "mock-access-token"),
              generateRefreshToken: jest.fn(() => "mock-refresh-token"),
            },
          },
          {
            provide: getRepositoryToken(UserEntity),
            useValue: {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(RoleEntity),
            useValue: {
              findOne: jest.fn(),
              createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn(() => Promise.resolve([])),
              })),
            },
          },
          {
            provide: getRepositoryToken(UserRoleEntity),
            useValue: {
              find: jest.fn(() => Promise.resolve([])),
            },
          },
          {
            provide: getRepositoryToken(UserPermissionEntity),
            useValue: {
              find: jest.fn(() => Promise.resolve([])),
            },
          },
          {
            provide: getRepositoryToken(PermissionEntity),
            useValue: {
              createQueryBuilder: jest.fn(() => ({
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn(() => Promise.resolve([])),
              })),
            },
          },
          {
            provide: SecurityLogService,
            useValue: {
              logEvent: jest.fn(() => Promise.resolve()),
              logLoginSuccess: jest.fn(() => Promise.resolve()),
              logLoginFailure: jest.fn(() => Promise.resolve()),
              logAccountLockout: jest.fn(() => Promise.resolve()),
              isBlacklisted: jest.fn(() => false),
              getBlacklistEntry: jest.fn(() => null),
              addToBlacklist: jest.fn(() => Promise.resolve()),
              removeFromBlacklist: jest.fn(() => false),
            },
          },
          {
            provide: SuspiciousActivityService,
            useValue: {
              detectSuspiciousActivity: jest.fn(() =>
                Promise.resolve({
                  isSuspicious: false,
                  reasons: [],
                  riskScore: 0,
                }),
              ),
              flagAccount: jest.fn(() => Promise.resolve()),
            },
          },
          {
            provide: MfaService,
            useValue: {
              verifyMfaCode: jest.fn(() => Promise.resolve(true)),
              isMfaEnabled: jest.fn(() => Promise.resolve(false)),
              getMfaStatus: jest.fn(() => Promise.resolve({ enabled: false })),
            },
          },
          {
            provide: getRepositoryToken(DeviceEntity),
            useValue: {
              findOne: jest.fn(),
              save: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(SessionEntity),
            useValue: {
              findOne: jest.fn(),
              save: jest.fn(),
            },
          },
        ],
      }).compile();

      authService = module.get<AuthService>(AuthService);
      userRepository = module.get<Repository<UserEntity>>(
        getRepositoryToken(UserEntity),
      );
    });

    /**
     * **Validates: Requirements 10.5**
     * Test that failed attempt counter is reset on successful login
     */
    it("should reset failed attempt counter on successful login", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 50 }),
          fc.integer({ min: 1, max: 4 }), // Failed attempts less than lockout threshold
          async (email, password, failedAttempts) => {
            // Clear mocks
            jest.clearAllMocks();

            // Hash the password
            const hashedPassword = await argon2.hash(password);

            // Create a user with some failed attempts
            const mockUser: Partial<UserEntity> = {
              id: "user-id",
              email,
              password: hashedPassword,
              isActive: true,
              lockedUntil: undefined,
              failedLoginAttempts: failedAttempts,
              lastFailedLoginAt: new Date(),
              lastLoginAt: undefined,
              loginCount: 0,
              deletedAt: undefined,
            };

            // Mock repository to return the user
            (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Mock save to update the user object
            (userRepository.save as jest.Mock).mockImplementation(
              async (user: UserEntity) => {
                Object.assign(mockUser, user);
                return mockUser;
              },
            );

            const mockRequest = {
              headers: {},
              ip: "127.0.0.1",
            } as any;

            // Property: Successful login should reset failed attempts counter (Requirement 10.5)
            const result = await authService.login(
              { email, password },
              mockRequest,
            );

            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();

            // Property: Failed attempts should be reset to 0
            expect(mockUser.failedLoginAttempts).toBe(0);

            // Property: lockedUntil should be null
            expect(mockUser.lockedUntil).toBeNull();

            // Property: lastLoginAt should be updated
            expect(mockUser.lastLoginAt).toBeDefined();
            expect(mockUser.lastLoginAt).not.toBeNull();

            // Property: loginCount should be incremented
            expect(mockUser.loginCount).toBe(1);

            return true;
          },
        ),
        { numRuns: 10 },
      );
    }, 20000);

    /**
     * **Validates: Requirements 10.5**
     * Test that counter reset happens even with many prior failed attempts
     */
    it("should reset counter regardless of number of prior failed attempts", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          async (email, password, priorFailedAttempts) => {
            // Clear mocks
            jest.clearAllMocks();

            // Hash the password
            const hashedPassword = await argon2.hash(password);

            // Create a user with expired lockout and many failed attempts
            const mockUser: Partial<UserEntity> = {
              id: "user-id",
              email,
              password: hashedPassword,
              isActive: true,
              lockedUntil: new Date(Date.now() - 60 * 1000), // Expired lockout
              failedLoginAttempts: priorFailedAttempts,
              lastFailedLoginAt: new Date(),
              lastLoginAt: undefined,
              loginCount: 0,
              deletedAt: undefined,
            };

            // Mock repository to return the user
            (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Mock save to update the user object
            (userRepository.save as jest.Mock).mockImplementation(
              async (user: UserEntity) => {
                Object.assign(mockUser, user);
                return mockUser;
              },
            );

            const mockRequest = {
              headers: {},
              ip: "127.0.0.1",
            } as any;

            // Property: Successful login should reset counter regardless of prior attempts
            const result = await authService.login(
              { email, password },
              mockRequest,
            );

            expect(result).toBeDefined();
            expect(mockUser.failedLoginAttempts).toBe(0);
            expect(mockUser.lockedUntil).toBeNull();

            return true;
          },
        ),
        { numRuns: 10 },
      );
    }, 20000);
  });
});
