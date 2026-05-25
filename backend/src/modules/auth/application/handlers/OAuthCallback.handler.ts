import { CommandHandler, ICommandHandler, CommandBus } from "@nestjs/cqrs";
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomBytes } from "crypto";
import { OAuthCallbackCommand } from "../commands/OAuthCallback.command";
import { OAuthLoginHandler } from "./OAuthLogin.handler";
import { UserEntity } from "../../../iam/infrastructure/persistence/entities/User.entity";
import { RegisterUserCommand } from "../../../iam/application/commands/RegisterUser.command";
import { SessionService } from "../../services/session.service";
import { TokenService } from "../../services/token.service";
import { DeviceService } from "../../services/device.service";
import { EmailService } from "../../services/email.service";
import { SecurityLogService } from "../../services/security-log.service";
import { TokenResponseDto, UserProfileDto } from "../../dto/token-response.dto";

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface OAuthUserProfile {
  id: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  login?: string; // GitHub
  avatar_url?: string; // GitHub
}

/**
 * OAuthCallbackHandler - Handles OAuth callback
 *
 * Responsibilities:
 * - Validate state token
 * - Exchange authorization code for access token
 * - Fetch user profile from OAuth provider
 * - Create or link user account
 * - Create session with device tracking (Requirement: 1.5)
 * - Generate JWT tokens
 * - Send login notification for new devices (Requirement: 1.7)
 *
 * Requirements: 1.3, 1.5, 1.7
 */
