import { CommandHandler, ICommandHandler, CommandBus } from "@nestjs/cqrs";
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomBytes } from "crypto";
import { SSOCallbackCommand } from "../commands/SSOCallback.command";
import { SsoService } from "../../../sso/sso.service";
import { UserEntity } from "../../../iam/infrastructure/persistence/entities/User.entity";
import { RegisterUserCommand } from "../../../iam/application/commands/RegisterUser.command";
import { SessionService } from "../../services/session.service";
import { TokenService } from "../../services/token.service";
import { DeviceService } from "../../services/device.service";
import { EmailService } from "../../services/email.service";
import { SecurityLogService } from "../../services/security-log.service";
import { TokenResponseDto, UserProfileDto } from "../../dto/token-response.dto";

/**
 * SSOCallbackHandler - Handles SSO callback
 *
 * Responsibilities:
 * - Validate state token via SSO module
 * - Handle SSO callback and get user profile
 * - Create or link user account
 * - Create session with device tracking (Requirement: 1.5)
 * - Generate JWT tokens
 * - Send login notification for new devices (Requirement: 1.7)
 *
 * Requirements: 1.4, 1.5, 1.7
 */
@CommandHandler(SSOCallbackCommand)
@Injectable()
export class SSOCallbackHandler implements ICommandHandler<SSOCallbackCommand> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(SsoService)
    private readonly ssoService: SsoService,
    private readonly commandBus: CommandBus,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly deviceService: DeviceService,
    private readonly emailService: EmailService,
    private readonly securityLogService: SecurityLogService,
  ) {}

  async execute(command: SSOCallbackCommand): Promise<TokenResponseDto> {
    try {
      // 1. Handle SSO callback via SSO module
      // This validates the state, exchanges code for tokens, and gets user profile
      const ssoResult = await this.ssoService.handleCallback(
        command.code,
        command.state,
      );

      if (!ssoResult.user) {
        throw new UnauthorizedException(
          "SSO authentication failed: No user profile returned",
        );
      }

      // 2. Find or create user
      const user = await this.findOrCreateUser(
        ssoResult.user,
        ssoResult.isNewUser || false,
      );

      // 3. Generate device fingerprint and check if device is known
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

      const isNewDevice =
        device.firstSeenAt.getTime() === device.lastSeenAt.getTime();

      // 4. Create session (Requirement: 1.5)
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

      // 5. Generate JWT tokens
      const tokens = this.tokenService.generateSessionTokens(
        user.id,
        session.id,
        device.id,
      );

      // 6. Send login notification for new devices (Requirement: 1.7)
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

      // 7. Log successful SSO login
      await this.securityLogService.logLoginSuccess(
        user.id,
        command.ipAddress,
        command.userAgent,
        {
          sessionId: session.id,
          deviceId: device.id,
          isNewDevice,
          ssoAuthentication: true,
        },
      );

      // 8. Get user roles and permissions
      const { roles, permissions } = await this.getUserRolesAndPermissions(
        user.id,
      );

      // 9. Build user profile
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
    } catch (error) {
      // Handle errors from SSO module
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new UnauthorizedException(
        `SSO authentication failed: ${error.message}`,
      );
    }
  }

  /**
   * Find existing user or create new one from SSO profile
   */
  private async findOrCreateUser(
    ssoProfile: any,
    _isNewUser: boolean,
  ): Promise<UserEntity> {
    // Try to find existing user by email
    let user = await this.userRepository.findOne({
      where: { email: ssoProfile.email, deletedAt: null },
    });

    if (user) {
      // User exists, update profile if needed
      let updated = false;

      if (ssoProfile.avatar && !user.avatar) {
        user.avatar = ssoProfile.avatar;
        updated = true;
      }

      if (!user.emailVerified) {
        user.emailVerified = ssoProfile.emailVerified || true;
        updated = true;
      }

      if (updated) {
        await this.userRepository.save(user);
      }

      return user;
    }

    // Create new user via IAM module
    const firstName = ssoProfile.firstName || ssoProfile.displayName?.split(" ")[0] || "User";
    const lastName = ssoProfile.lastName || ssoProfile.displayName?.split(" ")[1] || "";

    // Generate a random username from email using cryptographically secure randomness
    const randomSuffix = randomBytes(6).toString("base64url");
    const username = ssoProfile.email.split("@")[0] + "_" + randomSuffix;

    // Get default region
    const defaultRegionId = this.configService.get<string>(
      "DEFAULT_REGION_ID",
      "00000000-0000-0000-0000-000000000001",
    );

    // Get organization ID from SSO profile or use a default
    const organizationId = ssoProfile.organizationId || null;

    // Create user via IAM module (no password needed for SSO users)
    const userId = await this.commandBus.execute(
      new RegisterUserCommand(
        username,
        ssoProfile.email,
        null, // No password for SSO users
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

    // Mark email as verified for SSO users
    user.emailVerified = ssoProfile.emailVerified || true;
    if (ssoProfile.avatar) {
      user.avatar = ssoProfile.avatar;
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
