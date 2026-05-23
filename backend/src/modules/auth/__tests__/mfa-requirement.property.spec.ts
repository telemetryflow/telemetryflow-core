/**
 * Property-Based Tests for Authentication - MFA Requirement
 *
 * Feature: frontend-backend-auth-integration
 * Property 21: MFA required for enabled users
 * Validates: Requirements 7.4
 *
 * Tests that for any user with MFA enabled, login requires a valid TOTP code
 * after password verification.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "../auth.service";
import { MfaService } from "../services/mfa.service";
import { DeviceService } from "../services/device.service";
import { SessionService } from "../services/session.service";
import { EmailService } from "../services/email.service";
import { TokenService } from "../services/token.service";
import { SuspiciousActivityService } from "../services/suspicious-activity.service";
import { SecurityLogService } from "../services/security-log.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { RoleEntity } from "../../iam/infrastructure/persistence/entities/RoleEntity";
import { UserRoleEntity } from "../../iam/infrastructure/persistence/entities/UserRole.entity";
import { UserPermissionEntity } from "../../iam/infrastructure/persistence/entities/UserPermission.entity";
import { PermissionEntity } from "../../iam/infrastructure/persistence/entities/PermissionEntity";
import * as argon2 from "argon2";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 21: MFA required for enabled users", () => {
    let authService: AuthService;
    let mfaService: MfaService;
    let userRepository: Repository<UserEntity>;
    let deviceService: DeviceService;
    let securityLogService: SecurityLogService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          MfaService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, any> = {
                  JWT_SECRET: "test-secret",
                  JWT_EXPIRES_IN: "15m",
                  APP_NAME: "TelemetryFlow",
                };
                return config[key];
              }),
            },
          },
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn(() => "mock-jwt-token"),
              verify: jest.fn(),
              decode: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(UserEntity),
            useValue: {
              findOne: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(RoleEntity),
            useValue: {
              createQueryBuilder: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(UserRoleEntity),
            useValue: {
              find: jest.fn(() => []),
            },
          },
          {
            provide: getRepositoryToken(UserPermissionEntity),
            useValue: {
              find: jest.fn(() => []),
            },
          },
          {
            provide: getRepositoryToken(PermissionEntity),
            useValue: {
              createQueryBuilder: jest.fn(),
            },
          },
          {
            provide: DeviceService,
            useValue: {
              extractDeviceInfo: jest.fn(() => ({
                fingerprint: "test-fingerprint",
                browser: "Chrome",
                os: "Windows",
                ipAddress: "127.0.0.1",
              })),
              getOrCreateDevice: jest.fn(() => ({
                id: "device-id",
                name: "Test Device",
                deviceType: "desktop",
                browser: "Chrome",
                os: "Windows",
              })),
              isKnownDevice: jest.fn(() => true),
            },
          },
          {
            provide: SessionService,
            useValue: {
              createSession: jest.fn(() => ({ id: "session-id" })),
            },
          },
          {
            provide: EmailService,
            useValue: {
              sendLoginNotification: jest.fn(),
            },
          },
          {
            provide: TokenService,
            useValue: {
              generateSessionTokens: jest.fn(() => ({
                accessToken: "access-token",
                refreshToken: "refresh-token",
                expiresIn: 900,
              })),
            },
          },
          {
            provide: SuspiciousActivityService,
            useValue: {
              detectSuspiciousActivity: jest.fn(() => ({
                isSuspicious: false,
                reasons: [],
                riskScore: 0,
                requiresVerification: false,
              })),
            },
          },
          {
            provide: SecurityLogService,
            useValue: {
              logLoginSuccess: jest.fn(),
              logLoginFailure: jest.fn(),
              logMFAFailure: jest.fn(),
              isBlacklisted: jest.fn(() => false),
            },
          },
        ],
      }).compile();

      authService = module.get<AuthService>(AuthService);
      mfaService = module.get<MfaService>(MfaService);
      userRepository = module.get<Repository<UserEntity>>(
        getRepositoryToken(UserEntity),
      );
      deviceService = module.get<DeviceService>(DeviceService);
      securityLogService = module.get<SecurityLogService>(SecurityLogService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should require MFA verification for users with MFA enabled", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ minLength: 20, maxLength: 32 }),
          async (userId, email, password, mfaSecret) => {
            // Hash password
            const hashedPassword = await argon2.hash(password);

            // Mock user with MFA enabled
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              password: hashedPassword,
              mfa_enabled: true,
              mfa_secret: mfaSecret,
              isActive: true,
              lockedUntil: null,
              failedLoginAttempts: 0,
              mfa_failure_count: 0,
              mfa_locked_until: null,
              firstName: "Test",
              lastName: "User",
              tenant_id: "tenant-id",
              organization_id: "org-id",
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);
            jest
              .spyOn(userRepository, "save")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock request object
            const mockRequest: any = {
              ip: "127.0.0.1",
              socket: { remoteAddress: "127.0.0.1" },
              headers: { "user-agent": "test-agent" },
            };

            // Property: Login should return MFA required response
            const result = await authService.login(
              { email, password },
              mockRequest,
            );

            // Verify MFA is required
            expect(result).toHaveProperty("mfaRequired", true);
            expect(result).toHaveProperty("mfaToken");
            expect(result).toHaveProperty("expiresIn", 300); // 5 minutes

            // Verify MFA token is valid
            const mfaToken = (result as any).mfaToken;
            expect(typeof mfaToken).toBe("string");
            expect(mfaToken.length).toBeGreaterThan(0);

            // Verify MFA session can be validated
            const session = mfaService.validateMfaSession(mfaToken);
            expect(session).not.toBeNull();
            expect(session?.userId).toBe(userId);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000); // 30 second timeout for property-based test

    it("should not require MFA for users without MFA enabled", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          async (userId, email, password) => {
            // Hash password
            const hashedPassword = await argon2.hash(password);

            // Mock user without MFA enabled
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              password: hashedPassword,
              mfa_enabled: false,
              mfa_secret: null,
              isActive: true,
              lockedUntil: null,
              failedLoginAttempts: 0,
              firstName: "Test",
              lastName: "User",
              tenant_id: "tenant-id",
              organization_id: "org-id",
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);
            jest
              .spyOn(userRepository, "save")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock request object
            const mockRequest: any = {
              ip: "127.0.0.1",
              socket: { remoteAddress: "127.0.0.1" },
              headers: { "user-agent": "test-agent" },
            };

            // Property: Login should return tokens directly (no MFA required)
            const result = await authService.login(
              { email, password },
              mockRequest,
            );

            // Verify tokens are returned
            expect(result).toHaveProperty("accessToken");
            expect(result).toHaveProperty("refreshToken");
            expect(result).toHaveProperty("user");
            expect(result).not.toHaveProperty("mfaRequired");
          },
        ),
        { numRuns: 50 },
      );
    }, 30000); // 30 second timeout for property-based test

    it("should reject login if MFA is locked", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ minLength: 20, maxLength: 32 }),
          async (userId, email, password, mfaSecret) => {
            // Hash password
            const hashedPassword = await argon2.hash(password);

            // Mock user with MFA enabled and locked
            const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email: email,
              password: hashedPassword,
              mfa_enabled: true,
              mfa_secret: mfaSecret,
              mfa_failure_count: 5,
              mfa_locked_until: lockedUntil,
              isActive: true,
              lockedUntil: null,
              failedLoginAttempts: 0,
              firstName: "Test",
              lastName: "User",
              tenant_id: "tenant-id",
              organization_id: "org-id",
            };

            jest
              .spyOn(userRepository, "findOne")
              .mockResolvedValue(mockUser as UserEntity);
            jest
              .spyOn(userRepository, "save")
              .mockResolvedValue(mockUser as UserEntity);

            // Mock request object
            const mockRequest: any = {
              ip: "127.0.0.1",
              socket: { remoteAddress: "127.0.0.1" },
              headers: { "user-agent": "test-agent" },
            };

            // Property: Login should reject with MFA locked error
            await expect(
              authService.login({ email, password }, mockRequest),
            ).rejects.toThrow(/MFA verification locked/);

            // Verify security log was called
            expect(securityLogService.logLoginFailure).toHaveBeenCalled();
          },
        ),
        { numRuns: 50 },
      );
    }, 30000); // 30 second timeout for property-based test
  });
});