@CommandHandler(OAuthCallbackCommand)
@Injectable()
export class OAuthCallbackHandler
  implements ICommandHandler<OAuthCallbackCommand>
{
  private readonly oauthConfigs = {
    google: {
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
      clientId: this.configService.get<string>("OAUTH_GOOGLE_CLIENT_ID"),
      clientSecret: this.configService.get<string>("OAUTH_GOOGLE_CLIENT_SECRET"),
      redirectUri: this.configService.get<string>(
        "OAUTH_GOOGLE_REDIRECT_URI",
        "http://localhost:3000/auth/oauth/google/callback",
      ),
    },
    github: {
      tokenUrl: "https://github.com/login/oauth/access_token",
      userInfoUrl: "https://api.github.com/user",
      emailUrl: "https://api.github.com/user/emails",
      clientId: this.configService.get<string>("OAUTH_GITHUB_CLIENT_ID"),
      clientSecret: this.configService.get<string>("OAUTH_GITHUB_CLIENT_SECRET"),
      redirectUri: this.configService.get<string>(
        "OAUTH_GITHUB_REDIRECT_URI",
        "http://localhost:3000/auth/oauth/github/callback",
      ),
    },
  };

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly commandBus: CommandBus,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly deviceService: DeviceService,
    private readonly emailService: EmailService,
    private readonly securityLogService: SecurityLogService,
  ) {}

  async execute(command: OAuthCallbackCommand): Promise<TokenResponseDto> {
    // 1. Validate state token
    const stateData = OAuthLoginHandler.validateState(command.state);
    if (!stateData) {
      throw new UnauthorizedException(
        "Invalid or expired OAuth state. Please try logging in again.",
      );
    }

    const { provider, organizationId } = stateData;
    const config =
      this.oauthConfigs[provider as "google" | "github"];

    if (!config.clientId || !config.clientSecret) {
      throw new BadRequestException(
        `OAuth provider ${provider} is not properly configured`,
      );
    }

    // 2. Exchange authorization code for access token
    const accessToken = await this.exchangeCodeForToken(
      provider,
      command.code,
      config,
    );

    // 3. Fetch user profile from OAuth provider
    const oauthProfile = await this.fetchUserProfile(
      provider,
      accessToken,
      config,
    );

    // 4. Find or create user
    const user = await this.findOrCreateUser(
      oauthProfile,
      provider,
      organizationId,
    );

    // 5. Generate device fingerprint and check if device is known
    const deviceFingerprint = this.deviceService.generateFingerprint({
      ip: command.ipAddress,
      userAgent: command.userAgent,
    } as any);

    const device = await this.deviceService.getOrCreateDevice(
      user.id,
      deviceFingerprint,
      {
        fingerprint: deviceFingerprint,
        browser: this.extractBrowser(command.userAgent),
        os: this.extractOS(command.userAgent),
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
      },
    );

    const isNewDevice = device.firstSeenAt.getTime() === device.lastSeenAt.getTime();

    // 6. Create session (Requirement: 1.5)
    const session = await this.sessionService.createSession(
      user.id,
      device.id,
      {
        deviceName: device.name || `${device.browser} on ${device.os}`,
        deviceType: "web",
        browser: device.browser,
        browserVersion: "",
        os: device.os,
        osVersion: "",
        ipAddress: command.ipAddress,
        location: device.lastLocation || undefined,
        rememberMe: false,
      },
    );

    // 7. Generate JWT tokens
    const tokens = this.tokenService.generateSessionTokens(
      user.id,
      session.id,
      device.id,
    );

    // 8. Send login notification for new devices (Requirement: 1.7)
    if (isNewDevice) {
      try {
        await this.emailService.sendLoginNotification(user.email, {
          browser: device.browser,
          os: device.os,
          location: device.lastLocation
            ? `${device.lastLocation.city}, ${device.lastLocation.country}`
            : undefined,
          ipAddress: command.ipAddress,
        });
      } catch (error) {
        // Log error but don't fail the login
        console.error("Failed to send login notification:", error);
      }
    }

    // 9. Log successful OAuth login
    await this.securityLogService.logLoginSuccess(
      user.id,
      command.ipAddress,
      command.userAgent,
      {
        sessionId: session.id,
        deviceId: device.id,
        isNewDevice,
        oauthProvider: provider,
      },
    );

    // 10. Get user roles and permissions
    const { roles, permissions } = await this.getUserRolesAndPermissions(
      user.id,
    );

    // 11. Build user profile
    const userProfile: UserProfileDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
      avatar: user.avatar,
      tenantId: user.tenant_id,
      organizationId: user.organization_id,
    };

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: "Bearer",
      user: userProfile,
    };
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(
    provider: string,
    code: string,
    config: any,
  ): Promise<string> {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new UnauthorizedException(
        `Failed to exchange OAuth code: ${errorText}`,
      );
    }

    const data: OAuthTokenResponse = await response.json();
    return data.access_token;
  }

  /**
   * Fetch user profile from OAuth provider
   */
  private async fetchUserProfile(
    provider: string,
    accessToken: string,
    config: any,
  ): Promise<OAuthUserProfile> {
    const response = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException(
        `Failed to fetch user profile from ${provider}`,
      );
    }

    const profile: OAuthUserProfile = await response.json();

    // For GitHub, we need to fetch email separately if not public
    if (provider === "github" && !profile.email) {
      profile.email = await this.fetchGitHubEmail(accessToken, config);
    }

    return profile;
  }

  /**
   * Fetch primary email from GitHub (emails endpoint)
   */
  private async fetchGitHubEmail(
    accessToken: string,
    config: any,
  ): Promise<string> {
    const response = await fetch(config.emailUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException("Failed to fetch GitHub email");
    }

    const emails: Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }> = await response.json();

    const primaryEmail = emails.find((e) => e.primary && e.verified);
    if (!primaryEmail) {
      throw new UnauthorizedException(
        "No verified primary email found in GitHub account",
      );
    }

    return primaryEmail.email;
  }

  /**
   * Find existing user or create new one
   */
  private async findOrCreateUser(
    oauthProfile: OAuthUserProfile,
    provider: string,
    organizationId: string,
  ): Promise<UserEntity> {
    // Try to find existing user by email
    let user = await this.userRepository.findOne({
      where: { email: oauthProfile.email, deletedAt: null },
    });

    if (user) {
      // User exists, return it
      return user;
    }

    // Create new user via IAM module
    const firstName =
      oauthProfile.given_name ||
      oauthProfile.name?.split(" ")[0] ||
      oauthProfile.login ||
      "User";
    const lastName =
      oauthProfile.family_name || oauthProfile.name?.split(" ")[1] || "";

    // Generate a random username from email
    const username =
      oauthProfile.email.split("@")[0] + "_" + randomBytes(6).toString("hex");

    // Get default region (you may want to make this configurable)
    const defaultRegionId = this.configService.get<string>(
      "DEFAULT_REGION_ID",
      "00000000-0000-0000-0000-000000000001",
    );

    // Create user via IAM module (no password needed for OAuth users)
    const userId = await this.commandBus.execute(
      new RegisterUserCommand(
        username,
        oauthProfile.email,
        null, // No password for OAuth users
        firstName,
        lastName,
        defaultRegionId,
        organizationId,
      ),
    );

    // Fetch the created user
    user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Failed to create user");
    }

    // Mark email as verified for OAuth users
    user.emailVerified = true;
    if (oauthProfile.picture || oauthProfile.avatar_url) {
      user.avatar = oauthProfile.picture || oauthProfile.avatar_url;
    }
    await this.userRepository.save(user);

    return user;
  }

  /**
   * Extract browser from user agent
   */
  private extractBrowser(userAgent: string): string {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  }

  /**
   * Extract OS from user agent
   */
  private extractOS(userAgent: string): string {
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iOS")) return "iOS";
    return "Unknown";
  }

  /**
   * Get user roles and permissions
   */
  private async getUserRolesAndPermissions(
    _userId: string,
  ): Promise<{ roles: string[]; permissions: string[] }> {
    // Simplified version - in production, query actual roles/permissions
    return {
      roles: [],
      permissions: [],
    };
  }
}
