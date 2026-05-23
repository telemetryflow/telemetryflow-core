/**
 * Unit Tests for OAuth Login Flow
 *
 * Feature: frontend-backend-auth-integration
 * Task: 10.1 Implement OAuth login flow
 * Requirements: 1.3, 1.5, 1.7
 *
 * Tests OAuth login initiation, callback handling, user creation/linking,
 * session creation, and device tracking.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { CommandBus } from "@nestjs/cqrs";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";
import { OAuthLoginHandler } from "../application/handlers/OAuthLogin.handler";
import { OAuthCallbackHandler } from "../application/handlers/OAuthCallback.handler";
import { OAuthLoginCommand } from "../application/commands/OAuthLogin.command";
import { OAuthCallbackCommand } from "../application/commands/OAuthCallback.command";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { SessionService } from "../services/session.service";
import { TokenService } from "../services/token.service";
import { DeviceService } from "../services/device.service";
import { EmailService } from "../services/email.service";
import { SecurityLogService } from "../services/security-log.service";

describe("OAuth Login Flow", () => {
  let oauthLoginHandler: OAuthLoginHandler;
  let oauthCallbackHandler: OAuthCallbackHandler;
  let configService: ConfigService;
  let userRepository: Repository<UserEntity>;
  let commandBus: CommandBus;
  let sessionService: SessionService;
  let tokenService: TokenService;
  let deviceService: DeviceService;
  let emailService: EmailService;
  let securityLogService: SecurityLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthLoginHandler,
        OAuthCallbackHandler,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                OAUTH_GOOGLE_CLIENT_ID: "test-google-client-id",
                OAUTH_GOOGLE_CLIENT_SECRET: "test-google-client-secret",
                OAUTH_GOOGLE_REDIRECT_URI:
                  "http://localhost:3000/auth/oauth/google/callback",
                OAUTH_GITHUB_CLIENT_ID: "test-github-client-id",
                OAUTH_GITHUB_CLIENT_SECRET: "test-github-client-secret",
                OAUTH_GITHUB_REDIRECT_URI:
                  "http://localhost:3000/auth/oauth/github/callback",
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
      ],
    }).compile();

    oauthLoginHandler = module.get<OAuthLoginHandler>(OAuthLoginHandler);
    oauthCallbackHandler =
      module.get<OAuthCallbackHandler>(OAuthCallbackHandler);
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("OAuthLoginHandler", () => {
    it("should initiate Google OAuth login successfully", async () => {
      const command = new OAuthLoginCommand(
        "google",
        "org-123",
        "https://app.example.com/dashboard",
      );

      const result = await oauthLoginHandler.execute(command);

      expect(result).toBeDefined();
      expect(result.authorizationUrl).toContain(
        "https://accounts.google.com/o/oauth2/v2/auth",
      );
      expect(result.authorizationUrl).toContain(
        "client_id=test-google-client-id",
      );
      expect(result.authorizationUrl).toContain("response_type=code");
      expect(result.authorizationUrl).toContain("scope=openid+email+profile");
      expect(result.state).toBeDefined();
      expect(result.state.length).toBe(64); // 32 bytes hex = 64 chars
    });

    it("should initiate GitHub OAuth login successfully", async () => {
      const command = new OAuthLoginCommand("github", "org-123");

      const result = await oauthLoginHandler.execute(command);

      expect(result).toBeDefined();
      expect(result.authorizationUrl).toContain(
        "https://github.com/login/oauth/authorize",
      );
      expect(result.authorizationUrl).toContain(
        "client_id=test-github-client-id",
      );
      expect(result.authorizationUrl).toContain("response_type=code");
      expect(result.authorizationUrl).toContain(
        "scope=user%3Aemail+read%3Auser",
      );
      expect(result.state).toBeDefined();
    });

    it("should reject unsupported OAuth provider", async () => {
      const command = new OAuthLoginCommand("facebook", "org-123");

      await expect(oauthLoginHandler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(oauthLoginHandler.execute(command)).rejects.toThrow(
        "Unsupported OAuth provider",
      );
    });

    it("should reject OAuth login when provider is not configured", async () => {
      // Create a new handler with missing configuration
      const testModule = await Test.createTestingModule({
        providers: [
          OAuthLoginHandler,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                // Return undefined for OAuth client IDs
                if (key.includes("OAUTH")) {
                  return undefined;
                }
                return null;
              }),
            },
          },
        ],
      }).compile();

      const testHandler = testModule.get<OAuthLoginHandler>(OAuthLoginHandler);
      const command = new OAuthLoginCommand("google", "org-123");

      await expect(testHandler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(testHandler.execute(command)).rejects.toThrow(
        "OAuth provider google is not configured",
      );
    });

    it("should generate unique state tokens for each request", async () => {
      const command1 = new OAuthLoginCommand("google", "org-123");
      const command2 = new OAuthLoginCommand("google", "org-123");

      const result1 = await oauthLoginHandler.execute(command1);
      const result2 = await oauthLoginHandler.execute(command2);

      expect(result1.state).not.toBe(result2.state);
    });

    it("should include redirect URI in authorization URL", async () => {
      const command = new OAuthLoginCommand("google", "org-123");

      const result = await oauthLoginHandler.execute(command);

      expect(result.authorizationUrl).toContain(
        "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Foauth%2Fgoogle%2Fcallback",
      );
    });

    it("should validate state token correctly", async () => {
      const command = new OAuthLoginCommand("google", "org-123", "/dashboard");

      const result = await oauthLoginHandler.execute(command);

      // Validate the state immediately
      const stateData = OAuthLoginHandler.validateState(result.state);

      expect(stateData).toBeDefined();
      expect(stateData?.provider).toBe("google");
      expect(stateData?.organizationId).toBe("org-123");
      expect(stateData?.redirectUrl).toBe("/dashboard");
    });

    it("should reject invalid state token", () => {
      const stateData = OAuthLoginHandler.validateState("invalid-state");

      expect(stateData).toBeNull();
    });

    it("should reject state token after validation (single use)", async () => {
      const command = new OAuthLoginCommand("google", "org-123");

      const result = await oauthLoginHandler.execute(command);

      // First validation should succeed
      const stateData1 = OAuthLoginHandler.validateState(result.state);
      expect(stateData1).toBeDefined();

      // Second validation should fail (single use)
      const stateData2 = OAuthLoginHandler.validateState(result.state);
      expect(stateData2).toBeNull();
    });
  });

  describe("OAuthCallbackHandler", () => {
    beforeEach(() => {
      // Mock fetch for OAuth token exchange and user profile
      global.fetch = jest.fn();
    });

    it("should reject callback with invalid state", async () => {
      const command = new OAuthCallbackCommand(
        "auth-code-123",
        "invalid-state",
        "192.168.1.1",
        "Mozilla/5.0",
      );

      await expect(oauthCallbackHandler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(oauthCallbackHandler.execute(command)).rejects.toThrow(
        "Invalid or expired OAuth state",
      );
    });

    it("should handle Google OAuth callback for existing user", async () => {
      // Setup: Initiate OAuth to get valid state
      const loginCommand = new OAuthLoginCommand("google", "org-123");
      const loginResult = await oauthLoginHandler.execute(loginCommand);

      // Mock token exchange response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "google-access-token",
          expires_in: 3600,
          token_type: "Bearer",
        }),
      });

      // Mock user profile response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: "google-user-123",
          email: "user@example.com",
          email_verified: true,
          name: "Test User",
          given_name: "Test",
          family_name: "User",
          picture: "https://example.com/avatar.jpg",
        }),
      });

      // Mock existing user
      const existingUser = {
        id: "user-uuid-123",
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
        emailVerified: true,
        avatar: "https://example.com/avatar.jpg",
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
      const callbackCommand = new OAuthCallbackCommand(
        "auth-code-123",
        loginResult.state,
        "192.168.1.1",
        "Mozilla/5.0 Chrome",
      );

      const result = await oauthCallbackHandler.execute(callbackCommand);

      // Verify result
      expect(result).toBeDefined();
      expect(result.accessToken).toBe("jwt-access-token");
      expect(result.refreshToken).toBe("jwt-refresh-token");
      expect(result.expiresIn).toBe(900);
      expect(result.user.email).toBe("user@example.com");

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

    it("should create new user for OAuth callback with new email", async () => {
      // Setup: Initiate OAuth to get valid state
      const loginCommand = new OAuthLoginCommand("github", "org-123");
      const loginResult = await oauthLoginHandler.execute(loginCommand);

      // Mock token exchange response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "github-access-token",
          expires_in: 3600,
          token_type: "Bearer",
        }),
      });

      // Mock user profile response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "github-user-456",
          email: "newuser@example.com",
          name: "New User",
          login: "newuser",
          avatar_url: "https://github.com/avatar.jpg",
        }),
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
        organization_id: "org-123",
      } as unknown as UserEntity;

      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(newUser);
      jest.spyOn(userRepository, "save").mockResolvedValue({
        ...newUser,
        emailVerified: true,
        avatar: "https://github.com/avatar.jpg",
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
      const callbackCommand = new OAuthCallbackCommand(
        "auth-code-456",
        loginResult.state,
        "192.168.1.2",
        "Mozilla/5.0 Firefox",
      );

      const result = await oauthCallbackHandler.execute(callbackCommand);

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
          avatar: "https://github.com/avatar.jpg",
        }),
      );
    });

    it("should send login notification for new device", async () => {
      // Setup: Initiate OAuth to get valid state
      const loginCommand = new OAuthLoginCommand("google", "org-123");
      const loginResult = await oauthLoginHandler.execute(loginCommand);

      // Mock token exchange and user profile
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "token",
            expires_in: 3600,
            token_type: "Bearer",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: "user-123",
            email: "user@example.com",
            email_verified: true,
            name: "User",
            given_name: "Test",
            family_name: "User",
          }),
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
      const callbackCommand = new OAuthCallbackCommand(
        "code",
        loginResult.state,
        "192.168.1.1",
        "Chrome",
      );

      await oauthCallbackHandler.execute(callbackCommand);

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
      // Setup: Initiate OAuth to get valid state
      const loginCommand = new OAuthLoginCommand("google", "org-123");
      const loginResult = await oauthLoginHandler.execute(loginCommand);

      // Mock token exchange and user profile
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "token",
            expires_in: 3600,
            token_type: "Bearer",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: "user-123",
            email: "user@example.com",
            email_verified: true,
            name: "User",
            given_name: "Test",
            family_name: "User",
          }),
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
      const callbackCommand = new OAuthCallbackCommand(
        "code",
        loginResult.state,
        "192.168.1.1",
        "Chrome",
      );

      await oauthCallbackHandler.execute(callbackCommand);

      // Verify login notification was NOT sent for known device
      expect(emailService.sendLoginNotification).not.toHaveBeenCalled();
    });

    it("should handle OAuth token exchange failure", async () => {
      // Setup: Initiate OAuth to get valid state
      const loginCommand = new OAuthLoginCommand("google", "org-123");
      const loginResult = await oauthLoginHandler.execute(loginCommand);

      // Mock failed token exchange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => "Invalid authorization code",
      });

      // Execute callback
      const callbackCommand = new OAuthCallbackCommand(
        "invalid-code",
        loginResult.state,
        "192.168.1.1",
        "Chrome",
      );

      await expect(
        oauthCallbackHandler.execute(callbackCommand),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should handle OAuth user profile fetch failure", async () => {
      // Setup: Initiate OAuth to get valid state
      const loginCommand = new OAuthLoginCommand("google", "org-123");
      const loginResult = await oauthLoginHandler.execute(loginCommand);

      // Mock successful token exchange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "valid-token",
          expires_in: 3600,
          token_type: "Bearer",
        }),
      });

      // Mock failed user profile fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => "Failed to fetch user profile",
      });

      // Execute callback
      const callbackCommand = new OAuthCallbackCommand(
        "valid-code",
        loginResult.state,
        "192.168.1.1",
        "Chrome",
      );

      await expect(
        oauthCallbackHandler.execute(callbackCommand),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should link existing user by email when OAuth profile matches", async () => {
      // Setup: Initiate OAuth to get valid state
      const loginCommand = new OAuthLoginCommand("google", "org-123");
      const loginResult = await oauthLoginHandler.execute(loginCommand);

      // Mock token exchange and user profile
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "token",
            expires_in: 3600,
            token_type: "Bearer",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: "google-user-789",
            email: "existing@example.com",
            email_verified: true,
            name: "Existing User",
            given_name: "Existing",
            family_name: "User",
          }),
        });

      // Mock existing user with same email
      const existingUser = {
        id: "existing-user-id",
        email: "existing@example.com",
        firstName: "Existing",
        lastName: "User",
        emailVerified: false, // Not verified yet
        avatar: null,
        tenant_id: "tenant-123",
        organization_id: "org-123",
      } as unknown as UserEntity;

      jest.spyOn(userRepository, "findOne").mockResolvedValue(existingUser);

      // Mock device and session services
      const mockDevice = {
        id: "device-789",
        fingerprint: "fingerprint-789",
        browser: "Chrome",
        os: "Windows",
        lastLocation: null,
        firstSeenAt: new Date("2024-01-01"),
        lastSeenAt: new Date("2026-02-27"),
      };
      jest
        .spyOn(deviceService, "generateFingerprint")
        .mockReturnValue("fingerprint-789");
      jest
        .spyOn(deviceService, "getOrCreateDevice")
        .mockResolvedValue(mockDevice as any);

      jest
        .spyOn(sessionService, "createSession")
        .mockResolvedValue({ id: "session-789" } as any);
      jest.spyOn(tokenService, "generateSessionTokens").mockReturnValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 900,
      });

      // Execute callback
      const callbackCommand = new OAuthCallbackCommand(
        "code",
        loginResult.state,
        "192.168.1.1",
        "Chrome",
      );

      const result = await oauthCallbackHandler.execute(callbackCommand);

      // Verify user was linked (not created)
      expect(commandBus.execute).not.toHaveBeenCalled();
      expect(result.user.id).toBe("existing-user-id");
      expect(result.user.email).toBe("existing@example.com");
    });

    it("should update user profile when linking OAuth account", async () => {
      // Setup: Initiate OAuth to get valid state
      const loginCommand = new OAuthLoginCommand("github", "org-123");
      const loginResult = await oauthLoginHandler.execute(loginCommand);

      // Mock token exchange and user profile with avatar
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "token",
            expires_in: 3600,
            token_type: "Bearer",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "github-user-999",
            email: "newuser@example.com",
            name: "New User",
            login: "newuser",
            avatar_url: "https://github.com/avatar-new.jpg",
          }),
        });

      // Mock no existing user (will create new)
      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(null);

      // Mock user creation
      const newUserId = "new-user-999";
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
        organization_id: "org-123",
      } as unknown as UserEntity;

      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(newUser);

      // Mock save to capture the update
      const saveSpy = jest.spyOn(userRepository, "save").mockResolvedValue({
        ...newUser,
        emailVerified: true,
        avatar: "https://github.com/avatar-new.jpg",
      } as unknown as UserEntity);

      // Mock device and session services
      const mockDevice = {
        id: "device-999",
        fingerprint: "fingerprint-999",
        browser: "Firefox",
        os: "macOS",
        lastLocation: null,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };
      jest
        .spyOn(deviceService, "generateFingerprint")
        .mockReturnValue("fingerprint-999");
      jest
        .spyOn(deviceService, "getOrCreateDevice")
        .mockResolvedValue(mockDevice as any);

      jest
        .spyOn(sessionService, "createSession")
        .mockResolvedValue({ id: "session-999" } as any);
      jest.spyOn(tokenService, "generateSessionTokens").mockReturnValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 900,
      });

      // Execute callback
      const callbackCommand = new OAuthCallbackCommand(
        "code",
        loginResult.state,
        "192.168.1.1",
        "Firefox",
      );

      await oauthCallbackHandler.execute(callbackCommand);

      // Verify user profile was updated with avatar and email verification
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
          avatar: "https://github.com/avatar-new.jpg",
        }),
      );
    });

    it("should handle GitHub email fetch when email is not public", async () => {
      // Setup: Initiate OAuth to get valid state
      const loginCommand = new OAuthLoginCommand("github", "org-123");
      const loginResult = await oauthLoginHandler.execute(loginCommand);

      // Mock token exchange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "github-token",
          expires_in: 3600,
          token_type: "Bearer",
        }),
      });

      // Mock user profile WITHOUT email (private)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "github-user-private",
          name: "Private User",
          login: "privateuser",
          avatar_url: "https://github.com/avatar.jpg",
          // email is missing
        }),
      });

      // Mock email endpoint response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            email: "secondary@example.com",
            primary: false,
            verified: true,
          },
          {
            email: "primary@example.com",
            primary: true,
            verified: true,
          },
        ],
      });

      // Mock no existing user
      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(null);

      // Mock user creation
      const newUserId = "new-user-private";
      jest.spyOn(commandBus, "execute").mockResolvedValue(newUserId);

      const newUser = {
        id: newUserId,
        email: "primary@example.com",
        firstName: "Private",
        lastName: "User",
        emailVerified: false,
        avatar: null,
        tenant_id: null,
        organization_id: "org-123",
      } as unknown as UserEntity;

      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(newUser);
      jest.spyOn(userRepository, "save").mockResolvedValue({
        ...newUser,
        emailVerified: true,
        avatar: "https://github.com/avatar.jpg",
      } as unknown as UserEntity);

      // Mock device and session services
      const mockDevice = {
        id: "device-private",
        fingerprint: "fingerprint-private",
        browser: "Chrome",
        os: "Linux",
        lastLocation: null,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };
      jest
        .spyOn(deviceService, "generateFingerprint")
        .mockReturnValue("fingerprint-private");
      jest
        .spyOn(deviceService, "getOrCreateDevice")
        .mockResolvedValue(mockDevice as any);

      jest
        .spyOn(sessionService, "createSession")
        .mockResolvedValue({ id: "session-private" } as any);
      jest.spyOn(tokenService, "generateSessionTokens").mockReturnValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 900,
      });

      // Execute callback
      const callbackCommand = new OAuthCallbackCommand(
        "code",
        loginResult.state,
        "192.168.1.1",
        "Chrome",
      );

      const result = await oauthCallbackHandler.execute(callbackCommand);

      // Verify the primary verified email was used
      expect(result.user.email).toBe("primary@example.com");

      // Verify email endpoint was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/user/emails"),
        expect.any(Object),
      );
    });

    it("should reject GitHub OAuth when no verified email is found", async () => {
      // Setup: Initiate OAuth to get valid state
      const loginCommand = new OAuthLoginCommand("github", "org-123");
      const loginResult = await oauthLoginHandler.execute(loginCommand);

      // Mock token exchange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "github-token",
          expires_in: 3600,
          token_type: "Bearer",
        }),
      });

      // Mock user profile WITHOUT email
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "github-user-no-email",
          name: "No Email User",
          login: "noemail",
        }),
      });

      // Mock email endpoint with no verified primary email
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            email: "unverified@example.com",
            primary: true,
            verified: false, // Not verified
          },
        ],
      });

      // Execute callback
      const callbackCommand = new OAuthCallbackCommand(
        "code",
        loginResult.state,
        "192.168.1.1",
        "Chrome",
      );

      await expect(
        oauthCallbackHandler.execute(callbackCommand),
      ).rejects.toThrow("No verified primary email found in GitHub account");
    });

    it("should handle user creation failure gracefully", async () => {
      // Setup: Initiate OAuth to get valid state
      const loginCommand = new OAuthLoginCommand("google", "org-123");
      const loginResult = await oauthLoginHandler.execute(loginCommand);

      // Mock token exchange and user profile
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "token",
            expires_in: 3600,
            token_type: "Bearer",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: "google-user-fail",
            email: "fail@example.com",
            email_verified: true,
            name: "Fail User",
            given_name: "Fail",
            family_name: "User",
          }),
        });

      // Mock no existing user
      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(null);

      // Mock user creation failure
      jest
        .spyOn(commandBus, "execute")
        .mockRejectedValue(new Error("Database error"));

      // Execute callback
      const callbackCommand = new OAuthCallbackCommand(
        "code",
        loginResult.state,
        "192.168.1.1",
        "Chrome",
      );

      await expect(
        oauthCallbackHandler.execute(callbackCommand),
      ).rejects.toThrow("Database error");
    });
  });
});
