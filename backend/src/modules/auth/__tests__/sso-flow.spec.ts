/**
 * Unit Tests for SSO Login Flow
 *
 * Feature: frontend-backend-auth-integration
 * Task: 10.2 Implement SSO login flow
 * Requirements: 1.4, 1.5, 1.7
 *
 * Tests SSO login initiation, callback handling, user creation/linking,
 * session creation, and device tracking.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { CommandBus } from "@nestjs/cqrs";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";
import { SSOLoginHandler } from "../application/handlers/SSOLogin.handler";
import { SSOCallbackHandler } from "../application/handlers/SSOCallback.handler";
import { SSOLoginCommand } from "../application/commands/SSOLogin.command";
import { SSOCallbackCommand } from "../application/commands/SSOCallback.command";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { SessionService } from "../services/session.service";
import { TokenService } from "../services/token.service";
import { DeviceService } from "../services/device.service";
import { EmailService } from "../services/email.service";
import { SecurityLogService } from "../services/security-log.service";
import { SsoService } from "../../sso/sso.service";

describe("SSO Login Flow", () => {
  let ssoLoginHandler: SSOLoginHandler;
  let ssoCallbackHandler: SSOCallbackHandler;
  let configService: ConfigService;
  let userRepository: Repository<UserEntity>;
  let commandBus: CommandBus;
  let sessionService: SessionService;
  let tokenService: TokenService;
  let deviceService: DeviceService;
  let emailService: EmailService;
  let securityLogService: SecurityLogService;
  let ssoService: SsoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SSOLoginHandler,
        SSOCallbackHandler,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                DEFAULT_REGION_ID: "00000000-0000-0000-0000-000000000001",
              };
              return config[key];
            }),
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
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateSessionTokens: jest.fn(),
          },
        },
        {
          provide: DeviceService,
          useValue: {
            generateFingerprint: jest.fn(),
            getOrCreateDevice: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendLoginNotification: jest.fn(),
          },
        },
        {
          provide: SecurityLogService,
          useValue: {
            logLoginSuccess: jest.fn(),
          },
        },
        {
          provide: SsoService,
          useValue: {
            initiateAuth: jest.fn(),
            handleCallback: jest.fn(),
          },
        },
      ],
    }).compile();

    ssoLoginHandler = module.get<SSOLoginHandler>(SSOLoginHandler);
    ssoCallbackHandler = module.get<SSOCallbackHandler>(SSOCallbackHandler);
    configService = module.get<ConfigService>(ConfigService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    commandBus = module.get<CommandBus>(CommandBus);
    sessionService = module.get<SessionService>(SessionService);
    tokenService = module.get<TokenService>(TokenService);
    deviceService = module.get<DeviceService>(DeviceService);
    emailService = module.get<EmailService>(EmailService);
    securityLogService = module.get<SecurityLogService>(SecurityLogService);
    ssoService = module.get<SsoService>(SsoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("SSOLoginHandler", () => {
    it("should initiate SSO login successfully", async () => {
      const providerId = "sso-provider-123";
      const organizationId = "org-123";
      const redirectUrl = "https://app.example.com/dashboard";

      const command = new SSOLoginCommand(
        providerId,
        organizationId,
        redirectUrl,
      );

      // Mock SSO service response
      jest.spyOn(ssoService, "initiateAuth").mockResolvedValue({
        authorizationUrl: "https://sso.example.com/auth?SAMLRequest=...",
        state: "state-token-123",
      });

      const result = await ssoLoginHandler.execute(command);

      expect(result).toBeDefined();
      expect(result.authorizationUrl).toContain("https://sso.example.com/auth");
      expect(result.state).toBe("state-token-123");
      expect(ssoService.initiateAuth).toHaveBeenCalledWith(
        organizationId,
        providerId,
        redirectUrl,
      );
    });

    it("should reject SSO login when provider is not found", async () => {
      const command = new SSOLoginCommand("invalid-provider", "org-123");

      // Mock SSO service to throw error
      jest
        .spyOn(ssoService, "initiateAuth")
        .mockRejectedValue(new BadRequestException("SSO provider not found"));

      await expect(ssoLoginHandler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should reject SSO login when provider is disabled", async () => {
      const command = new SSOLoginCommand("disabled-provider", "org-123");

      // Mock SSO service to throw error
      jest
        .spyOn(ssoService, "initiateAuth")
        .mockRejectedValue(
          new BadRequestException("SSO provider is not enabled"),
        );

      await expect(ssoLoginHandler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(ssoLoginHandler.execute(command)).rejects.toThrow(
        "SSO provider is not enabled",
      );
    });

    it("should handle SSO service errors gracefully", async () => {
      const command = new SSOLoginCommand("provider-123", "org-123");

      // Mock SSO service to throw generic error
      jest
        .spyOn(ssoService, "initiateAuth")
        .mockRejectedValue(new Error("Network error"));

      await expect(ssoLoginHandler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(ssoLoginHandler.execute(command)).rejects.toThrow(
        "Failed to initiate SSO login",
      );
    });
  });

  describe("SSOCallbackHandler", () => {
    it("should handle SSO callback for existing user", async () => {
      const code = "auth-code-123";
      const state = "state-token-123";
      const ipAddress = "192.168.1.1";
      const userAgent = "Mozilla/5.0 Chrome";

      const command = new SSOCallbackCommand(code, state, ipAddress, userAgent);

      // Mock SSO service callback response
      jest.spyOn(ssoService, "handleCallback").mockResolvedValue({
        accessToken: "sso-access-token",
        refreshToken: "sso-refresh-token",
        expiresIn: 3600,
        tokenType: "Bearer",
        isNewUser: false,
        user: {
          id: "user-uuid-123",
          email: "user@example.com",
          firstName: "Test",
          lastName: "User",
          roles: [],
          permissions: [],
        },
      });

      // Mock existing user
      const existingUser = {
        id: "user-uuid-123",
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
        emailVerified: true,
        avatar: null,
        tenant_id: "tenant-123",
        organization_id: "org-123",
      } as unknown as UserEntity;

      jest.spyOn(userRepository, "findOne").mockResolvedValue(existingUser);

      // Mock device service
      const mockDevice = {
        id: "device-123",
        fingerprint: "device-fingerprint",
        browser: "Chrome",
        os: "Windows",
        lastLocation: null,
        firstSeenAt: new Date("2024-01-01"),
        lastSeenAt: new Date("2024-01-01"),
      };
      jest
        .spyOn(deviceService, "generateFingerprint")
        .mockReturnValue("device-fingerprint");
      jest
        .spyOn(deviceService, "getOrCreateDevice")
        .mockResolvedValue(mockDevice as any);

      // Mock session service
      const mockSession = {
        id: "session-123",
        userId: "user-uuid-123",
        deviceId: "device-123",
      };
      jest
        .spyOn(sessionService, "createSession")
        .mockResolvedValue(mockSession as any);

      // Mock token service
      const mockTokens = {
        accessToken: "jwt-access-token",
        refreshToken: "jwt-refresh-token",
        expiresIn: 900,
      };
      jest
        .spyOn(tokenService, "generateSessionTokens")
        .mockReturnValue(mockTokens);

      // Execute callback
      const result = await ssoCallbackHandler.execute(command);

      // Verify result
      expect(result).toBeDefined();
      expect(result.accessToken).toBe("jwt-access-token");
      expect(result.refreshToken).toBe("jwt-refresh-token");
      expect(result.expiresIn).toBe(900);
      expect(result.user.email).toBe("user@example.com");

      // Verify SSO service was called
      expect(ssoService.handleCallback).toHaveBeenCalledWith(code, state);

      // Verify session was created
      expect(sessionService.createSession).toHaveBeenCalledWith(
        "user-uuid-123",
        "device-123",
        expect.objectContaining({
          browser: "Chrome",
          os: "Windows",
          ipAddress: "192.168.1.1",
        }),
      );

      // Verify security log
      expect(securityLogService.logLoginSuccess).toHaveBeenCalled();
    });

    it("should create new user for SSO callback with new email", async () => {
      const code = "auth-code-456";
      const state = "state-token-456";
      const ipAddress = "192.168.1.2";
      const userAgent = "Mozilla/5.0 Firefox";

      const command = new SSOCallbackCommand(code, state, ipAddress, userAgent);

      // Mock SSO service callback response with new user
      jest.spyOn(ssoService, "handleCallback").mockResolvedValue({
        accessToken: "sso-access-token",
        refreshToken: "sso-refresh-token",
        expiresIn: 3600,
        tokenType: "Bearer",
        isNewUser: true,
        user: {
          id: "new-user-uuid-456",
          email: "newuser@example.com",
          firstName: "New",
          lastName: "User",
          roles: [],
          permissions: [],
        },
      });

      // Mock no existing user
      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(null);

      // Mock user creation via IAM module
      const newUserId = "new-user-uuid-456";
      jest.spyOn(commandBus, "execute").mockResolvedValue(newUserId);

      // Mock newly created user
      const newUser = {
        id: newUserId,
        email: "newuser@example.com",
        firstName: "New",
        lastName: "User",
        emailVerified: false,
        avatar: null,
        tenant_id: null,
        organization_id: null,
      } as unknown as UserEntity;

      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(newUser);
      jest.spyOn(userRepository, "save").mockResolvedValue({
        ...newUser,
        emailVerified: true,
      } as unknown as UserEntity);

      // Mock device and session services
      const mockDevice = {
        id: "device-456",
        fingerprint: "new-device-fingerprint",
        browser: "Firefox",
        os: "macOS",
        lastLocation: null,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };
      jest
        .spyOn(deviceService, "generateFingerprint")
        .mockReturnValue("new-device-fingerprint");
      jest
        .spyOn(deviceService, "getOrCreateDevice")
        .mockResolvedValue(mockDevice as any);

      const mockSession = {
        id: "session-456",
        userId: newUserId,
        deviceId: "device-456",
      };
      jest
        .spyOn(sessionService, "createSession")
        .mockResolvedValue(mockSession as any);

      const mockTokens = {
        accessToken: "new-jwt-access-token",
        refreshToken: "new-jwt-refresh-token",
        expiresIn: 900,
      };
      jest
        .spyOn(tokenService, "generateSessionTokens")
        .mockReturnValue(mockTokens);

      // Execute callback
      const result = await ssoCallbackHandler.execute(command);

      // Verify result
      expect(result).toBeDefined();
      expect(result.accessToken).toBe("new-jwt-access-token");
      expect(result.user.email).toBe("newuser@example.com");

      // Verify user was created via IAM module
      expect(commandBus.execute).toHaveBeenCalled();

      // Verify email was marked as verified
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
        }),
      );
    });

    it("should send login notification for new device", async () => {
      const command = new SSOCallbackCommand(
        "code",
        "state",
        "192.168.1.1",
        "Chrome",
      );

      // Mock SSO service response
      jest.spyOn(ssoService, "handleCallback").mockResolvedValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
        isNewUser: false,
        user: {
          id: "user-123",
          email: "user@example.com",
          firstName: "Test",
          lastName: "User",
          roles: [],
          permissions: [],
        },
      });

      // Mock existing user
      const user = {
        id: "user-123",
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
      } as unknown as UserEntity;
      jest.spyOn(userRepository, "findOne").mockResolvedValue(user);

      // Mock NEW device (firstSeenAt === lastSeenAt)
      const now = new Date();
      const newDevice = {
        id: "device-new",
        fingerprint: "new-fingerprint",
        browser: "Chrome",
        os: "Windows",
        lastLocation: null,
        firstSeenAt: now,
        lastSeenAt: now, // Same time = new device
      };
      jest
        .spyOn(deviceService, "generateFingerprint")
        .mockReturnValue("new-fingerprint");
      jest
        .spyOn(deviceService, "getOrCreateDevice")
        .mockResolvedValue(newDevice as any);

      // Mock session and tokens
      jest
        .spyOn(sessionService, "createSession")
        .mockResolvedValue({ id: "session-123" } as any);
      jest.spyOn(tokenService, "generateSessionTokens").mockReturnValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 900,
      });

      // Execute callback
      await ssoCallbackHandler.execute(command);

      // Verify login notification was sent for new device
      expect(emailService.sendLoginNotification).toHaveBeenCalledWith(
        user.email,
        expect.objectContaining({
          browser: "Chrome",
          os: "Windows",
          ipAddress: "192.168.1.1",
        }),
      );
    });

    it("should NOT send login notification for known device", async () => {
      const command = new SSOCallbackCommand(
        "code",
        "state",
        "192.168.1.1",
        "Chrome",
      );

      // Mock SSO service response
      jest.spyOn(ssoService, "handleCallback").mockResolvedValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
        isNewUser: false,
        user: {
          id: "user-123",
          email: "user@example.com",
          firstName: "Test",
          lastName: "User",
          roles: [],
          permissions: [],
        },
      });

      // Mock existing user
      const user = {
        id: "user-123",
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
      } as unknown as UserEntity;
      jest.spyOn(userRepository, "findOne").mockResolvedValue(user);

      // Mock KNOWN device (firstSeenAt !== lastSeenAt)
      const knownDevice = {
        id: "device-known",
        fingerprint: "known-fingerprint",
        browser: "Chrome",
        os: "Windows",
        lastLocation: null,
        firstSeenAt: new Date("2024-01-01"),
        lastSeenAt: new Date("2026-02-27"), // Different time = known device
      };
      jest
        .spyOn(deviceService, "generateFingerprint")
        .mockReturnValue("known-fingerprint");
      jest
        .spyOn(deviceService, "getOrCreateDevice")
        .mockResolvedValue(knownDevice as any);

      // Mock session and tokens
      jest
        .spyOn(sessionService, "createSession")
        .mockResolvedValue({ id: "session-123" } as any);
      jest.spyOn(tokenService, "generateSessionTokens").mockReturnValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 900,
      });

      // Execute callback
      await ssoCallbackHandler.execute(command);

      // Verify login notification was NOT sent for known device
      expect(emailService.sendLoginNotification).not.toHaveBeenCalled();
    });

    it("should reject callback with invalid state", async () => {
      const command = new SSOCallbackCommand(
        "code",
        "invalid-state",
        "192.168.1.1",
        "Chrome",
      );

      // Mock SSO service to throw error
      jest
        .spyOn(ssoService, "handleCallback")
        .mockRejectedValue(
          new UnauthorizedException("Invalid or expired OAuth state"),
        );

      await expect(ssoCallbackHandler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should handle SSO callback failure", async () => {
      const command = new SSOCallbackCommand(
        "invalid-code",
        "state",
        "192.168.1.1",
        "Chrome",
      );

      // Mock SSO service to return failure
      jest.spyOn(ssoService, "handleCallback").mockResolvedValue({
        accessToken: "",
        refreshToken: "",
        expiresIn: 0,
        tokenType: "Bearer",
        isNewUser: false,
        user: null as any,
      });

      await expect(ssoCallbackHandler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(ssoCallbackHandler.execute(command)).rejects.toThrow(
        "No user profile returned",
      );
    });

    it("should link existing user by email when SSO profile matches", async () => {
      const command = new SSOCallbackCommand(
        "code",
        "state",
        "192.168.1.1",
        "Chrome",
      );

      // Mock SSO service response with existing user email
      jest.spyOn(ssoService, "handleCallback").mockResolvedValue({
        accessToken: "sso-token",
        refreshToken: "sso-refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
        isNewUser: false,
        user: {
          id: "sso-user-link",
          email: "existing@example.com",
          firstName: "Existing",
          lastName: "User",
          roles: [],
          permissions: [],
        },
      });

      // Mock existing user with same email
      const existingUser = {
        id: "existing-user-id",
        email: "existing@example.com",
        firstName: "Existing",
        lastName: "User",
        emailVerified: false,
        avatar: null,
        tenant_id: "tenant-123",
        organization_id: "org-123",
      } as unknown as UserEntity;

      jest.spyOn(userRepository, "findOne").mockResolvedValue(existingUser);

      // Mock device and session services
      const mockDevice = {
        id: "device-link",
        fingerprint: "fingerprint-link",
        browser: "Chrome",
        os: "Windows",
        lastLocation: null,
        firstSeenAt: new Date("2024-01-01"),
        lastSeenAt: new Date("2026-02-27"),
      };
      jest
        .spyOn(deviceService, "generateFingerprint")
        .mockReturnValue("fingerprint-link");
      jest
        .spyOn(deviceService, "getOrCreateDevice")
        .mockResolvedValue(mockDevice as any);

      jest
        .spyOn(sessionService, "createSession")
        .mockResolvedValue({ id: "session-link" } as any);
      jest.spyOn(tokenService, "generateSessionTokens").mockReturnValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 900,
      });

      // Execute callback
      const result = await ssoCallbackHandler.execute(command);

      // Verify user was linked (not created)
      expect(commandBus.execute).not.toHaveBeenCalled();
      expect(result.user.id).toBe("existing-user-id");
      expect(result.user.email).toBe("existing@example.com");
    });

    it("should update user profile when linking SSO account", async () => {
      const command = new SSOCallbackCommand(
        "code",
        "state",
        "192.168.1.1",
        "Chrome",
      );

      // Mock SSO service response with avatar
      jest.spyOn(ssoService, "handleCallback").mockResolvedValue({
        accessToken: "sso-token",
        refreshToken: "sso-refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
        isNewUser: false,
        user: {
          id: "sso-user-update",
          email: "update@example.com",
          firstName: "Update",
          lastName: "User",
          roles: [],
          permissions: [],
          avatar: "https://sso.example.com/avatar.jpg",
          emailVerified: true,
        } as any,
      });

      // Mock existing user without avatar
      const existingUser = {
        id: "user-update",
        email: "update@example.com",
        firstName: "Update",
        lastName: "User",
        emailVerified: false,
        avatar: null,
        tenant_id: "tenant-123",
        organization_id: "org-123",
      } as unknown as UserEntity;

      jest.spyOn(userRepository, "findOne").mockResolvedValue(existingUser);

      // Mock save to capture the update
      const saveSpy = jest.spyOn(userRepository, "save").mockResolvedValue({
        ...existingUser,
        emailVerified: true,
        avatar: "https://sso.example.com/avatar.jpg",
      } as unknown as UserEntity);

      // Mock device and session services
      const mockDevice = {
        id: "device-update",
        fingerprint: "fingerprint-update",
        browser: "Chrome",
        os: "Windows",
        lastLocation: null,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };
      jest
        .spyOn(deviceService, "generateFingerprint")
        .mockReturnValue("fingerprint-update");
      jest
        .spyOn(deviceService, "getOrCreateDevice")
        .mockResolvedValue(mockDevice as any);

      jest
        .spyOn(sessionService, "createSession")
        .mockResolvedValue({ id: "session-update" } as any);
      jest.spyOn(tokenService, "generateSessionTokens").mockReturnValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 900,
      });

      // Execute callback
      await ssoCallbackHandler.execute(command);

      // Verify user profile was updated
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
          avatar: "https://sso.example.com/avatar.jpg",
        }),
      );
    });

    it("should parse SAML response attributes correctly", async () => {
      const command = new SSOCallbackCommand(
        "saml-code",
        "saml-state",
        "192.168.1.1",
        "Chrome",
      );

      // Mock SSO service response with SAML attributes
      jest.spyOn(ssoService, "handleCallback").mockResolvedValue({
        accessToken: "saml-token",
        refreshToken: "saml-refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
        isNewUser: true,
        user: {
          id: "saml-user-123",
          email: "saml@example.com",
          firstName: "SAML",
          lastName: "User",
          roles: ["user", "admin"],
          permissions: ["read", "write"],
          displayName: "SAML User",
          emailVerified: true,
          organizationId: "saml-org-123",
        } as any,
      });

      // Mock no existing user
      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(null);

      // Mock user creation
      const newUserId = "new-saml-user";
      jest.spyOn(commandBus, "execute").mockResolvedValue(newUserId);

      const newUser = {
        id: newUserId,
        email: "saml@example.com",
        firstName: "SAML",
        lastName: "User",
        emailVerified: false,
        avatar: null,
        tenant_id: null,
        organization_id: null,
      } as unknown as UserEntity;

      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(newUser);
      jest.spyOn(userRepository, "save").mockResolvedValue({
        ...newUser,
        emailVerified: true,
      } as unknown as UserEntity);

      // Mock device and session services
      const mockDevice = {
        id: "device-saml",
        fingerprint: "fingerprint-saml",
        browser: "Chrome",
        os: "Windows",
        lastLocation: null,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };
      jest
        .spyOn(deviceService, "generateFingerprint")
        .mockReturnValue("fingerprint-saml");
      jest
        .spyOn(deviceService, "getOrCreateDevice")
        .mockResolvedValue(mockDevice as any);

      jest
        .spyOn(sessionService, "createSession")
        .mockResolvedValue({ id: "session-saml" } as any);
      jest.spyOn(tokenService, "generateSessionTokens").mockReturnValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 900,
      });

      // Execute callback
      const result = await ssoCallbackHandler.execute(command);

      // Verify SAML attributes were parsed correctly
      expect(result.user.email).toBe("saml@example.com");
      expect(result.user.firstName).toBe("SAML");
      expect(result.user.lastName).toBe("User");

      // Verify user was created with correct data
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "saml@example.com",
          firstName: "SAML",
          lastName: "User",
        }),
      );
    });

    it("should handle user creation failure gracefully", async () => {
      const command = new SSOCallbackCommand(
        "code",
        "state",
        "192.168.1.1",
        "Chrome",
      );

      // Mock SSO service response
      jest.spyOn(ssoService, "handleCallback").mockResolvedValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
        isNewUser: true,
        user: {
          id: "sso-user-fail",
          email: "fail@example.com",
          firstName: "Fail",
          lastName: "User",
          roles: [],
          permissions: [],
        },
      });

      // Mock no existing user
      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(null);

      // Mock user creation failure
      jest
        .spyOn(commandBus, "execute")
        .mockRejectedValue(new Error("Database error"));

      // Execute callback
      await expect(ssoCallbackHandler.execute(command)).rejects.toThrow(
        "Database error",
      );
    });

    it("should handle SSO service errors gracefully", async () => {
      const command = new SSOCallbackCommand(
        "code",
        "state",
        "192.168.1.1",
        "Chrome",
      );

      // Mock SSO service to throw error
      jest
        .spyOn(ssoService, "handleCallback")
        .mockRejectedValue(new Error("SAML parsing error"));

      // Execute callback
      await expect(ssoCallbackHandler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(ssoCallbackHandler.execute(command)).rejects.toThrow(
        "SSO authentication failed",
      );
    });

    it("should handle missing user profile attributes gracefully", async () => {
      const command = new SSOCallbackCommand(
        "code",
        "state",
        "192.168.1.1",
        "Chrome",
      );

      // Mock SSO service response with minimal attributes
      jest.spyOn(ssoService, "handleCallback").mockResolvedValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
        isNewUser: true,
        user: {
          id: "sso-user-minimal",
          email: "minimal@example.com",
          firstName: "",
          lastName: "",
          roles: [],
          permissions: [],
        },
      });

      // Mock no existing user
      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(null);

      // Mock user creation
      const newUserId = "new-minimal-user";
      jest.spyOn(commandBus, "execute").mockResolvedValue(newUserId);

      const newUser = {
        id: newUserId,
        email: "minimal@example.com",
        firstName: "User", // Default value
        lastName: "", // Default value
        emailVerified: false,
        avatar: null,
        tenant_id: null,
        organization_id: null,
      } as unknown as UserEntity;

      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(newUser);
      jest.spyOn(userRepository, "save").mockResolvedValue({
        ...newUser,
        emailVerified: true,
      } as unknown as UserEntity);

      // Mock device and session services
      const mockDevice = {
        id: "device-minimal",
        fingerprint: "fingerprint-minimal",
        browser: "Chrome",
        os: "Windows",
        lastLocation: null,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };
      jest
        .spyOn(deviceService, "generateFingerprint")
        .mockReturnValue("fingerprint-minimal");
      jest
        .spyOn(deviceService, "getOrCreateDevice")
        .mockResolvedValue(mockDevice as any);

      jest
        .spyOn(sessionService, "createSession")
        .mockResolvedValue({ id: "session-minimal" } as any);
      jest.spyOn(tokenService, "generateSessionTokens").mockReturnValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 900,
      });

      // Execute callback
      const result = await ssoCallbackHandler.execute(command);

      // Verify user was created with default values
      expect(result.user.email).toBe("minimal@example.com");
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "minimal@example.com",
          firstName: "User",
          lastName: "",
        }),
      );
    });
  });
});
